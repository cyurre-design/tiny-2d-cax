'use strict'

export default class CyConfigDialog extends HTMLElement {
  constructor() {
    super();
    this.dom = this.attachShadow({  mode: 'open' });
  }
  style() {
    return (String.raw `
      <style>
        :host {
          background-color: #ffcc66; 
        }
        #config-dialog {
          /*display: none;*/
        }
        input[type=number]{
          text-align:right;
        }
      </style>
      `);
  }

  //en el futuro, pasar a tabla
  templateCircleRadius(radius=10) {
    return `<label for="tg-circle-radius">Round Radius</label>
            <input name="tg-circle-radius" type="number" id="radius" value=${radius} ></label><br> `}
  templateRotationAngle(angle=30) {
    return `<label for="rotation-angle">Rotation Angle</label><input name="rotation-angle" type="number" id="rot-angle" value=${angle} min=-180 max=180></label><br>
    <input type='button' value=-90 class='rot'><input type='button' value=-60 class='rot'><input type='button' value=-45 class='rot'><input type='button' value=-30 class='rot'>
    <input type='button' value=30 class='rot'><input type='button' value=45 class='rot'><input type='button' value=60 class='rot'><input type='button' value=90 class='rot'>
    <br>`}
  templateScaleFactor(scale=100){
    return `<label for="scale-factor">Scale Factor</label>
    <input name="scale-factor" type="number" id="scale" value=${scale} min=20 max=500 step=10></label><span>%</span>
    <br>`}
  templatePolygonEdges(edges=4){
    return `<label for="polygon-edges">Polygon Edges</label>
    <input name="polygon-edges" type="number" id="poly-edges" value=${edges} min=3 max=8 step=1></label>
    <br>`}
  templateGridSpacing(spacing=10){
    return `<label for="grid-spacing">Grid Spacing</label>
    <select name="grid-spacing" id="grid-spacing-data">
    <option>1</option><option>5</option><option>10</option><option>50</option>
    </select><br>`}
  templateBackgroundSize(size=100){
    return `<label for="bg-size">Background Size</label>
    <input name="bg-size" type="number" id="bg-size-data" value=${size} min=20 max=500 step=10></label><span>%</span>
    <br>`}
  templateValidation(){
    return`<input type="button" class='val-button' id='validate' value='OK' ><input type="button"  class='val-button' id='discard' value='ESC' >`
  }
  templateLayers(layers=[]){
    return '<div id="layers">' + layers.reduce((acc,ly)=>acc+=`<input type='checkbox' id='ly_${ly.name}' ${ly.view?'checked':''}><span>${ly.name}</span><br>`,'') + '</div>';
  }

  setValue = (field, valor)=>this.dom.querySelector('#' +field).value = valor;
  getValue = (field)=>this.dom.querySelector('#' +field).value;

  template() {
    return '<div id="config-dialog">'+
    [this.templateCircleRadius, this.templateRotationAngle, this.templateScaleFactor, this.templatePolygonEdges, this.templateGridSpacing, this.templateBackgroundSize, this.templateLayers, this.templateValidation].reduce((acc,t)=>acc+=t(),'') +
    '</div>';
  }

  //Aquí se llama cuando se comectan los custom elements, se supone, o sea, donde se deberían crear los event handlers y tal
  connectedCallback() {
    this.dom.innerHTML = this.style() + this.template();
    this.dialog = this.dom.querySelector('#config-dialog');
    this.layers = this.dom.querySelector('#layers');
    //Los dos botones de validación
    Array.from(this.dom.querySelectorAll('.val-button')).forEach(b=>
        b.addEventListener('click', (evt) =>  this.sendData(evt.target.value)));
    //especial, pongo botones directos para las rotaciones "normales"
    Array.from(this.dom.querySelectorAll('.rot')).forEach(b=>
      b.addEventListener('click', (evt) =>  this.dom.querySelector('#rot-angle').value = (evt.target.value)));
//    this.layers = this.dialog.querySelectorAll('#layers');
  }
  
  //oldData es un clon de lo que se me pasa (esto por precaución)
  //Durante la gestión del diálogo NO tocamos this.data, por si da al escape
  sendData(button) {
    if(button === 'OK'){ //modifico campos
      this.data.tgCircleRadius = this.dialog.querySelector('#radius').value;
      this.data.gridSpacing = this.dialog.querySelector('#grid-spacing-data').value;
      this.data.rotationAngle = this.dialog.querySelector('#rot-angle').value;
      this.data.scaleFactor = this.dialog.querySelector('#scale').value;
      this.data.polygonEdges = this.dialog.querySelector('#poly-edges').value;
      this.data.backgroundSize = this.dialog.querySelector('#bg-size-data').value;
      this.data.layers.forEach(ly=>ly.view = this.layers.querySelector('#ly_'+ly.name).checked);
    }
    this.data.button = button; //este sí lo tocamos, para asegurrar que el padre sepa si no hacemos nada
    this.parentNode.dispatchEvent(new CustomEvent('config', { detail: { action: 'config-data',  data: this.data }}));
    this.dialog.style.display = 'none';
  }
  open(data) {
    if(data){
      this.data = data; 
      //Se pueden homogeneizar los nombres o hacer una tabla de traducción, hacemos a mano
      this.setValue('radius', data.tangentRadius);
      this.setValue('rot-angle', data.rotationAngle);
      this.setValue('scale', data.scaleFactor);
      this.setValue('poly-edges', data.polygonEdges);
      this.setValue('grid-spacing-data', data.gridSpacing);
      this.setValue('bg-size-data', data.backgroundSize);
      let layers = document.createElement('div');
      layers.innerHTML = this.templateLayers(data.layers); 
      this.dialog.replaceChild( layers, this.layers);
      this.layers = layers;
    }
    this.dialog.style.display = 'block';
  }
  //Se supone que aquí se llama al desconectar la página, pero en laa aplicaciones no parece que pase
  disconnectedCallback() {
    //hay que quitar los listeners... pero no se dejan?!
  }
  static get observedAttributes() {
    return [];  //a dónde hay que echar los eventos
  }
  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case 'parent':
        break;
        break;
    }
  }
}
//esto ta fuera de la clase
customElements.define('cy-config-dialog', CyConfigDialog);