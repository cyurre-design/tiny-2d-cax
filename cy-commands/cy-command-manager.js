/* App (entorno global)
 ├── Model (datos geométricos)
 ├── History (control de estado y comandos)
 │    ├── makeCommand(...)
 │    ├── execute(...)
 │    ├── undo(), redo()
 │    ├── createCheckpoint(), restoreCheckpoint()
 │    └── registro de comandos (para scripting)
 └── UI / Renderer (usa eventos o callbacks de app) */

// ============================================================
// 🔧 UTILIDADES BASE
// ============================================================
function replacer(key, value) {
  if (value instanceof Map) return { __type: "Map", value: Array.from(value.entries()) };
  if (typeof value === "function") return undefined;
  return value;
}

function reviver(key, value) {
  if (value && value.__type === "Map") return new Map(value.value);
  return value;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj, replacer), reviver);
}

// Comparación simple: diff incremental
function diffModels(prev, next) {
  const added = [], changed = [], removed = [];
  for (const [id, e] of next.entities) {
    if (!prev.entities.has(id)) added.push(e);
    else {
      const old = prev.entities.get(id);
      if (JSON.stringify(old) !== JSON.stringify(e)) changed.push(e);
    }
  }
  for (const [id] of prev.entities) if (!next.entities.has(id)) removed.push(id);
  return { added, changed, removed, nextId: next.nextId };
}

function applyDiff(model, diff) {
  for (const id of diff.removed) model.entities.delete(id);
  for (const e of diff.added) model.entities.set(e.id, e);
  for (const e of diff.changed) model.entities.set(e.id, e);
  model.nextId = diff.nextId;
}

// ============================================================
// 🧠 SISTEMA DE HISTORIAL
// ============================================================
export function createHistorySystem( model, app, options = {}) {
  const {
    checkpointInterval = 10,
    autoRedraw = true, // comportamiento por defecto
  } = options;

  const undoStack = [];
  const redoStack = [];
  const checkpoints = [];
  const commandRegistry = new Map();
  let commandCount = 0;

  function snapshot() {
    return JSON.stringify(model, replacer);
  }

  function restoreSnapshot(json) {
    const restored = JSON.parse(json, reviver);
    model.entities = restored.entities;
    model.nextId = restored.nextId;
  }

  function createCheckpoint(label = null, incremental = false) {
    const base = checkpoints.length
      ? JSON.parse(checkpoints[checkpoints.length - 1].snapshot, reviver)
      : null;

    const data = {
      label,
      timestamp: Date.now(),
      snapshot: snapshot(),
      diff: incremental && base ? diffModels(base, model) : null,
      incremental,
    };

    checkpoints.push(data);
    if (app?.onCheckpoint) app.onCheckpoint(data);
  }

  // ============================================================
  // 🧩 FACTORY DE COMANDOS
  // ============================================================
  function makeCommand(def) {
  const {
    type,
    params = {},
    execute,
    undo,
    redo, // opcional
    isHeavy = false,
    useSnapshot = false,
    forceCheckpoint = false,
    incremental = false,
    skipRedraw = false,
  } = def;

  if (typeof execute !== "function") {
    throw new Error(`Comando '${type}' requiere una función 'execute'`);
  }

  const cmd = {
    type,
    params,
    isHeavy,
    useSnapshot,
    forceCheckpoint,
    incremental,
    skipRedraw,

    execute(model, app) {
      execute.call(this, model, app, params);
    },

    undo(model, app) {
      if (undo) undo.call(this, model, app, params);
    },
  };

  // Solo añadimos `redo` si realmente se ha pasado una función
  if (typeof redo === "function") {
    cmd.redo = function (model, app) {
      redo.call(this, model, app, params);
    };
  }

  return cmd;
}

  function registerCommand(name, factoryFn) {
    commandRegistry.set(name, factoryFn);
  }

  function create(name, params) {
    const factory = commandRegistry.get(name);
    if (!factory) throw new Error(`Comando no registrado: ${name}`);
    return makeCommand(factory(params));
  }

  // ============================================================
  // ⚙️ EJECUCIÓN Y CONTROL
  // ============================================================
  function execute(cmd) {
    if (cmd.forceCheckpoint) createCheckpoint(`before-${cmd.type}`, cmd.incremental);

    if (cmd.isHeavy || cmd.useSnapshot) cmd.snapshotBefore = snapshot();

    cmd.execute(model, app);
    undoStack.push(cmd);
    redoStack.length = 0;
    commandCount++;

    if (cmd.isHeavy || cmd.useSnapshot) cmd.snapshotAfter = snapshot();

    if (commandCount % checkpointInterval === 0) createCheckpoint("auto", cmd.incremental);

    if (autoRedraw && !cmd.skipRedraw) app?.redraw?.();
  }

  function undo() {
    const cmd = undoStack.pop();
    if (!cmd) return;

    if (cmd.isHeavy && cmd.snapshotBefore) restoreSnapshot(cmd.snapshotBefore);
    else cmd.undo(model, app);

    redoStack.push(cmd);
    if (autoRedraw && !cmd.skipRedraw) app?.redraw?.();
  }

  function redo() {
    const cmd = redoStack.pop();
    if (!cmd) return;

    if (cmd.isHeavy && cmd.snapshotAfter) restoreSnapshot(cmd.snapshotAfter);
    else cmd.redo ? cmd.redo(model, app) : cmd.execute(model, app);

    undoStack.push(cmd);
    if (autoRedraw && !cmd.skipRedraw) app?.redraw?.();
  }

  function restoreLastCheckpoint() {
    if (!checkpoints.length) return;
    const last = checkpoints[checkpoints.length - 1];
    if (last.incremental && last.diff) {
      const base = checkpoints.find(c => !c.incremental);
      if (base) {
        restoreSnapshot(base.snapshot);
        applyDiff(model, last.diff);
      }
    } else {
      restoreSnapshot(last.snapshot);
    }
    app?.redraw?.();
  }

  function saveHistory() {
    return JSON.stringify({ model, undoStack, redoStack, checkpoints }, replacer, 2);
  }

  function loadHistory(jsonText) {
    const data = JSON.parse(jsonText, reviver);
    model.entities = data.model.entities;
    model.nextId = data.model.nextId;
    undoStack.length = 0;
    redoStack.length = 0;
    checkpoints.length = 0;
    undoStack.push(...data.undoStack);
    redoStack.push(...data.redoStack);
    checkpoints.push(...data.checkpoints);
    app?.redraw?.();
  }

  return {
    app,
    model,
    execute,
    undo,
    redo,
    makeCommand,
    registerCommand,
    create,
    createCheckpoint,
    restoreLastCheckpoint,
    saveHistory,
    loadHistory,
    getModel: () => model,
    listCheckpoints: () => checkpoints.map(c => ({ label: c.label, time: c.timestamp })),
  };
}


