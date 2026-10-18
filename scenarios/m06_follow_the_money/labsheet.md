---
title: "Follow the Money (Break Escape Mission 6)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based infiltration mission to learn how investigators follow cryptocurrency through a mixer: talk past a checkpoint guard on a cover story, pick a lock, clone an RFID badge, work out a predictable door passphrase, lift a fingerprint, and match deposits to cold-storage credits to find the wallet that funds every ENTROPY cell."
overview: |
  Criminal money leaves a trail, but the trail has gaps. A public blockchain shows a ransom going into an exchange and nothing about where it comes out. The exchange's own records close the gap, and getting to those records means getting past the people and the doors that guard them. Follow the Money puts both halves into one mission.

  You play a SAFETYNET agent who walks into HashChain Exchange as a visiting Financial Conduct Authority (FCA) supervisor. HashChain is the bank for every ENTROPY cell you have met so far. Your handler, Agent HaX, wants to know where the ransom and espionage payments from earlier missions ended up. You talk past a guard, win over the exchange's CTO Dr Irina Volkova, work out a door passphrase from a noticeboard and a wordlist, read an analyst's write-up, and then use the exchange's own settlement records to find the one cold-storage wallet that every cell draws on. Two decisions at the end are yours: what happens to the money, and what happens to Dr Volkova.

  This sheet gets you started, explains the ideas behind each in-game lock and puzzle with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to full steps. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get them. The work on the exchange's servers has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["rfid", "cloning", "lockpicking", "physical-security", "social-engineering", "passphrases", "fingerprints", "cryptocurrency", "blockchain", "mixers", "financial-forensics", "money-laundering", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m06_follow_the_money/labsheet.md"
cybok:
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication", "Smart cards", "Biometrics", "Personal identification number and memorable information"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["Physical access", "Authentication and identification"]
  - ka: "AC"
    topic: "Key Management"
    keywords: ["Key storage", "Cryptocurrency", "Blockchain"]
  - ka: "AB"
    topic: "Models"
    keywords: ["Flow of capital", "Money laundering"]
  - ka: "AB"
    topic: "Characterisation of Adversaries"
    keywords: ["Cyber-dependent organised crime", "Social engineering"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- talk past a guard on a cover story, and pick a lock only when the guard cannot see you
- explain how an RFID badge is copied from across a desk, and what a defender can do about it
- explain why a passphrase built from a house convention (a word plus a year) is weak, even when each part looks harmless
- follow money through a mixer by matching deposits to credits using the fee and the minimum hold time
- say how a fingerprint left on glass can open a biometric lock
- weigh up the choices the case forces, about the money, the people you meet and the evidence you hold

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short warm-up. It takes a few minutes and saves you far more later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and a full set of steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The server work (the backend terminal in the server room) is in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m06-follow-the-money-vm-technical-steps/), so you can play the rest without it.

> Note: The server work is generated for your game, so this sheet never gives you a value from it. The door passphrase, the PINs and the custody slot are the same every game, but each one is something you work out from clues in the building. This sheet says where each clue is and what shape the answer takes, never what it reads.

## Getting Started {#getting-started}

You are a SAFETYNET field agent. HashChain Exchange calls itself a trading platform. In practice it is the bank for ENTROPY: a mixer takes Bitcoin in, runs it through Monero and pays it out into the exchange's own cold wallets, and the public trail stops there. Your cover is a visiting supervisor from the Financial Conduct Authority on a routine visit. The cover gets you through the door. It does not survive a phone call to the real FCA, so the game tracks whether you give anyone a reason to make one. Agent HaX runs you by phone.

You do not need any prior knowledge before you start. The field guides teach each idea as you reach it.

1. \==action: Start the Break Escape mission **Follow the Money**==.
2. \==action: Watch the briefing from Agent HaX== in the reception lobby, and ask any topics you want. Then choose how you want to play it.
3. \==action: Walk north to the security checkpoint== and meet the Checkpoint Guard.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

Plan on a full session. For a 60-minute class, stop once you are through the server room door and have read the analyst's write-up in the Blockchain Analysis Lab, then pick up again next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents and field guides you are handed open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX), a **Lock Pick Kit**, an **RFID Cloner** and a **Fingerprint Kit**. There is no PIN cracker this time.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[Where do I start on the money trail?]**, **[Any tips on their passwords?]**, **[How do I play Volkova?]** and, later, **[Which cold slot is the fund?]**. There is always **[Remind me where we are.]** for a read of where you are.
- Field guides, the in-universe lab sheets. Choose **[Send me a field guide.]** and pick the one you want. A guide appears on that menu only once you have met the thing it covers. For this sheet the useful ones are **[Lockpicking.]** and **[RFID cloning.]**.

> Tip: Each lock in this mission wants a different kind of answer. The trading-floor door is a key lock, so you pick it or talk your way past. The server room door is a typed passphrase. The data centre door is a four-digit PIN. Irina's office and the executive wing are RFID readers. Check what a lock wants before you hunt for the answer.

> Tip: A password or PIN lock compares exactly what you type. Case matters and so do spaces. Copy values from a document rather than retyping them from memory.

> Warning: Your cover can be strained for the rest of the night. A guard who sees your picks, a staff member you knock out, a bad first impression with Dr Volkova and a second wrong slot at the custody console all do it. A strained cover is never a fail state, but doors that opened with a word stop opening with a word, and the debrief records it.

### Warm-up: Your First Mixer Match {#warm-up}

Do this before you reach the data centre. It uses made-up numbers, not anything from the game, and you can check it with a calculator or a shell.

A made-up mixer called Pool X takes a **2% fee** on every output and holds every coin for at least **4 hours**. Someone deposits **$500,000 at 10:00**. Four credits appear in the pool's settlement ledger:

```
slot  time   credit
A     11:30  $490,000
B     15:10  $500,000
C     14:20  $490,000
D     14:45  $245,000
```

1. \==action: Work out the expected credit==: $500,000 less 2% is $490,000.
2. \==action: Work out the earliest time==: 10:00 plus 4 hours is 14:00.
3. \==action: Cross out each credit that fails==. Slot A has the right amount but arrived at 11:30, before the hold ended. Slot B has no fee taken. Slot D is the wrong amount. Slot C is the match.

Check it in a shell:

```bash
awk 'BEGIN{printf "%.0f\n", 500000*(1-2/100)}'
date -u -d '2031-03-04 10:00 UTC + 4 hours' '+%H:%M'
```

The first line prints `490000` and the second prints `14:00`. That is the whole method you need for the custody console. The real one uses three deposits instead of one, which makes a lucky match unlikely.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### Cover Stories and Guards {#cover}

A cover story works when it explains why you are there and asks nobody to check. "Routine supervisory visit" works on a guard because regulators do turn up unannounced and nobody wants to be the person who turned one away. It fails the moment someone phones the organisation you claim to be from.

A guard is also a sensor with a field of view. The game draws his cone of sight on the floor. Picking a lock takes time with your hands in plain view, so the question is never "can I pick it" but "is he looking". If you are caught picking, a cover story stops being believable, because honest visitors do not carry picks.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[Lockpicking.]**. That option appears once you have met a lock you can pick.

> Question: The cover story is "FCA visit, here to see the CTO". Name one thing that makes it believable and one thing a careful guard could do to break it in thirty seconds. Which of those is the weaker control for a real exchange?

### RFID Badges: Copying From Across a Desk {#rfid}

An RFID badge is a tiny chip that answers a reader over a short range. The reader checks what the chip says, not who is holding it. A cloner reads the chip's data and writes a duplicate, and the whole job takes a few seconds at conversational distance, which is the trap: a lanyard hanging open at someone's collar is a key you have handed out.

The routine is the same as in earlier missions: read the card, save the copy, then emulate the saved card at the reader. If a door will not open, check you emulated the right card. Dr Volkova's office wants her **CTO Access Badge**. The executive wing wants the **Executive Access Badge**, which is a different card.

To learn more in game, choose **[Send me a field guide.]** then **[RFID cloning.]**. That option appears once you reach the trading floor.

> Question: The cloner works because the reader trusts whatever the chip says. Name one control that would still stop a cloned badge from opening the executive wing.

### Predictable Passphrases {#passphrases}

A passphrase policy is only as strong as the habit behind it. A house convention such as "a word from our industry plus the year" looks like a rule but works like a pattern: anyone who learns the pattern has cut the search from billions of possibilities to a short list. Convenience is what keeps these conventions alive. Nobody wants to be locked out at 3am.

The server room door in this mission takes a typed passphrase. Two documents together describe it: the rule is pinned on a noticeboard, and a list of the words staff actually choose sits with the person who audits them. Neither is a secret on its own. Together they are the answer.

A made-up example. Suppose a company's convention is `<bird, lowercase> + <year>`, the audit list says the commonest birds are `heron` and `otter`, and the notice is dated 2031:

```
heron2031
otter2031
```

Two candidates, and the first one is a good place to start. Case matters, and so does the order of the parts.

> Question: A company changes the year in the passphrase every January. Does that stop the problem? What would, and what does it cost the staff?

### Following Money Through a Mixer {#mixer}

A public blockchain records every transfer, but the names on it are wallet addresses, not people. An exchange is where addresses meet real accounts, which is why it is where investigators go. A **mixer** hides the link between money in and money out. It takes deposits, shuffles them through other coins and pools, and pays out later from somewhere else.

A mixer hides the link but it does not hide the arithmetic. Two things leak:

| What a mixer does | What it leaves behind |
| --- | --- |
| Takes a fee on every output | The credit is a known fraction smaller than the deposit |
| Holds each coin for a minimum time | The credit can never land sooner than the hold |

So to match a deposit to a credit, take the deposit less the fee and look for that exact amount landing no sooner than the hold. One match could be luck. Three deposits that all land in the same place is not.

Here is the worked example from the warm-up, with a decoy added. Pool X takes 2% and holds for 4 hours. A deposit of $500,000 at 10:00 should come out as $490,000 at 14:00 or later. A credit of $490,000 at 11:30 is a decoy: right amount, too early. A credit of $500,000 at 15:10 is a decoy too: no fee was taken, so it cannot be this pool's output.

The same logic scales up. In the mission the settlement log, the pool configuration and the deposit list are three separate documents. The skill is lining them up, doing the arithmetic yourself and ignoring labels. Someone has written in the margin of one list: *trust the money, not the label*.

> Question: A second deposit of $200,000 goes into Pool X at 09:00. What credit would you look for, and from what time? Check it in a shell.

> Question: Why does a mixer hold coins for a minimum time at all? What would an investigator find easier if it paid out immediately?

### Fingerprints and Biometric Locks {#biometric}

A biometric lock opens for a body feature, not a secret. A thumb reader compares what it sees with an enrolled print. A fingerprint is left wherever a hand has been, and a print on glass can be lifted: dust it so the ridges show, photograph or tape it, and compare it. The lock was built to stop people who do not have the thumb. It was not built for someone who has the thumb's trace.

In the mission you carry a Fingerprint Kit (powder, brush, lifting tape). You dust a surface, lift what is there, and the comparison step asks you to match the print against a short list of candidates.

> Question: A password can be changed after it leaks. What can you do after a fingerprint leaks? What does that say about using biometrics as the only control on something valuable?

### PINs That Mean Something {#pins}

A four-digit PIN has ten thousand possibilities, but people do not pick at random. They pick dates, years and numbers that mean something to them. The executive safe in this mission has an observation that says as much: a man this pleased with himself picks a number that means something to him. The clue is spread across three places, and each one alone is vague. Read them together.

> Question: You find a note saying "his safe is set to the year something happens". What two further pieces of information turn that into four digits?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What kind of answer does the lock or person want: a word, a number, a card, a decision? And have I actually looked everywhere the last room offered?

### Before the First Lock: Reception and the Checkpoint {#hints-start}

**Where:** the reception lobby, then the security checkpoint to the north. **Goal:** get past the Checkpoint Guard to the trading floor. **Lock wants:** a key lock, or a good enough story.

> Hint: The trading-floor door is a key lock and you start with a Lock Pick Kit. The guard is the real obstacle. Who are you pretending to be, and who are you here to see?

<details markdown="1">
<summary>Nudge: talking past him</summary>

The guard asks two questions: who you are, and who you are here to see. The briefing told you both answers. A wrong answer sends you away at no cost, so you can try again. Once he waves you through, the door opens and stays open.

</details>

<details markdown="1">
<summary>Nudge: picking the lock</summary>

You can skip the conversation and pick the door. The guard patrols a short loop and his cone of sight is drawn on the floor. He faces away from the door for part of each loop. Start the pick only when the cone points away. If he sees the pick, the cover is strained for the night, he refuses your story until you leave and re-enter the lobby, and Agent HaX will mention it.

**Learn it:** ==action: Stand at a distance and watch two full loops of his cone== before you start the pick. Note where the cone is when he turns.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[Lockpicking.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk north from the reception lobby to the security checkpoint==.
2. \==action: Talk to the Checkpoint Guard== and give your cover as the Financial Conduct Authority, on a routine supervisory visit.
3. \==action: When he asks who you are here to see, name the CTO==, Dr Volkova.
4. \==action: Walk through the trading-floor door once he has waved you through==.

Or pick it instead:

1. \==action: Wait until his cone points away from the door==.
2. \==action: Use the Lock Pick Kit on the trading-floor door== and keep the pick going until it opens.

</details>

> Warning: Knocking the guard out also works as a way past, and it strains the cover too. A guard who is down never interrupts a pick, but the debrief and credits record it.

### The Trading Floor: Dr Volkova {#hints-irina}

**Where:** the trading floor. **Goal:** meet Dr Irina Volkova, and leave with her password wordlist. **Lock wants:** a conversation.

> Hint: She is the CTO, she built the exchange's privacy tools, and she is proud of them. How you open the conversation decides how much she trusts you.

<details markdown="1">
<summary>Nudge</summary>

Her first reply depends on your opener. Courtesy and genuine interest in her work earn trust. Going straight for her servers earns suspicion, which strains your cover if you do not repair it. If you started badly, her menu offers **[Let's start again, properly. Walk me through your anti-laundering procedures.]**.

Her wordlist comes from the option **[I'll need to test your password strength. What do people here actually use?]**. At moderate trust she hands it over. If she is not ready, ask a second time and she hands it over regardless. The wordlist arrives as the **Password Dictionary List**.

Agent HaX can help here: **[How do I play Volkova?]** explains how to turn her, and the debrief will talk about what you did.

**Learn it:** ==action: Open the Password Dictionary List and read it as a person would==. Staff here pick words from one industry. The first word on the list is the most common choice.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Dr Volkova== and choose an opener.
2. \==action: Keep talking until she is at ease==, then choose **[I'll need to test your password strength. What do people here actually use?]**.
3. \==action: Take the Password Dictionary List== she hands over.

</details>

> Tip: You do not have to finish Dr Volkova's conversation now. You will come back to her after you find the fund.

### The Server Room Door {#hints-server-door}

**Where:** the server room door, north off the trading floor. **Clues:** the **IT New Starter Checklist** (on the noticeboard at the security checkpoint) and the **Password Dictionary List** (from Dr Volkova). **Lock wants:** a typed passphrase.

> Hint: The checklist describes the house rule for door passphrases and the list names the words staff pick. Neither is the answer alone. Put the rule and the list together.

<details markdown="1">
<summary>Nudge</summary>

Read Step 4 of the IT New Starter Checklist. It gives the convention as two parts and tells you the case of the first part. The second part is a year, and the checklist has a revision date on it. The first part is whatever tops Dr Volkova's list. The convention is the same for every restricted door in the building and nobody changed this one after it was set.

The lock compares exactly what you type. No space between the parts, and no capital letters unless the convention says so.

**Learn it:** ==action: Write your best two candidates on paper== (word, then year, run together) and say out loud which part of each came from which document. Then try the stronger one.

**To learn more in game:** open your phone, choose **[Any tips on their passwords?]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the IT New Starter Checklist== on the checkpoint noticeboard and note the revision year.
2. \==action: Open the Password Dictionary List== and note the first word.
3. \==action: Run the two together with no space== and type the result at the server room door.
4. \==action: If it refuses, try the next word on the list==.

</details>

> Warning: A refusal usually means the wrong word from the list, not the wrong convention. Try the next word before you change the rule.

### The Blockchain Analysis Lab {#hints-lab}

**Where:** the Blockchain Analysis Lab, east off the trading floor. **Clue:** the **ENTROPY Transaction Network Analysis**. **Goal:** take Priya Raghavan's write-up.

> Hint: Priya has traced the money as far as the mixer and stopped. Her write-up lists what went in and when. It says where she gets stuck.

<details markdown="1">
<summary>Nudge</summary>

Take the **ENTROPY Transaction Network Analysis** and read all three sections. Section 1 lists three ENTROPY deposits into the mixer, each with an amount and a UTC time. Section 2 explains what she cannot see and how she would match the money. Section 3 lists what left afterwards. Keep the three deposits somewhere you can see them; you will need them in the data centre.

Priya is also happy to explain the method. In conversation, her option **[How would you follow money through a mixer?]** can be asked again whenever you want. **Privacy Coin Mixing Analysis** on the same desk holds more of her working notes, including a margin line about the exchange's real role.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk east from the trading floor into the Blockchain Analysis Lab==.
2. \==action: Take the ENTROPY Transaction Network Analysis== and read it.
3. \==action: Write down each deposit's amount and time==.
4. \==action: Talk to Priya Raghavan== and ask **[How would you follow money through a mixer?]**.

</details>

### The Server Room {#hints-server-room}

**Where:** the server room, north off the trading floor. **Goal:** reach the HashChain Backend Server Terminal and the SAFETYNET Financial Intelligence Drop.

> Hint: The room holds the terminal onto the exchange's backend and a drop-site where your results are submitted. Two documents you will need later are paid out by that work.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the server room door== with the passphrase.
2. \==action: Walk in and approach the HashChain Backend Server Terminal==.
3. \==action: Note the SAFETYNET Financial Intelligence Drop== beside it.

</details>

> Note: The server work has its own sheet, so you can play the rest spoiler-free and tackle the backend yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m06-follow-the-money-vm-technical-steps/) when you want the hints. Come back here when the drop-site has paid out the document that opens the data centre.

### The Data Centre Door {#hints-data-door}

**Where:** the data centre door, north off the server room. **Clue:** the **Door Controller Export**, a document the drop-site hands over as a reward. **Lock wants:** a four-digit PIN.

> Hint: The door controller's own export lists what each restricted door is set to. Which line is about the data centre?

<details markdown="1">
<summary>Nudge</summary>

Open the Door Controller Export from your inventory and look for the line that names the data centre. It gives the type of lock and the PIN. Enter the PIN exactly.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the Door Controller Export== from your inventory.
2. \==action: Find the data centre line== and read the four digits.
3. \==action: Enter them at the data centre door==.

</details>

### The Transaction Server and the Custody Console {#hints-console}

**Where:** the data centre. **Clues:** the **Financial Transaction Server** (three files) and the three deposits from Priya's write-up. **Lock wants:** a four-digit slot number, **one try per opening**.

> Hint: The transaction server has the numbers you need and the custody console wants one of them. Which slot received the money from all three deposits, after the mixer's fee, and no sooner than its hold?

<details markdown="1">
<summary>Nudge: finding the answer</summary>

Open the three files on the Financial Transaction Server: `mixer_settlements.log` (credits into cold slots, with times), `mixer_pool_config.yml` (the fee and the minimum hold) and `custody_index.csv` (the list of slots). The labels in the index say nothing useful, so ignore them and trust the arithmetic.

For each deposit in Priya's write-up, work out the amount less the fee, and the earliest time it could come out. Find credits in the log of that amount, at or after that time. Several slots will match one deposit; only one matches all three. A slot that gets the right amount too early, or an amount with no fee taken, or the right amount for just one deposit, is a decoy.

**Learn it:** ==action: Work out the largest deposit by hand== with a calculator, then check it against the log before you touch the others. Do the same for the other two.

</details>

<details markdown="1">
<summary>Nudge: asking for help</summary>

Agent HaX offers **[Which cold slot is the fund?]** once you have read the settlement log or entered the data centre. It gives three graded nudges, each a little more direct, and it needs Priya's write-up first. If you have turned Dr Volkova, she can rule out slots for you and, once you have read the settlement log, check one slot you name per visit to the console. She never tells you the answer outright.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the pool configuration== and write down the fee and the minimum hold.
2. \==action: For each of Priya's three deposits, work out the amount less the fee== and the earliest time it could land.
3. \==action: Scan the settlement log for credits of exactly that amount at or after that time==. Write down the slot for each.
4. \==action: Find the slot that appears for all three deposits==.
5. \==action: Enter that slot number at the Custody Console== (one try per opening).

</details>

> Warning: The console logs every opening to the exchange's on-call phone and takes one try per opening. The first wrong slot gets a warning from Agent HaX. A second wrong slot strains your cover. Cancelling the pad costs nothing, so work the arithmetic out before you open it.

### The Fund and the Executive Wing {#hints-wing}

**Where:** the Custody Console contents, then Dr Volkova on the trading floor, then the executive wing east of the data centre. **Clue:** **The Architect's Fund Allocation**. **Lock wants:** the Executive Access Badge, at an RFID reader.

> Hint: The fund document is signed with a name. The exec wing door wants a badge, and the note in the export says who signed one out.

<details markdown="1">
<summary>Nudge</summary>

Take **The Architect's Fund Allocation** and read it. It lists what each cell was paid up front, what is still pending, and who authorised it. Then go back to Dr Volkova on the trading floor. Once you have found the fund, her menu has **[Satoshi's wing. You've a badge for it.]** and she hands over the spare Executive Access Badge. If she has been knocked out or detained and taken away, Agent HaX can relay a copy through **[I need the executive badge she signed out.]**.

Emulate the badge at the executive wing's RFID reader.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Take The Architect's Fund Allocation== from the Custody Console.
2. \==action: Return to Dr Volkova on the trading floor== and choose **[Satoshi's wing. You've a badge for it.]**.
3. \==action: Emulate the Executive Access Badge at the executive wing's reader==.

</details>

### Satoshi's Minder {#hints-minder}

**Where:** the executive wing. **Goal:** get through the CEO's door, past Kemal Aydin, who holds the key. **Lock wants:** a key lock, or the key.

> Hint: Kemal walks a short loop between two doors and his cone of sight is drawn on the floor. The CEO's office is key-locked and he holds the key.

<details markdown="1">
<summary>Nudge</summary>

There are three ways through. **Talk:** with the cover held he accepts the FCA line, since the CEO's compliance file has your name on it. With the cover strained he only accepts Dr Volkova's word, and only if you turned her. **Pick:** pick the CEO's door while his back is turned. If he sees the pick, he stops you and a stand-off follows; a seen pick withdraws the FCA line for that visit. **Fight:** step aside or I'll move you. A knocked-out Kemal drops the key.

**Learn it:** ==action: Watch one full loop of his cone== from the west door before you decide.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Enter the executive wing== and let Kemal challenge you.
2. \==action: Choose the line that fits your situation== (the FCA line if your cover held, Dr Volkova's word if you turned her).
3. \==action: Walk into the CEO's office== through the now-open door.

</details>

> Warning: A fight with Kemal goes on the record, and the debrief and credits say how you got past him.

### Satoshi Nakamoto II and Dr Volkova {#hints-finale}

**Where:** the CEO's office, then Dr Volkova on the trading floor. **Goal:** confront the man at the top, then make two decisions. What you choose is your decision. No ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: Two decisions close the mission: what happens to the money, and what happens to Dr Volkova. Read what you are holding before you decide either.

<details markdown="1">
<summary>Nudge: Satoshi Nakamoto II</summary>

His office holds a manifesto, a signing case and a safe. When you confront him, his reaction depends on what you have found. With the fund in hand you can make him answer to the name on the authorisation line. If you arrest him without evidence, he resists. The money decision comes up in his conversation: the options are to freeze the fund, to watch it, or to say not yet. Freezing is available only when you hold the recovery keys from the server work; watching is always available, and "not yet" lets you go and get what you are missing. The game explains what each choice costs in the debrief.

</details>

<details markdown="1">
<summary>Nudge: Dr Volkova</summary>

You can turn her or detain her. Turning works best when you have shown her what her work pays for, and her own research notes give a low-trust player a way in. Detaining her hands her to the police. Her conversation also offers "Think about it" once. A turned Dr Volkova opens the mixer to you tonight and nothing she does carries into later missions.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Several decisions run through the night and show up in the debrief and the credits:

- **The fund.** Freeze it and the pending balances stop, but the advances are already gone and ENTROPY learns its bank is burned. Watch it and the balances reach the cells, and SAFETYNET maps every recipient. The debrief states the cost of each plainly.
- **Dr Volkova.** She built the system and wrote that she cannot walk away. You can recruit her or hand her to the police.
- **The cover.** Whether your FCA story held all night, or strained, is recorded.
- **Civilians and staff.** The guard, Dani Okonkwo and Priya Raghavan are not ENTROPY. You can knock them out to save trouble, but the game records it.
- **How much you read.** The executive safe, the signing case and several documents are optional, and the debrief acknowledges what you left unread.

None of these is scored as right or wrong by the game. They change who is safe at the end and what SAFETYNET walks away with.

</details>

After you decide, ==action: finish anything you still want to read, then open your phone and choose **[I'm done here. Bring me in.]**== to hear the debrief. That option appears once both decisions are made and the server work is complete.

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The guard says he will be ringing whoever you named | He saw your pick. Leave and re-enter the lobby to reset him, but the cover stays strained |
| The server room door rejects your passphrase | One part is wrong. Check the word is the first on Dr Volkova's list, the year is on the checklist, and there are no spaces or capitals you added |
| The data centre door rejects the PIN | The PIN comes from the Door Controller Export, not from a guess |
| The Custody Console closes after one wrong slot | It takes one try per opening. Work the arithmetic out first, then reopen it |
| Dr Volkova will not hand over the wordlist | Trust is low. Ask a second time, or repair the conversation first |
| Kemal will not take the FCA line | Your cover is strained. Use Dr Volkova's word or pick the door |
| The executive wing reader refuses a card | You emulated the wrong card. The wing wants the Executive Access Badge, not the CTO one |
| **[I'm done here. Bring me in.]** is not on the menu | One of the two decisions is outstanding, or the server work is unfinished |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>Dr Volkova's office</summary>

Her office is west off the trading floor and the door wants her CTO Access Badge. There are several ways to get it: ask to borrow it (a turned Dr Volkova lends it, and so does a trusting one), let the cloner read it off her lanyard while she talks (**[(Let the cloner read her badge while she talks.)]**), or pick up the copy that drops if she is knocked out. Agent HaX can relay a copy if you ask: **[I need her office badge.]**. Inside are her **Cryptography Research Notes**, whose last lines are the leverage for turning a low-trust Dr Volkova, and an **Email: From The Architect**, whose postscript is about the CEO's safe.

</details>

<details markdown="1">
<summary>The executive safe</summary>

A four-digit safe in the CEO's office. The clue is spread across three rooms. The **Framed Press Clipping** in the executive wing gives his motto. The Architect's email in Dr Volkova's office says what year the safe is set to, without giving the number. Priya's **Privacy Coin Mixing Analysis** has a margin line that supplies the number. Read all three and the safe's four digits follow. Inside is a file on The Architect's identity, and skipping the safe means the debrief acknowledges the gap.

**Learn it:** ==action: Work out the year yourself== from the margin line before you enter anything.

</details>

<details markdown="1">
<summary>The print on the press clipping and the signing case</summary>

The **Framed Press Clipping** in the executive wing carries a thumbprint on the glass. Dust it with the Fingerprint Kit while Kemal's back is turned. The comparison step shows the CEO's print and one other; choose the match. The **Signing Case** on his desk opens to his print and holds the Release Signing Record, which the debrief and credits both mention.

</details>

<details markdown="1">
<summary>Dani Okonkwo and Priya Raghavan</summary>

Dani Okonkwo, on the trading floor, flagged the ENTROPY wallets in the **Daily Trading Report** and is worried about it. Priya Raghavan, in the lab, will talk through her transaction graph and explain how she follows money through the mixer. Both conversations are optional and both appear in the credits if you had them.

</details>

<details markdown="1">
<summary>Cold Storage Procedure and the HashChain Exchange Brochure</summary>

The **Cold Storage Procedure** note in the data centre says where the exchange keeps the recovery keys for its cold wallets, and why that is a risk. The **HashChain Exchange Brochure** in the reception lobby is the public face: leadership, services and a tagline.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise the arithmetic behind the custody console, with your own made-up data, not anything from the game. Use any current Linux distribution with `awk`, `date` and `sort` available.

### Fee and hold by hand and by tool {#cli-fee}

\==action: Work out an expected credit and its earliest time==:

```bash
awk 'BEGIN{printf "%.0f\n", 500000*(1-2/100)}'
date -u -d '2031-03-04 10:00 UTC + 4 hours' '+%d %b %H:%M'
awk 'BEGIN{printf "%.0f\n", 1000000*(1-2.5/100)}'
date -u -d '2031-03-04 21:30 UTC + 9 hours' '+%d %b %H:%M'
```

The first pair prints `490000` and `04 Mar 14:00`. The second prints `975000` and `05 Mar 06:30`: a $1,000,000 deposit at 21:30 with a 2.5% fee and a 9-hour hold lands the next morning.

> Question: Change the fee to 1.5% and the hold to 6 hours and rerun both. What do you get for a $2,000,000 deposit at 22:00?

### Matching credits in a made-up ledger {#cli-ledger}

\==action: Write a small settlement ledger and filter it==:

```bash
printf '%s\n' \
  'A 11:30 490000' \
  'B 15:10 500000' \
  'C 14:20 490000' \
  'D 14:45 245000' > ledger.txt
awk '$3 == 490000 && $2 >= "14:00" {print $1}' ledger.txt
```

This prints `C`. The time comparison works here because the times are zero-padded 24-hour strings, which sort the same way as the clock.

> Question: Add a second deposit and a second ledger line for it. What would you add to the `awk` test to match both deposits to the same slot?

### Building candidates from a convention {#cli-candidates}

\==action: Combine a short list of words with a year for a made-up door==:

```bash
printf '%s\n' heron otter badger | while read w; do echo "${w}2031"; done
```

This prints `heron2031`, `otter2031` and `badger2031`.

> Question: A convention with a list of five words and a year has only five candidates. How many candidates does a random eight-character lowercase password have? Why does that gap matter more than the year?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: the server work was generated for you, and your ending may differ from a classmate's.

### 1. Physical Access and Cover {#q-physical}

> Question: You got past the Checkpoint Guard by talking, by picking or by force. What did each route cost you in cover, and how would a defender tell a real regulator from a convincing fake?

> Question: Dr Volkova's badge was cloned from across a desk, or lent. What single control would have made the cloned badge useless on its own?

> Action: Write a half-page physical access review for a small office, covering visitors, badges and a guard. Map each point to something you did in the game.

### 2. Passphrases and Conventions {#q-passphrases}

> Question: The server room door rule was written on a noticeboard and the staff list was in the CTO's own file. Which of those is the bigger mistake, and why?

> Action: Write a passphrase policy for a small firm that keeps the convenience of an easy-to-remember phrase without the weakness of a fixed pattern. State what you give up.

### 3. Following the Money {#q-money}

> Question: Walk through how you found the fund: which three documents did you use, and what did each one contribute? Why was no single document enough?

> Question: The mixer hid the link between deposit and credit, and the fee and the hold time gave it away. Name another property of a mixer or an exchange that could leak the same way.

> Question: The custody console took one try per opening. What does that tell you about the exchange's expectations of who would be standing at it?

> Action: Take a made-up mixer with a 3% fee and a 5-hour hold, invent two deposits and four credits, and swap with a classmate. Race to find the matching slot, and note which clue you used first.

### 4. The Backend {#q-backend}

> Question: Walk through the stages of the server work. For each, say what you did, what made it possible, and what a defender could have changed to stop you.

> Question: Several accounts on the backend shared a password, and one account held the recovery keys for every cold wallet. For each, describe what a defender should have done.

> Action: Write a short remediation plan for the exchange's backend, in order of priority, with one line on why each item is where it is.

### 5. People, Evidence and Choices {#q-choices}

> Question: What did you decide to do about the fund, and what did you know when you decided? Would you choose differently on a second run?

> Question: Dr Volkova built the exchange's privacy tools believing in them, and the CEO switched off compliance reporting over her written objection. How much of the responsibility for what the mixer did is hers? How much is his?

> Question: You could have knocked out the guard, Dani or Priya to save trouble. What did the game record when you did, and what does that cost model say about real operations?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m06-follow-the-money-vm-technical-steps/) sheet, for the backend server work.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Authentication, Authorisation and Accountability, on Adversarial Behaviours, and on Applied Cryptography.
- Public guidance on money laundering through cryptocurrency exchanges, such as the Financial Action Task Force's material on virtual assets.
