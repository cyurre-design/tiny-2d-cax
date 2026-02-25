import { sharedStyles } from "../shared-styles.js";
import {
    inputDataInit,
    initialDataBasic,
    inputDataUpdate,
    inputDataSubtype,
    setEventHandlers,
    TSA,
    TX0Y0,
    TENTER,
} from "./cy-input-data-templates.js";
export default class CyInputDataBackground extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({ mode: "open" });
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = "p"; //por mantener coherencia y estandarización de tipo-subtipo-propiedad
        this.type = type.toLowerCase();
        inputDataSubtype(this, `data-background-${this.type}`);
        //        this.dom.querySelector("#data-export-gcode-decs").dispatchEvent(new Event("change", { bubbles: true }));
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        let t = `background`;
        let h = `<div id=${t}>`;
        h += `<div class="row">BACKGROUND</div>`;
        h += `<div class="row"></div>`;
        h += `<div class="row">${TX0Y0(t)}</div>`;
        h += `${TSA(t)}</div>`;

        return h;
    }

    connectedCallback() {
        inputDataInit(this); //Esto debe inicializar los punteros a componentes y lee sus valores de html
        setEventHandlers(this);
        this.addEventListener("input-click", (e) => {
            if (e.detail.save !== undefined) {
                //no miro con qué texto viene, solo que se manda
                //Recojo un objeto con las partes de iso puestas y se lo paso al main con evento
                //this.dispatchEvent(new CustomEvent('generate-iso', { bubbles: true , composed:true, detail:this.data}))
                //console.log(this.data);
            }
        });
    }
    //Llamo al contenedor, que me hace de clase base
    update(data) {
        inputDataUpdate(this, data);
    }
    //Aquí se inicializan los valores de los componentes con lo que se pase, y viene para todos los subtipos...
    //Se inicializan antes de activarse el menú
    initialData(data) {
        initialDataBasic(this, data);
    }
    disconnectedCallback() {}
    static get observedAttributes() {
        return [];
    }
    /**@todo unificar a clase data la selección */
    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
            default:
                break;
        }
    }
}
customElements.define("cy-input-data-background", CyInputDataBackground);
