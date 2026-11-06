# Juicios Morales v13.8 — Evaluaciones verticales en orden fijo

## Base
Se tomó el proyecto completo **v13.7**, cuya combinación de almacenamiento local (IndexedDB activado) y metadatos de Firebase (`useIndexedDB=false`) permitió, en las pruebas del investigador, guardar archivos parciales en Drive y reanudar sesiones.

## Cambios únicos de esta versión
- `evaluacion.css`: las cuatro escalas aparecen siempre en **una columna**, también en escritorio. Cada escala conserva sus **nueve botones en una fila** horizontal.
- `evaluacion.js`: habilitación secuencial obligatoria: Moralidad → Competencia → Informatividad → Credibilidad. Las escalas 2-4 se activan después de contestar la inmediatamente anterior; un participante puede corregir una respuesta previamente elegida.
- `index.html`: nuevas referencias `evaluacion.css?v=13.8` y `evaluacion.js?v=13.8` para evitar caché. `experiment.js?v=13.7` permanece igual.
- El dato adicional `je_layout` ahora registra `v13.8_columna`. Las claves originales de respuesta (Moralidad_response, Competencia_response, Informatividad_response, Credibilidad_response y, en práctica, Informatividad_copy_response) no cambian.

**No se modificaron** `experiment.js`, su identificador de estudio, la nomenclatura, `batchSize = 1`, IndexedDB, el valor de `useIndexedDB` comunicado a Firebase, el tiempo de espera, las nueve listas de estímulos, la cantidad de ensayos, la aleatorización, los textos de consentimiento o los demás archivos.

## Instalación
En GitHub `webexperimentsunam/jucios_morales_validation`, reemplaza **solo** estos tres archivos de la raíz con los del parche:
1. `index.html`
2. `evaluacion.js`
3. `evaluacion.css`

No vuelvas a subir `experiment.js`, ni carpetas `data/`, `img/`. La versión de lógica de guardado seguirá reportándose como **v13.7**, porque no se ha cambiado.

## Verificaciones locales
- Sintaxis JavaScript correcta mediante `node --check`.
- Pruebas con DOM simulado para práctica y evaluación principal: 4 escalas, orden de activación, valores registrados y esquema original.
- Verificación de CSS para una columna, y de referencias de scripts en HTML.
- Comparación SHA-256 de `experiment.js` y de los 9 JSON de estímulos con v13.7: idénticos.
- No se pudo realizar captura funcional con Chromium en este entorno por una restricción del navegador. La apariencia y la conexión real deben probarse en el sitio publicado.

## Pruebas recomendadas
1. Abrir `?prueba=3` en computadora: comprobar cuatro escalas apiladas y orden de activación.
2. Elegir los extremos y puntos medios en las cuatro escalas, comprobar que `Siguiente` funciona.
3. Repetir en celular (320-390 px) y comprobar que los 9 valores de cada escala siguen en una fila.
4. Abandonar, revisar el archivo parcial de Drive y reanudar hasta finalizar.
5. Probar comenzar una sesión nueva y verificar conservación de la anterior.
6. Verificar las columnas del CSV contra la versión v13.7.

## Reanudación: duración
El código de v13.7 usa `resumeTimeoutMinutes=1` para metadatos del servidor, **no** como caducidad de la copia local. `TrialDB.TTL_DAYS=3` limpia registros antiguos de sesiones distintas, pero excluye expresamente el identificador de sesión actualmente recuperable. Esto no garantiza recuperación indefinida: depende del navegador, almacenamiento local, posibles restricciones del servidor y borrado de datos del sitio. Probar reanudación después de un día antes de anunciar plazos a participantes.
