"use strict";
import { fuzzy_eq, fuzzy_eq_zero, geometryPrecision } from "../cy-geometry-library.js";
import { createSegment } from "./cy-segment.js";
import { createArc } from "./cy-arc.js";
import { _solveq, pointSymmetricSegment, arc2PC2SVG } from "../cy-geometry-library.js";
import { calculateBiarc, calculateIncenterFromHermite } from "./cy-biarc.js";
import { v2d, dot, dpp, cross, sub, add, mul, len, left, inv, mid, norm, rotL } from "../cy-v2d.js";

// function bezierInterpolateq(tp){
//         let cf = coefs[tp];
//         return new Point(
//             cf[0]*this.x + cf[1]*this.cp1x + cf[2]*this.cp2x + cf[3]*this.pf.x,
//             cf[0]*this.y + cf[1]*this.cp1y + cf[2]*this.cp2y + cf[3]*this.pf.y,
//         )
//     }
//Debemos garantizar la continuidad por construcción y todo será más sencillo

//elevación de grado, dada una c. de bezier de grado n con n+1 puntos  de control, se obtiene la misma, en grado n+1 por
// Q(i) = (i / (n+1))P(i-1) + (1 - (i / (n+1)))P(i) para 1<= i <= n
//Como la curva es de n=2 necesitamos dos nuevos puntos de control cp1 y cp2
// cp1 = Q1 = (1/3)*P0 + (1-1/3)*P1 = 1/3(P0 + 2P1)
// cp2 = Q2 = (1/3)*P1 + (1-1/3)*P2 = 1/3(P1 + 2P2)
/**
 * @todo chequear con más detalle?
 * @param {Object} data , debería venir x0,y0, cp1, cp2, x1,y1. Si no viene cp2 es cuadrática y la convertimos en cúbica
 * @returns
 */
export function createBezier(data = {}) {
    //copio valores, NO referencias, por si acaso
    const bz = {
        type: "bezier",
        x0: data.x0,
        y0: data.y0,
        x1: data.x1,
        y1: data.y1,
        get pi() {
            return { x: this.x0, y: this.y0 };
        },
        get pf() {
            return { x: this.x1, y: this.y1 };
        },
    };
    if (data.subType === "Q") {
        //elevo grado, paso de cuadrática a cúbica, cp1 = 1/3pi +2/3pm, cp2 = 2/3pm+1/3pf
        bz.cp1 = v2d((data.x0 + 2 * data.cp1x) / 3, (data.y0 + 2 * data.cp1y) / 3);
        bz.cp2 = v2d((2 * data.cp1x + data.x1) / 3, (2 * data.cp1y + data.y1) / 3);
    } else {
        bz.cp1 = v2d(data.cp1x, data.cp1y);
        bz.cp2 = v2d(data.cp2x, data.cp2y);
    }
    calculateConvexHull(bz);
    bz.ti = norm(sub(bz.cp1, bz.pi)); //unitario tangente en pi
    bz.tf = norm(sub(bz.pf, bz.cp2)); //unitario tangente en pf
    bz.way = isClockWise(bz);
    //un apaño porque ye difícil, mejoraría separando si hay puntos de inflexión...
    bz.bbox = {
        x0: Math.min(bz.x0, bz.cp1.x, bz.cp2.x, bz.x1),
        x1: Math.max(bz.x0, bz.cp1.x, bz.cp2.x, bz.x1),
        y0: Math.min(bz.y0, bz.cp1.y, bz.cp2.y, bz.y1),
        y1: Math.max(bz.y0, bz.cp1.y, bz.cp2.y, bz.y1),
    };
    return bz;
}
//
function _clone(bz) {
    return createBezier({ x0: bz.x0, y0: bz.y0, x1: bz.x1, y1: bz.y1, cp1x: bz.cp1.x, cp1y: bz.cp1.y, cp2x: bz.cp2.x, cp2y: bz.cp2.y });
}
//interpola al punto t
//la fórmula es (1-t)^3*pi + (1-t)^2*t*cp1 + (1-t)*t^2*cp2 + t^3*pf
function bezierInterpolate(bz, t) {
    const it = 1 - t;
    const t2 = t * t;
    const it2 = it * it;
    const c3 = t2 * t; //t^3
    const c0 = it * it2; //it^3
    const c1 = 3 * it2 * t;
    const c2 = 3 * it * t2;

    return add(add(mul(bz.pi, c0), mul(bz.cp1, c1)), add(mul(bz.cp2, c2), mul(bz.pf, c3)));
}
//esta se podría hacer a la vez que la interpolación...@todo
//Y usar el convexhull !!!
function bezierDerivative(bz, t) {
    const it2 = 3 * (1 - t) * (1 - t);
    const t2 = 3 * t * t;
    const tit = 6 * t * (1 - t);
    let tang = mul(sub(bz.cp1, bz.pi), it2);
    tang = add(tang, mul(sub(bz.cp2, bz.cp1), tit));
    tang = add(tang, mul(sub(bz.pf, bz.cp2), t2));
    return norm(tang);
    //return add(add(mul(sub(bz.cp1, bz.pi), it2), mul(sub(bz.cp2, bz.cp1), tit)), mul(sub(bz.pf, bz.cp2), t2));
}
//calcula el incentro del triángulo de un bezier (restringido en ángulo)
//he puesto el cálculo en biarc, se usa también en la elipse
// function calculateIncenter(bz) {
//     return calculateIncenterFromHermite(bz.pi, bz.pf, bz.ti, bz.tf);
// }

function calculateConvexHull(bz) {
    bz.A0 = sub(bz.cp1, bz.pi); //{ x: bz.cp1.x - bz.x0, y: bz.cp1y - bz.y0 };
    bz.A1 = sub(bz.cp2, bz.cp1); //{ x: bz.cp2x - bz.cp1.x, y: bz.cp2y - bz.cp1y };
    bz.A2 = sub(bz.pf, bz.cp2); //{ x: bz.x1 - bz.cp2x, y: bz.y1 - bz.cp2y };
    bz.D0 = sub(bz.A1, bz.A0); //{ x: bz.A1.x - bz.A0.x, y: bz.A1.y - bz.A0.y };
    bz.D1 = sub(bz.A2, bz.A1); //{ x: bz.A2.x - bz.A1.x, y: bz.A2.y - bz.A1.y };
    bz.E0 = sub(bz.D1, bz.D0); //{ x: bz.D1.x - bz.D0.x, y: bz.D1.y - bz.D0.y };
}
//Se obtiene de hacer que la derivada primera vectorial derivada segunda se anulen
//Para ello se pone la ecuación en forma polinomios en t (1,t,t2,t3), se deriva y se desarrolla
//el bezier en esa forma es va*t^3 + vb*t^2 + vc*t + pi = 0
//donde va = P3 - 3P2 + 3P1 - P0, vb = 3P2- 6P1 + 3P0,  vc = 3(P1 - P0)  (P0=pi, p1=cp1, p2=cp2, p3 = pf)
// operando se obtiene una ecuación de segundo grado donde a = va ^ vb, b = va ^ vc, c = vb ^ vc
function calculateInflexionPoints(bz) {
    const va = add(sub(bz.pf, mul(bz.cp2, 3)), sub(mul(bz.cp1, 3), bz.pi));
    const vb = sub(mul(bz.cp2, 3), add(mul(bz.cp1, 6), mul(bz.pi, 3)));
    const vc = mul(sub(bz.cp1, bz.pi), 3);
    const a = cross(va, vb);
    const b = cross(va, vc);
    const c = cross(vb, vb);
    if (!fuzzy_eq_zero(a)) {
        if (fuzzy_eq(a, b) && fuzzy_eq(b, c)) return []; //es una recta degenerada, habrá que tratarlo
        const disc = b * b - 4 * a * c;
        if (fuzzy_eq_zero(disc))
            //caso raro, dos inflexiones "juntas", devuelvo 1 solo punto !?
            return [-0.5 * (b / a)];
        if (disc < 0) return []; //caso normal, sin puntos de inflexión
        return [0.5 * ((-b + disc) / a), 0.5 * ((-b - disc) / a)];
    } else {
        if (!fuzzy_eq_zero(b)) return [-c / b];
        if (!fuzzy_eq_zero(b)) return [];
        return []; //en realidad es una recta degenerada, deberíamos saberlo antes...
    }
}
//esto se puede hacer con el vectorial del convex hull SI no hay inflexiones
//da igual en ese caso qué par de vectores se cojan
// function isClockWise(bz) {
//     const p1 = sub(bz.cp1, bz.pi); //{ x: bz.cp1.x - bz.x0, y: bz.cp1y - bz.y0 };
//     const p2 = sub(bz.pf, bz.cp1); //{ x: bz.x1 - bz.cp1.x, y: bz.y1 - bz.cp1y };
//     //const cross = p1.x * p2.y - p1.y * p2.x;
//     return cross(p1, p2) >= 0 ? "antiClock" : "clock";
// }
function isClockWise(bz) {
    /// The orientation of the Bezier curve
    /// </summary>
    let sum = 0;
    sum += (bz.cp1.x - bz.x0) * (bz.cp1.y + bz.y0);
    sum += (bz.cp2.x - bz.cp1.x) * (bz.cp2.y + bz.cp1.y);
    sum += (bz.x1 - bz.cp2.x) * (bz.y1 + bz.cp2.y);
    sum += (bz.x0 - bz.x1) * (bz.y0 + bz.y1);
    return sum > 0 ? "clock" : "antiClock";
}
// function isClosed(bz) {
//     return (sqDistancePointToPoint(bz.x0, bz.y0, bz.x1, bz.y1) <= geometryPrecision2);
//     }
/**
 *
 * @param {Object bezier} bz
 * @param {Number} x
 * @param {Number} y
 * @returns {Object bezier}
 */
export function bezierTranslate(bz, dx, dy) {
    const d = v2d(dx, dy);
    const np0 = add(bz.pi, d);
    const np1 = add(bz.pf, d);
    const ncp1 = add(bz.cp1, d);
    const ncp2 = add(bz.cp2, d);
    // const [x0, y0] = translatePoint(bz.x0, bz.y0, dx, dy);
    // const [x1, y1] = translatePoint(bz.x1, bz.y1, dx, dy);
    // const [cp1x, cp1y] = translatePoint(bz.cp1.x, bz.cp1y, dx, dy);
    // const [cp2x, cp2y] = translatePoint(bz.cp2x, bz.cp2y, dx, dy);
    return createBezier({ x0: np0.x, y0: np0.y, x1: np1.x, y1: np1.y, cp1x: ncp1.x, cp1y: ncp1.y, cp2x: ncp2.x, cp2y: ncp2.y });
}
export function bezierSymmetryX(bz, y) {
    return createBezier({
        x0: bz.x0,
        y0: 2 * y - bz.y0,
        x1: bz.x1,
        y1: 2 * y - bz.y1,
        cp1x: bz.cp1.x,
        cp1y: 2 * y - bz.cp1.y,
        cp2x: bz.cp2.x,
        cp2y: 2 * y - bz.cp2.y,
    });
}
export function bezierSymmetryY(bz, x) {
    return createBezier({
        x0: 2 * x - bz.x0,
        y0: bz.y0,
        x1: 2 * x - bz.x1,
        y1: bz.y1,
        cp1x: 2 * x - bz.cp1.x,
        cp1y: bz.cp1.y,
        cp2x: 2 * x - bz.cp2.x,
        cp2y: bz.cp2.y,
    });
}
export function bezierSymmetryL(bz, s) {
    const [x0, y0] = pointSymmetricSegment(s, bz.x0, bz.y0);
    const [x1, y1] = pointSymmetricSegment(s, bz.x1, bz.y1);
    const [cp1x, cp1y] = pointSymmetricSegment(s, bz.cp1.x, bz.cp1.y);
    const [cp2x, cp2y] = pointSymmetricSegment(s, bz.cp2.x, bz.cp2.y);
    return createBezier({ x0: x0, y0: y0, x1: x1, y1: y1, cp1x: cp1x, cp1y: cp1y, cp2x: cp2x, cp2y: cp2y });
}

export function bezierRotate(bz, x, y, alfa) {
    const o = v2d(x, y);
    const npi = add(rotL(sub(bz.pi, o), alfa), o);
    const npf = add(rotL(sub(bz.pf, o), alfa), o);
    const ncp1 = add(rotL(sub(bz.cp1, o), alfa), o);
    const ncp2 = add(rotL(sub(bz.cp2, o), alfa), o);
    return createBezier({ x0: npi.x, y0: npi.y, x1: npf.x, y1: npf.y, cp1x: ncp1.x, cp1y: ncp1.y, cp2x: ncp2.x, cp2y: ncp2.y });
}
export function bezierScale(bz, x, y, scale) {
    const o = v2d(x, y);
    const npi = add(mul(sub(bz.pi, o), scale), o);
    const npf = add(mul(sub(bz.pf, o), scale), o);
    const ncp1 = add(mul(sub(bz.cp1, o), scale), o);
    const ncp2 = add(mul(sub(bz.cp2, o), scale), o);
    return createBezier({ x0: npi.x, y0: npi.y, x1: npf.x, y1: npf.y, cp1x: ncp1.x, cp1y: ncp1.y, cp2x: ncp2.x, cp2y: ncp2.y });
}
export function bezierReverse(bz) {
    return createBezier({ x0: bz.x1, y0: bz.y1, x1: bz.x0, y1: bz.y0, cp1x: bz.cp2x, cp1y: bz.cp2y, cp2x: bz.cp1x, cp2y: bz.cp1y });
}

function splitAt(bz, t) {
    const s1 = t < 0 ? 0 : t > 1 ? 1 : t;
    const s2 = 1 - s1;
    //de Casteljeau
    const m0 = add(mul(bz.pi, s2), mul(bz.cp1, s1)); //interpolo el primer tramo
    const m1 = add(mul(bz.cp1, s2), mul(bz.cp2, s1)); //interpolo el segundo tramo
    const m2 = add(mul(bz.cp2, s2), mul(bz.pf, s1)); //interpolo el último tramo
    // segundo orden
    const q0 = add(mul(m0, s2), mul(m1, s1));
    const q1 = add(mul(m1, s2), mul(m2, s1));
    //tercer orden
    const p = add(mul(q0, s2), mul(q1, s1));

    let left = createBezier({ x0: bz.x0, y0: bz.y0, cp1x: m0.x, cp1y: m0.y, cp2x: q0.x, cp2y: q0.y, x1: p.x, y1: p.y });
    let right = createBezier({ x0: p.x, y0: p.y, cp1x: q1.x, cp1y: q1.y, cp2x: m2.x, cp2y: m2.y, x1: bz.x1, y1: bz.y1 });
    return [left, right];
}

//condiciones de hermite + incenter (transition point)
//https://dlacko.org/blog/2016/10/19/approximating-bezier-curves-by-biarcs/

/**
 * El vector de pi a cp1 es t1 = (cp1x-x0, cp1y - y0),
 * el normal en pi sería n1 = (-t1.y, t1.x) = (x0-(-(cp1y - y0)), y0 - (cp1x-x0))
 * o sea n = (x0 + cp1y - y0, y0 - cp1x - x0)
 * El punto medio de pi con g sería mpig = (0.5*(x0 + g.x), 0.5*(y0 + g.y))
 * El vector que une i con g sería pig = (g.x - x0, g.y - y0)
 * El vector normal al mismo sería (-pig.y, pig.x)
 * El vector que une el punto medio de pi a cp1 con g sería
 * (g.x - pm.x, g.y - pm.y)  = (g.x - 0.5*(x0 + cp1x), g.y - 0.5*(y0 + cp1y))
 * y en el corte estará el centro
 * @param {*} bz
 * @param {*} g
 * @returns
 */
// function calculateBiarc(bz, g) {
//     const way = isClockWise(bz);

//     //arco con bz.pi cp1, g  {x:bz.cp1x, y:bz.cp1y}, g, way);
//     let t = { x: bz.cp1x - bz.x0, y: bz.cp1y - bz.y0 };
//     let n1 = { x: -t.y, y: t.x };
//     let s1 = createSegment({ subType: "PP", x0: bz.x0, y0: bz.y0, x1: bz.x0 + n1.x, y1: bz.y0 + n1.y }); //perpendicular a bx en punto inicial

//     let pg = { x: g.x - bz.x0, y: g.y - bz.y0 }; //vector bz.pi -> g
//     let n2 = { x: -pg.y, y: pg.x };
//     let pgm = { x: 0.5 * (g.x + bz.x0), y: 0.5 * (g.y + bz.y0) }; //punto medio de ese vector
//     let s2 = createSegment({ subType: "PP", x0: pgm.x, y0: pgm.y, x1: pgm.x + n2.x, y1: pgm.y + n2.y }); //perpendicular en el punto medio de bx.pi a cp1

//     //el centro en el corte de ambas normales
//     let c = cutSegmentToSegment(s1, s2)[0]; //se devuelve array por defecto aunque solo puede haber un corte
//     //tenemos centro (c) y dos puntos (pi,g), para el arco hace falta way que es general del bezier
//     let r = distancePointToPoint(c.x, c.y, bz.x0, bz.y0);
//     const a1 = createArc(arc2PC2SVG(c, r, { x: bz.x0, y: bz.y0 }, g, way));

//     //El segundo arco es casi igual
//     t = { x: bz.x1 - bz.cp2x, y: bz.y1 - bz.cp2y };
//     n1 = { x: -t.y, y: t.x };
//     s1 = createSegment({ subType: "PP", x0: bz.x1, y0: bz.y1, x1: bz.x1 + n1.x, y1: bz.y1 + n1.y }); //perpendicular a bx en punto inicial
//     pg = { x: g.x - bz.x1, y: g.y - bz.y1 }; //vector bz.pf -> g
//     n2 = { x: -pg.y, y: pg.x };
//     pgm = { x: 0.5 * (g.x + bz.x1), y: 0.5 * (g.y + bz.y1) }; //punto medio de ese vector
//     s2 = createSegment({ subType: "PP", x0: pgm.x, y0: pgm.y, x1: pgm.x + n2.x, y1: pgm.y + n2.y }); //perpendicular en el punto medio de bx.pi a cp1
//     //el centro en el corte de ambas normales
//     c = cutSegmentToSegment(s1, s2)[0]; //se devuelve array por defecto aunque solo puede haber un corte
//     //tenemos centro (c) y dos puntos (g, pf), para el arco hace falta way que es general del bezier
//     r = distancePointToPoint(c.x, c.y, bz.x1, bz.y1);
//     const a2 = createArc(arc2PC2SVG(c, r, g, { x: bz.x1, y: bz.y1 }, way));
//     return createBiarc(a1, a2);
// }

function splitAtInflexionPoints(bz, tolerance = 0.01) {
    let tramos = [];
    if (dpp(bz.pi, bz.pf) < geometryPrecision) {
        //curva cerrada, la divido en dos
        tramos = tramos.concat(splitAt(bz, 0.5));
    } else if (dpp(bz.pi, bz.cp1) < geometryPrecision || dpp(bz.pf, bz.cp2) < geometryPrecision) {
        tramos.push(_clone(bz)); //discutible
    } else {
        let inxpoints = calculateInflexionPoints(bz); // 0, 1 o 2
        inxpoints = inxpoints.filter((t) => t > tolerance && 1 - t > tolerance);
        if (inxpoints.length === 0) tramos.push(_clone(bz));
        else if (inxpoints.length === 1) tramos = tramos.concat(splitAt(bz, inxpoints[0]));
        else {
            // Make the first split and save the first new curve. The second one has to be splitted again
            // at the recalculated t2 (it is on a new curve)
            inxpoints.sort();
            let splited = splitAt(bz, inxpoints[0]);
            tramos.push(splited.shift());
            tramos = tramos.concat(splited.shift().splitAt((1 - inxpoints[0]) * inxpoints[1])); //reparametrización
            //t2 = (1 - t1) * t2;
        }
    }
    return tramos;
}

/**
    Rehago toda la rutina usando lo que he generado para la elipse, al biarc le pasamos el punto de elección
    que va a ser el incenter, y las condiciones de hermite
    lo del incenter podría ser local al biarc y pasarle un flag de la elección de punto deseada (hay varias)
  * @param {*} bz 
  * @param {*} tolerance 
  * @returns 
  */
const pointArcDistance = (P, arc) => Math.abs(dpp(P, arc.c) - arc.r);

function bezierToBiarcError(bz, t0, t1, biarc) {
    const samples = [0.25, 0.5, 0.75]; //por ejemplo, son fracciones del intervalo parámetrico t0-t1
    let maxErr = 0;
    for (const s of samples) {
        const t = t0 + (t1 - t0) * s;
        const P = bezierInterpolate(bz, t);
        const e0 = pointArcDistance(P, biarc[0]);
        const e1 = pointArcDistance(P, biarc[1]);
        maxErr = Math.max(maxErr, Math.min(e0, e1));
    }
    return maxErr;
}
//Para tramos rectos...
//https://agg.sourceforge.net/antigrain.com/research/adaptive_bezier/#:~:text=Here%20we%20sum%20three%20distances,error%20(yes/no).

//Aquí imito la función de elipse con idea de ir convergiendo
function fitAdaptive(bz, t0, t1, tol, out) {
    const P0 = bezierInterpolate(bz, t0);
    const P1 = bezierInterpolate(bz, t1);
    const T0 = bezierDerivative(bz, t0);
    const T1 = bezierDerivative(bz, t1);

    const biarc = calculateBiarc(P0, P1, T0, T1, bz.way);

    if (!biarc) {
        out.push({ line: true, p0: P0, p1: P1 });
        return;
    }

    const err = bezierToBiarcError(bz, t0, t1, biarc);
    console.log(err);

    if (err <= tol) {
        out.push(biarc);
        return;
    }
    console.log("subdivido");
    const tm = (t0 + t1) / 2;

    fitAdaptive(bz, t0, tm, tol, out);
    fitAdaptive(bz, tm, t1, tol, out);
}

export function bezierApproximate(bz, tolerance = 0.01) {
    let tramos = splitAtInflexionPoints(bz, tolerance); //devuelve array de beziers, se supone
    let out = []; //lo que voy a devolver
    //Al devolver el split beziers completos, cada uno de los parámetros va de 0 a 1
    tramos.forEach((tbz) => fitAdaptive(tbz, 0, 1, tolerance, out));
    //En out tengo un array de "biarcs" simplificados, pero el algoritmo trabaja sobre una elipse
    //sin rotar ni trasladar. Como no vamos a trabajar con los biarcs propiamente dichos, devolvemos arcos
    //Hay que filtrar los arcos que son casi iguales y tal, @todo
    const arcs = [];
    //
    out = out.flat(); //un array de arcos
    out.forEach((arc) => {
        arcs.push(createArc(arc2PC2SVG(arc.c, arc.r, arc.p0, arc.p1, bz.way)));
    });
    return arcs;
}
