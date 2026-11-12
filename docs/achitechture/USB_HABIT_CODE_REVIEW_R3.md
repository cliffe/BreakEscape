# USB habit: code review round 3

Branch `build/usb-habit` at `466606f0c`, against `main`. Scope: the R2 fixes (`855b5ac4f`, the merge
of `main`; `e62518379`, `378143287`, `fe15befd9`, `466606f0c`), the merge resolution, and the whole
branch diff. `main` has moved 27 commits since the merge; a fresh merge was checked too.

Checked by:

- reading the diff and the paths it touches: the B1 branch in `interactions.js`, the click router
  in `core/game.js` (`gatherInteractablesNearClick`, `withoutChairsIfOthers`,
  `findObjectsAtPosition`, `queueSit`), `seating.js` (`advanceMount`), the knock-out drop in
  `npc-hostile.js`, `Game#validate_unlock`, `find_scenario_object`, `add_item_to_room!`,
  `filtered_room_data`, the validator's stick and give checks, and the leak scanner's stick rule;
- a render of all 176 scenarios, listing every item any NPC holds (198 items), to see which carried
  containers a knock-out could drop;
- two validator probes on copies of `test_access_social` in the scratchpad (the give gated by a
  conditional block, and a `#give_npc_inventory_items` give);
- a three-way comparison of `docs/IDEAS_BACKLOG.md` (base, both parents, merge) and a re-run of the
  merge with `git merge-tree`, compared with the merge commit;
- the affected test files run alone (listed under Tests);
- a live run on a keyless server on :3050 (stopped by PID afterwards), headless, setFPS(20) with
  fixed steps on, `--start-room u1_room`.

## Severity table

| Id | Severity | Finding |
|----|----------|---------|
| m1 | minor | A real player's first click on a dropped stick can walk to Kim's chair and end in "Can't reach that seat from here." |
| m2 | minor | A stick dropped by a knock-out is drawn with the fallback `key` picture until a reload |
| m3 | minor | A knock-out before the first refusal strands refusal-keyed tasks, and the validator's knock-out check counts those tasks as safe |
| m4 | minor | Any other container an NPC carries fails the same way B1 did; no scenario has one today |
| m5 | minor | Merging the current `main` gives four conflicts, one of them a clash over the room east of `f13_room` |
| n1 | nit | The give-order warning misses `#give_npc_inventory_items` and mail-reply ink, and warns on a give gated by a conditional block |
| n2 | nit | The scanner's `stick_content` rule cannot see files served before the stick is held, and lets any `/unlock` answer carry them |
| n3 | nit | The scanner can report a stick file whose name or text matches a sign-in PC, profile or share file (a false positive) |
| n4 | nit | The B1 test for a floor stick also matches a takeable `usb` whose flag lock was opened remotely earlier in the session |
| n5 | nit | Kim's ink sets `u1_kim_gave_usb` before the give, so a refused give cannot be retried by talking |

Counts: 0 blocker, 0 major, 5 minor, 5 nit.

## R2 findings

| R2 | Status | Evidence |
|----|--------|----------|
| B1 | fixed | `interactions.js:1717`, `pocketStickInWorld` skips the container branch; `test/js/usb-stick-pickup.test.mjs` 5 pass. Live, game 1622: the in-reach click sent only `POST /inventory` and `update_room` (200), no `/unlock`, and the tray held `kim_usb`; from the tray `/unlock` 200, the container listed `work_file.txt` |
| M1 | fixed for the ink give | `kim.ink`: `+ {u1_kim_emailed_file and not u1_kim_gave_usb}`. Live, game 1626: no stick choice before the refusal; the refusal came at 35 s; then the choice, the give, `u1_kim_gave_usb` true; tasks `u1_refused` and `u1_emailed` saved. The validator warning exists (`check_usb_give_order`). Gaps are m3 and n1 |
| m1 | fixed | `check_usb_stick_entries` recurses into unlocked folders up to five levels, with ids unique across the tree; validator tests "nested entries" and "an unlocked folder or archive" pass |
| m2 | fixed as asked | `habit_stick?` hides a stick's `contents` from the public strings; files carry scope `:stick`; the default file is added by `add_default_stick_file`. Gaps are n2 and n3 |
| m3 | fixed | Live, game 1626: after a reload the choice did not come back |
| m4 | fixed | `AccessWork.usb_stick` takes `usbClass` `storage` or none; unit test "never a HID device" and validator test pass |
| n1 | fixed | The warning now says it "cannot be handed over or picked up unless kim is knocked out" |
| n2 | fixed | Validator warns on a takeable file, errors on a shared stick id |
| n3 | fixed | The new line ties the give to the refusal; "borrow" is gone |
| n4 | fixed | See "The merge" below; `held_usb_sticks` uses `ItemIdentity.client_forged?` |
| n5 | fixed | `usb_habit_test.rb:277` drives the KO state, an `add_object` drop with `npc_defeated`, room data, an unsourced add, `/unlock` and `/container` |

## Findings

### m1 (minor): the first click on a dropped stick can go to Kim's chair

The message comes from `seating.js:548` (`advanceMount`): a sit was started and the walk onto the
seat got stuck out of reach. A sit starts from a click on a chair. Out of reach, `core/game.js`
takes the first interactable in `findObjectsAtPosition`, which is ordered by depth, walks there and,
for a seat, calls `queueSit` (game.js:2371). Kim's chair (`u1_room_chair-white-1-rotate8_153`, 32 by
32, depth 153.5) covers the place where she falls. The stick's depth follows its y, so whether it
sits above or below the chair depends on where Kim was at the knock-out.

Live: in games 1612 and 1617 (knock-out after 25 s, Kim at y 134) the stick lay at y 134, depth
155.5, above the chair. In game 1622 (knock-out straight away, as in the R2 run) it lay at y 129,
depth 150.5, below the chair. From the sign, one `clickAt` on the stick's own centre walked the
player to the chair and showed "Can't reach that seat from here."; the inventory did not change. A
second click, now in reach, picked the stick up, because `withoutChairsIfOthers` drops the chair
from the in-reach candidates.

So a real player can hit it with one ordinary click. It recovers on the next click and the code is
from `main`, not this branch, but the knock-out route now invites the click. Possible fixes: in the
out-of-reach branch, prefer a takeable item over a seat at the tapped point (as the in-reach path
already does), or raise the depth of a knock-out drop above the furniture it lands on.

### m2 (minor): the dropped stick looks like a key

`npc-hostile.js:502` picks the drop's picture from `item.texture || item.type`, falling back to
`key`, and never reads `sprite`. There is no `usb` texture, so the floor stick is drawn with the
`key` picture (live, games 1612, 1617 and 1622: texture key `key`). After a reload `rooms.js` draws
it from `sprite` (`usb_bowl1`). The name and observations are right, but a player looking for a
stick sees a key. This is `main`'s code; the build log says `build/ff-phone` changes the drop, so
check there first. Fix: try `item.sprite` before `item.type`.

### m3 (minor): a knock-out before the refusal

`check_usb_give_order` reads only the NPC's own ink. The other ways the stick can leave before the
first refusal:

- **A knock-out.** The player chooses it, and the knock-out also stops the NPC's work, so the
  refusal could never happen whoever held the stick. It strands `u1_refused`, `u1_emailed` and
  `u1_posted`. In `test_access_social` that is acceptable: those tasks are beat markers for a
  tester, and U3 needs the knock-out (debugKO), so `koImmune` on Kim would break that beat. The tasks
  do not need to complete another way there.
- In a mission it is a real risk, and nothing catches it. The validator's knock-out check
  (`validate_scenario.rb`, about line 1505) treats any task completed by an eventMapping as safe,
  but these mappings sit on the NPC and wait for events only its habit raises. The README bullet
  says only "A knock-out drops the stick whenever it happens; the validator does not check that
  route." To keep a student on the intended route, the README should say that a required task keyed
  on the refusal needs `koImmune` on the NPC, a `taskOnKO`, or a mapping on the NPC's knock-out
  global, as for conversation tasks. The give-order warning could also cover this: warn when a
  habit NPC is not `koImmune`, attacks are not disabled, and a required objective task waits on the
  refusal with no knock-out fallback.
- **A give from another NPC's ink, an onDefeat action or a timer.** `#give_item` takes from the
  conversation NPC's own `itemsHeld`, so another NPC's ink cannot give Kim's stick, and the timer and
  flag-reward gives hand out scenario or declared items, not another record's held item. These are
  not real routes. The ones that are real are in n1.

### m4 (minor): other carried containers on a knock-out

The B1 change is scoped to a `type: 'usb'` habit stick, and that scope is right for this branch: the
server marks only habit sticks that way, and no other `usb` item in any scenario has contents. The
general failure is still there for anything else an NPC carries that is a container. A dropped
held item is saved in `room_states.objects_added`. A click on it in the world goes down the
container branch if it is a suitcase, briefcase, `bag1` or `bin1`, or has `contents` or
`hasContents`, and calls `handleUnlock`. `Game#validate_unlock` then looks it up with
`find_scenario_object` (game.rb:2576), which searches the scenario's rooms, profiles, resources,
grants and held sticks, but not `objects_added` or an NPC's `itemsHeld`. So it answers false and the
player sees "Access denied", as in B1. The same is true of such a container given in conversation
and opened from the tray.

No mission is affected today. Of the 198 items NPCs hold across all 176 scenarios, none has
`contents`, none is a container type and none is locked (types: key, keycard, notes, lockpick,
workstation, lab-workstation, id_badge, phone, text_file, launch-device, coverage form, and the one
habit stick). Since it is pre-existing and latent, file it in the backlog. Before a scenario gives an
NPC a bag, folder or laptop, either have the server find a held or dropped container by its give or
knock-out record (as `held_usb_sticks` does), or have the validator warn on an NPC-held item with
`contents`.

### m5 (minor): merging the current `main`

`git merge-tree HEAD main` now gives conflicts in `npc_frustration.rb` (this branch's USB use count
methods beside `main`'s `borrow_locked_out?`), `npc-needs.js` (the `_usbAttempt` call beside `main`'s
q36 borrowed-desk lockout check, and the doc comment of `_borrowDone`), `test_access_social/PLAYTEST.md`
and `test_access_social/scenario.json.erb`. Keep both sides in each. The scenario needs more than
that: `main` makes `f13_room`'s east door lead to `l1_room`, and this branch makes it lead to
`u1_room`, so `u1_room` has to move to a free side of another room (and its own `west` change with
it). The globals list, the objective tasks and the social `characters` list also need both sides.
After the merge, rerun the U1 to U3 beats and the L1 and L2 beats, because both features change the
work verdict in `npc-needs.js`.

### n1 (nit): gaps in the give-order warning

Probes on copies of the test scenario:

- Kim's give rewritten as `+ [Can I see what you've got on you?]` with `#give_npc_inventory_items:usb`
  (the tag that opens the NPC's items for the player to take): no warning. The tag regex matches
  only `#give_item:usb` or the stick id. Two scenarios use that tag today.
- A mail reply's ink can run `#give_item` with the NPC's record as the speaker (`mail-runner.js`);
  that file is not `storyPath`, so it is not read.
- The give gated by a conditional block instead of on the choice line
  (`{u1_kim_emailed_file and not u1_kim_gave_usb:` round an ungated `+` choice) gave a false warning,
  "Offer the give from a choice gated on {u1_kim_emailed_file}". The give is gated. It is only a
  warning and the fix is easy, so leave it or teach `usb_stick_gives` to look for an enclosing block.

### n2 (nit): what the `stick_content` rule cannot see

A stick file passes in any `GET /container/<stick or nested id>` answer and in the top-level
`contents` of any `/unlock` answer (`folder_unlock_answer?` is true for every stick file, since its
ancestors always hold the stick id). The scanner does not know whether the stick was held at the
time, so the main thing the server guards, files served for a stick still with Kim or lying on the
floor, would pass the scanner. An `/unlock` answer for some other object that carried them would
pass too. Once served, a file is marked legitimate for the rest of the run, which is the scanner's
rule for every content class. The controller tests cover the held check ("a stick the player does
not hold opens nothing", "a forged inventory entry", the knock-out test's floor 422 and 404), so this
is a limit to note in the scanner's comment rather than a hole. Files shorter than 6 characters, and
fields other than `name`, `text` and `content` (for example a file's `observations`), are not
checked, as for every item.

### n3 (nit): possible false positives in `stick_content`

A stick file's `name` matches on equality. Only room data's public strings are taken away from the
secret list (`@public_strings`), so a stick file named like a file on a sign-in PC, in a profile or
on a share (`notes.txt`, `report.docx`) would be reported when that other file's own `/container`
answer is captured. The default `work_file.txt` is in no scenario, so nothing hits it today. The
same is true of the sign-in and profile rules. The validator could warn on a stick file name used
elsewhere, or the scanner could skip names that are not unique in the scenario.

### n4 (nit): the floor-stick test is a little wide

`pocketStickInWorld` needs `type: 'usb'`, `takeable: true`, `hasContents: true`, `locked !== true` and
no `contents` array. The server sets that shape only for a habit stick. One other case matches: a
takeable `usb` item with files and a flag lock that a flag-station reward opened during this
session (`hasContents` with no files, then `locked` set false in the browser). It would be picked up
rather than opened in place. No scenario has one (no room `usb` item has contents). It is not worth
widening the server data for; a comment would do.

### n5 (nit): the give flag is set before the give

`kim.ink` sets `~ u1_kim_gave_usb = true` and then runs `#give_item:usb`. If the server refused the
give (a network error, say), the choice is gone for good and only the knock-out is left. It is a
test scenario and the give is not expected to fail, so this matters only if the pattern is copied
into a mission. Setting the global from the give's success would need engine support; the README
could mention it.

## The merge (`855b5ac4f`)

A re-run of the merge with `git merge-tree` gives the same tree as the commit, except for the two
conflicted files, where the commit holds the resolution:

- `npc-needs.js`: both `_usbAttempt` and `_usbStickHeld` are kept, and `_borrowDone` takes `main`'s
  `(s, job, met, cut = null)` and its comment. Nothing else differs.
- `docs/IDEAS_BACKLOG.md`: compared line by line across base, both parents and the merge. The only
  line from `main` that is missing is its copy of the C2 R2 entry. That line is identical to the base,
  and the branch's version differs only at the end ("USB refusal as a cause is built:
  docs/achitechture/USB_HABIT_PLAN.md"), so keeping the branch's wording is right. The eleven lines
  present on the branch side and missing from the merge are exactly the lines `main` deleted from the
  base (the habits validator R2 and title escape R5 entries, and the lab follow-up section). Nothing
  else was lost, and the merge adds no line from neither side.

## Tests

Run alone, no lock:

- JS: `validator-usb-habit` 20, `usb-stick-pickup` 5, `npc-needs-usb-habit` 12, `interaction-warning`
  13, `validator-access-work` 38, `validator-access-social` 17, `validator-access-reactive` 10; and
  every test file that imports `systems/interactions.js` (combat-input, access-signin-requests,
  consumables, fight-styles, flag-lock-remote, f18-toast-flag-rfid, escaping-shared-helpers,
  inventory-menu, network-links-routing, notifications-plain-default, locked-hint-refusals,
  minigame-title-escape, requires-item-hint, rfid-cloner-click-guard, examine-minigame,
  rfid-keycard-click-guard, minigame-launch-routes, rfid-clone-card, wearable-hooks): 216 tests,
  all pass.
- Rails: `usb_habit_test.rb`, `access_work_usb_habit_test.rb`, `access_leak_scanner_test.rb`,
  `access_leak_scanner_feed_test.rb`: 112 runs, 529 assertions, 0 failures.
- Validator, `test_access_social` (`--no-graph`): no errors, the three known warnings only.

## Sync size

Measured in the live games:

- After the knock-out route (game 1622) the saved inventory copy of the stick is about 330 bytes,
  with no files; `room_states.u1_room` holds `objects_removed: ["kim_usb"]` and an empty
  `objects_added`, and Kim's `npc_states` entry (`isKO`, `currentHP`).
- After the give route (game 1626) `npc_given_items.kim` holds one entry (id, name, type), and
  `u1_kim_gave_usb` is one boolean global. The whole `player_state` is 2879 bytes.
- After the stick was opened, the client's only writes were `/unlock` (77 bytes) and one
  `sync_state` (245 and 247 bytes), and neither carried a file name or text. The files go out only
  in the `/unlock` and `GET /container` answers the player asks for.

All of it is bounded by the scenario's authored sticks: one give record, one inventory entry, one
removed id and one boolean per habit NPC, each written once. Nothing in these fixes makes a sync
grow with play.

## Live proof

Keyless server on :3050 from this worktree, headless, setFPS(20) with fixed steps on, stopped by
PID afterwards. Games created: **1611** (created, not used), **1612**, **1617**, **1622**, **1626**.

- Games 1612 and 1617 (knock-out after 25 s): the stick lay above Kim's chair in depth. The
  scripted world click did not land in 1617 (a coordinate error in the probe), and the bridge's
  `interact` then picked the stick up with no `/unlock` and no alert. The tray open served
  `work_file.txt`.
- Game 1622 (knock-out straight away): the stick lay below the chair in depth; one click from the
  sign walked to the chair and showed "Can't reach that seat from here." (m1); the second click
  picked the stick up (`POST /inventory` and `update_room`, 200; no `/unlock`); the tray open sent
  `/unlock` 200 and served the file. Drop texture `key` (m2). Leak check over 13 responses:
  `stick_content` 0, no leaks found.
- Game 1626 (give route): no stick choice before the refusal; refusal at 35 s; the choice, Kim's line,
  the stick in the tray, `u1_kim_gave_usb` true; after a reload the choice did not come back; tasks
  `u1_refused` and `u1_emailed` saved. Leak check over 26 responses: no leaks found.
