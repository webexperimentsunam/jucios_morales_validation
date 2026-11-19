# Validación — diagnóstico v14.1

Paquete de **dos archivos** para sustituir en la raíz de GitHub Pages: `index.html` y `experiment.js`.

Corrige la URL del JavaScript para evitar reutilización del caché de `v14.0-control-nombre`; conserva el flujo corregido de reentrada en sesiones expiradas o completadas. Permite consultar `window.ValidacionVersion` y `window.ValidacionEstadoExportacion` en la consola. El segundo objeto solo incluye estado, conteos, confirmaciones y `lastError`, sin IDs ni tokens. Un error de exportación sigue mostrando aviso de guardar/reintentar pero ya no bloquea la página con el error fatal global.

**No corrige fallos del backend** ni significa que Google Drive haya recibido los resultados. Antes de usarlo con participantes, comprobar `export.confirmed === true` y un archivo en Drive para distintas sesiones. No borrar IndexedDB ni los registros pendientes de sesiones anteriores.

Para verificar la versión, tras publicar ambos archivos y recargar, la consola debe mostrar `window.ValidacionVersion` = `v14.1-reentrada-diagnostico`. Si falla la exportación, revisar `window.ValidacionEstadoExportacion` y el error del servidor en el apartado `Respuesta` de `apiData` en Red/Network. No repetir las mismas pruebas con participantes reales.
