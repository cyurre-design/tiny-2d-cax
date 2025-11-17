'use strict'

//Para Canvas, separo el layer general , que es la de draw, de las capas de datos.
//La idea es NO gastar un canvas entero por capa ya que redibuja de todos modos
//el layer de clase es el general
//el layer iría a las funciones propiamente de dibujo.
//la función que dibuja ya sabe el modo, lo pongo en el evento new-block para que sea más autocontenidp
//Cambio el nombre de layer a layerdraft para que quede claro, excepto en select que es especial
export default class CyInteractiveDraw {
    constructor(canvasHandler, layerDraft) {
        this.mouseHandler = canvasHandler;
        this.status = 0;     //Para reaccionar de manera diferente en primer elemento, segundo...
        //Hay que poner un modo default?!!! TODO
        this.layerDraft = layerDraft;   //esta la dejamos más o menos fija y la draw depende del comando
        this.init(layerDraft, undefined, undefined);
    }

    init() {
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

    setDrawingMode( drawingApplication) {
        this.init()
        this.application = drawingApplication; //Para importar la función getNearestPoint u otras que salgan
        this.application.draft = this.layerDraft;
        this.mouseHandler.app(drawingApplication);
    }
}
