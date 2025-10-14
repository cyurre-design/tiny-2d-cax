"use strict";
import { translatePoint, transformPoint, pointSymmetricSegment } from '../cy-geometry-library.js'


//Por motivos operativos se mantiene una formulación interna optimizada con el vector director y la distancia al origen.
//Es decir la recta en formato interno se mantiene con ux*x + uy*y + c = 0 (ax+by+c = 0) con ux*ux + uy*uy = 0
//La distancia punto (x,y) a recta (ax+by+c=0) se define como abs(ax+by+c)/(sqrt(a*a + b*b))
//La distancia al origen (0,0) es d = abs(c)

//No sobrecargo el constructor básico. En su lugar exporto la createDrawElement, una sola función
// con tipos y subtipos de parámetros.
// De esa manera se pueden separar los códigos para parsers o interactivo de forma más sencilla

export class Segment {
    constructor(data = {}) {    //suponemos que no exportaré la clase y los puntos vienen definidos
        this.x0 = data.x0; this.y0 = data.y0;
        this.x1 = data.x1; this.y1 = data.y1;
        this._calculate();
        this.type = 'segment';
    }
    _calculate(){
        const dx = (this.x1-this.x0), dy = (this.y1-this.y0);
        this.d = Math.hypot(dx, dy);
        this.ux = dx / this.d; this.uy = dy / this.d; 
        this.alfa = Math.atan2(this.uy, this.ux) * 180 / Math.PI;
        //pero hay que recalcular c, distancia de la recta al punto 0,0
        this.c = this.y0 * this.ux - this.x0 * this.uy;
        this.bbox = this._calculateBbox( );
    }
    _calculateBbox(){
        return({x0: Math.min(this.x0, this.x1), y0:Math.min(this.y0, this.y1), x1:Math.max(this.x0, this.x1), y1:Math.max(this.y0, this.y1)})
    }
    //Para poder tener acceso en modo punto
    get pi(){ return ({x:this.x0,y:this.y0})} 
    get pf(){ return ({x:this.x1,y:this.y1})} 

    save(){
        return this;
    }
    restore(data){
        Object.entries(data).forEach(([k,v]) => this[k]=v)
    }
    toJSON(){ //Lo necesario para el constructos, para no llamar a createDraw,
        return {type:"segment", data:{x0:this.x0, y0:this.y0, x1:this.x1, y1: this.y1}};
    }
    static fromJSON(data){
        return new Segment(data);
    }

    isClosed() {
        return true;
    }
    //TODO
    // isEqual(el) {
    //     return (Math.abs(el.x - this.x) < geometryPrecision && Math.abs(el.y - this.y) < geometryPrecision);
    // }
    clone() {
        return new Segment(this);
    }
    midpoint(){
        return({x: 0.5*(this.x0 + this.x1), y: 0.5*(this.y0 + this.y1)})
    }
    translate(dx, dy) {
        const [x0, y0] = translatePoint(this.x0, this.y0, dx, dy);
        const [x1, y1] = translatePoint(this.x1, this.y1, dx, dy);
        return new Segment({x0:x0, y0:y0, x1:x1, y1:y1});
    }
    transform(M) {
        //super.transform(M); //transformo punto
 //coordenadas homogéneas
        //usamos la misma filosofía de svg, 6 elementos: a,b,c,d,e,f , en un objeto
        [this.x0, this.y0] = transformPoint(this.x0, this.y0, M);
        [this.x1, this.y1] = transformPoint(this.x1, this.y1, M);
        this._calculate();
    }
    symmetryX(y) {
        return new Segment({x0:this.x0, y0:2*y - this.y0, x1:this.x1, y1:2*y - this.y1});
    }
    symmetryY(x) {
        return new Segment({x0:2*x - this.x0, y0:this.y0, x1:2*x - this.x1, y1:this.y1});
    }
    //Simetría respecto a un segmento, me deben pasar una clase segmento
    symmetryL(s) {
        const [x0, y0] = pointSymmetricSegment(s, this.x0, this.y0, s);
        const [x1, y1] = pointSymmetricSegment(s, this.x1, this.y1, s);
        return new Segment({x0:x0, y0:y0, x1:x1, y1:y1});
    }
    rotate(x, y, M) {
        this.translate(x, y);
        this.transform(M);
        this.translate(-x, -y);
    }
    scale(x, y, M) {
        this.translate(x, y);
        this.transform(M);
        this.translate(-x, -y);
    }
    reverse() {
        [this.x0, this.x1] = [this.x1, this.x0];
        [this.y0, this.y1] = [this.y1, this.y0];
        this._calculate();
    }
    // isPointed(x, y, tol) {
    //     //suponemos que ya hemos mirado que está en el bbox del segmento!!
    //     return distancePointToLine(x, y, this) <= tol;
    // }
    isInside(r) {
        //return (r.contains(this.pi) && r.contains(this.pf)); //design: both inside
    }
    points() {
        return [];
    }
    pathPoints() {
        return [];
    }

}
