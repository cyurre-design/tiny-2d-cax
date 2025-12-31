import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import { distancePointToPoint, segmentsTangentToCircleAndCircle } from '../cy-geometry/cy-geometry-library.js';

export default class DrawSegmentBB extends DrawBasic {
    constructor(layerDraw, submode){
        super(layerDraw, 'segment-TBB', submode);
        this.block = undefined;
        this.blant = undefined;
        this.data.subType = 'PP';
        this.moveFn         = [[this.hover], [this.m1, this.draw, this.hover]];
        this.clickFn        = [[this.m0, this.save], [this.m1, this.tangentb, this.newBlock, this.deleteData, this.clear]];
        this.dataSent       = [[],[],[]];     
        this.dataReceived   = [];
    }        
    //mientras mueve sin click, estado 0, miramos si pincha en bloque
    //en el click el pi está normalizado a rejilla, así que podría no encontrara el bloque incluso estando encima
    // del punto del move!!! por eso no se debe usar en esas condiciones
    hover = (pi) => {
        this.block = undefined; //default
        this.enabled = false;    //Hasta que haya bloque no permitimos acciones del click
        let b = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        if(!b) return;
        if((b[0].type !== 'circle') && (b[0].type !== 'arc')) return;
        this.block = b[0];
        this.enabled = true;
    };
    save = (pi) =>{
        if(this.block){ //si no hay pinchado no avanzamos
            this.blant = this.block;
             this.status = 1;
        }
    }
    //El mecanismo y pulsaciones para normal y tangentes serían similares, por eso agrupo
    //Las funciones, obviamente, no
    //No hay tangente a un segmento porque es él mismo, para hacer paralelas se usa el translate
    tangentb = (pi) => {     
        //Hay dos bloques implicados, bla y block, y dos puntos, x0,y0 y x1,y1 para orientar la solución más cercana
        //El orden es importante para asociar los puntos
        let sol = segmentsTangentToCircleAndCircle(this.blant, this.block);
        //Hay hasta 4 soluciones posibles, dos exteriores y dos  interiores
        //Cogemos las que más se acerquen a los puntos dados, teniendo en cuenta que, en cada par de puntos
        //el primero se corresponde con el primer clickado
        sol = sol.sort( (s1, s2) => (distancePointToPoint(s1[0].x, s1[0].y, this.data.x0, this.data.y0)
                                    - distancePointToPoint(s2[0].x, s2[0].y, this.data.x0, this.data.y0)))
        sol = sol.slice(0,2); //Las dos soluciones serán una exterior y otra interior, previsiblemente
        sol = sol.sort( (s1, s2) => (distancePointToPoint(s1[1].x, s1[1].y, this.data.x1, this.data.y1)
                                    - distancePointToPoint(s2[1].x, s2[1].y, this.data.x1, this.data.y1)))
        sol = sol[0]; //que es un array de dos objetos
        this.data = Object.assign(this.data,  {x0:sol[0].x, y0:sol[0].y}, {x1:sol[1].x, y1:sol[1].y});
    }
    //Borrado para poder seguir con el comando
    deleteData = () => {
        this.deleteDataBasic(['x0','x1','y0','y1']);
        this.block = undefined; this.blant = undefined; this.hit = undefined;
    };
    updateData = (data) => this.updateDataBasic(data);
    newBlock = (p) => {
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    draw = (pi) => {this.hit = 
        this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}       
    }