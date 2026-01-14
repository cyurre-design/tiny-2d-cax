import DrawBasic from './cy-draw-basic.js'
import { pathSetStartPoint, pathReverse } from '../cy-geometry/cy-geo-elements/cy-path.js'
//import {pathOrientation} from '../cy-geometry/cy-geo-elements/cy-path.js'

/**
 * Tanto por filosofía (no tocar la geometría porque podemos querer hacer otras cosas)
 * como por sencillez (Si se tocan los paths las rutinas de hover, highlight y tal no furrulan)
 * Dejamos la estructura como está y guardamos la info para hacer las transformaciones cuando
 * se vaya a generar el iso. Así podemo hacer un perfil interior a izquierdas y otro exteerior a
 * derechas con la misma geometría...o así
 */
export default class DrawBoolean extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'boolean', mode);
        this.data = {subType:mode};
        this.paths = [];

        this.moveFn = [[this.hover, this.draw], []];   
        this.clickFn = [[this.select, this.draw], []];
        this.dataSent = [[], []];
        this.dataReceived = [];
    }
    //generar una flechita al comienzo de un path. Local, no compruebo que es un path
    //Sería más limpio un método de segmento y arco, como getUnitVector o así
    createArrow(path){
        const b = path.elements[0];
        let ux,uy,x0,y0;
        if(b.type === 'segment'){
            ux = b.ux; uy = b.uy;
            x0 = b.x0; y0 = b.y0;
        } else if(b.type === 'arc'){
            uy = Math.cos(b.ai); ux = -Math.sin(b.ai);
            x0 = b.x1; y0 = b.y1;
        } else if(b.type === 'bezier'){
            const dx = b.cp1x - b.x0, dy = b.cp1y - b.y0;
            const d = Math.hypot(dx,dy);
            ux = dx / d; uy = dy / d;
            x0 = b.x0; y0 = b.y0;
        }
        return ({type:'arrow', x0:x0, y0:y0, dx:ux, dy:uy})
    }
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        return this.layerDraw.hover(pi.x, pi.y, undefined, false);
    };
    //Al hacer click pasa de hover a selected
    select = (pi) => {
        const found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if(found === undefined) return
        if((found[0].type !== 'path') && (found[0].type !== 'polygon'))return undefined
        this.paths.push(found[0]);
        return found[0];
    }
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, this.arrows);
        //this.draft.drawNumber(this.arrows.map((arrow, ix) => ({x0:arrow.x0, y0:arrow.y0, text:'p' + (this.order[ix]+1)})));
        } 
    deleteData = () => {
        this.deleteDataBasic([]),
        this.paths = [];
        this.clear();        
    }
    //Aquí me va a venir lo que se escriba..
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        const value = newData[0].v;
        switch(idn){
            case 'and'     :
            case 'or'      :
            case 'not'     :
            case 'xor'     :{
                if(this.paths.length < 2 ) break;
                this.layerDraw.dispatchEvent(
                    new CustomEvent('boolean-op', {bubbles: true, composed:true, detail:{ mode: idn, paths:this.paths}}));
                this.deleteData();
                break;
            }
            case 'save'  :  
                break;
            case 'end': 
                break;
            default: break;
            }
        }
    }