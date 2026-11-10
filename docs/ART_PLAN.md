# MahjongKaki art plan (Nano Banana Pro 4K + Kling 3.0, unlimited until about 13 Nov 2026)

Everything here is generated while the unlimited plans last. Raw files go to `media-src/art/<group>/` (gitignored),
and the app gets resized, compressed copies later.

## Ground rules for every image

- **No readable tile faces.** AI draws mahjong tiles wrong. Tiles are face down, turned away, blurred or out of frame.
  The app draws every teachable tile itself (`TileFace`).
- **No money, chips, cash or betting.** This is a learning app. Show snacks, tea and friends instead.
- **One world.** The same HDB living room, green-cloth folding table, ceiling fan, white shutters, warm lamp,
  kueh tray and iced Milo, in evening (Jade Night) and daytime (Daylight) versions.
- **May is always the same person.** Use the four reference frames in `media-src/video/may_ref/` as image references.
  She is a Singaporean Chinese woman in her late 20s with shoulder-length black hair loosely tied back, small silver hoops,
  an olive t-shirt and a natural look.
- **Camera-briefing prompts:** name the camera and lens, add ordinary details, and ask for imperfection.
  Never write "photorealistic, 8k, masterpiece".
- **Avoid Caspar's cliché list:** cream backgrounds, sparkles, glassy blur, dark gradient heroes,
  and text in the image (the app adds its own words).
- **Two aspect ratios:** 4:5 (cards) and 9:16 (full screen and video start frames). Plus 1:1 for avatars and the icon.

## Asset list, in priority order

### A. May, still poses (4:5, plus a 1:1 head crop each), 10 images
| id | pose | used for |
|---|---|---|
| A1 | waving hello at the table, smiling | welcome card, first open |
| A2 | chin on hand, thinking | coach "hint" bubble |
| A3 | both hands up, delighted | lesson complete |
| A4 | leaning in, pointing down at the table | lesson intro cards |
| A5 | wincing kindly, "not quite" | wrong-answer feedback |
| A6 | small shrug, half smile | "you can skip" / empty states |
| A7 | holding a mug of tea, relaxed | Hand tab empty state |
| A8 | laughing, head back | unit complete |
| A9 | determined, sleeves pushed up | Play tab "ready" |
| A10 | thumbs-up, close-up | streaks |

### B. Video start frames from new angles (9:16), 8 images, for the Kling v2 intros
| id | angle |
|---|---|
| B1 | wide from the doorway, May at the table under the lamp |
| B2 | top-down onto the green cloth, May's hands at the edge |
| B3 | over May's shoulder, the wall of face-down tiles in front of her |
| B4 | side profile, May glancing left |
| B5 | low angle across the tiles up to May |
| B6 | empty table with four chairs, three-quarter view |
| B7 | May pulling her chair in, medium |
| B8 | close-up of May's face, soft lamp light |

### C. Unit covers (4:5), 8 images: real moments in the same world, no readable tiles
| id | unit | scene |
|---|---|---|
| C1 | Meet the tiles | a velvet pouch tipping face-down tiles onto the cloth, May's hands |
| C2 | Sets | May's hands sliding three face-down tiles together |
| C3 | A turn | a hand reaching for the wall of tiles, others blurred behind |
| C4 | Claiming | friends round the table, one calling out, laughing |
| C5 | Seats and winds | top-down on the empty table, four chairs, evening light |
| C6 | Scoring | a notepad with tally marks beside the kueh tray, a pencil (no numbers readable) |
| C7 | First game | four friends settling in, May waving the viewer to the empty seat |
| C8 | Advanced (locked) | the same table late at night, one lamp, quiet |

### D. Theme backdrops (9:16 and 16:9), 6 images
D1/D2 Jade Night felt close-up texture (dark green, worn) · D3/D4 Daylight felt texture · D5 the room in evening, empty ·
D6 the room in daytime, empty.

### E. Onboarding (9:16), 3 images
E1 "Learn": May at the table with an open notebook · E2 "Play": four seats lit, one empty for you · E3 "Hand": May
holding her hand of tiles to her chest, backs facing the camera, grinning.

### F. Icon and brand (1:1), 6 concepts
A single face-down tile with a jade back on dark charcoal; a top-down table with one lit seat; a tile-edge "K" mark.
Pick one, then redraw it as clean vector in code. The generated version is the reference only.

### G. Marketing (9:16 and 1:1), 6 images
App Store backgrounds for both themes, a Chinese New Year family table, and "learn in a weekend" social posts
(text added later).

### H. Kling videos (rotation with the other sessions)
v2 intros U1–U7 with multi-shot and `@MayMahjong`, then C2 (unit complete), B2 (Play background), and a retake of B1 (Learn background).
Use the B-group stills as start frames where a fixed angle is needed.

## Review

Opus reviews each batch against these rules before anything is used: no readable tiles, no money, May looks like
herself, matches the world, and nothing from the cliché list. Rejected images are regenerated, not edited.
