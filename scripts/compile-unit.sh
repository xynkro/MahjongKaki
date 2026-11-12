#!/bin/sh
# Joins a unit's rendered explainers into one long video, with May's outro once at the end.
# Usage: scripts/compile-unit.sh <name> <part> [part...]   part = lesson id, or a path to an .mp4 (e.g. May's intro)
#   → media-src/compilations/<name>.mp4
set -e
name="$1"; shift; out="media-src/compilations"; mkdir -p "$out"; tmp=$(mktemp -d); i=0
norm() {
  ffmpeg -v error -y -i "$1" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1" \
    -af "aresample=44100,aformat=channel_layouts=stereo" -c:v libx264 -pix_fmt yuv420p -profile:v main -crf 20 \
    -c:a aac -b:a 128k "$2"
}
: > "$tmp/list.txt"
for p in "$@" media-src/video/OUT-turn_lexi.mp4; do
  case "$p" in *.mp4) src="$p" ;; *) src="media-src/explainers/$p/${p}_main.mp4" ;; esac
  i=$((i+1)); norm "$src" "$tmp/$i.mp4"; echo "file '$tmp/$i.mp4'" >> "$tmp/list.txt"
done
ffmpeg -v error -y -f concat -safe 0 -i "$tmp/list.txt" -c copy "$out/$name.mp4"
printf '%s %ss\n' "$name" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/$name.mp4")"
rm -rf "$tmp"
