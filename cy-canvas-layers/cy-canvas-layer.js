"use strict";
import {getPathFromBlocks } from './cy-elements-to-canvas.js'
import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';

export const canvasCSS = {
    pathColor: 'green',
    pathWidth: 2,
    selectedColor: 'yellow',
    selectedWidth: 3,
    printColor: 'black',
    printWidth: 2,
    pointDimension : 3
}

export class CyCanvasLayer extends HTMLElement {
    constructor(name) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.visible = true;
        this.name = name;

    }
        createStyle(name) {
        let style = `
            <style>
                #${name} {
                    --color: var(--${name}-color, #111111);
                    --width: var(--${name}-width, 2);
                }
 
            </style>
        `;

       return style;
    }

    connectedCallback(){
        this.dom.innerHTML = `<canvas id='canvas-${this.name}'></canvas>` + this.createStyle(this.name);
        this.viewer = this.dom.querySelector(`#canvas-${this.name}`);
        //las propiedades leídas siempre están en enteros, pero internamente parece que están en float
        //por eso el floor no hace nada, pero medio pixel más nos saca del cuadro
        this.viewer.setAttribute("width", this.parentNode.clientWidth );
        this.viewer.setAttribute("height", this.parentNode.clientHeight);
        this.ctx = this.viewer.getContext('2d');
        //this.extents = {xi: 0, yi: 0, xf: 100, yf: 100};

    }
    disconnectedCallback(){
    }
    static get observedAttributes(){
      return(['name']);
    }   
    attributeChangedCallback(att, oldVal, newVal){
      //this[name] = typeof(this.name) === ''? +newValue: newValue;
      switch(att){
        case 'name': this.name=newVal;
          break;
        default:break;
      }
    }        
    //espera true o false
    setVisible(visible) {
        this.style.setProperty('visibility', visible ? 'visible' : 'hidden');
    }
    isVisible() {
        return this.style.getPropertyValue('visibility') === 'visible' ? true : false;
    }
    setHandler(canvasHandler) {
        this.canvasHandler = canvasHandler;
    }
    setExtents(extents) {
        this.extents = extents;
        const scale = scaleMm2pixels(1);
        const offset = position2pixels({x:0, y:0});
        this.ctx.setTransform(scale, 0, 0, -scale, offset.x, offset.y);
    }
    draw(){/*console.log('draw sin definir')*/}    //esta se debe sobrecargar
    clear(){
        const old = this.ctx.getTransform();
        this.ctx.setTransform();
        this.ctx.clearRect(0,0,this.viewer.width,this.viewer.height);
        this.ctx.setTransform(old);
    }
    //Tal como se define, drawBlocks acepta puntos...
    //Aquí no usamos el color y width del path, sino que se le pueden pasar otros valores
    drawBlocks(blocks, w=2, c="yellow"){
        let path = getPathFromBlocks(blocks);
        this.ctx.lineWidth = w;
        this.ctx.strokeStyle = c;
        this.ctx.stroke(path);
    }
    // drawPathArrow(block, w=2, c=this.pathColor){
    //     const path = getArrowFromPath(block, w);
    //     if(path === '') return;
    //     this.ctx.lineWidth = w;
    //     this.ctx.strokeStyle = c;
    //     this.ctx.stroke(path);
    // }
    _drawPaths(path, w, c){
        this.ctx.lineWidth = w;
        this.ctx.strokeStyle = c;
        this.ctx.stroke(path);
    }
        

}
customElements.define('cy-canvas-layer', CyCanvasLayer);