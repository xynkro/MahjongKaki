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

**Kling needs a start frame whenever the prompt holds an element chip** (11 Nov: without one, Generate only shows a
small toast and nothing renders). Each clip starts from a 9:16 still from the art batch (`media-src/video/start/`),
and shot 1 of the prompt must describe that still. U1 starts from A1 (May waving), cropped to 9:16.

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

## Version 2 prompts, ready to paste (11 Nov)

Each prompt starts with the `@MayMahjong` chip, and each clip uses its `media-src/video/start/U<n>_start.jpg`.
Settings: multi-shot Auto, sound ON, 9–10 s, 1080p, Unlimited ON. Shot 1 always describes the start frame.
U5 and U6 lines were reworded so they don't end on "wind" or "win", which Kling clips.

- **U1** (done, U1_v2.mp4): start A1 (waving).
- **U2** (start S2, hands at the edge of the tile wall): ` sits at the green-cloth mahjong table in a Singapore HDB living room at night. Shot 1: low angle along the square wall of mahjong tiles, plain green backs only, her hands resting at the table edge. Shot 2: overhead view as one finger taps the cloth three times, slowly. Shot 3: low angle up to her smiling face as she says warmly, "Mahjong is about making sets. Three of a kind, or three in a row." No tile faces visible. Friendly Singaporean English accent, gentle handheld documentary feel.`
- **U3** (start S3, over her shoulder): ` at the green-cloth mahjong table at night. Shot 1: over her shoulder from behind, the wall of tiles in front of her showing plain green backs. Shot 2: close-up of her hand drawing one tile from the wall and placing another face down in the middle in one easy motion. Shot 3: front medium shot of her face, clearly visible and looking into the camera, as she says, "Each go works the same way. Pick one up, put one down." No tile faces visible. Friendly Singaporean English accent, gentle handheld feel.`
- **U4** (start S4, side profile glancing left): ` at the green-cloth mahjong table at night. Shot 1: side profile, she glances to her left at someone off screen. Shot 2: quick push-in as she raises one hand like she's calling out. Shot 3: front medium shot, she laughs and says, "Someone throws the tile you need? You can call for it." No tile faces visible. Friendly Singaporean English accent.`
- **U5** (start A2 cropped, chin on hand thinking; S5 rejected as a different room): ` at the green-cloth mahjong table in a Singapore HDB living room at night. Shot 1: chin on her hand, she looks up and to the side, thinking. Shot 2: wider shot as she sweeps a hand across the four empty seats around the table. Shot 3: medium shot, she says, "Where you sit matters. Every seat has its own wind, and East goes first." No tile faces visible. Friendly Singaporean English accent.`
- **U6** (start S6, table height, grinning): ` at the green-cloth mahjong table at night. Shot 1: table-height shot, she grins at the camera. Shot 2: close-up as she leans in like she's sharing a secret and counts on her fingers. Shot 3: medium shot, she says, "In Singapore we count tai. More tai means a bigger score." No tile faces visible. Friendly Singaporean English accent.`
- **U7** (start S7, pulling her chair in): ` Shot 1: medium shot, she pulls her chair in to the green-cloth mahjong table at night. Shot 2: handheld push-in to a close-up as she rubs her hands together. Shot 3: she nods and says, "Ready? Let's play a real hand. I'll be right here." No tile faces visible. Friendly Singaporean English accent.`

- **U2 result (11 Nov):** speech correct, but May never appears (off-screen voice over cloth close-ups). Kept for now; retake from a start frame showing her face if slot time remains. Lesson: say "her face clearly visible" in the speaking shot.
- **U6 result (11 Nov):** good visuals, but the line is crammed into the last 3 s after ~6 s of silence, so "In Singapore" comes out as "Insignable". In the app for now. **Retake:** have her speak from shot 1, with a shorter line: "Here we count tai. More tai, bigger score." (short words, nothing at the end Kling tends to clip).
- **Retake prompts (11 Nov):**
  - **U6b** (start S6): ` at the green-cloth mahjong table at night. Shot 1: table-height shot, she grins at the camera and says warmly, "Here we count tai." Shot 2: close-up as she leans in and counts on her fingers. Shot 3: front medium shot of her face, clearly visible, as she says, "More tai, bigger score." Olive t-shirt. No tile faces visible. Friendly Singaporean English accent.` (the line is split across shots so it isn't rushed at the end)
  - **U2b** (start S4, side profile): ` at the green-cloth mahjong table at night. Shot 1: side profile, she turns from the left to face the camera and smiles. Shot 2: overhead view as one finger taps the green cloth three times, slowly, beside face-down tiles with plain green backs. Shot 3: front medium shot of her face, clearly visible and looking into the camera, as she says warmly, "Mahjong is about making sets. Three of a kind, or three in a row." Olive t-shirt. No tile faces visible. Friendly Singaporean English accent.`
- **U6 retake (U6_v3, 11 Nov):** audio fixed ("Here we count tai. One, two, three. More tai, bigger score."); the finger-counting close-up shows one AI-drawn bamboo tile face. Chosen over v2 for the clear voice; v2 kept in media-src.
- **U2 retake (U2_v3, 11 Nov):** May on camera this time; line correct; no tile faces. In the app.
