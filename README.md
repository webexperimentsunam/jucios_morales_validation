# Juicios Morales v13.5 — reanudacion local experimental

Base: v13.3 con escalas horizontales v13.1. Mantiene 9 JSON de estimulos sin cambiar.

## Cambios
- IndexedDB reactivado para guardar cada respuesta y su checkpoint de navegacion (3 dias de retencion local para sesiones antiguas).
- Guardado `apiData` por ensayo (`batchSize=1`) y `apiDataComplete` al finalizar, sin modificar el formato de salida ni los identificadores de sesion.
- Al regresar al mismo navegador se ofrece `Continuar donde me quede` cuando existe copia local y cursor valido, o `Empezar desde el principio` para crear un UUID nuevo.
- Si la sesion anterior es de v13.3, no tiene respuestas IndexedDB; solo puede comenzar de cero. No se eliminan sus registros enviados al servidor.
- No se mezclan sesiones piloto (`?prueba=3`) con sesiones reales.
- Al finalizar exitosamente se elimina exclusivamente la copia IndexedDB de la sesion terminada; no las de otras sesiones.
- El cursor de reanudacion se confirma despues de la transaccion de escritura local.
- Se conserva el nombre de sesion original cuando una persona reanuda.

## Instalacion
Reemplaza `index.html` y `experiment.js` en el repositorio GitHub Pages. No actualices el despliegue en produccion sin hacer primero pruebas con `?prueba=3`.

## Prueba sugerida
1. En el MISMO navegador, abre `?prueba=3` sin incognito; inicia una sesion nueva.
2. Completa al menos 1 ensayo, verifica `await window.JuiciosReanudacionDiagnostico.localRows()`.
3. Cierra la pestana. Vuelve a la misma URL y elige `Continuar donde me quede`.
4. Comprueba el siguiente ensayo, las respuestas finales y el numero de participante.
5. Cierra otra prueba y elige `Empezar desde el principio`; comprueba que cambia `sessionId` y comienza desde Bienvenida.
6. En otro navegador o dispositivo, no debe ofrecer reanudar esa sesion: comienza una sesion nueva.

## Advertencias
- Solo se puede reanudar en el mismo perfil y navegador mientras conserve IndexedDB/localStorage; no se almacenan cuentas ni contrasenas.
- La confirmacion local no demuestra que `apiData` guardo un ensayo. Comprobar `window.ValidacionBatchDiagnostics` durante pruebas con el servidor real.
- `resumeTimeoutMinutes=1` es una configuracion enviada a la API, no la caducidad local. El servidor puede imponer sus propias condiciones de reanudacion.
- IndexedDB no reemplaza un respaldo del servidor. Si el navegador borra sus datos locales, no se puede reconstruir el avance.
- Los tests locales no permiten verificar la autorizacion del backend Firebase o Google Drive.
