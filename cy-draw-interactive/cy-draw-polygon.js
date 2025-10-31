import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
//el tipo y edges provienen del menu de input-data
export default class DrawPolygon extends DrawBasic{
    constructor(layerDraw) {
        super(layerDraw, 'polygon', ''); //podríamos usarlo para vértice o lado...
    }
    newBlock = (p) => {this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'polygon', data:this.data}}));};
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, createDrawElement('polygon', this.data ))}
    //Y lo que se manda a input-data de posicines del cursor igual
    //const dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
    dataReceived = ['x0','x1','y0','y1','edges','subType'];
    clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
    moveFn  = [[this.h], [this.m1, this.draw]];

    }

