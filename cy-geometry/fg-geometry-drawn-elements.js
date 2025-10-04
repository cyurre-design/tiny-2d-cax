"use strict";

import {centerOfCircleTangentToLineAndPoint, circleTangentToPointAndPoint, centerOfCircleTangentToCircleAndPoint, centerCalculate,
    Point, Line, Circle, Arc, Segment, Rect, distancePointToPoint, geometryPrecision} from '../../geometry/fg-geometry-library.js';
import { Path, Polygon, calculateRound, calculateChamfer, calculateTangentialEntry, calculateTangentialExit, CircleList } from '../../geometry/fg-geometry-grouped-elements.js';
import { Round, Chamfer, TangentEntry, TangentExit } from '../../geometry/fg-geometry-iso-elements.js';
export * from '../../geometry/fg-geometry-grouped-elements.js';

//No tengo claro si desde un punto de vista de eficiencia y claridad es mejor herencia o mixin.
//En vez de heredar la alternativa sería pasarle una geometría a la clase base en el constructor
//o posteriormente. 
//De esa manera lo que ahora es geometría sería librería pura, más en línea con un módulo que se importaría.
//Estos elementos que siguen SI son una clase, se instancian, etc....
export function createDrawElement(type, data, misc, aux ) {
    let element; //para tratarlo después del switch
    function _error(error) {
        let e = new Point(0,0);
        e.type = 'error';
        e.misc = error;
        return(e);
    }
    switch (type) {
        case 'point':
            if (data.x !== undefined && data.y !== undefined)
                element = new Point(data.x, data.y);
            break;
        case 'line':
            if (data.x !== undefined && data.y !== undefined && data.alfa !== undefined) {
                element = new Line(data.x, data.y, data.alfa);
            } else if (data.x1 !== undefined && data.y1 !== undefined && data.x2 !== undefined && data.y2 !== undefined) {
                element = new Line(data.x1, data.y1, data.x2, data.y2);
            }
            break;
        case 'segment':
            if (data.x1 !== undefined && data.y1 !== undefined && data.x2 !== undefined && data.y2 !== undefined)
                element = new Segment(data.x1, data.y1, data.x2, data.y2);
            break;
        case 'rect': // PARA REVISAR. SOLO SE UTILIZA EN SELECCION DE GRUPO CON EL RATÓN
            if (data.x1 !== undefined && data.y1 !== undefined && data.x2 !== undefined && data.y2 !== undefined)
                element = new Rect(data.x1, data.y1, data.x2, data.y2);
            break;
        case 'circle': //estos no se están usando, son secuencias de arcos, pero por si acaso
            if (data.x !== undefined && data.y !== undefined && data.r !== undefined)
                element = new Circle(data.x, data.y, data.r);
            break;
        case 'arc': //comprobar que el radio es coherente con pi y pf
            if (data.x !== undefined && data.y !== undefined && data.r !== undefined && data.pi !== undefined && data.pf !== undefined){
                const ri = distancePointToPoint(data.x, data.y, data.pi.x, data.pi.y); //ri
                const rf = distancePointToPoint(data.x, data.y, data.pf.x, data.pf.y); //rf
                if( (Math.abs(data.r - ri) <= geometryPrecision ) && (Math.abs(data.r - rf) <= geometryPrecision )) //OK
                {
                    element = new Arc(data.x, data.y, data.r, data.pi, data.pf, data.way);
                }
                else if(Math.abs(ri - rf) <= aux.cirinerr ){  //si no es coherente pero está dentro de lo permitido, modifico el centro
                    const centers = centerCalculate(data.pi, data.pf, (ri + rf)/2 ); //elijo la más cercana al centro original
                    let sol = distancePointToPoint(centers[0].x, centers[0].y, data.x, data.y) < distancePointToPoint(centers[1].x, centers[1].y, data.x, data.y)?centers[0]:centers[1];
                    element = new Arc(sol.x, sol.y, (ri + rf)/2, data.pi, data.pf, data.way);

                }
            } else if (data.pi !== undefined && data.pm !== undefined && data.pf !== undefined) {
                element = new Arc(data.pi, data.pm, data.pf);
            }
            break;
        case 'arc3Points':
            if (data.pi === undefined || data.pm === undefined || data.pf === undefined) break;
            if (Math.abs(distancePointToPoint(data.pi.x, data.pi.y, data.pm.x, data.pm.y)) <= geometryPrecision) break;
            if (Math.abs(distancePointToPoint(data.pi.x, data.pi.y, data.pf.x, data.pf.y)) <= geometryPrecision) break;
            if (Math.abs(distancePointToPoint(data.pm.x, data.pm.y, data.pf.x, data.pf.y)) <= geometryPrecision) break;
            element = new Arc(data.pi, data.pm, data.pf);
            break;
        case 'arc3Angles':
            if (data.x !== undefined && data.y !== undefined && data.r !== undefined && data.a1 !== undefined && data.a2 !== undefined && data.a3 !== undefined) {
                element = new Arc(data.x, data.y, data.r, data.a1, data.a2, data.a3);
            }
            break;
        case 'arc2PointsAndRadius':
            if (data.xi !== undefined && data.xf !== undefined && data.r !== undefined && data.yi !== undefined && data.yf !== undefined) {
                let pi = new Point(data.xi, data.yi);
                let pf = new Point(data.xf, data.yf);
                let r = Math.abs(data.r);
                let way = data.way;

                let sols = circleTangentToPointAndPoint(pi, pf, r); //devuelve dos círculos en centros x,y
                if (sols.length > 0) { //radio correcto
                    let p;
                    if (sols.length === 1) { //una sola solución, 180 grados , el centro debería estar en el centro
                        p = {x: sols[0].x, y: sols[0].y};
                    } else {
                        p = sols[0].p0;
                        //Hallo el p. vectorial de (pf-pi)^(p0-pi) (seno), nos daría si ángulo grande o no
                        let discPos = ((pf.x - pi.x) * (p.y - pi.y) - (pf.y - pi.y) * (p.x - pi.x)) >= 0; //true o false
                        let largeArc = data.r < 0;
                        //Si true, el centro queda a la izquierda, el ángulo pequeño es clock y el grande anticlock
                        if ((discPos &&  way === 'clock') || (!discPos && way !== 'clock')) { // if (discPos ? way === 'clock' : way !== 'clock') {
                            p = largeArc ? p : sols[1].p0;
                        } else {
                            p = largeArc ? sols[1].p0 : p;
                        }
                    }
                    element = new Arc(p.x, p.y, r, pi, pf, way);
                }
            }
            break;
        case 'arcTangentToArc': //p0(circulo inicial al que es tangente, pi, pf)
            if (data.pi !== undefined && data.pf !== undefined && data.p0 !== undefined) {
                let c0 = centerOfCircleTangentToCircleAndPoint(data.p0, data.pi, data.pf);
                let r = Math.sqrt((data.pi.x - c0.x) * (data.pi.x - c0.x) + (data.pi.y - c0.y) * (data.pi.y - c0.y));

                let way = (data.pathway === 0) ? 'clock' : 'antiClock';
                if (((data.pi.x >= data.p0.x) !== (data.pi.x >= c0.x)) || ((data.pi.y >= data.p0.y) !== (data.pi.y >= c0.y))) {
                    way = (way === 'antiClock') ? 'clock' : 'antiClock';
                }
                element = new Arc(c0.x, c0.y, r, data.pi, data.pf, way);
            }
            break;
        case 'arcTangentToLine': //p0(punto inicial del segmento al que es tangente, pi, pf)
            if (data.pi !== undefined && data.pf !== undefined && data.p0 !== undefined) {
                let c0 = centerOfCircleTangentToLineAndPoint(data.p0, data.pi, data.pf);
                if (c0.length === 0) break; //Aquí pierdo un poco de finura en el error ('No existe solución de tangente a línea por punto'); //No sé si puede pasar en realidad

                c0 = c0[0]; //solo hay un corte entre dos rectas
                let r = Math.sqrt((data.pi.x - c0.x) * (data.pi.x - c0.x) + (data.pi.y - c0.y) * (data.pi.y - c0.y));
                //sentido por el producto vetorial
                let v = (data.pi.x - c0.x) * (data.pi.y - data.p0.y) - (data.pi.y-c0.y) * (data.pi.x-data.p0.x);
                let way = (v >= 0) ? 'antiClock' : 'clock';
                element = new Arc(c0.x, c0.y, r, data.pi, data.pf, way);
            }
            break;
        case 'polygon': //centro, radio, n. de aristas
            if (data.x !== undefined && data.y !== undefined && data.r !== undefined) {
                if (data.nedges >= 3 && data.nedges <= 8) { //límite artificial
                    element = new Polygon(data.x, data.y, data.r, data.nedges);
                }
            }
            break;
        case 'chamfer':
            if (data.r && data.last && data.next) {
                if((element = calculateChamfer(data.r, data.last, data.next)) === null)
                    element = undefined; //para homogeneizar errores
            } else {
                element = new Chamfer(data.x1, data.y1, data.x2, data.y2, data.r);
            }
            break;
        case 'round':
            if (data.r && data.last && data.next) {
                element = calculateRound(data.r, data.last, data.next);
            } else if (data.pi !== undefined && data.pm !== undefined && data.pf !== undefined) {
                element = new Round(data.pi, data.pm, data.pf);
            }
            break;
        case 'tangentialEntry':
            if (data.r && data.last && data.next) {
                element = calculateTangentialEntry(data.r, data.last, data.next);
            } else if (data.r) {
                element = new TangentEntry(data.xi, data.yi, data.xf, data.yf, data.xt, data.yt, data.x, data.y, data.r, data.way);
            }
            break;
        case 'tangentialExit':
            if (data.r && data.last && data.next) {
                element = calculateTangentialExit(data.r, data.last, data.next);
            } else if (data.r) {
                element = new TangentExit(data.xi, data.yi, data.xf, data.yf, data.xt, data.yt, data.x, data.y, data.r, data.way);
            }
            break;
        case 'path':
            if (data.elements !== undefined)
                element = new Path(data.elements);
            break;
        case 'circleList':
            if (data.elements !== undefined)
                element = new CircleList(data.elements);
            break;
        default: //no sabemos lo que es
            
    }
    //gestión de errores: no han creado elemento es nulo o undefined según el caso, creamos un elemento 
    //error para devolver aunque luego no se añade al path
    if(element === undefined || element === null) element = _error('error creating element of type '+type);
    else element.misc = misc;
    
    return element;
}