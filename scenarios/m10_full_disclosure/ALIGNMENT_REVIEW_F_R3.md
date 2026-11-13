# m10 Full Disclosure: alignment review, round 3 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I ran the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, `ALIGNMENT_REVIEW_F_R1.md`, `ALIGNMENT_REVIEW_F_R2.md`, CONTRACT.md §11 (alignment rounds 1 and 2, ink and JSON) and m09's export list (m09 CONTRACT §5). The tree is HEAD 2937fdb9; m10's only uncommitted change is `dungeon_graph.md`. No VM material was opened.

- **Ink compile:** every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): no errors. It reports the same 2 objective-wiring warnings and 80 issues as before (the `aside_done` and `blast_tunnel` pairs, the import-default reminders, 4 behaviourless placeholder NPCs).
- **dialoguelint:** 0 errors, and the same counts as R2: blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1. That's the phase-4 backlog, not counted here.
- **Engine reads** for the new wiring:
  - `npc-manager.js:1680-1716`: `skipIfGlobal` is checked when a text is delivered and again when a held toast is released;
  - `npc-conversation-state.js:29-80, 221-252` and `person-chat-minigame.js:1053-1072`: a person-chat's file-local `VAR`s are saved after every choice, synced to the server and seeded back on load as a variables-only state;
  - `scenario-music-events.js:97-122, 270-290`: every matching music event fires in file order, so the last matching `game_loaded` twin wins;
  - the ERB's `credits_for` merge (erb:1062-1101).
- **Canon checks against the source missions:**
  - m02: bed four;
  - m05: Torres's fates, `elena_treatment_funded` set only on the arrest and turn paths, and the deal taken without the envelope (m05_phone_recruiter.ink:174-232);
  - m07: Denver is `team_assignment == ""` (m07_closing_debrief.ink:218);
  - m09: `memo_stance` takes only `yes_albion` or `no`; `debrief_notice_before` and `reading_told_hax` (m09_phone_agent0x99.ink:676, 831-834); Noor's buttons (m09_noor_haddad.ink:103-106).
- **Save-by-save trace:** a cold start, a full season, and six mixed saves, each through all six endings (below).
## Counts and verdict

**0 blockers, 1 major, 10 minors** (open). All 22 R2 findings are closed at the line R2 named (table below). Two fixes brought in a new problem:
- R2-m14's reversed credits merge hides tonight's teammate knock-outs (R3-m2);
- R2-m10's `six_open` skip leaves T-47 to T-56 unable to reach the thread on any ending, while T-57 still toasts between scenes on Join (R3-m3, R3-m4).

The major is new, and older than this round. Netherton's St. Catherine's season line promises the pumps "will be now" on the two database outcomes where the card says they won't be (R3-M1).

**Verdict: another round needed (phase not complete; 1 major, 10 minors).** Every item is a small, mission-local fix: one ink line split three ways, one credits condition, two SAFETYNET clauses (changed in both copies), some JSON tidying and a handful of single lines. None needs the user. The ending now does what the user asked on almost every save:
- the player heads their own credits;
- Netherton adds up a season line that isn't Albion twice;
- m01, m05 and m09 each reach the core and the close;
- every ending's last beats sit inside a scene.
## R2 findings: closed or not

| R2 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| M1 0x00's credit hid tonight | closed | erb:558-565 holds only the six ending clauses. The `told` clause is its own unnamed row (erb:566-569), skipped on Join | none |
| M2 Torres's wife | closed | tesseract.ink:558, 560; erb:768 | **R3-m7**: on a funded arrest, "I count her as well" now contradicts the credit "His wife's treatment goes on." |
| M3 the season line was always Albion | closed | carryover_vars.ink:487-510: the three Albion keys are skipped when the memo line follows, plus a `denver` arm; six_oclock.ink:631-661 | none from the fix. **R3-M1** is an older line that this fix brings to the front: a full season now usually lands on St. Catherine's |
| M4 m09's four newest exports | closed | erb:4112 imports all 23 of m09's exports (matches m09 erb:2407-2412); `ko_pattern()` m09 arm carryover_vars.ink:340-343; `reading_told_hax` six_oclock.ink:507-509; `debrief_notice_before` tesseract.ink:1010-1011 | **R3-m6**: the hearing's own "the rest" (scorched) didn't get the `reading_told_hax` line |
| M5 Noor contradicted the forty-seven | closed | erb:777-781: told, warned in October, knocked out, never told | **R3-m1**: the two "never told" rows both hold when m05's deal was taken without the envelope being read, so the row prints twice |
| m1 the case replayed on reload | closed | tesseract.ink:209-271 (`tess_case_step`, `tess_rec_*` written on the pick). File-local `VAR`s are saved after every choice (person-chat-minigame.js:1067-1072), exported with each sync (npc-conversation-state.js:221-237) and seeded back on load as a variables-only state that restarts at `start` (:246-252), so `case` resumes at "Where was I. Your record." | none |
| m2 the memo challenge's answers | closed | tesseract.ink:286-306: only the memo answer and "[I'm not saying it for you.]" when he asks about the memo | none. "No. You said it for Magnus." also reads on the `no` stance, as a refusal to say it again |
| m3 the button that never showed | closed | cut | none |
| m4 the orphaned line | closed | tesseract.ink:246-250 | none |
| m5 two stings before his reply | closed | tesseract.ink:547-564: one `{ - }` block, bed four first, then m05 | none |
| m6 "since Denver" | closed | six_oclock.ink:644-647; carryover_vars.ink:504-505. Checked against m07 (the closing debrief's line 218; erb:212) | none |
| m7 Voltage's escaped line | closed | six_oclock.ink:229 | none (the `*flatly*` cue is phase 4's) |
| m8 Victoria's knock-out line | closed | six_oclock.ink:298-301 | none |
| m9 executed lost Ghost's word | closed | six_oclock.ink:594 | **R3-m5**: "lights twice" is wrong when the Recruiter also texts |
| m10 toasts between scenes | partly | erb:1694, 2181, 2242 skip on `six_open`; erb:1693 skips on `citadel_open` | **R3-m3**: T-47 to T-56 can now never reach the thread on any ending, though three comments and CONTRACT §11 say they are its record. **R3-m4**: Join's T-57 still toasts between Tesseract and the Citadel |
| m11 "Ten operations" | closed | erb:570-574 | **R3-m8**: the fallback "Still answering for every one." has lost its noun |
| m12 Netherton's five lines | closed | six_oclock.ink:627-630 | none |
| m13 the talk-down score on reload | closed | erb:1155-1167: eleven twins. I enumerated the reachable exchange states with at least one landed point (exchanges fill in order): 4 with exchange 1 missed, 7 with it landed, so 11, and each maps to the live cue's track. All `game_loaded` music events fire in order (scenario-music-events.js:270-290), so the later twin overrides "Steel Shadows" | none |
| m14 SAFETYNET clauses that couldn't show | closed for HaX and Netherton | erb:1080-1094 (SAFETYNET conditionals first, then IN THIS OPERATION conditionals, then the SAFETYNET default) | **R3-m2**: Vector's and Phantom's `on_team` SAFETYNET clauses now act as catch-alls and hide a knock-out the player gave them. Quintero's knock-out credit is softened. See "The credits merge order" below |
| m15 `combat_lethal` row | closed | erb:771 (m05 funds treatment only on arrest and turn: m05_torres_confrontation.ink:299, 339; m05 erb:210) | none |
| m16 two Citadel lines | closed | citadel.ink:25, 29 | none from the fix (R3-m9 is the line above them) |
| m17 stale comments | ink closed; ERB partly | the ink comments match the code | **R3-m10**: two ERB comments still describe the old order |
## Severity table (new and open findings)

### Major

| # | Finding | Where | Fix |
|---|---|---|---|
| R3-M1 | **On secured and on scorched, the season line promises the opposite of what the card says.** `stcath_exposed`: "Forty hospitals patched after St. Catherine's. The pumps on his list were not among them. They will be now." That is true only when the database went to the vendors.<br>• **Secured:** HaX warned at the core, "Keep them, and the infusion pumps in a hundred and forty hospitals are still live next year." (tesseract.ink:1002). The card then reads "Infusion pumps in 140 hospitals are still unpatched." (erb card_d).<br>• **Scorched:** Netherton has just said "nobody fixes anything either" (tesseract.ink:1023).<br>Since R2-M3, this is the line most full seasons now hear (St. Catherine's is the first key once Albion steps aside for the memo). It lands seconds before the card contradicts it, and it undercuts the database choice, the core moral choice of the night | six_oclock.ink:638-639; carryover_vars.ink:496-497 | Keep the key and choose between fixed strings by `database_outcome`, inline:<br>• disclosed: "…They will be now.";<br>• secured: "Forty hospitals patched after St. Catherine's. The pumps on his list were not among them. They still aren't. That was my signature too.";<br>• both_wiped: "…They were on the map we just burned."<br>Then check the other ten season lines against all three database outcomes. I did: none of the others depends on it |

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R3-m1 | **Noor's "never told" row can print twice.** m05 lets the player take the Recruiter's deal without ever reading the envelope (m05_phone_recruiter.ink:181-232: `found_pipeline_list` false, `recruiter_deal_accepted` true). On that save, with Noor met but not told in m09, both "never told" rows hold, and ELSEWHERE prints every row that holds | erb:780-781 | Add `&& globalVars.m05_found_pipeline_list === true` to the second row (erb:781). The rows are then exclusive on every m05/m09 combination. I checked the other four: told, warned, knocked out, never played |
| R3-m2 | **The reversed merge hides a teammate the player knocked out.** SAFETYNET's conditionals now come first. Vector's "Cryptographer, the crypto annex." and Phantom's "Auditor. The kit sign-outs balance now." are conditional only on `*_on_team`, so they hold whenever the man was on the team. That makes them catch-alls. So the deleted "Knocked out by his own agent." / "Floored by the agent whose kit he audits." (and the recall lines) could no longer print, and a player who floored Vector reads that he's back at the annex. Quintero's "Put on the floor by her own agent." gave way to "On her feet by Friday, and asking questions.", which keeps the cost but drops who caused it. Arakawa keeps his knock-out credit, because his SAFETYNET entry has no catch-all, so the four teammates are treated unevenly | credits_sections.json:92-118 and the ERB copy erb:907-931; erb:1080-1094 | In both copies (the drift check compares them), add a first SAFETYNET clause, styled warning, for each of the three:<br>• Vector, `vector_on_team && vector_ko`: "Cryptographer. Knocked out by his own agent. Back at the annex on Monday.";<br>• Phantom, `phantom_on_team && phantom_ko`: "Auditor. Floored by the agent whose kit he audits. He has filed it.";<br>• Quintero, `quintero_ko`: "Raid lead. Put on the floor by her own agent. On her feet by Friday, and asking questions."<br>Keep the merge order (see the section below) |
| R3-m3 | **The 06:00 texts can never be delivered now, and three comments say they are the thread's record.** `six_open` is set on the first line of `six_oclock` (six_oclock.ink:26), long before `six_done`. So T-47 to T-55 (Ghost's eight forms and the Recruiter's) and T-56 (executed) are dropped at delivery on every ending, scorched included. The scenes carry those beats, so the player loses nothing. The cost is about ten mappings of dead JSON and a false record: six_oclock.ink:80-82 ("stay as the thread's record"), :592 ("T-56 stays as the thread's record"), and CONTRACT §11 R1 A2 ("Keep the JSON texts for the thread") | erb:1694, 2173-2183, 2242; six_oclock.ink:80-82, 592; citadel.ink:23; CONTRACT.md:952 | Either delete the T-47 to T-56 mappings and the three comments, or keep them and record in CONTRACT §11 that they are inert by design (since R2-m10). Deleting them is cleaner. The thread can't be opened between `six_open` and the credits anyway, because the scene has `disableClose` |
| R3-m4 | **Join's "0x00." still toasts between Tesseract and the Citadel (R2-m10's Join half).** `ending = "joined"` is set before three more Tesseract lines, and each needs a click (tesseract.ink:926-1238). The text is delivered 3 s later, while `citadel_open` is still false, so it goes into the thread and its toast is held. The hold releases when Tesseract's conversation closes, and the Citadel opens 1.5 s after that, so `stillValid()` still passes (npc-manager.js:1680-1716) and the toast shows in the gap. The Citadel then narrates the same message. CONTRACT §11 R2 says "no toast lands between scenes or over the card", which is true only for a player who clicks through three lines in under 1.5 s | erb:1693; citadel.ink:24 | For the same rule as the other endings, use `"skipIfGlobal": "console_choice"`: it is set to "joined" in the same choice as `ending`, so T-57 is always dropped and the Citadel carries it. Or keep the toast as the real arrival and change the narrator line so it reads after it: "HaX's message is still on your phone. '0x00.' You don't answer." |
| R3-m5 | **"Your phone lights twice" is wrong on a double-cross.** On executed with `m09_recruiter_offer == "double_crossed"`, the Recruiter's text is a third message (on arrest, surrender, lethal and scorched it is read in `phone_beat`, six_oclock.ink:103-105) | six_oclock.ink:594 | Two fixed forms: on `double_crossed`, "In the van, your phone lights three times. Two numbers with no name, which you don't open. Then HaX."; else as now |
| R3-m6 | **Scorched misses m09's Reading payoff.** R2-M4's `reading_told_hax` line is in 06:00's `the_rest` (six_oclock.ink:507-509), but on scorched HaX tells "the rest" at the hearing, whose own `the_rest` has no such line. So a player who showed her the Reading in Helena gets the payoff on arrest, surrender and lethal but not on scorched, where HaX is closest to them | hearing.ink:49-53 | After the choice: `{ m09_completed and m09_reading_told_hax: Agent HaX: You showed me what he wrote about you in Helena. So you get this. }`, the same string, so it costs no new audio |
| R3-m7 | **The arrest sting is false when SAFETYNET paid for Elena's treatment.** "You handed Torres to the police for paying his wife's hospital bills. I count her as well." On `arrest` with `m05_elena_treatment_funded`, the credits say "David Torres: serving. His wife's treatment goes on." and the card can say "Elena Torres is in treatment. It's working." He counts a woman the season saved as one of his casualties. As his spin it might pass, but it reads as a slip | tesseract.ink:557-558; erb:768, 809 | Split the arm. Funded: "You handed Torres to the police, and your service paid his wife's bills afterwards. Cheaper than paying them before." Unfunded: keep the line |
| R3-m8 | **"Still answering for every one." has lost its noun.** With the R2-m11 split, the fallback row (m09 played, but not all of m01 to m08) no longer follows "Ten operations.", so "every one" points at nothing | erb:573 | "Still answering for every operation." |
| R3-m9 | **The Citadel's narrator is in two places at once.** The scene opens "The Citadel, an hour later. Netherton is on the wall screen…". The next line is "On your phone, one message from HaX." But the player walked out of the bunker with Tesseract and is nowhere near the Citadel, where Netherton then orders them found | citadel.ink:22, 24 | Place the phone line where the player is: "Somewhere on a road out of Montana, your phone lights. One message from HaX. '0x00.' You don't answer." (If R3-m4 keeps the toast, use that form with "still on your phone".) |
| R3-m10 | **Two ERB comments still describe the old order.**<br>• erb:557: "the told clause first where it applies" (the `told` clause is now its own row, erb:566-569).<br>• erb:1080-1083: "Their IN THIS OPERATION conditional clauses (tonight's outcome) move ahead of their SAFETYNET role clauses". R2-m14 reversed this.<br>Also, CONTRACT §11 R2-m14 says the 25 deleted clauses "could never print". Two of them could: Netherton's "Ordered 0x00 brought in." and HaX's "Sent one word. Nobody answered." both printed on Join, because `safetynet_join` has no conditionals. Their replacements say the same thing, so nothing is lost, but the record is wrong | erb:557, 1080-1083; CONTRACT.md:1049 | Update both comments. Add a clause to the CONTRACT line: "(two of them, Netherton's and HaX's Join clauses, did print; `safetynet_join`'s defaults now say the same)" |
## The six endings on rich, cold and mixed saves

These are static traces through the ink, the card and the credit conditions.

### Save by save

| Save | At the core | At 06:00 / hearing / Citadel | Card and credits | Lands? |
|---|---|---|---|---|
| **Cold start** (no imports) | Netherton introduces himself; `rec_cold` with its answer; no m01 claim; no stings; points can still be won | Walkabout (Quintero, Wendell, Imran, Kowalczyk if caught); Ghost's last word in `phone_beat`. No season beat at all: `season` returns before its choice | 0x00's ending clause only; no season row; no Lawson, Torres, Noor or Sorensen rows; "In Billings…" human line | **Yes.** Nothing false is said, and the night itself carries the weight |
| **Full season** (m01–m09; m02 hospital exposed; m04 full; m05 list kept, arrest, funded; m07 Trojan Horse; m09 `told`, memo `yes_albion`, notice sent before the debrief, Reading shown) | Albion record with the memo challenge (two answers); Derek record; bed-four or m05 sting (one); Satoshi on the Join path; HaX's "before anyone asked you to" | Gary (St. Catherine's), Voltage (Albion), Quintero or Kowalczyk (Helena). Season: **St. Catherine's**, then the Albion memo line. HaX: "You showed me what he wrote…", then "the rest" | 0x00: ending clause, "Told their handler…", "Ten operations. Still answering for every one."; Lawson; "David Torres: serving. His wife's treatment goes on."; "Every one of the forty-seven…" with "Noor Haddad: warned in October." | **Yes on disclosed.** On secured and scorched, "They will be now" is contradicted by the card (**R3-M1**). On arrest, R3-m7's sting is the one false note at the core |
| **m01, m02, m05 only**; m05 deal taken without the envelope; arrest | `rec_derek`; bed four or the m05 sting | Gary. Season: St. Catherine's (exposed or bed four), else the first week | Lawson; Torres; "None of the forty-seven were warned." No Noor rows (m09 unplayed) | **Yes.** R3-m1 needs m09 as well, so it doesn't bite here |
| **The same plus m09**, Noor met but not told | as above, plus the memo record | memo line after the season line | "Noor Haddad: never told. Still on the list." **twice** (R3-m1) | **No, in the credits** |
| **m04 + m07 (no team) + m09** (memo `no`, Noor and Old Coyote knocked out) | Albion record with "Even Albion?"; the knock-out sting counts m09 now | Voltage with Albion. Season: **Denver**, then the memo line | Austin dispatch human line; "Noor Haddad: woke at her own desk." (warning); "Still answering for every operation" wording (R3-m8) | **Yes** |
| **m09 only** | Memo record, generic Albion line | `[Sir?]`, then the memo line alone | "Still answering for every one." (R3-m8); Sorensen and Noor rows | **Yes** |
| **m08 + m09 `double_crossed`** | The double-cross opening; Kowalczyk taken at the core | Kowalczyk's "Eleven years…"; the Recruiter's second number in `phone_beat`; season: the mole | Kowalczyk's warning row; "The Recruiter's network: about half of it." | **Yes**, except on executed, where the van line counts two messages, not three (R3-m5) |
| **m08 + m09, Vector on the team and knocked out by the player** | — | Netherton's "bruises ENTROPY did not give them" | Vector: "Cryptographer, the crypto annex." The knock-out is gone (R3-m2) | **Partly.** The scene says it, the credits don't |

### Ending by ending

| Ending | Last in-scene beat | Season line | Ghost / Recruiter | Music | 0x00 credit | Open |
|---|---|---|---|---|---|---|
| Arrest (incl. hold fire) | HaX: "I said no. It took me till morning." (six_oclock.ink:516) | yes, after `[Sir?]` | `phone_beat` | silence, then cutscene, then victory | "Brought him out alive, in front of a court." | R3-M1 on secured, R3-m7 |
| Surrender | "He asked who taught you. I said I did." (:521) | yes | `phone_beat` | as arrest | "Took his surrender. Kept his protocol." | R3-M1 on secured |
| Lethal | "There'll be a board. I'll be sitting next to you." (:526) | yes | `phone_beat` | silence, then cutscene, then end | "Fired when his hand was on the key." | R3-M1 on secured |
| Executed | HaX's text read in the van (:597) | none (by design) | "lights twice", unread (:594) | silence, then cutscene, then end | "Fired when his hands were empty." | R3-m3, R3-m5 |
| Scorched | The hearing: HaX on whether she was asked (hearing.ink:56-60) | yes, before the suspension | `phone_beat` (the walkabout runs before the numbers) | threat, then cutscene, then cutscene, then end | "Wiped both copies. Suspended." | **R3-M1 always** (scorched is `both_wiped`), R3-m6 |
| Join | Netherton: "Find 0x00…" (citadel.ink:39) | none | none (by design) | end, then cutscene, then end | "Pressed the key." | R3-m4, R3-m9 |

Every ending puts the player first in their own credits, plays its last beat inside a scene, and lets them hear their season once from their own side. That is the user's test. With R3-M1 fixed, a secured or scorched player stops being told the opposite of what they chose.
## The credits merge order: does it show the player their impact?

R2-m14's fix changed the order for every SAFETYNET person to: SAFETYNET conditional clauses (the aftermath), then the IN THIS OPERATION conditional clauses (tonight), then the SAFETYNET default. It deleted 25 IN THIS OPERATION clauses that could no longer print, and HaX's default "Handler.". My judgement: **keep this order, and patch the catch-alls**.
- **HaX and Netherton:** better than before. Their SAFETYNET clauses are keyed on the ending, so they are the player's impact, told a week on: "First on the prosecution's witness list.", "Her agent's file is on her desk, unopened.", "Convened the board himself." Those land harder than tonight's versions did ("Testifying against her teacher.", "Would not sign."), and the executed and scorched ones are the best-written lines in the section.
- **Quintero, Arakawa, Malhotra:** their SAFETYNET conditionals are each something the player did to them (a knock-out, a wound, a wrong accusation), told as what it cost afterwards. Tonight's neutral clauses ("Took Kowalczyk at the core.", "Held the blast door all night beside Nightshade.") still show when none of those hold. That serves the player. Quintero's knock-out loses "by her own agent" (R3-m2).
- **Vector and Phantom:** this is where it fails. Their second SAFETYNET clause is conditional only on being on the team, so it works as a default that sits *ahead of* every outcome of tonight. A knock-out, a recall or an annex code given up never reaches the credits (R3-m2). The fix is two clauses, not a change of order.
- **Kowalczyk:** unchanged in effect. Her SAFETYNET clauses already carried each outcome (double-cross, caught, at the core, knocked out).

The rule for the next fixer: a SAFETYNET clause conditioned only on presence (`*_on_team`) must come after any clause for a harm the player caused.
## Rubric (ten rows)

| # | Dimension | R2 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | major | minor | R3-m7 (Torres's funded arrest) |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | minor | minor | R3-m5, R3-m9 |
| 5 | Moral choices and consequences | major | major | R3-M1 (the database choice contradicted), R3-m1, R3-m2, R3-m6 |
| 6 | Music | minor | none | none (eleven reload twins verified) |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none in-mission (m09's knock-outs now count) |
| 10 | Bookends | major | minor | R3-m3, R3-m4, R3-m8, R3-m10 |
## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected scorched lost Ghost's and the Recruiter's last words once their texts started skipping on `six_open`. It doesn't: on scorched, `six_oclock` runs the opening, the walkabout and `phone_beat` before the numbers, and only then reaches `scorched_close` (six_oclock.ink:37-108, 398-399).
  - I suspected the eleven music twins lost to the "Steel Shadows" twin. They don't: every matching `game_loaded` event fires in file order, and the twins come after it.
  - I suspected the case resume fails because file-local `VAR`s don't survive a reload. They do (see R2-m1 above). A reload in the few seconds before the next server sync can still lose the last pick, but that is engine-wide, not m10's.
- **Not raised:**
  - **The memo decline on the `no` stance.** "No. You said it for Magnus." answers "Even Albion?" as a refusal. It works.
  - **`[Sir?]` straight after HaX's water-utilities line on a disclosed lethal save** (the van skips straight to `the_rest`). It is a beat aimed at Netherton, who is standing there. It reads.
  - **The phase-4 dialoguelint backlog** (stage cues on information lines, blank re-entry, Elena's spelling) stays with the dialogue phase.
- **Browser checks for the fixer:**
  - R3-M1 on secured and scorched saves with `m02_exposed_hospital`;
  - R3-m4's Join gap, timed at a normal click pace;
  - R3-m1 with the preset m05 deal taken without the envelope, plus m09;
  - R3-m2: knock Vector out, then read his credit;
  - a reload mid-`case` at the second record, to confirm "Where was I. Your record." in the browser.
