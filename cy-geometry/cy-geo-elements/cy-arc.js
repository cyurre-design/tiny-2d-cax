"use strict";
import {geometryPrecision, _2PI, sqDistancePointToPoint, translatePoint, fuzzy_eq_point,
    pointWithinArcSweep, rotateZ, scale0, arc2PC2SVG, pointSymmetricSegment,
    normalize_radians} from '../cy-geometry-library.js'

//args centro(cx, cy), radio, pi(x1,y1), pf(x2,y2), ai, da, fS, fA En realidad son redundantes, pero se calcularían en el createDraw
//Falta tratamiento de errores
//Para conservar igualdad de nomenclatura mantenemos el x0,y0 como centro, como en el círculo
export function createArc(data = {}) {
    const p = {type : 'arc', get pi(){ return ({x:this.x1, y: this.y1})}, get pf(){ return ({x:this.x2, y: this.y2})}}
    const a = Object.assign(p, data);       
    //a.x0 = data.x0; a.y0 = data.y0;
    a.bbox = arcBoundingBox(a);
    console.log(a.bbox);
    return a;
    }

const TAU = 2 * Math.PI;
function angleOnArc(arc, a) {
    const s = Math.sign(arc.da);
    const d = (a - arc.ai) * s;
    return d >= 0 && d <= Math.abs(arc.da);
}
 
function arcBoundingBox (arc, eps = geometryPrecision){
    //caso frontera
    if (Math.abs(arc.da) >= TAU) 
        return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r};
  
        //BBox del segmento de pi a pf. Si el arco no atraviesa cuadrantes, sería el bbox
        const bbox = {x0:Math.min(arc.x1, arc.x2), y0:Math.min(arc.y1, arc.y2), x1:Math.max(arc.x1, arc.x2), y1:Math.max(arc.y1, arc.y2)};
        const sin = [0, 1, 0, -1], cos = [1, 0, -1, 0];
        [0, 0.5*Math.PI, Math.PI, 1.5*Math.PI].forEach( (a, ix) => {
            if( angleOnArc(arc, a) ){
                const x = arc.cx + arc.r * cos[ix];
                const y = arc.cy + arc.r * sin [ix];
                bbox.x0 = Math.min(bbox.x0, x);
                bbox.x1 = Math.max(bbox.x1, x);
                bbox.y0 = Math.min(bbox.y0, y);
                bbox.y1 = Math.max(bbox.y1, y);
            }
        })
        return bbox;
    }
export function arcMidpoint(a){
    const midAngle = (a.ai + a.da/2);
    return {x: a.cx + a.r * Math.cos(midAngle), y: a.cy + a.r * Math.sin(midAngle)};
}

export function arcTranslate(a, dx, dy) {
        const [cx, cy] = translatePoint(a.cx, a.cy, dx, dy);
        const [x1, y1] = translatePoint(a.x1, a.y1, dx, dy);
        const [x2, y2] = translatePoint(a.x2, a.y2, dx, dy);

        return createArc(arc2PC2SVG({x:cx, y:cy}, a.r, {x:x1, y:y1}, {x:x2, y:y2}, a.way));
    }
export function arcRotate(a, x, y, alfa){
        const [tcx, tcy] = rotateZ(a.cx - x, a.cy - y, alfa);
        const [t1x, t1y] = rotateZ(a.x1 - x, a.y1 - y, alfa);
        const [t2x, t2y] = rotateZ(a.x2 - x, a.y2 - y, alfa);
        return createArc(arc2PC2SVG({x: tcx + x, y: tcy + y}, a.r, {x: t1x + x, y: t1y + y}, {x: t2x + x, y: t2y + y}, a.way));
}
export function arcScale(a, x, y, scale){
        const [scx, scy] = scale0(a.cx - x, a.cy - y, scale);
        const [s1x, s1y] = scale0(a.x1 - x, a.y1 - y, scale);
        const [s2x, s2y] = scale0(a.x2 - x, a.y2 - y, scale);
        return createArc(arc2PC2SVG({x: scx + x, y: scy + y}, a.r*scale, {x: s1x + x, y: s1y + y}, {x: s2x + x, y: s2y + y}, a.way));
}
    //en los simetría doy vuelta a los puntos pi pf
export function arcSymmetryX(a, y) {
        return createArc(arc2PC2SVG({x:a.cx, y:2*y - a.cy}, a.r, {x:a.x1, y:2*y - a.y1}, {x:a.x2, y:2*y - a.y2}, (a.way==='clock'?'antiClock':'clock')));
    }
export function arcSymmetryY(a, x) {
        return createArc(arc2PC2SVG({x:2*x - a.cx, y:a.cy}, a.r, {x:2*x - a.x1, y:a.y1}, {x:2*x - a.x2, y:a.y2}, (a.way==='clock'?'antiClock':'clock')));
    }
export function arcSymmetryL(a, s) {
        const [cx, cy] = pointSymmetricSegment(s, a.cx, a.cy);
        const [x1, y1] = pointSymmetricSegment(s, a.x1, a.y1);
        const [x2, y2] = pointSymmetricSegment(s, a.x2, a.y2);
        return createArc(arc2PC2SVG({x:cx, y:cy}, a.r, {x:x1, y:y1}, {x:x2, y:y2}, (a.way==='clock'?'antiClock':'clock')));
    }
export function arcReverse(a){
    return createArc(arc2PC2SVG({x:a.cx, y:a.cy}, a.r, {x:a.x2, y:a.y2}, {x:a.x1, y:a.y1}, (a.way==='clock'?'antiClock':'clock')));
}
export function arcLength(a){
    return Math.abs(a.da) * a.r ;
}
    //YURRE: AL final testeo aquí que los puntos no coinciden con pi o pf porque es donde el "this" está "más cerca"
export function arcSplitAtPoints( s, pointsOnSeg, eps = geometryPrecision){
        let result = [];
        let points = pointsOnSeg;
        if((points.length !== 0) && fuzzy_eq_point(s.pi, points[0], eps)) {
            if(points[0].ovp !== undefined) s.pi.ovp = points[0].ovp;
            points.shift(); //quito el primero y dejo el orginal
        }
        if((points.length !== 0) && fuzzy_eq_point(s.pf, points[points.length-1], eps)) {
            points.pop(); //quito el último y dejo el original
        }
        points = [s.pi, ...points, s.pf];
        const cc = s.way === 1? "antiClock" : "clock"
        for(let i=1; i < points.length; i++){
            let a = createArc(arc2PC2SVG({x:s.cx, y:s.cy}, s.r, points[i-1], points[i], cc));
            if(points[i-1].ovp !== undefined) {
                a.ovp = points[i-1].ovp;
                delete points[i].ovp;
            }
            result.push(a);
        }
        return result;
    }
export function arcClosestPoint(a, point, eps = geometryPrecision){
        //if(fuzzy_eq_point(this, point, eps))    //el this.x y this.y son el centro
        //    return {x:this.pi.x, y:this.pi.y};
        if (pointWithinArcSweep(a, point)){
            let v = {x:point.x - a.cx, y: point.y - a.cy};
            const m = a.r / Math.hypot(v.x, v.y) ; //escalado
            return {x:a.cx + m*v.x, y:a.cy + m*v.y}
        }
        //Si no está en el ángulo barrido, el punto más cercano es uno de los extremos.
        const dpi = sqDistancePointToPoint(a.pi.x, a.pi.y, point.x, point.y);
        const dpf = sqDistancePointToPoint(a.pf.x, a.pf.y, point.x, point.y);
        return( dpi < dpf? a.pi: a.pf);
        }    
export function arcPointInsideOffset(a, point, offset, eps){
        let absoff = Math.abs(offset)-eps;
        let absoff2 = absoff*absoff ; 
        let r2 = sqDistancePointToPoint(point.x, point.y, a.cx, a.cy);
        if( r2 > (a.r+absoff)*(a.r+absoff)) return false;
        if( r2 < (a.r-absoff)*(a.r-absoff)) return false;
        //Aquí está dentro del "tubo" +- offset de la circunferencia, si está fuera del span puede estar cerca de los bordes
        if (pointWithinArcSweep(a, point)) return true;
        //Quedan las esquinas redondeadas, de todas las maneras no es totalmente exacto....
        if(sqDistancePointToPoint(point.x, point.y, a.pi.x, a.pi.y) < absoff2) return true;
        if(sqDistancePointToPoint(point.x, point.y, a.pf.x, a.pf.y) < absoff2) return true;
        return false;
    }    