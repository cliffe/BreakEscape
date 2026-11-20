# Recipe (stub): concept explainer

Priority 4. A short explainer of one security concept (for example how a keypad PIN can be guessed, what base64 is, how a lock is picked) using the game's own scenes as the example. This stub records what exists and what is missing. House rules in `README.md`.

## Purpose

Connect a concept the mission teaches to what the player does in the game, in under two minutes, for YouTube, the Hacktivity pages and LinkedIn. It sits next to the lab sheet and the field guide, not instead of them.

## Length and aspect ratios

60 to 120 s. 16:9 first; a 9:16 and 1:1 cut with burned captions for social. `.srt` always.

## Intended beat sheet (not built)

| Beat | Content |
|---|---|
| Title | the game title |
| The question | a card in plain words ("What is base64?") |
| In the game | a take showing the player meeting the concept (a minigame or a note) |
| The idea | three short cards or a diagram, one idea each |
| In the real world | one sentence connecting it to real practice |
| Try it | "Play now" with the mission that teaches it; the Games sign-off |

## What exists

Cards, gameplay shots, captions from `lines[]`, the Veo pair, the music set and the render tooling can make the title, question and in-the-game beats today. The concept-teaching content is in `docs/CyBOKList.md`, the field guides and the mission lab sheets.

## What is missing (tooling and content)

1. **A diagram or annotation component.** No arrows, highlights, step diagrams or animated schematics. Without one the "idea" beat is text cards only. The `artifact-diagramming` skill is for pages, not for Remotion.
2. **Narration.** The user's answer is Agent HaX's TTS voice, which needs fixed ink text and a paid generation (gap 11 in `README.md`); until then the explainer is captions and music only. **New TTS lines cost money: ask each time with a line count.**
3. **Worked examples with real answers.** The examples must use worked examples, never a mission answer (m01's CyberChef take decoded the briefcase notes' own worked example for this reason).
4. **A content check.** The explanation must match the field guide and the lab sheet. The orchestrator (Opus) reviews the script; Sonnet should not invent teaching content.
5. **Real tool footage.** VM and terminal footage is a placeholder until in-game VM capture exists.

## Order of work when it is started

1. The user picks the concept and the mission scene.
2. The orchestrator writes the script and the card text; `video-scout` finds the scene; `video-takes` records it; Sonnet builds the missing component from a spec; `video-edit` and `video-review`.

## Review questions (draft)

1. Is the concept explained correctly, and at the right level?
2. Does the in-game scene show it clearly?
3. Is any answer or spoiler on screen?
4. Captions only, or paid narration?
