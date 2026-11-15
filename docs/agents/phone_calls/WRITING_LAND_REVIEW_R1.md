# Phone calls writing land: review round 1

Branch `build/phone-writing-land` at c2611fa6e (worktree `.claude/worktrees/p-phone-land`), from main 896ec3cd8. Reviewed 2026-11-14 against `WRITING_LAND_LOG.md`.

**Verdict: REVISE.** 0 blockers, 1 major, 1 minor, 3 nits. The code side is correct and can land as it is. The major is the repo file rules on the 16 copied docs (dashes, one model name), which must be fixed before main.

## 1. "Main already has everything else" (m01, m03 to m09)

Method: for every non-doc file the writing side touches (39eedbb9a..734b6e922, 22 ink/ERB sources plus their JSON), `git merge-file --diff3` with ancestor 39eedbb9a, ours = HEAD, theirs = 734b6e922.

- 15 files merge cleanly and the result is byte-identical to HEAD, so every writing change in them is already on main.
- 7 files conflict (8 hunks). Resolving every conflict to HEAD's side (`--ours`) gives HEAD byte for byte in all 22 files, so the conflicts are the only places where the two sides disagree. Each one:

| File | Hunk | Main side | Traced to | Holds? |
|---|---|---|---|---|
| m01 `m01_phone_agent0x99.ink` | `first_ring` added on both sides | writing copy plus `#set_global:m01_first_ring_done:true` | engine M8 | Yes, a superset |
| m04 `m04_phone_agent0x99.ink` | `on_anomaly_confirmed` | "ENTROPY are feeding the control room." | 57e29d189 (M4 R5 nit, on main, not on writing) | Yes. Reads as a statement, not an order; the clip exists (extractor entry has an mp3) |
| m07 `m07_architect_comms.ink` | Hang up stub | `+ [(Hang up.)]`, no narration after | 7fecbed08, 6b6394ae9 | Yes |
| m07 `m07_architect_comms.ink` | `seattle_call_choices`, `taunt_t20_vm` | "Seattle will tell you in the morning..."; `{not t20_folded:` guard | 2eff0b186 | Yes |
| m08 `scenario.json.erb` | door-audit timed text | "Call me when you've got both." | 96afeaa70 (M10 R1 m2) | Yes, see below |
| m09 gary, nightshade, torres inks | home stub comment | "Conversation ended" notice wording | engine track | Yes, comment only |

The m07 sign-off line (c22f606bc) and the callers R3 teacher-echo fix (5c6327184) merge cleanly, so main has the content. 5c6327184 itself is not an ancestor of main (the content came over in the engine track's landing), which matches the log's "already on main".

All cited commits (57e29d189, 7fecbed08, 6b6394ae9, 2eff0b186, c22f606bc, 96afeaa70, dd2ba4ae5, 7a984280d, cc7c30e4f) are ancestors of main and not of the writing tip, so each one postdates the fork. Each touches the file the log says it does.

**m08 "Call me" call entry is real.** `agent_0x99` in `scenarios/m08_the_mole/scenario.json.erb` has `"call": [ { "knot": "hax_read_1", "button": false } ]` and `callLabel` "SAFETYNET secure line". The hub choice `[I can name the leak.]` (`m08_phone_agent_0x99.ink`, gated on the door audit plus a clock source) runs `#place_call:hax_read_1`, and `hax_read_1` is a `// lint: call-knot`. So the player does make the call, from the text thread rather than a call button. "Call me" is accurate, and it matches the KO-path texts at ERB lines 859 and 865.

## 2. m02 and m10

- m02 (fdb3c673d): "Copy. Message me when you need me." and "Copy that. I'm here, {player_name()}." The m02 ERB has no `"call"` entry anywhere, so the old "Call..." lines promised something the player cannot do. Both lines are in the text thread. `{player_name()}` is fine there because m02 HaX is not a voiced call host (keyless `tts:wasted`: 0 of 1087 unrequested, every extractor key has a clip).
- m10 (a1fbadd1a): `hax_post` (in person at the van, Aoede) now says "From here I'm on your phone. Message me." The m10 ERB has no `"call"` entry, so the phone `agent_0x99` only rings the player (its seven voiced calls are ring mappings) and keeps a text `support_hub`. "Message me" is right; "Ring me" was not.
- `scripts/compile-ink.sh m02_ransomed_trust` (15 compiled, 0 failed) and `scripts/compile-ink.sh m10_full_disclosure` (32 compiled, 0 failed): `git status` shows no change, so the committed JSON matches the ink.

## 3. The `-s ours` merge

c2611fa6e has parents 81ab1675a and 734b6e922. `git diff HEAD^1 HEAD` is empty.

`git merge-tree --write-tree e1303fc0c HEAD` prints only a tree (59ae1ef07), so there are no conflicts with current main.

## 4. Repo file rules on added and changed files

The ink changes in m02 and m10 contain no dashes. `WRITING_LAND_LOG.md` is clean. Nine of the 16 copied docs are clean: the four `REVIEW_WRITER_CALLERS_R*.md` reviews, `REVIEW_WRITER_CALLERS_R3_OUTCOMES.md`, and `REVIEW_WRITER_HAX_R1.md` to `R4.md`.

### M1. Dashes and a model name in seven copied docs (fix before main)

196 lines across 7 files carry an em dash (U+2014) or en dash (U+2013):

| File | Em-dash lines | En-dash lines | Line numbers |
|---|---|---|---|
| `REVIEW_WRITER_CALLERS_R1_OUTCOMES.md` | 25 | 2 | 12, 25, 43, 47, 53, 57, 65, 69, 70, 75, 91, 96, 105, 109, 114, 116, 119, 121, 124, 127, 130, 131, 133, 146, 150, 151, 157 |
| `REVIEW_WRITER_CALLERS_R2_OUTCOMES.md` | 8 | 0 | 1, 10, 13, 16, 19, 53, 55, 66 |
| `REVIEW_WRITER_HAX_R1_OUTCOMES.md` | 36 | 0 | 1, 16, 24, 32, 44, 46, 48, 49, 50, 51, 55, 60, 62, 63, 64, 67, 70, 72, 82, 93, 95, 96, 99, 102, 103, 104, 106, 110, 112, 119, 126, 132, 136, 147, 148, 149 |
| `REVIEW_WRITER_HAX_R2_OUTCOMES.md` | 14 | 1 | 1, 16, 23, 28, 33, 37, 41, 45, 48, 53, 57, 58, 61, 70, 80 |
| `REVIEW_WRITER_HAX_R3_OUTCOMES.md` | 1 | 0 | 32 |
| `WRITER_CALLERS.md` | 27 | 3 | 12, 20, 28, 81, 89, 124, 135, 152, 157, 175, 187, 195, 208, 217, 228, 254, 258, 262, 265, 289, 299, 309, 317, 336, 367, 378, 383, 408, 424, 441 |
| `WRITER_HAX_CALLS.md` | 79 | 0 | 1, 13, 21, 22, 23, 24, 25, 26, 27, 28, 38, 40, 44, 52, 55, 67, 73, 77, 78, 79, 81, 88, 93, 97, 110, 131, 135, 139, 140, 141, 144, 146, 150, 155, 156, 159, 161, 175, 181, 185, 189, 193, 194, 200, 205, 206, 207, 211, 238, 242, 248, 252, 257, 260, 268, 270, 271, 272, 282, 289, 293, 306, 310, 319, 327, 361, 362, 369, 387, 397, 402, 403, 410, 433, 435, 437, 439, 441, 443 |

En-dash lines: R1_OUTCOMES 43 and 151, HAX_R2_OUTCOMES 58, WRITER_CALLERS 135, 299 and 378. All six are numeric ranges.

Model name: `WRITER_CALLERS.md:253` names an agent type that names a model ("log for <agent type> whether m05's VM companion sheet..."). The other pattern hits (`WRITER_CALLERS.md:3`, `REVIEW_WRITER_HAX_R1_OUTCOMES.md:4`) are `.claude/worktrees/...` paths, which are not model names.

Recommended approach. The em dashes fall into four shapes, so each gets a mechanical rule. Check the result by eye rather than with a blind `sed`.

1. **Empty table cells** (a cell holding only an em dash) (32 lines, mostly the "old text" column of `WRITER_HAX_CALLS.md` for new lines): use `(new)`, or `n/a` where the cell is not an old-text column.
2. **Headings and bold labels** `## m01 (M8) <em dash> DONE, committed`, `**B1 <em dash> m07 home router...**` (64 heading lines, 13 label lines): use a colon (`## m01 (M8): done, committed`, `**B1: m07 home router...**`).
3. **Prose asides** (`X <em dash> Y`): use a comma, a colon, or parentheses, whichever fits. A sentence break if neither does.
4. **Ranges** (the six en dashes): `m1 to m4`, `17 to 18`, which is the form `WRITING_LAND_LOG.md` already uses.
5. **Text in quotes** (7 lines, for example `WRITER_HAX_CALLS.md:38` "Operation Shatter went through <em dash> the attack hit."): these quote superseded ink, not live text, so replace with a comma as well. Add "(old text)" if a reader might go looking for the line in the ink.
6. **The agent-type name at `WRITER_CALLERS.md:253`**: replace it with "log for the VM-track agent whether..." (or "log for the SecGen review whether...").

The copies were carried "verbatim". After the fix the log should say "carried with only dash and model-name edits", so nobody takes them as byte-identical to the writing tip.

### m1. US spelling in the writer's own prose

`WRITER_CALLERS.md:306` "Judgment:" should be "Judgement:". Fix it with M1.

Left as they are because they are verbatim quotes: `WRITER_CALLERS.md:70` "no behavior" (the validator's own message, `scripts/validate_scenario.rb:4462`) and `WRITER_HAX_CALLS.md:39` "neutralized" (quoted old ink). "npc-dialog-review" is a skill name.

## 5. TTS (keyless, no generation)

`env -u GEMINI_API_KEY bin/rails "app:break_escape:tts:wasted[...]"`:

- m10: 1 of 117 current-model clips unrequested, `tts_cache/m10_full_disclosure/e8817b27926b470b490d8ff2c36c89b7.mp3`, `hax_post [Aoede]: I'm on your phone now. Ring me.` That is the orphan the log names.
- m02: 0 of 1087 unrequested.

A `rails runner` over `TtsLineExtractor.for_scenario` (keyless, reads only):

- m10 extractor has `hax_post` "From here I'm on your phone. Message me." with Aoede and no clip. That is the one new clip the log names.
- m02: none of "Message me when you need me", "I'm here, ", the old "Call anytime" or the old "Call when you need me" is an extractor entry. They are text-only, as the log says, and every m02 key has a clip.
- m04's "ENTROPY are feeding..." and m08's door-audit text are unchanged by this branch. m04 has a clip for every key.
- `tts_cache/` is untouched by the branch (14515 tracked files at both 896ec3cd8 and HEAD).

The log's TTS table holds: 1 clip to generate, 1 orphan.

## Nits

- **n1.** The TTS table's "1 clip to generate (m10)" is the delta. m10 is mostly unvoiced on main already: 1083 of 1199 extractor keys have no clip, and m08 is at 419 of 454. The new line joins that backlog and does not need a one-off batch of its own. One clause in the log saying so would stop a reader from voicing the single line on its own.
- **n2.** 23 lines use U+2212 minus for counts (`−13`, `−3`): 9 in `REVIEW_WRITER_CALLERS_R1_OUTCOMES.md`, 6 in `REVIEW_WRITER_CALLERS_R2_OUTCOMES.md`, 8 in `WRITER_CALLERS.md`. They are not dashes, but if the dash pass is scripted they are easy to catch at the same time. Optional: ASCII `-`, or "minus 13".
- **n3.** "From here I'm on your phone." can be read as place ("from the van") as well as time ("from now on"). Both readings work in the scene, so no change is needed.

## Not checked

The validator warning counts and the phone JS/Rails test runs in the log were not rerun (no suites, per brief). No servers were started.
