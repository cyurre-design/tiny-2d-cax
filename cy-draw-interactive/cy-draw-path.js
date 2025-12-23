import DrawBasic from './cy-draw-basic.js'
import { createDrawElement } from '../cy-geometry/cy-geometry-basic-elements.js';

export default class DrawPath extends DrawBasic{
    constructor(layerDraw, mode) {
        super(layerDraw, 'path', mode);
        this.data = {subType:'PP'};
        this.thePath = createDrawElement('path', this.data ); 
        //Secuencias en función del tipo de dibujp, el click es sutil
        //El move es más sencillo, el pop seguido del new modifica el último tramo del path, que es lo que estamos dibujando
        this.moveFn = [[this.h, this.m0, this.sendDataBasic], [this.h, this.m1, , this.sendDataBasic, this.pop, this.newSegment, this.draw]];   
        // 1.en m1 guardamos la nueva cota, 
        // 2.en pop, seguido de new segment, actualizamos el último segmento visto
        // 3.con p0 y m1 y newSegment ponemos el nuevo segmento que va a moverse (que empezará con longitud 0 porque p0 y m1 reciben el mismo punto)
        this.clickFn = [[this.p0],[this.m1, this.pop, this.newSegment , this.p0, this.m1, this.newSegment]];
        this.senData = [['x0','y0'],['x1','y1']];
        this.receiveData = ['x0','y0','x1','y1'];
    }

    pop = () => this.thePath.elements.pop();
    newSegment = (p) => {this.thePath.elements.push(createDrawElement('segment', this.data))}
    draw = (pi) => {this.hit = this.highLight(pi.x, pi.y, this.thePath)}
    //Y lo que se manda a input-data de posicines del cursor igual
    //dataSent = [['data-x0','data-y0'],['data-x1','data-y1']];
    
    //Esto es especifico de path, se termina desde button o tecla, en el futuro
    end(){
        this.pop(); //el tramo desde el último hasta donde hago click
        this.layerDraw.dispatchEvent(new CustomEvent('new-block', {bubbles: true, composed:true, detail:{type:'path', data:this.thePath}}));
        this.deleteData();
    };
    back(){
        this.pop(); //el tramo desde el último hasta donde hago click
        const last = this.thePath.elements.length-1;
        if(last < 0)
            this.deleteData();
        else{
            const el = this.thePath.elements[last]; //el tramo anterior
            this.data.x0 = el.x0; this.data.y0 = el.y0;
        }
    }
    
    deleteData = () => {
        this.deleteDataBasic(['x0','y0','x1','y1']),
        this.thePath.elements = [];
        this.clear();
    }

    //No facilito el manejo por teclado porque para eso es mejor el iso directamente
    updateData = (data) =>  {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn;  //no esperamos más que una pulsación...
        switch(idn){
            case 'back'     : this.back();  break;
            case 'enter'    : this.end();  this.deleteData(); break;
            case 'escape'   : this.deleteData();   break;
            // case 'x0'   :
            // case 'y0'   : 
            // case 'x1'   :
            // case 'y1'   : this.mouseMove({x:this.data.x1 , y:this.data.y1});
            }
        }
    }