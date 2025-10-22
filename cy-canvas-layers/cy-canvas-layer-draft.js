//Heredo de layer genérica que me da los métodos de borrado, etc...
import {scalePixels2mm, scaleMm2pixels, position2pixels} from './cy-canvas-handler.js';
import CyCanvasLayer from './cy-canvas-layer.js';


export default class CyCanvasLayerDraft extends CyCanvasLayer {
    constructor() {
        super('draft');
        //this.dom = this.attachShadow({mode:'open'});
        //this.dataLayers = [];
        //this._activeLayer = undefined;
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

}
customElements.define('cy-canvas-layer-draft', CyCanvasLayerDraft);