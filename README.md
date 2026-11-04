# Juicios Morales v13 — instrucciones y escalas discretas (sin modificar las listas)

Basado exactamente en la versión v12. Se mantiene el experimento completo, incluidas las **9 listas JSON originales** (480 registros), sus tamaños, distribución de estímulos, selección y aleatorización. La versión de prueba `?prueba=3` permanece disponible.

## Cambios

- **Competencia:** en la evaluación principal, el programa muestra `−4 = Incapaz` y `+4 = Capaz`, igual que en la práctica. La corrección se aplica exclusivamente a la representación en pantalla y a los campos de etiqueta visible del ensayo registrado: **no cambia ni reescribe las listas**. El registro marca `je_competencia_fuente` para auditoría.
- **Las cuatro dimensiones:** en lugar de deslizadores se utilizan **nueve opciones discretas** con valores enteros, inicialmente sin ninguna selección. Se permiten los valores centrales (0 y 4) sin necesidad de mover un deslizador. Los controles son accesibles con ratón, pantalla táctil y teclado.
- **Instrucciones:** se elimina la referencia a "estar de acuerdo" y la exigencia de responder rápidamente. Se explican explícitamente el significado y la dirección de las cuatro escalas. Cada afirmación se valora de forma independiente.
- **Compatibilidad de datos:** se mantienen las variables `Moralidad_response`, `Competencia_response`, `Informatividad_response` y `Credibilidad_response` (en práctica la última es `Informatividad_copy_response`, como en la v12), y el botón `Siguiente`. Por compatibilidad se conserva el nombre histórico `SliderResponseComponent` en los metadatos, aunque ahora se ven botones discretos; los campos `je_response_widget: radio9` y `je_layout: v13` lo documentan.
- La persistencia a IndexedDB, `apiData`, Firebase y el guardado final en Google Drive se mantiene igual a v12. **No se ha confirmado aún que los datos incompletos sean recuperables en Google Drive**.

## Instalación sobre v12

Sustituir únicamente estos cuatro archivos en la raíz del repositorio: `index.html`, `experiment.js`, `evaluacion.js` y `evaluacion.css`.

**No subir ni editar la carpeta `data/`, ni ninguna otra carpeta.**

## Verificaciones previas a la recolección

Ejecutar `?prueba=3`. Comprobar las instrucciones, la dirección de Competencia (práctica y principal), el registro del valor 0, bloqueo de ensayos incompletos, transición y persistencia final. Los datos de la tarea principal recogidos en versiones anteriores con extremos invertidos pueden requerir recodificación `competencia_corregida = -competencia_anterior`; documentar cualquier cambio antes de combinar conjuntos.


## v13.1 — mejora para celular de las escalas discretas

- Se corrigió el CSS de `.je-options` para que **las nueve categorías estén siempre en una sola fila**, ordenadas de izquierda a derecha. La versión v13 ponía tres columnas en pantallas de menos de 480 px, confundiendo la polaridad de la escala.
- Se redujeron discretamente las separaciones y la tipografía de los botones en móviles de 320 px, manteniendo botones de 46 px de alto.
- **Único archivo modificado:** `evaluacion.css`. No se modifica `evaluacion.js`, `experiment.js`, los archivos `data/`, el orden de estímulos ni la lógica de guardado.
- Para instalar sobre v13, reemplaza exclusivamente `evaluacion.css` en la raíz del repositorio. Forzar recarga o abrir en incógnito para evitar caché.
