"use strict";

import Channel from "../parsers/fg-iso-code-read.js";
import { createDrawElement } from '../geometry/fg-geometry-drawn-elements.js';
//YURRE: La semántica de las configuraciones es muy específica de ISO, está mejor aquí
//Y al menos las "normales" deberían estar codificadas (por ejemplo en ascii :) )
//configuración para lectura/escrituraISO:
//Mi opinión es pasarle G17 G0 G90 G71, y lo que no, JSON
//Un ejemplo en ascii mainAxis:'XY2Z' , planeAxis:'XZ', diamAxis:'X'....
//FRESADORA XYZ
export const configM = {mainAxis:['X','Y','Z'],planeAxis:['X','Y'],plane:17,config:'trihedron',
              mainDiamAxis:[false,false,false],
              planeDiamAxis:[false,false],
              move:'rapid',units:'mm',incr:'absolute',
              polar:false,centerRad:false,PROGTL3:false,code:'8070', infoAux:true};
//TORNO XYZ triedro
export const configT = {mainAxis:['X','Y','Z'],planeAxis:['Z','X'],plane:18,config:'triedro',
              mainDiamAxis:[true,false,false],planeDiamAxis:[false,true],
              move:'rapid',units:'mm',incr:'absolute',
              polar:false,centerRad:false,PROGTL3:false,code:'8070', infoAux:true};
//TORNO XZ plano
export const configTP = {mainAxis:['X','Z'],planeAxis:['Z','X'],plane:18,config:'plano',
                mainDiamAxis:[true,false],planeDiamAxis:[false,true],
                move:'rapid',units:'mm',incr:'absolute',
                polar:false,centerRad:false,PROGTL3:false,code:'8070', infoAux:true};
//TORNO X2Z2 plano
export const configTP2 = {mainAxis:['X2','Z2'],planeAxis:['Z2','X2'],plane:18,config:'plano',
                mainDiamAxis:[true,false],planeDiamAxis:[false,true],
                move:'rapid',units:'mm',incr:'absolute',
                polar:false,centerRad:false,PROGTL3:false,code:'8070', infoAux:true};
//FRESA X2Y2 plano
export const configMC2 = {mainAxis:['X2','Y2','Z2'],planeAxis:['X2','Y2'],plane:17,config:'triedro',
                mainDiamAxis:[false,false],planeDiamAxis:[false,false],
                move:'rapid',units:'mm',incr:'absolute',
                polar:false,centerRad:false,PROGTL3:false,code:'8070', infoAux:true};

export function isoToGeometry(isoProg, config = configM){

        const channel = new Channel(config);

        const { isoGeometry, updatedConfig, error } = channel.execute(isoProg.split('\n'));   //podría devolver json, por ejemplo, en dos pasos

        const geometry = _convertIsoToGeometry(isoGeometry);

        if(error != undefined) geometry.errors.push(error);
        return {geometry: geometry, updatedConfig: updatedConfig, errors: geometry.errors};
    }
    //se podrían pasara solo los profiles, etc... a discutir
    //No testeo que viene todo porque viene de un filtro nuestro que es donde debe dar error
function _convertIsoToGeometry(iso) {  //array de blocks con profile
    let geo= {layers:[{name: "profile", paths:[], circles:[]}], errors:[]};         //una sola capa de nombre iso, ya se apañará luego
    let elements = [];
    let geoElements = 0;
    let box = {xmin:Infinity,ymin:Infinity,xmax:-Infinity,ymax:-Infinity};
    function checkBox(x,y){
        box.xmin = Math.min(x, box.xmin);
        box.xmax = Math.max(x, box.xmax);
        box.ymin = Math.min(y, box.ymin);
        box.ymax = Math.max(y, box.ymax);
    }

    iso.forEach(b => {
        let prf = b.profile;
        if (prf !== undefined) { //hay que no hacen nada
            let misc = {conditional: b.conditional, label: b.label, info: b.info, infoPostMov: b.infoPostMov,comments: b.comments, initPoint: b.initPoint};
            switch (prf.type) {
                case 'point': //
                    elements.push(createDrawElement('Point', {x: prf.x, y: prf.y}, misc));
                    break;

                case 'move':
                    if (geoElements !== 0) {
                        geo.layers[0].paths.push(createDrawElement('Path', {elements: elements}, misc));
                        elements = [];
                        geoElements = 0;
                    }
                    elements.push(createDrawElement('Move', {x1: prf.xi, y1: prf.yi, x2: prf.xf, y2: prf.yf}, misc));
                    //geoElements++;//si o no???
                    break;

                case 'line':
                    elements.push(createDrawElement('Line', {x1: prf.xi, y1: prf.yi, x2: prf.xf, y2: prf.yf}, misc));
                    geoElements++;
                    break;

                case 'arc_clock':
                case 'arc_antiClock':
                    let r = Math.sqrt((prf.xi - prf.x0) * (prf.xi - prf.x0) + (prf.yi - prf.y0) * (prf.yi - prf.y0));
                    let arcWay = (prf.type === 'arc_clock') ? 'clock' : 'antiClock';
                    elements.push(createDrawElement('Arc', {cx: prf.x0, cy: prf.y0, r: r, pi: {x: prf.xi, y: prf.yi}, pf: {x: prf.xf, y: prf.yf}, way: arcWay}, misc));
                    geoElements++;
                    break;

                case 'arc_radius_clock':
                case 'arc_radius_antiClock':
                    let arcRadiusWay = (prf.type === 'arc_radius_clock') ? 'clock' : 'antiClock';
                    elements.push(createDrawElement('Arc2PointsAndRadius', {xi: prf.xi, yi: prf.yi, xf: prf.xf, yf: prf.yf, r: prf.r, way: arcRadiusWay, largeArcFlag: prf.largeArcFlag}, misc));
                    geoElements++;
                    break;

                case 'arc_3Points':
                    elements.push(createDrawElement('Arc3Points', {pi: {x: prf.xi, y: prf.yi}, pm: {x: prf.xm, y: prf.ym}, pf: {x: prf.xf, y: prf.yf}}, misc));
                    geoElements++;
                    break;

                //TODO ESTA SIN PROBAR G08
                case 'arc_tangent':
                    if (elements.length < 1) {//no debería pasar nunca, claro, es error
                        geo.errors.push('G08: no previus block');
                        break;
                    }
                    let last = elements.slice(-1)[0]; //no modifica el array, cojo el bloque recién metido
                    if (last.type === 'segment') {
                        elements.push(createDrawElement('ArcTangentToLine', {p0: last.pi, pi: {x: prf.xi, y: prf.yi}, pf: {x: prf.xf, y: prf.yf}}, misc));
                    } else if(last.type === 'arc') {
                        elements.push(createDrawElement('ArcTangentToArc', {p0: last.p0, pathway: last.pathway, pi: {x: prf.xi, y: prf.yi}, pf: {x: prf.xf, y: prf.yf}}, misc));
                    } else {
                        geo.errors.push('G08: unknow previus block');
                    }
                    geoElements++;
                    break;

                case 'arc_round': //este no se resuelve ahora, pero debe entrar en el apartado de pendientes, igual que los chaflanes
                    elements.push(createDrawElement('round', {r: prf.r}, misc));
                    geoElements++;
                    break;
                case 'chamfer':
                    elements.push(createDrawElement('chamfer', {r: prf.r}, misc));
                    geoElements++;
                    break;
                case 'tangentialEntry'    :
                    elements.push(createDrawElement('tangentialEntry', {r: prf.r}, misc));
                    geoElements++;
                    break;
                case 'tangentialExit'    :
                    elements.push(createDrawElement('tangentialExit', {r: prf.r}, misc));
                    geoElements++;
                    break;
                default: geo.errors.push('Unknow block');
                break;
            }
        }
    });

    if (elements.length) {
        geo.layers[0].paths.push(createDrawElement('Path', {elements: elements}));
    }
    geo.layers[0].paths.forEach(p=>p.elements.forEach(el=>{
        switch(el.type){
            case 'arc':
                checkBox(el.pm.x, el.pm.y); //fallthrough
            case 'segment':
                checkBox(el.pi.x, el.pi.y);
                checkBox(el.pf.x, el.pf.y);
                break;
            default:break;
        }
    }))
    geo.box = box;
    return (geo);
}
    //YURRE: para casa, paso cabecera, pre y post, que parece mucho más fácil de getsionar.
    // tal vez podría haber un pre y un post para los patrones...
export function geometryToIso(paths, header, pre, post){
    let str = header;
    str = paths.reduce((acc,p)=> acc += pre +'\n' + yy_pathToIso(p) + '\n' + post + '\n', str );
    return(str);
}
function myRound(x) {
    return (Math.round(x * 10000) / 10000);
}
//Ya he quitado los moves y los puntos, solo geometría
function yy_pathToIso(path={elements:[]}){
    let {_I, _J} = processConfig(configM);
    let {formatX, formatY} = strFormatCota(configM, false);
    let str = `${formatX(path.elements[0].pi.x)}  ${formatY(path.elements[0].pi.y)} \n`;   //el G0 o G1 en la cabecera de perfil
    path.elements.forEach(el=>{
        switch(el.type){
            case 'segment': str += `G01 ${formatX(el.pf.x)} ${formatY(el.pf.y)} \n`; break;
            case 'arc':{
                let deltc = {x: el.cx - el.pi.x, y: el.cy - el.pi.y}; //test by cross product
                if (el.pathway === 1)
                    str += `G03 ${formatX(el.pf.x)} ${formatY(el.pf.y)} ${_I}${myRound(deltc.x)} ${_J}${myRound(deltc.y)} \n`;
                else 
                    str += `G02 ${formatX(el.pf.x)} ${formatY(el.pf.y)} ${_I}${myRound(deltc.x)} ${_J}${myRound(deltc.y)} \n`;
                }
                break;
            case 'tangentialEntry': str += `G37 I${myRound(el.r)} \n`;    break;
            case 'tangentialExit':  str += `G38 I${myRound(el.r)} \n`;    break;
            case 'chamfer':         str += `G39 I${myRound(el.r)} \n`;    break;
            case 'round':           str += `G36 I${myRound(el.r)} \n`;    break;
        }
    })
    return(str);
}
//Genera ISO de paths:
function _pathToISO(prog, processGeoData, config, pretty=false){
    let paths = processGeoData; 
    //paths vacio?
    if((paths === undefined)||(paths.length === 0)){
        prog.error ='Empty paths';
        return(prog);
    }
    //recorro los paths:
    let firstPath = true;
    while (paths.length > 0) {
        let path = paths.shift();
        let elements = path.elements.slice(); 
        let el;
        let first = true;
        //recorro los elementos de cada path:
        while (elements.length > 0) {
            let line = '';
            el = elements.shift();
            if((first===true) && (el.type !== 'point') &&(el.type !== 'error')){
                if(el.type !== 'move')
                //caso: generado con el editor, o segundos perfiles, añadimos el G00 
                prog.strProg += _generateInitLines(config, firstPath, 'G00', el.pi.x, el.pi.y);
                prog.strProg += '\n';
                first = false; firstPath= false;
            }
            switch(el.type){//cotas, información de movimiento:
                case 'point':
                    if((first === true)&&(el.misc.initPoint !== undefined)){
                    //caso: lectura de ISO, primer movimiento leido convertido a point(initPoint)  
                    //prog.strProg += generateInitLines(config, el.misc.initPoint, el.x, el.y);
                    line += generateInitLines(config, firstPath, el.misc.initPoint, el.x, el.y);
                    first = false; firstPath= false;
                    }
                    break;
                case 'segment': line = `G01 ${formatX(el.pf.x)} ${formatY(el.pf.y)} `;
                    break;
                case 'move': line = `G00 ${formatX(el.pf.x)} ${formatY(el.pf.y)} `;
                    break;
                case 'arc':{
                    let deltc = {x: el.cx - el.pi.x, y: el.cy - el.pi.y}; //test by cross product
                    if (el.pathway === 1)
                        line = `G03 ${formatX(el.pf.x)} ${formatY(el.pf.y)} ${_I}${myRound(deltc.x)} ${_J}${myRound(deltc.y)} `;
                    else 
                        line = `G02 ${formatX(el.pf.x)} ${formatY(el.pf.y)} ${_I}${myRound(deltc.x)} ${_J}${myRound(deltc.y)} `;
                    }
                    break;
                case 'tangentialEntry':line = `G37 I${myRound(el.r)} `;
                    break;
                case 'tangentialExit':line = `G38 I${myRound(el.r)} `;
                    break;
                case 'chamfer':line = `G39 I${myRound(el.r)} `;
                    break;
                case 'round':line += `G36 I${myRound(el.r)} `;
                    break;
                case 'error': prog.error = el.error;
                    return prog;//aquí paramos de generar ISO
                default: prog.error = "Unknow geometry";
                    return prog;//aquí paramos de generar ISO
            }
            prog.strProg += formatLine(config,el.misc, line); //info y fin de línea
        }
    }
    return prog;
}
function _generateInitLines(config, firstPath, initPoint, x, y){
    let str = '';
    if(firstPath === true)
    {
        let incr = 90;//de momento siempre G90 (config.incr === 'incremental')?91:90;
        let units = (config.units === 'mm')?71:70;
        str = `G${incr} G${units}\n`; //G90/G91 G70/G71
        if(config.plane != 20) str += `G${config.plane}\n`; //G17, G18, G19, G20
        else str += `G${config.plane} ${config.planeAxis[0]}=1 ${config.planeAxis[1]}=2\n`; 
        let move = (config.move==='rapid')?'G00':'G01';
    }
    if(initPoint !== undefined)
      str += `${initPoint} ${formatX(x)} ${formatY(y)}` 
    return(str);
}
//YURRE: Como es constante durante el programa, por conecntrar aquí las opciones de formateo, si se puede...
//devuelve dos formatos, x e y, ATTON: la I y la J no admiten la programación con '='
//pretty sería algo de configuración, si queremos el igual siempre en las cotas, por ejemplo
//Devuelvo dos funciones de formateo, para el X y el Y (que depende de la configuración)
//Donde el formateo que depende de la configuración está resuelto
function strFormatCota(config, pretty=false){
    //escribimos ejecota o eje=cota según tenga o no número el nombre del eje 
    const _X = ((pretty === true) || (config.planeAxis[0].length > 1)) ? `${config.planeAxis[0]}= `:`${config.planeAxis[0]}`;
    const _Y = ((pretty === true) || (config.planeAxis[1].length > 1)) ? `${config.planeAxis[1]}= `:`${config.planeAxis[1]}`;
    let mx = (config.planeDiamAxis[0])?2:1;
    let my = (config.planeDiamAxis[1])?2:1;
    return( {formatX:(x=>`${_X}${myRound(mx*x)}`), formatY:(x=>`${_Y}${myRound(my*x)}`)});
}
function processConfig(config){
    //Procesa configuración de entrada:

    //nombres de los centros según plano:
    let _I = 'I';
    let _J = 'J'
    if((config.plane === 17)||(config.plane === 20)){}
    else if(config.plane === 18) {_I = 'K';_J = 'I';}
    else if(config.plane === 19) {_I = 'J';_J = 'K';}
    return( {_I, _J});
}

//YURRE: Hay que ver si abierto o cerrado, porque si es abierto hay que empezar en un extremo...
    //Y si nos dan el comienzo y no lo es habría que dar error: TODO
    //YURRE: está pensado 1 path -> 1 programa (por la cabecera) Se puede obviar la cabecera, bien vía flag, bien vía config

    export function convertGeometryToISO(processData, processGeoData, config) {
        //se puede meter lógica por ejemplo, si por fuera, ir a esquina, dentro, al medio...
        //Nos pasan el índice del primer elemento y de qué path, y la dirección... que no sé cómo vamos a definir  
        //Estamos suponiendo que el chequeo de que es continuo y tal ya se ha hecho, es de geometría
        //el concepto de a derechas o izquierdas es de mecanizado, se haría aquí, igual que lo de punto de entrada
        //Esto para los cerrados !!!!!          
        //   let left = this.elements.splice(0,initialElement);
        //   let elements = this.elements.concat(left);
        // Hay que determinar la función según si hay conversión o no, no tanto por el propio parámetro
        // function myRoundToMm(x) {
        //     return (Math.round((x * 2540000 )) / 10000);
        // }
        // function myRoundToInches(x) {
        //     return (Math.round((x * 100000 / 25.4 )) / 100000);
        // }
        // const myRound = (config.units===70)?myRoundToInches:myRound;
        function formatLine(config, miscelanea, moveTxt, pretty=false){
            let line = '';

            //la información adicional del bloque se añade en función de la configuración:
            //none: no se añade información adicional
            if((config.infoAux === undefined)||(config.infoAux === 'none'))
                miscelanea = undefined;
            //onlyMov: solo se añade en bloques de movimiento
            else if((config.infoAux === 'onlyMov')&&(moveTxt.length === 0))
                miscelanea = undefined;
            //full: se añade toda la información
            
            if(miscelanea !== undefined){
                //comienzo de línea, si queremos, podemos poner aquí que el condicional o la etiqueta ocupen posición si no hay
                //Por defecto, no formateamos?
                line = `${miscelanea.conditional?miscelanea.conditional+' ':''}${miscelanea.label?miscelanea.label+' ':''}`;
                line = line + moveTxt;
                //line += `${miscelanea.info.length!==0?`${miscelanea.info.join(' ')}`:''}`;    //anidamiento de interpolated strings
                line += `${miscelanea.infoPostMov.length!==0?miscelanea.infoPostMov :''}`
                if(miscelanea.comments.length === 0) return(line.length===0?'':line+'\n');
                if(pretty && line.length !== 0)
                    line = line.padEnd(50);
                return( line + miscelanea.comments + '\n');
            }
            return(moveTxt.length===0?'':moveTxt+'\n'); //Si solo hay código...
        }
        


        //Genera ISO de patrones:
        function patternToISO(prog, processGeoData, config, pretty=false){
            let pattern = processGeoData; 
            //patrón vacío?
            if((pattern === undefined)||(pattern.length === 0)){
                prog.error ='Empty pattern';
                return(prog);
            }
            //líneas de cabecera según configuración:
            prog.strProg += generateInitLines(config);
            //recorro los patrones:
            while (pattern.length > 0) {
                let patt = pattern.shift();
                let elements = patt.elements.slice(); 
                let el;
                let first = true;
                //recorro los elementos de cada patrón:
                while (elements.length > 0) {
                    let line = '';
                    el = elements.shift();
                    if(first===true) {
                        //los distintos patrones se unen con G00:
                        prog.strProg += `G00 ${formatX(el.cx)} ${formatY(el.cy)} \n` 
                        first = false;
                    }
                    //generamos trayectoria en G01 uniendo los centros de los círculos de cada patrón:
                    if(el.type === 'circle')
                        line = `G01 ${formatX(el.cx)} ${formatY(el.cy)} `;
                    else {
                        prog.error = "Unknow geometry";
                        return prog;//aquí paramos de generar ISO
                    }
                    prog.strProg += formatLine(config,el.misc, line); //info y fin de línea
                }
            }
            return prog;
        }

        //Principal:
        let prog = {strProg:'',error:''};
        let {_I, _J} = processConfig(config);
        let {formatX, formatY} = strFormatCota(config, false);
        
        //Según el tipo de proceso seleccionado:
        switch(processData.type){
            case 'path': _pathToISO(prog, processGeoData, config);
                break;
            case 'patterns': patternToISO(prog, processGeoData, config);
            default:
                break;
        }  
        return prog;     
    }