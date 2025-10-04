"use strict";

const tolerance = 0.1;

function fdelta(c1, c2) {
    return {x: c2.x - c1.x, y: c2.y - c1.y};
};

function sqDistanceCenterToCenter(c1, c2) {
    return (c2.x - c1.x) * (c2.x - c1.x) + (c2.y - c1.y) * (c2.y - c1.y);
}

function sortByLeftBottom(c1, c2) {
    return (c1.x === c2.x) ? c1.y - c2.y : c1.x - c2.x;
}

//Aquí los supongo ordenados de izda a dha....
function findLine(circles, tol) {
    let c0 = circles.shift(); //el más a la izquierda line.centers[0]; //find closest points, order by distance
    let centers = circles;
    centers.sort((c1, c2) => (sqDistanceCenterToCenter(c0, c1) - sqDistanceCenterToCenter(c0, c2)));
    let delta = fdelta(c0, centers[0]); 
    let l1 = centers.filter(c => (Math.abs((c.x - c0.x) * delta.y - (c.y - c0.y) * delta.x)) < tol);
    let l2 = centers.filter(c => (Math.abs((c.x - c0.x) * delta.x - (c.y - c0.y) * delta.y)) < tol);
    let l = (l1.length > l2.length) ? l1 : l2;
    circles.unshift(c0); //lo dejo como estaba...
    if (l.length >= 2)
        l.unshift(c0);
    return l;
}

export default function findDrillPattern(circles) { //let's try all circles
    //circles son los circles del radio en uso, es global para gestionarlo y borrar los que quito
    function findLinePatternForRadius(tol) {
        let lines = []; //for this radius...
        //los ordeno de izquierda a derecha y de abajo a arriba
        singles.sort(sortByLeftBottom);
        while (singles.length > 2) { //Si solo hay dos, ni mirar, son recta seguro, claro
            let l = findLine(singles, tol);
            if (l.length <= 2) //no encuentra ninguna línea
                break;
            singles = singles.filter(el => !l.includes(el));
            l.sort(sortByLeftBottom); //normalize slope, just in case
            lines.push(l);
        }
        lines.sort((l1, l2) => (l1.length - l2.length));
        return lines;
    }

    //Aquí los supongo ordenados de izda a dha....y además ya hemos quitado los patrones de línea de >= 3 puntos, 
    // y length >= 4, lógicamente, YURRE, mirar si tol o tol2
    //Aquí ya se ha mirado previamente que length >= edges!!! no chequeo
    //Es heurístico y probablemente es más limpio ir a algo de tipo K-means, etc... de la parte de clustering
    function findPolygonPattern(tol, edges) {
        let pols = [];
        while (singles.length >= edges) {
            let centers = singles.filter((e, ix) => (ix < edges));
            let gravity = centers.reduce((acc, c) => ({x: acc.x + c.x, y: acc.y + c.y}));
            gravity.x /= edges;
            gravity.y /= edges;
            let d2 = sqDistanceCenterToCenter(gravity, centers[0]);
            if (centers.some(c => (Math.abs(d2 - sqDistanceCenterToCenter(gravity, c)) > tol)))
                break; //no ha encontrado
            pols.push(centers);
            singles = singles.filter(el => !centers.includes(el));
        }
        return pols;
    }

    let patterns = [];
    let singles = [];
    let radii = circles.map(c => c.r);
    //código copiado
    let seen = {};
    radii = radii.filter(item => (seen.hasOwnProperty(item) ? false : (seen[item] = true)));
    radii.forEach(r => {
        singles = circles.filter(el => (el.r === r));
        let lines = findLinePatternForRadius(tolerance); //devuelve un array de líneas
        lines.forEach(l => patterns.push({radius: r, type: 'line', elements: l}));
        //en singles quedan los pending
        //Busco puntos que estén en una circunferencia y relativamente cerca, esto incluye rectángulos, no solo cuadrados
        //además de pentágonos, hexágonos, ... lo que busquemos.
        let pols = [];
        if (singles.length >= 6) { //busco polígonos regulares, pero no triángulos, no sé si merece
            pols = findPolygonPattern(tolerance, 6);
            pols.forEach(p => patterns.push({radius: r, type: 'hexagon', elements: p}));
        }
        if (singles.length >= 5) { //busco polígonos regulares, pero no triángulos, no sé si merece
            pols = findPolygonPattern(tolerance, 5);
            pols.forEach(p => patterns.push({radius: r, type: 'pentagons', elements: p}));
        }
        if (singles.length >= 4) { //busco polígonos regulares, pero no triángulos, no sé si merece
            pols = findPolygonPattern(tolerance, 4);
            pols.forEach((p) => patterns.push({radius: r, type: 'squares', elements: p}));
        }
        if (singles.length !== 0)
            patterns.push({radius: r, type: 'singles', elements: singles});
    });
    return patterns;
}