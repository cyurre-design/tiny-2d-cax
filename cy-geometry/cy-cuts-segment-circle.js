
import { geometryPrecision, fuzzy_eq, fuzzy_eq_point, fuzzy_eq_zero, sqDistancePointToPoint} from "./cy-geometry-library.js"
//import {BArc, BSegment} from "./cy-geometry-extended-elements.js"
import {Cut} from "./cy-cut-types.js";
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

 
/// YURRE: Manteniendo el código original pero adaptando a las clases
/// YURRE: Cambio el retorno de la función a puntos en vez de parámetro, al final resulta más sencillo
/// pero el comentario de t es erróneo, lo mantengo por referencia
/// Finds the intersects between a line segment and a circle.
///
/// This function returns the parametric solution(s) for the line segment equation
/// `P(t) = p0 + t * (p1 - p0)` for `t = 0` to `t = 1`. If `t < 0` or `t > 1` then intersect occurs
/// only when extending the segment out past the points `p0` and `p1` given.
/// If `t < 0` then the intersect is nearest to `p0`, if `t > 1.0` then the intersect is
/// nearest to `p1`. Intersects are "sticky" and "snap" to tangent points using fuzzy comparisons,
/// e.g. a segment very close to being tangent line will return a single intersect point.
///


/// YURRE: Cambio completamente y devuelvo este segment_arc_intr, que es más simétrico con el segment_cuts_segment
// Aprovecho el conocimiento de arco y segmento para desechar soluciones

export function segment_arc_intr(segment, arc, eps = geometryPrecision) {

    // if((! arc instanceof BArc) || (! segment instanceof BSegment))
    //      console.log('me paso morralla')

    // This function solves for t by solving for cartesian intersect points via geometric
    // equations with the circle centered at (0, 0). Using the line equation of the form
    // Ax + By + C = 0 (taken from p1 and p0 shifted to the origin) and comparing with the circle
    // radius. The x, y cartesian points are then converted to parametric t representation using
    // p0 and p1.
    // This approach was found to be more numerically stable than solving for t using the quadratic
    // equations.
    //YURRE: Adapto a la nomenclatura nueva de las clases, aunque pi y pf ya existen como getters
    let dx = segment.pf.x - segment.pi.x;
    let dy = segment.pf.y - segment.pi.y;
    let h = arc.cx;
    let k = arc.cy;

    //let eps = epsilon;
    //Caso degenerado, l es de longitud nula
    if (fuzzy_eq_point(segment.pi, segment.pf, eps)) {  // pi == pf, test if point is on the circle, using average of the points x and y values for fuzziness
        let xh = (segment.pi.x + segment.pf.x) / 2 - h;
        let yk = (segment.pi.y + segment.pf.y) / 2 - k;
        if(fuzzy_eq(xh * xh + yk * yk, arc.r * arc.r, eps)) {
            return {r:Cut.TangentIntersect, point: segment.pi };
        }
        return {r:Cut.NoIntersect};
    }
    //traslado coordenadas a centro del circulo
    let pi_shifted = {x: segment.pi.x - arc.cx, y: segment.pi.y - arc.cy};
    let pf_shifted = {x: segment.pf.x - arc.cx, y: segment.pf.y - arc.cy};

    // note: using Real number's defined epsilon for this check since it's just avoiding division by
    // too small a number, using the epsilon passed into this function causes unneeded loss of
    // precision (this branch is not directly determining the intersect result case returned)
    let a, b, c;
    if(fuzzy_eq_zero(dx, eps)) {    // vertical line, using average of point x values for fuzziness
        let x_pos = (pf_shifted.x + pi_shifted.x) / 2;
        // x = x_pos;   =>  x - x_pos = 0   =>  A = 1, B = 0, C = -x_pos
        a = 1.0; b=0.0; c = -x_pos;
    } else { // caso normal, YURRE: creo que tendríamos los datos en nuestra clase, pero mantengo riginal
        // (y - y1) = m(x - x1)     =>    y - y1 = mx - mx1 =>  mx - y + y1 - mx1 = 0
        // A = -m   ,   B = 1.0,    C = -y1 + m*x1, m = (y1 - y0) / (x1 - x0)
        let m = dy / dx;
        a = m; b = -1.0, c = pf_shifted.y - m * pf_shifted.x;
    };

    let a2 = a * a;
    let b2 = b * b;
    let c2 = c * c;
    let r2 = arc.r * arc.r;
    let a2_b2 = a2 + b2;

    // shortest distance from point on line to origin
    let shortest_dist = Math.abs(c) / Math.sqrt(a2_b2);
    if (shortest_dist > arc.r + eps) {
        return {r:Cut.NoIntersect};
    }
    // adding h and k back to solution terms (shifting from origin back to real coordinates)
    let x0 = -a * c / a2_b2 + h;
    let y0 = -b * c / a2_b2 + k;
    //Miramos si son soluciones de verdad. Si están en el segmento Y en el arco.
    //Puesto que son soluciones de la ecuación, la distancia al centro no hay que chequearla, pero el ángulo sí.

    const pointOnSegment = (segment, p) => {
        let smp = {x:0.5*(segment.pi.x+segment.pf.x), y:0.5*(segment.pi.y+segment.pf.y)};
        return sqDistancePointToPoint(p.x, p.y, smp.x, smp.y ) <= 0.25*segment.d*segment.d + eps;
    }
    const point_lies_on_arc_and_segment = (pt, t2) => {
        if( !pointOnSegment(segment,pt) ) return false;
        if(arc.type==='circle') return true;    //Por usar la misma rutina 
        return pointWithinArcSweep( arc, pt, eps); //esto yatá por definición && fuzzy_eq(distancePointToPoint(pt.x, pt.y, arc.x, arc.y), arc.r, eps)
    };
    if(fuzzy_eq(shortest_dist, arc.r, eps)) {
        let point =  {x: x0, y:y0}
        if( !pointOnSegment(segment,point) ) return {r:Cut.NoIntersect};
        if( !pointWithinArcSweep( arc, point, eps)) return {r:Cut.NoIntersect};
        return {r:Cut.TangentIntersect, point: point };
    }

    let d = r2 - c2 / a2_b2;
    // taking abs to avoid NaN in case of very very small negative number as input to sqrt
    let mult = Math.sqrt(Math.abs(d / a2_b2));
    let x_sol1 = x0 + b * mult;
    let x_sol2 = x0 - b * mult;
    let y_sol1 = y0 - a * mult;
    let y_sol2 = y0 + a * mult;

    let sqSol1 = sqDistancePointToPoint(x_sol1,y_sol1,segment.pi.x, segment.pi.y);
    let sqSol2 = sqDistancePointToPoint(x_sol2,y_sol2,segment.pi.x, segment.pi.y);
    
    let sol1 = { x: x_sol1, y: y_sol1};
    let sol2 = { x: x_sol2, y: y_sol2}; 
    let isInS1 = point_lies_on_arc_and_segment(sol1, sqSol1);
    let isInS2 = point_lies_on_arc_and_segment(sol2, sqSol2);
    if(!isInS1 && !isInS2) return ({r:Cut.NoIntersect});
    if(!isInS1 || !isInS2){
        let point = isInS1 ? sol1 : sol2;  //solo una, pero miro si coincide con pi o pf
        point = fuzzy_eq_point(segment.pi, point, eps)? segment.pi : fuzzy_eq_point(segment.pf, point, eps) ? segment.pf : point;
        return {r: Cut.OneIntersect, point: point}
    }
    [sol1, sol2] = (sqSol1 < sqSol2) ? [sol1, sol2] : [sol2, sol1] ; //ls sqSol igual ya no se corresponden
    sol1 = fuzzy_eq_point(segment.pi, sol1, eps)? segment.pi : fuzzy_eq_point(segment.pf, sol1, eps) ? segment.pf : sol1;
    sol2 = fuzzy_eq_point(segment.pi, sol2, eps)? segment.pi : fuzzy_eq_point(segment.pf, sol2, eps) ? segment.pf : sol2;
    return {r:Cut.TwoIntersects, point1: sol1, point2: sol2} ; 
}




            

