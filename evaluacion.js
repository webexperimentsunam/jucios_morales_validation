/* Juicios morales v12 — dos bloques de evaluación con plugin nativo jsPsych.
   Lee las variables del bucle ACTUAL: no sustituye estímulos ni altera el muestreo.
   Esquema de datos original y ramas de navegación conservados. */
(function (win, doc) {
  'use strict';
  const dims=['Moralidad','Competencia','Informatividad','Credibilidad'];
  const keys={
    Ensayo: {
      dimensionLabels: [
        ['TextComponent_2','TextComponent_2_copy'],
        ['TextComponent_2_copy_2','TextComponent_2_copy_copy'],
        ['TextComponent_2_copy_2_copy','TextComponent_2_copy_copy_copy'],
        ['TextComponent_2_copy_2_copy_copy','TextComponent_2_copy_copy_copy_copy']
      ],
      titles:['TextComponent_3','TextComponent_3_copy','TextComponent_3_copy_2','TextComponent_3_copy_3'],
      sliderNames:['Moralidad','Competencia','Informatividad','Informatividad_copy'],
      vars:['components_Ensayo','response_components_Ensayo']
    },
    'Behavioral Statements': {
      dimensionLabels: [
        ['TextComponent_2','TextComponent_2_copy'],
        ['TextComponent_2_copy_2','TextComponent_2_copy_3'],
        ['TextComponent_2_copy_4','TextComponent_2_copy_5'],
        ['TextComponent_2_copy_6','TextComponent_2_copy_7']
      ],
      titles:['TextComponent_2_copy_8','TextComponent_2_copy_8_copy','TextComponent_2_copy_8_copy_copy','TextComponent_2_copy_8_copy_copy_copy'],
      sliderNames:['Moralidad','Competencia','Informatividad','Credibilidad'],
      vars:['components_Behavioral$20$Statements','response_components_Behavioral$20$Statements']
    }
  };
  const stats={version:'12.0',installed:0,practiceRendered:0,mainRendered:0,submitted:0,incomplete:0,lastTrial:null,lastValues:null,lastError:null};
  win.JuiciosEvaluacionDiagnostics=stats;
  const el=(tag,cls,text)=>{const o=doc.createElement(tag);if(cls)o.className=cls;if(text!==undefined)o.textContent=String(text);return o;};
  const item=(components,name)=>components.find(c=>c.name===name);
  const measurement=node=>{
    const r=node.getBoundingClientRect();
    return {coordinates:JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}),size:JSON.stringify({width:Math.round(r.width),height:Math.round(r.height)})};
  };
  function describe(components,responses,kind) {
    const cfg=keys[kind];
    if(!Array.isArray(components)||!Array.isArray(responses))throw Error('Datos incompletos de '+kind);
    const statements=components.filter(c=>c.type==='TextComponent'&&c.name==='TextComponent_1');
    if(statements.length!==1)throw Error('No hay una afirmación única en '+kind);
    const titles=cfg.titles.map(name=>item(components,name));
    const pairs=cfg.dimensionLabels.map(names=>names.map(n=>item(components,n)));
    const sliders=cfg.sliderNames.map(name=>item(responses,name));
    const buttons=responses.filter(c=>c.type==='ButtonResponseComponent');
    if(titles.some(c=>!c)||pairs.some(pair=>pair.some(c=>!c))||sliders.some(c=>!c)
       ||buttons.length!==1||buttons[0].choices?.join('|')!=='Siguiente') {
      throw Error('Los componentes de '+kind+' ya no coinciden con el respaldo original.');
    }
    sliders.forEach((s,i)=>{
      if(s.type!=='SliderResponseComponent'||!Number.isInteger(s.min)||!Number.isInteger(s.max)
         ||s.max-s.min!==8||!s.require_movement||!Array.isArray(s.labels)||s.labels.length!==9)
        throw Error('Configuración inesperada de escala '+s.name);
    });
    return {statement:statements[0],titles,pairs,sliders,button:buttons[0],components,responses};
  }
  function install(timeline){
    let count=0;
    const found=[];
    function walk(nodes){
      for(const p of nodes||[]){
        if(!p||!Array.isArray(p.timeline))continue;
        for(const t of p.timeline){
          if(keys[t?.data?.trial_name]) found.push({trial:t,kind:t.data.trial_name});
        }
        walk(p.timeline);
      }
    }
    walk(timeline);
    if(found.length!==2||new Set(found.map(x=>x.kind)).size!==2)
      throw Error('Se esperaban Ensayo y Behavioral Statements, no '+found.map(x=>x.kind).join(', '));
    for(const {trial,kind} of found){
      const originalFinish=trial.on_finish;
      const cfg=keys[kind];
      class NativeEvaluation {
        static info={name:kind==='Ensayo'?'juicios-practica-v12':'juicios-evaluacion-v12',version:'12.0',parameters:{}};
        constructor(jsPsych){this.jsPsych=jsPsych;}
        trial(display){
          const began=performance.now();
          const components=this.jsPsych.evaluateTimelineVariable(cfg.vars[0]);
          const responses=this.jsPsych.evaluateTimelineVariable(cfg.vars[1]);
          const source=describe(components,responses,kind);
          const practice=kind==='Ensayo';
          display.innerHTML='';
          const main=el('main','');main.id='juicios-evaluacion';main.lang='es-MX';
          const card=el('article','je-card');
          const top=el('header','je-header');
          top.append(el('span','je-brand','Facultad de Psicología · UNAM'),el('span','je-phase',practice?'Práctica':'Evaluación'));
          const scroll=el('div','je-scroll');
          const intro=el('section','je-intro');
          intro.append(el('p','je-kicker',practice?'Ensayo de práctica':'Evaluación de enunciados'));
          intro.append(el('h1','je-prompt',source.statement.text));
          intro.append(el('p','je-hint','Valora la afirmación en las cuatro dimensiones. Mueve cada escala para registrar tu respuesta.'));
          scroll.append(intro);
          const grid=el('div','je-grid');
          const state=[];
          const locationNodes=new Map();
          locationNodes.set(source.statement.name,intro.querySelector('h1'));
          source.sliders.forEach((slider,i)=>{
            const panel=el('section','je-scale');panel.dataset.dimension=dims[i];
            const title=el('h2','je-scale-title',source.titles[i].text);panel.append(title);
            locationNodes.set(source.titles[i].name,title);
            const ends=el('div','je-ends');
            const left=el('span','je-end',source.pairs[i][0].text);
            const right=el('span','je-end je-end-right',source.pairs[i][1].text);
            ends.append(left,right);panel.append(ends);
            locationNodes.set(source.pairs[i][0].name,left);
            locationNodes.set(source.pairs[i][1].name,right);
            const inp=el('input','je-range');inp.type='range';inp.min=slider.min;
            inp.max=slider.max;inp.step='1';inp.value=slider.slider_start;
            inp.id='je-range-'+i;
            inp.setAttribute('aria-label',source.titles[i].text+': de '+source.pairs[i][0].text+' a '+source.pairs[i][1].text);
            inp.setAttribute('aria-valuetext','Sin responder');
            const tick=el('div','je-ticks');
            for(let n=slider.min;n<=slider.max;n++)tick.append(el('span','',String(n)));
            const choice=el('div','je-choice','Sin responder');
            inp.addEventListener('input',()=>{
              state[i].touched=true;state[i].value=Number(inp.value);
              panel.classList.add('je-answered');
              choice.textContent='Valor seleccionado: '+inp.value;
              inp.setAttribute('aria-valuetext',inp.value);
              note.textContent='';
            });
            panel.append(inp,tick,choice);grid.append(panel);
            state.push({name:slider.name,slider,value:null,touched:false,input:inp,panel});
            locationNodes.set(slider.name,panel);
          });
          scroll.append(grid);
          const note=el('p','je-error');note.setAttribute('role','alert');scroll.append(note);
          const bottom=el('footer','je-footer');
          const advice=el('span','je-footer-text','Responde las cuatro escalas para continuar.');
          const next=el('button','je-next','Siguiente');next.type='button';
          bottom.append(advice,next);card.append(top,scroll,bottom);main.append(card);display.append(main);
          locationNodes.set(source.button.name,next);
          if(practice)stats.practiceRendered++;else stats.mainRendered++;
          stats.lastTrial=kind;stats.lastError=null;
          let done=false;
          next.addEventListener('click',()=>{
            if(done)return;
            const missing=state.filter(s=>!s.touched);
            if(missing.length){
              stats.incomplete++;
              note.textContent='Completa las cuatro evaluaciones. Faltan: '+missing.map(s=>s.name==='Informatividad_copy'?'Credibilidad':s.name).join(', ')+'.';
              missing.forEach(s=>s.panel.classList.add('je-missing'));
              missing[0].panel.scrollIntoView({behavior:'smooth',block:'center'});
              missing[0].input.focus({preventScroll:true});return;
            }
            done=true;next.disabled=true;
            const result={rt:Math.round(performance.now()-began),je_layout:'v12',je_phase:practice?'practica':'principal'};
            for(const c of components){
              const base=c.name;
              if(!base)continue;
              result[base+'_type']=c.type;
              if(c.type==='TextComponent'){
                result[base+'_text']=c.text;
                result[base+'_response']=null;
              }else if(c.type==='ImageComponent'){result[base+'_stimulus']=c.stimulus;}
              const target=locationNodes.get(base);
              if(target){const m=measurement(target);result[base+'_coordinates']=m.coordinates;result[base+'_size']=m.size;}
            }
            for(const s of state){
              result[s.name+'_type']='SliderResponseComponent';
              result[s.name+'_response']=s.value;
              result[s.name+'_slider_start']=s.slider.slider_start;
              const m=measurement(s.panel);result[s.name+'_coordinates']=m.coordinates;result[s.name+'_size']=m.size;
            }
            const b=source.button.name;
            result[b+'_type']='ButtonResponseComponent';result[b+'_response']='Siguiente';
            const bm=measurement(next);result[b+'_coordinates']=bm.coordinates;result[b+'_size']=bm.size;
            stats.submitted++;stats.lastValues=Object.fromEntries(state.map(s=>[s.name,s.value]));
            this.jsPsych.finishTrial(result);
          });
        }
      }
      trial.type=NativeEvaluation;
      delete trial.components;delete trial.response_components;
      delete trial.response_ends_trial;delete trial.require_response_components;
      trial.on_finish=function(data){return originalFinish?.call(this,data);};
      count++;
    }
    stats.installed=count;
  }
  win.JuiciosEvaluacion={install};
})(window,document);
