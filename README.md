# Validación v18 — reconstruida sobre el HTML original de ExpBuilder

## Propósito

La versión original de ExpBuilder exporta correctamente; las adaptaciones anteriores de Validación devolvían `export.status = needs_attention` con `lastError = Storage credentials require attention`. Este paquete es un **nuevo ensayo de integración** para aislar la diferencia. **No está comprobado que resuelva el error remoto**: el resultado de Drive debe verificarse en producción de pruebas.

## Qué contiene

- `index.html`: nuevo experimento Validación con 480 enunciados (seis listas de 80), cuestionario de escolaridad formal y estudios adicionales, instrucciones mejoradas, tres prácticas, evaluaciones de cuatro dimensiones, opción de piloto `?prueba=3`, acceso por grupos y códigos.
- `control-expbuilder-original.html`: **HTML original exacto**, sin cambios de una sola letra, para ejecutar el control. La comparación de sus bytes permite distinguir fallos de infraestructura o configuración del proyecto frente a fallos introducidos por el contenido de la tarea.
- `validacion-config.js`: claves y etiquetas de curso, por defecto `grupo-01` y `grupo-02` (ejemplos).
- `validacion-grupos.js`: código pseudoaleatorio de 16 caracteres por sesión y metadatos de grupos asociados a `sessionId`.
- `validacion-recibo.js`: observador visual que muestra el código **solo después de que el motor de ExpBuilder haya presentado su pantalla de éxito**; no intercepta `fetch`, no envía datos y no modifica la API.
- `data/`, módulos JS y estilos de la versión 17.1, además de `revisar_participaciones.py`.
- `diagnostico_integridad.json`: hashes y comprobaciones de equivalencia de motor.

## Diferencia deliberada respecto de v17.1

El **motor de sesiones y exportación es, byte por byte, el bloque original de ExpBuilder**: desde su inicialización hasta el comienzo de la definición de la línea de tiempo, 89.322 caracteres. No modificamos `createSession`, `appendEvents`, `recoverEvents`, `completeSession`, `retryExport`, `sessionStatus`, `_waitForPublicExport`, el generador de nombres ni `on_data_update`.

En v17.1 los campos de grupo se añadían alterando `on_data_update`. Ahora se usan **propiedades globales de datos de jsPsych (`jsPsych.data.addProperties`) antes de iniciar la tarea**. Los campos son `vm_modalidad`, `vm_curso`, `vm_etiqueta_curso`, `vm_codigo_participacion`, `vm_prueba`.

Se instala el observador de constancia sin tocar `_showSuccess`: para un curso válido muestra el código únicamente cuando el motor dibuja `Experiment complete. Thank you!`, evento que sigue a la confirmación de exportación del original. Se conserva el código asociado a la sesión si se reanuda desde el mismo navegador y almacenamiento.

## Enlaces de prueba

**Control original:**

`https://webexperimentsunam.github.io/jucios_morales_validation/control-expbuilder-original.html`

**Validación piloto, general:**

`https://webexperimentsunam.github.io/jucios_morales_validation/?prueba=3`

**Validación piloto, curso:**

`https://webexperimentsunam.github.io/jucios_morales_validation/?modalidad=estudiante&curso=grupo-01&prueba=3`

**Versión de 80 ensayos por participante:**

`https://webexperimentsunam.github.io/jucios_morales_validation/`

Los cuatro enlaces guardan datos **reales** en el mismo experimento de Firebase. Los códigos de piloto comienzan con `PRUEBA-` y no acreditan puntos.

## Protocolo de prueba / comparación (muy importante)

1. Publicar en un **repositorio de prueba** o durante un periodo sin sesiones activas; hacer antes una copia del repositorio anterior. Mantener la configuración actual de ExpBuilder/Firebase intacta.
2. Abrir la página de control en un perfil de navegador limpio y completar su único ensayo. Confirmar el archivo CSV en Drive, su contenido y la sesión.
3. Abrir `?prueba=3` **en otro perfil de navegador independiente**. Es importante: ambos HTML utilizan las mismas claves de `localStorage` y el mismo `experimentID`; abrirlos con el mismo perfil puede intentar recuperar la sesión de una tarea diferente. Confirmar 3 prácticas + 3 evaluaciones, sus registros y CSV.
4. Abrir `?modalidad=estudiante&curso=grupo-01&prueba=3` con un tercer perfil. Confirmar el CSV y que aparezca un código `PRUEBA-...` solo después del éxito remoto. Comprobar `vm_codigo_participacion` en el CSV exportado.
5. Si las tres pruebas anteriores se confirman, probar reanudación antes del timeout, expiración después del timeout y finalmente una participación completa de 80 ensayos. Confirmar identidad de sesión, lista y ausencia de duplicados.
6. En los resultados comprueba que el motor no solo responde HTTP 200: la respuesta debe tener `completion.confirmed: true` o confirmación del `export` correspondiente. Guarda, sin datos identificadores ni tokens, el objeto `export` de las sesiones fallidas.

**Interpretación:** si el original exporta y Validación falla con el mismo `lastError`, la equivalencia de código de almacenamiento por sí sola no soluciona el problema; deben compararse las solicitudes y el error interno del backend en dos sesiones contemporáneas. Sin acceso al backend no podemos atribuir el problema a credenciales globales, tamaño o contenido de eventos.

## Comprobaciones locales

- `node --check` del script embebido y de todos los módulos principales.
- Archivo de control SHA-256 exacto al HTML original proporcionado.
- Bloque original del motor antes de los ensayos: SHA-256 idéntico.
- 480 IDs de estímulos únicos; seis listas de 80.
- Simulación del módulo de grupos en Node: mismo código al recuperar sesión y códigos distintos entre sesiones.
- Todas las rutas locales `src` y `href` del HTML son archivos presentes en el paquete.

**No se ha realizado una prueba remota de exportación a Drive de esta versión**. La ejecución local de navegador está limitada por la política de acceso de red de este entorno. No usar para reclutamiento real antes de una confirmación en Drive.

## Aspectos operativos y éticos

- El plazo de 24 horas (1440 minutos) se configura en ExpBuilder, no en este HTML. No borrar IndexedDB en sesiones con datos pendientes.
- La numeración de participantes viene del servidor, continúa después de las pruebas y asigna las seis listas cíclicamente.
- En la modalidad de grupo no se piden nombres ni matrículas. El profesor recibe el folio del estudiante y únicamente la verificación de participación, no el CSV. Los criterios de calidad deben ser explícitos y revisados; prever una actividad alternativa equivalente para estudiantes que no quieran participar en investigación.
