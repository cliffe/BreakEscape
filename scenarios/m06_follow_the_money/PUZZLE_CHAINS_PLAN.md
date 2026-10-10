# m06 Follow the Money — Puzzle Chains Plan

> Produced by the mission-puzzle-chains skill. **Draft 4** (round-3 findings folded in), 2026-10-01.
> A depth pass on a mission that is already validator-clean and was reworked in pass 2.
> Derived from `scenario.json.erb`, the seven `.ink` files and the engine, not the stale design docs.
> Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.

## 0. Status

**Ready to implement.** Round 3 found no blockers and nothing structural; its findings are folded
in below (tagged **[r3]**), one part withdrawn (W13). Start with P0, then the `#unlock_door` probe
(§12) before any other P8 work.

Line references are to `scenarios/m06_follow_the_money/scenario.json.erb` (written `erb:N`) unless
another file is named. Ink files are named by their **current** names. P0 renames them, and every
later proposal is written to land after P0, so `elena_*` in a citation means "`irina_*` once P0 has
run". All line numbers were re-checked against the working tree on 2026-10-01 (B0 and B1 applied).

## Changed since draft 3 (round 3)

Tagged **[r3]**. Each claim was re-checked against the code before it went in.

- **P8 window recomputed on the right area model.** The player's sprite centre (which range and
  LoS use, `doors.js:582-587`, `unlock-system.js:182-184`) can be at x 209–279, y 38–96 px in the
  room: the north wall's collision box is y 56–64 (`collision.js:60-70`, tile rows 0–1, 8 px at
  the south edge), the feet hitbox sits 26–36 px below the centre (`player.js:150-151`, offset 66,
  height 10, 80 px frame), and the east wall caps x. The guard's LoS starts at his sprite centre,
  31 px above his feet (`npc-manager.js:303-306`, `npc-sprites.js:105-117`,
  `npc-behavior.js:757-762`). New table and margins in P8 and §6; range 225 → **210**.
- **P9 CTO-badge backstop** now switches off for the relayed copy and for a clone: a pickup
  mapping for `relayed_cto_badge`, and P1's clone global (now named `irina_badge_cloned`) in the
  condition.
- **P8 minors:** exclusive credit lines; `on_lockpick_seen` and `start` check
  `guard_waved_through` (the `#unlock_door` tag is fire-and-forget); `"cooldown": 0` on the
  grace-clear mapping; the fallback key states `requires` and uses `opens_lock`.
- **P1:** the clone option no longer reads `has_rfid_cloner`.
- **P9:** the fund-found message and aim text no longer assume Irina is on her feet.
- **§12:** the no-keys assertion covers `key_ring`; new loopcheck states; playtest notes on the
  guard's first 4 s and the far corner.
- **Withdrawn (W13):** the m03 half of the cooldown finding; m03 already has it.
- **Sections touched:** §0, this list, §1, P1, P8, P9, §6, §7, §10, §12, footer.

## Changed since draft 2 (for the round-3 reviewer)

Tagged **[r2]** in the text. I re-checked every round-2 claim against the repo before folding it in.

- **P9 (blocker B1).** Since 18237332 a KO'd NPC drops its `itemsHeld` (`npc-hostile.js:139`,
  `:258-261`), so an early KO would drop the executive badge. `take_executive_badge` becomes an
  `enter_room: executive_wing` task. HaX's KO relay stops giving duplicates: the drops are the
  route, and the relay becomes a backstop asked for from the hub. Stale comments are listed for
  update. Also: the `#give_item` selector, the global set from a pickup mapping, and an
  `irina_ko` VAR in the phone ink.
- **P8 (majors M1–M3, minors).** `"cooldown": 0` (omitting it gives 5000 ms, `npc-manager.js:518`).
  `los.visualize: true`. **The patrol geometry was recomputed over the whole pick area:** the round-2
  loop has only 12° and 10 px of margin at its seen dwell, so the plan uses a different loop and
  a 225 px range (P8 table). Grace after a catch, a `guard_waved_through` global, the trading-floor
  mapping moved to HaX, the fallback key wired, the no-keys assertion, the raw-id toast logged.
- **P5 (major M4).** The $12.8M is the **pending** balance; the advances have already left. The
  transaction analysis (`erb:46`) gains the advances as outbound, with its inbound raised so it
  still nets to $12.8M. The thirteen "$12.8M" lines were re-read; the freeze credit and the debrief's
  freeze line now stay as they are (draft 2 had wrongly said to change `erb:133`).
- **Minors:** P1 hands `erb:743` to P8; P3 picks one option; P4 adds the tenth emote (satoshi
  `:567`); P7 adds the briefing's promise (`m06_opening_briefing.ink:297`, not `:296`).
- **Sections touched:** this list, §1, §3, P1, P3, P4, P5, P7, P8, P9, P12, §6, §7, §10, §11, §12.

## Changed since draft 1

Draft 1's file was lost mid-write; draft 2 was rebuilt from its summary and the round-1 rulings.

Everything changed by round 1 is tagged **[r1]** in the text. For the round-2 reviewer:

- **P8 rewritten as a turnstile** (X1): `trading_floor` gets a pickable key lock, the guard can
  talk you through with `#unlock_door`, being seen picking opens his challenge and never turns him
  hostile. Room type stays `hall_1x2gu` (X2). Depends on P1 for the lockpick.
- **P5 rewritten** (X3): per-cell advance paid / balance pending, the "simultaneous" line gone, the
  stated toll raised to match m07, and all ten quotes changed in one edit.
- **P9 promoted and specified** (M8): the executive badge leaves the data centre. Irina hands over
  the spare when you put the fund in front of her; HaX relays a copy if she is down.
- **P1** gains the briefing kit line and the clone-rule fix (M1). **P2** wording carries no number
  (M6). **P3** keeps both guides with honest framing (M7). **P4** puts the codename on the fund
  document and in the Satoshi-KO knot (M2). **P6** and **P7** list the exact lines (M3, M4).
  **P10** gives the CTO office a real leverage option (M9). **P11** (dead globals) and **P12**
  (phone-chat rules across the whole phone ink, M5) are new.
- §2 numbers corrected, §3 audit redone with "seen" one room shallower, §10 records draft 1's
  claims that round 1 corrected, §12 is new.
- P0 (the rename) was added between rounds on a user ruling.

Do not re-litigate §10.

## 1. Summary: what to do, in order

Bug fixes first. Each item is ✅ keep, ⚠️ rework-and-confirm, or "needs approval" (other repo or
canon). Every "depends on" points up the table.

**Done (in the repo, validator clean):**
- **B0.** Deleted the unused `satoshi_escaped` global (old `erb:504`; PASS3 log D5). No other
  reference. **[done]**
- **B1.** Rename residue in `mixer_pool_config.yml`, `erb:1229`: `author: i.volkova`, `I.V. objected`.
  **[done]**

**Phase A — bugs and standing rules (no design dependency).**

| # | Item | Depends on | Status |
|---|---|---|---|
| P0 | Rename the CTO's ids, elena → irina (user rename rule) | — | ✅ |
| P11 [r1] | Delete dead globals and the unused ERB helper | P0 | ✅ |
| P12 [r1] | Phone-chat rules across the whole HaX phone ink (E10, E13) | P0 | ✅ |
| P1 [r1] | Cumulative start kit; remove the world cloner; briefing names the kit; clone rule | P0 | ✅ |
| P2 [r1] | Architect email P.S. points at the CEO's own safe, with no number | P0 | ✅ |
| P3 [r1] | Field guides: distcc for the foothold, ssh guide for logging in, honest framing | — | ✅ (+ L1 needs approval) |

**Phase B — canon and stakes (PASS3 log D2–D6).**

| # | Item | Depends on | Status |
|---|---|---|---|
| P5 [r1][r2] | Fund document: per-cell advance paid / balance pending ($12.8M = pending); toll matches m07; all quotes; `erb:46` | P0 | ✅ |
| P4 [r1] | Codename "Satoshi's Ghost" on critical-path evidence, in the KO knot and the debrief; emotes → narrator | P0, P5, P12 | ✅ (bible line pre-approved) |
| P6 [r1] | Monitoring states its cost plainly (D4) | P5, P12 | ✅ |
| P7 [r1] | A turned Irina does not persist (D6) | P0 | ✅ |

**Phase C — structure.**

| # | Item | Depends on | Status |
|---|---|---|---|
| P8 [r1][r2][r3] | Checkpoint guard as a turnstile on `trading_floor` | P0, P1, P12 | ⚠️ probe `#unlock_door` first |
| P9 [r1][r2][r3] | Executive badge leaves the data centre; Irina hands over the spare; task becomes `enter_room`; KO relay de-duplicated | P0, P1, P5, P12 | ✅ |
| P10 [r1] | CTO office: research notes unlock a pressure option with Irina | P0 | ✅ |

**Phase D — regenerate and verify.** Validator (regenerates the dungeon graph), door alignment,
ink compile, the §12 acceptance block, then the TESTING_WALKTHROUGH.md and README.md updates and
the dated rename notes.

## 2. Headline numbers

From `room_depth.py` and each mission's `dungeon_graph.md:22` (run 2026-10-01). **[r1]** corrected.

| | m01 | m02 | m06 now | m06 after plan |
|---|---|---|---|---|
| Rooms | 13 | 13 | 9 | 9 |
| Empty rooms | 0 | 2 | 0 | 0 |
| lockType declarations | 12 | 15 | 5 | 6 (+ `trading_floor`, P8) |
| Max room depth | 3 | 7 | 6 | 6 |
| Critical-path hops (aims) | 9 | 4 | 5 | 5 |
| Aims | — | — | 6 (`erb:162-445`) | 6 |
| KO-able NPCs | — | — | 4 (`erb:1009`, `:1061`, `:1308`, `:1446`) | 5 (+ guard) |
| NPCs that can turn hostile | — | — | 1: Satoshi (`m06_satoshi_confrontation.ink:440`) | 1 |

The five locks now: `server_room` password (`erb:1100-1102`), `elena_office` rfid (`erb:1349-1351`),
`data_center` PIN (`erb:1195-1197`), `executive_wing` rfid (`erb:1393-1395`), `executive_safe` PIN
(`erb:1482-1484`). m06 is small next to m01/m02 and should stay small: the VM chain is the bulk of
the play time. The plan adds one lock and moves one key; it does not add rooms.

## 3. Boss-key audit

**[r1] redone.** A door is seen from the room *before* it, so "seen" is the locked room's depth
minus one (draft 1 used the room's own depth, one too deep throughout). Depths from `room_depth.py`:
checkpoint 1, trading floor 2, lab / CTO office / server room 3, data centre 4, executive wing 5,
CEO office 6.

| Lock | Seen at | Key / code available | Verdict now | After plan |
|---|---|---|---|---|
| `trading_floor` key (new, P8) | 1 (checkpoint) | lockpick in start kit (m01), or the guard talks you through (depth 1) | — | ✅ by design (pick); the talk route is a social turnstile in the same room, on purpose |
| `server_room` password `erb:1100-1102` | 2 | convention: checklist at depth 1 (`erb:965-974`); term: Irina's wordlist at depth 2 (`erb:1030-1037`) | ⚠️ mild key-before-lock: the checklist is read before the door is seen, though it names the door it is for | unchanged; two parts in two rooms is the right shape |
| `elena_office` rfid `erb:1349-1351` | 2 | Irina lends the badge, the cloner reads it, or HaX relays it on a KO (`erb:672-678`), all at depth 2 | ❌ same-room by geometry; it is a social lock (trust or clone) | ✅ by design for the clone route once the cloner is in the start kit (P1, m03 capability) |
| `data_center` PIN `erb:1195-1197` | 3 | door-controller export, paid out for flag 3 (`erb:1140-1164`), at the terminal in the same room | ✅ in effect: encounter the pad, hunt on the backend (flags 1–3), return to the pad. Same room physically; the hunt is the VM chain (m02's flag-payout pattern) | unchanged |
| `executive_wing` rfid `erb:1393-1395` | 4 | spare badge lying in the data centre (`erb:1268-1277`) | **❌ same-room** (M8) | ✅ boss-key after P9: seen at 4, badge from Irina at 2, walk back through 3 to 4. **[r2]** A player who KOs Irina early picks the badge off the floor (KO drops); that is ⚠️ key-before-lock on the violent route, accepted |
| `executive_safe` PIN `erb:1482-1484` (optional) | 6 | email P.S. in the CTO office, depth 3 (`erb:1381`); press clipping in the executive wing, depth 5 (`erb:1408`) | ⚠️ mild key-before-lock; the email currently points at "every passcode" | ⚠️ unchanged depth, but P2 makes the email name the safe it is about |

Two of six locks end as true boss-keys, one more works as one through the VM chain, and the rest
are spent capabilities or social locks. That is about right for a mission whose main puzzle is
the backend.

## 4. Findings

- **F1. Rename residue in ids.** The CTO is "Dr. Irina Volkova" on screen but `elena` in 43 lines of
  the ERB, 59 times in the rendered JSON, and across all seven inks (70 hits in her own,
  `m06_npc_elena_volkov.ink`). Examples: NPC id `erb:990`, room key `erb:1346`, globals
  `erb:484`, `:499-501`, `:510`, `:523`, task `meet_elena` `erb:177`. → P0.
- **F2. Start kit is the phone alone** (`erb:450-459`), and an RFID cloner sits on the trading floor
  (`erb:1084-1094`). The capability-arc rule wants lockpick, cloner and fingerprint kit in the
  start kit, no PIN cracker. → P1.
- **F3 [r1]. The clone knot breaks the clone rule.** `clone_badge` sets `badge_cloned` before the
  `#clone_keycard` tag and follows the tag with a speaker line (`m06_npc_elena_volkov.ink:293-299`).
  A cancelled clone still sets the latch, and the hub hides the option for good (`:164`). The
  briefing says the cloner is on the trading floor (`m06_opening_briefing.ink:282`), which is false
  once P1 lands. → P1.
- **F4 [r1]. The Architect's P.S. claims "every passcode"** is the year the last bitcoin is mined
  (`erb:1381`). The data centre is 3110 (`erb:1197`), the whitepaper date (`erb:1160`). The P.S.
  is the safe's clue, so it should be about the safe. → P2.
- **F5 [r1]. Field guides.** The cracking guide points at `ssh-access-and-bruteforce` (`erb:635`).
  The VM's foothold is distccd RCE (SecGen `m06_follow_the_money.xml:20`, `:271`); the box also runs
  sshd (`:285`, `ssh_root_login`), and its passwords come from John's default list
  (`jtrpassword.lst`, `:106`). The distcc sheet's worked example and Mission Application are m03's
  (`distcc-exploitation.md:64-66`), and m06's distcc carries no flag (xml `:266-278`: the foothold
  drops a note). `rfid-cloning.md:53-55` is m03-specific too. → P3, L1.
- **F6. The codename never appears.** `grep "Satoshi's Ghost"` over the ERB and inks: 0 hits. Canon
  names the cell leader "Satoshi's Ghost" (`story_design/universe_bible/03_entropy_cells/crypto_anarchists.md:25`).
  A KO before the confrontation skips every line where a reveal could go. → P4.
- **F7 [r1]. The fund document undercuts m07 and contradicts it.** It says all cells are paid
  simultaneously (`erb:48`, last NOTE line), while m07 says some were already paid
  (`m07_opening_briefing.ink:27`). Its toll (`erb:48`) is below the sum of the per-operation
  projections m07 reads out (`:51`, `:116`, `:185`, `:214`; provenance "ENTROPY's own casualty
  estimates", `:223`). The total is quoted in ten places (P5). → P5.
- **F8 [r1]. Monitoring is softened.** HaX: monitoring "saves MORE lives long-term"
  (`m06_phone_agent_0x99.ink:381-385`). Freeze lines over-promise: "We stopped the attack"
  (`m06_satoshi_confrontation.ink:321`), "gone before the cells it was promised to even know"
  (phone `:477`; round 1 cited `:475`). The debrief's monitoring branch never states the cost
  (`m06_closing_debrief.ink:86-88`). PASS3 D4 requires it. → P6.
- **F9 [r1]. A turned Irina is promised a future.** Debrief `:186` (cells in three countries),
  `:188` (teaching our analysts), `:202` (dismantling cells globally), `:204` (papers, training);
  credit "Turned — working for SAFETYNET" (`erb:137`). m07 opens three days later
  (`m07_opening_briefing.ink:27`) and nothing carries state across missions (PASS3 D6). → P7.
- **F10 [r1]. The checkpoint is a corridor with a note** (`erb:954-977`, `"npcs": []`). Line of
  sight only interrupts lockpicking, and only for an NPC with a `lockpick_used_in_view` mapping
  (`npc-manager.js:261-290`, `unlock-system.js:180-200`), so a guard beside an unlocked door is
  decoration. → P8.
- **F11 [r1]. The executive badge lies in the room whose door it opens** (`erb:1268-1277`; the
  door is `data_center` east, `erb:1199-1201`). The export even says so (`erb:1160`, "spare
  executive badge left out in DC-02"). → P9.
- **F12 [r1]. The CTO office promises leverage nothing uses.** "The leverage you need is in the
  last three lines" (`erb:1371`); no ink reads the notes (grep `research_notes|leverage` over the
  inks: 0 hits). The room is optional, and its only other pull is the safe's P.S. → P10.
- **F13 [r1]. Phone knots print text before their choices.** `first_call` (phone `:62-77`),
  `support_hub` (`:93-96`), `on_architects_fund_discovered` (`:332-345`), and the event knots
  generally. On a re-open with changed globals the engine re-navigates to the owning knot and
  replays its leading text (`phone-chat-minigame.js:532-566`; brief rule E13). → P12.
- **F14 [r1]. Dead state.** Globals `player_approach`, `mission_priority` (`erb:474-475`),
  `handler_trust` (`:490`), `evidence_level` (`:493`) have no other reference; the
  `base64_encode` helper (`erb:35-37`) is never called. `lore_collected` (`erb:492`) is never
  incremented (the debrief says so, `m06_closing_debrief.ink:377`), and the debrief's
  `objectives_completed` VAR (`:10`) is declared and never read. → P11.

## 5. Proposals

### P0. Rename the CTO's ids, elena → irina ✅
**Why.** User rename rule (2026-10-01). F1.
**What.** Word-boundary replacements, then recompile every ink:
- NPC id `elena_volkov` → `irina_volkova` everywhere: `erb:990`, the `npc_ko:` / `conversation_closed:`
  patterns (`erb:696`, `:819`), the debrief trigger list (`erb:924`), `#speaker:` tags.
- Ink pair `m06_npc_elena_volkov.{ink,json}` → `m06_npc_irina_volkova.*` with `git mv`; storyPath `erb:1007`.
- Room `elena_office` → `irina_office`: room key `erb:1346`, trading floor west connection `erb:986`,
  both room lists (`erb:709`, `:924`), workstation and notes object ids (`erb:1359`, `:1366`).
- Globals `elena_*` → `irina_*` (trust, recruited, fate_decided, arrested, ko, suspicious,
  badge_obtained, ko_relayed): declarations, `globalVarOnKO` (`erb:1009`), credit conditions
  (`erb:137-139`), mapping conditions, `#set_variable` tags, ink VARs.
- Tasks `meet_elena` → `meet_irina` (incl. `taskOnKO`, `erb:1010`, and `#complete_task` in the KO
  relay), `decide_elena_fate` → `decide_irina_fate`.
- Knots and VARs: about sixteen knots across six inks (`elena_guidance`, `on_elena_ko_relay`,
  `detain_elena`, the debrief's `elena_*_path` knots, `elena_flagging` / `elena_discussion` in the
  analyst and trader inks, …), the trader's `topic_elena` VAR, and `puzzle_graph_*` values.
- TESTING_WALKTHROUGH.md and README.md. Dated rename note at the top of ALIGNMENT_PLAN.md and
  PASS2_IMPROVEMENTS.md, not a rewrite.
- Leave m07's `elena_rodriguez` alone.
**Cost.** Mechanical, large surface. Old saves won't carry over (accepted: no release depends on them).
**Check.** No `elena` (case-insensitive) in the rendered JSON or any m06 ink/json (§12).

### P1 [r1]. Cumulative start kit ✅
**Why.** Capability arc rule. F2, F3.
**What.**
- `startItemsInInventory`: phone, Lock Pick Kit (`lockpick`), RFID Cloner (`rfid_cloner`),
  Fingerprint Kit (`fingerprint_kit`), matching m05's entries. No PIN cracker. The cloner carries
  `puzzle_graph_unlocks: ["irina_office"]`; the lockpick carries `["trading_floor"]` (P8).
- Delete the world cloner (`erb:1084-1094`).
- Repoint every line that places a cloner on the trading floor: briefing `:282`, phone
  `request_rfid_guide` `:550`, README.md `:83`, TESTING_WALKTHROUGH.md `:93`. **[r2]** HaX's timed
  message at `erb:743` belongs to P8, which moves and rewrites it.
- **Briefing names the kit** in `final_briefing` (`m06_opening_briefing.ink:292`), which every
  path reaches, not only in the optional `physical_tools` branch. One line: picks, the cloner, the
  print kit, and no PIN cracker ("R&D still have it on the bench").
- **Clone rule** for `clone_badge` (`m06_npc_elena_volkov.ink:293-299`): drop `~ badge_cloned = true`
  before the tag; put `#clone_keycard:cto_badge` on a throwaway narrator line; divert to a
  `clone_debrief` knot that checks the synced global and re-offers the clone if it isn't set.
  The global comes from a `card_cloned` mapping on HaX with a `data.cardName` condition
  (the card name has no parentheses: "CTO Access Badge", `erb:1014`). No task completes from the tag.
  **[r3]** The global is `irina_badge_cloned` (declared in the ERB and as a VAR in Irina's ink and
  the phone ink; P9's backstop reads it). `card_cloned` fires on Save in the RFID minigame
  (`rfid-minigame.js:245`), so a cancel leaves it false.
- **[r3] Drop `has_rfid_cloner` from Irina's ink** (`m06_npc_elena_volkov.ink:43`, `:164`,
  `:282`). Person chat re-syncs every `has_*` VAR from the *NPC's* `itemsHeld` on start and after
  any give (`person-chat-conversation.js:137-147`, `:155-181`), so once she hands over the
  wordlist the VAR goes false (she holds no cloner) and the clone option vanishes mid-conversation.
  The cloner is in the start kit after P1, so the option needs only `not irina_badge_obtained and
  not badge_handed and not irina_badge_cloned`, and the narrator line at `:282` prints unguarded.
**Cost.** Small. **Depends on** P0.

### P2 [r1]. The Architect's P.S. points at the safe ✅
**Why.** F4. M6: the clue must not hand over the number.
**What.** Rewrite the P.S. (`erb:1381`) to say the CEO's private safe is set to "the year the last
bitcoin is mined", with no digits; the observation (`erb:1382`) to "The postscript is about the
CEO's safe." The clipping (`erb:1408`) stays the place the year appears. 3110 for the data centre
is the real whitepaper date and is guessable by a crypto-literate player; that is acceptable,
because the export prints it anyway after flag 3.
**Not a trap.** The safe's three-attempt limit resets on every opening (`pin-minigame.js:22`, `:31`)
and the server has no lockout (`app/models/break_escape/game.rb:793-796`). Nothing in the plan
relies on attempt limits. **Depends on** P0.

### P3 [r1]. Field guides, honestly framed ✅ (L1 needs approval)
**Why.** F5; PASS3 D7 and M7.
**What.**
- **[r2]** Keep the recon guide as it is and **add a new item**, a distcc foothold guide pointing
  at `distcc-exploitation`, offered from the same `vm-launcher` hook (`erb:752`). HaX's give line says its worked example comes from an earlier job, and
  that here the build service is the way onto the box, with no flag of its own.
- Keep `ssh-access-and-bruteforce` and rename the item to say what it is for here: logging in over
  SSH with credentials you have cracked offline. HaX's line (`request_cracking_guide`, phone `:504-513`) mentions unshadow and
  John's default list.
- HaX's RFID guide line says the sheet's example building is an earlier mission's.
- Offer hooks stay where they are (`erb:752`, `:731`, `:783`); only the guide items and give lines change.
**Cost.** Small. The sheets' Mission Application sections and SecGen `lab_sheet_url`
(xml `:51`) are other repos → L1.

### P5 [r1][r2]. The fund document matches m07 ✅
**Why.** F7; PASS3 D3 (itemised per cell, tied to what m07 depicts) and X3.
**What.** Keep the game-design shape; the wording follows the existing text.
- **Per-cell lines** (`erb:48`): split each cell's figure into *advance paid* and *balance pending
  (72h)*, and tie each cell to the m07 operation it funds. All six appear across m07's four
  operations: Critical Mass → the grid (`m07_opening_briefing.ink:33`, `:51`); Ghost Protocol and
  Social Fabric → Fracture (`:106`); Supply Chain Saboteurs → Trojan Horse (`:139`); Digital
  Vanguard and Zero Day Syndicate → Meltdown (`:177`).
- **Delete the "simultaneous … all cells" NOTE line** (`erb:48`). It contradicts m07's "Some of
  them had already been paid" (`m07_opening_briefing.ink:27`) and the credits (`erb:151`).
- **Raise the stated toll** so it is at least the sum of the per-operation projections m07 reads
  out (`:51`, `:116`, `:185`, `:214`), attributed the way m07 attributes it (ENTROPY's own
  estimates, `:223`).
- **Change every quote of the old toll in one edit** (re-grepped 2026-10-01; ten places):
  `erb:48`; satoshi `:52`, `:100`, `:324`, `:381`; irina `:323`; debrief `:109`, `:224`;
  phone `:343`; README.md `:29` (hyphen form). The ink uses both "X-Y" and "X to Y" forms; grep
  for both and for the old upper bound alone.
- **[r2] The $12.8M is the pending balance.** Today the six allocations sum to the "Current
  Balance" (`erb:48`), and the transaction analysis nets to it (`erb:46`: four inbound lines less
  the one outbound). Keep $12.8M as what is *still in the wallet*: the six pending balances sum to
  it, and the advances are shown as already gone. In `erb:46`, add the advances to the outbound list
  (one line per cell, dated before tonight) and raise the unattributed inbound line ("14 further
  wallets") by the same total, so the sheet still nets to $12.8M. The cold-storage index
  (`erb:1239`, 12,800,000) then stays right.
- **Align the payout lines with the split.** Fund-doc observation (`erb:1251`, "all paid at once")
  and HaX's `coordinated_attack` knot (phone `:347`, "All cells receiving funding
  simultaneously") change. **[r2]** The freeze credit (`erb:133`) and the debrief's freeze line
  (`m06_closing_debrief.ink:85`) stay: with $12.8M as the pending balance they are now exactly
  true. Draft 2's instruction to change `erb:133` is withdrawn.
- **[r2] The thirteen "$12.8M" lines, re-read against the split.** They stay true and need no
  change: phone `:337` (allocated to six cells), `:415` (ENTROPY loses $12.8M), `:466` (ready to
  move); satoshi `:52`, `:252` (ready for distribution), `:309` (sweep $12.8M); debrief `:100`,
  `:224` (moved through her infrastructure: the inbound did); Irina `:323`; `erb:397`, `:538`,
  `:815`. Two are rewritten anyway, by other proposals: phone `:381` (P6 rewrites the
  recommendation knot) and `:477` (P6: the advances were not stopped). `erb:1251` changes as above.
- **m07 is unaffected.** It plays the same whatever m06's choice; freezing stops the pending
  balances only.
**Cost.** Two text blocks (`erb:46`, `:48`), ten toll quotes, two payout lines. **Depends on** P0
(irina ink name).

### P4 [r1]. Reveal "Satoshi's Ghost" ✅ (bible line pre-approved)
**Why.** F6; PASS3 D2 and M2.
**What.**
- **Critical-path evidence:** the fund document (P5) gets an authorisation line naming
  "Satoshi's Ghost (Crypto Anarchists)". `settlement_log` (`erb:1219`, optional) repeats it on
  the CEO-authorised rows.
- **HaX on fund found** (phone `on_architects_fund_discovered`, `:332`) and **on Satoshi's KO**
  (`on_satoshi_ko`, `:460`): one line each joining the codename to the man in the corner office,
  and saying it is the Crypto Anarchists' leader, not the Ghost Protocol cell that the same
  document lists as a recipient.
- **Confrontation:** a reply that lets the player use the name; he answers to it. Public persona
  stays "Satoshi Nakamoto II" (task title `erb:418`, credits `erb:140-141`, brochure `erb:947`).
- **Debrief:** `satoshi_aftermath` uses the codename once.
- **Bible:** one alias line in `crypto_anarchists.md` under `:25` ("public persona: 'Satoshi
  Nakamoto II', CEO of HashChain Exchange (m06)").
- **Emotes:** where P4 touches the satoshi ink, convert the ten `*emote*` openers (`:77`, `:163`,
  `:176`, `:191`, `:315`, `:341`, `:366`, `:392`, `:515`, and **[r2]** the indented one at `:567`)
  to narrator lines. Grep for `Satoshi Nakamoto II: \*` without anchoring to column 0.
**Cost.** Small. **Depends on** P0, P5 (same text block), P12 (phone knots touched).

### P6 [r1]. Monitoring states its cost (D4) ✅
**Why.** F8; PASS3 D4: two options, no third; the debrief states the cost plainly when the player
monitored.
**What.**
- `handler_recommendation` (phone `:378-386`): drop "saves MORE lives long-term"; HaX says what each
  costs. Freezing stops the pending balances and tells ENTROPY someone was here; watching lets the
  balances go to cells whose projection the player has just read, in exchange for the map.
- Freeze over-claims: satoshi option `:321` "We stopped the attack" → "We stopped the money that
  hadn't left"; phone `:477` "gone before the cells it was promised to even know" → the pending
  balance is gone, the advances are not.
- Debrief monitoring branch (`m06_closing_debrief.ink:86-88`): add the plain statement that the
  balances reached the cells, and the toll is the one on the document.
- Satoshi's monitoring response (`:366`) stays; it is his view, not the game's.
**Cost.** Wording only. **Depends on** P5, P12.

### P7 [r1]. A turned Irina does not persist (D6) ✅
**Why.** F9; PASS3 D6. m07 opens three days later.
**What.** **[r2]** The briefing makes the promise first: "if you can turn Irina, we keep a pair of
eyes inside it" (`m06_opening_briefing.ink:297`). Change it to what she could give tonight.
Rewrite debrief `:186`, `:188`, `:202`, `:204` to what she handed over *tonight*: the
mixer's internals, the wallet map, the name of the man who pays her. Credit `erb:137` →
"Turned — gave up the mixer tonight". Do not mention her in future missions.
**Cost.** Four lines and a credit. **Depends on** P0.

### P8 [r1][r2]. The checkpoint guard is a turnstile ⚠️ (probe `#unlock_door` first)
**Why.** F10; PASS3 D8 and X1/X2. A guard only matters if he stands at a lock the player must open.
**Story logic.** HashChain keeps a contract guard on the door to the trading floor because that is
where the money is. A regulator with an appointment gets waved through; anyone else is asked
questions. The player can talk their way past on the FCA cover, slip the lock while he isn't
looking, or put him down.
**What.**
- **Lock** `trading_floor`: `locked: true`, `lockType: "key"`, `keyPins` (four pins), `difficulty:
  "easy"`, no `requires`. Precedent: m03's `executive_office` (`m03 erb:1184-1192`). A key lock is
  always pickable (`app/models/break_escape/game.rb:783-788`) and the lockpick is in the start kit (P1), so the door can
  always be opened. This is the lockpick's only use in m06.
- **Guard** `checkpoint_guard` in `security_checkpoint` (sprite `male_security_guard_v2`, which
  exists under `assets/characters/`), person NPC, `globalVarOnKO: "guard_ko"`,
  `unlockable: ["trading_floor"]`, own ink `m06_npc_checkpoint_guard.ink`. Worked example: m03's
  `night_guard` (`m03 erb:1124-1180`): `facePlayer: false`, `pauseForPlayer: false`, patrol loop,
  `los.range` 150. m03 now uses a **120°** cone after its 140° dwell flickered on the edge
  (`m03 erb:1142` behaviour comment, `:1166`); round 1's "cone 140°" is out of date.
- **[r2][r3] LoS config:** `los: { enabled: true, range: 210, angle: 120, visualize: true }`.
  **[r3]** Range 210, not 225: at 225 the drawn cone spills about three tiles into the trading
  floor; 210 still clears the farthest pick point by ≥ 16 px (table below). The
  cone is only drawn with `visualize: true` (`npc-manager.js:1634`), and the player has to read
  the window. Facing snaps to eight directions (`npc-los.js:132-142`) and comes from the last
  movement leg, so every leg is horizontal.
- **[r2] Window, worked over the whole pick area.** Geometry: the `hall_1x2gu` tilemap has floor
  tiles x 1–8, y 2–4 (walls layer); the north door's centre is at room tile (8.5, 1.0)
  (`check_door_alignment.py`: x = 320 − 48 px, y = room top + 32 px); waypoints are tile corners
  (`npc-behavior.js:1118-1119`). The player can pick from anywhere within 64 px of the door
  (`constants.js:59`, `doors.js:582-587`).
  **[r3] Area model (replaces draft 3's "floor strip y 2–3").** Range and LoS are measured from
  the player's sprite centre (`doors.js:582-587`; `unlock-system.js:182-184` uses
  `sprite.getCenter()`), and the centre can reach x 209–279, y 38–96 px, room-local: the north
  wall's collision box spans y 56–64 (`collision.js:60-70`), the feet hitbox is 26–36 px below the
  centre (`player.js:150-151`), and the east wall stops x at 279. The guard's eye is his sprite
  centre (`npc-manager.js:303-306`), 31 px above the feet point that waypoints place
  (`npc-sprites.js:105-117`, `npc-behavior.js:757-762`). The round-3 reviewer sampled 3,299
  points over that area; my re-run on a finer grid agrees to within 3° and 2 px. Reviewer's
  figures (the more conservative):

  | Guard at, facing | Off-axis angle over the area | Farthest point | Verdict (half-angle 60°, range 210) |
  |---|---|---|---|
  | (4,4) east | 0°–38° | 164 px | seen everywhere; ≥ 22° cone margin, ≥ 46 px range margin |
  | (3,4) east (start of the east walk) | 0°–31° | 194 px | seen everywhere; ≥ 29° / ≥ 16 px margin |
  | (3,4) or (4,4) west | 139°–180° | — | safe everywhere; ≥ 79° margin |
  | (4,4) down (his first 4 s) | 90°–131° | — | safe everywhere; ≥ 30° margin |

  **Loop:** waypoints `(4,4)` dwell 4000 ms → `(3,4)` dwell 4000 ms, `loop: true`, `speed: 40`,
  start position (4,4). He arrives at (4,4) moving east (seen) and at (3,4) moving west (safe).
  At speed 40 a one-tile leg takes 0.8 s, so about 4.8 s seen (east walk + east dwell) and
  4.8 s safe (west walk + west dwell). **[r3]** On room load he stands at (4,4) facing down
  (`npc-behavior.js:230` initialises `direction = 'down'`), which is safe, so the first 4 s are a
  free window before the loop starts. He stands at the far end of the room from the north door's
  column, by the south door, and the player walks past above him. Put the figures (area model,
  margins, the safe start) in the guard's `_comment`, as m03 does.
- **Mapping** on the guard: `lockpick_used_in_view` → person-chat `on_lockpick_seen`,
  `onceOnly: false`, **[r2] `"cooldown": 0`**. Omitting `cooldown` gives the 5000 ms default
  (`npc-manager.js:518`), and the interrupt gate ignores it, so a retry inside 5 s would be
  swallowed with no pick and no line (brief E4). The LoS check runs against the room that holds
  the door sprite (`doors.js:503-504`, `unlock-system.js:180`), so the guard must be in the
  checkpoint.
- **[r2] No keys before this door.** The lockpick-interrupt gate only runs when the player holds
  no keys; with any key in inventory the key-selection minigame opens instead and skips the LoS
  check (`unlock-system.js:162-176`). No key-type item is obtainable before the checkpoint door
  (start kit and lobby hold none); §12 asserts it.
- **Ink.** `start`: he asks who you are and who you are here to see. The right answers are the
  cover (FCA supervision, routine visit) and the CTO's name (brochure `erb:947`, HaX `erb:686`).
  Right → `#unlock_door:trading_floor`, `#set_variable:guard_waved_through=true`, a line waving
  you through. Wrong → "not on my list", `#exit_conversation`, and you may try again later.
  `on_lockpick_seen`: he challenges and sends you back to the lobby side. **No `#hostile`
  anywhere** in his ink. Every exit is `#exit_conversation` → a resting knot (never DONE).
- **[r3] Both entry knots check `guard_waved_through` first.** `#unlock_door` is fire-and-forget:
  the tag starts the server call and returns success at once, and a refusal only shows a warning
  toast (`chat-helpers.js:64-83`). So the ink sets `guard_waved_through` whether or not the door
  actually opened. `start` with it set plays the resting line ("Go on, then.") and re-issues
  `#unlock_door:trading_floor`, which costs nothing if the door is already open. If the player
  then picks in view, `on_lockpick_seen` with it set says he already let you through and re-issues
  the tag, never the challenge. The probe (§12) is what tells us the server accepts the tag; this
  stops a refusal from leaving the player challenged by a man who just waved them in.
- **[r2] Grace after a catch** (m03's `guard_grace` pattern, `m03_npc_guard.ink:392-398`,
  `m03 erb:889-895`). A catch sets `guard_grace`. While it is set he won't take the cover on this
  visit: `start` and `on_lockpick_seen` play a short "still here, still watching" line with no
  cover option and no further cost. A HaX mapping on `room_entered:reception_lobby` clears it, so
  leaving and coming back resets. **[r3]** That mapping has `"condition": "globalVars.guard_grace
  === true"` and `"cooldown": 0`, as m03's do (`m03 erb:887-897`): without it the 5000 ms default
  (`npc-manager.js:518`) skips a lobby re-entry inside 5 s of the last one, and the grace stays. Being caught now costs something (the talk route, until you
  walk out), and picking in the safe window stays open.
- **[r2] Globals.** Declare `guard_resolved`, `guard_waved_through`, `guard_grace`, `guard_ko`.
  `guard_resolved` is set by a **HaX** mapping on `room_entered:trading_floor` (HaX is always
  loaded; the guard's mappings register only when his room loads). A KO'd guard never interrupts
  (`npc-manager.js:270-273`), so KO means free picking; that is the accepted cost of violence.
- **Visibility.** Leave him visible after he is resolved. With the door open nothing pickable is
  left in his room, so his cone does nothing, and hiding a man who just let you through reads as
  a glitch.
- **HaX lines.** P8 owns `erb:739-744`: move the 3 s `room_entered:security_checkpoint` text to
  `room_entered:trading_floor`, rewritten for P1 ("your cloner reads at conversational distance"),
  still setting `rfid_guide_offered`. The briefing-close text (`erb:686`) adds one clause: there's
  a man on the checkpoint door; you're an FCA officer, so act like one.
- **[r2][r3] Credits.** One guard line under PERSONNEL (`erb:136-145`), three mutually exclusive
  conditions: `guard_waved_through` → talked through; `guard_ko && !guard_waved_through` →
  knocked out; `guard_resolved && !guard_waved_through && !guard_ko` → slipped past. **[r3]**
  Draft 3's bare `guard_ko` overlapped the first line for a player who talked through and then
  hit him; talking through takes priority.
- **Fallback if the `#unlock_door` probe fails.** The only precedent is `ceo_exfil` with a phone
  NPC (`scenarios/ceo_exfil/scenario.json.erb:66`). The server allows it only if the NPC lists the
  room in `unlockable` and the player has met him (`game.rb:880-905`); "met" is recorded on room
  load (`games_controller.rb:1290-1306`). **[r2][r3]** If it fails: the lock gains
  `"requires": "checkpoint_door_key"` (the server's key branch is valid only when `requires` is
  present and a held item matches it, `game.rb:778-782`; the lockpick branch ignores `requires`,
  `:783-788`, so the door stays pickable). The guard's `itemsHeld` gets a `key` item with its own
  `id`, `opens_lock: "checkpoint_door_key"` and matching `keyPins`; the talk route gives it with
  `#give_item:key:checkpoint_door_key`. Use `opens_lock`, not `key_id`: `key_id` is the
  pre-rename field the bridge still accepts only for old saves (`npc-game-bridge.js:242-245`), and
  the server matches the lock reference (`game.rb:138-153`). In this mode his KO drops the key
  (KO drops, `npc-hostile.js:139`), which is fine: it is another KO route. §12 asserts the
  fallback shape if it is used.
- **[r2] Cosmetic.** A successful `#unlock_door` shows a toast with the raw room id ("Door
  unlocked: trading_floor", `chat-helpers.js:71`). Logged in §11, not fixed here.
**Cost.** One NPC, one ink, one lock, six mapping edits. **Depends on** P0, P1 (lockpick), P12
(HaX text moves).

### P9 [r1][r2]. The executive badge leaves the data centre ✅
**Why.** F11, M8. The executive-wing door is the last lock on the critical path and currently its
key is on the floor in front of it.
**Story logic.** Irina installed the readers on the executive wing and was lent a spare badge to do
it; she never gave it back. Once you put the fund in front of her, she hands it over. That makes
the fund the reason for the walk back, and the conversation with her the hinge of the mission.
**What.**
- Delete `executive_access_badge` from `data_center` (`erb:1268-1277`); add it to Irina's
  `itemsHeld`.
- **Clue.** Export note `DC-03` (`erb:1160`) → the spare was signed out to the CTO for the reader
  install and never returned. The player reads this after flag 3, one room before the door.
- **Hand-over.** One Irina hub option and one `after_choice` option, both
  `{found_architects_fund and not irina_exec_badge_given}`, diverting to an `exec_badge_handover`
  knot: she reads the fund (if not yet shown) and gives the badge, whatever her trust and whatever
  her fate. **[r2]** The tag needs a selector, because she also holds the CTO badge, another
  keycard: `#give_item:keycard:executive_access_badge` (the bridge matches the selector against
  id, `opens_lock`, `key_id` or name, `npc-game-bridge.js:232-247`). A detained Irina doesn't look
  up; the narrator has you take it from her desk drawer. `after_choice`
  (`m06_npc_elena_volkov.ink:418-427`) needs the option because a player can reach her fate
  through the transaction graph (`:306-338`) before finding the fund.
- **[r2] `irina_exec_badge_given` comes from the pickup**, not the ink (lesson 26): a HaX
  `item_picked_up:keycard` mapping with `data.itemId === 'executive_access_badge'`, and a second
  one for `relayed_executive_badge` (conditions are &&-only). It also covers a badge picked up off
  the floor after a KO.
- **[r2] The task becomes `enter_room` (blocker B1).** Since 18237332 a KO'd NPC drops its
  `itemsHeld`, including NPCs in rooms loaded after the start (`npc-hostile.js:139`, `:258-261`).
  A KO before the fund would drop the executive badge, and as a collect task its pickup would
  complete `take_executive_badge` and reveal aim 5 early (`erb:157-160`). So
  `take_executive_badge` (`erb:365-375`) becomes `"type": "enter_room", "targetRoom":
  "executive_wing"`, title "Get through the executive wing door". The wing is behind the data
  centre, which is behind the flag-3 PIN, so the task cannot complete early from the trading
  floor. (A player who skips the fund document and walks straight through the wing can still open
  aim 5 before aim 4 completes. That is possible today with the badge on the data-centre floor,
  so it is not a regression.)
- **[r2] KO relay de-duplicated.** Today a KO drops the wordlist and the CTO badge *and* HaX's
  relay pushes copies (phone `:436-437`), so the player gets duplicates. The drops are now the
  route. `on_irina_ko_relay` gives nothing automatically. It tells the player her kit is on the
  floor beside her, and its state checks and tags sit at the top of the knot. HaX keeps the
  relayed copies as a **backstop the player asks for**: a hub option per item, shown only while it
  hasn't been picked up. Wordlist: `irina_ko and not found_password_lists`. CTO badge:
  `irina_ko and not irina_badge_obtained and not irina_badge_cloned` **[r3]**. Executive badge:
  `irina_ko and found_architects_fund and not irina_exec_badge_given`. Nothing is handed over
  twice, and nothing before the fund. This replaces draft 2's
  `global_variable_changed:found_architects_fund` phone knot, which is withdrawn (W9).
- **[r3] The CTO-badge backstop must switch off once used.** `irina_badge_obtained` is set only
  by the pickup mapping for `m06_cto_badge` (`erb:702-707`). The dropped badge keeps that id
  (`npc-hostile.js:314-315` spreads the item; the pickup event sends `scenarioData.id`,
  `inventory.js:637-643`), but HaX's relayed copy is `relayed_cto_badge` (`erb:673`). HaX's held
  copy is spliced out after the give (`npc-game-bridge.js:306`), so a second ask would fail with
  no item while the option stayed on offer. Add a HaX `item_picked_up:keycard` mapping with
  `data.itemId === 'relayed_cto_badge'` that sets `irina_badge_obtained` (the give emits the same
  event, `npc-game-bridge.js:40-46`). A player who cloned the badge before the KO already opens her
  office, so `irina_badge_cloned` is in the condition too. The wordlist already has this shape:
  both `m06_password_dictionary` and `relayed_password_dictionary` set `found_password_lists`
  (`erb:726-737`). The executive badge has it by design (two mappings, above).
- **[r2] Stale comments to update** (they describe the pre-18237332 gap): `erb:663` (HaX's relayed
  wordlist `_comment`), phone `:432-433` (above the relay knot), `erb:25-28` header "KO
  RESILIENCE", and the "lessons 18/24/37/38" heading at phone `:429`.
- **Text.** Task title `erb:367` and aim description `erb:360` ("from the data centre" → "get
  the spare from Irina"); HaX's fund-found message (`erb:815`): the badge for his wing is with the
  CTO, on the trading floor. The `targetItemIds` edit from draft 2 is moot now that the task is
  `enter_room`.
- **[r3] KO'd Irina variants.** Both texts above assume she can hand it over. The aim description
  is static, so word it to hold either way: "Get the spare executive badge signed out to Irina and
  get through to the CEO's office." Split the fund-found mapping (`erb:810-816`) into two with the
  same pattern and `onceOnly`: one adding `&& globalVars.irina_ko !== true` (the badge is with the
  CTO, on the trading floor), one with `&& globalVars.irina_ko === true` (her kit is where she
  fell; if the badge isn't there, ask me for it). Conditions are `&&`-only, which this fits.
**Cost.** Medium: one item moved, one task re-typed, two ink options, one knot, three hub backstop options, two mappings.
**Depends on** P0, P5 (the hand-over line quotes the fund), P12 (new phone knot follows the rules).

### P10 [r1]. The CTO office gives you leverage ✅
**Why.** F12, M9. The notes promise leverage; make it real. Pattern: m05's evidence-as-leverage
(`scenarios/m05_insider_trading/PUZZLE_CHAINS_PLAN.md:778`).
**What.** `irina_research_notes` gets `onPickup: { setVariable: { read_irina_notes: true } }`
(declare the global). In `recruitment_decision`'s low-trust branch
(`m06_npc_elena_volkov.ink:376-392`), add `{read_irina_notes}` → the player quotes her own last
line back to her, and she accepts. Players who never went in can still turn her by trust or by
giving her time (`:388-392`). The optional room now changes an outcome; nothing requires it.
**Cost.** One global, one option, one short knot. **Depends on** P0.

### P11 [r1]. Delete dead state ✅
**What.** Remove `player_approach`, `mission_priority`, `handler_trust`, `evidence_level`,
`lore_collected` (`erb:474-475`, `:490`, `:492-493`), the `base64_encode` helper and its `require`
(`erb:32`, `:35-37`), the debrief's `objectives_completed` VAR (`:10`) and the stale comment at
`:377`. Grep each before deleting. **Depends on** P0 (same file pass).

### P12 [r1][r2]. Phone-chat rules across the whole HaX ink ✅
**Why.** F13; brief rules E10/E13, M5.
**What.** For every resting or event knot in `m06_phone_agent_0x99.ink` (`first_call` `:62`,
`support_hub` `:93`, `initial_guidance`, the six `on_*` knots `:253-460`, the field-guide knots):
- text knot → divert → **choices-only** knot, so a re-navigation replays nothing;
- a state check at the top of each resting knot (KO, decided, availability) that diverts;
- "not yet" knots print no NPC text (the preload would add an unread message);
- once-only texts get a backstop, because phone history is memory-only
  (`npc-manager.js:374-395`): **[r2]** Irina's KO items are on the floor, with HaX's ask-for
  backstop options (P9); the Satoshi-KO question keeps its sticky hub option and room re-entry
  (`erb:833-839`);
- **[r2]** declare the synced VARs the checks and options read and the ink lacks today:
  `irina_ko`, `irina_badge_obtained`, `irina_badge_cloned` [r3], `irina_exec_badge_given` (the phone ink declares
  `satoshi_ko` but no Irina KO VAR, phone `:7-41`). loopcheck injects them (§12).
**Check.** inkcheck/loopcheck with injected states (§12). **Depends on** P0.

## 6. What could break

- **Solvability of the new lock (P8).** The pick route is always there because the lockpick is in
  the start kit; P8 must not ship before P1. A guard who catches you only talks. If the
  `#unlock_door` probe fails, use the key fallback in P8, never a door that only the guard opens.
- **The guard window.** A dwell near the cone edge sometimes catches and sometimes doesn't (m03 pass
  3e). **[r2]** The range edge flickers in the same way, and the player can stand anywhere within
  64 px of the door, so P8's margins are worked over that whole area. **[r3]** On the corrected
  area model (sprite centres, not floor tiles) and range 210 they are ≥ 22° and ≥ 16 px for the
  seen dwells, ≥ 79° for the safe ones and ≥ 30° for his opening 'down' stance. Draft 3's
  "≥ 24° and ≥ 26 px" used the wrong area. The playtest picks from the near and far corners in
  both windows (§12).
- **Swallowed picks.** **[r2]** Omitting `cooldown` is not "none": it defaults to 5000 ms
  (`npc-manager.js:518`) and eats a retry inside 5 s. Set `"cooldown": 0` and assert it.
- **[r2] A key in the pocket bypasses the guard.** With any key held, the key-selection minigame
  opens and the LoS gate never runs (`unlock-system.js:162-176`). No key exists before this door;
  keep it that way. **[r3]** A `key_ring` counts too: its keys are added to the same list
  (`unlock-system.js:139-155`).
- **[r3] A refused `#unlock_door`.** The tag is fire-and-forget (`chat-helpers.js:64-83`), so the
  ink cannot tell a refusal from a success. P8's `guard_waved_through` checks keep the guard
  friendly, and the door stays pickable; the probe settles which mode ships.
- **[r3] Backstops that never switch off.** Any ask-for relay option must be cleared by the
  pickup of *every* copy that satisfies it (dropped original, relayed copy, clone). P9 lists the
  mappings; loopcheck covers the states (§12).
- **KO routes.** Five KO-able NPCs after P8. **[r2]** KO'd NPCs drop their `itemsHeld`
  (`npc-hostile.js:139`). Guard KO: free picking, credit line (and the dropped key, in P8's
  fallback mode). Irina KO: wordlist, CTO badge and executive badge drop beside her; HaX offers
  relayed copies only for items not yet picked up, the executive badge only after the fund (P9).
  Satoshi KO: the phone knot puts the asset decision, unchanged apart from P4/P6 wording. Trader
  and analyst: no items, unchanged.
- **Early aim reveal (P9).** **[r2]** Holding the executive badge no longer completes anything:
  `take_executive_badge` is `enter_room: executive_wing`, behind the flag-3 PIN. An early KO drop
  of the badge is harmless to aim order. The hand-over and HaX's backstop are still gated on
  `found_architects_fund`, so the badge reaches non-violent players only after the door is seen.
- **Irina's fate before the fund (P9).** The transaction-graph route reaches `reveal_identity`
  before the fund (`m06_npc_elena_volkov.ink:167`, `:320-338`), so the hand-over must also sit in
  `after_choice`. Without it a player who detained her early would be stuck.
- **Clone cancel (P1).** After the fix, a cancelled clone must leave the clone option on offer.
- **Reload.** Ink variables persist since 1de257bb, and phone history does not
  (`npc-manager.js:374-395`). The checkpoint door's unlocked state must survive a reload (server
  records the unlock); the guard must not replay his opener to a player he already let through.
- **Rename (P0).** A missed global or VAR fails silently: a condition just never matches. The
  loopcheck runs and the zero-`elena` assertion are the guard rails. Old saves will not load the
  new ids.
- **[impl] "Met" is recorded on room load, not on talking.** The probe (games 1253/1254)
  listed `checkpoint_guard` as met in a run that never spoke to him: `track_npc_encounters`
  runs when his room loads (`games_controller.rb:1285-1306`). So the server's "has not
  encountered NPC" check would not stop a player who only walked past. It changes nothing here:
  the ink only emits `#unlock_door` from a conversation with him.
- **[impl] The Irina-KO relay is three timed texts, not a phone knot** (pass-3 playtest): the
  `conversationMode: phone-chat` mapping took over the screen, and its text ignored a fate already
  settled. `on_irina_ko_relay` is gone; the hub backstops are unchanged.
- **[impl] Guard cooldown is 250 ms, not 0** (pass-3 playtest, games 1261-1263). `registerNPC` re-runs
  `_setupEventMappings` for an NPC it already holds (`npc-manager.js:190-214`), so the guard can have
  two listeners under one dedup key. At `cooldown: 0` both fire in the same tick: the first copy of the
  challenge sets `guard_grace` and the copy on screen plays the grace variant. 250 ms drops the
  same-tick duplicate; a real retry can't come that fast (the challenge opens 500 ms after the event).
  §12's "cooldown 0" check now reads "cooldown 250, present". Engine item: the duplicate registration.
- **[impl] A KO-dropped `text_file` can't be taken (engine E20).** Irina's wordlist drops loose on
  a KO and stays on the floor. HaX's ask-for copy (P9) is the working route after a KO; the
  badges are keycards and are unaffected.
- **Layout.** No rooms added, removed or re-typed. `security_checkpoint` stays `hall_1x2gu` (X2):
  `room_security` would move every N/S door from `trading_floor` to `satoshi_office` (x 8.5 → 1.5)
  and collide with the `satoshi_office` re-type (`erb:1418-1421`) and the manifesto pin at {2,6}
  (`erb:1470`). Door alignment is re-run anyway.
- **Debrief gate.** `concludeRequires` stays the four flags (`erb:407-414`). Nothing in this plan
  adds a story task to it.

## 7. Dialogue implications [r2]

Apply `README_ink_best_practices.md`: attribution on every line, choices in the player's voice,
no DONE, hub structure, and directions checked against `connections`.

- **Guard (new ink, P8).** A contract guard, tired and procedural, like m03's but not a copy. Short
  lines. Three beats: the question at the door, the challenge when he catches you picking, and a
  resting line once you are through ("Go on, then."), plus **[r2]** a grace line after a catch
  ("Still here. Still not on my list."). **[r3]** The resting line keys on
  `guard_waved_through`, so it plays even before you have stepped through, and a pick he sees
  after waving you in gets "I said go on", not the challenge. Wrong answers cost nothing but the walk. Voice
  in the en-GB pool, distinct from HaX, Netherton and Nightshade.
- **Irina (P1, P9, P10).** The clone-debrief knot, the badge hand-over (one line about the reader
  install, one about Satoshi's wing), the detained-Irina narrator variant, and the leverage reply.
  Each new option says what the player is doing ("Satoshi's wing. You've a badge for it.").
- **HaX (P1, P3, P4, P6, P8, P9, P12).** Kit line in `final_briefing`; guide give-lines; codename
  lines; the recommendation rewritten; the moved checkpoint text; **[r2]** the KO relay rewritten
  to point at what she dropped, and three short backstop give-lines; **[r3]** a KO'd-Irina
  version of the fund-found text.
  Geography: the CTO is "trading floor, through the checkpoint"; the executive wing is "east off
  the data centre" (`erb:1199-1201`).
- **Satoshi (P4, P5, P6).** Answers to the codename; the toll quotes change; emotes become narrator
  lines; "We stopped the attack" goes.
- **Debrief (P4, P5, P6, P7).** Codename once, new toll, the monitoring cost said plainly, turned
  Irina limited to tonight.
- **Run** `npc-dialog-review` on the guard ink and on Irina's changed knots before playtest.

## 8. Pacing

- **Act one (lobby → checkpoint → floor).** Currently a walk-through: the first thing that pushes
  back is the server-room passphrase at depth 2. P8 gives the opening a small decision (talk, slip,
  or hit) within a minute of the briefing, which is where m01 puts its first lock too.
- **Act two (floor ↔ server room ↔ backend).** Unchanged. The VM chain is the bulk of the time and
  owns the physical path through the data-centre PIN. (m02 already does this with its flag payouts,
  `m02 erb:2040-2045`; draft 1's "first time technical work owns the physical path" was wrong.)
- **The turn.** The fund document in the data centre (depth 4). Today the badge lies beside it, so
  the turn and the next door collapse into one room. After P9 the turn sends the player back
  through the server room to the trading floor to put the fund in front of Irina, then forward
  again: four extra crossings through two rooms that already matter. The walk has a purpose (the
  conversation with the woman who built the mixer) and ends at the door they have already seen.
- **Resolution.** Executive wing → CEO office (depth 6): the confrontation and the asset decision.
  Irina's fate can now be settled during the hand-over, so the trip back is not wasted on the way to
  the ending.
- **Traversal in the final act.** Data centre → floor → data centre → wing → office is six room
  transitions. m02's final act is longer; this one stays short.

## 9. Capability arc

**Carried in (start kit after P1):** phone; lockpick (m01); RFID cloner (m03); fingerprint kit (m04).
No PIN cracker (arc rule: ENTROPY device, not issued after m02). m05's plan asked for exactly this
(`m05 PUZZLE_CHAINS_PLAN.md`, §9 "For m06's planner").

**Spent in m06:**
- Lockpick — the checkpoint door (P8). Its only m06 use.
- Cloner — Irina's CTO badge (P1), one of three routes.
- Fingerprint kit — carried, unused. Nothing in HashChain has a reason to sit behind a print, and
  inventing one would break Step 3d. Noted, not acted on.

**Granted by m06:** no new class of tool. What m06 adds is the **VM opening the physical path**
(the data-centre PIN from flag 3) and **evidence as leverage** (the fund opens Irina; P9, P10).
Both carry forward without new kit.

**For m07's planner:** m07's start kit has phone and lockpick only (`m07 erb:215`).
Under the arc rule it should also carry the cloner and fingerprint kit, and m06 grants nothing
new. m07's briefing already assumes the m06 split (`m07_opening_briefing.ink:27`); P5 makes m06
agree with it.

## 10. Withdrawn and corrected

Do not re-propose these.

- **W1. A guard who only watches** (draft 1's P8 as evasion beside an open door). Withdrawn [r1]:
  line of sight only interrupts lockpicking (`npc-manager.js:261-290`), so with no pickable lock
  he is decoration. Replaced by the turnstile.
- **W2. Re-typing the checkpoint to `room_security`.** Withdrawn [r1] (X2): moves every N/S door
  between `trading_floor` and `satoshi_office` and collides with `erb:1418-1421` and `erb:1470`.
- **W3. A guard who turns hostile when he sees you.** Withdrawn [r1]: being seen opens his
  challenge. PASS3 D8's "threat cue" reason for the guard no longer applies; Satoshi already
  turns hostile (`m06_satoshi_confrontation.ink:440`).
- **W4. A cooldown on the guard's lockpick mapping.** Withdrawn [r1]: the interrupt gate ignores
  it, so it only swallows a retry (m03 `erb:1171`). **[r2] corrected:** draft 2 implemented this as
  "omit `cooldown`", which gives the 5000 ms default (`npc-manager.js:518`). The rule is
  `"cooldown": 0`, set explicitly.
- **W5. Repointing the cracking guide to distcc only** (PASS3 L1 interim). Replaced [r1] by both
  guides with honest framing (P3).
- **W6. The executive badge as a pickup in Irina's office.** Considered for P9 and rejected: an
  early visit hands it over before the door is seen (key-before-lock) and reveals aim 5 early.
- **W7. A third option for the fund** (D4), **Satoshi escaping** (D5), **a turned Irina in later
  missions** (D6). Ruled out by the PASS3 log.
- **W8. AND gates or story tasks in `concludeRequires`.** Not mechanics (skill Step 1).
- **W9 [r2]. Executive badge as a collect task, and the phone knot on `found_architects_fund` that
  relayed it to a KO player.** Withdrawn: KO drops (`npc-hostile.js:258-261`) put the badge on the
  floor before the fund, and a collect task would reveal aim 5 early. Replaced by the `enter_room`
  task and the ask-for backstop (P9).
- **W10 [r2]. HaX's automatic KO relay of wordlist and CTO badge.** Withdrawn: the KO drops the
  originals, so the relay hands over duplicates. Kept only as the ask-for backstop.
- **W11 [r2]. Round 2's worked patrol** (dwell (5,4) east, walk to (7,4), walk back to (4,4), range
  150). Not adopted. Over the full pick area its seen dwell has only 12° of cone margin and 10 px of
  range margin, and its east walk ends at (7,4), where part of the area is seen and part is not.
  P8's two-waypoint loop replaces it (range 225 in draft 3, 210 since round 3).
- **W12 [r2]. Changing the freeze credit (`erb:133`).** Withdrawn: with $12.8M as the pending
  balance (P5), "FROZEN — $12.8M" is accurate.
- **W13 [r3]. "m03's lobby grace-clear mappings lack `cooldown: 0`, fix m03 too."** Withdrawn:
  in the working tree both m03 mappings already set `"cooldown": 0` (`m03 erb:890`, `:896`; they
  were added in m03's own pass 3, after HEAD). Nothing to do in m03, and no cross-mission
  approval item. The m06 half of the finding stands (P8).
- **Draft 3's P8 window figures** [r3]: the "floor strip y 2–3" area and the 12°–36° / 169 px,
  10°–28° / 199 px rows measured from floor tiles, not sprite centres. Replaced by the
  round-3 table; range 225 → 210.
- **Corrections to draft 1** [r1]: "0 hostile NPCs" (Satoshi, `:440`); the safe's three-strike
  "trap" (per opening, no server lockout; P2); "depth seen" one too deep (§3); critical-path hops
  are 5 (`dungeon_graph.md:22`), aims 6, KO-able NPCs 4; HaX's checkpoint message is at `erb:743`;
  "first time technical work owns the physical path" (m02 did it first); round 1's m03 cone of 140°
  is now 120° (`m03 erb:1166`).

## 11. Needs user approval

None of these blocks the plan.

- **L1 (HacktivityLabSheets, SecGen; already logged).** The distcc and rfid-cloning sheets'
  Mission Application sections describe m03 (`distcc-exploitation.md:64-66`, `rfid-cloning.md:53-55`);
  an offline-cracking SAFETYNET sheet does not exist; SecGen `m06_follow_the_money.xml:51` still
  points `lab_sheet_url` at ssh-access-and-bruteforce. If declined, P3's give-lines carry the
  honesty.
- **Canon (pre-approved, PASS3 D2).** One alias line in `crypto_anarchists.md` (P4).
- **Other missions (not this pass).** m07's start kit (§9). Logged for m07's planner, not changed here.
- **E-toast [r2] (engine, cosmetic).** A successful `#unlock_door` shows the raw room id ("Door
  unlocked: trading_floor", `chat-helpers.js:71`). Showing the room's `door_sign` instead would be
  an engine change. If declined: the guard's own line covers the moment and the toast stays.

## 12. Done when

All of these pass on the working tree after implementation. `M=scenarios/m06_follow_the_money`.

**Build and static checks**
- [ ] `scripts/compile-ink.sh` compiles every m06 ink (incl. the renamed Irina pair and the new
      guard ink) with no errors; every `.json` is newer than its `.ink`.
- [ ] `ruby scripts/validate_scenario.rb $M/scenario.json.erb`: no errors, no new warnings; the
      dungeon graph regenerates with 6 locks and 5 critical-path hops.
- [ ] `python3 scripts/check_door_alignment.py $M/scenario.json.erb`: all OK, same door
      coordinates as today (§6).
- [ ] `python3 .claude/skills/mission-puzzle-chains/scripts/room_depth.py $M/scenario.json.erb`:
      `trading_floor` locked; depths unchanged.

**Rendered-JSON assertions** (`ruby tools/pass2/render.rb $M/scenario.json.erb <scratch>/m06.json`)
- [ ] `grep -i elena` finds nothing in the rendered JSON, `$M/ink/*.ink`, `$M/ink/*.json`,
      README.md or TESTING_WALKTHROUGH.md (dated notes in ALIGNMENT_PLAN.md and
      PASS2_IMPROVEMENTS.md excepted).
- [ ] `startItemsInInventory` types are exactly phone, lockpick, rfid_cloner, fingerprint_kit; no
      `rfid_cloner` object in any room; no `pin-cracker` anywhere.
- [ ] `trading_floor` has `locked`, `lockType: "key"`, `keyPins`; `checkpoint_guard` lists
      `unlockable: ["trading_floor"]`, has a `lockpick_used_in_view` mapping with **`"cooldown": 0`**
      (present and zero, not absent) [r2], has `los.visualize: true`, `range: 210` [r3], `angle: 120` and
      the two-waypoint loop from P8 [r2]; his ink has no `#hostile`.
- [ ] [r2][r3] No `type: "key"` or `type: "key_ring"` item is reachable before the checkpoint
      door: none in `startItemsInInventory`, `reception_lobby`, `security_checkpoint` objects, or
      the HaX / briefing NPCs' `itemsHeld` (the guard's fallback key, if used, is the only one, and
      it is his).
- [ ] [r3] Fallback mode only: `trading_floor` has `requires: "checkpoint_door_key"`; the guard's
      key has `opens_lock: "checkpoint_door_key"`, no `key_id`, and `keyPins` equal to the lock's;
      his ink's tag is `#give_item:key:checkpoint_door_key`. In primary mode the lock has no
      `requires` and the guard holds no key.
- [ ] [r2][r3] `guard_resolved`, `guard_waved_through`, `guard_grace`, `guard_ko` are declared; the
      `room_entered:trading_floor` → `guard_resolved` mapping is on `agent_0x99_handler`; the
      `room_entered:reception_lobby` mapping clears `guard_grace` and has `"cooldown": 0`
      (present and zero) [r3].
- [ ] [r3] Credits: the guard's KO line's condition contains `!guard_waved_through`; no two of
      the three guard conditions can be true together.
- [ ] No object in `data_center` has `card_id: "executive_badge"`; Irina's `itemsHeld` and HaX's
      relayed copy do. [r2] `take_executive_badge` is `type: "enter_room"`, `targetRoom:
      "executive_wing"`. Irina's ink gives it with `#give_item:keycard:executive_access_badge`.
      `irina_exec_badge_given` is set only by `item_picked_up:keycard` mappings (grep the inks:
      no `#set_variable:irina_exec_badge_given`).
- [ ] [r3] `irina_badge_obtained` is set by two HaX `item_picked_up:keycard` mappings, one for
      `m06_cto_badge` and one for `relayed_cto_badge`. The fund-found message is two mappings split
      on `irina_ko`; the aim description no longer says the badge is in the data centre or that
      Irina hands it over.
- [ ] [r2] The HaX KO relay knot has no `#give_item`; the stale "never drop" comments
      (`erb:25-28`, `erb:663`, phone `:429-433`) are gone.
- [ ] The fund document has no "simultaneous" line, names "Satoshi's Ghost", and has a paid and
      a pending figure for each of the six cells; the pending figures sum to $12.8M [r2]; the
      transaction analysis (`erb:46`) lists the advances as outbound and still nets to $12.8M [r2].
- [ ] [r2] The old toll appears nowhere in the **live** files: the rendered JSON, `$M/ink/*`,
      README.md, TESTING_WALKTHROUGH.md. Stale docs (ALIGNMENT_PLAN.md, PASS2_IMPROVEMENTS.md,
      this plan) are excluded. Grep both "X-Y" and "X to Y" forms, and the old upper bound alone.
- [ ] No global or task is set on the `#clone_keycard` line itself; a `card_cloned` mapping with a
      `data.cardName === 'CTO Access Badge'` condition sets `irina_badge_cloned` [r3].
- [ ] [r3] `grep has_rfid_cloner $M/ink/m06_npc_irina_volkova.ink` finds nothing.
- [ ] The P11 globals and the `base64_encode` helper are gone; `guard_resolved`, `guard_ko`,
      `read_irina_notes`, `irina_exec_badge_given`, `irina_badge_cloned` [r3] are declared.

**Ink runtime** (`node scripts/ink_runtime_check/inkcheck.js <file.json> <knot>` and
`loopcheck.js <file.json> <knot> KEY=VALUE …`)
- [ ] inkcheck on every changed knot (pass the knot, not just the file).
- [ ] loopcheck the HaX phone `start` and `support_hub` with: fresh; `irina_ko=true`;
      `irina_ko=true found_password_lists=true irina_badge_obtained=true` (no backstop options
      shown); [r3] `irina_ko=true irina_badge_obtained=false irina_badge_cloned=true` (no CTO-badge
      backstop); `irina_ko=true found_architects_fund=true irina_exec_badge_given=false` (exec-badge
      backstop shown); `satoshi_ko=true assets_decided=false`; `satoshi_ko=true
      found_wallet_keys=false`; all flags and both decisions set. [r2]
- [ ] loopcheck Irina `start` with: first meeting; `found_architects_fund=true`;
      `irina_arrested=true irina_fate_decided=true found_architects_fund=true
      irina_exec_badge_given=false`; recruited; `read_irina_notes=true` low trust; [r3]
      `irina_badge_cloned=true` (no clone option) and `irina_badge_cloned=false` after a give
      (clone option still offered).
- [ ] loopcheck the guard `start` and `on_lockpick_seen` with: fresh; `guard_grace=true` (no cover
      option); `guard_resolved=true` [r2]; [r3] `guard_waved_through=true guard_resolved=false`
      (resting line plus a re-issued `#unlock_door`, no question and no challenge).
- [ ] loopcheck the debrief `start` with: freeze; monitor; Irina turned / detained / KO'd;
      Satoshi KO'd.

**Playtest** (Sonnet agent, `playtest-scenario`; the Rails server on :3000 is already running)
- [ ] **`#unlock_door` probe first**, before any other P8 work is tested: talk the guard round and
      confirm the door opens and the server accepted the NPC unlock (no "Failed to unlock" toast;
      the door is still open after a reload) [r3]. If it fails, switch to P8's key fallback.
- [ ] **Turnstile guard window:** the cone is drawn [r2]. [r3] He spends his first 4 s facing down
      at (4,4), which is safe: the playtester should not read an early free pick as a broken cone,
      and should time the windows from his first move east. From both the near corner (right under
      the door) and the far left corner of the pick area (room tile about (6.5, 1.2), the left and
      top limits of the sprite-centre area) [r3]: pick during the safe window → the lockpick minigame opens; pick during
      the seen window → his challenge opens, no hostility; retry within 5 s → a pick or a
      challenge, never nothing [r2]. After a catch, talking to him offers no cover until you have
      been to the lobby and back [r2], including a lobby re-entry within 5 s of the last one [r3].
      KO him → picks are free. [r3] Talk through, then KO him → the credits show only the
      talked-through line.
- [ ] **Clone cancel/retry:** start the clone on Irina, cancel the RFID minigame → the clone option
      is still on offer; clone again → the badge opens her office and the global is set.
- [ ] **Executive badge:** find the fund; the wing door refuses; walk back; Irina hands over the
      spare; the door opens; `take_executive_badge` ticks on entering the wing. Repeat with Irina
      detained before the fund.
- [ ] [r2] **Irina KO'd before the fund — check the floor for drops:** wordlist, CTO badge and
      executive badge lie beside her and can be picked up; aim 5 does not appear; HaX gives no
      duplicates; HaX's hub offers a relayed copy only for an item left on the floor (executive
      badge only after the fund). [r3] Ask HaX for the CTO badge, take it → the option is gone.
      Repeat with the badge cloned before the KO → the option never appears. The fund-found text
      points at where she fell, not at the CTO on the floor.
- [ ] [r3] **Clone after a give:** take Irina's wordlist, then in the same conversation the clone
      option is still on offer.
- [ ] **Mid-mission reload** after the guard has let you through and Irina has given the wordlist:
      the checkpoint door stays open; the guard and Irina don't replay their openers; the briefing
      doesn't replay; the HaX phone shows no duplicated or unread "not yet" message.
- [ ] Full run to the debrief on the freeze branch and on the monitor branch: the debrief names the
      codename once, states the monitoring cost on that branch, and makes no future promise for a
      turned Irina. Credits show the guard line.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*
