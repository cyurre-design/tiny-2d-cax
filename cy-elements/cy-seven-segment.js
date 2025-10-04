export default class CySevenSegment extends HTMLElement {

  constructor() {
    super();
    //el statechart completo decido hacerle shadow dom porque sí,
    this.dom = this.attachShadow({mode: 'open'});
    this.cfg= {options:{slant: 10, ledOffColor: 'grey', ledOnColor: 'red', ledOverflowColor: 'grey', nints:3, ndecs:2}};

  }
  createStyle() {
    let style = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            background-color: transparent;
            border: none;
            fill: transparent;
        }
        svg {
            width: 100%;
            height: 100%;
        }
    </style>
    `;

    return (style);
  }
  //TODO tratar signo
  createTemplate() {
    let delta = -80 * Math.sin(parseFloat(this.cfg.options.slant) * Math.PI / 180);
    let w = 57 - delta;
    let out = `
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox= "${delta} 0 ${w} 80" >
            <defs>
                <polyline id="h-seg" stroke="none" points="11 0, 37 0, 42 5, 37 10, 11 10, 6 5"  />
                <polyline id="v-seg" stroke="none" points="0 11, 5 6, 10 11, 10 34, 5 39, 0 39"  />
            </defs>
            <g  id='seven-segment-digit' class="sevenSeg" transform = ' skewX(-${this.cfg.options.slant})'>
                <use  href="#h-seg" x="0" y="0" />"
                <use  href="#v-seg" x="-48" y="0" transform="scale(-1,1)" />
                <use  href="#v-seg" x="-48" y="-80" transform="scale(-1,-1)" />
                <use  href="#h-seg" x="0" y="70" />"
                <use  href="#v-seg" x="0" y="-80" transform="scale(1,-1)" />
                <use  href="#v-seg" x="0" y="0" />
                <use  href="#h-seg" x="0" y="35" />
                <circle cx="52" cy="75" r="5" />                
            </g>
            <g id="led-row">
        `;
      for(let i=0;i<this.cfg.options.nints; i++)
        out += `<use xlink:href="#seven-segment-digit" x='${58*i}' y='0' id="digitInt${i}"/>`
      for(let i=0;i<this.cfg.options.ndecs; i++)
        out += `<use xlink:href="#seven-segment-digit" x='${58*(i + this.cfg.options.nints)}' y='0' id="digitDec${i}"/>`
      out += "</g>"
      return out + '</svg></div>';
    }

  connectedCallback() {
    this.dom.innerHTML = this.createStyle() + this.createTemplate();
    this.allSegments = Array.from(this.dom.querySelectorAll('use')); // Lista de referencias a segmentos SVG
    this.allSegments.push(this.dom.querySelector('circle'));
    let bits = {
      "": [],
      " ": [],
      "_": [3],
      "0": [0, 1, 2, 3, 4, 5],
      "1": [1, 2],
      "2": [0, 1, 3, 4, 6],
      "3": [0, 1, 2, 3, 6],
      "4": [1, 2, 5, 6],
      "5": [0, 2, 3, 5, 6],
      "6": [0, 2, 3, 4, 5, 6],
      "7": [0, 1, 2],
      "8": [0, 1, 2, 3, 4, 5, 6],
      "9": [0, 1, 2, 3, 5, 6],
      "-": [6],
      ".": [7]
    }
    // getStyling() {
    //   return new Styling(JSON.stringify({
    //     ledOnColor: 'red',
    //     ledOffColor: '#550000',
    //     ledOverflowColor: 'green',
    //     slant: '10'
    //   }));
    // }
    this.setDynamicData(123.45, false);
  }
  setDynamicData(value, isOverflow) {
    let newVal = String(value);
    if (parseFloat(value) === NaN) return; //Solo números

    this.onColor = (isOverflow) ? this.cfg.options.ledOverflowColor : this.cfg.options.ledOnColor;
    this.allSegments.forEach((el) => (el.setAttribute("fill", this.cfg.options.ledOffColor)));
  }
  setSegments(segments) {
    segments.forEach(el => el.setAttribute("fill", this.onColor));
  }

  changeDisplay() {
    if (this.selectedSegments === undefined)
        return;
    let value = this.value;
    let segments = [];
    let endsDot = value.endsWith('.');
    if (endsDot) {
        value = value.substring(0, value.length - 1);
    }
    if (this.selectedSegments.hasOwnProperty(value)) {
        segments = this.selectedSegments[value];
    }
    if (endsDot) {
        segments.push(this.allSegments["7"]);
    }
    this.clearDisplay();
    this.setSegments(segments);
}
changeDisplayNumber() {
  let value = this.value;
  this.clearDisplay();
  let isLogicalOverflow = this.isLogicalOverflow(value);
  if (value.startsWith('-')) {
      this.allDigits[0].setDynamicData('-', isLogicalOverflow);
      value = value.substring(1);
  }
  let floatNumber = value.split('.');
  let numIntsDisplay = this.cfg.options.nints;
  let numDecimalsDisplay = this.cfg.options.ndecs;
  let isPhysicalOverflow = this.isPhysicalOverflow(numIntsDisplay, numDecimalsDisplay, floatNumber);
  if (isPhysicalOverflow) {
      this.setValueToAllDigits(this.cfg.options.physicalOverflowChar);
  }
  else {
      let signPosition = 0;
      if (this.cfg.options.withSign) {
          signPosition = 1;
      }
      let intNumber = value.replace('.', '');
      let numIntNumber = intNumber.length;
      let numberIntPart = floatNumber[0];
      let numIntsNumber = numberIntPart.length;
      let numberInitPosition = numIntsDisplay - numIntsNumber + signPosition;
      let numberEndPosition = numberInitPosition + numIntNumber;
      for (let i = numberInitPosition, j = 0; i < numberEndPosition; i++, j++) {
          this.allDigits[i].setDynamicData(intNumber.charAt(j), isLogicalOverflow);
      }
      if (this.cfg.options.ndecs != 0) {
          let lastIntDigitPosition = numIntsDisplay - 1 + signPosition;
          this.allDigits[lastIntDigitPosition].setDynamicData(this.allDigits[lastIntDigitPosition].value + ".", isLogicalOverflow); // Se reescribe el último dígito entero con el punto.
      }
  }
}





  //Aquí recibiríamos eventos que son para nosotros o aquellos cuya app no se ha puesto bien
  //Los botones mandan tipo y comando
  handleEvent(evt) {
    const newEvent = new CustomEvent(evt.type, {
      detail: evt.detail
    });
    this.parentNode.dispatchEvent(newEvent);
    //this.parentNode.dispatchEvent(  new CustomEvent(evt.type, {detail:evt.detail}));
    // if (evt.type === this.app) {
    //     let command = evt.detail.action;
    //     switch (command) {
    //         default:
    //             console.log('unhandled event: ' + command + 'or unknown app ' + this.appName);
    //             break;
    //     }
    // }
  }
  //Se supone que aquí se llama al desconectar la página, pero en laa aplicaciones no parece que pase
  disconnectedCallback() {
    //hay que quitar los listeners... pero no se dejan?!
  }
  static get observedAttributes() {
    return ['slant','led-on-color'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case 'slant':
        this.cfg.options.slant = +newVal;
        break;
      case 'led-on-color':
        this.cfg.options.ledOnColor = newVal;
        break;
      case 'led-off-color':
          this.cfg.options.ledOffColor = newVal;
          break;
          default:
        break;
    }
  }

}
customElements.define('cy-seven-segment', CySevenSegment);