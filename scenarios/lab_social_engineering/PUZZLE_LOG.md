# Lab puzzle chains, fix log

Fixer for the puzzle-chains stage. Resume between cycles; keep context here.

## Cycle 1 (fixes against PUZZLE_REVIEW_C1.md)

Baseline: working tree at session start (post scenario-design close a1c2409a + avatar adds).
All findings from PUZZLE_REVIEW_C1.md actioned. P6 is the one engine change
(person-chat-pretext.js); everything else is lab data and ink only.

| Id | Sev | Finding | Outcome |
|---|---|---|---|
| P1 | major | Whiteboard/Recon key don't wait for Gareth's signature; his scene and the RoE can be skipped | **Fixed.** Recon key + its barks + phone stage 1 + hub pointers now gate on `fairbairn_condition_heard` as well as `plan_done`; fairbairn scenecheck plays `sign` before `payoff`; recon_door `lockedHint` reworded. |
| P2 | major | Sending to Sofia first skips the two easy sends; report gate was one landing of three | **Fixed.** New `sends_done` global, set by three Ruth eventMappings (one per landing, each checks the other two) with an ink recheck backup; report workstation `requiresGlobal` → `sends_done`; lockedMessage reworded. |
| P3 | minor | `call_dev` ticked on half the call (either granting ask) | **Fixed.** Task now completes only when both `se_intel_lord_portal_name` and `se_intel_lord_payslip_date` are held (two eventMappings + ink recheck). `pretext_call_done` left as-is. |
| P4 | minor | Link feedback blamed the address when the real fault was the builder score | **Fixed.** Reworded lord `linkCredible.fail`, the `wrong` hint, and lord_mail.ink's below-threshold reply to point at the page/score, not the address. |
| P5 | minor | Throwaway address skippable (Chris from guest acct), then Ruth repeats a line forever | **Fixed.** The "make your throwaway address" hub line now also gates on `not phish_hampshire_landed`, so it stops once Chris is landed by any route. |
| P6 | minor (engine) | A later call overwrote a successful one: `got_it` → `walked_away` | **Fixed.** `finalisePretext` now keeps `got_it` sticky across calls (a later call may upgrade to it, never downgrade from it) and does not advance the hint ladder once `got_it` is recorded, so the report row and Tomasz's debrief stay consistent. Two Node tests added; awareness E3 call bridge + slice call bridge re-run clean. |
| F1 | minor | First failed send to Sofia got no hint (engine shows a hint only after a prior miss) | **Fixed (data).** Added the service-desk pointer to lord's `senderTrust` fail and mismatch strings, so the first miss already carries guidance. |
| F2 | minor | Builder headline (default `gateBrand`) contradicted "no service chosen yet" and said "they" | **Fixed (data).** Overrode `gateBrand` in `landingPages[0].strings` with a line true whether the service is unset or wrong, using "she". |
| F5 | minor | The "which system" blank can dead-end (only the Xero decoy is findable) | **Fixed.** P3 (above) plus a new phone stage-5 choice that names the Xero decoy as the finance tool, not the payslip portal, and points to Dev for the real name. |

### Residual / noted, not changed this cycle
- Ruth's hub line "Sofia checked... write it up at the report workstation" still fires on `phish_lord_landed` alone. In normal order Sofia is the last send, so this reads correctly; on the skip-to-Sofia route the workstation's locked message redirects. A cleaner gate on `sends_done` would need a VAR in ruth.ink. Left for a later cycle.
- Pre-existing dialogue-lint ERROR at `fairbairn.ink` (Ruth's CMA line, 28 words > 25 cap) and its phone-self-prefix WARN. The line is unchanged by this cycle and is a voiced line (changing it costs TTS / belongs to the dialogue stage), so not touched.

### Verification run
- Ink recompiled: ruth, ruth_phone, fairbairn, lord_mail (all compile; only the pre-existing END-tag warnings on dev/tomasz).
- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --strict-social` → exit 0 (no social lint errors; pre-existing fairbairn:68 word-count ERROR only).
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_social_engineering/` → only the pre-existing fairbairn:68 findings; no new ones.
- `bin/test-js` touched areas + lab tests: social-pretext-session (new P6 tests), social-pretext-debrief, social-engagement-report, npc-manager-triggers, social-lab-ruth-keys / -ruth-phone-keys / -ruth-payoff-lines / -fairbairn-scenes — all pass. Three lab tests were updated to carry `fairbairn_condition_heard` where they assume past-authorisation state (the new P1 gate), and a new `social-lab-ruth-keys` test locks in "Recon key withheld until the signature".
- Full `social-*` + `validator-social-*` JS suite: 84/85 pass. The one failure (`social-p7-followups` E7 debrief copy) is an awareness-track test, unrelated to this stage (the e7 defend shell matches HEAD; the test does not import person-chat-pretext.js).
- Lab bridges (Node 24, keyless :3001): bridge-6 36/36, bridge-r4-door 3/3. bridge-5 29/29, bridge-5-600 9/9, bridge-e3-full 21/21 (pretext engine change sanity across scenarios).
  - Bridges updated for deliberate gate changes: **bridge-6** RP0 now sets all three landings + `sends_done` (was only `phish_lord_landed`) so the report workstation opens under the P2 gate; **bridge-r4-door** asserts the new recon_door `lockedHint` text (P1).
