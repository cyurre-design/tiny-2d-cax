// -------- utilidades vectoriales ----------
export const v2d = (x, y) => ({ x: x, y: y });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const cross = (a, b) => a.x * b.y - b.y * a.x;
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const mul = (a, s) => ({ x: a.x * s, y: a.y * s });
export const len = (v) => Math.hypot(v.x, v.y);
export const left = (v) => ({ x: -v.y, y: v.x });
export const inv = (v) => ({ x: -v.x, y: -v.y });
export const mid = (a, b) => ({ x: 0.5 * (a.x + b.x), y: 0.5 * (a.y + b.y) });
export const dpp = (a, b) => len(sub(b, a));
export const norm = (v) => {
    const l = len(v);
    return { x: v.x / l, y: v.y / l };
};
export const rotL = (a, alfa) => {
    const c = Math.cos(alfa);
    const s = Math.sin(alfa);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};
