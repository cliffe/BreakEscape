# m04 pass 5: alignment review, round 1 (partial)

2026-10-13. Opus reviewer, read-only, static only. **Partial:** a safety check stopped the run before it wrote this file (it gave no reason; the reviewer was reading the engine's toast-expiry code at the time). The orchestrator saved this from the reviewer's hand-back. Not covered: the Vance phone ink, the validator run, room-layout checks. A second pass hasn't verified these findings.

Provisional counts: **0 blockers, 6 majors, at least 11 minors.**

## Majors

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| A1 | Voltage offers "the button or me" before the button can work. The plant room can be reached before the VM flags; "Go for the button and let him run" loses Voltage, then the ESD isn't armed | `m04_npc_voltage.ink:249-274`, erb:1876-1880 | Offer the button stance only once `attack_mechanism_known` and the dial read are both true; before that, fight, arrest or back off |
| A2 | Music forgets the story phase: it resets on reload and after every fight. Only two `game_loaded` cues; `all_hostiles_ko` always returns to noir; no cue when the clock starts | erb:84-126 | m03's phase-conditioned `game_loaded` / `all_hostiles_ko` cues, plus a cue on `attack_mechanism_known` |
| A3 | No sight challenges: the guard, Cipher and Static react only when spoken to, so the player can walk past all three | erb:518-538, 1463-1509, 1815-1845 | `los.challengeOnSight` as m03's Terry (m03 erb:1618-1636); skip the guard's once `guard_admitted` (synced); open Static's challenge on plant-room entry, as Relay's is on Hall 2 entry |
| A4 | The ESD sets `mission_complete` and the debrief opens at once, so the dock, go-bag and directive lore are lost to a player who presses first | erb:1888, 1101-1108 | m03's call-in: the ESD sets `attack_prevented`, HaX texts "sweep, then call me", a hub "Bring me in" sets `mission_complete` |
| A5 | HaX's hub isn't progress-gated to m03's standard ("PHASE 4 will rebuild this"); no specific hints for the guard, cloning Vance, the dial, the plant reader and print, Relay's standoff, Voltage, the trigger race, after the ESD | `m04_phone_agent0x99.ink:83-129` | m03-style gated hints that retire once used, guides folded into one choice, a "Where do I stand?" fallback, the `greeted` root divert, `server_room_advice_given` synced |
| A6 | Canon: Voltage labelled the cell leader, against the briefing, his own line and the bible (Blackout leads Critical Mass) | erb:1759, 358, 153; `m04_opening_briefing.ink:137-139`; `m04_npc_voltage.ink:233` | "Voltage (Critical Mass)" or "field lead" everywhere |

## Minors

- The credit "BLACKOUT: signed the casualty model" (erb:165) shows unconditionally, though Blackout may only be in an optional briefing topic.
- "ALL ELEVEN WALKED OUT" (erb:147, debrief:287) plays even when the guard was KO'd; the count of eleven leaves Vance out.
- No credits line for the guard KO (the debrief has one) or for keeping the cover with Vance.
- `player_approach` is set in the briefing and never read.
- Voiced lines print variables: `{operatives_defeated}` (phone:554), `{player_name()}` throughout the phone ink.
- `operative_down_advice` says "both halls clear, only one left" while Static is still up (phone:187 vs :672).
- HaX texts without `skipIfGlobal` can go stale: erb:652, 702, 966, 1015, 960-961.
- The privesc flag has no story reaction; the flag rewards `emit_event` and nothing listens (erb:1312-1333).
- The credits track "Ghost in the Wire" repeats m01 and m03 (erb:136); "Safetynet in the Smoke" is unused.
- Vance's "What should I be doing?" always says "go to the ESD" (vance:371).
- "The Architect's Directive" item is really Voltage's operation log (erb:1911).

Canon with m03 and m05 is otherwise consistent: the m03 directive (grid storage, Zero Day supplies, Critical Mass executes), the St Catherine's ProFTPD callback, the fingerprint kit carried into m05. Task Force Null is set up in m04 but never mentioned in m05.

## Decisions for the user (reviewer's recommendations)

1. Let the player warn the nine night crew in Hall 2 (for example, Vance offers to sound the evacuation, which alerts the cell or starts the clock early), so the casualties depend on a choice. Recommended: yes.
2. Replace the ESD's instant debrief with m03's "sweep, then call in". Recommended: yes (mission-local).

No engine changes needed.
