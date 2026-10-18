---
title: "The Architect's Gambit (Break Escape Mission 7)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based crisis mission at a grid control facility: choose where your one tactical team goes, get past a bought guard and a badge reader, open a keyed door, a keypad and a password door, weigh two documents that disagree, and decide what to do about the people you meet before the debrief reads out what each choice cost."
overview: |
  Four operations go live inside the same sixty seconds. SAFETYNET has one agent in range and one tactical team that can answer exactly one of the other three crises. The Architect's Gambit asks you to make that call, then break into a regional grid control facility outside Portland to stop a cascade sequence that could take the lights out across three states.

  You play Agent 0x00, sent in alone. Director Netherton briefs you, Agent HaX supports you by phone, and the building is full of locks that each rest on a different weakness: a guard who has been bought, a badge reader that trusts any badge, a PIN written in a handover note, a key left in a tray, a password a nervous engineer knows, and a keypad whose code is a rule applied to a plate on a machine. The mission ends in a debrief that reads out what happened at the two crises you did not answer.

  This sheet gets you started, explains the ideas behind each in-game lock with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to full steps. The server work on the attack host has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["rfid", "badge cloning", "lockpicking", "insider threat", "weak authentication", "industrial control systems", "incident response", "triage", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m07_architects_gambit/labsheet.md"
cybok:
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication", "Smart cards", "Personal identification number and memorable information", "Weak and predictable codes"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["Physical access", "Authentication and identification"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["Industrial control systems", "Electric power grids", "Physical tampering"]
  - ka: "SOIM"
    topic: "Human Factors: Incident Management"
    keywords: ["Security event triage", "Crisis management", "Incident response"]
  - ka: "HF"
    topic: "Human Factors"
    keywords: ["Insider threat", "Social engineering", "Abuse of trust"]
  - ka: "AB"
    topic: "Models"
    keywords: ["Attack trees", "Kill chains"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain why a badge reader that trusts any copied badge fails, and how an audit trail or a handover note can expose an insider
- spot a code that was built from something public (a date, a serial number) and say why writing it in a standing note is a problem
- tell a pin-tumbler key lock from a PIN, a password and a card reader, and say what each one is weak against
- read two documents that disagree, work out which fields differ, and say what that changes
- weigh up the choices a crisis forces, about the people you meet and the operations you cannot cover

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short warm-up. It takes a few minutes and uses made-up data.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and a full set of steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The server work on the attack host (the four challenges you submit at the relay terminal) is in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m07-architects-gambit-vm-technical-steps/), so you can play the rest without it.

> Note: Some values in this mission are fixed and you work them out from clues in the building (a PIN, a keypad code, a door password). This sheet says where each clue is and what shape the answer takes, never what it reads. The flags on the attack host are generated for your game, so they are never printed here either.

## Getting Started {#getting-started}

You are Agent 0x00, a SAFETYNET field agent. Four ENTROPY operations have gone live at once. You are the one agent in range of a grid control facility outside Portland, where a loaded sequence is waiting for a host inside the building to start it. The tactical team can reach one of the other three crises: Fracture in Washington, Trojan Horse in Austin, or Meltdown in San Francisco. You make that call. Two will go unanswered.

You do not need any prior knowledge to start. Agent HaX hands out short in-game field guides as you reach each obstacle.

1. \==action: Start the Break Escape mission **The Architect's Gambit**==.
2. \==action: Watch the briefing from Director Netherton==, and ask about any of the operations you want to hear more about. Then choose how you want to play it.
3. \==action: Read the Threat Desk Summary in your inventory== before you commit the team. It holds the three briefs.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints, a progress check and field guides as you go.

The mission takes about 90 minutes. In a 60-minute class, stop once you are inside the server hall and have met Elena Rodriguez, before you start the server work at the VM Access Terminal (around the halfway mark), and resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents you are handed open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX), a **Lock Pick Kit**, an **RFID Cloner**, a **Fingerprint Kit** and the **Threat Desk Summary**. There is no PIN cracker this time, and the Fingerprint Kit has no job in this building.

The building is a short chain of rooms. You start in the **security checkpoint**. East of it is the **operations floor**, and east of that the **server hall**. The **SCADA control room** is north of the server hall, and the **backup generator hall** is south of it, with the **cable vault** below that.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- **[Where do I stand?]** gives a read of the next step you have not done. It is always there.
- **[I'm stuck on something.]** opens a menu of hints for the situation you are in, such as the vault keypad or the man in the vault.
- **[Send me a field guide.]** lists the field guides on offer. A guide appears only once you have reached the obstacle it covers. For this sheet's game portion, those are the RFID cloning guide and the lockpicking guide.

> Tip: The four locked doors and the console in this building are each locked a different way. Before you try anything, ask what the lock is made of: a card, a key, a PIN, a password or a flag. Each wants a different kind of clue.

> Tip: A PIN is digits only. A password is case-sensitive, with no extra spaces. Copy values exactly as the clue gives them.

> Warning: Some people here can be knocked out, and the game records it. Nothing in this sheet tells you whether to fight. The error table lists what each route costs you.

### Warm-up: Read a Rule, Then Apply It {#warm-up}

One lock in this mission wants a code that is never written down. Instead you are told a rule, and you apply it to something you can read in the room. Practise that with made-up data here.

1. \==action: Read this note==: "The shed padlock code is the last four characters of the serial number on the generator plate."
2. \==action: Read this plate==: `S/N 0412-9375`.
3. \==action: Write down the last four characters== of the serial. They are `9375`.
4. \==action: Read this second note==: "The shed alarm code is the month and day of the audit, two digits each." The audit was on 21 September. The code is `0921`.

You have just done what two of the locks in this building ask of you: a rule from one document, a fact from another. The next section explains why people do this, and why it only half works.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### Badge Readers Trust the Card {#badges}

A badge reader checks that a card is valid. It cannot check who is holding it. If the card data can be read from a short distance and copied, the copy opens the door as well as the original.

| What you have | What it gets you | What a defender can add |
| --- | --- | --- |
| A badge worn on a lanyard or belt | A copy, if you can stand close while it is read | A PIN on the reader, a log of every use, a card that cannot be read at arm's length |
| A badge printed from the site's own stock at an unattended station | A real, valid badge | Logging out of the station, a supervisor sign-off, audit of the print queue |
| A badge handed to you by its owner | A real, valid badge | Nothing at the reader; the control is the person |

In this mission, the server hall reader accepts a **server-zone badge**. There is more than one way to come by one. Each leaves a different trail, and the debrief and ending notice some of them.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**. It covers read, save and emulate.

> Question: A reader logs every badge it accepts. Name two things a defender could look for in that log that would show a cloned badge, as opposed to the real owner using it.

### Insiders and Audit Trails {#insiders}

Most of this attack needed a door opened from the inside. Someone with legitimate access renewed a contractor's credentials for money. That is an insider, and the interesting part is how they are found: not by watching them, but by reading paper that was kept for another reason.

- A **visitor log** is kept for compliance. It records who came, why, and who escorted them. A blank in the escort column is a question.
- A **handover sheet** is written by one shift for the next. It records what the writer noticed, including things they did not understand.
- A **print history** records which login produced which badge.

None of these says "this person is bought". Each one narrows the question. Put two together and a name appears.

> Question: The log asks a question and the handover sheet answers it. Why is it worth more to hold both than either alone? What does the log alone let you say to someone?

### Codes Built from Public Facts {#weak-codes}

A code is only as strong as the way it was chosen. People pick codes they will remember, and what they remember is public: a date, a serial number, a year.

| Code is built from | Who else knows it | Weakness |
| --- | --- | --- |
| A date everyone in the building saw (an audit, a founding year) | Everyone who was there, and the paper trail | Guessable once you know the format |
| A serial number printed on a machine | Anyone who can read the plate | Needs no guessing, only access to the room |
| A word plus a number | Anyone who has seen the pattern | Case-sensitive but still memorable |

The strongest version of this idea is "read it off the plate so nobody has to write it down". It does keep the code off paper. It also means anyone who reaches the plate, and knows the rule, has the code. A rule is itself a secret, and every place it is repeated is another place it can leak.

> Question: Why does a code that is never written down still need protecting? Where does the protection move to?

### Standing Notes Go Stale {#stale}

Sites write the keypad code on a log "per site standard", so an engineer is never locked out. That works until the code changes and the note does not. A note that says a value is void, with the old value still printed beside it, is a lure as much as a record: it looks like the answer. Check the dates before you trust a number on a standing note.

> Question: What should a site do with an old code in a standing note: cross it out, delete it, or leave it with "VOID" beside it? What does each choice cost?

### Key Locks and Lockpicking {#lockpicking}

A pin-tumbler lock holds a row of spring-loaded pins that block the cylinder from turning. The right key lifts every pin to exactly the shear line. A pick does the same one pin at a time: you apply light turning pressure, find the pin that is binding, push it up until it sets, and move on to the next.

| Step | What you do | What you feel or see |
| --- | --- | --- |
| 1 | Apply light, steady tension | The cylinder wants to turn a tiny amount |
| 2 | Find the binding pin | One pin feels stiff; the others spring freely |
| 3 | Lift it until it sets | A small click; the cylinder turns slightly more |
| 4 | Repeat | Until every pin is set and the cylinder opens |

Too much tension jams every pin. Too little lets a set pin drop again. In the game, picking takes time out in the open, so the other half of the skill is choosing when to start.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**.

> Question: A key left in a tray beside the door it opens defeats the lock entirely. Which would you rather have a site do about that: remove the key, or fit a better lock? Why?

### Control Rooms and Physical Tampering {#cyber-physical}

A grid control facility is an industrial control system. A room full of operators watches readings and sends commands to equipment out in the field. The software is only one way in. A device spliced into a cable, or a jumper across a switch's control terminals, reaches the same equipment without ever logging in.

That is why this building has a plant hall and a cable vault, and why part of the mission is about finding how the attack got in rather than only stopping it. A defender who patches the software and never walks the cable has closed one door out of two.

> Question: Why does an attacker who has a physical device in the building not need to defeat the control room's password at all?

### Reading Two Documents That Disagree {#two-documents}

You hold the Threat Desk Summary from SAFETYNET. Later you may hold a second document, written by the other side, about the same operations. When two documents describe the same thing differently, the useful move is to put them side by side and compare field by field.

```
Briefed (summary)        Their own schedule
dormancy: 90 days        dormancy: 9 days
records at risk: none    manifest: mostly health and dispatch keys
```

The example above is made up. The point is the method: list the fields, find the ones that differ, ask which document had a reason to be wrong, and ask what each difference would change about the decision you already made.

> Question: Who gains if a briefing understates how soon something will happen? Name one reason a source might do that on purpose, and one reason that would be an honest mistake.

### Triage Under Uncertainty {#triage}

You cannot cover everything. One team, three crises, and each brief has a different mix of how many people, how soon, and how sure the numbers are. Triage is making that call with what you know and being honest afterwards about what you did not.

There is no answer in the briefs that the game marks as correct. The debrief reads back what you chose, what you knew when you chose it, and what happened at the places you did not cover.

> Question: Before you commit the team, which of the three briefs would you want the most checking on? What would you want to check?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock want: a card, a key, a PIN, a password, a flag? And have I actually read everything in the last room?

### Before the First Lock: The Briefing and the Call {#hints-start}

**Where:** the briefing, then the security checkpoint. **Goal:** commit the tactical team to one operation and start moving.

> Hint: The Threat Desk Summary in your inventory holds the three briefs. The Director will talk through each one. You can ask for them side by side before you decide.

<details markdown="1">
<summary>Nudge</summary>

Open the Threat Desk Summary and read it with the Director's answers beside it. The team moves the moment you commit. If you close the briefing before you decide, Agent HaX takes the call from the phone: choose **[Where the team goes: I'm ready to make the call.]**.

Whichever operation you pick, the game records it and the debrief reads it back. No option is marked as the right one.

**Learn it:** ==action: Write the three briefs side by side on paper== (site, how soon, how many people at risk) before you choose. Then check whether any figure rests on a single source.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Threat Desk Summary== in your inventory.
2. \==action: Ask the Director about each operation== you want to hear more about.
3. \==action: Choose the operation== from the commit menu, or later from your phone.
4. \==action: Move east== out of the checkpoint towards the operations floor.

</details>

### Getting Past Ray Hollis {#hints-hollis}

**Where:** the security checkpoint. **Goal:** deal with the guard and get through to the operations floor.

> Hint: The building is being evacuated and one guard has not left his post. He is armed and frightened. You can talk, bluff, back off, or fight, and what each one gets you differs.

<details markdown="1">
<summary>Nudge: what he responds to</summary>

Hollis challenges you on sight. A bluff about being on a contractor list fails. Pressing him on the money rattles him but does not move him. The thing that does move him is paperwork that names him: the **Shift Handover Sheet** on the operations floor holds a line about a badge print history that could only have come from his login. The **Audited Visitor Log** on the checkpoint desk asks the same question without answering it.

If you back off ("Back off. I'm leaving.") he lets you go for now and is jumpier when you return. You can still read the sheet and come back.

**Learn it:** ==action: Read the visitor log first, then the handover sheet==. Note what each one lets you say to him that you could not say before.

</details>

<details markdown="1">
<summary>Nudge: what each route costs</summary>

- **Talk him round with the sheet.** He gives you his server-zone badge and walks out. He also tells you how the vault keypad was set and that someone went down the riser. You do not get to arrest him.
- **Keep him on the money while the cloner reads his belt.** The option appears after you have pressed him about the money and have seen the server hall reader. You get a working copy, and he stays at his post, still bought. He tells you nothing about the vault.
- **Fight him.** You get the badge from the floor. He tells you nothing, and the game records the fight.
- **Print a badge instead.** You can back off, then use the badge station described in the next stage. He stays at his post and you hear nothing from him.

None of these is marked as wrong. They change what you hear and what the debrief says.

</details>

> Warning: Do not start a fight by accident. The choice that begins one is labelled "(Fight him.)" and the line before it says a fight is one step away.

### Getting a Server-Zone Badge {#hints-badge}

**Where:** the checkpoint and the operations floor. **Lock:** the server hall reader (a card). **Lock wants:** a server-zone badge.

> Hint: The reader wants a server-zone badge, not a visitor pass. There is more than one way to get one. Look at what is on the security desk and what is sitting in a tray on the operations floor.

<details markdown="1">
<summary>Nudge: finding the other routes</summary>

Besides Hollis's own badge or a copy of it, the **Contractor Badge Station** behind the desk prints server-zone badges from the site's own stock. It is locked with a four-digit PIN. The **Shift Handover Sheet** on the operations floor says what the PIN is: it is the same as a date it also mentions. Read the sheet for which date.

**Learn it:** ==action: Write the date from the sheet as month then day, two digits each==, before you try the keypad. Check it against the worked example in the warm-up.

**To learn more in game:** on the operations floor, Agent HaX offers a field guide. Open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go to the operations floor and read the Shift Handover Sheet==. Pick it up if you want it for Hollis.
2. \==action: Work out the PIN== from the date the sheet mentions (month and day, four digits).
3. \==action: Return to the Contractor Badge Station== behind the checkpoint desk and enter the PIN.
4. \==action: Take the Printed Contractor Badge== from the tray.
5. \==action: Emulate or use the badge at the server hall reader== on the east side of the operations floor.

</details>

> Warning: If you cloned or took a badge from Hollis, the reader needs the saved or held badge, not your visitor pass. Press Save in the cloner before you close it, or the read is not kept.

### The Operations Floor {#hints-ops}

**Where:** the operations floor. **Goal:** read what the night shift left, and take what you will need later.

> Hint: Everything on this floor was written by people who were evacuated mid-task. Read the handover sheet, the wall map and the situation board. One small object on the supervisor's desk is worth taking.

<details markdown="1">
<summary>Nudge</summary>

The **Plant Maintenance Key** sits in the tray on the supervisor's desk with a tag that says PLANT / GEN HALL. It opens the generator hall. You also have a lock pick kit, so this is a convenience, not a requirement. The **Abandoned Operator Workstation** and the **Grid Situation Board** are read-only; they tell you the site is under remote control and nothing more.

</details>

### The Server Hall {#hints-server-hall}

**Where:** the server hall, east of the operations floor. **Goal:** get inside and meet Elena Rodriguez.

> Hint: Two people care about this room: an engineer kneeling at the rack, and you. The VM Access Terminal and the SAFETYNET Relay Terminal are where the server work happens.

<details markdown="1">
<summary>Nudge</summary>

Elena Rodriguez was told this was a six-hour demonstration with nobody hurt. She knows the control room password and the vault keypad rule, but she does not hand them over for nothing. How she responds depends on how you ask. If you pressure her, she may leave the building and take both with her. If you listen first, ask what she was told, and put the other briefs in front of her, she may help.

The **Cabling Survey Note** on the rack door is hers. It says where the survey cable ran to.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk in and talk to Elena Rodriguez== at the backup rack.
2. \==action: Ask what she was told== and listen. The other options appear as she answers.
3. \==action: Read the Cabling Survey Note== on the rack door.
4. \==action: Approach the VM Access Terminal== when you are ready for the server work.

</details>

> Note: The server work has its own sheet, so you can play the rest of the building spoiler-free and tackle the attack host yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m07-architects-gambit-vm-technical-steps/) when you want the hints for the VM Access Terminal and the four flags you submit at the SAFETYNET Relay Terminal.

> Tip: Open the control room door before you go far into the server work. A visible fifteen-minute clock starts partway through it, and the console that takes the abort is in that room.

### Comparing the Briefs {#hints-compare}

**Where:** anywhere, once you hold a second document or have spoken to Elena. **Goal:** decide whether the figures you committed on still hold.

> Hint: Your phone gains an option, **[Their schedule doesn't match our brief.]**, once you hold the second document. Put your Threat Desk Summary next to it and compare row by row.

<details markdown="1">
<summary>Nudge</summary>

A second source comes either from Elena (if she opens up) or from a document the relay terminal hands you once you have put intelligence through it. Compare the two on one operation at a time. Look at the figure for how long it stays dormant, and at what the supply list actually contains. HaX gives you a menu to say which operation and which field.

A wrong guess costs nothing; HaX says it does not match and the menu comes back.

The option to move the team stays open for a limited time, about 40 minutes from your commit, and it ends earlier if the cascade clock starts. A countdown on screen shows it. Whether you use it is your decision.

**Learn it:** ==action: Make your own two-column list== of the fields in the summary and the fields in the second document. Circle every field that differs, then pick the two that would change a decision.

</details>

> Note: Moving the team costs something. HaX spells out the cost when you ask. Declining is recorded as a decision too. The game does not mark either one as correct.

### The Control Room Door {#hints-control-door}

**Where:** the SCADA control room, north of the server hall. **Lock:** a password door. **Lock wants:** a password.

> Hint: The door wants a password and nobody has left it lying around. Two people know it, and one of them is not a person.

<details markdown="1">
<summary>Nudge</summary>

Elena Rodriguez knows it, and gives it if she chooses to help. The other source is a capture the relay terminal hands over once you have submitted intelligence from the attack host. The companion sheet covers that route.

The keypad is case-sensitive and reads capitals exactly as written.

**Learn it:** ==action: Copy the password into your notes with the mouse== rather than retyping it. Compare the copy against the original character by character.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Ask Elena for the control room password== (she needs to have helped you first), or take it from the capture when the relay terminal produces it.
2. \==action: Enter the password at the control room door== with the capitals exactly as given.
3. \==action: Step inside==. Dr James Mercer is at the master console.

</details>

> Warning: A password with a wrong capital is rejected like any other wrong guess. The door does not say which character is wrong.

### The Generator Hall {#hints-plant}

**Where:** south of the server hall. **Lock:** a keyed door. **Lock wants:** the plant key, or a pick.

> Hint: The sign on the key said where it belongs. If you did not take it, the pick kit is in your inventory for a reason.

<details markdown="1">
<summary>Nudge</summary>

Use the **Plant Maintenance Key** from the operations floor, or pick the lock. Picking takes time and attention. Read the lockpicking section in Concepts first if it is your first time.

**To learn more in game:** Agent HaX offers the lockpicking guide when you enter the server hall, unless you already hold the key.

**Learn it:** ==action: In the lockpicking guide, find the sentence about which pin binds first==, then watch for it in the minigame.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go back to the operations floor and take the Plant Maintenance Key== from the supervisor's tray, if you have not already.
2. \==action: Use the key on the generator hall door==, or \==action: use the Lock Pick Kit on it==.
3. \==action: Go in==. Read the Plant Maintenance Log and the Backup Power Transfer Switch.

</details>

### The Cable Vault Keypad {#hints-vault}

**Where:** the cable vault, south of the generator hall. **Lock:** a PIN on a keypad. **Lock wants:** four digits.

> Hint: The log in the generator hall has a standing note with a number and a word next to it. Read what the word says and what the log says happened on the day it was reset.

<details markdown="1">
<summary>Nudge</summary>

The number on the standing note is marked void. The log says the keypad was reset after a survey and the new code was never passed to the plant. The new code is a rule applied to something in the room, not a number written on paper. Hollis (if you talked him round) and Elena (if she helped) both tell you the rule, and a document the relay terminal hands over gives it too. Say it back to yourself in one line, then look at the **Backup Power Transfer Switch** and read its rating plate.

If you have not met either of them, open your phone and choose **[I'm stuck on something.]** then **[The vault keypad. Where do I get the code?]**. HaX names the source and never the digits.

**Learn it:** ==action: Do the warm-up again with a plate you make up==, and check you can say the rule in one sentence.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Plant Maintenance Log== for the reset entry.
2. \==action: Get the rule== from Hollis, Elena, or the document the relay terminal produces.
3. \==action: Read the rating plate on the Backup Power Transfer Switch==.
4. \==action: Apply the rule to the serial number== to get four digits.
5. \==action: Enter the four digits at the cable vault keypad==.

</details>

> Warning: The number printed on the standing note is the old code. Typing it in does not work, and the log says so.

### The Man in the Vault {#hints-park}

**Where:** the cable vault. **Goal:** deal with Thomas Park, who is cutting a cable run.

> Hint: He has four minutes of work left and he will not stop for words alone. What does he believe he is doing, and what is the one piece of paper in the building that says otherwise?

<details markdown="1">
<summary>Nudge</summary>

Park was told the job was a building, empty, with nobody in it. The control room holds a page that says what the grid feeds. Read it first. If you hold that page in your hand when you go back down, you can put it in front of him. If you show up without it, backing off buys you a second visit, and he warns you there is no third.

If you want the pointer again, open your phone, choose **[I'm stuck on something.]** then **[The man in the vault won't stop. What would reach him?]**.

The vault also holds the **Trunk Cable Runs** (the splice that is newer than everything around it), a **Tomb Gamma** printout and an intercepted email. They are optional, and they matter to the debrief.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the control room first and read the Signed Casualty Projection== on the console beside Dr Mercer. Pick it up.
2. \==action: Go back down to the vault== with it in your inventory.
3. \==action: Talk to Park and choose the option to show him the page==.
4. \==action: Read the Trunk Cable Runs, the Tomb Gamma printout and the intercepted email== before you leave.

</details>

> Warning: Talking him down and fighting him both stop him, but the state of the transfer switch and the debrief differ. The game records which you chose.

### The Control Room and the Console {#hints-console}

**Where:** the SCADA control room. **Goal:** face Dr James Mercer, then put the abort in at the Cascade Control System.

> Hint: Mercer will talk if you let him, and he cannot help explaining himself. The console behind him will not take an abort until the work on the attack host is done.

<details markdown="1">
<summary>Nudge: the conversation</summary>

Mercer has several things he wants to say, and you choose what you ask. Some options only appear once you hold the right evidence: the Signed Casualty Projection on the console, Elena's account (if she helped), or the second document about the four operations. At the end you choose how to leave him: arrest, record, fight, or let him walk. The game records which, and none is marked as wrong.

</details>

<details markdown="1">
<summary>Nudge: the console</summary>

The **Cascade Control System** is the only place the abort goes in. It stays locked until the host that drives the sequence is dealt with, which is the server work in the companion sheet. After that it opens by itself and prints a confirmation. The **Cascade Countdown Display** in the same room shows the clock.

</details>

> Warning: If the clock runs out first, the first step of the sequence still executes. Nothing fails the mission, but the abort confirmation and the debrief read differently.

### Calling It In and the Debrief {#hints-finale}

**Where:** your phone, then wherever you are standing. **Goal:** finish the night and hear the debrief.

> Hint: Once the abort is in, you can keep exploring. The plant and the vault stay open until you ask to be brought in. After that the building belongs to the police.

<details markdown="1">
<summary>Nudge</summary>

When the abort is in, open your phone and choose **[Bring me in.]**. If you do not, the game starts the debrief by itself after about nine minutes. Finish anything you still want to read first: the plant and the vault, the Tomb Gamma printout and the intercepted email, Dr Mercer's page.

The debrief reads back what you chose and what you left unread, then rolls the credits.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Several decisions run through the night and show up in the ending:

- **The team.** Which operation you committed to, whether you changed your mind, and whether you declined when you could have. The debrief reads out what happened at the two crises you did not answer.
- **Ray Hollis.** Talked round, cloned, fought, or left at his post.
- **Elena Rodriguez.** Whether she turned, fled, or was knocked out depends on how you approached her.
- **Thomas Park.** Talked down, knocked out, evaded, fought off, or never found.
- **Dr James Mercer.** Arrested, recorded, fought, or let go.
- **How much you read.** The splice, the Tomb Gamma printout and the intercepted email are optional, and the debrief notices what you left behind.

None of these is scored as right or wrong by the game. They change who is safe at the end and what SAFETYNET walks away with.

</details>

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The server hall reader refuses you | You are holding a visitor pass or the wrong item; you need a server-zone badge from Hollis, a copy of it, or the station |
| The cloner closes without a copy | You did not press Save, or the read was interrupted; read again |
| The Contractor Badge Station rejects the PIN | The PIN is four digits, and it is the same as a date on the handover sheet; check the format |
| Hollis keeps challenging you | You have not resolved him; talk, back off, or choose a different route |
| Hollis turns hostile | You chose the option marked "(Fight him.)" or pushed him past the corner |
| The generator hall door will not open | It is a key lock; take the key from the operations floor or pick it |
| The vault keypad rejects the code on the standing note | That code is marked void; use the rule and the plate |
| The vault keypad rejects your four digits | Check you used the last four characters of the serial, not the first four, and that the plate you read is the transfer switch's |
| The control room door rejects the password | The keypad is case-sensitive; copy it exactly |
| Elena has left | She was pressured; she is gone for good and the control room password has to come from the other source |
| Park swings at you on the second visit | He warned you; show him the page or expect a fight |
| The Cascade Control System will not open | The attack host is still running; finish the server work (see the companion sheet) |
| HaX says the redirect window is shut | The 40 minutes ended, or the cascade clock started; it goes in the report as found |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>Dr Mercer's casualty projection</summary>

A signed page on the console beside Dr Mercer. It lists the human cost of the sequence by category, and a reviewer's handwritten note at the foot says it is the third submission. It is the page Park needs, and the page Mercer is made to read back.

</details>

<details markdown="1">
<summary>Recovered Site Reference: Tomb Gamma</summary>

A redacted fragment tucked behind the splice in the cable vault. It names a site that the Architect calls his workshop and has had its coordinate field stripped. Reading it opens a conversation with HaX.

</details>

<details markdown="1">
<summary>Intercepted Mail: Deployment Confirmed</summary>

A printed message pulled off the compromised host and left in the vault. It was sent to the Architect from a SAFETYNET address before the order went out. Reading it opens a conversation with HaX.

</details>

<details markdown="1">
<summary>The Evacuation Status Board and the 147-Substation Wall Map</summary>

The board by the checkpoint desk lists who has been counted clear of the building. The wall map on the operations floor has 23 transformer symbols circled in red. Neither is needed; both tell you how little time the night shift had.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises practise the same two skills you used in the game: applying a rule to a value, and comparing two documents. Use your own data, not anything from the game. Any current Linux distribution with `tail`, `date` and `diff` will do.

### Apply a rule to a serial {#cli-rule}

\==action: Take the last four characters of a made-up serial, and format a date as month then day==:

```bash
printf 'S/N 0412-9375' | tail -c 4; echo
date -d '2025-09-21' +%m%d
```

> Question: Both commands turn a public fact into four digits in one line. What does that say about how much protection a rule like this gives once an attacker knows it?

### Compare two documents {#cli-diff}

\==action: Compare two small files line by line==:

```bash
diff <(printf 'dormancy: 90 days\nmanifest: 300\n') <(printf 'dormancy: 9 days\nmanifest: 300\n')
```

> Question: The output marks the one line that differs and leaves the rest. How is this the same job you did by hand with the two briefs? What would you need to add to catch a difference that is not on a line of its own, such as a number buried in a paragraph?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: your ending may differ from a classmate's.

### 1. Badges and Physical Access {#q-physical}

> Question: Describe the routes you had into the server hall. Which did you use, what trail did it leave, and which would a defender find hardest to detect?

> Question: A badge print station was left logged in and a PIN was written on a handover sheet. List two small changes, neither of which costs money, that would have made the station useless to you.

> Action: Write a half-page access-control review for a small plant, covering card technology, visitor control and one control that would catch a cloned badge being used. Map each point to something you did in the game.

### 2. Codes, Rules and Records {#q-codes}

> Question: The vault keypad code was "the last four characters of the plate". What did that protect against, and what did it not? Who else in the building could have worked it out?

> Question: The plant log still carried the old code beside a note saying it was void. Would you keep the old value, remove it, or replace the note? Why?

> Action: Pick a code, PIN or password you use. Write down every place the rule for it exists (in your head, in a note, on a device). For each, say who else could reach it.

### 3. The Attack Host {#q-host}

> Question: The attack host ran four things that you reached in turn. Without naming a tool, say what the host's owner had assumed about who could reach each one. Which assumption was most damaging?

> Question: The host started a clock the moment you reached a certain stage. What does that tell you about how a real defender might notice someone has arrived?

> Action: For each of the four challenges you solved, write one change a defender could make that would have stopped that stage on its own. Say which two you would do first, and why.

### 4. Insiders, Evidence and Choices {#q-choices}

> Question: The visitor log, the handover sheet and the print history each said something small. How did putting them together turn suspicion into something you could say to Hollis's face?

> Question: Which operation did you commit the team to, and what did you know when you decided? If you changed your mind, or chose not to, what was the deciding fact?

> Question: Elena, Park, Hollis and Mercer each ended up somewhere. For one of them, what did you say or show that mattered most? Would you do it differently on a second run?

> Question: The debrief reads out what happened at the two crises you did not answer. Does knowing that in advance change how you would make the call? What does it say about how real crisis commanders are judged?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the operation you committed to, the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real incident.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m07-architects-gambit-vm-technical-steps/) sheet, for the attack host and its four flags.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Cyber-Physical Systems Security, on Authentication, Authorisation and Accountability, on Security Operations and Incident Management, and on Human Factors.
