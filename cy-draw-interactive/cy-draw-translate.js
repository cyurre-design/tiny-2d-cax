import {blockTranslate} from '../cy-geometry/cy-geometry-library.js';
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
import DrawBasic from './cy-draw-basic.js'
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawTranslate extends DrawBasic{
    constructor(layerDraw, subMode){
        super(layerDraw, 'translate', subMode);
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
    
    //p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    getBlocks = ()=> this.blocksToMove = this.layerDraw.getSelectedBlocks();
    //h  = (pi) => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    //m0 = (pi) => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    //m1 = (pi) => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
        this.hit = this.highLight(pi.x, pi.y, this.blocksToMove.map(b => blockTranslate(b, pi.x - this.data.x0, pi.y - this.data.y0)));
    }
    translate = (p)=>{
        this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
            {bubbles: true, composed:true, detail:{ command:'translate', data:{dx:this.hit.x - this.data.x0, dy: this.hit.y - this.data.y0}}}));
        //this.status = 0;    
    };
    //Insertar los bloques como copia con o sin borrado, sería un flag
    //const translate = (p) => {
        //this.layerDraw.translateSelected(this.hit.x-this.data.x0, this.hit.y-this.data.y0, true); //flag de copia o move
    //}
    clickFn = [[this.p0, this.getBlocks], [this.m1 , this.translate, this.deleteData ]];
    moveFn = [[this.h], [this.h, this.move], []];

    updateData(data){
        const newData = super.updateData(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'enter': this.translate(); this.status=0; move({x:this.data.x1 , y:this.data.y1});break;
            case 'esc'  : this.status = 0;   break;
            case 'x0'   :
            case 'y0'   : this.p0({x:this.data.x0 , y:this.data.y0});
            case 'x1'   :
            case 'y1'   : this.move({x:this.data.x1 , y:this.data.y1});
        }
    }

}