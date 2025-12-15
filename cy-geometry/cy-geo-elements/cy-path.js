"use strict";
import {checkBbox, blockTranslate, blockRotate, blockScale, blockSymmetryX, blockSymmetryY, blockSymmetryL, blockReverse, blockLength, fuzzy_eq_point } from '../cy-geometry-library.js'

//los create deben garantizar que aquí llegan bien los parámetros

export function createPath( data = {elements:[]}){
    const p = { 
        type : 'path',
        elements : data.elements, 
        get pi(){ return p.elements[0].pi},
        get pf(){ return p.elements[p.elements.length -1].pf}
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
        return createPath( {elements:p.elements.map(el => blockTranslate( el, dx, dy))});
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
//versión light... no compruebo que están seguidos , se supone que se ha hecho un link en algún  momento
export function pathIsClosed(p){
    return fuzzy_eq_point(p.elements[0].pi, p.elements[p.elements.length-1].pf)
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
export function pathReverse(p) {
    const els = p.elements.map(e => blockReverse(e));
    els.reverse(); //Modifica els in place
    return createPath({elements: els});
    }
export function pathLength(path){
    let len = 0;
    if(path.elements.length === 0) return len;
    len = path.elements.reduce((len, shape) => len + blockLength(shape), 0);
    return len;
    }
    // Le he preguntado a chatGPT ... que se lo sabe todo
    // Using the shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula) modified to
    // See https://en.wikipedia.org/wiki/Circular_segment
    // YURRE: Uso la fórmula de segmento de circulo de wikipedia area del segmento = 0.5 * r * r * (tita - sin(tita))
    // que se corresponde con la resta entre el qusito y el triángulo
    // YURRE: TODO probar más exhaustivamente
    //Dejo la inicialización de variabkes locales como las pasa, queda bien
export function pathArea(path) {
    let A = 0;
    if(! pathIsClosed(path)) return 0;
    for (const e of path.elements) {
        if (e.type === "segment") {
            const { x0, y0, x1, y1 } = e;
            A += (x0 * y1 - x1 * y0);
            continue;
        }
        if (e.type === "arc") {
            const { x1, y1, x2, y2, r, da } = e;
            // Triángulo (nutriente poligonal)
            A += (x1 * y2 - x2 * y1);
            // Área del arco (sector - triángulo)
            // da ya es signed sweep angle
            A += r * r * (da - Math.sin(da));
            continue;
        }
        console.warn("Elemento desconocido:", e);
    }
    return A / 2;  // signo define orientación
}
// La orientación servirá para definir cajera o isla pero tambén el signo de recorrido en laser
export function pathOrientation(path){
    if(! pathIsClosed(path)) 
        return 'open'
    return (pathArea(path) < 0) ? 'clock' : 'antiClock';
    }
//Se usa de forma interactiva, miramos si el punto está cerca de un vértice
//Como están empalmados, solo miro el inicial 
export function pathSetStartPoint(path, point){
    const startIx = path.elements.findIndex(el => fuzzy_eq_point(point, el.pi))
    if(startIx === undefined ) return undefined;
    //Aquí hay que ordenarlo pero sin cambiar el sentido, de hecho no cambia el bbox ni nada
    path.elements = path.elements.slice(startIx).concat(path.elements.slice(0,startIx))
    return path;
}
    //métodos exclusivos de path
// export function pathConcat(p1, p2) { //de fin de this a comienzo de path
//         return p1.elements.concat(p2.elements);
//     }
// export function pathAddElements(p, elements){
//         p.elements = p.elements.concat(elements);
//     }
// export function pathClosestEnd(p, point) {
//         if (p.elements[0].type === 'circle') {
//             return Infinity; //estos no forman parte de otros paths
//         }
//         let delta1 = sqDistancePointToPoint(point.x, point.y, p.elements[0].pi.x, p.elements[0].pi.y);
//         let delta2 = sqDistancePointToPoint(point.x, point.y, p.elements[p.elements.length - 1].pf.x, p.elements[p.elements.length - 1].pf.y);
//         return (delta1 <= delta2) ? {d: delta1, end: 0}: {d: delta2, end: 1};
//     }
