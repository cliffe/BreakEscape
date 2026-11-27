# T345 trailer lines: independent dialogue review

Reviewed 2026-11-23 against the `v-trailer-lines` worktree. New lines only; no ink edited, nothing voiced.

Read at `bed3a7e33`. Paths are under `scenarios/`. Not run: compile, validator, routes. Audio cache not checked.

## A. In the game and voiced

### 1. m05 Recruiter, `m05_phone_recruiter.ink:112`: FIX, minor (move, no re-voice)
The words are good and in voice. The place is wrong. It now sits between :110 ("Torres took debt relief... Cheaper than most, if you're keeping score.") and the reply at :120 "[You're talking about him like a receipt.]", so "him" and "receipt" answer a general line that names nobody.
Fix: move :112 above :110, wording and delivery tag unchanged. "Then I make them an offer" leads into "Torres took debt relief...", and "receipt" follows "Cheaper than most" again. It also follows each opening reply well ("as though I invented the cancer", "never the only iron in the fire").
Accept: on the silent route :103 "Considered, agent." comes just before it, so "agent" is heard twice in two lines. HaX's `m05_phone_agent_0x99.ink:268` ("She finds someone in trouble and makes an offer") is close, but the Recruiter's line adds "the week before they break".

### 2. m06 Satoshi, `m06_satoshi_confrontation.ink:258`: OK, minor note
In voice. Canon holds: the fund is signed and waiting (:314), he goes quietly once shown evidence (`arrest_attempt`), and a player who freezes the wallet proves him partly wrong, which suits him.
Run: `terrorism_rebuttal` or `criminal_accusation` (2) + `philosophy_challenge` (3) + `choice_presentation` first visit (4) is exactly 9. Nothing more can be added on that path. If it is ever re-cut, :260 "So. You've found the network. What are you going to do with it?" is the line to lose, because "Let's talk about my money" asks the same thing.

### 3. m07 Architect, `m07_architect_comms.ink:96`: OK to leave, minor (two notes; the owner picked it)
- "four fires tonight" is already HaX's phrase, `m07_phone_agent_0x99.ink:124` ("The ops room's running four fires tonight"), and `:706` has "One team, three fires". In a mission with a thread about him using HaX's own words (`topic_teacher`), a second accidental match reads as a clue that nothing pays off.
- "I set them so you'd have to choose" says early what HaX works out in the debrief (`m07_closing_debrief.ink:562`, "He built a problem with no right answer"; :577 "That's a test"), and `t30_close` then says it again more quietly ("There is a decision in front of you tonight... I only want to see it made"). The intercept itself ("They will have to choose") still lands as proof.
If it is ever re-voiced: "Four sites tonight, and only one of you. I set them so you'd have to choose." Not worth a re-voice on its own.

### 4. m09 Netherton, `m09_briefing.ink:62`: FIX, major
Canon: nobody in the briefing knows what is in the archive. Netherton at `questions`: the schedule is "Series numbers from the archive's catalogue, and nothing else." HaX at the dock, `m09_phone_agent0x99.ink:203,207,211`: "get me into their catalogue. It's how we find out what Sorensen's burning." The line answers that question before the mission starts, and it takes Sorensen's turn in the cage (`m09_sorensen_cage.ink:33-34`, "Paper was the only thing that could ever have hurt them"). "We believe" softens it, not enough. Also "burning it" points at "that building" as the nearest noun.
The brief (`scenario.json.erb:540`) has the right amount: "the paper ENTROPY can't afford to keep".
Rewrite: "Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it." Keep `#delivery: level and grave`. One re-voice, same length, still a hook.
Run: adds one to a wall of lines that is already far past nine before the first choice ("[Who are the last two?]"). Old problem; no m09 route asserts maxRun there.

### 5. m04 Voltage, `m04_npc_voltage.ink:258`: OK to leave meanwhile, minor
Reads well after both replies. "At eight" is untrue once the klaxon has gone (`scenario.json.erb:1083`, "he won't wait for eight now") or Bank B's clock is running (:1447, "won't last till eight"). Harmless as bravado.

### 6. m09 Sorensen, `m09_sorensen_hatch.ink:113`: FIX or replace, major
Contradicted by things the player finds. The player's file is the Reading ("0x00. Kept by M.S. Not to be summarised."), in her office safe (`scenario.json.erb:2185-2216`), and her own master schedule notes it as outside the run: "Reading (safe). Plan cabinet: not listed. Keep?" (:2285). Tonight's run is Series R, 48 boxes, and the box she feeds last is Series L, legacy placements (:91, :2082). So "in tonight's run" and "saved it for last" are both false.
Also: "Yours" has no noun before it on the fight, expose, surrender and arrest branches, and :132 "You have your file. I have my boxes." (meaning Derek's) now reads as the player's own. The Victoria route (`m09_sorensen_door.ink`) doesn't have the line.
Best: take it out; HaX's "...She's got a file on you." follows "You're the one the Architect writes about" as it did before. If a Sorensen beat is wanted here: "Yours isn't on the schedule, dear. I haven't decided." True to the margin note ("Keep?"), and it plants the safe. Keep the delivery tag. Safe to leave only until the replacement is in.
The `saved` row in TRAILER_LINES_ROUND2.md ("whose file is in tonight's run") carries the same mistake.

### 7. m10 Tesseract, `m10_tesseract.ink:113`: DROP is safe, minor
Nothing after it depends on it: :112 runs straight into the m06 line and HaX's "back", as before. No global, choice, route or scenario text refers to it. The fact stays in `m10_nightshade.ink:70` ("reads one badge by name. Yours.") and `scenario.json.erb:473`. It is also wrong on the Nightshade route, where the door is cranked by hand: `m10_phone_agent0x99.ink:718` "Their reader never saw you." Line numbers below shift by one when it goes.

## B. Picked, about to go in

### 8. m10 Tesseract core pitch: OK verbatim, with a different placement (major if placed as proposed)
Canon is fine: the bible dates SAFETYNET from the late 1990s, and Asante says "thirty years" (`m10_asante.ink:39`). "Your service" matches :287 and exchange 2. "I give them back" while it goes out by itself at six is his own spin; Netherton also says "he publishes".
Line drift: the proposal's ":280" means "Hospitals, dispatch, water...", which is now :281. After either :280 or :281 the order is wrong, since the six o'clock release comes after "Press this", and after :280 it also cuts the figure from its "Hospitals, dispatch, water".
Placement: **replace :279** with the new line (the gather `-` at :278 stays), and change :280 so "city by city" survives and "them" has a match:

    Dr Adrian Tesseract: Your service spent decades hoarding the world's weak points. At six, I give them back. #delivery: calm and reasonable, almost generous
    Dr Adrian Tesseract: City by city. Or you press this, and they go everywhere in the same minute. Eleven hundred to twenty-six hundred, the first month.
    Dr Adrian Tesseract: Hospitals, dispatch, water. In the hands of people who could never have got in before.

"At six" is said once. "Free, with working detail" goes, and Netherton has already said it word for word (`m10_director_netherton.ink:125`, :126 has "City by city from six"). One extra re-voice (:280). Zero-re-voice fallback: replace :279 and leave :280; it reads, but the city-by-city contrast is lost here and "it" is loose.
Run: 3 lines from "[Go on, then.]" (4 via "[Step away from the console first.]"), same as now. Adding it without removing :279 gives 4 (5), still under 9, but it breaks the file's own rule at :232, "A choice at least every three lines".
"hoarding" here and "hoard" at :286 echo six lines apart; that is his argument, leave it.

## C. m04 ending options

Voice: the game casts Voltage as South African, Johannesburg (`scenario.json.erb:2671`, voice_bible.md:297, m10 the same). "Ja" (:158) is Afrikaans. Don't write or direct him as German.
Numbers: 11 on site + forty-odd on the feed is "fifty" (:247, debrief :431). His own note models the feed at 40-60 (:2869), so "fifty" is also the middle of that. "Best case, forty-odd" is the low end. `voltage_owns_it` follows :247's "kills fifty" on one branch, so a "forty-odd" line put there says a different number straight after. Use "fifty" in that slot.
Eight: not the deadline everywhere. See line 5. New lines should leave it out.

### 9. "A grid that kills fifty when it stumbles was built wrong..." (existing :247): OK, minor
Canon and voice right. Stands alone better than any other existing line, and it explains him. It is an argument more than a threat, and "legible" is soft as a last word. Only on the "[And you came anyway.]" branch. Good free fallback.

### 10. "On the feed, best case, forty-odd... " / "I know it to one decimal place." (existing :241, :243): OK for the game, fix as a trailer cut, minor
Uncut it doesn't stand alone: "the feed" and "Blackout" mean nothing to a stranger, "You think I don't know it" answers nobody, and it runs long. The patients are the menace. If used, cut inside the takes to: "Best case, forty-odd. Oxygen concentrators, the dialysis unit at Saint Aldate's, home ventilators." then "I know it to one decimal place." No new voicing if the takes cut cleanly. Long for a closing line; better as the beat before it.

### 11. "Forty-odd, best case. I checked the sum twice. You have until eight to find me wrong.": FIX, minor
Best idea of the four: a dare at the player, and it plants HaX's debrief line "He wants someone to check his sums" (`m04_closing_debrief.ink:176`) and the arrest choice "A court can check your sums" (:390). Problems: repeats :241 almost word for word; contradicts :247 in that slot; "forty-odd" of what, for a stranger; "until eight" is false after the klaxon or the Bank B clock.
Rewrite: "Fifty people. I checked the sum twice. Find me wrong." Replaces :258 in `voltage_owns_it`. `#delivery: flat and unhurried, a checked figure read aloud, then a dare`.

### 12. "Forty-odd people are a rounding error, agent. I have never left one uncorrected.": DROP, major
Against his character and canon. He is the man who won't round ("one decimal place"; the feed deaths are counted by ward). m10 rests on him leaving one uncorrected: "This one's wrong by a thousand. I found it in March. I said nothing." (`m10_voltage.ink:242-243`). Muddled too: correcting the error would mean killing them, or saving them. He never calls the player "agent" in m04.

### One of my own
"Fifty people die if my sums are right. Check them. The last man did, and he signed." Same slot and delivery as 11. True (Blackout signed, :241), no deadline, no jargon, and it makes the bureaucracy the threat. Weaker point: "signed" repeats :241.

### Show the owner
First the fixed 11, "Fifty people. I checked the sum twice. Find me wrong." Second, mine. Line 9 is the no-voicing fallback.

## Summary

| # | Verdict | Severity | Action |
|---|---|---|---|
| 1 m05 :112 | fix | minor | move above :110, no re-voice |
| 2 m06 :258 | ok | minor | run is exactly 9, add nothing |
| 3 m07 :96 | ok | minor | echoes HaX's "four fires tonight"; leave |
| 4 m09 :62 | fix | major | "Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it." |
| 5 m04 :258 | ok meanwhile | minor | replace with C pick |
| 6 m09 :113 | fix/drop | major | file is in her safe, not the run; remove, or "Yours isn't on the schedule, dear. I haven't decided." |
| 7 m10 :113 | drop | minor | nothing depends on it |
| 8 m10 pitch | ok, place differently | major if as proposed | replace :279, edit :280 |
| 9 | ok | minor | fallback |
| 10 | ok / trim for trailer | minor | cut inside takes |
| 11 | fix | minor | "Fifty people. I checked the sum twice. Find me wrong." |
| 12 | drop | major | clashes with m10 |

No blockers. Any ink change needs the recompile and every route for m04, m05, m09 or m10.

## As-inked review, round 2

Reviewed 2026-11-23 at `caa51729c` (`video/trailer-lines-m04-m10`). Paths under `scenarios/`. No ink edited. The six touched stories recompile to the same JSON as the committed files. Validator, routes and audio not run. No blockers.

### 1. m04 `m04_npc_voltage.ink:222` "I didn't bring a bomb...": FIX, minor (move, no re-voice)
Canon fine: three bypass modules and a lifted charge ceiling, no explosive anywhere in m04. Two problems of position. It sits directly on :224 "We didn't make it fragile. We just stopped pretending it wasn't.", the same "didn't X, Y" shape twice running, and it splits :220's "Budget cuts, ageing cells" from the "fragile" that answers it.
Fix: swap :220 and :222, words and tag unchanged:

    Voltage: Two hundred megawatt-hours in a shed on a floodplain, holding up a city that never asked whether it should.
    Voltage: I didn't bring a bomb, agent. I brought a maintenance schedule. #delivery: dry, almost proud of the craft
    Voltage: Budget cuts, ageing cells, one fake maintenance firm, and we walked in the front.
    Voltage: We didn't make it fragile. We just stopped pretending it wasn't.

"One fake maintenance firm" then explains the joke's noun. Accept: it is his only "agent" in m04, and Vance's email (`scenario.json.erb:75`) says the crew was "not on our schedule", which the line can take as irony. Five lines before the choice, each with a job.
`voltage_owns_it` :260 restored "There's no version of this where I blink...": OK. It follows ":249 ...Somebody has to make that legible." and the flat ":254 I don't need their names to know the number.", where "blink" also answers the narrator's beat about his eyes. No later line quotes the removed one.

### 2. m07 `m07_opening_briefing.ink:104` "We are faced with an impossible decision, Agent.": OK
Pause, line, then the three names works: the pause now leads to something he says, and "decision" is picked up by "Ask about any of them". Who decides is first said at :108 ("The team needs your call"), so nothing contradicts. "We" fits :321 "On the record, that is my decision as much as yours"; :277 "It is yours to make. I will log it..." is still the first time he says it outright, and :271 "You want me to make it." still has its turn. HaX's "a problem with no right answer" (`m07_closing_debrief.ink:562`) is close but hours later and is about the Architect. Four lines of his before the hub, each new. Delivery: keep.
Trade-off only: the narrator's beat used to carry the feeling unsaid and the line now says it. Leave.

### 3. m09 `m09_sorensen_cage.ink:33` "Everyone ENTROPY ever placed is filed in this room...": FIX, major (two words, one re-voice)
"is filed in this room" is wrong against what the player sees:
- WREN's record is in Harwick & Lowe's box in the open stacks (`scenario.json.erb:1553-1570`), and `cross_reference_wren` (:858) sends the player there. Torres says the old placements are filed under the firm that placed them (`m09_phone_torres.ink:38,40`). The line points the search at the cage.
- The run sheet has all of Series R DONE the moment the cage opens (:1358), so nothing "is filed" there but the last box.
- That box, Series L, is at Noor's desk on the warned branch (:1375, :2091-2097).
- The ledger's print copy is in her office (:2138).
Her whole character is accuracy ("I'll write down what I've destroyed, accurately"; debrief :237 "She even got the numbers right").
Smallest rewrite: "Everyone ENTROPY ever placed **was** filed in this **building**, dear. By morning, I'll be the only index you can ask." ("was" was in the first draft.) Delivery: "gentle, almost kind, over the work" ("without looking up" is a stage direction, and the narrator has just said it).
The rest is fine:
- "only index you can ask" is untrue if the live ledger is already captured, but she doesn't know that, and it sets up the lever ("Your Architect kept his own papers off your list. Only yours burn."), the pencil list, and "[Who's WREN?]" / "I don't read them aloud."
- Nightshade's file is in the plan cabinet, off her list by design; he was turned, not placed. The player's file is not a placement. m08's mole holds.
- :34 "Paper was the only thing that could ever have hurt them. So the paper goes.": "them" now reads as everyone placed. Good. "only" twice running and "dear" again at :64: accept.
- Nothing relied on "at their desks" / "only paper". m10's credits "her people at their desks" (`m10 scenario.json.erb:809-810`) are about the Recruiter and stand alone.
Still open from round 1: `m09_briefing.ink:62` ("We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it.") is unchanged and is now also the same fact as this line, told first by Netherton. With the reworded option there, this line is the first telling.

### 4. m10 `m10_tesseract.ink:278-280` pitch: OK
As round 1 recommended. "they" matches "weak points"; "City by city" keeps the contrast; "Then it stops" (:285) still answers "And then what?"; "its map" (:286) has a better antecedent than before. "At six" is said once here.
Removed "Everything SAFETYNET ever found, free, with working detail": not needed later. The two publication modes are in Netherton's opening (`m10_director_netherton.ink:125-126`, every route of the briefing, cold start included), HaX's hour topic (`m10_phone_agent0x99.ink:245-246`) and his own arrival line at the core (`m10_tesseract.ink` `arrival`, "It goes at six whatever we say. Or now, if someone presses this."). A player who closes the briefing unheard still gets the facts from the arrival line and "they go everywhere". Exchange 2's button "You'll hand it to everyone at six" follows from :278-280. Delivery: keep.
Arrival line removed: no ink or scenario text in m10 quotes it; the arrival run closes cleanly on the freeze line or HaX's "back".

### 5. m05 `m05_phone_recruiter.ink:110` (moved above Torres): OK
"Receipt", "him" and "line item" follow the Torres line again. Accept "agent" three times on the silent route ("Considered, agent" / "before they break, agent" / "a line item, agent"). Delivery: keep.

### 6. m09 `m09_sorensen_hatch.ink:113` (line removed): OK
The file matches its pre-T345 text. "You're the one the Architect writes about." then HaX's "...She's got a file on you." on all three cover branches, as on Victoria's route (`m09_sorensen_door.ink`).
