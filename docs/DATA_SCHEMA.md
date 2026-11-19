# Data schema and how to add a milestone

The dataset lives in `data-src/` as hand-edited JSON. `npm run validate` checks every entry, merges the files into `public/data/atlas.json` (the file the site loads) and regenerates `docs/BIBLIOGRAPHY.md`. `npm run build` always validates first, so a dataset with errors cannot be deployed.

```
data-src/
  01-prehistory.json      before 3500 BCE
  02-ancient.json         3500 BCE – 500 CE
  03-medieval.json        500 – 1500
  04-early-modern.json    1500 – 1800
  05-nineteenth.json      1800 – 1900
  06-twentieth.json       1900 – now
  stories.json            curated stories
```

The file split is only for editing convenience. Any file named `NN-something.json` holding an array of milestones is read, and the order within files does not matter: the validator sorts milestones chronologically.

The TypeScript definition is in `src/types.ts`, and the validator in `scripts/validate-data.mjs` is the authority on what is allowed.

## Year convention

All years are **historical years**: negative numbers are BCE, positive are CE, and **there is no year 0**. 1 BCE is `-1`; 1 CE is `1`. The validator rejects `0`.

For "years ago" dates from radiocarbon or other scientific dating, subtract 1950 (the conventional reference year) and say so in `date.basis`. For example, 31,000 years ago becomes about 29,050 BCE (`-29050`).

## Milestone fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Lowercase words joined by hyphens, e.g. `snow-broad-street`. **Never change an id once published**: it is used in shared links. |
| `title` | yes | A plain statement of what happened, ideally under 70 characters. Avoid unqualified "first". |
| `summary` | yes | One or two sentences, under 320 characters. |
| `explanation` | yes | The longer account. Separate paragraphs with a blank line (`\n\n`). |
| `date` | yes | See below. |
| `type` | yes | `practice`, `observation`, `discovery`, `invention`, `demonstration`, `clinical-evidence`, `implementation` or `eradication`. Definitions are in `METHODOLOGY.md`. |
| `evidence` | yes | One or more of `archaeological`, `surviving-text`, `published-report`, `eyewitness-account`, `trial`, `programme-records`, `laboratory`. |
| `category` | yes | The primary category, which sets the dot colour: `diagnosis`, `surgery`, `public-health`, `therapeutics`, `maternal`, `prevention`, `mind-brain`, `mechanisms`. |
| `tags` | yes | Further categories (may be empty). Must not repeat the primary category. |
| `themes` | yes | Free-text cross-cutting themes, e.g. `devices`, `Indigenous knowledge`, `colonial medicine`. |
| `locations` | yes | Zero or more places; see below. An empty array means "not mapped". |
| `locationNote` | no | Explain any uncertainty about the place. |
| `people` | yes | `{ name, role }` for individuals, teams or communities, only as supported by sources. Use descriptions such as "Unnamed midwives at the clinic" where the sources do not name them. May be empty. |
| `whatChanged` | yes | What could be known or done afterwards that could not before. |
| `whyItMattered` | yes | Its significance, stated cautiously. |
| `limitations` | yes | A list of what is uncertain, limited or often overstated. |
| `contested` | no | Disputed dating, priority, attribution or interpretation. |
| `harms` | no | Unethical experimentation, coercion, exploitation or exclusion connected with the milestone, as described in the sources. |
| `sources` | yes | See below. At least two unless `singleSource` is set. |
| `singleSource` | no | `true` if only one credible source could be found for a key claim. |
| `sourceNote` | if `singleSource` | Explains the single-source situation; shown in the card. |
| `related` | yes | Ids of related milestones (may be empty). Every id must exist. |
| `image` | no | `{ file, credit, licence, sourceUrl }` or `null`. Not used in this release. |
| `suggestedBy` | no | `"wikipedia-timeline"` if the entry came from Wikipedia's timeline. Shown on the card. The entry must still be verified from its own sources. |

### `date`

From `edwin-smith-papyrus`:

```json
"date": {
  "start": -1650,
  "end": -1550,
  "display": "c. 1600 BCE (copy)",
  "kind": "point",
  "approximate": true,
  "precision": "century",
  "basis": "The surviving copy is dated to about 1600 BCE. The original it was copied from is older; estimates range widely and are uncertain."
}
```

- `start` and `end` are the earliest and latest plausible years. For a securely dated single year, they are equal.
- `kind`: `point` if it happened once somewhere in the range; `span` if it genuinely lasted from start to end.
- `approximate`: `true` when the boundaries are themselves uncertain. A display beginning "c." must be approximate.
- `precision`: `day`, `month`, `year`, `decade`, `century`, `millennium` or `radiometric`.
- `display`: what readers see. BCE dates must say BCE or "years ago".
- `basis`: how the date is known and what is uncertain about it. Required.

### `locations[]`

From `ragusa-quarantine`:

```json
{
  "name": "Ragusa",
  "modern": "Dubrovnik, Croatia",
  "lat": 42.64,
  "lon": 18.11,
  "radiusKm": 5,
  "precision": "settlement",
  "type": "implementation-area"
}
```

- `name` is the name used at the time; `modern` is a present-day reference for orientation. Avoid projecting modern national identities onto the past: write "Ottoman Empire" or "Kingdom of Bunyoro" in `name`, and put the modern country only in `modern`.
- `type`: `archaeological-findspot`, `documented-practice`, `discovery-site`, `trial-site`, `implementation-area` or `text-origin`.
- `precision`, `radiusKm` and the decimal places allowed in the coordinates must agree:

| precision | use for | radiusKm | max decimals |
|---|---|---|---|
| `site` | a known building or excavation | 0–10 | 2 |
| `settlement` | a town or city | 0–40 | 2 |
| `region` | a province, river valley or karst area | 20–600 | 1 |
| `macro-region` | a large country or part of a continent | 300–3000 | 1 |

- If the place cannot be located, set `lat` and `lon` to `null` (both). The milestone then stays in the list and timeline but not on the map.
- If there are several locations, give each a `role` (what happened there). The milestone still counts once in the density layer.

### `sources[]`

From `snow-broad-street`. Optional fields `doi` and `pages` go alongside these.

```json
{
  "citation": "London School of Hygiene & Tropical Medicine. About John Snow (John Snow bicentenary).",
  "url": "https://johnsnowbicentenary.lshtm.ac.uk/about-john-snow/",
  "kind": "university",
  "supports": "Analysis of death addresses and interviews; council persuaded to remove the handle on 8 September 1854; outbreak beginning 30 August 1854; Snow's work in anaesthesia."
}
```

- `kind`: `primary`, `journal`, `book`, `museum`, `institution`, `university` or `archive`.
- `supports` (required) records exactly which claims you checked against this source. It appears in the card ("Checked for") and in the bibliography.
- Include `doi` and `pages` **only if you saw them** in the source. Do not reconstruct citation details from memory; where the authors were not visible, cite the title and the database, e.g. "(PubMed Central)".
- Prefer `https`. The validator warns on `http`.

## Stories (`stories.json`)

```json
{
  "id": "infection",
  "title": "Understanding and preventing infection",
  "dek": "One-sentence introduction shown in the Stories list.",
  "steps": [
    { "eventId": "ragusa-quarantine", "note": "One or two sentences linking this step to the story." }
  ]
}
```

Stories may only reference existing milestone ids. Notes should connect steps without implying that each led inevitably to the next.

## Adding a milestone: checklist

1. **Find at least two independent, reliable sources** that describe the event: peer-reviewed articles, excavation reports, institutional or museum records, archives. For anything early, disputed or described as a "first", two independent sources are required unless you mark it `singleSource` and explain why.
2. **Read the sources** for each claim you intend to make, and write what you checked in each `supports` field.
3. **Choose the id, type, evidence and category.** Pick the category for the milestone's main purpose; add others as tags.
4. **Write the date range honestly** and explain its basis. Do not pin an uncertain date to a single year.
5. **Place it** at the precision the sources allow. A city is `settlement`; a region is `region`. If you cannot place it, use `null`.
6. **Write the text in cautious language.** Say what the sources say; qualify any "first" ("earliest known", "first documented in", "first randomised trial of"); put disputes in `contested` and harms in `harms`.
7. **Link related milestones** in both directions where it helps readers.
8. **Validate and test:**

   ```
   npm run validate      # errors must be fixed; review the warnings
   npm test              # unit and dataset tests
   npm run check-links   # needs internet access; review anything reported
   npm run dev           # look at the entry on the map, timeline and card
   ```

9. **Rebuild and redeploy** (see `DEPLOY.md`).

## What the validator checks

Errors (the build stops):

- id format, uniqueness and required text fields;
- known category, tags, type, evidence kind, location type and precision;
- integer years, no year 0, no future years, `start` ≤ `end`, BCE/CE consistent with the display text, "c." implies approximate, basis present;
- coordinates in range, both or neither present, decimal places and radius consistent with precision;
- at least one source, each with a citation, URL, kind and `supports`; well-formed DOI; fewer than two sources requires `singleSource` and `sourceNote`;
- related ids and story event ids exist; no self-links; no duplicate titles.

Warnings (review, then decide):

- long titles or summaries, no limitations, missing roles on multi-location entries;
- "first" or "earliest" in the title or summary without a qualification in `limitations` or `contested`;
- `http` URLs;
- possible duplicates (same category, overlapping dates, within 25 km).
