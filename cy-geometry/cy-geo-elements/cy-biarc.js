"use strict";

import { distancePointToPoint, fuzzy_eq_zero } from "../cy-geometry-library.js";

// -------- utilidades vectoriales ----------
const dot = (a, b) => a.x * b.x + a.y * b.y;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s });
const len = (v) => Math.hypot(v.x, v.y);
const left = (v) => ({ x: -v.y, y: v.x });
const inv = (v) => ({ x: -v.x, y: -v.y });
const mid = (a, b) => ({ x: 0.5 * (a.x + b.x), y: 0.5 * (a.y + b.y) });
const norm = (v) => {
    const l = len(v);
    return { x: v.x / l, y: v.y / l };
};

//se supone que le pasamos los do arcos tangentes, se puede pasar la rutina de cálculos
export function createBiarc(a, b) {
    // const lengtha = Math.abs(a.r * a.da); //revisar, a3 debe ser mayor que a1
    // const lengthb = Math.abs(b.r * b.da); //revisar, a3 debe ser mayor que a1
    // const s = lengtha / (lengtha + lengthb);
    return { a: Object.assign({}, a), b: Object.assign({}, b) };
}
//Suponemos las tangentes normalizadas !?
function cutOfParametricLines(p0, p1, t0, t1) {
    //busco el punto de corte de pi,ti con pf,tf
    //con las ecuaciones originales en paramétricas el p.corte es xc = x0 + l0*t0.x = x1 + l1*t1.x, yc = y0 + l0*t0.y = y1 + l1*t1.y
    // despejando me sale
    const l0 = (t1.y * (p0.x - p1.x) - t1.x * (p0.y - p1.y)) / (t0.y * t1.x - t1.y * t0.x);
    const pc = { x: p0.x + l0 * t0.x, y: p0.y + l0 * t0.y };
    return pc;
}
export function calculateIncenterFromHermite(pi, pf, ti, tf) {
    const pc = cutOfParametricLines(pi, pf, ti, tf);
    const a = distancePointToPoint(pi.x, pi.y, pc.x, pc.y);
    const b = distancePointToPoint(pc.x, pc.y, pf.x, pf.y);
    const c = distancePointToPoint(pf.x, pf.y, pi.x, pi.y);
    const s = a + b + c; //perímetro
    return { x: (a * pf.x + b * pi.x + c * pc.x) / s, y: (a * pf.y + b * pi.y + c * pc.y) / s };
}

//condiciones de hermite + incenter (transition point)
//https://dlacko.org/blog/2016/10/19/approximating-bezier-curves-by-biarcs/
// Aunque ya está funcionando dentro de bezier, trato de generalizar para que me sirva en elipse y lo que salga
/**
 * Me paso las condiciones de hermite con las tangentes ya normalizadas
 * el normal en pi sería n1 = (-t1.y, t1.x) = left(t1)
 * El punto medio de pi con g sería mpig = mid(pi,g)
 * El vector que une i con g sería pig = sub(g,pi)
 * El vector normal al mismo sería (-pig.y, pig.x) , norm(left(pig)) porque normalizamos los vectores unitarios
 * en el corte de las normales estará el centro de cada circulo
 * @param {*} bz
 * @param {*} g
 * @returns
 */
export function calculateBiarc(pi, pf, ti, tf, way) {
    const g = calculateIncenterFromHermite(pi, pf, ti, tf); //Es solo una posibilidad de elección, pero parece razonable..
    let ni = left(ti); //normal en pi , normal por tanto al primer círculo
    let pg = sub(g, pi); //pi -> g
    let nm = norm(left(pg)); // perpendicular al segmento de pi a g
    //el centro en el corte de ambas normales
    const c0 = cutOfParametricLines(pi, mid(pi, g), ni, nm);
    const r0 = distancePointToPoint(c0.x, c0.y, pi.x, pi.y);

    //El segundo arco es casi igual
    const nf = left(tf); //normal en pf, por tanto perpendicular al segundo arco, pero para el otro lado
    pg = sub(g, pf); //g -> pf
    nm = norm(left(pg)); // perpendicular al segmento de g a pf
    const c1 = cutOfParametricLines(mid(g, pf), pf, nm, nf);
    const r1 = distancePointToPoint(c1.x, c1.y, pf.x, pf.y);
    return [
        {
            p0: pi,
            p1: g,
            r: r0,
            c: c0,
            way: way,
        },
        {
            p0: g,
            p1: pf,
            r: r1,
            c: c1,
            way: way,
        },
    ];
}

// function arcInterpolate(arc, t) {
//     let alfa = arc.a1 + t * arc.delta;
//     return { x: arc.x + arc.r * Math.cos(alfa), y: arc.y + arc.r * Math.cos(alfa) };
// }
// export function biarcInterpolate(bz, t) {
//     return t <= bz.s ? arcInterpolate(bz.a, t / bz.s) : arcInterpolate(bz.b, (t - bz.s) / (1 - bz.s));
// }
