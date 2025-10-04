//Aquí pueden crecer las capas por programa. como es una acción rara, lo hago bruteforce


const templateSingleLayer = (name) => {
  return `
  <md-list-item>
    ${name}<md-switch slot="end" selected id="view-layer-${name.toLowerCase()}"></md-switch>
  </md-list-item>
`
}

class CyLayerList extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
        this.layers = [];
    }

    createStyle() {
        let style = `
            <style>                
                #container{
                    position:absolute;
                    width:100%;
                }
                </style>
        `;
        return style;
    }

    createTemplate() {
        return `
<div id=show-layers>
    <md-list >${this.createNewList()}
    </md-list >
</div>
`}
    createNewList() {
        const list = this.layers.reduce((out,ly) => (out + templateSingleLayer(ly)), '<md-list>') + '</md-list>';
        return list; 
    }
    //Aquí recibimos el evento de que se quiere visualizar o tapar una capa, por ejemplo
    handleLayers = (e) => {     
        const idn = e.target.id.split('-').pop();
        const s = e.target.selected; //boolean
        //Canvasviewer debería ocultar si la capa es especial o no, aquí no se sabe
        //No metemos semántica aquí, simplemente informamos de que lo que se quier hacer (ocultar, etc...) y qué capa
        this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layer:idn, action: 'visibility', value:s}} ))
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.list = this.dom.querySelector('#show-layers');
        this.list.addEventListener('change', (e)=>this.handleLayers(e));
    }
    disconnectedCallback() {
    }
    static get observedAttributes () {
        return ['layer-name'];
      }   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        case 'layer-name':{
            this.layers.push(newVal);
            this.layers = [...new Set(this.layers)]; //Quito repes just in case
            this.list.innerHTML = this.createNewList();
        }
        break
        default:
            break;
    }
    }

}
    customElements.define('cy-layer-list', CyLayerList);
