# Player packet: fixture D, "Night train"

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.4 (with §3, §6.3, §7.2 and fixture A's profiles in §9.2), read at
3327 lines, latest review entry "Round 4 outcomes". This packet holds only what a player could see or hear.
The plan has no authored wording for many things. Those lines are marked **[placeholder]**: they say the
fact plainly so that a tester can play, and the real mission would replace them.

For the person running the test: hand the player this file only. The answer file is for the judge.

---

## 1. The brief

**[placeholder] Setting.** You are on a night train with five passengers. Some of them may belong to a cult
that is trying to finish a ritual before the train arrives. Work out which passengers are cultists before
the last stop.

**What to look for** (the profiles, word for word from the plan). A passenger is a cultist if they match
**any** of these:

- **Keyholder.** "Carries the brass Tesseract key. There is only one."
- **Courier.** "Was in the Archive, wants the Codex, and carries no ward charm."
- **Devotee.** "Has three or more marked clues."

**Stakes** (word for word):

> Name an innocent, or leave a cultist unnamed, and the ritual completes. You will not get a second chance.

**[placeholder] How the train runs.** The doors between carriages are locked. Each one opens at the next
stop. The cult uses each stop to get rid of evidence, so look round a carriage before you move on. You can
also wait by the far door to bring the next stop forward.

## 2. The board, as you first see it

Title: **Night train**. A notes-only copy hangs in carriage 1 (you can mark people, but you cannot make
the call there). The copy in carriage 5 is the one you make the call on.

### Profile card: "What to look for"

The three profiles above, then the clue counts. Clues marked ✦ carry the cult's mark ("✦ marked").

| Clue [labels are placeholders] | Line on the board |
|---|---|
| Was in the Archive | 2 in this case, 0 found |
| Was in the lecture hall | 2 in this case, 0 found |
| Was in the garden | 1 in this case, 0 found |
| ✦ Wants the Codex (marked) | 2 in this case, 0 found |
| ✦ Wants a promotion (marked) | 1 in this case, 0 found |
| Wants funding | 1 in this case, 0 found |
| Wants peace and quiet | 1 in this case, 0 found |
| ✦ Brass Tesseract key (marked) | 1 in this case, 0 found |
| ✦ Sigil ring (marked) | 1 in this case, 0 found |
| ✦ Burner SIM (marked) | 1 in this case, 0 found |
| Ward charm | 2 in this case, 0 found |
| Notebook | 2 in this case, 0 found |
| Umbrella | 1 in this case, 0 found |

Stakes line (fixed engine text):

> Stakes: one wrong or missed call loses the mission. A wrong or missed call also costs part of your score.

Then the stakes text from the brief, shown again.

### Suspect cards

Every clue starts face down as "Hidden". "Where they were" and "What they want" have exactly one clue
each. "What they carry" can have one or more.

| Passenger (seat) | Where they were | What they want | What they carry |
|---|---|---|---|
| Sato (carriage 1) | 1 Hidden | 1 Hidden | 1 Hidden |
| Chen (carriage 2) | 1 Hidden | 1 Hidden | 2 Hidden |
| de Vries (carriage 3) | 1 Hidden | 1 Hidden | 2 Hidden |
| Volkov (carriage 4) | 1 Hidden | 1 Hidden | 2 Hidden |
| Mensah (carriage 5) | 1 Hidden | 1 Hidden | 1 Hidden |

Each card has three mark buttons: "Undecided", "Cultist", "Not a cultist". Marking someone a cultist asks
"Which profile?". Marking someone not a cultist offers "What rules them out? (optional)". Marks are your own
notes until you make the call.

**The nudge.** When the clues you hold are enough to decide about someone, the board says "You have enough
to decide about <name>." It never says which way. The same line shows once as a pop-up when you pick up the
clue that settled it.

**Evidence destroyed.** If the cult gets rid of a clue before you find it, its cell reads "Evidence
destroyed". If you later find that clue another way, the cell shows the clue again.

**Making the call** (carriage 5 board only). "Make the call" appears only after the last stop. Every
passenger must be marked first, otherwise the board says "Mark every suspect first: <names> still
undecided." The confirm panel lists each passenger with your mark and says "This closes the case.", with
"Confirm the call" and "Go back". The outcome is not shown until the debrief.

**Knocking someone out.** Fighting is possible. The first time you punch a passenger who is not fighting
you, you see: "Knocking out a suspect counts as accusing them. A wrong one loses the mission." A knocked-out
passenger is locked as a cultist on your board ("Verdict given") and judged with everyone else at the call.
They are not brought round.

## 3. The train

Five carriages in a line: 1, 2, 3, 4, 5. You start in carriage 1. **[placeholder] Start inventory:** a
lockpick and a fingerprint kit.

### Stops

- **[placeholder]** A stop comes about two minutes after you start (stop 1), and about two minutes after you
  first walk into carriage 2, 3 and 4 (stops 2, 3 and 4).
- Thirty seconds before each timed stop: "The train is slowing."
- At each stop the door to the next carriage opens. Stop 4 is the last stop and opens carriage 5.
- At the far end of each carriage there is a spot marked **"Wait by the door for the next stop"**. Using it
  brings the stop on at once, after a warning:
  - carriages 1, 2 and 3: "The train will stop now, and whatever the cult is after in this carriage may go
    with it. Wait for the stop?"
  - carriage 4: "The train will stop now. Wait for the stop?"
- A stop happens once. If you bring it forward, the timer for that stop does nothing.

### People you can talk to

| Who | Where | What you can ask |
|---|---|---|
| The steward | carriage 1 | Three topics about other passengers, and a kind word (once) |
| The guard | your phone, from the start | **[placeholder]** Calls about stops and doors; no clues |
| Chen | carriage 2 | "What are you reading?" |
| The conductor | carriage 4 | Four topics about other passengers, and a kind word (once) |
| Mensah | carriage 5 | **[placeholder]** "Is that your umbrella?" |
| Sato, de Vries, Volkov | carriages 1, 3, 4 | **[placeholder]** Small talk. Volkov also answers "What's that charm?" |

**What you notice about the steward and the conductor.** The first question is free. Keep pushing and they
get guarded: they start giving vague answers that tell you nothing, and if you push far enough they end the
conversation. A kind word, which works once, makes them more willing again. A topic disappears once you
know the answer.

## 4. Clues, room by room

Each entry is a source you can visit in any order the doors allow. The clue text is what you read or hear;
the board then shows that clue on the passenger's card.

### Carriage 1 (Sato; the steward; a notes-only board)

- **Luggage rack label** (pick it up and read it).
  [placeholder] "Rack label, seat 1A: Sato. Day ticket, stamped at the Archive reading room."
  → Sato, where they were: Archive.
- **The steward**, topic **[placeholder] "Who's been asking about the Codex?"**
  [placeholder] "Sato in 1A wouldn't stop talking about the Codex. Wants to see it before it's sold."
  → Sato, what they want: the Codex ✦.
- **The steward**, topic **[placeholder] "What about the woman in carriage 2?"**
  [placeholder] "Chen asked me twice whether the Codex was on board. Said she'd come a long way for it."
  → Chen, what they want: the Codex ✦.
- **The steward**, topic **[placeholder] "And the passenger at the back?"**
  [placeholder] "Mensah in carriage 5? Asked for a quiet seat and no visitors. Just wants peace."
  → Mensah, what they want: peace and quiet.
- **The steward**, kind word **[placeholder] "Thank them for the tea."** [placeholder] "Kind of you. Long
  night." No clue.
- **Wait by the door** (far end): warning as in §3.

### Carriage 2 (Chen)

- **Chen's ticket on the table** (look at it).
  [placeholder] "Chen's ticket, stamped at the Archive reading room this afternoon."
  → Chen, where they were: Archive.
- **Chen's coat** (pick it up and search it).
  [placeholder] "In the coat pocket: a small ward charm on a red cord."
  → Chen, what they carry: ward charm.
- **Chen**, "What are you reading?"
  [placeholder] Chen: "My notes. I keep a notebook for everything." She shows you a battered notebook.
  → Chen, what they carry: notebook.
- **Wait by the door** (far end): warning as in §3.

### Carriage 3 (de Vries)

- **Lost-property box**, a notebook inside (pick it up).
  [placeholder] "A notebook with 'Sato, 1A' written inside the cover."
  → Sato, what they carry: notebook.
- **Newspaper** on de Vries's seat (look at it).
  [placeholder] "A job advert is circled in pen: Deputy Keeper, the Archive. 'Apply now' underlined twice."
  → de Vries, what they want: a promotion ✦.
- **Wine glass** (dust it with the fingerprint kit; the prints are identified).
  [placeholder] "The prints on the glass are de Vries's. The smudge from a ring shows a sigil."
  → de Vries, what they carry: sigil ring ✦.
- **de Vries's phone** (pick it up).
  [placeholder] "A cheap handset with an unregistered SIM. No contacts, one number dialled over and over."
  → de Vries, what they carry: burner SIM ✦.
- **Shredded document** (a puzzle: piece the strips back together).
  [placeholder] When finished: "A receipt from a charm-maker's shop, made out to Chen, for one ward charm."
  → Chen, what they carry: ward charm.
- **Wait by the door** (far end): warning as in §3.

### Carriage 4 (Volkov; the conductor)

- **Volkov's briefcase** (locked; pick the lock, then take the item inside).
  [placeholder] "Inside the briefcase, wrapped in cloth: a heavy brass key."
  → Volkov, what they carry: brass Tesseract key ✦.
- **Volkov**, "What's that charm?"
  [placeholder] Volkov: "This? A ward charm. My mother gave it to me." He holds it up for you to see.
  → Volkov, what they carry: ward charm.
- **Backup recovery terminal** (a puzzle: restore a phone backup).
  [placeholder] When the restore starts: "The backup is from de Vries's phone. It lists an unregistered SIM."
  → de Vries, what they carry: burner SIM ✦.
- **The conductor**, topic **[placeholder] "Where did the passenger in 1A board?"**
  [placeholder] "Sato got on at the Archive stop. Had the reading-room stamp on the ticket."
  → Sato, where they were: Archive.
- **The conductor**, topic **[placeholder] "And the man in carriage 3?"**
  [placeholder] "De Vries came straight from a lecture. Still had the hall pass round his neck."
  → de Vries, where they were: the lecture hall.
- **The conductor**, topic **[placeholder] "Where was Volkov before this?"**
  [placeholder] "Volkov? Mud on his shoes. Said he'd been walking in the garden."
  → Volkov, where they were: the garden.
- **The conductor**, topic **[placeholder] "What's Volkov travelling for?"**
  [placeholder] "Money. He's chasing a backer for some project. Talked about funding all the way from the
  last stop."
  → Volkov, what they want: funding.
- **The conductor**, kind word **[placeholder] "Offer to carry the ticket box."** [placeholder] "Thanks.
  Nobody ever offers." No clue.
- **Fighting Volkov.** If you knock Volkov out, he drops the brass key; picking it up gives the same clue as
  the briefcase. The knockout counts as accusing him (see §2).
- **Wait by the door** (far end): warning as in §3.

### Carriage 5 (Mensah; the board you make the call on). Opens after the last stop.

- **Mensah's ticket** (look at it).
  [placeholder] "Mensah's ticket, stamped at the lecture hall this evening."
  → Mensah, where they were: the lecture hall.
- **Mensah**, **[placeholder]** "Is that your umbrella?"
  [placeholder] Mensah: "It is. It always rains when I travel." He shows you the umbrella and his empty
  pockets.
  → Mensah, what they carry: umbrella.
- **The board**: "Make the call" (see §2).

## 5. After the call

The debrief opens on the same board: one card per passenger with what they were, your verdict, your note,
whether the call was right, the clues you held, and why. "Finish" ends the mission with the credits.
