"use strict";
import { fuzzy_eq_zero, rotateZ, scale0 } from "../cy-geometry-library.js";
import { arc2PC2SVG, translatePoint, pointSymmetricSegment } from "../cy-geometry-library.js";
import { createArc } from "./cy-arc.js";
import { calculateBiarc } from "./cy-biarc.js";
import { createSegment } from "./cy-segment.js";
/**
 * @todo chequear con más detalle?
 * @param {Object} data , debería venir lo de svg, pi, pf, rx,ry,phi,fA,fS, (o way?)
 * @returns
 */
export function createArcEllipse(data = {}) {
    //copio valores, NO referencias, por si acaso
    const ea = {
        type: "arc-ellipse",
        get pi() {
            return { x: this.x0, y: this.y0 };
        },
        get pf() {
            return { x: this.x1, y: this.y1 };
        },
    };
    Object.assign(ea, data); //esta hace copia de los datos
    //ea.a = ea.a;
    ea.way = ea.fS === 1 ? "antiClock" : "clock";
    ea.rx = Math.abs(ea.rx);
    ea.ry = Math.abs(ea.ry);
    //esta modifica el propio objeto
    fromEndpointToCenter(ea);
    ea.bbox = getBoundingBox(ea);
    return ea;
}
function rotateAndTranslate(ea, p) {
    if (ea.a === 0) return { x: ea.cx + p.x, y: ea.cy + p.y };
    else
        return {
            x: ea.cx + ea.cosphi * p.x - ea.sinphi * p.y,
            y: ea.cy + ea.sinphi * p.x + ea.cosphi * p.y,
        };
}
//NO INTERPOLA LA DE VERDAD, NO GIRA NI SUMA CENTRO
//esto permitiría trabajar con tablas por ejemplo para el coarse
//A cambio, una vez aproximada hay que girar lo que queda
function arcEllipseInterpolate(ea, t) {
    const ct = Math.cos(t),
        st = Math.sin(t);
    return {
        x: ea.rx * ct,
        y: ea.ry * st,
    };
}
//     //evito el phi porque casi siempre será 0
//     if (ea.a !== 0)
//         return {
//             x: ea.cx + ea.cosphi * ea.rx * ct - ea.sinphi * ea.ry * st,
//             y: ea.cy + ea.sinphi * ea.rx * ct + ea.cosphi * ea.ry * st,
//         };
//     else
//         return {
//             x: ea.cx + ea.rx * ct,
//             y: ea.cy + ea.ry * st,
//         };
// }

// De la página de referencia (implementation notes) de la especificación SVG, F.6.5 Elliptical arc implementation notes
// Dados puntos inicial y final, ambos radios, phi, fA y fS, se obtiene el centro de la elipse y los ángulos de inicio y final del arco,
// SVG denomina a los puntos inicial y final x1 y x2 en vez de x0,x1...
// por coherencia llamo ai y da a los ángulos inicial e incremento.

function fromEndpointToCenter(ea) {
    //se pone el centro a mitad de camino de pi y pf y se rota
    const phi = (ea.a * Math.PI) / 180;
    const dx = 0.5 * (ea.x0 - ea.x1);
    const dy = 0.5 * (ea.y0 - ea.y1);

    let x1p, y1p;
    if (ea.a !== 0) {
        //se sospecha que será 0 muy a menudo ?!
        ea.cosphi = Math.cos(phi);
        ea.sinphi = Math.sin(phi);
        x1p = ea.cosphi * dx + ea.sinphi * dy;
        y1p = -ea.sinphi * dx + ea.cosphi * dy;
    } else {
        x1p = dx;
        y1p = dy;
    }
    const x1p2 = x1p * x1p;
    const y1p2 = y1p * y1p;
    // Corrección si radios insuficientes
    let rx2 = ea.rx * ea.rx;
    let ry2 = ea.ry * ea.ry;
    const lambda = x1p2 / ea.rx2 + y1p2 / ea.ry2;
    if (lambda > 1) {
        const s = Math.sqrt(lambda);
        ea.rx *= s;
        ea.ry *= s;
        rx2 = ea.rx * ea.rx;
        ry2 = ea.ry * ea.ry;
    }
    const sign = ea.fA === ea.fS ? -1 : 1;
    const num = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2;
    const den = rx2 * y1p2 + ry2 * x1p2;
    const coef = sign * Math.sqrt(Math.max(0, num / den));
    const cxp = (coef * (ea.rx * y1p)) / ea.ry;
    const cyp = (coef * -(ea.ry * x1p)) / ea.rx;
    //centro de la elipse deshaciendo la rotación y el traslado
    if (ea.a !== 0) {
        ea.cx = ea.cosphi * cxp - ea.sinphi * cyp + (ea.x0 + ea.x1) / 2;
        ea.cy = ea.sinphi * cxp + ea.cosphi * cyp + (ea.y0 + ea.y1) / 2;
    } else {
        ea.cx = cxp + (ea.x0 + ea.x1) / 2;
        ea.cy = cyp + (ea.y0 + ea.y1) / 2;
    }
    // ángulos, se calculan en coordenadas sin rotar ni trasladar....
    function angle(u, v) {
        const dot = u.x * v.x + u.y * v.y; //coseno
        const det = u.x * v.y - u.y * v.x; //seno
        return Math.atan2(det, dot);
    }
    const v0 = { x: (x1p - cxp) / ea.rx, y: (y1p - cyp) / ea.ry };
    const v1 = { x: (-x1p - cxp) / ea.rx, y: (-y1p - cyp) / ea.ry };

    ea.ai = angle({ x: 1, y: 0 }, v0);
    ea.da = angle(v0, v1);

    //if (ea.fS && ea.da > 0) ea.da -= 2 * Math.PI;
    //if (!ea.fS && ea.da < 0) ea.da += 2 * Math.PI;
}

function getBoundingBox(ea) {
    //esto ye del objeto
    const tita2 = ea.ai + ea.da;
    const cosphi = Math.cos(ea.a);
    const sinphi = Math.sin(ea.a);
    // ángulos
    function point(t) {
        const ct = Math.cos(t);
        const st = Math.sin(t);
        return {
            x: ea.cx + ea.rx * ct * cosphi - ea.ry * st * sinphi,
            y: ea.cy + ea.rx * ct * sinphi + ea.ry * st * cosphi,
        };
    }

    function within(t) {
        let a = ea.ai,
            b = tita2;
        if (a > b) [a, b] = [b, a];
        return t >= a - 1e-9 && t <= b + 1e-9;
    }
    // STEP 2: candidatos
    let pts = [point(ea.ai), point(tita2)];
    const tx = Math.atan2(-ea.ry * sinphi, ea.rx * cosphi);
    const ty = Math.atan2(ea.ry * cosphi, ea.rx * sinphi);

    const bbox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };

    [tx, tx + Math.PI, ty, ty + Math.PI].forEach((t) => {
        if (within(t)) pts.push(point(t));
    });
    pts.forEach((p) => {
        bbox.x0 = Math.min(bbox.x0, p.x);
        bbox.y0 = Math.min(bbox.y0, p.y);
        bbox.x1 = Math.max(bbox.x1, p.x);
        bbox.y1 = Math.max(bbox.y1, p.y);
    });

    return bbox;
}
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
    return createArcEllipse({
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        rx: ea.rx,
        ry: ea.ry,
        a: ea.a,
        fA: ea.fA,
        fS: ea.fS,
        way: ea.way,
    });
}
export function arcEllipseSymmetryX(ea, y) {
    return createArcEllipse({
        x0: ea.x0,
        y0: 2 * y - ea.y0,
        x1: ea.x1,
        y1: 2 * y - ea.y1,
        rx: ea.rx,
        ry: ea.ry,
        a: ea.a,
        fA: ea.fA,
        fS: ea.fS === 0 ? 1 : 0,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}
export function arcEllipseSymmetryY(ea, x) {
    return createArcEllipse({
        x0: 2 * x - ea.x0,
        y0: ea.y0,
        x1: 2 * x - ea.x1,
        y1: ea.y1,
        rx: ea.rx,
        ry: ea.ry,
        a: -ea.a,
        fA: ea.fA,
        fS: ea.fS === 0 ? 1 : 0,
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
        rx: ea.rx,
        ry: ea.ry,
        a: -ea.a,
        fA: ea.fA,
        fS: ea.fS === 0 ? 1 : 0,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}

export function arcEllipseRotate(ea, x, y, alfa) {
    const [x0, y0] = rotateZ(ea.x0 - x, ea.y0 - y, alfa);
    const [x1, y1] = rotateZ(ea.x1 - x, ea.y1 - y, alfa);
    const na = ea.a + (alfa * 180) / Math.PI;
    return createArcEllipse({ x0: x0 + x, y0: y0 + y, x1: x1 + x, y1: y1 + y, rx: ea.rx, ry: ea.ry, a: na, fA: ea.fA, fS: ea.fS, way: ea.way });
}
export function arcEllipseScale(ea, x, y, scale) {
    const [x0, y0] = scale0(ea.x0 - x, ea.y0 - y, scale);
    const [x1, y1] = scale0(ea.x1 - x, ea.y1 - y, scale);
    return createArcEllipse({
        x0: x0 + x,
        y0: y0 + y,
        x1: x1 + x,
        y1: y1 + y,
        rx: ea.rx * scale,
        ry: ea.ry * scale,
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
        rx: ea.rx,
        ry: ea.ry,
        a: ea.a + Math.PI,
        fA: ea.fA,
        fS: 1 - ea.fS,
        way: ea.way === "clock" ? "antiClock" : "clock",
    });
}

/**
 *
 * @param {Number} a    semieje mayor
 * @param {Number} b    semieje menor
 * @param {Number} t0  parámetro inicial la elipse, el "ángulo" , normalmente a1
 * @param {Number} t1  parámetro final de la elipse, ai + da
 * @param {Number} maxDeltaK precisión requerida
 * @returns
 */
function ellipseAdaptiveByCurvature(a, b, t0, t1, maxDeltaK = 0.002) {
    function curvature(t) {
        const s = Math.sin(t);
        const c = Math.cos(t);
        const d = a * a * s * s + b * b * c * c;
        return (a * b) / Math.pow(d, 1.5);
    }

    let pts = [t0];
    let t = t0;

    while (t < t1) {
        let k0 = curvature(t);

        // estimación inicial paso
        let dt = (t1 - t) / 10;

        // Newton–Raphson sobre Δκ (incremento de curvatura)
        for (let i = 0; i < 6; i++) {
            let k1 = curvature(t + dt);
            let dk = k1 - k0;

            if (Math.abs(dk) < 1e-12) break;

            dt *= maxDeltaK / Math.abs(dk);
        }

        if (t + dt > t1) dt = t1 - t;

        t += dt;
        pts.push(t);
    }

    return pts;
}

//derivada de una elipse como las de svg, podemos pasarle el arcEllipse
function ellipseDerivativeRot(ea, t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    /*    if (!fuzzy_eq_zero(ea.a))
        return {
            x: -ea.rx * s * ea.cosphi - ea.ry * c * ea.sinphi,
            y: -ea.rx * s * ea.sinphi + ea.ry * c * ea.cosphi,
        };
    else*/ return ea.fS === 0 ? { x: -ea.rx * s, y: ea.ry * c } : { x: ea.rx * s, y: -ea.ry * c };
}

/**
 * Es importante observar que esto solo depende de a y b en realidad, porque t0,t1 podrían ser la elipse completa
 * Así que incluso es factible pensar en una tabla. De hecho, una aproximación a partir de una circunferencia
 * tiene pinta de ir a funcionar bien... nos dará más puntos en la parte de más curvatura y menos en la otra...
 * @param {Object} ea arco de elipse
 * @param {Number} chordalError error cordal
 * @returns Array of "points" in the parameter t (angle from the center of the ellipse)
 */

export function arcEllipseCoarseApproximation(ea, chordalError = 0.01) {
    const N = 10;
    const deltaT = ea.da / N;
    const points = [];
    for (let i = 0, t = ea.ai; i <= N; i++, t += deltaT) {
        points.push(t); //SOLO PARA PROBAR
    }
    return points;
}
// export function arcEllipseCoarseApproximation(ea, chordalError = 0.01) {
//     const a = ea.rx;
//     const b = ea.ry;
//     const t0 = ea.ai;
//     const t1 = ea.ai + ea.da;
//     const eps = chordalError;

//     function curvature(t) {
//         const s = Math.sin(t),
//             c = Math.cos(t);
//         const d = a * a * s * s + b * b * c * c;
//         return (a * b) / Math.pow(d, 1.5);
//     }

//     function arcError(t, dt) {
//         const k = curvature(t);
//         const R = 1 / k;
//         // error aproximado arco circular
//         return R * (1 - Math.cos(dt / 2));
//     }

//     let ts = [t0];
//     let t = t0;

//     while (t < t1) {
//         let dt = 0.1; // paso inicial razonable

//         // ajustar iterativamente
//         for (let i = 0; i < 5; i++) {
//             let err = arcError(t, dt);

//             if (err === 0) break;

//             dt *= Math.cbrt(eps / err);
//         }

//         if (t + dt > t1) dt = t1 - t;

//         t += dt;
//         ts.push(t);
//     }
//     console.log(ts);

//     return ts;
// }
function pointArcDistance(P, arc) {
    const v = { x: P.x - arc.c.x, y: P.y - arc.c.y };
    const d = Math.hypot(v.x, v.y);
    return Math.abs(d - arc.r);
}

function biarcError(ea, t0, t1, biarc) {
    const samples = [0.25, 0.5, 0.75];
    let maxErr = 0;

    for (const s of samples) {
        const t = t0 + (t1 - t0) * s;
        const P = arcEllipseInterpolate(ea, t);

        const e0 = pointArcDistance(P, biarc[0]);
        const e1 = pointArcDistance(P, biarc[1]);

        maxErr = Math.max(maxErr, Math.min(e0, e1));
    }

    return maxErr;
}
/**
 *
 * @param {Object} ea arco de elipse que quermos aproximar con arcos
 * @param {Number} t0 valor inicial del parámetro (ai en el pi)
 * @param {Number} t1 valor final, (ai + da en el pf)
 * @param {Number} tol  error cordal
 * @param {Array} out  de valores de parámetro
 * @returns
 */
function fitAdaptive(ea, t0, t1, tol, out) {
    const P0 = arcEllipseInterpolate(ea, t0);
    const P1 = arcEllipseInterpolate(ea, t1);
    const T0 = ellipseDerivativeRot(ea, t0);
    const T1 = ellipseDerivativeRot(ea, t1);

    const biarc = calculateBiarc(P0, P1, T0, T1, ea.way);

    if (!biarc) {
        out.push({ line: true, p0: P0, p1: P1 });
        return;
    }

    const err = biarcError(ea, t0, t1, biarc);
    console.log(err);

    if (err <= tol) {
        out.push(biarc);
        return;
    }
    console.log("subdivido");
    const tm = (t0 + t1) / 2;

    fitAdaptive(ea, t0, tm, tol, out);
    fitAdaptive(ea, tm, t1, tol, out);
}
/**
 * Todas las funciones internas suponen una elipse centrada en 0,0 y sin rotar
 * Es mucho más sencillo realizarlo así porque además se presta al uso de tablas y optimizaciones
 * @param {Object arcEllipse} ea
 * @param {Number} eps error cordal
 * @returns
 */
// TEST con segmentos
// export function arcEllipseApproximate(ea, eps) {
//     let points = arcEllipseCoarseApproximation(ea, 10 * eps);
//     let out = [];
//     let p0 = arcEllipseInterpolate(ea, points[0]);
//     let p1;
//     for (let i = 1; i < points.length; i++) {
//         p1 = arcEllipseInterpolate(ea, points[i]);
//         out.push(createSegment({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y }));
//         p0 = p1;
//         // fitAdaptive(ea, t0, t1, eps, out);
//     }
//     return out;
// }
export function arcEllipseApproximate(ea, eps) {
    let points = arcEllipseCoarseApproximation(ea, 10 * eps);
    let out = [];
    for (let i = 1; i < points.length; i++) {
        const t0 = points[i - 1];
        const t1 = points[i];
        fitAdaptive(ea, t0, t1, eps, out);
    }
    //En out tengo un array de "biarcs" simplificados, pero el algoritmo trabaja sobre una elipse
    //sin rotar ni trasladar. Como no vamos a trabajar con los biarcs propiamente dichos, devolvemos arcos
    //Hay que filtrar los arcos que son casi iguales y tal, @todo
    const arcs = [];
    //
    out = out.flat(); //un array de arcos
    out.forEach((arc) => {
        arcs.push(
            createArc(arc2PC2SVG(rotateAndTranslate(ea, arc.c), arc.r, rotateAndTranslate(ea, arc.p0), rotateAndTranslate(ea, arc.p1), ea.way)),
        );
    });
    // out.forEach((biarc) => {
    //     biarc.for
    //     let a = biarc.arc0;
    //     arcs.push(
    //         createArc(
    //             arc2PC2SVG(
    //                 { x: ea.cx + a.c.x, y: ea.cy + a.c.y },
    //                 a.r,
    //                 { x: ea.cx + a.p0.x, y: ea.cy + a.p0.y },
    //                 { x: ea.cx + a.p1.x, y: ea.cy + a.p1.y },
    //                 ea.way,
    //             ),
    //         ),
    //     );
    //     a = biarc.arc1;
    //     arcs.push(
    //         createArc(
    //             arc2PC2SVG(
    //                 { x: ea.cx + a.c.x, y: ea.cy + a.c.y },
    //                 a.r,
    //                 { x: ea.cx + a.p0.x, y: ea.cy + a.p0.y },
    //                 { x: ea.cx + a.p1.x, y: ea.cy + a.p1.y },
    //                 ea.way,
    //             ),
    //         ),
    //     );
    // });
    return arcs;
    //console.log(out);
}
