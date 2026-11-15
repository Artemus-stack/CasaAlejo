# Casa Alejo

Landing page for Casa Alejo, a Mexican kitchen and bar at 101 W Emma Ave in downtown Springdale, Arkansas.

A static site with no build step: `index.html`, `css/styles.css`, `js/`.

## Run locally

The page uses ES modules, so open it through a local server rather than from the file system:

```sh
python3 -m http.server 4173
# then visit http://localhost:4173
```

It can be hosted as-is on GitHub Pages, Netlify, Vercel or any static host.

## How it is put together

- **3D logo** (`js/logo3d.js`): the logo artwork is cut into three transparent layers (sombrero, skull, wordmark) in `assets/logo/`. Each is rebuilt as an extruded stack in Three.js, so the emblem has real depth as it turns toward the pointer. Without WebGL, the flat logo is shown instead.
- **Palette**: sampled from the logo artwork and defined as CSS variables at the top of `css/styles.css`.
- **Three.js** is vendored in `vendor/three/` (MIT license).

## Before launch

Content was drafted from public sources and should be confirmed by the restaurant:

- Hours, in `index.html` (Visit section, FAQ and the JSON-LD block in `<head>`)
- Menu items and descriptions; prices are intentionally left out
- Careers roles and how to apply
- To-go and large-party details in the FAQ
