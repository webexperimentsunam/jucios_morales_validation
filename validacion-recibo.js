/* Adaptador de constancia para la interfaz de exito ORIGINAL de ExpBuilder.
 * No reemplaza funciones del motor ni su flujo de guardado.
 * Solo presenta el folio cuando el motor dibuja su propia pantalla de exito. */
(function(win, doc) {
  'use strict';
  let shown=false;
  function check() {
    if (shown) return;
    const node=doc.getElementById('jspsych-loading-overlay');
    if (!node || !node.textContent.includes('Experiment complete. Thank you!')) return;
    const session=win.ValidacionGrupoActual;
    if (!session || session.modalidad !== 'estudiante') return;
    shown=true;
    try { win.ValidacionGrupos.showReceipt(node,session.sessionId); }
    catch(error) { console.error('No fue posible mostrar el folio, sin afectar la exportación.', error); }
  }
  const observer=new MutationObserver(check);
  observer.observe(doc.documentElement,{childList:true,subtree:true});
  doc.addEventListener('DOMContentLoaded',check);
})(window,document);
