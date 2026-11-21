# Validación — ajustes aprobados al cuestionario e instrucciones

Versión de revisión: `16.0-ajustes` (20 de noviembre de 2026). Base: `Validacion_listas_finales.zip`, cuyo guardado a Firebase/Google Drive y distribución cíclica de listas ya fueron probados por el equipo.

## Cambios implementados

1. **Escolaridad por años completos aprobados.** Se agregan ocho campos numéricos obligatorios al cuestionario nativo: primaria, secundaria, bachillerato o equivalente, licenciatura principal, especialidad, maestría, doctorado y otras licenciaturas. Si no se cursó el nivel, se registra `0`. No se cuentan años repetidos, reprobados ni años calendario adicionales sin grados completos aprobados. Se acepta solo un entero entre 0 y el máximo validado por campo. Una licenciatura concluida en 8 años calendario cuyo plan aprobado equivalga a 4 años se registra como `4` en la licenciatura principal; una segunda licenciatura se registra aparte.
2. **Cálculo independiente de escolaridad.** En `SurveyComponent_1_response` se agregan `Años de escolaridad - trayectoria principal` (suma de primaria, secundaria, bachillerato, licenciatura principal, especialidad, maestría y doctorado) y `Años de escolaridad - otras licenciaturas` (valor aparte). Estas sumas son *descriptivas* y no sustituyen las reglas de puntuación de una prueba neuropsicológica particular. Se preservan las seis variables previas, incluido `Estudios`.
3. **Máximo nivel de estudios.** La antigua pregunta «Nivel de estudios actual» pasa a «Máximo nivel de estudios alcanzado». Se incorporan «Especialidad (incompleta)» y «Especialidad (completa)». También se permiten niveles inferiores al bachillerato, para que el selector sea aplicable a todas las trayectorias.
4. **Moralidad.** Los extremos de −4 y +4 se muestran y se registran como «Moralmente muy mala» / «Moralmente muy buena», sin modificar la codificación −4...+4 ni las otras dimensiones. El texto de las instrucciones se actualizó en el mismo sentido.
5. **Interrupciones.** Se añade un apartado visual en español que explica las 24 horas para volver desde cada interrupción, la necesidad de usar el mismo navegador/dispositivo y las limitaciones del modo incógnito. No altera el algoritmo de recuperación ni permite extender una sesión ya expirada.

## Importante: configurar 24 horas en ExpBuilder

El timeout real depende de la configuración **del servidor**, `configuration.batchConfig.resumeTimeoutMinutes`. Para 24 horas, configurar **1440 minutos** en ExpBuilder y republicar la configuración correspondiente. **Este paquete no cambia esa configuración**. La renovación del plazo en interrupciones sucesivas debe validarse en el entorno de publicación. La descripción en pantalla asume que el servidor está configurado para 24 horas y que aplica la renovación del plazo descrita por el equipo.

## Qué no se modificó

- Ninguna de las 480 oraciones finales de `data/main.json` ni de los nueve archivos de estímulos.
- Los seis grupos/listas: 80 oraciones por lista.
- La asignación cíclica del número de participante y la aleatorización original.
- Los ensayos de práctica y el modo `?prueba=3`.
- El motor original de sesiones, IndexedDB, Firebase, recuperación y exportación a Google Drive del HTML funcional de ExpBuilder.

## Archivos actualizados

`index.html`, `survey.js`, `survey.css`, `pantallas.js`, `pantallas.css`, `evaluacion.js` y `data/definition.json`. Los demás archivos se incluyen para que sea posible publicar el ZIP como proyecto completo. Los recursos externos usan un nuevo parámetro de versión `?v=16.0-ajustes` para evitar caché.

## Verificación realizada

- Sintaxis de los tres módulos JS modificados y del bloque JavaScript incrustado en el HTML.
- Formulario ejecutado con un navegador de pruebas (375 y 1440 píxeles). Se comprobaron los ocho campos nuevos, la validación de campos vacíos, la opción de especialidad, un total de 19 años principales y cuatro de formación adicional, sin errores JS.
- Instrucciones ejecutadas con el navegador de pruebas (375 y 1440 píxeles), sin desbordamiento horizontal.
- Pantalla de evaluación verificada (320 y 1440 píxeles): los dos polos de moralidad se muestran correctamente y el dato numérico en cero se conserva.
- Integridad de las 480 oraciones, sus listas y los archivos de estímulos respecto a la versión funcional.

**Pendiente:** probar el proceso completo y la exportación a Google Drive en un navegador real con la versión publicada, y probar el timeout definitivo de 1440 minutos. No sustituir archivos mientras un participante tenga una sesión activa.
