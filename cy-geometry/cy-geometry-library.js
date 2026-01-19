//YURRE: valor arbitrario para considerar que dos puntos son iguales.en mm, las cosas SI tienen unidades
//NO está previsto para ser tocado en realidad, o en todo caso en modo avanzado... ya veremos
import {Cut} from'./cy-cut-types.js'
import {circle_circle_intr, arc_arc_intr, circle_arc_intr} from './cy-cuts-circle-circle.js'
import {segment_arc_intr} from './cy-cuts-segment-circle.js'
import {line_line_intr} from './cy-cuts-segment-segment.js'

import {segmentTranslate, segmentRotate, segmentScale, segmentSymmetryX, segmentSymmetryY, segmentSymmetryL, segmentReverse, segmentLength, segmentMidpoint, segmentSplitAtPoints  } from './cy-geo-elements/cy-segment.js'
import {arcTranslate, arcRotate, arcScale, arcSymmetryX, arcSymmetryY,  arcSymmetryL, arcReverse, arcLength, arcMidpoint, arcSplitAtPoints} from './cy-geo-elements/cy-arc.js'
import {circleTranslate, circleRotate, circleScale, circleSymmetryX, circleSymmetryY, circleSymmetryL, circleLength } from './cy-geo-elements/cy-circle.js'
import {polygonTranslate, polygonRotate, polygonScale, polygonSymmetryX, polygonSymmetryY, polygonSymmetryL, polygonLength} from './cy-geo-elements/cy-polygon.js'
import {pathTranslate, pathRotate, pathScale, pathSymmetryX, pathSymmetryY, pathSymmetryL, pathReverse, pathLength} from './cy-geo-elements/cy-path.js'
import {bezierTranslate, bezierRotate, bezierScale, bezierSymmetryX, bezierSymmetryY, bezierSymmetryL, bezierReverse} from './cy-geo-elements/cy-bezier.js'


export const geometryPrecision = 0.0001;
export const geometryPrecision2 = 0.00000001;
export const _2PI = 2*Math.PI;

//Es la resolución de ecuaciones cuadráticas, que hay mejor que la del cole
export function _solveq(a, b, c) {
    let discriminante = (b * b - 4 * a * c);
    if (fuzzy_eq_zero(discriminante))  return [-b / (2 * a)];
    if (discriminante < 0) return []; //La sqrt da Nan si es disc < 0
    discriminante = Math.sqrt(discriminante);
    let x1 = (b < 0) ? (-b + discriminante) / (2 * a) : (-b - discriminante) / (2 * a);
    return [x1, c / (a * x1)]; //copiado de libro, es para mejorar los errores de cálculo 
}



export function distancePointToPoint(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}
export function sqDistancePointToPoint(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}
//Lo hacemos en formato ax+by+c=0, para líneas infinitas aunque no chequeamos aquí que lo sean.
//nuestra línea es uy*x - ux*y + c = 0  (Ax+By+C=0 con A*A + B*B = 1)
//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
// la fórmula de distancia es d= |a*x0 + b*y0 + c| / sqrt(a*a + b*b). nuestro denominador es 1
export function distancePointToSegment(x, y, s) {
    return Math.abs(x * s.uy - y * s.ux + s.c);
}

//Otra función genérica para calcular corte de dos segmentos que vienen con su punto inicial y final....
//Lo hacemos en formato ux*x+ux*y+c=0, para líneas infinitas aunque no chequeamos aquí que lo sean.
export function cutSegmentToSegment(s1, s2) {
    let discriminante =  s1.uy * s2.ux - s2.uy * s1.ux;
    if (fuzzy_eq_zero( discriminante )) return []; //EPSILON?
    return [{x: (-s2.ux * s1.c + s1.ux * s2.c) / discriminante, y: (s1.uy * s2.c - s1.c * s2.uy) / discriminante}];
}

// Lo hacemos en formato ax+by+c=0 con a*a + b*b = 1
export function cutSegmentToCircle(s, c) {  // a revisar si es suficiente, me paso en formato infinito, b = -ux y a = uy
    if (Math.abs(s.uy) >= Math.abs(s.ux)) { //x = my + x0
        //calculo x despejando y:  x^2*(1+m^2) + 2x*(m*y0-cx-m*cy) + y0^2 - 2*y0*cy + rest
        let m = s.ux / s.uy;
        let x0 = -s.c / s.uy;
        let solutions = _solveq(1 + m * m, 2 * (m * (x0 - c.cx) - c.cy), c.cy * c.cy + (x0 - c.cx) * (x0 - c.cx) - c.r * c.r);
        return solutions.map(s => ({y: s, x: x0 + m * s}));
    } else { //y = mx + y0
        let m = s.uy / s.ux;
        let y0 = s.c / s.ux;
        let solutions = _solveq(1 + m * m, 2 * (m * (y0 - c.cy) - c.cx), (y0 - c.cy) * (y0 - c.cy) + c.cx * c.cx - c.r * c.r);
        return solutions.map(s => ({y: y0 + m * s, x: s}));
    }
}

export function pointProyectedToSegment(s, x1, y1) { //si no se define p, línea con el mismo p0 que la original
    //Si s se define mediante uy*x - ux*y + c = 0. 
    //La perpendicular sería ux*x + uy*y + cp = 0 y calculamos cp con el punto que nos dan
    const cp = - ( s.ux*x1 +s.uy*y1); 
    //Despejando el punto de corte entre las dos líneas  obtenemos x0,y0 (que puede que no esté en el segmento...)
    //gestiono posibles divisiones por números pequeños
    let x0,y0;
    if(Math.abs(s.ux) > Math.abs(s.uy) ){
        x0 = -(s.c*s.uy + cp*s.ux);
        y0 = (s.uy*x0 + s.c)/s.ux;
    } else {
        y0 = (s.c*s.ux - cp*s.uy);
        x0 = (s.ux*y0 - s.c)/s.uy;
    }
    return {x0:x0, y0:y0}
}

//específica para hacer un punto simétrico respecto a un segmento
export function pointSymmetricSegment(s, x, y) { //si no se define p, línea con el mismo p0 que la original
    const proyected = pointProyectedToSegment(s, x, y);
    // //Si s se define mediante uy*x - ux*y + c = 0. 
    // //La perpendicular sería ux*x + uy*y + cp = 0 y calculamos cp con el punto que nos dan
    // const cp = - ( s.ux*x +s.uy*y); 
    // //Despejando el punto de corte entre las dos líneas  obtenemos x0,y0 (que puede que no esté en el segmento...)
    // //gestiono posibles divisiones por números pequeños
    // let x0,y0;
    // if(Math.abs(s.ux) > Math.abs(s.uy) ){
    //     x0 = -(s.c*s.uy + cp*s.ux);
    //     y0 = (s.uy*x0 + s.c)/s.ux;
    // } else {
    //     y0 = (s.c*s.ux - cp*s.uy);
    //     x0 = (s.ux*y0 - s.c)/s.uy;
    // }
    //Y el punto simétrico estará en
    const xs = 2*proyected.x0 - x, ys = 2*proyected.y0 - y;
    return ([xs, ys]);
}
//línea que pasa por un punto y es tangente a una circunferencia (hay dos)
//Si el punto está dentro de la circunferencia va a ser que no
//En realidad no voy a devolver el segmento sino el punto de tangencia
export function segmentTangentToArc(c, x, y) {
    if(Math.hypot((x - c.cx), (y - c.cy)) < c.r) return [];
    let rest = x * c.cx + y * c.cy - c.cx * c.cx - c.cy * c.cy + c.r * c.r;
    if (Math.abs(c.cx - x) >= Math.abs(c.cy - y)) { //x=my+x0
        let m = -(c.cy - y) / (c.cx - x);
        let x0 = -rest / (c.cx - x);
        let solutions = _solveq(1 + m * m, 2 * (m * (x0 - c.cx) - c.cy), (x0 - c.cx) * (x0 - c.cx) + c.cy * c.cy - c.r * c.r);
        return solutions.map(s => ({x: x0 + m * s, y: s}));
    } else { //y = mx+y0
        let m = -(c.cx - x) / (c.cy - y);
        let y0 = -rest / (c.cy - y);
        let solutions = _solveq(1 + m * m, 2 * (m * (y0 - c.cy) - c.cx), c.cx * c.cx + (y0 - c.cy) * (y0 - c.cy) - c.r * c.r);
        return solutions.map(s => ({x: s, y: y0 + m * s}));
    }    
}

/**
 * 
 * @param {Object circle} c0 
 * @param {Object circle} c1 
 * @returns Array de solcuiones
 * En lugar de devolver los objetos, puesto que son degmentos, devuelve parejas de puntos en c0 y c1
 * Y luego ya elegiremos la mejor solución por cercanía a los puntos de click originales, por ejemplo
 * No le quita potencia pero elimina complejidad aquí, que solo genera puntos
 * Las soluciones serian cada una un array de dos elementos, que pueden ser puntos o array de dos cooredanas
 * eso apenas influye en la complejidad.
 * Puede haber hasta 4 tangentes, dos interiores y dos exteriores
 * Y casos degenerados como tener el mismo centro, estar uno completamente incluido en otro
 * o ser tangentes por dentro o por fuera
 */
export function segmentsTangentToCircleAndCircle(c0, c1) {
    let solutions = [];
    let xp, yp, res0, res1;
    let x0, y0, x1, y1;
    //Si los circulos están uno dentro de otro NO hay tangentes
    let dcc = distancePointToPoint(c0.cx, c0.cy, c1.cx, c1.cy);
    let dr = Math.abs(c0.r - c1.r);         //diferencia de radios, valor absoluto
    if(fuzzy_lt(dcc, dr)) return [];
    if (dcc >= dr) { //Hay tangentes exteriores por lo menos, aunque igual solo una...
        //Tangentes exteriores
        if (fuzzy_eq_zero(dr)) {            //circulos de mismo radio, las tangentes no se cortan sino que son paralelas
            const r = 0.5*(c0.r + c1.r);      //porque sí
            const s = r * (c1.cy - c0.cy) / dcc;    //seno y coseno
            const c = r * (c1.cx - c0.cx) / dcc;
            //Por un lado
            x0 = c0.cx + s, y0 = c0.cy - c;
            x1 = c1.cx + s, y1 = c1.cy - c;
            solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
            //y por el otro
            x0 = c0.cx - s, y0 = c0.cy + c;
            x1 = c1.cx - s, y1 = c1.cy + c;
            solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
        } else { //xp,yp es el punto de corte de las tangentes exteriores, que estará a la izquierda o a la derecha de ambos
            //El caso degenerado es cuando son tangentes
            xp = (c1.cx * c0.r - c0.cx * c1.r) / (c0.r - c1.r); 
            yp = (c1.cy * c0.r - c0.cy * c1.r) / (c0.r - c1.r);
            //con el punto puedo obtener el seno  (vale cualquiera de los circulos)
            const s = c0.r / Math.hypot((c0.cx - xp), (c0.cy - yp));
            const c = Math.sqrt(1 - s*s);
            x0 = c0.cx + c0.r*s; y0 = c0.cy - c0.r*c;
            x1 = c1.cx + c1.r*s; y1 = c1.cy - c1.r*c;
            solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
            x0 = c0.cx + c0.r*s; y0 = c0.cy + c0.r*c;
            x1 = c1.cx + c1.r*s; y1 = c1.cy + c1.r*c;
            solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
        }
    }

    if (dcc >= (c0.r + c1.r)) { //Hay tangentes interiores que se cortan en xp,yp
        xp = (c1.cx * c0.r + c0.cx * c1.r) / (c0.r + c1.r);
        yp = (c1.cy * c0.r + c0.cy * c1.r) / (c0.r + c1.r);
        //con el punto puedo obtener el seno  (vale cualquiera de los circulos)
        const s = c0.r / Math.hypot((c0.cx - xp), (c0.cy - yp));
        const c = Math.sqrt(1 - s*s);
        x0 = c0.cx + c0.r*s; y0 = c0.cy + c0.r*c;
        x1 = c1.cx - c1.r*s; y1 = c1.cy - c1.r*c;
        solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
        x0 = c0.cx + c0.r*s; y0 = c0.cy - c0.r*c;
        x1 = c1.cx - c1.r*s; y1 = c1.cy + c1.r*c;
        solutions.push([{x:x0, y:y0},{x:x1, y:y1}]);
        }

    return solutions;
}

export function areClose(x1, y1, x2, y2, tol) {
    return (((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) ) < tol * tol);
}
export function translatePoint(x,y,dx,dy){
    return([x+dx, y+dy]);
}
export function rotateZ(x, y, alfa){
    const c = Math.cos(alfa), s = Math.sin(alfa);
    return [x*c - y*s, x*s + y*c]
}
export function scale0(x, y, scale){
    return [x*scale, y*scale]
}
export function transformPoint(x,y,M){
    return([ M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f]);
}
//NO se supone que ambas están ordenadas, a priori, se exporta por ahí
export function checkBbox(b1, b2){
    return({x0:Math.min(b1.x0, b2.x0), y0:Math.min(b1.y0, b2.y0), x1:Math.max( b1.x1, b2.x1), y1:Math.max( b1.y1, b2.y1)})
}
//Aquí supongo un bbox como dios manda, ordenado
export function insideBbox(bout, bin){
    return((bout.x0 <= bin.x0) && (bout.x1 >= bin.x1) && (bout.y0 <= bin.y0) && (bout.y1 >= bin.y1));
}
//YURRE: Utilidades que extienden lo anterior
export function fuzzy_eq( a, b, eps = geometryPrecision) {
    return (Math.abs(a - b) < eps);
}
export function fuzzy_eq_zero( a, eps = geometryPrecision) {
    return (Math.abs(a) < eps);
}
export function fuzzy_gt( a, b, eps = geometryPrecision){
    return ((a + eps) > b);
}
export function fuzzy_lt( a, b, eps = geometryPrecision){
    return (a < (b + eps));
}
export function fuzzy_in_range( v, min, max, eps = geometryPrecision){
    return( fuzzy_gt(v, min, eps) && fuzzy_lt(v, max, geometryPrecision));
}
//Esta función está repe con otro nombre
export function fuzzy_eq_point(p0, p1, eps = geometryPrecision){
    return(fuzzy_eq(p0.x, p1.x, eps) && fuzzy_eq(p0.y, p1.y, eps));
}
export function minmax(a,b){
    return( a>b? [b,a]: [a,b])
}
export function normalize_radians(angle) {
    return (angle % (_2PI) + _2PI) % (_2PI)
}

//YURRE; para el segmento usamos una versión diferente del vectorial para usar solo el signo
// pf-pi es x:ux*l, y:uy*l      (pf-pi) x (p-pi) =
// = (pf.x - pi.x) * (point.y - pi.y) - (pf.y - pi.y) * (point.x - pi.x) ;
// = l*ux*(p.y-pi.y) -l*uy*(p.x-pi.x) y para saber el signo no influye l
export function is_left_to_segment(s, p){
    return ((s.ux*(p.y-s.pi.y) - s.uy*(p.x-s.pi.x)) > 0 );
}
export function is_left_or_equal_to_segment(s, p){
    return ((s.ux*(p.y-s.pi.y) - s.uy*(p.x-s.pi.x)) >= 0 );
}
//Lo hacemos en formato ax+by+c=0, para líneas infinitas aunque no chequeamos aquí que lo sean.
//nuestra línea es uy*x - ux*y + c = 0  (Ax+By+C=0 con A*A + B*B = 1)
//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
// la fórmula de distancia es d= |a*x0 + b*y0 + c| / sqrt(a*a + b*b). nuestro denominador es 1
export function distancePointToLine(p, l) {
    return Math.abs(p.x * l.uy - p.y * l.ux + l.c);
}

export function circleFrom3Points(p1,p2,p3){
    const denominador = (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
    if (denominador === 0) {
        return undefined;
    } else{
        const data = {
            cx: ((p1.x*p1.x + p1.y*p1.y) * (p2.y - p3.y) + (p2.x*p2.x + p2.y*p2.y) * (p3.y - p1.y) + (p3.x*p3.x + p3.y*p3.y) * (p1.y - p2.y)) / (2 * denominador),
            cy: ((p1.x*p1.x + p1.y*p1.y) * (p3.x - p2.x) + (p2.x*p2.x + p2.y*p2.y) * (p1.x - p3.x) + (p3.x*p3.x + p3.y*p3.y) * (p2.x - p1.x)) / (2 * denominador),
        }
        data.r = Math.hypot(p1.x - data.cx, p1.y - data.cy)
        data.x1 = p1.x; data.y1 = p1.y;     //por definir un punto inicial
        return data;
    }
}
export function centerFrom2PR(data){
    const dx = data.x1 - data.x0, dy = data.y1 - data.y0;     
    const xm = 0.5 * (data.x0 + data.x1), ym = 0.5 * (data.y0 + data.y1);
    const d = Math.hypot(dx,dy);
    if(d > 2*data.r) return undefined
    //const dc = Math.sqrt( data.r*data.r - 0.25*d*d); //distancia centro a cuerda
    const ux = dx/d, uy = dy/d; //unitario, el centro estará en la normal en el punto medio
    const h = Math.sqrt(data.r*data.r - 0.25*d*d);
    const sols = [{x0:xm + h*uy, y0:ym - h*ux},{x0:xm - h*uy, y0:ym + h*ux}];
    return sols
    //Por definición, el p2 debe estar en el arco, lo que termina de definir todo
    //const data = Object.assign({},sols[0]);
    // const sol = data.way==='clock'?sols[0]:sols[1];
    // const newdata = {    
    //     cx: sol.x0,
    //     cy: sol.y0,
    //     x1: data.x1,
    //     y1: data.y1,
    //     r: data.r
    // }
    // return newdata;
}
//Formato svg? ecuaciones están en la w3c: https://svgwg.org/svg2-draft/implnote.html#ArcImplementationNotes
//Pero fi===0 por ser un circulo y rx === ry
//el da es el incremento de ángulo y tiene signo
//La rutina debe devolver un objeto que entre directamente en la clase Arc => cambio de formato de nombres y tal
export function arc2PC2SVG(c, r, pi, pf, way){ //data va por referencia y se le "pegan" los flags
    const data = {cx:c.x, cy:c.y, x1:pi.x, y1:pi.y, x2:pf.x, y2:pf.y, way:way};
    data.r = r || Math.hypot(pi.y - c.y, pi.x - c.x);
    const a1 = ( Math.atan2(pi.y - c.y, pi.x - c.x));
    const a2 = ( Math.atan2(pf.y - c.y, pf.x - c.x));

    data.fS = way !== 'clock' ? 0 : 1;
    let delta = normalize_radians(a2 - a1) ; 
    delta = data.fS === 1 ? delta - _2PI : delta;

    //Por normalizar un poco lo de clock a lo que usa svg, sweep=0 es el "normal"
    data.fA = (Math.abs(delta) > Math.PI) ? 1 : 0;

    data.ai = a1;
    data.da = delta;
    return data;
}
//Busco siempre el arco corto, modifico el way para ello
export function arc3P2SVG(p1, p2, p3){
    const data = circleFrom3Points(p1,p2,p3);
    if(!data) return undefined;
    const dx1 = p2.x-p1.x, dy1= p2.y-p1.y;
    const dx2 = p3.x-p2.x, dy2= p3.y-p2.y;
    const way = (dx1*dy2 - dy1*dx2) > 0 ? 'antiClock' : 'clock';
    const newData = arc2PC2SVG({x:data.cx, y:data.cy}, data.r ,p1, p3, way);
    return newData;
}
export function arc2PR2SVG(p1, p2, r, way='clock'){  
    const sols = centerFrom2PR( {x0:p1.x, y0:p1.y, x1:p2.x, y1:p2.y, r:r} );
    if(!sols) return undefined;
    const sol = way==='clock'?sols[0]:sols[1];
    const data = arc2PC2SVG({x:sol.x0, y:sol.y0}, r, p1, p2, way)
    return data;
}
//a en grados !!
export function arcCPA(c,pi,a){
    const data = Object.assign({},{da:a * Math.PI / 180, cx: c.x, cy:c.y, x1:pi.x, y1:pi.y})
    const dx = pi.x - c.x, dy = pi.y - c.y;
    //data.r = Math.hypot(dx, dy);
    const cos = Math.cos(data.da), sin = Math.sin(data.da);
    const pf = {x: c.x + dx*cos -dy*sin, y: c.y + dx*sin + dy*cos}; //Giro de "a" grados
    data.x2 = pf.x, data.y2 = pf.y;
    return arc2PC2SVG( c, Math.hypot(dx, dy) ,pi, pf, 'antiClock')
}
//subtype:'way', cx: prf.x0, cy: prf.y0, x0: prf.xi, y0: prf.yi, x1: prf.xf, y1: prf.yf, way: arcWay
export function arcWay(data ){//https://www.w3.org/TR/SVG/implnote.html
    //const newdata = Object.assign({}, {x0: data.cx, y0: data.cy, x1:data.x0, y1:data.y0},{x2:data.x1,  y2:data.y1, way:data.way});
    //const lx0 = data.x0 - data.cx, ly0 = data.y0 - data.cy;
    //const lx1 = data.x1 - data.cx, ly1 = data.y1 - data.cy;

    //newdata.r = Math.hypot(lx0, ly0);
    const newdata = arc2PC2SVG( {x:data.cx, y:data.cy}, data.r, {x:data.x0, y:data.y0}, {x:data.x1, y:data.y1}, data.way);
    
    // const a1 = Math.atan2 (ly0, lx0);
    // const a2 = Math.atan2 (ly1, lx1);
    // let delta = a2 - a1;
    
    // newdata.a = delta;
    // if(delta > 0){
    //     delta = (data.way==='clock') ? delta - 2*Math.PI:delta;
    // } else{
    //     delta = (data.way==='clock') ? delta : delta + 2*Math.PI;
    // }
    // newdata.fA = Math.abs(delta) > Math.PI ? 1 : 0;
    // newdata.fS = delta > 0? 1: 0;
    return newdata;
}
// dxf tiene centro, radio, ai, af y delta
export function arcDxf(data){
    const {cx, cy, r, ai, af} = data;
    //const data = {cx:cx, cy:cy, r:r, way:'antiClock'};

    const x1 = cx + r*Math.cos(ai), y1 =  cy + r*Math.sin(ai) ;
    const x2 = cx + r*Math.cos(af), y2 =  cy + r*Math.sin(af) ;

    let delta = normalize_radians(af - ai) ; 
        //Por normalizar un poco lo de clock a lo que usa svg, sweep=0 es el "normal"
    const fA = (Math.abs(delta) > Math.PI) ? 1 : 0;
    
    return {cx: cx, cy:cy, r:r, ai:ai, da: delta, fA:fA, fS:0, way:'antiCLock', x1:x1, y1:y1, x2:x2, y2:y2};
}
// calcula el arco a partir de dos puntos y la longitud del arco, no hay fórmula cerrada, usamos Newton-Raphson
export function arc2PL(p1, p2, arcLength, way='clock'){
    /** fórmula de Newton, preguntado a chatgpt */
    function radiusFromCordAndArcLength(d, L, tol = 1e-9, maxIter = 50) {
        // Ecuación: f(R) = 2R * sin(L/(2R)) - d = 0
        function f(R) {
            return 2 * R * Math.sin(L / (2 * R)) - d;
        }
        // Derivada: f'(R)
        function fprime(R) {
            let t = L / (2 * R);
            return 2 * Math.sin(t) - (L / R) * Math.cos(t);
        } 
        if((0.5*d < L/Math.PI) || (d > L)) return undefined
        // Estimación inicial
        //El algoritmo es sensible a la estimación inicial, deberíamos buscar una mejor forma
        //Como mínimo el radio es d/2 (arco de 180º), y como mucho L/π (arco casi plano)
        //uso un valor de r intemedio en que la sagita es medio radio. 
        let R = L - Math.sqrt(L*L - d*d);
        //let R = d / 2 + 0.0001; // evitar división por cero
        for (let i = 0; i < maxIter; i++) {
            let fR = f(R);
            let fRprime = fprime(R);
            if (Math.abs(fRprime) < 1e-12) break; // evitar division por cero
            let Rnext = R - fR / fRprime;
            if (Math.abs(Rnext - R) < tol) {
                return Rnext; // convergencia
            }
            R = Rnext;
        }
        return R; // mejor aproximación encontrada
    }
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y );
    const r = radiusFromCordAndArcLength(d, arcLength);
    console.log(r);
    if(r === undefined) return undefined;
    const sols = centerFrom2PR( {x0:p1.x, y0:p1.y, x1:p2.x, y1:p2.y, r:r} );
    if(!sols) return undefined;
    const sol = way==='clock'?sols[0]:sols[1];
    return arc2PC2SVG({x:sol.x0, y:sol.y0}, r, p1, p2, way)
}

export function pointWithinArcSweep(arc, p, eps = geometryPrecision){
        //Habría que afinar con eps pero implica pasar a alfa = atan2(eps/r) o algo así... TODO
        let a = Math.atan2(p.y - arc.cy, p.x - arc.cx)
        //el arco tiene calculados el alfa inicial(a1) y el delta (da, con signo)  
        //Uso el mismo cálculo de delta que se usa para inicializar el arco
        let delta = normalize_radians(a - arc.ai) ;
        delta = arc.fS === 1 ? delta - _2PI : delta;
        if(arc.da >= 0){
            return ((delta>=0) && (delta <= arc.da))
        } else {
            return ((delta<=0) && (delta >= arc.da))
        }
    }

//rutina pesada que calcula los puntos de corte entre los elementos que se le pasan, mirando dos a dos

//Esta rutina solo va a devolver los puntos, así que filtramos la info que no aporta
//cada corte viene con un tipo y uno o dos puntos de corte, lo debemos tener en cuenta aquí
export function findAllCuts(elements) { //busca los cortes , un array de ellos
    let els = Array.from(elements); //work copy
    let points = [], cuts;
    function cutPoint(x,y){
        return(Object.assign({}, {type : 'cut-point', x0 : x, y0 : y}));
        //this.cutType = k;    
    }
    function getCutPoints(cuts){
        if(cuts.r === Cut.TwoIntersects){
            return [].concat(cutPoint(cuts.point1.x, cuts.point1.y), cutPoint(cuts.point2.x, cuts.point2.y));
        } else if((cuts.r === Cut.TrueIntersect) || (cuts.r === Cut.OneIntersect) || (cuts.r === Cut.TangentIntersect)){
            return [cutPoint(cuts.point.x, cuts.point.y)]; //este es solo un punto
        }
        return [];
    }
    while (els.length > 1) {
        let e = els.shift();
        if (e.type === 'segment') {
            els.forEach(f => {
                if (f.type === 'segment'){
                    points.push(...getCutPoints(line_line_intr(e, f, geometryPrecision)));
                }
                else if ((f.type === 'circle') || (f.type === 'arc')){
                    points.push(...getCutPoints (segment_arc_intr(e, f, geometryPrecision)));  //args: segment, arc
                }
            });
        } else if (e.type === 'circle') {
            els.forEach(f => {
                if (f.type === 'segment'){
                    points.push(...getCutPoints( segment_arc_intr(f, e, geometryPrecision)));    //args: segment, arc
                }
                else if (f.type === 'circle'){
                    points.push(...getCutPoints( circle_circle_intr(e, f, geometryPrecision)));
                }
                else if (f.type === 'arc'){
                    points.push(...getCutPoints( circle_arc_intr(e, f, geometryPrecision)));       //args: circle, arc
                }
            });
        } else if (e.type === 'arc'){
            els.forEach(f => {
                if (f.type === 'segment'){
                    points.push(...getCutPoints( segment_arc_intr(f, e, geometryPrecision)));    //args: segment, arc
                }
                else if (f.type === 'circle'){
                    points.push(...getCutPoints( circle_arc_intr(f, e, geometryPrecision)));  //args: circle, arc
                }
                else if (f.type === 'arc'){
                    points.push(...getCutPoints( arc_arc_intr(e, f, geometryPrecision)));
                }
            });
            
        }
    }
    points = Array.isArray(points)?points:[points];
    //console.log(points);
    return points;
    }

//------------------ Funciones geométricas agrupadas --------------------
export function blockClone( block){
    return structuredClone(block);
}
export function blockTranslate( block, dx, dy){
    switch(block.type){
        case 'segment': return segmentTranslate(block, dx, dy);
        case 'circle': return circleTranslate(block, dx, dy);
        case 'arc': return arcTranslate(block, dx, dy);
        case 'polygon': return polygonTranslate(block, dx, dy);
        case 'path': return pathTranslate(block, dx, dy);
        case 'bezier': return bezierTranslate(block, dx, dy);
        case 'point' : return translatePoint(block.x0, block.y0, dx, dy);
        default: console.log('no contemplado');
    }
}
export function blockRotate( block, x, y, alfa){
    switch(block.type){
        case 'segment': return segmentRotate(block, x, y, alfa);
        case 'circle': return circleRotate(block, x, y, alfa);
        case 'arc': return arcRotate(block, x, y, alfa);
        case 'polygon': return polygonRotate(block, x, y, alfa);
        case 'path': return pathRotate(block, x, y, alfa);
        case 'bezier': return bezierRotate(block, x, y, alfa);
        default: console.log('no contemplado');
    }
}
export function blockScale( block, x, y, scale){
    switch(block.type){
        case 'segment': return segmentScale(block, x, y, scale);
        case 'circle': return circleScale(block, x, y, scale);
        case 'arc': return arcScale(block, x, y, scale);
        case 'polygon': return polygonScale(block, x, y, scale);
        case 'path': return pathScale(block, x, y, scale);
        case 'bezier': return bezierScale(block, x, y, scale);
        default: console.log('no contemplado');
    }
}
export function blockSymmetryX(block, y){
    switch(block.type){
        case 'segment': return segmentSymmetryX(block, y);
        case 'circle': return circleSymmetryX(block, y);
        case 'arc': return arcSymmetryX(block, y);
        case 'polygon': return polygonSymmetryX(block, y);
        case 'path': return pathSymmetryX(block, y);
        case 'bezier': return bezierSymmetryX(block, y);
        default: console.log('no contemplado');
    }
}
export function blockSymmetryY(block, x){
    switch(block.type){
        case 'segment': return segmentSymmetryY(block, x);
        case 'circle': return circleSymmetryY(block, x);
        case 'arc': return arcSymmetryY(block, x);
        case 'polygon': return polygonSymmetryY(block, x);
        case 'path': return pathSymmetryY(block, x);
        case 'bezier': return bezierSymmetryY(block, x);
        default: console.log('no contemplado');
    }
}
export function blockSymmetryL(block, s){
    switch(block.type){
        case 'segment': return segmentSymmetryL(block, s);
        case 'circle': return circleSymmetryL(block, s);
        case 'arc': return arcSymmetryL(block, s);
        case 'polygon': return polygonSymmetryL(block, s);
        case 'path': return pathSymmetryL(block, s);
        case 'bezier': return bezierSymmetryL(block, s);
        default: console.log('no contemplado');
    }
}
export function blockReverse( block){
    switch(block.type){
        case 'segment': return segmentReverse(block);
        case 'circle': return ()=>{};
        case 'arc': return arcReverse(block);
        case 'polygon': return ()=>{};
        case 'path': return pathReverse(block);
        case 'bezier': return bezierReverse(block);
        default: console.log('no contemplado');
    }
}
    
export function blockLength( block){
    switch(block.type){
        case 'segment': return segmentLength(block);
        case 'circle': return circleLength(block);
        case 'arc': return arcLength(block);
        case 'polygon': return polygonLength(block);
        case 'path': return pathLength(block);
        //case 'bezier': return bezierLength(block);
        case 'point' : return 0;
        default: console.log('no contemplado');
    }
}
export function blockMidpoint( block){
    switch(block.type){
        case 'segment': return segmentMidpoint(block);
        case 'circle': return {x:block.cx - block.r, y:block.cy};
        case 'arc': return arcMidpoint(block);
        case 'polygon': 
        
        //case 'bezier': return bezierMidPoint(block);
        case 'point' :
        case 'path': 
        default: console.log('no contemplado');
    }
}
export function blockSplitAtPoints( block, points){
    switch(block.type){
        case 'segment': return segmentSplitAtPoints(block, points);
        //case 'circle': return circleSplitAtPoints(block, points);
        case 'arc': return arcSplitAtPoints(block, points);
        case 'polygon':
        case 'path': 
        case 'bezier':
        default: console.log('no contemplado');
    }
}