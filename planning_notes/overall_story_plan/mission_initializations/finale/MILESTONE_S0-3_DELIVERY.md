# Milestone review, stages 0–3: does the finale deliver, and can it be built?

## Scope and lens

Fresh read-only reviewer, 2026-10-21. Read: `docs/agents/FINALE_BRIEF.md`, F1–F13 in `scenarios/FINALE_DEV_LOG.md`, AGENTS.md "Kinds of game", the `mission-alignment-plan` skill, FINALE_ARC §1–9 and §13, and for both missions stage 1 `story_arc.md`, stage 2 `storytelling_elements.md` and stage 3 `moral_choices.md`, with stage 0 skimmed. No VM plan, SecGen or field guide was opened. A few engine claims were checked against the code by search only (no KO-immunity key in `js/systems/`; the credits scroll lives inside `music/bond-visualiser.js`; `tools/playtest/new-game.rb --imports=<file.json>` seeds a save).

The lens: does the design deliver what the user asked for (carry everything, felt and not name-checked; the six endings; no eldritch content beyond a teaser slot; fun and educational, not hard), and can it be built and tested at a sensible cost?

Short abbreviations: FA = FINALE_ARC, SA = stage 1 story_arc, SE = stage 2 storytelling_elements, MC = stage 3 moral_choices.

## 1. Five save histories, walked

Each walk lists the moments where the player feels an earlier choice, in play order. "Felt" means a person, a door, a route or a line someone says to them at the moment it matters. Name-checks on a card or in the credits are listed separately.

### 1.1 Careful and merciful

**Save.** m01 Derek arrested, nobody hurt; m02 Gary protected, Ghost refused, Pryce kept alive by hand, the board exposed, Reeves arrested; m03 Victoria arrested, Danny protected; m04 Voltage captured with his print lifted, full disclosure, Vance an ally, Calder Wharf found; m05 the list found and kept, Torres turned, Elena's treatment funded; m06 the 87% file read, the fund monitored, Irina recruited; m07 Trojan Horse direct (Austin covered), `owned`, the echo heard, the teacher discussed, Mercer arrested; m08 Nightshade arrested, Vector and Phantom apologised to, `owned`. m09 picks: refuse and pull her file (`named`), Derek's file, Sorensen talked down, Tran talked off, the notice sent, "I'd have done the same in your place."

**m09.**
- Briefing: Calder Wharf is the reason the order was caught ("Your card from Albion."); the wall reads as a run of wins; Victoria's CPS case is Netherton's legal cover; the m08 card carries Netherton's visit to the arrested Nightshade.
- Front desk: Noor already knows SAFETYNET, gives the side-door card and has held back the legacy box. This is the best m05 payoff in the finale: a person the player saved, saving something else.
- The cage: Sorensen quotes "You read him his rights" back; Derek's file kept; the Reading's entries are kind and therefore unsettling.
- Open stacks: Torres rings from inside the Initiative ("I gave you this address in the spring.").
- The Recruiter: no deal to hold over the player; "This is the next one."
- Tape room: Gary rings with the code hint.
- Office: the lease file's one line goes to Victoria's keys. **Irina's line and Danny's line are both lost to the priority order** (finding D-07).
- Albion papers: HaX's `full` line, and the inquiry line before the send.
- Identity scene: the m06 form ("You should have taken it to Netherton.") and the echo line.
- Debrief: "Then I sign for him too." and his name beside Nightshade's.

**m10.**
- Briefing: Voltage in the second van; Vector and Phantom at the table; Mercer's statement on the map.
- Door: Nightshade in cuffs; "[No deals. I said it then.]" is first, and Quintero's "I'm glad you didn't."
- Ghost: "You turned me down. Why?", and the answer chooses the gift (the lock code).
- Workshop: Gary at the door, "You saved my career.", and Imran to talk round.
- Power room: Voltage at his own switchgear ("I could. Watch my hands.").
- Server hall: no backdoor channel, and "You took Austin from me." Victoria rings from custody about Vos.
- Core: the strongest record answers on every exchange (`full`, the hospital, Pryce, the clean first day, Voltage's hands, the clean Recruiter record, the Albion notice). Surrender is the natural end.
- 06:00: Quintero, Voltage, Gary and Imran in the walkabout; the card's Albion clause ("Parliament answered", plus "SAFETYNET answered"); "Elsewhere" carries Elena and the forty-seven.

**Verdict.** Rich and specific: this is the "everyone you saved comes back" finale, and it feels earned. The risk is the reverse of the brief's worry. Allies open almost every door (Ghost's code, Voltage's cut, Gary's door, Victoria's information), so tension rests on the whodunit and the core alone (finding M-08).

### 1.2 Ruthless

**Save.** m01 fight; m02 ransom paid, Ghost's deal accepted and broken, keys used, Pryce died, Gary not protected, Reeves escaped; m03 Victoria knocked out; m04 quiet, Voltage escaped with no print, crew lost; m05 the forty-seven let go for a clean report and never confessed, Torres killed; m06 fund frozen, Satoshi told "I sometimes wonder", Kemal walked; m07 Austin left uncovered, `hardened`, Mercer knocked out; m08 Nightshade kept as a triple agent, Vector accused and not apologised to, Netherton and HaX hit. m09 picks: take the name, keep Nightshade's file, knock out Sorensen and Tran, hold the notice, "You should have told me."

**m09.**
- Cold open: Netherton takes the chair furthest from the player's. HaX: "You put me on the floor at the Citadel. I'm still running you." Both land well.
- Briefing: "Day eleven. Eleven counties." The order was caught via Nightshade's ticket, so the player's own work isn't the reason. A quiet, correct sting.
- Flag 1: Nightshade on the phone, right about the cage ("I hate that he's right.").
- The cage: Sorensen quotes the fight; the Reading's entries read as a charge sheet.
- Ledger: Torres reads "closed placement" in her hand, and HaX is silent for a beat.
- The Recruiter, sold and lied: "Forty-seven names, and nothing points at you. Does your handler know?" with HaX listening. This is the season's sharpest carry-over moment, and it is a choice, not a line.
- Office: "St. Catherine's money. It bought the blast door."
- Flag 4: "Kemal Aydin walked out on a smaller number than this."
- Albion papers: the quiet player is asked to do with his letter what they didn't do with theirs.

**m10.**
- Fence: two empty posts, "That's your freeze."
- Door: Nightshade's warm map, with a tripwire unless the player checks it against Helena's plans. The trust test lands on the player who trusted him.
- Ghost: the locked side door, "We said we'd be watching.", Ghost watching the route by text, and Imran keeping his card on him.
- Workshop: Gary as an Initiative technician beside Imran.
- Power room: Voltage at the switchgear, with no print to prove it.
- Gallery: Vos, who "knows who put her in a hospital bed".
- Server hall: the large backdoor channel (47 million).
- Briefing and forward post: Vector declines; the Council's casualty curve sits on the projection desk.
- Core: his evidence ("You buried it. You understand me better than you admit."; "You beat a marketing manager and called it a war."; "'I'd make it again.' You would."), the ledger stings (crew lost, Pryce), the invoice, and on `kept` "I'll deal with that when this is done." Few record answers, so the talk-down rests on the rebuttals. Fewer than two points leads to the hand on the key and the justified-lethal beat.
- Card: dispatch still dropping calls; the forty-seven not reached.

**Verdict.** Distinct and satisfying: a harder conversation, not a harder level, which is what F1 and the brief ask. The cost is mostly heard rather than walked; the route is about as easy as the careful one. That suits "not hard".

### 1.3 Chaotic, many knock-outs

**Save.** m01 Derek knocked out before he chose (`final_choice = ""`), Maya, Kevin and Sarah knocked out; m02 a patient struck, staff floored; m03 Victoria, Terry and Ffion knocked out; m04 Voltage escaped, operatives floored; m05 `combat_nonlethal`, staff floored; m06 Irina and Satoshi knocked out; m07 Mercer and Hollis knocked out; m08 Nightshade knocked out before his fate (no coordinate), HaX and Netherton hit, floor staff knocked out. m09 picks: knock out Old Coyote, Sorensen, Tran and Noor; let the deck wipe (`taken`); hang up on nothing. m10: knock out whoever is in the way.

**m09.**
- Briefing: "We have Helena. Not the bunker. Not yet." The deed becomes a task; this works well. The chair line and HaX's KO line both play.
- Loading dock: "Maya Chen would have flagged him. We don't have Maya's names." Tran is a surprise and calls in a guard.
- Reading: "On your first day you hurt a receptionist." / "You struck a patient on a ward."
- Cage: "She's sixty-six." The KO saves the legacy box, so force is rewarded and that is said aloud once.
- Debrief: concussion and lawyer lines for Sorensen, Tran and Old Coyote. **Knocking out Noor has no design** (no global, no debrief line, nothing about her held box; finding M-02).

**m10.**
- Door: silent Nightshade, "Door.", and the tether question.
- Mercer is in custody with no map line.
- Gallery: Vos in Victoria's place.
- Raid team: knocking out a member holds them at the post and costs a line.
- Core: knocking out Tesseract is caught by the fallback (arrest or Scorched Earth, with the exchanges and the end-for-him choice lost). Netherton gets "a dressing over one eye".
- Core record: the clean-first-day answer is gone.

**Verdict.** The m01, m02 and m08 knock-outs are felt, and the in-mission knock-outs are well handled. **The pattern isn't.** Bystander knock-outs from m03 to m08 are dropped (FA rows 27, 39, 78, 115), so a player who floored their way through six missions is judged only on day one and the ward. Nobody in either mission says "you hit people" as a habit, which is the one thing this history would most expect to hear from a man who has "watched" (finding D-06).

### 1.4 Cold start at m09

**Save.** Nothing. m09 picks: double-cross the Recruiter, pull the letters, leave Sorensen, send the notice, "Afterwards. Not during."

**m09.**
- Briefing: the wall's never-played sentences act as a sixty-second "previously on", and the suspect is described without a name. Tran gets the neutral warning; the Recruiter is a stranger who knows the player's designation; Noor is a wary bystander.
- Reading: the never-played forms ("Somebody at SAFETYNET is careful with you.").
- Identity scene: Netherton's sentence gives the "who is Tesseract" beat. It works because the name is introduced by the people who knew him. What the player can't feel is the m06–m08 build-up, and nothing could give them that.
- Double-cross: the text in the tape room, and Kowalczyk's empty place in the hangar ("Her crate is still on the ramp."). Strong; this history makes its own carry-over.

**Felt from earlier missions:** nothing, by design. The mission stands on its own: the purge, Sorensen, the Recruiter and the name hold up for a stranger. The wall risks being eight sentences about strangers in sixty seconds (see M-11). The m09 cold-start player's m10 is the double-cross branch: WREN beside Tesseract at the core, nobody wounded, no whodunit.

### 1.5 Cold start at m10

**Save.** Nothing (m10 is the first mission). Picks: tether Nightshade, talk Ghost out, talk Imran round, tell Wendell, deal with Vos, kill Zero Day's share, accuse correctly, two points, surrender.

**m10.**
- Briefing: about 45 extra seconds. Netherton says who Nightshade is, then the name ("proved from his own hand") and the hour in front of the team; WREN comes at the aside. HaX and Netherton introduce themselves by job.
- Every slot uses its default: silent Nightshade, Ghost as a stranger selling, Imran, Wendell, Vos, Asante.
- Core: rebuttals only, with the rebuttal 2nd, 1st and 3rd on the menus. HaX's flag-4 lines carry the unsent notice so exchange 2 has its evidence. "Still HaX." and "the rest" play without their m09 setup but read on their own.

**Felt from earlier missions:** none. That is correct, since no line tells the player about a choice they didn't make (MC rule 9). The mission works, and the whodunit and the core argument are self-contained. What thins out is Tesseract himself: a stranger meeting a stranger. One cheap gain is the nickname, said at the briefing (M-09).

### 1.6 Are the five finales distinct? Threads that still don't pay

**Distinct, yes.** The careful player gets a reunion and a surrender, the ruthless player a hostile bunker and a man who knows them, the chaotic player a bunker found the hard way and a fallback-heavy core, and the two cold starts get standalone thrillers. The device that does most of the work is m10's five slots, each with a different person by branch. In m09 it is the Recruiter's call. Neither reads as a roll-call. The brief's test ("who turns up, who helps, who betrays, what's possible, what's said to them") is met for every history except the knock-out pattern.

**What the ending depends on.** Imports never gate (MC rule 6), so all six endings are open on every save and the season shapes cost, people and wording, as F1 asks. A careful save makes surrender easier through record answers but never necessary, since the rebuttal is always on the menu. That is right.

**Threads that still pay off nowhere** (beyond the justified drops in FA §2):
- Bystander knock-outs from m03 to m08 as a pattern (D-06).
- Irina's line and Danny's line on any save where Victoria was arrested or knocked out; Danny's "asked again last week" plays only when Victoria is recruited or escaped (D-07).
- How the player caught the mole in m08 (`suspect_theory`, `named_on_evidence`, dropped at round 1). m10's whodunit tests the same skill again, and one line at the aside could tie the two ("You caught the last one on evidence.") (M-12).
- Noor knocked out (M-02).
- Smaller drops that are fine as they stand: Kevin's choice, Dr Kim, Park, Elena Rodriguez fled, Marcus Tesseract (brief rule), Okafor, `promised_voltage_alive`, m03 stance flags.

## 2. The two missions as a pair

**m09 sets up m10 well.** m09 hands over the four things it promises (name, ledger, defences, hour) plus the things m10 actually plays on: the raid team's four faces and their beats, Kowalczyk's cracker, the key that needs a hand, the Reading's prediction, the Albion notice as evidence for exchange 2, HaX's unpaid "the rest", "Ninety-nine", and eleven exports, each of which changes something in m10. The handover between the two documents is unusually tight (one-voice rules, the shared forced-phone rule, the cracker canon, the casualty sheet and its correction).

**The reveal is earned.** The 87% file (m06), the line and the voice (m07), "Same classroom" (m08), then the name proved two ways in m09: a never-revoked staff credential and the handwriting matched against HaX's own notebook. Holding the name until flag 3, and giving it to Netherton with HaX's confession straight after, puts the weight on the people who knew him. The best single decision in the finale is that the confession costs something specific: two agents died while she sat on the name.

**One plot fault in the pair** (D-01). On the `named` branch, her tape (her file) holds the SAFETYNET placement files (FA row 63: "Ours are on her tape"), and Netherton says "The arrests start tonight". Both should expose or warn WREN before m10, yet m10 runs the whodunit with WREN unwarned.

**A second, smaller one** (M-04). The bunker's readers accept SAFETYNET badges because "Tesseract loaded SAFETYNET's own credentials from the stolen database". A vulnerability catalogue that holds staff credentials is a category error, and this is a teaching game.

**Season arc closed.** HaX's arc ends at 06:00 with "the rest", paid on every ending except the cold one and Join, each with its own last word. Netherton's culpability (m08 `owned`) and his chapter on raids by invitation pay at the van window. The Architect gets a face, a case, and an end the player chooses. ENTROPY is left standing in a believable way: the Recruiter, Zero Day's 0day, Social Fabric's leader and the cells the ledger didn't take, all of which Season 2 can use. Tesseract's motive holds: he needs a SAFETYNET hand, and if the player stops it he gets a courtroom ("Then we do it the slow way. In court."). Surrender and the lethal endings deny him that, which makes them the player's win over him. The design never says this outright; one line in his case would make his calm at the console read as strategy rather than passivity (M-10).

**Six endings, each earned.** All six come after the same four flags and are chosen at the core by action, with the cost stated first:
- Join needs three deliberate steps.
- The cold ending is labelled, confirmed and removable.
- Scorched Earth has its own logic (nobody holds the map) and its own cost (suspension, nothing fixed).
- Arrest and surrender are separated by F13's trade (a trial against cells), which is a real choice.
- The justified-lethal beat is reached through a failed talk-down and a real threat, with "Hold fire" always safe.

Each has its own 06:00 beat and last word. The weakest is justified lethal: "Quieter than any other success", with the board named for after the credits. That is fine.

**Teaser slot.** It sits after the closing card and before the credits roll, behind `teaser_enabled`, default off, with nothing set up or depended on. This is placed correctly per F3. One tone point (M-03): after Join (the casualty curve climbing) and the executed ending, a few seconds of cosmic horror risks reading as a joke at the season's darkest moment. Consider showing it only on endings that reach 06:00, or let the user judge the content against all six.

## 3. Fun and not hard

**m09 (85 minutes with the field guides, 95–100 without).** This is well paced. Every act has a spike, and the purge moves on story events, so slow VM work costs nothing. The night's order is locked step by step (SA §11), so the player always has one next place to go. Choices come one per room, each priced aloud before the pick. Act 2 is the densest (the cage, the bins, Nightshade's file, the ledger, the call, two optional scenes), but it is also where the optional content and the cut order sit. The 7-minute VM-stage figure is an assumption (SA §2); get a real figure from m07 and m08 play data or an early timed VM run before stage 4 fixes the beats (M-14).

**m10 (about 105, ceiling 110; 108–115 for a first-time player).** The structure is sound: a crowded Act 2, a silent gallery, a quiet core. Three things work against "not hard" and "always knows what to do next".

- **The head start is the most opaque system in the season** (D-03). There are two shares, five ways to stop each, a console that kills one or traces one, gallery outcomes that depend on which share is still live (trusting Victoria is safe only if Zero Day's share is already dead), and a release at the lock. None of this state is visible. A player can't plan around what they can't see.
- **The gallery is overloaded** (D-04). Counting branch × option, the room holds about fifteen outcomes, in the one stretch where HaX can't speak. Her last line before the jam has to carry up to three warnings plus the sweep line.
- **The close is under-budgeted** (D-05). "Close 5 minutes" has to hold the ending's own beat, a walkabout of up to five people, Netherton's numbers, the database beat, the van, "the rest", two texts, the conclusion screen, a five-line card, the teaser and credits with per-person clauses. A realistic figure is 8–10 minutes, which puts a first-time run at about 115–120 unless something is cut now.

**Choice load.** m10 has about 19 picks on a rich save (MC §2), ten forced, five of them in the full scenes, plus three exchanges, the accusation and the whodunit's clues. That is a lot, but each scene has one decision after the talk, which keeps it readable. m09 has 14, many optional. The core's sequence (flag 4, case, Recruiter beat, three exchanges, console, WREN, database with eight lines of costs, end-for-him) is long but linear, and each menu re-enters on reload.

**The VM work woven in.** Good in both missions. m09's flags 1–2 are worked in the reading room while the shredder runs; flags 3–4 sit beside Tomb Beta's server with the identity scene on flag 3. m10 has flag 1 at the gate while Arakawa's 02:10 alibi happens around the player, flags 2–3 in the server hall, and flag 4 at the core with Tesseract watching. Flag 4 is the one place where VM time could flatten the climax: about 8 minutes of terminal work with the villain seated across the room (M-13). Idle lines driven by events are the right fix; keep them few and good.

## 4. Teaching

**Taught through play: yes.** The disclosure argument is something the player does three times before they argue it:
- m09's notice is a real send-or-hold with a stated operational cost (the Critical Mass watch) and, on some m04 branches, a reputational one (the inquiry).
- m10's server-hall console is the database question in small: stop the harm, or let it run and learn who takes it.
- m10's database menu has a case and a cost for each of secure, disclose and wipe, said by the person with a reason to say it.

The argument at the core then draws on the player's own record (m02 exposure, m04 disclosure, the m09 notice). This is the right way round for the brief's "learning through play, not lectures".

**Accurate: mostly, and better than most games.**
- Disclosure runs at its real speed: acknowledgement within hours, a fix on about a ninety-day window, a year or more to reach industrial sites, some never patched. Flaws that can't be patched go to operators with workarounds, not into a public list.
- The equities trade-off (patch the hole and lose the way in) is stated plainly by Netherton.
- Holding the flaws has a named victim (infusion pumps in 140 hospitals).
- m09's flag 3 rests on a leaver's credential that was never revoked, which is a real and teachable control failure.

**Where a student could be misled.**
1. **The title and framing conflate full disclosure with a mass exploit dump** (D-02). "Full disclosure" is a real, defensible practice: a researcher publishing a flaw, usually after a vendor has ignored them, with a long history and its own mailing list. The Publication is something else: every working exploit released at once, with no warning to anyone, priced at 1,100–2,600 dead. Nothing in either mission tells the two apart, and the mission is called *Full Disclosure*. A student could leave thinking the security community's full-disclosure position is the villain's. Keep the title (the irony is good, and the player's `disclosed` option is coordinated disclosure), but give one character one line that draws the line. Netherton or HaX at the briefing would do: "Full disclosure is one researcher, one flaw, after the vendor stops answering. This is every weapon we hold, handed out at once." Label the menu option "coordinated disclosure" in the button text or HaX's line.
2. **Credentials in a vulnerability database** (M-04). See §2. Move the credential source to Nightshade's access or WREN's badge work, or call it the vault's personnel index taken with the database.
3. **The leaver credential is a free lesson the design doesn't take** (M-05). One HaX line at flag 3 ("Seven years, and nobody turned it off.") plus a field-guide pointer would land the joiner-mover-leaver control without lecturing.

## 5. Buildability

**State.**
- m09 imports 44 (19 Tier 1, 25 Tier 2), sets about 25 local globals and exports 11.
- m10 imports 67 (40 Tier 1, 27 Tier 2) and sets about 40 local globals (MC §12).
- The m01–m08 export additions come to 38, two of them needing ink changes.

Earlier missions import at most a handful (m02: 3). Tiering is the right control, and "imports never gate" keeps the risk to wrong lines rather than soft-locks. The part most likely to go wrong is the derived logic (`points_landed`, `head_start_out`, the cells ledger with seven sources and a six-step fallback order, the closing card's precedence rules, "In this operation" clauses in meeting order). Each is a small program written in ink and JSON conditions, and none has a test harness yet.

**Testing.**
- m09: about twelve covering routes plus three named ones, and a reload in each of four forced phone scenes.
- m10: 35 runs, 20 of them full-length covering profiles. At roughly 105 minutes each with VM flags, that is about 35 hours of agent play for m10's full profiles alone, before any fix-and-rerun loop. Seeding a save works today (`tools/playtest/new-game.rb --imports=<file.json>`).
- The plan's ten "core-start" profiles assume the game can start at the core with globals injected. Nothing like that exists yet (D-10).

**Engine items: which to settle before stage 4.** They are ranked by how much design rests on each and how unsure the build is.

| Rank | Item | Why it matters now |
|---|---|---|
| 1 | **KO immunity** (m10 36; m09 7, Sorensen non-combat) | No such key in `js/systems/`. Without it, every forced face-to-face NPC needs an `npc_ko` net that writes defaults and done-flags (Tesseract, Netherton, Nightshade on three branches, Malhotra, Sorensen, the slot-holders), plus test runs 24 and 31–33. A `nonCombat`/`koImmune` NPC flag is probably a small change and removes most of that. Decide first (D-08). |
| 2 | **The closing sequence** (FA §4.6, §7; m10 47, 44) | Conclusion screen, then a five-line computed card, then the teaser, then credits with per-person "In this operation" and "Elsewhere" clauses. The credits scroll lives inside `bond-visualiser.js`; there is no card step or clause format. This is the season's last screen and both missions write to it. Spike it and fix one data format for credit clauses now (D-09). |
| 3 | **Forced phone scenes with re-ring and resume** (m09 17; m10 32–33) | The Recruiter's call crosses speakers, has two resume points after a "yes", and must survive a reload. Ghost's and Victoria's calls have the same need, plus silence in the jammed room. The whole m09 spine depends on this pattern. Build one working call early and reuse it. |
| 4 | **One unlock event for the outer lock, whichever way it opened** (m10 39) | Five ways in (picked, card, an NPC's `unlock_door`, Ghost's code, a Victoria who holds). `head_start_out` is computed on that one event. If any route skips it, shares are silently never released or never stopped. |
| 5 | **Object text that reads a global** (m10 38; m09 10) | The countdown objects in every room and the outer lock's "EARLY ACCESS: RELEASED". The design's whole clock depends on it. Probably easy; confirm. |
| 6 | Choice menus and unvoiced texts inside cutscenes (m10 44; m09 27) | Both debriefs and the 06:00 walkabout. m08's debrief stance suggests menus work; texts during a cutscene are unverified (M-15). |
| 7 | Music step-down per landed point, and silence (F10) | Lower risk than logged. SE §8 already notes the music block switches tracks on a global change; silence is a silent track asset. Close F10 without an engine change (M-06). |

Lower risk (they follow known patterns): the item-against-object check (37), the camera switch (46), guard counts on a global (42), per-room companion staging (43), "[Stop her.]" as a knock-out from dialogue (40), and the m09 legacy box and bins (19–20, 29). Item 48 and part of 39 still refer to Ghost's "window" gift, which stage 3 replaced with the code and the lock-card holder (M-01).

**Simplify now.** These are cheap to drop at the design stage and expensive after stage 7 has written lines for them:
1. **Cut the media room now** rather than build it and cut it at stage 8 (D-05). Its payoff survives as a prop and a HaX line (SA §2 cut 1). This saves a room, a crew, a task, art and two test branches.
2. **Gallery: two options per branch** (D-04). Drop Vos's talk-out and the arrested-Victoria use-or-keep sub-decision (use it automatically; Netherton's "in a drawer" line moves to the keep-only case, or goes).
3. **Record-answer pools: at most two candidates per slot** (FA §4.1 table). The current pools have up to five entries in slot 4 of exchange 3, plus openers keyed on the previous exchange's result.
4. **The cells ledger: a fixed rule.** Surrender gives two; the trace or the bait gives one; secure gives one; m07 by its rule. Drop the seven-source fallback chain, which no player will see and every tester must check.
5. **Walkabout: at most three picks**, Quintero first.
6. **Vector and Phantom: keep, but as presence and one effect each.** They are already cleared by clue 2; their "shared cost" on a wrong accusation can go.

None of these touches the five scenes, the three clues, the exchanges, the stated costs or the endings, the things the user's aims rest on.

## 6. Findings

0 blockers, 10 majors, 15 minors. Line numbers are as of this review. Paths under `planning_notes/overall_story_plan/mission_initializations/`.

| Id | Sev | Location | Problem | Fix |
|---|---|---|---|---|
| D-01 | major | `finale/FINALE_ARC.md:174` (row 63: "the files on SAFETYNET placements went onto the Recruiter's tape"); `m09.../stage_3/moral_choices.md:138` ("The arrests start tonight"); `m09.../stage_1/story_arc.md:214` | On `named`, the player saves her tape, which holds the SAFETYNET placement files, and her network is arrested overnight. Either should name or warn WREN before m10, yet m10 runs the whodunit with WREN unwarned and unknown. A logic hole on a main branch. | Say the tape holds handlers and placement files **by codename only**; the key from codename to person was the Recruiter's alone (which is why her "name" is worth buying). Netherton holds the arrests until 06:00 on day 13: "The arrests start at six. Not before. WREN would hear." Stage 7 wording in m09's debrief and m10's aside. |
| D-02 | major | `finale/FINALE_ARC.md:24,30` (§1.2), §8 r14 (the title); `m10.../stage_3/moral_choices.md` §6.5 | Nothing tells the security community's full-disclosure practice apart from the Publication (every working exploit at once, priced in deaths), and m10 is titled *Full Disclosure*. Students may learn that full disclosure is the villain's position. | Keep the title. Add one line, once per mission (m09 flag 4's read or the debrief; m10 briefing): full disclosure is one researcher publishing one flaw after a vendor stops answering; this is every weapon released at once. Call the player's option "coordinated disclosure" in HaX's or Netherton's line before the menu. |
| D-03 | major | `finale/FINALE_ARC.md:556` (§4.2 head-start row), `:585,588` (§4.4) | The head start's state (two shares, kill or trace, which share is still live, five ways to stop each) is invisible, yet gallery outcomes depend on it (trusting Victoria is safe only if Zero Day's share is dead). The player can't plan, so the system plays as hidden rules. | The countdown object in each room shows two status lines ("ZERO DAY: LIVE / STOPPED / TRACED", "SECOND BUYER: ..."), set by the same globals. Add a HaX hub topic, "What's still live?". The design already computes the globals; this only displays them. |
| D-04 | major | `finale/FINALE_ARC.md:588–590` (§4.4 Victoria rows), `:743` (§5.3 gallery slot), `:762` (HaX's last line before the jam) | The gallery carries about fifteen outcomes across five occupant branches, in the one room HaX can't reach, and her pre-jam line has to carry up to three branch warnings plus the sweep line. It is the most complex scene in the season, at the point where the player most needs to be calm before the core. | Two options per branch. Drop Vos's talk-out and arrested Victoria's use-or-keep (use it automatically). Move "Netherton sweeps the whole place at six" to the server hall's exit so the pre-jam line carries one warning. |
| D-05 | major | `m10.../stage_1/story_arc.md:34–58` (§2 budget); `finale/FINALE_ARC.md:643–677` (§4.6) | The first-time figure is already 108–115 against a 110 ceiling, and "Close 5" can't hold the ending beat, a walkabout of up to five, Netherton's numbers, the database beat, the van, "the rest", texts, the conclusion screen, the card, the teaser and the credits. Realistic: 115–120. | Cut the media room now (don't build it); cap the walkabout at three; budget the close at 8 and the end-to-end at 105 after the cut. Stage 4 sets per-beat figures against that. |
| D-06 | major | `finale/FINALE_ARC.md:97` (row 6), `:123,140,195,242` (rows 27, 39, 78, 115 dropped) | A player who floored bystanders through m03–m08 is judged only on m01 and the m02 ward. The finale never recognises the habit, which is what this history most expects from a man who has "watched". The brief asks for every decision that can be carried. | One derived boolean per mission where a KO global already exists (`mNN_bystander_ko`, JSON-only under F4 where possible), read in m10 as one of Tesseract's ledger stings ("Seven missions. You hit somebody who wasn't armed in five of them.") and as the clean-record test. Tier 2; no new scene. |
| D-07 | major | `m09.../stage_1/story_arc.md:278` (lease file "one line by branch, in priority order"); `finale/FINALE_ARC.md:137` (row 36), `:191` (row 74) | Priority-collapsed lines swallow careful players' payoffs. With Victoria arrested or knocked out, Irina's and Danny's lines never play, and Danny's "asked again last week" needs Victoria recruited or escaped. The player who did the most good hears less. | Split the lease file's lines across objects: Victoria's on the lease, Irina's on the tagged-payment object or the refit ledger, Danny's on Zero Day's note as its own small object. Each object gets one line, and no line excludes another. |
| D-08 | major | `m10.../stage_3/moral_choices.md:24` (rule 10); `finale/FINALE_ARC.md:516` (§4.0 nets) | KO immunity doesn't exist, so the design carries both a planned engine feature and an `npc_ko` net for every forced face-to-face NPC, plus test runs 24 and 31–33. That doubles the work on the most fragile scenes. | Settle before stage 4: add an NPC `nonCombat` / `koImmune` key (likely a small change in `npc-combat.js`). Keep nets only for Tesseract after the end-for-him menu opens, and for slot-holders the design wants knockable. |
| D-09 | major | `finale/FINALE_ARC.md:643–677` (§4.6), `:814` (§7) | The close (conclusion screen, five-line computed card, teaser, credits with "In this operation" and "Elsewhere" clauses by global) has no engine home. `bond-visualiser.js` owns a credits scroll only. Both missions write to it, and stage 7 will write dozens of clauses. | Spike now. Define one clause format (`{ when: <condition>, text: <string>, block: "operation" / "elsewhere", order }`) in the scenario JSON, a card step in the conclusion flow, and the teaser step behind `teaser_enabled`. |
| D-10 | major | `m10.../stage_3/moral_choices.md:954–985` (test plan) | 35 runs, 20 full-length (about 35 hours of agent play before any reruns), plus m09's ~15 and regressions on eight missions' new exports. The ten core-start profiles assume a start-at-room-with-globals bootstrap that doesn't exist (`new-game.rb` seeds imports only). | Build a "start in room R with globals G" bootstrap before stage 8. Split full profiles into act-start segments (forward post, server hall, gallery, core) so each branch is covered once in a 15–30 minute run, and keep three true end-to-end runs (kind, hard, cold). |
| M-01 | minor | `m10.../stage_3/REVIEW_R1_STRUCTURE.md:328,337` (engine 39, 48) | Engine items still name Ghost's "window" gift (`ghost_gift == "window"`); stage 3 replaced it with the maintenance code and the lock-card holder. | Strike 48 and the "Ghost's window" route in 39 when stage 5 copies the list. |
| M-02 | minor | `m09.../stage_1/story_arc.md:381` (debrief "The archive"); `m09.../stage_3/moral_choices.md` §2 | Knocking out Noor has no global, debrief line or credit, and her held box on the warned branch has no stated fate. | `noor_ko`; her desk's box stays on the desk; one debrief line; m10 "Elsewhere" clause. |
| M-03 | minor | `finale/FINALE_ARC.md:814` (§7) | The teaser runs on every ending, including Join (the casualty curve climbing) and the executed ending; cosmic horror right after either may read as flippant. | Show it only on endings that reach 06:00, or give the user the six endings when the content is chosen. |
| M-04 | minor | `finale/FINALE_ARC.md:512` | "Tesseract loaded SAFETYNET's own credentials from the stolen database": a vulnerability catalogue holding staff credentials is a category error in a teaching game. | Credentials came with the theft from the vault's personnel index, or from Nightshade's access, said once. |
| M-05 | minor | `finale/FINALE_ARC.md:782` (§6.1 flag 3) | The never-revoked leaver credential is a ready-made lesson that isn't drawn out. | One HaX line ("Seven years, and nobody turned it off.") and a field-guide pointer. |
| M-06 | minor | `finale/FINALE_ARC.md:846` (§8 r22); `m10.../stage_2/storytelling_elements.md` §8 | F10 is logged as needing an engine change, but SE §8 shows the music block switches tracks on a global today; silence is a silent track. | Close F10 with a silent-track asset; no engine work. |
| M-07 | minor | `finale/FINALE_ARC.md:599` (§4.4) | On `taken` the whodunit, m10's main Act 2 thread, is skipped, and the player never meets WREN after the reveal. | One short beat at the van window at the aside, Kowalczyk cuffed: her "When did you know?" moves here on `taken`, with its 06:00 reply. |
| M-08 | minor | `finale/FINALE_ARC.md:740–744` (§5.3, won branches) | A careful save opens most doors through allies (Ghost's code, Voltage's cut, Gary's door), leaving little friction in Act 2. | Keep one real obstacle on every route: the server hall's guards or Mercer's stand-in, not removable by any import. |
| M-09 | minor | `m10.../stage_1/story_arc.md:85–99` (§4 cold start) | Cold-start m10: "Still HaX." and the van-window "Ninety-nine" have no setup. | At briefing beat 3 ("he rang her last night"), add the nickname: "He called me Ninety-nine. Nobody has since the course." |
| M-10 | minor | `finale/FINALE_ARC.md:26` (§1.2), `:527` (§4.1 step 3) | His calm at the console ("doesn't fight it") can read as passivity; his win-win (the key pressed is his proof; stopped, he gets a courtroom) is never said. | One line in his case: "Either you press it, or I get a courtroom. I've costed both." It also makes surrender and lethal force read as the player's win over him. |
| M-11 | minor | `m09.../stage_1/story_arc.md:59` (beat 5), §10.1 | The cold-start wall is eight never-played sentences in sixty seconds, mostly about strangers. | On `not` for most cards, show only the four the night leans on (m04, m05, m07, m08); the rest as one line. |
| M-12 | minor | `finale/FINALE_ARC.md:241` (row 114 dropped) | How the player caught the mole in m08 is tested again by m10's whodunit but never called back. | Tier 2: one line at m10's aside on `m08_named_on_evidence` ("You caught the last one on paper. Do it again."). Needs an F4 export. |
| M-13 | minor | `finale/FINALE_ARC.md:524` (§4.1 step 0) | Flag 4 is about 8 minutes of terminal work with Tesseract seated across the room; it can flatten the climax. | Keep his event-driven idle lines to three good ones; let HaX's field-guide help run through it; stage 8 times it. |
| M-14 | minor | `m09.../stage_1/story_arc.md:36` | "7 minutes per VM stage" is an assumption, and both missions' budgets rest on it. | Take real per-flag times from m07/m08 play data or one timed VM run before stage 4 sets beats. |
| M-15 | minor | `m10.../stage_3/REVIEW_R1_STRUCTURE.md:333` (engine 44); m09 item 16 | Unvoiced phone texts during a cutscene (06:00 Ghost and Recruiter texts) are unverified. | Check with the stage 4–5 spikes; fallback: narrator lines inside the cutscene. |

## 7. Top three risks

1. **m10's scope outruns the build and test budget.** 67 imports, about 40 local globals, 17 choices, five branching scenes, a whodunit, pooled record answers, a cells ledger with a fallback chain, a computed card and per-person credits: rare branches will ship broken, or stage 8 will run for weeks.
   **Recommendation:** a one-pass simplification before stage 4, applying §5's list (cut the media room, gallery to two options per branch, pools to two, a fixed cells rule, walkabout of three), and split the test plan into act-start segments with three true end-to-end runs (D-04, D-05, D-10).
2. **Unbuilt engine underneath the spine.** KO immunity, forced phone calls that resume across speakers and reloads, one unlock event for the outer lock, countdown objects whose text reads a global, and the closing card, teaser and credits clauses. Both missions' locks and the season's last screen depend on these.
   **Recommendation:** run four short engine spikes now, in this order: KO immunity, one resumable phone call (the Recruiter's), the card-and-credits format, and the lock event plus object text. Settle each before stage 4 writes objectives that assume it (D-08, D-09; §5 ranks 3–5).
3. **The player loses the thread in m10's Act 2 and the gallery.** Hidden share state, three optional side systems, whodunit clues, and the busiest room in the season placed where HaX is silent. That undercuts "fun and not hard" in the hour the season is judged on.
   **Recommendation:** show the share state on the countdown objects with a "What's still live?" hub topic (D-03), simplify the gallery (D-04), and run a blind vertical-slice playtest (server hall to core, three saves) as soon as stage 5 has rooms, before the rest is built.

Fix D-01 (the `named` branch's logic hole) and D-02 (the full-disclosure line) at the next document pass; both are wording.

## 8. Verdict

**Delivers the user's aims: yes.** Every history walked gets a distinct finale in which earlier choices decide who turns up, who helps, who betrays and what is said, as events in rooms rather than a roll-call. All six endings are reached by deliberate action at the core with their costs stated first. Join is signposted three times; the cold ending is labelled and can be withdrawn. The reveal is earned, HaX's arc closes with a payment the player was promised, and no eldritch content leaks in. The disclosure argument is taught through choices the player makes in both missions, and it is accurate on timescales and trade-offs.

**Can it be built: yes, after a short pass.** No blockers. Ten majors: two are wording (D-01, D-02), three are design simplifications (D-03 to D-05), two are carry-over gaps (D-06, D-07), and three are engine and test decisions to settle before stage 4 (D-08 to D-10). Stage 4 can start once the simplification list in §5 is ruled on and the KO-immunity and closing-sequence spikes have answers. Nothing here needs another stage 0–3 review round; the fixes are small enough for the authors' fold-in pass, with the orchestrator checking D-01 and D-04.
