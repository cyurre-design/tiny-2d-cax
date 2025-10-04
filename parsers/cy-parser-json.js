'use strict'

//import { geometryPrecision} from '../cy-geometry/cy-geometry-library.js'
import { deserialize} from '../cy-geometry/cy-geometry-basic-elements.js'


//Aquí debe llegar el texto del fichero, que está en JSON
export default function  jsonParser(file){
    const rawLayers = JSON.parse(file);
    let layers = [];
    rawLayers.forEach(ly => {
        if(ly.data.length > 0)
            layers.push({name:ly.name, paths: deserialize(ly.data)});
    }) 
    return {geometry:{layers:layers}};  
}