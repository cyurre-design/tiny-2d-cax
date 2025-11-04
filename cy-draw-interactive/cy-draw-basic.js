    
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';

//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawBasic {
    constructor(layerDraw, mode, subMode){
        this.layerDraw = layerDraw;
        this.data = {};
        this.mode = mode;
        this.subMode = subMode;
        this.status = 0;    
    }
    /**
     * NO SE DEBEN LLAMAR FUNCIONES SOBRECARGABLES EN EL CONSTRUCTOR
     * porque se llamarán con el this de la clase hija y ANTES del constructor de la clase hija!!!
     */
    deleteData = () => { this.status = 0;}
    //Por defecto, la nomenclatura sería x0,y0 para un primer punto, x1,y1 para un segundo....
    dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],[]];
    dataReceived = ['x0','x1','y0','y1'];
    //Aunque hay funciones repetidas, queda más claro que el módulo sea autocontenido o el 90%
        //Al final las operaciones básicas son visualizar el punto, almacenar el punto, actualizar el status, importar data...
    //Y luego hay funciones que serán específicas, como el bloque y modo de dibujo, borrado, etc...
    highLight = (x,y,blocks) => {
        let w = scalePixels2mm( this.layerDraw.pathWidth);             //O selected??
        const point = this.layerDraw.getNearestPoint(x, y, 10*w);        //El 5 a settings TODO
        this.draft.drawBlocks(point, blocks);
        return( {x : point.x0, y : point.y0});
    }
    
    p0 =        (pi)     => {this.data.x0 = pi.x; this.data.y0 = pi.y; this.status = 1;};
    getBlocks = ()      => {this.blocksToMove = this.layerDraw.getSelectedBlocks()};
    h  =        (pi)    => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    m0 =        (pi)    => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    m1 =        (pi)    => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    move =      (pi)    => {this.hit = this.highLight(pi.x, pi.y, undefined)};
    //arrays de funciones
    clickFn =   [[this.p0], [this.m1, this.deleteData ]];
    moveFn  =   [[this.h], [this.h, this.move], []];

    leftClick = (pi, evt) => {
        let p = this.hit || pi;
        this.clickFn[this.status].forEach(f=>f(p)); //secuencia de acciones
        console.log(this.status)
    };
    mouseMove = (pi) => {
        this.moveFn[this.status].forEach(f => f(pi));
        this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, 
            detail:{pos:this.hit, type:this.type, subType: this.subMode, idn:this.dataSent[this.status]}}));
    };
    //Habría que chequear tipos numéricos y tal, formatos...
    updateData(data) {
        let newData = [];
        Object.keys(data).forEach(k =>{
            const [t,idn,action] = k.split('-');
            newData.push({idn:idn,v:data[k]});
            if(this.dataReceived.includes(idn))
                this.data[idn] = data[k];
            })
        return newData;
        }
                
}