# Milestone review, stages 0–3: consistency and canon

## Scope and method

Reviewer: fresh read-only reviewer (Opus), 2026-10-21. Lens: cross-document and cross-mission consistency, and canon. Nothing was edited except this file.

Read in full: `docs/agents/FINALE_BRIEF.md`, `scenarios/FINALE_DEV_LOG.md` (F1–F13 and the orchestrator rulings), and the live text of nine documents:

| Short name | File |
|---|---|
| FA | `finale/FINALE_ARC.md` §1–9, §13, §15–16 |
| m09 s0 | `m09_digital_archaeology/stages/stage_0_initialization.md` |
| m09 SA | `m09_digital_archaeology/stages/stage_1/story_arc.md` (§15–18 are review records) |
| m09 SE | `m09_digital_archaeology/stages/stage_2/storytelling_elements.md` |
| m09 MC | `m09_digital_archaeology/stages/stage_3/moral_choices.md` (§13–15 are review records) |
| m10 s0 | `m10_full_disclosure/stages/stage_0_initialization.md` |
| m10 SA | `m10_full_disclosure/stages/stage_1/story_arc.md` (§15–18 are review records) |
| m10 SE | `m10_full_disclosure/stages/stage_2/storytelling_elements.md` |
| m10 MC | `m10_full_disclosure/stages/stage_3/moral_choices.md` (§15–17 are review records) |

Line numbers are as of this review. VM_SHAPE, FINALE_VM_PLAN, the SecGen module plan, SecGen and the field guides were not opened. Canon was checked against the shipped `scenarios/m01_*`–`m08_*` ink and erb and `story_design/universe_bible/`. The import and export tables were checked with a script (method in "Export and import script check"). Items FA §15–16 already lists as open are included only where they are still live, and are marked "known".

## Verdict

**Not clean, but close: 0 blockers, 4 majors, 19 minors.** Stages 0–3 are consistent with each other on the things that carry the most weight. The import and export plumbing is script-clean (44 and 67 imports, 38 export additions, eleven m09 exports, every default and ✱ mark right). The timeline in UTC holds across both missions. The Publication's two modes, the 04:00 / 06:00 marks, the disclosure timescale (tonight / ninety days / a year), the cracker canon, WREN's single goal, the double-cross branch's clean core, the cells ledger, F11 and F13 all read the same in every live document. 35 of 38 canon spot-checks match the shipped missions.

The four majors are each small to fix but would ship wrong if built as written:

1. **MS-01**: the finale moves m03 and Victoria's Zero Day desk to London. m03 is in Cardiff, and the line about Victoria's threat edits her shipped words.
2. **MS-02**: the best recruited-Victoria outcome (trusted once Zero Day's share is dead) keeps her watch, but the database choice's list of operations leaves it off.
3. **MS-03**: m10's stage 1 keys the briefing arrest and `sleeper_caught` on `m09_sleeper_named` alone, which is also true on the double-cross.
4. **MS-04**: five stale "closing card" lines for the Recruiter, and no home at all for her state on `taken` or `refused`.

The minors are mostly sweep work (stale copies listed below) plus three small canon corrections (MS-13, MS-14, MS-22) and one cast contradiction (MS-06). One fix pass by the mission authors with a grep afterwards should clear them; the majors are worth one combined confirmation read before stage 4 starts, because MS-02 and MS-03 change conditions that stage 4 will wire.

## Findings

"Authority" names the document or source the fix should follow.

| ID | Sev | Docs and lines | Evidence | Problem | Fix (authority) |
|---|---|---|---|---|---|
| MS-01 | major | FA:135 (row 34), FA:284 (never-played m03), FA:590, FA:665 (ledger 4–5); m09 SA:458 (m03 card); m10 SA:117, :239, :241, :468; m10 SE:258, :512; m10 MC:213, :233, :234, :638 | Shipped m03 is set in Cardiff: `m03_opening_briefing.ink:293` "WhiteHat Security, Callaghan Square, Cardiff". Victoria's threat (`m03_npc_victoria.ink:737`) is "My associates offered to deal with you." with no place. No m03 ink or erb line mentions London. | The finale puts m03 and Victoria's Zero Day desk in London: "Zero Day's London broker", "her London book", "Zero Day's London desk", "a security guard in London" (Terry Mott, the £500), and adds "In London" to the front of her m03 threat. A player who played m03 will hear a city that never appeared. | Replace "London" with Cardiff where it means m03 ("a security guard in Cardiff"; drop "In London" from her threat, which then matches m03 word for word). For the desk and book, say "Zero Day's UK desk" / "her UK book", or Cardiff. (Shipped m03.) |
| MS-02 | major | m10 MC:411 (operation 1), :210 (trust row), :652 (§11 item 27), :711; FA:529 (§4.1 step 4, item 1), FA:1198 (§13 item 27); m10 SA:372 | m10 MC §3.5 trust row: with Zero Day's share dead, "the lock at once, and both her watch and the Zero Day tap survive: the best result". Same in FA:588 and m10 SA:238. | The database choice's operation 1 reads "the watch on a recruited Victoria (confronted or refused)". On the best Victoria outcome (trusted with the share dead) her watch survives but is not on the list, so secure can't roll it up and disclose can't burn it. The list and the gallery table disagree about which branches keep her watch. | Operation 1 applies on `m03_victoria_fate == "recruited"` and `victoria_gallery` in `confronted`, `refused`, or `trusted` with Zero Day's share dead at the time (the same test `head_start_out` uses, m10 MC:674). Change m10 MC:411, FA:529 and the §11 / §13 item 27 wording ("who held, was refused, or was trusted with the share dead"). (m10 MC §3.5.) |
| MS-03 | major | m10 SA:69 (§3 beat 1), m10 SA:81 (beat 10 named form), m10 SA:262 (§8 first sentence) | `sleeper_named` is true on both `taken` and `double_crossed` (m09 MC:562; FA:374; FA §3.4 L471). FA §3.5 (L490) and m10 MC §12 (L672) set `sleeper_caught` at load only on `m09_sleeper_named and m09_recruiter_offer = "taken"`; m09 SA §7.1 checks `double_crossed` first for the same reason. | m10 SA keys "Quintero cuffs Kowalczyk against the van", the aside's named form, and "sleeper_caught is true from the start" on `m09_sleeper_named` alone, with the double-cross variant listed second. Built in that order, a double-cross save plays the arrest of a woman who isn't there. FA §16 rem. 5 asked stage 4 to check; the live text is still wrong. | Condition the cold-open arrest, the aside's named form and §8's opening on `m09_recruiter_offer == "taken"`, or state "double_crossed checked first" as m09 SA §7.1 does. (FA §3.5, m10 MC §12.) |
| MS-04 | major | m09 SA:223 (Take row: "closing card: the Recruiter at large"); m09 MC:136, :137, :138, :139 ("Closing card: …" on all four routes); m09 MC:444; m09 MC:560 ("closing card (one rule)"); m10 s0:81 ("the Recruiter: named in the closing card by branch") | FA §4.6 L675 and m10 MC §6.2 L350: the card is five lines and the Recruiter has no line of her own; only `double_crossed` gets an "Elsewhere" clause; `named` reaches the close only as a fallback ledger cell. | Stale card lines in five places. And the design gap FA §16 rem. 3 names is still open: on `taken` and `refused` (her network left in place) nothing in m10 says her state at all, though m09 MC's route table promises the player a payoff. | Replace the stale card wording with "Elsewhere" wording. Add one "Elsewhere" clause per value at stage 7: `taken` / `refused` "The Recruiter: at large, her people at their desks."; `named` "The Recruiter's network: rolled up." (unless the ledger already took it). (FA §4.6, m10 MC §6.2; clause wording new.) |
| MS-05 | minor | m10 MC:91; m10 SA:203, :206; m10 SE:478 | FA row 107 (L234) and §3.2 (L434): the `nightshade_copy` door line plays "on the talking branches, not after the shown-file text"; m09 MC:78 and m10 MC's own §7 (L534) and §11 item 38 (L660) say "at the door". Orchestrator ruling at the stage 3 fold: FA's scope. | The three m10 documents still restrict the line to the arrested branch, so the triple-agent-not-shown save with `nightshade_copy` loses it. Known (FA §16 rem. 1); not yet applied. The word is now "notes" everywhere (fixed). | Add the kept-not-shown branch to m10 MC §3.1, m10 SA §7.1 and m10 SE §3.5. (FA row 107, orchestrator ruling.) |
| MS-06 | minor | m09 SE:262 vs m10 SE:447, :593 | m09 SE: "Officer Kenji Arakawa. 41, Japanese-American, from Sacramento". m10 SE: "raised in Seattle, lives in Billings"; cast table "Seattle / Billings". FA §5.2 gives no town. | Two home towns for one officer. Seattle is also Jesse Tran's home town (m09 SE:211) and m07's blackout city. | One line in both: "from Sacramento, lives in Billings" keeps m09 and avoids a third Seattle. (Either; m10's Billings is load-bearing for his 02:10 call, so keep it.) |
| MS-07 | minor | FA:156 (row 50), FA:391 (§3.2 `m04_vance_is_ally`: "after a captured Voltage"), FA:888 (§9: "a captured Voltage kept on the phone") | FA row 44 (L150): "The phone slot is not used on this branch"; FA §5.3 L755 and m10 SA:161: captured Voltage is in the room, so no phone voice. | Three FA copies of the round 3 "keep him on the phone" option, removed at round 4 (N-02). | Row 50: "Vance if an ally, else Elena if turned, else HaX; not used when a captured Voltage is in the room". §3.2: "the phone slot when Voltage isn't captured". §9: mark superseded. (FA row 44, §5.3.) |
| MS-08 | minor | FA:10, :772, :837; m09 s0:140; m10 s0:149 | FINALE_BRIEF:16, :60, :64: the VM work moved from Haiku to an `opus48` agent on 2026-10-21; `FINALE_VM_PLAN.md` already exists (dev log stage 0 R2). | "by a Haiku agent", "the Haiku VM plan fits the modules", "Haiku VM plan: fit the modules" read as future work by the wrong agent. FA:922 is a dated log entry and can stay. | "The VM plan (`finale/FINALE_VM_PLAN.md`) …"; drop the agent name from the next-steps lines. (Brief.) |
| MS-09 | minor | FA:832 (§8 r8) | §1.5 (L60–72) no longer says "before dawn". | The risk row points at a phrase that was swept. | Drop the last sentence of r8's default. (FA §1.5.) |
| MS-10 | minor | m09 SE:244 | m09 SA §14 change 2 and stage 0 sweep: the order is "read and let go on", not intercepted; FA §15 swept "intercepts". | Quintero's secret: "she doesn't trust the intercept". | "she doesn't trust the order". (m09 SA §3.1.) |
| MS-11 | minor | m09 MC:240 ("This is the same, bigger."), m09 MC:549 ("Ranked last of the second claim's four record answers"), m09 SA:583 ("ranked last of the second claim's record answers") | FA §4.1 table L544 and m10 MC §6.3 L365: slot pools, clean record in slot 4 after `m09_albion_notified`; HaX's line is "This is that letter, a thousand times." (P41). | Known (FA §16 rem. 2); still live in m09's own documents. | Carry m10's wording into m09 MC §3.5, §9 item 33 and m09 SA §13. (m10 MC.) |
| MS-12 | minor | m10 MC:532, :534; m09 MC:167, :241, :271, :378, :544, :550, :560, :562, :564, :566, :567 | FA §16 (L1475–1480): all of these were applied at the fold. | "(proposed)" and "proposed import" labels on decisions that are now in force; a stage 4 reader can't tell settled from open. | Drop the labels in the live sections (§3–§10); leave §11 / §14 as the record. |
| MS-13 | minor | FA:97 (row 6) | m09 SE §5.1 L469–471, the Reading's innocents entry: "On their first day they put a bystander on the floor…" / "Not one bystander hurt on their first day. Rare. It will not last." Shipped m01: only Sarah O'Brien is the receptionist (`scenario.json.erb:555, :569`); Maya Chen and Kevin Park are not. | FA row 6 quotes the entry in the second person and as "you hurt a receptionist", which is wrong on `maya_ko` and `kevin_ko` and breaks the Reading's "they" register. | Quote m09 SE's lines in row 6. (m09 SE §5.1.) |
| MS-14 | minor | FA:193 (row 76); m10 SE:70; m10 MC:488 | `m06_satoshi_confrontation.ink:540–551`: three values, `rejected` ("No. Your ideology doesn't cover murder."), `wondered`, `refused` ("I'm not debating this with you."); Satoshi asks "before they come", not in cuffs. | The finale handles `wondered` and `rejected` only. Its `rejected` line, "You told him no without thinking. Think now.", describes `refused`; `rejected` was a reasoned no. "A man in handcuffs" is not what happened in m06. | `refused` gets "You told him no without thinking."; `rejected` gets its own line or the neutral offer. "You told a man waiting for the police…". Import values unchanged. (Shipped m06.) |
| MS-15 | minor | FA:643 vs FA:656; m10 SA:450 | FA §4.6: "Join's frame is the Citadel." | The same row and m10 SA §10.7 put "the casualty curve on the forward post's screen" in the Join frame, which has no forward-post scene. | "on the Citadel's screen" (or a screen in HaX's office). (FA §4.6.) |
| MS-16 | minor | FA:525; m10 SA:351; m10 SE:96; m10 MC:344 | FA:624 and m10 MC:403: on `double_crossed` she is standing in the core, and "Quintero comes in from the lock and takes her". | "with a glance at the service door she was taken through" contradicts her being taken out by the lock side. | "the service door she came in by". (m10 MC §6.4.) |
| MS-17 | minor | m10 MC:209; m10 SE:381; FA:133 (row 32), FA:588 | m10 MC:209 says the tap "goes quiet by morning", then quotes Netherton "The Zero Day tap went dark at four." | Two times for one event in one cell; FA says "by morning". | Pick one: "went dark at five" keeps "by morning" and leaves the 04:00 lock beat alone. (m10 MC.) |
| MS-18 | minor | m10 s0:93; m10 SA:74 | m09 never voices Tesseract on the call; HaX's report (m09 SA:356, m09 SE:437) is: Ninety-nine; the door will open for you by name; take your time; did they like his notes. | m10 s0 quotes him as saying "Bring 0x00. I've kept a door."; m10 SA paraphrases "kept a door". Not in m09's report. | Use m09's report: "the door will open for 0x00 by name; take your time getting there". (m09 SA Beat 3.6.) |
| MS-19 | minor | m09 SE:133 | m09 SE:535: HaX's notebook is "fifteen-odd years old". | "nine years younger … the Albion memo and his margin notes in HaX's training notebook" puts the notebook at nine years. | "and, older still, his margin notes in HaX's training notebook". |
| MS-20 | minor | FA:171 (row 60), m09 SA:211, m09 SA:291, m09 SE:536 | Tapes are "his recorded teaching at the first workshop" (Tomb Alpha, an ENTROPY site); HaX: "Tape two. He gave that lecture every year." and "That's the version he taught us." (her SAFETYNET course). | It is unclear whether Tomb Alpha's tapes are recordings of his SAFETYNET lectures or of ENTROPY teaching that repeated them. Stage 6 lore will have to pick, and the m10 record answer ("You told them to carry it") depends on who "them" is. | Settle at stage 6: he gave the same lecture at SAFETYNET and at Tomb Alpha, and HaX recognises it. One line in FA row 60. |
| MS-21 | minor | m09 SE:258 vs m10 SE:441 | m09 SE Malhotra: "Secret: none tonight." m10 SE: a post-m08 re-vetting he hides, "why he asked to run the Helena line himself in m09". | The m10 secret is retro-fitted onto an m09 beat whose document says he has none. Not a contradiction in play, but stage 7 writing m09 from m09 SE will miss it. | m09 SE: "Secret: one he keeps till m10 (m10 SE §3.4)". |
| MS-22 | minor | m09 SA:266; m09 SE:149 | Helena is the seat of Lewis and Clark County; the archive is "on the edge of Helena" (m09 s0:78). | "A county clerk's office moved forty miles" beside a Lewis and Clark County service certificate puts the old office forty miles from the county seat. | Drop "moved forty miles", or make her the clerk of a neighbouring county (Broadwater, Jefferson). |
| MS-23 | minor | m10 SA:71, :264 (split start), m10 SE:122, m09 SE:503 | FA §15 rem. 5–7 (L1369–1371). | Still open (known): no start time for the pre-breach split after 01:58; "Nobody fixes anything until it hurts everyone at once" can read as the old premise; m09's "double-counts" vs FA's "credits the hospitals' recovery twice". | As FA §15 says: stage 4 (time), stage 7 (two lines). |

## Export and import script check

A Python script (kept in the session scratchpad, not the repo) parsed FA §3.1, §3.2 and §3.3 and each `scenarios/m0N_*/scenario.json.erb`. For every import it checked: alias = `mNN_` + var; the "From" folder exists; an unstarred name is already in the source's `exportGlobals`; a ✱ name is in the source's globals but not yet exported; a ✱✱ name is absent from the source; the FA default equals the source's `globalVariables` default. It then compared §3.3 with the ✱ set, and m10's `m09_*` imports with the eleven exports.

| Check | Result |
|---|---|
| m09 imports | 44 (Tier 1 19, Tier 2 25), no duplicates; matches FA §3.1 L362 and §16 |
| m10 imports | 67 (Tier 1 40, Tier 2 27), no duplicates; matches FA §3.2 L440, §16, m10 s0:146, m10 MC §7 |
| Alias, folder, export status, ✱ / ✱✱ marks | no mismatches (the two ✱✱ names, `m02_reeves_fate` and `m07_teacher_discussed`, are correctly absent from their sources) |
| Defaults against source `globalVariables` | no mismatches |
| §3.3 export additions | 38; equal to the set of ✱ imports; every name is read by m09 or m10 |
| m09 exports vs m10 `m09_*` imports | eleven and eleven, same names: `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, `cage_bin`, `legacy_files_saved` |
| Same list in the stage docs | FA §3.4 L482, m09 SA §9 L444, m09 MC §10 L572, m10 MC §7 all agree |
| Value sets | `recruiter_offer` (`taken` / `double_crossed` / `named` / `refused`), `deck_pulled` pairing (`none` / `her_file` / `alpha_tapes`), `recruiter_secret` (incl. `denied`), `hax_confession_answer` (incl. `afterwards`) and `cage_bin` agree across FA §3.4, m09 MC §10 and m10 MC §7 and §12 |
| m10 exports | seven names (FA §3.5) and m10 MC §12 agree, including `executed` and `partial_release = published` |

The only export-name problem is a guard, not a name: MS-03 (`m09_sleeper_named` read without `recruiter_offer`).

## Canon spot-check

38 claims about m01–m08 and the bible, weighted towards the meanings of Tier 1 imports. ✓ = matches shipped text; ✗ = contradicts it (finding ID given); ~ = close paraphrase, harmless.

| # | Claim in the finale docs | Where claimed | Shipped evidence | Verdict |
|---|---|---|---|---|
| 1 | HaX's m08 line "Same classroom, 0x00. Don't ask me whose yet.", on every branch but the knock-out before the fate | FA §1.1, m09 SA §1 | `m08_closing_debrief.ink:63–66` (inside `not nightshade_ko_before_fate`) | ✓ |
| 2 | Netherton: "Take your seventy-two hours. Then we go to Montana and we get it back." | FA §1.1 | `m08_closing_debrief.ink:231` | ✓ |
| 3 | m08's last line "Montana in seventy-two hours. Tomb Gamma." | FA §1.4 | `:252` "Montana in seventy-two hours, Agent. Tomb Gamma." | ~ |
| 4 | Netherton's pledge "We will not say one aloud until we can prove it" is an optional hub topic | FA row 125 | `m08_closing_debrief.ink:220` | ✓ |
| 5 | Netherton: "Two of ours are dead in the space between what I knew and what I did" | m09 SA Beat 3.3 | m08 debrief (DIALOGUE_REVIEW cites it) | ✓ |
| 6 | "If he burns you, it is on my signature" | FA §5.5, m10 SA §7.1 | `m08_closing_debrief.ink:185` | ✓ |
| 7 | Nightshade: "the man who put me here fifteen years ago"; a Cold War bunker in Montana | FA row 106, §1.1 | `m08_nightshade_confrontation.ink:205` | ✓ |
| 8 | The go-bag's one-way ticket to Helena for the morning after Portland | FA §1.4, row 116 | m08 go-bag text (`ALIGNMENT_REVIEW_P5_C2.md:100` quoting erb :1823) | ✓ |
| 9 | ATHENA: the PIN cracker "still signed out to Agent 0x47" since St. Catherine's | m09 SA §3.4 | `m08_opening_briefing.ink:21` | ✓ |
| 10 | Nightshade: "I chose what you went in without" | FA row 29 | `m08_nightshade_confrontation.ink:178` | ✓ |
| 11 | Vector 0x23 carries a crypto annex badge; Phantom's audit and Zurich flight | FA rows 112, 121 | `m08_director_netherton.ink:122`; `m08_suspect_phantom.ink:98`; 40 / 36 uses of the prefixes | ✓ |
| 12 | "Every vulnerability SAFETYNET has ever catalogued" went to Tomb Gamma | FA §1.1 | `m08_nightshade_confrontation.ink:198` | ✓ |
| 13 | m08's never-played line: "one team to send"; dispatch in eleven counties drops calls from day nine unless Austin was covered | FA §1.5, §3, row 83 | `m08_opening_briefing.ink:30–40` | ✓ |
| 14 | HaX's line "Let it hurt afterwards, not during" is in m07 | FA row 120 | `m07 scenario.json.erb:853, :863, :870` | ✓ |
| 15 | m07 dossier: "Everything the cells field has been through Gamma first. Including the people." | FA §1.4, row 95 | `m07_closing_debrief.ink:635`; erb :2348 | ✓ |
| 16 | The Architect on the m07 handset: "I prefer to watch"; "files are written by people who need you to be a particular shape" | FA §2 intro, m10 SE §2.2 | `m07_architect_comms.ink:101` | ✓ |
| 17 | Mercer: "When the fourth submission is declined, agent, somebody does this." | FA row 87, m10 SE §3.6 | `m07_npc_james_mercer.ink:411` | ✓ |
| 18 | Trojan Horse: 47 million systems; redirect stopped at about 30 per cent, 14 million | FA rows 81–82, m10 SA §6.3 | `m07_opening_briefing.ink:170`; `m07_closing_debrief.ink:201` | ✓ |
| 19 | Fracture is Ghost Protocol (Michael Reeves) with Social Fabric, 43 states' voter records; Meltdown is Digital Vanguard (Marcus Ashford); Trojan Horse is Jennifer Walsh | FA rows 84, 103, §4.6; m10 s0 §3 | `m07_opening_briefing.ink:133–135, :153, :189, :222` | ✓ |
| 20 | Mercer is Critical Mass's leader ("Blackout") | m10 s0 §3, m10 SE §3.6 | `critical_mass.md:25–26`; `m07_npc_james_mercer.ink:3` | ✓ |
| 21 | Ray Hollis has two children; "Analysis wants her. I have not decided" (Elena Rodriguez); Seattle lost power on `countdown_expired` | FA rows 86, 90, 92 | `m07_closing_debrief.ink:494, :480, :110` | ✓ |
| 22 | HaX named Tesseract in the m06 debrief as Satoshi's 87% guess, only on `architect_identity_found`; "Walked out seven years ago" | FA §1.1, row 70 | `m06_closing_debrief.ink:519–536` | ✓ |
| 23 | $12.8M in the Architect's fund; "The Architect keeps spares"; Irina's condition "used, not buried" | FA rows 74, 79, 80 | `m06_satoshi_confrontation.ink:303, :586`; `m06_npc_irina_volkova.ink:541` | ✓ |
| 24 | `satoshi_stance` is `wondered` / `rejected`; "a man in handcuffs" | FA row 76 | `m06_satoshi_confrontation.ink:540–551`: also `refused`; asked before arrest | ✗ MS-14 |
| 25 | The Recruiter: "the next one might cost me more"; the deal is "let my courier have it", no money | FA rows 60–61, m09 MC §3.3 | `m05_phone_recruiter.ink:255, :183` | ✓ |
| 26 | Twenty-three placements, forty-seven candidates, TalentStack | FA row 63 | `m05_closing_debrief.ink:459, :464`; `m05_phone_recruiter.ink:66` | ✓ |
| 27 | Torres was after the national dispatch network's keys (UK 999); Elena Torres is his wife, in a US trial | m09 SA §10.1, m09 SE §2 | `m05_phone_recruiter.ink:131`; `m05_npc_lisa_park.ink:173–177`; erb :1908 | ✓ |
| 28 | m05 `final_choice` values `turn_double_agent` / `arrest` / `combat_nonlethal` / `combat_lethal` / `public_exposure` | FA rows 64, 64a | `m05_closing_debrief.ink:48` | ✓ |
| 29 | Albion is a grid battery site; on `full` every other storage site is audited | FA §1.3, m09 SA Beat 3.4 | `m04_opening_briefing.ink:41, :64`; `m04_closing_debrief.ink:489` | ✓ |
| 30 | Nine of the night crew died on `crew_lost` | m10 SE §2.1 | `m04_closing_debrief.ink:153` | ✓ |
| 31 | Voltage: "Above him it stops being a person you can arrest"; "it'll be waiting" (his print) | FA rows 45, 58 | `m04_npc_voltage.ink:270`; `m04_closing_debrief.ink:223` | ✓ |
| 32 | Vance is Teesside; Calder Wharf is Social Fabric's safehouse from the go-bag card | FA rows 50, 55 | m04 erb :1459; `m04_closing_debrief.ink:238` | ✓ |
| 33 | m03 / Victoria: "I'm a desk. They'll have it filled by Monday"; "proof of concept"; "whether she stays turned is anyone's guess"; "When do we go at the Architect directly?" | FA rows 32, 41–43 | `m03_npc_victoria.ink:778`; `m03_closing_debrief.ink:253, :170, :571` | ✓ |
| 34 | m03 is in London (Zero Day's London broker; the guard in London; "In London my associates…") | FA §3, rows 34; m10 SA, SE, MC | `m03_opening_briefing.ink:293`: Cardiff; no "London" in m03 | ✗ MS-01 |
| 35 | m02: Ghost "Not the money. The lesson."; "We'll be watching"; "I hope it's you leading it"; HaX "They're not wrong about the problem"; forty hospitals; six died, Mr Pryce in Bed 4 | FA rows 13–20, 31 | `m02_phone_ghost.ink:573, :611, :625`; `m02_closing_debrief.ink:610, :475, :365–377` | ✓ |
| 36 | Gary: seven warnings; protected is "Director of Cyber Security"; unprotected and quiet was fired; HaX's "fifth person … overhead" line | FA row 23, m10 SE §3.5 | `m02_closing_debrief.ink:542, :553, :587`; `m02_phone_agent0x99.ink:445` | ✓ |
| 37 | m01: Derek Lawson, Senior Marketing Manager ("a marketing manager"); "The Architect planned for this"; Sarah O'Brien the receptionist, Maya Chen, Kevin Park | FA rows 1, 6, 9; m10 SE §2.2 | `m01_opening_briefing.ink:103`; `m01_derek_confrontation.ink:449`; erb :555, :1525, :1811 | ✓ (row 6's "receptionist": MS-13) |
| 38 | Bible: Tesseract, former chief strategist, a man in his sixties; HaX a handler for seven years (fits "It's HaX. It has been for seven years."); Netherton is Magnus; voices (Voltage Johannesburg, Static Polish, Recruiter Gacrux DC) | FA §5.1; m09 / m10 SE | `the_architect.md:35–43`; `agent_0x99_haxolottle.md:11, :36`; `director_netherton.md:7`; `voice_bible.md:297–304` | ✓ |

Two of 38 contradict shipped canon (MS-01, MS-14); one carries a wrong detail (MS-13). The rest match.

## Name clashes

Every finale name and codename was grepped across `scenarios/`, `story_design/`, `docs/` and `planning_notes/` (ink, erb, md), excluding the finale's own documents and the user's m09/m10 theme-song drafts.

**Clashes to fix or watch**

| Name (finale) | Also in | Risk | Suggestion |
|---|---|---|---|
| Priya (m10 gallery guard, Imran's friend) | m02: Nurse Priya Raval at St. Catherine's (`m02_npc_roaming_nurse.ink:2`, `m02_npc_ward_nurse.ink:97`); **also** sis02_energy: "Priya S." from the NCSC, at the Albion site (`sis02_energy/CAST_DESIGN.md:11`) | high: Imran worked in St. Catherine's IT, so the m02 nurse is the obvious misreading; the sis02 one is a second, not yet listed in FA §5.2 | Rename at stage 7 (known, FA §5.2 / §16 rem. 4); add the sis02 Priya to the note |
| Margaret "Peg" Sorensen | m02: "Margaret Okafor", a patient on an appointment card (`m02 scenario.json.erb:3429`) | low (different surname; an object, not a character), but Okafor is already a listed clash name | None needed; she is "Peg" or "Mrs Sorensen" in speech |
| Ghost (Ransomware Inc.) and Ghost Protocol (Michael Reeves) | both appear in m10's close: Ghost's 06:00 text and the card's cells line ("…Ghost Protocol was not among them.", m10 SA:468) | medium: the three-Ghosts hazard from the brief, now on one screen | Stage 7: the card names the cell by leader where it can ("Reeves's cell"), or Ghost's text stays unsigned |
| Graham Reeves (m02) and Michael Reeves (m07) | both in m10 (the rota sheet; the closing card / credits) | medium (known; FA row 21 says "no relation") | Keep the first name on every on-screen use |
| Seattle | Jesse Tran grew up there (m09 SE:211); Arakawa "raised in Seattle" (m10 SE:447); m07's blackout city | low | MS-06 |

**Checked and clean** (no hit outside the finale documents): Noor Haddad, Jesse Tran (only "Kevin Tran" in unshipped m05 planning and one lore fragment, already noted in FA §5.2), Cody Old Coyote, Lodge Grass, Marisol Quintero, Halina Kowalczyk, Dev Malhotra, Kenji Arakawa, Pieter Vos, Abena Asante, Imran Siddiqui, Sparkhill, Wendell Briggs, Dale, Teresa Villanueva, Callum Fraser, Ana Lúcia Ferreira, Harwick & Lowe, Mountain States Records & Retention, WREN, "Anchor", "Lantern" (only as a word in a lab's word list), and the new agent codes 0x19, 0x2D, 0x5E, 0x6B. Vector 0x23 and Phantom 0x88 match m08. "Tesseract" also names `lab_tesseract_trials`, whose DESIGN.md already retires it from the fiction.

## Stale copies found

The folds swept most superseded wording. What is left in live text, by the decision it predates (each is also a finding above):

| Superseded decision | Live copies left | Finding |
|---|---|---|
| The Recruiter has a closing-card line | m09 SA:223; m09 MC:136–139, :444, :560; m10 s0:81 | MS-04 |
| Captured Voltage can be kept on the phone (round 3) | FA:156, :391, :888 | MS-07 |
| `nightshade_copy` line on the arrested branch only | m10 MC:91; m10 SA:203, :206; m10 SE:478 | MS-05 |
| "Ranked last" clean record; "This is the same, bigger." | m09 MC:240, :549; m09 SA:583 | MS-11 |
| "Proposed" stage 3 changes, now applied | m10 MC:532, :534; m09 MC §3–§10 (eleven places) | MS-12 |
| The VM plan as Haiku's future work | FA:10, :772, :837; m09 s0:140; m10 s0:149 | MS-08 |
| §1.5's "before dawn" | FA:832 | MS-09 |
| The order "intercepted" | m09 SE:244 | MS-10 |
| The Reading in the second person, "a receptionist" | FA:97 | MS-13 |
| "Bring 0x00. I've kept a door." (pre-stage-1 call wording) | m10 s0:93; m10 SA:74 | MS-18 |

Checked and clean in live text: "Director Cross", "plays both ends", `alpha_tapes_saved`, "within the hour", "Put me on speaker", "I've paused it", "kept his letters", the 75 / 100-minute lengths, "Tomb Gamma" as m10's title. Where these words remain, they sit in decision logs or review records that say they are superseded.
