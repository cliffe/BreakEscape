# P4-T: Phase 4 review and playtest

Read-only review of the pretext call (judge, session, prep, lockout, bar, tells, pip, slice data) against Phase 4 "Done when" and §2.4. No game file was edited.

Date: 2026-10-21. The slice runs are games 2929, 2930 and 2935 on the keyless server at :3001.

## Checks run

- `bundle exec node --test` on `social-pretext-judge`, `social-pretext-session`, `social-pretext-prep`, `social-influence-pip`, `social-influence` and `validator-social-pretext`: 84 pass, 0 fail.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink`: exit 0. The remaining warnings are the generic "pretext VAR never set in ink" lines and unused call globals. Social errors: none.
- A one-off load of `pretext-judge.js` against `test/js/fixtures/social/pretext_judge/ledgerwell.json`, in the scratch folder, for the blank-key case below.
- Three headless slice runs. Session logs:
  - got both asks, reload, pip: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P4-T/got-it/session.jsonl` (game 2929)
  - report, refusal, lift: `.../se-P4-T/report-lift/session.jsonl` (game 2930)
  - ring off, reopen, mail: `.../se-P4-T/walk-away/session.jsonl` (game 2935)
- R3 browser runs for m01–m08, `lab_scanning` and `sis01` were started. Their comparison tables are not in this file yet. See "R3" at the end.

`verify-run.rb` on 2929 and 2930 prints `BOOTSTRAP ONLY`. The slice is one room with no door and no container, and those two routes complete no task, so the verifier has nothing it counts. The server record still shows play: 2929 has `se_intel_teague_role` and `quinn_call_done`; 2930 has `brandt_reported`. Game 2935 reaches `progress recorded` only because the tester then sorted the inbox (`triage_sorted`). That task is outside the pretext route. The session logs and the screenshots are the evidence for the call.

## Findings

| id | sev | file:line | finding |
|----|-----|-----------|---------|
| T4-1 | blocker | `public/break_escape/js/minigames/person-chat/person-chat-pretext.js:528-541`; `person-chat-minigame.js:1526-1532` and `:1604-1612`; `phone-chat-minigame.js:754-758`, `:971-977`, `:1129-1145`; `systems/social-influence.js:615-620` | A finished pretext call never finalises. The outcome global, the debrief and `session.open = false` are written only inside `finish()`, and `finish()` runs only when `complete(true)` is called. Person-chat, on ink `END`, shows "(Conversation ended - press ESC to close)" and does not call `complete(true)` unless `disableClose` is set. Esc, the × and End Conversation call `complete(false)`, which skips `finish()`. Phone-chat, on ink `END`, shows "Conversation ended" and stays on the thread. A report calls `closeConversation()`, which tears the pretext hook down without finalising. |
| T4-2 | major | `public/break_escape/js/systems/pretext-judge.js:124-131`; `minigames/pretext-prep/pretext-card.js:175-183`; `minigames/person-chat/person-chat-pretext.js:380-389` | The judge reads a blank by its name (`from: "blank:name"` looks up `blanks.name`). The card and `fillPretextVars` store the choice by fact id (`{ manager: { value, label } }`). A correct Priya manager, passed in the card's shape, scores as an identity miss of -30 with an empty "you said". The same value keyed the way the judge tests do (`{ name: "pierce_full" }`) scores +10. The slice and the Dev example use the same string for the blank and the fact, so those calls still score. `06` §5 `give_manager` (`{ name: "manager" }`) does not. |
| T4-3 | major | `scenarios/test_social_slice/scenario.json.erb:515-518` and `:557-560` | Phase 4 "Done when" asks for a granted fact in the mail composer's blank, and a `strictIfGlobal` on the report global that makes the target harder. Both Brandt asks set only `brandt_call_done`. Both Quinn asks set only `quinn_call_done`. Nothing in the slice is `grants.intel`, and the slice has no `strictIfGlobal`. The engine can grant a fact (`person-chat-pretext.js:204-208`) and can tighten a factor (`mail-bridge.js:94-97`). This slice never does either. |
| T4-4 | major | `scenarios/test_social_slice/ink/brandt_desk.ink:42-45`; `quinn_floor.ink:35-38`; `systems/interactions.js:633-651` | A granted ask is offered again. The call knots are sticky choices with no check for a fact already held. `startPretextCall` does not say the call is finished when every grant is held (`06` §6). The two asks on a character also set the same global, so a later call cannot tell which ask was the one already given. |
| T4-5 | minor | `person-chat-pretext.js:68`, `:280`, `:312` | `session.turn` is never increased. Every log row is stored as turn 0. The influence ledger uses its own counter and did apply three separate lines, so this is the log field, not a double-apply. |
| T4-6 | minor | `06` §4.5; slice `hints` at `scenario.json.erb:539` and `:579` | Nothing reads a call's `hints`. The three-step ladder after a report is not shown. |
| T4-7 | minor | `scenarios/test_social_slice/ink/quinn_floor.ink:54-59` | Both granted asks share one spoken reply. The shift ask was answered with "Over by the window, there." |
| T4-8 | minor | `ui/influence-bar.js` (the in-memory log); game 2929 | After a reload the bar number came back and the "Last change" line did not, until a new line was played. The service log does not survive a reload. |
| T4-9 | minor | `app/views/break_escape/games/show.html.erb:73`; `pretext-prep-minigame.js:33` | The prep overlay is styled twice: the page links `pretext-prep-minigame.css`, and the module injects `pretext-prep.css`. The two copies can drift. |
| T4-10 | minor | `person-chat-pretext.js:296-297` | `applyGrants` is started and not awaited before the session is saved. `setGlobal` is synchronous once the module is loaded. The first call waits on a dynamic import, so a grant can land a tick later. Not seen in these runs. |
| T4-11 | minor | validator output on `brandt_desk.ink` and `quinn_floor.ink` | The generic ink check warns that `pretext_*_name` and `pretext_*_value` are read and never set in the ink. The engine fills them at runtime. Every call story will carry that warning. |

## What the slice runs showed

### Game 2929: both asks, reload, pip (Quinn)

The name was earned. The OSINT workstation, company site, Our Team, Morgan Teague's row set `se_intel_teague_role`. The prep card then listed that sentence, and the person blank offered Morgan, Ms Teague and Morgan Teague.

"I'm here for Morgan Teague, actually." moved Quinn from 0 to 10. The bar read "Last change: +10 person". The tell was "Person. Morgan is on the floor plan." Screenshot: `.../got-it/shots/01_bar_after_open_floor.png`.

After `sync` and `?skip_resume=1`:

- `quinn_influence` was still 10.
- `pretext_quinn_floor_call_state` was still open, with the `open_floor` log row.
- A world pip was drawn for Quinn (`npcInfluencePips` entry `quinn`, value 10) and the shot shows a short red bar over the character at the back of the room (`shots/02_world_pip_after_reload.png`).
- The card asked for the name again. Approach was disabled until Morgan Teague was picked again.
- The "Last change" line was absent until the next line (T4-8).

"Which desk is theirs?" granted `desk_location` and set `quinn_call_done`. "And what shift are they on?" came back pending and dropped influence to 0, which hid the pip (the start value). The Morgan line again verified the ask. The shift ask then granted. Quinn's line for that grant was the desk line (T4-7).

"No worries, I'll catch them later." showed "(Conversation ended - press ESC to close)", with the bar, the tells and Skip still on screen (`shots/05_conversation_ended_no_debrief.png`). No debrief. `pretext_quinn_floor_call_outcome` stayed `""`. The session stayed `open: true`. Esc closed the chat the same way. A second entry kept both asks in `grantedAsks`, so the open session had been resumed (T4-1).

Earned secrets: Morgan Teague (`teague_full`), from the team row, before the blank was used. Yes.

### Game 2930: report, refusal, one-minute lift (Brandt)

No fact was required. Three times "My manager said you could sort this out." Influence went -10, -30, -50, -70. The third line ended the thread. The phone dropped to the contact list with "I'll need to check this with my ..." (`shots/01-after-third-line.png`). No debrief.

Right after the report: `brandt_reported`, `brandt_wary` and `brandt_refusing` true; `brandt_latched` "wary,refuses,reports"; `brandt_lockout_channel` "phone"; `brandt_lockout_until` 112395 (game-clock ms); influence -70; outcome `""`; session `open: true`, `reportedThisCall` true, reason `threshold`, log length 3.

Interacting again before that deadline did not open pretext-prep. A second capture on the same game, with a toast observer, read "Brandt will not talk to you right now." The first attempt missed the toast because it lasts 2.5 seconds and the probe was late. The refusal itself (no overlay) was seen both times.

The flags did not clear on their own while the tester waited. The next interact, past the deadline, opened pretext-prep and lifted: influence -30, `brandt_wary` false, `brandt_refusing` false, latch `""`, lockout until 0, channel `""`. `brandt_reported` stayed true. That flag has no `clearOnRearm`, so keeping it is what the data says. The session was still the open reported call (`open: true`, log length 3, `reportedThisCall` true). Shot: `shots/02-prep-after-lockout.png`.

Earned secrets: none. No PIN, code or flag.

### Game 2935: ring off, reopen, mail

First call, "I'll ring back later." at once. The phone said "Conversation ended". No debrief. Outcome `""`. Session `open: true`. `brandt_call_done` false.

Second open, every choice was still there:

1. "asked me to chase this for them."
2. "Sorry, it was  who put me on to you."
3. "It really is urgent, I'm sorry to push."
4. "My manager said you could sort this out."
5. "Can you tell me the portal's name?"
6. "And when do payslips go out?"
7. "I'll ring back later."

"Can you tell me the portal's name?" got "There you go." and the tell "ASK OK floor -30, now at -10. He read it out." `brandt_call_done` true, `grantedAsks` `["portal_name"]`. Reload with `?skip_resume=1` restored the bar at -10 and that log row. No world pip for Brandt (no walk sprite; the room sprites are the host and Quinn). Ringing off again left outcome `""` and `open: true`.

Third open: the same seven choices, including the portal ask (T4-4).

Mail, after noting Morgan on the team page: the greeting blank offered Morgan, Ms Teague and Morgan Teague, which is `teague_role`, not the call. Sender name, sender address, the file and the date blanks stayed "no evidence yet". No portal option. "On the board" on the prep card stayed "Nothing on the board yet." `brandt_reported` was never set on this game, and the slice has no `strictIfGlobal` to show a harder checklist (T4-3).

Earned secrets: the Teague contact, from the team row, before she appeared in the composer. Yes. The call grant added nothing to that list.

## Done when

| Bullet | Result |
|--------|--------|
| `social-pretext-judge`, lockout cases in `social-influence`, `validator-social-pretext` | Pass (inside the 84). |
| Slice has a Dev-style call | Brandt on the desk phone, Quinn in the room with a walk sprite. |
| A call that grants both asks | Quinn, game 2929. Both asks granted. The outcome global was not written (T4-1). |
| A clumsy call, report, lockout, phone refuses before prep | Brandt, game 2930. Toast "Brandt will not talk to you right now." Prep did not open. |
| Reload mid-call restores the bar and the log, and the pip for the sprite character | Games 2929 and 2935. Bar number and log came back. Pip showed for Quinn at 10 and hid again at 0. The card had to be filled again. |
| After the one-minute lockout the call opens, influence is `recoverTo`, band flags clear | Game 2930. Prep opened. Influence -30. `brandt_wary` and `brandt_refusing` cleared. The old session was still open (T4-1). |
| Left early (`walked_away`), reopen, only the ungranted ask offered | Outcome stayed `""`, not `walked_away` (T4-1). The granted portal ask was still offered (T4-4). |
| Granted fact in the composer blank, and `strictIfGlobal` on the report global | Not in the slice (T4-3). Game 2935 confirmed the composer did not gain a call fact. |
| Back-compat items 2 to 8 | The standing node tests in that set were not re-run as a separate suite here. They passed in the P4-B log (94/94) and these packets did not edit the m01–m08 ink. The browser half is the R3 runs below. |

## R3

Short browser runs on :3001, compared with the 0.0 baselines in `build_log/baselines/browser/`. A DIFFERENT line is a regression only when the play changed. Cosmetic order, a missed intermittent console line, and an additive test field are recorded and not raised as findings.

### m02 (game 2931)

`verify-run.rb` exit 0: progress recorded, 5 rooms beyond the first, 6 tasks. Session log `.../scratchpad/se-P4-T/r3-m02/m02-session.jsonl`. Rooms, inventory, NPCs, globals and tasks match the baseline. No hostile state on Bernie, Doyle, Val, Raval or HaX. Phone chat and the ward bark message both arrived. Reload kept the globals.

**27 SAME, 5 DIFFERENT, 1 NOT REACHED.** None of the DIFFERENT lines is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| P5 | "Understood." on the HaX phone got no reply. The line "Those are the patients at risk…" arrived after entering the ward. | That text is the `room_entered:hospital_ward` timed message (`scenarios/m02_ransomed_trust/scenario.json.erb` around the mapping the tester cited). The baseline had credited it to the choice. The message did arrive. |
| R3 | Inventory order did not swap on reload. | Same items. |
| R9 | Phone unread was 0 after reload, baseline 1. | This run had already opened the bark. The baseline had not. |
| K5 | No TTS audio-load timeout. | Intermittent on the keyless server. The baseline saw it once. |
| K6 | No "no path to target" warning. | Depends on the walk. |

NOT REACHED: the on-screen bark card on entering the ward (B2). The phone message was delivered (unread, then the history line). The toast itself was not seen, because the check ran outside the card's lifetime. Phase 0 bark presentation is unconfirmed for this run, not failed.

### m05 (game 2937)

`verify-run.rb` exit 0: progress recorded, 5 rooms, 6 tasks. Session log `.../scratchpad/se-P4-T/r3-m05/m05-session.jsonl`. Patricia, Lisa, Owen and Dr Halloran popups showed. The Patricia phone pair matched: the mobile arrives after the first meeting, "Just checking in." does not move influence, and the in-person chat resumes after reload. Final ink influence matches the baseline (Patricia 6 then 7, Lisa 25, Owen 20, Halloran 10).

**35 SAME, 5 DIFFERENT, 1 NOT REACHED.** None is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Lisa | 4 popups, baseline 3. Final `lisa_influence` 25 both times. | The mood topic has two `#influence_increased` tags. The extra popup is one the baseline dropped at the turn limit. |
| Halloran | 3 popups, baseline 2. Final influence 10 both times. | Same pattern: the +10 after "I'm not here to judge" showed here and was dropped in the baseline. |
| `se` | `phone-chat` `getState` now has an `se` key (`null` on the contact list, an empty tells object in the thread). | Added by the Phase 4 chat header. Empty for a mission with no social characters. |
| Inventory | Kit order after reload differs from the baseline's reorder. | Same items. |
| Turns | Post-reload Patricia `converse` reported 9 turns, baseline 11. | Same transcript and choices. |

NOT REACHED: the phone contact list before meeting Patricia. `patricia_phone_available` was false beforehand. The list itself was not opened.

### m03 (game 2933)

`verify-run.rb` exit 0: progress recorded, 2 rooms beyond the first, 4 tasks, score 18. Session log `.../scratchpad/se-P4-T/r3-m03/session.jsonl`. Rooms, inventory, the 17 globals and the 4 tasks match the baseline. Ffion's day chat, the reception-badge clone, Victoria's chat and card clone, and the night bark all played. Reload kept the globals and the saved cloner card. Nobody turned hostile.

**29 SAME, 5 DIFFERENT, 4 NOT REACHED.** None of the DIFFERENT lines is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| D1 | 18 raw Ffion popup nodes, baseline 11. Net influence 55 both times. | The observer counted the popup container as well as the popup. Ten distinct timestamps match the baseline's count once its same-millisecond pair is set aside. |
| D2 | The "cloner's antenna" narrator line was not seen between Lean in and the flipper. | The ink still has the line (`m03_npc_ffion_rees.ink:299`). It may have passed between reads. The clone itself completed. |
| D3 | After reload, Ffion no longer offers "Lean in". | This run cloned the badge before the reload. The baseline's first clone had failed, so the option was still there. |
| D4 | Three HaX lines the baseline does not list (badge saved, thank her, server room). | Each is an authored timed message in `scenarios/m03_ghost_in_the_machine/scenario.json.erb` (the tester cited the mappings near 863, 897 and 917). |
| D5 | Door-pathfinding warning count for the conference room was 2, baseline 3. | The hook buffer was cleared by the reload. |

NOT REACHED: the old `converse` path that left the flipper open (baseline F1), the resume-overlay click, `bootstrap resume`, and the `female_hacker_hood_v2_talk.png` 404. Enter on the title screen resumed the game, so the overlay never showed. The night bark card was seen in the DOM within 3 seconds of entering reception.

### m06 (game 2938)

`verify-run.rb` exit 0: progress recorded, 3 rooms beyond the first, 5 tasks. Session log `.../scratchpad/se-P4-T/r3-m06/m06-session.jsonl`. Reading the starter checklist set `server_passphrase_known` and HaX sent the house-rule line. Irina's four tagged lines each gave one increased popup. Trust went 15, 20, 30, then 35 after the reload, and she handed over the badge. The server-room password `bitcoin2025` was taken from the checklist plus her word list, then accepted. Rooms, inventory, NPCs and globals match the baseline. `irina_trust` is still absent from the persisted globals list, as in the baseline.

**25 SAME, 3 DIFFERENT, 2 NOT REACHED.** None of the DIFFERENT lines is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Resume | The resume overlay was present under the title screen. Resume was clicked through the DOM. The baseline says none appeared. | The overlay markup is unchanged since the baseline. Enter on the title screen resumes while it is up (`show.html.erb:321-345`). The baseline's Enter presses may have cleared it without the tester noticing. Play carried on. |
| Console | 54 TTS 503s. The baseline reported zero. | Keyless server, one 503 per spoken line. No uncaught page error. |
| verify-run | Extra `tasks`, `tasks_completed`, `score` and `social scenario false` lines. | The verifier grew after the baseline. The game fields match. |

NOT REACHED: whether Enter alone dismisses the title screen (the prompt was clicked), and the `timedMessages` length across the reload.

### m07 (game 2944)

`verify-run.rb` exit 0: progress recorded, 1 room beyond the first, 2 tasks. Session log `.../scratchpad/se-P4-T/r3-m07/m07-session.jsonl`. The briefing chain ended with `team_assigned`, `team_assignment` "fracture" and `hurt_line_said`, and HaX delivered the "let it hurt afterwards" line once. The phone thread survived a reload with no duplicate and no `EXTERNAL` story involved. Entering the operations floor set `inside_reached` and `architect_contact`. Rooms, inventory contents, NPCs and flags match the baseline.

**26 SAME, 5 DIFFERENT, 2 NOT REACHED.** None of the DIFFERENT lines is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Order | The event stream sets `team_assigned` and `hurt_line_said` before `assign_tactical_team` completes. The baseline wrote the task first, from state reads rather than the stream. | End state matches. The ink sets the globals and then completes the task (`m07_opening_briefing.ink:288-289`). |
| Console | 33 TTS 503s, no 404s. The baseline had 29 503s and 3 unidentified 404s. | Keyless TTS. The 404s did not recur. |
| Globals | This run has `hollis_backed_off` and not `visitor_log_read`. | The route: Hollis was told to back off, and the visitor log was not read. |
| verify-run | The same extra score lines as m06. | Tooling. The game fields match. |
| Continue | `mg continue` advanced "Fracture. Confirmed." The baseline stalled and used Skip. | The line did advance. |

NOT REACHED: `visitor_log_read` (not read), and the HaX unread badge after entering the floor (the thread was opened first).

### m04 (game 2934)

`verify-run.rb` exit 0: progress recorded, 3 rooms beyond the first, 3 tasks. Session log `.../scratchpad/se-P4-T/r3-m04/m04-r3-2934.jsonl`. The Vance pair matched. Every spaced `# influence_increased` still produced the doubled popup, on the person chat and on the phone. Trust went 30, then 105, 108 and 113 across the two stories, the same as the baseline. The five HaX and Vance barks arrived with the baseline text. Reload kept all 95 globals. The two globals and the task the baseline had from the maintenance work orders were not collected, because that step was not repeated.

**38 SAME, 4 DIFFERENT, 2 NOT REACHED.** The report also lists the guard's turn count as its own line, which makes five notes. None is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Guard turns | 14 before the reload, 13 after, baseline 13. | The transcript is the same 13 lines. |
| Bark 4 | "Nine of Vance's night crew…" arrived about 30 s after the dial read, not on the Vance conversation close. | The mapping is `anomaly_detected` with a 30 s delay (`scenarios/m04_critical_failure/scenario.json.erb:872-878`). The text arrived. |
| Title | `mg continue` did not dismiss the title screen. A click on the prompt did. | Load average was 36 to 50. The click path worked. |
| Resume | The resume overlay was present. The baseline says it was not. | `has_progress?` is true after play, and the overlay is what `show.html.erb:326-337` shows. Resume brought the 95 globals back. Same observation as m06. |
| 404s | None. The baseline listed 32. | Fewer missing-asset errors, counted a different way (page hook against the server log). |

NOT REACHED: `moveToNear` on Vance, and whether `pressKey Enter` is refused on the title screen. The stories loaded. The server ink log was not read.

### m01 (game 2932)

`verify-run.rb` exit 0: progress recorded, 6 rooms beyond the first, 2 objects, 1 flag, 10 tasks, score 37. Session log `.../scratchpad/se-P4-T/r3-m01/session.jsonl`. The opening phone briefing matched. Kevin's `#hostile:kevin_park` still shows "Kevin Park turns on you" and no influence popup. Derek's `#hostile` then `#influence:-100` still turns hostile through `#hostile`, and the console still logs `Unknown game action tag: influence`. Sarah and Kevin popups matched. Reload kept the globals and Kevin's hostility. The phone's test state now carries an empty `se` field, the same Phase 4 addition seen on m05.

**52 SAME, 4 DIFFERENT, 3 NOT REACHED.** None of the DIFFERENT lines is an SE regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| D1 | Kevin's hostile bar reads attack 30, cooldown 2600. The baseline read 15 and 2000. | Commit `d9d2bf59` (combat fight styles, 17:36 today) sets Kevin to slugger, damage 30. It is an m01 scenario edit, not this build. |
| D2 | Derek's bar reads 150 HP, attack 30, cooldown 3200. The baseline read 100 HP, attack 25, cooldown 2000. | The same commit: Derek is guarded, 30 damage, 150 HP. |
| D3 | Global key count across the reload was 70 and 70. The baseline wrote "70 vs 69". | The values matched in both runs. The baseline's count was a snapshot timing note. |
| D4 | One TTS 503, no 404s. The baseline listed 27 404s and one 503. | Fewer missing-asset errors. |

NOT REACHED: the briefing `waitFor` the baseline said not to issue, Kevin's mid-conversation influence of 6 (read only at the end, when it was 8), and a duplicate "Password Accepted" popup. The IT PIN `2468` was read from Kevin's voicemail before it was used. The SSH flag was supplied (`<flag:1>`), and Derek's password list was not visited, the same boundary as the baseline. Neither fight was played out to a knockout.

### m08 (game 2936)

`verify-run.rb` exit 0: progress recorded, 7 rooms beyond the first, 1 object, 4 flags, 10 tasks, score 33. Session log `.../scratchpad/se-P4-T/r3-m08/session.jsonl`. The spaced popups were Vector `+`, Phantom `+`, Phantom `+`, Phantom `-`, then Vector `+` after the reload, and `vector_influence` ended at 3. The brief, interview, server-room and flag chains reached the same end state as the baseline. Reload kept the globals. The four GitList flags were supplied (`<flag:1>` to `<flag:4>`). `TrustNoOne` and the printer PIN `0311` were read from the break-room Post-It before use.

**35 SAME, 4 DIFFERENT, 3 NOT REACHED.** None of the DIFFERENT lines is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Audit order | Both note removals are logged before `read_the_archives` completes. The baseline put the task completion between the two removals. | The task still completes once. The mapping is `global_variable_changed:found_badge_audit` (`scenarios/m08_the_mole/scenario.json.erb:621-625`). |
| Badge order | `item_picked_up:keycard` is logged, then `badge_cloned`. The baseline listed the global first. | The mapping sets `badge_cloned` on `item_picked_up:keycard` for `printed_server_badge` (`scenario.json.erb:1060-1063`), so the pickup comes first. |
| Printer lock | The lock step list had one "tap 0311" step, baseline two. The container still opened. | The PIN path worked. |
| Page errors | 63 TTS 503s, no 404s. The baseline's post-reload drain had 9×503 and 3×404. | Keyless TTS. The 404s did not recur. |

NOT REACHED: the mid-conversation lag of `exportNpcInkVariables()` (the live story was read instead), popup timing in milliseconds, and a classification of `console.warn` kinds.

### lab_scanning (game 2946)

`verify-run.rb` exit 0: progress recorded, 1 room beyond the first. Session log `.../scratchpad/se-P4-T/r3-lab/session.jsonl`. Three instructor popups, each `+ Influence: Reconnaissance Specialist`, class `influence-popup influence-increased`. Ethics went 0 to 10 on the intro. Rapport went 0 to 5, then 5 to 10. After Resume the intro replayed and the intro popup fired again with ethics 0 to 10 and rapport 0. No secret was used.

**15 SAME, 2 DIFFERENT, 3 NOT REACHED.** Neither DIFFERENT line is a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Tutorial | The welcome prompt showed before the reload only. The baseline saw it after the conversation closed on both sides of the reload. | This run dismissed it before the reload, so `engine_tutorial_declined` was already saved. The baseline does not say when it was dismissed. |
| Page errors | 20×400 before the reload, 0×404. The baseline had 19×400 and 2×404. | The 400s are keyless TTS. The 404s were never traced to a URL. |

NOT REACHED: popup colour, `instructor_rapport` inside `getState().globals` (only `scanning_ethics` was read there), and whether the resume overlay's "Load session" text is a link. The overlay's Resume, Restart and New Session buttons were listed.

### sis01 (game 2947)

`verify-run.rb` exit 0: progress recorded, 2 rooms beyond the first, 1 task, score 4. Session log `.../scratchpad/se-P4-T/r3-sis01/session.jsonl`. Hartley gave one `+ Influence: Dr Fiona Hartley` (`hartley_trust` 0 to 5, `npc=dr_hartley`). After Resume she reopened at the hub with trust 5 and no second popup. David gave one `- Influence: David Osei` (`david_trust` 0 to -5). The visitor card came from Sarah's briefing. Both doors opened with the card. No PIN or flag was used.

**16 SAME, 1 DIFFERENT, 5 NOT REACHED.** The DIFFERENT line is not a player-facing regression.

| id | What differed | Why it is not a finding |
|----|---------------|-------------------------|
| Page errors | None. The baseline had 2×404 before the reload and 1×404 after. | Those 404s were never traced to a URL. The session log has no page-error entries. |

NOT REACHED: whether the popup node had left the DOM at the hub, Hartley's trust sample at the exact moment the player line showed, whether a title screen appeared after the reload (Enter was pressed without a look), the same DOM check for David's popup, and the decreased-popup colour.

### R3 as a set

m01 to m08, `lab_scanning` and `sis01` have all reported. Each `verify-run.rb` recorded progress. No DIFFERENT line is a Phase 4 regression. R3 holds.

The m06 and m07 runs saw another session's uncommitted edit in `public/break_escape/js/core/player.js`. They did not edit it. It is outside this packet.

## Verdict

R3 holds. Phase 4 is still not done. One blocker (T4-1: a finished call never records its outcome, never shows the debrief, and stays open so the next ring resumes it) and three majors (T4-2 blank key, T4-3 the email loop is not in the slice, T4-4 a granted ask stays on the menu). The judge tests, the lockout lift and the live bar, tells and pip do what the runs asked of them.

## Fix round 1

| Finding | Outcome |
|---------|---------|
| T4-1 | Fixed. Closing the chat (Esc, the ×, End, ink END, the phone back control) finalises the call and shows the debrief. `{ aborted: true }` and a superseded instance do not. `person-chat-pretext.js:539-575`; `person-chat-minigame.js:1608-1609`; `phone-chat-minigame.js:1135-1153`. Bridge-4 dismisses that debrief before it expects the overlay to be gone. |
| T4-2 | Fixed. A blank is read by its name, then by fact id, including the card's `{ value, label }`. `pretext-judge.js:125-146`. |
| T4-3 | Fixed. Brandt grants `portal_name` and `payslip_date` (a sender name and a date for the composer). Quinn grants `desk_location` and `shift_pattern`. Teague's `strictIfGlobal` promotes `senderAuth` once `brandt_reported` is true. `scenario.json.erb:248-275`, `:502`, `:551-554`, `:593-596`. |
| T4-4 | Fixed. Each ask is hidden once its fact is held, and a call whose every ask is already granted toasts and does not open prep. `brandt_desk.ink:44-47`; `quinn_floor.ink:37-40`; `interactions.js:643-665`. |
| T4-5 | Fixed. The session log's turn increments when a say or an ask is recorded. `person-chat-pretext.js:281`, `:318`. |
| T4-6 | Fixed. A reported call increments `pretext_<callId>_reports`, and prep shows that step of `hints`. `person-chat-pretext.js:354`; `pretext-card.js:180`; `pretext-prep-minigame.js:141`. A third hint is on each slice call. |
| T4-7 | Fixed. The shift grant has its own line: "Early shift. They're in from eight." `quinn_floor.ink:56-63`. |
| T4-8 | Fixed. With an empty service log, the bar takes the last non-zero delta from the saved call session. `influence-bar.js:143`. |
| T4-9 | Fixed. Prep no longer injects a second stylesheet. The copy next to the module is gone. The page still links `pretext-prep-minigame.css`. |
| T4-10 | Fixed. `grantFact` is loaded with the module, and the grant runs before the session is saved. `person-chat-pretext.js:49`, `:198-207`. |
| T4-11 | Fixed. The unread-VAR check skips `pretext_*_name` and `pretext_*_value`, which the card fills. `validate_scenario.rb:3761-3762`. The strict-social run no longer warns on those two. |
