"use strict";
import { translatePoint, transformPoint, pointSymmetricSegment } from '../cy-geometry-library.js'


//Por motivos operativos se mantiene una formulación interna optimizada con el vector director y la distancia al origen.
//Es decir la recta en formato interno se mantiene con ux*x + uy*y + c = 0 (ax+by+c = 0) con ux*ux + uy*uy = 0
//La distancia punto (x,y) a recta (ax+by+c=0) se define como abs(ax+by+c)/(sqrt(a*a + b*b))
//La distancia al origen (0,0) es d = abs(c)

//No sobrecargo el constructor básico. En su lugar exporto la createDrawElement, una sola función
// con tipos y subtipos de parámetros.
// De esa manera se pueden separar los códigos para parsers o interactivo de forma más sencilla

export function createSegment(data) {
        const segment = {x0 : data.x0, y0 : data.y0, x1 : data.x1, y1 : data.y1, type : 'segment'}
        segmentCalculate(segment);
        return segment;
    }
function segmentCalculate(segment){
        const dx = (segment.x1-segment.x0), dy = (segment.y1-segment.y0);
        segment.d = Math.hypot(dx, dy);
        segment.ux = dx / segment.d; segment.uy = dy / segment.d; 
        segment.alfa = Math.atan2(segment.uy, segment.ux) * 180 / Math.PI;
        //pero hay que recalcular c, distancia de la recta al punto 0,0
        segment.c = segment.y0 * segment.ux - segment.x0 * segment.uy;
        segment.bbox = calculateBbox(segment );
    }
function calculateBbox(segment){
        return({x0: Math.min(segment.x0, segment.x1), y0:Math.min(segment.y0, segment.y1), x1:Math.max(segment.x0, segment.x1), y1:Math.max(segment.y0, segment.y1)})
    }
    //Para poder tener acceso en modo punto
    // get pi(){ return ({x:this.x0,y:this.y0})} 
    // get pf(){ return ({x:this.x1,y:this.y1})} 

    // toJSON(){ //Lo necesario para el constructos, para no llamar a createDraw,
    //     return {type:"segment", data:{x0:this.x0, y0:this.y0, x1:this.x1, y1: this.y1}};
    // }
    // static fromJSON(data){
    //     return new Segment(data);
    // }

    //TODO
    // isEqual(el) {
    //     return (Math.abs(el.x - this.x) < geometryPrecision && Math.abs(el.y - this.y) < geometryPrecision);
    // }
export function segmentClone(segment) {
        return JSON.parse(JSON.stringify(segment));
    }
export function segmentMidpoint(segment){
        return({x: 0.5*(segment.x0 + segment.x1), y: 0.5*(segment.y0 + segment.y1)})
    }
export function segmentTranslate(segment, dx, dy) {
        const newSegment = segmentClone(segment);
        [newSegment.x0, newSegment.y0] = translatePoint(segment.x0, segment.y0, dx, dy);
        [newSegment.x1, newSegment.y1] = translatePoint(segment.x1, segment.y1, dx, dy);
        return newSegment;
    }
//     transform(M) {
//         //super.transform(M); //transformo punto
//  //coordenadas homogéneas
//         //usamos la misma filosofía de svg, 6 elementos: a,b,c,d,e,f , en un objeto
//         [this.x0, this.y0] = transformPoint(this.x0, this.y0, M);
//         [this.x1, this.y1] = transformPoint(this.x1, this.y1, M);
//         this._calculate();
//     }
export function segmentSymmetryX(segment, y) {
        const newSegment = segmentClone(segment);
        newSegment.y0 = 2*y - segment.y0;
        newSegment.y1 = 2*y - segment.y1;
        return newSegment;
    }
export function segmentSymmetryY(segment, x) {
        const newSegment = segmentClone(segment);
        newSegment.x0 = 2*x - segment.x0;
        newSegment.x1 = 2*x - segment.x1;
        return newSegment;
    }

    //Simetría respecto a un segmento, me deben pasar una clase segmento
export function segmentSymmetryL(segment, s) {
        const newSegment = segmentClone(segment);
        [newSegment.x0, newSegment.y0] = pointSymmetricSegment(s, segment.x0, segment.y0);
        [newSegment.x1, newSegment.y1] = pointSymmetricSegment(s, segment.x1, segment.y1);
        return newSegment;
    }
export function segmentRotate(segment, x, y, M) {
        return segmentTranslate(segmentRotate0(segmentTranslate(segmentClone(segment), x, y), alfa), -x, -y);
    }
export function segmentScale(x, y, M) {
        return segmentTranslate(segmentScale0(segmentTranslate(segmentClone(segment), x, y), alfa), -x, -y);
    }
export function segmentReverse() {
        const newSegment = segmentClone(segment);
        [newSegment.x0, newSegment.x1] = [newSegment.x1, newSegment.x0];
        [newSegment.y0, newSegment.y1] = [newSegment.y1, newSegment.y0];
        calculate(newSegment);
        return newSegment;
    }
