# Art runbook: Nano Banana Pro on Higgsfield (for the generation helper)

Read `docs/ART_PLAN.md` first for the rules. This file is the exact procedure.

## Shared-account rules (other Claude sessions use the same Higgsfield account)

1. Work only in **your own Chrome tab** (create one with tabs_create_mcp). Never touch another tab.
2. The image form (prompt, model, references, settings) is **shared server-side**. Before editing it, run
   `/Users/xynkro/.higgsfield/form_lock.sh acquire "MahjongKaki"` and retry every ~10–30 s while it prints `busy`.
   Hold it only while you edit the form and click Generate, then run
   `/Users/xynkro/.higgsfield/form_lock.sh release "MahjongKaki"` straight away. Don't hold it while a job renders,
   and never hold it for more than 4 minutes.
3. Do **not** use the Kling video page. Video is handled by the main session.
4. Avoid the Chrome `find` tool, which has its own usage limit. Use `read_page` (filter interactive),
   `javascript_tool` and screenshot coordinates instead.

## One image, step by step

1. Open `https://higgsfield.ai/ai/image?model=nano_banana_pro` and wait about 4 s.
2. Acquire the lock.
3. If the form shows someone else's reference image, hover it and click its small ✕ to remove it.
4. Click the prompt box, select all, delete.
5. For prompts that include May: type `@MayMahjong`, wait 1 s, and click the **MayMahjong** suggestion in the popup
   (it inserts a character chip). Then type the rest of the prompt starting with a space.
   For prompts without May, just type the prompt.
6. Check the bottom bar reads **Nano Banana Pro · <aspect> · 4K · 1/4 · Unlimited ON**:
   - Aspect: click the aspect button and choose the asset's ratio (3:4 for cards, 9:16 for full screen, 1:1 for icons).
   - Unlimited mode can switch itself off after a reload. Turn it on, and the Generate button must then read **UNLIMITED**,
     never a credit number. If it shows a number, do not click Generate.
7. Click Generate, wait ~3 s, confirm a new "Generating" card appeared, then **release the lock**.
8. You can queue the next asset while earlier ones render (repeat from step 2).

## Downloading results

Finished images show in the history grid. Find your own by matching your prompt text
(other sessions' images are mixed in), get the full-size image URL from the card (open it, or read `img.src`
via javascript_tool), and save it with curl:
`curl -sSL -o media-src/art/<group>/<id>_v<n>.png "<url>"`
Groups: `A_may`, `B_angles`, `C_units`, `D_backdrops`, `E_onboarding`, `F_icon`, `G_marketing`
(under `/Users/xynkro/Documents/MahjongKaki/`).
Make **two variants** of every asset (generate the same prompt twice: `_v1`, `_v2`).

## Prompt template

Every prompt is a camera briefing. Fill the scene line from the table below:

> [@MayMahjong chip, if May is in it] [SCENE]. Shot on a Fujifilm X-T5 with a [LENS] lens, natural light, [LIGHT].
> Setting: the living room of a Singapore HDB flat — a square folding mahjong table with a worn green felt cloth,
> a ceiling fan, white window shutters, a rattan chair, a plastic tray of kueh and a glass of iced Milo.
> Any mahjong tiles are face down, turned away or soft-focus, with no readable symbols. No money, chips or cash.
> Natural skin texture, a few flyaway hairs, slight film grain, small real-life imperfections. No text, no logos,
> no watermark.

LIGHT: **evening** = "warm tungsten table lamp, cool blue corridor light through the shutters";
**day** = "soft daylight through the open shutters, bright and airy".
LENS: 35mm for medium shots, 50mm for close-ups, 24mm for wide shots.

## Asset queue (do in this order)

| id | aspect | light | May? | scene |
|---|---|---|---|---|
| A1 | 3:4 | evening | yes | sitting at the table, smiling warmly, waving one hand at the camera as if welcoming a friend in |
| A2 | 3:4 | evening | yes | chin resting on one hand, eyes up and to the side, thinking about her next move |
| A3 | 3:4 | evening | yes | both hands up beside her face, delighted open-mouthed smile |
| A4 | 3:4 | evening | yes | leaning in toward the camera, pointing down at the table with one finger |
| A5 | 3:4 | evening | yes | a kind wince with a small apologetic smile, one hand raised palm out, "not quite" |
| A6 | 3:4 | day | yes | a small shrug with a half smile, hands open |
| A7 | 3:4 | day | yes | relaxed in the rattan chair holding a mug of tea in both hands |
| A8 | 3:4 | evening | yes | laughing with her head tipped back |
| A9 | 3:4 | evening | yes | sleeves pushed up, determined grin, ready to play |
| A10 | 1:1 | evening | yes | close-up thumbs-up and grin |
| B1 | 9:16 | evening | yes | wide shot from the doorway: May at the table under the lamp, the whole room visible |
| B2 | 9:16 | evening | yes | top-down view straight onto the green cloth, May's hands resting at the edge, face-down tiles in rows |
| B3 | 9:16 | evening | yes | over May's shoulder from behind, the wall of face-down tiles in front of her |
| B4 | 9:16 | evening | yes | side profile of May glancing to her left |
| B5 | 9:16 | evening | yes | low angle from the table surface across the face-down tiles up to May's face |
| B6 | 9:16 | evening | no | the empty table with four chairs, three-quarter view, nobody in the room |
| B7 | 9:16 | evening | yes | May pulling her chair in to the table, medium shot |
| B8 | 9:16 | evening | yes | tight close-up of May's face, soft lamp light, warm expression |
| C1 | 3:4 | evening | yes | close-up of May's hands tipping face-down tiles out of a velvet pouch onto the cloth |
| C2 | 3:4 | evening | yes | close-up of May's hands sliding three face-down tiles together into a neat group |
| C3 | 3:4 | evening | yes | a hand reaching for the wall of face-down tiles, three friends blurred in the background |
| C4 | 3:4 | evening | yes | four friends around the table laughing, one of them calling out with a raised hand |
| C5 | 3:4 | evening | no | top-down on the empty table, four chairs, evening light |
| C6 | 3:4 | day | no | a small notepad with pencil tally marks next to the kueh tray and a pencil, no readable numbers |
| C7 | 3:4 | evening | yes | three friends seated, May waving the viewer toward the one empty chair |
| C8 | 3:4 | evening | no | the same table late at night, one lamp on, quiet, tiles face down |
| D1 | 9:16 | evening | no | close-up texture of the worn green felt cloth, evening light, slight fibres visible |
| D3 | 9:16 | day | no | close-up texture of the green felt cloth in daylight |
| D5 | 9:16 | evening | no | the whole living room, empty, evening |
| D6 | 9:16 | day | no | the whole living room, empty, daytime |
| E1 | 9:16 | evening | yes | May at the table with an open notebook and pencil, explaining |
| E2 | 9:16 | evening | no | the table with four chairs, three lit by the lamp, one chair pulled out invitingly |
| E3 | 9:16 | day | yes | May holding her hand of tiles to her chest with the backs facing the camera, grinning |

After the queue, report the saved file list. Do not generate group F (icon) or G (marketing); the main session
handles those after review.

## Trimmed queue (11 Nov): this replaces the table above

Higgsfield Unlimited runs **one generation at a time for the whole account** (video, image and audio share it, across
every session). So: **one version per asset, no `_v2`**, and work strictly in this order. Video start frames (`S`)
come first because each Kling clip needs one. Save S-group files to `media-src/video/start/<id>.png`.

If Generate shows the red "1 unlimited generation at a time" toast, nothing was submitted. Release the lock, wait
2 minutes and try again. Don't stop; report only if it has refused continuously for 30 minutes.

| id | aspect | light | May? | scene |
|---|---|---|---|---|
| S2 | 9:16 | evening | yes | top-down view straight onto the green cloth, May's hands resting at the edge, face-down tiles in neat rows showing only plain green backs |
| S3 | 9:16 | evening | yes | over May's shoulder from behind, the wall of face-down tiles in front of her showing only plain green backs |
| S4 | 9:16 | evening | yes | side profile of May at the table glancing to her left, medium shot |
| S5 | 9:16 | evening | no | the empty table with four chairs, three-quarter view, nobody in the room |
| S6 | 9:16 | evening | yes | low angle from the table surface, May leaning back in her chair grinning at the camera |
| S7 | 9:16 | evening | yes | May pulling her chair in to the table, medium shot |
| A3 | 3:4 | evening | yes | both hands up beside her face, delighted open-mouthed smile |
| A5 | 3:4 | evening | yes | a kind wince with a small apologetic smile, one hand raised palm out |
| A8 | 3:4 | evening | yes | laughing with her head tipped back |
| A9 | 3:4 | evening | yes | sleeves pushed up, determined grin, ready to play |
| A7 | 3:4 | day | yes | relaxed in the rattan chair holding a mug of tea in both hands |
| C1 | 3:4 | evening | yes | close-up of May's hands tipping face-down tiles out of a velvet pouch onto the cloth |
| C2 | 3:4 | evening | yes | close-up of May's hands sliding three face-down tiles together into a neat group |
| C3 | 3:4 | evening | yes | a hand reaching for the wall of face-down tiles, three friends blurred in the background |
| C4 | 3:4 | evening | yes | four friends around the table laughing, one of them calling out with a raised hand |
| C5 | 3:4 | evening | no | top-down on the empty table, four chairs, evening light |
| C6 | 3:4 | day | no | a small notepad with pencil tally marks next to the kueh tray and a pencil, no readable numbers |
| F1 | 1:1 | — | no | product shot: a single mahjong tile lying face down, showing only its smooth jade-green back, on a dark charcoal surface, soft top light, centred, lots of empty space. No room, no text |

Then, only if the slot is quiet: C7, C8, E1, E2, E3, A4, A6, A10, D5, D6 from the table above.
