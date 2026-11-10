# MahjongKaki redesign brief

Agreed in interview, 10 Nov 2026. Rebuild the app around one job, with each kept feature serving it.

## The one job

**Teach Singapore mahjong to someone starting from zero, in plain English.**

- **Who:** beginners anywhere in the world. Assume they don't know Chinese characters, mahjong terms or Singapore customs.
- **Rules:** Singapore style only (flowers, animals, tai). Every term is explained the first time it appears.
- **Money:** points everywhere. Dollar stakes are an option in Settings, off by default and never shown in online games (App Store gambling risk).

## Structure

Three tabs, with Settings behind a corner icon:

| Tab | What it is |
|---|---|
| **Learn** | Lessons in order, from the tiles up to scoring. The strategy drills become the advanced units at the end. |
| **Play** | Full games against 3 AI players, with the coach on by default. Online games with friends later. |
| **Hand** | Lay out any hand and see its tai and why, in plain English. It also works as a helper at a real table. |

**First open:** one question, "New to mahjong?" Yes goes to Lesson 1, and "I know the basics" goes to Play. The answer is remembered.

## Learn

Each lesson takes 2–3 minutes. It opens with one short explanation, then 3–5 tasks done with real tiles ("tap the pung", "drag the tile that wins"), with instant feedback and stars at the end. Lessons unlock in order, and progress is saved on the phone.

Draft units:

1. **Meet the tiles:** the three suits, winds, dragons, and bonus tiles (flowers, seasons, animals).
2. **Sets:** pung, chow, kong and the pair. A winning hand is 4 sets plus a pair.
3. **A turn:** draw, discard, and replacing a bonus tile.
4. **Claiming:** chow (only from the player on your left), pung, kong, who gets a contested tile, and winning on a discard or on your own draw.
5. **Seats and winds:** the dealer, your seat wind, and the round wind.
6. **Scoring:** what tai is, the 1-tai minimum, the common ways to score, and the cap.
7. **Your first game:** a full hand against the AI with the coach explaining each step.
8. **Advanced** (after v1): tile efficiency, waits, safe tiles, eat or pass, push or fold, hand direction, reading discards. These are rebuilt from the current drills.

## Play

- Games against the AI with the **coach on**. It suggests a good discard, explains each claim it offers ("You can Pung: that's 3 of a kind"), and warns when a discard looks dangerous. A toggle turns it off.
- A cleaner table: fewer overlays and one clear action at a time.
- After each hand, a short summary in points.
- **Friends online** is already built and stays on the server. Whether it shows in v1 is an open question (below).

## Hand (explain my hand)

Enter tiles, see the tai, and see why. Every line of the score is plain English ("+1: a set of three red dragons"). There's a link to the lesson that teaches each item.

## Look

**Decided 10 Nov:** two themes from `docs/mockups/directions.html`. **Jade Night** (dark, jade accent, Bricolage Grotesque + Inter) is the default; **Daylight** (white, green felt, coral accent, Nunito) is a switch in Settings. Both are built from one set of colour and type tokens, so every screen supports both.

Warm and playful, but checked against Caspar's design rules (`feedback_unslop_design_rules`):

- One accent colour, one type family (Instrument Serif goes, since it's on the list to avoid), tiles as the main visual.
- Rewards are short, useful feedback: a star pulse, a tile that settles. No confetti storms.
- Avoid: cream backgrounds, sparkle icons, squircles, all-caps eyebrow labels, glassy blur, dark gradient heroes.
- Beginner tile labels (1–9, E/S/W/N) are on by default.

## What goes

- Chip tracker (No Chips), Table Tracker and the For Noobs menu.
- The cinematic video hero, the felt and medallion art, and the 3D win tile and dice trial. Some may come back if they help learning.
- Dollar stakes as the default.

## What stays (code)

- `packages/engine`, `packages/game`, `packages/ai`: rules, scoring and the AI. These are tested and solid.
- `packages/online` and `functions/`: the online rooms, ready when friends play returns.
- Sounds and haptics, reused where they help.

The app's screens (`packages/app/src`) are rebuilt fresh.

## Platform

The web app comes first, moved to Firebase Hosting with one URL; github.io redirects there. The App Store comes once the web app is good.

## Plan

0. **Look sign-off:** 2 visual directions, each showing the Learn path, a lesson task and the game table. Caspar picks one.
1. **Shell:** tabs, first-open question, Settings, points by default. Then the Hand tool with explanations.
2. **Learn:** the lesson player plus units 1–6.
3. **Play:** the redesigned table, the coach, and unit 7 (first game).
4. **Launch:** Firebase Hosting, then phone testing on a real iPhone.

The work happens on a `redesign` branch. The current app stays live until the new one is better.

## Open questions

- Friends online in v1: hide it until later, or keep it under Play as "beta"?
- Name: keep "MahjongKaki"? It reads as Singlish for "mahjong buddy", which may not land with beginners outside SG.
