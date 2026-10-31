# Phase 2 — Puzzle chains: m01 patterns, and m02 measured against them

Status: proposal. Nothing here is implemented except one applied name fix (C6).

**Method, and a correction.** Sources are the `scenario.json.erb` files and the
auto-generated `dungeon_graph.md`. An earlier draft of this document derived Part A from
`m01_first_contact/SOLUTION_GUIDE.md`, which is **stale and wrong in at least five
places** — it still describes a PIN-locked ENTROPY archive (`7331`) that is now flag-locked,
a "Patricia's Safe" that does not exist, and the wrong cipher against the wrong lock. That
draft was reviewed and the errors caught. Everything in Part A below is now cited to the
`.erb`. Do not trust either mission's SOLUTION_GUIDE without checking.

---

## Status: IMPLEMENTED

All three phases are in. What shipped, and the four places implementation departed from the
plan on judgement:

| Item | Status |
|---|---|
| **C10** recovery console | ✅ `compromised` + `etaHours` + optional `outcome*` copy on `backupRecoverySources`; all five `cloud_vendor` sites replaced; `DEFAULT_SOURCES` flagged; sis01 made explicit and re-validated clean. m02's three endings now have authored outcome text |
| **C11** dead event mappings | ✅ all four repointed onto the emitted **type** with a `data.itemId` condition. Both lanyards given an `id` so the payload carries one |
| **C6.1–C6.3** | ✅ both `[LORE:]` blocks and both `LORE Fragment:` observation labels removed; Kim's safe no longer states its own PIN and has an `id`; the phantom task no longer completes itself |
| **C3** insider thread | ✅ `unmask_identify` added to `requiresCompleted` |
| **C12** offline keys | ⚠️ **option 2 only — see below** |
| **C9a** Gary's lanyard | ✅ `lanyard_grudging` is now a refusal; askable again at influence ≥ 15 |
| **C2** decode tool | ✅ CyberChef `takeable: true`, relocated to the Handover Room; the ROT13 note **reattributed to Ghost** rather than cut — see below |
| **C1** Night Handover Room | ✅ new `room_hospital_staff` template generated and registered; three landings deleted; **four** connections rewritten; overlap check passes |
| **C7** PIN cracker | ✅ `entropy_field_case` moved to the Server Room |
| **C4** safe hint | ✅ moved to `estates_audit_snag_list` in the new room; Kim's diary line replaced |
| **F1–F6** dialogue | ✅ Kim's escrow admission added; Ghost reacts to the cracker; four stale direction lines fixed |
| **C8** `ward_vestibule` | ❌ **not done** — deliberately left; see below |

### Four judgement calls that departed from the plan

**1. C12 option 1 was dropped; only option 2 shipped.** Adding `crack_safe_pin` to
`requiresCompleted` would have forced safe-cracking *even on the ransom path*, which is
narratively odd and removes player agency. Option 2 alone — the console refusing
`offline_keys_only` and `combined_recovery` without `offline_keys_recovered` — produces the
better architecture: **the safe buys the right to refuse the ransom.** Paying remains
available to a player who did none of the work, which is correct. That is the dilemma, and
it is now real rather than decorative.

**2. The ROT13 note was reattributed, not cut.** Cutting it would have left a portable
decoder with nothing to decode. Instead it is now **Ghost's own site note**, taped inside
the rack they staged from — an operator obfuscating their own crib, which is a motive a
hospital never had. Both giveaway strings are gone and the observation describes the
*shape* of the text (m01's convention) so identifying the cipher is the puzzle. It now
carries real information: the 4-hour combined-recovery figure, and Ghost's assumption that
nobody here will work it out in time.

**3. Gary keeps a takeable lanyard.** The plan implied removing it. The validator correctly
refused — he cannot `#give_item` what he does not hold — and the mission's design is four
routes to Gary: *rapport, leverage, theft, force*. Theft and force getting the lanyard is
intended. What the refusal removes is the **free** route.

**4. C8 not done.** `ward_vestibule` is the one deletion that genuinely moves the ward's
door parity, and it buys one empty room. The mission is in a good state; this is not worth
spending that risk on now. Left as a standalone future change with its own validator run.

### Verification

- `compile-ink.sh`: 15 files, **0 failed**
- `loopcheck.js`: every ink file passes at `start`, **and** every NPC's declared
  `currentKnot` passes — 200 steps × 6 strategies
- `validate_scenario.rb`: **0 errors, 0 INVALID**. Warning count matches the pre-existing
  baseline except one new disjointness warning on the two `item_picked_up:id_badge`
  handlers, which is a false positive — their `data.itemId` conditions are disjoint and the
  validator does not evaluate payload conditions
- Room geometry: **no world-space overlaps** (13 rooms)
- `sis01_healthcare`: re-validated, 0 errors — the engine change is backwards compatible

### Resulting shape

```
13 rooms (was 15) · 2 empty (was 5) · staff_room at depth 6
Boardroom keypad seen at 6, code from Kim at 7  → boss-key loop, new
PIN safe seen at 4, cracker now at 7            → the code must be deduced
CyberChef at 6, encoded material from depth 0   → tool after lock, not before
```

---

## Summary — what to do, in order

Ordering corrected in round 4: C1 now precedes the two items that place objects in the room
it creates, and C12's cost is split, because only half of it is a one-line change.

**Phase 1 — bugs. Ship regardless of what happens to the rest of this plan.**

| | Change | Cost | Why |
|---|---|---|---|
| **1** | **C10** — recovery console renders another scenario's failure screen | engine, 5 sites | **Every m02 ending prints "RESTORE FAILED — SOURCE COMPROMISED"** |
| **2** | **C11** — four `item_picked_up:<id>` mappings that never fire | small | Engine emits `:<type>`. One objective is uncompletable; **one is how the player meets Ghost** |
| **3** | **C6.1–C6.3** — `[LORE:]` notes (in `text` *and* `observations`), Kim's safe stating its own PIN, phantom task | 15 min | Player-visible; m01 has zero of these |

**Phase 2 — make the mission's own choices matter. Two lines in one array.**

| | Change | Cost | Why |
|---|---|---|---|
| **4** | **C12 option 1** — `crack_safe_pin` → `requiresCompleted` | one line | The offline-keys safe is optional today (B7) |
| **5** | **C3** — `unmask_identify` → `requiresCompleted` | one line | The insider thread is skippable today (B0). Verified soft-lock-free |
| **6** | **C12 option 2** — console honours its own prerequisite | engine, same file as C10 | Makes the safe *buy the right to refuse the ransom*. This is the moral architecture |

**Phase 3 — structure.**

| | Change | Cost | Why |
|---|---|---|---|
| **7** | **C9a** — gate or cut Gary's `the_lanyard` dialogue option | ink | The cover burn currently undoes itself in the same room. Needs C11 |
| **8** | **C2a** — strip the ROT13 giveaways, add `id`/`onRead`, repoint `decode_ransomware_note`, `takeable: true` | small | Closes B2/B3 without inventing a chain |
| **9** | **C1** — three hallways → Night Handover Room | new room, **4** connection rewrites, validator run | Kills 3 empty rooms; genuine Boardroom loop. Verified overlap-free |
| **10** | **C2b / C9b** — place CyberChef and any spare lanyard in the new room | small | **Both need C1** |
| **11** | **C7** — `entropy_field_case` → Server Room | one object | Earns the PIN cracker. **Needs C12** |
| **12** | **C4** — safe hint → snag list | one object move | Longest boss-key loop. **Needs C1 + C12** |
| **13** | **F1–F6** — dialogue, incl. two already-stale direction lines | ink pass | `:792` is wrong *today* |
| **14** | **C8** — delete `ward_vestibule` *(optional, separate validator run)* | risky | The one place door parity genuinely moves |

❌ **Dropped:** C5 (pin the rota — contradicts the rota's own text) · the depth-3 records
trolley · the original C3 (`aimsCompleted`) · the original C2 (invented decode chain) · the
original C9 (moving the lanyard object).

## Part A — m01's puzzle-chain patterns

### Headline numbers

| | m01 | m02 |
|---|---|---|
| Rooms | 13 | 15 |
| Physical locks | 13 | 30 |
| AND-gate convergences *(as drawn — see P6)* | 3 | 0 |
| Puzzle graph nodes / edges | 50 / 61 | 97 / 112 |
| VM flag challenges | 3 | 4 |
| **Critical path (hops through story aims)** | **9** | **4** |

That last row was missing from earlier drafts and is the strongest single piece of evidence
for B0: m02 declares eight story aims and requires a four-hop path through them.

Verified against `m01/dungeon_graph.md:13-19` and `m02/dungeon_graph.md:13-19`.

### P1 — Chain depth, and the depth is *earned*

m01's longest run, corrected:

```
Sarah → Main Office Key → Main Office → Maintenance Checklist → PIN 2468
      → IT Room → Kevin → Lock Pick Kit → Patricia's Briefcase
      → CyberChef + Derek's Office Key → Derek's Office
      → Encoded Note (2) [ROT13] → 0419 → Derek's Filing Cabinet → notes4
```

No two consecutive links are the same *kind* of step: fetch, read, infer, talk, pick,
decode. The player never does "pick up thing, use thing" twice in a row.

### P2 — A key is a piece of knowledge, not a piece of luggage

m01's four gating codes, cited:

| Lock | Code | Source | Tier |
|---|---|---|---|
| IT Room door | 2468 | Maintenance Checklist writes it out | direct |
| Main Filing Cabinet | 2024 | Sticky note, "election year" | inferential |
| Derek's Personal Safe | **0319** | "Safe combo — my birthday (19th March)" (`:1797`) | inferential |
| Derek's Storage Safe | **1337** | **Base64** note, decoded at CyberChef (`:1818-1821`) | decode |
| Derek's Computer + Cabinet | **0419** | **ROT13** note → "anniversary" → Anniversary Card, "April 19th circled inside" (`:1830-1833`, `:1349-1355`) | decode + inferential |
| ENTROPY Archive | — | **`"lockType": "flag"`, `"requires": "shatter_server:flag_1"`** (`:1958-1963`) | earned |

### P3 — The boss-key loop: see the lock first, hunt, come back

**The load-bearing pattern, and the one to design against from here on.** A puzzle is good
when its parts are in *different rooms*, and it is best when the player **meets the lock
before they can open it**. Three beats:

1. **Encounter.** The player finds the lock, tries it, fails. The failure is informative —
   they now know what kind of thing they are looking for.
2. **Hunt.** The pieces are elsewhere, ideally in more than one elsewhere.
3. **Return.** The walk back is the payoff. The player is carrying an answer to a question
   they already asked.

Key-before-lock inverts this: the player picks something up, doesn't know why, and later
walks into a door that opens itself. Same graph, no tension. Clue-and-lock-in-one-room
collapses all three beats into one and is the weakest form.

m01 gets this mostly right by accident of layout: Derek's Office and its cabinet are behind
a door you meet in Act 1 and cannot open until Act 2.

### P3-bis — Capabilities are earned across missions, and a capability needs a "before"

An earlier draft of this document treated m02's start-inventory lockpicks as a regression
from m01, where the picks are earned from Kevin. **That framing was wrong**, and correcting
it produces the more useful pattern.

The picks are not m02's puzzle; they are **m01's reward, banked**. The player earned them
by finishing the previous mission, and being able to walk up to a door and simply open it
is what that reward is *for*. A capability that carries between missions should feel like
power, not like a lock being re-litigated. So m02's four open-on-sight pick locks are
correct, and the audit below marks them as such rather than as failures.

The real pattern is one rung up:

> **Each mission grants one new class of key. For the grant to feel like anything, the
> player must first have felt its absence.**

m01 grants **lockpicks** — and it earns them properly: you meet `patricia_briefcase`, which
has *"No key available - would need to pick the lock"* (`m01:1556`), before Kevin will hand
anything over. You feel the wall, then you get the tool that removes it.

m02 grants the **PIN cracker**, which is a genuine capability and not just an item: it is
checked from inventory (`minigame-starters.js:500-503`) and enables the info-leak toggle on
**every** PIN minigame in the mission — `emergency_storage_safe`, `dr_kim_s_safe` and the
`conference_room` door alike. It is the mission's equivalent of the picks.

**And m02 currently gives it away before the player has ever needed a code.**
`entropy_field_case` (lockpick, holds the cracker) and `emergency_storage_safe`
(PIN 1987) are in the *same room at depth 4*, and the picks are already in the player's
bag. The available sequence is: walk into Emergency Storage, pick the case, crack the safe
next to it. Meanwhile the hint that the code *is* the founding year sits at depth 6 — two
rooms past the point at which it stopped mattering. **A player can complete m02 without
ever solving a PIN by knowing the code**, so the capability arrives with nothing to
contrast against and reads as a free pass rather than a promotion. See C7.

### P4 — Two sentimental dates, deliberately confusable

This is subtler than the earlier draft claimed, and better. Derek's **birthday is 19 March
→ 0319** (personal safe). His **anniversary is 19 April → 0419** (computer and cabinet).
Same day-of-month, one month apart. The ROT13 note says only "anniversary. You know the
date" — so the player must have found the Anniversary Card *and* kept the two dates
straight. The reuse is not laziness and it is not a single date sprayed across two locks;
it is a near-miss that punishes skim-reading.

### P5 — Routes are narrower than they look

The earlier draft claimed "two routes to every hard gate". Not true of m01. Derek's office
can be picked, and its key is inside `patricia_briefcase`, which is `"lockType": "key"` with
`"No key available - would need to pick the lock"` (`:1556`). **Both routes run through
Kevin's lockpick.** m01's start inventory is a phone and nothing else (`:481-490`).

### P6 — m01's AND gates are documentation, not mechanism

**This is the most important correction in the document.** m01 encodes its convergences as
`"puzzle_graph_and_with": "cyberchef_workstation"` (`:1819`, `:1831`).
`scripts/generate_dungeon_graph.rb:255-283` renders those into `andgate1`/`andgate2` on the
diagram. `scripts/validate_scenario.rb:342-343` merely tolerates the key. **Nothing under
`public/break_escape/js/` reads any `puzzle_graph_*` key — grep returns zero hits.**

The actual lock is `"requires": "1337"` on a keypad. A player who knows 1337 opens it with
no CyberChef anywhere near. So m01 has **no engine-enforced puzzle AND gates**. The third
one in the statistics is a different mechanism: `unlockCondition.aimsCompleted` on a story
aim, which *is* real and *is* evaluated (`objectives-manager.js:684-690`).

### P6-bis — The real convergence in m01 is one item gating four things

m01 is a braid because **Kevin's Lock Pick Kit** gates: Patricia's briefcase → Derek's
Office Key, and → CyberChef, and through CyberChef both encoded-note chains, and Derek's
door directly. One acquisition, four downstream consequences, all engine-real.

m02 already has this idea in *better* form: the `pin_cracker` sits inside the lockpick-only
`entropy_field_case` (`m02:2005-2018`) — an ENTROPY tool you must pick open to turn on
ENTROPY's own target. m02's problem is that it does this **once**.

### P7 — Hints staged in rising tiers
Direct (checklist) → inferential (birthday, election year) → decode (Base64, ROT13) →
earned (VM flag). Difficulty rises as the chain lengthens.

### P8 — Redundant hint sourcing
The IT Room PIN has three independent sources: Maintenance Checklist, Maintenance Log
Backup (optional), Out of Office Note (optional).

### P9 — Optional branches pay in routes and foreknowledge, never in critical path
All four dashed-optional nodes in m01's graph are alternate sources for things obtainable
elsewhere.

### P10 — Parallel unlock kills the bottleneck
Entering Derek's Office unlocks Phase 3 **and** Phase 4 at once.

### P11 — The technical chain gates physical loot
**One** flag (`flag_1`) opens the ENTROPY archive, not three.

### P12 — The moral choice sits on a document, not a menu
The CONTINGENCY file is readable-but-not-takeable and triggers the framing dilemma.

---

## Part B — m02 against that list

### Where m02 already beats m01

- **P5 — decisively.** m02 ships the Lock Pick Kit in `startItemsInInventory`
  (`m02:492-497`). m01 gates its entire tier-3 class behind a single NPC handover. m02's
  routes are genuinely plural where m01's only look it.
- **P11 — deeper.** Four strictly sequential VM stages (SSH → ProFTPD → database → Ghost's
  log), terminal flag opening the `entropy_staging_cache`.
- **P10 — stronger.** After `cover_compromised` the aim graph forks three ways.
- **P8 — stronger.** Three sources for 1987: founding plaque, nurse's note, Kim's diary.
- **P9 — one excellent example.** The `pin_cracker` in the sealed case (see P6-bis).

### Where m02 falls short

**B0. The entire insider thread is skippable — the most serious live defect found.**
`identify_inside_asset` unlocks on `{ "aimCompleted": "exploit_entropy_backdoor" }` alone
(`m02:389`). Nothing requires `unmask_inside_asset` to have happened. A player who drives the
VM chain can be handed "Put A Name To The Badge" without ever having gathered a scrap of the
people-side evidence the aim is *about*. One-line fix in C3.

**B1. The insider aim has no physical prerequisites.** `unmask_gather_evidence` and
`unmask_db_window` (`m02:371,377`) are both typed `manual`. So is `unmask_identify`
(`m02:403`, under `identify_inside_asset`). The people-work and the Linux-work never have
to meet. *Note the diagnosis, not the earlier prescription: "add AND gates" was the wrong
fix, because AND gates are not a mechanic. See C3.*

**B2. The decode tool has no job — but the fix is not to invent one.** m02's Base64 ransom
note and ROT13 recovery text gate nothing, and both real codes are tier-1 direct:
`emergency_storage_safe`/`dr_kim_s_safe` (1987, plaque + diary), `conference_room` (0417,
written in the diary *and* spoken by Kim).

*An earlier draft proposed manufacturing a Base64→PIN chain because m01 has one. That was
cargo-culting and it is withdrawn.* m02's "earned knowledge" gate is the four-stage VM chain,
which is **deeper and better motivated than anything m01 does** — and the decode work already
has a legitimate home there: `secgen/m02_ransomed_trust.xml:38` lists *"Decode Ghost's
obfuscated operational files"* as an objective. An operator obfuscating their own logs has a
real motive. A hospital keypad hiding its code in Base64 does not. See C2.

**B2-bis. m02 already ships the anti-pattern this document argues against.**
`recovery_instructions_encoded` (`m02:87`) is the hospital's own recovery procedure, in
**ROT13**, sitting in the server room. Nobody ROT13s their own disaster-recovery
instructions. It is a puzzle box in a hospital, and the plan should hold itself to the
standard it is setting for everything else. Give it a motive or cut the encoding — options
in C2.

**B3. The decode tool is behind the hardest gate.** `cyberchef_workstation` is in the
Server Room and is `"takeable": false` (`m02:1818-1824`). m01's is `"takeable": true` —
*"A laptop preloaded with CyberChef … Take it."* (`m01:1577-1582`). This is the structural
reason B2 is true, and it is a one-word fix.

**B3-bis. The boss-key audit.** Room depths by breadth-first walk from `reception_lobby`
(the order the engine places rooms, `core/rooms.js:1545-1560`):

```
0 reception_lobby   3 hospital_ward       5 office_corridor    7 dr_kim_office, server_room,
1 ward_vestibule    4 emergency_storage   6 office_hall_mid,     office_hall_east/west
2 ward_approach     4 ward_hall             security_office    8 conference_room, it_department
```

Against that, every significant lock:

| Lock | Lock seen | Key/code found | Verdict |
|---|---|---|---|
| `entropy_staging_cache` (flag) | 7 | 4th VM flag | ✅ **best in the mission** — see the sealed rack container, do the entire Linux chain, return |
| `server_room` (RFID) | 7 | Gary, depth 8 | ✅ see the door, go *deeper* to find the man with the card, come back |
| `emergency_storage_safe` (1987) | **4** | plaque 0, nurse note 2, Kim's diary 7 | ⚠️ split — the diary is a true return loop, the earlier two are signposts |
| `conference_room` (0417) | 7 | Kim 7, diary 7 | ⚠️ marginal, same depth |
| `it_department` (key) | 7 | Bernie, depth **0** | ⚠️ key-before-lock by seven rooms — saved only by Bernie refusing at first |
| `dr_kim_s_safe` (1987) | 7 | diary, **same desk** | ❌ all three beats in one room |
| `gary_workstation` (password) | 8 | sticky note, **same room** | ❌ same room (though the lock is redundant — Gary gives the credentials in dialogue too) |
| `it_filing_cabinet`, `entropy_field_case` (pick) | 8, 4 | start inventory | ✅ *by design* — m01's earned reward, banked; see P3-bis |

So m02's *technical* spine is beautifully boss-keyed and its *physical* puzzles are not.
The two best locks in the mission are the two the player cannot open for the longest.

**One fact the table cannot show, and it is the headline one:** `emergency_storage_safe` —
the best-ordered physical lock here — **is optional** (B7). Depth ordering is worth nothing
on a lock the player can walk past.

**B4. Clue and lock share a room.** `dr_kim_s_safe` is opened by a PIN in the diary on the
desk in front of it. `gary_workstation` by a sticky note on Gary's own desk. The honourable
exception — plaque in Reception, safe at the far end of Ward 3 — is the mission's most
satisfying physical puzzle for exactly that reason.

**B5. Three empty hallways.** `office_hall_west`, `office_hall_mid`, `office_hall_east` are
`room_hospital_hall` templates with `"npcs": []` and `"objects": []`, in a row directly
north of a 20×6 corridor. Two stacked corridors; six of fifteen rooms are corridor.

**B7. The offline-keys safe — and the whole `recover_offline_keys` aim — is optional.**
`restore_hospital_systems.requiresCompleted` (`:448-456`) does not name `crack_safe_pin`.
And the recovery console does **not** gate `offline_keys_only` or `combined_recovery` on
`offline_keys_recovered` — the bullet *"Prerequisite: Offline backup keys must be recovered
from PIN safe first"* (`:1868`) is decoration. A player can choose Combined Recovery having
never opened the safe.

This is B0's defect class on a bigger object, and it invalidates a claim C7 made: *"any
player who refuses the ransom needs the offline keys"* is **false as the mission stands**.
C4 and C7 are both investments in a lock that nothing requires. Fix in C12.

**B8. The recovery console renders another scenario's outcome.**
`backup-recovery-minigame.js:210`:

```js
const isCompromised = source.id !== 'cloud_vendor';
```

m02's three sources are `ransom_payment`, `offline_keys_only`, `combined_recovery`
(`:1838,1855,1872`). **None is `cloud_vendor`** — that id belongs to `sis01_healthcare`, the
only scenario in the repo that uses it. So every choice an m02 player can make is flagged
compromised, and the screen that lands immediately after they decide whether to fund a
ransomware crew reads *"RESTORE FAILED — SOURCE COMPROMISED / Reinfection risk: active."*

The tile list is correct, so the *choice* looks right and only the *outcome* is wrong.
Nothing downstream mis-branches (m02 never reads `backup_reinfected`) and
`initiate_backup_recovery` still completes, so it is not a soft-lock — it is worse than a
soft-lock in one specific way: it is the last thing the player sees. Fix in C10.

**B9. Three event mappings can never fire.** The engine emits `item_picked_up:${type}`
(`inventory.js:595`, `interactions.js:1436`, `container-minigame.js:496`), and the
dispatcher matches exactly with only a trailing-`*` wildcard (`npc-events.js:45-58`). These
three key on item *id*:

- `:806` `item_picked_up:contractor_lanyard` → `cover_restored` *(type is `id_badge`)*
- `:814` `item_picked_up:bank_staff_lanyard` → `cover_restored` *(type is `id_badge`)*
- `:959` `item_picked_up:gary_vindication_email` → `completeTask: investigate_gary_office`
  *(type is `notes`)*

Both lanyards still restore cover through their ink `#set_global` tags, so the damage is
limited to players who **take** an item rather than being given it. But
`investigate_gary_office` (`:275`) has **no other completion route** — a visible objective
that can never be ticked. Fix in C11.

**B6. Loose ends.**
- ~~MARCUS WEBB in the end credits~~ — **fixed**, `scenario.json.erb:169-170`.
- ~~`ProFTPD CVE-2010-4652` in learner-facing metadata~~ — **fixed**; see C6.
- ~~`M. Whitlock` in three places~~ — **fixed** (`m02:1660,2097,2134`). Same rename residue
  as MARCUS WEBB: the character is **Gary** Whitlock, and Kim's own signed statement called
  him "M. Whitlock" two lines above calling him "Mr Whitlock". Now `G. Whitlock`.

---

## Part C — Proposed changes

Story-first test applied to each: *would this object exist, in this state, in a hospital at
04:00 if nobody had designed a puzzle?*

### C0 — The organising idea: the one room that still works

Everything is behind a ransom screen. The new room is **the last functioning room in
St. Catherine's** — a paper handover board and human beings. Thematically right for a
mission about what survives when the systems die.

### C1 — Replace the three hallways with the **Night Handover Room** ✅ *keep*

**Delete:** `office_hall_west`, `office_hall_mid`, `office_hall_east`.
**Add:** `staff_room`, `door_sign` "Night Handover", 10×10.

```
"connections": {
  "south": "office_corridor",  "north": "dr_kim_office",
  "west":  "conference_room",  "east":  "it_department"
}
```

Four connections are supported (`doors.js:313-347`, `rooms.js:1607-1620`). Also required,
and missed in the earlier draft: **all three neighbours need their own `connections`
rewritten** — `conference_room:2202` south→east, `it_department:1557` south→west,
`dr_kim_office:2060` south→staff_room — **and a fourth, missed in earlier drafts:**
`office_corridor:2477-2480` has `"north": "office_hall_mid"`, pointing at a room C1 deletes.
The scenario declares both sides of every door, so `office_corridor.north → staff_room` is
required, not optional. Changing a door's side moves the keypad/lockpick
door sprite.

*Story logic:* a regional hospital's executive floor has a staff room, and it is where the
night shift would be between rounds. It is also the mission's first **social** space —
every other m02 room is somebody's office.

***Boss-key dividend — the reason C1 is structural and not cosmetic.*** Today the Boardroom
hangs off its own dead-end landing, so the player meets its keypad at depth 7 having already
met Kim at depth 7 — no loop. After C1 the Handover Room sits at **depth 6**, with the
Boardroom door due west and Kim's office due north. The player now walks in, **sees a locked
keypad they cannot open**, carries on north to Kim at depth 7, gets 0417, and comes back
west. That is the three-beat loop, created for free by the geometry, on a lock that
currently has none.

### C2 — Give the decode tool a job it can honestly hold ⚠️ *rewritten three times*

**Withdrawn (draft 1):** Gary-printout / Base64-`auth_blob` / reused seal code.
**Withdrawn (draft 2):** "build a motivated decode chain later" — no such source exists at a
useful depth, and inventing one was the exact failure draft 1 was rejected for.
**Withdrawn (draft 3):** "cut the ROT13". Review round 2 showed that would leave the mission
with a portable decoder and **nothing whatsoever to decode**.

**The fact that settles it: m02's Base64 ransom note does not exist.**

```
scenario.json.erb:71   def base64_encode(text)     # defined, never called
scenario.json.erb:80   ransomware_note = "YOUR PATIENT RECORDS ARE ENCRYPTED..."  # never interpolated
```

Both are dead code. Every earlier draft of this document cited that note as evidence, and it
was never in the mission. Worse, there is a task called **`decode_ransomware_note`**
(`:262`) whose completion fires on `decoded_ransomware_note`, which is set by *reading a
`ransomware_display` terminal* (`:1166`, `:1613`, `:2424`) — a minigame, not encoded text.
**The mission has a task named for decoding that involves no decoding**, and C2.1's previous
justification ("two acts looking at text they cannot read") was false: they are looking at a
minigame.

So the single genuine decode artefact is `recovery_instructions_encoded` (`:1916`) — and it
gives itself away twice:

```
"text": "<%= recovery_instructions_encoded %>\n\n(ROT13 encoded -- use the CyberChef workstation to decode)"
"observations": "Encoded note taped to the server rack -- ROT13 cipher"
```

Compare m01, which this document holds up as the model: *"the text looks like encoded
gibberish. Base64, maybe?"* (`m01:1819`) and *"letters are wrong but word lengths look
normal. ROT13?"* (`m01:1831`). **m01 makes identifying the cipher the puzzle.** m02 names
the cipher twice and names the tool. It also has no `id`, so its `puzzle_graph_role: "clue"`
draws no edges, and no `onRead`, so decoding it sets nothing and completes nothing.

**What to do — four small moves, no new chain:**

1. **Keep the ROT13. Delete both giveaways.** Replace with an m01-style observation that
   describes the *shape* of the text and lets the player name the cipher. This is the single
   highest-value edit in C2 and it costs two strings.
2. **Give it an `id` and an `onRead`** so decoding it is a graph node and can complete
   something.
3. **Repoint or rename `decode_ransomware_note`.** Either wire it to the ROT13 note (so the
   task named for decoding requires decoding) or rename it to what it does — read a ransom
   screen and identify the adversary. Do not leave it as is.
4. **`cyberchef_workstation` → `takeable: true`** (`:1818`, currently `false`; m01's is
   `true` — *"A laptop preloaded with CyberChef … Take it."*, `m01:1577-1582`) and move it
   to the **Handover Room at depth 6**, out from behind the RFID gate at depth 7. Not
   Reception or IT: depth 0 would hand the player a decoder before anything needed
   decoding, which is key-before-lock (P3). With C7 also moving the field case into the
   server room, the player now has a *reason* to be carrying the decoder deeper.

**Two things checked and deliberately left alone.** `entropy_asset_tag` (`:2026-2036`) is
plaintext and its power is that it reads as immediate, unambiguous proof.
`password_sticky_note` (`:1668-1677`) is Gary documenting *the organisation's* weak shared
credentials — self-aware and in voice, not a contradiction. Encoding either makes the
mission worse.

### C3 — Make the insider thread mandatory ⚠️ *replaced; the previous C3 did not work*

The previous proposal — gate `identify_inside_asset` on
`aimsCompleted: [exploit_entropy_backdoor, unmask_inside_asset]` — **does not fix B0**, and
is close to a no-op:

- The mission-conclusion gate `restore_hospital_systems.requiresCompleted` (`:448-456`)
  contains **no `unmask_*` task at all**. The thread is optional before and after that
  change. It alters when an aim card appears, not what the player must do.
- Both `unmask_inside_asset` tasks auto-complete from eventMappings: `unmask_db_window` on
  `submit_database_flag` (`:929`) and `unmask_gather_evidence` on `insider_evidence_partial`
  (`:914`). Flag 3 precedes flag 4, so the gate is usually already satisfied when tested.
- For the player who never opens the optional sealed case, it would **hide** "Put A Name To
  The Badge" — removing the pointer to the conference-room post log (`:2296`), the other
  route to `insider_identified`. That is the opposite of the intent.

**Do this instead:** add `unmask_identify` to `restore_hospital_systems.requiresCompleted`.
One line, engine-enforced, actually makes the thread mandatory.

**And drop the "retype `unmask_identify` from `manual`" bullet.** Two eventMappings at
`:944-957` already complete it from either ordering of `insider_badge_id_found` ×
`inspected_asset_post`. Retyping breaks both.

**Verified soft-lock-free (round 3).** `unmask_identify` completes only via the two
mappings at `:942-957` — an AND of `insider_badge_id_found` (← `submit_ghost_log_flag`,
already required) × `inspected_asset_post` (← `onRead` on the Night Security Post Log,
`:2296`, a plain room object in the Boardroom with no NPC dependency). KO-ing, escaping or
losing Reeves leaves the log readable; `night_security_supervisor_ko` (`:2231`) has no
`taskOnKO` and does not touch it. The player enters that room anyway, because
`decide_hospital_exposure` is already required and its only terminal is there.

**One thing to decide consciously.** The ambush is deliberate authorial cover for B0 —
`ink/m02_npc_asset.ink:10-12`: *"If the player never identifies him, he ambushes at the
press terminal instead, so the thread always resolves."* C3 overrides that intent. That is a
defensible call — an ambush that fires because you did no work is not a resolution — but it
is a call, and B0 should stop framing the gap as an oversight.

*(Pre-existing and unrelated: the ambush mapping at `:2235-2241` has no KO guard, so a player
who flattens Reeves and then transmits is ambushed by a man on the floor.)*

*Correction: B0's line reference is `:394`, not `:389`.*

### C4 — Move the safe hint out of Kim's own office ✅ *keep*

Diary keeps the boardroom line (0417). The "emergency store safe still on the founding
year — flag at audit" line moves to `estates_audit_snag_list`, pinned in the Handover Room.

*Story logic:* that sentence reads as an audit finding, and snag lists get pinned up for
the staff who must act on them. Kim's diary was always the copy.

*Correction from review round 2:* earlier drafts said "three sources for 1987 are
preserved". There are already **four or five** — the plaque (`:~520`), the nurse's note
(`:2569`), Doyle in dialogue (*"it's the year this place was founded — it's on the plaque in
the lobby"*, `ink/m02_npc_ward_nurse.ink:209`), the snag list once it exists, and arguably
`Hospital1987` on Gary's sticky note (`:1672`). Removing the diary line leaves four. **The
redundancy this document keeps invoking to justify gating is already generous to the point
of being a tell** — worth thinning rather than adding to.

***Boss-key:*** this is the longest loop the map can produce. The player meets the PIN safe
at **depth 4** and cannot open it. They learn *"still on the founding year"* at **depth 6**.
The founding year itself is on the plaque they walked past at **depth 0**. Then they walk
all the way back to depth 4. Encounter, hunt, return — across the entire hospital.
`dr_kim_s_safe` at depth 7 becomes key-before-lock as a side effect — but it does not
"become" anything until C6.2 lands, because **its observation text states its own PIN**:
*"Executive safe behind a framed certificate -- same PIN as the emergency storage"*
(`:2171`). It solves itself on sight today. It also has **no `id`**, so it is not a
puzzle-graph node and the `estates_audit_snag_list → dr_kim_s_safe` edge in Part D cannot be
drawn until one is added.

### C5 — Do **not** pin the night rota here ❌ *dropped*

The earlier draft wanted Reeves's name on a board the player passes five times. **The
rota's entire point is that his name is not on it** — `m02:2450-2457` is five lines of
`V. OKONKWO` and then, in biro, *"Still no G. REEVES on this. Asked Estates 14/06, 02/07,
19/07. Told to leave it."* `puzzle_graph_reveals: reeves_is_on_no_rota…`. The badge→post
mapping comes from Val and Bernie in dialogue, not from the rota.

Populate the room with the whiteboard and the snag list. If a body is wanted, extend Val's
existing patrol (`npc-behavior.js:320-321` supports `patrol.multiRoom`) — but note she has
`los.enabled` (`m02:2349`), so routing her through the room where the player stands and
decodes puts the cover-burn mechanic on top of the new puzzle. Probably don't.

### C6 — Loose ends and five-minute wins

**C6.1 — Delete the player-visible author notes, and sweep `observations` too.** Two objects
ship editorial brackets inside text the player reads: `:1729` (CryptoSecure testimonial) and
`:2178` (the ZDS invoice) both end with `[LORE: …]` paragraphs explaining their own
significance. m01 has **zero**. *Round 3 correction:* the same object's `observations` line
(`:2179`) also opens *"LORE Fragment: …"*, and `ghost_manifesto`'s neighbour at `:1947` is
pure authorial gloss on a `gameDisplay` line. Sweeping only `text` fixes two thirds of the
finding. This is more visibly wrong to a player than anything else in this document, and it
is also a Phase 1 violation — a line whose only job is to explain.

**C6.2 — `dr_kim_s_safe`: stop it giving away its PIN, and give it an `id`.** See C4.

**C6.3 — `regain_freedom_of_movement` is a phantom task.** It completes off
`objective_task_completed:access_server_room` (`:820-824`) — the very thing it is meant to
be a prerequisite for. It cannot fail and cannot gate. Either wire it to
`cover_restored` or delete it.

**C6.4 — the rest**
- ~~MARCUS WEBB → Gary Whitlock~~ — **done**.
- Rewrite the Ward Board directory (`m02:2489` names all three landings) and the three
  `door_sign`s in the deleted block.
- ~~Fix the CVE id~~ — **done**, in four places. `CVE-2010-4652` described a mod_sql heap
  overflow, not this. The 1.3.3c incident was a **backdoor planted in the source tarball**
  and carries **no CVE at all** — a CVE describes a defect in the software; this was a
  compromise of the distribution. Now cited as `OSVDB-69562` with the Metasploit module
  `exploit/unix/ftp/proftpd_133c_backdoor`. Fixed in `mission.json:16` and
  `secgen/m02_ransomed_trust.xml:37,167,286`; the invented `CVSS Score: 10.0` went with it.

### C7 — Earn the PIN cracker by moving one object ⚠️ *records trolley dropped*

**Withdrawn:** the `ward_records_trolley` at depth 3. Review round 2 killed it on its own
premise — it was specified as optional content, and *an absence the player can decline to
feel is not an absence*. It also created a circular dependency:
`README_ink_best_practices.md:391-403` uses **Sister Doyle** as its worked example of a safe
consequence gate, and says it is safe *"only because … a brute-force fallback device
exists"*. Gating the acquisition of that device behind the same NPC inverts the reasoning
the house style doc rests on. And it never answered its own two questions: what the trolley's
code was (1987 would have killed C4's loop; anything else broke the KO fallback, since the
nurse's note gives no number, `:2569`).

**The replacement is one object move and nothing else.**

Move `entropy_field_case` — which holds the PIN cracker — from **Emergency Storage (depth
4)** to the **Server Room (depth 7)**.

Verified facts it rests on:
- The cracker is a **global capability**: `minigame-starters.js:500-503` scans inventory for
  `scenarioData.type === 'pin-cracker'` and passes `hasPinCracker` into every
  `startPinMinigame`. It applies to all three PIN locks (`:1980`, `:2170`, `:2198`).
- `entropy_field_case` is `lockType: "key"` + `keyPins` (`:2005-2006`) — a pick minigame —
  and the Lock Pick Kit is in `startItemsInInventory` (`:492-497`). Every room from
  Reception to Emergency Storage is unlocked. **Today, minute one, you can walk to depth 4
  and take the cracker before needing a single code.**

What the move produces:

```
depth 4   Emergency Storage. PIN safe. No cracker. You must find 1987.
          → four sources already exist: plaque (0), Doyle (3), nurse's note (2), snag list (6)
depth 7   Server Room. Pick the sealed case. PIN cracker.
depth 7   Dr Kim's safe   — reward lands
depth 8   Boardroom keypad — reward lands again (NOT a redundant route in: see below)
```

*Precision the brief is worth keeping:* the cracker does not open anything. It turns the
keypad into Mastermind — `maxAttempts: 3` — and the player still types guesses. What they
skip is ever having to **deduce** a code. Write it that way in the implementation.

*Story logic, and it is better than the status quo.* Ghost staged from that rack — the
`entropy_staging_cache` is already bolted inside it (`:1920`). The asset tag reads
*"tasked: EMERG-STORE strongbox … recover or deny before restore window"* (`:2030`). Finding
it **still in the server room, still tasked, cycles logged: 0** explains something the
current placement leaves dangling: *why the safe had not already been emptied*. Reeves had
the tool and had not yet used it. That is a better scene than finding it next to the safe it
was sent to open.

*Cost:* the pin-cracker observation's closing line — *"turn their own tool on their own
safe"* (`:2018`) — needs one word of rework, since the safe is now behind you rather than
beside you. *"Go back and turn their own tool on their own safe"* is, if anything, the
better sentence: it names the walk.

*Redundancy — claim withdrawn, and C7 now has a dependency.* An earlier draft said *"any
player who refuses the ransom needs the offline keys, so they must open the depth-4 safe by
code."* **That is false as the mission stands** (B7): `crack_safe_pin` is not in
`requiresCompleted`, and the recovery console does not check `offline_keys_recovered`.
**C7 is only worth doing once C12 lands** — otherwise it deepens a lock nothing requires.

*Three things the earlier draft did not say:*

- **It moves the insider thread's earliest evidence deeper.** The case also holds
  `entropy_asset_tag`, whose `onRead` sets `insider_evidence_partial` and completes
  `unmask_gather_evidence` (`:2038`, `:912-917`). After C7 that evidence sits at depth 7
  behind the RFID gate; the only other source is the Boardroom proposal (`:2287`), deeper
  still. **Combined with C3, the whole insider arc lands in the final two rooms** — which is
  precisely the back-loading Part G complains about. This is the plan's sharpest internal
  tension. Mitigation: leave the asset tag (or a copy of its information) at depth 4 and move
  only the cracker, or accept the concentration deliberately.
- **The cracker is not a reliable "route".** `pin-minigame.js:22` sets `maxAttempts = 3` and
  `:487-498` hard-locks at three. Three guesses with Mastermind feedback is a good puzzle but
  a poor guarantee. Stop describing it as a redundant way into the Boardroom (also correct
  E-4) unless `maxAttempts` is raised when `hasPinCracker` is true.
- **Update the graph tags in the same edit.** The case keeps
  `puzzle_graph_aim: "recover_offline_keys"` and the cracker keeps
  `puzzle_graph_unlocks: "emergency_storage_safe"` (`:2009`, `:2021`), which after the move
  draw a depth-7 node into a depth-4 cluster.

### C9 — Make the cover burn cost something ⚠️ *rewritten; the object move was a no-op*

**The problem is real and stands.** The cover burn fires on
`objective_task_completed:talk_to_gary` (`:795-799`) — Gary is in `it_department`, the
deepest room on the map. HaX says *"Your name is off their system … Get something that
stands up"* (`:803`), and the answer is in the room.

**But the previous fix did not work.** Moving the `Spare Contractor Lanyard` out of Gary's
drawer changes nothing, because Gary hands out an identical one **in dialogue**:

```ink
ink/m02_npc_gary_whitlock.ink:422
+ {(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard} [Someone's phoned security and pulled my booking...]
    -> the_lanyard
```

`the_lanyard` branches on influence into `lanyard_given` (`:589`) or `lanyard_grudging`
(`:611`) — and **both** emit `#give_item:id_badge:contractor_lanyard` +
`#set_global:cover_restored:true`. There is no refusal branch. So the same-room reversal
survives the object move, one dialogue choice deep, and the move additionally creates a
duplicate lanyard in the world.

*The cost estimate was also wrong.* The lanyard is an NPC `itemsHeld` entry (`:1587-1599`),
not a positioned object — it has no `position` to edit. Relocating it means authoring a new
room object. The "one `position` edit" comparison against C1 does not hold.

**And the real target was somewhere else entirely.** Val Okonkwo's `cover_challenge`
(`ink/m02_npc_security_guard.ink:103-205`) fires on
`global_variable_changed:cover_burned` (`:2379-2387`), and she is in `security_office` —
**the only room connecting `office_corridor` to `server_room`** (`:2328-2330`). She
physically stands between the player and the door they need, with four ways past:
`staff_lanyard_obtained`, `bernie_vouched`, `influence >= 20`, or arguing her down.

**Correction from round 4: Val is not a *mechanical* chokepoint.** `server_room` is locked on
`"requires": "server_room_keycard"` (`:1768`) and nothing else, and **`cover_restored` gates
no door anywhere in the scenario** — it appears only in eventMappings and end-credits
conditions. Her `cover_challenge` is a conversation with line-of-sight, not a barrier.

That cuts both ways, and both halves matter:

- **Gating Gary's lanyard cannot soft-lock anything.** Nothing mechanical depends on
  `cover_restored`. But `the_argument` (`ink/m02_npc_security_guard.ink:224-240`) does **not**
  set it, so a player with no lanyard, no Bernie and influence < 20 finishes cover-burned.
  Harmless mechanically; it shows in the credits. Make that a deliberate call.
- **C9's payoff is narrative, not mechanical.** The scene exists and is good; what Gary's
  drawer does is guarantee the player arrives already holding the trivially-safe answer.
  **C9's purpose is to make Val's challenge a decision instead of a formality** — the
  mission's act break. It buys drama, not structure, and the section should say so.

**What to do:**

1. **Gate or cut Gary's `the_lanyard` hub option.** This is the load-bearing edit; without it
   nothing else in C9 matters. Options: make it available only at high influence (so it is a
   *reward* for having worked him, not a default), or give it a refusal branch, or cut it and
   let Gary's contribution be the keycard.
2. **If a physical spare is kept**, put it in the Handover Room — staff kit lives in the
   staff room. Still a route, still a walk.
3. **Then Val's scene carries the act break.** Four routes, all of which cost something:
   Doyle's empathy-gated lanyard back at depth 3, Bernie vouching at depth 0, Val's own
   judgement at influence ≥ 20, or talking her down.

*Correcting F1 and an earlier overstatement:* Doyle's lanyard does **not** become "the
route". It is one of four, and the ink says so itself — *"(Redundant with Gary's contractor
pass, Bernie vouching, and Val's own judgement -- so this is a reward, never a
requirement.)"* That redundancy is what keeps C9 clear of the mistake that killed the
records trolley: Bernie and Val stay ungated, so no empathy check is ever load-bearing.

*Note C11:* `item_picked_up:contractor_lanyard` never fires, so any relocated lanyard needs
an explicit `onPickup: { setVariable: … }` or the pattern repointed. Do C11 first.

### C10 — Fix the recovery console outcome screen ⭐ *do this first*

`public/break_escape/js/minigames/backup-recovery/backup-recovery-minigame.js` hard-codes
another scenario's source id in **four** places, plus its own defaults:

```
:39   DEFAULT_SOURCES entry          id: 'cloud_vendor'
:210  commitSelection                isCompromised = source.id !== 'cloud_vendor'
:215  recovery_eta_hours             ... ? 18 : 0
:229  returned result                recoveryEtaHours
:235  showOutcomeScreen              recomputes isCompromised independently
```

Every m02 ending therefore prints *"RESTORE FAILED — SOURCE COMPROMISED"* (B8) — **and
`:220` silently sets `backup_reinfected = true` on every run**. Harmless today, since m02
never reads it, but the fix must cover it.

> **Resolved after playtest.** The compromised-source half was fixed in the implementation
> pass; the `backup_reinfected` half was not, and a playtest caught it still firing on the
> clean `combined_recovery` ending. The cause is m02 never setting `network_isolated`, the
> hook the minigame checks before scheduling reinfection — sis01 wires it and branches its
> debrief on it, m02 inherited the minigame and never did. m02 now sets it alongside
> `backdoor_fully_exploited`, when the player owns the full backdoor chain.

**Fix:** add an optional `compromised` boolean to each entry in
`minigameData.backupRecoverySources`. `resolveSources()` (`:136-150`) spreads
`{...base, ...entry}` with no field whitelist, so scenario data passes straight through —
the shape is right. Then:

- Patch **all five** sites, not just `:210`.
- Set the flag explicitly on `DEFAULT_SOURCES` (`:25-55`), which is used when a scenario
  configures nothing.
- **Add a numeric eta field.** m02's `etaLabel` values are strings (`"30 minutes"`,
  `"12 hours manual restore"`) and are not parseable, so the eta cannot be derived from them.

**sis01 is safe.** It configures all three sources explicitly
(`sis01_healthcare/scenario.json.erb:2098-2148`); marking `nas_encrypted` and `tape_wiped`
as `"compromised": true` reproduces today's behaviour exactly, including `backup_reinfected`
and the eta (`:215` writes 0; `:229` returns `null`).

Then m02 can state the truth: paying yields a working key from a criminal; offline keys are
clean; combined is clean and slow.

### C11 — Repair the four dead event mappings

See B9. The engine emits `item_picked_up:${type}`, not `:${id}`.

- Repoint to `item_picked_up:id_badge` / `:notes` **with an id condition**, or
- move the effect onto the object as `onPickup: { setVariable: … }`, which is what the rest
  of m02 already does (`:1671`, `:1993`, `:2033`).

**A fourth, found in round 4 and worse than the others:** `:1049`
`item_picked_up:ghost_terminal_device` — the object at `:1748` has `"type": "phone"`. That
mapping opens a `phone-chat` with Ghost on pickup. **It is how the player meets the
antagonist through the planted hardware, and it never fires.** The player picks up a live
ENTROPY bridge and nothing happens.

Two urgent ones, then: that, and `investigate_gary_office` (`:275`), a visible objective
with no completion route at all. C9 depends on this being fixed first.

### C12 — Make the offline-keys safe matter

See B7. Two independent gaps, and either fix alone is enough for C4/C7 to be worth doing;
both is better:

1. **Add `crack_safe_pin` to `restore_hospital_systems.requiresCompleted`** (`:448-456`).
2. **Make the recovery console honour its own prerequisite.** The
   *"Prerequisite: Offline backup keys must be recovered from PIN safe first"* bullet
   (`:1868`) is currently decoration; `offline_keys_only` and `combined_recovery` should be
   unselectable without `offline_keys_recovered`.

Option 2 is the better one on story grounds: it makes the safe the thing that *buys the
player the right to refuse the ransom*, which is the mission's whole moral architecture.
Without it, refusing the ransom costs nothing and the dilemma is decorative.

**Re-costed after round 4.** Option 2 is **not** a scenario-data change. The backup-recovery
minigame has no per-source availability or disabled-tile mechanism — `handleSelect`
(`:158-168`) only checks membership in `this.sources`. Making a tile unselectable requires
new engine code, in the same file C10 is already editing. So:

- **Option 1 is the one-line change** (add `crack_safe_pin` to `requiresCompleted`, as one
  edit together with C3, which touches the same array).
- **Option 2 is a minigame feature**, and should be done in the same pass as C10.

This also corrects C10's claim to be *"the only item that touches engine code"* — C12
option 2 does too.

**C4 and C7 should not ship before this.** Both are investments in deepening a lock that
nothing currently requires.

### C8 — The ward side: one more empty room, and the *one* place parity really matters

After C1 the corridor count drops from six of fifteen to three of thirteen:
`ward_vestibule` (depth 1), `ward_approach` (2), `ward_hall` (4). Of these,
**`ward_vestibule` is a `small_room_1x1gu` with `"npcs": []` and `"objects": []`** — a 1×1
box whose entire function is to exist between Reception and the ward approach.

*Optional:* delete it and connect `reception_lobby` east → `ward_approach` directly.
12 rooms, one fewer empty node, and the player reaches the ward one screen sooner — which
matters, because the ward is where the mission's stakes become physical.

**⚠️ This is the one change where the parity warning is live, and it is the opposite of the
office wing.** Part E-2 establishes that deleting the office landings *cannot* move the
ward's grid column, because rooms are BFS-placed from `reception_lobby` and the ward is
reached first. `ward_vestibule` is **upstream** of the ward: it is at depth 1, and the
warning at `m02:54-65` says the Patient Ward's south door lands bottom-right only because
Ward Approach sits two grid units wide on an **odd** column. Removing the vestibule shifts
that column by the vestibule's width. **Do C1 first, verify, and treat C8 as a separate
change with its own validator run.** If the door corner moves, revert C8 and keep the box.

*Story logic:* a ward vestibule is real — it is the airlock where you gel your hands. If it
is kept, it should at least hold the sanitiser dispenser and the visiting-hours board, so it
reads as a threshold rather than a loading screen. Keeping it furnished is a perfectly good
outcome; what is not good is it staying empty.

---

## Part D — Revised graph sketch

*Rewritten in round 4. The previous version was a pre-round-2 artefact: it still listed the
records trolley, the withdrawn `aimsCompleted` convergence and a capability arc "earned at
`ward_records_trolley`", all of which the sections above replace.*

**Rooms after C1** (15 → 13; three empty landings become one room with four exits):

```
  [Server Room]──[Security Office]──[═══ Main Corridor ═══]
   (rfid)          (Val: cover_challenge)        │ north
                          ┌───────────────────┴───────────────────┐
        [Boardroom]───west│      NIGHT HANDOVER ROOM (new)        │east───[IT Dept]
        (pin 0417)        │  cyberchef (takeable)                 │       (key)
                          │  handover_whiteboard                  │
                          │  estates_audit_snag_list              │
                          └───────────────────┬───────────────────┘
                                              │ north
                                        [CTO Office]

  Main Corridor ──south── [Ward Link] ── [═ Patient Ward ═] ── [Emergency Storage]
                                                │
                                         [Ward Approach] ── [Reception]  ▶ START
```

**Changed edges and gates, current as of round 4:**

```
── bug fixes (no graph effect, ship first) ──
C10  backupRecoverySources[].compromised        → outcome screen tells the truth
C11  item_picked_up:<type> + itemId             → 4 dead mappings live, incl. meeting Ghost
C12  crack_safe_pin → requiresCompleted         → the offline-keys safe becomes required
C3   unmask_identify → requiresCompleted        → the insider thread becomes required

── structure ──
cyberchef_workstation   takeable:true, → staff_room (depth 6)   [needs C1]
entropy_field_case      emergency_storage (4) → server_room (7) [needs C12]
estates_audit_snag_list → emergency_storage_safe   (replaces the diary line)
gary the_lanyard        gated or cut                            [needs C11]
recovery_instructions   keep ROT13, strip the two giveaway strings, add id + onRead
```

**Convergence, stated precisely.** This plan adds **no AND gate**, because per P6 they are
not a mechanic — `puzzle_graph_and_with` is read by nothing under `public/break_escape/js/`.
The only engine-enforced convergence available is `requiresCompleted` on the
mission-conclusion aim, and C3 + C12 both use it. That is the honest description: two tasks
added to one array, which is worth more than the three diagram nodes an earlier draft
proposed.

**Projected:** 13 rooms, 30 locks, **two newly-mandatory threads** (insider, offline keys), a
decode tool live from depth 6, and a PIN cracker the player has been made to earn.

**Capability arc across the season.** m01 grants **lockpicks**, earned from Kevin after
`patricia_briefcase` (*"No key available - would need to pick the lock"*, `m01:1556`) has
shown you the wall. m02 banks those — walking up to a door and opening it is m01's reward
being spent — and grants the **PIN cracker**, earned by C7 pushing it behind the depth-4 safe
that C12 makes mandatory. Whatever m03 grants should follow the same shape: show the wall,
then remove it.

## Part E — What could break

*Two items in this section were wrong in earlier drafts and have been corrected against a
simulation of the engine's own placement maths rather than against the repo's comments.*

1. ~~**Office-wing overlap.**~~ **Corrected: not a risk.** The earlier draft claimed
   `office_hall_mid` is "5×10 with 10×10 rooms on three sides via 5-wide landings". False —
   all three landings are `room_hospital_hall` with **no `dimensions` override**
   (`:2497-2531`), so they inherit the template's 10×6, i.e. two grid units wide, not one.
   Simulating `calculateRoomPositions` on the proposed layouts:
   `C1 (13 rooms) → no overlaps`; `C1 + C8 (12 rooms) → no overlaps`. Run
   `ruby scripts/validate_scenario.rb` anyway, but this is not the hazard.

2. **Door-side parity: the asymmetry is real, the repo's comment is not.** Deleting the
   office landings **cannot** move the ward's door — `calculateRoomPositions`
   (`rooms.js:1554-1640`) seeds the start room and only ever writes positions for rooms not
   already processed; BFS reaches every ward room before `office_corridor`. Deleting
   `ward_vestibule` (C8) **can**, because it is upstream at depth 1 and is one grid unit
   wide (`GRID_UNIT_WIDTH_TILES = 5`, `constants.js:19`), so it shifts `ward_approach` and
   `hospital_ward` by an odd number of units and `placeSouthDoorSingle`
   (`doors.js:180-186`) flips on `((gridX+gridY)%2+2)%2`.

   **But do not trust the header comment at `:54-65` as the baseline.** It says the ward's
   south door lands bottom-**right** today; the engine's maths puts it bottom-**left**, with
   C8 moving it to bottom-right. The comment appears stale. **Re-derive the current corner
   empirically before and after, rather than quoting it** — and treat C8 as its own change
   with its own validator run.

3. **Geography in prose — the live hazard, and E-3 previously cleared it wrongly.**
   The earlier draft checked ink for `office_hall_*` *ids*, found none, and concluded the
   deletion was "cleaner than feared". The ids were never the risk.
   `README_ink_best_practices.md:121`: *"Directions in dialogue go stale the moment the
   layout changes."* Two are already broken:
   - `:792` — *"IT department, **east of reception**"*. IT is eight rooms away past the
     entire ward and corridor. **Wrong today, before any change.**
   - `ink/m02_npc_ward_nurse.ink:281` — *"Try IT -- up the link and along the main
     corridor"*. Correct today, **wrong after C1**.
   Plus the Ward Board directory (`:2489`) naming all three landings, and the three
   `door_sign`s in the deleted block.

4. **Kim's KO does not orphan the boardroom.** `"taskOnKO": "meet_dr_kim"` (`:2079`)
   completes the task **without** setting `found_boardroom_code` (set only in
   `ink/m02_npc_sarah_kim.ink:332-339`). But `dr_kim_office` is unlocked, the diary is in it,
   and its `onRead` sets the global (`:2134-2137`). Reachable in every ordering **on those grounds alone** — the
   unlocked office plus the diary's `onRead`.

   *Round 5 correction:* an earlier draft added *"after C7 the PIN cracker is a further
   redundant route into that room."* **Struck.** `pin-minigame.js:22` and `:487-498` cap at
   three attempts, so three guesses with Mastermind feedback is a good puzzle and a poor
   guarantee. Do not ship it as a designed fallback unless `maxAttempts` is raised when
   `hasPinCracker` is true — and if it is raised, say so in one place only.

5. **`lock_guard_challenge` is not a lock.** It exists only as `puzzle_graph_unlocks`
   metadata on two lanyards (`:1221`, `:1598`), both edges dashed. The real mechanic is
   `eventMappings` on `item_picked_up:*` setting `staff_lanyard_obtained` / `cover_restored`
   (`:806-816`). **C9 depends on this**, but not as an earlier draft claimed: the lanyard is
   an NPC `itemsHeld` entry with no `position`, `item_picked_up:contractor_lanyard` never
   fires (B9/C11), and the object move is not the fix — gating Gary's dialogue option is.

6. **Story-logic regressions to watch.** After C7, the pin-cracker observation still says
   *"turn their own tool on their own safe"* while the safe is now a room behind you; fix
   the sentence, don't drop the idea.

7. **A new Tiled build may be unnecessary.** `public/break_escape/assets/rooms/` already
   ships `room_break.json`/`.tmj` — m01's Break Room. A hospital staff room is a reskin at
   most. Check before running `scripts/generate_rooms.py`.

---

## Part F — Dialogue and characterisation

New objects need new lines, and Phase 1 set the rules these must obey: characters want
different things in the scene, at most one quip per exchange, no info dumps, and facts come
**grudgingly, partially, or wrong**. Nothing below adds a character or a room.

**F1 — Sister Doyle's lanyard stops being the route nobody takes (supports C9).** The records-trolley
gate is dropped with C7, and Doyle does not need another job — she already gates the 1987
hint (`ink/m02_npc_ward_nurse.ink:207-213`) and the agency lanyard (`:255-276`), and
`README_ink_best_practices.md:391-403` uses her as its worked example of a safe consequence
gate. What changes is that it becomes **one of four** routes, not *the* route — the ink already
says why that matters: *"(Redundant with Gary's contractor pass, Bernie vouching, and Val's
own judgement -- so this is a reward, never a requirement.)"* Keeping Bernie and Val ungated
is what keeps C9 clear of the mistake that killed the records trolley. What the scene needs
is weight it does not carry now: the player has crossed the hospital with their standing
revoked, and she is one of the people who can give it back. One line acknowledging that she knows exactly what she is doing,
and does it anyway, is worth more than gratitude.

**F2 — Gary reacts to the CyberChef move.** If the tool is now found in the staff room, it is
because somebody left it there. Gary is the plausible owner. One grudging line — he does not
want to discuss why his kit is in the staff room and not in his locked department — is worth
more than an explanation, and it quietly reinforces that IT has been living out of a bag
since 02:47.

**F3 — Kim's diary line changes (required by C4).** The "emergency store safe still on the
founding year" line moves to the snag list, so the diary entry shortens. Kim should still
be able to give the safe hint **if pressed**, so KO-resilience does not depend on one object
— but she should give it as an admission, not as help: it is another thing she was told
about and did not act on. That is the same wound the whole mission is pressing.

**F4 — Ghost and the PIN cracker.** The player is using ENTROPY's own tool against ENTROPY's
own target, and Ghost is on the phone and watching the network. One line acknowledging it —
unbothered, not threatening, consistent with the Phase 1 pass that stripped Ghost's nagging —
would land the C7 reward narratively as well as mechanically. Ghost finding it *interesting*
rather than annoying is the right register.

**F5 — Do not narrate the new clues.** The ward incident log, the handover whiteboard and the
snag list should be read, not explained. No NPC should tell the player what they mean. The
Phase 1 rule stands: cut any line that exists only to explain.

**F6 — Fix the two stale direction lines.** `:792` says IT is *"east of reception"*; it is
eight rooms away past the ward and the corridor, and this is wrong **today**.
`ink/m02_npc_ward_nurse.ink:281` — *"up the link and along the main corridor"* — is right
today and wrong after C1. Both are Phase 1 violations in waiting
(`README_ink_best_practices.md:121`).

---

## Part G — Pacing: where the mission sags

Earlier drafts analysed lock depth and never asked where the **act breaks** land. They land
badly, and one of them is the reason C9 exists.

| Beat | Fires at | Depth | Problem |
|---|---|---|---|
| Arrive, meet Bernie | `reception_lobby` | 0 | fine |
| See the ward, meet Doyle | `hospital_ward` | 3 | fine — stakes become physical early, which is right |
| See the PIN safe, fail | `emergency_storage` | 4 | **good** — and C7 makes it matter |
| Meet Kim | `dr_kim_office` | 7 | late for a character the briefing sends you to first |
| **Cover burns** | `talk_to_gary` | **8** | **the turn happens at maximum distance from everything** |
| Cover restored | Gary's drawer | **8** | **same room, seconds later** — see C9 |
| Server room / VM | `server_room` | 7 | fine |
| Boardroom, comms | `conference_room` | 8 | fine |

Four observations:

- **The mission front-loads its best material and back-loads its structure.** Depths 0–4
  contain Bernie, Doyle, the ward, the founding plaque and the PIN safe — all strong. Depths
  5–6 are two corridors and a security office. C1 puts a real room at depth 6, which is
  exactly where the sag is.
- **C1 shortens the post-burn walk** by pulling `it_department` from depth 8 to 7. Small loss
  for the turn, clear win for the Boardroom loop.
- **The turn is not actually a notification — and C9 was arguing the wrong thing.** Val
  Okonkwo's `cover_challenge` puts a person in `security_office`, the only room between the
  corridor and the server room, with four ways past. The scene exists and is good. What
  Gary's drawer (and his dialogue) does is guarantee the player arrives already holding the
  safe answer. C9's job is to make that scene a decision, not to manufacture a walk.
- **Watch the total traversal after C7.** The back third becomes: Gary at 8 → walk back to
  restore cover → forward past Val to 7 for the cracker → back to 4 for the safe. **Three
  full crossings of the hospital in the final act**, through corridors that contain nothing.
  Distance is not the same as pacing. If C7 and C1 both land, `ward_approach` and `ward_hall`
  — the two corridors the player crosses most — need a reason to exist, or the walk that C9
  is meant to make meaningful becomes the walk that makes the ending drag.

**What still sags after everything in this plan lands:**

1. **The corridors.** C1 removes three empty rooms and C8 a fourth; nothing is proposed for
   `ward_approach` or `ward_hall`, which are crossed most often.
2. **The ending.** The moral choice is the mission's whole point. It gates nothing (B7), and
   it currently prints another scenario's failure screen (B8). C10 and C12 are the two
   changes that matter most to how the mission *finishes*, and neither was in this document
   before round 3.

---
