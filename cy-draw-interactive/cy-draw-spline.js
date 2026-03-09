import DrawBasic from "./cy-draw-basic.js";

export class DrawSpline extends DrawBasic {
    constructor(layerDraw, mode) {
        super(layerDraw, "spline", mode);

        this.data = { subType: mode };
        this.moveFn = [[this.hover], []];
        this.clickFn = [[this.select], []];
        this.dataSent = [[], []];
        this.dataReceived = [];
    }
    //Al hacer click pasa de hover a selected
    select = (pi) => {
        let found = this.layerDraw.hover(pi.x, pi.y, undefined, true);
        if (!found || found.length === 0) return;
        found = found[0];
        if (found.type !== "path") return; //se podría avisar...
        this.layerDraw.dispatchEvent(new CustomEvent("path-to-spline", { bubbles: true, composed: true, detail: { data: { path: found } } }));
    };
    deleteData = () => {
        this.deleteDataBasic([]);
    };
    updateData = (data) => {
        this.updateDataBasic(data);
    };
}
