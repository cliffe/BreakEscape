# E17 "Acceptable use": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language
model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review`
skills adapted to the awareness kind, the E8 pilot reviews for format and bar, and the prior pass
`E17_DESIGN_C1.md` with its "C1 outcomes". E17 is **defend-only by user decision**: one shell, no attack
half, no `mistake` stage, no flip; the one shell carries the whole episode (the "can I?" three-way sort
plus the scored six-item triage set).

Scope read end to end this pass: `scenarios/awareness_e17_acceptable_use_defend/{scenario.json.erb,
mission.json, ink/nilesh_solanki.ink}`; `planning_notes/phishing_and_social_engineering/awareness/e17/
{defend.json, full_only.json}`; E17's lines in `gen_e8_e17_shells.py` (host dicts and the `e17`
build entry); the spec `episodes/E17_acceptable_use.md`; and the module
`core_16_acceptable_use_and_your_responsibilities/concepts.md`. Dialogue was read across **every
learner-facing string**: host ink, `strings.brief`/`defendOnly`/`defendIntro`, `scopeNote`, the sort-drill
strings + 22 card situations/reasons + bin labels/hints, the triage brief + 6 items (bodies, perFlag/whyFine
feedback, ifTrusted, reportReply, falseAlarmCost), the two concept panels, the Monday card, the no-blame
line, `ruleOfThumb`, the conclusion screen and the kiosk observation text.

Ran this pass: `validate_scenario.rb --strict-social --no-graph --skip-ink` on the shell (schema passes,
exit 0; the only output is the 22 generic m01 template suggestions + 1 generic "no timedConversation"
recommendation, all irrelevant to an awareness episode; **no social errors or warnings**);
`dialoguelint.mjs scenarios/awareness_e17_acceptable_use_defend/` (ink: person lines=3, median 26, max 27,
no rule hits; timed texts 0). The brief's optional `E14_E17_PLAYTEST_P1.md` does **not** exist in
`reviews/build/`, so there are no playtest findings to fold in. **No bridge/screen run this pass:** the
engine judgements (concept panels and drill launch render, the Monday-card/report-route split, the sort
scoring) are read from the engine source and the shipped data, not from a rendered screen. I did not
re-simulate the sort scoring; C1 verified those numbers deterministically and nothing in the bank changed.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 2 | 0 | 1 |
| **Total** | **3** | **2** | **0** | **1** |

## C1 closure table

| C1 finding | Ruling / fix | Verified this pass | Status |
|---|---|---|---|
| **MI1** — "about 8 min" bar vs E17's designed 12-min budget | No change: 12 governs; files already agree | `durationTargetMin: 12` (shell :283), `estimated_duration_minutes: 12` + "about 12 minutes" (mission.json :3,:9) all consistent | **Closed** (accepted; still a design estimate, not a timed figure) |
| **MI2** — monitoring panel stated the strongest limit only by implication | Fixed: panel now states it explicitly | Shell :306 and `e17/defend.json` :126 both read "…the law sets limits that protect you: the content of your messages is looked at only in rare, serious cases, and you'd be told first. If monitoring worries you, ask the DPO." Byte-matched; faithfully renders `concepts.md` :75 ("exceptional circumstances, telling workers in advance") in plain English | **Closed** |
| **MI3** — spec §11a card-bank reasons stale vs shipped reasons | Fixed: spec table synced + dated note | Spec table now carries S03/S14/S20 "ask the service desk", S11 "first", S12 "ask your manager, then the service desk", S16 "proper access"; dated sync note present below the table; bin assignments and the seven locked answers unchanged; matches the shell/`full_only.json` card bank field for field | **Closed** |

All three C1 minors are genuinely closed. The MI2 wording is in both the fragment and the shell, so a
re-generation will not reintroduce the old text.

## What works (re-confirmed, plus this pass)

- **C1's structural findings hold.** Sort scoring teaches the intended habit (caution never zero, the real
  answer rewarded most, blanket-refuse scores worst); the seven locked cards (S04, S16, S17, S18, S19,
  S21, S22) carry `locked: true` and cannot be softened by a deployment override; the draw guarantees one
  Allowed, one Not allowed and one Ask first (`drawCount: 9`, `oneOfEachAnswer: true`, pool 22); the triage
  set is matched with the aw5 mirror pair (item 1 normal-looking phish / item 4 suspicious-looking
  genuine); the no-blame register is clean; facts track `concepts.md`.
- **The Monday card wiring is correct, not a conflict.** The shell carries both `strings.mondayCard` (the
  real acceptable-use "who to ask" card, rendered at `debrief-view.js:396`) and
  `debrief.mondayCard: "slot:customer_report_route"` (the shared engine constant `REPORT_ROUTE_SLOT`,
  `episode-model.js:741/785`, which only drives the generic "How to report here" box when no deployment
  route is configured). They are two different debrief elements; the slot name is a shared engine token
  used by every awareness shell, not a stray E17 label. No finding.
- **Authored content is dash-clean.** No em/en dashes in the shell, mission.json or the ink (grep clean).
- **Spec ↔ shipped parity re-checked.** The 22-card bank and the six triage items in the spec's "final
  JSON" block match the shipped shell and `full_only.json`/`defend.json` field for field.

## Design findings (C2)

**D1 — S07 ("new depot") is marked flatly Allowed with only the screens/badges caveat.**
Minor, episode-local. `scenario.json.erb:398-400` (= `full_only.json` S07).
The card is "Post a photo of the team's **new** depot on social media" → Allowed, reason "As long as no
screens, whiteboards or badges are in shot (core_12)." The screens/badges caveat is right, but the word
"new" quietly introduces a second question the reason doesn't address: a not-yet-announced site can be
commercially confidential, which is the other half of `concepts.md`'s social-media rule ("Don't post
confidential information … Don't speak for the organisation"). As written the card can teach "any workplace
photo is fine if no screens are in shot", which is not quite the lesson. Two clean fixes, either works:
old: `"situation": "Post a photo of the team's new depot on social media"` / `"reason": "As long as no screens, whiteboards or badges are in shot (core_12)."`
new (simplest): drop "new" → `"situation": "Post a photo of the team's depot on social media"` (keep reason).
new (if "new" is wanted): keep situation, `"reason": "Fine once the site is public, and no screens, whiteboards or badges are in shot (core_12)."`
Low priority; the card still has a defensible answer today.

**D2 — item 2 (`e17_data_lookup`) is tagged `secrecy_or_bypass`, but the message is an open favour with
nothing secret or bypass-y about it.** Minor, episode-local. `scenario.json.erb:139-149`.
Shauna openly asks you to look up a personal contact's mobile "in the system"; the real lesson is
need-to-know / misuse of your access (DPA 2018 s.170), which the per-flag note states well. The learner is
then asked to tick what they noticed, and the only chip that fits this item is "secrecy or bypass" — which
does not describe the message. There is no shared-library tell for "misuse of access / need to know", and
the design notes (`defend.json` `_localTell`, spec §11b) are explicit that promoting a new tell is not
warranted unless a `10` check item scores it, so this is a known cost of the local-tell economy rather than
a wiring error: the teaching is carried by the per-flag note, and the verdict/score are unaffected (Report
and Verify both score full under the `awareness` profile). Flagging so it is a conscious choice, not an
oversight. No change recommended unless the course later adds a need-to-know tell; if it does, item 2 is
the first candidate to re-tag. (Item 3, shared login, is a genuine `secrecy_or_bypass` and is fine.)

**D3 — the triage "awkward genuine" has no scoring bite; the "don't refuse everything" lesson rests on the
sort and the feedback lines.** Minor, needs-user (shared-property, re-raised from C1's note).
Under `scoringProfile: "awareness"`, reporting the two genuine items (monitoring notice, personal-use
reminder) still scores full, so at the number level the brief's "an awkward genuine so refusing everything
doesn't win" criterion is met pedagogically (mirror pair + `falseAlarmCost` lines), not mechanically. This
is shared across the whole built set (see E8 C2), and in E17 the "refusing everything loses" bite genuinely
does live in the **sort** (C1's verified refuse-all 33% / ask-all 61% / perfect 100%). Re-raising only so
the orchestrator settles once, set-wide, whether the awareness profile should ever cost a false alarm;
nothing E17-specific to change.

## Dialogue findings (C1), old → new

Dialogue is clean. Host ink lints in range (3 lines, max 27 words, no printed variables), reads like a calm
service-desk colleague, and the kiosk carries the drill and the inbox so the ink stays short. The brief,
scope note, sort strings, bin labels, triage brief, per-item feedback, concept panels, Monday card,
no-blame line and conclusion screen all read as plain UK English on first pass, and every template × fact
line in the two concept panels reads as English. One wording nit:

**DLG1 — host completion line: a "portal" is a form, it doesn't "answer".** Minor, needs-user (gen-script).
`ink/nilesh_solanki.ink:22` (generated from `gen_e8_e17_shells.py:263`; also the `_done` branch text).
The line says the **software portal** "usually answers the same day", but a portal is a request form; it is
the **service desk** that answers. `concepts.md` says "the service desk answers most requests the same day"
and separately "the software portal's request form", and the triage feedback is already consistent with
the module ("the service desk usually answers the same day", items 1/6). This is the only learner-facing
wording in E17 that drifts from the module, and "service desk" is also the smoother thing to voice.
old: "That's the lot, thanks. When you're not sure, ask first, the software portal usually answers the same day; and if you make a mistake, report it."
new: "That's the lot, thanks. When you're not sure, ask first, the service desk usually answers the same day; and if you make a mistake, report it."
Fixing it touches `gen_e8_e17_shells.py:263`, the compiled `nilesh_solanki.ink`/`.json` and the shell's ink
copy, all outside this review's read-only scope, hence needs-user. Low priority. (The welcome line "Nilesh,
service desk. Every rule here has a 'because'. Allowed, Not allowed, Ask first, and Ask first is never
wrong. Sort the cards, then a short inbox." is good as it stands.)

## Voiced host lines I'd change

Only DLG1 above: swap "the software portal usually answers the same day" → "the service desk usually
answers the same day" in Nilesh's completion line. Everything else Nilesh says is ready to voice.

## Notes (not findings)

- **`ruleOfThumb` is the shared phishing line, not E17's own habit.** The debrief's "The habit to keep"
  box carries the standard "When a message pressures you to move money, grant access, sign in or read back
  a code…" line — byte-identical across E8, E11, E15, E16, E19 and E17 (checked). It is a deliberate
  set-wide constant, so it is not an E17 outlier and not a finding; E17's actual signature habit ("Not
  sure? Ask first") is carried by the scope note, the Monday card, the bin hint and both host lines. If the
  course ever wants a per-episode habit line, acceptable use is the clearest candidate, but that is a
  set-wide product call, not an E17 fix.
- **"Haulier"** (triage brief, `:64`) is ordinary UK English for a logistics firm and reads fine for the
  audience; keep.
- **Not judged from a screen.** Concept-panel and drill-launch layout, address-font treatment and
  contrast were read from the engine, not a render. If certainty on layout/contrast is wanted, one eyeball
  of the drill + debrief on the keyless `:3001` bridge (`ONLY="e17-defend"`) would replace that; C1's build
  log recorded a 14/14 bridge pass after the MI2 fix.
- **Pre-ship web search still owed** (spec §20, carried from C1): the invented lure domains
  `harlow-freight.example`, `meetly-app.example`, `quickconvert-online.example` should be checked against
  real businesses before ship (BRAND_SET rule). Not done here; needs-user.

## Verdict per stage

- **Brief stage** — *Ship-worthy.* `strings.brief`/`scopeNote`/`defendIntro` are plain, in register, and
  frame the three answers and "ask first" clearly. Host welcome line is in range and well-voiced. No
  findings.
- **Defend stage (sort + triage)** — *Ship-worthy with two optional minors.* The sort and its scoring are
  sound and the locked cards are safe; D1 (S07 "new depot") and D2 (item 2 tell match) are small wording /
  tagging refinements, neither blocks ship. DLG1 (host completion line) lives here too and is a one-word
  module-consistency fix.
- **Debrief stage** — *Ship-worthy.* MI2 fix verified; both concept panels, the Monday card, the no-blame
  line and the conclusion screen are accurate and plain; the Monday-card / report-route wiring is correct.
  D3 is a set-wide scoring question, not a debrief defect.

**Overall: ship-worthy.** No blockers, no majors. All three C1 minors are closed and verified. The three
new minors are optional wording/tagging refinements (D1, D2, DLG1) and one re-raised set-wide scoring
question (D3). Recommend, if the budget allows, making the one-word DLG1 fix (service desk, not portal) at
the next gen-script regeneration, and completing the owed pre-ship domain search.
