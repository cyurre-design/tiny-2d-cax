

//---------------- revisar
  // deleteShape(id) {
  //   const shape = this.shapes.get(id);
  //   if (!shape) return;
  //   this.shapes.delete(id);
  //   for (const layer of this.layers.values()) {
  //     if (layer.shapes.has(id)) layer.removeShape(id);
  //   }
  // }

  // toJSON() {
  //   return {
  //     name: this.name,
  //     layers: Array.from(this.layers.values()).map(l => l.toJSON()),
  //     nextId: this._nextId,
  //   };
  // }

  // static fromJSON(data) {
  //   const project = new Project(data.name);
  //   project._nextId = data.nextId;
  //   for (const l of data.layers) {
  //     const layer = Layer.fromJSON(l);
  //     project.layers.set(layer.id, layer);
  //     for (const s of layer.shapes.values()) {
  //       project.shapes.set(s.id, s);
  //     }
  //   }
  //   return project;
  // }

// =======================
// Command Manager (monoproyecto)
// =======================
//project sería la base de datos de capas y bloques, y application la aplicación, para acceder a comandos de actualización de pantalla, etc...
export class CommandManager {
  constructor(project, application) {
    this.project = project;
    this.app = application;
    this.undoStack = [];
    this.redoStack = [];
  }

  executeCommand(command) {
    const ret = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    return ret;
  }

  undo() {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo() {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    const ret = cmd.execute();
    this.undoStack.push(cmd);
    return ret;
  }

  makeCommand(spec) {
    const project = this.project;
    const app = this.app;

    if (Array.isArray(spec)) {
      return {
        execute: () => spec.forEach(c => c.execute()),
        undo: () => [...spec].reverse().forEach(c => c.undo()),
      };
    }

    if (spec.targetId && spec.actionFn) {
      const { targetId, scope = "block", actionFn } = spec;
      return {
        execute() {
          const target =
            scope === "layer" ? project.layers.get(targetId) : project.blocks.get(targetId);
          this.before = target.save();
          actionFn(target);
          this.after = target.save();
        },
        undo() {
          const target =
            scope === "layer" ? project.layers.get(targetId) : project.blocks.get(targetId);
          if (this.before) target.restore(this.before);
        },
      };
    }

    if (typeof spec.execute === "function" && typeof spec.undo === "function") {
      return {
        execute: () => spec.execute(project, app),
        undo: () => spec.undo(project, app),
      };
    }

    throw new Error("Formato de comando no reconocido");
  }
}
/* 
// =======================
// Ejemplo de uso
// =======================

// Crear un proyecto
const project = new Project("Demo CAD");
const layer = project.addLayer("Capa1", "#ff0000");

// Crear el CommandManager
const manager = new CommandManager(project);

// Crear una figura
const createCmd = manager.makeCommand({
  execute(p) {
    const shape = p.addShape("Circle", 10, 10, 5, layer.id);
    this.id = shape.id;
  },
  undo(p) {
    if (this.id) p.deleteShape(this.id);
  },
});

manager.executeCommand(createCmd);

// Mover figura
const moveCmd = manager.makeCommand({
  targetId: createCmd.id,
  actionFn: s => s.move(20, 0),
});
manager.executeCommand(moveCmd);

// Deshacer/Rehacer
manager.undo(); // deshace movimiento
manager.redo(); // rehace movimiento

// Serializar proyecto
const saved = JSON.stringify(project.toJSON(), null, 2);
console.log(saved);

// Cargar desde JSON
const loaded = Project.fromJSON(JSON.parse(saved));
console.log("Proyecto restaurado:", loaded);
 */