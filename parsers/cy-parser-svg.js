'use strict'

//YURRE CAMBIO A LIBRERIA NUEVA BASADA EN SEGMENT
import { geometryPrecision} from '../cy-geometry/cy-geometry-library.js'
import { createDrawElement} from '../cy-geometry/cy-geometry-basic-elements.js'
//import {Path} from '/scripts/fg/lib/geometry/fg-geometry-grouped-elements.js'
//import {Bezier} from '../geometry/fg-bezier.js'
//import {createDrawElement} from '../geometry/cy-geometry-drawn-elements.js'

const cmdRegEx = /([MLQTCSAZVHmlqtcsazvh])([^MLQTCSAZVHmlqtcsazvh]*)/gi

//La gramática de path es algo más compleja de lo que parece , ver espec-
const wspComa = /([,\x20\x0a\x09\x0c\x0d])+/g;
//const mCommand = /`(${wsp}(${number})${wsp}(${number}))+/;
//globales del módulo
let paths = [], circles = [];

function pathsToGeometry(data){
    let elements = [];  //global en el contexto de la función svgToGeometry
    function ellipticalArc(x,y,data)    {
        console.log('arco');
        return([data[5],data[6]]);
    }
    function parsePath(d){  //recibo un string, que puede incluir cr,lf, etc... que son whirespace
        d = d.replaceAll(wspComa,' ');
        d = d.replaceAll(/([MLQTCSAZVHmlqtcsazvh])[^ ]/g,'$1 '); //tipos pegados como M123
        //d = d.replaceAll(/[ ]+/g,' ');  //quito repeeticiones de espacio
        let commands = d.match(cmdRegEx);
        commands = commands.map(cmd=>cmd.trim());
        commands = commands.map(cmd=>cmd.split(' '));
        let cpx = 0, cpy = 0; //para los relativos
        let c, inc, rx, ry, pathInitialX = 0, pathInitialY = 0;
        commands.forEach(cmd=>{
        c = cmd.shift();  //el comando se pasa a las propias rutinas de cálculo
        inc = c >= 'a'; //flag de incremental
        switch(c){
            case 'M':
            case 'm':
                if((cmd.length % 2) !== 0)  return( 'error');
                if(elements.length !== 0){
                    paths.push(createDrawElement('path', {elements:elements}));
                    elements = []; //reseteo
                }
                if(inc){
                    cpx += parseFloat(cmd.shift()); cpy += parseFloat(cmd.shift());
                }
                else{
                    cpx = parseFloat(cmd.shift()); cpy = parseFloat(cmd.shift());
                }
                pathInitialX = cpx, pathInitialY = cpy;
            //El move puede tener cotas por detrás que son una polylínea, reuso el case
            //fallthrough, no break
            case 'L':
            case 'l':
                while(cmd.length !== 0){ //esto sería polylínea
                    rx = +cmd.shift(); ry = +cmd.shift();   //el + es para forzar a número
                    if(inc) {rx += cpx; ry += cpy}
                    elements.push(createDrawElement('segment', {subType:'PP', x0:cpx, y0:cpy, x1:rx, y1:ry}));
                    [cpx, cpy] = [rx,ry];
                }
                break;
            break;
            case 'H': 
            case 'h':
                while(cmd.length !== 0){   //aunque no tiene sentido, se pueden poner varias cotas seguidas
                    rx = parseFloat(cmd.shift()) + (inc?cpx:0);
                    elements.push(createDrawElement('segment', {subType:'PP', x0:cpx, y0:cpy, x1:rx, y1:cpy}));
                }
                cpx = rx;
            break;
            case 'V':
            case 'v':
                while(cmd.length !== 0){   //aunque no tiene sentido, se pueden poner varias cotas seguidas
                    ry = parseFloat(cmd.shift()) + (inc?cpy:0);
                    elements.push(createDrawElement('segment', {subType:'PP', x0:cpx, y0:cpy, x1:cpx, y1:ry}));
                }
                cpy = ry;
            break;
            case 'C': //cubic bezier, pueden venir varias pero son independientes
            case 'c': //cubic bezier, pueden venir varias pero son independientes
            if((cmd.length % 6) !== 0)  return( 'error');
            while(cmd.length !== 0){
                let ctrl = cmd.splice(0,6).map(el=>parseFloat(el));
                if(inc){
                ctrl[0] += cpx; ctrl[1] += cpy; //control point 1
                ctrl[2] += cpx; ctrl[3] += cpy; //control point 2
                ctrl[4] += cpx; ctrl[5] += cpy; //final point
                }
                elements.push(createDrawElement('bezier', {x0:cpx, y0:cpy, cp1x:ctrl[0], cp1y: ctrl[1] , cp2x:ctrl[2], cp2y: ctrl[3], x1:ctrl[4], y1: ctrl[5]}));  //vienen x1,y1,x2,y2,x,y
                [cpx,cpy] = [ctrl[4], ctrl[5]];
            }
            break;
            case 'S': //cubic bezier, pueden venir varias pero son independientes
            case 's': 
            if((cmd.length % 4) !== 0)  return( 'error');
            //aquí vienen parejas y el primer punto de control es el reflejado del x1,y1 respecto al cp
            rx = cpx, ry = cpy;
            while(cmd.length !== 0){
                let ctrl = cmd.splice(0,4).map(el=>parseFloat(el));
                if(inc){
                ctrl[0] += cpx; ctrl[1] += cpy; //control point 2, el 1 se calcula con este y cpx,cpy
                ctrl[2] += cpx; ctrl[3] += cpy; //final point
                }
                elements.push(createDrawElement('bezier', {x0:cpx, y0:cpy, cp1x:2*rx - ctrl[0], cp1y:2*ry - ctrl[1] , x1:ctrl[4] , y1:ctrl[5]}));
                [cpx,cpy] = [ctrl[2], ctrl[3]];
            }
            break;
            case 'Q': //quadratic Bezier, pero la rutina de cúbica debe adaptarlo
            case 'q':
            if((cmd.length % 4) !== 0)  return( 'error');
            while(cmd.length !== 0){
                let ctrl = cmd.splice(0,4).map(el=>parseFloat(el));
                if(inc){
                    ctrl[0] += cpx; ctrl[1] += cpy; //control point
                    ctrl[2] += cpx; ctrl[3] += cpy; //final point
                }
                elements.push( createDrawElement('bezier', {x0:cpx, y0:cpy, cp1:{x:2*rx - ctrl[0], y:2*ry - ctrl[1]} , x1:ctrl[2] , y1:ctrl[3]}));  //a ver cómo lo distinguimos en el constructor por la longitud de lo pasado
                [cpx,cpy] = [ctrl[2], ctrl[3]];
            }
            break;
            case 'T': //quadratic Bezier, pero la rutina de cúbica debe adaptarlo
            case 't':
            if((cmd.length % 2) !== 0)  return( 'error');
            //aquí vienen parejas y el primer punto de control es el reflejado del x1,y1 respecto al cp
            rx = cpx, ry = cpy;
            while(cmd.length !== 0){
                let ctrl = cmd.splice(0,2).map(el=>parseFloat(el));
                if(inc){
                ctrl[0] += cpx; ctrl[1] += cpy; //final point, el control point se calcula con el p. anterior
                }
                elements.push( createDrawElement('bezier', {x0:cpx, y0:cpy, cp1:{x:2*rx - ctrl[0], y:2*ry - ctrl[1]} , x1:ctrl[2] , y1:ctrl[3]}));  //a ver cómo lo distinguimos en el constructor
                [cpx,cpy] = [ctrl[0], ctrl[1]];
            }
            break;
            case 'A':
            case 'a':  
            if((cmd.length % 7) !== 0)  return( 'error');
            while(cmd.length !== 0){
                let ctrl = cmd.splice(0,7).map(el=>parseFloat(el)); //hay dos flags
                if((Math.trunc(ctrl[3]) !== ctrl[3]) || (Math.trunc(ctrl[4]) !== ctrl[4])) return('error');
                if(inc){
                    ctrl[5] += cpx; ctrl[6] += cpy; //final point
                }
                if(Math.abs(ctrl[0] - ctrl[1]) < geometryPrecision) //rx===ry => angulo es 0, quedan fA, fS
                    elements.push( createDrawElement('arc', {subType:'2PR', x0:cpx, y0:cpy, x1:ctrl[5], y1:ctrl[6], r:ctrl[3]===0?ctrl[0]:-ctrl[0], fA:ctrl[3], fS:ctrl[4]}));
                else
                //    elements.push(new ellipticalArc(x,y,...ctrl)); TODO
                    elements.push(createDrawElement('segment', {subType:'PP', x0:cpx, y0:cpy, x1:ctrl[5],y1:ctrl[6]}));
                [cpx,cpy] = [ctrl[5], ctrl[6]];
            }          
            break;
            case 'Z':
            case 'z':
                elements.push(createDrawElement ('segment', {subType:'PP', x0:cpx, y0:cpy, x1:pathInitialX, y1:pathInitialY}));   //en teoría puede continuar con otro comando...
                cpx = pathInitialX, cpy = pathInitialY;
                break;
        }
        })
        if(elements.length !== 0)
            paths.push( createDrawElement('path', {elements:elements}));
    }
    data.forEach(path=>parsePath(path));
}
//los atributos son string, hay que pasar números
function circlesToGeometry(data){
    const cirs = Array.isArray(data)?data:[data];
    let cx,cy,r;
    cirs.forEach(el =>{
        cx = +el.getAttribute('cx');
        cy = +el.getAttribute('cy');
        r = +el.getAttribute('r');
        circles.push(createDrawElement('circle', {subType:'CR', cx:cx, cy:cy , r: r}));
    });
}
function rectsToGeometry(data){
    const rects = Array.isArray(data)?data:[data];
    let x,y,w,h;
    rects.forEach(el =>{
        x = +el.getAttribute('x');
        y = +el.getAttribute('y');
        w = +el.getAttribute('width');
        h = +el.getAttribute('height');
        paths.push(createDrawElement('path',{elements:[
            // createDrawElement('segment', {x1:x, y1:y, x2:x+w, y2:y}),
            // createDrawElement('segment', {x1:x+w, y1:y, x2:x+w, y2:y+h}),
            // createDrawElement('segment', {x1:x+w, y1:y+h, x2:x, y2:y+h}),
            // createDrawElement('segment', {x1:x, y1:y+h, x2:x, y2:y})
        ]}));
    });
}
function polylinesToGeometry(data){
    const polylines = Array.isArray(data)?data:[data];
    let pts;
    polylines.forEach(pol =>{
        let els = [];
        pts = Array.from(pol.points);
        let pi = pts.shift();
        while(pts.length){
            let pf = pts.shift();
            els.push(new Segment({subType:'PP', x0:pi.x, y0:pi.y, x1:pf.x, y1:pf.y}));
            pi = pf;
        }
        paths.push(new Path({elements:els}));
    });
}
function polygonsToGeometry(data){
    const polygons = Array.isArray(data)?data:[data];
    let pts;
    polygons.forEach(pol =>{
        let els = [];
        pts = Array.from(pol.points);
        let pini = pts[0]; //para cerrar al final
        let pi = pts.shift();
        while(pts.length){
            let pf = pts.shift();
            els.push( new Segment({x1:pi.x, y1:pi.y, x2:pf.x, y2:pf.y}));
            pi = pf;
        }
        els.push( new Segment({x1:pi.x, y1:pi.y, x2:pini.x, y2:pini.y}));
        paths.push( new Path({elements:els}));
    });
}


export function  svgToGeometry(file){
    const node = document.createElement('div');
    node.innerHTML = file;
    //const theBox = node.querySelectorAll('svg')[0].viewBox.baseVal;
    pathsToGeometry( Array.from(node.querySelectorAll('path')).map(p=>p.getAttribute('d')));
    circlesToGeometry(Array.from(node.querySelectorAll('circle')));
    const ellipses = Array.from(node.querySelectorAll('ellipse'));
    polygonsToGeometry(Array.from(node.querySelectorAll('polygon')));
    polylinesToGeometry(Array.from(node.querySelectorAll('polyline')));
    rectsToGeometry(Array.from(node.querySelectorAll('rect')));
    return({layers:[{circles:circles,paths:paths}]});
}