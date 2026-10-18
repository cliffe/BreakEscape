---
title: "Ghost in the Machine: VM Technical Steps"
author: ["Z. Cliffe Schreuders"]
license: "CC BY-SA 4.0"
description: "Technical companion to the Ghost in the Machine walkthrough, for the training network: the step-by-step hints for scanning the network, getting past the FTP service and the distcc daemon, and reading the web host's encoded price list, plus the command-line practice."
tags: ["nmap", "reconnaissance", "proftpd", "backdoor", "distcc", "cve-2004-2687", "rot13", "cyberchef", "break-escape"]
categories: ["introducing_attacks"]
type: ["game-based-learning", "lab-sheet"]
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/m03_ghost_in_the_machine/labsheet_vm_steps.md"
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

> Note: This is the technical companion to the [Ghost in the Machine walkthrough](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine/). Play the game there first, and come here for the training-network hints.

## The Training Network {#network}

The VM Access Terminal in the server room opens a Kali attack box on your own machine. From that box you scan a training network that Zero Day Syndicate uses to rehearse its exploits. The network holds four flags, and you submit each one at the drop-site terminal in the same room. The main walkthrough covers the game around this work. This sheet covers the work on the network.

1. **Scan flag.** Map the network and read what the services say.
2. **FTP flag.** Get past the FTP service and read the notes it keeps.
3. **Pricing flag.** Read the web host's encoded price list and decode it.
4. **distcc flag.** Get command execution through the legacy build and read the operational log.

The flag values are generated for each game, so this sheet never gives one. It says where each flag appears and how to get at it.

## Concepts {#concepts}

You do not need to read all of this before you start. Come back to it when a stage leaves you unsure what a tool is telling you.

### Network Reconnaissance {#recon}

Before you attack anything, you map it. A network scan (with a tool such as **nmap**) finds which hosts are up, which ports and services they run, and what version each service reports. It also reads the **banners** that services announce when you connect. A version is often enough to tell you whether a known weakness applies, so the scan result is a shortlist, not the end of the job.

| What you see | What it probably is | What to try |
| --- | --- | --- |
| An FTP banner naming a server and a version | An FTP service you can identify by its version | Check whether that exact version has a known weakness |
| A web server answering over HTTP | A site with a page you can read | Read the page source, not only the rendered page |
| A high port the scan names as a service you do not know | A service nobody has told you about | Connect and read what it says. If the default scan misses it, scan every port |

The field guide has the exact scan commands. In game, open your phone and choose **[Send me a field guide.]** then **[The recon and network mapping guide.]**, which is offered once you reach the server room. Second route: [Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/).

### Service Exploitation: A Trojaned Release and a Trusting Daemon {#exploitation}

Two services on the training network can be made to run commands for you, by very different routes. The field guides carry the workflow. The point here is the class of weakness behind each one.

**The ProFTPD 1.3.3c source backdoor.** In 2010 the source release of this FTP server was tampered with before it was published, so anyone who downloaded and installed that release was running hidden back-door code. It is not a flaw in the design. It is a poisoned supply chain. Anonymous login to the FTP service gets you the banner and a service list. It does not get you past the service. The intelligence sits behind the backdoor.

**distcc (CVE-2004-2687).** distcc spreads software-compile jobs across machines, and the daemon trusts any machine on its network to send it work. That trust is the weakness: the service assumes the network around it is friendly. The legacy build runs it, and the operational records sit behind it.

The two field guides have the step-by-step workflow for each. In game, open your phone, choose **[Send me a field guide.]** then **[The ProFTPD exploitation guide.]** or **[The distcc exploitation guide.]**. Each appears once you have the scan flag. Second route: [ProFTPD Exploitation Workflow](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/proftpd-exploitation-workflow/) and [distcc Exploitation](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/distcc-exploitation/).

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. The Recipe names the tools and the steps, never a flag value.

> Tip: Every command in this section runs in the attack box's terminal, which the VM Access Terminal opens. Nothing here needs you to leave the server room except the drop-site, where the flags go.

### Getting Onto the Attack Box {#hints-vm-attack-box}

**Where:** the VM Access Terminal, in the server room. **Goal:** a working terminal on the attack box, and its subnet.

> Hint: The terminal opens the attack box, not the training network. Before you scan anything, find out what network the attack box sits on.

<details markdown="1">
<summary>Nudge</summary>

The training network is on the same subnet as the attack box, so the attack box's own address tells you where to look. Print that address and note the prefix length after the slash. The prefix length tells you how many addresses the subnet holds.

**Learn it:** ==action: Work out the subnet by hand== from an address and a prefix length. A `/24` keeps the first three numbers fixed and lets the last number vary, so it covers 256 addresses.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Run `ip -4 addr` in the attack box's terminal==.
2. \==action: Note the address and the prefix length== on the interface that holds the lab address. You will use them as `<subnet>` in the scan stage.

</details>

### Stage 1: The Scan Flag {#hints-vm-scan}

**Where:** the attack box's terminal, against the training network. **Goal:** map the network, read the services, and submit the flag you find in their output.

> Hint: Map before you touch anything. A scan tells you which hosts are up and what each service says it is. The flag shows up in what a service tells you when you connect.

<details markdown="1">
<summary>Nudge</summary>

Scan the subnet for hosts first. Then scan the hosts you find for services and versions. Connect to the FTP service and read the banner it gives you, even though anonymous login gets you nothing more. Read the web host's page source as well as what the page shows. The same flag appears in more than one place, so you only need to find it once.

**Learn it:** ==action: Connect to a service by hand with `nc`== and read its first line before you let a tool read it for you.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The recon and network mapping guide.]**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Find the live hosts with a ping sweep: `nmap -sn <subnet>`==, using the subnet from the first stage.
2. \==action: Scan the hosts you found for services and versions: `nmap -sV <host>`==.
3. \==action: Connect to the FTP service and read its banner: `nc <host> 21`, then `quit`==. Log in as `anonymous` only to see what the banner says.
4. \==action: Fetch the web host's front page and read the source: `curl -i http://<host>/`==. Look for HTML comments.
5. \==action: Copy the flag and submit it at the drop-site terminal==.

</details>

> Warning: If a service on the high port does not appear in your scan, scan every port with `nmap -sV -p- <host>` before you decide it is not there.

### Stage 2: The FTP Flag {#hints-vm-ftp}

**Where:** the attack box's terminal, against the FTP service. **Goal:** use the backdoor to get a root shell on the FTP host, read the notes the root account keeps, and submit the flag.

> Hint: The banner names a version. Think about what that release's source code history says about whether it can be trusted, and which service in the scan would tell you so.

<details markdown="1">
<summary>Nudge</summary>

This ProFTPD build carries a hidden backdoor in its source release. It is a 2010 supply-chain compromise and has no CVE number. A Metasploit module targets exactly this build and version. Once the backdoor runs, you have a root shell, and the notes sit in root's home directory, which a normal account cannot read.

**Learn it:** ==action: Before you run anything, write down the version from the banner and a one-line history of that release==. Then check the module's description against what you wrote.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The ProFTPD exploitation guide.]**. It appears once you have the scan flag.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Start Metasploit with `msfconsole`==.
2. \==action: Search for the build with `search proftpd_133c`, then load `unix/ftp/proftpd_133c_backdoor` with `use`==.
3. \==action: Set `RHOSTS` to the FTP host, then check the rest with `show options`==, and run the module with `run`.
4. \==action: Once you have the root shell, list `/root` and read the FTP box notes==. Copy the flag and submit it at the drop-site terminal.

</details>

> Warning: Logging in anonymously and browsing the FTP area gets you the service list and nothing more. The shell comes only from the exploit.

### Stage 3: The Pricing Flag {#hints-vm-pricing}

**Where:** the attack box's terminal, then the CyberChef workstation. **Goal:** read the web host's price list from its page source and decode it. The price list is encoded, not encrypted.

> Hint: The web host's page shows you a few lines, but the list you need is somewhere else on the page. Look at what the page is made of, not only what it displays.

<details markdown="1">
<summary>Nudge</summary>

Read the page source, not the rendered page. The list sits in an HTML comment. It reads like scrambled English with normal spacing, which is ROT13. The decoding ideas are in the main walkthrough at [Encoding Is Not Security](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine/#encoding) and [Decoding What You Find](https://cliffe.github.io/HacktivityLabSheets/labs/introducing_attacks/m03-ghost-in-the-machine/#hints-decode).

**Learn it:** ==action: Practise on a made-up sentence first==. ROT13 turns `Hello` into `Uryyb`, and shifting `Uryyb` back 13 places gives `Hello` again. Then do the same with the real comment.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Fetch the page source: `curl -s http://<host>/`==, and copy the whole HTML comment that holds the list.
2. \==action: In CyberChef, paste it into **Input** and add **ROT13**==.
3. \==action: Read the whole decoded text to the end==. The flag comes after the price list. Copy it and submit it at the drop-site terminal.

</details>

> Warning: The first lines of the decoded text are the price list, and it is easy to stop there. Read to the end.

### Stage 4: The distcc Flag {#hints-vm-distcc}

**Where:** the attack box's terminal, against the legacy build. **Goal:** get command execution through the distcc daemon, read the operational log, and submit the flag.

> Hint: The runbook calls one service a legacy build, and the scan shows it on a high port. What does a compile daemon assume about the machines that can reach it?

<details markdown="1">
<summary>Nudge</summary>

distcc runs compile jobs for any machine that can reach it, and this version does not check who is asking. CVE-2004-2687 is that weakness. A Metasploit module exploits it and runs a command on the target. Once the command runs, the operational log is in the home directory of the account the daemon runs as, so look there. Read the whole file.

**Learn it:** ==action: Confirm the service and its version from the banner before you exploit it==. A banner that matches the weakness is your evidence that the module is the right one.

**To learn more in game:** open your phone, choose **[Send me a field guide.]** then **[The distcc exploitation guide.]**. It appears once you have the scan flag.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Confirm the service on its port: `nmap -sV -p 3632 <host>`==.
2. \==action: Load the module with `use unix/misc/distcc_exec` in `msfconsole`==, then set `RHOSTS` to the host and `RPORT` to 3632. Check the rest with `show options`, and run it with `run`.
3. \==action: Once you have a session, find the home directory of the distccd account and read the transaction log to the end==. The flag is in the log.
4. \==action: Submit the flag at the drop-site terminal==. The drop-site then prints the transaction log in the game.

</details>

> Warning: The log is not in any banner. A scan shows you the service, and only the exploit gets you the log, so scanning alone will not get you this flag.

### Submitting the Four Flags {#hints-vm-submit}

**Where:** the drop-site terminal, in the server room. **Goal:** submit each flag once.

> Hint: Each flag goes into the drop-site terminal on its own. The ending needs all four.

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk back to the drop-site terminal in the server room==.
2. \==action: Submit each flag you have, one at a time==, copying each from where you found it.

</details>

> Warning: If the confrontation will not open, you do not have all four flags in yet. The distcc flag is the one most often missing.

## Try It on the Command Line (Optional) {#command-line}

The network stage already happens on a Kali shell. These short exercises let you practise the scanning and banner-reading techniques on a lab you control, not on the training network. Scan only machines you own or are allowed to test.

### A version scan you own {#cli-nmap}

Against a lab VM you control, ==action: scan for open ports and service versions==:

```bash
nmap -sV 192.168.56.0/24
```

**Learn it:** ==action: Pick one open port from the output and connect to it by hand with `nc <host> <port>`==. Read the banner yourself, then compare it with the version `-sV` reported.

### Reading a page source by hand {#cli-curl}

On a web server you control, ==action: fetch the page source and list the HTML comments with their line numbers==:

```bash
curl -s http://<your-lab-host>/ | grep -n '<!--'
```

> Note: A browser does not show HTML comments on the rendered page, but they are still in the source. Anything a site author hides in a comment is there for anyone who reads the source.

## Further Reading {#further-reading}

- The SAFETYNET field guides handed out in this mission, in game and published: [Reconnaissance and Network Mapping](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/), [ProFTPD Exploitation Workflow](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/proftpd-exploitation-workflow/) and [distcc Exploitation](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/distcc-exploitation/).
- The broader [Scanning and Exploitation](https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/scanning-and-exploitation/) field guide, for the scan-to-exploit workflow end to end.
- The nmap reference guide (`man nmap`) for the reconnaissance stage.
- The [CVE-2004-2687 entry](https://nvd.nist.gov/vuln/detail/CVE-2004-2687) for the distcc weakness.

