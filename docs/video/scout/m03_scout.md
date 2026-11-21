# m03 "Ghost in the Machine": trailer scout (partial, handed over at 150k tokens)

Stage 1 of the 60 s trailer. Method: `.claude/skills/video-scout/SKILL.md`; model: `m02_scout.md`. Scout run by Sonnet 5.5 (not Haiku). Nothing recorded. No secret value is copied here. Not done: the minigame close-up inventory by play (listed from the scenario only), lighting_lookup, office-life check of each take room, take-by-take entry flags proved. See "Not verified".

## 1. Headline

- 360 voiced-line candidates (12 words or fewer) tested live on game 11137 through the real `/tts` endpoint on keyless :3017. 353 returned 200 audio/mpeg, 7 returned 503 (none on the picks list: closing_debrief "Yes. It is."; Victoria "The training lab. Since you're so interested.", "Do you. Well. Most people don't bother to walk it back.", "Danny Foster's survey. One of mine."; Terry "I'm not ringing the boss at this hour on your say-so.", "No favours."; Danny "You're not wrong. That's the worst of it. You're not wrong."). Control line refused 403, so the check is live. Full table: scratch `.../scratchpad/s3/merged.tsv` (npc, text, words, duration, knot); it is not in the repo.
- Cast of voiced person NPCs: Director Netherton (Charon) and Nightshade (briefing only), Agent HaX (briefing cutscene id `briefing_cutscene`, voice Aoede; phone id `agent_0x99`, same voice), Ffion Rees (reception, Kore, South Wales), Zainab Hussain (field engineer, Achernar), Yusuf Demir (security consultant, Alnilam), Victoria Sterling (CEO, antagonist, Despina), Terry Mott (guard, Algieba, South London), Danny Foster (insider, Iapetus; hidden until night).
- m03-specific mechanics: RFID cloner (in the start kit; clone Ffion's and Victoria's cards, then emulate at card readers), guard sight cone (Terry; a pick started in his view makes him hostile), day-to-night turn (`night_transition` cutscene), four VM flags (server room "Training Lab Terminal" and "Drop-Site Terminal"), CyberChef workstation.

## 2. Environment

Started: keyless server on :3017 (stopped at the end of this stage, see section 9). Game 11137 created. Postgres was already online. `tools/playtest/m03_ghost_in_the_machine-flags-game11137.xml` was written by new-game.rb (gitignored). Gotcha: in this worktree `bin/rails runner` needs `RBENV_VERSION=$(cat .ruby-version)` and `BUNDLE_PATH=<main checkout>/vendor/bundle`; `tools/playtest/new-game.sh` sets BUNDLE_PATH.

## 3. Rooms, NPCs and entry states (from the scenario; "expected, not played")

| Room | Lock | NPCs | Objects (types) | Lighting |
|---|---|---|---|---|
| `reception_lobby` (start) | none | Ffion, Zainab, Yusuf (day: seated/moving office life); briefing cutscene NPCs hidden | Building Directory, Founding Plaque (notes), coffee station, Zainab's laptop | day, lit |
| `main_hallway` | none | none | water cooler | **motion** (offAfter 75 s): lights strike on entry |
| `conference_room_01` | RFID (cloned receptionist badge) | Victoria | notes x2 | emitters |
| `server_room` | RFID (cloned Victoria card) | none | key-lock filing cabinet (safe), PIN wall safe, whiteboard notes, **Training Lab Terminal (vm-launcher)**, **CyberChef Workstation (takeable)**, **Drop-Site Terminal (flag-station)** | **motion**, dark ambient: strong drop shot |
| `executive_wing_hallway` | none | Terry (patrol loop, sight cone) | none | lit |
| `executive_office` | key lock (pickable) | none | key-lock filing cabinet, Executive Computer (pc, **password**), desk drawer (suitcase) | motion |
| `danny_office` | none | Danny (hidden by day, appears at night) | notes x2, Danny's workstation (pc) | on, variants |

- Start kit: Your Phone, RFID Cloner, Lock Pick Kit (no `--give` needed for lockpick/cloner shots; the phone holds HaX).
- Opening gate: global `briefing_played` (skip with `--set briefing_played=true`; music then switches to noir). Night turn: `clone_call_done` (`--set clone_call_done=true` expected to give night phase and `cutscene` music; clock anchor 23:00). Confrontation needs all four `flag_*_submitted`; seed with `--submit-flag` using the full id (m02 note: `<station>:flag_N`) or `--set`, never by editing rows.
- validSprites: the 8 noir spies + 2 hood hackers (as m01/m02).

## 4. Part A: voiced lines that play (200 from cache; length is ffprobe duration)

HaX briefing (`briefing_cutscene`, ink `m03_opening_briefing.ink`, plays on `game_loaded` of a fresh game; entry: none, fresh game):
- "They don't run the attacks. They arm the cells that do." 3.62 s, knot `briefing_main`; path: start line, then any of the three choices (the "Remind me" choice is fastest), then HaX's long "Zero Day runs behind a real pentest firm..." line, then this line.
- "You worked St. Catherine's last month. The hospital that went dark." 3.77 s, `st_catherines_connection` (after one more choice).
- "Right. Zero Day Syndicate. You heard of them?" 3.26 s; "Right to business." 1.78 s; "That's the mission." 1.34 s; "Good. Keep your head down in there." 2.50 s.
- Too long for the slot: "Every life St. Catherine's lost, it lost to something Zero Day sold." 4.78 s; Netherton "Agent 0x00. This is Operation Cyber Arsenal." 6.70 s (slow delivery, a title-style line).

Ffion Rees (reception; Kore; day knots `start`, `hub`; night knot `closing_up`):
- Night: "Oh! You made me jump. I only came back for my charger." 3.50 s; "Is Ms. Sterling expecting you this late?" 3.29 s (her night opener; no choice, plays on talk, but only before the fourth flag is in); "Sounds like her. She does her best talking after hours. Night, then." 5.69 s (answer path, too long).
- Day: "Afternoon! You'll be the three o'clock, is it? I'm Ffion." (10 words, `start`, tested 200, length not printed here); bark "Charger, charger... I know I left it here somewhere." (at night on first walk into reception).

Zainab Hussain: "Hiya. Here to see Sterling? Good luck." 3.89 s (`start`); "Someone followed me in this morning." 2.06 s and Yusuf's reply "A coffee isn't a badge. Write it up." 3.82 s (exchange `ex_tailgate`, an office-life exchange heard once, needs the afternoon gate); chatter "Milk's off again. Who buys the milk?" and others (ambient: mute).
Yusuf Demir: "Afternoon. If you're my client, you're very late." 4.58 s; "Strong, no sugar. Like my passwords." 4.06 s (chatter); "Good luck in there." 1.34 s.
Victoria Sterling (conference room, afternoon `start`/`first_impression`; she is the known target, so the day interview is not a spoiler): "Competent is cheap. That's not why you're here." 3.98 s; "We find it, we price it, and we find the somebody." 5.26 s (`zero_day_philosophy`, villain voice, a little long); "Victoria Sterling. Sit down. Let's see if you match your file." 5.14 s; "I'll be in touch." 1.34 s. Do not use `the_reckoning` / `nighttime_confrontation` lines (ending).
Terry Mott (executive wing): "You. The one with the picks. Let's hear it, then." 4.22 s and "Picks. Right. We're done talking." 3.29 s (`on_lockpick_detected`: plays when a pick starts in his view, then he turns hostile: a strong beat for the sight cone); "Right. I warned you." 2.38 s.
Danny Foster: all his lines touch the mystery (the hospital files, his map): treat as spoilers except a 3-frame face flash.
Agent HaX phone (`agent_0x99`): 14 lines tested 200 (e.g. "Side door, two minutes. Don't use the lobby." 3.10 s) but they are text-chat calls in the phone UI, and the old t03 take showed that hub topic has no voice. Not used.

## 5. Part B: set pieces and minigames (scenario inventory, not played)

Minigame types: lockpicking (executive office door; Lock Pick Kit), key-selection screen (filing cabinets), **RFID cloner: read, crack, save, emulate** (m03's own; at reception hub choice and Victoria's board), RFID reader, PIN pad (server wall safe), password screen (Executive Computer; a post-it on the monitor carries a hint: crop or avoid), pc desktop (Danny's workstation, Executive Computer), suitcase (desk drawer), notes (whiteboard, plaque, directory: whiteboard and printouts carry encoded text and answers: avoid), CyberChef workstation (real tool), VM launcher (needs a VM; launcher panel shows a login post-it: never film), flag station (drop-site), phone chat, person-chat, coffee station (office life), guard sight cone (m03 trailer beat, tested in take t05).
Old takes (13 Nov, from `~/safetynet-footage/m03/takes/`): t01_ffion_night (Ffion night line; usable idea, needs re-record: pre-office-life, old avatar), t02_vm_approach (**do not use**: shows the launcher's login post-it; walk-to-VM approach re-record cropped before the panel opens), t03_revelation_call (phone text chat only, shows the invoice story: ending-adjacent; drop), t04_printouts (printouts of flag payoffs: spoiler-heavy; drop). All four predate office life and spy avatars: re-record anything used.
Real hacking: `~/safetynet-footage/m03/solution/vm_console_recon_s949.trimmed.mkv` (1024x768, 30 fps, 94.8 s). Frames at 27, 31, 35, 39 s checked: typing of `nmap -Pn -sV -p 21,22,80,3632 <ip>` finishes at about 35-36 s; the scan results (four service banners) are on screen from about 38.5 s; **the last line shows a MAC address and vendor: crop it** (as m02: crop x 0-552, top terminal, scaled onto #21242D). No credential or flag is on screen in that window. Frames 0-25 s are the Hacktivity Kali desktop (fine). Candidate window 35.5-39.5 s, to be frame-checked at the edit stage. Everything else in `solution/` shows flags: never use.

## 6. Spoiler judgements

- Fine to show: Victoria and her day interview lines (she is the stated target), Terry, Ffion, Zainab, Yusuf, the briefing, the night-turn lighting, card cloning (no code), lockpicking, sight cone, CyberChef with a neutral input.
- Keep off: Danny's lines, his office notes and the hospital-recon folder; the invoice/transaction log and the revelation call; the whiteboard, Sterling's PC email, the wall-safe and password screens and post-its (a hint sits on the monitor); the debrief, choice screens (Victoria's fate, Danny's fate), credits; the Architect/Phase 2 reveal; the VM launcher panel; any real flag.
- Danny as a face flash is allowed only if the user agrees (he is the mystery's answer in m03's moral choice); default: drop him or show him obscured.

## 7. Music (proposal, analysis only)

Unused by m01 (Midnight Cipher Chase) and m02 (Steel Shadows in E Minor). Candidates from `tools/video/edits/music/summary.json`: **CutScene "Shadow Code 1"**, 118.65 BPM, window 114.322 s (strongest hit 1.0 at its start; hits at 116.3, 120.4, 128.5, 130.5 s); it is the mission's own night-phase playlist. Fallbacks: SpyAction "Midnight Trigger" 114.69 BPM at 92.994 s (the mission's confrontation playlist), SpyAction "Cold Bond Circuit" 85.98 BPM at 53.847 s. Only 30 s windows are analysed; a 60 s window and the lift times need `analyse_music.py` (not run).

## 8. Not verified

Entry-state flag sets, each take room's office-life state, which night/day lighting the take rooms strike, walking-wall/chair spots, sight-cone take, duration of Ffion's day opener, minigame cuts by play.

## 9. Environment at end

:3017 stopped with `tools/playtest/stop-keyless-server.sh 3017` (see handover). Postgres left running.
