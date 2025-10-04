
// ------------------------
// Command Manager con soporte de composite
// ------------------------
class CommandManager {
  constructor(project) {
    this.project = project;
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
    const target = this.project.shapes.get(command.targetId);
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
      const target = this.project.shapes.get(p.targetId);
      jsonpatch.applyPatch(target, p.inverse);
    });

    this.redoStack.push(patches);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const patches = this.redoStack.pop();

    patches.forEach(p => {
      const target = this.project.shapes.get(p.targetId);
      jsonpatch.applyPatch(target, p.patch);
    });

    this.undoStack.push(patches);
  }
}

// ------------------------
// Helpers para comandos
// ------------------------
function makeCommand(targetId, actionFn) {
  return { type: "action", targetId, actionFn };
}

function makeCompositeCommand(commands) {
  return { type: "composite", commands };
}
