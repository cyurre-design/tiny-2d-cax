import {TX0Y0, TX1Y1, TA, TENTER, TESC, TSCALE, TXx0, TYy0} from './cy-input-data-templates.js'

export default class CyInputDataTransform extends HTMLElement {
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
            case 'origin'   : T = TX0Y0;    break;
            case 'scale'     : T = TX0Y0 + TSCALE + TENTER + TESC;   break;
            case 'translate' : T = TX0Y0 + TX1Y1; break;
            case 'rotate'    : T = TX0Y0 + TA + TENTER + TESC; break;
            case 'symmetryX' : T = TYy0; break;
            case 'symmetryY' : T = TXx0; break;
            case 'symmetryL' : T = ""; break;
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
        if(this.subType === 'rotate')
            this.dom.querySelector('#data-a').click();
        if(this.subType === 'scale')
            this.dom.querySelector('#data-sn').click();
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