import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {gcodeToGeometry} from '../parsers/cy-parser-gcode-tiny.js'

export default class DrawGcode extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'path', mode);
        this.data = {subType:'ISO'};
        this.paths = [createDrawElement('path',{elements:[]} )]; //uno vacío  
        //Aquí no se maneja el ratón... pero tiene sentido recibir el texto y dibujarlo comos si fuera un path con ratón
        //No sé si se podrán mezclar amboas cosas, por ejemplo que cada click envíe el punto al texto....
        this.moveFn = [[this.draw]];   
        // 1.en m1 guardamos la nueva cota, 
        // 2.en pop, seguido de new segment, actualizamos el último segmento visto
        // 3.con p0 y m1 y newSegment ponemos el nuevo segmento que va a moverse (que empezará con longitud 0 porque p0 y m1 reciben el mismo punto)
        this.clickFn = [[this.m0, this.newSegment, this.draw]];
        this.dataSent = [['x0','y0']];
        this.dataReceived = ['text'];
    }

    draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, this.paths)}
    
    //Esto es especifico de path, se termina desde button o tecla, en el futuro
    end(){
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'path', data:this.paths}}));
        this.deleteData();
    };
   
    deleteData = () => {
        this.deleteDataBasic(['x0','y0','x1','y1']),
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
            case 'end'  : this.end();  this.deleteData(); break;
            //case 'del'  : this.deleteData();   break;
            case 'enter': this.leftClick({x:this.data.x1 , y:this.data.y1}); break;
            case 'input' : {
                console.log(newData);
                this.paths = gcodeToGeometry(newData[0].v);
                this.highLight(0, 0, this.paths);
            } break;
            //case 'x'   :
            //case 'y'   : 
            //case 'x1'   :
            //case 'y1'   : this.mouseMove({x:this.data.x1 , y:this.data.y1});
            }
        }
    }