import {
    geometryPrecision,
    fuzzy_eq,
    fuzzy_eq_point,
    sqDistancePointToPoint,
    distancePointToSegment,
    cutSegmentToCircle,
    pointWithinArcSweep,
} from "./cy-geometry-library.js";
//import {BArc, BSegment} from "./cy-geometry-extended-elements.js"
import { Cut } from "./cy-cut-types.js";
import { segmentMidpoint } from "./cy-geo-elements/cy-segment.js";
//YURRE: He traido aquí la siguiente lógica
// Note if intersect is detected we check if the line segment starts or ends on the arc
// segment and if so then use that end point as the intersect point.
// Why: this avoids inconsistencies between segment intersects where a line may "overlap" an
// arc according to the fuzzy epsilon values (e.g., imagine the arc has a large radius and
// the line has two intersects but is almost tangent to the arc), in such a case the
// line-circle intersect function will return two solutions, one on either side of the end
// point, but the end point is an equally valid solution according to the fuzzy epsilon and
// ensures consistency with other intersects. E.g., if the end of the line segment is the
// start of an arc that overlaps with another arc then we want the overlap intersect end
// points to agree with the intersect returned from this function, to ensure this
// consistency we use the end point when valid to do so (end points are "sticky").

//YURRE : lo rehago entero con la librería antigua pero devolviendo los casos especiales y con epsilons

export function segment_arc_intr(segment, arc, eps = geometryPrecision) {
    //let eps = epsilon;
    //Caso degenerado, l es de longitud nula
    if (fuzzy_eq_point(segment.pi, segment.pf, eps)) {
        // pi == pf, test if point is on the circle, using average of the points x and y values for fuzziness
        const pm = segmentMidpoint(segment);
        if (!fuzzy_eq(Math.hypot(pm.x - arc.cx, pm.y - arc.cy), arc.r)) return { r: Cut.NoIntersect };
        if (pointWithinArcSweep(arc, pm)) return { r: Cut.TangentIntersect, point: segment.pi }; //o pm...
        return { r: Cut.NoIntersect };
    }
    const d = distancePointToSegment(arc.cx, arc.cy, segment);
    if (d > arc.r + eps) {
        return { r: Cut.NoIntersect };
    }
    //Tenemos un segmento no degenerado sobre una línea que corta o toca al circulo
    //Aquí ya llamo a la de librería, y chequeo tangencia a la vuelta, a comprobar
    const sols = cutSegmentToCircle(segment, arc);
    //Como la rutina es en realidad de linea infinita y circulo, pueden salir puntos fuera del segmento y del arco
    const smp = segmentMidpoint(segment);

    const pointOnArcAndSegment = (p) => {
        if (sqDistancePointToPoint(p.x, p.y, smp.x, smp.y) > 0.25 * segment.d * segment.d + eps) return false;
        if (arc.type === "circle") return true; //Por usar la misma rutina
        return pointWithinArcSweep(arc, p, eps); //esto yatá por definición && fuzzy_eq(distancePointToPoint(pt.x, pt.y, arc.x, arc.y), arc.r, eps)
    };
    if (sols.length === 1) sols.push(sols[0]); //Para que salga por tangencia, justo debajo, sin mucha morralaa
    if (fuzzy_eq_point(sols[0], sols[1])) {
        const midpoint = { x: 0.5 * (sols[0].x + sols[1].x), y: 0.5 * (sols[0].y + sols[1].y) };
        if (pointOnArcAndSegment(midpoint)) return { r: Cut.TangentIntersect, point: midpoint }; //lo de la mitad , pues bueno...
    }
    //Aquí tengo dos soluciones diferentes, no necesariamente dentro del arco y del segmento
    const valids = sols.filter((s) => pointOnArcAndSegment(s));
    if (valids.length === 1) {
        return { r: Cut.OneIntersect, point: valids[0] };
    } else if (valids.length === 2) {
        return { r: Cut.TwoIntersects, point1: valids[0], point2: valids[1] };
    } else return { r: Cut.NoIntersect };
}
