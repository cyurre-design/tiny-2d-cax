import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {gcodeToGeometry} from '../parsers/cy-parser-gcode-tiny.js'

export class DrawGcode extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'path', mode);
        this.data = {subType:'ISO'};
        this.paths = [createDrawElement('path',{elements:[]} )]; //uno vacío  
        //Aquí no se maneja el ratón... pero tiene sentido recibir el texto y dibujarlo comos si fuera un path con ratón
        //No sé si se podrán mezclar amboas cosas, por ejemplo que cada click envíe el punto al texto....
        this.moveFn = [[this.drawBlocks]];   
        this.clickFn = [[this.m0, this.drawBlocks]];
        this.dataSent = [[]];
        this.dataReceived = ['text'];
    }

    //draw = (pi) => {this.highLight(pi.x, pi.y, this.paths)}
    drawBlocks = () => {
        this.draft.drawBlocks(this.paths)}
    //Esto es especifico de path, se termina desde button o tecla, en el futuro
    end = () => {
        this.paths.forEach( p => 
            this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'path', data:p}})));
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
            case 'insert'  : this.end();  this.deleteData(); break;
            case 'escape': this.leftClick({x:this.data.x1 , y:this.data.y1}); break;
            case 'gcode' : {
                this.paths = gcodeToGeometry(newData[0].v);
                this.highLight(0, 0, this.paths);
            } break;
            }
        }
    }