import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawSelection extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'select', mode);

        this.data = {subType:mode};
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

    //Y lo que se manda a input-data de posicines del cursor igual
    //dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
    clickFn = [[this.m0, this.select], [this.m1, this.selectBlocks, this.deleteData, this.clear]];
    moveFn = [[this.m0, this.move, this.hover], [this.m1, this.draw]];

    updateData(data)  {
        const newData = super.updateData(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'x0'   :
            case 'y0'   : 
            case 'x1'   :
            case 'y1'   : this.mouseMove({x:this.data.x1 , y:this.data.y1});
        }
        }
    }