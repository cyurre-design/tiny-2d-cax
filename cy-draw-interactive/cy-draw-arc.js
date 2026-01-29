import DrawBasic from "./cy-draw-basic.js";
import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";

export class DrawArc extends DrawBasic {
	constructor(layerDraw, mode) {
		super(layerDraw, "arc", mode); //podríamos usarlo para vértice o lado...
		switch (mode) {
			case "3P":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.mm, this.sendDataBasic, this.draw],
						[this.h, this.m1, this.sendDataBasic, this.draw],
					];
					this.clickFn = [[this.p0], [this.pm], [this.m1, this.newBlock, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["xm", "ym"],
						["x1", "y1"],
					];
					this.dataReceived = ["x0", "x1", "x2", "y0", "y1", "y2", "r", "a"];
				}
				break;
			case "CPA":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.m1, this.sendDataBasic, this.draw],
					];
					this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["x1", "y1"],
					];
					this.dataReceived = ["x0", "x1", "y0", "y1", "a"];
				}
				break;
			case "2PR":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.m1, this.sendDataBasic, this.draw],
					];
					this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["x1", "y1"],
					];
					this.dataReceived = ["x0", "x1", "y0", "y1", "r", "way"];
				}
				break;
			case "2PL":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.m1, this.sendDataBasic, this.draw],
					];
					this.clickFn = [[this.p0], [this.m1, this.newBlock, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["x1", "y1"],
					];
					this.dataReceived = ["x0", "x1", "y0", "y1", "l", "way"];
				}
				break;
			case "2PC":
				{
					this.moveFn = [
						[this.h, this.m0, this.sendDataBasic],
						[this.h, this.mm, this.sendDataBasic, this.draw],
						[this.m1, this.sendDataBasic, this.draw],
					];
					this.clickFn = [[this.p0], [this.pm], [this.m1, this.newBlock, this.deleteData]];
					this.dataSent = [
						["x0", "y0"],
						["x1", "y1"],
						["x2", "y2"],
					];
					this.dataReceived = ["x0", "x1", "y0", "y1"];
				}
				break;
		}
	}
	data = { subType: this.subMode };
	//No hay que borrar lo que no se interacciona con el ratón porque no habría evento si no se da al control
	//y perderíamos el valor
	deleteData = () => {
		this.deleteDataBasic(["x0", "x1", "x2", "y0", "y1", "y2"]);
		//.forEach(k => delete this.data[k]);
	};
	//según el caso puede venir r y/o way, el caso r es estándar y lo trata el basic
	updateData = (data) => {
		const el = this.updateDataBasic(data).find((el) => el.idn === "way");
		if (el !== undefined && (this.subMode === "2PR" || this.subMode === "2PL")) this.data.way = el.v;
	};
	pm = (p) => {
		this.data.xm = p.x;
		this.data.ym = p.y;
		this.status = 2;
	};
	newBlock = () => {
		this.layerDraw.dispatchEvent(new CustomEvent("new-block", { bubbles: true, composed: true, detail: { type: "arc", data: this.data } }));
	};
	//Estas son para el move. p0 y m0 se parecen, pero las move no cambian status, se pueden retocar, pero así están separadas
	mm = (pi) => {
		[this.data.xm, this.data.ym] = this.hit !== undefined ? [this.hit.x, this.hit.y] : [pi.x, pi.y];
	};
	//Atención al paso por valor y no referencia porque createdraw usa el objeyo para rellenar campos!!!
	draw = (pi) => {
		this.hit = this.highLight(pi.x, pi.y, createDrawElement("arc", Object.assign({}, this.data)));
	};
}
