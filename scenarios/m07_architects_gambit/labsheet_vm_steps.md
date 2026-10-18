---
title: "The Architect's Gambit: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to The Architect's Gambit walkthrough: the step-by-step hints for the attack host's open file share, its listener, the operator login and the root escalation, plus the command-line practice and the server reflection questions."
tags: ["nfs", "netcat", "nmap", "ssh", "sudo", "privilege-escalation", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "advanced"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m07_architects_gambit/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Networking Applications"
    keywords: ["NMAP", "PORT SCANNING", "NFS (NETWORK FILE SYSTEM)", "SECURE SHELL (SSH)"]
  - ka: "SOIM"
    topic: "Fundamental Concepts"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS", "PENETRATION TESTING - ACTIVE PENETRATION"]
  - ka: "SOIM"
    topic: "Human Factors: Incident Management"
    keywords: ["handle: actual incident response", "SECURITY EVENT TRIAGE", "CRISIS MANAGEMENT"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["physical access and secure deletion", "authentication and identification", "PRIVILEGE ESCALATION"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication", "BIOMETRICS", "SMART CARDS", "PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["industrial control systems", "electric power grids"]
  - ka: "CPS"
    topic: "Cross Cutting Security"
    keywords: ["detecting attacks", "mitigating attacks"]
  - ka: "AB"
    topic: "Models"
    keywords: ["attack trees", "kill chains"]
---

> Note: This is the technical companion to the [Architect's Gambit walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m07-architects-gambit/). Play the game there first. Come here when you reach the server room and want the server hints.

## The Server Work {#server}

The VM Access Terminal in the server room opens an attack box. From that box you reach the host that runs the cascade. The host gives up four flags, and you submit each one at the SAFETYNET Relay Terminal. The main walkthrough covers the game around this work. This sheet covers the work on the host.

1. **Share flag.** Mount the open file share, read what it holds and submit its flag.
2. **Listener flag.** Scan every port, find the one that answers anyone and submit its flag.
3. **Operator login flag.** Log in with the account name and password you have collected, then submit that account's flag.
4. **Root flag.** Escalate to root through the account's sudo rule and submit the root flag.

The flag values are generated for each game, so this sheet never gives one. It says where each flag sits and how to get at it.

## Concepts {#concepts}

You do not need to read all of this before you start. Come back to it when a stage leaves you unsure what a tool is telling you.

### Scanning a Host {#concept-scanning}

A port scan asks each numbered port on a host whether anything answers. Services usually sit on well-known ports, so a default scan checks only the most common ones. A service on an unusual port stays hidden until you scan the whole range.

| What you see | What it probably is | What to try |
|---|---|---|
| A port listed as `open` | Something is listening there | Connect to it and read what it sends |
| A port listed as `closed` | Nothing is listening, and the host answered | Move on |
| No line for a port you expected | The default scan skipped it | Scan the full range |

Worked example. Run this on your own machine, which has nothing open in that range:

```bash
nmap -p 4300-4330 127.0.0.1
```

`-p` sets the ports to check. `-p-` checks all 65,535. `-sV` asks each open port which service and version it runs. Act only on the open ports in the output.

> Question: Why does a scan that finds nothing on the common ports not prove the host has nothing open?

### Network File Shares (NFS) {#concept-nfs}

A network file share lets one machine serve a folder to others. The host publishes a list of these folders, called exports. Each export has rules about who may use it. An export that anyone can mount is over-shared: any machine on the network gets the folder's contents, and sometimes the ability to change them.

| What you see | What it probably is | What to try |
|---|---|---|
| An export path, like `/srv/something`, with an address range of `*` | A folder shared to every machine | Mount it read-only |
| A file that names another file or a user | A pointer, or a name you will need later | Note it and read the file it names |

To look at a share, you mount it into a folder on your own machine, the way you would plug in a memory stick. Mount it read-only, so you cannot change anything by accident. Then list it and read the files.

### Netcat and Open Listeners {#concept-netcat}

A listener is a program that waits on a port. When something connects, the listener sends its data, and some listeners send that data to anyone who asks. `nc` (netcat) is a plain tool for connecting to a port and seeing what comes back. It does not log in or ask for a password. Whatever the listener sends, you get.

Worked example. Start a listener in one terminal on your own machine:

```bash
echo "example banner line" | nc -l -p 4321
```

Connect to it from a second terminal:

```bash
nc 127.0.0.1 4321
```

The second terminal prints `example banner line`. Real listeners send more than one line, and the text can include passwords. Read everything before you type anything.

### SSH Logins {#concept-ssh}

SSH is the usual way to log in to a remote Linux machine. You give a user name and a password, and the host gives you a shell running as that user. A shell is a text prompt where you type commands. The prompt shows the user name and the current folder.

Three commands tell you where you are once you are in:

```bash
id -un
pwd
ls -la ~
```

`id -un` prints the user name. `pwd` prints the current folder. `ls -la ~` lists the home folder, including files whose names start with a dot. Files can be hidden from a plain `ls`, so use `-la`.

### Sudo and Privilege Escalation {#concept-sudo}

Root is the account that can read and change anything on a Linux machine. Files that belong to root, such as those in `/root`, are usually unreadable by other users. Sudo lets an ordinary user run specific commands as root. Its rule file says which commands, and whether a password is needed. `NOPASSWD` means no password is needed.

Running `sudo -l` shows your rules. A rule that lets you run a program as root may or may not let you become root. That depends on what the program can do. Many text-processing tools can run other commands. If the tool can start a shell, the shell runs as root.

Worked example. Run this on your own machine, without sudo:

```bash
awk 'BEGIN { system("id -un") }'
```

It prints your own user name, because `system()` runs the command as you. If the same `awk` command were allowed through sudo, the command would run as root and print `root`. That gap, between what a rule intends and what the allowed program can do, is what privilege escalation exploits.

> Question: The rule allowed a text tool, not a shell. What could the rule have named instead so that the account could still do its job without a shell?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. The Recipe names the tools and the steps, never a flag value.

> Tip: Every command in this section runs in the attack box's terminal, which the VM Access Terminal opens. Nothing here needs you to leave the server room, except the Relay Terminal, where the flags go.

### Getting Onto the Attack Box {#hints-vm-attack-box}

**Where:** the VM Access Terminal, in the server room. **Goal:** a working terminal on the attack box, and the address of the host you are going after.

> Hint: The terminal opens the attack box, not the target. Before you scan anything, find out which network the attack box sits on.

<details markdown="1">
<summary>Nudge</summary>

The target is on the same network as the attack box, so the box's own address tells you where to look. The number after the slash in that address is the prefix length. It tells you how many addresses the network holds.

**Learn it:** ==action: Work out the network by hand== from an address and a prefix length. A `/24` keeps the first three numbers fixed and lets the last one vary, so it covers 256 addresses.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `ip -4 addr` in the attack box's terminal==.
2. \==action: Note the address and the prefix length== on the interface that holds the lab address. Use them to find the target in the scan stage.

</details>

### Stage 1: The Share Flag {#hints-vm-share}

**Where:** the attack box's terminal. **Goal:** the flag from the open share, and an account name you will need in stage 3. **Submit:** the SAFETYNET Relay Terminal.

> Hint: Ask the host what it shares before you read anything. A share that anyone can mount is a door, and the flag is behind it.

<details markdown="1">
<summary>Nudge</summary>

The host publishes its exports to anyone who asks. Find the export, mount it read-only into an empty folder on the attack box, and list what is there. One of the files is a pointer to a second file, and the account name is in there too. Note the name. You will need it in stage 3.

**Learn it:** ==action: Make an empty folder and list it before you mount anything==. Then list it again after mounting and compare the two listings.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Ask the host which exports it offers== with `showmount -e <target address>`.
2. \==action: Make an empty folder, `/mnt/share`, and mount the export there read-only== with `sudo mount -t nfs -o ro <target address>:<export path> /mnt/share`.
3. \==action: List the share and read each file== (`ls -la /mnt/share`, then `cat` the file). Note the account name and find the file that holds this flag.
4. \==action: Submit the flag at the SAFETYNET Relay Terminal==.

</details>

> Warning: Mounting the share does not submit anything. Only the Relay Terminal counts a flag. Copy the flag exactly as you find it, including the braces.

### Stage 2: The Listener Flag {#hints-vm-listener}

**Where:** the attack box's terminal. **Goal:** the flag from the open port, and the operator password it carries. **Submit:** the SAFETYNET Relay Terminal.

> Hint: Your first scan of the host may not show everything. Something on it answers anyone who connects, and it is not on a common port.

<details markdown="1">
<summary>Nudge</summary>

A default scan checks only the most common ports, so it can miss the one you want. Scan all 65,535 ports, then look at each open port that is not in the usual list. Connect with a plain TCP tool, read everything it sends, and only then decide what to do with it. The output carries the operator's password, and a second password that opens the control room door.

**Learn it:** ==action: Connect to a listener you start yourself== and read the first line it sends. The command-line section below does this on your own machine.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Scan every port on the target== with `nmap -p- <target address>`.
2. \==action: Connect to the open high port== with `nc <target address> <port>`, and read all the output.
3. \==action: Note the operator's password and the other password it carries==. You need the operator's password in stage 3. The other one opens a door in the game.
4. \==action: Submit the flag at the SAFETYNET Relay Terminal==.

</details>

> Warning: The port is picked when the host is built, so a port number from a different game will not work. Read the port from your own scan.

### Stage 3: The Operator Login Flag {#hints-vm-login}

**Where:** the attack box's terminal. **Goal:** the flag from the operator's home folder. **Submit:** the SAFETYNET Relay Terminal.

> Hint: You now have two of the three things you need: an account name from the share and a password from the listener. Put them together and log in.

<details markdown="1">
<summary>Nudge</summary>

Log in over SSH with the name and password you have. Once you are in, check who you are and where you are, then list the home folder with its hidden files. The flag is in a file in that folder. The game counts this as the moment the host notices you, so do the other things you want first.

**Learn it:** ==action: Run `id -un`, `pwd` and `ls -la ~` on your own machine== and compare the output with what you expect. That is the check you will run at the prompt after you log in.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the control room door in the game first.== Logging in starts a clock in the game, and the door is easier to open before it does.
2. \==action: Log in from the attack box with `ssh <account name>@<target address>`==, and type the password when asked.
3. \==action: List the home folder with `ls -la ~`, then read the file that holds the flag==.
4. \==action: Submit the flag at the SAFETYNET Relay Terminal==.

</details>

> Warning: Logging in starts the clock in the game and the team cannot be moved after that. Do your other work first. If the login is refused, check the account name and the password against your notes. Copy them rather than retyping them from memory.

### Stage 4: The Root Flag {#hints-vm-root}

**Where:** the attack box's terminal. **Goal:** the flag in `/root`. **Submit:** the SAFETYNET Relay Terminal.

> Hint: The operator account cannot do what it needs as it is. Start with what the account is allowed to run, as root.

<details markdown="1">
<summary>Nudge</summary>

`sudo -l` lists the commands your account may run as root, and whether it needs a password. One allowed program is a text-processing tool. Many of those can run other commands. If this one can, a command you run through it runs as root. The flag sits in `/root`, which an ordinary user cannot read.

**Learn it:** ==action: Run `awk 'BEGIN { print "hello" }'` on your own machine==, then change `print` to `system` with a command in it. Say what the output shows and who runs it.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `sudo -l` and note the program it lets you run without a password==.
2. \==action: Ask that program for a shell== by running it with a `BEGIN` block that calls `system` on `/bin/sh`: `sudo <program> 'BEGIN { system("/bin/sh") }'`.
3. \==action: Check you are root with `id -un`==, then list `/root` to find the flag file.
4. \==action: Read that file and submit the flag at the SAFETYNET Relay Terminal==.

</details>

> Warning: A normal shell cannot read `/root`. A `cat` that returns `Permission denied` means you are still the operator, so go back to step 2.

### Submitting the Four Flags {#hints-vm-submit}

**Where:** the SAFETYNET Relay Terminal. **Goal:** submit each flag once.

> Hint: Each flag goes into the Relay Terminal on its own. The debrief needs all four.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Go back to the SAFETYNET Relay Terminal==.
2. \==action: Submit each flag you have, one at a time==, copying each one from where you found it.

</details>

> Warning: Copy each flag from the file that holds it, not from memory. Check the Relay Terminal for all four before you go to the debrief.

## Try It on the Command Line (Optional) {#command-line}

The server stages already happen on a Kali shell. These exercises let you practise the same techniques on your own machine. Scan only machines you own or are allowed to test.

### A listener you start yourself {#cli-nc}

In one terminal, ==action: start a listener on a port you choose==:

```bash
echo "example banner line" | nc -l -p 4321
```

In a second terminal, ==action: connect to it and read what it sends==:

```bash
nc 127.0.0.1 4321
```

**Learn it:** ==action: Change the message in the first command, then connect again.== Check that the second terminal shows your new text and nothing else.

### Scanning a range you own {#cli-nmap}

==action: Scan a range of ports on your own machine, then add `-sV` to see the service behind each open port==:

```bash
nmap -p 4300-4330 127.0.0.1
nmap -sV -p 4321 127.0.0.1
```

> Note: Scan a machine only if it is yours or you have permission. Running a scan against someone else's host can break the rules of your network or your course.

### Sudo rules on your own machine {#cli-sudo}

==action: List what your own account may run with sudo==:

```bash
sudo -l
```

Read each line. A line marked `NOPASSWD` allows a command without a password. Check whether any program on the list can run other commands. ==action: Run that program without sudo on a file you own, and compare what it can do with what the rule was meant to allow.== Do not run `sudo` on a machine you do not own.

## After the Game: Questions and Exercises {#reflection}

### Attacking the Server {#reflection-server}

> Question: The share and the listener each leaked part of the same login. Which single setting on each service would have stopped its leak?

> Question: The sudo rule let an ordinary user run a text tool as root. What could the rule have named instead, so the account still had a use for it without a shell?

> Question: The root flag sat in a folder that only root could read. Why is that folder permission not enough on its own to protect a host?

> Action: Write about 150 words for your tutor. For each of the four services on this host, name the setting that exposed it, the change you would make, and the one you would check afterwards to confirm the fix worked.

## Further Reading {#further-reading}

In the game, ask Agent HaX for the field guides when they are offered. The NFS and netcat guide and the SSH guide are the ones this host needs. The privilege escalation guide covers stage 4. Each is also published:

- [SAFETYNET Field Guide: NFS Shares and Open Ports](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/nfs-and-netcat-leaks/)
- [SAFETYNET Field Guide: SSH Access and Bruteforce](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/ssh-access-and-bruteforce/)
- [SAFETYNET Field Guide: Privilege Escalation via Sudo](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/)
- [Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/), for the scan in stage 2.
- The nmap reference (`man nmap`) and the sudo manual (`man sudo`).
