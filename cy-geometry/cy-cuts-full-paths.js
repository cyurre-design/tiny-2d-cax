//YURRE: Traducción LIBRE, paso las polylíneas a paths...
//De forma general una polilínea podría tener vértices repes?

import {geometryPrecision, fuzzy_eq_point , sqDistancePointToPoint, blockSplitAtPoints, blockClone} from "./cy-geometry-library.js"
import {Cut} from "./cy-cut-types.js";
import { arc_arc_intr } from "./cy-cuts-circle-circle.js";
import {segment_arc_intr} from "./cy-cuts-segment-circle.js";
import { line_line_intr } from "./cy-cuts-segment-segment.js";

///
/// In the case of overlapping intersects `point1` is always closest to the start of the second
/// segment (`start_index2`) and `point2` furthest from the start of the second segment.
///
/// In the case of two intersects on one segment the intersects will be added as two
/// [PlineBasicIntersect] in the order of distance from the start of the second segment.
///
//He extendido a Bsegments y BArcs, pero la rutina es genérica, hay que mirar
// Cortes entre dos paths, cada path tiene una serie de blocks (segmentos y arcos)
export function path_seg_intr(v, u, pos_equal_eps = geometryPrecision)
{
    let v_is_line = v.type === 'segment';
    let u_is_line = u.type === 'segment';

    if( v_is_line && u_is_line) {// u is line, v is line
        let intr_result = line_line_intr(v, u, pos_equal_eps);
        switch(intr_result.r){
            case Cut.NoIntersect:
            case Cut.FalseIntersect:
                return {r:Cut.NoIntersect}
            case Cut.TrueIntersect:
                return {r:Cut.OneIntersect, point: intr_result.point}
            case Cut.Overlapping:
                return {r:Cut.OverlappingLines,  point1: intr_result.point1, point2: intr_result.point2, sameDirection: intr_result.sameDirection}
        }
    }
    if(v_is_line) {        // v is segment, u is arc, es lo que espera la rutina pero vuelven ordenados según el segmento (u)
        let res = segment_arc_intr(v, u, pos_equal_eps);
        if(res.r !== Cut.TwoIntersects) return  res; //Ya viene como queremos
        // return points ordered according to segment direction
        //YURRE: ¿Hay que ordenar según el arco por ser el segundo parámetro??? eso parece: siendo un arco, no sé yo si la distancia es un buen método...
        if(sqDistancePointToPoint(res.point1.x, res.point1.y, u.pi.x, u.pi.y) < sqDistancePointToPoint(res.point2.x, res.point2.y, u.pi.x, u.pi.y))
            return res;
        else    
            return {r:Cut.TwoIntersects,  point1: res.point2, point2: res.point1 };        
    }
    if(u_is_line) {        // u is line, v is arc
        return segment_arc_intr(u, v, pos_equal_eps);
    }
    let intr_result = arc_arc_intr( v , u, pos_equal_eps); //both are arcs
    return intr_result;
}

//YURRE: Esta función se llama desde el nivel superior (boolean, offset) y vamos a suponer que 
// los paths que nos mandan son closed. En los casos de uso normales es así
export  function findIntersects( path1, path2, options){
    if((path1.elements.length === 0) || (path2.elements.length === 0)){ //el caso de 1 segmento cada uno es teóricamente válido,pa ná
        return {basic: [], overlapping:[]};
    }
    let eps = options.pos_equal_eps;    // epsilon de comparación
    let basic_intersects = [];          // los normales
    let overlapping_intersects = [];    // los de solapamiento parcial entre dos bloques
    let overlapping_points = [];       // los puntos de solapamiento, caso de bloque adyacentes
    //YURRE: La rutina es brutalmente ineficiente, O(N*M) siendo N y M el número de bloques de cada path
    //Por otra parte está completamente reesrita, en vez de hash uso objetos, que hacen eso internamente
    //Filosofia de varios pasos simples aunque parezca menos óptimo
    //YURRE: Da la impresión de que los sistemas de bboxes (flatbush, rbush) no sirven porque podemos tener por ejemplo
    //un segmento horizontal y otro vertical (o casi, es un ejemplo) en el que los bboxes de cada uno no contienen
    //ninguno de los puntos del otro bbox, ni por supuesto el bbox completo
    //Por otra parte en algun benchmark salen casos en que el bruteforce no es inferior a los avanzados...
    //Hacemos una optimización adhoc antes de llamar a las rutinas de corte, que tendrían su propia optimización
    //Los puntos que son puntos finales de un shape no los hecho porque saldrán también como inicial del siguiente
    path1.elements.forEach((shape1, i1)=>{
        path2.elements.forEach((shape2, i2)=>{
            //separo por legibilidad, detecto loa aabb que no pueden intersecar seguro
            //uso las propias variables para optimizar, en lugar de pasar los argumentos a la función
            const are_disjoint = ()=>{
                if(shape1.bbox.x0 > shape2.bbox.x1) return true;
                if(shape1.bbox.y0 > shape2.bbox.y1) return true;
                if(shape2.bbox.x0 > shape1.bbox.x1) return true;
                if(shape2.bbox.y0 > shape1.bbox.y1) return true;
            }
            if(!are_disjoint(shape1, shape2)){
                let res = path_seg_intr(shape1, shape2, eps);
                switch(res.r){
                    case Cut.NoIntersect : break;
                    case Cut.TangentIntersect:
                    case Cut.OneIntersect:
                        if(!fuzzy_eq_point(shape1.pf, res.point, eps) && !fuzzy_eq_point(shape2.pf, res.point, eps))
                            basic_intersects.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point});
                        break;
                    case Cut.TwoIntersects: {
                        if(!fuzzy_eq_point(shape1.pf, res.point1, eps) && !fuzzy_eq_point(shape2.pf, res.point1, eps))
                            basic_intersects.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point1});
                        if(!fuzzy_eq_point(shape1.pf, res.point2, eps) && !fuzzy_eq_point(shape2.pf, res.point2, eps))
                            basic_intersects.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point2});
                        }
                        break;
                    case Cut.OverlappingLines:
                    case Cut.OverlappingArcs : {
                        overlapping_points.push(res.point1, res.point2)
                        overlapping_intersects.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, sameDirection:res.sameDirection, point1:res.point1, point2:res.point2});    
                    }
                }
            }
        })
    })
    return {basic: basic_intersects, overlapping:overlapping_intersects, overlapPoints: overlapping_points}
}

//YURRE: Estas funciones son necesarias para los offsets, porque hallar las intersecciones de 1 path consigo mismo de forma
// general nos daría que todos los elementos son overlaps!!!
// Están separadas las funciones de que un elemento y el siguiente se corten y el caso global por seguir al paper
// No tengo claro que en nuestro caso de uso no se puedan  unir en una sola, TODO
// De hecho deberíamos testear que los paths originales no se auto-cortan, porque no tiene ningún sentido
// Sin embargo, al hacer el offset de una curva, sí se pueden producir intersecciones de estas

// Intento traducir la idea. En lugar de recorrer 3 vértices seguidos recorremos 2 shapes contiguas
export function visitLocalIntersects( path, pos_equal_eps= geometryPrecision )
{
    let intrs = [];
    let overlapping_intrs = [];
    function segments_overlap(s1, s2)    { //Suponemos que son dos elementos contiguos
        if(s1.type === 'segment'){
            if(! (s2.type === 'segment')) return false;
            return true; //creo que no hay otra posibilidad si está cerrado y son adyacentes
        }
        if(! (s2.type === 'arc')) return false;
        //mismo circulo (radio y centro) y mismo sentido (si no, no, )
        return( ((s1.r === s2.r) && (s1.x === s2.x) && (s1.y === s2.y) && (s1.pathway !== s2.pathway)));
    }
    //Si es closed, el constructor debe meter el shape correspondiente al final-comienzo y segments sería 2
    if(path.elements.length < 2)
        return({basic: intrs, overlapping: overlapping_intrs});
    if((path.elements.length === 2) && (path.isClosed)){
        let shape1 = path.elements[0];
        let shape2 = path.elements[1]; //por mantener coherencia de nombres
            // check if entirely overlaps self, o sea, o bien son dos segmentos o dos arcos iguales TODO
            if( segments_overlap(shape1, shape2)){ // overlapping
                overlapping_intrs.push({shape:shape1, point1: shape1.pi, point2: shape1.pf})
            }
            return({basic: intrs, overlapping: overlapping_intrs});
        }
        // testing for intersection between v1->v2 and v2->v3 segments, 
    //Creo que el último no hay que darle la vuelta...
    for(let i1=0, i2=1; i1<path.elements.length-1; i1++, i2++) {
        let shape1 = path.elements[i1];
        let shape2 = path.elements[i2];
        //let shape2 = i < path.elements.length-1 ? path.elements[i+1] : path.elements[0];
        if(fuzzy_eq_point(shape1.pi, shape1.pf, pos_equal_eps)) {
            // singularity, si segmento nulo, TODO EVITAR ESTAS SITUACIONES
            overlapping_intrs.push({shape:shape1, point1: shape1.pi, point2:shape1.pf});
            continue;
            }
        let res = path_seg_intr(shape1, shape2, pos_equal_eps);
        switch(res.r){
            case Cut.NoIntersect: break;
            case Cut.TangentIntersect:
            case Cut.OneIntersect:
                if(!fuzzy_eq_point(res.point, shape1.pf))
                    intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point});
                break;
            case Cut.TwoIntersects:{
                if(!fuzzy_eq_point(res.point1, shape1.pf))
                    intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point1});
                if(!fuzzy_eq_point(res.point2, shape1.pf))
                    intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point2});
                break;
                }
            case Cut.OverlappingLines:
            case Cut.OverlappingArcs:
                overlapping_intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, sameDirection:res.sameDirection, point1:res.point1, point2:res.point2}); 
                overlapping_points.push(res.point1, res.point2)   
                break;
            }
        }
    return({basic: intrs, overlapping: overlapping_intrs});
}

/// Visits all global self intersects of the polyline. Global self intersects are defined as between
/// two polyline segments that do not share a vertex.
///
/// In the case of two intersects on one segment the intersects will be added as two
/// [PlineBasicIntersect] in the order of distance from the start of the second segment.
///
/// In the case of an intersect at the very start of a polyline segment the vertex index of the
/// start of that segment is recorded (unless the polyline is open and the intersect is at the very
/// end of the polyline, then the second to last vertex index is used to maintain that it represents
/// the start of a polyline segment).
export function visitGlobalSelfIntersects( path, pos_equal_eps = geometryPrecision)
{
    let intrs = [];
    let overlapping_intrs = [];
    //Si es closed, el constructor debe meter el shape correspondiente al final-comienzo y segments sería 2
    if(path.elements.length <= 2)
        return({basic: intrs, overlapping: overlapping_intrs});
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
    let res = {r:Cut.NoIntersect};
    let nsegments = path.elements.length; //por legibilidad 
    for(let i1=0; i1 < nsegments; i1++){
        let shape1 = path.elements[i1];
        //YURRE: Hay dos tests que parecen contradictorios respecto a si el último vértice con el primero es intersect o no...
        //Dejo preparados ambos con el last j
        //YURRE: Intento compaginar ambos con el isClosed, más por el test que por necesidad
        let lastj = path.isClosed? (i1 == 0? nsegments-1 : nsegments) : nsegments;
        //let lastj = i1 == 0? nsegments-1 : nsegments;  //para 6 elementos serían (0,2),(0,3),(0,4),     (1,3),(1,4),(1,5),(2,4),(2,5),(3,5)
        //let lastj = nsegments;                          //para 6 elementos serían (0,2),(0,3),(0,4),[0,5],(1,3),(1,4),(1,5),(2,4),(2,5),(3,5)
        for(let i2=i1+2; i2 < lastj; i2++  ){
            let shape2 = path.elements[ i2];
            //Aquí sí meto en línea la comparación de aabbs, con continues porque es un for
            if(shape1.bbox.x0 > shape2.bbox.x1) continue;
            if(shape1.bbox.y0 > shape2.bbox.y1) continue;
            if(shape2.bbox.x0 > shape1.bbox.x1) continue;
            if(shape2.bbox.y0 > shape1.bbox.y1) continue;
            //console.log(i, j )
            res = path_seg_intr(shape1, shape2, pos_equal_eps)
            switch(res.r){
                case Cut.NoIntersect: break; //donothing
                case Cut.TangentIntersect:
                case Cut.OneIntersect:    //Hay que salta puntos que sean puntos finales porque volverán como iniciales en otro tramo
                    if(!fuzzy_eq_point(res.point, shape1.pf, pos_equal_eps))
                        intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point});
                    break;
                case Cut.TwoIntersects:{
                    if(!fuzzy_eq_point(res.point1, shape1.pf, pos_equal_eps))
                        intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point1});
                    if(!fuzzy_eq_point(res.point2, shape1.pf, pos_equal_eps))
                        intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, point:res.point2});
                    }
                    break;
                case Cut.OverlappingLines:
                case Cut.OverlappingArcs:
                    if(!fuzzy_eq_point(res.point1, shape1.pf, pos_equal_eps))
                        overlapping_intrs.push({shape1:shape1, ix1:i1, shape2:shape2, ix2:i2, sameDirection:res.sameDirection, point1:res.point1, point2:res.point2});    
                    break;
                }
            }
        }
    return{basic:intrs, overlapping:overlapping_intrs};
    }

/// Find all self intersects of a polyline. If `include_overlapping` is `true` then overlapping
// intersects are returned as two basic intersects, one at each end of the overlap. If
//  `include_overlapping` is `false` then overlapping intersects are not returned.
export function allSelfIntersectsAsBasic( path, include_overlapping, pos_equal_eps){
    let local = visitLocalIntersects(path, pos_equal_eps);
    let global = visitGlobalSelfIntersects(path, pos_equal_eps);
    let intrs = {basic: local.basic.concat(global.basic), overlapping:[] };
    if(include_overlapping){
        local.overlapping_intrs.forEach(int=>{
            intrs.basic.push({shape1: int.shape1, ix1: int.ix1, shape2: int.shape2, ix2: int.ix2, point:int.point1});
            intrs.basic.push({shape1: int.shape1, ix1: int.ix1, shape2: int.shape2, ix2: int.ix2, point:int.point2});
            })
        global.overlapping_intrs.forEach(int=>{
            intrs.basic.push({shape1: int.shape1, ix1: int.ix1, shape2: int.shape2, ix2: int.ix2, point:int.point1});
            intrs.basic.push({shape1: int.shape1, ix1: int.ix1, shape2: int.shape2, ix2: int.ix2, point:int.point2});
            })
        }
    return(intrs)
}


//YURRE: Junto en este fichero los tratamientos de cortes en paths
//YURRE: función para dividir los paths que se pasan por los puntos de corte, que también se pasan
//cada corte identifica su origen mediante los índices ip1, ip2 de path en el array de paths y ix1,ix2 de shapes dentro de cada path
//Si ip1 e ip2 no están definidos se pone el caso "normal" de dos paths ,
//Y si se pasa un solo path, pues el default es 0. 
//Se trata de usar la misma rutina general por simplificar el código aunque tarde algo más
export function sliceAtIntersects(  intrs , paths, pos_equal_eps = geometryPrecision){
    //pathIntersects será un array donde en cada elemento cuelga otro array de intersecciones de cada path
    //lo inicializo por sencillez. ATTON. La inicialización "a mano" es porque si no todos los "punteros" apuntan a un solo elemento vacío
    //y al escribir en él se escriben todos
    let pathIntersects = Array(paths.length);
    const ip2 = paths.length < 2 ? 0 : 1;
    for(let i=0; i< pathIntersects.length; i++) pathIntersects[i] = Array(0);
    //pathIntersects = pathIntersects.map(el=>new Array()); //Esto por ejmplo lo hace mal, parece que llama una vez y luego copia el puntero
    //Aglutino los del path1. Como he guardado el índice uso un array disperso en vez de un map, pasando de memoria
    intrs.basic.forEach(cut => {
        const p1 = cut.ip1 || 0;    //Para los casos de solo dos paths no he metido esta info en los cortes
        const p2 = cut.ip2 || ip2;
        if(pathIntersects[p1][cut.ix1] === undefined)  pathIntersects[p1][cut.ix1] = []; //inicializo 
        pathIntersects[p1][cut.ix1].push(cut.point) ;
        if(pathIntersects[p2][cut.ix2] === undefined)  pathIntersects[p2][cut.ix2] = []; //inicializo 
        pathIntersects[p2][cut.ix2].push(cut.point) ;
    });
    //No quiero perder info de overlap, así que extiendo la definición del punto
    intrs.overlapping.forEach((cut, i) => {
        const p1 = cut.ip1 || 0;    //Para los casos de solo uno o dos paths no he metido esta info en los cortes
        const p2 = cut.ip2 || ip2;
        if(pathIntersects[p1][cut.ix1] === undefined)  pathIntersects[p1][cut.ix1] = []; //inicializo 
        pathIntersects[p1][cut.ix1].push({x:cut.point1.x, y:cut.point1.y, ovp:i}, {x:cut.point2.x, y:cut.point2.y, ovp:i}) ;
        if(pathIntersects[p2][cut.ix2] === undefined)  pathIntersects[p2][cut.ix2] = []; //inicializo 
        pathIntersects[p2][cut.ix2].push({x:cut.point1.x, y:cut.point1.y, ovp:i}, {x:cut.point2.x, y:cut.point2.y, ovp:i}) ;
    });

    //Para cada path y cada slice ordenamos cada posible array de slices por su distancia al origen
    for(let ip = 0; ip < pathIntersects.length; ip++){
        if(pathIntersects[ip].length === 0) continue;   //los paths que no tienen cortes
        const intersects = pathIntersects[ip];
        const path = paths[ip];
        intersects.forEach((points, ix) => points = points.sort((a,b)=>{
            let pi = path.elements[ix].pi;
            return sqDistancePointToPoint(a.x, a.y, pi.x, pi.y) - sqDistancePointToPoint(b.x, b.y, pi.x, pi.y)
        }));
    
    }

    //En línea con lo dicho de separa los procesos, ahora generamos los arrays de slices y dejamos el filtrado para luego
    //Puesto que vamos a modificar los paths, clonamos cada elemento
    //Se puede hacer el atajo para los paths sin cortes, pero no sé si ahorramos gran cosa porque total clonamos...
    let pathSlices = [];
    paths.forEach((path,ip) => {
        let slices = [];
        path.elements.forEach( (shape, ix) => {
            if(! pathIntersects[ip][ix]) 
                slices.push( blockClone(shape));
            else{ //Hay que dividirlo
                const points = pathIntersects[ip][ix]; //un elemento puede tener varios cortes
                slices.push(...blockSplitAtPoints(shape,points, pos_equal_eps));
                }
            })   
    
        pathSlices.push(slices);
    });

    //Devuelvo dos arrays de segmentos y arcos con los que hay que construir la operación booleana
    return pathSlices;
}

// Rutina complementaria, aquí se pegan los trozos una vez eliminados los que no valen
//YURRE: Se le llama a veces con los slices de 1 path, en plan buscar trozos de un mismo path original
//y otras con slices ya previamente trabajados, así que miro el tipo de argumento, si es array son slices
export function stitchSlices( allSlices, options){
    let result = [];
    if (allSlices.length === 0) return result;

    let join_eps = options.slice_join_eps || geometryPrecision;
    let pos_equal_eps = options.pos_equal_eps || geometryPrecision;
    function stitchLocal(theSlices){
        let finalSlices = [];   //la idea es empalmar tramos y luego esos tramos entre ellos...
        let actual_path = [];
        let slices = theSlices;
        //Los slices ya vienen todos con el visited a false, eso se controla fuera
        while(1){
            let s = slices.find(s=>!s.visited); //La primera vez será el primero
            if(s === undefined) break;         //No quedan slices sin visitar
            let start = s.shapes[0];
            let end = s.shapes[s.shapes.length-1];
            actual_path = s.shapes;    //ya es un array
            s.visited = true;
            for(let i = 0; i < slices.length; i++ ){ //es un array de objetos simil path
                s = slices[i];
                if(s.visited) continue;
                if(fuzzy_eq_point(s.shapes[0].pi, end.pf, pos_equal_eps )){
                    actual_path = actual_path.concat(s.shapes);
                    end = s.shapes[s.shapes.length-1];
                    s.visited = true;
                } else if(fuzzy_eq_point(s.shapes[s.shapes.length-1].pf, start.pi , join_eps)){
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
    let slices = allSlices.map(s=>Array.isArray(s)?s:[s]);
    let nPaths = slices.length+1; //por inicializar y que pase. Cuando ya no mejora, se sale
    while((nPaths > slices.length) && (slices.length > 1)  ){
        nPaths = slices.length;
        slices = stitchLocal(slices.map(s=>({visited:false, shapes:s})));
    }
    //Aquí en slices quedan los trozos que no se dejan juntar
    return slices;
}

