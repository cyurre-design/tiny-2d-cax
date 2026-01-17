//Layers
import './cy-canvas-layers/cy-canvas-viewer.js';
import {getSvgPathFromBlocks} from "./cy-canvas-layers/cy-elements-to-canvas.js"
import { sharedStyles } from './shared-styles.js';

//Application
import "./cy-layer-list.js"

//Aunque no se llame directamente hace falta importarlo porque la ejecución define el elemento!!!!
import CyInputDataBasic from './cy-elements/cy-input-data-basic.js';

import { loadProject, saveProject, saveSvg, saveCNC } from "./obsoletos/cy-file-save-load.js";

//From geometry

import {findAllCuts, blockTranslate, blockRotate, blockScale, blockSymmetryX, blockSymmetryY, blockSymmetryL, fuzzy_eq, fuzzy_eq_point} from './cy-geometry/cy-geometry-library.js'
import {createDrawElement } from './cy-geometry/cy-geometry-basic-elements.js';

//Commands
import {createCommandManager, commandLayerCreate, commandLayerDelete, commandLayerSetStyle, 
      commandBlockCreate, commandBlockDelete, commandBlockTransform, commandCreateCutPoints,
      commandChangeOrigin,
      commandLinkUnlink, commandBooleanOperation} from './cy-commands/cy-command-definitions.js';

//For Drawing Interactively

import DrawBasic from "./cy-draw-interactive/cy-draw-basic.js"

import DrawTranslate from "./cy-draw-interactive/cy-draw-translate.js"
import DrawRotate from "./cy-draw-interactive/cy-draw-rotate.js"
import DrawScale from "./cy-draw-interactive/cy-draw-scale.js"
import DrawSymmetry from "./cy-draw-interactive/cy-draw-symmetry.js"
import DrawSelection from "./cy-draw-interactive/cy-draw-selection.js"
import DrawOrigin from "./cy-draw-interactive/cy-draw-origin.js"
import DrawLink from "./cy-draw-interactive/cy-draw-link.js"
import DrawBoolean from "./cy-draw-interactive/cy-draw-boolean.js"

import DrawNormal from "./cy-draw-interactive/cy-draw-normal.js"
import DrawSegmentPB from "./cy-draw-interactive/cy-draw-segment-PB.js"
import DrawSegmentBB from "./cy-draw-interactive/cy-draw-segment-BB.js"
import DrawSegment from "./cy-draw-interactive/cy-draw-segment.js"
import DrawPolygon from "./cy-draw-interactive/cy-draw-polygon.js"
import DrawCircle from "./cy-draw-interactive/cy-draw-circle.js"
import DrawArc from "./cy-draw-interactive/cy-draw-arc.js"
import DrawPath from "./cy-draw-interactive/cy-draw-path.js"
import DrawGcode from "./cy-draw-interactive/cy-draw-gcode.js"
import DrawExportGcode from "./cy-draw-interactive/cy-draw-export-gcode.js"
import DrawText from "./cy-draw-interactive/cy-draw-text.js"
import DrawMeasure from "./cy-draw-interactive/cy-draw-measure.js"

//Parsers
import {convertDxfToGeometry} from "./parsers/cy-parser-dxf-geometry-objects.js"
import {isoToGeometry } from "./parsers/cy-parser-iso-geometry.js"
import {svgToGeometry} from "./parsers/cy-parser-svg.js"
import {pathsToIso, setGCodeDefaults} from "./parsers/cy-parser-geometry-to-iso.js"


const defaultConfig = await fetch('./cy-1830-config.json').then(r => r.json());

const templateMainMenu =`
  <span >
    <md-filled-button id="file-menu-anchor">FILE</md-filled-button>
  <!-- Note the has-overflow attribute -->
    <md-menu has-overflow positioning="popover" id="file-menu" anchor="file-menu-anchor">
    <md-menu-item id="open-project"><div slot="headline">Open</div></md-menu-item>
    <md-menu-item id="open-geometry"><div slot="headline">Load</div></md-menu-item>
        <md-menu-item id="save-project"><div slot="headline">Save</div></md-menu-item>
        <md-menu-item id="save-iso"><div slot="headline">Export GCode</div></md-menu-item>
        <md-menu-item id="save-svg"><div slot="headline">Export Svg</div></md-menu-item>
        <!--md-menu-item id="print"><div slot="headline">PRINT</div></md-menu-item-->
    </md-menu>

    <md-filled-button id="settings-menu-anchor">SETTINGS</md-filled-button>
      <md-menu has-overflow positioning="popover" id="settings-menu" anchor="settings-menu-anchor">
        <md-menu-item id="settings-layer-style"><div slot="headline">Layers</div></md-menu-item>        
        <md-menu-item id="settings-geometry-defaults"><div slot="headline">Geometry</div></md-menu-item>        
        <md-menu-item id="settings-GCode-defaults"><div slot="headline">G-Code</div></md-menu-item>        
      </md-menu>
</span>
`
//tools y settings fijos
const templateMeasure = `
<div class="row" id='menu-measure'>
<input type="button" id='measure-block' value="MEAS. BLOCK" class="_50"/>
<input type="button" id='measure-p2p' value="MEAS. P2P" class="_50"/>
</div>`
const templateZoom = `
<div class="row" id='menu-zoom'>
<input type="button" id='zoom-sethome' value="SET H." class="_20"/>
<!--input type="button" id='zoom-box' value="BOX" class="_20"/-->
<input type="button" id='zoom-home' value="HOME" class="_20"/>
<input type="button" id='zoom-in' value=" Z+ " class="_20"/>
<input type="button" id='zoom-out' value=" Z- " class="_20"/>
<input type="button" id='zoom-fit' value="FIT" class="_20"/>
</div>`
//Esto aparecería en los comandos de transform por ejemplo
//Aprovecho y pongo aquí el width de selección, por ejemplo
const templateSelectInputData =`
<div>
    
    <div id="menu-select" class="column">
      <div class="row">
        <span class="_50">Select Tolerance</span><input class="_33" id="data-penWidth" type="number" value="1" max="5" min="0.5" step="0.5"/>
      </div>
      <div class="row">
        <input type="button" class="_25" id="select-sel" value = "SEL"/>
        <input type="button" class="_25" id="select-all" value = "ALL"/>
        <input type="button" class="_25" id="select-invert" value = "INV"/>
        <input type="button" class="_25" id="select-del" value = "DEL"/>
      </div>
      <!--div class="row">
        <input type="button" class="_25" id="select-copy" value = "COPY"/>
        <input type="button" class="_25" id="select-paste" value = "PASTE"/>
      </div-->
    </div>
</div>
`
const templateUndo = `
<div id='undo-redo' class="row">
    <input type="button" id="undo" class="_50" value="UNDO" />
    <input type="button" id="redo" class="_50" value="REDO" />
</div>
`
// const templateDraw = `<div id='drawing'>
//   <div class="row">
//     <input type="button" id="line" class="_25" value="LINE" />
//     <input type="button" id="arc" class="_25" value="ARC" />
//     <input type="button" id="circle" class="_25" value="CIRCLE" />
//     <input type="button" id="path" class="_25" value="PATH" />
//   </div>
//   <div class="row">
//     <input type="button" id="poly" class="_25" value="POLY" />
//     <input type="button" id="gcode" class="_25" value="GCODE" />
//     <input type="button" id="text" class="_25" value="TEXT" />
//   </div>
// </div>`
const templateDrawOptions = `
<div id='drawing-options'>
    <div id="segments" class="column">
      <div class="row">
        <input type="button" id="line-PP" class="_25" value="L-P-P" />
        <input type="button" id="line-PXA" class="_25" value="L-X-A" />
        <input type="button" id="line-PYA" class="_25" value="L-Y-A" />
        <input type="button" id="line-PDA" class="_25" value="L-D-A" />
      </div>
      <div class="row">
        <input type="button" id="line-TPB" class="_25" value="L-P-B" />
        <input type="button" id="line-TBB" class="_25" value="L-B-B" />
        <input type="button" id="line-NP" class="_25" value="L-PERP" />
      </div>
    </div>
    <div class="row" id="arcs">
      <input type="button" id="arc-CPA" class="_33" value="A-O-P-A" />
      <input type="button" id="arc-3P" class="_33" value="A-P-P-P" />
      <input type="button" id="arc-2PR" class="_33" value="A-P-P-R" />
    </div>
    <div class="row" id="circles">
      <input type="button" id="circle-CP" class="_25" value="C-O-P" />
      <input type="button" id="circle-3P" class="_25" value ="C-P-P-P" />
      <input type="button" id="circle-2PR" class="_25" value="C-P-P-R" />
      <input type="button" id="circle-CR" class="_25" value="C-O-R" />  
    </div>
    <div class="row">
      <input type="button" id="path" class="_25" value="PATH" />
      <input type="button" id="poly" class="_25" value="POLY" />
      <input type="button" id="gcode" class="_25" value="GCODE" />
      <input type="button" id="text" class="_25" value="TEXT" />
    </div>
</div>`

const templateTransform = `<div id='transform'>
  <div class="row">
    <input type="button" id="translate" class="_33" value="TRANSLATE" />
    <input type="button" id="rotate" class="_33" value="ROTATE" />
    <input type="button" id="scale" class="_33" value="SCALE" />
  </div>
  <div class="row">
    <input type="button" id="symmetry-X" class="_33" value="SYM-X" />
    <input type="button" id="symmetry-Y" class="_33" value="SYM-Y" />
    <input type="button" id="symmetry-L" class="_33" value="SYM-L" />
  </div>
  <div class="row">
    <input type="button" id="cut" class="_33" value="CUT" />
    <input type="button" id="link-unlink" class="_33" value="LINK/UNLINK" />
    <input type="button" id="origin" class="_33" value="ORIGIN" />
  </div>
  <div class="row">
    <input type="button" id="boolean" class="_33" value="BOOLEAN" />
  </div>
</div>`

const template = `
  <div id="full-screen" tabindex='1' class='column'>
    <div id="main-menu" class="row">${templateMainMenu}</div>
    <div id="left" class="column" >
      <cy-layer-list id="layer-view" class="column"></cy-layer-list>
      ${templateZoom}
      ${templateMeasure}
      ${templateUndo}
      ${templateSelectInputData} 
      ${templateTransform}
      ${templateDrawOptions}
      <cy-input-data-basic id="input-data"></cy-input-data-basic>
    </div>
    <cy-canvas-viewer id="viewer" tabindex="0"></cy-canvas-viewer></div>
  </div>
  `
const style = `
<style>

.layer-name{
    margin: 2px;
    width:100%;
    font-size:14px;
}
.layer-name.selected{
    background: yellow;
}
.material-icons-outlined{
    font-size: 36px;
    background-color: lightblue;
}
  #show-layers{
    width:100%;
    background-color: beige;
}

#full-screen{
    width:100%;
    height:100%;
}
    #main-menu{
    width:100%;
    heigh:5%
    }
#left{
    width: 24%;
    height: 95%;
    position:absolute;
    left:0;
    top:5%;
    background-color: wheat;
}
#hidden-row{
    height:0px;
}
#viewer { 
    display: block;
    width: 75%;
    height: 95%;
    position:absolute;
    left:25%;
    top:5%;
    background-color: #333333;
    fill: none;
    stroke: green; /*valor por defecto*/
    background-position:center;*/
}
#settings-menu-anchor{
     justify-content: flex-end;
}
    </style>
`
  //Almacenamiento de los datos manuales entre entradas y salidas de menus.
  //Pongo defaults (podrían ser de un JSON, TODO)
  //Uso la nomenclatura de variables de los componentes

// function saveConfig(config) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
// }


class cyCad1830App extends HTMLElement {

  constructor() {
      super();

      this.dom = this.attachShadow({ mode: 'open' });
      this.dom.adoptedStyleSheets = [sharedStyles];
      this.dom.innerHTML = template + style;
    }
  registerInputApplications(drawingApp){
    //-------------------INPUT DATA
    //Interactividad entre parte izquierda, datos manuales y ratón.
    this.drawingApp = drawingApp;
    this.viewer.interactiveDrawing.quit();
    this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
    }
    
  connectedCallback(){
    this.viewer = this.dom.querySelector("#viewer");
    this.manager =  createCommandManager( this.viewer.layerDraw, this ); // 

       //--------------MENUS
    const menus = ['file', 'settings' ]
    menus.forEach(m => this[m+'MenuEl'] = this.dom.querySelector(`#${m}-menu`));
    menus.forEach(m => {
        const el = this.dom.querySelector(`#${m}-menu-anchor`);
        el.addEventListener('click',  ()=> this[`${m}MenuEl`].open = !this[`${m}MenuEl`].open);
    })
    menus.forEach(m => this[`${m}MenuEl`].addEventListener('close-menu', (e) => this.handleMenus(e)));
        //------------- INPUT DATA  ----------
    customElements.whenDefined('cy-input-data-basic').then(()=>{
      //console.log('mdata inicializado')
      this.mData = this.dom.querySelector('#input-data');
      this.mData.initialData(defaultConfig)
      this.viewer.addEventListener('drawing-event', (e) => this.mData.update(e.detail));
      //------------------- GESTION interactive drawing y lado izquierdo
      this.registerInputApplications(new DrawBasic(this.viewer.layerDraw, ''))
      //Tratamiento homogéneo de botones, inputs y teclas 
      const events =   ['input-data', 'input-click', 'input-key'];
      events.forEach( eType =>  
        this.mData.addEventListener(eType, (e) => {
          e.stopPropagation();
          this.drawingApp.updateData( e.detail);
        }))
      this.mData.setActiveApplication('none');
    })


//--------------Gestión de CAPAS, LAYERS
    //se pueden generar capas bien en el Load, bien en la propia aplicación (menú)
    //si se crea una capa, por ejemplo al leer un fichero, generamos su control de ver/etc..
    //Si en la lista de capas se desea ver/no ver, etc..., viene aquí
    //y si se crea en la propia lista también
    //La gestión se centraliza aquí que para eso es la aplicación, y los comandos se preparan para undo, redo
    this.layerView = this.dom.querySelector('#layer-view');
    this.layerView.addEventListener('layer-handle', (data)=>{
      const e = data.detail;
      if(e.action === 'visibility')
        this.viewer.setVisible(e.layerId, e.value);
      else if(e.action === 'create'){
        const layer = commandLayerCreate(e.layer);    //de momento es siempre undefined por el modo de trabajo
      } else if(e.action === 'delete'){
        const id = e.layerId;
        let del = true;
        if(!this.viewer.layerDraw.layerIsEmpty(id)){
          del = confirm('the layer is not empty, are you sure ?');
        }
        if(del) 
          commandLayerDelete(id);    //de momento es siempre undefined por el modo de trabajo
      } else if(e.action === 'set-style'){
        commandLayerSetStyle(e.layerId, e.value);
      } else if(e.action === 'active'){
        this.viewer.layerDraw.setActiveLayerId(e.layerId);
      }

    })
//--------------------- CREACION DE BLOQUES ------------------
  /**@listens new-block Aquí es donde se recibe la petición de insertar geometría
   * tras terminar la parte interactiva !!! */
  this.addEventListener('new-block', e=>{
      //this.layerDraft.clear();
      const blocks = createDrawElement(e.detail.type, e.detail.data);
      commandBlockCreate(blocks);
  });
//--------------------- ORIGIN   COMANDO --------------------------------
/**
 * el origen es un comanod chingo que afecta a la totalidad de la base de datos, incluidos los trees rbush
 * la alternativa es mantener un offset en cada elemento creado y tenerlo en cuenta al pintar, etc...
 * Se puede evaluar pero....
 */
    /**@listens set-origin cuando se ejecuta de verdad el comando definido de forma interactiva */
    //Los comandos en realidad no se ejecutan al accionar el menú sino cuando se dan por concluidas las partes interactivas
    //El dibujo se debe mantener en pantalla como estaba, por eso hay que cambar la ventana (Pane)
    this.addEventListener('set-origin', e=>{
      const dx = e.detail.data.x0, dy =e.detail.data.y0
      commandChangeOrigin( dx, dy);
    });
//--------------------- LINK-UNLINK COMANDO --------------------------------
    /**@listens link-unlink cuando se ejecuta de verdad el comando link o unlink definido de forma interactiva */
    //Los comandos en realidad no se ejecutan al accionar el menú sino cuando se dan por concluidas las partes interactivas
    this.addEventListener('link-unlink', e=>{
      //Aquí se debería hacer el comando link o unlink
      commandLinkUnlink( e.detail.mode, e.detail.data.tol);
      });
//--------------------- BOOLEAN  COMANDOS ------------------------
    /**@listens boolean-op  para hacer operaciones con paths */
    // Para las and y or se admiten n paths, pero para not y xor solo 2
    this.addEventListener('boolean-op', e=>{
 
      //Aquí se debería hacer el comando propiamente dicho y guardar info de deshacer
      //En realidad hay comandos como el or y and que admiten más de dos parámetros, a decidir qué hacer
      commandBooleanOperation(e.detail.paths[0], e.detail.paths[1], e.detail.mode);
      });   
//--------------------- TRANSFORMACIONES   COMANDOS ------------------------  
  this.addEventListener('geometry-transform',  (evt)=>{
      evt.stopPropagation();
      let op = evt.detail.command, mode = evt.detail.mode || '', data = evt.detail.data;
      op += mode;
      let opData;
      switch(op){
        case 'symmetryX':  opData = {op: blockSymmetryX, arg : [data.y0]};  break;
        case 'symmetryY':  opData = {op: blockSymmetryY, arg : [data.x0]};  break;
        case 'symmetryL':  opData = {op: blockSymmetryL, arg : [data]};     break;
        case 'translate':  opData = {op: blockTranslate, arg: [data.dx, data.dy]}; break;
        case 'rotate'   :  opData = {op: blockRotate, arg: [data.x, data.y, data.a]}; break;
        case 'scale'    :  opData = {op: blockScale, arg: [data.x, data.y, data.s]}; break;
        default:          break;
      }
      const blocks = this.viewer.layerDraw.getSelectedBlocks();

      commandBlockTransform(blocks, opData)
        //this.layerDraw.symmetrySelected(evt.detail.mode, evt.detail.data));
  })
        
//-----------------UNDO, REDO -------- BOTONES
  /**undo-redo
   * 
   */
    this.dom.querySelector('#undo-redo').addEventListener('click',(evt)=>{
            if(evt.target.id === 'undo'){
                this.manager.undo();
            } else if(evt.target.id === 'redo'){
                this.manager.redo();
            }
        })
//----------------- SEL, ALL, INV, DEL -------- BOTONES
  /**select
   * Esto no está en el menú sino en la zona vertical
   */
    this.dom.querySelector('#menu-select').addEventListener('click',(evt)=>{
      const [main, sub1, sub2] = evt.target.id.split('-');
      this.registerInputApplications( new DrawSelection(this.viewer.layerDraw, '') );
      this.mData.setActiveApplication( 'none', '');
      switch(sub1){
        case 'all'    : {
                          this.viewer.layerDraw.deselectAll();
                          this.selectedBlocks = [];
                        }
                        break;
        case 'invert' : this.viewer.layerDraw.invertSelection(); break;
        case 'del'    : {
                          this.selectedBlocks = this.viewer.layerDraw.getSelectedBlocks();
                          commandBlockDelete(this.selectedBlocks);
                        }
              break;
        case 'sel'    : { //este es el modo por defecto
                        }
                        break;
        case 'copy'   : {
                          this.selectedBlocks = this.viewer.layerDraw.getSelectedBlocks();
                        }
                        break;
        case 'paste'  : {

                        }
                        break;
      }
    })
//----------------- ZOOM  ------------------------------ BOTONES
  /**sacado del menu al lateral por comodidad */
    this.dom.querySelector('#menu-zoom').addEventListener('click', (evt) => {
        this.viewer.clearCursors();
        this.viewer.canvasHandler.setZoomMode();               
        const cmd = evt.target.id.split('-')[1];
        switch( cmd) {
            case 'fit':     this.viewer.fit();break;
            case 'home':    this.viewer.canvasHandler.view('fgZoomHome'); break;
            case 'sethome': this.viewer.canvasHandler.view('fgSetHome'); break;
            case 'in':      this.viewer.canvasHandler.view('fgZoomIn'); break;
            case 'out':     this.viewer.canvasHandler.view('fgZoomOut');break;
        }
    })
//-----------------  MEASURE ---------------------------- BOTONES
/** menu de medición, elemento, path o punto a punto */
    this.dom.querySelector('#menu-measure').addEventListener('click', (evt) => {
      const [main, sub1, sub2] = evt.target.id.split('-');
      this.registerInputApplications( new DrawMeasure(this.viewer.layerDraw, sub1) );
      this.mData.setActiveApplication( 'measure', sub1);
    })
//---------------- TRANSFORM ------------------------- BOTONES 
    this.dom.querySelector('#transform').addEventListener('click',(evt)=>{
      this.dom.querySelectorAll('#transform input').forEach( btn => btn.classList.remove('active'));
      evt.target.classList.add('active');
      const [main, sub1, sub2] = evt.target.id.split('-');  
      console.log(main, sub1, sub2);
      switch(main){
                case 'origin':{
          this.registerInputApplications( new DrawOrigin(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', 'origin' );
        }break;
       /**
         * El link debe unir tanto tramos sueltos como paths.
        * @todo hacerlo interactivo pinchando bloque
       */
        case 'link':{
          this.registerInputApplications( new DrawLink(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', `link`);
          //this.viewer.layerDraw.link();
        }
        break;          
        case 'symmetry':{
          this.registerInputApplications( new DrawSymmetry(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', `symmetry${sub1}`);
        }
        break;
        case 'cut':{
          const selectedBlocks = this.viewer.layerDraw.getSelectedBlocks();
          const cutPoints = findAllCuts(selectedBlocks);
          commandCreateCutPoints(cutPoints); //ye un comando con undo
        }
        break;
        case 'scale':{
          this.registerInputApplications( new DrawScale(this.viewer.layerDraw, sub1))
          this.mData.setActiveApplication( 'transform', 'scale' );
        }
        break;
        case 'translate': {
          this.registerInputApplications(  new DrawTranslate(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', 'translate' );
        }
        break;
        case 'rotate':{
          this.registerInputApplications(  new DrawRotate(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', 'rotate' );
        }
        break;
        case 'boolean':{
          this.registerInputApplications(  new DrawBoolean(this.viewer.layerDraw, sub1) )
          this.mData.setActiveApplication( 'transform', 'boolean' );
        }
        break;        
      }})
//------------------------- DRAW  BOTONES ----------------------
    this.dom.querySelector('#drawing-options').addEventListener('click',(evt)=>{
      this.dom.querySelectorAll('#drawing-options input').forEach( btn => btn.classList.remove('active'));
      evt.target.classList.add('active');
      const [main, sub1, sub2] = evt.target.id.split('-');  
      console.log(main, sub1, sub2);
      switch(main){
        case 'point':  break;
        case 'line' :{
          switch(sub1){ //agrupo acciones comunes
            case 'NP':  this.registerInputApplications(this.drawingApp = new DrawNormal(this.viewer.layerDraw, sub1));    break;
            case 'PP':
            case 'PXA':
            case 'PYA':
            case 'PDA': this.registerInputApplications( new DrawSegment(this.viewer.layerDraw, sub1) );   break;
            case 'TPB': this.registerInputApplications( new DrawSegmentPB(this.viewer.layerDraw, sub1)); break;
            case 'TBB': this.registerInputApplications( new DrawSegmentBB(this.viewer.layerDraw, sub1)); break;
          }
          this.mData.setActiveApplication( 'segment', sub1 );
        }
        break;
        case 'circle' :{
          this.registerInputApplications(  new DrawCircle(this.viewer.layerDraw, sub1))
          this.mData.setActiveApplication( 'circle', sub1 );
        }
        break;
        case 'arc' :{
          this.registerInputApplications( new DrawArc(this.viewer.layerDraw, sub1) )        
          this.mData.setActiveApplication( 'arc', sub1 );
        }
        break;
        case 'path':{
          this.registerInputApplications( new DrawPath(this.viewer.layerDraw, sub1) )        
          this.mData.setActiveApplication( 'path', sub1 );
        } break;
        case 'poly' :{ //quito el menú de tipo y lo pongo en el selector de input-data
          this.registerInputApplications( new DrawPolygon(this.viewer.layerDraw, sub1) );
          this.mData.setActiveApplication( 'polygon', sub1 );
        } break;
        case 'gcode' : {
          this.registerInputApplications( new DrawGcode(this.viewer.layerDraw, '') )
          this.mData.setActiveApplication( 'gcode', sub1 );
        } break;
        case 'text' : {
          this.registerInputApplications( new DrawText(this.viewer.layerDraw, '') )
          this.mData.setActiveApplication( 'text', sub1 );
        } break;
        default:break;
      }
      });

//-----------------CREAR CAPAS INICIALES
    //Estas capas las generamos de oficio
    //Los tratamientos son aditivos y los atributos ascii
    customElements.whenDefined('cy-layer-list').then(() => {
      this.layerView.addLayer( JSON.stringify(this.viewer.axesLayer)); //Estas tienen gestión interna especial
      this.layerView.addLayer( JSON.stringify(this.viewer.gridLayer)); //Estas tienen gestión interna especial  
      //Al crearla se debe poner activa ella sola.
      const layerData = commandLayerCreate()
    });   

  } //END of connectedcallback

    /**para poder llamarla desde la gestión de comandos desde donde solo queremos acceso al modelo y la app (esta) */
    translateOrigin = (dx, dy) => {
      this.viewer.canvasHandler.view("fgPane", {x:dx, y:dy});  //rehace los cálculos del handler
    }

    handleMenus = (e) => {
      //Nos ponemos una nomenclatura razonable para poner orden en los ids
      //menu, submenu, etc... separados por guiones
      const action = e.detail.initiator.id;
      const [main, sub1, sub2] = action.split('-');
      console.log(main, sub1, sub2);
      switch(main){
        case 'open': {
          const clear = sub1 === 'geometry'? false: true;
          loadProject().then(file => {
            const type = file.name.split('.').pop();
            if(type.toLowerCase() === 'json'){
              const data = JSON.parse(file.text );
            // Restaurar modelo
              this.viewer.layerDraw.deserialize( data.model, clear); //Falta restaurar historia
            }
            else if((type === 'nc') || (type === 'pxy')){
              const geo = isoToGeometry(file.text); //Hay que pasarle la configuración de máquina...por defecto fresadora
              geo.geometry.layers.forEach(ly => {
                const id = this.viewer.layerDraw.addLayer(ly.name); //debe poner el activeLayer
                this.layerView.addLayer(JSON.stringify(this.viewer.layerDraw.getLayer(id)));
                this.viewer.layerDraw.addBlocks(undefined, ly.paths);
              })
              this.viewer.fit();
              this.viewer.layerDraw.draw();
            } else if(type === 'svg'){
              const geo = svgToGeometry(file.text);
              geo.layers.forEach(ly => {
                const id = this.viewer.layerDraw.addLayer(); //debe poner el activeLayer
                this.layerView.addLayer(JSON.stringify(this.viewer.layerDraw.getLayer(id)));
                this.viewer.layerDraw.addBlocks(undefined, ly.paths);
              })
              this.viewer.fit();
              this.viewer.layerDraw.draw();

            } else if(type === 'dxf'){
              const layers = convertDxfToGeometry(file.text); //devuelve array de layers y cada una con sus bloques...
              layers.forEach(ly => {
                const id = this.viewer.layerDraw.addLayer(ly.name, {pathColor:`#${ly.color.toString(16)}`}); //debe poner el activeLayer
                this.layerView.addLayer(JSON.stringify(this.viewer.layerDraw.getLayer(id)));
                this.viewer.layerDraw.addBlocks(undefined, ly.blocks.concat(ly.paths).concat(ly.circles));
              })
              this.viewer.fit();
              this.viewer.layerDraw.draw();
            }
            
          })
        }break;
        case 'save': {
          switch(sub1){
            case 'project':{
              const projectData = {
              project: { name: "unnamed", timestamp: Date.now()},
              model: this.viewer.layerDraw
              //manager: this.manager
              // serializamos los comandos registrados
              //commands: Array.from(commandRegistry.entries()).map(([name, fn]) => ({ name, source: fn.toString(), })),
              };
              const json = JSON.stringify(projectData, null, 2);
              saveProject(null, json);
              //saveProject(null, json);
              //     const type = file.name.split('.').pop();
            }break;
            case 'iso':{
              //En el futuro , en vez de perfil, puede elegirse tipo de mecanizado, compensación, etc...
              //Se trabaja sobre paths que estén seleccionados para no dispersar la manera de hacer cosas
              //let data = this.viewer.layerDraw.getSelectedBlocks().filter( b => b.type === 'path');
              this.registerInputApplications( new DrawExportGcode(this.viewer.layerDraw, '') );
              this.mData.setActiveApplication( 'export-gcode', sub1);
              this.viewer.layerDraw.addEventListener('generate-iso', (evt)=>{
                setGCodeDefaults(evt.detail)
                saveCNC(null, pathsToIso(evt.detail.paths))
              })
 //                  saveCNC(null, pathsToIso(data));
            }break;
            case 'svg':{   
              let data = this.viewer.layerDraw.getSelectedBlocks().filter( b => b.type === 'path');;
              const ww = this.viewer.layerDraw.extents;
              const header = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
                fill="transparent" stroke="black" strokeWidth="2px" vector-effect="non-scaling-stroke"
                viewBox = "${ww.xi} ${ww.yi} ${ww.xf-ww.xi} ${ww.yf-ww.yi}"
                preserveAspectRatio = xMidYMid meet"
                transform="matrix(1 0 0 -1 0 0)" >\n` 
                const paths = data.reduce((d,path) =>  d + `<path d="${(getSvgPathFromBlocks(path))}"/>\n`, '')
                const file = `${header}${paths}</svg>`
                saveSvg(null, file);
            }break;
          }
        }break;

        }
    } 
    //Se supone que aquí se llama al desconectar la página, pero en laa aplicaciones no parece que pase
    disconnectedCallback() {
    //hay que quitar los listeners... 
    }
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

customElements.define('cy-cad-1830-app', cyCad1830App);

