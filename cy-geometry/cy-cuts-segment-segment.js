// Y: Trato las aproximaciones y casos especiales

import { fuzzy_eq_point, fuzzy_eq_zero, geometryPrecision, distancePointToPoint } from "./cy-geometry-library.js";

//YURRE: Hay que crear una clase derivada de segmento para que incluya las funciones que nos hacen falta
import { distancePointToLine } from "./cy-geometry-library.js";
import { Cut } from "./cy-cut-types.js";
// Finds the intersects between two lines segments.

export function line_line_intr(s1, s2, eps = geometryPrecision) {
    //referencio al s2.pi que viene a ser el marco por el que la rutina devuelve cosas
    let u2 = { x: s2.pf.x - s2.pi.x, y: s2.pf.y - s2.pi.y }; //vector del segmento s2
    let u1 = { x: s1.pf.x - s1.pi.x, y: s1.pf.y - s1.pi.y }; //vector del segmento s1
    let w = { x: s1.pi.x - s2.pi.x, y: s1.pi.y - s2.pi.y }; //vector desde s1.pi a s2.pi
    //Los vectores los "alineo" rotando según el u2
    // La matriz es ux,uy,-uy,ux que al multiplica por cualquier vector alineado da +-l, 0
    let u1x = s2.ux * u1.x + s2.uy * u1.y;
    let u1y = -s2.uy * u1.x + s2.ux * u1.y; //Si u1y es @0 son paralelos, salvo escala, coincide con el denominador del cálculo de intersección
    let u2x = s2.ux * u2.x + s2.uy * u2.y; // que es s2l lógicamente: s2l*ux*ux + s2l*uy*uy = s2l*(ux*ux+uy*uy) = s2l * 1 = s2l (l con signo)!
    let wx = s2.ux * w.x + s2.uy * w.y; // proyección de
    //Tratamiento de casos degenerados , segmentos puntuales, lo ideal sería filtrar en algún sitio y que no lleguen....
    //en principio hay qye tratarlos antes que otras cosas
    if (fuzzy_eq_zero(u1x, eps) && fuzzy_eq_zero(u1y, eps)) {
        //s1.pf === s1.pi puesto de otra manera...
        if (fuzzy_eq_zero(u2x, eps)) {
            //ambos son un puntp
            return fuzzy_eq_point(s1.pi, s2.pi, eps) ? { r: Cut.TrueIntersect, point: s2.pi } : { r: Cut.NoIntersect }; // mismo punto o puntos distintos
        }
        if (!fuzzy_eq_zero(distancePointToLine(s1.pi, s2), eps)) return { r: Cut.NoIntersect }; // punto s1 no está en la recta s2
        //aquí está en la recta, así que w es la distancia a s2.pi (con signo)
        if (wx < -eps || wx > u2x + eps) return { r: Cut.NoIntersect }; //punto fuera del segmento
        return { r: Cut.TrueIntersect, point: s1.pi }; //punto dentro
    }
    if (fuzzy_eq_zero(u2x)) {
        //el s2 es punto pero el s1 no lo es. mirar si está dentro
        if (!fuzzy_eq_zero(distancePointToLine(s2.pi, s1), eps)) return { r: Cut.NoIntersect }; // punto s1 no está en la recta s2
        //Al ser un punto, las proyecciones sobre s2 no tienen sentido, miro por distancia al punto medio
        if (distancePointToPoint(0.5 * (s1.pi.x + s1.pf.x), 0.5 * (s1.pi.y + s1.pf.y), s2.pi.x, s2.pi.y) < eps + 0.5 * s1.d)
            return { r: Cut.TrueIntersect, point: s2.pi };
        return { r: Cut.NoIntersect };
    }

    //Una vez tratados los casos degenerados que no debería haber, miramos segmentos "normales"
    //YURRE, Alternativa cogida directamente de nuestro line_cuts_to_line , le pongo epsilons...
    let denominador = s1.uy * s2.ux - s2.uy * s1.ux; // es vectorial, seno del ángulo
    if (!fuzzy_eq_zero(denominador, eps)) {
        //NO SON COLINEALES, CASO NORMAL
        const s1midpoint = { x: 0.5 * (s1.pi.x + s1.pf.x), y: 0.5 * (s1.pi.y + s1.pf.y) };
        const s2midpoint = { x: 0.5 * (s2.pi.x + s2.pf.x), y: 0.5 * (s2.pi.y + s2.pf.y) };
        const p = { x: (-s2.ux * s1.c + s1.ux * s2.c) / denominador, y: (s1.uy * s2.c - s1.c * s2.uy) / denominador };
        if (
            distancePointToPoint(p.x, p.y, s1midpoint.x, s1midpoint.y) > 0.5 * s1.d + eps ||
            distancePointToPoint(p.x, p.y, s2midpoint.x, s2midpoint.y) > 0.5 * s2.d + eps
        )
            return { r: Cut.FalseIntersect, point: p };
        return { r: Cut.TrueIntersect, point: p };
    }
    //YURRE: son PARALELAS, no necesariamente en la misma recta, miro distancia punto-recta
    if (!fuzzy_eq_zero(distancePointToLine(s1.pi, s2), eps)) return { r: Cut.NoIntersect }; //O sea, no son colineales, no  hay overlap
    //al menos uno de los puntos debe estar dentro...si son ambos < 0 o ambos mayor que u2x, no intersect
    //Aquí, con todo alineado, s2 va de 0 a u2x y s1 va de w a w+s1x (con signos)
    u1x += wx; //una vez alineado, este es el punto final de s1 en el nuevo sistema
    //Pongo todo "hacia la derecha" por legibilidad
    if (u2x < 0) {
        u2x = -u2x;
        wx = -wx;
        s1.x = -s1.x;
    }
    //miro si no hay intersección, si s1 completo está a la izquierda o a la derecha de s2
    if ((wx < -eps && u1x < -eps) || (wx > u2x + eps && u1x > u2x + eps)) return { r: Cut.NoIntersect };
    //miro si hay contacto puntual
    // if(fuzzy_eq_zero(u1x))
    //     return({r:'TrueIntersect', point:s2.pi} );
    // if(fuzzy_eq(wx, u2x))
    //     return({r:'TrueIntersect', point:s2.pf} );

    if (wx < u1x) {
        //orientado como s2, al menos 1 punto debe estar dentro
        const p1 = wx < 0 ? { x: s2.pi.x, y: s2.pi.y } : { x: s1.pi.x, y: s1.pi.y };
        const p2 = u1x > u2x ? { x: s2.pf.x, y: s2.pf.y } : { x: s1.pf.x, y: s1.pf.y };
        if (fuzzy_eq_point(p1, p2, eps)) return { r: Cut.TrueIntersect, point: p1 };
        return { r: Cut.Overlapping, point1: p1, point2: p2, sameDirection: true };
    } else {
        //orientado al revés
        const p1 = u1x < 0 ? s2.pi : s1.pf;
        const p2 = wx > u2x ? s2.pf : s1.pi;
        if (fuzzy_eq_point(p1, p2, eps)) return { r: Cut.TrueIntersect, point: p1 };
        return { r: Cut.Overlapping, point1: p1, point2: p2, sameDirection: false };
    }
}
