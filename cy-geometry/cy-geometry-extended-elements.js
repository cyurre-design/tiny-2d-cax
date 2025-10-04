
import { geometryPrecision, _2PI, fuzzy_lt, fuzzy_eq_point , fuzzy_eq, distancePointToLine, sqDistancePointToPoint, minmax } from "./cy-geometry-library.js";
import {Arc} from './cy-geo-elements/cy-arc.js'
import {Segment} from './cy-geo-elements/cy-segment.js'
import {Path} from './cy-geo-elements/cy-path.js'
//import {Path} from './fg-geometry-grouped-elements.js'
// export function normalize_radians(angle){
//     return ( angle > Math.PI ? angle - _2PI : (angle < -Math.PI ? angle + _2PI: angle));
// }

export class BSegment extends Segment{
    constructor(...args){
        super(...args);
        //Normalizo el ángulo a 0-360, ahora mismo, el constructor hace distinto según 
        //como pasemos los argumentos. El límite en 4 cuadrantes sí que se hace
        if(this.alfa < 0) this.alfa += 360.0;
        //this.boundingBox();
        //boundingBox(){
        [this.minX, this.maxX] = minmax(this.pi.x, this.pf.x);
        [this.minY, this.maxY] = minmax(this.pi.y, this.pf.y);
    }
    //devuelve n BSegments, ATTON al tratamiento de ovp, hay que mantenerlo en el segmento, no ligado al vertice
    splitAtPoints(pointsOnSeg, eps = geometryPrecision){
        let result = [];
        let points = pointsOnSeg;
        if((points.length !== 0) && fuzzy_eq_point(this.pi, points[0], eps)) {
            if(points[0].ovp !== undefined) this.pi.ovp = points[0].ovp;
            points.shift(); //quito el primero y dejo el orginal
        }
        //Si solo había un punto y era pi me he cepillado el array
        if((points.length !== 0) && fuzzy_eq_point(this.pf, points[points.length-1], eps)) {
            points.pop(); //quito el último y dejo el original
        }
        points = [this.pi, ...points, this.pf];
        for(let i=1; i < points.length; i++){
            if(!fuzzy_eq_point(points[i-1], points[i]), eps){
                let s = new BSegment(points[i-1].x,points[i-1].y, points[i].x, points[i].y );
                if(points[i-1].ovp !== undefined) {
                    s.ovp = points[i-1].ovp;
                    delete points[i].ovp;
                }
                result.push(s);
            }
        }
        return result;
    }
    clone(){
        return new BSegment(this.pi.x, this.pi.y, this.pf.x, this.pf.y);
    }


    midpoint(){
        return({x: 0.5*(this.pi.x + this.pf.x), y: 0.5*(this.pi.y + this.pf.y)})
    }
    //YURRE: para posible test?
    fuzzyCompare(other, eps = geometryPrecision){
        if(! other instanceof BSegment) return false;
        return(fuzzy_eq_point(this.pi, other.pi, eps) && fuzzy_eq_point(this.pf, other.pf, eps))
    }
    //cambio la estructura del original, miro primero si son los vértices
    closestPoint (point, eps = geometryPrecision){
        if(fuzzy_eq_point(this.pi, point, eps)) return {x:this.pi.x, y:this.pi.y};
        if(fuzzy_eq_point(this.pf, point, eps)) return {x:this.pf.x, y:this.pf.y};      
        const w = {x:point.x - this.pi.x, y: point.y - this.pi.y}; //y el producto escalar sería la proyección
        const l = Math.hypot(w.x, w.y);
        if(l > this.d) 
        return {x: this.pi.x + this.ux*l, y:this.pi.y + this.uy*l};
        }
    insideOffset(point, offset, eps){
        let absoff = Math.abs(offset)-eps ; 
        if(distancePointToLine(point, this) > absoff) return false;
        //Aquí está dentro del "tubo" +- offset de la línea
        const m = this.midpoint(); //O meterlo en la estructura
        if(sqDistancePointToPoint(point.x, point.y, m.x, m.y) < 0.25*this.d*this.d) return true;
        //Quedan las esquinas redondeadas, de todas las maneras no es totalmente exacto....
        if(sqDistancePointToPoint(point.x, point.y, this.pi.x, this.pi.y) < absoff*absoff) return true;
        if(sqDistancePointToPoint(point.x, point.y, this.pf.x, this.pf.y) < absoff*absoff) return true;
        return false;
    }
    /// Computes a fast approximate axis aligned bounding box of a polyline segment defined by `v1` to `v2`.
    /// The bounding box may be larger than the true bounding box for the segment (but is never smaller).
    /// For the true axis aligned bounding box use [seg_bounding_box] but this function is faster for arc
    /// segments.
    // segFastApproxBoundingBox(){
    //     const minX = Math.min(this.pi.x, this.pf.x);
    //     const maxX = Math.max(this.pi.x, this.pf.x);
    //     const minY = Math.min(this.pi.y, this.pf.y);
    //     const maxY = Math.max(this.pi.y, this.pf.y);
    //     return new AABB(minX, minY, maxX, maxY);
    //     }   

}

//Extiendo la clase para no tocar el original
export class BArc extends Arc{
    constructor(...args){
        super(...args);
        this.recalculate();
        this.bbox = this.boundingBox();
    }
    recalculate(){
        //Un invento por estar un poco harto de ángulo
        this.t = {x:this.pf.x-this.pi.x, y:this.pf.y-this.pi.y};
        let lt = Math.hypot(this.t.x, this.t.y);
        //this.t = {x: this.t.x/lt, y:this.t.y/lt};
        this.ux = this.t.x/lt;
        this.uy = this.t.y/lt;
        this.o = this.pi.x * this.t.y - this.pi.y * this.t.x

        //YURRE: Esto para no enredar en el Arc, 
        this.b1 = this.a1 < 0? this.a1 + 2*Math.PI: this.a1;
        this.b3 = this.a3 < 0? this.a3 + 2*Math.PI: this.a3;
        let delta = this.b3 - this.b1;
        this.w = this.pathway===1? (delta > 0 ? delta : delta + 2*Math.PI) : (delta < 0 ? delta : delta - 2*Math.PI);
    }
    clone(){
        return new BArc(this.x, this.y, this.r, this.pi, this.pf, this.pathway===1?'antiClock':'clock');     //por ejemplo
    }
    reverse(){
        super.reverse();
        this.recalculate();
    }
    //YURRE: AL final testeo aquí que los puntos no coinciden con pi o pf porque es donde el "this" está "más cerca"
    splitAtPoints( pointsOnSeg, eps = geometryPrecision){
        let result = [];
        let points = pointsOnSeg;
        if((points.length !== 0) && fuzzy_eq_point(this.pi, points[0], eps)) {
            if(points[0].ovp !== undefined) this.pi.ovp = points[0].ovp;
            points.shift(); //quito el primero y dejo el orginal
        }
        if((points.length !== 0) && fuzzy_eq_point(this.pf, points[points.length-1], eps)) {
            points.pop(); //quito el último y dejo el original
        }
        points = [this.pi, ...points, this.pf];
        const cc = this.pathway === 1? "antiClock" : "clock"
        for(let i=1; i < points.length; i++){
            let a = new BArc(this.x, this.y, this.r, points[i-1], points[i], cc );
            if(points[i-1].ovp !== undefined) {
                a.ovp = points[i-1].ovp;
                delete points[i].ovp;
            }
            result.push(a);
        }
        return result;
    }
    pointWithinArcSweep(p, eps = geometryPrecision){
        //Habría que afinar con eps pero implica pasar a alfa = atan2(eps/r) o algo así... TODO
        let a = Math.atan2(p.y - this.y, p.x - this.x)
        a = a >= 0 ? a : a + 2*Math.PI;//+PI to shift to a standard circle
        //Convert the angle to a standard trigonometric circle
        let s = this.b1 ;
        let e = this.b3 ;
        let eos = eps / this.r;
        if(fuzzy_eq(a, s, eos)  || fuzzy_eq(a, e, eos)) return true;
        if(this.pathway === 1){
            if (s < e) {
                return (a > s && a < e)? true : false;
            } else { //No deben ser nunca iguales 
                return (a > s || a < e)? true : false;
                }
            }
        else{
            if (s < e) {
                return (a < s || a > e)? true : false;
            } else { //No deben ser nunca iguales 
                return (a > e && a < s)? true : false;
                }
            }
    }
    boundingBox (eps = geometryPrecision){
        if (fuzzy_eq_point(this.pi, this.pf.x, eps)) {
            return new {min_x:this.pi.x, min_y:this.pi.y, max_x:this.pi.x, max_y:this.pi.y}; //No creo que aoprta nada, la verdad
        }
        const xi = this.pi.x - this.x;
        const yi = this.pi.y - this.y;
        const xf = this.pf.x - this.x;
        const yf = this.pf.y - this.y;
        let min_x, min_y, max_x, max_y;
        if(this.pathway === 1) {//normal, ccw
            min_x = (yi > 0  && yf <0) ? this.x - this.r : Math.min(this.pi.x, this.pf.x);
            max_x = (yi < 0  && yf >0) ? this.x + this.r : Math.max(this.pi.x, this.pf.x);
            min_y = (xi < 0  && xf >0) ? this.y - this.r : Math.min(this.pi.y, this.pf.y);
            max_y = (xi > 0  && xf <0) ? this.y + this.r : Math.max(this.pi.y, this.pf.y);
        }
        else{
            min_x = (yi < 0  && yf >0) ? this.x - this.r : Math.min(this.pi.x, this.pf.x);
            max_x = (yi > 0  && yf <0) ? this.x + this.r : Math.max(this.pi.x, this.pf.x);
            min_y = (xi > 0  && xf <0) ? this.y - this.r : Math.min(this.pi.y, this.pf.y);
            max_y = (xi < 0  && xf >0) ? this.y + this.r : Math.max(this.pi.y, this.pf.y);
        }
        this.minX = min_x, this.minY=min_y, this.maxX=max_x, this.maxY=max_y;
        }    
    // length(){  //uso el Barc.w
    //     return (this.r * Math.abs(this.w));
    //     }
    midpoint(){
        return this.pm;
        }
    //Estas se usan solo para test, creo
    fuzzyCompare(other, eps){
        if(! other instanceof BArc) return false;
        if(!fuzzy_eq_point(this.pi, other.pi, eps) || !fuzzy_eq_point(this.pf, other.pf, eps)) return false;
        if(!fuzzy_eq(this.r, other.r, eps) || !fuzzy_eq(this.x, other.x, eps) || !fuzzy_eq(this.y, other.y, eps)) return false;
        return true ; //Habría que mirar pathway o el ámgulo...
    }
    //YURRE: La idea es no usar esto jamás...sería para hacer un dxf
    // bulge_from_degrees(){
    //     return ( math.tan( Math.PI * this.angle / 1440));
    //     }        
    closestPoint(point, eps = geometryPrecision){
        //if(fuzzy_eq_point(this, point, eps))    //el this.x y this.y son el centro
        //    return {x:this.pi.x, y:this.pi.y};
        if (this.pointWithinArcSweep(point)){
            let v = {x:point.x - this.x, y: point.y - this.y};
            const m = this.r / Math.hypot(v.x, v.y) ; //escalado
            return {x:this.x + m*v.x, y:this.y + m*v.y}
        }
        //Si no está en el ángulo barrido, el punto más cercano es uno de los extremos.
        const dpi = sqDistancePointToPoint(this.pi.x, this.pi.y, point.x, point.y);
        const dpf = sqDistancePointToPoint(this.pf.x, this.pf.y, point.x, point.y);
        return( dpi < dpf? this.pi: this.pf);
        }    
    insideOffset(point, offset, eps){
        let absoff = Math.abs(offset)-eps;
        let absoff2 = absoff*absoff ; 
        let r2 = sqDistancePointToPoint(point.x, point.y, this.x, this.y);
        if( r2 > (this.r+absoff)*(this.r+absoff)) return false;
        if( r2 < (this.r-absoff)*(this.r-absoff)) return false;
        //Aquí está dentro del "tubo" +- offset de la circunferencia, si está fuera del span puede estar cerca de los bordes
        if (this.pointWithinArcSweep(point)) return true;
        //Quedan las esquinas redondeadas, de todas las maneras no es totalmente exacto....
        if(sqDistancePointToPoint(point.x, point.y, this.pi.x, this.pi.y) < absoff2) return true;
        if(sqDistancePointToPoint(point.x, point.y, this.pf.x, this.pf.y) < absoff2) return true;
        return false;
    }
    // segFastApproxBoundingBox(){
    //     // For arcs we don't compute the actual boundingBox which is slower, instead we create an approximate
    //     // bounding box from the rectangle formed by extending the chord by the sagitta, note this
    //     // approximate bounding box is always equal to or bigger than the true bounding box
    //     //Y: The bulge is the tangent of one fourth the included angle for an arc segment,
    //     // made negative if the arc goes clockwise from the start point to the endpoint. 
    //     // A bulge of 0 indicates a straight segment, and a bulge of 1 is a semicircle
    //     // TODO:Revisar el bulge y tal vez implementar en la clase, hay otras cosas de menor importancia
    //     const b = Math.tan(0.25 * Math.abs(Arc.angle(this.pi, {x:thiz.vx, y:this.cy}, this.pf)));
    //     if(this.way === 'clock') b = -b;
    //     const offsX = b * (v2.y - v1.y) / 2;
    //     const offsY = -b * (v2.x - v1.x) / 2;
    
    //     const [ptXMin, ptXMax] = minmax(v1.x + offsX, v2.x + offsX);
    //     const [ptYMin, ptYMax] = minmax(v1.y + offsY, v2.y + offsY);
    
    //     const [endPointXMin, endPointXMax] = minmax(v1.x, v2.x);
    //     const [endPointYMin, endPointYMax] = minmax(v1.y, v2.y);
    
    //     const minX = Math.min(endPointXMin, ptXMin);
    //     const minY = Math.min(endPointYMin, ptYMin);
    //     const maxX = Math.max(endPointXMax, ptXMax);
    //     const maxY = Math.max(endPointYMax, ptYMax);
    
    //     return {min_x:minX, min_y:minY, max_x: maxX, max_y:maxY};
    // }     
    }

//YURRE: Al final, crear una extensión de Path va teniendo sentido...
export class BPath extends Path{
    constructor(arg, eps= geometryPrecision){
        if(!arg){
            super([]);
        }
        else if(Array.isArray(arg)){
            super(arg);
        }
        this.isClosed = false
        if(this.elements.length >= 2){
            if(fuzzy_eq_point(this.elements[this.elements.length-1].pf, this.elements[0].pi, eps)){
                this.isClosed = true;
            }
        }
    }
    //YURRE, el clone del path pero incluyendo el closed que lo calcula el constructor
    //Se puede copiar el bbox para optimizar... TODO
    clone(){
        return new BPath(this.elements);
        }
    boundingBox() {
        if(this.elements.length === 0)
                return undefined;
        let boundingBox = {minX:Infinity, minY:Infinity, maxX:-Infinity, maxY:-Infinity}
        let shape_extents;
        this.elements.forEach(shape=>{
            shape_extents = shape.bbox;
            boundingBox.minX = Math.min(boundingBox.minX, shape_extents.minX);
            boundingBox.minY = Math.min(boundingBox.minY, shape_extents.minY);
            boundingBox.maxX = Math.max(boundingBox.maxX, shape_extents.maxX);
            boundingBox.maxY = Math.max(boundingBox.maxY, shape_extents.maxY);
            })
        return boundingBox;
        }
    length(){
        let len = 0;
        if(this.elements.length === 0) return len;
        len = this.elements.reduce((len, shape) => len + shape.length(), 0);
        return len;
        }
    //YURRE; implementación de la función area siguiendo la de rust
    //Como siempre, son funciones que encajarían muy bien en la clas Path o una extensión de la misma
    area(){
        if(! this.isClosed) return 0;
        
        // Implementation notes:
        // Using the shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula) modified to
        // support arcs defined by a bulge value. The shoelace formula returns a negative value for
        // clockwise oriented polygons and positive value for counter clockwise oriented polygons.
        // The area of each circular segment defined by arcs is then added if it is a counter
        // clockwise arc or subtracted if it is a clockwise arc. The area of the circular segments
        // are computed by finding the area of the arc sector minus the area of the triangle
        // defined by the chord and center of circle.
        // See https://en.wikipedia.org/wiki/Circular_segment
        // YURRE: Uso la fórmula de segmento de wikipedia area del segmento = 0.5 * r * r * (tita - sin(tita))
        // YURRE: TODO probar más exhaustivamente
        let double_total_area = 0;
        this.elements.forEach(shape=>{
            if(shape )
                double_total_area = double_total_area + shape.pi.x * shape.pf.y - shape.pi.y * shape.pf.x;
            if(shape instanceof BArc){
                double_total_area += shape.r * shape.r * (shape.w - Math.sin(shape.w));  //shape.w ya lleva signo
            }
        });
        return (double_total_area / 2);
        }
    //YURRE, orientación que se genera a partir del área, esto se usa para definir islas y en operaciones booleanas
    /// Returns the orientation of the polyline. TODO winding number
    ///
    /// This method just uses the [PlineSource::area] function to determine directionality of a closed
    /// polyline which may not yield a useful result if the polyline has self intersects.
    orientation(){
        if(! this.isClosed) 
            return 'open'
        return (this.area() < 0) ? 'cw' : 'ccw';
        }
    //Esta no se usará casi nunca, de hecho se usa solo en tests, así que no optimizo nada
    changeStart(n){ //No clona, solo reordena, los quita de la cabeza y los empalma por la cola (se puede hacer de otras maneras)
        if(n===0  || n >= this.elements.length) return;
        for(let i=0;i<n;i++)
            this.elements.push(this.elements.shift()); //YURRE: igual no es la más óptima, pero bueno...es la más clara
    }
    
    //YURRE: A pesar del mucho código respecto al winding number, parece que luego solo se usa 
    //para determinar si un punto está en el interior de un polígono.
    //Hay otro método pero tampoco viene adaptado a arcos
    //https://observablehq.com/@tmcw/understanding-point-in-polygon
    //Este es un método alternativo, de momento no se usa
    // pointInPath( point) {
    //     // ray-casting algorithm based on
    //     var x = point.x, y = point.y;

    //     var inside = false;
    //     path.elements.forEach(s => 
    //         inside = ((pi.y > y) != (pf.y > y)) && (x < (pf.x - pi.x) * (y - pi.y) / (pf.y - pi.y) + pi.x) ? !inside : inside
    //     )
    //     return inside;
    // };´

        //YURRE: Función auxiliar para pasar de polylínea dxf a paths Fagor
    // Sólo debería servir en los tests....
    //De momento sigo la especificación de que el closed me lo pasan, pero debería ser automático
    //se necesitan 3 vértices para un path abierto y 2 para uno cerrado (el tercero es el primero)
    //Si es closed duplico el primer vértice pero con bulge 0 (no se debería usar en el algoritmo)
    //ATTON. Esto se usa para tests, básicamente, y se pasan vértices duplicados y se insertan errores
    //Hago la función en plan morralla precisamente para permitir elementos nulos y probar
    //las rutinas de remove porque si no no se puede
    static createPathFromVertexes(vertexes, closed = false){
        let shapes = [];
        let dxfVertexArray = vertexes;
        if(Array.isArray(dxfVertexArray)){
            if(!Array.isArray(dxfVertexArray[0])){ //Me pasan un solo vertes
                dxfVertexArray = [dxfVertexArray] 
            }
            if(dxfVertexArray.length < 2){
                console.error('Hay que construir un segmento como mínimo'); //esto mete una morralla
                return new BPath();
            }
            else if(!dxfVertexArray.every(v => v.length===3)){
                console.error('los argumentos no son vértices');
            }
            //De momento dejamos crear un path vacío, por si luego lo rellenamos, pero vertices >= 2
            if(dxfVertexArray.length >= 2){
                //Aquí ya puedo construir el path, el último depende de si es closed o no
                //c = c || (dxfVertexArray[dxfVertexArray.length-1][2]) !== 0;
                if(closed)
                    dxfVertexArray.push(dxfVertexArray[0]); //no pongo bulge a 0 porque no se debería usar....
                const nSegments = dxfVertexArray.length-1;
                for(let i = 0; i < nSegments; i++){
                    let vertex = dxfVertexArray[i];
                    let next = dxfVertexArray[i+1] ; //nsegments YA está limitado a length-1
                    if(vertex[2] === 0)
                        shapes.push( new BSegment(vertex[0], vertex[1], next[0], next[1]));
                    else{
                        shapes.push( createArcFromBulge({x:vertex[0], y: vertex[1]},{x: next[0], y:next[1]}, vertex[2]));
                    }
                }
            }
        }
        const thePath = new BPath(shapes);
        //YURRE: en el original pueden definirse como opne perfiles que son closed... parece que solo tiene sentido en test
        thePath.isClosed = closed;
        return thePath;
        }
    static fromJSON(str){ //Esta debe estar en Path , de hecho la hago para path y luego llamo al conversor general
        let npaths = JSON.parse(str);
        npaths = Array.isArray(npaths)?npaths:[npaths];
        let nBPaths = npaths.map(p=>{
            let elements = [];
            p.args.forEach(el=>{    //YURRE, solo trato de momento los básicos
                if(el.type === 'segment'){
                    elements.push(new Segment(el.args.x1,el.args.y1,el.args.x2,el.args.y2));
                } else if(el.type === 'arc'){
                    elements.push(new Arc(el.args.x, el.args.y, el.args.r, {x:el.args.pi.x, y:el.args.pi.y }, {x:el.args.pf.x, y:el.args.pf.y }, el.args.way))
                }
            })
            return path2BPath(new Path(elements))
        })
        return nBPaths;
        
    }
   //YURRE: Creo que solo se usa en test, pero...podría ser útil alguna vez
    /// Returns a new polyline with all arc segments converted to line segments with some
    /// `error_distance` or `None` if `Self::Num` fails to cast to or from usize.
    ///
    /// `error_distance` is the maximum distance from any line segment to the arc it is
    /// approximating. Line segments are circumscribed by the arc (all line end points lie on the
    /// arc path). OSEASE el error cordal, devuelve un path nuevo
    arcsToApproxLines( error_cordal, eps) {
        let elements = [];
        if(this.elements.length === 0) return result;
        let abs_error = Math.abs(error_cordal);
        this.elements.forEach(shape => {
            if(shape instanceof BSegment)
                elements.push(shape.clone());     
            if(shape instanceof BArc){
                if(fuzzy_lt(shape.r, error_cordal, eps))
                    elements.push(new BSegment(shape.pi.x, shape.pi.y, shape.pf.x, shape.pf.y));
                else{
                    let angle_diff = Math.abs(shape.a3 - shape.a1);        
                    let seg_sub_angle = Math.abs(2*Math.acos( (1 - abs_error)/shape.r))
                    let nsegs = (Math.ceil(angle_diff / seg_sub_angle));
                    seg_sub_angle = shape.pathway===1 ? angle_diff / nsegs : -angle_diff / nsegs; //recalculo por el ceil...
                    //el bucle usa vértices, añado el último, que podría hacerlo aparte con shape.pf
                    let angles = Array.from({ length: nsegs }, (_, i) => shape.a1 + (i+1) * seg_sub_angle);
                    // create angle offset such that all lines have an equal part of the arc
                    for(let i=1, xi= shape.pi.x, yi= shape.pi.y; i<angles.length; i++){
                        let xf = shape.x + shape.r*Math.cos(angles[i]);
                        let yf = shape.y + shape.r*Math.sin(angles[i]);
                        elements.push( new BSegment(xi, yi, xf, yf));
                        xi = xf;
                        yi = yf;
                    }
                }
            }
        })
        return new BPath(elements);
    }
    //YURRE: NO modifico el original, clono o rehago lo que haga falta
    //shapes es un shallow copy, por eso clono por siacaso. Por otra parte controlo que "actual" sea siempre clonado
    // Hay que incluir el caso de solape en el punto inicial (last = first)
    removeRedundant( options={pos_equal_eps: geometryPrecision, invert_area: false}) {
        let eps = options.pos_equal_eps;
        let shapes = this.elements.filter(shape=> !fuzzy_eq_point(shape.pi, shape.pf, eps)); //quito los elementos de l=0
        let result = new BPath([]);
        result.isClosed = this.isClosed;
        if(shapes.length < 2) {
            if(shapes.length > 0) result.elements.push(shapes[0].clone()) ; //después de filtrar solo ha quedado 0 o 1
            return result;
        }
        let elements = [];
        let actual = shapes.shift().clone(); //cojo el primero
        let isArc = (sh) => sh instanceof BSegment ? false : true;
        let onArc = isArc(actual);
        //let change = false; // actual, elements, etc... son globales en el scope de la función
        function notCollapsable(el){
            let elArc = isArc(el);
            //esto elimina muchas combinaciones, si pasa el test hay posibile emplame
            if((elArc !== onArc) || !fuzzy_eq_point(el.pi, actual.pf, eps))
                return true; //no colapsa
            if(!isArc(actual)){ //segmento
                // Aquí ya sé que están seguidos, miro si son colineales
                if(fuzzy_eq(el.ux, actual.ux, eps) && fuzzy_eq(el.uy, actual.uy, eps)){
                    //misma recta y empalman (ux uy ya llevan sentido), el change está a false por defecto
                    actual = new BSegment(actual.pi.x, actual.pi.y, el.pf.x, el.pf.y); //y sigo
                    return false;
                }
                return true;
            }
            // aquí son ambos arcos, empalme posible y ya he mirado que están seguidos pero falta radio, etc
            // YURRE:?can only combine vertexes if total sweep will still be less than PI () Pero no divide el arco en tramos, creo...)
            if(fuzzy_eq(el.x, actual.x, eps) && fuzzy_eq(el.y, actual.y, eps) && fuzzy_eq(el.r, actual.r, eps) && el.pathway===actual.pathway ){
                //Como están orientados igual miro la suma de ángulos. En ambos pathways importa que el absoluto no pase de pi
                if( Math.abs (actual.w + el.w) < Math.PI + eps/actual.r){
                    actual = new BArc(el.x, el.y, el.r, actual.pi, el.pf, el.pathway === 0? 'clock': 'antiClock');
                    return false;
                }       
            }
            return true;
        }

        shapes.forEach(el => {
            if(notCollapsable(el) === true){
                elements.push(actual)
                actual = el.clone();
                onArc = isArc(actual);
            }
        })
        //en actual está lo último acumulado, o el último, sin más, pero podría juntarse con el primero...
        //pero puede que elements esté vacío por haberse colapsado todo en uno
        if(this.isClosed && (elements.length > 0)){
            if(notCollapsable(elements[0]) === false){ //La función notCollapsable NO es pura, machaca actual si colapsa
                elements.splice(0,1,actual);    //sustituyo el primero por el colapsado y tengo que salir 
                result.elements = elements;
                return result;
            }
        }
        //caso normal, no es cerrado o no empalma
        elements.push(actual);
        result.elements = elements;
        return result;
        }
}

//Repositorio para gestionar las cajeras con islas. Se supone que las cajeras son ccw y las islas lo contrario
//Esto tiene que ver con la definición de offset positivo o negativo para ir por fuera o por dentro, como la compensación de herramienta
//paths a izquierdas y derechas
// ccwPaths (cajeras)  y cwPaths (islas)
//DEFINO que viene un array de paths y el primero es la cajera y el resto islas
//Si NO vienen con el sentido bueno (cajera ccw, isla cw) se lo ponemos en el constructor
//Si NO hay islas debe funcionar como el algoritmo de offset
//Aunque originalmente solo haya una cajera, se puede dividir en varias por colisiones, así que tengo un array de cajeras y otro de islas

export class ComplexPath{
    constructor(ccwPaths, cwPaths){
        if(ccwPaths.length === 0) return;
        if(ccwPaths.some(p=>(!(p instanceof BPath)))) {console.log('entrada errónea'); return}
        if(cwPaths.some(p=>(!(p instanceof BPath)))) {console.log('entrada errónea'); return}
        this.cajeras = ccwPaths;
        this.islas = cwPaths;
        this.cajeras.forEach(p => { //Habría que dar warning o error??
            if(p.orientation() !== 'ccw')
                p.reverse();
        })
        this.islas.forEach(p => {
                if(p.orientation() !== 'cw')
                    p.reverse();
            })
    }
    clone(){
        return new ComplexPath(this.cajeras.map(ccw=>ccw.clone(), this.islas.map(cw=>cw.clone())));
    }

}


/// Calculate the winding number for a `point` relative to the polyline.
///
/// The winding number calculates the number of turns/windings around a point that the polyline
/// path makes. For a closed polyline without self intersects there are only three
/// possibilities:
///
/// * -1 (polyline winds around point clockwise)
/// * 0 (point is outside the polyline)
/// * 1 (polyline winds around the point counter clockwise).
///
/// For a self intersecting closed polyline the winding number may be less than -1 (if the
/// polyline winds around the point more than once in the counter clockwise direction) or
/// greater than 1 (if the polyline winds around the point more than once in the clockwise
/// direction).
///
/// This function always returns 0 if polyline [PlineSource::is_closed] is false.
///
/// If the point lies directly on top of one of the polyline segments the result is not defined
/// (it may return any integer). To handle the case of the point lying directly on the polyline
/// [PlineSource::closest_point] may be used to check if the distance from the point to the
/// polyline is zero.
///

export function winding_number(path, point){
    if (!path.isClosed || path.elements.length < 2) {
        return 0;
    }

    // Helper function for processing a line segment when computing the winding number.
    let process_line_winding = (segment, point) => {
        let result = 0;
        if ( point.y >= segment.pi.y) {
            if((point.y < segment.pf.y) && is_left_to_segment(segment, point))  // left and upward crossing
                result += 1;
        } else if((point.y >= segment.pf.y ) && !is_left_to_segment(segment, point)) // right an downward crossing
            result -= 1;
        return result
    };

    // Helper function for processing an arc segment when computing the winding number.
    let process_arc_winding = (arc, point) => {
            let is_ccw = arc.pathway === 1;
            let point_is_left = is_ccw ? is_left_to_segment(arc, point) : is_left_or_equal_to_segment(arc, point);
            let insideCircle = sqDistancePointToPoint(arc.x, arc.y, point.x, point.y) < arc.r*arc.r;
            let result = 0;

            if (arc.pi.y <= point.y) {
                if (arc.pf.y > point.y) {     // upward crossing of arc chord
                    if (is_ccw) {
                        if (point_is_left) {  // counter clockwise arc left of chord
                            result += 1;
                        } else {              // counter clockwise arc right of chord
                            if (insideCircle) {
                                result += 1;
                            }
                        }
                    } else if(point_is_left){ // clockwise arc left of chord
                        if (!insideCircle) {
                            result += 1;
                        }
                        // else clockwise arc right of chord, no crossing
                    }
                } else {                // not crossing arc chord and chord is below, check if point is inside arc sector
                    if (is_ccw && !point_is_left && arc.pf.x < point.x && point.x < arc.pi.x  && insideCircle) {
                        result += 1;
                    } else if (!is_ccw && point_is_left && arc.pi.x < point.x && point.x < arc.pf.x && insideCircle) {
                        result -= 1;
                    }
                }
            } else if (arc.pf.y <= point.y) {  // downward crossing of arc chord
                if (is_ccw) {
                    if (!point_is_left) {      // counter clockwise arc right of chord
                        if (!insideCircle) {
                            result -= 1;
                        }
                    }
                // else counter clockwise arc left of chord, no crossing
                } else if (point_is_left) {    // clockwise arc left of chord
                    if (insideCircle) {
                        result -= 1;
                    }
                } else {                       // clockwise arc right of chord
                    result -= 1;
                }
            } else {
                // not crossing arc chord and chord is above, check if point is inside arc sector
                if (is_ccw && !point_is_left && arc.pi.x < point.x && point.x < arc.pf.x && insideCircle) {
                    result += 1;
                } else if (!is_ccw && point_is_left && arc.pf.x < point.x && point.x < arc.pi.x && insideCircle) {
                    result -= 1;
                }
            }

            return result
        };

    //let winding = 0;
    let winding = path.elements.reduce(( winding, el)=>
        winding + ((el instanceof BSegment)? process_line_winding(el, point) : process_arc_winding(el, point)), 0);
     return winding;
}
export function path2BPath(path){
    let bEls = path.elements.map(el => {
      if(el.type === 'segment')
        return new BSegment(el.pi.x, el.pi.y, el.pf.x, el.pf.y);
      else if(el.type === 'arc')
        return new BArc(el.x, el.y, el.r, el.pi, el.pf, el.pathway===1?'antiClock':'clock');
      else {
        console.log('elemento no contemplado') //YURRE: TODO convertir chaflanes y redondeos
      } 
    })
    let bPath = new BPath(bEls);
    return bPath;
  }
export function bpath2Path(path){
    let els = path.elements.map(el => {
      if(el instanceof BSegment)
        return new Segment(el.pi.x, el.pi.y, el.pf.x, el.pf.y);
      else if(el instanceof BArc)
        return new Arc(el.x, el.y, el.r, el.pi, el.pf, el.pathway===1?'antiClock':'clock');
      else {
        console.log('elemento no contemplado') //YURRE: TODO convertir chaflanes y redondeos
      } 
    })
    let opath = new Path(els);
    return opath;
  }

/// Get the arc radius and center of an arc polyline segment defined by `v1` to `v2`.
/// Behavior undefined (may panic or return without error) if v1.bulge is zero.
///
//YURRE: Esta solo sirve para hacer funcionar los casos de test heredados.
export function createArcFromBulge(v1, v2, bulge)
{
    // compute radius
    let abs_bulge = Math.abs(bulge);
    let chord_v = {x:v2.x - v1.x, y:v2.y - v1.y};
    let chord_len = Math.hypot(chord_v.x, chord_v.y);
    let radius = chord_len * (abs_bulge * abs_bulge + 1) / (4 * abs_bulge);

    // compute center
    let s = abs_bulge * chord_len / 2;
    let m = radius - s;
    let offs_x = -m * chord_v.y / chord_len;
    let offs_y = m * chord_v.x / chord_len;
    if(bulge < 0) {
        offs_x = -offs_x;
        offs_y = -offs_y;
    }

    let centerx = v1.x + chord_v.x / 2 + offs_x;
    let centery = v1.y + chord_v.y / 2 + offs_y;
    let way =  (bulge < 0? 'clock' : 'antiClock');
    //if `bulge` is negative then angle returned will be negative (clockwise arc).
    return new BArc(centerx, centery, radius, v1, v2, way)
}

/// Helper function to avoid repeating code for is_left and is_right checks.
//YURRE Se podría haber usado en la anterior TODO
export function perp_dot_test_value(p0, p1, point)
{
   return (p1.x - p0.x) * (point.y - p0.y) - (p1.y - p0.y) * (point.x - p0.x) ;
}
/// Returns true if `point` is left of a direction vector.
export function is_left(p0, p1, point)
{
    return ( perp_dot_test_value(p0, p1, point) > 0);
}

/// Same as [is_left] but uses <= operator rather than < for boundary inclusion.
export function is_left_or_equal(p0, p1, point)
{
    return ( perp_dot_test_value(p0, p1, point) >= 0);
}

//YURRE; para el segmento usamos una versión diferente del vectorial para usar solo el signo
// pf-pi es x:ux*l, y:uy*l      (pf-pi) x (p-pi) =
// = (pf.x - pi.x) * (point.y - pi.y) - (pf.y - pi.y) * (point.x - pi.x) ;
// = l*ux*(p.y-pi.y) -l*uy*(p.x-pi.x) y para saber el signo no influye l
function is_left_to_segment(s, p){
    return ((s.ux*(p.y-s.pi.y) - s.uy*(p.x-s.pi.x)) > 0 );
}
function is_left_or_equal_to_segment(s, p){
    return ((s.ux*(p.y-s.pi.y) - s.uy*(p.x-s.pi.x)) >= 0 );
}

