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
export default class DrawExportGcode extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'file', mode);
        this.data = {subType:'exportISO'};

        this.truePaths = this.layerDraw.getSelectedBlocks().filter( b => b.type === 'path');
        this.paths = [];
        this.paths.push(...this.truePaths); //son los punteros, creo
        this.arrows = this.paths.map( p => this.createArrow(p)); //mismos índices
//        this.data.startPoints = this.paths.map( p => p.elements[0].pi); //mismos índices
//        this.data.invert = this.paths.map(p => false); //chapucilla 

        this.startChange = false;
        this.invertMode = false;
        this.moveFn = [[this.hover, this.draw],[this.draw]];   
        this.clickFn = [[this.action, this.draw],[this.start]];
        this.dataSent = [[],["way"]];
        this.dataReceived = ['order'];
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
        }
        return ({type:'arrow', x0:x0, y0:y0, dx:ux, dy:uy})
    }
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        return this.layerDraw.hover(pi.x, pi.y, undefined, false);
    };
    //Al hacer click 
    getPath = (pi) => {
        let found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(found === undefined) return
        if(found[0].type !== 'path') return undefined
        const pathIx = this.truePaths.findIndex(p => (p === found[0]))
        return pathIx < 0 ? undefined : pathIx;
    }

    //Las funciones de invert y reverse devuelven paths nuevos
    //Eso hace que el iso haya que generarlo con el array this.paths
    action = (pi) => {  //Según el modo puesto en la pantalla
        const pathIx = this.getPath(pi);
        if(pathIx === undefined) return;
        if(this.startChange === true){
            this.paths[pathIx] = pathSetStartPoint(this.paths[pathIx], this.hit);
        } else if(this.invertMode === true){
            this.paths[pathIx] = pathReverse(this.paths[pathIx]);
        }
        //Hay que cambiar las flechitas
        this.arrows[pathIx] = this.createArrow(this.paths[pathIx]);
        this.draw(this.hit);
    }
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, this.arrows);
        this.draft.drawNumber(this.arrows.map((arrow, ix) => ({x0:arrow.x0, y0:arrow.y0, text:'p' + (ix+1)})));
        }
 
    deleteData = () => {
        this.deleteDataBasic([]),
        this.paths = [];
        this.path = undefined;
        //this.layerDraw.hover(this.pathPoint.x, this.pathPoint.y, undefined, true); //Deselecciona 1 path
        this.clear();
        
    }
    //Aquí me va a venir lo que se escriba..
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        const value = newData[0].v;
        switch(idn){
            case 'order': break;
            case 'tol' : this.data.bezierTolerance = +value; break;
            case 'invert'  :
                this.startChange = false;
                this.invertMode = true
                break;
            case 'start'    :
                this.startChange = true;
                this.invertMode = false
                break;
            case 'save'  :  
                this.data.paths = this.paths;
                this.layerDraw.dispatchEvent(new CustomEvent('generate-iso', { bubbles: true , composed:true, detail:this.data}));
                //this.deleteData();
                break;
            case 'escape': //this.leftClick({x:this.data.x1 , y:this.data.y1}); break;
            default: this.data[idn] = value;
            }
        }
    }