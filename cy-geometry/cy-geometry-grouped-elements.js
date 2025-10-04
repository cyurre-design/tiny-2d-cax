//Un Path es un array de elementos dibujables, la librería es un poco diferente que la de soporte
//Los elementos de soporte no tienen simetrías, etc... porque se supone que son para dibujar
"use strict";

import {circleCutsToArc, circleTangentToLineAndLine, circleTangentToCircleAndLine, circleTangentToCircleAndCircle, lineCutsToCircle, lineTangentToPointAndCircle,
    Point, Circle, Segment, sqDistancePointToPoint, distancePointToPoint, geometryPrecision, geometryPrecision2} from './fg-geometry-library.js';

import { Round, Chamfer, TangentEntry, TangentExit } from './fg-geometry-iso-elements.js';

import GraphicDecorator from './fg-graphic-decorator.js';

//me paso el punto de aproximación, el segmento a tocar y con qué radio
//la perpendicular es girar +-90, (uy,-ux) y (ux, -uy)
//YURRE: Esta función devuelve un campo de error, TODO
function TangentialEtSegment(p0, li, r, dir) { //para entrada/salida tangencial, a segmento, son 2 posibles círculos
    let l = (dir === 'tangentialEntry') ? li : new Segment(li.pf.x, li.pf.y, li.pi.x, li.pi.y); //dada la vuelta
    let c1 = new Circle(l.pi.x + r * l.uy, l.pi.y - r * l.ux, r);
    let c2 = new Circle(l.pi.x - r * l.uy, l.pi.y + r * l.ux, r);
    //elijo el círculo cercano al punto, claro
    c1 = (sqDistancePointToPoint(p0.x, p0.y, c1.x, c1.y) <= sqDistancePointToPoint(p0.x, p0.y, c2.x, c2.y)) ? c1 : c2;
    //Hay que elegir aquella dirección en que la derivada sea continua, o sea, los signos de la derivada respecto a t se mantengan
    //el "giro", o sea, hacia dónde apunta, es el producto vectorial, constante para los puntos de tangencia
    let way = (((l.pi.x - c1.x) * l.uy - (l.pi.y - c1.y) * l.ux ) > 0) ? 'antiClock' : 'clock';
    way = (dir === 'tangentialExit') ? (way === 'clock') ? 'antiClock' : 'clock' : way;
    let sols = lineTangentToPointAndCircle(p0, c1);     //cada una con su punto de tangencia
    //La solución buena debe ser la que mantenga la dirección
    let cp;
    if(sols.length === 0){
        //Bueno, resulta que no tiene que ser tangente el tramo inicial(final) al círculo
        //Hacemos un cuarto de círculo...como l ya he dado la vuelta, la fórumla es igual para entrar y salir
        cp = {x: c1.x - r * l.ux, y: c1.y - r * l.uy};
    }
    else{
        let s0 =  (sols[0].points()[0].y - c1.y) / (sols[0].points()[0].x - c1.x);
        //let s1 =  (sols[1]._Points[0].y - c1.y) / (sols[1]._Points[0].x - c1.x);
        let s = way === 'antiClock'?( s0 >= 0? sols[0] : sols[1]):( s0 >= 0? sols[1] : sols[0])
        cp = s.points()[0];

    }

    return (dir === 'tangentialEntry')? new TangentEntry(p0.x, p0.y, l.pi.x, l.pi.y, cp.x, cp.y, c1.x, c1.y, c1.r, way):
                                        new TangentExit(p0.x, p0.y, l.pi.x, l.pi.y, cp.x, cp.y, c1.x, c1.y, c1.r, way); //l depende de si entry o exit
}

function TangentialEtArc(p0, c, r, dir) { //para entrada/salida tangencial, a arco, son 2 posibles círculos
    function selectTangent(c, l1, l2, way) {
        let disc0 = (l1.x - c.x) * l1.uy - (l1.y - c.y) * l1.ux;
        let l = ((way === 'antiClock' && disc0 > 0) || (way === 'clock' && disc0 < 0))?l1:l2;
        return {tcx: c.x, tcy: c.y, r: c.r, x: l._points[0].x, y: l._points[0].y, way: way};
    }

    let p = (dir === 'tangentialEntry') ? c.pi : c.pf;
    let l = new Segment(c.x, c.y, p.x, p.y); //línea que une el punto inicial y el centro
    let c1 = new Circle(p.x + r * l.ux, p.y + r * l.uy, r);
    let c2 = new Circle(p.x - r * l.ux, p.y - r * l.uy, r);
    c1 = (sqDistancePointToPoint(p0.x, p0.y, c1.x, c1.y) <= sqDistancePointToPoint(p0.x, p0.y, c2.x, c2.y)) ? c1 : c2;
    //hacia el círculo original, las tangentes de los elementos deben tener continuidad, lo que nos sirve para el arco y para elegir la tangente
    let way = (c.pathway === 1) ? 'antiClock' : 'clock';
    //Que depende de si el círculo tangente está dentro o fuera del original
    if (sqDistancePointToPoint(c.x, c.y, c1.x, c1.y) > c.r * c.r) //si estoy dentro del círculo, hacia el otro lado
        way = (way === 'clock') ? 'antiClock' : 'clock';
    if (dir === 'tangentialExit') //Si es salida estamos dibujando al revés...
        way = (way === 'clock') ? 'antiClock' : 'clock';
    //Ahora vamos a buscar las tangentes, si se puede...
    //el punto de partida no puede estar en el círculo porque si no no hay tangente que valga...
    let d2 = sqDistancePointToPoint(p0.x, p0.y, c1.x, c1.y);
    if (Math.abs(d2 - r * r) <= geometryPrecision2) //TODO poner el epsilon que toque, caso de que la distancia al círculo desde el punto inicial es el diámetro
        return new TangentEntry(p0.x, p0.y, p.x, p.y, p0.x, p0.y, c1.x, c1.y, r, way); //l depende de si entry o exit
        //return({cx:c1.x, cy:c1.y, r:c1.r, x:p0.x, y:p0.y, way:way})
    if (d2 < r*r) return;
    let sols = lineTangentToPointAndCircle(p0, c1); //debe haber dos soluciones, salvo alineamiento o un solo círculo sin tramo recto..
    let cp = selectTangent(c1, sols[0], sols[1], way); //cp.x,cp.y punto de tangencia, cp.tcx,cp.tcy,cp.r circulo de tangencia
    //p depende de si entry o exit, es el punto de inicio (fin) del arco al que entramos o salimos
    way = (dir === 'tangentialExit') ? (way === 'clock') ? 'antiClock' : 'clock' : way;

    return (dir === 'tangentialEntry') ?new TangentEntry(p0.x, p0.y, p.x, p.y, cp.x, cp.y, cp.tcx, cp.tcy, cp.r, way):
                                        new TangentExit(p0.x, p0.y, p.x, p.y, cp.x, cp.y, cp.tcx, cp.tcy, cp.r, way); 
}
export function calculateTangentialEntry(r, last, next){
    return (next.type === 'segment') ? TangentialEtSegment(last.pi, next, r, 'tangentialEntry') : TangentialEtArc(last.pi, next, r, 'tangentialEntry');
}
export function calculateTangentialExit(r, last, next){
    return (last.type === 'segment') ? TangentialEtSegment(next.pf, last, r, 'tangentialExit') : TangentialEtArc(next.pf, last, r, 'tangentialExit');
}
//rutinas auxiliares
//test de que se puede insertar un chaflán o redondeo
function testConditions(r, last, next) {
    if ((last.type !== 'segment' && last.type !== 'arc') || (next.type !== 'segment' && next.type !== 'arc'))
        return 'fgInvalidNextOrLastElements';

    if (distancePointToPoint(last.pi.x,last.pi.y,last.pf.x,last.pf.y) < r || distancePointToPoint(next.pi.x,next.pi.y,next.pf.x,next.pf.y) < r)
        return 'fgNoSolutionException';

    return true;
}
//calcula un chaflán entre dos elementos de perfil, devuelve un chaflán o null
export function calculateChamfer(r, last, next) {
    const tolerance = 0.1; //YURRE,TODO, MORRALLA
    function solutionArc(cx, cy, cr, x, y, r){
        let sols = circleCutsToArc(cx, cy, cr, x, y, r);
        if (sols.length === 0) return null;
        return((Math.abs(distancePointToPoint(cx, cy, sols[0].x, sols[0].y) - cr) < tolerance)?sols[0]:sols[1]);
    }
    function solutionSegment(x, y, ux, uy, r){
        return({x: x - r*ux, y: y - r*uy});
    }
    if((last.l2 < r*r)  || (next.l2 < r*r)) return null;
    let pi = (last.type === 'segment')?solutionSegment(last.pf.x, last.pf.y, last.ux, last.uy, r):solutionArc(last.x, last.y, last.r, last.pf.x, last.pf.y, r);
    if(!pi) return(null);
    let pf = (next.type === 'segment')?solutionSegment(next.pi.x, next.pi.y, -next.ux, -next.uy, r):solutionArc(next.x, next.y, next.r, next.pi.x, next.pi.y, r);
    if(!pf) return(null);

    return new Chamfer(pi.x, pi.y, pf.x, pf.y, r);
}
export function calculateRound(r, last, next) {
    //ya son arco y segmentp
    const tolerance = 0.1; //YURRE,TODO, MORRALLA       
    let sols = [];
    if (last.type === 'segment') {
        if (next.type === 'segment')
            sols = circleTangentToLineAndLine(last, next, r);
        else //arco
            sols = circleTangentToCircleAndLine(last, next, r);
    } else { //arco
        if (next.type === 'segment')
            sols = circleTangentToCircleAndLine(next, last, r); //cambiado
        else if (next.type === 'arc')
            sols = circleTangentToCircleAndCircle(last, next, r);
    }

    if (sols.length === 0) return null;
    //Solo una solución debe ser buena, busco aquella cuyos puntos de tangencia estén en los elementos last y next
    let sol = sols.filter(s => {
        let p0 = s._points[0];
        let p1 = s._points[1];

        return ((last.isPointed(p0.x, p0.y, tolerance) && next.isPointed(p1.x, p1.y, tolerance)) || 
                (last.isPointed(p1.x, p1.y, tolerance) && next.isPointed(p0.x, p0.y, tolerance)));
    });

    if (sol.length !== 1) return (null);
    
    sol = sol[0]; //tengo que buscar el punto medio, busco los cortes de la recta que une centro y esquina
    let cuts = lineCutsToCircle(new Segment(sol.x, sol.y, last.pf.x, last.pf.y), sol);
    //si la distancia a la esquina es menor que r, es el bueno, si no, es el contrario
    let d0 = sqDistancePointToPoint(cuts[0].x, cuts[0].y, last.pf.x, last.pf.y);
    let d1 = sqDistancePointToPoint(cuts[1].x, cuts[1].y, last.pf.x, last.pf.y)

    return new Round(sol._points[0], (d0 > d1) ? cuts[1] : cuts[0], sol._points[1]);

}
export function modifyRndChf(path, el, newR, newType){
    if(!el || !path) return(false);
    if (newType !== 'chamfer' && newType !== 'round') return("");
    //els.forEach((e, ix) => (e.idx = ix));
    let ix = path.elements.indexOf(el);
    if (ix < 0 || ix > (path.elements.length - 1))
        return ("fgChamferOrRoundedNoSolutionException");
    if (newR <= 0) { //si 0, borrar
        path.elements.splice(ix, 1);
        return (true);
    }
    let [last, next] = [path.elements[ix-1], path.elements[ix+1]];
    let error;
    if (!( error = testConditions(newR, last, next)))
        return(error);
    let newEl = (newType === 'chamfer') ? calculateChamfer(newR, last, next) : calculateRound(newR, last, next);

    if (!newEl) return ("fgChamferOrRoundedNoSolutionException"); //no hay solución geométrica
    newEl.misc = el.misc;
    path.elements.splice(ix, 1, newEl);

    return GraphicDecorator.decorate(newEl);
}
export function insertRndChf(path, el1, el2, newR, newType){
    if(!el1 || !el2 || !path) return(false);
    if (newType !== 'chamfer' && newType !== 'round') return("");
    let els = path.elements;
    els.forEach((e, ix) => (e.idx = ix));
    let ix1 = els.indexOf(el1);
    if (ix1 < 0 || ix1 > (els.length - 1))
            return ("fgChamferOrRoundedNoSolutionException");
    let ix2 = els.indexOf(el2);
    if (ix2 < 0 || ix2 > (els.length-1))
            return ("fgChamferOrRoundedNoSolutionException");

    if (ix1 > ix2) [ix1,ix2] = [ix2,ix1];
    if (ix1 === 0 && ix2 === (els.length - 1) && (els.length >2)) return ("fgEdgeException");

    let old = els.slice(ix1, ix2).find(el => (el.type === 'round' || el.type === 'chamfer'));
    if (old) return modifyRndChf(path, old, newR, newType); //recursiva 1 vez.
    //Aquí hay que crearlo, ya sabemos que es o round o chamfer, si no ya hemos salido
    let el = (newType === 'chamfer') ? calculateChamfer(newR, els[ix1], els[ix2]) : calculateRound(newR, els[ix1], els[ix2]);
    if (!el) return ("fgRoundedNoSolutionException"); //no hay solución geométrica
    path.elements.splice(els[ix1].idx + 1, 0, el);

    return GraphicDecorator.decorate(el);
}
export function modifyTgIO(path, el, newR, newType){
    if(!path || !el) return(false);
    if (newType !== 'tangentialEntry' && newType !== 'tangentialExit') return("");
    let ix = path.elements.indexOf(el);
    if (ix < 0 || ix > (path.elements.length - 1))
        return ("fgTangentialEntryBadBlocksException");
    if (newR <= 0) { //si 0, borrar
        path.elements.splice(ix, 1);
        return (true);
    }
    let [last, next] = [path.elements[ix-1], path.elements[ix+1]];
    if ((newType === 'tangentialEntry') && (last.type !== 'segment' || (next.type !== 'segment' && next.type !== 'arc')))
        return ("fgTangentialEntryBadBlocksException");
    else if ((newType === 'tangentialExit') && (next.type !== 'segment' || (last.type !== 'segment' && last.type !== 'arc')))
        return ("fgTangentialExitBadBlocksException");
    let newEl;
    if(newType==='tangentialEntry')
        newEl = (next.type === 'segment') ? TangentialEtSegment(last.pi, next, newR, newType) : TangentialEtArc(last.pi, next, newR, newType);
    else
        newEl = (last.type === 'segment') ? TangentialEtSegment(next.pf, last, newR, newType) : TangentialEtArc(next.pf, last, newR, newType);
    if (!newEl) return ("fgTangentialEntryBadBlocksException"); //no hay solución geométrica
    newEl.misc = el.misc;
    path.elements.splice(ix, 1, newEl);

    return GraphicDecorator.decorate(newEl);
}
 
//el elemento base.
export class Path extends Point {
    /*
        Sobrecarga del constructor
            * new Path(element)
            * new Path(elements)
    */
    //we maintain original structure of lines and arcs, better for container and selecting
    constructor(element) {
        super();

        this.elements = Array.isArray(element) ? element : [element];
        this.errors = [];
        //resolve puede dar errores, pero los elementos originales se supone que están bien, podemos sacar la lista de posibles errores
        // Yurre, lo paso a funcional. this.elements = resolve(this.elements);

        this.type = "path";
    }
    set selected(s) {
    }
    get selected() { //propiedad derivada, un path está seleccionado si y solo si todos los elementos están seleccionados
        return this.elements.length && this.elements.every(point => point.selected);
    }
    select(sel) {
        this.elements.forEach(e => e.select(sel));
    }
    toggleSelection() {
        this.elements.forEach(e => e.toggleSelection());
    }
    togglePathSelection() {
        this.selected ? this.toggleSelection() : this.select(true);
    }
    clone() {
        let els = this.elements.map(e => e.clone()); //se clona cada elemento y el map es array nuevo, se supone
        return new Path(els);
    }    
    isClosed() {
        let elements = this.elements.filter(e => ((e.type === "segment") || (e.type === "arc")));
        //Si está cerrado, deben sucederse los elementos
        let pi = elements.map(el => el.pi);
        let pf = elements.map(el => el.pf);
        pi.push(pi.shift());
        return pi.every((el, ix) => (distancePointToPoint(el.x, el.y, pf[ix].x, pf[ix].y)) <= geometryPrecision);
    }
    translate(x, y) {
        this.elements.forEach(e => e.translate(x, y));
    }
    transform(M) {
        this.elements.forEach(e => e.transform(M));
    }
    symmetryX(o) {
        this.elements.forEach(e => e.symmetryX(o));
    }
    symmetryY(o) {
        this.elements.forEach(e => e.symmetryY(o));
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
/*
    findElementPointed(x, y, tol) {
        return this.elements.findIndex(el => (el.isPointed(x, y, tol)));
    }
*/
    //métodos exclusivos de path
    concat(path) { //de fin de this a comienzo de path
        this.elements = this.elements.concat(path.elements);
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
    removeSelected() {
        function orphans(elements) {
            let tmp = [];
            let flag = true;
            elements.forEach(el => {
                if (!flag || (el.type !== 'chamfer' && el.type !== 'round')) {
                    tmp.push(el);

                    if (el.type !== 'point') flag = false; //mantengo a first hasta que llegue algo consistente
                } 
            });

            return tmp;
        }

        let els = [];
        let paths = [];
        this.elements.forEach(el => {
            if (!el.selected) { //si ya no es "primero" meto todo, si es , no meto chaflanes
                els.push(el);                
            } else if (el.type !== "chamfer" && el.type !== "round" && els.length > 0) {
                paths.push(new Path(els));
                els = [];
            }
        });

        if (els.length > 0)
            paths.push(new Path(els));

        paths.forEach(p => {
            p.elements = orphans(p.elements);
            p.elements = orphans(p.elements.reverse()).reverse();
        });

        return paths;
    }
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
    toJSON() {
        return {type: this.type, args: [...this.elements.map(x => Object.assign(x.toJSON(), x.misc ? {misc: x.misc} : {}))]};
    }
}

export class CircleList extends Point {
    /*
        Sobrecarga del constructor
            * new CircleList(element)
            * new CircleList(elements)
    */
    constructor(element) {
        super();

        this.elements = Array.isArray(element) ? element : [element];
        this.errors = [];
        //resolve puede dar errores, pero los elementos originales se supone que están bien, podemos sacar la lista de posibles errores
        // Yurre, lo paso a funcional. this.elements = resolve(this.elements);

        this.type = "circleList";
    }
    set selected(s) {
    }
    get selected() { //propiedad derivada, un path está seleccionado si y solo si todos los elementos están seleccionados
        return this.elements.length && this.elements.every(point => point.selected);
    }
    select(sel) {
        this.elements.forEach(e => e.select(sel));
    }
    toggleSelection() {
        this.elements.forEach(e => e.toggleSelection());
    }
/*
    togglePathSelection() {
        this.selected ? this.toggleSelection() : this.select(true);
    }
    clone() {
        let els = this.elements.map(e => e.clone()); //se clona cada elemento y el map es array nuevo, se supone
        return new Path(els);
    }
    translate(x, y) {
        this.elements.forEach(e => e.translate(x, y));
    }
    transform(M) {
        this.elements.forEach(e => e.transform(M));
    }
    symmetryX(o) {
        this.elements.forEach(e => e.symmetryX(o));
    }
    symmetryY(o) {
        this.elements.forEach(e => e.symmetryY(o));
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
*/
    isInside(r) {
        return this.elements.every(el => el.isInside(r)); 
    }
    points() { return []; }
/*
    findElementPointed(x, y, tol) {
        return this.elements.findIndex(el => (el.isPointed(x, y, tol)));
    }
*/
    toJSON() {
        return {type: this.type, args: [...this.elements.map(x => Object.assign(x.toJSON(), x.misc ? {misc: x.misc} : {}))]};
    }
}

export class Polygon extends Path {
    //Con initial decido cómo quiero que sea el polígono por defecto, no vaya a ser que lo quiera con el vértice abajo en el futuro
    static get initial() { return [Math.PI / 2, Math.PI / 4, Math.PI / 10, 0, 3 * Math.PI / 14, Math.PI / 8]; }
    constructor(x, y, r, nedges = 4) {
        super();

        this.nedges = nedges;
        this.x = x;
        this.y = y;
        this.r = r; //por modificaciones, a mirar

        this.elements = this._updateElements();

        this.type = 'polygon';
    }
    setAttribute(property, value) {
        super.setAttribute(property, value);

        this.elements = this._updateElements();
        this.elements.forEach(el => GraphicDecorator.decorate(el));
    }
    _updateElements() {
        let off = Polygon.initial[this.nedges - 3];
        let delta = 2 * Math.PI / this.nedges;

        let angles = [];
        for (let i = 0; i <= this.nedges; i++) {
            angles.push({c: Math.cos(off + i * delta), s: Math.sin(off + i * delta)});
        }

        return angles.map((el, ix, a) => {
            let ef = (ix === a.length - 1) ? a[0] : a[ix + 1];
            return new Segment(this.x + this.r * el.c, this.y + this.r * el.s, this.x + this.r * ef.c, this.y + this.r * ef.s);
        });
    }
    isClosed() {
        return true;
    }
    isEqual(el) {
        return (Math.abs(el.x - this.x) < geometryPrecision && Math.abs(el.y - this.y) < geometryPrecision && Math.abs(el.r - this.r) < geometryPrecision && el.nedges === this.nedges);
    }
    toJSON() {
        return {type: this.type, args: {x: this.x, y: this.y, r: this.r, nedges: this.nedges}};
    }    
}