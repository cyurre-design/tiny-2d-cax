"use strict";
import {scalePixels2mm, scaleMm2pixels, position2pixels, pixels2position} from './cy-canvas-handler.js';
import {CyCanvasLayer} from './cy-canvas-layer.js';


const divisions = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]; //desde 1 centésima a 500mm
/**
 * @todo poner todos los defaults en un json y gestionar en la carga 
 */
export default class CyCanvasLayerAxes extends CyCanvasLayer {
    constructor() {
        super('axes');
        this.axesLayer =  {
            id: 'AXES',
            name: 'axes',
            layerStyle: {
                pathColor: '#aaaaaa',
                pathWidth: 2,
                tickLength: 8,
                tickWidth: 2,
                tickColor: '#aaaa00',
                textColor: '#aaaa00',
            },
            visible: true,
            erasable: false
        };
        this.gridLayer = {
            id: 'GRID',
            name: 'grid',
            layerStyle: {
                pathColor: '#005500',
                pathWidth: 2,
            },
            visible: true,
            erasable: false
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.ctx.fillStyle = this.axesLayer.layerStyle.textColor;
        }

    setAxesStyle(layer ){
        const old = {layerStyle:{}};
        ['pathColor', 'pathWidth', 'tickColor', 'tickWidth'].forEach( prop => {
            old.layerStyle[prop] = this.axesLayer.layerStyle[prop];
            this.axesLayer.layerStyle[prop] = layer.layerStyle[prop];
        })
        return old;
    }
    //viene con los datos de un layer completo, cogemos lo que necesitamos
    setGridStyle(layer ){
        const old = {layerStyle:{}};
        ['pathColor', 'pathWidth'].forEach( prop => {
            old.layerStyle[prop] = this.gridLayer.layerStyle[prop];
            this.axesLayer.layerStyle[prop] = layer.layerStyle[prop];
        })
        return old;
    }
    drawAxis(x=0, y=0){
        const ww = this.extents; //por comodidad, window        
        const w = scalePixels2mm(this.axesLayer.layerStyle.pathWidth)
        const blocks = [
            {type:'segment', x0:ww.xi, y0:y, x1:ww.xf, y1:y},
            {type:'segment', x0:x, y0:ww.yi, x1:x, y1:ww.yf}
        ]
        this.drawBlocks(blocks, w, this.axesLayer.layerStyle.pathColor);        
    }
    _getScale(width){

        const nDivOpt = 10; //por ejemplo, óptimo de divisiones para cambiar de escala automáticamente
        //Me fijo en el horizontal porque es el más largo, se puede ajustar
        //Por construcción, están ordeandas de más divisiones a menos divisiones, cojo la primera que es menor
        const ndivs = divisions.map(d => (Math.round(width / d)));
        let ix = ndivs.findIndex(n => n <= nDivOpt);
        ix = Math.abs(ndivs[ix-1] - nDivOpt) >  Math.abs(ndivs[ix] - nDivOpt) ? ix : ix-1;
        return divisions[ix];
    }
    drawGrid(){
        const blocks = [];
        const ww = this.extents; //por comodidad, window        
        this.scale = this._getScale(ww.xf - ww.xi);
        for(let x = 0; x >= ww.xi; x -= this.scale)
            blocks.push({type:'segment', x0:x, y0:ww.yi, x1:x, y1:ww.yf});
        for(let x = 0; x <= ww.xf; x += this.scale)
            blocks.push({type:'segment', x0:x, y0:ww.yi, x1:x, y1:ww.yf});
        for(let y = 0; y >= ww.yi; y -= this.scale)
            blocks.push({type:'segment', x0:ww.xi, y0:y, x1:ww.xf, y1:y});
        for(let y = 0; y <= ww.yf; y += this.scale)
            blocks.push({type:'segment', x0:ww.xi, y0:y, x1:ww.xf, y1:y});
        const w = scalePixels2mm(this.gridLayer.layerStyle.pathWidth);
        this.ctx.setLineDash([0.1*this.scale, 0.1*this.scale ]);
        this.drawBlocks(blocks, w, this.gridLayer.layerStyle.pathColor);
        this.ctx.setLineDash([]);
    }
    drawTicks(){
        const blocks = [];
        const ww = this.extents; //por comodidad, window        
        let tl = scalePixels2mm(0.5*this.axesLayer.layerStyle.tickLength);
        let spacing = 0.1*this.scale;
        for(let x = 0; x >= ww.xi; x -= spacing)
            blocks.push({type:'segment', x0:x, y0:-tl, x1:x, y1:tl});
        for(let x = 0; x <= ww.xf; x += spacing)
            blocks.push({type:'segment', x0:x, y0:-tl, x1:x, y1:tl});
        for(let y = 0; y >= ww.yi; y -= spacing)
            blocks.push({type:'segment', x0:-tl, y0:y, x1:tl, y1:y});
        for(let y = 0; y <= ww.yf; y += spacing)
            blocks.push({type:'segment', x0:-tl, y0:y, x1:tl, y1:y});
        //Las largas
        tl = scalePixels2mm(1.5*this.axesLayer.layerStyle.tickLength);
        spacing = this.scale;
        for(let x = 0; x >= ww.xi; x -= spacing)
            blocks.push({type:'segment', x0:x, y0:-tl, x1:x, y1:tl});
        for(let x = 0; x <= ww.xf; x += spacing)
            blocks.push({type:'segment', x0:x, y0:-tl, x1:x, y1:tl});
        for(let y = 0; y >= ww.yi; y -= spacing)
            blocks.push({type:'segment', x0:-tl, y0:y, x1:tl, y1:y});
        for(let y = 0; y <= ww.yf; y += spacing)
            blocks.push({type:'segment', x0:-tl, y0:y, x1:tl, y1:y});
        const w = scalePixels2mm(this.axesLayer.layerStyle.tickWidth);
        this.drawBlocks(blocks, w, this.axesLayer.layerStyle.tickColor);
    }
    //de momento atado al eje
    drawScaleValues(){
        //let posY = (originY < this.viewer.height / 2) ? originY + 30 : originY - 20;
        const tr = this.ctx.getTransform();
        this.ctx.setTransform();
        const ww = this.extents; //por comodidad, window      
        const oy = 14, ox = 4;
        //this.ctx.font = "arial 20px monospace";
        //Si no pongo lo de serif o tal no funciona ??!!!
        //el font parece admitir solo un string literal???
        this.ctx.font = "12px monospace";

        for(let x = -this.scale; x >= ww.xi; x -= this.scale){
            const p = position2pixels({x:x, y:0});
            this.ctx.fillText( x, p.x, p.y+oy);
        }
        for(let x = this.scale; x <= ww.xf; x += this.scale){
            const p = position2pixels({x:x, y:0});
            this.ctx.fillText( x, p.x, p.y+oy);
        }
        for(let y = -this.scale; y >= ww.yi; y -= this.scale){
            const p = position2pixels({x:0, y:y});
            this.ctx.fillText( y, p.x+ox, p.y);
        }
        for(let y = this.scale; y <= ww.yf; y += this.scale){
            const p = position2pixels({x:0, y:y});
            this.ctx.fillText( y, p.x+ox, p.y);
        }
        this.ctx.setTransform(tr);
    }
    setAxesVisible(visible) {
        this.axesLayer.layerStyle.visible = visible ? true : false;
        this.draw();
    }
    setGridVisible(visible) {
        this.gridLayer.layerStyle.visible = visible ? true : false;
        this.draw();
    }

    draw() {
        this.clear();
        if (this.gridLayer.layerStyle.visible)
            this.drawGrid();
        if (this.axesLayer.layerStyle.visible){
            this.drawAxis();
            this.drawTicks();
            this.drawScaleValues();
        }
        this.dispatchEvent(new CustomEvent('scale-change', {bubbles: true, composed:true, detail:{scale:this.scale}}))
    }

}
customElements.define('cy-canvas-layer-axes', CyCanvasLayerAxes);