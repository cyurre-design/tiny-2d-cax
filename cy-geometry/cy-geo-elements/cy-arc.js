"use strict";
import {geometryPrecision, _2PI, normalize_radians, translatePoint, arc2PC2SVG, pointSymmetricSegment} from '../cy-geometry-library.js'

//args centro(cx, cy), radio, pi(x1,y1), pf(x2,y2), ai, da, fS, fA En realidad son redundantes, pero se calcularían en el createDraw
//Falta tratamiento de errores
//Para conservar igualdad de nomenclatura mantenemos el x0,y0 como centro, como en el círculo
export class Arc {
     constructor(data = {}) {
        Object.assign(this,data);       
        this.x0 = data.x0;this.y0 = data.y0;
        //this.cx = data.x0, this.cy = data.y0;
        //this.r = data.r;
        //this.x1 = data.x1;this.y0 = data.y1;
        //this.x2 = data.x2;this.y1 = data.y2;
        //this.ai = data.ai;
        //this.da = data.da;
        //this.way = data.way;
        //this.fS = data.fS;
        //this.fA = data.fA;
        this.type = 'arc';
        this.bbox = this._boundingBox();
    }
    
    get pi(){ return ({x:this.x1, y: this.y1})}
    get pf(){ return ({x:this.x2, y: this.y2})}

    _boundingBox (eps = geometryPrecision){
        // if (fuzzy_eq_point(this.pi, this.pf.x, eps)) {
        //     return new {x0:this.x0, y0:this.y0, x1:this.x0, y1:this.y0}; //No creo que aoprta nada, la verdad
        // }
        //Un poco lío pero sin cosenos ni atan ni ná, los numero como 0,1,2,3 por conveniencia
        const qi = (this.x1 >= this.cx)?((this.y1 >= this.cy)?0:3):((this.y1 >= this.cy)?1:2);
        const qf = (this.x2 >= this.cx)?((this.y2 >= this.cy)?0:3):((this.y2 >= this.cy)?1:2);
        //los primeros 8 casos empiezan en el primer cuadrante, etc...
        const bboxC = {x0:this.cx-this.r, y0:this.cy-this.r, x1:this.cx+this.r, y1:this.cy+this.r};
        const bboxS = {x0:Math.min(this.x1, this.x2), y0:Math.min(this.y1, this.y2), x1:Math.max(this.x1, this.x2), y1:Math.max(this.y1, this.y2)};

        switch(4*qi+qf){    
            //ambos en el mismo cuadrante, fA implica que da la vuelta 
            case 0b0000:
            case 0b0101:
            case 0b1010:
            case 0b1111: return(this.fA === 0? bboxS : bboxC);
            //cuadrantes 1 y 2
            case 0b0100:
            case 0b0001: return(this.fA === 0? Object.assign(bboxS, {y1:bboxC.y1}) : Object.assign(bboxC, {y1:bboxS.y1}));
            //cuadrantes 2 y 3
            case 0b0110:
            case 0b1001: return(this.fA === 0? Object.assign(bboxS, {x0:bboxC.x0}) : Object.assign(bboxC, {x0:bboxS.x0}));
            //cuadrantes 3 y 4
            case 0b1011:
            case 0b1110: return(this.fA === 0? Object.assign(bboxS, {y0:bboxC.y0}) : Object.assign(bboxC, {y0:bboxS.y0}));
            //cuadrantes 1 y 4
            case 0b0011:
            case 0b1100: return(this.fA === 0? Object.assign(bboxS, {x1:bboxC.x1}) : Object.assign(bboxC, {x1:bboxS.x1}));
            //cuadrantes 1 y 3, inicio en 1, hay un salto de 2 y el fA no marca el sentido, uso fS
            case 0b0010: return(this.fS === 0? Object.assign(bboxS, {x0:bboxC.x0, y1:bboxC.y1}) : Object.assign(bboxS, {x1:bboxC.x1, y0:bboxC.y0}));
            //cuadrantes del 3 al 1 (al revés)
            case 0b0100: return(this.fS === 1? Object.assign(bboxS, {x0:bboxC.x0, y1:bboxC.y1}) : Object.assign(bboxS, {x1:bboxC.x1, y0:bboxC.y0}));
            //cuadrantes 2 y 4, inicio en 2, hay un salto de 2 y el fA no marca el sentido, uso fS
            case 0b0111: return(this.fS === 0? Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}) : Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}));
            //cuadrantes del 4 al 2 (al revés)
            case 0b1101: return(this.fS === 1? Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}) : Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}));
        }          
    }
    pointWithinArcSweep(p, eps = geometryPrecision){
        //Habría que afinar con eps pero implica pasar a alfa = atan2(eps/r) o algo así... TODO
        let a = Math.atan2(p.y - this.cy, p.x - this.cx)
        //el arco tiene calculados el alfa inicial(a1) y el delta (da, con signo)  
        //Uso el mismo cálculo de delta que se usa para inicializar el arco
        let delta = normalize_radians(a - this.ai) ;
        delta = this.fS === 1 ? delta - _2PI : delta;
        if(this.da >= 0){
            return ((delta>=0) && (delta <= this.da))
        } else {
            return ((delta<=0) && (delta >= this.da))
        }
    }

    clone() {   //un solo nivel de atributos, copio todo
        let arc = new Arc(this);
        return arc;
    }

    isClosed() {
        return(distancePointToPoint(this.x1, this.y1, this.x2, this.y2) < geometryPrecision);
    }

    translate(dx, dy) {
        const [cx, cy] = translatePoint(this.cx, this.cy, dx, dy);
        const [x1, y1] = translatePoint(this.x1, this.y1, dx, dy);
        const [x2, y2] = translatePoint(this.x1, this.y1, dx, dy);

        return new Arc(arc2PC2SVG({cx:this.cx, cy:this.cy, r:this.r, x1:this.x1, y1:this.y1, x2:this.x2, y2:this.y2,
                                             ai:this.ai, da:this.da, fS: this.fS, way:this.fA===0?'clock':'antiClock'}));
    }
    //en los simetría doy vuelta a los puntos pi pf
    symmetryX(y) {
        return new Arc(arc2PC2SVG({x:this.cx, y:2*y - this.cy}, this.r, {x:this.x1, y:2*y - this.y1}, {x:this.x2, y:2*y - this.y2}, (this.fA===1?'clock':'antiClock')));
    }
    symmetryY(x) {
        return new Arc(arc2PC2SVG({x:2*x - this.cx, y:this.cy}, this.r, {x:2*x - this.x1, y:this.y1}, {x:2*x - this.x2, y:this.y2}, (this.fA===1?'clock':'antiClock')));
    }
    symmetryL(s) {
        const [cx, cy] = pointSymmetricSegment(s, this.cx, this.cy, s);
        const [x1, y1] = pointSymmetricSegment(s, this.x1, this.y1, s);
        const [x2, y2] = pointSymmetricSegment(s, this.x2, this.y2, s);
        return new Arc(arc2PC2SVG({cx:cx, cy:cy}, this.r, {x:x1, y:y1}, {x:x2, y:y2}, (this.fA===1?'clock':'antiClock')));
    }
    reverse() {
        [this.pi, this.pf] = [this.pf, this.pi];

        const pathway = (this.pathway === 0) ? 1 : 0; //por construcción?
        this._calculateAngles();
        //Si es un círculo completo calcula siempre lo mismo, así que tenemos que machacarlo
        if (distancePointToPoint(this.pi.x, this.pi.y, this.pf.x, this.pf.y) <= geometryPrecision)
            this.pathway = pathway;
    }
    // points() {
    //     return [this.pi, this.pf];
    // }
    // pathPoints() {
    //     return [this.pf];
    // }
    toJSON() { //Info ya hecha para agilizar
        return {type: this.type, data: {cx: this.cx, cy: this.cy, x1: this.x1, y1: this.y1, x2: this.x1, y2: this.y1, r: this.r, da:this.da, fS:this.fS, fA:this.fA}};
    }
    static deserialize(data){
        return new Arc(data);
    }
}
