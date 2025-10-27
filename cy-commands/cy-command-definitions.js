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
   