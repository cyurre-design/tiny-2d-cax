    
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
const selectionWidthInPixels = 10;
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawBasic {
    constructor(layerDraw, mode, subMode){
        this.layerDraw = layerDraw;
        this.data = {};
        this.mode = mode;
        this.subMode = subMode;
        this.status = 0;    
        this.enabled = true; //guarda para evitar ejecutar acciones en click, se pone en cada heredera
    }
    /**
     * NO SE DEBEN LLAMAR FUNCIONES SOBRECARGABLES EN EL CONSTRUCTOR
     * porque se llamarán con el this de la clase hija y ANTES del constructor de la clase hija!!!
     */
    //Por defecto, la nomenclatura sería x0,y0 para un primer punto, x1,y1 para un segundo....
    dataSent = [[],[],[]];
    dataReceived = [];
    //Al final las operaciones básicas son visualizar el punto, almacenar el punto, actualizar el status, importar data...
    //Y luego hay funciones que serán específicas, como el bloque y modo de dibujo, borrado, etc...

    highLight = (x,y,blocks) => {
        const w = scalePixels2mm( this.draft.pathWidth);             //O selected??
        //pintamos los bloques, si hay
        this.draft.clear();
        if(blocks !==undefined)
            this.draft.drawBlocks(blocks, w, this.draft.pathColor ); //es llamada desde aquí, pasarnos siempre array
        //busco el punto más cercano al cursor y lo pinto
        const selWidth = scalePixels2mm(selectionWidthInPixels);
        const point = this.layerDraw.getNearestPoint(x, y, selWidth);        //El 5 a settings TODO
        this.draft.drawBlocks(point, w, this.draft.pathColor );
        return( {x : point.x0, y : point.y0});
    }
    clear = () => this.draft.clear();
    
    p0 =        (pi)    => {
                            [this.data.x0, this.data.y0] =   (this.hit !== undefined) ? [this.hit.x, this.hit.y] : [pi.x, pi.y];
                            this.status = 1;
                            };
    
    getBlocks = ()      => {this.blocksToMove = this.layerDraw.getSelectedBlocks()};

    m0 =        (pi)    => {[this.data.x0, this.data.y0] =   (this.hit !== undefined) ? [this.hit.x, this.hit.y] : [pi.x, pi.y]}
                            
    m1 =        (pi)    => {[this.data.x1, this.data.y1] =   (this.hit !== undefined) ? [this.hit.x, this.hit.y] : [pi.x, pi.y]}
    
    h  =        (pi)    => {this.hit = this.highLight(pi.x, pi.y, undefined);};

    sendDataBasic =  ()  => {
        this.layerDraw.dispatchEvent(new CustomEvent('drawing-event', {bubbles: true, composed:true, 
            detail:{data: this.dataBasic(this.dataSent[this.status])}}));
    }
    dataBasic(keys){
        const data = keys.map(k => ({idn:k, v:this.data[k]}))
        return data;
    }
    deleteDataBasic = (args) => {
        this.status = 0;
        this.enabled = true;
        args.forEach(k => delete this.data[k]);
    }
    //arrays de funciones
    //clickFn =   [[this.p0], [this.m1, this.deleteDataBasic ]];
    clickFn =   [[],[]]
    ///moveFn  =   [[this.h, this.m0, this.sendDataBasic], [this.h, this.m1, this.sendDataBasic], []];
    moveFn  =   [[this.h], [], []];
    
    leftClick = (pi, evt) => {
        let p = this.hit || pi;
        this.clickFn[this.status].forEach(f=> { if(this.enabled) f(p)}); //secuencia de acciones
        console.log(this.status)
    };
    mouseMove = (pi) => {
        this.moveFn[this.status].forEach(f => f(pi));
        // if(this.hit) //solo si hay algo que mandar
        //     this.layerDraw.dispatchEvent(new CustomEvent('drawing-event', {bubbles: true, composed:true, 
        //         detail:{pos:this.hit, type:this.type, subType: this.subMode, idn:this.dataSent[this.status]}}));
    };
    //Habría que chequear tipos numéricos y tal, formatos...
    //La idea es que lo numérico, mayoritario, se pone ne received y se parsea
    //Otras cosas menos habituales se pasan como vienen
    updateDataBasic = (data) => {
        if(!data) return;
        let newData = [];
        Object.keys(data).forEach(k =>{
            //const idn = k.split('-')[1];
            newData.push({idn:k,v:data[k]});
            if(this.dataReceived.includes(k))
                this.data[k] = +data[k];
            })
        return newData;
        }
                
}