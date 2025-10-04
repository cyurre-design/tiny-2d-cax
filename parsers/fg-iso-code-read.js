'use strict'
import {tokenice, setAnalyzerComodines } from './fg-iso-hll.js';

export default class Channel 
{
  constructor(configRead){
    this.blocks = [];
    //grupos de Gs:
    //YURRE: la funtion se llama en premov y es siempre de grupos, quiero decir que salvo una excepción se llama a la misma función para todas las del grupo
    //Así que, por simplificación, se puede simplificar y homogeneizar
    //Gs de movimiento
    this.groupInfo = {
      'move' : [{n:0,modal:true},{n:1,modal:true},{n:2,modal:true},{n:3,modal:true},
                {n:8,modal:false},{n:9,modal:false},
                {n:36,modal:false},{n:37,modal:false},{n:38,modal:false},{n:39,modal:false}],
    //determinación del plano de trabajo
      'plane' : [{n:17,modal:true},{n:18,modal:true},{n:19,modal:true},{n:20,modal:true}],
    //unidades
      'units' : [{n:70,modal:true},{n:71,modal:true}],
    //incremental o ansoluto
      'incr' : [{n:90,modal:true},{n:91,modal:true}],
    //centros de polares y tal, la G30 hay que estudiarla más, y la G31 solo se usa con G2,G3...
      'center' : [{n:6,modal:false},{n:31,modal:false},{n:261,modal:true},{n:262,modal:true},{n:263,modal:false}],
    //mirror, compatibls con movimiento,  pero la G11 y G12 y G13 son compatibles entre sí....
      'mirror' : [ {n:10,modal:false},{n:11,modal:false},{n:12,modal:false},{n:13,modal:false}],
    //traslados de origen, metido al poner la G92, darán todos error? menos G53 (anular ) y G92 (preselección) y no son modales
      'traslados' : [ {n:53,modal:false}, {n:92,modal:false}],
    //radios o diámetros
      'diameters': [ {n:151,modal:true}, {n:152,modal:true}],
    //Gs sin efecto geométrico que se dejan pasar:
      'other' : [5,7,40,41,42,50,60,61,80,93,94,95,96,97,98,99,108,109,136,137,138,139,192,193,196,197,264,265,266].map(g=>Object.assign({},{n:g,modal:false})),
    //Gs sin efecto que se dejan pasar pero que conllevan programación de cotas que no hay que tratar:
    //YURRE: La G14 y la G73 se tratan pero el concepto es el mismo, no son compatibles con movimientos
      'nomove' : [4,14,30,72,73,112,115,116,117,120,121,122,123,130,131,132,133,134,135,170,171,198,199].map(g=>Object.assign({},{n:g,modal:false}))
    // Creación de un objeto por G para mirar después de forma más directa si es model o no y a qué grupo pertenecs
   }
    //YURRE: Trato la incompatibilidad entre grupos en BeforeMove y de forma explícita por legibilidad
    this.historia = {
      gGroups:{"move":{Gs:this.groupInfo.move, prog: 'none', active: 'none', funtion:"setMoveBeforeMove"},
                "plane":{Gs:this.groupInfo.plane, prog: 'none', active: 'none', funtion:"setPlaneBeforeMove"},
                "units":{Gs:this.groupInfo.units, prog: 'none', active: 'none', funtion:"setUnitsBeforeMove"},
                "incr":{Gs:this.groupInfo.incr, prog: 'none', active: 'none', funtion:"setIncrBeforeMove"},
                "center":{Gs:this.groupInfo.center, prog: 'none', active: 'none', funtion:"setCenterBeforeMove"},
                "mirror":{Gs:this.groupInfo.mirror, prog: 'none', active: 'none', funtion:"setMirrorBeforeMove"},
                "traslados":{Gs:this.groupInfo.traslados, prog: 'none', active: 'none', funtion:"setTrasladosBeforeMove"},
                "nomove":{Gs:this.groupInfo.nomove, prog: 'none', active: 'none', funtion:"setNomoveBeforeMove"},
                "diameters":{Gs:this.groupInfo.diameters, prog: 'none', active: 'none', funtion:"setDiameterOrRadius"},
                "other":{Gs:this.groupInfo.other, prog: 'none', active: 'none', funtion:"setOtherBeforeMove"}
      },
      pos:{ R:0, Q:0 },
      posReal:{},
      polarOrigin:{}
    }
    //para acelerar y mejorar legibilidad pongo la info también asociada a la g
    this.gInfo = [];  //Guardamos su grupo y si es modal o no
    for(let gr in this.historia.gGroups){
      this.historia.gGroups[gr].Gs.forEach(g=>{
        this.gInfo[g.n]=Object.assign({},{gname: gr, group:this.historia.gGroups[gr], modal:g.modal/*, funtion:g.funtion*/});
      });
    }
    //variables globales:
    this.P = []; //se pueden crear e inicializar si se quiere, son para le ejecución de paramétricas
    this.error = []; //gestión de errores
    this.hayCotas = false;  //Necesario porque setPlane, en caso contrario, daría error, a mejorar
    //esto son funciones que se relLenan en función del tipo de movimiento
    this.moveCommand = (b)=>{b.error = 'uninitialized channel'; return};
    //La inicialización ya debe poner las funciones anteriores a sus valores de inicio
    //La incialización pone todos los ejes, plano, etc... necesarios, las variables de trabajp
    this._initFromConfig(configRead);
    //gestión de errores:
    if(this.error.length != 0){
      //PENDIENTE gestión de errores: concateno todos los errores ¿cómo devuelvo esto para que se trate?
      this.error = 'Incorrect configuration: ' + this.error.join( );
      return; //no sigo con una configuración incorrecta
    }
    //Y aquí inicializamos la historia
    //this._X... son los nombres de los ejes del plano de programación, aquí inicializamos la posición a o,o, lo que es arbitrario
    this.historia.pos[this._X] = 0; //de paso crea las propiedades en el objeto pos.
    this.historia.pos[this._Y] = 0;
    if(this._L !== undefined) 
      this.historia.pos[this._L] = 0;
    this.historia.posReal[this._X] = 0; //de paso crea las propiedades en el objeto pos.
    this.historia.posReal[this._Y] = 0;
    if(this._L !== undefined) 
        this.historia.posReal[this._L] = 0;
    this.historia.polarOrigin[this._X] = 0;
    this.historia.polarOrigin[this._Y] = 0;
    this.historia.pos.R = 0;
    this.historia.pos.Q = 0;
    this.historia.radius = 0;

    this.historia.offsetG92_X = 0;
    this.historia.offsetG92_Y = 0;
    //this.historia.mirrorX = 1;
    //this.historia.mirrorY = 1;
    // this.historia.scaleFactor = 0;
    // this.historia.rotate = false;
    // this.historia.rotationCenterX = 0;
    // this.historia.rotationCenterY = 0;
  }
  //Las variables de plano planexx se ponen a partir del plano (17,18,19...) y luego las puede leer el HMI porque se pueden cambiar por programa
  //Lo mismo pasa con las unidades, incrmental...
  _initFromConfig(configRead){
    //configuración para lectura ISO. La escritura se hace en otra parte, pero la estructura debería ser la misma
    //default por si no me pasan ninguna, para evitar errores. Se supone que se lee de parámetros máquina
    //Existe unna conversión interna a config aquí mismo y una traducción a la lectura, en getConfig
    this.config = {mainAxis:['X','Y','Z'],plane:17,planeAxis:['X','Y'],config:'triedro',  //fresadora estándar 3 ejes plano XY
                  mainDiamAxis:[false,false,false],planeDiamAxis:[false,false],
                  move:0, units: 71, incr:90, /*polar:false, centerRad:false, PROGTL3:false, code:'8070',*/ infoAux:'full'};
    //Si viene una lo leo con cuidado
    if(configRead !== undefined){
      this.config = configRead;
      if((Array.isArray(configRead.mainAxis)!==true) || (configRead.mainAxis.length < 2)) this.error.push('Number of Axis must be greater or equal than 2');
      this.config.mainAxis = configRead.mainAxis.slice(); //copy
      if((Array.isArray(configRead.mainDiamAxis)!==true) || (configRead.mainDiamAxis.length < 2)) this.error.push('Number of Axis must be greater or equal than 2');
      this.config.mainDiamAxis = configRead.mainDiamAxis.slice(); //copy
      this.config.diam = (this.config.mainDiamAxis.some(el=>el===true)?151:152);
      let units = {70:70, 71:71, 'mm': 71, 'inches': 70, 'in': 70 }[configRead.units];
      if((units !== 71 ) && (units !== 70 )) this.error.push('units must be mm(71) or inches(70)');
      this.config.units = units;
      //YURRE: en la entrada, NO puede venir un G20, eso solo se hace en el programa, creo que no hay parámetro
      let plane = {17:17, 18:18, 19:19, 'XY':17, 'ZX':18, 'YZ':19 }[configRead.plane];
      if((plane !== 17)   && (plane !== 18) && (plane !== 19))  this.error.push("plane must be 17 ('XY'), 18 ('ZX') or 19 ('YZ')");
      if((configRead.config === 'plane') && (plane !== 18)) this.error.push("for standard lathe only G18 is allowed");
      this.config.plane = plane;
      let move =  {0:0, 1:1, 'G0':0, 'rapid':0, 'G00':0, 'G1':1, 'G01':1, 'programmed':1 }[configRead.move];
      if((move !== 0) && (move !== 1)) this.error.push("move must be in rapid (0) o programmed (1) ");
      this.config.move = move;
      let incr =  {90:90, 91:91, 'abs':90, 'absolute':90, 'inc':91, 'incremental':91 }[configRead.incr];
      if((incr !== 90) && (incr !== 91)) this.error.pushw("move must be in absolute (90) or incrmental (91) ");
      this.config.incr = incr;
      //this.config.infoAux = configRead.infoAux;
    }
    //Y a partir de aquí ya no se hace referencia a configRead
    //Las llamo con bloque porque así la lógica de que se pongan activas es automática y además si cambio la implementación de flags debería funcionar
    //A cambio no se pueden poner todas en el mismo bloque porque hay incompatibilidades
      let result = {gs:[this.config.units, this.config.incr, 10, 262, this.config.move, this.config.plane, this.config.diam ], pos:[], info:[]}; //dummmy para las inicializaciones, se supone que no dan error
      this.historia.plane = undefined; //Para evitar que setPlane salga sin hacer nada
      this.processBlockBeforeMov(result);
      this.resetBlockConditions(result);
      result = {gs:[53 ], pos:[], info:[]}; //dummmy para las inicializaciones, se supone que no dan error
      this.processBlockBeforeMov(result);
      this.resetBlockConditions(result);
      result = {gs:[73 ], pos:[], info:[]}; //dummmy para las inicializaciones, se supone que no dan error
      this.processBlockBeforeMov(result);
      this.resetBlockConditions(result);
      result = {gs:[72 ], pos:[], info:[]}; //dummmy para las inicializaciones, se supone que no dan error
      this.processBlockBeforeMov(result);
      this.resetBlockConditions(result);
      this.hayCotas = false;  //Necesario porque setPlane, en caso contrario, daría error, a mejorar
      // this.setUnitsBeforeMove(this.config.units, result);
      // this.setIncrBeforeMove(this.config.incr, result);
      ///let tmp = this.config.plane;
      //this.config.plane = undefined; //Para evitar que setPlane salga sin hacer nada
      //this.setPlaneBeforeMove(tmp,result);
      // this.setCenterBeforeMove(262,result); //YURRE:TODO...¿Hay parámetro o algo?
      // this.setNomoveBeforeMove(73,result);  //inicializo rotación del plano, necesita pos que debe estar al menos definido
      // this.setMoveBeforeMove(this.config.move,result);
      // this.resetBlockConditions(result);
      if(result.error !== undefined) this.error.push("Error setting initial conditions");
  }
  _getConfig(){
    let config = this.config;
    config.mainAxis = [this._X, this._Y, this._L];
    config.plane= this.historia.plane;
    config.planeAxis = [this._X, this._Y];
    config.mainDiamAxis = [false,false,false];
    config.planeDiamAxis = [this._Xd,this._Yd];
    config.move = this.historia.move === 0? 'rapid':'programmed';
    config.units = this.historia.units === 70?'inches':'mm';
    config.incr = this.historia.incr===90?'absolute':'incremental';
    //el resto no tocamos ?
    return (config);
  }
  
  processBlockBeforeMov(block){ 
    //procesa las Gs programadas, solo una G por grupo (de la historia) puede estar programada
    //el orden parece importante . La función de movimiento sólo se debe llamar en las de movimiento
    if(block.gs.some(g=>(this.gInfo[g]===undefined)))//Gs que no se tratan y dan error:
      {block.error = 'Sintax error: gcode not valid';return;}
    //les pego el grupo a cada g por sencillez y legibilidad
    block.gs = block.gs.map(g => Object.assign( {}, {g:g, gname: this.gInfo[g].gname}));
    //Las mirror están en un grupo pero son compatibles, toda esta gestión no termina de convencerme
    block.gs.filter(g=>((g.gname!=='mirror'))).forEach(g=>{
      if(this.historia.gGroups[g.gname].prog === 'none') this.historia.gGroups[g.gname].prog = g.g;
      else if(g.gname!=='other') block.error = 'Sintax error: incompatible gcode at the same block:' + g.g;
    });
    if(block.error !== undefined) return;
    //YURRE: HACK , convierto las gs de mirror a bits, ya las trataré luego, es que son compatibles
    let mirrors = block.gs.filter(g=>g.gname==='mirror').reduce((acc, g)=>(acc += (1<<g.g-10)),0);
    if(mirrors !== 0)
      this.historia.gGroups['mirror'].prog = mirrors;
    //Test entre grupos, a ir rellenando
    let n = ['move','nomove','traslados'].reduce((acc, el)=>(acc += (this.historia.gGroups[el].prog!=='none')?1:0),0);
    if(n>1) {block.error = 'incompatible groups programmed in the same line'; return;}  //Más de 1 grupo programado
    ['other','nomove','plane','units','traslados','incr','center','mirror','diameters','move'].forEach(group=>{
      let gr = this.historia.gGroups[group];
      if(gr.prog !== 'none')
        this[gr.funtion](gr.prog, block); 
      });
    //YURRE: Por homogeneidad, decido no generar la parte de perfil en las funtion, que solo hacen "preparación"
  }
  //procesa información del bloque después del movimiento
  processBlockAfterMov(b){ 
    //De momento nada, podría tratarse la información que se evalúa después del movimiento: Ms(después)
  }
  resetBlockConditions(b){ 
    //actualiza la historia con la nueva G modal del grupo y borra información no modal del bloque
    //YURRE: Ahora que los grupos tienen la función igual es mejor llamar directamente
    //Además el orden parece importante . La función de movimiento sólo se debe llamar en las de movimiento
    //Desde ese punto de vista se podría poner la función directamente aquí... igual es más fácil
    ['plane','units','incr','traslados','center','move'].forEach(group=>{
      let gr = this.historia.gGroups[group];
      if(gr.prog !== 'none'){ //Se ha programado una g en ese grupo
        if(gr.active !== gr.prog){ 
          if(this.gInfo[gr.prog].modal === true)
            gr.active = gr.prog;  //si es modal se pone activa y si es distinta de la activa, ya se habrá ejecutado su función...
          else
            this[gr.funtion](gr.active, b);//ejecuta la función modal que estaba antes de programar la no modal
        }
      }
    });
    for(let group in this.historia.gGroups)
      this.historia.gGroups[group].prog = 'none';
  }
  setOtherBeforeMove(g,b){}
  setDiameterOrRadius(g,b){
    //radios/diámetros:
    if(g === 152) this.historia.diam = false; //desactiva diámetros en la lectura ISO
    else if (g === 151) this.historia.diam = true;
  }
  //Las funciones que tienen "cotas" y se usan, hay que quitarlas de pos porque si no la G de movimiento modal activa las usa :(
  //Van solas en el bloque, borro b.ps al final
  setNomoveBeforeMove(g,b){
    switch(g){
      case 14:{//mirror
        if(b.pos[this._X] !== undefined){
          if((b.pos[this._X] !== 1) &&  (b.pos[this._X] !== -1)) {b.error = 'syntax error in mirror axis ' + this._X; return;}
          this.historia.mirrorX = b.pos[this._X];
        }
        if(b.pos[this._Y] !== undefined){
          if((b.pos[this._Y] !== 1) &&  (b.pos[this._Y] !== -1)) {b.error = 'syntax error in mirror axis ' + this.this._Y; return;}
          this.historia.mirrorY = b.pos[this._Y];
        }
      }
      break;
      case 73:{
        if((b.pos['I'] === undefined) && (b.pos['J'] === undefined) && (b.pos['Q'] === undefined)){ //Anula giro
          this.historia.rotationCenterX = 0; this.historia.rotationCenterY = 0; 
          this.historia.rotationMatrix = {a:1, b:0, c:0, d:0, e:1, f:0}; //tipo svg
          this.historia.rotationAngle = 0;
          this.historia.rotate = false;
          break;
        }
        if(b.pos['I'] !== undefined){
          if(b.pos['J'] === undefined) {b.error = 'G73 rotation center needs both coordinates defined in the block'; return;}
          this.historia.rotationCenterX = parseFloat(b.pos['I']); this.historia.rotationCenterY = parseFloat(b.pos['J']); 
        }
        if(b.pos['Q'] === undefined){b.error = 'G73 angle Q is mandatory in the block'; return;}
        this.historia.rotationAngle += parseFloat(b.pos['Q']);
        let alfa = (Math.PI*this.historia.rotationAngle)/180;
        this.historia.rotationMatrix = {
          a: Math.cos(alfa), b: -Math.sin(alfa), c: this.historia.rotationCenterX,
          d: Math.sin(alfa), e: Math.cos(alfa), f: this.historia.rotationCenterY
        }
        this.historia.rotate = true;
      }
      break;
      case 72:{ //se programa con 'S' y no controlo que venga detrás de la G72, que es una morralla
        if((b.pos['S'] === undefined) || (b.pos['S'] === 0) || (b.pos['S'] === 1))
          this.historia.scaleFactor = 0;   //Anulación
        else{
          this.historia.scaleFactor = b.pos['S'];
        }
      }
      break;
      case 30:{ //origen polar, usa I y J, son obligatorios los dos campos o ninguno
        //YURRE: Hay que tratar el orden entre grupos....
        let d = {x:1, y:1}          //multiplicador radios/diámetros: 
        if(this.historia.diam) { d.x = (this._Xd)? 0.5 : 1; d.y = (this._Yd)? 0.5 : 1;}
        if((b.pos['I'] !== undefined)&&(b.pos['J'] !== undefined)){
          this.historia.polarOrigin.X = d.x*b.pos['I'];
          this.historia.polarOrigin.Y = d.y*b.pos['J'];
          let xp = this.historia.pos.X-this.historia.polarOrigin.X, yp= this.historia.pos.Y-this.historia.polarOrigin.Y;
          this.historia.pos.R = Math.sqrt(xp*xp + yp*yp);
          this.historia.pos.Q = 180*Math.atan2(yp, xp)/Math.PI; 
        }
        else if((b.pos['I'] === undefined)&&(b.pos['J'] === undefined)){  //origen donde estamos
          this.historia.polarOrigin.X = this.historia.pos[this._X];
          this.historia.polarOrigin.Y = this.historia.pos[this._Y];
          this.historia.pos.R = 0;
          this.historia.pos.Q = 0; 
        }
        else{b.error = 'syntax error defining polar center: both coordinates needed'}
      }
      default:
        break;
    }
    //estas Gs se evalúan pero no quiero que se generen al escribir ISO:
    //b.info.push(`G${g}`);
    //let otherAxis = Object.keys(b.pos);
    //b.info.push(...otherAxis.sort().map(ax => `${ax}=${b.pos[ax]}`));
    b.pos = {};
    //this.moveCommand = this.moveNone;
  }
  //YURRE: estas funciones son compatibles con los movimientos, no así la G14, que tiene programación tipo cota
  //Y se activa antes del movimiento. He codificado los mirrors en 4 bits, el bit 1 es anular, así que todos los impares menos 1 son error
  setMirrorBeforeMove(g,b){
    switch(g){
      case 3,5,7,9,11,13,15:
        b.error = 'syntax error : mirror programming and deleting in the same block'; return;
      case 1:  //anula imagen espejo
        this.historia.mirrorX = 1;
        this.historia.mirrorY = 1;
        this.historia.mirrorZ = 1;
        break
      case 2: case 10:  //espejo en X o en X,Z
        this.historia.mirrorX = -1; break;
      case 4: case 12:  //espejo en Y o en Y,Z
        this.historia.mirrorY = -1; break;
      case 6: case 14: //en X e Y o X,Y,Z
        this.historia.mirrorX = -1;
        this.historia.mirrorY = -1;
        break;
      case 8:  //espejo en Z... o es en el longitudinal?? no haré nada
        /*this.historia.mirrorZ = -1;*/ break;
      default:
        break;
    }
}
  //YURRE: Meto aquí traslación, rotación 
  setTrasladosBeforeMove(g,b){
    switch(g){
      case 53:  //anula traslados
        this.historia.offsetG92_X = 0;
        this.historia.offsetG92_Y = 0;
        break;
      case 92:  //preseleccion
        if(b.pos[this._X] !== undefined)
          this.historia.offsetG92_X = this.historia.pos[this._X] - b.pos[this._X];
        if(b.pos[this._Y] !== undefined)
          this.historia.offsetG92_Y = this.historia.pos[this._Y] - b.pos[this._Y];
        b.pos = {};
        break;
      default:
        break;
    }
  }
  //función asociada al grupo de Gs de movimiento (se ejecuta al programar una G del grupo)
  setMoveBeforeMove(g,b){
    switch(g){
      case 0:  this.moveCommand = this.moveMove; break;
      case 1:  this.moveCommand = this.moveLine; break;
      case 2:  this.moveCommand = this.moveCircle; b.moveDir = 'clock'; break;
      case 3:  this.moveCommand = this.moveCircle; b.moveDir = 'antiClock'; break;
      case 8:  this.moveCommand = this.moveCircleTangent; break;
      case 9:  this.moveCommand = this.moveCircle3Points; break;
      case 36: this.moveCommand = this.moveRound; break;
      case 37: this.moveCommand = this.moveTangEntry; break;
      case 38: this.moveCommand = this.moveTangExit; break;
      case 39: this.moveCommand = this.moveChamfer; break;
      default: this.moveCommand = this.moveNone;break;
    }
  }
 //función asociada al grupo de Gs de definición de plano (se ejecuta al programar una G del grupo)
 //YURRE: La G20 se puede ejecutar, se quiere ejecutar, incluso con ejes que no estén en la configuración
 //Esto está hablado con Adelia, una cosa es lo que me pasen, que solo puede ser G17,G18 y G19 en la configuración
 //Y otra cosa lo que se programa. Se puede hacer G20 X2=1 Y2=2 Z2=3 aunque solo haya ejes X,Y,Z
 //Otras especificaciones
 // si es plane, solo se deja G18.
 // solo se permite un plano de trabajo, si se programa una vez, ya no se puede tocar (si es el mismo se debería dejar...)
 //YURRE: Las variables _X,_Y_L etc... SOLO se escriben aquí
 //YURRE: Como los comodines están asociados a esto, inicializmos las macros aquí
  setPlaneBeforeMove(g,b){
    //no se puede cambiar de unidades a mitad de geometría
    //especial FAGOR ?!!
    if((g!==18) && (g!==20) && (this.config.config === 'plane')) {b.error="Only g18 is allowed for standard lathe"; return;}
    if((g === this.historia.plane) && ((g === 17) || (g === 18) || (g === 19))) //Si reprograma la misma no doy error
      return;
      //La G20 se programa con eje=1,2,3 donde 1 es abscisas, 2 ordenadas, 3 longitudinal si se programa
    let X,Y,Z;
    if(g === 20){
      let ejes = Object.entries(b.pos).sort((e1,e2)=>(e1[1]-e2[1]));
      if((ejes[0][1] !== 1)  || (ejes[1][1] !== 2)) {b.error = "G20. Mandatory programming of abscise and coordinate axis"; return;}
      X = ejes[0][0], Y = ejes[1][0];
      if((ejes.length > 2) && (ejes[2][1] === 3))
        Z = ejes[2][0]; //Si se programa, lo pillamos
      b.end = true; //si es G20 viene sola en el plano
      this._I = 'I';this._J = 'J';  //Esto es por definición cuando hay G20
      //Check de si ha cambiado el plano
      if((X === this.config.planeAxis[0]) && (Y === this.config.planeAxis[1]))
        return; //No hemos cambiado de plano en realidad (no miro el longitudinal)
    }
    //Si llego aquí es que ha habido cambio... y no debería
    if(this.hayCotas === true) {b.error = "Can't change plane after moving commands";return;}
    //Tratamiento especial de FAGOR , la g18 en modo 'plane' va al revés
    if((g === 18) && (this.config.config === 'plane')){ //Específico FAGOR , se pone XZ y se traduce la G18 a ZX
      this.config.planeAxis[0] = this.config.mainAxis[1];
      this.config.planeAxis[1] = this.config.mainAxis[0];
      this.config.planeDiamAxis[0] = this.config.mainDiamAxis[1];
      this.config.planeDiamAxis[1] = this.config.mainDiamAxis[0];
      this.config.longAxis = undefined;
      this._I = 'K';this._J = 'I';
    }   
    else switch(g){
      case 17:  this.config.planeAxis[0] = this.config.mainAxis[0]; this.config.planeAxis[1] = this.config.mainAxis[1];
                this.config.planeDiamAxis[0] = this.config.mainDiamAxis[0]; this.config.planeDiamAxis[1] = this.config.mainDiamAxis[1];
                this.config.longAxis = this.config.mainAxis[2];
                this._I = 'I';this._J = 'J';
        break;
      case 18:  this.config.planeAxis[0] = this.config.mainAxis[2]; this.config.planeAxis[1] = this.config.mainAxis[0];
                this.config.planeDiamAxis[0] = this.config.mainDiamAxis[2]; this.config.planeDiamAxis[1] = this.config.mainDiamAxis[0];
                this.config.longAxis = this.config.mainAxis[1];
                this._I = 'K';this._J = 'I';
        break;
      case 19:  this.config.planeAxis[0] = this.config.mainAxis[1]; this.config.planeAxis[1] = this.config.mainAxis[2];
                this.config.planeDiamAxis[0] = this.config.mainDiamAxis[1]; this.config.planeDiamAxis[1] = this.config.mainDiamAxis[2];
                this.config.longAxis = this.config.mainAxis[0];
                this._I = 'J';this._J = 'K';
        break;
      case 20:  this.config.planeAxis[0] = X; this.config.planeAxis[1] = Y;
                this.config.longAxis = Z; 
                this._I = 'I';this._J = 'J';  //Esto es por definición cuando hay G20
                //"Truquillo" para funcionar como el editor de perfiles actual (por error HMIR-881)
                //si en G20 está el eje "C" quitar diámetros el eje X
                if((X === 'C')||(Y === 'C'))
                  this.config.mainDiamAxis = [false,false,false]
                //YURRE:TODO:Lo de radios/diámetros no está bien atado, si los ejes no están en mainDiamAxis, difícilmente se puede asegurar nada....
                let ix = this.config.mainAxis.indexOf(X) ;
                this.config.planeDiamAxis[0] = (ix===-1)?false:this.config.mainDiamAxis[ix];
                ix = this.config.mainAxis.indexOf(Y) ;
                this.config.planeDiamAxis[1] = (ix===-1)?false:this.config.mainDiamAxis[ix];
                this.config.longAxis = Z;   //haya o no
        break;
      default: b.error="Programming plane must be 17,18,19,20"; return;
    }
    //this.config.plane = g;
    this.historia.plane = g;
    this._X = this.config.planeAxis[0];
    this._Y = this.config.planeAxis[1];
    this._L = this.config.longAxis;
    //YURRE: Comodines , @1-@6, pongo a vacío el 0 para evitar la resta de 1
    //TODO ver si se puede poner siempre L y K, preguntar a Adelia
    setAnalyzerComodines(['',this._X,this._Y,this._L, this._I, this._J, '']);
    //radios/diámetros:
    this._Xd = this.config.planeDiamAxis[0];
    this._Yd = this.config.planeDiamAxis[1];
    //YURRE Por aquí solo pasa si hay cambio de verdad, así que solo cambiaría el origen si cambia, pero como no dejamos....
    this.historia.polarOrigin.X = 0;
    this.historia.polarOrigin.Y = 0;
    //YURRE: Esto en el cnc sería diferente porque tiene cotas reales, aquí reseteo en el cambio de plano
    //Si se quiere hacer algo mejor hay que mantener las cotas de todos los ejes por si acaso
    this.historia.pos[this._X] = 0;
    this.historia.pos[this._Y] = 0;
    if(this._L !== undefined )
      this.historia.pos[this._L] = 0;
    this._actualizaCotas({x:0,y:0},{x:0,y:0});
    this.hayCotas = 0; //lo vuelvo a inicializar porque _actualizaCotas lo pone a TRUE, si ha llegado la función a este punto era FALSE
    //Esto lo dejo programado por si cambio de inicialización de 0,0 a otra
    let xp = this.historia.pos[this._X]-this.historia.polarOrigin.X, yp= this.historia.pos[this._Y]-this.historia.polarOrigin.Y;
    this.historia.pos.R = Math.sqrt(xp*xp + yp*yp);
    this.historia.pos.Q = 180*Math.atan2(yp, xp)/Math.PI;
    this.historia.radius = this.historia.pos.R;

    if(g===20) b.end = true; 
  }
  //YURRE: separo los coneptos de config e historia, intento no tocar config durante la "ejecución" 
  //La idea es config=>historia en el inicio e historia=>config a petición o al final
  //función asociada al grupo de Gs de unidades (se ejecuta al programar una G del grupo) en el processBlockBeforeMove
  //Solo puede venir con g70 y g71, así que no chequeo
  setUnitsBeforeMove(g,b){
    if((this.hayCotas === true) && (this.historia.units !== g)) { b.error = "Can't change units after moving commands"; return;}
    if((g!==70) && (g!==71)) {b.error = 'coordinate units must be 70 (inches) or 71(mm)'; return;}
    this.historia.units = g;
  }
  //función asociada al grupo de Gs programación absoluta/incremental (se ejecuta al programar una G del grupo)
  setIncrBeforeMove(g,b) {
    if((g!==90) && (g!==91)) {b.error = 'coordinate move must be 90 (abs) or 91 (relative)'; return;}
    this.historia.incr = g;
  }
  //función asociada al grupo de Gs definición del centro del arco (se ejecuta al programar una G del grupo)
  setCenterBeforeMove(g,b){
    this.historia.arcCenterType = g;  //el tratamiento de modal o no está en otra parte
    if(g === 263){
      this.historia.radius = b.pos['R'];
      delete b.pos['R'];
    }
  }
  //los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  //Las cotas R y Q son del plano por definición
  noPlaneMov(b){
    let otherAxis = Object.keys(b.pos).filter(ax=>((ax!=this._X)&&(ax!=this._Y)&&(ax!=this._I)&&(ax!=this._J)&&(ax!='R')&&(ax!='Q')))
    if(otherAxis.length != 0)
      b.infoPostMov = otherAxis.sort().map(ax => `${ax}${b.pos[ax]}`).join(' ') +' '+b.infoPostMov;
    // //lo hago así para que vayan antes de otras infos (FSTDM...) pero en orden
    // //para generar un profile tipo punto con los bloques solo de info adicional:
    // if(b.profile === undefined){
    //   b.profile = {type:'point',x:this.historia.pos[this._X], y:this.historia.pos[this._Y]};
    // }
  }
  //funciones tratamiento del movimiento programado
  
  //Yurre: para las que no mueven (GsNoMov)
  moveNone(b){
    //para generar un profile tipo punto con los bloques solo de info adicional:
    // if(b.profile === undefined){
    //   b.profile = {type:'point',x:this.historia.pos[this._X], y:this.historia.pos[this._Y]};
    // }
    // //para añadir la info de cotas en caso de que utilice sintaxis de cota
    // b.infoPreMov += Object.keys(b.pos).sort().map(k=>`${k}${b.pos[k]}`).join(' ');
  }
    //La posición final viene afectada por traslados y preselecciones . Primero roto y traslado de G73, luego el G92
    //Y estas cotas no las ponemos en la historia
  _calcPosReal(prog){
        //Esta cota pieza lo es en todos los ejes, luego hay que ver si el plano de trabajo está rotado y trasladado
      let x= prog.x, y=prog.y;
      if(this.historia.rotate){
        x = this.historia.rotationMatrix.a*prog.x + this.historia.rotationMatrix.b*prog.y + this.historia.rotationMatrix.c;
        y = this.historia.rotationMatrix.d*prog.x + this.historia.rotationMatrix.e*prog.y + this.historia.rotationMatrix.f;
      }
      x += this.historia.offsetG92_X; y += this.historia.offsetG92_Y;
      return({x:x, y:y});
    }

  _actualizaCotas(prog, real){ //función auxiliar para actualizar las cotas de la historia, normalmente con lo que viene en el bloque
    this.historia.posReal[this._X] = real.x; this.historia.posReal[this._Y] = real.y;
    this.historia.pos[this._X] =  prog.x; this.historia.pos[this._Y] =  prog.y;
    this.historia.pos.R =  prog.r; this.historia.pos.Q =  prog.q;
    this.hayCotas = true;
  }
  moveMove(b){
    let p = this._getPos(b);
    let r = this._calcPosReal(p);
    if((b.pos[this._X] !== undefined) || (b.pos[this._Y] !== undefined) || (b.pos['R'] !== undefined) || (b.pos['Q'] !== undefined)){
      if(this.hayCotas)
        b.profile = {type:'move',xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y], xf:r.x , yf:r.y};
      else{ //movimiento inicial como sólo posicionamiento
        //b.profile = {type:'point',x:this.historia.posReal[this._X], y:this.historia.posReal[this._Y]};
        b.profile = {type:'point',x:r.x, y:r.y};
        b.initPoint = 'G00';
      }
      this._actualizaCotas(p, r);
    }
    this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
  moveLine(b){
    //solo perfil, ejes del plano seleccionado
    //Hay que coger el punto final, las cotas son modales
    let p = this._getPos(b)
    let r = this._calcPosReal(p);
    if((b.pos[this._X] !== undefined) || (b.pos[this._Y] !== undefined) || (b.pos['R'] !== undefined) || (b.pos['Q'] !== undefined)){
      if(this.hayCotas)
        b.profile = {type:'line',xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y], xf:r.x , yf:r.y};
      else{ //movimiento inicial como sólo posicionamiento
        //b.profile = {type:'point',x:this.historia.posReal[this._X], y:this.historia.posReal[this._Y]};
        b.profile = {type:'point',x:r.x, y:r.y};
        b.initPoint = 'G01';
    }
      this._actualizaCotas(p, r);
    }
    this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
  //TODO:a gestión de radio activo cuando solo programo R y no R1 o G263
  //TODO: Hay casos no contemplados y no está claro qué tiene que hacer por ejemplo si programo sólo RQ, error? si va con G263 en el bloque?
  //TODO: ¿Se puede programar ángulo cota ? sería modo radio
  //La G31 es no modal y pone el centro polar en el del círculo, se programa sin radio, solo con centro como mucho, se deja la g en la historia
  //El mirror toca los puntos finales, pero no G2,G3, hay que poner aquí el cambio de sentido
  // Variedades G02/G03 X Y I J  , G02/G03 X Y R , G02/G03 R Q I J , G02/G03 G31 IJQ 
  moveCircle(b){
    let m = this._getBlockTransforms(); //mirror, diams y scale
    let t = b.moveDir==='clock'?1:-1;
    let pf = this._getPos(b); //recoge las X,Y,R,Q si las hay, del punto final
    let r = this._calcPosReal(pf);
    //Miramos en qué formato se ha programado
    //Si hay I o J es programación con centro( en variedades), si no hay ni I ni J, con radio o polares... un follón
    //Si el centro es I=0,J=0 no se pone... pero entonces tiene que haber cota final y entonces es de tipo radio
    //Por legibilidad agrupo los casos en ascii, aquí 'X' es la abscisa, sea el eje que sea
    let ejes = `${b.pos[this._X] !== undefined?'X':''}${b.pos[this._Y] !== undefined?'Y':''}${b.pos['R'] !== undefined?'R':''}${b.pos['Q'] !== undefined?'Q':''}${b.pos[this._I] !== undefined?'I':''}${b.pos[this._J] !== undefined?'J':''}`;
//    if(ejes.length === 0) //no se han programado ejes
    let mode = 'center_absolute'; //espcífico 
    if((this.historia.arcCenterType === 6) || (this.historia.arcCenterType === 261)){ //centro absoluto respecto al origen del plano, G6 es No modal
      mode = 'center_absolute';
    }
    else if((this.historia.arcCenterType === 262) || (this.historia.arcCenterType === 31)){ //relativo al punto inicial YURRE: imagino que afecta mirror y todo eso...pero no los diámetros, no sé por qué
      mode = 'center_relative';
    }
    switch(ejes){
      //casos con punto final
      case 'RQ' : //especial, el cnc no da error pero no hace caso al radio
        if(Math.abs(b.pos.R - this.historia.pos.R) >= 0.001)//
          {b.error =  'Error in programmed radius'; return;}
        delete(b.pos.R);  //fallthrough, pasa con dx=dy=0
        mode = 'center_absolute';
      case 'XYIJ': case 'XYI': case 'XYJ': //XY+centro
      case 'XIJ': case 'XI': case 'XJ': case 'YIJ': case 'YI': case 'YJ': //X o Y + centro
      case 'RQIJ': case 'RQI': case 'RQJ':  //RQ + centro
      case 'RIJ': case 'RI': case 'RJ': case 'QIJ': case 'QI': case 'QJ': {//R o Q + centro
        let type = 'arc_'+ ((Math.sign(m.x*m.y*t) === 1)?'clock':'antiClock'); //el mirror cambia el sentido del arco
        //centro cuando se programa I,J que indica el centro respecto al pi o al centro polar, y en absoluto (G6,G262) o relativo(G31,G261)
        //El bloque viene afectado, parece, de mirror y de todo el pack...
        let dx = (b.pos[this._I] !== undefined)? m.x*b.pos[this._I] : 0;
        let dy = (b.pos[this._J] !== undefined)? m.y*b.pos[this._J] : 0;
        let center = {x:0, y:0};    //a rellenar según la modalidad...
        //posición de partida = punto anterior
        let pi = {x:this.historia.pos[this._X], y:this.historia.pos[this._Y]};
        //calculo el centro
        if(mode === 'center_absolute'){
         center.x = /*this.historia.polarOrigin.X + */dx;  center.y = /*this.historia.polarOrigin.Y +*/ dy;
        }
        else if(mode === 'center_relative'){
          if(this._Xd) dx = dx*2;//sin diámetros en los centros
          if(this._Yd) dy = dy*2;
          center.x = pi.x + dx; center.y = pi.y + dy;
        }
        if(this.historia.arcCenterType === 31){//relativo al punto inicial y polares
          if(b.pos['Q'] === undefined) {b.error = 'In G2/G3 with G31 the angle Q is mandatory'; return;}
          let radius = Math.sqrt((pi.x - center.x)*(pi.x - center.x) + (pi.y - center.y)*(pi.y - center.y));
          let q = b.pos['Q'] > 180? b.pos['Q'] - 360 : b.pos['Q'];  //normalizo 
          q = (m.y > 0)? q: -q; //mirrorY
          q = (m.x < 0)? 180 - q: q; //mirrorX
          pf = this._calcCartesianas({r:radius, q:q} , {ox:center.x, oy:center.y}); //calcula x e y a partir de r,q
          r = this._calcPosReal(pf);
        }
        center = this._calcPosReal(center);
        b.profile = {type:type, x0:center.x , y0: center.y, xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y], xf:r.x, yf:r.y };
        this.historia.radius = undefined; //cuando se programa "normal" se anula el radio            
        }
        break;
      case 'XYR': case 'XR': case 'YR': //cartesianas con radio
      case 'XY': case 'X': case 'Y': case 'Q':{ //Programación por radio
        let type = 'arc_radius_'+ ((Math.sign(m.x*m.y*t) === 1)?'clock':'antiClock'); //el mirror cambia el sentido del arco
        //el radio puede haberse puesto con la G263 o R1, lo que implica cuidar el orden , como siempre
        //Y se mantiene hasta que se programa en polares o se programa un círculo con centro
        let radius = (b.pos['R'] !== undefined)? b.pos['R'] : this.historia.radius; //puede ser undefined
        if((radius === undefined) && ((b.pos[this._X] !== undefined) || (b.pos[this._Y] !== undefined)))
          {b.error = 'Radius not defined'; return}//error, no hay centro ni radio pero hay cota. La G2,G3 sin nada se pueden programar!!!!
        radius = (this.historia.scaleFactor !== 0)? this.historia.scaleFactor * radius : radius;
        b.profile = {type:type, xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y], xf:r.x, yf:r.y , r:radius, largeArcFlag: Math.sign(radius)};  
      }
        break;
      default:
        break;
    }
    this._actualizaCotas(pf, r);
    this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque         
    }
  
  moveCircleTangent(b){
    let p = this._getPos(b);
    let r = this._calcPosReal(p);
    let type = 'arc_tangent';//'arc_tangent_' + b.moveDir;
    b.profile = {type:type, xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y], xf:r.x, yf:r.y };
    this._actualizaCotas(p, r);
    this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
}
  moveCircle3Points(b){
    let p = this._getPos(b);
    let r = this._calcPosReal(p);
    //YURRE: HACK , resulta que al punto intermedio parece que le afectaría todo, uso la rutina común...
    b.pos[this._X] = b.pos[this._I];b.pos[this._Y] = b.pos[this._J];
    delete b.pos['Q'];delete b.pos['R'];  //por si acaso venía en polares la cota final
    //el pto intermedio de G09 va en abs/inc dependiendo de G90/G91
    let pm = this._calcPosReal(this._getPos(b));
    b.profile = {type:'arc_3Points', xi:this.historia.posReal[this._X], yi:this.historia.posReal[this._Y],  xm:pm.x, ym:pm.y, xf:r.x, yf:r.y };
    this._actualizaCotas(p, r);
    this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
  moveRound(b){  //esto podría no estar programado
    //con radio = 0 eliminamos elemento:
    if((b.pos.I !== undefined)&&(b.pos.I !== 0)){
      this.historia.roundRadius = (b.pos.I !== undefined) ? b.pos.I: this.historia.roundRadius;
      if(this.historia.roundRadius === undefined)
        {b.error = 'roundRadius not defined'; return;}
      let radius = (this.historia.scaleFactor !== 0)? this.historia.scaleFactor * this.historia.roundRadius : this.historia.roundRadius;
      b.profile = {type:'arc_round', r:radius };
      this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
    }
  }
  moveChamfer(b){  
    //con radio = 0 eliminamos elemento:
    if((b.pos.I !== undefined)&&(b.pos.I !== 0)){
      this.historia.roundRadius = (b.pos.I !== undefined) ? b.pos.I: this.historia.roundRadius;
      if(this.historia.roundRadius === undefined)
        {b.error = 'roundRadius not defined'; return;}
      let radius = (this.historia.scaleFactor !== 0)? this.historia.scaleFactor * this.historia.roundRadius : this.historia.roundRadius;
      b.profile = {type:'chamfer', r:radius };
      this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
}
//YURRE: Es opcional la I de G37 y G38??? Mirar y quitar si hace falta
  moveTangEntry(b){
    //con radio = 0 eliminamos elemento:
    if((b.pos.I !== undefined)&&(b.pos.I !== 0)){
      //El perfile insertará dos tramos normalemnte. La I NO es opcional, creo
      this.historia.roundRadius = (b.pos.I !== undefined) ? b.pos.I: this.historia.roundRadius;
      let radius = (this.historia.scaleFactor !== 0)? this.historia.scaleFactor * this.historia.roundRadius : this.historia.roundRadius;
      b.profile = {type:'tangentialEntry', r:radius };
      this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
}
  moveTangExit(b){
    //con radio = 0 eliminamos elemento:
    if((b.pos.I !== undefined)&&(b.pos.I !== 0)){
      this.historia.roundRadius = (b.pos.I !== undefined) ? b.pos.I: this.historia.roundRadius;
      let radius = (this.historia.scaleFactor !== 0)? this.historia.scaleFactor * this.historia.roundRadius : this.historia.roundRadius;
      b.profile = {type:'tangentialExit', r:radius };
      this.noPlaneMov(b);//los ejes/centros programados fuera del plano, se conservan como info adicional del bloque
  }
}
  //YURRE: Creo que en algún caso no afecta diam y sí lo otro, a mirar
  _getBlockTransforms(){  //Mira las Gs activas que afectan como mirror, scale, diam
    let m = {x: this.historia.mirrorX, y:this.historia.mirrorY};
    //YURRE: TODO DUDA si el eje está en diámetros y aplica G92, debe hacerse la resta ¿antes o depués de multiplicar?
    //radios/diámetros:
    if(this.historia.diam){
      m.x = (this._Xd)? 0.5*m.x : m.x;
      m.y = (this._Yd)? 0.5*m.y : m.y;
    }
    if(this.historia.scaleFactor !== 0){
      m.x *= this.historia.scaleFactor;
      m.y *= this.historia.scaleFactor;
    }
    return(m);
  }
  //Si no le paso argumento, el estándar
  //auxiliar: Se ha programado en cartesianas, buscamos las polares
  _calcPolares(p, O = {ox:this.historia.polarOrigin.X, oy:this.historia.polarOrigin.Y}){
    let pos = p;
    let xp = pos.x-O.ox, yp= pos.y-O.oy;
    pos.r = Math.sqrt(xp*xp + yp*yp);
    pos.q = 180*Math.atan2(yp, xp)/Math.PI;
    return(pos);
  }
  //auxiliar: Se ha programado en polares, buscamos las cartesianas equivalentes
  _calcCartesianas(p, O = {ox:this.historia.polarOrigin.X, oy:this.historia.polarOrigin.Y}){
    let pos = p;
    pos.x = O.ox + pos.r*Math.cos(pos.q*Math.PI/180);
    pos.y = O.oy + pos.r*Math.sin(pos.q*Math.PI/180);
    return(pos);
  }

  _getPos(b){  //offset = {x, y, r, q} //valores a sumar por lo de G91 
    //auxiliar, en funcion de los ejes programados y si es incremental o absoluto busca la posición programada
    //En incrementales se le suma la posiciñon actual a la programada (incremento), los incrementos viene afectados por el plano
    //recojo la cota del movimiento anterior (del plano de programación)
    let pos =  {x:this.historia.pos[this._X], y:this.historia.pos[this._Y], q:this.historia.pos['Q'],r:this.historia.pos['R']};
    let m = this._getBlockTransforms(); //cojo irrors, etc...
    let inc = (this.historia.incr === 90)? 0 : 1 ;
    //Por legibilidad agrupo los casos en ascii, aquí 'X' es la abscisa, sea el eje que sea
    let ejes = `${b.pos[this._X] !== undefined?'X':''}${b.pos[this._Y] !== undefined?'Y':''}${b.pos['R'] !== undefined?'R':''}${b.pos['Q'] !== undefined?'Q':''}`;
    if(ejes.length === 0) //no se han programado ejes
      return(pos);
    let dx = (b.pos[this._X] !== undefined)? m.x*b.pos[this._X] : 0;
    let dy = (b.pos[this._Y] !== undefined)? m.y*b.pos[this._Y] : 0;
    let dr = (b.pos['R'] !== undefined)? b.pos['R'] : 0;
    dr = (this.historia.scaleFactor !== 0) ? dr * this.historia.scaleFactor : dr;
    let dq = (b.pos['Q'] !== undefined)? b.pos['Q'] : 0;
    dq = dq > 180? dq - 360 : dq;  //normalizo 
    dq = (m.y >= 0)? dq : -dq; //mirrorY
    dq = (m.x >= 0)? dq : 180 - dq; //mirrorX
    //Ahora sumo los incrementos a las cotas si hace falta (se ha programado) o se asigna(g90) , uso el ascii por legibilidad, ye complicado
    switch(ejes){
      case 'XY':case 'XYR': pos.x = inc*pos.x + dx ; pos.y = inc*pos.y + dy; return(this._calcPolares(pos));
      case 'X': pos.x = inc*pos.x + dx; return(this._calcPolares(pos));
      case 'Y': pos.y = inc*pos.y + dy; return(this._calcPolares(pos));
      case 'R': pos.r = inc*pos.r + dr; return this._calcCartesianas(pos);
      case 'Q': pos.q = inc*pos.q + dq; return this._calcCartesianas(pos);
      case 'RQ':pos.r = inc*pos.r + dr; pos.q = inc*pos.q + dq; return this._calcCartesianas(pos);
      //XQ e YQ son programación ángulo-cota, funciona diferente, la Q no se queda modal 
      case 'XQ':{
        let xp = pos.x;
        pos.x = inc*pos.x + dx; 
        pos.y = pos.y + (pos.x - xp)*Math.tan(Math.PI*dq/180);
        return(this._calcPolares(pos));
      }
      case 'YQ':{
        let yp = pos.y;
        pos.y = inc*pos.y + dy; 
        pos.x = pos.x + (pos.y - yp)/Math.tan(Math.PI*dq/180);
       return(this._calcPolares(pos));
      }
      //TODO, gestión, aunque no podrá llegar aquí
      default: b.error = 'Programming axis error'; return;
    }  
    return(pos);
  }
  //interpretación/ejecución de programa:
  execute(file){  //array de lineas
    let program = Array.isArray(file)?file:[file];
    let lines = program;
    let block = {pos:{}, info:[], gs:[], conditional:'', infoPostMov:'', comments:'', hll: false, empty: false, end:false, initPoint:undefined, error:undefined};
    //por cada línea de programa:
    let l=0;
    while(lines[l] !== undefined){
      block = {pos:{}, info:[], gs:[], conditional:'',  infoPostMov:'', comments:'', hll: false, empty: false, end:false, initPoint:undefined, error:undefined};
      //this.blocks.push(b=this.tokenice(lines[l])); //análisis
      tokenice(lines[l], this.P, block);  //análisis sintáctico, más o menos, block.end indica que no hay que seguir procesando, por ejemplo, todo comentario
      if(block.error !== undefined) break;
      if(!block.end){
        this.processBlockBeforeMov(block); 
        if(block.error !== undefined) break;
        //YURRE: Si no quedan cotas para procesar es que no hay que mover, si no, lo intenta aunque no haga nada
        if(!block.end && (Object.keys(block.pos).length !== 0))
          this.moveCommand(block);  
        if(block.error !== undefined) break;
        this.processBlockAfterMov(block);
        this.resetBlockConditions(block);
      }
      if(!block.empty){
        if(block.profile === undefined){
          block.profile = {type:'point',x:this.historia.posReal[this._X], y:this.historia.posReal[this._Y]};
          
        }
        block.infoPostMov += block.info.join(' ');
        this.blocks.push(block);
      }
      l++;
    }
    //YURRE: devuelvo el error (undefined o algo en un campo), además de en el return
    //YURRE: devuelvo config
    if(block.error){
      block.error = `In line ${l} : `+ block.error;
    }
    return { isoGeometry : this.blocks, updatedConfig : this._getConfig(), error:block.error};
  }
}