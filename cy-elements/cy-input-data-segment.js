//Esta pijada es solo porque si no el debugger ni se molesta en poner el source en la lista...
import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, inputDataUpdate, inputDataSubtype, setEventHandlers,TX0Y0, TX1Y1, TA, TD, TXx1, TYy1} from './cy-input-data-templates.js'
export default class CyInputDataSegment extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = type.toLowerCase();
        ['segment-np', 'segment-pp', 'segment-pxa', 'segment-pya', 'segment-pda', 'segment-tpb', 'segment-tbb'].forEach( el =>
             this.dom.querySelector('#'+el).style.display = "none")
        this.dom.querySelector('#segment-'+ this.type).style.display="block";
        inputDataSubtype(this, `data-segment-${this.type}`);
        if(this.type === 'pxa')
             this.dom.querySelector('#data-segment-pxa-a').dispatchEvent(new Event("change", { bubbles: true }));
        if(this.type === 'pya')
             this.dom.querySelector('#data-segment-pya-a').dispatchEvent(new Event("change", { bubbles: true }));
        if(this.type === 'pda'){
             this.dom.querySelector('#data-segment-pda-a').dispatchEvent(new Event("change", { bubbles: true }));
             this.dom.querySelector('#data-segment-pda-d').dispatchEvent(new Event("change", { bubbles: true }));
            }
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        let t = 'segment-np';
        let h =  `<div id="${t}" style="display:none;">${TX0Y0(t)}</div>`
        t = 'segment-pp';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TX1Y1(t)}</div>`
        t = 'segment-pxa';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TXx1(t)+TA(t)}</div>`
        t = 'segment-pya';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TYy1(t)+TA(t)}</div>`
        t = 'segment-pda';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TD(t)+TA(t)}</div>`
        t = 'segment-tpb';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)}</div>`
        t = 'segment-tbb';
        h +=  `<div id="${t}" style="display:none;"></div>`
        return h;
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
customElements.define('cy-input-data-segment', CyInputDataSegment);