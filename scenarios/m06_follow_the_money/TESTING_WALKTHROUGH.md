# Follow the Money — Testing Walkthrough

> Updated 2026-09-30 for the Pass-2 rework. Reconciled against dungeon_graph.md
> (same run) and the shipped scenario.json.erb + compiled ink.

Critical path (6 aims, 5 hops): **Establish Cover → Work The Floor → Crack The Backend → Map The Money → Reach The Top Floor → Settle The Account**

## Prerequisites
- Validator: 0 errors. Warnings are intended (see PASS2_IMPROVEMENTS.md): one `rfidCard` "unknown field" (engine-supported, m03 precedent), nine onceOnly co-fire notices (intended; four pair the `hear_debrief` room-entry backstop with unrelated room mappings), one `data_center` graph-completeness note (the PIN comes from the flag-3 payout item; the validator doesn't scan flag-station `itemsHeld`).
- Playtest: earn each flag in-session and submit the session's `<flag:N>` tokens at the drop-site (the method earlier missions used to reach `status=completed`).
- All 7 Ink files compile (`bash scripts/compile-ink.sh m06_follow_the_money`).
- SecGen VMs from `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml` (flag key `hackme_crack_me_lab`, console `kali_cracker`).
- Minigames: password door lock, RFID lock/cloner, PIN lock (data centre door + executive safe), notes/text-file reader, vm-launcher + flag-station.
- Cover story is the **FCA** (Financial Conduct Authority) supervisory visit, not FinCEN.

## Aim: Establish Cover
[Unlocks at start]

1. **Reception Lobby (opening cutscene)** — Agent HaX briefing auto-plays on `game_loaded` (`timedConversation`, `skipIfGlobal: briefing_played`). `#complete_task:receive_briefing` fires at the top of the cutscene; backstops complete it on `conversation_closed:opening_briefing_npc` and on re-entering reception once `briefing_played` is set.
2. **Trading Floor — Dr. Elena Volkov** — `#complete_task:meet_elena` fires at the top of her first meeting → `onComplete: unlockAim access_backend_systems`. When the conversation closes, HaX sets `exchange_infiltrated` and sends a delayed message.

## Aim: Work The Floor
[Unlocks after: aim `establish_cover` complete]

3. **Trading Floor — Elena** — First meeting shows only the three openers (`first_meeting_scene`). Hub option "test your password strength" (`request_passwords`): hands over the wordlist at `elena_trust >= 15` (reachable on every opener), and on a second ask regardless of trust. `#give_item:text_file:m06_password_dictionary` → `obtain_access_tools` completes itself from the pickup (collect task); the handler sets `found_password_lists` and offers the cracking guide. The option disappears at once after the handover.
4. **Security Checkpoint — IT New Starter Checklist** — Read the note → `server_passphrase_known` set (`onPickup`). Handler nudges toward the convention ("crypto term + year, the checklist says when it was written") **without** reading the passphrase out. `find_server_credentials` completes once both the wordlist and the checklist are in hand (or on entering the server room, as a backstop).
5. **Server Room door** — The house convention is a crypto term + the checklist's year. Top of Elena's list is `bitcoin`; the checklist is Rev. January 2025 → **`bitcoin2025`**. Enter it at the password lock.
6. **Server Room (enter)** — `access_server_room` completes → `onComplete: unlockAim crack_passwords`.
7. **Blockchain Lab (enter)** — `access_blockchain_lab` completes (the lab is open off the hub; it lives in this aim so an early visit can't auto-reveal a later aim).
8. **Blockchain Lab — ENTROPY Transaction Network Analysis** — Read/take → `onPickup: found_blockchain_evidence, financial_network_mapped`; `find_transaction_records` completes itself from the pickup (no mapping `completeTask`, playtest D3); handler sets `blockchain_debrief_available`.
9. *(Optional)* **Dani Okonkwo (trader)** and **Priya Raghavan (analyst)** — flavour conversations (`question_the_trader`, `question_the_analyst`), both optional with `taskOnKO` fallbacks.

## Aim: Crack The Backend
[Unlocks after: aim `access_backend_systems` complete]

10. **Server Room — HashChain Backend Server Terminal** — Launch the vm-launcher (console attaches to `kali_cracker`). Handler completes `access_hackme_vm` (now a `custom` task keyed on `object_interacted`, `vm-launcher`) and offers the reconnaissance guide.
11. **Kali console** — Foothold on `hackme_crack_me_lab` (distcc RCE → readable shadow → crack `hcauth`). Submit **flag_1** at the flag-station (`flag_station_financial:hackme_crack_me_lab-flag1`) → `submit_flag1` → handler sets `flag1_submitted`, offers the credential-reuse guide.
12. **Kali console** — Reuse `hcauth`'s password on `hcledger`. Submit **flag_2** → `submit_flag2` → `flag2_submitted`.
13. **Kali console** — Crack `hcfindb` (financial database). Submit **flag_3** → `submit_flag3` → `flag3_submitted`; `onComplete: unlockAim map_financial_network`. **Flag reward: the drop-site hands you the Door Controller Export** (a `give_item`), which carries the data-centre PIN **3110** (line `DC-02,data centre,pin,3110`; the CEO's note "31/10, the day the whitepaper went out"). The VM work now opens the physical path.
14. **Kali console** — Escalate via `hcops` sudo to read `hcvault`. Submit **flag_4** → `submit_flag4` → `flag4_submitted`, `servers_accessed=4`. **Flag reward: Cold Storage Recovery Keys** (`give_item`); handler sets `found_wallet_keys`, which is what makes the "freeze the fund" ending possible.

## Aim: Map The Money
[Unlocks after: aim `crack_passwords` complete (via submit_flag3 onComplete)]

15. **Data Centre door** — PIN lock. Enter **3110** from the Door Controller Export.
16. **Data Centre (enter)** — `access_data_center` completes.
17. *(Optional)* **Financial Transaction Server (PC)** — read the 3 files (`transaction_server_files` group) → `read_transaction_server_files` progresses (optional).
18. **Data Centre — The Architect's Fund Allocation** — Read/take → `onPickup: found_architects_fund, knows_coordinated_attack`; `discover_architects_fund` completes itself from the pickup (playtest D3); handler sets `knows_architects_fund` → `onComplete: unlockAim breach_executive_wing`. Music shifts to spy-action. (Satoshi is always visible in his office; the old hidden/reveal setup never worked, review B1.)
19. **Data Centre — Cold Storage Procedure note** — flavour that points at the vault account; `found_wallet_keys` is set by the flag-4 reward (step 14), not this note.

## Aim: Reach The Top Floor
[Unlocks after: aim `map_financial_network` complete]

20. **Data Centre — Executive Access Badge** — Take it (rack drawer; the export's DC-03 note flags it) → `take_executive_badge` completes.
21. **Executive Wing door** — Present `executive_badge` at the RFID lock.
22. **Satoshi's Office (enter)** — now a `room_ceo` (playtest D5: the `room_office` desk block trapped the player at the south door); Satoshi at (5,5), safe pinned (8,2), manifesto (2,6). `access_satoshi_office` completes → `onComplete: unlockAim resolve_the_fund`; handler sets `resolve_aim_open` and, if Elena's fate is already set, completes `decide_elena_fate`.
23. *(Optional)* **Elena's Office** (CTO badge — lent, cloned off her lanyard, or relayed on KO) & **Executive Safe** — the executive-wing press clipping ("Until 2140") gives the safe PIN **2140**; Elena's Architect email says his passcodes are the year the last bitcoin is mined. The manifesto no longer carries it. Open it → `open_executive_safe` (optional) → `architect_identity_found` (the CEO's own insurance notes on The Architect).

## Aim: Settle The Account  *(missionConclusion → bond_visualiser)*
[Unlocks after: aim `breach_executive_wing` complete]
`concludeRequires`: **submit_flag1..4 only** (the technical work). Aim tasks: `confront_satoshi`, `decide_asset_strategy`, `decide_elena_fate`, `hear_debrief`. `hear_debrief` completes on the debrief's last line, so the aim (and its bond_visualiser) closes after the debrief, never over it (playtest D2).

24. **Satoshi Nakamoto II** — `#complete_task:confront_satoshi` and `satoshi_confronted` fire at the top of his first conversation. Choosing "You're being detained" with no evidence shown reaches `arrest_resisted`: "Sit down" turns him `#hostile` (KO path), "Then look at this first" shows the evidence. Once `assets_decided` is set he always opens on `aftermath` (reload-safe).
25. **Asset choice** — In dialogue: **Freeze** (needs `found_wallet_keys`), **Watch**, or, without the keys, **"Not yet, I'll be back with the recovery keys"** (sets `asset_decision_deferred`; HaX points at flag 4). Freeze/Watch set `assets_decided` and complete `decide_asset_strategy`. The scheduled six-wallet payout is CEO pre-signed and auto-releases: watch lets it run, freeze sweeps it first. On a Satoshi KO the same three options come by phone (`on_satoshi_ko`), re-openable from the HaX hub and by re-entering his office.
26. **Elena's fate** — In her dialogue: **Recruit** (`elena_recruited`) or **Detain** (`elena_arrested`), each sets `elena_fate_decided`. `decide_elena_fate` completes from a handler mapping once `resolve_aim_open` is set (lesson 27 — the task is not completed early in the ink). KO alternative: `on_elena_ko_relay` hands relayed copies of her wordlist and badge and sets `elena_fate_decided` and `elena_ko_relayed`. Refusal now offers "Think about it" once (+10 trust) as an alternative to detaining her.
27. **Debrief + credits** — When both decisions are made **and all four flags are in**, the next UI close fires the hidden `closing_debrief_person` (`person-chat`, `disableClose`): `conversation_closed` for Satoshi or Elena, `minigame_completed`/`minigame_failed` for the phone or drop-site, or `room_entered` on any room as a backstop. It never opens over an open UI. Each trigger latches `start_debrief_cutscene` so only one opens. The debrief sets `debrief_played` at its top and completes `hear_debrief` on its last line, which completes the aim → bond_visualiser; credits roll on `conversation_closed:closing_debrief_person`. Reload mid-debrief: any room entry with `debrief_played` completes `hear_debrief`.

## Testing Checklist

- [ ] Opening briefing auto-plays once; `receive_briefing` completes even on an early close/reload
- [ ] `meet_elena` unlocks aim 2
- [ ] First meeting shows only three openers; wordlist obtainable on every path (second ask always succeeds); `obtain_access_tools` completes and stays complete
- [ ] Handed-over wordlist / badge options vanish in the same conversation
- [ ] `bitcoin2025` opens the server room; `find_server_credentials` completes
- [ ] Blockchain note sets `financial_network_mapped`, completes `find_transaction_records`
- [ ] vm-launcher completes `access_hackme_vm`
- [ ] All four flags submit in order (station-qualified `flag_station_financial:hackme_crack_me_lab-flagN`)
- [ ] **Flag 3 hands over the Door Controller Export; PIN 3110 opens the data centre**
- [ ] **Flag 4 hands over the Cold Storage Recovery Keys; `found_wallet_keys` set**
- [ ] Fund doc completes `discover_architects_fund`, unlocks aim 5
- [ ] Satoshi is visible in his office on first entry
- [ ] Executive badge opens the wing; entering Satoshi's office unlocks aim 6 + `resolve_aim_open`
- [ ] Confront Satoshi completes `confront_satoshi`
- [ ] Freeze option present only with `found_wallet_keys`; Watch always present
- [ ] Elena fate → `elena_fate_decided`; `decide_elena_fate` completes once aim 6 is open
- [ ] Both decisions + all flags → debrief cutscene FIRST, then bond_visualiser + credits after its last line; no replay on reload
- [ ] `find_transaction_records` / `discover_architects_fund` complete and don't revert
- [ ] Walk in and out of Satoshi's office freely (room_ceo)

### Optional / alternate
- [ ] Trader (`trader_suspicions`) and analyst (`pattern_concerns`) optional conversations complete their tasks without a KO
- [ ] Transaction-server files (group of 3)
- [ ] CTO badge via Elena lending it, via RFID clone off her lanyard (needs the cloner), or relayed on KO
- [ ] Safe PIN `2140` → Architect identity file → `architect_identity_found`

### Edge cases
- [ ] **KO Elena** (`npc_ko:elena_volkov`) → `on_elena_ko_relay` hands the wordlist + badge copies, sets `elena_fate_decided`; credits branch on `elena_ko`
- [ ] **Elena KO as the very last decision** (Satoshi KO'd + phone decision + all flags first) → debrief opens when the relay phone closes (review B2)
- [ ] **Reach Satoshi before flag 4** → "Not yet" defers; HaX nudges to flag 4; freeze is available on return
- [ ] **KO Satoshi** (`npc_ko:satoshi_nakamoto`) → `on_satoshi_ko` puts the asset decision by phone (freeze only with `found_wallet_keys`, else defer); re-openable from the HaX hub sticky option and by re-entering his office
- [ ] **Satoshi resists** ("You're being detained" from the opening, no evidence) → `arrest_resisted` → "Sit down" → `#hostile`; resolvable via the KO path
- [ ] **Skip the safe** → debrief acknowledges the missing identity rather than asserting it
- [ ] **Decisions in either order** → the debrief triggers guard on all of `assets_decided`, `elena_fate_decided` and the four flags
- [ ] **Reload mid-Satoshi after deciding** → he opens on `aftermath`, cannot pick both options
- [ ] **Re-talk after an ended conversation** → Elena, trader, analyst and Satoshi all loop back to a hub (never reach DONE); Elena routes to `after_choice` once her fate is set

## Continuity (with m05 / m07)
- The **$847,000** is the Architect's **acquisition budget** for the Quantum Dynamics job, paid **out** of `1ARCHITECT9FUND` to the Insider Threat Initiative via the **TalentStack** wallet. It is not proceeds of selling data. The blockchain evidence, settlement log, daily report, opening briefing and phone all show it as an outbound payment.
- The $2.4M ransomware figure is inbound, pooled across victims (m02).
- The Architect = Dr. Adrian Tesseract (87% in the safe file) seeds the later reveal.
