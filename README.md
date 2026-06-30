# Gestión Atelier BIP

Progressive Web App (PWA) offline-first para la gestión de clientas, medidas y pedidos de un atelier de costura. Pensada para usarse desde el celular, sin conexión a internet, con sincronización opcional a Google Sheets.

## Funcionalidades

- Registro de clientas con medidas básicas y personalizadas.
- Gestión de pedidos: insumos, costos, precios sugeridos, cobros y estados.
- Resumen mensual de facturación con KPIs y gráficos.
- Exportación a CSV y Excel.
- Sincronización opcional con Google Sheets vía Google Apps Script.
- Funciona 100% offline (PWA instalable).

## Desarrollo local

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173/gestion-atelier/`.

Para compilar y previsualizar el build de producción:

```bash
npm run build
npm run preview
```

## Deploy a GitHub Pages

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que compila y publica automáticamente la app en GitHub Pages en cada push a `main`.

Pasos para habilitarlo:

1. En GitHub, ir a **Settings → Pages** del repositorio.
2. En "Build and deployment", seleccionar como source la rama `gh-pages` (la crea automáticamente el workflow la primera vez que corre).
3. Hacer push a `main` — el workflow se encarga del resto.

También se puede hacer un deploy manual con:

```bash
npm run build
npm run deploy
```

(usa `gh-pages` para publicar el contenido de `dist/`).

## Configurar Google Apps Script (sincronización opcional)

1. Crear una Google Sheet nueva (o usar una existente) y copiar su ID desde la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`.
2. Ir a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
3. Borrar el contenido por defecto y pegar el contenido de [`docs/apps-script.gs`](docs/apps-script.gs).
4. Reemplazar la constante `SPREADSHEET_ID` por el ID copiado en el paso 1.
5. Clic en **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
6. Copiar la URL de la implementación generada.
7. En la app, ir a **Configuración → Google Sheets Sync**, pegar la URL y tocar **Verificar conexión**.
8. Opcionalmente, activar **Sincronizar automáticamente al guardar**.

El script crea automáticamente las hojas "Clientes", "Pedidos" y "Medidas" la primera vez que recibe datos.

## Instalar la PWA en el celular

### Android (Chrome)

1. Abrir la app en Chrome.
2. Tocar el menú (⋮) → **Agregar a pantalla de inicio** (o aparecerá un banner de instalación automático).
3. Confirmar — el ícono queda disponible como una app nativa.

### iOS (Safari)

1. Abrir la app en Safari (no funciona desde otros navegadores en iOS).
2. Tocar el botón de compartir (cuadrado con flecha hacia arriba).
3. Seleccionar **Agregar a inicio**.
4. Confirmar — el ícono queda disponible en la pantalla principal.

## Stack técnico

React 18 + TypeScript + Vite, IndexedDB (vía `idb`) para persistencia offline, `vite-plugin-pwa` para el service worker, CSS vanilla con variables (sin librerías UI ni Tailwind), routing manual con `useState` (sin react-router).
