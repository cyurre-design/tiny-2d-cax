import { scalePixels2mm } from "./cy-canvas-handler.js";

/*
     
        case 'arcEllipse':
          svgel = FgSvgLayerProfile.path.cloneNode(true);
          svgel.setAttribute('d', `M ${el.pi.x} ${el.pi.y} A ${el.rx} ${el.ry} ${el.fi} ${el.flagLarge} ${el.flagSweep} ${el.pf.x} ${el.pf.y}`);
          svgel.setAttribute('class', clase);
          break;          

*/

//estas son funciones de librería, a la que hay que pasarles los puntos
export function getPathFromBlocks(blocks, pointDimension = 5) {
    return new Path2D(getSvgPathFromBlocks(blocks, pointDimension));
}
// export function getArrowFromPath(path, pointDimension = 5){
//     if(path.type !== 'path') return '';
//     let x = scalePixels2mm(pointDimension);
//     const b = path.elements[0];
//     if(b.type === 'segment'){
//         return new Path2D(`M ${b.x0 - x*b.uy} ${b.y0 + x*b.ux} l ${x*b.ux} ${-x*b.ux} l ${-x*b.ux} ${-x*b.ux} Z `);
//     } else if (b.type === 'arc'){
//         return
//     }
// }
export function getSvgPathFromBlocks(blocks, pointDimension = 5) {
    let x = scalePixels2mm(pointDimension);
    function getPathFromElement(b) {
        switch (b.type) {
            case "segment":
                return `M ${b.x0} ${b.y0} L ${b.x1} ${b.y1} `;
            case "circle":
                return `M ${b.cx + b.r} ${b.cy} A ${b.r}  ${b.r} 0 0 0  ${b.cx - b.r} ${b.cy} A ${b.r}  ${b.r} 0 0 0 ${b.cx + b.r} ${b.cy}`;
            case "polygon": {
                let d = `M ${b.segments[0].x0} ${b.segments[0].y0}`;
                for (let i = 1; i < b.segments.length; i++) d += `L ${b.segments[i].x0} ${b.segments[i].y0}`;
                d += `Z`;
                return d;
            }
            case "arc":
            case "aac": //https://www.w3.org/TR/SVG/implnote.html
                //Parece que dar la vuelta al Y afecta al sentido de giro del círculo????
                return `M ${b.x1} ${b.y1} A ${b.r} ${b.r}  0 ${b.fA} ${b.fS === 0 ? 1 : 0} ${b.x2} ${b.y2}`;
            case "bezier":
                return `M ${b.x0} ${b.y0} C ${b.cp1x} ${b.cp1y} ${b.cp2x} ${b.cp2y} ${b.x1} ${b.y1}`;
            case "bbox":
                return `M ${b.x0} ${b.y0} H ${b.x1} V ${b.y1} H ${b.x0} V ${b.y0} `;
            case "point":
                return `M ${b.x0 - x} ${b.y0 - x} l ${2 * x} ${2 * x} m ${-2 * x} 0 l ${2 * x} ${-2 * x}`;
            case "cut-point":
                return `M ${b.x0 - x} ${b.y0} l ${2 * x} 0 m ${-x} ${-x} l 0 ${2 * x}`;
            case "arc-ellipse":
                return `M ${b.x0} ${b.y0} A ${b.rx} ${b.ry} ${b.fi} ${b.fL} ${b.fS} ${b.x1} ${b.y1}`;
            case "arrow":
                return `M ${b.x0 + x * b.dy} ${b.y0 - x * b.dx} L ${b.x0 + 2 * x * b.dx} ${b.y0 + 2 * x * b.dy} L ${b.x0 - x * b.dy} ${b.y0 + x * b.dx} Z `;
        }
    }
    let theBlocks = Array.isArray(blocks) ? blocks : [blocks];
    //let x = scalePixels2mm(this.pointDimension);
    let d = "";
    theBlocks.forEach((b) => {
        if (b.type === "path") {
            d = b.elements.reduce((acc, el) => acc + getPathFromElement(el), d);
            //console.log(d)
        } else d += getPathFromElement(b);
    });
    return d;
}
// export function getPathFromPoints(points, pointDimension = 5){
//     const blocks = Array.isArray(points)?points:[points];
//     let x = scalePixels2mm(pointDimension);
//     let d ='';
//     //let opositex, opositey; //optimización? creación de las variables previa
//     if(blocks.length > 0){
//         blocks.forEach(b=>{
//             switch(b.type){
//                 case 'point':   d += `M ${b.x0 - x} ${b.y0 - x} l ${2*x} ${2*x} m ${-2*x} 0 l ${2*x} ${-2*x}`;
//                     break;
//                 case 'cut-point':  d += `M ${b.x0 - x} ${b.y0} l ${2*x} 0 m ${-x} ${-x} l 0 ${2*x}`;
//                     break;
//                 case 'segment': d += `M ${b.x0} ${b.y0} L ${b.x1} ${b.y1} `;
//                     break;
//             }
//         })
//     }
//     return(new Path2D(d));
// }
