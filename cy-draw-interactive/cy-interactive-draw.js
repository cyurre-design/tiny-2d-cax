'use strict'

import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';
import { scalePixels2mm } from '../cy-canvas-layers/cy-canvas-handler.js';
import {blockTranslate, blockSymmetryX, blockSymmetryY, blockSymmetryL} from '../cy-geometry/cy-geometry-library.js';
//Para Canvas, separo el layer general , que es la de draw, de las capas de datos.
//La idea es NO gastar un canvas entero por capa ya que redibuja de todos modos
//el layer de clase es el general
//el layer iría a las funciones propiamente de dibujo.
//la función que dibuja ya sabe el modo, lo pongo en el evento new-block para que sea más autocontenidp
//Cambio el nombre de layer a layerdraft para que quede claro, excepto en select que es especial
export default class CyInteractiveDraw {
    constructor(canvasHandler, layerDraft) {
        this.mouseHandler = canvasHandler;
        //this.layer = layer;
        //this.mode = undefined;
        this.status = 0;     //Para reaccionar de manera diferente en primer elemento, segundo...

        this.selectTolerance = 1;
        this.snapTolerance = 1;
        //Hay que poner un modo default?!!! TODO
        this.layerDraft = layerDraft;   //esta la dejamos más o menos fija y la draw depende del comando
        this.init(layerDraft, undefined, undefined);
    }

    init() {
        // this.layerDraw = layerDraw;
        // this.mode = mode;
        // this.subMode = subMode;
        this.leftClick = ()=>{};
        this.leftClickStart = () => {};
        this.leftClickMove = () => {};
        this.leftClickUp = () => {};
        this.rightClick = () => {};
        this.handleKey = () => {};
        this.mouseMove = ()=>{};
        this.updateData = ()=>{};
        this.mouseOut = ()=>{};
        this.layerDraft.clear(); //Cada vez que cambia de modo borro por si acaso
    }
    quit = ()=>{
        this.layerDraft.clear(); //Cada vez que cambia de modo borro por si acaso
        this.mouseHandler.setZoomMode();
    }

    //De momento juntas, podrían ponerse en cada modo, una fon por cada....
 
    //Centralización de funciones básicas para gestión del dibujo
    //Al final las operaciones básicas son visualizar el punto, almacenar el punto, actualizar el status, importar data...
    //Y luego hay funciones que serán específicas, como el bloque y modo de dibujo, borrado, etc...
    p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    h  = (pi) => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    m0 = (pi) => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    m1 = (pi) => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    //Las funciones de dibujar para mejorar la interactividad (en draft) y obtener 
    //puntos o bloques cercanos son muy diferentes, la segunda sería solo en las capas activas
    //lo que se controla pasando draw en el layer cada vez o lo que haga falta
    
    //Esta función es conflictiva porque debe ser llamada desde la aplicación (drawSegment, drawCircle, etc...)
    //pero la aplicación se registra aquí, así que la pasaremos como callback (la herencia queda fatal...)
    // por otra parte es la única función que necesita layerDraw (para la base de datos de puntos o bloques
    // 
    highLight(x,y, blocks){
        //Mira tanto los puntos destacados como la rejilla, maomeno
        let w = scalePixels2mm( this.layerDraft.pathWidth);             //O selected??
        const point = this.application.getNearestPoint(x, y, 10*w);        //El 5 a settings TODO
        this.layerDraft.clear();
        if(blocks)
            this.layerDraft.drawBlocks(blocks, w, this.layerDraft.pathColor ); //es llamada desde aquí, pasarnos siempre array
        this.layerDraft.drawBlocks(point, w, this.layerDraft.pathColor );
        return( {x : point.x0, y : point.y0});
    }
    drawBlocks(point,blocks){
        let w = scalePixels2mm( this.layerDraft.pathWidth);             //O selected??
        this.layerDraft.clear();
        if(blocks)
            this.layerDraft.drawBlocks(blocks, w, this.layerDraft.pathColor ); //es llamada desde aquí, pasarnos siempre array
        this.layerDraft.drawBlocks(point, w, this.layerDraft.pathColor );
//        return( {x : point.x0, y : point.y0});

    }

    
    // drawSegment(layerDraw, mode) {
    //     //Casos posibles: PP, PXA, PYA, PDA, YH, YV (estos tres últimos se pueden juntar, mejor)
    //     //a y d vendrían de input-data directo en update
    //     this.init(layerDraw, 'segment', mode);
    //     this.data = {subType:mode};
    //     //hay cosas commo el submodo y el radio, etc... que no se deben borrar
    //     const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
    //     const newBlock = (p) => {
    //         this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'segment', data:this.data}}));};
    //     const draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, [createDrawElement('segment', this.data )])}
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
    //     const dataReceived = ['x0','x1','y0','y1','a','d'];
    //     deleteData();
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case 'PP':
    //         case 'PXA':
    //         case 'PYA': this.click = [[this.p0], [this.m1, newBlock, deleteData]]; break;
    //         case 'PDA': this.click = [[this.p0, newBlock, deleteData]]; break;
    //     }
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case 'PP':
    //         case 'PXA':
    //         case 'PYA': this.move = [[this.h], [this.m1, draw]]; break;
    //         case 'PDA': this.move = [[this.m0,draw]]; break;
    //     }

    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'segment', subType:this.subMode,
    //             idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }

    //     //Esta es la función de modificación o creación de un elemento, equivale a mouse move o click, según
    //     //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
    //     //Por no cambiar de kebab a camel y tal hago el split este
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(dataReceived.includes(idn))
    //                 this.data[idn] = data[k];
    //             });
    //     }

    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }

    //     this.setDrawingMode();
    // }
    // drawPath(layerDraw, mode) {
    //     //Casos posibles: PP, PXA, PYA, PDA, YH, YV (estos tres últimos se pueden juntar, mejor)
    //     //a y d vendrían de input-data directo en update
    //     this.init(layerDraw, 'path', mode);
    //     this.data = {subType:'PP'};
    //     this.thePath = createDrawElement('path', this.data )
        
    //     const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.thePath.elements = []; this.data.r = 0; this.status = 0;};
    //     const updateStatus = () =>{ //status puede  ir cambiando de 1 a 2 y viceversa...
    //         if(this.status !== 0){
    //             if(this.data.r !== 0) {this.status = 2; this.type = 'arc'; this.data.subType = '2PR'}
    //             else {this.status = 1; this.type = 'segment'; this.data.subType = 'PP'}
    //         }
    //     }
    //     //const p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    //     const changeLastSegment = (p) => {this.thePath.elements.pop(); this.thePath.elements.push(createDrawElement(this.type, this.data))}
    //     const newSegment = (p) => {this.thePath.elements.push(createDrawElement(this.type, this.data))}
    //     const draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, this.thePath)}
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],['data-x1','data-y1']];
    //     const dataReceived = ['x0','x1','y0','y1','r'];
    //     //Esto es especifico de path, se termina desde button o tecla, en el futuro
    //     this.end = ()=>{
    //         this.thePath.elements.pop(); //el tramo desde el último hasta donde hago click
    //         this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'path', data:this.thePath}}));
    //         deleteData();
    //     };
    //     this.back = ()=>{
    //         this.thePath.elements.pop(); //el tramo desde el último hasta donde hago click
    //         const last = this.thePath.elements.length-1;
    //         if(last < 0)
    //             deleteData();
    //         else{
    //             const el = this.thePath.elements[last]; //el tramo anterior
    //             this.data.x0 = el.x0; this.data.y0 = el.y0;
    //         }
    //     }
    //     this.del = () => {deleteData()}
    //     deleteData();
    //     //Secuencias en función del tipo de dibujp
    //     this.click = [[this.p0],[this.m1, changeLastSegment, this.p0, this.m1, newSegment],[this.m1, changeLastSegment, this.p0, this.m1, newSegment]];
    //     //Secuencias en función del tipo de dibujp
    //     this.move = [[this.h], [this.h, this.m1, changeLastSegment, draw], [this.h, this.m1, changeLastSegment, draw]];
    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         updateStatus();
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         updateStatus();
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'segment', subType:this.subMode,
    //             idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }

    //     //Esta es la función de modificación o creación de un circle a partir de inputs, equivale a mouse move o click, según
    //     //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
    //     //Por no cambiar de kebab a camel y tal hago el split este
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(dataReceived.includes(idn))
    //                 this.data[idn] = data[k];
    //             else if(['end','back','del'].includes(idn))
    //                 this[idn]();
    //                 console.log(idn);
    //             });
    //     }

    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }

    //     this.setDrawingMode();
    // }
    //Este ye complejo
    drawSelection(layerDraw, mode){
        this.init(layerDraw, 'select', mode);
        this.data = {subType:mode};
        const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
        //mientras mueve sin click, estado 0, miramos si pincha en bloque
        const hover = (pi) => {
            this.layerDraw.hover(pi.x, pi.y, undefined, false);
        };
        //Al hacer click pasa de hover a selected
        const select = (pi) => {
            const found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
            if(!found || found.length === 0)
                this.status = 1; //Comienzo un box porque he pinchado en zona libre
        }
        //Minetras hacemos el box se va poniendo hover de forma interactiva
        const draw = (pi) => {  
            this.layerDraft.clear();
            let w = scalePixels2mm( this.layerDraft.pathWidth);  
            const bbox = createDrawElement('bbox', this.data);
            this.layerDraft.drawBlocks(bbox, w, this.layerDraft.pathColor)
            this.layerDraw.hover(pi.x, pi.y, bbox, false);
        }
        //Y al dar click pasan de hover a selected ls que estén dentro del box
        const selectBlocks = (p) => {
            this.layerDraft.clear();
            const bbox = createDrawElement('bbox', this.data);
            this.layerDraw.hover(p.x, p.y, bbox, true);
        }

        //Y lo que se manda a input-data de posicines del cursor igual
        const dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
        deleteData();
        this.click = [[this.m0, select], [this.m1, selectBlocks, deleteData]];
        this.move = [[hover], [this.m1, draw]];
        this.leftClick = (pi, evt) => {
            this.click[this.status].forEach(f=>f(pi)); //secuencia de acciones
        };
        this.mouseMove = (pi) => {
            this.move[this.status].forEach(f => f(pi));
        };
        // this.leave = (pi, pf) => { //un método común a todos de momento
        //     layer.pop();
        // }
        this.updateData= (data)=>{
            Object.keys(data).forEach(k =>{
                const idn = k.split('-')[1];
                if(['x0','x1','y0','y1'].includes(idn))
                    this.data[idn] = data[k];
                });
        }
        this.setDrawingMode();
    }
    // drawCircle(layerDraw, mode) {
    //     this.init(layerDraw, 'circle', mode);
    //     this.data = {subType:mode};
    //     //hay cosas commo el submodo y el radio, etc... que no se deben borrar
    //     const deleteData = () => {['cx', 'cy', 'x0','x1','x2','y0','y1','y2'].forEach(k => delete this.data[k]); this.status = 0;};
    //     const p0 = (p) => {this.data.x0 = p.x; this.data.y0 = p.y; this.status = 1;};
    //     const p1 = (p) => {this.data.x1 = p.x; this.data.y1 = p.y; this.status = 2;};
    //     const p3 = (p) => {this.data.x2 = p.x;this.data.y2 = p.y;}
    //     //Mandamos el subType o mode para orientar al cretae
    //     const newBlock = (p) => {this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'circle', data:this.data}}));};
    //     //Estas son para el move. p0 y m0 se parecen, pero las move no cambian status, se pueden retocar, pero así están separadas
    //     const h = (pi) => {this.hit = this.highLight(pi.x, pi.y, undefined);};
    //     const m0 = (pi) => {this.data.x0 = pi.x, this.data.y0 = pi.y;};
    //     const m1 = (pi) => {this.data.x1 = pi.x, this.data.y1 = pi.y;};
    //     const m2 = (pi) => {this.data.x2 = pi.x, this.data.y2 = pi.y;};
    //     const draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, createDrawElement('circle', this.data ))}
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],['data-x1','data-y1']];

    //     deleteData();
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case '3P': this.click = [[p0], [p1], [p3, newBlock, deleteData]]; break;
    //         case 'CP': this.click = [[p0], [p1, newBlock, deleteData]]; break;
    //         case '2PR': this.click = [[p0], [p1, newBlock, deleteData]]; break;
    //         case 'CR': this.click = [[p0, newBlock, deleteData]]; break;
    //     }
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case '3P': this.move = [[h], [m1, draw], [m2, draw]]; break;
    //         case 'CP': this.move = [[h], [m1, draw]]; break;
    //         case '2PR': this.move = [[h], [m1,draw]]; break;
    //         case 'CR': this.move = [[m0, draw]]; break;
    //     }

    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'circle', subType:this.subMode,
    //             idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }
    //     //
    //     // this.mouseOut = ()=>{
    //     //     if(this.x0 === undefined) return; //no hay ni un punto
    //     //     if(this.x1 === undefined)
    //     //         this.hit = this.layer.highLight(this.x0, this.y0,undefined); //solo el punto
    //     //     this.hit = this.layer.highLight(this.x1, this.y1, createDrawElement('circle', {x0:this.x0, y0:this.y0, x1:this.x1, y1:this.y1, x2:this.x2 || this.x1 , y2:this.y2 || this.y1 , r:this.r, subType:this.subMode}));

    //     // }
    //     //Esta es la función de modificación o creación de un circle a partir de inputs, equivale a mouse move o click, según
    //     //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
    //     //Por no cambiar de kebab a camel y tal hago el split este
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(['x0','x1','x2','y0','y1','y2','r'].includes(idn))
    //                 this.data[idn] = +data[k];
    //             });
    //     }
    //     this.setDrawingMode();
    // }
    // drawArc(layerDraw, mode) {
    //     this.init(layerDraw, 'arc', mode);
    //     this.data = {subType:mode};
    //     //hay cosas commo el submodo y el radio, etc... que no se deben borrar
    //     const deleteData = () => {['x0','x1','xm','y0','y1','ym'].forEach(k => delete this.data[k]); this.status = 0;};
    //     const pm = (p) => {this.data.xm = p.x; this.data.ym = p.y; this.status = 2;};
    //     const newBlock = (p) => {
    //         this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'arc', data:this.data}}));};
    //     //Estas son para el move. p0 y m0 se parecen, pero las move no cambian status, se pueden retocar, pero así están separadas
    //     const mm = (pi) => {this.data.xm = pi.x, this.data.ym = pi.y;};
    //     //Atención al paso por valor y no referencia porque createdraw usa el objeyo para rellenar campos!!!
    //     const draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, createDrawElement('arc', Object.assign({},this.data) ))}
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0'],['data-xm','data-ym'],['data-x1','data-y1']];
    //     const dataReceived = ['x0','x1','x2','y0','y1','y2','r','a'];
    //     //TODO, FALTA 2PC
    //     deleteData();
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case '3P': this.click = [[this.p0], [pm], [this.m1, newBlock, deleteData]]; break;
    //         case 'CPA': this.click = [[this.p0], [this.m1, newBlock, deleteData]]; break;
    //         case '2PR': this.click = [[this.p0], [this.m1, newBlock, deleteData]]; break;
    //         case '2PC': this.click = [[this.p0], [pm],[this.m1, newBlock, deleteData]]; break;
    //     }
    //     //Secuencias en función del tipo de dibujp
    //     switch(this.subMode){
    //         case '3P': this.move = [[this.h], [mm, draw], [this.m1, draw]]; break;
    //         case 'CPA': this.move = [[this.h], [this.m1, draw]]; break;
    //         case '2PR': this.move = [[this.h], [this.m1,draw]]; break;
    //         case '2PC': this.move = [[this.h],[mm, draw], [this.m1, newBlock, draw]]; break;
    //     }

    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         console.log(this.status);
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         console.log(this.status);
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'arc', subType:this.subMode,
    //             idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }
    //     //
    //     // this.mouseOut = ()=>{
    //     //     if(this.x0 === undefined) return; //no hay ni un punto
    //     //     if(this.x1 === undefined)
    //     //         this.hit = this.layer.highLight(this.x0, this.y0,undefined); //solo el punto
    //     //     this.hit = this.layer.highLight(this.x1, this.y1, createDrawElement('circle', {x0:this.x0, y0:this.y0, x1:this.x1, y1:this.y1, x2:this.x2 || this.x1 , y2:this.y2 || this.y1 , r:this.r, subType:this.subMode}));

    //     // }
    //     //Esta es la función de modificación o creación de un circle a partir de inputs, equivale a mouse move o click, según
    //     //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
    //     //Por no cambiar de kebab a camel y tal hago el split este
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(dataReceived.includes(idn))
    //                 this.data[idn] = +data[k];  //atton que llegan ascii....
    //             });
    //     }
    //     this.setDrawingMode();
    // }
    // //el tipo y edges provienen del menu de input-data
    // drawPolygon(layerDraw) {
    //     this.init(layerDraw, 'polygon');
    //     this.data = {};
    //     //hay cosas commo el submodo y el radio, etc... que no se deben borrar
    //     const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
    //     const newBlock = (p) => {this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'polygon', data:this.data}}));};
    //     const draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, createDrawElement('polygon', this.data ))}
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
    //     const dataReceived = ['x0','x1','y0','y1','edges','subType'];
    //     deleteData();

    //     this.click = [[this.p0], [this.m1, newBlock, deleteData]];
    //     this.move = [[this.h], [this.m1, draw]];

    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, 
    //             detail:{pos:this.hit, type:'polygon', subType:this.subMode, idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }
    //     //Habría que chequear tipos numéricos y tal, formatos...
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(dataReceived.includes(idn))
    //                 this.data[idn] = data[k];
    //             });
    //         //this.mouseOut();
    //         //this.hit = this.layer.highLight(pi.x, pi.y, createDrawElement('circle', {x0:this.x0, y0:this.y0, x1:this.x1 || pi.x, y1:this.y1 || pi.y, x2:this.x2 || pi.x , y2: this.y2||pi.y , r:30, subType:this.subMode}));
    //     }

    //     this.setDrawingMode();
    // }

    // //Lo normal es que el layer sea de borrador
    // selectElements(layerDraw, elements){
    //     this.init(layerDraw, 'select-elements');
    //     this.data = elements;
    //     const deleteData = () => {/*['x0','y0'].forEach(k => delete this.data[k]);*/ this.status = 0;};
    //     //Aquí no hay selección por box, hay un solo elemento, en principio
    //     const p0 = (p) => {this.layerDraw.draftSelect(p.x, p.y, this.data)};
    //     const m0 = (pi) => {this.data = this.layerDraw.draftSelection(pi.x, pi.y)};
    //     //Y lo que se manda a input-data de posicines del cursor igual
    //     const dataSent = [['data-x0','data-y0']];
    //     deleteData();
    //     this.click = [[p0]];
    //     this.move = [[m0]];
    //     this.leftClick = (pi, evt) => {
    //         this.click[this.status].forEach(f=>f(pi)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         this.move[this.status].forEach(f => f(pi));
    //     };
    //     this.setDrawingMode();
    // }

    drawOrigin(layerDraw ) { 
        this.init(layerDraw, 'origin');
        this.data = {};

        const deleteData = () => {['x0','y0'].forEach(k => delete this.data[k]); this.status = 0;};
        const drawAxes = (pi) => {
            const ww = this.layerDraft.extents;
            const blocks = [{type:'segment', x0:ww.xi, y0:pi.y, x1:ww.xf, y1:pi.y},
                            {type:'segment', x0:pi.x, y0:ww.yi, x1:pi.x, y1:ww.yf}];
            this.hit = this.highLight(pi.x, pi.y, blocks);
        };
        const setOrigin = (p)=>{this.layerDraw.dispatchEvent(
            new CustomEvent('set-origin', {bubbles: true, composed:true, detail:{ data:{x0:this.hit.x, y0:this.hit.y}}}));};
        //Y lo que se manda a input-data de posicines del cursor igual
        const dataSent = [['data-x0','data-y0']];
        //Secuencias en función del tipo de dibujp
        this.click = [[setOrigin, deleteData]];
        //Secuencias en función del tipo de dibujp
        this.move = [[drawAxes]];

        this.leftClick = (pi, evt) => {
            let p = this.hit || pi;
            this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
        };
        this.mouseMove = (pi) => {
            this.move[this.status].forEach(f => f(pi));
            this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'origin', subType:this.subMode,
               idn:dataSent[this.status]}}));
        };
        // this.leave = (pi, pf) => { //un método común a todos de momento
        //     layer.pop();
        // }
        //Esta es la función de modificación o creación de un elemento a partir de inputs, equivale a mouse move o click, según
        //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
        //Por no cambiar de kebab a camel y tal hago el split este
        this.updateData= (data)=>{
            Object.keys(data).forEach(k =>{
                const idn = k.split('-')[1];
                if(['x0', 'y0'].includes(idn))
                    this.data[idn] = data[k];
                });
        }
        deleteData();
        this.setDrawingMode();
    }

/*     //El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
    drawTranslate(layerDraw) {
        this.init(layerDraw, 'move');
        this.data = {};
        //hay cosas commo el submodo y el radio, etc... que no se deben borrar
        const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
        const dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],[]];
        const dataReceived = ['x0','x1','y0','y1'];
        deleteData();
        const blocksToMove = this.layerDraw.getSelectedBlocks();
        const move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
            this.hit = this.highLight(pi.x, pi.y, blocksToMove.map(b => blockTranslate(b, pi.x-this.data.x0, pi.y-this.data.y0)));
        }
        const translate = (p)=>{
            this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
                {bubbles: true, composed:true, detail:{ command:'translate', data:{dx:this.hit.x-this.data.x0, dy:this.hit.y-this.data.y0}}}));
            //this.status = 0;    
        };
        //Insertar los bloques como copia con o sin borrado, sería un flag
        //const translate = (p) => {
            //this.layerDraw.translateSelected(this.hit.x-this.data.x0, this.hit.y-this.data.y0, true); //flag de copia o move
        //}
        this.click = [[this.p0], [this.m1 , translate, deleteData ]];
        this.move = [[this.h], [this.h, move], []];

        this.leftClick = (pi, evt) => {
            let p = this.hit || pi;
            this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
        };
        this.mouseMove = (pi) => {
            this.move[this.status].forEach(f => f(pi));
            this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, 
                detail:{pos:this.hit, type:'translate', subType:this.subMode, idn:dataSent[this.status]}}));
        };
        // this.leave = (pi, pf) => { //un método común a todos de momento
        //     layer.pop();
        // }
        //Habría que chequear tipos numéricos y tal, formatos...
        this.updateData= (data)=>{
            Object.keys(data).forEach(k =>{
                const [t,idn,action] = k.split('-');
                if(idn === 'translate'){
                   switch(action){
                        case 'enter': translate();this.status=0;move({x:this.data.x1 , y:this.data.y1});break;
                        case 'esc': this.status = 0;break;
                        //case 'int' : ; break;
                    }
                } else if(dataReceived.includes(idn))
                    this.data[idn] = data[k];
                    if((idn === 'x0') || (idn === 'y0')) this.p0({x:this.data.x0 , y:this.data.y0});
                    if((idn === 'x1') || (idn === 'y1')) move({x:this.data.x1 , y:this.data.y1});

                });
                //this.mouseMove();
        }

        this.setDrawingMode();
    } */
    //El rotate es como el translate, interactivo
    // drawRotate(layerDraw) {
    //     this.init(layerDraw, 'move');
    //     this.data = {};
    //     //hay cosas commo el submodo y el radio, etc... que no se deben borrar
    //     const deleteData = () => {['x0','x1','y0','y1'].forEach(k => delete this.data[k]); this.status = 0;};
    //     const dataSent = [['data-x0','data-y0'],['data-x1','data-y1'],[]];
    //     const dataReceived = ['x0','x1','y0','y1'];
    //     deleteData();
    //     const blocksToMove = this.layerDraw.getSelectedBlocks();
    //     const move = (pi)=>{ //hemos guardado x0,y0 originales en data en la rutina p0
    //         this.hit = this.highLight(pi.x, pi.y, blocksToMove.map(b => blockTranslate(b, pi.x-this.data.x0, pi.y-this.data.y0)));
    //     }
    //     const translate = (p)=>{
    //         this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform',
    //             {bubbles: true, composed:true, detail:{ command:'translate', data:{dx:this.hit.x-this.data.x0, dy:this.hit.y-this.data.y0}}}));
    //         //this.status = 0;    
    //     };
    //     //Insertar los bloques como copia con o sin borrado, sería un flag
    //     //const translate = (p) => {
    //         //this.layerDraw.translateSelected(this.hit.x-this.data.x0, this.hit.y-this.data.y0, true); //flag de copia o move
    //     //}
    //     this.click = [[this.p0], [this.m1 , translate, deleteData, this.quit ]];
    //     this.move = [[this.h], [this.h, move], []];

    //     this.leftClick = (pi, evt) => {
    //         let p = this.hit || pi;
    //         this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
    //     };
    //     this.mouseMove = (pi) => {
    //         this.move[this.status].forEach(f => f(pi));
    //         this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, 
    //             detail:{pos:this.hit, type:'translate', subType:this.subMode, idn:dataSent[this.status]}}));
    //     };
    //     // this.leave = (pi, pf) => { //un método común a todos de momento
    //     //     layer.pop();
    //     // }
    //     //Habría que chequear tipos numéricos y tal, formatos...
    //     this.updateData= (data)=>{
    //         Object.keys(data).forEach(k =>{
    //             const idn = k.split('-')[1];
    //             if(dataReceived.includes(idn))
    //                 this.data[idn] = data[k];
    //             });
    //         //this.mouseOut();
    //     }

    //     this.setDrawingMode();
    // }

    drawSymmetry(layerDraw, mode) {
        //Suponemos que previamente ha dibujado la recta o segmento, porque puede querer hacerla con puntos de corte

        this.init(layerDraw, 'symmetry');
        this.data = {};

        const deleteData = () => {['x0','y0'].forEach(k => delete this.data[k]); this.status = 0;};
        //simetría en X o Y, ayudamos pintando un eje
        const drawAxis = (pi) => {
            const ww = this.layerDraft.extents;
            let blocks;
            switch(mode){
                case 'X': blocks = [{type:'segment', x0:ww.xi, y0:pi.y, x1:ww.xf, y1:pi.y}];break;
                case 'Y': blocks = [{type:'segment', x0:pi.x, y0:ww.yi, x1:pi.x, y1:ww.yf}];break;
            } 
            this.hit = this.highLight(pi.x, pi.y, blocks);
        };
        //Caso de simetría general, mientras mueve sin click, estado 0, miramos si pincha en bloque
        const hover = (pi) => {   
            const found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
        };
        //Al hacer click pasa de hover a selected. Esta sirve para los tres tipos
        const symmetryL = (pi) => {
            const found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
            if(found && found.length>0){
                if(found[0].type==='segment'){
                    this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform', {bubbles: true, composed:true,
                                             detail:{ command:'symmetry', mode:mode, data:found[0]}}));};
                }
            }
        const symmetryXY = (pi) => { this.layerDraw.dispatchEvent(new CustomEvent('geometry-transform', {bubbles: true, composed:true,
                                             detail:{ command:'symmetry', mode:mode, data:{x0:this.hit.x, y0:this.hit.y}}}));};
        //Y lo que se manda a input-data de posicines del cursor igual (mando las dos aunque solo se pinta la que toca)
        const dataSent = [['data-x0','data-y0']];
        const dataReceived = mode === 'X' ? ['y0'] : mode === 'Y' ? ['x0'] : [];
        //Secuencias en función del tipo de dibujp
        if(mode === 'X' || mode === 'Y'){
            this.move = [[drawAxis]];
            this.click = [[symmetryXY]]
        } else {
            this.move = [[hover]];
            this.click = [[symmetryL]]
        }
        this.leftClick = (pi, evt) => {
            let p = /*this.hit ||*/  pi;            //ATTON. aquí no pinchamos punto, así que el highlight y hit no se actualizan
            this.click[this.status].forEach(f=>f(p)); //secuencia de acciones
        };
        this.mouseMove = (pi) => {
            this.move[this.status].forEach(f => f(pi));
            this.layerDraw.dispatchEvent(new CustomEvent('pos', {bubbles: true, composed:true, detail:{pos:this.hit, type:'origin', subType:this.subMode,
               idn:dataSent[this.status]}}));
        };
        // this.leave = (pi, pf) => { //un método común a todos de momento
        //     layer.pop();
        // }
        //Esta es la función de modificación o creación de un elemento a partir de inputs, equivale a mouse move o click, según
        //Generalizo y me paso el objeto completo porque vienen datos de 0 que estarían indefinidos si no...
        //Por no cambiar de kebab a camel y tal hago el split este
        this.updateData= (data)=>{
            Object.keys(data).forEach(k =>{
                const idn = k.split('-')[1];
                if(dataReceived.includes(idn))
                    this.data[idn] = +data[k];
                });
        }
        deleteData();
        this.setDrawingMode();        
    }

    setDrawingMode( drawingApplication) {
        this.init()
        this.application = drawingApplication; //Para importar la función getNearestPoint u otras que salgan
        this.application.draft = this;
        this.mouseHandler.app(drawingApplication);
    }
}
