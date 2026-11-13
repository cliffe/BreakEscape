# m09 Digital Archaeology: puzzle chains, round 9 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 7fe4be4e ("puzzle chains round 8 fixes"). The committed person-chat pending-reply flush (4af6a328) is in effect. No commit since 7fe4be4e touches an m09 file. The one rendered difference from R8's JSON is the Dillard `_comment`.

**Method.** I read the R8 review, the 7fe4be4e diff and the 4af6a328 engine change (`person-chat-minigame.js` `_deferReply` / `_flushPendingReply`, `person-chat-pending-reply.js`). I also read the engine's save points (`saveNPCState` call sites, `npc-conversation-state.js` `exportNpcInkVariables`, `state-sync.js` pagehide), the phone-chat continue and reopen paths, `npc-hostile.js` (reload restore and Restart reset) and the give path (`chat-helpers.js`, `npc-game-bridge.js`, `inventory.js`). I recompiled all sixteen inks with inklecate, and each is identical to the committed JSON. I re-ran R8's `fixtest.cjs` and wrote a new sweep, `sweep9.cjs`. For every person-chat ink and entry knot, it walks every choice path to depth 3 over 90 global presets (route presets plus seeded random ones). It closes after every reply line under three modes (Esc then in-session reopen, Esc then reload, F5 with no close), using the engine's flush semantics. It checks for exceptions, lost state tags and replayed gifts. I also ran `reopencheck`, `dialoguelint`, `room_depth.py` and the validator (`--skip-ink --no-graph`). I opened no VM plan, SecGen file or field guide; the VM flags are black boxes. I did no browser run. Scratch files are in the session scratchpad under `m09_pc_r9/`.

**Counts: 0 blockers, 0 majors, 2 minors.**

**Verdict: not yet complete.** R8's m1, m2, n2 and n3 are fixed and introduce nothing new. The engine flush closes R8 m3 for an Esc, and R8's own fix proves out under it. Two small gaps remain, both on the reload path, and both end in a gift:
- Noor's card guard is an ink-local, so it isn't saved before her first conversation's first click or close. An F5 in that window brings the toast back (m1). The fix is one line in the erb.
- On an F5 in the bin choice's 1.5 s gap, the flush sets the globals, but the gift's server request can be cancelled by the unload (m2, engine).

---

## 1. R8 items and the brief's checks

| Item | Where now | Status |
|---|---|---|
| R8 m1, Sorensen's talk-down | `m09_sorensen_cage.ink:62-66`: `#set_global:sorensen_fate:talked` above the narrator line | **Fixed.** inkjs: the lever's first line carries the tag. A reload after it gives "She's writing in pencil…" with only "[I'm done here.]", and the fate is set. With 4af6a328, an Esc in the 1.5 s gap flushes the tag (state tag, fast batch), so the gap that R8 m1 and m3 shared is closed too. The sweep finds no lost tag on any cage path |
| R8 m2, Noor's card | `m09_noor_haddad.ink:20, 41-47` | **Fixed for Esc then reload.** Closing on line 1, 2 or 3 and reloading replays the opening with only `#complete_task:meet_the_clerk`. Every other route (warned late, not warned, ledger page) has no `#give_item`, and the sweep finds no replayed gift there. **The F5 path without a close is still open: m1 below** |
| R8 n2, Alpha clip | `m09_alpha_recording.ink:24-26` | **Fixed.** The tag rides Tesseract's second line. An Esc during HaX's reply keeps the credit. An Esc on his first line leaves it unset, and the deck replays on every use (`triggerOnInteract`) |
| R8 n3, doc drift | CONTRACT §3.2 (:227), §3.4, erb:1288 | **Fixed.** CONTRACT §15 (:850) records round 8. It still says m3 "has gone to the user". Add a line that it landed as 4af6a328 (n2 below) |
| R8 n1, Victoria's route Esc on the first HaX bin line | `m09_sorensen_hatch.ink:76` | Unchanged and settled. The flush doesn't touch it (it's a displayed line, not a pending reply) |

### 1.1 Tunnels (brief item 2)

There is one tunnel in m09: `tran_warning` (`m09_phone_agent0x99.ink:135-145`), called once from Tran topic 17 (:824). It holds **no choices**, only a three-arm conditional line and `->->`. The phone runs a reply synchronously to the next choice point (`phone-chat-minigame.js:661-700` loops `conversation.continue()` until choices or the end). So the tunnel is entered and left in one pass, and the saved story always rests on `support_hub`'s choices, never inside the tunnel frame. A phone reopen re-navigates to the knot that owns the first choice (`phone-chat-conversation.js:603-682`), which is `support_hub`. No person-chat ink uses a tunnel or a thread (`<-`). `reopencheck` on `agent_0x99`: 0 problems over 1,617 reopens. **Clean.** m10's tunnel-with-choices failure can't happen here.

### 1.2 The PLACEHOLDER comments (brief item 3)

Every `PLACEHOLDER` comment in the erb, checked against `ASSET_LIST.md` and `public/break_escape/assets/`:

| erb line | Says | Actually in the game | Real placeholder? |
|---|---|---|---|
| 766 | labUrl (ASSET_LIST §7) | The four field guides (:771, 778, 785, 792) point at `…/labs/safetynet/m09-digital-archaeology/…`. No m09 page exists in `HacktivityLabSheets/_labs/safetynet/` | **Yes**, deferred by the standing rule that lab sheets come last. A player who opens a guide now gets a missing page. That belongs to the lab-sheet stage, not here (n1) |
| 944, 952 | raid team sprites | `marisol_quintero`, `halina_kowalczyk`, `dev_malhotra`, `kenji_arakawa`: sheet, `_talk`, `_visemes` and `_headshot` all exist. ASSET_LIST §1.2 marks them done | No: stale |
| 969, 999 | cutscene backgrounds | `m09_briefing_blended.png` (erb:992) and `m09_hangar_blended.png` (erb:1025, 1049) exist | No: stale |
| 1092, 1205, 1388, 1609, 1720 | Noor, Old Coyote, Tran, Sorensen ×2 art | `noor_haddad`, `cody_old_coyote`, `jesse_tran`, `margaret_sorensen`: all files present, ASSET_LIST §1.2 done | No: stale |
| 1672 | stamp sprite | `position: "as-type:m09_rubber_stamp"` matches the map's placed stamp (`room_m09_restricted.json`, `conditional_table_items`, gid 1359 = `m09_rubber_stamp2.png`). `rooms.js:2206-2217` builds the sprite from that match, so `office-misc-stapler` is only the type | No: stale |
| 2166 | Alpha clip speaker | `adrian_tesseract` set present | No: stale |

The one real art-or-asset placeholder left that is not in the list above is audio: the shredder `ambientSound` is still `server_room_ventilation` (erb:1599, 1713; ASSET_LIST §5, no `shredder_loop.mp3`). That belongs to the audio stage. Ten stale comments are tidy-up (n1).

### 1.3 Hostility after a reload versus a Restart (coordinator's correction)

A reload restores hostility and knock-outs (`npc-hostile.js:8-30`, `state-sync.js:158-160`). A Restart after the player is knocked out calms every hostile NPC that isn't knocked out (`resetHostilesForRespawn`, `npc-hostile.js:100-127`).
- **Dillard after a reload.** Hostile again; the catch-up mapping re-shows him (erb:1320-1324). Matches what the player left.
- **Dillard after a Restart.** Calm at (3.5, 8), visible through the same catch-up. His `tran_alerted` mapping is onceOnly and was saved when his chat closed, so it doesn't re-open. Talking to him plays `start` again, and `#hostile:archive_guard` rides his only line (`archive_guard.ink:11-12`), so he turns again with "Stay where you are." A player who leaves him alone walks past a calm guard. That's the Restart's intended reprieve, and he is "Avoidable" by design.
- **Nothing in m09 reads hostility as state.** Only the music trigger does (erb:449). The fates use `npc_ko:*` (erb:216-232), and a KO survives both paths.

**Clean.**

---

## 2. Findings

### m1 (minor). An F5 during Noor's first conversation, before the first click or close, replays her card hand-over and shows "⚠️ NPC noor_haddad has no items to give"

**Evidence.**
- Person-chat saves an NPC's ink variables only on a choice (`person-chat-minigame.js:1072-1074`), on a close (`cleanup`, :1858-1863) or at an end. Nothing saves them while the opening plays or while the hub waits, and nothing saves them on page unload. `exportNpcInkVariables` (`npc-conversation-state.js:221-236`) sends only what `saveNPCState` stored.
- Warned in time, `~ noor_card_given = true` and `#give_item:keycard:noor_staff_card` run on her first line (`noor.ink:43-46`). The gift is recorded on the server, which then filters the card out of her `itemsHeld`. `noor_card_given` and `noor_opened` are ink-locals, so an F5 before the player's first click or Esc loses both. `noor_met` survives, because it is a synced global.
- On the next talk, `start` replays and the `else` arm gives again. The bridge answers "NPC noor_haddad has no items to give" (`npc-game-bridge.js:224-225`), and the tag handler shows it as a warning (`chat-helpers.js:113-119`). `sweep9.cjs` reports this as the only replayed gift in m09 (the `handover` hits are a simulator artefact: its mapping is onceOnly and gated on `!bin_chosen`).
- The window is the whole first conversation up to the first click: her three lines, plus however long the player sits on the hub.

**Why it matters.** The same fiction break R8 m2 fixed, on the m05 warned-in-time payoff. It needs an F5 (or a crash or tab close) with her chat open, so it's minor.

**Fix** (one line in the erb; no ink text change, voiced delta 0). Make `noor_card_given` a scenario global: add `"noor_card_given": false` to `globalVariables` next to `noor_met` (erb:2541). The ink assignment at `noor.ink:44` then reaches `gameState` straight away (`observeGlobalVariableChanges`, `npc-conversation-state.js:556-590`). The pagehide sync sends it, and the next open syncs it back into the story before `start` runs. Checked in inkjs (`fixA/`): after an F5 the replay carries only `#complete_task`, and the sweep with the change reports no Noor gift. Update the comments at `noor.ink:20, 33-34` ("synced global", not "ink-local") and CONTRACT §3.2 (:227). Leave it out of the m10 export list unless m10 needs it.

### m2 (minor; engine). An F5 in a bin choice's 1.5 s gap sets `cage_bin`, `bin_chosen` and `bin_pulled`, but the file's gift can be lost

**Evidence.**
- On `beforeunload`, `_flushPendingReply` runs the fast tags (`set_global`) at once, then `give_item`. The commit's own comment calls the server write "best-effort" there.
- `give_item` reaches `addToInventory`, whose POST (`inventory.js:431-443`) has no `keepalive`. Browsers may cancel an ordinary fetch the page starts while it unloads. The globals go out on state-sync's keepalive pagehide request. `bin_pulled` was saved by `handleChoice` (:1072-1074) and goes out with the ink variables.
- After the reload at the hatch: no bin buttons (`hatch.ink:100, 108, 120`), the greeting "You have your file.", and nothing in the notepad. HaX's `item_picked_up:notes` lines for `derek_file` (erb:354) never fire. Tran's lever still works, because it reads `cage_bin` (`tran.ink:53`). The door scene's three bins have the same exposure (`door.ink:52-83`). It is traced in code only.

**Why it matters.** The bin is the mission's busiest choice, and the file is the reward for making it. The window is a 1.5 s F5, so it's minor. It belongs to the engine and covers every mission's `give_item` on a reply's first line.

**Fix** (engine). Add `keepalive: true` to the inventory POST in `addToInventory` (`inventory.js:431`). The body is small, well inside keepalive's 64 KB. Then the flushed gift survives the unload, as the globals already do. Prove it in a browser: click "[Pull the letters through.]", press F5 at once, and check the notepad and `cage_bin` after the reload. If the engine owner would rather not, record m2 as deferred. The m09 cost is a lost reading item, never a stuck mission.

---

## 3. The Esc, reopen and reload sweep (every m09 person-chat and phone ink)

The engine model is as of 4af6a328. **Post-choice gap** is now "flushed on close". F5 adds the no-save window.

| Ink | Esc / early close | In-session reopen | Reload (after Esc) | F5, no close | Post-choice gap | Result |
|---|---|---|---|---|---|---|
| Sorensen hatch | opening; mid-`recognition` | `opening` re-entered; mid-knot continues | opening replays (R7) | opening replays; `hatch_talked` idempotent | bins flushed | **m2** (gift on F5 only) |
| Sorensen door | `disableClose` | n/a | mapping re-fires (trigger saved only on close) | same; bins flushed | flushed | **m2** (gift on F5 only) |
| `handover` | tags above its line | none | onceOnly saved on close; `bin_chosen` blocks it | `bin_chosen` blocks it | no choice | Clean |
| Sorensen cage | opening; lever | continues | opening replays; lever keeps its fate | same | fate on line 1, flushed | Clean (R8 m1 fixed) |
| Tran | opening; `deal` | continues; `deal` re-entered | opening replays; `deal` → hub → lever | same | "[Go.]" flushed | Clean |
| Noor | opening; `cover`; `reach` | continues; re-entered | one gift (R8 m2 fixed) | **gift replayed** | "[Not tonight…]" flushed | **m1** |
| Old Coyote | `challenge`; walk-up | count 2; hub "What's up?" | count and cover restored | walk-up greeting replays (no tag) | truth flushed | Clean |
| Archive guard | the line | n/a | hostile restored (§1.3) | same | no choice | Clean |
| Alpha clip | mid-recording | repeatable on every deck use | same | same | no choice | Clean (R8 n2 fixed) |
| Briefing, debrief | `disableClose` | n/a | debrief backstops on `room_entered` | same | `disableClose` | Clean |
| HaX phone | tags processed before the type-out (`phone-chat-minigame.js:743-770`) | reopencheck 0 / 1,617 | voiced calls re-ring on `game_loaded` | phone state synced with position | n/a | Clean; tunnel §1.1 |
| Recruiter, Nightshade, Torres, Gary | same | the four stubs replay `start` by design | as R2–R8 | same | n/a | Clean |

Sweep totals: 90 runs, 0 lost state tags, 0 real exceptions. Nine are simulator artefacts: the hidden one-scene NPCs `door`, `handover` and `deck` have no `start` knot, and the engine opens them only through their mappings. One real replayed gift (m1), and six bin gifts at risk on F5 (m2).

---

## 4. Fresh audit (skill Steps 2–5) on the current build

**4.1 Room depth and boss keys.** `room_depth.py`: 11 rooms, maximum depth 5 (`salvage_cage`), 0 empty rooms, 11 lockType declarations. My own list from the rendered JSON gives the same eleven locks as the plan's §3 table: the `front_desk` key, `hl_box` HL2015-0477, the `staff_passage` RFID, `restricted_stacks` `stacks_release`, `restricted_cage` `stacks_card`, the biometric `plan_cabinet`, the office password, the safe PIN 060216, `tape_room_reader`, LEWISANDCLARK and the `beta_crate` key. No lock or erb logic has changed since R6, and every verdict holds.

**4.2 Choices that matter (3a).** `concludeRequires` is still the four flag tasks (erb:722). The m01–m08 payoffs reach their outcomes on first play, on an Esc and reopen, and on an Esc and reload: the recognition lines, Noor's three forms, Tran's lever on the letters, Old Coyote's covers, Victoria's door, Gary and Torres. With the flush, the outcome-bearing choices keep their tags through a close in the gap: the bin, the talk-down, Tran's "[Go.]", Noor's "[Not tonight…]" and Old Coyote's truth. What's left is the two F5 edges above.

**4.3 Capability, chain depth, "would it exist anyway" (3b–3d).** No change. I agree with the plan and R5–R8:
- all five start-kit classes get used;
- the cloner goes from an easy card to a hard one;
- Vigenère is taught in three tiers, then reused with an inferred key;
- the safe is built for the cracker;
- every encoding has an author with a motive.

**4.4 Bug sweep (Step 4).**

| Check | Result |
|---|---|
| Ink | All sixteen recompiled files identical to the committed JSON |
| `item_picked_up` keyed on id | None: eight `item_picked_up:notes` mappings, all by type |
| Author notes in text or observations | None (`[LORE`, `[NOTE`, TODO, FIXME: 0) |
| Observations stating a code | None. HL2015-0477 appears only in the drop screen's `textVariants` after flag 2, which is the designed clue |
| Stale comments | Ten `PLACEHOLDER` comments (§1.2, n1) |
| Validator (`--skip-ink --no-graph`) | The same 23 issues, 13 wiring warnings and 6 missing-field notes as R2–R8 |
| dialoguelint | 5 `not-x-but-y`, 1 `you-after-choice`, unchanged lines from earlier passes |
| reopencheck | `agent_0x99` 0 problems over 1,617 reopens; the four contact stubs replay `start` by design |

**4.5 Layout and pacing (Step 5).** No change, and sound.

---

## 5. Notes (not counted)

- **n1. Stale comments and deferred placeholders.** Ten `PLACEHOLDER` `_comment`s describe art that is now final: erb:944, 952, 969, 999, 1092, 1205, 1388, 1609, 1672, 1720 and 2166 (the two raid-team lines are one template). Reword them as R8 did for Dillard ("Art: <key> (ASSET_LIST §1.2, done)"). Keep erb:766: the four field-guide `labUrl`s really are placeholders until the lab-sheet stage. The shredder's ambient sound is a real audio placeholder (ASSET_LIST §5) for the audio stage.
- **n2. CONTRACT §15** (:850) says m3 "has gone to the user". It landed as 4af6a328, so add a round-9 line saying so.
- **n3. A flushed reply's first line is never shown.** After an Esc in the gap, an in-session reopen continues from line 2, and the context line is the one before the choice. After a reload, the rest of the reply is gone. The tags are safe, so only words are lost. The longest loss is the letters branch, where HaX's "Arakawa's ringing Butte." is the player's confirmation that the letters went out. It's cosmetic and an engine-wide trade-off. Leave it.
- **n4. The brief's engine background** said a reload doesn't restore hostility. That is out of date, as the coordinator confirmed; §1.3 is judged on the current code.

---

## 6. For phase 5 (browser checks, not findings)

- **The 4af6a328 flush on m09's bins.** In auto and click-through modes, click "[Pull the letters through.]" and press Esc within a second. Check that `cage_bin` is "letters", `bin_chosen` is true and the letters are in the notepad once, and that no "Processing action tags" log appears after the close. Repeat in the door scene on Victoria's route (`disableClose`, so F5 only).
- **m2.** The same click, then F5 at once: is the file in the notepad after the reload? Run it before and after the `keepalive` change.
- **m1 after the fix.** On an m05 warned-in-time save, open Noor, wait on her hub without clicking, press F5, then talk to her again. There should be no toast, and the card should be held once.
- **A flush toast on a closed chat.** Does the "📦 Received" notification from a flushed gift show, or throw quietly, once the person-chat UI has gone?
- **Dillard after a Restart.** Get knocked out by him on the m01_maya_ko route and choose Restart. Is he calm at his post and visible, and does talking to him turn him again with his line? After a plain reload, is he hostile, with the threat music back?
- **Carried from R8.** The cage talk-down Esc on "She reads the label…", then a reload (fate `talked`, still writing in pencil). Forced HaX calls over an open person-chat. And everything R8 §6 carried from R7.

---

## 7. To close the phase

1. m1: add `noor_card_given` to `globalVariables`, and fix the two ink comments and CONTRACT §3.2. Recompile (comments only, so the ink JSON should not change), run the validator (expect the same 23 items) and re-run `sweep9.cjs`.
2. m2: `keepalive: true` on the inventory POST, with a browser check. Or record it as deferred with the reason above.
3. n1 and n2 doc touches. Voiced delta 0. Add a CONTRACT §15 "Puzzle chains round 9" paragraph.
4. Round 10 then only needs to confirm m1 (F5 at Noor's hub) and m2 (F5 after a bin), both browser-bound. The sweep found nothing in the Esc, reopen or reload classes, which is where rounds 5–8 found their problems. The remaining edges are about page unload, and the engine change has narrowed them to the two gifts above.

Measured against m01_first_contact and m02_ransomed_trust.
