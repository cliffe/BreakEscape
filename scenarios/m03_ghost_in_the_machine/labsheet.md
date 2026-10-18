---
title: "Ghost in the Machine (Break Escape Mission 3)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based infiltration mission to learn how physical and network attacks chain together: clone RFID keycards, decode ROT13, Base64 and hex in CyberChef, scan a training network, exploit a ProFTPD source backdoor and a legacy distcc daemon, and read the paper trail behind a hospital ransomware attack."
overview: |
  A real intrusion rarely stays in one place. You talk your way through a front door, copy a card off someone's lanyard, come back after hours, and then move onto an isolated network to pull the evidence that proves what a company has been selling. Ghost in the Machine puts that whole chain into one mission.

  You play a SAFETYNET agent sent undercover into WhiteHat Security Services, a respectable penetration-testing firm that runs Zero Day Syndicate's exploit marketplace out of its back rooms. Zero Day sold the way into St. Catherine's Hospital. Your handler, Agent HaX, and the analyst Nightshade run the operation from HQ. You clone the receptionist's badge, clone the CEO Victoria Sterling's executive card while you interview as a recruit, then return at night to get onto the training network, exploit its services, crack Sterling's office, and decode the records that name the buyer and the next target. The mission ends with decisions about the people who made that night possible.

  This sheet gets you started, explains the ideas behind each lock with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to a full recipe. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get them. The training-network work has its own companion sheet. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["rfid", "mifare", "cloning", "nmap", "reconnaissance", "proftpd", "backdoor", "distcc", "cve-2004-2687", "base64", "rot13", "hex", "cyberchef", "encoding", "lockpicking", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m03_ghost_in_the_machine/labsheet.md"
cybok:
  - ka: "NS"
    topic: "Network Security"
    keywords: ["nmap scanning", "Service enumeration", "Banner grabbing", "Network reconnaissance"]
  - ka: "MAT"
    topic: "Attacks and exploitation"
    keywords: ["ProFTPD 1.3.3c source backdoor", "CVE-2004-2687", "distcc exploitation", "Remote code execution"]
  - ka: "AC"
    topic: "Applied Cryptography"
    keywords: ["Encoding vs encryption", "ROT13", "Base64", "Hexadecimal", "Multi-layer decoding"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["RFID authentication", "Default and reset passwords", "Access control bypass", "Credential theft"]
  - ka: "CPS"
    topic: "Physical Security"
    keywords: ["Physical access control", "RFID cloning", "Lock bypass", "PIN code systems"]
  - ka: "HF"
    topic: "Human Factors"
    keywords: ["Social engineering", "Cover identity", "Trust exploitation"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain how an RFID badge is read and copied, and why a weak-default card falls in seconds while a custom-key card needs a recovery attack
- tell Base64, ROT13 and hex apart on sight, decode each by hand and in CyberChef, and say why none of them is a form of security
- peel a layered encoding (one scheme wrapped in another) and know which order to undo it in
- recognise reset and default passwords, and explain why a slip on a monitor undoes a strong policy
- weigh up the choices a case like this forces, about the people you meet and the evidence you hold

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes a few minutes and saves you far more later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and a full recipe hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The server steps (the training-network stages and the four VM flags) are in the linked companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine-vm-technical-steps/), so you can play the rest without them.

> Note: The network mission is generated for your game. The flag values on the training VMs are not the same as anyone else's, so this sheet never gives you one, only the way to find it. The office password and the safe code are the same each game, but they are still things you work out from clues in the building; this sheet says where each clue is and what shape the answer takes, not what it reads.

## Getting Started {#getting-started}

You are a SAFETYNET field agent. The firm WhiteHat Security Services runs legitimate audits by day and Zero Day Syndicate's exploit marketplace by night. Zero Day sold the exploit that took down St. Catherine's Hospital. Your cover is a freelance penetration tester that Victoria Sterling, WhiteHat's CEO, is looking at as a recruit. That cover gets you an afternoon interview. The real work happens after dark, when you come back for the training network and the paper trail. Agent HaX runs you by phone; Nightshade handles the technical bridge from HQ.

You do not need any prior knowledge before you start. The field guides teach each idea as you reach it.

1. \==action: Start the Break Escape mission **Ghost in the Machine**==.
2. \==action: Watch the briefing from Agent HaX and Director Netherton==, and ask any topics you want. Then choose how you want to play it.
3. \==action: Sign in at reception with Ffion Rees== to get your visitor badge.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

The mission takes about 75 to 90 minutes. In a 60-minute class, stop once the day turns to night and you are back in the building with all four flags still to do (around the halfway mark), and resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents and field guides you are handed open as readable pages you can reopen at any time.

Your kit at the start is the phone (Agent HaX), an **RFID cloner**, and a **lock pick kit**. There is no PIN cracker this time.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[How do I clone these keycards?]**, **[How do I get past the locked doors?]**, **[How do I get into Sterling's computer?]**, **[Where do I start on their network?]** and **[How do I read what I've found?]**. Each appears once you are in the right situation, and there is always **[Where do I stand?]** for a read of where you are.
- Field guides, the in-universe lab sheets. Choose **[Send me a field guide.]** and pick the one you want. Each guide appears on that menu only once you have reached the challenge it covers. The exact options are listed in the stages below.

> Tip: The RFID flow is always the same three steps: read the card, crack the keys, then emulate the saved card at the reader. If a door will not open, check you emulated the right card: the conference door wants the receptionist's badge, the server room wants Sterling's executive card.

> Tip: The office computer and the wall safe each want an exact value. A password is case-sensitive, with no extra spaces. A PIN is four digits. Copy decoded text with the mouse rather than retyping it.

> Warning: Save the cloned card. The read is not kept until you press Save in the cloner; close it early and you have to read the card again.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Do this once you have taken the CyberChef workstation (a laptop in the server room, at night). It uses made-up data, not anything from the game.

1. \==action: Open CyberChef and clear the recipe== if anything is in it.
2. \==action: Type `TGFi` into **Input**==.
3. \==action: Search for `base64` and double-click **From Base64**==. The output reads `Lab`.
4. \==action: Clear the input and type `Xrlpneq`==. From Base64 now gives nonsense. ==action: Remove From Base64 and add **ROT13** instead==. The output reads `Keycard`.
5. \==action: Clear the input and type `5a65726f20446179`==. ==action: Remove ROT13 and add **From Hex**==. The output reads `Zero Day`.

You have just seen the three schemes Zero Day uses to hide its records. The next section explains how each one works, and what to do when one is wrapped inside another.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### RFID Cloning: Weak Defaults and Custom Keys {#rfid}

An RFID badge is a tiny chip that answers a reader over a short range. A MIFARE Classic card stores its data in sectors, each locked by a key. The card is only as safe as those keys.

| What the card uses | What it costs an attacker |
| --- | --- |
| Factory default keys (`FFFFFFFFFFFF` and a short list of known ones) | A dictionary attack tries the known keys and reads the card in seconds |
| Custom keys the owner set | A recovery attack (for example the "Darkside" or "nested" attacks) exploits weaknesses in the card's authentication to recover the key, in under a minute |

In the mission, the receptionist's **Staff Access Badge** uses weak defaults, so cloning it is near instant. Victoria Sterling's **Executive Keycard** uses custom keys, so you read it, then run the recovery attack, which takes about half a minute. Your cloner is passive until you trigger it, so the trick with Sterling is to start the read while standing close and keep her talking until it finishes. A card anyone can read from an arm's length away is a key you have handed out.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**. It covers read, crack and emulate, and the two attacks.

> Question: The receptionist's badge and Sterling's card both open doors, but one takes seconds to copy and one takes half a minute of standing next to her. What single decision by WhiteHat made the difference, and why did it not make the card safe, only slower to clone?

### Encoding Is Not Security {#encoding}

Three schemes turn up in this mission. None of them has a key, so none of them protects anything. They only change the alphabet the data is written in.

**ROT13** is a Caesar cipher with a fixed shift of 13. Each letter moves 13 places: `A` becomes `N`, `B` becomes `O`. Spaces, digits and punctuation are left alone, so word lengths and shape survive. Because 13 is half of 26, running ROT13 twice gets you back to the start.

```
plain   N i g h t   t e a m
ROT13   A v t u g   g r n z
```

So `Night team` becomes `Avtug grnz`. The giveaway is text that keeps normal spacing but reads as gibberish, with no `=` padding.

**Base64** rewrites any data as printable text, using `A`–`Z`, `a`–`z`, `0`–`9`, `+` and `/`. It groups the bytes into blocks and writes each as one of 64 symbols, so its length is a multiple of four and it often ends in one or two `=` signs as padding.

```
S        a        b        l        e
01010011 01100001 01100010 01101100 01100101
Base64 -> U2FibGU=
```

So `Sable` becomes `U2FibGU=`. One unbroken block of mixed-case letters, digits, `+` and `/` is Base64, not English.

**Hexadecimal** writes each byte as two characters from `0`–`9` and `a`–`f`. A string shows up as pairs:

```
H  ->  48      i  ->  69
Hi ->  4869
```

So `Hi` becomes `4869`, and `Zero Day` becomes `5a65726f20446179`. Only digits and the letters `a` to `f`, in pairs, means hex.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| Scrambled letters, normal word lengths, no `=` | ROT13 (a shift cipher) | ROT13 |
| Mixed-case letters, digits, `+`/`/`, maybe trailing `=` | Base64 | From Base64 |
| Only `0`–`9` and `a`–`f`, in pairs | Hex | From Hex |

> Question: You find a note that reads `U2FibGU=`. Without decoding it, give two reasons you can be sure it is Base64 and not a shift cipher. What single character is the strongest clue?

### Layered Encodings {#layered}

One scheme can be wrapped inside another. If you decode once and the output still looks like nonsense, it is probably layered, so decode again.

The order matters: you undo the layers in the reverse of the order they were applied. If something was ROT13'd and then Base64'd, you run **From Base64** first, then **ROT13**.

```
plain          Grid first
ROT13          Tevq svefg
then Base64    VGV2cSBzdmVmZw==
```

To recover it: From Base64 gives `Tevq svefg` (still scrambled), then ROT13 gives `Grid first`. In CyberChef you just stack the two operations in that order.

> Question: You run From Base64 on a block and get text that is readable characters but still makes no sense. What does that tell you, and what is the next operation to try?

### Weak and Reset Passwords {#passwords}

A password policy is only as strong as the weakest way around it. The common failure is a reset to a predictable house default that the user never changes, with a reminder left where anyone can read it.

Sterling's office computer was reset to a default built from two public facts: her surname, and the year the firm was founded. The helpdesk slip stuck to her monitor spells out the format; the founding year is on the plaque in reception (and HaX mentions it in the briefing). Put the two together and you have the password. The lock is case-sensitive, so match the capital letters exactly.

> Question: The helpdesk slip tells an attacker the exact format of the password. Even if Sterling had picked a strong, random password instead, what one habit in this office would still have undone it?

### One Supplier in a Network {#entropy}

The records you recover describe Zero Day as a supplier, not an attacker: it arms the cells that run the attacks, and it answers to figures above it ("0day", and above them "The Architect"). The transaction log and the catalogue show a Phase 2 aimed at infrastructure. Taking Sterling off the board closes this supplier's front; it does not end the network behind her. Keep that in mind at the end.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** or **Steps** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock or terminal want: a card, a password, a PIN, a flag? And have I actually looked everywhere the last room offered?

### Before the First Lock: Reception {#hints-start}

**Where:** reception, at the start. **Goal:** get a visitor badge and a way through the conference-room card reader.

> Hint: Your visitor badge gets you into reception, not past the staff card reader. What does the person at the desk have clipped to her lanyard, and what is in your kit for copying it?

<details markdown="1">
<summary>Nudge</summary>

Talk to Ffion Rees and sign in for your visitor badge. The conference-room door off the main hallway is a staff card reader, and a visitor badge will not open it. Your RFID cloner can copy her **Staff Access Badge** from arm's length while you chat. The clone option appears after you have either tried the reader once or asked HaX about cloning.

**Learn it:** ==action: Try the conference-room reader first with just your visitor badge== so you see it refuse, then go back to Ffion. The option to lean in and copy her badge is now on her menu.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Ffion Rees and sign in== to get your visitor badge.
2. \==action: Choose **[Lean in by her lanyard and let the cloner read her badge.]**== (after trying the reader or asking HaX about cloning).
3. \==action: In the cloner, read the badge, run the dictionary attack, and press Save==.
4. \==action: Emulate the saved Staff Access Badge at the conference-room reader== to open the door.

</details>

> Warning: The clone only counts once you press Save. If you close the cloner first, come back to Ffion and the lean-in option is offered again.

### Meeting Sterling and Cloning Her Card {#hints-clone-victoria}

**Where:** the conference room. **Goal:** clone Sterling's executive card while you interview.

> Hint: Her card is custom-key, so it needs a longer read. The read runs while you are standing close to her. Where in the room can you stand next to her and keep her talking?

<details markdown="1">
<summary>Nudge</summary>

Ask her about the training lab on the whiteboard. Going to the board puts you next to her and starts the cloner reading; the custom-key recovery attack takes about half a minute, so keep her talking about the lab while it works. Play the curious recruit. If you push her with pointed or accusing questions she gets suspicious and steps away, and the read drops; if that happens, drift back to the whiteboard and start again.

**Learn it:** ==action: Before the board, keep your questions to the work, not her buyers==. Suspicion is what breaks the read.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Victoria Sterling== (this meets her).
2. \==action: Choose **[Is that your training lab on the whiteboard?]**== to go to the board and start the read.
3. \==action: Keep picking the lab questions to keep her talking== until the cloner finishes.
4. \==action: Press Save in the cloner== to keep the Executive Keycard.

</details>

> Warning: If you knock Sterling out instead, HaX relays a working copy of her card by phone, but you lose the interview and it goes on the record. Cloning quietly is the clean route.

### The Night Turn {#hints-night}

**Where:** the main hallway, after Sterling's card is saved. **Goal:** understand that the day is ending.

> Hint: Once her card is saved, there is nothing more to do by daylight. Stepping out of the conference room into the main hallway ends the afternoon in one move.

<details markdown="1">
<summary>Nudge</summary>

Finish anything you want to do by day first (there is little). When you walk into the main hallway, a short scene plays: you leave with the afternoon's visitors and come back at eleven that night. From here on the building is shut, a guard is on patrol, and the server room and offices are the job.

</details>

### The Server Room {#hints-server-room}

**Where:** the server room, north off the main hallway, at night. **Goal:** get in and reach the VM Access Terminal.

> Hint: This door wants Sterling's executive card, not the receptionist's. Inside is a terminal onto their training network and a drop-site terminal where flags are submitted.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Emulate the saved Executive Keycard at the server-room reader==.
2. \==action: Walk in and approach the VM Access Terminal==.

</details>

> Warning: The server room reader wants Sterling's executive card. If it refuses you, check you emulated the right saved card.

> Note: The server work has its own sheet, so you can play the rest spoiler-free and tackle the network yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine-vm-technical-steps/) when you want the hints for the training network and its four flags.

### Decoding What You Find {#hints-decode}

**Where:** the CyberChef workstation (a laptop in the server room). **Clues:** the web price list, the whiteboard note, the client roster, and the drive from Sterling's desk.

> Hint: None of these is encrypted, only encoded. Look at the shape of each to tell ROT13 from Base64 from hex. If one decode still looks like nonsense, it is layered: decode again.

<details markdown="1">
<summary>Nudge</summary>

Take the CyberChef workstation, then paste each encoded thing into Input and add the matching operation. Scrambled words with normal spacing are ROT13; mixed-case letters, digits, `+`/`/` and maybe `=` are Base64; pairs of `0`–`9` and `a`–`f` are hex. The drive from Sterling's desk is two layers (Base64 over ROT13), so run From Base64 first, then ROT13.

**Learn it:** ==action: Decode the first word of the whiteboard note by hand==, shifting each letter back 13, then check it in CyberChef.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The CyberChef guide.]**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Take the CyberChef workstation==.
2. \==action: For the web price list, paste it and add **ROT13**==.
3. \==action: For the client roster, paste it and add **From Hex**==.
4. \==action: For the whiteboard note, paste it and add **ROT13**==.
5. \==action: For the desk drive, paste it, add **From Base64**, then add **ROT13**==.

</details>

> Warning: Enter decoded values into locks exactly. Do not tidy the case or add spaces; the lock compares the raw text.

### The Guard {#hints-guard}

**Where:** the executive wing, at night. **Goal:** reach Sterling's office past Terry Mott.

> Hint: At night the building is shut, so if the guard's torch finds you he stops you. You can talk your way out, but the clean route is to move while his back is turned.

<details markdown="1">
<summary>Nudge: getting past him</summary>

Terry patrols a short loop. He stands at his post facing the office door, then walks west with his back to it and stands a while before coming back. Watch the loop and move while he is facing away. If he does challenge you, you can give a cover story, pay him off, or tell him you are SAFETYNET, but each of those means he knows your face and you lose any claim to a clean night.

</details>

<details markdown="1">
<summary>Nudge: picking a lock near him</summary>

Sterling's office is a key lock, so you need the pick kit, and picking takes time out in the open. If the guard sees the pick in your hands he does not stop at talking: he turns hostile and you are in a fight. The game checks his line of sight once, at the moment the pick starts, so start the pick only once he has turned away.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**.

</details>

> Warning: A fight with the guard is winnable but it goes on the record, and it rules out the hidden Perfect Stealth objective, which needs a run where he never stops you, you make no deal, and you never knock him out.

### Sterling's Office: The Computer and the Roster {#hints-office}

**Where:** Sterling's office, north off the executive wing. **Locks:** a key lock on the door, a password on the computer.

> Hint: The door is a pick. The computer password is not hidden: someone wrote the format down and left it on the monitor, and the missing piece is on a plaque you walked past.

<details markdown="1">
<summary>Nudge</summary>

Pick the office door. The helpdesk slip on the monitor says the password was reset to the house default: her surname plus the year the firm was founded. The founding year is on the plaque in reception (and HaX said it in the briefing). Put them together, matching the capital letter. On the computer you will find the client roster, stored as raw hex, and an unsent email you will want for the safe.

**Learn it:** ==action: Read the plaque in reception for the year== if you have not already, then combine it with the surname from the slip.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Pick the office door==.
2. \==action: Read the helpdesk slip on the monitor== for the password format.
3. \==action: Enter the surname and founding year as one word== (case-sensitive) to unlock the computer.
4. \==action: Take the client roster and read it; decode it with From Hex== at the CyberChef workstation.

</details>

### The Wall Safe {#hints-safe}

**Where:** the server-room wall safe (a four-digit PIN). **Goal:** open it for the exploit catalogue.

> Hint: The code is not written on the whiteboard, and it is not the founding year. The whiteboard tells you who changed it and where the new code went. Follow that trail.

<details markdown="1">
<summary>Nudge</summary>

The server-room whiteboard is ROT13; decode it and it says Sable re-coded the safe and mailed the new code to the night team from her office, rather than writing it on the board. So the code is on Sterling's office computer, in an unsent email saved as raw message source. That draft is Base64. Decode it to find the four-digit code, then enter it on the wall safe.

The chain: whiteboard (ROT13) tells you where → Sterling's computer (password = surname plus founding year) → the unsent email (Base64) carries the code → the wall safe.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read and ROT13-decode the server-room whiteboard==.
2. \==action: Unlock Sterling's computer and open the unsent email to the night team==.
3. \==action: Paste the email into CyberChef and add From Base64==; read the four-digit code.
4. \==action: Enter that code on the server-room wall safe==.

</details>

### The Phase 2 Directive {#hints-directive}

**Where:** the hidden drive in Sterling's desk drawer. **Goal:** decode it and tell HaX what it says.

> Hint: The drive is one unbroken block of letters, digits, `+` and `/`, and one decode may not be enough. When you have it in plain English, HaX wants to hear it from you.

<details markdown="1">
<summary>Nudge</summary>

The drive is Base64 over ROT13. At the CyberChef workstation, run From Base64 first, then ROT13, until it reads as plain text about Phase 2. Then open your phone and choose **[About the drive from her desk. I've decoded it.]**. HaX asks what it says and offers three readings; pick the one that matches your own decode. This beat is optional, but it is the only way to get the "decoded by the agent" result; if you guess, the search team decodes it later instead.

**Learn it:** ==action: Read your decoded text closely before you answer HaX==. Two of the three options are near-misses, so answer from what you actually decoded, not from memory.

</details>

### The Consultant and the CEO {#hints-finale}

**Where:** Danny Foster's office, then back to Sterling in the conference room. The confrontation opens only once all four flags are in. What you choose is your decision; no ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: Two people are still in the building at night. Danny Foster, the consultant who drew the hospital survey, is in the office across from Sterling's. Sterling is waiting in the conference room. See Danny before you settle with her.

<details markdown="1">
<summary>Nudge: Danny Foster</summary>

Danny's office holds his hospital assessment, the email he sent with it, and his own unsent notes. He was told it was a security-awareness client, worked it out after the attack, and took a raise to stay quiet. When you talk to him you can offer to protect him and bring him in to testify, name him and let him answer for his part, or leave the choice to him. The game records what you decide; none of the options is scored as right or wrong.

</details>

<details markdown="1">
<summary>Nudge: Victoria Sterling</summary>

Once all four flags are in, HaX tells you she is ready and the confrontation opens; before that she is on a call with her back to the door and you back out. When you face her you can offer her a deal in exchange for the Architect's comms (this needs the Phase 2 drive from her desk as leverage), arrest her, or let her go now you have the evidence. Reading the transaction log and the catalogue first gives you more to put to her. Each path reaches an ending, and the debrief and credits reflect what you did and who you protected.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Several decisions run through the night and show up in the ending:

- **Danny.** He was deceived, then paid to stay quiet. Protect, expose or leave him; the credits name the outcome.
- **The approach and Sterling's recruitment test.** The briefing approach you picked, and your answer to the NHS question she asks in the interview, are both read back at her, and they appear in the credits.
- **Civilians and the guard.** Ffion and Terry are not Zero Day. You can knock them out to save trouble, but the debrief and credits record it, and Sterling notices an empty front desk.
- **How much you read.** The filing cabinet, the wall-safe catalogue and the desk drive are optional, but leaving them unread is noted, and a Victoria you knock out ends the confrontation with that paper still in the building.

None of these is scored as right or wrong by the game; they change who is safe at the end and what SAFETYNET walks away with.

</details>

After you decide, ==action: finish anything you still want to read, then call HaX to be brought in and hear the debrief==.

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The conference or server-room reader refuses a card | Wrong card emulated: the conference door wants the staff badge, the server room wants the executive card |
| The cloner shows "Access Denied" briefly | You emulated the wrong saved card at that reader |
| A clone did not stick | You closed the cloner before pressing Save; read the card again |
| Sterling steps away mid-interview and the read drops | She is suspicious; drift back to the whiteboard and keep the questions to the work |
| The office computer rejects the password | The value is not exact; match the surname's capital and the year with no spaces |
| CyberChef output is still gibberish after one operation | It is layered; add the next operation (for the desk drive, From Base64 then ROT13) |
| The wall safe rejects a four-digit code | The code is from the decoded unsent email, not the founding year |
| The confrontation will not open | You do not have all four flags in yet; the distcc flag is usually the missing one |
| The guard turns hostile | He saw the pick in your hands; start a pick only when his back is turned |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>Sterling's filing cabinet</summary>

A locked cabinet in her office (pick it) holds Zero Day's internal history: how a legitimate pentest firm grew a marketplace in its back rooms, and who Sable answers to.

</details>

<details markdown="1">
<summary>The server-room filing cabinet</summary>

A locked cabinet in the server room holds the Training Lab Runbook, which lays out the order of the network job. The companion sheet covers the network job in detail.

</details>

<details markdown="1">
<summary>The exploit catalogue</summary>

The wall-safe catalogue is the internal version of the web price list: the same tiers and prices, plus the buyers, the sale to Ghost with Sable's sign-off, and the Phase 2 stock held back. It is more than the public list the VM gives you.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise the decoding techniques safely, with your own data, not anything from the game. Use any current Linux distribution with `base64`, `tr` and `xxd` available. The network command-line practice is in the companion sheet.

### Encoding by hand and by tool {#cli-encoding}

\==action: Encode and decode Base64, ROT13 and hex==:

```bash
printf 'client roster' | base64
printf 'Y2xpZW50IHJvc3Rlcg==' | base64 -d; echo
printf 'Night team' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'Avtug grnz' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'Zero Day' | xxd -p
printf '5a65726f20446179\n' | xxd -r -p; echo
```

> Question: Run the ROT13 command on its own output. Why do you get the original text back? What does that tell you about using ROT13 to protect anything?

### Peeling a layered encoding {#cli-layered}

\==action: Wrap one scheme in another, then undo it in the right order==:

```bash
printf 'Grid first' | tr 'A-Za-z' 'N-ZA-Mn-za-m' | base64
printf 'VGV2cSBzdmVmZw==' | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m'; echo
```

> Question: The encode pipeline runs ROT13 then Base64. The decode pipeline runs base64 -d then ROT13. Why is the decode the reverse order, and what happens if you try From Hex on a Base64 string?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: the network flags were generated for you, and your ending may differ from a classmate's.

### 1. Physical Access and RFID {#q-rfid}

> Question: Describe the three steps of cloning a card (read, crack, emulate). Why did the receptionist's badge fall in seconds while Sterling's took a recovery attack?

> Question: Sterling set custom keys on her card and still had it cloned during a friendly interview. What would actually have protected it, and what does that say about relying on the card alone for access control?

> Action: Write a half-page access-control review for a small office, covering what card technology to use, how to handle visitors, and one control that would catch a cloned card being used (for example, tying the card to a PIN or to the time of day). Map each point to something you exploited in the game.

### 2. Encoding Versus Encryption {#q-encoding}

> Question: Zero Day hid its records in ROT13, Base64 and hex, and layered two of them. None needed a key to read. Explain, to a non-technical colleague, the difference between hiding data and protecting it.

> Question: You had to decode the desk drive in two passes. How did you know it was layered, and how did you work out the order to undo it in?

> Action: Take a sentence of your own. ROT13 it, then Base64 the result. Swap with a classmate and race to recover each other's sentence. Note which clue told you the order to undo them in.

### 3. Attacking the Network {#q-network}

> Question: Walk through the four flags (scan, FTP, pricing, distcc). For each, say what you did, what made it possible, and what a defender could have changed to stop you.

> Question: The FTP flag came from a backdoor in a tampered 2010 release of ProFTPD. This is a supply-chain attack. How would a team find out that a release they had installed was compromised, and what practices reduce the risk of installing a poisoned release in the first place?

> Question: The distcc daemon ran compile jobs for anyone who could reach it on the network. Name the assumption the service makes about its network, and describe two ways to stop it being reachable by an attacker.

> Action: On a lab network you control, stand up a service with a known version-based vulnerability, scan it with `nmap -sV`, and confirm the version from the banner. Write up how the banner alone narrowed down the attack.

### 4. People, Evidence and Choices {#q-choices}

> Question: Danny Foster drew the hospital survey believing it was for a security-awareness client. What did you decide to do about him, and what did you know when you decided? Would you choose differently on a second run?

> Question: Sterling's defence was that she only sold a vulnerability and that what a buyer does with it is the buyer's problem. The transaction log itemised a "target selection consultation". How does that line change the argument about her responsibility?

> Question: You could have knocked out Ffion or Terry to save trouble. What did the game record when you did, and what did it cost you (in the world and in the debrief)? What does that cost model say about real operations?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured and what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/), [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine-vm-technical-steps/) sheet, for the training-network stages.
- The CyberChef documentation and wiki, and its Magic operation for recognising unknown encodings.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Network Security, on Malware and Attack Technology, and on Applied Cryptography.
