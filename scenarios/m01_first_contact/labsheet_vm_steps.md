---
title: "First Contact: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the First Contact walkthrough, for the server and VM work: the step-by-step hints for getting into the attack server, finding the flags and escalating privileges with sudo, plus the command-line attack exercises."
tags: ["linux", "ssh", "hydra", "privilege-escalation", "sudo", "base64", "rot13", "cyberchef", "lockpicking", "password-security", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "beginner"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m01_first_contact/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Network Protocols and Vulnerability"
    keywords: ["common network attacks"]
  - ka: "SOIM"
    topic: "PENETRATION TESTING"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["authentication and identification"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication"]
  - ka: "CPS"
    topic: "Physical Security"
    keywords: ["Physical access control"]
---

> Note: This is the technical companion to the [First Contact walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m01-first-contact/). Play the game there first, and come here for the server work.

## Stuck? Hints — the Server Work

These four stages cover the server work in order: getting in, the SSH brute force, finding the flags, and privilege escalation. Read each hint and try, then open a Nudge, and the Recipe last.

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

## Try It on the Command Line (Optional)

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
