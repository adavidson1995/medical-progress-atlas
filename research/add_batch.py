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

for wid, d in batch.get('queue', {}).items():
    e = by_wid[wid]
    e['status'] = d['status']
    e['atlasId'] = d.get('atlasId', '')
    e['note'] = d.get('note', '')
queue_path.write_text(json.dumps(queue, indent=1, ensure_ascii=False))
print(f"queue: {len(batch.get('queue', {}))} decisions recorded")
