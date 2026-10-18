---
title: "The Mole (Break Escape Mission 8)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based internal investigation to learn how an insider is found: read a door audit against a timestamp, test a printout by asking the people on it, clone a keycard, pick up the codes a building leaves lying around, decode ROT13 and Base64 in CyberChef, and decide what happens to a colleague who sold you out."
overview: |
  Most of the attacks in this series come from outside. This one does not. Four ENTROPY operations went live inside the same minute, two SAFETYNET agents are dead, and an intercept shows that ENTROPY had the deployment order before it was written. Somebody inside the Citadel, SAFETYNET's own headquarters, passed it on. The Director hands you three names and tells you to find the one that is guilty, quietly, before they vanish.

  You play Agent 0x00, back in the building you left nine days ago. You interview three colleagues who have worked beside you for years, collect the paper trail the building keeps without meaning to (a door audit, a leak timeline, three staff lockers, a printout with more service numbers on it than anyone intended), and work out who was in the room at the minute the plan was opened. You clone a keycard off the Director's lanyard, open a safe with a number nobody should have used, and decode a USB stick in the Crypto Lab. The mission ends with a confrontation and a decision about someone you trusted.

  This sheet gets you started, explains the ideas behind each lock and each piece of evidence with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to the exact steps. The work on the repository server in the server room has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["insider-threat", "door-audit", "log-analysis", "rfid", "cloning", "lockpicking", "fingerprints", "base64", "rot13", "cyberchef", "encoding", "social-engineering", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m08_the_mole/labsheet.md"
cybok:
  - ka: "AB"
    topic: "Characterisation of Adversaries"
    keywords: ["The insider threat", "State actors"]
  - ka: "F"
    topic: "Definitions and Conceptual Models"
    keywords: ["Digital (forensic) trace", "Audit trail"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["User authentication", "Biometrics", "Smart cards", "Personal identification number and memorable information"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["Physical access and secure deletion", "Authentication and identification"]
  - ka: "C"
    topic: "Symmetric Cryptography"
    keywords: ["Encoding", "Caesar cipher"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain why a trusted insider with legitimate access is harder to find than an outsider, and what kind of evidence does find them
- read a door audit against a timestamp and say who was inside at that minute, and why a door log shows who was in a room but not whose account was used
- test a printout by asking the people named on it to confirm their own rows, and say why that beats trusting the page
- describe how a keycard with custom keys is cloned, and how a PIN, a password and a safe code written down or reused undo a good policy
- tell ROT13 and Base64 apart on sight, decode each by hand and in CyberChef, undo them when one is wrapped in the other, and say why neither is a form of security
- weigh up accusation, evidence and the fate of a colleague you trained beside

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes a few minutes and saves you time later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and the exact steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The work on the repository server in the server room is in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m08-the-mole-vm-technical-steps/), so you can play the rest of the mission without it.

> Note: The codes and passwords in the building are the same every game, but you still work them out from clues in the building. This sheet says where each clue is and what shape the answer takes, never what it reads. The evidence you pull from the server is generated for your game, and the companion sheet covers how to get it.

## Getting Started {#getting-started}

You are Agent 0x00, a SAFETYNET field agent. Nine days ago you were sent to Portland, the one site where a person on the ground could change the outcome. ENTROPY already had your name. Director Netherton has pulled you back to the Citadel, where security is at Level Red and every badge reader blinks red, and given you three suspects: Agent 0x23 "Vector", Agent 0x88 "Phantom" and Agent 0x47 "Nightshade". Agent HaX, your handler, has known all three for years and is on your phone. ATHENA, the building's AI, logs everything.

You do not need any prior knowledge before you start. The first encoding is taught in the warm-up below, and the door audit is explained in **Concepts**.

1. \==action: Start the Break Escape mission **The Mole**==.
2. \==action: Listen to ATHENA's welcome in the main lobby==.
3. \==action: Go north to the Director's office and talk to Director Magnus Netherton==.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

The mission takes about 60 to 75 minutes. Your progress, evidence and unlocked rooms are kept between sessions.

> Tip: A natural stopping point for a 60-minute class is once you have named the leak to the Director and hold the code for the interrogation suite. The server-room work and the confrontation make a good second session.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents you pick up open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX), a **Lock Pick Kit**, an **RFID Cloner** and a **Fingerprint Kit**. There is no PIN cracker this time.

The building has nine rooms. The main lobby is the hub: the Director's office is north, the Operations Floor is east, and the Cryptography Lab (the Crypto Lab) is west. From the Operations Floor, Intelligence Analysis is north, the Server Room is east and the Security Archives are south. From the Crypto Lab, the Break Room is west and the Interrogation Suite is south.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[What does the Director need from me?]**, **[Where would the door logs be?]**, **[How do I get into the server room?]** and **[How do I get into the interrogation suite?]**. HaX answers from where you are in the investigation, so asking again later gives a different answer.
- Field guides, the in-universe lab sheets. Choose **[I need a field guide.]** and pick the one you want. A guide appears on that menu only once you have reached the challenge it covers. The decoding guide is covered in the stages below.

> Tip: Press **Q** to switch between your fists and your open hand. You need the open hand to use things. If you strike someone by accident, HaX texts you how to put the fists away.

> Tip: The locks in this building want exact values. A password is case-sensitive, with no extra spaces. A PIN is four digits. Copy decoded text with the mouse rather than retyping it.

> Warning: The Director wants this done quietly. Accusing someone out loud, being seen picking a locker, or knocking out a bystander gets round the floor, and the person you are hunting hears it. Several choices in the game carry this cost, and the stages below say where. None of them locks you out of finishing the mission.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Do this once you are at the **CyberChef Workstation** in the Crypto Lab. It uses made-up data, not anything from the game.

1. \==action: Open CyberChef and clear the recipe== if anything is in it.
2. \==action: Type `TGFudGVybg==` into **Input**==.
3. \==action: Search for `base64` and double-click **From Base64**==. The output reads `Lantern`.
4. \==action: Clear the input and type `Avtug fuvsg`==. From Base64 now gives nonsense. ==action: Remove From Base64 and add **ROT13** instead==. The output reads `Night shift`.
5. \==action: Clear the input and type `ET9ipvOznKWmqN==`==. Start with **ROT13** only: it gives text that looks like Base64 (`RG9vciBmaXJzdA==`). ==action: Add **From Base64** after it==. The output reads `Door first`.

You have just seen the two schemes the Crypto Lab deals in, and what it looks like when one is wrapped in the other. The next section explains how each works.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### The Insider and the Door Audit {#audit}

An outsider has to break in. An insider walks in with a badge. They already have the access, so a good insider leaves no break-in to find. Someone who acts out of belief rather than for money leaves no payment trail either. What is left is timing: who could have done it, and who was in the right place at the right minute.

A **door audit** is the log a badge system keeps. Each row says a door, a time, IN or OUT, and a badge. It tells you who passed through a door, not what they did on the other side, and not whose account was used on a computer there. It is a shortlist, not a verdict.

To read one against a minute, work through the rows in time order and keep a list of who is inside:

1. \==action: Find the minute== you care about (here, the moment a file was opened).
2. \==action: Walk the rows from the top==. An IN row adds the person to the list. An OUT row removes them.
3. \==action: Stop at the minute== and read the list.

Here is a made-up example. A file was opened at 14:20. The door log for the studio's only entrance reads:

```
09:05  IN   0x51
09:40  OUT  0x51
13:48  IN   0x2A
14:02  IN   0x37
14:14  OUT  0x37
15:02  OUT  0x2A
```

Walking the rows, 0x51 came and went in the morning. 0x2A went in at 13:48 and was still inside at 14:20. 0x37 went in at 14:02 but left at 14:14, six minutes before the file opened. Only 0x2A was inside at the minute. The tempting wrong answer is 0x37, the latest IN before the minute, which is why you read the OUT rows too.

A table helps when you meet a row you do not expect:

| What you see | What it probably means | What to try |
| --- | --- | --- |
| An IN row and no OUT row before the minute | The person was inside at the minute | Put them on the shortlist |
| An IN row and an OUT row, both before the minute | They were in the building but gone by then | Note the gap between OUT and the minute |
| A row from a different system (a travel desk, a rota) | An alibi somewhere else | Ask where the row came from |
| A page someone else printed | You are trusting their query and their window | Ask the people named on it to confirm their own rows |

A printout is only as good as the person who ran the query. If someone on the page is wrong about their own row, they will say so, and a row they confirm is worth more than a page you cannot check.

> Question: In the example, 0x2A says "that OUT row is wrong, I left at 13:55." What would you do before you trusted the log, and what else could you check it against?

### Weak Codes and Written-Down Secrets {#codes}

A lock is only as strong as the way its secret is looked after. This building is at Level Red and still leaves several where anyone can read them.

| Lock in the building | What it wants | Shape of the answer |
| --- | --- | --- |
| Visitor Badge Printer | A PIN | Four digits |
| Security Archives door | A password | Text, case-sensitive |
| Director's Safe | A PIN | Four digits |
| Interrogation Suite door | A PIN | Four digits. The pick kit cannot open it |
| Staff lockers | A key | Picked, or handed over by their owners |
| Server Room door | An RFID card | A cloned keycard |

The common failures are the ones the game shows you. A secret is copied onto a sticky note so facilities can find it. A policy says to choose your own safe code, and everyone chooses their own service number. A printout carries a requester's number in its header. Each is a small convenience that undoes the lock.

> Question: A policy tells staff to choose their own safe code, and in this building everyone chooses their own service number. Why does that policy end up there, and what would a better policy ask for?

### RFID Cloning: Custom Keys {#rfid}

A keycard is a small chip that answers a reader at short range. The cloner has three steps: **read** the card, **crack** its keys if they are not defaults, then **emulate** the saved card at a reader.

In earlier missions the cards were simple and copied in one read. The Director's card is a MIFARE Classic with custom keys, so the cloner has to run a recovery attack before it can read it, which takes about half a minute. The cloner is passive until you start it, so the trick is to stand close and keep the owner there until it finishes. A card anyone can read from an arm's length away is a key you have handed out.

When the keys are cracked, press **Save**. The read is not kept until you do. To use the copy, open the cloner at the reader, choose the card from **Saved**, and emulate it.

> Question: A cloned card works because the reader trusts the card. What would the reader need to check besides the card for a clone to fail, and what would that cost the people who work in the building?

### Keys, Picks and Lockers {#lockers}

A locker with a key lock can be opened three ways: with its key, with the pick kit, or by getting the person who holds the key to give it to you. A pin tumbler lock holds its pins in place with a spring; the key lifts each pin to the same height so the lock can turn. The pick kit works one pin at a time under light tension: too much force and the pins stop moving, too little and they drop back.

Picking takes time and takes place in the open. Whoever is in the room can watch you do it. Asking the owner for the key is slower to arrange and quieter to use.

The game offers no lockpicking field guide in this mission. If you want the technique, the published guide is in **Further Reading**.

### Encoding Is Not Security {#encoding}

Two schemes turn up in this mission. Neither has a key, so neither protects anything. They only change the alphabet the data is written in.

**ROT13** is a Caesar cipher with a fixed shift of 13. Each letter moves 13 places: `A` becomes `N`, `B` becomes `O`. Spaces, digits and punctuation are left alone, so word lengths and shape survive. Because 13 is half of 26, running ROT13 twice gets you back to the start.

```
plain   N i g h t   s h i f t
ROT13   A v t u g   f u v s g
```

So `Night shift` becomes `Avtug fuvsg`. The giveaway is text that keeps normal spacing but reads as gibberish.

**Base64** rewrites any data as printable text, using `A`–`Z`, `a`–`z`, `0`–`9`, `+` and `/`. It reads the bytes three at a time (24 bits), cuts them into four groups of 6 bits, and writes each group as one of 64 symbols. Its length is a multiple of four and it often ends in one or two `=` signs as padding.

```
L        a        n
01001100 01100001 01101110
010011 000110 000101 101110
19     6      5      46
T      G      F      u
```

So `Lan` becomes `TGFu`, and `Lantern` becomes `TGFudGVybg==`. One unbroken block of mixed-case letters, digits, `+` and `/` is Base64, not English.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| Scrambled letters, normal word lengths, spaces kept | ROT13 | ROT13 |
| One block of mixed-case letters, digits, `+`/`/`, maybe trailing `=` | Base64 | From Base64 |
| A block that looks like Base64 but does not decode to anything readable | A layer on top, probably ROT13 | Undo the outer layer first |

One scheme can be wrapped in another. You undo the layers in the reverse of the order they were applied. If something was Base64'd and then ROT13'd, the outer layer is ROT13, so you run ROT13 first and From Base64 second:

```
plain             Door first
Base64            RG9vciBmaXJzdA==
then ROT13        ET9ipvOznKWmqN==
```

Running From Base64 straight away on `ET9ipvOznKWmqN==` gives bytes that are not text. That failure is your clue that the outer layer is something else.

> Question: You run ROT13 on a block and the output is still a block of letters and digits with no spaces. What should you try next, and what tells you it worked?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. The stages are in the order most players meet them, and the game lets you do many of them in a different order. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** or **Recipe** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock or the character want: a code, a password, a card, a key, a reading of the evidence? And have I actually looked everywhere the last room offered?

### Before the First Lock: The Lobby and the Director {#hints-start}

**Where:** the main lobby, then the Director's office, north. **Goal:** take the briefing.

> Hint: Everything starts with the Director. ATHENA at reception will tell you what she may and may not say, and she hints at two places worth remembering for later.

<details markdown="1">
<summary>Nudge</summary>

Talk to ATHENA if you want her hints about the archives and the safe. She reads out neither. Then go north and talk to Director Magnus Netherton. The briefing counts as taken on his first line, and the investigation opens up. Ask him about each suspect and about the rules of engagement: he is clear that quiet matters, and that a hunch is not proof.

His desk carries three **Suspect Dossiers**. Read them. They are short, and they say what each person's file raises.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to ATHENA at the reception console== (optional).
2. \==action: Go north and talk to Director Magnus Netherton==.
3. \==action: Ask him about each of the three suspects and about the rules of engagement==.
4. \==action: Read the Suspect Dossiers on his desk==.

</details>

> Warning: If the Director asks who your instinct points at, he records it and reads it back later, but he tells you plainly that an instinct is not evidence. It is a question about what you believe so far, not a commitment.

### The Three Interviews {#hints-suspects}

**Where:** Vector on the Operations Floor (east of the lobby); Phantom in Intelligence Analysis (north of the Operations Floor); Nightshade in the Crypto Lab (west of the lobby). **Goal:** talk to all three.

> Hint: Each of them gives you a claim you can test later. Where does each say they were? Which of those claims could a log confirm or contradict?

<details markdown="1">
<summary>Nudge</summary>

A first conversation with each of them counts as an interview. Ask the questions about where they were and who they think it is. Their answers are claims, and the door audit later tests them. Don't decide on a face: the Director warned you about that, and so do the suspects.

Phantom keeps a private notebook in Intelligence Analysis, and the room also has a tactical board from the night of the four attacks. Both are worth reading.

The Director will not hand over his keycard until you have talked to all three. If you try early, he names the ones you have not seen.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Vector on the Operations Floor==. Ask where he was and what the odd hours are about.
2. \==action: Talk to Phantom in Intelligence Analysis== (north of the Operations Floor). Read **Phantom's Off-Book Notes** while you are there.
3. \==action: Talk to Nightshade in the Crypto Lab==.
4. \==action: Ask each of them the "where were you" question== so you have their account on record.

</details>

> Warning: Each suspect has an option to accuse them aloud, with the whole floor listening. If you take it before you have named anyone on the evidence, word gets round and the person you are hunting hears that you are looking, whether you were right or not. An innocent suspect you accuse will also stop helping you until you apologise. Both apologies are in the game.

### The Break Room: The Post-It, the Timeline and the Witness {#hints-break-room}

**Where:** the Break Room, west of the Crypto Lab. **Goal:** collect the two codes written down on a sticky note, a timeline for the leak, and a witness's account.

> Hint: A building at Level Red still has a kettle. Facilities write things down, and ATHENA told you where they spend the night.

<details markdown="1">
<summary>Nudge</summary>

The **Post-It On The Coffee Machine** carries two things facilities did not want to forget: a password and a PIN. They open the Security Archives door and the Visitor Badge Printer in the lobby. The **Leak Timeline (someone's working notes)** on the table tells you the minute the operations plan was opened. Write that minute down: the Director asks for it later.

The Off-Duty Agent in the corner has a short account of the morning. Treat it as one person's memory, not a log.

**Learn it:** ==action: Read the Leak Timeline and copy the minute the plan was opened onto paper== before you leave. A reading against a clock needs the clock.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Post-It On The Coffee Machine==.
2. \==action: Read the Leak Timeline (someone's working notes)==.
3. \==action: Talk to the Off-Duty Agent and ask what he saw that morning==.

</details>

> Warning: The Off-Duty Agent keeps an eye on the lockers. See the locker stage before you try one.

### The Security Archives {#hints-archives}

**Where:** the Security Archives, south of the Operations Floor. **Lock:** a password. **Goal:** find the door audit for the leak window.

> Hint: This door wants a password, not a PIN. The person who set it also wrote it down, and you were just in the room where they did.

<details markdown="1">
<summary>Nudge</summary>

Enter the password from the sticky note exactly, with its capital letters and no spaces. Inside, the **Badge Audit Printout -- Leak Window** was printed and never collected, and it slid off a desk onto the floor. Its header says whose query it was. Read it row by row. Two other documents are also here, and both are optional.

HaX's **[Where would the door logs be?]** option tells you roughly where to look if you have not found the archives yet.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go to the Security Archives and enter the password from the Post-It==.
2. \==action: Read the Badge Audit Printout -- Leak Window==.

</details>

> Warning: The audit shows the Crypto Lab door, the lab's library door and a travel desk. The Crypto Lab door is the only way into the lab, the Break Room and the Interrogation Suite. Think about what that means for who could have been inside.

### The Lockers and the USB Stick {#hints-lockers}

**Where:** the Break Room, three staff lockers labelled 0x23, 0x47 and 0x88. **Lock:** a key. **Goal:** see what each person keeps in theirs.

> Hint: A locker with a key lock has three answers: pick it, find the key, or ask its owner. One of those can be seen from across the room.

<details markdown="1">
<summary>Nudge</summary>

Each owner will hand over their locker key if you ask, but only after you have put the door audit to them. Once you have read the audit, each suspect has an option that starts from it. After that, **[Your locker in the break room. I want to see inside it.]** appears. The key opens that locker quietly.

The pick kit also works, but the Off-Duty Agent is watching, and being caught picking any of the three counts as an accusation: it gets round the floor.

The lockers hold a hardware token, a boarding-pass stub and a folded sheet, a packed bag, a page from a recruitment document and a USB stick. The stick shows a file name and a long block of text.

**Learn it:** ==action: Read each suspect's reaction to the audit== before you ask for the key. Each has said something about their own row. Compare it with the page.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Badge Audit Printout== first (see the previous stage).
2. \==action: Talk to each suspect and choose the option that starts from the door audit==.
3. \==action: Choose **[Your locker in the break room. I want to see inside it.]**== with each suspect to take their key.
4. \==action: Open each locker in the Break Room and read what is inside==.

</details>

> Warning: Do not pick a locker while the Off-Duty Agent can see you, unless you accept the cost. The pick stops, he says he saw nothing, and the floor hears it anyway.

### Reading the Door Audit: Naming the Leak {#hints-naming}

**Where:** the Director's office. **Goal:** read the door audit to the Director so that he can name the leak. This does not need the server.

> Hint: The Director will not take a name. He wants a reading: a door, a clock, a person who has confirmed their own row. What have you not got yet?

<details markdown="1">
<summary>Nudge</summary>

HaX's **[What does the Director need from me?]** option checks your progress for you and tells you the first thing missing: the audit, a clock, or a confirmed row.

When you have all three, choose **[I can name the leak, sir.]** and the Director asks four questions: when the plan was opened, which of the three was behind the lab door at that minute, why not the other man who badged through the same door, and why trust Phantom's printout.

Each question has one answer that follows the evidence. The wrong ones are the tempting readings: the nearest time, the person you already suspect, or a person's desk. **[Let me read it again.]** is free at every step, so use it and go back to the printout.

**Learn it:** ==action: Do the walk from the **Concepts** section by hand== on the real audit. List who is inside at the minute the plan was opened, then say, for the other person who went through the door, which row proves they had gone.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Badge Audit Printout== and the **Leak Timeline**.
2. \==action: Take the audit to at least one of the two people who badge through the lab door== (their options start from the door audit) and let them confirm their own row. Phantom's confirmation does not count; he is not on the lab door.
3. \==action: Go to the Director's office and choose **[I can name the leak, sir.]**==.
4. \==action: Answer his four questions from the printout== and your own reading, not from memory.

</details>

> Warning: Three wrong answers close the check, and the Director takes it over. Done before the server work, that gets noticed on the floor; done after, he reads it against the server evidence himself. Both are on the record. "Let me read it again" never counts as a wrong answer.

If the Director is out of action, HaX will hear the same reading from you instead.

Once he has the name, he gives you the code for the interrogation suite and points you at his safe. **[The suite code again, sir?]** repeats it.

### Getting Into the Server Room {#hints-server-room}

**Where:** the Server Room, east of the Operations Floor. **Lock:** an RFID card reader. **Goal:** get in.

> Hint: The reader wants a card that opens the server zone. The Director has one, and he is not going to hand it over. There is also a quieter route from the lobby that someone left out in the open.

<details markdown="1">
<summary>Nudge: the Director's card</summary>

Talk to all three suspects first. Then go back to the Director and choose **[I'll need access.]**. He turns to the window and leaves his lanyard within reach. Choose **[Step up beside him and let the cloner read his card.]**. The card has custom keys, so the cloner needs to crack them before it can read it, and that takes about half a minute while you stand beside him.

HaX's **[How do I get into the server room?]** option explains the card and the attack.

**To learn more:** the Concepts section on RFID covers read, crack and emulate.

</details>

<details markdown="1">
<summary>Nudge: the Visitor Badge Printer</summary>

At reception, the **Visitor Badge Printer** has a **Printed Server-Zone Badge** in its output tray, behind a four-digit facilities PIN. The PIN is on the sticky note in the Break Room. This route needs no interview and no cloning, and it is a bit of a joke about how the building looks after its own secrets.

</details>

<details markdown="1">
<summary>Steps: the Director's card</summary>

1. \==action: Talk to Vector, Phantom and Nightshade== (see the interviews stage).
2. \==action: Talk to the Director and choose **[I'll need access.]**==.
3. \==action: Choose **[Step up beside him and let the cloner read his card.]**==.
4. \==action: In the cloner, crack the keys and run the attack, then press **Save**==.
5. \==action: At the Server Room reader, open the cloner, choose **Director Netherton Keycard** from **Saved**, and emulate it==.

</details>

<details markdown="1">
<summary>Steps: the printer</summary>

1. \==action: Read the Post-It On The Coffee Machine== for the facilities PIN.
2. \==action: Enter the PIN at the Visitor Badge Printer in the main lobby== and take the **Printed Server-Zone Badge**.
3. \==action: Use the badge at the Server Room reader==.

</details>

> Warning: The clone only counts once you press Save. If you close the cloner early, the Director's menu offers the clone again and you can redo it. He says plainly that whatever you carry, he did not see it.

Inside the Server Room are the **Evidence Relay Terminal**, where recovered evidence is submitted, a **Server Access Log (excerpt)** left by the rack, and the repository server. The excerpt is an auth-log printout with the account redacted. It gives a terminal and a time, which is a second source for the minute the plan was opened.

> Note: The server work has its own sheet, so you can play the rest spoiler-free and tackle the repository server yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m08-the-mole-vm-technical-steps/) when you want the hints for it.

### Decoding the USB Stick {#hints-decode}

**Where:** the USB stick from the Break Room lockers, and the **CyberChef Workstation** in the Crypto Lab. **Goal:** read the file on the stick.

> Hint: The text is one long block with no spaces. It is encoded, not encrypted, and a single decode does not give you something readable.

<details markdown="1">
<summary>Nudge</summary>

Take the stick and open it. HaX offers the decoding field guide. To get it, open your phone, choose **[I need a field guide.]** then **[Decoding with CyberChef.]**. Copy the whole block into CyberChef at the Crypto Lab. Two layers are in play, so decode one, then look at what you have, then decode the other. Undo the outer layer first.

**Learn it:** ==action: Run From Base64 on the block first== and see what you get. Then work out why, using the table in **Concepts**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the USB stick and copy its text==.
2. \==action: Paste it into **Input** at the CyberChef Workstation==.
3. \==action: Add **ROT13**==. The output should now look like a block of Base64.
4. \==action: Add **From Base64** after it==. The output is plain text.

</details>

> Warning: If the file reads "0 bytes. Last written: tonight.", someone wiped it after word got round that you were looking. The print on the casing is still there. The wipe is part of the cost of the earlier choices.

### The Director's Safe and the Interrogation Suite Code {#hints-suite-code}

**Where:** the Director's office safe (four digits), then the keypad south of the Crypto Lab. **Goal:** open the safe for the code card, or get the code from the Director.

> Hint: The safe belongs to the Director and the policy says everyone uses the same kind of number for theirs. The page you want is on the Operations Floor, and its header says who requested it.

<details markdown="1">
<summary>Nudge</summary>

The **Personnel Print Job -- Director's Investigation Request** in the Operations Floor tray lists several service numbers. The header carries the one that matters, and the margin note says what everyone uses it for. The safe is the Director's, so it wants the Director's own number, not a suspect's. A suspect's number is the common wrong answer.

Inside the safe are the **Interrogation Suite Code Card** and sealed files on each of the three suspects. The card carries the code for the keypad. The pick kit cannot open a PIN lock, so there is no skipping this.

If the Director already named the leak on the evidence, he has given you the code aloud, and **[The suite code again, sir?]** repeats it. You do not need the safe for that.

**Learn it:** ==action: Read the margin note on the printout aloud== and ask who it blames. Then ask why a policy that tells people to choose their own code ends in this.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Personnel Print Job on the Operations Floor==.
2. \==action: Enter the Director's service number on the Director's Safe== in his office.
3. \==action: Read the Interrogation Suite Code Card==.
4. \==action: Go to the Crypto Lab, then south, and enter the code on the Interrogation Suite keypad==.

</details>

> Warning: A suspect's number fails. If the safe stays shut, check which person asked for the printout.

### The Confrontation {#hints-finale}

**Where:** the Interrogation Suite, south of the Crypto Lab. **Goal:** face the leak. The confrontation opens when you have named the leak on the evidence and all the server evidence has come through the Evidence Relay Terminal. What you choose is your decision; no ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: You can open the suite door before the evidence is in. The room is empty then, and the wall reads "Awaiting evidence". Come back when HaX tells you the chain is complete.

<details markdown="1">
<summary>Nudge: before you go in</summary>

The more you have read, the more you can put to the person at the table. The sealed files in the Director's safe, the contents of the lockers, the Global Threat Database Catalogue in the archives and the print from the USB stick (see **Optional Side Content**) each give you something to say. You can read the Evidence Display on the wall first, or go straight in.

HaX's **[Why isn't he in the interrogation room yet?]** option explains why the room is empty if you are early.

</details>

<details markdown="1">
<summary>Nudge: the conversation</summary>

The scene cannot be closed once it starts. A RECORDING lamp over the door lights for the scene. You can ask the questions in any order. At the end you choose what happens to the leak. The Detention Disposition Screen on the wall only shows the result.

</details>

<details markdown="1">
<summary>Spoiler: the decisions that shape the ending</summary>

Several decisions run through the mission and show up in the ending:

- **Who you accused, and when.** Accusing a suspect aloud, the wrong one or the right one, is recorded. So are apologies. Both appear in the debrief and credits.
- **Force.** You can knock out colleagues and bystanders. The game records it, and the debrief and credits reflect it.
- **The fate.** You can have the leak detained and handed to the police with the case file, or keep them in place as a controlled asset on the Director's signature. They lead to different futures. Neither is scored as right or wrong.
- **The debrief.** The Director asks about the warning he sealed a year ago. You can say he is not the one at fault, or press him to own the gap. Neither is scored as right or wrong.

</details>

> Warning: The confrontation has no close button. If you want to read anything else first, do it before you walk in.

### The Debrief {#hints-debrief}

**Where:** the main lobby, after the confrontation. **Goal:** report to the Director.

> Hint: Once you have decided, the Director is waiting. The debrief opens straight away.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Finish anything you still want to read==.
2. \==action: Talk to the Director when the debrief opens== and answer his questions.
3. \==action: Watch the credits==, which list what you did and what you left.

</details>

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The Director says "Not yet. Talk to all three first." | You have not seen all three suspects yet; he names the ones you have not |
| "The cloner did not get a clean read." | You closed the cloner before pressing Save; choose the clone option again |
| The Server Room reader refuses | Open the cloner at the reader, choose **Director Netherton Keycard** from **Saved**, and emulate it |
| The Director says "Doors keep their own records. Bring me the door's." | You have not read the Badge Audit Printout yet |
| The Director says "You've brought me a door. Bring me a clock." | You need the minute the plan was opened; read the Leak Timeline in the Break Room |
| The Director says "take it to the men who went through that lab door" | You need one of the two people on the lab door to confirm their own row |
| The Director corrects your answer with a line like "Read the door against the minute, not the man." | One of the four answers is wrong; go back to the audit and use "Let me read it again" |
| The Security Archives door rejects the password | The password is case-sensitive with no spaces; it is on the sticky note in the Break Room |
| The Visitor Badge Printer rejects the PIN | It is a four-digit facilities PIN, from the sticky note, and is not the safe's code |
| The Director's Safe stays shut | The safe wants the Director's own service number, not a suspect's |
| The Interrogation Suite keypad refuses and no pick option appears | It is a PIN lock; the code comes from the safe's card or from the Director |
| The pick stops and the Off-Duty Agent says "Oi. That's not yours." | He saw you; word will get round. Use a suspect's key next time |
| CyberChef output is gibberish after one operation | It is layered; undo the outer layer first, then decode again |
| The stick's file reads "0 bytes. Last written: tonight." | The file was wiped after the floor heard you were looking; the print on the casing is still there |
| The Interrogation Suite is empty and the wall reads "Awaiting evidence" | You have not yet named the leak, or the server evidence is not all in |
| Nightshade's Workstation reads "SESSION LOCKED" | It is scenery; it opens nothing |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>The fingerprint on the USB stick</summary>

The stick carries a clean thumbprint on its dark glossy casing, and the Fingerprint Kit in your start kit can lift it. With the stick in your inventory, click it: a dusting panel opens first, and "Use normally" reads the file instead. Dust the print, lift it and compare it against the candidates. The comparison narrows by pattern, so you may need to work it out. If the print matches the owner of the locker, nobody planted the file, and the game says so in the confrontation and the credits. A lift that does not match is not wasted: HaX comments on any print.

</details>

<details markdown="1">
<summary>Phantom's notebook and the tactical board</summary>

In Intelligence Analysis, the **Four-Site Night Tactical Board** shows the night of the four attacks, and **Phantom's Off-Book Notes** show how he has been hunting the leak on his own. The notebook is where a terminal in the Crypto Lab is first mentioned. It also says what kind of person he thinks the leak is.

</details>

<details markdown="1">
<summary>The archive's other documents</summary>

The **Past Leak Investigations** file lists earlier leaks, all accidents or outsiders. The **Global Threat Database Catalogue** explains what ENTROPY was really after on the four-site night. Both are short, and the second changes how the debrief reads.

</details>

<details markdown="1">
<summary>The sealed files in the Director's safe</summary>

Three sealed files sit in the safe, one on each suspect, each stopped by an order with the Director's initials on it. Reading them tells you what SAFETYNET knew about each of the three and what it chose to do about it. They also give you something to put to the person at the table.

</details>

<details markdown="1">
<summary>HaX in person</summary>

Agent HaX is in the Break Room as well as on your phone. She talks differently when she is not on the wire. It is an optional conversation, and it shifts how the ending lands.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise the decoding and the log-reading techniques with your own data, not anything from the game. Use any current Linux distribution with `base64`, `tr` and `awk` available.

### Encoding and layering {#cli-encoding}

\==action: Encode and decode Base64 and ROT13, then wrap one in the other==:

```bash
printf 'Lantern' | base64
printf 'TGFudGVybg==' | base64 -d; echo
printf 'Night shift' | tr 'A-Za-z' 'N-ZA-Mn-za-m'; echo
printf 'Avtug fuvsg' | tr 'A-Za-z' 'N-ZA-Mn-za-m'; echo
printf 'Door first' | base64 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'ET9ipvOznKWmqN==' | tr 'A-Za-z' 'N-ZA-Mn-za-m' | base64 -d; echo
```

> Question: In the last line, what happens if you swap the two steps and run `base64 -d` first? What does that tell you about undoing layers in the right order?

### Reading a door log {#cli-audit}

\==action: Write a made-up door log to a file, then ask which badges were inside at a given minute==:

```bash
cat > audit.txt <<'EOF'
09:05 IN 0x51
09:40 OUT 0x51
13:48 IN 0x2A
14:02 IN 0x37
14:14 OUT 0x37
15:02 OUT 0x2A
EOF
awk -v t=14:20 '$1<=t { if ($2=="IN") inside[$3]=$1; else delete inside[$3] } END { for (p in inside) print p, "since", inside[p] }' audit.txt
```

The `awk` line walks the rows in order, adds a badge on IN and removes it on OUT, and prints who is left at the time `t`. It reports `0x2A since 13:48`. \==action: Change `t` to `14:08`== and see who else appears. Then ==action: edit the file== so a badge has no OUT row and see what the command does.

> Question: The command works because the times are written as HH:MM, so they sort correctly as text. What would break if a log used 12-hour times with am and pm?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: your choices and your ending may differ from a classmate's.

### 1. The Insider and the Evidence {#q-insider}

> Question: You named the leak from a door audit, not from a confession or a login. Explain, in your own words, why the door log narrowed the field but a court would still want a second source. What was the second source in your run?

> Question: The Director asked you to take the audit to the people on it before he would hear a name. What does that step protect against, and what could go wrong if the person confirming their row has something to hide?

> Question: Phantom ran the query and printed the audit, and his own row cleared him. Why does that make the printout both more useful and more suspect? What did you do about it?

> Action: Write a six-row door log for an imaginary office and a minute at which something happened. Include one person who came in before the minute and left before it, and one who was inside throughout. Swap with a classmate and write down who was inside at the minute and which rows told you.

### 2. Physical Access and Authentication {#q-access}

> Question: The Director's card had custom keys and was still cloned in half a minute while he looked out of a window. What would actually have protected it, and what does that say about relying on the card alone?

> Question: The Archives password, the badge printer PIN and the Director's safe code were all easier to find than they should have been. For each, say what went wrong and what the smallest fix would be.

> Question: The Off-Duty Agent could see all three lockers, and being caught picking one cost you. What does that say about a quiet bypass compared with a noisy one?

> Action: Write a half-page access-control review for the Citadel, covering card technology, visitor badges, shared secrets and one control that would catch a cloned card being used. Map each point to something you did in the game.

### 3. Encoding Versus Encryption {#q-encoding}

> Question: The mail on the stick was wrapped in two encodings, neither of which needed a key. Explain, to a non-technical colleague, the difference between hiding data and protecting it.

> Question: How did you know the stick's text was layered, and how did you work out which layer to undo first?

> Action: Take a sentence of your own. Base64 it, then ROT13 the result. Swap with a classmate and race to recover each other's sentence. Note which clue told you the order to undo them in.

### 4. The Server and the Evidence {#q-server}

These questions are about the work you did in the server room. The steps are in the companion sheet; the questions here do not need them.

> Question: You pulled evidence from a server that could only be reached from inside a badged room. Why does an "internal only" system still need maintenance and care when the threat is an insider?

> Question: The server's logs tied an account to a terminal and a time, and the door audit tied a person to a room and a time. Why did the case need both, and what could each not prove on its own?

> Question: Walk through the pieces of server evidence you submitted at the Evidence Relay Terminal. For each, say what it told you and what a defender could have changed to stop it being available.

> Action: Write a one-page insider-threat control plan for a small organisation, covering monitoring, access, secret handling and how a suspect is investigated without tipping them off. Map each point to something you saw in the Citadel.

### 5. People, Evidence and Choices {#q-choices}

> Question: Did you accuse anyone aloud before you had the evidence? What did it cost, and would you do it differently on a second run?

> Question: The Director sealed a warning about the leak a year ago and told himself it was prudence. What did you tell him in the debrief, and what did you know when you decided?

> Question: You chose what happened to the leak. What did you weigh, and what did you not know that you would have wanted to?

> Question: The Director sealed, deferred or held a file on each of the three suspects. What does that pattern say about how a leak can hide inside an organisation that is good at security?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guide handed out for the decoding stage, published online: [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/).
- Two guides for techniques this mission uses that the game does not hand out: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m08-the-mole-vm-technical-steps/) sheet, for the work in the server room.
- The CyberChef documentation and wiki, and its Magic operation for recognising unknown encodings.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Adversarial Behaviours, Forensics, Authentication, Authorisation and Accountability, and Cryptography.
