// Y: Trato las aproximaciones y casos especiales

import { fuzzy_eq_point, fuzzy_eq_zero, geometryPrecision, distancePointToPoint, cutSegmentToSegment, fuzzy_eq } from "./cy-geometry-library.js";

//YURRE: Hay que crear una clase derivada de segmento para que incluya las funciones que nos hacen falta
import { distancePointToLine } from "./cy-geometry-library.js";
import { Cut } from "./cy-cut-types.js";
import { segmentMidpoint } from "./cy-geo-elements/cy-segment.js";
// Finds the intersects between two lines segments.

export function line_line_intr(s1, s2, eps = geometryPrecision) {
    //Tratamiento de casos degenerados , segmentos puntuales, lo ideal sería filtrar en algún sitio y que no lleguen....
    //en principio hay qye tratarlos antes que otras cosas
    //Rehago todo usando lo precalculado de librería
    //helper functions por legibilidad, y precalculo los puntos medios aunque tenga un pequeño coste, por legibilidad
    const pm2 = segmentMidpoint(s2);
    const pm1 = segmentMidpoint(s1);
    const isPointInS2 = (p) => distancePointToPoint(pm2.x, pm2.y, p.x, p.y) < 0.5 * s2.d;
    const isPointInS1 = (p) => distancePointToPoint(pm1.x, pm1.y, p.x, p.y) < 0.5 * s1.d;
    if (fuzzy_eq_zero(s1.d, eps)) {
        //s1 es un punto, hago cáculos con el punto medio, por si acaso por precisión, con dudas???
        if (fuzzy_eq_zero(s2.d, eps)) {
            //ambos son un puntp
            return fuzzy_eq_point(s1.pi, s2.pi, eps) ? { r: Cut.TrueIntersect, point: s2.pi } : { r: Cut.NoIntersect }; // mismo punto o puntos distintos
        }
        //s1 es un punto pero s2 no
        if (!fuzzy_eq_zero(distancePointToLine(pm1, s2), eps)) return { r: Cut.NoIntersect }; // punto s1 no está en la recta s2
        //aquí s1 está en la recta de s2 , miro si está dentro del segmento
        if (isPointInS2(pm1))
            //s1 es puntual, podría haber usado pi o pf
            return { r: Cut.NoIntersect }; //punto fuera del segmento
        return { r: Cut.TrueIntersect, point: pm1 }; //punto dentro
    }
    if (fuzzy_eq_zero(s2.d, eps)) {
        //el s2 es punto pero el s1 no lo es. mirar primero si s2 está en la línea de s1
        if (!fuzzy_eq_zero(distancePointToLine(pm2, s1), eps)) return { r: Cut.NoIntersect }; // punto s1 no está en la recta s2
        if (isPointInS1(pm2))
            //Es un punto, podría haber usado pi o pf
            return { r: Cut.TrueIntersect, point: pm2 };
        return { r: Cut.NoIntersect };
    }

    //Una vez tratados los casos degenerados que no debería haber, miramos segmentos "normales"
    //YURRE, Uso la rutina de librería.
    const sols = cutSegmentToSegment(s1, s2, eps);
    if (sols.length !== 0) {
        //NO SON COLINEALES, CASO NORMAL
        const p = sols[0];
        //Si el punto de corte está fuera del segmento de devuelve FalseIntersect
        //tiene que estar en ambos segmentos para ser fetén
        if (!isPointInS1(p)) return { r: Cut.FalseIntersect, point: p };
        if (!isPointInS2(p)) return { r: Cut.FalseIntersect, point: p };
        return { r: Cut.TrueIntersect, point: p };
    }
    //YURRE: Aquí son PARALELAS, no necesariamente en la misma recta, miro distancia punto-recta
    if (!fuzzy_eq_zero(distancePointToLine(s1.pi, s2), eps)) return { r: Cut.NoIntersect }; //O sea, no son colineales, no  hay overlap
    //Como están en la misma recta, trabajamos con las distancias, pero el sentido de los vectores es significante
    //Se pueden dar todas las posibilidades....de overlap
    //comparación de radios, si la distancia es > que la suma de los radios, pues no se cortan
    if (distancePointToPoint(pm2.x, pm2.y, pm1.x, pm1.y) > 0.5 * (s1.d + s2.d)) {
        //s2.pi y 2.pf están fuera
        return { r: Cut.NoIntersect }; //ambos extermos de s1 están fuera de s2
    }
    //Aquí hay algún tipo de overlap
    //empiezo por agrupar según el sentido
    if (fuzzy_eq(s1.nx, s2.nx) && fuzzy_eq(s1.ny, s2.ny)) {
        //mismo sentido, pueden ser disjuntos, overlap total o parcial
        if (isPointInS2(s1.pi)) {
            //el s1.pi dentro de s2
            if (isPointInS2(s1.pf)) {
                //s1.pf también está dentro, ambos dentro, overlap completo de s2 a s1
                return { r: Cut.Overlapping, point1: s1.pi, point2: s1.pf, sameDirection: true }; //s1 entero dentro de s2
            } else {
                return { r: Cut.Overlapping, point1: s1.pi, point2: s2.pf, sameDirection: true }; //pf fuera y pi dentro, overlap cabeza de s2
            }
        } else {
            //s1.pi fuera, pero s1.pf podría estar dentro
            if (isPointInS2(s1.pf)) {
                //s1.pf está dentro y s1.pi fuera, overlap parcial
                return { r: Cut.Overlapping, point1: s2.pi, point2: s1.pf, sameDirection: true }; //pf dentro y pi fuera, overlap cola de s2
            } else {
                return { r: Cut.Overlapping, point1: s2.pi, point2: s2.pf, sameDirection: true }; //pf fuera y pi fuera, overlap completo de s1 a s2
            }
        }
    } else {
        //Aquí tienen sentidos opuestos, recordemos que los puntos se ordenan según s2
        if (isPointInS2(s1.pi)) {
            //el s1.pi dentro de s2
            if (isPointInS2(s1.pf)) {
                //s1.pf también está dentro, ambos dentro, overlap completo de s2 a s1
                return { r: Cut.Overlapping, point1: s1.pf, point2: s1.pi, sameDirection: false }; //s1 entero dentro de s2
            } else {
                return { r: Cut.Overlapping, point1: s2.pi, point2: s1.pi, sameDirection: false }; //pf fuera y pi dentro, overlap cola de s2
            }
        } else {
            //s1.pi fuera, pero s1.pf podría estar dentro
            if (isPointInS2(s1.pf)) {
                //s1.pf está dentro y s1.pi fuera, overlap parcial
                return { r: Cut.Overlapping, point1: s1.pf, point2: s2.pf, sameDirection: false }; //pf dentro y pi fuera, overlap cabeza de s2
            } else {
                return { r: Cut.Overlapping, point1: s2.pi, point2: s2.pf, sameDirection: false }; //pf fuera y pi fuera, overlap completo de s1 a s2
            }
        }
    }
}
