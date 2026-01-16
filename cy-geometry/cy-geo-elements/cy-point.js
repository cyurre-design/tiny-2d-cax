"use strict";
//import {geometryPrecision, circleFrom3Points, arc3P2SVG, arc2PR2SVG, arcCPA, arcWay} from './cy-geometry-library.js'
import { translatePoint, pointSymmetricSegment } from '../cy-geometry-library.js'

//Datos: centro y punto. El centro tiene como alias a x0,y0, igualamos nomenclatura con arco

export function createPoint(data = {}) {
    return ( {x0 : data.x, y0 : data.y, type : 'point'})
}
export function pointClone(point){
    return ( {x0 : point.x, y0 : point.y, type : 'point'})
}
 //   _bbox(){ return({x0: this.x0, y0: this.y0, x1: this.x0, y1: this.y1})}

    //TODO rehacer con un new Circle(this)
export function pointTranslate(point, dx, dy) {
    return ( {x0 : point.x + dx, y0 : point.y + dy, type : 'point'})
    }
    //y0p = y - (y0 -y) = 2*y - y0
export function pointSymmetryX(point, y){
    return ( {x0 : point.x, y0 : 2*y - point.y, type : 'point'})
    }
export function pointSymmetryY(point, x){
        return ({ x0:2*x - point.x0, y:point.y})
    }
export function pointSymmetryL(point, s){
        const [x, y] = pointSymmetricSegment(s, point.x0, point.y0);
        return ( {x0 : x, y0 : y, type : 'point'})
    }
