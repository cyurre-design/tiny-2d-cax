// JavaScript source code
'use strict'

var nodepath = "C:/nodejs/node_modules/";
var express = require(nodepath + "express");
//var bodyParser = require(nodepath + "body-parser");
//main app
var main = express();

const fs = require('node:fs');
const { resolve } = require("path");

var sys = require("util");

//*********************************************************************************
//******************     FONTS ****************************************************
//*********************************************************************************
main.get('/useFont', function(request,response){
    let fontName = request.query.fontName;
    response.send(fs.readFileSync(`./files/fonts/${fontName}.ttf`));
});

main.get('/getFontNames', function(request,response){
    let fonts = fs.readdirSync('./files/fonts').filter(f=>f.endsWith('.ttf')).map(f=>f.slice(0,-4)) ;
    response.send(JSON.stringify(fonts));
});




/* 
const SerialPort = require(nodepath + 'serialport');

//const Readline = require('readline');

const serial_port = new SerialPort('COM10', {baudRate: 115200},function (err) {
    if (err) {
      return console.log('Error: ', err.message)
    }
  })
const ReadSerialLine = SerialPort.parsers.Readline;
const parser = new ReadSerialLine({ delimiter: '\r\n' });
serial_port.pipe(parser);
parser.on('data', (line)=>console.log(line)); // se chequearía el ready viendo lo que devuelve */

//var xml2js = require('C:/program files/nodejs/node_modules/xml2js');
//var parseString = new xml2js.Parser({ explicitArray: false }).parseString;
main.use(express.static(__dirname));
main.use('/nodemodules', express.static("C:/nodejs/node_modules/"));
//main.use('/scripts', express.static("../libraryhmi/scripts"));
//main.use('/fg-components', express.static(__dirname));

console.log(__dirname);
//YURRE, me hago una copia local de algo que total no voy a tocar
//main.use('/scripts/dxf-parser', express.static(__dirname + "/node_modules/dxf-parser/dist")); // https://github.com/gdsestimating/dxf-parser
//main.use('/scripts', express.static("C:/lana/git/hmi/library/scripts"));
//main.use('/scripts', express.static(__dirname + "/node_modules/fg-components-aotek/scripts"));





//***************************************************************************************
//              Funciones de lectura y escritura, servicios
//***************************************************************************************
//
//
const resetAscii = String.fromCharCode(0x78,13);

const grblCommands = {
    settings: '$$\n', params: '$#\n', parser_state: '$G\n', startup: '$N\n', check_mode: '$C\n', kill_alarm : '$X\n',
    cycle_start: '~\n', feed_hold: '!\n', status: '?\n', reset: resetAscii
}

let grbl_response=[];
// parser.on('data', (data)=>{
//     //console.log(data);
//     grbl_response = grbl_response.concat(data.split('\n'));
//     if(grbl_response[grbl_response.length-1] == 'ok')
//         resolve()
//         return(grbl_response);
// });

function send_command(command){
    return new Promise((resolve, reject)=>{
        grbl_response=[];
        switch(command){
            case 'settings': 
            case 'params': 
            case 'parser_state': 
            case 'startup':
            case 'check_mmode':
            case 'reset':
                serial_port.write(grblCommands[command]);
             break;
            default: break;
        }
        parser.on('data', (data)=>{ //el parser manda línea a línea
            grbl_response.push(data);
            if(data === 'ok')
                resolve(grbl_response);
            });
        parser.on('error', (err)=>reject(err));
    })

}

main.get('/GRBL/:command', function(request,response){
    console.log(request.params);
    send_command(request.params.command.slice(1))
        .then(data=>response.send(data));

//    const command = request.params.command;
//    response.send('OK');
    
    
});


//main.use('/',function (request,response,next) { console.log(request.query); next();}),

//*********************************************************************************
//******************     FAKE *****************************************************
//*********************************************************************************


//*********************************************************************************
//******************     MAIN *****************************************************
//*********************************************************************************
//En el servidor
var port = 8085;
main.listen(port);
console.log("listening on port: " + port);


