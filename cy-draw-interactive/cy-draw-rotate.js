import {blockRotate} from '../cy-geometry/cy-geometry-library.js';
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
import DrawBasic from './cy-draw-basic.js'
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawRotate extends DrawBasic{
    constructor(layerDraw, subMode){
        super(layerDraw, 'rotate', subMode);
        this.blocksToRotate = [];
    }
    //Nos valen la mayotía de las funciones del básico
    //deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};

    //dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],[]];
    //dataReceived = ['x0','x1','y0','y1'];
    //Aunque hay funciones repetidas, queda más claro que el módulo sea autocontenido o el 90%
        //Al final las operaciones básicas son visualizar el punto, almacenar el punto, actualizar el status, importar data...
    //Y luego hay funciones que serán específicas, como el bloque y modo de dibujo, borrado, etc...
    // highLight = (x,y,blocks) => {
    //     let w = scalePixels2mm( this.layerDraw.pathWidth);             //O selected??
    //     const point = this.layerDraw.getNearestPoint(x, y, 10*w);        //El 5 a settings TODO
    //     this.draft.drawBlocks(point, blocks);
    //     return( {x : point.x0, y : point.y0});
    // }
    dataSent = [['data-x0','data-y0'],[]];
    dataReceived = ['x0','y0','a'];
    //p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    getBlocks = () => {
        this.blocksToRotate = this.layerDraw.getSelectedBlocks();
    }
    //h  = (pi) => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    //m0 = (pi) => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    //m1 = (pi) => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
        this.hit = this.highLight(pi.x, pi.y, this.blocksToRotate.map(b => blockRotate(b, this.data.x0, this.data.y0, this.data.a * Math.PI / 180)));
    }
    rotate = (p)=>{
        this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
            {bubbles: true, composed:true, detail:{ command:'rotate', data:{x:this.hit.x, y: this.hit.y, a:this.data.a * Math.PI / 180 }}}));
        //this.status = 0;    
    };
    //Insertar los bloques como copia con o sin borrado, sería un flag
    //const translate = (p) => {
        //this.layerDraw.translateSelected(this.hit.x-this.data.x0, this.hit.y-this.data.y0, true); //flag de copia o move
    //}
    clickFn = [[this.p0, this.getBlocks], [this.m1 , this.rotate, this.deleteData ]];
    moveFn = [[this.h], [this.h]];

    updateData(data){
        const newData = super.updateData(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'enter': this.rotate(); this.status=0; this.move({x:this.data.x0 , y:this.data.y0});break;
            case 'esc'  : this.status = 0;   break;
            case 'x0'   :
            case 'y0'   : this.p0({x:this.data.x0 , y:this.data.y0});break;
            case 'a' : this.move({x:this.data.x0 , y:this.data.y0});break;
        }
    }

}