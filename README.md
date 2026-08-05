# CEO Lounge

Static marketing site for CEO Lounge and its two sub-brands, XLounge and XSearch.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page. The composed artwork carries all headline copy; only the Enter and Contact links are live DOM. |
| `enter.html` | Choice screen — XLounge or XSearch. |
| `xlounge.html` | The members' circle: Lounge, CEO Iconfluence, CEO Cricket Challenge, CEO Chef de Cuisine. |
| `xsearch.html` | Executive search for critical roles. |

Flow: `index.html` → **Enter** → `enter.html` → `xlounge.html` / `xsearch.html`

## Running locally

No build step or dependencies — it is plain HTML/CSS/JS.

```bash
python -m http.server 8899 --directory .
```

Then open http://localhost:8899.

## Deploying

Hosted on Netlify. `netlify.toml` publishes the repo root with no build
command, since there is nothing to compile. Connect the repo in Netlify and it
deploys on every push to `main`.

## How the layout works

Every page renders the door artwork at an identical size and position, so the
brand mark baked into the image lands in the same place throughout.

- The artwork is fitted whole, never cropped to fill. A crop-to-fill would
  slice the baked logo and feature row off on a 16:9 display.
- `--art-w` / `--art-h` in `css/style.css` hold the rendered artwork box. Both
  the header links and the content indent are derived from them, so they track
  the artwork at any viewport instead of keeping their own copy of the maths.
- Hero type is sized in `em` off `--u` (1% of the artwork width) so headings
  scale with the artwork rather than the raw viewport, with `max()` floors that
  keep body copy readable on small screens.
- `scrollbar-gutter: stable` on `<html>` matters: `100vw` includes the
  scrollbar gutter, so without it the non-scrolling landing page measured ~15px
  wider than the scrolling pages and rendered the artwork ~3% larger.

Asset URLs carry a `?v=` query. Bump it when editing `css/style.css` or
`js/main.js`, otherwise browsers serve a stale copy.

## Known limitation

The artwork is 3:2 landscape, so on a portrait phone it renders as a small band
with the rest of the screen falling back to black. A portrait crop of the
artwork would fix this properly for the landing and enter screens.
