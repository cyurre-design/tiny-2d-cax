//Heredo de layer genérica que me da los métodos de borrado, etc...
//import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import { position2pixels } from "./cy-canvas-handler.js";
import { CyCanvasLayer } from "./cy-canvas-layer.js";

export default class CyCanvasLayerDraft extends CyCanvasLayer {
    constructor() {
        super("draft");
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

    // createTextCanvas(text, font = '20px Arial', color = '#000') {
    //     const canvas = document.createElement('canvas');
    //     const ctx = canvas.getContext('2d');

    //     ctx.font = font;
    //     const metrics = ctx.measureText(text);

    //     canvas.width = Math.ceil(metrics.width);
    //     canvas.height = 30; // o calcula según font-size

    //     ctx.font = font;
    //     ctx.fillStyle = color;
    //     ctx.textBaseline = 'top';
    //     ctx.fillText(text, 0, 0);

    //     return canvas;
    //     }

    //EJEMPLO const textCache = createTextCanvas('42');
    //         ctx.drawImage(textCache, 50, 50);
    // ctx.drawImage(textCache, 200, 80);
    // ctx.drawImage(textCache, 300, 150);

    //Atención al orden de los canvas. Para que los eventos de mouse lleguen a draw, tiene que estar encima
    connectedCallback() {
        super.connectedCallback();
    }
    //x,y son mm
    //Hay que dar la vuelta al eje Y... casi mejor paso un array de posiciones y textos
    drawNumber(texts) {
        this.ctx.save(); // Save the normal state
        this.ctx.setTransform(); //lo pone de fábrica
        this.ctx.font = "20px Arial";
        this.ctx.fillStyle = "red";
        texts.forEach((t) => {
            const p = position2pixels({ x: t.x0, y: t.y0 });
            this.ctx.fillText(t.text, p.x, p.y); //0,0 porque hemos puesto los offsets antes
        });
        this.ctx.restore(); // Restore to normal state
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
customElements.define("cy-canvas-layer-draft", CyCanvasLayerDraft);
