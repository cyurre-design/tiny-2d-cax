'use strict'
import {
    geometryPrecision,
    checkBbox,
    is_left_to_segment,
    is_left_or_equal_to_segment,
    fuzzy_eq,
    fuzzy_eq_point,
    blockClone,
    blockTranslate,
    blockRotate,
    blockScale,
    blockSymmetryX,
    blockSymmetryY,
    blockSymmetryL,
    blockReverse,
    blockLength,
    arc2PC2SVG,
    sqDistancePointToPoint,
} from '../cy-geometry-library.js'
import { createSegment } from './cy-segment.js'
import { createArc } from './cy-arc.js'
//los create deben garantizar que aquí llegan bien los parámetros

export function createPath(data = { elements: [] }) {
    const p = {
        type: 'path',
        elements: data.elements,
        get pi() {
            return p.elements[0].pi
        },
        get pf() {
            return p.elements[p.elements.length - 1].pf
        },
    }
    p.bbox = calculateBbox(p)
    return p
}
function calculateBbox(p) {
    return p.elements.reduce((box, el) => checkBbox(box, el.bbox), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity })
}

export function pathTranslate(p, dx, dy) {
    return createPath({ elements: p.elements.map((el) => blockTranslate(el, dx, dy)) })
}
export function pathRotate(p, x, y, alfa) {
    return createPath({ elements: p.elements.map((el) => blockRotate(el, x, y, alfa)) })
}
export function pathScale(p, x, y, scale) {
    return createPath({ elements: p.elements.map((el) => blockScale(el, x, y, scale)) })
}

export function pathClone(p) {
    return JSON.parse(JSON.stringify(p))
}
//versión light... no compruebo que están seguidos , se supone que se ha hecho un link en algún  momento
export function pathIsClosed(p) {
    return fuzzy_eq_point(p.elements[0].pi, p.elements[p.elements.length - 1].pf)
}
/**
 * @todo
 * @param {*} p
 * @returns
 */
// export function pathIsClosed(p) {
// let elements = p.elements.filter(e => ((e.type === "segment") || (e.type === "arc")));
// //Si está cerrado, deben sucederse los elementos
// let pi = elements.map(el => el.pi);
// let pf = elements.map(el => el.pf);
// pi.push(pi.shift());
// return pi.every((el, ix) => (distancePointToPoint(el.x, el.y, pf[ix].x, pf[ix].y)) <= geometryPrecision);
// }
export function pathSymmetryX(p, y) {
    return createPath({ elements: p.elements.map((el) => blockSymmetryX(el, y)) })
}
export function pathSymmetryY(p, x) {
    return createPath({ elements: p.elements.map((el) => blockSymmetryY(el, x)) })
}
export function pathSymmetryL(p, s) {
    return createPath({ elements: p.elements.map((el) => blockSymmetryL(el, s)) })
}
export function pathReverse(p) {
    const els = p.elements.map((e) => blockReverse(e))
    els.reverse() //Modifica els in place
    return createPath({ elements: els })
}
export function pathLength(path) {
    let len = 0
    if (path.elements.length === 0) return len
    len = path.elements.reduce((len, shape) => len + blockLength(shape), 0)
    return len
}
// Le he preguntado a chatGPT ... que se lo sabe todo
// Using the shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula) modified to
// See https://en.wikipedia.org/wiki/Circular_segment
// YURRE: Uso la fórmula de segmento de circulo de wikipedia area del segmento = 0.5 * r * r * (tita - sin(tita))
// que se corresponde con la resta entre el qusito y el triángulo
// YURRE: TODO probar más exhaustivamente
//Dejo la inicialización de variabkes locales como las pasa, queda bien
export function pathArea(path) {
    let A = 0
    if (!pathIsClosed(path)) return 0
    for (const e of path.elements) {
        if (e.type === 'segment') {
            const { x0, y0, x1, y1 } = e
            A += x0 * y1 - x1 * y0
            continue
        }
        if (e.type === 'arc') {
            const { x1, y1, x2, y2, r, da } = e
            // Triángulo (nutriente poligonal)
            A += x1 * y2 - x2 * y1
            // Área del arco (sector - triángulo)
            // da ya es signed sweep angle
            A += r * r * (da - Math.sin(da))
            continue
        }
        console.warn('Elemento desconocido:', e)
    }
    return A / 2 // signo define orientación
}
// La orientación servirá para definir cajera o isla pero tambén el signo de recorrido en laser
export function pathOrientation(path) {
    if (!pathIsClosed(path)) return 'open'
    return pathArea(path) < 0 ? 'clock' : 'antiClock'
}
//Se usa de forma interactiva, miramos si el punto está cerca de un vértice
//Como están empalmados, solo miro el inicial
//ATTON, No toco el original en la función, eso queda para la aplicación, si quiere
export function pathSetStartPoint(path, point) {
    const startIx = path.elements.findIndex((el) => fuzzy_eq_point(point, el.pi))
    if (startIx === -1) return path //lo deja como está
    //Aquí hay que ordenarlo pero sin cambiar el sentido, de hecho no cambia el bbox ni nada
    return createPath({ elements: path.elements.slice(startIx).concat(path.elements.slice(0, startIx)) })
}

//YURRE: NO modifico el original, clono o rehago lo que haga falta
//blocks es un shallow copy, por eso clono por siacaso. Por otra parte controlo que "actual" sea siempre clonado
// Hay que incluir el caso de solape en el punto inicial (last = first)
export function pathRemoveRedundant(path, options = { pos_equal_eps: geometryPrecision, invert_area: false }) {
    let eps = options.pos_equal_eps
    //quito los elementos de l=0
    let blocks = path.elements.filter((block) => !fuzzy_eq_point(block.pi, block.pf, eps))
    let newBlocks = []
    if (blocks.length < 2) {
        //devuelvo por si acaso... pero no debería pasar?!
        if (blocks.length > 0) newBlocks.push(blockClone(blocks[0])) //después de filtrar solo ha quedado 0 o 1
        return createPath({ elements: newBlocks })
    }
    let actual = blockClone(blocks.shift()) //cojo el primero
    // actual, newBlocks, etc... son globales en el scope de la función que sigue
    function notCollapsable(el) {
        //esto elimina muchas combinaciones, si pasa el test hay posibile empalme por ser dos elementos iguales y contiguos
        if (el.type !== actual.type || !fuzzy_eq_point(el.pi, actual.pf, eps)) return true //no colapsa
        //O son ambos segment o ambos arc
        if (actual.type === 'segment') {
            // Aquí ya sé que están seguidos porque no ha salido por el fuzzy anterior, miro si son colineales
            if (fuzzy_eq(el.ux, actual.ux, eps) && fuzzy_eq(el.uy, actual.uy, eps)) {
                //misma recta y empalman (ux uy ya llevan sentido), el change está a false por defecto
                actual = createSegment({ subType: 'PP', x0: actual.pi.x, y0: actual.pi.y, x1: el.pf.x, y1: el.pf.y }) //y sigo
                return false
            }
            return true
        }
        // aquí son ambos arcos, empalme posible y ya he mirado que están seguidos pero falta radio, etc
        // YURRE:?can only combine vertexes if total sweep will still be less than PI () Pero no divide el arco en tramos, creo...)
        // Creo que es por cómo furrula autocad, no creo que haya problema en arcos grandes, @todo
        if (fuzzy_eq(el.cx, actual.cx, eps) && fuzzy_eq(el.cy, actual.cy, eps) && fuzzy_eq(el.r, actual.r, eps) && el.way === actual.way) {
            //Como están orientados igual miro la suma de ángulos. En ambos pathways importa que el absoluto no pase de pi??
            //if( Math.abs (actual.da + el.da) < Math.PI + eps/actual.r){
            actual = createArc(arc2PC2SVG({ x: el.cx, y: el.cy }, el.r, actual.pi, el.pf, el.way))
            return false
            //}
        }
        return true
    }
    //Aquí en blocks ya no está el primero, que es actual porque hemos hecho shift
    blocks.forEach((el) => {
        if (notCollapsable(el) === true) {
            newBlocks.push(actual)
            actual = blockClone(el)
            //onArc = isArc(actual);
        }
    })
    //en actual está lo último acumulado, o el último, sin más, pero podría juntarse con el primero...
    //pero puede que newBlocks esté vacío por haberse colapsado todo en uno
    if (pathIsClosed(path) && newBlocks.length > 0) {
        if (notCollapsable(newBlocks[0]) === false) {
            //La función notCollapsable NO es pura, machaca actual si colapsa
            newBlocks.splice(0, 1, actual) //sustituyo el primero por el colapsado y tengo que salir
            return createPath({ elements: newBlocks })
        }
    }
    //caso normal, no es cerrado o no empalma
    newBlocks.push(actual)
    return createPath({ elements: newBlocks })
}
/// Calculate the winding number for a `point` relative to the polyline.
///
/// The winding number calculates the number of turns/windings around a point that the polyline
/// path makes. For a closed polyline without self intersects there are only three
/// possibilities:
///
/// * -1 (polyline winds around point clockwise)
/// * 0 (point is outside the polyline)
/// * 1 (polyline winds around the point counter clockwise).
///
/// For a self intersecting closed polyline the winding number may be less than -1 (if the
/// polyline winds around the point more than once in the counter clockwise direction) or
/// greater than 1 (if the polyline winds around the point more than once in the clockwise
/// direction).
///
/// This function always returns 0 if polyline [PlineSource::is_closed] is false.
///
/// If the point lies directly on top of one of the polyline segments the result is not defined
/// (it may return any integer). To handle the case of the point lying directly on the polyline
/// [PlineSource::closest_point] may be used to check if the distance from the point to the
/// polyline is zero.
///

export function pathWindingNumber(path, point) {
    if (!pathIsClosed(path) || path.elements.length < 2) {
        return 0
    }

    // Helper function for processing a line segment when computing the winding number.
    let process_line_winding = (segment, point) => {
        let result = 0
        if (point.y >= segment.pi.y) {
            if (point.y < segment.pf.y && is_left_to_segment(segment, point))
                // left and upward crossing
                result += 1
        } else if (point.y >= segment.pf.y && !is_left_to_segment(segment, point))
            // right an downward crossing
            result -= 1
        return result
    }

    // Helper function for processing an arc segment when computing the winding number.
    let process_arc_winding = (arc, point) => {
        let is_antiClock = arc.pathway === 1
        let point_is_left = is_antiClock ? is_left_to_segment(arc, point) : is_left_or_equal_to_segment(arc, point)
        let insideCircle = sqDistancePointToPoint(arc.x, arc.y, point.x, point.y) < arc.r * arc.r
        let result = 0

        if (arc.pi.y <= point.y) {
            if (arc.pf.y > point.y) {
                // upward crossing of arc chord
                if (is_antiClock) {
                    if (point_is_left) {
                        // counter clockwise arc left of chord
                        result += 1
                    } else {
                        // counter clockwise arc right of chord
                        if (insideCircle) {
                            result += 1
                        }
                    }
                } else if (point_is_left) {
                    // clockwise arc left of chord
                    if (!insideCircle) {
                        result += 1
                    }
                    // else clockwise arc right of chord, no crossing
                }
            } else {
                // not crossing arc chord and chord is below, check if point is inside arc sector
                if (is_antiClock && !point_is_left && arc.pf.x < point.x && point.x < arc.pi.x && insideCircle) {
                    result += 1
                } else if (!is_antiClock && point_is_left && arc.pi.x < point.x && point.x < arc.pf.x && insideCircle) {
                    result -= 1
                }
            }
        } else if (arc.pf.y <= point.y) {
            // downward crossing of arc chord
            if (is_antiClock) {
                if (!point_is_left) {
                    // counter clockwise arc right of chord
                    if (!insideCircle) {
                        result -= 1
                    }
                }
                // else counter clockwise arc left of chord, no crossing
            } else if (point_is_left) {
                // clockwise arc left of chord
                if (insideCircle) {
                    result -= 1
                }
            } else {
                // clockwise arc right of chord
                result -= 1
            }
        } else {
            // not crossing arc chord and chord is above, check if point is inside arc sector
            if (is_antiClock && !point_is_left && arc.pi.x < point.x && point.x < arc.pf.x && insideCircle) {
                result += 1
            } else if (!is_antiClock && point_is_left && arc.pf.x < point.x && point.x < arc.pi.x && insideCircle) {
                result -= 1
            }
        }

        return result
    }

    //let winding = 0;
    let winding = path.elements.reduce(
        (winding, el) => winding + (el.type === 'segment' ? process_line_winding(el, point) : process_arc_winding(el, point)),
        0,
    )
    return winding
}
//métodos exclusivos de path
// export function pathConcat(p1, p2) { //de fin de this a comienzo de path
//         return p1.elements.concat(p2.elements);
//     }
// export function pathAddElements(p, elements){
//         p.elements = p.elements.concat(elements);
//     }
// export function pathClosestEnd(p, point) {
//         if (p.elements[0].type === 'circle') {
//             return Infinity; //estos no forman parte de otros paths
//         }
//         let delta1 = sqDistancePointToPoint(point.x, point.y, p.elements[0].pi.x, p.elements[0].pi.y);
//         let delta2 = sqDistancePointToPoint(point.x, point.y, p.elements[p.elements.length - 1].pf.x, p.elements[p.elements.length - 1].pf.y);
//         return (delta1 <= delta2) ? {d: delta1, end: 0}: {d: delta2, end: 1};
//     }
