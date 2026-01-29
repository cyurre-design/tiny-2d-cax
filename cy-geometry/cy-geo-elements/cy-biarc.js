"use strict";

//se supone que le pasamos los do arcos tangentes, se puede pasar la rutina de cálculos
export function createBiarc(a, b) {
    const lengtha = Math.abs(a.r * a.da); //revisar, a3 debe ser mayor que a1
    const lengthb = Math.abs(b.r * b.da); //revisar, a3 debe ser mayor que a1
    const s = lengtha / (lengtha + lengthb);
    return { a: Object.assign({}, a), b: Object.assign({}, b), s: s };
}
function arcInterpolate(arc, t) {
    let alfa = arc.a1 + t * arc.delta;
    return { x: arc.x + arc.r * Math.cos(alfa), y: arc.y + arc.r * Math.cos(alfa) };
}
export function biarcInterpolate(bz, t) {
    return t <= bz.s ? arcInterpolate(bz.a, t / bz.s) : arcInterpolate(bz.b, (t - bz.s) / (1 - bz.s));
}
