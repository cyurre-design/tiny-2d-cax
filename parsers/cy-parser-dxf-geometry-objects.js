"use strict";

import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";
import "./fg-dxf-parser.js";

//YURRE: Test TODO porque esto pertenece a la configuración!!
//Y sería una variable con setLinkTolerance o así
//AUTOCAD mete radios como 4.99999999 por ejemplo, así que vamos a usar este mismo número para redondear las cotas
const linkTolerance = 0.001; //unidades del dibujo, sea lo que sea....
const linkToleranceInv = 1000; //no hago 1/x para evitar errores de la propia división, pero si es variable hay que analizar el caso

function round(x) {
    return linkTolerance * Math.round(linkToleranceInv * x);
}
//function equal(a,b) { return(Math.abs(a-b) < linkTolerance);}
/**
 *
 * @param {Array} entities  estos son los componentes normales como línea, arco...
 * @param {Array} blocks    Estos son subgrupos que se usan repetidamente (como macros, por ejemplo una tuerca)
 * @returns
 *
 * Cambio de filosofía y, aunque sea menos óptimo tal vez, genero todos los elementos individualmente
 * Y el futuro link, con tolerancia variable, lo dejamos para interactivo o auto pero en otra fase
 */
function _entities2Geometry(entities /*, blocks*/) {
    let layers = [];
    //agrupamos las entidades por capas, cada capa puede tener un array de paths
    let capas = [...new Set(entities.map((e) => e.layer))];
    capas.forEach((layer) => {
        let ents = entities.filter((e) => e.layer === layer);
        let blocks = [],
            paths = [],
            circles = [];
        //let path = createDrawElement('path', {elements: []}); //dxf cambiará...es por poner algo
        ents.forEach((e) => {
            switch (e.type) {
                case "LINE":
                    {
                        blocks.push(
                            createDrawElement("segment", {
                                subType: "PP",
                                x0: e.vertices[0].x,
                                y0: e.vertices[0].y,
                                x1: e.vertices[1].x,
                                y1: e.vertices[1].y,
                            }),
                        );
                        // const pix = e.vertices[0].x, piy = e.vertices[0].y;
                        // const pfx = e.vertices[1].x, pfy = e.vertices[1].y;
                        // //element = createDrawElement('segment', {subType:"PP", x0: e.vertices[0].x, y0: e.vertices[0].y, x1: e.vertices[1].x, y1: e.vertices[1].y});
                        // if(equal(pix, xf) && equal(piy, yf)){ //por la "derecha"
                        //     path.elements.push( );
                        //     xf = pfx; yf = pfy;
                        // }
                        // else if(equal(pfx, xf) && equal(pfy, yf)){
                        //     path.elements.push(createDrawElement('segment', {subType:"PP", x0: pfx, y0: pfy, x1: pix, y1: piy}));
                        //     xf = pix; yf = piy;
                        // }
                        // else if(equal(pix, xi) && equal(piy, yi)){ //por la "izquierda"
                        //     path.elements.unshift(createDrawElement('segment', {subType:"PP", x0: pfx, y0: pfy, x1: pix, y1: piy}));
                        //     xi = pfx; yi = pf.y;
                        // }
                        // else if(equal(pfx, xi) && equal(pfy, yi)){
                        //     path.elements.unshift(createDrawElement('segment', {subType:"PP", x0: pix, y0: piy, x1: pfx, y1: pfy}));
                        //     xi = pix; yi = piy;
                        // }
                        // else{ //Comienzo de path, primero almaceno el path que estaba vigente
                        //     if(path.elements.length !== 0){
                        //         paths.push(path);
                        //     }
                        //     const element = createDrawElement('segment', {subType:"PP", x0: pix, y0: piy, x1: pfx, y1: pfy})
                        //     path = createDrawElement('path', {elements: [element]});
                        //     xi = element.pi.x; yi = element.pi.y;
                        //     xf = element.pf.x; yf = element.pf.y;
                        // }
                    }
                    break;
                case "POLYLINE":
                case "LWPOLYLINE":
                    {
                        function polyLineR() {
                            let els = []; //Creo el array de líneas
                            let f = e.vertices.shift(); //cojo el primer punto
                            e.vertices.forEach((v) => {
                                els.push(createDrawElement("segment", { subType: "PP", x0: f.x, y0: f.y, x1: v.x, y1: v.y }));
                                f = v;
                            });
                            return els;
                        }
                        // function polyLineL(){
                        //     let els = [];   //Creo el array de líneas
                        //     const nv = e.vertices.reverse(); //Los cogemos al revés y les damos la vuelta
                        //     let f = e.vertices.shift();  //cojo el último punto (que ahora está el primerp) y creamos los segmentos al revés
                        //     nv.forEach(v => {
                        //         els.push( createDrawElement('segment', {subType:"PP", x1: f.x, y1: f.y, x0: v.x, y0: v.y}));
                        //         f = v;
                        //     });
                        //     return els;
                        // }

                        // const pix = e.vertices[0].x, piy = e.vertices[0].y;
                        // const pfx = e.vertices[e.vertices.length - 1].x, pfy = e.vertices[e.vertices.length - 1].y;

                        // if(equal(pix, xf) && equal(piy, yf)){   //por la "derecha"
                        //     path.elements = path.elements.concat(polyLineR());
                        //     xf = pfx; yf = pfy;
                        // }
                        // else if(equal(pfx, xf) && equal(pfy, yf)){
                        //     path.elements = path.elements.concat(polyLineL());
                        //     xf = pix; yf = piy;
                        // }
                        // else if(equal(pix, xi) && equal(piy, yi)){
                        //     path.elements = polyLineL().concat(path.elements);
                        //     xi = pfx; yi = pfy;
                        // }
                        // else if(equal(pfx, xi) && equal(pfy, yi)){
                        //     path.elements = polyLineR().concat(path.elements);
                        // }
                        // else{
                        //     if(path.elements.length !== 0)
                        //         paths.push(path);
                        paths.push(createDrawElement("path", { elements: polyLineR() }));

                        //xi = path.elements[0].pi.x; yi = path.elements[0].pi.y;
                        //xf = path.elements[path.elements.length-1].pf.x; yf = path.elements[path.elements.length-1].pf.y;
                    }
                    break;
                case "CIRCLE":
                    circles.push(createDrawElement("circle", { subType: "CR", cx: e.center.x, cy: e.center.y, r: round(e.radius) }));
                    break;
                case "ARC":
                    {
                        //Hay una duda metafísica, o bien acad solo tiene ángulos pequeños o bien el sentido de recorrido está fijado
                        // let insertedAngle = (e.startAngle + e.endAngle) / 2;
                        // if (e.endAngle < e.startAngle) {
                        //     insertedAngle += Math.PI;
                        // }
                        //element = createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, a1: e.startAngle, a2: insertedAngle, a3: e.endAngle});

                        blocks.push(
                            createDrawElement("arc", {
                                subType: "DXF",
                                cx: e.center.x,
                                cy: e.center.y,
                                r: e.radius,
                                ai: e.startAngle,
                                af: e.endAngle,
                            }),
                        );
                        // const pix = e.vertices[0].x, piy = e.vertices[0].y;
                        // const pfx = e.vertices[1].x, pfy = e.vertices[1].y;

                        // //element = createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.startAngle, af: e.endAngle});
                        // if(equal(pix,xf) && equal(piy, yf)){ //por la "derecha"
                        //     path.elements.push(createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.startAngle, af: e.endAngle}));
                        //     xf = pfx; yf = pfy;
                        // }
                        // else if(equal(pfx, xf) && equal(pfy, yf)){
                        //     element = segmentReverse(element);
                        //     path.elements.push(createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.endAngle, af: e.startAngle}));
                        //     xf = pix; yf = piy;
                        // }
                        // else if(equal(pix, xi) && equal(piy, yi)){ //por la "izquierda"
                        //     element = segmentReverse(element);
                        //     path.elements.unshift(createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.endAngle, af: e.startAngle}));
                        //     xi = pfx; yi = pfy;
                        // }
                        // else if(equal(pfx, xi) && equal(pfy, yi)){
                        //     path.elements.unshift(createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.startAngle, af: e.endAngle}));
                        //     xi = pix; yi = piy;
                        // }
                        // else{
                        //     if(path.elements.length !== 0){
                        //         paths.push(path);
                        //     }
                        //     const element = createDrawElement('arc', {subType:"DXF", cx: e.center.x, cy: e.center.y, r: e.radius, ai: e.startAngle, af: e.endAngle});
                        //     path = createDrawElement('path', {elements: [element]});
                        //     xi = element.pi.x; yi = element.pi.y;
                        //     xf = element.pf.x; yf = element.pf.y;
                        // }
                    }
                    break;
                case "POINT":
                    //element = createDrawElement('point', {x: e.position.x, y: e.position.y});
                    //path.elements.push(element);
                    //checkBox(element.x, element.y);
                    //console.log('Hay puntos en el dxf?');
                    break;
                case "TEXT":
                    console.log("no ponemos texto en los dibujos?!");
                    break;
                case "INSERT":
                    {
                        // let ent =  blocks[e.name];
                        // let newFeature = _convertEntitiesToPaths(ent.entities, blocks);
                        // if(newFeature.layers.length !== 0){
                        //     newFeature.layers.forEach(ly=>{
                        //         ly.paths = ly.paths.map(p => pathTranslate(p, e.position.x,e.position.y));
                        //         ly.circles = ly.circles.map(c => circleTranslate(c, e.position.x,e.position.y));
                        //     });
                        //     //YURRE: una vez que metemos los inserts, cada uno de ellos tendrá su caja, pero luego existen desplazamientos
                        //     //así que hay que juntar las cajas desplazadas
                        //     //checkBox(newFeature.box.xmin + e.position.x, newFeature.box.ymin + e.position.y);
                        //     //checkBox(newFeature.box.xmax + e.position.x, newFeature.box.ymax + e.position.y);
                        //     layers = layers.concat(layers, newFeature.layers);
                        // }
                        //console.log('unsupported element type: ' + e.type);
                    }
                    break;
                default:
                    console.log("unsupported element type: " + e.type);
                    break;
            }
        });
        //if(path.elements.length !== 0) paths.push(path);
        if (paths.length !== 0 || circles.length !== 0 || blocks.length !== 0)
            layers.push({ name: layer, paths: paths, circles: circles, blocks: blocks });
    });
    return layers;
}

export function convertDxfToGeometry(data /*, tol*/) {
    let parser = new DxfParser();

    let dxf = parser.parseSync(data);
    let geo = {};
    geo = _entities2Geometry(dxf.entities, dxf.blocks);
    const layerInfo = dxf.tables.layer.layers; //Ye un objeto
    geo.forEach((layer) => {
        layer.color = layerInfo[layer.name].color;
        layer.name = parseInt(layer.name) !== undefined ? "dxf_" + layer.name : layer.name; //A veces la capa se denomina "0" y da problemas
    });
    //geo.layers = geo.layers.concat(geo.layers, );
    //geo.layers = Object.values(layersAux).filter(layer => layer.circles.length !== 0 || layer.paths.length !== 0); //QUito layers vacías si las hay
    //geo.layers.map(ly => ly.circles).forEach(ly => ly.sort((e1, e2) => e1.r - e2.r));
    //geo.box = box;
    return geo;
}
