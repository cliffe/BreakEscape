# Lab puzzle chains, cycle 1 review

Reviewer: fresh Opus, 2026-10-22. Skill: `mission-puzzle-chains`, run as POLISH_PLAN sets it for the lab: gating, key order and the stage chain. The VM and cumulative-kit parts are skipped because the lab is browser-only. The baseline is the scenario-design stage close at a1c2409a, plus d789091e, which only adds the `avatar` fields. Where the R10 findings were written against cycle-3 data (HEAD 3a93e34a), I re-checked each one against the current files.

Everything below comes from `scenario.json.erb` (cited as `erb:N`), the lab ink and the engine. No design document was trusted for a fact.

## Summary

| Severity | Count | Ids |
|---|---:|---|
| Blocker | 0 | |
| Major | 2 | P1, P2 |
| Minor | 7 | P3, P4, P5, P6, F1, F2, F5 |

Both majors are skips in the chain, not dead ends. Each one lets a student reach the credits without doing work the lab's ending then claims was done. There is no soft lock on any route I walked, including every failure route (see "Paths walked").

Suggested order: P1 and P2 first, because they change gates. Then P3 and F5 together (both are about the date-only route), then F1, P4, F2, P5 and P6. All of them except P6 can be fixed in the lab's data and ink alone.

## Boss-key audit

Room depth (`room_depth.py`): engagement_office 0; recon_room, operations_room and blue_team_room 1, each locked off the hub. No empty rooms.

| Lock | Seen at | Key or condition | Key available at | Verdict |
|---|---|---|---|---|
| Recon door (key, `recon_door`, erb:1504-1507) | depth 0, from the start | Ruth, `plan_done` (ruth.ink:144) | depth 0 (whiteboard) | same-room, by design: it's the start-room tutorial beat. **But see P1:** it is gated on the plan and not on the signature |
| Operations door (key, erb:1537-1540) | depth 0 | Ruth, `osint_done and se_intel_username_convention` (ruth.ink:150) | after the Recon work at depth 1, collected back at depth 0 | ✅ boss-key: try the door, hunt in Recon, come back to Ruth |
| Blue Team door (key, erb:1601-1604) | depth 0 | Ruth, `report_filed` (ruth.ink:155) | after the report at depth 0, which needs the Ops work at depth 1 | ✅ boss-key |
| Report workstation (`requiresGlobal`, erb:1489) | depth 0, from the start | `phish_lord_landed` | Ops (depth 1) | ✅ boss-key. **But see P2:** it is gated on one landing of the three |
| Sofia's send (`requiredFactors`, erb:792) | Ops | the page (builder) plus three facts from Dev's call (desk phone) | Ops | same-room AND, by design. The name and team that open the call come from Recon, so the hunt still spans two rooms |
| Melanie's send (erb:733) | Ops | Jed's name, the email pattern, the Friday balance sheet | Recon | ✅ clue in Recon, lock in Ops |
| Chris's send (erb:688) | Ops | careers inbox, `.docx` | Recon | ✅ |

No lock opens before the player has seen it (no key-before-lock). The chain is enforced by four things only: the three door keys and the report workstation's global. The aims are not gates. Every aim uses `aimCompleted` and none is story-gated (`objectives-manager.js:718-722`), so tasks in a locked aim complete and reveal the aim early (`:757-777`). The server's ending checks only `concludeRequires`, which is `{}` here (erb:131; `game.rb:2529-2538`). In practice, **anything not behind a key or the report gate can be skipped or done out of order, and the credits still roll.** P1 and P2 are the two places where that matters.

## Findings

### P1 (major): the whiteboard and the Recon key don't wait for the signature, so Gareth's scene and the rules of engagement can be skipped

- The planning whiteboard has no gate. `case-file` opens straight into the board (`interactions.js:1068-1075`), and `buildEngagementModel` has no prerequisite (`board-model.js:391+`). Both the RoE sheet and the whiteboard are in the start room (erb:1443-1466).
- Ruth hands over the Recon key on `plan_done` alone (ruth.ink:144). Her phone barks "Plan's signed off. The Recon key's ready for you." on `plan_done` alone (erb:1426-1427).
- **Route A (whiteboard first):** the student does the whiteboard before the sheet, gets the key and goes to Recon with no rules of engagement and no signature. The `stop_rule` task (erb:36, completed only by `fairbairn_condition_heard`, erb:1385) stays open. Nothing else in the chain needs it, so the run reaches the credits, which say "Scope: signed by Gareth Fairbairn before anything was sent" with no condition (erb:165).
- **Route B (the likelier one):** the student sorts the sheet, which sets `roe_signed`, then goes straight to the whiteboard without speaking to Gareth. This is exactly what R6 F5 saw a student do. That fix moved the *task* onto Gareth's scene but left the *key* where it was. Once `plan_done` is set, nothing points at Gareth any more:
  - Ruth's hub falls through to "Recon's through the west door" (ruth.ink:175-182: the Gareth line needs `not plan_done`).
  - The phone moves to stage 2 (ruth_phone.ink:48-49, 85).
  - The next pointer is stage 7's "Has Gareth seen the report?" (ruth_phone.ink:225).
  - Gareth's `scenecheck` then runs `payoff` before `sign` (fairbairn.ink:33-34). His first words are "I've read your report. Not one name in it", and only on the *next* open does he say "Right. I'll sign it." After the report, that's absurd. The CMA line ("That signature is the difference between a test and a crime") arrives after the whole attack.
- **Why major:** authorisation before action is the lab's first teaching point, and the credits state it as fact. The open task is the only remaining pointer.
- **Fix (data and ink only):**
  1. ruth.ink:144: `{ plan_done and fairbairn_condition_heard and not recon_key_given:`.
  2. erb:1426-1427: add `&& globalVars.fairbairn_condition_heard === true` to the bark condition. Add a mirror mapping on `global_variable_changed:fairbairn_condition_heard` with `value === true && globalVars.plan_done === true`, as the Operations bark already does (erb:1428-1431).
  3. ruth.ink hub, before :179: `- plan_done and not fairbairn_condition_heard:` → "Plan's good. Gareth still hasn't signed. Take the sheet to him by the window, then the key's yours."
  4. ruth_phone.ink:48 and :85: route on `not (plan_done and fairbairn_condition_heard)` → stage1, with the guard `{ plan_done and fairbairn_condition_heard: -> hub }`. Stage 1's opener already branches on `fairbairn_condition_heard`.
  5. fairbairn.ink:33-34: swap the two lines so `sign` always plays before `payoff`. It is cheap insurance even once the key is gated.
  6. erb:1507 `lockedHint`: "Collect the key from Ruth once Gareth has signed and your plan is done."


  With the key gated on Gareth's scene, which itself needs `roe_signed` (fairbairn.ink:34), doing the whiteboard first no longer skips the signature.

### P2 (major): sending to Sofia first skips the two easy sends

- The desk phone and the page builder are in Operations from the start. The report workstation is gated only on `phish_lord_landed` (erb:1489).
- A student can land Sofia, file the report and finish without ever landing Careers or Melanie. Report Q2's "Every target acted on a message" (erb:1209) and the credits (erb:166) are then false.
- **Fix:** add a `sends_done` global. Ruth's `eventMappings` set it on each landing when the other two are already true (mappings support `setGlobal`, npc-manager.js:808). Back it up with a recheck in Ruth's ink, and point the workstation's `requiresGlobal` at `sends_done`.

### P3 (minor): `call_dev` completes on half the call

- The task ticks on `pretext_call_done` (erb:1397, ruth.ink:123), which either granted ask sets (erb:839-840).
- **Fix:** complete the task only when both intel globals are true, and leave `pretext_call_done` as it is. That keeps clear of C2 N3's objection, which was to moving `pretext_call_done` itself.

### P4 (minor): the link feedback blames the address when something else failed

- Any page under the threshold fails `linkCredible` (phish-rules.js:316-321), including one sent with "Attach anyway" (builder :676-678).
- The fail line, the `wrong` hint (erb:800, 814) and lord_mail.ink:171 all blame the address, even when the domain is a tier-3 look-alike and the real fault is elsewhere.
- **Fix:** reword the line and the hint to "the page didn't pass the builder's score for her".

### P5 (minor): the throwaway address can be skipped, and Ruth then repeats one line

- Chris can be landed from the guest account (`from_own`, trusts `*`, `senderAuth` advisory; erb:684-689). That leaves `test_account` open.
- Ruth's hub line "Make your throwaway address before you write to anyone" (ruth.ink:183) then shows at every later stage.
- **Fix:** gate the line on `not phish_hampshire_landed`.

### P6 (minor, engine): a later call overwrites a successful one

- The latest call's outcome replaces the earlier ones (person-chat-pretext.js:336-355).
- A check-in call after both facts are held turns `got_it` into `walked_away`. That changes the report's call row (engagement-report-minigame.js:199-210) and sends Tomasz to his `else` line.
- **Fix:** once `got_it` has been reached, keep it.

### F1 (R10, minor, agreed): the first failed send to Sofia gets no hint

- By engine design, a hint appears only after an earlier miss (mail-bridge.js:608).
- **Fix (data):** add the service-desk pointer to Sofia's `senderTrust` fail and mismatch lines (erb:796).

### F2 (R10, minor, agreed): the builder headline contradicts "no service chosen yet"

- The headline is the default `gateBrand` string (landing-page-model.js:74).
- **Fix (data):** override `gateBrand` in `landingPages[0].strings` (erb:1095) with a line that is true whether the service is unset or wrong, and says "she", not "they".
- Noted, no change proposed: the lab has one brand (erb:1067), so "Which service?" is a single click. Add a decoy brand only if the OSINT gives a reason for one.

### F5 (R10, minor, up from trivial): the "which system" blank can dead-end

- The empty-blank line is a fixed, deliberately neutral engine constant (phish-rules.js:42).
- The only evidence a student can find by hunting is the Xero decoy.
- **Fix:** P3, plus a choice on the phone at stage 5 that points an empty "which system" blank to Dev.

## Paths walked (no dead end)

- **Dev reports a call:** a 2-minute channel lockout, and influence resets on each new call.
- **Repeated failed sends:** influence doesn't gate mail, and the `_wary` globals are unused.
- **Failed triage:** there is a "Try again".
- **Wrong report and SOC picks:** both can be changed.
- **Date → reported → portal:** ends with `got_it`, and the report reads it as two calls.
- **Reload:** the reply job queue and the mid-call session both persist. The keys and Gareth's scenes are idempotent tunnels.

## Browser checks

1. **Cycle 5, the namesake send to Melanie.**
   - "Jed Baker" with the Leeds address shows the neutral mismatch line. The second miss shows the hint with "at that person's real address".
   - The phone's answer to "I'm sending as Jed and she still says no." names both causes.
   - Also try "J. Baker" with `j.baker@ledgerwell.example`, and note which line shows.
2. **Cycle 5, Melanie landed first.** The phone stays on stage 3 with Chris's hints. Ruth says "Delivered isn't landed" and offers `topic_account`. No Sofia line shows until Careers lands.
3. **Cycle 5, date → reported → portal.**
   - Ruth's lockout line appears, and a call during the 2 minutes is refused.
   - The report row reads "An earlier call was reported…".
   - Tomasz says "Dev reported one of your calls — credit to him…".
   - The credits say "Service desk: one call was reported; a later call still got what the email needed".
4. **P1 route:** sort the sheet, then go to the whiteboard without seeing Gareth. Does Ruth hand over the key, and does the bark fire?
5. **P2 route:** land Sofia before Melanie, then try the report workstation.
6. **"Attach anyway"** with a tier-3 domain and no brand chosen, then send to Sofia. Read the line and the hint.
7. **Reloads:** inside the reply window after a landing send, and mid-way through a Dev call with an ask pending.
8. **Chris landed from the guest account:** note which line Ruth's hub shows afterwards.

---
*The reviewer's write was cut off by a safety-classifier stop at P1's fix list. From the "With the key gated" paragraph on, the orchestrator completed this file from the reviewer's hand-back, which held every finding.*
