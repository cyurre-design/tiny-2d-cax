import { sharedStyles } from "../shared-styles.js";
import "./cy-input-data-angle.js";
import "./cy-input-data-arc.js";
import "./cy-input-data-circle.js";
import "./cy-input-data-segment.js";
import "./cy-input-data-polygon.js";
import "./cy-input-data-path.js";
import "./cy-input-data-transform.js";
import "./cy-input-data-gcode.js";
import "./cy-input-data-export-gcode.js";
import "./cy-input-data-text.js";
import "./cy-input-data-measure.js";
import "./cy-input-data-none.js";

const inputDataApps = ["arc", "circle", "segment", "polygon", "path", "export-gcode", "gcode", "transform", "text", "measure", "none"];
function inputDataTemplate(app) {
	return `<cy-input-data-${app} class="share"></cy-input-data-${app}>`;
}
//const Keys4Events =  ["Enter", "Escape"]
export default class CyInputDataBasic extends HTMLElement {
	constructor() {
		super();
		this.dom = this.attachShadow({ mode: "open" });
		this.dom.adoptedStyleSheets = [sharedStyles];
		this.data = {};
		this.inputs = {};
		this.keys = [];
	}

	createStyle() {
		let style = `
    <style> 
        :host{
        position:relative;
        width:100%;
        }               
        #container{
            }
        .share{
        display:none;}
        .show{
        display:block;
        left:0;
        top:0;
        }
    </style>
`;
		return style;
	}
	createTemplate() {
		return `
<div id="container">
        ${inputDataApps.reduce((acc, app) => (acc += inputDataTemplate(app)), "")}
</div>`;
	}

	/**
	 * Es un único componente en el que comparten espacio varios componentes que están habitualmente desconectados
	 * pero la estructura y el dom están creados y los valores de los inputs, etc... también
	 * Alternamos con el menú entre las opciones, pero al estar creados, se mantienen de forma automática los
	 * valores de sesión, que se podrían guardar si se quisiera en almacenaiento local
	 * La inicialización es un poco más pejiguera. Se llama a basic que tiene el html de todos
	 * así que primero empieza el connectedCallBak de basic, pero es el último que termina
	 * Los datos guardados en json se mandan desde el main cuando está todo definido, igual hay que afinar más
	 * Las estructuras de trabajo de cada componente solo se pueden llamar después de esto, porque acceden a los elementos
	 */
	connectedCallback() {
		this.dom.innerHTML = this.createStyle() + this.createTemplate();
	}
	setActiveApplication(app, subType) {
		//tapa todos
		//console.log('setActiveApplication')
		inputDataApps.forEach((app) => this.dom.querySelector("cy-input-data-" + app).classList.replace("show", "share"));
		this.activeApplication = this.dom.querySelector("cy-input-data-" + app);
		this.activeApplication.subType = subType;
		this.activeApplication.classList.replace("share", "show");
	}
	//Recibo el config entero y cojo el de geometría y el de iso (de momento)
	// No hay nada inicializado aunque el dom existe, así que luego hay que pasarlos a cada componente y hacia arriba
	//Paso el data entero, es pequeño y ya viene con el nombre de propiedad local
	initialData(data) {
		//console.log('initialDataBasic')
		inputDataApps.forEach((app) => {
			if (app === "export-gcode") this.dom.querySelector("cy-input-data-" + app).initialData(data.iso);
			else if (app === "text") this.dom.querySelector("cy-input-data-" + app).initialData(data.text);
			else this.dom.querySelector("cy-input-data-" + app).initialData(data.geometry);
		});
	}
	update(data) {
		this.activeApplication.update(data);
	}
	disconnectedCallback() {}
	static get observedAttributes() {
		return [];
	}
	attributeChangedCallback(name, oldVal, newVal) {
		switch (name) {
			default:
				break;
		}
	}
}
customElements.define("cy-input-data-basic", CyInputDataBasic);
