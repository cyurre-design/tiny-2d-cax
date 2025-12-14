import { sharedStyles } from '../shared-styles.js';

export default class CyInputDataAngle extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.dom.adoptedStyleSheets = [sharedStyles];
        this.alfa = 45; //just-in-case
    }

    createStyle() {
        let style = `
        <style> 
            host: {display: block;}
                #container{
                    position:absolute;
                    width:100%;
                }
            #data-coarse{ width:50%;}
            #data-a{width:25%;}
        </style>
        `;
        return style;
    }

    createTemplate() {
        return `
<div id="container" class="row">
    <input type="range" id="data-coarse" step="15" min="-90" max="90" />
    <span>ALFA</span><input id="data-a" type="number" value="${this.alfa}" min="-90" max="90" step="1" />
</div>
        `;
    }
    set value(v){
        this.alfa = +v;
        this.coarse.value = this.alfa;
        this.a.value = this.alfa;      
        }
    get value(){
        return this.a.value;
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.coarse = this.dom.querySelector("#data-coarse");
        this.a = this.dom.querySelector("#data-a");
        //TODO
        //this.alfa = 0;
        this.coarse.addEventListener('change', (evt)=>{
            //console.log(evt);
            this.alfa = evt.target.value;
            this.a.value = this.alfa;
            this.dispatchEvent(new Event('change', { bubbles: true }))
        })
        this.a.addEventListener('change', (evt)=>{
            //console.log(evt);
            this.alfa = evt.target.value;
            this.coarse.value = this.alfa;
            this.dispatchEvent(new Event('change', { bubbles: true }))
        });
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {
        return [];
      }   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        //case 'data-a': if(oldVal !== newVal){
        //    this.alfa = +newVal % 90;
            //this.a.value = this.alfa;
            //this.coarse.value = this.alfa;
        default:
            break;
    }
    }

}
customElements.define('cy-input-data-angle', CyInputDataAngle);

