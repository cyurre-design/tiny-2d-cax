import DrawBasic from "./cy-draw-basic.js";
//import { pathSetStartPoint, pathReverse } from '../cy-geometry/cy-geo-elements/cy-path.js'
//import {pathOrientation} from '../cy-geometry/cy-geo-elements/cy-path.js'

/**
 * Tanto por filosofía (no tocar la geometría porque podemos querer hacer otras cosas)
 * como por sencillez (Si se tocan los paths las rutinas de hover, highlight y tal no furrulan)
 * Dejamos la estructura como está y guardamos la info para hacer las transformaciones cuando
 * se vaya a generar el iso. Así podemo hacer un perfil interior a izquierdas y otro exteerior a
 * derechas con la misma geometría...o así
 */
export class DrawBoolean extends DrawBasic {
    constructor(layerDraw, mode) {
        super(layerDraw, "boolean", mode);
        this.data = { subType: mode };
        this.paths = [];

        this.moveFn = [[this.hover, this.h], []];
        this.clickFn = [[this.select], []];
        this.dataSent = [[], []];
        this.dataReceived = [];
    }

    //Al hacer click pasa de hover a selected
    select = (pi) => {
        const found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if (found === undefined) return;
        if (found[0].type !== "path" && found[0].type !== "polygon") return undefined;
        this.paths.push(found[0]);
        return found[0];
    };
    deleteData = () => {
        this.deleteDataBasic([]);
        this.paths = [];
        this.clear();
    };
    //Aquí me va a venir lo que se escriba..
    updateData = (data) => {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn; //no esperamos más que una pulsación...
        switch (idn) {
            case "and":
            case "or":
            case "not":
            case "xor": {
                if (this.paths.length < 2) break;
                this.layerDraw.dispatchEvent(
                    new CustomEvent("boolean-op", { bubbles: true, composed: true, detail: { mode: idn, paths: this.paths } }),
                );
                this.deleteData();
                break;
            }
            case "save":
                break;
            case "end":
                break;
            default:
                break;
        }
    };
}
