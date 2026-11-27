# m10 "Full Disclosure": trailer scout (60 s outline)

Scout for `docs/video/edits/M10_TRAILER60_OUTLINE.md`, decided-lines block first. No repo file changed except this report. Nothing committed. Scratch files are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m10/` (line lists, TTS logs, clips).

## Headline

- **Decided ending and hook: both have live audio.** The ending pitch "Your service spent decades hoarding the world's weak points. At six, I give them back." returns 200 (8.21 s) when tested with its `#delivery:` note. Without the note it returned a false 503 in the first run. The hook, Netherton's "At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone.", returns 200 (10.82 s).
- **Lines tested: 22.** 20 returned 200 `audio/mpeg`. 2 returned 403 because the text is not in any ink file (see "Not in the game"). 0 returned 503 after the delivery rerun.
- **Control line:** refused with 403 in both runs ("Zebra quartz waffle protocol zero seven."), so the text check is live.
- **Blockers for a decided line:** none for the audio. Two timing points need the take stage: the decided ending cut and the WREN aside (both explained below).

## Environment

- Keyless server on 127.0.0.1:3037, started by this scout at `nice -n 19`, log in the scratch folder. Game **12256** created with `tools/playtest/new-game.rb m10_full_disclosure` (flags file `tools/playtest/m10_full_disclosure-flags-game12256.xml`, gitignored). Postgres was already online and was not touched. No db tasks run. No game row edited. Port 3000 and the other forbidden ports untouched.
- Environment fixes needed to start Rails in this worktree (the brief's values did not work here):
  - `BE_DB_USER=root` gives "role root does not exist". The dummy app's default role is `deploy` (`test/dummy/config/database.yml`), so the variable is left unset.
  - `BUNDLE_FORCE_RUBY_PLATFORM=true` breaks Bundler here (gems not found). It is left unset.
  - `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle` is correct and needed. `tools/playtest/new-game.sh` sets it only when `vendor/bundle` is absent, so the direct `bin/rails runner tools/playtest/new-game.rb` call was used.
- The worktree checked out at `.claude/worktrees/v-trailers-1120` is on branch `video/trailers-m01-m02-spies`, not `video/trailer-lines-m04-m10` as the brief implied. The m10 folder and the video docs are present there.
- A first start attempt left a puma process on 3037 that was started by this scout and held the port. It was stopped and the server was restarted.
- **Still running at the end of this report:** no. The 3037 server was stopped at the end (see "Environment at end").

## Part A: voiced lines

### Method

- Pool from `tools/video/scout/dump-lines.rb m10_full_disclosure` (1,279 lines, `--max-words 40` so the long lines are present). Each line below is the whole ink line, as the endpoint needs.
- Live test: `tools/video/scout/tts-test.mjs --server http://127.0.0.1:3037 --game 12256 --lines <picked.json>`. The first run used no delivery note. The rerun passed the note from the dump's `delivery` field. A 503 counts only where the note was passed (the rule from the orchestrator's fix).
- Conversation paths come from reading the ink. They are "expected from ink, not played". A take will prove them.

### Results table

| ID | Speaker (npc id) | Exact text (whole ink line) | Ink file, knot | Path and entry state | Clip | Live |
|---|---|---|---|---|---|---|
| END1_pitch | Tesseract (`tesseract`) | Your service spent decades hoarding the world's weak points. At six, I give them back. | `m10_tesseract.ink` `case` (first line of the pitch, after "Go on, then.") | core, all four flags submitted and `flag4_heard`, `core_greeted` set: `--start-room core --set flag1_submitted=true flag2_submitted=true flag3_submitted=true flag4_submitted=true flag4_heard=true core_greeted=true`. Expected, not played. Delivery note `calm and reasonable, almost generous` | 8.21 s | 200 with note (503 without the note: a false result, superseded) |
| END2_city | Tesseract | City by city. Or you press this, and they go everywhere in the same minute. Eleven hundred to twenty-six hundred, the first month. | `case`, second line of the pitch | as END1_pitch | 11.81 s | 200 |
| THREAT_hospitals | Tesseract | Hospitals, dispatch, water. In the hands of people who could never have got in before. | `case`, third line of the pitch | as END1_pitch | 8.50 s | 200 |
| END_takeyourtime | Tesseract | Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you. | `arrival` | first talk to him at the core, no flags: `--start-room core`. Plays on arrival in every fresh game | 9.02 s | 200 |
| END_nothingwent4 | Tesseract | Nothing went at four. You were thorough. | `arrival` (else branch, fresh game) | as END_takeyourtime | 4.22 s | 200 |
| END1_oneofyou | Tesseract | It has to be one of you. If I press it, it's a crime. If you press it, it's a confession. | `case_why`, first line after the two menu picks | as END1_pitch, then pick either "why" choice | 9.29 s | 200 |
| END3_watch | Tesseract | I prefer to watch. I've watched you since your first day. | `case_why`, fresh-game branch (`else`) | as END1_pitch, through `case_why` | 5.06 s | 200 |
| OFF_derek | Tesseract | Your first operation was Derek Lawson. I chose him for you. | `rec_derek` | outline lists it as Off. Result only | 6.05 s | 200 (Off, not a pick) |
| HOOK_netherton | Director Magnus Netherton (`director_netherton`) | At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone. | `m10_director_netherton.ink` `briefing_stakes`, first line | cold start: `--start-room forward_post` (or fresh game), through `briefing_facts` into `briefing_name` (cold start only) then "You knew him well, then." (or "What's the second thing?"), which reaches `briefing_stakes`. Expected, not played | 10.82 s | 200 |
| HOOK_city_src | Netherton | City by city from six. Or everywhere in the same minute, if someone presses his key. | `briefing_stakes`, second line | as HOOK_netherton | 8.18 s | 200 (not named in the outline; spare) |
| SLEEPER_wren_aside | Netherton | Their ledger calls that person WREN. Placed eleven years ago. It puts WREN on this team. | `aside`, the `not m09_completed` branch | the van end after the briefing, `aside_done` not set. Expected, not played | 8.98 s | 200 (see timing note) |
| HAX_briefing_expecting | Agent HaX (`agent_0x99`) | Well enough to know he's expecting us. | `m10_director_netherton.ink` `briefing_name`, after "You knew him well, then." | cold start, as HOOK_netherton, first choice | 2.45 s | 200 |
| HAX_preface_chief | Agent HaX | Our former chief strategist. He trained me, and half the field. He walked out seven years ago. | `briefing_name`, line before the choice | as HAX_briefing_expecting | 6.70 s | 200 (already in the ink, so the outline's "before it" needs no new line) |
| PHONE_breaker | Agent HaX (phone, `agent_0x99`) | Top row. The third breaker from the left feeds the shutter. | `m10_phone_agent0x99.ink` `cut_step_2` | power room call, `cut_step_1` then `cut_step_2` (not `gallery_shutter_cut`). Expected, not played | 3.70 s | 200 |
| PAYOFF_wendell | Wendell Briggs (`wendell`), bark | Your funeral. I didn't see a thing. | `scenario.json.erb:3593` bark | `global_variable_changed:gallery_shutter_cut`, needs `wendell_outcome === 'worked_round'` and **`cut_step === 3`** (see the timing note). Once only | 3.38 s | 200 |
| PAYOFF_gallery_guard | Monitor guard (`monitor_guard`), bark | Camera's dead again. I'll go and look. | `scenario.json.erb:4192` bark | `room_entered:gallery` with `gallery_camera_blinded === true`. Once only | 3.74 s | 200 |
| QUIN_doors | Agent 0x2D 'Anchor' Quintero (`quintero_post`) | I don't like doors that know your name. | `m10_quintero.ink` `so`, `breach_announced` branch | security office with `breach_open=true breach_announced=true`. Expected, not played | 2.74 s | 200 |
| TUNNEL_post_closed | Tunnel guard (`tunnel_guard`) | Hold it. Post's closed till the shift changes. | `m10_guards.ink` `tunnel`, first line | forward post blast-door tunnel, `breach_open=true briefing_played=true` (outline). Expected, not played | 4.13 s | 200 |
| TUNNEL_armed | Tunnel guard | Nobody said let you through armed. | `tunnel`, after the "Out of my way." choice | as TUNNEL_post_closed, then "Out of my way." | 2.66 s | 200 |
| FALLBACK_duty_floor | Duty guard (`duty_guard_b`) | I told you. Floor, now. | `m10_guards.ink` `duty_final` (requires `duty_warnings > 0`) | security office, `duty_warnings=1 m06_assets_seized=true` (outline). Expected, not played | 3.02 s | 200 |

### Not in the game (403, text not in any ink file)

- `NEW_HAX_setaplace` (agent_0x99): "Well enough to know he's set a place for each of us." This is the proposed replacement for HaX's hook. It needs authoring (ink at `briefing_name`, then `npc-dialog-review`, then the user's voicing yes). Result: 403.
- `PROPOSED_blast_door_pick` (tesseract): "I had the blast door read one badge tonight. Yours." The decided block cuts the blast-door line, so it is not a pick. Result: 403.

### Timing notes for the take stage (not a line result)

- **Endpoints return whole ink lines only.** The decided ending cut is "City by city. Or you press this, and they go everywhere in the same minute..." The full line is 11.81 s and continues into "Eleven hundred to twenty-six hundred, the first month." The cut must end before that figure, roughly at 6 s. The exact point needs a waveform or silence check at the take stage. Using the figure is allowed (it is the stakes).
- **The hook** "At six he publishes everything..." is 10.82 s as a whole line. The outline's cut ends at "catalogued." The first sentence needs a mid-line trim by the editor, which the outline already plans as a cut.
- **The WREN aside** is three sentences, 8.98 s. The outline's cut is "It puts WREN on this team." (last sentence), so the take must start the audio about 5 s into the line.
- **The "Take your time" arrival line** is 9.02 s. The outline's cut stops after "whatever we say." (about 4 s).

## Part B: set pieces and minigames

Not scouted in full: the outline names no new candidates beyond the beat sheet and the mechanic (below). The minigame inventory is listed from the outline's crescendo row only, because the scenario was not read further (the brief limits this pass to the decided lines and their fallbacks).

### New mechanic (per the outline)

- **Disable the Security** (card). The isolator and breakers in the power room. Phone steps `cut_step_0` to `cut_step_2`, the gallery shutter cut, the camera toggle. Entry for the power room take: `--start-room power_room --set cut_by_hand=true cut_step=2 wendell_outcome="worked_round"`. **Question for the orchestrator:** the bark PAYOFF_wendell needs `gallery_shutter_cut` and `cut_step === 3` (`scenario.json.erb:3593`). A take that stops at `cut_step=2` will not play it. Either the take runs the third breaker, or the bark condition changes. Not decided here.

## Environment at end

- Server on 3037 stopped at the end of this scout (PID from `tmp/pids/server-3037.pid`). Postgres left running (it was running when the scout started).
- Game 12256 remains in the dev database, a fresh game for m10. It is not a playtest record.
- Clips in the scratch folder: `clips/` (saved by tts-test, not in the repo).

## Not done

- Entry-state paths are read from the ink and the outline, not played. No browser run.
- Carry-over lines (Voltage, Vance, Victoria, Nightshade, Tesseract's m07 branch) were not tested. The outline lists them only as carry-over.
- Choice labels ("You'd kill eleven hundred people...", "And then what?") are player menu text, not voiced NPC lines, so they were not tested.
- Crescendo cast and the minigame inventory beyond the outline: not scouted.
- Music candidates: not checked in this pass.

## Assumptions

- Assumption: the ink's `case` knot and `arrival` path reads are right, because I read them but did not play them.
- Assumption: a fresh game's `head_start_out` falls into the `else` branch, which gives "Nothing went at four".
- Assumption: the outline's `--set` names (`flag1_submitted`, `core_greeted`) are scenario globals. The finale proof script seeds the router globals, but I did not confirm each name against its mappings.
