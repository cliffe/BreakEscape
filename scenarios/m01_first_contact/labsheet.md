---
title: "First Contact (Break Escape Mission 1)"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Play a browser-based infiltration mission to learn the basics of a security investigation: physical access, PIN and password locks, lockpicking, decoding Base64 and ROT13 in CyberChef, and attacking a Linux server over SSH with Hydra, directory traversal and sudo privilege escalation."
overview: |
  A security investigation is a mix of physical and digital work. You walk a building, read what people leave lying around, open locks, and then move onto the network to pull evidence off a server. First Contact puts all of that into one mission.

  You play a SAFETYNET agent sent undercover into Viral Dynamics Media, a marketing firm that is a front for an ENTROPY cell running a disinformation campaign called Operation Shatter. Your handler, Agent HaX, guides you by phone. You gather evidence from desks and safes, decode notes the cell left behind, pick a lock or find a spare key, and then use a Kali Linux box in the server room to break into the attack server over SSH, navigate its filesystem, and escalate privileges. The technical work unlocks the evidence that lets you confront the operative and stop the attack.

  This sheet gets you started, explains the ideas behind each lock and each VM stage with small worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to a full recipe. Agent HaX hands out short in-game field guides as you reach each challenge; this sheet tells you how to get each one. There are moral choices and more than one ending; the hints help you understand what you hold, not which choice to make.
tags: ["linux", "ssh", "hydra", "privilege-escalation", "sudo", "base64", "rot13", "cyberchef", "lockpicking", "password-security", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "beginner"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m01_first_contact/labsheet.md"
cybok:
  - ka: "NS"
    topic: "Network Protocols and Vulnerability"
    keywords: ["common network attacks"]
  - ka: "SOIM"
    topic: "PENETRATION TESTING"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS"]
  - ka: "OS"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["authentication and identification"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication"]
  - ka: "CPS"
    topic: "Physical Security"
    keywords: ["Physical access control"]
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- gather evidence from a physical space and tell useful intelligence from background noise
- recognise weak authentication, and explain why reused dates, names and short PINs make locks and logins easy to break
- decode Base64 and ROT13 by hand and with CyberChef, and say why neither is a form of security
- run an online password-guessing attack against SSH with a wordlist, and connect once it works
- navigate a Linux filesystem from the command line, find files, and read them
- use `sudo` to act as another account, and explain what that misconfiguration gives an attacker
- describe how one operative fits into a wider network, and weigh up the choices a case like this forces

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read **Getting Started** and do the short CyberChef warm-up. It takes a few minutes and saves you far more later.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when something in the game leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and the full recipe hidden behind "Show" buttons. Open one at a time, and go back to the game after each: a lock you open on the first hint teaches you more than one you open with the recipe.
4. After the game, work through **After the Game: Questions and Exercises**.

> Note: The server mission is generated for your game. The operative's SSH password and the flag values on the server are not the same as anyone else's, so this sheet never gives you one, only the way to find it. Physical PINs and passwords in the office are the same each game, but they are still things you work out in the game; this sheet says where each clue is, not what it reads.

## Getting Started {#getting-started}

You are a SAFETYNET field agent. SAFETYNET received a tip that Viral Dynamics Media, a social-media marketing company, is hosting an ENTROPY cell planning an attack called Operation Shatter. Your cover is an IT security contractor booked to audit the network. That cover gets you through the front door and into offices without a fight. Your job is to find out what Operation Shatter is, gather proof, and stop it. Agent HaX runs the operation from the end of a phone.

You do not need to know Linux or cryptography before you start. The office teaches the basics, and Agent HaX hands you field guides as you reach each challenge.

1. \==action: Start the Break Escape mission **First Contact**==.
2. \==action: Watch the briefing from Agent HaX==, then ==action: talk to Sarah at reception== to get your visitor badge and the main office key.
3. \==action: Unlock the main office and explore==. Read desks, bins, notice boards and filing cabinets. People leave more behind than they mean to.
4. \==action: Open your phone whenever you are unsure==. Agent HaX offers hints and field guides as you go.

The mission takes about 75 to 90 minutes. In a 60-minute class, stop once you have the server room keycard and the password list (around the halfway mark), and resume next time. Your progress, evidence and unlocked rooms are kept between sessions.

### How to Play {#how-to-play}

You move with the arrow keys or by clicking. Click objects, people and doors to interact. Items you take go to the inventory bar at the bottom of the screen; documents and field guides you are handed open as readable pages you can reopen at any time.

Agent HaX's phone is your help system. Open it and you will see options that appear only once you have reached the thing they explain:

- Contextual hints, such as **[SSH brute force help]**, **[Linux navigation tips]**, **[Privilege escalation guidance]**, **[Lockpicking guidance]** and **[How do I decode these notes?]**. Each appears once you are in the right situation.
- Field guides, the in-universe lab sheets. Each is offered by a phone message when you reach the relevant challenge, then handed over when you ask for it. The exact options are listed in the stages below.

> Tip: The locks in the office want an exact value. A PIN is four digits. A password is case-sensitive, with no extra spaces or words. If you are sure you decoded something correctly and the lock still refuses it, check what you actually typed.

> Tip: Copy codes with a document's copy control or with the mouse rather than retyping. One wrong character gives a wrong answer with no explanation.

> Warning: Each lock allows a limited number of tries before it stalls for a moment. Work the value out from the clue; do not guess digit by digit.

### Warm-up: Your First CyberChef Recipe {#warm-up}

Do this once you have found the CyberChef workstation (a laptop in the former manager's office). It uses made-up data, not anything from the game.

1. \==action: Open CyberChef and clear the recipe== if anything is in it.
2. \==action: Type `Q2F0` into **Input**==.
3. \==action: Search for `base64` and double-click **From Base64**==. The output reads `Cat`.
4. \==action: Clear the input and type `Uryyb`==. From Base64 now gives nonsense. ==action: Remove From Base64 and add **ROT13** instead==. The output reads `Hello`.

You have just seen the two schemes Derek uses to hide notes. The next section explains how each one works.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again when you answer the questions afterwards.

### Weak Authentication: PINs, Passwords and Reused Secrets {#weak-auth}

Most of the office locks are a PIN pad or a password box. The weakness is not the lock, it is the secret behind it. People reuse things they already remember: a birthday, an anniversary, the company name, the current year, a counting pattern like 1357. Once you know how someone thinks, their secrets become guessable.

| What you notice about a person | What to try on their locks |
| --- | --- |
| A circled date, an anniversary, a birthday | That date as four digits, in either order (day-month or month-day) |
| The company name everywhere | The company name, with or without a year |
| A "secure but easy to remember" note | A phrase turned into initials plus a digit |
| A counting pattern on a sticky note | The pattern itself |

The same idea drives the server attack later. Derek's SSH password is one he would remember, and his own password list is sitting in a safe. That is why a wordlist attack works.

> Question: Kevin's workstation password is written on a sticky note as "a secure password but is quite easy 2 remember". Look at the first letters of that sentence. What kind of password is this, and why is writing the reminder next to the machine the real mistake?

### Encoding Is Not Security: Base64 {#base64}

**Base64** rewrites any data as plain printable text so it can travel through email, web pages and config files. It takes three bytes, cuts them into four groups of six bits, and writes each group as one of 64 symbols: `A` to `Z`, `a` to `z`, `0` to `9`, then `+` and `/`. The output uses only those characters, its length is a multiple of four, and it often ends in one or two `=` signs as padding.

A worked example, encoding `Cat`:

```
C        a        t
01000011 01100001 01110100      three bytes, 24 bits
010000 110110 000101 110100     regrouped into four 6-bit pieces
16     54     5      52         as numbers
Q      2      F      0          looked up in the Base64 alphabet
```

So `Cat` becomes `Q2F0`. A short string shows the padding: `1337` encodes to `MTMzNw==`. Anyone who recognises the alphabet can reverse it; there is no key and no secret. In CyberChef the **From Base64** operation does it. On a Linux shell, `base64 -d` does the same.

> Question: You find a note that reads `TWVldCBhdCB0aGUgc2VydmVyIHJvb20=`. Without decoding it, give two reasons you can be confident it is Base64. What single clue tells you it is not a form of encryption?

### Encoding Is Not Security: ROT13 {#rot13}

**ROT13** is a Caesar cipher with a fixed shift of 13. Each letter moves 13 places along the alphabet: `A` becomes `N`, `B` becomes `O`, and so on. Spaces, digits and punctuation are left alone, so word lengths and shape survive. Because 13 is half of 26, applying ROT13 a second time gets you back to the start, so the same operation encodes and decodes.

```
plain   D e r e k   i s   t h e   l e a k
ROT13   Q r e x r   v f   g u r   y r n y
```

So `Derek is the leak` becomes `Qrerx vf gur yrnx`. The giveaway is text that keeps its spacing and word lengths but reads as gibberish, with no `=` padding. In CyberChef, add the **ROT13** operation. On a shell, `tr 'A-Za-z' 'N-ZA-Mn-za-m'` does it.

> Note: How to tell the two apart quickly: letters, digits, `+`, `/` and a trailing `=` means Base64; normal spacing with scrambled letters and no `=` means a shift cipher like ROT13. Agent HaX's field guide covers this (see the decode stage below).

### Online Password Guessing: SSH and Hydra {#ssh-hydra}

**SSH** (Secure Shell) is how you log into a Linux machine over the network. It asks for a username and password. If the password is weak and there is no lockout, an attacker can try many passwords in turn until one works. This is an **online brute force** or, more precisely, a **dictionary attack** when you use a list of likely passwords rather than every combination.

**Hydra** automates the guessing. You give it a username, a file of candidate passwords, the target address and the service:

```bash
hydra -l derek -P passwords.txt 172.16.0.2 ssh
```

Each line in `passwords.txt` is one guess. When one works, Hydra prints the username and the password it found. You then log in for real:

```bash
ssh derek@172.16.0.2
```

The attack only works because the password is weak and the list is short and well chosen. A long random password, or a lockout after a few failures, would defeat it. In this mission Derek's own password list is the perfect wordlist, because he reuses the habits on it.

> Question: Why does a list of 27 likely passwords break into this account in seconds, when guessing an arbitrary 12-character random password could take longer than the age of the universe? What does that tell you about where the weakness actually is?

### Moving Through a Linux System {#linux-nav}

Once you have a shell, you explore with a handful of commands:

| Command | What it does |
| --- | --- |
| `pwd` | Prints the directory you are in |
| `ls` | Lists files; `ls -la` shows hidden files (those starting with a dot) and permissions |
| `cd somewhere` | Moves into a directory; `cd ..` goes up one; `cd` alone goes home |
| `cat file` | Prints a file's contents |

Evidence is rarely in the first place you look. Check the home directory, then any subdirectories inside it. A folder named after the operation is worth opening, and the file inside it is a second piece of evidence a step down from the top level. Moving into a subdirectory to reach a file like `operation_shatter/deployment_notes` is **directory traversal**, and it is one of the flags.

### Privilege Escalation with sudo {#sudo}

A normal account can only read its own files. **Privilege escalation** is moving from the access you have to access you should not have. The common Linux route is `sudo`, which lets a permitted user run commands as another account, often root.

```bash
sudo -l                    # list what you are allowed to run, and as whom
sudo -u shatter cat /home/shatter/somefile   # read a file as the shatter account
sudo -u shatter bash       # open a shell as the shatter account
```

If Derek's account is allowed to act as the `shatter` account, you can read `shatter`'s files even though they are not yours. That is the misconfiguration: an operative account with sudo rights over the infrastructure account. The files it unlocks are the last two flags.

> Question: Derek's account can become the `shatter` account with one command. In a properly set up system, why would a marketing manager's login never be allowed to do that? What principle is being broken?

### One Node in a Network {#entropy-network}

The evidence you recover describes ENTROPY as a set of cells that do not know each other, each running its own operation, with a single unknown figure ("The Architect") holding the whole picture. Derek runs one cell. Stopping Operation Shatter stops this attack; it does not end ENTROPY. Keep that in mind when you reach the end: the mission closes one case and opens a larger one.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last.

> Tip: Before you open any hint, ask yourself three questions. What is this clue made of, and what does its own description say? What shape does the lock or terminal want: a PIN, a word, a flag? And have I actually looked everywhere the last room offered?

### Before the First Lock {#hints-start}

**Where:** reception, at the start. **Goal:** get into the building and the main office.

> Hint: You cannot get far without talking to the person at the desk. Who hands out keys in an office?

<details markdown="1">
<summary>Nudge</summary>

Talk to Sarah at reception. She gives you a visitor badge and the main office key. Both go to your inventory. Then take the key to the locked door to the north.

If you want the lie of the building first, the reception desk has a staff directory and a sign-in log worth reading.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Talk to Sarah O'Brien at the reception desk== and accept the badge and key.
2. \==action: Walk to the north door and use the **Main Office Key**== to unlock the main office.

</details>

### The IT Room PIN {#hints-it-room}

**Where:** the IT room, east of the main office. **Lock wants:** four digits.

> Hint: Someone changed the code and left a message about it. Who looks after the IT room, and where would a reminder about a code live?

<details markdown="1">
<summary>Nudge</summary>

A maintenance note in the main office points you at a voicemail. The reception desk phone has an unheard message from Kevin giving the new PIN out loud. Listen to it.

There is also a backup copy of the code written down in the storage closet, off the east hallway, if you would rather read it.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Read the Maintenance Checklist in the main office== (it tells you to check the reception phone).
2. \==action: Play the voicemail on the reception desk phone== and note the IT room code.
3. \==action: Enter that code on the IT room keypad==.

</details>

### Meeting Kevin: Tools for the Job {#hints-kevin}

**Where:** the IT room. **Goal:** get the lockpick, the server room keycard and password advice.

> Hint: Kevin is nervous and wants help. Offer to do the audit and see what he gives you.

<details markdown="1">
<summary>Nudge</summary>

Talk to Kevin and take him up on the audit. He hands over a lockpick kit and his server room keycard, and he will talk about how people here choose passwords if you ask. All of it matters later: the lockpick and keycard open rooms, and the password habits point at how the server falls.

Kevin is not ENTROPY. Treat him as a colleague, not a suspect, however the evidence later tries to frame him.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Talk to Kevin Park== and agree to run the security audit.
2. \==action: Choose to take everything he offers==: the lockpick kit, the keycard and the password advice.
3. \==action: Ask him about password security== to hear how staff here reuse dates and names.

</details>

### Into Derek's Office {#hints-derek-office}

**Where:** Derek's office, off the east hallway. **Lock:** a key lock on the door. **Two ways in.**

> Hint: A locked door with no key nearby has two answers in this building: find a spare key, or pick it. You already hold one of the tools for the second.

<details markdown="1">
<summary>Nudge: the spare key</summary>

The former manager, Patricia, kept a spare key to Derek's office in a safe in her office (off the west hallway). The safe is a PIN pad. Patricia's own note says Derek is sentimental about dates; a tossed anniversary card in the break room has a date circled. Use that date as the safe's PIN.

**Learn it:** ==action: Before you try the safe, read the card and write the date as four digits both ways== (day then month, and month then day). One order opens it.

</details>

<details markdown="1">
<summary>Nudge: picking the lock</summary>

You do not need the key at all. The lockpick kit from Kevin opens Derek's door, and Patricia's briefcase too. Ask Agent HaX for the lockpicking field guide if you want the technique.

**To learn more in game:** when you pick up the lockpick, Agent HaX offers a guide. Open your phone and choose **[Send me the lockpicking field guide]**. It covers tension, finding the binding pin, and setting pins one at a time.

</details>

<details markdown="1">
<summary>Recipe</summary>

Either route works:

1. \==action: Open Patricia's safe with the anniversary date== and take Derek's office key, then use it on the door.
2. \==action: Or select the lockpick and use it on Derek's office door==, working one pin at a time with light tension.

</details>

> Warning: Picking is a feel for light tension, not force. If set pins keep dropping, you are using too little tension; if nothing moves, too much.

### Derek's Computer {#hints-derek-pc}

**Where:** inside Derek's office. **Lock wants:** a password.

> Hint: The sticky note on the monitor is the clue. What single thing is Derek sentimental about, and where have you already seen it?

<details markdown="1">
<summary>Nudge</summary>

The monitor's note says "Anniversary". You have already used that date on Patricia's safe. The same date, as four digits, is the password here. This is the lesson of the mission in one object: reuse one memorable secret and it opens everything.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Enter the anniversary date as the password== on Derek's computer.
2. \==action: Read all the files on it==: the framing report, the recovered email, the personal note about his safe, and the contingency plan.

</details>

### The Encoded Notes and CyberChef {#hints-decode}

**Where:** two notes on Derek's desk. **Clue:** one looks like random letters ending in `=`; the other reads as scrambled words.

> Hint: These are not encrypted, only encoded. Look at the shape of each: one is Base64, one is a shift cipher. Both decode in seconds once you know which is which.

<details markdown="1">
<summary>Nudge</summary>

Encoded Note (1) ends in `=` and uses only letters and digits: that is Base64. Encoded Note (2) keeps normal word lengths but the letters are wrong: that is ROT13. You need the CyberChef workstation, a laptop in the former manager's office. Decode each note and act on what it says: one reveals a safe code, the other confirms the computer and cabinet password.

**Learn it:** ==action: Decode the first word of the ROT13 note by hand== by shifting each letter back 13 places, then check it in CyberChef.

**To learn more in game:** once you have found the CyberChef laptop or read an encoded note, Agent HaX offers a decoding guide. Open your phone and choose **[Send me the CyberChef decoding guide]**. It covers telling Base64 from ROT13 and the exact recipe for each.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Take the CyberChef workstation from the former manager's office==.
2. \==action: Paste the Base64 note into Input and add **From Base64**==. Read the safe code it reveals.
3. \==action: Clear the recipe, paste the ROT13 note, and add **ROT13**==. Read the reminder it gives.
4. \==action: Use the values in the game== on the matching safe and the computer or cabinet.

</details>

> Warning: Enter the decoded value exactly. Do not tidy the case or add spaces; the lock compares the raw text.

### Derek's Cabinet and Safes {#hints-derek-storage}

**Where:** Derek's filing cabinet and personal safe (in his office), and his safe in the storage closet. **Locks want:** four digits each.

> Hint: You have already met all these codes. The decoded notes, the anniversary date, and a personal note on his computer each give you one.

<details markdown="1">
<summary>Nudge</summary>

The filing cabinet uses the anniversary date again. The storage closet safe uses the code from the decoded Base64 note. The personal safe under the desk uses his birthday, which a note in a desktop folder spells out (the day and month, reversed from the anniversary). Collect the operational documents inside: the casualty projections, the manifesto and the campaign materials are the evidence that gates the rest of the mission.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the filing cabinet with the anniversary date== and take all three documents.
2. \==action: Open the storage closet safe with the decoded Base64 code== to get the server address, username and the password list.
3. \==action: Read the personal note on the computer, then open the personal safe with his birthday== for The Architect's letter.

</details>

### The Server Room {#hints-server-room}

**Where:** south from the IT room. **Lock:** an RFID card reader.

> Hint: This door does not take a code. What did Kevin hand you that a card reader would want?

<details markdown="1">
<summary>Nudge</summary>

Use Kevin's server room keycard on the reader. Inside is a Kali Linux terminal and a SAFETYNET drop-site terminal for submitting flags. Before you start the VM work, make sure you have been to Derek's storage safe: the password list and the server details live there.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Use the **Server Room Keycard** on the RFID reader==.
2. \==action: Approach the VM Access Terminal== to begin the technical stage.

</details>

### The VM: Getting In {#hints-vm-connect}

**Where:** the Kali terminal in the server room. **Goal:** log into Kali and find the target's details.

> Hint: The terminal is a full Kali Linux machine. Its own login is on the sticky note on it. The target you are attacking is a different machine, and its address and username came from Derek's storage safe.

<details markdown="1">
<summary>Nudge</summary>

Log into the Kali box using the login on its sticky note. The attack server is at the address on the "Server Access Details" note from the storage safe, and the username you are targeting is Derek's. You also took Derek's password list from the same safe; save it into a file on Kali, one password per line, to use as your wordlist.

**To learn more in game:** once you find Derek's password list, Agent HaX offers the SSH and Linux basics guide. Open your phone and choose **[I'd like that ops manual]**. It covers Hydra, SSH and moving around a Linux filesystem.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Log into Kali using the login on the terminal's sticky note==.
2. \==action: Save Derek's password list to a file== (for example `passwords.txt`), one password per line.
3. \==action: Note the target address and username== from the Server Access Details note.

</details>

### The VM: SSH Brute Force {#hints-vm-ssh}

**Where:** the Kali shell. **Goal:** find Derek's SSH password and log in.

> Hint: You have a username, a target and a wordlist. One tool tries each password in the list against the login until one fits.

<details markdown="1">
<summary>Nudge</summary>

Use Hydra against the SSH service on the target, with Derek's username and your password file. When it finds a match it prints the password. Then connect with `ssh` using that password. The password is generated for your game, so it is not written anywhere in this sheet; Hydra finds it for you.

**Learn it:** ==action: Before running the attack, open the wordlist and read it==. Every line is a habit Derek reuses. That is why a short list works.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run Hydra against SSH on the target== with Derek's username and your wordlist:

```bash
hydra -l derek -P passwords.txt 172.16.0.2 ssh
```

2. \==action: Read the password Hydra prints==, then connect:

```bash
ssh derek@172.16.0.2
```

3. \==action: Find the decryption key file in Derek's home directory== and submit it to unlock the ENTROPY archive.

</details>

> Warning: If Hydra finds nothing, check you are targeting the right username and that each password is on its own line with no blank lines or stray spaces.

### The VM: Finding the Flags {#hints-vm-nav}

**Where:** logged in as Derek. **Goal:** find the two pieces of evidence in his account.

> Hint: Evidence is rarely at the top. List everything, including folders, and look inside a folder named after the operation.

<details markdown="1">
<summary>Nudge</summary>

In Derek's home directory, `ls -la` shows the files. One is the archive decryption key. Another sits inside a subdirectory named for the operation; move into it and read the file there. Reading a file one level down is the directory traversal flag. Submit the decryption key at the ENTROPY archive in the server room, and the deployment notes flag at the drop-site terminal.

**To learn more in game:** open your phone and choose **[Linux navigation tips]** for `ls`, `cd` and `cat`.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: List the home directory with `ls -la`==.
2. \==action: `cat` the decryption key file== and submit its contents at the ENTROPY archive.
3. \==action: `cd` into the operation subdirectory and `cat` the deployment notes==, then submit that flag at the drop-site.

</details>

### The VM: Privilege Escalation {#hints-vm-sudo}

**Where:** logged in as Derek. **Goal:** reach the files in the `shatter` account.

> Hint: Some files are not yours to read. Check what your account is allowed to do as other accounts.

<details markdown="1">
<summary>Nudge</summary>

Run `sudo -l` to see what Derek's account may do. It can act as the `shatter` account. Use that to read the files in `shatter`'s home directory: one is the encoded deployment configuration (Base64, submit it at the drop-site), and one is the launch authorization code (you enter that into Derek's launch device at the end).

**To learn more in game:** after your first server flag, Agent HaX offers the privilege escalation guide. Open your phone and choose **[I need the privilege escalation guide]**, or **[Privilege escalation guidance]** for a quick steer.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `sudo -l`== to confirm you can act as the `shatter` account.
2. \==action: Read `shatter`'s files as that account==, for example:

```bash
sudo -u shatter ls /home/shatter
sudo -u shatter cat /home/shatter/shatter_configuration
```

3. \==action: The configuration is Base64==; decode it and submit that flag at the drop-site.
4. \==action: Read the launch authorization code in the shatter account== and keep it for the launch device.

</details>

### Opening the Archive and Reporting In {#hints-archive}

**Where:** the server room and your phone. **Goal:** unlock the ENTROPY archive and report Operation Shatter.

> Hint: The archive opens with the decryption key you pulled from Derek's account, not a PIN. Submit it where the archive asks.

<details markdown="1">
<summary>Nudge</summary>

Submit the decryption key at the ENTROPY Encrypted Archive to open it. Inside are the two top-secret documents: the final authorization and the network architecture. Reading the network architecture is the reveal that ENTROPY is far bigger than Derek. Then call Agent HaX and report Operation Shatter.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Submit the decryption key at the ENTROPY archive== and take both documents.
2. \==action: Read the ENTROPY Network Architecture document== for the full picture.
3. \==action: Open your phone and report Operation Shatter to Agent HaX==.

</details>

> Tip: In a 60-minute class, a natural stopping point is here, once the archive is open and the flags are in. The confrontation and ending are a tidy session on their own.

### The Finale: Confronting Derek and the Launch Device {#hints-finale}

**Where:** the break room, then the launch device. The confrontation only opens once you have read the ENTROPY archive. What you choose is your decision; no ending is a failure, and these hints help you understand what you hold, not pick for you.

> Hint: Derek is in the break room. He will only engage once you have the full picture from the archive. When you talk to him, you are deciding how this ends.

<details markdown="1">
<summary>Nudge: the confrontation</summary>

Talk to Derek in the break room. If you have not read the ENTROPY archive, he brushes you off; go back and finish that first. Once you confront him, you can arrest him, call it in, try to turn him, expose him publicly, or demand his surrender. You can also fight him. Each path reaches an ending; the debrief and credits reflect what you did and who you protected along the way.

</details>

<details markdown="1">
<summary>Nudge: stopping the attack</summary>

After the confrontation Derek's launch device comes to you. It is armed. The launch authorization code you read in the `shatter` account aborts it. Enter that code and choose to abort, and Operation Shatter is dead. The device also offers a launch option; the game lets you make that choice and shows you its consequences in the debrief.

**To learn more:** the launch code is the file you read as the `shatter` account during privilege escalation. If you skipped it, go back and read it.

</details>

<details markdown="1">
<summary>Spoiler: the moral threads</summary>

Two decisions run through the mission and show up in the ending:

- **Kevin.** Derek's contingency plan frames Kevin for the breach. Once you have read it, you can warn Kevin, leave the evidence for investigators to clear him, or do nothing. The forensic details on the planted files (a flagged header mismatch, two sessions at once, a marketing manager filing IT reports) show the frame is Derek's work. Agent HaX will tell you the logs were filed by Derek if you go to accuse Kevin.
- **Civilians.** Sarah, Kevin and Maya are not ENTROPY. You can knock them out to take their items, but the debrief records it, and Maya is the informant whose intelligence you lose if she goes down.

None of these are scored as right or wrong by the game; they change who is safe at the end.

</details>

After you decide, ==action: finish the launch device, then call Agent HaX and choose to be debriefed==.

### What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| "Incorrect" on a PIN or password lock | The value is not exact, or you have the wrong clue for this lock |
| A lock stalls after several tries | You are guessing; work the value out from its clue and wait a moment |
| Derek brushes you off in the break room | You have not read the ENTROPY archive yet; finish the VM stage first |
| Hydra finishes with no password found | Wrong username, or the wordlist has blank lines or stray spaces |
| `ssh` says "Permission denied" | The password is mistyped, or Hydra matched a different account |
| `sudo -l` says you may run nothing | You are on the wrong account; log in as Derek, not Kali's own user |
| CyberChef output is gibberish | You used the wrong recipe: Base64 text through ROT13, or the reverse |
| A decoded value is rejected by a lock | You tidied the case or added a space; re-enter it exactly as decoded |

## Optional Side Content {#optional}

None of these are needed to finish. Each adds evidence or context.

<details markdown="1">
<summary>The main office filing cabinet</summary>

A chalkboard in the main office hints at the code ("think election year"). Opening the cabinet gives you Viral Dynamics's own strategy document, which shows the company's influence business is legal on paper and chilling in practice.

</details>

<details markdown="1">
<summary>Patricia's briefcase (lockpick only)</summary>

Patricia's briefcase in her office has no key; it only opens to the lockpick. Inside is her reconstruction of how ENTROPY infiltrated the company over eighteen months. It is the clearest single account of the back story.

</details>

<details markdown="1">
<summary>The storage closet practice safe</summary>

The storage closet holds a backup copy of the IT room code and, for completeness, a reference note. Useful if you missed the voicemail.

</details>

<details markdown="1">
<summary>Maya, the informant</summary>

Maya in her office is the person who tipped off SAFETYNET. Talking to her fills in Patricia's story and Derek's behaviour, and Agent HaX asks you to protect her identity. Her notes are extra evidence.

</details>

## Try It on the Command Line (Optional) {#command-line}

The server stage already happens on a real Kali shell. These short exercises let you practise the same techniques safely on your own machine or a lab VM, with your own data, not anything from the game. Use any current Linux distribution with `base64`, `tr`, `hydra`, `ssh` and `sudo` available.

### Encoding by hand and by tool {#cli-encoding}

\==action: Encode and decode Base64, and run ROT13 both ways==:

```bash
printf 'server room' | base64
printf 'c2VydmVyIHJvb20=' | base64 -d; echo
printf 'Derek is the leak' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
printf 'Qrerx vf gur yrnx' | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

> Question: Run the ROT13 command on its own output. Why do you get the original text back? What does that tell you about using ROT13 to protect anything?

### A dictionary attack you own {#cli-hydra}

Set up a throwaway account on a lab VM you control, give it a weak password that is on a list, and attack it. ==action: Build a tiny wordlist and run Hydra against your own test box==:

```bash
cat > mylist.txt << 'EOF'
summer2024
companyname
password1
letmein
EOF
hydra -l testuser -P mylist.txt 127.0.0.1 ssh
```

> Warning: Only ever run this against a machine you own or have written permission to test. Guessing passwords against anyone else's system is an offence.

### Acting as another user {#cli-sudo}

On a lab VM, ==action: look at your sudo rights and read a file as another account==:

```bash
sudo -l
sudo -u otheruser cat /home/otheruser/notes.txt
```

> Question: If `sudo -l` showed you could run any command as any user, what would that let you do on the whole machine, and why is that the same risk as being root?

## After the Game: Questions and Exercises {#after-the-game}

Work through these after you finish. Use your own run: the server values were generated for you, and your ending may differ from a classmate's.

### 1. Authentication and Weak Secrets {#q-auth}

> Question: List every lock and login you opened in the office. For each, say what the secret was based on (a date, a name, a pattern). Which was the hardest to work out, and why?

> Question: Derek reused one anniversary date across his computer, his filing cabinet and a safe. Explain the risk of reusing one memorable secret, using what happened in the game as the example.

> Question: Kevin's "secure but easy to remember" password was an initialism with a digit. Is that a good scheme on its own? What one thing made it insecure here, and how would you fix it without making it unmemorable?

> Action: Write a one-page password policy for a small office that would have stopped the attacks in this mission. Cover what people may not use, how reminders should be stored, and one technical control (such as a lockout or multi-factor authentication). Explain how each rule maps to something you exploited in the game.

### 2. Encoding Versus Encryption {#q-encoding}

> Question: Derek hid notes in Base64 and ROT13. Neither needed a key to read. Explain, to a non-technical colleague, the difference between hiding data and protecting it.

> Question: You decoded a note and the value still failed the lock until you entered it exactly. What does that tell you about how the lock checks the value, and why does the same care matter when you type a password into SSH?

> Action: Take a sentence of your own. Encode it in Base64, then run that through ROT13. Swap the result with a classmate and race to recover each other's sentence. Note which clue told you the order to undo them in.

### 3. Attacking the Server {#q-server}

> Question: Walk through the three technical stages (SSH brute force, directory traversal, privilege escalation). For each, say what you did, what made it possible, and what a defender could have changed to stop you.

> Question: The wordlist that broke Derek's account was his own password list. In a real engagement you would not have that. Where do penetration testers get wordlists, and how do they tailor one to a target?

> Question: Derek's account could become the `shatter` account with `sudo`. Name the security principle this breaks, and describe how the accounts should have been separated.

> Action: On a lab VM you control, recreate the chain: create a user with a weak password, add a file in a subdirectory, and give that user sudo rights over a second account. Then attack it from another account using Hydra, navigation and sudo. Write up each command and its output.

### 4. People, Evidence and Choices {#q-choices}

> Question: The evidence on Kevin's computer looked damning, but the forensic markers showed it was planted. What were those markers, and what general lesson do they teach about trusting a log or an email at face value?

> Question: What did you decide to do about Kevin, and what did you know when you decided? If you played it again, would you choose differently?

> Question: You could have knocked out Sarah, Kevin or Maya to save time. What did the game record when a civilian went down, and what did you lose if that was Maya? What does that cost model say about real operations?

> Question: The ENTROPY network architecture document showed Derek is one node of many. How did reading that change how you felt about the ending you chose? What does stopping one cell actually achieve?

> Action: Write a short debrief of your own run, as if to Agent HaX. State the ending you reached, who was protected or harmed, what evidence you secured, and one thing you would do differently in a real investigation.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, published online: [SSH Access and Linux System Navigation](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/ssh-access-and-linux-basics/), [Privilege Escalation via Sudo](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/), [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/) and [Lockpicking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/).
- The CyberChef documentation and wiki, and its Magic operation for recognising unknown encodings.
- The Hydra and OpenSSH manual pages (`man hydra`, `man ssh`, `man sudo`).
- The Cyber Security Body of Knowledge (CyBOK) chapters on Authentication, Authorisation and Accountability, and on Security Operations and Incident Management (Penetration Testing).
