//import "./cy-elements/cy-config-dialog.js"
//import "./cy-input-drawing-data.js"
//import "./cy-elements/cy-iso-text-editor.js";
//import "./cy-elements/cy-seven-segment.js";
import "./cy-elements/cy-file-loader.js"
import './cy-canvas-layers/cy-canvas-viewer.js';
import "./cy-layer-list.js"
import './cy-input-data.js';
import {findAllCuts} from './cy-geometry/cy-geometry-library.js'
//import {createDrawElement} from './cy-geometry/cy-geometry-basic-elements.js'
//import {test_arcsweep} from './cy-geometry/cy-geometry-basic-elements.js'
//import FgSvgGeometry from './cy-svg-geometry.js';
//import FgSvgHandler from '/scripts/fg/lib/graph/svg/fg-svg-handler.js';
//import DrawSupport from './draw-interactive/fg-draw-support.js';
//import GeometrySelection from './draw-interactive/fg-geom-select.js';
//import FgDrawProfile from './draw-interactive/fg-draw-profile.js';
//import findDrillPattern from './lib/fg-geometry/fg-find-drill-pattern.js';
//import FgDrawGeoAids from './draw-interactive/fg-draw-geo-aids.js';
//Los parsers
//import FgParserDxfGeometry from "./parsers/fg-parser-dxf-geometry.js";
//import * as iso from "./fg-parser-iso-geometry.js"; //retocada, no me gustaba la implementación
//import FgParserIsoGeometry from "./parsers/fg-parser-iso-geometry.js";
//import loadSvg from "./parsers/fg-parser-svg.js";
const templateMainMenu =`
  <div  id="hidden-row" >
    <cy-file-loader id="cy-hidden-file"></cy-file-loader>
  </div>
  <span >
    <md-filled-button id="file-menu-anchor">FILE</md-filled-button>
  <!-- Note the has-overflow attribute -->
    <md-menu has-overflow positioning="popover" id="file-menu" anchor="file-menu-anchor">
    <md-menu-item id="file-open"><div slot="headline">OPEN</div></md-menu-item>
        <md-menu-item id="file-save"><div slot="headline">SAVE</div></md-menu-item>
        <md-menu-item id="file-saveas"><div slot="headline">SAVEAS</div></md-menu-item>
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
        <md-menu-item id="select"><div slot="headline">SELECT</div></md-menu-item>        
        <md-menu-item id="translate"><div slot="headline">TRANSLATE</div></md-menu-item>    
        <md-menu-item id="origin"><div slot="headline" >SET ORIGIN</div></md-menu-item>
        <md-menu-item id="rotate"><div slot="headline" >ROTATE</div></md-menu-item>
        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">SYMMETRY</div></md-menu-item>
          <md-menu slot="menu" has-overflow positioning="popover" id="simmetry-menu">
            <md-menu-item id="symmetry-X"><div slot="headline">SIM-X</div></md-menu-item>
            <md-menu-item id="symmetry-Y"><div slot="headline">SIM-Y</div></md-menu-item>
            <md-menu-item id="symmetry-L"><div slot="headline">SIM-L</div></md-menu-item>
          </md-menu>
        </md-sub-menu>
        </md-menu-item>
        <md-menu-item>
        <md-sub-menu>
          <md-menu-item slot="item"><div slot="headline">SCALE</div></md-menu-item>
          <md-menu slot="menu" has-overflow positioning="popover" id="scale-menu">
            <md-outlined-text-field type="number" min="0" value=0></md-outlined-text-field>
            <md-menu-item ><div slot="headline">0.25</div></md-menu-item>
            <md-menu-item ><div slot="headline">0.33</div></md-menu-item>
            <md-menu-item ><div slot="headline">0.5</div></md-menu-item>
            <md-menu-item ><div slot="headline">0.75</div></md-menu-item>
            <md-menu-item ><div slot="headline">1.25</div></md-menu-item>
            <md-menu-item ><div slot="headline">1.33</div></md-menu-item>
            <md-menu-item ><div slot="headline">1.5</div></md-menu-item>
            <md-menu-item ><div slot="headline">2</div></md-menu-item>
          </md-menu>
        </md-sub-menu>        
    </md-menu>
</span>
`
//tools y settings fijos
//Aquí pueden crecer las capas por programa. como es una acción rara, lo hago bruteforce
const templateSingleLayer = (name) => {
  return `
  <md-list-item>
    ${name}<md-switch slot="end" selected id="view-layer-${name}"></md-switch>
  </md-list-item>
`
}
const templateLayers = `
<div id=show-layers>
    <md-list >
      ${templateSingleLayer('AXES')}
      ${templateSingleLayer('GRID')}
    </md-list >
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
    <div  id="hidden-row" class="row" >
        <cy-file-loader id="cy-hidden-file"></cy-file-loader>
    </div>
    <div id="left" class="column" >
    <cy-layer-list id="layer-view"></cy-layer-list>
    ${templateUndo}
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
        const menus = ['file', 'zoom', /*'select',*/ 'draw', 'support', 'transform' ]
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
          }
        }

//-------------------INPUT DATA
        //Interactividad entre parte izquierda, datos manuales y ratón.
        this.mData = this.dom.querySelector('#manual-data');
        this.viewer.addEventListener('pos',(e)=>this.mData.update(e.detail));
        this.mData.addEventListener('input-data', (e) =>
              this.viewer.interactiveDrawing.updateData(e.detail));
        this.mData.addEventListener('input-click', (e) => {
            const type = e.detail.split('-')[0]; //submenu, data
            if(type === 'data')
              this.viewer.interactiveDrawing.updateData(e.detail);
            else if(type === 'submenu')
              this.handleSubmenu(e.detail)
            });
        

//-----------------LOAD, FILE
        this.dom.querySelector('#cy-hidden-file').addEventListener('file-loaded', (evt)=>{
            //evt.detail.file;
            evt.detail.data.geometry.layers.forEach((ly,ix)=>{
                const newLayer = this.viewer.layerDraw.addLayeer(evt.detail.name.split('.')[0] +'_'+ ix);
                newLayer.addBlocks(ly.paths)
            });
            this.viewer.fit(); //se podría hacer solo con las visibles o así...
            //this.viewer.redraw();
        });
        this.dom.addEventListener('keyup',this.handleKeys,true);

//--------------Gestión de CAPAS, LAYERS
        //Aunque el evento va y viene, se pueden generar capas por proceso diferente al load
        //si se crea una capa, por ejemplo al leer un fichero, generamos su control de ver/etc..
        this.viewer.addEventListener('new-layer', (evt)=>{
          this.layerView.setAttribute('layer-name',evt.detail.name); //Estas dos tienen gestión interna especial
          console.log(evt.detail.name);
        });
        //Si en la lista de capas se desea ver/no ver, etc..., viene aquí
        this.layerView = this.dom.querySelector('#layer-view');
        this.layerView.addEventListener('layer-handle', (data)=>{
          const e = data.detail;
          if(e.action === 'visibility')
            this.viewer.setVisible(e.layer, e.value);
        })
//-----------------UNDO, REDO
        this.dom.querySelector('#undo-redo').addEventListener('click',(evt)=>
          this.viewer.layerDraw.commandManager(evt.target.id))
        //Estas capas las generamos de oficio
        //Los tratamientos son aditivos y los atributos ascii
        this.layerView.setAttribute('layer-name', 'axes'); //Estas tienen gestión interna especial
        this.layerView.setAttribute('layer-name', 'grid'); //Estas tienen gestión interna especial

        //Al crearla se debe poner activa ella sola
        this.dataLayer0 = this.viewer.layerDraw.addLayer('layer0'); //faltarían los estilos
    }
    handleKeys = (e)=>{
        if((e.key === 'Escape') || (e.key === 'Delete') || (e.key === 'Enter')){
          this.viewer.interactiveDrawing.doKeyAction(e.key);
          e.stopPropagation();
        }
    }
    //Por separar los posibles switches y que quede más claro
    //nos pasamos un string con submenu-tipo-subtipo
    handleSubmenu = (idn) => {
        const [_, main, sub1] = idn.split('-');
        console.log(main, sub1);
        switch(main){
          case 'select':{ //El mData principal se pone en el menú arriba
            switch(sub1){
              case 'invert': this.viewer.layerDraw.invertSelection(); break;
              case 'all':this.viewer.layerDraw.deselectAll(); break;
              case 'del':this.viewer.layerDraw.deleteSelection(); break;
              case 'cut':{
                  const selectedPaths = this.viewer.layerDraw.getSelectedBlocks();
                  //Hago las manipulaciones de propiedades en la rutina findAllCuts que es específica
                  let points = findAllCuts(selectedPaths);
                  if(points){
                    this.mData.setAttribute('type','cutPoints');
                    //el algoritmo puede devolver puntos de corte en las extensiones, se pueden filtrar aquí o interactivo
                    this.viewer.layerDraw.deselectAll();
                    this.viewer.layerDraw.addCutPointsToActiveLayer(points);
                    //this.viewer.interactiveDrawing.selectElements(this.viewer.layerDraw, points);
                  }
                }
                break;
            }
            break;
        }
        case 'translate':
          switch(sub1){
            case 'copy': break;
            case 'escape': break;
            case 'replace': break;
          }
        break;
      }
    }
    handleMenus = (e) => {
      //Nos ponemos una nomenclatura razonable para poner orden en los ids
      //menu, submenu, etc... separados por guiones
      const action = e.detail.initiator.id;
      const [main, sub1, sub2] = action.split('-');
      console.log(main, sub1, sub2);
      switch(main){
        case 'file':{
          switch(sub1){
            case 'open': this.dom.querySelector("#cy-hidden-file").click();break;
            case 'save': this.viewer.layerDraw.serialice();break;
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
        case 'select':{
            //Aunque haga otras cosas, pongo modo select, habrçia que cambiar cursor..?!
            //this.viewer.layerDraft.clear();
            this.viewer.interactiveDrawing.drawSelection(this.viewer.layerDraw);
            //El attribute es lo que cambia el html !!
            this.mData.setAttribute('type','select');
            }
            break;
        case 'origin':{
            this.viewer.interactiveDrawing.drawOrigin(this.viewer.layerDraw);
            //El attribute es lo que cambia el html !!
            this.mData.setAttribute('type','origin');
            }
            break;
        case 'symmetry':{
          this.viewer.interactiveDrawing.drawSymmetry(this.viewer.layerDraw, sub1);
          this.mData.setAttribute('type','symmetry'+sub1);            //El attribute es lo que cambia el html !!
            //if(sub1 === 'L')
            //  this.mData.updateData(this.dataStore.symmetry);
        }
        break;
        case 'scale':
        case 'translate': {
            this.viewer.interactiveDrawing.drawTranslate(this.viewer.layerDraw);
            //El attribute es lo que cambia el html !!
            this.mData.setAttribute('type','translate');
            }
            break;
        case 'rotate':
                this.mData.setAttribute('type','rotate');
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
                  this.viewer.interactiveDrawing.drawSegment(this.viewer.layerDraw, sub1); 
                  //El attribute es lo que cambia el html !!
                  this.mData.setAttribute('type','segment'+sub1);

                  this.mData.updateData(this.dataStore.segment);
                  this.viewer.interactiveDrawing.updateData(this.dataStore.segment);

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
              this.viewer.interactiveDrawing.drawCircle(this.viewer.layerDraw, sub1 );
              break;
              
          }
          this.mData.setAttribute('type','circle'+sub1);
          this.viewer.interactiveDrawing.updateData(this.dataStore.circle);
          this.mData.updateData(this.dataStore.circle);
        }
        break;
        case 'arc' :{
            switch( sub1){
                case 'CPA':
                case '3P':
                case '2PR':
                case '2PC':
                  this.viewer.interactiveDrawing.drawArc(this.viewer.layerDraw, sub1 );
                  break;
            }
          this.mData.setAttribute('type','arc'+sub1);
          this.viewer.interactiveDrawing.updateData(this.dataStore.arc);
          this.mData.updateData(this.dataStore.arc);
        }
        break;
        case 'path':{
          this.viewer.interactiveDrawing.drawPath(this.viewer.layerDraw);
          //El attribute es lo que cambia el html !!
          this.mData.setAttribute('type','path');

          //this.mData.updateData(this.dataStore.path);
          //this.viewer.interactiveDrawing.updateData(this.dataStore.path);
        }
        break;
        case 'poly' :{ //quito el menú de tipo y lo pongo en el selector de input-data
          this.viewer.interactiveDrawing.drawPolygon(this.viewer.layerDraw);
          this.mData.setAttribute('type','poly'+sub1);
          this.viewer.interactiveDrawing.updateData(this.dataStore.poly);
          this.mData.updateData(this.dataStore.poly)  //inicializo, debería ser un setting y luego memorizarse TODO
        }
        break;
        default:break;
      }
    } 

/* 
    handleClicks = (e)=>{
        let id = e.target.id;
        switch(id){
            case 'cy-sel-menu':
            case 'cy-zoom-menu':
            case 'cy-draw-menu':
            case 'cy-profile-menu': this.handleMenues(id); break;
            case 'cy-auto':
            case 'cy-edit': this.handleEditAuto(id);return;
            case 'cy-zoom-in':   this.viewer.canvasHandler.view('fgZoomIn'); return;
            case 'cy-zoom-out':  this.viewer.canvasHandler.view('fgZoomOut'); return;
            case 'cy-zoom-home': this.viewer.canvasHandler.view('fgZoomHome'); return;
            case 'cy-set-home':  this.viewer.canvasHandler.view('fgSetHome'); return;
            case 'cy-deselect-all':
                this.viewer.mode.select.deselectAll();
                return;
            case 'cy-invert-selection':
                this.viewer.mode.select.invertSelection();
                return;
            case 'cy-delete-selected':
                this.viewer.mode.select.removeSelected()
                return;
            case 'cy-support-point':            this.draw.drawPoint(); break;
            case 'cy-path':                     this.viewer.draw.path(); break;
            case 'cy-support-circle':           this.viewer.draw.circle(); break;
            case 'cy-support-arc':              this.viewer.draw.bulge(); break;
            case 'cy-support-tangent-line':     this.draw.drawCircleTangent(); break;
            case 'cy-transform-set-origin':     this.viewer.draw.origin(); break;
            case 'cy-measure':                  this.draw.drawDistance(); break;
            case 'cy-profile-entryPoint':       this.draw.drawEntryPoint(); break;
            case 'cy-profile-polygon':          this.viewer.draw.polygon(this.polygonEdges, this.polygonMode); break;
            case 'cy-profile-hole':             this.viewer.mode.drawCircleCircles();break;

            case 'cy-transform-translate':   this.viewer.mode.draw('translate'); break;
            case 'cy-transform-rotate':      this.viewer.mode.draw('rotate'); break;
            case 'cy-transform-scale':       this.viewer.mode.draw('scale'); break;
            case 'cy-transform-symmetry':    {
                this.geometry.removeTemporal();
                this.geometry.redraw();
                switch(id){
                    case 'cy-transform-translate':   this.draw.drawTranslate(); break;
                    case 'cy-transform-rotate':      this.draw.drawRotate(); break;
                    case 'cy-transform-scale':       this.draw.drawScale(); break;
                    case 'cy-transform-symmetry':    this.draw.drawSymmetry(); break;        
                }
            }
            break;
            case 'cy-load-file':                this.dom.querySelector("#cy-hidden-file").click();break;
            }
        }
 */

 /*    mode = {

        draw: (operation) => {
          let validOperation = true;
          switch (operation) {
            case "point":
            case "line":
            case "circle":
            case "entryPoint":
            case "lineTangent":
            case "circleTangent":
            case "origin":
            case "distance":
              this.draw[`draw${operation[0].toUpperCase()}${operation.substring(1)}`]();
              break;
            case "chamfer":
            case "round":
            case "tangentialIO":
              this.aids['drawAid'](operation);
             break;
            case "circleProfile":
              this.draw['drawCircle']("circles");
              break;
            case "polygon":
              this.aids['drawPolygon']("profile");
              break;
            case "translate":
            case "rotate":
            case "scale":
            case "symmetry":
              this.geometry.removeTemporal();
              this.geometry.redraw();
      
              this.draw[`draw${operation[0].toUpperCase()}${operation.substring(1)}`]();
              break;
            default:
              validOperation = false;
              console.log(`Unknown operation ${operation}`);
          }
  
          if (validOperation) {
            this.cursor.clearAll();
  
            if (operation === "distance") {
              this.setSelectCursor(this.selectRadius);
            } else {
              this.viewer.classList.add("drawCursor");
            }
          }
        },
        /**
         * Pone el edigor de geometría en modo selección
         * @param {('SEL'|'LINK'|'UNLINK')} mode
         *
        select: (mode) => {
          this.selectedMode = mode;
  
          this.cursor.clearAll();
          this.setSelectCursor(this.selectRadius);
  
          this.selector.setSelectMode(mode);
        },
        /**
         * Pone el edigor de geometría en modo zoom
         *
        zoom: () => {
          this.clearCursors();
          this.viewer.classList.add("zoomInCursor");
  
          this.viewer.svgHandler.setZoomMode();
        }
      }; */
 /*    select = {
        geometry: () => {
          let selectedGeometry = [];
          ["profile", "circles"].forEach(type => selectedGeometry.push(...this.select.geometryByLayerType(type)));
      
          return selectedGeometry;
        },
        elements: () => {
          let selectedProfileGeometries = this.select.geometryByLayerType("profile");
          selectedProfileGeometries = selectedProfileGeometries.reduce((acc, current) => {
            acc.push(...(current.elements) ? current.elements : [current]);
      
            return acc;
          }, []);
      
          let selectedCircleGeometries = this.select.geometryByLayerType("circles");
      
          return [...selectedProfileGeometries, ...selectedCircleGeometries];
        },
        geometryByLayerType: (type) => {
          let layers = this.geometry.getLayersByType(type);
      
          let selectedGeometry = [];
          layers.forEach(layer => {
            selectedGeometry.push(...layer.getSelected());
          });
      
          return selectedGeometry;
        }
      }
    cursor = {
        setSelect: (r)=>
            {this.viewer.style.cursor = `url('data:image/svg+xml;utf8,<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="${2*r}" height="${2*r}"><circle cx="${r}" cy="${r}" r="${r}" stroke-width="1" style="stroke: black; fill: red;"/></svg>') ${r} ${r}, pointer`},
        removeSelect: () =>  this.viewer.style.cursor = "",
        clearAll: ()=>{
            this.cursor.removeSelect();
            ["drawCursor", "zoomInCursor", "paneClickCursor"].forEach(c => this.viewer.classList.remove(c));
            }
        } */
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

