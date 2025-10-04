//Heredo de layer genérica que me da los métodos de borrado, etc...
import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import CyCanvasLayer from './cy-canvas-layer.js';


export default class CyCanvasLayerDraft extends CyCanvasLayer {
    constructor() {
        super('draft');
        //this.dom = this.attachShadow({mode:'open'});
        this.dataLayers = [];
        this._activeLayer = undefined;
        }
    createStyle() {
        return`
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
        `
    }
    //Atención al orden de los canvas. Para que los eventos de mouse lleguen a draw, tiene que estar encima
    connectedCallback(){
        super.connectedCallback();
        const style = getComputedStyle(this);
        this.pathWidth = +style.getPropertyValue('--path-width') || 2;
        this.pathColor = style.getPropertyValue('--path-color') || 'magenta';
        this.selectedWidth = +style.getPropertyValue('--selected-width') || 2;
        this.selectedColor = style.getPropertyValue('--selected-color') || 'gray';
        this.draftPath = {
            tr : this.ctx.getTransform(),
            path: new Path2D()
        }

    }
    disconnectedCallback(){
        //Aquí hay que quitar los listeners siendo formales
        super.disconnectedCallback();
    }
    static get observedAttributes(){
        return([]);
    }   
    attributeChangedCallback(name, oldVal, newVal){
        switch(name){
        case '':
          break;
        default:break;
      }
    }
    draw() {
        super.clear();
        const tr = this.ctx.getTransform();
        this.ctx.setTransform(this.draftPath.tr);
        super._drawPaths(this.draftPath.path, this.pathWidth, this.pathColor);
        this.ctx.setTransform(tr);
        return;
    }
    setTranslation(pi,pf){
        const dx = pf.x - pi.x, dy = pf.y - pi.y;
        const tr = this.ctx.getTransform();
        this.ctx.translate(dx,dy);
        this.draftPath.tr = this.ctx.getTransform();
        this.ctx.setTransform(tr);
    }
    setDraftPath(path){
        this.draftPath.path = path;
    }
    drawTransformedPaths( pi, pf /*, paths*/){
        this.setTranslation(pi,pf);
        this.draw();

        // const dx = pf.x - pi.x, dy = pf.y - pi.y;
        // const tr = this.ctx.getTransform();
        // this.ctx.translate(dx,dy);
        // super._drawPaths(this.draftPath.path, this.pathWidth, this.pathColor);
        // this.draftPath = this.ctx.getTransform();
        // this.ctx.setTransform(tr);
    }
}
customElements.define('cy-canvas-layer-draft', CyCanvasLayerDraft);