# m07 60 s trailer: draft picks (scout stage, unreviewed by the user)

Source: `docs/video/scout/m07_scout.md` (claims used here re-checked against `scenarios/m07_architects_gambit/ink/` and `scenario.json.erb`). Outline: `M07_TRAILER60_OUTLINE.md`, whose "Decided lines (2026-11-23)" block wins. Recipe: `docs/video/recipes/mission-trailer.md`. Models: m01, m03 picks.

Spine: four ENTROPY operations go live at once and you are the one agent in range of the grid control centre. Netherton names the stakes, Hollis's torch finds you at the gate, the last two staff are still on the ops floor, a phone with no number rings, and the man who planned all four tells you he built the night so you would have to choose.

Every line below returned 200 from `/tts` in the scout (tagged lines with their `#delivery:` note). Lengths are the scout's measured spoken lengths. Sentence-boundary cut times are estimates: check by ear on the take.

## Not picked (brief)

- "Fifteen minutes on your wall. I had rather longer to plan them." Not in the ink (403). Dropped; no new line is proposed.
- HaX's phone lines, including the outline's way-in "One team, three fires..." (`m07_phone_agent_0x99.ink`), and the RFID spare: 403 from `/tts`, so no cached voice. Dropped. Hollis's challenge carries the way-in instead.
- Netherton's "Four ENTROPY operations went live..." (old hook): replaced by the decided hook.

## Music

Pick: SpyAction "Shadow Tide" (`SpyAction/Shadow Tide.mp3`). Not analysed (not in `tools/video/edits/music/summary.json`). Used by no earlier trailer (m01 Midnight Cipher Chase, m02 Steel Shadows in E Minor, m03 Shadow Code 1). Why: the outline's first choice, SpyAgro "Hybrid Attack 1", is also m04's first outline choice, and m04 comes earlier; Shadow Tide is the outline's second. Fallback: Noir "Midnight Exit Strategy" (not analysed; also on m05's outline list, third), then Hybrid Attack 1 if m04 does not take it. Run `analyse_music.py` on all three before the edit; move the cards onto the chosen track's lifts.

## Beat sheet (middle about 46 s between the presets; timings for the edit to fit to the grid)

| # | Slot | Pick | Length | Notes |
|---|---|---|---|---|
| 0 | Title | `safetynet-open` preset; hook J-cuts in under it (`audio.pre` about 1.2 s) | 6.0 s | |
| 1 | Hook | Netherton portrait, "We are faced with an impossible decision, Agent." | 4.10 s | t01 |
| 2 | Card | `Mission 7` / `Architect's` / `Gambit` | 1.5 s | three lines, as the outline |
| 3 | Stakes | Netherton, "Eight point four million people, Agent." (first sentence of a 6.22 s line) | about 2.6 s (estimate, check by ear) | t01, same take |
| 4 | Way in | Hollis's torch finds the player at the dim checkpoint; his challenge line | 6.34 s whole, or about 4 s from the second sentence | t02 |
| 5 | Ops floor | Adaeze and Gwen at the cooler, the exchange | 2.93 s + 2.50 s, about 5.5 s with the gap | t03 |
| 6 | Card | `Withheld` / `Caller` (new mechanic, named) | 1.5 s | |
| 7 | The call | handset rings with no number, player answers, the Architect's first line | 3.41 s line, 4.5 s or more with the ring | t04 |
| 8 | Obstacle | Elena at the backup rack | 3.94 s | t05 |
| 9 | Card | `Real` / `Hacking` | 1.5 s | |
| 10 | Walk to the VM | player walks to the attack terminal (vm-launcher) and stops before it opens | 1.5 s | t06 |
| 11 | Real hacking | placeholder clip (`placeholder: true`) | 2.0 s | |
| 12 | Clock | the cascade countdown display on the wall, armed | 1.5 s | t07 |
| 13 | Card | `Down into` / `the Dark` | 1.5 s | |
| 14 | Action | generator hall door lockpicked, then Park's line, then he comes up swinging | 3.38 s line + about 1.5 s swing | t08 |
| 15 | Crescendo | every minigame type + face flashes, the ending's wide J-cuts in under it | 2.5 s | t09 chain |
| 16 | Ending | the Architect, "Four fires tonight, and only one of you. I set them so you'd have to choose." | 7.06 s | t04, same take as beat 7 |
| 17 | CTA | `hacktivity-close` preset | 8.0 s | |

Rough sum of beats 1 to 16 is about 49 s against 46 s: the edit trims beat 4 to its second sentence first, then tightens the ops-floor gap and the walk. Drop the clock (beat 12) before dropping any voice.

## Slot by slot

### 1. Hook (decided)

- **Pick:** Director Magnus Netherton, "We are faced with an impossible decision, Agent." (4.10 s, 200 only with its note `grave and quiet, a man who hates saying it`). `m07_opening_briefing.ink:104`, knot `delegation_intro`.
- **Why:** the owner's pick; sets up the mission's one-team, four-fires choice without naming the options.
- **Fallback:** "Four ENTROPY operations went live inside the same sixty seconds. Three days ago you followed the fund behind them." (10.34 s, `start`), cut in the edit after "sixty seconds." (about 4.3 s, estimate, check by ear).
- **Entry state:** fresh game (`new-game.rb m07_architects_gambit`, no `--set`), opening cutscene autoplays. Starts in `security_checkpoint` after it.
- **Path:** briefing `start` plays to the `briefing_questions` hub; pick "What happens if the cascade runs?" (gives the stakes fallback below in the same run), then "Understood. Talk to me about the other three." The line opens `delegation_intro`. Film the portrait and bar, never the menu.

### 3. Stakes

- **Pick:** Netherton, "Eight point four million people, Agent. Go and do the part you can reach." (6.22 s, `handoff`, `:331`), cut in the edit after "Agent." (about 2.6 s, estimate, check by ear). If the whole line fits, keep it: "Go and do the part you can reach" works as a send-off into the checkpoint shot.
- **Why:** one hard number, said as the stakes, which the relaxed casualty rule allows. Short.
- **Fallback:** "Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter." (9.29 s, `briefing_questions` choice "What happens if the cascade runs?"). Either cut after "on backup." (about 3 s, estimate) or play it whole as an L-cut with "It is winter." landing on the dim checkpoint of beat 4.
- **Entry state:** same take as the hook.
- **Path:** after `delegation_intro`, `delegation_hub` "I've made the call." then any `commit_menu` option (the team choice: run it off camera, never film the menu) to `handoff`. The take stops after the line. Which team does not matter for this line.

### 4. Way in

- **Pick:** Ray Hollis, "Building's evacuating. So you're lost, or you're the other thing." (6.34 s, `m07_npc_ray_hollis.ink:63`, knot `challenge`), over the narrator's "The flashlight finds your chest." moment: the picture is the torch beam on the player at the checkpoint. Cut to the second sentence if time is short (in-point about 2 s in, estimate, check by ear).
- **Why:** replaces the 403 HaX line. A guard with a torch at the gate is the mission's first obstacle and an action set-up.
- **Fallback:** Hollis, "Walk away. Right now. I'm asking." (3.62 s, knot `stakes`, choice "No. It's exactly what you meant."), or "Stay there. STAY THERE." (3.77 s, `hostile_option`, reached through the hub's walk-at-him choice; the urgent read suits an action beat).
- **Entry state:** `--set briefing_played=true` (or the m07 equivalent the takes stage finds) plus `team_assigned` and `team_assignment` set, start `security_checkpoint` (the scenario's `startRoom`). Hollis's `torch: true` has no condition (`scenario.json.erb:1539`); the room is dimmed for it.
- **Path:** walk into Hollis's range; `start` routes to `challenge` on first contact. Out point before the hub menu.

### 5. Ops floor

- **Pick:** the needs-driven exchange `ex_last_two` (`scenario.json.erb:1899`): Adaeze Okafor "The muster board still has us missing." (2.93 s), Gwen Pritchard "Somebody ought to cross us off." (2.50 s), as the player walks past the cooler.
- **Why:** two more voices, and the human cost (staff left behind in an evacuation) in five seconds.
- **Fallback:** Adaeze's or Gwen's cooler chatter, if cached (not tested in the scout); otherwise a silent face shot of the pair at the cooler.
- **Entry state:** start `operations_floor` (`--start-room operations_floor`, `inside_reached` set), `ops_staff_upset` false and `ops_staff_gone` false. Needs both at the cooler: throttle FPS (`window.__test.throttleFps(20)`) and allow several tries.
- **Path:** none (exchange, not a conversation). Record it in its own take: the withheld call rings 5 s after the first `room_entered:operations_floor` and would collide. Either set `architect_contact`/`architect_t20_played` to stop it, or start the take in the room so the event does not fire.

### 6-7. New mechanic: the withheld call (card + about 4.5 s)

- **Card:** `Withheld` / `Caller` (names the mechanic, as the recipe asks).
- **Pick:** the ring with no caller ID, the player answering, the narrator line "No caller ID. The line opens before you speak.", then the Architect, "Don't look for the trace. It isn't there." (3.41 s, `m07_architect_comms.ink:92`, knot `taunt_t30`).
- **Why:** shows the mechanic start to finish (ring, no number, answer, voice), and the line is about the mechanic itself.
- **Fallback:** "I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch." (9.17 s, `:94`), cut after "particular shape." (about 6 s, estimate) if a longer call beat is wanted.
- **Entry state:** first entry to `operations_floor` (start in `security_checkpoint` with the server-side unlocks needed, or `--start-room` the checkpoint and walk in), `architect_t20_played` false. The event is `room_entered:operations_floor`, once only, 5 s delay, `ring: { withheld: true, onMissed: "voicemail" }` (`scenario.json.erb:1630-1637`). Stand still with nothing open for 5 s or more: the ringer waits for any open conversation or terminal.
- **Path:** answer the ring. The knot plays narrator, `:92`, `:94`, `:96` in order before any choice, so beats 7 and 16 come from one take. Out before `taunt_t30_choices`.

### 8. Obstacle

- **Pick:** Elena Rodriguez, "Forty minutes I've been at it. It's read-only. Of course it is." (3.94 s, `m07_npc_elena_rodriguez.ink:95`).
- **Why:** an engineer fighting the clock at a rack; a puzzle line, with no culprit named.
- **Fallback:** her opener "If you're one of his, you can tell him it isn't working and I'm not stopping." (not tested in the scout: check `/tts` first). It hints at a "him" without naming him: fine.
- **Entry state:** `server_room` unlocked (`--unlock server_room`, start there or in `operations_floor`), night.
- **Path:** talk to Elena; `opening` plays two lines, then choose "Finish what, exactly?" The pick is the second line of that choice (the first is about the load-shed tables). Do not film the menu.

### 9-12. Real hacking and the clock

- **Walk to the VM:** player walks up to the attack terminal (`vm-launcher`) and stops before the launcher opens. Room: wherever the takes stage finds the vm-launcher (scout did not place it; see Not verified).
- **Real hacking:** placeholder clip, marked `placeholder: true`, until the m07 console capture exists (`vm-console-takes`, on opus48). Mission tools only.
- **Real tool:** m07 has no in-game CyberChef or other real tool object (no `cyberchef` in the scenario), so this slot is skipped.
- **Clock:** the `cascade_countdown_display` smartscreen in its armed sprite (`pnw_countdown_armed1`, `scenario.json.erb:2345-2353`), 1.5 s. Entry state: `--set cascade_armed=true` (the flag 3 login arms it; seed rather than play the VM), start in the room that holds the display. Story order: the login, then the clock that it starts. No line over it. The outline's `Fifteen` / `Minutes` card is dropped for time; keep it only if the music leaves room.

### 13-14. Action

- **Card:** `Down into` / `the Dark` (the outline's).
- **Pick:** a sequence: the lockpick on the Backup Generation Hall door (key lock, lockpick from the start kit; `scenario.json.erb:2385`), then Thomas Park at the junction box in the cable vault, "Four minutes and I'd have been out. Four." (3.38 s, `m07_npc_thomas_park.ink:51`, knot `entry`), then the fight choice played off camera and Park coming up with the crimping tool (hostile).
- **Why:** set-up, action, payoff, as the recipe asks; Park's line is urgent and short, and he is not the person behind the sequence.
- **Fallback:** Mercer's hostile route ("You've come a very long way to be one more person who won't listen.", 5.54 s, `npc_james_mercer.ink:384`). Not preferred: Mercer turning on the player points towards who planted the sequence (outline section 8). Second fallback: Hollis's `hostile_option` "Stay there. STAY THERE." (3.77 s) at the checkpoint.
- **Entry state:** lockpick take: start `generator_room`'s neighbour with the lockpick in inventory. Park take: `--unlock cable_vault --start-room cable_vault` (the vault is a PIN door: never film its keypad with the real digits), `park_resolved` empty.
- **Path:** talk to Park; `entry` plays the line, then hub choice "Then finish it and see what happens. (Fight him.)" to `goes_loud` ("Right.", then the narrator's swing line, `#hostile:thomas_park`). Out point on the swing, before any KO.

### 15. Crescendo (every minigame type, about 2.5 s)

Inventory from `scenario.json.erb`: RFID clone of Hollis's badge (cloner read), the badge station PIN (`lockType: pin`, `dispenses: true`, `:1783`; three digits that are not in the code, no ENTER), the server-hall RFID door (emulate), lockpick (generator hall), key lock (generator hall with the maintenance key), the cable vault PIN keypad (three non-answer digits; crop the ATS-1 plate out of every aspect), the SCADA control password screen (empty field only), a pc container, notes, the situation board chart, phone chat, fingerprint kit, the flag station (cropped clear of any value). Face flashes: Ray Hollis is exempt (he has beat 4); James Mercer gets a face flash (no spoken beat). Netherton, Adaeze, Gwen, Elena, Park and the Architect carry beats. Leave out: the field-guide lab sheets (inventory `lab-workstation` items), the team-assignment menu, the debrief's bond visualiser. Lengthen the crescendo a little rather than drop a type.

### 16. Ending (decided)

- **Pick:** the Architect, "Four fires tonight, and only one of you. I set them so you'd have to choose." (7.06 s, 200 only with its note `soft and measured, faintly pleased, in no hurry at all`; `m07_architect_comms.ink:96`, `taunt_t30`). Wide on the phone portrait J-cut in under the crescendo; hard cut (3-frame `hit`) to the 3x UI-free close-up at the silence after "only one of you." (about 3.2 s in, estimate, check by ear).
- **Why:** the owner's pick; the mission's premise in the villain's voice.
- **Fallback:** "Don't look for the trace. It isn't there." (3.41 s) if beat 7 takes a different line; or "There is a decision in front of you tonight. Make it however you like. I only want to see it made." (8.18 s, `t30_close` / `taunt_t30_vm`), cut after "tonight." (about 2.8 s).
- **Entry state and path:** beat 7's take. Not used: "But the grid was never the point." (points at the end twist), the sign-off call, "I wasn't playing for tonight.".

### Walking shots (Montage B, if the music leaves room)

1. Into the checkpoint towards Hollis from the outer door, stopping out of his reach (1 s), before beat 4.
2. Across the ops floor towards the server hall door, passing the cooler (1.5 s).
3. Down the generator hall towards the cable vault door (1 s), before the action card.
`--hide-hud --zoom-step 1`, one NPC per room at most, no wall or NPC bumps. Avatars: vary per take as in m03 (no two adjacent shots share a sprite).

## Social crops (9:16 and 1:1)

- Captions on (`caption["9:16"]`, `caption["1:1"]`) for every voiced shot: beats 1, 3, 4, 5, 7, 8, 14, 16. Speaker centred (NPC portrait x about 0.70; Netherton's briefing about 0.50 as HaX's); 1:1 `{cy 0.43, zoom 1.2}`.
- The withheld call (beats 7 and 16) uses `phoneTheme: "terminal"` with a headshot avatar (`scenario.json.erb:1615-1619`): check on the crop sheet that "no caller ID" on the ring screen survives 9:16. If the ring screen is wider than 607 source px, letterbox it (zoom 0.5625 to 1).
- Likely too wide for 9:16 at zoom 1: the situation board chart, the SCADA password screen, the pc desktop and the flag station. Letterbox them, or frame the start of the text and list them as compromises on the review page.
- Exchange (beat 5): two speakers side by side; a 9:16 window may hold only one. Frame on the speaker of each line (two framings) or letterbox.
- The ATS-1 plate and the shift handover sheet stay out of every crop.

## Questions for the owner

1. Music: Shadow Tide (placeholder), Midnight Exit Strategy, or Hybrid Attack 1 if m04 does not use it? Recommend Shadow Tide, decided by ear after the analysis.
2. Stakes: "Eight point four million people, Agent." (cut, placeholder) or the hospitals line? Recommend the first: shorter, one clear number.
3. Action beat: Park (placeholder) or Mercer turning hostile? Recommend Park: Mercer's turn edges towards who planted the sequence.

## Not verified (the takes stage must confirm by play)

- The ring screen reads as "no caller ID", and the bar labels his lines "The Architect" (displayName at `:1612`; his ink lines carry no prefix).
- The cached Architect audio carries his `voice-distortion` fx.
- The narrator line on the ring ("No caller ID...") is voiced: not tested in the scout.
- Sentence-boundary times in every cut line (estimates).
- Whether a skip global for the m07 opening cutscene exists (`briefing_played` is m01's; the m07 gate may differ).
- That the exchange fires with both staff at the cooler in a reasonable number of tries, and that seeding a start in `operations_floor` does not fire the call into it.
- That `cascade_armed` seeded by `--set` shows the armed display sprite and a visible clock; and what the HUD shows while it runs.
- The room that holds the `vm-launcher` and the countdown display (the scout's object scan did not finish).
- That Hollis's torch beam reads on camera at 1080p.
- Park's swing: the hostile chase starts cleanly from the conversation close.
