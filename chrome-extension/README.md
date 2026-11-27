# BugBounty Dorkhub - Chrome Extension

Extension de Chrome para abrir múltiples dorks de una categoría sin bloqueadores de pop-ups.

## 🚀 Características

- ✅ Abre todos los dorks de una categoría con un click
- ✅ Bypasea bloqueadores de pop-ups del navegador
- ✅ Marca automáticamente los dorks como completados
- ✅ Guarda progreso en localStorage
- ✅ Diseño futurista integrado con el tema de la app

## 📦 Instalación

### Paso 1: Preparar la extensión
La extensión ya está lista en la carpeta `chrome-extension/`

### Paso 2: Instalar en Chrome

1. Abre Chrome y navega a: `chrome://extensions/`

2. Activa el **"Modo de desarrollador"** (Developer mode) en la esquina superior derecha

3. Click en **"Cargar extensión sin empaquetar"** (Load unpacked)

4. Selecciona la carpeta: `/media/rh4ps00dy/Data/bugbounty-dorkhub-v2/chrome-extension/`

5. ¡Listo! La extensión está instalada ✓

### Paso 3: Usar la extensión

1. Abre el archivo `index.html` de BugBounty Dorkhub en Chrome

2. Verás un nuevo botón verde **"Open Category"** en cada categoría

3. Ingresa un dominio objetivo (ej: `example.com`)

4. Click en **"Open Category"** en cualquier categoría

5. Confirma para abrir todos los dorks de esa categoría

6. ¡Todas las pestañas se abrirán sin bloqueos!

## 🎯 ¿Cómo funciona?

La extensión:
1. Inyecta botones "Open Category" en cada sección
2. Extrae todos los dorks de la categoría seleccionada
3. Reemplaza `example.com` con tu dominio
4. Usa la API de Chrome para abrir pestañas (bypasea pop-up blockers)
5. Marca automáticamente los botones como completados

## 🛠️ Archivos de la extensión

```
chrome-extension/
├── manifest.json       # Configuración de la extensión
├── background.js       # Service worker para abrir pestañas
├── content.js          # Script que añade botones a la página
├── popup.html          # Interfaz del popup
├── popup.css          # Estilos del popup
└── popup.js           # Lógica del popup
```

## 📝 Notas

- La extensión solo funciona cuando abres BugBounty Dorkhub
- Requiere permisos de "tabs" para abrir múltiples pestañas
- Compatible con Chrome, Edge, Brave y otros navegadores Chromium

## 🐛 Solución de problemas

**Problema:** Los botones no aparecen
- Solución: Recarga la página (F5) después de instalar la extensión

**Problema:** Las pestañas no se abren
- Solución: Asegúrate de tener un dominio ingresado en el campo "Target Domain"

**Problema:** La extensión no funciona
- Solución: Verifica que el "Modo de desarrollador" esté activado en `chrome://extensions/`

## 👨‍💻 Autor

Creado por [0xRh4ps00dy](https://github.com/0xRh4ps00dy)

---

⚠️ **For educational and authorized security research only**
