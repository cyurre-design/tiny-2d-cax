"use strict";

import { createDrawElement } from '../geometry/fg-geometry-drawn-elements.js';

let DxfParser;
import("../parsers/fg-dxf-parser.js").then(module => {
    try {
        if (!window.DxfParser) { // Import for Angular compatibility
            DxfParser = module.default;
        } else {
            DxfParser = window.DxfParser;
        }
    } catch (error) { // Import for command line compatibility
        DxfParser = module.default;
    }
});
//YURRE: Test TODO porque esto pertenece a la configuración!!
const linkTolerance = 0.01; //unidades del dibujo, sea lo que sea....
export default class FgParserDxfGeometry {
    static toGeometry(data) {
        let parser = new DxfParser();

        let dxf = parser.parseSync(data);
        let layers = dxf.tables.layer.layers; //objeto con name, color y visible
        Object.values(layers).forEach(ly => {
            ly.name = `dxf_${ly.name}`;
            ly.paths = [];
            ly.circles = [];
        });
        //YURRE: Si hacemos fit, esto no vale para nada, mejor quitarlo
        let geometry = FgParserDxfGeometry.convertDxfToGeometry(dxf, linkTolerance, layers);

        return {geometry: geometry, min:{x:geometry.box.xmin,y:geometry.box.ymin},  max: {x:geometry.box.xmax,y:geometry.box.ymax}};
    }

    static fromGeometry(geometry) {
        return undefined;
    }

    static convertDxfToGeometry(dxf, tol, layers) {
        function equal(a,b){
            return(Math.abs(a-b) < tol);
        }
        function checkBox(x,y){
            box.xmin = Math.min(x, box.xmin);
            box.xmax = Math.max(x, box.xmax);
            box.ymin = Math.min(y, box.ymin);
            box.ymax = Math.max(y, box.ymax);
        }
        //me pasan la geometría después de filtrada, con entidades que sé traducir, y voy construyendo paths sobre la marcha
        //No hay ninguna garantía de que vaya a funcionar mucho mejor, pero se basa en que a menudo los trozos de perfile pueden venir seguidos
        //let xf=NaN, yf=NaN;
        let xi, yi, xf, yf;
        let box = {xmin:Infinity,ymin:Infinity,xmax:-Infinity,ymax:-Infinity};
        let geo = {};
        let layersAux = layers;
        let path = createDrawElement('Path',{elements:[]});   //dxf cambiará...es por poner algo
        let layer = dxf.entities[0].layer; //inicio
        dxf.entities.forEach(e => { //solo debe haber paths y circles (de momento)
            //En cada elemento hay que mirar el punto inicial y el final, porque autocad los ordena "a voleo" o con otra lógica
            //Es un poco pesadito como algoritmo
            let element;
            switch (e.type) {
                case 'LINE':
                    element = createDrawElement('Line', {x1: e.vertices[0].x, y1: e.vertices[0].y, x2: e.vertices[1].x, y2: e.vertices[1].y})
                    if(equal(element.pi.x, xf) && equal(element.pi.y, yf)){ //por la "derecha"
                        path.elements.push(element);
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    else if(equal(element.pf.x, xf) && equal(element.pf.y, yf)){
                        element.reverse();
                        path.elements.push(element);
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    else if(equal(element.pi.x, xi) && equal(element.pi.y, yi)){ //por la "izquierda"
                        element.reverse();
                        path.elements.unshift(element);
                        xi = element.pi.x; yi = element.pi.y;
                    }
                    else if(equal(element.pf.x, xi) && equal(element.pf.y, yi)){
                        path.elements.unshift(element);
                        xi = element.pi.x; yi = element.pi.y;
                    }
                    else{
                        if(path.elements.length !== 0){
                            layersAux[layer].paths.push(path);
                            layer = e.layer;
                        }
                        path = createDrawElement('Path',{elements:[element]});
                        xi = element.pi.x; yi = element.pi.y;
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    checkBox(element.pi.x, element.pi.y);
                    checkBox(element.pf.x, element.pf.y);
                    break;
                case 'POLYLINE':
                case 'LWPOLYLINE':
                    let els = [];   //Creo el array de líneas
                    let f = e.vertices.shift();  //cojo el primer punto
                    e.vertices.forEach(v => {
                        els.push( createDrawElement('Line', {x1: f.x, y1: f.y, x2: v.x, y2: v.y}));
                        checkBox(f.x, f.y);
                        f = v;
                    });
                    if(equal(e.vertices[0].x, xf) && equal(e.vertices[0].y, yf)){   //por la "derecha"
                        path.elements = path.elements.concat(els);
                    }
                    else if(equal(e.vertices[e.vertices.length-1].x, xf) && equal(e.vertices[e.vertices.length-1].y, yf)){
                        path.elements = path.elements.concat(els.reverse().map(e=>e.reverse()));
                    }
                    else if(equal(e.vertices[0].x, xi) && equal(e.vertices[0].y, yi)){   
                        path.elements = path.elements.reverse().map(e=>e.reverse()).concat(els.reverse());
                    }
                    else if(equal(e.vertices[e.vertices.length-1].x, xi) && equal(e.vertices[e.vertices.length-1].y, yi)){
                        path.elements = els.reverse().map(e=>e.reverse()).concat(path.elements);
                    }
                    else{
                        if(path.elements.length !== 0){
                            layersAux[layer].paths.push(path);
                            layer = e.layer;
                        }
                        path = createDrawElement('Path',{elements:els});
                    } 
                    xi = path.elements[0].pi.x; yi = path.elements[0].pi.y;
                    xf = path.elements[path.elements.length-1].pf.x; yf = path.elements[path.elements.length-1].pf.y;
                    break;
                case 'CIRCLE':
                    checkBox(e.center.x + e.radius, e.center.y + e.radius);
                    checkBox(e.center.x - e.radius, e.center.y - e.radius);
                    layersAux[e.layer].circles.push(createDrawElement('Circle', {cx: e.center.x, cy: e.center.y, r: e.radius}));
                    break;
                case 'ARC':
                    //Hay una duda metafísica, o bien acad solo tiene ángulos pequeños o bien el sentido de recorrido está fijado
                    let insertedAngle = (e.startAngle + e.endAngle) / 2;
                    if (e.endAngle < e.startAngle) {
                        insertedAngle += Math.PI;
                    }    
                    element = createDrawElement('Arc3Angles', {cx: e.center.x, cy: e.center.y, r: e.radius, a1: e.startAngle, a2: insertedAngle, a3: e.endAngle});
                    if(equal(element.pi.x,xf) && equal(element.pi.y, yf)){ //por la "derecha"
                        path.elements.push(element);
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    else if(equal(element.pf.x, xf) && equal(element.pf.y, yf)){
                        element.reverse();
                        path.elements.push(element);
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    else if(equal(element.pi.x, xi) && equal(element.pi.y, yi)){ //por la "izquierda"
                        element.reverse();
                        path.elements.unshift(element);
                        xi = element.pi.x; yi = element.pi.y;
                    }
                    else if(equal(element.pf.x, xi) && equal(element.pf.y, yi)){
                        path.elements.unshift(element);
                        xi = element.pi.x; yi = element.pi.y;
                    }
                    else{
                        if(path.elements.length !== 0){
                            layersAux[layer].paths.push(path);
                            layer = e.layer;
                        }
                        path = createDrawElement('Path',{elements:[element]});
                        xi = element.pi.x; yi = element.pi.y;
                        xf = element.pf.x; yf = element.pf.y;
                    }
                    checkBox(element.pi.x, element.pi.y);
                    checkBox(element.pm.x, element.pm.y);
                    checkBox(element.pf.x, element.pf.y);
                    break;
                case 'POINT':
                    element = createDrawElement('Point', {x: e.position.x, y: e.position.y});
                    path.elements.push(element);
                    checkBox(element.x, element.y);
                    //console.log('Hay puntos en el dxf?');    
                    break;
                case 'TEXT':
                    console.log('no ponemos texto en los dibujos?!');
                    break;
                case 'INSERT':
                    console.log('unsupported element type: ' + e.type);
                    break;
                default:
                    console.log('unsupported element type: ' + e.type);
                    break;
            }
        });
        if(path.elements.length !== 0) {
            layersAux[layer].paths.push(path);
        }
        geo.layers = Object.values(layersAux).filter(layer => layer.circles.length !== 0 || layer.paths.length !== 0); //QUito layers vacías si las hay
        geo.layers.map(ly => ly.circles).forEach(ly => ly.sort((e1, e2) => e1.r - e2.r));
        geo.box = box;
        return geo;
    }
}