    
//const selectionWidthInPixels = 10;
import DrawBasic from './cy-draw-basic.js'
import "../opentype.js"
import {textToGeometry, transformTextGeometry} from "../parsers/cy-text-to-geometry.js"
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';

export default class DrawText extends DrawBasic{
    constructor(layerDraw) {
        super(layerDraw, 'text', ''); //podríamos usarlo para vértice o lado...
        this.moveFn         = [[this.draw], []];
        this.clickFn        = [[], []];
        this.dataSent       = [[],[]]
        this.dataReceived   = [];
    }
    //Es como el highlight de la clase base pero sin buscar punto cercano porque aquí no se usa el ratón
    draw = () => {
        this.clear();
        if((this.data.text === undefined) || (this.data.text === '')) return;
        const w = scalePixels2mm( this.draft.pathWidth);             //O selected??
        this.basicGeometry = textToGeometry(this.data.text, this.font, this.data.size);
        this.basicGeometry = (transformTextGeometry(this.basicGeometry, this.data.radius, this.data.a, this.data.way, this.data.invert));
        this.draft.drawBlocks(this.basicGeometry, w, this.draft.pathColor);
    }
    deleteData = () => {
        this.deleteDataBasic(); };
    //Los que se ponen en dataReceived y son numéricos se ponen en la clase base, hay que tratar lo diferentes
    //pero aquí queremos repintar cada vez que haya un cambio, así que los trato aquí
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data); //aquí no hace nada pero lo dejo
        const idn = newData[0].idn;  //se supone que vienen de una en una
        const value = newData[0].v;
        switch(idn){
            case 'a'        : this.data[idn] = (+value)*Math.PI/180; break;
            case 'radius'   :
            case 'size'     : this.data[idn] = +value; break;
            case 'text'     : this.data.text = value; break;
            case 'way'      : this.data.way = value; break;
            case 'invert'   : this.data.invert = value === 'l2r' ? false : true;break;
            case 'font'     :{  
                const buffer = fetch(`/useFont?fontName=${value}`).then((res)=>res.arrayBuffer());
                buffer.then(data => { //Hay que esperar la promesa para dibujar
                    this.font = opentype.parse(data);
                    this.draw();
                    return;
                })  
            }
            break;
            case 'insert':{ //genero un evento por path...
                    this.clear();
                    this.basicGeometry.forEach(path => 
                    this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true,
                        detail:{type:'path', data:path}}))
                    );
 
                    return; //Para que no pase por el redraw
                };
            break;
            case 'escape':
                break;
            default: break;
        }
        this.draw();
    }
    }

