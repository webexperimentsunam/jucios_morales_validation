# Actualización de guardado v13.2 — sin IndexedDB

La carga de `index (2).html` del usuario se comparó byte por byte con `index.html` de v13.1: **son idénticos**. La configuración que funciona no venía incorporada a ese archivo; está en `experiment.js`.

## Cambios implementados

- `batchSize: 1` (ya estaba en v13.1, se conserva).
- `useIndexedDB: false` (no se accede a la API IndexedDB).
- `resumeTimeoutMinutes: 1` (se envía como metadato de la sesión al servidor; no instala un temporizador local de finalización).
- Cola en memoria con solicitudes seriales a `apiData`, un registro por ensayo, más el respaldo adicional Firebase existente si sus reglas permiten escribir.
- Guardado final: `apiDataComplete` recibe todos los registros conservados en la memoria de la sesión actual; ya no falla por intentar usar IndexedDB.
- Los envíos confirmados solo acreditan recepción de `apiData`, no persistencia inmediata en el CSV de Drive.
- Se rechaza la reanudación de una sesión previa en una nueva carga de página, puesto que no hay forma fiable de recuperar sus registros completos sin IndexedDB. Realizar pruebas en una ventana de incógnito nueva.
- `window.ValidacionBatchDiagnostics` expone `batchSize`, `useIndexedDB`, `resumeTimeoutMinutes`, `apiConfirmed`, `lastError` y `sessionNameConfig`.
- Sin modificación de estímulos, condiciones, ensayo de práctica, pantalla completa, ni formularios.

## Nombre de los participantes

El HTML adjunto **no contiene la nueva regla de nombres**: la carga se hace con `./experiment.js?v=13`, y el `experiment.js` disponible en v13.1 define `_SESSION_NAME_TOKENS = []`. Por seguridad no se ha inventado una convención nueva; el nombre de sesión sigue usando un UUID (prefijo `PRUEBA3-` en piloto). Para trasladar literalmente tu nueva convención, hace falta el `experiment.js` que realmente tiene esos cambios, o una descripción exacta de la convención.

## Publicar

Sube `experiment.js` e `index.html` a la raíz del repositorio. No reemplaces las listas ni el CSS. Entra en incógnito y abre la URL con `?prueba=3`.

En consola:

```js
window.ValidacionBatchDiagnostics
```

Debe indicar `batchSize: 1`, `useIndexedDB: false`, `resumeTimeoutMinutes: 1`. Tras completar un ensayo, revisa `apiConfirmed` (confirmación de API, no aún Drive). Cierra y vuelve a abrir SOLO tras comprobar la exportación remota; de lo contrario se perderá el buffer en memoria.

**Aviso importante:** desactivar IndexedDB significa perder la copia durable en el navegador. Si hay fallo de red, cierre o recarga, una respuesta aún no confirmada podría perderse. No lo uses en producción hasta confirmar las escrituras remotas, preferentemente con el respaldo de Cloudflare planificado. El timeout de un minuto es un dato para el servidor, no una garantía de finalización automática.
