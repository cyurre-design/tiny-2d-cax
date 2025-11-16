"use strict";
import {geometryPrecision, rotateZ, scale0} from '../cy-geometry-library.js'
import {createSegment} from "./cy-segment.js"
import { translatePoint, distancePointToPoint, pointSymmetricSegment } from '../cy-geometry-library.js'
import {createBiarc, biarcInterpolate} from "./cy-biarc.js"




/* const maxTestPoints = 8;    //esto lo dejo fuera y calculado
let testPoints = Array.from({length:maxTestPoints},(_,i)=>i/maxTestPoints);
let coefs = {};
testPoints.forEach(tp=>coefs[tp]= [(1-tp)*(1-tp)*(1-tp), (1-tp)*(1-tp)*tp, (1-tp)*tp*tp, tp*tp*tp])
    interpolateq(tp){
        let cf = coefs[tp];
        return new Point(
            cf[0]*this.x + cf[1]*this.cp1.x + cf[2]*this.cp2.x + cf[3]*this.pf.x,
            cf[0]*this.y + cf[1]*this.cp1.y + cf[2]*this.cp2.y + cf[3]*this.pf.y,
        )
    } */
//Debemos garantizar la continuidad por construcción y todo será más sencillo

//es una polilínea
//chequeos: length >= 2 para closed, length >= 1 open





//elevación de grado, dada una c. de bezier de grado n con n+1 puntos  de control, se obtiene la misma, en grado n+1 por
// Q(i) = (i / (n+1))P(i-1) + (1 - (i / (n+1)))P(i) para 1<= i <= n
//Como la curva es de n=2 necesitamos dos nuevos puntos de control cp1 y cp2
// cp1 = Q1 = (1/3)*P0 + (1-1/3)*P1 = 1/3(P0 + 2P1)
// cp2 = Q2 = (1/3)*P1 + (1-1/3)*P2 = 1/3(P1 + 2P2)
/**
 * @todo chequear con más detalle?
 * @param {Object} data , debería venir x0,y0, cp1, cp2, x1,y1. Si no viene cp2 es cuadrática y la convertimos en cúbica
 * @returns 
 */
export function createBezier(data = {} ){ 
    //copio valores, NO referencias, por si acaso
    const bz = {type : 'bezier', x0:data.x0, y0:data.y0, x1:data.x1, y1:data.y1,
        get pi(){ return ({x:this.x0,y:this.y0})} , get pf(){ return ({x:this.x1,y:this.y1})}
    };
    if(data.subType === 'Q'){
        //elevo grado, paso de cuadrática a cúbica
        bz.cp1x = data.x0   + 2*data.cp1x/3; bz.cp1y = data.y0   + 2*data.cp1y/3;
        bz.cp2x = data.cp1x + 2*data.x1/3;   bz.cp1y = data.cp1y + 2*data.y1/3;
    }
    else{
        bz.cp1x = data.cp1x; bz.cp1y = data.cp1y;
        bz.cp2x = data.cp2x, bz.cp2y = data.cp2y;
    }
    calculateConvexHull(bz);
    //un apaño porque ye difícil, mejoraría separando si hay puntos de inflexión...
    bz.bbox = {
        x0: Math.min(bz.x0, bz.cp1x, bz.cp2x, bz.x1),
        x1: Math.max(bz.x0, bz.cp1x, bz.cp2x, bz.x1),
        y0: Math.min(bz.y0, bz.cp1y, bz.cp2y, bz.y1),
        y1: Math.max(bz.y0, bz.cp1y, bz.cp2y, bz.y1),
        }
    Object.defineProperty(a, "pi", {  get() { return {x:a.x0, y:a.y0}},    configurable: true, enumerable: true});
    Object.defineProperty(a, "pf", {  get() { return {x:a.x1, y:a.y1}},    configurable: true, enumerable: true});
    return bz;
    }
    //interpola al punto t
function interpolate(bz, t){
    let it = 1-t;
    return {
        x: it*it*it*x0  + 3*it*it*t*bz.cp1x + 3*it*t*t*bz.cp2x + t*t*t*bz.x1 ,
        y: it*it*it*y0  + 3*it*it*t*bz.cp1y + 3*it*t*t*bz.cp2y + t*t*t*bz.y1
        } 
    }
    //calcula el incentro del triángulo de un bezier (restringido en ángulo)
function calculateIncenter(bz){
    //const a = new Line(this.x, this.y, this.cp1x, this.cp1y); 
    //const b = new Line(this.cp2.x, this.cp2.y, this.pf.x, this.pf.y); 
    const v = _lineCutsToLine(createSegment(bz.x0, bz.y0, bz.cp1x, bz.cp1y), createSegment(bz.cp2x, bz.cp2y, bz.x1, bz.y1));
    const a = distancePointToPoint( v.x, v.y, bz.x0, bz.y0);
    const b = distancePointToPoint( v.x, v.y, bz.x1, bz.y1);
    const c = distancePointToPoint( bz.x0, bz.y0, bz.x1, bz.y1);
    const s = a + b + c; //perímetro
    return {x: (a*bz.x1 + b*bz.x0 + c*v.x) / s , y: (a*bz.y1 + b*bz.y0 + c*v.y) / s};
    }

function calculateConvexHull(bz){
    bz.A0 = {x: bz.cp1x - bz.x0,        y: bz.cp1y - bz.y0};
    bz.A1 = {x: bz.cp2x - bz.cp1x,      y: bz.cp2y - bz.cp1y};
    bz.A2 = {x: bz.x1   - bz.cp2x,      y: bz.y1   - bz.cp2y};
    bz.D0 = {x: bz.A1.x - bz.A0.x,      y: bz.A1.y - bz.A0.y};
    bz.D1 = {x: bz.A2.x - bz.A1.x,      y: bz.A2.y - bz.A1.y};
    bz.E0 = {x: bz.D1.x - bz.D0.x,      y: bz.D1.y - bz.D0.y};
    }
function calculateInflexionPoints(bz){  
    const a = {x: bz.cp1x - bz.x0,                 y: bz.cp1y - bz.y0};
    const b = {x: bz.cp2x - bz.cp1x - a.x,         y: bz.cp2y - bz.cp1y - a.y};
    const c = {x: bz.x1   - bz.cp2x - a.x -2*b.x,  y: bz.y1   - bz.cp2y - a.y -2*b.y};
    const inflections = solveq(a,b,c);
    return(inflections);
    }
function isClockWise(bz){
        /// The orientation of the Bezier curve
        /// </summary>
        let sum = 0;
        sum += (bz.cp1x - bz.x0)   * (bz.cp1y + bz.y0);
        sum += (bz.cp2x - bz.cp1x) * (bz.cp2y + bz.cp1y);
        sum += (bz.x1   - bz.cp2x) * (bz.y1   + bz.cp2y);
        sum += (bz.x0   - bz.x1)   * (bz.y0   + bz.y1);
        return (sum < 0);
    }
// function clone(bz){
//     return createBezier(bz.x, bz.y, bz.cp1.x, bz.cp1.y, bz.cp2.x, bz.cp2.y, bz.pf.x, bz.pf.y);
//     }
function isClosed(bz) {
    return (sqDistancePointToPoint(bz.x0, bz.y0, bz.x1, bz.y1) <= geometryPrecision2);
    }
// function isEqual(bz, el) {
//     if(el.type !== 'bezier') return false;
//     return(bz.pi.isEqual(el.pi) && bz.pf.isEqual(el.pf) && bz.cp1.isEqual(el.cp1) && bz.cp2.isEqual(el.cp2)) 
//     }
/**
 * 
 * @param {Object bezier} bz 
 * @param {Number} x 
 * @param {Number} y 
 * @returns {Object bezier}
 */
export function bezierTranslate(bz, dx, dy) {
    const [x0, y0] = translatePoint(bz.x0, bz.y0, dx, dy);
    const [x1, y1] = translatePoint(bz.x1, bz.y1, dx, dy);
    const [cp1x, cp1y] = translatePoint(bz.cp1x, bz.cp1y, dx, dy);
    const [cp2x, cp2y] = translatePoint(bz.cp2x, bz.cp2y, dx, dy);
    return createBezier({x0:x0, y0:y0, x1:x1, y1:y1, cp1x:cp1x, cp1y:cp1y, cp2x: cp2x, cp2y:cp2y});
}
export function bezierSymmetryX(bz, y) {
    return createBezier({x0: bz.x0, y: 2*y - bz.y0, x1: bz.x1, y1: 2*y - bz.y1, cp1x: bz.cp1x, cp1y: 2*y - bz.cp1y, cp2x: bz.cp2x, cp2y: 2*y - bz.cp2y} )
    }
export function bezierSymmetryY(bz, x) {
    return createBezier({x0: 2*x - bz.x0, y0: bz.y0, x1: 2*x - bz.x1, y1: bz.y1, cp1x: 2*x - bz.cp1x, cp1y: bz.cp1y, cp2x: 2*x - bz.cp2x, cp2y: bz.cp2y} )
    }
export function bezierSymmetryL(bz, s) {
    const [x0, y0] = pointSymmetricSegment(s, bz.x0, bz.y0);
    const [x1, y1] = pointSymmetricSegment(s, bz.x1, bz.y1);
    const [cp1x, cp1y] = pointSymmetricSegment(s, bz.cp1x, bz.cp1y);
    const [cp2x, cp2y] = pointSymmetricSegment(s, bz.cp2x, bz.cp2y);
    return createBezier({x0:x0, y0:y0, x1:x1, y1:y1, cp1x:cp1x, cp1y:cp1y, cp2x: cp2x, cp2y:cp2y});
}

export function bezierRotate(bz, x, y, alfa) {
    const [x0, y0] = rotateZ( bz.x0 - x, bz.y0 - y, alfa);
    const [x1, y1] = rotateZ( bz.x1 - x, bz.y1 - y, alfa);
    const [cp1x, cp1y] = rotateZ( bz.cp1x - x, bz.cp1y - y, alfa);
    const [cp2x, cp2y] = rotateZ( bz.cp2x - x, bz.cp2y - y, alfa);
    return createBezier({x0:x0 + x, y0:y0 + y, x1:x1 + x, y1:y1 + y, cp1x:cp1x + x, cp1y:cp1y + y, cp2x: cp2x + x, cp2y:cp2y + y});
    }
export function bezierScale(bz, x, y, scale) {
    const [x0, y0] = scale0( bz.x0 - x, bz.y0 - y, scale);
    const [x1, y1] = scale0( bz.x1 - x, bz.y1 - y, scale);
    const [cp1x, cp1y] = scale0( bz.cp1x - x, bz.cp1y - y, scale);
    const [cp2x, cp2y] = scale0( bz.cp2x - x, bz.cp2y - y, scale);
    return createBezier({x0:x0 + x, y0:y0 + y, x1:x1 + x, y1:y1 + y, cp1x:cp1x + x, cp1y:cp1y + y, cp2x: cp2x + x, cp2y:cp2y + y});
    }
export function bezierReverse(bz){
    return createBezier({x0:bz.x1 , y0:bz.y1, x1:bz.x0, y1:bz.y0, cp1x:bz.cp2.x, cp1y:bz.cp2.y, cp2x: bz.cp1.x, cp2y:bz.cp1.y});
}
    // reverse() {
    //     [this.pi, this.cp1, this.cp2, this.pf] = [this.pf, this.cp2, this.cp1, this.pi];
    // }

function splitAt(bz, t){
        let s1 = t<0?0:t>1?1:t;
        let s2 = 1 - s1;
        //de Casteljeau
        let m0x = s2*bz.x0 + s1*bz.cp1x,    m0y = s2*bz.y0 + s1*bz.cp1y   ;
        let m1x = s2*bz.cp1x + s1*bz.cp2x,  m1y = s2*bz.cp1y + s1*bz.cp2y ;
        let m2x = s2*bz.cp2x + s1*bz.x1,    m2y = s2*bz.cp2y + s1*bz.y1   ;
        //segundo orden
        let q0x = s2*m0x + s1*m1x, q0y= s2*m0y + s1*m1y;
        let q1x = s2*m1x + s1*m2x, q1y= s2*m1y + s1*m2y;
        //tercer orden
        let px = s2*q0x + s1*q1x, py = s2*q0y + s1*q1y;

        let left = createBezier({x0:bz.x0, y0:bz.y0, cp1x:m0.x, cp1y:m0.y, cp2x:q0.x, cp2y:q0.y, x1:px, y1:py});
        let right = createBezier({x0:px, y0:py, cp1x:q1.x, cp1y:q1.y, cp2x:m2.x, cp2y:m2.y, x1:bz.x1, y1:bz.y1});
        return([left, right]);
    }


       //condiciones de hermite + incenter (transition point)
    //https://dlacko.org/blog/2016/10/19/approximating-bezier-curves-by-biarcs/
function calculateBiarc(bz, g ){
    //let cw = bz.isClockWise();
    function calculateCircle(p1, p2, g){
        //let t1 = new Line(this.cp1.x, this.cp1.y, this.x, this.y, );
        let t1 = createSegment(p1.x, p1.y, p2.x, p2.y );
        let tl = lineNormalToLine(t1, p1);
        let p2g = createSegment(p1.x, p1.y, g.x, g.y);
        let m = {x:(p1.x + g.x )/2, y:(p1.y + g.y )/2};
        let lm = lineNormalToLine(p2g, m);
        let c = _lineCutsToLine(tl, lm);
        let r = distancePointToPoint(c.x, c.y, p1.x, p1.y);
        return( createCircle(c.x, c.y, r));
        }
    const c1 = calculateCircle(bz, bz.cp1, g);
    const c2 = calculateCircle(bz.pf, bz.cp2, g);
    //Atton. way
    let a1 = createArc(c1.x, c1.y, r1, {x: bz.x, y: bz.y}, g);
    let a2 = createArc(c2.x, c2.y, r2, g, this.pf);
    return( createBiarc(a1, a2));
    }

function splitAtInflexionPoints(bz, tolerance = 0.01){
    let tramos = [];
    if(distancePointToPoint(bz.x0, bz.y0, bz.x1, bz.y1) < geometryPrecision){ //curva cerrada, la divido en dos
        tramos = tramos.concat(splitAt(bz, 0.5));
    }
    else if((distancePointToPoint(bz.x0, bz.y0, bz.cp1x, bz.cp1y) < geometryPrecision) ||
    (distancePointToPoint(bz.x1, bz.y1, bz.cp2x, bz.cp2y) < geometryPrecision)){
        tramos.push(clone(bz)); //discutible
    }
    else{
        let inxpoints = calculateInflexionPoints(bz); // 0, 1 o 2
        inxpoints = inxpoints.filter(t=>(t>tolerance && (1-t)>tolerance));
        if(inxpoints.length === 0)
            tramos.push(clone(bz));
        else if(inxpoints.length === 1)
            tramos = tramos.concat(splitAt(bz, inxpoints[0]))
        else{
            // Make the first split and save the first new curve. The second one has to be splitted again
            // at the recalculated t2 (it is on a new curve)
            inxpoints.sort(); 
            let splited = splitAt(bz, inxpoints[0]);
            tramos.push(splited.shift());
            tramos = tramos.concat(splited.shift().splitAt((1-inxpoints[0])*inxpoints[1] )); //reparametrización
            //t2 = (1 - t1) * t2;
        }
    }
    return(tramos);
    }

//NO SE POR QUE HAY DOS APROX TAN DISTINTAS....
// function approximate(bz){
//     const maxTestPoints = 8;
//     let testPoints = Array.from({length:maxTestPoints},(_,i)=>i/maxTestPoints);
//     let tramos = bz.splitAtInflexionPoints(); //devuelve array de beziers, se supone
//     let biarcs = [];    //lo que voy a devolver
//     while(tramos.length > 0){
//         let bezier = tramos.shift();
//         while(tramos.length > 0){
//             bezier = tramos.shift();
//             const g = calculateIncenter(); //igual hay que tratar alguna excepción primero
//                 //caculate Biarc
//             let biarc = calculateBiarc(g);
//                 // Calculate the maximum error , vamos a dividir donde sea máximo
//             let err = testPoints.reduce((e, t)=>{
//                 const bz = interpolate(t);
//                 const ba = interpolate(t);
//                 let d = distancePointToPoint(bz.x, bz.y, ba.x, ba.y);
//                 if( d > e.error)
//                     e = {error:d, t:t} 
//             }, {error:-1, t:-1});
//             if(err.error < tolerance){ //ok
//                 biarcs.push(biarc);
//             }
//             else{
//                 tramos = bezier.splitAt(err.t).concat(tramos);
//             }
//         }
//     }
//     }
function approximate(bz, tolerance = 0.01){
    let tramos = splitAtInflexionPoints(bz, tolerance); //devuelve array de beziers, se supone
    let biarcs = [];    //lo que voy a devolver

    while((tramos.length > 0) && (tramos.length < 6)){
        let bezier = tramos.shift();
        const g = calculateIncenter(bz); //pueden ser paralelos las líneas de control
        if(!g){
            tramos = splitAt(bz, 0.5).concat(tramos);
            continue;
        }
            //caculate Biarc
        let biarc = calculateBiarc(bz, g);
//            biarcs.push(biarc);
        //Calculate the maximum error , vamos a dividir donde sea máximo
        let err = testPoints.map(t=> interpolate(bz, t));
        err = err.map(p=>Math.min(Math.abs(distancePointToPoint(p.x, p.y, biarc.a.x, biarc.a.y) - biarc.a.r), Math.abs(distancePointToPoint(p.x, p.y, biarc.b.x, biarc.b.y) - biarc.b.r)));
        let emax = Math.max(...err);
        if(emax < tolerance){ //ok
            biarcs.push(biarc);
        }
        else{
            const t = testPoints[err.indexOf(emax)];
            tramos = splitAt(bz, t).concat(tramos);                        
        }
    }
    let arcs = [];
    biarcs.forEach(b=>{arcs.push(b.a);arcs.push(b.b)})
    return(arcs);
}



