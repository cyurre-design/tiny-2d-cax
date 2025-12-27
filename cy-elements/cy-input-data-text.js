import {inputDataInit, initialDataBasic, inputDataUpdate, inputDataSubtype, setEventHandlers, TA,TCWCCW, TL2RR2L,TESC, TINS} from './cy-input-data-templates.js'
import { sharedStyles } from '../shared-styles.js';

export default class CyInputDataText extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = 'p' //por mantener coherencia y estandarización de tipo-subtipo-propiedad
        //Si no tiene subtipo se puede confundir con otros htmls 
        inputDataSubtype(this, `data-text-${this.type}`);
        this.dom.querySelector('#data-text-p-a').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-text-p-way').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-text-radius').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-text-font').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-text-size').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-text-p-invert').dispatchEvent(new Event("change", { bubbles: true }));
    }
    createStyle() {
        let style = `<style>
        #text-font-name: {width:70%;}
        #text-font-size: {width:10%;}
        </style>`;
        return style;
    }
    createTemplate() {
        let t = `text-p`;
        let h = `<div id=${t}>
        <div class = "row">FONT <select id="data-text-font" class="_60 data"></select><input class="_20" id="data-text-size" type="number" min="1" max="100" step="0.5" value="10"/></div>
        <div class = "row">TEXT <input class="_80 data" id="data-text-text" type="text" value=""/></div>
        <div class = "row">${TA(t)}</div> 
        <div class = "row"><div class="_50">RADIUS<input class="data" id="data-text-radius" type="number" min="1" max="100" step="1" value="0"/>${TCWCCW(t)}${TL2RR2L(t)}</div>
       
        </div>`
        h += `<div class="row">${TESC(t)+TINS(t)}</div> </div>`
        return h
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        //Aquí inicializamos con valores pasados en la creación que pueden ser guardados como preferencias o por sesión...
        inputDataInit(this) //Esto debe inicializar los punteros a componentes y lee sus valores de html
        setEventHandlers(this);
        //VERSION CON SERVIDOR
        //Cuando se carga miramos qué fonts existen
        fetch('/getFontNames').then(response=>{
            response.json().then(fonts=>{
              let sel = this.dom.querySelector("#data-text-font");
              fonts.forEach(f=>
                sel.options[sel.options.length] = new Option(f,f))
              
            })
         })

    }
    //Llamo al contenedor, que me hace de clase base
    update(data){
        inputDataUpdate(this, data);
    }
    //Aquí se inicializan los valores de los componentes con lo que se pase, y viene para todos los subtipos...
    //Se inicializan antes de activarse el menú
    initialData(data){
        initialDataBasic(this, data);
        //const buffer = fetch(this.data[]).then(res => res.arrayBuffer());
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
customElements.define('cy-input-data-text', CyInputDataText);