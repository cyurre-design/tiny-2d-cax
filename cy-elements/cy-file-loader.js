'use strict'
//Más adelante se pueden hacer instalables, de momento pongo los parsers incluidos aquí
//import * as dxfParser from '/parsers/fg-dxf-parser.js'
import  svgParser from '/parsers/cy-parser-svg.js'
import  {isoToGeometry} from '/parsers/cy-parser-iso-geometry.js'
import jsonParser from '/parsers/cy-parser-json.js'

class CyFileLoader extends HTMLElement {
    constructor(){
      super();
      this.dom = this.attachShadow({mode:'open'});
    }

    createStyle(){
        return `<style>
         input[type="file"] {
         display:none;
            /*visibility:hidden;*/
        }       
        </style>`
    }   
    createTemplate(){
        return`<input type="file" accept=''/>`;
    }

    //objeto extension1:parser1, ext2:parser2 ...
    setExtension(extensions){
        Object.entries(extensions).forEach(([k,v])=>{
            if(typeof(v) === 'function')
                this.extensions[k] = v;
        });
    }
    connectedCallback(){
        this.dom.innerHTML= this.createStyle() + this.createTemplate();
        this.addEventListener(`click`, (ev)=>
            this.dom.querySelector('input').click(ev));

        this.reader = new FileReader();
        this.extensions = {};   //filtros de los ficheros
        this.setExtension({svg: svgParser, nc:isoToGeometry, json: jsonParser});
        //Aquí se podría poner una ventanita con el porcentaje y tal
        //reader.onprogress = (evt)=>(console.log(evt.loaded / evt.total));
        this.reader.addEventListener('abort', this.reader.abort());
        this.reader.addEventListener('error', (evt)=>{
            switch(evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR: alert('File Not Found!');  break;
                case evt.target.error.NOT_READABLE_ERR: alert('File is not readable'); break;
                case evt.target.error.ABORT_ERR: break; // noop
                default: alert('An error occurred reading this file.');
            }                
        });
        this.reader.addEventListener('loadend', (evt)=>{
            console.log(evt.target.result.length);
            const app = this.extensions[this.fileext];
            const geo = app(evt.target.result);
            this.dispatchEvent(new CustomEvent('file-loaded', {detail:{name: this.filename, data: geo}}));
        });
        this.dom.querySelector('input').addEventListener('change', (evt)=>{
            //console.log(evt.target.files);
            let file = evt.target.files[0];
            this.filename = file.name.toLowerCase();
            this.fileext = this.filename.split('.').pop();
            //console.log(this.filename);
            if(this.extensions[this.fileext] === undefined){ 
                console.log('unsoported extension');
                return;
            }
            this.reader.readAsText(file);
          });
    }
    disconnectedCallback(){

    }
    static get observedAttributes(){
        return([]);
     }

    attributeChangedCallback(name, oldVal, newVal){
        switch(name){
        default:break;
        }
    }

}
//en verbose para aclararnos
customElements.define('cy-file-loader', CyFileLoader);
