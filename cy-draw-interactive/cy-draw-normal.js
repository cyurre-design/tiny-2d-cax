import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {pointProyectedToSegment, cutSegmentToCircle, distancePointToPoint } from '../cy-geometry/cy-geometry-library.js';

export default class DrawNormal extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-normal', submode);
        this.block = undefined;
        this.data.subType = 'PP';
        //Secuencias en función del tipo de dibujp
        //el this.h del final implica borrado, solo se ejecutará una vez porque se pone status a 0 en deleteData
        this.moveFn = [[this.h, this.hover], [this.m1, this.normal, this.draw]];
        this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData, this.h]];    
        this.dataSent = [[],['x0','y0'],[]];     
        this.dataReceived = ['x0','y0'];
    }        
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    //en el click el pi está normalizado a rejilla, así que podría no encontrara el bloque incluso estando encima
    // del punto del move!!! por eso no se debe usar en esas condiciones
    hover = (pi) => {
        this.block = undefined; //default
        this.enabled = false;    //Hasta que haya bloque no permitimos acciones del click
        let b = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(!b) return;
        if((b[0].type !== 'circle') && (b[0].type !== 'arc') && (b[0].type !== 'segment')) return;
        this.block = b[0];
        this.enabled = true;
    };
    normal = (pi) => {
        if(this.block.type === 'segment'){
            this.data = Object.assign(this.data,  pointProyectedToSegment(this.block, pi.x, pi.y));        
        } else if((this.block.type === 'circle') || (this.block.type === 'arc')){
            const s = createDrawElement('segment',{subType:'PP', x0:this.block.cx, y0:this.block.cy, x1: pi.x, y1:pi.y})
            const sols = cutSegmentToCircle(s, this.block);
            let sol = (distancePointToPoint(sols[0].x, sols[0].y, pi.x, pi.y) > distancePointToPoint(sols[1].x, sols[1].y, pi.x, pi.y)) ? sols[1] :sols[0];
            this.data = Object.assign(this.data,  {x0:sol.x, y0:sol.y}, {x1:pi.x, y1:pi.y});
        }
        //el x1,y1 lo pone this.m1
    }
    //hay muchas cosas del basic que sirven aquí
    deleteData = () => {
        this.deleteDataBasic(['x0','x1','y0','y1']); this.block = undefined;};
    updateData = (data) => 
        this.updateDataBasic(data);
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    draw = (pi) => {this.hit = 
        this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])
    }   
}