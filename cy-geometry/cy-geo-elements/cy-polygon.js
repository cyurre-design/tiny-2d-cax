
"use strict";
import { translatePoint, pointSymmetricSegment } from '../cy-geometry-library.js'

//args: centro(x0,y0), radio, edges, delta, alfa inicial

export class Polygon{
    constructor(data = {}) {
        this.type = 'polygon';
        this.edges = data.edges;
        this.cx = data.cx; this.cy = data.cy;
        this.x0 = this.cx; this.y0 = this.cy;
        this.r = data.r;
        //en data ya me viene delta y alfa
        this.delta = data.delta;     //2 * Math.PI / this.edges;
        this.alfai = data.alfai;       //this.alfa * Math.PI /180;
        this._calculateSegments();
        this.bbox = this._bbox()    ;
    }
    get p0() {  return {x:this.x0, y: this.y0};    }
    get c() {  return {x:this.x0, y: this.y0};    }
    //NO genero todos los segmentos, porque de momento no hacen falta como clases independientes
    _calculateSegments(){
        this.segments = [];
        for(let i = 0; i < this.edges; i++){
            this.segments.push({x0:this.cx + this.r*Math.cos(this.alfai + i * this.delta), y0:this.cy + this.r*Math.sin(this.alfai + i * this.delta)});
        }
    }
    //esta no es exacta....TODO
    _bbox(){ return({x0: this.cx - this.r, y0: this.cy - this.r, x1: this.cx + this.r, y1: this.cy + this.r})}
    translate(dx,dy){
        const [cx, cy] = translatePoint(this.cx, this.cy, dx, dy);
        return new Polygon({cx:cx, cy:cy, r:this.r, edges:this.edges, delta:this.delta, alfai:this.alfai});
    }
    clone() { 
        return new Polygon(this);
    }
    symmetryX( y){
        return new Polygon({cx:this.cx, cy:2*y - this.cy, r:this.r, edges:this.edges, delta:-this.delta, alfai:-this.alfai});
    }
    symmetryY( x){
        return new Polygon({cx:2*x - this.cx, cy:this.cy, r:this.r, edges:this.edges, delta:-this.delta, alfai:Math.PI-this.alfai});
    }
    symmetryL(s){
        const [x, y] = pointSymmetricSegment(s, this.segments[0].x0, this.segments[0].y0);
        const [cx, cy] = pointSymmetricSegment(s, this.cx, this.cy);
        const alfai = Math.atan2(y - cy, x - cx)
        return new Polygon({cx:cx, cy:cy, r:this.r, edges:this.edges, delta:-this.delta, alfai:alfai});
    }
    
    isEqual(c) {
       // return (Math.abs(c.x - this.x) <= geometryPrecision && Math.abs(c.y - this.y) <= geometryPrecision && Math.abs(c.r - this.r) <= geometryPrecision);
    }
    // isInside(r) {
    //     //return (r.contains({x: this.x + this.r, y: this.y}) && r.contains({x: this.x - this.r, y: this.y}) && r.contains({x: this.x, y: this.y + this.r}) && r.contains({x: this.x, y: this.y - this.r}));
    // }
    // isPointed(x, y, tol) { //TODO
    //     if(Math.abs(distancePointToPoint(this.cx, this.cy, x, y) - this.r) <= tol) return true;
    //     return(this.segments.some(s=>s.isPointed(x,y,tol)));

    // }
    toJSON(){
        return {type:"polygon", data:{r:this.r, cx:this.cx, cy:this.cy, edges:this.edges, delta:this.delta, alfai:this.alfai}};
    }
    static deserialize(data){
        return new Polygon(data);
    }
}

