# M7 review, round 5 (m03: call from the thread, bring-in, after engine R2 fixes)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `ba1300ab1`. No uncommitted engine or m03 scenario change (only m03's regenerated dungeon graph). Inputs: `REVIEW_M7_R4.md`.

**Verdict: accept, slice closed. 0 B, 0 M, 0 m, 3 n.**

## Validators

- `scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb`: exit 0, schema passes. Warnings are the known onceOnly-overlap and cutscene ones. The dialogue lint is advisory (three long lines, one long text), none of them in a call knot.
- Phone-call check run on its own: **0 issues**.

## Live smoke (keyless :3023, headless, server stopped afterwards)

Route `tools/phone_calls/routes/m07_live.sh` (`call_button`, `bring_clear`). Output `proofs/R5_m01_m03_m04_m05/m03_*.txt`, screenshots `call_button_*`, `bring_clear_*`.

| Case | Game | Result |
|---|---|---|
| Call HaX from her thread | 2357 | After the distcc flag the thread shows "Got the distcc logs. Call me when you're done at the drop-site." and a "Call" header button. CALLING shows "Agent HaX / SAFETYNET secure line" from the first frame (`call_button_calling.png`, the caption fix). Connects on "Logs are up on my side. Open your copy and read along." and plays the ledger, both choice sets and the end line. Afterwards `revelation_heard` true, one row "Outgoing call, 0:21", header button gone, and no fallback ring in 125 s. One `conversation_closed`. |
| Bring-in, Not yet then Bring me in | 2367 | Hub "I'm done in here. Bring me in." dials. "Last look..." plus the safe reminder. Not yet plays "Go on, then. She's not leaving her desk tonight." and leaves `call_in_after_sweep` locked. The redial opens "Still in there. That search team's getting restless." Bring me in completes the task, On my way (no overlay with nothing optional open), "Leave her to us.", then the person-chat debrief. One `conversation_closed` per call. |

## Voiced lines re-read

`ink/m03_phone_agent0x99.ink` `m2_revelation_call` to `m2_revelation_end` (:467-526) and `extract_call` to `extract_go` (:611-650). No typos, printed variables or stage directions. Openers and follow-ups agree across branches.

## Findings

### n1. Route: `glob start_debrief_cutscene` prints the eval envelope
Carried from R4 n1. Still `debrief={"ok":true,"cmd":"eval"}`. The debrief is proven by the person-chat minigame and `victoria_choice_made`.

### n2. `revelation_heard` and `victoria_choice_made` each emit two change events
Both knots set the global twice (`#set_global` and `~ x = true`), so the event log shows each `global_variable_changed` twice at the same moment. Every mapping on them is `onceOnly` with a `value === true` condition, and nothing fired twice. No action.

### n3. Two player choices have no full stop
`[I'll get everything]` and `[We take the whole network down]` (:518-521), where every other choice in the call ends with one. On-screen only (player choices are not voiced). Fix if the knot is touched.
