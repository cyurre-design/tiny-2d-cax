import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, inputDataUpdate, inputDataSubtype, setEventHandlers, TCWCCW, TESC, TSAVE} from './cy-input-data-templates.js'
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
        // if(this.type === '2pr')
        //     this.dom.querySelector('#data-arc-2pr-r').dispatchEvent(new Event("change", { bubbles: true }));
        // else if(this.type === 'cpa')
        //     this.dom.querySelector('#data-arc-cpa-a').dispatchEvent(new Event("change", { bubbles: true }));
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        let t = `export-gcode`;
        let h = `<div id=${t}>`;
        h += `<div class="_20">Start</div>
                <textarea  id="data-${t}-start" autofocus class="_80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">End</div>
                <textarea  id="data-${t}-end" class="_80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">Move</div>
                <textarea  id="data-${t}-move" class="_80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="_20">Cut</div>
                <textarea  id="data-${t}-cut" class="_80" contenteditable="plaintext-only" maxlength="50" ></textarea>`
        h +=  `<div class="row">ORDER<input type="number" min="1" step="1" value="1" id="data-order" class="_20"/>${TCWCCW}</div>`
        h += `<div class="row">${TESC(t) + TSAVE(t)}</div></div>`
        return h
    }

    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        //Aquí inicializamos con valores pasados en la creación que pueden ser guardados como preferencias o por sesión...
        inputDataInit(this) //Esto debe inicializar los punteros a componentes y lee sus valores de html
        setEventHandlers(this);
    }
    //Llamo al contenedor, que me hace de clase base
    update(data){
        inputDataUpdate(this, data);
    }
    //Aquí se inicializan los valores de los componentes con lo que se pase, y viene para todos los subtipos...
    //Se inicializan antes de activarse el menú
    initialData(data){
        if(!data) return;
        for(let [k,v] of Object.entries(data)){
            if(this.dom.querySelector('#data-'+k) !== null)
                this.dom.querySelector('#data-'+k).value = v
            }
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