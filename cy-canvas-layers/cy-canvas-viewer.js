"use strict";

import './cy-canvas-layer-axes.js';
import './cy-canvas-layer-draw.js';
import './cy-canvas-layer-draft.js';

import CyCanvasHandler from './cy-canvas-handler.js';
import CyInteractiveDraw from '../cy-draw-interactive/cy-interactive-draw.js';
import {createDrawElement} from '../cy-geometry/cy-geometry-basic-elements.js';

//En este componente agrupamos la gestión de los varios canvas que tenemos
//layerDraw por su parte virtualiza las capas de dibujo en una sola capa física
//y una de borrador

export default class CyCanvasViewer extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});

        //this.delay = 100;
       
    }
    createStyle() {
        let style = `
            <style>
                :host,
                #container {
                    width: 100%;
                    height: 100%;
                    overflow: clip;
                }
                #draw, #draft, #axes
                {
                    position: absolute;
                    left: 0px;
                    top:0px;
                    width: 100%;
                    height: 100%;
                }

                #axes{
                    --axes-width: 2;
                    --axes-color: green;
                    --grid-width: 1;
                    --grid-color: darkgray;
                    --font-size: 15;
                    pointer-events: none;
                }
                /* START CURSORS STYLES */
                .zoomInCursor {
                  cursor: zoom-in;
                }
                .paneClickCursor {
                  cursor: grabbing !important;
                }
                /* END CURSORS STYLES */
            </style>
        `;
        return style;
    }
    createTemplate() {
        let template = `
            <div id="container">
                <cy-canvas-layer-axes id="axes" name="axes"></cy-canvas-layer-axes>
                <cy-canvas-layer-draw id="draw" name="draw" tabindex:'1'></cy-canvas-layer-draw>
                <cy-canvas-layer-draft id="draft" name="draft" tabindex:'1'></cy-canvas-layer-draft>
            </div>
        `;
        return template;
    }
    //Auxiliar para redibujar las capas en casos de cambios de coordenadas, zoom... que afectan al canvas
    _redrawLayers(){
        let ext = this.canvasHandler.getExtents();
        this.canvasLayers.forEach(ly => {
            ly.setExtents(ext);
            ly.draw();
            })}
    
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        //this.container = this.dom.querySelector('#container');
        this.layerAxes = this.dom.querySelector("#axes");
        this.layerDraw = this.dom.querySelector("#draw");
        this.layerDraft = this.dom.querySelector("#draft");
        this.canvasLayers = [this.layerAxes, this.layerDraw, this.layerDraft];

        //Para gestión de zoom y pane la asignamos al draw, los otros no tienen eventos, se necesita pasar un canvas
        //Para que llegue el evento de zoom-end y tal, hay que asociarlo al último canvas definido!!!!
        this.canvasHandler = new CyCanvasHandler(this.layerDraw.viewer);
        //Pongo unas dimensiones "razonables" que serían settings TODO
        //Para ello simulo un zoom de ventana
        this.canvasHandler.view('fgZoomInDrag', 
                                  {x: 50, y: 50}, {w: 300, h: 200});
        this.canvasHandler.view('fgSetHome');

        //Inicialización de la de draft, le ponemos atributos específicos de color y tal (TODO settings)
        this.layerDraft.pathColor ='yellow', this.layerDraft.pathWidth=3, this.layerDraft.selectedPathWidth=4, this.layerDraft.selectedPathColor='magenta';
        this.interactiveDrawing = new CyInteractiveDraw(this.canvasHandler, this.layerDraft);
 
        this.layerDraw.addEventListener('zoom_end', e => 
            this._redrawLayers());

        this.addEventListener('set-origin', e=>{
            this.canvasHandler.view("fgPane", {x:e.detail.data.x0, y:e.detail.data.y0});  //rehace los cálculos del handler
            this.layerDraw.translate(-e.detail.data.x0, -e.detail.data.y0);
            this._redrawLayers();
        });                        //gestión de la geometría a pintar
        this.addEventListener('new-block', e=>{
            this.layerDraft.clear();
            const blocks = createDrawElement(e.detail.type, e.detail.data);
            this.layerDraw.addBlocks(undefined, blocks);  //Ya añade los puntos también en su propio tree
            this.layerDraw.draw();
        });
        //Evento de cambio de escala, suele venir con el zoom, después. Lo habilito para que el dispatch siguiente lo dispare
        this.layerAxes.addEventListener('scale-change', (e) =>  {
            this.layerDraw.scaleChange(e.detail.scale)
        })
        //Hasta que no he puesto el listener de zoom-end no inicializo los canvas y extents
                //Inicializo todos los canvas, simulo un zoom
        this.layerDraw.dispatchEvent(new CustomEvent('zoom_end'));
        //Hasta que no se ha inicializado no puedo poner los extents y hacer draws (el setVisible hace draw)
        this.layerAxes.setAxesVisible(true);
        this.layerAxes.setGridVisible(true);
        this.layerDraw.setVisible(true);
        this.layerDraft.setVisible(true);

    }
    disconnectedCallback() {
    }
    handleEvent(evt) {
        let handler = evt.type;
        if (typeof this[handler] === "function") {
            evt.preventDefault(); //así no hay que hacerlo en cada una?
            return this[handler](evt);
        }
        else console.log(evt.type);
    }
    static get observedAttributes() {
      return [];
    }   
    // attributeChangedCallback(name, oldVal, newVal) {
    //   switch(name) {
    //     default:
    //         break;
    //   }
    // }
    //Desde aquí hacia arriba no se debería saber si no hace falta qué tipo de capa es, etc...
    setVisible(layer, value){
        if(layer === 'grid')
            this.layerAxes.setGridVisible(value);
        else if(layer === 'axes')
            this.layerAxes.setAxesVisible(value);
        else this.layerDraw.setVisible(layer, value);
    }

    fit(){
        const bbox = this.layerDraw.getBBox();
        this.canvasHandler.view('fgZoomInDrag', 
                                  {x: 0.5*(bbox.x0 + bbox.x1), y: 0.5*(bbox.y0 + bbox.y1)},
                                  {w: 1.1*(bbox.x1 - bbox.x0), h: 1.1*(bbox.y1 - bbox.y0)});
        this.canvasHandler.view('fgSetHome');
        this._redrawLayers();
    }
    setSelectCursor(r) {
        this.layerDraw.setAttribute('style', `cursor: url('data:image/svg+xml;utf8,<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="${2*r}" height="${2*r}"><circle cx="${r}" cy="${r}" r="${r}" stroke-width="1" style="stroke: black; fill: red;"/></svg>') ${r} ${r}, pointer;`);
    }
    removeSelectCursor() {
        this.layerDraw.removeAttribute('style');
    }
    clearCursors() {
        this.removeSelectCursor();
        ["zoomInCursor", "paneClickCursor"].forEach(c => this.layerDraw.classList.remove(c));
    }
    // view(cmd) {
    //     this.canvasHandler.view(cmd);
    // }
}

customElements.define('cy-canvas-viewer', CyCanvasViewer);