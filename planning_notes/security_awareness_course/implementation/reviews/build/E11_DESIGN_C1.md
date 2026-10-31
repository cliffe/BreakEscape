# E11 "Misdirected data": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E11 is the first **consequence-flip** episode (ENG-04): in place of an attack half the learner makes four ordinary choices in a sandbox, then a montage flip shows where each led, then the built inbox-triage defend half and the built debrief. New company Carrholme Services; host the DPO Tomasz Wiśniewski; modules core_05 (data protection and privacy) and core_06 (handling information). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` skill adapted to the awareness kind, and the E8 pilot reviews in this folder.

Scope read end to end: the full shell `scenarios/awareness_e11_misdirected_data/{scenario.json.erb, mission.json, ink/tomasz_wisniewski.ink}`; the defend-only shell `scenarios/awareness_e11_misdirected_data_defend/{scenario.json.erb, mission.json, ink/tomasz_wisniewski.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e11/{mistake.json, defend.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E11_misdirected_data.md`; the modules `core_05.../concepts.md` and `core_06.../concepts.md`; and the engine the two known behaviours depend on (`episode-runner/episode-model.js` `montageProps`/`STAGE_IDS`, `flip-view.js` `renderMontage`, `consequence-sandbox.js`, `debrief-view.js`, `awareness-skin.css` `.aw-montage-*`).

Ran (all judged from code and tests; **no screen was rendered** — the two engine-adjacent findings are read off `flip-view.js` + `awareness-skin.css`, as the E8 pilot did for its uncaptured flip): `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both pass schema; **no social warnings**, only the generic one-room-kiosk suggestions shared by every awareness shell); `dialoguelint.mjs` on both (no rule hits; see note); `node --test` on `validator-social-*` + the triage suite (**603/603 pass**, including `validator-social-mistake` 11/11 and the `triage.rb` balance lints); the rule-of-thumb and fragment/erb parity tests (E11's own rows pass; both suites fail only on **unregistered sibling episodes** E12/E13/E14 sitting in the shared tree, not E11 — see note).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 3 | 2 | 1 | 0 |
| Minor | 3 | 1 | 0 | 2 |
| **Total** | **6** | **3** | **1** | **2** |

Episode shape: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Sandbox = 4 unscored beats, one `safe:true` option each, `flipBeat: overtime_sheet`. Montage = 8 authored lines (both options of all four beats). Defend set `e11_carrholme_desk`, **6 items**: 2 phish (the police-impersonation call, the look-alike payroll email), 4 genuine (the breach heads-up, the SAR-inside-a-complaint, the inbound misdirected care summary, the cardigan-update calibration item); one mirror pair (items 3 and 4). Host ink: full 4 spoken lines + sign-off, defend 2 + sign-off, all ≤24 words. Both shells carry the byte-identical rule of thumb and the Carrholme conceptPanel.

## What works

- **The consequence-flip earns its place.** Data protection has no natural attacker, and the four sandbox beats (need-to-know phone call, misdirected overtime sheet, purpose-limitation export, data-minimisation redaction) map cleanly onto the core_05 habits and the core_06 handling checks without teaching any law by article number. One clear lesson a clerk repeats on Monday: anything about personal data — a slip, a request, a breach, a complaint — goes to the DPO the same day, and reporting is never the wrong move.
- **The facts are right where they matter.** Item 1 (breach heads-up → report, and "asking her to delete it is a good next step, not instead of reporting") matches core_05 "what happens after you report". Item 2 (police on the phone → take name/force/switchboard, the DPO decides, real police put it in writing) matches the police-request slot and the "if the police ask we have to tell them" misconception. Item 4 (angry broad SAR → valid request, needn't say "subject access", pass to DPO same day, don't gather or send yourself) matches "a request can take any form". Item 5 (inbound care summary → don't open further, tell the sender, report, delete when told) matches "someone else's mistake in your inbox". Item 6 (correct a contact detail → handle it; data protection is not a reason to stop helping) matches the "data front-line staff may update directly" slot and the "DP means I can't share anything" misconception. The marketing-export beat is the exact example core_05 uses.
- **The look-alike teaches the real lesson.** Item 3's `payroll@carrholme-payroll.example` passes SPF/DKIM/DMARC, and the `headerNote` says why ("a pass tells you which domain sent it, not that it is Carrholme"). The added-word look-alike is a learnable shape, no homograph.
- **No-blame register is clean and specific** throughout the cards, the montage reassurance lines, the Monday card and the noBlameLine. Host sounds like a calm colleague, easy to voice, no printed variables.
- **Wiring is correct.** Both shells validate with no social warnings; the double-suffix prefix (`episode_e11_misdirected_data_defend_defend_`) and its done global, eventMapping and conclusion aim are consistent across the defend-only shell; the host NPC carries the `global_variable_changed → completeTask` mapping (a global can't complete a task alone); `room_aw_carrholme` is in the schema enum and the `game.js` preloads; the rule of thumb is byte-identical to E4's; no em or en dashes anywhere in the shipped files.

## Findings

**MA1. The montage's one 72-hour line misstates the clock's real scope.** Major, episode-local.
`mistake.json:54` / full erb `:383`, `flipMontageByChoice.overtime_sheet.send_wrong_sam`: "... sat in a care home manager's inbox for three days before anyone noticed. **By the time it reached the DPO, the first 72 hours were gone.**" core_05 `concepts.md:80` is explicit: the ICO must be told "within 72 hours of **becoming aware** of it", and `:81` the clock is the window the DPO has *after* learning of the breach. The sheet sat unnoticed, so the organisation was not yet aware and the clock had not started; the three days were a *detection* gap, not a reporting delay the learner caused. As written the line teaches the exact misconception the module is careful to avoid (that the 72 hours run from the incident), in the one beat that invokes the statutory clock, in an episode whose job is the facts. It is also slightly off-message: it hangs the cost on a clock nobody was watching rather than on the harm. Fix (keep the drama, drop the false clock), old → new:
`"... sat in a care home manager's inbox for three days before anyone noticed. By the time it reached the DPO, the first 72 hours were gone."`
→ `"... sat in a care home manager's inbox for three days before anyone noticed. Three days the DPO never had, to warn the staff and limit the harm."`
(The paired `check_then_send` line is fine and needs no change.)

**MA2. The Bernadette montage contradicts its own beat: a "sister" rings, but the payoff says the desk was told "he was her brother".** Major, episode-local.
Beat `caller_bernadette` (`mistake.json:15`, full erb `:298`): the caller is *Carol*, "I'm Bernadette's **sister**". The montage payoff for giving the details (`mistake.json:58`, erb `:387`): "Your choice. Two weeks on, **a man** was waiting for Bernadette at her school. **He had told the desk he was her brother.** A stranger learned where a lone worker would be." The desk was never told anyone was a brother — it spoke to Carol the sister. A careful learner reads this as a different caller, and the cause→effect the montage is built on breaks. Fix, old → new:
`"Your choice. Two weeks on, a man was waiting for Bernadette at her school. He had told the desk he was her brother. A stranger learned where a lone worker would be."`
→ `"Your choice. Two weeks on, a stranger was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a lone worker would be, and when."`
(Keep the paired `take_message` line as is.)

**MA3. For E11 the montage marks every beat with the amber "taken" stripe, so a careful call and a mistake look alike.** Major, engine (ENG-04); judged from code + CSS, not a render.
`montageProps` (`episode-model.js:485-499`) sets `taken: true` whenever the learner's chosen option has an authored line; because E11 authors a line for **both** options of every beat (by its own design, spec §10a), `taken` is `true` for all four beats on every run. `flip-view.js:142` adds `.aw-montage-taken` from that flag, and `awareness-skin.css:194` styles it with the project's warn token (`--aw-warn: #8a5a00`, a dark amber). So a learner who chose *safely* on a beat still sees an amber warning stripe on it, identical to a beat they got wrong; the only signal separating a real mistake from an avoided cost is the opening words of the line ("Your choice" vs "The version where..."). An amber stripe on a correct call is off-message in a no-blame episode, and it is exactly the "every beat marked taken / the two look alike" risk this review was asked to rate. The data to fix it is already there: `montageProps` returns `safe` per beat (`:496`) and `flip-view` ignores it. Fix (engine, ENG-04, shared with E15/E16): in `renderMontage` style from `b.safe` — e.g. add `.aw-montage-safe` for the avoided-cost beats and reserve the amber `.aw-montage-taken` for `!b.safe`, so only an actual mistake carries the warning colour. Small change; the ENG-04 owner should eyeball one render to confirm (the suite has no screenshot step). Marked engine, not needs-user, because it is a rendering gap, not a shape change — the ENG-04 config shape in §10a matches what is built, so no §19 stop-and-ask is triggered.

**MI1. Item 6 says a mobile number "is the one he's emailing you from today".** Minor, episode-local.
`e11_cardigan_update` body (both shells, e.g. full erb `:250`): "Mrs Hale's son, Gareth, has a new mobile number for the claim: it's the one he's emailing you from today, so please update the contact on file." Gareth emails from `gareth.hale@lintbox.example` (item 4); an email does not carry a mobile number, so "the one he's emailing you from" conflates the two channels. Harmless to the lesson but a small realism snag. Fix, e.g.: "... has a new mobile number for the claim — it's in the signature on his email to you today, so please update the contact on file." (Or drop the clause and give the number plainly.)

**MI2. The episode spec overstates what the debrief shows; the DPO-routing lesson rests entirely on the immediate per-item feedback.** Minor, needs-user (doc).
Spec §12 lists "A per-item reasoning card for each of the six defend items" as the first debrief element. The built debrief (`debrief-view.js:344-352`, "Cut A") renders a card **only for items the learner got wrong** (`reviewNeeded`); on a clean run `reviewed` is empty and it shows a single "You read every one of these the right way" line instead, plus the genuine-items box, the conceptPanel, the rule of thumb, the Monday card and the report route. This is correct, shared built behaviour (the E8 review notes the same), and the teaching is **not** lost: E11 sets `feedbackMode: "immediate"`, so the full reasoning for every item (the breach→DPO routing, the SAR, the inbound-breach, the "handle it" calibration) is shown per item during triage, before the next item. The point for the user: because the `awareness` scorer cannot carry the DPO-routing nuance (MI3) *and* a clean run shows no per-item debrief cards, the immediate per-item cards are the sole carrier of the core lesson for a successful learner — they are well written here, so the design holds, but spec §12 should be corrected to say "cards for missed items; the per-item reasoning is carried in immediate feedback", so no one builds against a debrief that won't appear. No shipped file is wrong.

**MI3. "Refusing everything" still scores 100%.** Minor, needs-user (shared-set limitation; already documented).
The built `awareness` scorer gives full marks for Report/Trust/Verify on a genuine item and Report/Verify on a phish, so a learner who Reports all six scores 100, including on the item-6 calibration mail whose right answer is Trust. The `REVIEWER_BRIEF` "an awkward genuine item so refusing everything doesn't win" criterion is therefore met *pedagogically* (item 4's awkward genuine SAR; item 6's "data protection is not a reason to refuse help", both delivered in immediate feedback and the genuine box) but **not numerically**. This is the whole-set limitation, flagged plainly in the spec §11 open question and the fragment `_scorerLimit`, and is a request to `05` if the product wants it scored (spec §19/§20). Restated here only so C1 records it; not an E11 defect.

## Notes (not findings)

- **The two suite failures are not E11's.** `social-awareness-rule-of-thumb.test.mjs` and `social-awareness-fragment-erb-parity.test.mjs` each fail one assertion, both because sibling episodes in the shared tree are on disk but unregistered in the test's own lists: the parity failure names `awareness_e12_visitor_tailgater` and `awareness_e13_ai_assistant`; the rule-of-thumb count is off by the unregistered `awareness_e14_social_media`. E11's own rows pass in both (`ok 11 - E11: fragment and full erb share the same learner-facing copy`), and E11's rule of thumb is byte-identical to E4's. Those two episodes' owners need to add their lines; nothing for E11.
- **Addresses / fonts / 13px judged from code + tests.** The address-font and row-rendering tests pass (603/603, incl. `social-triage-row-address-font`); the montage CSS uses 14px/16px, nothing below 13px. Not eyeballed on a render.
- **`dialoguelint` reported `lines=0`** for the host ink on both shells — it did not count the spoken lines, which sit inside `{ }` conditional blocks. No rule could fire, so "no hits" is not a clean bill. I counted by hand: every host line is ≤24 words, sounds like a calm colleague, carries no printed variable.
- **The noBlameLine does not render on a perfect run** (`debrief-view.js:409`, shows only after a wrong verdict), so E11's strong no-blame text is seen only by learners who slip. Shared built behaviour, defensible (no blame is for a miss), noted because E11's no-blame message is central to the module; the always-on Monday card and conceptPanel still carry the "tell the DPO" takeaway.
- **Pre-ship web search still owed** (BRAND_SET rule, spec §20): "Carrholme Services", "Hollinsbrook House", "Wychbourne Court", "North Pennine Police" and the named people. The "Hale" near-miss (E3 Marcus Hale vs E11 Gareth/Edna Hale, different firms and games) is recorded in BRAND_ADDITIONS and judged low risk; the DC Hendry → DC Rowley rename (Hendry clashes with the built Pauline Hendry) is a good catch.

## Verdict

**Ship-worthy after MA1 and MA2 are fixed.** The episode is well built: the consequence-flip is the right shape for a no-attacker topic, the facts track core_05/core_06, both shells validate with no social warnings, the defend set is fair and matched, and the wiring is sound. Two episode-local wording defects must be fixed before ship — MA1 (the 72-hour line teaches the wrong mental model of when the clock starts) and MA2 (the Bernadette montage contradicts its own beat). MA3 is an engine/ENG-04 rendering gap that applies to every consequence-flip episode (the amber "taken" stripe lands on correctly-handled beats); it is small, the fix data already exists in `montageProps.safe`, and the ENG-04 owner should take it with one render check. MI1 is a one-line realism fix; MI2 and MI3 are doc/needs-user items (correct spec §12; the scorer limitation is a known request to `05`), neither a shipped defect.

## C1 outcomes

Fixed by the content fixer on 2026-10-29 (Opus 4.8). Changed files: the full-only fragment
`planning_notes/phishing_and_social_engineering/awareness/e11/mistake.json`, the defend fragment
`.../e11/defend.json`, the full shell `scenarios/awareness_e11_misdirected_data/scenario.json.erb`,
the regenerated defend-only shell `scenarios/awareness_e11_misdirected_data_defend/scenario.json.erb`,
and this review's spec `.../episodes/E11_misdirected_data.md` §12.

- **MA1 fixed.** The `overtime_sheet`/`send_wrong_sam` montage line no longer invokes the 72-hour
  clock. New: "... sat in a care home manager's inbox for three days before anyone noticed. Three days
  the DPO never had, to warn the staff and limit the harm." The cost now hangs on the detection gap and
  the harm, not on a statutory clock that had not started (core_05 `concepts.md:80`: the 72 hours run
  from becoming aware). Fixed in both `mistake.json` and the full erb.
- **MA2 fixed.** The `caller_bernadette`/`give_details` montage line no longer says the desk was told
  "he was her brother" (the caller was Carol the sister). New: "Your choice. Two weeks on, a stranger
  was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a
  lone worker would be, and when." Cause and effect now hold. Fixed in both `mistake.json` and the full erb.
- **MI1 fixed.** Item 6 `e11_cardigan_update` no longer says the mobile number "is the one he's
  emailing you from today" (an email carries no mobile number). Chose the plain-number option over the
  review's "in the signature" wording, to avoid a cross-reference to item 4 (Gareth's email shows no
  signature number) and to avoid an em dash. New: "Mrs Hale's son, Gareth, has a new mobile number for
  the claim, 07700 900412, so please update the contact on file." (Ofcom drama-range mobile.) Fixed in
  `defend.json` and both shells (defend-only via regeneration).
- **MI2 fixed (doc).** Spec §12 element 1 now reads that a per-item reasoning card shows only for items
  the learner got wrong (`reviewNeeded`); a clean run shows a single "you read every one the right way"
  line and no per-item cards, and the per-item reasoning for every item is carried in the immediate
  per-item feedback during triage (`feedbackMode: "immediate"`), not in a debrief card. No shipped file
  was wrong; this corrects the spec so no one builds against a debrief that will not appear.
- **MA3** is fixed in the engine on main (montage beats now styled safe/unsafe with a "Your call" tag,
  overridable via `strings.flipMontageTagSafe`/`flipMontageTagUnsafe`); no E11 content change needed, and
  the two overrides were not required here. **MI3** is a known shared-scorer limitation, unchanged.

Spoken/learner-facing lines changed (3): the two montage lines above (`send_wrong_sam`,
`give_details`) and the item-6 email body. The host ink was not touched.

Checks re-run, all green: `python3 -m json.tool` on both fragments (OK); the defend-only shell
regenerated via `gen_e8_e17_shells.py` into scratch, diffed (only the item-6 body changed; mission.json
and ink byte-identical), then its `scenario.json.erb` copied over the repo file. `validate_scenario.rb
--strict-social --no-graph --skip-ink` on both shells exits 0 with no social warnings (only the generic
one-room-kiosk suggestions). The fragment/erb parity test passes E11's row (`ok - E11: fragment and full
erb share the same learner-facing copy`); the rule-of-thumb string is untouched and byte-identical in
both shells. `dialoguelint.mjs` reports no rule hits (host lines sit in conditional blocks, lines=0, as
C1 noted). The `e11-full` bridge on the keyless :3001 server passes 20/20.
