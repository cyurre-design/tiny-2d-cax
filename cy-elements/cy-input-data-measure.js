//Esta pijada es solo porque si no el debugger ni se molesta en poner el source en la lista...
import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, initialDataBasic, inputDataUpdate, inputDataSubtype, setEventHandlers,TX0Y0, TX1Y1, TA, TD, TXx1, TYy1} from './cy-input-data-templates.js'
export default class CyInputDataMeasure extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        console.log(type);
        this.type = type.toLowerCase();
        ['measure-block', 'measure-p2p'].forEach( el =>
             this.dom.querySelector('#'+el).style.display = "none")
        this.dom.querySelector('#measure-'+ this.type).style.display="block";
        inputDataSubtype(this, `data-measure-${this.type}`);
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        let t = 'measure-block';
        let h =  `<div id="${t}" style="display:none;">
        <div class="row">PATH LENGTH <input id='data-${t}-lblock' value="0" class="_50"/></div>
        <div class="row">LENGTH <input id='data-${t}-lpath' value="0" class="_50"/></div></div>`
        t = 'measure-p2p';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)}${TX1Y1(t)}
        LENGTH <input id='data-${t}-len' value="0" /></div>`
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
customElements.define('cy-input-data-measure', CyInputDataMeasure);