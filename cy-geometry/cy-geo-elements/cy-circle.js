"use strict";
//import {geometryPrecision, circleFrom3Points, arc3P2SVG, arc2PR2SVG, arcCPA, arcWay} from './cy-geometry-library.js'
import { translatePoint, pointSymmetricSegment } from '../cy-geometry-library.js'

//Datos: centro y punto. El centro tiene como alias a x0,y0, igualamos nomenclatura con arco

export class Circle{ 
    constructor(data = {}) {
        this.cx = data.cx, this.cy = data.cy;
        this.x0 = this.cx, this.y0 = this.cy;   //el alias mejora mucho la unificación de nombres en algunos casos
        this.x1 = data.x1, this.y1 = data.y1;
        this.r = Math.hypot(this.x1-this.cx, this.y1-this.cy);
        this.type = 'circle';
        this.bbox = this._bbox();
    }
    get p0() { return {x:this.cx, y: this.cy}; }
    //El punto es útil para tratar posteriormente el circulo como un arco y, posiblemente, como punto de entrada y/o salida
    //get pi() { return {x:this.x1, y: this.y1}; }
    //get pf() { return {x:this.x1, y: this.y1}; }

    _bbox(){ return({x0: this.cx - this.r, y0: this.cy - this.r, x1: this.cx + this.r, y1: this.cy + this.r})}

    //TODO rehacer con un new Circle(this)
    translate(dx, dy) {
        const [cx, cy] = translatePoint(this.cx, this.cy, dx, dy);
        const [x1, y1] = translatePoint(this.x1, this.y1, dx, dy);
        return new Circle({cx:cx, cy:cy, x1:x1, y1:y1})
    }
    //y0p = y - (y0 -y) = 2*y - y0
    symmetryX( y){
        return new Circle({cx:this.cx, cy:2*y - this.cy, x1:this.x1, y1:2*y - this.y1})
    }
    symmetryY( x){
        return new Circle({cx:2*x - this.cx, cy:this.cy, x1:2*x - this.x1, y1:this.y1})
    }
    symmetryL(s){
        const [cx, cy] = pointSymmetricSegment(s, this.cx, this.cy);
        const [x1, y1] = pointSymmetricSegment(s, this.x1, this.y1);
        return new Circle({cx:cx, cy:cy, x1:x1, y1:y1})
    }
    clone() {
        return new Circle({cx:this.cx, cy:this.cy, x1:this.x1, y1:this.y1});
    }
    isEqual(c) {
       // return (Math.abs(c.x - this.x) <= geometryPrecision && Math.abs(c.y - this.y) <= geometryPrecision && Math.abs(c.r - this.r) <= geometryPrecision);
    }
    toJSON(){
        return {type:"circle", data:{ cx:this.cx, cy:this.cy, x1:this.x1, y1: this.y1}};
    }
    static deserialize(data){
        return new Circle(data);
    }

}