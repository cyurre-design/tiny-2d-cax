'use strict'
//Aquí solo se crean Paths, de tipo geometría

import { distancePointToPoint, geometryPrecision} from '../../../geometry/fg-geometry-basic-elements.js';
import { createDrawElement } from '../../geometry/fg-geometry-drawn-elements.js';

//La secuencia de creación de paths se delega a geom-lib-svg porque es la que pinta.
//Los elementos se crean mediante rutina de  la librería drawn-elements, básica y sin renderizado (segmentos y arcos y paths)
//La creación paso a paso de paths se hace por medio de mensajes.
//Solo quedan las llamadas a las rutinas stick2 en la "geometría" que en realidad es de geom-liv-svg
//Esto es más difícil de desacoplar porque la secuenciación está aquí y los puntos o elementos deben volver
//de momento lo mantenemos así, pero hay alternativas, por ejemplo importando la clase Geometry
//el problema es conceptual, no se trata de heredar sino de usar sus métodos y los elementos pertenecen a lib-geom-svg
//YURRE: Introducción de círculo, se supone que es siempre un primer punto, si no, es un arco
//Queda a cargo de la aplicación gestionar el resto del estado
export default class DrawElements {
    constructor(svgHandler, geometry, host) {
        this.svgHandler = svgHandler;
        this.geometry = geometry;
        this.host = host;
        this.z = undefined;
        this.selectTolerance = 1;
    }
    _initState() {
        this.p0 = {x:0,y:0};
        this.c0 = undefined;
        this.pi = undefined;
        this.state = 'empty';
        this.path = undefined; //Porque si no tenemos por ahí un path vacío danzando si no lo usamos
    } 
    _init() {
        this.leftClickStart = () => {};
        this.leftClickMove = () => {};
        this.leftClickUp = () => {};
        this.rightClick = () => {};
    }
    setAttribute(property, value) {
        this[property] = parseFloat(value);
    }
    getAttribute(property) {
        return this[property];
    }
    _angle(x,y) {
        let alfa = Math.atan2(y - this.c0.y, x - this.c0.x); //del centro al sitio que tocamos
        return (alfa > 0 ? alfa : 2 * Math.PI + alfa);
    }
    //Filosofía: Si estoy vacío y pincho en un círculo es que estoy en ese modo, lo mando y sigo en empty
    //Una vez que me meto en un perfil, solo pincho arcos, no círculos, si pincha un círculo que no forme 
    //parte del perfil no se hace caso o se saca un error, a elegir
    _pushElement(pi) { //gestiona el estado, coger 2 y resuelve el caso
        let p = this.geometry.stick2Point(pi, this.selectTolerance);
        if (p !== undefined) { //hemos pinchado en un punto existente
            switch(this.state) {
                case 'empty': //primer punto del perfil, almaceno
                    this.p0.x = p.x;
                    this.p0.y = p.y;
                    this.state = 'point';
                    this.host.firstElement(p);
                    break;
                case 'point': //pincho un segundo punto, así que es un segmento, y si es el punto inicial
                    if (this.p0.x !== p.x || this.p0.y !== p.y) {
                        let element = createDrawElement('segment', {x1: this.p0.x, y1: this.p0.y, x2: p.x, y2: p.y});
                        this.p0.x = p.x;
                        this.p0.y = p.y; //p0 es el nuevo comienzo de tramo
                        this.c0 = undefined;
                        this.host.addElement(element);
                    }
                    break;
                //Si paso los tres puntos, aunque está bien, pierdo algo de precisión en el centro...
                //Igual es mejor aquí ir al constructor de 3 ángulos...
                //Si el punto no pertenece al arco es un error
                case 'arc': //estaba en un círculo se supone y pincho otro punto, es el final del arco
                    //YURRE: ahora devuelve un array de elemnos apuntados, cojo el bueno.. si hay
                    let els = this.geometry.stick2Element(pi, this.selectTolerance).filter(el => (el.type === 'circle' && el.x === this.c0.x && el.y === this.c0.y));
                    if (els.length !== 1) break;
                    //si llegamos aquí es que hemos pinchado EL circulo que estába,os, pero solo necesitamos el punto, lo otro solo comprueba
                    if (this.c0 !== undefined) {
                        this.host.circleSelected(this.c0);
                        let a2 = this._angle(this.pi.x, this.pi.y); //del centro al sitio que tocamos
                        let a1 = this._angle(this.p0.x, this.p0.y);
                        let a3 = this._angle(p.x, p.y);
                        let element = createDrawElement('arc3Angles', {x: this.c0.x, y: this.c0.y, r: this.c0.r, a1: a1 , a2: a2 , a3: a3});
                        this.p0.x = p.x;
                        this.p0.y = p.y;
                        this.state = 'point'; //dejo preparado para el siguiente tramo
                        this.host.addElement(element);
                    }
                    break;
                default:
                    console.log('unknown state');
                    break;
            }
        } else { //hemos pinchado en un circulo (o así)
            let els = this.geometry.stick2Element(pi, this.selectTolerance).filter(el => el.type === 'circle'); //SOLO circulos
            if (els.length !== 1) return;
            p = els[0]; //es un círculo!!
            if (this.state === 'empty') {
                let element = createDrawElement('circle', {x: p.x, y: p.y, r: p.r});
                this.host.addCircle(element); //que le ponga la aplicación de abajo el selected si quiere
            } else { //El estado anterior debe ser necesariamente punto o arco, 
                if (this.state !== "arc") { //caso normal, compruebo que el punto anterior está a distancia r del centro
                    let radioFromInitPoint = distancePointToPoint(this.p0.x, this.p0.y, p.x, p.y);
                    if (Math.abs(radioFromInitPoint - p.r) < geometryPrecision) {
                        this.c0 = p;
                        this.pi = {x: pi.x, y: pi.y};
                        this.host.circleSelected(p);
                        this.state = 'arc';
                    } else {
                        this.svgHandler.svg.dispatchEvent(new CustomEvent("fgDrawCircleException", { bubbles: true, composed: true })); //bubbling
                    }
                }
            }
        }
    }
    _delArc() {
        if (this.state === 'arc') { //a medias de pintar un arco, solo borro eso
            this.state = 'point';
            return this.c0;
        }
    }
    _delLast(x, y) {
        this.p0.x = x;
        this.p0.y = y;
    }
    // //Rutina que instala el gestor de clicks e interacciona con el usuario que elige lo que va queriendo
    //Se arranca por botón y se termina por botón
    _initPath(){
        this._init();
        this._initState();
        
        this.leftClick = (p, evt) => {
            this._pushElement(p, evt);
        };

        this.setDrawingMode();
    }
    setDrawingMode() {
        this.svgHandler.app(this); //esto forma parte del control de estado
    }
}