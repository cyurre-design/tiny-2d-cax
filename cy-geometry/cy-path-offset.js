import { sqDistancePointToPoint, } from "./fg-geometry-library.js";
import { geometryPrecision, fuzzy_eq_zero , fuzzy_eq_point , distancePointToPoint} from "./fg-geometry-basic-elements.js";
import {BArc, BSegment, BPath} from "./cy-geometry-extended-elements.js"
import {Cut} from "./cy-cut-types.js";
import {line_line_intr} from './cy-cuts-segment-segment.js'
import {arc_arc_intr} from './cy-cuts-circle-circle.js'
import {segment_arc_intr} from './cy-cuts-segment-circle.js'
import {allSelfIntersectsAsBasic, sliceAtIntersects, stitchSlices} from './cy-cuts-full-paths.js'
/// Create all the raw parallel offset segments of a polyline using the `offset` value given.
function createUntrimmedRawOffsetSegments( path, offset)
{  
    let result = [];
    //YURRE: hay que insertar la info de collapsed y lo que haga falta
    result = path.elements.map( (shape, ix) => {
        let ns;
        if(shape instanceof BSegment){     //YURRE: devolver segment con offset
            ns = shape.clone();
            ns.translate(-shape.uy * offset, shape.ux * offset);
            ns.collapsed_arc = false;
        } else {     //YURRE: En realidad no es un offset, sino un scale con respecto al centro, pero puede colapsar
            //Hay que tener en cuenta que según el arco vaya hacia un lado u otro el offset sería positivo o negativo
            //lo que se corresponde con hacer compensación exterior o interior.
            //Aunque el offset sea mayor que el radio hay que "proteger" las esquinas, así que existe un punto mínimo a distancia offset de las dos
            let noffset = shape.pathway === 1 ? offset : - offset;
            let newr = shape.r + noffset; //offset puede ser < 0
            if((newr < 0) || fuzzy_eq_zero(newr, geometryPrecision)){   //colapso del arco , devuelvo punto seguro , segmento de l= 0
                let bisectriz= {x: shape.pm.x - shape.x, y: shape.pm.y - shape.y }; //bisectriz del arco apunta hacia fuera
                let lt2 = shape.t.x*shape.t.x + shape.t.y*shape.t.y;    //longitud de la cuerda al cuadrado
                let d = Math.sqrt(offset*offset -  0.25*lt2) / shape.r;           //distancia segura, pitágoras (/r para el normalizado posterior)
                //El punto seguro sería a distancia d del centro en la dirección contraría a la bisectriz
                let p = {x: shape.x - bisectriz.x*d, y: shape.y - bisectriz.y*d}
                ns = new BSegment(p.x, p.y, p.x, p.y);
                ns.collapsed_arc = true;
            }
            else{ //escalo (r+offset)/r 
                const z = newr / shape.r;
                let npi = {x:shape.x + (shape.pi.x - shape.x)*z, y:shape.y + (shape.pi.y - shape.y)*z}
                let npf = {x:shape.x + (shape.pf.x - shape.x)*z, y:shape.y + (shape.pf.y - shape.y)*z}
                ns = new BArc(shape.x, shape.y, newr, npi, npf , shape.pathway===1?'antiClock':'clock');
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
function connect_using_arc( s1, s2, originalPath, join_params){
    let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let origin = originalPath.elements[s1.origin]; //podría chequearse que era un segment
    let ns = new BArc(origin.pf.x, origin.pf.y, Math.abs(join_params.offset), s1.pf, s2.pi, connection_arcs_ccw ? 'antiClock' : 'clock')
    return ns; //Dejo la inserción para el llamador
}

/// Join two adjacent raw offset segments where both segments are lines.
function line_line_join( s1, s2, path, join_params){
    let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    if(!(s1 instanceof BSegment) || !(s2 instanceof BSegment)) console.log('deben venir segmentos'); //Esto sobraría
    if(s1.collapsed_arc || s2.collapsed_arc) {
        // connecting to/from collapsed arc, always connect using arc
        //YURRE: NO LO ENTIENDO PARA r < 0
        return ({res:[s1, connect_using_arc(s1, s2, path, join_params)], left:s2});
    } else {
        let res = line_line_intr( s1, s2, pos_equal_eps);
        switch(res.r) {
            case Cut.NoIntersect: { //ejemplo? No lo veo, la verdad
                // parallel lines, join with half circle
                let ns = new BArc(0.5*(s1.pf.x + s2.pi.x), 0.5*(s1.pf.y + s2.pi.y),
                        0.5*distancePointToPoint(s1.pf.x, s1.pf.y, s2.pi.x, s2.pi.y) , s1.pf, s2.pi, connection_arcs_ccw ? 'anticlock' : 'clock');
                return({res:[s1,ns], left:s2});
                }
            break;
            case Cut.TrueIntersect: { //modifico el final de s1 y el comienzo de s2
                let point = res.point;
                //Esto debería funcionar porque los objetos se pasan por referencia
                //No es precisamente óptimo, pero si no hay que hacer una función de clase especial para acortar o alargar segmentos
                let ns1 = new BSegment(s1.pi.x, s1.pi.y, point.x, point.y);
                ns1.origin = s1.origin;
                let ns2 = new BSegment( point.x, point.y, s2.pf.x, s2.pf.y);
                ns2.origin=s2.origin;
                return({res:[ns1],left:ns2});
            }
            break;
            case Cut.Overlapping: { //supongo que quiere colapsar un troxo de segmento, no parece muy habitual...
                console.log('overlapping segments?');
                return ({res:[BSegment(s1.pi.x, s1.pi.y, s2.pf.x, s2.pf.y)], left:s2});
            }
            break;
            case Cut.FalseIntersect: { //puede que uno de los dos sí sea real y el otro no, pero point SI está en ambas rectas
                //En el paper aparecen estos casos, que parecen raros y que el arco puede ser también solución, parece
                //Devuelvo arco siempre, queda más chulo
                return ({res:[s1, connect_using_arc(s1, s2, path, join_params)], left: s2});
                }
            }
        }
    }

/// Join two adjacent raw offset segments where the first segment is a line and the second is a arc.
// el s1 puede ser un arco colapsado, sustituido por un segmento de l=0 y un flag
function line_arc_join( s1, s2, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    if(!(s1 instanceof BSegment) || !(s2 instanceof BArc)) console.log('deben venir segmento y arco')
    //YURRE: Nosotros no tenemos el parámetro t y además la rutina de corte ya procesa los casos, se supone
    //Así que devolvemos, NoIntersect, TangentIntersect, OneIntersect y TwoIntersects, y nada más
    //YURRE: Cambio completo de estructura de programa, reuso el código y lo pongo en línea
    let res = segment_arc_intr(s1, s2, pos_equal_eps);
    if( res.r === Cut.NoIntersect) {
            //pues hay que empalmar, o bien con un arco o bien con un segmento
            //YURRE: No termino de ver en qué caso se usaría un segmento, de momento pongo arco siempre
            return ({res:[s1,connect_using_arc(s1, s2, path, join_params)], left:s2});
        }
    else {
        let point;
        if(res.r === Cut.TwoIntersects){
            // always use intersect closest to original point
            let dist1 = sqDistancePointToPoint( res.point1.x, res.point1.y, s1.pf.x, s1.pf.y);
            let dist2 = sqDistancePointToPoint( res.point2.x, res.point2.y, s1.pf.x, s1.pf.y);
            point =  (dist1 < dist2) ? res.point1 : res.point2;
            }
        else {  //'TangentIntersect. 'OneIntersect'
            point = res.point;
        }
        //Aquí se viene con parte del proceso hecho, si hay dos intersects solo se me pasa un punto, el cercano
        const ns1 = new BSegment(s1.pi.x, s1.pi.y, point.x, point.y);
        const ns2 = new BArc(s2.x, s2.y, s2.r, res.point, s2.pf, s2.pathway === 1? 'antiClock' : 'clock');
        ns1.origin = s1.origin;
        ns2.origin = s2.origin;
        return({res:[ns1], left:ns2})
        } 
    }

    
/// Join two adjacent raw offset segments where the first segment is a arc and the second is a line.
//YURRE: Como la anterior ....?
function arc_line_join( s1, s2, path, join_params){
    //let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;

    if(!(s1 instanceof BArc) || !(s2 instanceof BSegment)) console.log('deben venir segmentos')

    let res = segment_arc_intr(s2, s1, pos_equal_eps);
    if(res.r === Cut.NoIntersect){
            return ({res:[s1,connect_using_arc(s1, s2, path, join_params)], left:s2});
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
        const ns1 = new BArc(s1.x, s1.y, s1.r, s1.pi, res.point,s1.pathway === 1? 'antiClock' : 'clock');
        const ns2 = new BSegment( point.x, point.y, s2.pf.x, s2.pf.y);
        ns1.origin = s1.origin;
        ns2.origin = s2.origin;
        return({res:[ns1], left:ns2})
    }
}

/// Join two adjacent raw offset segments where both segments are arcs.
// Nuestra rutina original devuelve 'NoIntersect', 'Overlapping', 'TangentIntersect', 'TwoIntersects'
function arc_arc_join( s1, s2, path, join_params){
    let connection_arcs_ccw = join_params.connection_arcs_ccw;
    let pos_equal_eps = join_params.pos_equal_eps;
    if(!(s1 instanceof BArc) || !(s2 instanceof BArc)) console.log('deben venir arcos')

    //YURRE: En vez de llamar a circle_circle_intr he hecho la arc_arc_intr que ya devuelve machacado
    let res = arc_arc_intr(s1, s2, pos_equal_eps );
    if(res.r === Cut.OverlappingArcs){
        console.log('TODO');    //El original parece no hacer nada
        if(res.sameDirection === true){
            const ns1 = new BArc(s1.x, s1.y, s1.r, s1.pi, res.point1, s1.pathway===1?'antiClock':'clock');
            const ns2 = new BArc(s2.x, s2.y, s2.r, res.point2, s2.pf, s2.pathway===1?'antiClock':'clock');
        }
        else{
            const ns1 = new BArc(s1.x, s1.y, s1.r, s1.pi, res.point1, s1.pathway===1?'antiClock':'clock');
            const ns2 = new BArc(s2.x, s2.y, s2.r, res.point2, s2.pf, s2.pathway===1?'antiClock':'clock');
        }
        return ({res:[ns1],left:ns2});
    }
    if(res.r === Cut.NoIntersect) {
            return ({res:[s1,connect_using_arc(s1, s2, path, join_params)], left:s2});
        }
    let point;
    if((res.r === Cut.OneIntersect) || (res.r === Cut.TangentIntersect)) { //Supongo que tengo que cortar como si hubiera solo 1 intersect...
        point = res.point;
    } else if (res.r === Cut.TwoIntersects){
        // always use intersect closest to original point. 
        // YURRE: el original trataba aquí el TangentIntersect para hacer un solo intersect, nosotros lo traemos desde el arc_arc_intr
        let dist1 = sqDistancePointToPoint(res.point1.x, res.point1.y, s1.pf.x, s1.pf.y);
        let dist2 = sqDistancePointToPoint(res.point2.x, res.point2.y, s1.pf.x, s1.pf.y);
        point = dist1 < dist2? res.point1 : res.point2;
    }
    const ns1 = new BArc(s1.x, s1.y, s1.r, s1.pi, point, s1.pathway===1?'antiClock':'clock');
    const ns2 = new BArc(s2.x, s2.y, s2.r, point, s2.pf, s2.pathway===1?'antiClock':'clock');
    ns1.origin = s1.origin;
    ns2.origin = s2.origin;
    return ({res:[ns1],left:ns2});
}

function createRawOffsetPath(path, offset, options){
    if (path.elements.length < 1) {
        return new BPath([]);
    }
    //Esta crea un clone, no modifica el path original
    let rawOffsetSegs = createUntrimmedRawOffsetSegments(path, offset);
    if(rawOffsetSegs.length === 0) {
        return new BPath([]);
    }
    // detect single collapsed arc segment
    if(rawOffsetSegs.length === 1 && rawOffsetSegs[0].collapsed_arc) {
        return new BPath([]);
    }
    //Si voy ccw y offset>0 (a derechas) , ccw='ccw', si voy ccw y offset<0 (a izquierdas), ccw='cw'
    //Si voy cw y offset>0  (a derechas) , ccw='ccw', si voy cw y offset<0  (a izquierdas), ccw='cw'
    //let ccw = path.orientation(); //'ccw' o 'cw'
    let connection_arcs_ccw = offset > 0 ; //((ccw==='ccw') && (offset > 0)) || ((ccw==='cw') && (offset > 0)) ; //?? YURRE, debe ir según la definición de creación a derechas o izquierdas
    let join_params = { offset: offset, connection_arcs_ccw : connection_arcs_ccw, pos_equal_eps : options.pos_equal_eps || geometryPrecision};

    //YURRE: Dudas de inserción de elementos nuevos. Dónde?
    let joinOffsetShapes = (s1, s2, join_params) => {
        if(s1 instanceof BSegment){
            if(s2  instanceof BSegment) return  line_line_join(s1, s2, path, join_params);
            else return line_arc_join(s1, s2, path, join_params);
        } else {
            if(s2  instanceof BSegment) return  arc_line_join(s1, s2, path, join_params);
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
    if(path.isClosed){ //al cerrar , además de el último tramo, puede modificarse el comienzo del primero
        let joint = joinOffsetShapes(shape, rawOffsetSegs[0], join_params);
        result = result.concat(joint.res);
        if(!fuzzy_eq_point(result[0].pi, joint.left.pi)){
            let old = result[0];
            if(joint.left instanceof BSegment)
                result[0] = new BSegment(joint.left.pi.x, joint.left.pi.y, old.pf.x, old.pf.y);
            else
                result[0] = new BArc(old.x, old.y, old.r, joint.left.pi, old.pf, old.pathway===1?'antiClock':'clock');
        }
    }
    let res = new BPath(result);
    return res.removeRedundant();
}

//YURRE: El sistema con punto medio y tal no convence nada, tiro de nuestra librería
//y miro caso a caso. Las rutinas de intersect ya llevan o deberían llevar salidas "rápidas" si están fuera de radio
//YURRE: TODO. Esta parte es una de las que hay que mejorar en precisión y en tiempo probablemente con un aabb
// También se puede mejorar haciendo que acepte un shape en vez de un punto, lo haría más preciso
// Además, podría abrirse la rutina para que empalme trozos sueltos en ves de mantener dos paths
// A pensar
export function sliceIsValid(slice, path, offset, pos_equal_eps= geometryPrecision ){
    //let abs_offset = Math.abs(offset) - pos_equal_eps;
    for(let i = 0; i < path.elements.length; i++){
        let shape = path.elements[i];
        if(shape.insideOffset(slice.pi, offset, pos_equal_eps)) return false;
        if(shape.insideOffset(slice.pf, offset, pos_equal_eps)) return false;
        if(shape.insideOffset(slice.midpoint(), offset, pos_equal_eps)) return false;     
    }
    return true;
}

function slicesFromRawOffset( path, rawOffsetPath, offset, options){
    if(!rawOffsetPath.isClosed) console.log( "only supports closed polylines, use slices_from_dual_raw_offsets for open polylines");

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
    /// Fuzzy comparison epsilon used for determining if two positions are equal when stitching
    /// polyline slices together.
    /// Fuzzy comparison epsilon used when testing distance of slices to original polyline for
    /// validity.
    
export const defaultOffsetOptions = {handle_self_intersects:false, pos_equal_eps: geometryPrecision, slice_join_eps: geometryPrecision, offset_dist_eps: geometryPrecision};
export function parallelOffset(path, offset, options = defaultOffsetOptions) {
    if (path.elements.length < 1) { return []; }
    
    //YURRE: Hay que meter validaciones, por ejemplo que el perfil no tenga selfintersects de ningún tipo y sea cerrada
    //Si se quiere para abiertas, se puede mirar....de momento he quitado el código (al final)
    if(!path.isClosed) {console.log('Only prepared for closed contours'); return []};
    if(!offset || fuzzy_eq_zero(offset)) return [path];
    let rawOffsetPath = createRawOffsetPath(path, offset, options);
    if(rawOffsetPath.elements.length === 0) return [];
    let result = [];
    if (path.isClosed && !options.handle_self_intersects) {
        let slices = slicesFromRawOffset(path, rawOffsetPath, offset, options);
        slices = stitchSlices( slices, options )
        slices = slices.map(shapes=>new BPath(shapes))
        return slices;
    } else console.log('no implementado aún para abiertos')
    // {
    //     let dual_raw_offset = createRawOffsetPath(path, -offset, options);
    //     let slices = slices_from_dual_raw_offsets( path, rawOffsetPath, dual_raw_offset, index, offset, options );
    //     slices = stitchSlices( rawOffsetPath, slices, path.isClosed(), rawOffsetPath.vertex_count(), options);
    // };

    // debug_assert!(
    //     result
    //         .iter()
    //         .all(|p: &O| p.remove_repeat_pos(options.pos_equal_eps).is_none()),
    //     "bug: result should never have repeat position vertexes"
    // );

    return result;
}
