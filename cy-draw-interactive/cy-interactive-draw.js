'use strict'

import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
import {blockTranslate, blockSymmetryX, blockSymmetryY, blockSymmetryL} from '../cy-geometry/cy-geometry-library.js';
//Para Canvas, separo el layer general , que es la de draw, de las capas de datos.
//La idea es NO gastar un canvas entero por capa ya que redibuja de todos modos
//el layer de clase es el general
//el layer iría a las funciones propiamente de dibujo.
//la función que dibuja ya sabe el modo, lo pongo en el evento new-block para que sea más autocontenidp
//Cambio el nombre de layer a layerdraft para que quede claro, excepto en select que es especial
export default class CyInteractiveDraw {
    constructor(canvasHandler, layerDraft) {
        this.mouseHandler = canvasHandler;
        //this.layer = layer;
        //this.mode = undefined;
        this.status = 0;     //Para reaccionar de manera diferente en primer elemento, segundo...

        this.selectTolerance = 1;
        this.snapTolerance = 1;
        //Hay que poner un modo default?!!! TODO
        this.layerDraft = layerDraft;   //esta la dejamos más o menos fija y la draw depende del comando
        this.init(layerDraft, undefined, undefined);
    }

    init() {
        // this.layerDraw = layerDraw;
        // this.mode = mode;
        // this.subMode = subMode;
        this.leftClick = ()=>{};
        this.leftClickStart = () => {};
        this.leftClickMove = () => {};
        this.leftClickUp = () => {};
        this.rightClick = () => {};
        this.handleKey = () => {};
        this.mouseMove = ()=>{};
        this.updateData = ()=>{};
        this.mouseOut = ()=>{};
        this.layerDraft.clear(); //Cada vez que cambia de modo borro por si acaso
    }
    quit = ()=>{
        this.layerDraft.clear(); //Cada vez que cambia de modo borro por si acaso
        this.mouseHandler.setZoomMode();
    }

    //De momento juntas, podrían ponerse en cada modo, una fon por cada....
 
    //Centralización de funciones básicas para gestión del dibujo
    //Al final las operaciones básicas son visualizar el punto, almacenar el punto, actualizar el status, importar data...
    //Y luego hay funciones que serán específicas, como el bloque y modo de dibujo, borrado, etc...
    p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    h  = (pi) => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    m0 = (pi) => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    m1 = (pi) => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    //Las funciones de dibujar para mejorar la interactividad (en draft) y obtener 
    //puntos o bloques cercanos son muy diferentes, la segunda sería solo en las capas activas
    //lo que se controla pasando draw en el layer cada vez o lo que haga falta
    
    //Esta función es conflictiva porque debe ser llamada desde la aplicación (drawSegment, drawCircle, etc...)
    //pero la aplicación se registra aquí, así que la pasaremos como callback (la herencia queda fatal...)
    // por otra parte es la única función que necesita layerDraw (para la base de datos de puntos o bloques
    // 
    highLight(x,y, blocks){
        //Mira tanto los puntos destacados como la rejilla, maomeno
        let w = scalePixels2mm( this.layerDraft.pathWidth);             //O selected??
        const point = this.application.getNearestPoint(x, y, 10*w);        //El 5 a settings TODO
        this.layerDraft.clear();
        if(blocks)
            this.layerDraft.drawBlocks(blocks, w, this.layerDraft.pathColor ); //es llamada desde aquí, pasarnos siempre array
        this.layerDraft.drawBlocks(point, w, this.layerDraft.pathColor );
        return( {x : point.x0, y : point.y0});
    }
    drawBlocks(point,blocks){
        let w = scalePixels2mm( this.layerDraft.pathWidth);             //O selected??
        this.layerDraft.clear();
        if(blocks)
            this.layerDraft.drawBlocks(blocks, w, this.layerDraft.pathColor ); //es llamada desde aquí, pasarnos siempre array
        this.layerDraft.drawBlocks(point, w, this.layerDraft.pathColor );
//        return( {x : point.x0, y : point.y0});

    }

    setDrawingMode( drawingApplication) {
        this.init()
        this.application = drawingApplication; //Para importar la función getNearestPoint u otras que salgan
        this.application.draft = this;
        this.mouseHandler.app(drawingApplication);
    }
}
