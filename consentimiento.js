/* Validacion v8: cuatro consentimientos nativos de jsPsych. */
(function (win, doc) {
  'use strict';
  const diagnostics = {
    version:'8.0', mode:'native-jspsych', installed:0, started:0,
    rendered:0, clicks:0, finished:0, fallbacks:0,
    lastAction:null, lastPage:null, lastProblem:null, pages:[]
  };
  win.ValidacionConsentimientoDiagnostics = diagnostics;

  const create = (tag, cssClass, text) => {
    const el = doc.createElement(tag);
    if (cssClass) el.className = cssClass;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const normalize = text => String(text || '').trim();
  const paragraphs = text => String(text || '').split(/\n\s*\n+/).map(normalize).filter(Boolean);

  // El plan editorial solo cambia la presentacion, nunca el texto de las definiciones.
  const plans = {
    1:['eyebrow','title','subtitle','body','section','body'],
    2:['title','body','section','body','section','body'],
    3:['title','body','section','body'],
    4:['title','body','html','section','body']
  };

  function getSource(procedure, page) {
    const variables = procedure.timeline_variables;
    const row = variables && variables[0];
    const components = row && row.components;
    const responses = row && row.response_components;
    if (!Array.isArray(components) || !Array.isArray(responses))
      throw new Error(`No se encontraron componentes del consentimiento ${page}`);
    if (components.length !== plans[page].length)
      throw new Error(`El consentimiento ${page} cambio de componentes; revisar antes de publicar`);
    if (!responses.length || !responses.every(r => r.type === 'ButtonResponseComponent' && r.name && Array.isArray(r.choices)))
      throw new Error(`Los botones del consentimiento ${page} cambiaron; revisar antes de publicar`);
    const expected = page === 1 ? ['Continuar'] : page === 4 ? ['Acepto','No acepto','Regresar'] : ['Continuar','Regresar'];
    const actual = responses.flatMap(r => r.choices);
    if (actual.join('|') !== expected.join('|'))
      throw new Error(`Las respuestas del consentimiento ${page} ya no coinciden con el experimento`);
    return {components, responses};
  }

  function appendBody(container, content) {
    for (const paragraph of paragraphs(content)) {
      if (paragraph === 'Participación voluntaria, retiro y atención') {
        container.append(create('h2','vc-section-title',paragraph));
      } else {
        container.append(create('p','vc-paragraph',paragraph));
      }
    }
  }

  // Preserva el enlace original de la pagina 4 sin inyectar HTML arbitrario.
  function appendAuthoredHtml(container, html) {
    const template = doc.createElement('template');
    template.innerHTML = String(html || '');
    const plain = normalize(template.content.textContent);
    const match = plain.match(/https?:\/\/[^\s]+/);
    if (!match) return appendBody(container, plain);
    const before = plain.slice(0,match.index);
    const urlWithPunctuation = match[0];
    const url = urlWithPunctuation.replace(/[.,;:!?]+$/, '');
    const after = urlWithPunctuation.slice(url.length) + plain.slice(match.index + urlWithPunctuation.length);
    const p = create('p','vc-paragraph');
    if (before) p.append(doc.createTextNode(before));
    const a = create('a','vc-link',url);
    a.href = url;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    p.append(a);
    if (after) p.append(doc.createTextNode(after));
    container.append(p);
  }

  function renderDocument(documentEl, components, page) {
    const plan = plans[page];
    components.forEach((comp,i) => {
      const role = plan[i];
      if (role === 'html') {
        if (comp.type !== 'HtmlComponent') throw new Error('Se esperaba un HtmlComponent en el consentimiento');
        appendAuthoredHtml(documentEl, comp.stimulus);
        return;
      }
      if (comp.type !== 'TextComponent') throw new Error('Se esperaba un TextComponent en el consentimiento');
      const text = normalize(comp.text);
      if (!text) return;
      if (role === 'eyebrow') documentEl.append(create('p','vc-eyebrow',text));
      if (role === 'title') documentEl.append(create('h1','vc-title',text));
      if (role === 'subtitle') documentEl.append(create('p','vc-subtitle',text));
      if (role === 'section') documentEl.append(create('h2','vc-section-title',text));
      if (role === 'body') appendBody(documentEl,comp.text);
    });
  }

  function makeResult(source, selected, rt, page) {
    const result = {rt};
    for (const comp of source.components) {
      if (!comp.name) continue;
      result[`${comp.name}_type`] = comp.type;
      if (comp.type === 'TextComponent') {
        result[`${comp.name}_text`] = comp.text;
        result[`${comp.name}_response`] = null;
      } else if (comp.type === 'HtmlComponent') {
        result[`${comp.name}_stimulus`] = comp.stimulus;
        result[`${comp.name}_response`] = null;
      }
    }
    for (const response of source.responses) {
      result[`${response.name}_type`] = response.type;
      result[`${response.name}_response`] = response === selected.response ? selected.choice : null;
    }
    // Redundante con las claves de ExpBuilder, pero facilita auditoria del consentimiento.
    result.consent_page = page;
    result.consent_action = selected.choice;
    return result;
  }

  function install(timeline) {
    let installed = 0;
    function walk(nodes) {
      if (!Array.isArray(nodes)) return;
      for (const procedure of nodes) {
        if (!procedure || typeof procedure !== 'object') continue;
        if (Array.isArray(procedure.timeline)) {
          for (const node of procedure.timeline) {
            const match = /^Consentimiento informado ([1-4])$/.exec(node?.data?.trial_name || '');
            if (!match) continue;
            const page = Number(match[1]);
            const source = getSource(procedure,page);
            const previousFinish = node.on_finish;
            class ConsentimientoPlugin {
              static info = {name:'validacion-consentimiento',version:'8.0',parameters:{}};
              constructor(jsPsych) {this.jsPsych = jsPsych;}
              trial(displayElement) {
                diagnostics.started++;
                diagnostics.lastPage = page;
                diagnostics.lastProblem = null;
                displayElement.innerHTML = '';
                const root = create('main');
                root.id = 'validacion-consentimiento';
                root.setAttribute('aria-label',`Consentimiento informado. Pagina ${page} de 4`);
                const card = create('article','vc-card');
                const header = create('header','vc-header');
                header.append(create('span','vc-header-title','Facultad de Psicología · UNAM'));
                header.append(create('span','vc-progress',`Página ${page} de 4`));
                const progress = create('div','vc-progress-track');
                progress.setAttribute('role','progressbar');
                progress.setAttribute('aria-label','Avance del consentimiento informado');
                progress.setAttribute('aria-valuemin','0');
                progress.setAttribute('aria-valuemax','4');
                progress.setAttribute('aria-valuenow',String(page));
                const fill = create('div','vc-progress-fill');
                fill.style.width = `${(page / 4) * 100}%`;
                progress.append(fill);
                const scroll = create('div','vc-scroll');
                scroll.tabIndex = 0;
                scroll.setAttribute('aria-label','Texto del consentimiento informado');
                const documentEl = create('div','vc-document');
                renderDocument(documentEl,source.components,page);
                scroll.append(documentEl);
                const footer = create('footer','vc-footer');
                const options = source.responses.flatMap(response => response.choices.map(choice=>({response,choice})));
                // Orden visual: regresar a la izquierda y decisiones a la derecha.
                const sortedOptions = options.slice().sort((a,b)=>{
                  const priority = {Regresar:0,'No acepto':1,Acepto:2,Continuar:3};
                  return (priority[a.choice]??10)-(priority[b.choice]??10);
                });
                const buttons = [];
                const start = performance.now();
                let finished = false;
                for (const option of sortedOptions) {
                  const button = create('button','vc-button',option.choice);
                  button.type = 'button';
                  button.dataset.choice = option.choice;
                  button.addEventListener('click',()=>{
                    if (finished) return;
                    finished = true;
                    diagnostics.clicks++;
                    diagnostics.lastAction = {page,choice:option.choice,component:option.response.name};
                    buttons.forEach(b=>b.disabled=true);
                    const rt = Math.max(0,Math.round(performance.now()-start));
                    this.jsPsych.finishTrial(makeResult(source,option,rt,page));
                  });
                  buttons.push(button);
                  footer.append(button);
                }
                card.append(header,progress,scroll,footer);
                root.append(card);
                displayElement.append(root);
                diagnostics.rendered++;
              }
            }
            node.type = ConsentimientoPlugin;
            delete node.components;
            delete node.response_components;
            node.on_finish = function(data) {
              diagnostics.finished++;
              return previousFinish?.call(this,data);
            };
            diagnostics.pages.push({page,trialId:node.data.trial_id,choices:source.responses.flatMap(r=>r.choices)});
            installed++;
          }
          walk(procedure.timeline);
        }
      }
    }
    walk(timeline);
    diagnostics.installed = installed;
    if (installed !== 4) {
      diagnostics.lastProblem = `Se esperaban cuatro paginas de consentimiento; encontradas: ${installed}`;
      throw new Error(diagnostics.lastProblem);
    }
  }
  win.ValidacionConsentimiento = {install};
})(window,document);
