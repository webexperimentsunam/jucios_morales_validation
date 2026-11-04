/* Validacion - Bienvenida v7: ensayo jsPsych nativo, sin buscar botones de ExpBuilder. */
(function (win, doc) {
  'use strict';

  const diagnostics = {
    version: '7.0', mode: 'native-jspsych', installed: 0, started: 0,
    rendered: 0, clicks: 0, finished: 0, fallbacks: 0,
    nativeSearchRequired: false, lastProblem: null
  };
  win.ValidacionBienvenidaDiagnostics = diagnostics;

  const create = (tag, className, text) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function sourceFromVariables(variables) {
    const row = variables && variables[0];
    const components = row && Array.isArray(row.components) ? row.components : [];
    const images = components.filter(item => item.type === 'ImageComponent')
      .sort((a, b) => (a.coordinates?.x || 0) - (b.coordinates?.x || 0));
    const textComponent = components.find(item => item.type === 'TextComponent');
    const fullText = String(textComponent?.text || '');
    const lines = fullText.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const originalButton = (row?.response_components || [])
      .find(item => item.type === 'ButtonResponseComponent');
    if (images.length !== 3 || lines.length < 4 ||
        !originalButton || !originalButton.choices?.includes('Continuar')) {
      throw new Error('La definicion de Bienvenida no contiene sus tres logos, texto y Continuar.');
    }
    return { images, fullText, lines, originalButton };
  }

  function install(timeline) {
    let count = 0;
    function walk(nodes) {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node.timeline)) {
          for (const child of node.timeline) {
            if (!child || child.data?.trial_name !== 'Bienvenida') continue;
            const source = sourceFromVariables(node.timeline_variables);
            const previousFinish = child.on_finish;

            class BienvenidaPlugin {
              static info = {
                name: 'validacion-bienvenida', version: '7.0', parameters: {}
              };
              constructor(jsPsych) { this.jsPsych = jsPsych; }
              trial(displayElement) {
                diagnostics.started++;
                diagnostics.lastProblem = null;
                displayElement.innerHTML = '';
                const main = create('main');
                main.id = 'validacion-bienvenida';
                main.setAttribute('aria-label', 'Bienvenida al experimento');
                const card = create('article', 'vb-card');
                const header = create('header', 'vb-header', 'Universidad Nacional Autonoma de Mexico');
                // Mantener la ortografia y el texto institucional de la configuracion.
                header.textContent = 'Universidad Nacional Autónoma de México';
                const content = create('section', 'vb-main');
                const logos = create('div', 'vb-logos');
                const logoNames = ['UNAM', 'Facultad de Psicología', 'DEPI Psicología UNAM'];
                source.images.forEach((image, index) => {
                  const img = create('img', 'vb-logo');
                  img.src = image.stimulus;
                  img.alt = logoNames[index];
                  logos.append(img);
                });
                content.append(logos);
                content.append(create('h1', 'vb-title', source.lines[0]));
                if (source.lines[1]) content.append(create('p', 'vb-intro', source.lines[1]));
                if (source.lines[2]) content.append(create('p', 'vb-thanks', source.lines[2]));
                const researchers = create('div', 'vb-researchers');
                source.lines.slice(3).forEach(line => {
                  researchers.append(create('p', 'vb-researcher', line));
                });
                content.append(researchers);
                const footer = create('footer', 'vb-footer');
                const button = create('button', 'vb-next', 'Continuar');
                button.type = 'button';
                footer.append(button);
                card.append(header, content, footer);
                main.append(card);
                // Directamente en el display de jsPsych: no superponer el DOM anterior.
                displayElement.append(main);
                diagnostics.rendered++;
                const start = performance.now();
                let finished = false;
                button.addEventListener('click', () => {
                  if (finished) return;
                  finished = true;
                  diagnostics.clicks++;
                  button.disabled = true;
                  const rt = Math.max(0, Math.round(performance.now() - start));
                  // Claves historicas de ExpBuilder: el backend y los analisis
                  // siguen reconociendo el mismo nombre del componente/respuesta.
                  const output = { rt,
                    ButtonResponseComponent_1_type: 'ButtonResponseComponent',
                    ButtonResponseComponent_1_response: 'Continuar',
                    TextComponent_1_type: 'TextComponent',
                    TextComponent_1_text: source.fullText,
                    TextComponent_1_response: null
                  };
                  source.images.forEach((image, index) => {
                    const name = image.name || `ImageComponent_${index + 1}`;
                    output[`${name}_type`] = 'ImageComponent';
                    output[`${name}_stimulus`] = image.stimulus;
                  });
                  // on_finish de jsPsych del ensayo sigue llamando a la
                  // ramificacion original de ExpBuilder; on_data_update persiste.
                  this.jsPsych.finishTrial(output);
                });
              }
            }

            child.type = BienvenidaPlugin;
            // El plugin nativo obtiene los datos del trial original en el closure.
            // Ya no depende de timelineVariable('components') en ExpBuilder.
            delete child.components;
            delete child.response_components;
            child.on_finish = function (data) {
              diagnostics.finished++;
              return previousFinish?.call(this, data);
            };
            count++;
          }
          walk(node.timeline);
        }
      }
    }
    walk(timeline);
    diagnostics.installed = count;
    if (count !== 1) {
      diagnostics.lastProblem = 'Se esperaba exactamente un trial Bienvenida; encontrados: ' + count;
      throw new Error(diagnostics.lastProblem);
    }
  }
  win.ValidacionBienvenida = { install };
})(window, document);
