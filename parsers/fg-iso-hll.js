'use strict'
  //YURRE: Agrupo todo lo sintáctico aquí. Este fichero sólo entiende línea de ascii y devuelve un bloque analizado
  //Hay una excepción que son los comodines, que es un array de ascii que se debe pasar desde la gestión de plano
  //Hay un alternativa que es pasarlo como nombre de eje válido a la ejecución.
  //El resto está desacoplado.
  
//YURRE: tratamiento comentarios:
// de línea: ;comentario o (comentario )
// de bloque: lo que empieza con (COMMENT BEGIN) y termina con (COMMENT END)
// Por eso se necesita la variable de estado this.commentBlock
let commentBlock = false;
let comodin = ['X','Y','Z','I','J','K'];  //preguntar Adelia a ver si es razonable
export function setAnalyzerComodines(arrOfComodines){
  comodin = arrOfComodines;
}
//análisis léxico del bloques:
export function tokenice(line, P, block){
  let lineSpaces = line;
  const nospaces = /\s+/g;
  const ralias = /R1=|G263=/;
  line = _supressComments(line, block);
  if(block.end === true) return;  //solo comentarios     
  line = line.replace(nospaces,'').toUpperCase();
  if(line.length === 0){block.empty = block.comments.length!==0?false:true; block.end = true; return;}  //flags para no hacer nada y no conservar el bloque
  //El condicional viene a comienzo de línea necesariamente
  const conditionalRegExp = /^(\/\d*)/;
  block.conditional = line.match(conditionalRegExp);
  if(block.conditional !== null)
    block.conditional = block.conditional[1];
  line = line.replace(conditionalRegExp,''); //y los quito

  //etiquetas N123: o [texto]
  const numberRegExp = /^(N\d+:?)|(N\d+)|^(\[\S+\])/;
  if(numberRegExp.test(line)){
    block.label = line.match(numberRegExp)[1]; //los separo
    line = line.replace(numberRegExp,''); //y los quito
  }

  //después de quitar condicional y etiquetas los bloques que comienzan por %, #, $ o L 
  //también los de asignaciones de variables V. o entes E
  //los guardo como infoPosMov y me los salto:
  if((line.charAt(0) === '#')||(line.charAt(0) === '$')||(line.charAt(0) === '%')||(line.charAt(0) === 'L')||
     ((line.charAt(0) === 'V')&&(line.charAt(1) === '.'))||(line.charAt(0) === 'E')){
    block.infoPostMov = `${lineSpaces}`;
    block.end = true;
    block.comments = '';
    return;
  }
    //Aquí viene sin comentarios, resuelvo paramétricas, es un nivel de MACRO en realidad
    line = line.replace(ralias,'G263R=');  //esto ya se queda para siempre
    let res = convertLine(line, P, block);
    //  if(block.hll)
    //   block.infoPostMov = `(${lineSpaces})`;
    //quito asignaciones paramétricas tipo P100=xxx:
    res = res.filter(eq=>(/P[^=]+=/.test(eq) === false));
    if(res.length > 0){
      //YURRE: introduzco dos niveles de trabajo, uno para la info que no vamos a tratar y otro para la tratada
      //Complica un poco esta parte pero simplifica mucho el resto del programa
    res=res.filter(t=>{
      switch(t.charAt(0)){
        case 'M': case 'F': case 'T': case 'D': case 'H': case ';': case 'L':{
          block.info.push(t);
          return(false);
        }
        //Cotas
        case 'X': case 'Y': case 'Z': case 'I': case 'J': case 'K': case 'U': case 'V': case 'W': case 'A': case 'B': case 'C': case 'R': case 'Q': case 'S':{
          let vs = t.split('=');
          if(vs.length === 1) //no hay
            block.pos[t.charAt(0)] = parseFloat(t.substring(1));
          else if(vs.length === 2)//si hay
            block.pos[vs[0]] = parseFloat(vs[1]);
          else block.error = 'sintax error ';
          if(t.length === 1) //no se admite cota-nada como cota 0, esto también previene la programación incremental con Eje-valor-I
            block.error = 'sintax error '; 
          return(false);
        }
        case '@':{ //Comodines, son una especie de macros y siempre vienen con @n=
          let c = parseInt(t.charAt(1));
          if((c < 1) || (c > 6)) {b.error = 'comodin desconocido'; break;}  //Solo hay 6 comodines
          if( t.charAt(2) !== '=') {b.error = 'sintax error: "=" expected'; break;}  //y el '=' es obligatorio
          if((c = comodin[c]) !== undefined)
            block.pos[c] = parseFloat(t.substring(3));           
          return(false);
        }
        default:
          return(true);
        }
    });
    //Aquí solo deben llegar las Gs porque el filter de arriba quita lo que ya está tratado
    res.forEach(t=>{
      //MORRALLA: resulta que R1=xxx es lo mismo que Rxxx y lo mismo que G263=xxx , alucinante
      t=t.replace(ralias,'R');
      switch(t.charAt(0)){
        case 'G': {
          let g = parseInt(t.substring(1));
          //if(gInfo[g] === undefined) //Gs que no se tratan y dan error:
          //  {block.error = 'sintax error: unknow gcode' + g;return;}
          // let group = this.gInfo[g].group;  //historia
          // if((group !== 'mirror') && (group.prog !==  'none')){
          //   block.error = 'sintax error: incompatible gcode at the same block:' + g;return;  //esto hay que chequearlo en el caso de otherGs
          // }
          block.gs.push(g);
          //group.prog = g;
          break;  //case G
        }
        default:
          if(t !== "")
            block.error = 'sintax error, unknow code: ' + t;
          break;
      }
    });
  }
  return;
}

function _supressComments(line, block, P){
  const comments = /\([^)]*\)|;.*/g;
  if(commentBlock === true){ //Si estoy dentro de un bloqe de comentarios, solo miro la salida
      if(/#\s*COMMENT\s*END/.test(line)){
        commentBlock = false; //Salgo del bloque de comentarios
      }
      block.infoPostMov = `${line}`;  //Todo lo de dentro se guarda como está
      block.end = true;
      return;
  } else if(/#\s*COMMENT\s*BEGIN/.test(line)){
      commentBlock = true;
      block.infoPostMov = `${line}`;
      block.end = true;
      return;
  }//Líneas normales, miro si hay comentarios
  block.comments = (line.match(comments)===null)?'':line.match(comments).join(' ');  //separo comentarios
  line = line.replace(comments,'');
  return(line);
}

function fg_cos(x){return(Math.cos(x*Math.PI/180));}
function fg_sin(x){return(Math.sin(x*Math.PI/180));}
function fg_tan(x){return(Math.tan(x*Math.PI/180));}
function fg_acos(x){return((180*Math.acos(x))/Math.PI);}
function fg_asin(x){return((180*Math.asin(x))/Math.PI);}
function fg_atan(x){return((180*Math.atan(x))/Math.PI);}
function fg_arg(x,y){return((180*Math.atan2(y,x))/Math.PI);}
function fg_abs(x){return(Math.abs(x))}
function fg_sqr(x){return(x*x)}
function fg_sqrt(x){return(Math.sqrt(x))}
function fg_log(x){return(Math.log10(x))}
function fg_ln(x){return(Math.log(x))}
function fg_exp(x){return(Math.exp(x))}
function fg_dexp(x){return(Math.pow(10,(x)))}
function fg_int(x){return(Math.trunc(x))}
function fg_round(x){return(Math.round(x))}
function fg_fup(x){return(Math.ceil(x))}



//TODO revisar , igual lo mejor es hacer funciones nuestras que hagan exactamente lo que se quiere,
// porque entran en grados y las estándar en radianes y otras son un poco especiales
const mathConvTable = [
  {re:/COS\[([^\]]+)\]/g, ss:'fg_cos('+"$1"+')'},
  {re:/SIN\[([^\]]+)\]/g, ss:'fg_sin('+"$1"+')'},
  {re:/TAN\[([^\]]+)\]/g, ss:'fg_tan('+"$1"+')'},
  {re:/ASIN\[([^\]]+)\]/g, ss:'fg_asin('+"$1"+')'},
  {re:/ACOS\[([^\]]+)\]/g, ss:'fg_acos('+"$1"+')'},
  {re:/ATAN\[([^\]]+)\]/g, ss:'fg_atan('+"$1"+')'},
  {re:/ARG\[([^\]]+)\]/g, ss:'fg_atan2('+"$1"+')'},
  {re:/ABS\[([^\]]+)\]/g, ss:'fg_abs('+"$1"+')'},
  {re:/SQR\[([^\]]+)\]/g, ss:'fg_sqr('+"$1"+')'},
  {re:/SQRT\[([^\]]+)\]/g, ss:'fg_sqrt('+"$1"+')'},
  {re:/LOG\[([^\]]+)\]/g, ss:'fg_log('+"$1"+')'},
  {re:/LN\[([^\]]+)\]/g, ss:'fg_ln('+"$1"+')'},
  {re:/EXP\[([^\]]+)\]/g, ss:'fg_exp('+"$1"+')'},
  {re:/DEXP\[([^\]]+)\]/g, ss:'fg_dexp('+"$1"+')'},
  {re:/INT\[([^\]]+)\]/g, ss:'fg_int('+"$1"+')'},
  {re:/ROUND\[([^\]]+)\]/g, ss:'fg_round('+"$1"+')'},
  {re:/FUP\[([^\]]+)\]/g, ss:'fg_fup('+"$1"+')'},
];

export function convertLine(line, P, block){
    //tratar maths porque pueden ir con otras cosas como variables V.P que hay que tratar
    //ponemos las funciones en minúsculas para no interferir con las regexp siguientes
    mathConvTable.forEach(f=>{
      if((f.re).test(line) === true){
        line = line.replace(f.re, f.ss);
        block.hll = true;
      }
    });
      line = line.replace(/([A-O,Q-Z,@])/g,','+"$1"); //Separo los grupos "normales"
      //una concesión al PP100 por ejemplo en vez de P[P100] y luego se sustituye numéricos normales P101 por array, que es lo que es
      line = line.replace(/PP(\d+)/g,'P[P['+"$1"+']]').replace(/P(\d+)/g,'P['+"$1"+']');
      //Habilidad? Esta línea es fundamental, separo las ecuaciones, que pueden venir varias en la misma línea !!!
      line = line.replace(/([^\[\(\/A-O,Q-Z,@=\+\-\*\%])P/g,"$1"+',P').replace(/^,/,"");
      if(line.indexOf('P') !== -1) block.hll = true;  //Aviso de que guarde el bloque
      line = line.replace(/([A-Z])0(\d)/g,"$1"+"$2");  //intento quitar los "octales"
      let equations = line.split(',');
      //Esto es ya ejecución, las paramétricas lo primero, pero esto se puede separar de aquí
      //Separo en dos fases: lo primero, asigno los valores a parámetros, es decir, ejecuto las sentencias de asignación
      equations.forEach((eq)=>{
        if(/P[^=]+=/.test(eq) === true) //las que son asignación a parámetro
          eval(eq);
      })
      //Segunda fase, hemos obtenido los valores, ahora hay que sustituirlos en los XP
      //Las ecuaciones son las que no se han tocado antes...pero no se puede poner un else porque hay un orden de hacer las cosas
      //El match coge TODO lo que hay detrás del token X,G... y evalúa cosas como X-2/5 , pero tambien G100/2... 
      //Igual lo mejor es dejarlo como está...también se puede habilitar solo para algunas letras (XYZ..) y las G usar obligatoriamente GP....
      let result; //auxiliar para el eval
      equations.forEach((eq,ix)=>{
        if(/P[^=]+=/.test(eq) === false){  //GP[] XP[] X1=P[]...XP[100+cos(1)], lo contrario de la anterior
          //let pars = eq.match(/([A-O,Q-Z])(\d*=)?([^P]*P.*)/g);  //incluyo XP y X=P y evalúo todo aquí?
          let pars = eq.match(/([A-O,Q-Z,@])(\d*=)?(.*)/g);  //incluyo XP y X=P y evalúo todo aquí?
          //match devuelve un array o null, el array solo debe tener 1 elemento, en principio...
          //Y en el 8065 NO se permite programa X en vez de X0, debe haber algo a la derecha siempre
          result = ''; 
          if(pars!==null){
            if( RegExp.$3 !== '')
              eval('result=Math.round(10000*('+RegExp.$3+'))/10000');
            equations[ix] = RegExp.$1 + RegExp.$2 + result;
          }
        }
      })
      return(equations);
}