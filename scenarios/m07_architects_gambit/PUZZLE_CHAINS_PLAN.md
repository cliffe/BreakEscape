# m07 The Architect's Gambit — puzzle-chains plan (pass 3)

> Draft 3, 2026-10-01. **Status: signed off after review round 3; implementing.** Round 3's
> minors r3-m1 to r3-m6 are folded in below (tagged [r3-mN]).
>
> **Draft 3 changes, by round-2 item.** r2-M1: the non-Trojan verdicts split on
> `redirect_window_closed`; six latched mappings (P5). r2-M2: the redirect confirmation is
> `onceOnly` and credits Elena only when she was the source (`verdict_from_elena`, P5). Minors:
> r2-m1 probe wording (P5); r2-m2 "same room as the door" (P6); r2-m3 three tries per opening (P6,
> §3); r2-m4 HaX hint at the vault (P6); r2-m5 `!park_ko` on the switch variant (P8); r2-m6 a sixth
> Park line for the fight-and-escape (P8); r2-m7 the handover alone opens the leverage (P4); r2-m8
> §6 wording; r2-m9 CONTRACT.md:30 and the grep exemption (P9); r2-m10 Hollis is thirty-six (P9);
> r2-m11 approval-log line numbers; r2-m12 Park arrives "when the alarms went" (P4); r2-m13 the
> ops-floor music fires once through a global (P2). Also taken: the "T. PARK" visitor-log row (P4),
> staggered vault tasks (P6), the inventory-badge note for playtesters (§12), a 3000 ms extract
> delay (P5), and the correction that a turned Elena also opens the plant early (P4).
>
> Draft 2 notes follow.
> Derived from `scenario.json.erb` (cited `erb:N`), the ink (`<file>.ink:N`) and the engine.
> The hand-written docs (SOLUTION_GUIDE.md, CONTRACT.md, planning/) were not trusted.
> Line numbers are for the working tree before this plan is implemented.
>
> **Draft 2 changes, by round-1 item.** M1: the guard is renamed Ray Hollis (orchestrator
> decision), now P9 ✅ with the full rename scope. M2: the kit line moves to the briefing's
> `start` knot (P3). M3: the vault code is a rule (extract or Hollis) plus an input at the door
> (P6); the task ticks when the door opens. M4: the verdict text keys on Elena's conversation
> closing or on reading the extract, behind one latch (P5). M5: `vault_entered` splits Park's
> endings; the transfer switch shows the evade (P8). M6: talking Hollis round pays a vault tip and
> a warning about Park that no other route gives (P4). M7: world `text_file` pickups are broken
> (orchestrator's browser probe, game 1252; logged as E20); the projection and the mole intercept
> become `notes` (P10, new). The mid-conversation clone is withdrawn (W7). Minors m1–m13 are
> fixed where they land; see §13.

## 0. Status and fixes already made

**State at the start of this pass.** Validator: 0 errors, 6 warnings (all the co-firing
`onceOnly` pairs that PASS2_IMPROVEMENTS.md judged intended). The six "❌ INVALID `targetKnot`"
lines pass 2 recorded no longer appear: the validator has since been fixed. Door alignment 5/5.
Critical path 3 hops. The mission was playtested end to end in pass 2 (games 1177/1178).

**Fixed during planning (unambiguous factual bugs):**

| # | Bug | Fix | Checked |
|---|---|---|---|
| X1 | With the team never committed (briefing closed early, HaX's commit ignored), the debrief said "Two operations went unanswered. I am reading both." and then read all three, because each `dark_*` stitch runs when `team_assignment != <op>` (`m07_closing_debrief.ink:213-221` after the fix). That state is reachable and has its own credit line (`erb:173`). | The line now branches on `team_assignment == ""` ("Three operations went unanswered. I am reading all three."). | compiled 8/8; `inkcheck` debrief `start` 64/64 clean; `loopcheck` `debrief_hub` clean |
| X2 | The visitor log cited "FERC CIP-004" (`erb:1068`, `:1070`). CIP-004 is personnel and training. Visitor logging is NERC CIP-006 R2 (visitor control program), and the standards are NERC's (FERC approves them). | "NERC compliance requires it"; "(NERC CIP-006 visitor control. Retention: 3 years. …)". | validator 0 errors |

**[r1 m10] X2 needs one more word.** CIP-006-6 R2.3 sets visitor-log retention at *at least
ninety calendar days* (checked: WECC's CIP-006-6 R2 guidance and SERC's R2 self-report sheet both
quote R2.3). Three years is longer than the standard asks, which is fine as site policy, but the
header currently reads as if CIP-006 set it. P2 changes the header to "(NERC CIP-006 visitor
control. Site retention: 3 years. …)". The player's line "Compliance record, three years'
retention" (`m07_npc_jake_morrison.ink:96`) stays: it describes the site's record.

Nothing else was changed. The four m07 figures m06's fund document now depends on
(`m07_opening_briefing.ink:27`, `:51`, `:116`, `:185`, `:214`, `:223`) are untouched by this plan.

## 1. Summary — what to do, in order

m07 already works: it validates, it was playtested to completion twice, and its finale has a real
planning beat (open the control room before the login arms the clock). This pass fixes its phone
inks and its broken world pickups, gives the guard and the vault real chains, makes the revision
something the player reads, renames the guard, and brings the kit into line with the arc.

The guard is called **Ray Hollis** (`ray_hollis`) everywhere below, including where the current
code still says Jake Morrison (`jake_morrison`). P9 does the rename.

| Phase | Item | What | Needs | Marker |
|---|---|---|---|---|
| done | X1, X2 | Uncommitted-team debrief count; visitor-log standard (§0) | — | ✅ done |
| 0 bugs | P10 | **[r1 M7]** World pickups: the projection and the mole intercept become `notes`, so they are taken and set their globals | — | ✅ |
| 0 bugs | P1 | Phone inks: choices-only knots; resting knots re-check state (HaX redirect, commit; Architect `dormant`) | — | ✅ |
| 0 bugs | P2 | Dead ERB helpers; cones hidden; checkpoint task title; board temperature; lockpick text; visitor-log header; music when uncommitted | — | ✅ |
| 0 bugs | P8 | Park: endings for "never went down", "walked past him" and "evaded"; the switch shows the evade | P10 | ✅ |
| 1 canon | P9 | **[r1 M1]** Rename Jake Morrison → Ray Hollis (orchestrator decision), with CONTRACT.md updated | — | ✅ |
| 1 kit | P3 | Start kit: picks, cloner, print kit; the briefing's `start` knot names it | — | ✅ |
| 2 chains | P5 | Flag 1 pays out the coordination extract; reading it sets `projection_revised`; HaX nudges, then gives one verdict whichever source came first | — | ✅ |
| 2 chains | P6 | Vault code: the rule from the extract or Hollis, the input on the transfer switch plate in the door's room; HaX hint; staggered vault tasks; the task ticks when the door opens | P5 | ✅ |
| 2 chains | P4 | Hollis: leverage needs the handover's print-history line (1), which the visitor log (0) points at; talking him round pays the vault rule and a warning about Park; an ending for every state | P6, P9 | ✅ |
| 2 chains | P7 | Scanning guide → SSH guide (`ssh-access-and-bruteforce`), offered at flag 2 | P1 | ✅ |

Walked top to bottom: every "Needs" points earlier in the table. P9 sits before P3–P7 so that
the new lines are written with the new name once.

## 2. Headline numbers

From `room_depth.py`, the validator (`dungeon_graph.md`) and m06's plan §2 for m01/m02 (run 2026-10-01).

| | m01 | m02 | m07 now | m07 after plan |
|---|---|---|---|---|
| Rooms | 13 | 13 | 6 | 6 |
| Empty rooms | 0 | 2 | 0 | 0 |
| lockType declarations | 12 | 15 | 6 | 6 |
| Max room depth | 3 | 7 | 4 | 4 |
| Critical-path hops (aims) | 9 | 4 | 3 | 3 |
| Social locks (an NPC who needs evidence) | — | — | 2: Hollis (visitor log), Park (projection, unreachable today, P10) | 2: Hollis's evidence from the ops floor, pointed at by the checkpoint log (P4); Park's projection option works (P10) |
| Start-kit tool classes | 1 | — | 1 (lockpick) | 3 carried (lockpick, cloner, print kit; P3); 1 used (lockpick) |
| KO-able NPCs | — | — | 4 (`erb:872`, `:1184`, `:1335`, `:1489`) | 4 |

The six locks: badge station PIN (`erb:1036-1048`), server hall RFID (`erb:1155-1159`), control room
password (`erb:1308-1312`), generator hall key (`erb:1414-1419`), cable vault PIN (`erb:1462-1466`),
cascade console flag (`erb:1356-1363`).

m07 is small, and should stay small. The VM chain is most of the play time (90 minutes estimated,
`mission.json`), and the clock (`erb:537-593`) depends on the walk from the server hall to the console
staying short. This plan adds no rooms and moves no doors, so door parity can't shift (Step 5).

## 3. Boss-key audit

Depths from `room_depth.py`: checkpoint 0, ops floor 1, server hall 2, control room 3, generator hall 3,
cable vault 4. "Seen" is where the player first meets the lock; for a door, that is the room it opens from.

| Lock | Seen | Key / code / evidence | Available | Verdict now | After plan |
|---|---|---|---|---|---|
| Badge station PIN `0616` (`erb:1036-1061`) | 0 | Shift handover sheet (`erb:1131-1143`) | 1 | ✅ boss-key | ✅ unchanged |
| Server hall RFID (`erb:1155-1159`) | 1, reader on the ops floor's east side (`erb:744-749`) | Hollis's badge by talk or KO (0); printed badge (0, after the PIN from 1) | 0 | ⚠️ key-before-lock for Hollis; ✅ for the printer | ✅ talk route now needs evidence from 1 (P4); KO stays ⚠️, priced in the credits and in what it loses (§6) |
| Hollis's leverage (`m07_npc_jake_morrison.ink:50`) | 0 | Visitor log (`erb:1062-1074`) | 0 | ❌ same-room | ✅ log asks the question at 0, handover answers it at 1 (P4) |
| Generator hall key (`erb:1414-1419`) | 2, south wall of the server hall | Plant key (ops floor, `erb:1096-1108`); lockpick (kit) | 1; start | ✅ *by design* (m01 picks); the key is ⚠️ key-before-lock | unchanged (F10) |
| Cable vault PIN `4703` (`erb:1462-1466`) | 3, south wall of the generator hall | Maintenance log (`erb:1436`); Elena (`m07_npc_elena_rodriguez.ink:283`) | 3; 2 | ❌ same-room (log); ⚠️ key-before-lock (Elena) | **[r1 M3]** ✅ boss-key for the rule routes: the *rule* ("last four of the ATS-1 plate serial") comes from the flag-1 extract (2) or a talked-round Hollis (0); the *input* is the plate on the transfer switch (3), in the same room as the door, so the code is worked out only with the keypad in view. The log says the old code is void. Without the rule it is **deducible at the door** (the void mark, two 16 JUN entries side by side, an 8-digit plate serial); the rule makes it certain. Elena (2) still gives the number: ⚠️ key-before-lock *by design*, the price is turning her (P6) |
| Control room password (`erb:1308-1312`) | 2, north wall of the server hall | Elena (`m07_npc_elena_rodriguez.ink:281`); flag-2 capture (`erb:1273-1286`) | 2 | ⚠️ same room, but the flag-2 route's hunt is the VM (NFS, then a full port scan, `m07_phone_agent_0x99.ink:360-369`) | unchanged; see §10 W4 |
| Cascade console (`erb:1356-1382`) | 3 | Flag-4 reward `unlock_object` (`erb:1263-1267`) | 2, after root | ✅ boss-key: HaX tells the player to open the door before logging in (`m07_phone_agent_0x99.ink:101-102`, `:376`), the console says no (`erb:1363`), root is downstairs, the walk back is the payoff | unchanged |
| Park, social (`m07_npc_thomas_park.ink:46`) | 4 | Casualty projection (control room, `erb:1396-1409`) | 3 (other branch) | ❌ **unreachable today**: the projection is never taken, so `casualty_projection_found` stays false (F11) | ✅ boss-key when the vault comes first (P10); evade (`:109-115`) keeps him there for the return (`:117-121`), and evade now has a cost (P8) |
| Elena's turn (`m07_npc_elena_rodriguez.ink:108`, `:111`) | 2 | Her own `q_told`, or the projection (3) | 2; 3 | `q_told` works; the projection opener is dead today (F11) | both work (P10) |

**Reading the table.** Three real defects (F1, F4, F11) and one structural fact. Everything the
critical path needs (badge aside) is in the server hall: the VM, the relay, Elena, the
control-room password. That is a deliberate choice, and it keeps the clock fair (§8). This plan
fixes the three defects and leaves the hub alone.

**[r1 M3] Why the vault needed a rule plus an input.** Flag 1 is the first VM step and the relay is
in the server hall, so the extract normally reaches the inventory before the player has seen the
vault keypad. Moving the code from the log to the extract, as draft 1 did, only moved it to a room
two doors away, and its `onRead` ticked "Work out the plant keypad code" there. After P6 the
extract (or Hollis) says *where* the code is; only the plate in the door's room says *what* it is.

## 4. Findings

**F1. The guard (today Jake Morrison, Ray Hollis after P9) gates nothing, and his cone does
nothing.** (m06 cites him as a guard pattern; this is what he actually does.)
- The checkpoint → ops floor connection has no lock (`erb:600-602`, `:1087-1093`). He never starts a
  conversation, so a player can walk past him without a word.
- His patrol and visualised cone (`erb:888-911`) only act through a `lockpick_used_in_view` mapping
  (`npc-manager.js:258-290`), the only LOS event the engine emits (`unlock-system.js:193`). He has
  none, and there is no pickable lock in his room. The ink's "evade" is a conversation choice
  (`m07_npc_jake_morrison.ink:167-175`). PASS2_APPROVAL_LOG.md m07 §5 logged this.
- What he is: the holder of one of the server-room badges (`erb:912-923`).
- His leverage option needs only `visitor_log_read` (`m07_npc_jake_morrison.ink:50`), and the
  visitor log sits on his own desk (`erb:1062-1074`). Clue and lock are in the same room.
- The log asks the question ("who signed this off??", `erb:1070`) and nothing in the building answers
  it. His leverage line asserts "Your login, your signature" (`ink:50`), which no document shows.
- Task title "Get past Jake Morrison on the checkpoint desk" (`erb:289`) describes an obstacle that
  isn't there.

**F2. The start kit breaks the arc rule, and the briefing gives no reason.**
- `startItemsInInventory` is phone + lockpick (`erb:215-233`). The rule wants the m03 cloner and the m04
  fingerprint kit as well; the PIN cracker stays out.
- The only story line is "You'll have Agent HaX on the wire and a lockpick set. That's the deployment."
  (`m07_opening_briefing.ink:54`). That is a statement, not a reason, and it reads as SAFETYNET
  under-equipping its only agent on its worst night. The agent was driving, not flying in from a
  stores-controlled base, so a "stripped kit" story would have to be invented.
- **[r1 m1] Withdrawn from draft 1:** the claim that an inventory keycard click opens the
  biometrics minigame. An inventory keycard has `takeable = false` (`inventory.js:618`), so the
  click takes the keycard branch (`interactions.js:725`), which without a cloner shows "You need an
  RFID cloner to clone this card" and returns (`:745-748`). Only `fingerprint_kit` starts
  biometrics (`:858-866`). A1 is dropped with it (§11).

**F3. The Trojan Horse revision is handed over, not read.**
- All three flag-1 mappings set `projection_revised` on submission (`erb:661-682`), and HaX's message
  states the conclusion for the player ("nine days dormant, not ninety", `erb:666`).
- Flag 1 is required (`concludeRequires`, `erb:481-487`; the debrief trigger needs `flag1_submitted`,
  `erb:1017`). So every finisher has `projection_revised = true`.
- Dead as a result: the credit "PROJECTION UNCHALLENGED: Two copies of the correction were in the
  building; neither was read" (`erb:176`) and the debrief's "Two independent copies of it. Nobody read
  them." (`m07_closing_debrief.ink:193-196`).
- The design rationale (PASS2_IMPROVEMENTS.md, "Why the revision mechanic exists") says "A player who
  investigates can save people a player who rushes does not". Today the rusher is handed the evidence
  on a required step.

**F4. The vault code is in the room with the vault door.** The keypad door is on the generator hall's
south wall (`erb:1421-1424`); the code is on the log chained in that hall (`erb:1436`). Elena also gives
it (`m07_npc_elena_rodriguez.ink:283`), usually before the door is seen.

**F5. Phone inks break the phone-chat rule (E10/E13).** On reopen after any synced global changes,
the engine re-runs the knot that owns the first saved choice (`phone-chat-minigame.js:532-566`).
- **HaX `redirect_open`** (`m07_phone_agent_0x99.ink:240-263`) holds text and its choices. A player who
  closes the phone on that menu and reopens after the window shuts (flag 3 or the 40-minute timer,
  `erb:551-558`, `:699-703`) is offered "Move them. Trojan Horse. Now." with the window closed.
- **HaX guide knots** (`:390-443`) carry `#give_item` and text before their choice. A re-navigation
  replays them.
- **HaX `first_call_committed`, `redirect_closed`, `moral_soundingboard`** (`:80-106`, `:265-274`,
  `:280-293`): text plus choices.
- **HaX `commit_team`** (`:120-150`) is choices-only but doesn't re-check `team_assigned`. Low risk,
  since only it and the briefing set the team.
- **Architect `dormant`** (`m07_architect_comms.ink:73-76`) doesn't re-check `architect_contact`.
  **[r1 m8] Precondition:** the preload of `dormant` prints nothing, so no `storyState` is saved
  then (`phone-chat-minigame.js:367-379`) and a later open starts at `start`. The bug needs the
  player to have *opened his thread before entering the ops floor* (state saved at `dormant`), and
  then to open it from the contact list after the bark. The reopen re-navigates to `dormant`
  (`:532-566`) and shows only "Hang up". T-30 is never heard.
- **Architect taunts, `sign_off`, `dead_air`** (`:82-322`): text plus choices.

**F6. The scanning field guide doesn't fit this VM.**
- `scanning-and-exploitation` is a Metasploit walkthrough with m02's ProFTPD box as its worked example
  (`HacktivityLabSheets/_labs/safetynet/scanning-and-exploitation.md:4`, `:14`).
- m07's host has no exploit step: NFS share, a netcat listener, SSH with recovered credentials, then
  sudo (`SecGen/scenarios/break_escape/safetynet/m07_architects_gambit.xml:124-175`).
- HaX's offer and guide text promise "match it to the exploit, launch" (`erb:772`;
  `m07_phone_agent_0x99.ink:428`).
- `ssh-access-and-linux-basics` exists and fits flag 3. The other four guides exist and fit.

**F7. Park's outcomes don't all have an ending, and "evaded" costs nothing.**
- Not resolved (`park_resolved == ""`, not KO'd): no debrief line (`m07_closing_debrief.ink:316-326`)
  and no credit (`erb:194-196`). **[r1 M5]** This covers two different players. Park has no
  auto-start (no `timedConversation`, no mapping that opens his chat, `erb:1471-1511`) and "does
  not turn round" (`erb:1504`), so a player can go down, take both lore items and leave without a
  word. Nothing today records whether the player entered the vault.
- Evaded: he is still at the junction box on re-entry (`m07_npc_thomas_park.ink:117-121`), "four
  minutes" from finishing (`:38`). The debrief and credits still say the switch is intact
  (`m07_closing_debrief.ink:324-325`; `erb:196`). The transfer switch upstairs still says "Whoever
  left it there did not finish" (`erb:1449`).
- **[r1 m2]** The "Evaded" credit (`erb:196`) has no `!park_ko` guard. Evade him, come back and punch
  him, and `park_resolved` stays "evaded" (only `goes_loud` writes "ko", `m07_npc_thomas_park.ink:103`),
  so "Neutralised" and "Evaded" both print.

**F8. Decorative cones.** Park's cone is visualised too (`erb:1505-1510`). The vault has no pickable
lock. The cones show stealth play the engine never checks (F1).

**F9. Name clash with the bible.** The bible has a recurring **Jake Morrison**, a CyberSafe penetration
tester who is secretly ENTROPY, with a double-agent arc (`story_design/universe_bible/07_narrative_structures/recurring_elements.md:78-82`;
`06_locations/notable_locations.md:173-177`). m07's Jake Morrison is an unrelated bought guard. This is
the same class of clash as m05's Sarah Chen and Kevin Park (PASS3_APPROVAL_LOG.md, orchestrator decisions).
**Decided** (`PASS3_APPROVAL_LOG.md:143-144`): he becomes **Ray Hollis**. "Hollis" has no hits
in `scenarios/`, `story_design/`, `app/` or `public/break_escape/js/`. No other mission refers to
m07's guard (grep for `jake_morrison` / "Jake Morrison" outside m07 finds only the approval log).

**F11. [r1 M7] The projection and the mole intercept can never be taken.** Confirmed by the
orchestrator's browser probe (game 1252; `scratchpad/m07-textfile-probe.md`) and logged as engine
item E20 (`PASS3_APPROVAL_LOG.md:112-113`).
- A `text_file` with text opens the text-file minigame and returns (`interactions.js:1366-1408`),
  before the generic takeable pickup. Its read action is `data.onRead || (!data.takeable ?
  data.onPickup : null)` (`:1370`), so a takeable item's `onPickup` never runs, and the text-file
  minigame never adds the item to the inventory.
- `casualty_projection` (`erb:1396-1409`) sets `casualty_projection_found` only from `onPickup`.
  So Park's projection option (`m07_npc_thomas_park.ink:46`) and Elena's projection opener
  (`m07_npc_elena_rodriguez.ink:111`) are unreachable. Park can only be fought, evaded or left.
- `mole_intercept_evidence` (`erb:1539-1549`) never sets `found_mole_evidence`, so the credit
  (`erb:200`), HaX's `topic_mole` and the debrief's full coda never fire. `recover_mole_evidence`
  (`erb:397-407`, `collect_items`) can't reach 2/2.
- `tomb_gamma_dossier` (`erb:1525-1536`) is type `notes`, which takes a different branch
  (`interactions.js:1434-1466`): it fires `onRead || onPickup`, emits `item_picked_up:notes` with
  the item id and calls `addToInventory`. So it should work. It hasn't been watched in a browser.
- The flag rewards are not affected: `give_item` puts a `text_file` in the inventory, and an
  inventory click fires `onRead` (`inventory.js:618`, `:622-623` → `interactions.js:1370`).

**F12. Smaller pass-2 leftovers.**
- The lockpick's observation says it is the fallback "if the man carrying it is face down on the
  checkpoint floor" (`erb:228`). The plant key is in a tray on the ops floor (`erb:1104`); the
  guard never carried it.
- **[r1 m9]** With the team never committed, the `cutscene` playlist runs until the control room
  (`erb:112-145`: `noir` only starts on `team_assigned`), and the timers never start (`erb:543`,
  `:554`), so there is no T-20 or T-10. The second is correct (no commit, no clock); the first
  reads as a bug.
- HaX's `topic_elena` says "if she gave you the real casualty figure" (`m07_phone_agent_0x99.ink:310`).
  She gives a dormancy figure and a manifest (`m07_npc_elena_rodriguez.ink:218-220`), not a casualty
  figure.

**F10. Small things.**
- Dead ERB helpers: `require 'base64'`, `base64_encode`, `rot13` (`erb:56-64`), never called.
  `badge_pin_found` is set (`erb:1139`) and read nowhere.
- The situation board reads "OUTSIDE TEMPERATURE: -2 C" (`erb:1119`) in a US facility. Pass 2 moved
  US-facing text to US units (PASS2_IMPROVEMENTS.md D8).
- The generator door's key sits on the ops floor (`erb:1096-1108`), a room before the door, and the
  lockpick opens it anyway. Correct as a *by design* lockpick spend, and HaX says so (`erb:757`). No change.
- The mole intercept, which the third act turns on (`erb:1538`), is optional. The debrief has two
  information levels for it (`m07_closing_debrief.ink:394-396`). No change: a story task in
  `concludeRequires` would be an unannounced dead end (skill, Step 1).

**Bug-sweep items that came back clean.**
- `item_picked_up` mappings use type + `data.itemId` (`erb:804-815`).
- No `||` or parentheses in mapping conditions. Every `collect_items` task has `targetCount`.
- No player-visible author notes or rename residue. The mole timestamps add up (02:41 PST = 10:41 UTC;
  09:50 is 51 minutes earlier, `erb:1544-1546`).
- No two takeable items share type and name (brief, E18).
- All five field-guide sheets exist under `HacktivityLabSheets/_labs/safetynet/`.
- SecGen flag order (NFS, listener, account, sudo) matches the tasks
  (`m07_architects_gambit.xml:124`, `:132`, `:151`, `:173`).
- Morrison (start room) drops his badge on a KO, as HaX's message says (`erb:721-724`). Elena, Park and
  Mercer hold nothing, so the KO-drop change can't hand anything over early.

## 5. Proposals

### P1. Phone inks follow the phone-chat rule ✅ (bug)
**Why.** F5. The redirect can be taken after its window has shut, a guide can be handed over twice,
and the Architect's first contact can be lost.
**What.**
- **Text knot → divert → choices-only knot**, for HaX `first_call_committed`, `redirect_open`,
  `redirect_closed`, `moral_soundingboard` and the guide knots, and for the Architect's five taunts,
  `sign_off` and `dead_air`. The text knot keeps its tags (`#give_item`, `#set_global`) and its
  `~` assignments, so a re-navigation replays nothing.
- **Resting knots re-check their state at the top and print nothing:**
  - `redirect_open_choices`: `{team_redirected or redirect_window_closed or team_assignment == "trojan_horse": -> hub}`.
    The hub then offers "Can I still move the team…?" (`m07_phone_agent_0x99.ink:175`).
  - `commit_team`: `{team_assigned: -> hub}`.
  - Architect `dormant`: `{architect_contact or architect_t20_played or grid_saved: -> start}`. The
    preload still sees `dormant` with no text, because `architect_contact` is false then (`erb:946`).
- `hub`, `parked` and `after_win` are already choices-only and gated.

**Cost.** Small, ink only. **Depends on** nothing. Check: `inkcheck` on every entry knot and
`loopcheck` on `hub`, `commit_team`, `redirect_open_choices`, `parked`, `dormant` with
`architect_contact=true`.

### P2. Small fixes ✅ (bug / polish)
**What.**
- Delete `require 'base64'`, `base64_encode`, `rot13` (`erb:56-64`). F10.
- `los.visualize: false` on Park (`erb:1505-1510`) and on the guard (`erb:910`). F1, F8. The cones
  promise a stealth game the engine never checks.
- `clear_the_checkpoint` title (`erb:289`) → "Deal with Ray Hollis on the checkpoint desk". F1.
- Situation board: "OUTSIDE TEMPERATURE: 28 F" (`erb:1119`). F10. Optional.
- Lockpick observation (`erb:228`): the fallback "if the plant key never turns up". F12.
- Visitor-log header (`erb:1070`): "(NERC CIP-006 visitor control. Site retention: 3 years. …)". §0.
- **[r1 m9, r2-m13]** Music for the uncommitted player, fired once through a global:
  - a HaX mapping on `room_entered:operations_floor`, `onceOnly`, `setGlobal: { inside_reached: true }`
    (new bool; globalVariables, CONTRACT.md);
  - a music event on `global_variable_changed:inside_reached`, condition `value === true &&
    !globalVars.team_assigned` → `noir` (fade);
  - on reload: the first `game_loaded` event (`erb:112-117`) gains `&& !globalVars.inside_reached`,
    and a new `game_loaded` event with `globalVars.inside_reached && !globalVars.team_assigned` →
    `noir`, so an uncommitted player reloaded inside doesn't hear the cutscene again.
  A per-entry `room_entered` music event would have skipped to a new track on every crossing of
  the ops floor (`switchPlaylist` → `_startPlaylist` always calls `_nextTrack`, `music-controller.js:182-188`, `:366-383`) and could
  swap `threat` for `noir` mid-fight; music events can't set globals
  (`scenario-music-events.js:96-130`, per round 2), hence the HaX mapping. The missing timers are correct and
  stay; walkthrough step 8 (§12) says so.

**Cost.** Trivial. **Depends on** nothing.

### P3. Cumulative start kit, named in the briefing ✅
**Why.** F2; arc rule (PASS3_APPROVAL_LOG.md, user decision 2026-10-01). The briefing's stripped kit
has no story reason (§10 W1).
**What.**
- `startItemsInInventory` (`erb:215-233`): phone, Lock Pick Kit, RFID Cloner (`rfid_cloner`),
  Fingerprint Kit (`fingerprint_kit`), shaped like m05's entries (`m05 erb:458-481`). No PIN cracker.
  Cloner and print kit: `puzzle_graph_role: tool`, no `puzzle_graph_unlocks` (nothing in m07 needs
  them; W7).
- **[r1 M2] Where the briefing names it.** Draft 1 put the line in the answer to "Who's coming in
  with me?" (`m07_opening_briefing.ink:53-54`), one of four optional one-shot questions with a
  sticky way past them (`:61`). Many players never hear it. The line goes in **`start`**, after
  Netherton's "minutes, not hours" (`:35`) and before `-> briefing_questions` (`:37`). `start` is
  the knot every playthrough opens on; `delegation_intro` is skipped by a player who closes the
  briefing during the questions, and `handoff` (`:294`) only by players who commit. Wording, in
  Netherton's flat register, e.g. "You have what's in your go-bag: picks, the cloner, the print
  kit. No PIN cracker. Analysis still has it in pieces." This avoids m04's "isn't leaving the lab",
  m05's "The lab isn't finished with it" and m06's planned "R&D still have it on the bench".
- `:54` keeps its answer but drops the kit list it no longer needs: "Nobody. Agent HaX on the wire
  and what you're carrying. That's the deployment."
- No other briefing line changes (m06 depends on `:27`, `:51`, `:116`, `:185`, `:214`, `:223`).
- The cloner and the fingerprint kit are carried and unused. Nothing in this building has a reason
  to sit behind a print (Step 3d), and the one RFID door already has three routes (P4, W7). m06
  made the same call for the print kit.

**Cost.** Small. **Depends on** nothing.

### P4. Hollis: evidence from another room, and talking him round pays ✅
**Why.** F1. The leverage is same-room and its key claim ("your login") has no source.
**[r1 M6]** The player can punch any NPC: a hit on a non-hostile NPC turns him hostile and damages
him (`player-combat.js:308-320`). Hollis stands in the start room, so a KO costs one warning credit
(`erb:192`) and drops his badge. Draft 1 raised the talk route to two documents and gave it nothing
the printer or the fist doesn't give. After P4 the talk route is one of two ways to open the plant
before the VM (**[r2 Q2]** a turned Elena gives the number at depth 2 before any flag,
`m07_npc_elena_rodriguez.ink:281-283`), and the only route that warns the player someone is down
there. The rule itself duplicates the extract's, which must carry it anyway: the extract is the one
source on the required path that survives a KO'd Hollis and a KO'd Elena. For a talk-route player
the extract confirms what Hollis said; his tip is worth having for timing and for the warning.
**Story logic.**
- The night supervisor's handover already grumbles about the guard and the contractor
  (`erb:1138`). **[r1 m5]** She pulled the badge station's print history for entry 218 and found
  whose login printed the renewal. That answers the margin note in the visitor log ("who signed
  this off??", `erb:1070`). Using the print history rather than "the June audit" keeps the
  timeline clean: the handover already says the station locked after the audit and its PIN is the
  audit date (0616), the same day as row 218.
- Hollis escorted OptiGrid's people on 14–15 June (`erb:1070`, rows 215–217). On the 16th he was
  told to hold the riser door while their plant tech reset the vault keypad, and he watched the tech
  read the number off the transfer switch plate. **[r2-m12]** Tonight, when the alarms went and he
  was walking everyone out, the same man came back in against the flow with a bag and a cutter and
  went down the riser. He hasn't come up. That man is Park. It squares with the timeline (the agent
  arrives at 03:24, `m07_opening_briefing.ink:299`; the evacuation has run "forty minutes",
  `m07_npc_jake_morrison.ink:41`; Park is "four minutes" from done, `m07_npc_thomas_park.ink:38`),
  and it turns Hollis's earlier "I walked them out myself" (`:67`) into a lie he is now taking back.
**What.**
- **Handover sheet** (`erb:1138`) gains one line, e.g. "- Pulled the badge station print history for
  the 16 JUN renewal on the OptiGrid contractor (J. MERCER, log 218). Printed on the security desk
  login: RHOLLIS. Raised with Facilities. Still nothing." **[r3-m1]** It names Mercer, so a
  handover-only player isn't handed a name they never saw. It is a takeable `notes` item, so its `onPickup` runs from the notes
  branch (`interactions.js:1436-1450`); the current `onPickup` (`erb:1139`) gains a new global,
  `renewal_signoff_read`. Declare it in `globalVariables`, CONTRACT.md §6 and as a VAR in
  Hollis's ink (**[r1 m4]**: the sync only writes VARs the story declares,
  `GlobalVariableExistsWithName`, `npc-conversation-state.js:357-372`).
- **[r2-m7] Leverage gate** (`m07_npc_jake_morrison.ink:50`) becomes `{renewal_signoff_read}`. The
  handover line names the date, the log row and his login, which is everything the leverage line
  asserts ("the sixteenth of June … Your login"). A player sent to the handover by HaX's
  badge-station message (`erb:749`) can use it without having read the log.
  - A partial option `{visitor_log_read and not renewal_signoff_read}`: "Somebody renewed Mercer's
    credentials on the sixteenth. Was it you?" He stonewalls ("The log doesn't say who. Then go
    and find something that does." **[r3-m1]**) and returns to the hub. The log is the question that sends a player to
    the handover.
  - **[r3-m1]** The option label (`:50`) drops "your signature" (no document shows one): "You
    renewed Mercer's credentials on the sixteenth of June. Your login."
  - `leverage` (`:91-100`) currently assumes the log. Two lines branch on `visitor_log_read`:
    Hollis's "That log's meant to stay in the desk drawer" (`:94`) becomes, without the log,
    "Halvorsen. She never could leave a thing alone." (supervisor renamed from Okafor after the implementation review, N1); the player's "Compliance record, three years'
    retention" (`:96`) becomes "The station's print history, with your login on it". The narrator's
    "everything the log already told you" (`:92`) becomes "everything the paperwork already told
    you" in both cases.
- **[r2 opportunity] The visitor log names Park.** One more row after 218, inside the omitted range:
  "219  16 JUN  T. PARK  OptiGrid Solutions  Plant -- keypad service  ESCORT: R. HOLLIS". A careful
  player can connect the extract's "T.P.", the keypad reset and the guard, and Hollis's tip has a
  document behind it. The omitted-range text becomes "entries 220-388 omitted".
- **The payoff, in `deal_take`** (`:116-134`), after he hands the badge over and before he leaves,
  two lines that only this route gives:
  - the vault: "Day after that survey their plant guy reset the vault keypad. I held the riser door.
    He read the number off the plate on the transfer switch. Said that way nobody has to write it
    down." This is the vault *rule* (P6), without the VM;
  - Park: "When the alarms went, same guy came back in against the crowd. Bag, cable cutter. Went
    down the riser. He hasn't come up." The player now knows someone is in the vault, and roughly why.
  `deal_take` already sets `hollis_resolved = "talked"` above its lines (lesson 3), so an early
  close still records the outcome; the tip itself is dialogue and needs no global.
- **His held item can't short-circuit anything on a KO.** He holds only the server badge
  (`erb:912-923`). Its pickup sets `badge_obtained` (`erb:803-809`) and nothing else. `taskOnKO`
  completes `clear_the_checkpoint` (`erb:873`), which is the task's own meaning ("Deal with Ray
  Hollis"). The vault tip is ink, so a KO can't drop it.
- **No `has_rfid_cloner`.** The clone route is withdrawn (W7), so his ink declares no `has_*` VAR.
  (Person chat re-syncs every declared `has_*` from the NPC's own `itemsHeld` on load and after a
  give, `phone-chat-conversation.js:84-93`, `:230-262`, which person chat uses,
  `person-chat-minigame.js:438`. m06 dropped its `has_rfid_cloner` for that reason, m06 plan P1 r3.)
- **Endings for every state.** Credits (`erb:191-193`) and the debrief's guard block
  (`m07_closing_debrief.ink:305-314`):
  - talked: unchanged in substance; the debrief may add that his statement names the plant tech;
  - KO'd: unchanged;
  - evaded (`hollis_resolved == "evaded"`, not KO'd): unchanged;
  - **left at his post** (not KO'd, not talked, not evaded; covers a player who never spoke to him
    and one who made him hostile and got away): new debrief line ("still at his post when the
    police reached the gate") and credit "RAY HOLLIS: Left at his post — still on their payroll"
    (warning), condition `!globalVars.hollis_ko && globalVars.hollis_resolved !== 'talked' &&
    globalVars.hollis_resolved !== 'evaded'`. Today neither exists.

**Routes to the server hall after P4:**

| Route | Needs | Costs | Pays |
|---|---|---|---|
| Leverage | handover (1), back to 0; the visitor log (0) is the question that points there | the walk, and a conversation | the badge, his statement, the vault rule, the warning about Park |
| Badge station | handover PIN (1), back to 0 | the same walk | a badge; he stays on post |
| KO | a fight | credit "Neutralised"; his statement and the tip are lost | a badge |

The handover and the walk are the same for the talk and printer routes, so talking costs
one conversation more and pays the most. The fist is still fastest, and loses the most.

**Cost.** Small: one object line, one global, one partial option, two lines in `deal_take`, one
credit and one debrief line. **Depends on** P6 (the rule must match), P9 (written with the new name).

### P5. The revision has to be read ✅
**Why.** F3. The revision is the mission's investigative reward, and today a required flag hands it out.
**Story logic.** The NFS share holds ENTROPY's own cross-cell schedule. Elena says she read the same
table (`m07_npc_elena_rodriguez.ink:214-220`). The schedule says T+9; the brief said ninety. Seeing
that takes reading it against what Netherton said. **[r1 m11]** The real share holds only a
"User:" line and a flag (SecGen `m07_architects_gambit.xml`, nfs_overshare block), so the extract
is framed the way the capture is ("saved off by the relay", `erb:1281`): the relay's decode of the
coordination file the share points at. A player who mounted the share and saw two lines is not
told they missed a four-operation table.
**What.**
- **Flag-1 reward** (`erb:1246-1251`) becomes `give_item` of a new relay `itemsHeld` entry: `text_file`,
  id `coordination_extract`, name "Coordination Schedule -- Relay Decode" (unique type+name, E18).
  - Header: "RELAY DECODE -- coordination file referenced from the NFS export".
  - Text: one row per operation in ENTROPY's own format. The Trojan Horse row has
    `DORMANCY: T+9` and a manifest line with `EHR-` and `CAD-` prefixes. Don't restate any casualty
    figure: those stay in the briefing's text.
  - A Portland block for "T.P." with the vault rule (P6) and, **[r1 missed opportunity]**, one line
    that points at the mole intercept without saying what it is, e.g. "hard copy of the client's
    deployment confirmation stays with the splice". The optional trip down then has a reason the
    player can read, and nothing is gated on it.
  - `onRead: { setVariable: { projection_revised: true, found_coordination_traffic: true } }`.
    It fires from an inventory click: `inventory.js:617-623` → `interactions.js:1366-1385`.
    **[r2-m1]** That is the code path; the probe didn't watch it (neither probed item had an
    `onRead`). `c2_capture` already reaches players through the same path (`erb:1275` comment).
    §12 step 3 is the real check.
- **`flag1_submitted`** comes from an `objective_task_completed:recover_coordination_traffic` mapping,
  the flag-2 pattern (`erb:684-688`).
- **HaX messages.**
  - **The nudge.** The three flag-1 mappings (`erb:661-682`) become one on
    `global_variable_changed:flag1_submitted`. It sets nothing and says: "The relay's decoded the
    file their share points at: their own schedule, all four operations. Read the Austin row
    against what Netherton read you." **[r1 m12]** It carries
    `"skipIfGlobal": "found_coordination_traffic"` (checked at delivery, `npc-manager.js:719`,
    `:1319-1322`), so a player who opens the extract inside the delay isn't told to read it.
  - **[r1 M4] The verdict, sent once.** Draft 1 keyed it on `projection_revised`, which Elena sets
    at the top of `revision_beat` (`m07_npc_elena_rodriguez.ink:210-212`), before she has said T+9
    or EHR/CAD. The 1500 ms delay now counts from the event (`npc-manager.js:709-718`), so HaX's
    text would have landed on her first line. Now **six** `onceOnly` mappings on HaX share a latch
    global `verdict_sent` (new; globalVariables, CONTRACT.md). Each condition includes
    `!globalVars.verdict_sent && !globalVars.team_redirected`, and each sets `verdict_sent`. The
    three Elena mappings also set `verdict_from_elena: true` (new bool; r2-M2, below).

    **[r2-M1]** The non-Trojan verdict splits on `redirect_window_closed`. A player who reads the
    extract (or hears Elena) after flag 3 or the 40-minute timer (`erb:551-558`, `:699-703`) has lost
    the redirect, and the text must not send them to call for it (they would get `redirect_closed`,
    `m07_phone_agent_0x99.ink:265-271`).

    | # | Source and event | Extra condition (`&&` only) | Wording (gist) |
    |---|---|---|---|
    | 1 | Extract: `global_variable_changed:found_coordination_traffic` (only the extract sets it after P5) | `team_assignment !== 'trojan_horse' && !redirect_window_closed` | "That's their own table. Austin was briefed low on purpose. If the team isn't where it should be, call me while there's still time." |
    | 2 | same | `team_assignment !== 'trojan_horse' && redirect_window_closed && team_assigned` | "That's their own table. Austin was briefed low on purpose. The window's shut. It goes in the report." |
    | 3 | same | `team_assignment === 'trojan_horse'` | "That's their own table. The team's already in Austin. You picked the one that was worse than the brief said." |
    | 4 | Elena: `conversation_closed:elena_rodriguez` (`person-chat-minigame.js:1598`) | `projection_revised === true && team_assignment !== 'trojan_horse' && !redirect_window_closed` | "One frightened engineer, but it fits everything else about tonight. The share will have it in their own hand if you want it. If the team isn't where it should be, call me while there's still time." |
    | 5 | same | `projection_revised === true && team_assignment !== 'trojan_horse' && redirect_window_closed && team_assigned` | "One frightened engineer, but it fits everything else about tonight. The window's shut. If she's right, it goes in the report." |
    | 6 | same | `projection_revised === true && team_assignment === 'trojan_horse'` | "If she's right, the team's already where it matters. Get it in writing off the share when you can." |

    (All conditions written with the `globalVars.` prefix in the ERB; shortened here.) Within each
    source the three are disjoint: Trojan / not-Trojan-open / not-Trojan-shut. The shut versions
    tell the player nothing to do. The Elena three don't repeat her lines (no nine days, no EHR or
    CAD) and don't tell the player to read the share before she has. A failed condition doesn't
    consume an `onceOnly` handler: the condition is checked before the trigger is counted
    (`npc-manager.js:527-553`), so closing Elena before her revision beat doesn't burn the Elena
    three. `setGlobal` applies when the handler fires (`npc-manager.js:567-580`), so whichever
    source fires first has set the latch before the other source's event.

    **Uncommitted and late** (no team, window closed by flag 3): `team_assigned` is in rows 2 and 5,
    so this player matches no row and gets no text. "The window's shut" would be wrong for them:
    HaX's hub still offers the commit at any time (`m07_phone_agent_0x99.ink:167`). HaX's
    `topic_traffic` and `topic_elena` (`:187-194`) carry the content for them. Open-window
    uncommitted players match rows 1 and 4 (the redirect timer only starts on `team_assigned`,
    `erb:551-554`); "isn't where it should be" fits a team not yet sent.
  - **Delay.** The extract rows use 3000 ms, so the player reading the text-file minigame sees a
    line of the table before the bark lands; the Elena rows keep 1500 ms after her chat closes.
  - **[r2-M2] Confirmation after a redirect**, outside the latch, **`onceOnly`**: on
    `global_variable_changed:found_coordination_traffic`, condition
    `globalVars.team_redirected && globalVars.verdict_from_elena`, "The share says what Elena told
    you. You moved the team on the right evidence." (the draft-1 redirected variant, `erb:681`,
    moved to the read). It fires only when Elena was the source and the player then reads the
    extract. An extract-sourced verdict plus a redirect needs no confirmation: the redirect was the
    response. Without `onceOnly` it would fall to the 5000 ms default cooldown
    (`npc-manager.js:516-523`) and repeat on every re-read, since each inventory click re-emits the
    event (`interactions.js:1379-1384`).
- **[r3-m6] The flag-3 text** (`erb:703`, "the team's committed where it is now") splits on
  `team_assigned`: the existing text with `&& globalVars.team_assigned`, and a second mapping with
  `&& !globalVars.team_assigned` that says the sequence armed and the team is still waiting on the
  call. Both keep `setGlobal { redirect_window_closed, cascade_armed }`.
- **[r3-m6, r3 Q1] `topic_traffic`'s last line** (`m07_phone_agent_0x99.ink:317`) branches on
  `not team_assigned`: "The team's still waiting on your call. If you're making it now, that's where
  it goes." This is the uncommitted late reader's backstop; a hub topic survives a reload.
- **[r1 M4] HaX's `topic_elena`** (`m07_phone_agent_0x99.ink:310`): "if she gave you the real
  casualty figure" → "if she told you what's on the Austin manifest". She gives a dormancy figure and
  a manifest (F12).
- **Now reachable:** the "PROJECTION UNCHALLENGED" credit (`erb:176`) and "Nobody read them"
  (`m07_closing_debrief.ink:192-193`). Both say what happened: two copies, neither read.

**Cost.** Medium. **Depends on** nothing.

### P6. The vault code is a rule plus an input at the door ✅
**Why.** F4, and **[r1 M3]**: the code must be workable only once the keypad is in view, and the
task must tick at the door.
**Story logic.** Mercer's people had the vault keypad reset the day after Elena's survey, so the
plant staff couldn't follow them down. Their plant tech (Park) set it to the last four digits of the
transfer switch's serial and read it off the plate, so the number was never written down
anywhere. ENTROPY's site note for him says so; Hollis held the riser door and watched it done
(P4). The plant log records being shut out. Elena knows the number because she's on the inside. Her
15 June rack note ("code is on the maintenance log … per site standard", `erb:1302`) was true the
day she wrote it.
**What.**
- **Transfer switch** (`erb:1443-1450`): its text gains a rating-plate line, e.g. "Rating plate:
  ATS-1  S/N 0098-<%= vault_pin %>". The ERB variable keeps one source for the number.
  `vault_pin` stays 4703 (`erb:68`), so Elena's three code lines (`m07_npc_elena_rodriguez.ink:283`,
  `:293`, `:352`) stay true. P8's `textVariants` keep the plate line in every variant.
  `puzzle_graph_role: key`, `puzzle_graph_unlocks: cable_vault`.
- **Maintenance log** (`erb:1436`), now a clue for "the code changed":
  - New entry: "16 JUN Cable vault keypad reset by OptiGrid after the survey. New code not passed to
    plant. Chased twice. -- T.O."
  - The standing note's code is struck through and marked "VOID -- see 16 JUN". Show a different
    number (not 4703), so the log can't be used as the answer.
  - Remove its `onRead` (`erb:1437`). `puzzle_graph_role` becomes `clue`.
- **The rule**, from two places (neither gives the digits):
  - the extract's T.P. block (P5): "Vault keypad reset 16 JUN. Code is the last four of the ATS-1
    plate serial. Read it off the plate. Don't write it down.";
  - a talked-round Hollis (P4): he watched the tech read it off the switch plate.
- **Elena** `:283`: "…if you haven't got it off the maintenance log yet" → "Mercer's tech reset it the
  day after my survey, so the plant log's out of date."
- **HaX's Elena-KO text** (`erb:728`): the vault code is "in their own site notes, in what the relay
  pulled off the share", not on the maintenance log.
- **`recover_vault_pin`** (`erb:374-380`): keep the task id (CONTRACT.md §8 fixes ids), change it to
  `type: unlock_room`, `targetRoom: cable_vault`, title "Work out the plant keypad code".
  `unlock_room` tasks complete on `door_unlocked` (`objectives-manager.js:277-279`, `:453-462`), and
  the server checks `room_unlocked?` (`game.rb:949-952`, per round 2), the shape
  `breach_server_room` already uses (`erb:312-317`). Delete the `vault_pin_found` mapping
  (`erb:712-718`). `vault_pin_found` stays as Elena's latch (`m07_npc_elena_rodriguez.ink:276`,
  `:350`); after P6 nothing reads it, so CONTRACT.md marks it "written by Elena, read by nothing".
- **[r2 aim staging] Stagger the second vault task.** Today `search_cable_vault` (`erb:389-396`,
  `enter_room`) would tick a second after the door task, for one action. Keep its id, make it
  `type: custom`, title "Find how the intrusion reached the breakers", still optional. A HaX mapping
  on `global_variable_changed:splice_found` (`value === true`, `onceOnly`) completes it. The trunk
  runs (`erb:1515-1522`, the splice that "is how" the backdoors reached the breakers) gain
  `onRead: { setVariable: { splice_found: true } }` (new bool; globalVariables, CONTRACT.md). A
  `cable` object takes the generic `onRead` handler (`interactions.js:1557-1570`), not the
  text_file or notes branches. The second tick is now its own beat, and it is the aim's own
  question ("Trace How They Got In", `erb:360-362`).
- **[r2-m4] HaX hint for a player stuck at the keypad.** A new HaX mapping on
  `room_entered:generator_room`, `onceOnly`, sets `generator_hall_reached` (new bool). HaX's hub gets
  one option, `{generator_hall_reached and not vault_entered and not vault_hint_given}` ("The vault
  keypad. Where do I get the code?", **[r3-m2]**: it claims no log knowledge), with a local latch `vault_hint_given`. The
  answer knot prints and diverts to `hub` (no choices of its own, so the phone-chat rule holds):
  - `{found_coordination_traffic}`: "Then their own notes say how. Read the Portland block in what
    the relay pulled.";
  - `{flag1_submitted and not found_coordination_traffic}`: "The relay's already pulled their notes
    for you. Read them.";
  - else: "Their own site notes will say how. Get the share through the relay."
  It names the source and never the digits. HaX declares `generator_hall_reached`, `vault_entered`
  and `flag1_submitted` (already declared, `:28`) as VARs.

**Chains after P6:**
- VM route: rack note (2) → extract read (2) → generator hall (3): log says the old code is void,
  plate gives the digits → door (3 → 4).
- Talk route: Hollis (0) → generator hall (3): plate → door.
- Log-first player: log says void (3) → no rule yet → HaX's hint or the extract (2) or Elena (2) →
  back down.
- Elena route: the number (2) → door. *By design*: the price is turning her.
- Deducing: a player without the rule sees the log's VOID mark, the two 16 JUN entries side by side
  (keypad reset by OptiGrid; transfer-switch work the same day, `erb:1436`) and an 8-digit plate
  serial. Trying its last four is lateral thinking the room supports, on an optional branch.
  **[r2-m3]** The PIN minigame allows three tries per opening, then locks until it is reopened
  (`pin-minigame.js:22`, `:505-521`; the caller passes 3, `minigame-starters.js:564`); nothing
  persists the count. So there is no lasting lockout, and two plausible candidates (0098, 4703).
- **[r2-m2] Placement.** Objects are auto-placed, so the plate is "in the same room as the door",
  not necessarily beside it. The design needs only the same room; §12 step 5 notes where it lands.

**Cost.** Small. **Depends on** P5, and P8 (`vault_entered`).

### P7. Swap the scanning guide for the SSH guide ✅
**Why.** F6.
**What.**
- `m07_scanning_field_guide` (`erb:839-845`) → `m07_ssh_field_guide`, "SAFETYNET Field Guide: SSH
  Access and Bruteforce", `labUrl …/labs/safetynet/ssh-access-and-bruteforce/`. **[r1 m6]** Not
  `ssh-access-and-linux-basics`, which opens "You've found a password list" and is about Hydra
  (`HacktivityLabSheets/_labs/safetynet/ssh-access-and-linux-basics.md:16`, `:31-35`). The
  bruteforce sheet's quick reference fits m07: "Try the credential you already have first … One
  username, one password → `ssh`" (`ssh-access-and-bruteforce.md:16-18`), and m06 uses it too. Its
  worked example is m02's hospital (`:13`), so HaX's give line frames it the way m06's P3 does:
  "Worked example's the hospital job. Skip the Hydra half; you've already got the pair."
- Offered on `objective_task_completed:intercept_c2_channel`, when the player holds a username and a
  password (`m07_phone_agent_0x99.ink:213`).
- The vm-launcher first-use mapping (`erb:766-773`) keeps its latch for `vm_hint_1`
  (`m07_phone_agent_0x99.ink:209`) but stops offering a guide. Its text points at recon: "Map it first.
  NFS is the door they left open."
- Rename the globals: `scanning_guide_*` → `ssh_guide_*`, and `vm_terminal_used` for the hint gate.
  Update CONTRACT.md and HaX's VARs.
- `guide_ssh` text: the name from the share and the password from the listener, then `ssh`, then look
  in the home directory. It replaces `:428`.
- **[r1 m7]** Flags 1 and 2 (NFS mount, netcat banner) have no field guide; no SAFETYNET sheet
  mentions `showmount`, NFS or a netcat listener. HaX's hints (`m07_phone_agent_0x99.ink:358-369`)
  stay their only guidance, which is acceptable. The missing sheet is logged as L2
  (`PASS3_APPROVAL_LOG.md:118-119`).

**Cost.** Small. **Depends on** P1 (the new guide knot follows the split shape).

### P8. Park's endings ✅
**Why.** F7.
**What.**
- **[r1 M5] `vault_entered`** (new bool; globalVariables, CONTRACT.md, a VAR in the debrief): set
  by a HaX mapping on `room_entered:cable_vault`, `onceOnly`. HaX's mappings register at load
  (HaX is listed in the start room, `erb:631-636`; lesson 43), the same way its existing
  `room_entered:server_room` offers do (`erb:752-765`).
- **Debrief Park block** (`m07_closing_debrief.ink:316-326`), first match wins:
  1. `park_ko`: unchanged.
  2. `park_resolved == "talked"`: unchanged.
  3. `park_resolved == "evaded"`: he finished. He cut the control run to the transfer switch and
     walked out of a cordoned building. Had the abort come later, the control centre would have had
     no backup power. No casualty figure.
  4. **[r2-m6]** `park_resolved == "ko"` (he went for the player with the crimping tool, `goes_loud`
     `m07_npc_thomas_park.ink:98-107`, and the player got away without knocking him down): "He came
     at you and you left him to it. He finished."
  5. `vault_entered` (and none of the above; a player who walked past him): "You were in the vault
     with him." The same consequence.
  6. else (never went down): "Found afterwards": tools on the mat, the run cut, nobody there.
- **Credits** (replace `erb:194-196`). K = `park_ko`, R = `park_resolved`, V = `vault_entered`:
  - "THOMAS PARK: Talked — the transfer switch was left intact" (unchanged; R = talked hides him at
    once, `erb:1494-1503`, so he can't then be KO'd);
  - "THOMAS PARK: Neutralised in the vault" (unchanged; K);
  - "THOMAS PARK: Evaded — finished the cut and walked out" (warning),
    `globalVars.park_resolved === 'evaded' && !globalVars.park_ko` (**[r1 m2]** adds the KO guard);
  - **[r2-m6]** "THOMAS PARK: Fought off, not stopped — finished the cut and walked out" (warning),
    `globalVars.park_resolved === 'ko' && !globalVars.park_ko`;
  - "THOMAS PARK: Seen, left to work — finished the cut and walked out" (warning),
    `globalVars.vault_entered && !globalVars.park_ko && globalVars.park_resolved !== 'talked' &&
    globalVars.park_resolved !== 'evaded' && globalVars.park_resolved !== 'ko'`;
  - "THOMAS PARK: Never found — the backup was cut before anyone went down" (warning),
    `!globalVars.vault_entered && !globalVars.park_ko`.
  The conditions are `&&`-only (lesson 35), disjoint and exhaustive: talking to Park at all needs V,
  since he can only be reached in the vault.
- **The transfer switch agrees** (`erb:1443-1450`). `textVariants` (resolved by
  `resolveObjectField`, `conditional-text.js:107-112`, first match wins, `:87-97`):
  - **[r2-m5, r3-m3]** `globalVars.vault_entered && !globalVars.park_ko &&
    globalVars.park_resolved !== 'talked'`: the jumper is finished and the fault lamp on the
    control run is blinking; something below is being cut right now. This covers all three live-Park
    states (evaded, fought off, walked past), whose credits all say he finished;
  - base text unchanged ("Whoever left it there did not finish").
  Every variant keeps P6's rating-plate line. The evaded variant can only be read after the vault
  visit, by which time the code is spent; the plate is there anyway. The switch is a readable
  non-notes object, so its first read is copied to the notepad (`interactions.js:1475-1481`), and
  the copy keeps the old text. Leave it: the copy carries the plate serial. Don't rely on the
  notepad to show the evaded variant.
- The vault visit then has a stake beyond the lore: going down stops the cut, and P4/P5 give the
  player two ways to know someone is down there. The aim already asks for it (`erb:381-388`).

**Cost.** Small: one mapping, one global, three debrief lines, three credits, one variant. **Depends on**
P10 (the talk route needs the projection to be takeable).

### P9. Rename Jake Morrison → Ray Hollis ✅ (orchestrator decision)
**Why.** F9. Decided, not queued (`PASS3_APPROVAL_LOG.md:143-144`). The rename rule (brief) applies:
ids too, word-boundary replacements, then recompile, validate and loopcheck.
**What.**
- **NPC:** id `jake_morrison` → `ray_hollis`, `displayName` "Ray Hollis" (`erb:857-858`); the
  NPC `_comment` (`erb:856`).
- **Ink file:** `m07_npc_jake_morrison.ink` / `.json` → `m07_npc_ray_hollis.ink` / `.json`; `storyPath`
  (`erb:865`); the ink header (`:2-3`); every "Jake Morrison:" speaker tag; `#hostile:jake_morrison`
  (`:163`). He calls himself "Jake" nowhere, but the player's line "I'm not here to fight you, Jake"
  (`:54`) becomes "…Ray".
- **Globals and VARs:** `morrison_resolved` → `hollis_resolved` (`erb:1590`; the NPC's own mappings
  `erb:877`, `:883`; credits `erb:191-193`; VARs in Hollis `:17`, HaX `:15`, debrief `:36`);
  `morrison_ko` → `hollis_ko` (`erb:872` `globalVarOnKO`, `:1601`; VARs in Hollis `:18`, HaX `:19`,
  debrief `:40`). HaX's local `morrison_discussed` → `hollis_discussed` (`:49`), knot
  `topic_morrison` → `topic_hollis` (`:183-184`, `:299-300`).
- **Items and patterns:** `morrison_server_badge` → `hollis_server_badge` (`erb:915`; pickup mapping
  `erb:806`; `#give_item` in `deal_take` `:121`); `npc_ko:jake_morrison` → `npc_ko:ray_hollis`
  (`erb:721`); `targetNPC` (`erb:291`); `puzzle_graph_reveals: morrison_renewed_mercers_credentials`
  → `hollis_renewed_mercers_credentials` (`erb:1073`).
- **Visible text:** visitor log "ESCORT: J. MORRISON" ×3 → "R. HOLLIS" (`erb:1070`); handover
  "(Morrison)" and "Morrison has it too" (`erb:1138`) and P4's "RHOLLIS"; badge observation
  (`erb:919`); the credit labels "JAKE MORRISON:" → "RAY HOLLIS:" (`erb:191-193`); HaX's KO text (`erb:723`), RFID offer (`erb:749`), `topic_hollis` (`:301`),
  `guide_rfid` (`:395`), the hub label (`:183`); the debrief (`m07_closing_debrief.ink:307`, `:312`);
  task title (`erb:289`, P2). ERB comments that name him (`erb:20`, `:40`, `:104`, `:261`, `:720`,
  `:804`, `:1036`) are updated too. Done when `grep -rni "morrison\|jake" scenarios/m07_architects_gambit`
  finds only the dated notes, CONTRACT.md's PASS 3 amendments block (which records the rename) and
  this plan.
- **CONTRACT.md** is the mission's identifier authority (`erb:8-10`), so it is **edited**, not just
  noted. Add a "PASS 3 amendments (2026-10-01)" block under the pass-2 one (`CONTRACT.md:15`) listing
  the rename and this plan's new or changed identifiers, and update the rows in place: the pass-2
  amendments' "Leaving NPCs" line (`:30`, **[r2-m9]**), §1 NPC table (`:43`), lock table (`:98`),
  the patrol heading (`:124`), object ids (`:144-145`), §6 outcomes
  (`:268`) and KO latches (`:290`), §8 task row (`:349`), §9 attribution (`:390`), §10 (`:421`,
  `:423`). New identifiers to add: `renewal_signoff_read`, `verdict_sent`, `verdict_from_elena`,
  `vault_entered`, `generator_hall_reached`, `inside_reached`, `splice_found`,
  `coordination_extract`, `m07_ssh_field_guide`, `ssh_guide_*`, `vm_terminal_used`;
  `recover_vault_pin` type change; `search_cable_vault` type and title change; `vault_pin_found`
  now Elena-only.
- **[r2-m10] Age.** The debrief says "Contract security, forty-one, two children"
  (`m07_closing_debrief.ink:307`); the voice block, already edited by the voice audit, says "in his
  mid-thirties" (`erb:868`). Change the debrief line to "thirty-six": it is re-voiced anyway in the
  rename, and the voice block stays as the audit left it. (Don't touch the other voice blocks
  either; the Architect is now Sadaltager, `erb:935`.)
- **Dated note** ("> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id jake_morrison → ray_hollis;
  globals morrison_* → hollis_*; item morrison_server_badge → hollis_server_badge).") at the top of
  PASS2_IMPROVEMENTS.md, SOLUTION_GUIDE.md, planning/mission_design.md and
  planning/delegation_operations.md. (planning/archive/ and `.ALIGNMENT_PLAN.v1.bak` don't mention
  him.) TESTING_WALKTHROUGH.md is rewritten for this pass; the dungeon graph is regenerated.
- **Not touched:** other missions (no other mission names m07's guard); the bible's Jake Morrison.
- **TTS:** every Hollis line needs new audio (new id, new name in the text), plus the changed HaX,
  debrief and document lines. The quota is exhausted (E5); list them in the implementation notes.

**Cost.** Medium, mechanical. **Depends on** nothing; it goes first so P4's new lines are written once.

### P10. World pickups that work ✅ (bug, [r1 M7])
**Why.** F11. Park's talk route, Elena's projection opener, the mole credit, HaX's `topic_mole`, the
debrief's full coda and `recover_mole_evidence` are all dead today. E20 is the engine fix, logged for
the user; this is the mission-local workaround, with no engine change.
**Choice.** The orchestrator offered `onRead`, a non-takeable item with the legacy `onPickup`, or a
container. The better fit for both items is **type `notes`**:
- `notes` takes a different branch (`interactions.js:1434-1466`): it runs `onRead || onPickup`,
  emits `item_picked_up:notes` with `itemId`, and calls `addToInventory` so the server registers the
  collection (the UI slot is skipped for notes). The item really is taken, so Elena can be handed the
  page and the collect task can count it.
- `tomb_gamma_dossier`, the other target of the same collect task, is already this shape
  (`erb:1525-1536`), so both targets behave the same way.
- `onRead` on a `text_file` would set the globals but leave both items in the room, and the collect
  task would still never tick. A container in the vault would work for the intercept (container
  takes are fine), but it adds an object for no play gain, and the projection is described as lying
  on the console in plain view (`erb:1403`).
**What.**
- `casualty_projection` (`erb:1396-1409`): `type: notes`; `onPickup` → `onRead` (same
  `setVariable`); keep `takeable`, `readable`, text, observations.
- `mole_intercept_evidence` (`erb:1537-1550`): the same. Its observation carries the timestamp
  reveal; the notes minigame shows observations (`startNotesMinigame(sprite, text, observations)`,
  `interactions.js:1466-1467`).
- `tomb_gamma_dossier`: no change; §12 checks it.
- E18: no other takeable `notes` shares either name.
**Fallback if the browser check fails for the intercept:** put it in an unlocked `suitcase`
container in the vault (Park's tool bag, drawn with one of the loaded `bag1`–`bag25` sprites,
`core/game.js:348-372`; m03's desk drawer is the shape, `m03 erb:1251-1266`), and give it
`onRead` for the global. For the projection, `onRead` alone is enough, since Park and Elena gate on
the global.

**Cost.** Small. **Depends on** nothing.

## 6. What could break

- **Solvability is unchanged.** No required route is removed.
  - The server hall keeps the printer and KO routes, which need no ink to work.
  - The control room keeps both sources.
  - The vault (optional) keeps three sources: the extract's rule (on a required flag) plus the
    plate, Hollis's rule plus the plate, and Elena's number. A KO'd Hollis and a KO'd Elena still
    leave the extract.
  - The console still opens from flag 4 alone.
- **P5 without a working `onRead` from the inventory:** the revision could only come from Elena,
  and the vault rule only from Hollis. Check it first in the playtest (§12 step 3). Fallback: an
  `item_picked_up:text_file` mapping on `data.itemId === 'coordination_extract'` that sets the two
  globals on receipt. That is today's behaviour, so the mission is no worse; the nudge's
  `skipIfGlobal` then suppresses the nudge, which is right, since nothing is left to read for.
- **P5 moves `flag1_submitted` to a task mapping.** Anything keyed on it must still fire:
  - the debrief trigger (`erb:1017`);
  - the flag nags (`erb:785-793`);
  - HaX `vm_hint_2` gating (`m07_phone_agent_0x99.ink:211`);
  - Mercer's VARs.
  `objective_task_completed` fires once per task; m07's flag-2 mapping has used it since pass 2.
- **P5 and the redirect window.** The redirect option now needs the extract read (or Elena). The window
  still closes on flag 3 or at 40 minutes (`erb:551-558`, `:699-703`). A player who submits flag 1 and
  doesn't read it until after flag 3 loses the redirect. That's the intended cost, and the debrief
  says so.
- **P5's verdict latch.** Six mappings set `verdict_sent`; each checks it. Two sources can't
  both fire, because the Elena three need `conversation_closed` and the extract three need the
  read, and whichever lands first sets the latch before the other's event. **[r2-m8]** A player who
  never reads the extract and never hears Elena's revision gets no verdict, which is the point of
  F3. Re-reading the extract re-emits its event, but every verdict row checks the latch and the
  confirmation is `onceOnly`, so nothing repeats.
- **P6 changes two task types.** `recover_vault_pin` and `search_cable_vault` keep their ids, so
  nothing in the ink breaks (no ink completes either; grep). The first ticks on the door; the
  second on reading the splice, a separate beat. No aim reveals early: `trace_the_intrusion`
  already unlocks on `commit_the_team` (`erb:365`), and nothing upstairs completes either task now.
- **[r1 M6] KO routes and what they cost.**
  - Hollis is in the start room, so his badge drops on a KO (`npc-hostile.js:139`, `:258-261`). The
    pickup sets `badge_obtained` only; `taskOnKO` completes `clear_the_checkpoint`. Nothing
    else can complete early.
  - A KO'd Hollis loses the player his statement (debrief), the vault rule and the warning about
    Park (P4). The vault still opens from the extract or Elena; the player just goes down knowing
    less.
  - A punch is available from the first second (`player-combat.js:308-320`). That stays: the cost
    is in what it loses, not in a wall.
  - Elena KO'd before turning: the vault rule still comes from the extract (P6). The control-room
    password still comes from flag 2.
- **Phone re-navigation (P1).** The splits must keep each knot's tags in the text half. A `~`
  assignment left in a choices knot would re-run, which is harmless for latches but would replay a
  `#give_item`.
- **Uncommitted team.** The whole run with no commit (timers never start, `erb:543`, `:554`;
  `commit_the_team` never completes) was not walked in pass 2's playtests. Its endings exist (`erb:173`;
  `covered_none`; X1). With P2 the music turns to `noir` on the ops floor; the missing T-20/T-10
  barks are correct, not a bug. Walk it once (§12).
- **Rename (P9).** A missed `morrison_*` global or VAR silently breaks a condition; the done-when
  grep, `inkcheck` and `loopcheck` catch it. A saved game from before the rename has
  `morrison_resolved` in its globals and an NPC id that no longer exists; pass-3 games are fresh,
  so this only matters for local test saves.
- **P10's type change.** Notes items skip the inventory UI slot (`interactions.js:1429-1433`
  comment), so the projection and the intercept show in the notepad, not as inventory icons. The
  ink only reads the globals, so nothing depends on the icon.
- **Layout.** No rooms, doors or positions change, so parity and door alignment can't move. P10's
  fallback (a bag in the vault) would add one object; check its placement if it is used.
- **Reload.** All the new state (`renewal_signoff_read`, `verdict_sent`, `verdict_from_elena`,
  `vault_entered`, `generator_hall_reached`, `inside_reached`, `splice_found`) is global, so it
  persists. The fired `onceOnly` handlers are saved too (`npc-manager.js:1068-1095`), so the verdict
  and nudge don't replay. HaX's `vault_hint_given` is a local VAR; ink variables now persist
  (commit 1de257bb). Phone history is in memory only, so a verdict text can be lost on reload;
  `topic_traffic` and `topic_elena` are the backstops.
- **[r2 Q4] Inventory badge click.** With a cloner in the kit (P3), clicking either badge in the
  inventory opens the RFID clone minigame instead of the "No Cloner" alert
  (`interactions.js:725-748`). Harmless: there is no `card_cloned` mapping and no clone route (W7).
  §12 step 1 tells the playtester.

## 7. Dialogue implications

Apply `README_ink_best_practices.md`. New and changed lines:

- **Briefing `start` and `:54`** (P3): one new line and one shortened answer, Netherton's voice
  (flat, no softening). The m06 figures stay untouched.
- **Hollis** (P4, P9): the partial-leverage exchange, the handover-only branches in `leverage`, and
  the two payoff lines in `deal_take`. Keep
  him frightened and flat; the tip comes out as a man unloading, not volunteering. Every speaker tag
  and the player's "Jake" become Hollis/Ray.
  - Choice labels are first-person actions.
  - No standalone emote lines.
- **HaX** (P1, P5, P6, P7, P8):
  - the flag-1 nudge, which must not state the conclusion;
  - six verdict messages (two of them for a shut window, which ask nothing of the player) and one
    redirect confirmation; the Elena three repeat none of her lines;
  - the vault-keypad hint and its three answers, which name the source and never the digits;
  - `topic_elena`'s corrected line and `topic_hollis`;
  - the Elena-KO text;
  - the SSH guide and its give line.
  HaX doesn't relay ENTROPY's figures as fact. She points at the row.
- **Elena** `:283` (P6): one line, technical register, steady.
- **Documents** (P4, P5, P6, P8):
  - the handover line (night supervisor, tired, specific);
  - the visitor log's T. PARK row (same format as rows 215–218);
  - the extract (ENTROPY's own terse scheduling format, no prose; the T.P. block reads as an order
    to a contractor);
  - the log entry and the void mark (T.O., aggrieved, initialled);
  - the switch's rating plate (no author: a plate) and its evaded variant.
  Each written document has an author with a motive: the supervisor raises a problem, ENTROPY
  coordinates its own crew, the plant tech records being shut out.
- **Debrief and credits** (P4, P8, P9): Hollis's "left at his post" line and his age (thirty-six);
  Park's evaded, fought-off, walked-past and never-found lines. Netherton reads, doesn't console. No new casualty figures.
- **US setting** (pass-2 D8): US characters and US documents use US words and units. HaX and Netherton
  keep UK English.
- **TTS:** every new or changed line needs audio, and the quota is exhausted (E5). List the changed
  lines in the implementation notes so they can be generated later.

## 8. Pacing

**Act map against depth.**
- **Act 1:** the briefing and the delegation, before the player is inside (cutscene). The hard choice
  comes first and is made on numbers ENTROPY supplied.
- **Act 2:** checkpoint (0) and ops floor (1): the badge.
  - After P4 the default beat is ops floor → back to the checkpoint, with a choice of how to use what
    the handover sheet says: the PIN (printer) or the login (Hollis).
  - KO players skip the walk and pay for it in the credits and in what Hollis would have told them.
  - A talked-round Hollis plants the optional branch here: someone is in the vault, and the code is
    on a plate.
- **Turn 1**, at 2, mid-mission: the extract (P5) or Elena. The schedule is one operation and the
  Austin brief was cooked. The redirect decision sits here, under the 40-minute window.
- **Branch (optional):** generator hall (3) and vault (4). Park, the mole intercept, Tomb Gamma.
  - Turn 2, the mole, is in the deepest room, and it is optional by design (F10). The debrief's coda
    has two levels. The extract's T.P. block now says something is waiting by the splice.
  - After P6 the code is worked out at the door for a rule-holder. A log-first player without the
    rule goes back up to the server hall and down again: two more crossings, through a hall that
    holds the log and the transfer switch.
- **Act 3:** control room (3), server hall (2), control room (3).
  - Flag 3 arms 15 minutes (`erb:582-592`). The walk from relay to console is one door.
  - Mercer's conversation runs on the same clock if the player chooses to have it then.

**Traversal on the critical path (printer or leverage route).** start → ops → checkpoint → ops →
server → control → server → control: seven crossings. KO: five. Every room crossed has a job.
No corridors. The final act is two crossings, so the clock tests the VM work, not walking.

**Timers.** The redirect window is wall-clock from the commit, VM time included (lesson 29). That is
deliberate: a slow investigator can lose it. The armed clock starts at flag 3, after the long VM work.
No change.

**Empty rooms:** none (`room_depth.py`).

## 9. Capability arc

**Rule** (PASS3_APPROVAL_LOG.md, user, 2026-10-01): the kit is cumulative. Each mission grants at most
one new class. The PIN cracker is rationed and not in start kits after m02.

| Mission | Grants | m07's use (after this plan) |
|---|---|---|
| m01 | Lockpicks | Generator hall door. *By design*; the plant key is the non-pick route (F10) |
| m02 | PIN cracker (rationed) | Not in the kit; the briefing says so (P3). m07's two PIN locks (badge station, vault) are worked out from documents |
| m03 | RFID cloner | Carried, unused. **[r1 m13]** m03–m06 each clone an NPC's badge mid-conversation; a fifth adds nothing, and here it would undercut the talk route (W7) |
| m04 | Fingerprint kit | Carried, unused. Nothing here has a reason to be behind a print (as in m06) |
| m05/m06 | Evidence as leverage; the VM opening the physical path | Hollis's leverage from the handover, which the visitor log points at, and which also opens the plant early (P4); the share's site note gives the vault rule (P6) |
| **m07** | **No new tool class.** It adds **a clock the player's own action starts** (flag 3 arms the cascade, `erb:698-703`), and **evidence that changes a decision already made** (the redirect, P5) | — |

**Start kit for m07:** phone, lockpicks, RFID cloner, fingerprint kit. No PIN cracker. The
briefing's opening knot names it (P3).

m07 is a VM-heavy mission and spends one of its three carried tools. That is honest to the
building: one keyed plant door, one badge reader with a guard and a printer beside it, and PIN
locks whose codes come from documents. The arc rule asks that the kit is carried, not that every
tool is used every mission.

**For m08's planner (nothing here is m08 work):**
1. Start kit: phone, lockpicks, RFID cloner, fingerprint kit. No PIN cracker unless m08 issues one with a reason.
   PASS2_APPROVAL_LOG.md m08 §8 already notes that the start lockpick makes m08's printout → safe → key
   chain optional. That has to be settled against the rule there.
2. m07 leaves the player distrusting the tasking: the revision shows ENTROPY fed SAFETYNET its numbers,
   and the mole intercept shows the agent was leaked (`erb:1544-1546`). m08 should make the player
   work from evidence they derive and check, not from what they're handed.
3. m07's debrief says "two of ours" (`m07_closing_debrief.ink:224`). m08 can build on it.
4. E20 hits m08 too: `nightshade_profile`, `encrypted_backup` and `deep_state_manual` are world
   `text_file`s with `onPickup` only (`PASS3_APPROVAL_LOG.md:113`). m07's P10 (type `notes`, with
   `onRead`) is a tested-shape workaround to copy once §12 step 10 passes.
5. m07's checkpoint guard is Ray Hollis. If m08 refers back to him, use that name.

## 10. Withdrawn and considered

Not to be re-proposed without new evidence.

- **W1. Keep the stripped kit and make its absence the wall.** Considered: Netherton's line (`:54`)
  could become a reason (scrambled from leave in a personal car; the cloner and print kit are signed
  back into stores after every operation), and the RFID door would then be felt as a wall. Withdrawn:
  - the briefing gives no reason today, and inventing one fights the user's rule;
  - the agent was in range because they were travelling, so "stores-controlled kit" needs more
    explaining than it earns;
  - the arc rule settles it: the kit is carried.
  (Draft 1 also gave "the cloner gives Morrison a mechanical role" and "fixes the biometrics
  oddity"; the first went with W7, the second was wrong, F2.)
- **W2. A locked turnstile with the guard watching it (pick under his cone).** The ink already has a
  turnstile (`m07_npc_jake_morrison.ink:147`, `:168`). Withdrawn: m03's night guard and m06's
  checkpoint guard (m06 plan P8) both use guard + pick under a cone, so a third in a row adds nothing.
  m07's checkpoint is about the badge.
- **W3. A fingerprint reader on the control room.** It would spend the m04 kit. Withdrawn: the door
  already has two sources by design (Elena, flag 2). A print route needs an owner with a reason to
  have touched something the player can reach, and the only candidate (Mercer) is behind the door.
- **W4. Move the password's sources out of the server hall.** Considered for the ⚠️ in §3. Withdrawn:
  the flag-2 route's hunt is the VM chain, and keeping Elena, the relay and the door together keeps the
  armed clock about the host, not the walk (§8).
- **W5. Put the mole intercept or the vault in `concludeRequires`.** Withdrawn: story tasks there create
  unannounced dead ends (skill, Step 1). The debrief already has two information levels.
- **W6. Open the redirect as an auto-opened HaX call.** Withdrawn: lesson 20 (a timed phone open can tear
  down a conversation in progress). The hub option and P5's nudge are enough.
- **W7. [r1 m13] Clone Hollis's badge mid-conversation** (draft 1's P4 clone route). Withdrawn:
  - m03, m04, m05 and m06 all clone an NPC's `rfidCard` in dialogue
    (`grep -l rfidCard scenarios/*/scenario.json.erb`); W2's own reasoning ("a third in a row adds
    nothing") applies with more force to a fifth;
  - it was a fourth route to one door, and the cheap one: a player could skip the documents
    without paying the KO's credit or losing anything, which undercuts the M6 payoff (P4);
  - no varied cloner mechanic fits without engine work. The engine clones an NPC's card only
    through `#clone_keycard` in conversation (`chat-helpers.js:310-345`); there is no
    proximity skim. A world keycard would just be taken.
  The cloner stays in the kit, unused here (§9).
- **W8. [r1 missed opportunities] Reading the extract shows on the ops-floor board; the countdown
  shows on the ops floor.** Considered: `textVariants` on the situation board (`erb:1113-1120`) for
  `projection_revised` or `cascade_armed`. Not taken: the player has left the ops floor by the time
  either changes (the extract arrives in the server hall; the clock starts at flag 3, two rooms
  on), so few would see it, and §8's two-crossing finale already makes the clock felt. One object
  entry each, if a later pass wants them.

## 11. Needs approval (outside m07's files)

- **None new.** Nothing in this plan touches the engine, shared minigames, other missions, SecGen
  or HacktivityLabSheets.
- **E20** (engine; already logged by the orchestrator, `PASS3_APPROVAL_LOG.md:112-113`): world
  `text_file` pickups. P10 is m07's local workaround and doesn't depend on it.
- **L2** (HacktivityLabSheets, optional; already logged, `:118-119`): an NFS and netcat field guide.
  P7 already points m07's SSH guide at `ssh-access-and-bruteforce`.
- **Withdrawn from draft 1:**
  - A1 (inventory keycard → biometrics): the claim was wrong (F2). E19 (`:138-141`) is the same
    claim, and the orchestrator has already marked it probably withdrawn.
  - A2 (rename): decided by the orchestrator, now P9.
  - A3 (SSH sheet framing): moot, since P7 no longer uses `ssh-access-and-linux-basics`.

## 12. Done when

- [ ] `ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb`: 0 errors.
  Any warning beyond today's six is justified in the implementation notes.
- [ ] `./scripts/compile-ink.sh m07_architects_gambit`: 8/8.
- [ ] `inkcheck` clean on every entry knot (briefing, HaX, Architect, debrief, Hollis, Elena, Park, Mercer `start`).
- [ ] `loopcheck` clean on:
  - HaX `hub`, `commit_team` (`team_assigned` true), `redirect_open_choices` (window closed);
  - Architect `dormant` (`architect_contact` true), `parked`;
  - Hollis `hub` (no evidence; log only; handover only; both);
  - debrief `debrief_hub`.
- [ ] Rename: `grep -rni "morrison\|jake" scenarios/m07_architects_gambit` finds only the dated
  notes, CONTRACT.md's PASS 3 amendments block and this plan; the old `m07_npc_jake_morrison.*`
  files are gone. **[r3-m4]**
- [ ] `check_door_alignment.py`: OK (no layout change).
- [ ] TESTING_WALKTHROUGH.md, CONTRACT.md (rename; new globals `renewal_signoff_read`,
  `verdict_sent`, `verdict_from_elena`, `vault_entered`, `generator_hall_reached`,
  `inside_reached`, `splice_found`; renamed guide globals; `recover_vault_pin`'s and
  `search_cable_vault`'s type and title; the vault code's sources) and the dungeon graph match what
  ships. **[r3-m4]**
- [ ] Browser playtest (Sonnet agent, `playtest-scenario`) passes:
  1. The start inventory shows picks, cloner and print kit, and the briefing's opening names them
     before the first question menu. **Expected, not a bug:** clicking a badge in the inventory
     now opens the RFID clone minigame (the player holds a cloner); cancel it.
  2. Hollis: the leverage option is absent with no evidence; the partial option shows with only
     the visitor log; the full option shows with the handover alone and with both documents, and
     `leverage` reads right in each case. Talking him round gives the badge and both payoff lines
     ("when the alarms went"). The printer route still works. Punching him drops the badge and sets
     `badge_obtained` and nothing else. The visitor log shows the T. PARK row.
  3. Flag 1 delivers the extract, which can be read from the inventory. `projection_revised` and
     `found_coordination_traffic` are false until it is read, then true. The nudge doesn't arrive if
     the extract is read within its delay. If `onRead` doesn't fire, apply the §6 fallback.
  4. Verdict (r2-M1, r2-M2):
     - Elena-first, window open: no HaX text while she is talking; the open-window text after her
       chat closes; reading the extract later sends no second verdict.
     - Extract-first: the open-window text about 3 s after reading; closing Elena afterwards sends
       nothing.
     - Late reader (submit flag 3 first, team committed elsewhere, then read the extract): the
       shut-window text, which doesn't ask the player to call.
     - Elena-first, redirect, then read the extract: the confirmation arrives once; re-reading the
       extract sends nothing. Extract-first, redirect, re-read: no confirmation at all.
  5. Vault: the log no longer gives a working code. With the extract read (or Hollis's tip), the
     plate's last four open the door. "Work out the plant keypad code" ticks when the door opens,
     not on reading anything; "Find how the intrusion reached the breakers" ticks only on reading
     the trunk runs (`splice_found`). Note where the transfer switch lands relative to the door.
     In the generator hall without the extract read, HaX's hub offers the keypad question, and the
     answer names the source, not the digits.
  6. HaX: open the redirect menu, close the phone, submit flag 3, reopen. "Move them" is not offered.
  7. Architect: open his thread once while still in the checkpoint, close it, enter the ops floor,
     then open the thread from the contact list (not the bark). T-30 plays (F5 precondition).
  8. One run with the team never committed reaches the debrief, which says "three", and the
     credits. The music turns to `noir` on the first ops-floor entry and doesn't skip tracks on
     later crossings; a reload inside keeps `noir`. No T-20/T-10 barks: correct, not a bug.
     **[r3-m5] Accepted edge:** a player who provokes Hollis and is chased onto the ops floor on
     that first entry hears `threat` swap to `noir`; `all_hostiles_ko` → `noir` ends the same way.
     After flag 3 the HaX text says the team is still waiting on the call (r3-m6).
  9. A mid-mission page reload (after reading the extract and the projection): globals hold, no
     intro replays, no second verdict or nudge.
  10. **[r1 M7] World pickups (P10):** reading and taking the casualty projection sets
      `casualty_projection_found` (watch the global), Park's projection option and Elena's
      projection opener then appear; taking the mole intercept sets `found_mole_evidence`; taking
      the Tomb Gamma dossier sets `found_tomb_gamma`; `recover_mole_evidence` reaches 2/2. If the
      intercept fails, apply P10's container fallback and re-run this step.
  11. Park: evade him, go up and read the transfer switch (the evaded variant shows); go back and
      knock him out, and the switch shows the base text. Separate runs: walk into the vault and out
      without talking to him; provoke him (`goes_loud`) and get away; never go down. Each run's
      debrief and credits show its own line and no other Park line.
  12. The credits are read from `#bv-credits-overlay` / `#bv-cr-label` while they play.

## 13. Round-1 items: where each landed

| Item | Where |
|---|---|
| M1 rename | P9; §11 (A2 withdrawn) |
| M2 kit line | P3 (`start` knot) |
| M3 vault boss-key | P6; §3 |
| M4 verdict timing, `topic_elena` | P5 |
| M5 `vault_entered`, switch variant | P8 |
| M6 talk payoff | P4; §6 |
| M7 world pickups | F11, P10; §12 step 10 |
| m1 biometrics claim | F2, W1, §11 (A1 withdrawn) |
| m2 Park evaded credit | P8 |
| m3 clone option hard to find | moot (W7) |
| m4 VARs | P4 (`renewal_signoff_read`); no `has_rfid_cloner` (W7) |
| m5 audit date | P4 (print history, not the audit) |
| m6 SSH sheet | P7 |
| m7 no NFS/netcat guide | P7; L2 |
| m8 Architect precondition | F5; §12 step 7 |
| m9 uncommitted music | P2; §12 step 8 |
| m10 retention | §0, P2 |
| m11 extract framing | P5 |
| m12 nudge `skipIfGlobal` | P5 |
| m13 fifth clone | W7 |
| Missed: talk opens the plant | P4 |
| Missed: point at the mole | P5 (T.P. block) |
| Missed: board variants | W8 |

### Round-2 items

| Item | Where |
|---|---|
| r2-M1 verdict after the window shuts | P5 (six rows); §12 step 4 |
| r2-M2 confirmation source and repeats | P5 (`verdict_from_elena`, `onceOnly`); §12 step 4 |
| r2-m1 probe overstated | P5 |
| r2-m2 "beside the door" | P6, §3; §12 step 5 |
| r2-m3 PIN lockout | P6 |
| r2-m4 stuck at the keypad | P6 (HaX hint) |
| r2-m5 switch variant `!park_ko` | P8 |
| r2-m6 fought-off Park | P8 (sixth line) |
| r2-m7 handover alone | P4 |
| r2-m8 §6 wording | §6 |
| r2-m9 CONTRACT.md:30, grep exemption | P9; §12 |
| r2-m10 age | P9 (debrief → thirty-six) |
| r2-m11 approval-log lines | §4, P7, P9, §9, §11 |
| r2-m12 Park's arrival | P4 |
| r2-m13 music repeat | P2 |
| Q2 "only the talk route" | P4 (corrected) |
| Q3 deducible at the door | §3, P6 |
| Q4 inventory badge click | §6; §12 step 1 |
| Aim staging | P6 (`search_cable_vault` on the splice) |
| Notepad copy of the switch | P8 |
| Extract delay | P5 (3000 ms) |
| Opportunity: T. PARK row | P4 |

## 14. Implementation notes (2026-10-01)

Implemented in plan order, P9 first (validated and loopchecked after the rename before going on).
Browser playtest not yet run.

**Deviations from the plan text.**
- `tomb_gamma_dossier` moved from `onPickup` to `onRead` as well (P10 said "no change"). The notes
  branch accepts either (`interactions.js:1436`); `onRead` is the canonical key, and all three
  collect targets now match.
- The SSH guide is offered by adding `ssh_guide_offered` to the existing
  `global_variable_changed:flag2_submitted` mapping (and one sentence to its text) rather than a
  new mapping on `objective_task_completed:intercept_c2_channel`, so no new co-firing pair.
- The extract's "-- A." sign-off and its PORTLAND block (J.M., E.R., T.P. lines) are the wording
  used; the T.P. lines carry the rule and the splice pointer as planned.
- The stale docs (PASS2_IMPROVEMENTS.md, planning/*.md) got the dated rename note on top and keep
  "Morrison" in their bodies, per the rename rule ("don't rewrite those docs"). SOLUTION_GUIDE.md
  and TESTING_WALKTHROUGH.md were rewritten.

**Static results.**
- `compile-ink.sh m07_architects_gambit`: 8/8 (the briefing's `-> END` warning is pre-existing and
  correct).
- Validator: 0 errors, 8 warnings. Six as before (the cascade console's flag-type `unlock_object`,
  and co-firing `onceOnly` pairs on `flag3_submitted`, `room_entered:operations_floor`,
  `room_entered:server_room`, `grid_saved`, `item_picked_up:keycard`; the first and fourth sets
  now include P2's `inside_reached` latch and r3-m6's disjoint flag-3 split). Two new, both
  intended: `room_entered:generator_room` and `room_entered:cable_vault` each carry a one-shot
  latch (`generator_hall_reached`, `vault_entered`) beside the debrief backstop.
- `check_door_alignment.py`: 5/5 OK. `room_depth.py`: unchanged (0 empty rooms, 6 lockTypes,
  depths 0–4).
- Rendered-JSON assertions (scratchpad `m07_assert.py`): 35/35 pass.
- `inkcheck` on all eight entry knots and `loopcheck` over a 39-state matrix (HaX hub, redirect
  and commit re-checks, the vault hint's three branches, the uncommitted `topic_traffic`; the
  Architect's `dormant`, `parked`, taunts, `dead_air_choices`; Hollis with each evidence state and
  outcome; the debrief across all six Park and four Hollis states; Elena, Park, Mercer): 47/47
  clean.
- Rename grep: clean apart from the dated notes, CONTRACT.md's PASS 3 block, and the stale doc
  bodies above.

**Implementation-review fixes (2026-10-01, `scratchpad/m07_impl_review.md`).**
- Hollis: the partial option is latched (`asked_partial`); his vault line says "the OptiGrid cabling
  survey" so it reads on the handover-only route; `evade` says "his blind side", not "the cone".
- HaX: KO text "Hollis is down"; `vm_hint_1` says the export points at the coordination file; the
  three Elena verdict rows also need `!found_coordination_traffic`; the uncommitted flag-3 text says
  "holding over Denver" (the briefing has the team airborne).
- Extract header: "WINDOW OPENS 02:40 PT" (the pins go red at 02:41).
- Debrief: a fought-off Hollis (`hollis_resolved == "ko"`, not KO'd) gets "He went for our agent and
  was left standing" instead of "Nobody had asked him anything yet".
- Architect `dead_air_choices` re-checks pending taunts, as `parked` does.
- Music: the `team_assigned` → `noir` event gains `&& !globalVars.inside_reached`, so a late commit
  by a player already on `noir` doesn't skip the track. Normal commits happen before the first
  ops-floor entry, so they still switch.
- Shift supervisor D. Okafor → D. Halvorsen (no other use in `scenarios/` or `story_design/`; m08
  has an unrelated Dr Okafor). Handover signature and Hollis's line.
- CONTRACT.md: guide set and guide row now SSH; the amendments' field-guide line ungarbled; the
  dossier row says `onRead`; the supervisor rename noted. A stale ERB comment (aim unlock) no longer
  cites the maintenance log.
- Playtest s1 observation: "Back off" set `hollis_resolved = "evaded"` before the player had got
  past him. It now sets a new bool `hollis_backed_off`, and a HaX `onceOnly` mapping on
  `room_entered:server_room` (condition `hollis_backed_off && hollis_resolved === '' && !hollis_ko`)
  records "evaded" once the player actually gets through. Hollis's `start` routes a backed-off
  player to `wary_again`. `clear_the_checkpoint` was never completed by the evade knot (no
  `#complete_task` there; `npc_conversation` tasks complete only from ink or `taskOnKO`,
  `game.rb:958-962`). The tester's note came from the same run's later talk route.
- Playtest s5/s6: (1) a reopen re-navigated to Hollis's `hub` and showed it with no text. All
  in-conversation returns now go through a `back` knot that sets a local `hub_quiet`. `hub`
  re-checks KO, talked and backed-off at its top, and only on a reopen (`hub_quiet` false) it
  diverts a backed-off Hollis to `wary_again` or prints "You again. Say it or go.". This works
  whether the engine reopens at the saved knot or at `start`. (2) The transfer switch's
  observation states the plate and serial. (3) HaX's redundant "Confirm the team's away." option
  is removed, and `first_call_open` reads right for a committed team.
- Re-run after the fixes: compile 8/8; validator 0 errors, 8 warnings (unchanged); doors 5/5;
  assertions 35/35; targeted inkcheck/loopcheck on every changed knot clean.

**TTS (quota exhausted, E5): lines that need audio.**
- Ray Hollis: every line (new id and name), including the partial-leverage stonewall, the two
  `leverage` branches and the two payoff lines in `deal_take`.
- Netherton: the kit line in the briefing `start`; the shortened `:54` answer; the debrief's
  Hollis "left at his post" and age lines; the four new Park lines.
- Agent HaX: `topic_elena` and `topic_traffic` changes; the vault hint's three answers; the SSH
  guide's two lines and its choice reply.
- Elena: the `:283` vault line.
- The HaX `sendTimedMessage` texts are phone text and need no audio.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*
