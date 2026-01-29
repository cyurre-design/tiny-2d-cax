"use strict";

import "./cy-canvas-layer-axes.js";
import "./cy-canvas-layer-draw.js";
import "./cy-canvas-layer-draft.js";

import CyCanvasHandler from "./cy-canvas-handler.js";
import CyInteractiveDraw from "../cy-draw-interactive/cy-interactive-draw.js";
//import {createDrawElement} from '../cy-geometry/cy-geometry-basic-elements.js';
//import {CommandManager } from './cy-command-manager.js';

//En este componente agrupamos la gestión de los varios canvas que tenemos
//layerDraw por su parte virtualiza las capas de dibujo en una sola capa física
//y una de borrador
/**
 * @class que virtualiza algunas acciones sobre las capas físicas y/o lógicas, como ocultar, etc...
 * y además debe proporcionar estilo??
 * Una función fundmental es mantner la coherencia de dimensiones cuando hacemos zoom, pane, etc...
 */
export default class CyCanvasViewer extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({ mode: "open" });
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
    _redrawLayers() {
        let ext = this.canvasHandler.getExtents();
        this.canvasLayers.forEach((ly) => {
            ly.setExtents(ext);
            ly.draw();
        });
    }
    //Desde aquí hacia arriba no se debería saber si no hace falta qué tipo de capa es, etc...
    /**
     *
     * @param {string} layer  la capa que queremos ocultarver
     * @param {boolean} value true/false
     * No he virtyualizado ejes / grid porque no merece mucho la pena, la verdad
     */
    setVisible(layerId, value) {
        if (layerId === "GRID") this.layerAxes.setGridVisible(value);
        else if (layerId === "AXES") this.layerAxes.setAxesVisible(value);
        else this.layerDraw.setVisible(layerId, value);
    }
    /**
     *
     * @param {string} layer
     * @param {string} newName
     * @param {object} value incluye el propio name, id y style con atributos
     */
    setStyle(layerId, value) {
        let ret =
            layerId === "GRID"
                ? this.layerAxes.setGridStyle(value)
                : layerId === "AXES"
                  ? this.layerAxes.setAxesStyle(value)
                  : this.layerDraw.setStyle(layerId, value);
        this._redrawLayers();
        return ret;
    }
    connectedCallback() {
        this.dom.innerHTML = this.createStyle() + this.createTemplate();

        this.layerAxes = this.dom.querySelector("#axes");
        this.layerDraw = this.dom.querySelector("#draw");
        this.layerDraft = this.dom.querySelector("#draft");
        this.canvasLayers = [this.layerAxes, this.layerDraw, this.layerDraft];
        // Para intentar unificar los layers
        this.axesLayer = this.layerAxes.axesLayer;
        this.gridLayer = this.layerAxes.gridLayer;

        //Para gestión de zoom y pane la asignamos al draw, los otros no tienen eventos, se necesita pasar un canvas
        //Para que llegue el evento de zoom-end y tal, hay que asociarlo al último canvas definido!!!!
        this.canvasHandler = new CyCanvasHandler(this.layerDraft.viewer);
        //Pongo unas dimensiones "razonables" que serían settings TODO
        //Para ello simulo un zoom de ventana
        this.canvasHandler.view("fgZoomInDrag", { x: 50, y: 50 }, { w: 300, h: 200 });
        this.canvasHandler.view("fgSetHome");

        //Inicialización de la de draft, le ponemos atributos específicos de color y tal (TODO settings)
        //los colores y grosores vienen del estilo. Si se ponen en un json de settings puede ir aquí..
        /**@todo decidir si esto es estilo, son, clas.... */
        ((this.layerDraft.pathColor = "yellow"),
            (this.layerDraft.pathWidth = 3),
            (this.layerDraft.selectedPathWidth = 4),
            (this.layerDraft.selectedPathColor = "magenta"));
        this.interactiveDrawing = new CyInteractiveDraw(this.canvasHandler, this.layerDraft);
        /**@listens zoom-end cambios en la relación window - viewport , o sea, coordenadas mundo y bitamp */
        this.addEventListener("zoom_end", (e) => this._redrawLayers());
        //--------------------------------------

        /**@listens scale-change podría estar en el zoom-end pero es más específico, indica que la escala hacambiado y sirve
         * para cambiar el tamaño del cursor de búsque o cosas relacionadas
         */
        //Evento de cambio de escala, suele venir con el zoom, después. Lo habilito para que el dispatch siguiente lo dispare
        this.layerAxes.addEventListener("scale-change", (e) => {
            this.layerDraw.scaleChange(e.detail.scale);
        });
        //Hasta que no he puesto el listener de zoom-end no inicializo los canvas y extents
        /**
         * @emits zoom_end auque no le corresponde, lanza la ejecución en cada ventana del ajuste de escalas
         * Inicializo todos los canvas, simulo un zoom
         */
        this.dispatchEvent(new CustomEvent("zoom_end"));
        //Hasta que no se ha inicializado no puedo poner los extents y hacer draws (el setVisible hace draw)
        this.setVisible("GRID", true);
        this.setVisible("AXES", true);
        //this.layerDraw.setVisible(true);
        this.layerDraft.setVisible(true);
    }
    /**@todo eliminación de listeners, solo tiene sentido al implementar pantallas de CAM y CNC */
    disconnectedCallback() {}
    handleEvent(evt) {
        let handler = evt.type;
        if (typeof this[handler] === "function") {
            evt.preventDefault(); //así no hay que hacerlo en cada una?
            return this[handler](evt);
        } else console.log(evt.type);
    }
    /** de momento no tenemos atributos pero podrían ser algunos como:
     *  tamaño inicial (ventana), etc...
     */
    static get observedAttributes() {
        return [];
    }
    // attributeChangedCallback(name, oldVal, newVal) {
    //   switch(name) {
    //     default:
    //         break;
    //   }
    // }

    /**
     * Obtenemos el box que engloba todo lo que hay en la geometría y simulamos el evento de zoom con ventana
     * @todo que e comando esté en el canvasHandler de forma original . Llma a l función o emitir un event esecífico !
     */
    fit() {
        const bbox = this.layerDraw.getBBox();
        if (bbox.x0 === Infinity || bbox.y0 === Infinity || bbox.x1 === -Infinity || bbox.y1 === -Infinity) return; //no hay nada que encuadrar
        this.canvasHandler.view(
            "fgZoomInDrag",
            { x: 0.5 * (bbox.x0 + bbox.x1), y: 0.5 * (bbox.y0 + bbox.y1) },
            { w: 1.1 * (bbox.x1 - bbox.x0), h: 1.1 * (bbox.y1 - bbox.y0) },
        );
        this.canvasHandler.view("fgSetHome");
        this._redrawLayers();
    }
    //Gestión de los cursores, TODO
    /**@todo */
    setSelectCursor(r) {
        this.layerDraw.setAttribute(
            "style",
            `cursor: url('data:image/svg+xml;utf8,<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="${2 * r}" height="${2 * r}"><circle cx="${r}" cy="${r}" r="${r}" stroke-width="1" style="stroke: black; fill: red;"/></svg>') ${r} ${r}, pointer;`,
        );
    }
    removeSelectCursor() {
        this.layerDraw.removeAttribute("style");
    }
    clearCursors() {
        this.removeSelectCursor();
        ["zoomInCursor", "paneClickCursor"].forEach((c) => this.layerDraw.classList.remove(c));
    }
}

customElements.define("cy-canvas-viewer", CyCanvasViewer);
