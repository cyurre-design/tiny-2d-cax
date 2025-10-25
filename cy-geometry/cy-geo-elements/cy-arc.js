"use strict";
import {geometryPrecision, _2PI, normalize_radians, translatePoint, arc2PC2SVG, pointSymmetricSegment} from '../cy-geometry-library.js'

//args centro(cx, cy), radio, pi(x1,y1), pf(x2,y2), ai, da, fS, fA En realidad son redundantes, pero se calcularían en el createDraw
//Falta tratamiento de errores
//Para conservar igualdad de nomenclatura mantenemos el x0,y0 como centro, como en el círculo
export function createArc(data = {}) {
    const p = {type : 'arc', get pi(){ return ({x:this.x1, y: this.y1})}, get pf(){ return ({x:this.x2, y: this.y2})}}
    const a = Object.assign(p, data);       
    //a.x0 = data.x0; a.y0 = data.y0;
    a.bbox = _boundingBox(a);
    console.log(a.bbox);
    //Object.defineProperty(a, "pi", {  get() { return {x:a.x1, y:a.y1}},    configurable: true, enumerable: true});
    //Object.defineProperty(a, "pf", {  get() { return {x:a.x2, y:a.y2}},    configurable: true, enumerable: true});
    return a;
    }
    
    // get pi(){ return ({x:this.x1, y: this.y1})}
    // get pf(){ return ({x:this.x2, y: this.y2})}

function _boundingBox (a, eps = geometryPrecision){
        // if (fuzzy_eq_point(this.pi, this.pf.x, eps)) {
        //     return new {x0:this.x0, y0:this.y0, x1:this.x0, y1:this.y0}; //No creo que aoprta nada, la verdad
        // }
        //Un poco lío pero sin cosenos ni atan ni ná, los numero como 0,1,2,3 por conveniencia
        const qi = (a.x1 >= a.cx)?((a.y1 >= a.cy)?0:3):((a.y1 >= a.cy)?1:2);
        const qf = (a.x2 >= a.cx)?((a.y2 >= a.cy)?0:3):((a.y2 >= a.cy)?1:2);
        //los primeros 8 casos empiezan en el primer cuadrante, etc...
        const bboxC = {x0:a.cx-a.r, y0:a.cy-a.r, x1:a.cx+a.r, y1:a.cy+a.r};
        const bboxS = {x0:Math.min(a.x1, a.x2), y0:Math.min(a.y1, a.y2), x1:Math.max(a.x1, a.x2), y1:Math.max(a.y1, a.y2)};

        switch(4*qi+qf){    
            //ambos en el mismo cuadrante, fA implica que da la vuelta 
            case 0b0000:
            case 0b0101:
            case 0b1010:
            case 0b1111: return(a.fA === 0? bboxS : bboxC);
            //cuadrantes 1 y 2
            case 0b0100:
            case 0b0001: return(a.fA === 0? Object.assign(bboxS, {y1:bboxC.y1}) : Object.assign(bboxC, {y1:bboxS.y1}));
            //cuadrantes 2 y 3
            case 0b0110:
            case 0b1001: return(a.fA === 0? Object.assign(bboxS, {x0:bboxC.x0}) : Object.assign(bboxC, {x0:bboxS.x0}));
            //cuadrantes 3 y 4
            case 0b1011:
            case 0b1110: return(a.fA === 0? Object.assign(bboxS, {y0:bboxC.y0}) : Object.assign(bboxC, {y0:bboxS.y0}));
            //cuadrantes 1 y 4
            case 0b0011:
            case 0b1100: return(a.fA === 0? Object.assign(bboxS, {x1:bboxC.x1}) : Object.assign(bboxC, {x1:bboxS.x1}));
            //cuadrantes 1 y 3, inicio en 1, hay un salto de 2 y el fA no marca el sentido, uso fS
            case 0b0010: return(a.fS === 0? Object.assign(bboxS, {x0:bboxC.x0, y1:bboxC.y1}) : Object.assign(bboxS, {x1:bboxC.x1, y0:bboxC.y0}));
            //cuadrantes del 3 al 1 (al revés)
            case 0b1000: return(a.fS === 1? Object.assign(bboxS, {x0:bboxC.x0, y1:bboxC.y1}) : Object.assign(bboxS, {x1:bboxC.x1, y0:bboxC.y0}));
            //cuadrantes 2 y 4, inicio en 2, hay un salto de 2 y el fA no marca el sentido, uso fS
            case 0b0111: return(a.fS === 0? Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}) : Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}));
            //cuadrantes del 4 al 2 (al revés)
            case 0b1101: return(a.fS === 1? Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}) : Object.assign(bboxS, {x0:bboxC.x0, y0:bboxC.y0}));
        }          
    }
// export function pointWithinArcSweep(arc, p, eps = geometryPrecision){
//         //Habría que afinar con eps pero implica pasar a alfa = atan2(eps/r) o algo así... TODO
//         let a = Math.atan2(p.y - arc.cy, p.x - arc.cx)
//         //el arco tiene calculados el alfa inicial(a1) y el delta (da, con signo)  
//         //Uso el mismo cálculo de delta que se usa para inicializar el arco
//         let delta = normalize_radians(a - arc.ai) ;
//         delta = arc.fS === 1 ? delta - _2PI : delta;
//         if(this.da >= 0){
//             return ((delta>=0) && (delta <= arc.da))
//         } else {
//             return ((delta<=0) && (delta >= arc.da))
//         }
//     }

function arcClone(a) {   //un solo nivel de atributos, copio todo
        return createArc(a);
    }

    // isClosed() {
    //     return(distancePointToPoint(this.x1, this.y1, this.x2, this.y2) < geometryPrecision);
    // }

export function arcTranslate(a, dx, dy) {
        const [cx, cy] = translatePoint(a.cx, a.cy, dx, dy);
        const [x1, y1] = translatePoint(a.x1, a.y1, dx, dy);
        const [x2, y2] = translatePoint(a.x1, a.y1, dx, dy);

        return createArc(arc2PC2SVG({cx:cx, cy:cy, r:a.r, x1:x1, y1:y1, x2:x2, y2:y2,
                                             ai:a.ai, da:a.da, fS: a.fS, way:a.fA===0?'clock':'antiClock'}));
    }
    //en los simetría doy vuelta a los puntos pi pf
export function symmetryX(a, y) {
        return createArc(arc2PC2SVG({x:a.cx, y:2*y - a.cy}, a.r, {x:a.x1, y:2*y - a.y1}, {x:a.x2, y:2*y - a.y2}, (a.fA===1?'clock':'antiClock')));
    }
export function symmetryY(a, x) {
        return createArc(arc2PC2SVG({x:2*x - a.cx, y:a.cy}, a.r, {x:2*x - a.x1, y:a.y1}, {x:2*x - a.x2, y:a.y2}, (a.fA===1?'clock':'antiClock')));
    }
export function symmetryL(a, s) {
        const [cx, cy] = pointSymmetricSegment(s, a.cx, a.cy, s);
        const [x1, y1] = pointSymmetricSegment(s, a.x1, a.y1, s);
        const [x2, y2] = pointSymmetricSegment(s, a.x2, a.y2, s);
        return createArc(arc2PC2SVG({cx:cx, cy:cy}, a.r, {x:x1, y:y1}, {x:x2, y:y2}, (a.fA===1?'clock':'antiClock')));
    }
    // reverse() {
    //     [this.pi, this.pf] = [this.pf, this.pi];

    //     const pathway = (this.pathway === 0) ? 1 : 0; //por construcción?
    //     this._calculateAngles();
    //     //Si es un círculo completo calcula siempre lo mismo, así que tenemos que machacarlo
    //     if (distancePointToPoint(this.pi.x, this.pi.y, this.pf.x, this.pf.y) <= geometryPrecision)
    //         this.pathway = pathway;
    // }
    // points() {
    //     return [this.pi, this.pf];
    // }
    // pathPoints() {
    //     return [this.pf];
    // }

