# Break Escape videos: guidelines

Draft from the m01 trial (October 2026). The later video skill builds on this. Plan and history: `M01_TRIAL_PLAN.md`, `TRIAL_LOG.md`.

## Product lines

Each product line has its own visual identity (title, cards, palette, bumpers, music) and **its own trailer rules** (user, 2026-11-22). The house style below and the recipes in `recipes/` were written for SAFETYNET and apply there as they stand.

| Line | Identity | Trailer rules |
|---|---|---|
| SAFETYNET: Licence to Hack (m01 to m10) | spy noir: keyhole title, glitch cards, red hex curtain | `recipes/mission-trailer.md` |
| Eldritch Hacker (game 2) | its own, not yet designed | to write when its trailers start |
| Courses (lab and teaching use) | its own, not yet designed (to do later) | to write |
| Cyber Aware courses | its own, neutral corporate skin (`aw-*` tokens) | the CA session's `recipes/course-trailer.md`, from `CA_TRAILER_BRIEF.md` |

A new line starts with a theme proposal on a review page (title, a content card, the end card, music) before any cut.

## House style (all kinds)

- **Fonts:** pixel fonts only. Press Start 2P for cards, captions and titles (`public/break_escape/assets/fonts/PressStart2P-Regular.woff2`); Pixelify Sans only where a second pixel face is needed.
- **Cards:** white Press Start 2P, centred, on a dark navy-to-purple vertical gradient, with a distorted mirrored reflection below the text: wavy horizontal ripple, glitch bands, strong red/blue split, scanlines and flicker, still readable as a reflection (v4; `CardStage.tsx`, `GlitchFX.tsx` `wave`). Mission trailers name their mission on the card ("Mission 1 / First Contact"), never a generic "Your Mission".
- **Title:** the game's own SAFETYNET: Licence to Hack pixel title (`tools/video/assets/brand/safetynet_licence_to_hack.svg`, 57x25 grid, `crispEdges`, integer scale: 12x on 16:9 as in the social image, 16x on 9:16, 15x on 1:1) over the keyhole capsule art, title right of the keyhole on 16:9 and stacked below it on 9:16 and 1:1; it assembles from pixel-row strips over about 1 s (`TitleCard.tsx`). Break Escape is the engine and does not appear on cards.
- **Logo:** (v4, trailers) the logo is the label at the very end, not a separate card: it resolves on a dark plate in front of the red hex curtain, with the URL under it; Licence to Hack stays the hero at the start. The real Hacktivity Cyber Security Labs logo assembles from scrambled strips, then only the line under the shared "Hacktivity" word glitches from "Cyber Security Labs" to "Games" (Hacktivity Games logo), on the card gradient (`EndLogos.tsx`; art copied from the Hacktivity repo into `tools/video/assets/brand/`). No BREAK ESCAPE stage.
- **Joins:** glitch, pixel dissolve or blur streak only into and out of cards (and the title). Gameplay to gameplay is always a hard cut. The edit lint enforces it. Glitch v2 (default 6 frames): horizontal bands displaced in hard steps that jitter frame to frame, red/blue split on the moving bands and on text, a brief blocky pixelation on the strongest frames; no noise wash, no dark bars (`GlitchTransition.tsx`). Pixel dissolve (8 frames): the outgoing frame breaks into 24 px square blocks (a multiple of the game's pixel) that drop out in a seeded random order, nearest-neighbour (`PixelDissolve.tsx`). `effects.cardJoin` in the edit list ("glitch" or "dissolve") switches every glitch/dissolve join for A/B renders.
- **Pixels:** every scale is nearest-neighbour and, wherever possible, an integer factor (2x, 3x). Crop offsets round to whole output pixels.
- **Dialogue:** use the game's own portrait view and subtitle bar. Never add a second subtitle layer on top of it. Where a crop loses the bar (9:16), add a small Press Start 2P caption from the line text instead. Strong lines get a slow push-in ending on a UI-free close-up.
- **Social crops (9:16 and 1:1; m01-m03 social cuts, 23 Nov):** every shot gets its own framing per aspect, checked on a crop sheet before render. Dialogue: centre the speaker (portrait x in the source is about 0.70 for most NPCs, 0.50 for HaX's briefing), keep the game's subtitle bar out of frame (1:1 recipe `{cy 0.43, zoom 1.2}`) and set `caption[aspect]` so the line shows as an overlay caption; the caption box lifts itself when three or four lines would run off the bottom (`Caption.tsx`). Panels wider than the 9:16 window (607 source px at zoom 1) use the letterbox (zoom 0.5625 to 1) rather than lose text at both edges; where even that cuts text, frame the start of the line and list the shot as a compromise on the review page. Post-its and answers stay out of every aspect's crop, not only 16:9's.
- **Whole-number pixel scale (25 Nov):** keep the output scale (max(outW/srcW, outH/srcH) x zoom) a whole number for gameplay shots; 9:16 zooms 0.5625, 1.125, 1.6875. `lint-edit` warns otherwise (a warning, never an error); `"scaleOk": true` on a shot records a reviewed exception.
- **Sound:** live game audio (sound effects and voice) under a music bed. Game music muted during capture (`be_music_vol=0`). 5-10 ms fades at every cut; montage audio about -6 dB; dialogue at full with the music ducked 10 dB; final loudness -14 LUFS, true peak under -1 dBTP.
- **Music:** from the game's own sets (`public/break_escape/assets/music/`). Analyse the beat grid first (`tools/video/edits/music/analyse_music.py`); card changes land on strong hits, montage cuts on beats.
- **Spoilers:** show mechanics, hide answers. No full codes, PINs, passwords or flag values; partial keypad entry only with digits that aren't the code; the antagonist may be named and shown (m01's Derek, user 2026-10-29; see the next point), but pixelate any real answer on screen (passwords, codes, flags); casualty figures are allowed when they are the stakes, such as Voltage's "forty-odd" in m04 (owner, 2026-11-23: "Relax it"); never as an outcome, and never a debrief total; no ending or choice screens.
- **Do not over-protect the story** (user, m03 v2, 2026-11-22: "maybe we are being too careful about spoilers, this is a mystery spy game"). A trailer sells the threat ENTROPY poses, the puzzles, the real hands-on hacking, the action and the mission's new mechanics. The antagonist's menace, a confrontation line (not its outcome), NPC faces and the stakes are all fair game. What stays off is narrow: answers (codes, PINs, passwords, flag values), choice and outcome screens, the debrief, and any end twist the mission itself withholds. Pick each voiced line for interest first, then check it against that short list.

## By kind of video

| Kind | Length | Shape | Notes |
|---|---|---|---|
| Mission teaser | 15-30 s | logo, title, one hook line, card, montage on the drop, antagonist line, call to action | m01 is the template (`tools/video/edits/m01_teaser.json`). One voiced line each from the handler and the antagonist at most. |
| Mission trailer | 60-120 s | cards between movements: the mission's name, `Real / Hacking`, one naming each new mechanic, and story cards in the mission's own words (`recipes/mission-trailer.md`); two or three dialogue beats, longer montage | Real VM footage needs a machine with the VM; record it separately. |
| Whole-game trailer | 90-120 s | one beat per mission arc, recurring characters, the Entropy threat | Build after several mission teasers exist; reuse their takes. |
| Social clip | 15-30 s | vertical 9:16 first; cards with larger type; captions always on | Every shot needs a 9:16 framing check. |
| Screenshot slideshow | 45-60 s | opening card, 12-20 stills at 2.5-3 s with slow pans, end card | Crossfades allowed (not a montage). `tools/video/slideshow/make-slideshow.sh`. |
| Lecture / HaX briefing | 3-10 min | to be designed: HaX portrait beside reveal.js slides, narration from the field notes, captions | Not yet built. Voiced lines must be fixed text (TTS cache rule). |
| Staff walkthrough | 5-20 min | full solution run, chaptered, captions | Spoilers allowed; mark the file "staff only". |

## Pipeline

1. **Environment** (cloud container): `tools/video/capture/env-up.sh <display>`; Rails env `LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root`; keyless server on :3001. A fresh container needs the database set up first (see `TRIAL_LOG.md`).
2. **Scout:** where each shot is, its cheapest entry state (`tools/playtest/new-game.rb` head-start flags), and which voiced lines have cached audio (test with real `/tts` requests).
3. **Takes:** one script per shot in `tools/video/takes/<mission>/`, run with `run-take.sh`. Record at 30 fps, `--preset ultrafast`, `--crf 14`; `--hide-hud` and `--zoom-step 1` for overworld shots. `check-take.mjs` finds the sync slates, corrects the offset and trims. Re-record any take over 1% dropped frames (about 1 in 3 on 4 cores).
4. **Selects:** pick in and out points from the contact sheets **and frames**. Markers in minigame takes can drift from the picture by seconds.
5. **Edit and render:** fill `tools/video/edits/<mission>_teaser.json`, then `nice -n 19 tools/video/remotion/render.sh <edit.json> 16:9 --final` (also 9:16, 1:1). About 15 minutes per 30 s at one thread. Point `BE_VIDEO_SCRATCH` at a dedicated subfolder: the script deletes it.
6. **Review:** contact sheets, loudness numbers, the spoiler checklist; then a review page for the user with compressed copies (under 14 MB each) as assets.

## Known limits (trial)

- 60 fps isn't reliable on a 4-core cloud container; 30 fps is.
- The bridge's `pressKey` doesn't reach the nested Phaser lockpicking scene; takes dispatch keyCode events to `window`.
- `--give` can't supply items an NPC hands over in conversation (Kevin's lockpick kit); play the conversation in the take's `setup()`.
- Agent HaX's phone lines have no cached audio in m01.
- No Break Escape logo art yet; no real VM footage in the container.

## v3 additions (m01 trailer)

- **Veo clips** (`tools/video/assets/clips/`, conformed 1920x1080 30 fps, smooth scale because painted): title shot `clip` (plays, freezes on its last frame, title assembles on the right) and `cta` shot type (clip, hex curtain, phased text). Clip sound is mixed via `clip.audio.gain_db`.
- **Hex curtain (v4):** the Hacktivity shell's solid curtain (`HexRain.tsx`, ported from `_launch_curtain.html.erb`): columns fill solid #b3151d with darker hex digits, a pale lead row, ragged drips running ahead, ease-in gravity (q^1.6) over 1.9 s until the screen is covered. It starts only after the spy presses the keys (clip frame 90 = 3.0 s; curtain from 3.2 s); the clip holds its last frame under it. The call to action plays clean beside the spy before that.
- **Joins:** `join.pin: true` keeps a join's own type when `effects.cardJoin` is set (the two joins around "Uncover the Mystery" are pinned dissolves). `shot.hit` adds a 2-3 frame glitch inside a shot's first frames (Derek's cut to the close-up); consecutive dialogue shots share one music duck.
- **Card reflections:** glitched, not mosaic (v4: plus ripple, scanlines, flicker).
- **J-cut:** `audio.pre` on a gameplay shot starts its audio (and music duck) that many seconds before its picture (HaX's line begins under the held title).

## v8 additions (m01 trailer, user's notes 2026-11-01/02)

- **Every minigame in the mission gets a quick cut**, in a crescendo just before the antagonist's line, with the line starting under it (standing rule for mission trailers; `recipes/mission-trailer.md`).
- **Card order:** "Uncover the Mystery" introduces the NPC lines (what people say is mystery, not a consequence of the player's actions); "Choices with Consequences" comes before the exploration montage.
- **Real hacking is this mission's real tools only** (m01: Hydra and the SSH shell; sqlmap and dirb belong to other missions). Introduce it with the player walking up to the in-game Kali station, then the terminal footage, then CyberChef. No in-game shot of the player merely standing in the server room.
- **Walking shots have a purpose** (heading for a door); props such as a swivel chair are knocked incidentally. Never walk into an NPC.
- **A clean take of a minigame may need a game fix**: the m01 key-lock pins were lagging and sampled off the drawn key (fixed in `key-insertion.js`).
- **Nothing that reveals an answer, even for 3 frames:** crop post-its and door signs out of short cuts; drop shots whose text shows a real code.
