# m07 The Architect's Gambit — dialogue review (pass 4)

Reviewer and editor: dialogue-stage agent, 2 October 2026. The `npc-dialog-review` skill run in full,
then the rewrite. References: `docs/agents/PASS4_BRIEF.md`, the dialogue style guide
(`story_design/universe_bible/09_scenario_design/dialogue_style.md`), the voice bible
(`story_design/universe_bible/04_characters/voice_bible.md`), `README_ink_best_practices.md`, m01 as the
house example, and this mission's `DESIGN_REVIEW.md` (all three rounds) and `CONTRACT.md`.

Line numbers in the review sections refer to the ink as it stood before the rewrite (snapshot of the
working tree, which already held the pass-4 design changes). "Changes made" at the end describes the
rewrite.

## Step 1 — compile and validate

- `./scripts/compile-ink.sh m07_architects_gambit`: 8 compiled, 0 failed. One `-> END` warning on
  `m07_opening_briefing.ink:315`, the briefing's deliberate end. No "apparent loose end" warnings.
- `ruby scripts/validate_scenario.rb`: 0 errors. "All ink files valid". No unresolved speaker prefixes,
  no `#give_item` mismatches, no ink character hazards. The 7 warnings are co-firing `onceOnly` HaX
  mappings, all intended (design review round 3). Narrator voice block present (`erb:83-91`).
- No dialogue-facing blockers.

## Step 2 — dialogue review

### 2a. Attribution and narration — OK, with a narration CONCERN

- Every prefix resolves (validator; `CONTRACT.md` §9 list). HaX's lines in the debrief resolve to
  `agent_0x99` and use her phone voice, which is right.
- **CONCERN (narration volume).** Mercer has 34 `Narrator:` lines against 71 spoken ones; Elena 20 against
  65; Hollis 15 against 28. Many describe a look or a pause that a delivery cue or the next line already
  carries (`m07_npc_james_mercer.ink:172`, `:186`, `:217`, `:232`, `:263`, `:271`; `m07_npc_elena_rodriguez.ink:140`).
  Several tell the player what a moment means ("Which is true, and is also the first thing he has said
  tonight that he needed you to believe", Mercer `:271`). The voice bible's Narrator never comments.
- **CONCERN (phone prefixes).** Both phone inks prefix every line with the contact's own name (88 `Agent HaX:`
  lines; 49 `The Architect:` lines). The pass-4 rule is to drop them (the phone strips a matching prefix,
  `phone-chat-speaker.js`, and m01's phone ink has none).

### 2a-bis. Is the dialogue supported by the scenario? — mostly OK

- Hollis patrols (`erb` patrol block), so "halfway along the patrol" is true. Leaving NPCs are hidden by
  mappings (`CONTRACT.md` pass-2 amendments), so Elena's exit, Hollis's exit and the police taking Mercer
  are supported.
- **CONCERN.** Park's `gone` exit is `[Take the flashlight and move.]` (`m07_npc_thomas_park.ink:126`).
  There's no flashlight item and no `#give_item`; the choice promises a pickup that never happens.
- **CONCERN (fact).** Park: "They said data centre. They said nobody's in it." (`:76`). This is a grid
  control site; design review fix 7 left it for this stage.
- Directions checked against `connections`: HaX's layout line (`m07_phone_agent_0x99.ink:117`, server hall
  north to control room, south to the plant, keypad down to the vault) and the texts "far side of this
  floor" / "south side of this hall" (`erb:928`, `:936`) all match the room boxes in the erb header.

### 2a-ter. Voices — OK

Every speaking NPC has a voice block; no two NPCs in the mission share a Gemini voice except the two
Netherton blocks (same character). Accents are stated per NPC. Lines match their voice-bible entries in
substance; the problems are length, not character (see 2g).

### 2b. Player choices are spoken dialogue — CONCERN

- Choice brackets are first person throughout. Hub labels are questions or statements, not menu labels.
- **Scripted player speech.** `You:` lines that carry on the player's speech after a choice, or put words in
  the player's mouth between NPC lines:
  - Briefing: `:23` (before any choice), `:74`, `:248` (after "What would you do?" / "Skip the rest"), `:310`.
  - Mercer: `:247` and `:251` (the diversion speech), `:321`, `:327`, `:355`, `:377`, `:400`, `:407`, `:409`.
  - Hollis: `:139`, `:142`, `:181`. Park: `:72`.
  - Allowed: Elena `:339` and Mercer `:111`, both after a silent choice. dialoguelint's `you-after-choice`
    only flags lines directly after a bracket, so it reports just these two "checks"; the rest are the
    same fault one step removed.
- Long choices (over 15 words): Elena `:115` (19), Mercer `:301` (16), debrief `:487` (16).
- Hollis `:90` mixes an action and a line (`[Walk straight at him. "I'm not here to fight you, Ray."]`). It's
  a deliberate label (PASS 2 note) so the player knows they're advancing; keep the form, shorten it.

### 2c. Hub structure — OK

Every person NPC has `start` and a hub (or an equivalent re-entry knot) with a sticky exit tagged
`#exit_conversation`. The phone inks park on `hub` / `parked` and never end. Exits are one or two lines,
apart from Mercer's `ending_*` knots, which are scene endings, not exits.

### 2c-bis. Starved knots — OK (runtime)

No starved knot found by reading: every re-enterable knot keeps an unconditional sticky option. The runtime
matrix (32 states) is reported under "Changes made"; a baseline run on the old JSON stalled on inkcheck's
walk of HaX's hub (the same state space that times out after the edit) and was stopped.

### 2d. Choices that matter

- **OK.** The briefing's commit, HaX's redirect, Elena's turn/pressure, Mercer's stance and endings, Hollis's
  deal, Park's stand-down and the debrief stance all set globals that the debrief and credits read by name
  (`m07_closing_debrief.ink:103-374`, `erb:167-221`). This is the best-wired mission in the season.
- **OK (stance against an immovable villain).** The Architect's taunt choices converge; he can't be moved,
  and every taunt reads the player's earlier commit back. No stance variable, but the choices are framed as
  replies, not decisions. Worth considering: none.
- **CONCERN (flat pairs).** Two pairs give identical content whichever is picked, with no state:
  - Elena `lever_briefing` (`:198-201`): both choices say "yes, ninety days".
  - Park `projection` (`:78-81`): both go to `stand_down` with nothing in between.
  The fix is wording, not logic: make the two options different moves (confirm vs. push; appeal vs. clock).
- **OK (critical path).** Nothing on the critical path is gated on a choice (Elena and Hollis both have
  redundant sources, `CONTRACT.md` §2).

### 2e. Cross-file state integrity — OK

Every `#set_global` name is declared in `globalVariables`. `vault_pin_found` and `scada_password_found` are
written by Elena and read by nothing in ink (known, `CONTRACT.md` pass-3 note). `debrief_played` is written
without a `VAR` in the debrief, which is fine for a write-only tag.

### 2f. Influence — N/A

No NPC uses an influence variable. Hollis, Elena, Mercer and Park are one-scene characters whose outcome is
a string state; rapport tracking would add nothing.

### 2g. Line length, economy and AI tells — CONCERN (the main finding)

dialoguelint before the rewrite: **110 line-len, 8 text-len, 3 choice-len, 13 not-x-but-y, 1 transition,
2 you-after-choice (both allowed)**.

| File | Lines | Median | p90 | Max | Over cap |
|---|---|---|---|---|---|
| Briefing (Netherton) | 83 | 21 | 35 | 40 | 21 |
| HaX phone | 88 | 21 | 38 | 60 | 32 |
| Debrief | 140 | 22 | 34 | 47 | 33 |
| Mercer | 71 | 16 | 35 | 62 | 14 |
| Elena | 65 | 18 | 31 | 40 | 8 |
| Architect | 49 | 12 | 21 | 27 | 1 |
| Hollis | 28 | 9 | 24 | 38 | 2 |
| Park | 11 | 8 | 17 | 34 | 1 |

m01's median is 12. By file:

- **Briefing.** The design review's "front end is heavy" point stands: about 30 figures across three
  briefs, most of them on paper now in the Threat Desk Summary. Netherton lists ("Three banks, three
  technology firms, two healthcare groups...") and recites every number. His voice-bible entry wants short
  declaratives towards 20 words. `This is not a selection... It's an assignment.` (`:50`) and the player's
  `That's not a cell. That's a campaign.` (`:60`) are "not X, Y" from heroes.
- **HaX.** The m07 voice style says "quick, dry, clipped" but her lines run to 59 words. The best ones are
  short ("Patient hands open any of those."). Her hints are mostly right but buried: `vm_hint_2` says what
  to do in the first line and then adds a second idea; `guide_ssh` has the tailing negation the style guide
  quotes ("One username, one password: no guessing."). Field-guide replies end on mottos ("Map first, act
  second. Always.", "Least noise, most access.") that the voice bible forbids as summing-up lines.
  `topic_elena` says the briefing's projections were ENTROPY's numbers in so many words, which the debrief's
  `revision_lesson` then says again. `topic_mole` explains the whole twist on the phone and then the coda
  explains it again; HaX's phone line should react, the coda should explain.
- **Debrief.** Netherton's report lines are long lists of figures (`:152` is 47 words). The structure is
  right; each beat needs splitting or trimming. Three "not X, Y" lines from Netherton (`:467`, `:473`,
  `:496`) and one from HaX (`:414`). F9 from the design re-review: "because he allowed it" (`:206`) has no
  antecedent on the non-Trojan paths.
- **Mercer.** He's the mission's best-written villain, and the length is mostly earned, but two speeches
  (`topic_numbers` 62 words, `topic_lesson` 43) are walls. The scripted `You:` lines in four endings are the
  bigger problem (2b).
- **Elena.** Good, specific, sounds like a person. A few long lines; three "not X, Y" lines (`:170`, `:212`,
  `:309`); one narrator line that interprets her (`:140`).
- **Architect.** The best writing in the mission. One 27-word line (`:224`); "however" (`:114`) is a lint
  false positive but worth rewording since it reads as a transition.
- **Hollis, Park.** Tight. Hollis's two long lines are the two that carry the vault rule and the leverage.

### 2h. KO resilience (writing side) — OK

Every NPC has a KO branch in the debrief and a KO text from HaX (`erb:894-917`); none of the debrief lines
assumes a KO'd NPC walked out (`m07_closing_debrief.ink:281`, `:321`, `:336`, `:355`).

## Step 3 — action list

**Must fix:** none.

**Should fix**
- Cut line lengths to the caps (110 lines, 8 texts), Netherton and HaX first.
- Fold or remove the scripted `You:` lines (briefing, Mercer, Hollis, Park).
- Drop the contact's own prefix from both phone inks.
- Clear the "not X, Y" lines from heroes and narration; let the Architect and Mercer keep one each per scene.
- Make the two flat pairs (Elena, Park) different moves.
- Park's flashlight choice and "data centre".
- Debrief "he allowed it" (F9).

**Worth considering**
- Fewer narrator beats in Mercer and Elena; no narrator line that explains a feeling.
- HaX `topic_mole` reacts rather than explains, so the coda lands.
- `topic_teacher` and `topic_mole` both open "Say that again" (F9).

## Changes made (pass 4 dialogue)

Editor: dialogue-stage agent, 2 October 2026. Only m07's own files: the eight `.ink` files (and their
compiled `.json`), `scenario.json.erb` and this review. No commit. Security and casualty detail is kept
at the level it already was, or reduced and pointed at the page that holds it (the Threat Desk Summary,
the projection, the field guides).

### Approach

- **Length first.** Every line is cut to the caps (30 face-to-face, 25 phone, 30 per text), and most to
  well under: the median is now 13 to 18 words per file, down from 21 to 22 for Netherton and HaX.
  Long report lines became two short ones rather than one long one, with a short line after a long one
  where something needs to land.
- **Information first, then findable.** Hints open on the action. Where a line used to recite figures,
  it now points at the paper the player holds ("The desk's summary is on your handset"; "The desk's
  revised figure ... is in your file. I am not going to read it aloud").
- **The player speaks only through choices.** Every scripted `You:` line has gone, except the two
  allowed after a silent choice. Where the player's words mattered, they moved into the choice bracket
  (Mercer's diversion, record and hostile endings) or the NPC now says the thing himself (Mercer's
  "You'd let me speak. No. You'd let me be quoted."; "So I'm a man in a room with a signed piece of
  paper.").
- **Narration as camera.** Narrator lines that explained a feeling ("Which is true, and is also the
  first thing he has said tonight that he needed you to believe") are cut; physical beats are kept and
  shortened.
- **Voices.** Netherton: formal, no contractions in serious lines, short declaratives, one handbook joke
  (the briefing's; the debrief's "the answer the handbook wants" became "will stand up in any review
  room"). "Twenty years in this chair" became "in this work", per the voice bible's five-year
  directorship. HaX: clipped, fact first, no mottos. The Architect is almost untouched.

### Per file

| File | Prose lines (old → new) | Spoken lines new/changed | Narrator new / cut | Choices reworded | `You:` lines |
|---|---|---|---|---|---|
| `m07_opening_briefing.ink` | 92 → 85 | 63 | 3 / 7 | 1 of 29 | 4 → 0 |
| `m07_phone_agent_0x99.ink` | 91 → 108 | 75 | 0 / 0 | 0 of 44 | 0 → 0 |
| `m07_architect_comms.ink` | 64 → 64 | 7 | 0 / 0 | 0 of 16 | 0 → 0 |
| `m07_npc_elena_rodriguez.ink` | 85 → 80 | 41 | 9 / 16 | 3 of 31 | 1 → 1 (allowed) |
| `m07_npc_james_mercer.ink` | 105 → 91 | 33 | 17 / 40 (incl. 9 `You:`) | 5 of 26 | 10 → 1 (allowed) |
| `m07_npc_ray_hollis.ink` | 43 → 43 | 6 | 14 / 15 (incl. 3 `You:`) | 1 of 19 | 3 → 0 |
| `m07_npc_thomas_park.ink` | 22 → 22 | 7 | 11 / 12 (incl. 1 `You:`) | 3 of 10 | 1 → 0 |
| `m07_closing_debrief.ink` | 182 → 193 | 104 | 12 / 12 | 1 of 9 | 0 → 0 |
| **Total** | **684 → 686** | **336** (298 old lines gone) | | **14** | **19 → 2** |

Counted with phone prefixes ignored, since the phone strips them and the voiced text is the same.
Removing the prefixes touched a further 88 HaX lines and 42 Architect lines whose words are unchanged.
m07 audio isn't generated yet, so none of this costs money now.

- **Briefing.** The three briefs keep the facts the decision turns on (what, where, harm, deaths,
  horizon, what the team can stop) and drop the lists of sectors, revenues and losses, which are on the
  Threat Desk Summary. Trojan Horse keeps "ninety days", "No projected fatalities" and "strategic", which
  the twist needs. Netherton now points at the summary on the handset. The four scripted `You:` lines
  are gone ("The other two go unanswered." is now his). The player's "That's not a cell. That's a
  campaign." became "[Four operations on one clock. Who's running all this?]", which his answer fits.
- **HaX.** Prefix dropped on every line. Long lines split; hints open on the next action. VM hints say
  less than before and point at the field guides. Mottos cut ("Map first, act second. Always.", "Least
  noise, most access."). `topic_mole` now reacts ("Somebody handed ENTROPY you, by name. I'll tell
  Netherton myself. Not on this line.") and leaves the explanation to the debrief coda, so the coda
  lands. `topic_teacher` opens "...Read me that again." so it no longer repeats `topic_mole` (F9).
  `topic_elena` no longer says the briefing's numbers were ENTROPY's; the debrief says that once.
  "How do you carry that?" now says the line the Architect echoes word for word ("Let it hurt
  afterwards, not during.").
- **Architect.** Prefix dropped. Seven lines trimmed: the 27-word Mercer line, "however" (now "any
  way"), the sign-off lines. His one "never about the power grid" stays as his rhetorical habit.
- **Elena.** Lines trimmed, three "not X, Y" lines rewritten, two interpretive narrator lines cut. Her
  `lever_briefing` pair is now two moves: confirm ("That's the brief.") and push ("Why? What do you
  know about Austin?"). The long projection choice is "[I've read the casualty projection. His
  signature's on it.]".
- **Mercer.** 40 narrator and `You:` lines out, 17 shorter ones in. The diversion speech is now the hub
  choice ("[Four operations, one schedule, doctor. They're there to keep us busy. So are you.]") and he
  answers it. `topic_numbers` no longer recites the breakdown; he says the categories and "The breakdown
  is on the page. I wrote it." Endings: the player's words are in the choices; Mercer works out the
  "walk out" himself.
- **Hollis.** Three `You:` lines replaced: the evidence is now a narrator beat ("You hold up the handover
  sheet. His login, against Mercer's renewal."). The vault-rule line is split in two. Long narration cut.
- **Park.** "data centre" became "They said a building. Empty, they said." The flat pair is now an
  appeal and a clock. `[Take the flashlight and move.]` is `[Move on.]` (no flashlight item exists). The
  `You:` line is gone; he reads the number himself.
- **Debrief.** Every report line split or trimmed. Two death-toll recitations (Trojan Horse day nine,
  Meltdown) now point at "your file" instead of reading the number, and Netherton says why ("I am not
  going to read it aloud"). F9's "because he allowed it" now names the Architect. Four "not X, Y" lines
  rewritten ("Partly." for "It is not, entirely. But"; "The choice was yours. The menu was his.").
  Choice-by-name payoffs are all kept.
- **`scenario.json.erb`.** Twelve HaX timed texts trimmed under 30 words (the eight over-cap ones plus
  four others for voice), and the `scenario_brief` cut from 90 to 50 words. No ids, conditions or
  delays changed. Credits, task titles and readable documents are left alone; they read as documents.

### Lint before and after

| Rule | Before | After |
|---|---|---|
| line-len (error) | 110 | 0 |
| text-len (error) | 8 | 0 |
| choice-len (warn) | 3 | 0 |
| not-x-but-y (warn) | 13 | 0 |
| transition (warn) | 1 | 0 |
| you-after-choice (check) | 2 | 2 (both after a silent choice; allowed) |

**Lint gap:** dialoguelint only measures lines with a `Name:` prefix, so it reports `lines=0` for both
phone inks once the prefixes are gone. I measured them separately: HaX 103 lines, median 13, p90 22, max
25 (one inline conditional counts 30 with both branches added; each branch is under 18); Architect 49
lines, median 12, max 24. The AI-tell search from the style guide's checklist, run by hand over all eight
files, finds nothing. Saved: `<scratchpad>/m07-dialogue/m07-lint-before.txt`, `m07-lint-after.txt`.

### Checks

- `./scripts/compile-ink.sh m07_architects_gambit`: 8 compiled, 0 failed; the briefing's deliberate END.
- `ruby scripts/validate_scenario.rb`: 0 errors; ink valid; schema passes; same 7 intended wiring warnings.
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Rendered the erb with the validator's own binding: parses, 40 timed messages, longest 30 words; the
  edited strings are present.
- `tagdiff.mjs --old <snapshot> <file>` for all eight files: **STRUCTURE UNCHANGED** in every file.
  No tags, knots, stitches, VARs, assignments, diverts, choice conditions or sticky/once-only marks moved.
- `reopencheck.mjs … m07`: agent_0x99 and the_architect, 1800 reopens each, **0 problems**.
- inkcheck + loopcheck over 32 states (each NPC's `currentKnot`; HaX `start` both ways and `hub` with four
  progress mixes; five Architect taunts and two sign-off states; Elena five; Mercer three, before and after
  the abort; Hollis three; Park two; the debrief five ways). **loopcheck: 32/32 clean**, no runtime errors or
  runaways. **inkcheck: 27/27 clean** where it finished; the 5 HaX `start`/`hub` states hit the 90-second cap
  (the depth-first walk explodes on HaX's hub; the pre-edit baseline stalled on the same states). HaX's
  coverage there comes from loopcheck and reopencheck. Output: `<scratchpad>/m07-dialogue/matrix-after.txt`.
- No browser playtest was run for this pass. The changes are prose only, but a short read-through
  playtest of the briefing, Mercer and the debrief would confirm pacing on screen.

### Not done, and ideas for the backlog

- **dialoguelint can't see unprefixed phone lines** (reports `lines=0`). Now that phone inks drop the
  contact prefix, it should treat unprefixed lines in a phone ink as the contact's. Tooling, not m07.
- **inkcheck on big phone hubs** times out; a depth cap or state memo would make it usable on HaX hubs.
- Credits, task titles and readable documents were left as they are: they read as documents, and the
  credits mirror debrief states that didn't change.

## Changes made — script edit round

Input: the script editor's notes, `DIALOGUE_EDIT_NOTES.md` (verdict "revise (light)"). The orchestrator
approved all three must-fixes, the should-fix items at my judgement, and S2 as a small structure change.

### Must-fix

- **M1. The debrief reads the dead again.** The three figures I had replaced with "in your file" pointers
  are back, each as its own short line: the Portland projection Netherton zeroes (`the_win`), the Trojan
  Horse month after day nine (`dark_trojan`), and the Meltdown week (`dark_meltdown`). "I am not going to
  read it aloud" is gone. Netherton never softens a figure, and the scene's own rule says the two
  abandoned operations are read out by name and by number. The editor was right: I'd made him into the
  man the voice bible says he isn't.
- **M2. The stage-two hint has its pointer back.** `vm_hint_2` now opens "Scan every port on the host,
  not just the common ones. The recon guide has the step." and the NFS guide reply has the old sentence
  back. It's at the same level as before the pass, with a citation to the recon guide.
- **M3. Elena's antecedent.** "Help you, and there's no version of my life after this that isn't a
  courtroom." The player's "There isn't." and her "No. There isn't." follow again.

### Should-fix taken

- **S1/S2.** HaX's clock line is conditional again ("The moment you log in there, assume they start it.").
  And it's now reachable: the phone preload always lands in `first_call_open`, so `first_call_committed_choices`
  (the layout and the clock) was dead. A sticky hub choice `[Remind me of the layout and the clock.]` →
  `first_call_committed_choices` reaches it; each of that knot's options returns to the hub, and the knot is
  choices-only, so a re-navigation replays nothing. **This is the one intended structure change**, see below.
- **S3** "one SSH login"; **S4** health record and dispatch keys in the redirect; **S6** "where a person on
  the ground still changes the ending" (split into two lines to fit the phone cap); **S7** "the cost,
  straight"; **S8** HaX's "as a fact, not an excuse" cut; **S15** HaX's redirect praise replaced with "Done.
  It's logged under your name." so the "changed your mind under a countdown" line is Netherton's alone;
  **S16** HaX's "no common scale" cut; **S17** `topic_traffic` no longer repeats the choice; HaX's Hollis
  line keeps the mole foreshadowing ("You'll meet the big one tonight.").
- **S5** Netherton: "Twenty years of this work, Agent. ... choosing for himself, and calling it command."
- **S9** The Architect is no longer surprised: "I had you down for staying put." His "Make it however you
  like." is restored, as the voice bible quotes it. dialoguelint flags "however" as a transition; it isn't
  one here, so that warning is justified rather than cleared.
- **S10** Hollis's mind-reading narrator line is now a look at the ops-floor door, which also points at
  the handover sheet. His "I genuinely am" is "I mean it."
- **S11/S12** Mercer has two long lines back ("Four papers, two of them still cited...", "...and nobody wrote
  a word about it."), "hypothermia column" restored, and the duplicate "I wrote it." cut. American idiom
  for him: "artifact", and "That's what the length is for." instead of "rather the point".
- **S13** Briefing choice: "[Four operations on one clock. How do we know all this?]", which his answer fits.
- **S14** Mercer's fight choice now reads as a threat: "[Away from the console, or I put you on the floor.]"
- **S18** The comma splice in the stage-two text is fixed.
- Optional items taken: the debrief narrator line ends at "to soften it."; Elena names "Mercer's tech" again
  (the quiet link to Park); the lockpicking guide exit is "Patient hands open any of those." Not taken: the
  Architect's "I respect that" revert, the remaining "Go." exits, the coda list, "Keep the discipline".

### Checks (round two)

- Recompiled all 8 inks; 0 failed.
- `tagdiff.mjs --old <snapshot>`: **STRUCTURE UNCHANGED** in 7 files. HaX: **4 differences, all S2**: the new
  sticky choice (`+ -> first_call_committed_choices`), its divert, and the hub's sticky-choice count going
  from 26 to 27 (counted as one removal plus one addition).
- dialoguelint (which now measures unprefixed phone lines): 0 errors. HaX 107 lines, median 13, max 25;
  Architect 49, median 12, max 24. Remaining: `transition=1` (the Architect's "however", justified above),
  `you-after-choice=2` (both after a silent choice). Saved as `m07-lint-round2.txt`.
- Validator: 0 errors, same 7 intended wiring warnings. Doors OK.
- reopencheck m07: agent_0x99 and the_architect, 1800 reopens each, **0 problems**.
- inkcheck (improved; it now finishes on HaX's hub) + loopcheck over 33 states: the 32 from round one
  plus HaX `first_call_committed_choices`, the knot S2 opens. **inkcheck 33/33 clean, loopcheck 33/33
  clean**, no runtime errors or runaways. Output: `<scratchpad>/m07-dialogue/matrix-round2.txt`.

## Changes made — playtest round

Input: `tools/playtest/m07-pass4-dialogue-report.md` (game 1403; no hook failures, the Tesseract beat works
end to end) and the orchestrator's fix list.

**A correction first.** The script-edit round above says S1 made the clock line "conditional again". That was
only wording ("The moment you log in there..."); the knot had no state check, so after flag 3 it still said
"No clock yet". This round fixes that properly (item 1).

### Fixes

1. **Clock answer is state-aware** (HaX `first_call_committed_choices`): before the host login it gives the
   original rule; once `cascade_armed`, "It's running. Fifteen minutes from your login on their host. Get
   root, then put the abort in at the control room console."; after `grid_saved`, "No clock now. The abort's in
   and the grid's holding." New VAR `cascade_armed` (already a synced global).
2. **Redirect suggestions respect the redirect.** `topic_elena` and `topic_traffic` now branch on
   `team_redirected or team_assignment == "trojan_horse"` (the team is already in Austin), then
   `redirect_window_closed` (it goes in the report), and only then suggest moving the team.
3. **Layout and clock both stay reachable.** Their answers now return to `first_call_committed_choices`
   instead of the hub, so the player can read one, then the other; "Understood. Let's go." leaves.
4. **Pointers for a new player.**
   - Where to go: HaX's opening (`first_call_open`, the one the preload actually reaches) is now "Get past
     the checkpoint to the operations floor. Call me when you hit something you can't open."; Netherton's
     handoff says the operations floor is past the checkpoint; the task `reach_operations_floor` is titled
     "Get past the security checkpoint to the operations floor" (id unchanged).
   - Control room password: the layout says "The engineer in the server hall knows it, and their own
     network leaks it."
   - After the abort: the sign-off text says "The plant's south of the server hall if you want anything
     bagged."
   - "The vault keypad. Where do I get the code?" retires once the keypad opens: the
     `objective_task_completed:recover_vault_pin` mapping now also sets `vault_pin_found`, and the hub choice
     requires `not vault_pin_found` (Elena's hand-over sets it too, which is right).
   - The Architect's thread after a call: the dead-air line now ends "Nobody on it. He calls when he
     chooses.", and the parked choice reads "[Check the line.]" instead of "[Listen.]".
5. **Lines.**
   - The Architect's first bark (erb) is now just "Agent 0x00."; the ink opens "Don't look for the trace.
     It isn't there.", so the line no longer shows twice and the thread's top line fits the sign-off too.
     T-1 ink is "But the grid was never the point." (the bark keeps "never about the power grid"); the
     Seattle sign-off line no longer repeats its bark. "So will you have the figures." is "You'll have the
     figures too."
   - Mercer: "[Call it a submission if you like. It's a spreadsheet of the dead.]" answers the line he just
     read ("This is the third submission"); "modeler" (General American, voice bible).
   - "The other thing" is Hollis's alone; Elena says "you're law".
   - Mercer's background reconciled with canon (`03_entropy_cells/critical_mass.md`: former Department of
     Energy grid engineer, twenty years): HaX "twenty years a Department of Energy grid engineer"; Elena
     "Twenty years at the Department of Energy".
   - Debrief: the Meltdown line has a clear referent ("Eighty to a hundred and forty patients did not survive
     that week, waiting for operations the hospitals could no longer schedule."); the hub greeting no longer
     says "Ask it." before a choice that asks nothing; Netherton's diversion line quotes the hub choice the
     player must have picked ("only there to keep us busy"); "eight point four million others"; the
     editorial narrator line about working things out at different speeds is cut.
   - Briefing: the comparison close now reads after any question ("Read them how you like, Agent...").
   - HaX: "HaX here, {player_name()}." replaces the fragment; the if/if-not line above "Team's turned" is gone;
     "The ones you couldn't reach"; the two stock reassurances after the mole topic and the flat Mercer close
     are cut or rewritten; Tomb Gamma no longer says "the other half's still down there".
6. **Stage directions.** Phone `Narrator:` lines stay (the engine now renders them). Asterisk cues trimmed to
   m01 density: the ones inside Mercer's and Park's spoken numbers are gone, "*a beat*" is "...". One remains
   in Mercer ("*a long pause*"), one in Elena.
7. **Docs.** `TESTING_WALKTHROUGH.md` and `PASS4_PLAYTEST.md`: flag-3 texts end "Privesc guide's yours if
   you want it."; the fallback is nine minutes from the abort (`delayMs` 540000 from `grid_saved`), and the
   sign-off text now says so.

### Intended structure changes (tagdiff, HaX only: 28 differences)

All from items 1–4; the other seven files are **STRUCTURE UNCHANGED**.
- VARs `cascade_armed`, `vault_pin_found` (both declared globals, both in `missions.json`).
- Layout and clock choices divert to `first_call_committed_choices` instead of `hub` (4 lines).
- The S2 reminder choice from the previous round (choice, divert, hub count 26 → 27).
- Vault-hint choice condition gains `not vault_pin_found`.
- New conditions: the clock's `grid_saved` / `cascade_armed` branches; `topic_elena` and `topic_traffic`
  redirect / window branches.
- erb: one mapping gains `setGlobal: vault_pin_found` (not an ink change).

### Checks

- Recompiled all 8; 0 failed. Validator 0 errors (same 7 intended warnings); doors OK.
- dialoguelint: 0 errors. HaX 115 lines, median 12, max 25; `transition=1` (the Architect's quoted "however",
  justified), `you-after-choice=2` (silent choices).
- reopencheck m07: 0 problems (agent_0x99 and the_architect, 1800 reopens each).
- Clock answer checked in ink for all three states; each returns to the layout/clock menu.
- inkcheck + loopcheck over 39 states (the 33 from the script-edit round, plus the clock armed and after the
  abort, the two topics after a redirect and with the window shut, the uncommitted traffic topic, and the
  vault hint with `vault_pin_found`): **inkcheck 39/39 clean, loopcheck 39/39 clean**. Output:
  `<scratchpad>/m07-dialogue/matrix-round3.txt`.

## Changes made — final confirmation round

Input: `tools/playtest/m07-pass4-final-report.md` (all 16 checks passed) and three small items.

1. **Stale t-20 bark atop the sign-off.** Its mapping is already gated on `!globalVars.grid_saved`; what
   showed was the earlier bark left unread in the thread's history. Its text is now "A word, Agent 0x00."
   (erb), which reads correctly above any later call and no longer duplicates the ink's "You've sent your
   team.".
2. **[Hang up.] after a reload.** `after_win` now ends the story (`-> DONE`) instead of looping on a
   [Hang up.] choice. A finished call offers nothing; a reopen restarts at `start`, which routes straight
   back to `after_win`.
3. **"Three briefs. One team."** Correct as written: Netherton briefed three operations for the one team;
   Portland was the agent's. No change.

Structure change (Architect only, 5 tagdiff differences, all from item 2): `after_win` loses its sticky
choice, its `#exit_conversation` and its divert, and gains `-> DONE`. Other files unchanged from the
playtest round. Checks: recompiled; validator 0 errors; reopencheck 0 problems (the Architect walks now
end, so 390 reopens instead of 1800); loopcheck and inkcheck clean on the Architect for first contact,
T-20, the sign-off and after the win.
