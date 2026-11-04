# Juicios morales — v12: evaluación adaptativa y verificación de guardado

Esta versión parte de la **v11**, que ya utiliza el identificador del experimento `jucios_morales_validation` y guarda el cuestionario mediante un plugin nativo de jsPsych.

## Instalar sobre la v11

En la raíz del repositorio GitHub Pages:

- Reemplazar: `index.html`, `experiment.js`.
- Agregar: `evaluacion.js`, `evaluacion.css`.
- Conservar sin cambios: `bienvenida.js/.css`, `consentimiento.js/.css`, `pantallas.js/.css`, `survey.js/.css`, `data/`, `img/`, `.nojekyll`.

Para recorrer el experimento corto:

`https://webexperimentsunam.github.io/jucios_morales_validation/?prueba=3`

La URL sin `?prueba=3` conserva el bloque principal completo.

## Qué modifica la interfaz

- Los 3 ensayos de práctica (`Ensayo`) y la evaluación principal (`Behavioral Statements`) se dibujan mediante un plugin nativo de jsPsych, con 4 escalas en dos columnas en escritorio y una columna en móvil.
- En cada juicio se mantienen el texto literal, las 4 dimensiones y sus límites: Moralidad/Competencia de **−4 a +4**; Informatividad/Credibilidad de **0 a 8**.
- El control comienza visualmente en el punto medio, pero **no se considera respondido hasta que se mueve** (como `require_movement: true` en la configuración original).
- La tarea no avanza mientras falte una escala. `Siguiente` termina el ensayo y activa la navegación original.
- La práctica registra Credibilidad bajo el nombre histórico **`Informatividad_copy_response`**; la evaluación principal usa **`Credibilidad_response`**. No se cambió ese nombre para evitar incompatibilidad con datos existentes.
- En la **práctica**, Competencia se presenta `Incapaz → Capaz`; en el **bloque principal**, `Capaz → Incapaz`. Es así en los estímulos originales. **No fue corregido automáticamente** para evitar alterar la codificación: revisar su implicación metodológica antes de reclutar.
- Los valores guardados son números enteros y se conservan los campos `*_type`, `*_response`, `*_slider_start`, `*_coordinates`, `*_size` y `ButtonResponseComponent_1_response` del esquema original. El campo `trial_type` identifica ahora al plugin nativo de jsPsych.
- No cambia la selección de participantes, las listas de estímulos, el mecanismo de aleatorización ni el flujo de navegación. En la prueba corta se mantienen 3 ensayos de práctica y 3 principales.

## Persistencia y abandono

- En cada ensayo, IndexedDB conserva un registro local y el cliente intenta un envío individual a `apiData` y otro a Firebase Realtime Database. **La confirmación de `apiData` no demuestra que Google Drive haya generado el CSV**: el archivo final normalmente se envía con `apiDataComplete` al finalizar.
- Esta versión añade `window.JuiciosVerificacionRemota.verificar()`, que intenta **leer nuevamente** el último checkpoint de la sesión desde el mismo navegador. No requiere entrar a Firebase Console ni cambia permisos.
- Si la lectura funciona, el resultado tendrá `estado: 'lectura_remota_verificada'`. Si no hay permisos de lectura, aparecerá `lectura_no_disponible`: **esto no prueba pérdida de datos**; solo impide la auditoría desde el cliente.
- **Si la persona cierra antes de terminar y no hay una escritura remota comprobada, no se puede garantizar recuperar su información**. `IndexedDB` es local y puede perderse por borrado de datos, cambio de dispositivo o cierre de incógnito. `apiDataComplete` solo se ejecuta al terminar.
- El respaldo manual se puede descargar desde la consola con `await window.JuiciosVerificacionRemota.exportarRespaldo()`. Contiene respuestas de la sesión y debe resguardarse privadamente.
- Para almacenamiento central recuperable de abandonos sin depender de las reglas Firebase de un proyecto ajeno, la próxima opción técnica es un endpoint propio (por ejemplo **Cloudflare Workers + D1**) que almacene cada ensayo usando claves `sessionId + trialId` y permita exportación controlada por el investigador. **Ese endpoint aún NO está instalado**.

## Pasos para probar SIN Firebase Console

1. Publicar v12, abrir `?prueba=3` en incógnito y responder el Survey y al menos dos juicios.
2. En F12 → Console ejecutar:
   - `window.JuiciosEvaluacionDiagnostics` — verifica `installed: 2`, práctica/principal `rendered` y `submitted`.
   - `await window.JuiciosVerificacionRemota.estado()` — recuentos locales, confirmaciones API/Firebase.
   - `await window.JuiciosVerificacionRemota.verificar()` — si hay permisos de lectura, verifica que Firebase devuelve el último checkpoint.
3. **Antes de cerrar**, si se está probando abandono, descargar una copia local con `await window.JuiciosVerificacionRemota.exportarRespaldo()`.
4. Terminar una segunda sesión piloto y confirmar que el archivo final corresponde al ID de `jucios_morales_validation` y contiene los cuatro valores de las escalas.
5. No comenzar la recopilación real hasta verificar rutas, escalas invertidas y disponibilidad de las sesiones incompletas.

## Verificaciones realizadas

- Sintaxis JavaScript con `node --check`.
- Pruebas de navegador con controles simulados en anchos de **320, 375, 768, 1024, 1440, 1920 y 2560 px** para ambos tipos de ensayo: 4 sliders, bloqueo por falta de respuesta, valores numéricos, nombre histórico de Credibilidad de práctica, callback original de finalización, sin desbordamiento horizontal.
- Se revisaron las **480 filas** de estímulos principales y las **3 filas** de práctica: etiquetas y nombres de controles compatibles con el plugin.
- **No** se ha ejecutado un ensayo real completo desde GitHub Pages, ni una lectura remota en Firebase, ni una restauración de una sesión abandonada. Las pruebas con controles simulados no reemplazan las pruebas reales.
