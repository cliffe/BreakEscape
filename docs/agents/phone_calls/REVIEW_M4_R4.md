# Review M4 R4: m04 after ringWhile and the banner caption fallback (light round)

Reviewer: Opus 5.5, 2026-11-12. Committed code `7fecbed08`: engine `464c42064` (opt-in `ring.ringWhile`, held calls never dropped, instant player hang-up) with m04's dial ring opting in (`scenario.json.erb:911`), and `45ece8b8a`/`d05dad42d` (banner falls back to the contact `callLabel`). No uncommitted engine or m04 change in the tree. Keyless :3023, own pid file, headless, stopped afterwards. Inputs: `REVIEW_M4_R3.md`, the latest log entries.

**Verdict: accept. 0 B, 0 M, 0 m, 2 n. Nothing is above a nit.** Both R3 minors are fixed live: the ring drops quietly when the ESD goes live mid-ring (R3 m1), and the dial ring banner carries "SAFETYNET secure line" again (R3 m2).

## Live results

Proofs in `proofs/R4_m01_m03_m04/` (`m04_*.txt`, screenshots by case label). Routes: `tools/phone_calls/routes/m04_live.sh`, plus `proofs/R4_m01_m03_m04/m04_esd.sh` for the two ESD cases. That script sets `attack_mechanism_known` as a head start and stands in for Voltage's conversation by setting `voltage_neutralised` and emitting its event, so `esd_authorized` is set by the real `:1445` mapping, not by hand.

| Path | Game | Result |
|---|---|---|
| Vance before allying | 2306 | Call → CALLING → "No answer" row, not connected, header stays "Call". |
| Vance once allied | 2309 | Connects on "Vance. What do you need?". The charge-controls topic plays; End leaves "Outgoing call, 0:11". The second call connects on "Vance." with four choices. One `conversation_closed:robert_vance_phone` per call. |
| Vance KO'd | 2314 | Rings out to "No answer", not connected. |
| Dial ring, declined, called back | 2318 | Banner "Agent HaX / SAFETYNET secure line / Incoming call" (`dial_decline_banner.png`). Decline: "Missed call / Call back / Got your reading. Ring me back." The callback opens "You rang. Good. Straight to it." and plays the reading. Afterwards: rows "Missed call", "Outgoing call, 0:12", the hub's [About the dial reading.] gone, header button cleared, one `conversation_closed`. |
| ESD goes live while the dial ring rings | 2322 | Ringing with the caption. `esd_authorized` true at once from the real mapping; at the next check (about 2 s) ringer and banner are gone and stay gone for 25 s. No row, no `phone_call_missed`, no Call back, no "Ring me back" text. The thread holds only "...The ESD is live. Press it." (`ring_esd_thread.png`). |
| Declined, then the ESD goes live | 2324 | Before: header "Call back", one Missed row. After the mapping sets `esd_authorized`: no header button, no row call button, nothing to press, nothing rings. "The ESD is live. Press it." lands below the missed row. |
| Bring-in, End the mission now | 2328 | The hub choice dials; the optional-items lines, [Bring me in.] / [Not yet...]. Bring me in completes `call_in_after_sweep`, "Loading dock. The van with no livery.", On my way. The overlay lists "Find the OT engineer on shift". End the mission now: `mission_complete` true, the debrief person-chat opens, the phone stays shut 6 s later. One `conversation_closed`. |
| Bring-in, Not yet then Keep going | 2334 | Not yet plays "Fine. The banks will keep.", task stays active. The redial opens "Forensics are almost on-site. Last chance." After On my way, Keep going leaves the call open with `mission_complete` false; End returns to the hub. Ringing again and choosing End the mission now opens the debrief. One `conversation_closed` per call. |

## Lab sheet

`HacktivityLabSheets/_labs/safetynet/m04_critical_failure.md:82` (Vance ringable from his thread), `:281` (answer HaX's call about the reading, or ring back if declined or missed), `:452` and `:509` (bring-in through her thread, Bring me in, On my way, the optional-objectives question) and `:522` (call-in refused while someone is on you) match. Line 281 does not say the Call back goes once the ESD is live; by then the thread tells the player to press it, so I have not raised it.

## Nits

- **n1.** Carried from R3 n1: with the ESD live, the hub still offers [About the dial reading.]. Not re-checked this round; the knot branches on `server_room_reached`, so the call still fits. No action.
- **n2.** Carried from R3 n2: the call subtitle prefix "ROBERT VANCE (OPS DESK):" still waits for E3.

## Not checked

The `bring_blocked` (Relay on you) and reload cases were not re-run; nothing in the engine changes since R3 touches them. I opened no VM companion or SecGen file.
