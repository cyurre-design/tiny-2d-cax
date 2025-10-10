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
import {Point, CutPoint} from '../cy-geometry/cy-geo-elements/cy-point.js'
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
    save(){ return this}
    restore(data){
        Object.entries(data.forEach(([K,v]) => this[k] = v))
    }
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
  save() {
    return {
        id: this.id,
        name: this.name,
        style: this.style,
        visible: this.visible,
        blocks: [...this.blocks],
    };
  }
  restore(data){
    this.id = data.id;
    this.name = data.name;
    this.style = data.style;
    this.visible = data.visible;
    this.blocks = new Set(data.blocks);
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
    toJSON(){
        return {blocks:Object.fromEntries(this.blocks.entries()), points:(Object.fromEntries(this.points.entries())), layers: Object.fromEntries(this.layers.entries()),
            _activeLayerId: this._activeLayerId, nextBlockId:this.nextBlockId, nextLayerId: this.nextLayerId,
            pointsTree:this.pointsTree, blocksTree:this.blocksTree}
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

        //Voy a probar a extender las clases geométricas con los métodos de dibujo
        Circle.prototype.getRelevantPoints  = function(){ return [new Point({x:this.cx, y:this.cy})]};
        Segment.prototype.getRelevantPoints = function(){ return [new Point({x:this.x0, y:this.y0}), new Point({x:this.x1, y:this.y1})]};
        Polygon.prototype.getRelevantPoints = function(){ return [new Point({x:this.cx, y:this.cy})].concat(this.segments.map(p=>(new Point({x:p.x0, y:p.y0}))))};
        Arc.prototype.getRelevantPoints     = function(){ return [new Point({x:this.cx, y:this.cy}),new Point({x:this.x1, y:this.y1}),new Point({x:this.x2, y:this.y2})]};
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
        const theId = this.nextLayerId++;
        const lyId = `L${theId}`;
        const lname = name !== undefined ? name : `Layer-${theId}`;
        const layer = new Layer(lyId, lname, style, true);
        this.layers.set(lyId, layer);
        this.dispatchEvent(new CustomEvent('new-layer', {bubbles: true, composed:true, detail:{name:lname}})); 
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
 * Esta sería una función para undo, redo de comandos de insertar o quitar un layer
 * 
 */
    saveLayers(){
        return {
            _activeLayerId:this._activeLayerId,
            nextLayerId: this.nextLayerId,
            layers: Object.fromEntries(this.layers.entries())
        }
    }
    restoreLayers(data){
        this._activeLayerId = data._activeLayerId;
        this.nextLayerId    = data.nextLayerId;
        this.layers         = new Set(data.layers);
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
// ------------------------ Gestión de bloques , árbol y puntos, etc...

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
                b.id = `B${this.nextBlockId++}`;                  //id de bloque
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
                    p.id = `P${this.nextBlockId++}`; //el id que estamos poniendo es el del bloque, en getRelevantPoints
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
        layer.blocks.delete(block.id);
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

    /**@todo Los cuts podrían ser intercapas, así que no llevan layerId */
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
    /**@todo esto igual mejor un evento??*/
    scaleChange(scale){
        this.scale = scale;
        this.resolution = scale / 10; //settings, TODO
    }
    /**@function 
     * @param {Number} x,y coordendas del cursor en espacio usuario (window, milimetros)
     * @param {Number} w  precisión con la que buscamos el punto, en las mismas coordenadas
     */
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
    /**@function getNearestBlock
     * @param {Number} x,y coordenadas del cursor en el espacio usuario (window, milimetros)
     * @param w precisión de búsqueda del bloque cercanos
     * La búsqueda se realiza en con las funciones propias del canvas, así que x,y pasan a pixels
     * La rutina sale en el primer hit porque el resto lo hace el usuario (interactivo)
     * Pero se podrían devolver más. 
     */
    getNearestBlock(x, y, w){
        const p = position2pixels({x:x,y:y})
        this.ctx.lineWidth = scalePixels2mm(w); //Esto son pixels, iría en settings o así TODO
        for (const [id, block] of this.blocks.entries()){
            if(this.ctx.isPointInStroke(block.canvasPath, p.x, p.y)){
                return block;
            } 
        }
        return undefined;
    }
    /**@function getBBox
     * @return un BBox que engloba los de todos los elementos, sirve para determinar el área de trabajo
     */
    getBBox(){  //forEach funciona en maps
        let bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
        this.blocks.forEach(b => bbox = checkBbox(bbox, b.bbox));
        return(bbox);
    }
    /**@param {box} box  caja de selección
     * @returns array de bloques
    */
    getBlocksInsideBox(box){ //la search funciona en rbushes
        const bboxes = this.blocksTree.search({minX:box.x0, maxX: box.x1, minY: box.y0, maxY: box.y1});
        return bboxes.map(box => this.blocks.get(box.id)).filter(b=>insideBbox(box,b.bbox));
    // }
    }
//--------------- Selección, deselección...  ------------------------------
//Seguimos la misma filosofía de buscar todo y en su caso filtrar
/**@function 
 * @param {Number} x,y posición coordenadas window (usuario) 
 * @param {Box} box parámetro opcional, si existe, se marcan los elementos totalmente contenidos, si no, el apuntado por x,y
 * @param {boolean} [select=false] si está a true, en vez de estado hover ponemos estado selected
 */
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
    //Estos son COMANDOS?!, sobre todo el delete!!!
    /**
     * 
     * @param {string} layerId 
     * Usamos el map de layers si viene el parámetro y el map de blocks si no está definida (= all)
     * @todo pasar un array de layers, pero se puede hacer con varias llamadas...
     */
    selectAll(layerId){
        const blocks = (layerId !== undefined) ? this.layers.get(layerId) : this.blocks;
        blocks.forEach( p => p.selected = true);
        this.draw();
    }
    deselectAll(layerId){
        const blocks = (layerId !== undefined) ? this.layers.get(layerId) : this.blocks;
        blocks.forEach(p => p.selected = false);
        this.draw();
    }
    invertSelection(layerId){ 
        const blocks = (layerId !== undefined) ? this.layers.get(layerId) : this.blocks;
        blocks.forEach( p => p.selected = p.selected? false : true);
        this.draw();
    }
    deleteSelection(layerId){
        const blocks = (layerId !== undefined) ? this.layers.get(layerId) : this.blocks;
        for (const [id, block] of blocks.entries()){
            if(block.selected){
                //deleted.push(block);
                this.removeBlock(id);
            }
        }
        this.draw();
        //return deleted;
    }
    /**@function No lleva argumentos porque los bloques ya están seleccionados
     * @returns un Path con los bloques seleccionados
     */
    getSelectedPaths(){
        const blocks = [];
        for (const [id, block] of this.blocks.entries()){
            if(block.selected)
                blocks.push(block)
        }
        const paths = getPathFromBlocks(blocks);
        return paths;
    }
    /**@function No lleva argumentos porque los bloques ya están seleccionados
     * @returns un array de bloques que se han seleccionado previamente
    */
    getSelectedBlocks(){
        const blocks = [];
        for (const [id, block] of this.blocks.entries()){
            if(block.selected)
                blocks.push(block)
        }
        return blocks;
    }


    /**
     * nuevo origen, el origen es siempre 0,0 por definición!!! hay que restar el nuevo valor
     * @param {Number} dx desplazamiento en x
     * @param {Number} dy desplazamiento en y
     * Es un comando morralla porque implica que todos los árboles hay que rehacerlos...
     * Al final no se sabe si con los RBushes se optimiza o pesimiza...
     * Hay que cambiar todas las coordenadas de todos los elementos!!!
     */
    setOrigin(dx, dy){
        this.pointsTree.clear();
        this.blocksTree.clear();
        //hay que clonar la info básica, y hacer el cambio de coordenadas, el translate es geométrico, no guarda el id, etc...
        //Los layers, blocks y puntos podrían mantenerse, pero la info de path no, la de bbox no...
        //Clono lo necesario para rehacer toda la base de datos... transladada
        let oldBlocks=[];
        
        this.blocks.forEach((b)=> {
            const nb = b.translate(dx,dy);
            nb.layerId = b.layerId;
            oldBlocks.push(nb);
        });
        this.blocks.clear();
        this.points.clear();
        this.layers.forEach(ly => ly.blocks = new Set()); //No borro las capas y sus estilos y nombre, pero sí los bloques
        //No reiniciamos el contador de Id... porque la podemos liar...
        this.layers.forEach(layerId => {
            this.addBlocks(layerId.id, oldBlocks.filter(b=>b.layerId = layerId));
        })
        //Los points que no son cut ya se habrán regenerado
        //Faltan los cut
    }

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

    //en estas los bloques ya están seleccionados, no hay que pasar el layer, pero hay que copiarlo...
    //Atton: el translate hace un clone de la parte geométrica, pero no va a recordar la capa ni ná.
    
    translateSelected(data){
        this.layers.forEach(ly => {
            const sels = [];
            ly.blocks.forEach( id => {
                const b = this.blocks.get(id);
                if( b.selected) sels.push(b.translate( data.dx, data.dy, true))
                }
            )
            this.addBlocks(ly.id, sels);
        })
        this.draw();
    }
    /**@param {string} axis es el eje o línea de referencia para la simetría (X,Y,L)
     * @param data puedeser un punto (de donde cogemos x0 o y0, o un segmento)
     * Se hace por capas para que la simetría cree los elementos en la misma capa que el original
     * Esto son decisiones de especificación, podría cambiarse e ir a la capa activa
     * @todo la decisión sobre ello
     */
    symmetrySelected(axis, data){
        const symmetry = axis==='X' ? (b)=>b.symmetryX(data.y0) : axis==='Y' ? (b)=>b.symmetryY(data.x0) : (b)=>b.symmetryL(data)
        this.layers.forEach(ly => {
            const sels = [];
            ly.blocks.forEach( id => {
                const s = this.blocks.get(id);
                if( s.selected)
                    sels.push(symmetry(s))
                }
            )
            this.addBlocks(ly.id, sels);   //mete los puntos también
        })
        this.draw();
    }


    
    /**
     * @function serialice y deserialice, persistencia
     */

    serialice(){
        //let out = '[';
        //this.layers.forEach(ly => out += ly.serialice()); 
        //out = out.slice(0,-1) + ']';
        console.log (JSON.stringify(this));
    }
    deserialice(file){
    //Aquí debe llegar el texto del fichero, que está en JSON
        const rawLayers = JSON.parse(file);
        rawLayers.forEach(ly => {
            const newLayer = this.addLayer(ly.name);
            newLayer.addBlocks(deserialize(ly.blocks));
        })   
    }


}
customElements.define('cy-canvas-layer-draw', CyCanvasLayerDraw);