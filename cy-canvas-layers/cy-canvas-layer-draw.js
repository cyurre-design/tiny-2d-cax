"use strict";
import CyCanvasLayer from './cy-canvas-layer.js';
import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import { checkBbox, insideBbox }  from '../cy-geometry/cy-geometry-library.js';
//import {createDrawElement }  from '../cy-geometry/cy-geometry-basic-elements.js';
//import {CyDataLayer, canvasCSS} from './cy-data-layer.js';
import {getPathFromBlocks} from './cy-elements-to-canvas.js'
import {Path} from '../cy-geometry/cy-geo-elements/cy-path.js'
import {Polygon} from '../cy-geometry/cy-geo-elements/cy-polygon.js'
import {Circle} from '../cy-geometry/cy-geo-elements/cy-circle.js'
import {Segment} from '../cy-geometry/cy-geo-elements/cy-segment.js'
import {Arc} from '../cy-geometry/cy-geo-elements/cy-arc.js'
import { CommandManager} from './cy-layer-commands.js'


export const canvasCSS = {
    pathColor: 'green',
    pathWidth: 2,
    selectedColor: 'yellow',
    selectedWidth: 3,
    printColor: 'black',
    printWidth: 2,
    pointDimension : 3
}

class layerStyle{
    constructor( pathColor= 'green', pathWidth= 2, selectedColor= 'yellow', selectedWidth= 3, printColor= 'black', printWidth= 2, pointDimension = 3){
        this.pathColor=     pathColor;
        this.pathWidth=     pathWidth;
        this.selectedColor= selectedColor;
        this.selectedWidth= selectedWidth;
        this.printColor =   printColor;
        this.printWidth =   printWidth;
        this.pointDimension= pointDimension;
    }
    static default = ()=> new layerStyle();
    toJSON(){
        return this;
    }
    fromJSON(data){ return new layerStyle(data);

    }
}
// ------------------------
// Modelo Layer
// ------------------------
class Layer {
  constructor(id, name, style = layerStyle.default(), visible = true) {
    this.id = id;
    this.name = name;
    this.style = style;
    this.visible = visible;
    this.blocks = new Set(); // ids de shapes asignados a esta capa
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      style: this.style,
      visible: this.visible,
      blocks: [...this.blocks],
    };
  }

  static fromJSON(data) {
    const layer = new Layer(data.id, data.name, data.style, data.visible);
    layer.blocks = new Set(data.blocks);
    return layer;
  }

}
//Heredo de layer genérica que me da los métodos de borrado, etc...
//29-09-25 La gestión de undo, redo, etc... se enmorralla bastante con las capas en varios sets
//Probamos a que la capa sea un atributo de cada elemento, path, etc...
export default class CyCanvasLayerDraw extends CyCanvasLayer {
/**
 * @constructor
 * El canvasLayerDraw aglutina la gestión de capas y comandos geométricos, selección, etc..
 * Creamos 3 maps por conveniencia
 *  1 para los bloques (entidades geométricas) propiamente dichos
 *  2 para los puntos relevante de dichos elementos
 *  3 para gestionar las capas
 *  En cada capa se almacena un id con el set de elementos (bloques) ue se supone que están en esa capa
 *  se guardan los ids que permiten recuperarlos en el map de bloques
 *  Como id usamos un simple contador 
 * Además, para la gesti´n de selección o proximidad geométrica creamo un RBush para cada elemento y sus puntos
 *  esperando que el rendimiento mejore al buscar puntos relevantes próximos 
 */
    constructor() {
        super('draw');
    this.blocks = new Map();       // id -> Block
    this.points = new Map();        // id -> point
    this.layers = new Map();       // layerId -> Set(shapeIds)
    this._activeLayerId = undefined;
    //auxiliar para selección
    this.selectData = {
        hoveredBlocks: undefined
    }
    this.nextBlockId = 1;
    this.nextLayerId = 1;
    //gestión de RBUSH 
    this.pointsTree = new RBush();
    this.blocksTree = new RBush();
    }

    createStyle() {
        return`
        <style>
        
        #draw-layer{
            display:block;
            overflow: hidden;
            position: absolute;
            left: 0px;
            top:0px;
            width: 100%;
            height: 100%;
        }

            div{            width: 100%;
            height: 100%;
}
        </style>
        `
    }
    //Atención al orden de los canvas. Para que los eventos de mouse lleguen a draw, tiene que estar encima
    connectedCallback(){
        super.connectedCallback();
        const style = getComputedStyle(this);
        this.pathWidth = +style.getPropertyValue('--path-width') || 2;
        this.pathColor = style.getPropertyValue('--path-color') || 'green';
        this.selectedWidth = +style.getPropertyValue('--selected-width') || 2;
        this.selectedColor = style.getPropertyValue('--selected-color') || 'yellow';

        this.addEventListener('symmetry', (evt)=>
            this.symmetrySelected(evt.detail.mode, evt.detail.data));
        //Voy a probar a extender las clases geométricas con los métodos de dibujo
        Circle.prototype.getRelevantPoints  = function(){ return [{x0:this.cx, y0:this.cy, id:this.id}]};
        Segment.prototype.getRelevantPoints = function(){ return [{x0:this.x0, y0:this.y0, id:this.id},{x0:this.x1, y0:this.y1, id:this.id}]};
        Polygon.prototype.getRelevantPoints = function(){ return [{x0:this.cx, y0:this.cy, id:this.id}].concat(this.segments.map(p=>({x0:p.x0, y0:p.y0, id:this.id})))};
        Arc.prototype.getRelevantPoints     = function(){ return [{x0:this.cx, y0:this.cy, id:this.id},{x0:this.x1, y0:this.y1, id:this.id},{x0:this.x2, y0:this.y2, id:this.id}]};
        Path.prototype.getRelevantPoints    = function(){ return (this.elements.map(el=>el.getRelevantPoints())).flat()};
        // Gestión de do , undo , redo...
        this.history = new CommandManager();
    }
    // disconnectedCallback(){
    //     //Aquí hay que quitar los listeners siendo formales
    //     super.disconnectedCallback();
    // }
    // static get observedAttributes(){
    //     return(super.observedAttributes);
    // }   
    // attributeChangedCallback(name, oldVal, newVal){
    //     super.attributeChangedCallback(name, oldVal, newVal);
      //this[name] = typeof(this.name) === ''? +newValue: newValue;
    //   switch(name){
    //     case '':
    //       break;
    //     default:break;
    //   }
//    }

//-------------------- Creación de elementos y gestión de id y 
/**
 * 
 * @param {string} name el nombre de la capa (que puede ser generado automáticamente)
 * @param {*} style valore de color para pintar los bloques. Se deberán guardar
 * @returns la referencia a la capa recién creada
 * @todo no crear si ya existe
 * @todo definir clase o similar (serializable) para el estilo de pintada en canvas
 */
    addLayer(name, style = layerStyle.default()) {
        const lyId = `L${this.nextLayerId++}`;
        const layer = new Layer(lyId, name, style, true);
        this.layers.set(lyId, layer);
        this.dispatchEvent(new CustomEvent('new-layer', {bubbles: true, composed:true, detail:{name:name}})); 
        this._activeLayerId = lyId;
        return lyId;
    }
/**
 * 
 * @param {id} layerId el id de la capa a eliminar, pero no su contenido
 * @todo preguntar si realmente se quiere borrar !!! atton, al undo
 * además se podrían pasar los elementos a otra capa provisional?
 */
    removeLayer(layerId) {
        this.layers.delete(layerId);
    // shapes siguen existiendo pero pueden quedar "huérfanos"
    // → según diseño, podrías eliminarlos o moverlos a "default"
    }
/**
 * 
 * @param {string} name nombre de la capa
 * @returns LyId de la capa o undefined si no existe
 */
    findLayerByName(name){
        for (const [lyId, layer] of this.layers.entries()){
            if(name === layer.name) return lyId;
        }
        return undefined;
    }
/**
 * 
 * @param {string} name 
 * @param {boolean} visible 
 */    
    setVisible(name, visible) {
        let lyId = this.findLayerByName(name);
        if(lyId !== undefined){
            this.layers.get(lyId).visible = visible;
        }
        this.draw();
    }
/**
 * 
 * @param {string} name 
 * @returns boolean si existe o undefined si no existe
 */
    isVisible(name) {
        let lyId = this.findLayerByName(name);
        if(lyId !== undefined){
            return this.layers.get(lyId).visible;
        }
        return undefined;
    }
// ------------------------
//    addShape(type, x, y, layerId) {
//     if (!this.layers.has(layerId)) throw new Error(`Layer ${layerId} no existe`);
//     const id = String(this.nextShapeId++);
//     const shape = new Shape(id, type, x, y, layerId);
//     this.shapes.set(id, shape);
//     this.layers.get(layerId).shapes.add(id);
//     return shape;
//   }
    // addBlocksToActiveLayer(blocks){
    //     if(blocks === undefined)
    //         console.log('tipo de bloque no visualizzable');
    //     if(!this._activeLayer) return;
    //     this._activeLayer.addBlocks(blocks);
    //     //this._activeLayer.addPoints(blocks);
    //     this.draw();
    // }
    //No creo la capa de forma automática!!

/**
 * 
 * @param {array} points array de objetos con propiedades x0,y0,id
 * Se inseran en un RBush para mejorar búsqueedas de puntos cercanos, etc...
 */
    _addPointsToTree(points){
        points.forEach(p => this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id}));
    }
/**
 * 
 * @param {string} layerId el id de la capa en el Map  de capas
 * @param {array} paths 
 * @returns 
 */
    addBlocks(layerId = this._activeLayerId, paths){  //pueden ser circles o polygons también...
        if(paths === undefined) {console.log('tipo de bloque no visualizzable'); return;}
        let ps = Array.isArray(paths)?paths:[paths];
        //Primero pongo la info de pintar y un id, importante. La parte del tree es de alguna manera opcional
        ps.forEach(b=>{
            if((b.type !== 'point') && (b.type!=='cut-point')){
                b.id = this.nextBlockId++;                  //id de bloque
                b.layerId = layerId;
                b.canvasPath = getPathFromBlocks(b);
                //No merece la pena, mejor cada layer un color (varios según estado, etc...)
                //b.style = Object.assign({}, layer.style);     //copia, para poder tocarlos de forma independiente
                this.blocks.set(b.id, b);                   //La mete en el map de bloques


                this.layers.get(b.layerId).blocks.add(b.id);    //la mete en el map de la capa que sea
                this.blocksTree.insert({minX:b.bbox.x0,minY:b.bbox.y0,maxX:b.bbox.x1,maxY:b.bbox.y1, id:b.id})
                //gestión de sus puntos
                const points = b.getRelevantPoints();
                points.forEach(p=>{ 
                    p.bid = b.id;   //para saber a qué bloque pertenece el punto 
                    p.id = this.nextBlockId++; //el id que estamos poniendo es el del bloque, en getRelevantPoints
                    p.type = 'point';
                    p.canvasPath = getPathFromBlocks([p], this.pointDimension);
                    p.style = this.style;       //TODO no sé si hace falta por cómo se gestionan luego...
                    this.points.set(p.id, p);    //Al map 
                    this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id});    //Al tree para buscar rápido
                })
            }
        })
    }
    /**
     * 
     * @param {Number} id obtenido por interacción, selecci´on, etc...
     * @returns block borrado, @todo porque si no sirve mejor quitarlo
     */
    removeBlock(id) {
        //Hay que quitarlo del árbol!!!! Parece que hay un error, uso un hack de un blog
        this.blocksTree.remove(  {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, id:id }, (a, b) => a.id === b.id)
        //lo quito del map de bloques
        const block = this.blocks.get(id);
        this.blocks.delete(id);
        //Lo busco y lo quito de su capa
        const layer = this.layers.get(block.layerId);
        layer.delete(block.id);
        return block; //??
    }
    /**
     * 
     * @param {Number} blockId 
     * @param {Number} newLayerId 
     * @returns nothing
     */
    moveBlockToLayer(blockId, newLayerId) {
        const block = this.blocks.get(blockId);
        if (!block) return;
        if (!this.layers.has(newLayerId)) throw new Error(`Layer ${newLayerId} no existe`);
        // quitar de la capa antigua
        this.layers.get(block.layerId)?.block.delete(blockId);
        // asignar nueva capa
        block.layerId = newLayerId;
        this.layers.get(newLayerId).blocks.add(blockId);
    }
    /**
     * 
     * @param {Number} layerId 
     * @returns array of blocks (referencias a sus bloques)
     * Se necesita hacer así porque todos los bloques de todas las capas está en un solo Map
     */
    getBlocksInLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (!layer) return [];
        return [...layer.blocks].map(id => this.blocks.get(id));
    }
    setActiveLayerId(name){
        const lyId = this.findLayerByName(name);
        if(lyId)
            this._activeLayerId = lyId;
        return this._activeLayerId;
    }
    // dataLayerAdd(name){
    //     let ly = this.findLayerByName(name);
    //     if(ly === undefined){
    //         ly = new CyDataLayer(this, name, canvasCSS);
    //         this.dataLayers.push(ly);
    //         this._activeLayer = ly;
            
    //     }
    //     return(ly);
    // }
    //TODO : Los cuts podrían ser intercapas, así que no llevan layerId
    //Y por otra parte pertenecen a 2 bloques, ... igual son eternos 
    addCutPoints( points){ //estos ya vienen pretratados
        if(!points) console.log('puntos?'); //esto debe tratar el indefinido, el no array y el longitud 0
        points.forEach(p=>{
            p.canvasPath = getPathFromBlocks([p], this.pointDimension);
            p.style = this.style;
            p.id = this.nextBlockId++;
            this.points.set(p.id, p);
            this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id});    //Al tree para buscar rápido
        });
        this.draw();
    }
//--------------Gestión de RBush y cercanía al ratón------------------
    //No miro por capas, si hace falta se filtra por layerId posteriormente
    scaleChange(scale){
        this.scale = scale;
        this.resolution = scale / 10; //settings, TODO
    }
    getNearestPoint(x,y,w){
        //Miro si estamos cerca de un punto destacado (un centro, etc...), cojo solo el primero, dejo la gestión al usuario y el ratón
        const ps = this.pointsTree.search({minX:x -w, maxX: x+w, minY: y -w, maxY: y+w});
        //Si estamos cerca nos ponemos en él
        if(ps.length > 0){//y si estamos mirando puntos, sería
            const p = this.points.get(ps[0].id);
            p.type = 'cut-point'; //para modificar cómo se pinta TODO
            return p;
        }
        const s = this.resolution; 
        return {type:'point', x0:s*Math.round(x/s), y0:s*Math.round(y/s)};
    }
    //Salgo en el primero pero se prepara para varios
    getNearestBlock(x, y, w){
        const p = position2pixels({x:x,y:y})
        this.ctx.lineWidth = scalePixels2mm(w); //Esto son pixels, iría en settings o así TODO
        for (const [id, block] of this.blocks.entries()){
            if(this.ctx.isPointInStroke(b.canvasPath, p.x, p.y)){
                return block;
            } 
        }
        return undefined;
    }
    getBBox(){  //forEach funciona en maps
        let bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
        this.blocks.forEach(b => bbox = checkBbox(bbox, b.bbox));
        return(bbox);
    }
    getBlocksInsideBox(box){ //la search funciona en rbushes
        const bboxes = this.blocksTree.search({minX:box.x0, maxX: box.x1, minY: box.y0, maxY: box.y1})
        return bboxes.map(box => this.blocks.get(box.id))
    }
//--------------- Selección, deselección...  ------------------------------
//Seguimos la misma filosofía de buscar todo y en su caso filtrar
    hover( x, y, box, select = false){
        let blocks;
        if(this.selectData.hoveredBlocks)
            this.selectData.hoveredBlocks.forEach(b => b.hover = false);       
        if(box)
            blocks = this.getBlocksInsideBox(box);
        else
            blocks = this.getNearestBlock(x, y, 5);
        if(blocks && blocks.length > 0){
            if(select){
                blocks.forEach(b => b.selected = b.selected? false : true);
            } else {
                blocks.forEach(b => b.hover = true);
                this.selectData.hoveredBlocks = blocks;
            }
        }
        this.draw();
        return(blocks );
    }
    //TODO ver si se pasa el layer por name o por id... de momento, undefined = all
    //Estos son COMANDOS, sobre todo el delete!!!
    selectAll(layer){
        //const targetLayers = layer? [layer] : this.dataLayers;
        this.blocks.forEach( p => p.selected = true);
        this.draw();
    }
    deselectAll(layer){
        //const targetLayers = layer? [layer] : this.dataLayers;
        this.blocks.forEach(p => p.selected = false);
        this.draw();
    }
    invertSelection(layer){ 
        //const targetLayers = layer? [layer] : this.dataLayers;
        this.blocks.forEach( p => p.selected = p.selected? false : true);
        this.draw();
    }
    deleteSelection(layer){
       // const targetLayers = layer? [layer] : this.dataLayers;
        //const deleted = {};
        for (const [id, block] of this.blocks.entries()){
            if(block.selected){
                //deleted.push(block);
                this.removeBlock(id);
            }
        }
        this.draw();
        //return deleted;
    }
    getSelectedPaths(layer){
        //const targetLayers = layer? [layer] : this.dataLayers;
        const blocks = [];
        for (const [id, block] of this.blocks.entries()){
            if(block.selected)
                blocks.push(block)
        }
        const paths = getPathFromBlocks(blocks);
        return paths;
    }
    getSelectedBlocks(layer){
        //const targetLayers = layer? [layer] : this.dataLayers;
        const blocks = [];
        for (const [id, block] of this.blocks.entries()){
            if(block.selected)
                blocks.push(block)
        }
        return blocks;
    }




    //FUNCIONES DE DRAW, DATA LAYERS
    serialice(){
        let out = '[';
        this.dataLayers.forEach(ly => out += ly.serialice()); 
        out = out.slice(0,-1) + ']';
        console.log (out);
    }
    deserialice(file){
    //Aquí debe llegar el texto del fichero, que está en JSON
        const rawLayers = JSON.parse(file);
        rawLayers.forEach(ly => {
            const newLayer = this.addLayer(ly.name);
            newLayer.addBlocks(deserialize(ly.blocks));
        })   
    }

    //El nombre sería transfer o así, pero ya...
    //Es un comando morralla porque implica que todos los árboles hay que rehacerlos...
    //Al final no se sabe si se optimiza o pesimiza...
    translate(x,y){
        this.dataLayers.forEach(ly => ly.translate(x,y))
    }

    //Entre setExtents y getBBox apañan las relaciones de tamaño...
    // setExtents(extents) {
    //     const scale = scaleMm2pixels(1);
    //     const offset = position2pixels({x:0, y:0});
    //     this.drawCanvasLayer.ctx.setTransform(scale, 0, 0, -scale, offset.x, offset.y);
    //     //this.draftCanvasLayer.ctx.setTransform(scale, 0, 0, -scale, offset.x, offset.y);

    //     this.drawCanvasLayer.extents = extents;
    //     //this.draftCanvasLayer.extents = extents;
    // }
    //Redibujado del canvas con varios colores :
    //Primero los seleccionados y luego los que no, en función de su estado 
    //NO es un redraw, no se recalculan los paths2D !!!!
    //Aunque los paths tienen la propiedad de color, width... la herdan de layer TODO
    //layer, aquí, es un CyDataLayer
    // _drawCanvasLayer(layer){
    //     if(layer.blocks.size > 0){
    //         if(layer.visible){
    //             const ctx = layer.canvasLayer.ctx;  // === this.dataLayerDraft? this.draftCanvasLayer.ctx:this.drawCanvasLayer.ctx
    //             layer.blocks.forEach(p=>{
    //                 ctx.lineWidth = scalePixels2mm(p.selected?+p.style.selectedWidth:+p.style.pathWidth);
    //                 ctx.strokeStyle = (p.selected)?p.style.selectedColor:(p.hover)?p.style.selectedColor:p.style.pathColor;
    //                 ctx.stroke(p.canvasPath);
    //             });
    //         }
    //     } 
    // }
    draw() {
        this.clear();
        //Hacemos que el estilo sea por capa y estado en vez de por path
/**@todo pintar por capas para mejorar rendimiento?? */
        this.blocks.forEach( p => {
            let ly = this.layers.get(p.layerId);
            if(ly.visible){
                this.ctx.lineWidth = scalePixels2mm(p.selected?+ly.style.selectedWidth:+ly.style.pathWidth);
                this.ctx.strokeStyle = (p.selected)?ly.style.selectedColor:(p.hover)?ly.style.selectedColor:ly.style.pathColor;
                this.ctx.stroke(p.canvasPath);
            }
        })
        return;
    }


    //La gestión cambia de arrastar con el leftclick pulsado a dos pulsaciones.
    //Así que para selección con box se supone que el primer click se hará de forma que no seleccione nada
    //La rutina entra por el modo "move" de forma al mover el cursor podemos ponernos junto a un elemento
    // y se resalta. Al hacer click, si estaba resaltado se selecciona defeinitivamente (o deselecciona)
    // Si no había nada resaltado es modo box
    // La selección es sobre geometría construida, o sea, drawCanvasLayer
    // La selección con Box usa, a decidir, el RBush, la de cursor, el canvas
    //Habría que hacerlo solo en las layers visibles...
    // getNearestPoint(x,y, w){
    //     let p;
    //     for(let i=0; i< this.dataLayers.length;i++){
    //         if((p=this.dataLayers[i].getNearestPoint(x,y,w)) !== undefined )
    //             return p;
    //     }
    //     const s = this.resolution; 
    //     return {type:'point', x0:s*Math.round(x/s), y0:s*Math.round(y/s)};
    // }
    //El método con canvas es ideal para ratón pero no para box....
    //Por otra parte la clase data-layer no debería saber de canvas y tal...
    //así que hacemos un método find (se puede hacer el filter y tal)
    //TODO meterlo como prototype ??
    //Salgo en el primero pero se prepara para varios
    // getNearestBlock(x, y, w){
    //     const p = position2pixels({x:x,y:y})
    //     const filter = (b) => this.ctx.isPointInStroke(b.canvasPath, p.x, p.y);
    //     this.ctx.lineWidth = scalePixels2mm(w); //Esto son pixels, iría en settings o así TODO
    //     for(let i = 0; i < this.dataLayers.length; i++){
    //         const b = this.dataLayers[i].findBlock(filter);
    //         if(b !== undefined)
    //             return [b];
    //     }
    //     return undefined;
    //     //const blocks = this.dataLayers.map(ly=>ly.blocks.filter(b=>this.ctx.isPointInStroke(b.canvasPath, p.x, p.y))).flat();
    //     //return blocks? blocks : undefined;
    // }
    //me paso un box, x0,y0,x1,y1
    // getBlocksInsideBox(box){
    //     const ps = this.dataLayers.map(ly => ly.getBlocksInsideBox(box)).flat();
    //     return ps.filter(b=>insideBbox(box,b.bbox));
    // }

    // hover( x, y, box, select = false){
    //     let blocks;
    //     if(this.selectData.hoveredBlocks)
    //         this.selectData.hoveredBlocks.forEach(b => b.hover = false);       
    //     if(box)
    //         blocks = this.getBlocksInsideBox(box);
    //     else
    //         blocks = this.getNearestBlock(x, y, 5);
    //     if(blocks && blocks.length > 0){
    //         if(select){
    //             blocks.forEach(b => b.selected = b.selected? false : true);
    //         } else {
    //             blocks.forEach(b => b.hover = true);
    //             this.selectData.hoveredBlocks = blocks;
    //         }
    //     }
    //     this.draw();
    //     return(blocks );
    // }
    // selectAll(layer){
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     targetLayers.forEach(ly => ly.selectAll());
    //     this.draw();
    // }
    // deselectAll(layer){
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     targetLayers.forEach(ly => ly.deselectAll());
    //     this.draw();
    // }
    // invertSelection(layer){ 
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     targetLayers.forEach(ly => ly.invertSelection());
    //     this.draw();
    // }
    // deleteSelection(layer){
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     const deleted = {};
    //     targetLayers.forEach(ly => deleted[ly.name] = ly.deleteSelection());
    //     this.draw();
    //     return deleted;
    // }
    //this.blocksTree.load(bs.map(b=>Object.assign(b,{minX:b.bbox.x0,minY:b.bbox.y0,maxX:b.bbox.x1,maxY:b.bbox.y1, id:b.id})));

    // getSelectedPaths(layer){
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     const blocks = targetLayers.map(ly => ly.blocks.filter( p => p.selected)).flat();
    //     const paths = getPathFromBlocks(blocks);
    //     return paths;
    // }
    // getSelectedBlocks(layer){
    //     const targetLayers = layer? [layer] : this.dataLayers;
    //     return targetLayers.map(ly => ly.blocks.filter( p => p.selected)).flat();
    // }





    //en estas los bloques ya están seleccionados, no hay que pasar el layer
    translateSelected(dx, dy){
        this.dataLayers.forEach(ly => {
            let sels = ly.blocks.filter( p => p.selected);
            sels = sels.map(b => b.translate(dx,dy, true));
            ly.addBlocks(sels); //mete los puntos también
            //ly.addPoints(sels);
        })
        this.draw();
    }
    symmetrySelected(axis, data){
        this.dataLayers.forEach(ly => {
            let sels = ly.blocks.filter( p => p.selected);
            //sels = sels.map(b => b.clone());
            if(axis === 'X')
                sels = sels.map(s=>s.symmetryX(data.y0));
            else if(axis === 'Y')
                sels = sels.map(s=>s.symmetryY(data.x0));
            else if(axis === 'L')
                sels = sels.map(s=>s.symmetryL(data));

            ly.addBlocks(sels);//mete los puntos también
            //ly.addPoints(sels);
        })
        this.draw();

    }
}
customElements.define('cy-canvas-layer-draw', CyCanvasLayerDraw);