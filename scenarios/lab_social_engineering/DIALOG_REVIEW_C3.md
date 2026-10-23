# Lab: Phishing and Social Engineering — Dialogue review, formal cycle 3

Fresh reviewer, read-only. No ink or scenario file edited; nothing committed.
Scope: the ink for Ruth, Ruth's phone, Fairbairn, Tomasz, Dev (the pretext call),
and the Pierce/Lord/Hampshire mail; plus the player-facing scenario text (barks,
hints, task titles, OSINT/concept cards, the report, the SOC/defender copy, triage
and credits). Ran the `npc-dialog-review` skill in full.

Judged as a game for cyber security students: fun, warm, dry, educational, not preachy.
Caps applied (this brief): 30 words in person, 25 by phone.

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 2** (both small staleness on an edge route; neither changes a spoken line's text)
- **Worth considering: 2**

Cycle 2 (committed in `ade3912f2`) lands cleanly. All five re-gated lines fire on exactly
the routes intended and nowhere else, the hub's first-match order gives the most useful line
at every stage on all three named routes, and nothing contradicts the objectives panel. The
two minors are residual status-line staleness on the Dev-reported route and the Sofia-first
(out-of-order) route — both edge paths, both already handled gracefully on the other channel.

## Phase 1 — compile, validate, lint, runtime

- **Compile: 7/7, 0 failed.** Only warning is the expected `-> END` on `tomasz.ink:143`
  (the closing debrief → credits). `dev_service_desk`'s two `-> END`s (hang-up / ring-back)
  are legitimate endpoints, unchanged. No action.
- **No "apparent loose end" warnings.**
- **dialoguelint:** one finding only — `phone-self-prefix` on `fairbairn.ink:69`, the known
  false positive (the lint misclassifies Fairbairn, an `npcType: "person"`, as a phone
  contact; the `Ruth Adeyemi:` prefix is a legitimate second speaker in the signing
  two-hander). **Do not drop it.** No line-length errors. Per-file maxima: ruth 25, tomasz 28,
  fairbairn 25, ruth_phone 23, dev 22 — all within 30-person / 25-phone.
- **loopcheck (200 steps × 6 strategies):** clean on every conversational/stage entry knot —
  `ruth@start`, `ruth@hub`, `ruth_phone@hub/stage3/stage4/stage5/stage_done`, `fairbairn@start`,
  `tomasz@start`, `dev_service_desk@start`. No starved knots; no runtime errors.
- **Committed state:** the lab ink and `scenario.json.erb` are clean in the working tree (the
  only lab diffs are `dungeon_graph.*`, a validator side effect). This review is of the
  committed cycle-2 state, so no `tagdiff` of a rewrite is needed.

## The five re-gated lines — each fires on exactly its intended routes

### 1. Ruth's lockout line — `pretext_call_reported and not (both facts)` — CORRECT
- `ruth.ink:200` and `ruth_phone.ink:151` gate on `pretext_call_reported and not
  (se_intel_lord_portal_name and se_intel_lord_payslip_date)`. `pretext_call_reported` is set
  only by the pretext "reported" outcome (`scenario.json.erb:854`), so the line is unreachable
  on any route where Dev was not reported. It clears the moment both Lord facts are held.
  Confirmed it cannot fire elsewhere.
- Ordering: on the reported route both easy targets have already landed (topic_hard and the
  Sofia-prep hub branches require `phish_hampshire_landed and phish_pierce_landed`), so the
  three branches above it (`ruth.ink:194` Sofia-first, `:196` throwaway nag, `:198` delivered-
  isn't-landed) all evaluate false, and L200 wins. Correct priority.
- Residual staleness on this route: see **M-C3-1** below.

### 2. The throwaway nag — `operations_key_given and not acct_freemail and not (any landed)` — CORRECT
- `ruth.ink:196` now carries `and not (phish_hampshire_landed or phish_pierce_landed or
  phish_lord_landed)`, so it is gone the instant any target lands from the guest account (the
  R11 F3 intent). It can only fire at the earliest mail stage (operations key in hand, no
  throwaway made, nothing landed), and L194 above it can't pre-empt it there (Sofia can't land
  that early). Fires on its route only.

### 3. Melanie's line split — `topic_account` — CORRECT
- `ruth.ink:262-267` splits the old combined line: Chris's clause shows `{ not
  phish_hampshire_landed }`, Melanie's shows `{ not phish_pierce_landed }`. The topic is
  reachable while either easy target is still open, and each clause disappears as its own
  target lands — no "Melanie's trickier" after she has landed (R11 F4 intent). Correct.

### 4. The Sofia-first hub line — CORRECT
- `ruth.ink:194` gates `phish_lord_landed and not (phish_hampshire_landed and
  phish_pierce_landed)` and sits first in the landing cluster, so it pre-empts L196/L198 on the
  out-of-order route and falls silent the moment the other two land (then L214 the report
  finding fires). The companion gate on the report hub choice (`ruth.ink:234`, now all-three)
  stops the report topic appearing early. Correct. Minor roughness on the *phone* side of this
  same route: see **M-C3-2**.

### 5. The report aim unlocks on `sends_done` — CORRECT, matches the panel
- `scenario.json.erb:116` `"unlockCondition": { "globalVariable": "sends_done", "equals": true }`.
  `sends_done` is set only when all three have landed (the three `onceOnly` eventMappings at
  L1415-1417, plus Ruth's `recheck` P2 backup at `ruth.ink:134-137`). The report workstation
  requires the same global (`scenario.json.erb:1516`), the report hub choice requires all three
  (`ruth.ink:234`), and Ruth's Sofia-first line (L194) tells the player the report needs all
  three. No channel announces "write the report" before `sends_done`; the `ruth_phone` hub
  routes a lord-landed-but-not-both player to `stage3`, not the report `stage6` (the `stage3`
  guard sits above `stage5`/`stage6`). Nothing contradicts the objectives panel.

## Hub first-match order — most useful line at every stage

Traced `ruth.ink:179-223` top-to-bottom for the reported, Sofia-first and guest-account routes:
specific branches precede their general catch-alls throughout (`:202`/`:204` call-or-page
before `:206` neither; `:208`/`:210` missing-fact before `:212` write-to-Sofia; `:214` report
finding before `:217`/`:219` defender hand-off). The one place the general line pre-empts a
specific one on purpose is the reported route (L200 above L208/L210) — see M-C3-1.

---

## Minors

### M-C3-1 — ruth.ink:200-201 — SPOKEN (Ruth) — lockout line goes stale after a partial call-back
On the Dev-reported route the lockout persists (by design, R11 F1) until **both** Lord facts
are held. A player who was reported, waited out the lockout and rang back softly to get the
portal name (a clean call) — but not yet the date — still hears, in person:

> `Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. Gareth kept a straight face. Give the desk a minute, then ring back softer.` *(ruth.ink:201)*

"Give the desk a minute, then ring back softer" implies they have not yet rung back
successfully, when they just did (they hold the portal). The phone is correct here: `stage5`
(`ruth_phone.ink:179-198`) branches on exactly which fact is missing and says "ring Dev back
and ask when payslips go out". So the person-hub nudge lags the phone on this route.

This is a genuine trade-off, not a clear bug: R11 F1 deliberately made the lockout persist so
the "ring back softer" steer stays up after a report. Two ways to resolve, both leaving the
spoken text unchanged (no re-voice):
- **(a) narrow the gate to zero-facts** — `- pretext_call_reported and not
  se_intel_lord_portal_name and not se_intel_lord_payslip_date:` — so once any fact is in, the
  specific L208/L210 "ring him back for the portal / the date" lines take over. Cost: if the
  page is not yet built, L208/L210 don't fire (they need `landing_payroll_login_built and
  pretext_call_done`), so a reported-with-one-fact-but-no-page player drops to the `else`
  fallback rather than a steer.
- **(b) keep it as-is** and accept the lag, treating the lockout as the dominant message after
  a report. The phone already gives the granular guidance.
My read: (a) is the better player experience on the common sub-case (page built first, then
calls), and the fixer owns the call. Minor either way — spoken text does not change.

### M-C3-2 — ruth_phone.ink:130 — SPOKEN (Ruth, phone) — "Operations now" is backward on the Sofia-first route
On the out-of-order route (Sofia landed, the two easy targets not both landed), the phone hub
routes to `stage3` (its `not (phish_hampshire_landed and phish_pierce_landed)` branch sits
above `not phish_lord_landed`). `stage3` opens with:

> `Operations now. If that door's locked, I've got the key — come and see me.` *(ruth_phone.ink:130)*

For a player who has already built the page, called Dev and landed Sofia, "Operations now …
if that door's locked" reads as a step backwards — they are well past first entry to
Operations. The person-hub handles the same route gracefully (`ruth.ink:194`: "Sofia's in, but
the report needs all three…"); the phone doesn't. The `stage3` *choices* beneath it are
correctly gated to the still-open easy target, so the guidance itself is right; only the
door/key opener is stale. Edge route (requires landing Sofia before both easy targets).
Proposed: gate the opener so the door line only shows when neither easy target has landed, e.g.
> **Proposed (ruth_phone.ink:128-130):** wrap the "Operations now. If that door's locked…"
> opener in `{ not (phish_hampshire_landed or phish_pierce_landed): … - else: Still one to go
> in Operations — whoever's left has to act before the report. }` (text for the fixer to
> voice; keep it under 25 words).

---

## Worth considering

### w-C3-1 — tomasz.ink:118-119 / credits scenario.json.erb:174 — reachability of the "reported, not got_it" branch
Tomasz's debrief branch at `tomasz.ink:118` and the matching credits line at
`scenario.json.erb:174` both fire on `dev_reported && pretext_service_desk_call_outcome !==
'got_it'`:

> `Tomasz: Dev gave you what Sofia's email needed, and reported a call too. Credit for that. A call-back rule stops it without him noticing.` *(tomasz.ink:119, SPOKEN)*

Reaching Tomasz's debrief requires the report filed, which requires Sofia landed, which (per
the Lord mail design) requires the portal sender/name and the release date — facts that come
only from a granting Dev ask, i.e. a `got_it`. If a `got_it` is sticky, this branch would be
`dev_reported && got_it` → branch `:116`, so `:118`/credits-174 may be unreachable on any path
that gets this far. I could not settle this from the ink alone (it turns on whether a call that
grants a fact and is then pushed to the report threshold finalises as `got_it` or `reported`,
and on the sticky-outcome rule in `person-chat-pretext.js:360-363`). It is out of the dialogue
skill's scope (outcome/eventMapping mechanics) — flagging for `scenario-design-review` to
confirm the branch is reachable; if it isn't, the line is harmless dead text, not a bug.

### w-C3-2 — tomasz.ink:120 vs :122 — the "leaned on Dev" distinction (confirmed working, note for the fixer)
`tomasz.ink:120` (`pretext_service_desk_call_outcome == "got_it" and
pretext_service_desk_call_lowest >= 0`) vs `:122` (`== "got_it"` only) distinguish a smooth
call from one where you pushed Dev into negative influence (`_lowest` is a signed influence
minimum, `person-chat-pretext.js:352,367-371`, so `>= 0` means "never dipped below neutral").
Both branches are reachable and read well. No action — recorded so a later cycle doesn't
mistake `>= 0` for an always-true tautology and "simplify" the leaned-on variant away.

---

## What's working (keep)

- All five re-gated conditions are tight: each fires on its route and clears on the state that
  should clear it. The hub ordering is specific-before-general throughout.
- Teaching stays accurate and in-character, never preachy: SPF/DKIM/DMARC (`tomasz.ink:69-70`),
  the list-mail DKIM-survives-SPF-fails note (`triage fwd_balance_sheet`, erb:1020-1028), the
  padlock card, and every `blame: true` wrong answer explained as the control gap it hides
  (report `why` strings, erb:1220-1299). Earned facts (LedgerPay, the portal name) still come
  only from Dev, never leaked by a hint.
- Dry humour intact: Tomasz "me and half a person's budget" / "talked him down to the executive
  summary"; Dev "first payslip's always a faff"; Gareth "enjoying this more than he lets on";
  the own-send report replies ("Sent from a workstation in our own Operations Room, funnily
  enough"; "Good page, that. Shame about the address"); Ruth's new "Still here. Earning my fee."
- Choice/reply matches clean everywhere; every spoken exit choice has a one-line NPC reply; the
  debrief point-of-no-return warning (`tomasz.ink:96-108`) honours the "warn before the ending"
  rule. Barks are paired-but-exclusive (only the last-set global's bark fires), so no double-bark.
- The over-promised-anonymity callback (`fairbairn.ink:79-81`) still reads naturally and fires
  only on its route.

## Out of scope this cycle

- Voices/TTS: no `voice` blocks defined; POLISH_PLAN skips audio. Not a dialogue finding.
- Structure/solvability, the three pre-existing `mutuallyExclusiveGlobals` warnings on Ruth's
  phish_*_landed eventMappings, outcome/sticky mechanics (w-C3-1), room/geography:
  `scenario-design-review` and `mission-puzzle-chains` own these.
