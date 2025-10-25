'use strict'

//import { geometryPrecision} from '../cy-geometry/cy-geometry-library.js'
//import { deserialize} from '../cy-geometry/cy-geometry-basic-elements.js'


//Aquí debe llegar el texto del fichero, que está en JSON
//No es bueno que los parsers sepan de la estructura del proyecto pero parece inevitable
//porque los formatos de origen son muy diferentes (dxf, json, iso, svg...)
//Este es el que se usaría para guardar el proyecto, con estilos  y tal vez incluso los undos..?
//Para ello se necesitaría que se pueda definir los ids en la creación....
/**
 * 
 * @param {file} file 
 * @returns 
 * @todo evaluar si merece guardar la historia de deshacer...
 * 
 * En el json vienen los layers y los bloques. de momento rehacemos todo, hay que pasar de objetos a clase y se pierde historia, etc...
 */
export default function  jsonParser(file){
    const project = JSON.parse(file); 
    
    let layers = project.layers;
    const blocks = project.blocks;

//    return {geometry:{layers:layers}};  
}