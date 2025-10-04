"use strict";

export default class GeometrySelection {
  constructor(svgHandler, geometry) {
    this.svg = svgHandler.svg;
    this.svgHandler = svgHandler;
    this.geometry = geometry;
    this.mode = '';
    this.z = undefined;
    this.selectTolerance = 1;
    this.linkTolerance = 0.1;

    this.leftClick = (pi, evt) => {
      //find element pointed, esto debería venir en el mensaje de ponernos , quiero decir, qué devolver
      if (this.mode === 'SEL') {
        let selectedElement = this.geometry.selectByPoint(pi, this.selectTolerance);

        this.svg.dispatchEvent(new CustomEvent('fgElementSelected', { detail: selectedElement, bubbles: true, composed: true }));
      } else if (this.mode === 'LINK') {
        this.geometry.link(pi, this.selectTolerance, this.linkTolerance);

        let selectedLayer;
        let profileLayers = this.geometry.getLayersByType("profile");
        profileLayers.forEach(layer => {
          if (layer.name !== "profile") {
            let selectedPath = layer.getSelected();
            if (selectedPath.length === 1) {
              selectedLayer = layer;

              this.geometry.layers.profile.data.push(selectedPath[0]);
              selectedLayer.removeSelected();

              this.geometry.link(pi, this.selectTolerance, this.linkTolerance);
            }
          }
        });

        if (selectedLayer) {
          this.svg.dispatchEvent(new CustomEvent("fgUpdateLayer", {detail: selectedLayer, bubbles: true, composed: true })); //bubbling
        }
      } else if (this.mode === 'UNLINK') {
        this.geometry.unlink(pi, this.selectTolerance);
      }

      if (this.z) {
        this.svg.removeChild(this.z);
        this.z = undefined;
      }
    };
    this.leftDblclick = (pi) => {
      let selectedElement = this.geometry.selectPath(pi, this.selectTolerance);

      this.svg.dispatchEvent(new CustomEvent('fgElementSelected', { detail: selectedElement, bubbles: true, composed: true }));
    };
    this.leftClickStart = (pi) => {
      if (this.mode === 'SEL') {
        this.z = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.z.setAttribute('class', 'zoom');
        this.z.setAttribute('x', pi.x);
        this.z.setAttribute('y', pi.y);
        this.z.setAttribute('width', 0);
        this.z.setAttribute('height', 0);
        this.svg.appendChild(this.z);
      }
    };
    this.leftClickMove = (pi, pf) => {
      if (this.mode === 'SEL' && this.z) {
        this.z.setAttribute('x', (pi.x < pf.x ? pi.x : pf.x));
        this.z.setAttribute('width', Math.abs(pf.x - pi.x));
        this.z.setAttribute('y', (pi.y < pf.y ? pi.y : pf.y));
        this.z.setAttribute('height', Math.abs(pf.y - pi.y));  
        this.z.setAttribute('vector-effect', "non-scaling-stroke");
      }
    };
    this.leftClickUp = (pi, pf) => {
      if (this.mode === 'SEL' && this.z) {
          this.geometry.selectInside(pi, pf);
          this.svg.removeChild(this.z);
          this.z = undefined;
        }
    };
    this.leftClickLeave = (pi, pf) => {
      if (this.z) {
        this.svg.removeChild(this.z);
        this.z = undefined;
      }
    };
    this.rightClick = (pi, evt) => {
      this.svg.classList.remove("paneClickCursor");
      this.leftDblclick(pi);
    };
  }
  setSelectMode(mode) {
    this.mode = mode;
    this.svgHandler.app(this);
  }
  //si hubiese alguna no numérica se haría el if correspondiente
  setAttribute(property, value) {
    this[property] = parseFloat(value);
  }
  getAttribute(property) {
    return this[property];
  }
}