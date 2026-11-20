# Casa Alejo

Landing page for Casa Alejo, a Mexican kitchen and bar at 101 W Emma Ave in downtown Springdale, Arkansas.

A static site with no build step: `index.html` (landing page), `menu.html` (the full menu), `css/`, `js/`.

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
- **Menu** (`menu.html`, `css/menu.css`): a reproduction of the printed two-page menu. Each sheet is a letter-size page whose sizes are all relative to the sheet width, so it scales like paper on desktop and reflows to one column on phones. The stucco paper tiles and palm-frond watermark live in `assets/menu/`.

## Updating the menu

1. Edit the items and prices in `menu.html`. The short preview in the Menu section of `index.html` repeats some of them, so update it too.
2. Regenerate the PDF: open `menu.html` in Chrome, choose **Print → Save as PDF**, paper size **Letter**, margins **None**, with **Background graphics** on. Save it over `assets/menu/casa-alejo-menu.pdf`.

## Before launch

Content was drafted from public sources and should be confirmed by the restaurant:

- Hours, in `index.html` (Visit section, FAQ and the JSON-LD block in `<head>`). The printed menu offers cóctel de camarón on Sundays, so the "closed Sunday" hours may be out of date.
- Menu items and prices were transcribed from photos of the in-house menu posted online about six months ago
- Careers roles and how to apply
- To-go and large-party details in the FAQ
