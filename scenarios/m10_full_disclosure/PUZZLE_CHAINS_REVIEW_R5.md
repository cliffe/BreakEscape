# m10 Full Disclosure: puzzle chains, round 5 review

2026-10-22. Phase 2, round 5, on HEAD fb2f51db8 ("flag 2 staging sign-in card by the release console (B7)"), with 05a9d376f (the R4 nits) beneath it. Run with `.claude/skills/mission-puzzle-chains/SKILL.md`. Read-only: this file is the only one written. The working tree is clean for `scenarios/m10_full_disclosure/`. Line numbers are at HEAD.

**Method.** I ran `room_depth.py` again and ran the validator (`--no-graph --skip-ink`). The validator's `-o` render gave the room, console, station and find check (rendered `connections`, `acceptsVms`, `flags`, `hintOnlyFlags`, positions). The Tiled maps `room_m10_hall.json`, `room_m10_forward.json` and `room_m10_core.json` gave the slots that `as-type:` positions land on. I recompiled the two ink files the commits touched (phone, Tesseract) to scratch with `bin/inklecate`. Both match the committed JSON. The VM is a black box: a find is taken to make its flag obtainable at any field console, and B7 is taken at concept level ("flag 1's login no longer gates flag 2"). Of the VM gating documents I read only the handoff (B5 to B7).

**Counts: 0 blockers, 0 majors, 1 minor, 2 nits.** Every R4 finding is resolved (§1). The depth check now passes for all four finds against every field console (§3.2). The minor is one stale observation that B7 left behind, which points the player at the wrong login for flag 2 (m1).

---

## 1. Round-4 findings: status

| Finding | Status | Evidence at HEAD |
|---|---|---|
| M1 (major) flag 2 takeable at the forward post, held through five rooms | **Resolved** via B7 | `release_staging_card`, "Schedule Copy Sign-in Card", in the server hall at (11.3, 3.4) (erb:3680-3692). It sits on the desk run (9.7-12.1, y 2.5-3.7) between the release console slot (10.4, 3.0) and the controls (11.9, 3.0) (room_m10_hall.json). The text interpolates `staging_login_user` / `staging_login_password` (erb:192-193), and nothing else in the ERB or ink does. HaX's hall rung: "The console takes the staging copy. Its sign-in card's on the desk beside it." (phone:146). Guide 2's offer: "…Its sign-in card's on the console desk. Ask." (erb:1646). Depth check in §3.2 |
| m1 (minor) the "The stair's open." mapping the engine couldn't evaluate | **Resolved** | erb:1732-1733 are two `&&`-only mappings (Vance or Elena pull; captured Voltage), both setting `shutter_text_sent`, above the general form at erb:1734. Validator: 0 INVALID |
| n1 (nit) "I'll ring you back" after the one re-ring is spent | **Resolved** | Both replies read "I'll ring when you're at the isolator." (phone:792, 807). HaX's isolator mapping is `cooldown: 0` with no `onceOnly` (erb:1724), so the promise always holds |
| n2 (nit) doc rows behind the build | **Resolved** | CONTRACT:280 has "[Just that one?]". T-28 lists four forms and T-34 carries the duty-sheet sentence (texts:62, 70) |
| n3 (nit) stale `hatch_topic` comments | **Resolved** | phone:575-581 say "kill config" and "duty sheet" |
| n4 (nit) "on his terminal" against a desk position | **Resolved** | Observation "An envelope on the desk beside the host terminal…" (erb:4274). The box topic, the core rung and guide 4 all say "beside his terminal" (phone:133, 604; erb:1648) |
| n5 (nit) the Codes block calls itself a placeholder | **Resolved** for the block, residue in comments (n1 below) | erb:179-185: "Values are final (2026-10-22); the build must seed these exact strings." |

---

## 2. New findings

### m1 (minor). The schedule terminal still says the staging copy is behind the monitoring login

**Evidence.** The staging copy's terminal in the hall, "Release Schedule: Staging Copy", has a default observation (erb:3640) that the player sees before flag 2:

> "The staging copy of the release schedule, behind the monitoring host's login."

That was true under B6. Under B7 it's false: the staging copy has its own account, and flag 1's login "no longer gates flag 2" (handoff B7). The new card doesn't say which host it's for either: "RELEASE SCHEDULE. STAGING COPY. / Login for the staging copy of the release schedule: …" (erb:3688). So the only in-game line that names flag 2's host also names the wrong login. A player who reads the terminal will try the tag's `secmon` login on the staging copy, which is what the line says to do. A player who reads only the card, which sits on the release console next to the release service's duty sheet, may try it against the release host. Both attempts fail on the VM. Guide 2 and HaX's rung should still get the player there, so this is a minor and not a major. The S6 source carries the same sentence (`stage_6/lore_fragments.md:384`).

**Fix** (text only, unvoiced; B7 allows the host at story level: "held on the bunker's monitoring host. (So the game label can say so.)"):
- erb:3640 → "The staging copy of the release schedule, on their monitoring host. It has its own sign-in." Make the same change in lore_fragments.md:384.
- Optional, on the card (erb:3688): name the host in the label, e.g. "Staging copy sign-in (security monitoring): …", so the card is enough without the terminal.

### Nits

- **n1. PLACEHOLDER residue in three `_comment`s.** The tag (erb:2606), the duty sheet (erb:3693) and the core code (erb:4267) still say "PLACEHOLDER (VM) string(s)", and two of them say "PLACEHOLDER position … dressing to confirm". The Codes block now calls the values final, and SD R4 d1-d3 placed the objects. The player never sees these, but a later writer could "replace" good values. Drop the labels.
- **n2. The gate terminal's flag-2 hint can't fire any more.** `'bunker_monitor:flag_2': 'That one goes in at the release console in the server hall.'` is still on the gate terminal (rendered `hintOnlyFlags`). Under B7, flag 2 can only be held from the hall onwards, and the release console is usable from then on. This is noted, not proposed: CONTRACT §11 (PC R4) ruled it stays because it names only the station. It does no harm.

---

## 3. The audit, run again

### 3.1 Headline numbers

| | m01 | m02 | m10 at R4 | m10 now |
|---|---|---|---|---|
| Rooms / empty | 13 / 0 | 13 / 2 | 8 / 0 | 8 / 0 |
| lockType declarations | 12 | 15 | 9 | 9 |
| Max depth | 3 | 7 | 7 (`core`) | 7 |

Connections are unchanged (forward_post → blast_tunnel → security_office → workshop_floor → power_room → server_hall → gallery → core), so depth, BFS positions and door parity can't have moved. Neither commit touched a lock.

Validator: 0 INVALID. The rest is R4's set: two objective-wiring overlap notes, cutscene `onceOnly` advisories, the `gallery` puzzle-graph two-source note (graph only), imported-condition advisories, the lock guard's `item_picked_up:notes` listener (it reads `data.itemId === 'gallery_code_card'`, erb:3838, so the new card can't trip it), and four forward-post NPCs with no behaviour.

### 3.2 The depth check for the finds, against the rendered rooms

Field consoles in the render: `gate_console` (forward post, 0), `hall_console` (server hall, 5), `core_console_vm` (core, 7). All three take the same attack box. Stations: `gate_terminal` (0, flag 1), `release_console` (5, flag 2), `sealed_hatch` (5, flag 3), `core_host_terminal` (7, flag 4). One flag per station holds: each `flags` list carries one flag (rendered).

**Per find:** the consoles the player can use once the find is reachable, the flags the find makes obtainable, and whether each flag's station is usable by then.

| Find (erb) | Room, depth | Consoles usable then | Flag it makes obtainable | Station, depth usable | Hold? |
|---|---|---|---|---|---|
| Maintenance Tag (2605) | forward post, 0 | gate (0) | 1 | Gate Terminal, 0 | No ✅ |
| Schedule Copy Sign-in Card (3680) | server hall, 5 | gate (0), hall (5) | 2 | Release Console, 5 | No ✅ |
| Operator's Duty Sheet (3693) | server hall, 5 | gate (0), hall (5) | 3 | Sealed Section Hatch, 5 | No ✅ |
| Core Access Code (4266) | core, 7 | gate (0), hall (5), core (7) | 4 | Core Host Terminal, 7 | No ✅ |

Taken console by console:
- **Gate console (0).** At depth 0 the only find is the tag, which gives flag 1, submitted in the same room. A player who carries the card, sheet or code back here can take flags 2, 3 or 4, but each of their stations is already open behind them.
- **Hall console (5).** The card, the sheet and the tag are all in hand or behind the player by now. Flags 1, 2 and 3 all have usable stations: the gate terminal behind, the release console and hatch in this room. The core code isn't reachable yet.
- **Core console (7).** Every find is reachable and every station is behind the player or in the room.
- **Gallery (6).** No console, no find.

Nothing reachable holds a find early. The hall has no lock of its own: it's reached only through the power room's card door, so the card, the sheet, the release console and the hatch all become reachable together. The core opens from inside on Victoria's and Vos's routes, but the code is in the core either way. Each login string has one source. Every row is ✅, and for all four flags the find and station are in the same room.

### 3.3 Boss-key table

As R4 §3.3, unchanged. Blast door, inner door, Stair B, the power-room card, the shutter isolator, the gallery stair and the outer lock are ✅. The cupboard and the fitter's locker are ✅ by design (optional). The model terminal is same-room by intent (W7, optional). The four VM finds sit in their stations' rooms by rule (F12). That's the user's choice for VM gating, not a boss-key defect.

### 3.4 Chain depth, capabilities, choices

No change in shape. The card gives the release desk the same look-round step the tag gives the forward post, with no extra walking. The flag-2 steer follows the pattern of the other three: the "[Where are we?]" rung names the find (phone:146, above `server_hall_entered` and below `flag2_submitted`, so it shows exactly while flag 2 is owed), and so does the guide offer. Flags 1, 3 and 4 also have a hub topic. Flag 2 doesn't, and needs none: the rung and the guide text cover the window. HaX isn't jammed in the hall (the jam starts on entering the gallery, erb:1606, and the gallery stair needs flag 2). Nothing reopens a §10 withdrawal.

### 3.5 Bug sweep (skill Step 4)

| Check | Result |
|---|---|
| Conditions the engine can't evaluate | None (validator 0 INVALID) |
| `item_picked_up:` keyed on id | None. Both listeners key on type and test `data.itemId` (erb:1874, 3838) |
| Tasks with no completion route | None. `submit_flag_1-4` can each be completed once their find is held |
| Author notes shown to the player, code-stating observations | None. The finds state logins by design |
| Stale text | **m1** (erb:3640). The rest of the flag-2 text agrees with B7 |
| Stale names | None ("Core Access Code", "duty sheet" and "kill config" are consistent across ERB, ink and comments) |
| Compiled ink | Phone and Tesseract: identical to the committed JSON |
| Dungeon graph | The card is drawn: `server_hall --> schedule_copy_sign_in_card --> release_console` (dungeon_graph.md:233-234) |

---

## 4. For phase 5 (browser only)

New this round:
1. **Card at (11.3, 3.4).** It's visible on the release desk between the release console and the controls, clear of the office chair (9.4-10.4), and can be clicked. It should read as "on the desk beside it" (HaX) and "tucked under the release console's edge" (its observation).
2. **The hall rung.** "[Where are we?]" in the hall before flag 2 names the card. Once flag 2 is in, it moves on to the duty sheet.
3. **Guide 2's offer.** It comes once, 2 s after the first click on the hall's field console, and names the card.
4. **The schedule terminal's observation** after m1's fix, before and after flag 2.

From R4 §4, still to run: the tag at (15.6, 3.4) and the sheet at (15.5, 3.5), each clickable and not covered; the core code at (2.2, 4.8), visible on entry, reading as beside the terminal, and clear of the core field console (which lands by type at 1.5, 6.7); no early code at a gallery save with the lock shut; the stair texts (Vance, Elena, captured Voltage give "The stair's open."; HaX gives "Shutter's dead. The stair's open."; never two texts); "[Give me a minute.]" at steps 0 and 1, then the isolator click rings; the hatch-first route names the duty sheet.

Carried from R3 §4: the "[Where are we?]" rungs naming each find; the three hub steers in their windows; the cold-start Wendell worked-round cut; the escaped Voltage fight; Vance and Elena resuming at step 2 and `cut_done`; captured "[I'll do it.]", a re-talk at step 2 and his bark; a reload at `cut_step` 2; the click guards at steps 0 and 1 on each branch; the workshop rack, card 4 and T-62 at 10 s; Fonoti's cone after the rota, the handover and the Vos pick; exchange 3's Alpha button.

**VM-side, for opus48 or the user (not a browser test):** the tag's login alone can't reach flag 2, the staging login can, and the duty sheet's login can't. Each Codes string (erb:186-193) is what the build creates.

---

## 5. Severity log

| Round | Blocker | Major | Minor | Nit | Outcome |
|---|---|---|---|---|---|
| 2 | 0 | 0 | 3 | 6 | m1-m3, n2-n6 resolved; n1 left by ruling |
| 3 | 0 | 1 | 2 | 3 | All resolved at 588b5ae52 |
| 4 | 0 | 1 | 1 | 5 | All resolved at fb2f51db8 (M1 via B7, the staging sign-in card; m1 the split mapping; n1-n5) |
| 5 (this) | 0 | 0 | 1 (m1) | 2 (n1, n2) | All R4 findings closed. The depth check passes for all four finds at every console, with each find in its station's room. m1 is one stale observation from before B7 (erb:3640) that names the wrong login for flag 2. The nits are comment residue and a hint that can no longer fire (ruled to stay) |

The rounds have converged. R5 found no blocker or major. The one minor is a text fix with no structural change.

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 5 rounds.

**Verdict: phase closes.**
