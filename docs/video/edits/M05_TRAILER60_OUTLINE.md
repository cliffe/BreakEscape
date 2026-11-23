# m05 Insider Trading: 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Ending:** the Recruiter, "Everyone has a price, agent. I'm asking what yours is." (existing).
- **Twist:** keep Torres hidden, off screen throughout (owner: "Keep him hidden").
- **Hook:** Netherton, as in the table.
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

Planning only (2026-11-22). Form follows `M03_TRAILER60_V3_PLAN.md`. Line timings and cached audio are for the scout to check. Paths are under `scenarios/m05_insider_trading/`.

## 1. Story

Someone inside Quantum Dynamics, a Home Office contractor near Cambridge, is handing ENTROPY the keys to the 999 dispatch network. You go in on a Wednesday afternoon as a security consultant, with four hours before the final upload. Eight vetted people, and one of them should not be. You read the badge logs, clone a lanyard, lift a print and break the research portal, while the evidence points at the wrong person first. After hours the lights go out floor by floor, and ENTROPY's Recruiter rings you to make an offer.

## 2. Threat

ENTROPY's Insider Threat Initiative has recruited an employee to steal Project Heisenberg, quantum-safe key material and the key-rotation windows for the national emergency dispatch rollout. Holding the keys in a rotation window lets them force calls onto a slower path: "Every ambulance, fire and police call through it runs six to eleven minutes slower." (`ink/m05_insider_trading_opening.ink:142`). The Recruiter runs it through a headhunting front with more placements in the pipeline (`:188-190`).

## 3. New mechanics

m05 brings no new minigame. Picks (m01), the RFID cloner (m03) and the print kit (m04) all arrive in the start kit (`scenario.json.erb:34`, HaX at `ink/m05_insider_trading_opening.ink:247`). What it first introduces:

| Mechanic | Evidence | Notes |
|---|---|---|
| **The insider hunt: name a suspect, with a reason** | aim "Put a name to it, with a reason" (`scenario.json.erb:422-423`); Patricia offers only the names the player has a reason for, then a reason menu, and a wrong name or reason costs her trust (`ink/m05_npc_patricia_morgan.ink:382-530`); a red herring, Dr Halloran, whose suspension changes the ending (`scenario.json.erb:63-76`) | m01 and m02 have an accused flag (`kevin_accused`, `accused_wrong_suspect`). The reasoned naming with decoys is new. **Gets the card.** |
| Badge-log deduction | the after-hours swipe log (`scenario.json.erb:99`, object `server_door_log` at `:2075`); Owen's tip "a spare only tells you which card" (`ink/m05_npc_owen_gallagher.ink:379`) | The puzzle under the naming. |
| Fingerprint matching against four reference cards | `fingerprintCandidateCount: 4` and a `pattern: "loop"` decoy on the mug (`scenario.json.erb:2283-2286`; engine `dusting-game.js:1136`) | First use of the count. A harder version of m04's dusting. |
| Lights that time out after hours | corridor and rooms switch to `motion`, `offAfter` with a dark ambient once the suspect is named (`scenario.json.erb:1764`, `:2117-2121`) | The night turn. `offAfter` exists in m01 to m03; m05 uses it as a day-to-night switch. |
| Exfiltration on the research portal | Bludit VM, four flags (`mission.json` `vm_integration`) | The real-hacking beat. |

Card: **`Name the / Insider`**. The beat (about 4 s) shows the deduction working, not the menu: the badge log zoomed onto the spare-badge rows, then Patricia's demand, then the cut. Whether this counts as "start to finish" is the open question for the user (see Risks).

## 4. Music

Taken: m01 Midnight Cipher Chase, m02 Steel Shadows in E Minor, m03 Shadow Code 1; m05's own credits use Cipher Tide. Candidates:

1. SpyAction `Midnight Double Agent.mp3`: a mole hunt with a turn-him option.
2. Noir `Encrypted Shadows.mp3` (analysed for m02 at 99 BPM, unused): quieter, suits a whodunnit.
3. Noir `Midnight Exit Strategy.mp3`.

## 5. Beat sheet (middle 46 s between the presets)

Day is the afternoon before the naming; night is after `torres_identified`, when the lights time out. Day shots first, then the turn. Every line: **audio: check**.

| # | Section | Shot | Entry state | Line (speaker) |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | briefing portrait | fresh game, `opening_briefing` | Director Magnus Netherton: "Someone inside a Home Office contractor is handing ENTROPY the crown jewels." Fallback, Agent HaX: "Someone on the inside is stealing it." |
| 2 | Card | `Mission 5 / Insider / Trading` | | |
| 3 | Day, threat | HaX portrait | same briefing | Agent HaX: "Every ambulance, fire and police call through it runs six to eleven minutes slower." |
| 4 | Day | straight walk into Patricia's office, her line | `patricia_office`, `briefing_played` | Patricia Morgan: "All vetted. All trusted. One of them shouldn't be." |
| 5 | Day | break room, Lisa by the kettle | `break_room` | Lisa Park: "Tense. The crypto team keep looking at each other like it's a game of Cluedo." |
| 6 | Card | `Name the / Insider` (new mechanic) | | |
| 7 | Mechanic, about 4 s | Owen pulls the badge log (zoom on the #4471 spare rows only); Owen's line; then Patricia: "Go on, then. Who?" and cut before the menu | `open_office_area`, Owen's log knot; `found_door_log` for Patricia's `share_findings` | Owen Gallagher: "That's Halloran's spare on the server hallway. Odd. She's in that lab all day, but never at night." then Patricia Morgan: "Go on, then. Who?" |
| 8 | Day, suspect | Dr Halloran in the lab | `research_lab` | Dr Ruth Halloran: "Find whoever did this, and quickly. And I hope to God you're wrong about my team." |
| 9 | Day, puzzle | clone Owen's lanyard; his reaction | `open_office_area`, cloner in kit | Owen Gallagher: "Did your bag just beep? ...You read my badge. Fair." |
| 10 | Card | `Real / Hacking` | | |
| 11 | Hacking | straight walk to the server-room VM launcher; console footage (placeholder) | `server_room` unlocked | none. Story only: the Bludit research portal, the handover note, the foothold (`mission.json`) |
| 12 | Night turn | corridor lights time out behind the player | `torres_identified` set by head-start flag, no Torres on screen | none |
| 13 | Card | `Before the / Final Upload` | | |
| 14 | Crescendo | lockpick (briefcase), RFID reader, password door, PIN lockbox (3 non-code digits), dusting the mug (no names on the cards), vault reader, phone chat, flag station (empty), espresso break with Thandiwe and Bernadette; flashes for Niamh, Owen, Halloran | assorted | Recruiter's call rings under the last cuts |
| 15 | Villain | the Recruiter's call screen (headshot, ringing, then her line) | `first_call` knot via the ring mapping (needs `torres_identified`) | Recruiter: "Everyone has a price, agent. I'm asking what yours is." |

Out: every Torres shot and line (see Spoilers), casualty figures (HaX `:148`, Recruiter `:165`), Lisa's and Halloran's lines naming David.

## 6. Cards

- `Mission 5 / Insider / Trading`
- `Name the / Insider`
- `Real / Hacking`
- `Before the / Final Upload` (alt `One of / Them Lies`)

## 7. Ending

1. Recruiter: "Everyone has a price, agent. I'm asking what yours is." (`ink/m05_phone_recruiter.ink:208`). Turns the trailer on the viewer, names no one, and the deal it opens stays off screen.
2. Recruiter: "Control? Nobody wants to run it. We want the minutes." (`:153`). The threat in eight words; sits behind a player choice, so film her answer only.
3. Recruiter: "He was a line item, agent. There are more like him in the pipeline right now." (`:128`). Strong menace, but "him" hints that the insider is a man, which narrows eight suspects.

## 8. Spoiler notes

The insider's identity is this mission's answer, withheld until the player names him (Torres is `initiallyHidden` until `torres_identified`, `scenario.json.erb:2571-2640`). Treat it like a code: no Torres face, portrait, name or office door sign; no badge-log rows with "D. TORRES"; no mug text ("love Miguel", Lisa names his children); no matching reference card with his name; no flag-3 title on screen if it says "the insider's staging manifest" with a name. Also off: the server-room password and its sticky note, the portal login card, the lockbox code (Owen's badge number), flag values, the naming and reason menus, the fate choice, the Recruiter's deal choice, the debrief and credits. Fine to show: Halloran as a suspect (she is the fair red herring), Patricia, Owen, Lisa, the Recruiter and her menace, the badge log cropped to the spare rows.

## 9. Risks

- **Mechanic beat vs the menu rule:** the naming ends in a choice menu, which stays off screen, so the beat shows the evidence and the ask, not the pick. If the user wants it to run start to finish, the alternative is a masked naming (menu blurred) or the card `Fingerprint / Matching` over the four-card mug comparison with names masked. Ask on the review page.
- **Badge log crop:** Torres and Halloran rows interleave line by line; a zoom on the spare rows needs row-level masking, checked frame by frame.
- **Owen's log knot** may need Patricia's incident log first; the scout must find the route.
- **Night turn:** setting `torres_identified` unhides Torres in the data centre and changes Patricia's, Owen's and Lisa's barks to name David (`ink/m05_npc_lisa_park.ink:130-136`). Keep night shots to empty corridors, and away from the data centre.
- **Recruiter call:** her first call fires on `torres_identified`; its opening line names Torres (`:82`). Film from the ring to the "price" line with the earlier subtitles cut out, or J-cut her audio in on the last line only.
- **Office life:** the espresso exchange needs the right two NPCs and their needs timing (`scenario.json.erb:1919-1921`); budget waiting time or set the needs.
- **Day/night day-take risk:** Patricia's office and the lab keep `mode: on`; only some rooms time out, so pick the corridor for the turn.
- **Cached audio:** unchecked for all lines; the Recruiter and Netherton may be uncached.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. The Recruiter's call is a voiced phone call, so `#delivery:` notes reach her lines (tts-audio, "Delivery note"). She says "agent" in lower case throughout. Both lines name no one and give no gender for the insider.

**Ending**

1. **Pick.** Recruiter: "I find people the week before they break, agent. Then I make them an offer." (15 words, about 5 s)
   - Insertion: `ink/m05_phone_recruiter.ink`, knot `recruiter_introduction`, **added** after `:110` ("Torres took debt relief and a standing consultancy retainer. Cheaper than most, if you're keeping score."). After it: the choices "You're talking about him like a receipt." / "What were you actually after?". Every route through the call passes this knot.
   - `#delivery: warm and confiding, a headhunter's smile in the voice`
   - State: the first Recruiter call (after the insider is named, `torres_identified`); any opening choice. Film the line, not the call screen's history if it shows the name.
   - Why: "Everyone has a price" is a stock phrase. This line is her method, and it is the mission's threat: the insider is a person she picked at their weakest.
2. Recruiter: "Shame. I'd have placed you somewhere nobody would ever think to look." (12 words, about 4 s)
   - Insertion: `ink/m05_phone_recruiter.ink`, knot `recruiter_deal_refused`, **added** after `:270` ("Noted. For what it's worth, I expected it. Your file reads like someone who finishes what they start."), before "You won't reach all of them before I've closed on a few more."
   - `#delivery: lightly regretful, then cool`
   - State: first call through to `recruiter_deal`, then `Not interested. That list is going to SAFETYNET.` The deal menu stays off screen.
   - Why: it turns the recruiter on the viewer and on the player. It is personal and quotable, and it reveals nothing.

**Hook:** Netherton's "Someone inside a Home Office contractor is handing ENTROPY the crown jewels." is not weak. No new hook.
