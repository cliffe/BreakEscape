# Player packet: fixture A, "Open evening"

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` as read on 2026-10-22, 3327 lines, latest review round
§14 Round 4 (md5 d0598477...). Fixture A is §9.2; board strings from §6.3; witness rules from §7.2.

This packet holds only what a player could see or hear. It has no solution. Where the plan gives no
player-facing wording, the text is a neutral stand-in marked [placeholder]. Clue labels marked
[label from design 12] come from the design doc, not the plan.

How to use it: start in the Hall. Visit sources in any order you like, subject to the doors. When you
take an action whose result depends on hidden facts (handing over the favour, accusing, knocking
someone out, the security monitor), ask the judge what happens. The judge holds `fixture_A_answer.md`.

---

## 1. The brief

You are undercover as a guest at an open evening at the Tesseract Institute. Five guests here are
suspects. Some may be cultists. Work out who, and name them before the ritual begins. [placeholder:
framing sentences; the plan gives only the profiles, the stakes text and the favour warning]

**What to look for** (a guest who matches any one of these is a cultist):

- **Keyholder.** "Carries the brass Tesseract key. There is only one."
- **Courier.** "Was in the Archive, wants the Codex, and carries no ward charm."
- **Devotee.** "Has three or more marked clues."

**Stakes:** "Name an innocent guest and the lodge will close ranks against you. Miss a cultist and they
will be waiting at the ritual."

Your handler is HaX, reachable by phone. HaX's opening call includes: "Don't do favours for anyone you
haven't checked."

You start with a lockpick and a fingerprint kit. Combat is possible at this event.

---

## 2. The board (as it looks at the start)

Title: **Open evening**. Marks you can set on each suspect: "Undecided", "Cultist", "Not a cultist".
Marking someone "Cultist" asks "Which profile?". Marking someone "Not a cultist" offers "What rules them
out? (optional)". Marks are your notes only. They do not count as accusing anyone.

### Profile card: "What to look for"

The three profiles above, then the clue counts for the whole case (all start at 0 found). ✦ = marked.

| Slot | Clue | In this case |
|---|---|---|
| Where they were | Badged into the Archive [label from design 12] | 2 |
| Where they were | In the lecture hall [placeholder label] | 2 |
| Where they were | In the garden [placeholder label] | 1 |
| What they want | ✦ marked: wants the Codex [label from design 12] | 3 |
| What they want | ✦ marked: wants a promotion | 1 |
| What they want | Wants funding [placeholder label] | 1 |
| What they carry | ✦ marked: the brass Tesseract key [label from design 12] | 1 |
| What they carry | ✦ marked: sigil ring | 1 |
| What they carry | ✦ marked: burner SIM | 1 |
| What they carry | A ward charm [label from design 12] | 2 |
| What they carry | A notebook [placeholder label] | 2 |
| What they carry | An umbrella [placeholder label] | 1 |

Each line shows as "<Label>: <n> in this case, <found> found".

Stakes line under the counts: "Stakes: a wrong call will change what you can do next. A wrong or
missed call also costs part of your score." Then the stakes text from the brief.

### Suspect cards

Each card shows every clue space from the start, face down as "Hidden".

| Suspect | Where they were | What they want | What they carry |
|---|---|---|---|
| Okafor | Hidden | Hidden | Hidden, Hidden |
| Venn | Hidden | Hidden | Hidden |
| Marsh | Hidden | Hidden | Hidden, Hidden |
| Ishikawa | Hidden | Hidden | Hidden, Hidden |
| Delacroix | Hidden | Hidden | Hidden |

Full names and roles: [placeholder; the plan gives surnames only].

From time to time the board may say "You have enough to decide about <name>." It never says which way.
(The judge tells you when this appears.)

---

## 3. The map

- **Hall** (start). The five guests, the bar staff, an intern, the board, a wine glass on a table. HaX
  is on your phone.
- **Cloakroom.** Off the Hall through a locked door (pick the lock). Inside: an unlocked locker holding
  two coats, a phone on a hook, a note.
- **Archive.** Off the Hall through a door with a PIN pad. Inside: a terminal with the visitor badge
  log, a security monitor, a reading desk.
- **Sanctum.** Off the Archive through a locked door with no keyhole you can use. HaX can open it (see
  §6).

---

## 4. People you can talk to

### Bar staff (Hall), a witness

Three topics. The first question is free. Each question after the first makes them less willing to
talk; push too far and they give vague answers, then refuse. One kind word, once, wins some goodwill
back. A topic disappears once you hold its clue. [placeholder: the plan does not say whether the
influence number is shown on screen]

| Topic [placeholder wording] | What you hear |
|---|---|
| "Ask about Okafor" | [placeholder] "Okafor's been asking everyone about the Codex all night." (Okafor: wants the Codex) |
| "Ask about Venn" | [placeholder] "Venn's after money. Funding for her project, she says." (Venn: wants funding) |
| "Ask about Delacroix" | [placeholder] "Delacroix left a dripping umbrella on my bar." (Delacroix: carries an umbrella) |
| "Say something kind" (once) | [placeholder] "Thanks. Long night." No clue. |

### Intern (Hall), a witness

Same rules as the bar staff.

| Topic [placeholder wording] | What you hear |
|---|---|
| "Ask about Marsh" | [placeholder] "Marsh wants a promotion. She's said so twice tonight." (Marsh: wants a promotion) |
| "Ask about Ishikawa" | [placeholder] "Ishikawa asked me where the Codex is kept." (Ishikawa: wants the Codex) |
| "Ask about Delacroix" | [placeholder] "Delacroix keeps steering talk round to the Codex." (Delacroix: wants the Codex) |
| "Say something kind" (once) | [placeholder] No clue. |

### The five guests (Hall)

A suspect's own word clears nobody. Every guest offers small talk [placeholder] and an accusation:
"Accuse <name>. There is no taking this back." The accusation is final. Ask the judge for the reply.

Extra topics:

- **Marsh.** Once you know what she wants, a new choice appears: "Ask what she needs". She says: "My
  phone is on a hook in the cloakroom and the attendant has gone home." Once you hold the phone, a
  choice appears: "Give Marsh her phone". (A favour. Ask the judge what happens.)
- **Venn.** Once you have seen her coat, a choice appears [placeholder wording: "Ask about the
  archive"]. She says: "You've been through my coat? Fine. The archive code is 2291."
- **Okafor, Ishikawa, Delacroix.** No extra topics in the plan. [placeholder]

### HaX (phone)

- Opening call: the favour warning above.
- After you have dealt with every guest, the board shows: "Everyone here has been dealt with. Call HaX
  when you're ready for the sanctum."
- Calling HaX to open the sanctum: "Once you go in, you can't come back out to question anyone. Anyone
  you haven't named stays free." Choices: "Go in" / "Not yet, I want to check something".
- HaX may call you at other moments. The judge tells you when.

---

## 5. Clues by room and source

### Hall

| Source | Action | What you get |
|---|---|---|
| Bar staff | Talk (see §4) | Up to three clues |
| Intern | Talk (see §4) | Up to three clues |
| Wine glass | Dust with the fingerprint kit | Prints identified as Marsh's. "Marsh wears a ring with the spiral sigil." [text from design 12] (Marsh: sigil ring, ✦ marked) |
| Board | Open | The board (§2) |

### Cloakroom (pick the lock)

| Source | Action | What you get |
|---|---|---|
| Locker: Venn's coat | Take or read | [placeholder] "A ward charm is sewn into the lining of Venn's coat." (Venn: a ward charm) |
| Locker: Ishikawa's coat | Take or read | [placeholder] "Ishikawa's coat holds a ward charm and a notebook full of her handwriting." (Ishikawa: a ward charm; a notebook) |
| Phone on a hook | Pick up | Marsh's phone (an item). No clue by itself. |
| Note | Read | [placeholder] "Archive door: 2291." |

### Archive (PIN door)

| Source | Action | What you get |
|---|---|---|
| Badge log terminal | Filter the visitor badge log | Where each guest was. [placeholder wording] Okafor: lecture hall. Venn: badged into the Archive. Marsh: garden. Ishikawa: badged into the Archive. Delacroix: lecture hall. |
| Reading desk | Look | [placeholder] "A notebook with Okafor's name on the cover lies open on the desk." (Okafor: a notebook) |
| Security monitor | Watch | [placeholder] Footage shows Okafor pocketing a brass key. (Okafor: the brass Tesseract key, ✦ marked.) Then ask the judge whether HaX calls. |

### Sanctum (opened by HaX)

| Source | Action | What you see |
|---|---|---|
| Altar | Use | "End the evening? Anyone still standing here stays standing." Confirm, or cancel ("not yet"). |

---

## 6. Actions with hidden results (ask the judge)

- Handing Marsh her phone.
- Accusing any guest.
- Hitting or knocking out any guest. The first punch on a calm guest shows: "Knocking out a suspect
  counts as accusing them."
- Picking up anything a knocked-out guest drops.
- Watching the security monitor (whether HaX calls with a choice).
- Revisiting the coats after any accusation.
- Going into the sanctum, and using the altar.
