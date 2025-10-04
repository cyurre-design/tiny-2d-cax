'use strict'
//13-03-2020: YURRE creación porque estas ayudas implican la existencia de un perfile previo, lo que es muy diferente de support
import { areClose } from '../../../geometry/fg-geometry-basic-elements.js';
import { createDrawElement } from '../../geometry/fg-geometry-drawn-elements.js';
import { modifyRndChf, insertRndChf, modifyTgIO } from '../../../geometry/fg-geometry-grouped-elements.js';

//TODO : La gestión de layers es un poco penosa en general porque no está decidido cómo gestionarlo.
//Es sencillo, pero si no se dejan al usuario quedarían en la clase base como defecto ('support')
//pero si se permite modificar, hay que tratarlas desde la creación de los elementos y se haría aquí, en la creación
export default class FgDrawGeoAids {
    constructor(svgHandler, geometry, layer = 'paths') {
        this.svg = svgHandler.svg;
        this.svgHandler = svgHandler;
        this.layer = layer;
        this.geometry = geometry;
        this.z = undefined;

        this.tangentialIORadius = 10;
        this.roundedRadius = 10;
        this.chamferLength = 10;
        this.selectTolerance = 1;
        this.snapTolerance = 1;
        this.edges = 4;
    }
    init() {
        this.leftClickStart = () => {};
        this.leftClickMove = () => {};
        this.leftClickUp = () => {};
        this.rightClick = () => {};
    }
    setLayer(layer) {
        this.layer = layer;
    }

    setAttribute(property, value) {
        this[property] = parseFloat(value);
    }
    getAttribute(property) {
        return this[property];
    }

    //YURRE: Tal como están definiendo los perfiles y el iso, no existe un punto de aproximación, sino un elemento que según el manual debe ser 
    //siempre una recta. la entrada se añade después de la recta en el caso de entrada y después en el de la salida.
    //Los redondeos, o bien pinchamos en el punto de corte o bien en el propio elemento si es para modificar el valor

    //Ahora mismo en la lista de elementos hay "puntos" para meter los comentarios, etc... pero al final la casuística es:
    //Si pincho en una "esquina" en realidad me viene un segment o un arc
    //Si ya existía, devuelve el que toca, es una modificación, es el caso fácil
    drawAid(type) {
        this.init();

        if (type === 'round' || type === 'chamfer') {
            this.leftClick = (pi, evt) => {
                let path = this.geometry.stick2Path(pi, this.selectTolerance);
                if (path.length) { //en un round que ya exista (o cambio un chamfer en round???) pruebo
                    path = path[0];

                    this.geometry.deselectAll();
                    this.geometry.removeTemporal();

                    let element = this.geometry.stick2PathElement(path, pi, this.selectTolerance);
                    if (element) {
                        let size = (type === 'chamfer') ? this.chamferLength : this.roundedRadius;
                        if (element.type === 'chamfer' || element.type === 'round') { //para saber qué arco necesito un punto intermedio, guardo el del usuario y luego calculo el ángulo
                            //esto devuelve true (OK) o false (hay que mirar los errores del path luego)
                            const error = modifyRndChf(path, element, size, type);
                        } else if (element.type === 'segment' || element.type === 'arc') { //creación e inserción
                            //hay dos posibilidades, mirar el elemento anterior o posterior, etc... pero hay que afinar que esté cerca del punto
                            //o mejor miramos los elementos cuyos extremos estén cerca del punto pinchado... tiramos por esta
                            //Y además, es posible que, en medio, ya haya un bloque de redondeo o chaflán, en ese caso no se inserta, se modifica
                            let els = path.elements.filter(el => (el.type === 'segment' || el.type === 'arc')); //la info adicional pasamos
                            let el1 = els.find(el => areClose(pi.x, pi.y, el.pf.x, el.pf.y,  this.selectTolerance)); //coge el primero que cumple
                            let el2 = els.find(el => areClose(pi.x, pi.y, el.pi.x, el.pi.y,  this.selectTolerance)); //si cumple, claro..., si no, -1

                            if (!el1 || !el2 ) return;

                            //le paso los elementos geométricos entre los que hay que insertarlo
                            const error = insertRndChf(path, el1, el2, size, type);
                        }
                        if (path.errors.length !== 0) {
                            this.svg.dispatchEvent(new CustomEvent("fgError", { detail: path.errors[0], bubbles: true, composed: true }));

                            path.errors = [];
                        }
                    }
                }

                this.geometry.redraw();
            };
        } else if (type === 'tangentialIO') {
            this.leftClick = (pi, evt) => {
                let path = this.geometry.stick2Path(pi, this.selectTolerance);
                if (path.length) {
                    path = path[0];

                    this.geometry.deselectAll();
                    this.geometry.removeTemporal();

                    let element = this.geometry.stick2PathElement(path, pi, this.selectTolerance);
                    if (element) {
                        if (element.type === 'tangentialEntry' || element.type === 'tangentialExit') {
                            //esto devuelve true (OK) o false (hay que mirar los errores del path luego)
                            modifyTgIO(path, element, this.tangentialIORadius, element.type);
                            //element.r = this.tangentRadius;
                            //Hay que recalcular los puntos de tangencia y esas cosas, lo hacemos a la brava...
                            //path.resolve();
                            if(path.errors.length !== 0) {
                                this.svg.dispatchEvent(new CustomEvent("fgError", { detail: path.errors[0], bubbles: true, composed: true }));
                            }
                        }
                    }
                }

                this.geometry.redraw();
            };
        }
        else return;
        this.setDrawingMode();
    }
    drawPolygon(targetLayer = this.layer) { //si no se le pasara dibujaría en la por defecto, esto a mirar
        this.init();
        this.leftClickStart = (pi, evt) => {
            this.rFactor = Math.cos(Math.PI / this.edges); //Para hacer los cálculos luego, relación R exterior e interior
            //Con esto decido cómo quiero que sea el polígono por defecto, mo vaya a ser que lo quiera con el vértice abajo en el futuro
            this.angles = [];
            const initial = [Math.PI / 2, Math.PI / 4, Math.PI / 10, 0, 3 * Math.PI / 14, Math.PI / 8];
            const delta = 2 * Math.PI / this.edges;
            for (let i = 0; i < this.edges; i++) this.angles.push(initial[this.edges - 3]);
            this.angles = this.angles.map((el, ix) => ({c: Math.cos(el + ix * delta), s: Math.sin(el + ix * delta)}));
    
            let p = this.geometry.stick2Point(pi, this.selectTolerance) || this.geometry.stick2Tol(pi, this.snapTolerance);
            this.x = p.x;
            this.y = p.y;
            this.z2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            this.z2.setAttribute('class', 'temporal');
            this.z2.setAttribute('cx', this.x);
            this.z2.setAttribute('cy', this.y);
            this.z2.setAttribute('r', 0); //si no, sale el anterior radio....
            
            this.z3 = this.z2.cloneNode(true);
            
            this.z = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            this.z.setAttribute('class', 'temporal');
            this.z.setAttribute('points', '');
            
            this.svg.appendChild(this.z);
            this.svg.appendChild(this.z2);
            this.svg.appendChild(this.z3);
        };
        this.leftClickMove = (pi, pf) => {
            if (this.z) {
                this.r = Math.sqrt(((pi.x - pf.x) * (pi.x - pf.x)) + ((pi.y - pf.y) * (pi.y - pf.y)));
                this.z2.setAttribute('r', this.r * this.rFactor);
                this.z2.setAttribute('vector-effect', "non-scaling-stroke");
                this.z3.setAttribute('r', this.r);
                this.z3.setAttribute('vector-effect', "non-scaling-stroke");
                this.z.setAttribute('points', `${this.angles.map(el => `${this.x + this.r * el.c}, ${this.y + this.r * el.s}`).join(' ')}`);
                this.z.setAttribute('vector-effect', "non-scaling-stroke");
            }
        };
        this.leftClickUp = (pi, pf) => {
            let p = this.geometry.stick2Point(pf, this.selectTolerance);
            //Aquí primamos el que el radio sea stick a que lo sea el punto final
            if (p === undefined) {    //si he pinchado en un punto está bien
                this.r = Math.sqrt((pf.x - this.x) * (pf.x - this.x) + (pf.y - this.y) * (pf.y - this.y));
                this.r = this.snapTolerance * Math.round(this.r / this.snapTolerance); //Yurre, esto igual preguntar
            } else {
                this.r = Math.sqrt((p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y));
            }

            this.geometry.deselectAll();
            this.geometry.removeTemporal();

            let layer = this.geometry.getLayer(targetLayer);
            layer.add(createDrawElement('polygon', {x: this.x, y: this.y, r: this.r, nedges: this.edges}));

            this.geometry.redraw();

            this.leftClickLeave();
        };
        this.leftClickLeave = (pi, pf) => { //un método común a todos de momento
            if (this.z)
                this.svg.removeChild(this.z);
            if (this.z2)
                this.svg.removeChild(this.z2);
            if (this.z3)
                this.svg.removeChild(this.z3);
            this.z = undefined;
            this.z2 = undefined;
            this.z3 = undefined;
        };
        this.leftClick = this.leftClickLeave;
        this.setDrawingMode();
    }

    setDrawingMode() {
        this.svgHandler.app(this);
    }
}