//Heredo de layer genérica que me da los métodos de borrado, etc...
//import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import { position2pixels } from "./cy-canvas-handler.js";
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
        
        #draft-layer{
            display:block;
            overflow: hidden;
            position: absolute;
            left: 0px;
            top:0px;
            width: 100%;
            height: 100%;
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
    draw(image) {
        //A deliberar...
        //const offset = position2pixels({ x: 0, y: 0 });
        //this.ctx.drawImage(data, -offset.x, -offset.y);
        const old = this.ctx.getTransform();
        this.ctx.setTransform();
        this.ctx.drawImage(image, 0, 0, this.viewer.width, this.viewer.height);
        this.ctx.setTransform(old);
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
