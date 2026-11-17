# m06 office life: handover (plan phase, stage 0 done, stage 1 in progress)

Branch `plan/ol-m06`, worktree `.claude/worktrees/p-ol-m06`, base main `3e00651a8`. Plan phase only: no build, no servers.

## Done

- Stage 0 baseline files in this folder:
  - `validator_info_lines.txt` (validator: 0 errors; warnings are music `comment` fields and onceOnly-overlap wiring warnings on `agent_0x99_handler`, all pre-existing).
  - `v1_summary_base.txt` (11 NPC records, none with needs).
  - `baseline_locks.json` (13 lock nodes, 0 gates).
  - `positions_base.txt` (39 rows).
- Not yet written: `BASELINE.md`, `ANALYSIS.md`, `PLAN.md`, the TTS office-lines count (V6). Env for rake/validator from this worktree: `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`.

## Findings so far (for ANALYSIS.md)

- No `gameClock`; `npcThoughts: false`; `disableAttacks` not set; `officePresets` not set.
- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:341` and `:629` already set m06's intended scope: Tier 2 in existing rooms; declare the floor's coffee point, copier and every same-image monitor twin; Dani and Priya posted and leashed with screen and print habits on their own PCs (the first openings); a seen-only cake magnet that draws Dani or Priya from a desk and opens a screen-habit window (first lever with a payoff; needs a hunger source or tempt band, `cake_servings` global, an in-world source for the cake; non-monotonic global, sync note required, `:660`); print-and-forget with fetch errands; one or two Dani and Priya exchanges; desk-phone call to prove (`:376`, `:480`). SIMS-5 "leftover pizza, for m06" (`:707`); the lab Tiled map has `pizza_boxes1`. Line 341 calls the setting "a crypto exchange late at night, still staffed"; check the mission text for time of day (the brief says a routine FCA visit).
- Rooms (linear): reception_lobby (water cooler, reception desk, no receptionist) to security_checkpoint (water cooler; guard patrols with LOS) to trading_floor (key lock; Tiled: coffee_station1, photocopier1, mini_fridge1, phone1, phone3, 8 chairs, 4 desks, many pcs) with blockchain_lab east (open; pizza_boxes1, coffee_cups, energy cans, no machine), irina_office west (RFID), server_room north (password) to data_center (PIN) to executive_wing (RFID; Kemal, hostile patrol, holds `ceo_office_key`) to satoshi_office (key).
- Cast classes (draft):
  - `irina_volkova`: holding (itemsHeld: `m06_cto_badge` cloned by RFID proximity "while she talks", password wordlist, executive badge); key source; plot-located. No needs.
  - `trader_npc` Dani Okonkwo (5,7) trading floor: optional task `question_the_trader` (`scenario.json.erb:386`), no itemsHeld, no NPC chatBackground, no Background lines found. Voice style says "jittery on caffeine". First-meeting narrator line places him at his charts (`ink/m06_npc_trader.ink:33`); "my desk" lines (`:106`, `:256`) are general. Candidate free NPC under D84: own-room coffee trip, found at post first via a first-talk gate. Check `trader_spoken` (`conversation_closed:trader_npc` onceOnly, HaX mapping 52) and `taskOnKO` for V2.
  - `blockchain_analyst` Priya Raghavan (6,4) lab: optional task, narrator line places her at the monitor on first meeting (`ink/m06_npc_analyst.ink:43`). Lab has no machine; a trip would leave her room (V2 check needed) or need a declared lab object.
  - `checkpoint_guard`, `satoshi_minder`: patrol/LOS, never needs. `satoshi_nakamoto`: confrontation, plot-located. Lobby HaX/Netherton/Nightshade/debrief records: cutscene or phone, never.
- Existing trouble global usable for `offWhen`: `cover_strained` (set by KOs of trader, analyst, Irina, guard; HaX mappings 66 to 73). Irina-fate globals `irina_arrested`, `irina_taken` give exchange gates (Dani already reacts: "They walked Irina out past my desk").
- Awareness cast atlases all have seated and pose frames and visemes, except `delphine_reception` (no atlas). Already used: graham_whitfield, fatima_begum (m01), zainab_hussain, yusuf_demir (m03), niamh_doherty, thandiwe_moyo (m05). m06 voices in use: Kore, Puck, Leda, Iapetus, Umbriel, Alnilam, Aoede, Charon, Enceladus (so avoid jun_watanabe/Puck, nilesh_solanki/Iapetus, graham_whitfield/Umbriel, yusuf_demir/Alnilam, anjali_rao/Kore, niamh/Leda). Draft picks for two floor extras: Lerato Dlamini (30s, South African, Gacrux) and Tomasz Wisniewski (50s, Polish-British, Algieba), jobs adapted to the exchange; alternatives Joanne Pell (late 40s, Zephyr), Sofia Marchetti (30s, Despina), Julian Sallow (60s, Rasalgethi).
- Template to follow: `scenarios/m05_insider_trading/office_life/PLAN.md` (sections 0 to 10, built and reviewed); m02 `PLAN.md` for levers/openings framing.

## Next steps

1. Write `BASELINE.md` and `ANALYSIS.md` (cast audit with file:line, rooms and machines, secrets list: server passphrase, data-centre PIN, safe PIN, badges, wordlist; tier).
2. Check whether `trading_workstation` (host TRADE-WS-01) or any trading-floor PC is a network host; never put `offWhen` on it. Decide Dani's and Priya's PCs (declare monitor twins).
3. Write `PLAN.md`, `QUESTIONS.md` (cast picks, magnet source, Priya movement, voicing), then plan review R1 on `opus55`, deltas per the skill, `REVIEW_R<n>.md`.

## Files touched

This folder only: `HANDOVER.md`, `validator_info_lines.txt`, `v1_summary_base.txt`, `baseline_locks.json`, `positions_base.txt`. Running the validator may rewrite `dungeon_graph.*` in the mission folder; not staged.
