import DrawBasic from "./cy-draw-basic.js";
import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";
import { blockLength, distancePointToPoint } from "../cy-geometry/cy-geometry-library.js";
export class DrawMeasure extends DrawBasic {
	constructor(layerDraw, submode) {
		super(layerDraw, "measure", submode);
		this.data.subType = "PP"; //sirve para generar el segmento de ayuda
		this.data.len = 0;
		switch (this.subMode) {
			case "block":
				{
					this.moveFn = [[this.hover], []];
					this.clickFn = [[this.select, this.sendDataBasic], []];
					this.dataSent = [["lblock", "lpath"], []];
					this.dataReceived = [];
				}
				break;
			case "p2p":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.m1, this.sendDataBasic, this.drawP2P],
					];
					this.clickFn = [[this.p0], [this.m1, this.measure, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["x1", "y1", "len"],
					];
					this.dataReceived = ["x0", "y0", "x1", "y1"];
				}
				break;
		}
	}
	//mientras mueve sin click, estado 0, miramos si pincha en bloque
	//args: El undefined es porque no usamos el block como para seleccionar
	//el false para que no lo ponga como seleccionado
	//Al no ser box, devuelve el pinchado y, si es path, el path
	hover = (pi) => {
		this.found = this.layerDraw.hover(pi.x, pi.y, undefined, false);
		//console.log(this.found);
		return this.found;
	};
	//Aquí, al hacer click no pasamos de hover a selected (sería el flag )
	select = (/*pi*/) => {
		if (this.found && this.found.length > 0) {
			this.data.lblock = blockLength(this.found[0]);
			this.data.lpath = this.found[1] ? blockLength(this.found[1]) : 0;
		}
	};
	measure = () => {
		this.data.length = distancePointToPoint(this.x0, this.y0, this.x1, this.y1);
	};
	//hay muchas cosas del basic que sirven aquí
	deleteData = () => {
		this.deleteDataBasic(["x0", "x1", "y0", "y1"]);
		this.block = undefined;
	};
	updateData = (data) => this.updateDataBasic(data);

	drawBlock = (/*pi*/) => {};
	drawP2P = (pi) => {
		this.block = createDrawElement("segment", this.data);
		this.data.len = distancePointToPoint(this.data.x0, this.data.y0, this.data.x1, this.data.y1);
		this.hit = this.highLight(pi.x, pi.y, this.block);
		//this.hit = distancePointToPoint(this.data.x0, this.data.y0, this.data.x1, this.data.y1);
	};
}
