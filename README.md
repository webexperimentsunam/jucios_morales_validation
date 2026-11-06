# Juicios Morales v13.7 — reanudacion local + guardado remoto parcial

## Base y evidencia
Esta version es una modificacion MINIMA de la v13.5, no de la v13.6.
En las pruebas reales de la v13.5, 11 registros fueron confirmados por `apiData`,
pero no se genero un CSV parcial en Google Drive. Al modificar el campo
`useIndexedDB` de la sesion en Firebase a `false`, Drive genero el archivo
parcial. La persona despues pudo reanudar con IndexedDB y el guardado final
actualizo ese MISMO archivo.

## Cambios exclusivos
1. `BATCH_CONFIG.useIndexedDB = true`: conservar la base local y la reanudacion.
2. `FIREBASE_SESSION_USE_INDEXEDDB = false`: enviar ESTE valor en
   `sessionRef.update(...)` de Firebase, tambien al retomar una sesion.
3. Se incorpora `firebaseSessionUseIndexedDB` al diagnostico para distinguirlo
   de `useIndexedDB` (local). El codigo de ensayo lleva version v13.7.
4. `index.html` solicita `experiment.js?v=13.7` para evitar una copia cacheada.

NO se modificaron la API `apiData`, `apiDataComplete`, el tamano de lote (1),
el timeout (1 minuto), los nombres, las pantallas, los estimulos, las listas,
la aleatorizacion, ni la logica de continuar/empezar desde cero.

## Instalacion
Instala sobre la v13.5 reemplazando SOLO `index.html` y `experiment.js` en
GitHub Pages. **No instales v13.6 previamente**; se ignoro intencionalmente
esa rama de cambios. Conserva una copia del estado anterior.

## Verificacion en consola
Despues de cargar una sesion piloto (`?prueba=3`), ejecuta:

```js
const d = window.ValidacionBatchDiagnostics;
({ lote: d.batchSize, indexedDBLocal: d.useIndexedDB,
   indexedDBEnFirebase: d.firebaseSessionUseIndexedDB,
   timeout: d.resumeTimeoutMinutes,
   confirmados: d.apiConfirmed, error: d.lastError });
```

Esperado: `lote=1`, `indexedDBLocal=true`, `indexedDBEnFirebase=false`,
`timeout=1`. La confirmacion de `apiData` debe aumentar tras responder.

## Protocolo de prueba REAL
A. Sesion piloto: responder algunos ensayos, verificar envios y cerrar pestaña.
   Comprobar que aparece el CSV incompleto en Drive (podria tardar por la
   consolidacion del servidor), y que los datos esperados estan presentes.
B. Reabrir MISMO navegador, elegir `Continuar`, terminar y comprobar que
   el mismo archivo se actualiza sin duplicar respuestas.
C. Iniciar otra sesion piloto, abandonar, reabrir, elegir `Empezar desde el
   principio`. Comprobar que el archivo parcial anterior permanece y que
   la sesion nueva recibe otro identificador.
D. Abrir desde otro dispositivo: se inicia desde cero, sin cuentas.

La prueba anterior respalda el comportamiento, pero NO demuestra que todos los
abandonos futuros sean 100% recuperables; depende de disponibilidad de red,
reglas y operaciones del servidor externo. No cambiar permisos ni metadatos
con datos reales sin autorizacion institucional.
