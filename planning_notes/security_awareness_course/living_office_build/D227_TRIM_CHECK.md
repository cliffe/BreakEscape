# D227 pre-cut check: are we cutting the fun, the learning or the USP?

Date 2026-11-20. Design analysis only, nothing built. Checks the five cuts in D227 (A for every episode, B for ca12, A only for ca01) against the owner's note: do not cut the most fun or educational parts, and do not cut the attacker's-side view. Source: `timing_live/TRIM_OPTIONS.md` (scratchpad). Paths: `AW` = `planning_notes/phishing_and_social_engineering/awareness/`, `IT` = `public/break_escape/js/minigames/inbox-triage/`, `ER` = `public/break_escape/js/minigames/episode-runner/`.

## Summary

| Cut | Fun lost | Learning lost | Attacker view lost | Verdict |
|---|---|---|---|---|
| B1 drop `e12_call_fire_inspector` | The one "spot the mismatch" puzzle at the desk | The only paperwork-against-contract check | The only restricted-room target (the comms room and the network) | **KEEP**, cut other text of equal time |
| B2 drop `e12_call_locked_desk` | Little: a no-decision item | Little: its lesson is said three more times | None | **CUT** |
| A1 fold result screen into debrief | The band headline, unless moved | Per-skill rows (weakest skill stays) | None | **CUT WITH CHANGE** |
| A2 compact tell rows | None (less reading) | None: canonical lines are generic | None: every attacker detail is in the note | **CUT** (saving smaller than quoted) |
| A3 no tick sheet after Let in / Trust | Small | Genuine items: none. Phish: "noticed but let them in" | Small, the same lost case | **CUT WITH CHANGE** |

Revised ca12 estimate (doc method, section 6): with the fire inspector kept and the replacement cuts made, ca12 full comes to about **16.1** carry-on (18.4 and 19.7 on the look-up routes) and the twin to about **7.4**. The reception-door route stays about 1.2 min over the 18.5 ceiling, because the replacement uses the levers the doc's section 4.2 had set aside for that route. ca01 is unchanged by any KEEP.

## B1. ca12: drop the fire inspector (`AW/e12/defend.json:130-151`)

- **Fun.** It is the only item with something to work out. The "Today's list" line says maintenance is Thornfield Facilities and his paperwork says Redmarsh Fire Safety (`:137`). The learner gets to catch a liar by comparing two names, the most game-like moment on the desk. Every other risky visitor gives themselves away by behaviour.
- **Learning.** It is the only item where "check first" means checking documents against a supplier you already know (`:143`). That is the in-person version of the course's core habit from e1 ("ring the supplier on the number you already hold"). The courier's `not_expected` is only "no parcel booked" (`:168`).
- **Attacker view.** The only pretext of authority to enter a restricted room ("Annual check, I just need five minutes in your comms room", `:135`; "I can let myself in", `:136`), and the only item whose `ifTrusted` names the attacker's real prize: "alone in the comms room with the building's network" (`:146`). The courier shares the tells (`uniform_pretext`, `no_escort`, `secrecy_or_bypass`, `:161`) but only reaches the studio floor. The trim doc itself notes it is the only "authority to enter a restricted room" case.
- **Verdict: KEEP.** The ca12 erb matches the fragment (`scenarios/ca12_visitor_tailgater/scenario.json.erb:350-396`).
- **Replacement cut of about the same time** (repetition and reading load only, ca12 full and twin, data only):
  1. Debrief: drop the shared email habit line in a visitor episode, "When a message pressures you to move money..." (`scenario.json.erb:169-173`, about 50 words, 0.25 min). The Monday card already gives the visitor habits (`AW/e12/defend.json:250`). Caveat: the engine treats `ruleOfThumb` as one line for a whole deployment (`ER/debrief-view.js:618`), so this needs the owner's yes. The `habitLine` opt-in (`:620-624`) exists for episodes like this one.
  2. Drop the repeated "The points for this visitor also depend on the tells you named." from the Report and Check first verdict lines (`AW/e12/defend.json:74, :82`). It repeats on every risky visitor answered that way: about 0.15 min.
  3. Option C on restatement only: shorten `whyFine.default` on the expected client (`:127`, 38 words, which says the list and Yasmin twice) and the paired `reportReply` / `reportReplyByVerdict` lines, which say the same thing twice. Keep every note with attacker detail ("a name is not a booking", `:164`; "a wedge or a held door", `:109`). About 0.6 min.
  Together about 1.0 min against the inspector's 1.3.

## B2. ca12: drop the locked desk (`AW/e12/defend.json:209-222`)

- **Fun.** Low. Nothing happens ("Back in five, just locking this.", `:215`), the answer is "carry on", and the card needs a `kindTag` because "Let them in" reads oddly on it (`:210`).
- **Learning.** It is the genuine half of the unlocked-desk pair. Its lesson ("Locked before stepping away is exactly right", `:221`) is also in the Monday card (`:250`, Windows key and L) and, in the full shell, in Lorna's recap ("lock your screen whenever you step away", `ink/lorna_easton.ink:44`). The unlocked desk keeps the tell, and two genuine visitors remain (client, forgot badge), which meets the "at least 2 genuine" rule.
- **Attacker view.** None on this card. The attacker side of open screens sits on the unlocked desk (`:202`, `:204`) and in Camila's beat ("She was after one photo of an open screen", `lorna_easton.ink:41`).
- **Verdict: CUT.** Fixture `test_ca12_fallback` names the id (trim doc, Option B).

## A1. Fold the triage result screen into the debrief

- **What the result screen shows** (`IT/inbox-triage-minigame.js:1457-1530`): the band headline as its title (`:1467`), the score in large type (`:1472`), the counts, the per-skill "caught x of y" rows and the weakest skill.
- **What the debrief keeps** (`ER/debrief-view.js:451-536`, `:615`): "Round score: N%", the caught count and how, a card per miss, the weakest skill, the all-right line and the team thank-you.
- **Fun.** The debrief leaves out the band headline on purpose, because the result card already shows it (`ER/debrief-view.js:453-455`, F-E10-2). Fold the screen and "Well done: you spotted the risky visitors and knew why" (`AW/e12/defend.json:42`) disappears. That headline and the big number are the payoff.
- **Learning.** Only the per-skill rows go. The weakest-skill line, the one with a next step, stays.
- **Attacker view.** None on this screen.
- **Verdict: CUT WITH CHANGE.** When the round is folded, the debrief opens with the set's own band headline and the score in large type, in place of the doc's new "Round done: 4 of 4" line. That uses the authored `bands` in every episode and adds no new string. Cost about 10 words, so the 0.8 min saving holds.

## A2. Compact tell rows (`IT/inbox-triage-minigame.js:1271-1280`)

- **Does the canonical sentence carry attacker detail the note lacks?** No, in neither set. The canonical sentences are generic definitions ("Someone followed an authorised person through a secure door without badging in", `AW/e12/defend.json:114`; `systems/phish-rules.js` CANONICAL). Every specific detail is in the note: the held door (`:109`), the two firm names (`:143`), the `brightwel1foods` look-alike (`AW/e1/defend.json`, `e1_lookalike_bank`). The closest case is `unlocked_screen` ("open to anyone who walks up or sits down", `:207`), and its note says the same (`:202`).
- **The general rule is not lost.** The chip label states it, and the debrief miss cards still print the canonical sentence (`ER/debrief-view.js:228`).
- **Fun:** a little better. **Attacker view:** kept.
- **Verdict: CUT.** The saving is smaller than quoted, for two reasons:
  - Rows are one per tell unit, not per flag (`:1138-1145`), so a correct ca12 run shows 10 rows, not 14.
  - Shared tells with no set chip label (`borrowed_authority`, `secrecy_or_bypass`; in e1 `lookalike_domain`, `changed_bank_details`) use the canonical sentence as their label (`IT/triage-flags.js:211`), so those rows do not change. ca01 has no `flagChips`, and its `senderTrust` label is as long as the canonical line.
  - My count: about 0.35 min in ca12 (the doc says 0.6) and close to 0 in ca01 (the doc says 0.45).

## A3. No "What made you say that?" sheet after Let in / Trust

- **Genuine items.** The sheet teaches nothing that is not shown anyway. Each `whyFine` reason for a specific tell is printed in the "why this one was fine" list whatever was ticked (`IT/inbox-triage-minigame.js:1178-1190`). A tick only reframes it as "Not a flag here" (`:1154-1170`), and awareness scoring gives genuine items full tell points either way (`IT/triage-scoring.js:206`). The best case, e1 `e1_bank_confirmed` ("checked the safe way"), still shows. No loss.
- **Risky items: a gap in the doc.** The cut skips the sheet after every Trust, so the button gives nothing away, and that includes risky items. Awareness scoring still pays up to 40 tell points on a risky item that was let in (`triage-scoring.js:201-204`). The doc assumes such a learner ticks nothing, but nothing checks that. With no sheet, every row then reads "Missed:" (`:1144`), even for a learner who saw the tell and was talked past it. That case is the attacker's point: the pretext works on people who notice (`AW/e12/defend.json:238`, "getting caught by one is no lapse of sense").
- **Fun:** small loss. **Attacker view:** the "What would have happened" line still shows (`:1196-1200`).
- **Verdict: CUT WITH CHANGE.**
  - After a Trust with no sheet, label the rows "What gave them away:" (neutral), not "Missed:".
  - Add a scoring test that pins the score change: a trusted risky item now scores 0 tell points.
  - Keep check sets and `lab_social_engineering` ungated, as the doc says.

## 6. Revised time estimate (doc method: 200 wpm plus 10 s an interaction)

- **A with only the locked desk gone:** A1 0.8 + A2 0.6 + A3 0.67 (two genuine Trusts, 4 interactions) = about 2.1.
- **B with the locked desk alone:** 1.3. **Replacement cuts:** about 1.0.
- **ca12 full:** 20.5 - 2.1 - 1.3 - 1.0 = **16.1** carry-on; look-ups 22.8 to **18.4**, 24.1 to **19.7**.
- **ca12 twin:** 11.8 - 2.1 - 1.3 - 1.0 = **7.4**.
- **ca01 (A only):** the doc's 14.4.
- **If A2 really saves only my recount:** add 0.25 to every ca12 figure (16.35 carry-on, 7.65 twin) and 0.45 to ca01 (14.85). All stay under the 17 trigger, and the twin stays under 8.5.
- **Still open for the owner:** the reception-door look-up route (19.7) is over the 18.5 plan ceiling. The 4.2 levers are now spent on keeping the fire inspector. Closing that gap means cutting optional look-up lines in the attack half, or accepting the route as an optional long path.
