//Esta pijada es solo porque si no el debugger ni se molesta en poner el source en la lista...
import CyInputDataBasic from './cy-input-data-basic.js'
import {TX0Y0, TX1Y1, TA, TD, TXx1, TYy1} from './cy-input-data-templates.js'
export default class CyInputDataSegment extends HTMLElement {
    constructor( subType, initialData) {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.initialData = initialData;
        this.subType = subType;
    }

    createStyle() {
        let style = `
            <style>                
                #container{
                    position:absolute;
                    width:100%;
                }
                .half{width:50%;}
                ._33{width:30%}
                ._25{width:25%}
            </style>
        `;
        return style;
    }
    createTemplate() {
        let T = '';
        switch(this.subType){
            case 'NP'   : T = TX0Y0;            break;
            case 'PP'   : T = TX0Y0 + TX1Y1;    break;
            case 'PXA'  : T = TX0Y0 + TXx1 + TA;  break;
            case 'PYA'  : T = TX0Y0 + TYy1 + TA;  break;
            case 'PDA'  : T = TX0Y0 + TD + TA;  break;
            case 'TPB'  : T = TX0Y0;            break;
            case 'TBB'  : T = '';               break;
        }
        return (
 `
<cy-input-data-basic>
<div>${T}</div>
</cy-input-data-basic>
`    )
    }

    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.container = this.dom.querySelector('cy-input-data-basic');
        this.addEventListener('initialized', (evt) => this.init())
    }
    //Llamo al contenedor, que me hace de clase base
    update(data){
        this.container.update(data);
    }
    init(evt){
        if(!this.initialData) return;
        Object.keys(this.initialData).forEach(k =>{
            const idn = 'data-'+k
            if(this.container.keys.includes( idn))
                this.container.inputs[idn].value = this.initialData[k];
                this.container.data[idn] =  this.initialData[k];
            });
        if((this.subType === 'PXA') || (this.subType === 'PYA') || (this.subType === 'PDA'))
            this.dom.querySelector('#data-a').dispatchEvent(new Event("change", { bubbles: true }));
        if(this.subType === 'PDA')
            this.dom.querySelector('#data-d').dispatchEvent(new Event("change", { bubbles: true }));
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
customElements.define('cy-input-data-segment', CyInputDataSegment);