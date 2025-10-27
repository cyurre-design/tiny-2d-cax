import "./cy-elements/cy-file-loader.js"
import './cy-canvas-layers/cy-canvas-viewer.js';
import "./cy-layer-list.js"
import './cy-input-data.js';
import {findAllCuts} from './cy-geometry/cy-geometry-library.js'
import {createCommandManager, commandLayerCreate} from './cy-commands/cy-command-definitions.js';
import {createDrawElement} from './cy-geometry/cy-geometry-basic-elements.js';

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
        <md-menu-item id="cut"><div slot="headline">CUT</div></md-menu-item>        
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

//Esto aparecería en los comandos de transform por ejemplo
//Aprovecho y pongo aquí el width de selección, por ejemplo
const templateSelectInputData =`
<div>
    <md-filled-text-field id="data-penWidth" all" label="Select Tolerance" type="number" value="1" max="5" min="0.5" step="0.5"></md-filled-text-field>
    <div id="menu-select">
        <md-filled-button class="submenu _25" id="select-all">ALL</md-filled-button>
        <md-filled-button class="submenu _25" id="select-invert">INV</md-filled-button>
        <md-filled-button class="submenu _25" id="select-del">DEL</md-filled-button>
        <md-filled-button class="submenu _25" id="select-sel">SEL</md-filled-button-->
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
    <div  id="hidden-row" class="row" >
        <cy-file-loader id="cy-hidden-file"></cy-file-loader>
    </div>
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
    </style>
`



class cyCad1830App extends HTMLElement {

  constructor() {
      super();

      this.dom = this.attachShadow({ mode: 'open' });
      this.dom.innerHTML = template + style;
    }
//---------------------------------- COMANDOS LAYER ---------------------------
    /**
     * @method
     */

  // layerCreate = (name = undefined, data = undefined) => {
  //     const theCommand = makeCommand({
  //         execute(p, a) {
  //             this.id = p.addLayer(name || this.name);
  //             const layer = p.layers.get(this.id);
  //             this.name = layer.name;
  //             a.viewer._redrawLayers();
  //             a.layerView.addLayer(JSON.stringify(layer));
  //             return layer;
  //         },
  //         undo(p,a) {
  //             if (this.id) p.deleteLayer(this.id);
  //             a.layerView.deleteLayer(this.name);
  //         },
  //     });
  //     return this.manager.execute(theCommand);
  //     }      
  layerDelete = (id) => {
      const theCommand = this.manager.makeCommand({
          execute(p, a) {
              this.id = id;
              this.layer = p.layers.get(this.id);
              p.deleteLayer(this.id);
              a.viewer._redrawLayers();
              a.layerView.deleteLayer(this.id);
              //return layer;
          },
          undo(p,a) {
              if (this.layer) {
                p.addLayer(this.layer.name, this.layer.style);
                a.layerView.addLayer(JSON.stringify(this.layer));
              }
          },
      });
      return this.manager.executeCommand(theCommand);
      }      
  layerSetStyle = (layerId, data) => {
    const theCommand = this.manager.makeCommand({
        execute(p, a) {
            this.id = layerId;
            this.data = a.viewer.setStyle(this.id, data);
            a.viewer._redrawLayers();
            a.layerView.setStyle(this.id, data)
            return this.data;
        },
        undo(p,a) {
            if (this.id){
              a.viewer.setStyle(this.id, this.data);
              a.layerView.setStyle(this.id, this.data)
              a.viewer._redrawLayers();
            }
        }})
        return this.manager.executeCommand(theCommand);
      }
//--------------------------------- COMANDOS BLOCK  -----------------------------
  blockCreate = (blocks) => {
    const theCommand = this.manager.makeCommand({
      execute(p, a) {
          this.blocks = blocks;
          this.ids = p.addBlocks(undefined, this.blocks); //array...?
          p.draw();
      },
      undo(p, a) {
          if (this.ids) this.ids.forEach(id=>p.deleteBlock(id));
          p.draw();
      },
      });
    this.manager.executeCommand(theCommand);
  }
  blockDelete = (blocks) => {
    const theCommand = this.manager.makeCommand({
      execute(p, a) {
          this.blocks = blocks;
          this.blocks.forEach( b => p.deleteBlock(b.id))
          p.draw();
      },
      undo(p, a) {
          if (this.blocks) 
            p.addBlocks(undefined, this.blocks); //array...?
          p.draw();
      },
      });
    this.manager.executeCommand(theCommand);    
  }

  blockTransform = (blocks, op, data) => {
    const theCommand = this.manager.makeCommand({
    execute(p, a) {
        this.blocks = blocks;
        this.newBlocks = this.blocks.map( b => b[op]( ...data))
        p.addBlocks( undefined, this.newBlocks);
        p.draw();
    },
    undo(p, a) {
        if (this.newBlocks) 
          this.newBlocks.forEach(b=>p.deleteBlock(b.id));
        p.draw();
    }
    });
    this.manager.executeCommand(theCommand);    
    }
  getCutPoints = (cutPoints) => {
    const theCommand = this.manager.makeCommand({
    execute(p, a) {
      this.cutPoints = cutPoints;
      if(this.cutPoints){
        p.deselectAll();
        p.addCutPoints(this.cutPoints);
        p.draw();
      }
    },
    undo(p,a){
      p.deleteCutPoints(this.cutPoints);
      p.draw();
    }})
    this.manager.executeCommand(theCommand);    
  }


  connectedCallback(){
    this.viewer = this.dom.querySelector("#viewer");
    this.manager =  createCommandManager( this.viewer.layerDraw, this ); // 

    //--------------MENUS
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
        // else if(type === 'submenu')
        //   this.handleSubmenu(e.detail)
        });
    

//-----------------LOAD, FILE
    this.dom.querySelector('#cy-hidden-file').addEventListener('file-loaded', (evt)=>{
        //evt.detail.file;
        evt.detail.data.geometry.layers.forEach((ly,ix)=>{
            const newLayer = this.viewer.layerDraw.addLayer(evt.detail.name.split('.')[0] +'_'+ ix);
            newLayer.addBlocks(ly.paths)
        });
        this.viewer.fit(); //se podría hacer solo con las visibles o así...
        //this.viewer.redraw();
    });
    this.dom.addEventListener('keyup',this.handleKeys,true);

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
        this.layerDelete(e.layerId);    //de momento es siempre undefined por el modo de trabajo
      } else if(e.action === 'set-style')
        this.layerSetStyle(e.layerId, e.value);
    })
//--------------------- CREACION DE BLOQUES ------------------
  /**@listens new-block Aquí es donde se recibe la petición de insertar geometría
   * tras terminar la parte interactiva !!! */
  this.addEventListener('new-block', e=>{
      //this.layerDraft.clear();
      const blocks = createDrawElement(e.detail.type, e.detail.data);
      this.blockCreate(blocks);
  });

//--------------------- TRANSFORMACIONES   ------------------------  
  this.addEventListener('geometry-transform',  (evt)=>{
      let op = evt.detail.command, mode = evt.detail.mode || '', data = evt.detail.data;
      op += mode;
      let arg;
      switch(op){
        case 'symmetryX':  arg = [data.y0];  break;
        case 'symmetryY':  arg = [data.x0];  break;
        case 'symmetryL':  arg = [data];     break;
        case 'translate': 
        default:          arg = [data.dx, data.dy];     break;
      }
      const blocks = this.viewer.layerDraw.getSelectedBlocks();
      this.blockTransform(blocks, op, arg)
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
   * 
   */
    this.dom.querySelector('#menu-select').addEventListener('click',(evt)=>{
      const cmd = evt.target.id.split('-')[1];
      switch(cmd){
        case 'all'    : this.viewer.layerDraw.deselectAll(); break;
        case 'invert' : this.viewer.layerDraw.invertSelection(); break;
        case 'del'    : {
                          const blocks = this.viewer.layerDraw.getSelectedBlocks();
                          this.blockDelete(blocks);
                        }
              break;
        case 'sel'    : this.viewer.interactiveDrawing.drawSelection(this.viewer.layerDraw); break;
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
    
    handleKeys = (e)=>{
        if((e.key === 'Escape') || (e.key === 'Delete') || (e.key === 'Enter')){
          this.viewer.interactiveDrawing.doKeyAction(e.key);
          e.stopPropagation();
        }
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
        case 'cut':
          const selectedBlocks = this.viewer.layerDraw.getSelectedBlocks();
          const cutPoints = findAllCuts(selectedBlocks);
          this.getCutPoints(cutPoints); //ye un comando con undo
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

