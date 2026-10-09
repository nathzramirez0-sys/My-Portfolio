# Portfolio

A static site: plain HTML, CSS and JavaScript, with Three.js loaded from a
CDN for the 3D map. No build step.

To preview it, serve the folder (opening `index.html` directly won't load
the 3D map, because browsers block modules from `file://`):

```bash
python -m http.server 5510
```

Then open `http://localhost:5510/`.

| File | What it holds |
|------|---------------|
| `index.html` | Every section of the page |
| `styles.css` | Colours, type and layout. The palette is at the top as tokens |
| `data.js` | What the map and the ask box know: rings, points, links between them, answers, visitor lenses, and the build log's weekly commits and milestones |
| `scene.js` | The 3D map (Three.js): rings, points, trails, packets, beams, the instrument readout, dragging, hovering, clicking |
| `ui.js` | The ask box, the readout panel, the visitor lens, the build-log chart, and the "See it on the map" links |
| `llms.txt` | A plain-text copy of the page for AI agents and crawlers |
| `favicon.svg` | The tab icon |
| `og-image.png` | The picture shown when the link is shared (1200×630) |
| `404.html` | The page GitHub shows for a mistyped address |
| `Jonathan-Cercenina-Ramirez-CV.pdf` | My one-page CV, linked from About and Contact |
| `cv/cv.html` | The source the CV PDF is printed from |

After changing a CSS or JS file, raise the `?v=5` number on its link in
`index.html` (all four use the same number). Browsers otherwise keep
showing the old copy.

## Details on the page

Name, education, location, languages and the About paragraph come from my
CV. Left out until I have one: a LinkedIn link.

## Rebuilding the CV

Edit `cv/cv.html`, then print it to PDF with Microsoft Edge (it keeps the
fonts, selectable text and clickable links, and must stay at two A4 pages). Give
Edge its own profile folder, or it does nothing while Edge is already open,
and wait a few seconds: the file lands just after the command returns.

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --user-data-dir="C:\\Temp\\edge-print" --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="C:\\Users\\Jonathan\\Desktop\\My-Portfolio\\Jonathan-Cercenina-Ramirez-CV.pdf" "file:///C:/Users/Jonathan/Desktop/My-Portfolio/cv/cv.html"
```

The layout follows a PHINMA-style CV sample: Montserrat, a grey sidebar
(`#5d6661`) with green (`#2cdd98`) headings, green bars between sections,
and a second page that shows three projects with pictures. The screenshots
are in `cv/assets`: ThesisFlow's come from its README, and FergBentables'
from its 1.1.3 commit, which shows the app's current name. Keep wide letter
spacing off small text: past about 0.15em, PDF text extraction (and so
applicant-tracking systems) reads "F U L L - S T A C K". The QR code in the
sidebar is an inline SVG of the portfolio's address, made with the Python
library `segno` (`segno.make(url, error="m").svg_inline(border=0)`); it
only needs remaking if the address changes.

It leaves out my phone number on purpose, since anyone can download it.

## Adding a project

1. Add a card to the "More projects" section in `index.html`, and a
   button for it in the hero's "Also built" list. A `project-lead` card
   takes half a row; there should be two of them, or none. `ui.js` shows
   as many "Also built" buttons as fit above the ask box and turns the
   rest into "+N more".
2. In `data.js`, add a point for it on the `projects` ring, link it to the
   tools and services it involved in `edges` (and to `core`), and add it
   to the "what else have you built?" answer.
3. Add a few lines to `llms.txt`, and the project to `cv/cv.html`
   (then rebuild the PDF; page 1 must not overflow).

## Keeping the build log current

The chart under "How it was built" reads `build.weeks` in `data.js`: commits
per week (Monday to Sunday) on the thesis repository, starting from
`build.start`. To recount, run this in the thesis folder and total each week:

```bash
git log --format=%ad --date=short
```

Milestones are dated commits in plain words; add one to `build.milestones`
with the week it falls in and, optionally, the map point it relates to.

## How "Ask" works

No AI model runs on the site. A question is matched by keyword against the
answers and the map's points in `data.js`, forgiving typos and word endings
("restores" finds "restore"). The best match streams into the readout and
the map lights up the points it came from. Questions it can't match get an
honest "not covered here" and your email address. It works on free static
hosting with no API key.

If WebGL isn't available, the map is replaced by a short note and everything
else, including the ask box, still works.

## Publishing on GitHub Pages

The site is published from the `main` branch of
`nathzramirez0-sys/My-Portfolio`, at
<https://nathzramirez0-sys.github.io/My-Portfolio/>. A push rebuilds it in
about a minute. A custom domain can be added under Settings → Pages.
