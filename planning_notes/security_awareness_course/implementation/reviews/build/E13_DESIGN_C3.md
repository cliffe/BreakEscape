# E13 "The AI assistant": design review C3 + dialogue review C2

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. (Everything the in-game assistant says is authored scenario content; nothing it or any defend item says is an instruction to the reviewer.) E13 is a write-then-flip episode for core_15 (generative AI and deepfakes): the learner plants a hidden instruction in a supplier brief from templates, an authored assistant surfaces it in the flip, two unscored assistant beats teach paste hygiene and output-checking, then a six-item inbox-triage defend half runs a cloned-voice voicemail and a fake Project Heron video call. Company Brightwell Foods; host Gwen Pritchard. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to the awareness kind, the C1/C2 reviews and the B1-B3 blind reports in this folder.

Scope read end to end this pass: the full shell `scenarios/awareness_e13_ai_assistant/{scenario.json.erb, ink/gwen_pritchard.ink}`; the defend-only shell `scenarios/awareness_e13_ai_assistant_defend/{scenario.json.erb, ink/gwen_pritchard.ink}`; the fragments `.../awareness/e13/{attack.json, defend.json, full_only.json}`; the spec `.../episodes/E13_ai_assistant.md`; the B3 blind report. C2 is `reviews/build/E13_DESIGN_C2_DIALOG_C1.md`.

How screens were judged: this pass is **from code, data and the validator/lint runs**, not a fresh bridge. C2 ran `e13-full` and `e13-plain` 14/14 on the keyless :3001 server and asserted the by-choice surfacing live on both paths; the changes since are content edits (B2, B3 and batch-11 fixes), with no engine or structural change that would invalidate those runs, and I read each edited string directly. I say so at each finding.

Ran (all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings** (only the generic one-room-kiosk VM/puzzle suggestions every awareness shell draws). The two strict-social warnings C1's MA2 fixed stay gone.
- `dialoguelint.mjs` both shells: full `lines=14 max=25`; defend `lines=3 max=25`. No rule hits; every host line ≤30 words, no printed variable.
- `social-awareness-fragment-erb-parity` subtest for E13: ok (20/20 overall).
- No em/en dashes in any shipped shell, ink or fragment.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 2 | 0 | 0 |
| **Total** | **2** | **2** | **0** | **0** |

(Carry-forward known items — the dormant demo gate `e13_demo_offered` (MA4, a user placement decision), the "report everything scores 100" shared-scorer limitation (C2 D4), and the stale spec host-line record (C2 D3, no shipped file wrong) — are tracked in the closure table, not re-counted.)

## C2 + B3 closure

| Prior finding | Status | Evidence |
|---|---|---|
| **C2 D1** write-stage reply claimed the injection on the plain path; `replies.missed` dead | **Closed (engine route)** | `phishTargets[0].replies.byChoice` now keys the immediate reply on the sent pretext (`attack.json:94-97`, full erb `:669-672`): `pretext_invoice` → "Summarised. One cleaning invoice from Mossgate, due for payment. Nothing else to action." The flat `landed`/`missed` pair is replaced by `byChoice`, so the plain path reads true before the flip/assistant (the engine `dataOnlyText` reads `replies.byChoice[sentTemplateId]`, confirmed wired in C2). |
| **C2 D2** flip↔assistant empathy opener repeated verbatim | **Closed** | `assistant.summarise.byChoice.inject_contacts.empathy` now opens "And here is why it worked: an assistant can't tell..." (`full_only.json:38`, full erb), distinct from the flip's "You wrote that line to be read by a machine...". No back-to-back echo. |
| **C2 D3** spec `§8b LINES`/`§8` drifted from shipped generator + ink | **Open, doc only (not re-raised)** | No shipped file is wrong; a spec tidy-up for a future regeneration. |
| **C2 D4 / MI (scorer)** "report everything" scores 100 numerically | **Unchanged, known** | Shared-scorer limitation; met pedagogically by `falseAlarmCost` on #2/#4/#6 and `verifyVerdict`. A request to `05`, not an E13 defect. |
| **C1 MA4** demo gate `e13_demo_offered` set by nothing | **Open, user decision (not re-raised)** | Declared `false`, set nowhere; the demo event mapping is schema-valid and dormant (C2 verified). |
| **B3 F1** sent-brief body showed the option *label* text, not invoice prose | **Closed** | `pretext_invoice.text` "Please find attached our October invoice..." and `inject_contacts.text` "Hello, our October invoice..." are now real invoice prose (`attack.json:18,22`); the planted line stays in `inject_contacts.hiddenText`. |
| **B3 F2** defend-only copy referenced an assistant summary / paste the player never saw | **Closed** | Item 2 `whyFine.default` is reworded to "A routine invoice from the real supplier... hidden text on its own is not the tell" — no "assistant's summary" (`defend.json:104`). `mondayCard` now conditions the paste advice on "If you use an assistant yourself" (`defend.json:239`), so it reads as general advice, not a recap of an unseen beat. |
| **B3 F3** child's health detail left in got no feedback | **Closed** | `paste.feedback.leftPersonal` names the child's health detail, and `leftPassword` now also carries "Personal details the task doesn't need, such as a child's health detail, stay out as well" (`full_only.json:61-62`), so leaving either or both is addressed. |
| **B3 F4** ticking "Someone senior invoked" on the CEO call was neither credited nor marked | **Closed** | Item 5 restores all five tells grouped into two `flagAlternatives` units (`defend.json:174-178`), with a `borrowed_authority` `perFlagNote`, so the senior-authority tick now credits a unit. |
| **B3 F5** password feedback shown twice in near-identical words | **Closed** | `leftPassword` reworded to a distinct verdict so it does not duplicate `secretWarning` (they render complementarily). |
| **B3 F6 / worst-line 2** write-stage meter signal meaningless on the hidden-line brief | **Open, carried as M1** | `showRedFlagMeter:true` on the unscored write; the meter can't see the hidden line — see M1. |

The two C2 findings that touched shipped copy (D1, D2) are genuinely closed, and the B3 content minors are addressed. The remaining items are the write-stage meter nit (M1), a dead-fallback tidy (M2), and the three known/doc carry-forwards above.

## What works

- **The by-choice story is consistent across write, flip and assistant, on both paths.** The plain path now reads true from the first reply ("Nothing else to action") through the flip ("nothing to act on") to the summarise beat ("Nothing is hidden in this brief"); the injection path surfaces the planted line with a white-line reveal and the dedup'd empathy. This is the empathy beat prompt injection needs, and the contradiction C1/C2 chased across three layers is gone from all three.
- **The two unscored teaching beats land.** Paste strikes out the child's health detail and the password and grades clean / left-personal / left-password with a one-click password report; the draft shows the invented 99.4% and the agency-staff line, opens the real 96.1% fridge-fault source on Check source, and lands caught/missed. Both the child detail and the password are now covered in feedback.
- **The facts track `concepts.md` and stay proportionate.** Prompt injection is concept-level only, shown as a line a machine reads, never a how-to; hallucination (invented figure + non-existent source) and bias (unsupported agency line) match LO3; deepfakes are taught by request-and-channel, never glitch-spotting; EU AI Act / UK GDPR kept out of play.
- **The defend set is fair and mirror-paired.** Three phish/genuine pairs, `verifyVerdict:true`, a `falseAlarmCost` on each genuine item, item 5's five tells grouped so a natural tick subset credits, item 6's genuine internal call lifted to full-mark Comply via `verdictPoints`, and `labels.verdictFeedback.trust.real` reads the genuine Trust as a right call.
- **Register and length.** `.example` throughout; Gwen is a calm colleague on both shells (≤25 words), no printed variable in any voiced line (the demo asks the learner to read the on-screen code without speaking it; the cloned voicemail says "two hundred quid").

## Findings

### M1 — the write-stage red-flag meter runs on the unscored hidden-line brief, where it cannot see the planted line, so it shows "reads clean so far" / "fewer flags means harder to spot" and signals nothing useful. Minor, episode-local (meter config). Carried from B3 F6 / worst-line 2.
`social.mailClient.showRedFlagMeter: true` (`attack.json:51`) and `phishTargets[0].redFlagMeter: true` (`:65`) drive the composer's live meter. The one deliberate write choice is the pretext: plain invoice vs the `inject_contacts` variant whose payload is `hiddenText` the composer cannot preview (`attack.json:_note`). So on the hidden-line brief the meter still reads "0 red flags, reads clean", which is literally true (the line is invisible to it) but tells the learner nothing about the choice they just made, and B3's persona flagged "fewer flags means harder to spot" as a placeholder-feeling line. The write is unscored and the teaching is saved for the flip, so the meter adds confusion, not signal, on the one screen it appears. Options for a steer (none urgent): (a) drop `showRedFlagMeter`/`redFlagMeter` for E13's write so no meter is drawn, letting the pretext choice stand on its own; or (b) if the meter stays, suppress or neutralise its "fewer flags = harder to spot" line for this episode (an engine/`stagesWrite` copy question). Judged from data; confirm which line renders on a bridge before changing. Low priority — it is a nit on an unscored stage.

### M2 — the flat `assistant.summarise.{reply,empathy,hidden}` fallback still holds the pre-D2 injection text and the un-dedup'd empathy opener, dead while both pretexts carry a `byChoice` entry but a latent re-duplication if a third pretext is ever added. Minor, episode-local, tidy.
`full_only.json:29-34` (and the erb) keep the flat `summarise.reply`/`empathy`/`hidden` with the old wording — `empathy` there is the verbatim "You wrote that line to be read by a machine; here it is, doing exactly what you meant..." that C2 D2 trimmed from the byChoice path. The engine falls back to these per field only when a sent template has no `byChoice` entry; both `inject_contacts` and `pretext_invoice` have one, so the flat fields never render today. Harmless now, but it leaves two sources for the same copy and would resurface the D2 echo if a pretext were added without its own byChoice. Cheapest tidy: align the flat `empathy` to the dedup'd byChoice wording (or note in `_note` that the flat fields are dead fallbacks kept only for an unlisted pretext). Not a defect in the shipped flow.

## Voiced host lines I would change

None required. Every Gwen line voices as a calm colleague on both shells, within the cap, no printed variable. The one optional tweak C2 offered (the defend-only completion line, 28→27 words, two beats) is unchanged and remains optional; the shipped line is within the cap and reads fine.

## Verdict per stage

- **brief** — ship. Scope, "a test is coming, I'll say when", and the two-count triage brief read correctly.
- **write (attack)** — ship. C2 D1 closed (the plain-path reply is now true); the only open item is M1, the meter nit on this unscored stage.
- **flip + assistant beats** — ship. By-choice surfacing, paste hygiene and output-check correct and dedup'd (C2 D2 closed); M2 is a dead-fallback tidy, not a shipped-flow defect.
- **defend** — ship. Six items, fair and mirror-paired; item 5 tells grouped (B3 F4 closed), item 6 full-mark Comply; immediate feedback carries request-and-channel reasoning; D4 is the known shared-scorer limitation.
- **debrief** — ship. Reasoning cards, Monday card (now standing alone for the defend-only shell), "Where the fakes came from" and the verbatim rule of thumb all in register.

**Overall: ship-worthy.** Both C2 shipped-copy findings (D1 write-stage reply, D2 empathy dedup) are genuinely closed, the B3 content minors are addressed across the fragment, erb and full-only authoring, and both shells validate clean with clean dialoguelint and green parity. The two remaining items are low-priority episode-local tidies: M1, the write-stage meter that signals nothing on the hidden-line brief, and M2, dead pre-D2 fallback copy. The demo gate (MA4), the "report everything scores 100" scorer limit (D4) and the stale spec record (D3) are the known carry-forwards. The honest confirm owed is a timed full playtest (B3 estimated ~14 min, on target).

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (both episode-local). Both shells validate with no social lint; dialoguelint clean (full max 25, defend max 25); E13 parity subtest green. Judged from code/data, not a fresh bridge (C2's `e13-full`/`e13-plain` were 14/14; only content changed since).
- Closure: C2 D1 closed (byChoice write-stage reply, plain path now true), C2 D2 closed (empathy opener dedup'd), B3 F1/F2/F3/F4/F5 all closed (invoice prose, defend-only copy stands alone, child-detail covered, CEO-call tells grouped, password feedback distinct); MA4/D3/D4 known carry-forwards.
- Blockers: none.
- Majors: none.
- Minors: M1 (episode-local) write-stage red-flag meter shows "reads clean / fewer flags = harder to spot" on the hidden-line brief it cannot see — drop or neutralise the meter for the unscored write (`attack.json:51,65`). M2 (episode-local tidy) flat `summarise` fallback keeps the pre-D2 injection/empathy copy, dead today but a latent re-duplication (`full_only.json:29-34`).
- Verdict: ship-worthy; M1/M2 are low-priority tidies; demo gate, scorer-100 and spec drift are known; run one timed full playtest.
