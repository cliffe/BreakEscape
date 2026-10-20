# Review — 03 Intel board, round 1

Severity: 0 blockers, 2 majors, 4 minors.

Read-only review of `designs/03_intel_board.md` against `BRIEF.md`, `README.md`, and siblings
`02_osint_browser.md` / `04_phish_rules_engine.md`. Engine claims verified in code.

## Engine verification (all claims hold)

- **`set_global`, `apply-actions.js:33`** — correct. The `set_global` case is at
  `public/break_escape/js/systems/apply-actions.js:33`; it patches
  `window.gameState.globalVariables[key]` and emits `global_variable_changed:<key>`. Citation exact.
- **Objective `onComplete.setGlobal`** — real at `systems/objectives-manager.js:754-757` (writes each
  `setGlobal` var into `gameState.globalVariables`). N3's "emit a target-ready global" is buildable.
- **Event subscription** — `eventDispatcher` is an `NPCEventDispatcher` (`systems/npc-events.js`, with
  `.on/.once/.off/.emit`), created in `main.js:122`. N2's "subscribe to intel-collected events" is
  sound; the event itself is new work (02 N2 emits it), correctly tagged new.
- **N2 persistence is real and robust.** `state-sync.js` persists `globalVariables` (keyed section,
  line 13) and `notes` (per-player, lines 112/190-197) to the server every 30s plus a page-hide
  flush, and `core/game.js:1385` (`savedGlobalVariables`) and `:1395-1405` (`savedNotes`) restore
  both on load. The SIEM minigame (`siem-dashboard-minigame.js:941`) shows the exact reusable
  pattern: stash minigame state under `globalVariables[STATE_KEY]`, restore on start. The intel
  board can persist the same way. The "fingerprint W1 lesson" claim checks out.

## Findings

1. **[Major] Readiness cannot be derived from 04's `requiredFactors` as the doc claims.**
   (03 "Attack-readiness", "Scenario-authored data" `readinessFromFactors`, N3.) 04's
   `requiredFactors` names message-*craft* checks evaluated at compose time —
   `senderTrust`, `addressedTo`, `pretextRelevant`, `attachmentPlausible`, `urgencyCalibrated`,
   `linkCredible` (`04` factor table, lines 29-36). Several have no recon/intel counterpart:
   `addressedTo` and `urgencyCalibrated` are satisfied by what the player *writes*, not by any fact
   they *collect*, so a recon-time readiness slot for them can never tick off intel and is nonsense
   on a tracker ("Urgency calibrated: ???"). 04 defines no mapping from a factor to the intel id(s)
   that would satisfy it — `primedFor` holds `concepts`/`expectedAttachment`/`story` and `trusts`
   (`04:97-104`), but nothing links factor → `intel` id. So `readinessFromFactors: true` is not
   computable from the data 04 defines today.
   *Fix:* derive readiness from the OSINT **prerequisites**, not the craft factors — i.e. the intel
   ids in 02 (`trusts` contact known, `primedFor` topic known, expected-attachment known) that *back*
   the recon-satisfiable factors only. Either give the board an explicit author map
   (`readinessSlots: [{ label, needsIntel: ["pierce_trusts_jed"] }]`) or have 04 publish, per factor,
   the intel id(s) that feed it, and limit readiness to the three recon-fed factors.

2. **[Major] The headline "deterministic progress signal" has no explicit rule or worked example,
   and its answer-reveal risk is unaddressed.** (BRIEF §4; 03 "The loop", "Attack-readiness".)
   The doc sells readiness as "the deterministic progress signal the SecGen lab never gave" but never
   states the rule: which collected intel ticks which slot, the threshold for "ready", or the exact
   string shown. BRIEF §4 requires explicit deterministic rules with a worked example and the exact
   feedback text; 04 models this well, 03 does not. Related: if the checklist mirrors the required
   factors one-to-one and announces "ready → go compose", it risks handing the player the full pretext
   recipe ("you need her trusted contact + expected topic + expected attachment"), which crosses from
   progress signal into revealing the answer — BRIEF asks readiness be "not revealing the answer
   outright".
   *Fix:* add a short rules block + one worked example (Pierce card filling: which 02 intel ids land
   in which slot, when the card flips to "ready", the literal "ready" string). Phrase slots as intel
   gaps, not factor names ("You still don't know what Melanie expects to receive" rather than naming
   the `pretextRelevant` factor), so it nudges without dictating the message.

3. **[Minor] "The loop" is descriptive, not the numbered screen-by-screen walkthrough BRIEF §3 asks
   for.** (03 "The loop".) For a passive tracker this is largely fine, but there is no concrete trace
   of the board filling as facts arrive. Fold the worked example from finding 2 in here to satisfy §3.

4. **[Minor] People-card join key is unspecified and 02's company-site staff carry no id.** (03
   `people:["pierce",...]`; `02:57-60` staff entries have name/role/address/intel but no id;
   `02:64` social uses `"person":"pierce"`; `04:96` target `"id":"pierce"`.) Building one card per
   target by merging company-site staff + social profile + 04 target needs a shared id on the staff
   entry. *Fix:* require a `person`/`id` on 02 staff entries and state the join key in 03.

5. **[Minor] Ch.12 defender mode is only a relabel.** (03 "Reuse across audiences".) "Producing
   Threat Intelligence" (Gray Ch.12) is about turning findings into a product with defensive
   recommendations; re-labelling the same board "what an attacker could assemble about us" is the
   minimum. *Fix:* in defender mode, pair each leaked fact with a one-line "reduce this" note so it
   reads as an intel product, not just a reskin.

6. **[Minor] "persistent panel like the notebook" slightly overclaims.** (03 "Engine wiring", OQ1.)
   There is no always-on tab framework; the notes minigame is itself an openable overlay started via
   `startMinigame`, not a persistent tab. The data persists (finding above), but the panel does not
   live permanently on screen. OQ1's "openable from a case-file object and the phone" default is the
   accurate model; drop the "always a tab" framing or keep it only as the open question it already is.

## Verdict

Majors remain. The board's concept, audience mapping, ethics/scope beat (`scopeNote`, Ch.2),
data-reuse intent and engine wiring are sound and the persistence claim is real; but the readiness
mechanic — the doc's whole reason to exist — is not derivable from 04 as written and lacks the
explicit rule + worked example BRIEF demands. Resolve findings 1 and 2 before this is buildable as
claimed.
