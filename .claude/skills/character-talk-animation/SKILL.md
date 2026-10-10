---
name: character-talk-animation
description: Generates the non-pixel-art source portrait (via Gemini/nanobanana MCP) for a Break Escape character's dialogue talk animation, then hands off pixel-art conversion and mouth animation to the user via PixelLab's website. Trigger when the user asks to "make a talk animation", "add a talking portrait", "generate a talk sprite", "create a dialogue portrait", or names a character PNG in `assets/characters/` and asks for its talking head.
---

# Break Escape — character talk animation

Produces the source portrait for a `<character>_talk.png` talk sheet, for a character that **already exists** as a walk-cycle sprite sheet in `public/break_escape/assets/characters/`. The Gemini portrait is the part worth automating; the pixel-art conversion and mouth animation are not (see "Why this stops at Step 2" below) and are handed to the user instead.

## What the engine expects (for context — the user does this part)

`public/break_escape/js/minigames/person-chat/person-chat-portraits.js` loads `<character>_talk.png` and treats it as a 2×2 spritesheet when the image is square, even, and ≥256px:

- **256×256 RGBA PNG**, four 128×128 frames in a 2×2 grid, transparent background.
- **Frame 0 (top-left)** — mouth closed, neutral. Shown whenever the NPC is silent.
- **Frames 1, 2, 3** — three different open-mouth / mid-speech poses, cycled at ~5fps while TTS is speaking.
- Only the face should change between frames — body, arms, clothing, hair silhouette and shoulders must stay pixel-identical, or the portrait visibly jitters.

## Files produced by this skill

For a source sprite `<name>.png`:

| File                     | Produced by                                              | Purpose                                                                   |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `<name>_nonpixelart.png` | **this skill**                                           | Gemini illustration, square, waist-up, source of truth for the conversion |
| `<name>_talk_init.png`   | pixellab-character-pipeline, or the user via pixellab.ai | 128×128 pixel-art bust                                                    |
| `<name>_talk.png`        | pixellab-character-pipeline, or the user via pixellab.ai | the final 2×2 talk sheet                                                  |

All go in `public/break_escape/assets/characters/`.

## Step 0 — study the existing sprite

Read the character's walk sheet (`<name>.png`) and its headshot (`<name>_headshot.png`) with the Read tool before writing any prompt. Note, in order:

1. Skin tone.
2. Hair — colour, texture (coily / straight / wavy), and how it is worn (ponytail, puff, bun, loose, tucked).
3. Garment — exact colour and cut (e.g. *deep navy blue V-neck scrubs*, *pale grey lab coat over a navy tee*).
4. Accessories that read at 128px — stethoscope, lanyard, badge, glasses. Drop anything smaller than that; it becomes mud.

The portrait must be recognisably the *same person* as the walk sprite, because the player sees both. Also check `list_characters` on PixelLab — the original character was often generated there and its description string is the best possible reference.

## Step 1 — Gemini non-pixel portrait

Use `mcp__nanobanana__gemini_generate_image` with `aspect_ratio: "1:1"` and `output_path` set to `<...>/characters/<name>_nonpixelart.png`. Pass the source sprite sheet as a `reference_images` entry so the outfit and colouring carry over.

**Never attach a pixel-art sprite as `reference_images`.** Gemini copies the *style* of a reference, not just its content, so a low-res pixel sprite makes it render the whole portrait in blocky pixel-art — which fights this pipeline (PixelLab does the pixelation later, from a smooth source) and clashes with the rest of the cast. This bit for real on the m02 ward patients. When the only existing art is a pixel sprite, read it for details (hair colour, garment, blanket) and put those in the **text prompt** instead; leave `reference_images` empty. It is safe only when the reference is itself a smooth (non-pixel) portrait.

Keep the prompt in this exact structure — it is tuned for this pipeline and the paragraph order matters. Substitute the bracketed parts only:

```
Make portrait for [Character name]
[One or two sentences of physical description: ethnicity/skin tone, role, garment
and its exact colour, hair colour + texture + how it is worn, any accessory.]
Body angled slightly to the side in a three-quarter turn, head turned toward the camera.
Dialog view of character
Dramatic lighting
In the style of a detailed vector graphics illustration. the portrait shows the body from the hips up, including the waistline, belt, pockets and top of the trousers, against a plain background, in a game art design, realism and digital art aesthetic. Dialog character. Gritty realism.
Slightly anime. Neutral expression.
Square aspect ratio
```

Notes:

- **"Neutral expression"** is load-bearing — this becomes frame 0 (mouth closed).
- **"three-quarter turn"** is load-bearing — a straight-on, camera-facing pose reads flat and doesn't match the rest of the dialogue cast.
- **Do not try to fix orientation in the prompt.** The cast faces *right*, but Gemini is unreliable at honouring a left/right instruction and its default output for this prompt faces left. Leave the prompt as written and mirror the result with `--flip` in Step 1b — that is the reliable way to guarantee the character faces right.
- **"hips up, including the waistline, belt, pockets and top of the trousers"** is load-bearing — cropping at the chest loses the waist/trouser detail that should be visible in frame, and a head-only crop leaves nothing for the body at all, so the 128px conversion loses the outfit entirely.
- Keep the last four lines verbatim. They are what makes the output match the existing cast (`female_scientist`, `female_office_worker`, `female_spy`).
- **Don't ask for a transparent background, or for any particular colour.** Gemini can't produce transparency: asking for it bakes a fake checkerboard into the image. The background doesn't need removing here either: the PixelLab bust stage removes it (`remove_complex_background`). The prompt text also goes to PixelLab as the bust description, so naming a colour ("magenta") risks pulling it into the pixel art. "A plain background" just keeps the edges easy to find for the crop in Step 1b.

Review the image before continuing. Re-roll if: the expression is not neutral, the pose is straight-on rather than angled, the crop stops above the waist or is head-only or full-body, the hands are mangled and visible, or the character does not read as the same person as the walk sprite.

**Gemini also reliably ignores "zoom out" / "pan down" edit instructions on its own output** — if the first pass is too tightly cropped, don't try to fix it with a `gemini_edit_image` reframe request; regenerate from scratch with a prompt that front-loads "waist up" instead.

## Step 1b — flip and reframe (always run this, never skip)

Run this on every `<name>_nonpixelart.png`, immediately after Step 1, before showing it as done:

```bash
python3 .claude/skills/character-talk-animation/scripts/reframe_portrait.py \
  public/break_escape/assets/characters/<name>_nonpixelart.png --flip
```

It does two things:

1. **`--flip` mirrors the character so it faces right**, the cast convention. Gemini's default output for this prompt faces left, so pass `--flip` every time unless a given render already came out facing right.
2. **Reframes so the character fills the square**, cropping to the character's bounding box instead of leaving Gemini's padding in. This is also the fix for the "ignores zoom out" problem above; use it instead of another Gemini round-trip. The box is found by sampling the background colour from the corners and flood-filling inward from the border, so the background has to be reasonably plain. The background stays in the image: the output is opaque, and that's fine.

If it prints `background not found (not plain enough?): not cropped`, the render has a gradient or vignette. Pass the colour yourself (`--bg-color R,G,B`, sampled from the background next to the character), or re-roll Step 1 if the character is badly framed. Don't raise `--tolerance` far: past the background it starts matching pale clothing.

Read the result before moving on: the character faces right, the crop runs from just above the head to the hips, and nothing of the figure is cut off at the sides. (`--key` also makes the background transparent. The pipeline doesn't need it, and it punches holes in garments close to the background colour.)

## Step 2 — pixel art, talk sheet and walk character (pixellab-character-pipeline)

Save the exact Gemini prompt beside the portrait as `<name>_nonpixelart_prompt.txt`, then continue with the **pixellab-character-pipeline** skill. It drives `tools/pixellab_pipeline.py` over the PixelLab REST API, which reads images from disk and so avoids the MCP upload problem described below. It produces `<name>_talk_init.png`, `<name>_talk.png` (and/or a lip-sync `<name>_visemes.png` for the `spriteVisemes` field) and a PixelLab walk character, with alternatives to choose from at each stage.

The manual route is still available if the user prefers the web UI: Image to image with the portrait as reference and the same prompt, then Animate → Interpolate frames (v3) with the bust as first and last frame, saving the results as described in "Resuming after the user's manual step" below.

## Why not the MCP for Step 2 (read before trying it)

PixelLab's "Image to pixel art" tool (with Output Scale and init-strength controls) is **not exposed through any MCP tool** — confirmed against the full 64-tool list at `https://api.pixellab.ai/mcp/docs`. The closest MCP equivalents (`create_portrait_character`, `create_1_direction_object` + `animate_object`) take inline base64 image uploads only, and that upload path is unreliable enough to make full automation not worth attempting:

- Payloads fail to decode ("broken data stream") at every size tried, from ~9 KB to ~30 KB, sometimes truncated in transit and sometimes arriving full-length but corrupted. Retries succeed unpredictably — including on a byte-identical payload.
- **Worse: a corrupted upload can succeed silently.** In one run, `custom_start_frame_base64` was accepted with no error, and the resulting 30-minute `animate_object` job produced visual noise for every frame — because the "clean" starting image it thought it received was itself corrupted. There is no reliable way to detect this before the job completes, so a failure here is not "retry immediately" but "burn ~30 minutes and generations to find out."
- Re-encoding the PNG through PIL (`Image.frombytes('RGBA', im.size, im.convert('RGBA').tobytes())`, saved with `optimize=True`) has fixed some but not all of these failures — it appears to help by stripping ancillary chunks the source export tool adds, but it is not a guarantee.

Given that a "success" can quietly be a corrupted animation burned through a 30-minute job, treat any full MCP-only attempt at Steps 2–4 as experimental, not the default path. If asked to try anyway, warn the user explicitly about the silent-corruption failure mode before starting, and verify frame 0 by eye against the local init image before letting a long animation job run.

## Resuming after the user's manual step

Once `<name>_talk_init.png` exists and the user has either:

**(a) provided a finished `<name>_talk.png`** — verify it with:

```bash
python3 .claude/skills/character-talk-animation/scripts/check_talk_sheet.py \
  public/break_escape/assets/characters/<name>_talk.png
```

Nothing else to do if it passes.

**(b) provided raw animation frames** (a folder of 128×128 PNGs, one per pose, frame 0 = mouth closed) — composite them mechanically, do not regenerate anything:

```bash
python3 .claude/skills/character-talk-animation/scripts/build_talk_sheet.py \
  --base   public/break_escape/assets/characters/<name>_talk_init.png \
  --frames <dir-of-frames>/*.png \
  --out    public/break_escape/assets/characters/<name>_talk.png
```

This takes frame 0 as the canonical base, auto-detects the face box, picks the three most distinct candidates for the mouth, and pastes only that region over a copy of the base — so the body stays byte-identical across all four output frames regardless of what the source frames' bodies did. Sanity target from the reference asset (`female_scientist_talk.png`): 200–450 changed pixels per frame, confined to the head box. Then run `check_talk_sheet.py` as above.

## Step (final) — wire it up (only if asked)

The sheet is picked up automatically by filename convention wherever the NPC's `spriteTalk` points at it. If the user wants it used, set `spriteTalk` in the relevant scenario NPC definition to `assets/characters/<name>_talk.png`. Do not edit scenarios unless asked.
