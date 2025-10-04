import {checkBbox} from '../cy-geometry/cy-geometry-library.js'
import {getPathFromBlocks} from './cy-elements-to-canvas.js'

export const canvasCSS = {
    pathColor: 'green',
    pathWidth: 2,
    selectedColor: 'yellow',
    selectedWidth: 3,
    printColor: 'black',
    printWidth: 2,
    //dimensión del punto en pixels
    pointDimension : 3
}



/**
 * Clase que gestiona capas dentro del canvas layer común
 */
//No sé si tiene lógica ir guardando los bbpxes para tener el extents porque se destruye al borrar
//Por una parte, el extent solo se usa en fit o poco más...
//Por otra parte, que se modifique el rectángulo al borrar un elemento tampoco será el caso más probable...
// 
//LayerDraw no hereda, sino que contiene un array de clases. 
export class CyDataLayer {
    constructor(canvasLayer, name, style){
        this.name = name;
        this.canvasLayer= canvasLayer;
        this.blocks = new Map();        //existe el forEach de map
        this.points = new Map();
        //Cada capa puede usar un color y grosor diferentes, claro
        //Y en realidad cada path, se lo ponemos por si acaso
        this.style = canvasCSS;
        if(style) 
            Object.assign(this.style, style);
        //this.bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
        //gestión de RBUSH 
        this.idCount = 1;   //para ir controlando lo que metemos por si queremos remover alguno
        this.pointsTree = new RBush();
        this.blocksTree = new RBush();
        //Este es un visible "soft" que es el usado en las capas de dibujo normales
        this.visible = true;
        this.selected = true;

        //dimensión del punto en pixels
        this.pointDimension = 3;  //TODO pasarlo a settings de la capa, No es estilo de dibujo

        //Por si se cra con datos (lectura de fichero, por ejmplo)
        //Debe estar al final para que la capa ya tenga color, etc...
        //this.addBlocks(paths, true);
    }

    //rutina que mete datos al rbush, metemos dos, uno fino y otro gordo (paths, polígonos y tal)
    //NO se hace el copy porque hace el remove por referencia (find)
    //NO me van a pasar en principio puntos, se puede quitar el filtro, creo
    // _addBlocks(blocks){
    //     let bs = Array.isArray(blocks)?blocks:[blocks];
    //     this.blocksTree.load(bs.filter(b => ((b.type!=='point') && (b.type!=='cut-point'))).map(b=>Object.assign(b,{minX:b.bbox.x0,minY:b.bbox.y0,maxX:b.bbox.x1,maxY:b.bbox.y1, id:b.id})));
    // }
    

    _addPointsToTree(points){
        points.forEach(p => this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id}));
    }

    addBlocks(paths){  //pueden ser circles o polygons también...
        let ps = Array.isArray(paths)?paths:[paths];
        //Primero pongo la info de pintar y un id, importante. La parte del tree es de alguna manera opcional
        ps.forEach(b=>{
            if((b.type !== 'point') && (b.type!=='cut-point')){
                b.id = this.idCount++;                  //id de bloque
                b.canvasPath = getPathFromBlocks(b);
                b.style = Object.assign({}, this.style);     //copia, para poder tocarlos de forma independiente
                this.blocks.set(b.id, b);
                this.blocksTree.insert({minX:b.bbox.x0,minY:b.bbox.y0,maxX:b.bbox.x1,maxY:b.bbox.y1, id:b.id})
                const points = b.getRelevantPoints();
                points.forEach(p=>{ 
                    p.bid = b.id;   //para saber a qué bloque pertenece el punto 
                    p.id = this.idCount++; //el id que estamos poniendo es el del bloque, en getRelevantPoints
                    p.type = 'point';
                    p.canvasPath = getPathFromBlocks([p], this.pointDimension);
                    p.style = this.style;       //TODO no sé si hace falta por cómo se gestionan luego...
                    this.points.set(p.id, p);    //Al map 
                    this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id});    //Al tree para buscar rápido
                })
            }
        })
    }
    removeBlock(id) {
        //Hay que quitarlo del árbol!!!! Parece que hay un error, uso un hack de un blog
        this.blocksTree.remove(  {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, id:id }, (a, b) => a.id === b.id)
        return this.blocks.delete(id);
    }
    get(id) {
        return this.blocks.get(id);
    }
    findBlock(fn){
        for (const [id, block] of this.blocks.entries()){
            if(fn(block)) return block;
        }
        return undefined;
    }
    // addPoints(blocks){
    //     let bs = Array.isArray(blocks)?blocks:[blocks];
    //     const points = bs.map(el=>el.getRelevantPoints()).flat();
    //     //Primero pongo la info de pintar y un id, importante. La parte del tree es de alguna manera opcional
    //     points.forEach(p=>{  //meteríamos el bbox y lo que haga falta ¿Clonamos???
    //         //p.pid = this.idCount++; //el id que estamos poniendo es el del bloque, en getRelevantPoints
    //         p.type = 'point';
    //         p.canvasPath = getPathFromBlocks([p], this.pointDimension);
    //         p.style = Object.assign({}, this.style); //copia, para poder tocarlos de forma independiente
    //     })
    //     this.points = this.points.concat(points);
    //     //Esto los mete en un tree, que sería opcional
    //     this._addPointsToTree(points);
    // }
    //ATTON, falta poner referencia al bloque del que sale?? TODO ver si merece
    addCutPoints(points){
        points.forEach(p=>{
            p.canvasPath = getPathFromBlocks([p], this.pointDimension);
            p.style = this.style;
            p.id = this.id++;
            this.points.set(p.id, p);
            this.pointsTree.insert({minX:p.x0, maxX:p.x0, minY:p.y0, maxY: p.y0, id:p.id});    //Al tree para buscar rápido
        });
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
        return undefined
    }

    getBBox(){
        let bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
        this.blocks.forEach(b => bbox = checkBbox(bbox, b.bbox));
        return(bbox);
    }
    getBlocksInsideBox(box){
        const bboxes = this.blocksTree.search({minX:box.x0, maxX: box.x1, minY: box.y0, maxY: box.y1})
        return bboxes.map(box => this.blocks.get(box.id))
    }
        //let ps = this.dataLayers.map(ly=>ly.blocksTree.search({minX:box.x0, maxX: box.x1, minY: box.y0, maxY: box.y1})).flat();

    selectAll(){
        this.blocks.forEach( p => p.selected = true);
    }
    deselectAll(){
        this.blocks.forEach( p => p.selected = false);
    }
    invertSelection(){
        this.blocks.forEach( p => p.selected = p.selected? false : true);
    }
    deleteSelection(){
        const deleted = [];
        for (const [id, block] of this.blocks.entries()){
            if(block.selected){
                deleted.push(block);
                this.removeBlock(id);
            }
        }
        return deleted;
    }

    // recalculateLayerPaths(paths = this.blocks){
    //     paths.forEach(p => {
    //         p.canvasPath = p.type==='path'?this.canvasLayer.getPathFromBlocks(p.elements):this.canvasLayer.getPathFromBlocks([p]);
    //         p.color = this.style.pathColor;
    //         p.width = this.style.pathWidth;
    //     });
    // }
    //es una brasa de comando, 
    //Hay que cambiar todas las coordenadas de todos los elementos!!!
    translate(dx, dy) { //nuevo origen, el origen es siempre 0,0 por definición!!! hay que restar el nuevo valor
        this.pointsTree.clear();
        this.blocksTree.clear();
        this.idCount = 1;
        //hay que clonar la info básica, y hacer el cambio de coordenadas
        //Uso un array auxiliar como estructura temporal
        let oldBlocks=[];
        this.blocks.forEach((b)=>oldBlocks.push(b.translate(dx,dy)))
        this.blocks.clear();
        this.points.clear();
        this.addBlocks(oldBlocks);
        //Los points que no son cut ya se habrán regenerado
        //Faltan los cut
    }
    //Si los bloques proviniesen de otro layer sería medio copy entre capas
    serialice(someBlocks){
        const blocks = someBlocks || Array.from(this.blocks.values());//pierdo el idn adrede
        return `{"name":"${this.name}", "data":${JSON.stringify(blocks)}},`;
    }

}
