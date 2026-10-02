# m06 Follow the Money — Alignment & Advancement Plan

> Renamed 2026-10-01: CTO ids elena → irina to match Dr Irina Volkova (NPC id `elena_volkov` → `irina_volkova`; ink `m06_npc_elena_volkov.*` → `m06_npc_irina_volkova.*`; room `elena_office` → `irina_office`; globals, tasks, knots and VARs `elena_*` → `irina_*`, e.g. `meet_elena` → `meet_irina`, `decide_elena_fate` → `decide_irina_fate`, `topic_elena` → `topic_irina`). Old ids below are historical.

> Produced by the mission-alignment-plan skill. 2026-08-24. Plan only when written; since implemented (see Progress below). Measured against: m01_first_contact, m02_ransomed_trust, m05_insider_trading. Reviewed: 1 round (reviewer returned 4 additional blockers, all folded in).

## Progress (updated 2026-10-01)

Status: Phases 1-7 implemented, apart from the checkpoint guard noted below, in `6bd77d41` (2026-08-31), reworked in pass 2 (`e15e0889`) and adjusted in `7df3596a`. Played to `status=completed` in four games.

- Done: completability wiring, aim staging with the `bond_visualiser` conclusion, music block, progress-gated HaX hub, and the Phase 7 artefacts (README, dungeon graph, `TESTING_WALKTHROUGH.md`, `VM_INTEGRATION.md`).
- Open Decision 1 was settled by renaming the CTO to Dr Irina Volkova (`7df3596a`; ids and the ink file name unchanged), not by the Marcus Lee swap the plan recommended.
- Changed by pass 2: Satoshi never appeared (his reveal events fire before his room loads), so he is now simply visible. The data-centre PIN (3110) is the flag-3 reward, so the VM work gates a physical door. KO reactions key on `npc_ko:<id>`. The debrief waits for the last decision, all four flags and a closed UI, and the new `hear_debrief` task keeps the credits behind it. The $847,000 is now the Architect's outbound acquisition budget, matching m05. Cover is FCA, and SAFETYNET detains instead of arresting.
- Open: the SecGen flag order (hcauth, hcledger, hcfindb, hcvault) is inferred from the XML and not confirmed by a build. Per `scenario.json.erb` there is no checkpoint security NPC (Phase 4, Open Decision 8) and the CEO is still "Satoshi Nakamoto II" (Decision 2). No pass 2 source records Open Decisions 4-8 as settled.
- Latest playtest: games 1173 and 1174 (`tools/playtest/m06-pass2-report.md`) and confirmation games 1175 and 1176 (`m06-pass2c-report.md`) all reached `status=completed`, with no new defects. The regression run (game 1191, 2026-10-01, `m06-regress-report.md`) was not played to the end; it found the HaX first call replaying after a reload because NPC ink variables were not saved. The approval log lists that persistence as implemented, and no re-run of the check is recorded.

## Executive summary

m06 has a lot of finished-looking material — 3,700 lines of ink across seven files, a nine-room layout with clean geometry, a lock spread that maps sensibly to the brief — sitting on top of wiring that does not work. The mission **cannot currently be completed**: Satoshi never spawns, the four VM flag tasks can never register, three collect-item tasks all target the same generic item type, and the two moral-choice tasks have no completion mechanism at all. On top of that it has no music, no aim staging, no conclusion screen, no KO fallbacks, no hostiles, and a cast whose two lead names collide with canon.

The biggest levers, in order: fix the completability wiring (Phase 1–2), settle the Elena Volkov canon collision (it reaches outside this mission into `season_1_arc.md` and the M10 hook), and rebuild Agent HaX's hub on the m02 progress-gated pattern with field guides that actually match the VM.

## Current-state assessment

Validator baseline (`ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb`, confirmed independently by both agents): directory/ERB/JSON/schema pass; 3 unknown-field warnings (`data_center.objects[3].badgeId`, `satoshi_office.objects[1].code`, `satoshi_office.npcs[0].behavior.appearsOnEvent`); 6 ink findings (`#give_item:password_list` ordering + no matching `itemsHeld` entry; speaker prefixes `Elena:` ×61, `Trader:` ×48, `Analyst:` ×79, `Satoshi:` ×99 matching no `displayName`). `python3 scripts/predict_door_sides.py`: 9 rooms, no overlaps, no door-corner collisions.

Compiled ink is **valid** (7 files, 8.7–19 KB, `inkVersion 21`) — they are single-line files, which is why `wc -l` reports 0. But sources are dated 2 Mar and compiled JSON 23 Aug, so source/compiled drift must be checked before any recompile.

| #   | Dimension                         | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Gap                 | Target end-state                                                                                                                                                                                                    | Anchor                                                                                                                                                                                      |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Canon & stakes**                | Leader "Satoshi Nakamoto II" is invented; canon is **Satoshi's Ghost** (`story_design/universe_bible/03_entropy_cells/crypto_anarchists.md`). CTO "Dr. Elena Volkov" is canonically **"Margin Call", a Digital Vanguard operative** (`03_entropy_cells/digital_vanguard.md`) — a direct collision. Manifesto is unchallenged zero-casualty rhetoric; the 180–340 casualty projection already exists in the fund document text but nothing forces the player past it.                                                                                                                                                                                                                                                                                                                                  | **Blocker** (canon) | Canon names; the fund document read as a signed-off line item that breaks the manifesto in the confrontation. Note: the casualty figure is already in the data — this is a dialogue/staging job, not a data change. | `scenarios/m01_first_contact/` Lawson monologue; `scenarios/m02_ransomed_trust/` per-hour fatality projection; `02_organisations/entropy/philosophy.md` §Propaganda vs. Operational Reality |
| 2   | **Aims & staging**                | 5 aims, 4 `active` at t=0. No `unlockCondition`, no `missionConclusion`, no `requiresCompleted`, no `conclusionScreen`. Aim 5 title reads "Decide Elena Volkov's fate: Recruit or Arrest" — full spoiler. Titles are noun-phrases.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Blocker**         | Sequential `unlockCondition: { aimCompleted: … }`; action-first spoiler-safe titles; final aim `missionConclusion: true` + `conclusionScreen: { "type": "bond_visualiser" }` + `requiresCompleted`.                 | `scenarios/m05_insider_trading/scenario.json.erb:364-366`                                                                                                                                   |
| 3   | **Agent HaX hub**                 | `support_hub` exists (`ink/m06_phone_agent_0x99.ink:67`) but gates on 3 local `*_hint_given` vars only — no progress globals, no reactive topics, **zero** field guides (`#give_item:lab-workstation:*` appears 0 times). `[I'm good for now]` fires `#exit_conversation` then `-> support_hub` (dead-end loop). Handler still called "Agent 0x99" in prose.                                                                                                                                                                                                                                                                                                                                                                                                                                          | **Major**           | m02-shaped hub: topics gated `{<state> and not <topic>_discussed}` on real globals; exposure-gated guide offers; naming aligned to "Agent HaX".                                                                     | `scenarios/m02_ransomed_trust/ink/m02_phone_agent0x99.ink:101`                                                                                                                              |
| 4   | **Ink craft**                     | 287 lines will render as literal text inside the previous speaker's bubble (4 broken prefixes). Asterisk stage directions instead of narrator voice. Choices are mostly `[Got it, thanks]` info-taps. `arrest_attempt` is scripted CYOA combat. `#set_variable` where house style is `#set_global`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Major**           | Prefixes match `displayName` exactly (or `Narrator:`/`You:`); stage directions → narrator lines; first-person consequential choices; arrest via `#hostile` + engine KO.                                             | `README_ink_best_practices.md`; `scenarios/m05_insider_trading/ink/m05_torres_confrontation.ink`                                                                                            |
| 5   | **Moral choices & consequences**  | Branch globals are set and the debrief branches on them (`m06_closing_debrief.ink:148/188/224`), but the debrief is reached via four `eventMappings` all on `start`+`onceOnly` — first branch to fire wins, possibly mid-mission, possibly twice. No bond_visualiser. Choices framed as policy trade-offs, not lives. **And the two choice tasks are `type: "custom"` with no completion mechanism at all.**                                                                                                                                                                                                                                                                                                                                                                                          | **Blocker**         | One deterministic debrief trigger on the conclusion task; the two choice tasks wired to flip off the ink globals; seize-vs-monitor reframed against the casualty count; bond_visualiser.                            | `scenarios/m02_ransomed_trust/` consequence layer; m05 `confront_insider`                                                                                                                   |
| 6   | **Music**                         | No `"music"` block. Silent mission.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Major**           | m05-shaped `music.events`: briefing/resume, noir on briefing close, spy-action on fund discovery, threat on hostility, victory + credits on debrief.                                                                | `scenarios/m05_insider_trading/scenario.json.erb:49-95`                                                                                                                                     |
| 7   | **Rooms & layout**                | Geometry clean. But **zero guards, patrols or hostiles anywhere** (0 grep hits vs 8/9/5 in m01/m02/m05). `security_checkpoint` is an empty `hall_1x2gu` despite the mission premise being cover-identity infiltration. The `bitcoin2024` credentials note sits **inside** `server_room`, the room that lock opens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Major**           | Security presence at the checkpoint (the natural evade space) rather than a corridor patrol bolted on; credentials note relocated; `room_ceo` for `satoshi_office`.                                                 | `README_scenario_design.md` §Room Layout / §Designing Solvable Scenarios; `scripts/predict_door_sides.py`                                                                                   |
| 8   | **Mechanics, education & guides** | Lock spread is good (password / rfid ×2 / pin). But `code` and `badgeId` are **unsupported fields** (confirmed: zero references in `app/`, `lib/`, `public/break_escape/js/`) so the PIN safe and badge binding are inert — pin locks use `requires`. `flagRewards` use `emit_event` while the handler listens on `global_variable_changed:flagN_submitted` → hint tree dead. All four `submit_flags` tasks lack `targetFlags`/`targetCount` → can never complete. Three `collect_items` tasks all target `targetItems: ["notes"]` against ~10 note objects → any one note completes all three. `acceptsVms: ["hackme_crack_me_lab"]` conflicts with `mission.json`'s `secgen_scenario: "hackme_and_crack_me"`. `found_password_lists`/`exchange_infiltrated` declared, never set. Zero field guides. | **Blocker**         | See Phase 1. Guides must match the VM — see the mismatch note below.                                                                                                                                                | m05 `scenario.json.erb:305-336` (`targetFlags`), `:885+` (`set_global`), `:531-560` (guide `itemsHeld`)                                                                                     |
| 9   | **KO resilience**                 | **Zero** `taskOnKO`/`globalVarOnKO` (m05 has 6, m02 has 4). Four NPCs gate progress by conversation. KO any → mission dead. Compounded: the CTO badge is `takeable: false` in `elena_volkov.itemsHeld` with **no `rfidCard` block on the NPC**, so `elena_office` is unopenable even without a KO and the trading-floor `rfid_cloner` is inert.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Blocker**         | KO fallbacks on every progress-bearing NPC; gating items obtainable without conversation; full `npc.rfidCard` + matching `itemsHeld` clone per the m03 pattern.                                                     | `scenarios/m05_insider_trading/scenario.json.erb` KO wiring; `scenarios/m03_ghost_in_the_machine/scenario.json.erb:415-425, 727-740` (rfidCard)                                             |
| 10  | **Bookends**                      | Opening is a walk-up lobby NPC — no `timedConversation`, no `skipIfGlobal`, no background. Closing debrief exists but with the four-way race above and no visualiser.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Major**           | Auto-playing cutscene briefing with `skipIfGlobal: briefing_played` + `setGlobalOnStart` + HQ background + `taskOnKO`; single-fire debrief → victory music → credits → bond_visualiser.                             | m05 `scenario.json.erb:506-512`                                                                                                                                                             |

## Target end-state

A Tier-2 mission that opens on an HQ-background cutscene briefing and drops the player into HashChain Exchange under a FinCEN compliance-audit cover, with five aims unlocking in sequence under spoiler-safe titles. Agent HaX is a live, progress-aware presence: topics surface only once the player has met the thing being discussed, and field guides only once the matching obstacle has been hit. The exchange has security who can be evaded, talked past, or dropped — and every KO leaves a route to completion.

The cell is canon. The manifesto's zero-casualty framing is present and then broken by a fund allocation document that prices a named operation against 180–340 projected deaths with sign-off up the chain — the m01/m02 pattern of ENTROPY as classic villains who have read philosophy. Seize-vs-monitor stops being a policy toggle: keeping the wire live means letting money reach cells that have already filed the body count as a line item.

Four cracked flags each set a real global, each earns a handler reaction, and each gates the conclusion. The mission ends on a single event-driven debrief that branches on what the player actually did, then credits and the `bond_visualiser`.

## Phased plan

Run `ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb` after every phase. Run `bash scripts/compile-ink.sh` after every ink edit.

### Phase 0 — resolve the two blocking unknowns

Before any wiring. **Files:** `mission.json`, `scenario.json.erb` (read only).

- Settle the VM key: `acceptsVms: ["hackme_crack_me_lab"]` vs `mission.json`'s `secgen_scenario: "hackme_and_crack_me"`. `flags_for_vm` keys off the SecGen system name, so one is wrong and in Hacktivity mode the station gets no flags. Determine the correct key and the correct `targetFlags` id format (m05 uses station-qualified `"qdc_research_server:flag_1"`, not raw `flag{…}`).
- Check ink source/compiled drift (sources 2 Mar, compiled 23 Aug) before any recompile can silently revert work.
- Resolve Open Decision 1 (Elena Volkov), since Phase 3's blast radius depends on it.

**Acceptance:** VM key and flag-id format written down; drift confirmed or reconciled.

### Phase 1 — make it completable

**Files:** `scenario.json.erb`

- `flagRewards`: `emit_event` → `set_global` (`flag1_submitted`…`flag4_submitted`).
- Add `targetFlags` (format per Phase 0), `targetCount: 1`, `currentCount: 0`, `showProgress: true` to `submit_flag1..4`.
- Give the three `collect_items` tasks distinct targets — id-based or distinct item types. `targetItems: ["notes"]` on all three against ~10 notes is why aim staging cannot work.
- Replace `satoshi_nakamoto.behavior.appearsOnEvent` with a supported reveal (`eventMappings` + `setGlobal`, or place him behind the `executive_badge` rfid door from the start). Gate the confrontation's substance on an evidence check inside the ink so a pre-evidence arrival isn't hollow.
- Fix the RFID chain properly: add `npc.rfidCard {card_id, rfid_protocol, name}` to the CTO plus the matching `itemsHeld` clone (m03 pattern). A `badgeId`→`key_id` rename alone leaves `elena_office` — and the Architect email inside it — unreachable.
- `code: "2140"` → the supported `requires` field on the pin lock.
- Move the `bitcoin2024` credentials note out of `server_room`.
- Wire `decide_*` custom tasks to complete off the ink choice globals.
- `taskOnKO` + `globalVarOnKO` on `opening_briefing_npc`, the CTO, `blockchain_analyst`, `trader_npc`, `satoshi_nakamoto`; make the badge and password list obtainable from a KO'd body.
- Set or remove the orphan globals `found_password_lists`, `exchange_infiltrated`.

**Acceptance:** `walkthrough-scenario` yields an end-to-end critical path; four KO-variant paths all still reach the conclusion; no unknown-field warnings. **Verify:** `validate-scenario` → `walkthrough-scenario` → `break-escape-dungeon-graph`.

### Phase 2 — objective staging & conclusion

**Files:** `scenario.json.erb` (objectives block)

- Action-first titles; spoiler-safe rewrite of the two decision aims.
- `unlockCondition: { aimCompleted: <prev> }` on aims 2–5; aims 2–5 `status: "locked"`.
- Final aim: `missionConclusion: true`, `conclusionScreen: { "type": "bond_visualiser" }`, `requiresCompleted` = the 4 flag tasks + `confront_satoshi` + the choice tasks (only genuinely mandatory ids — over-tightening soft-locks the conclusion).
- m05-style `objective_task_completed:*` → `setGlobal` bridges on the handler.

**Acceptance:** no aim visible before its prerequisite; exactly one `missionConclusion`; every `requiresCompleted` id resolves; the mission still completes (the choice tasks from Phase 1 must flip, or this phase regresses Phase 1). **Verify:** `validate-scenario` + `scenario-design-review`.

### Phase 3 — canon rename & stakes escalation

**Files:** `ink/m06_npc_elena_volkov.ink` (rename), `ink/m06_satoshi_confrontation.ink`, `ink/m06_closing_debrief.ink`, `ink/m06_opening_briefing.ink`, `ink/m06_phone_agent_0x99.ink`, `scenario.json.erb`, `README.md`, **and** `planning_notes/overall_story_plan/season_1_arc.md` (lines ~568, ~581, ~1207) + `quick_reference.md` (~87).

- Apply Open Decision 1 and 2. If renaming: Satoshi Nakamoto II → Satoshi's Ghost; Elena Volkov → Marcus Lee / "Mixer", globals `mixer_recruited`/`mixer_arrested` keeping branch topology.
- **Campaign docs must move with the rename** — `season_1_arc.md` names Elena Volkov as M6's recruitable cryptographer with a return in M10. Leaving them stale orphans the M10 hook. Both files are already dirty in git; coordinate before editing.
- Rewrite the confrontation so the player can put the fund document in front of Satoshi's Ghost, and Mixer names what the money buys. The 180–340 figure is already in the document text — this is staging, not data.
- Rename in one commit, grep for stragglers, recompile all seven ink files.

**Acceptance:** no "Elena Volkov" / "Nakamoto II" outside README history; campaign docs consistent; names match `crypto_anarchists.md`. **Verify:** `npc-dialog-review`.

### Phase 4 — ink craft pass (includes the guard NPC)

**Files:** all `ink/*.ink`, `scenario.json.erb`

- Fix the four speaker prefixes; `#set_variable` → `#set_global`; fix `#give_item:password_list` ordering + add the `itemsHeld` entry; asterisk stage directions → `Narrator:` lines; replace acknowledgement-only choices; fix the `#exit_conversation` → `-> support_hub` dead-ends.
- **Add the security NPC here, not in Phase 6** — Phase 4 writes the `#hostile`-based arrest beat, so the hostile NPC must exist in the same phase or the mission is untestable between 4 and 6. Put it at `security_checkpoint`, the natural evade space given the cover-identity premise, rather than a corridor patrol.

**Acceptance:** validator ink section clean; `npc-dialog-review` finds no flat-choice hubs on the confrontation; the arrest beat resolves through engine KO. **Verify:** `npc-dialog-review`, `validate-scenario`.

### Phase 5 — Agent HaX hub & field guides

**Files:** `ink/m06_phone_agent_0x99.ink`, `scenario.json.erb`, possibly a new lab sheet in `HacktivityLabSheets`.

- Rebuild `support_hub` on the m02 gating pattern: per-topic `*_discussed` latches against real progress globals (`found_blockchain_evidence`, `found_architects_fund`, `flag1..4_submitted`, evidence level), flag reaction topics, and a moral sounding-board.
- **Resolve the guide/VM mismatch first.** The VM is hackme-and-crack-me — offline hash cracking (john/shadow). The proposed `ssh-access-and-bruteforce.md` is online Hydra against the M2 hospital box with hospital-specific worked examples; it does not fit. All four named sheets exist under `_labs/safetynet/`, but no offline-cracking sheet does (only `privilege-escalation.md` mentions john/hashcat/shadow). Either write a new sheet or swap in `privilege-escalation` and re-scope. `reconnaissance-and-network-mapping`, `rfid-cloning` and `information-leakage-and-the-pin-oracle` all map cleanly and stand.
- Add the guides as `lab-workstation` `itemsHeld` on the handler with `key_id` + `labUrl`; `eventMappings` set `<x>_guide_offered` on first exposure to the matching obstacle.

**Acceptance:** no guide offer before its obstacle; every `#give_item:lab-workstation:<key>` resolves against an `itemsHeld` entry; every guide matches something the player actually does on the VM. **Verify:** `validate-scenario`, `npc-dialog-review`.

### Phase 6 — music & bookends

**Files:** `scenario.json.erb`, `ink/m06_opening_briefing.ink`, `ink/m06_closing_debrief.ink`

- Add the `music` block (copy m05's structure verbatim, including the credits block, and adapt text — it is long and easy to malform).
- Opening → `timedConversation` delay 0 + `skipIfGlobal: briefing_played` + `setGlobalOnStart` + HQ background + `taskOnKO`.
- Collapse the four debrief `eventMappings` to one mapping on a single `mission_complete`-style global.

**Acceptance:** music shifts on briefing close, fund discovery, hostility, debrief; briefing does not replay on reload; debrief fires exactly once, at the end. **Verify:** `scenario-design-review`, manual play.

### Phase 7 — docs & new artefacts

**Files:** `README.md`, **new** `dungeon_graph.md`/`.html`, **new** `TESTING_WALKTHROUGH.md`

- These do not exist yet — they are new documents, not regenerations. m05's walkthrough is substantial; budget for it.
- README: update to shipped design, drop the stale "Implementation Pending" status and obsolete checklist, move the plaintext PIN (2140) out to the walkthrough as m02 does.

**Acceptance:** m06 directory shape matches m05. **Verify:** `break-escape-dungeon-graph`, `walkthrough-scenario`.

## Canon & lore alignment

- **Cell:** Crypto Anarchists / HashChain is canonically "the bank — the settlement and laundering layer" for the organisation (`02_organisations/entropy/overview.md` §3). The mission's thesis is sound; only the personnel are invented.
- **Leader:** `03_entropy_cells/crypto_anarchists.md` — Satoshi's Ghost, possibly Andrew Wolff, "still believes in original cryptocurrency ideals — conflicted about pure profit motive". A better confrontation hook than the current smug CEO.
- **The conflicted asset:** same file — "Mixer" / Marcus Lee, "genuinely supports privacy; struggles with enabling crime". Already the recruit-or-arrest archetype this mission wants.
- **Name collision:** Dr. Elena Volkov is "Margin Call" of Digital Vanguard (`03_entropy_cells/digital_vanguard.md`), cold and analytical, "sees companies as numbers rather than people" — the opposite of m06's warm recruitable CTO.
- **Escalated doctrine:** `02_organisations/entropy/philosophy.md` §Propaganda vs. Operational Reality is explicit that the zero-casualty claim is a lie the organisation finds useful. m06 currently presents the propaganda unchallenged; the fund document is the thing that must break it.
- **Moral placement:** sympathy at the edges, coldness at the top. Mixer and the trader/analyst carry the moral weight; Satoshi's Ghost is a fanatic to take a stance against, not to negotiate with.
- **Architect setup:** the Dr. Adrian Tesseract 87% file is consistent with the M9 setup — keep, but check `story_design/lore_fragments/the_architect/` before finalising wording.

## Open decisions for the user

1. **Elena Volkov: rename or retcon?** Swap to canon Marcus Lee / "Mixer" (recommended), or keep the name and add a bible entry reconciling her with Digital Vanguard's "Margin Call". Mutually exclusive. **This blocks Phase 3** and reaches into `season_1_arc.md` and the M10 return hook either way.
2. **"Satoshi Nakamoto II" vs "Satoshi's Ghost".** The alias joke is decent; canon is canon. Rename, or add the alias to `crypto_anarchists.md`.
3. **How dark does the fund document go?** (a) aggregate "180–340 projected"; (b) itemised per-cell figures with a signature; (c) itemised plus a named target population (hospital network, dispatch grid) echoing m02/m05. (c) hits hardest and best matches the bible; (b) is the safe middle.
4. **Is monitoring defensible?** If the casualty count is signed off, "keep the wire live for intelligence" is a choice to let people die for information. Either accept that and let the debrief say so, or add a partial-seize third option — but don't leave it a neutral policy toggle.
5. **Does Satoshi's Ghost escape?** `crypto_anarchists.md` mentions a "HashChain shut down, Satoshi's Ghost escapes" outcome. Player-determined, always-escapes (preserves him for later missions), or always-arrested?
6. **Does a turned Mixer persist into M7/M9?** If so it needs a campaign-level global — beyond this mission's scope.
7. **Field-guide gap.** Write a new offline-cracking lab sheet for the hackme-and-crack-me VM, or swap in `privilege-escalation.md` and re-scope? (Reviewer confirmed `ssh-access-and-bruteforce.md` does not fit this VM.)
8. **Security presence.** Checkpoint guard (recommended — closes rubric 7 and gives the `threat` music cue something to fire on), or keep the exchange a soft target and lean on cover-blown tension?

## Risks & regressions to guard

- **Ink source/compiled drift** — sources 2 Mar, compiled 23 Aug. Verify before recompiling or Phase 3/4 will silently revert unknown work.
- **Rename blast radius** — `elena_volkov` is an NPC id, a filename, ink VARs, globals, objective text, and two campaign planning docs. One commit, then grep.
- **Phase 2 can regress Phase 1** if `requiresCompleted` lists the choice tasks before they have a working completion path. Phase 1 must land that wiring.
- **Phase 4/6 ordering** — the hostile arrest branch and the hostile NPC must ship together (why the guard moved into Phase 4).
- **`targetFlags` indexing is silent when wrong.** Validate against the rendered JSON, not the ERB.
- **VM key mismatch** (`hackme_crack_me_lab` vs `hackme_and_crack_me`) — standalone mode falls back gracefully, Hacktivity mode does not.
- **`appearsOnEvent` removal** changes when Satoshi is reachable; gate on the badge *and* an in-ink evidence check.
- **Music credits block** is long and malform-prone; copy m05 verbatim.

## Verification plan

1. `ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb` — after every phase; target zero ❌ and zero unknown-field ⚠️.
2. `bash scripts/compile-ink.sh` — after every ink edit, then re-validate.
3. `python3 scripts/predict_door_sides.py` — only if connections change.
4. **break-escape-dungeon-graph** — after Phase 1 and Phase 7.
5. **walkthrough-scenario** — after Phase 1 and Phase 6; reconcile against the graph.
6. **scenario-design-review** — after Phase 2 and Phase 6.
7. **npc-dialog-review** — after Phases 3, 4 and 5; pass condition is "do the choices matter", not compile-clean.
8. Manual play: four KO-variant runs (briefing NPC, CTO, analyst, Satoshi) must each reach the conclusion; one clean run confirming music transitions, guide gating, and the bond_visualiser.
