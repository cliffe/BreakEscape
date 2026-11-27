# m10 Full Disclosure, 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Ending:** Tesseract, "Your service spent decades hoarding the world's weak points. At six, I give them back." (`m10_tesseract.ink`, voiced). The blast-door line is out of the game.
- **Hook:** Netherton's existing "At six he publishes everything...", in place of HaX's.
- The line after the pick changed to "City by city. Or you press this, and they go everywhere in the same minute..." (voiced).
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

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

## Plan: m10_trailer60.json v1 (24 Nov, planning agent; no images viewed)

Built from the picks, the owner questions, `docs/video/takes_m10.md` (runs 1 and 2) and the trimmed marker files. Voice times are **silencedetect onsets/ends** (-38 dB, 0.12 s) on the trimmed takes, not the line-start markers (which run 0.2 to 0.3 s early). Structure and plan format copy `m09_trailer60.json`: presets, `snap: false`, frame-aligned boundaries, glitch joins into cards, hard cuts elsewhere, `lines[]` times relative to the shot start, `caption` 16:9 false / 9:16 true / 1:1 true on dialogue shots, `spoiler{}` on every shot. Total 1800 frames = 60.00 s. Every framing below is a starting point copied from m09's equivalents: the edit agent checks the in and out frame per aspect (and should do it with small crops, a few at a time, then hand over).

### Music

SpyAgro **"Hybrid Attack 1"** (`SpyAgro/Hybrid Attack 1.mp3`, analysis `hybrid_attack_1_60.json`, 140.02 BPM, beat 0.4285 s, bar 1.714 s), window **98.599 to 158.588** (bar aligned; the analysis's second-best window, build 2.17). Output time = track time minus 98.599.
- 0 to 5.1 loud tail under the open preset, **drop 5.14** (103.74) to near-silence under the hook and the team flash.
- **Lift 10.28 (108.88) + strongest hit in the track 10.92 (109.52, 1.00) = Mission 10 card** (card at 10.2667, half a frame early).
- Drop 13.71: quiet bars 13.7 to 17.1 under Quintero, the WREN card and the sleeper line (dialogue in the clear).
- **Lift 17.14 = `Disable the / Security` card.** Drop 20.57: quiet under HaX's call. Lift 24.0 under the isolator panel into the gallery bark.
- Lift 30.85 (129.45) under the console clip: from here the track is loud to the end. **Hit 34.28 inside the `It Goes / at Six` card**; hit 37.70 on the cut into the tunnel guard; hits 38.57, 41.14 under the fight.
- Loud bed under the crescendo and Tesseract (duck -10 dB); the track's own decay starts at 59.99 (158.59): `fade_out` 1.0 is enough (no hard stop).
- `alternatives`: Hybrid Attack 2 from 122.4 (quiet 0 to 10.5, lift 10.5, then flat and loud to the end, no natural end); Hybrid Attack 1 from 76.317 (analysis best, loud from the start, no quiet bed for the hook).
- Not reused: every track in the README table, Midnight Trigger, Cold Bond Circuit. Entropy Failsafe (the picks' placeholder) was never analysed and has vocals over seven voiced lines: dropped for Hybrid Attack 1, which the README and m09 left for m10.

### Cards (glitch join in; text; output time)

| id | text | start-end | music |
|---|---|---|---|
| card_mission | `Mission 10` / `Full` / `Disclosure` | 10.2667-11.7667 (1.5) | lift 10.28 + hit 10.92 |
| card_wren | `WREN Is on` / `the Team` | 14.4667-15.9667 (1.5) | quiet bar (sleeper line J-cuts in at 14.72) |
| card_security | `Disable the` / `Security` | 17.1333-18.6333 (1.5) | lift 17.14 |
| card_real | `Real` / `Hacking` | 27.9667-29.1667 (1.2) | mid-bar; lift 30.85 lands under the console |
| card_six | `It Goes` / `at Six` | 33.3333-34.5333 (1.2) | hit 34.28 |

### Shot table

Output times in seconds (frames in brackets). Source times are trimmed-take seconds (`~/video-takes-local/m10/takes/<take>.trimmed.mkv`; the clip from `~/video-takes-local/m10/clips/`). Voice times are in source seconds. Muted = `gain_db -120`.

| # | id | output | take | source in-out | audio / line (source voice times) | framing intent (16:9 / 9:16 / 1:1) | spoiler notes |
|---|---|---|---|---|---|---|---|
| 0 | `safetynet-open` preset | 0-6 (180) | | | hook voice J-cuts in at 4.9 | preset | |
| 1 | hook_netherton | 6.0-8.4 (72) | t10_briefing | 80.40-82.80 | Netherton "At six he publishes everything we ever catalogued." voice 79.40-83.57; **pre 1.1** (audio from 79.30), **post 0.9** (audio to 83.70, inside the 83.57-84.25 pause, before "Every flaw..."); gain +2, duck; line start -1.00 end 3.17 | portrait UI-free, subtitle bar and the "Skip cutscene" button (right) cropped out in 16:9: start from m09 hook {cx .615 cy .4 z 1.3}; 9:16 {cx .72 cy .405 z 1.25}; 1:1 {cx .72 cy .39 z 1.3} | t10 is a 4.5 min monolith naming the whole cast: never outside 79.30-83.70 here. The bar shows the whole ink line ("Every flaw..."), not a spoiler, cropped anyway. |
| 2-5 | flash_arakawa, flash_malhotra, flash_price, flash_marchetti | 8.4-10.2667 (14 each) | t22_post_faces | 4.70, 14.30, 20.60, 35.20 (+0.4667 each) | muted; the hook voice L-cuts over the first three | face crops, bar off in every aspect (m09 flash framing {16:9 cy .19 z 2.6; 9:16 cy .32 z 1.6; 1:1 cy .26 z 2.0}, cx read per face) | **Kowalczyk is not in this flash** (she goes to the crescendo, far from the WREN card). No map frames (team copies). |
| 6 | card_mission | 10.2667-11.7667 (45) | card | | | | |
| 7 | quintero | 11.7667-14.4667 (81) | t11_quintero | 10.40-13.10 | Quintero "I don't like doors that know your name." voice 10.57-12.71; gain +2, duck; line 0.17-2.31 | conversation view only (portrait, wanted board behind): person-chat portrait {9:16 cx .70 cy .435 z 1.15; 1:1 cy .43 z 1.2}; 16:9 wide enough to keep the board | Never the map part (1.5-9 s: six team copies incl. Kowalczyk). Out before the menu (choices after 14.12). |
| 8 | card_wren | 14.4667-15.9667 (45) | card | | sleeper voice starts under it at 14.72 | | |
| 9 | sleeper_netherton | 15.9667-17.1333 (35) | t10_briefing | 264.9667-266.1333 | Netherton "It puts WREN on this team." voice 263.77-266.13; **pre 1.25** (audio from 263.717, inside the 263.24-263.77 pause after "Placed eleven years ago."); post 0; line -1.20 to 1.16 | **Netherton's portrait**, same framing as shot 1 | The picture is Netherton, never the team or Kowalczyk. The bar says WREN (a codename, no name). The shots either side are a card and Quintero's portrait: no frame names the sleeper. |
| 10 | card_security | 17.1333-18.6333 (45) | card | | | | |
| 11 | power_strike | 18.6333-19.8 (35) | t12_power_room (or **t27_walk_power if it passes**, HUD-free) | 8.40-9.5667 (entered 8.74; door/light sound 8.19-9.81) | take audio low (-6) for the light hum | t12 has the full HUD (objectives top left, hotbar and hearts): crop it off, centre the room {16:9 z 1.4; 9:16 z 1.0; 1:1 z 1.2} | objectives panel lists task text only; still crop it. |
| 12 | hax_call | 19.8-23.2 (102) | t12_power_room | 12.40-15.80 | HaX (phone) "Top row. The third breaker from the left feeds the shutter." voice 12.61-15.58; gain +2, duck; line 0.21-3.18 | phone call screen; it should fit 9:16 (check); crop the transcript's older lines if they show ("That's his sheet..." at 11.12) | out before the choices (16.23). |
| 13 | isolator_panel | 23.2-24.5333 (40) | t12_power_room | 38.30-39.6333 (click 37.78-38.08; panel text seen at 38.5 and 41.5) | take audio -6 | the "GALLERY SHUTTER: ISOLATED ... GALLERY CAMERA: OFF" text panel cropped in; panel is wide: 9:16 letterbox zoom 0.5625-1 | Wendell's bark and the green lamp were **not captured**: this panel is the payoff. Check the panel is already up at 38.30 (else in 38.5). |
| 14 | gallery_bark | 24.5333-27.9667 (103) | t16_gallery_bark | 7.60-11.0333 | Guard bark "Camera's dead again. I'll go and look." voice 7.88-9.19 + 10.00-10.91 (bubble from 7.5, bar copy 10-12.5); gain +2, duck; line 0.28-3.31 | two rooms in frame: crop to the gallery and the guard with his bubble; 9:16 centred on the guard | no names, no codes. |
| 15 | card_real | 27.9667-29.1667 (36) | card | | | | |
| 16 | walk_vm | 29.1667-30.3333 (35) | **t25_walk_gate if it passes** | about the last 1.2 s before the launcher would open | muted | map walk to the gate console | out before the launcher (login post-it). **Fallback:** t21 flag station 21.0-22.1667 (empty, "No flags submitted yet"), cropped in. |
| 17 | real_hacking | 30.3333-32.3333 (60) | clip m10_console_fileread_clip.mp4 | 0.40-2.40 (note lands at 0.53) | clip audio -6 | text spans the full width (crop x0-1010 at 1.875x): 16:9 z 1.0; 9:16 {cx .5 z 0.5625} letterbox; 1:1 {cx .5 z 0.5625} | `placeholder: false` (lint warns, as m08/m09). CONSOLE_CLIPS: no flag, password or secret; flag line never scrolls in. **Check no casualty figure in the city-by-city plan text.** |
| 18 | cyberchef | 32.3333-33.3333 (30) | **t28_cyberchef if it passes** | its operation pane | muted | crop to the recipe and output panes | neutral example; if the final cut shows m03's ROT13 too, change the sentence. **Fallback:** 0.2 s more console (out 2.6) and 0.8 s of the t21 flag station, or the t21 flag station alone. |
| 19 | card_six | 33.3333-34.5333 (36) | card | | | | |
| 20 | clock_panel | 34.5333-36.5333 (60) | t15_server_hall | 12.60-14.60 | muted; **vo** Tesseract "Now it's my turn." from t14_tesseract_core voice 6.94-8.59: extract 6.85-8.70 to `~/video-takes-local/m10/vo/tess_my_turn.wav`, vo cue start 34.65 end 36.50 (see owner question 2) | "Release Console Screen: EARLY ACCESS 04:00 . RELEASE 06:00 UTC . NOW 03:30" cropped in; letterbox in 9:16 | times only, no code. |
| 21 | tunnel_in | 36.5333-37.6333 (33) | t13_tunnel_guard (or **t26_walk_tunnel if it passes**) | 4.60-5.70 (entered 5.67) | muted | map, into the tunnel; tight on the doorway | the forward post map at about 2 s has team copies: stay after 4.6. |
| 22 | guard_armed | 37.6333-40.2333 (78) | t13_tunnel_guard | 12.75-15.35 | Guard "Nobody said let you through armed." voice 13.02-14.82; gain +2, duck; line 0.27-2.07 | guard portrait (GUARD POST): person-chat framing; **crop the toast** "Guard hunts on you..." (about 13 s) or accept | the player's choice [Out of my way.] (11.85) is off screen; out before 15.44 (choices). |
| 23 | charge | 40.2333-42.3333 (63) | t13_tunnel_guard | 17.60-19.70 | take audio 0 (the fight sound) | tight on the grapple, red health bar fine | not past the swing (no KO). |
| 24-40 | crescendo, 17 hard cuts, muted (126 frames) | 42.3333-46.5333 | see list | see list | Tesseract's voice J-cuts in at 44.23 | each a tight crop, bar off on faces | see list |
| 41 | ending_wide | 46.5333-49.0667 (76) | t14_tesseract_core | 14.4333-16.9667 | Tesseract "Your service spent decades hoarding the world's weak points." voice 12.13-16.57; **pre 2.3** (audio from 12.1333); line -2.30 to 2.14 | portrait wide, bar cropped in 16:9 (m09 ending_wide framing) | |
| 42 | ending_close | 49.0667-52.0 (88) | t14_tesseract_core | 16.9667-19.90 | "At six, I give them back." voice 17.37-19.64 (pause 18.16-18.76 after "At six,"); line 0.40-2.67; **hit** 3 frames {k .55 shift .05 pix .12} | 3x UI-free face (m09 ending_close {16:9 cy .2 z 3.0; 9:16 cy .3 z 1.8; 1:1 cy .25 z 2.2}, cx read off the frame) | **out 19.90, never past 20.2**: the "City by city ..." line and its bar with the stakes figure start at 20.86. Cut in the 16.57-17.37 pause after "weak points." |
| 43 | `hacktivity-close` preset | 52-60 (240) | | | | preset | |

Crescendo cuts (output start, frames, take, source in): cr_lockpick 42.3333 8f t17 30.20 (mid-pick, pins setting); cr_pad 42.6 7f t17 16.00 (records cupboard pad, 3 wrong digits, checked no-match); cr_cloner 42.8333 7f t18 13.20 (UID rows blurred: check the blur on the frame); cr_alarm 43.0667 8f t17 6.00 (crop in on the red FORCED lamp); cr_arakawa2 43.3333 7f t22 6.20; **cr_kowalczyk 43.5667 7f t23 4.40** (bar off; between two team faces, as the takes' editor note asks); cr_reader 43.8 8f t18 27.50 (Access Granted); cr_dust 44.0667 7f t19 25.00 (brushing); cr_imran 44.3 7f t24 10.90; cr_flag 44.5333 7f t21 22.00 (empty flag station); cr_asante 44.7667 8f t15 35.90; cr_pad_core 45.0333 7f t20 39.40 (**before the 4th digit**: digits go in one at a time from 38.7 and the 4th auto-submits about 43; check the display shows at most 3); cr_fonoti 45.2667 7f t20 48.00; cr_nightshade 45.5 8f t22 41.70; cr_kettle 45.7667 7f t21 31.00; cr_phone 46.0 7f t21 36.20 (Messages list, before the thread and its reply choices); cr_dust_plate 46.2333 9f t20 22.00. Left out of the crescendo: the t18 password screen (its prompt text names the file, "CASUALTY MODEL, CORRECTED": question 4), the t21 incident file (story-heavy), t24's gary_tech flash (shows HaX, not Gary).

### Spoiler rules for the JSON's `spoiler_rules`

- No PIN, password, code, UID or flag value on screen; pads show at most 3 digits that are not a code; the t20 core pad is cut before the 4th digit.
- Kowalczyk's face (t23) only in the crescendo, between other team faces; never next to `WREN Is on / the Team`. The sleeper picture is Netherton's portrait. Nothing that names the sleeper next to the sleeper beat.
- t10 only inside its marked windows (hook 79.30-83.70, sleeper 263.72-266.13). Never the stakes-figure line (t10 110.9-123.9) nor t14 after 20.2.
- No menu, reply choices, toast (crop the t13 toast), task panel, launcher post-it, door or bench log, incident file.
- t24's gary_tech flash is not used (shows HaX's portrait; under investigation).

### Owner questions (suggested answers)

1. **Hook cut**: "At six he publishes everything we ever catalogued." only (4.2 s of voice, cut in the 83.57-84.25 pause)? Suggest yes.
2. **Tesseract's mid-cut voice.** The City-by-city VO is out (hard rule: t14 stops at 20.2). Replace it with "Now it's my turn." (t14, 1.65 s) as a vo cue over the NOW 03:30 panel, or leave the panel to the music? Suggest the vo cue: it keeps his voice in the middle and needs no new audio. (The edit agent extracts the clip; it is a cut of an existing take, not a new TTS line.)
3. **Opening team flash** (Arakawa, Malhotra, Price, Marchetti under the hook's tail, as m09's team flash), a departure from the picks, which had no flash there. Suggest keep: it fills the quiet bar before the lift and sets up "on the team" with Kowalczyk held back.
4. **Password screen** in the crescendo shows "CASUALTY MODEL, CORRECTED" (a puzzle hint). Crop to the empty field, or leave it out? Suggest leave it out (17 cuts already).
5. **Wendell's bark** was not captured; the mechanic beat ends on the isolator panel text. Re-take t12 for the bark later, or accept? Suggest accept for v1.
6. **Music**: Hybrid Attack 1 from 98.599 by ear (suggest yes); Hybrid Attack 2 from 122.4 as the second choice.
7. **Console clip**: the file read shows Tesseract's release plan text ("What stops it ... A full stop needs the core console"). Fine as story, no secret? Suggest keep, once a frame check shows no casualty figure.

### Picks that can't be filled

- Wendell Briggs's bark and the green isolator lamp (t12: not on screen, lamp too small): panel text used instead.
- The City-by-city VO (barred by the spoiler rule) and Netherton's own "City by city from six..." (t10 90.88-99.08, outside the marked windows).
- Gary Whitlock's face (t24 gary_tech shows HaX's portrait), Victoria Sterling's phone chat (t21 opened no Victoria thread), Pieter Vos and the Minder (no take), the PIN cracker (no take), the VM launcher (t01 needs the VM), a separate key lock (none exists; the lockpick stands in).
- The incident-file notes (story-heavy; dropped) and the Quintero fallback line (not scripted).
- t25, t26, t27 and t28 are not run: shots 16 and 18 depend on them (fallbacks given); shots 11 and 21 have t12/t13 sources and only upgrade if t27/t26 pass.

### Next agent

Write `tools/video/edits/m10_trailer60.json` (id `m10_trailer60_v1`, mission `m10`) from `m09_trailer60.json`'s structure with the table above; music block `{"track": "SpyAgro/Hybrid Attack 1.mp3", "analysis": "hybrid_attack_1_60.json", "start": 98.599, "length": 60, "fade_out": 1.0}` and beat `{"bpm": 140.02, "period": 0.4285, "offset": 0}`; check in and out frames per aspect a few shots at a time; run the lint until 0 errors (1 expected warning on `placeholder: false`); update the README music row when it is final.
