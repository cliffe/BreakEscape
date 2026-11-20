# m05 Insider Trading: scenario design review, pass 5, round 1

Reviewer: Opus, read-only (static). Date 2026-10-13. Skill: `scenario-design-review`, run in full. Verified against `scenario.json.erb` and the ink. The older design docs were not trusted.

Kind of game: SAFETYNET campaign mission (TV spy thriller). Teaching comes through the VM work and the field guides.

## Checks run

- Routes r1 to r23 (`scripts/ink_runtime_check/m05_routes/route.js`): 23/23 "all expectations met".
- Validator, `--skip-ink --no-graph`: schema passes, layout and door alignment OK, no INVALID. 10 objective-wiring warnings (onceOnly pairs on one event, all reviewed below), 1 timed-text stacking warning, 1 VAR/global sync warning, 6 credits-section suggestions, 2 onRead-on-give suggestions, 11 `showProgress` notes.
- dialoguelint: 0 errors. One `you-after-choice` check (non-verbal, allowed) and one `not-x-but-y` warning, both in the Recruiter's phone ink.
- Not done: the field-guide sheet check in HacktivityLabSheets. A safety check refused the command that listed the sheets and their titles, so that check is left for the user (see the decisions section).

## Verdict

0 blockers, 2 majors, 10 minors. The mission is solvable on every route I traced, the KO fallbacks hold, and the endings, early naming and wrong accusation agree across the Torres scene, the debrief and the credits, with the exceptions below. The two majors are a wrong-accusation reaction that the engine skips on a common route (gotcha 0b), and a debrief that says almost nothing about the technical weaknesses the four flags expose (m04's M1 class).

## Findings

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| M1 | major | **Halloran's suspension reaction is in `start`, so a player who met her before accusing her never hears it.** A reopened person-chat resumes at the hub (gotcha 0b). `accused_greeting` only plays on a first meeting or after a page reload. Without a reload, a woman just suspended on the player's word greets them with "What else?", and the request for her spare quietly disappears. This is a common route: players meet her early for the visitor spare, then get the badge log and name her to Patricia. r3 covers only a first meeting after the accusation | `m05_npc_dr_halloran.ink:56-60` (check in `start`); hub at 126-132 | At the top of `hub`, before the `hub_quiet` block: `{halloran_accused and not accused_acknowledged: ~ accused_acknowledged = true` then `-> accused_greeting }`. Keep the `start` check for the first-meeting case. Add a route: meet her, exit, accuse, talk again with no reload, and expect "Security have suspended" |
| M2 | major | **The debrief reflects on almost none of what the four flags taught.** The only technical line is "an admin's leaked login" in the list of borrowed trust. Nothing names an unpatched CMS with a known flaw, the upload weakness, or a service account allowed more than it needed. The "warning signs" recap is all human factors. m04's round 1 rated the same gap major (`m04 SCENARIO_DESIGN_REVIEW_P5_R1.md`, M1) | `m05_closing_debrief.ink:302-304` | Two or three lines at brief level after line 304, matching m04's fix. For example: "And the research portal. Old software with a known flaw nobody patched, an admin login in a handover note, and an account that could run more than it needed." Then one fix line: "Patch it, rotate it, trim it. QDC had a list for all three." No exploit detail. Spoken lines, so list them for the audio stage |
| m1 | minor | **"Find Out Why" completes without a why.** Its only required tasks are the office card and entering the office. The journal and briefcase tasks are optional (puzzle R1, D-B), and optional tasks don't hold an aim (`objectives-manager.js:847`). A no-picks player who walks in and lifts the mug sees the aim ticked, then Patricia says "I need why". The status read covers it, but the to-do list says the opposite | erb 362-397 | Add a required custom task to `gather_evidence`, "Find out why he'd do it". Complete it from two HaX mappings: `global_variable_changed:case_motive` with `globalVars.torres_suspected === true`, and `global_variable_changed:torres_suspected` with `globalVars.case_motive === true`. Don't use a collect task listing the vetting file, because its hand-over would reveal the aim before suspicion (round 3's F1 rule, erb 1036-1038) |
| m2 | minor | **Two KO-route debrief choices claim Torres attacked first.** "[He came at me. I did what the mission needed.]" and "[He chose to fight. I gave him the chance to step away.]" (HaX: "You did.") are false when the player hit him before speaking. Any NPC can be struck, and the KO path never records whether the fight was offered | `m05_closing_debrief.ink:425, 477-478`; `m05_torres_confrontation.ink:375-386` | Set a synced global `torres_fight_offered` in `combat_offer`, and declare it in `globalVariables`. Gate both choices on it, and give the else case its own choice, e.g. "[I didn't give him the chance. The upload was running.]" |
| m3 | minor | **The debrief says Halloran was suspended "the rest of the night", but every naming restores her that night.** Patricia: "I'll have her access back on tonight." HaX: "And I'll get Halloran's access back on." Halloran: "Patricia's given me my access back." The credits say "suspended, then cleared" | `m05_closing_debrief.ink:273`; Patricia 465, phone 257; HaX 441-443; Halloran 248-250 | "Dr Halloran spent hours suspended because of a badge log read halfway. She was in Zurich…" |
| m4 | minor | **Ringing the Recruiter back after a decision gets "Still deciding?"** `mid_mission_contact` checks only `recruiter_deal_offered`. After a yes, the player hears "One call from you protects them", and the only choices refuse a deal they've already taken, which changes nothing in the credits | `m05_phone_recruiter.ink:275-299` | Branch at the top: if `recruiter_deal_accepted`, one line ("We have an arrangement. Don't ring this number again.") then `end_contact`; if `recruiter_deal_decided`, "You said no once. I heard you." then `end_contact`. Both VARs are already declared (lines 13, 18) |
| m5 | minor | **HaX's status hint tells the player to ask a knocked-out Halloran.** "That log says Halloran's spare. Ask her where it lives." fires with no `halloran_ko` check, and the phone ink doesn't declare `halloran_ko` | `m05_phone_agent_0x99.ink:942-943` | Declare `VAR halloran_ko = false` (synced), and add a case first: `found_door_log and halloran_ko and not found_halloran_alibi and not torres_suspected` with "She's in no state to answer. Her desk in the lab might." |
| m6 | minor | **Owen's "It's David. He's the one." can be chosen again and again.** It's sticky with no guard, so "David? No way…" replays on every visit | `m05_npc_owen_gallagher.ink:140` | Add a local `told_about_david`, set in `owen_told`, and guard the choice with `not told_about_david`, as Halloran and Lisa do |
| m7 | minor | **Patricia's `found_vetting_file` VAR lacks its synced-global comment** (validator warning 19). The assignment at 292 is intended (puzzle browser F2) | `m05_npc_patricia_morgan.ink:39` | Add "// Synced scenario global: also set by the vetting file's onRead; assigned at the hand-over (puzzle browser F2)" |
| m8 | minor | **CyBOK keywords that nothing in play teaches, and one taught topic that isn't listed.** See the CyBOK table | `mission.json` cybok | See decision U1 |
| m9 | minor (tidy) | **Comments sit between `{` and the first case, the pattern behind gotcha 0a.** I ran both knots through inkjs with a lethal fate and flags missing, and the first case plays correctly today. The README rule still says to move them | `m05_phone_agent_0x99.ink:652-653, 872-873` | Move each comment above its `{` |
| m10 | minor | **Flag task titles are inconsistent.** Flags 1 and 2 read "Flag 1: …", flags 3 and 4 read "Submit Flag 3: …" | erb 422, 432, 442, 452 | Use one form for all four (e.g. "Submit Flag 1: …") |

### Validator output, item by item

- **10 onceOnly-pair warnings** (HaX indices 1/69/80, 13/18/19, 14/20/21, 15/22/23/35, 16/17/24/25, 26/27, 28/74/85, 29/78/79/89, 53/54, 55/56/57). All intended. Each pair is either a state latch plus a text, the per-flag text plus the last-flag text (which needs a fate), the room-entry relays and backstops, or conditions the validator can't see are disjoint (`data.identified === true` vs `!== true`; three different `objectName`/`objectType` values). No change.
- **Timed texts stacking on `object_interacted`.** A false positive. The two lockpick texts and the VM text need different objects, so one interaction can't fire two of them.
- **Six "all conditional" credits sections.** I checked every one for coverage at debrief time (`final_choice` is always set, all four flags are in). THE CASE has its catch-all, and DAVID TORRES, ELENA, SOFIA AND MIGUEL, THE RECRUITER and QUANTUM DYNAMICS each cover every combination. No change.
- **onRead-on-give suggestions** (vetting file, CEO email copy). Intended. The vetting file latches only `case_motive`, never suspicion (erb 1036-1044).
- **VAR/global warning on Patricia's `found_vetting_file`.** See m7.
- **11 `showProgress` notes, 2 "no behaviour" seed NPCs.** Cosmetic, and the seed NPCs are hidden briefing co-speakers by design.
- **dialoguelint `not-x-but-y`** in the Recruiter's final statement (`m05_phone_recruiter.ink:352`). The villain's one allowed use; the dialogue phase can decide.

## Solvability and clue distribution

**Critical path.** Briefing, then Patricia (visitor badge, incident log), then the server hallway (Owen's clone, Halloran's spare, or HaX's relay), then Owen's password (the incident log or Patricia's sign-off after a refusal), then the server room and the four flags. Suspicion opens the office card (Patricia, her phone or HaX authorise it; Owen hands it over), then the mug print, then the vault. The naming goes to Patricia (in person or by phone), or to HaX if she's down. Then the fate, the call-in and the debrief. Every key is reachable before its lock and there are no cycles. `concludeRequires` is the four flags only. Every flag task has `targetFlags`, and each flag uses `set_global`. OK.

**Soft-lock patterns** (`SOFTLOCK_PATTERNS.md`). No burnt first-call gate: `first_call_choices` hands back to the hub once the night moves on. Owen's password ask waits for a refusal before Patricia can sign it off, and both routes stay open. Naming knots re-check `torres_identified` on reopen (R4-1). The post-KO choice has the room-entry phone safety net. OK.

**Clue spread.** Ten rooms, and clues sit in seven of them: the directory (reception), the incident log and vetting files (Patricia), the flyer (corridor), the leaflet and Lisa (break room), the badge log (Owen), the lanyard and Lab Rules (lab), the journal, bills and mug (Torres' office), and the schedule, manifest, envelope and queue log (vault). Each lock's hint comes before the lock: the IT notice is at the password door, Owen names the vault reader, and HaX's reader text names both prints. No navigation-only notes. OK.

**Deduction fairness.** Nothing names Torres before evidence does. The aim and task titles say "his office" only once `torres_suspected` is set, both leads are enrolled on the vault, and Owen's drop before suspicion is a carried item (D9). Lisa names Torres as the family behind the collection when asked. That is pass-4 policy, and it's balanced by gossip about Ben's pay and Halloran's row. The reason menu has document-based decoys, the right log reason isn't first, wrong answers cost the reward and end the call, and the wrong accusation costs the region, trust, the debrief and the credits without blocking the mission. OK.

## Objective scaffolding and the next step

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or chat at the transition |
|---|---|---|---|---|
| Get Inside | 3 | 3 (briefing, HaX's "Start with her", Patricia gives the badge) | None | HaX text after the briefing (erb 875) |
| Work Out Who | 3 (Owen, hallway, password) | 3 (HaX's reader text, the IT notice, HaX's status read) | Low | Reader and door texts (erb 1109-1136) |
| Find Out Why | 2 (card, office) | 2 (HaX office-door texts, Patricia's "enough to look") | **m1**: ticks done with no motive | Patricia's or HaX's partial naming |
| Prove the Exfiltration | 8 | 8 (flag texts, vault-reader and print texts) | Low | HaX's VM-launcher text, per-flag texts |
| Decide What Happens | 3 + call-in | All (case-ready text, the naming lines, the sweep text) | None | Case-ready text (erb 1084), sweep and call-in texts (erb 1186-1221) |

Next step on screen after each major beat. After the briefing: a text and a task. After the badge log: HaX's status ladder. After the case is ready: a text, plus the last aim revealed. After the naming: Patricia's or HaX's directions, and Torres shown. After the KO: the post-KO scene. After the fate: the call-in task and a text. After the last flag following the fate: a text. After a wrong accusation: HaX's nudge at 15 s. Every handover beat puts a visible task or text on screen. The only gap is m1.

The status answers ("Where do I stand?", `report_progress`) are right at every stage I walked: before Patricia, the badge, the password, the server room, flags 1 to 4, named, KO with no fate, fate with flags out, lethal twins, and all done. The exception is m5. Patricia's phone "Just checking in." branches correctly on named and fate.

## KO resilience

| Person NPC | Gates a required task or item? | Fallback | KO in the debrief and credits? | Verdict |
|---|---|---|---|---|
| Patricia | `meet_handler`, the visitor badge, both authorisations, the naming | `taskOnKO: meet_handler`; HaX relay gives a contractor pass and both authorisations (phone 546-565); name to HaX (hub 174); her itemsHeld drop (vetting files, email copy); her mobile rings out | Yes (debrief 284-286, credit 220, and Patricia-specific lines in the arrest, subdued and lethal paths) | OK |
| Owen | `talk_to_owen`, the hallway badge, the password, the office card | `taskOnKO: talk_to_owen`; relay pushes the badge, password note and badge log, with the office card held until suspicion (D9 carried) | Yes (debrief 287-289, credit 221) | OK |
| Halloran | No (optional task; the spare is a second route) | `taskOnKO`; the lanyard object still clears her | Yes (debrief 294-300, credits 223-224, split on the turn) | OK, but see m5 |
| Lisa | No (optional) | `taskOnKO` | Yes | OK |
| Torres | `confront_torres`, the fate | `taskOnKO`; post-KO scene (`disableClose`); data-centre phone safety net | Yes, as the two combat fates | OK, but see m2 |

The win condition (`mission_complete`, set from HaX's phone) can't be blocked by any KO. A KO at any point leaves a way to every flag, the naming and a fate.

## Reload resilience

- Ink locals and synced globals survive a reload; I checked every opener. Patricia, Owen, Lisa and Halloran key their first meeting on `first_meeting`, HaX keys his first call on `first_contact` plus a staleness check, and Torres keys on `final_choice`. No condition reads a visit count or `TURNS()` in any m05 ink file (scripted scan).
- **Lines in `start` that belong in the hub:** Halloran's `accused_greeting` (M1). Nothing else in `start` reacts to a mid-mission change. Patricia's and Owen's `start` hold only a task tag and the first meeting.
- Phone history is lost on reload, but the status read rebuilds every pointer the lost texts carried.
- Carried: N-8 (a reload mid-debrief concludes without the remaining lines), accepted as in m03 and m04.

## Debrief and credits against the routes

I checked each conditional debrief line and credit against the five fates (turn, hand-over with or without the deal, subdued, lethal, exposure), against early naming and wrong accusation, against a Patricia or friendly KO, and against the Recruiter states.

- **Fates.** Turn and the hand-over with the deal set `elena_treatment_funded` (Torres 297, 337). The credits for Elena and the children follow it, and agree with "We're paying". Subdued and lethal never fund. Exposure leaves Elena unfunded, which matches "reading about it from a hospital bed". OK.
- **Early naming.** The reward has the same four terms in the Torres scene (105), the debrief (266) and the credit (erb 178). The 88→89→91 and 94→95→97 bars land on the debrief's 91 and 97. OK.
- **Wrong accusation.** The 99 bar, the lost region, "AT A COST", the warning credit and the trust cost all agree. The exception is m3's "rest of the night".
- **Recruiter.** The credit and debrief branches match for each of the seven credit states, including offered with no answer and the confession. The ring-back (m4) is the only contradiction.
- **Friendly KOs.** Every KO has a debrief line and a credit. Lines that name Patricia branch on `patricia_ko`. OK.
- **Player choices in the debrief.** m2.

## Lessons list (M03 prompt, PASS2 lessons, m04 and m06 round 1)

- Flags are station-qualified with `set_global` rewards. OK.
- `hear_debrief` completes on the debrief's last line, with a room-entry backstop. OK.
- Mappings live on start-room NPCs, except Torres' own, which is backed by a room-entry re-show. OK.
- No two cutscenes share an event. OK.
- No `||`, no parentheses, and no nested `data.a.b` in any NPC `eventMappings` condition (scripted scan of the rendered JSON against `safeEvaluateCondition`, `npc-manager.js:15-101`). Every `data.` key used matches a top-level payload key: `cardName`, `itemId`, `connectedRoom`, `objectName`, `objectType`, `identified`. OK.
- Credit conditions use `||` and parentheses, which the music and credits evaluator accepts: it runs them as JS through `new Function` (`music/scenario-music-events.js:34-48, 129`). They are not NPC conditions.
- No "under arrest" anywhere in m05. SAFETYNET hands over.
- Debrief reflects the VM work: no (M2). The answer isn't handed over: OK. Next step on screen: OK apart from m1. Optional tasks look required: the engine shows them alike, as m04's m11 noted. Nothing new here.

## CyBOK coverage (`mission.json`)

"Play" means the player does it. "Guide" means a field guide covers it. "Story" means it is only mentioned in dialogue or documents.

| KA | Keyword | Taught by | Verdict |
|---|---|---|---|
| NS | common network attacks | VM recon (flag 1), recon guide, HaX "map it" lines | Play + guide. Recon more than attack, but acceptable |
| SOIM | Penetration testing: software tools | Kali VM, four flags, Bludit and sudo guides | Play + guide |
| SOIM | Incident Response | Nothing. Patricia's incident log is detection, and no beat covers responding to an incident | **Not taught** |
| SOIM | Insider threat detection | Badge log, vetting aftercare, Nightshade's briefing, debrief warning signs | Play |
| HF | Social engineering | Cloning Owen's badge mid-chat, talking Owen out of the password, the Recruiter's pitch | Play |
| HF | Insider threat psychology | Journal, the Recruiter, HaX's leverage topic, Torres' rationalisation | Play + story |
| HF | Behavioural indicators | Vetting files, flyer, leaflet, debrief recap | Play |
| HF | Trust exploitation | The Recruiter; the debrief's "someone else's trust" | Story + debrief |
| AC | Quantum Cryptography | One optional Halloran line ("lattice-based") and "quantum-safe" in the briefing | **Story only, thin** |
| AC | Cryptographic research protection | Lab Rules (no removable media), the key-rotation windows | Story, thin |
| MAT | Data Exfiltration | Transfer log, manifest, flag 3, Patricia's volumes | Play |
| MAT | CVE-2019-16113, Bludit CMS exploitation, EXPLOITATION | Flag 2, Bludit guide | Play + guide (the guide's content needs checking by the user) |
| WAM | Leaked credentials | Flag 1, HaX's handover-note text | Play |
| WAM | Authenticated file upload, CMS vulnerabilities | Flag 2, Bludit guide | Play + guide. Not reflected in the debrief (M2) |
| CPS | Physical access control, Lock picking, Badge authentication | RFID doors, cabinet and briefcase, badge log; lockpicking and RFID guides | Play + guide |
| AAA | RFID authentication, Access control bypass, Credential theft | The clone, the visitor spare, the password note | Play + guide |
| AAA | Biometric authentication | Lifting the mug print for the vault; Owen's "you can't change one" line | Play |
| (missing) | Privilege escalation | Flag 4 and the sudo guide | **Taught but not listed** |

Keywords nothing teaches: "Incident Response". Thin: "Quantum Cryptography" and "Cryptographic research protection". Taught but unlisted: privilege escalation. See U1.

## Field guides and VM flags

**Field guides.** Five guides: RFID cloning, lockpicking, recon, Bludit and sudo. Each is offered when the player first meets its obstacle: the hallway reader (erb 1109), the cabinet or briefcase (1169-1177), the VM launcher (1178-1185), and flag 3 (963). Each is handed over on request through one hub choice (phone 213-238). Every `#give_item` id matches an `itemsHeld` id. The item name "Privilege Escalation via Sudo" matches the sheet title that m06's round 2 checked (`m06 SCENARIO_DESIGN_REVIEW_P5_R2.md`, m9). OK. Not checked: whether the other four `labUrl` sheets exist and whether their titles match the item names. My command to list them was refused, so this goes to the user (U2).

**VM flags (game side only).** All four are required (`concludeRequires`). Each has a story frame in its task title, and HaX reacts to each one (erb 945-980). The debrief reflects flag 4 (the Architect's authorisation) and flag 3 (via the manifest in Patricia's summary). It barely reflects flags 1 and 2 (M2). The flag order is free on the game side.

**Needs checking against SecGen by the user** (in-game claims only, not checked against the VM):
- S1. Flag 1 is an admin login leaked in a handover note on the research portal (erb 950; the manifest's `handover_note.txt`, erb 1948).
- S2. Flag 2 is an authenticated image-upload weakness in Bludit, as `mission.json` names it.
- S3. Flag 3 is Torres' staging manifest, found in a user's home directory (phone 371, 381; erb 965).
- S4. Flag 4 needs root via a sudo rule ("what that account is allowed to run", phone 381, 920), and holds the Architect's authorisation with a casualty projection (erb 973).
- S5. "The Bludit box won't be the only thing listening" (phone 735) implies other hosts or services on the subnet.
- S6. The flags can be captured in any order (carried D3).

## Carried forward from alignment and puzzle chains (unchanged)

- From alignment: D1 and D3 (SecGen manifest, VM claims), D4 to D8, D9 (Owen's spare drops before suspicion, until `dropOnKO`), D10 (engine first-encounter damage). N-8, N-10, N-3 and N-P are accepted notes.
- From puzzle chains: D11 (the clone's timing), and D3's flag-order question for the user. P10 (HaX's hub can reach about 17 choices; I count 15 conditional plus 2 fixed) and B3 (the debrief's long runs) go to the dialogue phase. For room dressing: place the Lab Rules notice, and keep the lab hook a prop only.
- Seen and left alone: Torres' "Not yet" reopens replay the scene opening (narration and clock line) on each return. This is accepted, because alignment m5 kept the choice. The briefing sets `knows_full_stakes` on every route (opening 300), so its two debrief conditionals always play. Harmless.

## Decisions for the user

- **U1. CyBOK list in `mission.json`.** Options: (a) drop "Incident Response", fold the two AC keywords into one ("Key management and rotation", which the key-rotation windows do teach), and add "Privilege escalation" under MAT or SOIM; (b) keep the list and add content: a short HaX beat on what QDC should do now (contain, preserve the logs, report), plus a Halloran line made non-optional; (c) leave it. **Recommendation: (a).** It makes the metadata honest at no cost in spoken lines. (b) adds dialogue for teaching the mission doesn't aim at.
- **U2. Field-guide sheets.** Please confirm that the RFID-cloning, lockpicking, recon and Bludit sheets exist at their `labUrl`s (erb 785, 793, 801, 845), and that their titles match the item names. **Recommendation:** check the four `title:` lines. If a title differs, rename the item to match, as m06 did.
- **U3. SecGen claims S1 to S6.** **Recommendation:** check them alongside the open D1 and D3. Any drift gets a text-only SecGen change, as in m04 and m06.
- **U4. M2's debrief lines are new spoken lines.** **Recommendation:** add them now, in this phase, since the audio isn't generated yet. List them in the log's spoken-lines section.
