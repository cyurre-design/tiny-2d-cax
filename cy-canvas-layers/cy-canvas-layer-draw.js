"use strict";
import {CyCanvasLayer, canvasCSS} from './cy-canvas-layer.js';
import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import { checkBbox, insideBbox, blockTranslate }  from '../cy-geometry/cy-geometry-library.js';
import { getRelevantPoints }  from '../cy-geometry/cy-geometry-basic-elements.js';
import {getPathFromBlocks} from './cy-elements-to-canvas.js'

// ------------------------
// Modelo Layer
// ------------------------

function createLayer(lyId, name, layerStyle = canvasCSS, visible = true, erasable = true) {
    return {
        lyId      : lyId,
        name    : name,
        layerStyle   : Object.assign({}, layerStyle),
        visible : visible,
        erasable: erasable,
        blocks  : [], // Array de bloques de esta capa en particular
        //Generador de Ids
        nextBlockId : 1,

        toJSON(k) {
            return {
                lyId:this.lyId, name:this.name, layerStyle:this.layerStyle, visible: this.visible, erasable: this.erasable,
                nextBlockId: this.nextBlockId, blocks: this.blocks
            }
        }
    }
}   

//Heredo de layer genérica que me da los métodos de borrado, etc...
//29-09-25 La gestión de undo, redo, etc... se enmorralla bastante con las capas en varios sets
//Probamos a que la capa sea un atributo de cada elemento, path, etc...
export default class CyCanvasLayerDraw extends CyCanvasLayer {
/**
 * @constructor
 * El canvasLayerDraw aglutina la gestión de capas y comandos geométricos, selección, etc..
 * En esta versión simplificamos la estructura :
 *  1.- Existe un array de capas, son el nivel primero de subdivisión
 *  2.- Cada capa contiene un array de blocks, pero tienen un Id, no usamos sólo índices
 *  3.- Cada bloque tiene un conjunto de puntos relevantes (extremos, etc...)
 *  4.- Cada bloque, (al que pegamos un id de layer) se inserta en un único RBush de bloques
 *  5.- Los puntos de cada bloque (a los que les pegamos el id de layer y bloque) se insertan en un RBush único
 *  6.- Ls puntos decorte son independientes y van a ese mismo RBush, en principio no se borran automáticamente
 *  Como id usamos un simple contador 
 *  Estaría por ver si los RBush realmente mejoran el rendimiento...
 */
    constructor() {
        super('draw');
    this.layers = []
    this.nextLayerId = 1; //Generador
    this._activeLayerId = undefined;
    //auxiliar para selección
    this.selectData = {
        hoveredBlocks: undefined
    }
    //cuts
    this.cutPoints = [];
    this.nextPointId = 1;
    //gestión de RBUSH 
    this.pointsTree = new RBush();
    this.blocksTree = new RBush();
    }
        
    /**
     * @function toJSON y fromJSON, persistencia
     * HAY 2 funcionalidades diferentes:
     * 1.- salvar-restaurar el proyecto
     * 2.- salvar o recuperar un proyecto (por ejemplo para añsdir figuras)
     * En el segundo caso NO se usará toda la info @todo
     */
    //Hay que separar la parte geométrica de la otra porque si no se usa el toJSON de esa parte y perdemos la info añadida
    toJSON(){
        return {
            layers: this.layers,
            nextLayerId: this.nextLayerId,
            _activeLayerId: this._activeLayerId,
            cutPoints: this.cutPoints,
            nextPointId: this.nextPointId,
            pointsTree:this.pointsTree.toJSON(),
            blocksTree:this.blocksTree.toJSON()
        }
    }
/**@todo que llegue aquí solo el model ? */
/**Por defecto NO borramos lo anterior ?... opción a confirmar?? */
    deserialize(saved, clear = true){
        const model = saved; //.model;
        if(clear ){
            this.layers = model.layers;
            this.nextLayerId = model.nextLayerId;
            this._activeLayerId = model._activeLayerId;
            this.cutPoints = model.cutPoints;
            this.nextPointId = model.nextPointId;
            this.pointsTree.fromJSON( model.pointsTree);
            this.blocksTree.fromJSON( model.blocksTree);
            //Pero los paths se han perdido ...
            this.layers.forEach(ly => {
                ly.blocks.forEach(b=>{
                    b.data.canvasPath = getPathFromBlocks(b);
                    b.data.points.forEach(p => {
                        p.canvasPath = getPathFromBlocks(p);
                    })
                })
            })
        } else {
            model.layers.forEach(layer => {
                const blocks = layer.blocks;
                this.addBlocks(this._activeLayerId, blocks);
            })
        }
        this.draw();
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

//-------------------- Creación y Edición de LAYERS 
/**
 * 
 * @param {string} name el nombre de la capa (que puede ser generado automáticamente)
 * @param {*} layerStyle valore de color para pintar los bloques. Se deberán guardar
 * @returns la referencia a la capa recién creada
 * @todo no crear si ya existe
 * @todo definir clase o similar (serializable) para el estilo de pintada en canvas
 */
    addLayer(name, layerStyle = canvasCSS, layerId) {
        const theId = this.nextLayerId++;
        const lyId = layerId !== undefined? layerId : `L${theId}`;
        const lname = name !== undefined ? name : `Layer${theId}`;
        const styles = Object.assign(canvasCSS, layerStyle);
        const layer = createLayer(lyId, lname, styles, true);
        this.layers.push(layer);
        this._activeLayerId = lyId;
        return lyId;
    }
/**
 * 
 * @param {id} layerId el id de la capa a eliminar, pero no su contenido
 * @todo preguntar si realmente se quiere borrar !!! atton, al undo
 * además se podrían pasar los elementos a otra capa provisional?
 */
    deleteLayer(layerId) {
        if(this.layers.length <= 1) return;
        const layerIx = this.layers.findIndex(ly=>ly.lyId === layerId)
        this.layers.splice(layerIx,1);
    }
    //puede haber cambiado el nombre también, pero NO el id, por eso llega aquí
    setStyle(layerId, newLayer){
        const ly = this.getLayer(layerId);
        if(!ly) return;
        const old = JSON.parse(JSON.stringify(ly));
        ly.name = newLayer.name,
        ly.layerStyle = newLayer.layerStyle;
        return old;
    }

/**
 * 
 * @param {string} name nombre de la capa
 * @returns LyId de la capa o undefined si no existe
 */
    // findLayerByName(name){
    //     for (const [lyId, layer] of this.layers.entries()){
    //         if(name === layer.name) return lyId;
    //     }
    //     return undefined;
    // }
/**
 * 
 * @param {string} name 
 * @param {boolean} visible 
 */    
    setVisible(lyId, visible) {
        if(lyId !== undefined){
            const layer = this.getLayer(lyId);
            if(layer) layer.visible = visible;
        }
        this.draw();
    }

// ------------------------ Gestión de bloques , árbol y puntos, etc...


/**
 * Hay casos degenerados como paths con 0 elementos...
 * @param {string} layerId el id de la capa en el Map  de capas
 * @param {array} paths 
 * @returns 
 */
    addBlocks(layerId = this._activeLayerId, paths){  //pueden ser circles o polygons también...
        if(paths === undefined) {console.log('tipo de bloque no visualizable'); return;}
        let ps = Array.isArray(paths)?paths:[paths];
        //quito los paths vacíos
        ps = ps.filter(p=> (p.type !== 'path') || (p.elements.length > 0));
        const layer = this.getLayer(layerId); //se supone única porque es un dato que se pasa como argumento
        //Primero pongo la info de pintar y un id, importante. La parte del tree es de alguna manera opcional
        ps.forEach(b=>{
            if((b.type !== 'point') && (b.type!=='cut-point')){
                b.data = {
                    id : `B${layer.nextBlockId++}`, lyId : layerId, canvasPath : getPathFromBlocks(b),
                    points : [],
                }
                b.data.tree = {minX:b.bbox.x0,minY:b.bbox.y0,maxX:b.bbox.x1,maxY:b.bbox.y1, id:b.data.id, lyId:b.data.lyId}
                this.blocksTree.insert(b.data.tree);

                //gestión de sus puntos
                const points = getRelevantPoints(b);
                points.forEach(p=>{ 
                    p.type = 'point';
                    p.data = {
                        bid : b.id, lyId : layerId, id : `P${layer.nextBlockId++}`,
                        canvasPath : getPathFromBlocks([p], this.pointDimension),
                        tree: {minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, bid:p.bid} 
                    }
                    b.data.points.push( p );    //Array de puntos relevantes
                    this.pointsTree.insert(p.data.tree);    //Al tree para buscar rápido
                })
                layer.blocks.push(b);                   //La mete en el array de bloques de la capa activa
            }
        })
    }
    /**
     * 
     * @param {Object} block obtenido por interacción, selecci´on, etc...
     * @returns block borrado, @todo porque si no sirve mejor quitarlo
     * El borrado con splice es muy delicado por no decir desaconsejable directamente
     */
    deleteBlock(block) {
        //necesito la capa
        const layer = this.getLayer(block.data.lyId);
 
        this.blocksTree.remove(block.data.tree);         //lo saco del Rbush
        //Borro los puntos asociados, se borran por referencia, así que guardo lo que meto al tree (también se pueden borrar con una fon de comparación)
        block.data.points.forEach( p => this.pointsTree.remove(p.data.tree));
        layer.blocks.splice(layer.blocks.indexOf(block), 1);
        return block; //??
    }

    /**
     * 
     * @param {Number} layerId 
     * @returns array of blocks (referencias a sus bloques)
     * Se necesita hacer así porque todos los bloques de todas las capas está en un solo Map
     */
    getBlocksInLayer(layerId) {
        const layer = this.layers.find(ly => ly.data.lyId === layerId);
        if (!layer) return [];
        return layer.blocks;
    }
    setActiveLayerId(lyId){
        if(lyId)
            this._activeLayerId = lyId;
        return this._activeLayerId;
    }
    getActiveLayerId(){ return this._activeLayerId}

    getLayer(layerId){ return this.layers.find(ly => ly.lyId === layerId)}
    getActiveLayer(){ return this.layers.find(ly => ly.lyId === this._activeLayerId)}
    layerIsEmpty(layerId){ return (this.getLayer(layerId).blocks.length === 0)}
    /**@todo Los cuts los hago intercapas, así que no llevan layerId */
    //Y por otra parte pertenecen a 2 bloques, ... igual son eternos 
    
    addCutPoints( points){ //estos ya vienen pretratados
        if(!points) {
            console.log('puntos?'); //esto debe tratar el indefinido, el no array y el longitud 0
            return
        }
        const layer = this.getActiveLayer();
        const pDim = layer.layerStyle.pointDimension
        points.forEach(p=>{
            p.data = {
                canvasPath : getPathFromBlocks([p], pDim),
                id : 'CP'+this.nextPointId++ ,
            }
            p.data.tree = {minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id};
            this.cutPoints.push(p);
            this.pointsTree.insert(p.data.tree);    //Al tree para buscar rápido
        });
        //this.draw();
    }
    deleteCutPoints( points){
        if(!points) return;
        points.forEach(p => {
            const ix = this.cutPoints.indexOf(p);
            //const point = this.cutPoints[ix];
            this.pointsTree.remove( this.cutPoints[ix].data.tree);
            this.cutPoints.splice(ix,1);
        })
        //this.draw();
    }
//--------------Gestión de RBush y cercanía al ratón------------------
    //No miro por capas, si hace falta se filtra por layerId posteriormente
    /**@todo esto igual mejor un evento??*/
    scaleChange(scale){
        this.scale = scale;
        this.resolution = scale / 20; //settings, TODO
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
            //El punto puede ser de corte o perteneceer a un bloque. Esta rutina no accede al bloque o punto, solo
            // coge la información geométrica que está en el RBush
            return {type:'cut-point', x0:ps[0].minX, y0:ps[0].minY};
        }
        //Default, devolver el punto de rejilla más cercano
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
        for(let ix = 0; ix < this.layers.length; ix++){
            const blocks = this.layers[ix].blocks;
            for (let jx = 0 ; jx < blocks.length; jx++){
                const b = blocks[jx];
                if(this.ctx.isPointInStroke(b.data.canvasPath, p.x, p.y)){
                    if(b.type !== 'path'){
                        return [b, undefined];
                    } else { //path, miro dentro, que no tiene el path generado, 
                        const elementPaths = b.elements.map(b => getPathFromBlocks(b) )
                        for(let kx = 0; kx < elementPaths.length; kx++){
                            if(this.ctx.isPointInStroke(elementPaths[kx], p.x, p.y)){
                                return [b, b.elements[kx]];
                            } 
                        }
                    }
                }
            }
        }
        return undefined;
    }
    /**@function getBBox
     * @return un BBox que engloba los de todos los elementos, sirve para determinar el área de trabajo
     */
    getBBox(){  //forEach funciona en maps
        let bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
        this.layers.forEach(layer => {
            layer.blocks.forEach(b => bbox = checkBbox(bbox, b.bbox));
        })
        return(bbox);
    }
    /**@param {box} box  caja de selección
     * @returns array de bloques
     * ?La hago de capa activa... @todo
    */
    getBlocksInsideBox(box){ //la search funciona en rbushes
        const layer = this.getActiveLayer();
        let bboxes = this.blocksTree.search({minX:box.x0, maxX: box.x1, minY: box.y0, maxY: box.y1});
        //Lo de mirar en el mismo layer sería opcional, a quitar
        bboxes = bboxes.filter(b => b.lyId === this._activeLayerId);
        //debug
        let blocks = bboxes.map(bb => layer.blocks.find(b => b.data.id === bb.id)).filter( b => b !== undefined);
        blocks = blocks.filter(b=>insideBbox(box,b.bbox));
        return blocks;
    }
//--------------- Selección, deselección...  ------------------------------
//Seguimos la misma filosofía de buscar todo y en su caso filtrar
/**@function 
 * @param {Number} x,y posición coordenadas window (usuario) 
 * @param {Box} box parámetro opcional, si existe, se marcan los elementos totalmente contenidos, si no, el apuntado por x,y
 * @param {boolean} [select=false] si está a true, en vez de estado hover ponemos estado selected
 * Como el caso getNearest tiene más usos, separo por legibilidad aunque haya cosas comunes
 */
    _hilite(blocks, select){
        if(blocks && blocks.length > 0){
            if(select){
                blocks.forEach(b => b.selected = b.selected? false : true);     //permanente, selected
            } else {
                blocks.forEach(b => b.hover = true);
                this.selectData.hoveredBlocks = blocks;                         //temporal, hover
            }
        }
    }
    hover( x, y, box, select = false){
        let blocks;
        if(this.selectData.hoveredBlocks)
            this.selectData.hoveredBlocks.forEach(b => b.hover = false);        //gestión de hover, aquí borra anarillo
        if(box){
            blocks = this.getBlocksInsideBox(box);
            this._hilite(blocks, select);
        }
        else{
            blocks = this.getNearestBlock(x, y, 10);
            this._hilite(blocks ? [blocks[0]] : [], select)
        }
        this.draw()
        return(blocks);

    }
    //TODO ver si se pasa el layer por name o por id... de momento, undefined = all
    //Estos son COMANDOS?!, sobre todo el delete!!!
    /**
     * 
     * @param {string} layerId 
     * Usamos el map de layers si viene el parámetro y el map de blocks si no está definida (= all)
     * @todo pasar un array de layers, pero se puede hacer con varias llamadas...
     */
    selectAll(layerId = this._activeLayerId){
        const blocks = this.getLayer(layerId).blocks;
        blocks.forEach( p => p.selected = true);
        this.draw();
    }
    deselectAll(layerId = this._activeLayerId){
        const blocks = this.getLayer(layerId).blocks;
        blocks.forEach(p => p.selected = false);
        this.draw();
    }
    invertSelection(layerId = this._activeLayerId){ 
        const blocks = this.getLayer(layerId).blocks;
        blocks.forEach( p => p.selected = p.selected? false : true);
        this.draw();
    }
    /**@function No lleva argumentos porque los bloques ya están seleccionados
     * @returns un Path con los bloques seleccionados
     * Cojo todas las capas, discutible...
     */
    getSelectedPaths(){
        const blocks = [];
        this.layers.forEach(layer => {
            blocks = blocks.concat(layer.blocks.filter(b => b.selected))
        })
        const paths = getPathFromBlocks(blocks);
        return paths;
    }
    /**@function No lleva argumentos porque los bloques ya están seleccionados
     * @returns un array de bloques que se han seleccionado previamente
    */
    getSelectedBlocks(){
        let blocks = [];
        this.layers.forEach(layer => {
            blocks = blocks.concat(layer.blocks.filter(b => b.selected))
        })
        return blocks;
    }


    /**
     * nuevo origen, el origen es siempre 0,0 por definición!!! hay que restar el nuevo valor
     * @param {Number} dx desplazamiento en x
     * @param {Number} dy desplazamiento en y
     * Es un comando morralla porque implica que todos los árboles hay que rehacerlos...
     * Al final no se sabe si con los RBushes se optimiza o pesimiza...
     * Hay que cambiar todas las coordenadas de todos los elementos!!!
     * Decido hacer solo sobre la capa activa
     */
    setOrigin(dx, dy){
        const layer = this.getActiveLayer();
        const newBlocks = layer.blocks.map( b => blockTranslate(b, dx, dy)); //geometría, y hace copy)
        layer.blocks.forEach(b => {
            this.blocksTree.remove(b.data.tree);         //lo saco del Rbush
            //Borro los puntos asociados, se borran por referencia, así que guardo lo que meto al tree (también se pueden borrar con una fon de comparación)
            b.data.points.forEach( p => this.pointsTree.remove(p.data.tree));
        })
        //los cutpoints también hay que moverlos y no los tengo asociados a capas...@todo
        const newPoints = this.cutPoints.map( p => ({type: 'cut-point', x0:p.x0+dx, y0: p.y0 + dy}));
        this.cutPoints.forEach( p => {
            this.pointsTree.remove(p.data.tree);
        })
        this.cutPoints = [];
        this.addCutPoints(newPoints);  
        //No reiniciamos el contador de Id... porque la podemos liar...
        layer.blocks = [];
        this.addBlocks(this._activeLayerId, newBlocks);
    }
    replaceBlocks(oldBlocks, newBlocks){
        oldBlocks.forEach(b => this.deleteBlock(b));
        this.addBlocks(this._activeLayerId, newBlocks);
    }
    draw() {
        this.clear();
        //Hacemos que el estilo sea por capa y estado en vez de por path
/**@todo pintar por capas para mejorar rendimiento?? */
        this.layers.forEach( layer => {
            if(layer.visible){
                layer.blocks.forEach( p => {
                    this.ctx.lineWidth = scalePixels2mm(p.selected?+layer.layerStyle.selectedWidth:+layer.layerStyle.pathWidth);
                    this.ctx.strokeStyle = (p.selected)?layer.layerStyle.selectedColor:(p.hover)?layer.layerStyle.selectedColor:layer.layerStyle.pathColor;
                    this.ctx.stroke(p.data.canvasPath);
                })
             }
            })
        return;
    }





}
customElements.define('cy-canvas-layer-draw', CyCanvasLayerDraw);