# USB habit: code review round 2

Branch `build/usb-habit` at `dfd5ca25c`, against `main`. Scope: the R1 fixes, the habit's USB stick
(`a7f2d5eb9`, `e00ec6675`, `24cb39203`, `dfd5ca25c`) and the whole branch diff. The branch is 80
commits behind `main`; the merged result was checked where it touches this work.

Checked by:

- reading the diff and the paths it touches: `Game#held_usb_sticks`, `usb_stick_taken?`, the filter
  in `filter_requires_and_contents_recursive`, `find_scenario_object`, the controller's
  `find_container_in_scenario` and `find_object_in_scenario`, `canonical_inventory_item`,
  `add_item_to_room!` (the knock-out drop), `apply_room_state_changes!`, `NpcFrustration#fail_report!`,
  `npc_frustration_for_client`, `npc-needs.js` `_usbStickHeld`, `interactions.js` (the world click on
  an object), the validator and the leak scanner;
- `git merge-tree` of `HEAD` and `main`, and `main`'s add_object forged-item guard (`clientAdded`);
- the validator (`--no-graph`) over all 176 scenarios;
- the four test files touched by the branch, run alone: 71 Rails runs and 25 JS tests, all passing;
- a live run on a keyless server on :3057 (stopped afterwards), games **1553** and **1574**, with
  every JSON response captured.

## Severity table

| Id | Severity | Finding |
|----|----------|---------|
| B1 | blocker | A stick dropped by a knock-out cannot be picked up: a click on it opens it as a container, the server refuses the unlock, and the player sees "Access denied" |
| M1 | major | Taking the stick before the first refusal stops the habit for good, so tasks keyed on `npc_usb_refused`, the `setGlobal` or the vent can never complete; `test_access_social` U1 strands this way, and nothing warns |
| m1 | minor | The validator errors on anything but a flat `text_file` on the stick, though the server serves an unlocked archive with nested files correctly |
| m2 | minor | The leak scanner cannot see a stick's files: it counts an unlocked stick's authored contents as public room strings, and the default text is not in the scenario at all |
| m3 | minor | Kim's once-only choice comes back after a reload; she says "Take it." and hands over nothing |
| m4 | minor | `usb_stick` takes the first `usb` item whatever its `usbClass`, so a held HID device can become the habit's "stick" |
| n1 | nit | Validator wording: "not takeable, so the player can never get it" is untrue where a knock-out drops it |
| n2 | nit | No check that a stick's files are `takeable: false`, or that stick ids are unique across habit NPCs |
| n3 | nit | Dialogue: the give has no beat for a stick that holds her work |
| n4 | nit | Merge with `main`: two textual conflicts, both easy |
| n5 | nit | The knock-out test writes the inventory by hand, so it never drives the real drop and pickup |

Counts: 1 blocker, 1 major, 4 minor, 5 nit.

## R1 findings

| R1 | Status | Evidence |
|----|--------|----------|
| M1 | fixed | `npc_frustration.rb:613` sets `rearmed = false` when every holding cause is `usb_refused`; controller test "rearmed usb_refused fails inside the park floor come back tooSoon" passes |
| m1 | fixed | `usbUses` counted on the server (`count_usb_use!`, `usb_copy_due?`, lines 676 to 697), capped at 10, kept out of `npc_frustration_for_client` (lines 100 to 122 build the client block without it); no `usbUses` in any captured response |
| m2 | fixed | `access_work.rb:477`, `cause_belongs?` needs `usb_habit_refused?` |
| m3 | fixed as asked | `usbHabit` is on the scanner's withheld list and label; see m2 below for the stick |
| m4 | deferred | In `docs/IDEAS_BACKLOG.md` (line 246), as the build log says |
| m5 | fixed | Validator warns on no station and on a `setGlobal` at a PC that allows USB storage |
| n1 | fixed | `npc_frustration.rb:599` refuses a fail whose `object_id` is not the cause's id |
| n2 | fixed | `test/js/npc-needs-usb-habit.test.mjs:115` |
| n3 | fixed | README "Refused" bullet names the first cause's pool |
| n4 | fixed | Plan's Tests section names the files the build used |

## Findings

### B1 (blocker): the knock-out route does not work

The filter now gives every habit stick `hasContents: true` and `locked: false` (game.rb, the block
added near line 4251). In the world, `interactions.js` (around line 1712) sends any object with
`hasContents` down the container branch, which calls `handleUnlock` before anything else. A stick
on the floor is not held, so `held_usb_sticks` is empty for it and `/unlock` answers 422. The player
can never pick it up.

Live, game 1574: `debugKO` on Kim dropped `kim_usb` in `u1_room` (two `update_room` posts, 200). A
click on it sent `POST /unlock` (422, "Invalid attempt") and showed the toast "Error: Access
denied". The inventory stayed `["Notepad"]`. Before this branch a dropped `usb` item had no
`hasContents` and was picked up like any takeable item, so this is a regression the branch brings.

The server half is right. A plain `POST /inventory` add for `kim_usb` (no source) was accepted from
the room's `objects_added` copy, stored without `contents`, and then `/unlock` and
`GET /container/kim_usb` served the files. So the fix is on the client, or in what the server marks:

- in the world, collect a takeable habit stick first and open it only from the inventory (for
  example, skip the container branch for a takeable object the server marks as a pocket container,
  or for `type: 'usb'` with `takeable: true`); and
- a controller test on the real routes: an `add_object` drop with `sourceType: npc_defeated`, the
  room data showing the stick with no files, an inventory add with no source, then `/unlock` and
  `/container`. A browser check that a click on the dropped stick puts it in the tray.

### M1 (major): taking the stick early strands anything keyed on the refusal

`fail_report!` refuses `usb_refused` once `usb_stick_with_npc?` is false, and the browser stops
attempting once `_usbStickHeld` is false. That matches the user's decision for uses after the
stick has gone. But if the stick leaves before the first refusal, `npc_usb_refused:<npc>`, the
`setGlobal` and the `usb_refused` vent never happen at all.

Live, game 1553: Kim was asked for the stick in her first conversation, before any refusal. Her next
five work uses (needs log ticks 180 to 463) were all met, with no `usb_refused`, no fail and no
turn-back. `u1_refused`, `u1_emailed` and `u1_posted` stayed open. PLAYTEST.md says "After U1", but
nothing in the scenario stops a player doing U2 first, since the choice is offered from the start.

The validator gives no warning for this, and the README still says "Gate a mail, a note or an ink
line on it" with no word that a hand-over can take the gate away. Fix:

- `test_access_social`: offer Kim's choice only once `u1_kim_emailed_file` is true (which also
  gives her line a reason, n3);
- README, "The stick" bullet: a task or line keyed on the refusal must not be reachable only after
  a hand-over the player can do first; gate the hand-over on the refusal global;
- validator: warn when a habit NPC's stick is takeable (or the NPC can be knocked out) and an
  objective task, eventMapping or reactive post depends on `npc_usb_refused:<npc>`, the habit's
  `setGlobal` or `cause: usb_refused`, unless the NPC's give of the stick is gated on that global.

### m1 (minor): nested folders are rejected by the validator but work on the server

`check_usb_stick` errors on any entry that is not a `text_file` and on any file with `contents`
(`validate_access_work.rb:486` and 493). The user's direction is "other files the scenario sets",
and folders are a natural ask. The server already handles them: in game 1574 Kim's stick (row edit
in that game only) held two text files and an unlocked `zip_archive` with a third file inside.
`/unlock` and `GET /container` for `kim_usb` listed all three entries, and both routes for the
nested `kim_r2_zip` served its file; both refused before the stick was held (422, 404). Either allow
unlocked containers whose own entries pass the same file checks, recursively, with duplicate-id
checks across the tree, or say in the README and schema that a stick is flat by design.

### m2 (minor): the leak scanner does not cover the stick

`AccessLeakScanner#room_data_strings` walks the scenario's rooms and skips `contents` only under a
sign-in PC or a node with `locked == true`. A habit stick is unlocked, so its authored file texts
land in the set of strings room data is allowed to ship, and a leak of them would never be
reported. The default `work_file.txt` text is in no scenario at all, so the scanner has nothing to
look for. The build log's "No response up to then carried `work_file.txt`" was a manual search,
and the live scan here (game 1553, "no leaks found") says nothing about the stick. Teach the
scanner that a habit stick's files (authored or the default) belong only in a `/container` or
`/unlock` answer for that stick.

### m3 (minor): the once-only give comes back

`ink/kim.ink` offers `* [Could I borrow your USB stick?]`. `*` state is not saved
(README_ink_best_practices.md, lines 216 and 317). Live, game 1553: after the give and a reload,
the choice was offered again; Kim said "Take it. My PC won't read it anyway." and nothing was given
(no `/inventory` request, no toast). Gate the choice on a declared global set at the give, or on
the stick still being with her. The gate from M1 fixes the order but not this repeat.

### m4 (minor): the stick is the first `usb` item, of any class

`AccessWork.usb_stick` (access_work.rb, the method added near line 773) returns the first
`type: 'usb'` item with an id. An NPC that holds a HID device before its storage stick would have
the HID device stripped of contents, marked `hasContents`, given the default `work_file.txt`, and
used as the habit's stick, which also changes how that device behaves on the floor and in the
tray. Require `usbClass` `storage` (or absent) in `usb_stick`, and have the validator check it.

### n1 (nit): validator wording on a stick that is not takeable

"so the player can never get it to read its files" is not quite true: `add_item_to_room!` sets
`takeable: true` on a knock-out drop, so once B1 is fixed such a stick can be had that way. Say
"cannot be handed over or picked up unless the NPC is knocked out".

### n2 (nit): two missing validator checks

- A file on a stick with `takeable: true` shows a take control that `validate_item_collectible`
  will refuse, since `find_accessible_item` does not search held sticks (read from code, not run).
  The default file is `takeable: false`; an authored one should be too, or the validator should
  say so.
- Two habit NPCs whose sticks share an id are not flagged. The filter, `held_usb_sticks` and
  `_usbStickHeld` all key on the id.

### n3 (nit): Kim's give

The line is short and voiceable, and "My PC won't read it anyway" ties the give to the habit. But
the stick holds work she copies home ("Do not lose this stick." in the default file), and she hands
it to someone she has just told she is busy with no beat at all. Offered only after the refusal
(M1), a line that shows she has given up on it would read better than a stranger's request granted
at once. "Borrow" also promises a return that never happens.

### n4 (nit): merging with `main`

`git merge-tree` shows two conflicts. `public/break_escape/js/systems/npc-needs.js`: this branch
adds `_usbAttempt` and `_usbStickHeld` just before `_borrowDone`, and `main` changes `_borrowDone`'s
signature to `(s, job, met, cut = null)`; keep both methods and `main`'s signature.
`docs/IDEAS_BACKLOG.md`: neighbouring entries. Everything else merges cleanly. In the merged
result, `held_usb_sticks` rejects `i['clientAdded']`, which `main` stamps only on an unsourced
`add_object` and which `CLIENT_ITEM_FORBIDDEN_FIELDS` keeps a client from setting, so the guard is
consistent with `ItemIdentity.client_forged?`; using that helper would keep one spelling. `main`'s
forced fresh id for an unsourced add also means a forged room object can never take a stick's id.

### n5 (nit): the knock-out test

`usb_habit_test.rb`, "a stick picked up after a knock-out opens", sets `isKO` and writes the stick
into the inventory directly. It proves `held_usb_sticks` accepts a knock-out, not that a player can
get the stick, which is how B1 got through. See B1 for the test to add.

## The points asked about

- **Files before the stick is held.** No leak found. Room data, the bootstrap, NPC `itemsHeld`,
  the inventory answer and the saved inventory copy carry `hasContents` and no files (filter, then
  `canonical_inventory_item` filters again). A knock-out drop saves the full scenario copy, files
  included, in `room_states.objects_added`, but room data applies the filter after merging it, and
  `find_container_in_scenario` searches only the scenario's rooms, grants and held sticks, never
  `objects_added` or an NPC's `itemsHeld`: the floor stick answered 422 and 404 in game 1574. The
  capture code records responses only; across both games' captures the default text and the probe
  texts appear only in `/unlock` and `/container` answers after the stick was held. The scanner
  could not have caught a leak (m2).
- **Forged or otherwise taken sticks.** A stick only opens when the inventory holds it (not
  `clientAdded`) and the server's give record or knock-out record says it left the NPC. A forged
  inventory entry, an invented id, a floor stick and a stick still with Kim all answer 422 and 404
  (tests, and games 1553 and 1574). A tampered client can still claim Kim's give without the ink
  choice once she has been met (`validate_item_collectible`'s NPC branch needs only the encounter):
  that is the existing ink-gated give, best effort under the cheat resistance policy, and it opens
  only the file the stick was meant to give.
- **The intended routes.** The ink give works end to end (game 1553: give, tray, `/unlock`,
  `/container`, `work_file.txt` listed and served). The knock-out route fails in the browser (B1),
  though its server half works. Authored files work: two flat files and a nested archive were all
  served (m1 for the validator).
- **After the stick is gone.** Uses are plain and uncounted, and `usb_refused` fails are refused,
  as decided. A refusal-keyed task strands if the stick goes first (M1).
- **Validator.** Messages are clear and point at the fix. Over all 176 scenarios, only
  `test_access_social` mentions the habit or the stick: 0 errors, its three known warnings, and two
  info lines. No false warnings, no timeouts. Gaps: M1, m1, m4, n1, n2.
- **Kim's ink.** Compiles (the JSON carries both new lines), the tag sits directly above its line,
  the hub keeps a sticky exit. Issues: m3, n3, and M1's ordering.

## Sync size

What the stick adds to `player_state`, per habit NPC:

- one `npc_given_items` entry (about 60 bytes: type, id, name), written once at the give;
- one inventory entry with no files (216 bytes in game 1553, 315 in 1574);
- the stick's id in `unlockedObjects`, plus the id of each nested container opened;
- `npcFrustration.<npc>.usbUses`, an integer capped at 10, server only;
- after a knock-out, the dropped stick's full scenario copy in `room_states.objects_added` (765 bytes
  in game 1574, with three probe files), server only, removed when picked up through the room.

All of it is bounded by the scenario's authored stick. Nothing stick-specific travels in
`sync_state`, and no answer re-sends the files: they go out only in an `/unlock` or `/container`
answer the player asks for. The whole inventory list that `/inventory` returns is the existing
pattern; the stick adds one small entry to it.

## Live proof

Keyless server on :3057 from this worktree, headless, `--start-room u1_room`, stopped afterwards.

- Game **1553**: before talking, `/unlock` and `/container` for `kim_usb` answered 422 and 404. The
  give put `kim_usb` in the tray; the tray click sent `/unlock` (200) and `GET /container/kim_usb`
  (200) and the container listed `work_file.txt`. Kim's next five work uses were all met; the U1
  tasks stayed open (M1). After a reload the choice came back and gave nothing (m3). The leak
  check over the 29 captured responses: no leaks found.
- Game **1574** (Kim's stick given three probe files in this game's row only): `debugKO` dropped the
  stick; `/unlock` and `/container` for the stick and its nested archive answered 422 and 404 while
  it lay on the floor; a click on it gave "Access denied" and no pickup (B1). A direct inventory add
  was accepted, and then the stick and the nested archive were both served.
