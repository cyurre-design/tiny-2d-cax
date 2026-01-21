import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
//el tipo y edges provienen del menu de input-data
export class DrawPolygon extends DrawBasic{
    constructor(layerDraw) {
        super(layerDraw, 'polygon', ''); //podríamos usarlo para vértice o lado...
        this.moveFn         = [[this.h, this.m0, this.sendDataBasic], [this.h, this.m1, this.sendDataBasic, this.draw]];
        this.clickFn        = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
        this.dataSent       = [['x0','y0'],['x1','y1']]
        this.dataReceived   = ['x0','x1','y0','y1','edges','vertex'];
    }
    newBlock = (p) => {this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'polygon', data:this.data}}));};
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, createDrawElement('polygon', this.data ))}
    deleteData = () => {
        this.deleteDataBasic(['x0','x1','y0','y1','cx','cy']); this.block = undefined;};
    updateData = (data) =>{ 
        const newData = this.updateDataBasic(data);
        console.log(this.data.edges)
        this.data.subType = this.data['vertex'] === 0 ? 'H' : 'R';
        console.log(this.data.subType)
    }
    }

