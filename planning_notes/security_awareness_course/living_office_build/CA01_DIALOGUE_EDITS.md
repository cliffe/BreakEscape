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
