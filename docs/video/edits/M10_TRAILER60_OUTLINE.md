# m10 Full Disclosure, 60 s trailer outline

Planning only. Model: `M03_TRAILER60_V3_PLAN.md`; format as `M09_TRAILER60_OUTLINE.md`. Every line is "audio: check" until the scout tests the cache. Entry states come from the scenario's mappings and `tools/playtest/new-game.rb` options (`--start-room`, `--set`, `--unlock`), not from walking them; the scout confirms each. Two takes exist: `tools/video/takes/m10/t01_vm_approach.mjs` (gate console, live game) and `t02_briefing.mjs` (fresh-game briefing).

## Story

The finale, one night, 01:45 to six. Tomb Gamma is a Cold War bunker under the Montana hills, and Dr Adrian Tesseract, the Architect, waits at its core (`scenario.json.erb:1291`). He has invited SAFETYNET in: the blast door reads one badge, yours. Netherton runs the raid from a folding table at the gate. You go down through the tunnel post, the security office, the power room and the server hall to the gallery stair and the core, with a team one of whom ENTROPY placed eleven years ago.

## Threat

"At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone." (Netherton, `ink/m10_director_netherton.ink:125`). Two cells get it at four. Tesseract: "Hospitals, dispatch, water. In the hands of people who could never have got in before." (`ink/m10_tesseract.ink:280`).

## New mechanic

Checked against `scenarios/m01`-`m09` `scenario.json.erb` (key and type counts, this pass):
- **Disabling the bunker's security by hand, talked through it on the phone. First in m10. This gets the card.** In the power room the player isolates the gallery shutter at old switchgear while HaX (or Elena, or Vance, by carry-over) calls the steps: turn the key a quarter, then optionally flick the camera toggle, then pull the third breaker (`ink/m10_phone_agent0x99.ink:812,828,839`; steps `cut_step` 0-3 and `gallery_shutter_cut`, `scenario.json.erb:1884-1904`). The isolator lamp goes from amber to green (`:3570`) and its panel reads "GALLERY SHUTTER: ISOLATED ... GALLERY CAMERA: OFF" (`:3706`). The camera toggle pays off upstairs: the gallery's monitor guard says "Camera's dead again. I'll go and look." and leaves his post (`:4192-4193`). No earlier mission has a breaker or isolator the player works: m04 only names a breaker emitter (`m04 scenario.json.erb:2641`) and m07's breakers are grid status text (`m07 :1979-2336`).
- **Find the sleeper: not new.** The WREN aim (`scenario.json.erb:1613-1624`, unlocked by `whodunit_open`, `:1733-1734`) reads logs, checks alibis and names a suspect. That is m08's mole hunt: accusations cleared by logs and a manifest (`m08 scenario.json.erb:239-249, 1175`; "whodunit", `:1929`).
- **Raid clock: not new.** `raid_clock` steps forward on room entries and story beats (`scenario.json.erb:1742-1756`) and shows on eight countdown objects ("EARLY ACCESS 04:00 · RELEASE 06:00 UTC · NOW 02:30", `:116-160`) and message stamps (`gameClock`, `:1324`). There is no HUD timer. Story clocks run in m03, m04, m05 and m09 (`gameClock`), and m04 (`clock_started`, `:1082`) and m09 (the shredder) already race a deadline. It earns the story card `It Goes / at Six`.
- **Not filmable as a beat:** the tripwire (Nightshade's map route only, `ink/m10_nightshade.ink:112`), the alarm board (read-only lamps, `scenario.json.erb:3148-3170`; a crescendo flash), and door hearing (`m10_hearing.ink` is the Scorched Earth ending scene, an outcome: off).

Card: `Disable the / Security`.

## Music

Steel Shadows (m10's in-game track, `scenario.json.erb:1380`) is taken by m02's trailer. Candidates:
1. SpyAgro "Shadow Protocol (Remastered)" (finale energy).
2. Vocals "Entropy Failsafe" (the title fits; check the vocal sits under dialogue).
3. SpyAgro "Hybrid Attack 1".

## Beat sheet (the 46 s between the presets)

All night. The forward post is outdoors under lamps; every other room is underground. Story order runs top to bottom; the tunnel guard is moved after the hacking because the action belongs late.

| # | Section | Shot | Entry state | Line (speaker), audio: check |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title), 3 s | HaX at the folding table, portrait | `t02_briefing` (fresh game; its first-option pick takes this branch) | Agent HaX: "Well enough to know he's expecting us." (`ink/m10_director_netherton.ink:116`) |
| 2 | Card | `Mission 10 / Full / Disclosure` (three lines, as m03) | | |
| 3 | Threat, 3.5 s | Netherton across the table | same take, `briefing_stakes` | Director Magnus Netherton: "At six he publishes everything we ever catalogued." (`:125`, cut before "Every flaw") |
| 4 | Card | `WREN Is on / the Team` (Netherton's words, `:231`) | | |
| 5 | Sleeper, 2.5 s | the team packing the vans, wide, Netherton's voice over | fresh game after the briefing, `forward_post`, walk-free (hold on the vans) | Netherton: "It puts WREN on this team." (`:231`, last sentence) |
| 6 | Invitation, 2 s | Quintero by the inner door, the wanted photo of the player on the board behind | `--start-room security_office --set breach_open=true breach_announced=true m06_assets_seized=true` (the last hides `duty_guard_b`, `scenario.json.erb:3114`) | Agent 0x2D 'Anchor': "I don't like doors that know your name." (`ink/m10_quintero.ink:73`) |
| 7 | Card | `Disable the / Security` (new mechanic) | | |
| 8 | Mechanic, 4.5 s | power room: the phone rings on entry, HaX's step line, the player clicks the isolator, its lamp turns green, Wendell's bark | `--start-room power_room --set wendell_outcome="worked_round" cut_by_hand=true cut_step=2`; the call rings on entry (`scenario.json.erb:1885`); start position at the cabinet, so no run-in | HaX: "Top row. The third breaker from the left feeds the shutter." (`ink/m10_phone_agent0x99.ink:828`); payoff bark, Wendell Briggs: "Your funeral. I didn't see a thing." (`scenario.json.erb:3593`) |
| 9 | Payoff, 1.5 s | gallery: the monitor guard turns from his dead screen | `--start-room server_hall --unlock gallery --set gallery_camera_blinded=true gallery_open=true gallery_shutter_cut=true`; one step east into the gallery | Guard: "Camera's dead again. I'll go and look." (`scenario.json.erb:4192`); cut before 3.5 s, when he vanishes |
| 10 | Card | `Real / Hacking` | | |
| 11 | Hacking, 5 s | walk to the Field Console (Gate) at the forward post 2 s (out before the login post-it), then the console clip (placeholder) on the monitoring host 3 s | `t01_vm_approach` (live game with VMs) | none |
| 12 | Card | `It Goes / at Six` (`ink/m10_tesseract.ink:112`) | | |
| 13 | Clock, 1 s | a countdown panel reading NOW 03:30 | `--set raid_clock="t0330"`, `clock_server_hall` (`scenario.json.erb:3883`), read display | none |
| 14 | Action, 4 s | blast tunnel: the guard steps out, the player says "Out of my way.", he raises the baton and charges, the player puts him down | `--set breach_open=true briefing_played=true`, spawn at the forward post's blast door (east end), one step in | Guard: "Hold it. Post's closed till the shift changes." (`ink/m10_guards.ink:41`), then "Nobody said let you through armed." (`:50`) |
| 15 | Crescendo, 3.5 s | every minigame: lockpick at the fitter's locker, PIN cracker, PIN pad (3 non-answer digits), RFID clone and door, key lock, password, fingerprint kit, alarm board lamps flashing FORCED, phone chat, notes, flag station, VM launcher; flashes of Kowalczyk, Arakawa, Malhotra, Victoria Sterling, Nightshade, Wendell, Fonoti, Imran | various | none |
| 16 | Ending, 6.5 s | Tesseract at the console, wide, then the 3x close | see Ending | see Ending |

**Guard staging.** The tunnel is the cleanest room for a hostile turn: one guard on the default route (`tunnel_guard`, shown on `!nightshade_tethered && !nightshade_map_used && !override_held`, `scenario.json.erb:2977`), the kettle guard hidden (tether route only, `:2998`), no raid-team copies (they reveal only from the security office down), lights on. Keep the take to one guard: never cut to a room where a second guard or a team copy can step into the chase, and never let the punch land on a team member (copies are knockable). If the tunnel line is flat, the fallback is the duty guard in the security office with `duty_warnings=1` and `m06_assets_seized=true`: the player picks the fitter's locker in his sight cone, and the catch opens straight onto "I told you. Floor, now." (`ink/m10_guards.ink:117`), which turns him on the line itself. It is a better sequence (lockpick, catch, line, charge), but the room holds three team copies and Vector, so frame tight. Skip the gallery and the server hall: two patrols, reinforcements on a choice outcome (`startHostile`, `scenario.json.erb:4232`) and Nightshade at the lock.

**Entry states.** Prefer `--start-room` into the room of the shot, with the player placed at the object or a step outside the door, so each take opens on its action: the mechanic call rings on entry, the gallery bark fires on entry, the tunnel guard stands two tiles in. Only #11 (the live VM game) and #1, #3 and #5 (the fresh-game briefing) need a played-in game.

## Cards

- `Mission 10 / Full / Disclosure`
- `WREN Is on / the Team`
- `Disable the / Security`
- `Real / Hacking`
- `It Goes / at Six`

## Ending

1. Dr Adrian Tesseract: "It has to be one of you. If I press it, it's a crime. If you press it, it's a confession." (`ink/m10_tesseract.ink:306`). The finale's whole bargain, aimed at the player, with no outcome. Wide to "one of you.", then the close. Entry: the core after all four flags, at the `case_why` menu; heavier to reach (use the finale proof's seed, `tools/playtest/m10-finale-proof.mjs`).
2. Dr Adrian Tesseract: "Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you." (`:112`). Plays on arrival, every game, so the cheapest entry; it echoes the `It Goes / at Six` card. Natural cut after "whatever we say." On a fresh game "Nothing went at four. You were thorough." comes first (`:110`); start the picture after it.
3. Dr Adrian Tesseract: "I prefer to watch. I've watched you since your first day." (`:318`, the fresh-game branch). Short menace with a series callback.

Off: the casualty range (`:279`, "Eleven hundred to twenty-six hundred") and "Your first operation was Derek Lawson. I chose him for you." (`:412`), the mission's own reveal about m01.

## Spoiler notes

- **Tesseract is fair game.** m10 names him in its opening: the fresh-game briefing says "The Architect is Dr Adrian Tesseract." (`ink/m10_director_netherton.ink:113`), and the brief says the man behind ENTROPY's plan waits at the core (`scenario.json.erb:1291`). His face first appears at the core, but nothing about him is withheld, so his face and lines are fine. (`:1313`'s "THE ARCHITECT: DR ADRIAN TESSERACT" is the credits ticker, shown at the end; not evidence.)
- **The sleeper's identity.** WREN is Kowalczyk (`ink/m10_tesseract.ink:68-96`). Her face may flash in the crescendo among the team, but never next to the WREN card, never her "I'll be a room ahead. I always am." (`ink/m10_kowalczyk.ink:80`, a clue line), no door or bench log on screen, no accusation menu.
- The console choice, the database choice, the endings, the six o'clock scene, the hearing, the closing card and credits; Victoria's reinforcements (a choice outcome).
- PIN pad digits, the records-cupboard code, passwords, PIN-cracker results, flag values, the launcher's login post-it.
- Carry-over lines (m04 Voltage, m06 bank, m07 Mercer, m08 Phantom, m09 Recruiter): a fresh game gives the `else` branch; use that.

## Risks

- **Two-state mechanic shot.** The isolator lamp change and HaX's call happen in one take, but the call's menu and the click are seconds apart; cut the phone line, then the click and lamp. The isolator is a read display, so the "pull" is a click, not an animation: the green lamp and the ISOLATED text carry it. If that reads as too static for 4.5 s, add #9 to the beat and shorten the phone line.
- **The monitor guard vanishes** at 3.5 s (`setVisible false`, `scenario.json.erb:4193`); out point before it. Victoria or Nightshade may open a conversation on gallery entry; the scout checks.
- **Start-room reveals.** Raid copies and the tunnel guard appear on `room_entered`; check each fires when the game loads into that room, or spawn one room back and take the one-step run-in.
- **The tunnel guard's line delivery** may be flat for an action beat; ask for an angry re-voice if so (via AC0).
- **Tesseract #1** needs the finale seed and the case menu; if the take fails, #2 is the safe swap.
- **Crescendo cast.** Fresh-game NPCs only; carry-over NPCs (Voltage, Static, Vector, Phantom, Mercer, Vance, Elena) are named in the picks file as dropped or on a seeded save.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. Tesseract is fair game (named in the briefing). Neither line goes near WREN or Kowalczyk. `m10_tesseract.ink` already uses `#delivery:` (7 tags).

**Ending**

1. **Pick.** Dr Adrian Tesseract: "I had the blast door read one badge tonight. Yours." (10 words, about 3.5 s)
   - Insertion: `ink/m10_tesseract.ink`, knot `arrival`, **added** after `:112` ("Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you."), before the `m06_assets_seized` line and HaX's "...back. 0x00."
   - `#delivery: quiet and matter-of-fact, a host who has gone to some trouble`
   - State: the cheapest one. Arrival at the core, every game (the outline's #2 route).
   - Why: the shortest threat in the finale, and the most personal. It needs no context, and it does not overlap the hook below.
2. Dr Adrian Tesseract: "Your service spent decades hoarding the world's weak points. At six, I give them back." (15 words, about 5 s)
   - Insertion: `ink/m10_tesseract.ink`, the core pitch, **added** after `:280` ("Hospitals, dispatch, water. In the hands of people who could never have got in before."), before the choices "You'd kill eleven hundred people..." / "And then what?" (keep those choice labels off screen: they carry a figure).
   - `#delivery: calm and reasonable, almost generous`
   - State: the core after all four flags, the pitch before `case_why` (the finale proof's seed, `tools/playtest/m10-finale-proof.mjs`).
   - Why: the whole threat and his ideology in one quotable line, with the six o'clock clock. Use it as the ending if the hook is HaX's rather than Netherton's (otherwise the two say the same thing).

**Hook** (HaX's "Well enough to know he's expecting us." needs the question before it to make sense)

- **Pick, no new voicing.** Director Magnus Netherton: "At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone." (`ink/m10_director_netherton.ink:125`, `briefing_stakes`, about 6 s). States the stakes, plays in every game; check its cached take.
- New alternative. Agent HaX: "Well enough to know he's set a place for each of us." (12 words, about 3.5 s)
  - Insertion: `ink/m10_director_netherton.ink:116`, `briefing_name`, choice "You knew him well, then.". **Replaces** "Well enough to know he's expecting us." Before it: "Our former chief strategist. He trained me, and half the field. He walked out seven years ago."
  - `#delivery: dry and quiet, one beat of old familiarity` (keep her calm-under-pressure style, tts-audio rule 3)
  - State: fresh game (no `m09_completed`), `t02_briefing`, the first choice.
  - Why: it makes "he invited SAFETYNET in" chilling on its own. It is the host image Tesseract's arrival line pays off.
