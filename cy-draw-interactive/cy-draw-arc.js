   import DrawBasic from './cy-draw-basic.js'
   import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawArc extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'arc', mode); //podríamos usarlo para vértice o lado...
        switch(mode){
            case '3P':  {
                this.moveFn = [[this.h], [this.mm, this.draw], [this.m1, this.draw]];
                this.clickFn = [[this.p0], [this.pm], [this.m1, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1'],['x2','y2']];
                this.dataReceived = ['x0','x1','x2','y0','y1','y2','r','a'];
            } break;
            case 'CPA': {
                this.moveFn = [[this.h], [this.m1, this.draw]];
                this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1']];
                this.dataReceived = ['x0','x1','y0','y1','a'];
             } break;
            case '2PR': {
                this.moveFn = [[this.h], [this.m1, this.draw]];
                this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1']];
                this.dataReceived = ['x0','x1','y0','y1','r','way'];
             } break;
            case '2PC': {
                this.moveFn = [[this.h],[this.mm, this.draw], [this.m1, this.newBlock, this.draw]];
                this.clickFn = [[this.p0], [pm],[this.m1, this.newBlock, this.deleteData]];
                this.dataSent = [['x0','y0'],['x1','y1'],['x2','y2']];
                this.dataReceived = ['x0','x1','y0','y1'];
             } break;
        }
    }
    data = {subType:this.subMode};
    //No hay que borrar lo que no se interacciona con el ratón porque no habría evento si no se da al control
    //y perderíamos el valor
    deleteData = () => {
        this.deleteDataBasic(['x0','x1','x2','y0','y1','y2']);
        //.forEach(k => delete this.data[k]);
    }
    updateData = (data)=>{
        const el = this.updateDataBasic(data).find(el=>el.idn==='way');
        if(this.subMode === '2PR')
            this.data.way = el.v;
    }
    pm = (p) => {this.data.xm = p.x; this.data.ym = p.y; this.status = 2;};
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'arc', data:this.data}}));};
    //Estas son para el move. p0 y m0 se parecen, pero las move no cambian status, se pueden retocar, pero así están separadas
    mm = (pi) => {this.data.xm = pi.x, this.data.ym = pi.y;};
    //Atención al paso por valor y no referencia porque createdraw usa el objeyo para rellenar campos!!!
    draw = (pi) => {
        this.hit = this.highLight(pi.x, pi.y, createDrawElement('arc', Object.assign({},this.data) ))}
    //Y lo que se manda a input-data de posicines del cursor igual
    }