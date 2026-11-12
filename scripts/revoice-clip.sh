#!/bin/sh
# Replaces a Kling clip's voice with May's ElevenLabs voice (Lexi) using speech-to-speech; timing is kept.
# Usage: scripts/revoice-clip.sh <in.mp4> <out.mp4>   (needs ELEVENLABS_API_KEY)
set -e
in="$1"; out="$2"; tmp=$(mktemp -d)
ffmpeg -v error -y -i "$in" -vn -ac 1 -ar 44100 "$tmp/a.wav"
code=$(curl -s -X POST "https://api.elevenlabs.io/v1/speech-to-speech/TiKM6Oo9KZhmYBsTBA2s?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -F "audio=@$tmp/a.wav" -F "model_id=eleven_multilingual_sts_v2" -o "$tmp/v.mp3" -w "%{http_code}")
[ "$code" = 200 ] || { echo "speech-to-speech failed: $code"; cat "$tmp/v.mp3"; exit 1; }
ffmpeg -v error -y -i "$in" -i "$tmp/v.mp3" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -shortest "$out"
rm -rf "$tmp"; echo "wrote $out"
