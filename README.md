# Validación — prueba controlada de nombre de sesión

Esta versión es **solo para diagnóstico**. Reutiliza el mismo protocolo de almacenamiento que el `index.html` del desarrollador y mantiene la tarea, los estímulos, los controles y el piloto `?prueba=3`.

## Cambio único del comportamiento hacia la API

Se retiró el prefijo `PRUEBA3-` del nombre de sesión en las dos llamadas: `createSession` y `updateSessionName`. Esto iguala la generación de nombres al HTML original del desarrollador. La prueba continúa etiquetando cada dato de ensayo con `modo_prueba=3_ensayos` y `version_parche_prueba`. **La exportación se realiza a la API real.**

El cambio **no corrige las credenciales del servidor**: únicamente permite determinar si el nombre de sesión altera la selección del destino de exportación en el backend.

## Prueba

1. Haz copia del proyecto publicado; para evitar afectar el estudio, utiliza un repositorio de pruebas.
2. Sube este paquete completo, o reemplaza solamente `experiment.js` e `index.html` si lo demás es idéntico.
3. Desde un navegador/perfil sin sesiones previas abre `?prueba=3`.
4. Completa la prueba y consulta el JSON de `completeSession`/`sessionStatus`.
5. Comprueba `completion.confirmed`, `export.status`, `export.confirmed`, `export.lastError`, `export.resource`.

### Interpretación

- Si aquí exporta y la versión anterior no, el prefijo/nombre de sesión merece revisión del lado del backend. Todavía no demuestra por sí solo que sea la causa: un problema intermitente podría producir el mismo patrón.
- Si sigue devolviendo `Storage credentials require attention`, queda descartado el prefijo como explicación suficiente. En ese caso hay que comparar los objetos completos de `createSession` y `completeSession` exitosos del HTML funcional con los de esta variante, sin exponer tokens de sesión ni respuestas.

No borres IndexedDB de sesiones anteriores sin respaldo. No utilices esta versión con participantes reales hasta confirmar la exportación.
