import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawSelection extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'select', mode);

        this.data = {subType:mode};
        this.moveFn         = [[this.m0, this.move, this.hover], [this.m1, this.draw]];
        this.clickFn        = [[this.m0, this.select], [this.m1, this.selectBlocks, this.deleteData, this.clear]];
        this.dataSent       = [['x0','y0'],['x1','y1']];
        this.dataReceived   = ['x0','y0','x1','y1'];
    }
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        return this.layerDraw.hover(pi.x, pi.y, undefined, false);
    };
    //Al hacer click pasa de hover a selected
    select = (pi) => {
        const found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if(!found || found.length === 0)
            this.status = 1; //Comienzo un box porque he pinchado en zona libre
    }
    //Mientras hacemos el box se va poniendo hover de forma interactiva
    //Evitamos usar el layerDraft que no es conocido
    move = (pi) => {this.hit = pi/*this.highLight(pi.x, pi.y, undefined)*/};
    draw = (pi) => {  
        this.hit = this.highLight(pi.x, pi.y, createDrawElement('bbox', this.data))
        //this.layerDraw.hover(pi.x, pi.y, bbox, false);
    }
    //Y al dar click pasan de hover a selected ls que estén dentro del box
    selectBlocks = (p) => {
        //this.layerDraft.clear();
        const bbox = createDrawElement('bbox', this.data);
        this.layerDraw.hover(p.x, p.y, bbox, true);
    }

    updateData = (data) => {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'x0'   :
            case 'y0'   : 
            case 'x1'   :
            case 'y1'   : this.mouseMove({x:this.data.x1 , y:this.data.y1});
        }
        }
    }