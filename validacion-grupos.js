/* Validación v17 — adaptación del acceso por curso y folios de CAFE.
 * Folio aleatorio asociado a sessionId, presente en TODAS las filas del CSV.
 * NUNCA acredita automáticamente. Se muestra después de export.confirmed. */
(function(win,doc){
 'use strict';
 const EXPERIMENT='7f4f984c-de8c-47f4-8144-b6284a011f97';
 const STORAGE='expbuilder:public:'+EXPERIMENT+':validacion-grupo:v1:';
 const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const query=new URLSearchParams(win.location.search);
 const has=Object.prototype.hasOwnProperty;
 const courses=win.VALIDACION_CURSOS||{};
 const requestedMode=query.get('modalidad');
 const requestedCourse=query.get('curso');
 const pilot=query.get('prueba')==='3';
 let current=null;
 function errorPage(message){
   const root=doc.createElement('main');root.id='validacion-error-grupo';root.setAttribute('role','alert');
   root.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#edf3f6;padding:20px;font:16px/1.5 system-ui,sans-serif;color:#203947';
   const card=doc.createElement('section');card.style.cssText='max-width:570px;border-radius:16px;border:1px solid #dce7ec;background:white;padding:26px';
   const heading=doc.createElement('h1');heading.textContent='Enlace de participación no disponible';heading.style.fontSize='1.3rem';
   const p=doc.createElement('p');p.textContent=message;
   const link=doc.createElement('a');link.href=win.location.pathname;link.textContent='Ir a participación general';
   card.append(heading,p,link);root.append(card);doc.body.append(root);
 }
 function validateLink(){
   if(requestedMode!==null && !['publico','estudiante'].includes(requestedMode))
     throw Error('La modalidad del enlace no es válida.');
   if(requestedMode==='estudiante' || (requestedMode===null && requestedCourse)){
     if(requestedMode!=='estudiante' || !requestedCourse ||
        !/^[a-z0-9][a-z0-9-]{0,60}$/.test(requestedCourse) || !has.call(courses,requestedCourse))
       throw Error('El enlace del curso no está configurado. Solicita el enlace correcto a tu profesor o profesora.');
   }
   if(requestedMode==='publico' && requestedCourse)
     throw Error('No se debe especificar un curso en la modalidad pública.');
   return true;
 }
 function getRecord(sessionId){
   try{return JSON.parse(win.localStorage.getItem(STORAGE+sessionId)||'null')}catch(_){return null}
 }
 function randomCode(){
   if(!win.crypto?.getRandomValues)throw Error('No es posible emitir un código seguro. Utiliza HTTPS.');
   const bytes=new Uint8Array(16);win.crypto.getRandomValues(bytes);
   const token=Array.from(bytes,b=>ALPHABET[b&31]).join('');
   return (pilot?'PRUEBA-':'VM-')+token.match(/.{1,4}/g).join('-');
 }
 function initialize(sessionId){
   try{validateLink()}catch(error){errorPage(error.message);throw error}
   if(typeof sessionId!=='string'||!sessionId)throw Error('Falta identificador de sesión');
   let record=getRecord(sessionId);
   const explicit=requestedMode!==null;
   if(record && record.modalidad==='estudiante' && !has.call(courses,record.curso)){
     errorPage('El curso de esta sesión dejó de estar configurado. Contacta al equipo del estudio.');
     throw Error('Curso de sesión no configurado');
   }
   if(record && explicit && (requestedMode!==record.modalidad ||
       (requestedMode==='estudiante' && requestedCourse!==record.curso))){
     errorPage('Esta sesión ya está vinculada a otra modalidad o curso. Regresa mediante su enlace original.');
     throw Error('No se puede cambiar la modalidad de una sesión iniciada');
   }
   if(!record){
     const mode=requestedMode==='estudiante'?'estudiante':'publico';
     record={modalidad:mode,curso:mode==='estudiante'?requestedCourse:'',
       etiquetaCurso:mode==='estudiante'?String(courses[requestedCourse].etiqueta||requestedCourse):'',
       codigo:mode==='estudiante'?randomCode():'',piloto:pilot};
     try{win.localStorage.setItem(STORAGE+sessionId,JSON.stringify(record))}
     catch(error){errorPage('El navegador no permite conservar el código de participación. Activa el almacenamiento local.');throw error}
   }
   if(record.piloto!==pilot){
     errorPage('Esta sesión comenzó en un modo de prueba distinto. Utiliza el mismo enlace para continuar.');
     throw Error('Cambió el modo de prueba de la sesión');
   }
   current=Object.freeze({...record,sessionId});
   win.ValidacionGrupoActual=current;
   return current;
 }
 function decorate(data,sessionId){
   const access=current?.sessionId===sessionId?current:getRecord(sessionId);
   if(!access)throw Error('No hay datos de grupo para esta sesión');
   data.vm_modalidad=access.modalidad;
   data.vm_curso=access.curso||'';
   data.vm_etiqueta_curso=access.etiquetaCurso||'';
   data.vm_codigo_participacion=access.codigo||'';
   data.vm_prueba=Boolean(access.piloto);
   return data;
 }
 function showReceipt(overlay,sessionId){
   const access=getRecord(sessionId);
   if(!overlay||access?.modalidad!=='estudiante')return;
   // Solo llamada desde _showSuccess, después de _completePublicSession confirmada.
   overlay.replaceChildren();
   overlay.style.padding='20px';overlay.style.overflowY='auto';overlay.style.background='#edf3f6';
   const card=doc.createElement('section');card.style.cssText='max-width:540px;width:100%;margin:auto;border:1px solid #d7e4e9;border-radius:16px;background:#fff;padding:clamp(22px,4vw,36px);text-align:center;box-shadow:0 16px 36px #20394718;color:#203947';
   const heading=doc.createElement('h1');heading.textContent='Participación registrada';heading.style.cssText='font-size:clamp(22px,4vw,30px);margin:0 0 12px';
   const intro=doc.createElement('p');intro.textContent='Los resultados fueron guardados. Conserva tu código y compártelo con tu profesor o profesora para que pueda comprobar tu participación.';
   intro.style.cssText='font-size:16px;line-height:1.55';
   const code=doc.createElement('p');code.textContent=access.codigo;code.style.cssText='font:bold clamp(16px,4vw,24px)/1.5 ui-monospace,monospace;letter-spacing:.025em;word-break:break-word;border:1px solid #cfdee4;border-radius:10px;background:#f5f9fa;padding:16px';
   const course=doc.createElement('p');course.textContent='Curso: '+(access.etiquetaCurso||access.curso);course.style.cssText='color:#4b6775';
   const btn=doc.createElement('button');btn.type='button';btn.textContent='Copiar código';btn.style.cssText='padding:12px 20px;background:#a3b18a;border:1px solid #829c84;border-radius:8px;font:600 15px system-ui;cursor:pointer';
   btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(access.codigo);btn.textContent='Código copiado';}catch(_){btn.textContent='Selecciona el código para copiarlo';}});
   const disclaimer=doc.createElement('p');disclaimer.textContent=access.piloto
     ?'Este código es de PRUEBA y no acredita puntos.'
     :'La entrega del código no garantiza puntos: el equipo verificará que la tarea esté completa y respondida con atención, sin elegir opciones al azar.';
   disclaimer.style.cssText='color:#637b85;font-size:13px;line-height:1.55;margin-top:22px';
   card.append(heading,intro,course,code,btn,disclaimer);overlay.append(card);
 }
 win.ValidacionGrupos=Object.freeze({version:'17.1',initialize,decorate,showReceipt,getRecord,validateLink});
})(window,document);
