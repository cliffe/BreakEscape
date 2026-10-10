# m03 pass 2 trace

The replayable trace is the session logs (one JSON line per command and result). Cite by line number.

| Log | Game | Content |
|---|---|---|
| `m03-pass2-session.jsonl` | 1155 | Main route to ending, reload check, Danny, flags, safe test |
| `m03-pass2-session-ko.jsonl` | 1156 | Day checks, KO receptionist, KO Victoria before cloning, guard KO |
| `m03-pass2-session-dayko.jsonl` | 1157 | Clone, KO Victoria by day, flags, debrief |
| `m03-pass2-session-failedstart*.jsonl` | 1155 | Headed browser never exposed `window.__test` |

Command spine for the main route (game 1155), flags written as `<flag:N>`:

```
bootstrap {tutorial:decline, resume:new}
interact reception_lobby_notes_1                       # plaque, 2010
interact receptionist_npc -> choose ^Before I meet, ^What kind of training, ^Thank you, ^Yes I'm new, ^Lean across
mg Save (RFID read)                                    # clone_reception_badge
walk (keyboard) past receptionist to hallway
interact door conference; mg flipper Saved > Staff Access Badge > Emulate
interact victoria_sterling -> ^I heard Zero Day, ^Researchers deserve, ^Move closer, ^That's an impressive, ^How do you determine, ^Just a few more
mg Save (Executive Keycard)                            # clone_rfid_card
interact door server_room; flipper Saved > card > Emulate (read, Save, emulate again)
interact server_room_notes_2                           # whiteboard
interact cyberchef_workstation                         # takes laptop
converse night_guard ^Victoria Sterling asked, ^Training programme enrol
enter james_office; interact danny_foster -> ^She lied to you, ^Come in on your own
reload page, bootstrap resume, re-enter james_office, danny_foster shows after_choice
lockpick executive door (completeLockpick, assisted)
interact victoria_computer -> type VS2010 (rejected), Sterling2010
interact flag_station_dropsite -> type <flag:1>..<flag:4>
lock code 2010 (decoy, lockout) ; note DELIBERATE ; lock code 5829
interact victoria_sterling (night) -> ^SAFETYNET, ^You're not walking out
debrief -> ^This is for St, ^The fight goes on
sync ; verify-run.rb 1155
```

Harness recoveries (not product paths): DOM removal of an orphaned `.minigame-container` at game 1155 line 1854 and game 1157 line 466.
