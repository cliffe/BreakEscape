# m07 The Architect's Gambit — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m07-dialogue/m07-ink-before/` (ink) and
`m07-scenario-before.json.erb`. The current files were compared against it line by line. Line numbers
below are the **current** files unless marked "before". References: `docs/agents/PASS4_BRIEF.md`, the
dialogue style guide, the voice bible, the humanizer rules, `DIALOGUE_REVIEW.md`, `DIALOGUE_SAMPLES.md`.

The short version: this is a good pass. The scenes start later, the scripted player lines are gone,
Netherton and HaX sound like themselves, and the Architect is untouched where it matters. Three cuts went
too far: the debrief stopped reading the dead, a VM hint lost the one fact a stuck player needed, and one
of Elena's lines lost the antecedent the player's reply depends on. Those are small edits. Verdict at the
end: **revise** (light).

## 1. Logic safety (mechanical checks)

All run by me in this session; output in `<scratchpad>/m07-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 8 ink files | **STRUCTURE UNCHANGED** in all 8. Prose changes only. `You:` lines 19 → 2 (Elena :334 and Mercer :110, both after a silent choice). |
| Compiled JSON in step with the ink | Recompiled all 8 with `bin/inklecate` into scratch; every JSON is identical to the committed one. |
| `dialoguelint.mjs` | 0 errors, 0 warnings. One rule left: `you-after-choice=2`, both the allowed non-verbal cases. Lint now measures the unprefixed phone lines (HaX 105 lines, median 13, max 25; Architect 49, median 12, max 24). Debrief median 17, briefing 18, timed texts max 30. |
| `reopencheck.mjs … m07_architects_gambit` | agent_0x99 and the_architect, 1800 reopens each, **0 problems**. |
| `loopcheck.js` over the writer's 32-state matrix | **32/32 clean**, no runtime errors or runaways; hubs loop, the briefing and debrief reach a clean end. (inkcheck skipped: it times out on HaX's hub before and after, as the writer reported.) |

Nothing here blocks. The pass changed words, not logic.

## 2. Information: what the player needs, and where it is now

Walked the critical path and each optional branch against the before-copy.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Commit the team, before the gate | Briefing `m07_opening_briefing.ink:73-81`; HaX hub `m07_phone_agent_0x99.ink:194` | Yes (sticky choice, task) |
| Kit (no PIN cracker) | Briefing `:38` | Inventory |
| Site: evacuating, one guard bought, readers log you | Briefing `:293-295` | HaX layout `:117-119`, see S2 |
| Server-hall badge: Hollis, or the badge station plus its PIN | Text (erb message "Server hall door…"); RFID guide `:535-539`; Hollis `m07_npc_ray_hollis.ink:174` | Yes |
| Badge-station PIN source | Text "PIN set to the audit date…"; handover sheet object | Yes (object) |
| Hollis leverage | Hub choices `m07_npc_ray_hollis.ink:84`, `:86` | Handover object |
| Plant door: key on ops floor, or pick | Text "Plant door, south side…"; lockpicking guide `:552-556` | Yes |
| VM stage 1 | Text on the attack box; `vm_hint_1` `:476-480`; NFS guide | Yes |
| VM stage 2 | `vm_hint_2` `:485-487` | **Blurred**, see M2 |
| Control room password | `vm_hint_2` `:487`; Elena `:280`, `:294`; erb text after stage 2 | Yes |
| VM stage 3, and "open the control room door first" | `vm_hint_3` `:492-494`; `guide_ssh` `:604`, `:611` | Twice, both once-only; see S1, S2, S3 |
| VM stage 4, then the abort at the control-room console | `vm_hint_4` `:499-503`; erb text "Root…"; privesc guide | Yes |
| Redirect evidence (nine days, dispatch on the manifest) | Elena `:219-231`; `topic_traffic` `:403-405`; erb decode object | Yes (object) |
| Vault PIN rule and digits | Decode site notes (erb object); Hollis `:177-179`; Elena `:282`, `:294`; HaX `vault_hint` `:518-523` | Yes |
| Park: show him the projection | erb text (Park); HaX `topic_park` `:509-510` | Yes |
| Bring me in / flags outstanding | HaX `:285-287`; erb fallback texts | Yes |

Losses and blurs, by severity:

- **M2.** The stage-two hint lost the one piece of scan guidance the old line carried (before `:465`), and the NFS guide reply lost the same sentence (before `:560`). The NFS lab sheet doesn't cover it; the recon lab sheet does. A stuck player asking HaX now gets "Find it" and no pointer. Fix in M2.
- **S1.** `:122` "Log in to that host and assume they start it." reads as an order to log in, and the next line then says to open the door first. Before, it was conditional ("The moment you log in…").
- **S2 (structural, for the log).** `first_call_committed_choices` (`:115-127`, the layout and "What's the clock?") is unreachable in normal play: the phone preload always lands in `first_call_open` (erb comment at `scenario.json.erb:731`, `CONTRACT.md` round 3). So the layout and the clock rule are dead lines. Not caused by this pass, but this is the moment to see it. Suggest a sticky hub choice that reuses those two answers; that's a structure change, so the orchestrator should log it.
- **S3.** `vm_hint_3` `:492` "That's one login." no longer says which service; before it named it. The erb text that precedes it mentions the guide, so it's findable, but the hint should say it: "That's one SSH login. The flag's in its home directory."
- **S4.** `redirect_open` `:305` "The dispatch keys are late in their sequence" lost "healthcare and dispatch" and "the manifest", so "their" has no clear owner. Replace: "Health record and dispatch keys are late in the Austin run. Even a late team keeps ambulances on the road."
- **M1 (debrief figures)** removes information as well as voice; see section 3.

Everything else the cuts removed was colour or was already on paper (the Threat Desk Summary, the decode, the field guides). The briefing trim is right: the decision-relevant facts (deaths, horizon, what the team can stop, "No projected fatalities", "strategic", "ENTROPY's own casualty estimates" at `:215`) all survive.

## 3. Character

**Netherton.** Right in both scenes: formal, few contractions, short declaratives, one handbook joke
(briefing `:239`), and the debrief's "handbook" line correctly gone. Two problems.

- **M1 (must-fix). The debrief stopped reading the dead.** The writer replaced three casualty figures with
  pointers: `m07_closing_debrief.ink:87` ("had a death toll"), `:259` ("is in your file. I am not going to
  read it aloud") and `:271` ("Some of the people… did not survive the wait. The desk's count is in your
  file."). This breaks three things at once:
  - the voice bible: Netherton "never softens a casualty figure" and "reads the bad numbers in full and
    refuses to soften them" (`voice_bible.md:95`, `:97`). "I am not going to read it aloud" is the
    opposite of that man;
  - the scene's own rule at `m07_closing_debrief.ink:18` ("The two abandoned operations are read out by
    name and by number, always") and the `scenario_brief` at `erb:71` ("somebody will read out what
    happened at both"). Fracture still gets its number (`:250`); Trojan Horse and Meltdown now don't, so
    the payoff depends on which team the player sent;
  - information: "your file" points at nothing the player holds. The Trojan revised toll appears nowhere
    else in the game, so the cost of the revision lands as a shrug.

  Fix: restore the figures the before-copy held (before `:87`, `:255`, `:267`), each as its own short line
  within the 30-word cap, and delete "I am not going to read it aloud" and "The desk's count is in your file".
  The briefing already reads these ranges aloud, so this adds no new detail to the game. Keep the new
  "Some of the people booked in for those operations did not survive the wait." only if the number follows
  it as the next line.
- **S5.** `m07_opening_briefing.ink:237` "Twenty years in this work have taught me one thing." is a stock
  opener, and the cut removed the line's point ("…and calling it command", before `:250`). Replace:
  "Twenty years of this work, Agent. A director who chooses for the agent he is sending in is choosing for
  himself, and calling it command." (24 words.)

**HaX.** Clipped, fact first, no mottos, no exclamation marks. The mole reaction (`:452-456`) is the best
change in the pass: she suspects her own building and won't say it on the line. Fixes:

- **S6.** `:110` "the one place that still turns on a person" reads as "attacks a person". Replace: "You're my hands
  in the one place where a person on the ground still changes the ending."
- **S7.** `:297` "Here's what it costs, undressed." is an odd word and lands as a joke. Replace: "I hear you.
  Here's the cost, straight."
- **S8.** `:371` "Hold onto that as a fact, not an excuse." is a hero "not X, Y". Cut to: "You're in the one
  place a person on the ground could reach. Hold onto that."
- **Optional.** `:389` "Keep that in mind." is filler, and the cut lost the foreshadowing of the mole.
  Replace the line with: "It's a small version of a bigger question. You'll meet the big one tonight."

**The Architect.** Still the best voice in the mission. One break:

- **S9.** `m07_architect_comms.ink:319` "I didn't expect that. I do like being surprised." His voice style
  says "Nothing that happens tonight surprises him, including losing", and the voice bible says the same.
  Replace: "And you moved them. Late, but you moved them. I had you down for staying put."
- **Optional.** `:114` "Make it any way you like" was changed only to dodge a lint false positive on
  "however"; the voice bible quotes the original as his example line. Revert to "Make it however you like."
- **Optional.** `:224` "I respect that" is warmer and more personal than he is. Revert the end to "That is
  worth something, even when the figure is monstrous."

**Narrator.** Mostly camera now. Three lines still interpret:

- **S10.** `m07_npc_ray_hollis.ink:131` "He knows exactly where that something is. He's hoping you don't."
  reads his mind. Replace with a look that is also a pointer to the handover sheet on the ops floor: "His
  eyes go past you to the ops-floor door, and come back."
- **Optional.** `m07_closing_debrief.ink:241` "…which is worse than if he had tried." comments; end the line
  at "to soften it." (pre-existing, but this pass's rule).
- Keep `:440` "He says it like a line he has decided to believe." It's subtext, and it sets up m08.

**The one-scene cast.** Distinct with the names covered. Park talks in fragments and minutes; Hollis is
flat and defensive; Elena is wry and exact ("It's read-only. Of course it is."). Mercer is the one who
suffered:

- **S11. Mercer's rhythm was flattened.** He's the professor; the voice bible gives him room. After the trim
  he speaks in the same three-short-sentences rhythm as Netherton and HaX (`m07_npc_james_mercer.ink:165`
  "I did publish. Four papers. I testified twice."). Give him back two or three long lines, within the cap:
  - `:165`: "I did publish. Four papers, two of them still cited. I testified twice, and filed the same
    submission three times in eight years." (23 words)
  - `:168`: "In 2019 a solar storm came within ninety minutes of taking the western grid down on its own, and
    nobody wrote a word about it." (25 words)
  - `:227`: restore the specific column name from before `:234` in place of "cold-weather"; the specific word
    is what makes the line his.
- **S12.** `:185` ends "I wrote it." and the reply at `:190` opens "I wrote them." The second loses its
  punch. Cut "I wrote it." from `:185`.
- **Optional.** Mercer is American but says "rather the point" (`:174`, which the Architect also says at
  `:198`) and spells "artefact" (`:244`). Change `:174` to "It's a very long way to walk to reach anything.
  That's what the length is for." and use "artifact". "Genuinely" turns up for Mercer (`:272`), Hollis
  (`m07_npc_ray_hollis.ink:209`) and the Architect (`:270`), and the voice bible gives it to Nightshade;
  change Hollis's to "I'm sorry. I mean it."

## 4. Craft

**Choices.** First person throughout, no echoes, and the two flat pairs the writer flagged are now real
moves (Elena `:195-197` confirm/push; Park `:35-37` appeal/clock). Three choices don't fit their replies:

- **M3 (must-fix). Elena's turn has lost its antecedent.** `m07_npc_elena_rodriguez.ink:257` now reads "If I
  help you, the rest of my life is a courtroom." The player's choice at `:259` ends "There isn't." and her
  reply at `:260` is "No. There isn't." Both answered the old line ("there is no version of the rest of my
  life that isn't a courtroom", before `:264`). On the main turn path the player now says something that
  doesn't follow. Replace `:257` (choices untouched): "You know what you're asking. Help you, and there's
  no version of my life after this that isn't a courtroom." (22 words)
- **S13.** Briefing `:61` "[Four operations on one clock. Who's running all this?]" gets an answer about how
  SAFETYNET knows, not who. Replace the choice: "[Four operations on one clock. How do we know all this?]"
- **S14.** Mercer `:288` "[Away from the console. Hands where I can see them.]" is the fight ending, but it
  reads as an arrest. It's next to "[Sit down, doctor. The police are on the stairs.]", and the player's opening line to Elena
  line uses the same words. A player who wants him detained can pick it and get a brawl. Replace:
  "[Away from the console, or I put you on the floor.]"

**Repeated beats.** The trim made some echoes more noticeable:

- **S15.** HaX `:324` "You changed your mind under a clock, on evidence you found yourself. Not many can."
  and Netherton's debrief `m07_closing_debrief.ink:148` "You changed your mind under a countdown. Most
  people cannot." The player hears the same compliment twice. It belongs to Netherton. Replace HaX's line:
  "Done. It's logged under your name."
- **S16.** "No common scale" is said three times: Netherton `m07_opening_briefing.ink:224`, HaX `:375` and
  Netherton's debrief `:514`. Netherton's two are a deliberate callback; HaX's sits between them and wears
  it out. Cut `:375` to "No. That was the design."
- **S17.** HaX `topic_traffic` `:403` "Four operations, one schedule, one authority." repeats the choice the
  player just read. Replace: "I've read it. One authority signing for all four. One operation wearing four
  coats."
- **Optional.** HaX's mole reply `:454` and the Architect's "no bodies in the brief" (`:138`) both work.
  Netherton's handoff `:537` restates the coda for the third time, but it's the only statement of the leak
  that coda_thin players hear, so keep it.

**Subtext and exposition.** Better than before. The coda now explains the twist once, in the debrief, and
the phone reacts instead of explaining. Netherton pointing at the Threat Desk Summary (`:81`) rather than
reciting it is right; the summary exists (`erb:275`). HaX's "Look around you." about Elena (`m07_phone_agent_0x99.ink:394`)
is a good cut.

**Debrief payoffs.** Every choice-setting global is still read back by name: team, redirect or declined,
Mercer's stance, fate and diversion, Elena's four states, Hollis, Park, Tomb Gamma, the mole, and the
stance. The one weak payoff is M1.

**The Tesseract plant.** It still lands. HaX's text (erb messages 1 and 2, `:736`, `:743`) and her answer
to "How do you carry that?" (`m07_phone_agent_0x99.ink:370`) use the exact words of the Architect's
`t30_close` line (`m07_architect_comms.ink:116`, "Let it hurt afterwards, not during."). The texts arrive
before his ops-floor call. `topic_teacher` (`:435-445`) branches on whether she said it, never names
anyone, and asks the player to keep it out of their notes. "...Read me that again." fits a call the player
has on screen. No change needed.

**The mole beat.** It also lands, better than before. The Architect quoting Netherton's private phrase
"no bodies in the brief" (briefing `:266`, Architect `:138`) is a clean plant that the writer created by
aligning the two lines; worth keeping and logging. HaX's phone reaction stops short; the coda
(`m07_closing_debrief.ink:402-414`) does the explaining, and Netherton closes on the operational result
("every briefing I give is a message to ENTROPY with a delay on it"). The player's own choice at `:236`
("They didn't leak the operation. They leaked me.") is a hero "not X, Y", but it's the player's big
moment and earns the shape. Keep.

**Optional craft notes.**
- Six guide exits end on "Go." (`:546`, `:563`, `:580`, `:596`, `:611`, `:626`), and the pass made them more
  alike ("Patient hands. Go."). Restore `:563` to "Patient hands open any of those." and let two others end
  without "Go.".
- Elena `:227` repeats the player's "As in 911 call routing." Give her a new fact that also ties to the
  debrief's "eleven counties": "Eleven counties' worth."
- Coda `m07_closing_debrief.ink:413` is a three-item list; two is stronger: "How fast we decide, and which
  numbers we believe."
- Elena `:282` lost who reset the keypad (before: "Mercer's tech"), which was a quiet link to Park. "Mercer's
  tech reset it after my survey, so the plant log's out of date."

## 5. AI tells and UK English

A hand search for the banned words, the transitions and the "not X, Y" shapes turns up nothing that the
lint missed, apart from the items below.

- **Rhythm.** The main tell left is rhythm, not vocabulary. Trimming every long line the same way has
  produced one cadence across the cast: three short declaratives in a row ("Tomb Gamma. The Architect's
  workshop, where tonight was put together. No coordinates." / "Six hours. One region." / "Three briefs. One
  team."). For Netherton it's correct; spread across HaX, Elena and Mercer, it reads as one writer. S11
  (Mercer) is the main fix. Elsewhere, let one line per scene run long where the speaker would.
- **Disguised "Not X. Y."** `m07_npc_elena_rodriguez.ink:304` "Don't call it brave. It's the only door
  left…" is the old "That's not bravery. It's…" rewritten into the same shape. It's natural speech, so it's
  optional; dropping "Don't call it brave." works too. HaX `:371` is S8. Netherton's "The choice was yours.
  The menu was his." and "He measured you. He did not beat you." are contrast pairs, but each one makes the
  scene's argument. Keep them.
- **Tidy endings.** Mostly gone. The ones that remain are earned ("Ashford is never with them.", "And he
  is still out there."). `:501` "Keep the discipline. Change the numbers you trust." (pre-existing) is a
  motto; optional cut.
- **UK English.** Narration and British speakers are clean (storeys, programme, per cent, fortnight,
  defences, theatre lists). The American cast keeps American idiom (parking lot, apartments, 911). Only
  Mercer slips the other way (see S11 optional).
- **Comma splice in a text** (S18): erb `:820` "Their listener hands out passwords in clear, the control
  room door's among them." Replace: "Their listener gives out passwords in clear, the control room door's
  included."

## 6. Findings list

**Must-fix**

- **M1.** Debrief `m07_closing_debrief.ink:87`, `:259`, `:271`: restore the casualty figures from the
  before-copy (`:87`, `:255`, `:267`) as short lines; remove "I am not going to read it aloud" and the
  "in your file" pointers. Voice bible `:95`/`:97`, the scene rule at `:18`, `scenario_brief`.
- **M2.** HaX `m07_phone_agent_0x99.ink:485` (`vm_hint_2`) and `:590` (`guide_nfs`): put back the scan
  guidance the before-copy carried (`:465`, `:560`), worded as it was, in short lines. Better still, point
  at the recon field guide's scanning step, which is the one that covers it; the NFS guide doesn't. Keep it
  at citation level.
- **M3.** Elena `m07_npc_elena_rodriguez.ink:257`: "You know what you're asking. Help you, and there's no
  version of my life after this that isn't a courtroom."

**Should-fix** (replacement lines given above)

S1 HaX `:122` conditional clock line · S2 the layout and clock answers are unreachable (structural; log it)
· S3 `vm_hint_3` names the service · S4 `redirect_open` `:305` health record and dispatch keys · S5
Netherton `:237` "calling it command" · S6 HaX `:110` · S7 HaX `:297` · S8 HaX `:371` · S9 Architect
`:319` not surprised · S10 Hollis `:131` · S11 Mercer's long lines · S12 Mercer `:185` · S13 briefing
`:61` choice · S14 Mercer `:288` fight choice · S15 HaX `:324` duplicate praise · S16 HaX `:375` · S17 HaX
`:403` · S18 erb `:820`.

For S1, if S2 is accepted the line moves anyway; fix the wording either way: "No clock yet. The sequence
waits on the host that drives it. The moment you log in there, assume they start it."

**Optional**

Architect `:114` and `:224` reverts; HaX `:389`; debrief `:241` narrator clause; Mercer idiom
("rather the point", "artefact"); the three "genuinely"s; guide exits all ending "Go."; Elena `:227`,
`:282`, `:304`; coda `:413`; debrief `:501`.

**Lines this would touch.** About 25 spoken lines and 3 choices across 6 ink files and one erb text. m07
audio isn't generated yet, so no cost. All of them are prose inside existing lines; none touches a tag,
knot, condition or divert. S2 is the only structural item, and it goes to the log rather than into this
pass.

## 7. Verdict

**Revise** (light). The structure is unchanged and every runtime check is clean. The pass makes m07 shorter,
sharper and more in voice, and it should stand. Fix M1–M3 before it ships: M1 because it turns
Netherton into the man the voice bible says he isn't and quietly removes the debrief's cost, M2 because a
stuck player at stage two now gets no usable hint, and M3 because the player's own line no longer makes
sense. Take the should-fix items in the same edit; they're one-line swaps. After that, rerun tagdiff
against the same snapshot, then dialoguelint, reopencheck and the loopcheck matrix. No new playtest is
needed for prose this size, but a read-through of the debrief on screen would confirm M1 reads at the
right pace.

Scratch output: `<scratchpad>/m07-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `loop.txt`,
`json/`).
