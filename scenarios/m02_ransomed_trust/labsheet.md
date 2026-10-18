---
title: "Ransomed Trust (Break Escape Mission 2)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based crisis-response mission to learn how access works when the system that grants it is down: talk, borrow or pick your way through a hospital, deduce PINs from a lock that talks back, read a note hidden in ROT13, work out who inside held the door open, and decide how the wards recover."
overview: |
  A hospital's computers have been encrypted, and the system that issues every badge and door permission went down with them. Nobody in the building can grant you access to anything. Every door is now a person, a mechanical key, or a pick. Ransomed Trust asks you to work out which, one door at a time, while forty-seven patients are on backup power.

  You play a SAFETYNET agent booked in as an emergency security consultant at St. Catherine's Regional. That booking buys you a paper badge and nothing else. Your handler, Agent HaX, talks to you by phone. You win over a night receptionist for a key, earn the trust of the IT administrator who warned the board seven times, get past a security officer who has stopped believing your cover story, and open a store-room safe that someone left on a default code. Along the way you work out who inside the hospital helped the attackers, and you choose how St. Catherine's recovers and what the world gets to read about it.

  This sheet gets you started, explains the ideas behind each lock with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to full steps. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get them. The work on the hospital's backup server has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["social-engineering", "lockpicking", "physical-security", "pin-codes", "information-leakage", "rot13", "cyberchef", "encoding", "ransomware", "incident-response", "insider-threat", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "beginner"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m02_ransomed_trust/labsheet.md"
cybok:
  - ka: "MAT"
    topic: "Attacks and exploitation"
    keywords: ["Ransomware behavior", "Malware families"]
  - ka: "SS"
    topic: "Categories of Vulnerabilities"
    keywords: ["Supply chain compromise", "Backup systems", "File system security"]
  - ka: "SOIM"
    topic: "Security Operations and Incident Management"
    keywords: ["Incident Response", "Recovery procedures", "Ransomware response"]
  - ka: "F"
    topic: "Artifact Analysis"
    keywords: ["Encoding and alternative data formats"]
  - ka: "AC"
    topic: "Applied Cryptography"
    keywords: ["Encoding vs encryption", "ROT13", "Base64"]
  - ka: "HF"
    topic: "Human Factors"
    keywords: ["Social engineering", "Trust and vouching"]
  - ka: "CPS"
    topic: "Physical Security"
    keywords: ["Physical access control", "RFID access systems", "Lock bypass"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["Access control bypass", "Default and shared passwords", "Information leakage"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain why a hospital can lose every badge reader at once, and what is left to open a door (people, mechanical keys, an offline reader, a pick)
- describe how a pretext and a vouching colleague work as credentials, and why trust is something an attacker can earn or spend
- explain how a pin-tumbler lock gives itself away to a patient lockpicker
- spot a default or reused secret (a founding year, a name plus a year, a note on a monitor) and say why it is weak
- show how a lock that reports "how close you got" leaks its code, and work through the deductions by hand
- recognise ROT13, Base64 and hex on sight, decode each, and say why none of them is a form of security
- weigh up the choices the case forces, about the people you meet, the evidence you hold and how a hospital recovers

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes a few minutes and saves you time later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and a full set of steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The work on the hospital's backup server (the VM Access Terminal and the flags) is in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m02-ransomed-trust-vm-technical-steps/), so you can play the rest without it.

> Note: The server challenge is generated for your game. The flag values are not the same as anyone else's, so this sheet never gives you one. A few codes in the building are fixed, but each is something you work out from clues in the hospital; this sheet says where a clue is and what shape the answer takes, not what it reads.

## Getting Started {#getting-started}

You are a SAFETYNET field agent. ENTROPY's Ransomware Incorporated cell has encrypted St. Catherine's Regional Medical Centre. Forty-seven patients are on generators with about twelve hours of fuel, and the board votes on paying the ransom in four. Dr. Sarah Kim, the hospital's CTO, called SAFETYNET in. She cannot authorise a single door, because the system that does that is behind the ransom screen with everything else. Agent HaX runs you by phone.

You do not need any prior knowledge before you start. The field guides teach each idea as you reach it.

1. \==action: Start the Break Escape mission **Ransomed Trust**==.
2. \==action: Watch the briefing from Agent HaX and Director Netherton==, and ask any topics you want.
3. \==action: Find Bernie Nwosu on the night desk in reception== and get yourself signed in.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

A first run takes about 90 minutes to two hours, depending on how much you read and how much of the server work you do. In a 60-minute class, stop once you are standing in the server room (you will have the Server Room Keycard, and have got past the security officer), and resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents and field guides you are handed open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX) and a **Lock Pick Kit**. There is no badge that works on anything, which is the point of the mission.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[Where do I start?]**, **[Any tips for getting into the server room?]**, **[How do I get Gary to cooperate?]**, **[My booking's been pulled. What are my options?]** and **[I need the offline backup keys]**. There is always **[Remind me where we are.]** for a read of where you are.
- Field guides, the in-universe lab sheets. Choose **[Send me a field guide.]** and pick the one you want. The lockpicking guide is on offer from the start, the CyberChef guide after you have read a certain handwritten note, and the PIN oracle note once you find the device it explains. The exact options are listed in the stages below.

> Tip: Lock types in this hospital are few. A **key lock** opens with a key or a pick. A **PIN pad** wants four digits. A **password** box is case-sensitive, with no extra spaces. The **server room reader** wants a card that already exists, and nothing else will do.

> Warning: Walking past a problem is free, but hitting people is not. Anyone you knock out is recorded, it changes how some characters treat you, and it shows up in the debrief and credits. No ending is a failure, but you should know what you are choosing.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Do this once you have the **Ward Clerk's Laptop** (in the Night Handover room) or the **CyberChef Workstation** (in the server room). It uses made-up data, not anything from the game.

1. \==action: Open CyberChef and clear the recipe== if anything is in it.
2. \==action: Type `Fcner xrl` into **Input**==.
3. \==action: Search for `rot13` and double-click **ROT13**==. The output reads `Spare key`.
4. \==action: Clear the input and type `V2FyZCBsaW5r`==. ROT13 now gives nonsense. ==action: Remove ROT13 and add **From Base64**==. The output reads `Ward link`.
5. \==action: Clear the input and type `5369646520646f6f72`==. ==action: Remove From Base64 and add **From Hex**==. The output reads `Side door`.

You have just seen three ways of rewriting text so it is not obvious at a glance. The next section explains how to tell them apart.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### When the Access System Is Down {#access}

Access control has two halves. **Authentication** asks who you are. **Authorisation** asks what you are allowed to do. A hospital's badge system does both, from a central server that knows every card and every door group. When ransomware encrypts that server, every reader keeps working as a piece of hardware but has nothing to ask. The doors do not open, and nobody can issue a new card.

What is left is older and simpler:

| What still works | How it opens a door | What it costs an attacker |
| --- | --- | --- |
| A mechanical override key | Whoever holds the key | Persuading the holder, or picking the lock |
| A reader on its own offline controller | A card that already exists | Taking or being given an existing card |
| A person standing at the door | Whatever they decide to believe | Giving them a reason, or a pass they trust |
| A keypad | Four digits | Finding or working out the digits |

In this mission the Crisis Protocol Notice in reception explains the position to staff. The notice is useful to you too: it tells you which door types will still respond, and so where your effort should go.

> Question: The server room reader is on a standalone offline controller, "UNAFFECTED" by the attack. That choice kept one door working. It also made one person's card the only way through that door. What does that do to the risk, and who does it fall on?

### Trust as a Credential {#trust}

A lot of what opens doors tonight is a person's belief. Three ideas are worth having words for.

**Pretext.** A story that explains why you should be here ("I am the consultant Dr. Kim called in"). A pretext works until somebody can check it, and tonight nobody can check anything. When the booking is later pulled from the visitor system, the story stops working, because now somebody can disprove it.

**Vouching.** Someone the gatekeeper already trusts says you are fine. It beats an anonymous phone call because the gatekeeper has met the voucher. The voucher puts their own name against yours, so they will only do it if they trust you.

**Rapport and leverage.** People give more to someone who treats them as a professional. They also respond to evidence that you have read their file. Both work because they rest on something real about the person you are talking to. Which you use, and what you do with what you learn, is your decision.

The hospital's own weakness here is a normal one. Everyone is exhausted, the systems that check people are gone, and the habit of being helpful is still there.

> Question: Val Okonkwo says "Tonight I am the access control system. Me, a torch and a radio." What does that sentence tell you about where the risk moves when automated checks disappear?

### Pin-Tumbler Locks and Lockpicking {#lockpicking}

Most of the key locks here are pin-tumbler locks. Inside the cylinder are stacks of pins of different lengths. The right key lifts each stack to exactly the height where the split between its two pins lines up with the edge of the plug (the **shear line**), so the plug can turn.

A pick works because no lock is made perfectly. When you put light turning pressure on the plug with a **tension wrench**, one pin stack carries more of the load than the rest. It **binds**. You lift that pin until it sets, the plug turns a hair, and a different pin binds. You repeat until every pin has set. Too much tension makes every pin bind at once and nothing moves; too little and the pins fall back.

The skill is feel. You are not forcing the lock, you are reading it. The in-game minigame lets you do the same by watching which pin is binding.

To learn more in game, open your phone and choose **[Send me a field guide.]** then **[The lockpicking guide.]**. It is on offer from the start.

> Question: The picking minigame goes wrong when you push too hard on the tension. What does too much tension do to the pins, and why does that mean a light touch opens locks faster?

### Defaults, Reused Secrets and Institutional Dates {#weak-secrets}

Most of the PIN pads and passwords here are weak because of what is behind them, not how they are built. People reuse what they already remember: a family name and a year, the organisation's name, the year the building opened. Organisations do the same. A safe is set to the founding year because everyone can remember it, and then it is never changed.

| What you notice | What to try |
| --- | --- |
| A note on a monitor listing "embarrassing" passwords | Each one on the screen the note is stuck to |
| A code everyone could recite (a founding year, an anniversary) | That date as four digits |
| A diary entry reminding someone to change a code | The code written beside the reminder |
| Complaints about a code in an audit list or on a notice board | The thing the complaint says it is set to |

Shared and reused credentials are the same problem at scale. One password used across several systems means the weakest of them decides the strength of all of them.

> Question: A passage in an audit list says a safe's keypad is "still set to the hospital founding year" and that this has been flagged at three audits. Why do you think nobody fixed it, and what would a better process look like?

### A Lock That Talks Back {#oracle}

Some devices tell you more than "right" or "wrong". An **oracle** is any system whose answers leak information about a secret. In this mission an ENTROPY device called the PIN Cracker clamps onto a four-digit keypad and shows two numbers for each guess: how many digits are the right digit in the right place, and how many are right but in the wrong place. While it is clamped on, the keypad cannot lock you out.

You can see how powerful this is with a made-up safe. The secret is a four-digit code you do not know. Here are three guesses against a code of `5039`, with the lights you would see (green means right place, amber means right digit in the wrong place):

```
guess   green  amber
1234      1      0       the 3 is in the right place; 1, 2 and 4 are not in the code
5601      1      1       the 5 is in the right place; the 0 is in the code, wrongly placed
5890      1      2       the 5 is in the right place; the 9 and the 0 are in the code
```

From the first guess alone you can rule out the digits 1, 2 and 4 completely. After the third, only four codes out of ten thousand are consistent with everything you have seen: `1809`, `5038`, `5039` and `5084`. At most two more guesses finish it. You can check any of those four against the three rows above.

The lesson is general. A system that tells an attacker how close they got is leaking. A correct design says only "wrong", and locks out after a few tries.

To learn more in game, ask HaX for **[Send me a field guide.]** then **[The note on the PIN oracle.]** once you have found the device.

> Question: In the example, the first guess `1234` already removes three digits from the search. What is the best kind of first guess if you want to remove the most digits, and why?

### Encoding Is Not Security {#encoding}

Three schemes turn up in the field guides. None of them has a key, so none of them protects anything. They change the alphabet the data is written in.

**ROT13** is a Caesar cipher with a fixed shift of 13. Each letter moves 13 places: `A` becomes `N`, `B` becomes `O`. Spaces, digits and punctuation are left alone, so word lengths and shape survive. Because 13 is half of 26, running ROT13 twice gets you back to the start.

```
plain   N i g h t   h a n d o v e r
ROT13   A v t u g   u n a q b i r e
```

So `Night handover` becomes `Avtug unaqbire`. The giveaway is text that keeps normal spacing and word lengths but reads as gibberish, with no `=` padding.

**Base64** rewrites any data as printable text, using `A` to `Z`, `a` to `z`, `0` to `9`, `+` and `/`. It groups the bytes into blocks and writes each as one of 64 symbols, so its length is a multiple of four and it often ends in one or two `=` signs as padding.

```
plain     Ward link
Base64    V2FyZCBsaW5r
```

**Hexadecimal** writes each byte as two characters from `0` to `9` and `a` to `f`:

```
S  ->  53      i  ->  69      d  ->  64      e  ->  65
Side  ->  53696465
```

So `Side door` becomes `5369646520646f6f72`. Only digits and the letters `a` to `f`, in pairs, means hex.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| Scrambled letters, normal word lengths, no `=` | ROT13 (a shift cipher) | ROT13 |
| Mixed-case letters, digits, `+` or `/`, maybe trailing `=` | Base64 | From Base64 |
| Only `0` to `9` and `a` to `f`, in pairs | Hex | From Hex |

To learn more in game, open your phone and choose **[Send me a field guide.]** then **[The CyberChef guide.]**. It appears once you have read a certain handwritten note.

> Question: You find a note that reads `U3BhcmUga2V5`. Without decoding it, give two reasons you can be sure it is Base64 and not a shift cipher.

### Insiders and the Paper Trail {#insider}

Somebody on the inside held the door open for the attack. Insiders are hard to find because they have a reason to be where they are. Tonight's clues are ordinary documents: a rota, a post log, a visitor book with a line struck through, a handover board, a security officer's notebook. None of them says "this is the person". Each says one small thing, and the answer comes from putting them next to each other.

The reasoning is one you can check yourself. List every person who could have done it. Cross off anyone one fact rules out. Look for the one fact that points at somebody, and ask whether a second, independent source agrees. A name that fits a hunch but not a document is not a finding.

> Question: Two different people in the hospital call themselves "security" tonight. What kind of evidence separates them, and why does a badge number carry more weight than "he is not on the rota"?

### Ransomware, Backups and the Cost of Each Way Back {#ransomware}

Ransomware encrypts the data and sells you the key. A hospital's real options for getting back are few:

- **Pay**, which is usually the fastest, funds the attacker, and does not guarantee the attacker's software is gone from your systems.
- **Restore from backups**, which is only as good as the backup you can still trust. A backup taken after the attacker got in may carry their tooling with it. A **restore point** is a snapshot you have checked is clean.
- **Use an offline or air-gapped copy of the keys**, which the attacker could not reach, and which is slower.
- **Combine sources**, using one party's material to speed up another's.

Each option trades time, money, patient risk and who ends up with a way back into your network. The game does not rank them. Where it gives numbers, treat them as estimates. The point of the scene is that planning for this before the attack is cheaper than choosing between these options during it.

> Question: Gary Whitlock costed the fix at £85,000 and sent seven warnings. Where, in the list above, would that spend have changed which options you had on the night?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** or **Recipe** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock want: a key, a card, a word, four digits? And have I actually looked everywhere the last room offered?

### Before the First Lock: The Night Desk {#hints-start}

**Where:** reception, at the start. **Goal:** get signed in, and get a way into the IT department.

> Hint: No badge will open anything tonight, so the first lock is a person. Who has the key hook, and what would make her willing to use it?

<details markdown="1">
<summary>Nudge</summary>

Read the **Crisis Protocol Notice** and the **Reception Desk Visitor Log** before you talk to her. The notice explains why no card works. The log has your booking on it, with a line scored through in a different pen and no initials against the change. Note that, because it matters later.

Bernie Nwosu is the night coordinator, and she holds every mechanical override key on a hook behind the desk. You get the **IT Department Override Key** whichever way you talk to her. How you talk to her is still up to you, and she remembers it. Later in the night you may need somebody to speak for you, and that is only possible for someone who trusts you.

**Learn it:** ==action: Read the visitor log slowly== and say who could have scored out your booking, given who has been behind the desk all night. Then ask Bernie.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**. You can pick the IT door instead of asking for the key.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Crisis Protocol Notice and the Reception Desk Visitor Log==.
2. \==action: Talk to Bernie Nwosu== and answer in your own way. She signs you into her log.
3. \==action: Take the IT Department Override Key==.
4. \==action: Head through the ward vestibule, the ward approach and the Patient Ward==, then along the Ward Link to the Main Corridor.

</details>

> Warning: The override key opens the IT department and nothing else. The server room is not on any key, and nobody can cut you a card.

### Dr. Kim and the Way Through the Hospital {#hints-kim}

**Where:** the Patient Ward, the Ward Link, the Main Corridor, then the Night Handover room and the CTO Office. **Goal:** find Dr. Sarah Kim, and learn what she can and cannot do.

> Hint: Dr. Kim called you in. Find out what her authority is worth tonight, and look around the ward on the way.

<details markdown="1">
<summary>Nudge</summary>

From reception the route is east through the Ward Vestibule and Ward Approach, then north into the Patient Ward. Leave the ward by the west door to the Ward Link, go north up the Main Corridor, and north again into the Night Handover room. The doors off it are the Boardroom (west), the CTO Office (north) and the IT Department (east).

Dr. Kim cannot authorise you, but she signs your paper badge and points you at Gary. Ask her about the boardroom, a keypad you will want later, and about anything still offline in the building. Sister Doyle in the ward is optional. She is also the first person you meet who is not asking you for anything.

Any red ransomware screen can be read. Reading one satisfies the task about identifying who you are up against.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk to the Patient Ward and talk to Sister Doyle== if you want to (optional).
2. \==action: Continue to the Night Handover room and enter the CTO Office==.
3. \==action: Talk to Dr. Kim==. She signs your badge.
4. \==action: Read any ransom screen== (for example the Infected Terminal in the IT Department, or the Reception Workstation).

</details>

> Warning: The Visitor Badge (Countersigned) Dr. Kim gives you proves a person vouched for you. It opens nothing. Do not spend time trying it on readers.

### Gary Whitlock and the Server Room Card {#hints-gary}

**Where:** the IT Department, east of the Night Handover room. **Lock:** a key lock on the door (easy). **Goal:** get the **Server Room Keycard** from Gary.

> Hint: The server room reader only takes a card that already exists, and Gary Whitlock holds the only one. What does a man who has been ignored for six months want from the next person through his door?

<details markdown="1">
<summary>Nudge: getting in and getting the card</summary>

Use the override key on the door, or pick it. Gary has four ways to the card, and none of them is a dead end. Warmth and respect for his work get you the card plus more. A cold, transactional approach gets the card and nothing else. A blunt accusation makes him defensive, though he still hands it over. If you take the card by force, it drops with the spare lanyard. Whichever way you choose, you leave with the card.

Walking out without the card costs nothing and starts nothing. He is still there when you come back.

</details>

<details markdown="1">
<summary>Nudge: the filing cabinet</summary>

The **IT Filing Cabinet** in the room is a key lock (easy). It holds **Gary's Email Archive**, **Dr. Kim's Reply** and a **CryptoSecure Recovery Services Document**. Gary lost the key years ago. The cabinet is worth opening, and Gary reacts to what is in it. If you put the seventh warning in front of him he treats you differently, whatever state he was in before.

**Learn it:** ==action: Open the picking minigame on the cabinet== and notice which pin binds first. Then read the lockpicking guide for why the order is not left to right.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Unlock the IT Department door== with the override key (or pick it).
2. \==action: Talk to Gary Whitlock== and ask about the server room.
3. \==action: Take the Server Room Keycard== when he gives it, or by whatever route you chose.
4. \==action: Optionally, pick the IT Filing Cabinet and read what is in it==.

</details>

> Warning: The reader logs every swipe, and the card has Gary's name on it. Gary will want your report to say how you came by it.

### Gary's Workstation and the Sticky Note {#hints-gary-pc}

**Where:** the IT Department. **Lock:** the password on **Gary's Workstation**. **Goal:** read his notes on the backup server.

> Hint: The password is not hidden. Somebody has written the likely candidates on a note and stuck it to the monitor.

<details markdown="1">
<summary>Nudge</summary>

Read **Gary's Password Sticky Note**. It lists a short run of passwords he describes as embarrassing. They are built from the same sorts of facts as the codes in this hospital. One of them opens the workstation. Look at each and decide which would be the habit of a man who has used the same ones for four years.

**Learn it:** ==action: Before you type anything, rank the entries on the note== by how likely each is to be reused on a work machine. Then test your ranking.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read Gary's Password Sticky Note==.
2. \==action: Try the entries on Gary's Workstation one at a time==, exactly as written.
3. \==action: Open the notes it holds and read them==. They are about the backup server; the companion sheet picks that up.

</details>

> Warning: The password box is case-sensitive, with no extra spaces. If an entry is rejected, check you copied it exactly before assuming it is wrong.

### Val Okonkwo and the Security Office {#hints-val}

**Where:** the Main Corridor, then the **Security Office** at its west end, then the Server Room beyond. **Lock:** a key lock on the Security Office door (easy), with Val Okonkwo standing in front of it. **Goal:** get through the Security Office.

> Hint: Whoever stands at that door decides if it opens tonight. A person can open it, a key can, a pick can. What does Val need to believe before she acts?

<details markdown="1">
<summary>Nudge: what changes once you hold the card</summary>

Before Gary's card changes hands, Val is friendly and tells you to come back with it. Once it has changed hands, your booking is pulled from the visitor system and she meets you with a very different question: security control says no consultant was ever booked. HaX calls to warn you. The challenge is not a failure of the mission, and none of the ways past her costs you the mission.

Ways past her:

- a real hospital pass, blank and without a name: Gary has a spare contractor lanyard if he trusts you enough, Sister Doyle keeps agency lanyards in a drawer and may share one if she trusts you, and there is a wrapped contractor lanyard lying in the Night Handover room
- somebody she trusts vouching for you: Bernie will put her own name against you, but only if she trusts you
- earning it by how you have treated Val yourself
- picking her door while she is walking away from it
- force, which Val will answer

Your choice of route is recorded and read back to you at the end.

</details>

<details markdown="1">
<summary>Nudge: picking near her</summary>

The Security Office is a key lock (easy). If Val sees the pick in your hands, she stops you. The first time she gives you a chance to explain, and she logs it. The second time she is much less forgiving.

**To learn more in game:** ask HaX **[My booking's been pulled. What are my options?]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go to the Main Corridor and talk to Val Okonkwo==.
2. \==action: Show her a lanyard, ask Bernie to vouch, or pick the route you prefer==.
3. \==action: Walk through the Security Office to the west door==, the Server Room.

</details>

> Warning: If you start a fight with Val she stops talking to you for the rest of the night. The Security Office door can still be picked once she has walked away from it.

### The Server Room {#hints-server-room}

**Where:** the Server Room, west of the Security Office. **Goal:** get in and reach the VM Access Terminal.

> Hint: This door wants Gary's card, not a key and not a pick. Inside is a field box wired to the one network segment that reaches the backup server, a drop-site terminal, a recovery console and a rack.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Use the Server Room Keycard on the reader==.
2. \==action: Walk in and approach the VM Access Terminal==.
3. \==action: Look around the room== (the CyberChef Workstation, the Hospital Recovery Console, the rack and its contents).

</details>

> Warning: The reader only responds to a card that already exists. If it refuses you, check the Server Room Keycard is in your inventory.

> Note: The server work has its own sheet, so you can play the rest spoiler-free and tackle the network yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m02-ransomed-trust-vm-technical-steps/) when you want the hints for the backup server and its flags.

### The Handwritten Note in the Rack {#hints-decode}

**Where:** inside the rack door in the Server Room, with the CyberChef Workstation next to it. **Clue:** **Handwritten Note, Taped Inside the Rack**.

> Hint: The letters are wrong, but the word lengths and the spaces look right. Whoever wrote it was hiding it from a passing glance, not from you.

<details markdown="1">
<summary>Nudge</summary>

Letters scrambled with normal word lengths and no `=` is a shift cipher, and thirteen is the usual shift. Take the **CyberChef Workstation** (or use the Ward Clerk's Laptop), paste the note into **Input** and add **ROT13**. The note is not a lock input. It tells you something about what the person who wrote it expects the hospital to do.

**Learn it:** ==action: Decode the first word of the note by hand==, shifting each letter back 13 places, then check it in CyberChef.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The CyberChef guide.]**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Take the CyberChef Workstation== from the Server Room.
2. \==action: Paste the note into **Input**==.
3. \==action: Add **ROT13**== and read the output.

</details>

> Warning: ROT13 is its own reverse. If the output still looks like nonsense, you have probably run it twice or on the wrong text.

### The Emergency Store Safe {#hints-safe}

**Where:** **Emergency Storage**, off the east side of the Patient Ward. **Lock:** the **PIN-Locked Safe** (a four-digit PIN). **Goal:** the **Offline Backup Encryption Keys**.

> Hint: The code is something everyone in this building could recite. People have complained about it on notices and audit lists, and the hospital has written the clue on its own wall.

<details markdown="1">
<summary>Nudge: finding the code</summary>

Four places name the kind of code it is: the **Estates Audit Snag List** in the Night Handover room (read item 19), the **Nurse's Handwritten Note** in the Ward Approach, Sister Doyle if she trusts you, and Dr. Kim if you ask her about anything still offline. The **Hospital Founding Plaque** in reception holds the number they all point at. Enter it as four digits.

The same code opens **Dr. Kim's Safe**, which is optional.

</details>

<details markdown="1">
<summary>Nudge: the other way in</summary>

If you cannot find the code, there is a second route. Behind the rack in the Server Room is a **Sealed Equipment Case** with a cheap four-pin lock. No key in the building fits it, so pick it (medium). Inside is the **PIN Cracker** and an **ENTROPY Asset Tag**. Clamp the cracker onto the safe's keypad and read the lights: greens are the right digit in the right slot, ambers are the right digit in the wrong slot. Four or five rows usually settle it.

**Learn it:** ==action: Write your first three guesses on paper before you try them== and predict the lights. If your prediction is wrong, work out which digit you misjudged. The example in the concepts section shows how few guesses are needed.

**To learn more in game:** once you have the cracker, ask HaX **[Send me a field guide.]** then **[The note on the PIN oracle.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Estates Audit Snag List and the Hospital Founding Plaque==.
2. \==action: Go to Emergency Storage and enter the four-digit code on the PIN-Locked Safe==.
3. \==action: Take the Offline Backup Encryption Keys==.

</details>

> Warning: A year on a photograph or a sticky note is not automatically the right one. Check that the clue is about this safe before you type.

### Who Let Them In? {#hints-insider}

**Where:** the Night Handover room, the Security Office, the Boardroom and Val's notebook. **Goal:** work out who inside the hospital helped the attackers, and name them when you can show why.

> Hint: Each document says one small thing. The answer is in the places two of them agree. Ghost's own records name a badge number, and a badge number appears on rotas and post logs.

<details markdown="1">
<summary>Nudge: the trail</summary>

Start with Bernie. Ask whether anyone has come through tonight who does not belong. Then read the **Night Handover Board** in the Night Handover room: look at Friday's fire drill and who authorised it. Ask Val about drills, and take her notebook (**Val's Pocket Notebook**). In the Security Office the **Night Rota** shows who is on the books and which badge number they carry. The **Night Security Post Log** is in the Boardroom; its door is a keypad, and **Dr. Kim's Desk Diary** and Dr. Kim herself both know the code.

The badge number you need to compare against comes out of the server work, so you will not be able to finish this stage until you have made progress there.

**Learn it:** ==action: Make a list of every name and number== you have found, and cross off anyone a document rules out.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the Night Handover Board, the Night Rota and the Night Security Post Log==.
2. \==action: Talk to Val and take her notebook==.
3. \==action: Compare the badge numbers== once you have the one from Ghost's records.
4. \==action: Open your phone and choose the option about whose badge it is== (it appears once the number is found), or tell them to their face.

</details>

> Warning: Accusing the wrong person is recorded as a wrong suspect. Gary and Dr. Kim will not take it well, and if you push Gary he turns hostile. A name has to be backed by a document, not a feeling.

### The Recovery Console {#hints-recovery}

**Where:** the **Hospital Recovery Console** in the Server Room. **Goal:** choose how St. Catherine's recovers.

> Hint: The console shows what it still needs for each option. Read the list before you choose, and think about what each option costs, not only how fast it is.

<details markdown="1">
<summary>Nudge</summary>

The console will not restore anything without a **Verified Restore Manifest**, which is the restore point it can trust. That item comes from the server work. The options differ by which key sets you give it. The offline escrow keys come from the Emergency Storage safe, and other key material comes from the server work too. The console lists each slot as loaded or missing, so you can see why an option is greyed out.

Ghost may call you at the console with an offer. It is an option on the table, not a trap you have to avoid. After you choose, keep an eye on your phone: if the ward needs you, HaX tells you. HaX will not say which option is right.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the Hospital Recovery Console== and read each slot.
2. \==action: Load what you hold== (the manifest and the offline keys, if you have them).
3. \==action: Choose a restore source and confirm==.
4. \==action: Check your phone and the ward== if HaX says someone needs you.

</details>

> Warning: The console refuses to restore with "No verified restore manifest" until you hold one. Open the companion sheet if you are stuck there.

> Note: What the console needs from the server work (the manifest and the other key material) is covered in the companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m02-ransomed-trust-vm-technical-steps/).

### The Communications Terminal and the Debrief {#hints-finale}

**Where:** the **Hospital Communications Terminal** in the Boardroom. **Goal:** the last decision, and the debrief with HaX. What you choose is your decision. No ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: The terminal in the Boardroom decides what the public gets to read about tonight. It stays locked until the server work is done and the hospital has chosen how to recover.

<details markdown="1">
<summary>Nudge</summary>

You can transmit everything or keep it internal. If you found optional evidence on the way, the transmission carries it. The terminal asks you to confirm either choice and lets you back out first. If you have not yet named the insider, expect to meet them here. Afterwards, HaX debriefs you, and the credits read back what you did.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Several decisions run through the night, and each shows up in the ending:

- **Gary.** Whether you promise to protect his record, and whether Dr. Kim's signed statement or the board's email about him come into it. If you never raise it, the board's account stands.
- **Dr. Kim and the board vote.** What you tell her to do about the ransom is remembered and read back against what you do at the console.
- **The recovery console.** Time, money, patient risk and who keeps a way in all pull in different directions. Ghost's offer, if you take it, comes with a promise you can keep or break at the terminal.
- **The insider.** You can arrest them quietly, name them publicly, hand them to SAFETYNET or fight them. If you never name them, they confront you at the terminal and walk out. You can also accuse the wrong person.
- **Civilians and staff.** You can knock out Bernie, Dr. Kim, Gary, Val, the nurses or a patient. The debrief and credits record each.
- **Exposure.** Whether the hospital's failures reach the public, and whether Gary's warnings do.

None of these is scored right or wrong by the game. They change who is safe at the end, what gets said in public, and what SAFETYNET walks away with.

</details>

After you decide, ==action: finish anything you still want to read, then take the debrief with HaX==.

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The IT department door does not open | You need the IT Department Override Key from Bernie, or to pick it |
| The Security Office door does not open | Val has not opened it. Pass her, or pick it while she is walking away from it |
| The server room reader refuses | You do not hold the Server Room Keycard. No key or pick works on that door |
| Gary's Workstation rejects the password | An entry is mistyped or in the wrong case. Copy it exactly as it is written on the note |
| The Emergency Store Safe rejects a code | The clue you used is about something else. Check the audit list and the plaque |
| The PIN Cracker shows amber but no green | The right digit is in the wrong slot. Move it |
| CyberChef output is still gibberish after ROT13 | The text is not ROT13, or you ran it twice. Check the shape against the table |
| Val says "Stay where you are" | Your cover has been pulled. Show her a pass, have Bernie vouch, or find another way |
| Val will not talk to you | You went for her. Pick the Security Office door once she walks away |
| Gary says "Get out" | You accused him. A seventh warning from his cabinet can still bring him round |
| The console says "No verified restore manifest" | You have not recovered one yet. It comes from the server work |
| The console says the offline escrow keys are not loaded | The Emergency Storage safe is still shut |
| The Communications Terminal will not open | The server work is not finished, or you have not yet chosen a recovery option |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>Dr. Kim's Safe</summary>

A small safe in the CTO Office, set into the wall behind a framed certificate. It uses the same kind of code as the one in Emergency Storage. Inside is a Zero Day Syndicate invoice, which itemises what the attackers paid for the way into this hospital.

</details>

<details markdown="1">
<summary>Val's notebook and the fire drill</summary>

Val has been logging an unscheduled fire drill and a man nobody can place for weeks. If you ask about drills and treat her as a colleague rather than a gate, she gives you the pages. They help with the insider stage.

</details>

<details markdown="1">
<summary>The ward and its patients</summary>

Sister Doyle, Nurse Raval, Mr Pryce in Bed 4, Mrs Hargreaves in Bed 2 and Ms Chen in Bed 5 each have a short conversation. There are paper charts, a Manual BP Cuff and the Bed 4 Ventilator Panel. None of it is needed to finish, but it shows what the outage is costing.

</details>

<details markdown="1">
<summary>The appointment card on the chairs</summary>

An outpatient left a card on the chairs in the Ward Vestibule. It is a small thing, and Bernie's note on the back says how it ended.

</details>

<details markdown="1">
<summary>The Planted Network Device</summary>

A compact wireless bridge in the IT Department that is not hospital equipment. Interacting with it puts you in touch with the person behind the attack.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise the decoding and deduction techniques safely, with your own data, not anything from the game. Use any current Linux distribution with `base64`, `tr`, `xxd` and `python3` available.

### Encoding by hand and by tool {#cli-encoding}

\==action: Encode and decode Base64, ROT13 and hex==:

```bash
printf 'Ward link' | base64
printf 'V2FyZCBsaW5r' | base64 -d; echo
printf 'Night handover' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'Avtug unaqbire' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'Side door' | xxd -p
printf '5369646520646f6f72\n' | xxd -r -p; echo
```

> Question: Run the ROT13 command on its own output. Why do you get the original text back? What does that tell you about using ROT13 to protect anything?

### Peeling a layered encoding {#cli-layered}

\==action: Wrap one scheme in another, then undo it in the right order==:

```bash
printf 'Night handover' | tr 'A-Za-z' 'N-ZA-Mn-za-m' | base64
printf 'QXZ0dWcgdW5hcWJpcmU=' | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m'; echo
```

> Question: The encode pipeline runs ROT13 then Base64. The decode pipeline runs `base64 -d` then ROT13. Why is the decode the reverse order?

### Scoring guesses like the PIN Cracker {#cli-oracle}

\==action: Save this as `oracle.py` and run it with `python3 oracle.py`==. It scores each guess against a secret you choose, then shows how many four-digit codes are still possible.

```python
import itertools
from collections import Counter

def feedback(secret, guess):
    in_place = sum(a == b for a, b in zip(secret, guess))
    shared = sum((Counter(secret) & Counter(guess)).values())
    return in_place, shared - in_place

secret = "5039"   # pick your own four digits
candidates = ["".join(p) for p in itertools.product("0123456789", repeat=4)]
for guess in ["1234", "5601", "5890"]:
    result = feedback(secret, guess)
    candidates = [c for c in candidates if feedback(c, guess) == result]
    print(guess, result, len(candidates), "left")
print(candidates)
```

With the secret above, the script prints 1372, 151 and 4 as the numbers left, then lists the four codes from the concepts section. Change the secret and the guesses.

> Question: Replace the guesses with `0000`, `1111` and `2222`. How many codes are left after each guess, and which guess told you the most? Why?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: the server challenge was generated for you, and your ending may differ from a classmate's.

### 1. Access Control When the System Fails {#q-access}

> Question: Describe the four things that still opened doors at St. Catherine's once the access system was down (a mechanical key, an offline reader, a person, a keypad). For each, say who could have misused it and what the hospital could do to limit that.

> Question: You cleared Val Okonkwo by one route out of several. What did that route require of you, and what would have stopped an attacker using the same route?

> Action: Write a half-page business-continuity note for a hospital whose access system is encrypted. It should cover how doors are opened safely, who can authorise a manual override, how overrides are logged, and one control that would have caught the struck-through booking sooner. Map each point to something you saw in the game.

### 2. Secrets, Oracles and Encoding {#q-secrets}

> Question: Gary's sticky note, the founding-year safe and the boardroom code in Dr. Kim's diary all failed in the same way. What is the common weakness, and what single change would have helped most?

> Question: The PIN Cracker needed only a handful of guesses to find a four-digit code. What did it tell you each time that a plain keypad would not, and how would you design a keypad so that it could not be used like this?

> Question: Whoever wrote the note in the rack used ROT13 to hide it from a passing glance. When is that enough, and when is it not? What would you need to add to make the note actually secret?

> Action: Take a sentence of your own. ROT13 it, then Base64 the result. Swap with a classmate and race to recover each other's sentence. Note which clue told you the order to undo them in.

### 3. The Backup Server {#q-server}

> Question: Gary's notes say the backup server held every clinical backup, ran a tampered release of its software from 2010, and used a shared admin login that had never been changed. For each of those three weaknesses, say what a defender could have changed and roughly what it would have cost.

> Question: The hospital ran a trojaned release for fourteen years after a clean one was available. This is a supply-chain problem. How would a team find out that something they had installed was compromised, and what practices reduce the risk of installing it in the first place?

> Question: The same server was reachable from the one network segment you were patched into. What does that tell you about how a hospital should place the system that holds its recovery data?

> Action: List five systems you use regularly (your laptop, a phone, a router, a cloud account, a game). For each, write down where its version number can be found and how you would know if an update was tampered with. Note which ones you could not answer for.

### 4. People, Evidence and Choices {#q-choices}

> Question: Gary warned the board seven times and was told to stop escalating. What did you decide to do about his record, and what did you know when you decided? Would you choose differently on a second run?

> Question: At the recovery console the options traded time, money, patient risk and who kept a way into the network. Which did you choose, what did you weigh most, and which number on the screen did you trust least?

> Question: Ghost's manifesto argued that St. Catherine's was chosen because its paper trail was immaculate. How should that change the way a hospital treats a warning it has decided not to act on?

> Question: You could have knocked out Bernie, Val, Gary or a nurse to save time. What did the game record when you did (or what would it have recorded), and what does that cost model say about real operations?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/), [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/) and [Information Leakage and the PIN Oracle](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/information-leakage-and-the-pin-oracle/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m02-ransomed-trust-vm-technical-steps/) sheet, for the work on the hospital's backup server.
- The CyberChef documentation and wiki, and its Magic operation for recognising unknown encodings.
- National Cyber Security Centre guidance on mitigating ransomware and on planning an incident response, for how real organisations prepare for a night like this one.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Malware and Attack Technology, on Security Operations and Incident Management, on Human Factors, on Physical Layer Security and on Applied Cryptography.
