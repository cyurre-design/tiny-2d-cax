import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {pointProyectedToSegment, cutSegmentToCircle, distancePointToPoint} from '../cy-geometry/cy-geometry-library.js';

export default class DrawNormal extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-normal', submode);
        this.block = undefined;
        this.data.subType = 'PP';
        }
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        const b = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(b) 
            this.block = b[0];
    };
    normal = (pi) => {
        if(this.block.type === 'segment'){
            this.data = Object.assign(this.data,  pointProyectedToSegment(this.block, pi.x, pi.y));        
        } else if((this.block.type === 'circle') || (this.block.type === 'arc')){
            const s = createDrawElement('segment',{subType:'PP', x0:this.block.cx, y0:this.block.cy, x1: pi.x, y1:pi.y})
            const sols = cutSegmentToCircle(s, this.block);
            let sol;
            if(distancePointToPoint(sols[0].x, sols[0].y, pi.x, pi.y) > distancePointToPoint(sols[1].x, sols[1].y, pi.x, pi.y))
                sol = sols[1];
            else 
                sol = sols[0]
            this.data = Object.assign(this.data,  {x0:sol.x, y0:sol.y});
        }
        //el x1,y1 lo pone this.m1
    }
    //hay muchas cosas del basic que sirven aquí
    deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    draw = (pi) => {this.hit = 
        this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}
        //el this.h del final implica borrado, solo se ejecutará una vez porque se pone status a 0 en deleteData
    clickFn = [[this.p0, this.hover], [this.m1, this.newBlock, this.deleteData, this.h]];
    //Secuencias en función del tipo de dibujp
    moveFn = [[this.hover], [this.m1, this.normal, this.draw]];
    
    dataReceived = ['x0','x1','y0','y1','a','d'];
    //Las funciones de click y move son las de basic
    }