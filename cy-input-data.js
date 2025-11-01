
//Incluyo aquí un selector de ángulo a medida como ayuda en los input-data
class CyAngleData extends HTMLElement {
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
            #data-coarse{
            width:70%;}
            #data-a{
            width:25%;}
                </style>
        `;
        return style;
    }

    createTemplate() {
        return `
<div id="container">
  <span>
    <md-slider id="data-coarse" step="15" ticks min="-90" max="90"></md-slider>
    <!--md-slider step="1" ticks min="-15" max="15"></md-slider-->
    <md-filled-text-field id="data-a" label="ALFA" type="number" value="${this.alfa}" min="-90" max="90" step="1"></md-filled-text-field>
 </span>
</div>
        `;
    }
    set value(v){
        this.alfa = +v;
        this.coarse.value = this.alfa;
        this.a.value = this.alfa;      
        }
    get value(){
        return this.a.value;
    }
    connectedCallback() {
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.coarse = this.dom.querySelector("#data-coarse");
        this.a = this.dom.querySelector("#data-a");
        //TODO
        //this.alfa = 0;
        this.coarse.addEventListener('change', (evt)=>{
            //console.log(evt);
            this.alfa = evt.target.value;
            this.a.value = this.alfa;
        })
        this.a.addEventListener('change', (evt)=>{
            //console.log(evt);
            this.alfa = evt.target.value;
            this.coarse.value = this.alfa;
        });
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {
        return ['data-a'];
      }   
    attributeChangedCallback(name, oldVal, newVal) {
    switch(name) {
        case 'data-a': if(oldVal !== newVal){
            this.alfa = +newVal % 90;
            //this.a.value = this.alfa;
            //this.coarse.value = this.alfa;
        }
        break
        default:
            break;
    }
    }

}
    customElements.define('cy-angle-data', CyAngleData);


const template = `
<div id="data-container">

</div>
`
//esto se puede hacer con componentes que heredan, pero lo cierto es que hay cosas comunes a mantener
//y otras específicas que se deben guardar, por ejemplo un radio para arco o circunferencia 2PR, centro, etc...
//pero puede evolucionar....
const templateCircleCPInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="CX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="CY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 </div>
`   
const templateCircleCRInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="CX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="CY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
  <md-filled-text-field id="data-r" label="R" type="number" value="0" min="0" step="0.5"></md-filled-text-field>
 </div>
`    
const templateCircle2PRInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X2" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y2" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
  <md-filled-text-field id="data-r" label="R" type="number" value="0" min="0" step="0.5"></md-filled-text-field>
 </div>
`    
const templateCircle3PInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X2" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y2" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x2" label="X3" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y2" label="Y3" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 </div>
`
//Igual que circle pero con nombres diferentes, 
const templateArc3PInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-xm" label="XM" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-ym" label="YM" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 </div>
`
const templateArc2PRInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X2" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y2" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
  <md-filled-text-field id="data-r" label="R" type="number" value="0" min="0" step="0.5"></md-filled-text-field>
 </div>
`   
const templateArcCPAInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="CX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="CY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-xm" label="PX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-ym" label="PY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
      <cy-angle-data id="data-a" class="data"></cy-angle-data>;
 </div>
`   
const templatePolyRInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="CX" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="CY" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
    <md-filled-text-field id="data-x1" label="X1" class="half" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y1" class="half" type="number" value="0" step="0.5"></md-filled-text-field>
 </span>
 <span>
 <!--md-slider step="1" ticks min="3" max="12"></md-slider-->
 <md-filled-text-field id="data-edges" label="N EDGES" class="half" type="number" value="4" min="3" max="12" step="1"></md-filled-text-field>
 <md-filled-select id=data-subType class="half">
  <md-select-option value="R"  selected><div slot="headline">Radius</div></md-select-option>
  <md-select-option value="H"><div slot="headline">Edge</div></md-select-option>
</md-filled-select>

 </span>
 </div>
`    

const templateSegmentPPInputData = `
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
const templateSegmentPXAInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-x1" label="X" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field>
 </span>
 <span>
    <!--md-filled-text-field id="data-a" label="ALFA" class="half" type="number" value="45" min="-90" max="90" step="1"></md-filled-text-field-->
    <cy-angle-data id="data-a" class="data"></cy-angle-data>;
 </span>
 </div>
`    
const templateSegmentPYAInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y1" label="Y" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field>
 </span>
 <span>
    <!--md-filled-text-field id="data-a" label="ALFA" class="half" type="number" value="45" min="-90" max="90" step="1"></md-filled-text-field-->
    <cy-angle-data id="data-a" class="data"></cy-angle-data>;
 </span>
 </div>
`    
const templateSegmentPDAInputData = `
<div>
 <span>
    <md-filled-text-field id="data-x0" label="X0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-y0" label="Y0" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field><md-filled-text-field id="data-d" label="D" class="_33" type="number" value="0" step="0.5">
    </md-filled-text-field>
 </span>
 <span>
    <!--md-filled-text-field id="data-a" label="ALFA" class="half" type="number" value="45" min="-90" max="90" step="1"></md-filled-text-field-->
    <cy-angle-data id="data-a" class="data"></cy-angle-data>;
 </span>
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
const templateRotateInputData = `<cy-angle-data id="data-a" class="data"></cy-angle-data>`

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
    origin:     templateOriginInputData,
    symmetryX:  templateSymmetryXInputData,
    symmetryY:  templateSymmetryYInputData,
    symmetryL:  templateSymmetryLInputData

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
        const [ix,iy] = data.idn; //array de dos asciis, ej: data-x0 y data-y0
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
        Object.keys(data).forEach(k =>{
            if(this.keys.includes(k))
                this.inputs[k].value = data[k];
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