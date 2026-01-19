export function TX0Y0(t) { return(
`<div class="full">X0<input id="data-${t}-x0" class="_33" type="number" value="0" step="0.5"/>
Y0<input id="data-${t}-y0" class="_33" type="number" value="0" step="0.5"/></div>`)}
export function TX1Y1(t) { return(
`<div class="full">X1<input id="data-${t}-x1" class="_33" type="number" value="0" step="0.5"/>
Y1<input id="data-${t}-y1" class="_33" type="number" value="0" step="0.5"/></div>`)}
export function TCXCY(t) { return(
`<div class="full">CX<input id="data-${t}-x0" class="_33" type="number" value="0" step="0.5"/>
CY<input id="data-${t}-y0" class="_33" type="number" value="0" step="0.5"/></div>`)}
export function TA(t) { return(
`<cy-input-data-angle id="data-${t}-a" class="data"></cy-input-data-angle>`)}
export function TD(t) { return(
`D<input id="data-${t}-d"  class="_33" type="number" value="0" step="0.5"/>`)}
export function TXx1(t) { return(
`X<input id="data-${t}-x1"  class="_33" type="number" value="0" step="0.5"/>`)}
export function TYy1(t) { return(
`Y<input id="data-${t}-y1"  class="_33" type="number" value="0" step="0.5"/>`)}
export function TXx0(t) { return(
`X<input id="data-${t}-x0"  class="_33" type="number" value="0" step="0.5"/>`)}
export function TYy0(t) { return(
`Y<input id="data-${t}-y0"  class="_33" type="number" value="0" step="0.5"/>`)}
export function TR(t) { return(
`R<input id="data-${t}-r" type="number" value="0" step="0.5"/>`)}
export function TL(t) { return(
`L<input id="data-${t}-l" type="number" value="0" step="0.5"/>`)}
export function TX2Y2(t) { return(
`X2<input id="data-${t}-x2" class="_33" type="number" value="0" step="0.5"/>
Y2<input id="data-${t}-y2" class="_33" type="number" value="0" step="0.5"/>`)}

export function TENTER(t) { return(
`<div><input type="button" id="data-${t}-enter" value="ENTER"/></div>`)}
export function TESC(t) { return(
`<div><input type="button" id="data-${t}-escape" value="ESC"/></div>`)}
export function TBACK(t) { return(
`<div><input type="button" id="data-${t}-back" value="BACK"/></div>`)}
export function TSAVE(t) { return(
`<div><input type="button" id="data-${t}-save" value="SAVE"/></div>`)}
export function TINS(t) { return(
`<div><input type="button" id="data-${t}-insert" value="INSERT"/></div>`)}
export function TINVERT(t) { return(
`<div><input type="button" id="data-${t}-invert" value="INVERT"/></div>`)}
export function TSTART(t) { return(
`<div><input type="button" id="data-${t}-start" value="START"/></div>`)}
export function TORDER(t) { return(
`<div><input type="button" id="data-${t}-order" value="ORDER"/></div>`)}
export function TEND(t) { return(
`<div><input type="button" id="data-${t}-end" value="END"/></div>`)}
export function TLINK(t) { return(
`<div><input type="button" id="data-${t}-link" value="LINK"/></div>`)}
export function TUNLINK(t) { return(
`<div><input type="button" id="data-${t}-unlink" value="UNLINK"/></div>`)}
export function TOR(t) { return(
`<div><input type="button" id="data-${t}-or" value="OR"/></div>`)}
export function TAND(t) { return(
`<div><input type="button" id="data-${t}-and" value="AND"/></div>`)}
export function TNOT(t) { return(
`<div><input type="button" id="data-${t}-not" value="NOT"/></div>`)}
export function TXOR(t) { return(
`<div><input type="button" id="data-${t}-xor" value="XOR"/></div>`)}
export function TSCALE(t) { return(
`<div class="half" >NUM<input id="data-${t}-sn" class="_33" type="number" value="0" step="0.5"/></div>
<div class="half">DEN<input id="data-${t}-sd" class="_33" type="number" value="0" step="0.5"/></div>`)}
export function TEDIT(t) { return(
`<div class="full"><textarea autofocus contenteditable="plaintext-only" id="iso-input-${t}" ></textarea></div>`)}
export function TCWCCW(t) { return(
`<select class="data" id="data-${t}-way"><option value="clock">CW</option><option value="antiClock">CCW</option></select>`)}
export function TL2RR2L(t) { return(
`<select class="data" id="data-${t}-invert"><option value="l2r">L2R</option><option value="r2l">R2L</option></select>`)}


function keyFromId(id) {return id.split('-').pop()}
//Función de subtipo, cuando se han generado inputs de tdos pero solo son activas las del subtipo
export function inputDataSubtype(it, filter){
    it.keys=[]; it.data = []; it.inputs = [];
    const inputs = it.allInputs.filter(el => el.id.startsWith(filter))
    for(let ix = 0; ix < inputs.length; ix++){
        const inp = inputs[ix];
        const k =  keyFromId(inp.id);
        it.keys[ix] = k
        it.data[k] = inp.value;
        it.inputs[k] = inp
    }
}
//Nos pasan el propio componente
export function inputDataInit(it){
    it.dom.innerHTML= it.createStyle() + it.createTemplate();
    let inputs      = Array.from(it.dom.querySelectorAll('input'));
    const others    = Array.from(it.dom.querySelectorAll('.data'));
    it.allInputs = inputs.concat(others);
}
//Solo funcionan cuando el componente está en display block, si está en none no hace caso
// el filtro de teclas debería ser un parámetro a setEventHandlers o hacerlo miembro y ponerlo en un set
const Keys4Events =  ["Enter", "Escape"]

export function setEventHandlers(it){
//Pongo los handlers explícitos, se podrían llamar a específicos con callbacks o hooks
    it.dom.addEventListener('change', (evt)=>{
        const detail = {};
        const k = keyFromId(evt.target.id);
        it.data[k] = evt.target.value;
        detail[k]=evt.target.value; //La idea es pasar solo lo que cambia. Pasar todo tiene efectos colateralss
        it.dispatchEvent(new CustomEvent('input-data',{bubbles:true, composed:true, detail: detail}))
    })
    it.dom.addEventListener('click', (evt)=>{        
        const detail = {};
        if(evt.target.type === "button"){
            const k = keyFromId(evt.target.id);
            detail[k] = evt.target.value;
            it.dispatchEvent(new CustomEvent('input-click',{bubbles:true, composed:true, detail: detail}))
        }
    });
    it.dom.addEventListener('keyup', (evt)=>{
        const key = evt.key;
        if( Keys4Events.indexOf(key) > -1){
            const detail = {};
            const k = keyFromId(evt.target.id);
            detail[k] = evt.target.value;
            it.dispatchEvent(new CustomEvent('input-key',{bubbles:true, composed:true, detail: detail}))
        }
    })
}
export function initialDataBasic(it, data){
    if(!data) return;
    for(let [k,v] of Object.entries(data)){
        if(it.dom.querySelector('#data-'+k) !== null)
            it.dom.querySelector('#data-'+k).value = v
        }
    }

//cambiado a recibir un array de key,value
export function inputDataUpdate(it, received){
    function format(n){ return(n.toFixed(3))};
    received.data.forEach(el => {
    if(it.inputs[el.idn]){
        const v = format(+el.v);
        it.inputs[el.idn].value = v;
        it.data[el.idn] = v
        }
    })
}

//Creo que ya no haría falta...
export async function waitForChildComponent(parent, selector) {
  // 1. Esperar a que el custom element esté definido
  await customElements.whenDefined(selector);

  // 2. Dejar que el DOM termine de montar (microtask)
  await Promise.resolve();

  // 3. Seleccionar el nodo (shadow DOM o light DOM)
  const root = parent.shadowRoot ?? parent;
  const el = root.querySelector(selector);

  if (!el) {
    console.warn(`No se encontró el elemento ${selector} dentro de`, parent);
    return null;
  }

  return el; // Instancia ya "upgradada"
}
