# m10 Full Disclosure: puzzle chains, round 4 review

2026-10-22. Phase 2, round 4, on HEAD 588b5ae52 ("puzzle chains R3, scenario design R4 and dialogue R4 fixes"), run with `.claude/skills/mission-puzzle-chains/SKILL.md`. Read-only: the only file written is this one. All line numbers are at HEAD.

**In flight.** A scenario design R5 fixer was editing the working tree during this review (the ERB, the phone ink and the Tesseract ink, all uncommitted). Where its edits touch a finding here, the finding says so. The edits already fix m1. The review is of HEAD, not of those edits.

**Method.** `room_depth.py` run again. The validator (`--no-graph --skip-ink`) run, and its `-o` render used for the room, console, station and find check (rendered `connections`, `acceptsVms`, `flags`, `hintOnlyFlags`). The seven ink files the commit touched (phone, Elena, Vance, Voltage, Tesseract, Gary, six o'clock) recompiled to scratch with `bin/inklecate`: 0 warnings, each identical to the committed JSON. The VM is a black box. A find is taken to make its flag obtainable at any field console. The one extra input is FINALE_VM_GATING_HANDOFF.md B6 item 2, at concept level: flag 2 is on the same host as flag 1, behind the same login, so flag 1's find gates it. Of the VM gating documents I read only the handoff (B5, B6). No VM plan, SecGen file or field guide was opened.

**Counts: 0 blockers, 1 major, 1 minor, 5 nits.** Every R3 finding is resolved (§1). The major is the one R3 §5 and CONTRACT §11 left unchecked as "VM side". With B6's answer it can now be checked, and it fails. Flag 2 can be taken at the forward post, at depth 0, and can only be submitted at the release console, at depth 5 (§2, M1). The minor is a new mapping that the engine can't evaluate, so dialogue R4 n4's fix never fires (m1).

---

## 1. Round-3 findings: status

| Finding | Status | Evidence at HEAD |
|---|---|---|
| M1 (major) core key one lock before its station | **Resolved** | The gallery copy is gone. `core_access_key`, "Core Host Key", is in `core` (erb:4249-4261), at (2.2, 4.8), "Left out for whoever came down", signed "For the agent. A.T." (Dr Adrian Tesseract, erb:4079). It's the only source: the key string appears nowhere else in the ERB or the ink. `box_topic` (phone:598) and the core rung of "[Where are we?]" (phone:132) name it. The name no longer reads as the outer lock's key. Depth check in §3.2 |
| m1 (minor) tag on SAFETYNET's console | **Resolved** | erb:2602-2614: "hanging off the gate terminal's power lead", at (15.6, 3.4) beside the terminal's stand. `monitor_topic` (phone:589): "There's a maintenance tag on their gate terminal's lead." "Do not remove." now fits a tag still hanging. CONTRACT:1231 corrected |
| m2 (minor) "His disarm sits on that box" | **Resolved** via B6 | phone:577: "The release's kill config is on it: how six o'clock is armed, and what stops it. The switch is on his console, in the core." Story level only, unvoiced. Two departures from B6 are both sound: a colon in place of the em dash, and "in the core" in place of "upstairs" (the gallery's slit windows look *down* into the core, erb:4053). It now agrees with the console's "The disarm's lamp is green." (erb:4180) |
| n1 (nit) step 1 "Give me a minute" then a ring | **Resolved** as R3 suggested | phone:801 "Take it. I'll ring you back." The re-ring (erb:1722) fires on close. Residual case in n1 below |
| n2 (nit) two doc rows behind | **Resolved**, then overtaken | texts:127 gives T-62 as 10 s. CONTRACT:280 has "[Anything else before I pull it?]", but dialogue R4 m1 has since renamed the button "[Just that one?]" (phone:826), so the row is one rename behind again (n2 below) |
| n3 (nit) "Duty Card" next to a card reader | **Resolved** | erb:3681 "Operator's Duty Sheet". HaX (phone:578), the hall rung (phone:142) and the hatch's first-click text (erb:1639) all say "duty sheet". One stale ink comment (n3 below) |

---

## 2. New findings

### M1 (major). Flag 2 can be taken at the forward post and held through five rooms

**Evidence.**
- The VM table puts flags 1 and 2 on the same machine: `'bunker_monitor' => ['flag{m10_monitoring_foothold}', 'flag{m10_staging_schedule}']` (erb:70). Flag 1's station is `gate_terminal`, in the forward post (erb:76). Flag 2's is `release_console`, in the server hall (erb:77, 3597-3613).
- B6 item 2: flag 2 "sits on the same monitoring host as flag 1, behind the same `secmon` login, so it is **gated by flag 1's find**". No other in-game object gates it.
- The tag is readable from the start in the forward post (erb:2602-2614, depth 0). So is the forward post's field console (`gate_console`, erb:2543-2552, no lock and no condition).
- So a player who logs in with the tag can take flag 2 at depth 0. The release console only becomes reachable at depth 5, past four card doors (rendered `connections`: forward_post → blast_tunnel → security_office → workshop_floor → power_room → server_hall).
- The game already plans for this hold. The gate terminal's `hintOnlyFlags` has `'bunker_monitor:flag_2': 'That one goes in at the release console in the server hall.'` (rendered JSON, from `station_hints`, erb:96-100). In the hall, the schedule terminal says the same thing: "The staging copy of the release schedule, behind the monitoring host's login." (erb:3636).

This is the rule as the user put it (F12, FINALE_DEV_LOG.md:489): "A player must never hold a flag they can't yet submit." It's also the likeliest early hold in the mission. A player who has just got in with a working login will look round the host, and the station tells them to carry the flag five rooms. R3 rated a one-lock hold as major. This one runs through five rooms on the first VM step.

Nothing before this round had ruled on it. B6 answers whether flag 2 needs a find of its own ("it needs none"), not whether it can be held early. CONTRACT §11 (the puzzle chains R3 paragraph) lists it as "Not checked (VM side) … for opus48 or the user".

**Options (VM side, so for the user or opus48; not for a game fixer):**
1. **(Preferred) Give flag 2 a find in the server hall.** On the VM, put the staging copy behind a second login. In the game, put that login on something by the release console. A label on the console's own housing or a sticky note on the schedule terminal would do. Who wrote it: the operators who run the staging copy, the same people whose duty sheet is by the east racks. The find and the station are then both at depth 5, the same arrangement as flags 1, 3 and 4. Game-side cost: one `notes` object, one unvoiced rung ("The console takes the staging copy." → "…The login's on the console."), a hall Codes entry, and a dressing position. This reverses B6's "needs none", so it needs the user's or opus48's agreement.
2. **A recorded exception.** The user rules that flag 2 may be carried from the post, and the gate terminal's hint is the signpost. That costs nothing, but F12 would then have a stated exception.
3. **Not recommended: let the gate terminal take flag 2.** That breaks F-18 (one flag per station, erb:74). It would also fire the hall's flag-2 content at depth 0: the console controls (erb:3621), the schedule terminal's text variants (erb:3629-3655), the backdoor task and Victoria's call.

### m1 (minor). Dialogue R4 n4's shutter text can't be evaluated, so it never fires

**Evidence.** erb:1729:

```
"condition": "value === true && globalVars.flag2_submitted === true && globalVars.flag3_submitted === true && ((globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax) || globalVars.voltage_outcome === 'by_hand') && !globalVars.shutter_text_sent && !globalVars.hax_jammed"
```

`safeEvaluateCondition` splits on `&&` and evaluates each part as a single term (`npc-manager.js:109-112`). `((globalVars.cut_step === 3` is not a term it supports, so it logs "unsupported condition term" and returns false (`:101-102`). The validator reports this one as ❌ INVALID (item 37). It's the only INVALID in the run. The next mapping (erb:1730) then fires as before. A player whose voice (Vance, Elena or captured Voltage) has just said the shutter is dead still gets "Shutter's dead. The stair's open." That is exactly what DR4 n4 meant to remove. CONTRACT §11 (DR4 n4) says this was "traced over five save types". That trace can't have used the engine's evaluator.

**Fix** (JSON only, no new text): split it into two mappings, one per `||` branch, both placed above erb:1730 and both setting `shutter_text_sent`:
- `… && globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax && !globalVars.shutter_text_sent && !globalVars.hax_jammed`
- `… && globalVars.voltage_outcome === 'by_hand' && !globalVars.shutter_text_sent && !globalVars.hax_jammed`

The existing three forms already rely on first-match order on `shutter_text_sent` (R3 §1), so the second one can't double-send. Then re-run the validator, which should show 0 INVALID.

**Status: fixed in the working tree** (scenario design R5 m1, uncommitted). It's this same split: two `&&`-only mappings, each setting `shutter_text_sent`, placed above the general form. Confirm with the validator once that batch lands.

### Nits

- **n1. "I'll ring you back" after the one re-ring has gone.** The close re-ring is `onceOnly` (erb:1722) and fires on *any* close of HaX's conversation while `cut_by_hand` holds and `cut_step !== 2`. If it's already been used (an earlier close, or "[Give me a minute.]" at step 0), step 1's "Take it. I'll ring you back." (phone:801) is followed by silence until the player clicks the isolator, which rings her anyway (erb:1721). Step 0's "I'll ring straight back." (phone:786) has the same case if the player closed an earlier call. It's narrow, and the click recovers it. Either drop `onceOnly` and keep the `cut_step !== 2` guard (each "minute" earns one ring), or word both replies so they don't promise a ring ("Take it. Click the isolator when you're there.").
- **n2. Three doc rows behind the build.** CONTRACT:280 names the step-2 button "[Anything else before I pull it?]". It's "[Just that one?]" in all four voices (DR4 m1). texts/BARKS_AND_TEXTS.md:62 (T-28) lists three forms; the build has four, with "The stair's open." (erb:1729, once m1 is fixed). texts:70 (T-34) lacks the hatch text's new sentence, "One of his operators dropped a duty sheet by the east racks." (erb:1639). No player effect.
- **n3. Stale ink comments on `hatch_topic`.** phone:571-572 still say "the disarm is a story artefact on the release host" and "the operator's duty card". Neither is shown to the player. A later writer who reads them would undo B6.
- **n4. "On his terminal" against a desk position.** The key's observation ("propped against the host terminal's screen", erb:4257), HaX's "He's left a key envelope on his terminal" (phone:598) and the core rung "The key's on his terminal." (phone:132) all say it's on the terminal. SD R4 d1 put it on the map table about one tile east of the terminal (CONTRACT §11, d1: key (2.2, 4.8), terminal (1.2, 4.6)). If the render reads as "beside", say "beside his terminal" in the three strings, or move the object onto the terminal. Browser check 3. The in-flight SD R5 n2 edits rename the object "Core Access Code" and change the two HaX lines to "…an envelope on his terminal, stamped CORE. His login's in it." and "The login's on his terminal.", and guide 4's text to "His login's in the envelope on his terminal." All of them still say "on his terminal", so the nit stands.
- **n5. The Codes block still calls itself a placeholder.** erb:179-184 and the three objects' `_comment`s say "PLACEHOLDER (VM) … The opus48 agent or the user replaces them". The values now look set (`relops` came from the VM plan in a3128ce35). If all three are final, the labels should go, so nobody "replaces" good values. If not, see §5.

---

## 3. The audit, run again

### 3.1 Headline numbers

| | m01 | m02 | m10 at R3 | m10 now |
|---|---|---|---|---|
| Rooms / empty | 13 / 0 | 13 / 2 | 8 / 0 | 8 / 0 |
| lockType declarations | 12 | 15 | 9 | 9 |
| Max depth | 3 | 7 | 7 (`core`) | 7 |

Layout and connections haven't changed (the rendered `connections` form one corridor), so depth, BFS positions and door parity can't have moved. The locks are the same nine, at erb:2675, 2790, 2970, 3009, 3064, 3201, 3278, 3720 and 4071 (line numbers shifted, contents unchanged).

Validator: 1 ❌ INVALID (m1, new in this commit). The rest is R3's set: the two objective-wiring overlap notes, cutscene `onceOnly` advisories, imported-condition advisories, the lock guard's `item_picked_up:notes` listener (it reads `data.itemId`, so the three finds can't trip it), and four forward-post NPCs with no behaviour. None of those is new.

### 3.2 The depth check for the finds, against the rendered rooms

Depth (BFS from `forward_post`): blast tunnel 1, security office 2, workshop 3, power room 4, server hall 5, gallery 6, core 7. In the render the field consoles are `gate_console` (forward post, 0), `hall_console` (server hall, 5) and `core_console_vm` (core, 7). All three take the same attack box.

**Per find:** which consoles the player has reached when the find becomes reachable, which flags that makes obtainable, and whether each of those flags' stations is usable by then.

| Find (erb) | Room, depth | Consoles reached by then | Flags it makes obtainable | Station, depth usable | Hold? |
|---|---|---|---|---|---|
| Maintenance Tag (2602) | forward post, 0 | gate (0) | 1 | Gate Terminal (2554), 0 | No ✅ |
| | | | **2** (B6: same host, same login) | Release Console (3597), **5** | **Yes, depth 0 → 5 ❌ (M1)** |
| Operator's Duty Sheet (3676) | server hall, 5 | gate (0), hall (5) | 3 | Sealed Section Hatch (3657), 5, no gate on entry | No ✅ |
| Core Host Key (4249) | core, 7 | gate (0), hall (5), core (7) | 4 | Core Host Terminal (4200), 7 | No ✅ |

- Each find's own room has a field console. So a find can always be used at once, and no find leaves the player walking back to a console.
- The core can also be opened from inside (Victoria's and Vos's routes). Either way the key is in the core, so it's never reachable before the terminal is.
- The hall has no lock of its own. It's reached only through the power room's card door, so the sheet and the hatch become reachable together.
- Every find has one source. None of the three strings appears in the ink or in any other object.

With M1 fixed by option 1, every row reads ✅, with find and station in the same room for all four flags.

### 3.3 Boss-key table

As R3 §3.2, unchanged. Blast door, inner door, Stair B, the power-room card, the shutter isolator, the gallery stair and the outer lock are ✅. The cupboard and the fitter's locker are ✅ by design (optional). The model terminal is same-room by intent (W7, optional). The commit touched no lock.

### 3.4 Chain depth, capabilities, choices

No change in shape from R3 §3.3-3.5. The finds add a look-round beat in the post, the hall and the core without adding walking. In the hall, the hatch's first-click text now names the sheet for a player who goes hatch-first (SD R4 m1). Nothing reopens a §10 withdrawal.

### 3.5 Bug sweep (skill Step 4)

| Check | Result |
|---|---|
| Conditions the engine can't evaluate | **m1** (erb:1729). The validator finds no other |
| `item_picked_up:` keyed on id | None new |
| Tasks with no completion route | None. `submit_flag_1-4` (erb:1395, 1435, 1436, 1451) can each be completed once their find is held |
| Author notes, code-stating observations | None shown to the player. The finds state logins by design |
| Stale geography | "in the core" (phone:577) is right. "on his terminal" against the desk position (n4). The hall rungs and texts say "east racks" (sheet at (15.5, 3.5), by the hatch) |
| Stale names | Only in ink comments (n3) |
| Compiled ink | Seven touched files: identical to the committed JSON, 0 warnings |

---

## 4. For phase 5 (browser only)

New this round:
1. **Tag at (15.6, 3.4).** It reads as hanging off the gate terminal's stand, can be clicked, and isn't covered by `arakawa_gate` once he's revealed.
2. **Sheet at (15.5, 3.5).** It's by the east racks near the hatch, clear of `hall_guard_b`'s turn, and can be clicked.
3. **Key at (2.2, 4.8).** It's visible on entry to the core and can be clicked while Tesseract's arrival is parked. Check whether it reads as "on" or "beside" the terminal (n4). It shouldn't overlap the core field console, which has no position in the ERB and lands by type.
4. **No early key.** At a save in the gallery with the lock shut, nothing reachable carries the core host key.
5. **The shutter text after m1's fix.** Vance, Elena and captured Voltage (by hand), with flags 2 and 3 in: one text, "The stair's open." HaX as the voice: "Shutter's dead. The stair's open." No branch gets two texts.
6. **The re-ring (n1).** "[Give me a minute.]" at step 0, then again at step 1. Is there a ring after the second? It should match whatever wording or condition n1's fix settles on.
7. **The hatch-first route.** Click the hatch before flag 2: the text names the duty sheet. "[The hatch?]" doesn't show yet (it needs `flag2_submitted`).
8. **If M1 goes with option 1:** the new hall find is clickable by the release console, and flag 2 can't be taken with the tag alone. That second part is a VM test for opus48 or the user, not for a browser tester.

Carried from R3 §4, still to run: the "[Where are we?]" rungs naming each find; the three hub steers in their windows; the cold-start Wendell worked-round cut; the escaped Voltage fight; Vance and Elena resuming at step 2 and `cut_done`; captured "[I'll do it.]", a re-talk at step 2 and his bark; a reload at `cut_step` 2; the click guards at steps 0 and 1 on each branch; the workshop rack, card 4 and T-62 at 10 s; Fonoti's cone after the rota, the handover and the Vos pick; exchange 3's Alpha button.

---

## 5. For the user or opus48 (VM side, not reasoned about here)

- **M1.** Pick option 1 (a hall find for flag 2, with the staging copy behind a second login on the VM) or option 2 (a recorded F12 exception). Option 1 reverses B6's "no find needed".
- **n5.** Confirm that `secmon` / `Bunker!Monitor59`, `relops` / `Release!Shift25` and `TSRCT-CORE-9F21` (erb:186-190) are what the build creates, then drop the PLACEHOLDER labels.

---

## 6. Severity log

| Round | Blocker | Major | Minor | Nit | Outcome |
|---|---|---|---|---|---|
| 2 | 0 | 0 | 3 | 6 | m1-m3, n2-n6 resolved; n1 left by ruling |
| 3 | 0 | 1 | 2 | 3 | All resolved at 588b5ae52 (M1 key in the core, m1 tag on their terminal, m2 via B6, n1-n3) |
| 4 (this) | 0 | 1 (M1) | 1 (m1) | 5 (n1-n5) | All R3 findings closed. M1 is the flag-2 hold that R3 §5 left for the VM side. B6 makes it checkable, and it breaks F12; it goes to the user or opus48. m1 is a dead condition in the DR4 n4 mapping (validator ❌). The nits are doc and comment drift, one ring promise, and one position wording. Nothing structural outside the VM gating |

The rounds are narrowing. Outside the VM gating, R4 found one dead mapping and wording. The open question is a VM-side decision, not a design defect the game can fix alone.

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 4 rounds.
