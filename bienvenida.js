/* Solo Bienvenida: interfaz fluida con jsPsych y controles de respuesta originales. */
(function (win,doc) {
  'use strict';
  const ID='validacion-bienvenida';
  const diagnostics={version:'5.0', installed:0, started:0, rendered:0, clicks:0, fallbacks:0, lastProblem:null};
  win.ValidacionBienvenidaDiagnostics=diagnostics;
  let active=false, current=null, observation=null, timer=null, deadline=null;
  const el=(tag,cls,txt)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
  const clean=()=>{
    active=false;
    if(observation){observation.disconnect();observation=null;}
    if(timer){clearInterval(timer);timer=null;}
    if(deadline){clearTimeout(deadline);deadline=null;}
    doc.getElementById(ID)?.remove();
    current=null;
  };
  function findNativeContinue(){
    const els=doc.querySelectorAll('.jspsych-content button, .jspsych-content input[type="button"], .jspsych-content input[type="submit"], button, input[type="button"], input[type="submit"]');
    for(const btn of els){
      if(btn.closest('#'+ID)) continue;
      const text=(btn.tagName==='INPUT'?btn.value:btn.textContent).trim().replace(/\s+/g,' ').toLowerCase();
      if(text==='continuar' && !btn.disabled) return btn;
    }
    return null;
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
      nativeButton.click(); // El motor ExpBuilder registra la respuesta y avanza.
      // El on_finish nativo eliminará el overlay y dejará la siguiente pantalla intacta.
      setTimeout(()=>{if(active)next.disabled=false;},900);
    });
    footer.appendChild(next);card.append(header,main,footer);overlay.appendChild(card);
    doc.body.appendChild(overlay);
    diagnostics.rendered++;
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
        diagnostics.lastProblem='No se encontró el botón original Continuar';diagnostics.fallbacks++;
        console.warn('[Validación Bienvenida] No se encontró Continuar nativo. Se conserva el diseño de ExpBuilder.');
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
          node.on_finish=function(data){clean();return oldFinish?.call(this,data);};
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
  win.ValidacionBienvenida={install,clean};
})(window,document);
