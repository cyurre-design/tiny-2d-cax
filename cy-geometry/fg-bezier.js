import {Point, Line,   Arc, Circle, geometryPrecision,sqDistancePointToPoint, distancePointToPoint} from './fg-geometry-basic-elements.js'
import {_lineCutsToLine, _solveq} from './fg-geometry-library.js'
/* function calculateInflectionPoints(b){
    let a = Math.sqrt(b.A0.x*b.A0.x + b.A0.y*b.A0.y);
    let d = Math.sqrt(b.D0.x*b.D0.x + b.D0.y*b.D0.y);
    let e = Math.sqrt(b.E0.x*b.E0.x + b.E0.y*b.E0.y);
    let f = b.A0.x*b.D0.x +b.A0.y*b.D0.y;
    let g = b.A0.x*b.E0.x +b.A0.y*b.E0.y;
    let h = b.D0.x*b.E0.x +b.D0.y*b.E0.y;
    let o = b.A0.x*b.D0.y - b.A0.y*b.D0.x;
    let o = b.D0.x*b.E0.y - b.D0.y*b.E0.x;
    let q = b.A0.x*b.E0.y - b.A0.y*b.E0.x;
    //solveq... en pt^2 + qt + o = 0;
    //casos de derivada primera nula o segunda nula
} */

//elevación de grado, dada una c. de bezier de grado n con n+1 puntos  de control, se obtiene la misma, en grado n+1 por
// Q(i) = (i / (n+1))P(i-1) + (1 - (i / (n+1)))P(i) para 1<= i <= n
//Como la curva es de n=2 necesitamos dos nuevos puntos de control cp1 y cp2
// cp1 = Q1 = (1/3)*P0 + (1-1/3)*P1 = 1/3(P0 + 2P1)
// cp2 = Q2 = (1/3)*P1 + (1-1/3)*P2 = 1/3(P1 + 2P2)

export class Bezier extends Point{
    constructor(ix, iy, c1x, c1y, c2x, c2y, fx, fy){ 
        super(ix,iy);
        this.type = 'bezier';
        if(fx !== undefined){
            //this.p0 = new Point(ix, iy);
            this.cp1 = new Point(c1x, c1y);
            this.cp2 = new Point(c2x, c2y);
            this.pf = new Point(fx, fy);
        }
        else{//elevo grado, paso de cuadrática a cúbica
            //this.p0 = new Point(ix, iy);
            this.pf = new Point(c2x, c2y);
            this.cp1 = new Point((ix + 2*c1x)/3, (iy + 2*c1y)/3);
            this.cp2 = new Point((c1x + 2*c2x)/3, (c1y + 2*c2y)/3);
        }
    }
    //interpola al punto t
    interpolate(t){
        let it = 1-t;
        return new Point(
            it*it*it*x  + 3*it*it*t*this.cp1.x + 3*it*t*t*this.cp2.x + t*t*t*this.pf.x ,
            it*it*it*y  + 3*it*it*t*this.cp1.y + 3*it*t*t*this.cp2.y + t*t*t*this.pf.y); 
    }
    //calcula el incentro del triángulo de un bezier (restringido en ángulo)
    calculateIncenter(){
        //const a = new Line(this.x, this.y, this.cp1x, this.cp1y); 
        //const b = new Line(this.cp2.x, this.cp2.y, this.pf.x, this.pf.y); 
        const v = _lineCutsToLine(new Line(this.x, this.y, this.cp1x, this.cp1y),new Line(this.cp2.x, this.cp2.y, this.pf.x, this.pf.y));
        const a = distancePointToPoint(V.x, V.y, this.x, this.y);
        const b = distancePointToPoint(V.x, V.y, this.pf.x, this.pf.y);
        const c = distancePointToPoint(this.x, this.y, this.pf.x, this.pf.y);
        const s = a + b + c; //perímetro
        return(new Point((a*this.pf.x + b*this.x + c*v.x) / s , (a*this.pf.y + b*this.y + c*v.y) / s));
    }

    calculateConvexHull(){
        this.A0 = new Point(this.cp1.x - this.pi.x, this.cp1.y - this.pi.y);
        this.A1 = new Point(this.cp2.x - this.cp1.x, this.cp2.y - this.cp1.y);
        this.A2 = new Point(this.pf.x - this.cp2.x, this.pf.y - this.cp2.y);
        this.D0 = new Point(this.A1.x - this.A0.x, this.A1.y - this.A0.y);
        this.D1 = new Point(this.A2.x - this.A1.x, this.A2.y - this.A1.y);
        this.E0 = new Point(this.D1.x - this.D0.x, this.D1.y - this.D0.y);
    }
    calculateInflexionPoints(){
        const a = {x: this.cp1.x - this.x, y:this.cp1.y - this.y};
        const b = {x: this.cp2.x - this.cp1.x - a.x, y: this.cp2.y - this.cp1.y - a.y};
        const c = {x: this.pf.x - this.cp2.x - a.x -2*b.x, y: this.pf.y - this.cp2.y - a.y -2*b.y};
        const inflections = solveq(a,b,c);
        return(inflections);
    }
    isClockWise(){
        /// The orientation of the Bezier curve
        /// </summary>
        let sum = 0;
        sum += (this.cp1.x - this.x) * (this.cp1.y + this.y);
        sum += (this.cp2.x - this.cp1.x) * (this.cp2.y + this.cp1.y);
        sum += (this.pf.x - this.cp2.x) * (this.pf.y + this.cp2.y);
        sum += (this.x - this.pf.x) * (this.y + this.pf.y);
        return (sum < 0);
    }
    clone(){
        return new Bezier(this.x, this.y, this.cp1.x, this.cp1.y, this.cp2.x, this.cp2.y, this.pf.x, this.pf.y);
    }
    isClosed() {
        return (sqDistancePointToPoint(this.pi.x, this.pi.y, this.pf.x, this.pf.y) <= geometryPrecision2);
    }
    isEqual(el) {
        if(el.type !== 'bezier') return false;
        return(this.pi.isEqual(el.pi) && this.pf.isEqual(el.pf) && this.cp1.isEqual(el.cp1) && this.cp2.isEqual(el.cp2)) 
    }
    translate(x, y) {
        super.translate(x,y);
        this.pf.translate(x,y);
        this.cp1.translate(x,y);
        this.cp2.translate(x,y);
        return this;
    }
    transform(M) { //coordenadas homogéneas
        super.transform(M);
        this.pf.transform(M);
        this.cp1.transform(M);
        this.cp2.transform(M);
        return this;
    }
    symmetryX(o) {
        super.symmetryX(o);
        this.pf.symmetryX(o);
        this.cp1.symmetryX(o);
        this.cp2.symmetryX(o);
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
    //condiciones de hermite + incenter (transition point)
    //https://dlacko.org/blog/2016/10/19/approximating-bezier-curves-by-biarcs/
    calculateBiarc(g ){
        let cw = this.isClockWise();
        function calculateCircle(p1, p2, g){
            //let t1 = new Line(this.cp1.x, this.cp1.y, this.x, this.y, );
            let t = new Line(p1.x, p1.y, p2.x, p2.y );
            let tl = lineNormalToLine(t1, p1);
            let p2g = new Line(p1.x, p1.y, g.x, g.y);
            let m = new Point((p1.x + g.x )/2, (p1.y + g.y )/2)
            let lm = lineNormalToLine(p2g, m);
            let c = _lineCutsToLine(tl, lm);
            let r = distancePointToPoint(c.x, c.y, p1.x, p1.y);
            return(new Circle(c.x, c.y, r));
            }
        const c1 = calculateCircle(this, this.cp1, g);
        const c2 = calculateCircle(this.pf, this.cp2, g);
        //Atton. way
        let a1 = new Arc(c1.x, c1.y, r1, new Point(this.x, this.y), g);
        let a2 = new Arc(c2.x, c2.y, r2, g, this.pf);
        return( new Biarc(a1, a2));
    }
    splitAtInflexionPoints(){
        const tramos = [];
        if(distancePointToPoint(x, y, this.pf.x, this.pf.y) < geometryPrecision){
            tramos = tramos.concat(this.splitAt(0.5));
        }
        else if((distancePointToPoint(x, y, this.cp1.x, this.cp1.y) < geometryPrecision) ||
        (distancePointToPoint(this.pf.x, this.pf.y, this.cp2.x, this.cp2.y) < geometryPrecision)){
            tramos.push(this.clone()); //discutible
        }
        else{
            let inxpoints = this.calculateInflectionPoints(); // 0, 1 o 2
            if(inxpoints.length === 0)
                tramos.push(this.clone());
            else if(inxpoints.length === 1)
                tramos = tramos.concat(this.splitAt(inxpoints[0]))
            else{
                // Make the first split and save the first new curve. The second one has to be splitted again
                // at the recalculated t2 (it is on a new curve)
                inxpoints.sort(); 
                let splited = this.splitAt(inxpoints[0]);
                tramos.push(splited.shift());
                tramos = tramos.concat(splited.shift().splitAt((1-inxpoints[0])*inxpoints[1] )); //reparametrización
                t2 = (1 - t1) * t2;
            }
        }
        return(tramos);
    }
    approximate(){
        const maxTestPoints = 8;
        let testPoints = Array.from({length:maxTestPoints},(_,i)=>i/maxTestPoints);
        let tramos = this.splitAtInflexionPoints(); //devuelve array de beziers, se supone
        let biarcs = [];    //lo que voy a devolver
        while(tramos.length > 0){
            let bezier = tramos.shift();
            while(tramos.length > 0){
                bezier = tramos.shift();
                const g = bezier.calculateIncenter(); //igual hay que tratar alguna excepción primero
                    //caculate Biarc
                let biarc = bezier.calculateBiarc(g);
                    // Calculate the maximum error , vamos a dividir donde sea máximo
                let err = testPoints.reduce((e, t)=>{
                    const bz = bezier.interpolate(t);
                    const ba = biarc.interpolate(t);
                    let d = distancePointToPoint(bz.x, bz.y, ba.x, ba.y);
                    if( d > e.error)
                        e = {error:d, t:t} 
                }, {error:-1, t:-1});
                if(err.error < tolerance){ //ok
                    biarcs.push(biarc);
                }
                else{
                    tramos = bezier.splitAt(err.t).concat(tramos);
                }
            }
        }
    }

}
//clase de apoyo, instrumental
class Biarc{
    constructor(a, b){  //se supone que le pasamos los do arcos tangentes, se puede pasar la rutina de cálculos
        this.a = a;
        this.b = b;
        this.lengtha = Math.abs(this.a.r*(this.a.a3 - this.a.a1)); //revisar, a3 debe ser mayor que a1
        this.lengthb = Math.abs(this.b.r*(this.b.a3 - this.b.a1)); //revisar, a3 debe ser mayor que a1
        this.length = this.lengtha + this.lengthb;
        this.s = this.lengtha / this.length;
    }
    intepolateArc(arc, t){
        let alfa = arc.a1 + t*(arc.a3-arc.a1);
        return({x: arc.x + arc.r*Math.cos(alfa), y: arc.y + arc.r*Math.cos(alfa)});
    }
    interpolate( t) {
        return( t <= this.s? this.interpolateArc(this.a, t/ this.s): this.interpolateArc(this.b, (t - this.s) /(1 - this.s)));
    }

}
