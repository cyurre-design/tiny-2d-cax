import {parallelOffset, sliceIsValid } from './cy-path-offset.js'
import {findIntersects, sliceAtIntersects, stitchSlices} from './cy-cuts-full-paths.js'
import {BPath, ComplexPath} from './cy-geometry-extended-elements.js'

//YURRE: pathSlices y allPaths tienen la misma dimensión. allPaths son los originales (mezcladas cajeras e islas)
// mientras que en pathSlices están los shapes de cada uno pero ya cortados en los puntos de corte
// Hay que elegir aquellos que no colisionen con los paths originales más el offset
// Usamos una rutina más o menos general, sliceIsValid.
// Con su propio path no habría colisiones porque lo quita la paralleloffset original, creo
function validateSlices(pathSlices, allPaths, offset, options){
    pathSlices = pathSlices.map((sliceSet, ip) => sliceSet.filter( (slice) => {
        let v = allPaths
        .filter((p,ix)=> (ix !== ip))
        .every((path, ip) =>sliceIsValid(slice, path, offset));
        return v;
        })
    );
    return pathSlices;
}

//YURRE: he definido al revés, offset >0 es a la derecha, Atton donde se use offset
export function complexParallelOffset( complex, offset, options){
        let pos_equal_eps = options.pos_equal_eps;
        let offset_dist_eps = options.offset_dist_eps;
        let slice_join_eps = options.slice_join_eps;
        // generate offset loops
        let opts = {    //Para modificar, si acaso, antes de pasar a la parallel_offset
            //aabb_index: Some(&self.spatial_index),
            handle_self_intersects: false,
            pos_equal_eps: options.pos_equal_eps,
            slice_join_eps: options.slice_join_eps,
            offset_dist_eps: options.offset_dist_eps,
        };
        //generación de las pasadas de la cajera
        //Por cada path de cajera puede volver un array de ellas por auto-intersecciones
        let offsetsCajera = complex.cajeras.map(path => parallelOffset(path, offset, opts)).flat();
        // check if orientation inverted (due to collapse of very narrow or small input)
        // skip if inversion happened (ccw became cw while offsetting inward)
        //YO esto de que cambie de orientación no sé si lo veo, si pasa algo así casi que es un error?!
        //TODO comprobar que sigue siendo ccw
        offsetsCajera.forEach((path, ix)=>{
            if(path.orientation() !== 'ccw') {console.log('cambio de sentido en offset??'); return;}
            //O le damos la vuelta a mano??
            //let area = offsetCajera.area();
            //if ((offset < 0) && (area < 0)) continue; //YURRE: Offset cambiado de signo
            //path.parent = ix; //referenciamos cada offset con su padre, igual mejor una referencia de otro tipo?
        })
        //generación de las pasadas de cada isla y anotación de su procedencia
        //También podríamos hacer esto como opción y si no se quiere, no hacer offset de las islas
        //El signo del offset depende de la orientación, aquí, como las islas son cw, un offset<0 va por fuera
        //De cada isla también pueden salir varios paths en islas complejas
        let offsetIslas = complex.islas.map(path => parallelOffset(path, offset, opts)).flat();

        offsetIslas.forEach((path,parentIdx) => {
                // check if orientation inverted (due to collapse of very narrow or small input)
                // skip if inversion happened (ccw became cw while offsetting inward)
                if(path.orientation() !== 'cw') {console.log('cambio de sentido en offset??'); return;}
                //O le damos la vuelta a mano??    
                //let area = offsetPath.area();
                //if ((offset > 0) && (area > 0)) continue; //YURRE: Offset cambiado de signo
                //offsetPath.parent = path; //referenciamos cada offset con su padre, igual mejor una referencia de otro tipo?
        });
        if((offsetsCajera.length === 0) && (offsetIslas.length===0))  // no offsets remaining
            return new ComplexPath([],[]); //YURRE: devolver arrays vacíos
        //TODO ESTUDIAR CASOS DE NO ISLAS O NO CAJERA,
        //Estos son los bucles chungos que hay que optimizar pero a poder ser sin perder la estructura del programa

        //YURRE: Es el mismo tipo de código y algoritmo que las operaciones boolenas
        //Para cada path se debe optimizar mirando si hay posibilidad de corte con el resto de paths
        //Se buscan todas las intersecciones de paths, todos con todos, pueden ser varios paths de cajera por autocolisiones
        //La verdad es que juntar cajeras e islas a este nivel simplifica el número de bucles a coste de algún if
        //const nCajeras = offsetsCajera.length;
        const nIslas = offsetIslas.length;
        const allPaths = offsetsCajera.concat(offsetIslas);
        let allIntrs = { overlapping: [],  basic: [], overlapPoints: []}
        if(nIslas >= 1){ //si no, ni miro, porque las cajeras ya se han autocortado (creo)
            for(let i=0; i < allPaths.length; i++){
                let path1 = allPaths[i];
                for(let j=i+1; j < allPaths.length; j++){  //01,02,03 12,13  23...
                    let path2 = allPaths[j];
                    let intrs = findIntersects( path1, path2, opts);
                    if (intrs.basic.length === 0  && intrs.overlapping.length === 0) continue;
                    intrs.basic.forEach(int=>{int.ip1=i; int.ip2=j;})
                    intrs.overlapping.forEach(int=>{int.ip1=i; int.ip2=j;})
                    allIntrs.basic = allIntrs.basic.concat(intrs.basic);   
                    allIntrs.overlapping = allIntrs.overlapping.concat(intrs.overlapping);   
                    allIntrs.overlapPoints = allIntrs.overlapPoints.concat(intrs.overlapPoints); 
                }
            } 
        }

        //YURRE, quito puntos repes, creo REVISAR!!!!
        allIntrs.basic = allIntrs.basic.filter(intr=>!allIntrs.overlapPoints.find( p => fuzzy_eq_point(p, intr.point)));
        if((allIntrs.basic.length === 0) && (allIntrs.overlapping.length===0))
            return new ComplexPath(offsetsCajera, offsetIslas);
        //Aquí se juntan los puntos de intesección para hacer el slicing de las curvas
        let pathSlices = sliceAtIntersects(allIntrs, allPaths, pos_equal_eps);
        //Se validan con los paths originales, claro
        //NO hay que filtrar todavçia los arrays de slices vacíos, porque el índice en los paths sirve para no mirar el propio
        const originalPaths = complex.cajeras.concat(complex.islas);
        pathSlices = validateSlices(pathSlices, originalPaths, offset, opts) ;   
        //Una pasada "local" devolvería trozos ligados
        pathSlices = pathSlices.filter(path => path.length > 0).map(path=>stitchSlices(path, opts));
        //pathSlices devuelve un array de arrays de slices que están pegados, para volver a llamar se pasan los arrays planos
        //Y lo que queda lo vuelvo a intentar coser. Se podrían quitar las que ya son closed !!!
        pathSlices = stitchSlices(pathSlices.flat(), opts);
        pathSlices = pathSlices.map(path=> new BPath(path));
        let ccwPaths = [], cwPaths = [];
        pathSlices.forEach(path=>{
            if(!path.isClosed) console.log('se ha abierto algún path!!?');
            else{
                if(path.orientation() === 'ccw')
                    ccwPaths.push(path) ;
                else
                    cwPaths.push(path);
            }
        })
        return new ComplexPath( ccwPaths, cwPaths)
    }
