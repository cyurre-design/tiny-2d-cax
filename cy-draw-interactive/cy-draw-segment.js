import DrawBasic from "./cy-draw-basic.js";
import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";

export class DrawSegment extends DrawBasic {
	constructor(layerDraw, submode) {
		super(layerDraw, "segment", submode);
		this.data.subType = submode;
		switch (this.subMode) {
			case "PP":
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
					this.dataReceived = ["x0", "y0", "x1", "y1"];
				}
				break;
			case "PXA":
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
					this.dataReceived = ["x0", "y0", "x1", "y1", "a"];
				}
				break;
			case "PYA":
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
					this.dataReceived = ["x0", "y0", "x1", "y1", "a"];
				}
				break;
			case "PDA":
				{
					this.moveFn = [[this.h, this.m0, this.sendDataBasic, this.draw]];
					this.clickFn = [[this.p0, this.newBlock, this.deleteData]];
					this.dataSent = [["x0", "y0"], []];
					this.dataReceived = ["x0", "y0", "d", "a"];
				}
				break;
		}
	}
	//hay muchas cosas del basic que sirven aquí
	deleteData = () => {
		this.deleteDataBasic(["x0", "x1", "y0", "y1"]);
		this.block = undefined;
	};
	updateData = (data) => this.updateDataBasic(data);
	newBlock = (/*p*/) => {
		if (this.block === undefined) return;
		this.layerDraw.dispatchEvent(new CustomEvent("new-block", { bubbles: true, composed: true, detail: { type: "segment", data: this.data } }));
	};
	draw = (pi) => {
		this.block = createDrawElement("segment", this.data);
		this.hit = this.highLight(pi.x, pi.y, this.block);
	};
}
