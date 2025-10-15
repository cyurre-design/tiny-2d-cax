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
    LAYERS <md-filled-button id="layer-add">ADD</md-filled-button><md-switch slot="end" selected id="layer-list-show"></md-switch>
    ${this.createNewList()}
</div>
`}

    createNewList() {
        const list = this.layers.reduce((out,ly) => (out + templateSingleLayer(ly)), '<md-list id="full-list">') + '</md-list>';
        return list; 
    }
    //Aquí recibimos el evento de que se quiere visualizar o tapar una capa, por ejemplo
    handleLayers = (e) => {     
        //Canvasviewer debería ocultar si la capa es especial o no, aquí no se sabe
        //No metemos semántica aquí, simplemente informamos de que lo que se quier hacer (ocultar, etc...) y qué capa
        const idn = e.target.id.split('-').pop();
        const s = e.target.selected; //boolean
        this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layer:idn, action: 'visibility', value:s}} ))
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.list = this.dom.querySelector('#full-list');
        this.list.addEventListener('change', (e)=>this.handleLayers(e));
        this.dom.querySelector('#layer-list-show').addEventListener('change', (e) => {
            const v = this.list.querySelector('#full-list');
            v.style.display = e.target.selected ? "block" : "none";
        })
        this.dom.querySelector('#layer-add').addEventListener('click',  (e) =>
            this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layer:undefined, action: 'create'}} )))
    }
    addLayer(name){
        this.layers.push(name);
        this.layers = [...new Set(this.layers)]; //Quito repes just in case
        this.list.innerHTML = this.createNewList();
    }
    deleteLayer(name){
        const ix = this.layers.findIndex( v => v.name === name);
        this.layers.splice(ix,1);
        this.list.innerHTML = this.createNewList();
    }
    disconnectedCallback() {
    }
    static get observedAttributes () {
        return [];
      }   
    attributeChangedCallback(name, oldVal, newVal) {
        switch(name) {
            default:
                break;
        }
    }

}
    customElements.define('cy-layer-list', CyLayerList);
