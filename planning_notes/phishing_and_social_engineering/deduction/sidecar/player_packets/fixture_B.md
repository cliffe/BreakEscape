# Player packet: Night shift (fixture B)

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md`, 3327 lines, latest review round "Round 4 outcomes" (§4.9, §6.3, §7.1–7.5, §9.1).
This packet holds only what a player could see or hear. Text the plan does not give is marked [placeholder].
The solution is in `fixture_B_answer.md`. Do not open that file until you have made your call.

You can read the sections in any order, the same way a player can walk the rooms in any order. Only one rule
about order applies: some doors and topics open up after something else has happened, and each entry below
says what it needs.

---

## 1. The brief

Shown before play. The plan says the brief repeats the profile text and the stakes text exactly and does not say
how many people are involved. The rest of the wording is not given.

> [placeholder] Last night an intruder got in with help from inside. Security wants names before the shift
> report goes up. Four staff were on site overnight: Ngozi Okoro, Erik Lindqvist, Samira Haddad and Gwen Morgan.
>
> **What to look for (Insider):** Went into the server room outside their role, had a personal device on the
> staff network, and raised a grievance in the last month.
>
> Name the wrong people, or miss someone, and the report will say so.
>
> [placeholder] When you're ready, call Priya Nair, the security manager, and give her your names.

---

## 2. The board ("Night shift")

The board is an object in the office. Open it at any time. Its layout from top to bottom:

**Header:** Night shift. Close button.

**What to look for**

- **Insider.** Went into the server room outside their role, had a personal device on the staff network, and
  raised a grievance in the last month.
- Counts (each starts at 0 found):
  - Went in outside their role: 2 in this case, 0 found
  - Went in for their own work: 2 in this case, 0 found
  - Personal device: 2 in this case, 0 found
  - No personal device: 2 in this case, 0 found
  - Grievance this month: 2 in this case, 0 found
  - No grievance: 2 in this case, 0 found
- Stakes: a wrong call changes how the story ends.
- Name the wrong people, or miss someone, and the report will say so.

**Suspect cards** (in this order). Each card has three rows with one clue each, and every clue starts as
"Hidden".

| Suspect | Role | Server room access | Devices on the network | Recent grievance |
|---|---|---|---|---|
| Ngozi Okoro | Night operator | Hidden | Hidden | Hidden |
| Erik Lindqvist | Facilities engineer | Hidden | Hidden | Hidden |
| Samira Haddad | Service desk analyst | Hidden | Hidden | Hidden |
| Gwen Morgan | Shift supervisor | Hidden | Hidden | Hidden |

When you get a clue, its cell shows the clue label (for example "Server room access: went in outside their role")
and the matching count goes up by one.

**Marks on each card** (your own notes, not verdicts): "Undecided", "Insider", "Not an insider".

- Choosing "Insider" asks "Which profile?" (only Insider is on offer).
- Choosing "Not an insider" asks "What rules them out? (optional)" and lists the clues you hold on that person.
- Marks are kept if you reload.

**Nudge:** when your clues settle someone either way, the card says "You have enough to decide about <name>."
It also shows once as a pop-up at the moment you get the clue that settles it. It never says which way.

The board has no "Make the call" button. You make your call by phone to Nair (section 6).

---

## 3. The map

| Room | How you get in | What is there |
|---|---|---|
| Office | You start here | The board; an HR filing cabinet with a PIN lock; Ngozi Okoro; Samira Haddad; phone calls from Priya Nair |
| Kitchen | Open door from the office | Tomás Rivera (cleaner); Erik Lindqvist; Gwen Morgan |
| Server room | PIN door from the kitchen. You don't start with the code | A badge log terminal; a DHCP printout |

Nobody fights in this case.

---

## 4. Room by room

### 4.1 Office

**Priya Nair (security manager), by phone**

- Opening call. The only line the plan gives: "HR's cabinet code is 7310 if you need the files." The rest of the
  call is [placeholder].
- Calling her again leads to the report (section 6).

**HR filing cabinet** (PIN lock, code 7310 from Nair's opening call)

- Inside: an HR summary (a note you can take and read). Its own text is [placeholder]. Taking it gives you four
  clues, each with a "Noted" pop-up:
  - **Okoro: lost an appeal this month.** "Okoro lost a shift-pattern appeal three weeks ago."
  - **Lindqvist: overtime complaint.** "Lindqvist filed a complaint about overtime pay last week."
  - **Haddad: no grievance.** "HR has nothing on file for Haddad."
  - **Morgan: no grievance.** "HR has nothing on file for Morgan."

**Ngozi Okoro (night operator)**

- [placeholder] You can talk to her. The plan gives her no topics and no clues. Nothing she says about herself
  counts as evidence.

**Samira Haddad (service desk analyst)**

- [placeholder] You can talk to her. The plan gives her no topics and no clues.

### 4.2 Kitchen

**Tomás Rivera (cleaner, night shift)**

A witness who talks about other people. Topics:

| Topic (choice text) | What he says | Clue you get |
|---|---|---|
| "Who's been unhappy on nights?" | "Okoro lost her appeal on the shift pattern. She took it badly." | **Okoro: lost an appeal this month.** "Okoro lost a shift-pattern appeal three weeks ago." |
| "Who brings their own gadgets in?" | [placeholder] He mentions Okoro's phone. | **Okoro: personal phone on the staff network.** "A phone of Okoro's has been on the staff network during her shifts." |
| "Anything odd last night?" | [placeholder] He heard the server room alarm go off at about two, and Lindqvist went in. | No clue. Afterwards you can ask Lindqvist about the alarm. You can ask this only once. |
| "Anyone complaining about pay?" | [placeholder] He mentions Lindqvist's overtime complaint. | **Lindqvist: overtime complaint.** "Lindqvist filed a complaint about overtime pay last week." |
| "Thank him for the coffee" | "Thanks. It's a long night." | No clue. He warms to you. Offered once. |
| "Leave it there" | Ends the talk. | |

What you notice as you push him:

- Every answer comes before any cost. The first question is free. After that, each answer leaves him a little
  less willing. No number is shown [placeholder: the plan doesn't say whether the shift in his mood is shown on
  screen].
- After three questions he turns guarded. A clue topic asked then gets a vague reply such as "I'd rather not talk
  about people behind their backs.", gives no clue and costs nothing, and the topic stays on offer.
- If you push him well past that, he ends the conversation. [placeholder: his line when he ends it.]
- Thanking him for the coffee wins some goodwill back, once.
- Once you hold a topic's clue, from him or from anywhere else, that topic is no longer offered.

**Erik Lindqvist (facilities engineer)**

| Topic (choice text) | Needs | What happens |
|---|---|---|
| [placeholder] "Ask about his pay" | Always offered [placeholder: the plan doesn't say what gates it] | [placeholder] He gives you a copy of his overtime complaint, which goes into your notes (its own text is [placeholder]). Clue: **Lindqvist: overtime complaint.** "Lindqvist filed a complaint about overtime pay last week." |
| "Ask about last night's server room alarm" | Only after Tomás has told you about the alarm | [placeholder] He gives you the server room door code, 4417. No clue. |

He talks about himself only. Nothing he says clears him.

**Gwen Morgan (shift supervisor)**

- [placeholder] You can talk to her. The plan gives her no topics and no clues.

### 4.3 Server room (PIN door, code 4417 from Lindqvist)

**Badge log terminal** (a log-filter puzzle; its screens are [placeholder])

- When you finish the filter you get four clues:
  - **Okoro: server room, outside her role.** "The badge log puts Ngozi Okoro in the server room at 02:10.
    Nothing on her rota needed it."
  - **Lindqvist: server room, outside his role.** "The badge log puts Erik Lindqvist in the server room at
    23:40, though cooling checks are a day job."
  - **Haddad: server room, for her own ticket.** "Samira Haddad badged into the server room once, for a ticket
    she logged."
  - **Morgan: server room, her own checks.** "Gwen Morgan's server room visits match her supervisor checks."

**DHCP printout** (look at it; the printout appears as a pop-up [placeholder: its own wording])

- Looking at it gives you four clues:
  - **Okoro: personal phone on the staff network.** "A phone of Okoro's has been on the staff network during her
    shifts."
  - **Lindqvist: no personal device.** "No device of Lindqvist's appears on the staff network."
  - **Haddad: personal laptop on the staff network.** "Haddad's own laptop took a lease on the staff network."
  - **Morgan: no personal device.** "No device of Morgan's appears on the staff network."

---

## 5. Clues by person (an index of where each can come from)

Use it to check coverage. It doesn't tell you what any clue says about guilt.

| Person | Server room access | Devices on the network | Recent grievance |
|---|---|---|---|
| Okoro | Badge log (server room) | DHCP printout (server room); Tomás, "gadgets" | Tomás, "unhappy"; HR summary (office) |
| Lindqvist | Badge log | DHCP printout | Tomás, "pay"; HR summary; Lindqvist's complaint copy (kitchen) |
| Haddad | Badge log | DHCP printout | HR summary |
| Morgan | Badge log | DHCP printout | HR summary |

---

## 6. Making the call (phone Nair)

Calling Nair after her opening call:

> Nair: Who do you want me to look at? Name as many as the evidence supports. Names you give me stand.

Choices (each name is offered until you have named that person):

- "Name Okoro. This can't be taken back." → "You give Nair a name: Ngozi Okoro." (the same pattern for each
  name)
- "Name Lindqvist. This can't be taken back."
- "Name Haddad. This can't be taken back."
- "Name Morgan. This can't be taken back."
- "That's everyone"
- "Not yet, I want to check something" (back to the call [placeholder: the call's main menu])

After "That's everyone":

> Nair: Anyone you haven't named is cleared, and the shift report goes up tonight. Sure?

- "Yes, send it" → "Nair: Done. I'll take it from here." The case closes.
- "Not yet, I want to check something" → the case stays open, and you can go back and look again.

Nothing tells you how many names to give. Names you give her stand even if you then say "Not yet".

After the call closes, a debrief opens (its content is in the answer file), followed by a success screen that
reads "Case closed" whatever you decided.
