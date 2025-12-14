import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {pathOrientation} from '../cy-geometry/cy-geo-elements/cy-path.js'
export default class DrawExportGcode extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'file', mode);
        this.data = {subType:'exportISO'};
        this.paths = []; //uno vacío  
        //Aquí no se maneja el ratón... pero tiene sentido recibir el texto y dibujarlo comos si fuera un path con ratón
        //No sé si se podrán mezclar amboas cosas, por ejemplo que cada click envíe el punto al texto....
        this.moveFn = [[this.hover],[]];   
        this.clickFn = [[this.select, this.draw],[]];
        this.dataSent = [[],["way", "mark"]];
        this.dataReceived = ['save', 'escape'];
    }
    //-------------- COPIADO DE SELECT, igual se pueden poner en basic !?
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        return this.layerDraw.hover(pi.x, pi.y, undefined, false);
    };
    //Al hacer click pasa de hover a selected
    select = (pi) => {
        let found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if(found === undefined) return
        found = found[0];
        if(found.type === 'path'){
            this.data.way = pathOrientation(found);
            this.data.mark = {type:"cut-point", x0:found.elements[0].x0, y0:found.elements[0].y0};
        }
        this.status = 1;
    }
    draw = (pi) => {this.hit = this.highLight(this.mark.x0, this.mark.y0/*, this.mark*/)}
    
    //Salvar generando iso
    save = () => {
        this.deleteData();
    };
   
    deleteData = () => {
        this.deleteDataBasic([]),
        this.paths = [];
        this.clear();
    }
    //Aquí me va a venir lo que se escriba..
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        //console.log(data);
        switch(idn){
            //case 'back' : this.back();  break;
            case 'save'  :  this.deleteData(); break;
            //case 'del'  : this.deleteData();   break;
            case 'escape': //this.leftClick({x:this.data.x1 , y:this.data.y1}); break;
            }
            console.log('viene')
        }
    }