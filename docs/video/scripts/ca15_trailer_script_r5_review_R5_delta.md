# Review R5 (final delta, sell/truth and timing together): ca15 trailer script r5 rev R4 (commit 6134eb433)

Script: `docs/video/scripts/ca15_trailer_script_r5.md`. Delta read: `git diff 60a02986a 6134eb433` on that file, the section 13a dispositions, and `ca15_trailer_script_r5_review_R4_delta.md` (bca810b72). Checked against `public/break_escape/js/systems/npc-needs.js`, `npc-behavior.js`, `scenarios/ca15_shadow_it/ink/nilesh_solanki.ink`, and `tools/video/remotion` (`CaVo.tsx`, `CaSeats.tsx`, `timeline.js`, `scripts/lint-edit.mjs`, commit 048d15134). The scratch lint file was rerun. No renders.

**Counts: 0 Blocker, 0 Major, 3 Minor.**

Verdict: all nine R4 Minors are applied correctly and nothing in the narration, gates or grid moved. The open caption point is settled below, and the script's `caption_breaks` paragraph is wrong about narrator captions (m1). That is a wording fix to the paragraph, not a change to any caption text. With the three fixes the script is ready for owner review. m1 should go in first, because an edit list built from the current paragraph would put the narrator breaks in the wrong field.

## R4 findings: applied?

| R4 | Applied | Check |
|---|---|---|
| m1 `_bags.set` | Yes | Section 6 t19 now calls `_bags.set(key, { sig, order: [2], round: 1, last: -1 })`. `_bags` is `new Map()` at npc-needs.js :524, read with `.get` and written with `.set` at :2937 to :2938. The `sig` and `_bagNext` reset note is right |
| m2 no `speaker` on cast shots | Yes | Paragraph states it for hook, 9b and beat 12. `lint-edit.mjs` :267 to :270 adds `speaker.length + 2` to line 1 on the plain skin; the reasoning and the 33 / 35 / 34 figures stand |
| m3 player 100 to 150 px | Yes, one gap (m3 below) | `facePlayerDistance` 96 is npc-behavior.js :709 and :1242, with `canSeePlayerToFace` in the test. 160 is `OVERHEAR_RADIUS`, npc-needs.js :86. Frame check added. The `.overheard` assert has a form problem (m2 below) |
| m4 four splits | Yes | Counted: v30 10 / 24 / 27, v33 B 13 / 17, v34 A 15 / 26, 9b 17 / 15 / 14, all at or under 28. Wording unchanged. Section 4 table, section 3 list, Variant A and the section 13a row agree |
| m5 chat gives up | Yes | The `c.n > 40` delete is at npc-needs.js :4684, `CHAT_GAP_MS` 500 ms, so about 20 s. The spec says restoring does not bring it back and that 9a and 9b do not need it. The no-bubble assert is kept |
| m6 tie-break | Yes | Section 12 header reads "the newest round stands: 13a (R4) over 13 (R3) over 14 (R2) over 12 (R1)", and the file-order warning is there |
| m7 ink lines | Yes | ink :87 ("To a work PC it's an unknown device") and :48 ("unknown devices come to us first") both read correctly. :65 is the habit line Nilesh speaks in beat 12 |
| m8 v36c test | Yes | Judged by the clip's end: by 3.49 s into the shot (3.79 less 0.3). "Found" at 2.30 s, end about 2.7 s, 1.09 s spare, which is arithmetic that holds whatever the lead. v36d only if the end is later than 3.49 or "found" needs a lead over about 1.0 s |
| m9 v33 voicing | Yes | Break between the sentences, stress on "I.T.", no wording change |

Recomputed and unchanged: 116 beats, 73.263 s, the narrator word total, every VO gate. No narration line changed in this delta, so the R4 timing table stands. The only edits to spoken text are the voicing note on v33.

The lint run on `ca15_r4_lint.json` gives 2 errors (no `ca_open` and no `ca_close` shot in the throwaway) and 20 warnings (missing take file, 9:16 non-integer scale on a demo fixture). It has no caption error. That matches section 13a's Lint row. What the run covers is the cast-line path only (see m1).

## The open point: narrator captions and "\n"

Narrator VO captions are drawn by `CaVo.tsx`, not `CaCaption`, and `caption_breaks` is a per-shot flag that only `CaCaption` and `caCaptionBox` read (`CaSeats.tsx` :43 to :58 and :98, `CaVo.tsx` :50, `timeline.js` `captionLineCount`).

- A narrator cue is an entry in `edit.vo[]`: `{ id, start, end, text, caption?, file?, onCard? }`. The plate renders `cue.caption ?? cue.text`, and sets `whiteSpace: 'pre-line'` whenever `cue.caption` is set (`CaVo.tsx`, last lines). So a `\n` in `caption` is honoured with no shot flag at all. A `\n` in `text` is not: `text` has no `pre-line`, so it collapses to a space, and `text` is what the voicing and the .srt carry.
- The shipped precedent is `tools/video/edits/ca00_trailer_r1_narrow.json`: `"text": "Hacktivity Cyber Aware: Security awareness training you can play."` with `"caption": "Hacktivity Cyber Aware:\nSecurity awareness training\nyou can play."`.
- `caption_breaks: true` on a narrator beat's shot does nothing for the plate. The only thing it touches there is a cast line's box, and beats 3, 5, 6, 7, 8 and 9a have no cast line. Where a narrator plate sits over a shot with a cast caption (not scripted), `CaVo` already passes the flag through to place the plate above it.
- The lint has no 28-character check on `vo[].caption`. The 28 limit is checked only for `shots[].lines[].text` with `caption_breaks` (`lint-edit.mjs` :266 to :270). The narrator lines are within 28 by this script's own counts (rechecked above), so nothing is out of range, but nothing enforces it. The 90-character check and the words-a-second check read `text`, which is the unbroken spoken string and is unaffected.
- In 9:16 the plate's width is 0.9 of the frame and the type is `voSize` (60 px at 1080), so the widest planned line (v30, 27 characters) fits; the plate grows upward from its bottom anchor, so the 3-line v30 needs no box change.

So: cast-line captions (hook 9:16, 9b 9:16, beat 12 Nilesh A and B) need `"caption_breaks": true` on the shot and `\n` in `lines[].text`. Narrator captions (v30, v32, v33 B, v34 A, v35, v36c, and Variant A's v36) need no flag and use `\n` in the cue's `caption` field, with `text` kept as the plain spoken line.

## Minor

| id | Part | Problem and evidence | Fix |
|---|---|---|---|
| m1 | Section 3, "Forced line breaks need `caption_breaks`" paragraph; section 13a Captions and Lint rows | The paragraph lists beats 3, 5, 6, 7, 8 and 9a as needing `caption_breaks`. Those are narrator captions, which go through `CaVo` and ignore the flag (see the section above). A builder following it would put `\n` in `vo[].text` (collapses; the voicing and the .srt would carry the break) and a no-op flag on six shots. The 13a Lint row calls the ten captions checked, but the throwaway ran the six narrator ones as shot `lines[]`, a path they will not take | Replace the first two sentences of the paragraph with the wording below. In 13a, add to the Lint row: "the six narrator captions were run as shot lines, which the lint checks; narrator cues in `vo[]` are not lint-checked for the 28 limit, so the counts in sections 3 and 4 stand as the check" |
| m2 | Section 6 t19, "`playerHears(joanne).overheard`" | `npcNeedsSystem.playerHears(npcId, radius)` (npc-needs.js :1966 to :1968) returns a boolean, so `.overheard` on it is `undefined` and the assert reads falsy. The object with `.overheard` comes from the world adapter's `playerHears` (:5744; `this.world`, :484). The line cite ":5762 to :5764" for `canSeePlayerToFace` is :5757 to :5760 in this tree | Write "`npcNeedsSystem.world.playerHears('ca15_joanne_pell', 160).overheard` is true (or `npcNeedsSystem.playerHears('ca15_joanne_pell')` is true)" and cite :5757 to :5760 |
| m3 | Section 6 t19, the 100 to 150 px stand | Only Joanne's 96 px is named. Niamh is the other half of the pair the frame check covers, and each NPC has its own `facePlayerDistance` test; if Niamh is nearer the player than 96 px she can turn from the kettle and the frame check fails on the take, not in the script | Say "100 to 150 px from Joanne and not within 96 px of Niamh" (choose the stand point by the pair's positions at the kettle) |

## Replacement wording for m1 (exact)

> **Forced line breaks.** Cast-line captions and narrator captions take their breaks in different fields. A cast-line caption (the 9:16 hook, 9b in 9:16, and the two Nilesh captions in beat 12) is a `lines[]` entry on a gameplay shot: write `\n` in `lines[].text` and set `"caption_breaks": true` on that shot (commit 048d15134); without the flag the `\n` collapses to a space and the line runs past 28 characters. A narrator caption (v30, v32, v33 B, v34 A, v35, v36c; beats 3, 5, 6, 7, 8 and 9a) is a cue in `vo[]` and does not use the flag: keep `text` as the plain spoken line (it feeds the voicing and the .srt) and put the same words with `\n` in the cue's `caption` field, as `ca00_trailer_r1_narrow.json` does (`CaVo` sets `pre-line` whenever `caption` is present). The lint checks the 28-character limit only for the cast-line captions, so the counts in sections 3 and 4 are the check for the narrator ones. The cards, including the close card's two lines, are card text and not captions. For v1, v37 and v11b, which have no burned caption, set `"caption": false` on the cue (the audio and the .srt stay).

The rest of the paragraph (the "Cast-line shots carry no `speaker` (R4 m2)" part) stands as written, except that "the hook, 9b and beat 12" should read "the 9:16 hook, 9b and beat 12" (the 16:9 hook is the in-game bubble). Beat 1's "caption_breaks" mention in the beat list (beat 1, 9:16 hook) is right and stays.

## What R4 got right, for the record

- The t19 spec is now internally consistent: hidden player, 100 to 150 px, clear line, full alpha inside 160, `_bags.set` with `sig`, frame check, 3.5 s bubble assert (32 characters, `bubbleMs` min(4000, 2500 + 50 x 32) = 4.0 s).
- `playerHears` does take distance from the player's body centre, so a hidden sprite still hears and an idle NPC still turns to face a hidden player. The spec says both, and the frame check is the right proof.
- The v36c rule is now one sentence about the clip's end, so a short clip cannot trigger v36d for the wrong reason.

## Fix list

| Item | Change |
|---|---|
| m1 | Replace the `caption_breaks` paragraph's opening with the wording above; add the Lint-row note in 13a |
| m2 | t19: assert through `npcNeedsSystem.world.playerHears(...)` or the boolean method; cite :5757 to :5760 |
| m3 | t19: stand at least 96 px from Niamh as well |

Ready for owner review once m1 to m3 are applied. None needs another review round: they change field names and a distance, not a line of narration, a gate or a shot length.
