import {createHistorySystem} from "./cy-command-manager.js"

let commandManager;
export  function createCommandManager(application, blocks) {
    commandManager = createHistorySystem(application, blocks, { checkpointInterval: 10 });
    return commandManager;
}

/*
{
      type,
      params = {},
      execute,
      undo,
      redo,
      isHeavy = false,
      useSnapshot = false,
      forceCheckpoint = false,
      incremental = false,
      skipRedraw = false,
    }
      */
export function commandLayerCreate (name = undefined, data = undefined) {
    const theCommand = commandManager.makeCommand({
        execute(p, a) {
            this.id = p.addLayer(name || this.name);
            const layer = p.layers.get(this.id);
            this.name = layer.name;
            a.viewer._redrawLayers();
            a.layerView.addLayer(JSON.stringify(layer));
            return layer;
        },
        undo(p, a) {
            if (this.id) p.deleteLayer(this.id);
            a.layerView.deleteLayer(this.name);
        },
    });
    return commandManager.execute(theCommand);
    }

//--------------------------------- COMANDOS BLOCK  -----------------------------
export function commandBlockCreate(blocks){
    const theCommand = commandManager.makeCommand({
      execute(p, a) {
          this.blocks = blocks;
          this.ids = p.addBlocks(undefined, this.blocks); //array...?
          p.draw();
      },
      undo(p, a) {
          if (this.ids) this.ids.forEach(id=>p.deleteBlock(id));
          p.draw();
      },
      });
    commandManager.execute(theCommand);
  }
export function commandBlockDelete(blocks) {
    const theCommand = commandManager.makeCommand({
      execute(p, a) {
          this.blocks = blocks;
          this.blocks.forEach( b => p.deleteBlock(b.id))
          p.draw();
      },
      undo(p, a) {
          if (this.blocks) 
            p.addBlocks(undefined, this.blocks); //array...?
          p.draw();
      },
      });
    commandManager.execute(theCommand);    
  }

  //--------------------- BOCK TRANSLATE, SYMMETRY...
  
  export function commandBlockTransform(blocks, opData){
    const theCommand = commandManager.makeCommand({
    execute(p, a) {
        this.blocks = blocks;
        this.newBlocks = this.blocks.map( b => opData.op(b, ...opData.arg))
        p.addBlocks( undefined, this.newBlocks);
        p.draw();
    },
    undo(p, a) {
        if (this.newBlocks) 
          this.newBlocks.forEach(b=>p.deleteBlock(b.id));
        p.draw();
    }
    });
    commandManager.execute(theCommand);    
    }

    //------------------ CUT ---------------------
export function commandCreateCutPoints(cutPoints){
    const theCommand = commandManager.makeCommand({
    execute(p, a) {
      this.cutPoints = cutPoints;
      if(this.cutPoints){
        p.deselectAll();
        p.addCutPoints(this.cutPoints);
        p.draw();
      }
    },
    undo(p,a){
      p.deleteCutPoints(this.cutPoints);
      //p.draw();
    },
    redo(p,a){
      if(this.cutPoints){
        p.addCutPoints(this.cutPoints);
        //p.draw();
      }
    }})
    commandManager.execute(theCommand);    
  }
