import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, initialDataBasic, inputDataUpdate, inputDataSubtype, setEventHandlers, TX0Y0, TX1Y1, TENTER, TESC, TBACK} from './cy-input-data-templates.js'

export default class CyInputDataPath extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = 'p' //por mantener coherencia y estandarización de tipo-subtipo-propiedad
        inputDataSubtype(this, `data-path-${this.type}`);
    }
    createStyle() {
        return `<style></style>`
    }
    createTemplate() {
        let t = 'path-p';
        let h = `<div id="${t}" >${TX0Y0(t)+TX1Y1(t)}<div class="row">${TENTER(t)+TESC(t)+TBACK(t)}</div></div>`
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
customElements.define('cy-input-data-path', CyInputDataPath);