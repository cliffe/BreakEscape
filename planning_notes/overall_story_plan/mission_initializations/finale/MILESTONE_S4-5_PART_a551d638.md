Part covered: FINALE_ARC §4–§9 (live text; §9 log only where it contradicts), §13 and §17–§18, cross-checked against m09 and m10 stage 4 `objectives_tasks.md` and stage 5 `room_layout.md`. §1–3 grepped only.

# Milestone S4–5 consistency check (part a551d638)

## Counts

16 findings (A-01 to A-16): no blockers, 2 major (A-01, A-05), 14 minor. Handover: 6 stage 6 items, 20 stage 7 items.

## Findings

Paths: FA = `finale/FINALE_ARC.md`; m09 S4 / RL and m10 OT / RL = the stage 4 `objectives_tasks.md` and stage 5 `room_layout.md` of each mission. Line numbers are as of commit 9f21ba84's working tree.

| id | sev | where | problem | fix (authority) |
|---|---|---|---|---|
| A-01 | major | FA:900 (§8 r13) vs m10 OT:195, m10 RL:23–30, 71 | The fallback "if the VM can't fit, flag 1 moves to the security office terminal" is now impossible: the breach (blast door) waits on `flag1_submitted`, and the security office is past the blast door, so that move would deadlock the route. | Reword r13's default: if flag 1 can't be the security monitoring foothold, its meaning changes, its station stays the gate terminal. m10 OT §4.1 / RL §2.1 are authoritative. |
| A-02 | minor | FA:563 (§4.0 route: "the breach opens on flag 1 **and** `door_scene_done`") and FA:555 ("the breach waits on flag 1 and that flag") vs FA:557 and m10 OT:195 | Both omit the third half, `pair_back`. FA:557 and OT §4.1 have all three. | Add "and the pair back" in both places. OT §4.1 authoritative. |
| A-03 | minor | FA:565 (§4.0 "Forced scenes and nets") vs m10 OT:211–214 | Lists the story doors' conditions as `door_scene_done`, `ghost_call_done`, flags, `gallery_shutter_cut`. Misses `pair_back` (breach) and the inner door's own rule: opens on `room_entered:blast_tunnel` with `!tripwire_armed`, or on `ladder_used` on the tripwire route. | Add both. OT §4.1, §4.3 authoritative. |
| A-04 | minor | FA:636 (§4.4 Nightshade row, way round: "the security office reopens the door") vs m10 OT:212–214, RL:100 | The way round on the tripwire is the guard post's ladder up to the office's back corridor and its manual release. "The security office reopens the door" doesn't name the ladder the player must find. | "the ladder at the tunnel post, up to the office's manual release". OT §4.3 authoritative. |
| A-05 | major | FA:909 (§8 r22 "F20 ('only the call') is in progress") and FA:1731 (§18 "F20: decided, engine and tooling change in progress") vs `git log` 24fcb06c "Engine: a voiced phone call voices only its own knots" and dev log a1fa227c "F20 committed" | F20 is committed, before FA's own §18 fold (c920a64d). FA also never states F20's rule. The stage docs carry the same stale status: m09 S4:5, S4:258, m09 RL:5, RL:422 ("being built", which also predates F17–F19's 57d3d237 commit), m10 OT:603 ("the final boundary rule goes in that doc's new section"). | FA §8 r22 and §18: "F20 committed (24fcb06c): a voiced call voices its start knots and every knot reachable from them, never the contact's home knot." Stage docs to follow at their next fold. `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8 is authoritative. |
| A-06 | minor | m10 OT:603–619 vs m09 S4:258, user F20 | m09 makes every voiced knot end `#exit_conversation` and never divert into the hub; m10 OT §13 counts "the call's knot and its diverts up to HaX's hub" and doesn't require the `#exit_conversation` ending. Under the committed rule the home knot is never voiced, so m10's count holds, but the two missions write voiced knots to different rules. | Stage 7 writes m10's voiced knots (`breach_call`, `stair_open`, `inner_door`, `tripwire`, `ladder`, `gallery_open`, the flag 4 lines, Ghost, Victoria, the cut) to m09's convention. Engine doc §8 authoritative; FA should say it once in §6.1. |
| A-07 | minor | FA:852 (§6.1 forced-phone rule, m10 sentence), FA:757–758 (§5.1 Ghost, Victoria) vs m10 OT:601–619, RL:205 | FA says which m09 calls are voiced but not m10's. OT §13 voices Ghost's handset call, Victoria's secure line, the by-hand cut (Vance, Elena or HaX), and HaX's `breach_call`, door, `gallery_open` and flag 4 calls (about 85 lines). Only the cut is marked voiced in FA (FA:641). | One sentence in §6.1's m10 part listing the voiced m10 calls, citing OT §13. |
| A-08 | minor | FA:856 (§6.1 purge item 1: the legacy box goes "at the first of the plan cabinet opened or the player first leaving") vs m09 S4:178, m09 RL:405 (item 19–20) | The trigger is the file's pickup (`nightshade_file_held`), not the cabinet opening. Small gap a player can sit in (cabinet open, file not taken). m09 S4:178's own row title still says "first of the **chest**". | FA: "the first of Nightshade's file taken from the plan cabinet or…". m09 S4:178: "chest" → "file". m09 S4 §4 authoritative. |
| A-09 | minor | FA:893 (§8 r6 cut order and never-cut list) vs m10 OT:426–428 | FA's m10 cut order omits OT's second item ("Victoria's line as goodwill only") and gives idle lines without "down to one"; FA's never-cut list omits "the walkabout's first pick". | Copy OT §8's order and list. OT authoritative. |
| A-10 | minor | FA:1279 (§13 item 45, timed VM run "before stage 7"), FA:893 vs m09 S4:652 ("before stage 8 sets the published length") | m10 and FA put the timed run before stage 7; m09 S4 says before stage 8. | m09 S4 §15 item 3 to say "before stage 7", matching FA and m10 OT §8 (FA §13 item 45 authoritative as the cross-mission rule). |
| A-11 | minor | FA:1277 (§13 item 43) | Status "Closed (F21 …)" but the Owner column still reads "User; m10 stage 7 or 9". | Owner "–". |
| A-12 | minor | FA:1252 (§13 item 18) | Status cell reads "Rule settled (§4.1); the lines", an unfinished phrase. | "Rule settled (§4.1); the lines are stage 7's". |
| A-13 | minor | FA:909 (§8 r22) | Two stale/garbled spots: the stage 3 list still says "KO immunity for Tesseract and the forced-scene NPCs, with `npc_ko` safety nets as the fallback (engine 36)" (the nets are retired, S5-8), and the closing sentence "Open for the user, none blocking (F21 is closed: see §13 item 43); an optional replay…" has lost its list lead-in. | Mark the nets "(fallback retired, §13 item 41)"; rewrite the last sentence as "Open for the user, none blocking: an optional replay of `pending_events` after `game_loaded` (§13 item 44), and optional ambient sound or music volume by global. F21 is closed (§13 item 43)." |
| A-14 | minor | FA:798 (§5.3, first list of rooms) vs FA:798 (same paragraph, corridor order) and m10 RL:21–30 | The first list gives "security office …, blast-door tunnel" in that order; the corridor runs forward post → blast tunnel → security office. | Reorder the first list to match RL §1. |
| A-15 | minor | FA:135–136 (§2 rows 32, 33, "gone by the far stair"), listed open at FA:1756 | Still live. With the gallery a straight walkway (stair west, lock east, m10 RL:213), "the far stair" from the lock end means the only stair, which reads oddly; the leaving NPC must walk past the player. | Stage 7 (or m10 MC §3.5): "back down the stair". Not mine to settle (§1–3), recorded here because §18 hands it on. |
| A-16 | minor | FA:639, FA:816, FA:852 ("re-rings once at the (gallery-)stair exit") vs m10 RL:205 | RL re-rings on `gallery_open` (the stair opening) while the player is still in the hall, and abandons the call on `room_entered:gallery`. "At the stair exit" suggests the trigger is leaving. Same beat, different trigger. | "re-rings once as the gallery stair opens". RL §2.6 authoritative. |

No blocker found. No live FA text in my sections still says media room as a room, nine rooms, east door, sealed door, lock card, `#add_note`, a knock-out route on Tesseract, Netherton's dressing line, or Tomb Beta's server in the tape room or server closet; every remaining mention is a "cut" or "withdrawn" note or in a record section.

## Checked and consistent

- **m09 rooms** (FA:839, §13 item 47): ten rooms in four sizes (4×2 open stacks, seven 2×2, 2×1 salvage cage, 1×1 server closet), m09 RL:11, 23, 48–59. Tran is in the server closet (FA:779, RL §3.4); Tomb Beta's server, station and the three phone scenes are in the salvage cage; the legend and Alpha deck in the tape room.
- **m09 §6 flags**: flags 1–2 at the drop terminal in the reading room, rewards `set_global flagN_submitted`; flags 3–4 at `tomb_beta_station` in the salvage cage; flag 1's `unlockDoor` on the restricted stacks; the coded salvage line as a `#give_item` notes item; H&L box on a keypad in the open stacks; office on a code nobody has, opened on `deck_choice_made`; the night's order (m09 S4 §4 rows 1–13).
- **m09 purge** (§6.1): the cage gate on Sorensen's cloned card, the plan cabinet on her print, `sorensen_door` holding both files, the cage its own room (m09 RL §3.6–3.7). Apart from A-08.
- **m09 calls**: the Recruiter's call, identity scene and Tesseract's call voiced, flag 4's read text, the double-cross text unvoiced at the tape room (m09 S4 §6, §6.6); about 66 voiced lines (S4 §6.7, FA:1746); 12 routes plus 3 and 8 starting states (S4 §12, FA:888).
- **m10 rooms** (§5.3): eight rooms, sizes and order as m10 RL §1; core east of the gallery; the gallery a straight walkway; service door a prop; three new maps and the server hall.
- **m10 stations** (§6 intro, §6.2): four, one flag each, `emit_event flag_N_in` with HaX setting the global (RL §2, OT §0).
- **m10 locks**: story doors as RFID with no card, `unlockDoor` on HaX, done-flags from `door_unlocked_by_npc` (F19); the outer lock a PIN lock with five ways through and the first-try pointer; records cupboard and fitter's locker in the security office; codes as `ghost_cupboard_code`, `ghost_lock_code`, `vector_cupboard_code` notes items (F21).
- **m10 KO**: Tesseract `koImmune` for the whole scene, his KO fallback withdrawn (FA:571, OT §4.6, RL §2.8); forced-scene holders `koImmune`; knockable slot-holders keep `npc_ko`.
- **m10 clock** (§4.2): `raid_clock` values `t0145` … `t0600`, eight countdown objects, status lines and RELEASED strings (OT §6).
- **§4.6 close**: the closing scenes as hidden NPCs opened on `conversation_closed:tesseract`, `close_the_night` on the last scene's last line, credits on that scene's close, one credits entry per NPC and value, no entry for `six_oclock` on `scorched` (OT §4.7, §7). Budget 1 + 5 + 1 + 1 (OT §8). The 06:00 texts unvoiced and held until the cutscene closes (RL §6 item 44).
- **§5 cast**: fourteen new characters including the unnamed guard (FA:781, 903, 1745); default occupants and slot rows match RL §2.
- **§7 teaser**: `closingCard.teaser` behind `teaser_enabled`, skipped on `executed` and `joined` (OT §7).
- **§18 counts**: m09 21 of 23 (P17, P18 not applied), m10 38 of 40 (S4-16 partly, S5-15); m10 28 tasks, 18 required (OT §2); about 85 voiced m10 lines (OT §13). §9 decision log: no entry found that contradicts the live text.

## Stage 6 and stage 7 handover

What FA §8, §13 and §18 leave to stages 6 and 7, with whether each is specified clearly enough to act on.

### Stage 6 (canon and technical content)

| Mission | Item | Source | Clear? |
|---|---|---|---|
| m09 | The salvage cage code: a CyberChef operation (one or two steps) keyed by the tape room's shelf-code legend; coded string free of `\|`, `#`, `//`, `{`, `}` | FA:843, m09 S4:165 (P20) | Yes: constraints stated; the encoding itself is stage 6's choice. |
| m09 | The Albion flaw kept apart from the player's own way into the m04 VM ("brand new") | FA:906 (§8 r19) | Yes. |
| m09 | The tapes hold the same lecture given at SAFETYNET and Tomb Alpha | FA:1621 (MS-20), row 60 | Partly: "stage 6 keeps it" names no target file. |
| m10 | The open vault line (SAFETYNET left it as a trace) written into "the Citadel's incident file" | FA:898 (§8 r11) | No: which document is "the Citadel's incident file" isn't named. |
| both | Canon note: stores quarantined Nightshade's crackers from the bench; Kowalczyk's is her own, bench-made; logged by batch | FA:1237 (§13 item 3) | Partly: content clear, target file not named. |
| both | Tesseract recruited Nightshade at 23 while chief strategist; the disagreement was real and also cover; goes in `the_architect.md`'s identity section | FA:904 (§8 r17) | Yes, but FA says "the user may want to confirm": still unconfirmed. |

### Stage 7 (lines)

| Mission | Item | Source | Clear? |
|---|---|---|---|
| m09 | The Recruiter's call: buttons and costs voiced on the call | FA:1241 (item 7) | Yes (m09 S4 §6.1, §6.7). |
| m09 | HaX's aside replacing the narrator line at the top of Tesseract's call ("He kept his voice down. He always did.") | FA:769, m09 S4:302 | Yes. |
| m09 | The Alpha-tapes clip: two lines, the recording style heard by the user first (tts-audio) | FA:1259 (item 25) | Yes. |
| m09 | m09 P18's new HaX lines (door refusals, purge lines, per-flag steers) | FA:1750 (not applied here), m09 S4 §14 P18 | Yes, in m09 S4. |
| m10 | Why the readers log badges; WREN's 01:58 copy and 02:10 door | FA:1236 (item 2) | Yes. |
| m10 | Suspects' reasons, beats and clearings | FA:1238 (item 4) | Yes. |
| m10 | WREN's core entrance, the line-accusation and no-Quintero cases | FA:1239 (item 5) | Yes. |
| m10 | Slot decisions and their signposting; effects carried into the gallery voiced there | FA:1245 (item 11) | Yes (m10 MC §3). |
| m10 | Disclosure's operations and the per-option epilogue beats | FA:1248 (item 14) | Yes. |
| m10 | Tesseract's idle lines during flag 4 (three at most, on events) | FA:1252 (item 18) | Yes, but see A-12. Stage 8 times flag 4 with him in the room. |
| m10 | The optional head-start exchange at the core | FA:1253 (item 19) | Yes. |
| m10 | HaX's `should_have_told` beat | FA:1254 (item 20) | Yes. |
| m10 | Player-facing names ("WREN"/"the sleeper", "the power room") in the lint read | FA:1255 (item 21) | Yes. |
| m10 | Escaped Victoria's trade | FA:1258 (item 24) | Yes. |
| m10 | HaX's unasked line's voiced wording | FA:1260 (item 26) | Yes. |
| m10 | Quintero's and Arakawa's split and peel-off lines | FA:1266 (item 32) | Yes, drafted. |
| m10 | The Recruiter beat at the core and the exchange 2 clean-record answer | FA:1267 (item 33) | Yes. |
| m10 | Every spoken time checked against the countdown objects | FA:607 (S4-10), m10 OT §6 | Yes. |
| m10 | The closing card and credits clauses in the F14 `closingCard` / `section` format | FA:696 | Yes. |
| m10 | "The far stair" in rows 32 and 33 | FA:1756 | Yes (see A-15); owner given as "m10 MC §3.5 or stage 7". |

Also gating stage 7: the timed VM run of both missions (FA:1279, item 45; owner orchestrator via `opus48`; see A-10 on m09's "before stage 8"). Stage 9, not 7, owns the `#add_note` question (item 43, closed; see A-11), the `system_name`s (item 46) and the new art and the guard's name and sprite (item 47, character and dressing stages).
