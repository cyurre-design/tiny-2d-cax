"use strict";
import { translatePoint, pointSymmetricSegment, rotateZ , scale0, distancePointToPoint, geometryPrecision, fuzzy_eq_point} from '../cy-geometry-library.js'


//Por motivos operativos se mantiene una formulación interna optimizada con el vector director y la distancia al origen.
//Es decir la recta en formato interno se mantiene con ux*x + uy*y + c = 0 (ax+by+c = 0) con ux*ux + uy*uy = 0
//La distancia punto (x,y) a recta (ax+by+c=0) se define como abs(ax+by+c)/(sqrt(a*a + b*b))
//La distancia al origen (0,0) es d = abs(c)

//No sobrecargo el constructor básico. En su lugar exporto la createDrawElement, una sola función
// con tipos y subtipos de parámetros.
// De esa manera se pueden separar los códigos para parsers o interactivo de forma más sencilla

export function createSegment(data) {
        const segment = {
            type : 'segment', x0 : data.x0, y0 : data.y0, x1 : data.x1, y1 : data.y1,
            get pi(){ return ({x:this.x0,y:this.y0})} , get pf(){ return ({x:this.x1,y:this.y1})} 
        }
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
export function segmentMidpoint(segment){
        return({x: 0.5*(segment.x0 + segment.x1), y: 0.5*(segment.y0 + segment.y1)})
    }
export function segmentTranslate(segment, dx, dy) {
        let [nx0, ny0] = translatePoint(segment.x0, segment.y0, dx, dy);
        let [nx1, ny1] = translatePoint(segment.x1, segment.y1, dx, dy);
        return createSegment({x0:nx0, y0:ny0, x1:nx1, y1:ny1});
    }
export function segmentSymmetryX(segment, y) {
        return createSegment({x0:segment.x0, y0: 2*y - segment.y0, x1:segment.x1, y1: 2*y - segment.y1});
    }
export function segmentSymmetryY(segment, x) {
        return createSegment({x0: 2*x - segment.x0, y0:segment.y0, x1: 2*x - segment.x1, y1:segment.y1});
    }
    //Simetría respecto a un segmento, me deben pasar una clase segmento
export function segmentSymmetryL(segment, s) {
        let [nx0, ny0] = pointSymmetricSegment(s, segment.x0, segment.y0);
        let [nx1, ny1] = pointSymmetricSegment(s, segment.x1, segment.y1);
        return createSegment({x0:nx0, y0:ny0, x1:nx1, y1:ny1});
    }
export function segmentRotate(s, x, y, alfa) {
    const [t0x, t0y] = rotateZ(s.x0 - x, s.y0 -y, alfa);
    const [t1x, t1y] = rotateZ(s.x1 - x, s.y1 -y, alfa);
    return createSegment({x0: t0x + x, y0: t0y + y, x1: t1x + x, y1 : t1y + y})
    }
export function segmentScale(s, x, y, scale) {
    const [t0x, t0y] = scale0(s.x0 - x, s.y0 -y, scale);
    const [t1x, t1y] = scale0(s.x1 - x, s.y1 -y, scale);
    return createSegment({x0: t0x + x, y0: t0y + y, x1: t1x + x, y1 : t1y + y})
    }

export function segmentReverse(s) {
    return createSegment({x0:s.x1, y0:s.y1, x1:s.x0, y1:s.y0})
    }
export function segmentLength(s){
    return s.d;
}
export function segmentSplitAtPoints(s, pointsOnSeg, eps = geometryPrecision){
        let result = [];
        let points = pointsOnSeg;
        if((points.length !== 0) && fuzzy_eq_point(s.pi, points[0], eps)) {
            if(points[0].ovp !== undefined) s.pi.ovp = points[0].ovp;
            points.shift(); //quito el primero y dejo el orginal
        }
        //Si solo había un punto y era pi me he cepillado el array
        if((points.length !== 0) && fuzzy_eq_point(s.pf, points[points.length-1], eps)) {
            points.pop(); //quito el último y dejo el original
        }
        points = [s.pi, ...points, s.pf];
        for(let i=1; i < points.length; i++){
            if(!fuzzy_eq_point(points[i-1], points[i]), eps){
                let s = createSegment({subType:'PP', x0:points[i-1].x, y0:points[i-1].y, x1:points[i].x, y1:points[i].y });
                if(points[i-1].ovp !== undefined) {
                    s.ovp = points[i-1].ovp;
                    delete points[i].ovp;
                }
                result.push(s);
            }
        }
        return result;
    }
    //cambio la estructura del original, miro primero si son los vértices
export function closestPoint (s, point, eps = geometryPrecision){
        if(fuzzy_eq_point(s.pi, point, eps)) return {x:s.pi.x, y:s.pi.y};
        if(fuzzy_eq_point(s.pf, point, eps)) return {x:s.pf.x, y:s.pf.y};      
        const w = {x:point.x - s.pi.x, y: point.y - s.pi.y}; //y el producto escalar sería la proyección
        const l = Math.hypot(w.x, w.y);
        if(l*l > s.l2) 
        return {x: s.pi.x + s.ux*l, y:s.pi.y + s.uy*l};
        }
export function segmentInsideOffset(point, offset, eps){
        let absoff = Math.abs(offset)-eps ; 
        if(distancePointToLine(point, s) > absoff) return false;
        //Aquí está dentro del "tubo" +- offset de la línea
        const m = segmentMidpoint(s); //O meterlo en la estructura
        if(distancePointToPoint(point.x, point.y, m.x, m.y) < 0.5*s.d) return true;
        //Quedan las esquinas redondeadas, de todas las maneras no es totalmente exacto....
        if(sqDistancePointToPoint(point.x, point.y, s.pi.x, s.pi.y) < absoff*absoff) return true;
        if(sqDistancePointToPoint(point.x, point.y, s.pf.x, s.pf.y) < absoff*absoff) return true;
        return false;
    }