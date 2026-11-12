#!/bin/sh
# Encode a Kling clip for the app: 720x1280 H.264 Main + AAC, ~700 kbps, plus a webp poster from the first frame.
# Usage: scripts/encode-clip.sh media-src/video/<source>.mp4 <ID>   → packages/app/public/video/<ID>.mp4/.webp
set -e
src="$1"; id="$2"; out="packages/app/public/video"
ffmpeg -v error -y -i "$src" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p -b:v 700k -maxrate 900k -bufsize 1800k \
  -c:a aac -b:a 96k -movflags +faststart "$out/$id.mp4"
tmp="$(mktemp -t poster).png"
ffmpeg -v error -y -ss 0.3 -i "$src" -frames:v 1 -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" "$tmp"
cwebp -quiet -q 72 "$tmp" -o "$out/$id.webp"; rm -f "$tmp"
ls -la "$out/$id.mp4" "$out/$id.webp"
