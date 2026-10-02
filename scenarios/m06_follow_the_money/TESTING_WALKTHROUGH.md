# Follow the Money — Testing Walkthrough

> Updated 2026-10-02 for pass 4 design (DESIGN_REVIEW.md, "Changes made"): the fund is now found by
> tracing the money through the mixer to a custody-console slot (steps 8, 17-18), the briefing is
> shorter, flag 4 is asked for before the climax, a turned Irina gives the slot and the safe code.
> Updated 2026-10-01 for pass 3 (PUZZLE_CHAINS_PLAN.md: P0-P12). Earlier: 2026-09-30 for the
> pass-2 rework. Reconciled against dungeon_graph.md and the shipped scenario.json.erb + compiled ink.

Critical path (6 aims, 5 hops): **Establish Cover → Work The Floor → Crack The Backend → Map The Money → Reach The Top Floor → Settle The Account**

## Prerequisites
- Validator: 0 errors. Warnings are intended: onceOnly co-fire notices (several pair the `hear_debrief` room-entry backstop with unrelated room mappings), one `data_center` graph-completeness note (the PIN comes from the flag-3 payout item), and the guard's `lockpick_used_in_view` cutscene without `onceOnly` (repeatable on purpose, as m03's guard).
- Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit. No PIN cracker.
- Playtest: earn each flag in-session and submit the session's `<flag:N>` tokens at the drop-site (the method earlier missions used to reach `status=completed`).
- All 8 Ink files compile (`bash scripts/compile-ink.sh m06_follow_the_money`).
- SecGen VMs from `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml` (flag key `hackme_crack_me_lab`, console `kali_cracker`).
- Minigames: password door lock, RFID lock/cloner, PIN lock (data centre door, custody console, executive safe), notes/text-file reader, vm-launcher + flag-station.
- Cover story is the **FCA** (Financial Conduct Authority) supervisory visit, not FinCEN.

## Aim: Establish Cover
[Unlocks at start]

1. **Reception Lobby (opening cutscene)** — Agent HaX briefing auto-plays on `game_loaded` (`timedConversation`, `skipIfGlobal: briefing_played`). `#complete_task:receive_briefing` fires at the top of the cutscene; backstops complete it on `conversation_closed:opening_briefing_npc` and on re-entering reception once `briefing_played` is set.
   **Security Checkpoint — Checkpoint Guard and the trading-floor door (pass 3, P8).** The `trading_floor` door is a key lock (4 pins, easy, no `requires`). Three ways through:
   - **Talk (two beats):** "Who are you?" → "Financial Conduct Authority. Routine supervisory visit."; "Who are you here to see?" → "Dr Volkova. The CTO." → `#unlock_door:trading_floor`, `guard_waved_through`. A wrong answer at either beat sends you away at no cost. Re-talk once through: "Go on, then." (re-issues the unlock until `guard_resolved`).
   - **Pick:** the guard patrols (4,4) ↔ (3,4), cone drawn (`los.visualize`, range 210, 120°). He faces down for his first 4 s at (4,4) (safe), then dwells facing west at (3,4) (safe, about 4.8 s) and east at (4,4) (seen, about 4.8 s). Picking while seen opens `on_lockpick_seen` (never hostile) and sets `guard_grace` and `guard_caught`: until you re-enter the lobby he refuses the cover. A pick he sees after waving you through gets "I said go on".
   - **KO** (`guard_ko`): a KO'd NPC never interrupts a pick.
   - The lockpick mapping's cooldown is 250 ms (not 0): it drops a same-tick duplicate open that otherwise made the first catch play the grace variant.
   - The IT New Starter Checklist is pinned at tile (2,2).
   HaX sets `guard_resolved` on entering the trading floor and sends the RFID line there. The credits show exactly one of four guard lines (talked through, then KO, then picked unseen / picked after a catch).
2. **Trading Floor — Dr. Irina Volkova** — `#complete_task:meet_irina` fires at the top of her first meeting → `onComplete: unlockAim access_backend_systems`. When the conversation closes, HaX sets `exchange_infiltrated` and sends a delayed message.

## Aim: Work The Floor
[Unlocks after: aim `establish_cover` complete]

3. **Trading Floor — Irina** — First meeting shows only the three openers (`first_meeting_scene`). Hub option "test your password strength" (`request_passwords`): hands over the wordlist at `irina_trust >= 15` (reachable on every opener), and on a second ask regardless of trust. `#give_item:text_file:m06_password_dictionary` → `obtain_access_tools` completes itself from the pickup (collect task); the handler sets `found_password_lists` and offers the cracking guide. The option disappears at once after the handover.
4. **Security Checkpoint — IT New Starter Checklist** — Read the note → `server_passphrase_known` set (`onPickup`). Handler nudges toward the convention ("crypto term + year, the checklist says when it was written") **without** reading the passphrase out. `find_server_credentials` completes once both the wordlist and the checklist are in hand (or on entering the server room, as a backstop).
5. **Server Room door** — The house convention is a crypto term + the checklist's year. Top of Irina's list is `bitcoin`; the checklist is Rev. January 2025 → **`bitcoin2025`**. Enter it at the password lock.
6. **Server Room (enter)** — `access_server_room` completes → `onComplete: unlockAim crack_passwords`.
7. **Blockchain Lab (enter)** — `access_blockchain_lab` completes (the lab is open off the hub; it lives in this aim so an early visit can't auto-reveal a later aim).
8. **Blockchain Lab — Priya's write-up ("ENTROPY Transaction Network Analysis")** — now a clue on the critical path: three ENTROPY deposits into the mixer with amount and UTC time (ransom $2,400,000 at 21:40 14 Jul; exploits $1,200,000 at 22:10 29 Jul; Social Fabric $680,000 at 20:05 3 Aug), and the method (amount less the fee, no sooner than the hold). It does not name the fund wallet or its slot. Priya's sticky hub option "How would you follow money through a mixer?" (`mixer_matching`) teaches the method. Read/take → `onPickup: found_blockchain_evidence, financial_network_mapped`; `find_transaction_records` completes itself from the pickup (no mapping `completeTask`, playtest D3); handler sets `blockchain_debrief_available`.
9. *(Optional)* **Dani Okonkwo (trader)** and **Priya Raghavan (analyst)** — flavour conversations (`question_the_trader`, `question_the_analyst`), both optional with `taskOnKO` fallbacks.

## Aim: Crack The Backend
[Unlocks after: aim `access_backend_systems` complete]

10. **Server Room — HashChain Backend Server Terminal** — Launch the vm-launcher (console attaches to `kali_cracker`). Handler completes `access_hackme_vm` (now a `custom` task keyed on `object_interacted`, `vm-launcher`) and offers the reconnaissance and distcc guides.
11. **Kali console** — Foothold on `hackme_crack_me_lab` (distcc RCE → readable shadow → crack `hcauth`). Submit **flag_1** at the flag-station (`flag_station_financial:hackme_crack_me_lab-flag1`) → `submit_flag1` → handler sets `flag1_submitted`, offers the credential-reuse guide.
12. **Kali console** — Reuse `hcauth`'s password on `hcledger`. Submit **flag_2** → `submit_flag2` → `flag2_submitted`.
13. **Kali console** — Crack `hcfindb` (financial database). Submit **flag_3** → `submit_flag3` → `flag3_submitted`; `onComplete: unlockAim map_financial_network`. HaX's text now also asks for flag 4 before going upstairs (pass 4 fix 5). **Flag reward: the drop-site hands you the Door Controller Export** (a `give_item`), which carries the data-centre PIN **3110** (line `DC-02,data centre,pin,3110`; the CEO's note "31/10, the day the whitepaper went out"). The VM work now opens the physical path.
14. **Kali console** — Escalate via `hcops` sudo to read `hcvault`. Submit **flag_4** → `submit_flag4` → `flag4_submitted`, `servers_accessed=4`. **Flag reward: Cold Storage Recovery Keys** (`give_item`); handler sets `found_wallet_keys`, which is what makes the "freeze the fund" ending possible.

## Aim: Map The Money
[Unlocks after: aim `crack_passwords` complete (via submit_flag3 onComplete)]

15. **Data Centre door** — PIN lock. Enter **3110** from the Door Controller Export.
16. **Data Centre (enter)** — `access_data_center` completes.
17. **Financial Transaction Server (PC)** — three files (`transaction_server_files` group, task still optional): `mixer_settlements.log` (mixer credits into cold slots, with times), `mixer_pool_config.yml` (`fee_percent: 1.5`, `min_dwell_hours: 6`), `custody_index.csv` (seven cold slots, neutral labels, an `opened_by` column with no pattern; the "do not reconcile" label sits on decoy 6120). Round 2 noise: 5093 takes $2,346,000 after the hold (wrong amount), 8846 takes small credits. HaX texts on first entry (before the fund) and her hub offers "Which cold slot is the fund?" (graded nudges, `fund_hint`).
17a. **Custody Console** (`cold_storage_console`, PIN lock) — the fund's slot is **4471**: each deposit less 1.5% lands there at least six hours later ($2,364,000 at 04:20 15 Jul; $1,182,000 at 05:05 30 Jul; $669,800 at 03:35 4 Aug). Decoys: 3815 takes $2,364,000 at 01:15 (too early), 6120 takes $1,200,000 (no fee, too early), 2207 takes $669,800 at 01:50 (too early). Three tries per opening; reopen to retry. Opening it completes `identify_fund_wallet`. A turned Irina never names the slot: she rules out 6120 and anything inside the six-hour hold, and once the settlement log is picked up (`read_settlement_log`) she checks a slot the player names (`slot_check`; a right answer sets `irina_confirmed_slot`).
18. **Custody Console contents — The Architect's Fund Allocation** (custody: slot 4471 / 1ARCHITECT9FUND) (per-cell advance paid / balance pending, pending sums to $12.8M; authorised by "Satoshi's Ghost"; projection 350-600) — Read/take → `onPickup: found_architects_fund, knows_coordinated_attack`; `discover_architects_fund` completes itself from the pickup (playtest D3); handler sets `knows_architects_fund` (its message is split on `irina_ko`: "the spare was signed out to the CTO, she's on the trading floor" vs "check where she went down, ask me if it isn't there") → `onComplete: unlockAim breach_executive_wing`. Music shifts to spy-action. (Satoshi is always visible in his office; the old hidden/reveal setup never worked, review B1.)
19. **Data Centre — Cold Storage Procedure note** — flavour that points at the vault account; `found_wallet_keys` is set by the flag-4 reward (step 14), not this note.

## Aim: Reach The Top Floor
[Unlocks after: aim `map_financial_network` complete]

20. **Back to the trading floor — Irina hands over the spare executive badge** (pass 3, P9). The export's DC-03 note says it was signed out to the CTO. Her hub (and `after_choice`, once her fate is set) offers "Satoshi's wing. You've a badge for it." once `found_architects_fund` is set: she reads the fund if you haven't shown it, then `#give_item:keycard:executive_access_badge`, whatever her trust. A detained Irina doesn't look up; you take it from her drawer. `irina_exec_badge_given` is set by the pickup mapping.
21. **Executive Wing door** — Present `executive_badge` at the RFID lock → `take_executive_badge` (now `enter_room: executive_wing`) completes on entry. Without flag 4, HaX texts once to finish the vault account first (no hard gate).
22. **Satoshi's Office (enter)** — now a `room_ceo` (playtest D5: the `room_office` desk block trapped the player at the south door); Satoshi at (5,5), safe pinned (8,2), manifesto (2,6). `access_satoshi_office` completes → `onComplete: unlockAim resolve_the_fund`; handler sets `resolve_aim_open` and, if Irina's fate is already set, completes `decide_irina_fate`.
23. *(Optional)* **Irina's Office** (CTO badge — lent, cloned off her lanyard with the start-kit cloner, or dropped/relayed on KO) & **Executive Safe** — the executive-wing press clipping ("Until 2140") gives the safe PIN **2140**; Irina's Architect email P.S. says the CEO's private safe is set to the year the last bitcoin is mined (no digits). Taking her research notes sets `read_irina_notes`, which gives a low-trust player a way to turn her (P10). Open it → `open_executive_safe` (optional) → `architect_identity_found` (the CEO's own insurance notes on The Architect).

## Aim: Settle The Account  *(missionConclusion → bond_visualiser)*
[Unlocks after: aim `breach_executive_wing` complete]
`concludeRequires`: **submit_flag1..4 only** (the technical work). Aim tasks: `confront_satoshi`, `decide_asset_strategy`, `decide_irina_fate`, `hear_debrief`. `hear_debrief` completes on the debrief's last line, so the aim (and its bond_visualiser) closes after the debrief, never over it (playtest D2).

24. **Satoshi Nakamoto II** — `#complete_task:confront_satoshi` and `satoshi_confronted` fire at the top of his first conversation. With the fund found, "Or should I call you Satoshi's Ghost?" makes him answer to the codename. Choosing "You're being detained" with no evidence shown reaches `arrest_resisted`: "Sit down" turns him `#hostile` (KO path), "Then look at this first" shows the evidence. Once `assets_decided` is set he always opens on `aftermath` (reload-safe).
25. **Asset choice** — Round 2 (M1): both choices need `found_architects_fund`; without it the only option is "Not yet. I'll find your wallet first." (sets `asset_decision_deferred`; HaX points at the console). Same on the phone after a Satoshi KO. In dialogue: **Freeze** (needs `found_wallet_keys`), **Watch**, or, without the keys, **"Not yet, I'll be back with the recovery keys"** (sets `asset_decision_deferred`; HaX points at flag 4). Freeze/Watch set `assets_decided` and complete `decide_asset_strategy`. The advances went out on 4 August; the $12.8M balances are CEO pre-signed and auto-release: watch lets them reach the cells, freeze sweeps them first. On a Satoshi KO the same three options come by phone (`on_satoshi_ko`), re-openable from the HaX hub and by re-entering his office.
26. **Irina's fate** — In her dialogue: **Recruit** (`irina_recruited`) or **Detain** (`irina_arrested`), each sets `irina_fate_decided`. A turned Irina gives the safe code 2140 if the safe isn't open and, while the fund isn't found, narrows the slot (see 17a); HaX's recap repeats both. A detained Irina gives nothing. `decide_irina_fate` completes from a handler mapping once `resolve_aim_open` is set (lesson 27 — the task is not completed early in the ink). KO alternative: three HaX mappings on `npc_ko:irina_volkova` (split on recruited / arrested / neither) set `irina_fate_decided` and `irina_ko_relayed` and send a timed text that fits her fate; nothing forces the phone open and nothing is given. Her CTO and executive badges drop beside her; her wordlist drops too but a loose `text_file` can't be taken (engine E20), so HaX's hub offers a relayed copy of each item on request, only while it isn't picked up (executive badge only after the fund). Low trust can still turn her with her own research notes (`read_irina_notes`). Refusal now offers "Think about it" once (+10 trust) as an alternative to detaining her.
27. **Debrief + credits** — When both decisions are made **and all four flags are in**, the next UI close fires the hidden `closing_debrief_person` (`person-chat`, `disableClose`): `conversation_closed` for Satoshi or Irina, `minigame_completed`/`minigame_failed` for the phone or drop-site, or `room_entered` on any room as a backstop. It never opens over an open UI. Each trigger latches `start_debrief_cutscene` so only one opens. The debrief sets `debrief_played` at its top and completes `hear_debrief` on its last line, which completes the aim → bond_visualiser; credits roll on `conversation_closed:closing_debrief_person`. Reload mid-debrief: any room entry with `debrief_played` completes `hear_debrief`.

## Testing Checklist

- [ ] Opening briefing auto-plays once; `receive_briefing` completes even on an early close/reload
- [ ] `meet_irina` unlocks aim 2
- [ ] First meeting shows only three openers; wordlist obtainable on every path (second ask always succeeds); `obtain_access_tools` completes and stays complete
- [ ] Handed-over wordlist / badge options vanish in the same conversation
- [ ] `bitcoin2025` opens the server room; `find_server_credentials` completes
- [ ] Blockchain note sets `financial_network_mapped`, completes `find_transaction_records`
- [ ] vm-launcher completes `access_hackme_vm`
- [ ] All four flags submit in order (station-qualified `flag_station_financial:hackme_crack_me_lab-flagN`)
- [ ] **Flag 3 hands over the Door Controller Export; PIN 3110 opens the data centre**
- [ ] **Flag 4 hands over the Cold Storage Recovery Keys; `found_wallet_keys` set**
- [ ] **Custody console: 4471 opens it from in-game clues only (write-up + settlement log + pool config); a decoy slot (3815, 6120, 2207) is refused**
- [ ] HaX `fund_hint` gives three graded nudges; recap repeats the method after a reload
- [ ] Fund doc completes `discover_architects_fund`, unlocks aim 5
- [ ] Satoshi is visible in his office on first entry
- [ ] Executive badge from Irina (after the fund) opens the wing; `take_executive_badge` ticks on entering the wing; entering Satoshi's office unlocks aim 6 + `resolve_aim_open`
- [ ] Confront Satoshi completes `confront_satoshi`
- [ ] Freeze option present only with `found_wallet_keys`; Watch always present
- [ ] Irina fate → `irina_fate_decided`; `decide_irina_fate` completes once aim 6 is open
- [ ] Both decisions + all flags → debrief cutscene FIRST, then bond_visualiser + credits after its last line; no replay on reload
- [ ] `find_transaction_records` / `discover_architects_fund` complete and don't revert
- [ ] Walk in and out of Satoshi's office freely (room_ceo)

### Optional / alternate
- [ ] Trader (`trader_suspicions`) and analyst (`pattern_concerns`) optional conversations complete their tasks without a KO
- [ ] Transaction-server files (group of 3)
- [ ] CTO badge via Irina lending it, via RFID clone off her lanyard (start-kit cloner; cancel then retry keeps the option), or dropped / relayed on KO
- [ ] Safe PIN `2140` → Architect identity file → `architect_identity_found`

### Edge cases
- [ ] **Turn Irina before the data centre** (trust ≥ 20 + write-up → show it → recruit): she rules out 6120 and early credits, gives 2140, never says 4471; after the settlement log, "Check a slot for me" confirms 4471 and refuses the others; credits read "TRACED, CONFIRMED BY VOLKOVA"
- [ ] **KO Irina, reach Satoshi without the fund**: only "Not yet. I'll find your wallet first."; HaX's wing text points at the console
- [ ] **Debrief FCA letter**: three picks from nine; HaX's verdict matches the count of real findings
- [ ] **KO Irina** (`npc_ko:irina_volkova`) → badges on the floor beside her; HaX's KO text gives nothing, sets `irina_fate_decided` and matches her fate; HaX hub offers a copy only for items not yet picked up; aim 5 does not appear early; credits branch on `irina_ko`
- [ ] Trader and analyst credit lines appear only if you talked to them (`trader_spoken`, `analyst_spoken`)
- [ ] Satoshi is always detained after the asset decision, and the confrontation says so
- [ ] **HaX recap after a reload**: "Remind me where we are." repeats whatever once-only guidance still applies (phone history is memory-only, engine E9)
- [ ] **Checkpoint guard**: talk route, pick in the safe window, catch → grace until the lobby, KO → free picks; credits show one guard line
- [ ] **Irina KO as the very last decision** (Satoshi KO'd + phone decision + all flags first) → debrief opens when the relay phone closes (review B2)
- [ ] **Reach Satoshi before flag 4** → "Not yet" defers; HaX nudges to flag 4; freeze is available on return
- [ ] **KO Satoshi** (`npc_ko:satoshi_nakamoto`) → `on_satoshi_ko` puts the asset decision by phone (freeze only with `found_wallet_keys`, else defer); re-openable from the HaX hub sticky option and by re-entering his office
- [ ] **Satoshi resists** ("You're being detained" from the opening, no evidence) → `arrest_resisted` → "Sit down" → `#hostile`; resolvable via the KO path
- [ ] **Skip the safe** → debrief acknowledges the missing identity rather than asserting it
- [ ] **Decisions in either order** → the debrief triggers guard on all of `assets_decided`, `irina_fate_decided` and the four flags
- [ ] **Reload mid-Satoshi after deciding** → he opens on `aftermath`, cannot pick both options
- [ ] **Re-talk after an ended conversation** → Irina, trader, analyst and Satoshi all loop back to a hub (never reach DONE); Irina routes to `after_choice` once her fate is set

## Continuity (with m05 / m07)
- The **$847,000** is the Architect's **acquisition budget** for the Quantum Dynamics job, paid **out** of the fund (slot 4471, `1ARCHITECT9FUND`) to the Insider Threat Initiative via the **TalentStack** wallet. It is not proceeds of selling data. Priya's write-up, daily report, opening briefing and phone all show it as an outbound payment.
- The $2.4M ransomware figure is inbound, pooled across victims (m02).
- The Architect = Dr. Adrian Tesseract (87% in the safe file) seeds the later reveal.
