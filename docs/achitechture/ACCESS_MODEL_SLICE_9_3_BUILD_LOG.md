# Access model slice 9.3: build log

Steps 1 to 8 of slice 9.3a were logged in their commits and in
`scenarios/test_access_networks/reports/2026-11-10_step8_runs.md`. This log starts at step 9.

## Step 9: `lab_physical_pentest` adopts networks (2026-11-11)

Worktree `.claude/worktrees/p-lab-networks-habits`, branch `build/lab-networks-habits`, from main
at `3f88e9c97`. Plan: `ACCESS_MODEL_SLICE_9_3_PLAN.md` section 10; content:
`PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md` B1, B2 and the `captureProof` part of B3.

### Preconditions (section 10.4), checked on main

1. Step 8's runs pass: Runs A, B and C of `test_access_networks` and the first slice's suite runs
   (`109c1e6b9`, report above).
2. The content plan's scenario stream is done: part (a), A1 to A18, committed from `018fa08ca` to
   `672cd046b`, reviewed in `PHYSICAL_PENTEST_CONTENT_BUILD_REVIEW_R1.md`, fixes in `fa63f7701`.
3. The engine plan's capture proofs (E4) are built: `8b8fdb48b`, `23c8deb1d`, `130cb9686`, and the
   capture log holder `61339a0c7`. Before this step the validator warned "no captureProof" for the
   three accounts.
4. One editor of the lab file: this worktree. Slice 9.1 step 8 follows here.

### Built

Scenario (`scenarios/lab_physical_pentest/scenario.json.erb`), section 10 in its order:

- Top level: `networks.office_lan` ("Ledgerwell office LAN"); `resources.lw_fs01_records`
  (`file_share`, "Client-Records", host LW-FS01, no `contents`, observations with the top folders
  and the breach line) and `resources.lw_prn02` (printer, LW-PRN02, one line).
- `kit_dropbox`: `rogueDevice: true`.
- `network_port`: the jack (`networkJack`, `network`, `plantedSprite: pi_cluster1`, `linkName`
  "Drop box: comms cupboard", `jackConfirm` = the A13 confirm text it already had). Removed
  `requiresItem`, `triggerOnInteract` and the confirm with its `set_global` and `remove_item`; kept
  `requiresItemHint`; an `observationVariants` entry on `network_port_planted` with the A1 row 14
  "this is the foothold" text. No `linkStoreIn`: the lab has no capture log yet (B3).
- `network_port_planted` (object) removed; `network_port_planted` (global) declared.
- Ruth: the plant mapping is `network_device_planted:network_port`, `onceOnly`, capture kept, no
  `completeTask`. New: `network_viewed:office_lan` sets `kp_dropbox_viewed`; the global completes
  `opt_dropbox_view` with the `dropbox_view` capture; `pc_signed_in:store_controller` logs the
  `door_admin` capture.
- Tasks: `opt_netdrop` is `unlock_object` on `network_port` with `onComplete` setting
  `kp_netdrop_planted`; new `opt_dropbox_view` (manual); new `opt_door_admin`, `unlock_object` on
  `store_controller` with `onComplete` setting `kp_door_admin`. Globals `kp_dropbox_viewed` and
  `kp_door_admin` declared.
- `hot_desk_pc` (`LW-HOT-01`) and `staff_pc_2` (`LW-OPEN-07`) on `office_lan`; access lists
  unchanged.
- `store_controller`: `type: pc`, headless login host LW-DOOR01, `loginPicker: false`, access
  `hampshire` only, the B2 observation, and three pages as `contents` (`door_admin_holders`,
  `door_admin_card_type`, `door_admin_add_badge`). Its readable role moved to
  `store_controller_folder` (`notes1` at 1.06, 1.2, elevation 40) with `onRead` setting
  `kp_controller_found`, so Ruth's capture mapping and `opt_controller` are unchanged.
- `hampshire_door_note` names the page ("the door controller's web page, LW-DOOR01").
- The board's HOW gains the B1 sentence; two credits lines (`kp_dropbox_viewed`, `kp_door_admin`).
- `captureProof`: Chris `planted kit_deviceA on staff_pc`, Sofia `dropped kit_qr`, Melanie
  `session staff_pc_2` (B3's list). The scenario now declares proofs, so the strict rule applies:
  each password is served only once its proof holds.

Ink: `ruth.ink` (kit answer line), `ruth_debrief.ink` (two VARs, the controller lines rewritten
for the service login, the door admin line, the network line and the view line). Compiled.

Engine (`0022cd2ec`): a file share with no contents is listed only. The view offers **Look** on it
and shows its observations (`resourceAction` in `network-view-minigame.js`), and
`mapped_shares` no longer maps it on a desktop. See "Deviations".

Tests: `lab_physical_pentest_secrets_test.rb` gains the 10.3 tests (withholding before the plant,
the records share, the controller's pages only for Chris's session through the box, the folder,
the jack and the unplug count) and a test of the three proofs; the two capture-secrets tests now
record each proof before expecting a password. `network-view.test.mjs` (2 tests) and
`network_shares_test.rb` (1 test) cover the engine change. `PLAYTEST.md`: H2.0 fragment 4 follows
the board, and H5.15 to H5.21 are the chain steps of 10.3.

### Deviations and choices

- **A share with no contents.** 10.2 relies on the records share showing its `observations` (plan
  3.4: "for a resource with no contents: the text shown when the player clicks its row"), but the
  built view gave every `file_share` **Open** or a padlock, so the folder names never showed, and
  every desktop on the network mapped the share as an empty folder. Smallest fix taken: a
  contents-less share is a Look row and maps on no desktop. Nothing else changes for shares with
  contents.
- **Texts the content plan leaves to the builder**, written to its description: the three
  controller pages, the folder text (service-port login on the label, usable only at the box; the
  web page takes staff accounts, front of house among them), the two debrief controller lines, the
  records share and printer observations, the printer's name ("Print room printer"), and the
  `dropbox_view` and `door_admin` capture notes. The folder text does not name LW-DOOR01; only
  Chris's door note (served to her session) does.
- **Capture target ids**: `dropbox_view` and `door_admin` (unique, as the capture-log rule needs).
- **`kp_dropbox_viewed` line** sits inside the `kp_netdrop_planted` block in the debrief, since the
  view needs the plant; `kp_door_admin` is its own block after the controller block, because the
  folder read (`kp_controller_found`) is optional.
- **Not done**: B3 beyond the proofs (the capture log holder, `storeIn`, `linkStoreIn`, renaming
  the Harvested Credentials tablet), and moving Melanie's capture to `pc_signed_in` (B3 "may").
- **Leak scanner and LW-FS01.** The BadUSB session's timer grant (`records_share.txt`, A1 row 4)
  names the host LW-FS01 in its contents. GET /scenario strips those contents (the controller's
  `filter_requires_recursive`), and the server serves them only while the grant is held, through
  `/unlock` or `/container`. A resource host is withheld like the rest of `resources` (only a
  sign-in object's host is public); the note is authored container content. See review round 1,
  M4 and N1.

### Lines to voice

All Ruth Adeyemi (voice Sulafat). Old clips are in `tts_cache/lab_physical_pentest/`.

| # | File:line | Old | New | Marker |
|---|---|---|---|---|
| 1 | `ruth.ink:46` | (none) | "The drop box goes on a spare port. Once it's in, its view shows what answers." | VOICE (new) |
| 2 | `ruth_debrief.ink:168` | "And what was behind it [dash] the door-entry controller. The box that runs the records-door reader, admin login on a label, sat in a cupboard anyone can pick." (`d08648a6`) | "And what was behind it, the door-entry controller. The box that runs the records-door reader, its service login on a label inside the lid, in a cupboard anyone can pick." | RE-VOICE |
| 3 | `ruth_debrief.ink:169` | "That's the records door undone from the inside. Lock the controller in a comms room, change that password, log every badge it programs." (`74b84b29`) | "That's the records door undone from the inside. Lock the controller in a comms room, change that login, log every badge it programs." | RE-VOICE |
| 4 | `ruth_debrief.ink:172` | (none) | "And the drop box plus Chris's password got you the door system's own admin page. Two small gaps, one large one." | VOICE (new) |
| 5 | `ruth_debrief.ink:186` | "And a drop box on a live port in an unlocked comms cupboard [dash] straight onto the LAN. Disable the unused ports and lock the cabinet." (`81e079ff`) | "And a drop box on a live port in an unlocked comms cupboard, straight onto the office network. Disable the unused ports and lock the cabinet." | RE-VOICE |
| 6 | `ruth_debrief.ink:188` | (none) | "Its view listed the machines in the building, and the records share by name. Nobody had to sign in to see that." | VOICE (new) |

Three re-voiced (orphaning `d08648a6`, `74b84b29`, `81e079ff`) and three new, as the content plan
counts. No audio generated. No line removed; no cue or variable in any of them. Barks: none.

### Static checks

| Check | Result |
|---|---|
| `scripts/compile-ink.sh lab_physical_pentest` | 10 compiled, 0 failed |
| Validator `--no-graph`, then with the graph | Exit 0. Against the baseline: the three "no captureProof" warnings gone, one suggestion gone; new info lines: network reach (3 hosts, 2 resources), `hot_desk_pc` and `staff_pc_2` reachable without a foothold (open room, expected), `c.hampshire` signs in at `hot_desk_pc` and `store_controller`. No "Doors skipped". Dungeon graph regenerated (device, jack, network node, exposed hosts and resources) |
| `dialoguelint` | Clean (one 31-word line found and cut to 30) |
| `tagdiff` | `ruth.ink`: structure unchanged. `ruth_debrief.ink`: two new VARs and two new conditions (`kp_door_admin`, `kp_dropbox_viewed`), as above |
| Door alignment | Not run: no room moved |
| Reopen check | Not run: the lab is not in `scripts/ink_runtime_check/missions.json` |
| Lab Rails tests | 38 runs, 0 failures; `lab-physical-pentest-debrief.test.mjs` 9 of 9 |

### Browser run

Scripted regression run, game 1190, keyless server on :3014, headless, responses captured. One
game, in order: briefing and kit; plant (H5.15); the view (H5.16); before the capture, the
controller's Sign in with an empty Captured sign-ins list and one guessed password refused
(H5.18); store pick, the controller click shows only its observation, the folder read completes
`opt_controller` (H5.17); keylogger capture (H1.2 to H1.4); the chain (H5.19): Captured sign-ins
offered `c.hampshire`, the remote sign-in to LW-DOOR01 succeeded, the desktop showed the three
pages and Chris's profile and no Client-Records folder; a reload with the box planted; the unplug
(H5.20). All PASS. Chris's password came only from the tablet after her capture, through the
Captured sign-ins picker.

- View rows, in order: LW-HOT-01, LW-OPEN-07, LW-DOOR01 (Sign in each), Client-Records (Look, the
  folder names and the breach line), Print room printer (Look). Header "Drop box: comms cupboard,
  on Ledgerwell office LAN". Screenshot checked by eye.
- Final server record (`verify-run.rb --access`): `gainedFootholds network_port`, `signedInPcs
  store_controller`, no footholds or sessions after the unplug; `opt_netdrop`, `opt_dropbox_view`,
  `opt_controller` and `opt_door_admin` completed.
- Leak check: `VERDICT: no leaks found` after every beat and over all 84 responses. The BadUSB
  beat was not run, so the LW-FS01 question above is still open for a run that includes it.
- Harness notes: the store lock needed `window.__test.minigame.completeLockpick()`; clicking a
  Captured sign-ins row fills the fields and a second click on Sign in submits; the "link dropped"
  toast was not in the toast buffer when checked after the unplug, though the session had ended.
  Not checked further.

### Suites

Under the shared lock: Rails 1414 runs, 14657 assertions, 0 failures, 0 errors, 1 skip; node
`bin/test-js -j 3` 483 files passed, 0 failed.

### Not run

The persona run of 10.3 (a student who does not know the answers) and a run that includes the
BadUSB beat (for the LW-FS01 leak question). The audio step (six lines above) waits for the user.

### Handover

Step complete; nothing in progress. Commits: `0022cd2ec` (engine), `800ec20b3` (lab), the build
log commits. Files: the lab scenario, `ruth.ink`, `ruth_debrief.ink` and their JSON, the dungeon
graph, `PLAYTEST.md`, `lab_physical_pentest_secrets_test.rb`, `network-view-minigame.js`,
`network_access.rb`, `network-view.test.mjs`, `network_shares_test.rb`.

## Review round 1 fixes (2026-11-11)

Reviews: `LAB_NETWORKS_HABITS_CODE_REVIEW_R1_ENGINE.md` (0 blockers, 0 majors, 5 minors, 4 nits) and
`LAB_NETWORKS_HABITS_CODE_REVIEW_R1_SCENARIO.md` (0 blockers, 1 major, 7 minors, 4 nits). Commits
`4ba0bb5ed` (engine), `8c698b10d` (lab), `14200f06a` (unplug toast) and this log commit.

### Orchestrator decisions

- **Scenario M1 (Chris's password guessable from Melanie's pattern).** Chris gets a new
  passphrase of three words and a number. It shares no word or number with Sofia's or Melanie's
  password or with any text in the lab (a new test checks every part against the other passwords,
  the rendered scenario and all the lab's ink), so the keylogger capture is its only source. The
  password lives only in `creds`; no voiced line names any password. The engine takes
  `maxAttempts` from a PC's policy for remote sign-in too, so the lab gains a `door_controller`
  policy with `maxAttempts: 5` on `store_controller`. `test/js/add-capture-action.test.mjs` is a
  standalone fixture (other names and passwords), so it is unchanged; old review, plan and
  persona-run docs are unchanged too.
- **A message on unplug with no remote desktop open.** `PcSessions.linkDropped` now shows one
  toast (5 s, on-screen text, not voiced) naming the hosts of the sessions the unplug ended whose
  desktop was not open: "Unplugged. Your session on LW-DOOR01 ended." An open desktop still closes
  with "The link dropped"; nothing ended, no toast. Tests in `pc-sessions.test.mjs`; README
  networks section updated.

### Review round 1 outcomes

Engine review:

| Finding | Outcome |
|---|---|
| M1 two tests for "no contents" | Fixed. `NetworkModel.resource_contents?` and `listed_only_share?` (a `file_share` whose `contents` is not a non-empty list). `resource_row` sends `listed: true` and observations by that rule; `mapped_shares` uses it; the client's `resourceAction` keys on `listed`, never on observations. Rails test covers missing, `[]` and no observations; JS tests cover `listed` with no observations and observations without `listed` |
| M2 access list on a listed-only share | Fixed. The validator warns ("has an access list and no contents: no desktop maps it ...") and skips such shares in "Shares nobody can map" and "Reachable without a foothold". Test for missing and `[]` contents |
| M3 `/unlock` exemption breadth | Fixed by the second option: kept the breadth (it matches `/container`), stated it in the scanner's header and method comments, and added a test that a network name in `/unlock` contents is not reported (and is in a room answer) |
| M4 resource hosts and the lab test | Fixed. `hidden` now includes every resource host, with LW-FS01 and LW-PRN02 asserted present. The reviewer expected it to pass on `filtered_scenario_for_bootstrap`; it did not: that model method keeps a timer grant's contents (`$.timers[8].actions[0].item.contents`). The real GET /scenario strips them in the controller (`filter_requires_recursive`), so the model test now mirrors that strip and says so, and a new HTTP test (`lab_physical_pentest_network_test.rb`) checks the real GET /scenario and every room answer for the network name and every resource name, host and observation. No server leak. Comment and both log entries reworded |
| M5 README | Fixed: the `resources` row and a paragraph in "Shares" on listed-only versus openable shares and the validator warning |
| N1 9.3 log "in the bootstrap" | Fixed: reworded (see M4; strictly, the model's bootstrap does hold them, the served answer does not) |
| N2 `prove!` | Comment names `test/controllers/break_escape/capture_proofs_test.rb`, where the endpoints' recording is tested |
| N3 lab names in engine comments | Fixed in `network-view-minigame.js` and the scanner |
| N4 `resource_admits_player?` | Fixed: a listed-only share admits nobody, so GET /container answers "not found" (tested) |

Scenario review:

| Finding | Outcome |
|---|---|
| M1 guessable controller password | Fixed as decided above |
| m1 debrief order | Fixed: the door admin line is inside the drop box block, after the view line. Same words |
| m2 no pointer from plant to controller | Fixed: Ruth's phone offers "The drop box is in. What now?" in stages 1 to 3 while the box is in, Chris's password is captured and `kp_door_admin` is false; one shared reply (one clip) |
| m3 "service port" | Fixed: the folder says the login needs a service cable at the box, and using it would change the client's door system, which the rules forbid |
| m4 `opt_controller` capture note | Fixed: service login on a label, usable with a cable at the box, "change the default service login". Not voiced |
| m5 H5.20 message | Fixed with the toast; H5.20 now expects it and checks `verify-run.rb --access` |
| m6 stale PLAYTEST output | Fixed: the story note names where captured passwords are used; the expected validator paragraph lists today's warnings and the identity and network lines; H5.18 expects "4 attempts left"; H5.19 covers the phone option; the earned-secrets row adds H5.19 |
| m7 missing tests | Fixed: `lab_physical_pentest_network_test.rb` over HTTP: `opt_netdrop` refused before the plant and completed after (writes `kp_netdrop_planted`); `opt_door_admin` refused before and after a wrong password, completed after Chris's remote sign-in (writes `kp_door_admin`); the controller's pages fetched by GET /container with the foothold, refused without it and after the unplug; the records share 404 |
| n1 "its view" | Fixed: "Once it's in, it shows you what answers on their network." (no clip existed) |
| n2 "joins the LAN" | Fixed: "office network". Not voiced |
| n3 share observations describe rather than name folders | Kept as a choice: naming clients would be client information |
| n4 door admin line has no control | Not done: optional, would add a voiced line, and the `door_admin` capture note carries the control |

### Lines to voice (this round)

All Ruth Adeyemi (voice Sulafat). No audio generated.

| # | File:line | Old | New | Marker |
|---|---|---|---|---|
| 1 | `ruth.ink:46` | (none; row 1 above, never voiced) | "The drop box goes on a spare port. Once it's in, it shows you what answers on their network." | VOICE (new, replaces row 1's text) |
| 2 | `ruth_phone.ink:148` | (none) | "Open it from your bag. The door controller's on its list, and it takes a front of house account." | VOICE (new, phone) |
| 3 | `ruth_debrief.ink:188` | row 4 above at line 172 | same words, moved | VOICE (new, as row 4; line moved only) |

Rows 2, 3, 5 and 6 above keep their text; row 5 is now `ruth_debrief.ink:183`, row 6 `:185`.

### Checks

| Check | Result |
|---|---|
| `scripts/compile-ink.sh lab_physical_pentest` | 10 compiled, 0 failed (the END-tag warning predates this round) |
| Validator | Exit 0, no errors. New against the round's base: two warnings for the controller's `maxAttempts` policy (access model and network model: a lockout lasts the mission). Accepted: the task is optional, the picker fills the right password, and only a guesser meets it. Habits report unchanged. Dungeon graph regenerated, no change |
| `dialoguelint` | Totals by rule: none |
| `tagdiff --ref HEAD` | `ruth.ink`, `ruth_debrief.ink`: structure unchanged. `ruth_phone.ink`: one VAR (`kp_door_admin`), one knot (`door_admin_tip`), three guarded choices diverting to it |
| Browser (game 1202, :3014, headless) | All PASS: plant and view (Client-Records offers Look); before the capture, one wrong password at the controller refused with "4 attempts left"; keylogger capture; the phone option and reply; remote sign-in to LW-DOOR01 with Chris picked from Captured sign-ins (password never typed), the three pages, no Client-Records folder, `kp_door_admin` true; unplug toast exactly "Unplugged. Your session on LW-DOOR01 ended." with no session or foothold left on the server; plant again and reload, link item kept and the tasks stay complete. Leak check over 98 responses: `VERDICT: no leaks found`. After the reload the player resumed in `briefing_room`, as in the 9.1 run |
| Suites (shared lock) | Rails 1421 runs, 14990 assertions, 0 failures, 0 errors, 1 skip; JS `bin/test-js -j 3` 483 files passed, 0 failed |

### Handover

Round complete; nothing in progress. Next: review round 2. Open for the user: the six lines of
step 9 plus the phone line await voicing; the `maxAttempts: 5` lockout (accepted warning) is a
call the user may want to revisit.
