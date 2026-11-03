/*
 * Validación — interfaz adaptable, versión 2.
 * El plugin original de ExpBuilder conserva el control de respuestas, ramificaciones y guardado.
 * Las vistas HTML independientes se comunican únicamente con los controles nativos del plugin.
 * En caso de incompatibilidad de un control se muestra el renderizador nativo sin alterar datos.
 */
(function (global, doc) {
  'use strict';
  const ROOT_ID = 've-responsive-root';
  const AXES = [
    {key:'Moralidad', title:'Moralidad', left:'Malo', right:'Bueno'},
    {key:'Competencia', title:'Competencia', left:'Incapaz', right:'Capaz'},
    {key:'Informatividad', title:'Informatividad', left:'Poco informativo', right:'Muy informativo'},
    {key:'Credibilidad', title:'Credibilidad', left:'Poco creíble', right:'Muy creíble'}
  ];
  let token = 0;
  let activeRoot = null;
  let nativeDisplay = null;
  const DEBUG = new URLSearchParams(location.search).has('layoutDebug');
  const diagnostics = {version:'3.0.0',installed:0,trialsSeen:0,attempts:0,rendered:0,failures:[],lastTrial:null};
  global.ValidacionLayoutDiagnostics = diagnostics;
  function note(...args) { if(DEBUG) console.info('[Validación diseño v3]',...args); }


  const elem = (tag, cls, text) => {
    const el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const compY = (c) => Number(c && c.coordinates && c.coordinates.y || 0);
  const listSorted = (list) => (list || []).slice().sort((a,b) => compY(b)-compY(a));

  function cleanup() {
    ++token;
    if (activeRoot) { activeRoot.remove(); activeRoot=null; }
    doc.body.classList.remove('ve-redesigned-active','ve-survey-native');
  }

  function nativeCandidates() {
    // Buscar dentro del contenedor que realmente recibe el DOM del plugin.
    // Algunos plugins no crean .jspsych-content-wrapper.
    const host = nativeDisplay || doc;
    const roots = [host];
    if (host !== doc) roots.push(doc);
    function fromRoots(selector) {
      for (const root of roots) {
        const found = Array.from(root.querySelectorAll(selector))
          .filter(el => !el.closest('#' + ROOT_ID));
        if (found.length) return found;
      }
      return [];
    }
    return {
      ranges: fromRoots('input[type="range"], [role="slider"], .noUi-target'),
      buttons: fromRoots('button, input[type="button"], input[type="submit"], [role="button"]')
    };
  }

  function nativeButton(buttons,label,used) {
    const want = String(label).trim().toLocaleLowerCase('es');
    return buttons.find(b=>{
      if (used.has(b)) return false;
      const v= String(b.tagName==='INPUT' ? b.value : b.textContent).trim().toLocaleLowerCase('es');
      return v===want || (v.replace(/\s+/g,' ')===want.replace(/\s+/g,' '));
    });
  }

  function matchedButtons(buttonComponents,native) {
    const out = [];
    const used=new Set();
    for (const component of buttonComponents) {
      for (const choice of (component.choices || [])) {
        const actual = nativeButton(native.buttons,choice,used);
        if (!actual) return null;
        used.add(actual);
        out.push({component,label:String(choice),actual});
      }
    }
    return out;
  }

  function header(name) {
    const head = elem('header','ve-heading');
    const eyebrow = elem('span','ve-eyebrow',name.includes('Consentimiento') ? 'Información para participantes' : name === 'Ensayo' ? 'Práctica' : name === 'Behavioral Statements' ? 'Evaluación' : 'Estudio de investigación');
    const brand = elem('span','ve-brand','UNAM · Facultad de Psicología');
    head.append(eyebrow,brand);
    return head;
  }

  function startPage(name, isTask) {
    const root = elem('main'); root.id=ROOT_ID; root.setAttribute('aria-label',name);
    const page = elem('div',`ve-page ${isTask ? 've-task-page' : ''}`);
    page.appendChild(header(name));
    root.appendChild(page);
    return {root,page};
  }

  function addImages(target, components) {
    if (!components.length) return;
    const media=elem('div','ve-media');
    for (const c of components) {
      if (!c.stimulus) continue;
      const img=elem('img'); img.src=c.stimulus; img.alt='Logotipo institucional';
      img.loading='eager';
      media.appendChild(img);
    }
    if (media.childElementCount) target.appendChild(media);
  }

  function addText(target, text, kind) {
    const raw=String(text ?? '').trim();
    if (!raw) return;
    const tag=kind==='h1'?'h1':kind==='h2'?'h2':'p';
    const className=kind==='h1'?'ve-h1':kind==='h2'?'ve-h2':'ve-text';
    const node=elem(tag,className,raw);
    target.appendChild(node);
  }

  function getTextParts(components,name,target) {
    let first=true;
    for (const c of components) {
      if (c.type==='ImageComponent') continue;
      if (c.type==='HtmlComponent') {
        // Conservar su texto visible, no inyectar HTML sin sanitizar.
        const div=elem('div','ve-text');
        try { const parsed=new DOMParser().parseFromString(String(c.stimulus||''),'text/html'); div.textContent=(parsed.body.textContent||'').trim(); }
        catch (_) { div.textContent=String(c.stimulus||'').replace(/<[^>]+>/g,''); }
        if (div.textContent) target.appendChild(div);
        continue;
      }
      if (c.type!=='TextComponent') continue;
      const value = String(c.text ?? '').trim();
      if (!value) continue;
      if (name==='Bienvenida' && first) {
        const [welcome, ...rest] = value.split(/\n\s*\n/);
        addText(target,welcome,'h1');
        if (rest.length) addText(target,rest.join('\n\n'),'p');
        first=false;
        continue;
      }
      const simple = value.length<=85 && !value.includes('\n\n');
      const kind = first && simple ? 'h1' : (simple && value.length<=62 ? 'h2' : 'p');
      addText(target,value,kind);
      first=false;
    }
  }

  function footer(page, buttons, touched) {
    const box = elem('footer','ve-footer');
    const hint=elem('span','ve-hint',touched ? 'Mueve las cuatro escalas para habilitar «Siguiente».' : '');
    box.appendChild(hint);
    const rendered = [];
    for (const {label,actual} of buttons) {
      const button=elem('button','ve-button',label);
      button.type='button';
      if (/regresar/i.test(label)) button.classList.add('ve-button-secondary');
      if (/no acepto|salir/i.test(label)) button.classList.add('ve-button-decline');
      button.addEventListener('click', () => {
        if (button.disabled) return;
        // El plugin original activa la ramificación, la recogida de datos y el guardado.
        actual.click();
      });
      rendered.push(button);
      box.appendChild(button);
    }
    page.appendChild(box);
    return {hint,rendered};
  }

  function renderInformation(trial, buttons) {
    const name=String(trial.data && trial.data.trial_name || 'Información');
    const {root,page}=startPage(name,false);
    const body=elem('section','ve-body');
    const components=listSorted(trial.components || []);
    const images=components.filter(c=>c.type==='ImageComponent');
    if (images.length) {
      body.classList.add('ve-welcome');
      addImages(body,images);
    }
    getTextParts(components,name,body);
    page.appendChild(body);
    footer(page,buttons,false);
    return root;
  }

  function inferAxisEnds(slider,components,fallback) {
    const y = Number(slider?.coordinates?.y);
    if(!Number.isFinite(y)) return fallback;
    // Leer los extremos escritos por el autor para cada ensayo. En algunos
    // estímulos 'Capaz' e 'Incapaz' aparecen en orden inverso.
    const matches = (components || []).filter(c =>
      c.type==='TextComponent' &&
      Number.isFinite(Number(c.coordinates?.x)) &&
      Number.isFinite(Number(c.coordinates?.y)) &&
      Math.abs(Number(c.coordinates.y)-y) < 8 &&
      Math.abs(Number(c.coordinates.x))>25 &&
      String(c.text||'').trim().length<60
    );
    const left=matches.filter(c=>Number(c.coordinates.x)<0).sort((a,b)=>
      Math.abs(Number(a.coordinates.y)-y)-Math.abs(Number(b.coordinates.y)-y))[0];
    const right=matches.filter(c=>Number(c.coordinates.x)>0).sort((a,b)=>
      Math.abs(Number(a.coordinates.y)-y)-Math.abs(Number(b.coordinates.y)-y))[0];
    if(!left || !right) return fallback;
    return {left:String(left.text).trim(),right:String(right.text).trim()};
  }

  function detectAxis(slider,index,trialName) {
    const name = String(slider.name || '');
    if (name==='Informatividad_copy') return AXES[3]; // Nombre histórico del componente, NO de la dimensión.
    const category = AXES.find(c=>c.key===name);
    if (category) return category;
    return AXES[index] || {title:name || `Escala ${index+1}`,left:String(slider.min),right:String(slider.max)};
  }

  // Identifica cada control nativo por su posición vertical en el diseño original;
  // nunca intercambia valores ni etiquetas aunque el array de componentes tenga otro orden.
  function matchedSliders(components,nativeRanges) {
    if (!nativeRanges || nativeRanges.length !== components.length) return null;
    const byModel=listSorted(components);
    const byDOM=nativeRanges.slice().sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
    const entries=byModel.map((component,i)=>({component,native:byDOM[i]}));
    for (const e of entries) {
      const el=e.native;
      if(el.matches('input[type="range"]')) {
        if(Number(el.min)!==Number(e.component.min) || Number(el.max)!==Number(e.component.max)) return null;
      } else if (!el.noUiSlider || typeof el.noUiSlider.set !== 'function') {
        // No se simulan respuestas si no conocemos el control original.
        return null;
      }
    }
    return entries;
  }

  function synchronizeInput(from,to) {
    if(to.noUiSlider && typeof to.noUiSlider.set==='function') {
      to.noUiSlider.set(Number(from.value));
      return;
    }
    const descriptor=Object.getOwnPropertyDescriptor(global.HTMLInputElement.prototype,'value');
    if (descriptor && descriptor.set) descriptor.set.call(to,from.value); else to.value=from.value;
    to.dispatchEvent(new Event('input',{bubbles:true}));
    to.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function renderRatings(trial, buttonMatches,sliderMatches) {
    const name=String(trial.data && trial.data.trial_name || 'Evaluación');
    const {root,page}=startPage(name,true);
    const body=elem('section','ve-task-body');
    const label=elem('div','ve-task-label',name==='Ensayo'?'Ensayo de práctica':'Valoración de afirmaciones');
    body.appendChild(label);
    const texts=listSorted((trial.components || []).filter(c=>c.type==='TextComponent'));
    const statement=texts.find(c=>c.name==='TextComponent_1') || texts[0];
    addText(body,statement && statement.text || '', 'h1');
    const statementNode=body.querySelector('h1');
    if (statementNode) statementNode.className='ve-statement';
    const grid=elem('div','ve-rating-grid');
    const touched = new Set();
    const byComponent=new Map(sliderMatches.map(e=>[e.component,e.native]));
    const statuses=[];
    const sorted=sliderMatches.map(x=>x.component).sort((a,b)=>{
      const ia=AXES.findIndex(z=>z.key===(a.name==='Informatividad_copy'?'Credibilidad':a.name));
      const ib=AXES.findIndex(z=>z.key===(b.name==='Informatividad_copy'?'Credibilidad':b.name));
      return ia-ib;
    });
    for (let i=0; i<sorted.length; i++) {
      const c=sorted[i], actual=byComponent.get(c), axis=detectAxis(c,i,name);
      const ends = inferAxisEnds(c,trial.components,axis);
      const card=elem('section','ve-rating');
      const title=elem('div','ve-rating-title',axis.title);
      const extremes=elem('div','ve-rating-extremes');
      extremes.append(elem('span','',ends.left),elem('span','',ends.right));
      const slider=elem('input','ve-slider');
      slider.type='range'; slider.min=String(c.min ?? 0);slider.max=String(c.max ?? 100);
      slider.step=String(c.step ?? 1); slider.value=String(c.slider_start ?? 0);
      slider.id='ve-scale-'+i;
      slider.setAttribute('aria-label',`${axis.title}: ${ends.left} a ${ends.right}`);
      slider.setAttribute('aria-valuetext',slider.value);
      const ticks=elem('div','ve-ticks');
      const labels = Array.isArray(c.labels) && c.labels.length ? c.labels : Array.from({length:Number(c.max)-Number(c.min)+1},(_,k)=>String(Number(c.min)+k));
      for (const v of labels) ticks.appendChild(elem('span','',String(v)));
      const status=elem('div','ve-scale-status','Selecciona una puntuación');
      const requireMovement = c.require_movement === true;
      const mark = () => {
        if (!touched.has(c)) touched.add(c);
        card.dataset.touched='true';
        status.textContent=`Respuesta: ${slider.value}`;
        slider.setAttribute('aria-valuetext',slider.value);
        synchronizeInput(slider,actual);
        updateFooter();
      };
      slider.addEventListener('input',mark);
      slider.addEventListener('change',mark);
      card.append(title,extremes,slider,ticks,status);
      grid.appendChild(card);
      statuses.push({component:c,requireMovement});
    }
    body.appendChild(grid);page.appendChild(body);
    const buttons=footer(page,buttonMatches,true);
    function updateFooter() {
      const missing=statuses.filter(item=>item.requireMovement&&!touched.has(item.component)).length;
      const next=buttons.rendered.find(b=>/siguiente/i.test(b.textContent));
      if (next) next.disabled=missing>0;
      buttons.hint.textContent=missing>0?`Faltan ${missing} ${missing===1?'valoración':'valoraciones'} por responder.`:'Todas las escalas están completas.';
    }
    updateFooter();
    return root;
  }

  function show(trial) {
    cleanup();
    diagnostics.attempts++;
    const ownToken=token;
    if (!trial || !Array.isArray(trial.response_components)) return;
    const response=trial.response_components;
    if (response.some(c=>c.type==='SurveyComponent')) {
      doc.body.classList.add('ve-survey-native');
      return; // SurveyJS y su sistema de validaciones se conservan completamente.
    }
    const native=nativeCandidates();
    const buttons=response.filter(c=>c.type==='ButtonResponseComponent');
    const buttonMatches=matchedButtons(buttons,native);
    if (!buttonMatches) {
      console.warn('Validación: no se encontraron botones nativos; se conserva la pantalla original.');
      return false;
    }
    const sliders=response.filter(c=>c.type==='SliderResponseComponent');
    let root;
    if (sliders.length) {
      const matched=matchedSliders(sliders,native.ranges);
      if (!matched) {
        console.warn('Validación: controles de escala incompatibles; se conserva la pantalla original para proteger los datos.');
        return false;
      }
      root=renderRatings(trial,buttonMatches,matched);
    } else {
      root=renderInformation(trial,buttonMatches);
    }
    if (ownToken!==token) return;
    activeRoot=root;
    diagnostics.rendered++;
    note("vista activada", String(trial.data?.trial_name||""), diagnostics.rendered);
    doc.body.appendChild(root);
    doc.body.classList.add('ve-redesigned-active');
    root.focus({preventScroll:true});
    return true;
  }

  function install(timeline, originalPlugin) {
    const plugin = originalPlugin || global.DynamicPlugin;
    if (typeof plugin !== 'function') {
      diagnostics.failures.push('No se recibió clase del plugin original');
      console.warn('[Validación diseño v3] No se localizó el plugin; se mantiene interfaz nativa');
      return;
    }

    // Interceptamos el punto real de renderizado del plugin, no solamente
    // on_load (que en plugins personalizados puede dispararse antes de crear DOM).
    class AdaptivePlugin extends plugin {
      trial(displayElement,trial,...args) {
        nativeDisplay=displayElement;
        diagnostics.trialsSeen++;
        diagnostics.lastTrial=String(trial?.data?.trial_name||'');
        let active=true;
        let finished=false;
        let observer;
        let attempts=0;
        const started=Date.now();
        const tryRender=() => {
          if(!active || finished || activeRoot || !doc.body.contains(displayElement)) return;
          // Para el cuestionario, el plugin original mantiene el control.
          if(trial?.response_components?.some(c=>c.type==='SurveyComponent')) {
            doc.body.classList.add('ve-survey-native');
            finished=true;
            observer?.disconnect();
            return;
          }
          attempts++;
          if(Date.now()-started>6000 || attempts>100) {
            finished=true;
            observer?.disconnect();
            diagnostics.failures.push('Controles no compatibles en '+diagnostics.lastTrial);
            console.warn('[Validación diseño v3] No se pudo activar el diseño en',diagnostics.lastTrial,'; se conserva la interfaz original');
            return;
          }
          const n=nativeCandidates();
          if(!n.buttons.length) return;
          try {
            if(show(trial)) {
              finished=true;
              observer?.disconnect();
            }
          } catch (err) {
            finished=true;
            observer?.disconnect();
            diagnostics.failures.push(String(err));
            console.warn('[Validación diseño v3] Fallo no crítico del diseño',err);
          }
        };
        const result=super.trial(displayElement,trial,...args);
        // El renderizador nativo puede crear controles sincrónica o
        // asincrónicamente. MutationObserver soporta ambos casos.
        observer=new MutationObserver(()=>global.requestAnimationFrame(tryRender));
        observer.observe(displayElement,{childList:true,subtree:true});
        global.requestAnimationFrame(tryRender);
        let poll=0;
        const timer=global.setInterval(()=>{
          if(finished || ++poll>=30) { global.clearInterval(timer);return; }
          tryRender();
        },200);
        return result;
      }
    }
    const walk=(nodes)=>{
      for(const node of nodes||[]) {
        if(!node || typeof node!=='object') continue;
        if(node.type===plugin) {
          diagnostics.installed++;
          const oldStart=node.on_start;
          const oldFinish=node.on_finish;
          node.type=AdaptivePlugin;
          node.on_start=function(trial) {
            cleanup();
            doc.body.classList.remove('ve-survey-native');
            return oldStart?.call(this,trial);
          };
          node.on_finish=function(data) {
            cleanup();
            doc.body.classList.remove('ve-survey-native');
            return oldFinish?.call(this,data);
          };
        }
        if(Array.isArray(node.timeline)) walk(node.timeline);
      }
    };
    walk(timeline);
    note('plugin interceptado en',diagnostics.installed,'ensayos');
    if(!diagnostics.installed) {
      diagnostics.failures.push('No se encontraron nodos del plugin');
      console.warn('[Validación diseño v3] No se encontraron nodos, se mantiene diseño original');
    }
  }

  global.ExpBuilderResponsive={ install, cleanup, showPreview:show };
})(window,document);
