
import { fuzzy_eq_point, blockReverse } from "./cy-geometry-library.js";
import { createDrawElement } from "./cy-geometry-basic-elements.js";
/**
 * 
 * @param tol @todo solucionar el paso de la base de datos...
 * @returns 
 */
export function unlinkPaths(paths){
    let newBlocks = [];
    paths.forEach( p => {
        if(p.type !== 'path'){
            newBlocks.push(p);
        } else {
            //Si es un path, lo desenlazamos en sus elementos
            p.elements.forEach(e => newBlocks.push(e));
        }
    });
    return newBlocks;
}

export function linkPaths(allPaths, tol = 0.1){
    //Algoritmo 1, junta los que están seguidos y convierte todo a pthas (con su pi, pf, bbox)
    function blocksToPaths( allBlocks, tol){
        //rutina link de toda una capa
        let paths = []; //Donde los vamos a dejar
        //el primer bloque no empalma con nada y nos va a meter un array vacío en paths.
        //Lo quitaremos al final, pero el bucle queda más limpio
        let linked = [], head = {x: Infinity, y:Infinity}, tail = {x:Infinity, y:Infinity};
         //array de referencias, para hacer shifts sin machacar el original
        const blocks = allBlocks.filter(b => (b.type === 'segment' || b.type === 'arc' || b.type === 'bezier'));
        let b;
        for(let ix=0; ix < blocks.length; ix++){
            b = blocks[ix];
            if(fuzzy_eq_point(tail, b.pi, tol)){ //por la "derecha"
                linked.push(b);
                tail = b.pf;
            } else if(fuzzy_eq_point(tail, b.pf, tol)){            //por la "derecha" invertido
                linked.push( blockReverse(b));                      //Tiene que ser un reverse no destructivo porque si no no furrula
                tail = b.pi;
            } else if(fuzzy_eq_point(head, b.pf, tol)){ //por la "izquierda"
                linked.unshift(b);
                head = b.pi;
            } else if(fuzzy_eq_point(head, b.pi, tol)){ //por la izquierda invirtiendo
                linked.unshift(blockReverse(b));
                head = b.pf;
            } else { //Uno que no empalma...el primero será uno vacío
                paths.push(linked); //solo guardo de momento los elementos
                linked = [b];
                head = b.pi, tail = b.pf;
                }
            }
        if(linked.length > 0) paths.push(linked);
        paths.shift(); //el morrallero inicial
        paths = paths.map(p => createDrawElement('path', {elements : p}));
        //le pegamos los que ya eran paths en origen , si los hubiera
        paths = paths.concat(allPaths.filter( b => b.type === 'path'));
        return paths;
    }

    //Algoritmo 2, los paths todos contra todos
    //TODO meter los bboxes para que salga si no empalma
    function stitch(paths, tol){
        let linkedPaths = [];
        let linked = [], head, tail;
        let dummy = 0;
        while(1){
            //console.log(dummy++);
            let p = paths.find(p=>!p.linked); //La primera vez será el primero
            if(p === undefined) break;         //No quedan slices sin visitar
            linked = p.elements;
            head = p.pi, tail = p.pf;
            p.linked = true;
            for(let ix=0; ix < paths.length; ix++){
                const b= paths[ix]
                if(b.linked) continue;
                if(fuzzy_eq_point(tail, b.pi, tol)){ //por la "derecha"
                    linked = linked.concat(b.elements);
                    b.linked = true;
                } else if(fuzzy_eq_point(tail, b.pf, tol)){            //por la "derecha" invertido
                    linked = linked.concat( blockReverse(b).elements);
                    b.linked = true;
                } else if(fuzzy_eq_point(head, b.pf, tol)){ //por la "izquierda"
                    linked = b.elements.concat(linked);
                    b.linked = true;
                } else if(fuzzy_eq_point(head, b.pi, tol)){ //por la izquierda invirtiendo
                    linked = blockReverse(b).elements.concat(linked);
                    b.linked = true;
                }
                head = linked[0].pi; tail = linked[linked.length-1].pf;
            }
            linkedPaths.push(createDrawElement('path',{elements:linked})); //entra con linked a false
        }
        return linkedPaths;
    }
       //YURRE: Esto ye una conjetura, que la parte de intersección tiene menos trozos que las propias...
    //La alterntiva es un bucle único con todos los slices juntos
    let slices = blocksToPaths(allPaths, tol);

    //test1
    //if(slices.find(p=>p.elements.find(b=>b.type==='path')))
    //    console.log('error')
    let nPaths = slices.length+1; //por inicializar y que pase. Cuando ya no mejora, se sale
    while((nPaths > slices.length) && (slices.length > 1)  ){
        nPaths = slices.length;
        //console.log(nPaths);
        slices.forEach(s => s.linked = false);
        slices = stitch(slices, tol);

    }
    //test2
    if(slices.find(p=>p.elements.find(b=>b.type==='path')))
       console.log('error')
    //Aquí en slices quedan los trozos que no se dejan juntar
    return slices;
}
