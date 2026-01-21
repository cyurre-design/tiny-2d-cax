import DrawBasic from './cy-draw-basic.js'
    
export class DrawOrigin extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'origin', mode);
        this.data = {subType:mode};    
        //Secuencias en función del tipo de dibujp
        this.moveFn = [[this.drawAxes, this.m0, this.sendDataBasic]];
        this.clickFn = [[this.setOrigin, this.deleteData]];
        //Y lo que se manda a input-data de posicines del cursor igual
        this.dataSent = [['x0','y0']];
        this.dataReceived = [['x0','y0']];
    }
    deleteData = () => {this.updateDataBasic(['x0','y0'])}
    updateData = (data)=>this.updateDataBasic(data);
    drawAxes = (pi) => {
        const ww = this.layerDraw.extents;
        const blocks = [{type:'segment', x0:ww.xi, y0:pi.y, x1:ww.xf, y1:pi.y},
                        {type:'segment', x0:pi.x, y0:ww.yi, x1:pi.x, y1:ww.yf}];
        this.hit = this.highLight(pi.x, pi.y, blocks);
    };
    setOrigin = (p)=>{this.layerDraw.dispatchEvent(
            new CustomEvent('set-origin', {bubbles: true, composed:true, detail:{ data:{x0:this.hit.x, y0:this.hit.y}}}));};
    }
