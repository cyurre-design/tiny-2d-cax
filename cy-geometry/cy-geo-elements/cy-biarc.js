"use strict";


//clase de apoyo, instrumental
export default class Biarc{
    constructor(a, b){  //se supone que le pasamos los do arcos tangentes, se puede pasar la rutina de cálculos
        this.a = a;
        this.b = b;
        this.lengtha = Math.abs(this.a.r*(this.a.a3 - this.a.a1)); //revisar, a3 debe ser mayor que a1
        this.lengthb = Math.abs(this.b.r*(this.b.a3 - this.b.a1)); //revisar, a3 debe ser mayor que a1
        this.length = this.lengtha + this.lengthb;
        this.s = this.lengtha / this.length;
    }
    intepolateArc(arc, t){
        let alfa = arc.a1 + t*(arc.a3-arc.a1);
        return({x: arc.x + arc.r*Math.cos(alfa), y: arc.y + arc.r*Math.cos(alfa)});
    }
    interpolate( t) {
        return( t <= this.s? this.interpolateArc(this.a, t/ this.s): this.interpolateArc(this.b, (t - this.s) /(1 - this.s)));
    }

}
