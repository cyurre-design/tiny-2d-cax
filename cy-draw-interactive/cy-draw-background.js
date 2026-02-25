import DrawBasic from "./cy-draw-basic.js";
import { detectCornersShiTomasi } from "../cy-geometry/cy-corner-detection.js";
//import { createDrawElement } from "../cy-geometry/cy-geometry-basic-elements.js";
//el tipo y edges provienen del menu de input-data
export class DrawBackground extends DrawBasic {
    constructor(layerDraw, mode) {
        super(layerDraw, "background", mode);
        this.data = { subType: this.subMode };
        this.moveFn = [[this.corners, this.draw], []];
        this.clickFn = [[this.setPoint, this.sendDataBasic]];
        this.dataSent = [["x0", "y0"], []];
        this.dataReceived = ["rotimg"];
        this.corners = [];
        this.data.x0 = undefined;
        this.data.y0 = undefined;
        this.windowSize = 10;
        //this.kThreshold = 0.03; //0.015
        this.threshold = 100000;
        this.nmsRadius = 7;
        this.imageWindow = { w: 20, h: 20 };
    }

    deleteData = () => {
        this.deleteDataBasic(["x0", "y0"]);
    };
    updateData = (data) => {
        const newData = this.updateDataBasic(data);
        const idn = newData[0].idn; //vendrá en cada evento de change en mdata
        if (idn === "enter") {
            console.log(this.corners[0]);
        } else if (idn === "rotimg") {
            console.log(data.rotimg);
            this.layerDraw.rotate(data.rotimg);
        }
        //     this.data.way = newData[0].v;
        // }
    };
    corners = (pi) => {
        const ww = this.imageWindow.w;
        const wh = this.imageWindow.h;
        const p = this.layerDraw.position2pixels(pi);
        this.corners = detectCornersShiTomasi(this.layerDraw.ctx, p.x - 0.5 * ww, p.y - 0.5 * wh, ww, wh, {
            threshold: this.threshold,
            nmsRadius: this.nmsRadius,
            windowSize: this.windowSize,
        });
        if (this.corners.length > 0) {
            const corner = this.corners.sort((a, b) => b.score - a.score)[0];
            this.data.x0 = corner.x;
            this.data.y0 = corner.y;
            //console.log(pi, this.layerDraw.pixels2position(corner), corner.score);
        }
    };
    setPoint = () => {
        if (this.corners.length > 0) {
            const p = this.layerDraw.pixels2position(this.corners[0]); //el pi no se usa en el dibujo
            this.layerDraw.dispatchEvent(
                new CustomEvent("new-block", { bubbles: true, composed: true, detail: { type: "cut-point", data: this.data } }),
            );
        }
    };
    //Mandamos el subType o mode para orientar al create
    newBlock = () => {
        //this.corners = detectCornersShiTomasi(ctx, winX, winY, winW, winH);
        if (this.corners.length !== 1) return;
        //this.layerDraw.dispatchEvent(new CustomEvent("new-block", { bubbles: true, composed: true, detail: { type: "circle", data: this.data } }));
    };
    draw = (pi) => {
        //const r = scalePixels2mm(this.imageWindow.w);
        if (this.corners.length > 0) {
            const p = this.layerDraw.pixels2position(this.corners[0]); //el pi no se usa en el dibujo
            this.drawBlocks(pi.x, pi.y, [{ type: "cut-point", x0: p.x, y0: p.y }]);
        }
        //this.drawBlocks(pi.x, pi.y, createDrawElement("circle", { subType: "CR", cx: pi.x, cy: pi.y, r: r }));
        //this.hit = this.drawBlocks(pi.x, pi.y, createDrawElement("circle", { subType: "CR", cx: pi.x, cy: pi.y, r: r }));
    };
}
