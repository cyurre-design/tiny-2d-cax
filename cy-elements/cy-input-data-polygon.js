import { TX1Y1, TCXCY} from './cy-input-data-templates.js'

export default class CyInputDataPolygon extends HTMLElement {
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
        const TNE =  `N_EDGES<select id="data-edges" class="data"><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        <option value="6" selected>6</option><option value="7">7</option><option value="8">8</option>
        <option value="9">9</option><option value="10">10</option><option value="11">11</option></option><option value="12">12</option></select>`;
        const TVE = `VERTEX<select id="data-vertex" class="data"><option value="1" selected>VERTEX</option><option value="0">EDGE</select>`;
        const T = TCXCY + TX1Y1 + TNE + TVE;
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
            this.dom.querySelector('#data-vertex').dispatchEvent(new Event("change", { bubbles: true }));
            this.dom.querySelector('#data-edges').dispatchEvent(new Event("change", { bubbles: true }));
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