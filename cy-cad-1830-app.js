
//Layers
import './cy-canvas-layers/cy-canvas-viewer.js';
import {getSvgPathFromBlocks} from "./cy-canvas-layers/cy-elements-to-canvas.js"

//Application
import "./cy-layer-list.js"
import './cy-input-data.js';
import { loadProject, saveProject, saveSvg, saveCNC } from "./cy-file-save-load.js";

//From geometry

import {findAllCuts, blockTranslate, blockRotate, blockScale, blockSymmetryX, blockSymmetryY, blockSymmetryL, fuzzy_eq, fuzzy_eq_point} from './cy-geometry/cy-geometry-library.js'
import {createDrawElement } from './cy-geometry/cy-geometry-basic-elements.js';

//Commands
import {createCommandManager, commandLayerCreate, commandLayerDelete, commandLayerSetStyle, 
      commandBlockCreate, commandBlockDelete, commandBlockTransform, commandCreateCutPoints,
      commandChangeOrigin} from './cy-commands/cy-command-definitions.js';

//For Drawing Interactively
import DrawTranslate from "./cy-draw-interactive/cy-draw-translate.js"
import DrawRotate from "./cy-draw-interactive/cy-draw-rotate.js"
import DrawScale from "./cy-draw-interactive/cy-draw-scale.js"
import DrawSymmetry from "./cy-draw-interactive/cy-draw-symmetry.js"
import DrawSelection from "./cy-draw-interactive/cy-draw-selection.js"
import DrawOrigin from "./cy-draw-interactive/cy-draw-origin.js"

import DrawSegment from "./cy-draw-interactive/cy-draw-segment.js"
import DrawPolygon from "./cy-draw-interactive/cy-draw-polygon.js"
import DrawCircle from "./cy-draw-interactive/cy-draw-circle.js"
import DrawArc from "./cy-draw-interactive/cy-draw-arc.js"
import DrawPath from "./cy-draw-interactive/cy-draw-path.js"

//Parsers
import {convertDxfToGeometry} from "./parsers/cy-parser-dxf-geometry-objects.js"
import {isoToGeometry } from "./parsers/cy-parser-iso-geometry.js"
import {svgToGeometry} from "./parsers/cy-parser-svg.js"
import {pathsToIso} from "./parsers/cy-parser-geometry-to-iso.js"

const templateMainMenu =`
  <span >
    <md-filled-button id="file-menu-anchor">FILE</md-filled-button>
  <!-- Note the has-overflow attribute -->
    <md-menu has-overflow positioning="popover" id="file-menu" anchor="file-menu-anchor">
    <md-menu-item id="file-open"><div slot="headline">Open</div></md-menu-item>
        <md-menu-item id="file-save-project"><div slot="headline">Save</div></md-menu-item>
        <md-menu-item id="file-save-iso"><div slot="headline">Export GCode</div></md-menu-item>
        <md-menu-item id="file-save-svg"><div slot="headline">Export Svg</div></md-menu-item>
        <md-menu-item id="file-print"><div slot="headline">PRINT</div></md-menu-item>
    </md-menu>
    <md-filled-button id="zoom-menu-anchor">ZOOM</md-filled-button>
    <md-menu has-overflow positioning="popover" id="zoom-menu" anchor="zoom-menu-anchor">
        <md-menu-item id="zoom-box" ><div slot="headline">BOX</div></md-menu-item>
        <md-menu-item id="zoom-fit" ><div slot="headline">FIT</div></md-menu-item>
        <md-menu-item id="zoom-home"><div slot="headline">HOME</div></md-menu-item>
        <md-menu-item id="zoom-setHome"><div slot="headline">SET HOME</div></md-menu-item>
        <md-menu-item id="zoom-in"><div slot="headline">ZOOM IN</div></md-menu-item>
        <md-menu-item id="zoom-out"><div slot="headline">ZOOM OUT</div></md-menu-item>
    </md-menu>

    <md-filled-button id="draw-menu-anchor">DRAW</md-filled-button>
    <md-menu has-overflow positioning="popover" id="draw-menu" anchor="draw-menu-anchor">
        <md-menu-item id="draw-start" ><div slot="headline">DRAW START</div></md-menu-item>
        <md-menu-item id="draw-stepBack" ><div slot="headline">STEP BACK</div></md-menu-item>
        <md-menu-item id="draw-end" ><div slot="headline">DRAW END</div></md-menu-item>
    </md-menu>
    <md-filled-button id="support-menu-anchor">SUPPORT</md-filled-button>
    <md-menu has-overflow positioning="popover" id="support-menu" anchor="support-menu-anchor">
        <!--md-menu-item id="point" ><div slot="headline">POINT</div></md-menu-item-->
        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">LINE</div></md-menu-item>
          <md-menu quick slot="menu" has-overflow positioning="popover" id="scale-menu">
            <md-menu-item id="line-PP" ><div slot="headline">2 POINTS</div></md-menu-item>
            <md-menu-item id="line-PXA" ><div slot="headline">X+ALFA</div></md-menu-item>
            <md-menu-item id="line-PYA" ><div slot="headline">Y+ALFA</div></md-menu-item>
            <md-menu-item id="line-PDA" ><div slot="headline">D+ALFA</div></md-menu-item>
            <md-menu-item id="line-tang" ><div slot="headline">TANG</div></md-menu-item>
            <md-menu-item id="line-perp" ><div slot="headline">PERP</div></md-menu-item>
          </md-menu>
        </md-sub-menu>        

        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">ARC</div></md-menu-item>
          <md-menu quick slot="menu" has-overflow positioning="popover" id="scale-menu">
            <md-menu-item id="arc-CPA" ><div slot="headline">C+1P+A</div></md-menu-item>
            <md-menu-item id="arc-3P" ><div slot="headline">3 POINTS</div></md-menu-item>
            <md-menu-item id="arc-2PR" ><div slot="headline">2 POINTS + R</div></md-menu-item>
          </md-menu>
        </md-sub-menu>        

        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">CIRCLE</div></md-menu-item>
          <md-menu quick slot="menu" has-overflow positioning="popover" id="circle-menu">
            <md-menu-item id="circle-CP"><div  slot="headline">C + P</div></md-menu-item>
            <md-menu-item id="circle-3P" ><div slot="headline">3 POINTS</div></md-menu-item>
            <md-menu-item id="circle-2PR" ><div slot="headline">2 POINTS + R</div></md-menu-item>
            <md-menu-item id="circle-CR" ><div slot="headline">C + R</div></md-menu-item>
          </md-menu>
        </md-sub-menu>
        
        <md-menu-item id="path" ><div slot="headline">PATH</div></md-menu-item>
        <md-menu-item id="poly-H"><div slot="headline">POLYGON</div></md-menu-item>
        <md-menu-item id="elipse" ><div slot="headline">ELIPSE</div></md-menu-item>
        <md-menu-item id="biarc" ><div slot="headline">BIARC</div></md-menu-item>
    </md-menu>
    <md-filled-button id="transform-menu-anchor">TRANSFORM</md-filled-button>
    <md-menu has-overflow positioning="popover" id="transform-menu" anchor="transform-menu-anchor">
        <md-menu-item id="cut"><div slot="headline">CUT</div></md-menu-item>        
        <md-menu-item id="link"><div slot="headline">LINK</div></md-menu-item>        
        <md-menu-item id="translate"><div slot="headline">TRANSLATE</div></md-menu-item>    
        <md-menu-item id="origin"><div slot="headline" >SET ORIGIN</div></md-menu-item>
        <md-menu-item id="rotate"><div slot="headline" >ROTATE</div></md-menu-item>
        <md-menu-item id="scale"><div slot="headline">SCALE</div></md-menu-item>
        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">SYMMETRY</div></md-menu-item>
          <md-menu slot="menu" has-overflow positioning="popover" id="simmetry-menu">
            <md-menu-item id="symmetry-X"><div slot="headline">SIM-X</div></md-menu-item>
            <md-menu-item id="symmetry-Y"><div slot="headline">SIM-Y</div></md-menu-item>
            <md-menu-item id="symmetry-L"><div slot="headline">SIM-L</div></md-menu-item>
          </md-menu>
        </md-sub-menu>
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

//Esto aparecería en los comandos de transform por ejemplo
//Aprovecho y pongo aquí el width de selección, por ejemplo
const templateSelectInputData =`
<div>
    <md-filled-text-field id="data-penWidth" all" label="Select Tolerance" type="number" value="1" max="5" min="0.5" step="0.5"></md-filled-text-field>
    <div id="menu-select">
        <md-filled-button class="submenu _25" id="select-sel">SEL</md-filled-button>
        <md-filled-button class="submenu _25" id="select-all">ALL</md-filled-button>
        <md-filled-button class="submenu _25" id="select-invert">INV</md-filled-button>
        <md-filled-button class="submenu _25" id="select-del">CUT</md-filled-button>
        <md-filled-button class="submenu _25" id="select-copy">COPY</md-filled-button>
        <md-filled-button class="submenu _25" id="select-paste">PASTE</md-filled-button>
    </div>
</div>
`
const templateLayers = `
<div id=show-layers>
LAYERS <md-filled-button id="layer-add">ADD</md-filled-button><md-switch slot="end" selected id="layer-show"></md-switch>
</div>
`
const templateKeys = `
<div >
    <md-filled-button id="Enter">ENTER</md-filled-button>
    <md-filled-button id="Escape">ESCAPE</md-filled-button>
    <md-filled-button id="Delete">DELETE</md-filled-button>
</div>
`
const templateUndo = `
<div id='undo-redo'>
    <md-filled-button id="undo">UNDO</md-filled-button>
    <md-filled-button id="redo">REDO</md-filled-button>
</div>
`
const template = `
  <div id="full-screen" tabindex='1' class='column'>
    <div id="main-menu" class="row">${templateMainMenu}</div>
    <!--div  id="hidden-row" class="row" >
        <cy-file-loader id="cy-hidden-file"></cy-file-loader>
    </div-->
    <div id="left" class="column" >
    <cy-layer-list id="layer-view"></cy-layer-list>
    ${templateUndo}
    ${templateSelectInputData}
    <div>
      </md-filled-text-field><md-filled-text-field label="Link Tolerance" class="half" type="number" value="0.1" max="5" min="0.01" step="0.1"></md-filled-text-field>
        </div>   
    <cy-input-data id='manual-data'></cy-input-data>
    </div>
    <cy-canvas-viewer id="viewer" tabindex="0"></cy-canvas-viewer>
</div>
  `
const style = `
<style>
.row{
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0;
  border: none;
  padding: 0;
  justify-content: flex-start;
}
.column{
  display: flex;
  flex-direction: column;
  margin: 0;
  border: none;
  padding: 0;
  justify-content: flex-start;
}

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
.half{
  width:50%;
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



class cyCad1830App extends HTMLElement {

  constructor() {
      super();

      this.dom = this.attachShadow({ mode: 'open' });
      this.dom.innerHTML = template + style;
    }



  connectedCallback(){
    this.viewer = this.dom.querySelector("#viewer");
    this.manager =  createCommandManager( this.viewer.layerDraw, this ); // 

    //--------------MENUS
    const menus = ['file', 'zoom', /*'select',*/ 'draw', 'support', 'transform', 'settings' ]
    menus.forEach(m => this[m+'MenuEl'] = this.dom.querySelector(`#${m}-menu`));
    menus.forEach(m => {
        const el = this.dom.querySelector(`#${m}-menu-anchor`);
        el.addEventListener('click',  ()=> this[`${m}MenuEl`].open = !this[`${m}MenuEl`].open);
    })

    menus.forEach(m => this[`${m}MenuEl`].addEventListener('close-menu', (e) => this.handleMenus(e)));

    //Almacenamiento de los datos manuales entre entradas y salidas de menus.
  //Pongo defaults (podrían ser de un JSON, TODO)
  //Uso la nomenclatura de variables de los componentes
    this.dataStore  = {
      geometry:{
        circle:{
          "data-r" : 10
        },
        poly:{
          "data-edges" : 4,
          "data-subType" : 'R'
        },
        segment:{
          "data-d": 500,
          "data-a": 30
        },
        arc:{
          "data-r" : 100,
          "data-a" : 45
        },
        symmetry:{
          "data-a" : 45
        },
        rotate:{
          "data-a" : 45
        },
        scale:{
          "data-s" : 0.5
        }
      },
      layers:{
        "path-color" : "green",
        "path-width" : 2,
        "selected-color" : "yellow",
        "selected-width" : "2"
      }
    }

    //-------------------INPUT DATA
    //Interactividad entre parte izquierda, datos manuales y ratón.
    this.mData = this.dom.querySelector('#manual-data');
    this.viewer.addEventListener('pos',(e)=>this.mData.update(e.detail));
    this.mData.addEventListener('input-data', (e) =>
        this.drawingApp.updateData(e.detail));
    this.mData.addEventListener('input-click', (e) => {
          this.drawingApp.updateData(e.detail);
        });
    

//-----------------LOAD, FILE
    // this.dom.querySelector('#cy-hidden-file').addEventListener('file-loaded', (evt)=>{
    //     //evt.detail.file;
    //     evt.detail.data.geometry.layers.forEach((ly,ix)=>{
    //         const newLayer = this.viewer.layerDraw.addLayer(evt.detail.name.split('.')[0] +'_'+ ix);
    //         newLayer.addBlocks(ly.paths)
    //     });
    //     this.viewer.fit(); //se podría hacer solo con las visibles o así...
    //     //this.viewer.redraw();
    // });
   
   
//    this.dom.addEventListener('keyup',this.handleKeys,true);

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
        commandLayerDelete(e.layerId);    //de momento es siempre undefined por el modo de trabajo
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
//--------------------- ORIGIN  --------------------------------
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
        //this.canvasHandler.view("fgPane", {x:dx, y:dy});  //rehace los cálculos del handler
        //this.layerDraw.setOrigin( -dx, -dy);
        //this._redrawLayers();
    });


       
//--------------------- TRANSFORMACIONES   ------------------------  
  this.addEventListener('geometry-transform',  (evt)=>{
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
      const cmd = evt.target.id.split('-')[1];
      switch(cmd){
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
        case 'sel'    : {
                          this.drawingApp = new DrawSelection(this.viewer.layerDraw, '');
                          this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
                            this.mData.setAttribute('type','select');
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

//-----------------CREAR CAPAS INICIALES
    //Estas capas las generamos de oficio
    //Los tratamientos son aditivos y los atributos ascii
    customElements.whenDefined('cy-layer-list').then(() => {
      this.layerView.addLayer( JSON.stringify(this.viewer.axesLayer)); //Estas tienen gestión interna especial
      this.layerView.addLayer( JSON.stringify(this.viewer.gridLayer)); //Estas tienen gestión interna especial
      

      //Al crearla se debe poner activa ella sola.
      const layerData = commandLayerCreate()
    });   

    }
    /**para poder llamarla desde la gestión de comandos desde donde solo queremos acceso al modelo y la app (esta) */
    translateOrigin = (dx, dy) => {
      this.viewer.canvasHandler.view("fgPane", {x:dx, y:dy});  //rehace los cálculos del handler
    }
    // handleKeys = (e)=>{
    // if((e.key === 'Escape') || (e.key === 'Delete') || (e.key === 'Enter')){
    //   this.viewer.interactiveDrawing.doKeyAction(e.key);
    //   e.stopPropagation();
    // }

    handleMenus = (e) => {
      //Nos ponemos una nomenclatura razonable para poner orden en los ids
      //menu, submenu, etc... separados por guiones
      const action = e.detail.initiator.id;
      const [main, sub1, sub2] = action.split('-');
      console.log(main, sub1, sub2);
      switch(main){
        case 'file':{
          switch(sub1){
            case 'open': //this.dom.querySelector("#cy-hidden-file").click();break;
            {
              loadProject().then(file => {
                console.log(file.name);
                const type = file.name.split('.').pop();
                if(type === 'json'){
                  const data = JSON.parse(file.text );
                // Restaurar modelo
                  this.viewer.layerDraw.deserialize( data.model); //Falta restaurar historia
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
                    //this.viewer.layerDraw.addBlocks(undefined, ly.paths);
                    //this.viewer.layerDraw.addBlocks(undefined, ly.circles);
                  })
                  this.viewer.fit();
                  this.viewer.layerDraw.draw();
                }
                //const lyId = this.viewer.layerDraw.getActiveLayerId();
                
              }
            )
            };break;
            case 'save': {
              switch(sub2){
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
                }  break;
                case 'iso':{
                  let data = this.viewer.layerDraw.getSelectedBlocks();
                  data = data.filter( b => b.type === 'path');
                  saveCNC(null, pathsToIso(data));
                }
                  break;
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
                }
                  break;
              }
            }
              break;
          }
        }
        case 'zoom':{
            this.viewer.clearCursors();
            this.viewer.canvasHandler.setZoomMode();               
            switch( sub1) {
                case 'fit': this.viewer.fit();break;
                case 'home': this.viewer.canvasHandler.view('fgZoomHome'); break;
                case 'setHome': this.viewer.canvasHandler.view('fgSetHome'); break;
                case 'in': this.viewer.canvasHandler.view('fgZoomIn'); break;
                case 'out': this.viewer.canvasHandler.view('fgZoomOut');break;
            }
            break;
        }
        case 'origin':{
            this.drawingApp = new DrawOrigin(this.viewer.layerDraw, sub1);
            this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
            this.mData.setAttribute('type','origin');
            }
            break;
        case 'symmetry':{
            this.drawingApp = new DrawSymmetry(this.viewer.layerDraw, sub1);
            this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
            this.mData.setAttribute('type','symmetry'+sub1);            //El attribute es lo que cambia el html !!
        }
        break;
        case 'cut':{
          const selectedBlocks = this.viewer.layerDraw.getSelectedBlocks();
          const cutPoints = findAllCuts(selectedBlocks);
          commandCreateCutPoints(cutPoints); //ye un comando con undo
        }
          break;
        /**
         * El link debe unir tanto tramos sueltos como paths.
         * Lo paso junto al setOrigin que se parecen mucho 
         */
        case 'link':{
          this.viewer.layerDraw.link();
        }
    
        break;

        case 'scale':{
            this.drawingApp = new DrawScale(this.viewer.layerDraw, sub1);
            this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
            this.mData.setAttribute('type','scale');
            this.drawingApp.updateData(this.dataStore.scale);
            this.mData.updateData(this.dataStore.scale) 
          }
          break;
        case 'translate': {
            this.drawingApp = new DrawTranslate(this.viewer.layerDraw, sub1);
            this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
            this.mData.setAttribute('type','translate');//El attribute es lo que cambia el html !!
            }
            break;
        case 'rotate':
            this.drawingApp = new DrawRotate(this.viewer.layerDraw, sub1);
            this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
            this.mData.setAttribute('type','rotate');
            this.drawingApp.updateData(this.dataStore.rotate);
            this.mData.updateData(this.dataStore.rotate)  //inicializo, debería ser un setting y luego memorizarse TODO              break;
            break;
        case 'draw':{
            switch( sub1) {
                case 'start':
                case 'stepBack':
                case 'end': break;
            }
            break;
        }
        //Los de support y transform los dejo en plano por no hacer más profundo el árbol
        case 'point':  break;
        case 'line' :{
            switch(sub1){
                case 'PP':
                case 'PXA':
                case 'PYA':
                case 'PDA': //En estos tres sobran cosas
                case 'YH':
                case 'XV':
                  this.drawingApp = new DrawSegment(this.viewer.layerDraw, sub1);
                  this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
                  //El attribute es lo que cambia el html !!
                  this.mData.setAttribute('type','segment'+sub1);

                  this.mData.updateData(this.dataStore.segment);
                  this.drawingApp.updateData(this.dataStore.segment);

                  // if((sub1 === 'PDA') || (sub1 === 'YH') || (sub1 === 'XV')){
                  //   this.mData.update({idn:['data-d'], pos:{x:this.dataStore.segment.d}});
                  //   this.viewer.interactiveDrawing.updateData({"data-d":this.dataStore.segment.d});
                  // } else {
                  //   this.mData.update({idn:['data-d'], pos:{x:undefined}});
                  //   this.viewer.interactiveDrawing.updateData({"data-d":undefined});
                  // }
                  break;
                case 'tang':
                case 'perp': break;

            }
        }
        break;
        case 'circle' :{
          this.keyActions = this.drawKeys;
          switch( sub1){
            case 'CR' :
            case '2PR': 
            case 'CP':
            case '3P': //this.viewer.interactiveDrawing.drawCircle(this.dataLayerBorrador, sub1);break;
              this.drawingApp = new DrawCircle(this.viewer.layerDraw, sub1);
              this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
              break;
              
          }
          this.mData.setAttribute('type','circle'+sub1);
          this.drawingApp.updateData(this.dataStore.circle);
          this.mData.updateData(this.dataStore.circle);
        }
        break;
        case 'arc' :{
            switch( sub1){
                case 'CPA':
                case '3P':
                case '2PR':
                case '2PC':
                  this.drawingApp = new DrawArc(this.viewer.layerDraw, sub1);
                  this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
                  break;
            }
          this.mData.setAttribute('type','arc'+sub1);
          this.drawingApp.updateData(this.dataStore.arc);
          this.mData.updateData(this.dataStore.arc);
        }
        break;
        case 'path':{
          this.drawingApp = new DrawPath(this.viewer.layerDraw, sub1);
          this.viewer.interactiveDrawing.setDrawingMode(this.drawingApp );
          this.mData.setAttribute('type','path');

          //this.mData.updateData(this.dataStore.path);
          //this.viewer.interactiveDrawing.updateData(this.dataStore.path);
        }
        break;
        case 'poly' :{ //quito el menú de tipo y lo pongo en el selector de input-data
          this.drawingApp = new DrawPolygon(this.viewer.layerDraw, sub1)
          this.viewer.interactiveDrawing.setDrawingMode( this.drawingApp);
          this.mData.setAttribute('type','poly'+sub1);
          this.drawingApp.updateData(this.dataStore.poly);
          this.mData.updateData(this.dataStore.poly)  //inicializo, debería ser un setting y luego memorizarse TODO
        }
        break;
        default:break;
      }
    } 
    // cursor = {
    //     setSelect: (r)=>
    //         {this.viewer.style.cursor = `url('data:image/svg+xml;utf8,<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="${2*r}" height="${2*r}"><circle cx="${r}" cy="${r}" r="${r}" stroke-width="1" style="stroke: black; fill: red;"/></svg>') ${r} ${r}, pointer`},
    //     removeSelect: () =>  this.viewer.style.cursor = "",
    //     clearAll: ()=>{
    //         this.cursor.removeSelect();
    //         ["drawCursor", "zoomInCursor", "paneClickCursor"].forEach(c => this.viewer.classList.remove(c));
    //         }
    //     }
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

