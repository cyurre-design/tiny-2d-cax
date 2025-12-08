//Aquí pueden crecer las capas por programa. como es una acción rara, lo hago bruteforce


const templateSingleLayer = (name, id, flag=true) => {
    const delButton = flag===true? ` <input type = "button" id="layer-del-${id}" value="DEL" class="_10"/>` : '';
  return `
  <div id="layer-id-${id}" class="row">
    <span class="_75">${name}</span>${delButton}
    <input type = "button" id="layer-edit-${id}" class="_15"value= "ST"/>
    <input type="range" id="layer-view-${id}" class="_10" step="1" min="0" max="1" />
  </div>
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
                .row{
                display: flex;
                flex-direction: row;
                }
                .column{
                display: flex;
                flex-direction: column;
                }
                .full{
                width:100%}
                ._75{
                width:75%;
                }
                ._15{
                width:15%;
                }
                ._10{
                width:10%;
                }
                .active{
                background-color:#ffcc00}
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
    <div id=show-layers class="row">
    <span class="_75">LAYERS</span>
    <input type = "button" id="layer-add" value="ADD" class="_15"/>
    <input type="range" id="layer-list-show" min=0 max=1 stpe=1 value=1 class="_10"/>
    </div>
    ${this.createNewList()}
`}

    createNewList() {
        const list = this.layers.reduce((out,ly) => (out + templateSingleLayer(ly.name, ly.lyId, ly.erasable)), '<div id="full-list" class="column"></div>');
        return list; 
    }
    //Aquí recibimos el evento de que se quiere visualizar o tapar una capa, por ejemplo
    handleLayers = (e) => {     
        //Canvasviewer debería ocultar si la capa es especial o no, aquí no se sabe
        //No metemos semántica aquí, simplemente informamos de que lo que se quier hacer (ocultar, etc...) y qué capa
        const idn = e.target.id.split('-').pop();
        const s = +(e.target.value)!==0; //boolean
        this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layerId:idn, action: 'visibility', value:s}} ))
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.list = this.dom.querySelector('#full-list');
        this.dialog = this.dom.querySelector('#edit-style');
        this.list.addEventListener('change', (e)=>this.handleLayers(e)); 
        this.list.addEventListener(`click`, (evt => {
            const [d, command, id] = evt.target.id.split('-');
            this.editedLayer = this.layers.find((l)=>l.lyId === id);
            
            if(command === 'edit'){
                this.dialog.innerHTML = this.createDialog(this.editedLayer);
                this.dialog.showModal();
            } else if (command === 'del'){
                this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layerId:this.editedLayer.lyId, action: 'delete'}}))
            } else if(command === 'id') {
                if(this.editedLayer.erasable){
                    this.setActiveLayerClass(id);
                    this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layerId:id, action: 'active'}}))
                }
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
                let detail = {layerId:this.editedLayer.lyId, action: 'set-style', value:this.editedLayer}
                this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: detail}))
            } else if(e.target.id === 'style-escape'){
                this.dialog.close();
            }
        })
        this.dom.querySelector('#layer-list-show').addEventListener('change', (e) => {
            //const v = this.list.querySelector('#full-list');
            this.list.style.display = e.target.value==="1" ? "block" : "none";  //el html contiene asciis
        })
        this.dom.querySelector('#layer-add').addEventListener('click',  (e) =>
            this.dispatchEvent(new CustomEvent('layer-handle', {bubbles:true, composed:true, detail: {layer:undefined, action: 'create'}} )))
    }
    setActiveLayerClass(id){
        Array.from(this.dom.querySelectorAll('md-list-item')).forEach( el => el.classList.remove('active'));
        this.dom.querySelector(`#layer-id-${id}`).classList.add('active');
    }
    //Decido que venga en json, para forzar copia
    addLayer(strLayer){
        const layer = JSON.parse(strLayer);
        this.layers.push(layer);
        this.layers = [...new Set(this.layers)]; //Quito repes just in case
        this.list.innerHTML = this.createNewList();
        if(layer.erasable)
            this.setActiveLayerClass(layer.lyId);
    }
    /**
     * 
     * @param {@todo} name 
     */
    deleteLayer(id){
        const ix = this.layers.findIndex( v => v.lyId === id);
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
        const layer = this.layers.find( ly => ly.lyId === id);
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
