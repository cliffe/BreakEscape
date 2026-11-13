# Player packet: fixture C, "Safe house"

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.3 (with §3, §6.3 and §7 for engine-owned strings), read at
3,327 lines, latest review round in §14: Round 4 outcomes. Player-visible material only. Anything the plan
does not word for the player is marked [placeholder]. The truth is in `fixture_C_answer.md`. Don't read it
if you are playing.

How to use this packet: you start in the lounge with the brief and the board. Visit rooms and sources in
any order you like, but only once the way in is open (see "Doors"). When you take an action whose result
isn't listed here (a knockout, sending someone to wait, the exit phone), ask the judge what happens.

---

## 1. The brief

[placeholder: the brief's opening.] You are at a SAFETYNET safe house with three field contacts. One of
the network's secrets leaked [placeholder framing].

What to look for:

> **Sleeper.** Carries a cult-issued burner (there is one), or went to the quarry site and has no verified
> alibi for the night of the leak.

About what happens if you get it wrong, the brief says only: **"Trust no one."**

## 2. Start inventory

- Lockpick
- Fingerprint kit
- RFID cloner
- Safe-house keycard

## 3. The board ("Safe house")

The board is in the lounge. It opens as a case file.

### Profile card: "What to look for"

- **Sleeper**: Carries a cult-issued burner (there is one), or went to the quarry site and has no verified
  alibi for the night of the leak.
- Clue counts (each starts at 0 found):
  - Cult-issued burner [label placeholder] ✦ marked: 1 in this case, 0 found
  - SAFETYNET phone [label placeholder]: 3 in this case, 0 found
  - Field kit [label placeholder]: 2 in this case, 0 found
  - Went to the quarry site: 2 in this case, 0 found
  - Never went to the quarry site: 1 in this case, 0 found
  - Verified alibi [label placeholder]: 2 in this case, 0 found
  - No verified alibi [label placeholder]: 1 in this case, 0 found
- Stakes line: **"The stakes are not known."**

### Suspect cards

Each card shows the same three slots. Every cell starts face down as "Hidden".

| Suspect | What they carry | Where they have been | The night of the leak |
|---|---|---|---|
| Ahmed [full name and role: placeholder] | Hidden, Hidden | Hidden | Hidden |
| Novak [full name and role: placeholder] | Hidden, Hidden | Hidden | Hidden |
| Baptiste [full name and role: placeholder] | Hidden, Hidden | Hidden | Hidden |

- "What they carry" can hold one or more clues. "Where they have been" and "The night of the leak" each hold
  exactly one.
- Mark buttons on each card: "Undecided", "Sleeper", "Not a sleeper". A Sleeper mark asks "Which profile?".
  A Not a sleeper mark asks "What rules them out? (optional)" and lists that person's clues you have found.
  Marks are your own notes, not verdicts.
- This board gives no hints about when you have enough to decide.
- Once a verdict is given on someone, their mark control locks and reads "Verdict given", and a line reads
  "Verdict: <Sleeper / Not a sleeper> (knocked out / acted on)". No right or wrong is shown until the end.

## 4. People you can talk to

| Person | Where | What you can ask |
|---|---|---|
| Ahmed | Lounge | "Show me your kit"; ask him or her to open the bedroom or comms door [wording placeholder]; "[Ask them to wait in the comms room. You can't call this back.]" |
| Baptiste | Lounge | "Show me your kit"; gossip about the others (questions after the first one cost goodwill; push too far and Baptiste gets vague, then stops talking) [topic wording placeholder, at least three topics]; ask to open the bedroom or comms door [wording placeholder]; "[Ask them to wait in the comms room. You can't call this back.]" |
| Novak | Office, at the desk | "Show me your kit"; "[Ask them to wait in the comms room. You can't call this back.]" |
| HaX | Phone, from the lounge | [placeholder: general chat]. Once anyone is waiting in the comms room, HaX also offers "Lock the comms room with whoever is waiting inside", with "Not yet" next to it |

Ahmed and Baptiste can both open the bedroom and comms doors for you if you ask.

Asking someone to wait sends them to the comms room. They leave the room you are in. While they wait,
nothing is final until the comms room is locked (by HaX, or by the exit phone).

## 5. Doors

| Door | From | Lock | Notes |
|---|---|---|---|
| Comms room | Lounge | Keycard reader | Sign beside it: "Comms room: locked remotely by HaX" |
| Bedroom | Lounge | Keycard reader | |
| Office | Lounge | PIN pad | [placeholder: PIN pad prompt] |
| Garage | Lounge | Card reader | [placeholder: reader text]. Your keycard does not open it |

The exit phone is in the lounge and is never behind a locked door.

## 6. Rooms, objects and clues

Each clue you receive appears on the board in that suspect's cell and adds 1 to the count line's "found".

### Lounge (start)

- **The board** (case file, "Safe house"): see section 3.
- **Exit phone**: on use, a confirm box reads: "Call extraction and leave? Anyone waiting in the comms room
  is locked in; anyone else you haven't dealt with stays in the field." Buttons: confirm [placeholder
  wording] and "Not yet".
- **Sign by the comms door**: "Comms room: locked remotely by HaX".
- **Ahmed, "Show me your kit"**: [placeholder line: Ahmed shows a SAFETYNET phone.] Board: Ahmed, What
  they carry: SAFETYNET phone.
- **Baptiste, "Show me your kit"**: [placeholder line: Baptiste shows a SAFETYNET phone.] Board: Baptiste,
  What they carry: SAFETYNET phone.
- **Baptiste, gossip** (goodwill cost after your first question): [placeholder line: Baptiste says Ahmed
  went out to the quarry site.] Board: Ahmed, Where they have been: went to the quarry site. Baptiste's
  other gossip topics are [placeholder] and grant nothing listed in the plan.
- **HaX (phone)**: see section 4.

### Comms room (keycard door from the lounge)

- An empty holding room. Nothing here is needed. [placeholder: room description]

### Bedroom (keycard door from the lounge)

- **Drawer** (locked; lockpick): holds Baptiste's kit bag.
  - **Baptiste's kit bag**: [placeholder line: a field kit, with Baptiste's name on it.] Board: Baptiste,
    What they carry: field kit.
  - Inside the bag, **a note** with the office door code: [placeholder code].

### Office (PIN door from the lounge)

- **Novak**, at the desk. Talk to her (section 4). She carries her badge, which your RFID cloner can copy
  [placeholder: how the clone prompt reads].
  - **Novak, "Show me your kit"**: [placeholder line: Novak shows a SAFETYNET phone.] Board: Novak, What
    they carry: SAFETYNET phone.
- **Locked drawer** (lockpick): holds Novak's bag.
  - **Novak's bag**: [placeholder line: a cult-issued burner phone.] Board: Novak, What they carry:
    cult-issued burner ✦ marked.
- **Ahmed's locker** (lockpick): [placeholder line: a field kit, Ahmed's.] Board: Ahmed, What they carry:
  field kit.
- **Note under the desk**: the safe code [placeholder code].
- **PIN safe** (code from the note): holds the travel log.
  - **Travel log**: [placeholder text: trip records for the three contacts.] Board: Ahmed, Where they have
    been: went to the quarry site. Novak, Where they have been: went to the quarry site. Baptiste, Where
    they have been: never went to the quarry site.

### Garage (card reader from the lounge; takes only Novak's badge)

- **Garage door reader**: when you present a cloned copy of Novak's badge, the door opens and the reader
  shows "Last used 03:40". Board: Novak, The night of the leak: no verified alibi.
- **Door log** (a log filter terminal inside): [placeholder: terminal prompt and filter wording.] Filtering
  the log gives: Ahmed, The night of the leak: verified alibi. Baptiste, The night of the leak: verified
  alibi. Novak, The night of the leak: no verified alibi. [placeholder: the log lines themselves]

## 7. Taking action

- **Knock someone out**: you can punch any of the three. The first punch on a calm person shows "Knocking
  out a suspect counts as accusing them." A knockout is final; they are not brought round.
- **Send someone to wait**: from their conversation, "[Ask them to wait in the comms room. You can't call
  this back.]". Any number of people can be sent.
- **Lock the comms room**: HaX's choice, offered only while someone waits there.
- **Leave**: the exit phone in the lounge (warning text in section 6). Once everyone has been dealt with, a
  line reads "Everyone has been dealt with. Use the exit phone when you're ready to leave."
- After you leave, a debrief shows one card per person, then Finish, then the credits.

If an action produces something not listed here, the judge tells you what you see.
