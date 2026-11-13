# M4 review, round 5 (m04: dial ring drop, Vance, after engine R2 fixes)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `ba1300ab1`. No uncommitted engine or m04 change. Inputs: `REVIEW_M4_R4.md`.

**Verdict: accept, slice closed. 0 B, 0 M, 0 m, 3 n.**

## Validators

- `scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb`: exit 0, schema passes. Warnings are the known onceOnly-overlap, cutscene and two-keys-to-the-workshop ones. Dialogue lint (advisory) flags `m04_phone_agent0x99.ink:258` at 30 words, a text knot, not a call.
- Phone-call check run on its own: **0 issues**. The dial ring's `ringWhile` and `callbackWhen` (`scenario.json.erb:911`) pass the new grammar check: both are `&&` of `globalVars.*` terms, no `||`.

## Live smoke (keyless :3023, headless, server stopped afterwards)

`proofs/R4_m01_m03_m04/m04_esd.sh ring_esd` (head start `attack_mechanism_known`, Voltage's conversation stood in by `voltage_neutralised` and its event, so `esd_authorized` comes from the real mapping) and `tools/phone_calls/routes/m04_live.sh vance_ally`. Output `proofs/R5_m01_m03_m04_m05/m04_*.txt`, screenshots `ring_esd_*`, `vance_ally_*`.

| Case | Game | Result |
|---|---|---|
| ESD goes live while the dial ring rings | 2364 | Ringing with banner "Agent HaX \| SAFETYNET secure line \| Incoming call". `esd_authorized` true from the mapping; ringer and banner gone at the first sample (about 1 s) and still gone at 25 s. No row, no `phone_call_missed`, no Call back, header button null. The thread ends on "...The ESD is live. Press it." |
| Vance once allied | 2354 | Call → CALLING → "Vance. What do you need?" with five choices. The charge-controls topic plays both lines; End leaves "Outgoing call, 0:10". The second call opens on "Vance." with four choices. One `conversation_closed:robert_vance_phone` per call. |

The latch-restore change has nothing to act on here: the dial ring mapping (`scenario.json.erb:903-912`) sets no global of its own.

## Voiced lines re-read

HaX `on_anomaly_confirmed` and its choices (`ink/m04_phone_agent0x99.ink:513-552`), `extract_call` to `extract_go` (:410-489); Vance `support_call` to `support_call_end` (`ink/m04_phone_robert_vance.ink:78-285`). No typos, printed variables or stage directions. Branch openers agree with what follows them.

## Findings

### n1. "ENTROPY feed the control room." can be misheard
`m04_phone_agent0x99.ink:523`. The plural verb matches the mission ("ENTROPY are inside it"), but heard aloud as a clip it can sound like an order. "ENTROPY are feeding the control room." says the same thing without the doubt. Owner's call; if it changes, change it before audio.

### n2. Carried from R4
R4 n1 (hub still offers [About the dial reading.] once the ESD is live; the knot fits) and R4 n2 (subtitle prefix "ROBERT VANCE (OPS DESK):" waits for E3). No action.

### n3. Route prints "no contact robert_vance_phone"
`m04_live.sh vance_ally` tries to reopen the thread while the phone is still on the call, and logs that line before the next step succeeds. Same in R4. Route only.
