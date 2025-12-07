class CyAngleData extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
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
            #data-coarse{ width:100%;}
            #data-a{width:25%;}
        </style>
        `;
        return style;
    }

    createTemplate() {
        return `
<div id="container">
    <input type="range" id="data-coarse" step="15" min="-90" max="90" />
    ALFA <input id="data-a" type="number" class="_33" value="${this.alfa}" min="-90" max="90" step="1" />
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
        })
        this.a.addEventListener('change', (evt)=>{
            //console.log(evt);
            this.alfa = evt.target.value;
            this.coarse.value = this.alfa;
        });
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {
        return ['data-a'];
      }   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        case 'data-a': if(oldVal !== newVal){
            this.alfa = +newVal % 90;
            //this.a.value = this.alfa;
            //this.coarse.value = this.alfa;
        }
        break
        default:
            break;
    }
    }

}
customElements.define('cy-angle-data', CyAngleData);


export default class CyInputDataBasic extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.data = {};
        this.inputs = {};
        this.keys = [];
    }

    createStyle() {
        let style = `
    <style>                
        #container{width:100%;}
        .full{width:100%}
        .half{width:50%;}
        ._33{width:30%}
        ._25{width:25%}
    </style>
`;
    return style;
    }
    createTemplate() { return (`<div id="container"><slot></slot></div>`); }
    //Nos cogemos los eventos
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();

        this.input = this.dom.querySelector("#container");
        this.dom.addEventListener('change', (evt)=>this.handleEvent(evt));
        this.dom.addEventListener('click', (evt)=>this.handleEvent(evt));
        this.addEventListener('keyup', (evt)=>this.handleEvent(evt))
        // ..and listen for the slotchange event.
        this.shadowRoot.querySelector('slot').addEventListener('slotchange', (event) => {
        // Get the elements assigned to the slot.. que solo deberíamos tener 1
            const slot = event.target.assignedElements()[0]; //Si está bien hecho no debe haber más...
            let inputs = Array.from(slot.querySelectorAll('input')).filter(el=>el.id.startsWith('data'));
            const others = Array.from(slot.querySelectorAll('.data')).filter(el=>el.id.startsWith('data'));
            inputs = inputs.concat(others);
            this.keys = inputs.map(el=>el.id);
            inputs.forEach(k => this.data[k.id] =  k.value);
            inputs.forEach(k => this.inputs[k.id] =  k);
            slot.dispatchEvent(new CustomEvent('initialized',{bubbles:true, composed:true}));
        })
    }

    
    handleEvent(evt){
        //this.block = evt.detail.b;
        switch(evt.type){
            case 'click':{
                const detail = {};
                detail[evt.target.id] = evt.target.value;
                this.dispatchEvent(new CustomEvent('input-click',{bubbles:true, composed:true, detail: detail}))
            }break;
            //Una vez que tengo el foco en el control debo mandar todos los valores, porque el usuario ya ve un 0 en los no definidos
            case 'change':{
                this.data[evt.target.id] = evt.target.value;
                this.dispatchEvent(new CustomEvent('input-data',{bubbles:true, composed:true, detail: this.data}))
            }break;
            case 'keyup':{
                const detail = {};
                detail[evt.target.id] = evt.target.value;
                this.dispatchEvent(new CustomEvent('input-key',{bubbles:true, composed:true, detail: detail}))
            }break;
        }
    }
    format(n){ return(n.toFixed(3))};
    //intento hacerlo lo más genérico posible, pero habrá switches casi seguro.
    //Me pasan pos e idn, que es un array con los id de los campos que cambian.
    // data-xx es el nombre publico entre ambos controles 
    /**@todo generalizar? */
    update(data){
        const [ix,iy] = data.idn.map(k => 'data-' + k); //array de dos asciis, ej: data-x0 y data-y0
        if(this.inputs[ix]){
            const v = this.format(+data.pos.x);
            this.inputs[ix].value = v;
            this.data[ix] = v
        }
        if(this.inputs[iy]){
            const v = this.format(+data.pos.y);
            this.inputs[iy].value = v;
            this.data[iy] = v
        }
    }
    //esta rutina vendría asociada a un cambio de atributo, inicialización externa desde arriba...
    // updateData(data){
    //     if(!data) return;
    //     Object.keys(data).forEach(k =>{
    //         if(this.keys.includes( k))
    //             this.inputs[k].value = data[k];
    //             this.data[k] =  data[k];
    //         });
    // }

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