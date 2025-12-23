    
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
//const selectionWidthInPixels = 10;
import DrawBasic from './cy-draw-basic.js'

//el tipo y edges provienen del menu de input-data
export default class DrawPolygon extends DrawBasic{
    constructor(layerDraw) {
        super(layerDraw, 'text', ''); //podríamos usarlo para vértice o lado...
        this.moveFn         = [[], []];
        this.clickFn        = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
        this.dataSent       = [[],[]]
        this.dataReceived   = ['a','name','size','way','radius'];
    }
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, createDrawElement('polygon', this.data ))}
    deleteData = () => {
        this.deleteDataBasic(); };
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //se supone que vienen de una en una
        const value = newData[0].v;
        console.log(idn, value)
        switch(idn){
            case 'a'        : this.textAngle = +value; break;
            case 'name'     : break;
            case 'size'     : break;
            case 'invert'   : break;
            case 'radius'   : this.textRadius = +value; break;
            default: break;
        }
    }
    }

