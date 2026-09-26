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

After changing a CSS or JS file, raise the `?v=5` number on its link in
`index.html` (all four use the same number). Browsers otherwise keep
showing the old copy.

## Details on the page

Name, education, location, languages and the About paragraph come from my
CV. Left out until I have them: a LinkedIn link and a résumé download.

## Adding a project

1. Add a card to the "More projects" section in `index.html`, and a
   button for it in the hero's "Also built" list.
2. In `data.js`, add a point for it on the `projects` ring, link it to the
   tools and services it involved in `edges` (and to `core`), and add it
   to the "what else have you built?" answer.
3. Add a few lines to `llms.txt`.

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

1. Create a repository named `Nathan-281000.github.io` on GitHub.
2. Push this folder's contents to it.
3. The site appears at `https://nathan-281000.github.io/` within a minute
   or two. A custom domain can be added later under Settings → Pages.
