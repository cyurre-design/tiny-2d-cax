"use strict";
import { fuzzy_eq, fuzzy_eq_zero, centerFrom2PR, circleFrom3Points, arc3P2SVG, arc2PR2SVG, arcCPA, arcWay, arcDxf } from "./cy-geometry-library.js";
import { arc2PL } from "./cy-geometry-library.js";

import { createSegment } from "./cy-geo-elements/cy-segment.js";
import { createCircle } from "./cy-geo-elements/cy-circle.js";
import { createArc } from "./cy-geo-elements/cy-arc.js";
import { createPolygon } from "./cy-geo-elements/cy-polygon.js";
import { createPath } from "./cy-geo-elements/cy-path.js";
import { createBezier } from "./cy-geo-elements/cy-bezier.js";
//import './cy-geo-elements/biarc.js'

//igual, pero el constructor garantiza x0 <x1 e y0 < y1
export function createBbox(data = {}) {
    //suponemos que los puntos vienen definidos
    return {
        x0: Math.min(data.x0, data.x1),
        y0: Math.min(data.y0, data.y1),
        x1: Math.max(data.x0, data.x1),
        y1: Math.max(data.y0, data.y1),
        type: "bbox",
    };
}
// //Atton, esta la hago por referencia
// export function bboxTranslate(b, dx, dy){
//         [b.x0, b.y0] = translatePoint(this.x0, this.y0, dx, dy);
//         [b.x1, b.y1] = translatePoint(this.x1, this.y1, dx, dy);
//     }

export function getRelevantPoints(b) {
    switch (b.type) {
        case "segment":
            return [
                { x0: b.x0, y0: b.y0 },
                { x0: b.x1, y0: b.y1 },
            ];
        case "circle":
            return [{ x0: b.cx, y0: b.cy }];
        case "arc":
            return [
                { x0: b.cx, y0: b.cy },
                { x0: b.x1, y0: b.y1 },
                { x0: b.x2, y0: b.y2 },
            ];
        case "polygon":
            return [{ x0: b.cx, y0: b.cy }].concat(b.segments.map((p) => ({ x0: p.x0, y0: p.y0 })));
        case "path":
            return b.elements.map((p) => getRelevantPoints(p)).flat();
        case "bezier":
            return [
                { x0: b.x0, y0: b.y0 },
                { x0: b.x1, y0: b.y1 },
            ];
        default:
            return [];
    }
}
export function polygonToPath(polygon) {
    const elements = [];
    const l = polygon.segments.length - 1;
    for (let i = 0; i < l; i++) {
        elements.push(
            createSegment({
                subType: "PP",
                x0: polygon.segments[i].x0,
                y0: polygon.segments[i].y0,
                x1: polygon.segments[i + 1].x0,
                y1: polygon.segments[i + 1].y0,
            }),
        );
    }
    elements.push(
        createSegment({
            subType: "PP",
            x0: polygon.segments[l].x0,
            y0: polygon.segments[l].y0,
            x1: polygon.segments[0].x0,
            y1: polygon.segments[0].y0,
        }),
    );
    return createDrawElement("path", { elements: elements });
}
export function createDrawElement(type, data) {
    let element; //para tratarlo después del switch
    switch (type) {
        case "segment":
            {
                if (data.x0 === undefined && data.y0 === undefined) return undefined;
                if (data.subType === "PP") {
                    if (data.x1 === undefined || data.y1 === undefined) return undefined;
                } else {
                    //estas van con ángulo
                    if (data.a === undefined) return undefined;
                    let alfa = data.a % 360; //se mantiene el signo
                    alfa = (alfa * Math.PI) / 180;
                    switch (data.subType) {
                        case "PDA":
                            if (!data.d) return undefined;
                            data.x1 = data.x0 + Math.cos(alfa) * data.d;
                            data.y1 = data.y0 + Math.sin(alfa) * data.d;
                            break;
                        case "PXA":
                            if (!data.x1) return undefined;
                            if (fuzzy_eq(Math.abs(alfa), 0.5 * Math.PI)) return undefined;
                            data.y1 = data.y0 + (data.x1 - data.x0) * Math.tan(alfa); //tangente
                            break;
                        case "PYA":
                            if (!data.y1) return undefined;
                            if (fuzzy_eq_zero(alfa)) return undefined;
                            data.x1 = data.x0 + (data.y1 - data.y0) / Math.tan(alfa); //cotangente
                            break;
                        default:
                            return undefined;
                    }
                }
                element = createSegment(Object.assign(data)); //el estandarizado es con punto final
            }
            break;
        //añado el tratamiento de datos no completos o inconsistentes para devolver un segmento en ese caso
        //con lo que queda la operación de dibujar homogénea. Supongo un mínimo de dos puntos
        //lo que me obliga a generar uno cuando me pasan centro y radio
        case "circle":
            switch (data.subType) {
                case "CR":
                    {
                        if (data.cx !== undefined)
                            //Podríamos añadir el x1 porque en este caso viene dado...
                            element = createCircle({ cx: data.cx, cy: data.cy, x1: data.cx + data.r, y1: data.cy });
                        else if (data.x0 !== undefined) element = createCircle({ cx: data.x0, cy: data.y0, x1: data.x0 + data.r, y1: data.y0 });
                    }
                    break;
                case "CP":
                    {
                        if (data.cx !== undefined) element = createCircle({ cx: data.cx, cy: data.cy, x1: data.x1, y1: data.y1 });
                        else if (data.x0 !== undefined) element = createCircle({ cx: data.x0, cy: data.y0, x1: data.x1, y1: data.y1 });
                    }
                    break;
                case "3P":
                    {
                        //TODO EPSILON
                        let center;
                        if (data.x2 !== undefined)
                            center = circleFrom3Points({ x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, { x: data.x2, y: data.y2 });
                        else center = circleFrom3Points({ x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, { x: data.x1, y: data.y1 });
                        if (!center) element = createSegment({ x0: data.x0, y0: data.y0, x1: data.x1, y1: data.y1 });
                        else {
                            element = createCircle(center);
                        }
                    }
                    break;
                case "2PR":
                    {
                        //TODO EPSILON
                        const sols = centerFrom2PR(data);
                        if (!sols) element = createSegment({ x0: data.x0, y0: data.y0, x1: data.x1, y1: data.y1 });
                        const sol = data.way === "clock" ? sols[0] : sols[1];
                        const newdata = { cx: sol.x0, cy: sol.y0, x1: data.x1, y1: data.y1, r: data.r };
                        element = createCircle(newdata);
                    }
                    break;
            }

            break;
        case "polygon":
            {
                //subtipos H y R (lado o vértice)
                if (data.cx === undefined) {
                    data.cx = data.x0;
                    data.cy = data.y0;
                }
                if (data.x1 === undefined || data.y1 === undefined || data.edges < 3 || data.edges > 12) {
                    return undefined;
                }
                let delta = (2 * Math.PI) / data.edges;
                let lx = data.x1 - data.x0;
                let ly = data.y1 - data.y0;
                let alfai = Math.atan2(ly, lx);
                let r = Math.hypot(lx, ly);
                if (data.subType === "H") {
                    //nos dan el inscrito
                    r = r / Math.cos(0.5 * delta);
                    alfai += 0.5 * delta;
                    data.x1 = data.cx + r * Math.cos(alfai);
                    data.y1 = data.cy + r * Math.sin(alfai);
                }
                data.r = r;
                data.delta = delta;
                data.alfai = alfai;
                element = createPolygon(Object.assign(data));
            }
            break;
        case "bezier":
            element = createBezier(Object.assign(data));
            break;
        case "path":
            data.elements = data.elements || [];
            data.elements = data.elements.filter((el) => el !== undefined); //limpieza, mejor no meterlos....
            //if(data.elements.length === 0) data.elements.push(new Segment({x0:0, y0:0, x1:1, y1:1}));
            element = createPath(Object.assign(data));
            break;
        case "arc":
            //La clase ARC toma 3 puntos x0,x1,x2 === cx, pi.x, pf.x
            switch (data.subType) {
                case "2PR":
                    {
                        const arc = arc2PR2SVG({ x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, Math.abs(data.r), data.way);
                        if (!arc) element = createSegment({ x0: data.x0, y0: data.y0, x1: data.x1, y1: data.y1 });
                        else element = createArc(arc);
                    }
                    break;
                case "3P":
                    {
                        //llegan p0, pm, p1, Atton
                        let arc;
                        if (data.x1 !== undefined)
                            //al loro porque el if a pelo salta con el 0!!!
                            arc = arc3P2SVG({ x: data.x0, y: data.y0 }, { x: data.xm, y: data.ym }, { x: data.x1, y: data.y1 });
                        else arc = arc3P2SVG({ x: data.x0, y: data.y0 }, { x: data.xm, y: data.ym }, { x: data.xm, y: data.ym });
                        if (!arc) element = createSegment({ x0: data.x0, y0: data.y0, x1: data.xm, y1: data.ym });
                        else {
                            element = createArc(arc);
                        }
                    }
                    break;
                case "CPA":
                    {
                        //llega a, centro (x0,y0) y punto inicial(x1,y1)
                        const arc = arcCPA({ x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, data.a);
                        element = createArc(arc);
                    }
                    break;
                //subtype:'way', cx: prf.x0, cy: prf.y0, x0: prf.xi, y0: prf.yi, x1: prf.xf, y1: prf.yf, way: arcWay
                case "way":
                    {
                        //https://www.w3.org/TR/SVG/implnote.html
                        const newdata = arcWay(data);
                        element = createArc(newdata);
                    }
                    break;
                case "2PL":
                    {
                        //llegan p0, p1 y longitud de arco
                        const arc = arc2PL({ x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, data.l, data.way);
                        if (!arc) element = createSegment({ x0: data.x0, y0: data.y0, x1: data.x1, y1: data.y1 });
                        else element = createArc(arc);
                    }
                    break;
                case "SVG":
                    {
                        //aquí solo vienen los de svg con inicial y final, r y flags
                        //https://www.w3.org/TR/SVG/implnote.html
                        element = createArc(data);
                        // let xm = 0.5 * (data.x0 - data.x1);
                        // let ym = 0.5 * (data.y0 - data.y1);
                        // let k = Math.sqrt((data.r*data.r - xm*xm - ym*ym) / (ym*ym + xm*xm));
                        // let cx = k*ym, cy = -k*xm;
                        // if(data.fA === data.fS) {cx = -cx; cy = -cy;}
                        // cx = cx + 2*(data.x0 + data.x1) ; cy = cy + 2*(data.y0 + data.y1);
                        // let ai = Math.atan2 (data.y0 - cy, data.x0 - cx);
                        // let da = Math.acos(((data.x0 - cx)*(data.x1 - cx) + (data.y0 - cy)*(data.y1 - cy)) / (data.r*data.r));
                        // // if(((data.x0 - cx)*(data.y1 - cy) - (data.x1 - cx)*(data.y0 - cy)) < 0)
                        // //     da = - da;
                        // if((data.fS === 0) && (da > 0)) da = da - 2*Math.PI;
                        // if((data.fS !== 0) && (da < 0)) da = da + 2*Math.PI;
                        // element = new Arc(Object.assign(data, {cx: cx, cy:cy, ai:ai, da:da}))
                    }
                    break;
                case "DXF":
                    {
                        const newdata = arcDxf(data);
                        element = createArc(newdata);
                    }
                    break;
                default:
                    element = Object.assign({}, { error: true });
            }
            break;
        case "bbox":
            element = createBbox(data);
            break;
        default:
            return undefined;
        //break;
    }
    return element;
}

// export function test_arcsweep(){
//     let randomAngles = Array.from({length: 30}, () => Math.floor((Math.random() - 0.5) * 360));
//     const angles = randomAngles.slice(0,10);
//     const ways = Array.from({length: 10}, () => (Math.random() > 0.5 ? 'clock' : 'antiClock'));
//     let sweeps = [];
//     for(let i=0; i < 10; i++) sweeps.push([randomAngles[i+10] , randomAngles[i+20] , ways[i]]) ;

//     const arcs = sweeps.map(range => {
//         let ai = range[0]*Math.PI/180;
//         let af = range[1]*Math.PI/180;
//         let way = range[2];
//         let arc = createDrawElement('arc', {'subType':'way', r:1, cx:0, cy: 0, x0:Math.cos(ai), y0:Math.sin(ai), x1:Math.cos(af), y1:Math.sin(af), way: way})
//         console.log(range[0], range[1], way, arc.fS, arc.fA)
//         return arc;
//         });

//     //sweeps.forEach(s => console.log(s[0], s[1]));
//     arcs.forEach((arc, ix) => {
//         angles.forEach(a => {
//             const ra = a*Math.PI/180;
//             const res = arc.pointWithinArcSweep({x:Math.cos(ra), y:Math.sin(ra)});
//             console.log( sweeps[ix],a, res);
//         })
//     })
// }
