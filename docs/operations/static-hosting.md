# Publicación estática de `dist/`

Runbook para servir el build de producción de ArkUML en un host de
archivos estáticos. No convierte el producto en SaaS y no configura un
proveedor del proyecto. Ningún host concreto está «soportado» como
producto: las recetas son ilustrativas.

`mvp-spec.md` no gana hosting cloud. El producto sigue siendo una SPA
local, un usuario, sin backend.

## Qué no cubre este runbook

Prohibido como parte de publicar `dist/`:

- Backend, autenticación, variables de entorno de API, headers de auth.
- Secrets de CI, tokens, DNS, dominio, o una cuenta Cloudflare/Vercel
  del proyecto.
- Workflow de deploy en este repositorio (incluido Pages con
  `GITHUB_TOKEN` u otro secret).
- Analytics, PWA, Service Worker.
- Cambiar el `base` de Vite a un path absoluto de un host.

## Prerrequisitos

- Node.js `>=24.15 <25` (LTS). `.nvmrc` fija la major `24`.
- `package-lock.json` versionado.

```bash
npm ci
npm run build
```

El resultado vive en `dist/`. Comprobación local del bundle:

```bash
npm run preview
```

`vite preview` escucha en `http://localhost:4173` por defecto. Ese
procedimiento corto también está en el [README](../../README.md).

## Qué se publica

El contenido de `dist/`: una sola página (`index.html` y sus assets).
No hay router de aplicación; no hace falta fallback SPA hacia
`index.html` en rutas profundas.

`vite build` no copia [`LICENSE`](../../LICENSE) a `dist/`. Al
redistribuir, entrega también esa licencia (véase [Licencia](#licencia)).

## `base` `./`

El `base` de Vite es `./`: los assets son relativos al `index.html`.
Vale la raíz de un sitio o una subcarpeta, **siempre que** los archivos
de `dist/` viajen juntos (el `index.html` y `assets/` como en el build).

No hace falta un path de aplicación fijo en Vite.

## HTTP obligatorio

No abras `dist/index.html` como `file://`. Los módulos ES requieren HTTP.

## Recetas ilustrativas

Ninguna crea cuentas, pipelines ni secrets en este repositorio. Un
operador copia `dist/` a un servidor que ya tenga, o arrastra la carpeta
a la UI de un host estático.

### nginx

Sirve el contenido de `dist/` como `root` y `index.html` como índice.
Una sola página: no hace falta `try_files` de SPA.

```nginx
server {
    listen 80;
    root /ruta/a/dist;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Sustituye `/ruta/a/dist` por la ruta real en la máquina. El `listen` y el
nombre del servidor los elige el operador; este bloque no es un
proveedor soportado.

### GitHub Pages

Publica el **contenido** de `dist/` (no el árbol fuente) en la rama o
carpeta que Pages ya sirva en tu fork u org. Subir los archivos a mano
o desde la máquina local basta.

No añadas un workflow de deploy, ni un secret de Pages, ni una Action
con `GITHUB_TOKEN` en este repositorio.

### Netlify Drop / carpeta estática

Arrastra la carpeta `dist/` a Netlify Drop, o apunta cualquier host de
carpeta estática al contenido de `dist/`. Sin variables de entorno, sin
funciones y sin analytics.

## Caché

- `index.html`: cache corto. Cada build puede apuntar a chunks nuevos.
- Assets hasheados de Vite (`dist/assets/*`): pueden ser inmutables
  (`Cache-Control: public, max-age=31536000, immutable`).

## Licencia

El código de ArkUML es [Apache License 2.0](../../LICENSE). Al
redistribuir el `dist/` no omitas `LICENSE`.

El `dist/` lleva dependencias de runtime MIT (`react`, `react-dom`,
`@xyflow/react`, `zustand`, `zod`, `html-to-image`). La atribución de
React Flow permanece visible en la app.
