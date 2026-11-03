/* Correccion de escala de ExpBuilder: no modifica ensayos, condiciones ni respuestas. */
(function (global) {
  'use strict';

  const baseline = new WeakMap();
  const getWidth = () => Math.max(320, global.innerWidth || 1024);
  const pxToVw = (px, width) => (px * 100) / width;
  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

  // El plugin ExpBuilder usa porcentajes del ancho del viewport en sus campos *_vw.
  // Mantiene el tamanio legible en moviles y evita que aumente sin limite en escritorio.
  function scaleComponent(component) {
    if (!component || typeof component !== 'object') return;
    if (!baseline.has(component)) {
      baseline.set(component, {
        font: component._font_size_runtime_vw,
        buttonFont: component._button_font_size_runtime_vw,
        width: component.width,
        height: component.height,
        x: component.coordinates && component.coordinates.x
      });
    }
    const base = baseline.get(component);
    const width = getWidth();
    const mobile = width < 600;

    if (typeof base.font === 'number' && Number.isFinite(base.font)) {
      // Titulos y texto corriente conservan jerarquia tipografica.
      const heading = base.font >= 3;
      const minimum = heading ? 17 : (base.font >= 2.5 ? 15 : 13);
      const maximum = heading ? (base.font >= 4 ? 40 : 33) : (base.font >= 2.5 ? 28 : 23);
      component._font_size_runtime_vw = pxToVw(clamp(base.font * width / 100, minimum, maximum), width);
    }
    if (typeof base.buttonFont === 'number' && Number.isFinite(base.buttonFont)) {
      const minimum = mobile ? 14 : 14;
      component._button_font_size_runtime_vw = pxToVw(
        clamp(base.buttonFont * width / 100, minimum, 24), width
      );
    }
    if (component.type === 'ButtonResponseComponent') {
      // El ancho y la altura de los botones tambien proceden de la anchura visual.
      // No acortar ni recortar el texto de 'Continuar' en un movil.
      const minWidth = (component.choices || []).some(
        choice => String(choice).length > 15
      ) ? 165 : 112;
      const originalWidth = typeof base.width === 'number' ? base.width * width / 100 : minWidth;
      const originalHeight = typeof base.height === 'number' ? base.height * width / 100 : 42;
      component.width = pxToVw(clamp(originalWidth, minWidth, 210), width);
      component.height = pxToVw(clamp(originalHeight, 38, 56), width);
      if (component.coordinates && typeof base.x === 'number') {
        const widthPct = component.width;
        const minCenter = widthPct / 2 + 6;
        const maxCenter = 100 - minCenter;
        component.coordinates.x = 2 * clamp((base.x + 100) / 2, minCenter, maxCenter) - 100;
      }
    }
    if (component.type === 'ImageComponent') {
      // Limitar los logos y otras imagenes en pantallas enormes sin recortar imagenes.
      if (typeof base.width === 'number' && Number.isFinite(base.width)) {
        component.width = pxToVw(Math.min(base.width * width / 100, 185), width);
      }
      if (typeof base.height === 'number' && Number.isFinite(base.height)) {
        component.height = pxToVw(Math.min(base.height * width / 100, 210), width);
      }
    }
  }

  // El plugin usa timeline_variables (objetos) para los estimulos, asi que podemos
  // ajustar componentes existentes sin tocar el flujo experimental.
  function eachNode(nodes, fn) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node.timeline_variables)) {
        for (const variable of node.timeline_variables) {
          if (!variable || typeof variable !== 'object') continue;
          for (const component of variable.components || []) fn(component);
          for (const component of variable.response_components || []) fn(component);
        }
      }
      if (Array.isArray(node.timeline)) eachNode(node.timeline, fn);
    }
  }

  function install(timeline) {
    eachNode(timeline, scaleComponent);
    // Se recalcula antes de cada ensayo, tambien si el participante giro el movil.
    function wrap(nodes) {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;
        if (node.type === global.DynamicPlugin) {
          const originalStart = node.on_start;
          node.on_start = function (trial) {
            if (typeof originalStart === 'function') originalStart.call(this, trial);
            for (const component of trial.components || []) scaleComponent(component);
            for (const component of trial.response_components || []) scaleComponent(component);
          };
        }
        if (Array.isArray(node.timeline)) wrap(node.timeline);
      }
    }
    wrap(timeline);
    // Actualiza las definiciones para futuros ensayos cuando cambie el ancho.
    global.addEventListener('resize', () => eachNode(timeline, scaleComponent), { passive:true });
  }

  global.ExpBuilderResponsive = { install, scaleComponent };
})(window);
