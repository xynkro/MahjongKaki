#!/bin/sh
# QA a clip before it goes in the app. Prints the speech timing verdict and writes a 1-frame-per-second sheet
# to check by eye for tile faces, room changes and glitches.
# Usage: scripts/qa-clip.sh <clip.mp4> [outdir]
set -e
clip="$1"; out="${2:-/tmp/clip-qa}"; mkdir -p "$out"; name=$(basename "$clip" .mp4)
ffmpeg -v error -y -i "$clip" -vf "fps=2,scale=160:-2,tile=10x2" -frames:v 1 "$out/${name}_sheet.jpg"
whisper "$clip" --model small --language en --output_dir "$out" --output_format json --word_timestamps True --fp16 False >/dev/null 2>&1
python3 - "$out/$name.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
w = [x for s in d['segments'] for x in s.get('words', [])]
if not w: print('FAIL: no speech'); sys.exit()
t0, t1 = w[0]['start'], w[-1]['end']; rate = len(w) / max(0.1, t1 - t0)
gap = max([b['start'] - a['end'] for a, b in zip(w, w[1:])] or [0])
bad = []
if t0 > 1.5: bad.append(f'speech starts late ({t0:.1f}s)')
if not 2.2 <= rate <= 3.5: bad.append(f'pace {rate:.1f} words/s (want 2.2-3.5)')
if gap > 1.0: bad.append(f'{gap:.1f}s gap mid-line')
print(('PASS' if not bad else 'FAIL: ' + '; '.join(bad)) + f' | {t0:.1f}-{t1:.1f}s, {len(w)} words | {d["text"].strip()}')
PY
echo "sheet: $out/${name}_sheet.jpg"
