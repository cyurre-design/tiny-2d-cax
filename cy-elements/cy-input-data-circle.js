import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, initialDataBasic, inputDataUpdate, inputDataSubtype, setEventHandlers, TX0Y0, TX1Y1, TX2Y2, TR, TCXCY, TCWCCW} from './cy-input-data-templates.js'

export default class CyInputDataCircle extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = type.toLowerCase();
        ['circle-cp', 'circle-cr', 'circle-3p', 'circle-2pr'].forEach( el => this.dom.querySelector('#'+el).style.display = "none")
        this.dom.querySelector('#circle-'+ this.type).style.display="block";
        inputDataSubtype(this, `data-circle-${this.type}`);
        if(this.type === '2pr') 
            this.dom.querySelector('#data-circle-2pr-r').dispatchEvent(new Event("change", { bubbles: true }));
        if(this.type === 'cr') 
            this.dom.querySelector('#data-circle-cr-r').dispatchEvent(new Event("change", { bubbles: true }));
    }
    createStyle() {
        let style = `
    <style>
        #data-circle-2pr-r{ width:80%;}
    </style>`;
        return style;
    }
    createTemplate() {
        let t = 'circle-cp';
        let h = `<div id="${t}" style="display:none;">${TCXCY(t)+TX1Y1(t)}</div>`
        t = 'circle-cr';
        h += `<div id="${t}" style="display:none;">${TCXCY(t)+TR(t)}</div>`
        t = 'circle-2pr';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TX1Y1(t)}<div class="row"><div class="_50">${TR(t)}</div><div class="_40">${TCWCCW(t)}</div></div></div>`;        
        t = 'circle-3p';
        h += `<div id="${t}"  style="display:none;">${TX0Y0(t)+TX1Y1(t)+TX2Y2(t)}</div>`
        return h;
    }

    connectedCallback() {
        inputDataInit(this) //Esto debe inicializar los punteros a componentes y lee sus valores de html
        setEventHandlers(this);
    }
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
customElements.define('cy-input-data-circle', CyInputDataCircle);