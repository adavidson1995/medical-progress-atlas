"""Add a batch of verified milestones and record queue decisions.

Usage: python3 research/add_batch.py research/batches/<file>.json

The batch file holds:
  {"entries": [ <milestone>, ... ],
   "queue":   { "w311": {"status": "added", "atlasId": "...", "note": "..."}, ... }}

Each entry is appended to the data-src file for its start year (replacing an entry
with the same id, so a batch can be re-run). Entries suggested by the Wikipedia
timeline get suggestedBy automatically when the queue maps them as "added".
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [  # (first year inclusive, file)
    (-10**6, '01-prehistory.json'), (-3500, '02-ancient.json'), (500, '03-medieval.json'),
    (1500, '04-early-modern.json'), (1800, '05-nineteenth.json'), (1900, '06-twentieth.json'),
]

def file_for(year):
    name = FILES[0][1]
    for start, f in FILES:
        if year >= start:
            name = f
    return ROOT / 'data-src' / name

batch = json.loads(Path(sys.argv[1]).read_text())
pending_path = ROOT / 'research' / 'pending-relations.json'
pending = json.loads(pending_path.read_text()) if pending_path.exists() else []

def all_ids():
    ids = set()
    for _, f in FILES:
        ids |= {x['id'] for x in json.loads((ROOT / 'data-src' / f).read_text())}
    return ids

known = all_ids() | {m['id'] for m in batch.get('entries', [])}
for m in batch.get('entries', []):
    keep = []
    for r in m.get('related', []):
        if r in known: keep.append(r)
        elif [m['id'], r] not in pending: pending.append([m['id'], r])
    m['related'] = keep
queue_path = ROOT / 'research' / 'wikipedia-queue.json'
queue = json.loads(queue_path.read_text())
by_wid = {e['wid']: e for e in queue['entries']}
suggested = {d['atlasId'] for d in batch.get('queue', {}).values() if d.get('status') == 'added'}

for m in batch.get('entries', []):
    if m['id'] in suggested:
        m['suggestedBy'] = 'wikipedia-timeline'
    path = file_for(m['date']['start'])
    data = json.loads(path.read_text())
    data = [x for x in data if x['id'] != m['id']] + [m]
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"{m['id']:45s} -> {path.name}")

# Resolve relations to entries that now exist, in both directions.
ids = all_ids()
still = []
for a, b in pending:
    if a in ids and b in ids:
        for _, f in FILES:
            path = ROOT / 'data-src' / f
            data = json.loads(path.read_text()); changed = False
            for x in data:
                for me, other in ((a, b), (b, a)):
                    if x['id'] == me and other not in x['related']:
                        x['related'].append(other); changed = True
            if changed: path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"linked {a} <-> {b}")
    else:
        still.append([a, b])
pending_path.write_text(json.dumps(still, indent=1))
if still: print(f"{len(still)} relations waiting for entries not yet added")

for wid, d in batch.get('queue', {}).items():
    e = by_wid[wid]
    e['status'] = d['status']
    e['atlasId'] = d.get('atlasId', '')
    e['note'] = d.get('note', '')
queue_path.write_text(json.dumps(queue, indent=1, ensure_ascii=False))
print(f"queue: {len(batch.get('queue', {}))} decisions recorded")
