# Validación — versión experimental para GitHub Pages

## Qué contiene

- `index.html`: interfaz y dependencias jsPsych/ExpBuilder tomadas del ejemplo funcional publicado.
- `experiment.js`: navegación, instrucciones, consentimiento, ensayos, ramificaciones y guardado, adaptados a Validación.
- `data/estimulos_*.json`: **480 registros** del bucle principal, divididos sin cambiar su orden ni su contenido.
- `img/`: cinco imágenes originales del respaldo.
- `.nojekyll`: permite servir los archivos estáticos en GitHub Pages.

El identificador del experimento es **e9493936-a5e7-4970-8759-520d2b4689d0** (no se mezclan resultados con el experimento de ejemplo: `7f4f984c-de8c-47f4-8144-b6284a011f97`).

## Publicación

1. Crea un repositorio nuevo en GitHub para Validación.
2. Sube **el contenido de esta carpeta**, no el ZIP de respaldo original ni sus resultados históricos. `index.html` debe quedar en la raíz del repositorio.
3. En Settings → Pages, selecciona Deploy from a branch → `main` → `/ (root)` → Save.
4. Abre la URL de GitHub Pages, observa la consola del navegador (F12) y comprueba que cargan los 9 archivos JSON y las cinco imágenes.

## Comprobación imprescindible antes de recopilar datos reales

**La configuración de Firebase y el proveedor de Google Drive del segundo experimento se reutilizan como plantilla, no como garantía de permisos.** Aunque el identificador de Validación ya existe en tu respaldo local, puede no estar registrado en el backend público (`test-e4cf9`) con permisos de escritura y conexión a tu cuenta de Google Drive.

- Haz **una sola sesión piloto** usando datos inventados, nunca datos de participantes reales.
- Comprueba que `createSession()` devuelve respuesta satisfactoria de `apiData` y que crea una sesión con el identificador de Validación.
- Completa un recorrido del experimento y comprueba que la respuesta a `apiDataComplete` tiene `success: true`.
- Revisa en el destino de Google Drive / panel de ExpBuilder que el archivo de resultados del experimento **Validación** realmente apareció, con el ID y número de ensayos correctos. Verifica que los datos del otro experimento siguen separados.
- Si aparece `400`, `403` o `404`, o falla Firebase RTDB, es necesario registrar/configurar Validación en el sistema público de ExpBuilder. **No reutilices el ID del ejemplo ni abras permisos globales para evitarlo.**

## Guardado y límites

Se respeta el mecanismo del ejemplo funcional: las respuestas pasan primero a IndexedDB y se envían al servicio público de ExpBuilder en **una carga final** (`batchSize=0`) hacia `apiDataComplete`, que declara usar Google Drive. Los archivos JSON de estímulos se descargan de GitHub Pages, **no son archivos de resultados**. Es imprescindible comprobar que esta carga final acepta el tamaño de los datos producidos por cientos de ensayos. No se ha probado con el backend remoto desde este entorno.

Si una carga falla, el sistema conserva los ensayos pendientes en IndexedDB hasta su plazo de caducidad (3 días en la plantilla). **No cierres el navegador antes de verificar la confirmación del guardado**. Para estudios con participantes reales convendría sustituir la carga final única por lotes con confirmación y reintentos, después de verificar la API.

Los archivos jsPsych y ExpBuilder dependen de CDN externos y requieren conexión a Internet. La creación manual del repositorio evita el límite de 1 MiB que ExpBuilder aplica a la subida directa de `index.html`; no modifica el backend.

## Verificaciones estáticas realizadas

- Se conservaron 14 definiciones de pantalla/ensayo y 2 bucles mediante el código generado original.
- Los 480 registros se reconstruyen en el mismo orden. El aleatorizador original se deja intacto.
- Las cinco imágenes se incluyen por separado.
- No se incluyen `sessionResults` ni otros datos históricos del respaldo.
- La prueba de sintaxis JavaScript y de correspondencia JSON se realiza durante la preparación; **no equivale a una prueba de navegador ni de guardado remoto**.
