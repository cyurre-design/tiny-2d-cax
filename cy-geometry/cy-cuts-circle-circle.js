import { sqDistancePointToPoint, distancePointToPoint, pointWithinArcSweep } from './cy-geometry-library.js'
import { geometryPrecision, fuzzy_eq_zero, fuzzy_eq_point, fuzzy_eq, fuzzy_lt, fuzzy_gt, arc2PC2SVG } from './cy-geometry-library.js'
import { createArc } from './cy-geo-elements/cy-arc.js'
import { Cut } from './cy-cut-types.js'

//YURRE: Cambio de nomeclatura y poner nombres equivalentes a circle y arc
export function circle_circle_intr(c1, c2, pos_equal_eps = geometryPrecision) {
    let cv = { x: c2.cx - c1.cx, y: c2.cy - c1.cy }
    let d2 = sqDistancePointToPoint(c1.cx, c1.cy, c2.cx, c2.cy)
    let d = Math.sqrt(d2)

    if (fuzzy_eq_zero(d, pos_equal_eps)) {
        //mismo centro
        if (fuzzy_eq(c1.r, c2.r, pos_equal_eps)) {
            //mismo radio
            return { r: Cut.Overlapping }
        }
        return { r: Cut.NoIntersect } //concéntricos
    }

    // different center position
    if (
        !fuzzy_lt(d, c1.r + c2.r, pos_equal_eps) || //círculos disjuntos, d >= r1+r2
        !fuzzy_gt(d, Math.abs(c1.r - c2.r), pos_equal_eps)
    ) {
        //uno incluido en otro d < |r1-r2|
        return { r: Cut.NoIntersect }
    }
    //la recta que une los centros es cortada por la que une los puntos de intersección en el punto a
    //se tienen dos triángulos rectángulos de dimensiones r1,a,h y r2,d-a,h
    // h^2 = r1^2 - a^2 ,    h^2 = r2^2 - (d - a)^2 = r2^2 - d^2 - a^2 + 2ad
    //  2ad = r1^2 - r2^2 + a^2
    let sqR1 = c1.r * c1.r
    let a = (sqR1 - c2.r * c2.r + d2) / (2 * d)
    let midpoint = { x: c1.cx + (a * cv.x) / d, y: c1.cy + (a * cv.y) / d } //NO es el punto medio, salvo mismo radio
    let h2 = sqR1 - a * a //h sería la altura , si es 0 son tangentes....
    //TODO, comparar con epsilon?
    if (h2 < 0) {
        return { r: Cut.TangentIntersect, point: midpoint }
    }

    let h = Math.sqrt(h2)
    let h_over_d = h / d
    let x_term = h_over_d * cv.y //pendientes cruzadas, la normal a la recta que une los centros
    let y_term = h_over_d * cv.x

    let pt1 = { x: midpoint.x + x_term, y: midpoint.y - y_term }
    let pt2 = { x: midpoint.x - x_term, y: midpoint.y + y_term }

    if (fuzzy_eq_point(pt1, pt2, pos_equal_eps)) {
        return { r: Cut.TangentIntersect, point: pt1 }
    }

    return { r: Cut.TwoIntersects, point1: pt1, point2: pt2 }
}

export function arc_arc_intr(a1, a2, pos_equal_eps = geometryPrecision) {
    // helper function to test if a point lies on arc1 segment
    const point_lies_on_arc1 = (pt) => {
        return pointWithinArcSweep(a1, pt, pos_equal_eps) && fuzzy_eq(distancePointToPoint(pt.x, pt.y, a1.x, a1.y), a1.r, pos_equal_eps)
    }
    // helper function to test if a point lies on arc2 segment
    const point_lies_on_arc2 = (pt) => {
        return pointWithinArcSweep(a2, pt, pos_equal_eps) && fuzzy_eq(distancePointToPoint(pt.x, pt.y, a2.x, a2.y), a2.r, pos_equal_eps)
    }
    const both_arcs_sweep_point = (pt) => {
        return pointWithinArcSweep(a1, pt, pos_equal_eps) && pointWithinArcSweep(a2, pt, pos_equal_eps)
    }
    let intr_result = circle_circle_intr(a1, a2, pos_equal_eps)
    //YURRE: Esto merece un repaso posteriormente, pero uso la misma estructura en la devolución
    switch (intr_result.r) {
        case Cut.NoIntersect:
            return intr_result
        case Cut.TangentIntersect: {
            // first check if end points lie on arcs and substitute with end point if so to be
            // consistent with stickiness to end points done in other cases (e.g., line-arc intersect)
            if (point_lies_on_arc1(a2.pi)) {
                intr_result.point = a2.pi
            } else if (point_lies_on_arc1(a2.pf)) {
                intr_result.point = a2.pf
            } else if (point_lies_on_arc2(a1.pi)) {
                intr_result.point = a1.pi
            } else if (point_lies_on_arc2(a1.pf)) {
                intr_result.point = a1.pf
            } else if (both_arcs_sweep_point(intr_result.point)) {
                /*intr_result.point = intr_result.point;*/
            } //Ya viene como queremos
            else intr_result.r = Cut.NoIntersect
            return intr_result
        }
        case Cut.TwoIntersects: {
            // determine if end points lie on arcs and substitute with end points if so to be
            // consistent with stickiness to end points done in other cases (e.g., line-arc intersect)
            //YURRE: Código original complejo. Al final, queremos que, si el punto de corte casi coincide con un extremo de arco
            //quedarnos con el punto inicial o final del arco. El caso extremo es que ambos arcos tengan puntos coincidentes,
            // ej, dos semicircunferencias . Lo cambio todo, igual es menos óptimo pero no creo
            const stickToArc = (point) => {
                if (fuzzy_eq_point(point, a2.pi)) return a2.pi
                else if (fuzzy_eq_point(point, a2.pf)) return a2.pf
                else if (fuzzy_eq_point(point, a1.pi)) return a1.pi
                else if (fuzzy_eq_point(point, a1.pf)) return a1.pf
                else return point
            }
            //Primero hago ambos puntos de corte sticky y luego miro si son de corte de verdad
            //De esa manera ya no tengo que mirar en cada caso
            //TODO: Comprobar que, efectivamente, los puntos sticky funcionana en el both_arcs_sweep_point1/2 !!!
            let pt1 = stickToArc(intr_result.point1)
            let pt2 = stickToArc(intr_result.point2)
            let pt1_in_sweep = both_arcs_sweep_point(pt1) //el point1 es corte de verdad
            let pt2_in_sweep = both_arcs_sweep_point(pt2) //el point2 es corte de verdad
            if (pt1_in_sweep && pt2_in_sweep) {
                //En principio se ordenan según distancia al comienzo de a2...no sé si luego vale para nada...
                ;[pt1, pt2] =
                    sqDistancePointToPoint(a2.pi.x, a2.pi.y, pt1.x, pt1.y) < sqDistancePointToPoint(a2.pi.x, a2.pi.y, pt2.x, pt2.y)
                        ? [pt1, pt2]
                        : [pt2, pt1]
                return { r: Cut.TwoIntersects, point1: pt1, point2: pt2 }
            } else if (pt1_in_sweep) {
                return { r: Cut.OneIntersect, point: pt1 }
            } else if (pt2_in_sweep) {
                return { r: Cut.OneIntersect, point: pt2 }
            } else return { r: Cut.NoIntersect }
        }
        case Cut.Overlapping: {
            // determine if arcs overlap along their sweep
            //YURRE: si los way no son iguales cambio el 2 para simplificar
            let same_direction_arcs = a1.pathway === a2.pathway
            //Atton. hay que pasar el way en ascii porque si no se cree que pasamos los ángulos... :(
            let w = same_direction_arcs
                ? a2
                : createArc(arc2PC2SVG({ x: a2.cx, y: a2.y }, a2.r, a2.pf, a2.pi, a2.pathway === 'antiClock' ? 'clock' : 'antiClock')) //dado vuelta
            //YURRE: v y w tienen la misma dirección

            // check if only end points touch (because we made arc sweeps go same direction we
            //YURRE: Paso el match a if, estos son las distancias (en 'mm') entre extremos alternativos
            //Uso nuestras estructuras para ver si está uno seguido del otro
            const a = fuzzy_eq_point(a1.pi, w.pf, pos_equal_eps)
            const b = fuzzy_eq_point(w.pi, a1.pf, pos_equal_eps)
            if (a && b)
                // two half circle arcs with end points touching (cada uno le sigue al otro)
                // note: point1 and point2 are returned in order according to second segment (u1->u2) direction ????
                return { r: Cut.TwoIntersects, point1: a2.pi, point2: a2.pf }
            else if (a && !b) {
                return { r: Cut.OneIntersect, point: a1.pi }
            } else if (!a && b) return { r: Cut.OneIntersect, point: w.pi }
            else {
                // not just the end points touch, determine how the arcs overlap point_lies_on_arc1
                let arc2_starts_in_arc1 = point_lies_on_arc1(a2.pi)
                let arc2_ends_in_arc1 = point_lies_on_arc1(a2.pf)
                if (arc2_starts_in_arc1 && arc2_ends_in_arc1) {
                    // arc2 is fully overlapped by arc1
                    return {
                        r: Cut.OverlappingArcs,
                        point1: { x: a2.pi.x, y: a2.pi.y },
                        point2: { x: a2.pf.x, y: a2.pf.y },
                        sameDirection: same_direction_arcs,
                    }
                } else if (arc2_starts_in_arc1) {
                    // check if direction reversed to ensure the correct points are used
                    // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                    return same_direction_arcs
                        ? { r: Cut.OverlappingArcs, point1: { x: a2.pi.x, y: a2.pi.y }, point2: { x: a1.pf.x, y: a1.pf.y }, sameDirection: true }
                        : { r: Cut.OverlappingArcs, point1: { x: a2.pi.x, y: a2.pi.y }, point2: { x: a1.pi.x, y: a1.pi.y }, sameDirection: false }
                } else if (arc2_ends_in_arc1) {
                    // check if direction reversed to ensure the correct points are used
                    // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                    return same_direction_arcs
                        ? { r: Cut.OverlappingArcs, point1: { x: a1.pi.x, y: a1.pi.y }, point2: { x: a2.pf.x, y: a2.pf.y }, sameDirection: true }
                        : { r: Cut.OverlappingArcs, point1: { x: a1.pf.x, y: a1.pf.y }, point2: { x: a2.pf.x, y: a2.pf.y }, sameDirection: false }
                } else {
                    let arc1_starts_in_arc2 = point_lies_on_arc2(a1.pi)
                    if (arc1_starts_in_arc2) {
                        // arc1 is fully overlapped by arc2
                        // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                        return same_direction_arcs
                            ? { r: Cut.OverlappingArcs, point1: { x: a1.pi.x, y: a1.pi.y }, point2: { x: a1.pf.x, y: a1.pf.y }, sameDirection: true }
                            : { r: Cut.OverlappingArcs, point1: { x: a1.pf.x, y: a1.pf.y }, point2: { x: a1.pi.x, y: a1.pi.y }, sameDirection: false }
                    } else {
                        return { r: Cut.NoIntersect }
                    }
                }
            }
        }
    }
}

//Simplificación en el caso de circle con arc
export function circle_arc_intr(c, a2, pos_equal_eps = geometryPrecision) {
    // helper function to test if a point lies on arc1 segment
    const point_lies_on_circle = (pt) => {
        return fuzzy_eq(distancePointToPoint(pt.x, pt.y, c.cx, c.cy), c.r, pos_equal_eps)
    }
    // YURRE: las soluciones ya deben garantizar que la distancia al centro es r, creo yo
    // const point_lies_on_arc2 = (pt) => {
    //     return( a2.pointWithinArcSweep(pt, pos_equal_eps)) //  && fuzzy_eq( distancePointToPoint(pt.x, pt.y, a2.x, a2.y), a2.r, pos_equal_eps))
    //     };
    //Solo hay que mirar el arco, no el circulo
    // const both_arcs_sweep_point = (pt) => {
    //     return( a2.pointWithinArcSweep( pt, pos_equal_eps ))// && a2.pointWithinArcSweep(  pt, pos_equal_eps ));
    // }
    let intr_result = circle_circle_intr(c, a2, pos_equal_eps)
    //YURRE: Esto merece un repaso posteriormente, pero uso la misma estructura en la devolución
    switch (intr_result.r) {
        case Cut.NoIntersect:
            return intr_result
        case Cut.TangentIntersect: {
            //caso de 1 solo punto de corte, circulos tangentes, ver si está en el arco
            // first check if end points lie on arcs and substitute with end point if so to be
            // consistent with stickiness to end points done in other cases (e.g., line-arc intersect)
            //Si el punto inicial o final están en la cirunferencia, devolvemos el original
            if (point_lies_on_circle(a2.pi)) {
                intr_result.point = a2.pi
            } else if (point_lies_on_circle(a2.pf)) {
                intr_result.point = a2.pf
            }
            //if (point_lies_on_arc2(a1.pi)) {  intr_result.point = a1.pi; }
            //else if (point_lies_on_arc2(a1.pf)) {  intr_result.point = a1.pf; }
            //else if (both_arcs_sweep_point(intr_result.point)) {/*intr_result.point = intr_result.point;*/ } //Ya viene como queremos
            //else intr_result.r = Cut.NoIntersect;
            if (!pointWithinArcSweep(a2, intr_result.point, pos_equal_eps)) intr_result.r = Cut.NoIntersect
            return intr_result //Caso normal, se devuelve el punto de tangencia
        }
        case Cut.TwoIntersects: {
            // determine if end points lie on arcs and substitute with end points if so to be
            // consistent with stickiness to end points done in other cases (e.g., line-arc intersect)
            //YURRE: Código original complejo. Al final, queremos que, si el punto de corte casi coincide con un extremo de arco
            //quedarnos con el punto inicial o final del arco. El caso extremo es que ambos arcos tengan puntos coincidentes,
            // ej, dos semicircunferencias . Lo cambio todo, igual es menos óptimo pero no creo
            //YURRE: para el caso de circulo sólo tengo que mirar los extremos del arco
            const stickToArc = (point) => {
                if (fuzzy_eq_point(point, a2.pi)) return a2.pi
                else if (fuzzy_eq_point(point, a2.pf)) return a2.pf
                //else  if(fuzzy_eq_point(point, a1.pi)) return a1.pi;
                //else  if(fuzzy_eq_point(point, a1.pf)) return a1.pf;
                else return point
            }
            //Primero hago ambos puntos de corte sticky y luego miro si son de corte de verdad
            //De esa manera ya no tengo que mirar en cada caso
            //TODO: Comprobar que, efectivamente, los puntos sticky funcionana en el both_arcs_sweep_point1/2 !!!
            let pt1 = stickToArc(intr_result.point1)
            let pt2 = stickToArc(intr_result.point2)
            let pt1_in_sweep = pointWithinArcSweep(a2, pt1, pos_equal_eps) //el point1 es corte de verdad
            let pt2_in_sweep = pointWithinArcSweep(a2, pt2, pos_equal_eps) //el point2 es corte de verdad
            if (pt1_in_sweep && pt2_in_sweep) {
                //En principio se ordenan según distancia al comienzo de a2...no sé si luego vale para nada...
                ;[pt1, pt2] =
                    sqDistancePointToPoint(a2.pi.x, a2.pi.y, pt1.x, pt1.y) < sqDistancePointToPoint(a2.pi.x, a2.pi.y, pt2.x, pt2.y)
                        ? [pt1, pt2]
                        : [pt2, pt1]
                return { r: Cut.TwoIntersects, point1: pt1, point2: pt2 }
            } else if (pt1_in_sweep) {
                return { r: Cut.OneIntersect, point: pt1 }
            } else if (pt2_in_sweep) {
                return { r: Cut.OneIntersect, point: pt2 }
            } else return { r: Cut.NoIntersect }
        }
        case Cut.Overlapping: {
            //YURRE: Decisión provisional, Puesto que el caso circle-arc es solo en modo "cad", en overlapping devuelvo
            //noIntersect. Los casos de "cam" son siempre arcos y no debería pasar por aquí
            // determine if arcs overlap along their sweep
            return { r: Cut.NoIntersect }
            /*            //YURRE: si los way no son iguales cambio el 2 para simplificar
            let same_direction_arcs = a1.pathway === a2.pathway;
            //Atton. hay que pasar el way en ascii porque si no se cree que pasamos los ángulos... :(
            let w = (same_direction_arcs)? a2 : new BArc( a2.x, a2.y, a2.r, a2.pf, a2.pi, a2.pathway===1?'clock':'antiClock' ) ; //dado vuelta
            //YURRE: v y w tienen la misma dirección

            // check if only end points touch (because we made arc sweeps go same direction we
            //YURRE: Paso el match a if, estos son las distancias (en 'mm') entre extremos alternativos
            //Uso nuestras estructuras para ver si está uno seguido del otro
            const a = fuzzy_eq_point( a1.pi, w.pf, pos_equal_eps);
            const b = fuzzy_eq_point( w.pi, a1.pf, pos_equal_eps);
            if( a && b)           // two half circle arcs with end points touching (cada uno le sigue al otro)
                // note: point1 and point2 are returned in order according to second segment (u1->u2) direction ????
                return {r:Cut.TwoIntersects, point1: a2.pi, point2: a2.pf};
            else if ( a && !b) { 
                return {r:Cut.OneIntersect, point : a1.pi};
            }
            else if ( !a && b)
                return {r:Cut.OneIntersect, point : w.pi}
            else { // not just the end points touch, determine how the arcs overlap point_lies_on_arc1
                let arc2_starts_in_arc1 =   point_lies_on_arc1(a2.pi);
                let arc2_ends_in_arc1 =     point_lies_on_arc1(a2.pf);
                if (arc2_starts_in_arc1 && arc2_ends_in_arc1) {
                    // arc2 is fully overlapped by arc1
                    return {r:Cut.OverlappingArcs, point1: {x:a2.pi.x, y:a2.pi.y}, point2: {x:a2.pf.x, y:a2.pf.y}, sameDirection:same_direction_arcs}
                } else if (arc2_starts_in_arc1) {
                    // check if direction reversed to ensure the correct points are used
                    // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                    return same_direction_arcs ?
                        {r:Cut.OverlappingArcs, point1: {x:a2.pi.x, y:a2.pi.y}, point2: {x:a1.pf.x, y:a1.pf.y}, sameDirection: true} :
                        {r:Cut.OverlappingArcs, point1: {x:a2.pi.x, y:a2.pi.y}, point2: {x:a1.pi.x, y:a1.pi.y}, sameDirection: false} 
                }  else if (arc2_ends_in_arc1) {
                    // check if direction reversed to ensure the correct points are used
                    // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                    return same_direction_arcs ?
                        {r:Cut.OverlappingArcs, point1: {x:a1.pi.x, y:a1.pi.y}, point2: {x:a2.pf.x, y:a2.pf.y}, sameDirection: true} :
                        {r:Cut.OverlappingArcs, point1: {x:a1.pf.x, y:a1.pf.y}, point2: {x:a2.pf.x, y:a2.pf.y}, sameDirection: false}
                } else {
                    let arc1_starts_in_arc2 = point_lies_on_arc2(a1.pi);
                    if (arc1_starts_in_arc2) {
                        // arc1 is fully overlapped by arc2
                        // note: point1 and point2 are returned in order according to second segment (u1->u2) direction
                        return same_direction_arcs ?
                            {r:Cut.OverlappingArcs, point1: {x:a1.pi.x, y:a1.pi.y}, point2: {x:a1.pf.x, y:a1.pf.y}, sameDirection: true} :
                            {r:Cut.OverlappingArcs, point1: {x:a1.pf.x, y:a1.pf.y}, point2: {x:a1.pi.x, y:a1.pi.y}, sameDirection: false}
                    } else {
                        return {r:Cut.NoIntersect}
                    }
                }      */
        }
    }
}
