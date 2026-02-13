//YURRE: Traducción LIBRE, paso las polylíneas a paths...
//De forma general una polilínea podría tener vértices repes?

import { geometryPrecision, fuzzy_eq_point, blockSplitAtPoints, blockLengthFromStart } from "./cy-geometry-library.js";
import { Cut } from "./cy-cut-types.js";
import { arc_arc_intr } from "./cy-cuts-circle-circle.js";
import { segment_arc_intr } from "./cy-cuts-segment-circle.js";
import { line_line_intr } from "./cy-cuts-segment-segment.js";
import { pathIsClosed } from "./cy-geo-elements/cy-path.js";

// Cortes entre dos paths, cada path tiene una serie de blocks (segmentos y arcos)
// Se devuelve información importante de cada corte, como los shapes que se cortan, los paths a los que pertenecen,
//  el punto de corte, etc... para facilitar el tratamiento posterior
export function path_seg_intr(v, u, pos_equal_eps = geometryPrecision) {
    let v_is_line = v.type === "segment";
    let u_is_line = u.type === "segment";

    if (v_is_line && u_is_line) {
        // u is line, v is line
        let intr_result = line_line_intr(v, u, pos_equal_eps);
        switch (intr_result.r) {
            case Cut.NoIntersect:
            case Cut.FalseIntersect:
                return { r: Cut.NoIntersect };
            case Cut.TrueIntersect:
                return { r: Cut.OneIntersect, point: intr_result.point };
            case Cut.Overlapping:
                return { r: Cut.OverlappingLines, point1: intr_result.point1, point2: intr_result.point2, sameDirection: intr_result.sameDirection };
        }
    }
    if (v_is_line) {
        // v is segment, u is arc, es lo que espera la rutina pero vuelven ordenados según el segmento (u)
        let res = segment_arc_intr(v, u, pos_equal_eps);
        if (res.r !== Cut.TwoIntersects)
            return res; //Ya viene como queremos
        //@todo, creo que se ordenan luego como dios manda
        // if (sqDistancePointToPoint(res.point1.x, res.point1.y, u.pi.x, u.pi.y) < sqDistancePointToPoint(res.point2.x, res.point2.y, u.pi.x, u.pi.y))
        //     return res;
        else return { r: Cut.TwoIntersects, point1: res.point2, point2: res.point1 };
    }
    if (u_is_line) {
        // u is line, v is arc
        return segment_arc_intr(u, v, pos_equal_eps);
    }
    let intr_result = arc_arc_intr(v, u, pos_equal_eps); //both are arcs
    return intr_result;
}

//YURRE: Esta función se llama desde el nivel superior (boolean, offset) y vamos a suponer que
// los paths que nos mandan son closed. En los casos de uso normales es así

//He decidido meter en intrs referencias a los paths en vez de índices por claridaa, seguramente es algo más lento...
//pero he aumentado mucho la claridad

export function findIntersects(path1, path2, options) {
    if (path1.elements.length === 0 || path2.elements.length === 0) {
        //el caso de 1 segmento cada uno es teóricamente válido,pa ná
        return { basic: [], overlapping: [] };
    }
    let eps = options.pos_equal_eps; // epsilon de comparación
    let basic_intersects = []; // los normales
    let overlapping_intersects = []; // los de solapamiento parcial entre dos bloques
    let overlapping_points = []; // los puntos de solapamiento, caso de bloque adyacentes
    //YURRE: La rutina es brutalmente ineficiente, O(N*M) siendo N y M el número de bloques de cada path
    //Filosofia de varios pasos simples aunque parezca menos óptimo
    //YURRE: Da la impresión de que los sistemas de bboxes (flatbush, rbush) no sirven porque podemos tener por ejemplo
    //un segmento horizontal y otro vertical (o casi, es un ejemplo) en el que los bboxes de cada uno no contienen
    //ninguno de los puntos del otro bbox, ni por supuesto el bbox completo
    //Por otra parte en algun benchmark salen casos en que el bruteforce no es inferior a los avanzados...
    //Hacemos una optimización adhoc antes de llamar a las rutinas de corte, que tendrían su propia optimización
    //Los puntos que son puntos finales de un shape no los echo porque saldrán también como inicial del siguiente
    path1.elements.forEach((shape1) => {
        path2.elements.forEach((shape2) => {
            //separo por legibilidad, detecto los aabb que no pueden intersecar seguro
            //uso las propias variables para optimizar, en lugar de pasar los argumentos a la función
            const are_disjoint = () => {
                if (shape1.bbox.x0 > shape2.bbox.x1) return true;
                if (shape1.bbox.y0 > shape2.bbox.y1) return true;
                if (shape2.bbox.x0 > shape1.bbox.x1) return true;
                if (shape2.bbox.y0 > shape1.bbox.y1) return true;
            };
            if (!are_disjoint(shape1, shape2)) {
                let res = path_seg_intr(shape1, shape2, eps);
                switch (res.r) {
                    case Cut.NoIntersect:
                        break;
                    case Cut.TangentIntersect:
                    case Cut.OneIntersect:
                        if (!fuzzy_eq_point(shape1.pf, res.point, eps) && !fuzzy_eq_point(shape2.pf, res.point, eps))
                            basic_intersects.push({ shape1: shape1, path1: path1, shape2: shape2, path2: path2, point: res.point });
                        break;
                    case Cut.TwoIntersects:
                        {
                            if (!fuzzy_eq_point(shape1.pf, res.point1, eps) && !fuzzy_eq_point(shape2.pf, res.point1, eps))
                                basic_intersects.push({ shape1: shape1, path1: path1, shape2: shape2, path2: path2, point: res.point1 });
                            if (!fuzzy_eq_point(shape1.pf, res.point2, eps) && !fuzzy_eq_point(shape2.pf, res.point2, eps))
                                basic_intersects.push({ shape1: shape1, path1: path1, shape2: shape2, path2: path2, point: res.point2 });
                        }
                        break;
                    case Cut.OverlappingLines:
                    case Cut.OverlappingArcs: {
                        overlapping_points.push(res.point1, res.point2);
                        overlapping_intersects.push({
                            shape1: shape1,
                            path1: path1,
                            shape2: shape2,
                            path2: path2,
                            sameDirection: res.sameDirection,
                            point1: res.point1,
                            point2: res.point2,
                        });
                    }
                }
            }
        });
    });
    return { basic: basic_intersects, overlapping: overlapping_intersects, overlapPoints: overlapping_points };
}

//YURRE: Estas funciones son necesarias para los offsets, porque hallar las intersecciones de 1 path consigo mismo de forma
// general nos daría que todos los elementos son overlaps!!!
// Están separadas las funciones de que un elemento y el siguiente se corten y el caso global por seguir al paper
// No tengo claro que en nuestro caso de uso no se puedan  unir en una sola, TODO
// De hecho deberíamos testear que los paths originales no se auto-cortan, porque no tiene ningún sentido
// Sin embargo, al hacer el offset de una curva, sí se pueden producir intersecciones de estas

// Intento traducir la idea. En lugar de recorrer 3 vértices seguidos recorremos 2 shapes contiguas
function visitLocalIntersects(path, pos_equal_eps = geometryPrecision) {
    let intrs = [];
    let overlapping_intrs = [];
    let overlapping_points = [];
    function segments_overlap(s1, s2) {
        //Suponemos que son dos elementos contiguos
        if (s1.type === "segment") {
            if (!(s2.type === "segment")) return false;
            return true; //creo que no hay otra posibilidad si está cerrado y son adyacentes
        }
        if (!(s2.type === "arc")) return false;
        //mismo circulo (radio y centro) y mismo sentido (si no, no, )
        return s1.r === s2.r && s1.x === s2.x && s1.y === s2.y && s1.pathway !== s2.pathway;
    }
    //Si es closed, el constructor debe meter el shape correspondiente al final-comienzo y segments sería 2
    if (path.elements.length < 2) return { basic: intrs, overlapping: overlapping_intrs };
    if (path.elements.length === 2 && pathIsClosed(path)) {
        let shape1 = path.elements[0];
        let shape2 = path.elements[1]; //por mantener coherencia de nombres
        // check if entirely overlaps self, o sea, o bien son dos segmentos o dos arcos iguales TODO
        if (segments_overlap(shape1, shape2)) {
            // overlapping
            overlapping_intrs.push({ shape: shape1, point1: shape1.pi, point2: shape1.pf });
        }
        return { basic: intrs, overlapping: overlapping_intrs };
    }

    //Creo que el último no hay que darle la vuelta...
    for (let i1 = 0, i2 = 1; i1 < path.elements.length - 1; i1++, i2++) {
        let shape1 = path.elements[i1];
        let shape2 = path.elements[i2];
        //let shape2 = i < path.elements.length-1 ? path.elements[i+1] : path.elements[0];
        if (fuzzy_eq_point(shape1.pi, shape1.pf, pos_equal_eps)) {
            // singularity, si segmento nulo, TODO EVITAR ESTAS SITUACIONES
            overlapping_intrs.push({ shape: shape1, point1: shape1.pi, point2: shape1.pf });
            continue;
        }
        let res = path_seg_intr(shape1, shape2, pos_equal_eps);
        switch (res.r) {
            case Cut.NoIntersect:
                break;
            case Cut.TangentIntersect:
            case Cut.OneIntersect:
                if (!fuzzy_eq_point(res.point, shape1.pf)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point });
                break;
            case Cut.TwoIntersects: {
                if (!fuzzy_eq_point(res.point1, shape1.pf)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point1 });
                if (!fuzzy_eq_point(res.point2, shape1.pf)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point2 });
                break;
            }
            case Cut.OverlappingLines:
            case Cut.OverlappingArcs:
                overlapping_intrs.push({ shape1: shape1, shape2: shape2, sameDirection: res.sameDirection, point1: res.point1, point2: res.point2 });
                overlapping_points.push(res.point1, res.point2);
                break;
        }
    }
    return { basic: intrs, overlapping: overlapping_intrs };
}

function visitGlobalSelfIntersects(path, pos_equal_eps = geometryPrecision) {
    let intrs = [];
    let overlapping_intrs = [];
    //Si es closed, el constructor debe meter el shape correspondiente al final-comienzo y segments sería 2
    if (path.elements.length <= 2) return { basic: intrs, overlapping: overlapping_intrs };
    //Versión cutre sin optimizar, buscamos intersecciones con otros segmentos pero del mismo
    //path y que no sean adyacentes porque ya lo hemos mirado antes, se supone...
    // iterate all segment bounding boxes in the spatial index querying itself to test for self
    // intersects
    //Hay que ver si hay que tratar aparte los casos límite (i == 2...)
    //Como el j avanza desde i y no desde 0, miramos 0.2, 0.3, 0.n-2 (el 0.n-1 es adyacente, el 0.n==0.0),
    // para i==1  1.3, 1.n-1, (1.n = 1.0 es adyacente)
    // para i==2, 2.4, 2.5, 2.n-1, (2.n = 2.0 = 0.2 , ya está tratado , igual que 2.1)
    // es decir, solo hay que avanzar desde i hasta n-1
    //y no tenemos que mirar si el inverso está hecoo, porque lo está, por ejemplo el 2.0 es el 0.2, no hay que dar la vuelta
    // (creo) :)
    let res = { r: Cut.NoIntersect };
    let nsegments = path.elements.length; //por legibilidad
    for (let i1 = 0; i1 < nsegments; i1++) {
        let shape1 = path.elements[i1];
        //YURRE: Hay dos tests que parecen contradictorios respecto a si el último vértice con el primero es intersect o no...
        //Dejo preparados ambos con el last j
        //YURRE: Intento compaginar ambos con el isClosed, más por el test que por necesidad
        let lastj = pathIsClosed(path) ? (i1 == 0 ? nsegments - 1 : nsegments) : nsegments;
        //let lastj = i1 == 0? nsegments-1 : nsegments;  //para 6 elementos serían (0,2),(0,3),(0,4),     (1,3),(1,4),(1,5),(2,4),(2,5),(3,5)
        //let lastj = nsegments;                          //para 6 elementos serían (0,2),(0,3),(0,4),[0,5],(1,3),(1,4),(1,5),(2,4),(2,5),(3,5)
        for (let i2 = i1 + 2; i2 < lastj; i2++) {
            let shape2 = path.elements[i2];
            //Aquí sí meto en línea la comparación de aabbs, con continues porque es un for
            if (shape1.bbox.x0 > shape2.bbox.x1) continue;
            if (shape1.bbox.y0 > shape2.bbox.y1) continue;
            if (shape2.bbox.x0 > shape1.bbox.x1) continue;
            if (shape2.bbox.y0 > shape1.bbox.y1) continue;
            //console.log(i, j )
            res = path_seg_intr(shape1, shape2, pos_equal_eps);
            switch (res.r) {
                case Cut.NoIntersect:
                    break; //donothing
                case Cut.TangentIntersect:
                case Cut.OneIntersect: //Hay que salta puntos que sean puntos finales porque volverán como iniciales en otro tramo
                    if (!fuzzy_eq_point(res.point, shape1.pf, pos_equal_eps)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point });
                    break;
                case Cut.TwoIntersects:
                    {
                        if (!fuzzy_eq_point(res.point1, shape1.pf, pos_equal_eps)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point1 });
                        if (!fuzzy_eq_point(res.point2, shape1.pf, pos_equal_eps)) intrs.push({ shape1: shape1, shape2: shape2, point: res.point2 });
                    }
                    break;
                case Cut.OverlappingLines:
                case Cut.OverlappingArcs:
                    if (!fuzzy_eq_point(res.point1, shape1.pf, pos_equal_eps))
                        overlapping_intrs.push({
                            shape1: shape1,
                            shape2: shape2,
                            sameDirection: res.sameDirection,
                            point1: res.point1,
                            point2: res.point2,
                        });
                    break;
            }
        }
    }
    return { basic: intrs, overlapping: overlapping_intrs };
}

/// Find all self intersects of a polyline. If `include_overlapping` is `true` then overlapping
// intersects are returned as two basic intersects, one at each end of the overlap. If
//  `include_overlapping` is `false` then overlapping intersects are not returned.
export function allSelfIntersectsAsBasic(path, include_overlapping, pos_equal_eps) {
    let local = visitLocalIntersects(path, pos_equal_eps);
    let global = visitGlobalSelfIntersects(path, pos_equal_eps);
    let intrs = { basic: local.basic.concat(global.basic), overlapping: [] };
    if (include_overlapping) {
        local.overlapping_intrs.forEach((int) => {
            intrs.basic.push({ shape1: int.shape1, shape2: int.shape2, point: int.point1 });
            intrs.basic.push({ shape1: int.shape1, shape2: int.shape2, point: int.point2 });
        });
        global.overlapping_intrs.forEach((int) => {
            intrs.basic.push({ shape1: int.shape1, shape2: int.shape2, point: int.point1 });
            intrs.basic.push({ shape1: int.shape1, shape2: int.shape2, point: int.point2 });
        });
    }
    return intrs;
}

//YURRE: Junto en este fichero los tratamientos de cortes en paths
// He modificado totalmente la función original, uso los paths y shapes en vez de índices, y la función de corte es general para cortes normales y overlaps
//YURRE: función para dividir los paths que se pasan por los puntos de corte, que también se pasan
//cada corte identifica su origen mediante path1 y path2, shape y shape2
//Se trata de usar la misma rutina general por simplificar el código aunque tarde algo más
/**
 *
 * @param {Object} intrs el objeto de cortes, con los de tipo normal y los overlaps
 * @param {Array} paths los paths que se pasan para cortar
 * @param {Number} pos_equal_eps , lo de siempre
 * @returns
 */
export function sliceAtIntersects(intrs, paths, pos_equal_eps = geometryPrecision) {
    let slices = [];
    paths.forEach((path) => {
        const newElements = [];
        path.elements.forEach((shape, i) => {
            let cutPoints = [];
            //se supone que los puntos vienen ordenados según direccion (pi) y que no hay repetidos,
            //  pero puede haber varios cortes en el mismo shape, así que tengo que recorrer todos los cortes para ese shape
            const cuts = intrs.basic.filter((cut) => cut.shape1 === shape || cut.shape2 === shape); //  Por referencia el path ya es el correcto
            if (cuts.length > 0) {
                cutPoints = cuts.map((cut) => ({ d: blockLengthFromStart(shape, cut.point.x, cut.point.y), ov: false }));
            }
            //los overlaps vienen en parejas, y creo que matemáticamente no puede haber un corte normal entre dos shapes que se solapan,
            // así que si hay un overlap ya sé qué tengo que cortar. Puede haber varios de todo, un lío.
            // por otra parte, cut almacena shape1 y shape2, las dos valen y los puntos de corte son comunes
            // pero los valores de d serán distintos, porque el punto de corte no es el mismo para los dos shapes, así que hay que calcularlo para cada uno
            const overlaps = intrs.overlapping.filter((cut) => cut.shape1 === shape || cut.shape2 === shape); // Por referencia el path ya es el correcto
            if (overlaps.length > 0) {
                overlaps.forEach((cut) => {
                    let d1 = blockLengthFromStart(shape, cut.point1.x, cut.point1.y);
                    let d2 = blockLengthFromStart(shape, cut.point2.x, cut.point2.y);
                    cutPoints = cutPoints.concat(
                        Math.abs(d1) < Math.abs(d2)
                            ? [
                                  { d: d1, ovp: true, sameDirection: cut.sameDirection },
                                  { d: d2, ovp: false },
                              ]
                            : [
                                  { d: d2, ovp: true, sameDirection: cut.sameDirection },
                                  { d: d1, ovp: false },
                              ],
                    );
                });
            }
            //en cutpoints el acumulado de normal y overlaps, ordenados por distancia al pi del shape, con un booleano que indica si es un punto de solapamiento o no
            if (cutPoints.length > 0) {
                //Hay que cortar, ordeno los puntos por distancia al pi del shape, para cortar en orden
                cutPoints.sort((a, b) => a.d - b.d);
                newElements.push(...blockSplitAtPoints(path.elements[i], cutPoints, pos_equal_eps));
            }
            //Si no hay que cortar, lo añado tal cual
            else newElements.push(path.elements[i]);
        });
        slices.push(newElements);
    });
    return slices;
}

// Rutina complementaria, aquí se pegan los trozos una vez eliminados los que no valen
//YURRE: Se le llama a veces con los slices de 1 path, en plan buscar trozos de un mismo path original
//y otras con slices ya previamente trabajados, así que miro el tipo de argumento, si es array son slices
export function stitchSlices(allSlices, options) {
    let result = [];
    if (allSlices.length === 0) return result;

    let join_eps = options.slice_join_eps || geometryPrecision;
    let pos_equal_eps = options.pos_equal_eps || geometryPrecision;
    function stitchLocal(theSlices) {
        let finalSlices = []; //la idea es empalmar tramos y luego esos tramos entre ellos...
        let actual_path = [];
        let slices = theSlices;
        //Los slices ya vienen todos con el visited a false, eso se controla fuera
        while (1) {
            let s = slices.find((s) => !s.visited); //La primera vez será el primero
            if (s === undefined) break; //No quedan slices sin visitar
            let start = s.shapes[0];
            let end = s.shapes[s.shapes.length - 1];
            actual_path = s.shapes; //ya es un array
            s.visited = true;
            for (let i = 0; i < slices.length; i++) {
                //es un array de objetos simil path
                s = slices[i];
                if (s.visited) continue;
                if (fuzzy_eq_point(s.shapes[0].pi, end.pf, pos_equal_eps)) {
                    actual_path = actual_path.concat(s.shapes);
                    end = s.shapes[s.shapes.length - 1];
                    s.visited = true;
                } else if (fuzzy_eq_point(s.shapes[s.shapes.length - 1].pf, start.pi, join_eps)) {
                    actual_path = s.shapes.concat(actual_path);
                    start = s.shapes[0];
                    s.visited = true;
                }
            }
            finalSlices.push(actual_path);
        }
        return finalSlices;
    }
    //YURRE: Esto ye una conjetura, que la parte de intersección tiene menos trozos que las propias...
    //La alterntiva es un bucle único con todos los slices juntos
    let slices = allSlices.map((s) => (Array.isArray(s) ? s : [s]));
    let nPaths = slices.length + 1; //por inicializar y que pase. Cuando ya no mejora, se sale
    while (nPaths > slices.length && slices.length > 1) {
        nPaths = slices.length;
        slices = stitchLocal(slices.map((s) => ({ visited: false, shapes: s })));
    }
    //Aquí en slices quedan los trozos que no se dejan juntar
    return slices;
}
