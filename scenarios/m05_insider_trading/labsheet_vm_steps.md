---
title: "Insider Trading: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the Insider Trading walkthrough, for the Quantum Dynamics research server: the step-by-step hints for finding the research portal, getting a foothold, switching accounts and reaching root, plus the command-line practice."
tags: ["web-reconnaissance", "bludit", "file-upload", "remote-code-execution", "metasploit", "sudo", "privilege-escalation", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m05_insider_trading/labsheet_vm_steps.md"
cybok:
  - ka: "NS"
    topic: "Networking Applications"
    keywords: ["NMAP", "PORT SCANNING"]
  - ka: "WAM"
    topic: "Server-Side Vulnerabilities and Mitigations"
    keywords: ["file upload vulnerability", "server-side misconfiguration and vulnerable components"]
  - ka: "SOIM"
    topic: "Fundamental Concepts"
    keywords: ["PENETRATION TESTING - SOFTWARE TOOLS", "PENETRATION TESTING - ACTIVE PENETRATION"]
  - ka: "OSV"
    topic: "Primitives for Isolation and Mediation"
    keywords: ["PRIVILEGE ESCALATION"]
  - ka: "AAA"
    topic: "Authentication"
    keywords: ["user authentication"]
---

> Note: This is the technical companion to the [Insider Trading walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m05-insider-trading/). Play the game there first, and come here for the research server hints.

## The Research Server {#server}

The research server holds the evidence for the case. The **Bludit CMS Server Terminal** in the server room opens a Kali attack box on your own machine, and the research portal sits on the same network as that box. The network holds four flags. You submit each one at the **SAFETYNET Drop-Site Terminal**, also in the server room. The main walkthrough covers the game around this work. This sheet covers the work on the server.

1. **Recon flag.** Find the portal, read what it leaves in plain view, and find the admin login it holds.
2. **Foothold flag.** Use the admin login to get a shell through the portal's image upload, and read the file the web service keeps.
3. **Staging flag.** Switch to the manager account from the note, and read the staging manifest in its home directory.
4. **Root flag.** Find what the manager account may run as root, use that to get a root shell, and read the Architect's authorisation in `/root`.

The flag values are generated for each game, so this sheet never gives one. It says where each flag appears and how to reach it.

## Concepts {#concepts}

You do not need to read all of this before you start. Come back to it when a stage leaves you unsure what a tool is telling you.

### Web Reconnaissance {#recon}

A web server answers requests for the pages it links to, and for many it does not link to. A **directory scan** tries a list of likely names against a site and reports the ones that exist. Each hit is a file or folder the site serves, whether or not any page points to it. A scan also shows what the site is built from: a CMS name, a version and a login page.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| A login page at a predictable path, such as `/admin` or a CMS's own folder | The admin side of the site | Note the CMS name and find where its login usually sits |
| A text file in the web root that no page links to | Something someone left behind | Open it and read it to the end |
| A response that differs from the rest in its code or length | Something the site handles differently | Compare responses rather than reading each page |

Example output from a directory scan. These lines are illustrative and do not come from this game:

```
+ http://<host>/admin       (CODE:200  SIZE:1409)
+ http://<host>/notes.txt   (CODE:200  SIZE:734)
```

> Question: Why would a site leave a file behind that no page links to, and what does a scan tell you that a browser does not?

### Authenticated Upload and Remote Code Execution {#upload}

Upload features exist to accept pictures and documents. A site that checks only part of a file's name, or only what the file claims to be, can end up storing a file that the server later runs as a program. Code that the server runs on an attacker's behalf is **remote code execution**.

This kind of upload is **authenticated**. The feature sits behind a login, so the attacker needs a valid admin session before the upload is accepted. A leaked login is what unlocks the feature.

### Users, Home Directories and Permissions {#accounts}

Every Linux account has a home directory, and file permissions decide who can read a file. `ls -l` shows the owner, the group and a string of permission letters.

```
-rw------- 1 alice alice 2048 Oct 18 09:12 manifest.txt
```

Read it this way: the owner, `alice`, can read and write the file, and no one else can read it at all. A web service runs as its own account, so it is locked out. `su - alice` switches to that account if you know its password.

Passwords get reused. A password that opens a web admin page is sometimes also the Linux password for the same person. Trying it on the account is a fair step, and a quick one.

> Question: What would change in the permission string if the file were `-rw-r-----`, and who could read it then?

### Sudo and Least Privilege {#sudo}

`sudo` runs one command as another user, usually root. A sudo rule says which user may run which command, and whether they must type their own password. `sudo -l` lists the rules that apply to the account you are in. Most rules are for admin tasks. The risk starts when a rule lets an ordinary account run a program that can start a shell of its own.

Example output, illustrative only:

```
User alice may run the following commands:
    (root) NOPASSWD: /usr/bin/less /srv/some-file
```

Read it this way: `alice` can run `less` as root on that one file, with no password. `less` is a pager. It can run shell commands from inside itself, and when it runs as root, those commands run as root too. The GTFOBins reference below lists this escape.

> Question: What would the rule allow if it named all of `/srv` rather than one file, and why does the rule name one file?

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. The Recipe names the tools and the steps, never a flag value.

> Tip: Every command in this section runs in the attack box's terminal, which the Bludit CMS Server Terminal opens. You never leave the server room: the drop-site terminal is in the same room.

> Tip: A natural stopping point for a 60-minute class is after Stage 2, once you hold the foothold.

### Getting Onto the Attack Box {#hints-vm-attack-box}

**Where:** the Bludit CMS Server Terminal, in the server room. **Goal:** a working terminal on the attack box, and the network it sits on.

> Hint: The terminal opens your attack box, not the portal. The portal is on the same network as the box. Before you scan anything, find out what that network is.

<details markdown="1">
<summary>Nudge</summary>

The attack box's own address tells you the subnet. Print it and note the number after the slash. That number tells you how many addresses the subnet holds. A `/24` keeps the first three numbers fixed and lets the last one vary.

**Learn it:** ==action: Work out the subnet by hand== from an address and its prefix length.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `ip -4 addr` in the attack box's terminal==.
2. \==action: Note the address and the prefix length on the interface that holds the lab address==. You will use them as `<subnet>` in the next stage.

</details>

### Stage 1: The Recon Flag {#hints-vm-recon}

**Where:** the attack box's terminal, against the research portal. **Goal:** find the portal, find the note it leaves in plain view, and submit the flag from that note.

> Hint: The portal is a web server, and the CMS it runs keeps its admin login where a scan can find it. The note you need is also a web file, and no page links to it. Look for files the scan finds that the pages do not mention.

<details markdown="1">
<summary>Nudge</summary>

Scan the subnet for live hosts, then scan the host you find for web services. Then run a directory scan against the portal to find files it serves but does not link. Compare the responses you get back. The note is a plain text file. Read the whole of it, past the first lines, and find the section headed with the credentials.

**Learn it:** ==action: Before you scan, write down the paths you expect a CMS to use for its login==, then check the scan's results against your list.

**To learn more in game:** ask Agent HaX on the phone for the Bludit CMS guide. It is offered once you reach the server room.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Find the live hosts with `nmap -sn <subnet>`==.
2. \==action: Scan the portal for its web service and version: `nmap -sV -p 80 <host>`==. The portal serves on port 80.
3. \==action: Run a directory scan against the portal: `dirb http://<host>/`==, and note every path it reports.
4. \==action: Fetch the text file the scan found: `curl -s http://<host>/<file>`==, and read the whole file to the end. The admin username and password are the two lines under the **Creds** heading. The flag is in the same note, after the password.
5. \==action: Copy the flag and submit it at the SAFETYNET Drop-Site Terminal==.

</details>

> Warning: Guessing the login is the slow fallback. The note is already on the portal, so start there.

### Stage 2: The Foothold Flag {#hints-vm-foothold}

**Where:** the attack box's terminal, then the portal's server. **Goal:** a shell on the portal's server, and the flag the web service keeps.

> Hint: The note gave you a login, but a login to the admin side is not a shell on the server. Which feature of the portal stores files you send it? Which account does the server run those files as?

<details markdown="1">
<summary>Nudge</summary>

Check the admin login by hand in a browser on the attack box before you use it in a tool. Then use the image upload as the way in. A Metasploit module targets this version of the CMS and runs the upload for you. Once the module gets you a shell, the shell runs as the web service's account, not as the admin. That account can read the CMS's own files, and the flag is among them.

**Learn it:** ==action: Check the credentials by hand first==. A tool that fails on bad credentials tells you less than the page does.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Start Metasploit with `msfconsole`==.
2. \==action: Load the module with `use exploit/linux/http/bludit_upload_images_exec`==.
3. \==action: Set `RHOSTS` to the portal's address, and set `BLUDITUSER` and `BLUDITPASS` to the username and password from the note's **Creds** section==. Check the rest with `show options`, then run it with `run`.
4. \==action: Once the shell opens, make it a proper terminal: `python3 -c 'import pty; pty.spawn("/bin/bash")'`==.
5. \==action: List the CMS's temporary content folder under the Bludit install directory, `/var/www/bludit-3-9-2/bl-content/tmp`, with `ls -la`, then read the file the flag is in==. Submit the flag at the SAFETYNET Drop-Site Terminal.

</details>

> Warning: The shell belongs to the web service's account. It cannot read the admin's own home directory, and that is the next stage.

### Stage 3: The Staging Flag {#hints-vm-manifest}

**Where:** the attack box's terminal, on the portal's server. **Goal:** switch to the manager's Linux account and read the staging manifest in its home directory.

> Hint: The web service's account is not the one that holds the file. Which account does the note name, and what does a Linux account need in order to log in to it?

<details markdown="1">
<summary>Nudge</summary>

The username in the note is also a Linux account on the server. The password may be the same for both logins. Try the switch, then read the permission string on the home directory before you open anything inside it.

**Learn it:** ==action: Read the permission string from `ls -l` before you try to open a file in a home directory==. The owner's letters tell you who can get in.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Switch to the account named in the note with `su - <username>`==, and enter the password from the note's **Creds** section when asked.
2. \==action: List the home directory with `ls -la`==, then read the manifest it holds. The flag is in the manifest. Submit it at the SAFETYNET Drop-Site Terminal.

</details>

> Warning: The `su` command needs a proper terminal to ask for the password. If it fails straight away, go back and make the shell a proper terminal, as in Stage 2.

### Stage 4: The Root Flag {#hints-vm-root}

**Where:** the attack box's terminal, on the portal's server as the manager's account. **Goal:** find what the manager may run as root, use it to get a root shell, and read the Architect's authorisation in `/root`.

> Hint: Ask the system which commands this account may run as root. Then ask which of them can start a shell of their own.

<details markdown="1">
<summary>Nudge</summary>

`sudo -l` lists the rules for the account you are in. Read every line. One rule lets the account run one program as root without a password. Think about what that program can do from inside itself, and look up the program's escape on GTFOBins.

**Learn it:** ==action: Read a sudo rule before you run anything under it==. Write down which user it runs as, whether it needs a password, and which file it names.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `sudo -l`==. If it asks for a password, enter the manager's password from the note.
2. \==action: Note the file the permitted `less` rule names==.
3. \==action: Run `sudo less <that file>`, then, inside `less`, type `!/bin/sh` and press Enter==. The escape only works inside an open `less`.
4. \==action: Check you are root with `id`, list `/root` with `ls -la`, and read the flag file there==. Submit it at the SAFETYNET Drop-Site Terminal.

</details>

> Warning: Reading the permitted file gives you its text and no root shell. The shell comes from the escape, not from reading the file.

### Submitting the Four Flags {#hints-vm-submit}

**Where:** the SAFETYNET Drop-Site Terminal, in the server room. **Goal:** submit each flag once.

> Hint: Each flag goes into the drop-site terminal on its own, and it takes them in any order. The case needs all four before the call to Agent HaX can open.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk to the SAFETYNET Drop-Site Terminal in the server room==.
2. \==action: Submit each flag you have, one at a time==, copied from where you found it.

</details>

> Warning: The root flag is the one students most often miss. It sits behind the escape, not behind the scan, so a scan alone never reaches it.

## What the Tools and Locks Are Telling You {#errors}

| What you see | Usual cause |
| --- | --- |
| The login is refused, or the portal sends you back to its login page | A typo in the username or password, or a trailing space copied from the note |
| The exploit module stops with a missing option | `BLUDITUSER` or `BLUDITPASS` is blank. Both are required, not just `RHOSTS` |
| `su` fails straight away, or the shell shows no prompt for a password | No proper terminal is attached. Make the shell a proper terminal first |
| `sudo -l` lists fewer rules than you expected | You are in a different account from the one you think. Run `id` to check |
| `less` opens the file and gives you no shell | You have not typed `!` followed by a shell command inside `less` |
| `Permission denied` on the manifest or on `/root` | The file belongs to another account. Check its permission string with `ls -l` first |

## Try It on the Command Line (Optional) {#command-line}

These exercises use your own machine or a lab you control, not the research server. Run them only on machines you own or are allowed to test.

### Reading Permissions on Your Own Files {#cli-perms}

In your own home directory, ==action: make a test file, check who can read it, restrict it, and check again==:

```bash
echo "test note" > ~/permtest.txt
ls -l ~/permtest.txt
chmod 600 ~/permtest.txt
ls -l ~/permtest.txt
rm ~/permtest.txt
```

**Learn it:** ==action: Compare the two permission strings and say who can read the file after `chmod 600`==. Then check your answer by trying to read the file from a second account, if you have one.

### Checking Your Own Sudo Rules {#cli-sudo}

==action: List what your own account may run with sudo==:

```bash
sudo -l
```

**Learn it:** ==action: Read each rule and write down who it runs as and whether it asks for a password==. Do not edit the sudoers file on a machine you do not own.

### Escaping a Pager, Harmlessly {#cli-less}

On a file you own, ==action: open it in `less` and run a shell command from inside it==:

```bash
echo "a practice file" > ~/pagertest.txt
less ~/pagertest.txt
```

Inside `less`, type `!id` and press Enter, then `q` to quit.

**Learn it:** ==action: Compare the output of `id` with the account you expect==. This ran as your own account, so it gained you nothing. The same escape run through `sudo less` runs as root, which is why the rule on the research server matters.

## Attacking the Server: Questions and Exercises {#attacking-the-server}

> Question: Why was the note on the portal a bigger problem than a weak password would have been?

> Question: The web service's account could not read the manifest, but the manager's account could. What does that tell you about where a secret should be kept?

> Question: Which stages depend only on the note, and which also depend on the upload feature?

> Action: ==action: Write a short note for the portal's owner that lists the four weaknesses in the order an attacker meets them, with one fix for each.== Hand in the note with your answers to the three questions above.

## Further Reading {#further-reading}

- [Bludit CMS Exploitation](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/bludit-cms-exploitation/), the SAFETYNET field guide for the same workflow, from recon to root.
- [CVE-2019-16113](https://nvd.nist.gov/vuln/detail/CVE-2019-16113), the Bludit image upload weakness that this portal's version carries.
- [GTFOBins: less](https://gtfobins.github.io/gtfobins/less/), the reference for the pager escape used in the root stage.
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), on why upload checks fail.
