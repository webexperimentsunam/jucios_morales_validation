# Validación — integración sobre el HTML funcional de ExpBuilder

Este paquete utiliza **exactamente el motor de sesiones y exportación** del archivo `index (1).html` que proporcionaste. El código de las funciones de registro, sesiones, IndexedDB, envío de eventos, finalización, comprobación y reintentos de exportación se conservó sin cambios. Solo se sustituyó el ensayo de ejemplo por la tarea de Validación y se incluyeron los recursos visuales de la versión previa.

## Instalación

1. Crea una **rama o repositorio de prueba**. No sustituyas todavía el experimento usado para participantes.
2. Sube **todo el contenido de esta carpeta**, incluidos `index.html`, los `.js`, los `.css`, `img/` y `data/`, a la raíz de GitHub Pages. No es necesario subir el ZIP ni los CSV de resultados.
3. Abre `?prueba=3` para comprobar bienvenida, consentimiento, cuestionario, práctica y **tres estímulos principales**. **Este modo sí envía los datos a Firebase/Drive** y los marca como prueba.
4. Sin `?prueba=3`, se habilitan los **480 estímulos principales**.

## Qué se conserva

- ID de estudio y endpoints de Firebase del HTML del desarrollador.
- El motor de `createSession`, `resumeSession`, `appendEvents`, `completeSession`, `sessionStatus` y `retryExport`, incluida la gestión de IndexedDB.
- Los nombres de sesión originales del HTML funcional, sin prefijos `PRUEBA3-`.
- Los componentes, sus datos y la selección/aleatorización de práctica y tarea principal de la versión de Validación.
- Los archivos existentes de imagen, estilos y pantallas especializadas.

## Límites y validación pendiente

- `node --check` y verificaciones de estructura/activos superadas.
- **No se ha realizado una prueba de escritura real a Firebase/Drive desde este entorno.**
- No debe considerarse lista para reclutamiento sin comprobar: completado de 3 estímulos y CSV; reanudación con 1 o 2 minutos (mismo navegador); reingreso tras vencimiento; ejecución de los 480 ensayos y exportación completa.
- La ruta de sesión expirada del HTML funcional se ha conservado tal cual, incluso aunque el flujo de reingreso requiera una adaptación posterior. La prioridad fue no modificar su código de almacenamiento.
- Verifica que las etiquetas y la orientación de «Competencia» reflejen el protocolo aprobado antes de tomar datos reales.

## Comprobaciones

El archivo `verificacion.json` contiene el hash SHA-256 del motor de almacenamiento original y de la integración, que deben coincidir.
