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

// Comparación simple: diff incremental
// function diffModels(prev, next) {
//   const added = [], changed = [], removed = [];
//   for (const [id, e] of next.entities) {
//     if (!prev.entities.has(id)) added.push(e);
//     else {
//       const old = prev.entities.get(id);
//       if (JSON.stringify(old) !== JSON.stringify(e)) changed.push(e);
//     }
//   }
//   for (const [id] of prev.entities) if (!next.entities.has(id)) removed.push(id);
//   return { added, changed, removed, nextId: next.nextId };
// }

// function applyDiff(model, diff) {
//   for (const id of diff.removed) model.entities.delete(id);
//   for (const e of diff.added) model.entities.set(e.id, e);
//   for (const e of diff.changed) model.entities.set(e.id, e);
//   model.nextId = diff.nextId;
// }

// ============================================================
//  SISTEMA DE HISTORIAL
// ============================================================
export function createHistorySystem(model, app, options = {}) {
    const { checkpointInterval = 10 } = options;

    const undoStack = [];
    const redoStack = [];
    //const checkpoints = [];
    let commandCount = 0;

    // function snapshot() {
    //   return JSON.stringify(model);
    // }

    // function restoreSnapshot(json) {
    //   const restored = model.deserialize(JSON.parse(json));
    // }

    // function createCheckpoint(label = null, incremental = false) {
    //   const base = checkpoints.length
    //     ? JSON.parse(checkpoints[checkpoints.length - 1].snapshot, reviver)
    //     : null;

    //   const data = {
    //     label,
    //     timestamp: Date.now(),
    //     snapshot: snapshot(),
    //     diff: incremental && base ? diffModels(base, model) : null,
    //     incremental,
    //   };

    //   checkpoints.push(data);
    //   if (app?.onCheckpoint) app.onCheckpoint(data);
    // }

    // ============================================================
    // FACTORY DE COMANDOS
    // ============================================================
    function makeCommand(def) {
        const {
            type,
            params = {},
            execute,
            undo,
            redo, // opcional
            forceCheckpoint = false,
            incremental = false,
        } = def;

        if (typeof execute !== "function") {
            throw new Error(`Comando '${type}' requiere una función 'execute'`);
        }

        const cmd = {
            type,
            params,
            forceCheckpoint,
            incremental,

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

    // ============================================================
    // EJECUCIÓN Y CONTROL
    // ============================================================
    function execute(cmd) {
        if (cmd.forceCheckpoint) createCheckpoint(`before-${cmd.type}`, cmd.incremental);

        cmd.execute(model, app);
        undoStack.push(cmd);
        redoStack.length = 0;
        commandCount++;

        if (commandCount % checkpointInterval === 0) createCheckpoint("auto", cmd.incremental);
    }

    function undo() {
        const cmd = undoStack.pop();
        if (!cmd) return;

        cmd.undo(model, app);

        redoStack.push(cmd);
    }

    function redo() {
        const cmd = redoStack.pop();
        if (!cmd) return;

        cmd.redo ? cmd.redo(model, app) : cmd.execute(model, app);

        undoStack.push(cmd);
    }

    // function restoreLastCheckpoint() {
    //   if (!checkpoints.length) return;
    //   const last = checkpoints[checkpoints.length - 1];
    //   if (last.incremental && last.diff) {
    //     const base = checkpoints.find(c => !c.incremental);
    //     if (base) {
    //       restoreSnapshot(base.snapshot);
    //       applyDiff(model, last.diff);
    //     }
    //   } else {
    //     restoreSnapshot(last.snapshot);
    //   }
    //   app?.redraw?.();
    // }

    // function saveHistory() {
    //   return JSON.stringify({ model, undoStack, redoStack, checkpoints }, replacer, 2);
    // }

    // function loadHistory(jsonText) {
    //   const data = JSON.parse(jsonText, reviver);
    //   model.entities = data.model.entities;
    //   model.nextId = data.model.nextId;
    //   undoStack.length = 0;
    //   redoStack.length = 0;
    //   checkpoints.length = 0;
    //   undoStack.push(...data.undoStack);
    //   redoStack.push(...data.redoStack);
    //   checkpoints.push(...data.checkpoints);
    //   app?.redraw?.();
    // }

    return {
        app,
        model,
        execute,
        undo,
        redo,
        makeCommand,
        //createCheckpoint,
        //restoreLastCheckpoint,
        //saveHistory,
        //loadHistory,
        //getModel: () => model,
        //listCheckpoints: () => checkpoints.map(c => ({ label: c.label, time: c.timestamp })),
    };
}
