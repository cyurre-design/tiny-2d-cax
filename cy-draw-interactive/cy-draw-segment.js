import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawSegment extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment', submode);
        switch(this.subMode){
            case 'PP':
            case 'PXA':
            case 'PYA': this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]]; break;
            case 'PDA': this.clickFn = [[this.p0, this.newBlock, this.deleteData]]; break;
        }
        //Secuencias en función del tipo de dibujp
        switch(this.subMode){
            case 'PP':
            case 'PXA':
            case 'PYA': this.moveFn = [[this.h], [this.m1, this.draw]]; break;
            case 'PDA': this.moveFn = [[this.m0, this.draw]]; break;
        }
        this.data.subType = submode;
        }
        //Casos posibles: PP, PXA, PYA, PDA, YH, YV (estos tres últimos se pueden juntar, mejor)
        //a y d vendrían de input-data directo en update

        //hay muchas cosas del basic que sirven aquí
        deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
        newBlock = (p) => {
            this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
        draw = (pi) => {this.hit = 
            this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}
       
        dataReceived = ['x0','x1','y0','y1','a','d'];
        //Las funciones de click y move son las de basic
    }