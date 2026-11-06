# Juicios Morales v13.3 — nomenclatura desde el experimento de referencia

Esta versión se creó a partir de v13.2 (sin IndexedDB) y del archivo `index (1)(1).html` del experimento de un ensayo.

## Cambios aplicados
- `BATCH_CONFIG`: **size 1**, **useIndexedDB false** y **resumeTimeoutMinutes 1**, sin alterar los valores de v13.2.
- Nombre de sesión: **contador (3 dígitos) + fecha (YYYY-MM-DD) + hora (HH-mm-ss) + Validation_Jucios_Morales**, unidos por guiones bajos. Por ejemplo: `007_2026-11-05_18-03-42_Validation_Jucios_Morales`.
- En modo `?prueba=3`, el nombre lleva el prefijo `PRUEBA3-` para separar pruebas de sesiones reales.
- Se espera la respuesta HTTP de `updateSessionName` antes de comenzar los ensayos, y un diagnóstico muestra si la actualización fue aceptada por la API.
- Conservado el `sessionId` UUID invariable. **El nombre generado no sustituye el ID de sesión ni garantiza el nombre final del archivo de Google Drive** hasta comprobar el backend real.
- Guardado incremental y envío final a `apiDataComplete` conservados desde v13.2. No se trasladó el `on_finish` del experimento de un ensayo.
- `index.html` apunta a `experiment.js?v=13.3` para refrescar la caché del navegador.

## Publicación
Con v13.2 ya publicada, reemplaza `experiment.js` e `index.html`. No cambies `data/`, `img/` ni los archivos de diseño. No subas el HTML de referencia: es un experimento distinto de un solo ensayo.

## Comprobación
Abre una ventana de incógnito **nueva**, `?prueba=3`, y consulta:

```js
window.ValidacionBatchDiagnostics
window.ValidacionBatchDiagnostics.sessionNameConfig
window.ValidacionBatchDiagnostics.sessionNameState
```

Valores esperados: `batchSize: 1`, `useIndexedDB: false`, `resumeTimeoutMinutes: 1`. En `sessionNameState`, `expected` contiene el nombre generado y `confirmed` indica si la API respondió sin error; esto no verifica por sí solo que Drive haya renombrado el archivo. Completa una sesión de prueba para validar el resultado en Drive y las respuestas por ensayo.

## Precauciones
Sin IndexedDB, las respuestas no confirmadas se conservan **solo en memoria** durante la sesión. Si se cierra o recarga la página, esas respuestas pueden perderse. El timeout de un minuto es un parámetro transmitido al backend, no un cierre automático de la pestaña. No utilizar con participantes reales sin verificar la recuperación de abandonos.
