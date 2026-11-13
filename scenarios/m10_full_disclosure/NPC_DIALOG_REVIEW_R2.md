# m10 Full Disclosure: NPC dialogue review, round 2

Phase 4 (dialogue), round 2. Reviewer: Opus, read-only on game files. Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run afresh over all 31 inks, the HaX texts and barks in `scenario.json.erb`, the closing card and the credits. Scope also covers the R1 fixes and the educational R1 and scenario design R1 lines (CONTRACT §11, last three paragraphs; commit 87dbe9db).

**Verdict: accept with fixes.** 0 blockers, 0 major, 5 minor, 7 nits. All 17 R1 minors and both majors are closed; the two departures (m7 Wendell, m13 Malhotra) hold.

The finale's last ten minutes still land. Of the R1 changes, "Where was I. Why you.", "Well, Agent?" and "Netherton's still on the line. Your call." each resume the scene in a single line, and the simulation confirms none of them replays anything. The warning ("Once I start, we finish tonight…") does the ending-convention job in Tesseract's own voice, and HaX names a single loose end. The minors below are small: an "I'll keep." said twice back to back, an "afterwards" that dulls HaX's "It's afterwards.", a choice in Asante's scene with no referent, a bark from a hidden Wendell, and a text that assumes m02 on a cold start.

---

## 1. Step 1: compile, validator, lint, loops

| Check | Result |
|---|---|
| Compile (inklecate on copies in my scratch folder) | 31 files, 0 failed, no loose ends. Every compiled JSON is byte-identical to the committed one |
| `validate_scenario.rb --no-graph` | Dialogue-facing items are the two bark/chat repeats R1 withdrew ("Ten past two…", "The log says Malhotra's badge…") and the T-19a/b stack (exclusive). R1's third repeat (power room) is gone, so m16 holds. No unresolved speakers, no ink hazards, no `#give_item` mismatches |
| `dialoguelint.mjs` | 9: blank-reentry 5, crowded-hub 2, not-x-but-y 1 (`tesseract:462`, the Ghost quote), us-spelling 1 (Elena). These are the same items R1 withdrew; R1's `:791` is gone (m12 fixed). Crowded-hub is 2 because of the new topics, as scenario design R1 said. Line caps hold |
| `loopcheck.js` at `start` | 31 of 31 clean |
| Reopen simulation (`scratchpad/m10_dlg_r2/scripts/reopen2.cjs`) | Esc at `case_lesson` → "Where was I. Why you." and the why-menu. Esc at his end → "Well, Agent?" and the same menu. Not yet → re-talk → "All four. Good." with no second warning. Wendell, Esc at the switch → the one choice, no line (see n3) |
| Phone texts by hand (T-58a/b, T-59, T-60, T-61a–d, Wendell's bark) | All ≤ 24 words, UK spelling, no banned words. Findings m4, m5, n5 |
| Standing rules | No printed variables in voiced lines. No `&&` in ink. Netherton's weighted lines use full forms (n2 is a word order point) |

---

## 2. R1 findings: status

| R1 | Status |
|---|---|
| M1 case replay | **Closed.** Proven by simulation (above). An Esc at the first two pitch menus still replays the opener; R1 accepted that |
| M2 database replay | **Closed.** The greeting and "Magnus." / "Adrian." play once. An Esc at a costs menu replays from "Half of these…"; R1 accepted that |
| m1, m2, m6 Victoria after four | **Closed.** Every share state reads true. "Or cuff me to that rail. Your choice." follows "my absence" cleanly |
| m3 Vos after four | **Closed**, with nit n1 ("that too") |
| m4 Vos credits | **Closed.** The rows are first-match and exclusive |
| m5 Fonoti | **Closed** |
| m7 Wendell (**departure**) | **Accepted.** The question is asked once and the shutter is set on the told pick. A reopen shows a single bare choice (n3, optional) |
| m8 Imran | **Closed.** "Gary's down, so it's me you're asking." is true only after `follows_gary` played the board line |
| m9 Static | **Closed** |
| m10 his end | **Closed** |
| m11 Netherton | **Closed**, with nit n2 on word order |
| m12 method line | **Closed** |
| m13 Malhotra "Eleven years" (**departure, kept**) | **Accepted.** It's a planted red herring (stage 1 `story_arc.md`), and Kowalczyk's double-crossed 06:00 line "Eleven years. You'd think I'd mind more than I do." pays it off. The misdirect is the point |
| m14 "the rest" on a cold start | **Closed.** `hax_rest_promised` is set on both `hax_post` topics and read at 06:00 and the hearing |
| m15, m16, m17 | **Closed** (`phone:139`, `:233`; ERB `:1427`) |
| Nits n1–n4, n6–n9, n12 | **Closed.** n13 is only half closed: see nit n7 |

New lines from the other two rounds, checked for voice and truth: Netherton's definition (`director_netherton:136`), the door-log line, T-59/T-60/T-61, `monitor_topic`, `box_topic`, HaX's coordinated-disclosure and supply-chain lines, the warning and its loose ends, Asante's follow-up, the exchange 1 decoy and Wendell's bark. All are in voice except where noted below.

---

## 3. Findings

V = voiced line changes or is added; T = text, choice, card or mapping (unvoiced).

### Minor

**m1. "I'll keep." twice in a row on Not yet.** `m10_tesseract.ink:233`, `:245`. **V.**
His warning ends "…If there's something you'd like to see to first, go. I'll keep." The player says "[Not yet. I want to finish something.]" and he answers "I'll keep." again. The simulation shows the two lines back to back. HaX's "He'll keep." and his "Finish on my box first. I'll keep." make it four uses of "keep" in the scene.
Current `:245`: `Dr Adrian Tesseract: I'll keep.`
Proposed: `Dr Adrian Tesseract: I'll be here.` That clip already exists (arrival_menu `:169`), so no new audio.

**m2. A third "afterwards" in the core dulls HaX's "It's afterwards."** `m10_tesseract.ink:640`. **V.**
On an m05 funded-arrest save, exchange 1's sting is `You handed Torres to the police, and your service paid his wife's bills afterwards. Cheaper than paying them before.` That puts the word in his mouth two exchanges before "Let it hurt afterwards, not during." and an hour before HaX's 06:00 payoff. CONTRACT §5.3 allows "afterwards" twice in a run.
Proposed: `You handed Torres to the police, and your service paid his wife's bills once he was locked up. Cheaper than paying them before.` (22 words)

**m3. Asante's follow-up quotes a list the player may not have seen, and her reply answers about hospitals.** `m10_asante.ink:42`, `:44`. **V + T.**
"[Some of those controllers will never get a patch.]" shows on `asan_wrote` alone. A player who asked "Who built this release?" first has heard no controllers yet: the schedule and the flag 2 text come later. Her reply, "That isn't the hospitals' fault, I know.", then answers a point about water controllers with hospitals.
Proposed: gate on `asan_wrote and asan_shown and not asan_unpatched` (she has just shown the schedule, whose entry 0003 is the controllers). Reply: `Dr Abena Asante: Then they should never have been on a network. *pause* That isn't the utility's fault, I know.`

**m4. Wendell's isolator bark can fire with Wendell hidden.** `scenario.json.erb:3243`. **T** (no line change).
The bark guards `!m04_voltage_escaped` but not `m04_voltage_captured`. On the captured branch Wendell is hidden (his reveal needs both false) and captured Voltage does the cut. A click on the isolator before talking to Voltage would show "Wendell Briggs: Hands off my panel…" from nobody. `npc-manager.js:1199` shows a bark without checking visibility. Needs a browser check.
Proposed: add `&& !globalVars.m04_voltage_captured` to the condition.

**m5. T-60 assumes m02 on a cold start.** `scenario.json.erb:1826`. **T.**
`Upper and lower case, digits, no spaces. You've seen that shape before.` The ERB comment says m02 taught the shape. A cold-start player hasn't seen it (CONTRACT §5.6, "the cold start reads cold").
Proposed: keep the current text on `globalVars.m02_completed === true`, and add a cold twin on `!globalVars.m02_completed`: `Upper and lower case, digits, no spaces. That's encoded, not encrypted. Your kit can read it.` Ask opus48 to confirm the wording is safe; it names only the class.

### Nits

| # | File:line | Current | Proposed | |
|---|---|---|---|---|
| n1 | `m10_vos.ink:110` | "My delivery came at four. Now I am waiting for a flight. You are in the way of that too." ("too" implies the player blocked the delivery, which arrived) | "…Now I am waiting for a flight. You are in the way of it." | V |
| n2 | `m10_six_oclock.ink:652` | "They still are not. That was my signature too." (the stress falls oddly when spoken) | "They are still not. That was my signature too." | V |
| n3 | `m10_wendell.ink:70` | A reopen at the switch shows "[The one marked gallery shutter.]" with no line before it | Optional: keep the departure. If a line is wanted, open the knot with `{wendell_switch > 1: Wendell Briggs: Well?}`, which uses the visit count rather than a flag inklint flagged | V (optional) |
| n4 | `m10_phone_agent0x99.ink:541–542` | "He walled his box off, the way the release service was boxed in. Isolation like that can still be broken out of. / And he always builds his own way out first. Find his." (box/boxed; and the m09 tape motif, which pays off at `tesseract:905–907` "Service door… He always builds his own way out first.", is spent here first) | "He walled his box off, the same way the release service was. You've broken out of one of those tonight. / He'll have left himself a way out. Find it." Ask opus48 to confirm, since this is VM-adjacent | T |
| n5 | `scenario.json.erb:1824` (T-59) | "…The keys' wear and the rota will get you in." | "…The worn keys and the rota will get you in." | T |
| n6 | `m10_tesseract.ink:558` | "[Nobody can know a number like that.]" is 7 words beside 11–14, and it answers the number he has just raised (§5.4, R3-02) | "[Your figure's a guess dressed up as sums. Nobody can know that.]" (12 words). His reply "I can. I did the sums. You didn't read them." still fits | T |
| n7 | `m10_carryover_vars.ink:468` | R1 n13 gated Elena's ELSEWHERE row, but `close_compute` still picks `close_human = "elena"` on a funded arrest, so the card prints "Elena Torres is in treatment. It's working." beside "David Torres: serving. His wife's treatment goes on." | `- m05_elena_treatment_funded and m05_final_choice != "arrest":` (the card then falls through to the next human line) | T |

---

## 4. The finale as a player hears it

Read in order through the core, 06:00 or the hearing, and the card, on three saves.

- **Rich save** (m01–m09, arrest on two points, secured, m09 kept, m02 exposed): "All four. Good." → warning → the pitch → Ghost's lesson and HaX's answer → why you → two records → the Recruiter → three exchanges → console → database → "Ask me, then." / Netherton's offer → "A courtroom, then. I did cost it." At 06:00: the walkabout (three picks), Ghost's text, the numbers (up to four Netherton lines in `numbers_more`, just under the reveal cap), the vault and "Two maps now.", the van and the one-page chapter, the season line and the memo line, the forty-seven told properly, "It's afterwards.", "The night he left…", the screen turns six, "I said no. It took me till morning." Every earlier choice that matters gets a line. Nobody tells the player what to feel; the payoffs are all callbacks. The one thing that blunts it is m2's extra "afterwards" on an m05 funded-arrest save.
- **Cold save** (m10 only, seated arrest with fire held): the warning names WREN or the sheet. Without the sheet, exchange 1 has no rebuttal, which is fine for the dialogue (the puzzle reviewers own it). "Got it. Feed's dead. Hold. *breath* He's done." / "Ninety-nine." / wrists. At 06:00 there is no season line. "[You said you'd tell me the rest.]" now shows if the player asked HaX at the post, and she tells it either way. The cold start follows every line except T-60 (m5).
- **Mixed save** (m02 and m04 only; Scorched Earth): the purge, the card "Afterwards, then.", "Out, 0x00." At 06:00: "Nobody holds the map now…", the suspension, "I wanted to do the same." At the hearing: "He's one man with a memory now." / "I'll tell them I wasn't asked." This holds up, and the hearing gives HaX the last word.

Executed and Join stay silent where they should: the line goes quiet, the van and the unread texts, and "She doesn't look up."

---

## 5. Voiced-line list for this round's proposals

| Speaker | New | Reworded | Findings |
|---|---|---|---|
| Tesseract | 0 (reuses "I'll be here.") | 1 | m1, m2 |
| Asante | – | 1 | m3 |
| Vos | – | 1 | n1 |
| Netherton | – | 1 | n2 |
| Wendell | 0–1 (optional "Well?") | – | n3 |

---

## 6. Top five

1. **m1**: "I'll keep." twice back to back when the player says Not yet. Reuse the existing "I'll be here." clip.
2. **m2**: Tesseract's Torres sting says "afterwards" two exchanges early, which dulls "Let it hurt afterwards" and HaX's "It's afterwards."
3. **m3**: Asante's new follow-up refers to "those controllers" the player may not have seen, and her reply answers about hospitals.
4. **m4**: on the Voltage-captured branch, a click on the isolator can bark as a hidden Wendell.
5. **m5**: T-60's "You've seen that shape before." is false on a cold start.
