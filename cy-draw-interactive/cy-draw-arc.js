   import DrawBasic from './cy-draw-basic.js'
   import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawArc extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'arc', mode); //podríamos usarlo para vértice o lado...
        switch(mode){
            case '3P':  this.clickFn = [[this.p0], [this.pm], [this.m1, this.newBlock, this.deleteData]]; break;
            case 'CPA': this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]]; break;
            case '2PR': this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]]; break;
            case '2PC': this.clickFn = [[this.p0], [pm],[this.m1, this.newBlock, this.deleteData]]; break;
        }
        //Secuencias en función del tipo de dibujp
        switch(mode){
            case '3P': this.moveFn = [[this.h], [this.mm, this.draw], [this.m1, this.draw]]; break;
            case 'CPA': this.moveFn = [[this.h], [this.m1, this.draw]]; break;
            case '2PR': this.moveFn = [[this.h], [this.m1, this.draw]]; break;
            case '2PC': this.moveFn = [[this.h],[this.mm, this.draw], [this.m1, this.newBlock, this.draw]]; break;
        }
    }
    data = {subType:this.subMode};
    deleteData = () => {['x0','x1','xm','y0','y1','ym'].forEach(k => delete this.data[k]); this.status = 0;};
    pm = (p) => {this.data.xm = p.x; this.data.ym = p.y; this.status = 2;};
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'arc', data:this.data}}));};
    //Estas son para el move. p0 y m0 se parecen, pero las move no cambian status, se pueden retocar, pero así están separadas
    mm = (pi) => {this.data.xm = pi.x, this.data.ym = pi.y;};
    //Atención al paso por valor y no referencia porque createdraw usa el objeyo para rellenar campos!!!
    draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, createDrawElement('arc', Object.assign({},this.data) ))}
    //Y lo que se manda a input-data de posicines del cursor igual
    dataSent = [['data-x0','data-y0'],['data-xm','data-ym'],['data-x1','data-y1']];
    dataReceived = ['x0','x1','x2','y0','y1','y2','r','a'];
    //TODO, FALTA 2PC

        // this.leftClick = (pi, evt) => {
        //     let p = this.hit || pi;
        //     console.log(this.status);
        //     this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
        // };
        // this.mouseMove = (pi) => {
        //     console.log(this.status);
        //     this.move[this.status].forEach(f => f(pi));
        //     this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'arc', subType:this.subMode,
        //         idn:dataSent[this.status]}}));
        // };

        //Esta es la función de modificación o creación de un circle a partir de inputs, equivale a mouse move o click, según
        //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
        //Por no cambiar de kebab a camel y tal hago el split este
        // this.updateData= (data)=>{
        //     Object.keys(data).forEach(k =>{
        //         const idn = k.split('-')[1];
        //         if(dataReceived.includes(idn))
        //             this.data[idn] = +data[k];  //atton que llegan ascii....
        //         });
        // }

    }