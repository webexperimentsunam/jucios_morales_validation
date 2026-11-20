# Validación — revisión 17.1: texto de grupos y diagnóstico de exportación

Esta versión parte de `Validacion_grupos_escolaridad_v17` y **no altera la creación de sesión, el envío de eventos, la función `completeSession`, `retryExport` ni los parámetros de Firebase y Google Drive**.

## Cambios de esta revisión

- En la bienvenida de los cursos se solicita responder con atención, sin apresurarse ni elegir opciones al azar. Se elimina la mención explícita a la revisión de tiempos de respuesta.
- El texto que acompaña el código del participante deja de mencionar los tiempos de reacción.
- Si el servidor devuelve `export.status = needs_attention` o no devuelve un estado de exportación, el navegador registra en consola un objeto de **solo diagnóstico** accesible mediante `window.ValidacionEstadoExportacion`. No incluye `sessionId`, credenciales, tokens ni respuestas de participantes.
- El identificador de versión verificable es `window.ValidacionVersion` = `v17.1-texto-diagnostico`; se cambió el parámetro de caché de los dos archivos modificados.

## Diagnóstico del error de guardado

La alerta `Storage export needs a retry or support` **no acredita por sí sola** que haya un problema de permisos o credenciales: la respuesta de `apiData` debe revisarse para saber el motivo. En caso de fallar, abrir DevTools → Consola y escribir `window.ValidacionEstadoExportacion`. Revisar `exportStatus`, `lastError` y los conteos; no enviar capturas de tokens ni identificadores de sesión.

Si `lastError` indica `Storage credentials require attention`, corresponde revisar las credenciales/destino de Drive en el backend de ExpBuilder. Cambiar el texto inicial no soluciona ese tipo de fallo. Si aparece un error distinto, diagnosticarlo antes de alterar el código de guardado.

## Pruebas recomendadas

1. Conservar respaldada la versión que guardaba correctamente. Subir todos los archivos del proyecto, evitando actualizar mientras existan sesiones activas.
2. Probar primero `?prueba=3` en modo general y luego `?modalidad=estudiante&curso=grupo-01&prueba=3`, con perfiles independientes para evitar reanudación accidental de sesiones anteriores.
3. Confirmar el CSV en Drive y, en modo grupo, confirmar que el código mostrado coincide con `vm_codigo_participacion`.
4. Si falla, preservar IndexedDB y la pestaña hasta decidir cómo recuperar el guardado. El botón `Retry saving` utiliza la API original.

**Limitación**: la publicación, el estado de las credenciales y la exportación real a Drive solo se pueden verificar mediante pruebas contra el servidor.

---

# Validación — versión 17: escolaridad, instrucciones y grupos

**Base:** versión funcional `Validacion_revision_2026_11_20`, que conserva las 480 oraciones y la capa ExpBuilder v3 de sesiones, IndexedDB, Firebase y exportación a Drive. **Esta revisión NO cambia el protocolo del backend ni el tiempo del servidor.** El guardado real de esta revisión debe probarse en GitHub Pages antes de reclutar.

## Publicación

1. Hacer respaldo del repositorio que ya funciona. Subir el contenido **del ZIP completo** a la raíz de GitHub Pages, sin el directorio envolvente. No publicar durante sesiones activas.
2. Editar **`validacion-config.js`** para configurar los cursos. Las claves `grupo-01` y `grupo-02` son ejemplos que deben adaptarse antes de compartir enlaces. Cada curso tiene una clave pública y una etiqueta visible. NO es un sistema de autenticación.
3. Para recibir respuestas públicas: `https://webexperimentsunam.github.io/jucios_morales_validation/`
4. Para participantes de curso: `https://webexperimentsunam.github.io/jucios_morales_validation/?modalidad=estudiante&curso=grupo-01` (cambiar por la clave configurada).
5. Para piloto de 3 estímulos principales: agregar `&prueba=3` al enlace de curso o `?prueba=3` al enlace público. **Los códigos PRUEBA no acreditan puntos; los datos sí se envían al servidor.**
6. Configurar `resumeTimeoutMinutes: 1440` en ExpBuilder (24 horas); este proyecto no altera dicho valor. Probar recuperación antes/después de vencer el plazo.

## Qué cambia

### Cuestionario de escolaridad

- Ya no se muestra una segunda pregunta desplegable de escolaridad general. Se preguntan años/grados completos aprobados en **primaria, secundaria, bachillerato, licenciatura principal, especialidad, maestría y doctorado**, con títulos breves.
- Se conserva la columna histórica `Estudios` pero ahora se **deriva** del mayor nivel registrado y la pregunta «¿Concluiste el nivel educativo más alto que registraste?». Si se indica un programa adicional de nivel superior, se considera también para el máximo. En `Estudios` y `Nivel más alto - derivado` se recogen estos valores.
- Una sección condicional «Otros estudios formales» deja registrar de 1 a 8 programas adicionales de diferentes niveles, sus años/grados aprobados y conclusión (por ejemplo, otras licenciaturas, dos especialidades o dos maestrías). No se incluyen cursos, talleres o diplomados de educación continua.
- La respuesta contiene un JSON `Otros estudios formales - programas` y además columnas independientes `Programa adicional N - nivel`, `- años`, `- concluido`. Total de años de formación adicional separado del principal.
- La suma de años de la trayectoria principal es **descriptiva**. No debe aplicarse directamente a baremos neuropsicológicos sin revisar las reglas del instrumento (en particular, estudios simultáneos o adicionales).

### Instrucciones

Se explicitan las cuatro dimensiones siguiendo las preguntas de Mickelberg et al. (2022): moralidad (calidad moral de la conducta), competencia (capacidad de la persona inferida de la conducta), informatividad (utilidad para formarse una impresión) y credibilidad (posibilidad de ocurrencia en la vida real). Valores de las cuatro escalas **sin cambios**. Se conserva la sección de reanudación en 24 h.

### Enlaces de curso y códigos

- `validacion-config.js`: lista editable de cursos y etiquetas. No cambia cuántos estímulos ve cada persona.
- `validacion-grupos.js`: toma `modalidad` y `curso` del enlace. Invalida claves no configuradas y no permite cambiar de curso dentro de una sesión ya iniciada.
- Se genera por `crypto.getRandomValues()` un código aleatorio, estable en el almacenamiento local **por sesión**, formato `VM-XXXX-XXXX-XXXX-XXXX`; pilotos `PRUEBA-XXXX-XXXX-XXXX-XXXX`.
- En **cada evento** exportado se añaden: `vm_modalidad`, `vm_curso`, `vm_etiqueta_curso`, `vm_codigo_participacion`, `vm_prueba`. De ese modo un abandono también conserva el grupo y código en el registro, aunque no vea pantalla de constancia.
- Solo tras el guardado remoto confirmado (la pantalla exitosa del guardado original) se muestra el código en el navegador a los participantes de curso. **No se acredita automáticamente** ni se requieren nombre, matrícula o correo dentro del experimento.
- Participantes generales hacen la misma tarea, sin emisión de código. El acceso por enlace es declarativo: cualquiera con el vínculo puede usarlo.

### Revisión local de resultados

`revisar_participaciones.py` recibe el CSV real exportado de Drive y crea un CSV de revisión agrupado por código y sesión. Calcula estímulos principales distintos, completitud de las cuatro escalas, mediana de RT, respuestas de menos de 400 ms y desviaciones típicas por dimensión. Las alertas **nunca niegan puntos automáticamente**. Revisar siempre todos los casos y establecer criterios de evaluación antes de iniciar la recogida.

Uso: `python revisar_participaciones.py archivo_drive.csv`

**Advertencia ética:** antes de ofrecer puntos académicos, revisar consentimiento, voluntariedad y una alternativa equivalente; indicar de forma transparente el uso del código para verificación docente. El código vincula datos de conducta a una persona solo si ésta lo entrega al profesor: no difundir el CSV con datos del estudio a docentes; comunicarles únicamente el estado de verificación de los códigos.

## Verificaciones locales realizadas

- Se verifica que las funciones `createSession` y `_completePublicSession` siguen idénticas a la base; no se reescribe ni república ninguna función del backend.
- Verificación de sintaxis de todos los archivos JS modificados y de bloque JS embebido.
- Interfaz de cuestionario móvil (375 px) y escritorio (1440 px), con dos programas adicionales; sin desbordamiento horizontal y con cálculo correcto de escolaridad.
- Interfaz de instrucciones a ambos anchos.
- Módulo de grupos ejecutado con respuestas simuladas: códigos aleatorios y estables por sesión, curso inválido bloqueado y códigos de prueba reconocibles.
- 480 estímulos y 6 listas × 80 idénticos a la versión anterior.

**Pendiente:** prueba real de creación, reanudación, expiración, exportación y visualización de código en GitHub Pages/Google Drive. No es posible verificar permisos de Firebase/Drive desde las pruebas locales.

## Referencias técnicas

- CAFE (adaptación del mecanismo de cursos/folio, no copia del guardado): https://github.com/webexperimentsunam/cafe
- Mickelberg et al. (2022), PLOS ONE, doi:10.1371/journal.pone.0269393
