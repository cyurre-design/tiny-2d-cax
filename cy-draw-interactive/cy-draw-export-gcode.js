import DrawBasic from './cy-draw-basic.js'
import { pathSetStartPoint, pathReverse } from '../cy-geometry/cy-geo-elements/cy-path.js'
//import {pathOrientation} from '../cy-geometry/cy-geo-elements/cy-path.js'
export default class DrawExportGcode extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'file', mode);
        this.data = {subType:'exportISO'};
        this.paths = []; //uno vacío 
        this.path = undefined; 
        this.arrow = undefined;
        this.startChange = false;
        this.moveFn = [[this.hover],[this.draw]];   
        this.clickFn = [[this.select, this.draw],[this.start]];
        this.dataSent = [[],["way"]];
        this.dataReceived = ['save', 'escape'];
    }
    //generar una flechita al comienzo de un path. Local, no compruebo que es un path
    //Sería más limpio un método de segmento y arco, como getUnitVector o así
    createArrow(path){
        //this.data.way = pathOrientation(found);
        const b = path.elements[0];
        let ux,uy,x0,y0;
        if(b.type === 'segment'){
            ux = b.ux; uy = b.uy;
            x0 = b.x0; y0 = b.y0;
        } else if(b.type === 'arc'){
            uy = Math.cos(b.ai); ux = -Math.sin(b.ai);
            x0 = b.x1; y0 = b.y1;
        }
        console.log(ux,uy);
        return ({type:'arrow', x0:x0, y0:y0, dx:ux, dy:uy})
    }
    //-------------- COPIADO DE SELECT, igual se pueden poner en basic !?
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    hover = (pi) => {
        return this.layerDraw.hover(pi.x, pi.y, this.arrow, false);
    };
    //Al hacer click pasa de hover a selected
    select = (pi) => {
        let found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if(found === undefined) return
        found = found[0];
        if(found.type === 'path'){
            this.path = found;
            this.arrow = this.createArrow(this.path);
            this.status = 1;
        }
    }
    //Sólo se llama con status === 1, pero porsiacaso
    start = (pi)    => {
        if(this.status !== 1) return;
        if(!this.startChange) return; //No se pone el modo con la tecla start
        //En move estoy haciendo draw, así que miro con this.hit que debería estar sobre el path
        const changed = pathSetStartPoint(this.path, this.hit);
        if(changed !== undefined){
            this.path = changed;
            this.startChange = false;
            this.arrow = this.createArrow(this.path);
            this.draw(this.hit);
        }
    }
    draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, this.arrow)}
    
    //Salvar generando iso
    save = () => {
        this.deleteData();
    };
   
    deleteData = () => {
        this.deleteDataBasic([]),
        this.paths = [];
        this.path = undefined;
        this.clear();
    }
    //Aquí me va a venir lo que se escriba..
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'invert'  :
                this.path = pathReverse(this.path);
                this.arrow = this.createArrow(this.path);
                this.draw(this.hit);
                break;
            case 'start'    :
                this.startChange = true;
                break;
            case 'save'  :  this.deleteData(); break;
            case 'escape': //this.leftClick({x:this.data.x1 , y:this.data.y1}); break;
            }
        }
    }