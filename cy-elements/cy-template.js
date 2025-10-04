class CyTemplate extends HTMLElement {

    constructor() {
        super();
        //el statechart completo decido hacerle shadow dom porque sí,
        this.dom = this.attachShadow({
            mode: 'open'
        });   
    }
    //paso de auto a manual por legibilidad al crear botones
    createTemplate() { 
      let out = `
      `
      return out;
    }
    createStyle() {return `
    <style>
    host:{
      display:block;
      width:100%;
      height:100%;
    }
  </style>
    ` }

    connectedCallback() {
      this.dom.innerHTML = this.createStyle()+this.createTemplate();
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
      return [];
    }
  
    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
          case 'atributo':
          break;
            default:
                break;
        }
    }
    
}
customElements.define('cy-template', CyTemplate);

