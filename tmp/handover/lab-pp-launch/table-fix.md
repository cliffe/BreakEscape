# Table-top placement live proof: handover

Branch `build/lab-pp-tables`, worktree `.claude/worktrees/p-lab-pp-tables`. Server already running on
:3061 (answers 200 on /break_escape). Proving commit d8b6bc9fa (per-item `position` + `table_items` y).

## Done and PASSING (do not redo)

1. Base-on-surface, all 25 moved items PASS. The audit already proved the engine applies these
   positions deterministically and live == computed, so this is authoritative. Script + output:
   - `<scratch>/table-audit/new_compute.py` -> prints PASS/FAIL per item; all PASS, FAILS=[].
   - (`<scratch>` = /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/71228547-c9d6-4671-85b6-93d22be0c8a1/scratchpad)
   - Uses this worktree's assets. kit_rogue_ap now seats on credenza kit_C_NW2; staff_pc_2 moved
     x6->5.75 (commit moved TWO pcs: staff_pc x2->1.5 and staff_pc_2 x6->5.75).

2. No-menu (tap disambiguation) analysis via the all-rooms loader on snapshot game 8977 (all rooms
   unlocked with tools/playtest/unlock-all-rooms.rb; unlock state does not affect positions, so this
   is layout-only evidence). Scripts: `<scratch>/table-audit/rivals.mjs`, `dist.mjs`,
   `snapshot.mjs`. Model = engine's own rivalsAt (aim.js): rival if item CENTRE is inside another
   INTERACTABLE object's bounds, or within TAP_SLOP(32)+2 of its top-left; inReach forced true
   (strict worst case). Results in `<scratch>/table-audit/after/rivals-first.json`.

   PASS (no menu) - the whole open_plan desk cluster, the main risk the audit flagged:
   staff_pc, staff_pc_2, planted_deviceA, hampshire_badge, pierce_printout, pierce_comms_card,
   usb_malware_note - ALL noMenu=true. Also kit_qr, kit_cloner, kit_cable, kieran_laptop,
   visitor_book, p1_franking: noMenu=true.

3. Screenshots (zoom 2, items revealed, lights on) for briefing_room, reception, open_plan, P1, P2,
   store_room, secure_area in `<scratch>/table-audit/after/first-<room>.png`. Not yet eyeballed one
   by one, but positions confirmed numerically.

## OPEN - needs a decision + data fix + re-prove

Strict centre-tap analysis finds these share a tap (gap < 32 px). Distances (centre-to-neighbour
top-left, the engine metric):
- kit_deviceB centre ~ kit_dust TL = 31 px  (commit moved both; briefing credenza)
- kit_dust centre ~ kit_rogue_ap TL = 28 px (commit moved both)
- kit_rogue_ap centre ~ kit_hivis TL = 16 px (rogue_ap was moved onto the credenza beside the
  hi-vis wall hook; hivis itself not moved)
- store_controller_folder centre ~ store_shelf TL = 26 px (folder moved only ~1.4 px up; the
  folder-on-shelf overlap is almost certainly PRE-EXISTING, not introduced by this commit -
  confirm against the pre-commit tree before treating as in scope)

Cause in briefing: four kit items (deviceA tl38, deviceB tl72, dust tl106, rogue_ap tl138) span two
64px credenzas (x32..159) at ~32-34 px top-left spacing. The audit author INTENDED 32 px and said so,
but centre-to-TL drops a few pairs just under the 34 threshold. Options: (a) widen spacing - but the
credenza pair is only 128 px for 4 items; may need to drop one item to the lower credenza row or
accept; (b) move rogue_ap away from the hivis hook specifically. These are DATA-only position edits
in scenario.json.erb, then re-run rivals.mjs to confirm noMenu=true, re-run new_compute.py to confirm
still seated, commit by explicit path.

Decision needed from orchestrator/user: is 32 px top-left spacing acceptable (menu only on a dead-centre
tap, and interact() still finds a clean edge point), or must centre taps be menu-free? If the latter,
re-space the four briefing kit items and (if in scope) nudge the store folder.

## NOT STARTED

- Live walk-to + centre tap opens/takes with no menu on real games (8957 default, 8958 open_plan
  head-start), via the harness (session-start.sh + cmd.sh, `interact` reply carries aim.clean/rivals).
  Repeat after a reload (eval location.href = pathname + '?skip_resume=1', Enter on title).
  Re-tap staff_pc and staff_pc_2 (both MOVED) - confirm no menu.
- Office-life NPC still walks to and USES the two moved PCs (staff_pc owner hampshire/Chris,
  staff_pc_2 owner pierce/Melanie). Check needs/affordance routing reaches the new x.
- Renders of changed rooms: Skill tool, skill "mission-room-dressing", its render step ->
  `<scratch>/table-audit/after/`.
- Validator: `BUNDLE_PATH=... ruby scripts/validate_scenario.rb scenarios/lab_physical_pentest/scenario.json.erb --no-graph` (only known door_admin error allowed).
- Model test: `BUNDLE_PATH=... flock tmp/tests.lock bin/rails test test/models/break_escape/lab_physical_pentest_content_test.rb`.
- Append an "After" section to `scenarios/lab_physical_pentest/TABLE_PLACEMENT_AUDIT.md` with
  PASS/FAIL per item + screenshot paths. Do NOT touch any NPC eventMappings.

## Env notes
- Ruby: `export PATH=/home/cliffe/.rbenv/bin:/home/cliffe/.rbenv/shims:$PATH; unset RBENV_VERSION` (2.7.8). Do NOT set RBENV_VERSION=3.1.6 (not installed).
- BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
- new-game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3061 bin/rails runner tools/playtest/new-game.rb lab_physical_pentest [--start-room open_plan]`
- playwright headless shell: /home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell; require from main checkout node_modules.
- loadRoom 403s on locked rooms (server-gated); use unlock-all-rooms on a throwaway layout game, or navigate via harness `enter` through the open doors.
- Games created this session: 8957 (default), 8958 (open_plan head-start), 8977 (snapshot, all rooms unlocked - layout only).
- No scenario/map edits made this session. Nothing committed except this note.
- Xvfb :97 NOT started (headless playwright needs no X). Start it only for the mission-room-dressing render step; stop by PID.

## 2026-11-18 follow-up (table-tap re-space): BLOCKED, needs a design call

No scenario edits made. Data-only analysis, no browser (per brief; the playwright/rivals.mjs
run was also refused by the auto-mode classifier, so I ported the engine's rivalsAt to pure
Python and validated it against the real rivals-first.json below).

### Validated Python port of rivalsAt
`<scratch>/table-audit/rivals_py.py` reproduces the engine's rivalsAt exactly (full texture
bounds + sprite-TL distance, TAP_SLOP 32, M 2). Against the CURRENT tree it reports the three
flagged pairs (deviceB->dust 30.7, dust->rogue_ap 28.2, rogue_ap->hivis 15.7) PLUS three the
handover had not checked:
- kit_deviceA -> kit_deviceB 31.6  (NEW regression from d8b6bc9fa: it moved deviceB to x72)
- kit_dropbox -> kit_cable 28.5    (NEW regression from d8b6bc9fa: it moved cable to x166)
- kit_lanyard -> roe_board 33.6    (pre-existing, not from the commit)

### Briefing room is over capacity, so the brief's plan cannot be met as written
Surfaces (sprites): 4 credenzas (64px each) + 1 oval (80px). 9 interactable kit items must sit
on them. The hi-vis hook (kit_hivis, a wall object at TL 164,31) reaches ~34px left into the
top-right credenza, so that credenza holds only ONE clean item (centre_x <= ~128). Clean slots:
top-left 2, top-right 1, lower-left 2, lower-right 1 (qr is 22px wide and eats the middle of its
64px credenza, so it must sit alone), oval 2 = 8 slots for 9 items.

Brute force (rivals_py) confirms:
- 4 items on the two top credenzas + the fixed hook: NO layout clears >34, even under the weak
  directional rivals.mjs criterion (only the moved items tapped). One item must leave the top row.
- The oval cannot take a 3rd item (80px, dropbox is 27px wide): no 3-item layout clears >34.
- No credenza has room for a relocated 4th item: qr/rogue_ap/dropbox/deviceA are all wide, and a
  64px credenza fits at most 1 wide + 1 narrow (or 2 narrow); every credenza is already at that.

So "move one kit item onto another nearby surface" (the brief's fallback) has no free surface to
move it to. The hook at x164 is wedged between the credenza cluster and kit_lanyard at x212:
moving the hook right to free the slot makes it collide with the lanyard (hook centre within 34
of lanyard TL), so the hook AND the lanyard would both have to move.

### Options for the orchestrator (pick one; all are data-only)
1. Move the hi-vis hook AND the lanyard rightward along the wall (hook ~x186, lanyard ~x236, clear
   of disguise_locker at 228) to open a 2nd clean slot on the top-right credenza, then seat all 4
   kit items on the top credenzas. kit_hivis has no explicit position (it lands at 164,31 via the
   generic item-pool slot system); pin it with an explicit `position` to move it. This is the only
   way to keep all 9 items on surfaces with zero shared taps.
2. Accept ONE shared tap (a pick-one menu) for a pair that belongs together, and clear the rest.
3. Drop one kit item from the briefing surfaces (e.g. make it start in inventory, like the
   lockpick already does), freeing a slot.

### Store room: also a structural overlap, not a gap
store_controller_folder's centre (42,46) sits INSIDE store_shelf's full bounding box (34,7..86,70),
so it is a rival regardless of distance (the handover's "26px" is not the trigger). The shelf is
the only surface in the room (the box sits on it; the controller is a wall box). The overlap is
PRE-EXISTING: before d8b6bc9fa the folder was at y1.2 (world y38, centre 46, still inside); the
commit nudged it to y1.15625 (world y37), ~1px worse. The folder cannot both rest on the shelf and
clear the shelf's tap. Options: accept it (shelf + its own folder are arguably one tap area), or
move the folder off the shelf (loses the "on a surface" property).

I did not edit scenario.json.erb: every candidate move either regresses d8b6bc9fa's seating or
needs one of the design calls above. Validator + Rails test not run (no edits to verify).

## 2026-11-18 resolution (table-tap re-space applied): DONE, one accepted pair

Decision taken (orchestrator option 1, with its stated fallback). Data-only, positions only, no
browser. The checker is the validated pure-Python rivals_py.py port (full texture bounds +
sprite-TL distance, TAP_SLOP 32, M 2); it reproduced all six current pairs exactly before edits.

### The over-capacity is real, so zero shared taps is impossible without removing an item
Independent re-confirmation: the four top kit items (deviceA, deviceB, dust, rogue_ap) cannot all
be mutually clear (>34) on the two 64px top credenzas (128px total) regardless of the wall. A
greedy search over every ordering and both credenzas returns no clear packing; the minimum span
to the fourth item's top-left runs past the credenza edge. So at least one pair MUST share. Since
the brief forbids changing item definitions / inventory, this is forced.

### What was applied (positions only, scenario.json.erb)
Left exactly ONE shared pair, the two planted USB-style devices that belong together:
kit_deviceA (hardware keylogger) + kit_deviceB (BadUSB), kept at their current positions
(centre-to-top-left 31.6; they already shared). All five other flagged pairs cleared.

New positions (tile units; TL = round(pos*32)):
- kit_hivis:    ADD position { x 6.25,    y 0.875,   elevation 8 }  (TL 200,28; was slot 164,31)
- kit_lanyard:  as-type -> { x 5.6875,  y 1.59375, elevation 8 }  (TL 182,51; was 212,34)
- kit_dust:     { x 3.3125,0.75 } -> { x 4.6875,  y 0.5625,  elevation 30 } (TL 150,18; NW2 far right)
- kit_rogue_ap: { x 4.3125,0.875 } -> { x 3.46875, y 0.90625, elevation 30 } (TL 111,29; NW2 left)
- kit_cable:    { x 5.1875,6.09375 } -> { x 5.46875, y 6.09375, elevation 18 } (TL 175,195; oval)
- kit_deviceA, kit_deviceB, kit_dropbox: unchanged.

Why hivis/lanyard moved so far: with roe_board fixed at TL 246,25, hivis must go right to clear
rogue_ap, which crowds lanyard, and lanyard cannot stay at its height and clear both hivis and
roe_board (the wall between the credenzas and roe_board is too short for two hooks at one height).
The minimum-disruption valid layout drops the lanyard to y51 (17px lower on the same wall). The
brief's suggested lanyard x236 was checked and REJECTED: it moves the lanyard toward roe_board and
makes that pair worse (20px), not clear. Keeping hivis/lanyard at natural height would need either
moving roe_board right ~30px (an unlisted story-object move, not done) or a second shared pair.

### Checks (this worktree)
- rivals_py.py whole lab: briefing -> only kit_deviceA/kit_deviceB (31.6, accepted). store ->
  store_controller_folder INSIDE store_shelf (accepted, decision 2, pre-existing). reception,
  open_plan, P2 show pre-existing strict-metric pairs in rooms NOT touched here (the engine's
  directional rivals.mjs found these noMenu live; see earlier section 2). P1 clean.
- new_compute.py (base-on-surface seating): all PASS, FAILS=[] (incl. the three moved items).
- validator: 1 error (known door_admin), 13 warnings (pre-existing). PASS criterion met.
- bin/rails test .../lab_physical_pentest_content_test.rb: 10 runs, 2185 assertions, 0 failures.
- PLAYTEST.md references the moved items by id only (test commands), no coordinate quotes; no edit.

Scratch driver scripts (under <scratch>/table-audit/): driver.py (reproduce current), verify_full.py
(briefing with new positions), whole_lab_rivals.py, new_compute.py (updated), optimize2/scan2.py.
