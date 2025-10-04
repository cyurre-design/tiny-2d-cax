"use strict";
/**
 * Clase que define un array de botones HTML.
 */
export default class CySelector extends HTMLElement {
    constructor() {
        super();
        //el statechart completo decido hacerle shadow dom porque sí,
        this.dom = this.attachShadow({
            mode: 'open'
        });
    }

    createStyle() {
        let style = `
      <style>
        :host {
          font-family: italic bold arial, sans-serif;
          font-size: 12px;
          color: black;
          width:100%;
          height:100%;
        }
        .cy-selector{
            margin-bottom: 1px;
            padding: 0px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 30px;
            height: 90%;
            width: 90%;
            border-width: 1px;
            border-color: red;
            border-style: solid;
            border-radius: 2px;
            background-color: #333333;
            color: white;
            /*cursor: pointer;*/
        }
        .cy-option {
            height: 100%;
            width:100%;
        }
        .cy-selector.cy-active {
            background-color: #ffcc66; 
            color: black;
        }
        .hide {
          display: none;
        }
      </style>
    `;
        return style;
    }
    createSelector() {
        let out = this.createStyle() + `<select name='${this.appName}' class="cy-selector">`;
        this.options.forEach(b => out += `<option class="cy-option ${b.class?b.class:''}">${b.txt}</option>`);
        out += '</select>';
        this.dom.innerHTML = out;
        this.selectorNode = this.dom.querySelector('select');
        this.selectorNode.addEventListener('change', (evt)=>{
            //debug
           
            const event = new CustomEvent(this.appName, {bubbles: true, detail:{action: this.options[this.selectorNode.selectedIndex].msg }});
            this.parentNode.dispatchEvent(event);
        });
        this.selectorNode.addEventListener('click', (evt)=>{
            const event = new CustomEvent(this.appName, {bubbles: true, detail:{action: this.options[this.selectorNode.selectedIndex].msg }});
            this.parentNode.dispatchEvent(event);
        });
    }
    setOptions(app, data) {
        this.app = app;
        this.appName = data.appName;
        this.options = []; //aunque usamos lo mismo que viene, copio los datos porque puede venir por referencia y usar la misma variable para otros botones...
        this.options = data.options.map(b => ({
            txt: b.value,
            msg: b.action,
            class: b.class
        }));
       // this.optionClasses = data.options.map(b=>b.class).filter(b=>b!=='').concat(['selected']);  //lista de strings, igual hay vacíos o repetidos, pero da un poc igual
        this.createSelector();
    }
    change(button){
        let ix = this.options.findIndex(el=>el.msg === button);
        this.nodes[ix].click();
    }
    connectedCallback() {
        //Los ids deben ser únicos...
        this.app = document.querySelector('#' + this.appName) || this; //los atributos se ponen muy pronto, en la creación, pero igual el elemento no está...?
        //Si no existe el id ese, pues los eventos vienen aquí y daremos error o algo?
    }
    //Aquí recibiríamos eventos que son para nosotros o aquellos cuya app no se ha puesto bien
    handleEvent(evt) {
        if (evt.type === this.app) {
            let command = evt.detail.action;
            switch (command) {
                default:
                    console.log('unhandled event: ' + command + 'or unknown app ' + this.appName);
                    break;
            }
        }
    }
    //Se supone que aquí se llama al desconectar la página, pero en laa aplicaciones no parece que pase
    disconnectedCallback() {
        //hay que quitar los listeners... pero no se dejan?!
    }
    static get observedAttributes() {
        return ['cy-active'];
    }
    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
            case 'cy-active':
                this.active = this.appName===newVal?true:false;
                if(this.active)
                    this.selectorNode.classList.add('cy-active');
                else
                    this.selectorNode.classList.remove('cy-active');
            break;
            default:
                break;
        }
    }
}
customElements.define('cy-selector', CySelector);