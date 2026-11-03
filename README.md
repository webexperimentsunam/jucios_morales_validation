# Validación de materiales — reconstrucción independiente

Sitio estático para GitHub Pages. Reconstruido a partir de `F_Validacion-backup.zip` y del código publicado del experimento de referencia. **No incluye las nueve sesiones previas**, y no requiere el plugin visual `jspsych-expbuilder-plugin-dynamic`.

## Contenido y equivalencia

- jsPsych 8.2.2 (CDN) y plugin propio `screen-plugin.js` con formularios, navegación y escalas accesibles.
- Consentimiento en cuatro páginas, con acciones de continuar, regresar, aceptar o rechazar.
- Cuestionario sociodemográfico con **las seis preguntas originales**; mantiene los nombres de las preguntas.
- Tres ensayos de práctica: origen `data/practice.json`.
- Cuatrocientas ochenta afirmaciones experimentales: origen `data/main.json`, mezcladas al azar por sesión.
- Cuatro escalas obligatorias por ensayo. Rangos originales: moralidad/competencia de −4 a 4; informatividad/credibilidad de 0 a 8. El participante debe mover cada control antes de seguir.
- Identificadores originales en los datos (`builder_id`, `loop_id`, `ID`, `ID_Asociado`, `Versión Final`, `Orden`, y nombres de las escalas). Conserva el alias `Informatividad_copy_response` de la cuarta escala de práctica y agrega `Credibilidad_response` para facilitar la interpretación.
- Los 5 archivos de imagen originales en `img/`.

**Nota experimental importante:** en la práctica el eje de competencia aparece `Incapaz — Capaz`, pero en la tarea principal el respaldo original dice `Capaz — Incapaz`. Esto se ha conservado literalmente. Revisa si esa inversión fue intencional antes de recopilar datos.

## Publicar

1. Haz una copia del repositorio antiguo si todavía necesitas el otro experimento.
2. Descomprime este ZIP y sube **los archivos de su interior** (no el ZIP) a la raíz del repositorio GitHub Pages. Deben quedar `index.html`, `styles.css`, `experiment.js`, `screen-plugin.js`, `storage.js`, `data/`, `img/`.
3. En GitHub: **Settings → Pages → Deploy from a branch → main → / (root)**.
4. Abre la URL y recarga forzando los archivos nuevos (`Ctrl+Shift+R`).
5. Revisa en móvil y escritorio, y realiza una sesión piloto antes de difundir el enlace.

No mezcles `responsive-layout.js` ni `experiment-theme.css` de las versiones anteriores. No forman parte de esta reconstrucción.

## Pruebas sin enviar datos a Firebase

Abre la URL publicada añadiendo:

`?demo=1&limit=2`

La prueba muestra las cuatro pantallas de consentimiento, el cuestionario, tres ensayos de práctica y **dos** enunciados de la tarea principal, sin crear una sesión remota ni enviar respuestas. Aparecerá una barra marrón de «MODO DE PRUEBA». La copia local se puede descargar al finalizar. Para una sesión real, abre la URL sin esos parámetros.

## Dónde y cómo se guardan los datos

Al hacer clic en «Acepto participar», la aplicación solicita una sesión en el endpoint que ya utilizaba el código original:

- `POST https://us-central1-test-e4cf9.cloudfunctions.net/apiData` con `experimentID`, `sessionId`, `uid` y `batchSize: 0`.
- Actualización de estado en Firebase Realtime Database, ruta `sessions/<experimentID>/<sessionId>`.
- Cada pantalla terminada añade un registro a una **copia local de IndexedDB** (nombre `validacion-rebuild-v1`). Si el navegador se cierra, al abrirlo de nuevo se ofrece reanudar o exportar un respaldo.
- Al finalizar, se envían los registros como `trialsData` a `POST https://us-central1-test-e4cf9.cloudfunctions.net/apiDataComplete` con `storage: 'googledrive'`, exactamente el mecanismo de almacenamiento del experimento publicado previamente.
- **El sistema solo muestra guardado confirmado cuando esa API devuelve éxito**. Si falla, ofrece reintentar y descargar copia JSON. Se conservan los datos locales hasta que el servidor confirma.

No se incrusta ninguna clave privada de Google Drive en GitHub Pages; su conexión debe estar autorizada en el backend existente. La configuración pública de Firebase y el UID fueron recuperados del experimento publicado, pero **copiar los archivos no garantiza permisos**. Los estados de Firebase Realtime Database y el archivo final de Google Drive deben confirmarse en una sesión piloto real.

El navegador privado/incógnito puede borrar la copia local al cerrar sus ventanas. La recuperación solo funciona en el mismo navegador y perfil. No uses un navegador privado para una sesión larga hasta haber comprobado el envío final.

## Comprobación de la sesión piloto real

1. Haz una sesión completa desde el enlace sin `demo=1`.
2. En la consola ejecuta `window.ValidacionDiagnostics` para revisar el estado del guardado; no compartas públicamente datos de participantes.
3. Debe aparecer una solicitud exitosa a `apiData` y otra a `apiDataComplete` al finalizar.
4. Confirma que en Google Drive apareció el archivo de la sesión, que contiene registros de las 480 afirmaciones, tres ensayos y las pantallas introductorias (aproximadamente 494 filas en un recorrido sin regresos).
5. Confirma que los cuatro valores por afirmación, el identificador del estímulo y el identificador de la sesión no son nulos.
6. Confirma en Firebase que la sesión figura como completada. Si las reglas de Realtime Database impiden registrar estado, revisa los permisos **en el backend**, no publiques reglas de lectura/escritura abiertas.
7. Comprueba que la aplicación puede recuperar una sesión parcialmente completada tras recargar.

## Revisión científica/ética antes de reclutar

- El consentimiento original contiene los marcadores **`[Investigador/a responsable]`** y **`[correo institucional]`**. Debes sustituirlos por datos reales y revisar el texto, incluyendo la referencia a copias firmadas para una aplicación en línea.
- El consentimiento declara una duración aproximada de 30–45 minutos, aunque la tarea contiene 480 afirmaciones con cuatro respuestas cada una. Verifica empíricamente esa duración.
- Las respuestas del cuestionario sociodemográfico incluyen fecha de nacimiento. Verifica la necesidad de ese dato, las autorizaciones y el acceso restringido en Google Drive.
- Revisa especialmente la inversión semántica del eje Competencia mencionada arriba.

## Archivos

- `index.html`: HTML básico y carga de scripts.
- `styles.css`: diseño responsive sin posiciones absolutas.
- `screen-plugin.js`: plugin jsPsych con las pantallas, escalas, consentimiento y cuestionario.
- `experiment.js`: secuencia de ensayos, aleatorización y lógica de reanudación.
- `storage.js`: IndexedDB, Firebase Realtime Database y API de Google Drive.
- `data/definition.json`: textos originales, componentes, preguntas, etiquetas e IDs.
- `data/practice.json`: tres afirmaciones de práctica.
- `data/main.json`: 480 afirmaciones principales, con IDs y columna Orden.
- `img/`: logotipos e imágenes originales.

## Alcance de las pruebas realizadas

Se verificó con Node la sintaxis de los tres archivos JavaScript. Pruebas locales con un **motor jsPsych simulado** recorrieron todo el experimento (494 registros sin regresos), comprobaron los nombres de las cuatro respuestas, la validación de escalas, la apariencia a 320 y 1440 px y la solicitud a una **API simulada**. No se pudo ejecutar una sesión completa con la CDN real de jsPsych ni confirmar escrituras reales en Google Drive desde este entorno. Se requiere la sesión piloto descrita arriba.
