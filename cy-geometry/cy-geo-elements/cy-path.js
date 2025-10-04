"use strict";
import {geometryPrecision, distancePointToPoint, checkBbox } from '../cy-geometry-library.js'
//import { translatePoint, transformPoint } from './cy-geometry-library.js'

//los create deben garantizar que aquí llegan bien los parámetros

export class Path {
    constructor( data = {elements:[]}){
        this.elements = data.elements;
        this.type = 'path';
        //No chequeo cruces intermedios, se puede tratar con otras librerías
        this.closed = (distancePointToPoint(this.x0, this.y0, this.x1, this.y1) <= geometryPrecision)? true: false;
        this.bbox = this.calculateBbox();
    }
    calculateBbox(){
        return this.elements.reduce ((box, el)=> checkBbox(box, el.bbox), {x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity});
    }
    translate(dx,dy){
        return new Path(this,this.elements.map(p => p.translate(dx, dy)))
    }
    //por ejemplo closed o selected
    getAttribute(property) {
        return this[property];
    }
    clone() {
        let els = this.elements.map(e => e.clone()); //se clona cada elemento y el map es array nuevo, se supone
        return new Path({elements:els});
    }    
    isClosed() {
        let elements = this.elements.filter(e => ((e.type === "segment") || (e.type === "arc")));
        //Si está cerrado, deben sucederse los elementos
        let pi = elements.map(el => el.pi);
        let pf = elements.map(el => el.pf);
        pi.push(pi.shift());
        return pi.every((el, ix) => (distancePointToPoint(el.x, el.y, pf[ix].x, pf[ix].y)) <= geometryPrecision);
    }
    transform(M) {
        this.elements.forEach(e => e.transform(M));
    }
    symmetryX(y) {
        return new Path({elements:this.elements.map(p => p.symmetryX(y))})
    }
    symmetryY(x) {
        return new Path({elements:this.elements.map(p => p.symmetryY(x))})
    }
    symmetryL(s){
        return new Path({elements:this.elements.map(p => p.symmetryL(s))})
    }
    reverse() {
        this.elements.forEach(e => e.reverse());
        this.elements.reverse();
        return this;
    }
    //yurre: he pasado los isPointed a devolución de true/false, que es como se usaba, y además había casos no hoogéneos
    isPointed(x, y, tol) { //devolvemos el primero que no sea undefined Habría que pasar desde aquí la tolerancia?
        return this.elements.find(el => (el.isPointed(x, y, tol)));
    }
    isInside(r) {
        return this.elements.every(el => el.isInside(r)); 
    }
    points() {
        let els = this.elements;
        if (els.length === 0) return [];
        let points = [els[0].pi];
        //let points = [new Point(els[0].pi.x, els[0].pi.y)];
        points = points.concat(...els.map(e => e.pathPoints()));
        return points;
    }

    //métodos exclusivos de path
    concat(path) { //de fin de this a comienzo de path
        this.elements = this.elements.concat(path.elements);
        return this;
    }
    add(elements){
        this.elements = this.elements.concat(elements);
        return this;
    }
    closestEnd(p) {
        if (this.elements[0].type === 'circle') {
            return Infinity; //estos no forman parte de otros paths
        }

        let delta1 = sqDistancePointToPoint(p.x, p.y, this.elements[0].pi.x, this.elements[0].pi.y);
        let delta2 = sqDistancePointToPoint(p.x, p.y, this.elements[this.elements.length - 1].pf.x, this.elements[this.elements.length - 1].pf.y);

        return (delta1 <= delta2) ? {d: delta1, end: 0}: {d: delta2, end: 1};
    }
    // removeSelected() {
    //     function orphans(elements) {
    //         let tmp = [];
    //         let flag = true;
    //         elements.forEach(el => {
    //             if (!flag || (el.type !== 'chamfer' && el.type !== 'round')) {
    //                 tmp.push(el);

    //                 if (el.type !== 'point') flag = false; //mantengo a first hasta que llegue algo consistente
    //             } 
    //         });

    //         return tmp;
    //     }

    //     let els = [];
    //     let paths = [];
    //     this.elements.forEach(el => {
    //         if (!el.selected) { //si ya no es "primero" meto todo, si es , no meto chaflanes
    //             els.push(el);                
    //         } else if (el.type !== "chamfer" && el.type !== "round" && els.length > 0) {
    //             paths.push(new Path(els));
    //             els = [];
    //         }
    //     });

    //     if (els.length > 0)
    //         paths.push(new Path(els));

    //     paths.forEach(p => {
    //         p.elements = orphans(p.elements);
    //         p.elements = orphans(p.elements.reverse()).reverse();
    //     });

    //     return paths;
    // }
    // removeSelected(){
    //     let delElements = [];
    //     let previousIndex;
    //     this.elements.forEach((e, ei) => {
    //         let nextIndex = ei + 1;
    //         if (e.selected) {
    //             if (e.type !== "chamfer" && e.type !== "round") {
    //                 let previousElement = this.elements[previousIndex];
    //                 if (previousElement && (previousElement.type === "chamfer" || previousElement.type === "round")) {
    //                     delElements.push(previousIndex);
    //                 }
    //                 let nextElement = this.elements[nextIndex];
    //                 if (nextElement && (nextElement.type === "chamfer" || nextElement.type === "round")) {
    //                     nextElement.selected = true;
    //                 }
    //             }
    //             delElements.push(ei);
    //         }
    //         previousIndex = ei;
    //     });
    //     delElements.reverse().forEach(i => this.elements.splice(i, 1));
    //     }
    toJSON() {  //De momento sin subtipos
        return {type: this.type, data:{elements: [...this.elements.map(x => Object.assign(x.toJSON()))]}};
    }
    static deserialize(data){
        const elements = data.elements.map(el => el.desrialize());
        return new Path(elements);
    }
}
