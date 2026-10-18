---
title: "Critical Failure (Break Escape Mission 4)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based infiltration of a grid battery storage plant to learn how physical security and falsified instruments fit together: clone old proximity cards, pick padlocks, lift a fingerprint, check a lying control screen against an analogue gauge, decode Base64, and decide how to deal with the man holding the trigger."
overview: |
  A control room is only as honest as the sensors feeding it. If an attacker owns the screens, the people watching them will tell you everything is fine while the racks cook. Critical Failure puts that problem in a 200 MWh grid battery plant and asks you to get past the door controls, find the one instrument the attackers could not reach, and get to the one button they could not disable.

  You play a SAFETYNET agent sent into Albion Energy Storage, where ENTROPY's Critical Mass cell has taken over the battery management and SCADA layer and set a trigger for 0800. Eleven people are on site and 240,000 are on the feed. Your handler, Agent HaX, and the analyst Nightshade run the operation from HQ. You talk past the gate, copy a card off a lanyard, read a dial that disagrees with every screen in the building, pick a padlock, lift a fingerprint, and work out what to do about Voltage, who stands beside the shutdown button holding the live trigger.

  This sheet gets you started, explains the ideas behind each lock with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to a full recipe or set of steps. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get them. The server work has its own companion sheet. There are decisions with consequences and more than one way to finish; the hints help you understand what you hold, not which choice to make.
tags: ["rfid", "proximity-card", "cloning", "lockpicking", "fingerprint", "biometrics", "scada", "critical-infrastructure", "base64", "cyberchef", "encoding", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m04_critical_failure/labsheet.md"
cybok:
  - ka: "CPS"
    topic: "Cyber-Physical Systems / Physical Security"
    keywords: ["Critical infrastructure", "Industrial control systems", "Physical access control", "Physical security integration"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["RFID authentication", "Biometric authentication", "Access control bypass"]
  - ka: "AB"
    topic: "Adversarial Behaviours"
    keywords: ["Physical + cyber attacks", "Insider threats", "Cover identities"]
  - ka: "HF"
    topic: "Human Factors"
    keywords: ["Social engineering", "Crisis decision-making", "Tactical choices", "Public disclosure ethics"]
  - ka: "AC"
    topic: "Applied Cryptography"
    keywords: ["Encoding vs encryption", "Base64"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain why an old proximity card can be copied from arm's length, and what a better access card would do differently
- describe how a pin tumbler padlock is picked, and why a lock only slows someone down
- explain what a fingerprint reader actually checks, and what it cannot check
- say why a control room that trusts its own screens can be fooled, and why an independent instrument and a hardwired safety control matter
- recognise Base64, decode it by hand and in CyberChef, and say why it is not a form of security
- weigh up the choices a crisis like this forces, about the people you meet and what you disclose afterwards

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes a few minutes.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and a full recipe or set of steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Questions and Exercises**.

The server work in the engineering workshop has its own companion sheet, [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m04-critical-failure-vm-technical-steps/), so you can play the rest without it. Open it only when you want the hints for that part.

> Note: Some values are generated for your game, so this sheet never gives you one. The fixed things you work out, such as which card opens which door, are described by where the clue is and what shape the answer takes, not what it is.

## Getting Started {#getting-started}

You are a SAFETYNET field agent. Albion Energy Storage stores 200 MWh of grid power in lithium-ion racks. ENTROPY's Critical Mass cell talked its way in as an OptiGrid maintenance crew, took over the software that watches the racks, and armed a trigger for 0800 that will push them into thermal runaway. Your cover is a grid-safety regulator turning up for an audit that was not due until later. Agent HaX runs you by phone and Nightshade reads the physics from HQ.

You do not need any prior knowledge before you start. The field guides teach each idea as you reach it.

1. \==action: Start the Break Escape mission **Critical Failure**==.
2. \==action: Watch the briefing from Director Netherton, Nightshade and Agent HaX==, and ask any topics you want. Then choose how you want to play it.
3. \==action: Talk to the security guard at the main entrance== and get past the checkpoint.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

Allow about 75 to 90 minutes. In a 60-minute class, stop once you are inside the engineering workshop and before you begin the server work, then resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents and field guides you are handed open as readable pages you can reopen at any time.

Your kit at the start is:

- the phone (Agent HaX, and later a line to Robert Vance)
- an **RFID Cloner**
- a **Lock Pick Kit**
- the **Grid Regulator Credentials** for your cover
- the **CyberChef Workstation**, a field laptop for decoding

There is no PIN cracker this time. Some people in the plant are dangerous, and combat is real: hits cost health and there is no healing item.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[How do I get past the gate?]**, **[How do I get through the card readers?]**, **[How do I prove the screens are lying?]**, **[Relay's got the workshop card. How do I get it?]**, **[How do I get through the plant-room reader?]** and **[Voltage. How do I play this?]**. Each appears once you are in the right situation, and there is always **[Where do I stand?]** for a read of where you are.
- Field guides, the in-universe lab sheets. Choose **[Send me a field guide.]** and pick the one you want. Each guide appears on that menu only once you have reached the challenge it covers.

> Tip: There are three kinds of door in this plant. Card readers want an access card (you can copy one with the cloner). Key locks want the pick kit. The plant-room door is different from both and wants something else. If a door will not open, work out which kind it is before you try anything.

> Tip: A cloned card only counts once the clone finishes. If the cloner says it "didn't get a clean read", the conversation usually lets you try again.

> Warning: The Emergency Shutdown is irreversible without a manual reset. Be sure you have done what you want to do in the plant room before you press it.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Do this once you have the CyberChef Workstation (it is already in your kit). It uses made-up data, not anything from the game.

1. \==action: Open the CyberChef Workstation and clear the recipe== if anything is in it.
2. \==action: Type `QmFuayBC` into **Input**==.
3. \==action: Search for `base64` and double-click **From Base64**==. The output reads `Bank B`.
4. \==action: Clear the input and type `Dial`==. ==action: Remove From Base64 and add **To Base64**==. The output reads `RGlhbA==`.
5. \==action: Clear the input and paste `RGlhbA==` back in==. ==action: Remove To Base64 and add **Magic** instead==. Magic tries common decodings and shows what it finds.

You have just encoded and decoded the same word, and seen that the two are exact opposites. The next section explains how it works.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### Old Proximity Cards {#prox}

A proximity card is a tiny chip that answers a reader at close range. The oldest kind, often called "old prox", does one thing: when a reader energises it, it sends back a fixed identification number. There is no secret key and no question-and-answer. Anything within a few centimetres that asks, hears the number. A cloner is just a reader that remembers what it heard and can then play it back.

| Card type | What it does | What it costs an attacker |
| --- | --- | --- |
| Old prox | Broadcasts a fixed number to any reader | Stand close, read, play it back. Seconds |
| A card with keys | Proves it holds a secret before it answers | A recovery attack that takes much longer, or the key itself |

In the mission, Robert Vance's Level 1 card and Relay's Level 2 card are both the old kind. That makes the cloner fast, but it still needs you to be close. The trick is staying near the person long enough, without them noticing.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**. It covers read, crack and emulate. Because these cards have no keys, the "crack" step does not apply to them.

> Question: A cloner copied Vance's card in an instant while he talked about the site map. What single design property of old prox cards made that possible, and what would a better card do differently?

### Pin Tumbler Locks {#locks}

A padlock or cabinet lock of this kind has a row of spring-loaded pins. The correct key lifts every pin to exactly the height where the lock can turn. To pick it, you hold light turning pressure on the lock with a tension wrench, then lift each pin in turn with a pick until it stops. The turning pressure makes one pin bind at a time, so you can feel it set. Pick them all and the lock turns.

Three things make picking harder: more pins, tighter tolerances, and pins that are shaped to catch and mislead a pick. Easy locks have a few simple pins; medium ones have more. Neither keeps anyone out for long. A lock is a delay, not a barrier.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**, once HaX has offered it.

> Question: In real life, what would a defender add to a padlocked equipment case so that picking it was no longer enough on its own?

### What a Fingerprint Reader Checks {#biometrics}

A fingerprint reader checks that the pattern of ridges on a finger matches one it has stored. That tells it who the finger belongs to. It does not tell it that the finger is attached to a live person standing at the door right now. A print left on a smooth surface can be lifted with fine powder and tape, and a good lift can look the same to a simple reader.

Forensic lifting has three steps. You dust the surface with powder so the oily ridges show. You lift the pattern with tape onto a card. You compare it with known prints to say whose it is. A reader that only checks the lift has no way to tell a person from a copy of the person's thumb.

| Step | What you do | Why it works |
| --- | --- | --- |
| Dust | Brush powder over a surface someone touches often | Powder sticks to the oil in the ridges |
| Lift | Press tape over the pattern and peel it onto a card | The tape carries the ridge pattern |
| Compare | Check the lift against a set of known prints | Shows whose it is |

> Question: The plant-room reader accepts a good lift of an authorised person's print. Name one extra check, other than a second fingerprint, that would have stopped that.

### Trusting Your Instruments {#instruments}

A control room shows what its sensors report. SCADA is the name for the supervisory screens and logs that watch an industrial plant, and the battery management system feeds them temperatures and charge levels. If an attacker controls that feed, every screen shows the same false number, and the operators believe it because every screen agrees.

The defence is a measurement that is not on that feed. In this plant there are two. An old mechanical dial thermometer on the wall of Battery Hall 1 is connected to nothing, so nothing can change what it reads. And a hardwired Emergency Shutdown pushbutton in the plant room works by physical contacts, with no network path, so software cannot disable it. Everything on a screen can be made to lie. A dial and a switch cannot be told what to say.

> Question: Every screen in the building agreed with each other. Why does agreement between screens count for so little as evidence, when all of them share one source?

### Base64 Is Not Security {#base64}

Base64 rewrites any data as printable text, using `A` to `Z`, `a` to `z`, `0` to `9`, `+` and `/`. It has no key, so it protects nothing. It only changes the alphabet the data is written in.

It works on three bytes at a time. Three bytes are 24 bits, which Base64 slices into four groups of six bits. Each six-bit group (a number from 0 to 63) picks one character from the 64 in the alphabet. When the data does not fill the last block, `=` pads it out, so the length is always a multiple of four.

```
D        i        a        l
01000100 01101001 01100001 01101100
010001 000110 100101 100001 011011 00(0000)
  R      G      l      h      b      A     ==
Base64 -> RGlhbA==
```

So `Dial` becomes `RGlhbA==`. One unbroken run of mixed-case letters, digits, `+` and `/`, ending in one or two `=`, is almost certainly Base64 and not English.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| Mixed-case letters and digits, maybe `+` and `/`, often ending in `=` | Base64 | From Base64 |
| Text that decodes to more nonsense | Another layer, or not Base64 | Try Magic in CyberChef |

> Question: You find a note that reads `QmFuayBC`. It has no `=` at the end. Give two reasons it could still be Base64, and say what the length tells you.

### One Button Software Cannot Reach {#esd}

The Emergency Shutdown button arms only when grid control agrees it is safe to shed 200 MWh. If the supply drops with nobody ready, it can trip the region. So the game asks for three things before it will arm: the hazard confirmed on an instrument that is not on the compromised feed, the attack proven, and nobody left in reach of a trigger that could fire first. If you press it too early, it tells you which one is missing.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** or **Recipe** last.

> Tip: Before you open any hint, ask yourself three questions. What kind of lock is this: a card reader, a key lock, a print reader, or something that wants a decision? What did the object's own description say? And have I actually looked everywhere the last room offered?

### Before the First Lock: The Checkpoint {#hints-start}

**Where:** the main entrance, then the operations office. **Goal:** get inside, and find a way past the card readers.

> Hint: The guard is the one person on site doing his job properly. Your cover has paperwork. What are you holding that fits?

<details markdown="1">
<summary>Nudge: getting past the guard</summary>

You are a grid-safety regulator at an early audit. Your **Grid Regulator Credentials** are in your inventory, and the guard will check them. He expects an audit today, but not this early. Choose the lines that sound like a routine visit and let him sign you in. You can try other approaches, but they have consequences, and the guard is not your enemy.

To learn more in game, open your phone and choose **[How do I get past the gate?]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to the Security Guard== and present your credentials.
2. \==action: Walk south into the operations office== and find Robert Vance.

</details>

> Warning: Nobody hands you a card. Vance says auditors get escorted, not carded. Your way to a Level 1 card is the cloner, not the conversation.

### Getting a Level 1 Card {#hints-level1}

**Where:** the operations office (Vance), or the security office (the locker). **Lock wanted by:** the card reader into Battery Hall 2. **Needs:** a Level 1 card.

> Hint: The reader wants a Level 1 card, and you do not have one. The person who does is standing in front of you, talking about a site map.

<details markdown="1">
<summary>Nudge: the cloner route</summary>

Vance wears his card on a lanyard. Your cloner reads old prox cards from close range, and he does not notice while he is busy talking about the site map. Choose the line that has you lean in over the map. If the read is cancelled or fails, the same choice comes back. After you reveal who you really are, you can instead ask him to let you copy it.

**Learn it:** ==action: Note what the cloner shows when it works==. The card is read, then saved, then played back at a reader. That is the whole attack.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The RFID cloning guide.]**.

</details>

<details markdown="1">
<summary>Nudge: the other routes</summary>

There is a **Security Equipment Locker** in the security office, south of the operations office, with a spare Level 1 card inside. It is a key lock, so you need the Lock Pick Kit and a steady hand. It is an easy lock. Knocking Vance out also makes him drop his card, but that has consequences you will see later.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Robert Vance and choose the cloner line== where you lean in over the site map.
2. \==action: Let the cloner finish and save the card==.
3. \==action: Walk to the Battery Hall 2 reader and emulate your saved Level 1 Facility Card==.

</details>

> Warning: Do not choose the dangerous-looking options just to save time. A knocked-out Vance cannot help you later, and the debrief records it.

### Is the Screen Lying? {#hints-dial}

**Where:** Battery Hall 1, east of the SCADA control room. **Goal:** check what the SCADA screens say against an instrument that is not on their feed.

> Hint: Every screen says everything is fine. Somewhere in the first battery hall is a gauge that is not connected to any of them.

<details markdown="1">
<summary>Nudge</summary>

Walk through the SCADA control room into Battery Hall 1. Look at the **Analogue Thermometer — Rack Bank C Wall**. It is an old mechanical dial. Compare what it says with what the SCADA display says. If they disagree, only one of them can be trusted, and only one of them can be changed from a keyboard.

**Learn it:** ==action: Read the SCADA HMI — Main Display first==, then read the dial, and write down both numbers. The gap is the lie.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the SCADA HMI — Main Display in the control room==.
2. \==action: Go east into Battery Hall 1 and click the Analogue Thermometer — Rack Bank C Wall==.
3. \==action: Take the call from Agent HaX about the reading==, if you want HaX's read on it.

</details>

> Tip: Reading the dial confirms the hazard. A clock starts later, once you have proved how the cell took control, so get your quiet work done first.

### Cipher in Hall 1 (Optional) {#hints-cipher}

**Where:** the far end of Battery Hall 1. **Goal:** nothing required. He is an optional encounter.

> Hint: Leave him alone and nothing happens. Talk to him and you have more than one way to end it.

<details markdown="1">
<summary>Nudge</summary>

Cipher is an ENTROPY operative with a radio. If he gets a call out, the cell is alerted and the next operative will be waiting for you. You can talk to him, and you can also fight him. What you choose changes how the next room feels. No route is a failure.

</details>

### Getting the Level 2 Card from Relay {#hints-relay}

**Where:** Battery Hall 2, past the Level 1 reader. **Goal:** a Level 2 card for the engineering workshop.

> Hint: The workshop door wants a Level 2 card. The only one on site is on the person who challenges you the moment you walk into Hall 2.

<details markdown="1">
<summary>Nudge: the quiet route</summary>

Relay's card is old prox, like Vance's. During her standoff, keep her talking and step in close enough for the cloner to find her card. If you rush the read, she hears the cloner buzz and turns hostile. Once she is hostile she sweeps faster, but she only chases within a few tiles and is slower than you, so backing off costs at most one hit.

</details>

<details markdown="1">
<summary>Nudge: the other route</summary>

If you put her down, she drops a **Workshop Keycard (Level 2)**, and HaX also relays you a working copy by phone. Combat is real, so check your health first.

To learn more in game, open your phone and choose **[Relay's got the workshop card. How do I get it?]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk into Battery Hall 2 and let Relay's challenge play out==.
2. \==action: Choose the line that has you step in close for the cloner==, or fight.
3. \==action: Walk back to Battery Hall 1 and emulate the Workshop Card Level 2 at the workshop reader==, or use the dropped card.

</details>

> Warning: Do not go through the plant-room door yet. It is not a card reader. HaX will tell you when you try it, and you cannot open it with anything you have now.

### The Workshop and the Tool Case {#hints-workshop}

**Where:** the engineering workshop, south of Battery Hall 1. **Lock:** the OptiGrid Tool Case (a medium key lock). **Goal:** a Fingerprint Kit.

> Hint: The crew's equipment is still in the room. One case is padlocked, and what it holds is what the plant-room door needs.

<details markdown="1">
<summary>Nudge</summary>

Pick the **OptiGrid Tool Case** with your Lock Pick Kit. It is a medium lock, so it takes a bit longer than the locker did. Inside you will find a **Fingerprint Kit** and a job card, **OptiGrid Job Card #4782 (back page)**. Read the card. It tells you whose print the crew used on the plant-room door, and where they got it.

**Learn it:** ==action: Read the Workshop Access Log and the Network Monitoring Station== before you leave. They show how long the crew had on this site.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The lockpicking guide.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Open the Lock Pick Kit and pick the OptiGrid Tool Case==.
2. \==action: Take the Fingerprint Kit and the job card==.
3. \==action: Read the job card==. It names a panel in Battery Hall 1.

</details>

### The Workshop Terminals {#hints-server-room}

**Where:** the engineering workshop. **Goal:** reach the BMS Jump Server Terminal and the SAFETYNET Drop-Site Terminal.

> Hint: This is the one place in the plant that can show you how the cell took control. The terminal on the bench is your way onto their network, and the Drop-Site Terminal beside it is where you hand in what you find.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Enter the engineering workshop with the Level 2 card==.
2. \==action: Approach the BMS Jump Server Terminal==.
3. \==action: Note the SAFETYNET Drop-Site Terminal beside it==. That is where you hand in what you find.

</details>

> Note: The server work has its own sheet, so you can play the rest spoiler-free and work it out yourself. Open [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m04-critical-failure-vm-technical-steps/) when you want the hints for the server.

### Lifting Vance's Print {#hints-print}

**Where:** the Duty Round Panel in Battery Hall 1. **Goal:** a print the plant-room reader will accept.

> Hint: The duty engineer logs every round on a small wall terminal. Somebody who touches it every two hours leaves more than a log entry.

<details markdown="1">
<summary>Nudge</summary>

Use the **Fingerprint Kit** on the **Duty Round Panel** in Battery Hall 1. The kit's minigame dusts the surface, lifts the pattern and then compares it with a small set of candidate prints. If the compare step offers you two cards, one is the real owner and one is a decoy. The compare is a forensic flourish and the reader opens on a good lift of his print either way, but identifying it properly teaches you the habit.

This is quiet work that can be done before the server work, while nothing is counting down.

**Learn it:** ==action: Read the Access Control Export in the security office== before you lift. The access times show something odd about whose print has been opening that door.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Use the Fingerprint Kit on the Duty Round Panel== in Battery Hall 1.
2. \==action: Dust, lift and compare in the minigame==.
3. \==action: Walk to the plant-room door in Battery Hall 2 and try it==.

</details>

> Warning: If you reload the page between lifting the print and using it on the door, the lift is lost. Lift it again and the door will then open. Once the door is open, it stays open.

### The Plant Room {#hints-plant}

**Where:** the plant room, south of Battery Hall 2. **Who:** Static and Voltage. **Goal:** get to the Emergency Shutdown pushbutton.

> Hint: The man holding the live trigger is standing next to the button. You will not walk past him, and what you choose to do about him decides how the rest goes.

<details markdown="1">
<summary>Nudge</summary>

You have more than one way to resolve Voltage, and every one of them finishes the mission. Static is with him, which limits some of your options. Read what each choice offers before you pick one. Talk to him first if you want to understand what you are dealing with.

The button will not arm until the hazard has been confirmed, the attack proven, and Voltage dealt with. Anything missing is listed on the refusal message.

To learn more in game, open your phone and choose **[Voltage. How do I play this?]**.

</details>

<details markdown="1">
<summary>Spoiler: how the options differ</summary>

With Static still up, you can fight or go for the button. With Static down, an arrest is also offered, and the arrest has its own sub-menu. If you fight, there is a short race to his laptop shown on screen as a countdown, and Agent HaX will tell you to drop him. If you go for the button, Voltage escapes through the loading dock. If you are too slow in the race, one bank is lost but the shutdown still protects the others.

None of these is scored as right or wrong. They change what the debrief says about the night.

</details>

> Warning: The game gives you no way to heal. If a fight is going badly, fall back before your health runs out.

### The Shutdown and the Sweep {#hints-esd}

**Where:** the plant room, then the loading dock. **Goal:** stop the runaway, then decide what else to read before you leave.

> Hint: The button is behind a hinged flap. If it refuses you, it says which condition is missing.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Lift the flap on the Emergency Shutdown Pushbutton== and press it.
2. \==action: Read Voltage's Operation Log and the marked blueprints== in the plant room.
3. \==action: Go east to the loading dock== and look at the **Abandoned Extraction Go-Bag**.
4. \==action: Open your phone and choose **[I'm done here. Bring me in.]**== when you are ready to leave.

</details>

> Warning: Once you leave, you do not come back. Whatever you did not read stays for forensics.

### The Go-Bag and the Encoded Card {#hints-gobag}

**Where:** the loading dock. **Lock:** a key lock on the go-bag (an easy one). **Clue:** a card with a long block of letters.

> Hint: The card in the bag is one unbroken run of mixed-case letters and digits. You already have a tool for that.

<details markdown="1">
<summary>Nudge</summary>

Pick the bag with the Lock Pick Kit. The **Social Fabric Safehouse Card (Encoded)** is Base64, so look at the shape of it first, then use the CyberChef Workstation. The card is lore, not a lock, so nothing in the mission needs it. It points to the next thread to pull on Social Fabric, and the debrief notices whether you read it.

**Learn it:** ==action: Look at the card and check the rule from Concepts==: a multiple of four in length, ending in `=` if it needs padding, and no spaces.

To learn more in game, open your phone, choose **[Send me a field guide.]** then **[The CyberChef decoding guide.]**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Pick the go-bag and take the card==.
2. \==action: Open the CyberChef Workstation and paste the card into **Input**==.
3. \==action: Add **From Base64**== (or try **Magic**) and read the result.

</details>

### The Debrief and Your Decisions {#hints-finale}

**Where:** HQ, once you are brought in. What you choose is your decision. No ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: The debrief reads back what you did and who you protected. You will be asked how much of the story to tell the public.

<details markdown="1">
<summary>Spoiler: the decisions that show in the ending</summary>

Several choices run through the night and show up in the debrief and credits:

- **Voltage.** Whether he is in custody or got away through the dock.
- **Robert Vance.** Whether you told him the truth and whether he is on your side at the end.
- **The night crew.** Whether anyone warned them, and whether a bank was lost.
- **Civilians and the guard.** The debrief records anyone you knocked out.
- **Disclosure.** At the end you choose between telling everyone, keeping it classified, or saying there was an incident and holding the details back.

None of these is scored as right or wrong. They change who is safe at the end and what SAFETYNET walks away with.

</details>

After you decide, ==action: finish anything you still want to read, then call HaX to be brought in==.

## What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The cloner screen says "No keycards" | You have not copied any card yet; get a Level 1 card from Vance, the locker, or a drop |
| A reader refuses a card | Wrong card for that door: Hall 2 wants Level 1, the workshop wants Level 2 |
| The cloner says it "didn't get a clean read" | The read was cancelled or interrupted; the conversation usually offers the choice again |
| An operative turns hostile after a clone | They heard the cloner buzz; back off and keep your distance |
| The plant-room door refuses you | It is a fingerprint reader, not a card reader; you need a lifted print |
| The reader refuses even with the kit | You have not lifted a print yet; use the kit on the Duty Round Panel |
| The pushbutton says "NOT ARMED. GRID PERMISSIVE NOT RECEIVED." | One of three conditions is missing; read which one the message names |
| Phone call-in is refused | A hostile person is still on you; lose them or put them down first |
| CyberChef output is nonsense after From Base64 | The text may not be Base64, or may be layered; try Magic |

## Optional Side Content {#optional}

None of these is needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>The operations office and security office paperwork</summary>

The Maintenance Work Orders, Facility Layout Map and Budget Cut Memo in the operations office, and the Camera System Logs, Security Camera Monitors and Access Control Export in the security office, tell the story of how the cell got in and which gaps they used. None of it gates progress, and the debrief rewards the curious.

</details>

<details markdown="1">
<summary>The bypass module print</summary>

The **BMS Interlock-Bypass Module** in Battery Hall 2 can also take a print. It shows whose hands fitted the hardware. Identify it, and a line in the arrest option changes, and the debrief mentions it.

</details>

<details markdown="1">
<summary>Warning the night crew</summary>

Nine people are working in Hall 2. There is a way to get them out, but it needs someone with the evacuation alarm, and the phone will tell you what sounding it costs before you decide. It is your call.

</details>

<details markdown="1">
<summary>The loading dock and the plant-room documents</summary>

The Loading Dock Schedule, Voltage's Escape Plan, the Facility Blueprints (Marked), the Critical Mass Coordination Log and Voltage's Operation Log all fill in who the cell is working with. Reading them makes the debrief richer.

</details>

## Try It on the Command Line (Optional) {#command-line}

These short exercises let you practise the encoding technique with your own data, not anything from the game. Use any current Linux distribution with `base64` and `xxd` available.

### Base64 by hand and by tool {#cli-base64}

\==action: Encode and decode some text of your own==:

```bash
printf 'Bank B' | base64
printf 'QmFuayBC' | base64 -d; echo
printf 'Dial' | base64
printf 'Dial' | xxd -b
```

The last command shows the bits you sliced into six-bit groups in the Concepts section.

> Question: Encoding `Hal` gives `SGFs`, with no `=`, but encoding `Hall` gives `SGFsbA==`. What does the padding tell you about how many bytes were in the last block?

### Undoing it in the right direction {#cli-roundtrip}

\==action: Round-trip a sentence of your own==:

```bash
printf 'Your own sentence here' | base64 | base64 -d; echo
```

> Question: What happens if you run `base64 -d` on plain English? Why does the tool complain, and what does that tell you about telling Base64 from other text?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: your choices and your ending may differ from a classmate's.

### 1. Physical Access and Cards {#q-cards}

> Question: Describe the three steps of cloning an old prox card. Why did you never need a "crack" step for Vance's or Relay's card?

> Question: Vance's card was copied while he talked about a site map. What would have protected it, and what does that say about relying on the card alone for access control?

> Action: Write a half-page access-control review for a small plant, covering which card technology to use, how to handle visitors, and one control that would catch a cloned card being used (for example, tying the card to a PIN or to the time of day). Map each point to something you did in the game.

### 2. Locks, Prints and Instruments {#q-instruments}

> Question: The plant-room reader opened for a lifted copy of Vance's print, at times when Vance was not even in the building. What did the access log show, and what extra data would have let a defender spot it?

> Question: Every screen in the building agreed with each other and all of them were wrong. What kind of independent check would you build into a real plant, and why does it need to be physically separate?

> Action: List three controls in the plant that software could change and one that it could not. For each, say what an attacker would do to it and what the operator would see.

### 3. Attacking the Server {#q-server}

> Question: In your own words, describe how the work in the engineering workshop let you prove how the cell took control. What did you find, and what did it let you show that the control room screens could not?

> Question: Pick one thing from your server work. What could a defender have changed to stop you or to spot you sooner?

> Action: Write a short incident note for the plant's operators: what the cell changed, how you confirmed it, and the one fix you would make first.

### 4. Encoding Versus Encryption {#q-encoding}

> Question: The cell kept a card in Base64 in a go-bag. Explain, to a non-technical colleague, the difference between hiding data and protecting it.

> Action: Take a sentence of your own, encode it in Base64, and swap with a classmate. Race to recover each other's sentence. Note which clue told you it was Base64.

### 5. People, Evidence and Choices {#q-choices}

> Question: What did you decide to do about Voltage, and what did you know when you decided? Would you choose differently on a second run?

> Question: Robert Vance emailed a warning about the unscheduled crew before you arrived. What should a plant do with a warning like that from its own staff, and what stopped it working here?

> Question: You chose how much of this to tell the public. Weigh up what each choice protects and what it risks, for the people on the feed and for the operators.

> Action: Write a short debrief of your own run, as if to Agent HaX. State what you secured, who was protected or harmed, what you left behind, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [RFID Cloning](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/), [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/) and [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/).
- The companion [VM Technical Steps](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m04-critical-failure-vm-technical-steps/) sheet, for the server work in the engineering workshop.
- The CyberChef documentation and wiki, and its Magic operation for recognising unknown encodings.
- The Cyber Security Body of Knowledge (CyBOK) chapters on Cyber-Physical Systems Security, on Authentication, Authorisation and Accountability, and on Applied Cryptography.
