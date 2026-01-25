import { sqDistancePointToPoint, distancePointToPoint, arc2PC2SVG} from "./cy-geometry-library.js";
import { geometryPrecision, fuzzy_eq_zero , fuzzy_eq_point  } from "./cy-geometry-library.js";
//import {BArc, BSegment, BPath} from "./cy-geometry-extended-elements.js"
import {Cut} from "./cy-cut-types.js";
import {line_line_intr} from './cy-cuts-segment-segment.js'
import {arc_arc_intr} from './cy-cuts-circle-circle.js'
import {segment_arc_intr} from './cy-cuts-segment-circle.js'
import {allSelfIntersectsAsBasic, sliceAtIntersects, stitchSlices} from './cy-cuts-full-paths.js'
import {pathIsClosed, createPath, pathRemoveRedundant, pathOrientation, pathReverse} from './cy-geo-elements/cy-path.js'
import { createSegment, segmentTranslate, segmentPointInsideOffset, segmentMidpoint } from "./cy-geo-elements/cy-segment.js";
import { createArc, arcScale, arcPointInsideOffset, arcMidpoint} from "./cy-geo-elements/cy-arc.js";
// Aquí cogemos los bloques y los desplazamos uno a uno. En el caso de arcos es más bien un escalado
// En la medida de lo posible conviene usar funciones que ya existan de librería...
// offset positivo es por fuera y suponemos que el path es antiClock, si no, habría que revisar
/// Create all the raw parallel offset segments of a polyline using the `offset` value given.
function createUntrimmedRawOffsetSegments( path, offset)
{  
    let result = [];
    //YURRE: hay que insertar la info de collapsed y lo que haga falta
    result = path.elements.map( (shape, ix) => {
        let ns;
        if(shape.type === 'segment'){     //YURRE: devolver segment con offset
            ns = segmentTranslate(shape, shape.uy * offset, -shape.ux * offset);
            ns.collapsed_arc = false;
        } else { //Arco
            //YURRE: En realidad no es un offset, sino un scale con respecto al centro, pero puede colapsar
            //Hay que tener en cuenta que según el arco vaya hacia un lado u otro el offset sería positivo o negativo
            //lo que se corresponde con hacer compensación exterior o interior.
            //Aunque el offset sea mayor que el radio hay que "proteger" las esquinas, así que existe un punto mínimo a distancia offset de las dos
            let noffset = shape.way === 'antiClock' ? offset : - offset;
            let newr = shape.r + noffset; //offset puede ser < 0
            if((newr < 0) || fuzzy_eq_zero(newr, geometryPrecision)){   //colapso del arco , devuelvo punto seguro , segmento de l= 0
                //Uso un punto medio de la cuerda y el centro para calcular la dirección
                const pm = {x: 0.5*(shape.x1 + shape.x2), y:0.5 * (shape.y1 + shape.y2)}
                let m = {x:pm.x - shape.x0, y:pm.y - shape.y0}; //apunto de mitad de la cuerda hacia el centro
                const d = Math.hypot(m.x, m.y);
                m = { x: m.x/d, y: m.y/d}; //vector unitario que apunta al centro desde la mitad de la cuerda
                const p = {x: pm.x + m.x*(Math.abs(offset) - shape.r), y: pm.y + m.y*(Math.abs(offset) - shape.r)}

                // let bisectriz= {x: shape.pm.x - shape.x, y: shape.pm.y - shape.y }; //bisectriz del arco apunta hacia fuera
                // let lt2 = shape.t.x*shape.t.x + shape.t.y*shape.t.y;    //longitud de la cuerda al cuadrado
                // let d = Math.sqrt(offset*offset -  0.25*lt2) / shape.r;           //distancia segura, pitágoras (/r para el normalizado posterior)
                // //El punto seguro sería a distancia d del centro en la dirección contraría a la bisectriz
                // let p = {x: shape.x - bisectriz.x*d, y: shape.y - bisectriz.y*d}
                ns = createSegment({x0: p.x, y0: p.y, x1: p.x, y1: p.y});
                ns.collapsed_arc = true;
            }
            else{ //escalo (r+offset)/r 
         
                const z = newr / shape.r;
                ns = arcScale(shape, shape.cx, shape.cy, z)
                //let npi = {x:shape.x + (shape.pi.x - shape.x)*z, y:shape.y + (shape.pi.y - shape.y)*z}
                //let npf = {x:shape.x + (shape.pf.x - shape.x)*z, y:shape.y + (shape.pf.y - shape.y)*z}
                //
                //ns = createArc()
                //ns = new BArc(shape.x, shape.y, newr, npi, npf , shape.way===1?'antiClock':'clock');
                ns.collapsed_arc = false;
                }
        }
        ns.origin = ix; //como el original no lo tocamos, sirve para recordar el centro del arco de compensación, por ejemplo
        return ns;
    });
    return result
}

/// Connect two raw offset segments by joining them with an arc and push the vertexes to the `result` output parameter.
// YURRE: como s1 y s2 son rawPathoffsetSegments llevan el ix del original 
//function connect_using_arc( s1, s2, originalPath, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    //el centro es el punto final del tramo s1 ORIGINAL (o el inicial del tramo s2)
    //los puntos inicial y final son los de los tramos offseteados
//    let origin = originalPath.elements[s1.origin]; //podría chequearse que era un segment
//    let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), s1.pf, s2.pi, join_params.connection_arcs_ccw ));
    //let ns = createArc(  origin.pf.x, origin.pf.y, Math.abs(join_params.offset), s1.pf, s2.pi, connection_arcs_ccw ? 'antiClock' : 'clock')
//    return ns; //Dejo la inserción para el llamador
//}

/// Join two adjacent raw offset segments where both segments are lines.
function line_line_join( s1, s2, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    //Paranoico
    if((s1.type !== 'segment') || (s2.type !== 'segment')) console.log('deben venir segmentos'); //Esto sobraría
    if(s1.collapsed_arc || s2.collapsed_arc) {
        // connecting to/from collapsed arc, always connect using arc
        //YURRE: NO LO ENTIENDO PARA r < 0
        let origin = path.elements[s1.origin];
        let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), s1.pf, s2.pi, join_params.connection_arcs_ccw ));
        return ({res:[s1, ns], left:s2});
        //return ({res:[s1, connect_using_arc(s1, s2, path, join_params)], left:s2});
    } else {
        let res = line_line_intr( s1, s2, pos_equal_eps);
        switch(res.r) {
            case Cut.NoIntersect: { //ejemplo? No lo veo, la verdad
                // parallel lines, join with half circle
                let ns = createArc(arc2PC2SVG({ x: 0.5*(s1.pf.x + s2.pi.x), y: 0.5*(s1.pf.y + s2.pi.y)},
                        0.5*distancePointToPoint(s1.pf.x, s1.pf.y, s2.pi.x, s2.pi.y) , s1.pf, s2.pi, join_params.connection_arcs_ccw ));
                return({res:[s1,ns], left:s2});
                }
            break;
            case Cut.TrueIntersect: { //modifico el final de s1 y el comienzo de s2
                let point = res.point;
                //Esto debería funcionar porque los objetos se pasan por referencia
                //No es precisamente óptimo, pero si no hay que hacer una función de clase especial para acortar o alargar segmentos
                let ns1 = createSegment({x0: s1.pi.x, y0:s1.pi.y, x1:point.x, y1:point.y});
                ns1.origin = s1.origin;
                let ns2 = createSegment({x0: point.x, y0: point.y, x1: s2.pf.x, y1: s2.pf.y});
                ns2.origin=s2.origin;
                return({res:[ns1],left:ns2});
            }
            break;
            case Cut.Overlapping: { //supongo que quiere colapsar un troxo de segmento, no parece muy habitual...
                console.log('overlapping segments?');
                return ({res:[ createSegment({x0:s1.pi.x, y0:s1.pi.y, x1:s2.pf.x, y1:s2.pf.y})], left:s2});
            }
            break;
            case Cut.FalseIntersect: { //puede que uno de los dos sí sea real y el otro no, pero point SI está en ambas rectas
                //En el paper aparecen estos casos, que parecen raros y que el arco puede ser también solución, parece
                //Devuelvo arco siempre, queda más chulo
                let origin = path.elements[s1.origin];
                let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), s1.pf, s2.pi, join_params.connection_arcs_ccw ));
                return ({res:[s1, ns], left: s2});
                //return ({res:[s1, connect_using_arc(s1, s2, path, join_params)], left: s2});
                }
            }
        }
    }

/// Join two adjacent raw offset segments where the first segment is a line and the second is a arc.
// el s puede ser un arco colapsado, sustituido por un segmento de l=0 y un flag
function line_arc_join( s, a, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    if((s.type !== 'segment') || (a.type !== 'arc')) console.log('deben venir segmento y arco')
    //YURRE: Nosotros no tenemos el parámetro t y además la rutina de corte ya procesa los casos, se supone
    //Así que devolvemos, NoIntersect, TangentIntersect, OneIntersect y TwoIntersects, y nada más
    //YURRE: Cambio completo de estructura de programa, reuso el código y lo pongo en línea
    let res = segment_arc_intr(s, a, pos_equal_eps);
    if( res.r === Cut.NoIntersect) {
            //pues hay que empalmar, o bien con un arco o bien con un segmento
            //YURRE: No termino de ver en qué caso se usaría un segmento, de momento pongo arco siempre
            let origin = path.elements[s.origin];
            let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), s.pf, a.pi, join_params.connection_arcs_ccw ));
            return ({res:[s, ns], left:a});
            //return ({res:[s,connect_using_arc(s, a, path, join_params)], left:a});
        }
    else {
        let point;
        if(res.r === Cut.TwoIntersects){
            // always use intersect closest to original point
            let dist1 = sqDistancePointToPoint( res.point1.x, res.point1.y, s.pf.x, s.pf.y);
            let dist2 = sqDistancePointToPoint( res.point2.x, res.point2.y, s.pf.x, s.pf.y);
            point =  (dist1 < dist2) ? res.point1 : res.point2;
            }
        else {  //'TangentIntersect. 'OneIntersect'
            point = res.point;
        }
        //Aquí se viene con parte del proceso hecho, si hay dos intersects solo se me pasa un punto, el cercano
        const ns1 = createSegment({x0:s.pi.x, y0:s.pi.y, x1:point.x, y1:point.y});
        const ns2 = createArc(arc2PC2SVG( {x:a.cx, y:a.cy}, a.r, res.point, a.pf, a.way));
        ns1.origin = s.origin;
        ns2.origin = a.origin;
        return({res:[ns1], left:ns2})
        } 
    }

    
/// Join two adjacent raw offset segments where the first segment is a arc and the second is a line.
//YURRE: Como la anterior ....?
function arc_line_join( a, s, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;

    if((a.type !== 'arc') || (s.type !== 'segment')) console.log('deben venir segmentos')

    let res = segment_arc_intr(s, a, pos_equal_eps);
    if(res.r === Cut.NoIntersect){
            let origin = path.elements[a.origin];
            let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), a.pf, s.pi, join_params.connection_arcs_ccw ));
            return ({res:[a, ns], left:s});

            //return ({res:[a,connect_using_arc(a, s, path, join_params)], left:s});
    } else { //'TangentIntersect','TwoIntersects','OneIntersect'
        let point;
        if(res.r === Cut.TwoIntersects){
            let dist1 = sqDistancePointToPoint(intr.point1.x, intr.point1.y, orig_point.x, orig_point.y);
            let dist2 = sqDistancePointToPoint(intr.point2.x, intr.point2.y, orig_point.x, orig_point.y);
            point =  (dist1 < dist2) ? res.point1 : res.point2;
        }
        else{
            point = res.point;
        } 
        const ns1 = createArc(arc2PC2SVG({x:a.cx, y:a.cy}, a.r, a.pi, res.point, a.way));
        const ns2 = createSegment({ x0:point.x, y0:point.y, x1:s.pf.x, y1:s.pf.y});
        ns1.origin = a.origin;
        ns2.origin = s.origin;
        return({res:[ns1], left:ns2})
    }
}

/// Join two adjacent raw offset segments where both segments are arcs.
// Nuestra rutina original devuelve 'NoIntersect', 'Overlapping', 'TangentIntersect', 'TwoIntersects'
function arc_arc_join( a1, a2, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    if((a1.type !== 'arc') || (a2.type !== 'arc')) console.log('deben venir arcos')

    //YURRE: En vez de llamar a circle_circle_intr he hecho la arc_arc_intr que ya devuelve machacado
    let res = arc_arc_intr(a1, a2, pos_equal_eps );
    if(res.r === Cut.OverlappingArcs){
        console.log('TODO');    //El original parece no hacer nada
        if(res.sameDirection === true){
            const ns1 = createArc(arc2PC2SVG({x:a1.cx, y:a1.cy}, a1.r, a1.pi, res.point1, a1.way));
            const ns2 = createArc(arc2PC2SVG({x:a2.cx, y:a2.cy}, a2.r, res.point2, a2.pf, a2.way));
        }
        else{
            const ns1 = createArc(arc2PC2SVG({x:a1.cx, y:a1.cy}, a1.r, a1.pi, res.point1, a1.way));
            const ns2 = createArc(arc2PC2SVG({x:a2.cx, y:a2.cy}, a2.r, res.point2, a2.pf, a2.way));
        }
        return ({res:[ns1],left:ns2});
    }
    if(res.r === Cut.NoIntersect) {
            let origin = path.elements[a1.origin];
            let ns = createArc(arc2PC2SVG({x:origin.pf.x, y:origin.pf.y}, Math.abs(join_params.offset), a1.pf, a2.pi, join_params.connection_arcs_ccw ));
            return ({res:[a1, ns], left:a2});
            //return ({res:[a1,connect_using_arc(a1, a2, path, join_params)], left:a2});
        }
    let point;
    if((res.r === Cut.OneIntersect) || (res.r === Cut.TangentIntersect)) { //Supongo que tengo que cortar como si hubiera solo 1 intersect...
        point = res.point;
    } else if (res.r === Cut.TwoIntersects){
        // always use intersect closest to original point. 
        // YURRE: el original trataba aquí el TangentIntersect para hacer un solo intersect, nosotros lo traemos desde el arc_arc_intr
        let dist1 = sqDistancePointToPoint(res.point1.x, res.point1.y, a1.pf.x, a1.pf.y);
        let dist2 = sqDistancePointToPoint(res.point2.x, res.point2.y, a1.pf.x, a1.pf.y);
        point = dist1 < dist2? res.point1 : res.point2;
    }
    const ns1 = createArc(arc2PC2SVG({x:a1.cx, y:a1.cy}, a1.r, a1.pi, point, a1.way));
    const ns2 = createArc(arc2PC2SVG({x:a2.cx, y:a2.cy}, a2.r, point, a2.pf, a2.way));
    ns1.origin = a1.origin;
    ns2.origin = a2.origin;
    return ({res:[ns1],left:ns2});
}

function createRawOffsetPath(path, offset, options){
    //NO testeo cosas que ya se han mirado en la entrada a parallelOffset
    //Esta crea un clone, no modifica el path original. Se genera el offset de cada elemento, sin más
    let rawOffsetSegs = createUntrimmedRawOffsetSegments(path, offset);
    if(rawOffsetSegs.length === 0) {
        return createPath({elements:[]});
    }
    // detect single collapsed arc segment
    if(rawOffsetSegs.length === 1 && rawOffsetSegs[0].collapsed_arc) {
        return createPath({elements:[]});
    }
    //Si voy ccw y offset>0 (a derechas y por fuera) , ccw='antiClock', si voy ccw y offset<0 (a derechas y por dentro), ccw='clock'
    // En el caso de offset "suelto" pongo el sentido a antiClock antes de llamar.
    // Pero si no, debe ser lo contrario, Si voy cw y offset>0  (a derechas y por fuera) , ccw='clock',  si offset<0  (a derechas y por dentro), ccw='anticClock'
    //let ccw = path.orientation(); //'ccw' o 'cw'
    //De momento considero el caso de orientado ccw de orign
    let connection_arcs_ccw = offset < 0 ? 'clock' : 'antiClock'; //(cw==='ccw') && (offset > 0)) || ((ccw==='cw') && (offset > 0)) ; //?? YURRE, debe ir según la definición de creación a derechas o izquierdas
    let join_params = { offset: offset, connection_arcs_ccw : connection_arcs_ccw, pos_equal_eps : options.pos_equal_eps || geometryPrecision};

    //YURRE: Dudas de inserción de elementos nuevos. Dónde?
    let joinOffsetShapes = (s1, s2, join_params) => {
        if(s1.type === 'segment'){
            if(s2.type === 'segment') return  line_line_join(s1, s2, path, join_params);
            else return line_arc_join(s1, s2, path, join_params);
        } else {
            if(s2.type === 'segment') return  arc_line_join(s1, s2, path, join_params);
            else return arc_arc_join(s1, s2, path, join_params)
        }
        }

    //YURRE: versión libre, me he cepillado todos los algoritmos originales
    let result = [];
    let shape = rawOffsetSegs[0];
    for(let i=1; i<rawOffsetSegs.length; i++){
        let joint = joinOffsetShapes(shape, rawOffsetSegs[i], join_params);
        result = result.concat(joint.res);
        shape = joint.left;
    }
    if(pathIsClosed(path)){ //al cerrar , además de el último tramo, puede modificarse el comienzo del primero
        let joint = joinOffsetShapes(shape, rawOffsetSegs[0], join_params);
        result = result.concat(joint.res);
        if(!fuzzy_eq_point(result[0].pi, joint.left.pi)){
            let old = result[0];
            if(joint.left.type === 'segment')
                result[0] = createSegment({x0:joint.left.pi.x, y0:joint.left.pi.y, x1:old.pf.x, y1:old.pf.y});
            else
                result[0] = createArc(arc2PC2SVG({x:old.x, y:old.y}, old.r, joint.left.pi, old.pf, old.way));
        }
    }
    let res = createPath({elements:result});
    return pathRemoveRedundant(res);
}

//YURRE: El sistema con punto medio y tal no convence nada, tiro de nuestra librería
//y miro caso a caso. Las rutinas de intersect ya llevan o deberían llevar salidas "rápidas" si están fuera de radio
//YURRE: TODO. Esta parte es una de las que hay que mejorar en precisión y en tiempo probablemente con un aabb
// También se puede mejorar haciendo que acepte un shape en vez de un punto, lo haría más preciso
// Además, podría abrirse la rutina para que empalme trozos sueltos en ves de mantener dos paths
// A pensar
export function sliceIsValid(slice, path, offset, pos_equal_eps= geometryPrecision ){
    //let abs_offset = Math.abs(offset) - pos_equal_eps;
    const midpoint = slice.type === 'segment' ? segmentMidpoint(slice) : arcMidpoint(slice);
    for(let i = 0; i < path.elements.length; i++){
        let shape = path.elements[i];
        if(shape.type === 'segment'){
            if(segmentPointInsideOffset(shape, slice.pi, offset, pos_equal_eps)) return false;
            if(segmentPointInsideOffset(shape, slice.pf, offset, pos_equal_eps)) return false;
            if(segmentPointInsideOffset(shape, midpoint, offset, pos_equal_eps)) return false;     
        } else {
            if(arcPointInsideOffset(shape, slice.pi, offset, pos_equal_eps)) return false;
            if(arcPointInsideOffset(shape, slice.pf, offset, pos_equal_eps)) return false;
            if(arcPointInsideOffset(shape, midpoint, offset, pos_equal_eps)) return false;
        }
    }
    return true;
}

function slicesFromRawOffset( path, rawOffsetPath, offset, options){
    if(!pathIsClosed(rawOffsetPath)) console.log( "only supports closed polylines");

    let result = [];
    if (rawOffsetPath.elements.length < 2) {
        return result;
    }

    let pos_equal_eps = options.pos_equal_eps;
    let offset_dist_eps = options.offset_dist_eps;
    //Esta rutina es específica porque una rutina general de corte entre paths NO puede incluir un path consigo mismo
    //Serían todos los tramos overlap!!
    let selfIntersects = allSelfIntersectsAsBasic(rawOffsetPath, false, pos_equal_eps);

    if (selfIntersects.basic.length === 0) {    // no self intersects, test point on polyline is valid 
        if( !sliceIsValid(rawOffsetPath.elements[0], path, offset))
            return result;
        return [rawOffsetPath.elements];        // is valid
    }
    //YURRE: Utilizo rutina general, tal vez menos óptima, para calcular los cortes del path
    //La rutina general admite un array de paths con info de cortes
    let pathSlices = sliceAtIntersects(selfIntersects, [rawOffsetPath], pos_equal_eps)[0];
    //Ahora se trataría de validar cada slice mirando que no corte al path original
    //Se le da un margen diferente del offset, una especie de epsilon adicional !?
    //No se puede aprovechar ninguna localidad porque un slice puede cortar o acercarse a cualquier
    //elemento de la curva original, así que hay que mirar "todos con todos"
    //La optimización pasa por un BTree o similar, que lo que usa el original.
    //Por ejemplo , el BPath podría tener los aabb o el btree de sus elementos

    pathSlices = pathSlices.filter( (slice) => sliceIsValid(slice, path, offset) )
    return (pathSlices);
}

    /// Compute the parallel offset polylines of the polyline with options given.
    /// YURRE: He cambiado el significado del signo del offset, positivo a derechas, o sea
    /// si estoy haciendo un circulo en sentido estándar (antihorario) positivo es por fuera
    /// YURRE: No sé si merece la pena porque cajeras con self-intersects ...
    /// `options` is a struct that holds optional parameters
    /// If true then self intersects will be properly handled by the offset algorithm, if false then
    /// self intersecting polylines may not offset correctly. Handling self intersects of closed
    /// polylines requires more memory and computation.
    /// handle_self_intersects: bool,
    /// Fuzzy comparison epsilon used for determining if two positions are equal.
    /// Fuzzy comparison epsilon used for determining if two positions are equal when stitching polyline slices together.
    /// Fuzzy comparison epsilon used when testing distance of slices to original polyline for validity.
    
export const defaultOffsetOptions = {handle_self_intersects:false, pos_equal_eps: geometryPrecision, slice_join_eps: geometryPrecision, offset_dist_eps: geometryPrecision};


//YURRE: Modificaciones para simplificar los algoritmos iniciales generales para cajeras con islas "normales"
// 1.- Definimos que el perfil exterior o cajera es antiClokwise
// 2.- Solo tiene sentido para perfiles cerrados, Si se quieren perfiles abiertos se pueden cerrar en interactivo 
//          y volver a abrirlos posteriormente ... 
export function parallelOffset(path, offset, options = defaultOffsetOptions) {
    if (path.elements.length < 1) { return []; }
    if(!pathIsClosed(path))
        return ({error:true, paths:[], text:'Only prepared for closed contours'});
    if(!offset || fuzzy_eq_zero(offset)) return ({error:false, paths:[], text:'Offset must be !== 0'});
    //Chequeo self-intersects, NO tienen sentido en un CAM 
    const intersects = allSelfIntersectsAsBasic(path); //devuelve un objeto
    if(intersects.basic.length > 0) return ({error:true, paths:[], text: 'The path intersects itself!'})
    // Aquí hay dos posibilidades, poner el ccw/cw en función del path o darle la vuelta...
//@todo ambas opciones tienen ventajas e inconvenientes..
    let newPath = (pathOrientation(path) !== 'antiClock') ? pathReverse(path) : path ;
    let rawOffsetPath = createRawOffsetPath(newPath, offset, options);
    if(rawOffsetPath.elements.length === 0)
        return ({error:true, paths:[], text: 'Error al calcular los offsets de los paths'});
    //Ya he mirado que era cerrado y No trato los self-intersects
    let slices = slicesFromRawOffset(path, rawOffsetPath, offset, options);
    slices = stitchSlices( slices, options )
    slices = slices.map(shapes=>createPath({elements:shapes}))
    return ({error:false, paths:slices, text:''});
}
