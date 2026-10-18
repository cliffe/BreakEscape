---
title: "The Mole: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to The Mole walkthrough, for the lab network: step-by-step hints for the repository server, the credentials in its history, the login, and the escalation to root, plus command-line practice."
tags: ["gitlist", "cve-2018-1000533", "argument-injection", "git-history", "ssh", "sudo", "privilege-escalation", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m08_the_mole/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Networking Applications"
    keywords: ["Secure shell (SSH)", "Port scanning"]
  - ka: "WAM"
    topic: "Server-Side Vulnerabilities and Mitigations"
    keywords: ["Injection vulnerabilities", "Server-side misconfiguration and vulnerable components"]
  - ka: "SS"
    topic: "Categories of Vulnerabilities"
    keywords: ["CVEs and CWEs", "Hard-coded password"]
  - ka: "SOIM"
    topic: "Fundamental Concepts"
    keywords: ["Penetration testing software tools", "Vulnerability analysis"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["Privilege escalation"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["User authentication"]
---

> Note: This is the technical companion to the [The Mole walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m08-the-mole/). Play the game there first, and come here for the repository server hints.

## The Training Network {#network}

The Server Room has a **GitList Repository Server** terminal. It opens a Kali attack box on the lab network. From that box you reach SAFETYNET's internal repository server, the other host on the network. The repository server holds four flags, and you submit each one at the **Evidence Relay Terminal** in the same room. The main walkthrough covers the game around this work. This sheet covers the work on the repository server.

1. **Exposure flag.** Get code running on the repository browser, with no login.
2. **Credentials flag.** Find the password committed to the repository history.
3. **Account flag.** Log in as the account that password belongs to, and read its home directory.
4. **Root flag.** Escalate to root through a sudo rule, then read the logs the server keeps for its users.

The flag values are generated for each game, so this sheet never gives one. It says where each flag sits and how to reach it.

## Concepts {#concepts}

You do not need to read all of this before you start. Come back to it when a stage leaves you unsure what a tool or a result is telling you.

### Secure Shell and the Linux Shell {#ssh}

**SSH** (Secure Shell) gives you a command line on another machine over an encrypted connection. You give it an account name, a host and a password, or a key. The server checks the credentials against the account. If they match, you get a shell that runs as that account, and everything you type can read and write only what that account may.

A Linux shell works on a set of directories and files. Each file has an owner and permissions. Your **home directory** is the part of the disk the account owns. Files outside it, such as system logs, usually belong to root.

Worked example, on a practice machine of your own:

```
$ ssh alice@192.0.2.10
alice@host:~$ ls
notes.txt
alice@host:~$ cat /var/log/auth.log
cat: /var/log/auth.log: Permission denied
```

### Git History {#git-history}

A Git repository keeps every commit. A commit is a snapshot of the files, with a message and an author. Deleting a file in a later commit does not remove it from the earlier commits, so anyone who can read the history can still read the old content. A **stash** is a second place where Git keeps unfinished changes, and it also keeps old content.

Worked example:

```
$ git log --oneline
4f2a9c1 Tidy the README
b71e02d Add sync job settings
$ git show b71e02d
```

The second commit's message says what the change was for. The diff under it shows what was removed. Read both.

### Argument Injection {#argument-injection}

A web application often passes what a visitor types into a command that runs on the server. If that input is joined into the command without checks, the visitor can add options or extra commands. This is **argument injection**, a form of injection flaw.

Software versions that contain a flaw like this often have a published **CVE** (Common Vulnerabilities and Exposures) entry. The entry names the affected versions and describes the input that is not checked. You compare the version the service reports against that entry before you try anything.

### Sudo and Privilege Escalation {#sudo}

**Privilege escalation** means moving from a low-rights account to a higher one, usually root. **sudo** lets an account run a command as another user, if the sudo rules allow it. Only root may edit those rules. Running `sudo -l` lists what your account may run.

A rule that lets an account run a tool which can start a shell, or run other programs, is a misconfiguration. The tool may have been meant for something harmless, and the rule still hands out a root shell.

Worked example, with made-up output:

```
$ sudo -l
User alice may run the following commands:
    (root) /usr/bin/tail
```

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. The Recipe names the tools and the steps, never a flag value.

> Tip: Before you open any hint, ask three things. What version is this? What does the service say when you connect? What can this account do?

### Getting Onto the Attack Box {#hints-vm-attack-box}

**Where:** the GitList Repository Server terminal, in the Server Room. **Goal:** a working terminal on the attack box, and the address of the repository server.

> Hint: The terminal opens the attack box, not the repository server. Before you aim anything, find your own address and the lab's subnet.

<details markdown="1">
<summary>Nudge</summary>

The attack box and the repository server share a subnet. The attack box's own address tells you where to look for the other host. The number after the slash in the address says how many addresses the subnet holds.

**Learn it:** ==action: Work out the subnet by hand== from an address and a prefix length. A `/24` keeps the first three numbers fixed and lets the last number vary, so it covers 256 addresses.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `ip -4 addr` in the attack box's terminal==.
2. \==action: Note your address and the prefix length on the interface that holds the lab address==.
3. \==action: Find the other live host with `nmap -sn <subnet>`==, using the subnet from step 2. The host that is not your own box is the repository server.

</details>

### Stage 1: The Exposure Flag {#hints-vm-exposure}

**Where:** the attack box's terminal, against the repository server. **Goal:** get code running on the repository browser without a login, and submit the flag that comes with it.

> Hint: The web service names a piece of software and a version. Work out which public CVE describes that software and that version, and what the attacker controls when the software takes input.

<details markdown="1">
<summary>Nudge</summary>

Fingerprint the web service and note the software name and version. Look up that name and version in the CVE database, and read the affected versions and the input the description names. Find a public proof of concept for that CVE and read it before you run it, so you know what it does on the target. The flag shows up once the code runs. The configuration the exploit reads also names the service account you need in Stage 3.

**Learn it:** ==action: Write down the version and the CVE number before you run anything==, then check the proof of concept against the CVE description.

**To learn more in game:** ask the phone for the Scanning and Exploitation field guide.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Fetch the front page and read the headers and the page source: `curl -i http://<repository server>/`==.
2. \==action: Search the CVE database for the software name and version, and read the entry's affected versions and its description==.
3. \==action: Find a public proof of concept for that CVE, read it, and then run it against the repository server from the attack box's terminal==.
4. \==action: Copy the flag from the output and submit it at the Evidence Relay Terminal==.

</details>

> Warning: A proof of concept written for another version may fail, or do something you did not expect. Check its version notes against the version you found in step 1.

### Stage 2: The Credentials Flag {#hints-vm-history}

**Where:** the repository server, through the access you got in Stage 1. **Goal:** find the password that was committed to the repository and then removed, and submit the flag that comes with it.

> Hint: The current files are the first place to look, and the last place a secret is still kept. Someone who removed a secret from a file may have left it in an earlier commit. Look at what changed over time.

<details markdown="1">
<summary>Nudge</summary>

Read the full history of the repository, every commit with its diff, and search it for the word a password would sit next to. Check the stash list too, because a stash is a second hiding place. Commit messages can say what a set of credentials was for, and that tells you which account they belong to.

**Learn it:** ==action: Read a commit message before you read its diff== and say in one line what the author meant to do.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Find the repository folders on the server with `find / -name .git -type d 2>/dev/null`==, and open the one that holds the project.
2. \==action: List every commit with `git log --oneline`==.
3. \==action: Search the whole history for the password: `git log -p | grep -i password`==. Note the commit the match came from.
4. \==action: Check the stash with `git stash list`, then `git stash show -p` on each entry==.
5. \==action: Copy the flag and submit it at the Evidence Relay Terminal==.

</details>

> Warning: Stopping at the current files misses this stage. Git never forgets, so a deleted password still sits in an older commit.

> Tip: A natural stopping point for a 60-minute class is after this stage. The next two stages use the same account.

### Stage 3: The Account Flag {#hints-vm-login}

**Where:** the attack box's terminal, logging in to the repository server. **Goal:** log in as the account the password belongs to, find the flag in its home directory, and submit it.

> Hint: A password only works on the account it was made for. The account's name is in the configuration file you read in Stage 1. Try the password against that account, then look at what is in its home directory.

<details markdown="1">
<summary>Nudge</summary>

SSH takes the account name before the host. Once you are in, the home directory belongs to that account. List everything in it, including hidden files, before you open any file. The flag is in one of the files there.

**Learn it:** ==action: List the home directory with `ls -la` before you open any file in it==. Names that start with a dot are hidden from a plain `ls`.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Log in with `ssh <account>@<repository server>`, and enter the password from Stage 2==.
2. \==action: List the home directory: `ls -la`==.
3. \==action: Open the files one at a time with `cat`, and look for the flag==.
4. \==action: Submit the flag at the Evidence Relay Terminal==.

</details>

> Warning: If the password is rejected, check the account name first. A correct password on the wrong account fails in the same way as a wrong password.

### Stage 4: The Root Flag {#hints-vm-root}

**Where:** the attack box's terminal, from the account you logged in as in Stage 3. **Goal:** find out what that account may run as root, use it to get a root shell, read the logs and the cached files that only root can open, and submit the flag.

> Hint: Ask what the account may do with sudo before you look for anything else. A rule that lets an account run a tool as root is a rule the account can abuse, if the tool can run other programs.

<details markdown="1">
<summary>Nudge</summary>

`sudo -l` lists the rules for the account. For each tool it lists, check the tool's documentation for a way to start a shell or run another command. The Privilege Escalation field guide has a section on escaping an allowed command to a shell. Once you have root, the access logs and a cached document sit where only root can read them. The flag is in the same place.

**Learn it:** ==action: Before you run a command as root, write down what it will do and what it could change==.

**To learn more in game:** ask the phone for the Privilege Escalation field guide.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `sudo -l` as the account you logged in as==. Note which tools may run as root, and whether they ask for a password.
2. \==action: Open the Privilege Escalation guide at the section "Method 4: Escaping an Allowed Command to a Shell (GTFOBins)", and find the entry for the tool you noted==.
3. \==action: Follow that entry to a root shell, then confirm with `id`==.
4. \==action: Read the access logs and the cached files kept for root. Find the flag, and submit it at the Evidence Relay Terminal==.

</details>

> Warning: You are root on a shared server. Read the logs, but do not change, delete or move them.

### Submitting the Four Flags {#hints-vm-submit}

> Tip: Submit each flag as soon as you find it. The Evidence Relay Terminal takes flags from the repository server.

Copy each flag exactly as it appears in the output.

## Try It on the Command Line (Optional) {#command-line}

These exercises use a repository and an account of your own. Do not run them on the lab server.

### A secret you commit and then remove {#cli-git-history}

Make a practice repository, commit a made-up secret, delete it, then search the history for it.

```
$ mkdir practice-repo && cd practice-repo && git init
$ echo "api_token=example-not-real" > config.txt
$ git add config.txt && git commit -m "Add config"
$ rm config.txt && git add -A && git commit -m "Remove config"
$ git log -p | grep -i token
```

> Note: The token is made up. The exercise is to see that the removal did not remove the value from the history.

\==action: Run the search, and note which commit the match came from==. Then \==action: run `git show` on that commit== and find the line you removed.

### Reading your own sudo rules {#cli-sudo}

On your own Kali box, run `sudo -l` and read the output line by line.

\==action: For each command the output lists, write one sentence saying what that command can do when it runs as root==. Ask whether the command can run another program or start a shell. This exercise is reading only. Do not try to escape a command on the lab server.

## After the Game: Questions and Exercises {#questions}

### Attacking the Server {#questions-server}

> Question: The exposure needed no login. Which single change would have stopped it, and what would still be exposed after that change?

> Question: Of the four stages, which one would a server administrator be least likely to notice from the logs? Give a reason.

> Question: Your login worked on the first try. What did the server check, and what did it leave unchecked?

> Action: Write a short checklist for the administrator of the repository server. Give one line for each of the four stages, naming the control that would have stopped that stage. Hand in the checklist.

## Further Reading {#further-reading}

- [CVE-2018-1000533 in the NVD](https://nvd.nist.gov/vuln/detail/CVE-2018-1000533)
- [Git Tools: Searching](https://git-scm.com/book/en/v2/Git-Tools-Searching)
- [The sudoers manual](https://www.sudo.ws/docs/man/sudoers.man/)
- [GTFOBins](https://gtfobins.github.io/)

