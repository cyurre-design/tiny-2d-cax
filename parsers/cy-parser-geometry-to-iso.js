import { bezierApproximate } from "../cy-geometry/cy-geo-elements/cy-bezier.js";

//YURRE: para casa, paso cabecera, pre y post, que parece mucho más fácil de getsionar.
// tal vez podría haber un pre y un post para los patrones...
/**
 *
 * @param {Array} paths
 * @param {String} header   : Comment for start of path
 * @param {String} footer   : Comment for end of Path
 * @param {String} pre      : Instructions before path (like go downwards)
 * @param {String} post     : Instructions after path (like go upwards)
 * @returns
 */
//Global de módulo
let defaults = {
    header: `;'Programa generado automáticamente'\nG90\nF1000\n`,
    footer: "S0 M5\nM30\n",
    pre: ``,
    post: ``,
    decimals: 2,
};
let myRound = (x) => Math.round(x * 10000) / 10000;
export function setGCodeDefaults(data) {
    Object.assign(defaults, data);
    const n = Math.pow(10, defaults.decimals);
    myRound = (x) => Math.round(x * n) / n;
}

//Uso nomenclatura "normal" sin signo igual entre eje y cota
function strCotas(x, y) {
    //escribimos ejecota o eje=cota según tenga o no número el nombre del eje
    //Al loro porque x? es false para x=== 0 , !!!!
    return `${x !== undefined ? "X" + myRound(x) : ""} ${y !== undefined ? "Y" + myRound(y) : ""}`;
}
//Me pasan el modelo entero, capas y bloques, pero en iso no usamos las capas, cogemos el blocks en el orden que venga
//O bien el orden podría darse de forma interactiva.
//Ye provisional, hay que hacer esto en la parte de CAM
export function geometryToIso(model) {
    const paths = Array.from(model.blocks).filter((b) => b.type === "path");
    return pathsToIso(paths);
    //podríamos hacer algo específico con los circle y tal, pero sigue siendo CCAM
}
export function pathsToIso(paths) {
    let str = defaults.header + "\n"; //just in case
    str = paths.reduce((acc, p) => (acc += singlePathToIso(p) + "\n"), str);
    return str + "\n" + defaults.footer;
}
//function circlesToIso(circles, header, footer, pre, post){
// let str = header;
// str = paths.reduce((acc,p)=> acc += pre +'\n' + yy_pathToIso(p) + '\n' + post + '\n', str );
// return(str);
//}
// function myRound(x) {
//     return (Math.round(x * 10000) / 10000);
// }
//Ya he quitado los moves y los puntos, solo geometría
//La parte tecnológica debe resolverse antes de llegar aquí, de forma interactiva a poder ser (chaflanes, entradas...)
function singlePathToIso(path = { elements: [] }) {
    function arc2iso(a) {
        let str = "";
        let deltc = { x: a.cx - a.pi.x, y: a.cy - a.pi.y }; //test by cross product
        if (a.way === "antiClock") str += `G03 ${strCotas(a.pf.x, a.pf.y)} I${myRound(deltc.x)} J${myRound(deltc.y)} \n`;
        else str += `G02 ${strCotas(a.pf.x, a.pf.y)} I${myRound(deltc.x)} J${myRound(deltc.y)} \n`;
        return str;
    }
    //let {_I, _J} = processConfig(configM);
    //let {formatX, formatY} = strFormatCota(configM, false);
    let str = `${defaults.post}\nG0 ${strCotas(path.elements[0].pi.x, path.elements[0].pi.y)}\n${defaults.pre}\n`;
    path.elements.forEach((el) => {
        switch (el.type) {
            case "segment":
                str += `G01 ${strCotas(el.pf.x, el.pf.y)} \n`;
                break;
            case "arc":
                str += arc2iso(el);
                break;
            case "bezier":
                {
                    //este hay que aproximarlo
                    let arcs = bezierApproximate(el, defaults.bezierTolerance || 0.1); //esto hay que afinar la tolerancia
                    arcs.forEach((a) => (str += arc2iso(a)));
                }
                break;
        }
    });
    return str;
}
