import { sharedStyles } from '../shared-styles.js';
import {inputDataInit, inputDataUpdate, initialDataBasic, inputDataSubtype, setEventHandlers, TX0Y0, TX1Y1, TX2Y2, TR, TCXCY, TA, TCWCCW} from './cy-input-data-templates.js'

export default class CyInputDataArc extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = type.toLowerCase();
        ['arc-cpa', 'arc-2pr', 'arc-3p'].forEach( el => this.dom.querySelector('#'+el).style.display = "none")
        this.dom.querySelector('#arc-'+ this.type).style.display="block";
        inputDataSubtype(this, `data-arc-${this.type}`);
        if(this.type === '2pr')
            this.dom.querySelector('#data-arc-2pr-r').dispatchEvent(new Event("change", { bubbles: true }));
        else if(this.type === 'cpa')
            this.dom.querySelector('#data-arc-cpa-a').dispatchEvent(new Event("change", { bubbles: true }));

    }
    //el ajuste de tamaños local con las etiquetas, que están normalizadas
    createStyle() {
        let style = `
    <style>
        #data-arc-2pr-way{ width:80%;}
        #data-arc-2pr-r{ width:80%;}
    </style>    `;
        return style;
    }

    createTemplate() {
        let t = 'arc-cpa';
        let h = `<div id="${t}" style="display:none;">${TCXCY(t)+TX1Y1(t)+TA(t)}</div>`
        t = 'arc-2pr';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)+TX1Y1(t)}<div class="row"><div class="_50">${TR(t)}</div><div class="_40">${TCWCCW(t)}</div></div></div>`;        
        t = 'arc-3p';
        h += `<div id="${t}"  style="display:none;">${TX0Y0(t)}
        <div class="row"> XM<input id="data-${t}-xm" class="_33" type="number" value="0" step="0.5"/>
            YM<input id="data-${t}-ym" class="_33" type="number" value="0" step="0.5"/></div>${TX1Y1(t)}</div>`
        return h;
    }

    connectedCallback() {
        //this.dom.innerHTML= this.createStyle() + this.createTemplate();
        //Aquí inicializamos con valores pasados en la creación que pueden ser guardados como preferencias o por sesión...
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
customElements.define('cy-input-data-arc', CyInputDataArc);