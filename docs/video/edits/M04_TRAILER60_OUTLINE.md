# m04 Critical Failure: 60 s trailer outline

Planning only (2026-11-22). Form follows `M03_TRAILER60_V3_PLAN.md`. Line timings and cached audio are for the scout to check. Paths are under `scenarios/m04_critical_failure/`.

## 1. Story

ENTROPY's Critical Mass cell got into Albion Energy Storage as a fake maintenance crew. They now hold the SCADA network for 200 MWh of grid batteries, and they have faked the temperature sensors and armed an overcharge trigger for 0800. You arrive in the small hours as the grid-safety regulator, four hours early. The screens say the racks are fine, and an old dial on the wall says they are not. You lift the duty engineer's print to get through the plant-room door, work the jump server in the workshop, and fight past the operatives to reach the one control they could not take: a hardwired red button. Voltage is standing between you and it.

## 2. Threat

Critical Mass want the lights out, and they have done the sums. They have bypassed the safety interlocks on all three rack banks, so the hall burns, the hydrogen goes and 240,000 people lose power (`scenario.json.erb:7-12`, briefing `ink/m04_opening_briefing.ink:109-111`). Voltage, the field lead, has costed the night crew (`:134`). Social Fabric are timed to strike across the region at 0800 (`:246`).

## 3. New mechanics

What m04 adds that m01, m02 and m03 do not have (checked by grepping all four `scenario.json.erb` files):

| Mechanic | Evidence | Notes |
|---|---|---|
| **Fingerprint dusting and the biometric door** | plant room `lockType: "biometric"`, `requires: "Robert Vance"` (`scenario.json.erb:2654-2655`); kit in the tool case (`:2066`); Vance's print on the Duty Round Panel (`:2404-2412`); Voltage's print on the bypass module (`:2601`); engine `public/break_escape/js/minigames/dusting/`, `biometrics/` | None of m01 to m03 has `biometric`, `fingerprint_kit` or a dusting surface. **Gets the card.** |
| Emergency Shutdown pushbutton | `type: "emergency-button"`, `interactionType: "esd_button"` (`:2803-2850`); minigame `minigames/esd-pushbutton/` | The finale control. Filming the press is an outcome; the button itself, unarmed, is fine. |
| Lying telemetry versus a real instrument | analogue thermometer (`:2320-2348`) beside the rack status panels that read 28 °C (`:2352-2362`) | Puzzle, good for the puzzle beat. |
| Trigger race countdown and rack tint | `timers` with `trigger_race` (`:2970-3010`), `tint_objects` pulsing the racks red (`:3028`) | Countdowns are not new (m02 has `showCountdown`); the red rack pulse is. |
| Several hostile operatives at once | Relay, Cipher, Static, Voltage, each with `hostile` (`:745`, `:1666`, `:1709`, `:2244`, `:2507`, `:2687`) | Combat exists from m01; four armed operatives is the new scale. |

Card: **`Fingerprint / Dusting`**, then about 4 s of it: dust the round panel, the print comes up, then the plant-room reader takes it and the door opens.

## 4. Music

Taken: m01 Midnight Cipher Chase, m02 Steel Shadows in E Minor, m03 Shadow Code 1; m04's own credits use Safetynet in the Smoke (held for the whole-game trailer). Candidates for analysis:

1. SpyAgro `Hybrid Attack 1.mp3`: harder edge, suits a fight and an industrial site.
2. SpyAgro `Shadow Protocol (Remastered).mp3`.
3. SpyAction `Emerald Trigger.mp3`: a "trigger" for a trigger race, if the others are too busy under dialogue.

## 5. Beat sheet (middle 46 s between the presets)

The whole mission is one night (the gate guard says "Morning. Bit early for visitors.", `ink/m04_npc_security_guard.ink:63`; the trigger is 0800), so there is no day/night split. Group by threat instead: calm and cover first, then the dial turns it, then the clock runs. Lighting changes on `anomaly_detected` and `clock_started` (`scenario.json.erb:1894-1895`, `:2199-2200`), so keep pre-dial shots before post-dial ones. Every line: **audio: check**.

| # | Section | Shot | Entry state | Line (speaker) |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | briefing portrait | fresh game, `opening_briefing_cutscene` | Director Magnus Netherton: "Agent 0x00. ENTROPY used to steal. Now they break the things people can't live without." Fallback, Agent HaX: "They want the lights out, and they've done the sums." |
| 2 | Card | `Mission 4 / Critical / Failure` | | |
| 3 | Stakes | Nightshade portrait | same briefing | Agent 0x47 'Nightshade': "If they reach the safety interlocks, this stops being a hack and starts being a body count." (cut the opener "The physics doesn't lie and neither do I." if long) |
| 4 | Cover | straight walk to the gate guard, his line | `main_entrance`, `briefing_played` | Security Guard: "Regulator, is it." |
| 5 | Card | `Screens / Lie` | | |
| 6 | Puzzle | rack status panel (all green, 28 °C), cut to the analogue dial on the Rack Bank C wall, the hint "The dial reads 61 degrees C. The SCADA screen says 28." | `battery_hall_1`, Level 1 card held (cloned from Vance) | none (text beat; the 61/28 figures are the puzzle's clue, not an answer to a lock) |
| 7 | Card | `Fingerprint / Dusting` (new mechanic) | | |
| 8 | Mechanic, about 4 s | dust the Duty Round Panel, print appears; plant-room reader accepts it; door opens; one straight step through | `fingerprint_kit_found`, kit in inventory (`--give`), `battery_hall_2` reachable; door needs Vance's print collected (`fingerprint_collected:robert_vance`) | none |
| 9 | Card | `Real / Hacking` | | |
| 10 | Hacking | straight walk to the workshop VM station; console footage (placeholder until the console take) | `engineering_workshop` unlocked (Level 2 card) | none. Story only: the crew's back-in SSH on the BMS jump server (`scenario.json.erb:82-89`); console planned elsewhere |
| 11 | Card | `Before / 0800` | | |
| 12 | Action | Relay on patrol in the inverter room turns hostile and charges; the player fights; racks pulse red | `battery_hall_2`, Relay hostile (`:2507`), `hydrogen_alarm` for the red pulse | Security Guard (alt take, entrance): "Hey. Where do you think you're going?" if Relay has no shout line |
| 13 | Crescendo | every minigame: key lock on the OptiGrid case, RFID clone off Vance, dusting, biometric reader, phone chat, flag station (empty), CyberChef, ESD panel showing "NOT ARMED"; face flashes for Vance, Cipher, Static, Ibrahim, Joanne | assorted, see Risks | Vance J-cuts in: "My hydrogen readout's still climbing." |
| 14 | Villain | Voltage in the plant room: wide, then the close-up | `voltage_fight_started` not set; Voltage's `start` knot after `anomaly_detected`; route to his reasoning knot (`ink/m04_npc_voltage.ink:216-258`) | Voltage: "There's no version of this where I blink. You should have worked that out on the way in." |

Out: Voltage's casualty lines (`:239-243`), Vance's "Nine." line, any credits or ESD "ISOLATED" screen.

## 6. Cards

- `Mission 4 / Critical / Failure` (three lines, as m03)
- `Screens / Lie` (alt `The Racks / Are Lying`)
- `Fingerprint / Dusting`
- `Real / Hacking`
- `Before / 0800` (alt `Hold the / Grid`)

## 7. Ending

1. Voltage: "There's no version of this where I blink. You should have worked that out on the way in." (`ink/m04_npc_voltage.ink:258`). Cold, personal, says the fight is coming without showing it. Natural pause after "blink" to cut to the close.
2. Voltage: "Then you'll have to be faster than one keystroke." (`:348`). Shorter and a dare, but it sits after a choice (fight or button), so the scout must film it without the menu.
3. Voltage: "We didn't make it fragile. We just stopped pretending it wasn't." (`:222`). The ENTROPY creed in one line; less threat to the player.

## 8. Spoiler notes

Off screen: the job card's port and the jump-server address (`scenario.json.erb:2077`); flag values; the OptiGrid case pins; any ESD outcome ("ISOLATED - COOLING ACTIVE"), the choice menus with Voltage (fight, arrest, let him run), Static standing aside, Cipher walking off; the debrief and credits (MISSION COMPLETE / COSTLY SUCCESS); casualty figures (Voltage's "forty-odd", the credits' crew lines). On screen is fine: Voltage's face and name (named in the briefing), the 61 °C dial against 28 °C (it is the clue, and the trailer sells the puzzle), the unarmed ESD panel text, the red-pulse racks.

## 9. Risks

- **Dusting take:** the print must be collected before the reader opens. Needs the kit in inventory and a real dust gesture in the minigame through synthetic input (no prior take of the dusting minigame exists). Biometric reader flow is a second minigame; plan one chain take.
- **Order of rooms:** the plant room hangs off Hall 2, behind Relay's Level 1 door; the workshop needs Relay's Level 2 card. Head-start flags or `--give` for both cards.
- **Relay's charge:** `aggroDistance 96`, `chaseSpeed 100`; a straight walk into range must trigger it without the player walking into him. Combat on headless physics needs the throttle (`window.__test.throttleFps(20)`).
- **Red racks:** `tint_objects` runs from a timer action; filming it needs `hydrogen_alarm` set through the timer, not just the global. Check whether setting the global repaints the racks.
- **Lighting phases:** ambient changes on `anomaly_detected` and `clock_started`; keep shots 4 to 8 before the clock, 12 to 14 after it, or the colour jumps.
- **Voltage's line:** the knot sits behind dialogue choices; one take can get both ending lines if the route is planned. Never film the menu.
- **ESD in the crescendo:** only the unauthorised panel; check its text holds no hint the player should earn.
- **Cached audio:** none of these lines is checked; Nightshade and Netherton may be uncached. New lines need the user's yes and a count.
