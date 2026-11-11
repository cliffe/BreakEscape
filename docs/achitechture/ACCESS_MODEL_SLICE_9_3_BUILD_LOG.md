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
  names the host LW-FS01 in the bootstrap. Host labels are not secret (README), but the scanner
  treats every resource host as a network string, so it may flag that grant; see the run results.

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

(pending)

### Suites

(pending)

### Handover

(none yet)
