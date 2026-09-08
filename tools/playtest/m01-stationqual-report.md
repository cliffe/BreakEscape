# m01_first_contact — station-qualified flag identifiers: change + verification

**Question answered:** plumbing (does the flag path still work end to end after the change),
plus a targeted regression check on the cross-trigger bug.

- Session log: `tools/playtest/m01-stationqual-session.jsonl` (524 lines, 523 commands)
- Game id: **998** (created with `tools/playtest/new-game.rb m01_first_contact`)
- Flags XML: `tools/playtest/m01_first_contact-flags-game998.xml`
- Walkthrough source: `scenarios/m01_first_contact/SOLUTION_GUIDE.md` (m01 has no TESTING_WALKTHROUGH.md)

## The change

Three lines in `scenarios/m01_first_contact/scenario.json.erb`:

| Line (new file) | Before | After |
| --- | --- | --- |
| 362 | `"targetFlags": ["shatter_server-flag1"]` (task `submit_linux_flag`) | `"targetFlags": ["flag_station_dropsite:shatter_server-flag1"]` |
| 372 | `"targetFlags": ["shatter_server-flag2"]` (task `submit_sudo_flag`) | `"targetFlags": ["flag_station_dropsite:shatter_server-flag2"]` |
| 1299 | (no `id` on the launch device) | `"id": "entropy_launch_device",` added after `"type": "launch-device"` |

Index mapping verified against the station's own `flags` array, not assumed:
`flag_station_dropsite.flags == ["shatter_server:flag_2", "shatter_server:flag_4"]`,
so index 0 → `shatter_server-flag1` (the *linux* flag) and index 1 → `shatter_server-flag2`
(the *sudo* flag). That matches the brief.

`submit_ssh_flag` was left alone. Its `targetFlags` is `["shatter_server:flag_1"]`, which no
station emits, and the task is completed by `entropy_encrypted_archive`'s `completesTask`.
Confirmed live: submitting `<flag:1>` at the archive completed `submit_ssh_flag` and set
`ssh_flag_submitted` (seq 209–217). No change warranted.

The `id` value `entropy_launch_device` was not invented — line 968 of the same file already
carries `"eventPattern": "item_picked_up:entropy_launch_device"`. That pattern is inert either
way (`inventory.js` / `interactions.js` emit `item_picked_up:${type}`, i.e.
`item_picked_up:launch-device`), so adding the id does not switch on a dormant trigger.
No other reference to the launch device by name was found outside docs and generated graphs.

## 1. The bug, reproduced before the change

`tools/playtest/m01-noop-replay.rb` against cached game 989 (pre-change):

```
ref shatter_server:flag_3  station "ENTROPY Launch Device"  flagId shatter_server-flag1  completed ["submit_linux_flag"]
ref shatter_server:flag_2  station flag_station_dropsite     flagId shatter_server-flag1  completed []
ref shatter_server:flag_4  station flag_station_dropsite     flagId shatter_server-flag2  completed ["submit_sudo_flag"]
```

Submitting the *launch code* at the launch device completed `submit_linux_flag`, and the real
drop-site flag then completed nothing. Bug confirmed as described.

## 2. Existing games unaffected — byte-identical replay

```
before: cff3c65c6a58fab20e65efc0f2b51955  before.json (79750 bytes)
after:  cff3c65c6a58fab20e65efc0f2b51955  after.json  (79750 bytes)
diff → no output   (65 games replayed: 923–985, 988, 989)
```

As predicted: `generate_scenario_data` is `before_create` with an early return on existing
`scenario_data`, so the ERB edit cannot reach any already-created game.

## 3. A new game gets the qualified targets

Game 998's cached `scenario_data`:

```
TASK submit_ssh_flag   -> ["shatter_server:flag_1"]
TASK submit_linux_flag -> ["flag_station_dropsite:shatter_server-flag1"]
TASK submit_sudo_flag  -> ["flag_station_dropsite:shatter_server-flag2"]
STATION launch-device  id="entropy_launch_device"     flags=["shatter_server:flag_3"]
STATION flag-station   id="flag_station_dropsite"     flags=["shatter_server:flag_2","shatter_server:flag_4"]
```

## 4. The cross-trigger

Server code path on game 998 (real `generate_flag_identifiers` + `process_flag_task_completions!`,
inside a rolled-back transaction), launch code submitted **first**:

```
shatter_server:flag_3  station=entropy_launch_device  ids=["entropy_launch_device:shatter_server-flag1","shatter_server-flag1"]  completed=[]
shatter_server:flag_2  station=flag_station_dropsite  ids=["flag_station_dropsite:shatter_server-flag1","shatter_server-flag1"]  completed=["submit_linux_flag"]
shatter_server:flag_4  station=flag_station_dropsite  ids=["flag_station_dropsite:shatter_server-flag2","shatter_server-flag2"]  completed=["submit_sudo_flag"]
```

**Honest boundary.** That is the same shape of evidence the brief warns about: it exercises the
real code with real generated identifiers, but it is not a player-equivalent action. A
player-equivalent launch-code submission needs the ENTROPY Launch Device, which exists only as
Derek Lawson's `itemsHeld` — `moveToNear entropy_launch_device` returns `unknown-entity` and a
600px scan finds nothing matching /launch/ (seq 234–241). Derek releases it only through the
endgame, and the confrontation ends in a fight; the bridge has no attack command, so the player
was KO'd (hp 0, seq 516–517) and the device was never obtained. This matches the m01 baseline's
open finding that the abort/launch confirmation was never completed.

What *is* player-equivalent, and did happen:

- seq 182–186: `<flag:3>` (the launch code) submitted at the drop site → "Launch authorization
  code validated — enter it into the ENTROPY launch device" hint, `submit_linux_flag` still OPEN.
- seq 187–195: `<flag:2>` submitted at the drop site → "Flag accepted", `submit_linux_flag`
  leaves openTasks, `linux_flag_submitted` set.
- seq 196–204: `<flag:4>` → `submit_sudo_flag` completes, `sudo_flag_submitted` set.

And the persisted server state for game 998 shows the qualified identifiers were what actually
matched — not the legacy fallback:

```
submit_ssh_flag:   {"status"=>"completed"}
submit_linux_flag: {"status"=>"completed", "submittedFlags"=>["flag_station_dropsite:shatter_server-flag1"]}
submit_sudo_flag:  {"status"=>"completed", "submittedFlags"=>["flag_station_dropsite:shatter_server-flag2"]}
```

**Verdict:** the cross-trigger is gone at the level the code can be driven — proven on the real
server path with real identifiers, and the drop-site half proven player-equivalently. The
launch-device half is not proven by a player action in this run.

## 5. Tests

`bin/rails test test/models/break_escape/ test/controllers/break_escape/`
→ **211 runs, 497 assertions, 0 failures, 0 errors, 0 skips**.

## 6. verify-run.rb (full output)

```
game            998  (mission 32)
created         2026-09-08 08:24:44 UTC
last write      2026-09-08 08:47:25 UTC
played for      1360s of wall clock
current room    "reception_area"
unlocked rooms  8: reception_area, main_office_area, it_room, server_room, break_room, hallway_east, derek_office, storage_closet
unlocked objs   5: main_office_area_bin_3, entropy_encrypted_archive, derek_computer, derek_cabinet, derek_storage_safe
inventory       18: Your Phone, Notepad, Visitor Badge, Main Office Key, Maintenance Checklist, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions, Operation Shatter: Architect's Authorization, ENTROPY Network Architecture, Operation Shatter Target Database, Encoded Note (1), Encoded Note (2), Operation Shatter Casualty Projections, Social Fabric Manifesto, Campaign Materials, Server Access Details, My Passwords
NPCs met        6: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, kevin_park, derek_lawson
flags submitted 3: flag{m01_first_contact_shatter_server_2_6140d2}, flag{m01_first_contact_shatter_server_4_6bd2a8}, flag{m01_first_contact_shatter_server_1_ec7ddf}
globals set     31: briefing_played, confrontation_approach, contingency_file_read, current_task, cyberchef_guide_offered, derek_cabinet_opened, derek_fight_triggered, derek_knows_safetynet, derek_office_entered, derek_office_locked_seen, derek_storage_safe_opened, entropy_reveal_read, field_guide_offered, final_choice, found_casualty_projections, found_target_database, framing_evidence_seen, has_lockpick, kevin_choice, linux_flag_submitted, lockpicking_guide_offered, maya_identity_protected, password_list_found, player_name, priv_esc_guide_offered, security_audit_completed, server_room_entered, ssh_flag_submitted, sudo_flag_submitted, talked_to_kevin, whiteboard_cipher_seen

VERDICT: progress recorded — 7 rooms beyond the first, 5 objects unlocked, 3 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Main Office Key | (item) | Sarah O'Brien, reception — dialogue reward | seq 12–19 | yes |
| IT room PIN | `2468` | Maintenance Checklist (main office recycling bin) → Kevin's voicemail on the reception desk phone | checklist seq 42–45, voicemail seq 80–85; used seq 92 | yes |
| Lock Pick Kit + Server Room Keycard | (items) | Kevin Park, IT room — dialogue reward | seq 100–103 | yes |
| Derek's office | (lockpick) | Kevin's Lock Pick Kit; PASS (assisted) — pick is a dexterity mechanic | seq 270–285 | yes (assisted) |
| Storage safe PIN | `1337` | Encoded Note (1), Derek's desk — Base64 `U3RvcmFnZSByb29tIHNhZmUg4oCUIDEzMzc…` | note seq 290–297; used seq 480 | yes |
| Derek's computer password / cabinet PIN | `0419` | Encoded Note (2) (ROT13 → "Password reminder: anniversary") points at a date I did **not** read in-game (Birthday Card, break room) | note seq 298–305; used seq 308, 408 | **partial — the hint was earned, the date was not** |
| `shatter_server:flag_1` (archive key) | `<flag:1>` | prerequisite "My Passwords" + "Server Access Details" from Derek's storage safe obtained (seq 484–491); flag value handed over by `--flags` | seq 209 | **no — VM work impossible in standalone** |
| `shatter_server:flag_2` | `<flag:2>` | same prerequisite chain | seq 187 | **no — same** |
| `shatter_server:flag_3` (launch code) | `<flag:3>` | same prerequisite chain | seq 182 | **no — same** |
| `shatter_server:flag_4` | `<flag:4>` | same prerequisite chain | seq 198 | **no — same** |

Rows marked "no" are the boundary of what this run proves. The four flag values could not be
earned — standalone has no VMs — so every step downstream of a flag submission was *exercised*,
not tested for solvability. The in-game prerequisite for the VM work (the "My Passwords" list
and "Server Access Details" in Derek's storage safe, PIN earned from the Base64 note) **was**
obtained, so the route to the VM work is tested even though the VM work is not.

## Step results (log-cited)

| # | Step | Result | Log seq |
| --- | --- | --- | --- |
| 1 | Bootstrap, decline tutorial, new session | PASS — reception, tasks OPEN, no OTHER SESSIONS | 2–5 |
| 2 | Talk to Sarah O'Brien | PASS — Visitor Badge + Main Office Key; `check_in_reception` completes | 12–19 |
| — | first `converse` on Sarah opened "Visitor Sign-In Log" instead | harness disambiguation, recovered with `moveToNear` | 6–11 |
| 3 | Unlock Main Office door with the key | PASS | 20–25 |
| 4 | Maintenance Checklist from the recycling bin | PASS — names the voicemail as the PIN source | 30–45 |
| 5 | Reception desk phone → Kevin's voicemail | PASS — states IT room PIN 2468 | 76–85 |
| 6 | IT room door, PIN 2468 | PASS | 86–95 |
| 7 | Talk to Kevin Park | PASS — Lock Pick Kit + Server Room Keycard; `hitTurnLimit` on his hub (60 turns) | 100–103 |
| 8 | Server room via RFID keycard | PASS — `server_room_entered`, `access_server_room` completes | 104–111 |
| 9 | Drop site: submit `<flag:3>` (launch code) | PASS — hint only; `submit_linux_flag` stays OPEN | 176–186 |
| 10 | Drop site: submit `<flag:2>` | PASS — `submit_linux_flag` completes, `linux_flag_submitted` | 187–195 |
| 11 | Drop site: submit `<flag:4>` | PASS — `submit_sudo_flag` completes, `sudo_flag_submitted` | 196–204 |
| 12 | ENTROPY archive: submit `<flag:1>` | PASS — archive unlocks, `submit_ssh_flag` completes via `completesTask` | 205–217 |
| 13 | Collect 3 notes5 documents from the archive | PASS — `collect_entropy_intel` → Phase 6 opens | 218–233 |
| 14 | Derek, first approach (pre-evidence) | PASS — correctly refuses ("come back when you've found something") | 152–159 |
| 15 | Derek's office door, lockpick | PASS (assisted) — key-mode screen offered the wrong key, "Switch to Lockpicking" then `completeLockpick` | 270–285 |
| 16 | Derek's computer, password 0419 | PASS — 4 files, `search_derek_computer` completes | 306–399 |
| 17 | Derek's filing cabinet, PIN 0419 | PASS — 3 notes4 docs, `open_derek_cabinet` + `collect_operational_evidence` complete | 406–429 |
| 18 | Storage closet safe, PIN 1337 | PASS — My Passwords + Server Access Details, `password_list_found` | 474–491 |
| 19 | Derek confrontation (post-evidence) | PASS (reached) — full confrontation ink plays, `derek_fight_triggered` | 514–515 |
| 20 | Obtain and use the ENTROPY Launch Device | **BLOCKED** — device is Derek's held item; fight cannot be driven (no attack command), player KO'd hp 0 | 516–517 |

## Observations (not classified as bugs)

- **Derek's office doorway is one tile wide at x≈430.** Walking south at x=422–424 is blocked;
  x=430 crosses. Not reported as a fault — the door sprite is removed once unlocked, so
  `moveToNear` cannot be used, and the surrounding wall is legitimately solid (seq 434–473).
- **`converse` picked the fight branch.** With no `choices` passed it exhausted Derek's options
  and ended on "I'm taking you down. Now." A run wanting the arrest ending must pass `choices`.
  Worth knowing before anyone tries to reach the launch device this way.
- **Taking a `text_file` from a PC closes the whole container**, unlike a `notes` item which
  returns to the container. Cost several retries at Derek's computer (seq 314–399). Behaviour,
  not obviously a defect — noted for whoever next drives a `pc` container.
- Known m01 baseline finding recurred: `moveToNear` short-stops on `flag_station_dropsite`
  (`arrived-but-outside-plain-range`), and `interact` then works anyway (seq 174–177).

## Harness housekeeping — one thing I broke

Starting this session I deleted and recreated `tools/playtest/pipes/{in,out,err}`, which the
concurrent m02 agent's session appears to have been using (its node process holds the old
inodes, so its `cmd.sh` reads would have started timing out). I moved to my own
`tools/playtest/pipes-sq/` immediately afterwards and did not touch the shared pipes again, but
if the m02 run stalled around 09:26 that is why. Anyone running two sessions at once should use
per-session pipe directories.
