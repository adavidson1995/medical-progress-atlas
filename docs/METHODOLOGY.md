# Methodology

This note explains what the atlas includes, how each entry was checked, how the map and timeline are built, and where the coverage is weak. It describes release 2.0 of the dataset: 238 milestones, 1,070 distinct sources and 6 curated stories.

## 1. What a "milestone" is

"Medical milestone" is used as an umbrella term. It is not a claim that each entry was a turning point, the first of its kind, or a step on a straight road to modern medicine. Every entry has one **milestone type**, which says what kind of contribution it was:

| Type | Meaning | Count |
|---|---|---|
| Practice | Evidence that something was done, from remains or records. Does not by itself show purpose or effectiveness. | 10 |
| Observation | A recorded description, such as a clinical description of a disease. | 16 |
| Discovery | A new finding about the body, a disease or a substance. | 17 |
| Invention | A new device, technique or preparation. | 8 |
| Clinical demonstration | An early documented use in patients, in a particular setting. | 11 |
| Clinical evidence | A comparison or trial testing whether a treatment or measure works. | 9 |
| Implementation | Organised public-health action or widespread adoption. | 9 |
| Eradication | Certified worldwide elimination of a disease. | 1 |

Separately, each entry records the **kind of evidence** behind it (archaeological remains, a surviving text, a published report by those involved, an eyewitness account by an outsider, a trial, programme records, or laboratory work). The type answers "what happened?"; the evidence answers "how do we know?".

## 2. Inclusion criteria

An event was included only if all of the following held:

1. **It is documented.** There is an excavation report, a surviving text, a contemporary publication, institutional records or a body of peer-reviewed historical scholarship that describes it.
2. **It changed what people could know or do about health,** at least locally, or it is the earliest secure evidence of a practice that did.
3. **It can be dated,** even if only to a range, and the basis of the date can be stated.
4. **Its claims could be verified** against sources that were read for this project (see section 4).

The selection also aimed for breadth: every inhabited continent, every period from the Upper Palaeolithic to the 2020s, and every category. Where a familiar Western "first" had a documented earlier or parallel counterpart elsewhere (general anaesthesia in Japan, inoculation in China, Africa and the Ottoman world, caesarean section in Bunyoro, IVF in Kolkata), both are presented and the relationship is explained rather than ranked.

What was **not** included: undated traditions; claims found only in popular summaries; events whose only support was a search snippet or an AI-generated summary; and impact figures (lives saved, cases prevented) that could not be traced to a primary estimate.

### Earliest starting point

The timeline starts at 30,000 BCE so that it includes the earliest milestone in the dataset: the healed amputation from **Liang Tebo, Borneo**, dated to at least 31,000 years ago (Maloney et al., *Nature*, 2022). This is the earliest defensible evidence found of a deliberate, survived surgical procedure. Skeletal evidence that injured or disabled people were looked after, without a deliberate intervention, was not counted as a milestone: it shows care, not a medical procedure. The Liang Tebo find rests on one study, which is flagged in its card.

### Entries suggested by Wikipedia (releases 1.1 and 2.0)

Release 1.1 added 21 milestones suggested by Wikipedia's *Timeline of medicine and medical technology*, covering its entries from 1600 to 1900. Release 2.0 works through the rest of the list (before 1600, and 1901–2022), bringing the total suggested by Wikipedia to 178 milestones. All 311 entries on the list now have a recorded decision: 197 added (some merged), 36 already covered, 67 that describe no datable event and 11 rejected. Wikipedia was used only as a list of candidates, never as a source, and copies of Wikipedia on other sites were excluded in the same way. Each candidate was researched afresh and had to meet the same criteria as every other entry. Where the Wikipedia entry was wrong, the atlas follows the sources and the queue file records the correction. Where two Wikipedia entries describe one event (Blackwell's degree and the Female Medical College; Bennett's and Virchow's descriptions of leukaemia; Pasteur's chicken cholera and anthrax vaccines; Servetus's and Colombo's accounts of the pulmonary circulation; Bacon's lenses and the invention of spectacles) they were merged. Entries that only name a person, with no event, were not added. Entries resting on legend or on a single interested claim, such as Imhotep as a physician or a patent never used on patients, were rejected with a note in the queue. Cards for the added entries say that Wikipedia suggested them.

Including an entry does not mean endorsing it: homeopathy is included because it shaped medical history, and its card records that systematic reviews have found no reliable evidence that it works.

## 3. Taxonomy

### Categories (one primary category per milestone, setting its colour)

| Category | Scope | Count |
|---|---|---|
| Diagnosis, imaging & laboratory | Recognising and measuring disease | 7 |
| Surgery & anaesthesia | Operations, dentistry, wound care, pain control during procedures | 14 |
| Public health & health systems | Sanitation, quarantine, epidemiology, hospitals, organised care | 6 |
| Medicines & therapies | Drugs, remedies and non-surgical treatments | 16 |
| Maternal, reproductive & newborn care | Pregnancy, childbirth, fertility, newborn care | 9 |
| Vaccination & prevention | Inoculation, vaccines, other disease-specific prevention, eradication | 11 |
| Mental health & neurology | Mental illness, nervous system and senses | 4 |
| Anatomy, physiology & disease mechanisms | How the body works and what causes disease | 14 |

Milestones may carry further categories as **tags**. The legend can include tagged milestones ("Also show milestones that list a category as a secondary tag"), which is off by default so that each dot appears under exactly one colour.

### Changes from the brief's suggested taxonomy

- **Medical technology and devices became a cross-cutting theme, not a category.** Every device in the dataset serves a purpose that already has a category (the stethoscope serves diagnosis, obstetric forceps serve childbirth, the CT scanner serves imaging). A separate device category would have forced a choice between "what it is" and "what it is for" for every instrument. Devices are tagged with the theme `devices` and listed in each card.
- **Vaccination was kept apart from other public health,** because the history of inoculation, vaccination and eradication is long and coherent enough to be read on its own, and because one of the requested stories follows it.
- **Eight categories rather than nine,** because eight is the most that can be given distinguishable colours (see section 6).

## 4. Evidence standards and verification

- **Claims checked against the source's own text.** Each source is recorded with the specific claims it was checked for (the `supports` field, shown as "Checked for" in each card and listed in the bibliography). Web search was used to find sources; a search snippet or AI-generated summary was never accepted as verification.
- **Source quality.** Peer-reviewed journals (most via PubMed Central), excavation reports, university and museum collection pages, archival catalogues, the WHO, national academies and the Nobel Foundation.
- **Two independent sources for early, disputed or "first" claims.** Where only one credible source could be found, the entry is marked `singleSource`, and the card says so. Five entries are single-source: Liang Tebo, Villabruna dental treatment, Mehrgarh dentistry, Nubian tetracycline and the Bunyoro caesarean account.
- **"First" claims are qualified.** The validator warns when a title or summary says "first" or "earliest" and nothing in the entry's limitations or contested field explains what kind of "first" it is. All such warnings were resolved by adding the qualification (for example, "the first transplant of a heart from one person to another"). Phrases such as "earliest known" and "earliest surviving" are treated as already qualified.
- **No invented details.** Citations carry only fields that were seen in the source: where authors, volume or pages were not visible on the page read, they are omitted rather than reconstructed. Coordinates, dates and people are given only to the precision the sources support.
- **Contested points are stated, not settled.** 37 entries have a "What is uncertain or disputed" section (for example, the dating of the Suśruta compendium, Ross and Grassi's priority on mosquito transmission, Long and Morton on ether, the reinterpretation of Ensisheim).
- **Harms are recorded.** 24 entries include a "Harms and exclusions" section where the sources describe unethical experimentation, coercion, exploitation or exclusion connected with the milestone (for example, the orphaned children used as living carriers of vaccine on the Balmis expedition).
- **Historical significance is not clinical advice.** Every card ends with a statement to that effect, and no entry recommends any treatment.

### Limits of the verification

- Each source was read once by the compiler. There was no second, independent reviewer.
- Automated link checking could not be run from the environment where the site was built (outbound connections to the source sites were blocked). Run `npm run check-links` before each release; see `DATA_SCHEMA.md`.
- Some sources were read as abstracts or institutional summaries rather than full texts. This is recorded in the citation where it applies (for example, "(PubMed abstract)").
- For the release 2.0 additions from the Wikipedia list, many sources were checked against the passages of each page returned by the search tool rather than a full reading of the page, because most source sites could not be opened directly. Each `supports` field lists only what those passages showed, and claims that no passage supported were removed before the entry was added. A full reading of each source by a second reviewer would strengthen these entries.

## 5. Dates and the timeline

- **No year zero.** Data use historical years (negative = BCE). The year after 1 BCE is 1 CE. All arithmetic converts to astronomical numbering first (1 BCE = 0, 2 BCE = −1), and the tests check that no date, label or URL can produce year 0.
- **Uncertain dates are ranges.** Every date has `start`, `end`, a display string, a precision and a written basis. Radiocarbon "years ago" dates are converted using 1950 as the reference year, as is conventional, and the conversion is stated.
- **Points and spans are distinguished.** A *point* happened once, somewhere within its range; a *span* genuinely lasted from start to end (a trial, an expedition, a vaccination campaign).
- **How uncertain dates appear.** In the "Everything so far" view a milestone appears when the playhead reaches its earliest plausible year, is drawn hollow while the playhead is inside its range, and is filled once the range has passed. In the "Selected period" view a milestone is shown if any part of its range overlaps the period and is solid only if the whole range falls inside it. Markers for approximate dates have a dashed outer ring.
- **The compressed scale is labelled, never silent.** The default timeline gives six bands different widths: 30,000–3500 BCE, 3500 BCE–500 CE, 500–1500, 1500–1800, 1800–1900 and 1900–now. Each band is labelled with the number of years it covers and its tick interval, the boundaries are dashed, and a note under the timeline says it is not to scale. "All history, even scale" draws time uniformly, and choosing a period zooms to an even scale within it.
- **Playback.** "Through milestones" moves from one milestone to the next at a fixed interval (2.6 s at 1×). "Through time" moves the playhead across the screen at a constant speed (90 s for the whole axis at 1×), so years pass faster in compressed bands; the current rate in years per second is always shown.

## 6. The map

- **Projection.** Equal Earth, an equal-area projection, so that a cluster of milestones is not enlarged or shrunk by the map itself.
- **Basemap.** Natural Earth country outlines at 1:110m, switching to 1:50m when zoomed in (public domain, via the `world-atlas` package). They are bundled with the site, so no tile service, API key or usage limit is involved. Modern borders can be switched off; a note explains that they are shown for orientation and are not historical boundaries.
- **Places.** Each location has its historical name and a present-day reference, a location type (findspot, documented practice, discovery site, trial site, implementation area, text origin) and a precision class. The validator enforces the decimal places allowed for each class: site and settlement two decimals (about 1 km); region and macro-region one decimal. Region and macro-region locations are drawn with a shaded circle showing the area the marker stands for.
- **Unknown places.** Six milestones have no reliable single location: the Suśruta compendium, Lind's scurvy trial at sea, the discovery of tetracycline (the sources name a company, not a laboratory), and three modern advances reported from many centres at once (the description of Brugada syndrome, the rotavirus vaccines and the hybrid closed-loop artificial pancreas). They appear in the list, the feed and the timeline but not on the map, and the feed says so. One location within the variolation milestone (Onesimus's homeland) is also unmapped. Where an entry is mapped to a stand-in place, such as an author's home city when the place of writing is unknown, its card says so.
- **Several places.** 54 milestones have more than one location, each with a stated role. Their locations are linked on the map when the milestone is selected or hovered.
- **Clusters.** Markers closer than 24 px on screen are grouped into a numbered cluster, whose ring shows the colours of the milestones inside it. The count is of distinct milestones, so a multi-location milestone counts once. Clicking a cluster zooms in or, when its members share a location, lists them.

### Colour

Eight category colours were chosen for lightness and saturation balance and checked with a colour-vision simulation. In legend order, every neighbouring pair passes the check for common colour-vision deficiencies (smallest difference ΔE 9.1). Not every pair passes: on the map any two categories can sit side by side, and some pairs (for example the green of prevention and the orange of surgery) are hard to tell apart for people with red–green colour blindness. Several lighter colours also have low contrast against the land. For that reason colour is never the only cue:

- markers have a dark outline;
- hovering over a legend entry dims every other category on the map;
- the "only" button beside each category shows that category alone;
- every tooltip, card, feed entry and list entry names the category in words;
- the "All milestones" list is a full text alternative to the map.

### Density layer

The heatmap is labelled **"Density of documented milestones in this atlas"**. It is the map's default view, drawn as a continuous heat surface on a fixed logarithmic colour scale (ColorBrewer YlOrRd, from pale yellow at 0.125 to deep red at 16 milestones per million km²; lightness falls steadily, so order does not depend on hue). Pointing at a warm area shows how many milestones lie within about 34 pixels, and clicking lists them. It is a kernel density estimate:

- every milestone has a total weight of 1, and no importance scores or impact estimates are used;
- a milestone with *n* mapped locations contributes 1/*n* at each, so linked locations do not inflate density (the tests check that total weight is conserved);
- each location is spread with a Gaussian kernel of σ = 500 km, widened to √(500² + (r/2)²) km for a location of uncertainty radius *r*;
- values are milestones per million km², computed in the equal-area plane, so a given shade means the same density anywhere;
- the colour scale and the faint contour lines at 0.25, 0.5, 1, 2, 4, 8 and 16 are fixed and never rescale during playback or filtering.

It shows where this selection of documented events is concentrated. It does not measure medical achievement, health, or the importance of any place.

### Life expectancy layer

An optional layer, "Life expectancy by country", colours each present-day country by its estimated life expectancy at birth in the year shown on the timeline.

- **Source.** Our World in Data's long-run series (dataset 1892 in the owid-datasets repository). It combines Clio Infra's country estimates before 1950 (Zijdeman and Ribeira da Silva, 2015) with UN *World Population Prospects 2019* from 1950 to 2019. Licence: CC BY 4.0. The CSV is kept unmodified in `data-src/external/owid-life-expectancy/`, and `npm run data:life` rebuilds `public/data/life-expectancy.json` from it.
- **Coverage.** 233 countries and territories, 172 of which are large enough to appear on the 1:110m map. Before 1950 only 91 countries have any estimate, many of them only at intervals of five or ten years. The earliest values are for the United Kingdom from 1543 and Sweden from 1751. Regional and world aggregates in the source file are left out.
- **Time rule.** Each country shows its most recent estimate from the previous ten years and is otherwise hatched as "no estimate". There is no interpolation between estimates. After 2019, the last year in the file, the 2019 values are held, and the legend says so; the falls in 2020–2021 are therefore not shown.
- **Colour.** Seven fixed bins (under 30, 30–39 … 80 and over) on a single blue-green scale that gets darker as life expectancy rises. This keeps it clearly separate from the warm colours of the milestone heatmap. When both layers are on, the heatmap is drawn semi-transparently on top.
- **Caveats.** Figures are for present-day territories, including for years before those states existed. Life expectancy at birth is strongly affected by infant and child deaths. The layer is shown for context and implies no causal link with any milestone.

## 7. Coverage and known biases

The dataset is a curated selection of 238 events, not a complete history. Its gaps follow the gaps in surviving records and in published scholarship:

- **Recent periods dominate.** 147 of 238 milestones begin after 1800, and 122 after 1900; 4 fall before 3500 BCE. Adding Wikipedia's list increased this skew, since about half of its entries are from the twentieth century. More recent events are better documented, not necessarily more important.
- **Europe and North America are over-represented.** Locations in the USA (59 milestones) and the UK (38) are the most frequent, followed by Italy (24), France (15) and Germany (13), and 140 of the 178 milestones suggested by Wikipedia are placed only in Europe or North America. Before 1600 the balance differs: 42 of the 77 earlier milestones lie outside Europe and North America, mostly in Egypt, Mesopotamia, Syria, Iran, South Asia and China. The atlas also deliberately adds events from Borneo, Pakistan, Sudan, Peru, Mexico, Uganda, Nigeria, Bangladesh, Colombia, Guinea, Ghana, Kenya and Malawi, but the weight of English-language scholarship still shows.
- **Sources are mostly in English.** Scholarship in Chinese, Arabic, Persian, Japanese, Spanish, Portuguese and other languages was not consulted directly, and some entries rely on English-language summaries of that work.
- **Written and institutional records favour certain people.** Named individuals are usually men with access to publication. Women healers, midwives, enslaved people, Indigenous practitioners and patients appear mainly when an outsider recorded them. Cards name communities and unnamed practitioners where the sources allow.
- **Archaeology survives unevenly.** Bone and teeth preserve better than soft-tissue treatment; arid and cold regions preserve better than humid tropics; some regions have been excavated far more than others.
- **The density layer inherits all of the above.** It reflects this selection and these records.

## 8. Things deliberately left out

- **Images.** The schema has an image field with credit and licence, but this release uses no images, rather than include pictures whose licence could not be confirmed.
- **Impact figures.** No lives-saved or cases-averted estimates are shown, because many published figures are model-based and contested, and including some but not others would distort comparison.
- **Present-day guidance.** The atlas describes historical significance only.
