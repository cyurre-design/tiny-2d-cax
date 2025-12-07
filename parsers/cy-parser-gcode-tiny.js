'use strict'

//import { geometryPrecision} from '../cy-geometry/cy-geometry-library.js'
import { createDrawElement} from '../cy-geometry/cy-geometry-basic-elements.js'

const cmdRegEx = /([MTSXYZGIJK])([-+]?[0-9]*\.?[0-9]+)/gi

//Separo por líneas y las voy leyendo pasoa paso.
//Con pocas restricciones tengo siempre comando-valor
export function  gcodeToGeometry(gcode){

    function parsePath(lines){  //recibo un string, que puede incluir cr,lf, etc... que son whitespace
    const paths = [];
    let actualPath = createDrawElement('path',[]);  //global en el contexto de la función svgToGeometry
    let inc = false;        //por defecto en absolutas
    let moving = true;      //pordefecto G0
    //let _M=0, _T=0, _F=0, _S=0, Z=0;
    let _X=0, _Y=0, _G = [];
    let X = 0, Y = 0; //posiciones a ir
    let cpx = 0, cpy = 0;
    for(let il = 0; il <lines.length; il++){
        let l = lines[il];
        if(l.startsWith(';')) continue;
        l = l.toUpperCase(l);
        l = l.replaceAll(/\s+/g,'');
        if(l.length === 0) continue;

        let commands = l.match(cmdRegEx);
        if(commands === null) continue;
        commands = commands.map(cmd=>cmd.trim());
       
        //Analizo la línea
        for(let ix = 0; ix < commands.length; ix++){
            const command = commands[ix];
              //  console.log(command.at(0));
            switch(command.at(0)){
                //case 'M':   _M = parseInt(command.substring(1)); break;
                //case 'T':   _T = parseInt(command.substring(1)); break;
                //case 'F':   _F = parseFloat(command.substring(1)); break;
                //case 'S':   _S = parseFloat(command.substring(1)); break;
                case 'X':   _X = parseFloat(command.substring(1)); break;
                case 'Y':   _Y = parseFloat(command.substring(1)); break;
                case 'G':   _G.push( parseInt(command.substring(1))); break;
            }
        }
        //miramos si hay G91, el resto son puramente de ejecución, aquí lo queremos para pintar
        let gix = _G.findLastIndex(g => g===90 || g===91);
        if(gix > -1) inc = _G[gix] === 90 ? false : true;
        //Le doy prioridad a lo último que encuentre,
        gix = _G.findLastIndex(g => g===0 || g===1);
        if((gix > -1) && (_G[gix] === 0)){ //genero un nuevo path
            if(actualPath.elements.length > 0)
                paths.push(actualPath );
            actualPath = createDrawElement('path',[]); 
            moving = true;
        } else if(_G[gix] === 1) 
            moving = false;
        //solo guardo la última cota, No voy a dar error en X duplicadas, es un prototipo, aunque sería trivial
        //solo genero bloque si hay geometría, es para pintar
        let flag = false;
        if(parseFloat(_X) !== NaN) {
            X = inc? X+_X : _X;
            flag = true;
        }
        if(parseFloat(_Y) !== NaN) {
            Y = inc? Y+_Y : _Y;
            flag = true;
        }
        if((flag) && (!moving))
            actualPath.elements.push(createDrawElement('segment', {subType:'PP', x0:cpx, y0:cpy, x1: X, y1: Y}));
            //pero la posición se incrementa
        cpx = X, cpy = Y;
        }
        if(actualPath.elements.length > 0)
            paths.push(actualPath );
        return paths;
    }
    //Aquí llega un churro tipo file
    const lines = gcode.split(/[\n,\r,\n\r]/);
    const paths = parsePath(lines);
    return(paths);
}

