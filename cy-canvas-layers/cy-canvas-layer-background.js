//Heredo de layer genérica que me da los métodos de borrado, etc...
//import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
//import { position2pixels } from "./cy-canvas-handler.js";
import { CyCanvasLayer } from "./cy-canvas-layer.js";

export default class CyCanvasLayerBackgrouund extends CyCanvasLayer {
    constructor() {
        super("background");
        //this.dom = this.attachShadow({mode:'open'});
        //this.dataLayers = [];
        //this._activeLayer = undefined;
    }
    createStyle() {
        return `
        <style>
        
        #background-layer{
            display:block;
            overflow: hidden;
            position: absolute;
            left: 0px;
            top:0px;
            width: 100%;
            height: 100%;
        }
        canvas{
            *mix-blend-mode: multiply;*/
            filter: gray-scale(100%) contrast(2) invert(1);
        }
            div{            width: 100%;
            height: 100%;
}
        </style>
        `;
    }

    //Atención al orden de los canvas. Este debería estar al fondo, no recibe eventos y los otros pintan por encima
    connectedCallback() {
        super.connectedCallback();
    }
    setImage(image) {
        this.background = image; //copio la imagen
        const rx = image.width / this.viewer.width;
        const ry = image.height / this.viewer.height;
        this.z = Math.max(rx, ry); //zoom = pixels image / pixels canvas
        this.imgsize = { w: image.width / this.z, h: image.height / this.z };
        this.rotationAngle = 0;
        this.draw();
        return this.imgsize;
    }
    draw() {
        this.clear();
        if (this.background) {
            //Hay que tener el mismo zoom porque si no distorsiona la imagen, lógicamente
            const w = this.z * this.viewer.width;
            const h = this.z * this.viewer.height;
            this.ctx.scale(1, -1);
            this.ctx.translate(-0.5 * this.imgsize.w, -0.5 * this.imgsize.h);
            this.ctx.filter = "grayscale(100%)";
            if (this.rotationAngle !== 0) {
                this.ctx.rotate((this.rotationAngle * Math.PI) / 180);
            }
            this.ctx.drawImage(this.background, 0, 0, w, h, 0, 0, this.viewer.width, this.viewer.height);
        }
    }
    rotateR() {
        this.rotationAngle -= 1;
        this.draw();
    }
    rotateL() {
        this.rotationAngle += 1;
        this.draw();
    }
    disconnectedCallback() {
        //Aquí hay que quitar los listeners siendo formales
        super.disconnectedCallback();
    }
    static get observedAttributes() {
        return [];
    }
    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
            case "":
                break;
            default:
                break;
        }
    }
}
customElements.define("cy-canvas-layer-background", CyCanvasLayerBackgrouund);
