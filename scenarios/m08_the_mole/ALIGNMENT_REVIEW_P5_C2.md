> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: alignment review, pass 5, cycle 2

Reviewer: stage-2 alignment (mission-alignment-plan rubric), fresh eyes, read-only, 2026-10-14. Reviewed at HEAD `b375a939` (no uncommitted m08 changes).
Judged against `docs/agents/M08_PASS_BRIEF.md` ("Kind of game and aim"). Evidence is cited from `scenario.json.erb` (`erb`) and the ink files (`<file>.ink:line`), not the log or the older design docs. I didn't open the SecGen XML or the four named field guides. Every VM claim is listed under "Items for the user" as needing a check against SecGen.

## Checks run (output in the session scratchpad, `m08-align-c2/`)

- **Route driver:** `node scripts/ink_runtime_check/m08_routes/route.js <route>.json`, all seven routes (r1 to r7). Every route reports "all expectations met". The longest run without a choice is 11 lines (the opening cutscene, already logged for the dialogue stage). With no argument the script throws `ERR_INVALID_ARG_TYPE` at `route.js:75`. That's harmless, but a usage message would help (n10).
- **dialoguelint:** 0 errors, 0 warnings, and 8 blank-reentry CHECKs (all logged earlier for the dialogue stage).
- **Validator** (`--skip-ink --no-graph`): no errors. Two warnings, both known and intended: the `brief_taken` co-fire on `closing_debrief`, and the confrontation cutscene that is deliberately not `onceOnly`. There are also six suggestions about credit sections with no unconditional line; each section has a covering line on every path.

## Severity table

| # | Sev | Area (rubric row) | Finding | Fix (short) |
|---|-----|-------------------|---------|-------------|
| J1 | major | Deduction (2, 5) | HaX's KO texts tell the player who is guilty: knock a suspect down and she says "not your mole" or "we'll have this out in the interrogation room" | Split each KO text on `mole_identified`; neutral before |
| J2 | major | Red herrings, deduction (5) | Only an accusation against Nightshade draws a HaX text ("tidy up"), so accusing works as an oracle. Accusing Cipher or Phantom costs about one click | Any accusation before the naming gets around the floor: same neutral text, same tip-off |
| J3 | major | Fallbacks (5, 9) | Knocking the Director down skips the deduction. HaX names Nightshade at flag 4 even if nobody has found the door audit | HaX's naming waits for the audit, and she runs the reading with the player |
| J4 | major | Suspects (4) | The only suspect locker in the game is Nightshade's. It opens with the start-kit picks at minute one and holds a passport, a ticket to Montana and the recruitment brief | Give all three suspects a locker; move the go-bag out of reach before the naming |
| J5 | major | Fallbacks (5) | The third misread closes the check and, before flag 4, tips the mole off. Nothing warns the player at the second misread | One warning line from Netherton at two misreads; the HaX ladder says it too |
| n1 | minor | Red herrings (5) | Cipher's refusal costs nothing (Nightshade's confirmation is enough), and Phantom's withheld lead repeats what his notes already say | Folded into J2; otherwise make the withheld item unique |
| n2 | minor | Suspects (4) | HaX in person, once `nightshade_suspected` is set: "I used to envy one of them for how calm he is". Asking "Two of ours are dead" sets that flag | Neutral line, or gate it on `named_on_evidence` |
| n3 | minor | Option B consistency (2) | HaX in person still says "Let the box say it." | "Let the doors say it." |
| n4 | minor | Deduction (2) | The break-room timeline note narrows the field for the player: "Two of them badge through the lab door: Cipher and Nightshade." | End on "Get the door logs." |
| n5 | minor | Hint fairness (3) | The audit-confirmation choices need `asked_alibi`, a hidden prerequisite that HaX's tier-3 hint doesn't mention | Drop `asked_alibi` from both gates |
| n6 | minor | Tidied branch (5) | The tidy leaves the Deep State brief in the locker, and it happens instantly, while he is still at his desk next door | A variant on the brief; optionally latch the tidy on a far room entry |
| n7 | minor | Debrief (10) | The debrief never mentions the tip-off or an early accusation of Nightshade | One Netherton line on `nightshade_tipped_off` |
| n8 | minor | Evidence wall (2) | The name-only variant says "Named to the Director on the door audit" on the HaX and Director fallbacks too | "Named on the door audit." |
| n9 | minor | Suspects (4) | Cipher's first alibi answer volunteers "a Crypto Lab terminal" before the player has any source for it | Cut that clause |
| n10 | minor | Tooling | `route.js` with no argument crashes instead of printing usage | Print usage and exit 2 |

Counts: **0 blockers, 5 majors, 10 minors.**

What works now:
- The naming is required (`erb:373-377`, `:452`).
- Flag 4 gives a terminal and a time, never a face (`erb:697-699`).
- The audit reading is a real time-window deduction. Cipher's in-and-out at 10:24/10:32 and the off-shift 0x3C behind the door are fair distractors, and Phantom is on the travel desk (`erb:1467`).
- Netherton's four steps make the player read the minute against the rows, not the man (`m08_director_netherton.ink:243-312`).
- The triple-agent branch now pays something (`m08_nightshade_confrontation.ink:165-169`, `erb:179`).
- HaX's teacher-line hedge names no one (`erb:801`, `m08_closing_debrief.ink:162-167`).
- The tidied variants are wired on both the stick and the go-bag (`erb:1786-1791`, `:1824-1829`).

---

## Findings

### J1 (major): KO texts hand over the verdict

`erb:758-774`. All three are `onceOnly`, have no condition on `mole_identified`, and fire on `npc_ko:<id>`:
- Cipher: "He's a mess and a genius and he is not your mole. The odd hours are a classified encryption project." (`:767`)
- Phantom: "All that snooping was him running the same hunt you are ... the only other person here trying to catch the mole." (`:773`)
- Nightshade: "The proof's on the server. His face can wait. Get me the flags and we'll have this out in the interrogation room." (`:761`)

Combat is allowed in this campaign, so a player can knock down any suspect and read the answer off HaX. This is the same handover B1 removed from flag 4, reached through a KO.

**Fix.** Give each KO a pair of mappings: `mole_identified !== true` with a neutral text, and `mole_identified === true` with today's text. Neutral wording, one per suspect, for example:
- Cipher: "You put Cipher on the floor. Whatever he is, he isn't answering questions tonight. The door logs still can."
- Phantom and Nightshade: the same shape, with the name changed.

Nightshade's pre-naming text must not mention the interrogation room.

### J2 (major): accusing works as an oracle, and the herrings cost a click

- The only accusation that draws a HaX text is Nightshade's: "You told him. He knows now. If he was ever going to tidy up, he's doing it tonight." (`erb:868-874`). There is no mapping on `accused_cipher` or `accused_phantom`. A player who accuses all three learns which accusation HaX treats as dangerous.
- Accusing Cipher closes his row confirmation (`m08_suspect_cipher.ink:64-68`). The apology is available straight away and costs nothing (`:99-104`). Netherton also needs only one confirmed row (`m08_director_netherton.ink:231`), and Nightshade gives his freely (`m08_suspect_nightshade.ink:92-96`). So the refusal never blocks anything.
- Accusing Phantom withholds his verbal lead (`m08_suspect_phantom.ink:65-69`). His notes, which he left on the desk, already give the same lead: the door audit on the archive terminal, matched to the opening time (`erb:1356`).

The brief asks that red herrings cost "trust, time, a tipped-off mole". Today only the correct accusation costs anything, and that is what makes it an oracle.

**Fix (mission-local, no engine change).** "Do it quietly" applies to everyone. Any accusation made before the naming gets around the floor; the off-duty agent is already shown eavesdropping on every conversation (`erb:1720`).
- Add mappings on `accused_cipher` and `accused_phantom` that match today's Nightshade one: `value === true && globalVars.mole_identified !== true`, `setGlobal: { nightshade_tipped_off: true }`.
- Send one shared neutral text from all three, for example: "You've said it to someone's face. On this floor that's said to everyone by midnight. If it's the right man, he knows we're looking." The existing `nightshade_tidied` latch (`erb:875-881`) then does the rest.
- Add a confrontation line for the case where Nightshade wasn't the one accused. Insert it before the `- nightshade_tidied:` arm at `m08_nightshade_confrontation.ink:79`, conditioned on `(accused_cipher or accused_phantom) and nightshade_tidied`. Something like: "You put it on {accused_cipher:Cipher|Phantom} in front of the floor. Walls are thin. So I tidied." This needs `accused_cipher` and `accused_phantom` declared as VARs in that file.
- The credits already carry "Accused to his face" (`erb:184`, `:187`). Add a GO-BAG or THE USB STICK line for the case where the player never reopened the locker after the tidy (see n7).

This also makes the Cipher and Phantom apologies matter less mechanically, which is fine: they become the trust beat, and the tip-off is the cost.

### J3 (major): knocking the Director down skips the deduction

Fallback C, `erb:694-696` (flag 4 with `netherton_ko`), and the `netherton_ko` mapping, `erb:710-718`, both set `mole_identified` and complete `name_the_mole`, with HaX saying "I read the door audit against it myself". Neither mapping checks `found_badge_audit`, so the player may never have found the audit HaX claims to have read.

The Director's KO also drops his all-zones card (`erb:1112-1124`), which skips the clone gate. One punch in the Director's office therefore removes both the access puzzle and the mission's only deduction, at the price of two warning credit lines (`erb:196`, `:221`) and a debrief line (`m08_closing_debrief.ink:88-90`). r7 tests this route and passes because it is designed to.

The KO path should stay completable (rubric row 9), but it shouldn't be the quickest way through the whodunit.

**Fix.** Make HaX the Director's stand-in for the reading, not for the answer:
- Add `globalVars.found_badge_audit === true` to fallback C's condition and to the `netherton_ko` mapping at `:713`.
- Add a sibling mapping for `netherton_ko && flag4 && !found_badge_audit` with the text: "The Director's down and the box gives me an account, not a person. Get me that door audit from the archives and read it to me."
- Then either:
  - **(a, preferred)** add a phone-hub choice `{netherton_ko and found_badge_audit and not mole_identified} [I can name the leak.]` that runs a short two-step version of the check in HaX's voice ("When was it opened?" / "Who was behind the door at that minute?"), setting `named_by_hax` and `mole_identified`; or
  - **(b, smaller)** a latched mapping on `found_badge_audit` once `netherton_ko && flag4_submitted` hold, which keeps today's HaX text and at least requires the player to have the audit in hand.

Option (a) keeps the deduction on the KO path. Option (b) keeps only the legwork.

### J4 (major): one pickable locker confesses at minute one

`erb:1756-1835`. "Staff Locker -- 0x47" is a key lock that the start-kit picks open (`erb:256-262`, `puzzle_graph_unlocks: ["nightshade_locker"]`). It sits in the break room, next to HaX in person, from the first minute. Inside:
- the go-bag: "A passport in a name you have never heard, with his photograph" and "An e-ticket, one way ... to Helena, Montana, for the morning after Portland" (`:1823`);
- the ENTROPY recruitment brief (`:1810`);
- the signed mail ("-- N", from `nightshade_deep_state`; it needs a two-layer decode, which is earned work).

It is the only searchable locker in the building, so opening it is a pointer in itself. Once it's open, Cipher and Phantom stop being plausible, whatever the door audit says. J2's fix also gives players a reason to rush the locker before accusing anyone (route r5 already exercises this order). The interview gate on the key (`m08_suspect_nightshade.ink:97`, after the audit or Okafor beat) shows the intended design: the locker corroborates a suspicion. The picks bypass that.

The naming still requires the audit reading, so this doesn't break B1. It does undercut "each suspect plausible to the end".

**Fix (mission-local).** Two options, which can be combined:
- **Three lockers** (0x23, 0x47, 0x88) in the same row. Each holds something that looks bad until it is explained. Cipher's holds a crypto-annex hardware token and an unsigned "do not discuss" project sheet (it pays off his 8-minute token-cabinet visit, `m08_suspect_cipher.ink:74`). Phantom's holds a Zurich boarding pass stub and his own hand-drawn suspect wall with himself on it. Searching then becomes investigation, and the picks still work on every locker.
- **Move the go-bag out of reach before the naming.** The go-bag's contents are a confession, not a clue. Put it on the interrogation-room table, carried down with him, and keep the existing confrontation choice at `m08_nightshade_confrontation.ink:125`. Or keep it in the locker but drop the passport photograph and the Montana ticket from the readable text until `mole_identified` (a `textVariants` entry keyed on `!globalVars.mole_identified` with a neutral "a packed holdall, clothes, nothing personal"). The tidy variant and its credit stay as they are.

### J5 (major): the third misread is an unannounced penalty

`m08_director_netherton.ink:314-356`. Misreads are cumulative across visits (`audit_misreads`, `:52`). The third one closes the check. Before flag 4 it also sets `nightshade_tipped_off` (`:329`), which empties the locker through the latch (`erb:875-881`) and can't be undone.

The replies after the first and second misreads are bare corrections (`:333-344`). HaX's ladder says "He's said no once." (`m08_phone_agent_0x99.ink:123-124`) and never says there's a limit. Each step has four answers, and the natural confusions are easy to make: 10:15 is Nightshade's badge-in, and 10:32 is Cipher's badge-out. A careful player who reads the door times as the opening time can lose the check in two visits without knowing it was at stake.

A fallback that costs something is right. One that gives no warning is the trap-shaped part.

**Fix.**
- At `:345`, before `{ audit_closed:`, add `{ audit_misreads == 2: Director Magnus Netherton: Once more like that and I take this off you, and I shall have to ask questions on the floor to do it. }`.
- Reword HaX's misread tier: "He's said no. Twice and he'll take it off you, and the whole floor will know. Put every row against the minute the plan opened."

Both are spoken-line changes.

---

### n1 (minor): herring costs that cost nothing

See J2. If J2's tip-off is not adopted, make each withheld item unique:
- Cipher: the Director's step 4 accepts only Cipher's own confirmation when Cipher was accused and then apologised.
- Phantom: his notes lose the "Match it to when the plan was opened" line (`erb:1356`), so that hint lives only in his spoken lead.

### n2 (minor): a third "calm" pointer from HaX

`m08_agent_0x99.ink:37-39`: "I used to envy one of them for how calm he is. Tonight I don't." It shows whenever `nightshade_suspected` is set, and asking Nightshade the neutral "[Two of ours are dead.]" sets it (`m08_suspect_nightshade.ink:60-62`). ATHENA already carries the one ambient "calm" tell (`m08_receptionist_ai.ink:25`). **Fix:** either gate this line on `named_on_evidence`, or replace it with a line that doesn't narrow the field: "Don't make me say a name. You've been watching them. Watch the door log instead."

### n3 (minor): "Let the box say it"

`m08_agent_0x99.ink:42`. Under Option B the box gives an account, and the doors give the name. **Fix:** "Get me evidence. Let the doors say it."

### n4 (minor): the timeline does the narrowing

`erb:1744`: "Three names on the Director's list have that access. Two of them badge through the lab door: Cipher and Nightshade. Get the door logs." That is the first half of the audit reading, done by a note. **Fix:** "Full planning access and a Crypto Lab terminal. Find out who could get through the lab door. Get the door logs."

### n5 (minor): hidden prerequisite on row confirmation

`m08_suspect_cipher.ink:63` and `m08_suspect_nightshade.ink:92` both need `asked_alibi`. HaX's tier 3 ("Ask the men who badge through the lab door", `m08_phone_agent_0x99.ink:121-122`) doesn't say so. A player who skipped the alibi question finds no audit choice. **Fix:** drop `asked_alibi` from both gates. In Cipher's case, word the choice "[The door audit has you in the Crypto Lab that morning.]" and keep "You left that out" only `{asked_alibi: ...}`.

### n6 (minor): the tidy is incomplete and instant

- The Deep State brief has no tidied variant (`erb:1802-1814`), so the careful mole takes his bag and wipes his stick but leaves an ENTROPY recruitment document behind. **Fix:** a `textVariants` entry on `nightshade_tidied`: "One torn page, caught behind the shelf: p.7 of something he took the rest of." Keep the page text.
- The latch fires the moment he is tipped off (`erb:875-881`). A player who accuses him in the lab and walks west into the break room finds the locker already scratched open, while Nightshade still sits at his desk in the room they just left. **Optional fix:** latch on `room_entered:` for any room other than `cryptography_lab` and `break_room`, with `nightshade_tipped_off && !found_architect_comms_local && !found_go_bag`. A sprint to the locker then beats the tidy, which is a fair reward for a player who sees the risk.

### n7 (minor): the debrief doesn't record the tip-off

`m08_closing_debrief.ink:69-116` reads accusations against Cipher and Phantom and the audit routes, but never `nightshade_tipped_off` or an early accusation of Nightshade. The credits mention the tidy only if the player reopened the locker afterwards (`erb:204`, `:206`). **Fix:** declare `nightshade_tipped_off` and add one line in `the_hunt`: `{ nightshade_tipped_off: Director Magnus Netherton: He knew we were coming before we came. Whatever was in that locker, we will never see now. }`. Add an unconditional-on-reopen credit: `"NIGHTSHADE: Tipped off before he was named"`, condition `globalVars.nightshade_tipped_off`.

### n8 (minor): evidence wall wording on the fallbacks

`erb:1652`, the `mole_identified`-only variant: "Named to the Director on the door audit." On `named_by_hax` the Director didn't hear it from the player. **Fix:** "Named on the door audit."

### n9 (minor): Cipher volunteers the terminal

`m08_suspect_cipher.ink:58`: "Whoever opened that plan did it from a Crypto Lab terminal." He says this on the first question, before the player has any source for it. **Fix:** "My desk is on the ops floor, nowhere near the planning share. Do the geography." This keeps the misdirect, since he has an annex badge, which also makes the step-3 wrong answer at `m08_director_netherton.ink:288` work.

### n10 (minor): route driver usage

`scripts/ink_runtime_check/m08_routes/route.js:75` reads `process.argv[2]` without checking it. **Fix:** print the usage line and exit 2 when no argument is given.

---

## Confirmation of cycle-1 findings (checked in the files, not the log)

| # | Cycle-1 finding | Status | Evidence |
|---|---|---|---|
| B1 | Naming optional; HaX names him on flag 4 | **Closed**, with new leaks found (J1, J3) | Flag-4 mappings A-D, disjoint and &&-only (`erb:687-709`); D gives terminal and time only (`:699`); `name_the_mole` has no `optional` (`:373-377`); Confront waits on both aims (`:452`); naming via `audit_case`/`audit_right` (`m08_director_netherton.ink:128, 217-383`); a login alone is refused (`:219-223`) |
| M1 | Pointers stack on Nightshade; innocents clear themselves | **Closed** (n2 and J4 remain as separate pointers) | Netherton's worries are balanced (`m08_director_netherton.ink:102, 107, 111-113`); dossier covers all three, Phantom's D-2 morning, neutral note (`erb:1143`); printout covers all three (`:1271`); Phantom refuses an alibi (`m08_suspect_phantom.ink:53-54`); off-duty agent adds Phantom's morning (`m08_background_agent.ink:68`) |
| M2 | "Fifteen years" before identification | **Closed** | `m08_agent_0x99.ink:58-64` |
| M3 | Wrong accusations and tip-offs cost nothing | **Implemented; partly ineffective** (J2, n1) | Cipher's refusal (`m08_suspect_cipher.ink:64-68`), Phantom's withheld lead (`m08_suspect_phantom.ink:65-69`), tip-off and tidy latch (`erb:868-881`), variants (`:1769-1829`), confrontation lines (`m08_nightshade_confrontation.ink:73-89`) |
| M4 | Debrief and credits ignore the VM chain | **Closed** | THE BOX section, four unconditional lines (`erb:212-216`); debrief beat (`m08_closing_debrief.ink:121-124`) |
| M5 | Teacher line lands with no one | **Closed** | HaX text (`erb:796-802`); debrief hedge (`m08_closing_debrief.ink:162-167`); no name anywhere |
| M6 | mission.json lists a nonexistent choice; "Arrest" | **Closed** | `mission.json:210` "Detain and hand over to police (no deal)"; debrief stance `:231, :236` |
| m1 | Odd task title; "duty officer" collision | **Closed** | `erb:349`; "archive duty officer" (`m08_suspect_phantom.ink:84`, `erb:1356`) |
| m2 | "Not one scrap of intelligence" | **Closed** | `m08_closing_debrief.ink:140-144` |
| m3 | Debrief location | **Closed** | `m08_closing_debrief.ink:41` |
| m4 | CyBOK and other mission.json entries | **Closed**; SSH and the CVE stay as U1 claims | AB/MAT kill chains and AC gone; WAM at `mission.json:69`; F Artifact Analysis at `:127`; success metrics and lore corrected |
| m5 | Locker key with no beat | **Closed** | `m08_suspect_nightshade.ink:100` |
| m6 | Triple agent buys nothing | **Closed** | `m08_nightshade_confrontation.ink:165-169`; credit `erb:179` |
| m7 | Stale SecGen header | **Partly closed**, waits on U1 | `erb:17-19` |
| Reg 1 | HaX not on `agent_hax` | **Closed (static)** | `erb:619`, `:1687-1690` |
| Reg 2 | Netherton on `male_spy_v2` | **Closed (static)**; not yet seen in a browser | `erb:922-925`, `:1088-1091` |
| Reg 3 | Answer handed over by wording | **Closed** for the items listed | `erb:349, :374`; `m08_agent_0x99.ink:58-64`; `erb:1271` |
| Reg 10 | Dusting quote overflow | **Closed** (mission-side) | `erb:1785` |
| Reg 13 | "placed by ENTROPY" credit | **Closed** | `erb:173` |
| Reg 14 | Phantom credit with no action | **Closed** | `erb:189-190` |

## The questions the brief asks, answered

- **Is the mole hunt real deduction a player can do from the evidence?** Yes, on the intended route. The time-window reading against the door audit has fair distractors, and Netherton's four steps make the player do it. Three side doors still give the answer without the reading: the KO texts (J1), the asymmetric accusation text (J2), and the minute-one locker (J4). A fourth, knocking the Director down (J3), skips the reading entirely.
- **Is each suspect plausible to the end?**
  - Cipher is, until the audit: the annex badge, the alibi that leaves out eight minutes, the off-duty witness's "build of the nerdy one".
  - Phantom drops early, because the timeline note names the last two for the player (n4). His refusal and his empty D-2 morning hold him for a while.
  - Opening the locker settles it for everyone (J4).
- **Do the fallbacks cost something without becoming a trap?**
  - Three misreads after the box: the Director names him, with no suite code aloud and warning credits. That is a fair cost.
  - Before the box: the mole is tipped off, which is a fair cost, but it comes without warning (J5).
  - The Director's KO costs almost nothing and skips the reading (J3).
  - Nothing soft-locks; every route reaches the confrontation (r1 to r7).
- **Is the hint ladder fair?** Mostly. It checks state, not method, and climbs audit → clock → confirmed row → reading. The gaps are the hidden `asked_alibi` prerequisite (n5) and the missing warning about the misread limit (J5).
- **Do the new branches hold together?**
  - Tipped off: yes, apart from n6 and n7.
  - Tidied locker: yes. The item names stay unchanged after the tidy, which is the known engine limit E4.
  - Apology: it works, but it carries no cost (n1).
  - Triple agent: yes.
- **New giveaways:** J1, J2, J4, n2, n4, n9.

## Items for the user

- **U1 (still open, needs checking against SecGen by the user).** Which scenario is built (`mission.json` says `m08_the_mole`; the header says it's unconfirmed, `erb:17-19`). The flag order. Whether the VM holds what the game claims: committed credentials that resolve to an account (the evidence wall names `nightshade_ops`, `erb:1649-1650`), sent mail to `architect@entropy.onion` (`erb:666`), a root-only log with a Crypto Lab terminal and 47 minutes (`erb:699`), the threat-database root file, SSH as the second login (`mission.json:56`), and the CVE (`mission.json:65, :146`).
- **U1 addendum (still open, and now the most important VM check).** Option B rests on the box not showing a person's name. If the account or home directory on the VM is literally named after Nightshade, flags 2 and 3 hand over the answer ("let's see whose account it really is", `erb:658`; "You're in as them", `:666`), and the door audit becomes a formality. Recommendation unchanged: rename it on the VM to a neutral service login, or accept the audit as corroboration and say so in the brief.
- **E1-E4** (engine) remain as logged in `DECISIONS_PENDING.md`. Nothing in this cycle needs a new engine change. J1 to J5 and n1 to n10 are all mission-local (scenario, ink, one tooling line).

**Cost note:** J1, J2, J5, n2, n3, n6, n7 and n9 change or add spoken or voiced lines (the HaX phone texts are voiced). List them old → new for the TTS stage.

## Verdict

Not ready to close the alignment stage. Round 1 closed every cycle-1 finding in the files, and the core deduction now works. Five majors remain, all mission-local and small to medium:
- J1, J2 and J5 are a few mappings and lines each;
- J3 needs a short HaX-side reading or one extra condition;
- J4 needs two more lockers or a moved go-bag.

Recommend one more fix round on J1 to J5 (with n2 to n9 folded in where cheap), then a cycle-3 confirmation and a browser check of the naming flow before moving on to puzzle chains. J4's three-locker option overlaps with puzzle-chain work; if the orchestrator prefers, the locker part of J4 can move to the puzzle-chains stage, provided the go-bag text variant goes in now.
