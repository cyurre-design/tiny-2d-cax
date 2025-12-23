import { sharedStyles } from '../shared-styles.js';
import { inputDataInit, inputDataUpdate, initialDataBasic, inputDataSubtype, setEventHandlers, TX0Y0, TX1Y1, TA, TENTER, TESC, TSCALE, TXx0, TYy0} from './cy-input-data-templates.js'

export default class CyInputDataTransform extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
    }
    //Aunque los html ya están inicializados, hay que pasar la info al componente que dibuja
    set subType(type) {
        this.type = type.toLowerCase();
        ['transform-origin', 'transform-scale', 'transform-translate', 'transform-rotate',
            'transform-symmetryx', 'transform-symmetryy', 'transform-symmetryl' ].forEach( el =>
                this.dom.querySelector('#'+el).style.display = "none")
        this.dom.querySelector('#transform-'+ this.type).style.display="block";
        inputDataSubtype(this, `data-transform-${this.type}`);
        if(this.type === 'scale'){
             this.dom.querySelector('#data-transform-scale-sn').dispatchEvent(new Event("change", { bubbles: true }));
             this.dom.querySelector('#data-transform-scale-sd').dispatchEvent(new Event("change", { bubbles: true }));
        }
        if(this.type === 'rotate'){
             this.dom.querySelector('#data-transform-rotate-a').dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }

    createTemplate() {
        let t = 'transform-origin';
        let h = `<div id="${t}" style="display:none;">${TX0Y0(t)}</div>`
        t = 'transform-scale';
        h +=  `<div id="${t}" style="display:none;">${TX0Y0(t)}<div class="row">${TSCALE(t)}</div><div class="row">${TENTER(t)+TESC(t)}</div></div>`;        
        t = 'transform-translate';
        h += `<div id="${t}"  style="display:none;">${TX0Y0(t)+TX1Y1(t)}</div>`
        t = 'transform-rotate';
        h += `<div id="${t}"  style="display:none;">${TX0Y0(t)+TA(t)}<div class="row">${TENTER(t)+TESC(t)}</div></div>`
        t = 'transform-symmetryx';
        h += `<div id="${t}"  style="display:none;">${TYy0(t)}</div>`
        t = 'transform-symmetryy';
        h += `<div id="${t}"  style="display:none;">${TXx0(t)}</div>`
        t = 'transform-symmetryl';
        h += `<div id="${t}"  style="display:none;"></div>`
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
customElements.define('cy-input-data-transform', CyInputDataTransform);