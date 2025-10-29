//Aquí pueden crecer las capas por programa. como es una acción rara, lo hago bruteforce


const templateSingleLayer = (name, id, flag=true) => {
    const delButton = flag===true? ` <md-filled-button id="layer-del-${name}">Del</md-filled-button>` : '';
  return `
  <md-list-item id="${name.toLowerCase()}">
    ${name}${delButton}
    <md-filled-button id="layer-edit-${id}">St</md-filled-button>
    <md-switch slot="end" selected id="layer-view-${id}"></md-switch>
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
                #layer-name{
                width:100%;
                }
                </style>
        `;
        return style;
    }
    createDialog(layer) {
        const st = layer.layerStyle;
        return `
        <input id="layer-name" type='text' value=${layer.name}></input>
        <span>path color <input type="color" id="path-color" name="path-color" value="${st.pathColor}"></span></br>
        <span>path width <input type="number" id="path-width" name="path-width" value=${st.pathWidth} min=1 max=6></span></br>
        <span>selected color <input type="color" id="selected-color" name="selected-color" value="${st.selectedColor}"></span></br>
        <span>selected width <input type="number" id="selected-width" name="selected-width" value=${st.selectedWidth} min=1 max=6></span></br>
        <button id='style-enter'>Enter</button><button autofocus id='style-escape'>Esc</button>
    
    `
    }
    createTemplate() {
        return `
    <dialog id='edit-style'></dialog>
    <div id=show-layers>
    LAYERS
    <md-filled-button id="layer-add">Add</md-filled-button><md-switch slot="end" selected id="layer-list-show"></md-switch>
    ${this.createNewList()}
</div>
`}

    createNewList() {
        const list = this.layers.reduce((out,ly) => (out + templateSingleLayer(ly.name, ly.id, ly.erasable)), '<md-list id="full-list">') + '</md-list>';
        return list; 
    }
    //Aquí recibimos el evento de que se quiere visualizar o tapar una capa, por ejemplo
    handleLayers = (e) => {     
        //Canvasviewer debería ocultar si la capa es especial o no, aquí no se sabe
        //No metemos semántica aquí, simplemente informamos de que lo que se quier hacer (ocultar, etc...) y qué capa
        const idn = e.target.id.split('-').pop();
        const s = e.target.selected; //boolean
        this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layerId:idn, action: 'visibility', value:s}} ))
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.list = this.dom.querySelector('#full-list');
        this.dialog = this.dom.querySelector('#edit-style');
        this.list.addEventListener('change', (e)=>this.handleLayers(e)); 
        this.list.addEventListener(`click`, (evt => {
            const data = evt.target.id.split('-');
            this.editedLayer = this.layers.find((l)=>l.id === data[2]);
            
            if(data[1] === 'edit'){
                this.dialog.innerHTML = this.createDialog(this.editedLayer);
                this.dialog.showModal();
            } else if (data[1] === 'del'){
                /**
                 * @todo hay que sacar un dialogo si la capa no está vacía ??!
                 */
                this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layerId:this.editedLayer.id, action: 'delete'}}))
            }
        }))
        this.dom.querySelector('#edit-style').addEventListener('click', (e)=> {
            if(e.target.id === 'style-enter'){
                this.editedLayer.layerStyle = {
                    pathWidth: this.dialog.querySelector('#path-width').value,
                    pathColor: this.dialog.querySelector('#path-color').value,
                    selectedWidth: this.dialog.querySelector('#selected-width').value,
                    selectedColor: this.dialog.querySelector('#selected-color').value
                }
                this.editedLayer.name = this.dialog.querySelector('#layer-name').value,
                this.dialog.close();
                let detail = {layerId:this.editedLayer.id, action: 'set-style', value:this.editedLayer}
                this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: detail}))
            } else if(e.target.id === 'style-escape'){
                this.dialog.close();
            }
        })
        this.dom.querySelector('#layer-list-show').addEventListener('change', (e) => {
            const v = this.list.querySelector('#full-list');
            v.layerStyle.display = e.target.selected ? "block" : "none";
        })
        this.dom.querySelector('#layer-add').addEventListener('click',  (e) =>
            this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layer:undefined, action: 'create'}} )))
    }
    //Decido que venga en json, para forzar copia
    addLayer(strLayer){
        const layer = JSON.parse(strLayer);
        this.layers.push(layer);
        this.layers = [...new Set(this.layers)]; //Quito repes just in case
        this.list.innerHTML = this.createNewList();
    }
    /**
     * 
     * @param {@todo} name 
     */
    deleteLayer(id){
        const ix = this.layers.findIndex( v => v.id === id);
        this.layers.splice(ix,1);
        this.list.innerHTML = this.createNewList();
    }
    /**
     * 
     * @param {string} id 
     * @param {object} data 
     * Refresco en caso de edición
     */
    setStyle(id, data){
        const layer = this.layers.find( ly => ly.id === id);
        layer.name = data.name;
        layer.layerStyle = data.layerStyle;
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
