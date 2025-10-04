import "./cy-layout-row.js";
import "./cy-layout-column.js";

class CyIsoTextEditor extends HTMLElement {

    constructor() {
        super();
        //el statechart completo decido hacerle shadow dom porque sí,
        this.dom = this.attachShadow({
            mode: 'open'
        });   
        this.config = {header:'',pre:'',post:''};
        this.visibility = 'hidden';
    }
    //paso de auto a manual por legibilidad al crear botones
    createTemplate() { 
      let out = `
      <cy-layout-column id='container'>
        <span>program header</span>
        <textarea id = 'header' ></textarea>
        <span>before path</span>
        <textarea id = 'pre' ></textarea>
        <span>after path</span>
        <textarea id = 'post' ></textarea>
        <span>program ouput</span>
        <textarea id = 'textArea'></textarea>
        <cy-layout-row>
        <input type='button' id='accept' value='OK'>
        <input type='button' id='reject' value='ESC'>
        </cy-layout-row>
        <input type='button' id='send-file' value='SEND'>
      </cy-layout-column>
      `
      return out;
    }
    createStyle() {return `
    <style>
    host:{
      display:block;
      width:100%;
      height:100%;
      visibility:hidden;
      color : #cccccc;
      background-color: #333333;
    }
    span, textarea{
      width:100%;
      color : #cccccc;
      background-color: #333333;
      resize:none;
    }
    #textArea{
      height:70%;
      overflow-y: scroll;
      overflow-x: hidden;
    }
    #header,#pre,#post{
      width:100%;
      height:5%;
    }
    input{
      background-color: #333333;
      color : #cccccc;
    }
    #accept,#reject{
      width:50%;
    }
    #send-file{
      width:100%;
    }
    </style>
    ` }


    connectedCallback() {
      this.dom.innerHTML = this.createStyle()+this.createTemplate();
      this.dom.addEventListener('click',(evt=>{
        this.parentElement.dispatchEvent(new CustomEvent('tools', {detail: {action: 'iso-config', key: evt.target.id, config: this._getConfig()}}));
      }))
    }
    toggleVisibility(){
      this.visibility = this.dom.querySelector('#container').style.visibility==='visible'?'hidden':'visible';
      this.dom.querySelector('#container').style.visibility = this.visibility;

    }
    setText(t){
      this.dom.querySelector('#textArea').textContent = t;
    }
    _getConfig(){
      this.config.header = this.dom.querySelector('#header').value;
      this.config.pre = this.dom.querySelector('#pre').value;
      this.config.post = this.dom.querySelector('#post').value;
      return Object.assign({},this.config);
    }
    setConfig(config){
      this.config = Object.assign({},config);
      this.dom.querySelector('#header').value = this.config.header;
      this.dom.querySelector('#pre').value = config.pre;
      this.dom.querySelector('#post').value = config.post;
    }
    //Aquí recibiríamos eventos que son para nosotros o aquellos cuya app no se ha puesto bien
    //Los botones mandan tipo y comando
    handleEvent(evt) {
      const newEvent  =  new CustomEvent(evt.type, {detail:evt.detail});
      this.parentNode.dispatchEvent(newEvent);
      //this.parentNode.dispatchEvent(  new CustomEvent(evt.type, {detail:evt.detail}));
        // if (evt.type === this.app) {
        //     let command = evt.detail.action;
        //     switch (command) {
        //         default:
        //             console.log('unhandled event: ' + command + 'or unknown app ' + this.appName);
        //             break;
        //     }
        // }
    }
    //Se supone que aquí se llama al desconectar la página, pero en laa aplicaciones no parece que pase
    disconnectedCallback() {
        //hay que quitar los listeners... pero no se dejan?!
    }
    static get observedAttributes() {
      return [/*'cy-active'*/];
    }
  
    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
          case 'cy-active':
          break;
            default:
                break;
        }
    }
    
}
customElements.define('cy-iso-text-editor', CyIsoTextEditor);

