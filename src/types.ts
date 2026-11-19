/**
 * Data model for An Atlas of Medical Progress.
 *
 * YEAR CONVENTION
 * All years in the data are *historical* years: negative = BCE, positive = CE.
 * There is no year 0 (1 BCE is followed directly by 1 CE). The validator rejects 0.
 * For arithmetic (durations, positions on the timeline) years are converted to
 * astronomical numbering with `toAstro()` in src/lib/dates.ts (1 BCE -> 0, 2 BCE -> -1).
 */

export type CategoryId =
  | 'surgery'
  | 'public-health'
  | 'prevention'
  | 'therapeutics'
  | 'diagnosis'
  | 'mechanisms'
  | 'maternal'
  | 'mind-brain';

/** What kind of contribution the milestone represents. */
export type MilestoneType =
  | 'practice' // evidence that something was done (archaeological or documented)
  | 'observation' // a recorded description or observation (e.g. clinical description)
  | 'discovery' // a new finding about the body, disease or a substance
  | 'invention' // a new device, technique or preparation
  | 'demonstration' // first documented clinical use / demonstration in a setting
  | 'clinical-evidence' // a comparison or trial establishing (in)effectiveness
  | 'implementation' // organised public-health action or widespread adoption
  | 'eradication'; // certified elimination of a disease worldwide

/** What the evidence for the milestone consists of. */
export type EvidenceKind =
  | 'archaeological' // skeletal or material remains
  | 'surviving-text' // a manuscript or early text that survives
  | 'published-report' // a contemporary publication by those involved
  | 'eyewitness-account' // an account by an observer outside the practice
  | 'trial' // a planned comparison of treatments
  | 'programme-records' // institutional or public-health records
  | 'laboratory'; // laboratory / experimental work

export type LocationType =
  | 'archaeological-findspot'
  | 'documented-practice'
  | 'discovery-site'
  | 'trial-site'
  | 'implementation-area'
  | 'text-origin';

/** How precisely the coordinates are known. Drives marker rendering and rounding rules. */
export type LocationPrecision = 'site' | 'settlement' | 'region' | 'macro-region';

export interface EventLocation {
  /** Name as it was known at the time (e.g. "Ragusa", "Kingdom of Bunyoro"). */
  name: string;
  /** Present-day reference for orientation (e.g. "Dubrovnik, Croatia"). */
  modern: string;
  /** Null when the place cannot be located; the event then stays in the list and timeline only. */
  lat: number | null;
  lon: number | null;
  /** Radius (km) of the area the marker stands for. Drawn on the map and widens the density kernel. */
  radiusKm: number;
  precision: LocationPrecision;
  type: LocationType;
  /** For multi-location events: what happened here. */
  role?: string;
}

export interface DateSpec {
  /** Earliest plausible year (historical numbering, no 0). */
  start: number;
  /** Latest plausible year. Equal to start for a single, securely dated year. */
  end: number;
  /** Text shown to readers, e.g. "c. 3000 BCE", "13 October 1804". */
  display: string;
  /**
   * point: a single occurrence whose date may be uncertain anywhere within [start, end].
   * span:  a process that genuinely lasted from start to end (e.g. a 3-year expedition).
   */
  kind: 'point' | 'span';
  /** True if the boundaries themselves are uncertain (c., radiocarbon ranges, disputed dating). */
  approximate: boolean;
  precision: 'day' | 'month' | 'year' | 'decade' | 'century' | 'millennium' | 'radiometric';
  /** How the date is established, and what is uncertain about it. */
  basis: string;
}

export type SourceKind =
  | 'primary'
  | 'journal'
  | 'book'
  | 'museum'
  | 'institution'
  | 'university'
  | 'archive';

export interface Source {
  /** Full bibliographic citation. */
  citation: string;
  url: string;
  doi?: string;
  /** Page or section reference, only where verified. */
  pages?: string;
  kind: SourceKind;
  /** Which claims in the entry this source was checked against. */
  supports: string;
}

export interface Person {
  name: string;
  role: string;
}

export interface Milestone {
  /** Stable, URL-safe id. Never reuse or change once published. */
  id: string;
  title: string;
  /** One or two sentences. */
  summary: string;
  /** Longer explanation; paragraphs separated by blank lines. */
  explanation: string;
  date: DateSpec;
  type: MilestoneType;
  evidence: EvidenceKind[];
  /** Primary category: controls the dot colour. */
  category: CategoryId;
  /** Additional categories (never repeats the primary). */
  tags: CategoryId[];
  /** Free cross-cutting themes, e.g. "devices", "Indigenous knowledge". */
  themes: string[];
  /** Zero or more locations. Multi-location events count once in the density map. */
  locations: EventLocation[];
  locationNote?: string;
  /** People, teams or communities involved, where supported by the sources. */
  people: Person[];
  whatChanged: string;
  whyItMattered: string;
  /** What is uncertain, limited or commonly overstated. */
  limitations: string[];
  /** Disputed attribution, priority or interpretation, if any. */
  contested?: string;
  /** Unethical experimentation, exclusion or harm connected with the milestone. */
  harms?: string;
  sources: Source[];
  /** Set true when only one credible source could be found for a key claim. */
  singleSource?: boolean;
  sourceNote?: string;
  related: string[];
  /** Images are not used in this release; kept for the schema. */
  image?: { file: string; credit: string; licence: string; sourceUrl: string } | null;
  /** Where the idea for this entry came from, if not the original research. The entry itself is verified from its own sources. */
  suggestedBy?: 'wikipedia-timeline';
}

export interface Story {
  id: string;
  title: string;
  dek: string;
  steps: { eventId: string; note: string }[];
}

export interface AtlasData {
  version: string;
  generated: string;
  milestones: Milestone[];
  stories: Story[];
}
