import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
//el tipo y edges provienen del menu de input-data
export default class DrawCircle extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'circle', mode);
        this.data = {subType:this.subMode};
        switch(mode){
            case '3P': {
                this.moveFn = [[this.h], [this.m1, this.draw], [this.m2, this.draw]];
                this.clickFn = [[this.p0], [this.p1], [this.p3, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1'],['x2','y2']];
                this.dataReceived =['x0','y0','x1','y1','x2','y2']
            } break;
            case 'CP': {
                this.moveFn = [[this.h], [this.m1, this.draw]];
                this.clickFn = [[this.p0], [this.p1, this.newBlock, this.deleteData]]; 
                this.dataSent = [['x0','y0'],['x1','y1']];
                this.dataReceived =['x0','y0','x1','y1']
            } break;
            case '2PR': {
                this.moveFn = [[this.h], [this.m1, this.draw]];
                this.clickFn= [[this.p0], [this.p1, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1']];
                this.dataReceived = ['x0', 'y0', 'x1','y1', 'r']
             } break;
            case 'CR': {
                this.moveFn = [[this.m0, this.draw]];
                this.clickFn = [[this.p0, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],[]];
                this.dataReceived = ['x0', 'y0', 'r']
            } break;
        }
    }
    deleteData = () => {
        this.deleteDataBasic(['cx', 'cy', 'x0','x1','x2','y0','y1','y2']);
    }
    updateData = (data)=>
        this.updateDataBasic(data);

    p1  = (p) => {this.data.x1 = p.x; this.data.y1 = p.y; this.status = 2;};
    p3  = (p) => {this.data.x2 = p.x;this.data.y2 = p.y;}
        //Mandamos el subType o mode para orientar al create
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'circle', data:this.data}}));};
    m2  = (pi) => {this.data.x2 = pi.x, this.data.y2 = pi.y;};
    draw= (pi) => {this.hit = this.highLight(pi.x, pi.y, createDrawElement('circle', this.data ))}
        //Y lo que se manda a input-data de posicines del cursor igual
    }