/* Validación: motor de tareas jsPsych 8 y guardado remoto existente de ExpBuilder. */
(async () => {
  'use strict';
  const root=document.getElementById('experiment');
  const Storage=window.ValidacionStorage;
  const qs=new URLSearchParams(window.location.search);
  const demo=qs.get('demo')==='1';
  const requestedLimit=Number(qs.get('limit'));
  const demoLimit=demo&&Number.isInteger(requestedLimit)&&requestedLimit>=1?Math.min(480,requestedLimit):null;
  const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action='next')=>`<button class="vx-button" type="button" data-action="${action}">${escapeHTML(text)}</button>`;
  const status=(title,body,actions='')=>{
    root.innerHTML=`<div class="vx-recovery"><div class="vx-eyebrow">Validación de materiales</div><h1 class="vx-title">${escapeHTML(title)}</h1><p class="vx-text">${body}</p>${actions}</div>`;
  };
  const fetchJson=async path=>{
    const r=await fetch(path,{cache:'no-store'});
    if(!r.ok)throw Error(`No se pudo cargar ${path} (${r.status})`);
    return await r.json();
  };
  try{
    if(typeof initJsPsych!=='function')throw Error('No se pudo cargar jsPsych desde la CDN. Comprueba la conexión a internet.');
    status('Cargando el experimento','Se están verificando los estímulos y la configuración.');
    const [definition,practice,allMain]=await Promise.all([
      fetchJson('./data/definition.json'),fetchJson('./data/practice.json'),fetchJson('./data/main.json')
    ]);
    if(definition.experimentID!==Storage.EXPERIMENT_ID||practice.length!==3||allMain.length!==480){
      throw Error('La definición de los estímulos no coincide con el respaldo original.');
    }
    if(practice.some(r=>!r.Ensayo)||allMain.some(r=>!r['Versión Final']))throw Error('Hay estímulos sin texto.');
    const main=demoLimit?allMain.slice(0,demoLimit):allMain;
    const defaults=()=>Storage.emptySnapshot(demo);
    let snapshot=await Storage.store.read();
    if(snapshot && snapshot.savedRemote){await Storage.store.clear();snapshot=null;}
    if(snapshot && snapshot.demo!==demo){
      status('Existe una sesión pendiente', 'Se encontró una sesión anterior en este navegador. Antes de cambiar de modo debes conservar o descartar sus datos.',
        `<div class="vx-actions">${button('Descargar datos','export')}${button('Descartar y comenzar de nuevo','discard')}</div>`);
      root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(snapshot);
      root.querySelector('[data-action="discard"]').onclick=async()=>{if(!confirm('Esta acción eliminará la copia local de la sesión anterior. ¿Continuar?'))return;await Storage.store.clear();location.reload();};
      return;
    }
    if(snapshot && snapshot.version!==4){
      status('Datos locales de una versión anterior','Descarga una copia de la sesión anterior antes de iniciar una sesión nueva.',
        `<div class="vx-actions">${button('Descargar datos','export')}${button('Eliminar copia local','discard')}</div>`);
      root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(snapshot);
      root.querySelector('[data-action="discard"]').onclick=async()=>{if(confirm('¿Eliminar esta copia?')){await Storage.store.clear();location.reload();}};
      return;
    }
    if(snapshot && (snapshot.progress.finalDone||snapshot.savedRemote===false&&snapshot.progress.finalDone)){
      status('Datos pendientes de confirmación','Esta sesión terminó, pero no hay confirmación de almacenamiento en Google Drive. Puedes reintentar sin repetir el experimento.',
        `<div class="vx-actions">${button('Descargar copia','export')}${button('Reintentar guardado','retry')}</div><div id="vx-retry-message" class="vx-status warning" hidden></div>`);
      root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(snapshot);
      root.querySelector('[data-action="retry"]').onclick=async()=>{
        const btn=root.querySelector('[data-action="retry"]'),msg=root.querySelector('#vx-retry-message');
        btn.disabled=true;msg.hidden=false;msg.textContent='Enviando datos...';
        try{await Storage.saveRemote(snapshot);msg.className='vx-status';msg.textContent='El servidor confirmó la recepción de los datos.';btn.textContent='Guardado';}
        catch(err){msg.className='vx-status error';msg.textContent='No se confirmó el guardado: '+err.message;btn.disabled=false;}
      };
      return;
    }
    if(snapshot && snapshot.rows.length){
      status('Recuperar sesión',`Hay una sesión incompleta con ${snapshot.rows.length} registros guardados en este navegador. Puedes continuar donde se interrumpió o guardar una copia de seguridad.`,
        `<div class="vx-actions">${button('Descargar copia','export')}${button('Nueva sesión','discard')}${button('Continuar sesión','resume')}</div>`);
      root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(snapshot);
      root.querySelector('[data-action="discard"]').onclick=async()=>{if(confirm('Esto eliminará la copia local de la sesión incompleta. ¿Confirmas?')){await Storage.store.clear();location.reload();}};
      root.querySelector('[data-action="resume"]').onclick=()=>launch(snapshot);
      return;
    }
    if(!snapshot)snapshot=defaults();
    await Storage.store.write(snapshot);
    launch(snapshot);

    function shuffleIndices(length){
      const arr=Array.from({length},(_,i)=>i);
      for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
      return arr;
    }
    async function launch(s){
      if(!s.practiceOrder)s.practiceOrder=shuffleIndices(practice.length);
      if(!s.mainOrder)s.mainOrder=shuffleIndices(main.length);
      await Storage.store.write(s);
      const p=s.progress;
      if(demo){document.body.insertAdjacentHTML('afterbegin','<div style="position:sticky;top:0;z-index:100;background:#764b07;color:#fff;text-align:center;padding:5px;font:600 13px system-ui">MODO DE PRUEBA · No envía datos al servidor</div>');}
      window.ValidacionContext={definition,practice,main,snapshot:s};
      window.ValidacionDiagnostics={version:4,experimentID:s.experimentID,sessionId:s.sessionId,demo,loaded:{practice:practice.length,main:main.length},get progress(){return {...s.progress};},get storage(){return {rows:s.rows.length,remoteState:s.remoteState,savedRemote:s.savedRemote,firebaseStatus:s.firebaseStatus||'not-checked'};}};
      const queue=[];
      const jsPsych=initJsPsych({
        display_element:'experiment',
        on_data_update:data=>{
          const row={...data,trial_index:s.rows.length,clientTimestamp:Date.now(),sessionId:s.sessionId,experimentID:s.experimentID};
          s.rows.push(row);
          // Un fallo local se comunica al finalizar; nunca se elimina un registro de memoria sin confirmación.
          Storage.store.write(s).catch(e=>console.error('Error guardando localmente',e));
        },
        on_finish:async()=>{
          try{
            await Storage.store.flush();
            if(p.consentResult==='rejected'){
              await Storage.store.clear();
              status('Participación terminada','Has decidido no participar. No se enviaron datos al servidor.');
              return;
            }
            if(!p.finalDone){
              status('Sesión interrumpida','El experimento se detuvo antes de completarse. Tus datos permanecen en una copia local.',`${button('Descargar datos','export')}`);
              root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(s);
              return;
            }
            status('Guardando respuestas','Se está enviando la sesión completa a Google Drive mediante la API del proyecto. No cierres la página todavía.');
            const result=await Storage.saveRemote(s);
            if(result.demo){
              status('Prueba completada','La interfaz terminó correctamente. En modo de prueba no se escriben datos en Firebase ni Google Drive.',`<div class="vx-actions">${button('Descargar respuestas de prueba','export')}</div>`);
              root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(s);
            }else{
              status('Respuestas guardadas','El servidor confirmó la recepción de tu sesión. Gracias por participar.',`<div class="vx-status">Identificador de sesión: <code>${escapeHTML(s.sessionId)}</code></div>`);
            }
          }catch(err){
            console.error('Error de guardado final:',err);
            status('No se confirmó el guardado',`Tus respuestas siguen conservadas en este navegador. ${escapeHTML(err.message)}`,
              `<div class="vx-actions">${button('Descargar copia','export')}${button('Reintentar','retry')}</div>`);
            root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(s);
            root.querySelector('[data-action="retry"]').onclick=async()=>{
              root.querySelector('[data-action="retry"]').disabled=true;
              try{await Storage.saveRemote(s);status('Guardado confirmado','El servidor confirmó la recepción de las respuestas.');}
              catch(e){status('Sigue pendiente',escapeHTML(e.message),`${button('Descargar copia','export')}`);root.querySelector('[data-action="export"]').onclick=()=>Storage.downloadJson(s);}
            };
          }
        }
      });
      const node=(kind,extra={},data={})=>({type:window.ValidacionScreenPlugin,kind,...extra,data:{experimentID:s.experimentID,trial_name:({welcome:'Bienvenida',consent:'Consentimiento informado',preSurvey:'Precuestionario',survey:'Cuestionario',instructions:'Instrucciones',prePractice:'Pre-ensayo',postPractice:'Final ensayo',reject:'Consentimiento Rechazado',finish:'Final Experimento'})[kind]||kind,...data}});
      if(!p.welcomeDone)queue.push(node('welcome',{},{builder_id:definition.screens.Bienvenida.id}));
      if(p.consentResult==='pending')queue.push({timeline:[node('consent',{}, {builder_id:definition.screens['Consentimiento informado 1'].id})],loop_function:()=>p.consentResult==='pending'});
      queue.push({timeline:[node('reject',{},{builder_id:definition.screens['Consentimiento Rechazado'].id})],conditional_function:()=>p.consentResult==='rejected'});
      const accepted=[];
      if(!p.introDone)accepted.push(node('preSurvey',{},{builder_id:definition.screens.Precuestionario.id}));
      if(!p.surveyDone)accepted.push(node('survey',{},{builder_id:definition.screens.Cuestionario.id}));
      if(!p.instructionsDone)accepted.push(node('instructions',{},{builder_id:definition.screens.Instrucciones.id}));
      if(!p.prePracticeDone)accepted.push(node('prePractice',{},{builder_id:definition.screens['Pre-ensayo'].id}));
      for(let i=p.practiceDone;i<s.practiceOrder.length;i++)accepted.push(node('evaluation',{phase:'practice',position:i+1,stimIndex:s.practiceOrder[i]},{trial_name:'Ensayo',builder_id:definition.screens.Ensayo.id,loop_id:'loop_1793578740463',trialPhase:'practice',position:i+1}));
      if(!p.postPracticeDone)accepted.push(node('postPractice',{},{builder_id:definition.screens['Final ensayo'].id}));
      for(let i=p.mainDone;i<s.mainOrder.length;i++)accepted.push(node('evaluation',{phase:'main',position:i+1,stimIndex:s.mainOrder[i]},{trial_name:'Behavioral Statements',builder_id:definition.screens['Behavioral Statements'].id,loop_id:'loop_1793650037960',trialPhase:'main',position:i+1}));
      if(!p.finalDone)accepted.push(node('finish',{},{builder_id:definition.screens['Final Experimento'].id}));
      queue.push({timeline:accepted,conditional_function:()=>p.consentResult==='accepted'});
      jsPsych.run(queue);
    }
  }catch(error){
    console.error('No se pudo iniciar Validación:',error);
    status('No se pudo iniciar el experimento',escapeHTML(error.message));
  }
})();
