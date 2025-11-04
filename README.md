## Bookmarks Map

Aplicación web para transformar el archivo `Bookmarks` de Google Chrome en un mapa visual navegable.

### Requisitos
- Node.js 20+
- npm 10+

### Scripts principales
- `npm install` — instala dependencias.
- `npm run dev` — servidor de desarrollo con Vite.
- `npm run build` — valida tipos y genera la build optimizada.
- `npm run preview` — sirve la build generada localmente.
- `npm run lint` / `npm run lint:fix` — ejecuta ESLint.
- `npm run format` / `npm run format:check` — formatea con Prettier.

### Estructura
- `src/` — código de la app (componentes, hooks, librerías).
- `public/` — assets estáticos y configuración compartida.

### Visualizaciones disponibles
- **Árbol:** estructura jerárquica clásica para inspeccionar carpetas y enlaces.
- **Kanban:** cada carpeta principal se convierte en una columna horizontal (con scroll) que lista sus subcarpetas y marcadores como tarjetas. Puedes entrar en cualquier carpeta para abrir un tablero anidado y volver atrás con la ruta de migas o el botón “Atrás”.
- **Diagrama:** vista interactiva que posiciona la carpeta raíz seleccionada en horizontal, sus hijos en una columna vertical y un tercer nivel en abanico lateral. El zoom se limita a tres niveles visibles por paso para mantener el diagrama legible.

Usa los botones de la parte superior para alternar entre las vistas y activa el modo “Ver solo diagrama” si necesitas aislar el lienzo.

### Persistencia local
Tras subir un archivo HTML, la aplicación guarda el contenido en `localStorage` y lo restaura automáticamente en visitas posteriores. También recuerda la vista elegida (Árbol/Kanban) para que la sesión quede tal como la dejaste. Usa el botón “Olvidar archivo” para limpiar la sesión y cargar un archivo nuevo desde cero.

### Búsqueda
El buscador admite coincidencias parciales por título o URL. Los resultados filtran las tres vistas (árbol, tablero Kanban y diagrama), manteniendo únicamente los nodos relevantes.

### Diagrama interactivo
- Arrastra el lienzo con el ratón o trackpad para desplazar la vista.
- Usa el scroll (o pellizco en trackpads) para hacer zoom; siempre se ajusta para mantener el puntero como referencia.
- Pulsa “Recentrar” para encajar el diagrama completo en pantalla. La aplicación recentra automáticamente cada vez que cambias de nivel.
- Haz clic en una carpeta con elementos para profundizar. El encabezado muestra la ruta con migas y un botón “Atrás”.
- Pulsa `Escape` para retroceder un nivel. Si estás en foco completo, una pulsación adicional cierra la ventana flotante.
- El modo “Ver solo diagrama” bloquea el scroll global y expande el lienzo al máximo alto disponible.

### Desarrollo rápido
1. Clona el repositorio y ejecuta `npm install`.
2. Inicia el servidor con `npm run dev`.
3. Sube el archivo HTML exportado desde Chrome y valida que se muestre correctamente.
