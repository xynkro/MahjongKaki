#!/usr/bin/env python3
"""Records an explainer's narration with ElevenLabs (one mp3 per scene, with word timestamps) and writes
packages/app/src/explainer/data/<id>.json for the renderer.
Usage: scripts/narrate.py <id> "<title>" "<unit>"   (reads media-src/explainers/<id>/script.json)
A line can be {"say": "...", "show": "..."}: the voice reads `say` (e.g. phonetic pinyin) and the captions show
`show`, word for word, so both must have the same number of words.
Needs ELEVENLABS_API_KEY in the environment."""
import base64, json, os, sys, urllib.request

VOICE = 'TiKM6Oo9KZhmYBsTBA2s'  # Lexi, Singapore English (Caspar's pick, 12 Nov)
eid, title, unit = sys.argv[1:4]
base = f'media-src/explainers/{eid}'
lines = json.load(open(f'{base}/script.json'))
key = os.environ['ELEVENLABS_API_KEY']
scenes = []
for i, line in enumerate(lines, 1):
    text = line['say'] if isinstance(line, dict) else line
    show = line['show'].split() if isinstance(line, dict) else None
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
        data=json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2',
                         'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.0, 'use_speaker_boost': True}}).encode(),
        headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req))
    open(f'{base}/n{i}.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
    a = d['alignment']
    words, cur, s0, e0 = [], '', 0.0, 0.0
    for c, s, e in zip(a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']):
        if c.isspace():
            if cur: words.append({'w': cur, 's': round(s0, 3), 'e': round(e0, 3)}); cur = ''
            continue
        if not cur: s0 = s
        cur += c; e0 = e
    if cur: words.append({'w': cur, 's': round(s0, 3), 'e': round(e0, 3)})
    if show:
        assert len(show) == len(words), f'scene {i}: {len(show)} shown words vs {len(words)} spoken'
        for w, txt in zip(words, show): w['w'] = txt
    scenes.append({'audio': f'n{i}.mp3', 'dur': round(a['character_end_times_seconds'][-1], 3), 'words': words})
    print(f'scene {i}: {scenes[-1]["dur"]:.1f}s')
json.dump({'id': eid, 'title': title, 'unit': unit, 'scenes': scenes}, open(f'packages/app/src/explainer/data/{eid}.json', 'w'), indent=0)
