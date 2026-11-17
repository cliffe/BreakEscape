# m02 office life: dialogue review, round 1

Scope: `ink/m02_npc_ernesto_bautista.ink`, `ink/m02_npc_hodan_warsame.ink` (conversations and the three exchange knots), the four chatter pools, and the new observations in `scenario.json.erb` (Gary's mug, the photocopier, the fault log, the boiler, the cooler, the microwave, and the two night staff), as of `6cb872ff3`. The exchanges and pools were approved in `DIALOGUE_SAMPLE.md` and the plan; the full conversations and the observations were not, so they get the closest reading here.

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 11 |

## Mechanical checks

| Check | Result |
|---|---|
| Compile (inklecate into a scratch folder) | both files compile with no warnings; the output matches the committed JSON |
| `dialoguelint.mjs` | no findings in either new file (line lengths fine; no `not-x-but-y`, `blank-reentry`, `exit-no-reply`, `choice-fallthrough`) |
| `loopcheck.js` / `inkcheck.js` at `start` | clean under the default state, `night_staff_attacked=true` and `heard_night_watch_burned=true`, for both NPCs |
| Validator (`--skip-ink --no-graph`) | 0 errors; nothing dialogue-facing for the new NPCs (the two V4 attack-probe warnings are mechanical, for the implementation review) |
| Attribution | every prefix is the exact `displayName`; no `#speaker:` tags; no Narrator lines, so no narrator voice is needed |
| Printed variables in voiced lines | none |
| Voices | Algieba and Laomedeia are each used once in m02; both styles name the accent and age |
| Hub shape | `start` then `hub`; topics are `*` and gated, the exit is `+` and always present; each exit gets a one-line reply; the `hub_quiet` re-entry pattern matches m03 |
| Exchanges and pools | the ink and JSON lines match the approved sample and plan section 6 word for word |
| Spoilers | none: no codes, rooms, door details, Val's burn bark or Doyle's biro line; the radio lines never identify the player |
| UK English | fine throughout ("Mind how you go", "tabard", "Sister", "Matron") |

Continuity that works: Ernesto's "under Sister's feet" lands on Sister Doyle, the cooler pool's "Lift's out again" matches the Lift 2 snag already on the staff-room board, Hodan's observation (a bed list "on the back of something else") sets up her exchange line about the menu, and the boiler's NO KETTLES sign sits well beside IT's limescaled kettle.

## Findings

### Major

**M1. Both greetings ask the player something the menu can't answer.**
`m02_npc_ernesto_bautista.ink:22`, `m02_npc_hodan_warsame.ink:23`.
Ernesto opens with "You with IT?", which is a question about the player's cover, the one thing a spy-thriller scene should let the player handle. The next screen offers only job questions, so the player walks past his question in silence. Hodan's "You lost?" has the same gap, though hers reads as rhetorical and costs less. This is the cheapest place in either conversation for a choice that matters.
Suggested fix, either way round:
- Cheapest: make his line a statement. `Ernesto Bautista: IT's through there, if that's who you're after. For all the good it's doing.` (no new choice, same joke at Gary's expense).
- Better: two once-only first-meeting choices after his line, setting a local stance var that the radio topic reads back.
  `* [Security. I'm here about the systems.]` then `Ernesto Bautista: Then I hope they're paying you nights.`
  `* [Something like that.]` then `~ ernesto_cover_vague = true` and `Ernesto Bautista: Fair enough. Nobody's anything tonight.`
  Then at line 52, when `ernesto_cover_vague`: `Ernesto Bautista: Security put a call out for some visitor. I never asked your name, so I've nothing to tell them.` That stays a shrug (plan section 6) but lets the vague answer pay off as a small kindness. Check it against the plan's "does not identify the player" rule before adopting; it implies nothing about who the visitor is.

**M2. The conversations are job interviews; the agendas the exchanges hint at never show.**
`m02_npc_ernesto_bautista.ink:35` to `:50`, `m02_npc_hodan_warsame.ink:36` to `:45`.
Both menus open on the same question shape ("What do you do here?", "What are you on tonight?") and every answer describes the work. The approved exchange gives each of them a small private angle: Ernesto is quietly enjoying being needed ("Don't let them hear you enjoying it"), and Hodan is the sharper of the two ("Checks out with who, though?"). In conversation he is only a porter explaining portering and she is only tired. The brief asks for night staff with their own small agendas, and right now these read closest to the exposition machines it warns against. One line each would fix it without adding a clue.
Suggested rewrites:
- Ernesto, line 35 choice: `* {not night_staff_attacked} [You look like you've done some miles tonight.]` (spoken, invites him in, and differs from Hodan's opener).
- Ernesto, after line 38, one new line: `Ernesto Bautista: Thirty years nobody notices the porter. Tonight they're all waiting on me.` (the pride the exchange teases; avoid also using "Thirty years" in the same break as the pool line, or drop the number here: `Nobody notices the porter, normally. Tonight they're all waiting on me.`)
- Hodan, line 43, replace: `Hodan Warsame: If the bed manager rings, I'm on the back stairs. Wherever they are.` (her own small dodge; keeps the "third wind" joke at line 42 and drops the second Ernesto-tea joke, or keep the tea line and use this in place of line 42's second half).

### Minor

**m1. Re-entry lines repeat word for word, and Ernesto's goes false.** `m02_npc_ernesto_bautista.ink:32`, `m02_npc_hodan_warsame.ink:33`.
"Radio's quiet for once" stops being true after the burn exchange, when the radio is the thing they talk about. Both lines also start with "Still". Vary them with a shuffle and drop the radio claim once `heard_night_watch_burned` is true.
Suggested: `Ernesto Bautista: {&Back again?|Still here, then.|Pull up a chair, if you're stopping.}` and `Hodan Warsame: {&You again.|Still about, then?|Don't step on that bit, it's wet.}`

**m2. The wary greeting invites a question the menu won't allow.** `m02_npc_ernesto_bautista.ink:18`.
"Say what you want and go." is followed by a menu with only the exit. Suggested: `Ernesto Bautista: That's close enough. Whatever you want, I haven't got it.`

**m3. "Ward radios want nurses, not me." reads oddly.** `m02_npc_ernesto_bautista.ink:47`.
The plan named this line, but "ward radios" wanting someone is a slip of the tongue rather than a turn of phrase. Suggested: `Ernesto Bautista: The wards want nurses tonight, not porters.`

**m4. Both of them say "Go on, then." at the exit, in opposite moods.** `m02_npc_hodan_warsame.ink:55`, `m02_npc_ernesto_bautista.ink:58`.
His is cold (after an attack), hers is friendly. Give Hodan her own: `Hodan Warsame: Mind the floor. I've just done it.`

**m5. The radio topic never hears the cleared exchange.** `m02_npc_ernesto_bautista.ink:51`, `m02_npc_hodan_warsame.ink:46`.
The past tense keeps both answers true after `night_watch_cleared`, so this isn't stale, but it misses the best beat Hodan has. Declare `VAR heard_night_watch_cleared` (already a scenario global) and branch her answer: `Hodan Warsame: They've stood it down now. Nobody's said who stood it down.` That keeps her suspicion going without pointing at the player.

**m6. Wary lines have no delivery cue for a warm voice.** `m02_npc_ernesto_bautista.ink:18`, `:30`, `:58`; `m02_npc_hodan_warsame.ink:20`, `:30`, `:54`.
Ernesto's style says "warm and unhurried"; his cold lines will likely come out warm. Add `#delivery: flat and guarded` (Ernesto) and `#delivery: frightened, holding it together` (Hodan) to the wary lines.

**m7. "Somebody" turns into a verbal tic for Ernesto.** `m02_npc_ernesto_bautista.ink:22`, `:53`.
Two of his sixteen lines turn on "somebody", and the new boiler observation (`scenario.json.erb:3623`) and the existing handover board both say "Somebody" too. If M1's first rewrite is taken, line 22 loses it; otherwise change line 53 to `Ernesto Bautista: Always someone looking for someone, a night like this.`

**m8. Ernesto's observation names a prop the room doesn't have.** `scenario.json.erb:3515`.
"A stack of empty specimen boxes by his feet" is not an object in the staff room, and he walks away from his chair on breaks, so the stack would have to follow him. Suggested: `The night porter. A two-way radio on his belt and a porter's trolley key on a lanyard, worn smooth.` (nothing to place) or add the boxes as a `takeable: false` prop by his chair.

**m9. Cones or cups.** `scenario.json.erb:3628` against Ernesto's cooler pool (`:3500`).
The cooler has "paper cones" and Ernesto says "Last cup's always the one with a hole." Suggested pool line: `Last cone's always the one with a hole.` (38 characters).

**m10. The fault log restates the paper night, and its "takeable" may read as a puzzle item.** `scenario.json.erb:2356`.
"Paper is how the wards report anything tonight." is the fourth time the paper-night idea is spelt out (Ernesto's tubes line, Hodan's radio line, the exchange), and it is the most expository. A takeable, readable blank form in IT may also set players looking for somewhere to use it. Suggested observation: `A blank fault log, still warm. The one thing the copier has done all night.` and consider `takeable: false` so it reads in place.

**m11. Hodan's "You lost?" opener.** `m02_npc_hodan_warsame.ink:23`.
Fine as a line; noted under M1. If M1's choices are added for Ernesto, give her one once-only reply too, for symmetry: `* [Just looking for somewhere quiet.]` then `Hodan Warsame: You've found it. Till the radio goes.`

### Observations judged fine

Gary's mug ("Stone cold. He drinks it anyway.") is the best of the set: six words, all character. The photocopier line is dry and plausible. The boiler's NO KETTLES and the squeaking microwave turntable are good, cheap texture. Hodan's observation is good and pays into her exchange.

## Choices that matter

Both NPCs are ambient, with no task, item or clue, so pure information topics are a legitimate shape here and nothing gates the critical path. The only choice with any weight is the radio topic, which appears only after the burn exchange is heard: a nice reward for listening, and the player fishing about the visitor they are is a small, good tension beat. M1 and m5 are the two cheap places to add consequence without adding a clue.

## Verdict on the two voices

The voices are distinct and match the approved sample: Ernesto is slow, dry and warm ("I'm the tubes now" is the best new line), and Hodan is quick and wry ("I'm on my third wind. The second went somewhere on the back stairs."). Neither clashes with the existing cast; Gary is bitter and Doyle clipped, and the night staff sit apart from both. The weakness is structure more than voice: the conversations show what they do but not what they want, and the opening question to the player goes unanswered. Fix M1 and M2 and they will hold up next to the exchanges.

## Outcomes (stage 4 round 1 fixer, 2026-11-15)

Ink snapshotted before the edits; `tagdiff --old` against the snapshot lists every structural change, explained below. Spoken-line changes are in `SPOKEN_LINES.md` ("Stage 4 round 1 fixes"): 12 added, 12 changed, 0 removed.

| Finding | Outcome |
|---|---|
| M1 | Fixed, the "better" option. Ernesto keeps his question and the player now answers it: two once-only choices in `start` (`[Security. I've been called in about the systems.]`, `[Something like that.]`), gathered back to `hub`. The cover answer sets a new local `VAR ernesto_told_security`. The radio topic reads it: with the cover answer he says the call is "your department too", dramatic irony that files the player with the people asking, not as the visitor; with the vague answer he shrugs. The suggested "I never asked your name, so I've nothing to tell them" was not used: it shows him weighing whether the player is the visitor, which goes against the plan's rule that the shrug does not identify the player. |
| M2 | Fixed. Ernesto's opener is now `[You look like you've done some miles tonight.]` and he gains the pride line (without "Thirty years", which his pool already uses). Hodan's long-night answer swaps the tea joke for her own small dodge (she is stealing five minutes from the bed manager), keeping the third-wind line. No clue added. |
| m1 | Fixed. Both re-entry lines are three-line cycles; Ernesto's radio claim is gone, so nothing goes false after the burn. Ernesto's third alternative differs from the suggestion to avoid "Still..." on both. |
| m2 | Fixed as suggested. |
| m3 | Fixed as suggested. The plan quoted the old wording, but it only asks for one line on why the wards are not his. |
| m4 | Fixed: Hodan's exit is "Watch the floor..." ("Mind" would echo Ernesto's "Mind how you go"). |
| m5 | Fixed, as a separate once-only topic rather than a branch: `[Did security find their visitor?]` gated on `heard_night_watch_cleared` (new `VAR`, an existing scenario global synced in like the burn one), and the old radio topic now also needs `not heard_night_watch_cleared`, so a player who heard both exchanges gets the newer one. Her lines carry the "lists" thread from the burn exchange instead of the suggested "Nobody's said who stood it down", which repeated the cleared exchange's last line. |
| m6 | Fixed: `#delivery:` on all six wary lines, at the end of the line. |
| m7 | Fixed: the radio line now reads "Always someone looking for someone..." (only on the vague branch). |
| m8 | Fixed with a different observation (worn shoe soles): the suggested trolley key on a lanyard would look like a takeable key in a mission whose clues include a lanyard. |
| m9 | Fixed as suggested. |
| m10 | Wording fixed ("A blank downtime fault log. The only thing the copier has printed all night."). `takeable: false` deferred: the engine treats a non-takeable output slot as read-in-place and orders print slots by it (`npc-needs.js:3547`, `:3669`, `:4717`), and the plan's section 3 and V8's item count assume a takeable page, so it is a design change that needs a live print check first; listed on the handover. |
| m11 | Fixed: Hodan's greeting gets two once-only replies, for symmetry with Ernesto. |
| Impl review m7 (Boardroom gate, left to this review) | Decided: `insider_asset_arrested` and `night_security_supervisor_ko` (both declared `false`) now also close `night_watch_cleared`, since "Fuss over nothing" next door to the supervisor's arrest or knock-out would read wrong. |

Tagdiff explained. Ernesto: `VAR ernesto_told_security` (new, local); three `#delivery:` tags (wary greeting, wary re-entry, wary exit); one assign in `start`; two `*` choices in `start` with no divert (they fall to a gather `- -> hub`); the `{ernesto_told_security: ... - else: ...}` condition in the radio topic. The first hub choice changed only its bracket text. Hodan: `VAR heard_night_watch_cleared`; three `#delivery:` tags; two `*` choices in `start` (gather to `hub`); the radio choice gains `&& not heard_night_watch_cleared`; a new `*` choice gated `{not night_staff_attacked && heard_night_watch_cleared}` with its own `hub_quiet = true` and `-> hub` (the added assign and divert). The three exchange knots are unchanged.
