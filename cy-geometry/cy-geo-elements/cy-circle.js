"use strict";
//import {geometryPrecision, circleFrom3Points, arc3P2SVG, arc2PR2SVG, arcCPA, arcWay} from './cy-geometry-library.js'
import { translatePoint, pointSymmetricSegment } from '../cy-geometry-library.js'

//Datos: centro y punto. El centro tiene como alias a x0,y0, igualamos nomenclatura con arco

export function createCircle(data = {}) {
    const circle = {
        cx  : data.cx, cy : data.cy,
        x0  : data.cx, y0 : data.cy,   //el alias mejora mucho la unificación de nombres en algunos casos
        x1  : data.x1, y1 : data.y1,
        r   : Math.hypot(data.x1 - data.cx, data.y1 - data.cy),
        type : 'circle'
    }
    circle.bbox = circleBbox(circle);
    return circle;
    }
    //get p0() { return {x:this.cx, y: this.cy}; }
    //El punto es útil para tratar posteriormente el circulo como un arco y, posiblemente, como punto de entrada y/o salida
    //get pi() { return {x:this.x1, y: this.y1}; }
    //get pf() { return {x:this.x1, y: this.y1}; }

export function circleBbox(circle){ return({x0: circle.cx - circle.r, y0: circle.cy - circle.r, x1: circle.cx + circle.r, y1: circle.cy + circle.r})}
export function circleClone(clone){ return JSON.parse(JSON.stringify(circle))}
    //TODO rehacer con un new Circle(this)
export function circleTranslate(circle, dx, dy) {
    return createCircle({cx:circle.cx+dx, cy:circle.cy+dy, x0:circle.x0+dx, y0:circle.y0+dy, x1:circle.x1+dx, y1:circle.y1+dy})
    }
    //y0p = y - (y0 -y) = 2*y - y0
export function circleSymmetryX(circle, y){
    return createCircle({cx:circle.cx, cy:2*y - circle.cy, x0:circle.x0, y0:2*y - circle.y0, x1:circle.x1, y1:2*y - circle.y1 })
    }
export function circleSymmetryY(circle, x){
    return createCircle({cx:2*x - circle.cx, cy:circle.cy, x0:2*x - circle.x0, y0:circle.y0, x1:2*x - circle.x1, y1:circle.y1 })
    }
export function circleSymmetryL(circle, s){
    const newCircle = circleClone(circle);
    [newCircle.cx, newCircle.cy] = pointSymmetricSegment(s, circle.cx, circle.cy);
    [newCircle.x0, newCircle.y0] = [newCircle.cx, newCircle.cy];
    [newCircle.x1, newCircle.y1] = pointSymmetricSegment(s, circle.x1, circle.y1);
    }
