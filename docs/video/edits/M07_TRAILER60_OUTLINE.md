# m07 The Architect's Gambit: 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Hook:** Netherton, "We are faced with an impossible decision, Agent." (`m07_opening_briefing.ink`, before the choice, voiced). Replaces the "Four ENTROPY operations" hook in the table.
- **Ending:** the Architect, "Four fires tonight, and only one of you. I set them so you'd have to choose." (voiced).
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

Planning only (2026-11-22). Model: `M03_TRAILER60_V3_PLAN.md`. Recipe: `docs/video/recipes/mission-trailer.md`. Not yet checked: which of these lines are cached (the scout checks), the exact entry flags for each take, the Architect's speaker label on screen (see Risks), and Hollis's and Mercer's walk lines.

## 1. Story

Four ENTROPY operations go live inside the same sixty seconds. You are the one agent in range, forty minutes from a grid control facility outside Portland, in winter, where a loaded sequence can black out three states. You send the one tactical team to another crisis and go in alone: past Hollis and his torch at the checkpoint, onto an operations floor where the last two staff are packing up, into the server hall and the generator room below. Then a withheld number rings your phone, and the man who planned all four is on the line.

## 2. Threat

"Four ENTROPY operations went live inside the same sixty seconds." (Netherton, `ink/m07_opening_briefing.ink:29`). "Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter." (`:70`). "Eight point four million people, Agent. Go and do the part you can reach." (`:329`). HaX after the team choice: "One team, three fires. ENTROPY built that arithmetic on purpose." (`ink/m07_phone_agent_0x99.ink:706`). Once the player logs in to the attack host a fifteen-minute clock runs on the wall (`scenario.json.erb:45-50`, `cascade_countdown_display` `:2345`).

## 3. New mechanics

Compared against m01 to m06:

- **The withheld call**: the Architect rings the player's phone with no caller ID ("No caller ID. The line opens before you speak.", `architect_comms.ink:90`); a missed or declined call leaves a voicemail knot. `ring: { withheld: true, onMissed: "voicemail", voicemailKnot: ... }` on every taunt (`scenario.json.erb:1637-1727`, first one on `room_entered:operations_floor`, 5 s delay). **Confirmed new, gets the card.** Checked 2026-11-22: in m01 "voicemail" is only description text (`:1311` desk phone observation, `:1542` maintenance log); in m02 "withheld" is the global `bernie_key_withheld` (`:1440`, `:4068`); in m04 it is a debrief line ("the details withheld", `:265`). m03, m05 and m06 have neither word. m01, m03 and m05 ring only with `onMissed: "callback"`. m08 also uses a withheld ring, but it comes later.
- **The countdown on the wall**: the cascade clock as an in-world smartscreen (`type: "smartscreen"`, `:1823`, `:1960`, `:2344`). m02 and m04 have `showCountdown`, so it is not new as such; the wall screen is. Used in the clock beat.
- **Badge station** that prints a server-zone badge after a PIN (`dispenses: true`, `:1785`). m04 has a `dispenses` object; not new.
- New props only (not mechanics): `servers`, `chart`, `cable`, `batrack`.
- Not new: RFID cloning, lockpick, key, PIN, password and flag locks, torch, sight-challenge guards, hostility.

## 4. Music

Not used by m01 to m03, and not m06's candidates. Analyse later.

1. SpyAgro "Hybrid Attack 1" (`SpyAgro/Hybrid Attack 1.mp3`): the hardest set in the library, for a mission run against a clock.
2. SpyAction "Shadow Tide" (`SpyAction/Shadow Tide.mp3`).
3. Noir "Midnight Exit Strategy" (`Noir/Midnight Exit Strategy.mp3`), if the user wants the villain to carry it rather than the clock.

## 5. Beat sheet (middle 46 s between the presets)

Day and night: one winter night (`LIGHTING_PLAN.md` section 1, "Night, in winter, mid-evacuation"). No day shots.

| # | Section | Shot | Entry state | Line (speaker), audio: check |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | Netherton in the briefing | fresh game, opening cutscene | "Four ENTROPY operations went live inside the same sixty seconds." (Netherton, `opening_briefing.ink:29`, cut before "Three days ago"), audio: check |
| 2 | Card | `Mission 7` / `Architect's` / `Gambit` | | |
| 3 | Stakes | Netherton portrait | same take | "Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter." (`:70`), audio: check |
| 4 | Way in | Hollis's torch beam sweeps the dimmed checkpoint, then the player past the half-crossed muster board (`:1830`) | start room `security_checkpoint`, `team_assigned` set (the briefing choice; never film it) | HaX over it: "One team, three fires. ENTROPY built that arithmetic on purpose." (`phone_agent_0x99.ink:706`, cut "Whichever way you turned it, two went unanswered."), audio: check |
| 5 | Ops floor | Adaeze and Gwen at the cooler, the exchange plays as the player walks past | `operations_floor` (`inside_reached`), both at the cooler, `ops_staff_upset` false (`:1899`, knot `ex_last_two`) | "The muster board still has us missing." (Adaeze) / "Somebody ought to cross us off." (Gwen, `npc_adaeze_okafor.ink:64-65`), audio: check |
| 6 | Card | `Withheld` / `Caller` (new mechanic) | | |
| 7 | The call, 4 s or more | the handset rings with no caller ID, the player answers, the narrator line, then the Architect's portrait and voice | 5 s after first `room_entered:operations_floor` (`:1630-1637`), nothing else open | "I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch." (the Architect, `architect_comms.ink:94`; 6 s or more, may need a cut after "shape."), audio: check |
| 8 | Obstacle | Elena at the backup rack in the server hall, portrait | `server_room` unlocked (Hollis's badge or printed badge); route "Finish what, exactly?" (film the line, never the menu) | "Forty minutes I've been at it. It's read-only. Of course it is." (Elena, `npc_elena_rodriguez.ink:95`), audio: check |
| 9 | Card | `Real` / `Hacking` | | |
| 10 | Hacking | straight walk to the server-hall lab workstation, console clip (planned elsewhere) | `server_room`, `cascade_armed` set by the flag 3 login | none |
| 11 | Card | `Fifteen` / `Minutes` | | |
| 12 | Clock | the cascade countdown on the SCADA wall screen, ticking | `scada_control` unlocked, `cascade_armed` | none |
| 13 | Card | `Down into` / `the Dark` | | |
| 14 | Action | generator room: lockpick on the maintenance door, then Park at the vault; Park turns hostile; or Mercer comes at the player in SCADA control | `generator_room` / `cable_vault`; Mercer's `ending_hostile` route (`npc_james_mercer.ink:377-392`) | "Four minutes and I'd have been out. Four." (Park, `npc_thomas_park.ink:51`) or "You've come a very long way to be one more person who won't listen." (Mercer, `npc_james_mercer.ink:384`), audio: check |
| 15 | Crescendo | every minigame: RFID read of Hollis's badge, badge-station PIN (3 digits not in 0616), lockpick, key door, vault keypad (3 digits not in 4703), SCADA password screen, situation board, chart, phone chat, flag station, fingerprint kit; flashes for Hollis (no spoken beat) and Park or Mercer (whichever has no line) | as the montage takes | the Architect J-cuts in under the last second |
| 16 | Villain | the withheld call again, from the beat 7 take: portrait wide, then 3x close | same take (`taunt_t30`), or a later taunt for ending 3 | ending line |

Adaeze, Gwen, Elena, Netherton and HaX carry voiced beats, so they are exempt from the crescendo flashes. Spare HaX line for the RFID flash: "The reader trusts the card and never asks who's holding it." (`:925`).

## 6. Cards

| Card | Lines |
|---|---|
| Mission | `Mission 7` / `Architect's` / `Gambit` |
| New mechanic | `Withheld` / `Caller` |
| USP | `Real` / `Hacking` |
| Clock | `Fifteen` / `Minutes` |
| Action | `Down into` / `the Dark` (Park: "They needed me for the dark.", `npc_thomas_park.ink:108`) |

Spares: `Four Ops,` / `One Agent`; `One Team,` / `Three Fires` (HaX `:706`); `One Clock,` / `One Team` (credits ticker, `scenario.json.erb:89`).

## 7. Ending (ranked)

1. "Don't look for the trace. It isn't there." (the Architect, `architect_comms.ink:92`, first call). Short, cold, about the mechanic itself, and it gives nothing away. It sits two lines before beat 7's line in the same knot, so one take covers both.
2. "There is a decision in front of you tonight. Make it however you like. I only want to see it made." (`:115`, `t30_close`). The mission's theme in his voice; long, so it needs a cut at "tonight."
3. "But the grid was never the point." (`:374`, `taunt_t1`). The strongest hook, but it points at the end twist. Ask the user before using it; it needs the t1 taunt seeded.

Not for the ending: "I wasn't playing for tonight." and the sign-off call (both give away that the grid is saved).

## 8. Spoiler notes

- Codes: vault PIN 4703 (the ATS-1 plate serial; crop the plate), badge-station PIN 0616 (on the shift handover sheet: crop it; Adaeze's handover line `:53` points at it, do not use), SCADA password (Elena gives it; never film that line or the listener capture).
- Flag values; the attack-host login screen.
- Choice screens: the team assignment in the briefing (and its redirect later), Mercer's and Elena's endings, the verdict.
- The outcome of the clock (`countdown_expired`) and the sign-off call; casualty projection figures.
- Who planted the sequence: Elena's and Hollis's mid-mission reveals, Gwen's `:46`, HaX's `:141` and `:734` all point at it. Not quoted here; none goes in the cut unless the user says so.
- HaX's `:825` (how ENTROPY knew the player's deployment) is the end twist: keep it off.
- The debrief and the credits.
- Fine to show: the Architect's voice and menace, Elena's and Hollis's faces, the clock running, Park or Mercer turning hostile.

## 9. Risks

- **The withheld call is the biggest risk.** It waits for any open conversation or terminal to close before it rings (`scenario.json.erb:1629` comment), so the take must stand still on the ops floor with nothing open for at least 5 s, and the Adaeze/Gwen exchange in beat 5 must finish first (separate takes if they collide). The phone uses `phoneTheme: "terminal"` with the headshot avatar (`:1615-1619`); check that the ring screen reads as "no caller ID" in 1080p and in 9:16, and that the dialogue bar labels his lines "The Architect" (displayName `:1612`; his ink lines carry no prefix). His voice has `fx: "voice-distortion"`: check the cached audio carries it.
- **Torch**: Ray Hollis has `behavior.torch: true` with no condition (`:1539`), so it is always on, but the beam draws only when the room is dim; the checkpoint is dimmed to `#343a50` for it (`:788-795`). Check the beam reads on camera (m03 needed an engine option).
- **The exchange** needs both ops staff at the cooler at once (needs-driven); throttle FPS as the memory notes say and allow several tries.
- **The wall countdown** needs `cascade_armed`, set by the flag 3 login on the VM: seed it with `--flags` (memory: VM playtests elsewhere) and check the screen shows a clock and nothing else.
- **Park or Mercer hostile**: the combat route and its line need an urgent read; a re-voice needs a yes.
- Real hacking footage is planned elsewhere; placeholder until then.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. The Architect's calls are voiced phone calls (`#delivery:` notes apply). Neither line says who planted the sequence on site.

**Ending**

1. **Pick.** The Architect: "Four fires tonight, and only one of you. I set them so you'd have to choose." (16 words, about 5 s)
   - Insertion: `ink/m07_architect_comms.ink`, knot `taunt_t30`, **added** after `:94` ("I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch."), before `taunt_t30_choices` ("Who am I speaking to?" / "I don't take calls from ENTROPY."). It sits two lines after the current #1 ("Don't look for the trace. It isn't there."), so one take covers both.
   - `#delivery: soft and measured, faintly pleased, in no hurry at all`
   - State: first contact. `architect_contact` set by the ops-floor mapping, then answer the withheld call.
   - Why: it is the mission's premise (four operations, one agent, HaX's "One team, three fires") in his own voice. He owns the design, and the line points at the player.
2. The Architect: "Fifteen minutes on your wall. I had rather longer to plan them." (12 words, about 4 s)
   - Insertion: `ink/m07_architect_comms.ink`, knot `taunt_t10`, **added** in the `cascade_armed` branch after `:226` ("You logged in. The door closed behind you."), before "Stop this, and something else fails..."
   - `#delivery: quiet and patient, a teacher stating a fact`
   - State: log in to the attack host (`cascade_armed`, the wall clock running), then the T-10 call.
   - Why: it ties to the on-screen countdown the trailer already shows, and it puts the player's minutes against his preparation.

Already in the ink and worth a scout check: "The beauty of entropy is that it doesn't require me to win. It only requires you to wait." (`taunt_t10`, the `else` branch, about 17 words).

**Hook:** Netherton's "Four ENTROPY operations went live inside the same sixty seconds." is not weak. No new hook.
