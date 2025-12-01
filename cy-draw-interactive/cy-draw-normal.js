import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import {pointProyectedToSegment, cutSegmentToCircle,segmentTangentToArc, distancePointToPoint} from '../cy-geometry/cy-geometry-library.js';

export default class DrawNormal extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-normal', submode);
        this.block = undefined;
        this.data.subType = 'PP';
        //Secuencias en función del tipo de dibujp
        switch(this.subMode){
            case 'NP':
                this.moveFn = [[this.h, this.hover], [this.m1, this.normal, this.draw]];

            break;
            case 'TBP':
            case 'TBB':
                this.moveFn = [[this.h, this.hover], [this.m1, this.tangent, this.draw]];
            break;
        }
    }        
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    //y el del click es el bueno
    hover = (pi) => {
        const b = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(b) 
            this.block = b[0];
    };
    //para evitar pasar de status si no hay bloque elegido
    checkBlockFound = (pi) => { if(this.block) this.status = 1 }
    //El mecanismo y pulsaciones para normal y tangentes serían similares, por eso agrupo
    //Las funciones, obviamente, no
    //No hay tangente a un segmento porque es él mismo, para hacer paralelas se usa el translate
    tangent = (pi) => {               
        if((this.block.type === 'circle') || (this.block.type === 'arc')){
            let sol = segmentTangentToArc(this.block, pi.x, pi.y);
            const x = this.data.x0, y = this.data.y0 ; //el más cercano a donde pinchamos la primera vez...
            if(distancePointToPoint(sol[0].x, sol[0].y, x, y) > distancePointToPoint(sol[1].x, sol[1].y, x, y))
                sol = sol[1];
            else 
                sol = sol[0]
            this.data = Object.assign(this.data,  {x0:sol.x, y0:sol.y}, {x1:pi.x, y1:pi.y});
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
    //el this.h del final implica borrado, solo se ejecutará una vez porque se pone status a 0 en deleteData
    clickFn = [[this.hover, this.checkBlockFound], [this.m1, this.newBlock, this.deleteData, this.h]];
    moveFn = [[this.h, this.hover], [this.m1, this.normal, this.draw]];
    dataSent = [['data-x0','data-y0'],['data-x0','data-y0', 'data-x1','data-y1'],[]];     
    dataReceived = ['x0','x1','y0','y1'];
    //Las funciones de click y move son las de basic
    }