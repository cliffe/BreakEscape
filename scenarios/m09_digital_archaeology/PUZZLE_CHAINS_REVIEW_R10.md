# m09 Digital Archaeology: puzzle chains, round 10 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at ddc2d668 (inventory keepalive), which follows 252874ef (puzzle chains round 9 fixes). No m09 file differs from HEAD. The uncommitted engine changes in the tree (`person-chat-portraits.js`, `person-chat-pretext.js`, `person-chat-ui.js`, the new `person-chat-camera.js`) are presentation only and touch no close, flush or tag path.

**Method.** I read R9, both commits' diffs, and the engine paths a gift takes from an ink tag to the notepad: `person-chat-minigame.js` (`_deferReply`, `_flushPendingReply`, `displayAccumulatedDialogue`), `chat-helpers.js` `processGameActionTags`, `npc-game-bridge.js` `giveItem` and `_receiveNote`, `inventory.js` (`addToInventory`, the server-inventory restore), `notes-minigame.js` `addNote`, `state-sync.js` (notes and the pagehide flush) and `core/game.js` (the restore order). I recompiled the fifteen inks with inklecate: all identical to the committed JSON. I re-rendered the ERB, copied R9's `sweep9.cjs` as `sweep10.cjs` and ran it on the new JSON (90 runs), and wrote `tagorder.cjs` to print the tag list each bin reply hands the engine. I also ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. I opened no VM plan, SecGen file or field guide; VM flags are black boxes. No browser run. Scratch files are in the session scratchpad under `m09_pc_r10/`.

**Counts: 0 blockers, 0 majors, 2 minors.**

**Verdict: not yet complete.** R9 m1 and both notes are fixed and add nothing new. R9 m2 is only half fixed: the keepalive does land the file on the server, but all four m09 bin gifts are notes, and a note reaches the notepad only from the response handler, which never runs once the page has gone (m1). Tracing that path turned up a second gap on the same reload edge: after the bin reply is shown, the bin's two `set_global` tags wait behind the gift's server round trip, so an F5 in that window keeps the file but loses the choice (m2). Both need an F5 (or crash, or tab close) inside a window of 1.5 s or less, so both are minor. Both are about page unload. The Esc, reopen and reload classes are clean again.

---

## 1. R9 items

| Item | Where now | Status |
|---|---|---|
| R9 m1, Noor's card on an F5 before the first click | `globalVariables` `"noor_card_given": false` (erb:2542); `noor.ink:20, 33-35, 42-47` | **Fixed.** `sweep10` no longer reports the Noor gift (R9's run did, on `m05_found_pipeline_list`). The `~ noor_card_given = true` runs at Continue, so `observeGlobalVariableChanges` writes it to `gameState` at once (`npc-conversation-state.js:546-590`), before the tag is processed. The opening's tags are processed together, straight away, when `showCurrentDialogue` hands the block to `displayAccumulatedDialogue` (`person-chat-minigame.js:693-695, 1223-1231`). So there is no window where the global is set and the give hasn't started. Not in the m10 export list, which is right: nothing outside her ink reads it |
| R9 m2, keepalive on the add-item POST | `inventory.js:431-450` | **Half fixed: m1 below.** The POST now outlives the page, and the 60 000-character guard is sound: m09's gift bodies are 319 to 719 bytes. Every m09 gift that crosses an unload is a notes item, though, and a note's notepad entry is written client-side after the response (`npc-game-bridge.js:281, 303-306`). The keepalive doesn't reach that write |
| R9 n1, stale PLACEHOLDER comments | erb:766, 944, 969, 999, 1092, 1205, 1388, 1594, 1609, 1672, 1702, 1720, 2166 | **Fixed.** Each art comment now names its final asset, and I checked each one exists: the nine character keys under `assets/characters/`, `m09_briefing_blended.png` and `m09_hangar_blended.png` under `assets/backgrounds/`, and `m09_rubber_stamp1/2.png`. The two real placeholders are labelled: the field-guide `labUrl`s (erb:766, lab-sheet stage) and the shredder `ambientSound` on `restricted_stacks` (erb:1594) and `restricted_cage` (erb:1702), for the audio stage. The `PLACEHOLDER` left at erb:21 is the VM fallback flag strings (F9), which belong to the VM work, not this phase |
| R9 n2, CONTRACT §15 round 8 | CONTRACT.md:850 | **Fixed.** Names 4af6a328. The round 9 paragraph (:852) is accurate. It says m2 "is an engine fix handled elsewhere", which needs a line once m1 here is settled |

---

## 2. Findings

### m1 (minor; engine). After an F5 in a bin reply's gap, the keepalive lands the file on the server, but it never reaches the notepad

**Evidence.**
- On F5 in the 1.5 s gap, `_flushPendingReply` sets the globals at once, then starts `give_item` (`person-chat-minigame.js:1161-1199`). `giveItem` awaits `addToInventory` (`npc-game-bridge.js:281`), whose POST is now keepalive (`inventory.js:443`), so the server records the file and filters it from Sorensen's `itemsHeld`.
- The notepad entry comes after the await: `_receiveNote` → `window.addNote` (`npc-game-bridge.js:303-306`; `notes-minigame.js:843-889`) pushes onto `gameState.notes`, which reaches the server only through state-sync (`state-sync.js:187, 272-279`). The page is gone by the time the response arrives, so neither the note nor `item_picked_up:notes` happens.
- On the reload, `savedNotes` doesn't have it (`game.js:1563-1575`). The server inventory restore re-adds `playerInventory` items through `addToInventory` (`inventory.js:118-160`). For a notes type, that returns early and only adds to the notepad when the `objectId` starts `action_item_` (`inventory.js:536-541`). A restored item's id is `inventory_<type>_…` (`inventory.js:220`), so nothing is shown.
- So R9's phase-5 check ("is the file in the notepad after the reload?") would still fail. The player has `cage_bin` and `bin_chosen` set and the file held server-side, but can't read it. HaX's `item_picked_up:notes` lines for `derek_file` (erb:353-355) never fire. Before ddc2d668 the player saw the same thing (no file to read). The only difference now is a server record they can't see.
- The same path covers HaX's `#give_item:notes:catalogue_salvage_line` on the first line of `flag1_read` (`phone_agent0x99.ink:196`). An F5 in its round trip loses the coded line from the notepad. The drop screen still shows it (erb:1532), so that case isn't stuck.

**Why it matters.** The bin is the mission's main moral choice, and reading what you saved is the reward. R9 m2 meant to close this, and the engine change only closes the server half. Minor, because it needs an F5 inside a 1.5 s window.

**Fix (engine; voiced delta 0).** In the server-inventory restore, put a restored notes-family item into the notepad without the alert or events. In `inventory.js`, in the notes branch (:536), add `if (sprite._restoredFromSave) { addNoteQuietly(sprite.scenarioData); return { ok: true, reason: 'added' }; }`, where `addNoteQuietly` is `receiveRewardNote` (:259-280) minus the alert, the `setVariable` and the `item_picked_up` emit. `addNote` de-duplicates by title and base text (`notes-minigame.js:855-871`), so notes already in `savedNotes` don't double. Check one case in the browser: a world note the player has annotated. The base text before "Observation:" must match the item's `text`, or the restore adds a second copy. If it doesn't match, key the check on title only. Do this together with m2. Otherwise, in m2's split state, the restore would surface a file whose choice was never recorded.

### m2 (minor; mission-local). Once a bin reply is on screen, its `set_global`s wait for the gift's round trip, so an F5 there keeps the file and loses the choice

**Evidence.**
- When the 1.5 s gap ends, the reply is no longer pending and the unload hook is dropped (`person-chat-minigame.js:1139-1142`). `displayAccumulatedDialogue` then runs the reply's tags in ink order (:1229-1231). `processGameActionTags` handles them one at a time and awaits `giveItem` to the end of its server round trip (`chat-helpers.js:55, 113`). Only then do the next tags run.
- Every bin in m09 puts the gift first. `tagorder.cjs` prints `['give_item:notes:letters', 'set_global:cage_bin:letters', 'set_global:bin_chosen:true']` for the hatch letters reply, and the same order for all three hatch bins (`hatch.ink:100-104, 108-112, 120-124`), the four door-scene choices (`door.ink:51-54, 59-62, 71-74, 80-83`) and `handover` (`door.ink:92-94`).
- An F5 during that round trip (the request is keepalive now, so the gift lands) loses `cage_bin` and `bin_chosen`. On the hatch route, `bin_pulled` was saved with the choice, so the reload shows no bin buttons and the hub says "Take your time. The shredder won't." When the cage opens, HaX's mapping sets `cage_bin` to `derek_file` (erb:198). Walking in fires `handover` (erb:1817-1822, `!bin_chosen`): "You never chose, so take Mr. Lawson's file." The player who saved the letters now holds both files on the server. Tran's lever is gone (it reads `cage_bin`), and the debrief says the letters were shredded (erb:536). On Victoria's route, the door scene re-fires with its buttons (its onceOnly is saved only on a close). Picking the same file again gives "doesn't have notes (letters)" as a warning toast.
- R9's flush work fixed the same ordering inside `_flushPendingReply` (fast tags before slow, :1180-1199). The display path still runs in ink order.

**Why it matters.** The choice the mission asks the player to own is undone, and Sorensen tells them they never made it. The window is one server round trip (tens to hundreds of ms) after the reply appears, so it's minor.

**Fix (ink only, tags moved, no text change; voiced delta 0).** In each of the eight blocks, move the two `#set_global` lines above `#give_item`. Then the display path sets the globals synchronously before its first await, which matches the flush order. No m09 mapping needs the file in hand before `bin_chosen` or `cage_bin` changes: the only readers are conditions (erb:198, 367-370, 535-541, 848-850, 1810, 1819). If a give then fails, the result is the one the flush path already accepts (choice recorded, file not received). Recompile, re-run `sweep10.cjs` and `tagorder.cjs`, and check `tagdiff` shows only reordered tags.

---

## 3. The Esc, reopen and reload sweep (every m09 person-chat and phone ink)

`sweep10.cjs` (R9's model, unchanged, on the current JSON): 90 runs, **0 lost state tags**, 9 exceptions, all the known simulator artefacts (the hidden one-scene NPCs `door`, `handover` and `deck` have no `start`; the engine opens them only through their mappings). **Replayed gifts: 2, both `handover`, the same artefact R9 recorded** (the onceOnly mapping is gated on `!bin_chosen`, so it can't replay unless m2's split happens). The Noor replay is gone. The 24 "gift at risk on F5" rows are the bin gifts covered by m1 and m2.

| Ink | Esc / close | In-session reopen | Reload after Esc | F5, no close | Result |
|---|---|---|---|---|---|
| Sorensen hatch | clean | clean | clean | flush gap: **m1**; display gap: **m2** | 2 minors |
| Sorensen door | `disableClose` | n/a | clean | **m1**, **m2** | same two |
| `handover` | clean | none | clean | m1 (note only); m2 cannot arise here, as erb:198 sets the same `derek_file` | covered |
| Sorensen cage | clean | clean | clean (fate on line 1) | clean | Clean |
| Tran | clean | clean | clean | clean | Clean |
| Noor | clean | clean | clean | **clean now** (R9 m1) | Clean |
| Old Coyote, archive guard, Alpha clip | clean | clean | clean | clean | Clean |
| Briefing, debrief | `disableClose` | n/a | clean | clean | Clean |
| HaX phone | clean | reopencheck 0 problems / 1,362 reopens | clean | salvage line: m1 (screen backup) | Clean bar m1 |
| Recruiter, Nightshade, Torres, Gary | stubs replay `start` by design (reopencheck's 4 "problems", as R2–R9) | | | | Clean |

---

## 4. Fresh audit (skill Steps 2–5) on the current build

**4.1 Room depth and boss keys.** `room_depth.py`: 11 rooms, max depth 5 (`salvage_cage`), 11 lockType declarations. `staff_passage` has no NPCs or objects; the plan settles it as dressed and needed by the engine (PLAN §2, §7). No lock, key, code or connection has changed since R6, and the plan's §3 table holds lock by lock. The boss-key returns (plan cabinet, tape room, H&L box) keep their encounter, hunt and return. The clones spend m03's cloner, first on an easy card and then on a hard one. The safe is built for the cracker, with the ledger date as the observant player's shortcut.

**4.2 Choices that matter (3a).** `concludeRequires` is the four flag tasks (erb:722). The m01–m08 carry-overs still decide what is said and what opens: Sorensen's recognition lines (m01), Noor's three forms and the handed card (m05), Gary's keypad call (m02), Torres on the H&L box (m05), Victoria's maintenance code (m03), the tidied branch (m08) and Maya's warning line (m01). The bin decides Tran's lever, HaX's reading line and the debrief. Every one survives Esc, reopen and reload. The two edges are the F5 cases above, and both concern the bin.

**4.3 Capability, chain depth, "would it exist anyway" (3b–3d).** No change. I agree with the plan and R5–R9: all five start-kit classes are used. Vigenère is taught in three tiers and then reused with an inferred key. Every encoding has an author with a motive.

**4.4 Bug sweep (Step 4).**

| Check | Result |
|---|---|
| Ink | 15 recompiled, all identical to the committed JSON |
| `item_picked_up` keyed on id | None; all `item_picked_up:notes` with `data.itemId` |
| Author notes in text or observations | None |
| Observations stating a code | None |
| Stale comments | None left (§1, n1) |
| Validator (`--skip-ink --no-graph`) | Errors and warnings identical to R9's run (diffed) |
| dialoguelint | 5 `not-x-but-y`, 1 `you-after-choice`, unchanged from R9 |
| reopencheck | `agent_0x99` 0 problems; the four contact stubs replay `start` by design |

**4.5 Layout and pacing (Step 5).** No change, and sound.

---

## 5. Notes (not counted)

- **n1. Keepalive budget.** Browsers cap the *combined* in-flight keepalive bodies at 64 KiB, and they count bytes. `state-sync.js:5` and `inventory.js:443` each count UTF-16 characters against 60 000 on their own. In m09 the inventory body is under 1 KB, and the pagehide flush is a delta since the last sync, so the two together come nowhere near the cap. If an engine owner tightens this, count `new Blob([body]).size` and leave room for a gift already in flight. It's engine-wide, not m09.
- **n2. CONTRACT §15.** Once m1 and m2 are settled, add a round 10 paragraph. The round 9 paragraph's "m2 … handled elsewhere" should then point at ddc2d668 and at m1's restore change.

---

## 6. For phase 5 (browser checks, not findings)

- **m1, before and after the restore fix.** On the hatch, click "[Pull the letters through.]" and press F5 at once. After the reload, check `cage_bin` is "letters" and `bin_chosen` is true, and that the letters are in the notepad (they won't be before the fix). Repeat on Victoria's door scene (F5 only, since it has `disableClose`).
- **m2, before and after the tag move.** Throttle the network in devtools (Slow 3G) so the round trip is long. Click a bin, wait for Sorensen's reply line to appear, then press F5 before the "Received" toast. Before the fix, entering the cage should give "You never chose…". After it, `bin_chosen` should hold.
- **Noor (R9 m1).** On an m05 warned-in-time save, open Noor, wait on her hub without clicking, press F5 and talk again. There should be no toast, and one card.
- **Carried from R9 §6:** the flush toast on a closed chat, Dillard after a Restart versus a reload, the cage talk-down Esc on "She reads the label…" then a reload, forced HaX calls over an open person-chat, and everything R8 §6 carried from R7.

---

## 7. To close the phase

1. m2: move the `#set_global` tags above `#give_item` in the eight bin blocks (`hatch.ink`, `door.ink`). Recompile, run `tagdiff` (tags reordered only), `sweep10.cjs` and `tagorder.cjs`. Voiced delta 0.
2. m1: the engine restore change in `inventory.js`, with the browser check in §6. If the engine owner would rather not, record it as deferred: the cost is a file the player can't read after an F5 in a 1.5 s window, never a stuck mission.
3. n2 in CONTRACT §15.
4. Round 11 then confirms both. No other class of problem turned up this round.

Measured against m01_first_contact and m02_ransomed_trust.
