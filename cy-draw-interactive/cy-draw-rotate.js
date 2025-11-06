import {blockRotate} from '../cy-geometry/cy-geometry-library.js';
import DrawBasic from './cy-draw-basic.js'
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawRotate extends DrawBasic{
    constructor(layerDraw, subMode){
        super(layerDraw, 'rotate', subMode);
        this.blocksToRotate = [];
    }
    //Nos valen la mayotía de las funciones del básico, pero no todas
    dataSent = [['data-x0','data-y0'],[]];
    dataReceived = ['x0','y0','a'];
    //Para memorizar los bloques a rotar
    getBlocks = () => {
        this.blocksToRotate = this.layerDraw.getSelectedBlocks();
    }
    //ATTON. los moves no siguen el ratón sino la ventana de intro, por eso se usa el x0,y0 guardado en p0
    move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
        this.hit = this.highLight(pi.x, pi.y, this.blocksToRotate.map(b => blockRotate(b, this.data.x0, this.data.y0, this.data.a * Math.PI / 180)));
    }
    rotate = (p)=>{
        this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
            {bubbles: true, composed:true, detail:{ command:'rotate', data:{x:this.data.x0, y: this.data.y0, a:this.data.a * Math.PI / 180 }}}));
        this.status = 0;    
    };
    clickFn = [[this.p0, this.getBlocks], [this.m1 , this.rotate, this.deleteData ]];
    moveFn = [[this.h], [this.move]];

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