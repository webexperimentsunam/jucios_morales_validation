/* v9: pantallas informativas como plugins jsPsych nativos; no modifica encuestas ni juicios. */
(function(win,doc) {
  'use strict';
  const NAMES = [
    'Precuestionario', 'Consentimiento Rechazado', 'Instrucciones',
    'Pre-ensayo', 'Final ensayo', 'Final Experimento'
  ];
  const diagnostics = {
    version:'9.0',mode:'native-jspsych',installed:0,rendered:0,started:0,
    clicks:0,finished:0,errors:[],screens:[],lastAction:null
  };
  win.ValidacionPantallasDiagnostics=diagnostics;
  const el=(tag,cl,text)=>{const e=doc.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=text;return e;};
  const clean=x=>String(x??'').trim();
  const lines=x=>String(x??'').split(/\r?\n/).map(s=>s.trim());
  const isBullet=x=>/^[•\-*]\s+/.test(x);
  function appendBlocks(parent,raw){
    const ls=lines(raw);let items=[];
    function flushItems(){if(!items.length)return;const ul=el('ul','vi-list');for(const t of items)ul.append(el('li','',t.replace(/^[•\-*]\s+/,'')));parent.append(ul);items=[];}
    let para=[];
    function flushPara(){if(!para.length)return;parent.append(el('p','vi-paragraph',para.join(' ')));para=[];}
    for(const l of ls){
      if(!l){flushPara();flushItems();continue;}
      if(isBullet(l)){flushPara();items.push(l);}
      else{flushItems();para.push(l);}
    }
    flushPara();flushItems();
  }
  function appendTextComponent(parent,component,role) {
    const text=clean(component.text);
    if(!text)return;
    if(role==='title')parent.append(el('h1','vi-title',text));
    else if(role==='section')parent.append(el('h2','vi-section',text));
    else appendBlocks(parent,component.text);
  }
  function appendImages(parent,images,cls){
    if(!images.length)return;
    const group=el('div',cls==='vi-logo'?'vi-logos':'vi-illustrations');
    images.forEach((img,i)=>{
      const visual=el('img',cls);visual.src=img.stimulus;visual.alt=cls==='vi-logo'?['UNAM','Facultad de Psicología','DEPI Psicología UNAM'][i]||'Logotipo':'Ilustración del experimento';
      group.append(visual);
    });
    parent.append(group);
  }
  function renderContent(container,source,name){
    const components=source.components;
    const texts=components.filter(c=>c.type==='TextComponent');
    const images=components.filter(c=>c.type==='ImageComponent');
    if(name==='Consentimiento Rechazado'){
      appendImages(container,images,'vi-logo');
      const t=clean(texts.map(c=>c.text).join('\n\n'));
      // La primera frase se presenta como titulo, conservando todas las frases originales.
      const blocks=t.split(/\n\s*\n+/).map(clean).filter(Boolean);
      if(blocks[0])container.append(el('h1','vi-title',blocks[0]));
      for(const block of blocks.slice(1))appendBlocks(container,block);
      return;
    }
    if(name==='Final Experimento'){
      appendImages(container,images.slice(0,3),'vi-logo');
      texts.forEach((t,i)=>appendTextComponent(container,t,i===0?'title':'body'));
      appendImages(container,images.slice(3),'vi-illustration');
      return;
    }
    if(name==='Instrucciones'){
      // El original deja el encabezado "Evita" despues de su lista. Solo se
      // corrige la agrupacion visual, sin cambiar el texto de ningun componente.
      const order=[0,1,2,4,3,6,5];
      for(const index of order){
        const t=texts[index];if(!t)continue;
        appendTextComponent(container,t,index===0?'title':(index===2||index===4||index===6)?'section':'body');
      }
      return;
    }
    texts.forEach((t,i)=>appendTextComponent(container,t,i===0?'title':'body'));
  }
  function getSource(procedure,name){
    const row=procedure.timeline_variables?.[0];
    if(!row || !Array.isArray(row.components) || !Array.isArray(row.response_components))throw new Error('Faltan componentes: '+name);
    const allowed=['ImageComponent','TextComponent'];
    if(row.components.some(c=>!allowed.includes(c.type)||!c.name))throw new Error('Componente interactivo inesperado en '+name);
    if(row.response_components.some(c=>c.type!=='ButtonResponseComponent'||!c.name||!Array.isArray(c.choices)))throw new Error('Respuestas no compatibles en '+name);
    const expected={
      'Precuestionario':['Continuar'],
      'Consentimiento Rechazado':['Salir'],
      'Instrucciones':['Continuar'],
      'Pre-ensayo':['Continuar','Regresar'],
      'Final ensayo':['Iniciar experimento'],
      'Final Experimento':['Finalizar']
    }[name];
    const choices=row.response_components.flatMap(c=>c.choices);
    if(choices.join('|')!==expected.join('|'))throw new Error('Cambió la lista de botones en '+name+': '+choices);
    return row;
  }
  function result(source,choice,rt){
    const output={rt};
    for(const c of source.components){
      const key=c.name;
      output[key+'_type']=c.type;
      if(c.type==='TextComponent'){
        output[key+'_text']=c.text;
        output[key+'_response']=null;
      }else if(c.type==='ImageComponent'){
        output[key+'_stimulus']=c.stimulus;
      }
    }
    for(const button of source.response_components){
      output[button.name+'_type']=button.type;
      output[button.name+'_response']=button.choices.includes(choice)?choice:null;
    }
    return output;
  }
  function install(timeline){
    let count=0;
    function walk(nodes){
      for(const procedure of nodes||[]){
        if(!procedure||!Array.isArray(procedure.timeline))continue;
        for(const node of procedure.timeline){
          const name=node?.data?.trial_name;
          if(!NAMES.includes(name))continue;
          const source=getSource(procedure,name);
          const previousFinish=node.on_finish;
          class InfoScreenPlugin{
            static info={name:'validacion-informativa',version:'9.0',parameters:{}};
            constructor(jsPsych){this.jsPsych=jsPsych;}
            trial(display){
              diagnostics.started++;
              display.innerHTML='';
              const root=el('main');root.id='validacion-pantalla';root.setAttribute('aria-label',name);
              const card=el('article','vi-card'+(name==='Instrucciones'?'':' vi-short'));
              const head=el('header','vi-head');
              head.append(el('span','', 'Facultad de Psicología · UNAM'));
              head.append(el('span','',name));
              const body=el('section','vi-content');body.tabIndex=0;
              const content=el('div','vi-document');renderContent(content,source,name);body.append(content);
              const footer=el('footer','vi-actions');
              const buttons=source.response_components.flatMap(c=>c.choices.map(choice=>({c,choice})))
                .sort((a,b)=>(a.choice==='Regresar'?-1:0)-(b.choice==='Regresar'?-1:0));
              const elements=[];
              const start=performance.now();let ended=false;
              for(const option of buttons){
                const b=el('button','vi-button',option.choice);b.type='button';b.dataset.choice=option.choice;
                b.addEventListener('click',()=>{
                  if(ended)return;
                  ended=true;elements.forEach(x=>x.disabled=true);
                  diagnostics.clicks++;diagnostics.lastAction={trial:name,choice:option.choice};
                  this.jsPsych.finishTrial(result(source,option.choice,Math.max(0,Math.round(performance.now()-start))));
                });
                elements.push(b);footer.append(b);
              }
              card.append(head,body,footer);root.append(card);display.append(root);diagnostics.rendered++;
            }
          }
          node.type=InfoScreenPlugin;
          delete node.components;
          delete node.response_components;
          node.on_finish=function(data){diagnostics.finished++;return previousFinish?.call(this,data);};
          diagnostics.screens.push({name,trialId:node.data.trial_id,choices:source.response_components.flatMap(c=>c.choices)});
          count++;
        }
        walk(procedure.timeline);
      }
    }
    try{walk(timeline);}catch(e){diagnostics.errors.push(e.message);throw e;}
    diagnostics.installed=count;
    if(count!==NAMES.length){const msg='Esperadas '+NAMES.length+' pantallas, encontradas '+count;diagnostics.errors.push(msg);throw new Error(msg);}
  }
  win.ValidacionPantallas={install};
})(window,document);
