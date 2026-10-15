# m08 The Mole: alignment review, pass 5, cycle 1

Reviewer: stage-2 alignment (mission-alignment-plan rubric), read-only, 2026-10-13.
Judged against `docs/agents/M08_PASS_BRIEF.md` ("Kind of game and aim"). Evidence is cited from `scenario.json.erb` (abbreviated `erb`) and the ink files (per-file line numbers), not the older design docs. SecGen XML and the four named field guides weren't opened. Every claim about what is on the VM is listed under "Needs the user" as needing a check against SecGen.

Validator (`--skip-ink --no-graph`): schema, geometry and doors clean. One co-fire warning on `closing_debrief`/`brief_taken` (the four handlers complete four different tasks, so firing together is intended). Six suggestions about credit sections with no unconditional line; all reviewed, none is an empty heading in practice.

## Severity table

| # | Sev | Area (rubric row) | Finding | Fix (short) |
|---|-----|-------------------|---------|-------------|
| B1 | blocker | Aims, deduction (2, 5) | The mole hunt is optional and the name is handed over by HaX's flag-4 text | Make naming required and evidence-based; strip the name from flag-4 text |
| M1 | major | Suspects (4) | Pointers stack on Nightshade before any evidence; both innocents clear themselves on the first question | Rebalance tells; let the audit, not the interview, clear Phantom |
| M2 | major | HaX hub (3) | HaX in person says the mole has "fifteen years", before identification, and only Nightshade has fifteen years | Gate on `mole_identified` or reword |
| M3 | major | Red herrings (5) | Wrong accusations and tipping off the mole cost nothing mechanical | Wire costs: Cipher withholds his row, Nightshade tidies up |
| M4 | major | Debrief, VM flags (8, 10) | Debrief and credits never reflect the VM chain beyond "the box" | One debrief beat on the self-inflicted repo exposure; a credits section for the box |
| M5 | major | Canon, season threads (1) | Architect teacher line is said by Nightshade and nobody reacts; standalone players get nothing | HaX reacts after the confrontation; one debrief option |
| M6 | major | mission.json (8) | `moralChoices` lists a choice that isn't in the game (`safetynet_exposed`) and calls the handover "Arrest" | Replace with the real debrief-stance choice; canon wording |
| m1 | minor | Aims (2) | Only Nightshade's interview task hides his name ("duty officer"), which collides with Phantom's "duty officer" | Name all three the same way |
| m2 | minor | Debrief (10) | "Not one scrap of intelligence" after he gave Tomb Gamma freely | Reword |
| m3 | minor | Debrief (10) | Debrief opens "in the corridor outside the interrogation suite" but can fire on entering any room | Neutral location line |
| m4 | minor | mission.json CyBOK (8) | Over-claims (cryptography, kill chains), duplicate AAA entry, likely missing WAM; lore and metric entries wrong | Tidy the mapping to what the player does |
| m5 | minor | Suspects (4) | Nightshade hands his locker key over with no beat of reluctance or motive | One narrator or line beat |
| m6 | minor | Moral choice (5) | Triple-agent choice buys nothing in m08, because Tomb Gamma is given on both branches | Give the leash one concrete in-mission return |
| m7 | minor | Header (8) | Header comment names a different SecGen scenario from mission.json | Correct once the user confirms (see U1) |

Counts: **1 blocker, 6 major, 7 minor.**

Rows passing without findings: music (row 6: cutscene → noir → threat → spy-action → victory, `erb:146-226`), KO resilience (row 9: every suspect, the Director, HaX in person and the confrontation NPC have a fallback; `erb:684-737`, `:871-906`), opening bookend (`skipIfGlobal`, `erb:529-536`), the conclusion gate (`concludeRequires` lists only the four flag tasks, `erb:467-474`), and the m07 continuity facts (51-minute intercept, two dead agents, stripped Tomb Gamma coordinates: `m07_closing_debrief.ink:240, 408, 431` against `erb:1632`, `m08_director_netherton.ink:71`, `m08_nightshade_confrontation.ink:128-130`). Rooms (row 7) are left to the dressing stage.

---

## Findings

### B1 (blocker): the deduction is optional, and an NPC hands over the answer

The brief's first aim is that the mole hunt is real deduction, not handed over by a task title, toast or NPC. On every route today the player can reach the confrontation without deducing anything:

- **HaX names him on flag 4.** `erb:654` "It's Nightshade. I trained with him." and `erb:655` "It's Nightshade. You had him first." These are the source of `mole_identified` (`erb:661`).
- **The naming step is optional.** `name_the_mole` (`erb:349-354`) and `read_the_archives` (`erb:339-345`) are `optional: true`. The door-audit reading (`m08_director_netherton.ink:248-374`) is the mission's only real deduction, and nothing requires it.
- **The interviews can be skipped as well.** `confront_the_mole` unlocks on `correlate_the_evidence` (`erb:429`), not on `work_the_suspects`. The badge-printer route (`erb:946-968`) opens the server room with no interview. The route is: post-it → printer → VM → HaX says the name.
- **After flag 4 the Director offers one pre-written line:** `[It's Nightshade, sir. The root logs name his account.]` (`m08_director_netherton.ink:120`). No wrong name is possible.
- The evidence wall names him once `mole_identified` is set (`erb:1542`). That's acceptable after real deduction, but at present it repeats the hand-over.

**Fix.** Two workable shapes. Option B is mission-local and recommended now. Option A is stronger if SecGen agrees (U2).

- **Option B (mission-local).**
  - Flag-4 texts give the terminal and the time, never the person. For example: "Root. The plan was opened from crypto-lab-04, D-2 10:38, forty-seven minutes. The account's on the box; the hands on the keyboard aren't. Who was behind the lab door?" Keep the database-theft beat.
  - Move `mole_identified` off the flag-4 mapping and onto a correct naming in Netherton's ink.
  - Make `name_the_mole` required (drop `optional`), and gate `confront_the_mole` on it as well as on `correlate_the_evidence`. Use a pair of latched mappings, as for `get_suite_code` (`erb:860-870`), so lesson 27 still holds.
  - Replace `:120` with a three-way naming knot (Cipher / Phantom / Nightshade) that routes through the existing `audit_c1..c4` check, with the box's time standing in for step 1 when the player hasn't read the timeline.
  - Keep `audit_closed` as the fallback after three misreads, but make it cost something (M3): Netherton names him from the logs himself, and the credits and debrief already record "The box made it" (`erb:186`, `m08_closing_debrief.ink:80-82`).
  - Add HaX hub hints gated on progress: `{found_badge_audit and not named_on_evidence}` "Read the door against the clock, not the man", next to `m08_phone_agent_0x99.ink:99-102`.
- **Option A (needs SecGen).** The box shows a shared or service login used from crypto-lab-04, and only the door audit puts a person at that terminal. The VM and the deduction then each carry half the case. This depends on what the VM's logs and mail actually contain (U1).

Either way, the dialogue stage needs to re-check the dependent lines:
- `m08_nightshade_confrontation.ink:47` "My account, my terminal, my mail."
- the evidence wall (`erb:1540-1542`)
- the HaX hub post-identification lines (`m08_phone_agent_0x99.ink:103-111`)
- Nightshade's `asked_logs` (`m08_suspect_nightshade.ink:72-78`).

### M1 (major): every pointer leans one way, and the innocents clear themselves at once

Before any evidence the player is steered to Nightshade by:
- Netherton: "It is the empty file that keeps me awake ... A man who leaves none has been very careful" (`m08_director_netherton.ink:107-108`);
- the dossier's handwritten note "The one with nothing on the file worries me most." (`erb:1047`);
- the personnel printout the Director requested, which lists **only Nightshade** (`erb:1172`), so the Director has visibly singled him out;
- ATHENA: "The calmest person in a frightened building ..." (`m08_receptionist_ai.ink:25`);
- the opening, which names 0x47 as the PIN-cracker holder (`m08_opening_briefing.ink:16`). This one is a good, subtle plant; keep it.

Against that, the herrings collapse:
- Phantom gives an airtight alibi on the first question and invites a check (`m08_suspect_phantom.ink:52-53`), then points at "who has stopped believing we can win" (`:59`), which is Okafor's diagnosis of Nightshade.
- Cipher's alibi (`m08_suspect_cipher.ink:56-58`) is better, because it hides the eight lab minutes the audit exposes (`:60-66`). Keep that.

**Fix.**
- **Cut or soften the Director's thumb on the scale.** Drop `:107-108` and the dossier note, or give each suspect one Director worry of equal weight. Cipher's is already there (`:124-125`).
- **Make the printout an investigation copy of all three** (three service numbers, one "Requested by" line). This keeps the safe deduction and removes the singling-out.
- **Have Phantom refuse to give an alibi** ("Out of the building. Where is my business."). The audit's TRAVEL DESK row (`erb:1368`) then clears him, so the printout does work.
- **Give Phantom one real tell**, for example an unlogged absence that overlaps D-2 morning before the flight. It needs to read as suspicious until the manifest row is read.
- **ATHENA's line** can stay if the Director's lines go. One ambient tell is fine; four is a confession.

### M2 (major): HaX in person gives the mole's length of service

`m08_agent_0x99.ink:53-55`, offered whenever `not fate_decided` (from the first visit): "He's had fifteen years to polish it." The dossier gives fifteen years' service to Nightshade alone (`erb:1047`), and the printout repeats it (`erb:1172`). The pronoun "he" doesn't separate anyone, because all three suspects are men.

**Fix.** Gate the choice on `mole_identified`, or reword it so it names no one: "Whoever it is will explain. They always explain. Don't argue the philosophy..."

### M3 (major): red herrings and tipping off the mole cost nothing

- `cipher_influence`, `phantom_influence` and `nightshade_influence` are written (for example `m08_suspect_cipher.ink:50, 106, 112`) and read nowhere in the scenario or ink. A wrong accusation costs one debrief paragraph (`m08_closing_debrief.ink:66-69`) and a credit line (`erb:177, 180`).
- Accusing Nightshade early sends HaX's warning, "If he was ever going to tidy up, he's doing it tonight." (`erb:792`). The confrontation then says he didn't (`m08_nightshade_confrontation.ink:68-69`). The brief asks for "a tipped-off mole" to cost something.

**Fix (mission-local, nothing removed from the required route):**
- **Accusing Cipher** (before `mole_identified`) shuts his door-audit confirmation (`m08_suspect_cipher.ink:60`, add `and not accused_cipher`) until the player apologises. That choice exists at `:88`, but today it needs `mole_identified`, so relax the gate to `accused_cipher and cipher_audit_confirmed == false`. Netherton's step-4 check (`m08_director_netherton.ink:255-262`) then depends on Nightshade's own confirmation, which is a real trust cost.
- **Accusing Phantom** loses a lead he'd otherwise give. Add one unaccused-only hub line that sends the player to the archive printer, or one that recognises the duty officer who walked him out (see m1).
- **Accusing Nightshade early** makes him tidy up. On `accused_nightshade` before `mole_identified`:
  - the go-bag is gone and the USB stick is wiped, which loses those credits and confrontation lines;
  - change `:68-69` to "You told me. So I tidied. Not well enough." Keep the thumbprint on the casing as what survives.
  - Both items are optional (`erb:1658-1703`), so nothing soft-locks. If the engine can't change container contents on a global, see U3.

### M4 (major): the debrief doesn't reflect the VM work

HaX reacts to each flag (`erb:621-664`), the flags are framed by the task titles (`erb:372-420`) and they're required (`erb:467-474`). That part is good. The debrief, though, mentions the box only as a generic "the box made the case" (`m08_closing_debrief.ink:81, 98, 100`), and the credits have no line for it (`erb:163-208`).

The strongest story fact the VM gives is left unused: SAFETYNET's own headquarters ran an unpatched repository browser with no login and committed credentials to its history (HaX: "That's a report nobody will enjoy", `erb:626`; "Everything we tell clients not to do", `erb:744`).

**Fix.**
- Add one unconditional Netherton beat before `-> disposition` (for example after `m08_closing_debrief.ink:105`). Something like: "And our own code server let you in without a password, and kept his credentials in its history for anyone patient. That goes in my report too." This also feeds the debrief stance.
- Add a credits section "── THE BOX ──" with four unconditional lines (all four flags are required), each naming what that flag proved in story terms.

### M5 (major): the Architect's teacher line lands with no one to hear it

The m07 canon: HaX says "Let it hurt afterwards, not during" to every agent she runs. The Architect echoes it, and HaX hears her teacher in it (`m07` erb `:737, :744`; `story_design/universe_bible/04_characters/safetynet/agent_0x99_haxolottle.md:245`; voice bible `:179`).

In m08, Nightshade says it as his last line (`m08_nightshade_confrontation.ink:183`), and the comment there calls it "unexplained". No one reacts:
- HaX has no topic for it (`m08_phone_agent_0x99.ink`, `m08_agent_0x99.ink`);
- the debrief is silent;
- `mission.json` is `standalonePlayable: true`, so a standalone player gets nothing from it.

Paired with "the man who put me here fifteen years ago" (`:130`) and "Training. His own, fifteen years ago" (`m08_closing_debrief.ink:129`), this is the season's best reveal so far, and it isn't being landed.

**Fix.**
- A HaX phone text on `conversation_closed:nightshade_confrontation` with `fate_decided === true`, once only, after the debrief cue has had time to fire. For example: "He said it to you? 'Afterwards, not during.' That isn't his line. It's the one I was taught. Same classroom, 0x00." She names no one, which is canon (`agent_0x99_haxolottle.md:245`).
- An optional debrief hub choice: `[He used HaX's line. The one she was taught.]` → Netherton goes quiet. Something like: "Then the man who trained half this service also chose who to keep." It stays a hedge, never a name (the M9 reveal stays intact).

### M6 (major): mission.json describes choices the game doesn't have

- `mission.json:184-198` lists the "Expose Internal Vulnerabilities" choice with variable `safetynet_exposed`. There is no such global or choice. The game's second choice is the debrief stance, `debrief_stance` defended/owned (`m08_closing_debrief.ink:49-63`, `erb:201-202`).
- `mission.json:169-171`: "Arrest". Canon is detain and hand over to police (brief, "Kind of game and aim"; the game itself says "handed to the police", `erb:170`).

**Fix.** Replace the second choice with the debrief stance (options "He's the crime, not you" / "Own the gap", variable `debrief_stance`). Rename the first option to "Hand over to police (no deal)".

---

### m1 (minor): the odd task title out

`interview_nightshade` is titled "Interview the cryptography lab's duty officer" (`erb:331`), while the other two tasks name their suspect (`erb:319, 325`). The brief has already given the player all three names, so hiding one draws attention to it. "Duty officer" is also the person who walked Phantom out of the archive before the audit printed (`erb:1257`; `m08_suspect_phantom.ink:75`). That reads as Nightshade knowing about the audit, and the mole wouldn't then have left it on the floor.

**Fix.** "Interview Agent Nightshade in the Crypto Lab". Either rename Phantom's "duty officer" to "the archive duty officer", or make the link deliberate and pay it off (M3).

### m2 (minor): "not one scrap of intelligence"

`m08_closing_debrief.ink:122` follows a confrontation in which he always gives Tomb Gamma (`m08_nightshade_confrontation.ink:161-165`). **Fix.** "Beyond what he gave freely tonight, it buys us nothing, and I do not care."

### m3 (minor): debrief location

`m08_closing_debrief.ink:37` places Netherton "in the corridor outside the interrogation suite". The debrief can open on entering any room once the fate is in (`erb:927-939`, the reload backstop). **Fix.** "Netherton finds you, empty-handed."

### m4 (minor): the CyBOK mapping and other mission.json entries

**CyBOK mapping:**
- `AC` "Encrypted communication analysis / Decoding intercepted messages" (`mission.json:86-90`): the player decodes Base64 and ROT13 off an optional USB stick. That's encoding, not cryptography. Reword to "Encoding vs encryption" or drop it.
- `AB` "kill chains" and `MAT` "cyber kill chain" (`:66-75`): nothing in play names or uses a kill chain. Drop them, or keep one if the lab sheet will teach it.
- `AAA` Authentication appears twice (`:31-35`, `:96-100`). Merge them.
- The repository browser is a web application, so `WAM` (server-side injection) probably belongs. Its exact keyword waits on U1.
- `F` Forensics, "Log analysis / Timeline reconstruction" (`:82-85`), only matches what every player does once B1 makes the audit reading required.

**Other entries:**
- `loreCollectibles` (`:200-226`):
  - "The Architect's Communication to Nightshade" is Nightshade's sent mail to the Architect (`erb:110`).
  - "Nightshade's Training Records" is Okafor's psych evaluation (`erb:1079-1091`).
  - The Deep State brief sits in his locker (`erb:1677-1689`), not in "encrypted files".
- `successMetrics.partialSuccess` "2-3 VM flags submitted" (`:252-256`) can't happen: all four are required.
- `mechanics` omits the mission's real new mechanic, the door-audit reading.

### m5 (minor): the locker key

`m08_suspect_nightshade.ink:94-97`: the careful mole hands over the key to a locker holding a false passport and the signed mail, with "I'd genuinely encourage it." His "wanted to be caught" arc covers it, but a beat would help, for example a narrator line: "He holds it out a second before he lets go."

### m6 (minor): the triple-agent branch has no return in m08

Tomb Gamma is given on both branches (`m08_nightshade_confrontation.ink:161-165`), so the leash costs everything and returns nothing in this mission. **Fix.** On the triple-agent branch, one extra line from him with a concrete m09/m10 return, matching `mission.json:239` ("Tomb Gamma defensive layout"). Mirror it with a credit line.

### m7 (minor): stale header

`erb:17-23` says the VM is SecGen "Such a git" (`scenarios/ctf/such_a_git.xml`). `mission.json:5, 103` says `m08_the_mole`. Files with both names exist in SecGen; neither was opened. Correct the comment after U1.

---

## Needs the user

**U1. SecGen checks (needs checking against SecGen by the user).** The in-game text makes these VM claims:
- **Which scenario is built:** `break_escape/safetynet/m08_the_mole.xml` (mission.json) or `ctf/such_a_git.xml` (erb header)?
- **Flag order:** does flag 1..4 = GitList injection / committed credentials / home directory / root via sudo (`erb:1300-1303`; the header says the order is unverified)?
- **The committed credentials** resolve to an account named `nightshade_ops` (`erb:1540-1541`).
- **The home directory** holds sent mail to `architect@entropy.onion` (`erb:642`, `:1302`, `:1540`).
- **A root-only access log** shows the plan opened from a Crypto Lab terminal for 47 minutes, two days before Portland (`erb:654-655`, `:1303`). A "root file" says the night was for the threat database (`erb:654`).
- **The second login method** ("Log in properly", `erb:634`; `mission.json:36-40` claims SSH).
- **The CVE identifier** in `mission.json:44, 105`.

*Recommendation:* if the VM is the generic CTF, it won't carry the story files. In that case HaX's flag-3 and flag-4 texts should be reworded so they don't describe files the player can't find, or the m08 SecGen scenario should place them (memory note: SecGen has VM contents).

**U2. Story direction for B1.** Option B (mission-local: the box gives time and terminal, the Director takes the name and checks it against the door audit) or Option A (the box shows a shared login; this needs the VM content to agree). *Recommendation:* implement B now. Revisit A once U1 is answered.

**U3. Possible engine change for M3.** Changing or emptying the locker's contents when `accused_nightshade` is set before evidence. If containers can't change contents on a global, the fallbacks are `textVariants` on the go-bag and stick (if readable notes support them) or one HaX line plus a confrontation line. *Recommendation:* try `textVariants` first. If it's unsupported, log it in the backlog and use the dialogue-only cost.

**U4. Canon for M5.** May HaX hedge-recognise the teacher line again in m08 ("Same classroom"), short of naming Tesseract? Canon says not before "m08 at the earliest; the season plan puts the reveal at M9". *Recommendation:* yes, as a hedge with no name.

**Cost note.** B1, M1, M2, M4, M5, m2, m3 and m6 all change or add spoken lines. List them old → new for the TTS stage. Check whether m08 has any cached audio before the dialogue stage.
