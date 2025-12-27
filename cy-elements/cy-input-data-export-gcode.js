import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, initialDataBasic, inputDataUpdate, inputDataSubtype, setEventHandlers, TSTART, TESC, TSAVE, TINVERT} from './cy-input-data-templates.js'
export default class CyInputDataExportGcode extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = 'p' //por mantener coherencia y estandarización de tipo-subtipo-propiedad
        inputDataSubtype(this, `data-path-${this.type}`);
        this.dom.querySelector('#data-export-gcode-header').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-export-gcode-footer').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-export-gcode-post').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-export-gcode-pre').dispatchEvent(new Event("change", { bubbles: true }));
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        let t = `export-gcode`;
        let h = `<div id=${t}>`;
        h += `<div class="_20">Header</div>
                <textarea  id="data-${t}-header" autofocus class="data _80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">Footer</div>
                <textarea  id="data-${t}-footer" class="data _80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">Post</div>
                <textarea  id="data-${t}-post" class="data _80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">Pre</div>
                <textarea  id="data-${t}-pre" class="data _80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="row">ORDER<input type="number" min="1" step="1" value="1" id="data-order" class="_20"/></div>`
        h += `<div class="row">${TESC(t) + TSAVE(t) + TINVERT(t) + TSTART(t)}</div></div>`
        return h
    }

    connectedCallback() {
        inputDataInit(this) //Esto debe inicializar los punteros a componentes y lee sus valores de html
        setEventHandlers(this);
        this.addEventListener('input-click', (e) =>{
            if(e.detail.save !== undefined){ //no miro con qué texto viene, solo que se manda
                //Recojo un objeto con las partes de iso puestas y se lo paso al main con evento
                //this.dispatchEvent(new CustomEvent('generate-iso', { bubbles: true , composed:true, detail:this.data}))
                //console.log(this.data);
            }})
    }
    //Llamo al contenedor, que me hace de clase base
    update(data){
        inputDataUpdate(this, data);
    }
    //Aquí se inicializan los valores de los componentes con lo que se pase, y viene para todos los subtipos...
    //Se inicializan antes de activarse el menú
    initialData(data){
        initialDataBasic(this, data)
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {return []}
    /**@todo unificar a clase data la selección */   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        default:
            break;
    }
    }
}
customElements.define('cy-input-data-export-gcode', CyInputDataExportGcode);