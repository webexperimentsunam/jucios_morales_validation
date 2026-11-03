/*
  Escalado uniforme tipo "lienzo fijo" para experimentos de ExpBuilder/jsPsych.
  - Toma 1920x1080 como tamano de referencia.
  - Convierte medidas inline en vw/vh a px de referencia.
  - Escala todo el contenido como una sola imagen manteniendo proporciones.
  - No modifica la logica experimental ni el guardado de datos.
*/
(function (global, document) {
  'use strict';

  const BASE_W = 1920;
  const BASE_H = 1080;
  const SHELL_ID = 'expbuilder-fixed-shell';
  const STAGE_ID = 'expbuilder-fixed-stage';
  const MANAGED_ATTR = 'data-expbuilder-stage-managed';
  const ORIGINAL_STYLE_ATTR = 'data-expbuilder-original-style';

  function ensureBaseStyles() {
    if (document.getElementById('expbuilder-fixed-scale-styles')) return;
    const style = document.createElement('style');
    style.id = 'expbuilder-fixed-scale-styles';
    style.textContent = `
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ffffff;
      }
      body.jspsych-display-element {
        min-height: 100vh;
        min-height: 100dvh;
      }
      #${SHELL_ID} {
        position: fixed;
        inset: 0;
        overflow: hidden;
        background: transparent;
        z-index: 0;
      }
      #${STAGE_ID} {
        position: absolute;
        left: 0;
        top: 0;
        width: ${BASE_W}px;
        height: ${BASE_H}px;
        transform-origin: top left;
        overflow: hidden;
        background: transparent;
      }
      #${STAGE_ID} .jspsych-content,
      #${STAGE_ID} .jspsych-display-element,
      #${STAGE_ID} .jspsych-content-wrapper {
        max-width: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureShell() {
    ensureBaseStyles();
    let shell = document.getElementById(SHELL_ID);
    let stage = document.getElementById(STAGE_ID);
    if (!shell) {
      shell = document.createElement('div');
      shell.id = SHELL_ID;
      stage = document.createElement('div');
      stage.id = STAGE_ID;
      shell.appendChild(stage);
      document.body.appendChild(shell);
    }
    if (!stage) {
      stage = document.createElement('div');
      stage.id = STAGE_ID;
      shell.appendChild(stage);
    }
    return { shell, stage };
  }

  function convertUnits(styleText) {
    if (!styleText || typeof styleText !== 'string') return styleText;
    return styleText
      .replace(/(-?\d*\.?\d+)vw/g, (_, n) => `${((parseFloat(n) / 100) * BASE_W).toFixed(3)}px`)
      .replace(/(-?\d*\.?\d+)vh/g, (_, n) => `${((parseFloat(n) / 100) * BASE_H).toFixed(3)}px`)
      .replace(/(-?\d*\.?\d+)vmin/g, (_, n) => {
        const base = Math.min(BASE_W, BASE_H);
        return `${((parseFloat(n) / 100) * base).toFixed(3)}px`;
      })
      .replace(/(-?\d*\.?\d+)vmax/g, (_, n) => {
        const base = Math.max(BASE_W, BASE_H);
        return `${((parseFloat(n) / 100) * base).toFixed(3)}px`;
      });
  }

  function convertNodeStyle(node) {
    if (!(node instanceof global.Element)) return;
    if (node.id === SHELL_ID || node.id === STAGE_ID) return;

    const original = node.getAttribute(ORIGINAL_STYLE_ATTR) ?? node.getAttribute('style');
    if (original != null && !node.hasAttribute(ORIGINAL_STYLE_ATTR)) {
      node.setAttribute(ORIGINAL_STYLE_ATTR, original);
    }
    if (original != null) {
      const converted = convertUnits(original);
      if (converted !== node.getAttribute('style')) node.setAttribute('style', converted);
    }

    if (node.tagName === 'STYLE' && !node.hasAttribute(ORIGINAL_STYLE_ATTR)) {
      const css = node.textContent || '';
      node.setAttribute(ORIGINAL_STYLE_ATTR, css);
      node.textContent = convertUnits(css);
    } else if (node.tagName === 'STYLE' && node.hasAttribute(ORIGINAL_STYLE_ATTR)) {
      node.textContent = convertUnits(node.getAttribute(ORIGINAL_STYLE_ATTR) || '');
    }
  }

  function convertTree(root) {
    if (!(root instanceof global.Node)) return;
    if (root.nodeType === global.Node.ELEMENT_NODE) convertNodeStyle(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach(convertNodeStyle);
      root.querySelectorAll('style').forEach(convertNodeStyle);
    }
  }

  function moveManagedNodesIntoStage() {
    const { stage } = ensureShell();
    const bodyChildren = Array.from(document.body.children);
    for (const child of bodyChildren) {
      if (child.id === SHELL_ID) continue;
      if (child.tagName === 'SCRIPT') continue;
      if (child.tagName === 'STYLE') continue;
      if (child.id === 'expbuilder-runtime-error') continue; // keep fatal overlay outside the stage
      if (!child.hasAttribute(MANAGED_ATTR)) child.setAttribute(MANAGED_ATTR, '1');
      stage.appendChild(child);
      convertTree(child);
    }
    // Ajusta tambien estilos dentro del propio stage (por si jsPsych reutiliza nodos).
    convertTree(stage);
  }

  function layoutStage() {
    const { stage } = ensureShell();
    const vw = Math.max(1, global.innerWidth || document.documentElement.clientWidth || BASE_W);
    const vh = Math.max(1, global.innerHeight || document.documentElement.clientHeight || BASE_H);
    const scale = Math.min(vw / BASE_W, vh / BASE_H);
    const offsetX = Math.max(0, (vw - BASE_W * scale) / 2);
    const offsetY = Math.max(0, (vh - BASE_H * scale) / 2);
    stage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  let observerStarted = false;
  function installFixedCanvas() {
    ensureShell();
    moveManagedNodesIntoStage();
    layoutStage();

    if (!observerStarted) {
      const observer = new MutationObserver(() => {
        moveManagedNodesIntoStage();
        layoutStage();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
      observerStarted = true;
      global.addEventListener('resize', layoutStage, { passive: true });
      global.addEventListener('orientationchange', layoutStage, { passive: true });
      document.addEventListener('fullscreenchange', layoutStage);
    }
  }

  // Mantener la API esperada por experiment.js, pero sin reescalar componente por componente.
  global.ExpBuilderResponsive = {
    install: function () {
      installFixedCanvas();
    },
    relayout: layoutStage,
    convertTree,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installFixedCanvas, { once: true });
  } else {
    installFixedCanvas();
  }
})(window, document);
