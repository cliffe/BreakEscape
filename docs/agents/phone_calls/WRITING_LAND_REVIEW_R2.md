# Phone calls writing land: review round 2 (confirm)

Branch `build/phone-writing-land` at fc3e2d243 (worktree `.claude/worktrees/p-phone-land`). Diff reviewed: `222efdd28..fc3e2d243` (dcc249934 doc fixes, 57ae308a7 TTS, 741c53c94 and fc3e2d243 log). Reviewed 2026-11-14 against `WRITING_LAND_REVIEW_R1.md` and the "R1 outcomes" section of `WRITING_LAND_LOG.md`.

**Verdict: SHIP.** 0 blockers, 0 majors, 0 minors, 2 nits. R1's M1 and m1 are fixed, n2 is done, n1 is overtaken by the voiced clip, and nothing new needs a change before main.

## 1. The dash and model-name edits changed no meaning

dcc249934 touches the seven docs R1 named plus one line of the log: 221 lines removed, 221 added, every hunk one for one, so each edited line pairs with its original.

Method: a word-level diff of all 221 pairs (more than the 40 asked for), read by eye, plus a script that flags any pair whose changed tokens go beyond dash punctuation and its replacements (comma, colon, parentheses, full stop, `to`, `n/a`, `(new)`, ASCII `-`).

- 201 pairs change punctuation only, by R1's rules: headings and bold labels take a colon (`### M1: ...`, `**B1: ...**`), asides a comma, colon or parentheses, ranges read "X to Y" (`17 to 18`, `2 to 4`, `~51 to 65`, `~10 to 11`), and U+2212 counts are ASCII (`(-2)`, `-13`).
- 20 pairs change a word, and each one is intended:
  - 13 table rows (15 cells) in `WRITER_HAX_CALLS.md` swapped a dash-only cell for `n/a`. Each sits in an old-text column where the row's new text is "unchanged" or a structural change, or in a voiced or count column with no value for that row. The `(new)` cells (covered by the punctuation set) sit only in old-text columns of rows whose new text is a new line. The cell meaning is the same in every case.
  - Three asides became sentences: `REVIEW_WRITER_CALLERS_R1_OUTCOMES.md:157` ("... 14 choices). Both are the HaX writer's"), `REVIEW_WRITER_CALLERS_R2_OUTCOMES.md:53` ("... `parked`). This was"), `REVIEW_WRITER_HAX_R2_OUTCOMES.md:45` ("is wrong. The final wording"). Each reads correctly and says what the original said.
  - `WRITER_CALLERS.md:228` "No call-VAR openings: under plan 3.6 the Recruiter's slow-answer enjoyment is a 'may'". The added "under" keeps the reference to plan 3.6 as the reason. Correct.
  - `WRITER_CALLERS.md:253` names "the VM-track agent" where it named an agent type. Correct.
  - `WRITER_CALLERS.md:306` "Judgement:". Correct UK spelling (R1 m1).
  - `WRITING_LAND_LOG.md:27` "carried with only dash and model-name edits". Correct (R1 M1 follow-up).
- The quoted validator text (`WRITER_CALLERS.md:70` "no behavior") and old-ink spelling (`WRITER_HAX_CALLS.md:39` "neutralized") are unchanged, as R1 advised.

Tables: 48 of the edited lines are table rows. The unescaped pipe count is the same before and after on every one of them (checked both with and without code spans removed), so no row gained or lost a column. The `(new)` and `n/a` cells keep their pipes on both sides.

Headings: 64 edited lines are headings. Every one keeps its level (`#`, `##`, `###`) and its title words; only the dash became a colon or comma. The one heading I would word differently is in nit n2.

UK English: no new US spelling in any edited line.

## 2. Greps over the 16 carried docs and the log

Files: `REVIEW_WRITER_CALLERS_R1` to `R4` with `R1` to `R3` outcomes, `REVIEW_WRITER_HAX_R1` to `R4` with `R1` to `R3` outcomes, `WRITER_CALLERS.md`, `WRITER_HAX_CALLS.md`, and `WRITING_LAND_LOG.md` (17 files).

- `grep -nP "[\x{2013}\x{2014}\x{2212}]"`: no output.
- The model-name grep from R1 (three model names, case-insensitive): no output (not even the `.claude` path hits R1 mentioned, so nothing needed ignoring).

`WRITER_M3_M9.md` is in the folder but was already on main (a341c0978), so it is not one of the 16.

## 3. TTS commit 57ae308a7

- New clip `tts_cache/m10_full_disclosure/237841eb748a3037039fb6eadb0c0568.mp3`: a valid MPEG layer III file (64 kbps, 24 kHz, mono, 19677 bytes).
- Sidecar `.json`: `npc` `hax_post`, `text` "From here I'm on your phone. Message me.", `voice` Aoede, `language` en-GB, `scenario` m10_full_disclosure, `key` the same as the filename.
- Ink: `scenarios/m10_full_disclosure/ink/m10_hax_post.ink:27` is `Agent HaX: From here I'm on your phone. Message me.`. The `hax_post` NPC in `scenario.json.erb` uses `voice.(:hax_briefing)`, and the sidecar's style string is the one the extractor resolves for that voice (compared in full).
- Cache key: a keyless `bin/rails runner` over `TtsLineExtractor.for_scenario('m10_full_disclosure')` (engine root confirmed as this worktree) gives 1199 entries. The only one containing "on your phone" is `hax_post`, path `m10_hax_post.json:root.hub[0][21].b`, voice Aoede with the same style and language, key `237841eb748a3037039fb6eadb0c0568`, and its mp3 exists. So the line R1 found uncovered is now covered.
- `env -u GEMINI_API_KEY bin/rails "app:break_escape:tts:wasted[m10_full_disclosure]"`: 0 of 117 current-model clips unrequested, nothing deleted.
- Old clip: git records the old sidecar as renamed to the new one (77% similar) and `e8817b27926b470b490d8ff2c36c89b7.mp3` as a deletion. No `e8817b...` file is tracked or on disk in `tts_cache/`, and no later commit touches `tts_cache/`, so it was not re-added.
- `git diff --stat 222efdd28..fc3e2d243 -- tts_cache`: exactly those three paths (the renamed json, the new mp3, the deleted mp3). No other cache file changed.

## 4. Merge with main

`git merge-tree --write-tree e1303fc0c HEAD` prints only a tree (3e403daa3) and exits 0: no conflicts. e1303fc0c is the current `main` and is not an ancestor of HEAD, so this is a real two-sided merge and it is clean.

## Nits

- **n1.** `WRITER_HAX_CALLS.md:44` and `:397` quote the m01 hub choice label as `[Operation Shatter resolved, I'm ready for debrief]`. This label is live, not superseded: `m01_phone_agent0x99.ink:146` still has an em dash there. The doc rule forbids the dash, so the comma is right, but a reader who greps the ink for the quoted label will not find it. Optional: add "(the ink has a dash after 'resolved')" once, or quote it as `[Operation Shatter resolved ... I'm ready for debrief]`. The label is player choice text and is not voiced, so no TTS key depends on it.
- **n2.** `REVIEW_WRITER_CALLERS_R2_OUTCOMES.md:1` now reads "review round 2, outcomes", while its R1 sibling reads "review round 1 outcomes". Dropping the comma would match. Cosmetic.

## Not checked

No suites, servers, generation or key use, per the brief. Validator and phone test counts in the log were not rerun; none of this diff touches code, ink or scenario config.
