"use strict";

//La función fundamental de esta clase es escuchar los eventos de ratón y transformar las coordenadas de viewport a window
//es decir, se usan las transformadas inversas para saber en qué punto de las coordenadas de usuario estamos
//Y para usarlos implemente hay que inyectar las funciones de start, etc...
//La gestión de qué se hace con estos eventos queda en manos de la aplicación principal que instala las funciones
export let extents = {};
let scale = 1.0;
let dim ={width:100, height:100};

export function scaleMm2pixels(x) { return +x*scale; }
//los offsets en canvas son 0, siempre va de (0,0) a (width,height) pero dado la vuelta el y
export function position2pixels(p) { return({x: (p.x - extents.x)*scale, y:dim.height - (scale*(p.y - extents.y))}) };
export function scalePixels2mm(x) { return ( +x/scale); }
    //Supongo unidades canvas, no client, eso se lo resto directamente en el tratamiento del evento, si lo hay
export function pixels2position(p){ return({x: extents.x + p.x/scale, y: extents.y + (dim.height - p.y)/scale}); }   //signo y !!!

export default class CyCanvasHandler {
    constructor(canvas, yAxisDownwards=true) {
        if (canvas) {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
            this.yAxisDownwards = yAxisDownwards;
            dim.width = canvas.width;
            dim.height = canvas.height;
            this.client = this.canvas.getBoundingClientRect();

            //para pixels
            this.initialPoint = {x:0, y:0};
            this.finalPoint = {x:0, y:0};
            //para unidades usuario
            this.pi = {x:0, y:0};
            this.pf = {x:0, y:0};
            this.zoom = 1.0;
            this.initialExtents = Object.assign({},{x:0, y:0, w:dim.width, h:dim.height}); //copia
            //se vuelve a inicializar en setHome
            extents = Object.assign({}, {x: this.initialExtents.x, y: this.initialExtents.y, w: this.initialExtents.w, h: this.initialExtents.h}); //clone
            
            this.mouseTolerance = 5;     

            this.midPoint = { x: this.initialExtents.x + 0.5*this.initialExtents.w, y: this.initialExtents.y + 0.5*this.initialExtents.h };
            this.view('fgZoomHome');

            //matriz
            ["mousedown", "mousemove", "mouseup", "mouseleave", "dblclick", "contextmenu", "setOrigin", "wheel"].forEach(evt => {
                this.canvas.addEventListener(evt, this, false);
            });
        }
       
        this.application = {
            mouseMove: (pi, evt)=>{},
            leftClick: (pi, evt) => {
                if (this.z)
                    this.canvas.parentNode.removeChild(this.z);
            },
            leftDblclick: (pi, evt) => {},
            leftClickStart: (point) => {
                this.clrw = {w:dim.width, h:dim.height};
                this.z = document.createElement('canvas');
                this.z.setAttribute('width', dim.width);
                this.z.setAttribute('height', dim.height);
                this.z.setAttribute('id', 'zoom');
                this.z.setAttribute('style', 'position:absolute;top:0px;left:0px;pointer-events:none')
                this.canvas.parentNode.appendChild(this.z);
                this.zctx = this.z.getContext("2d");
                this.z.style.zIndex = 5;                    //como es zindex 5 no puedo quitar el alfa porque al birrar no se ve lo de debajo....
                this.zctx.strokeStyle = 'red';
                this.zctx.lineWidth = 2.0;

            },
            leftClickMove: (pi, pf) => {
                if (this.z) {
                    const w = Math.abs(this.finalPoint.x - this.initialPoint.x);
                    const h = Math.abs(this.finalPoint.y - this.initialPoint.y);
                    let p = {x: (this.initialPoint.x < this.finalPoint.x ? this.initialPoint.x : this.finalPoint.x),
                             y: (this.initialPoint.y < this.finalPoint.y ? this.initialPoint.y : this.finalPoint.y)};
                    this.zctx.clearRect(0, 0, this.clrw.w, this.clrw.h);
                    this.zctx.strokeRect(p.x, p.y, w, h);
                }
            },
            //Atención, aunque el rectángulo se vaya trabajando en coordenadas de pixeles por facilidad
            //el cálculo de zoom se hace con las coordenadas transformadas pi y pf
            leftClickUp: (pi, pf) => {
                if (this.z) {
                    let m = Object.assign({}, { x: (pi.x + pf.x) / 2, y: (pi.y + pf.y) / 2 });
                    let e = Object.assign({}, { w: Math.abs(pf.x - pi.x), h: Math.abs(pf.y - pi.y) });
                    this.view('fgZoomInDrag', m, e);
    
                    this.canvas.parentNode.removeChild(this.z);
                }
                this.z = undefined;
            },
            leftClickLeave: (pi, pf) => {
                if (this.z)
                    this.canvas.parentNode.removeChild(this.z);
                this.z = undefined;
            },
            rightClick: (pi, evt) => {
                this.canvas.offsetParent.classList.remove("paneClickCursor");
            },
            //El pane aquí es sutil, como cambio el transform continuamente, las coordenadas que recibo no son homogénea
            //Así que hay que trabajar en coordenadas de canvas....igual que el zoom, por otra parte
            rightClickStart: (pi) => {
                this.canvas.offsetParent.classList.add("paneClickCursor");
                this.pane = {x: this.initialPoint.x, y: this.initialPoint.y};
            },
            rightClickMove: (pi, pf) => {
                const delta = {x: this.finalPoint.x - this.pane.x, y: this.finalPoint.y - this.pane.y};
                this.view('fgPane',{x:delta.x / scale, y:-delta.y/scale}); //es incremental
                this.pane = {x: this.finalPoint.x , y: this.finalPoint.y};
            },
            rightClickUp: (pi, pf) => {
                this.canvas.offsetParent.classList.remove("paneClickCursor");
                const delta = {x: this.finalPoint.x - this.pane.x, y: this.finalPoint.y - this.pane.y};
                this.view('fgPane',{x:delta.x * scale, y:delta.y*scale}); //es incremental
            },
            rightClickLeave: () => { },
            wheelHandler: (evt) => {
                this.view(evt.deltaY > 0 ? 'fgZoomOut' : 'fgZoomIn');
            }
        };
        this.setZoomMode();
    }
    // _setScaleAndOffset(scale, ox, oy) {
    //     this.scale = scale;
    //     this.offX= ox;
    //     this.offY = oy;
    // }
    //No trato el eje hacia abajo, pending si hace falta

    app(application) {
        ['mouseMove', 'leftClick', 'leftDblclick', 'leftClickStart', 'leftClickMove', 'leftClickUp', 'leftClickLeave',
            'rightClick', 'rightClickStart', 'rightClickMove', 'rightClickUp', 'rightClickLeave', 'wheelHandler'].forEach(event => {
            if (application[event]) {
                this[event] = application[event];
            }
        });
    }

    // setExtents(x, y, w, h) {
    //     this.initialExtents = Object.assign({}, { x: x, y: y, w: w, h: h });

    //     this.initialExtents.w = this.initialExtents.w ? this.initialExtents.w : 0.0001; // Avoid 0 value in width
    //     this.initialExtents.h = this.initialExtents.h ? this.initialExtents.h : 0.0001; // Avoid 0 value in height

    //     this.view('fgSetHome');
    // }
    getInitialExtents() {
        return Object.assign({},this.initialExtents);
    }
    // setInitialExtents(extents) {

    //     this.initialExtents = extents;
    //     this.zoom = 1.0;
    // }
    //TODO exporto con xi, yi cuando lo lógico sería exporta x,y,w,h 
    getExtents=()=>{
        return Object.assign({}, {xi:extents.x, yi:extents.y, xf: extents.x + extents.w, yf: extents.y + extents.h});
    }
    getZoom() {
        return {zoom: this.zoom, midPoint: this.midPoint};
    }
    setZoom(config) {
        this.zoom = config.zoom;
        this.midPoint = config.midPoint;
    }
    setMouseTolerance(mouseTolerance) {
        this.mouseTolerance = mouseTolerance;
    }
    //código copiado
    handleEvent(evt) {
        let handler = evt.type;
        if (typeof this[handler] === "function") {
            evt.preventDefault(); //así no hay que hacerlo en cada una?
            return this[handler](evt);
        }
    }
    //Falta meter el return en las funciones handler
    //IMPORTANTE, devuelvo coordenadas de bitmap en los eventos de ratón, para los temas interactivos es mejor
    //pero hay que tenerlo en cuenta
    contextmenu(evt) {
        evt.preventDefault();
    } //redundante
    dblclick(evt) {
        this.leftDblclick(this.pi, evt);
    }
    //CANVAS. Mantenemos la transformación nosotros, hay que separar el tratamiento de recogida del evento
    //y la transformación de la pintada. Es decir, el offset de pantalla a mm viene afectado por left y top
    //pero a la hora de pintar, el canvas empieza en 0,0 , no en left,top
    mousedown(evt) {
        this.client = this.canvas.getBoundingClientRect();
        Object.assign(this.initialPoint, { x: evt.clientX - this.client.left, y: evt.clientY - this.client.top }); //pixels
        this.pi = pixels2position(this.initialPoint);
        //aquí llamamos a la función que nos hayan inyectado
        if (evt.which === 1) { //left button pressed
            this.leftClickStart(this.pi, evt);
        }
        else if (evt.which === 3) { //right button pressed
            this.rightClickStart(this.pi, evt);
        }
    }
    mousemove(evt) {
        Object.assign(this.finalPoint, { x: evt.clientX - this.client.left, y: evt.clientY - this.client.top }); //pixels
        this.pf = pixels2position(this.finalPoint);
        if (evt.which === 1) { //left button pressed
            this.leftClickMove(this.pi, this.pf);
        }
        else if (evt.which === 3) { //right button pressed
            this.rightClickMove(this.pi, this.pf);
        }
        else this.mouseMove(this.pf);
        this.canvas.dispatchEvent(new CustomEvent("fgMouseChanged", { detail: this.pf, bubbles: true, composed: true })); //bubbling
    }
    mouseup(evt) {
        Object.assign(this.finalPoint, { x: evt.clientX - this.client.left, y: evt.clientY - this.client.top }); //pixels
        this.pf = pixels2position(this.finalPoint);
        let isShortStroke = ((Math.abs(this.finalPoint.x - this.initialPoint.x) < this.mouseTolerance) && (Math.abs(this.finalPoint.y - this.initialPoint.y) < this.mouseTolerance));
        if (evt.which === 1) { //left button pressed
            //Miro si los dos puntos están cercanos y lo trato como click (habitualmente selección)
            //if (Math.abs(this.finalPoint.x - this.initialPoint.x) < 25 && Math.abs(this.finalPoint.y - this.initialPoint.y) < 25) {
            if(isShortStroke){
                this.leftClick(this.pi, evt); // es una manera de tener un click
            }
            else { //Aquí es un zoom o selección grande
                this.leftClickUp(this.pi, this.pf, evt);
            }
        }
        else if (evt.which === 3) {
            if(isShortStroke){
                this.rightClick(this.pi, evt); // es una manera de tener un click
            }
            else {
                this.rightClickUp(this.pi, this.pf);
            }
        }
    }
    mouseleave(evt) {
        Object.assign(this.finalPoint, { x: evt.clientX, y: evt.clientY }); //pixels
        this.pf = pixels2position(this.finalPoint);
        if (evt.which === 1) { //left button pressed
            this.leftClickLeave(this.pi, this.pf);
        }
        else if (evt.which === 3) {
            this.rightClickUp(this.pi, this.pf);
        }
    }
    wheel(evt) {
        this.wheelHandler(evt);
    }
    //El zoom es la relación entre InitialExtents y ActualExtents
    //InitialExtents solo se toca en el setHome y en el inicio 
    //Pane NO modifica el zoom pero sí el centro    
    view(cmd, m, e) {
        switch (cmd) { //teclas, el 0.9 es obviamente opcional
            case 'fgPane': //aquí me paso {dx,dy}
                [this.midPoint.x, this.midPoint.y] = [this.midPoint.x - m.x, this.midPoint.y - m.y];
                break;
            case 'fgZoomInDrag':           
                this.zoom = Math.max(e.w / this.initialExtents.w, e.h / this.initialExtents.h);
                [this.midPoint.x, this.midPoint.y] = [m.x, m.y];
                break;
            case 'fgZoomIn':
                this.zoom = this.zoom * 0.9;
                break; //No modifican el midpoint m
            case 'fgZoomOut':
                this.zoom = this.zoom / 0.9;
                break;
            case 'fgZoomHome':
                this.zoom = 1.0;
                this.midPoint.x = this.initialExtents.x + this.initialExtents.w / 2;
                this.midPoint.y = this.initialExtents.y + this.initialExtents.h / 2;
                break;
            case 'fgSetHome': //repito algún cálculo, pero queda más claro
                //this.midPoint = m;
                Object.assign(this.initialExtents , extents );
                this.zoom = 1.0;
                this.midPoint.x = this.initialExtents.x + this.initialExtents.w / 2;
                this.midPoint.y = this.initialExtents.y + this.initialExtents.h / 2;
                break;
            case 'O':
                let offset = m;
                this.midPoint.x -= offset.x;
                this.midPoint.y -= offset.y;
                this.initialExtents.x -= offset.x;
                this.initialExtents.y -= offset.y;
                extents = Object.assign({}, this.initialExtents); //clone
                break;
        }
            dim.width = this.canvas.width;  //porque se usa en las rutinas de conversión de pixel a mm, etc...
            dim.height = this.canvas.height;
            let ex = Object.assign({}, this.initialExtents); //clone
            let mp = this.midPoint;
            ex.w *= this.zoom;
            ex.h *= this.zoom;
            scale = Math.min(dim.width/ex.w, dim.height/ex.h);
            ex.w = dim.width / scale;
            ex.h = dim.height / scale;

            //Unico punto de poner el tamaño de window, esto modifica la matriz interior
            //Suponemos que initial Extents tiene el aspect ratio del canvas (se controla donde se escriba)
            //El punto medio se mantiene, se cambian los iniciales si hace falta
            //ex es el window, coordenadas world
            ex.x = mp.x - 0.5 * ex.w;
            ex.y = mp.y - 0.5 * ex.h;
 
            extents = {x: ex.x, y: ex.y, w: ex.w, h: ex.h};    //la ventana actual
            //el punto (0,0) del canvas equivale al punto (ex.x, ex.y+ex.h) del world
            //Evito usar el canvas ctx y devuelvo lo que hay que transformar.
            //TODO hacerlo aún más independiente
            //En realidad vale con un div, no hace falta un canvas
            //this.ctx.setTransform(scale, 0, 0, -scale, -scale * ex.x, dim.height + scale*ex.y);
            this.canvas.dispatchEvent(new CustomEvent('zoom_end', { bubbles: true, composed: true, scale:scale, dim:dim})); //redraw
    }
    setZoomMode = () => {
        this.app(this.application); //Instala los servicios
    }

}
