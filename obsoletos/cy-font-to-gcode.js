'use strict'
// import  {Segment} from  "./cy-geometry/cy-geo-elements/cy-segment.js"
// import  {Path} from "./cy-geometry/cy-geo-elements/cy-path.js"
// import { Bezier } from "./cy-geometry/cy-geo-elements/cy-bezier.js"
// import * as isoConverter from "./cy-parse-iso.js"
//import {pathsToGeometry} from './cy-parse-svg.js'

//VERSION SERVIDOR
//import * as opentype from "file://C:/Archivos de programa/nodejs/node_modules/opentype.js/dist/opentype.js"
//VERSION CLIENTE
import  './opentype.js'
//Recibo un array de comandos como lo devuelve openType

//esto se ejecutaría en el import...
var font;
//las hacemos globales al módulo por comodidad
//Habría que tratar las woff, etc...?
//TODO ASYNC
// export function loadFontServer(fontName = 'Roboto-Regular'){
//     return(new Promise((resolve,reject)=> {
//         opentype.load(`./${fontName}.ttf`, (err,data)=>{
//         if(err){ reject('unsupported font')};
//         let buffer = data.toArrayBuffer();
//         //font = opentype.parse(buffer);
//         resolve(opentype.parse(buffer));
//     })
//     }))
//     }

// export function loadFont(fontName = 'Roboto-Regular', todo = (font)=>{}){
//     opentype.load(`./${fontName}.ttf`, (err,data)=>{
//         //var font;
//         if(err){
//             return('unsupported font');
//         }
//         let buffer = data.toArrayBuffer();
//         font = opentype.parse(buffer);
//         todo( font);
//     })
// }
// export function test( text, size, alfaM, radius, way){
//     console.log(text2ISO8070(text, size, alfaWidth, radius, way));
// }

//esperamos array en principio, pero puede venir todo junto
//Las fuentes de opentype vienen entre -y y 0, con eso el baseline es 0 y se pintan "derechas"
//por cómo funcionan las coordenadas svg.
//les damos la vuelta para que las funciones de nuestra geometría sean "naturales"
export function textToGeometry(text, size, alfaM, radius, way, invert) {
    if((text===undefined) || (text.length === 0))
        return([]);
    let angle = +alfaM;
    let r = +radius;
    //angle = angle * Math.PI / 180;
    //Aquí usamos un path(o array de paths) por carácter, los separamos, sin kerning!
    //let fontPaths =text.split('').map(char=>font.getPath(char, 0, 0, parseFloat(size)));
    let fontPaths = font.getPaths(text, 0, 0, parseFloat(size));
    let bbs = fontPaths.map(p=>p.getBoundingBox()); //el bb puede ser compartido por los paths del carácter(ej, A)
    //A partir de aquí les doy la vuelta y calculo su anchura y centro por comodidad
    //Habría que ver el tamaño de la última letra porque igual es un poco más que el bb        
    let width = bbs[bbs.length-1].x2; //empieza en 0 aunque la letra empiece un poco más allá - bbs[0].x1; //esto se mapea al ángulo width/r
    let height = Math.max(...bbs.map(b=>-b.y1));

    let geoPaths = fontPaths.map(p=>path2geo(p.commands)); //en nuestra librería geo. pero algunos tienen más de 1 path...
    //Hay muchas letras que implican MAS DE 1 PATH (A,O,...) pero el BB es compartido, claro, apunto el índice
    geoPaths.forEach((p,ix)=>Array.isArray(p)?p.forEach(sp=>sp.ix=ix):p.ix=ix);
    geoPaths= geoPaths.flat();
    geoPaths.forEach(p=> {  //Hago COPIA de los bbs porque luego voy a modificarlos y por referencia se machacan
        let b = bbs[p.ix];
        p.bb = { y1 : b.y1, y2 : b.y2, w : b.x2 - b.x1, cx : 0.5*(b.x1+b.x2), cy : 0.5*(b.y1+b.y2)}
    });
    //Les doy la vuelta a los paths respecto al eje Y, los bbs ya les he dado la vuelta antes
    geoPaths.forEach(p=>p.symmetryY(0));
    //Aquí ya tengo un array de paths junto con sus bbs
    if(invert){
        geoPaths.forEach(p=>{ 
            p.symmetryX(0.5*width);
            p.bb.cx = width - p.bb.cx
        });    //Vienen las letras coordenadas svg
    }
    if(r === 0){
        if(angle!==0){  //recto pero inclinado       // a = a*Math.PI/180;
            geoPaths.forEach(p=>p.rotate(0,0,angle));
        }

    }else{

    //Lo pasamos a elementos geométricos nuestros
        //Debido a que he usado la rutina getpaths, los paths tienen coordenadas absolutas desde 0 a width
        //trasladamos cada caracter i a  (cx[i], r) y luego lo giramos en función de la posición cx[i]
        //Podemos querer ángulos crecientes o decrecientes (tipo G2,G3)  
        if(width >= 2*Math.PI*r)    //por si meten más caracteres que los que caben, aumentamos el tamaño
            r = width / (2*Math.PI);
        if(way === "anticlockwise"){
            geoPaths.forEach(p=>{          //punto de referencia será cx, r +h
                p.translate(p.bb.cx, r + height); 
                const alfa =  (-0.5*width + p.bb.cx ) / r;
                p.rotate(0,0,alfa*180/Math.PI + angle);
                })
            }
        else{
            geoPaths.forEach(p=>{//punto de referencia será cx, r 
                p.translate(p.bb.cx, -r);   //esto lo coloca a 90 grados, o sea en la vertical
                const alfa =  (0.5*width - p.bb.cx ) / r;
                p.rotate(0,0,alfa*180/Math.PI - angle);
            })
        }
    }
    //Meto el círculo? o el Bbox? meto un objeto y lo paso hacia arriba...
    geoPaths.unshift({ r:r, h:height, w:width});
    return(geoPaths);   
}
export function textToSVG(text, size, angle=0, radius=0, way='clockwise', invert= false){
    let geoPaths = textToGeometry(text, parseFloat(size), parseFloat(angle), parseFloat(radius), way, invert);
    let bBox = geoPaths.shift();
    const d = geoPaths.reduce((d,p)=>d+=geo2svg(p),'');
    return(JSON.stringify({b:bBox,d:d}));
}
//Covierte los commandos opentype a objetos de nuestra librería geométrica
function path2geo(commands){
    let paths = [];
    let elements = [];
    let initial = {x:0, y:0};
    let pos = {x:0, y:0};
    commands.forEach(cmd=>{
        switch(cmd.type){
            case 'M':
                if(elements.length > 0){
                    paths.push(new Path(elements));
                    elements = [];
                }
                initial.x = cmd.x;
                initial.y = cmd.y;
                break; 
            case 'Z':
                elements.push(new Segment( pos.x, pos.y, initial.x, initial.y));
                break;
            case 'L':
                elements.push(new Segment( pos.x, pos.y, cmd.x, cmd.y));
                break; 

            case 'C': //cubic bezier, pueden venir varias pero son independientes
                elements.push(new Bezier(pos.x, pos.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y))           
            break;
            case 'Q': //quadratic Bezier, pero la rutina de cúbica debe adaptarlo
                elements.push(new Bezier(pos.x, pos.y, cmd.x1, cmd.y1, cmd.x, cmd.y))           
            break;
            default:
                console.log('ERROR');
        }
        pos.x = cmd.x;
        pos.y = cmd.y;
    })
    if(elements.length > 0){
        paths.push(new Path(elements));
        elements = [];
    }    
    return(paths);
}

//Convierte texto en la fuente que esté seleccionada a código ISO
//Faltaría cargar la fuente cuando se haga con el ciclo en ejecución
export function text2ISO8070(text, size, angle, radius, way, invert=false, anchor = 0, origin={x:0,y:0} ) {
    const geo = textToGeometry(text, parseFloat(size), parseFloat(angle), parseFloat(radius), way, invert);
    let bb = geo.shift();
    //Con el punto de anclaje y el traslado decidimos las cotas finales
    let points = getAnchorPoints(bb,angle,way);
    let offset = points[(anchor <= points.length? anchor: 0)];
    offset.x -= origin.x; offset.y -= origin.y;
    geo.forEach(p=>p.translate(offset.x, offset.y));
    //FALTAN LOS TEMAS DE CONFIG ?
    const prg = isoConverter.FgParserIsoGeometry.fromGeometry(geo);
    //TEST
    isoConverter.FgParserIsoGeometry.toGeometry(prg);
    return (prg);

    }
    
//INTENTAR USAR LAS CLASES ES UN POCO PESADILLA; COMO LAS CEREZAS; TE LLEVAS TODO
//ES MEJOR QUE LAS PARTES FUNCIONALES SEAN FUNCIONALES
function geo2svg(pathToDraw) {
    let out = '';
    pathToDraw.elements.forEach(el => {
//      let clase = `${el.selected ? ' selected' : ''}${(pathToDraw.highlighted || el.highlighted) ? ' highlighted' : ''}${el.temporal ? ' temporal' : ''}${el.visible ? '' : ' hide'}`;
      switch(el.type) {
        // case 'point':
        // case 'error': //just in case
        //       break;    //se puede pintar un puntito cuadrado , por ejemplo
        case 'segment': out += (` M ${el.pi.x} ${el.pi.y} L ${el.pf.x} ${el.pf.y}`);    break;
        case 'arcCircle':
        case 'arc':
          out +=  (` M ${el.pi.x} ${el.pi.y} A ${el.r} ${el.r} 0 0 ${el.pathway} ${el.pm.x} ${el.pm.y} A ${el.r} ${el.r} 0 0 ${el.pathway} ${el.pf.x} ${el.pf.y}`); break;
//        case 'chamfer': out += (`M ${el.pi.x} ${el.pi.x} L ${el.pf.x} ${el.pf.x}`);    break;
//        case 'round': out += (`M ${el.pi.x} ${el.pi.y} A ${el.r} ${el.r} 0 ${el.largeArcFlag} ${el.pathway} ${el.pf.x} ${el.pf.y}`); break;
//        case 'tangentialEntry': out += (`M ${el.segment.pi.x} ${el.segment.pi.y} L ${el.pi.x} ${el.pi.y} A ${el.r} ${el.r} 0 ${el.largeArcFlag} ${el.pathway} ${el.pf.x} ${el.pf.y}`););break;
//        case 'tangentialExit': out +=(`M ${el.pi.x} ${el.pi.y} A ${el.r} ${el.r} 0 ${el.largeArcFlag} ${el.pathway} ${el.pf.x} ${el.pf.y} L ${el.segment.pf.x} ${el.segment.pf.y}`);break;
//        case 'polygon': out +=(`M ${el._points[0].x} ${el._points[0].y} ${el._points.slice(1).reduce((acc,p)=>acc+=` L ${p.x} ${p.y}`, out)} Z`); break;
        case 'bezier': out+= (` M ${el.pi.x} ${el.pi.y} C ${el.cp1.x} ${el.cp1.y} ${el.cp2.x} ${el.cp2.y} ${el.pf.x} ${el.pf.y}`); break;
        case 'arcEllipse': out += (` M ${el.pi.x} ${el.pi.y} A ${el.rx} ${el.ry} ${el.fi} ${el.flagLarge} ${el.flagSweep} ${el.pf.x} ${el.pf.y}`);break;
        default:  console.log('unsupported drawing element'); break;
        }
    });
    return out;
  }
//devuelve los puntos de ancla
export function getAnchorPoints(bb,angle,way='clockwise'){
    let points=[];
    if(bb.r === 0){ //en lineal
        const dx = 0.5*bb.w;
        const dy = 0.5*bb.h;
        const a = angle * Math.PI / 180;
        function rotate(p, c, s){
            return({x: c*p.x - s*p.y, y: s*p.x + c*p.y});
        }
        points = [{x:0,y:0}, {x:dx,y:0}, {x:bb.w,y:0}, {x:0,y:dy}, {x:dx,y:dy}, {x:bb.w,y:dy}, {x:0,y:bb.h}, {x:dx,y:bb.h}, {x:bb.w,y:bb.h}]
        points = points.map(p => rotate(p, Math.cos(a), Math.sin(a)));
    }else{
        const r1 = bb.r;
        const r2 = r1+bb.h;
        const w = bb.w;
        const da = 0.5*w/r1; //el arco va de angle-da a angle+da
        //defino orígenes de ángulo "naturales", arriba para clock, abajo para counterclock
        const a = way==='clockwise'?Math.PI*(0.5-angle/180):Math.PI*(1.5+angle/180);
        //const fl = w > r1*Math.PI?1:0; //flag de large arc
        //9 puntos + el centro de la circunferencia
        points = [{x:r1*Math.cos(a+da), y:r1*Math.sin(a+da)},{x:r1*Math.cos(a), y:r1*Math.sin(a)}, {x:r1*Math.cos(a-da), y:r1*Math.sin(a-da)},
            {x:0.5*(r1+r2)*Math.cos(a+da), y:0.5*(r1+r2)*Math.sin(a+da)},{x:0.5*(r1+r2)*Math.cos(a), y:0.5*(r1+r2)*Math.sin(a)},{x:0.5*(r1+r2)*Math.cos(a-da), y:0.5*(r1+r2)*Math.sin(a-da)},
            {x:r2*Math.cos(a+da), y:r2*Math.sin(a+da)}, {x:r2*Math.cos(a), y:r2*Math.sin(a)}, {x:r2*Math.cos(a-da), y:r2*Math.sin(a-da)}, {x:0, y:0}]
    }
    return points;
}