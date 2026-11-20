# Validación — oraciones finales y listas

Se integra el corpus `Corpus Behavioral Statements MX Versión Final.xlsx`, hoja `Hoja 1`, columnas `ID`, `Version Final`, `ID Asociado`, `Lista`.

- 480 oraciones, seis listas de 80; no se usan colores de Excel.
- Regla original preservada: `((participantNumber - 1) % 6) + 1`.
- Participante 1 → Lista 1, 2 → Lista 2, … 6 → Lista 6, 7 → Lista 1.
- El número de participante proviene de Firebase y puede haber avanzado por sesiones piloto anteriores.
- Tres ensayos de práctica + 80 enunciados principales (o tres en modo `?prueba=3`).
- El orden de cada lista se aleatoriza con el mecanismo original de ExpBuilder y se recupera mediante su estado persistente.
- Los datos de cada ensayo registran `participant_number`, `stimulus_id`, `stimulus_id_asociado`, `stimulus_lista`, `stimulus_texto`, además de las cuatro escalas originales.
- La columna `Lista` se lee en ejecución de `data/main.json`, exportado directamente desde el Excel, y se valida contra los estímulos.
- No se alteran las funciones originales de Firebase, IndexedDB, gestión de sesiones o exportación a Google Drive.

## Publicar

Publicar todos los archivos del directorio en una rama de prueba del mismo repositorio de GitHub Pages, manteniendo la estructura de carpetas. No intercambiar solamente `index.html`: deben reemplazarse también `data/main.json` y los nueve archivos `data/estimulos_*.json`.

La URL sin parámetros ejecuta 80 estímulos de la lista asignada; `?prueba=3` ejecuta tres estímulos principales y **también guarda en Firebase/Drive**. En consola, `window.ValidacionAsignacion` muestra la lista asignada.

## Pruebas indispensables

1. Participante con número conocido: comprobar que recibe su lista correcta.
2. Revisar que en el CSV todos los `stimulus_id` pertenecen a una sola lista y que se conservan ID asociado y texto.
3. Completar el experimento y confirmar la exportación a Google Drive.
4. Salir y volver antes/después de timeout; verificar que no se duplican ensayos.
5. No sustituir el contenido durante sesiones activas; un corpus modificado puede invalidar sus puntos de reanudación.

Nota: la numeración de Firebase puede haber avanzado tras sesiones de prueba. No se reinicia el contador aquí para no afectar la persistencia.
