import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawSymmetry extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'symmetry', mode);
        this.data = {subType:mode};    
        //Secuencias en función del tipo de dibujo
        switch(mode){
            case 'X':{
                this.moveFn         = [[this.drawAxis]];
                this.clickFn        = [[this.symmetryXY]]
                this.dataSent       = [['x0','y0']];
                this.dataReceived   = ['y0'];
            } break;
            case 'Y':{
                this.moveFn         = [[this.drawAxis]];
                this.clickFn        = [[this.symmetryXY]]
                this.dataSent       = [['x0','y0']];
                this.dataReceived   = ['x0'];
            } break;
            case 'L':{
                this.moveFn         = [[this.hover]];
                this.clickFn        = [[this.symmetryL]];
                this.dataSent       = [['data-x0','data-y0']];
                this.dataReceived   = [];
            }
        }
    }
//      deleteData = () => {['x0','y0'].forEach(k => delete this.data[k]); this.status = 0;};
        //simetría en X o Y, ayudamos pintando un eje
    drawAxis = (pi) => {
        const ww = this.layerDraw.extents;
        let blocks;
        switch(this.subMode){
            case 'X': blocks = [{type:'segment', x0:ww.xi, y0:pi.y, x1:ww.xf, y1:pi.y}];break;
            case 'Y': blocks = [{type:'segment', x0:pi.x, y0:ww.yi, x1:pi.x, y1:ww.yf}];break;
        } 
        this.hit = this.highLight(pi.x, pi.y, blocks);
    };
    //Caso de simetría general, mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {   
            const found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        };
        //Al hacer click pasa de hover a selected. Esta sirve para los tres tipos
    symmetryL = (pi) => {
        const found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(found && found.length>0){
            if(found[0].type==='segment'){
                this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform', {bubbles: true, composed:true,
                                            detail:{ command:'symmetry', mode:this.subMode, data:found[0]}}));};
            }
        }
    symmetryXY = (pi) => { this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform', {bubbles: true, composed:true,
                                            detail:{ command:'symmetry', mode:this.subMode, data:{x0:this.hit.x, y0:this.hit.y}}}));};
        //Y lo que se manda a input-data de posicines del cursor igual (mando las dos aunque solo se pinta la que toca)
    updateData = (data) => this.updateDataBasic(data);
    }