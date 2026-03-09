//Heredo de layer genérica que me da los métodos de borrado, etc...
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
        this.translation = { x: -0.5 * this.imgsize.w, y: -0.5 * this.imgsize.h };
        this.scaleFactor = 1;
        this.rotationAngle = 0;
        this.contrast = 2;
        this.draw();
        return this.imgsize;
    }
    draw() {
        this.clear();
        if (this.background) {
            //Hay que tener el mismo zoom porque si no distorsiona la imagen, lógicamente
            const w = this.z * this.viewer.width;
            const h = this.z * this.viewer.height;
            const oldT = this.ctx.getTransform();

            this.ctx.scale(this.scaleFactor, -this.scaleFactor);
            //this.ctx.translate(-0.5 * this.imgsize.w, -0.5 * this.imgsize.h);
            this.ctx.translate(this.translation.x, this.translation.y);
            this.ctx.filter = `"grayscale(100%) contrast(${this.contrast})"`;
            if (this.rotationAngle !== 0) {
                this.ctx.rotate((this.rotationAngle * Math.PI) / 180);
            }
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(this.background, 0, 0, w, h, 0, 0, this.viewer.width, this.viewer.height);
            this.ctx.setTransform(oldT);
        }
    }
    translate(dx, dy) {
        //ye acumulativo
        if (this.background) {
            this.translation.x -= dx;
            this.translation.y += dy;
            //this.translation = { x: -dx - 0.5 * this.imgsize.w, y: -dy - 0.5 * this.imgsize.h };
            this.draw();
        }
    }
    rotate(angle) {
        if (this.background) {
            this.rotationAngle = angle;
            this.draw();
        }
    }
    scale(z) {
        if (this.background) {
            this.scaleFactor = z;
            this.draw();
        }
    }
    contrast(value) {}
    // rotateL(angle) {
    //     this.rotationAngle = angle;
    //     this.draw();
    // }
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
