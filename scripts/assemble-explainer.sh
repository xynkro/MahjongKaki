#!/bin/sh
# Joins May's intro clip, the rendered explainer and (optionally) May's outro into one video.
# Every part is normalised to 720x1280, 30 fps, AAC 44.1 kHz stereo first so the joins are clean.
# Usage: scripts/assemble-explainer.sh <id> <intro.mp4|-> [outro.mp4]   ("-" = no intro)
#   → media-src/explainers/<id>/<id>_explainer.mp4 and packages/app/public/video/X-<id>.mp4/.webp
set -e
id="$1"; intro="$2"; outro="$3"; dir="media-src/explainers/$id"; tmp=$(mktemp -d)
norm() {
  ffmpeg -v error -y -i "$1" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1" \
    -af "aresample=44100,aformat=channel_layouts=stereo" -c:v libx264 -pix_fmt yuv420p -profile:v main -crf 20 \
    -c:a aac -b:a 128k "$2"
}
: > "$tmp/list.txt"
if [ "$intro" != "-" ]; then norm "$intro" "$tmp/a.mp4"; echo "file '$tmp/a.mp4'" >> "$tmp/list.txt"; fi
norm "$dir/${id}_main.mp4" "$tmp/b.mp4"; echo "file '$tmp/b.mp4'" >> "$tmp/list.txt"
if [ -n "$outro" ]; then norm "$outro" "$tmp/c.mp4"; echo "file '$tmp/c.mp4'" >> "$tmp/list.txt"; fi
ffmpeg -v error -y -f concat -safe 0 -i "$tmp/list.txt" -c copy "$dir/${id}_explainer.mp4"
# App copy: same encode settings as the other clips.
sh scripts/encode-clip.sh "$dir/${id}_explainer.mp4" "X-$id" >/dev/null
ffprobe -v error -show_entries format=duration -of csv=p=0 "$dir/${id}_explainer.mp4"
ls -la "packages/app/public/video/X-$id.mp4"
rm -rf "$tmp"
