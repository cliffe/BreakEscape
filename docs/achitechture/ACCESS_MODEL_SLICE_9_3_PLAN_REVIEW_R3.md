# Access model slice 9.3 (networks): confirming review, round 3

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md` as revised after round 2 and
re-grounded on the merge of `main`, against the working tree of branch
`claude/break-escape-access-design-090sjx` at `72209f7f9` (steps 1 to 7 committed) on 2026-11-10.
Read-only: no plan or code was edited, nothing was committed, nothing ran against a server. The one
command run was the validator on `test_access_networks` (it regenerated that scenario's dungeon
graph with no diff).

`P:n` is a line of the plan under review. Code lines are from the working tree and will move.

## Counts

- Round 2: **N1 resolved, N2 resolved.** Of round 2's 22 minors, all are taken in the plan or the
  code; none is reopened.
- New findings: **0 blockers, 2 majors, 10 minors.** Section 5 has three ungraded notes on 9.3b.

## Verdicts

- **Step 8: build, yes.** Fold in R3-M1 and R3-M2 as the builder goes; both are gaps in the
  landing contract, not in the design, and the code for step 7 already does most of R3-M2.
- **Step 9: no, not yet.** Section 10 is sound against the lab and against the content plan's B1
  and B2, but its own preconditions (10.4) do not hold: the content plan's scenario stream has not
  run (`hot_desk_pc`, `kp_door_admin`, `opt_door_admin`, `opt_dropbox_view` and
  `store_controller_folder` are not in the lab file) and the engine plan's E4 is not built. Build
  it when 10.4 holds, after minors 5 to 8, which are small text changes to section 10.
- **9.3b (section 12): nothing in it blocks 9.3a.**

---

## 1. Round 2 majors

### N1 (getting back to the network view): resolved

4.3 "Getting back" (P:377-431) gives `network-links.js` the way back through one trip record,
`resume` and `leave`, an exit reason per screen and a landing table; the framework's `returnTo` and
`suspended` are not used (P:380-383); `network_view_closed` fires once per trip and never on a
handover (P:429-431); the engine plan is told to rely on the `returnTo` function, not a close
listener (13.4 item 4). Checked against the code:

- `network-links.js` implements the trip, the table (`LANDINGS`), `resume`, `leave` and `landed`
  as 4.3 describes, with the one tick wait and the "a minigame has opened" guard.
- Starting a minigame ends the open one through `endMinigame` (`minigame-manager.js:57-70`), so a
  displaced desktop's cleanup does run and can report its reason: the reason-based design works
  where R2's timing-based suggestion would have been fragile.
- Every `pendingContainerReturn` path the plan names is where it says (`container-minigame.js:637`,
  `:741`, `:786`, `:859`), and the text-file reader still clears the record at
  `text-file-minigame.js:374`, which is the line step 8 changes.
- The engine plan's capture log now passes a `returnTo` function (its lines 818-828) and no longer
  listens for the view's close.

Two residues are new findings: files and folders opened below a mapped share or a nested folder
have no landing (R3-M1), and the hand-off between `network-links.js` and step 8's screens is in the
code but not in the plan (R3-M2).

### N2 (the contract with the engine feedback plan): resolved

Checked against `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` as it stands (107 KB, 14:27):

| Round 2 row | Now |
|---|---|
| `access_leak_scanner.rb` | Both plans: T owns the library and `verify-run.rb`; E4 edits `access-leak-check.rb` only, after T (P:1678-1679; engine 1339-1340) |
| `attempt_login!` | Both plans: no engine stream edits it (P:1673; engine 742 now reads `signedInPcs`) |
| `games_controller.rb` | Rows agree: S the `add` branch, `login`, the network actions; E4 the `remove` branch (P:1674; engine 1335) |
| `minigames/index.js`, `core/game.js` | Rows agree (P:1667-1668; engine 1331-1332) |
| `inventory.js`, `interactions.js` | Same order in both: E3 first (its 5c is committed, `5eb1cade5`), then C1; C1 and E4 either order on `interactions.js` (P:1661-1662; engine 1324-1325) |
| How a link item is filed | One rule in both: by `storeIn`, which the server copies from the jack's `linkStoreIn`; nothing filed by type (P:1598-1603, decision 16; engine 766-795, D4). Built: `link_item_for`, `network_access.rb:266` |
| The menu | Both: no menu, one click opens the view (P:1616-1617) |
| Opening and coming back | Both: `open(footholdId, { returnTo })`, `openSession(pcId, { returnTo })`, and the log lists remote sessions from `pcSessions.list()` |
| The lab's Remote Session item | Both: it stays (P:1299-1302; engine 902) |

Two small leftovers are minor 9.

---

## 2. Majors

### R3-M1. Files and folders opened below a mapped share, or inside a nested folder, have no landing; P5 expects one the rules do not give

- **Location.** 4.3, the landing table (P:418-426); step 8's text-file change (P:1200-1202);
  `scenarios/test_access_networks/PLAYTEST.md` P5 (lines 143-150) and plan beat P5 (P:1136).
- **Evidence.** The text-file reader reopens its container only when `pendingContainerReturn` holds
  "a network screen (its lockable has `remote`, or it is a share opened from the view)"
  (P:418, P:1200-1201). In P5 the handover note is in "Ledger-Archive", a share **mapped on Lena's
  desktop**, not opened from the view. When the note is opened, the stored container is the share's
  folder (its `containerItem` is the `network_share` stub, `container-minigame.js:772-786`), which
  has no `remote` and was not opened from the view. So the rule clears the record and the reader
  closes to the world, while `PLAYTEST.md` says "Read the handover note (back on Lena's desktop
  when the reader closes)". The same holds for "Year-end", the PIN-locked folder in that share:
  its click goes to `handleObjectInteraction` with a stand-in sprite (`:791-802`), the PIN screen,
  then a new container minigame, whose close consults no return record at all (only the notes reader
  and NPC mode read `pendingContainerReturn`, `:1001-1003`, `:1087-1095`). The table's row "A file
  or folder opened from a remote desktop: the reader ... the desktop reopens" names only the notes
  and text-file readers, so a folder has no rule. In both cases the desktop has already reported
  `item` or `share` (no landing), so the trip stays open with nothing on screen: no
  `network_view_closed`, and a capture log `returnTo` never runs. P6 then starts "on Lena's remote
  desktop", which the run can only reach again through the tray.
- **Fix.** One rule instead of the two special cases:
  1. A container opened **from** a network screen is itself a network screen. Carry a marker
     (for example `networkReturn: true`, or the parent's lockable) on the stand-in sprites at
     `:751` and `:796` and in the stored `containerState`, as `sourcePcId` is carried today, and on a
     mapped share's folder.
  2. The text-file rule reads that marker, so a file read from a mapped share reopens the share,
     and a file read from a folder reopens the folder.
  3. A folder or share opened from a network screen reopens its parent when it closes, as 4.3
     already says for a mapped share (P:419); add a row "A folder opened from a network screen, by
     its Close: the screen it was opened from". The PIN screen in between is a handover.
  4. Correct P5 in the plan and in `PLAYTEST.md`: the reader closes to the share; the share closes
     to Lena's desktop. Add the two cases to `container-shares.test.mjs`: a file read from a mapped
     share on a remote desktop, and a locked folder opened and closed there.

### R3-M2. The step 7 to step 8 hand-off is in `network-links.js` but not in the plan, and a builder who follows the plan breaks P6

- **Location.** 4.3 (P:399-408), step 7 (P:1050-1071), step 8 (P:1168-1199).
- **Evidence.** The plan says `network-links.js` "looks the two starters up on `window`"
  (P:1069-1071) without naming them, and gives `landed(screen, reason)` (P:401, P:1055) without the
  screen names. The built module (`network-links.js`, header and `LANDINGS`) needs:
  - `window.startNetworkViewMinigame(footholdId, { message })` and
    `window.openRemoteDesktop(pcId, footholdId)`; without them `open` and `openSession` toast and
    `leave("closed")` (the step 7 stand-in), silently;
  - `landed(screen, reason, detail)` with `screen` one of `view`, `signin`, `desktop`, `share`,
    and `detail` `{ pcId, host }`. The sign-in row decides between "back to the desktop" and "back
    to the view" with `self._sessionAt(d.pcId)`: a remote sign-in screen that reports
    `landed('signin', 'close')` with no `pcId`, which is what the plan's two-argument form says,
    always resumes the view, so P6 ("leaving the screen shows Lena's desktop again") fails. The
    `no_session` and `unreachable` messages also take the host from `detail`.
  - The view must report `foothold_gone` when its own refetch answers `{ ok: false, reason: 'gone' }`
    (`view()`), not only `handover` and `close`; step 8 names only `handover` (P:1175).
- **Fix.** Add a short "Hand-off to step 8" paragraph to step 7 or 4.3: the two `window` starters
  and their arguments; the four screen names; `detail` with `pcId` (required for `signin` and
  `desktop`) and `host`; the view's three reasons (`close`, `handover`, `foothold_gone`). Change
  `landed(screen, reason)` to `landed(screen, reason, detail)` at P:401 and P:1055, and add to
  `access-remote-signin.test.mjs` "Switch user left with no new sign-in reopens the desktop, through
  `landed` with `pcId`".

---

## 3. Minors

### Drift a builder would notice

1. **Build status is out of date.** The header says steps 5 to 9 are not built (P:3-4); steps 5, 6
   and 7 are committed (`443b327a7`, `f58b6a25c`, `140eccd4f` to `72209f7f9`) but their headings
   lack "(built)"; section 14 says only stream S is built (P:1656) and still gives C1's start on
   `inventory.js` as waiting for E3's 5c, which is in (`5eb1cade5`). The content plan's B1 repeats
   "steps 5 to 8 ... are not" (its line 794). Fix: mark 5 to 7 built with their commits, and say
   steps 8 and 9 remain; ask the content plan's owner to update B1's sentence.
2. **`core/rooms.js` is edited by step 7 and listed nowhere.** `ed3bf1e83` adds
   `window.networkLinks?.syncRoom?.(roomId)` at `core/rooms.js:1007`. It is not in step 7's files,
   stream C1's list or the shared-files table, though the engine plan and slices 9.1 and 9.2 all
   name `rooms.js`. Fix: add it to step 7, to C1 and a row to section 14 ("one line; others re-read").
3. **A restored link item is not the server's link item.** `restoreHandles` (`network-links.js`)
   rebuilds a missing handle from the bootstrap's `footholds` entry, which carries no `sprite` and
   no `storeIn`, and writes a different `observations`. So a restored handle shows a default
   picture and, once the lab sets `linkStoreIn`, is not filed in the capture log, though 4.1 says
   it is shown "again" (P:307-308). Fix: add `sprite` and, when set, `storeIn` to the bootstrap's
   foothold shape (section 6, P:661; neither is secret), or state that a restored handle is a
   plain tray item until the next plant.
4. **The view header and the link item's text disagree.** 13.4 item 5 says the link item's
   `observations` are shown in the view's header (P:1616-1617); 4.3's header is "<link name>, on
   <network name>" (P:354) and `GET /network` carries no observations. Fix: pick 4.3's header and
   drop the sentence from 13.4, or say the view reads the text from the tray item.

### Section 10 (step 9)

5. **Stale fallbacks.** 10.1's Ruth row ("Until then keep `completeTask` ...", P:1268), 10.2's
   `kp_door_admin` row ("Until that change is accepted ...", P:1285) and decision 15's status
   ("for the content plan's owner to accept", P:1708) describe a choice the content plan has made:
   its B1 accepts `opt_netdrop` as a server-checked task and its B2 writes `opt_door_admin` that
   way. A step 9 builder could build both forms. Fix: delete the fallbacks; mark decision 15
   decided with the content plan's B1 and B2 as the reference.
6. **The new captures need a home and their own `targetId`.** 10.2 moves "the `addCapture` for the
   door" to a mapping on `pc_signed_in:store_controller` (P:1286), and the content plan's B1 adds a
   capture for `opt_dropbox_view`; neither plan names the NPC that carries the mapping or the
   capture's `targetId`. The obvious id for the door, `store_controller`, is already the folder
   beat's capture (`scenario.json.erb:588`), and the capture store keeps the first entry per key
   (the content plan's A18), so the door capture would be dropped, and E4 makes a duplicate a
   validator error. Fix: put both mappings on Ruth, beside the other capture mappings, so they are
   heard whatever room is loaded (the content plan's own reason in A14), with new ids such as
   `door_admin` and `dropbox_view`; say so in 10.2 and ask the content plan to use the same.
7. **The jack's published global is undeclared.** 10.1 adds an `observationVariants` entry on
   `network_port_planted` (P:1267). 3.5 says a scenario that reads `<jackId>_planted` declares it in
   `globalVariables` (P:245-248); 10.1 does not add it. Fix: add
   `"network_port_planted": false` to the lab's `globalVariables` row in 10.1 (it does not clash
   with the removed object of the same id, as 10.1 already notes).
8. **`LW-FS01` is already printed in the lab.** 10.2 makes `LW-FS01` a resource `host`, which
   section 6 protects and the leak scanner treats as a network string. The lab's granted Remote
   Session item prints it (`records_share.txt`, `scenario.json.erb:414`, and still "on LW-FS01"
   after the content plan's A1 row 4). The grant's contents are stripped from the bootstrap
   (`DeclaredGrants.strip_all_grant_contents!`) and probably reach the browser only through
   `GET /container`, which the rule allows; if they also come back in an inventory answer, every lab
   run will report a `network_string` finding. Fix: add a 10.3 case that runs the leak check over a
   run that opens the Remote Session item, and if it reports, count declared-grant texts as public
   in the scanner.

### Cross-plan and feature scenario

9. **Two engine table rows still differ.** This plan says E4 edits `systems/minigame-registry.js`
   (P:1672); the engine plan says nobody does and E4 calls the existing `registerMinigameStarter`
   (its line 1329). And `show.html.erb` is in this plan's table (P:1669) but not in the engine
   plan's, although E4's new capture log minigame will want a stylesheet `<link>` there beside
   C2's. Fix: align the registry row; add `show.html.erb` to the engine plan's table ("one `<link>`
   each, either order").
10. **The feature scenario's expected validator output is off by two lines.** `PLAYTEST.md`
    (lines 224-235) and P:1149-1155 expect one warning; the validator also gives the objective
    wiring warning for Sam's two `onceOnly` mappings on `pc_desktop_opened` (indices 7 and 10). And
    the "reachable without a foothold" line for the finance share lists `kiosk_pc`, `lena_pc` and
    `sam_pc`, while the plan's text implies the two open-room PCs only; 7.2's rule says "a PC the
    player can walk up to (not headless)", which the validator reads as "not headless". Fix: either
    make Sam's two mappings disjoint or list the warning; and say in 7.2 whether a PC behind a
    locked door belongs on that line (the host line already excludes it), then match the expected
    output.

---

## 4. Section 10 against the lab and the content plan

Checked against `scenarios/lab_physical_pentest/scenario.json.erb` and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md` part (b) B1 and B2 as they stand.

- **`store_controller` as the headless host.** It exists with that id in `store_room`
  (`scenario.json.erb:1892`), a `notes` object on the `aes_shelving1` anchor with `onRead` setting
  `kp_controller_found`, read by Ruth's capture mapping (`:588`) that completes `opt_controller`.
  `store_room` is locked by key and opened by a pick (`:1858-1860`). No NPC has it as `needsHome`
  or `screenOwner` (those are `staff_pc`, `usb_target_pc`, `staff_pc_2` and two `screenOwner`
  entries), so the validator's "headless with an owner" error cannot fire. The sprite B2 names,
  `m09_door_controller1`, exists. The lab defines no `policies`, so there is no remote-only lockout
  warning and remote sign-in is on everywhere. 10.2 and B2 agree on every field (`type`, `host`
  `LW-DOOR01`, `network`, `locked`, `lockType`, `headless`, `loginPicker: false`,
  `access: { people: ["hampshire"] }`, three pages as `contents`).
- **Its folder as a separate object.** Right, and necessary: a sign-in PC's click returns before
  `onRead` (section 2). 10.2 moves `readable`, `text`, `readDisplay`, `addToNotes` and `onRead` to
  `store_controller_folder`; B2 gives it a position on the shelving clear of the map's box and a
  rewritten text, keeps Ruth's mapping and `opt_controller`. They agree; 10.2 should say "with the
  content plan's text" rather than "its text moves" so the builder takes B2's rewrite.
- **The chain.** Chris (`hampshire`) has creds `c.hampshire` (`:1042`) and a keylogger capture with
  that `address` (`:1073`); `social.captures.revealSecret` is true (`:70`). So Captured sign-ins
  offers `c.hampshire` and fills the password once E4's proof holds (10.4 item 3). Nothing else in
  the lab admits her at the controller. The payoff needs both the box and the password, as
  decision 5 says.
- **The hot desk `LW-HOT-01`.** Not in the lab yet: `hot_desk_pc` is the content plan's A14, in its
  scenario stream, which 10.4 item 2 waits for. A14 makes it `lockType: "login"` in `open_plan`
  with `access: { people: ["hampshire", "lord", "pierce"] }`. `open_plan` is not locked (its one
  locked door leads out to `secure_area`), so there is no "doors skipped" warning; the hot desk and
  `staff_pc_2` will appear on the "reachable without a foothold" line, which is correct and
  harmless: neither leads to the controller. `staff_pc_2` already prints `LW-OPEN-07` in its capture
  (`:1336`), as 10.2 says.
- **The jack.** `network_port` is at `:2031-2052` with `requiresItem`, the `confirm_action`, the
  `set_global` and the `remove_item` exactly as 10.1 removes them; `network_port_planted` at
  `:2053-2068`; Ruth's mapping at `:606`; `opt_netdrop` at `:246`, `manual`. `kit_dropbox`
  (`:876-884`) is a takeable item with an id and is not `droppable`, so `rogueDevice` passes the
  validator. The content plan's A2 row 1 changes its sprite to `pi_cluster1`, which is also the
  jack's `plantedSprite`, so the box in hand, the link item and the box on the port look the same.
- **Globals and tasks.** `kp_netdrop_planted` is declared (`:120`) and read by `ruth_phone.ink` and
  `ruth_debrief.ink`; the client also applies a task's `onComplete.setGlobal`
  (`objectives-manager.js:854`), so ink reads the global as soon as the task completes. The
  riser's rack (`p5_riser_rack`, `:2092`) stays a readable object in both plans.

Apart from minors 5 to 8, section 10 matches the lab and B1 and B2.

---

## 5. Section 12 (9.3b): nothing blocks 9.3a

The reserved fields are refused by the built validator (`validate_network.rb:15-72`) and described
in the schema; `reach_conditions(data, station_network, resource)` takes the scenario data
(`network_model.rb:161`); the foothold record and link item id leave room for `wifi_<network>` and
an implant's foothold. Three ungraded notes for 9.3b's own plan:

1. **Implant sources in `gainedFootholds`.** The client's load-time reconcile completes an
   `unlock_object` task whose target is in `gainedFootholds` whatever the target is
   (`objectives-manager.js:253-256`), while the server reads `gainedFootholds` only for a jack. An
   implant whose source is a PC id would make the client complete a task on that PC that the server
   then refuses. Give implant sources their own list, or key the client check to jacks.
2. **A claim as a pivot.** 12.1 lets "any session there, however it was opened" extend reach
   (P:1383-1385), which includes a claimed session, while 9.3a's view shows a claimed session's row
   as **Sign in** (4.3). Say which, so the view and the reach agree.
3. **Scoped requests with the foothold.** 12.2 has the folder, inventory and unlock requests under a
   remote desktop carry the foothold in 9.3b (P:1419-1421). The step 8 client need not send it now;
   the server ignores the parameter, so adding it later is a client change only.

---

## 6. Claims checked and found right

- The server shapes the step 8 client will read: `GET /network` (`network_view`, `host_row`,
  `resource_row`: hosts then resources, each sorted by id; `session` absent for a claim and when
  `remoteSignIn` is false), `login_session_answer` (`remote`, `footholdId`, `host` only for a
  remote session), the desktop's 403 reasons `no_session` and `unreachable`
  (`games_controller.rb:1954-1962`), the keyboard fetch clearing the foothold (`:1965`), and the
  link item (`network_access.rb:250-268`).
- The client pieces step 8 builds on: `ApiClient.network`, `networkPlant`, `networkUnplug` and
  `login` with `foothold`; `showServerItem` and `syncInventoryFromServer` (`inventory.js:1250`,
  `:1260`), each ending in `refreshInventoryTray()`; the inventory add already sends
  `source_resource_id` when the sprite has `sourceResourceId` and no `sourcePcId` (`:663`, `:888`);
  `pcSessions.has`, `get`, `list`, `registerDesktop` and `_closeDesktop` (the second argument is
  step 8's).
- The container line references in step 8 (`:577-579`, `:893-900`, `:751`, `:796`, `:552-555`,
  `:221-226`, `:564-568`) are where the plan says.
- The feature scenario has both networks, the four shares, the five hosts and the beats P1 to P12;
  no network, host or share name appears outside `networks` and `resources`.
- The sibling slices now use `reach_conditions(data, ...)` and `desktop_request_allowed?`
  (`ACCESS_MODEL_SLICE_9_2_PLAN.md:355`, `:1365`, `:2364`); round 2's minor 21 is settled.
