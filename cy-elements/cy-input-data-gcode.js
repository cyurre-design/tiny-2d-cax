//import {TENTER, TESC, TBACK} from './cy-input-data-templates.js'
export default class CyInputDataGcode extends HTMLElement {
    constructor( subType, initialData) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.initialData = initialData;
        this.subType = subType;
    }

    createStyle() {
        let style = `
            <style>                
                #cy-input-data-basic{
                    /*position:absolute;*/
                    width:100%;
                }
                .full{width:100%}
                .half{width:50%;}
                ._33{width:30%}
                ._25{width:25%}
            </style>
        `;
        return style;
    }
    createTemplate() {
        return (
 `
<cy-input-data-basic >
<div class="full">
    <textarea autofocus class="full" contenteditable="plaintext-only" id="iso-input" ></textarea>
</div>
<div class="row"><input type="button" id="data-escape" value="ESCAPE"/><input type="button" id="data-insert" value="INSERT"/></div> 
</cy-input-data-basic>
`    )
    }

    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.container = this.dom.querySelector('cy-input-data-basic');
        this.addEventListener('initialized', (evt) => this.init())
        //this.dom.querySelector('#iso-input').addEventListener('keyup', (evt)=>this.handleTextInput(evt))
    }
    //Llamo al contenedor, que me hace de clase base
    update(data){
        this.container.update(data);
    }
    init(evt){
        // if(!this.initialData) return;
        // Object.keys(this.initialData).forEach(k =>{
        //     const idn = 'data-'+k
        //     if(this.container.keys.includes( idn))
        //         this.container.inputs[idn].value = this.initialData[k];
        //         this.container.data[idn] =  this.initialData[k];
        //     });
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
customElements.define('cy-input-data-gcode', CyInputDataGcode);