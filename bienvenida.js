/* Solo Bienvenida: interfaz fluida con jsPsych y controles de respuesta originales. */
(function (win,doc) {
  'use strict';
  const ID='validacion-bienvenida';
  const diagnostics={version:'6.0', installed:0, started:0, rendered:0, clicks:0, finished:0, fallbacks:0, nativeFound:0, nativeTag:null, nativeClass:null, forwarded:0, lastProblem:null, candidates:[]};
  win.ValidacionBienvenidaDiagnostics=diagnostics;
  let active=false, current=null, observation=null, timer=null, deadline=null, clickWatch=null;
  const el=(tag,cls,txt)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
  const clean=()=>{
    active=false;
    if(observation){observation.disconnect();observation=null;}
    if(timer){clearInterval(timer);timer=null;}
    if(deadline){clearTimeout(deadline);deadline=null;}
    if(clickWatch){clearTimeout(clickWatch);clickWatch=null;}
    doc.getElementById(ID)?.remove();
    current=null;
  };
  // ExpBuilder dibuja la respuesta con su propio plugin. No hay garantía de que
  // sea un elemento <button>: puede ser un div, span u otro componente anidado.
  // Se busca el texto real, dentro de la pantalla de jsPsych, sin modificar
  // el nodo nativo ni sus escuchas de eventos.
  function inspectCandidates(){
    const scope = doc.querySelector('.jspsych-content') ||
      doc.querySelector('#jspsych-content') ||
      doc.querySelector('.jspsych-display-element:not(body)') || doc.body;
    const all = [];
    const walker = doc.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const t=walker.currentNode;
      const parent=t.parentElement;
      if(!parent || parent.closest('#'+ID+',script,style,noscript,template')) continue;
      const value=t.nodeValue.replace(/\s+/g,' ').trim();
      if(!/continuar/i.test(value)) continue;
      const normalized=value.toLocaleLowerCase('es-MX');
      const exact=normalized==='continuar';
      const rect=parent.getBoundingClientRect();
      const css=win.getComputedStyle(parent);
      const isVisible=rect.width>0 && rect.height>0 && css.display!=='none' && css.visibility!=='hidden';
      const clickable=parent.closest('button,input,[role="button"],[data-choice],[data-component-id],[class*="ButtonResponse"],[class*="button"],[class*="Button"]');
      all.push({parent,clickable,exact,isVisible,rect,
        text:value,tag:parent.tagName,className:typeof parent.className==='string'?parent.className.slice(0,120):''});
    }
    // Fallback para controles input, que no tienen nodos de texto.
    for(const input of scope.querySelectorAll('input[type="button"],input[type="submit"]')){
      const value=String(input.value||'').trim().toLocaleLowerCase('es-MX');
      if(value==='continuar') all.push({parent:input,clickable:input,exact:true,isVisible:input.getBoundingClientRect().width>0,
        text:input.value,tag:input.tagName,className:input.className||''});
    }
    diagnostics.candidates=all.map(x=>({text:x.text,tag:x.tag,cls:x.className,exact:x.exact,visible:x.isVisible})).slice(0,12);
    return all;
  }
  function findNativeContinue(){
    const matches=inspectCandidates().filter(x=>x.exact && x.isVisible);
    if(!matches.length) return null;
    // Priorizar un control localizado antes que una coincidencia genérica.
    matches.sort((a,b)=>Number(!!b.clickable)-Number(!!a.clickable));
    const chosen=matches[0];
    const native=chosen.parent; // Un click sobre el texto burbujea al controlador nativo.
    diagnostics.nativeFound++;
    diagnostics.nativeTag=native.tagName;
    diagnostics.nativeClass=(typeof native.className==='string'?native.className:'').slice(0,120);
    return native;
  }
  function sourceData(trial, authored){
    const array=(trial && Array.isArray(trial.components))?trial.components:authored?.components||[];
    const images=array.filter(c=>c?.type==='ImageComponent').sort((a,b)=>Number(a.coordinates?.x||0)-Number(b.coordinates?.x||0));
    const text=array.filter(c=>c?.type==='TextComponent').map(c=>String(c.text||'')).join('\n');
    // El texto es una única cadena generada por ExpBuilder con dos saltos antes del segundo párrafo.
    const lines=text.replace(/\\n/g,'\n').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    return {images,lines};
  }
  function show(trial, authored, nativeButton){
    if(!active || doc.getElementById(ID)) return;
    const {images,lines}=sourceData(trial,authored);
    // Nunca reemplazar la pantalla si faltan las imágenes o el botón nativo.
    if(images.length!==3 || !lines.length){
      diagnostics.lastProblem='No se encontraron tres logotipos o el texto original';
      diagnostics.fallbacks++;return;
    }
    const overlay=el('main'); overlay.id=ID;overlay.setAttribute('aria-label','Pantalla de bienvenida');
    const card=el('article','vb-card'); const header=el('header','vb-header','Universidad Nacional Autónoma de México');
    const main=el('section','vb-main');
    const logoRow=el('div','vb-logos');
    images.forEach((c,i)=>{
      const image=el('img','vb-logo');image.src=String(c.stimulus);
      image.alt=['UNAM','Facultad de Psicología','DEPI Psicología UNAM'][i]||'Logotipo institucional';
      logoRow.appendChild(image);
    });
    main.appendChild(logoRow);
    main.appendChild(el('h1','vb-title',lines[0]));
    if(lines[1])main.appendChild(el('p','vb-intro',lines[1]));
    if(lines[2])main.appendChild(el('p','vb-thanks',lines[2]));
    const researchers=el('div','vb-researchers');
    for(const line of lines.slice(3))researchers.appendChild(el('p','vb-researcher',line));
    main.appendChild(researchers);
    const footer=el('footer','vb-footer');
    const next=el('button','vb-next','Continuar');next.type='button';
    next.addEventListener('click',()=>{
      if(!active||next.disabled)return;
      diagnostics.clicks++;
      next.disabled=true;
      // Enviar el evento al elemento que ExpBuilder dibujó, sin invocar a jsPsych.finishTrial.
      // De este modo el registro de datos/ramificaciones sigue a cargo del plugin.
      diagnostics.forwarded++;
      nativeButton.click();
      // Si el plugin no termina, mostrar la interfaz nativa en vez de bloquear el estudio.
      clickWatch=setTimeout(()=>{
        if(active){
          diagnostics.lastProblem='Se encontró Continuar, pero el plugin no avanzó tras el click reenviado';
          diagnostics.fallbacks++;
          console.warn('[Validación Bienvenida]',diagnostics.lastProblem);
          clean();
        }
      },2500);
    });
    footer.appendChild(next);card.append(header,main,footer);overlay.appendChild(card);
    doc.body.appendChild(overlay);
    diagnostics.rendered++;
    diagnostics.lastProblem=null;
  }
  function begin(trial,authored){
    clean();active=true;current={trial,authored};diagnostics.started++;
    const scan=()=>{
      if(!active||doc.getElementById(ID))return;
      const button=findNativeContinue();
      if(button){
        try{show(current.trial,current.authored,button);}catch(err){
          diagnostics.lastProblem=String(err);diagnostics.fallbacks++;
          console.warn('[Validación Bienvenida] Se conserva diseño original por error:',err);
        }
        if(doc.getElementById(ID)){
          observation?.disconnect();observation=null;
          if(timer)clearInterval(timer);timer=null;
          if(deadline)clearTimeout(deadline);deadline=null;
        }
      }
    };
    observation=new MutationObserver(scan);
    observation.observe(doc.body,{childList:true,subtree:true});
    timer=setInterval(scan,120);
    deadline=setTimeout(()=>{
      if(!doc.getElementById(ID)){
        diagnostics.lastProblem='No se encontró un elemento visible con texto Continuar';diagnostics.fallbacks++;
        console.warn('[Validación Bienvenida] No se encontró Continuar nativo. Se conserva el diseño de ExpBuilder.',diagnostics.candidates);
      }
      observation?.disconnect();observation=null;
      clearInterval(timer);timer=null;deadline=null;
    },8000);
    scan();
  }
  function install(timeline){
    const sourceByTrial=new WeakMap();
    const walk=nodes=>{
      for(const node of nodes||[]){
        if(!node||typeof node!=='object')continue;
        if(node.data?.trial_name==='Bienvenida'){
          const oldStart=node.on_start,oldFinish=node.on_finish,oldLoad=node.on_load;
          const authored=Array.isArray(node.components)?node:null;
          node.on_start=function(trial){
            const ret=oldStart?.call(this,trial);
            begin(trial,authored || sourceByTrial.get(node) || null);
            return ret;
          };
          node.on_load=function(...args){
            const ret=oldLoad?.apply(this,args);
            if(!active)begin(null,authored || sourceByTrial.get(node) || null);
            return ret;
          };
          node.on_finish=function(data){diagnostics.finished++;clean();return oldFinish?.call(this,data);};
          diagnostics.installed++;
        }
        if(Array.isArray(node.timeline)){
          // Un procedimiento jsPsych conserva sus timeline_variables originales.
          if(Array.isArray(node.timeline_variables)&&node.timeline_variables.length){
            for(const child of node.timeline){
              if(child?.data?.trial_name==='Bienvenida') sourceByTrial.set(child,node.timeline_variables[0]);
            }
          }
          walk(node.timeline);
        }
      }
    };
    walk(timeline);
    if(diagnostics.installed!==1){diagnostics.lastProblem='El instalador esperaba un único ensayo Bienvenida';
      console.warn('[Validación Bienvenida]',diagnostics.lastProblem,diagnostics.installed);}
  }
  win.ValidacionBienvenida={install,clean,inspect:()=>inspectCandidates().map(x=>({text:x.text,tag:x.tag,cls:x.className,exact:x.exact,visible:x.isVisible}))};
})(window,document);
