"use strict";
import { translatePoint, rotateZ, scale0, pointSymmetricSegment } from "../cy-geometry-library.js";

//args: centro(x0,y0), radio, edges, delta, alfa inicial

export function createPolygon(data = {}) {
    const p = {
        type: "polygon",
        edges: data.edges,
        cx: data.cx,
        cy: data.cy,
        x0: data.cx,
        y0: data.cy,
        r: data.r,
        delta: data.delta, //2 * Math.PI / edges;
        alfai: data.alfai, //alfa * Math.PI /180;
    };
    p.segments = _calculateSegments(p);
    p.bbox = _bbox(p);
    return p;
}
// get p0() {  return {x:this.x0, y: this.y0};    }
// get c() {  return {x:this.x0, y: this.y0};    }
//NO genero todos los segmentos, porque de momento no hacen falta como clases independientes
function _calculateSegments(p) {
    const segments = [];
    for (let i = 0; i < p.edges; i++) {
        segments.push({ x0: p.cx + p.r * Math.cos(p.alfai + i * p.delta), y0: p.cy + p.r * Math.sin(p.alfai + i * p.delta) });
    }
    return segments;
}
//esta no es exacta....TODO
function _bbox(p) {
    return { x0: p.cx - p.r, y0: p.cy - p.r, x1: p.cx + p.r, y1: p.cy + p.r };
}

export function polygonTranslate(p, dx, dy) {
    const [cx, cy] = translatePoint(p.cx, p.cy, dx, dy);
    return createPolygon({ cx: cx, cy: cy, r: p.r, edges: p.edges, delta: p.delta, alfai: p.alfai });
}
export function polygonRotate(p, x, y, alfa) {
    const [tcx, tcy] = rotateZ(p.cx - x, p.cy - y, alfa);
    return createPolygon({ cx: tcx + x, cy: tcy + y, r: p.r, edges: p.edges, delta: p.delta, alfai: p.alfai + alfa });
}
export function polygonScale(p, x, y, scale) {
    const [scx, scy] = scale0(p.cx - x, p.cy - y, scale);
    return createPolygon({ cx: scx + x, cy: scy + y, r: p.r * scale, edges: p.edges, delta: p.delta, alfai: p.alfai });
}
export function polygonSymmetryX(p, y) {
    return createPolygon({ cx: p.cx, cy: 2 * y - p.cy, r: p.r, edges: p.edges, delta: -p.delta, alfai: -p.alfai });
}
export function polygonSymmetryY(p, x) {
    return createPolygon({ cx: 2 * x - p.cx, cy: p.cy, r: p.r, edges: p.edges, delta: -p.delta, alfai: Math.PI - p.alfai });
}
export function polygonSymmetryL(p, s) {
    const [x, y] = pointSymmetricSegment(s, p.segments[0].x0, p.segments[0].y0);
    const [cx, cy] = pointSymmetricSegment(s, p.cx, p.cy);
    const alfai = Math.atan2(y - cy, x - cx);
    return createPolygon({ cx: cx, cy: cy, r: p.r, edges: p.edges, delta: -p.delta, alfai: alfai });
}
export function polygonLength(p) {
    return p.edges * (2 * p.r * Math.sin(Math.PI / p.edges));
}
