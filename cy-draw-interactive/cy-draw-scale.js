import {blockScale} from '../cy-geometry/cy-geometry-library.js';
import DrawBasic from './cy-draw-basic.js'
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export default class DrawScale extends DrawBasic{
    constructor(layerDraw, subMode){
        super(layerDraw, 'scale', subMode);
        this.blocksToScale = [];
    }
    //Nos valen la mayotía de las funciones del básico, pero no todas
    dataSent = [['data-x0','data-y0'],[]];
    dataReceived = ['x0','y0','s'];
    //Para memorizar los bloques a rotar
    getBlocks = () => {
        this.blocksToScale = this.layerDraw.getSelectedBlocks();
    }
    //ATTON. los moves no siguen el ratón sino la ventana de intro, por eso se usa el x0,y0 guardado en p0
    move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
        this.hit = this.highLight(pi.x, pi.y, this.blocksToScale.map(b => blockScale(b, this.data.x0, this.data.y0, this.data.s)));
    }
    scale = (p)=>{
        this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
            {bubbles: true, composed:true, detail:{ command:'scale', data:{x:this.data.x0, y: this.data.y0, s:this.data.s }}}));
        this.status = 0;    
    };
    clickFn = [[this.p0, this.getBlocks], [this.m1 , this.scale, this.deleteData ]];
    moveFn = [[this.h], [this.move]];

    updateData(data){
        const newData = super.updateData(data);
        newData.forEach(d => {  //no esperamos más que una pulsación...pero si viene la s se atiende aquí
        switch(d.idn){
            case 'enter': this.scale(); this.status=0; this.move({x:this.data.x0 , y:this.data.y0});break;
            case 'esc'  : this.status = 0;   break;
            case 'x0'   :
            case 'y0'   : break; //ya se pone en la clase base data
            case 's'    : this.move({x:this.data.x0 , y:this.data.y0});break;
            }
        })
    }

}