# Follow the Money — Testing Walkthrough

> Updated 2026-10-13 for pass 5 puzzle chains round 1: custody console 2 tries per opening, a
> lockout strains the cover (17a); Irina checks one slot per visit; a turned or detained Irina can
> still give the wordlist (26); the checklist text is a pointer, not the recipe (4); the safe's
> number moved to Priya's notes (8, 23); Satoshi's signing case opens on his print off the
> press clipping (21a, 22a).
> Updated 2026-10-13 for pass 5 alignment (IMPROVEMENT_LOOP_LOG.md, rounds 1-3): Satoshi's minder
> Kemal Aydin and the locked CEO door (steps 21a-22), the cover strain (step 2a), Irina collected
> by the police after she is detained (steps 20, 26), sweep-then-call-in ending (step 27), phase
> music, one "Send me a field guide." menu (lockpicking guide added), Satoshi at (5,6).
> Updated 2026-10-02 for pass 4 design (DESIGN_REVIEW.md, "Changes made"): the fund is now found by
> tracing the money through the mixer to a custody-console slot (steps 8, 17-18), the briefing is
> shorter, flag 4 is asked for before the climax, a turned Irina gives the slot and the safe code.
> Updated 2026-10-01 for pass 3 (PUZZLE_CHAINS_PLAN.md: P0-P12). Earlier: 2026-09-30 for the
> pass-2 rework. Reconciled against dungeon_graph.md and the shipped scenario.json.erb + compiled ink.

Critical path (6 aims, 5 hops): **Establish Cover → Work The Floor → Crack The Backend → Map The Money → Reach The Top Floor → Settle The Account**

## Prerequisites
- Validator: 0 errors. Warnings are intended: onceOnly co-fire notices on HaX (room-entry backstops, the `irina_taken` and call-in loops, the KO text + first-cause strain pairs), the two-sources note for the server room, and three repeatable person-chat cutscenes without `onceOnly` (the guard's and Kemal's `lockpick_used_in_view` catches, Kemal's sight challenge), repeatable on purpose as m03's and m04's guards.
- Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit. No PIN cracker.
- Playtest: earn each flag in-session and submit the session's `<flag:N>` tokens at the drop-site (the method earlier missions used to reach `status=completed`).
- All 9 Ink files compile (`bash scripts/compile-ink.sh m06_follow_the_money`).
- SecGen VMs from `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml` (flag key `hackme_crack_me_lab`, console `kali_cracker`).
- Minigames: password door lock, RFID lock/cloner, key locks picked or opened (trading-floor door, CEO's door), PIN lock (data centre door, custody console, executive safe), notes/text-file reader, vm-launcher + flag-station.
- Route driver (static, no browser): `node scripts/ink_runtime_check/m06_routes/route.js scripts/ink_runtime_check/m06_routes/<route>.json`, r1-r13.
- Cover story is the **FCA** (Financial Conduct Authority) supervisory visit, not FinCEN.

## Aim: Establish Cover
[Unlocks at start]

1. **Reception Lobby (opening cutscene)** — Agent HaX briefing auto-plays on `game_loaded` (`timedConversation`, `skipIfGlobal: briefing_played`). `#complete_task:receive_briefing` fires at the top of the cutscene; backstops complete it on `conversation_closed:opening_briefing_npc` and on re-entering reception once `briefing_played` is set.
   **Security Checkpoint — Checkpoint Guard and the trading-floor door (pass 3, P8).** The `trading_floor` door is a key lock (4 pins, easy, no `requires`). Three ways through:
   - **Talk (two beats):** "Who are you?" → "Financial Conduct Authority. Routine supervisory visit."; "Who are you here to see?" → "Dr Volkova. The CTO." → `#unlock_door:trading_floor`, `guard_waved_through`. A wrong answer at either beat sends you away at no cost. Re-talk once through: "Go on, then." (re-issues the unlock until `guard_resolved`).
   - **Pick:** the guard patrols (4,4) ↔ (3,4), cone drawn (`los.visualize`, range 210, 120°). He faces down for his first 4 s at (4,4) (safe), then dwells facing west at (3,4) (safe, about 4.8 s) and east at (4,4) (seen, about 4.8 s). Picking while seen opens `on_lockpick_seen` (never hostile) and sets `guard_grace` and `guard_caught`: until you re-enter the lobby he refuses the cover. He ends "And I'll be ringing whoever you say sent you.", and the catch strains the cover for good (step 2a; HaX: "The guard saw your picks…"). A pick he sees after waving you through gets "I said go on".
   - **KO** (`guard_ko`): a KO'd NPC never interrupts a pick.
   - The lockpick mapping's cooldown is 250 ms (not 0): it drops a same-tick duplicate open that otherwise made the first catch play the grace variant.
   - The IT New Starter Checklist is pinned at tile (2,2).
   HaX sets `guard_resolved` on entering the trading floor and sends the RFID line there. The credits show exactly one of four guard lines (KO first since pass 5, then talked through, then picked unseen / picked after a catch).
2. **Trading Floor — Dr. Irina Volkova** — `#complete_task:meet_irina` fires at the top of her first meeting → `onComplete: unlockAim access_backend_systems`. When the conversation closes, HaX sets `exchange_infiltrated` and sends a delayed message.
2a. **Cover strain (pass 5, A3)** — `cover_strained` (permanent, never a fail state) is set by the first of: the guard catching a pick; a KO of the guard, Dani, Priya or Irina; Irina's first conversation closing with `irina_suspicious` still true (the "Let's be quick. I need your servers…" opener, not repaired by "Let's start again, properly"); or a custody-console lockout (step 17a). Only the first cause sends its HaX text (catch 3 s, guard KO 7 s, staff KO 7 s, Irina 17.5 s, console 2.5 s). Effects: HaX's recap warns; Irina lends her badge only at trust ≥ 35 (her own-suspicion line if she is still suspicious; the cloner still works); Kemal won't take the FCA line (step 21a); Satoshi opens "Somebody on my floor rang the FCA an hour ago…" (held: "Your paperwork was good. I had you checked anyway."); one debrief beat; credits "FCA COVER: held all night" / "strained".

## Aim: Work The Floor
[Unlocks after: aim `establish_cover` complete]

3. **Trading Floor — Irina** — First meeting shows only the three openers (`first_meeting_scene`). Hub option "test your password strength" (`request_passwords`): hands over the wordlist at `irina_trust >= 15` (reachable on every opener), and on a second ask regardless of trust. `#give_item:text_file:m06_password_dictionary` → `obtain_access_tools` completes itself from the pickup (collect task); the handler sets `found_password_lists` and offers the cracking guide. The option disappears at once after the handover.
4. **Security Checkpoint — IT New Starter Checklist** — Read the note → `server_passphrase_known` set (`onPickup`). Handler's text is now only a pointer (puzzle chains M3): "That's their house rule for door passphrases. Volkova keeps the list of words her people pick." The full recipe stays in the recap ("Remind me where we are"), which the player asks for. `find_server_credentials` completes once both the wordlist and the checklist are in hand (or on entering the server room, as a backstop).
5. **Server Room door** — The house convention is a crypto term + the checklist's year. Top of Irina's list is `bitcoin`; the checklist is Rev. January 2025 → **`bitcoin2025`**. Enter it at the password lock.
6. **Server Room (enter)** — `access_server_room` completes → `onComplete: unlockAim crack_passwords`.
7. **Blockchain Lab (enter)** — `access_blockchain_lab` completes (the lab is open off the hub; it lives in this aim so an early visit can't auto-reveal a later aim).
8. **Blockchain Lab — Priya's write-up ("ENTROPY Transaction Network Analysis")** — now a clue on the critical path: three ENTROPY deposits into the mixer with amount and UTC time (ransom $2,400,000 at 21:40 14 Jul; exploits $1,200,000 at 22:10 29 Jul; Social Fabric $680,000 at 20:05 3 Aug), and the method (amount less the fee, no sooner than the hold). It does not name the fund wallet or its slot. Her "Privacy Coin Mixing Analysis" notes no longer name the Fund ("5. Into one wallet? Every cell draws on something.") and carry the safe's number in a margin line ("21M cap. Last coin due around 2140. Not our problem."). Priya's sticky hub option "How would you follow money through a mixer?" (`mixer_matching`) teaches the method. Read/take → `onPickup: found_blockchain_evidence, financial_network_mapped`; `find_transaction_records` completes itself from the pickup (no mapping `completeTask`, playtest D3); handler sets `blockchain_debrief_available`.
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
17a. **Custody Console** (`cold_storage_console`, PIN lock) — the fund's slot is **4471**: each deposit less 1.5% lands there at least six hours later ($2,364,000 at 04:20 15 Jul; $1,182,000 at 05:05 30 Jul; $669,800 at 03:35 4 Aug). Decoys: 3815 takes $2,364,000 at 01:15 (too early), 6120 takes $1,200,000 (no fee, too early), 2207 takes $669,800 at 01:50 (too early). **Two tries per opening** (`maxAttempts: 2`; puzzle chains M1/D1. The engine default is 5 and resets on each opening, which is what regression M6 saw). Two wrong slots in one opening lock the pad until it is reopened, and the first lockout before the fund strains the cover once (HaX: "That console logs every slot it opens. Somebody's phone just buzzed."; HaX's `minigame_failed` mapping, scoped by condition: **browser check owed** that a cancel doesn't trip it). Reopen to try again. Opening it completes `identify_fund_wallet`. A turned Irina never names the slot: she rules out 6120 and anything inside the six-hour hold, and once the settlement log is picked up (`read_settlement_log`) she checks a slot the player names (`slot_check`; a right answer sets `irina_confirmed_slot`), **one check per visit** (ink-local `slot_checked_visit`, cleared each time her conversation opens).
18. **Custody Console contents — The Architect's Fund Allocation** (custody: slot 4471 / 1ARCHITECT9FUND) (per-cell advance paid / balance pending, pending sums to $12.8M; authorised by "Satoshi's Ghost"; projection 350-600) — Read/take → `onPickup: found_architects_fund, knows_coordinated_attack`; `discover_architects_fund` completes itself from the pickup (playtest D3); handler sets `knows_architects_fund` (its message is split on `irina_ko`: "the spare was signed out to the CTO, she's on the trading floor" vs "check where she went down, ask me if it isn't there") → `onComplete: unlockAim breach_executive_wing`. Music shifts to spy-action. (Satoshi is always visible in his office; the old hidden/reveal setup never worked, review B1.)
19. **Data Centre — Cold Storage Procedure note** — flavour that points at the vault account; `found_wallet_keys` is set by the flag-4 reward (step 14), not this note.

## Aim: Reach The Top Floor
[Unlocks after: aim `map_financial_network` complete]

20. **Back to the trading floor — Irina hands over the spare executive badge** (pass 3, P9). The export's DC-03 note says it was signed out to the CTO. Her hub (and `after_choice`, once her fate is set) offers "Satoshi's wing. You've a badge for it." once `found_architects_fund` is set: she reads the fund if you haven't shown it, then `#give_item:keycard:executive_access_badge`, whatever her trust. A detained Irina doesn't look up; you take it from her drawer. `irina_exec_badge_given` is set by the pickup mapping. If she was detained and the player has since entered another room, the police have collected her (`irina_taken`, step 26): HaX's hub relays the executive badge (and her office badge and wordlist, if not yet taken).
21. **Executive Wing door** — Present `executive_badge` at the RFID lock → `take_executive_badge` (now `enter_room: executive_wing`) completes on entry. Without flag 4, HaX texts once to finish the vault account first (no hard gate).
21a. **Executive Wing — Kemal Aydin, Satoshi's minder (pass 5, A5 / R2-M3)** — stand-in sprite `male_hacker_hood_down_v2`. He walks (8,4) ↔ (4,4): about 4.5 s at (8,4) facing east, under the north door; about 3.5 s at (4,4) facing west, at the west door. Cone drawn (range 150, 120°); the door is in view for about 2.2 s per 14.3 s loop (as he sets off east), safe about 12 s (browser game 2237). Sight challenge (`challengeOnSight`, cooldown 20 s, skipped once he has let you in, turned hostile or been knocked out, or once Satoshi is confronted) → `on_sighted`; the narration plays only on the first meeting. Satoshi's door is key-locked (`ceo_office_key`) and Kemal holds the key. Three routes:
   - **Talk:** cover held → "The FCA. Mr Nakamoto's compliance file has my name on it." Cover strained → only "Dr Volkova sent me up." (turned Irina, not KO'd). Either sets `minder_passed` and gives `#unlock_door:satoshi_office` (re-issued on re-entry until Satoshi is confronted).
   - **Pick:** pick the CEO's door while his back is turned. A pick he sees opens `on_lockpick_seen` ("A hand the size of a shovel closes over yours…" / "No.") and the stand-off: back off, Irina's word, or square up. A seen pick withdraws the FCA line for that visit and does not strain the cover. **Still owed: one real pick started inside his cone in a browser run (N1).**
   - **Fight:** "Then step aside, or I'll move you." → `#hostile:satoshi_minder` (`minder_hostile`); a KO (`minder_ko`) drops `ceo_office_key`.
   `minder_challenged` records that he turned you back.
   **Satoshi's print (puzzle chains D2, optional):** the framed press clipping at (4,2) is no longer takeable and carries Satoshi's thumbprint (`fingerprintOwner: "Satoshi Nakamoto II"`, easy, candidates Kemal, Irina, Dani). Dust it with the print kit while Kemal's back is turned (it sits by his west dwell; the sight challenge waits for the minigame to close). Its text no longer gives the safe's number ("Until the last coin."). Credits, Satoshi and the debrief use one order: KO, hostile, talked past, turned back once, never seen.
22. **Satoshi's Office (enter)** — key-locked since pass 5 (step 21a); a `room_ceo` (playtest D5: the `room_office` desk block trapped the player at the south door); Satoshi at (5,6), safe pinned (8,2), manifesto (2,6), signing case (3,3, provisional for room dressing).
22a. *(Optional)* **Signing Case** (`satoshi_signing_case`, biometric, enrolled to "Satoshi Nakamoto II") — opens on the print lifted from the press clipping (step 21a). Contents: the Release Signing Record (`onPickup: signing_record_found`), which completes the optional `open_signing_case` (collect task) and gets a HaX text, a debrief line and the credit "THE RELEASE: signed on Satoshi's own thumb…". The freeze/watch outcome is unchanged. This is the print kit's payoff (the briefing names it). `access_satoshi_office` completes → `onComplete: unlockAim resolve_the_fund`; handler sets `resolve_aim_open` and, if Irina's fate is already set, completes `decide_irina_fate`.
23. *(Optional)* **Irina's Office** (CTO badge — lent, cloned off her lanyard with the start-kit cloner, or dropped/relayed on KO) & **Executive Safe** — the clue spans three rooms (puzzle chains D3): the press clipping gives the motive ("Until the last coin"), Irina's Architect email P.S. the meaning (the year the last bitcoin is mined, no digits), and Priya's mixing notes the number (**2140**, in a margin line). A turned Irina still says it outright. Taking her research notes sets `read_irina_notes`, which gives a low-trust player a way to turn her (P10). Open it → `open_executive_safe` (optional) → `architect_identity_found` (the CEO's own insurance notes on The Architect).

## Aim: Settle The Account  *(missionConclusion → bond_visualiser)*
[Unlocks after: aim `breach_executive_wing` complete]
`concludeRequires`: **submit_flag1..4 only** (the technical work). Aim tasks: `confront_satoshi`, `decide_asset_strategy`, `decide_irina_fate`, `hear_debrief`. `hear_debrief` completes on the debrief's last line, so the aim (and its bond_visualiser) closes after the debrief, never over it (playtest D2).

24. **Satoshi Nakamoto II** — `#complete_task:confront_satoshi` and `satoshi_confronted` fire at the top of his first conversation. With the fund found, "Or should I call you Satoshi's Ghost?" makes him answer to the codename. Choosing "I'm detaining you." with no evidence shown reaches `arrest_resisted`: "Sit down" turns him `#hostile` (KO path), "Then look at this first" shows the evidence. Once `assets_decided` is set he always opens on `aftermath` (reload-safe).
25. **Asset choice** — Round 2 (M1): both choices need `found_architects_fund`; without it the only option is "Not yet. I'll find your wallet first." (sets `asset_decision_deferred`; HaX points at the console). Same on the phone after a Satoshi KO. In dialogue: **Freeze** (needs `found_wallet_keys`), **Watch**, or, without the keys, **"Not yet, I'll be back with the recovery keys"** (sets `asset_decision_deferred`; HaX points at flag 4). Freeze/Watch set `assets_decided` and complete `decide_asset_strategy`. The advances went out on 4 August; the $12.8M balances are CEO pre-signed and auto-release: watch lets them reach the cells, freeze sweeps them first. On a Satoshi KO the same three options come by phone (`on_satoshi_ko`), re-openable from the HaX hub and by re-entering his office.
26. **Irina's fate** — In her dialogue: **Recruit** (`irina_recruited`) or **Detain** (`irina_arrested`), each sets `irina_fate_decided`. A turned Irina gives the safe code 2140 if the safe isn't open and, while the fund isn't found, narrows the slot (see 17a); HaX's recap repeats both. Turned or detained before she handed over the wordlist, her post-decision menu still offers it ("I still need that wordlist." / "(Take the wordlist from her desk.)", puzzle chains M2), and a turned Irina still lends her office badge ("Can I borrow your office badge?", m9). A detained Irina gives nothing; on the player's next room entry away from the trading floor she is collected by the police (`irina_taken`, she is hidden, and re-hidden on reload) and HaX relays anything she still held. Detained and then KO'd on the floor, she is not collected; the debrief and credits say the police carried her out. `decide_irina_fate` completes from a handler mapping once `resolve_aim_open` is set (lesson 27 — the task is not completed early in the ink). KO alternative: three HaX mappings on `npc_ko:irina_volkova` (split on recruited / arrested / neither) set `irina_fate_decided` and `irina_ko_relayed` and send a timed text that fits her fate; nothing forces the phone open and nothing is given. Her CTO and executive badges drop beside her; her wordlist drops too but a loose `text_file` can't be taken (engine E20), so HaX's hub offers a relayed copy of each item on request, only while it isn't picked up (executive badge only after the fund). Low trust can still turn her with her own research notes (`read_irina_notes`). Refusal now offers "Think about it" once (+10 trust) as an alternative to detaining her.
27. **Sweep, call-in, debrief + credits (pass 5, A1)** — When both decisions are made **and all four flags are in**, the next UI close or room entry sets `ready_to_extract` (a latch, so one text), unlocks the optional `call_in_after_sweep` task and HaX texts "That's both calls made… call me and I'll bring you in." (plus "His safe's still shut…" if it is). Nothing opens on its own: the player can sweep (the safe stays reachable). HaX's hub then offers **"I'm done here. Bring me in."** → `extract_offer` (names the shut safe) → "Bring me in." → "On my way." → `extract_go` completes `call_in_after_sweep` and sets `start_debrief_cutscene`, which opens the hidden `closing_debrief_person` (`person-chat`, `disableClose`) at HQ, on the narration (no "Come in" beat, R2-M1). Reload before the debrief's first line: any room entry re-emits `start_debrief_cutscene`. The debrief sets `debrief_played` at its top and completes `hear_debrief` on its last line, which completes the aim → bond_visualiser; credits roll on `conversation_closed:closing_debrief_person` to "Digital Leashes". Reload mid-debrief: any room entry with `debrief_played` completes `hear_debrief`.

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
- [ ] **Custody console: 4471 opens it from in-game clues only (write-up + settlement log + pool config); a decoy slot (3815, 6120, 2207) is refused; two wrong in one opening lock the pad, and the first lockout strains the cover (browser: a cancel must not)**
- [ ] HaX `fund_hint` gives three graded nudges; recap repeats the method after a reload
- [ ] Fund doc completes `discover_architects_fund`, unlocks aim 5
- [ ] Satoshi is visible in his office on first entry
- [ ] Executive badge from Irina (after the fund) opens the wing; `take_executive_badge` ticks on entering the wing; entering Satoshi's office unlocks aim 6 + `resolve_aim_open`
- [ ] Confront Satoshi completes `confront_satoshi`
- [ ] Freeze option present only with `found_wallet_keys`; Watch always present
- [ ] Irina fate → `irina_fate_decided`; `decide_irina_fate` completes once aim 6 is open
- [ ] Both decisions + all flags → HaX's call-in text, nothing opens; "I'm done here. Bring me in." → debrief at HQ FIRST, then bond_visualiser + credits after its last line; no replay on reload
- [ ] `find_transaction_records` / `discover_architects_fund` complete and don't revert
- [ ] Satoshi's door is locked until Kemal opens it, it is picked, or his dropped key is used; once open, walk in and out freely (room_ceo)
- [ ] Kemal: sight challenge on entering in view; talk-past unlocks the door (cover held: FCA line; strained: only a turned Irina's word); a repeat sighting has no narration
- [ ] **Real pick inside Kemal's cone (N1, owed)** → "A hand the size of a shovel…", "No.", then the stand-off
- [ ] Cover strain: each cause sends only its own text, once; Satoshi's opener and the credits match the state

### Optional / alternate
- [ ] Trader (`trader_suspicions`) and analyst (`pattern_concerns`) optional conversations complete their tasks without a KO
- [ ] Transaction-server files (group of 3)
- [ ] CTO badge via Irina lending it, via RFID clone off her lanyard (start-kit cloner; cancel then retry keeps the option), or dropped / relayed on KO
- [ ] Safe PIN `2140` (number from Priya's notes) → Architect identity file → `architect_identity_found`
- [ ] Print kit: dust the press clipping (Satoshi's print) → open the signing case → `signing_record_found`, HaX text, debrief line, credit

### Edge cases
- [ ] **Turn Irina before the wordlist** → "I still need that wordlist." hands it over; `obtain_access_tools` completes (route r14)
- [ ] **Turn Irina before the data centre** (trust ≥ 20 + write-up → show it → recruit): she rules out 6120 and early credits, gives 2140, never says 4471; after the settlement log, "Check a slot for me" confirms 4471 and refuses the others; credits read "TRACED, CONFIRMED BY VOLKOVA"
- [ ] **KO Irina, reach Satoshi without the fund**: only "Not yet. I'll find your wallet first."; HaX's wing text points at the console
- [ ] **Debrief FCA letter**: three picks from nine; HaX's verdict matches the count of real findings
- [ ] **KO Irina** (`npc_ko:irina_volkova`) → badges on the floor beside her; HaX's KO text gives nothing, sets `irina_fate_decided` and matches her fate; HaX hub offers a copy only for items not yet picked up; aim 5 does not appear early; credits branch on `irina_ko`
- [ ] Trader and analyst credit lines appear only if you talked to them (`trader_spoken`, `analyst_spoken`)
- [ ] Satoshi is always detained after the asset decision, and the confrontation says so
- [ ] **HaX recap after a reload**: "Remind me where we are." repeats whatever once-only guidance still applies (phone history is memory-only, engine E9)
- [ ] **Checkpoint guard**: talk route, pick in the safe window, catch → grace until the lobby, KO → free picks; credits show one guard line
- [ ] **Irina KO as the very last decision** (Satoshi KO'd + phone decision + all flags first) → HaX's call-in text; the debrief waits for "Bring me in"
- [ ] **Irina detained, then leave the floor** → she is gone on return (and after a reload); HaX relays the executive badge if it wasn't taken; debrief "…while you were still working the building"
- [ ] **Call-in declined, then reload; reload mid call-in** → the hub still offers "Bring me in"; the debrief opens once (r13)
- [ ] **Minder states** (r7, r8, r12): talked past then punched → one hostile credit; turned back then picked → "Turned you back once"; hostile and slipped past → Satoshi "Kemal's still out there looking for you"
- [ ] **Reach Satoshi before flag 4** → "Not yet" defers; HaX nudges to flag 4; freeze is available on return
- [ ] **KO Satoshi** (`npc_ko:satoshi_nakamoto`) → `on_satoshi_ko` puts the asset decision by phone (freeze only with `found_wallet_keys`, else defer); re-openable from the HaX hub sticky option and by re-entering his office
- [ ] **Satoshi resists** ("You're being detained" from the opening, no evidence) → `arrest_resisted` → "Sit down" → `#hostile`; resolvable via the KO path
- [ ] **Skip the safe** → debrief acknowledges the missing identity rather than asserting it
- [ ] **Decisions in either order** → the call-in (`ready_to_extract`) waits for all of `assets_decided`, `irina_fate_decided` and the four flags
- [ ] **Reload mid-Satoshi after deciding** → he opens on `aftermath`, cannot pick both options
- [ ] **Re-talk after an ended conversation** → Irina, trader, analyst and Satoshi all loop back to a hub (never reach DONE); Irina routes to `after_choice` once her fate is set

## Continuity (with m05 / m07)
- The **$847,000** is the Architect's **acquisition budget** for the Quantum Dynamics job, paid **out** of the fund (slot 4471, `1ARCHITECT9FUND`) to the Insider Threat Initiative via the **TalentStack** wallet. It is not proceeds of selling data. Priya's write-up, daily report, opening briefing and phone all show it as an outbound payment.
- The $2.4M ransomware figure is inbound, pooled across victims (m02).
- The Architect = Dr. Adrian Tesseract (87% in the safe file) seeds the later reveal.
