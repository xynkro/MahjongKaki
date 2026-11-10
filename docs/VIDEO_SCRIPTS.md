# Learn videos: scripts and prompts

These videos are made with Kling on Caspar's Higgsfield account (unlimited until 12 Nov 2026).

## Rules for every clip

- **No tile teaching in AI video.** The models draw wrong tiles and invent rules. Tiles are shown in the app as real `TileFace` animations next to the video (split screen) or after it.
- **One original host,** May, a made-up character who isn't based on a real person. She appears in the welcome and unit intros. Everything else is b-roll with no faces close up.
- **The words are in captions in the app,** so the videos work on a muted phone. Kling's native audio is used only for room tone, plus May's spoken lines if the test shows clean speech.
- **Prompts are camera briefings:** name the camera and lens, add ordinary details, and ask for imperfection. Avoid "photorealistic, 8k".
- **Format:** vertical 9:16, 5–8 seconds, for the phone layout.
- **Learned the hard way:** Kling reads any quoted words in the prompt aloud, so a pronunciation note ("say mahjong as mah-jong") became part of the line. It also miscounts fingers (it showed four for "three"). So: no stage directions in quotes, no counting gestures, and lines that avoid the word "mahjong" where possible.
- **Start frame:** every host clip starts from `media-src/video/may_start.jpg` (a frame of W1), so May's face and room stay the same.

## The host

> May, a Singaporean Chinese woman in her late 20s, shoulder-length black hair tied back loosely, small silver hoop earrings, plain olive t-shirt, no makeup look. Friendly, a little teasing, talks like she's explaining to a friend.

Setting (same in every host clip):

> A square folding mahjong table with a worn green cloth in the living room of a Singapore HDB flat, evening. A ceiling fan turns slowly, a rattan chair behind, a plastic tray of kueh and a glass of iced Milo on the side table, window blinds half open with corridor light outside.

## Clips

| # | Use | Spoken / caption line | Shot |
|---|---|---|---|
| W1 | Welcome (first open) | "Hi, I'm May. I'll teach you mahjong from zero. No Chinese needed, promise." | Medium close-up, May sits at the table, looks up from shuffling and waves once. |
| U1 | Unit 1: Meet the tiles | "First, the tiles. There are more than you think, but they sort into a few families." | May slides a short stack of tiles toward camera, tiles soft-focus and turned away. |
| U2 | Unit 2: Sets | "Mahjong is about making sets. Three of a kind, or three in a row." | May taps the table three times, smiling. |
| U3 | Unit 3: A turn | "Each go works the same way. Pick one up, put one down." (take 1 said "tiloh": avoid "tile" as a stressed word) | May reaches to the wall of tiles, draws, then discards in one easy motion. |
| U4 | Unit 4: Claiming | "Someone throws the tile you need? You can call for it." | May leans forward, raises a hand as if calling, laughs. |
| U5 | Unit 5: Winds and seats | "Where you sit matters. Each seat has a wind." | Slow top-down push over the empty table and four chairs. |
| U6 | Unit 6: Scoring | "In Singapore we count tai. More tai, bigger win." | May counts on her fingers, raises eyebrows. |
| U7 | Unit 7: First game | "Ready? Let's play a real hand. I'll be right here." | May pulls her chair in, rubs her hands together. |
| B1 | Background loop (Learn tab) | none | Close-up of hands washing tiles on green cloth, tiles blurred, warm lamp light, loops. |
| B2 | Background loop (Play tab) | none | Slow orbit of an empty table under a pendant lamp, night, fan shadows. |
| C1 | Lesson complete | none | May claps once and grins at camera. |
| C2 | Unit complete | none | Four friends' hands slap the table in a cheer, faces out of frame. |

## Prompt template (host clips)

> Shot on a Sony FX3 with a 35mm lens at f/2, handheld with slight sway, 24fps, natural tungsten lamp and window light, a little noise in the shadows. [HOST]. [SETTING]. [SHOT]. Real skin texture, flyaway hairs, the table cloth has faded patches and a cigarette burn near the edge. Tiles are out of focus or turned away. Vertical 9:16. No text, no logos.

## Version 2: varied angles (Caspar, 10 Nov: "boring, always the same angle")

Take 1 of every host clip started from the same still, so they all share one medium shot. Version 2 uses the
`@MayMahjong` character element (made from four W1–C1 frames) instead of a start frame, plus Kling **multi-shot**,
so each clip cuts between two or three angles. Same room, same lines (the approved or corrected ones).

| # | Shot plan |
|---|---|
| U1 | Wide from the doorway, May at the table under the lamp → close-up of her hands lifting a short stack of tiles (backs to camera) → medium on her face as she finishes the line |
| U2 | Overhead top-down on the green cloth as her finger taps three times → low angle across the tiles up to her smile |
| U3 | Over-the-shoulder from behind May as she draws from the wall → close-up of the tile landing in the middle → her look back to camera |
| U4 | Side profile as she glances left at an off-screen throw → quick push-in to her raised palm → front, laughing |
| U5 | Slow orbit around the empty table and four chairs → May sitting down into frame, sweeping a hand to the seats |
| U6 | Low angle from the table edge, May leaning back grinning → close-up as she leans in like a secret → wide hands open |
| U7 | Medium as she pulls her chair in → handheld push-in to a close-up nod |
| C1 | Close-up clap and grin (single shot, short) |
| C2 | Top-down: four pairs of hands slap the table edge in a cheer, faces out of frame |
