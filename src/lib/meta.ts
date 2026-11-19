import type { CategoryId, MilestoneType, EvidenceKind, LocationType, LocationPrecision } from '../types';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  code: string; // used in share links
  color: string;
  description: string;
}

/**
 * Eight primary categories in the validated categorical order (see docs/METHODOLOGY.md).
 * "Medical technology and devices" is a cross-cutting theme rather than a primary
 * category: every device in the atlas serves diagnosis, surgery or treatment.
 */
export const CATEGORIES: CategoryMeta[] = [
  { id: 'diagnosis', label: 'Diagnosis, imaging & laboratory', short: 'Diagnosis', code: 'dia', color: '#2a78d6', description: 'Recognising and measuring disease: clinical description, instruments, imaging and laboratory tests.' },
  { id: 'surgery', label: 'Surgery & anaesthesia', short: 'Surgery', code: 'sur', color: '#eb6834', description: 'Operations, dentistry, wound care, and the control of pain during procedures.' },
  { id: 'public-health', label: 'Public health & health systems', short: 'Public health', code: 'pub', color: '#1baf7a', description: 'Sanitation, quarantine, epidemiology, hospitals and organised health care.' },
  { id: 'therapeutics', label: 'Medicines & therapies', short: 'Medicines', code: 'the', color: '#eda100', description: 'Drugs, remedies and non-surgical treatments, including therapeutic devices.' },
  { id: 'maternal', label: 'Maternal, reproductive & newborn care', short: 'Maternal & newborn', code: 'mat', color: '#e87ba4', description: 'Pregnancy, childbirth, fertility and the care of newborn babies.' },
  { id: 'prevention', label: 'Vaccination & prevention', short: 'Prevention', code: 'pre', color: '#008300', description: 'Inoculation, vaccines and other ways of preventing specific diseases, through to eradication.' },
  { id: 'mind-brain', label: 'Mental health & neurology', short: 'Mind & brain', code: 'min', color: '#4a3aa7', description: 'Care and treatment of mental illness and disorders of the nervous system and senses.' },
  { id: 'mechanisms', label: 'Anatomy, physiology & disease mechanisms', short: 'Body & disease', code: 'mec', color: '#a8323e', description: 'Understanding how the body works and what causes disease.' },
];

export const CAT: Record<CategoryId, CategoryMeta> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryMeta>;

export const TYPES: { id: MilestoneType; label: string; code: string; description: string }[] = [
  { id: 'practice', label: 'Practice', code: 'pra', description: 'Evidence that something was done, from remains or records. Does not by itself show purpose or effectiveness.' },
  { id: 'observation', label: 'Observation', code: 'obs', description: 'A recorded description or observation, such as a clinical description of a disease.' },
  { id: 'discovery', label: 'Discovery', code: 'dis', description: 'A new finding about the body, a disease or a substance.' },
  { id: 'invention', label: 'Invention', code: 'inv', description: 'A new device, technique or preparation.' },
  { id: 'demonstration', label: 'Clinical demonstration', code: 'dem', description: 'An early documented use in patients, in a particular setting.' },
  { id: 'clinical-evidence', label: 'Clinical evidence', code: 'cli', description: 'A comparison or trial testing whether a treatment or measure works.' },
  { id: 'implementation', label: 'Implementation', code: 'imp', description: 'Organised public-health action or widespread adoption.' },
  { id: 'eradication', label: 'Eradication', code: 'era', description: 'Certified worldwide elimination of a disease.' },
];
export const TYPE_LABEL: Record<MilestoneType, string> = Object.fromEntries(TYPES.map((t) => [t.id, t.label])) as Record<MilestoneType, string>;

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  archaeological: 'Archaeological remains',
  'surviving-text': 'Surviving text',
  'published-report': 'Contemporary publication',
  'eyewitness-account': 'Eyewitness account',
  trial: 'Planned trial',
  'programme-records': 'Programme records',
  laboratory: 'Laboratory work',
};

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  'archaeological-findspot': 'Archaeological findspot',
  'documented-practice': 'Documented practice',
  'discovery-site': 'Discovery site',
  'trial-site': 'Trial site',
  'implementation-area': 'Implementation area',
  'text-origin': 'Where the text was made or found',
};

export const PRECISION_LABEL: Record<LocationPrecision, string> = {
  site: 'Specific site',
  settlement: 'Town or city',
  region: 'Region',
  'macro-region': 'Large region',
};
