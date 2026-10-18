---
title: "Insider Trading (Break Escape Mission 5)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based investigation to learn how an insider threat is found and proved: clone a staff badge, talk a password out of an administrator, read a badge log, lift a fingerprint, pick a briefcase, and weigh the choices that come with catching someone who was pushed into it."
overview: |
  Most intruders have to break in. An insider is already inside, trusted, with a badge that opens the doors. Catching one is detective work: odd hours, access a little too broad, a person whose behaviour stopped matching their story. Insider Trading puts that whole investigation into one mission.

  You play a SAFETYNET agent sent into Quantum Dynamics Corporation, a Home Office contractor near Cambridge that is building quantum-safe key material for the national emergency-services dispatch network. Someone inside is stealing it for ENTROPY, and the final upload is only hours away. Your handler, Agent HaX, guides you by phone, and the company's Chief Security Officer, Patricia Morgan, is your contact on site. You clone a badge, talk your way past a password, read a log of who walked where, lift a fingerprint, and decide how to name the insider and what happens to them.

  This sheet gets you started, explains the ideas behind each lock with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to full steps. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get them. The server work has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["insider-threat", "social-engineering", "rfid", "badge-cloning", "biometrics", "fingerprints", "lockpicking", "access-logs", "authentication", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m05_insider_trading/labsheet.md"
cybok:
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["physical access and secure deletion", "authentication and identification"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication", "facets of authentication", "BIOMETRICS", "SMART CARDS"]
  - ka: "AB"
    topic: "Characterisation of Adversaries"
    keywords: ["THE INSIDER THREAT", "interpersonal crimes", "SOCIAL ENGINEERING"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- describe the warning signs of an insider threat, and explain why access logs, personal pressure and a motive each prove less alone than together
- explain how a proximity badge is read and copied, and why a card that anyone can read from an arm's length away is a key you have handed out
- read a badge log, match each swipe to the person behind it, and tell a pattern from a coincidence
- explain how a shared or posted password, and a helpful administrator, undo a locked door
- say how a fingerprint reader works, why a lifted print can fool it, and why a biometric cannot be changed after it leaks
- weigh up the choices a case like this forces, about the people you meet, the evidence you hold and what happens to the person you catch

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short badge-log warm-up. It takes a few minutes and saves you far more later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and the full steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each: a lock you open on the first hint teaches you more than one you open on the last.
4. After the game, work through **After the Game: Questions and Exercises**.

The server work, once you reach the server room, is in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m05-insider-trading-vm-technical-steps/), so you can play the rest of the mission without it.

> Note: Some values are generated for your game, and the server side is not the same as anyone else's, so this sheet never gives you one, only the way to find it. The things you find in the building are the same each game, but you still work them out from clues; this sheet says where each clue is and what shape the answer takes, not what it reads.

## Getting Started {#getting-started}

You are a SAFETYNET field agent, working as a security consultant at Quantum Dynamics Corporation (QDC). The firm builds quantum-safe key material for the National Emergency-Services Dispatch Network, the system that routes 999 calls. SAFETYNET believes an employee has been staging that material for ENTROPY's Insider Threat Initiative. The final upload is due tonight. Agent HaX runs you by phone; Patricia Morgan, QDC's Chief Security Officer, knows you are there and wants the insider found, though her own investigation was shut down from above.

You do not need any prior knowledge before you start. The field guides teach each idea as you reach it.

1. \==action: Start the Break Escape mission **Insider Trading**==.
2. \==action: Watch the briefing from Director Netherton, Agent Nightshade and Agent HaX==, and ask any topics you want. Then choose how you want to play it.
3. \==action: Go east from the reception lobby into Patricia Morgan's office and talk to her==. She gives you a visitor badge.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

The mission takes about 75 to 90 minutes. In a 60-minute class, stop once you have searched the suspect's office (around the halfway mark), and resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents you pick up or are handed open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX), a **Lock Pick Kit**, an **RFID Cloner** and a **Fingerprint Kit**. There is no PIN cracker this time.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual topics, such as **[Where do I stand?]**, which is always there and gives a read of where you are, and ones that appear when you are in the right situation.
- Field guides, the in-universe lab sheets. When you meet the challenge a guide covers, HaX mentions it in a message. Choose **[Send me a field guide.]** and pick the one you want. The exact options are listed in the stages below.
- Patricia's mobile, once your first conversation with her closes. She can be rung from your phone from then on.

The map is a single office block. From the reception lobby, Patricia's office is east and the main corridor is north. The corridor leads west to the break room, east to the server hallway, and north to the open-plan office. Off the open-plan office are the research lab (west) and the suspect's office (north). Past the server hallway is the server room, and past that, the key vault.

> Tip: Conversations carry the game. When a lock needs a person's help, such as a password or a spare card, the option to ask usually appears only after you have seen the lock or have something to say. If a menu looks thin, go and look at the problem first, then come back.

> Tip: The cursor can turn into a fist if you have been fighting. Press Q until the open hand shows again, or clicks on documents and terminals will do nothing.

> Warning: Not every character is a suspect. Knocking people out, or accusing someone the evidence does not support, is recorded and shows up in the debrief and the credits.

### Warm-up: Your First Badge Log {#warm-up}

You will read a real badge log in the game. Practise on a made-up one first. This one is from an imaginary building and has nothing to do with QDC.

```
Mon 02  21:14  Main entrance   #3301 K. VOSS
Mon 02  21:17  Annex corridor  #3377 W. IYER (spare)
Tue 03  18:05  Main entrance   #3315 L. BRAND
Tue 03  18:10  Annex corridor  #3315 L. BRAND
Thu 05  22:40  Main entrance   #3301 K. VOSS
Thu 05  22:43  Annex corridor  #3377 W. IYER (spare)
Sat 07  23:02  Main entrance   #3301 K. VOSS
Sat 07  23:05  Annex corridor  #3377 W. IYER (spare)
```

1. \==action: Read down the badge numbers==. Badge `#3377` is a spare, and it appears three times, always in the annex.
2. \==action: Look at what comes just before each `#3377` swipe==. On Monday, Thursday and Saturday, badge `#3301` came in through the main entrance first.
3. \==action: Work out the gap between the two swipes on each of those nights==. It is 3 minutes every time: 21:14 to 21:17, 22:40 to 22:43, 23:02 to 23:05.
4. \==action: Compare Tuesday==. Badge `#3315` entered at 18:05 and reached the annex at 18:10, 5 minutes later, using the same badge both times. That is one person walking in and going on, not a second badge following behind.

A spare that keeps showing up a few minutes after the same person does, and always after hours, is a pattern. One matching night would be a coincidence. Three out of three is not.

> Question: The spare badge belongs to W. Iyer and appears in the annex. Does the log prove that Iyer used it? What else would you want to know before you accused anyone?

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### The Insider Threat {#insider}

An outsider has to get past the locks. An insider already has the keys. They may be a careless employee, or one who has been recruited, or one under pressure from debt, illness or a grudge. Because their access is legitimate, the technical alarms stay quiet. What gives them away is behaviour: hours that do not fit the job, access wider than the role needs, and a change in the person.

Recruiters know this and look for pressure. A person who is drowning in a bill they cannot pay is easier to approach than one who is not. In the mission you will see the leaflet and the notes ENTROPY's recruiters leave behind, and you will meet the people they work on.

A good investigation does not stop at suspicion. In the mission, Patricia will act on a name only when you can show two kinds of thing.

| What you need | What it answers | Examples in the mission |
| --- | --- | --- |
| A motive | Why would this person do it? | Personal circumstances, money, pressure, what the person wrote down |
| Proof of exfiltration | Did data actually leave, and whose hand was on it? | Records of what was staged and when the upload runs |

The reason is practical. A motive alone fits half the building. Proof of exfiltration without a motive fits whoever was nearest. You need both before you ruin someone's career.

> Question: The company's management told Patricia that the cryptography team's odd hours were "authorised". Why is "authorised by someone senior" a poor reason to stop looking at an access pattern?

### Badges, Cloning and Proximity Cards {#rfid}

A proximity badge is a small chip that answers a reader at short range. Many basic cards answer with the same fixed number every time, and nothing about the exchange proves the card is the real one. The reader hears a number it recognises and opens the door.

That makes the card easy to copy. A cloner held close to the badge reads that number, stores it, and can then play it back at a reader later. The owner feels nothing. At QDC, a staff member's badge on a lanyard is within reach of a cloner while they chat.

| What the card relies on | What it costs an attacker |
| --- | --- |
| A fixed number the card always sends | A short read at close range, then play it back |
| A secret key and a challenge-and-response | A much harder attack, which is why better cards are built this way |

In the mission you copy a staff badge to get through the server hallway. You will see the owner notice the beep from the cloner when it finishes. A real person might not notice, or might mention it later.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The badge-cloning guide.]** once HaX has offered it.

> Question: Why is a cloned card harder to detect than a stolen one? What single control would help a building notice when one card is used in two places?

### Passwords, Notices and Helpful People {#passwords}

A lock is only as strong as the easiest way around it. Two weak points show up at the server room.

The first is where the password lives. A password that changes every week still fails if it is printed on a sticky note, or if the notice beside the door says exactly who holds it. Writing down the route to the secret is almost as bad as writing down the secret.

The second is people. The administrator who holds the password wants to be helpful, but also wants to keep his job, so he will not hand it to anyone who asks. What moves him is a good reason: evidence that the request is legitimate, or the authority of someone whose job it is to approve it. This is social engineering. It works by giving a person a reason to say yes, not by tricking a lock.

| What you see | What it probably means | What to try |
| --- | --- | --- |
| A password lock with no hint of the code | Someone holds it | Find who, and what they would need to hear |
| A notice that says who to contact | The holder is named for you | Go and ask, and note what they refuse |
| A refusal | They need a reason, not a bigger demand | Come back with a log, or with authority |

> Question: Owen refuses to hand over the password at first, then agrees when you bring the right thing. From his point of view, what changed? What could he have done differently to stay safe while still helping?

### Fingerprints and Biometrics {#biometrics}

A fingerprint reader checks the ridge pattern of a finger against the prints enrolled. You do not have to be the person, only to present a good enough copy of their print. Anywhere someone has touched a smooth surface, such as a mug, a print is left behind. Dusting it brings the ridges up, and a lift copies them.

Two things follow. A print is only as good as the lift, so a poor or smudged one gives a partial read, and a cleaner lift of the same print is needed. And a biometric cannot be changed. You can reset a password after it leaks; you cannot give anyone new fingers. Owen makes that point when he mentions the key vault, and it is the reason a fingerprint should not be the only thing guarding something precious.

In the mission, the key vault reader is enrolled to two people, and you will need to work out which print you can actually get hold of.

> Question: Why is a fingerprint reader weaker than it looks when a person drinks from a mug every day? What second factor would you add to the vault?

### Lockpicking {#lockpicking}

A pin-tumbler lock has a row of spring-loaded pins of different heights. The right key lifts each pin to exactly the height where it clears the shear line, and the cylinder turns. A pick and a tension wrench do the same job one pin at a time: tension makes the pins bind in an order, and each pin you set stays set while you work on the next.

In the mission, a briefcase and a filing cabinet use pin-tumbler locks, and the Lock Pick Kit in your starting kit opens them. Both are easy locks. Patience beats speed.

To learn more in game, the lockpicking guide is offered the first time you try the cabinet or the briefcase. Open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**.

> Question: A lock on a briefcase will not stop a determined person. What is it for, and what does it tell you about the person who fitted it?

### Reading Logs and Evidence {#evidence}

Evidence is a set of facts, and each one proves something narrow. A badge log proves that a badge was used at a time. It does not prove who held the badge. A document proves what was written, not what was meant. An alibi, such as a boarding pass or a conference lanyard, proves where a person was.

Good reasoning combines them. The questions to ask of each piece are: what does this actually show, who else could it fit, and what would have to be true for the opposite explanation to work? A badge log that pairs one person's entrance with a second badge a few minutes later is strong, because it takes a coincidence three times over. A badge with an alibi is weak against that person.

> Question: The log shows a spare badge in the server hallway at night. Name two innocent explanations, and one thing in the building that would let you test each.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock or the person want: a card, a password, a reason, a fingerprint? And have I actually looked everywhere the last room offered?

### Before the First Lock: Patricia's Office {#hints-start}

**Where:** the reception lobby and Patricia's office (east). **Goal:** meet your contact and get a visitor badge.

> Hint: Your handler's briefing sends you to the person who wants this solved. She is east of the lobby, and she keeps her own records on her desk.

<details markdown="1">
<summary>Nudge</summary>

Talk to Patricia Morgan. She gives you a visitor badge and explains what Security has found. When the conversation closes she texts you her mobile number, and from then on you can ring her from your phone. Her desk holds the **Security Incident Log**. Read it. You will need what it says when you talk to the administrator, and it tells you the badge in question is always one of eight.

**Learn it:** ==action: Read the log's list of flagged activity== and ask yourself which entries say who did something and which only say when.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go east into Patricia's office and talk to her==.
2. \==action: Take the Visitor Badge==.
3. \==action: Click the Security Incident Log on her desk and read it==.
4. \==action: Wait for her text with her mobile number==.

</details>

### The Server Hallway Reader {#hints-hallway}

**Where:** the main corridor, east to the server hallway. **Clue:** the person with the lanyard in the open-plan office, north of the corridor. **Lock:** a staff badge reader. **Lock wants:** a staff badge.

> Hint: A visitor badge gets you through the front, not past a staff reader. Who in the building carries a staff badge, and what is in your kit for copying one?

<details markdown="1">
<summary>Nudge</summary>

Try the server-hallway door first. HaX will mention the cloning guide. The nearest staff badge is on Owen Gallagher's lanyard. He is the IT administrator in the open-plan office, north of the main corridor. Talk to him, and the option to lean over his log screen so your cloner reaches his lanyard appears. When the cloner finishes, he may notice the beep, and you can answer him however you like.

There is a second way in. Dr Ruth Halloran in the research lab (west of the open-plan office) can hand over her lab's visitor spare badge if you ask for the server hallway after getting to know her. If Owen has been knocked out, HaX relays a copy.

**Learn it:** ==action: Say out loud what the reader checks== before you copy anything. If it only checks a number, what does a copy of the number let you do?

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The badge-cloning guide.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Try the server-hallway door once with your visitor badge== so HaX offers the guide.
2. \==action: Talk to Owen Gallagher and choose the option that leans over his log screen==.
3. \==action: Let the RFID Cloner finish==.
4. \==action: Go back to the server-hallway door and use the cloned badge==.
5. \==action: Read the IT Notice: Server Room Access== taped by the server-room door.

</details>

> Warning: If you cancel the cloner, the option comes back the next time you talk to Owen.

### The Server-Room Password {#hints-password}

**Where:** the server-room door, north of the server hallway; Owen in the open-plan office. **Lock:** a password. **Lock wants:** the password, which someone else holds.

> Hint: The notice beside the door tells you who holds the password. He will say no the first time. Think about what would make you say yes in his place.

<details markdown="1">
<summary>Nudge</summary>

The **IT Notice: Server Room Access** by the door names who to contact. Ask Owen for the password. He refuses by default. Two things move him. One is evidence: the Security Incident Log you read in Patricia's office, which shows a cryptography badge in the server hallway at night that never went through him. The other is authority: ask Patricia, in person or by phone, for help with the server room (that option appears only after Owen has refused once), and then go back to Owen. When he agrees, he gives you a **Server Password Sticky Note**.

**Learn it:** ==action: Write down in one line why Owen said no first==. Then write the one thing in the incident log that changed his risk.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Try the server-room door once== so HaX knows you have seen it.
2. \==action: Talk to Owen and choose **[The server room wants a password.]**==. He refuses.
3. \==action: Either choose the option that quotes Patricia's log about the badge in the server hallway at 23:47==, or \==action: ask Patricia, in person or by phone, about the server room and return to Owen==.
4. \==action: Take the Server Password Sticky Note and read it==.
5. \==action: Type the password into the server-room door lock==.

</details>

> Warning: Passwords are case-sensitive and exact. Copy what the note says, with no extra spaces.

### The Server Room {#hints-server-room}

**Where:** the server room, north of the server hallway. **Goal:** get in and see what the room holds.

> Hint: This room is more than a place to pass through. It holds two terminals, and a door on the north wall that leads on to the key vault.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Enter the password at the server-room door==.
2. \==action: Walk in and look at the two terminals==.
3. \==action: Note the north door==, which leads to the key vault.

</details>

> Note: The server work has its own sheet, so you can play the rest spoiler-free and tackle the server yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m05-insider-trading-vm-technical-steps/) when you want the hints for it.

### Reading the Badge Log {#hints-badge-log}

**Where:** Owen, in the open-plan office, once you have read Patricia's log. **Clue:** the **Server Hallway Badge Log**. **Goal:** work out whose badge was in the server hallway.

> Hint: The incident log tells you a badge was there at night but not whose. Owen can print the swipes. When you have them, read the main-entrance lines as well as the hallway ones.

<details markdown="1">
<summary>Nudge</summary>

With Patricia's log read, ask Owen whose badge was in the server hallway at 23:47. He hands over the **Server Hallway Badge Log**. It lists badge numbers, names and times. Look for a badge that keeps appearing in the server hallway, and check who came in through the main entrance just before it each time. His pencilled note at the bottom is worth reading too.

**Learn it:** ==action: Copy the swipes onto a sheet of paper and work out the gap between each pair of swipes==, as you did in the warm-up. Does the gap change?

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Owen and choose **[Patricia's log has a crypto badge in the server hallway at 23:47. Whose?]**==.
2. \==action: Take the Server Hallway Badge Log and read it==.
3. \==action: List every server-hallway swipe and the main-entrance swipe before it==.

</details>

> Warning: One badge appearing is not the same as one person being there. The log shows a badge, and Owen's note says what kind of badge it is.

### Dr Halloran and Her Spare Badge {#hints-halloran}

**Where:** the research lab, west of the open-plan office. **Goal:** find out whether the spare badge's owner can explain the swipes.

> Hint: You now have a name on the badge. Before you act on it, ask her. And look at what is in the lab.

<details markdown="1">
<summary>Nudge</summary>

Ask Dr Halloran about her spare badge being in the server hallway at night. She gives an account of where she was, and says where the spare is kept and who works in her lab late. The **Conference Lanyard** on her monitor and the **Lab Rules** notice on the wall say the same thing in writing. Read both. Her vetting file from Patricia is deliberately untidy, so it does not clear her on its own. An alibi is the dates, set against the dates on the log.

**Learn it:** ==action: Put the dates on the lanyard next to the dates in the badge log== and see which swipes she could not have made.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Dr Halloran and choose **[Your spare badge has been through the server hallway at night. Four times.]**==.
2. \==action: Read the Conference Lanyard on her monitor==.
3. \==action: Read the Lab Rules notice by the door==.

</details>

> Warning: Do not accuse her to Patricia before you have looked at her alibi. A wrong accusation is recorded: she is suspended, the damage is felt by the company, and it shows in the debrief and the credits.

### Motive: Pressure and Money {#hints-motive}

**Where:** Patricia (vetting files), Lisa Park in the break room, the corridor noticeboard. **Goal:** find out who on the cryptography team is under pressure.

> Hint: A motive is a story about a person's life, not a fact about the building. Who is talking about who, and who is Patricia worried about?

<details markdown="1">
<summary>Nudge</summary>

Patricia holds vetting files on the cryptography team. Ask for them; the option appears once you have read the badge log, spoken to Dr Halloran, or already suspect someone. There are two files, and they are deliberately different. Lisa Park in the break room is chatty and notices who is not coping. The **Noticeboard Flyer** in the main corridor is about a collection for a colleague's family, and the **TalentStack Leaflet** behind the break-room coffee machine has handwriting on the back that you may recognise from elsewhere.

**Learn it:** ==action: Read the two vetting files side by side== and list, for each person, what has changed in their circumstances and whether they declared it.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Ask Patricia for the vetting files on the cryptography team==.
2. \==action: Read both files==.
3. \==action: Talk to Lisa Park in the break room and ask about the collection==.
4. \==action: Read the Noticeboard Flyer and the TalentStack Leaflet==.

</details>

### Putting a Name to It {#hints-naming}

**Where:** Patricia, in person or by phone; or HaX if Patricia is knocked out. **Goal:** name the insider with a reason.

> Hint: Patricia acts on a name only when you have shown her both a motive and proof that data was staged. A name with one of the two will not do. Ask yourself which of the two you are still missing.

<details markdown="1">
<summary>Nudge</summary>

Naming is a choice from a list of names. The list only offers names you have a reason for. After a name, Patricia asks why, and the reason menu is the real test. Some reasons are accepted because they follow from the log (who came in at the front door, and when), and some are refused because they fit anyone (a job title, a bad mood, "he is clever"). A wrong reason ends that conversation, but you can try again. If you do not yet have both halves, a partial naming still helps: it opens the next part of the case.

**Learn it:** ==action: Write your reason in a sentence== that someone who has never seen the log could check. If it needs the log to make sense, say which line.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Ring Patricia and choose **[I know who it is.]**==, or \==action: talk to her in person and choose **[I think I know who it is.]**==.
2. \==action: Pick a name from the list==.
3. \==action: Pick the reasons that follow from the evidence you hold==.

</details>

<details markdown="1">
<summary>Spoiler: who the log points at</summary>

The badge log pairs the cryptography lead's front-door swipe with the spare badge a few minutes later, every time. The spare is the research lab's, and its signed-out owner was abroad on the first night. The cryptography lead is David Torres. Whether you reach that by the log, or by the money, or by the notes, the game accepts it once you have a motive and proof of exfiltration to go with it.

</details>

> Warning: A wrong reason ends the call, and you can try again. Naming Dr Halloran without having checked her alibi has a recorded cost, so look at her alibi first.

### The Suspect's Office {#hints-office}

**Where:** the office north of the open-plan area. **Lock:** an RFID card reader. **Lock wants:** an office card.

> Hint: Searching someone's desk is Security's call, not yours. IT holds a spare card for every office. Who can tell the person who holds the spare to hand it over?

<details markdown="1">
<summary>Nudge</summary>

The option to ask for the office appears once your evidence points at one person. Ask Patricia first (in person or by phone), then Owen, who holds IT's spare. If Owen is knocked out, HaX pushes a copy once you suspect someone. Inside the office are a **Mug**, a locked **Torres' Briefcase**, and a desk. The briefcase is a pin-tumbler lock: use the Lock Pick Kit, and open the lockpicking guide from HaX if you have not used one before. Inside it are a **Personal Journal** and **Medical Bills**. They explain why.

**Learn it:** ==action: Read the Medical Bills and the journal together==, then say which is a fact and which is a feeling, and which one is more use to Patricia.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Ask Patricia for the office, then ask Owen for **[I need into David Torres' office.]**==.
2. \==action: Take the IT Spare Office Card==.
3. \==action: Use the card at the office door==.
4. \==action: Pick Torres' Briefcase with the Lock Pick Kit==.
5. \==action: Read the Personal Journal and the Medical Bills==.

</details>

> Tip: In a 60-minute class, a natural stopping point is here, once the suspect's office is searched and you hold the motive. The key vault and the confrontation are a tidy session on their own.

### The Mug and the Key Vault {#hints-vault}

**Where:** the Mug in the suspect's office, then the key vault north of the server room. **Lock:** a fingerprint reader. **Lock wants:** an enrolled print.

> Hint: The vault reader is enrolled to two people. You can only lift one print in this building. Where does that person leave their fingers?

<details markdown="1">
<summary>Nudge</summary>

The Mug on the desk has a thumbprint on the glaze. Use the Fingerprint Kit to dust and lift it. Compare it against the reference prints in the dusting panel, and HaX will tell you whose print it is. Take the lift to the key vault reader, north of the server room. The sign says "Heisenberg Leads Only". A cold, smudged lift gives a partial read; the reader tells you what percentage it needs and suggests a cleaner lift of the same print. Owen also warns you that a thumb cannot be changed, which is the point of the earlier concept.

**Learn it:** ==action: Say in one sentence why the reader accepts a copy==. What is it actually checking?

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Use the Fingerprint Kit on the Mug in the suspect's office==.
2. \==action: Lift the print and match it against the references==.
3. \==action: Go to the server room, then north to the key vault door==.
4. \==action: Present the lift at the reader==.

</details>

> Warning: A "Partial read" means the lift is too faint, not the wrong person. A "No match" means you lifted someone else's print. Dust again with a lighter touch.

### Inside the Key Vault {#hints-vault-inside}

**Where:** the key vault. **Clues:** the **Upload Schedule**, the **Data Package Manifest**, the **Sealed TalentStack Envelope** and the **Exfiltration Upload Terminal**. **Goal:** find proof of what is leaving and when.

> Hint: The vault is the last place the data passes through. Look at every document on the desk and the terminal. They say when, what and who.

<details markdown="1">
<summary>Nudge</summary>

The **Upload Schedule** gives the window for tonight's upload and who is operating it. The **Data Package Manifest** says what is being staged and which badge is staging it. The **Sealed TalentStack Envelope** under the keyboard is the part nobody asked you to look for. The terminal's `transfer_queue.log` shows how far the upload has got. Reading these gives you the proof of exfiltration that Patricia needs, if you have not already got it from the server.

**Learn it:** ==action: Compare the badge number on the manifest with the badge numbers in the log you read earlier==.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Upload Schedule==.
2. \==action: Read the Data Package Manifest==.
3. \==action: Read the Sealed TalentStack Envelope==.
4. \==action: Open the Exfiltration Upload Terminal and read transfer_queue.log==.

</details>

### The Recruiter {#hints-recruiter}

**Where:** your phone, after you have named the insider. **Goal:** decide whether to hear her out.

> Hint: Once the insider is named, someone else gets in touch. HaX tells you what to expect. What you say to her, or whether you ring her back, is yours to decide.

<details markdown="1">
<summary>Nudge</summary>

When your naming conversation closes, the Recruiter texts you. You can ring the number back from the phone and she makes you an offer, or you can ignore the text. If you confront the insider first and ring her afterwards, she no longer makes an offer. There is no right answer here. The game records what you do, and the credits reflect it.

</details>

### The Confrontation {#hints-confrontation}

**Where:** the key vault, at the Exfiltration Upload Terminal. **Goal:** decide what happens to the insider and stop the upload. What you choose is your decision; no ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: You have a motive, proof of what was staged, and the person's own words. What each choice costs, and who it protects, is what you decide on.

<details markdown="1">
<summary>Nudge: what the options are</summary>

Once the insider is named, they appear at the upload terminal. When you speak to them, the conversation offers several approaches: bring them in as a cooperating source, hand them to the police, expose the programme publicly, or fight. Some choices need evidence you have collected, and the menu shows only those you can support. After a knockout you get a further decision. The upload itself is stopped by a choice you make, such as pulling the drive or having them cancel it.

**Learn it:** ==action: Before you choose, write down what you know about the person== from the journal, the bills and the log, and what each approach would do to those facts.

</details>

<details markdown="1">
<summary>Nudge: if the fight goes badly</summary>

The insider is a scientist, not a fighter, but you can still lose. Ask HaX to send Security from the phone's hub if you cannot win the fight. Press Q to put your fists down afterwards, so your clicks open documents again.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Several decisions run through the night and show up in the ending:

- **The insider.** A man under real pressure, with a child and a spouse in treatment. The Recruiter's argument is that he chose, and that he is one of many. Hold him, turn him, expose him or fight him; the credits record the outcome.
- **Dr Halloran.** Accusing her wrongly costs her and the company. The debrief says so.
- **The administrator.** You cloned a colleague's badge, and he may notice. What you say to him is up to you.
- **The CEO's email.** Patricia kept a copy of the order that stopped her investigation. Whether you have read it changes a line in the debrief.
- **The deal.** The Recruiter offers one. Taking it or refusing it changes who is warned.

None of these is scored as right or wrong by the game; they change who is safe at the end and what SAFETYNET walks away with.

</details>

### Sweeping the Vault and Calling HaX {#hints-finish}

**Where:** the key vault, then your phone. **Goal:** finish reading, then call HaX.

> Hint: Whatever you have not read in the vault is still there. When you are ready to leave, HaX is the way out.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Finish reading anything left in the vault== (the schedule, the manifest, the envelope).
2. \==action: Ring Agent HaX and choose **[I'm done here. Bring me in.]**==. He names anything you have not read.
3. \==action: Choose **[Bring me in.]**== when you are ready.

</details>

> Warning: The debrief waits until the server work is finished. If HaX says there is still something to do, the companion sheet has the hints.

## What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The server-hallway reader refuses your visitor badge | It wants a staff badge; clone Owen's, or ask Dr Halloran for her lab's spare |
| "The cloner didn't get a clean read" | The read failed or you cancelled; talk to Owen again and the option returns |
| Owen refuses the password | You have not given him a reason; bring Patricia's log or Patricia's authority |
| The ask for Patricia's help with the server room is missing | Owen has not refused you yet; ask him first |
| No option to ask for the suspect's office | The evidence does not yet point at one person; read the log, the files or the bills |
| "Partial read" at the vault | Your lift is too faint; dust the mug again with a lighter touch |
| "No match" at the vault | You lifted someone else's print; match the lift against the references |
| Patricia refuses a name | You do not have both a motive and proof of exfiltration, or your reason does not follow from the evidence |
| The naming call ends after a reason | The reason fits anyone; try again with one that follows from the log |
| Documents and terminals do nothing when clicked | Your fists are up; press Q until the open hand shows |
| The debrief does not open | The server work is not finished, or you have not called HaX to bring you in |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>Patricia's filing cabinet and the CEO's email</summary>

A locked pin-tumbler filing cabinet behind Patricia's desk holds a printed email from the CEO's office telling her to stand down her investigation. You can pick the cabinet, or ask Patricia how far her own investigation got and then ask to see the email. Either way you hold a copy. The debrief and the credits reflect whether you did.

</details>

<details markdown="1">
<summary>Lisa Park and the collection tin</summary>

Lisa Park in the break room organises a collection for a colleague's family. She tells you who the tin is for if you ask, and how the office has been. She is optional, and her interview shows the insider as a person rather than a name.

</details>

<details markdown="1">
<summary>The Building Directory and the TalentStack Leaflet</summary>

The **Building Directory** in the lobby lists the staff and the cryptography division in full. The **TalentStack Leaflet** in the break room is a recruiter's pitch with a note on the back. Together they show how ENTROPY chooses who to approach.

</details>

<details markdown="1">
<summary>The Sealed TalentStack Envelope</summary>

The envelope in the key vault holds a spreadsheet of forty-seven people, with a column for the pressure each one is under. It shows that the insider was not the only target.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise reading a badge log with your own data, not anything from the game. Use any current Linux distribution with `grep`, `sort` and `awk` available. Make a file called `swipes.txt` and put the made-up log from the warm-up in it, or write your own.

### Finding the pattern {#cli-pattern}

\==action: Count how often the spare badge appears, and list its swipes==:

```bash
grep -c '(spare)' swipes.txt
grep '(spare)' swipes.txt | cut -d'#' -f2 | sort | uniq -c
grep '#3301' swipes.txt
```

> Question: With the warm-up log, what does the second command show, and why is a count more useful than reading the lines by eye on a log with a thousand rows?

### Measuring the gap {#cli-gap}

\==action: Work out the minutes between each main-entrance swipe and the swipe after it==:

```bash
awk '/Main entrance/{split($3,a,":"); t=a[1]*60+a[2]; d=$1" "$2} /Annex corridor/{split($3,b,":"); print d, (b[1]*60+b[2])-t, "minutes"}' swipes.txt
```

> Question: The Tuesday line gives a different gap from the others. Why does the same command tell you that row is a different kind of thing, and what would you check next?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: your choices and your ending may differ from a classmate's.

### 1. Insiders, Pressure and Evidence {#q-insider}

> Question: What were the first signs that someone inside the company was involved? Which of them were things a technical control could have caught, and which only a person who knew the staff could have?

> Question: Patricia was told her investigation was "authorised activity" and shut down. What organisational failure does that show, and what would you change so that a security officer's concern could not be overruled quietly?

> Question: You needed both a motive and proof of exfiltration before Patricia would act. Describe a case where only one of them would have led you to the wrong person.

> Action: Write a one-page insider-threat checklist for a small company, with three technical signals and three behavioural ones. For each, say who would notice it and what they should do.

### 2. Physical Access, Badges and Biometrics {#q-access}

> Question: You cloned a staff badge during a friendly chat, and you lifted a print from a mug. What would have protected each, and what does that say about relying on one factor alone?

> Question: Owen gave up the password after evidence and after authority. Which of those two would you want in a real company's policy, and why?

> Action: Write a half-page access-control review for a small office, covering badge technology, visitors, password handling and one control that would catch a cloned card or a copied print being used. Map each point to something you did in the game.

### 3. Digital and Physical Evidence Together {#q-evidence}

> Question: The case rested on evidence from the building (logs, documents, fingerprints) and evidence recovered from the research server. Which did you find more convincing, and why? Could either have stood alone?

> Question: What could the company have logged, monitored or restricted on its research systems that would have shown the staging earlier? Which of those controls depends on people looking at the logs?

> Question: A badge log, a document and a server record can each be wrong or misread. Choose one from your run and say how you would corroborate it before acting on it.

### 4. People, Evidence and Choices {#q-choices}

> Question: What did you decide to do about the insider, and what did you know when you decided? Would you choose differently on a second run?

> Question: The Recruiter argued that the insider made an informed choice, and that others in her pipeline would follow. Did that change how you thought about the person in front of you? Why or why not?

> Question: If you accused anyone the evidence did not support, or knocked anyone out, what did the game record, and what did it cost? What does that say about real investigations?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m05-insider-trading-vm-technical-steps/) sheet, for the server work.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Adversarial Behaviours, on Authentication, Authorisation and Accountability, and on Physical Layer and Telecommunications Security.
- National Protective Security Authority (NPSA) guidance on insider risk, and CERT Insider Threat Center material on the signs and patterns of insider incidents.
