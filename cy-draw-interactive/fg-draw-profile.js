'use strict'

import DrawElements from '../draw-interactive/fg-draw-elements.js';
import { createDrawElement } from '../geometry/fg-geometry-drawn-elements.js';
import GraphicDecorator from '../geometry/fg-graphic-decorator.js';

export default class FgDrawProfile{
    constructor(svgHandler, geometry){
        this.geometry = geometry;
        this.svg = geometry.svg;
        this.sketch = new DrawElements(svgHandler, this.geometry, this);
        this.layer = undefined;
    }
    setAttribute(name, value){
        switch(name){
            case 'selectTolerance':
                this.sketch.setAttribute(name, value);
                break;
            case 'markStart':
            case 'markEnd':
            case 'selected':
                this.layer.setAttribute(name,value);
                break;
        }
    }
    startProfile(){
        //YURRE: los creo en una capa nueva que luego destruiré al salir
        this.layer = this.geometry.createLayer('profile','drawing');
        this.layer.setAttribute('markStart', false);
        this.layer.setAttribute('markEnd', true);
        this.layer.add(createDrawElement('path', {elements: []}));
        this.layer.add(createDrawElement('path', {elements: []})); //elementos del path a dibujar
        this.layer.setAttribute('selected',true);
        this.sketch._initPath();
    }
    addCircle(element){
        this.geometry.deselectAll();

        let circleLayer = this.geometry.getLayer('circles');
        circleLayer.add(element);
        circleLayer.redraw();
        console.log('TODO: insertar circle');
    }
    circleSelected(p){
        p.temporal = !p.temporal;
        this.geometry.getLayer('support').redraw();
    }
    addElement(element){
        let path = this.layer.data[0];
        if(path.elements.length > 0){
          let last = path.elements[path.elements.length-1];
          if(last.type === element.type){ //si no son iguales, vale aunque empiecen y terminen a la vez
              if((last.pi.x === element.pf.x) && (last.pi.y === element.pf.y)){ 
              if(element.type === 'segment')
                return;  //el mismo segmento dado la vuelta, no vale, no continuamos
              if((element.type === 'arc') && (element.r === last.r) && (element.pm === last.pm))
                return; //mismo arco dado la vuelta
            } //Si es igual que el anterior pero dado la vuelta no hacemos nada
          } //y si no es el msmo lo guardamos
          this.layer.data[0].elements.push(GraphicDecorator.decorate(element));
        }
        else{ //primer elemento
          this.layer.data[0].elements = [GraphicDecorator.decorate(element)]; //esto borra el firstPoint, pero lo habíamos guardado
          this.layer.data[1].elements = [];  //el dato está guardado en firstPoint
        }
        this.layer.redraw(this.layer.data);  
    }
    //Aquí todavía no ha metido nada, es un punto auxiliar y solo tiene sentido de forma provisional, porque cuando ya hay un elemento esto no hace falta
    firstElement(point){
        // Para dibujar una flecha en un punto
        this.layer.data[1].elements = [GraphicDecorator.decorate(createDrawElement('segment', {x1: point.x, y1: point.y, x2: point.x, y2: point.y}))];
        this.layer.redraw(this.layer.data);
        this.firstPoint = point; //Yurre, para mantenerlo cuando se vaya borrando
    }
    popElement(){
        if(!this.layer) return;
        let p = this.sketch._delArc();
        if(p !== undefined) //"medio" elemento
        {
            this.circleSelected(p);
            return;   //si estaba a medias deshago solo el estado, si no, borro el elemento
        }
        if(this.layer.data[0].elements.length > 0){
            let element = this.layer.data[0].elements.pop();
            this.sketch._delLast(element.pi.x, element.pi.y);
            if(this.layer.data[0].elements.length === 0){ //si era el último, miro el firstPoint, que debería haber siempre en este caso
                if(this.firstPoint) //debe existir el punto inicial, lo recupero
                    this.layer.data[1].elements = [GraphicDecorator.decorate(createDrawElement('segment', {x1: this.firstPoint.x, y1: this.firstPoint.y, x2: this.firstPoint.x, y2: this.firstPoint.y}))];
            }
        }
        else{ //ya estaban borrados
            if(this.layer.data[1].elements.length > 0){  //borro flecha y todo.. TODO, ¿Hay que borrar e
                this.layer.data[1].elements = [];
                this.sketch._initPath();
                this.firstPoint = undefined;
            }
        }
        //YURRE: se podría repintar solo lo que se ha metido
        this.layer.redraw(this.layer.data);
    }
    endProfile(){
        //ESTO ESTA A PELO Y HAY QUE HACERLO VIA MENSASJE O SIMILAR
        //YURRE: Debo evitar hacer nada si no estaba dibujando antes..
        if(!this.layer) return;

        if (this.layer.data[0]) {
            this.geometry.layers.profile.add(this.layer.data[0]);
        }

        this.geometry.deleteLayer('drawing');
        this.layer = undefined;
        this.geometry.redraw(); //Hemos echado cosas a otras capas
    }
}