# Recipe (stub): Agent HaX briefing

Priority 4. A 3 to 10 minute briefing video: Agent HaX's portrait beside reveal.js-style slides, narrated from the field notes, with captions. GUIDELINES calls it "Lecture / HaX briefing: to be designed ... Not yet built". This stub records what exists and what is missing so nobody starts building by accident. House rules in `README.md`.

## Purpose

Teach one topic in the game's voice, in the spirit of a mission briefing: the handler explains, the slides show, the viewer learns something they can use in a mission or a lab. Aimed at the lab sheets and the field guides (`docs/FIELD_GUIDE_style_guide.md`).

## Length and aspect ratios

3 to 10 minutes. 16:9 for YouTube and the Hacktivity pages. Optional 9:16 clips of one slide each for social. `.srt` always; burned in on social clips.

## Intended beat sheet (not built)

Title (the game's), HaX introduces the topic (portrait), slide sequence with HaX voice-over (portrait beside slides), a worked example (a take of the real tool, or a placeholder), a recap, the call to action "Play now" and the Games sign-off.

## What exists

- The HaX portrait art and talk animation (via the pixel-art pipeline), the pixel fonts, the card style, the brand art, the Veo pair, the music set, the edit and render tooling for cards and gameplay shots, the `.srt` export.
- Cached HaX briefing voice for the mission ink that has been voiced (m01's briefing).

## What is missing (tooling)

1. **A slides component.** There is no Remotion component for a slide beside a portrait (reveal.js was the idea in GUIDELINES). Needs a spec: the layout, pixel fonts, slide transitions (hard cuts), a code or terminal slide with real answers pixelated.
2. **A way to voice fixed text.** The `/tts` endpoint only voices lines that appear in an NPC's ink (gap 11 in `README.md`). A briefing needs its script as fixed text, voiced as Agent HaX, generated once and cached: probably an ink file or a narration source for HaX that the TTS extractor knows about, and a paid generation. **New TTS lines cost money: ask the user each time with a line count.** Use `tts-audio`.
3. **Talking-head sync.** A portrait that moves its mouth to an audio track outside the game (the game's lip-sync runs in the dialogue engine). Needs a way to render a portrait talk animation from an audio file and its envelope.
4. **Captions for narration.** The burned caption component covers dialogue shots with `lines[]`, not narration over slides.
5. **A long-form edit mode.** The edit list assumes a music beat grid and short cuts; a 10 minute video needs chapters and no grid snap.
6. **Content.** A script per topic, checked against the field guide and the lab sheet; the real-hacking footage for worked examples is a placeholder until in-game VM capture exists.

## Order of work when it is started

1. The user picks the first topic and says whether HaX or another voice narrates (the user's answer so far: Agent HaX's TTS voice).
2. Orchestrator (Opus) writes the script and checks it against the field guide; Sonnet builds the missing components from a spec; the orchestrator reviews against the reference frames.
3. `video-takes` for any gameplay, `video-edit`, `video-review`.

## Review questions (draft)

1. Is the topic right and the explanation accurate?
2. Is the voice right for HaX, and is the pace clear?
3. How many TTS lines are you willing to pay for?
4. Slides: too dense or too light?
