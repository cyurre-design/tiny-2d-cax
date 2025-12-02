import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {pointProyectedToSegment, cutSegmentToCircle,segmentTangentToArc, distancePointToPoint} from '../cy-geometry/cy-geometry-library.js';

export default class DrawNormal extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-normal', submode);
        this.block = undefined;
        this.data.subType = 'PP';
        //Secuencias en función del tipo de dibujp
        //el this.h del final implica borrado, solo se ejecutará una vez porque se pone status a 0 en deleteData
        switch(this.subMode){
            case 'NP':{
                this.moveFn = [[this.h, this.hover], [this.m1, this.normal, this.draw]];
                this.clickFn = [[this.m0, this.checkBl], [this.m1, this.newBlock, this.deleteData, this.h]];
            }break;
            case 'TPB':{
                this.moveFn = [[this.h], [this.m1, this.draw, this.hover]];
                this.clickFn = [[this.p0], [this.tangent, this.newBlock, this.deleteData, this.h]];
            }break;
            case 'TBB':{
                this.moveFn = [[this.h, this.hover], [this.hover, this.tangent2, this.draw]];
                this.clickFn = [[this.p0], [this.m1, this.tangent, this.newBlock, this.deleteData, this.h]];
            }break;
        }
    }        
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    //en el click el pi está normalizado a rejilla, así que podría no encontrara el bloque incluso estando encima
    // del punto del move!!! por eso no se debe usar en esas condiciones
    hover = (pi) => {
        const b= this.layerDraw.hover(pi.x, pi.y, undefined, false);
        console.log(pi, b)
        this.block = b?b[0]:b;
    };
    //para evitar pasar de status si no hay bloque elegido
    checkBl = (pi) => {
        if(this.block){
         this.status = 1;
        }
    }
    //El mecanismo y pulsaciones para normal y tangentes serían similares, por eso agrupo
    //Las funciones, obviamente, no
    //No hay tangente a un segmento porque es él mismo, para hacer paralelas se usa el translate
    tangent2 = (pi) => {               
        if((this.block.type === 'circle') || (this.block.type === 'arc')){
            let sol = segmentTangentToArc(this.block, pi.x, pi.y);
            if(sol.length < 2) return;
            console.log(this.xa, this.ya)
            if(distancePointToPoint(sol[0].x, sol[0].y, this.xa, this.ya) > distancePointToPoint(sol[1].x, sol[1].y, this.xa, this.ya))
                sol = sol[0];
            else 
                sol = sol[1]
            this.data = Object.assign(this.data,  {x0:sol.x, y0:sol.y}, {x1:pi.x, y1:pi.y});
        }
    }
    tangent = (pi) => { 
        if((this.block.type === 'circle') || (this.block.type === 'arc')){
            let sol = segmentTangentToArc(this.block, this.data.x0, this.data.y0);
            if(sol.length < 2) return;
            if(distancePointToPoint(sol[0].x, sol[0].y, pi.x, pi.y) > distancePointToPoint(sol[1].x, sol[1].y, pi.x, pi.y))
                sol = sol[1];
            else 
                sol = sol[0]
            this.data = Object.assign(this.data,  {x1:sol.x, y1:sol.y});
        }
    }
    normal = (pi) => {
        if(this.block.type === 'segment'){
            this.data = Object.assign(this.data,  pointProyectedToSegment(this.block, pi.x, pi.y));        
        } else if((this.block.type === 'circle') || (this.block.type === 'arc')){
            const s = createDrawElement('segment',{subType:'PP', x0:this.block.cx, y0:this.block.cy, x1: pi.x, y1:pi.y})
            const sols = cutSegmentToCircle(s, this.block);
            let sol;
            if(distancePointToPoint(sols[0].x, sols[0].y, pi.x, pi.y) > distancePointToPoint(sols[1].x, sols[1].y, pi.x, pi.y))
                sol = sols[1];
            else 
                sol = sols[0]
            this.data = Object.assign(this.data,  {x0:sol.x, y0:sol.y}, {x1:pi.x, y1:pi.y});
        }
        //el x1,y1 lo pone this.m1
    }
    //hay muchas cosas del basic que sirven aquí
    deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.block = undefined; this.status = 0;};
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    draw = (pi) => {this.hit = 
        this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}       
    dataSent = [['data-x0','data-y0'],['data-x0','data-y0', 'data-x1','data-y1'],[]];     
    dataReceived = ['x0','x1','y0','y1'];
    //Las funciones de click y move son las de basic
    }