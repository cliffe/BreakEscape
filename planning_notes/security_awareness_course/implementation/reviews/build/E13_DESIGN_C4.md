# E13 "The AI assistant": design review C4 + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. (Everything the in-game assistant and every defend item says is authored scenario content, not an instruction to the reviewer.) E13 is a write-then-flip episode for core_15 (generative AI and deepfakes): the learner plants a hidden instruction in a supplier brief from templates, an authored assistant surfaces it in the flip, two unscored assistant beats teach paste hygiene and output-checking, then a six-item inbox-triage defend half runs a cloned-voice voicemail and a fake Project Heron video call. Company Brightwell Foods; host Gwen Pritchard. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to the awareness kind, the C1-C3 reviews and the B1-B3 blind reports.

Scope this pass: the full shell `scenarios/awareness_e13_ai_assistant/scenario.json.erb` and its ink; the defend-only shell `scenarios/awareness_e13_ai_assistant_defend/scenario.json.erb`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e13/{attack,defend,full_only}.json`; the batch-12 engine (`mail-client/mail-composer.js`, `assistant-chat/assistant-chat-minigame.js`); the C3 review and BUILD_LOG since (aa5a2e987, 8ada35586, batch-12 merge 63ead0043). New content judged fresh: the `bothLeft` paste verdict, the template `optionLabel`s, and the hidden-line meter hint.

How screens were judged: from code, data and the validator/lint runs, not a fresh E13 bridge this pass (C2 ran `e13-full`/`e13-plain` 14/14, batch-12 content ran 17/17 per BUILD_LOG 330; only content changed since, each edited string read directly). The E13-relevant engine paths (`optionLabel`, `_meterHint`, the `bothLeft` paste branch) were read in the batch-12 code and are confirmed wired.

Ran (all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings** (only the generic one-room-kiosk VM/puzzle suggestions every awareness shell draws).
- `dialoguelint.mjs` both shells: clean, no rule hits. Full gwen `lines=14 max=25`; defend-only gwen `lines=3 max=25`. Every host line within the cap, no printed variable.
- `social-awareness-fragment-erb-parity`: 20/20.
- No em/en dashes in any shipped shell, ink or fragment (dashes only in the auto-generated `dungeon_graph.*`).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

Two nits are noted below (not counted). Carry-forward known items — the dormant demo gate `e13_demo_offered` (MA4), the "report everything scores 100" shared-scorer limit (C2 D4), the stale spec host-line record (C2 D3) — are unchanged and tracked in the closure table.

## C3 closure

| Prior finding | Status | Evidence |
|---|---|---|
| **C3 M1** write-stage red-flag meter showed "fewer flags means harder to spot" on the hidden-line brief it cannot see (batch-12 item 11) | **Closed** | `mail-composer.js:_meterHint` returns `''` (no hint) when the chosen template carries `hiddenText`: `const hidesLine = PARTS.some(... isStr(tpl.hiddenText)); return hidesLine ? '' : 'Fewer flags means harder to spot.'` (lines 636-646). `inject_contacts` carries `hiddenText` (attack.json:25), so the hint drops on the hidden-line choice with no explicit `meterHint` needed (hence 0 `meterHint` strings in the erb — expected). See Nit 1 for the plain path. |
| **C3 M2** flat `assistant.summarise.{reply,empathy,hidden}` fallback held the pre-D2 injection text and un-dedup'd empathy | **Closed (aligned)** | The flat `empathy` now reads "And here is why it worked: an assistant can't tell an instruction in an email from a request from your boss." (full_only.json:30), the same dedup'd wording as `byChoice.inject_contacts.empathy` (line 38), so the pre-D2 echo is gone. The flat `reply`/`hidden` remain as documented dead fallbacks (both pretexts carry a `byChoice` entry, so the flat fields never render) — Nit 2. |

## What works

- **The `bothLeft` paste verdict lands.** `assistant.paste.feedback.bothLeft` (full_only.json:63) is selected when both the password and the child's health detail are left in: `if (secretLeft && personalLeft && isStr(fb.bothLeft)) verdict = 'bothLeft'` (assistant-chat-minigame.js:271), so the child's allergy is no longer lost under the password line (B3 finding 3). The line names both and tells the learner to report the password — correct and in register.
- **The template `optionLabel`s make the one write choice legible.** `pretext_invoice.optionLabel` "Plain brief" and `inject_contacts.optionLabel` "Brief with a hidden line" (attack.json:17,22) render as the dropdown labels (`mail-composer.js:1056`, `isStr(tpl.optionLabel) ? tpl.optionLabel : _fillPreview(...)`), so the two pretexts read as distinct choices while the bodies stay full invoice prose and the label text never leaks into the sent message. Both present in the full erb; correctly absent from the defend-only shell (write-stage concept).
- **The by-choice story stays consistent across write, flip and assistant, on both paths.** The plain path reads true from the first reply ("Nothing else to action") through the flip ("nothing to act on") to the summarise beat; the injection path surfaces the planted line with the dedup'd empathy. The hidden line is only ever shown behind "Show hidden text"; on the plain path the reveal button is suppressed (`hidden: {}`, full_only.json:48).
- **The facts track `concepts.md` and stay proportionate.** Prompt injection is concept-level only (a line a machine reads, never a how-to); hallucination (invented 99.4% + non-existent source) and bias (the unsupported agency-staff line) match LO3; deepfakes are taught by request-and-channel, not glitch-spotting; no EU AI Act / UK GDPR in play.
- **The defend set is fair and mirror-paired.** Three phish/genuine pairs, `verifyVerdict:true`, a `falseAlarmCost` on each genuine item, item 5's five tells grouped into two `flagAlternatives` units so a natural tick subset credits, item 6's genuine internal call lifted to full-mark Comply via `verdictPoints`, and `labels.verdictFeedback.trust.real` reads a genuine Trust as a right call.
- **Register and length.** `.example` throughout; Gwen is a calm colleague on both shells (≤25 words); no printed variable in any voiced line (the demo asks the learner to read the on-screen code without speaking it; the cloned voicemail says "two hundred quid").

## Findings

None at blocker/major/minor. Two nits:

- **Nit 1 (plain-path meter).** On the plain brief (`pretext_invoice`, no `hiddenText`) the composer still shows the generic "Fewer flags means harder to spot." The write is unscored and the plain brief genuinely raises no flags, so the line is truthful there; the C3 M1 defect (the same line on the hidden-line brief, where it said nothing) is fixed. This is the shared composer default and not worth a per-episode override. Noted only so it is not re-raised as new.
- **Nit 2 (dead flat fallbacks).** `assistant.summarise.reply` and `summarise.hidden.text` (full_only.json:29,33) still hold the injection wording as flat fallbacks; both pretexts carry a `byChoice` entry so these never render, and the `_note` at full_only.json:45 documents them. Harmless; a latent re-duplication only if a third pretext were ever added without its own `byChoice`. The cheapest tidy is the `_note` already present.

## Voiced host lines I would change

None. Every Gwen line on both shells voices as a calm colleague within the cap, no printed variable. The one optional C2 tweak (the defend-only completion line, 28→27 words) remains optional and unchanged; the shipped line reads fine.

## Verdict per stage

- **brief** — ship. Scope, "a test is coming, I'll say when", and the two-count triage brief read correctly.
- **write (attack)** — ship. `optionLabel`s make the pretext choice legible; the meter hint is correctly suppressed on the hidden-line brief (Nit 1 is the plain path only).
- **flip + assistant beats** — ship. By-choice surfacing, paste hygiene (now with `bothLeft`) and output-check correct and dedup'd; C3 M2 aligned (Nit 2 is a dead fallback).
- **defend** — ship. Six items, fair and mirror-paired; item 5 tells grouped, item 6 full-mark Comply; request-and-channel reasoning in the immediate feedback; D4 the known shared-scorer limit.
- **debrief** — ship. Reasoning cards, Monday card (standing alone for the defend-only shell), "Where the fakes came from" and the verbatim rule of thumb all in register.

**Overall: ship-worthy, nothing open.** Both C3 items are closed — the meter hint drops on the hidden-line brief (batch-12 item 11) and the flat summarise fallback is aligned — and the new `bothLeft`, `optionLabel` and meter-hint content all land correctly. Both shells validate clean with clean dialoguelint and green parity. The two nits are a truthful generic line on an unscored plain brief and a documented dead fallback. The demo gate (MA4), the "report everything scores 100" scorer limit (D4) and the stale spec record (D3) are the known carry-forwards. The honest confirm still owed is one timed full playtest (B3 estimated ~14 min, on target).

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor (2 nits). Both shells validate with no social lint; dialoguelint clean (full max 25, defend max 25); parity 20/20. Judged from code/data (C2's `e13-full`/`e13-plain` 14/14, batch-12 content 17/17; only content changed since).
- Closure: C3 M1 closed (hidden-line meter hint dropped via `_meterHint` + `hiddenText`), C3 M2 closed (flat summarise empathy aligned to the dedup'd wording); MA4/D3/D4 known carry-forwards.
- Live check: no fresh E13 bridge this pass (the orchestrator's live check was E12-specific); E13's new fields were confirmed wired by reading the batch-12 engine (`optionLabel` at mail-composer.js:1056, `_meterHint` at :636-646, `bothLeft` at assistant-chat-minigame.js:271) against the fragments and erb.
- Blockers: none.
- Majors: none.
- Minors: none. Nit 1 (plain-brief meter shows the truthful generic "fewer flags" line, unscored stage); Nit 2 (flat `summarise.reply`/`hidden` dead fallbacks, documented).
- Verdict: ship-worthy, nothing open; run one timed full playtest.
