import { blockScale } from "../cy-geometry/cy-geometry-library.js";
import DrawBasic from "./cy-draw-basic.js";
//El translate está definido con clone, cada vez que muevo se crea.... pero a la larga es más comprensible
export class DrawScale extends DrawBasic {
	constructor(layerDraw, subMode) {
		super(layerDraw, "scale", subMode);
		this.blocksToScale = [];
		this.moveFn = [[this.h, this.m0, this.sendDataBasic], [this.move]];
		this.clickFn = [[this.m0, this.getBlocks, this.move], []];
		this.dataSent = [["x0", "y0"], []];
		this.dataReceived = ["x0", "y0", "sn", "sd"]; //numerador y denominador
	}
	//Para memorizar los bloques a rotar
	getBlocks = () => {
		this.blocksToScale = this.layerDraw.getSelectedBlocks();
		if (this.blocksToScale.length > 0) this.status = 1;
	};
	//ATTON. los moves no siguen el ratón sino la ventana de intro, por eso se usa el x0,y0 guardado en p0
	move = (pi) => {
		//hemos guardado x0,y0 originales en data en la rutina p0
		this.hit = this.highLight(
			pi.x,
			pi.y,
			this.blocksToScale.map((b) => blockScale(b, this.data.x0, this.data.y0, this.data.sn / this.data.sd)),
		);
	};
	scale = (/*p*/) => {
		this.layerDraw.dispatchEvent(
			new CustomEvent("geometry-transform", {
				bubbles: true,
				composed: true,
				detail: { command: "scale", data: { x: this.data.x0, y: this.data.y0, s: this.data.sn / this.data.sd } },
			}),
		);
		this.status = 0;
	};
	deleteData = () => this.deleteDataBasic(["x0", "y0"]);
	updateData = (data) => {
		if (!data) return;
		const newData = this.updateDataBasic(data);
		newData.forEach((d) => {
			//no esperamos más que una pulsación...pero si viene la s se atiende aquí
			switch (d.idn) {
				case "enter":
					this.scale();
					this.deleteData();
					this.move({ x: this.data.x0, y: this.data.y0 });
					this.clear();
					break;
				case "escape":
					this.status = 0;
					this.clear();
					break;
				case "x0":
				case "y0":
					break; //ya se pone en la clase base data
				case "sn":
				case "sd":
					if (this.status === 1) this.move({ x: this.data.x0, y: this.data.y0 }); //Solo se mueve si ya conocemos el punto de traslado
					break;
			}
		});
	};
}
