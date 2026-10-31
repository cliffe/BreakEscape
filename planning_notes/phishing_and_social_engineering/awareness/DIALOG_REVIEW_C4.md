# Awareness dialogue review — formal cycle 4

Fresh reviewer, read-only (`npc-dialog-review` skill run in full). **No files changed, nothing
committed by me.** The working tree is mid-rebase on another session, so this review is based on the
commit **f459e86a6** state; for the awareness paths the working tree is byte-identical to that commit
except `HANDOVER.md` (one line: the hold-status note filled in), which is not reviewed content.

Scope: the 7 full episodes (`scenarios/awareness_e{1..7}_*/` ink + `scenario.json.erb`), the shared
fragments `awareness/e{1..7}/{attack,defend}.json`, and a sample of the generated defend-only shells
and pre/post check shells. Plus the two hand-over jobs: the data-round-8 **Item 5** audit (round-7
brief wording and the E1 count against engine round 5, commit `eb358d5d1`) and the **three round-8
judgement calls**.

Read first: `HANDOVER.md`, AGENTS.md ("Kinds of game…", "Iterating"), the skill, and the earlier
reviews `DIALOGUE_REVIEW_C3.md` + `DIALOG_LOG.md` (rounds 1–8). Closed C1–C3 items are not re-raised.

The course is an **education-first** security-awareness game (no spy framing, no VMs, no combat): the
bar is correct security advice, a warm non-blaming voice, plain UK English, and feedback that matches
what the learner actually did.

## Severity counts

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 1 |
| Minor | 1 |
| Trivial | 1 |

**Voiced-line impact: none.** Every finding and every suggested fix is on-screen panel text (triage
truth flags / notes, debrief no-blame line). Awareness has no TTS cache, so no fix carries a voice
cost.

## Phase 1 — compile / lint / validate (clean)

- **Compile:** all seven full-episode ink sets compile, `Failed: 0`. The only `-> END` warnings are the
  legitimate call hang-up (`leila_servicedesk.ink`) and the one-shot host conversations.
- **dialoguelint** across all seven full episodes: `Totals by rule: none`. No `line-len`, `choice-len`,
  `phone-self-prefix`, `not-x-but-y`, `exit-no-reply`, `blank-reentry`, `choice-fallthrough`,
  `tag-on-narrator`. Host lines sit at or under the 30-word cap; the E3 phone lines under the 15-word
  choice cap.
- **Validator** (`--strict-social --no-graph`) on all seven: exit 0. Only the pre-existing suggestions
  the logs already record as accepted — the generic m01 scaffolding prompts (VM launchers, PC files,
  patrols, lock-type variety) that do not apply to a kiosk training room, and the set-but-not-read
  globals `phish_*_landed` / `leila_reset_granted`. Nothing new.
- **Host ink** is four to five short lines per episode (kiosk host); the learner-facing body is the
  triage JSON and fragments, which is where the rest of this review looks. Hub/exit structure is the
  standard `hub_quiet` re-entry pattern with one unconditional sticky `+` exit; no starved knots.

## Hand-over Item 5 — round-7 brief wording and the E1 count vs engine round 5 (RESOLVED, clean)

Engine round 5 (`eb358d5d1`) changed the result screen: Finish pinned on the result; trusted / checked
(rung-back) / reported real items worded apart with capped title lists; **a reported real item now gets
full marks and a neutral thanks**; any trusted phish caps the band; the no-blame line shows only after a
wrong verdict (with a critical variant). Re-audited against round 7 (`98bba5e50`):

- **Brief wording holds.** Every full erb and both shell variants carry the round-7 line "Reporting [or
  checking | Ringing back] when you're unsure is always fine and never marked down, though a real one
  does take a colleague's time to check." (`never marked down` present once in each of the seven full
  erbs). This still agrees with round 5: a reported real item is **not marked down** (full verdict
  marks, neutral thanks), and the only cost named is the real-world colleague's time, which the result
  carries per-item via `truth.falseAlarmCost` (round 7, `1c8106fd1`). No contradiction.
- **No residue.** No "never costs you anything" string survives in any shell or fragment (only in the
  logs/playtest notes that describe the old wording). Confirmed by grep.
- **E1 count holds at six.** The E1 defend set is six messages (`e1_harlow_invoice`, `e1_lookalike_bank`,
  `e1_po_pennine`, `e1_pennine_bank_calm`, `e1_ceo_wire`, `e1_bank_confirmed`); the brief says "Six
  messages are waiting." (`scenarios/awareness_e1_invoice_fraud/scenario.json.erb:93`, fragment
  `e1/defend.json:19`). Round 5's "capped lists" cap only the genuine-feedback title list (3 names + "N
  more"); they do not touch the inbox total, so the "six" count is unaffected. Spot-checked E4 ("Five
  emails and voicemails" = 5 messages) and E7 ("Three voicemails and two emails" = 5) — both correct.

Item 5 needs no change.

## Round-8 judgement calls

### Call 1 — subjects bound to pretexts in E1/E2/E4/E7 as well as E5/E6 → **KEEP**

Each bound subject names a specific lure that is congruent only with its attack pretext, exactly as in
E5/E6:

- E1 `s_invoice` "Invoice INV-2217" → `[pretext_bank_change, pretext_bank_change_calm]` (off the benign
  monthly-statement pretext).
- E2 `s_application` "Application: Warehouse Operative (WHO-114)" → `[pretext_application]` (off the
  generic "introduce myself").
- E4 `s_payment` "Contractor invoice to settle" → `[ms_pretext_pay_now, ms_pretext_pay_calm]` (off the
  diary pretext).
- E7 `s_payment` "Urgent payment" → `[pretext_ceo_payment]` (off the month-end catch-up).

Binding stops the composer pairing an incongruent subject with a benign pretext (e.g. "Urgent payment"
on a friendly catch-up), which would teach a weak-phish shape. Every episode keeps one **unbound** generic
subject (`s_other` "Quick note" / "Quick one" / "Quick word"), so a valid subject is always available
whichever pretext is picked — no composer dead-end, and the "all subjects carry requiresTemplate"
warning does not fire. The reasoning that justifies E5/E6 applies identically to E1/E2/E4/E7. Keep.

### Call 2 — `borrowed_authority` on E4's pay-now pretext → **KEEP on the pretext, but the defend side is inconsistent (see C4-1)**

The flag is the right tell. `ms_pretext_pay_now` (`scenarios/awareness_e4_exec_whaling/scenario.json.erb:452`)
reads "Keep it between us for now, no need to trouble finance, and I'll square it with them when I land."
Invoking the managing partner's own sign-off to push a payment past finance is borrowed/misappropriated
authority — the **same move** E7 tags `borrowed_authority` ("'I'll sign it off when I'm back' and 'don't
put it through the usual approval' lean on his seniority to push it past the check",
`awareness_e7_voice_ceo/scenario.json.erb:240`). It is distinct from the co-located `secrecy_or_bypass`
("keep it between us"). Keep it on the pretext.

The problem is that the **defend** side of E4 does not carry it, so the attack build and the defender
disagree — the round-8 log's claim that "both episodes' defend-set truth already carries the matching
flags" is true for E7 but **not** for E4. This is C4-1 below.

### Call 3 — a critical no-blame line authored for E3 only → **KEEP**

Correct that only E3 needs one. The engine computes a critical miss for a trusted phish of kind
**push / call / email** (`CRITICAL_KINDS`, `triage-scoring.js`); a voicemail or a page is **not** a
critical kind. So every episode's reachable critical miss is an email, push or text — for which the
engine default `noBlameLineCritical` ("These messages are built to fool careful people…") fits — **except
E3**, whose defend set is a service-desk call set (plus one MFA push), where "messages" does not fit. E7
looks like a counter-example but is not: its critical path is the phish **email** `e7_ceo_wire`; the
cloned-voice voicemails are not a critical kind, so the default still fits. E3's channel-neutral line
("This was built to catch you under pressure…") is authored and has propagated correctly to the E3
defend shell (`awareness_e3_helpdesk_reset_defend/scenario.json.erb:288`). The pre/post check shells
are measurement-only (`missionConclusion` with a "result saved" conclusion screen, no debrief block),
so they never render a no-blame line and correctly need neither string. Keep E3-only.

---

## MAJOR

### C4-1 — E4 defend side omits `borrowed_authority`, so the course tells a learner who spots it "Not a flag here"

`borrowed_authority` is listed in E4's defend `channelTells`
(`scenarios/awareness_e4_exec_whaling/scenario.json.erb:105`), so the learner can tick it on any E4
message, and the attack-build pretext claims it (`:463`). But **no E4 defend message carries it**: the
two phish items that use the move list only `secrecy_or_bypass` (and `senderTrust` / `urgencyCalibrated`
/ `vish_callback_pressure`):

- `e4_boarding_payment` (`:141`, flags at `:160–164`) — "Keep it between us… don't send it through
  Yasmin… I'll sign it off when I land."
- `e4_vm_gate` (`:174`, flags at `:194–197`) — "Don't bother Yasmin with it, I'll square it with her
  myself."

Both are textbook borrowed authority — the identical construction E7 teaches as such. Because no E4
message authors the flag, a learner who correctly notices it and ticks "Borrowed authority" has it
rendered in the per-message review as **"Not a flag here: Borrowed authority. It wasn't one of this
message's tells."** (`inbox-triage-minigame.js:759–770`, reason falls back to the generic string
because phish messages have no `whyFine`). That directly contradicts E7 (`:173`, `:240`) and E4's own
attack-build side, and mis-teaches the one correct observation the whole episode is about.

Scoring is **not** affected (the awareness profile ignores false claims on a phish:
`flagPoints`, `triage-scoring.js:140`), so this is not a soft-lock — but for an education-first course
the teaching contradiction is the harm, which is why it is a major rather than a minor.

**Fix:** add `borrowed_authority` to the `truth.flags` of `e4_boarding_payment` and `e4_vm_gate`, each
with a `perFlagNote` mirroring E7's, e.g. on `e4_boarding_payment`: *"'I'll sign it off when I land'
leans on the managing partner's own authority to push the payment past Yasmin's approval. A name in the
From line is no proof she sent it."* and on `e4_vm_gate`: *"'I'll square it with her myself' uses the
partner's authority to wave the payment through without finance."* (Apply to the full erb and the E4
defend fragment; the check shells carry no per-message truth so are unaffected.) This also makes the
E4 defend side match its own attack-build pretext and E7's treatment of the same move. The weaker
alternative — dropping `borrowed_authority` from E4's pretext and `channelTells` — loses the E4/E7
parity and discards a tell that is genuinely present, so adding it to the two messages is the right
resolution.

---

## MINOR

### C4-2 — E1 and E3 reworded no-blame lines now end with an identical sentence

Round 8 reworded the E1–E4 no-blame lines (to stop them claiming "nobody is marked down" now that the
line shows only after a wrong verdict — a good change). Two of them now close on the **same** sentence:

- E1 (`scenarios/awareness_e1_invoice_fraud/scenario.json.erb:366`, fragment `e1/defend.json:940`):
  "…anyone working at pace can act on one. **A miss here just shows where to look next time.**"
- E3 (`scenarios/awareness_e3_helpdesk_reset/scenario.json.erb:368`, fragment `e3/defend.json:576`):
  "…is doing its job under pressure. **A miss here just shows where to look next time.**"

This is the same cross-episode verbatim repetition C2-1/C3-3 varied for the `noBlameLine`, `defendOnly`
and flip families. A learner who misses in both the finance (E1) and help-desk (E3) rounds reads the
identical closing sentence twice. The shared "where to look next time" motif is deliberate (it echoes
the critical default) and should stay, but not word-for-word.

**Fix:** give E3 a channel-specific tail that keeps the motif, e.g. "…is doing its job under pressure.
A miss here just points to the pressure of the call, and to where to look next." (full erb + E3 defend
fragment). Low frequency — only after a wrong verdict, across two sessions — hence minor.

---

## TRIVIAL

### C4-T1 — E3 critical no-blame line uses a mild "built to A, not to B" shape (optional)

`noBlameLineCritical` "This was built to catch you under pressure, **not to test how careful you are**."
(`awareness_e3_helpdesk_reset/scenario.json.erb:369`, fragment `e3/defend.json:577`) leans on the
negative-parallelism shape the house style watches for. It draws a real and useful contrast and reads
well, and the engine default it stands in for avoids the shape ("says more about the attack than about
you"). Optional: if aligning with the default, "This was built to catch you under pressure; the points
only show where to look next time." No change required.

---

## Confirmed closed in spot-checks (not re-raised)

- **C3-1 (E7 fragment drift to the retired voicemail-script design):** the shipped E7 defend shell
  carries only the email/inbox framing ("Three voicemails and two emails… ring back or report") — no
  "voicemail you scripted" / "you're the one listening" residue reaches a learner.
- **C3-2 / C3-3 (flip heading-echo and identical `flipLandedNoTells` opener):** E1 `flipMissed` now
  opens "The defence is the same either way…" (leading echo cut) and `flipLandedNoTells` is role-tinted
  ("It landed clean, with nothing in it to catch this time…"). Applied.
- **Round-8 Item 4 (E6 canteen `whyFine`):** the three reasons are genuinely distinct — expected QR from
  a known person asking nothing sensitive (`unexpected_qr`), the `forms.tarrowby.example` subdomain
  point (`lookalike_domain` only), and physical provenance / "only a menu rating" (`default`). Sound.

## Checks run

- `./scripts/compile-ink.sh` on all seven episodes: `Failed: 0`.
- `dialoguelint.mjs` on all seven: `Totals by rule: none`.
- `validate_scenario.rb --strict-social --no-graph` on all seven: exit 0, pre-existing suggestions only.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: **1810/1810 pass**
  (parity 7/7). Note: the test suite does not enforce per-message attack↔defend flag parity, which is
  why C4-1 passes the tests.

## Verdict

**Ship-ready bar one teaching fix.** Phase 1 is clean, the round-7 brief wording and all counts stand
against engine round 5 (Item 5 resolves with no change), and all three round-8 judgement calls are
sound to keep. The one substantive issue is C4-1: E4's defend side should carry `borrowed_authority` on
its two whaling items so it stops telling a correct learner they are wrong and so it matches both its
own attack-build pretext and E7. C4-2 (vary the E3 no-blame tail) and C4-T1 (optional) are polish. All
fixes are on-screen text with no voice cost.

## Notes for the fixer

- C4-1: full erb `awareness_e4_exec_whaling/scenario.json.erb` (add the flag + note to `e4_boarding_payment`
  `:160–164` and `e4_vm_gate` `:194–197`) **and** the E4 defend fragment, keeping fragment↔erb parity;
  then regenerate the E4 defend-only shell so its stored copy stays in sync. No generator for the full erb.
- C4-2: E3 full erb `:368` + fragment `e3/defend.json:576` (both sides, per the DIALOG_LOG convention).
- Nothing here is voiced; no TTS top-up.
</content>
</invoke>
