# E13 "The AI assistant": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E13 is a write-then-flip episode for core_15 (generative AI and deepfakes): the learner plants a hidden instruction in a supplier brief from templates, an authored assistant surfaces it in the flip, two unscored assistant beats teach paste hygiene and output-checking, then the built inbox-triage defend half runs six items including a cloned-voice voicemail and a fake Project Heron video call. Company Brightwell Foods; host Gwen Pritchard (IT service desk lead). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E9/E11 pilot reviews in this folder.

Scope read end to end: the full shell `scenarios/awareness_e13_ai_assistant/{scenario.json.erb, mission.json implied by spec §8b, ink/gwen_pritchard.ink}`; the defend-only shell `scenarios/awareness_e13_ai_assistant_defend/{scenario.json.erb, ink/gwen_pritchard.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e13/{attack.json, defend.json, full_only.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E13_ai_assistant.md`; the module `core_15.../concepts.md`; E13's rows in `gen_e8_e17_shells.py`; and the engine the C1 fixes depend on (`minigames/assistant-chat/assistant-chat-minigame.js`, `episode-runner/flip-view.js` `defenderLine`, `episode-runner/episode-runner-minigame.js` `_flipProps`/`_flipContinue`, `mail-client/mail-bridge.js` `dataOnlyText`/scheduleTextJob, `systems/phish-rules.js` `evaluateMessage`).

How the screens were judged: this pass **ran the bridges**. `ONLY="e13-full e13-plain"` on the keyless :3001 server both pass **14/14** (games 4885/4884); they assert the by-choice assistant surfacing on each path from the live DOM (summary text, hidden-text reveal, paste strike-out, draft check-source). I also ran a short custom bridge on the **plain** path (game 4888) that stays in the mail client after Send and reads the container; it is the source of D1 below. The by-choice/flip/paste/draft findings are from these runs (DOM text, not a pixel render); fonts/13px/address-font are from code and the C1 screenshots, not re-eyeballed here.

Ran (all E13-only, all green except where noted):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: both pass with **no social errors or warnings** (only the generic one-room-kiosk VM/puzzle suggestions every awareness shell draws). The two strict-social warnings C1's MA2 flagged on the defend-only shell are gone.
- `dialoguelint.mjs` both shells: full `lines=14 median=17 p90=22 max=25`; defend `lines=3 median=27 p90=28 max=28`. No rule hits; every host line ≤30 words, no printed variable.
- Bridge suite `e13-full` + `e13-plain`: 14/14 each.
- No em/en dashes in any shipped shell, ink or fragment (house style). (The only hits are the generated `dungeon_graph.{md,html}`, which are tool output, not learner copy.)

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 3 | 1 | 0 | 2 |
| **Total** | **4** | **2** | **0** | **2** |

(The Major is episode-local content in the primary fix; it also has an engine route and needs a user decision between the two, so it is counted episode-local and flagged needs-user in the body.)

## C1 closure

Each C1 finding checked against the live files, the validator and, where it depends on the engine, the two bridges.

| C1 finding | Claimed fix | Verified | Status |
|---|---|---|---|
| **MA1** triage-set brief miscounts the items ("a supplier email, two voicemails and two video calls" = 5) | reword to "two supplier emails..." (931e9e0e0) | Full erb `:89` and defend erb `:64` both read "Six things have come in: **two supplier emails, two voicemails and two video calls.**" 1+... now reconciles to six. | **Closed** |
| **MA2** defend-only shell ships flip-only strings; two trip strict-social | move `flipDefenderLineByChoice` to full-only; regenerate (931e9e0e0) | `flipDefenderLineByChoice` is gone from `e13/defend.json` and the defend-only shell; it now lives in `full_only.json` `flipStrings` and inline in the full erb (`:382`). Defend-only shell `strings` is `brief, flipMissedHeading, flipLandedNoTells, defendIntro, noBlameLine, mondayCard, defendOnly, conceptPanel`. **Both shells validate with no social warnings.** | **Closed** (the two residual flip strings `flipMissedHeading`/`flipLandedNoTells` stay, harmlessly — they reference no template id, so strict-social does not flag them; their removal is the known-open generator pass 2, not re-raised here) |
| **MA3** `summarise` flattened to the injection branch; plain path contradicts the flip's by-choice line | add `summarise.byChoice`; wire engine batch 3B (66c1a66c1) | `summarise.byChoice.{inject_contacts,pretext_invoice}` present (full erb `:414-431`); the engine reads `params.sentTemplateId` and picks the branch per field (`assistant-chat-minigame.js:124-129`), the runner passes `this.state.sent?.templateId` (`episode-runner-minigame.js:647`), and the flip's `defenderLine()` selects `flipDefenderLineByChoice[templateId]` (`flip-view.js:99-103`). **e13-plain asserts live** that the plain summary is "Nothing else to action" and the reveal is "Nothing is hidden in this brief" (not the injection). | **Closed in the flip and the assistant overlay.** But the same contradiction survives one layer upstream, in the write-stage target reply — see **D1**. |
| **MA4** demo gate `e13_demo_offered` is set by nothing | user decision (spec §20.1) | Unchanged: declared `false` (`:76`), set nowhere; the demo event mapping (`:756`) is schema-valid and dormant. | **Open, user decision** (not re-raised per the task note) |
| **MI1** `phish_assist_reader_landed` set but unread | make the plant mapping key on it (931e9e0e0) | `outcome.setGlobal` writes it (`:680`); the `plant_hidden_instruction` eventMapping now keys on `global_variable_changed:phish_assist_reader_landed` (`:743-746`). Validator no longer warns. The ink hub still keys on `phish_assist_reader_attempts > 0` for its line (correct, scoring is defence-only). | **Closed** |
| **MI2** paste/draft beats have no feedback slot | add `paste.feedback`/`draft.feedback`; wire batch 3B (66c1a66c1) | `paste.feedback` (clean/leftPersonal/leftPassword, full erb `:474-478`) and `draft.feedback` (caught/missed, `:509-512`) present; the engine renders a paste verdict with a `secretLeft`/`personalLeft` gradient (`assistant-chat-minigame.js:207-213`) and a draft verdict on Check source / Send-without-checking (`:255-287`). `leftPassword` was reworded so it does **not** repeat `secretWarning` (they render complementarily, feedback then warning). | **Closed** |
| **MI3** flip replays "Nothing to replay this time" in place of the per-choice line | engine selection of the by-choice line (engine batch 2) | `_flipProps` now rebuilds the landed-no-tell sent message when `_hasChoiceLine(templateId)` is true (`episode-runner-minigame.js:604-606`), so the flip replays the brief and shows the by-choice defender line rather than the `flipMissedHeading` placeholder. | **Closed** |

All seven C1 items are accounted for: five closed, MA2 closed (with a known-open tidy-up left), MA3 closed in the two layers it named but with a third layer (D1) still live, and MA4 left as the user decision it was.

## What works

- **The by-choice story is now consistent across the flip and the assistant, on both paths, and it is confirmed live.** On the injection path the flip quotes the lever ("the assistant turned it into 'Mossgate also needs the full site contact list...'") and the summarise beat surfaces it with a white-line reveal; on the plain path the flip says "nothing to act on" and the summarise beat returns "Nothing else to action" with "Nothing is hidden in this brief." MA3's contradiction is gone from these two surfaces (e13-plain and e13-full both 14/14). This is the empathy beat core_15 prompt injection needs.
- **The two unscored teaching beats now land their point.** The paste beat strikes out the child's health detail and the password, summarises from the lines left in, and closes on a graded verdict (clean / left-personal / left-password) plus the one-click password report; the draft beat shows the invented 99.4% and the agency-staff line, opens the real 96.1% source on Check source, and lands `caught`/`missed`. The verdict copy was deliberately kept distinct from the secret warning, so the password path does not say the same thing twice.
- **The facts track `concepts.md` and are proportionate.** Prompt injection is at concept level only, shown as a line a machine reads, never as a how-to (`concepts.md` §prompt-injection, spec §18). Hallucination (invented figure + non-existent "Q3 logistics review" source, real 96.1% and a fridge fault) and bias (the unsupported agency-staff line) match LO3 and the accountability point. Deepfakes are taught by request-and-channel, never by glitch-spotting (`conceptPanel` names sources, not tells; the demo ink ends "same face, same voice ... none of that proved it was me"). EU AI Act and UK GDPR are kept out of play (spec §18).
- **The defend set is fair and mirror-paired.** Three phish/genuine pairs (injection ↔ genuine Mossgate invoice; cloned voicemail ↔ genuine Tom; Project Heron video ↔ genuine internal call), `verifyVerdict: true` rewarding the safe default, a genuine item after each likely miss, and `falseAlarmCost` lines framing a report of a genuine item as fine-but-costly. The cloned voicemail is a personal "lost my wallet" favour scam, distinct from E7's cloned-CEO payment pretext.
- **Nothing implies a real product, and the host voice is clean.** `.example` throughout; Gwen is a calm colleague, every line ≤25 words full / ≤28 defend, no printed variable in any voiced line (the demo asks the learner to "read me the six-digit code" without speaking it; the cloned voicemail says "two hundred quid").

## Findings

**D1. On the plain `pretext_invoice` path, the write-stage assistant reply still claims it noted the contact-list instruction, and the authored `missed` reply is dead. Major, episode-local (with an engine route); needs a user decision. Confirmed from a render.**
This is the one layer of C1's MA3 that was not closed. MA3 fixed the flip and the assistant overlay to branch on the sent pretext, but the **write-stage target reply** does not branch, and the target lands unconditionally. `phishTargets[0]` (`assist_reader`) is an open target (`primedFor.trusts: ["*"]`, `requiredFactors: []`), so `evaluateMessage` sets `landed = open.opened && failedRequired.length === 0` → always `true` whatever pretext is sent (`phish-rules.js:515`). The data-only reply therefore always returns `replies.landed` (`mail-bridge.js:421` → `dataOnlyText` → `replies.landed`), and `replies.missed` can never be shown. The two strings (full erb `:669-672`):
> landed: "Summarised. One cleaning invoice from Mossgate, due for payment. I've also noted that Mossgate needs the full site contact list sent to a new address today."
> missed: "Summarised. One cleaning invoice from Mossgate, due for payment. Nothing else to action."

I sent the **plain** brief (`pretext_invoice`) on a live run and read the mail client after Send: the container shows **"...I've also noted that Mossgate needs the full site contact list sent to a new address today"** — the injection reply, on a brief that never carried the injection. A learner who left the brief plain then reads, in order: this false reply (write stage) → "You left the brief plain, so the assistant's summary is just the invoice, with nothing to act on" (flip) → "Nothing else to action" (assistant). The first directly contradicts the next two. (The e13-full/e13-plain suites miss this because both press Escape immediately after Send, before the reply arrives; a learner who lingers on the sent thread sees it.)

Secondary observation on the **injection** path: the same reply pre-empts the flip's reveal, so the "it turned your line into a suggestion" beat now lands three times (write reply, flip defender line, assistant summary). Not wrong, but it is restating.

Fix, two routes for the user to choose:
- **Cheapest, no engine change (recommended): reword `replies.landed` to the neutral summary and drop `replies.missed`**, so the immediate reply is true on both paths and the injection payoff is saved for the flip/assistant where the design wants it. Old → new, full erb `:670-671` and `attack.json:87-88`:
  `landed: "Summarised. One cleaning invoice from Mossgate, due for payment. I've also noted that Mossgate needs the full site contact list sent to a new address today."` → `landed: "Summarised. One cleaning invoice from Mossgate, due for payment."` and remove the `missed` key (it is unreachable).
- **Fuller (engine): give the data-only reply a by-choice form** keyed on the sent template, mirroring the MA3 flip/assistant fix (`dataOnlyText` reads a `replies.landedByChoice[sentTemplateId]`), and wire `pretext_invoice → "...Nothing else to action."`. This keeps the immediate inject-path payoff. Larger change; an engine owner's call.

Until one is applied, the plain path carries a live contradiction; it is masked only because the aim (hints, `primedFor.story`) steers the learner toward `inject_contacts`.

**D2. The injection-path flip defender line and the assistant empathy line repeat the same opening sentiment back-to-back. Minor, episode-local, dialogue.**
Full erb `flipDefenderLineByChoice.inject_contacts` (`:383`) opens "You wrote that line to be read by a machine, and here it is, doing exactly what you meant..." and the assistant `summarise.byChoice.inject_contacts.empathy` (`:417`) opens "You wrote that line to be read by a machine; here it is, doing exactly what you meant...". The learner reads the first on the flip screen, clicks Continue, clicks Summarise, and reads the near-verbatim second a moment later; both also close on the same "it can't tell an instruction from a request" idea. This is the restating the brief's "flip teaching rather than restating" warns against (cf. E9 D1). Fix (trim the echo from the empathy line so it adds the new point, not the same opener), old → new, full erb `:417` and `full_only.json:33`:
`"You wrote that line to be read by a machine; here it is, doing exactly what you meant. An assistant can't tell an instruction in an email from a request from your boss."` → `"And here is why it worked: an assistant can't tell an instruction in an email from a request from your boss."`

**D3. The spec's host-line record drifted from the shipped generator and ink. Minor, needs-user (doc). No shipped file is wrong.**
`E13_ai_assistant.md` §8b `LINES[('e13','defend')]` (`:271`) records the defend-only welcome as "Brightwell's switched on its **own** assistant, and the kiosk's **got the inbox next to it**... Some are real, **some were built to look right. Take each as it comes.**" The shipped generator (`gen_e8_e17_shells.py:249`) and the shipped defend ink (`:24`) both read "Brightwell's switched on its assistant, and the **kiosk has the inbox beside it**... Some are real, **some aren't.**" The generator and the ink agree with each other; only the spec is stale. (The §8 full-episode "On completion" draft is likewise a single sentence where the shipped ink splits it across two lines, both within the word cap.) Correct §8b `LINES` and §8 to the shipped wording so a later edition does not regenerate E13 from the stale spec (the companion to E11's D3).

**D4. "Report everything" still scores 100% numerically. Minor, needs-user (shared-scorer limitation, already known).**
As for E9/E11: under `scoringProfile: "awareness"` with `passPercent: 0`, Report/Verify on the genuine items (#2/#4/#6) is not marked down, so a learner who reports all six scores 100. The REVIEWER_BRIEF "refusing everything doesn't win" criterion is met **pedagogically** (each genuine item's `falseAlarmCost` shows in immediate feedback and `verifyVerdict` rewards Verify as the safe default) but **not numerically**. A request to `05`, not an E13 defect; restated so C2 records it.

## Notes (not findings)

- **The injection line is visible in the composer, not white text, and the flip calls it "that line to be read by a machine" / "one buried line".** This is deliberate (`attack.json` `_brief_gap`: the white-text framing is realised in the flip surfacing and the defend item's `hiddenText`, not in the slotless composer). The learner writes a line addressed to AI assistants; "buried"/"hidden" is a property the defend item shows, not something the composer stages. The teaching holds; left as-is.
- **Item 1's premise (same real Mossgate address carries the planted line, SPF/DKIM/DMARC all pass) is deliberate** (`full_only.json` playerSentAuth note: the attack is the content, not a forged sender) and matches the module's point that an assistant acts on content whatever the sender's standing. Left as-is.
- **Known-open, not re-raised per the task note:** the two residual flip strings (`flipMissedHeading`, `flipLandedNoTells`) in the defend-only shell await generator pass 2 (harmless, no template reference, validator clean); the demo gate `e13_demo_offered` (MA4) is the user's placement decision.
- **The generic validator suggestions** (VM launchers, lock types, hostile NPC, timedConversation, etc.) are the one-room-kiosk boilerplate every awareness shell raises; ignored, as in prior reviews.
- **Pre-ship web search still owed** (BRAND_ADDITIONS §, spec §5): "Mossgate Cleaning Supplies" and "Project Heron" against real businesses.

## Dialogue pass (voiced host lines)

Every host line read as spoken, both shells. Register is a calm colleague throughout; no printed variables; UK English; no em/en dashes. The only on-screen flip-text change is D2 (that is overlay copy, not a voiced line). Voiced lines I would change:

| Line | Old | New |
|---|---|---|
| Defend-only completion (optional), `ink/gwen_pritchard.ink:22` (28 words, a long single clause) | "That's them all handled, thanks. Whoever the voice or the face belongs to, checking another way on a number you already hold is the move that always works." | "That's them all handled, thanks. Whoever the voice or face belongs to, the move that always works is the same: check another way, on a number you already hold." (27 words, two beats) |

Everything else voices well and is left: the full welcome and hand-off lines, the `demo_call`/`reveal` knot (the fake Gwen asks for "the six-digit code on your phone", code on screen only; the real Gwen's "same face, same voice ... none of that proved it was me" and "You don't need to spot a deepfake. You need to check another way."), and the "Thanks, Gwen." / "Any time." exchange.

## Verdict per stage

- **brief** — ship. Scope, "a test is coming, I'll say when", and the two-count triage brief all read correctly post-MA1.
- **write (attack)** — ship **after D1**. The compose-and-send works and lands; the one open defect is the write-stage reply on the plain path (D1), which must be reworded (or made by-choice) before ship.
- **flip + assistant beats** — ship after D2 (the one dialogue dedup). The by-choice surfacing, paste hygiene and output-check are correct and confirmed live on both paths; MA3's flip/assistant contradiction is genuinely closed here.
- **defend** — ship. Six items, fair and mirror-paired; immediate feedback carries the request-and-channel reasoning; D4 is the known shared-scorer limitation.
- **debrief** — ship. Reasoning cards, Monday card, no-blame, "Where the fakes came from" and the verbatim rule of thumb all correct and in register (confirmed on the e13-plain run reaching the debrief with the concept panel and a stored record).

**Overall: ship-worthy once D1 is fixed (or its route decided) and D2 applied.** D1 is the remaining layer of C1's MA3: the flip and the assistant overlay were fixed, but the write-stage reply still asserts the injection on the plain path and its `missed` reply is dead — a one-string reword closes it with no engine change. D2 is a trivial dialogue dedup. D3 is a spec tidy-up touching no shipped copy; D4 is the known shared-scorer limitation. All other C1 items are genuinely closed, confirmed engine-side and on the two green bridges.

---

### Return (one line each)

- Counts: 0 blocker, 1 major, 3 minor (4 total; 2 episode-local, 2 needs-user). Both shells validate with no social warnings; dialoguelint clean (full max 25, defend max 28 words); e13-full and e13-plain bridges 14/14.
- C1 closure: MA1 closed (brief now counts six), MA2 closed (flip-by-choice strings off the defend-only shell; no strict-social warnings), MA3 closed in the flip + assistant (confirmed live on both paths) but a third layer survives as D1, MA4 left as the user decision, MI1/MI2/MI3 closed (dead global now read; paste/draft verdicts wired and distinct from the secret warning; flip shows the by-choice line, not the placeholder).
- Blockers: none.
- Majors: **D1** — on the plain `pretext_invoice` path the write-stage reply still claims "I've also noted that Mossgate needs the full site contact list..." (open target always lands, `replies.missed` dead); reword `replies.landed` neutral and drop `missed`, or make the reply by-choice (engine). Confirmed from a render. `scenario.json.erb:669-672`, `attack.json:87-88`.
- Voiced host lines I'd change: only the defend-only completion line (28 → 27 words, two beats), and it is optional.
- Verdict: ship-worthy after D1 (reword/decide) and D2 (dedup the flip↔assistant empathy opener); D3/D4 are doc and known-scorer notes.
