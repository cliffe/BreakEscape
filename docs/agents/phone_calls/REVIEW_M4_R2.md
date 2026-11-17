# Review M4 R2: m04 fixes (dial ring ESD guard, route hub read, call captions)

Reviewer: Opus, 2026-11-12. Reviewed at `5f3cf6ffa`. Live checks on a keyless server on :3023, headless, stopped afterwards. I ran the existing `tools/phone_calls/routes/m04_live.sh` with `OUT` in the session scratchpad, plus one scratch case (`r2_ring_esd`) built on the same helpers. Nothing in the repo changed except this file. n4 (stale Call back after the shutdown) is with the engine sweep and not reviewed here.

## Verdict

**Accept. 0 blocker, 0 major, 0 minor, 3 nits.** Nothing is above a nit. All three fixes are correct and nothing regressed on the paths I drove. The ESD guard closes the case m1 named (the dial read last). A narrower version of the same moment is still possible when the ESD arms during the ring window rather than before it (n1). It needs the engine to re-check a ring's condition, so it goes to the sweep.

## The fixes

| Fix | Check | Result |
|---|---|---|
| m1: `value === true && globalVars.esd_authorized !== true` on the `:903` ring mapping | Read against the three `esd_authorized` mappings (`:1444-1464`). Each sets the flag in the same tick as its trigger, so on a dial-read-last path the flag is already true when the 6 s delay ends and the condition is re-checked (`npc-manager.js:780-808`). | Correct. R1 outcomes' `dial_late` (game 2088) shows no ringer, no banner and no decline or missed text. The hub keeps [About the dial reading.]. |
| n1: `dial_choice` reads the hub's choices | `m04_live.sh:196-199` | Correct. `dial_decline` (game 2121) prints the choice before the callback and `[]` after it. |
| HaX ring `callLabel` "SAFETYNET secure line" | Banner in `dial_decline` and `dial_reload_ring` | "Agent HaX / SAFETYNET secure line / Incoming call". Same as m01 `:760`. The name shows once. |
| Vance `callLabel` "Albion Energy" | `vance_ally` (game 2115) calling screen | "Robert Vance (ops desk)" over "Albion Energy". See below. |

### "Albion Energy" for Vance

It fits. Vance is Albion's operations manager, and he takes the call at the site's control room (his voice style says so, and his lines are "I can sound the evacuation from here"). A caller ID that names the company under a person's name is how a work line shows on a real handset. The site's full name is "Albion Energy Storage" (brief, door sign, aim title), and the ink and ERB call it "Albion" seven times, so the short form reads as the same company. It no longer repeats "ops desk" from his display name. "Albion Energy Storage" would also have fit the caption width. That choice is the writer's, and I'd leave it.

## Late states the ESD guard does not cover

- **Ring offered, then the ESD arms while it rings or waits in the queue: still rings (n1).** The ringer never re-checks the mapping's condition. `npc-manager.js:1677` passes no condition to `phoneRinger.offer`. A ringing offer that a conversation interrupts is requeued (`phone-ringer.js:756`, rows 23-24), and the queue head rings once nothing blocks it (`:780`), with no re-check either way. Live, `r2_ring_esd` (game 2105): with `attack_mechanism_known` and `server_room_reached` set, I read the dial for real. HaX rang at +6 s. While it rang, I set `voltage_neutralised` and emitted it (standing in for Voltage's conversation), and the real `:1446` mapping set `esd_authorized`. The thread then read "…The ESD is live. Press it." and the phone kept ringing. It timed out at 20 s into "Missed call / Call back / Got your reading. Ring me back." That is the m1 sequence, on a narrower path. Answered instead (game 2111), the call gives its four lines on the reading and the reply "Then the dial was the last piece.", which still fits. The window is the 6 s delay (covered by the guard), then up to 20 s of ringing, plus any time the offer waits behind a person-chat. The realistic route is reading the dial in Hall 1 after the attack is mapped, then reaching Voltage in the plant room inside that window, with Relay's Hall 2 challenge lengthening it. That's a speed-run order the lab sheet does not lead to, so this is a nit.
- **After the mission is complete: covered.** `mission_complete` needs `attack_prevented`, which needs the ESD, which needs `esd_authorized`, which needs `anomaly_detected`. The dial can't first be read after the end. The ringer's `close()` (`phone-ringer.js:986`) also drops queued and ringing offers when the ending starts.
- **Reload during the ring: covered.** `dial_reload_ring` (game 2125): after the reload there's no ringer, the thread holds one "Missed call" row and a "Call back" button, and no "Ring me back." text (`!data.reload`). Same as R1.

## Regressions (live, this round)

| Path | Game | Result |
|---|---|---|
| Vance before allying (route's `vance_before`) | 2113 | Call → CALLING → "No answer" row, header stays "Call", not connected. |
| Vance ally | 2115 | Connects on "Vance. What do you need?". The charge-controls topic plays, and End leaves "Outgoing call, 0:11". The second call connects on "Vance." with four choices. |
| Vance KO | 2118 | Rings out to "No answer", not connected. |
| Dial decline → Call back | 2121 | Decline, then "Missed call / Call back / Got your reading. Ring me back." The callback opens "You rang. Good. Straight to it." The hub choice is gone afterwards and the header is cleared. |
| Bring-in blocked | 2128 | "Not with Relay still on you…". "Understood." leaves `mission_complete` false and the task active. Once Relay is clear, the redial gives the optional-items lines with [Bring me in.] / [Not yet. I'm still looking.]. |
| Bring-in clear | 2133 | [Bring me in.] completes `call_in_after_sweep`. "Loading dock. The van with no livery." then [On my way.], with no ending overlay. `mission_complete` true, and the debrief person-chat opens after the call. One `conversation_closed:agent_0x99` this run. The `mission_complete` double is R1's n5, which predates the track. |

## Nits

- **n1 (engine, for the sweep).** A ring's mapping condition is checked only when the offer is made. If the condition stops holding while the call is ringing or queued, it still rings and then leaves its missed text and Call back. In m04, that means the dial ring and "Got your reading. Ring me back." can arrive just after "The ESD is live. Press it." (game 2105, above). Engine fix: carry the mapping's condition on the offer, as `_barkStillValid` does for barks (`npc-manager.js:1129`), and when it fails at ring start, at requeue or at timeout, drop the offer quietly with no row and no missed event. A config stopgap would cut the text but not the ring: add `&& globalVars.esd_authorized !== true` to the decline and missed mappings (`:913`, `:919`). That isn't worth it alone.
- **n2 (config).** HaX calls placed from the hub (bring-in, [About the dial reading.]) caption "Voice call", the fallback (`phone-call-ui.js:29`, game 2133 calling screen). The ring and its Call back say "SAFETYNET secure line". A contact-level `"callLabel": "SAFETYNET secure line"` on `agent_0x99` would make every HaX call match (m01 has the same split). Not voiced, so no re-key.
- **n3 (display).** In calls, Vance's subtitle prefix reads "ROBERT VANCE (OPS DESK): Vance." The display name was kept distinct on purpose (blind run A, `:1508`), and the engine item E3 covers the tie. Leave it until E3 lands, then the contact could be plain "Robert Vance".

## Not checked

The `cipher` queue case (R1, game 2075) was not re-run. The fix touched only the condition, and the queue behaviour comes from the engine. No lab sheet impact. I opened no VM companion or SecGen file.
