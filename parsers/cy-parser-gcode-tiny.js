"use strict";

import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";

const cmdRegEx = /([MTSXYZGIJKR])([-+]?[0-9]*\.?[0-9]+)/gi;

//Separo por líneas y las voy leyendo pasoa paso.
//Con pocas restricciones tengo siempre comando-valor
export function gcodeToGeometry(gcode) {
    function parsePath(lines) {
        //recibo un string, que puede incluir cr,lf, etc... que son whitespace
        const paths = [];
        const elements = [];
        //si creo el path al comienzo, el push no genera el bbox...
        //globales, determinan el funcionamiento en incremental o absoluto y corte o no corte en laser
        let inc = false; //por defecto en absolutas
        let moving = true; //por defecto G0
        let movingType = 0; //0=G0
        //let _M=0, _T=0, _F=0, _S=0, Z=0;
        let X = 0,
            Y = 0; //posiciones a ir
        let M = 0,
            F = 0,
            S = 0;
        let I = 0,
            J = 0,
            R = 0;
        let cpx = 0,
            cpy = 0;

        for (let il = 0; il < lines.length; il++) {
            let l = lines[il];
            if (l.startsWith(";")) continue;
            l = l.toUpperCase(l);
            l = l.replaceAll(/\s+/g, "");
            if (l.length === 0) continue;

            let commands = l.match(cmdRegEx);
            if (commands === null) continue;
            commands = commands.map((cmd) => cmd.trim());

            //Analizo la línea
            let _X = NaN,
                _Y = NaN,
                _I = NaN,
                _J = NaN,
                _R = NaN,
                _M = NaN,
                _F = NaN,
                _S = NaN,
                _G = [];
            for (let ix = 0; ix < commands.length; ix++) {
                const command = commands[ix];
                switch (command.at(0)) {
                    case "M":
                        _M = parseInt(command.substring(1));
                        break;
                    //case 'T':   _T = parseInt(command.substring(1)); break;
                    case "F":
                        _F = parseFloat(command.substring(1));
                        break;
                    case "S":
                        _S = parseFloat(command.substring(1));
                        break;
                    case "I":
                        _I = parseFloat(command.substring(1));
                        break;
                    case "J":
                        _J = parseFloat(command.substring(1));
                        break;
                    case "R":
                        _R = parseFloat(command.substring(1));
                        break;
                    case "X":
                        _X = parseFloat(command.substring(1));
                        break;
                    case "Y":
                        _Y = parseFloat(command.substring(1));
                        break;
                    case "G":
                        _G.push(parseInt(command.substring(1)));
                        break;
                }
            }

            //miramos si hay G0,G1,G2,G3,G91, el resto son puramente de ejecución, aquí lo queremos para pintar
            let gix = _G.findLastIndex((g) => g === 90 || g === 91);
            if (gix > -1) inc = _G[gix] === 90 ? false : true;
            //Le doy prioridad a lo último que encuentre,
            gix = _G.findLastIndex((g) => g === 0 || g === 1 || g === 2 || g === 3);
            if (gix > -1 && _G[gix] === 0) {
                //genero un nuevo path
                if (elements.length > 0) {
                    paths.push(createDrawElement("path", { elements: elements }));
                    elements.length = 0;
                }
                moving = true;
            } else if (_G[gix] < 4) {
                //estoy moviendo con corte
                moving = false;
                movingType = _G[gix]; //G1,G2,G3
            }
            //solo guardo la última cota, No voy a dar error en X duplicadas, es un prototipo, aunque sería trivial
            //solo genero bloque si hay geometría, es para pintar
            let flag = false;
            if (!isNaN(_X)) {
                X = inc ? X + _X : _X;
                flag = true;
            }
            if (!isNaN(_Y)) {
                Y = inc ? Y + _Y : _Y;
                flag = true;
            }
            if (flag && (movingType === 2 || movingType === 3)) {
                //si no hay X o Y ni miro
                //I,J van en pareja, si existe uno, el otro existe o se pone a 0, no es modal
                if (isNaN(_I) && isNaN(_J) && isNaN(_R)) {
                    console.log("G2/G3 sin I,J ni R");
                } else if (!isNaN(_R)) {
                    if (_R === 0) {
                        console.log("G2/G3 con R=0");
                    } else R = _R;
                    if (!isNaN(_I) || !isNaN(_J)) {
                        console.log("G2/G3 con R e I/J, se ignoran I/J");
                    }
                } else {
                    //O I o J tienen que estar definidos
                    if (!isNaN(_I)) {
                        I = _I;
                        J = isNaN(_J) ? 0 : _J;
                    } else if (!isNaN(_J)) {
                        J = _J;
                        I = isNaN(_I) ? 0 : _I;
                    }
                }
            }

            if (flag && !moving) {
                switch (movingType) {
                    case 1:
                        elements.push(createDrawElement("segment", { subType: "PP", x0: cpx, y0: cpy, x1: X, y1: Y }));
                        break;
                    case 2:
                    case 3: //I y J son siempre offsets y creo que no les afecta el estar en incremental o absoluto
                        if (!isNaN(_R)) {
                            elements.push(
                                createDrawElement("arc", {
                                    subType: "2PR",
                                    x0: cpx,
                                    y0: cpy,
                                    x1: X,
                                    y1: Y,
                                    r: R,
                                    way: movingType === 2 ? "clock" : "antiClock",
                                }),
                            );
                        } else {
                            elements.push(
                                createDrawElement("arc", {
                                    subType: "way",
                                    cx: cpx + I,
                                    cy: cpy + J,
                                    x0: cpx,
                                    y0: cpy,
                                    x1: X,
                                    y1: Y,
                                    way: movingType === 2 ? "clock" : "antiClock",
                                }),
                            );
                        }
                        console.log("G2", X, Y, _I, _J);
                        break;
                    default:
                        break;
                }
            }
            //pero la posición se incrementa
            ((cpx = X), (cpy = Y));
        }
        if (elements.length > 0) paths.push(createDrawElement("path", { elements: elements }));
        return paths;
    }
    //Aquí llega un churro tipo file
    const lines = gcode.split(/[\n,\r,\n\r]/);
    const paths = parsePath(lines);
    return paths;
}
