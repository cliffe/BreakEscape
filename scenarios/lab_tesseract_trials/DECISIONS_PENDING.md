# The Tesseract Trials: decisions pending

(D1-D3 resolved 2026-10-06; see DECISIONS_LOG.md)

## D4. Blind timing for Trial VI onward

Two blind/regression playtests in auto mode were stopped by the auto-mode safety check at the same step (the command decoding Trial VI's Base64 and Caesar layers). A non-blind Opus run got through it, so every lock is proven playable, but there's no blind timing from Trial VI to the end. Trials I-V took ~13 min blind with no hints. Options: (1, recommended) a human run: you or a couple of students play it start to finish on :3001, timed, which is also the real beginner test; (2) a session outside auto mode where the blind playtest agent can drive CyberChef.

## D5. Art for the real academics and new NPCs

`ART_NEEDED.md` lists the portraits and sprites: Cliffe, Tom, Sidhu, Jordan, Megan, plus props. The academics need reference photos and their consent. Standing rule: Gemini concept first for approval, then PixelLab one at a time; a full walking character with lip sync costs ~125 PixelLab generations, a bust-only character ~50.

## D6. Audio

No TTS has been generated. It costs money, and every spoken line is listed in the fix notes. The usual order is after the art and after you've read the lines.


## Deferred engine items

Fixed 2026-10-06 in 3cfada8b (user-approved): E1, E2, E3, E6, E7, E8, E10. Still deferred by the user: E4, E5.

- **E4. A page reload loses the CyberChef recipe and input** (PLAYTEST_P1 finding 3). The iframe state isn't saved. A possible fix is to keep CyberChef's URL hash in localStorage and restore it on first open. Mitigation here: the notepad scratch pad for keys and IVs.
- **E5. A page reload puts the player back at the start position** (PLAYTEST_P1 finding 4, P3 m5), though rooms, inventory and tasks are restored. It affects every mission.
- **E9 (new finding). The engine is right; the playtest harness is wrong.** `movePlayerToPoint` already steers the feet to the click target, and measured side-door clicks on m01 and this mission land within 4 px of the door and cross over. What stalls is the harness: `keyboardWalkTo` in `public/break_escape/js/systems/test-bridge/index.js:309-311` and `enter` in `.claude/skills/playtest-scenario/scripts/playtest-session.js:613-650` aim the sprite centre. Fix (needs the user's go-ahead, since it changes a shared skill script): aim side doors so the feet land on the door y.
- **E1 follow-up.** This mission (and test-tesseract-probes) dropped `currentKnot`/`targetKnot` on the Ghost phone as a workaround; it can go back if wanted.
- **E6 follow-up.** SOLUTION_GUIDE.md:237 and the in-game "use the Copy button" advice describe the old header/footer. The notepad still displays ` -- ` as an en dash (`displayDashes`, notes-minigame.js:127, 383), so copying ciphertext off the screen can still alter it; the stored note is right.
- **E10 note.** Door definitions in a room's `doors[]` aren't walked by `filter_requires_and_contents_recursive`; no scenario puts `requires` there.
