"use strict";
import { rotateZ, scale0 } from "../cy-geometry-library.js";
import { normalize_radians, translatePoint, pointSymmetricSegment } from "../cy-geometry-library.js";

// const maxTestPoints = 8; //esto lo dejo fuera y calculado
// let testPoints = Array.from({ length: maxTestPoints }, (_, i) => i / maxTestPoints);
// let coefs = {};
// testPoints.forEach((tp) => (coefs[tp] = [(1 - tp) * (1 - tp) * (1 - tp), (1 - tp) * (1 - tp) * tp, (1 - tp) * tp * tp, tp * tp * tp]));

// function bezierInterpolateq(tp){
//         let cf = coefs[tp];
//         return new Point(
//             cf[0]*this.x + cf[1]*this.cp1x + cf[2]*this.cp2x + cf[3]*this.pf.x,
//             cf[0]*this.y + cf[1]*this.cp1y + cf[2]*this.cp2y + cf[3]*this.pf.y,
//         )
//     }
//Debemos garantizar la continuidad por construcción y todo será más sencillo

//es una polilínea
//chequeos: length >= 2 para closed, length >= 1 open

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
export function createArcEllipse(data = {}) {
    //copio valores, NO referencias, por si acaso
    const eArc = {
        type: "arc-ellipse",
        x0: data.x0,
        y0: data.y0,
        x1: data.x1,
        y1: data.y1,
        r1: data.r1,
        r2: data.r2,
        a: data.a, //ángulo de rotación del eje mayor respecto al eje x
        fA: data.fA,
        fS: data.fS,
        way: data.fS === 0 ? "antiClock" : "clock",
        get pi() {
            return { x: this.x0, y: this.y0 };
        },
        get pf() {
            return { x: this.x1, y: this.y1 };
        },
    };
    //un apaño porque ye difícil, mejoraría separando si hay puntos de inflexión...
    //Copiar la del arc
    eArc.bbox = getBoundingBox(eArc);
    return eArc;
}
//
function getBoundingBox(ea) {
    const phi = (ea.a * Math.PI) / 180;
    const cosphi = Math.cos(phi);
    const sinphi = Math.sin(phi);

    // STEP 1: convertir endpoints → centro (spec SVG F.6.5)
    // Esto viene en la especificación SVG, Debería moverlo al parser,
    // porque es común con el arco de circunferencia, que es un caso especial de este, con r1=r2, a=0, y fA,fS según el ángulo
    let dx = (ea.x1 - ea.x0) / 2;
    let dy = (ea.y1 - ea.y0) / 2;

    let x1p = cosphi * dx + sinphi * dy;
    let y1p = -sinphi * dx + cosphi * dy;

    let rx = Math.abs(ea.r1);
    let ry = Math.abs(ea.r2);

    // Corrección si radios insuficientes
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
        const s = Math.sqrt(lambda);
        rx *= s;
        ry *= s;
    }

    const sign = ea.fA === ea.fS ? -1 : 1;

    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const coef = sign * Math.sqrt(Math.max(0, num / den));

    const cxp = (coef * (rx * y1p)) / ry;
    const cyp = (coef * -(ry * x1p)) / rx;

    const cx = cosphi * cxp - sinphi * cyp + (ea.x0 + ea.x1) / 2;
    const cy = sinphi * cxp + cosphi * cyp + (ea.y0 + ea.y1) / 2;

    // ángulos
    function angle(u, v) {
        const dot = u[0] * v[0] + u[1] * v[1];
        const det = u[0] * v[1] - u[1] * v[0];
        return Math.atan2(det, dot);
    }

    const v1 = [(x1p - cxp) / rx, (y1p - cyp) / ry];
    const v2 = [(-x1p - cxp) / rx, (-y1p - cyp) / ry];

    let tita1 = angle([1, 0], v1);
    let deltaTita = angle(v1, v2);

    if (!ea.fS && deltaTita > 0) deltaTita -= 2 * Math.PI;
    if (ea.fS && deltaTita < 0) deltaTita += 2 * Math.PI;

    const tita2 = tita1 + deltaTita;

    function point(t) {
        const ct = Math.cos(t);
        const st = Math.sin(t);
        return {
            x: cx + rx * ct * cosphi - ry * st * sinphi,
            y: cy + rx * ct * sinphi + ry * st * cosphi,
        };
    }

    function within(t) {
        let a = tita1,
            b = tita2;
        if (a > b) [a, b] = [b, a];
        return t >= a - 1e-9 && t <= b + 1e-9;
    }

    // STEP 2: candidatos
    let pts = [point(tita1), point(tita2)];

    const tx = Math.atan2(-ry * sinphi, rx * cosphi);
    const ty = Math.atan2(ry * cosphi, rx * sinphi);

    [tx, tx + Math.PI, ty, ty + Math.PI].forEach((t) => {
        if (within(t)) pts.push(point(t));
    });

    // STEP 3: bbox
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    pts.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });

    return { x0: minX, y0: minY, x1: maxX, y1: maxY };
}
//interpola al punto t
// function interpolate(ea, t) {
//     let it = 1 - t;
//     return {
//         x: it * it * it * ea.x0 + 3 * it * it * t * ea.cp1x + 3 * it * t * t * ea.cp2x + t * t * t * ea.x1,
//         y: it * it * it * ea.y0 + 3 * it * it * t * ea.cp1y + 3 * it * t * t * ea.cp2y + t * t * t * ea.y1,
//     };
// }

// function isClosed(bz) {
//     return (sqDistancePointToPoint(bz.x0, bz.y0, bz.x1, bz.y1) <= geometryPrecision2);
//     }
/**
 *
 * @param {Object arcEllipse} ea
 * @param {Number} x
 * @param {Number} y
 * @returns {Object arcEllipse}
 */
export function arcEllipseTranslate(ea, dx, dy) {
    const [x0, y0] = translatePoint(ea.x0, ea.y0, dx, dy);
    const [x1, y1] = translatePoint(ea.x1, ea.y1, dx, dy);
    return createArcEllipse({ x0: x0, y0: y0, x1: x1, y1: y1, r1: ea.r1, r2: ea.r2, a: ea.a, fA: ea.fA, fS: ea.fS, way: ea.way });
}
export function arcEllipseSymmetryX(ea, y) {
    return createArcEllipse({
        x0: ea.x0,
        y0: 2 * y - ea.y0,
        x1: ea.x1,
        y1: 2 * y - ea.y1,
        r1: ea.r1,
        r2: ea.r2,
        a: -ea.a,
        fA: ea.fA,
        fS: ea.fS,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}
export function arcEllipseSymmetryY(ea, x) {
    return createArcEllipse({
        x0: 2 * x - ea.x0,
        y0: ea.y0,
        x1: 2 * x - ea.x1,
        y1: ea.y1,
        r1: ea.r1,
        r2: ea.r2,
        a: -ea.a,
        fA: ea.fA,
        fS: ea.fS,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}
export function arcEllipseSymmetryL(ea, s) {
    const [x0, y0] = pointSymmetricSegment(s, ea.x0, ea.y0);
    const [x1, y1] = pointSymmetricSegment(s, ea.x1, ea.y1);
    return createArcEllipse({
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        r1: ea.r1,
        r2: ea.r2,
        a: -ea.a,
        fA: ea.fA,
        fS: ea.fS,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}

export function arcEllipseRotate(ea, x, y, alfa) {
    const [x0, y0] = rotateZ(ea.x0 - x, ea.y0 - y, alfa);
    const [x1, y1] = rotateZ(ea.x1 - x, ea.y1 - y, alfa);
    const na = normalize_radians(ea.a + alfa);
    return createArcEllipse({ x0: x0 + x, y0: y0 + y, x1: x1 + x, y1: y1 + y, r1: ea.r1, r2: ea.r2, a: na, fA: ea.fA, fS: ea.fS, way: ea.way });
}
export function arcEllipseScale(ea, x, y, scale) {
    const [x0, y0] = scale0(ea.x0 - x, ea.y0 - y, scale);
    const [x1, y1] = scale0(ea.x1 - x, ea.y1 - y, scale);
    return createArcEllipse({
        x0: x0 + x,
        y0: y0 + y,
        x1: x1 + x,
        y1: y1 + y,
        r1: ea.r1 * scale,
        r2: ea.r2 * scale,
        a: ea.a,
        fA: ea.fA,
        fS: ea.fS,
        way: ea.way,
    });
}
export function arcEllipseReverse(ea) {
    return createArcEllipse({
        x0: ea.x1,
        y0: ea.y1,
        x1: ea.x0,
        y1: ea.y0,
        r1: ea.r1,
        r2: ea.r2,
        a: ea.a + Math.PI,
        fA: ea.fA,
        fS: 1 - ea.fS,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}

// function splitAt(bz, t) {
//     let s1 = t < 0 ? 0 : t > 1 ? 1 : t;
//     let s2 = 1 - s1;
//     //de Casteljeau
//     let m0x = s2 * bz.x0 + s1 * bz.cp1x,
//         m0y = s2 * bz.y0 + s1 * bz.cp1y;
//     let m1x = s2 * bz.cp1x + s1 * bz.cp2x,
//         m1y = s2 * bz.cp1y + s1 * bz.cp2y;
//     let m2x = s2 * bz.cp2x + s1 * bz.x1,
//         m2y = s2 * bz.cp2y + s1 * bz.y1;
//     //segundo orden
//     let q0x = s2 * m0x + s1 * m1x,
//         q0y = s2 * m0y + s1 * m1y;
//     let q1x = s2 * m1x + s1 * m2x,
//         q1y = s2 * m1y + s1 * m2y;
//     //tercer orden
//     let px = s2 * q0x + s1 * q1x,
//         py = s2 * q0y + s1 * q1y;

//     let left = createBezier({ x0: bz.x0, y0: bz.y0, cp1x: m0x, cp1y: m0y, cp2x: q0x, cp2y: q0y, x1: px, y1: py });
//     let right = createBezier({ x0: px, y0: py, cp1x: q1x, cp1y: q1y, cp2x: m2x, cp2y: m2y, x1: bz.x1, y1: bz.y1 });
//     return [left, right];
// }

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
//   }

// export function arcEllipseApproximate(bz, tolerance = 0.01) {
//     let tramos = splitAtInflexionPoints(bz, tolerance); //devuelve array de beziers, se supone
//     let biarcs = []; //lo que voy a devolver

//     while (tramos.length > 0 && tramos.length < 6) {
//         let bz = tramos.shift();
//         const g = calculateIncenter(bz); //pueden ser paralelos las líneas de control
//         if (!g) {
//             tramos = splitAt(bz, 0.5).concat(tramos);
//             continue;
//         }
//         //caculate Biarc
//         let biarc = calculateBiarc(bz, g);
//         //            biarcs.push(biarc);
//         //Calculate the maximum error , vamos a dividir donde sea máximo
//         let err = testPoints.map((t) => interpolate(bz, t));
//         err = err.map((p) =>
//             Math.min(
//                 Math.abs(distancePointToPoint(p.x, p.y, biarc.a.cx, biarc.a.cy) - biarc.a.r),
//                 Math.abs(distancePointToPoint(p.x, p.y, biarc.b.cx, biarc.b.cy) - biarc.b.r),
//             ),
//         );
//         let emax = Math.max(...err);
//         if (emax < tolerance) {
//             //ok
//             biarcs.push(biarc);
//         } else {
//             const t = testPoints[err.indexOf(emax)];
//             tramos = splitAt(bz, t).concat(tramos);
//         }
//     }
//     let arcs = [];
//     biarcs.forEach((b) => {
//         arcs.push(b.a);
//         arcs.push(b.b);
//     });
//     return arcs;
// }
