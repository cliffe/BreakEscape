# m07 "The Architect's Gambit": 60 s trailer scout (partial)

Stage 1 for the m07 trailer, per `.claude/skills/video-scout/SKILL.md` and `recipes/mission-trailer.md`. Nothing recorded, no repo file changed except this report. No PIN, password, code or flag value is copied here. Part B is partial: see "Not done".

## 1. Headline

- Game 12255 (fresh, `new-game.sh m07_architects_gambit`). Keyless server on :3034. 72 lines tested through the real `/tts` endpoint, plus 3 tagged re-tests.
- Results on the first pass: 64 x 200 audio/mpeg, 6 x 403, 3 x 503. Control line refused with 403, so the check is live.
- After the delivery fix (see section 2), the two 503s that were tagged lines are 200. Re-tested with their notes: the hook (4.10 s), the "Four fires" ending (7.06 s), Elena's "There. Now what?" (5.42 s) and Mercer's "I'm sorry?" (1.22 s) all return 200.
- **Remaining 503**: none on the decided lines once tagged lines are re-tested with notes. The 3rd first-pass 503 was Mercer's "I'm sorry?", now 200.
- **Blocking the decided lines**: the new Architect line "Fifteen minutes on your wall. I had rather longer to plan them." is not in any ink file. It returns 403 (expected). It cannot be tested until it is written into `taunt_t10`.
- Top picks, facts only:
  - Netherton hook: "We are faced with an impossible decision, Agent." 4.10 s, 200 with note.
  - Netherton stakes: "Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter." 9.29 s. Too long for a 4 s slot.
  - Adaeze: "The muster board still has us missing." 2.93 s. Gwen: "Somebody ought to cross us off." 2.50 s.
  - Architect ending: "Don't look for the trace. It isn't there." 3.41 s. "But the grid was never the point." 2.78 s.
  - Architect close: "There is a decision in front of you tonight. Make it however you like. I only want to see it made." 8.18 s (needs a cut).
  - Architect: "Four fires tonight, and only one of you. I set them so you'd have to choose." 7.06 s with note.
  - Park: "Four minutes and I'd have been out. Four." 3.38 s. Mercer: "You've come a very long way to be one more person who won't listen." 5.54 s.

## 2. Environment

- Postgres 16 was already running. Not touched.
- Keyless server started on 127.0.0.1:3034 with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3034 bin/rails server`, `nice -n 19`, pid file in scratch. **Stopped at the end of this stage** (pid killed, port confirmed closed).
- Gotchas met in this worktree:
  - `BUNDLE_FORCE_RUBY_PLATFORM=true` breaks Bundler here (sqlite3-1.5.3 and nokogiri are installed as platform gems). Drop it on this machine.
  - `BE_DB_USER=root` does not exist as a Postgres role here. `deploy` (the default, used by the other live servers on :3032 and :3033) works. Use `BE_DB_USER=deploy`.
  - `RBENV_VERSION=2.7.8` and `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle` as the brief says.
- Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m07/` (`lines_all2.json` is the current pool with delivery notes; `tts_run1.tsv` and `tts_tagged.tsv` are the results).

## 3. Part A, voiced lines

Method: pool from `tools/video/scout/dump-lines.rb` (660 lines at 80 words; 283 at 12 words). Test: `tts-test.mjs` against game 12255. Ink file and knot from the pool path.

| Line (speaker) | Text (exact ink) | Knot / path | Words | Result | Spoken length |
|---|---|---|---|---|---|
| HOOK (Netherton) | We are faced with an impossible decision, Agent. | `delegation_intro`. Fresh game: start, briefing_questions hub, sticky "Understood. Talk to me about the other three.", delegation_intro | 8 | 200 with note "grave and quiet, a man who hates saying it" (503 without note) | 4.10 s |
| Hook fallback (Netherton) | Four ENTROPY operations went live inside the same sixty seconds. Three days ago you followed the fund behind them. | `start` | 19 | 200 | 10.34 s |
| Hook fallback, bare sentence | Four ENTROPY operations went live inside the same sixty seconds. | `start` | 9 | 403: a cut is not a whole ink line | n/a |
| Stakes (Netherton) | Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter. | `briefing_questions` c-1 | 14 | 200 | 9.29 s |
| Threat (Netherton) | Eight point four million people, Agent. Go and do the part you can reach. | `handoff` (after the team choice) | 14 | 200 | 6.22 s |
| HaX way-in | Whichever way you turned it, two went unanswered. One team, three fires. ENTROPY built that arithmetic on purpose. | `moral_soundingboard` (phone, after team assigned) | 19 | 403 | n/a |
| HaX way-in, cut | One team, three fires. ENTROPY built that arithmetic on purpose. | as above | 12 | 403 | n/a |
| HaX RFID spare | The reader trusts the card and never asks who's holding it. | `guide_rfid` | 11 | 403 | n/a |
| Adaeze | The muster board still has us missing. | `ex_last_two` (needs-driven, both at cooler) | 7 | 200 | 2.93 s |
| Gwen | Somebody ought to cross us off. | `ex_last_two` | 6 | 200 | 2.50 s |
| Architect, beat 7 | I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch. | `taunt_t30`, ring on `room_entered:operations_floor`, withheld | 21 | 200 | 9.17 s (needs a cut) |
| Architect, ending 1 | Don't look for the trace. It isn't there. | `taunt_t30` | 8 | 200 | 3.41 s |
| Architect, ending 2 | There is a decision in front of you tonight. Make it however you like. I only want to see it made. | `taunt_t30_vm` (missed call) | 21 | 200 | 8.18 s |
| Architect, ending 3 | But the grid was never the point. | `taunt_t1_vm` | 7 | 200 | 2.78 s |
| Architect, ending NEW | Four fires tonight, and only one of you. I set them so you'd have to choose. | `taunt_t30` (already in ink, line 96; `#delivery` tag) | 16 | 200 with note "soft and measured, faintly pleased, in no hurry at all" (503 without) | 7.06 s |
| Architect, ending NEW 2 | Fifteen minutes on your wall. I had rather longer to plan them. | `taunt_t10` (not in ink) | 12 | 403: not in ink. **Question: author it first** | n/a |
| Architect fallback | The beauty of entropy is that it doesn't require me to win. It only requires you to wait. | `taunt_t10` else branch | 18 | 200 | 8.30 s |
| Elena, obstacle | Forty minutes I've been at it. It's read-only. Of course it is. | `opening`, choice "Finish what, exactly?" | 12 | 200 | 3.94 s |
| Elena, tagged | There. Now what? You've got as little time as I have, and you're spending it on ... | (tagged, "unimpressed, dry") | | 200 with note | 5.42 s |
| Park, action | Four minutes and I'd have been out. Four. | `entry` | 8 | 200 | 3.38 s |
| Park, card quote | If somebody's had a tap on that run for months, they didn't need me for the building. They needed me for the dark. | `splice` (choice "The north trunk's spliced...") | 23 | 200 | 6.29 s (the card sentence is inside this line; not a standalone line) |
| Mercer, action | You've come a very long way to be one more person who won't listen. | `ending_hostile` | 14 | 200 | 5.54 s |
| Mercer, tagged | I'm sorry? | (tagged, "after a long pause") | 2 | 200 with note | 1.22 s |

**Walk-line candidates.** All 21 Hollis lines and all 25 Mercer lines of 12 words or fewer returned 200 (one Mercer line, "I'm sorry?", was 503 without its note and 200 with it). Full list is in `tts_run1.tsv`. Hollis entries: `challenge` (first contact, "Building's evacuating. So you're lost, or you're the other thing.", 10 words, 6.34 s; "Stay there. STAY THERE." 3.77 s; "Walk away. Right now. I'm asking." 3.62 s). Mercer entries: `start` ("You're early. Not by much.", 3.50 s; "Sit if you like...", 4.94 s). Which of these are walk lines is the orchestrator's call. The outline does not define them.

**Music.** The three tracks exist as files under `public/break_escape/assets/music/`: `SpyAgro/Hybrid Attack 1.mp3`, `SpyAction/Shadow Tide.mp3`, `Noir/Midnight Exit Strategy.mp3`. They are not in `tools/video/edits/music/summary.json`, so BPM is not analysed.

## 4. Part B, set pieces and minigames (partial)

- **Lock types in the scenario** (from `scenario.json.erb`, by line): pin (badge printer, genset control panel in cable vault), rfid (`ops_cooler` by the nearest-id scan; room not verified), password (`rack_cabling_note`, `scada_control`), flag (`crisis_control_system`), key (`casualty_projection`, `generator_room`).
- **Object types present**: phone, lockpick, rfid_cloner, fingerprint_kit (start kit, inventory); pc; notes; smartscreen (visitor log, `generator_maintenance_key`, `crisis_control_system`, `cascade_countdown_display`); chart (`situation_board`); servers; batrack (`maintenance_log`); cable (`thomas_park`); vm-launcher (`vm_launcher_attack_terminal` area); flag-station (`vm_launcher_attack_terminal`).
- **New mechanic, withheld call**: `ring: {withheld: true, onMissed: "voicemail"}` on the Architect's taunts (`scenario.json.erb` ~1627-1663). Triggers: `taunt_t30` on `room_entered:operations_floor` (5 s); `taunt_t10` on `global_variable_changed:architect_t10_played`, with conditions. The cascade wall countdown is a smartscreen (`cascade_countdown_display`).
- **Entry states (expected, not played)**: `briefing_played` skipped with `--set briefing_played=true` only for takes that do not need the hook. Team choice flags `team_assigned` and `team_assignment` for the handoff line. Confrontation and ending flags are in the outline.
- **Set pieces**: operations floor (Adaeze and Gwen, needs-driven); server hall (Elena, read-only backup rack); server room lab workstation (VM, needs VM); SCADA control (Mercer, the cascade wall screen); generator room and cable vault (Park, vault keypad).
- **Needs VM**: the lab workstation console and the flag station. Stand-ins: the wall countdown and the lab terminal from outside.
- **Answer on screen**: not judged. The scenario-object pass did not complete (below), so the "answer on screen?" column for each keypad, password and flag screen is not filled. Per the outline, badge-station PIN and vault PIN values are not written here.

## 5. Spoiler notes

- Keep off screen: the team-assignment choice screen, the Architect's sign-off, the closing debrief, the countdown outcome, HaX's `:825` end twist, the SCADA password line (Elena gives it), and any post-it with a code.
- Lines the outline excludes that also fail: none of the Architect's or HaX's spoiler lines were tested beyond the decided set. The 80-word pool was checked for the decided lines only.

## 6. Not done

- **Object-level scan**: the full object list per room (with `vm-launcher` and `flag-station` room ids, and the "answer on screen?" column for each keypad, password and flag screen) was not completed. A `scenario.json.erb` ERB render needs the Rails helper `vm_flags_json`, which my stub did not satisfy. The Rails loader (`TtsLineExtractor` or the game's own render) should be used instead.
- **Entry paths** for Hollis, Mercer and Park lines were given as knot names only. The hub choice labels for each were not traced.
- **Lighting** via `scripts/lighting_lookup.rb` was run once: the ops floor and cable vault are not lit in any other scenario; server room and generator room are motion-lit.
- **Music BPM** not analysed.
- **Walk-line picks** not made (orchestrator).
- **Playtest** of the entry states (not in scope).

## 7. Blockers for the decided lines

1. **Ending NEW 2** ("Fifteen minutes on your wall...") is not in any ink file. Needs authoring into `taunt_t10`, then npc-dialog-review, then the user's yes for voicing with a line count.
2. **HaX way-in** ("Whichever way you turned it...") returns 403 from the endpoint. The phone lines appear not to be voice-eligible through `/tts`. A decision is needed on whether HaX phone lines are voiced at all.
3. **Hook fallback cut** and **HaX cut**: the endpoint accepts only whole ink lines, so the outline's "cut before 'Three days ago'" cannot be a separate clip. Use the full 19-word line or pick a different line.

## 8. Restart

- Keyless server on :3034 (stopped): `cd <worktree> && env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3034 BE_DB_USER=deploy RBENV_VERSION=2.7.8 BUNDLE_PATH=<main>/vendor/bundle nice -n 19 bin/rails server -b 127.0.0.1 -p 3034`.
- Game 12255 remains in the dev database (not edited).
