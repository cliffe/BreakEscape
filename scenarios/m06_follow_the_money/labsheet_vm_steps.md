---
title: "Follow the Money: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the Follow the Money walkthrough, for the HashChain backend: the step-by-step hints for scanning the backend, getting a foothold through an exposed analytics service, cracking offline password hashes, reusing a credential, and escalating with sudo, plus the command-line practice."
tags: ["nmap", "reconnaissance", "apache-druid", "cve-2021-25646", "remote-code-execution", "password-cracking", "john-the-ripper", "unshadow", "credential-reuse", "sudo", "privilege-escalation", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m06_follow_the_money/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Networking Applications"
    keywords: ["NMAP", "PORT SCANNING", "SECURE SHELL (SSH)"]
  - ka: "SS"
    topic: "Categories of Vulnerabilities"
    keywords: ["CVES AND CWES"]
  - ka: "SOIM"
    topic: "Fundamental Concepts"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS", "PENETRATION TESTING - ACTIVE PENETRATION"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication", "HASHED PASSWORDS"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["PRIVILEGE ESCALATION"]
---

> Note: This is the technical companion to the [Follow the Money walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m06-follow-the-money/). Play the game there first, and come here for the backend hints.

## The Backend Estate {#estate}

The HashChain Backend Server Terminal in the server room opens a Kali attack box. From that box you scan the exchange's backend, get a foothold on it, and work through its accounts. The backend holds four flags, and you submit each one at the SAFETYNET Financial Intelligence Drop in the same room. The main walkthrough covers the game around this work. This sheet covers the work on the backend.

1. **Scan.** Map the backend and find the analytics service that is listening on it.
2. **Flag 1.** Get a foothold, read the password hashes, and crack the first account.
3. **Flag 2.** Reuse the cracked password on a second account.
4. **Flag 3.** Crack the financial database account and read its records.
5. **Flag 4.** Use the operator account's sudo rights to read the vault account's files.

The flag values are generated for each game, so this sheet never gives one. It says where each flag sits and how to get at it.

## Concepts {#concepts}

You do not need to read all of this before you start. Come back to it when a stage leaves you unsure what a tool is telling you.

### Network Reconnaissance {#recon}

Before you attack anything, you map it. A scan with **nmap** finds which hosts are up, which ports and services they run, and what version each service reports. A version is often enough to tell you whether a known weakness applies, so the scan gives you a shortlist, not the answer.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| An open port on a number you did not expect | A service moved off its usual port | Scan every port before you decide nothing is there |
| A version string next to a service name | A product and release that may have a published weakness | Check whether that release is one of the vulnerable ones |
| A second host on the subnet | Another machine you have not looked at yet | Scan it the same way, then rank it against the others |

### Remote Code Execution Through an Exposed Service {#rce}

Some services will run code for anyone who asks. An analytics service with no login, left open on the network, can be one of them. The vulnerability lets your request make the service run a command, which gives you a shell. That shell belongs to the service's own account, which is unprivileged. You have a foothold, not the keys.

After any foothold, the first two questions are who you are and what you can read:

```bash
id
ls -l /etc/shadow
```

If the output looks like this, the file is readable by everyone, which is the finding:

```text
-rw-r--r-- 1 root root 1024 Oct 01 00:00 /etc/shadow
```

Normally only root can read that file. The `r--` in the last group of permissions means any account can read it.

> Question: The foothold cannot change anything on the box. Why is a readable shadow file still a serious problem?

### Offline Password Cracking {#cracking}

Linux keeps account names in `/etc/passwd` and password hashes in `/etc/shadow`. A hash is a scrambled form of a password. You cannot run it backwards, but you can guess. Hash each word from a list, then compare the result with the stored hash. Offline means you do this on your own machine. No login service throttles you or logs your guesses.

Each hash starts with a code that names its method:

| Hash starts with | Method |
| --- | --- |
| `$1$` | MD5, old and fast to crack |
| `$5$` | SHA-256 |
| `$6$` | SHA-512, the common default on current Linux systems |

A salt is a random string mixed into each hash, so two accounts with the same password store different hashes. You can see the salt in the middle of the hash. Try this and watch what changes:

```bash
openssl passwd -6 -salt demo examplepass
openssl passwd -6 -salt demo examplepass
openssl passwd -6 -salt other examplepass
```

The first two lines match, because the word and the salt are the same. The third line differs, because only the salt changed. A salt stops a single table of precomputed hashes working on every account at once. It does not stop a guess at each account, one at a time.

### Credential Reuse {#reuse}

If two accounts share a password, a crack on one account opens the other as well. Reuse is a weakness in how people pick passwords, not in the hash. The second account can be well protected on its own and still fall, because the attacker already has its password.

> Question: Which of the four flags would you still reach if every account had its own strong password?

### Sudo and Privilege Escalation {#sudo}

`sudo` lets an account run a command as another user, usually root, if the rules for that account allow it. `sudo -l` lists the commands your account may run and the users it may run them as. A rule that reads `(ALL) ALL` means the account may run any command as any user.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| `(ALL) ALL` in the `sudo -l` output | Full sudo rights for this account | Run a command as the account that holds the file you want |
| `sudo` asks for a password | Your own account's password, not the target's | Enter the password for the account you are signed in as |
| "is not in the sudoers file" | Your account has no sudo rights | Check which account you are signed in as |

The privilege escalation field guide has the full workflow: [Privilege Escalation via Sudo](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/).

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. The Recipe names the tools and the steps, never a password or a flag.

> Tip: Before you open a hint, ask three questions. What is the clue made of? What does the service say it is? What did the last command's output actually show?

### Getting Onto the Attack Box {#hints-vm-attack-box}

**Where:** the HashChain Backend Server Terminal, in the server room. **Goal:** a working terminal on the attack box, and the subnet the backend sits on.

> Hint: The terminal opens the attack box, not the backend. Before you scan anything, find out which network the attack box is on.

<details markdown="1">
<summary>Nudge</summary>

The backend sits on the same subnet as the attack box. The box's own address and its prefix length give you the range to scan. A `/24` keeps the first three numbers fixed and lets the last one vary, so it covers 256 addresses.

**Learn it:** ==action: Work out the subnet by hand== from an address and a prefix length.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `ip -4 addr` in the attack box's terminal==.
2. \==action: Note the address and the prefix length on the interface that holds the lab address==. You will use them as `<subnet>` in the next stage.

</details>

### Stage 1: The Scan {#hints-vm-scan}

**Where:** the attack box's terminal, against the backend. **Goal:** find the backend host, its services, and the port the analytics service listens on.

> Hint: A scan tells you what is up and what each service says it is. The analytics service may not sit on its usual port, so read the version as well as the name.

<details markdown="1">
<summary>Nudge</summary>

Find the live hosts first, then scan the backend for services and versions. If the analytics service does not show in a default scan, scan every port. Once you have its port and version, the foothold guide tells you what to check.

**Learn it:** ==action: Compare a scan of the default ports with a scan of all ports== and note what the second scan finds that the first one missed.

**To learn more in game:** ask Agent HaX on your phone for the reconnaissance guide. It is offered once you have used the server terminal.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Find the live hosts with a ping sweep: `nmap -sn <subnet>`==.
2. \==action: Scan the backend for services and versions: `nmap -sV <host>`==.
3. \==action: Scan every port on the backend: `nmap -sV -p- <host>`==, and note the port and version of the analytics service.

</details>

> Warning: A default scan can look empty. Scan every port before you decide the backend has nothing to offer.

### Stage 2: The Foothold {#hints-vm-foothold}

**Where:** the attack box, against the analytics service. **Goal:** command execution on the backend, as the analytics service's own account.

> Hint: The analytics service runs code for any request that asks it to. Your scan gave you its version and port. Check that version against the vulnerable releases in the guide.

<details markdown="1">
<summary>Nudge</summary>

The exploit needs two addresses: the backend, which you attack, and your attack box, which the backend calls back to. If the exploit runs and no session opens, the callback address is the usual cause.

**Learn it:** ==action: Check a version string against a list of affected releases== before you run an exploit against that service.

**To learn more in game:** ask Agent HaX for the Apache Druid guide. It is offered once you have used the server terminal.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Confirm the analytics service and its version from your scan==.
2. \==action: Open Metasploit and load the Druid module named in the Apache Druid guide==.
3. \==action: Set `RHOSTS` to the backend, `RPORT` to the analytics port, and `LHOST` to your attack box==.
4. \==action: Run the exploit, then run `id` and `hostname` to confirm you have a shell==.
5. \==action: Read the note the foothold leaves on the box==. It names the next thing to look at.

</details>

> Warning: The exploit gives you the service account, not root. You do not need root to reach the first flag, so do not spend time looking for it.

### Stage 3: Flag 1, the First Account {#hints-vm-flag1}

**Where:** the foothold shell, then your attack box. **Goal:** crack the first account's password, then sign in as that account and submit the flag it holds.

> Hint: The password hashes are readable from the foothold. Copy them to your own machine and crack them there, against a wordlist.

<details markdown="1">
<summary>Nudge</summary>

Two files hold what you need. The account names are in one, and the hashes are in the other. A tool joins them into one file, and the cracker reads that joined file. The in-game password list is a good first wordlist.

**Learn it:** ==action: Read a `$6$` line in a shadow file== and find the salt, the hash, and the method code.

**To learn more in game:** ask Agent HaX for the offline cracking guide. It is offered once you have used the server terminal.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Print both files on the backend: `cat /etc/passwd` and `cat /etc/shadow`==.
2. \==action: Copy both into a new, empty folder on your attack box==, as `passwd.txt` and `shadow.txt`.
3. \==action: Join them: `unshadow passwd.txt shadow.txt > hashes.txt`==.
4. \==action: Crack them against a wordlist: `john --wordlist=<your wordlist> hashes.txt`==.
5. \==action: Read what has cracked: `john --show hashes.txt`==. Note the account name and the password.
6. \==action: Sign in as that account on the backend, over SSH, and read the file called `flag` in its home folder==. Then submit the flag at the drop-site terminal.

</details>

> Warning: The message "No password hashes loaded" usually means you gave `john` the raw shadow file. Run `unshadow` first, so the account names and hashes are joined.

### Stage 4: Flag 2, Credential Reuse {#hints-vm-flag2}

**Where:** the backend, as the other accounts. **Goal:** sign in as a second account with the password you already have, and submit the flag it holds.

> Hint: The password you cracked is not a one-off. Try it on the other accounts you have not reached yet.

<details markdown="1">
<summary>Nudge</summary>

The account names in `/etc/passwd` tell you who else has a login. Trying one password against each account is a simple loop, and a wrong guess only tells you the password is not that account's.

**Learn it:** ==action: Sign in to each account you know about, one at a time== with the password you have, and note which one accepts it.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Go through the accounts listed in `/etc/passwd`==, and sign in to each over SSH with the password you cracked. Stop when one accepts it.
2. \==action: Read the file called `reuse_note` in that account's home folder, then the file called `flag`==, and submit the flag at the drop-site terminal.

</details>

> Warning: Try only the passwords you have cracked. Guessing at random wastes time and makes the backend noisier than it needs to be.

### Stage 5: Flag 3, the Financial Database {#hints-vm-flag3}

**Where:** the backend, as the financial database account. **Goal:** crack that account's password, read its records, and submit the flag.

> Hint: This account falls to the same method as the first one. Go back to your hash list, not to the login prompt.

<details markdown="1">
<summary>Nudge</summary>

John cracks every hash in the file you give it, not only the first one it finds. The account you need may already be in your output from the earlier run.

**Learn it:** ==action: Read `john --show` as a list== and compare each cracked line with the accounts in `/etc/passwd`.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `john --show hashes.txt` and list every cracked account==.
2. \==action: Sign in as the financial database account over SSH==, using the password john showed you.
3. \==action: Read `transaction_records/README` in its home folder, then the file called `flag`==, and submit the flag at the drop-site terminal.

</details>

> Warning: The output of `john --show` lists only the accounts that have already cracked. An account missing from that list has not cracked yet, so do not assume it has no usable password.

### Stage 6: Flag 4, Sudo Escalation {#hints-vm-flag4}

**Where:** the backend, as the operator account. **Goal:** use the operator account's sudo rights to read the vault account's files, and submit the final flag.

> Hint: One account on this box can run commands as any other account. Find out which one, then ask sudo to run a command for the vault account.

<details markdown="1">
<summary>Nudge</summary>

`sudo -l` lists what your account may run. Sudo asks for your own account's password, so you need the operator account's password before sudo will help you. The vault account's files sit in a folder called `cold_storage` in that account's home folder.

**Learn it:** ==action: Read the `sudo -l` output on your own account== and say in your own words what the rule lets you do.

**To learn more in game:** ask Agent HaX for the privilege escalation guide. It is offered once you submit the first flag.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Sign in as the operator account over SSH==, using its password.
2. \==action: Run `sudo -l`== and read the rule for your account.
3. \==action: List the vault account's cold storage folder: `sudo -u <vault account> ls -l /home/<vault account>/cold_storage`==. Get the vault account's name from `/etc/passwd`.
4. \==action: Read the file in that folder with `sudo -u <vault account> cat`==, then submit the flag at the drop-site terminal.

</details>

> Warning: If sudo says your account "is not in the sudoers file", you are signed in as the wrong account. Go back and sign in as the operator account.

### Submitting the Four Flags {#hints-vm-submit}

**Where:** the SAFETYNET Financial Intelligence Drop, in the server room. **Goal:** submit each flag once.

> Hint: Each flag goes into the drop-site terminal separately. Submit each one when you find it, not all at the end.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk back to the Financial Intelligence Drop in the server room==.
2. \==action: Submit each flag you have, one at a time==, copying each from the file where you found it.

</details>

## Try It on the Command Line (Optional) {#command-line}

The backend work already happens on a Kali shell. These short exercises practise the same techniques on a machine you control, not on the backend. Scan only machines you own or are allowed to test.

### Hashing a word yourself {#cli-hash}

==action: Hash one word twice with the same salt, then once with a different salt==:

```bash
openssl passwd -6 -salt demo examplepass
openssl passwd -6 -salt demo examplepass
openssl passwd -6 -salt other examplepass
```

**Learn it:** ==action: Explain why the first two lines match and the third does not==, in one sentence each, before you read the next section.

### Reading a sudo rule on a box you own {#cli-sudo}

On a lab VM you control, ==action: list what your account may run with sudo==:

```bash
sudo -l
```

**Learn it:** ==action: Find the line that gives your account its rights== and write down who it lets you run commands as.

> Note: The sudo rules are the first thing to read on any box you reach. A rule that looks harmless can give an account the whole machine.

## After the Game: Questions and Exercises {#after}

### Attacking the Server {#after-server}

> Question: The analytics service gave you a shell as an unprivileged account. What did that shell let you do, and what did it leave out?

> Question: Two accounts shared one password. Which step of the chain depended on that reuse, and which step would still have happened without it?

> Question: A default port scan missed the analytics service. What does that tell you about the difference between a scan and an inventory?

> Action: On a lab VM you own, run `nmap -sV` against one service, write down its version, and look up whether that version has a published weakness. Write two sentences on what you would check first and why.

> Action: Write a short note to the backend's administrator. Cover the exposed analytics service, the readable shadow file, the shared password and the sudo rule. For each one, give one fix.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, in game and published: [Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/), [Apache Druid RCE](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/apache-druid-rce/), [Offline Password Cracking](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/offline-password-cracking/) and [Privilege Escalation via Sudo](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/).
- The `nmap` man page (`man nmap`), for the scan options.
- The John the Ripper documentation, for `unshadow`, `--wordlist` and `--show`.
- The `sudoers` man page (`man sudoers`), for how the rules are read.
- [CVE-2021-25646](https://nvd.nist.gov/vuln/detail/CVE-2021-25646), the Apache Druid weakness behind the foothold.
- The [Follow the Money walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m06-follow-the-money/), for the game around this work.
