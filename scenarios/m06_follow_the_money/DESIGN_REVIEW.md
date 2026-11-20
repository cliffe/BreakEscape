# m06 Follow the Money — Design Review (pass 4)

Reviewer: pass-4 design agent, 2026-10-02. Read-only review; the only file written is this one
(running the validator regenerated `dungeon_graph.{md,json,html}`).

Inputs: `scenario.json.erb` (written `erb:N`), the seven `.ink` files (written `<file>.ink:N`),
`PUZZLE_CHAINS_PLAN.md`, `dungeon_graph.md`, the engine under `public/break_escape/js/`, the
SecGen scenario `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml`, the
HacktivityLabSheets field guides, m01 as the reference, m05/m07 for continuity.

Checks run: `ruby scripts/validate_scenario.rb` (clean schema, 0 invalid), `python3
scripts/check_door_alignment.py` (all 8 doors OK), `python3 scripts/predict_door_sides.py`.
No browser playtest was run for this review. Playtest results quoted come from the pass-3 log
(`scenarios/PASS3_APPROVAL_LOG.md:149`: games 1278, 1279, 1286 reached the credits).

**Verdict.** Mechanically sound and well guided: every lock has a reachable key, every KO has a
backstop, the handler always has a next instruction, and pass 3's plan landed as written. What
holds it back is design rather than wiring. The mission is called "Follow the Money" and no
puzzle asks the player to follow any money; the tracing is all read off documents. The Irina
choice changes words but not play. The debrief's technical section is generic and partly
unreachable, and two story beats contradict each other (the monitoring branch arrests the CEO
it needs to stay unaware; the backend hosts are named inconsistently).

## 1. Validator (the skill's four groups)

### ❌ INVALID

None.

### ⚠️ WARNING

1. **Top-level `mutuallyExclusiveGlobals` "not recognised"** (`erb:458-460`). False positive in the
   validator: the schema has the field (`scripts/scenario-schema.json:67`) and the overlap check
   reads it (`scripts/validate_scenario.rb:1215`), but `check_unknown_fields` leaves it out of
   `known_top_level` (`validate_scenario.rb:247-251`). m02 hits the same warning. Tooling fix,
   not a mission fix (fix 19).
2. **Nine "eventMappings on the same pattern can co-fire" warnings on `agent_0x99_handler`**
   (`room_entered:reception_lobby`, `:trading_floor`, `:server_room`, `:satoshi_office`,
   `item_picked_up:text_file`, `global_variable_changed:server_passphrase_known`,
   `objective_task_completed:access_satoshi_office`, `irina_fate_decided`, `assets_decided`).
   Checked each pair: all are intended to fire together and do different jobs (for example
   `erb:861-866` completes a task while `erb:801-809` is the debrief backstop; `erb:998-1006`
   share the `flags_nag_sent` latch so only one nag sends). No action.
3. **Guard cutscene without `onceOnly`** (`erb:1138-1143`). Intended: the lockpick challenge must
   repeat; the comment explains the 250 ms cooldown. No action.
4. **`data_center` locked but nothing has `puzzle_graph_unlocks: data_center`.** False positive:
   the key is the flag-station reward `door_controller_export` (`erb:1347-1355`) and task
   `submit_flag3` (`erb:311`); the validator does not look inside an object's `itemsHeld`. The
   graph draws the edge correctly (`vmfl_submit_flag3 --> door_data_center`).
5. **Missing behaviour on `director_netherton` / `agent_nightshade`** (`erb:627-662`). Intended:
   hidden co-speakers in the opening cutscene. No action.

### ✅ GOOD PRACTICE

Event-driven cutscenes (14), `globalVarOnKO` on every person NPC, `skipIfGlobal` on the opening,
`collection_group` tracking for the transaction-server files, a full music cue sheet, and dense
`puzzle_graph_*` metadata.

### 💡 SUGGESTION

- *Side task `decide_asset_strategy` has no KO fallback on Satoshi.* False positive: his KO opens
  `on_satoshi_ko` by phone (`erb:959-973`) and both phone choices carry
  `#complete_task:decide_asset_strategy` (`m06_phone_agent_0x99.ink:452`, `:463`). The validator
  cannot see a task completed in a phone knot that a KO mapping opens.
- *Add timedMessages to HaX.* Not wanted: pass 2 replaced them with event-keyed texts on purpose
  (`erb:747`, lessons 20/42).
- *Add a hostile NPC.* Satoshi already turns hostile on an evidence-free arrest
  (`m06_satoshi_confrontation.ink:457-461`).

### Dungeon graph summary

Puzzle 49 nodes / 50 edges; Story 6 / 5; Integrated 55 / 71; Rooms 9 / 8.
Critical path (5 hops): Establish Cover → Work The Floor → Crack The Backend → Map The Money →
Reach The Top Floor → Settle The Account. Room layout geometry OK; door alignment OK.

## 2. Design review (skill §2a–2h)

### 2a. Solvability trace — OK

| Step | Lock | Key / code and where it is | Before the lock? |
|---|---|---|---|
| Lobby → checkpoint | none | — | — |
| Checkpoint → trading floor | key (`erb:1169-1172`) | talk the guard round with "FCA" + "Dr Volkova" (`m06_npc_checkpoint_guard.ink:59-77`, words given in HaX's text `erb:751` and the brochure `erb:1081`), or pick in his blind window (start-kit lockpick `erb:475-482`), or KO him | yes |
| Floor → server room | password `bitcoin2025` (`erb:1293-1294`) | convention + year on the checkpoint checklist (`erb:46`, `:1150-1161`); "bitcoin" tops Irina's wordlist (`erb:1225`), or HaX's relayed copy after a KO (`erb:719-726`) | yes (checklist one room earlier) |
| Backend | VM flags 1–4 | terminal and drop-site in the server room (`erb:1302-1342`) | yes |
| Server room → data centre | PIN `3110` (`erb:1387-1389`) | Door Controller Export, paid out for flag 3 (`erb:1336`, `:1347-1355`) | yes (VM chain) |
| Floor → CTO office (optional) | RFID `cto_badge` | Irina lends it at trust ≥ 25 (`irina.ink:279-288`), clone it (`:303-320`), KO drop, or HaX relay (`erb:727-734`) | yes |
| Data centre → executive wing | RFID `executive_badge` (`erb:1574-1577`) | Irina hands the spare over once the fund is found (`irina.ink:182`, `:328-349`); KO drop; HaX relay (`phone.ink:143`) | yes, boss-key: seen at the data centre, key on the trading floor |
| Wing → CEO office | none | — | — |
| CEO safe (optional) | PIN `2140` (`erb:1666-1667`) | Architect's P.S. in the CTO office (`erb:1563`) + press clipping in the wing (`erb:1591`) | yes |
| Ending | `concludeRequires` flags 1–4 (`erb:415-422`) + debrief trigger (`erb:1046`) | both decisions + four flags | — |

No circular dependency, no soft lock found. VM flag wiring is correct: every `submit_flags` task
has `targetFlags` (`erb:284`, `:295`, `:306`, `:317`), and each `flagN_submitted` global is set
from an `objective_task_completed:submit_flagN` mapping (`erb:879-902`), not from `emit_event`.

Edge path, OK but worth knowing: a player who KOs Irina early picks the executive badge off the
floor, enters the data centre, and can walk east into the wing without taking the fund document.
The wing task is recorded but its aim stays hidden until `map_financial_network` completes
(`objectives-manager.js:646-655`); `access_satoshi_office` then opens the last aim directly
through `unlockAim`, which ignores `unlockCondition` (`objectives-manager.js:706-722`). The
mission still ends, and the debrief has a `found_architects_fund == false` branch
(`m06_closing_debrief.ink:102-104`, `:360-365`). Satoshi's second opener quotes the fund without
checking `found_architects_fund` (`m06_satoshi_confrontation.ink:54`) on that path. Minor.

Dialogue promises: all props exist, and stated directions match the `connections` (wing "east
of the data centre", `irina.ink:345` vs `erb:1391-1392`; office "west off the trading floor",
`phone.ink:425` vs `erb:1177`). One promise is false in effect: the recruited Irina says she will
give "the pool keys, the wallet map, and the name on the account" (`irina.ink:451`), and nothing
is given (see §4.3).

### 2b. Clue distribution — OK, with two clue problems

Clues are spread across five rooms: convention in the checkpoint, term on the floor (Irina),
reuse hint in the server room (rack sheet `erb:1370-1377`), PIN from the VM, safe code split
across the CTO office and the wing. That is the right shape.

- **CONCERN — the wordlist is pitched at two jobs and does one.** The objective calls it
  `obtain_access_tools` / `password_cracking_ready` (`erb:205-212`), its graph edge points at the
  VM launcher (`erb:1228`), and its observation says it covers "accounts and door controllers
  alike" (`erb:1226`). The VM's passwords come from John's default list (SecGen
  `m06_follow_the_money.xml:102-118`, `jtrpassword.lst`), so the list does nothing on the
  backend. HaX says so only if asked (`phone.ink:186-187`: "Irina's list is for the doors"). A
  player who feeds it to John wastes time and learns the wrong lesson. Fix 8.
- **CONCERN — the backend hosts don't agree.** The rack sheet says "the ledger account also
  drives the door controllers" (`erb:1374`) and the export is headed `hc-ledger-01`
  (`erb:1352`). The aim, HaX and the recap say the *financial database* runs the doors
  (`erb:268`, `:894`; `phone.ink:279`). On the VM the ledger is flag 2 (`hcledger`) and the
  financial database is flag 3 (`hcfindb`) (xml `:125-127`), and the export pays out on flag 3.
  The rack sheet also lists no database or vault host, though the vault (`hc-vault`) is named in
  the data centre (`erb:1454`). For a mission whose lesson is credential reuse across named
  accounts, the names should line up with the VM. Fix 7.
- Readables with no puzzle role: brochure (`erb:1076-1084`, but it names the CTO for the guard),
  daily trading report (`erb:1277-1284`), mixing analysis (`erb:1515-1522`), manifesto
  (`erb:1650-1658`), research notes (leverage, used), transaction-server files (optional
  collect). All carry story and none is navigation-only. OK.

### 2c. Educational coverage — CONCERN (theme told, not played)

Locks: key + lockpick (with a guard's line of sight), password (predictable convention), PIN
×2 (one from the VM, one from personal-significance clues), RFID ×2 (social lend or clone),
VM flags ×4 (distcc foothold, offline cracking, credential reuse, sudo priv-esc to the vault).

Coherent with "password security at a crypto firm": the server-room passphrase, the shared
service-account password and the recovery keys all living on one account are the same weakness
seen three ways, and the freeze option needs the keys from flag 4, which teaches that whoever
holds the keys controls the coins. That is the mission's best idea.

The stated brief is financial forensics (`mission.json`: "Financial forensics, Transaction
analysis, Follow-the-money investigation"), and nothing the player *does* touches it. The
ransom → mixer → fund trail arrives pre-solved in Priya's write-up (`erb:48`, picked up off a
desk) and every document spells out the wallet names. See §4.1 and fix 1.

### 2c′. Field guides — OK

All five are exposure-gated and given on request: cracking on the wordlist pickup (`erb:822`),
recon and distcc on first terminal use (`erb:850`), privesc on flag 1 (`erb:882`), RFID on
entering the floor (`erb:835`). Every `#give_item:lab-workstation:<id>` matches `itemsHeld`
(`phone.ink:482-518` vs `erb:676-717`), and every `_offered`/`_hint_given` global is declared
(`erb:573-582`). All five `labUrl`s exist in HacktivityLabSheets (`_labs/safetynet/`), and
`offline-password-cracking.md:69-71` is written for HashChain. Two notes:

- The PASS4 log says the lab-sheet commits are not pushed yet (`PASS4_EDITORIAL_LOG.md:16`),
  so the URLs 404 until they are. Carried, not new.
- The cracking guide is offered when the wordlist is picked up, i.e. on the trading floor
  before the shadow file exists. The guide teaches offline cracking of the VM's hashes, so it
  belongs on first terminal use or on flag 1's approach, next to the distcc guide. Part of fix 8.

### 2d. Narrative structure — OK, with a long opening

- Opening: `timedConversation` with `skipIfGlobal` + `setGlobalOnStart` (`erb:615-622`). It
  briefs role, cover and objective. It is long: 13 knots and three-to-five choice layers before
  play (`m06_opening_briefing.ink:21-342`), with "true believer" four times (`:88`, `:113`,
  `:236`, `:320`) and three separate objective restatements (`:189-195`, `:293-299`, `:331-335`).
  Some routes skip the cover story entirely (`resources → final_briefing`, `:269-286`). See §4.2.
- Closing: hidden person NPC with 13 event-driven triggers, each waiting for both decisions and
  all four flags (`erb:1046-1071`); `hear_debrief` completes on the last line so the credits
  follow the debrief (`m06_closing_debrief.ink:488`). Clear win condition.
- Event arcs spot-checked: fund found → HaX points at Irina for the badge, split on her KO
  (`erb:911-924`); Satoshi KO → phone decision (`erb:959-973`); Irina KO → three texts split on
  her fate (`erb:926-946`). All sound.

### 2d′. Ink conventions — CONCERN (minor, dialogue stage)

Narration uses `Narrator:` and a top-level narrator voice exists (`erb:57-65`). No in-ink
combat: Satoshi switches hostile and exits (`satoshi.ink:457-461`). Choice phrasing problems,
for the dialogue pass rather than this one:

- `You:` lines after a choice: Irina `:280`, `:372`, `:378`, `:392`, `:398`, `:402`, `:445`,
  `:463`; Satoshi `:326`, `:329`, `:380-382`, `:426`, `:478`; phone `:447`, `:458` (the last two
  are the U3 item: phone-chat shows them as HaX speaking).
- Menu-label brackets: phone hub `[Password cracking guidance]`, `[Blockchain analysis tips]`,
  `[Irina Volkova recruitment strategy]` (`phone.ink:112-117`); briefing `[Tell me about the cover
  story]` (`briefing.ink:218`); trader `[Tell me about the exchange's operations]`
  (`trader.ink:40`).
- `#exit_conversation` placed before the reply line in Satoshi's aftermath
  (`satoshi.ink:592-605`) and HaX's first call (`phone.ink:96-99`); the reply may never show.

### 2d″. Patrol guard — OK

`checkpoint_guard` (`erb:1097-1146`): waypoints (4,4)/(3,4) inside a 1×2 GU hall, 120° cone,
range 210 px, `visualize: true`. A 1-GU corridor only supports timing passes, and that is what
the design wants (wait for his westward dwell). The pass-3 comment documents the window
geometry and the playtests confirmed it.

### 2e. Graph metadata — CONCERN (one broken node, three wrong or missing edges)

- **Malformed action node.** `puzzle_graph_actions` is given as strings (`erb:1207`
  `["irina_cooperation"]`, `erb:1631` `["satoshi_confrontation"]`). The generator expects
  objects `{id, label, unlocks_aim}` (`README_scenario_design.md:1569`;
  `scripts/generate_dungeon_graph.rb:242-246`); on a String, `action['id']` is nil, so both NPCs
  feed one empty node, `action_>""]`, in `dungeon_graph.md`. No bridge to any aim is drawn.
- **Fake lock.** The blockchain evidence carries `puzzle_graph_unlocks: architects_fund_doc`
  (`erb:1511`), which draws a lock "Architects Fund Doc" behind Priya's write-up. The fund
  document is a free pickup in the data centre; the edge is false.
- **Wordlist edge** goes to the VM launcher (`erb:1228`) when it opens the server-room door.
- **Clipping** is a safe clue with no `puzzle_graph_unlocks: executive_safe` (`erb:1593-1595`),
  so only the email feeds the safe.
- Starting items are in the graph (lockpick → trading floor, cloner → CTO office). VM chain is
  connected (launcher → terminal → flag 1 → … → data-centre door). No backwards edges.

### 2f. Rooms and dead ends — OK

Nine rooms, none empty or useless. The CTO office and the safe are optional and pay off (leverage,
identity file). Room types fit, though three rooms share `room_office` (trading floor, lab, CTO
office), so the exchange's signature room looks like every office. Backtracking is deliberate
(fund → Irina → wing, the plan's boss-key, `PUZZLE_CHAINS_PLAN.md` §8). Geometry and doors are
clean.

### 2g. Objectives scaffolding — OK, two soft spots

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Bark at transition |
|---|---|---|---|---|
| Establish Cover | 2 (`receive_briefing` custom, `meet_irina` npc) | 2/2 (HaX text `erb:751`) | low | yes, on Irina's close (`erb:760-766`) |
| Work The Floor | 5 (wordlist collect, passphrase manual, server room enter, lab enter, evidence collect) | 4/5; the blockchain lab has no proactive pointer, only the aim description and an ask-only HaX knot (`phone.ink:192-197`) | low; the aim can stay open all game because the lab isn't on the path | partly: the passphrase and wordlist texts (`erb:819-823`, `:856-859`); nothing on entering the server room |
| Crack The Backend | 5 (terminal custom, flags 1–4) | 5/5 (HaX `erb:850-852`, `:880-901`) | **medium**: flag 3's text says "North door" (`erb:894`), so players leave before flag 4, which is needed for the freeze and the ending | yes |
| Map The Money | 2 + 1 optional | 2/2 | low | yes (`erb:911-924`) |
| Reach The Top Floor | 2 + 1 optional | 2/2 (recap `phone.ink:284-293`) | low | no bark on entering the wing; recap covers it |
| Settle The Account | 4 (`confront_satoshi`, two manual decisions, `hear_debrief`) | 4/4 (Satoshi's choice, HaX nags `erb:993-1013`) | **medium**: if flag 4 is missing, the climax is followed by a trip back to the terminal | yes (nags) |

Task titles are action-led. Aim descriptions match their tasks, except "Work The Floor" whose
description doesn't mention the lab tasks it requires (`erb:198`, "see what the exchange's own
analysts have drawn" does, loosely). The one real scaffolding issue is flag 4's placement; see
§4.2 and fix 5.

### 2h. NPC knockout resilience — OK

| Person NPC | Gates a required task/item? | `taskOnKO` / fallback | KO in debrief/credits | Verdict |
|---|---|---|---|---|
| `checkpoint_guard` | trading-floor door (one of three routes) | N/A (KO is itself a route) | credits `erb:142` | OK |
| `irina_volkova` | `meet_irina`; wordlist; CTO badge; executive badge | `taskOnKO: meet_irina` (`erb:1201`); items drop (`erb:31-34`); HaX relays wordlist and both badges on request (`phone.ink:139-144`) | credits `erb:147`; debrief `irina_ko_path` (`debrief.ink:160-173`); three fate-aware HaX texts | OK |
| `trader_npc` | optional task | `taskOnKO` (`erb:1264`) | credits `erb:151` | OK |
| `blockchain_analyst` | optional task | `taskOnKO` (`erb:1490`) | credits `erb:153` | OK |
| `satoshi_nakamoto` | `confront_satoshi`; asset decision | `taskOnKO` + phone decision (`erb:959-973`), sticky hub option (`phone.ink:165-166`) | credits `erb:148-149`; debrief `satoshi.ink`/`debrief.ink:269-272` | OK; but the KO line is only heard if the player picks "What about Satoshi?" from the recruited or arrested branches (`debrief.ink:214`, `:250`). The KO branch for Irina never reaches it. Minor. |

The win condition (debrief trigger on `closing_debrief_person`, always loaded in the start room)
cannot be blocked by any NPC. One narrative wobble: if Irina is KO'd before the player ever
speaks to her, HaX says "She was halfway to walking" (`erb:931`) and the debrief cites "a note
in her own research file" (`debrief.ink:166`) whether or not the player read it. Minor.

## 3. Prioritised action list (skill Step 3)

**Must fix (blocks play):** nothing. No invalid fields, no soft lock, no KO soft lock, and the
win condition can't be blocked by any NPC.

**Should fix (degrades experience):** the theme is never played (fix 1); flag 4 can fall after
the climax (fix 5); the recruited-Irina choice gives nothing (fix 3); story logic and the freeze
wording (fix 6); dead debrief branches and a generic technical section (fixes 2, 4); backend
host names (fix 7); the wordlist's two jobs and the guide timing (fix 8); graph metadata (fix 9);
the long opening (fix 10).

**Worth considering (polish):** fixes 11–17; validator false positives (fixes 19–20, tooling).

## 4. Beyond the checklist

### 4.1 The title promises a trace the player never makes

Every link in the money trail is handed over in prose. Priya's write-up lists inbound wallets,
amounts and the outbound payments (`erb:48`) and sits on a desk in an open room off the hub
(`erb:1502-1513`). The trader's report names the wallets (`erb:1281`), Priya names them aloud
(`analyst.ink:315`), the cold-storage index labels the fund (`erb:1431`), and the vanity
addresses literally spell `1ENTROPY…` and `1ARCHITECT9FUND`. The player's job is to walk to
each document and read it.

Meanwhile the mission already contains every ingredient of a real tracing puzzle: inbound
amounts and dates (`erb:1411`), the mixer's fixed hop chain and minimum dwell (`erb:1421`), an
index of cold wallets (`erb:1431`), and an analyst whose dialogue explains exactly the
technique that defeats a mixer, matching amount and timing (`analyst.ink:146-150`,
`:287-291`). Correlating what went into the mixer with what came out is the core skill of
blockchain forensics, and it is what the briefing promises ("follow enough hops and the mixers
stop hiding people", `briefing.ink:29`).

The highest-value change in this review is to make the fund wallet something the player
identifies rather than reads (fix 1). It turns a mission about forensics into one where the
player does forensics, gives Priya a teaching role, and costs no new art or engine work.

### 4.2 Pacing and dead time

- **The opening is front-loaded.** The briefing (342 lines, 13 knots) asks for three to five
  choices before play and repeats itself (§2d). m01's opening is about half the size
  (`m01_opening_briefing.ink`, 7.6 KB vs 12.8 KB). The guard and the cover are explained again
  by HaX's text on close (`erb:751`), the recap, and the phone's first call
  (`phone.ink:84-105`). Cut the briefing to: who pays ENTROPY, HashChain, the cover, Irina as
  the person to work, the two calls you will have to make. Everything else is in the hub.
- **Act one is quick and that's good.** Guard within a minute, passphrase at depth 2.
- **The trust grind with Irina is a speed bump, not a puzzle.** A low-trust ask is refused, then
  the second ask always succeeds (`irina.ink:217`). That was a deliberate playtest fix (D1) so
  the clue can't be lost. Fine, but the trust topics then only matter for lending the badge
  (≥ 25) and recruitment (≥ 35), which most players won't track. Leave it; fix 3 gives the
  recruitment outcome a reason to care.
- **Flag 4 can land after the climax.** Flag 3's text sends the player through the north door
  (`erb:894`). Flag 4 is only needed for the freeze (`satoshi.ink:278`, `:284`) and the ending
  (`erb:415-422`). A player who goes straight up meets Satoshi without the keys, either defers
  ("I'll be back with the recovery keys", `satoshi.ink:284-288`) or chooses to watch, and then
  has to walk back down to the terminal after the confrontation (four room transitions each
  way) for a debrief that waits on the last flag (`erb:1046`). The villain scene should be the
  last thing the player does, not the second-last. Fix 5.
- **After the VM, the physical play is short.** Data centre → back to Irina → wing → office.
  That is fine at this mission's size; the plan chose it on purpose.

### 4.3 Choices that change words but not play

- **Irina: turn or detain.** Both outcomes give the same items (she hands the executive badge
  over either way, `irina.ink:328-349`), unlock nothing extra, and differ only in credits and
  debrief text. Her acceptance promises "the pool keys, the wallet map, and the name on the
  account that pays me … all of it, tonight" (`irina.ink:451`); the player receives none of it,
  and HaX later says she handed it over (`debrief.ink:192-194`). `README_ink_best_practices.md`
  asks that choices matter. A recruited Irina should hand the player something that changes the
  endgame (fix 3).
- **Satoshi is always detained** (PASS3 D5), whatever the player says. Accepted canon. His
  confrontation still has real weight because he lays out the asset decision.
- **Freeze or watch** is the mission's strongest choice: it needs a capability (the vault keys
  from flag 4), its cost is stated plainly on both sides (`phone.ink:384-389`,
  `debrief.ink:127-134`), and m07 opens on its consequences ("Some of them had already been
  paid", `m07_opening_briefing.ink:27`). Keep it.
- The asset decision is framed by the villain (`satoshi.ink:263-291`). It works dramatically,
  but HaX has already laid out the same two options (`phone.ink:370-389`) only if the player
  phones in. Fine as is.

### 4.4 Story logic that doesn't hold

- **Watching the fund while arresting the man who controls it.** The monitoring branch's
  premise is that ENTROPY mustn't know (`phone.ink:372`; debrief `:283`, "Shutting it would
  tell ENTROPY exactly what we're doing"). But Satoshi is always detained in his office, and a
  recruited Irina is "taken in" (`debrief.ink:453`). The scenario already holds the answer: the
  settlement log says the CEO "signed this batch in advance, so it goes out on its own"
  (`erb:1411`). One HaX line in the monitoring branch, saying the payout runs on his
  pre-signed batch and his arrest is kept off the books for 72 hours, closes the hole. Fix 6.
- **A recruited Irina + monitoring.** `debrief.ink:178` says she gave the mixer "before the
  police took the building"; `:283` says "the exchange stays open for now, under watch". Both
  play in one run. Fix 6.
- **"Sweep into cold storage."** The fund already sits in a cold wallet (`erb:1431`, custody
  `cold`). Freezing means using the recovery keys to move it into a wallet SAFETYNET controls.
  The wording at `satoshi.ink:326`, `phone.ink:446-447` and the credit `erb:135` teaches the
  wrong idea at the exact moment the mission's best lesson lands (keys = control). Fix 6.
- **HaX is surprised by a recruitment she asked for.** "You recruited her. That was…
  unexpected" (`debrief.ink:176`), after the briefing and the phone both push recruitment
  (`briefing.ink:139-141`, `:299`; `phone.ink:219-228`). Dialogue-stage fix.
- **Backend names** (§2b) and **a guide offered before its subject exists** (§2c′).

### 4.5 Does the debrief reflect what the player did?

Partly. It branches correctly on the fund decision, Irina's fate (with KO precedence matching
the credits), Satoshi's KO and the safe. It does not reflect:

- **Unreachable branches.** `partial_flags` and `minimal_flags` (`debrief.ink:299-331`) can
  never play, because the debrief only triggers with all four flags (`erb:1046`). So the
  technical section is always the same three generic lines (`:306-311`; "the kind of technical
  work that gets operations promoted"). `irina_neutral_path` (`:255-262`) can't play either,
  because the debrief needs `irina_fate_decided` and a KO sets it (`erb:930`). Delete them.
- **No lessons.** m01's debrief reviews the player's in-cover security audit and names the
  vulnerabilities found (`m01_closing_debrief.ink:522-560`). m06's cover is literally a
  regulator's audit, and HashChain's failures are vivid and specific: a written-down passphrase
  convention, a stale "current year", two service accounts sharing a password, the door
  controllers on a database account, every recovery key on one account, compliance reporting
  switched off by the CEO. The debrief names none of them. Fix 2 turns this into a short "what
  goes in the FCA letter" beat, which is both the lesson recap and a cover-consistent payoff.
- **How the player got in.** The guard route, lend vs clone of the CTO badge, whether the
  research notes were read, and whether Priya and Dani were spoken to are in the credits
  (`erb:141-153`) but not the debrief. Not every one needs a line; the badge route (social vs
  clone) and the notes are the two worth one sentence each.

### 4.6 How clearly each puzzle teaches its idea

| Puzzle | Idea | Clarity | Note |
|---|---|---|---|
| Checkpoint guard | social engineering a gatekeeper with a pretext; LOS while picking | good | the two-beat question (who, then whom) models pretexting well |
| Server-room passphrase | predictable password conventions; stale rotation | good | "current year" vs "written in January 2025" (`erb:46`) makes the player reason about rotation, not just guess |
| Irina's wordlist | password audit lists | muddled | same list claims to be for the backend (§2b) |
| CTO badge clone | RFID cloning at conversational range | good | three routes, clone rule correct |
| VM flags 1–2 | offline cracking, credential reuse | good | the rack sheet foreshadows reuse (`erb:1374`) |
| Data-centre PIN | blast radius of a compromised service account | good idea, blurred by the host-name mismatch | fix 7 |
| Flag 4 → freeze | keys = control of crypto assets | strong, undermined by "sweep into cold storage" | fix 6 |
| Executive badge | social / insider access | fine | it's a story lock more than a security one |
| Safe 2140 | personally meaningful PINs | good | two clues, one on the route |
| The trail itself | transaction analysis through a mixer | absent | fix 1 |

### 4.7 Fun and stakes

Stakes are high and concrete (72 hours, six named cells, a casualty projection the cells wrote
themselves) and the reveal is staged well: the briefing hints, the lab evidence suggests, the
fund document confirms, and HaX names "Satoshi's Ghost" as the man upstairs
(`phone.ink:350`). Two things blunt the fun: most discoveries are pickups, and the climax can be
followed by a return to the terminal. Fix 1 and fix 5 address both. The guard turnstile is a
good small toy.

### 4.8 Continuity

- **From m05.** m05 ends "Next, we follow the money" (`m05_closing_debrief.ink:460`); m06 opens
  on the same thought and quotes m05's $847,000 TalentStack budget correctly
  (`briefing.ink:51` vs `m05 erb:1570`). Good.
- **To m07.** m07's opening ("one fund paying six cells on one seventy-two-hour clock. Some of
  them had already been paid", `m07_opening_briefing.ink:27`) fits both asset outcomes. Good.
- **Kit.** Lockpick, cloner and print kit carried; no PIN cracker (`erb:473-500`), and the
  briefing says so (`briefing.ink:297`). m07 now names the same kit (`m07_opening_briefing.ink:38`).
  The fingerprint kit is carried with no use (`erb:498`, a deliberate pass-3 call). A natural,
  honest use exists: Satoshi's prints on his own desk or whitepaper frame opening a biometric
  drawer, on the m04 pattern (`m04 erb:1431`). Optional, fix 12.
- **Recurring characters.** Netherton and Nightshade appear as co-speakers in the briefing,
  with no hint of the m08 betrayal (`erb:646`). HaX's voice is consistent in the scenario's
  voice blocks.
- **The Architect thread.** The safe names "Dr. Adrian Tesseract, former SAFETYNET chief
  strategist" at 87% (`erb:1679`), and HaX admits she was his student (`debrief.ink:422`).
  This follows the season plan (`planning_notes/overall_story_plan/quick_reference.md:83`,
  `:120`: identity revealed in M9) and was signed off as a lead in pass 2
  (`PASS2_APPROVAL_LOG.md:565`). But the universe bible says the identity is unknown and "even
  cell leaders don't know" (`the_architect.md:6`, `:444`), and neither m07 nor m08 mentions
  Tesseract, so in the built season this is a dangling hook. Needs a canon decision (fix 18).
- **Art.** Satoshi, a forty-something CEO behind an executive desk, uses the hooded-hacker
  sprite `male_hacker_hood_v2` (`erb:1615`), which also has no `spriteVisemes`.
  `male_hacker_hood_down_v2` has visemes but is used in m03, m07 and m08. A suited executive
  sprite would fit (backlog).

## 5. Proposed fixes

Tags: **blocker / major / minor**; **local** = this mission's own erb, ink and docs (approved in
pass 4 if solvable and validator-clean); **needs approval** = engine, shared tooling, canon,
other missions or other repos. Spoken lines touched are noted where it matters (m06 audio is
not generated yet, so they cost nothing now).

1. **major · local — Make the player find the fund wallet.** Move `architects_fund_doc`
   (`erb:1437-1447`) into a new locked container in the data centre, a "Cold Storage Console"
   (`pc`, `lockType: password`), whose password is the exchange's internal custody ID for the
   fund. Rework three existing texts so the ID has to be deduced:
   - `cold_storage_index.csv` (`erb:1431`) lists five or six cold wallets by custody ID
     (e.g. `CS-01`…`CS-06`) with neutral labels, and drops the "do not reconcile" giveaway
     (or keeps it on a decoy);
   - `settlement_exceptions.log` (`erb:1411`) lists post-mix deposits into custody IDs with
     amounts and timestamps;
   - `mixer_pool_config.yml` (`erb:1421`) keeps `min_dwell_hours: 6` and gains a fixed fee
     (say 1.5%).
   Priya's write-up (`erb:48`) keeps the inbound amounts and dates into `1ARCHITECT9FUND`. The
   fund is the custody ID whose deposits match those inbounds less the fee, at least six hours
   later. Give Priya one line that states the method (match amount and timing either side of the
   mixer; her `illegal_patterns` and `pattern_concerns` knots already half-say it,
   `analyst.ink:146-150`, `:287-291`) and give HaX a recap line. The lab evidence becomes a real
   clue on the critical path; add `puzzle_graph_unlocks` for the console and drop the fake lock
   (fix 9). Keep the arithmetic to "same amount minus 1.5%, same evening" so it stays fun, not
   hard. Wallet vanity names elsewhere can stay. Validate, door-check and playtest after.
2. **major · local — An "FCA letter" beat in the debrief.** After the fund discussion, HaX
   asks what goes in the supervisory letter on HashChain, since the player was their regulator
   tonight. Three picks from a list mixing real findings (written-down passphrase convention;
   stale "current year"; two service accounts sharing a password; door controllers on a
   database account; every recovery key on one account; compliance reporting switched off by
   the CEO; EM4100 badges cloneable at conversation range) with plausible non-findings
   ("they trade Monero"; "the CTO publishes papers"). HaX responds to the count, m01-style
   (`m01_closing_debrief.ink:530-560`). This replaces the generic technical lines
   (`debrief.ink:306-311`). About 15 new spoken lines.
3. **major · local — A turned Irina gives the player something.** Add an item to her
   `itemsHeld`, e.g. "Mixer Wallet Map" (`text_file`), given by `#give_item` in `recruit_accept`
   (`irina.ink:440-455`) so her line "the pool keys, the wallet map, and the name on the account
   that pays me" is true. With fix 1 the map names the fund's custody ID (a social route past the
   console, matching the mission's two-route pattern); without fix 1 it carries the safe's code
   or the Architect's contact address. Pick-up mapping sets a global the debrief reads
   (`debrief.ink:189-196` then cites what the player actually holds). Detained Irina gives
   nothing, so the choice has a gameplay cost. Respect lesson 26 and the clone/give rules.
4. **minor · local — Delete unreachable debrief branches.** `partial_flags`, `minimal_flags`
   (`debrief.ink:299-331`) and `irina_neutral_path` (`:255-262`), and the matching diverts
   (`:296-304`, `:156-158`). Keep the `found_architects_fund == false` evidence branches (they
   are reachable on the early-KO path, §2a).
5. **major · local — Get flag 4 done before the climax.** Change flag 3's text (`erb:894`) to
   point at the vault account first ("The data centre code is in it, north door. Before you go
   up, finish the estate: the vault account is the last one, and I want its keys in your pocket
   when you meet him."). Add a once-only HaX text on `room_entered:executive_wing` when
   `flag4_submitted !== true` with the same point, and adjust the recap (`phone.ink:281-293`).
   No hard gate: the defer route stays as the backstop. Two or three spoken lines.
6. **major · local — Fix the money story's logic and the freeze wording.**
   (a) Monitoring branch: one HaX line in the debrief and in `handler_recommendation`
   (`phone.ink:384-389`) saying the payout runs on Satoshi's pre-signed batch (`erb:1411`) and his
   arrest stays off the books until it has gone. (b) `debrief.ink:178` loses "before the police
   took the building" (it contradicts `:283` when the fund is watched). (c) Replace "sweep into
   cold storage" with "move it into a wallet we hold" at `satoshi.ink:326`,
   `phone.ink:446-447`, `:453`, and the credit `erb:135` ("FROZEN — $12.8M moved into a
   SAFETYNET wallet. The cells not yet paid go without."), and have HaX say once that holding
   the keys is holding the money.
7. **minor · local — Make the backend hosts match the VM.** Rack sheet (`erb:1374`): add
   `hc-findb-01 (financial database — RESTRICTED)` and `hc-vault-01 (cold storage keys —
   RESTRICTED)`; say "the auth and ledger service accounts share a password" (true on the VM,
   `xml:99-101`) and "the financial database account also drives the door controllers". Export
   header (`erb:1352`) → `hc-findb-01`. Wallet procedure (`erb:1454`) → `hc-vault-01`.
8. **minor · local — One job for the wordlist; the cracking guide on the terminal.** Wordlist
   observation (`erb:1226`) → "the words and years staff here pick for door passphrases";
   `puzzle_graph_unlocks` → `server_room` (`erb:1228`); task `obtain_access_tools` title stays,
   its `puzzle_graph_unlocks` → `server_room` (`erb:212`). Move `cracking_guide_offered` from
   the wordlist pickup (`erb:822`, `:829`) to the `vm-launcher` interaction (`erb:850`), and
   change HaX's wordlist text (`erb:823`) to drop the guide offer. If SecGen ever seeds a
   password from the list, revisit (backlog).
9. **minor · local — Graph metadata.** `puzzle_graph_actions` as objects:
   `[{ "id": "irina_cooperation", "label": "Win Irina over (or settle her fate)", "unlocks_aim":
   "resolve_the_fund" }]` (`erb:1207`) and `[{ "id": "satoshi_confrontation", "label":
   "Confront Satoshi's Ghost", "unlocks_aim": "resolve_the_fund" }]` (`erb:1631`). Remove
   `puzzle_graph_unlocks: architects_fund_doc` from the lab evidence (`erb:1511`) unless fix 1
   makes it true. Add `puzzle_graph_unlocks: executive_safe` to the press clipping
   (`erb:1593-1595`). Regenerate the graph.
10. **major · local — Cut the opening briefing by about half.** Keep the knots that carry the
    who-pays hook, HashChain, the cover, Irina, the kit line (`briefing.ink:297`) and the "two
    calls" close (`:335`). Fold `exchange_role`/`internal_access`/`evidence_targets`/
    `financial_targets` into one beat; drop the repeated "true believer" lines and two of the
    three objective restatements; make sure every route hears the cover (`resources` currently
    skips it, `:269-286`). Dialogue stage owns the words; this item owns the length and the
    route coverage.
11. **minor · local — Two early-KO wobbles.** Gate Satoshi's fund opener on
    `found_architects_fund` (`satoshi.ink:54`) and give the ungated `evidence_reveal` the
    no-fund case. Make HaX's first Irina-KO text (`erb:931`) and the debrief's research-note
    line (`debrief.ink:166`) conditional on the player having met her / read the notes
    (`read_irina_notes` is already a global).
12. **minor · local (optional) — A use for the fingerprint kit.** A biometric-locked desk
    drawer in Satoshi's office opened with his print lifted from the framed whitepaper glass
    (`hasFingerprint`, m04 pattern `m04 erb:1431`), holding a lore item (his signing key for
    "Satoshi's Ghost", or a second Architect lead). Only if it doesn't crowd the office; the
    safe stays the main optional.
13. **minor · local — Point at the blockchain lab.** The "Work The Floor" aim requires the lab
    tasks (`erb:229-246`) but nothing sends the player there. Add a once-only HaX text on first
    entering the trading floor or on Irina's first close ("Their analysts sit east of the floor.
    If anyone has drawn the money, it's them."), and mention the lab in the aim description
    (`erb:198`). Needed anyway if fix 1 puts the lab on the critical path.
14. **minor · local — The debrief notices how the player got in.** One line each, branching on
    `irina_badge_cloned` vs `irina_badge_obtained` and on `read_irina_notes`, in the Irina
    section.
15. **minor · local (dialogue stage) — Convention clean-up.** Fold the `You:` lines into their
    choices (list in §2d′; the two phone ones are U3), rephrase the menu-label brackets, and move
    `#exit_conversation` after the reply lines at `satoshi.ink:592-605` and `phone.ink:96-99`.
16. **minor · local — Let every debrief route hear about Satoshi.** Divert all Irina branches
    (including `irina_ko_path`, `debrief.ink:160-173`) through `satoshi_aftermath` rather than
    offering it as an optional choice, so the KO and arrest lines always play.
17. **minor · local — Credits name the trader and analyst neutrally.** The KO credit "had done
    nothing wrong" (`erb:151`, `:153`) is good; the spoken credit "Flagged the wallets first"
    only fits a player who reached `trader_suspicions` (`trader.ink:209-212`). Key it on the
    task instead: a new global set from an `objective_task_completed:question_the_trader`
    mapping on HaX, rather than `trader_spoken`, which any closed conversation sets
    (`erb:949-951`). Same for Priya ("Drew the graph", `erb:152`, `question_the_analyst`).
18. **major · needs approval (canon) — The Tesseract lead.** Decide whether the season keeps
    "Dr. Adrian Tesseract, ex-SAFETYNET, HaX's teacher" (season plan
    `quick_reference.md:83`, `:120`; pass-2 sign-off `PASS2_APPROVAL_LOG.md:565`) given the bible's
    "identity unknown, even cell leaders don't know" (`the_architect.md:6`, `:444`) and that
    m07/m08 never pick it up. Options: update the bible and plant one follow-up line in m07 or
    m08; or soften m06's file to an unnamed ex-SAFETYNET strategist so nothing dangles.
19. **minor · needs approval (tooling) — Validator false positive on
    `mutuallyExclusiveGlobals`.** Add it to `known_top_level` in
    `scripts/validate_scenario.rb:247-251`. Affects m02 and m06.
20. **minor · needs approval (tooling) — Two more validator gaps.** Count
    `puzzle_graph_unlocks` on an object's `itemsHeld` (flag-station rewards) when checking locked
    rooms, and treat a `#complete_task` in a phone knot opened by an `npc_ko:<id>` mapping as a
    KO fallback. Both produce false warnings here (§1).

## 6. Ideas for the backlog

For the orchestrator to file in `docs/IDEAS_BACKLOG.md`.

- **Transaction-tracing minigame (shared minigame).** A small graph board: wallets as nodes,
  a mixer as a black box with fee and dwell, and the player links inputs to outputs by amount
  and time. Reusable for any follow-the-money beat (m06, later Crypto Anarchists missions).
  Fix 1 is the paper version that needs no engine work.
- **Keypad residue in the dusting minigame (engine/minigame).** Dusting a PIN pad shows which
  keys are worn or greasy, narrowing the code (a real side channel). Would give the print kit a
  second use and suit Satoshi's safe.
- **Cross-mission state (engine; PASS3 D6 idea, still open).** Carry the asset decision and
  Irina's fate into m07/m08 so their briefings and debriefs can acknowledge them.
- **Flag-station rewards for `emit_event` (UI).** Flags 1 and 2 show only "Event triggered"
  (`flag-station-minigame.js:750-756`, rewards at `erb:1321-1331`). Showing the reward's
  `description` would make each flag feel like a payout.
- **SecGen link between the floor and the backend (SecGen).** Seed one backend account's
  password from Irina's wordlist (`m06_follow_the_money.xml:102-118` currently use
  `jtrpassword.lst`), so the in-game list helps on the VM and teaches custom wordlists.
- **Executive / CEO sprite (art, PixelLab, one at a time).** A suited forty-something founder
  with talk and viseme sheets, for Satoshi and future executives; the hooded-hacker sheet
  (`erb:1615`) reads wrong behind a CEO desk.
- **A trading-floor room (art / room dressing).** The exchange's signature room is a plain
  `room_office`, the same as the lab and the CTO office. A trading-floor background or prop set
  (desk rows, price walls) for `mission-room-dressing`.
- **Validator: debrief reachability (tooling).** Warn when a debrief knot's branch condition
  contradicts the debrief's own trigger condition (m06's `partial_flags`, `minimal_flags`,
  `irina_neutral_path` are unreachable for this reason).
- **Validator and generator: `puzzle_graph_actions` as strings (tooling).** Either accept
  strings in `generate_dungeon_graph.rb:242-246` or warn on them; today they silently produce an
  empty node.
- **Unlock toast shows the raw room id (engine, carried E-toast).** `chat-helpers.js:70-71`;
  show `door_sign` instead.

## Changes made (pass 4 design)

Implemented 2026-10-02 by the pass-4 design agent. Mission-local files only (erb, the seven
ink files and their compiled JSON, TESTING_WALKTHROUGH.md, this file, PASS4_PLAYTEST.md), plus
m06's own `globals` entry in `scripts/ink_runtime_check/missions.json` (three new globals, so
reopencheck exercises them). Static checks only; no browser playtest yet.

| Fix | Status | Notes |
|---|---|---|
| 1 Follow-the-money puzzle | **Done** | The fund document now sits inside a PIN-locked **Custody Console** in the data centre (`cold_storage_console`, slot **4471**, new task `identify_fund_wallet`, `unlock_object`). Clues: Priya's write-up has three ENTROPY deposits into the mixer, each with an amount and a UTC time, and the method; the transaction server has `mixer_settlements.log` (mixer credits into six cold slots), `mixer_pool_config.yml` (`fee_percent: 1.5`, `min_dwell_hours: 6`) and `custody_index.csv` (neutral labels). Slot 4471 takes all three deposits less 1.5%, each more than six hours later. Each deposit has one decoy (too early, or no fee taken), so amount-only matching still points to 4471 three times and timing confirms it. Nudges: Priya's sticky `mixer_matching`, HaX's text on first entering the data centre, HaX's sticky hub option "Which cold slot is the fund?" with three graded hints (`fund_hint`), and a recap line. Answer-giving text removed: the fund address and balance are gone from the daily report, Priya's write-up and her `source_identification` line; the index has no balances and no address-to-slot mapping; the recovery keys list slots, not names; the fund's address appears only inside the console. Chose a 4-digit PIN over a password: no case-sensitivity trap (the server compares passwords exactly, `game.rb:960`), and a pc PIN lock is proven in m07 (`badge_printer`). |
| 2 FCA letter in the debrief | **Done** | `fca_letter`: three picks from nine (seven real findings from tonight, two non-findings with a one-line correction each), then a verdict by count. Replaces `all_flags_complete`'s generic lines. |
| 3 A turned Irina gives something | **Changed approach** | She *tells* the player rather than handing an item: the fund's slot if the fund isn't found yet (sets `irina_gave_slot`, read by the debrief and credits) and Satoshi's safe code if the safe isn't open. Why not an item: anything in her `itemsHeld` drops on a KO, a dropped `text_file` is readable but not takeable (E20), and E22 restores given items on reload, so a KO would have handed the slot to the violent route. HaX's recap repeats both tells. A detained Irina gives nothing. |
| 4 Unreachable debrief branches | **Done** | `partial_flags`, `minimal_flags`, `irina_neutral_path` and their diverts removed. |
| 5 Flag 4 before the climax | **Done** | Flag 3's text asks for the vault account before going upstairs; a once-only HaX text on entering the executive wing without flag 4; recap line while flag 3 is in and flag 4 isn't. The defer route stays as the backstop. |
| 6 Money-story logic and freeze wording | **Done** | (a) The watch branch says the payout is pre-signed and his arrest stays quiet until it has gone (`handler_recommendation`, debrief `satoshi_aftermath`); the fund document now carries the pre-signed release line. (b) "before the police took the building" and "before she was taken in" removed. (c) "Sweep into cold storage" replaced with moving the coins into a wallet SAFETYNET holds (Satoshi, phone KO choice, credit, recovery keys); flag 4's text says whoever holds the keys holds the money. |
| 7 Backend host names | **Done** | Rack sheet lists `hc-findb-01` and `hc-vault-01` and says the financial database account drives the doors; export header `hc-findb-01`; vault named `hc-vault-01`; aim 3 description, HaX text and recap agree. In-game text only; nothing SecGen must match. |
| 8 Wordlist has one job; cracking guide on the terminal | **Done** | Wordlist observation and graph edge now point at the server-room door; `cracking_guide_offered` moved to the vm-launcher mapping, whose text now offers it; the wordlist text no longer offers it. |
| 9 Graph metadata | **Done** | `puzzle_graph_actions` as objects; the fake lock on Priya's write-up replaced by real clue edges to the console (write-up, settlement log, pool config); clipping feeds the safe. |
| 10 Briefing length | **Done** | 13 knots / 342 lines → 7 knots / 113 lines (4.8 KB; m01 is 7.6 KB). Every route passes `cover_story`; kit line and "two calls" kept. |
| 11 Early-KO wobbles | **Done** | Satoshi's fund opener needs `found_architects_fund`; `evidence_reveal` has a no-fund line; a second Irina-KO text for a player who never finished a conversation with her (split on `exchange_infiltrated`); the debrief's research-note line depends on `read_irina_notes`. |
| 12 Fingerprint kit | **Not done** | Forced here. The only natural surface is Satoshi's office, which already holds the climax and the optional safe; a lore drawer adds a step with no decision. m04 and m05 both use the kit, so it isn't idle across the arc. Backlog idea below. |
| 13 Point at the blockchain lab | **Done** | HaX's text after first meeting Irina points east to the analysts; aim 2 description names the lab; recap line until the write-up is taken. |
| 14 Debrief notices how you got in | **Done** | `irina_how_you_worked_her`: one line for clone vs lend, one for reading her notes. |
| 15 Convention clean-up | **Partly done** | `#exit_conversation` moved after the reply line (phone first call, hub exit, two more phone exits; Satoshi `aftermath`). `You:` echo lines and menu-label brackets left for the dialogue pass, as instructed. |
| 16 Every debrief route hears about Satoshi | **Done** | All Irina branches (KO included) go through `satoshi_aftermath`; the optional choices that skipped it are gone. |
| 17 Trader and analyst credits | **Done** | New globals `trader_heard_out` / `analyst_walked_through` set from `objective_task_completed` mappings; the specific credit needs them, and a player who only said hello gets a neutral line. |
| 18–20 | **Not done** | Left to the orchestrator as instructed (canon, validator). |

**Checks run (all pass).** `bin/inklecate` on all eight ink files (no warnings); `ruby
scripts/validate_scenario.rb` (schema passed, 0 invalid; warnings are the intended co-fire pairs
plus two new intended ones on `room_entered:data_center` and `room_entered:executive_wing`, and
"2 items point to server_room", which is the checklist and the wordlist, two halves of one clue);
`python3 scripts/check_door_alignment.py` (8/8 OK); render with `tools/pass2/render.rb` plus
assertions on the console, its contents, the puzzle arithmetic, no slot or fund address in the lab
or trading floor, the new task, globals and mappings; inkcheck and loopcheck on every ink over
ten states (fresh; write-up + flag 3; turned early with the slot; turned, detained and KO'd after
the fund; Satoshi KO; both endings with all flags); `reopencheck.mjs … m06` 0 problems; tagdiff
(every difference is one of the fixes above).

**Spoken lines.** About 95 lines added or changed: briefing ~23 (rewritten), debrief ~28, phone
~24, analyst 7, Irina 3, Satoshi 2, HaX timed texts 9 (6 changed, 3 new). m06 audio isn't
generated yet.

### Round 2 (DESIGN_REREVIEW_1.md and tools/playtest/m06-pass4-report.md)

| Item | Status | Notes |
|---|---|---|
| M1 asset choices need the fund | Done | Satoshi `choice_presentation` / `strategic_explanation` and phone `satoshi_ko_choice`: freeze needs fund + keys, watch needs the fund; without the fund only "Not yet. I'll find your wallet first." (sets `asset_decision_deferred`). HaX texts for the no-fund wing entry and the no-fund defer; recap line. The debrief's no-fund branch, the two no-fund evidence knots and the "LOCATED" credit are removed (unreachable now). |
| M2 custody index 50/50 | Done | Column is now `opened_by` with no pattern (4471 is `ops`; four slots are `CEO`). Two more slots (5093, 8846) and four noise credits; 5093 takes $2,346,000 after the hold, which rewards doing the 1.5% properly. The three decoys are unchanged. |
| M3 turned Irina (orchestrator decision) | Done | She narrows (not 6120; nothing inside her six-hour hold) and gives the safe code. Once the settlement log is picked up (`read_settlement_log`), "Check a slot for me" lists the slots in the log; she confirms 4471 (`irina_confirmed_slot`, credit "TRACED, CONFIRMED BY VOLKOVA") and sends the player back to the cut and the hold for any other. She never says the number. |
| m1, m2 | Done | Via M1. |
| m3 / report 1 | Done | Debrief KO path branches on `exchange_infiltrated`; the research note is cited only if read. |
| m4 / report 2 | Done | Two data-centre texts: the default no longer says "ask me"; the turned-Irina variant says to run the slot past her. |
| m5 | Done | Times marked UTC; "since January"; log title says credits over $100,000; the index lists cold slots only; console and HaX say "slots", not "six". |
| m6 | Done | Credit rewritten, no trailing spaces. |
| m7 | Done | `mixer_matching` completes `question_the_analyst`. |
| m8, m9 | Done | Vanity-wallet line and notes line reworded. |
| m10 | Done | Every line I added or touched is under the lint cap (briefing lines split, HaX texts shortened, ladder lines short). The 12 remaining lint errors are pre-pass lines for the dialogue stage. The lab pointer moved from the Irina-close text to its own short text. |
| Report 3 doubled lines | Done | The freeze line in `cell_disruption` no longer repeats "short of money"; the closing recap drops the fund and custody repeats; on watch, Satoshi is "detained… the police have him, and nobody outside that van knows it yet", and the aftermath no longer says "off the books". |
| Report 4 hub | Done | Order: Satoshi-KO decision, relays, "Which cold slot is the fund?", "Remind me where we are.", story beats, guides, early topics, exit. Story beats retire once the story passes them; password and blockchain tips retire after flag 1 / the write-up; "Got any general advice?" and its two sub-knots are cut. |
| Report 5 puzzle feel | Done | Priya states the principle. HaX's data-centre text and recap no longer restate the method. The ladder: 1 the method in one line, 2 "Start with the biggest deposit and look for it less the fee, six hours on.", 3 near-answer without the number. |
| Report 6 reload | Not a mission setting | The Mission Brief popup is `show_scenario_brief: "on_resume"` (`erb:86`), which m01, m02, m03, m05 and m08 also use (`helpers.js:11`); left as is. The return to `reception_lobby` is engine behaviour (the client chooses the spawn room; the server stores `currentRoom`), not an m06 setting. |

**Checks (round 2, all pass).**
- **Compile:** all eight inks.
- **Validator:** schema passed, 0 invalid. The co-fire pairs are intended: the data centre and executive wing each have the `debrief_played` backstop and two disjoint texts.
- **Doors:** 8/8 OK.
- **Render asserts:** round 1 plus the puzzle arithmetic recomputed from the rendered log, which gives 4471 as the only slot that fits all three deposits. Also: no CEO pattern on 4471, every log slot is in the index, no "LOCATED" credit and no padded credits.
- **inkcheck/loopcheck:** every ink over 11 states, including Irina turned with the log, turned after the fund, detained, KO before meeting, and Satoshi KO with and without the fund.
- **reopencheck:** 0 problems.
- **tagdiff:** every difference is one listed above or in round 1.
- **dialoguelint:** no errors on touched lines.

The m06 block of `missions.json` now lists `irina_confirmed_slot` and `read_settlement_log`; `irina_gave_slot` is gone.

**Spoken lines, round 2:** about 40 changed or added (Irina 8 incl. slot check, phone ~12, debrief ~10, Satoshi 3, Priya 4, HaX texts ~10 shortened or new).
