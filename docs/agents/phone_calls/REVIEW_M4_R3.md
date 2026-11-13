# Review M4 R3: m04 after the engine sweep (light, post-sweep)

Reviewer: Opus, 2026-11-12. Reviewed at `ff4f929ee` (sweep `752d9d612`, `88862563c`, `40a15667c`; m04 `callbackWhen` and HaX contact `callLabel` `4e5f7cd12`). Committed code only: the tree had no uncommitted engine or scenario change, just regenerated dungeon graphs. Keyless server on :3024 with its own pid file, headless, stopped afterwards. Routes: `tools/phone_calls/routes/m04_live.sh` with `OUT=docs/agents/phone_calls/proofs/PS_m04_m06_m08`, plus two scratch cases (`ps_decline_esd`, `ps_ring_esd`) built on the same helpers. The scratch cases set `voltage_neutralised` and emit its event, standing in for Voltage's conversation, so `esd_authorized` is set by the real `:1446` mapping. No code changed.

## Verdict

**Two minor findings, no B or M.** Everything the sweep was meant to keep working still works: Vance in all three states, decline and call back, the bring-in both ways, one `conversation_closed` per call. `callbackWhen` clears the Call back when the ESD goes live. Two things fall short. Sweep item 8 does not reach m04's dial ring, which was the case it was built for (m1). And moving HaX's `callLabel` to the contact took the caption off the incoming ring banner (m2).

## Live results

| Path | Game | Result |
|---|---|---|
| Vance before allying | 2203 | Call → CALLING → "No answer" row, header stays "Call", not connected. Unchanged from R2. |
| Vance once allied | 2210 | Connects on "Vance. What do you need?". Charge-controls topic plays, End leaves "Outgoing call, 0:11". The second call connects on "Vance." with four choices. One `conversation_closed:robert_vance_phone` per call (two calls, two events). |
| Vance KO'd | 2207 | Rings out to "No answer", not connected. |
| Dial ring, declined, then called back | 2215 | Banner, Decline, then "Missed call / Call back / Got your reading. Ring me back." The callback opens "You rang. Good. Straight to it." and plays the reading. Afterwards: rows "Missed call", "Outgoing call, 0:12", the hub's [About the dial reading.] is gone and the header button is cleared. One `conversation_closed:agent_0x99`. |
| Dial ring declined, then the ESD goes live | 2221 | Before: header "Call back". After the real mapping sets `esd_authorized`: header button gone, no contact-row call button, pressing finds nothing, ringer empty, no call. "The ESD is live. Press it." lands below the missed row. `callbackWhen` works. |
| ESD goes live while the dial ring is ringing | 2225 | **Still rings.** `esd_authorized` true 1 s into the ring; the ringer stays `ringing` for the rest of the 20 s, then rings out into "Missed call / Got your reading. Ring me back." under "…The ESD is live. Press it." (`phone_call_missed:agent_0x99` fired). The only gain over R2 is that no Call back is left. See m1. |
| ESD goes live while the ring is queued | not run | Same function decides it (`ringConditionHolds` on the queued head), so the same result follows from the code. Not worth a run once m1 is known. |
| Bring-in blocked (Relay on you) | 2233 | "Not with Relay still on you. Lose her or put her down, then call." [Understood.] leaves `mission_complete` false and the task active, row "Outgoing call, 0:07". Once Relay is clear, the redial gives the optional-items lines with [Bring me in.] / [Not yet. I'm still looking.]. |
| Bring-in clear | 2238 | CALLING screen caption "SAFETYNET secure line" (`bring_clear_calling.png`). [Bring me in.] completes `call_in_after_sweep`, "Loading dock. The van with no livery.", [On my way.], no overlay (nothing optional open). `mission_complete` true, the debrief person-chat opens and the phone stays shut 6 s later. One `conversation_closed:agent_0x99`. |

## Findings

**B:** none. **M:** none.

**m1. Sweep item 8 skips the m04 dial ring, so R2 n1 is not fixed.** `NPCManager.ringConditionHolds` (`npc-manager.js:565`) re-checks a condition only when every `&&` term starts with `globalVars.`; otherwise it keeps the ring. The m04 ring mapping's condition is `value === true && globalVars.esd_authorized !== true` (`m04 scenario.json.erb:905`). `value === true` reads event data, so the whole condition is treated as unknowable and the ring is never dropped. Live (game 2225, `proofs/PS_m04_m06_m08/m04_runs.txt`): the page reports `_ringRecheckCondition(...)` returns the full condition and `ringConditionHolds(...)` returns `true` with `esd_authorized` already true. The player still hears the phone ring after "Press it." and gets "Got your reading. Ring me back." Same path and rarity as R2 n1 (dial read after the attack is mapped, Voltage reached within about 26 s). It is minor now only because the sweep item was supposed to close it and does not.
- Config fix (m04 fixer, smallest): write the condition as `globalVars.anomaly_detected === true && globalVars.esd_authorized !== true`. On `global_variable_changed:anomaly_detected` that means the same at offer time, and every term is then `globalVars.`, so item 8 drops the ring quietly with no row, no missed event and no text. No audio change.
- Engine note for the sweep reviewer, wider than m04: the same rule also skips any condition with a `!globalVars.x` term, since `/^globalVars\./` does not match the `!`. Of the HaX-style rings, only m05's Recruiter conditions pass. m03's revelation rings (`!globalVars.revelation_heard`) and every m07 Architect ring (`value === true && !globalVars.grid_saved ...`) are never re-checked. Accepting `!globalVars.` terms, and reading `value` on a `global_variable_changed:<v>` mapping as `globalVars.<v>`, would widen item 8 to what the README promises. Whether those missions need it is for their own rounds.

**m2. The ring banner lost "SAFETYNET secure line".** R2 saw "Agent HaX / SAFETYNET secure line / Incoming call" on the dial ring. `4e5f7cd12` moved the label from the mapping to the contact. The ring offer only carries the mapping's label (`npc-manager.js:1722`, `callLabel: config.callLabel || null`), and the banner draws `view.callLabel` only (`phone-ringer-dom.js:125`, `:164`). So the banner now reads "Agent HaX / Incoming call" with no caption (`dial_decline_banner.png`, games 2215, 2221, 2225). The call screen itself is fine because `callLabelFor` falls back to the contact (`phone-call-ui.js:29`), and hub calls show the caption. The same gap applies to every HaX ring in m03 to m08 that relied on the contact label. m01 keeps a mapping-level label on its ring (`m01 scenario.json.erb:761`), so its banner is unaffected; m08's tutorial-era HaX ring and m09's rings would need checking in their own rounds. Fix in the engine (one line): `callLabel: config.callLabel || npc.callLabel || null` at `:1722`, keeping the withheld guard in the banner. Or, for m04 alone, put the mapping-level label back on the dial ring. The engine fix is better, because the CALLLABEL work assumed the contact label covered the ring.

## Nits

- **n1.** With the ESD live, the hub still offers [About the dial reading.] (game 2221). It was like this in R2 (`dial_late`), and the knot branches on `server_room_reached`, so the call still fits. No action.
- **n2.** R2's n3 (call subtitle "ROBERT VANCE (OPS DESK): ...") is unchanged and still waits for E3.

## Not checked

The tutorial hold cap and the terminal read beat (sweep items 9 and 10) do not touch m04's calls: m04 uses the handset look, and its dial ring comes long after the tutorial. Bring-in reload and `cipher` queue cases were not re-run. No lab sheet impact. I opened no VM companion or SecGen file.
