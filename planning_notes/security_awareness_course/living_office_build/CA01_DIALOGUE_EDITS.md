# ca01 dialogue edits (living office build)

Dialogue review and edit of the six new ca01 spoken lines plus the shared conceptPanel copy.
Input scan: `scratchpad/ca01_dialogue/SCAN_HAIKU.md` (25 findings). Each decided here.

## Decisions

Counts: **16 accepted, 8 changed, 1 rejected.**
("Accepted" = fixed along the lines the scan suggested; "Changed" = issue agreed, fixed with different wording; "Rejected" = left as is.)

| # | Disposition | Reason |
|---|---|---|
| F01 | Accepted | "flagging"/"Reporting" double removed; one verb now. |
| F02 | Changed | Slogan dropped, but the replacement is "Saved the whole floor a headache", not the scan's "Thanks for flagging that one". |
| F03 | Accepted | The two stubs no longer praise the same act the same way. |
| F04 | Accepted | "next time too" (blame) cut from Gwen's line. |
| F05 | Accepted | The call-back rule no longer sits in a stub; it stays in the host layer. |
| F06 | Accepted | Kept one of the two "no harm" clauses; the other is gone. |
| F07 | Accepted | kit_caught no longer repeats "before a single detail was saved"; it credits the catch instead. |
| F08 | Changed | Line 28 tightened (43 to ~29 words) with my own wording rather than the scan's draft. |
| F09 | Accepted | "That's the whole of it, honestly." cut. |
| F10 | Changed | Line 29 reworded, but the rule is kept there: lines 28-29 and line 34 fire on different globals and different re-talks, and in the panel 28-29 is the host teaching a learner actually reaches. |
| F11 | Accepted | "it never reaches the bank" replaced with a concrete referent, "the wrong account never sees a penny". |
| F12 | Accepted | Spaced hyphen used as a dash replaced with a full stop. |
| F13 | Accepted | Only one bark now mentions the bank chase (916, the fortnight); bark 1000 carries the unpaid-supplier beat instead. |
| F14 | Changed | Bark 1000 shortened, but rewritten around the supplier rather than the scan's draft. |
| F15 | Accepted | Bark 916 now reads as what the call did to this payment, not a tip. |
| F16 | Accepted | "it never moves" given a referent, "the money never moves". |
| F17 | Accepted | "redirected" appears once in the panel; the repeats are gone. |
| F18 | Accepted | The "redirected run landing" sentence (S4) cut. |
| F19 | Changed | Panel S2 tightened with my own wording; adds the attacker's next step (see F23). |
| F20 | Changed | Panel S3 tightened; "you just practised" kept so the rule ties to the learner's own move. |
| F21 | Rejected | Near-verbatim repeat across the two twins is deliberate: separate episodes, no learner sees both, and the single staff-cost figure has to read the same in each. Double maintenance accepted. |
| F22 | Changed | Panel para 2 first sentence rewritten shorter, with the fortnight cost (see F24). |
| F23 | Accepted | Added the attacker's next step after the redirect ("drawn out and moved on through other accounts within hours"); no money figure, per the build note. |
| F24 | Accepted | Staff-side cost made consistent: one figure, **a fortnight**, used in every layer that states a time cost. |
| F25 | Changed | Defend twin panel rewritten (57 to ~32 words), no attacker side by design; ICO sentence removed. |

### Beyond the scan

- **Required removal (both twins):** the sentence "Supplier bank details are not personal data, so a case like this is likely not reportable to the ICO." removed from `ca01_invoice_fraud/scenario.json.erb`, `test_ca01_panel/scenario.json.erb` and (via the defend.json fragment) `ca01_invoice_fraud_defend/scenario.json.erb`. Wrong for sole-trader suppliers and not needed.
- **Staff-time cost choice:** picked **a fortnight** (chasing the bank to recover a misdirected payment is realistically weeks, more concrete and memorable than "an afternoon", and it already lived in bark 916). Applied to both full-episode panels, the defend twin panel, bark 916, and the defend twin's host anecdote line 22 (which said "an afternoon"). The board-notice prop keeps its figure-free "being chased with the bank". Note: "the afternoon payment run" in the generators is time-of-day, left unchanged.
- **Defend twin host line 22 (not in the scan):** carried a conflicting "lost an afternoon". Changed to "a fortnight" for the single-cost rule.
- **stepAway (new, orchestrator request):** added `strings.stepAway` to `test_ca01_panel` so the step-away prompt stops showing the engine default ("about 20 seconds"); the ca01 look-up is a few seconds. Heading left at the engine default.

## Changed lines (before / after)

### Stubs

`scenarios/_office_kit/ink/agnieszka_duda_ambient.ink:12`
- before: `Agnieszka Duda: Nice work flagging that one. Reporting it helps the whole floor.`
- after: `Agnieszka Duda: Nice one, catching that. Saved the whole floor a headache.`

`scenarios/_office_kit/ink/gwen_pritchard_ambient.ink:12`
- before: `Gwen Pritchard: Good spot on that invoice. Phone the supplier next time too.`
- after: `Gwen Pritchard: Good spot on that invoice. That one would've sailed straight through.`

### Host ink (identical in `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28-29` and `scenarios/test_ca01_panel/ink/adaeze_okafor.ink:28-29`)

line 28
- before: `Adaeze Okafor: The moment you reported that one, we had the right account confirmed and the payment run went out clean. Our supplier got paid, and nobody chased a thing. {kit_caught: You flagged it before a single detail was saved, so there was nothing to unwind.}`
- after: `Adaeze Okafor: The moment you reported that one, we confirmed the right account and the run went out clean. Our supplier got paid, and nobody had to chase anything. {kit_caught: And that was you, spotting it before it went anywhere.}`

line 29
- before: `Adaeze Okafor: That's the whole of it, honestly. Ring the person back on a number you already hold before you change who gets paid, and it never reaches the bank.`
- after: `Adaeze Okafor: Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny.`

### Chain barks (`scenarios/test_ca01_panel/scenario.json.erb`)

:916 (Adaeze, host follow-up)
- before: `One call to confirm the details first, and it never moves. That beats a fortnight chasing the bank.`
- after: `One call to confirm the new details, and the money never moves. Beats a fortnight on the phone to the bank.`

:1000 (Agnieszka, arrival at board)
- before: `That's the one up on the board - a payment that landed in the wrong account. Finance are still clawing it back from the bank.`
- after: `That's the one up on the board. Money went to the wrong account, and the real supplier's still waiting to be paid.`

### conceptPanel, full episode (`scenarios/ca01_invoice_fraud/scenario.json.erb:380` and `scenarios/test_ca01_panel/scenario.json.erb:385`, identical except the full episode keeps a closing "have a word with Adaeze" sentence)

- before: `To a real attacker, the change you sent to the payments inbox is a redirected supplier payment. One believable email is enough to move a scheduled run to an account they control, and the money is passed on through other accounts within hours, long before the genuine supplier rings to ask where it is. What breaks that chain is the habit you just practised: a call back on a number you already hold before any change to a payee, so the new details are never saved. The notice on the payments board is that redirected run landing.\n\nWhen a change like this one is saved to the supplier file, the run pays the wrong account, and the finance team lose the afternoon to the bank and the real supplier while recent changes are re-checked. Supplier bank details are not personal data, so a case like this is likely not reportable to the ICO.` (full episode then adds: ` Before you leave, take a look around the office and have a word with Adaeze.`)
- after: `To a real attacker, the change you sent to the payments inbox is a supplier payment redirected to an account they control. One believable email is all it takes to move a scheduled run. Within hours the money is drawn out and moved on through other accounts, long before the real supplier rings to ask where their payment is. The call back you just practised, on a number you already hold before any change to a payee, is what breaks that chain: the new details never reach the file, and the run pays the right account.\n\nIf a change like this is saved instead, the run pays the wrong account, and finance spend the next fortnight chasing the bank and the real supplier to put it right.` (full episode then adds: ` Before you leave, take a look around the office and have a word with Adaeze.`)

### conceptPanel, defend twin (`planning_notes/phishing_and_social_engineering/awareness/e1/defend.json` -> `scenarios/ca01_invoice_fraud_defend/scenario.json.erb:321`)

- before: `When a change like the one here is saved to the supplier file, the run pays the wrong account, and the finance team lose the afternoon to the bank and the real supplier while recent changes are re-checked. Supplier bank details are not personal data, so a case like this is likely not reportable to the ICO.`
- after: `If a change like the one here is saved to the supplier file, the run pays the wrong account, and finance spend the next fortnight chasing the bank and the real supplier to put it right.`

### Defend twin host ink (`scenarios/ca01_invoice_fraud_defend/ink/adaeze_okafor.ink:22`)

- before: `Adaeze Okafor: That's the inbox sorted, thank you. We lost an afternoon to one of these once, a bank-change email we took at face value, so now we ring the supplier back on a number we already hold before any payee change.`
- after: `Adaeze Okafor: That's the inbox sorted, thank you. We got caught by one of these once, a bank-change email we took at face value, and spent a fortnight chasing the bank to get the money back. So now we ring the supplier back on a number we already hold before any payee change.`

### stepAway (new, `scenarios/test_ca01_panel/scenario.json.erb`, in `awarenessEpisode.strings`)

- before: engine default (`Look up from the kiosk to see how a case like this plays out here. It takes about 20 seconds, and your place is saved.`)
- after: `Look up from the kiosk to see how a case like this plays out here. It takes a few seconds, and your place is saved.`

## Out of scope / flagged

- `scenarios/_office_kit/ink/priya_nair_ambient.ink:14` and `scenarios/_office_kit/ink/sam_okoro_ambient.ink:13` carry the old Gwen stub text verbatim ("Good spot on that invoice. Phone the supplier next time too."). Not in the task's edit list, so left unchanged; flag for the orchestrator if those stubs can appear in ca01.
- The board-notice prop observation (`office_kits/brightwell_foods.json:70,86`, `test_ca01_panel/scenario.json.erb:1146`) says "being chased with the bank". Left as is; it is the read layer-1 text and a figure-free bank reference, consistent with the fortnight.

## Round 2 (review REVIEW_R2.md: 1 major, 5 minor, 3 nit)

Counts: **7 accepted, 1 rejected, 1 resolved by another fix.**

| # | Disposition | Reason |
|---|---|---|
| R2-1 (major) | Accepted | Bark 1000 said "That's the one on the board", which read as the player's own email and contradicted the host's "supplier got paid". Reframed as a different case, one that got through. |
| R2-2 | Accepted | Bark 916 dropped the "fortnight" figure; the cost is now stated once per sitting, in the panel. |
| R2-3 | Accepted | Defend twin host line 22 no longer states the figure ("took an age"), so the fortnight is said once in that sitting (the panel) and the host verb differs from "chasing the bank". |
| R2-4 | Accepted | Stubs now branch on kit_caught: praise only when caught (kit_caught is set at >=85%), a neutral on-topic line otherwise, so a low scorer is not congratulated. Node test extended to both branches (boolean asserts). |
| R2-5 | Accepted | Gwen's caught line now names "that bank-details email", the fraudulent message, not "that invoice" (the legitimate INV-2217). |
| R2-6 | Accepted | Panel sentence 4 split into two, the "on a number you already hold before any change" ambiguity removed, and the implied "run pays the right account" tail dropped. Edited in both full panels. |
| R2-7 (nit) | Accepted | Host kit_caught sub-clause reworded to avoid "you reported ... that was you" double credit. |
| R2-8 (nit) | Rejected | "never sees a penny" is a natural UK idiom and reads aloud fine; the known amount does not break it. |
| R2-9 (nit) | Resolved | Praise from three people resolves once the stubs gate on kit_caught (R2-4). |

No change to defend.json this round, so no twin regeneration.

### Changed lines R2 (before / after)

`scenarios/test_ca01_panel/scenario.json.erb` bark 1000
- before: `That's the one up on the board. Money went to the wrong account, and the real supplier's still waiting to be paid.`
- after: `That notice on the board is a different case, one that got through. Wrong account, and the supplier's still waiting to be paid.`

`scenarios/test_ca01_panel/scenario.json.erb` bark 916
- before: `One call to confirm the new details, and the money never moves. Beats a fortnight on the phone to the bank.`
- after: `One call to confirm the new details, and the money never moves. Saves a lot of phoning round afterwards.`

Panel sentence (both `scenarios/ca01_invoice_fraud/scenario.json.erb` and `scenarios/test_ca01_panel/scenario.json.erb`)
- before: `The call back you just practised, on a number you already hold before any change to a payee, is what breaks that chain: the new details never reach the file, and the run pays the right account.`
- after: `The call back you just practised is what breaks that chain. Ring a number you already hold before any change to a payee, and the new details never reach the file.`

Host kit_caught sub-clause (both `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28` and `scenarios/test_ca01_panel/ink/adaeze_okafor.ink:28`)
- before: `{kit_caught: And that was you, spotting it before it went anywhere.}`
- after: `{kit_caught: That was down to you, before it went anywhere.}`

Defend twin host ink (`scenarios/ca01_invoice_fraud_defend/ink/adaeze_okafor.ink:22`)
- before: `...a bank-change email we took at face value, and spent a fortnight chasing the bank to get the money back. So now we ring...`
- after: `...a bank-change email we took at face value, and it took an age to get the money back. So now we ring...`

Gwen stub (`scenarios/_office_kit/ink/gwen_pritchard_ambient.ink`, ca01 knot, now kit_caught-gated)
- caught: `Gwen Pritchard: Good spot on that bank-details email. That one would've sailed straight through.`
- not caught: `Gwen Pritchard: Heard you've been through the inbox. Some real traps in there lately.`

Agnieszka stub (`scenarios/_office_kit/ink/agnieszka_duda_ambient.ink`, ca01 knot, now kit_caught-gated)
- caught: `Agnieszka Duda: Nice one, catching that. Saved the whole floor a headache.`
- not caught: `Agnieszka Duda: Busy one on the payments inbox today. Those bank-change emails keep coming.`

## Round 3 (persona playtest findings, fallback + panel; 2026-11-19)

From the two persona reports (fallback Marcus runs 10358/10363, panel Dana run 10359). Six items; all
fixes land in both `scenarios/ca01_invoice_fraud` and `scenarios/test_ca01_panel` unless noted.

| # | Finding | Disposition |
|---|---|---|
| F1 (HIGH) | Host spoke the catch line after a miss (kit_caught false). | Fixed. The whole first host line now branches on `kit_caught`: a truthful, non-blaming miss line that states the cost in attacker terms. |
| F2 (HIGH) | Board notice ("went to the wrong account, being chased") contradicted the catch run; same text both runs. | Fixed. Notice is now an explicit EARLIER, separate case, true after both a catch and a miss, consistent with Agnieszka's "a different case, one that got through" bark. |
| F3 (MED) | Notice invisible (notes4 lying on the floor). | Fixed. Sprite/type → `notice_board1` (preloaded 42x31 corkboard), `wallMounted:true`, moved to the back wall. |
| F4 (MED) | Debrief cost passage gave no concrete money cost; identical both runs. | Fixed in scenario: the conceptPanel cost sentence now names £6,412.80 (the invoice in play) alongside the fortnight of staff time. conceptPanel cannot vary by outcome from the scenario (engine draws it unconditionally), so one passage, framed conditionally, reads true for both runs. |
| F4b / F5 | "Your reports and checks this round kept N phish away…" reads as praise on a miss. | Engine, not scenario: `public/break_escape/js/minigames/episode-runner/debrief-view.js:313-323` (`teamLine`). It counts only phish the learner actually reported/verified, so it is a true statement, not a false congratulation; the jarring the persona saw came from F1 and is resolved by fixing F1. The scenario-side `strings.teamLine` override is count-only (`{n}`/`{team}`), so it cannot be made catch/miss-aware without an engine change. Left for the orchestrator (no engine edit here). |
| F5b | "…have a word with Adaeze" (fallback conceptPanel only) read oddly next to the wrong miss line. | Resolved by F1; invite kept (Adaeze now has an honest miss line). |
| F8 (LOW) | Send banner "In real life a reply … would land in Derek Mason's own inbox, not yours" after "They acted on it". | Engine, not scenario: `public/break_escape/js/minigames/mail-client/mail-bridge.js:797` (and the "They acted on it" banner at `:616`). Correct teaching content; no scenario lever. Left for the orchestrator. |
| F6 (LOW) | Triple repetition of per-message feedback. | Engine (debrief recap + result screen in `debrief-view.js`), not scenario text. No scenario lever; left for the orchestrator. |

### Changed / new spoken lines R3 (before / after)

Host ink, line 28 block (identical in `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:27-33` and
`scenarios/test_ca01_panel/ink/adaeze_okafor.ink:27-33`). The whole first line now branches on `kit_caught`:
- caught (reworded from the old inline-`{kit_caught}` line, now the sole catch branch): `Adaeze Okafor: The moment you reported that one, we confirmed the right account and the run went out clean. Our supplier got paid, and nobody had to chase anything. That was down to you, before it went anywhere.`
- not caught (NEW): `Adaeze Okafor: That change went onto the supplier file, so the run paid the account from the email, not Harlow. It got picked up afterwards and the bank's been asked to recall it, but the money moved that same afternoon.`
- shared second line (unchanged, both outcomes): `Adaeze Okafor: Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny.`

Board notice observation (`kit_ca01_notice`, in `office_kits/brightwell_foods.json` set pieces
`ca01_recall_fallback`/`ca01_recall`, regenerated into `scenarios/ca01_invoice_fraud/scenario.json.erb`, and
hand-edited in `scenarios/test_ca01_panel/scenario.json.erb`):
- before: `A printed notice on the payments board: a supplier payment went to the wrong account and is being chased with the bank.`
- after (NEW): `A notice pinned to the payments board about an earlier case: a supplier redirect that got through here a few months back. The run paid an account that wasn't the supplier's, and finance are still clawing the money back from the bank.`

conceptPanel cost sentence (both full panels: `scenarios/ca01_invoice_fraud/scenario.json.erb` and
`scenarios/test_ca01_panel/scenario.json.erb`):
- before: `…the run pays the wrong account, and finance spend the next fortnight chasing the bank and the real supplier to put it right.`
- after: `…the run pays the wrong account — £6,412.80, on the invoice in play — and finance spend the next fortnight chasing the bank and the real supplier to put it right.`

No bark lines changed this round. Agnieszka's board bark (panel :1001) already read "a different case, one
that got through" (R2-1) and is now consistent with the rewritten notice.

### Notice sprite / position (F3)

`notice_board1` (preloaded 42x31 corkboard, as used by `test_needs_sims`/`office_life_showcase`),
`wallMounted:true`, `position {x:3.5, y:1.25}` on the back wall, just LEFT of the wide RANGE board (gid
1426, back-wall cols ~5-6), directly above Agnieszka's walk target `patrolOverride {4,3}` (kept). The back
wall of `room_aw_brightwell` is crowded (windows at cols 1 and 7, a small frame at col 3, RANGE at cols
5-6), so no 42px slot is fully clear; {3.5,1.25} clears RANGE and the windows but sits close to the col-3
frame. Exact tile and clearance are provisional pending the dressing pass and live proof 9 (noted in the kit
`_note`). No art generated.

### kit_caught timing (F1 verification)

`kit_defend_done` and `kit_caught` are both set on the same synchronous event
(`global_variable_changed:episode_e1_invoice_fraud_defend_complete`; panel `scenario.json.erb:876-885`,
the defend-percent `>= 85` gate on the second mapping). The learner cannot reach the host hub between the
two mappings firing, so there is no stale-`kit_caught` window: by the time the layer-2 branch is read, both
globals are resolved. The one residual risk is if `episode_e1_invoice_fraud_defend_percent` were written
strictly after the `_complete` event in some engine path (then a catch could read `kit_caught` false); the
live proof should confirm the catch run speaks the catch branch.

### Test added

`test/js/office-kit-quiet-and-stub.test.mjs`: "host layer-2: a catch reads as a catch, a miss reads as a
miss (not the catch line)" runs the real Adaeze ink through the conversation class on both `kit_caught`
branches and asserts the catch/miss lines differ and neither leaks into the other. Boolean asserts only.

## Round 4 (REVIEW_R3.md + the new `kit_fraud_caught` global; 2026-11-19)

Commit `161c39646` added a global, `kit_fraud_caught`: true when the learner reported, deleted or verified
the fraud email `e1_lookalike_bank`, false when they trusted or left it. It is set before `kit_caught`
(`kit_caught` is still percent >= 85). That gives the host three truthful outcomes and fixes R3 finding 1
(the miss line keyed on the score, not on the fraud's own verdict).

| R3 item | Disposition |
|---|---|
| 1 (MAJOR) | Fixed. Host now branches on `kit_fraud_caught` then `kit_caught`: catch / partial / miss. The miss line fires only when the fraud itself was trusted or left, so it is never spoken to a learner who actually caught it. |
| 2 (MINOR) | Fixed. Notice: "a few months back" -> "last spring" (a time marker that reads as an older, separate case, not in tension with the panel's fortnight for the current one); "are still clawing the money back" -> "spent weeks getting the money back" (past tense, "weeks" agrees with "fortnight", drops "clawing"). |
| 3 (MINOR) | Fixed. Bark at test_ca01_panel:1005 reworded so it no longer implies the learner's own case did not get through, is past tense, and ties to the notice's "last spring". |
| 4 (MINOR) | Addressed by 2. The notice loses "clawing"; "recall" (host) and "chasing the bank" (panel) kept as the real terms. |
| 5 (MINOR) | Fixed in the miss line: antecedent ("That bank-details email"), "the account it named" (no "from the email" stumble), active "We spotted it" (who dealt with it), and the attacker's gain in plain attacker terms with the figure. |
| 6 (MINOR) | Fixed in both panels: em-dash parenthesis -> "(£6,412.80 on this invoice)", "in play" jargon dropped, and "If a change like this is saved instead" -> "When a change like this is saved instead" (truer to both runs). |
| 7 (NIT) | Left. The "ring back" rule in bark 921, the host line and the panel is spaced reinforcement for an awareness exercise; changing bark 921 would also force a re-voice. Logged, not actioned. |
| 8 (NIT) | Left. The shared second host line ("the wrong account never sees a penny") is already voiced and reads as a general maxim, not a claim about this run; changing it forces a re-voice. Logged, not actioned. |
| 9 (NIT) | Notice sprite/position untouched (a separate dressing pass owns it, per the task). |

### Host ink, three-way branch (identical in `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink` and `scenarios/test_ca01_panel/ink/adaeze_okafor.ink`)

`VAR kit_fraud_caught = false` added. The first host line now branches `{ kit_fraud_caught: { kit_caught: ... } else: ... } else: ...`:
- **catch** (`kit_fraud_caught && kit_caught`, UNCHANGED from R3): `Adaeze Okafor: The moment you reported that one, we confirmed the right account and the run went out clean. Our supplier got paid, and nobody had to chase anything. That was down to you, before it went anywhere.`
- **partial** (`kit_fraud_caught && not kit_caught`, NEW): `Adaeze Okafor: You stopped the bank-change email, so Harlow got paid the right way. One of the others did get past us this round, though. The debrief lays out which one, so take a look before you go.`
- **miss** (`not kit_fraud_caught`, REWORDED from the R3 miss line, never voiced): `Adaeze Okafor: That bank-details email went onto the supplier file, so the run paid the account it named, not Harlow. We spotted it afterwards and asked the bank to recall it, but the money had gone out that same afternoon. The attacker had the whole run, £6,412.80, in an account they control.`
- **shared second line** (UNCHANGED, all three outcomes): `Adaeze Okafor: Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny.`

### Stubs now gate on `kit_fraud_caught`

`scenarios/_office_kit/ink/agnieszka_duda_ambient.ink` and `gwen_pritchard_ambient.ink`: `VAR kit_caught`
-> `VAR kit_fraud_caught`, and the ca01 knot's `{ kit_caught: }` -> `{ kit_fraud_caught: }`. The praise is
about catching the bank-details email specifically, so the fraud's own verdict is the right gate: a learner
who catches the fraud but over-reports (percent < 85) now gets the praise, which is true, instead of the
neutral line. **Stub text UNCHANGED** (gate variable only), so no re-voice.

`kit_fraud_caught` declared (declaration only, not the hand-authored chain) in the two test shells that also
load the stubs: `scenarios/test_ca_office_kit/scenario.json.erb` and
`scenarios/test_ca_office_kit_defend/scenario.json.erb`. Note: those shells' hand-authored chains set
`kit_caught` (not `kit_fraud_caught`), so their in-game praise demo no longer fires from the chain; the node
test injects `kit_fraud_caught` directly, so coverage is unaffected. Restoring the live demo would need a
`setGlobal kit_fraud_caught` in each chain, which this task was told not to add - flagged for the orchestrator.

### Notice / bark / panel (before / after)

Notice `kit_ca01_notice` (`office_kits/brightwell_foods.json` both set pieces `ca01_recall_fallback` /
`ca01_recall`; re-applied into `scenarios/ca01_invoice_fraud/scenario.json.erb` via
`apply_training_room.py --kit`, copied back; hand-edited in `scenarios/test_ca01_panel/scenario.json.erb`):
- before: `A notice pinned to the payments board about an earlier case: a supplier redirect that got through here a few months back. The run paid an account that wasn't the supplier's, and finance are still clawing the money back from the bank.`
- after: `A notice pinned to the payments board about an earlier case: a supplier redirect that got through last spring. The run paid an account that wasn't the supplier's, and finance spent weeks getting the money back from the bank.`

Bark test_ca01_panel:1005 (Agnieszka at the board):
- before: `That notice on the board is a different case, one that got through. Wrong account, and the supplier's still waiting to be paid.`
- after: `That notice on the board is an older one, a case from last spring. A redirect that went through, and the supplier was left waiting to be paid.`

conceptPanel cost sentence (both `scenarios/ca01_invoice_fraud/scenario.json.erb` and `scenarios/test_ca01_panel/scenario.json.erb`):
- before: `…If a change like this is saved instead, the run pays the wrong account — £6,412.80, on the invoice in play — and finance spend the next fortnight chasing the bank and the real supplier to put it right.`
- after: `…When a change like this is saved instead, the run pays the wrong account (£6,412.80 on this invoice), and finance spend the next fortnight chasing the bank and the real supplier to put it right.`

### Voicing (re-voice needs a yes via AC0)

New host lines to voice: the **partial** line and the **miss** line (both never voiced). Changed bark:
test_ca01_panel:1005. Unchanged/already-voiced and left alone: host catch line, host shared second line,
bark 921, both stub lines. Notice "observations" and the conceptPanel are read text, not TTS.

### Tests updated

`test/js/office-kit-quiet-and-stub.test.mjs`: the host test now covers three branches (catch / partial /
miss) and asserts no two outcomes share an opening line; the stub test injects `kit_fraud_caught` instead of
`kit_caught`; `openHost` base declares `kit_fraud_caught`. Boolean asserts only. 10/10 pass.

### Verification

inklecate 0 errors (4 inks); `validate_scenario.rb --strict-social --no-graph --skip-ink` 0 errors on
ca01_invoice_fraud, ca01_invoice_fraud_defend, test_ca01_panel, test_ca_office_kit; `python3 -m unittest
test_office_kit test_apply_training_room` 53 OK; `node --test office-kit-quiet-and-stub social-awareness-office-kit`
10 + 20 pass.

## Round 4 review fixes (orchestrator, from REVIEW_R4.md)

- MISS (major 1): "the whole run" dropped, since £6,412.80 is one invoice and not the whole batch. The details go onto the file, not the email. The figure is spoken as "just over six thousand four hundred pounds" because TTS reads "£6,412.80" unreliably; the printed panel keeps the exact figure.
- PARTIAL (major 2): "One of the others did get past us" was untrue for most scores under 85% (a deleted phish, or tells left unticked). Now: "A few of the others are worth a second look, and the debrief goes through them…".
- MISS closes on its own line ("…That one call is what stops this."). "Never sees a penny" now plays only after a catch or a partial.
- CATCH: "The moment you reported that one" is now "The moment that one was flagged", because delete and verify also count as caught.
- Not done: bark 1005's repeat ("an older one, a case from last spring") waits until the corkboard move commits, because it is in the same file. Bark 921's third statement of the rule is kept.

## Twin host line and kit greetings (2026-11-19, commit on b-ca-lo-build)

Scope: the defend-only twin's new host knot (`ca01_invoice_fraud_defend/ink/adaeze_okafor.ink`) and the two kit greetings.
Rules held: no reportability claims, nobody blamed, no debrief figure repeated, plain and short.

**Twin CATCH: edited.** "in the inbox" was redundant (the learner has just been in it). "That's the message these go wrong on" read awkwardly, so it is now "the one these usually go wrong on".
- before: You spotted that bank-change email in the inbox, so the run paid Harlow's real account, not the one the email asked for. That's the message these go wrong on, and you had it.
- after: You spotted that bank-change email, so the run paid Harlow's real account, not the one the email asked for. That's the one these usually go wrong on, and you had it.

**Twin MISS: edited.** The old line was conditional ("can go onto the file... then the run pays"), so it never said whether money went. In the twin, a miss means the change was accepted (delete and verify count as caught), so the line now says it did, passively, with the reason a busy afternoon gives. The debrief concept panel keeps the consequence (chasing the bank), so it is not repeated here.
- before: That bank-change email was the one to stop. On a busy afternoon a payee change can go onto the supplier file on trust, and then the run pays an account that was never Harlow's.
- after: That bank-change email was the one to stop. It went through, so the run paid an account that was never Harlow's. On a busy afternoon it's an easy one to wave through.
- The habit (ring back on a number you hold) is not named in MISS on purpose. The re-talk line says it ("we ring the supplier back on a number we already hold"), and the Monday card and rule of thumb carry it. Naming it here too would be the third statement.

**Gwen greeting: keep.** The room has both a coffee station (`kit_coffee`, "Staff drift over for a top-up") and a water cooler, so "Grab a coffee" matches an object. Her tea barks are a personal habit and don't clash. Flag, not changed: "Morning" while the twin brief says "this afternoon" and the barks include "Morning, all." The kit is shared, so it is left for the owner.

**Agnieszka greeting: keep.** The water cooler exists (`kit_cooler`, far wall); "over there" is a fair pointer.

Voicing: both host lines changed, so both need re-voicing (needs a yes via AC0). Greetings unchanged.
