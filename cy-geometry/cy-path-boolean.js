import { findIntersects, sliceAtIntersects, stitchSlices } from "./cy-cuts-full-paths.js";
import { geometryPrecision, fuzzy_eq_point, blockMidpoint, blockClone } from "./cy-geometry-library.js";
import { pathIsClosed, pathOrientation, pathReverse, createPath, pathWindingNumber } from "./cy-geo-elements/cy-path.js";

/// Result of performing a boolean operation between two polylines.
/* pub struct BooleanResult<P>  P: PlineCreation,
{
    posPaths: [],     /// Positive remaining space polylines.
    negPaths: [],     /// Negative subtracted space polylines.
    result_info:       /// Information about what happened during the boolean operation.
                    InvalidInput,       /// Input was not valid to perform boolean operation.
                    Pline1InsidePline2, /// Pline1 entirely inside of pline2 with no intersects.
                    Pline2InsidePline1, /// Pline2 entirely inside of pline1 with no intersects.
                    Disjoint,           /// Pline1 is disjoint from pline2 (no intersects and neither polyline is inside of the other).
                    Overlapping,        /// Pline1 exactly overlaps pline2 (same geometric path).
                    Intersected,        /// Pline1 intersects with pline2 but is not exactly overlapping with the same geometric path.
} */

/// Perform boolean operation between two polylines using parameters given.
export function pathBoolean(path1, path2, op, options = { pos_equal_eps: geometryPrecision }) {
    if (path1.elements.length < 2 || !pathIsClosed(path1) || path2.elements.length < 2 || !pathIsClosed(path2)) {
        return { posPaths: [], negPaths: [], resultInfo: "InvalidInput" };
    }
    const operation = op.toUpperCase();
    //Si decidimos meter el link hay que meter el link en cada path antes de hacer el concat
    if (operation === "XOR") {
        const anotb = pathBoolean(path1, path2, "NOT", options);
        if (anotb.r !== "Intersected") return anotb;
        const bnota = pathBoolean(path2, path1, "NOT", options);
        return { posPaths: anotb.posPaths.concat(bnota.posPaths), negPaths: [], r: "Intersected" };
    }

    let intrs = findIntersects(path1, path2, options);
    //YURRE, quito puntos repes, creo
    intrs.basic = intrs.basic.filter((intr) => !intrs.overlapPoints.find((p) => fuzzy_eq_point(p, intr.point)));
    //YURRE: Oriento igual antes de operar porque simplifica el tratamiento de casos de overlap
    if (pathOrientation(path1) !== pathOrientation(path2)) path2 = pathReverse(path2);

    // helper functions to test if point is inside path1 and path2
    let point_in_path1 = (point) => pathWindingNumber(path1, point) != 0;
    let point_in_path2 = (point) => pathWindingNumber(path2, point) != 0;
    //YURRE: El propio concepto de winding no está definido para puntos que son vértices o caen en los lados...

    let pos_equal_eps = options.pos_equal_eps;
    // YURRE cambio de orden para mejorar claridad. Trato algunos casos degenerados fuera (sin cruces)
    // Si NO hay intersecciones entre los paths pasados...Puesto que los paths NO se tocan la info importante
    // es r, saber si está uno dentro de otro , de hecho podemos obviar negPaths y posPaths
    // podríamos devolver solo r
    if (intrs.basic.length === 0 && intrs.overlapping.length === 0) {
        // Por legibilidad, como no se tocan, si un punto de path1 está en path2 , todo el path1 es interior a path2
        let is_path1_in_path2 = point_in_path2(path1.elements[0].pi);
        let is_path2_in_path1 = point_in_path1(path2.elements[0].pi);
        //YURRE: El único sentido de los negative paths sería detectar que uno es interior a otro y es una isla (o un moyú)
        //Solo tiene interés r
        switch (operation) {
            case "OR": // no intersects, returning only one pline if one is inside other or both if they are completely disjoint
                if (is_path1_in_path2) {
                    return { posPaths: [blockClone(path2)], negPaths: [], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    return { posPaths: [blockClone(path1)], negPaths: [], r: "Pline2InsidePline1" };
                } else {
                    return { posPaths: [blockClone(path1), blockClone(path2)], negPaths: [], r: "Disjoint" };
                }
            case "AND": // no intersects, returning only one pline if one is inside other or none if they are completely disjoint
                if (is_path1_in_path2) {
                    return { posPaths: [blockClone(path1)], negPaths: [], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    return { posPaths: [blockClone(path2)], negPaths: [], r: "Pline2InsidePline1" };
                } else {
                    return { posPaths: [], negPaths: [], r: "Disjoint" };
                }
            case "NOT":
                if (is_path1_in_path2) {
                    // everything is subtracted (nothing left)
                    return { posPaths: [], negPaths: [], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    // negative space island created inside pline1
                    return { posPaths: [blockClone(path1)], negPaths: [blockClone(path2)], r: "Pline2InsidePline1" };
                } else {
                    // disjoint
                    return { posPaths: [blockClone(path1)], negPaths: [], r: "Disjoint" };
                }
            case "XOR":
                if (is_path1_in_path2) {
                    return { posPaths: [blockClone(path2)], negPaths: [blockClone(path1)], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    return { posPaths: [], negPaths: [], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    // negative space island created inside pline1
                    return { posPaths: [blockClone(path1)], negPaths: [blockClone(path2)], r: "Pline2InsidePline1" };
                } else {
                    // disjoint
                    return { posPaths: [blockClone(path1)], negPaths: [], r: "Disjoint" };
                }
            case "XOR":
                if (is_path1_in_path2) {
                    return { posPaths: [blockClone(path2)], negPaths: [blockClone(path1)], r: "Pline1InsidePline2" };
                } else if (is_path2_in_path1) {
                    return { posPaths: [blockClone(path1)], negPaths: [blockClone(path2)], r: "Pline2InsidePline1" };
                } else {
                    // disjoint
                    return { posPaths: [blockClone(path1), blockClone(path2)], negPaths: [], r: "Disjoint" };
                }
        }
    }
    //Casos normales, existen intersecciones
    // función auxiliar por legibilidad, se podría hacer todo al final del switch
    function generatePaths(slices) {
        //YURRE: Intento ir pegando tramos
        let posPaths = stitchSlices(slices, { pos_equal_eps: pos_equal_eps, join_eps: pos_equal_eps });
        posPaths = stitchSlices(posPaths.flat(), { pos_equal_eps: pos_equal_eps, join_eps: pos_equal_eps });
        posPaths = posPaths.map((shapes) => createPath({ elements: shapes }));
        return { posPaths: posPaths, negPaths: [], r: "Intersected" };
    }
    //YURRE: Al meter parte de la lógica de forma explícita la generación de cortes queda fuera
    let [path1Slices, path2Slices] = sliceAtIntersects(intrs, [path1, path2], pos_equal_eps);
    switch (operation) {
        case "OR": {
            // keep all slices of pline1 that are not in pline2 and all slices of pline2 that are not in pline1
            //YURRE: En lugar de una función con varios argumentos para filtrar, etc.... perfiero dejar el proceso explícito en cada operación
            // los que están en P1 OR están en P2
            let pathSlices = path1Slices.filter((shape) => shape.ovp === undefined && !point_in_path2(blockMidpoint(shape)));
            pathSlices = pathSlices.concat(path2Slices.filter((shape) => shape.ovp === undefined && !point_in_path1(blockMidpoint(shape))));
            //los overlaps están repetidos en path1 y en path2, si están en la misma dirección metemos el tramo, si no, nada
            //pegamos los overlaps que son una pesadilla
            path1Slices
                .filter((shape) => shape.ovp !== undefined)
                .forEach((slice) => {
                    if (intrs.overlapping[slice.ovp].sameDirection) pathSlices.push(slice);
                });
            return generatePaths(pathSlices);
        }
        case "AND": {
            // keep all slices from pline1 that are in pline2 and all slices from pline2 that are in pline1
            // están en P1 AND están en P2
            let pathSlices = path1Slices.filter((shape) => shape.ovp === undefined && point_in_path2(blockMidpoint(shape)));
            pathSlices = pathSlices.concat(path2Slices.filter((shape) => shape.ovp === undefined && point_in_path1(blockMidpoint(shape))));
            //los overlaps están repetidos en path1 y en path2, si están en la misma dirección metemos el tramo, si no, nada
            path1Slices
                .filter((shape) => shape.ovp !== undefined)
                .forEach((slice) => {
                    if (intrs.overlapping[slice.ovp].sameDirection) pathSlices.push(slice);
                });
            return generatePaths(pathSlices);
        }
        case "NOT": {
            // keep all slices from pline1 that are not in pline2 and all slices on pline2 that are in pline1
            // están en P1 y NO están en P2
            let pathSlices = path1Slices.filter((shape) => shape.ovp === undefined && !point_in_path2(blockMidpoint(shape)));
            pathSlices = pathSlices.concat(path2Slices.filter((shape) => shape.ovp === undefined && point_in_path1(blockMidpoint(shape))));
            //los overlaps están repetidos en path1 y en path2, si están en la misma dirección metemos el tramo, si no, nada
            path1Slices
                .filter((shape) => shape.ovp !== undefined)
                .forEach((slice) => {
                    if (!intrs.overlapping[slice.ovp].sameDirection) pathSlices.push(slice);
                });
            return generatePaths(pathSlices);
        }

        /*            case 'XOR': { //Esto es A not B  +  B not A (copio del anterior)
            //No me machaco los slices, que cuesta hacerlos
            //A not B
            let pathSlicesAnotB = pathBoolean()
            let pathSlicesAnotB = path1Slices.filter( shape =>  (shape.ovp === undefined) && (!point_in_path2(shape.midpoint())));
            pathSlicesAnotB = pathSlicesAnotB.concat(path2Slices.filter( shape =>  (shape.ovp === undefined) && (point_in_path1(shape.midpoint()))));
            path1Slices.filter(shape=>shape.ovp !== undefined).forEach(slice => {
                if(!intrs.overlapping[slice.ovp].sameDirection)
                    path1SlicesAnotB.push(slice);
            });
            // están en P2 y están en P1
            let posPaths1 = generatePaths(pathSlicesAnotB);
            //B not A
            let pathSlicesBnotA = path1Slices.filter( shape =>  (shape.ovp === undefined) && (!point_in_path2(shape.midpoint())));
            pathSlicesBnotA = pathSlicesBnotA.concat(path2Slices.filter( shape =>  (shape.ovp === undefined) && (point_in_path1(shape.midpoint()))));
            path1Slices.filter(shape=>shape.ovp !== undefined).forEach(slice => {
                if(!intrs.overlapping[slice.ovp].sameDirection)
                    pathSlicesBnotA.push(slice);
            });
            let posPaths2 = generatePaths(pathSlicesBnotA);
            return {posPaths: posPaths1.posPaths.concat(posPaths2.posPaths), negPaths: [], r:'Intersected'};
        } */
    }
}
