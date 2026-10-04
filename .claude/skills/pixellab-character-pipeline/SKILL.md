---
name: pixellab-character-pipeline
description: Takes a Break Escape character from a reframed Gemini concept portrait to in-game assets through the PixelLab REST API (tools/pixellab_pipeline.py). It makes the pixel-art dialogue bust, the 2x2 talk sheet and/or a lip-sync viseme sheet, and an 8-direction walk character with the standard six animations. It then reviews and repairs bad animation frames and imports the atlas into the game. It generates alternatives and stops for a choice between stages. Trigger when a `<name>_nonpixelart.png` exists and the user asks to "make the pixel art version", "do the talk animation", "add lip sync", "run the PixelLab pipeline" or "create the walk sprite from the portrait", when they paste pixellab.ai character URLs and ask to "import" them or "add them to a mission", when they ask to "check/fix the animation frames", or to continue after character-talk-animation Step 1b.
---

# PixelLab character pipeline

One script, [tools/pixellab_pipeline.py](../../../tools/pixellab_pipeline.py), drives every step. `python3 tools/pixellab_pipeline.py <command> --help` documents every flag. Images go from disk to HTTP inside the script. **Never** pass images to the PixelLab MCP as base64 for this work, because that path corrupts uploads silently (see character-talk-animation).

| Stage             | Command     | API                                                              | Produces                                                   |
| ----------------- | ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| 1 bust            | `bust`      | `/create-image-pixflux` (init image = Gemini art, same prompt)   | `<name>_talk_init.png` 128×128                             |
| 2a talk           | `talk`      | `/animate-with-text-v3` (bust as first *and* last frame)         | `<name>_talk.png` 2×2 sheet                                |
| 2b lip sync       | `visemes`   | `/inpaint-image-pro-flash` on the mouth and eyes                 | `<name>_visemes.png` + `.json`                             |
| 3 walk character  | `character` | `/create-character-pro` (`create_from_concept`, style character) | a PixelLab character id                                    |
| 4 animations      | `animate`   | `/characters/animations` (template mode)                         | the standard 6 × 8 directions on that character            |
| 5 review / repair | `qa`, `fix` | `/edit-images-v2` only for `fix --use ai`                        | contact sheets; committed frame overrides                  |
| 6 import          | `import`    | `/characters/{id}/zip`                                           | `<key>.png/.json/_headshot.png`, game.js preload, manifest |

`animate`, `import`, `qa` and `fix` also work on characters made outside the pipeline. Give them a pixellab.ai URL, a character id, or an already-imported key.

## Rules

- Check `balance` first. Tell the user the planned spend before any paid command, and get a yes before anything costing about 20 generations or more (`character`, `fix --use ai`, a full inpaint `visemes` set). Every paid command takes `--dry-run`.
- At every choice point, **Read the contact sheet image yourself**. Show it to the user with your assessment, then wait for their pick unless they said to choose.
- **Every portrait faces right.** Busts, talk sheets and viseme sheets for NPCs and player alike face the viewer's right (judge by where the face and gaze point, and for a patient in bed not by which side of the pillow the head is on). Person-chat draws the player as stored on the left and mirrors NPCs on the right, so a left-facing file makes the NPC face away. Check this at the bust pick, before any sheet is built from it; flip frame by frame if it's wrong.
- Never delete PixelLab characters, and never overwrite a game asset silently. `pick` and `import --force` back up whatever they replace.
- A killed run leaves jobs `submitted`. `collect <name>` finishes them without paying again (for `animate`, just rerun it; it resumes from its in-flight log). Don't rerun a paid stage command to recover.

## Stage 0: init

```bash
# new character, from the reframed Gemini portrait (prompt read from <stem>_prompt.txt beside it)
python3 tools/pixellab_pipeline.py init <name> --concept public/break_escape/assets/characters/<name>_nonpixelart.png
# existing character that already has a talk sheet, to add lip sync only
python3 tools/pixellab_pipeline.py init <name> --bust public/break_escape/assets/characters/<name>_talk.png
```

Work files live in `tmp/pixellab/<name>/` (git-ignored). `state.json` there records every job, its parameters, cost and pick. `status <name>` summarises it.

## Stage 1: bust

`bust <name> --variants 4` (about 1 generation each). Defaults match the manual process: 128px, `--strength 250`, the full Gemini prompt, and a transparent background. Look for: the same person as the concept, the three-quarter pose kept, the mouth closed, correct colours, and a clean alpha.

`--strength` trades faithfulness for crispness. Tested on four concepts: **250** stays on-model but looks softer, like a painted downscale. **150** looks crisper and more pixel-art, but drifts: it added a moustache, turned a green blouse blue, and made a face younger. Default to 250. Try a pair at 150 when softness matters, and check hard for drift. `--guidance` (1–20) sets how hard the prompt pulls. `--engine pixelart [--faithful]` switches to the web UI's *Image to pixel art*. The web UI's "AI freedom" slider has **no public-API equivalent**, and its image-to-image output is crisper than anything the API parameters produced. **If the user already has a web-UI bust, add it as candidate `b00`** (`init --concept … --bust <file>`); for Bernie it beat every API variant.

**The concept doesn't need a transparent background.** `bust` asks PixelLab to remove it (`remove_complex_background`), so an opaque Gemini render goes in as it is, once `reframe_portrait.py` has flipped and cropped it. Check each bust's alpha edge in the contact sheet: hair or a dark garment against a similar background can lose its outline.

`pick <name> bust b03` installs `<name>_talk_init.png`.

## Stage 2a: talk sheet (the current engine default)

`talk <name> --variants 2` (about 2 generations each, 1–3 minutes). The house talk prompt is the default `--action`. The API returns 9 frames. `f00` is a copy of the start frame, so choose from `f01`–`f08`. The contact sheet has a **mouth-zoom** row under each variant: choose three clearly different shapes (for example "ah", "oo", "ee") with the eyes and head still.

```bash
python3 tools/pixellab_pipeline.py pick <name> talk t01 --frames 2,4,5     # or t01:2,t02:4,i01:round
```

`pick` builds the sheet with `build_talk_sheet.py`, pasting only the face box so the body stays pixel-identical, then runs `check_talk_sheet.py`.

**Check the face box preview every time.** `pick` (talk and visemes) writes `tmp/pixellab/<name>/face_box_preview.png`, with the box drawn on the bust and on the most open mouth. The box should run from just under the eyes to the chin: the mouth inside, the eyes and collar outside. The eyes matter because the models blink: the talk animation often closes them, and pasting them in gives a character who shuts their eyes to speak. The collar matters because some runs re-render every pixel slightly. The automatic estimate is only accurate to about 5px, which is the gap between the eyes and the mouth, so pass `--face x0,y0,x1,y1` whenever the preview is off (Bernie: `46,25,82,44`). Expect a few hundred changed pixels per frame, confined to the box.

**Then pass `--mouth cx,cy,rx,ry` as well** (the lips' centre and half-width/height at 128px, e.g. Ms Chen `67,47,5.5,3.5`). The talk model redraws the whole lower face a shade off, so pasting the full box shows in game as a rectangle flickering round the mouth and chin. With `--mouth` only the ellipse is pasted: expect 50–100 changed pixels per frame, and on masked or bearded faces no seams at the box edge.

## Stage 2b: lip sync (named mouth shapes)

The engine supports an NPC field `"spriteVisemes": "assets/characters/<key>_visemes.png"`, with `spriteTalk` kept as the fallback. While TTS plays, the TTS manager decodes the line's audio and fits a mouth shape to each stretch of the loudness curve (open vowels on loud parts, lips and f/v/s in the dips, `rest` in silences), so the mouth follows the voice in real time with no API calls. The portrait blinks while the mouth rests. Details: docs/SPRITE_SYSTEM.md and `js/minigames/person-chat/lip-sync.js`.

Each shape is one `/inpaint-image-pro-flash` call on the picked bust, masked to the mouth (prompts in `MOUTH_SHAPES`, matched to the letter classes in lip-sync.js). Every pixel outside the mask is kept, so the nose, jaw and the mouth's off-centre position on a three-quarter head survive. PixelLab's `/vocal-animation` was tried first and removed from the tool in September 2026: it assumes a face looking straight at the camera, and on our busts it lost the nose and pulled the mouth up and to the centre (Bernie's old sheets are in `tmp/pixellab/bernie_nwosu/replaced/`).

### Steps

1. **Bust.** A character with no pipeline run yet: `init <name> --bust public/break_escape/assets/characters/<name>_talk.png` (the top-left cell of a 2×2 sheet is used as the bust).
2. **Find the boxes by eye.** The mouth box (`--mouth`) covers the lips with its top edge just under the nostrils. The eye box (`--eyes`) covers both eyes and lids, with the eyebrows outside. Without `--mouth` the tool guesses from red/pink lip pixels, but dark or skin-toned lips aren't found (six of the eight m02 busts), and in the September 2026 batch of 17 every heuristic (lip colour, eye whites, darkest row) was right only about half the time. Render the head at 9–12× with lines every 5px and labels (1px lines drown the pixels), read the coordinates, then draw the boxes on the bust with no grid and look again. 2px too low and the model redraws the chin instead of the mouth (it happened twice); 2px to one side and one corner of the mouth is left unchanged.
3. **Dry run (free).** `visemes <name> --dry-run --mouth x0,y0,x1,y1 --eyes x0,y0,x1,y1`. Read `visemes/mouth_box_preview.png` (red = lips mask, orange = jaw mask) and `visemes/eyes_box_preview.png`. The orange box should cover the chin and a few rows of neck.
4. **Generate** (~36 generations; get a yes first): `visemes <name> --mouth … --eyes … --subject "a man in his forties"` → variant `i01`. `--subject` helps the model keep the age and stubble.
5. **Review.** Read `visemes/i01/*.png` as a mouth close-up at 6–8×, over a dark background as well, since the dialogue panel is dark. The tool prints the changed pixels per shape and warns under 8 (`MIN_CHANGED_PIXELS`): that shape came back as the resting mouth.
6. **Re-roll only the weak shapes** (6 each): `visemes <name> --mouth … --shapes teeth,wide_open` → `i02`. Use the same mouth box, or `pick` warns. If a box was wrong, fix it and redo everything that used it.
7. **Pick**: `pick <name> visemes i01 --swap teeth=i02,wide_open=i02 [--omit round]`. This writes `<name>_visemes.png` (one row of 128px cells, `rest` = the bust) and `.json` (column names, plus which variant and jaw drop each came from), backing up whatever it replaces. Omit a shape that failed twice; the game falls back to the nearest shape, then `rest`. The raw outputs stay in `visemes/<id>/raw/`, so compositing can be redone for free.
8. **Wire it** (only if the user asked for scenario edits): add `"spriteVisemes"` after `spriteTalk` on every NPC using that portrait, in every scenario (`grep -rl '<name>_talk.png' scenarios/`). Leave player blocks alone, since the player's portrait doesn't animate. Run the validator (validate-scenario skill) and restore any unrelated files it rewrites, such as a regenerated `dungeon_graph`.
9. **Check in game** (playtest-scenario, subagent on `model: "sonnet"`). Open a conversation with a voiced NPC and confirm the sheet loads (`window.MinigameFramework.currentMinigame.ui.portraitRenderer.visemeSheet`), `….portraitRenderer.ttsManager.lipSync.timeline` is set while a line plays, the mouth is at `rest` in pauses, and the blink appears. Tell the agent not to write files in the repo root and not to re-save assets.

### Notes

- **The jaw.** An open mouth needs the chin to drop, and the model won't move a jaw however it is asked: given a bigger mask, it stretched the mouth sideways off the face. So for `medium_open` and `wide_open` the tool moves everything below the lip line down first (1px and 2px at 128px; `--drop` scales it, 0 turns it off), then sends a larger jaw mask (3px wider each side, `--jaw 5` rows past the mouth box, not clipped to the silhouette) so the model draws the open mouth into the gap and blends the seams. Pro Flash paints transparent areas pure white; those are keyed back to transparent.
- **Collar and hair below the chin stay put.** On a bust with a short neck, the chin drop used to carry the collar tips down 1–2px and let the model re-shade the hair beside the jaw (Agent HaX, September 2026). For the open shapes, every jaw-box pixel below the lowest row the chin can reach (mouth box bottom + drop) that isn't skin-coloured in the bust is now restored from the bust (`keep_clothing`).
- **Automatic clean-up.** Lone changed pixels, and light or grey specks painted over background, clothing or hair outside the mouth box, are reverted. Blink frames are exempt, because their eyelids sit outside the mouth box. A speck *inside* the mouth box (nurse1's `wide_open`) has to be fixed by hand: copy the bust's pixel back into the installed sheet.
- **What to expect** (Bernie, then a batch of 17). `round`, `medium_open` and the blink are usually right first time. `teeth` and `small_open` often come back too close to rest, especially on stubbled or low-contrast faces; about one in three needed a second take, and Graham and the male guard never got either. `wide_open` looked like a shout at a 3px drop with a "wide" prompt; a calm "conversational ah" was then too timid across the batch, so the prompt now gives a size (about twice the height of the closed lips, upper teeth just visible). `closed` lost the lip colour on every take, so it isn't generated: the sheet leaves it out and the game uses `rest` for m/b/p.
- **Skip the blink** when the eyes are hidden (sunglasses: `male_spy`); glasses are fine (`male_nerd`). **Skip the character** when the face is hidden (`male_hacker_hood`).
- **Batches.** Keep a JSON of mouth and eye boxes per character, submit in a loop, then review each variant's close-up. The 17-character batch cost 606 generations, plus 150 for re-rolls.
- Lip sync follows TTS audio, so an NPC whose lines get no audio stays on `rest`. Co-speakers (an NPC with a voice but no `storyPath`, whose lines are inside another NPC's story, e.g. Netherton in HaX's briefing) are validated against every Ink story in the mission. Before that fix they were refused with a 403 and stayed silent.

## Stage 3: walk character

```bash
python3 tools/pixellab_pipeline.py character <name> --dry-run
python3 tools/pixellab_pipeline.py character <name> --variants 1      # 20-40 generations EACH
```

It sends the concept as `concept_image`, Gary Whitlock (`2b2d5800-…`) as `style_character_id`, and the style character's size (60px), low top-down. `--style-character <id>` uses another cast member. `--bust-reference` also sends the bust, but it replaces the style character's south sprite as the style centre. Every variant becomes a real character in the account; `pick` lists the unpicked ones for the user to delete by hand.

## Stage 4: standard animations

```bash
python3 tools/pixellab_pipeline.py animate <name|id|url> --dry-run    # shows exactly what is missing
python3 tools/pixellab_pipeline.py animate <name|id|url>
```

This is the house set from the pixellab-character-animations skill: `breathing-idle` 4f, `walk` 6f, `cross-punch` 6f, `lead-jab` 3f, `taking-punch` 6f, `falling-back-death` 7f, in all 8 directions, template mode, 1 generation per direction (48 for a new character). It fills **only the gaps**. New directions go into the existing group for that template, so animations are never split. It keeps the 8 job slots full as they free up (the rolling 7+1 pattern, automatically), retries failed directions, then re-reads the character and reports anything still missing. The web UI shares the same 8 slots.

## Stage 5: review and repair frames

PixelLab often gets a frame, or a whole direction, wrong. Examples found on the mission 2 cast: a south idle facing away in all 4 frames; a single idle frame flipped to a back view; teal trousers across a north walk; lighter skin on one side view; a missing ponytail; an added tie or gloves. Re-rolling can repeat the error, so the tools let you patch or choose between takes.

```bash
python3 tools/pixellab_pipeline.py qa <key>
```

This writes one contact sheet per animation to `tmp/pixellab/_qa/<key>/` (a row per direction: rotation first, then the frames, all at native size and aligned on the figure). **Looking at the sheets is the detector.** In a review of 10 characters, the automatic hints found about 4 real defects among 127 flags and missed most of the real ones. That's why only FACING, JUMP and CANVAS are still flagged. Read every sheet (delegate to a subagent for a whole cast) and compare each row with its rotation, looking for:

1. A frame or strip facing the wrong way.
2. Colours, skin tone or clothing not in the rotation.
3. Missing or added details (hair, tie, gloves).
4. Broken anatomy.
5. A frame that breaks the motion.

Punches and falls often turn towards the camera on N/NE/NW. That's a pattern in the stock templates: fix only the worst cases. CANVAS just means a strip came back on a different frame size; the converter places each size separately.

Fix with the cheapest method that works, and show the user the before/after sheet each command prints:

| Problem                                           | Fix                                                                                                                   | Cost         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------ |
| One or two bad frames in a strip                  | `fix <key> breathing-idle south 1 --use frame:2` (copy a good frame)                                                  | free         |
| Side view off-model, opposite side is good        | `fix <key> walk east all --use mirror` (opposite side, flipped). Check for one-sided details: badge, lanyard, holster | free         |
| Hand-edited frame                                 | `fix <key> walk north 3 --use file:path.png`                                                                          | free         |
| Whole strip facing wrong / poses unusable         | `reroll <key> breathing-idle south --tries 2`, then `--accept tNN`                                                    | 1 per take   |
| Whole strip off-model, poses fine, no good mirror | `fix <key> walk north all --use ai` (edit against the rotation; poses kept)                                           | ~20 per call |

- `reroll` is non-destructive. Each take is generated in a temporary group, downloaded, and the temporary group deleted, so the character's original animation is untouched. It prints a sheet of the current strip against every take. On Val's south idle, take 1 had one frame flipped to a back view, and take 2 was clean.
- `fix` and `reroll --accept` write frames to `tools/pixellab_overrides/<key>/<template>/<direction>/`, which is **committed** and reapplied by every `import`. Rebuild with `import <key> --offline --force`.

## Stage 6: import into the game

```bash
python3 tools/pixellab_pipeline.py import <name|id|url> --key <spriteSheet key> --register
python3 tools/pixellab_pipeline.py import <key> --offline --force     # rebuild after `fix`
```

- Downloads the ZIP from the API. Nested state folders and web-UI display names (`walking`, `jab_attack`, `animating` ...) are handled: each folder is matched to its template by comparing its pixels with the API frames. Without this, NPCs with display-name folders never animate.
- Applies the committed overrides, then converts with `tools/convert_pixellab_to_spritesheet.py`. Frames smaller than 80×80 (Pro characters are 60×60) are placed on 80×80 cells, centred with the feet on row 69, because the engine's collision boxes assume that layout. Strips on a different canvas size (backfills can come back at 76 or 80px) get their own placement, from the median standing pose.
- `--register` adds `this.load.atlas(...)` under "PixelLab API imports" in `game.js` preload. The NPC then only needs `"spriteSheet": "<key>"`.
- Refuses an incomplete character (run `animate` first) unless `--allow-incomplete`. Refuses to overwrite files without `--force`.
- Records key → character id in `tools/pixellab_characters.json` (committed), so `import <key>` re-imports by key later.
- **States.** A PixelLab state (web UI, or `POST /create-character-state` with an `edit_description` such as "hands in hoodie pockets") is a separate character in the same group, and the ZIP carries every state as its own folder. `--idle-from <state id>` takes breathing-idle from that state and everything else from the target, e.g. a relaxed pockets idle with hands-out walk and punches (male_hacker_hood_v2, female_hacker_hood_down_v2). Animate the state with `animate <state id> --templates breathing-idle`. The choice is saved in the manifest, and the converted state folder is recorded in `_export/<key>/.state_folder` so `qa` and the converter don't pick a state alphabetically.
- **Back views of open jackets.** Template animations often paint the undershirt where the back panel should be (female_hacker_hood_down_v2: white vest through a yellow hoodie on north/NE/NW). Mirror the clean opposite side where one exists; for north (no mirror) use `fix … --use ai --prompt "Seen from behind: her <colour> hoodie covers her whole back…"`.

**Choosing keys.** A named NPC gets their own key (`bernie_nwosu`). A new take on a generic type gets a new key (`female_nurse1_v2`), because the old keys (`female_nurse1` …) are shared by several missions. Changing an NPC's `spriteSheet` doesn't change their dialogue portrait: `spriteTalk` stays as it was. Say so, because the walk sprite and the portrait may no longer match.

After changing a scenario, run the validator (validate-scenario skill). If the user wants to see it in game, use playtest-scenario.

## Cost (measured September 2026)

| Call                             | Generations                   |
| -------------------------------- | ----------------------------- |
| bust (pixflux)                   | 1 per variant                 |
| talk (animate v3, 8 frames)      | 2 per variant                 |
| visemes (inpaint)                | 6 per shape (~36 for all six) |
| character (Pro)                  | 20–40 per variant             |
| animate (template)               | 1 per direction               |
| fix --use ai (edit-images-v2)    | 20 per call (up to 16 frames) |
| reroll (template, one direction) | 1 per take                    |
| ZIP export, reads, dry runs      | free                          |

The script records each job's reported usage and prints running totals. Quote those numbers once a run has started.
