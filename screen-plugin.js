/* Plugin autónomo jsPsych 8. No depende de jspsych-expbuilder-plugin-dynamic. */
(function () {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const textBlock=s=>String(s||'').trim().split(/\n\s*\n+/).filter(Boolean).map(p=>{
    const content=p.trim();
    if(/^\s*•/.test(content)) {
      return '<ul>'+content.split(/\n/).filter(Boolean).map(l=>`<li>${esc(l.replace(/^\s*•\s*/,''))}</li>`).join('')+'</ul>';
    }
    return `<p>${esc(content).replace(/\n/g,'<br>')}</p>`;
  }).join('');
  const pageKeyForKind=(kind,state)=>{
    if(kind==='consent')return `Consentimiento informado ${state.progress.consentPage}`;
    return ({welcome:'Bienvenida',preSurvey:'Precuestionario',survey:'Cuestionario',instructions:'Instrucciones',prePractice:'Pre-ensayo',postPractice:'Final ensayo',reject:'Consentimiento Rechazado',finish:'Final Experimento'})[kind]||kind;
  };
  function shell(top,body,foot='',narrow=false){
    return `<section class="vx-frame"><div class="vx-top"><div class="vx-wordmark"><span class="vx-mark">UN</span>Validación de materiales</div><div class="vx-top-note">Facultad de Psicología · UNAM</div></div><article class="vx-panel${narrow?' narrow':''}">${top}${body}${foot}</article><div class="vx-footnote">Participación voluntaria · Investigación académica</div></section>`;
  }
  const nav=(entries)=>`<div class="vx-actions">${entries.map(b=>`<button type="button" class="vx-button${b.secondary?' secondary':''}${b.danger?' danger':''}" data-action="${esc(b.action)}">${esc(b.label)}</button>`).join('')}</div>`;
  const title=t=>`<h1 class="vx-title">${esc(t)}</h1>`;
  const subtitle=t=>`<div class="vx-subtitle">${esc(t)}</div>`;
  function sourceImages(assets){
    return `<div class="vx-logo-strip">${assets.filter(a=>typeof a==='string').map(path=>`<img alt="Identidad institucional" loading="eager" src="${esc(path)}">`).join('')}</div>`;
  }
  function sourceDocument(components,isConsent){
    let html='';
    for(let i=0;i<components.length;i++){
      const value=components[i].text;
      if(!value||components[i].dynamicSource==='csv')continue;
      const p=String(value).trim();
      const looksHeading=p.length<80&&!p.includes('\n')&&!/[.!?]$/.test(p);
      if(looksHeading)html+=`<h2>${esc(p)}</h2>`;
      else html+=textBlock(p);
    }
    return `<div class="vx-document ${isConsent?'vx-consent':''}">${html}</div>`;
  }
  function screenTitle(context,key){
    if(key.startsWith('Consentimiento informado'))return 'Carta de consentimiento informado';
    const titles={'Bienvenida':'Bienvenid@','Cuestionario':'Cuestionario sociodemográfico','Precuestionario':'Cuestionario sociodemográfico','Instrucciones':'Instrucciones','Pre-ensayo':'Práctica','Final ensayo':'Comienza la evaluación','Final Experimento':'¡Gracias por participar!','Consentimiento Rechazado':'Gracias por tu tiempo'};
    return titles[key]||key;
  }
  function renderPage(host,kind,state,context){
    const key=pageKeyForKind(kind,state);
    const src=context.definition.screens[key];
    if(!src)throw Error('Pantalla ausente: '+key);
    const copy=src.texts;
    let top='',content='',actions=[];
    if(kind==='welcome'){
      top=sourceImages(src.images);
      content=`<div class="vx-intro-copy">${title('Bienvenid@')}${copy.length?textBlock(copy[0].text.replace(/^Bienvenid@!\s*/,'')):''}</div>`;
      actions=[{label:'Comenzar',action:'next'}];
    } else if(kind==='consent'){
      const page=state.progress.consentPage;
      top=`<div class="vx-eyebrow">Consentimiento informado</div>${title('Información para participantes')}<span class="vx-page-tag">Página ${page} de 4</span>`;
      const texts=page===1?copy.slice(2):copy;
      content=sourceDocument(texts,true);
      if(page===4)actions=[{label:'Regresar',action:'back',secondary:true},{label:'No acepto',action:'reject',danger:true},{label:'Acepto participar',action:'accept'}];
      else actions=page===1?[{label:'Continuar',action:'next'}]:[{label:'Regresar',action:'back',secondary:true},{label:'Continuar',action:'next'}];
    } else if(kind==='reject'){
      top=title('Gracias por tu tiempo');content=sourceDocument(copy,false);actions=[{label:'Cerrar',action:'close'}];
    } else if(kind==='finish'){
      top=sourceImages(src.images.slice(0,3))+title('¡Gracias por tu participación!');
      content=sourceDocument(copy.slice(1,3),false);actions=[{label:'Finalizar y guardar',action:'finish'}];
    } else {
      top=`<div class="vx-eyebrow">${kind==='prePractice'?'Ejercicio de familiarización':'Validación de materiales'}</div>${title(screenTitle(context,key))}`;
      content=sourceDocument(copy.slice(1),false);
      actions=kind==='prePractice'?[{label:'Volver a las instrucciones',action:'back',secondary:true},{label:'Iniciar práctica',action:'next'}]:[{label:'Continuar',action:'next'}];
    }
    host.innerHTML=shell(top,content+nav(actions),'',kind!=='welcome');
    return {src,key};
  }
  function getScaleDescriptors(phase,scr){
    const p=phase==='practice';
    const comp=p?['Incapaz','Capaz']:['Capaz','Incapaz'];
    return [
      {title:'Moralidad',name:'Moralidad',ends:['Malo','Bueno']},
      {title:'Competencia',name:'Competencia',ends:comp},
      {title:'Informatividad',name:p?'Informatividad':'Informatividad',ends:['Poco informativo','Muy informativo']},
      {title:'Credibilidad',name:p?'Informatividad_copy':'Credibilidad',ends:['Poco creíble','Muy creíble']},
    ].map((d)=>({
      ...d,source:scr.sliders.find(x=>x.name===d.name),
    }));
  }
  function renderEval(host,trial,state,context){
    const phase=trial.phase,practice=phase==='practice';
    const scr=context.definition.screens[practice?'Ensayo':'Behavioral Statements'];
    const item=trial.stimulus;
    const desc=getScaleDescriptors(phase,scr);
    if(desc.some(d=>!d.source))throw Error('Falta escala original de '+phase);
    const total=practice?context.practice.length:context.main.length;
    const count=trial.position;
    const header=`<div class="vx-eyebrow">${practice?'Práctica':'Evaluación de enunciados'}</div><div class="vx-trial-progress"><span>${practice?'Ensayo':'Enunciado'} ${count} de ${total}</span><div class="vx-progress-track"><div class="vx-progress-fill" style="width:${Math.min(100,100*count/total)}%"></div></div><span>${Math.round(100*count/total)}%</span></div>`;
    const stimulus=practice?item['Ensayo']:item['Versión Final'];
    if(!stimulus)throw Error('Enunciado sin texto: '+trial.position);
    const cards=desc.map((d,idx)=>{
      const low=Number(d.source.min),high=Number(d.source.max);
      const ticks=Array.from({length:high-low+1},(_,j)=>low+j).map(v=>`<span>${v}</span>`).join('');
      return `<section class="vx-scale" data-scale="${esc(d.name)}"><div class="vx-scale-head"><span class="vx-scale-title">${esc(d.title)}</span><span class="vx-value unset" aria-live="polite">—</span></div><input class="vx-slider" type="range" min="${low}" max="${high}" step="1" value="${Number(d.source.slider_start)}" aria-label="${esc(d.title)}"><div class="vx-ends"><span>${esc(d.ends[0])}</span><span>${esc(d.ends[1])}</span></div><div class="vx-ticks" aria-hidden="true">${ticks}</div></section>`;
    }).join('');
    const content=`<h1 class="vx-eval-stimulus">${esc(stimulus)}</h1><div class="vx-scales">${cards}</div><div class="vx-error" role="alert" id="vx-response-error" hidden>Responde las cuatro escalas antes de continuar.</div>${nav([{label:'Siguiente',action:'submit'}])}`;
    host.innerHTML=shell(header,content);
    return {scr,desc,stimulus};
  }
  function renderSurvey(host,context){
    const survey=context.definition.screens.Cuestionario.survey;
    const questions=(survey.pages||[]).flatMap(p=>p.elements||[]);
    const blocks=questions.map((q,i)=>{
      const field=`q${i}`;
      const head=`<label class="vx-question-title" for="${field}">${esc(q.title||q.name)} ${q.isRequired?'<span class="vx-required">*</span>':''}</label>`;
      if(q.type==='radiogroup'){
        if(q.choices.length>12){const opts=q.choices.map(o=>`<option value="${esc(o.value??o)}">${esc(o.text??o.value??o)}</option>`).join('');return `<div class="vx-question">${head}<select class="vx-select" id="${field}" name="${field}" data-question="${esc(q.name)}" ${q.isRequired?'required':''}><option value="">Selecciona una opción</option>${opts}</select></div>`;}
        const opts=q.choices.map((o,j)=>`<label class="vx-option"><input type="radio" name="${field}" data-question="${esc(q.name)}" value="${esc(o.value??o)}" ${q.isRequired?'required':''}><span>${esc(o.text??o.value??o)}</span></label>`).join('');
        return `<fieldset class="vx-question" style="margin:0;min-width:0"><legend class="vx-question-title">${esc(q.title||q.name)} ${q.isRequired?'<span class="vx-required">*</span>':''}</legend><div class="vx-options">${opts}</div></fieldset>`;
      }
      if(q.type==='boolean')return `<fieldset class="vx-question" style="margin:0;min-width:0"><legend class="vx-question-title">${esc(q.title||q.name)} <span class="vx-required">*</span></legend><div class="vx-options"><label class="vx-option"><input name="${field}" data-question="${esc(q.name)}" value="true" type="radio" required>Sí</label><label class="vx-option"><input name="${field}" data-question="${esc(q.name)}" value="false" type="radio" required>No</label></div></fieldset>`;
      return `<div class="vx-question">${head}<input class="vx-input" name="${field}" data-question="${esc(q.name)}" type="text" id="${field}" ${q.isRequired?'required':''} placeholder="${esc(q.title||q.name)}"></div>`;
    }).join('');
    host.innerHTML=shell(`<div class="vx-eyebrow">Antes de comenzar</div>${title('Cuestionario sociodemográfico')}<p class="vx-lead">Responde las seis preguntas para continuar. Los campos marcados con * son obligatorios.</p>`,`<form id="vx-survey" class="vx-form">${blocks}<div class="vx-actions"><button class="vx-button" type="submit">Continuar</button></div></form>`, '', true);
    return questions;
  }
  class ValidacionScreenPlugin {
    static info={name:'validacion-screen',version:'1.0.0',parameters:{
      kind:{type:jsPsych.ParameterType.STRING,default:'welcome'},
      phase:{type:jsPsych.ParameterType.STRING,default:''},
      position:{type:jsPsych.ParameterType.INT,default:0},
      stimIndex:{type:jsPsych.ParameterType.INT,default:-1}
    }};
    constructor(jsPsychInstance){this.jsPsych=jsPsychInstance;}
    trial(display_element,trial){
      const ctx=window.ValidacionContext;
      const state=ctx.snapshot;
      const started=performance.now();
      const kind=trial.kind;
      let extra={},done=false;
      const finish=details=>{
        if(done)return;
        done=true;
        this.jsPsych.finishTrial({...details,rt:Math.round(performance.now()-started)});
      };
      if(kind==='evaluation'){
        const info=renderEval(display_element,{...trial,stimulus:trial.phase==='practice'?ctx.practice[trial.stimIndex]:ctx.main[trial.stimIndex]},state,ctx);
        const chosen=new Map();
        display_element.querySelectorAll('[data-scale]').forEach(card=>{
          const input=card.querySelector('.vx-slider');
          input.addEventListener('input',()=>{
            chosen.set(card.dataset.scale,Number(input.value));
            card.querySelector('.vx-value').textContent=input.value;
            card.querySelector('.vx-value').classList.remove('unset');
            display_element.querySelector('#vx-response-error').hidden=true;
          });
        });
        display_element.querySelector('[data-action="submit"]').addEventListener('click',()=>{
          if(chosen.size!==4){display_element.querySelector('#vx-response-error').hidden=false;return;}
          const row=trial.phase==='practice'?ctx.practice[trial.stimIndex]:ctx.main[trial.stimIndex];
          const result={response:'Siguiente',ButtonResponseComponent_1_response:'Siguiente',stimulus:info.stimulus,ID:row.ID,ID_Asociado:row['ID Asociado']};
          if(trial.phase==='main')Object.assign(result,{'Versión Final':info.stimulus,Orden:row.Orden});
          else result.Ensayo=info.stimulus;
          for(const desc of info.desc)result[`${desc.name}_response`]=chosen.get(desc.name);
          result.scaleDirections=Object.fromEntries(info.desc.map(d=>[d.name,d.ends]));
          result.response_components=Object.fromEntries(info.desc.map(d=>[d.name,{response:chosen.get(d.name)}]));
          if(trial.phase==='practice'){
            // ExpBuilder nombró Informatividad_copy a la cuarta escala de práctica.
            result.Credibilidad_response=chosen.get('Informatividad_copy');
            state.progress.practiceDone+=1;
          }else state.progress.mainDone+=1;
          window.scrollTo(0,0);finish(result);
        });
        return;
      }
      if(kind==='survey'){
        const questions=renderSurvey(display_element,ctx);
        display_element.querySelector('#vx-survey').addEventListener('submit',e=>{
          e.preventDefault();
          const answers={};
          for(let i=0;i<questions.length;i++){
            const q=questions[i],name=`q${i}`;
            const el=display_element.querySelector(`[name="${name}"]:checked`)||display_element.querySelector(`select[name="${name}"]`)||display_element.querySelector(`input[name="${name}"]`);
            if(!el||!el.value){display_element.querySelector('#vx-survey').reportValidity();return;}
            answers[q.name]=q.type==='boolean'?el.value==='true':el.value;
          }
          state.progress.surveyDone=true;
          finish({response:answers,SurveyComponent_1_response:answers,...Object.fromEntries(Object.entries(answers).map(([k,v])=>[`survey_${k}`,v]))});
        });
        return;
      }
      renderPage(display_element,kind,state,ctx);
      const respond=async action=>{
        const consentPageBefore=state.progress.consentPage;
        const click=display_element.querySelector(`[data-action="${action}"]`);
        if(click)click.disabled=true;
        if(kind==='consent'){
          if(action==='next')state.progress.consentPage+=1;
          if(action==='back')state.progress.consentPage-=1;
          if(action==='reject')state.progress.consentResult='rejected';
          if(action==='accept'){
            try{
              await window.ValidacionStorage.createRemoteSession(state);
              state.progress.consentResult='accepted';
            }catch(error){
              console.error('La sesión no pudo registrarse:',error);
              let box=display_element.querySelector('.vx-status.error');
              if(!box){box=document.createElement('div');box.className='vx-status error';display_element.querySelector('.vx-panel').appendChild(box);}
              box.textContent='No se pudo registrar la sesión en el servidor. Comprueba tu conexión y vuelve a intentar. '+error.message;
              if(click)click.disabled=false;
              return;
            }
          }
        }
        if(kind==='welcome')state.progress.welcomeDone=true;
        if(kind==='preSurvey')state.progress.introDone=true;
        if(kind==='instructions')state.progress.instructionsDone=true;
        if(kind==='prePractice'){
          if(action==='back'){
            const body=display_element.querySelector('.vx-panel');
            body.innerHTML=`${title('Instrucciones')}${sourceDocument(ctx.definition.screens.Instrucciones.texts.slice(1),false)}${nav([{label:'Volver a la práctica',action:'next'}])}`;
            body.querySelector('[data-action="next"]').addEventListener('click',()=>{state.progress.prePracticeDone=true;finish({response:'Continuar'});});
            return;
          }
          state.progress.prePracticeDone=true;
        }
        if(kind==='postPractice')state.progress.postPracticeDone=true;
        if(kind==='finish')state.progress.finalDone=true;
        const response=({accept:'Acepto',reject:'No acepto',back:'Regresar',finish:'Finalizar'})[action]||'Continuar';
        const buttonMap=kind==='consent'&&consentPageBefore===4?({accept:'ButtonResponseComponent_1',reject:'ButtonResponseComponent_2',back:'ButtonResponseComponent_3'})[action]:action==='back'?'ButtonResponseComponent_2':'ButtonResponseComponent_1';
        window.scrollTo(0,0);finish({response,[`${buttonMap}_response`]:response,action});
      };
      display_element.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>respond(button.dataset.action)));

    }
  }
  window.ValidacionScreenPlugin=ValidacionScreenPlugin;
})();
