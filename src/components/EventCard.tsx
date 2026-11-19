import { useEffect, useRef } from 'react';
import type { Milestone } from '../types';
import { CAT, EVIDENCE_LABEL, LOCATION_TYPE_LABEL, PRECISION_LABEL, TYPE_LABEL, TYPES } from '../lib/meta';

interface Props {
  m: Milestone;
  byId: Map<string, Milestone>;
  onClose: () => void;
  onSelect: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  story?: { title: string; note: string; step: number; total: number; onPrev: () => void; onNext: () => void; onExit: () => void };
  onCopyLink: () => void;
  copied: boolean;
}

export function EventCard({ m, byId, onClose, onSelect, onPrev, onNext, story, onCopyLink, copied }: Props) {
  const ref = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cat = CAT[m.category];
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [m.id]);

  const paras = m.explanation.split(/\n\n+/);
  const places = m.locations.map((l) => l.name);
  const typeDesc = TYPES.find((t) => t.id === m.type)?.description;

  return (
    <article className="card" ref={ref} aria-labelledby="card-title">
      <div className="card-bar">
        <div className="card-nav">
          {onPrev && <button className="btn-quiet" onClick={onPrev} aria-label="Previous milestone in time">‹ Earlier</button>}
          {onNext && <button className="btn-quiet" onClick={onNext} aria-label="Next milestone in time">Later ›</button>}
        </div>
        <button className="btn-quiet" onClick={onCopyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
        <button className="btn-close" onClick={onClose} aria-label="Close milestone">×</button>
      </div>

      {story && (
        <aside className="story-note" aria-label="Story">
          <p className="story-kicker">{story.title}, step {story.step + 1} of {story.total}</p>
          <p>{story.note}</p>
          <div className="story-nav">
            <button className="btn" onClick={story.onPrev} disabled={story.step === 0}>Previous step</button>
            <button className="btn btn-primary" onClick={story.onNext}>{story.step + 1 < story.total ? 'Next step' : 'Finish story'}</button>
            <button className="btn-quiet" onClick={story.onExit}>Leave story</button>
          </div>
        </aside>
      )}

      <header className="card-head">
        <p className="card-meta">
          <span className="cat-chip"><i style={{ background: cat.color }} />{cat.label}</span>
          <span className="type-chip" title={typeDesc}>{TYPE_LABEL[m.type]}</span>
        </p>
        <h2 id="card-title" tabIndex={-1} ref={headingRef}>{m.title}</h2>
        <p className="card-when">
          <span className={m.date.approximate ? 'date-approx' : ''}>{m.date.display}</span>
          {m.date.approximate && <span className="badge">approximate date</span>}
          {m.date.kind === 'span' && <span className="badge">period</span>}
        </p>
        <p className="card-where">{places.length ? places.join('; ') : 'Location not mapped'}</p>
      </header>

      <p className="card-lead">{m.summary}</p>

      <section>
        <h3>What happened</h3>
        {paras.map((t, i) => <p key={i}>{t}</p>)}
      </section>

      {m.people.length > 0 && (
        <section>
          <h3>Who contributed</h3>
          <ul className="people">
            {m.people.map((p) => <li key={p.name}><strong>{p.name}</strong> — {p.role}</li>)}
          </ul>
        </section>
      )}

      <section className="two-up">
        <div>
          <h3>What changed</h3>
          <p>{m.whatChanged}</p>
        </div>
        <div>
          <h3>Why it mattered</h3>
          <p>{m.whyItMattered}</p>
        </div>
      </section>

      <section className="uncertain">
        <h3>What is uncertain or disputed</h3>
        {m.contested && <p className="contested"><strong>Disputed: </strong>{m.contested}</p>}
        <ul>
          {m.limitations.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </section>

      {m.harms && (
        <section className="harms">
          <h3>Harms and exclusions</h3>
          <p>{m.harms}</p>
        </section>
      )}

      <section>
        <h3>When and where</h3>
        <p className="small"><strong>Dating: </strong>{m.date.basis}</p>
        <ul className="locs">
          {m.locations.map((l, i) => (
            <li key={i}>
              <strong>{l.name}</strong> <span className="muted">({l.modern})</span>
              <br />
              <span className="small">{LOCATION_TYPE_LABEL[l.type]}. {l.lat == null ? 'Not mapped: location unknown.' : `Shown as: ${PRECISION_LABEL[l.precision].toLowerCase()}${l.radiusKm >= 20 ? `, area of about ${l.radiusKm} km radius` : ''}.`}{l.role ? ` ${l.role}.` : ''}</span>
            </li>
          ))}
        </ul>
        {m.locationNote && <p className="small muted">{m.locationNote}</p>}
        {m.locations.length > 1 && <p className="small muted">One milestone shown at {m.locations.length} linked places; it counts once in the density map.</p>}
      </section>

      <section>
        <h3>Sources</h3>
        {m.singleSource && <p className="source-note"><strong>Limited sourcing: </strong>{m.sourceNote}</p>}
        {!m.singleSource && m.sourceNote && <p className="small muted">{m.sourceNote}</p>}
        <ol className="sources">
          {m.sources.map((s, i) => (
            <li key={i}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.citation}</a>
              {s.doi && <> <span className="muted">DOI {s.doi}</span></>}
              {s.pages && <span className="muted">, pp. {s.pages}</span>}
              <span className="small muted block">Checked for: {s.supports}</span>
            </li>
          ))}
        </ol>
      </section>

      {m.related.length > 0 && (
        <section>
          <h3>Related milestones</h3>
          <ul className="related">
            {m.related.filter((id) => byId.has(id)).map((id) => {
              const r = byId.get(id)!;
              return (
                <li key={id}>
                  <button className="related-btn" onClick={() => onSelect(id)}>
                    <i style={{ background: CAT[r.category].color }} />
                    <span>{r.title}</span>
                    <span className="muted">{r.date.display}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="card-foot small muted">
        <p>
          <strong>Evidence:</strong> {m.evidence.map((e) => EVIDENCE_LABEL[e]).join(', ')}.{' '}
          {m.tags.length > 0 && <><strong>Also tagged:</strong> {m.tags.map((t) => CAT[t].label).join(', ')}. </>}
          {m.themes.length > 0 && <><strong>Themes:</strong> {m.themes.join(', ')}.</>}
        </p>
        {m.suggestedBy === 'wikipedia-timeline' && (
          <p>
            Suggested by Wikipedia's{' '}
            <a href="https://en.wikipedia.org/wiki/Timeline_of_medicine_and_medical_technology" target="_blank" rel="noreferrer">Timeline of medicine and medical technology</a>
            ; checked against the sources listed above, not against Wikipedia.
          </p>
        )}
        <p>Milestone ID: <code>{m.id}</code>. Historical significance described here is not a present-day clinical recommendation.</p>
      </footer>
    </article>
  );
}
