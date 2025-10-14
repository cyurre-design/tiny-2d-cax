// -------------------------------------------------------
// Command Manager con soporte mixto y compuesto
// -------------------------------------------------------

export class CommandManager {
  constructor(project) {
    this.project = project;
    this.undoStack = [];
    this.redoStack = [];
  }

  executeCommand(command) {
    if (command.execute && command.undo) {
      command.execute(this.project);
      this.undoStack.push(command);
      this.redoStack = [];
      return;
    }

    if (command.commands) {
      // Composite command
      command.execute(this.project);
      this.undoStack.push(command);
      this.redoStack = [];
      return;
    }

    // Automático (snapshot/restore)
    const patches = this.#applyAndDiff(command);
    this.undoStack.push(patches);
    this.redoStack = [];
  }

  #applyAndDiff(command) {
    const target =
      command.scope === "layer"
        ? this.project.layers.get(command.targetId)
        : this.project.shapes.get(command.targetId);

    const before = target.snapshot();
    command.actionFn(target);
    const after = target.snapshot();

    const patch = jsonpatch.compare(before, after);
    const inverse = jsonpatch.compare(after, before);

    return { scope: command.scope, targetId: command.targetId, patch, inverse };
  }

  #applyPatchRecord(record, useInverse) {
    const target =
      record.scope === "layer"
        ? this.project.layers.get(record.targetId)
        : this.project.shapes.get(record.targetId);

    const snapshot = target.snapshot();
    const patch = useInverse ? record.inverse : record.patch;
    const newSnapshot = jsonpatch.applyPatch({ ...snapshot }, patch).newDocument;
    target.restore(newSnapshot);
  }

  undo() {
    if (!this.undoStack.length) return;
    const record = this.undoStack.pop();

    if (record.undo) record.undo(this.project);
    else if (record.commands) record.undo(this.project); // composite
    else this.#applyPatchRecord(record, true);

    this.redoStack.push(record);
  }

  redo() {
    if (!this.redoStack.length) return;
    const record = this.redoStack.pop();

    if (record.execute) record.execute(this.project);
    else if (record.commands) record.execute(this.project); // composite
    else this.#applyPatchRecord(record, false);

    this.undoStack.push(record);
  }
}

// -------------------------------------------------------
// Factories
// -------------------------------------------------------

// Automático
function makeCommand(targetId, scope, actionFn) {
  return { scope, targetId, actionFn };
}

// Explícitos
function makeCreateShapeCommand(type, x, y, layerId) {
  let createdId = null;
  return {
    execute(project) {
      const shape = project.addShape(type, x, y, layerId);
      createdId = shape.id;
    },
    undo(project) {
      if (createdId) project.deleteShape(createdId);
    },
  };
}

function makeDeleteShapeCommand(shapeId) {
  let snapshot = null;
  return {
    execute(project) {
      const shape = project.shapes.get(shapeId);
      if (!shape) throw new Error("Shape inexistente");
      snapshot = shape.toJSON();
      project.deleteShape(shapeId);
    },
    undo(project) {
      const shape = Shape.fromJSON(snapshot);
      project.shapes.set(shape.id, shape);
    },
  };
}

// Composite
function makeCompositeCommand(commands, description = "Composite") {
  return {
    description,
    commands,
    execute(project) {
      for (const cmd of commands) {
        if (cmd.execute) cmd.execute(project);
        else {
          // automático
          const target =
            cmd.scope === "layer"
              ? project.layers.get(cmd.targetId)
              : project.shapes.get(cmd.targetId);
          cmd.before = target.snapshot();
          cmd.actionFn(target);
          cmd.after = target.snapshot();
        }
      }
    },
    undo(project) {
      // deshacer en orden inverso
      [...commands].reverse().forEach(cmd => {
        if (cmd.undo) cmd.undo(project);
        else {
          const target =
            cmd.scope === "layer"
              ? project.layers.get(cmd.targetId)
              : project.shapes.get(cmd.targetId);
          target.restore(cmd.before);
        }
      });
    },
  };
}