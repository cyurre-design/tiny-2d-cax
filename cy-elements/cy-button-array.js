"use strict";
/**
 * Clase que define un array de botones HTML.
 */
export default class CyButtonArray extends HTMLElement {
    constructor() {
        super();
        //el statechart completo decido hacerle shadow dom porque sí,
        this.dom = this.attachShadow({
            mode: 'open'
        });
        this.type = 'radio'; //por defecto radiobutton?
        this.active = false;
        this.activeButton = 0;
        this.selectedOnActivation = 0; //por defecto iría el primero del grupo?
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
        div{
            width: 100%;
            height:100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            background-color: #333333;
            border-width: 1px;
            border-color: black;
            border-style: solid;
            border-radius: 2px;
            padding: 1px 1px 1px 1px;
            cursor: pointer;
            user-select: none;
        }
        div.selected{
            border-width: 1px;
            border-color: red;
            border-style: solid;
            border-radius: 2px;   
        }
        #cy-button-array{
            color: grey;
            border-color: grey;
            border-width: 1px;
        }
        #cy-button-array.cy-active{
            border-color: red;
            border-width: 3px;
        }
        .cy-button{
            margin-bottom: 1px;
            padding: 0px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 30px;
            height: 90%;
            width: ${this.buttonWidth}%;
            border-width: 1px;
            border-color: red;
            border-style: solid;
            border-radius: 2px;
            background-color: transparent;
            /*color: white;*/
            /*cursor: pointer;*/
        }
        .cy-button.selected{
            background-color: white;
            color: red;
        }
        .cy-button:hover {background-color: #3e8e41}

        .cy-button:active {
            background-color: white;
            color: red;
/*            transform: translateY(4px);*/
        }
        .hide {
          display: none;
        }
      </style>
    `;
        return style;
    }
    createButtons() {
        let n = this.buttons.length; //los haremos iguales, si puede ser
        this.buttonWidth = Math.trunc(100 / n); //los hace ligeramente más pequeños para que el redondeo no sume más de 100
        let out = this.createStyle() + '<div id="cy-button-array">';
        this.buttons.forEach(b => out += `<div class="cy-button " >${b.value}</div>`);
        out += '</div>';
        this.dom.innerHTML = out;
        this.nodes = Array.from(this.dom.querySelectorAll('.cy-button'));
        this.nodes.forEach((b, ix) => b.ix = ix);
        this.nodes[this.activeButton].classList.add('selected');
        this.dom.querySelector('#cy-button-array').addEventListener('click', (evt)=>this.click(evt));
    }
    setButtons( data) {
        this.appName = data.appName;
        this.type = data.type || 'radio';
        this.buttons = JSON.parse(JSON.stringify(data.buttons)); //clone, total...
        this.selectedOnActivation = this.buttons.findIndex(b=>b.value===data.active);
        if(this.selectedOnActivation !== -1) 
            this.activeButton = this.selectedOnActivation;
        else
            this.activeButton = 0;

        this.createButtons();
    }
    click(evt){
        const ix = evt.target.ix;
        if(this.buttons[ix].hold){
            this.nodes.forEach(n=>n.classList.remove('selected'));
            this.nodes[ix].classList.add('selected');
            this.activeButton = ix;
        }
        this.parentNode.dispatchEvent(new CustomEvent(this.appName, {detail: { action: this.buttons[ix].action,  pressed: ix }}));
    }
    connectedCallback() {
        //Los ids deben ser únicos...
        //this.app = document.querySelector('#' + this.appName) || this; //los atributos se ponen muy pronto, en la creación, pero igual el elemento no está...?
        //Si no existe el id ese, pues los eventos vienen aquí y daremos error o algo?
    }
    //Aquí recibiríamos eventos que son para nosotros o aquellos cuya app no se ha puesto bien
    handleEvent(evt) {
        let command = evt.detail.action;
        switch (command) {
            default:
                console.log('unhandled event: ' + command + 'or unknown app ' + this.appName);
                break;
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
                this.isActive = JSON.parse(newVal)?true:false;
                if(this.isActive){
                    this.dom.querySelector('#cy-button-array').classList.add('cy-active');
                }
                else{
                    this.dom.querySelector('#cy-button-array').classList.remove('cy-active');
                    this.nodes.forEach(b=>b.classList.remove('selected'));
                }
                if(this.isActive){
                    if(this.selectedOnActivation !== -1)
                        this.activeButton = this.selectedOnActivation;
                    this.nodes[this.activeButton].classList.add('selected');
                }
    

            break;

            default:
                break;
        }
    }
}
customElements.define('cy-button-array', CyButtonArray);