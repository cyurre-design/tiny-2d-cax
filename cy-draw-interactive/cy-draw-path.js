   import DrawBasic from './cy-draw-basic.js'
   import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawPath extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'path', mode);
    }
    data = {subType:'PP'};
    thePath = createDrawElement('path', this.data )
    
    deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.thePath.elements = []; this.data.r = 0; this.status = 0;};
    //updateStatus se llama continuamente tanto en move como en click
    uS = () =>{ //status puede  ir cambiando de 1 a 2 y viceversa...
        if(this.status !== 0){
            if(this.data.r !== 0) {this.status = 2; this.type = 'arc'; this.data.subType = '2PR'}
            else {this.status = 1; this.type = 'segment'; this.data.subType = 'PP'}
        }
    }
    
    changeLastSegment = (p) => {this.thePath.elements.pop(); this.thePath.elements.push(createDrawElement('path', this.data))}
    newSegment = (p) => {this.thePath.elements.push(createDrawElement('path', this.data))}
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, this.thePath)}
    //Y lo que se manda a input-data de posicines del cursor igual
    dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],['data-x1','data-y1']];
    dataReceived = ['x0','x1','y0','y1','r'];
    //Esto es especifico de path, se termina desde button o tecla, en el futuro
    end = ()=>{
        this.thePath.elements.pop(); //el tramo desde el último hasta donde hago click
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'path', data:this.thePath}}));
        this.deleteData();
    };
    back = ()=>{
        this.thePath.elements.pop(); //el tramo desde el último hasta donde hago click
        const last = this.thePath.elements.length-1;
        if(last < 0)
            this.deleteData();
        else{
            const el = this.thePath.elements[last]; //el tramo anterior
            this.data.x0 = el.x0; this.data.y0 = el.y0;
        }
    }
    //del = () => {deleteData()}
    
    
    //Secuencias en función del tipo de dibujp
    clickFn = [[this.p0],[this.m1, this.changeLastSegment, this.p0, this.m1, this.newSegment],[this.m1, this.changeLastSegment, this.p0, this.m1, this.newSegment]];
    //Secuencias en función del tipo de dibujp
    moveFn = [[this.h], [this.h, this.m1, this.changeLastSegment, this.draw], [this.h, this.m1, this.changeLastSegment, this.draw]];

    leftClick(pi, evt){
        this.uS();
        super.leftClick(pi, evt)
        // let p = this.hit || pi;
        // updateStatus();
        // this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    };
    mouseMove(pi) {
        this.uS();
        super.mouseMove(pi);
        // this.move[this.status].forEach(f => f(pi));
        // this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'segment', subType:this.subMode,
        //     idn:dataSent[this.status]}}));
    };
 

        //Esta es la función de modificación o creación de un circle a partir de inputs, equivale a mouse move o click, según
        //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
        //Por no cambiar de kebab a camel y tal hago el split este
        // this.updateData= (data)=>{
        //     Object.keys(data).forEach(k =>{
        //         const idn = k.split('-')[1];
        //         if(dataReceived.includes(idn))
        //             this.data[idn] = data[k];
        //         else if(['end','back','del'].includes(idn))
        //             this[idn]();
        //             console.log(idn);
        //         });
        // }


    }