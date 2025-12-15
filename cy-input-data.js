
//Incluyo aquí un selector de ángulo a medida como ayuda en los input-data



const template = `
<div id="data-container">

</div>
`
   

const templatePathInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
<span >
    <md-filled-button class="data" id="data-end">END</md-filled-button>
    <md-filled-button class="data" id="data-back">BACK</md-filled-button>
    <md-filled-button class="data" id="data-del">DEL</md-filled-button>
    <md-filled-button class="data" id="data-enter">ENTER</md-filled-button>
</span>
<span>
    <md-filled-text-field id="data-r" label="RADIUS" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
</span>
`

const templateBBoxInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 </div>
`    
const templateZoomBoxInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 </div>
`    
//Aprovecho y pongo aquí el width de selección, por ejemplo
const templateSelectInputData =`
<div>
    <md-filled-text-field id="data-penWidth" all" label="Select Tolerance" type="number" value="1" max="5" min="0.5" step="0.5"></md-filled-text-field>

    <div>
        <span>
            <md-filled-text-field id="data-x0" label="X0" class="half" type="number" value="0" step="0.5">
            </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
        </span>
        <span>
            <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
            </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
        </span>
        </div>
</div>
`
const templateCutPointsInputData =`
<div>
    <md-filled-button class="data _25" id="submenu-cut-all">ALL</md-filled-button>
    <md-filled-button class="data _25" id="submenu-cut-invert">INV</md-filled-button>
    <md-filled-button class="data _25" id="submenu-cut-end">END</md-filled-button>
    </div>
</div>
`
const templateTranslateInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="Xi" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Yi" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="Xf" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Yf" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-button class="data _50" id="translate-int">INT</md-filled-button>
    <md-filled-button class="data _50" id="translate-esc">ESC</md-filled-button>
    <md-filled-button class="data _50" id="translate-enter">ENTER</md-filled-button>
 </span>
</div>`
const templateRotateInputData = `
<div>
<div>
    <md-filled-text-field id="data-x0" label="X0" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </div>
 <cy-angle-data id="data-a" data-a="0" class="data"></cy-angle-data>
 <div>
    <md-filled-button class="data _50" id="rotate-esc">ESC</md-filled-button>
    <md-filled-button class="data _50" id="rotate-enter">ENTER</md-filled-button>
 </div>
 </div>`
const templateScaleInputData = `
<div>
<div>
    <md-filled-text-field id="data-x0" label="Xi" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Yi" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </div>
 <md-filled-text-field id="data-sn" label="Zoom Num" class="half" type="number" value="50" step="1">
    </md-filled-text-field><md-filled-text-field id="data-sd" label="Zoom Den" class="half" type="number" value="100" step="1">
    </md-filled-text-field>

 <div>
    <md-filled-button class="data _50" id="scale-esc">ESC</md-filled-button>
    <md-filled-button class="data _50" id="scale-enter">ENTER</md-filled-button>
 </div>
 </div>`
const templateOriginInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="OX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="OY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
    <md-filled-button class="data half" id="submenu-origin-end">END</md-filled-button>
 </span>
</div>
`   
const templateSymmetryXInputData = `
<div>
 <span>
    <md-filled-text-field id="data-y0" label="OY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
</div>
`   
const templateSymmetryLInputData = `
<!--cy-angle-data id="data-a" data-a="45" class="data"></cy-angle-data-->;
`   
const templateSymmetryYInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="OX" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
</div>
`   

const templateGcodeInputData = `
<div>
<textarea autofocus contenteditable="plaintext-only" id="iso-input" ></textarea>
  <div>
    <md-filled-button class="data _50" id="iso-esc">ESC</md-filled-button>
    <md-filled-button class="data _50" id="iso-end">END</md-filled-button>
 </div>
</div>
`   


const templateNull = ``;

// Para separar un poco identificadores de tipo y templates creo un objeto (o podría ser un Map, etc...)
const templates = {
    null:       templateNull,
    circleCP:   templateCircleCPInputData,
    circle3P:   templateCircle3PInputData,
    circle2PR:  templateCircle2PRInputData,
    circleCR:   templateCircleCRInputData,
    polyR:      templatePolyRInputData,
    polyH:      templatePolyRInputData,
    segmentPP:  templateSegmentPPInputData,
    segmentPXA: templateSegmentPXAInputData,
    segmentPYA: templateSegmentPYAInputData,
    segmentPDA: templateSegmentPDAInputData,
    segmentNP:  templateSegmentPPInputData,
    arc3P:      templateArc3PInputData,
    arc2PR:     templateArc2PRInputData,
    arcCPA:     templateArcCPAInputData,
    path:       templatePathInputData,
    bbox:       templateBBoxInputData,
    zoombox:    templateZoomBoxInputData,
    select:     templateSelectInputData,
    cutPoints:  templateCutPointsInputData,
    translate:  templateTranslateInputData,
    rotate:     templateRotateInputData,
    scale:      templateScaleInputData,
    origin:     templateOriginInputData,
    symmetryX:  templateSymmetryXInputData,
    symmetryY:  templateSymmetryYInputData,
    symmetryL:  templateSymmetryLInputData,
    gcode:      templateGcodeInputData

}
export default class CyInputData extends HTMLElement {
    constructor() {
        super();
        this.dom = this.attachShadow({mode:'open'});
    }

    createStyle() {
        let style = `
            <style>                
                #container{
                    position:absolute;
                    width:100%;
                }
                    .half{
                    width:50%;
                    }
                    ._33{width:30%}
                    ._25{width:25%}
            </style>
        `;
        return style;
    }

    //nos pasamos el tipo y subtipo codificados ejemplo 'circle-CP' o 'circle-2PR'
    //y uso la misma nomenclatura en los templates para evitar problemas y traducciones, pero en camelCase
    createTemplate() {
        return `
<div id="container">
        ${templateNull}
</div>
        `;
    }
    createTemplateDyn(type) {
        let tType = type || null;
        let template = `
            ${templates[tType]}
        `;
        return template;
    }

    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.input = this.dom.querySelector("#container");
        this.dom.querySelector("#container").addEventListener('change', (evt)=>this.handleEvent(evt));
        this.dom.querySelector("#container").addEventListener('click', (evt)=>this.handleEvent(evt));
    }

    handleEvent(evt){
        //this.block = evt.detail.b;
        switch(evt.type){
            case 'click':
                const detail = {};
                detail[evt.target.id] = evt.target.value;
                this.dispatchEvent(new CustomEvent('input-click',{bubbles:true, composed:true, detail: detail}))
                break;
            //Una vez que tengo el foco en el control debo mandar todos los valores, porque el usuario ya ve un 0 en los no definidos
            case 'change':
                this.data[evt.target.id] = evt.target.value;
                this.dispatchEvent(new CustomEvent('input-data',{bubbles:true, composed:true, detail: this.data}))
                break;
        }
    }
    format(n){ return(n.toFixed(3))};
    //intento hacerlo lo más genérico posible, pero habrá switches casi seguro.
    //Me pasan pos e idn, que es un array con los id de los campos que cambian.
    // data-xx es el nombre publico entre ambos controles 
    /**@todo generalizar? */
    update(data){
        const [ix,iy] = data.idn.map(k => 'data-' + k); //array de dos asciis, ej: data-x0 y data-y0
        if(this.inputs[ix]){
            const v = this.format(+data.pos.x);
            this.inputs[ix].value = v;
            this.data[ix] = v
        }
        if(this.inputs[iy]){
            const v = this.format(+data.pos.y);
            this.inputs[iy].value = v;
            this.data[iy] = v
        }
        //this.dom.querySelector('#'+iy).value = this.format(data.pos.y);
        //console.log(data.pos);
    }
    updateData= (data)=>{
        if(!data) return;
        Object.keys(data).forEach(k =>{
            if(this.keys.includes( k))
                this.inputs[k].value = data[k];
                this.data[k] =  data[k];
            });
    }

    disconnectedCallback() {
    }
    static get observedAttributes() {
        return ['type'];
      }
    /**@todo unificar a clase data la selección */   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        case 'type': if(oldVal !== newVal){
            this.input.innerHTML = this.createStyle() + this.createTemplateDyn(newVal);
            this.data = {};
            this.inputs = {};
            let inputs = Array.from(this.dom.querySelectorAll('md-filled-text-field')).filter(el=>el.id.startsWith('data'));
            const others = Array.from(this.dom.querySelectorAll('.data')).filter(el=>el.id.startsWith('data'));
            inputs = inputs.concat(others);
            this.keys = inputs.map(el=>el.id);
            inputs.forEach(k => this.data[k.id] =  k.value);
            inputs.forEach(k => this.inputs[k.id] =  k);
        }
        break
        default:
            break;
    }
    }

}
    customElements.define('cy-input-data', CyInputData);