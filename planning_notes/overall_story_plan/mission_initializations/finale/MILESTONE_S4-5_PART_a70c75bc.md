Part covered: the m09 → m10 carry-over check (A, B), engine keys against the committed engine docs (C), NPC ids and start kits (D). Read-only review; no other file edited.

# Milestone S4–5 part a70c75bc: carry-over, engine keys, ids and kits

## 1. Counts (script-counted)

Taken from the first cell of each table row in FINALE_ARC (FA) §3, with multi-name rows counted per name and no duplicates within a tier.

| Count | Stated | Computed | Where stated |
|---|---|---|---|
| m09 imports, Tier 1 / Tier 2 / total | 19 / 25 / 44, plus 8 `completed` | 19 / 25 / 44 | FA:313, 337, 369, 888, 1741 |
| m10 imports, Tier 1 / Tier 2 / total | 40 / 50 / 90, plus 9 `completed` | 40 / 50 / 90 | FA:375, 415, 455, 888, 1742 |
| m10 Tier 1 by room | 40 | 40 (the same set as FA §3.2) | m10 RL:332, 357 |
| m09 Tier 1 by room | 19 | 19 (the same set as FA §3.1) | m09 RL:312 |
| Export additions to m01–m08 | 58 (38 + 15 + 5) | 3+8+3+7+6+5+6+20 = 58; base 38; F16+M-12 = 14+1 = 15 | FA:472, 474, 476, 1743 |
| m09 exports | 11, plus `m09_completed` | 11 (all 11 imported by m10: 5 Tier 1, 6 Tier 2) | FA:501; m09 MC:573; m09 S4:191 |
| Names `ko_pattern()` reads | "twenty-two" | 27 (m01 3, m02 6, m03 3, m04 2, m05 4, m06 3, m07 1, m08 5) | FA:538 |

**Stale counts in live text:**
- m10 MC:744: "m10 now imports **85** (Tier 1 40, Tier 2 45)". Should be 90 (Tier 2 50) since the stages 4–5 fold.
- m10 MC:370: `ko_pattern()` counts "seventeen Tier 2 imports". It reads 22 new names plus the m01 three, `m02_patient_assaulted` and `m04_robert_vance_ko` (27 in all).
- m09 MC:573: "m10's import count becomes 67". Superseded by 85 and then 90; mark it as history or update it.
- FA:924 (§9 decision log): "m09 exports seven values". The log has no supersede marker; FA:1025, 1429 and 1549 record the later counts.
- FA:538: "replaces a branch read of twenty-two names". The function reads 27.

Every other count found (FA:1427–1429, 1547–1549, 1632–1634; m10 MC:812, 921, 938; m10 arc:828; m09 SA:635) sits in a fold, history or outcome table and is marked as such.

## 2. Export and import check

No m10 doc or FA section reads an `m09_*` name that m09 does not export. No m10 or m09 doc reads any `m0N_*` name that is missing from its own FA import tables. The only stray outside §3 is FA:155, `casualties_occurred`, which is the cut Tier 3 name and marked as cut. m10 stage 0 and stage 4 have no import tables of their own: both defer to FA §3.2 (s0:158). m10 RL §5 lists the same 40 Tier 1 names as FA §3.2, and m09 RL §7 lists the same 19 as FA §3.1.

| m09 export | Values (FA §3.4) | m09 MC §10 / S4 set-site | m10 tier (FA §3.2) | Mismatch |
|---|---|---|---|---|
| `nightshade_shown_file` | bool | MC §4.1: asked in HaX's hub; S4:357 topic 10 | 1 | FA:489 says "HaX asks once at the plan cabinet", but MC:258–267 and S4:357 put it in the hub. S4:357 retires the topic on `nightshade_file_decided`, so after [Hold it.] the send is gone. MC:267 and FA:489 both say the send "stays in HaX's hub until the debrief" (F-04) |
| `sleeper_named` | bool | naming line / `resume_name` (S4:267, 271) | 1 | none |
| `sleeper_shortlist` | bool | `hl_placing_sheet.onRead` (RL:102) | 1 | none |
| `recruiter_offer` | `taken` / `double_crossed` / `named` / `refused` / `""` | first line `refused`; buttons (S4:265–269) | 1 | none; legal pairs agree everywhere |
| `deck_pulled` | `none` / `her_file` / `alpha_tapes` / `""` | first line `alpha_tapes`; buttons | 1 | none |
| `albion_notified` | bool | hub topic 2, debrief (S4:131, 205) | 2 | none |
| `hax_confession_answer` | `should_have_told` / `same_in_your_place` / `afterwards` / `""` | identity scene answer (S4:284) | 2 | none |
| `recruiter_secret` | `""` / `confessed` / `told` / `denied` / `kept` | first line by branch; owning or denying it overwrites `kept` | 2 | none |
| `reading_finished` | bool | `the_reading_last_page.onRead` (RL:166) | 2 | none |
| `cage_bin` | `derek_file` / `letters` / `nightshade_copy` / `""` | bin buttons; default on `cage_opened` (S4:177) | 2 | m10 use of `letters`: FA:442 and FA:498, m10 MC:535 and m10 arc:188 have **HaX's** line at the server-hall prop. m09 MC:570, m09 MC:639 (item 28) and m09 SA:886 say "**Tran's** handler line" (F-05) |
| `legacy_files_saved` | bool | `cage_opened` (Noor) or `npc_ko:sorensen` before `legacy_clock_run` (S4:178) | 2 | FA:499 reads "before the first of the plan cabinet opened" (garbled). m09 MC:571 and S4:178 still say "chest" (F-06) |
| `m09_completed` | bool | engine | 9 `completed` | none |

Value spellings were checked across all 13 docs. Every `alpha_tapes`, `her_file`, `none`, `taken`, `double_crossed`, `named`, `refused`, `kept`, `told`, `denied`, `confessed`, `derek_file`, `letters`, `nightshade_copy`, `should_have_told`, `same_in_your_place` and `afterwards` is spelled the same. The old working names (`alpha_tapes_saved`, `cage_bin_saved`, `tran_stopped`) appear only in rows marked as renamed or history.

## 3. Findings

No blockers. "Auth" names the document that wins.

| Id | Sev | Where | Problem | Fix (auth) |
|---|---|---|---|---|
| F-01 | major | m10 OT:203 (Ghost's handset mapping), OT:286 (the by-hand voice's ring and re-ring), RL:205 (`victoria_line`) | No `targetKnot` is named on any m10 voiced mapping. Under F20 (VOICED_CALLS §8), the call knots are the `targetKnot`s of the `voiced: true` mappings, so "a voiced contact with no start knot voices nothing". `resume` also falls back to `targetKnot` when no story is saved (TRIAL_CALLS_CREDITS §1). These contacts' `start` knots are gated home knots (RL:321), so an open with no knot would also land in the wrong place | Give every voiced ring and re-ring an explicit `targetKnot` that is not the home knot. Auth: engine doc; OT owns the wiring |
| F-02 | major | m10 RL:317–327 vs m10 s0:46, OT:73/129/146, RL:147 | The start kit has no CyberChef workstation, yet `decode_the_margin` (`casualty_margin_note`, "the CyberChef decode") needs one. No room object supplies one either. m09's kit has it (m09 RL:83, 282), and FA §4.0 (FA:553) says "the player's usual kit plus Kowalczyk's PIN cracker" | Add the CyberChef workstation (`type: "workstation"`, as m08 and m09) to m10's `startItemsInInventory`. Auth: FA §4.0 and m10 s0 |
| F-03 | major | m10 OT:286 | The by-hand cut's re-ring on `room_entered:power_room` carries `resume: true` but no `voiced: true`. `voiced` is per mapping (`params.voiced`), so a re-rung cut plays silent. Separately, when the voice is HaX the call shares her story with her other voiced calls (`stair_open`, `gallery_open`…), and each of those opens with an explicit knot that moves the saved position. A later `resume` can then restore the wrong place (TRIAL_CALLS_CREDITS §Limits, first bullet). The hub topic at OT:288 is the safety net, but it opens unvoiced | Put `voiced: true` and `targetKnot` on the re-ring. When the voice is HaX, re-ring with `targetKnot` and no `resume` (the sequence restarts cleanly). Auth: engine doc |
| F-04 | major | m09 S4:357 vs m09 MC:258–267, FA:489 | Topic 10 ("[Send Nightshade his file.]" / "[Hold it.]") retires on `nightshade_file_decided`, so [Hold it.] ends the choice. MC and FA say holding leaves the send in HaX's hub until the debrief. FA:489 also says HaX asks "at the plan cabinet", but MC says in her hub | Topic 10: after Hold, show only "[Send Nightshade his file.]" until `nightshade_shown_file` or the debrief; retire on send only. FA:489: "HaX asks once, in her hub". Auth: m09 MC §4.1 |
| F-05 | minor | m09 MC:570, MC:639 (item 28), SA:886 vs FA:442, FA:498, m10 MC:535, m10 arc:188 | The m10 payoff of `cage_bin = letters`: m09 says "Tran's handler line"; FA and m10 say HaX's line at the server-hall story prop | Change the three m09 places to "HaX's line at the server-hall prop (m10 places it)". Auth: m10 MC (m10-side behaviour, FA:1021) |
| F-06 | minor | FA:499; m09 MC:571; m09 S4:178 | FA's `legacy_files_saved` set-site reads "before the first of the plan cabinet opened or the player first leaving…" (garbled). MC:571 and S4:178 still say "chest", although SA:939 and FA:1737 renamed it "plan cabinet" | FA:499: "before the first of: Nightshade's file taken from the plan cabinet (`nightshade_file_held`), or the player first leaving the opened cage". The same wording, with "plan cabinet", goes in MC:571 and S4:178. Auth: m09 S4:178 (the mapping) |
| F-07 | minor | m10 MC:744, MC:370; m09 MC:573; FA:538; FA:924 | Stale counts (§1) | As §1. Auth: FA §3.2 tables |
| F-08 | minor | FA:1731; m09 S4:258, S4:633 (P12), S4:657; m09 SA:550, SA:914; m10 OT:21, OT:603; m10 s0:162 | F20 was committed in 24fcb06c ("a voiced phone call voices only its own knots"; log a1fa227c). FA:1731 still says "engine and tooling change in progress". m09 S4 says "in progress", "the boundary rule that doc will define" and "no `batch_generate` before it lands". m10 OT:603 says "the final boundary rule goes in that doc's new section". m10 OT:21, OT:603 and s0:162 describe the boundary as "up to the hub". The committed rule stops at the contact's **home knot**, which is its scenario `currentKnot` (default `start`), not at whichever knot is called the hub | Mark F20 committed (24fcb06c) and quote the home-knot rule. Each mission sets HaX's `currentKnot` to the hub knot, or makes sure no voiced knot diverts into `support_hub` (m09 already does the latter: S4:258, S4:342). Auth: VOICED_CALLS §8 |
| F-09 | minor | m10 MC:309, MC:730 vs m10 RL:85, FA:664 | `malhotra_ko` is written by `globalVarOnKO`, but `malhotra_post` is `koImmune`. The global can never be set, and the validator warns on the pair (TRIAL_KO_COUNTDOWN §1). Its readers (staging, 06:00, credits) carry dead branches | Drop `malhotra_ko` from MC §12 and its readers, or say it stays `false`. Auth: m10 RL (`koImmune`) |
| F-10 | minor | m09 S4:416–428 (closing card), S4:430–442 (credits) | Card and credit conditions are written bare (`recruiter_offer === 'taken'`, `!sleeper_named && sleeper_shortlist`, `noor_ko`). The engine evaluates music and credits conditions as JavaScript over `globalVars` (TRIAL_CALLS_CREDITS §2; m10 OT:23 and F-17 always write `globalVars.`) | Prefix every condition with `globalVars.` in S4 §9, or add a note that stage 9 does. Auth: engine doc |
| F-11 | minor | m09 RL:80, S4:338, S4:719 (`netherton`) vs m10 RL:79, m08 `scenario.json.erb:1411` and the F17 trial (`director_netherton`) | Netherton has a different NPC id in m09 from m08 and m10. The TTS cache keys on voice, not id, so audio is unaffected, but `--carry-npc`, `conversation_closed:<id>` and co-speaker checks would differ | Use `director_netherton` in m09 (rename rule; note it in the stale docs). Auth: m08 precedent and m10 |
| F-12 | minor | m09 RL:80, RL:348, RL:409 (`hax_voice`) vs m10 OT:246, SE:318 | m09 adds a hidden person-type `hax_voice` "so she can speak inside person-chats". m10 has HaX speak inside Tesseract's person-chat with no such record. The engine resolves a person-chat prefix against `window.characterRegistry`, which holds every registered NPC, phone contacts included (`person-chat-minigame.js:112-117`, `character-registry.js:34`), so m10's way works. m09's record is probably redundant, and it adds a second "Agent HaX" display name (first match wins) | Stage 9 checks one case in the browser and picks one pattern for both missions. If the registry path holds, drop `hax_voice`. Auth: engine |
| F-13 | minor | m10 OT:197 (`breach_call`, "the narrator gives the crank"), OT:605 | Narration in a voiced call is silent (VOICED_CALLS §2). m10 accepts this (OT:605). m09 instead rewrote every narrator line in a voiced call as HaX's aside (S4:258). The two missions handle the same case differently | Either make the crank HaX's or Netherton's line, as m09 does, or keep it and note that the choice was deliberate. Auth: m10 OT, which already states it, but stage 7 should pick one rule |
| F-14 | minor | m10 OT:185, OT:232 vs m09 S4:158 (row 2) | m10 says `door_unlocked` also fires on "the touch of an already-open door" and guards its outer-lock mapping with `!outer_lock_open`. m09 sets `cage_opened` on `door_unlocked` with no `!cage_opened` guard. `setGlobal` re-emits even when the value is unchanged (m09 S4:306), so a second emit replays the `cage_opened` chain. The Noor `legacy_files_saved` mapping has no guard. I could not confirm the re-emit claim from `unlock-system.js:660-680` alone | Add `&& !globalVars.cage_opened` to m09 row 2's mapping (it costs nothing either way), and have stage 9 confirm the m10 claim. Auth: engine |
| F-15 | minor | m10 arc:542 | "with KO immunity as an engine item and the KO resume order as the fallback". The fallback was withdrawn (S4-8; m10 MC:336; FA:571) | Delete "and the KO resume order as the fallback". Auth: m10 MC:336 |
| F-16 | minor | FA:879 | The teaser can be "the `closingCard.teaser` lines, or a short cutscene". The engine's teaser is lines only, gated by one global (`enabledBy`). It cannot be per-ending; m10 skips it on `executed` and `joined` by leaving it off those music entries (OT:369) | Drop "or a short cutscene", or mark it as needing engine work, and say the per-ending skip is per music entry. Auth: TRIAL_CALLS_CREDITS §2 |
| F-17 | minor | m09 S4:715, m09 RL:505 | Review-outcome rows B-R2-1 still read "Fixed (ruling): … `#add_note`" with no marker that N-R3-1 superseded them. Every other `#add_note` mention is either history or says "not used" (F21) | Add "(superseded by N-R3-1: `#give_item`)" to both rows. Auth: F21 |

**Checked and clean:**
- `unlockDoor` is always a room id on an NPC (HaX) eventMapping, and done-flags are set from `door_unlocked_by_npc` with `data.roomId` (and `data.npcId === 'agent_0x99'` in m10). Player-opened locks use `door_unlocked` with `data.connectedRoom`, as the engine emits.
- No live `#add_note`.
- No `door_unlocked:<room>` suffix form.
- `koImmune` never appears alongside `taskOnKO` or `globalVarOnKO` on the same record, apart from F-09.
- `closingCard` shape: lines with conditions, at most five, teaser via `enabledBy`, credits `section` / `people` / `clauses`.
- `silence` is a playlist key.
- `#remove_npc` appears only in "never `#remove_npc`" (FA:301).
- The `--start-room`, `--carry-npc`, `--complete-task` and `--submit-flag` flags all exist in `tools/playtest/README.md`.
- `room_exited` carries `nextRoom` (`rooms.js:3011`), as m09 S4 §6.1 relies on.
- F20 (no voiced knot diverts into a hub): no live text describes a voiced knot falling into HaX's hub. m09 states the opposite explicitly (S4:258, 342).
- NPC ids are the same between stage 4 and stage 5 of each mission (every id S4 uses in an event pattern exists in RL). Start kits agree between s0, S4, RL and FA §4.0 for m09. For m10 they agree apart from F-02.

## 4. For stage 6 and stage 7

- **Stage 7 (ink):**
  - Every voiced call knot ends `#exit_conversation` or diverts only to other call knots, never to the contact's home knot (F20).
  - A narrator line inside a voiced call is silent (F-13).
  - Each voiced mapping names its `targetKnot` (F-01).
  - m09's `deck_resume` include and the Recruiter's `call` share outcome lines, which is fine: the cache keys on text.
- **Stage 7 (wording):**
  - The `letters` payoff in m10 is HaX's line at the server-hall prop (F-05).
  - m09 topic 10 needs a send-only form after Hold (F-04).
- **Stage 6:** nothing in this part touches the VM.
- **Stage 9:**
  - Prefix the m09 card and credit conditions with `globalVars.` (F-10).
  - Add CyberChef to m10's kit (F-02).
  - Check `hax_voice` against the character registry (F-12) and the "already-open door" re-emit (F-14).
  - Rename m09's `netherton` to `director_netherton` (F-11).
