"use strict";

//Punto y rectángulo los consideramos comunes, así como distancia.

import {  distancePointToPoint, geometryPrecision, geometryPrecision2, sqDistancePointToPoint } from './fg-geometry-basic-elements.js';
export * from './fg-geometry-basic-elements.js';


//Es la resolución de ecuaciones cuadráticas, que hay mejor que la del cole
//YURRE: error de corte en tangencias, puede haber un discrimante muy muy pequeño pero negativo, hacemos 0
export function _solveq(a, b, c) {
    let discriminante = (b * b - 4 * a * c);
    if (Math.abs(discriminante) <= geometryPrecision) return [-b / (2 * a)];
    if (discriminante < 0) return []; //La sqrt da Nan si es disc < 0
    discriminante = Math.sqrt(discriminante);
    let x1 = (b < 0) ? (-b + discriminante) / (2 * a) : (-b - discriminante) / (2 * a);
    return [x1, c / (a * x1)]; //copiado de libro, es para mejorar los errores de cálculo 
}
//Lo hacemos en formato ax+by+c=0, para líneas infinitas aunque no chequeamos aquí que lo sean.
//nuestra línea es uy*x - ux*y + c = 0  (Ax+By+C=0 con A*A + B*B = 1)
//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
// la fórmula de distancia es d= |a*x0 + b*y0 + c| / sqrt(a*a + b*b). nuestro denominador es 1
export function distancePointToLine(p, l) {
    return Math.abs(p.x * l.uy - p.y * l.ux + l.c);
}
//Esta solo tiene sentido si son paralelas
//https://en.wikipedia.org/wiki/Distance_between_two_parallel_lines
// la fórmula sería d = |c2 - c1| / sqrt(a*a + b*b)  , a y b son iguales porque son paralelas y el deonminador es 1 por nuestra definición de recta

export function distanceLineToLine(l1, l2) {
    if ((Math.abs(Math.abs(l1.ux) - Math.abs(l2.ux)) > geometryPrecision) || (Math.abs(Math.abs(l1.uy) - Math.abs(l2.uy)) > geometryPrecision)) return 0; //se cortan
    return Math.abs(l1.c - l2.c); 
}
export function angleBetweenLines(l1, l2) {
    return (l1.alfa - l2.alfa);
}
export function lineNormalToLine(l, p) { //si no se define p, línea con el mismo p0 que la original
    const pn = p ? p : l.p0;
    return new Line(pn.x, pn.y, l.alfa+90);
}
//meto matrices y rotaciones, etc... aquí en lugar de en la clase, así será más fácil de portar
//
export function rotateZ(x, y, alfa){
    const c = Math.cos(alfa), s = Math.sin(alfa);
    return [x*c - y*s, x*s + y*c]
}
export function translate(x,y, dx, dy){

    
}
//Otra función genérica para calcular corte de dos rectas que vienen con su punto inicial y final....
//Lo hacemos en formato ax+by+c=0, para líneas infinitas aunque no chequeamos aquí que lo sean.
//TODO: meter la precisión, debe ser lo mismo que para las paralelas.
export function _lineCutsToLine(l1, l2) {
    let discriminante =  l1.uy * l2.ux - l2.uy * l1.ux;
    if (discriminante === 0) return []; //EPSILON?
    return [{x: (-l2.ux * l1.c + l1.ux * l2.c) / discriminante, y: (l1.uy * l2.c - l1.c * l2.uy) / discriminante}];
}

// Lo hacemos en formato ax+by+c=0 con a*a + b*b = 1
export function lineCutsToCircle(l, c) {  // a revisar si es suficiente, me paso en formato infinito, b = -ux y a = uy
    if (Math.abs(l.uy) >= Math.abs(l.ux)) { //x = my + x0
        //calculo x despejando y:  x^2*(1+m^2) + 2x*(m*y0-cx-m*cy) + y0^2 - 2*y0*cy + rest
        let m = l.ux / l.uy;
        let x0 = -l.c / l.uy;
        let solutions = _solveq(1 + m * m, 2 * (m * (x0 - c.x) - c.y), c.y * c.y + (x0 - c.x) * (x0 - c.x) - c.r * c.r);
        return solutions.map(s => ({y: s, x: x0 + m * s}));
    } else { //y = mx + y0
        let m = l.uy / l.ux;
        let y0 = l.c / l.ux;
        let solutions = _solveq(1 + m * m, 2 * (m * (y0 - c.y) - c.x), (y0 - c.y) * (y0 - c.y) + c.x * c.x - c.r * c.r);
        return solutions.map(s => ({y: y0 + m * s, x: s}));
    }
}
//http://www.ambrsoft.com/TrigoCalc/Circles2/Circles2Tangent_.htm
//pero operamos un poco para tener la fórmula 
//xt = ((xp-a)+-(yp-b)*sqrt(D^2-1))/D^2
//xt, yt son los puntos de similaridad
export function lineTangentToCircleAndCircle(c0, c1) {
    console.log("lineTangentToCircleAndCircle");
    
    let solutions = [];
    let xp, yp, res0, res1;
    //p. vectorial a,b
    const cross = (a, b) => (a.x * b.y - a.y * b.x);
    const sortSolutions2 = (s0, s1) => { //las asigno de forma que el signo del p. vectorial de (xp,yp) al p.tangente sea el mismo en los índices
        let sg0 = Math.sign(cross({x: s0[0].x - xp, y: s0[0].y - yp}, {x: c0.x - xp, y: c0.y - yp}));
        let sg1 = Math.sign(cross({x: s1[0].x - xp, y: s1[0].y - yp}, {x: c1.x - xp, y: c1.y - yp}));
        if (sg1 !== sg0) [s1[0], s1[1]] = [s1[1], s1[0]];
    }
    // function sortSolutions(sol){
    //     if((sol[0].x-xp)*v.y >= (sol[1].y-yp)*v.x){ //orden arbitrario
    //         [sol[0], sol[1]] = [sol[1], sol[0]];
    //     }
    // }
    //Si los circulos están uno dentro de otro NO hay tangentes
    let dcc = distancePointToPoint(c0.x, c0.y, c1.x, c1.y);
    if ((dcc - Math.abs(c0.r - c1.r)) < -geometryPrecision) return []; //No hay soluciones
    if (dcc >= Math.abs(c0.r - c1.r)) { //Hay tangentes exteriores por lo menos, aunque igual solo una...
        //Tangentes exteriores
        if (Math.abs(c0.r - c1.r) < geometryPrecision) { //las tangentes no se cortan sino que son paralelas
            let r = c0.r;
            let d = distancePointToPoint(c0.x, c0.y, c1.x, c1.y);
            let s = r * (c1.y - c0.y) / d;
            let c = r * (c1.x - c0.x) / d;

            let p0 = new Point(c0.x + s, c0.y - c);
            let p1 = new Point(c1.x + s, c1.y - c);
            let line1 = new Line(p0.x, p0.y, p1.x, p1.y);
            line1._points.push(p0);
            line1._points.push(p1);
            solutions.push(line1);

            p0 = new Point(c0.x - s, c0.y + c);
            p1 = new Point(c1.x - s, c1.y + c);
            let line2 = new Line(p0.x, p0.y, p1.x, p1.y);
            line2._points.push(p0);
            line2._points.push(p1);
            solutions.push(line2);
        } else { //xp,yp es el punto de corte de las tangentes exteriores
            xp = (c1.x * c0.r - c0.x * c1.r) / (c0.r - c1.r); 
            yp = (c1.y * c0.r - c0.y * c1.r) / (c0.r - c1.r);
            res0 = _pointTangentToCircle({x: xp, y: yp}, c0);
            if (res0.length === 1) {
                let line = new Line(res0[0].x, res0[0].y, (180 / Math.PI) * Math.atan2(res0[0].x - c0.x, res0[0].y - c0.y));
                line._points.push(new Point(res0[0].x, res0[0].y));
//                line.p0 = new Point(res0[0].x, res0[0].y);
                solutions.push(line);
            } else {
                res1 = _pointTangentToCircle({x: xp, y: yp}, c1);
                //las soluciones no tienen por qué venir en el mismo orden, hay una a cada lado de la recta que une punto de corte y centro
                // v = {x:c0.x - xp, y:c0.y - yp};             // v es común a ambos centros, xp,yp está en la recta que los une, por definición
                // sortSolutions(res0);
                // sortSolutions(res1);
                sortSolutions2(res0, res1);

                let p0 = new Point(res0[0].x, res0[0].y);
                let p1 = new Point(res1[0].x, res1[0].y);
                let line1 = new Line(p0.x, p0.y, p1.x, p1.y);
                line1._points.push(p0);
                line1._points.push(p1);
                solutions.push(line1);
    
                p0 = new Point(res0[1].x, res0[1].y);
                p1 = new Point(res1[1].x, res1[1].y);
                let line2 = new Line(p0.x, p0.y, p1.x, p1.y);
                line2._points.push(p0);
                line2._points.push(p1);
                solutions.push(line2);
            }
        }
    }

    if (dcc >= (c0.r + c1.r)) { //Hay tangentes interiores que se cortan en xp,yp
        xp = (c1.x * c0.r + c0.x * c1.r) / (c0.r + c1.r);
        yp = (c1.y * c0.r + c0.y * c1.r) / (c0.r + c1.r);
        res0 = _pointTangentToCircle({x: xp, y: yp}, c0);
        if (res0.length === 1) {
            let line = new Line(res0[0].x, res0[0].y, (180 / Math.PI) * Math.atan2(res0[0].x - c0.x, res0[0].y - c0.y));
//            line.p0 = new Point(res0[0].x, res0[0].y);
            line._points.push(new Point(res0[0].x, res0[0].y));
            solutions.push(line);
        } else {
            res1 = _pointTangentToCircle({x: xp, y: yp}, c1);
            sortSolutions2(res0, res1);

            let line1 = new Line(res0[0].x, res0[0].y, res1[0].x, res1[0].y);
            line1._points.push(new Point(res0[0].x, res0[0].y));
            line1._points.push(new Point(res1[0].x, res1[0].y));
            solutions.push(line1);

            let line2 = new Line(res0[1].x, res0[1].y, res1[1].x, res1[1].y);
            line2._points.push(new Point(res0[1].x, res0[1].y));
            line2._points.push(new Point(res1[1].x, res1[1].y));
            solutions.push(line2);
        }
    }

    return solutions;
}
//línea que pasa por un punto y es tangente a una circunferencia (hay dos)
export function lineTangentToPointAndCircle(p, c) {
    let solutions = [];
    let res0 = _pointTangentToCircle(p, c);
    if (res0.length === 1) { //caso de tangencia interior, no le pongo el punto p0 porque coincide con el original
        solutions.push(new Line(res0[0].x, res0[0].y, (180 / Math.PI) * Math.atan2(res0[0].x - c.x, res0[0].y - c.y)));
    } else {
        res0.forEach(e => {
            let line = new Line(p.x, p.y, e.x, e.y);
            line._points.push(new Point(e.x, e.y));
            solutions.push(line);
        });
    }

    return solutions;
}
//función auxiliar , línea que pasas por un punto y tangente a una circunferencia
function _pointTangentToCircle(p, c) {
    let rest = p.x * c.x + p.y * c.y - c.x * c.x - c.y * c.y + c.r * c.r;
    if (Math.abs(c.x - p.x) >= Math.abs(c.y - p.y)) { //x=mx+x0
        let m = -(c.y - p.y) / (c.x - p.x);
        let x0 = -rest / (c.x - p.x);
        let solutions = _solveq(1 + m * m, 2 * (m * (x0 - c.x) - c.y), (x0 - c.x) * (x0 - c.x) + c.y * c.y - c.r * c.r);
        return solutions.map(s => ({x: x0 + m * s, y: s}));
    } else { //y = mx+y0
        let m = -(c.x - p.x) / (c.y - p.y);
        let y0 = -rest / (c.y - p.y);
        let solutions = _solveq(1 + m * m, 2 * (m * (y0 - c.y) - c.x), c.x * c.x + (y0 - c.y) * (y0 - c.y) - c.r * c.r);
        return solutions.map(s => ({x: s, y: y0 + m * s}));
    }    
}
//tangente a círculo c paralela a la línea l
//primero lanzo una recta que pasa por el centro de cy es paralela a l
//en los punto de corte calculo las dos paraleas a la original 
export function lineTangentToLineAndCircle(l, c) { 
    let a = l.alfa + 90;
    let la = new Line(c.x, c.y, (a > 360) ? a : a - 360); //pasa por el centro y perpendicular a la dada
    let res = lineCutsToCircle(la, c); //busco los puntos de corte
    let solutions = []; //deberían ser dos salvo que ya toque, pero cuando toca también salen 2
    //Las rectas son paralelas a la original por usar el mismo alfa en el constructor
    //Alguna de ellas puede coincidir con la original y no la devuelvo
    res.forEach(p => {
        let line = new Line(p.x, p.y, l.alfa);
        if (!line.isEqual(l)) {
            line.p0 = new Point(p.x, p.y);
            solutions.push(line);
        }
    });
    return solutions;
}
 //corte entre circunferencias, si son el "mismo" círculo no devuelvo nada ([])                 
function _circleCutsToCircle(c1, c2) {
    let d = distancePointToPoint(c1.x, c1.y, c2.x, c2.y);
    if (d > (c1.r + c2.r)) return [];
    //intersección, los puntos están en una recta perpendicular a la que une sus centros 
    // 2(x1-x0)*x + 2(y1-y0)*y + x0*x0+y0*y0+x1*x1+y1*y1-r0*r0+r1*r1 = 0 perpendicular a la que une los centros,
    // los cortes de esa línea con cualquiera de las circunferencias son los puntos buscados
    let res = [];
    if (c1.x !== c2.x || c1.y !== c2.y) {
        res = lineCutsToCircle({uy: (c2.x - c1.x) / d, ux: -(c2.y - c1.y) / d, c: (c1.x * c1.x + c1.y * c1.y - c2.x * c2.x - c2.y * c2.y - c1.r * c1.r + c2.r * c2.r) / (2 * d)}, c1);
    }
    return res;
}
//En realidad miramos el corte de los círculos... 
export function circleCutsToArc(cx, cy, r, acx, acy, acr) {
    return _circleCutsToCircle(new Circle(cx, cy, r), new Circle(acx, acy, acr));
}
//circunferencia de radio red que pasa por un punto y es tangente a otra circunferencia dada
//pasa por p0 y tangente a c,corte de dos círculos de radio red alrededor de p y de radio R+-red
//los posibles centros de los círculos tangentes tienen que estar en la circunferencia (cx,cy,r+-red)
//y además deben estar en la circunferencia (p.x, p.y, red)
//los puntos de corte de ambas circunferencias son los centros de las circunferencias buscadas
//devolvemos además los puntos de tangencia calculados con _tgpoint
export function circleTangentToPointAndCircle(p, c, red) { 
    if (red === undefined) return;
    let d = distancePointToPoint(p.x, p.y, c.x, c.y);
    if (d > (c.r + 2 * red)) return [];             //separación de punto a circunferencia mayor que el diámetro solicitado
    //buscamos todos los cortes del circulo 1 +- r, +2r y el 2  +-r, +2r
    let nc1 = new Circle(c.x, c.y, c.r + red);
    let nc2 = new Circle(p.x, p.y, red);
    let res = _circleCutsToCircle(nc1, nc2); //(c+red,p+red)
    nc1.r = Math.abs(c.r - red); //(p+red, c-red)
    res = res.concat(_circleCutsToCircle(nc1, nc2)); //(c-red,p+red)
    let solutions = [];
    res.forEach(p => {
        let l = new Circle(p.x, p.y, red);
        if ((l.r !== c.r) //Si un resultado coincide con alguno de los originales no hay punto de tangencia
            || sqDistancePointToPoint(l.x, l.y, c.x, c.y) > geometryPrecision2) {

            let tg = _tgpoint(c, p, red);
            l._points.push(new Point(tg.x, tg.y));
            solutions.push(l);
        }
    });
    return solutions;
}
//circunferencias de radio red que pasan por p1 y p2
//los centros son los puntos de corte de las circunferencias (p1.x,p1.y,red) y (p2.x,p2.y,red)
export function circleTangentToPointAndPoint(p1, p2, red) {
    if (red === undefined) return;
    if (distancePointToPoint(p1.x, p1.y, p2.x, p2.y) > 2 * red) return []; //el diámetro cabe entero en medio
    //buscamos los cortes del punto 1 + r, y el 2 +r
    let solutions = [];
    let nc1 = new Circle(p1.x, p1.y, red);
    let nc2 = new Circle(p2.x, p2.y, red);
    let res = _circleCutsToCircle(nc1, nc2); //(c1+red,c2+red)
    res.forEach(r => {
        solutions.push(new Circle(r.x, r.y, red));
    });
    return solutions;
}
 //circunferencia de radio red que pasa por el punto p1 y es tangente a línea p2
 //YURRE: estamos usando la copia directa de la ecuación ?! distancePointToLine(p, l) = Math.abs(p.x * l.uy - p.y * l.ux + l.c);
 //los centros deben estar a distancia red de p1, o sea en la circunferencia (p1.x, p1.y, red)
 //y en la recta paralela a p2 pero a distancia red de ella (c +- red)
 //los puntos de corte de ambas rectas y la circunferencia son los centros de los círculos pedidos
 //Y los puntos de tangencia son los de corte de perpendicular a p2 con esos circulos
 //YURRE : revisar. la normal se puede calcular fuera!!! y alfa existe siempre
export function circleTangentToPointAndLine(p1, p2, red) {
    if (red === undefined) return;
    if (Math.abs(p1.x * p2.uy - p1.y * p2.ux + p2.c) > (2 * red)) return []; //dist p a recta excesiva
    let nc1 = new Circle(p1.x, p1.y, red);
    let la = new Line(p2.pi.x, p2.pi.y, p2.alfa);
    la.c += red;
    let res = lineCutsToCircle(la,nc1); //+r,+r
    la.c -= 2 * red;
    res = res.concat(lineCutsToCircle(la, nc1));
    let solutions = [];
    res.forEach(p => {
        let l = new Circle(p.x, p.y, red);
        let tg = _lineCutsToLine(p2, new Line(p.x, p.y, (180 / Math.PI)*Math.atan2(-p2.ux, p2.uy))); //m normal = -1/m
        l._points = l._points.concat(tg.map(p => new Point(p.x, p.y)));
        solutions.push(l);
    });
    return solutions;
}
//circunferencia tangente a dos líneas y de radio r (en principio serán líneas que se cortan...)
// los centros estarán a distancias +- r de cada una de ellas, así que hacemos sus puntos de corte
//desplazar las lineas hacia ambos lados y hallar los cortes
//La ecuación de una recta paralela a otra a distancia r es
// ax+by+c +- r*sqrt(a^2+b^2) = 0   dos soluciones, pero a^2 + b^2 es 1 en nuestro sistema normalizado
export function circleTangentToLineAndLine(l0, l1, r) {
    let res = [];   //Clono las dos líneas porque voy a hallar paralelas, se puede usar el .clone
    //let la = new _InfLineSupport(l0.pi.x,l0.pi.y,l0.alfa), lb = new _InfLineSupport(l1.pi.x,l1.pi.y,l1.alfa);
    let la = l0.clone();
    let lb = l1.clone();

    la.c += r;
    lb.c += r;
    res = res.concat(_lineCutsToLine(la, lb)); //+r,+r

    lb.c -= 2 * r;
    res = res.concat(_lineCutsToLine(la, lb)); //+r,-r

    la.c -= 2 * r;
    res = res.concat(_lineCutsToLine(la, lb)); //-r,-r

    lb.c += 2 * r;
    res = res.concat(_lineCutsToLine(la, lb)); //-r,+r

    let solutions = [];
    res.forEach(p => {
        let l = new Circle(p.x, p.y, r);
        let tg = _lineCutsToLine(l0, new Line(p.x, p.y, (180 / Math.PI) * Math.atan2(-l0.ux, l0.uy))); //mnormal = -1/m  
        l._points = l._points.concat(tg.map(p => new Point(p.x, p.y)));
        tg = _lineCutsToLine(l1, new Line(p.x, p.y, (180 / Math.PI) * Math.atan2(-l1.ux, l1.uy))); //mnormal = -1/m  
        l._points = l._points.concat(tg.map(p => new Point(p.x, p.y)));
        solutions.push(l);
    });
    return solutions;
}
//circunferencia de radio red que es tangente a otros dos circunferencias c1 y c2. Hay hasta 8 soluciones...
//los centros estarán en las circunferencias (c1.x, c1.y, r1 + red) o (c1.x, c1.y, r1 - red)
//y además también en las circunferencias  (c2.x, c2.y, r2 + red) o (c2.x, c2.y, r2 - red)
//buscamos los puntos de corte ( 2 * 2 = 4 ecuaciones y cada una me da 2 puntos de corte)
//posteriormente calculamos los puntos de tangencia con _tgpoint
export function circleTangentToCircleAndCircle(c1, c2, red) {
    if (red === undefined) return;
    if (distancePointToPoint(c1.x, c1.y, c2.x, c2.y) > (c1.r + c2.r + 2 * red )) return []; //el circulo cabe en medio de los otros :(
    //buecamos todos los cortes del circulo 1 +- r, +2r y el 2  +-r, +2r
    let nc1 = new Circle(c1.x, c1.y, c1.r + red);
    let nc2 = new Circle(c2.x, c2.y, c2.r + red);
    let res = _circleCutsToCircle(nc1, nc2); //(c1+red,c2+red)
    nc1.r = Math.abs(c1.r - red); //(c2+red, c1-red)
    res = res.concat(_circleCutsToCircle(nc1, nc2));
    nc2.r = Math.abs(c2.r - red); //(c2-red, c1-red)
    res = res.concat(_circleCutsToCircle(nc1, nc2));
    nc1.r = c1.r + red; //(c2-red, c1+red)
    res = res.concat(_circleCutsToCircle(nc1, nc2));
    let solutions = [];
    res.forEach(p => {
        let l = new Circle(p.x, p.y, red);
        if ((l.r !== c1.r && l.r !== c2.r) //Si un resultado coincide con alguno de los originales no hay punto de tangencia
            || (sqDistancePointToPoint(l.x, l.y, c1.x, c1.y) > geometryPrecision2 && sqDistancePointToPoint(l.x, l.y, c2.x, c2.y) > geometryPrecision2)) {
            let pcut = _tgpoint(c1, p, red);
            l._points.push(new Point(pcut.x, pcut.y));
            pcut = _tgpoint(c2, p, red);
            l._points.push(new Point(pcut.x, pcut.y));
            solutions.push(l);
        }
    })
    return solutions;
}
//circunferencia tangente a la recta l0 y a la circunferencia c0 con radio dado r
//los centros deben estar en las circunferrncias (c0.x, c0.y, c0.r + r) y (c0.x, c0.y, c0.r - r)
//y también deben estar en las rectas paralelas a l0 a distancia r ( l0.c + r) y (l0.c - r)
//Los cortes nos dan los centros de las circunferencias pedidas
//posteriorment calculo los puntos de tangencia con _tgpoint
export function circleTangentToCircleAndLine(l0, c0, r) {
    let la = new Line(l0.x, l0.y, l0.alfa);
    let ca = new Circle(c0.x, c0.y, c0.r + r);
    la.c += r;
    let res = lineCutsToCircle(la, ca); //l0.c + r,  c0.r + r
    la.c -= 2 * r;
    res = res.concat(lineCutsToCircle(la, ca)); //l0.c - r,  c0.r + r
    if (r < c0.r) {
        ca.r -= 2 * r;
        res = res.concat(lineCutsToCircle(la, ca)); //l0.c - r,  c0.r - r
        la.c += 2 * r;
        res = res.concat(lineCutsToCircle(la, ca)); //l0.c + r,  c0.r - r
    }
    let solutions = [];
    res.forEach(p => {
        let l = new Circle(p.x, p.y, r);
        if ((l.r !== c0.r) //Si un resultado coincide con alguno de los originales no hay punto de tangencia
            || sqDistancePointToPoint(l.x, l.y, c0.x, c0.y) > geometryPrecision2) {

            let tg = _lineCutsToLine(l0, new Line(p.x, p.y, (180 / Math.PI) * Math.atan2(-l0.ux, l0.uy))); //mnormal = -1/m  
            l._points = l._points.concat(tg.map(p => new Point(p.x, p.y)));
            tg = _tgpoint(c0, p, r);
            l._points.push(new Point(tg.x, tg.y));
            solutions.push(l);
        }
    });
    return solutions;
}
//rutinilla auxiliar que da el punto de tangencia del circulo inicial c y el nuevo con centro en p y radio r
//o sea, el punto de corte de la recta que une p y c con la circunferencia de centro c y radio r
//Hay dos posibilidades de corte, con una diferencia de 180 grados, hay que saber cual quiero por la distancia, por ejemplo
function _tgpoint(c, p, d) { //p es el circulo tangente(solo x e y), c un circulo original
    let l = distancePointToPoint(p.x, p.y, c.x, c.y);
    if (l >= d)
        return {x: c.x + c.r * (p.x - c.x) / l, y: c.y + c.r * (p.y - c.y) / l}; //+ r*seno o coseno
    else
        return {x: c.x - c.r * (p.x - c.x) / l, y: c.y - c.r * (p.y - c.y) / l}; //+ r*seno o coseno
}
//rutina pesada que calcula los puntos de corte entre los elementos que se le pasan, mirando dos a dos
export function findAllCuts(elements) { //busca los cortes , un array de ellos
    let els = Array.from(elements); //work copy
    let points = [];
    while (els.length > 1) {
        let e = els.shift();
        if (e.type === 'line') {
            els.forEach(f => {
                if (f.type === 'line')
                    points = points.concat(_lineCutsToLine(e, f).map(el => (new Point(el.x, el.y)))); //este es solo un punto
                else if (f.type === 'circle')
                    points = points.concat(lineCutsToCircle(e, f).map(el => (new Point(el.x, el.y))));
            });
        } else if (e.type === 'circle') {
            els.forEach(f => {
                if (f.type === 'line')
                    points = points.concat(lineCutsToCircle(f, e).map(el => (new Point(el.x, el.y))));
                else if (f.type === 'circle')
                    points = points.concat(_circleCutsToCircle(e, f).map(el => (new Point(el.x, el.y))));
            });
        } //si es un punto no hacemos nada, claro, seguimos
    }
    return points;
}
//el centro estará en la recta del centro al punto inicial y debe pasar por pf
export function centerOfCircleTangentToCircleAndPoint(p0, pi, pf) { //esta SIN saber el radio NI el centro
    let l = new Line(p0.x, p0.y, pi.x, pi.y); //línea del centro del arco al punto de inicio, pi + tu
    let dx = pf.x - pi.x;
    let dy = pf.y - pi.y;
    let t = (dx * dx + dy * dy) / (2 * (dx * l.ux + dy * l.uy));
    return {x: pi.x + t * l.ux, y: pi.y + t * l.uy};
}
export function centerOfCircleTangentToLineAndPoint(p0, pi, pf) { //esta SIN saber el radio NI el centro
    let l1 = new Line(p0.x, p0.y, pi.x, pi.y); //línea que incluye el segmento al que es tangente
    l1 = new Line(pi.x, pi.y, l1.alfa + 90); //perpendicular en el punto final del segmento (inicial del otro)
    let l2 = new Line(pi.x, pi.y, pf.x, pf.y); //línea que une el punto inicial y final
    l2 = new Line((pi.x + pf.x) / 2, (pi.y + pf.y) / 2, l2.alfa + 90); //perpendicular en el punto final 
    return _lineCutsToLine(l1, l2);
}
//cálculo de los centros posibles dados dos puntos y un radio
export function centerCalculate(pi, pf, r){
    return( _circleCutsToCircle(new Circle(pi.x, pi.y, r), new Circle(pf.x, pf.y, r)));
}