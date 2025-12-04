import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {segmentTangentToArc, distancePointToPoint } from '../cy-geometry/cy-geometry-library.js';

export default class DrawSegmentPB extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-TPB', submode);
        this.block = undefined;
        this.data.subType = 'PP';   //para el segmento interactivo
        this.moveFn         = [[this.h], [this.m1, this.draw, this.hover]];
        this.clickFn        = [[this.p0], [this.tangent, this.newBlock, this.deleteData, this.clear]];
        this.dataSent       = [['data-x0','data-y0'],[],[]];     
        this.dataReceived   = ['x0','y0'];        }
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    //en el click el pi está normalizado a rejilla, así que podría no encontrara el bloque incluso estando encima
    // del punto del move!!! por eso no se debe usar en esas condiciones
    hover = (pi) => {
        this.block = undefined; //default
        this.enabled = false;    //Hasta que haya bloque no permitimos acciones del click
        let b = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(!b) return;
        if((b[0].type !== 'circle') && (b[0].type !== 'arc')) return;
        this.block = b[0];
        this.enabled = true;
    };
    //El hover ya garantiza que el bloque es del tipo circle o arc o undefined
    tangent = (pi) => { 
        if(!this.block) return;
        let sol = segmentTangentToArc(this.block, this.data.x0, this.data.y0);
        if(sol.length < 2) return;  //Esto es un caso degenerado que en interactivo no tiene sentido
        //Cojo la solución más cercana al punto de click
        sol = (distancePointToPoint(sol[0].x, sol[0].y, pi.x, pi.y) > distancePointToPoint(sol[1].x, sol[1].y, pi.x, pi.y)) ? sol[1] : sol[0];
        this.data = Object.assign(this.data,  {x1:sol.x, y1:sol.y});
    }
    //hay muchas cosas del basic que sirven aquí
    deleteData = () => {
        this.deleteDataBasic(['x0','y0']);
        this.block = undefined;
    }
    updateData = (data) => this.updateDataBasic(data);
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    draw = (pi) => {this.hit = 
        this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}       
    }