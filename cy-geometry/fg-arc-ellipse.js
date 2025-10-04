import { geometryPrecision } from './scripts/fg/lib/geometry/fg-geometry-basic-elements';
import {Point, Line,  sqDistancePointToPoint, distancePointToPoint} from '/scripts/fg/lib/geometry/fg-geometry-basic-elements.js'


function ellipseCenterToEndPoint(cx,cy,rx,ry,fi, tita, deltaTita){
    const cosfi = Math.cos(fi), sinfi = Math.sin(fi);
    //pi
    let costita = Math.cos(tita), sintita = Math.sin(tita);
    const x1 = cx + rx*cosfi*costita - ry*sinfi*sintita;
    const y1 = cy + rx*sinfi*costita - ry*cosfi*sintita;
    //pf
    let costita = Math.cos(tita + deltaTita), sintita = Math.sin(tita +  deltaTita);
    const x2 = cx + rx*cosfi*costita - ry*sinfi*sintita;
    const y2 = cy + rx*sinfi*costita - ry*cosfi*sintita;
    let large = Math.abs(deltaTita > Math.Pi)?1:0;
    let way = deltaTita>0?1:0;
}
function ellipseEndPointToCenter(x1,y1,x2,y2,large,way,rx,ry,fi){
    function scalar(x1,y1,x2,y2){
        let r = (x1*x2 + y1*y2)/(Math.hypot(x1,y1)*Math.hypot(x2,y2));
        return(x1*y2>y1*x2?r:-r);
    }
    const cosfi = Math.cos(fi), sinfi = Math.sin(fi);
    let xp = cosfi*0.5*(x1-x2) + sinfi*0.5*(y1-y2);
    let yp = -sinfi*0.5*(x1-x2) + cosfi*0.5*(y1-y2);
    let r = Math.sqrt((rx*rx*ry*ry - rx*rx*yp*yp - ry*ry*xp*xp) / (rx*rx*yp*yp + ry*ry*xp*xp));
    r = large===way?-r:r;
    cpx = r*rx*yp/ry;
    cpy = -r*ry*xp/rx;
    cx = 0.5*(x1+x2) + cosfi*cpx - sinfi*cpy;
    cy = 0.5*(y1+y2) + sinfi*cpx + cosfi*cpy;
    //SIN TERMINAR?
    tita1 = scalar(1,0,(xp-cpx)/rx, (yp-cpy/ry));
    tita2 = scalar((xp-cpx)/rx, (yp-cpy/ry), (-xp-cpx)/rx, (-yp-cpy/ry));
    tita2 = tita2 < 2*Math.PI? tita2: tita2-Math.PI;

}

//https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii

export class ArcEllipse extends Point{
    constructor(ix, iy, fx, fy, ra, rb, rot, way, large){ 
        super(ix,iy);
        this.type = 'arcEllipse';
        this.pf = new Point(fx, fy);
        this.ra = ra;
        this.rb = rb;
        thiss.rot = rot;
        this.way = way;
        this.large = large;
    }
    
    clone(){
        return new ArcEllipse(this.x, this.y, this.pf.x, this.pf.y, this.ra, this.b, this.rot, this.way, this.large);
    }
    isClosed() {
        return (sqDistancePointToPoint(this.pi.x, this.pi.y, this.pf.x, this.pf.y) <= geometryPrecision2);
    }
    isEqual(el) {   //Falta alguno
        if(el.type !== 'arcEllipse') return false;
        return(this.pi.isEqual(el.pi) && this.pf.isEqual(el.pf)
             && (Math.abs(this.rx - el.rx) < geometryPrecision) && (Math.abs(this.ry - el.ry) < geometryPrecision)
             && (Math.abs(this.rot - el.rot) < geometryPrecision)) 
    }
    translate(x, y) {
        super.translate(x,y);
        this.pf.translate(x,y);
        return this;
    }
    transform(M) { //coordenadas homogéneas
        super.transform(M);
        this.pf.transform(M);
        return this;
    }
    symmetryX(o) {
        super.symmetryX(o);
        this.pf.symmetryX(o);
    }
    symmetryY(o) {
        super.symmetryY(o);
        this.pf.symmetryY(o);
        this.cp1.symmetryY(o);
        this.cp2.symmetryY(o);
    }
    rotate(x, y, M) {
        super.rotate(x, y, M);
        this.pf.rotate(x, y, M);
        this.cp1.rotate(x, y, M);
        this.cp2.rotate(x, y, M);
    }
    scale(x, y, M) {
        super.scale(x, y, M);
        this.pf.scale(x, y, M);
        this.cp1.scale(x, y, M);
        this.cp2.scale(x, y, M);
    }
    reverse() {
        [this.pi, this.cp1, this.cp2, this.pf] = [this.pf, this.cp2, this.cp1, this.pi];
    }
    isPointed(x, y, tol) {  //Este ye difícil
        //return areClose(this.x, this.y, x, y, tol);
    }
    isInside(r) {
      return (r.contains(this.pi) && r.contains(this.pf) && r.contains(this.cp1) && r.contains(this.cp2) );
    }
    points() {
        return [this.pi, this.pf];
    }
    pathPoints() {
        return [this.pf];
    }
    toJSON() {
        return {type: this.type, args: {ix: this.x, iy: this.y, cp1x: this.cp1.x, cp1y: this.cp1.y, cp2x: this.cp2.x, cp2y: this.cp2.y, fx: this.pf.x, fy: this.pf.y}};
    }


    eval(t){
     //   let s = t<0?0:t>1?1:t;

    }
    splitAt(t){
        let s = t<0?0:t>1?1:t;
        //de Casteljeau
        let m0 = Object.assign({},{x: this.p0.x + this.A0.x * s, y: this.p0.y + this.A0.y * s })
        let m1 = Object.assign({},{x: this.p1.x + this.A1.x * s, y: this.p1.y + this.A1.y * s })
        let m2 = Object.assign({},{x: this.p2.x + this.A2.x * s, y: this.p2.y + this.A2.y * s })
        //segundo orden
        let q0 = Object.assign({},{x: m0.x + this.D0.x * s, y: this.m0.y + this.D0.y * s })
        let q1 = Object.assign({},{x: m1.x + this.D1.x * s, y: this.m1.y + this.D1.y * s })
        //tercer orden
        let r = Object.assign({},{x: q0.x + this.E0.x * s, y: this.q0.y + this.E0.y * s })

        let left = new cubicBezier(this.p0, m0, q0, r);
        let right = new cubicBezier(r, q1, m2, this.p3);
        return([left, right]);
    }
}
//elipse completa
export class Ellipse extends Point{
    constructor(x,y,rx,ry){
        super(x,y);
        this.rx = rx;
        this.ry = ry;
    }
}

