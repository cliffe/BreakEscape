# Stage 8: bible and canon pass (m09, m10)

## Verdict

**Fix before assembly: no blockers, 3 majors, 7 minors.** The finale agrees with the bible and with shipped m01–m08 on the large facts: the name and the reveal, Nightshade recruited at 23 while Tesseract was chief strategist, the 2011/2017/2019 dates, the bunker's origin, the catalogue figure, the two dead agents, Netherton as director. The faults are smaller facts where the finale has drifted from what a shipped mission already told the player. The worst is the cracker supply chain: m03–m07 say SAFETYNET owns exactly one PIN cracker, ENTROPY's, and m10's incident file says stores bought 160 of them over three years. The other two majors are an m09/m10 contradiction about the refit drawings and an m09 briefing line that misreports m06's freeze.

This pass adds to `STAGE_8_BIBLE_PASS_A.md` (13 items) and `STAGE_8_CHARACTER_CANON_A.md`, and doesn't repeat them. One correction to pass A: its item 12 files the cracker supply chain under "extends the bible". It contradicts shipped m03–m07, so it belongs under "finale wrong" (F-01 below).

## Scope and method

Read: `docs/agents/FINALE_BRIEF.md`; m09 and m10 `stages/stage_6/lore_fragments.md` in full or by section; FINALE_ARC §1 and §5.2 plus targeted greps (rows 29, 117, 118); m09 and m10 ink (grep, with the briefing, identity scene, Tesseract, Netherton, Kowalczyk, Gary and six o'clock scenes read in part); `scenarios/m09_digital_archaeology/texts/A_hax_texts.md` (grep). Checked against: `the_architect.md`, `insider_threat_initiative.md`, `agent_0x99_haxolottle.md`, `director_netherton.md`, `voice_bible.md`, `notable_locations.md`, `story_arcs.md`, `recurring_elements.md`; shipped m01–m08 `scenario.json.erb` and ink, by grep and targeted reads of each debrief or confrontation the finale quotes. VM material not opened. Nothing edited except this file.

Severity: **major** means a returning player meets a fact that contradicts what an earlier mission showed them; **minor** means a smaller or branch-limited mismatch.

## Findings: finale wrong

**F-01 (major). SAFETYNET's 160 stores crackers contradict "we have one, it's ENTROPY's".** Owner: m10 (S6 and ERB), FINALE_ARC.
- Finale: `m10.../stage_6/lore_fragments.md:53` (incident file item 4: "Every PIN cracker 0x47 signed for in the last three years is withdrawn and held: 160 units, one supplier, four batches. Stores will buy elsewhere."); `:335-338` (bench log, G-14 to G-17, 40 each, to Gallatin); `:706`, `:1164` ("the bench sold crackers into SAFETYNET's own stores"), `:1199`; FINALE_ARC.md:129 (row 29), :2033.
- Shipped: `m03_opening_briefing.ink:203` ("No PIN cracker this time. Nightshade still has ours in pieces from St. Catherine's."); `m04_opening_briefing.ink:284` ("No PIN cracker. We have one, it's ENTROPY's, and it isn't leaving the lab."); `m05_insider_trading_opening.ink:249`; `m06_opening_briefing.ink:117`; `m07_opening_briefing.ink:54`; `m08_nightshade_confrontation.ink:175-178` ("I chose what you went in without."). m09's own handover keeps this ("the first since St. Catherine's", FINALE_ARC row 118).
- Problem: if stores had bought 160 crackers through Nightshade over three years, HaX's m04 line is false and the player's four cracker-less missions make no sense. Three years also reaches back before m02 (November 2024), when SAFETYNET had none at all.
- Fix (keeps the bench, Gallatin, four batches, 160 units and the WREN cloner): make the 160 an order that never reached the field. Incident file item 4: "4. Stores. After St. Catherine's, R&D ordered a SAFETYNET build of the captured cracker. The order went through 0x47's desk: 160 units, one supplier, four batches, delivered after Portland. None issued. All withdrawn and held." Change §2.5, §4.1 row 7 and §4.4 to "the crackers SAFETYNET ordered, through a front supplier, and never issued", and FINALE_ARC row 29 and :2033 to match. m09 `m09_briefing.ink:285` ("Stores froze everything Nightshade ever signed for") still holds. Kowalczyk's private cracker can stay: HaX's "we" is the service's stores.

**F-02 (major). m09's lease file says the refit drawings are in Helena; m10's plans say they aren't.** Owner: m09 S6 (one string).
- m09: `m09.../stage_6/lore_fragments.md:212` (`lease_file`: "Attached: as-built drawings, 1962; refit drawings, revision C."), and `:214` ("the paper half of the defences").
- m10: `m10.../stage_6/lore_fragments.md:86-104` (`helena_plans`: "From the construction file. Original drawings only. ... SUPERSEDED BY REFIT. Refit drawings not on file."), and `:592-606`: Nightshade's payment check works only because "the refit entries can't be checked against" the plans.
- Problem: if SAFETYNET took revision C out of Helena, the m10 payment is redundant and its lie (entry 3) can be checked against more than the 1962 drawing. The two missions describe one file differently.
- Fix: m09 lease text ends "Attached: as-built drawings, 1962. Refit drawings: withdrawn by lessee." The observation "A lease and a roll of drawings" stays true.

**F-03 (major). m09's briefing says the HashChain fund "was gone by the next day" on the branch where the player froze it.** Owner: m09 ink.
- m09: `m09_briefing.ink:180-182`: `m06_monitoring_enabled` gets "You tagged its wallets...", and every other `m06_completed` gets "ENTROPY's fund. You found it, and it was gone by the next day."
- Shipped: `m06_closing_debrief.ink:107-110` (assets_seized: "You froze it before the payout. When the clock runs out, it runs out on an empty wallet."). m10 agrees with m06: `m10_six_oclock.ink:318-323` (on `m06_assets_seized`, the $12.8 million goes to evidence or the victims' fund); the duty board's "POSTS UNMANNED: BUDGET" (m10 S6:188).
- Problem: on the seized branch m09 tells the player they lost the money; one mission later m10 says it is in evidence.
- Fix: insert an arm before the generic one: `m06_completed and m06_assets_seized` → "ENTROPY's fund. You froze it before it paid out. Twelve point eight million, in evidence." Keep "gone by the next day" for the remaining (deferred) branch only.

**F-04 (minor). "Frozen fund" on the monitoring branch.** Owner: m09 S6 / ERB.
- m09: `m09.../stage_6/lore_fragments.md:87` (`case_file` variant on `m06_monitoring_enabled`: "From: frozen fund, tagged. ... Monthly, since 2016.").
- Shipped: on monitoring the fund was left to run and its payouts tagged (`m06_closing_debrief.ink:109-110`, :156-160); it was frozen only on `assets_seized`. Tags placed in m06 also can't show ten years of rent.
- Fix: "5. HashChain tags, standing order. From: the Architect's fund, tagged. To: Big Sky Holdings LLC. Memo: RENT, SITE 2, MT. Monthly." The lease and rent ledger already carry 2016.

**F-05 (minor). "Big Sky was on Zero Day's client list."** Owner: m09 texts.
- m09: `scenarios/m09_digital_archaeology/texts/A_hax_texts.md:56` (A3-23a; also m09 S6:214).
- Shipped: `m03_ghost_in_the_machine/scenario.json.erb:51`: the active client roster the player reads lists GHOST, OBSIDIAN, VORTEX, CRITICAL MASS and ECLIPSE. No Big Sky.
- Fix: "Big Sky was in Zero Day's sales ledger. Sterling's keys opened it after Cardiff." m03 seizes that ledger with the marketplace (scenario.json.erb:169-170), which fits the arrested and KO branches this text fires on.

**F-06 (minor). m04's quiet branch with deaths wasn't called a maintenance fault.** Owner: m09 ink.
- m09: `m09_briefing.ink:155`, on every quiet save: "The report said maintenance fault, and you let it."
- Shipped: `m04_closing_debrief.ink:502` (quiet with `crew_lost`: "Nine deaths don't go in a drawer, so it's an industrial accident, cause under investigation."); :504 has "A maintenance fault, resolved" only when nobody died.
- Fix: split by `m04_crew_lost`: "The report said industrial accident, cause under investigation, and you let it." vs the existing line.

**F-07 (minor). "Their Cardiff broker was never identified" fires for players who identified her.** Owner: m09 ink.
- m09: `m09_briefing.ink:136-137`: the arm `m03_completed or not shorten` also catches an `m03_completed` save with no recorded fate (a pre-export run).
- Shipped: every m03 run ends at Victoria Sterling's choice (`m03_npc_victoria.ink`, fates set at :769-793); HaX names her in the m03 debrief.
- Fix: split the arm. `m03_completed` (no fate) → "Zero Day. Victoria Sterling, their Cardiff broker. You dealt with her." `not shorten` (never played) keeps the current line.

**F-08 (minor). "He sold them the database."** Owner: m10 ink.
- m10: `m10_director_netherton.ink:88` (cold start, `not m08_completed`).
- Bible and shipped: `insider_threat_initiative.md:75` ("Compensation: none. Belief was the payment."); `m08_nightshade_confrontation.ink:171` ("Not with money."); m09's own `nightshade_file` ("No payment. Belief is the payment.").
- Fix: "He opened the door for the database." Netherton is speaking loosely, but this is the one line a cold-start player gets about Nightshade, so it should match the canon.

**F-09 (minor). The incident file says the trace reached the coordinate on every branch.** Owner: m10 S6 / ERB.
- m10: `m10.../stage_6/lore_fragments.md:51` (item 3: "Followed to the coordinate on the Montana order."; "Changed by: nothing").
- Shipped: on the knock-out-before-fate branch m08 ends with no coordinate: `m08_closing_debrief.ink:233` ("We have a name from the vault, Tomb Gamma, and no coordinate."). FINALE_ARC §1.4 makes the deed in Helena that player's way to the bunker.
- Problem: if the watched door had led SAFETYNET to the bunker, the no-coordinate branch and m09's deed would have no purpose.
- Fix: "3. The door. Left open, under watch, to follow the copy. Risk accepted, on my signature." The core's file index ("vault line: Open. Their end is the Citadel.") and HaX's flag 4 line already carry the rest.

**F-10 (minor). "Irina's account paid for this."** Owner: m09 texts.
- m09: `texts/A_hax_texts.md:58` (A3-24, on `m06_irina_recruited`), at the rent ledger, which lists "acct ending 4471" paying the bunker's rent.
- Problem: next to that page, "Irina's account" reads as her bank account paying ENTROPY's rent. m06 recruits Irina as a source; she pays for nothing.
- Fix: "Irina's tip-off led us to this. Tell her it bought us the deed."

## Findings: harmless or by design

- **H-01. Derek's standing order and m01's fight branch.** `derek_file` (m09 S6:107) orders "if taken, put the device down and wait", and on m01's fight branch Derek moved toward his desk (`m01_closing_debrief.ink`, fight arm). The file is a forecast written before he was hired, and the Reading's fight entry ("Force first. Noted.") puts the fault on the agent. The surrender reread ("He was told to.") answers m01's open question ("or he's calculating") and doesn't contradict it. No change.
- **H-02. Torres "placed 1 yr".** m05 has Torres recruited three months before m05 (`m05_torres_confrontation.ink:141, 195`) and calls him one of the Recruiter's placements (`m05_phone_recruiter.ink:68-70`). With m05 "last spring", one year is close enough for a ledger. No change.
- **H-03. Graham Reeves on a Montana rota.** A UK hospital night supervisor from m02 now works in Montana (m10 S6:148). m02 never says which cell ran him, so m09's Initiative handler sheet and m10's rota don't contradict it. "G. Reeves" keeps him apart from m07's Michael Reeves. No change.
- **H-04. "Seven years" in m06 and in m09/m10.** If m06 had been in 2025 these would be a year out. m06's passphrases ("bitcoin2025", set once and never changed, `m06_closing_debrief.ink:441`) place m06 in 2026 with stale data. This confirms pass A's year note: consistent.
- **H-05. The bunker coordinate.** m08's 47.2382 N, 112.5156 W (`m08_nightshade_confrontation.ink:204`) is between Lincoln and Augusta, inside Lewis and Clark County and near the Sun River country, so "Sun River Regional Control Site, Lewis and Clark County" matches it.
- **H-06. Gary's casing at St. Catherine's** (`m10_gary.ink`: "I had one of those behind my server cabinet ... in a case nobody ever inventoried"). It agrees with m02's cracker "out of their kit in the server room" (`m02_closing_debrief.ink:132`). It also implies the bench was making crackers in 2024, before last year's refit. The bench can predate the refit; nothing says otherwise.
- **H-07. Tesseract's lines on m01–m04** (`m10_tesseract.ink:236-242, 434, 456, 529`) match the shipped facts: bed four at St. Catherine's (`patient_bed4_deceased`), nine in Hall 2 at Albion (`m04_closing_debrief.ink:402`), the three m04 disclosure arms, infusion pumps "three years" (m10 S6:417). "I've read the inquiry" on a quiet-with-deaths save fits m04's "cause under investigation".

## Bible notes for later

Don't edit the bible now. Items already in pass A or character canon A are not repeated (Tomb Alpha and Beta as separate missions, the year, Netherton's "Isabella", 0x88 "Fortress", "Cipher", the ∂S sign-off, "never directly encountered", the U1 and same-lecture notes).

1. **SAFETYNET has no crackers of its own until after Portland** (once F-01 is fixed): the one ENTROPY cracker from St. Catherine's, held by Nightshade "for study" in m03–m07; a SAFETYNET build ordered through his desk, made on Tomb Gamma's bench via Gallatin Instrument Supply, delivered after Portland and never issued. Home: `02_organisations/safetynet/technology_resources.md`.
2. **`notable_locations.md:289-296`, Tomb Gamma** ("Location: hidden", scenario "The Final Cipher"): now the Sun River Regional Control Site, a 1962 civil defence control site in Lewis and Clark County, leased 2 June 2016 to Big Sky Holdings LLC, refitted 2025; mission m10 *Full Disclosure*. The finale's refit drawings are not in Helena (F-02).
3. **`director_netherton.md:33`, "SAFETYNET Foundation (Year -15)"** puts the founding in 2011, the year of Nightshade's intake and HaX's STRAT-204 notebook. The finale doesn't contradict it, but "Intake 2011" is then the first intake, and Tesseract held his post from the founding. Worth a sentence in `the_architect.md` so later writers don't put his SAFETYNET years before 2011. The same file's "20+ years service" for Netherton predates the founding; that's an older bible inconsistency, not the finale's.
4. **`the_architect.md:120-125`, "Formation of ENTROPY"** ("expanded ... over 5-7 years") and `notable_locations.md:271` ("operated for decades"): the finale puts the Initiative's legacy placements at 2009–2018 and Nightshade's recruitment at 2011, so ENTROPY is at least 17 years old. Set one figure.
5. **`insider_threat_initiative.md:29-31`, the Recruiter** ("Over 100 successful insider recruits"): the m09 ledger has 23 placements, 47 candidates, 11 legacy. Either soften the bible figure ("across her career") or note that the ledger is the current series.
6. **`insider_threat_initiative.md:75`**: add that the recruitment form uses SAFETYNET's own intake paperwork with his notes ("Ask properly."), and that WREN came in through Harwick & Lowe (closed before TalentStack opened). Pass A item 11 covers the rest of the older programme.
7. **m06 fund outcomes** for `06` or the HashChain cell file: seized → $12.8 million in evidence (Council keeps it on `secured`, else victims' fund); monitored → payouts tagged, including rent to Big Sky Holdings. (F-03, F-04.)

## Checked and consistent

- **Same-lecture note**: STRAT-204 (17 October 2011 notebook) and Tomb Alpha's workshop; HaX "He gave that lecture every year." (`m09_alpha_recording.ink:26`); margin note → annotation sheet → m07 handset as three stages of one line; HaX "my old course notebook" in the identity scene. Consistent with `agent_0x99_haxolottle.md:243-245`, and HaX's "15+ years service" and Vienna (Year -12) fit a 2011 start. ("A room of twenty, once" is character canon A's harmless note.)
- **The reveal**: Netherton says the name first, on flag 3 (`m09_phone_agent0x99.ink:329`), as `the_architect.md:41` requires; HaX's m06 "87 per cent" and "Satoshi's guess" match `m06_closing_debrief.ink:529`; no ENTROPY character names him before.
- **Nightshade**: 23 in 2011, "fifteen years" (m09 briefing, m10 Nightshade), recruited by his teacher while chief strategist, matching `m08_nightshade_confrontation.ink:170-172, 205`; the go-bag ticket to Helena (`m08 scenario.json.erb:1184`); "Same classroom" (`m08_closing_debrief.ink:66`).
- **Catalogue and badge figures**: 92,460 is exactly m08's four figures (`m08 scenario.json.erb:1905`: 47,239 + 12,847 + 8,923 + 23,451). 1,206 badges, Trojan Horse 47 million and 14 million (`m07_opening_briefing.ink:240`), and $12.8 million (`m06_closing_debrief`) all agree. Nothing in the bible gives a staff count to clash with.
- **m01–m08 facts the finale quotes**: Derek Lawson and Viral Dynamics' Social Fabric cell; "He's not cooperating" on arrest, refused the deal on recruit ("martyrs", `m01_closing_debrief.ink:732`); m02 ransom £150,000, Gary's warnings May–November 2024; Victoria's four fates, "filled by Monday" (`m03_npc_victoria.ink:778`), Danny Foster, CPS; Albion, Voltage, Static (Polish, voice bible:298), Vance; Torres' five fates, Elena's treatment, 23 placements and 47 candidates (`m05_insider_trading_opening.ink:190`), the Recruiter as a woman in her fifties; Fracture in Washington (election), Trojan Horse in Austin, Meltdown in San Francisco (4,200 hospitals), the team "held over Denver" with no assignment (`m07 scenario.json.erb:212`), Seattle's first step, two agents dead, Hollis "two children" (`m07_closing_debrief.ink:494`), Reeves and Ashford "not there"; m08 day nine, "seventy-two hours".
- **Names**: no Director Cross; Netherton is director everywhere; Marcus appears only as Marcus Ashford (m07's Digital Vanguard leader), never as Tesseract's brother or with the institute; no Quantum Cabal (m05's "Quantum Dynamics" is the shipped company). Chens: only Maya Chen (m01), correctly. Reeves: "G. Reeves" and "Michael Reeves" kept apart. Ghost: m02's Ghost by name; "Ghost Protocol" kept off player-facing text (m10 S6:19, :1077). Okafor: not used. Elenas: Torres (m05) is named in full in the credits.
- **The bunker**: m08's "old Cold War bunker in Montana" fits the 1962 civil defence site; FINALE_ARC, m09 S6 and m10 S6 agree on the name, county, lessee and date (apart from F-02's drawings).
