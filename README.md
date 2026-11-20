# An Atlas of Medical Progress


<img width="800" height="451" alt="ezgif-52404aa689a9122d" src="https://github.com/user-attachments/assets/bdf20e85-b4d3-4cb0-baf7-c612b9049283" />


**Live site:** http://www.alexdavidson.me/medical-progress-atlas/

An interactive world map and timeline of 238 documented medical milestones, from a healed amputation in Borneo about 31,000 years ago to mRNA vaccines and the complete sequence of a human genome in 2022. Each milestone opens a sourced card that sets out what happened, who was involved, what changed, what is uncertain or disputed and, where relevant, the harms connected with it.

The site is static: TypeScript and React, built with Vite. The map uses d3-geo with the equal-area Equal Earth projection and bundled Natural Earth outlines. It needs no server, API key or map-tile service.

## Using the atlas

- **Play**: watch milestones appear, either one milestone at a time ("Through milestones") or at a constant pace through time ("Through time"), at 0.5× to 4×. "Start from the beginning" rewinds to the earliest milestone.
- **Timeline**: drag anywhere along it (including over milestone marks or the playhead) to move through time, or click to jump; clicking a mark opens that milestone; focus it and use the arrow keys (Shift for bigger steps, Home and End for the ends). The default "All history, compressed" view gives six periods different widths, labelled with how many years each covers. "All history, even scale" draws time uniformly, and the period buttons zoom in.
- **Everything so far / Selected period**: show every milestone up to the playhead, or only those within a chosen number of years before it.
- **Map**: opens on a heatmap of where documented milestones cluster; point at a warm area to see how many are there and click to list them. Switch to individual milestones, or both, at any time. Tick **Life expectancy by country** to colour each country by its estimated life expectancy at birth in the year shown, from Our World in Data (estimates mainly from 1950; earlier where they exist). Clusters show how many milestones they contain; click to zoom in or list them. Modern borders can be switched off.
- **Filters**: categories (with "only" to isolate one), kinds of milestone, and an option to include milestones tagged with a category as well as those whose primary category it is.
- **Cards**: click any dot, feed entry or list entry. Earlier and Later step through the dataset in date order. Copy link shares the exact view.
- **Stories**: six guided routes: anaesthesia, infection, vaccination and eradication, seeing inside the body, safer childbirth, and caring for the mind.
- **Keyboard**: Space plays or pauses, comma and full stop step between milestones, Esc closes, + and − zoom the map. A skip link leads to the milestone panel.

Every view is shareable: the year, mode, filters, timeline zoom, story step and selected milestone are kept in the URL, e.g. `#y1846--e-ether-anaesthesia`.

## Project layout

```
data-src/            the dataset, as hand-edited JSON (one file per period) and stories.json
scripts/
  validate-data.mjs  validates data-src/, writes public/data/atlas.json and docs/BIBLIOGRAPHY.md
  check-links.mjs    checks that every source URL and DOI still resolves
src/
  App.tsx            state, playback, URL sync, layout
  components/        MapView, Timeline, EventCard, Panels (feed, list, stories, about, legends)
  lib/               dates (no-year-zero arithmetic, scales), density, clustering, URL state, taxonomy
tests/               unit tests (dates, scales, density, clustering, URL state) and dataset tests
public/              map outlines, generated dataset, favicon, social preview image
docs/                methodology, schema guide, bibliography, deployment
.github/workflows/   GitHub Pages deployment
```

## Commands

```
npm ci                # install
npm run dev           # local development server
npm run validate      # check the dataset and regenerate the bibliography
npm test              # run the tests
npm run check-links   # check source URLs (needs internet access)
npm run build         # validate, type-check and build to dist/
npm run preview       # serve the built site locally
```

## Documentation

- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md): inclusion criteria, evidence standards, taxonomy, dates and time scales, map and density methods, coverage biases.
- [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md): every field, with real examples, and a checklist for adding a milestone.
- [`docs/BIBLIOGRAPHY.md`](docs/BIBLIOGRAPHY.md): all 333 sources, generated from the data, with the claims each was checked for.
- [`docs/DEPLOY.md`](docs/DEPLOY.md): exact steps for GitHub Pages, Cloudflare Pages, Netlify or any static host.

## Adding the Wikipedia timeline

Wikipedia's [Timeline of medicine and medical technology](https://en.wikipedia.org/wiki/Timeline_of_medicine_and_medical_technology) was read on 19 November 2026 and every entry (311) was logged in `research/wikipedia-queue.json` with a status:

| Status | Meaning | Count |
|---|---|---|
| `added` | Verified from independent sources and added (several entries were merged into one milestone, so the 197 entries became 178 milestones) | 197 |
| `duplicate` | Already covered by an existing milestone | 36 |
| `no-event` | Names a person, role or general practice but describes no datable event | 67 |
| `rejected` | Could not be verified from independent sources, or is not a medical milestone (for example, a patent never used clinically or a product launch) | 11 |
| `pending` | Not yet researched | 0 |

Wikipedia is used only to suggest entries, never as a source. Each one is checked against at least two independent sources, as for the rest of the atlas, and cards say "Suggested by Wikipedia's Timeline…". Verification corrected many of Wikipedia's dates and attributions (for example, the first human ECG was Waller's in 1887, not Einthoven's; Pasteur's first human rabies vaccination was in 1885, not 1882; the 1879 "cholera vaccine" was for chicken cholera; concave spectacle lenses for short sight are first documented in the 1460s, not 1300; the 2013 "lab-grown liver" was liver buds transplanted into mice). The notes field in the queue records each correction, merge and rejection.

All four batches are complete (1600–1900; 1956–2022; 1901–1955; before 1600), and the batch files used are in `research/batches/`. To add a batch from another list, write a batch file in the same format and run `python3 research/add_batch.py research/batches/<file>.json`, which files each entry by date, records the queue decisions and links related milestones once both exist.

## Status

### Complete

- 238 milestones across 8 categories, 8 milestone types and every inhabited continent, from about 29,050 BCE to 2022, each with dated ranges and their basis, places at justified precision, people, what changed, limitations, sources and related milestones. The dataset includes 37 contested entries, 24 with recorded harms, 54 with several locations and 6 that cannot be mapped.
- 178 of the 238 were suggested by Wikipedia's *Timeline of medicine and medical technology* and verified independently to the same standard. Every one of its 311 entries has been decided; see "Adding the Wikipedia timeline" above.
- 1,070 distinct sources, each recorded with the claims it was checked for. Early, disputed and "first" claims have at least two independent sources, except 5 entries that are openly marked as single-source.
- Map with a smooth heatmap (the default), dots and combined views, clustering, uncertainty circles, linked locations and an optional modern-borders layer. Timeline with compressed, even and per-period scales, two playback modes, four speeds, cumulative and period views, pulses for new milestones, an optional "Follow new milestones" mode, a feed, a searchable list, six stories, shareable URLs, keyboard control, reduced-motion support and a mobile layout.
- An optional life expectancy layer by country (Our World in Data, CC BY 4.0), driven by the same timeline.
- A validator that blocks the build on data errors, 31 automated tests, a link checker, generated bibliography, a social preview image and a GitHub Pages workflow.

### Uncertain or not done

- **Links were not machine-checked from the build environment**, which could not reach the source sites. Every source was consulted during research, but URLs change; run `npm run check-links` before publishing.
- **Single reviewer.** All entries were researched and checked by one compiler. An independent historian's review of each card, especially those outside European and North American history, would strengthen the dataset.
- **Five single-source entries** (Liang Tebo, Villabruna, Mehrgarh, Nubian tetracycline, Bunyoro caesarean) rest on one study or account each.
- **Disputes remain** over dating, priority or interpretation in 37 entries, notably the date of the Suśruta compendium, the ethics of Sims's fistula operations, the vaccine Pasteur actually used at Pouilly-le-Fort, the origins of variolation, the reinterpretation of the Ensisheim trepanation and the Ross–Grassi priority dispute over malaria transmission. Each is explained in its card rather than resolved.
- **Coverage is uneven** (see the methodology): 147 of 238 milestones date from after 1800, the USA and UK are the most frequent locations, and sources are almost all in English.
- **Colour:** neighbouring legend colours pass a colour-vision check, but some pairs (notably green and orange) remain hard to distinguish for people with red–green colour blindness. Every view therefore also names categories in text, and the legend can isolate a category.
- **No images** are used, because licences for suitable images could not all be confirmed.
- The site has been tested in Chromium at desktop and phone sizes; it has not been tested in Safari or Firefox or with a screen reader.

Historical significance described here is not present-day clinical advice.
