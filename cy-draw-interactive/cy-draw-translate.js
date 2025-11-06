import {blockTranslate} from '../cy-geometry/cy-geometry-library.js';
import DrawBasic from './cy-draw-basic.js'
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawTranslate extends DrawBasic{
    constructor(layerDraw, subMode){
        super(layerDraw, 'translate', subMode);
    }
    //Nos valen la mayotía de las funciones del básico
 
    getBlocks = ()=> this.blocksToMove = this.layerDraw.getSelectedBlocks();
    move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
        this.hit = this.highLight(pi.x, pi.y, this.blocksToMove.map(b => blockTranslate(b, pi.x - this.data.x0, pi.y - this.data.y0)));
    }
    translate = (p)=>{
        this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
            {bubbles: true, composed:true, detail:{ command:'translate', data:{dx:this.hit.x - this.data.x0, dy: this.hit.y - this.data.y0}}}));
        this.status = 0;    
    };
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