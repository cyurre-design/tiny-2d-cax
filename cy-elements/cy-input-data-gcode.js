import {inputDataInit, inputDataUpdate, inputDataSubtype, setEventHandlers, TESC, TINS} from './cy-input-data-templates.js'
import { sharedStyles } from '../shared-styles.js';

export default class CyInputDataGcode extends HTMLElement {
    constructor( subType, initialData) {
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
        let t = `gcode-p`;
        let h = `<div id=${t}>`;
        h += `<div class="full"><textarea  id="${t}"  autofocus class="full" contenteditable="plaintext-only"></textarea></div>`
        h += `<div class="row">${TESC(t)+TINS(t)}></div> </div>`
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
customElements.define('cy-input-data-gcode', CyInputDataGcode);