# m06 Follow the Money — dialogue review and rewrite (pass 4)

2 October 2026. The npc-dialog-review skill run in full on the ink as it stood after the pass-4 design
rounds (snapshot: `<scratchpad>/m06-dialogue/ink-before/`), then the rewrite. Line numbers in the
review sections refer to the **before** files.

## 1. Compile and validate (skill step 1)

- **Compile:** all eight ink files compile with `bin/inklecate`, no warnings, no apparent loose ends.
  Every committed `.json` was byte-identical to a fresh compile before the pass.
- **Validator:** schema passed, 0 invalid. Nothing dialogue-facing: no unresolved speaker prefixes,
  no `//` inside a line, no stray `*` at line start, no `#give_item` placed after its line. The
  twelve co-fire warnings and the "two items point to server_room" warning are the intended ones
  documented in `DESIGN_REVIEW.md`.
- **Lint before** (`dialoguelint.mjs`, saved as `lint-before.txt`): 28 items. `line-len` 3,
  `text-len` 9 (HaX timed texts of 31–47 words), `you-after-choice` 7 (6 verbal, 1 allowed),
  `choice-len` 2, `not-x-but-y` 2, `banned-word` 3 ("valuable" ×3), `inflated` 1 ("Let me know if
  you need anything"), `us-spelling` 1 ("Organized" in a Leeds voice).
- **Runtime:** inkcheck and loopcheck over a 14-state matrix on all eight files: 224/224 clean
  (`matrix-before.txt`).

## 2. Dialogue review (skill step 2)

### 2a. Attribution and narration — OK, one note

Every `Name:` prefix resolves. Priya's knots carry `#speaker:analyst`, which prefix-matches no NPC
(`blockchain_analyst`), but every one of her lines has the `Priya Raghavan:` prefix, so it renders
correctly. Tag left alone (logic). Narrator use is moderate (about 25 lines); a few interpret rather
than show (Irina `:303` "She'd never feel it read.", Satoshi `:503` "as if he rehearsed it").

### 2a-bis. Is the dialogue supported by the scenario? — CONCERN (four contradictions)

- Priya `suspicious_patterns` `:198-200`: "Consistent timing every Friday night" and "$12-13 million
  over the past month". Her own write-up says three named deposits on 14 Jul (Monday), 29 Jul and
  3 Aug, plus "about $12M more since January".
- Priya `destination_discussion` `:211` says the money "all reconverges to a single destination
  wallet", then `source_identification` `:324` and the write-up say the chain can't tell her where
  it lands. She can suspect one destination; she can't have seen it.
- Priya `pattern_concerns` `:294` "Five different source wallets" against three named wallets in
  the write-up and the daily report.
- Dani `mixing_explanation` `:227` "through 5-10 different wallets"; the pool config says three
  Monero hops. Dani also calls themself "the guy watching charts" (`:201`); the voice bible gives
  Dani "they", and the credits say "Kept his head down" (`erb:176`).
- Directions all match `connections` (lab east, office west, server room north of the floor, data
  centre north of the server room, wing east of the data centre, Satoshi north of the wing).
- **The recap bug.** `recap` `:279-281` says "The data centre is north of the server room. The code's
  in the door controller export." whenever flag 3 is in and the fund isn't found, including when the
  player is standing in the data centre (m06 confirmation playtest). Nothing in the ink knows the
  player has been in. Needs a small logic change (see Changes made).

### 2a-ter. Voices — OK

Every speaker has a voice block, no voice name is shared inside the mission, and accents are stated.
The HaX briefing and debrief identity text differs from the canonical sentence (voice bible drift
table); left for the audio pass.

### 2b. Player choices are spoken dialogue — CONCERN

- **`You:` lines after a choice or in place of one:** Irina `:291`, `:383`, `:389`, `:403`, `:409`,
  `:413`, `:456`, `:481`; Satoshi `:349`, `:352`, `:403`, `:405`, `:449`, `:501`; HaX phone `:484`,
  `:495`. Sixteen in all; only `:495` is after a non-verbal-looking choice, and it isn't really one.
- **Menu labels:** HaX `[Password cracking guidance]`, `[Blockchain analysis tips]`, `[Irina Volkova
  recruitment strategy]`, `[Cover is solid so far]`, `[This connects all the cells]`; Priya `[Tell me
  about your methodology]`, `[That makes your logs valuable]`; Dani `[Tell me about the exchange's
  operations]`, `[That's impressive volume]`; Satoshi `[You're enabling mass murder]` and the arrest
  labels; debrief `[On my way]`. Several choices lack end punctuation and read as labels.
- Two over-long choices (Irina `:106`, Satoshi `:61`), and a player "not X, Y" in Dani's
  `[That sounds like ideology, not business]` and Satoshi's `[That's not justification for terrorism]`.

### 2c. Hub structure — OK

Each conversational NPC has a hub with an unconditional sticky exit; exits are one or two lines.
`-> END`/`DONE` only in the briefing, debrief and Satoshi's fight branch.

### 2c-bis. Starved knots — OK

loopcheck over the 14-state matrix found no runtime error or runaway in any file.

### 2d. Choices that matter

- **Flat pairs (CONCERN, minor):** Priya `transaction_work` (`[Is that suspicious?]` /
  `[What do the patterns show?]`), Priya `monero_forensics` (both to `internal_logs_value`), debrief
  `identity_found` (both to `tesseract_revelation`). Words alone can't fix these; the real fix is
  one option or a branch, which is a structure change. The rewrite makes each pair at least two
  different moves whose shared reply answers both; the branch is logged.
- **Satoshi (OK, stance convergence):** an immovable ideologue; the player picks a stance and he
  answers each differently. No stance variable, so the debrief can't echo it; backlog.
- **Irina (OK):** openers move trust by different amounts, the notes leverage and "give her time"
  are real alternatives, and the debrief reads clone vs lend, notes, recruited / detained / KO.
- **Debrief payoffs (OK):** freeze/watch, Irina's fate and how she was worked, Satoshi KO, the
  confirmed slot, the safe file and the FCA letter are all read back. The trader's and analyst's
  conversations are paid off only in the credits.
- **Curiosity (OK):** Priya's `mixer_matching` teaches the method, Irina's turned branch narrows the
  slot. Both stay available.

### 2e. Cross-file state — OK

Every global set in ink is declared and read (checked in the design rounds; unchanged here).

### 2f. Influence tags — CONCERN (logged, not changed)

`irina_trust` changes in eleven places; only `notes_leverage` carries `#influence_increased`. Adding
the tags is a tag change, so it goes to the log rather than into a prose pass.

### 2g. Syntax and readability — OK, with lists in speech

No bold, no line-initial `*`. Several lines are spoken lists: debrief `strategic_impact` ("We now
know:" then three lines), the six cell names in `architects_fund_discussion`, Satoshi's
"Poverty. Debt. Medical bankruptcy. Foreclosures.", Priya's three-step methodology, HaX's "Priority
one / two / three".

### 2h. KO resilience (writing side) — OK

Irina, Satoshi, the analyst and the trader all have KO-aware lines where they matter; no line assumes
someone is standing who may be on the floor.

### Voice and craft (style guide checklist)

- **HaX reads flat in the phone ink**, as the voice bible says: objective-speak (`initial_guidance`
  "Priority one/two/three", `on_first_server_cracked` "Good cracking", `on_network_complete`
  "Outstanding work... make it count"), lectures (`recruitment_strategy` "Appeal to her ethics, not
  her ideology. She's a cryptographer, not a terrorist."), and a sign-off on every recap ("That's
  where we are."). The debrief opens with a grade ("Good work at HashChain") and a list.
- **Satoshi** rants in capitals ("REDUCE", "ACCELERATION", "OUR") and uses "not X, Y" five times. The
  voice bible has him calm, amused and unrepentant; he should be specific and quiet.
- **Priya** is generic. She should sound like a keen Leeds analyst who hasn't seen what her graph
  proves.
- **Dani** is close (jittery, over-explains) but uses US filler ("Cool cool", "gonna", "We make bank").
  Peckham, not California.
- **Irina, the guard and Nightshade** are in good shape; light trims only.
- **Briefing:** opens well; HaX's lines run to 27 words and end on a motto ("Follow the money").

## 3. Prioritised action list (skill step 3)

**Must fix**

- The recap's data-centre directions play to a player already inside (small logic change).
- Four facts that contradict the write-up and config (Priya's timing, total, wallet count, "single
  destination"; Dani's hop count) — a careful player doing the matching meets them.

**Should fix**

- Sixteen `You:` lines folded into choices or turned into narration.
- Menu-label choices rewritten as speech.
- HaX's phone and debrief voice (objective-speak, grades, sign-offs); Satoshi's capitals and repeated
  "not X, Y"; Priya and Dani given their own voices.
- All lint `line-len`/`text-len` errors, `banned-word`, `inflated`, `us-spelling`, `not-x-but-y`.
- Dani's pronoun in the credits.

**Worth considering (logged, not done here: structure)**

- Influence tags on `irina_trust` changes.
- The three flat choice pairs.
- A Satoshi stance variable the debrief could read.

## Changes made (dialogue pass)

Prose only, apart from one logged logic change. Puzzle clues untouched: Priya's write-up, the settlement
log, the pool config, the custody index and the fund document are byte-identical; Irina's two
narrowing lines and her slot-check replies are unchanged; HaX's three-rung ladder is unchanged apart
from losing the phone `Agent HaX:` prefix. Priya's method line lost one colon. Re-solved from the
rendered erb: fee 1.5%, hold 6 h, three deposits, and only slot 4471 fits all three (amount alone
still points to 3815 and 2207 as decoys).

### Logic change (deliberate, small)

- **Recap directions inside the data centre.** New global `entered_data_center` (declared in
  `globalVariables`, `VAR` in the phone ink, added to m06's block in
  `scripts/ink_runtime_check/missions.json`), set by the two existing `room_entered:data_center`
  mappings, which between them cover every case where the recap line can show. The recap's "north
  door of the server room / code in the export" line now sits inside `{not entered_data_center:}`.
  tagdiff on the phone ink reports exactly these two differences (the VAR and the condition).
  Probed: with the flag set, the recap starts at the custody-console line.

### Per file (lines changed include choices; from tagdiff's prose counts)

| File | Changed | What and why |
|---|---|---|
| `m06_phone_agent_0x99.ink` | ~128 of 151 | `Agent HaX:` prefix dropped (phone rule). HaX's voice: fact first, short, dry; "Priority one/two/three", "Good cracking", "Outstanding work", "make it count" and the closing "That's where we are." gone. Menu-label hub choices now questions. Two `You:` lines folded into their choices. Long lines split; directions and codes kept and moved to the front. Recap gate above. |
| `m06_npc_irina_volkova.ink` | ~29 of 115 | Eight `You:` lines removed: folded into choices (badge, reveal, the two recruitment pitches, both detain choices) or turned into short `Narrator:` actions where no choice precedes them. Two long choices cut. Her voice (guarded, few contractions) kept. |
| `m06_satoshi_confrontation.ink` | ~106 of 154 | Six `You:` lines folded into choices or narration. Capitals gone. Five "not X, Y" cut to one ("We're not terrorists. We're midwives."). Speeches shortened to calm, amused lines with an exit choice at each beat as before. American spelling allowed, but "recognize" avoided for the lint. |
| `m06_npc_analyst.ink` | ~85 of 112 | Priya now sounds like a keen Leeds analyst. Fixed to agree with her write-up: three named wallets plus about twelve million since January, regular timing (no "every Friday"), and she *suspects* one destination instead of having seen it. "valuable" ×2 and "Organized" gone. |
| `m06_npc_trader.ink` | ~59 of 70 | Dani: Peckham, jittery, over-explains; US filler and "the guy" gone. "5-10 wallets" replaced with "a few" (the config says three hops). Chatbot sign-off gone. |
| `m06_closing_debrief.ink` | ~84 of 130 | No grading ("Good work") or "We now know:" list; the six-name list became one line. Choices read back by name as before. The projection figure is still stated plainly where it was. Tesseract beat: one "half" line instead of two; HaX stops herself rather than saying "this got personal". |
| `m06_opening_briefing.ink` | ~11 of 29 | Long lines split; ends on the first action (Volkova, trading floor) in place of the title motto. |
| `m06_npc_checkpoint_guard.ink` | 0 | Already in good shape. |
| `scenario.json.erb` | 10 strings | Nine HaX timed texts cut under 30 words (facts kept). Dani's credit now "Kept their head down". The new global and its two `setGlobal`s. |

**Spoken lines touched:** about 500 ink lines and choices (choices aren't voiced, so roughly 420
voiced lines), plus 9 timed texts. m06 audio isn't generated yet.

### Lint before and after

| Rule | Before | After |
|---|---|---|
| line-len | 3 | 0 |
| text-len | 9 | 0 |
| you-after-choice | 7 | 0 |
| choice-len | 2 | 0 |
| not-x-but-y | 2 | 0 |
| banned-word | 3 | 0 |
| inflated | 1 | 0 |
| us-spelling | 1 | 0 |

Medians after: debrief 13, analyst 11, guard 9, Irina 12, trader 10, briefing 16, phone 13, Satoshi
10.

### Checks (all run after the edit)

- tagdiff vs `ink-before/`: STRUCTURE UNCHANGED in seven files; the phone ink has the two listed
  differences. `You:` lines 16 → 0.
- `bin/inklecate`: all eight compile clean; every `.json` matches a fresh compile.
- Validator: schema passed, 0 invalid, all ink valid (two "looks like a speaker prefix" suggestions
  raised by the first draft, `Freeze:` / `Watch:`, were reworded, along with two similar
  `Label:` openings).
- Door alignment: OK.
- inkcheck + loopcheck, 14 states (including the new flag), all eight files: 224/224 clean.
- reopencheck m06: 0 problems.

### Not done (logged for the orchestrator)

- Influence tags on the ten untagged `irina_trust` changes (tag change).
- The three flat choice pairs (Priya ×2, debrief Tesseract) need a branch or one option.
- No stance variable for Satoshi's final question, so the debrief can't echo it.
- `#speaker:analyst` resolves to no NPC (harmless: every line is prefixed).
- Voice identity text for the HaX briefing/debrief blocks, per the voice bible.

### Ideas for the backlog

- Let a turned Irina's slot check accept a typed number rather than a list of slots.
- Credits line for the FCA letter score.

## Script edit round

Applied 2 October 2026 from `DIALOGUE_EDIT_NOTES.md` (verdict "revise (light)"): M1, M2, S1–S14 as
the coordinator asked. The editor's optional items weren't taken. Snapshot of round 1:
`<scratchpad>/m06-dialogue/ink-round1/` and `scenario-round1.json.erb`.

### Prose (M1, M2, S1–S11)

| Item | File | Change |
|---|---|---|
| M1 | Irina `evidence_pivot` | The narrator line names the first wallet and the hospital ransoms, so "Used to kill people" has its antecedent on the evidence-first route. |
| M2 | Priya `transaction_work`, `suspicious_patterns`; Dani `trader_suspicions` | The three lines describing the deposits as simultaneous / same-amount / regular now use the editor's wording (round sums, late evening, same habit), which matches the write-up. |
| S1 | erb, `server_passphrase_known` text | "The checklist's own date is the year." |
| S2 | phone `password_help_choices` | Tool named in full. |
| S3 | phone `handler_recommendation` | The watch line states its cost. |
| S4 | phone `fund_hint` rung 2 | "…at least six hours on." Only the wording of the hold changed; the order and the numbers are the same. |
| S5 | Irina `discuss_badges` | Badge line restored to plain word order. |
| S6 | Priya | "Honestly?" now belongs to Dani only. |
| S7 | Dani `irina_discussion` | Follow-up choice is "[Do you get on with her?]". |
| S8 | debrief `strategic_impact` | "[And the fund?]". |
| S9 | debrief `cell_disruption` | Second reading of the projection number cut; the first stays. |
| S10 | debrief `operation_disrupted` | About the clock only; the cost stays in `cell_disruption`. |
| S11 | debrief `mission_conclusion` | Restating lines and the `{irina_recruited:}` block removed. |

### Structure (S12–S14), with tagdiff against `ink-before/`

- **S12 influence tags (Irina, 17 differences).** 13 tags added (12 increased, 1 decreased); with
  `notes_leverage`'s existing tag, every one of the 14 `irina_trust` changes is now tagged. The two
  opener pairs are merged (`+= 10`/`+= 5` → `+= 15`; `+= 15`/`+= 10` → `+= 25`, deleting the
  `professional_response` and `academic_response` changes). Totals are unchanged. The `~` lines in
  `academic_discussion` (second choice), `research_topic` and `paperwork_topic` now sit above the reply
  lines. The first `academic_discussion` choice gets a reply ("Then we have that much in common.").
  Moves within a knot don't show in tagdiff; the 4 assign entries are the merges.
- **S13 flat pairs (prose only, no tagdiff difference).** Priya `transaction_work` and
  `monero_forensics`: each option now has its own first reply line, and the shared knot opens after
  it. Debrief `identity_found`: each choice answers in its own words; `tesseract_revelation` keeps only
  the "left over an argument" line and its choices.
- **S14 Satoshi stance.** New global `satoshi_stance` (`""`), declared in the erb `globalVariables` and
  in m06's block of `missions.json`. The three `final_words` choices set `rejected` / `wondered` /
  `refused` (Satoshi: 3 tag differences). The debrief has `VAR satoshi_stance` and a three-way switch in
  `satoshi_aftermath`'s non-KO branch (debrief: 5 differences: the VAR, three switch cases, and the
  removed `irina_recruited` condition from S11). The KO route never reaches `final_words` and keeps its
  own line. Probed all four values: each prints its intended line.
- Unchanged from round 1: the phone's 2 differences (recap gate). The other four files: structure
  unchanged.

### Checks (round 2)

- All eight ink files compile; every `.json` matches a fresh compile.
- dialoguelint: 0 errors, 0 warnings.
- Validator: schema passed, 0 invalid, all ink valid. Door alignment OK.
- reopencheck m06: 0 problems.
- inkcheck + loopcheck: 17 states (the round-1 14, plus the three `satoshi_stance` values) × 8 files,
  272/272 clean.
- Puzzle, from the freshly rendered erb: the write-up, the settlement log, the pool config, the custody
  index and the fund document are identical to round 1. Fee 1.5%, hold 6 h, and each of the three
  deposits matches only 4471.

**Spoken lines this round:** about 22 changed, 9 new (Irina 1, Priya 2, HaX debrief 4 + 2 stance
variants), 4 choices and 1 timed text.

**Not checked:** the editor asks for a browser look to confirm the influence popups land on a spoken
line (one Irina opener and the evidence scene). This round ran static and runtime checks only.

## Playtest round

From `tools/playtest/m06-pass4-dialogue-report.md` (games 1411, 1420, 1424). It found no hook failures and
the puzzle read clearly. The opener popups landed on Irina's lines; the evidence-scene popup didn't.

### 1. Irina's evidence scene

- The `+15` and its tag sat after the conditional, so the popup rode on the next knot's Narrator line.
  It now sits inside each branch, directly above Irina's first spoken line (two assigns where there was
  one).
- Pre-fund branch: Irina names it herself ("RansomInc. That's the hospital money, pooled. It went
  through my mixer."). The narrator line is gone.
- `recruit_accept` opened with a Narrator line, and the reveal and notes choices' popups would have
  landed on it. It is now folded into Irina's line ("*after a long moment* Then I'll help you…").

### 2. "Didn't know what to do"

- **Vault account.** The flag-3 text now says what it is ("Last backend box is the vault account. It
  holds the wallet keys. Get it before upstairs.", 28 words), and so does the recap line.
- **Phone opened late.** `first_call_choices`: "Holding fine" and "What should I focus on first?" now
  need `not guard_resolved`. A new `{guard_resolved}` choice, "[I've been busy. Where are we up to?]",
  goes to the recap, which is state-aware.
- **"Which cold slot is the fund?"** now needs `entered_data_center or read_settlement_log` (it used to
  need flag 3 or the write-up). `VAR read_settlement_log` was added to the phone ink. The option's own
  "get Priya's write-up first" branch is kept.
- **Recap opener.** The Volkova's-office line now also needs `not irina_fate_decided`.

### 3. The worst lines, and the stage directions

- **Dani and Priya first meetings.** These were a real flow bug. The first-meeting block had no divert
  after its choices, so `{not first_meeting:}` ran straight away: it printed the return greeting and
  merged the hub's choices into the intro. Both are now a single `{first_meeting: … - else: …}`. Run in
  ink: the first visit gives the intro only, and a return visit gives the greeting plus the hub.
- **Satoshi's opener.** The same bug. The second block ("What will it be, Agent 0x00?") ran right after
  the intro, then `choice_presentation` ("You face a decision, Agent 0x00."). `start` is now one
  `{ - not confrontation_started: … - not asset_choice_made: … - else: -> aftermath }`. The return line
  is "Back again.". `choice_presentation` is rewritten in his voice ("So. What happens to my money?",
  "You could freeze it. Very decisive…", "Or you let it run and watch who comes to collect…"), with no
  name.
- **Other lines:**
  - "*mild* We costed it…" is now "We costed it so it stays small. That's what a number is for."
  - Irina's "I'm still here, and still yours." is now "What else do you need?"
  - Satoshi's "Thanks for the demonstration." is now "Whatever you chose tonight, {player_name}, you'll
    find out what it cost. So will I.", which fits both endings.
  - Debrief: "Greed I could bargain with. These people believe it."
  - Debrief: "Every cell needs a new bank now, and they won't trust the next one for months."
  - Irina, detained: "All those papers. For this."
  - The briefing's second "Agent 0x00" is gone.
- **Asterisk cues.** Cut from 38 to 12 (m01 runs about 15 in 546 lines). The ones kept carry an action
  the scene uses: the lanyard tap (the clone hint), unclipping the badge, the monitor turn, her wrists,
  "goes still", "quietly", "lowers voice".

### 4. Small

- **Priya's credit.** `analyst_walked_through` is now set by `#set_variable` in `pattern_concerns` (the
  graph conversation). The task mapping that used to set it now sets `analyst_spoken`. A method-only
  player gets "Never knew what her graph proved".
- **Briefing figure.** The briefing now says "$2.4 million in one payment this summer, hospital ransoms
  pooled.", which agrees with the write-up's single 14 Jul deposit. The figure itself is unchanged.

### 5. Layout (erb only; needs a browser look)

- **Rack Inventory Sheet.** It now has an explicit `position` `{3, 7}` (open floor, west of centre),
  away from the flag station.
- **Satoshi.** Moved from `(5,5)` to `(5,6)`. At (5,5) his body sat against the desk, and the east
  approach stopped 36 px away against a range of 32. The opening narration now says he "leans against
  the front of an executive desk".
- The validator's geometry check passes, but tile clearance at both spots was judged from the
  `room_ceo` / `room_servers` tilemaps, not seen in the game.

### Structure differences (tagdiff against `ink-before/`, beyond the earlier rounds)

| File | New this round |
|---|---|
| analyst | `else` replaces `not first_meeting`; `#set_variable:analyst_walked_through=true` in `pattern_concerns` |
| trader | `else` replaces `not first_meeting` |
| Satoshi | `start`: one switch (`not asset_choice_made`, `else`) replaces the two blocks |
| Irina | the `+15` and its tag moved into both `evidence_pivot` branches (one extra assign) |
| phone | `VAR read_settlement_log`; `first_call_choices`: two conditions added, one new choice to `recap`; `fund_hint` gate; recap Volkova-line condition |

The guard and briefing files: structure unchanged. The debrief: unchanged since round 2.

### Checks (playtest round)

- All eight ink files compile; every `.json` matches a fresh compile.
- dialoguelint: 0.
- Validator: schema passed, no unknown fields, all ink valid, geometry OK.
- Door alignment: OK.
- reopencheck: 0 problems.
- inkcheck + loopcheck: 19 states × 8 files, 304/304 clean.
- Puzzle, from the fresh render: the five clue texts are identical to round 1; 1.5% and 6 h give 4471
  alone.

**Spoken lines this round:** about 30 changed or new, 1 choice and 1 timed text.

**Still needs a browser look:** the new layout positions, the evidence-scene popup, and a phone first
opened late.

## Final round (after `tools/playtest/m06-pass4-final-report.md`)

- **Re-entry lines (m03 `hub_quiet` pattern).** Dani, Priya, Irina (`hub` and `after_choice`) and Satoshi
  (`choice_presentation`, `aftermath`, and `start`'s "Back again.") all follow it now. Every
  `#exit_conversation` sets `hub_quiet`, and so does each greeting that diverts into the hub. The resting
  knot prints one short line unless the flag is set, and clears it. Choices stay in the same knot, so the
  engine's re-navigation (`person-chat-minigame.js:506-521`, knot of the first saved choice) prints the
  line on a reopen. Simulated with inkjs, goodbye then two reopens, for each NPC: no line after the
  goodbye, one line per reopen. The guard was already fine (re-navigation lands on `start`, which greets);
  dialoguelint's three `blank-reentry` checks on his stitches are false positives for that reason.
- **Lines.**
  - Satoshi's decision speech opens "Let's talk about my money." (no second "So.").
  - "Nothing. Carry on." now gets a reply: turned, "Then be careful up there."; detained, "She doesn't
    answer.".
  - The debrief's watch line is now "We let it run. What's on that document is ours to stop now."
  - Priya's *pointed look* and Irina's *goes still*, *quietly* and *after a long moment* are cut (9 cues
    left in about 420 lines; m01 has 15 in 546).
- **Structure (tagdiff against the playtest-round snapshot).** In the analyst, trader, Irina and Satoshi
  files only: `VAR hub_quiet`, the `hub_quiet` assigns and conditions above, and Irina's two-branch reply
  on "Nothing. Carry on.". No knot, divert target or choice condition changed.
- **Checks.**
  - All eight ink files recompile in step.
  - dialoguelint: only the three guard false positives.
  - Validator: all ink valid. reopencheck: 0 problems.
  - inkcheck + loopcheck: see the next line.
  - inkcheck + loopcheck, 19 states × 8 files: 304/304 clean.
