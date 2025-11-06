"use strict";
import {geometryPrecision, distancePointToPoint, checkBbox, blockTranslate, blockRotate, blockScale, blockSymmetryX, blockSymmetryY, blockSymmetryL } from '../cy-geometry-library.js'

//los create deben garantizar que aquí llegan bien los parámetros

export function createPath( data = {elements:[]}){
    const p = { type : 'path',
        elements : data.elements,
        //No chequeo cruces intermedios, se puede tratar con otras librerías
        //closed : (distancePointToPoint(this.x0, this.y0, this.x1, this.y1) <= geometryPrecision)? true: false;
    }
    p.bbox = calculateBbox(p);
    return p;
}
function calculateBbox(p){
        return p.elements.reduce ((box, el)=> checkBbox(box, el.bbox), {x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity});
    }
/**
 * @todo incluir posibles elementos de tipo arco 
 * @param {*} p 
 * @param {*} dx 
 * @param {*} dy 
 * @returns 
 */
export function pathTranslate(p, dx, dy){
        return createPath( {elements:p.elements.map(el => blockTranslate( el, x, y, alfa))});
    }
export function pathRotate(p, x, y, alfa){
        return createPath( {elements:p.elements.map(el => blockRotate(el, x, y, alfa))})
}
export function pathScale(p, x, y, scale){
        return createPath( {elements:p.elements.map(el => blockScale(el, x, y, scale))})
}

export function pathClone(p) {
        return JSON.parse(JSON.stringify(p));
    }    
/**
 * @todo
 * @param {*} p 
 * @returns 
 */
    // export function pathIsClosed(p) {
    // let elements = p.elements.filter(e => ((e.type === "segment") || (e.type === "arc")));
    // //Si está cerrado, deben sucederse los elementos
    // let pi = elements.map(el => el.pi);
    // let pf = elements.map(el => el.pf);
    // pi.push(pi.shift());
    // return pi.every((el, ix) => (distancePointToPoint(el.x, el.y, pf[ix].x, pf[ix].y)) <= geometryPrecision);
    // }
export function pathSymmetryX(p, y) {
    return createPath( {elements: p.elements.map(el => blockSymmetryX(el, y))});
    }
export function pathSymmetryY(p, x) {
    return createPath( {elements: p.elements.map(el => blockSymmetryY(el, x))});
    }
export function pathSymmetryL(p, s) {
    return createPath( {elements: p.elements.map(el => blockSymmetryL(el, s))});
    }

    // reverse() {
    //     this.elements.forEach(e => e.reverse());
    //     this.elements.reverse();
    //     return this;
    // }
    //yurre: he pasado los isPointed a devolución de true/false, que es como se usaba, y además había casos no hoogéneos
    // isPointed(x, y, tol) { //devolvemos el primero que no sea undefined Habría que pasar desde aquí la tolerancia?
    //     return this.elements.find(el => (el.isPointed(x, y, tol)));
    // }
    // isInside(r) {
    //     return this.elements.every(el => el.isInside(r)); 
    // }
    // points() {
    //     let els = this.elements;
    //     if (els.length === 0) return [];
    //     let points = [els[0].pi];
    //     //let points = [new Point(els[0].pi.x, els[0].pi.y)];
    //     points = points.concat(...els.map(e => e.pathPoints()));
    //     return points;
    // }

    //métodos exclusivos de path
export function pathConcat(p1, p2) { //de fin de this a comienzo de path
        return p1.elements.concat(p2.elements);
    }
export function pathAddElements(p, elements){
        p.elements = p.elements.concat(elements);
    }
export function pathClosestEnd(p, point) {
        if (p.elements[0].type === 'circle') {
            return Infinity; //estos no forman parte de otros paths
        }

        let delta1 = sqDistancePointToPoint(point.x, point.y, p.elements[0].pi.x, p.elements[0].pi.y);
        let delta2 = sqDistancePointToPoint(point.x, point.y, p.elements[p.elements.length - 1].pf.x, p.elements[p.elements.length - 1].pf.y);

        return (delta1 <= delta2) ? {d: delta1, end: 0}: {d: delta2, end: 1};
    }
