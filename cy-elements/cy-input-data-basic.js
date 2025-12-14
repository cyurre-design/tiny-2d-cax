import { sharedStyles } from '../shared-styles.js';
import "./cy-input-data-angle.js"
import './cy-input-data-arc.js';
import './cy-input-data-circle.js';
import './cy-input-data-segment.js'
import './cy-input-data-polygon.js'
import './cy-input-data-path.js'
import './cy-input-data-transform.js'
import './cy-input-data-gcode.js'
import './cy-input-data-export-gcode.js'


const inputDataApps = ["arc","circle","segment","polygon","path","export-gcode","gcode","transform" ];
function inputDataTemplate(app){return `<cy-input-data-${app} class="share"></cy-input-data-${app}>`} 
const Keys4Events =  ["Enter", "Escape"]
export default class CyInputDataBasic extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];        
        this.data = {};
        this.inputs = {};
        this.keys = [];
    }

    createStyle() {
        let style = `
    <style> 
        :host{
        position:relative;
        width:100%;
        }               
        #container{
            }
        .share{
        display:none;}
        .show{
        display:block;
        left:0;
        top:0;
        }
    </style>
`;
    return style;
    }
    createTemplate() { return (`
<div id="container">
        ${inputDataApps.reduce((acc,app) => acc += inputDataTemplate(app), '')}
</div>`); }

    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
    }
    setActiveApplication(app, subType ){
        //tapa todos
        //console.log('setActiveApplication')
        inputDataApps.forEach(app => this.dom.querySelector('cy-input-data-'+app).classList.replace('show','share'));
        this.activeApplication = this.dom.querySelector('cy-input-data-'+app);
        this.activeApplication.subType = subType;
        this.activeApplication.classList.replace('share','show');
    }
    //Recibo el config de geometría pero no hay nada inicializado aunqie el dom existe
    //Paso el data entero, es pequeño y ya viene con el nombre de propiedad local
    initialData(data){
        //console.log('initialDataBasic')
        inputDataApps.forEach(app => {
            this.dom.querySelector('cy-input-data-'+app).initialData(data)})

    }
    update(data){
        this.activeApplication.update(data);
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {
        return [];
      }
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        default:
            break;
        }
    }
}
customElements.define('cy-input-data-basic', CyInputDataBasic);