import DrawBasic from "./cy-draw-basic.js";
//import { pathReverse } from '../cy-geometry/cy-geo-elements/cy-path.js'
//import {pathOrientation} from '../cy-geometry/cy-geo-elements/cy-path.js'

/**
 * Tanto por filosofía (no tocar la geometría porque podemos querer hacer otras cosas)
 * como por sencillez (Si se tocan los paths las rutinas de hover, highlight y tal no furrulan)
 * Dejamos la estructura como está y guardamos la info para hacer las transformaciones cuando
 * se vaya a generar el iso. Así podemo hacer un perfil interior a izquierdas y otro exteerior a
 * derechas con la misma geometría...o así
 */
export class DrawPocket extends DrawBasic {
	constructor(layerDraw, mode) {
		super(layerDraw, "pocket", mode);
		this.data = { subType: mode };
		this.paths = [];

		this.moveFn = [[this.hover, this.draw], []];
		this.clickFn = [[this.select, this.draw], []];
		this.dataSent = [[], []];
		this.dataReceived = ["co", "io"];
	}

	//mientras mueve sin click, estado 0, miramos si pincha en bloque
	hover = (pi) => {
		return this.layerDraw.hover(pi.x, pi.y, undefined, false);
	};
	//Al hacer click pasa de hover a selected
	select = (pi) => {
		const found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
		if (found === undefined) return;
		if (found[0].type !== "path" && found[0].type !== "polygon") return undefined;
		this.paths.push(found[0]);
		return found[0];
	};
	draw = (pi) => {
		this.hit = this.highLight(pi.x, pi.y, this.arrows);
		//this.draft.drawNumber(this.arrows.map((arrow, ix) => ({x0:arrow.x0, y0:arrow.y0, text:'p' + (this.order[ix]+1)})));
	};
	deleteData = () => {
		(this.deleteDataBasic([]), (this.paths = []));
		this.clear();
	};
	//Aquí me va a venir lo que se escriba..
	updateData = (data) => {
		const newData = this.updateDataBasic(data);
		const idn = newData[0].idn; //no esperamos más que una pulsación...
		switch (idn) {
			case "enter":
				this.layerDraw.dispatchEvent(
					new CustomEvent("pocket-op", { bubbles: true, composed: true, detail: { co: this.data.co, io: this.data.io, paths: this.paths } }),
				);
				this.deleteData();
				break;
			default:
				break;
		}
	};
}
