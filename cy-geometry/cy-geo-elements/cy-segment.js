"use strict";
import { translatePoint, pointSymmetricSegment, rotateZ , scale0} from '../cy-geometry-library.js'


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
