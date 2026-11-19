# Validación — adaptación de almacenamiento al protocolo de sesiones v3 de ExpBuilder

## Qué se modificó

- `experiment.js`: ahora usa el ciclo de vida oficial del `index.html` proporcionado por el desarrollador (acciones `createSession`, `resumeSession`, `activateConnection`, `appendEvents`, `completeSession`, consulta de estado, recuperación y acuse de exportación a Drive).
- `index.html`: actualiza únicamente la referencia a `jspsych-expbuilder-plugin-dynamic@1.1.0` y al `experiment.js` nuevo.
- Se conserva la tarea experimental original (cuestionarios, navegación, tres ensayos de práctica, 480 principales, cuatro escalas, etiquetas y aleatorización). Las nueve listas `data/` y todas las imágenes y módulos visuales son idénticos a los adjuntos.
- `?prueba=3` limita a tres ensayos principales y etiqueta los registros de prueba; **sigue enviando a la API real**. Use sesiones piloto con navegador/perfil separado.

## Qué cambia en el guardado

- El plazo de reanudación lo establece el **backend** por estudio en `configuration.batchConfig.resumeTimeoutMinutes` (por ejemplo, 1 minuto). No se define con un temporizador local del HTML.
- La API decide si se puede reanudar (`resume_allowed`) o si la sesión ya expiró/finalizó. Un HTTP 409 de una petición antigua no equivale a un éxito; no se trata automáticamente como guardado confirmado.
- IndexedDB funciona como copia de eventos y cursors de recuperación, y se mantiene el esquema `trials-v1` de este ID de experimento, migrado a versión 3 con `eventId`, `sequence` y acuses.
- Los ensayos se envían en lotes cuando los datos locales están persistidos; se reciben acuses para cada evento. El cierre usa `completeSession` y espera confirmación de exportación. **No** se llama a `apiDataComplete`.
- Una sesión expirada se considera terminada; no se reabre por tener datos en IndexedDB. Los eventos pendientes se intentan recuperar hacia la sesión original, no se mezclan con una nueva.

## Publicación

1. Hacer copia del repositorio actualmente publicado y exportar los registros locales pendientes de pruebas anteriores si los hubiera.
2. Subir **todos los archivos del ZIP** a la raíz del repositorio para asegurar coherencia. También se puede reemplazar solamente `index.html` y `experiment.js` si el resto coincide exactamente con la entrega adjunta.
3. Recargar sin caché o probar en ventana privada nueva. No borrar manualmente IndexedDB si contiene datos sin enviar.
4. Usar `?prueba=3` para las pruebas con la API real; luego ejecutar una sesión de producción de extremo a extremo.

## Validaciones necesarias en el servidor real

- Comprobar que `/apiData` reconoce este experimentID y habilita `sessionProtocolVersion: 3`; el archivo solo **no** permite modificar configuraciones del proyecto en Firebase.
- Confirmar los valores reales de `batchSize`, `useIndexedDB` y `resumeTimeoutMinutes` devueltos por `createSession`.
- Probar abandono y regreso antes del plazo: misma sesión, mismo orden, sin registros duplicados.
- Probar regreso después del plazo: sesión anterior exportada a Drive; nuevo `sessionId` para seguir participando; recuperar pendientes si los hay.
- Verificar en Google Drive tanto el archivo parcial como el completo, número de eventos, CSV y ausencia de duplicados.
- Verificar el comportamiento para cortes de red y dos pestañas, que son casos en los que un `409` puede ser una respuesta deliberada de conflicto.

## Limitaciones

La nueva implementación se validó por comparación estructural y sintaxis JavaScript. No se han ejecutado escrituras reales en Firebase o Drive ni una sesión real usando el plugin remoto. El código de la nueva API se ha trasplantado fielmente del `index.html` adjunto; su política de expiración y permisos reside en el backend.

**Precaución sobre sesiones previas:** `experiment.js` v13.8 utilizaba un protocolo anterior en el mismo ID de estudio. El SDK nuevo puede actualizar el esquema IndexedDB existente, pero no garantiza que el servidor permita reanudar sesiones que ya fueron expiradas o completadas. No borrar las respuestas locales antiguas sin respaldo y confirmación de exportación.

## Interpretación del HTTP 409

`409 Conflict` indica que el servidor considera incompatible la operación con el estado de la sesión. **No prueba por sí solo** que falten datos o que se hayan guardado. Para precisar la causa, en Herramientas del desarrollador → Network → seleccionar la petición `/apiData` con 409 → revisar `Request Payload` (`action`) y `Response`. No publicar el `writeToken`, `sessionId` ni las respuestas de participantes. El protocolo v3 contempla el bloqueo de escrituras en sesiones expiradas/finalizadas y en conexiones no vigentes; la respuesta exacta debe interpretarse a partir de su cuerpo.

`storage.js`, `screen-plugin.js` y algunos archivos del directorio proceden de variantes anteriores y se conservan como parte del respaldo. El `index.html` incluido **no carga `storage.js`**: el guardado efectivo está en `experiment.js`.
