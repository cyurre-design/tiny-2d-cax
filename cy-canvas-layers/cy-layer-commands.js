
import  "../fast-json-patch.js";


export function makeCommand(targetId, actionFn) {
  return { type: "action", targetId, actionFn };
}
export function makeCompositeCommand(commands) {
  return { type: "composite", commands };
}


export class CommandManager {
  constructor(shapes) {
    this.shapes = shapes;
    this.undoStack = [];
    this.redoStack = [];
  }

  executeCommand(command) {
    let patches = [];

    if (command.type === "action") {
      patches.push(this.#applyAndDiff(command));
    }

    if (command.type === "composite") {
      const subPatches = command.commands.map(cmd => this.#applyAndDiff(cmd));
      patches.push(...subPatches);
    }

    this.undoStack.push(patches);
    this.redoStack = [];
  }

  #applyAndDiff(command) {
    const target = this.shapes.find(s => s.id === command.targetId);
    const before = JSON.parse(JSON.stringify(target));

    command.actionFn(target);

    const after = JSON.parse(JSON.stringify(target));
    const patch = jsonpatch.compare(before, after);
    const inverse = jsonpatch.compare(after, before);

    return { targetId: command.targetId, patch, inverse };
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const patches = this.undoStack.pop();

    [...patches].reverse().forEach(p => {
      const target = this.shapes.find(s => s.id === p.targetId);
      jsonpatch.applyPatch(target, p.inverse);
    });

    this.redoStack.push(patches);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const patches = this.redoStack.pop();

    patches.forEach(p => {
      const target = this.shapes.find(s => s.id === p.targetId);
      jsonpatch.applyPatch(target, p.patch);
    });

    this.undoStack.push(patches);
  }
}


export class HistoryWithCheckpoints {
  constructor(shapes, checkpointInterval = 10) {
    this.shapes = shapes;
    this.undoStack = [];
    this.redoStack = [];
    this.checkpointInterval = checkpointInterval;
  }

  executeCommand(command) {
    command.execute(this.shapes);

    const entry = {
      command,
      snapshot: null
    };

    // ¿Es momento de guardar un snapshot completo?
    if ((this.undoStack.length + 1) % this.checkpointInterval === 0) {
      entry.snapshot = snapshotModel(this.shapes); // guardamos estado global
    }

    this.undoStack.push(entry);
    this.redoStack = []; // reiniciar pila redo
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const entry = this.undoStack.pop();
    entry.command.undo(this.shapes);
    this.redoStack.push(entry);
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const entry = this.redoStack.pop();
    entry.command.execute(this.shapes);
    this.undoStack.push(entry);
  }

  exportHistory() {
    return JSON.stringify(
      this.undoStack.map(entry => ({
        command: JSON.parse(entry.command.toJSON()),
        snapshot: entry.snapshot
      }))
    );
  }

  importHistory(json) {
    const data = JSON.parse(json);
    this.undoStack = data.map(entry => ({
      command: commandFromJSON(entry.command, this.shapes),
      snapshot: entry.snapshot
    }));
    this.redoStack = [];
  }

  restoreAt(index) {
    if (index < 0 || index >= this.undoStack.length) return;

    // buscar el último checkpoint antes o en `index`
    let checkpointIndex = -1;
    for (let i = index; i >= 0; i--) {
      if (this.undoStack[i].snapshot) {
        checkpointIndex = i;
        break;
      }
    }

    if (checkpointIndex === -1) {
      // no hay checkpoint → restaurar desde estado inicial
      restoreModel(this.shapes, snapshotModel([]));
    } else {
      restoreModel(this.shapes, this.undoStack[checkpointIndex].snapshot);
    }

    // reproducir los parches desde el checkpoint hasta index
    for (let i = checkpointIndex + 1; i <= index; i++) {
      this.undoStack[i].command.execute(this.shapes);
    }
  }
}




