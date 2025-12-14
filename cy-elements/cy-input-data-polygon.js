import { sharedStyles } from '../shared-styles.js';
import { inputDataInit, inputDataUpdate, inputDataSubtype, setEventHandlers, TX1Y1, TCXCY} from './cy-input-data-templates.js'

export default class CyInputDataPolygon extends HTMLElement {
    constructor( ) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];        
    }
    set subType(type) {
        this.type = 'p' //por mantener coherencia y estandarización de tipo-subtipo-propiedad
        inputDataSubtype(this, `data-polygon-${this.type}`);
        this.dom.querySelector('#data-polygon-p-vertex').dispatchEvent(new Event("change", { bubbles: true }));
        this.dom.querySelector('#data-polygon-p-edges').dispatchEvent(new Event("change", { bubbles: true }));
    }    //por mantener la estructura
    createStyle() {
        let style = `<style>
        </style>`;
        return style;
    }
    createTemplate() {
        const TNE =  `N_EDGES<select id="data-polygon-p-edges" class="data"><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        <option value="6" selected>6</option><option value="7">7</option><option value="8">8</option>
        <option value="9">9</option><option value="10">10</option><option value="11">11</option></option><option value="12">12</option></select>`;
        const TVE = `VERTEX<select id="data-polygon-p-vertex" class="data"><option value="1" selected>VERTEX</option><option value="0">EDGE</select>`;

        let t = 'polygon-p';
        let h = `<div id="${t}" >${TCXCY(t)+TX1Y1(t)+TNE+TVE}</div>`
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
customElements.define('cy-input-data-polygon', CyInputDataPolygon);