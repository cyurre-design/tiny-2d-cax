import {createDrawElement} from  '../cy-geometry/cy-geometry-basic-elements.js'
import {blockSymmetryX, blockSymmetryY, blockRotate, blockTranslate, checkBbox} from '../cy-geometry/cy-geometry-library.js'
//Convierte los commandos opentype a objetos de la librería geométrica
//usamos un solo interface y la librería ahora va sin clases
function path2geo(commands){
    let paths = [];
    let elements = [];
    let initial = {x:0, y:0};
    let pos = {x:0, y:0};
    commands.forEach(cmd=>{
        switch(cmd.type){
            case 'M':
                if(elements.length > 0){
                    paths.push(createDrawElement('path',{elements: elements}));
                    elements = [];
                }
                initial.x = cmd.x;
                initial.y = cmd.y;
                break; 
            case 'Z':
                elements.push(createDrawElement('segment', {subType:'PP', x0: pos.x, y0:pos.y, x1:initial.x, y1:initial.y}));
                break;
            case 'L':
                elements.push(createDrawElement('segment', {subType:'PP', x0: pos.x, y0: pos.y, x1:cmd.x, y1:cmd.y}));
                break; 

            case 'C': //cubic bezier, pueden venir varias pero son independientes
                elements.push(createDrawElement( 'bezier', {subType:"C", x0:pos.x, y0:pos.y, cp1x:cmd.x1, cp1y:cmd.y1, cp2x:cmd.x2, cp2y:cmd.y2, x1:cmd.x, y1:cmd.y}));           
            break;
            case 'Q': //quadratic Bezier, pero la rutina de cúbica debe adaptarlo
                elements.push(createDrawElement( 'bezier', {subType:"Q", x0:pos.x, y0:pos.y, cp1x:cmd.x1, cp1y:cmd.y1, x1:cmd.x, y1:cmd.y}))           
            break;
            default:
                console.log('ERROR');
        }
        pos.x = cmd.x;
        pos.y = cmd.y;
    })
    if(elements.length > 0){
        paths.push(createDrawElement('path',{elements: elements}));
        elements = [];
    }    
    return(paths);
}

//esperamos array en principio, pero puede venir todo junto
//Las fuentes de opentype vienen entre -y y 0, con eso el baseline es 0 y se pintan "derechas"
//por cómo funcionan las coordenadas svg.
//les damos la vuelta para que las funciones de nuestra geometría sean "naturales"
// NO uso sus bboxes porque la librería actual ya lo calcula al hacer un path

export function textToOpentypePaths(text, font, size){
    //Aquí usamos un path(o array de paths) por carácter, los separamos, sin kerning!
    let fontPaths = font.getPaths(text, 0, 0, parseFloat(size));
    //calculo sus boundingBoxes
    //let bbs = fontPaths.map(p=>p.getBoundingBox()); //el bb puede ser compartido por los paths del carácter(ej, A)
    //Los bbs que ofrece la librería no son "reales" porque permite letras como y por debajo, o por encima
    //Hay que usar estos bboxes para que el texto quede natural
    //A partir de aquí les doy la vuelta y calculo su anchura y centro por comodidad
    //Habría que ver el tamaño de la última letra porque igual es un poco más que el bb        
    //textWidth = bbs[bbs.length-1].x2; //empieza en 0 aunque la letra empiece un poco más allá - bbs[0].x1; //esto se mapea al ángulo width/r
    //textHeight = Math.max(...bbs.map(b=>-b.y1));
    //Tenemos los paths (Beziers) 
    return (fontPaths) 
}
export function textToGeometry(text, font, size ) {
    if((text===undefined) || (text.length === 0))
        return([]);
    let paths = textToOpentypePaths(text, font, size);
    let geoPaths = paths.map(p=>path2geo(p.commands)); // algunos tienen más de 1 path...
    //Hay muchas letras que implican MAS DE 1 PATH (A,O,...) pero el BB es compartido, claro, guardo el índice
//    geoPaths.forEach((p,ix)=>Array.isArray(p)?p.forEach(sp=>sp.ix=ix):p.ix=ix);
    geoPaths= geoPaths.flat(); //cada path lleva un índice de qué número de letra es, porque por ejemplo la O tiene 2 paths
    geoPaths = geoPaths.map(p=> {  //Hago COPIA de los bbs porque luego voy a modificarlos y por referencia se machacan
//        let b = bboxes[p.ix];
        //Les doy la vuelta a los paths respecto al eje Y
        const newP = blockSymmetryX(p, 0);
        //me preparo la info que luego uso para rotar, etc.. los bb NO son iguales que los bboxes geométricos
//        newP.bb = { y1 : -b.y1, y2 : -b.y2, w : b.x2 - b.x1, cx : 0.5*(b.x1+b.x2), cy : -0.5*(b.y1+b.y2)}
        return newP;
    });
    //Hasta aquí tenemos los elementos sin transformar, sería el caso normal, sin invert, etc...
    return geoPaths; 
}
//Esto en realidad valdría para otros iconos o dibujos...
//Los paths vienen con su BB...
/**@todo hay que usar en principio nuestros bboxes...?! */
/**
 * 
 * @param {Array of object paths} paths 
 * @param {Number} alfa where to start text 
 * @param {Number} radius of the circle to put text around
 * @param {String} way 'clock' or 'antiClock' 
 * @param {Boolean} invert
 * @returns 
 */
export function transformTextGeometry(paths, radius, alfa, way, invert){
    let angle = +alfa;
    let r = +radius;
    let geoPaths = paths;
    let bbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
    geoPaths.forEach(p => bbox = checkBbox(bbox, p.bbox));
    const centerx = 0.5*(bbox.x0+bbox.x1);  //este es común
    const textWidth = bbox.x1 - bbox.x0;
    //si hay que invertir, lo hago lo primero, las transformaciones solo devuelven parte geométrica
    if(invert){
        geoPaths = paths.map(p=> blockSymmetryY(p, centerx));
    } else {
        geoPaths = paths;
    } //No voy a tratar el angle de inclinación porque ya existe la transformación en la geometría

    if(r === 0) return geoPaths; //o sea no hacemos nada 
    if(textWidth >= 2*Math.PI*r)    //por si meten más caracteres que los que caben, aumentamos el tamaño
        r = textWidth / (2*Math.PI);
    //Prueba, usando el bbox de librería, pero hay que tener cuiado con mayúsculas y minúsculas...
    if(way === "antiClock"){
        const centery = r + bbox.y0 ; //lo definimos para la línea de arriba
        geoPaths = geoPaths.map(p=>{          //punto de referencia será cx, r +h
            const dx = centerx - 0.5*(p.bbox.x0 + p.bbox.x1) ; //posición x relativa al centro del texto (de los paths)
            let newP = blockTranslate(p, dx, 0);   //esto lo coloca en la la mitad
            newP = blockRotate(newP, centerx, centery, -(dx / r) - angle); //los giro según su posición
            return newP;
            })
        }
    else{
        const centery = bbox.y0 - r ; //lo definimos para la línea central
        geoPaths = geoPaths.map(p=>{//punto de referencia será cx, r 
            const dx = centerx - 0.5*(p.bbox.x0 + p.bbox.x1) ; //posición x relativa al centro del texto (de los paths)
            let newP = blockTranslate(p, dx, 0);   //esto lo coloca en la la mitad
            newP = blockRotate(newP, centerx, centery, (dx / r) - angle); //los giro según su posición
            return newP;
        })
    }
    return geoPaths;
}





    // //Ahora que los paths tienen su bbox de fábrica, uso la libería geométrica para las transformaciones
    // let fullBbox = {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity};
    // paths.forEach( p => fullBbox = checkBbox(fullBbox, p.bbox));
    // //No tenemos un centro y hay que tomar una decisión sobre él.
    // //Si es clockwise, ponemos el centro por debajo del texto, si no, por encima
    // //Hay que rotar cada path de forma proporcional a su distancia al centro del bbox
    // //porque queremos mantener ahí el centro. Luego se puede gestionar en pantalla
    // const width = fullBbox.x1 - fullBbox.x0;
    // const height = fullBbox.y1 - fullBbox.y0;
    // if(width >= 2*Math.PI*r)    //por si meten más caracteres que los que caben, aumentamos el tamaño
    //     r = width / (2*Math.PI);
    // //Cojo el centro de giro en función de way...
    // let centrox = fullBbox.x0 + 0.5*width;
    // let centroy = fullBbox.y0  /*+ 0.5*height*/;
    // centroy =  (way === 'clock') ? centroy - r: centroy + r;
    // console.log(centrox, centroy)
    // //de hecho, el ángulo total es (width/r) * 2pi en radianes
    // const newPaths = paths.map( p => {
    //     const cx = 0.5*(p.bbox.x0 + p.bbox.x1);
    //     const a =  (way === 'clock') ? (0.5*width - cx ) / r : (cx - 0.5*width) / r;
    //     console.log(a*180/Math.PI);
    //     return blockRotate(p, centrox, centroy, a);
    //})



