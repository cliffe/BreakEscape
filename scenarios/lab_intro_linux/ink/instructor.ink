// ===========================================
// LINUX FUNDAMENTALS AND SECURITY LAB
// Introduction to Linux and Security
// ===========================================
// Game-Based Learning replacement for lab sheet
// Original: introducing_attacks/1_intro_linux.md
// ===========================================

// Progress tracking
VAR linux_basics_discussed = false
VAR command_line_skills_discussed = false
VAR vi_editor_discussed = false
VAR piping_discussed = false
VAR redirection_discussed = false
VAR networking_discussed = false
VAR ssh_discussed = false
VAR hydra_discussed = false
VAR kali_intro_discussed = false

// Detailed topic tracking
VAR pwd_ls_discussed = false
VAR file_manipulation_discussed = false
VAR man_pages_discussed = false
VAR piping_examples_discussed = false
VAR redirection_examples_discussed = false
VAR ifconfig_discussed = false
VAR ssh_basics_discussed = false
VAR ssh_x_forwarding_discussed = false
VAR bruteforce_basics_discussed = false

// Challenge completion
VAR completed_vi_challenge = false
VAR completed_piping_challenge = false
VAR completed_ssh_challenge = false
VAR completed_hydra_challenge = false

// Instructor relationship
VAR instructor_rapport = 0
VAR deep_dives_completed = 0

// Global variables (synced from scenario.json.erb)
VAR player_name = "Agent 0x00"
VAR lockpicking_key_received = false

// NPC item inventory variables
VAR has_key = false

// ===========================================
// ENTRY POINT - LINUX INSTRUCTOR
// ===========================================

=== start ===
~ instructor_rapport = 0

Welcome back, {player_name}. What would you like to discuss?

-> linux_training_hub

// ===========================================
// TIMED INTRO CONVERSATION (Game Start)
// ===========================================

=== intro_timed ===
~ instructor_rapport = 0

Welcome to Linux Fundamentals and Security, {player_name}. I'm your technical instructor for this session.

This lab covers essential Linux command-line skills, remote administration via SSH, and basic penetration testing techniques. All crucial skills for field operations.

Let me explain how this lab works. You'll find three key resources here:

First, there's a Lab Sheet Workstation in this room. This gives you access to detailed written instructions and exercises that complement our conversation. Use it to follow along with the material.

Second, in the VM lab room to the north, you'll find terminals to launch virtual machines. You'll work with both a Kali Linux attacker machine and a vulnerable desktop system for hands-on practice.

Finally, there's a Flag Submission Terminal where you'll submit flags you capture during the exercises. These flags demonstrate that you've successfully completed the challenges.

You can talk to me anytime to explore Linux concepts, get tips, or ask questions about the material. I'm here to help guide your learning.

Ready to get started? Feel free to ask me about any topic, or head to the lab sheet workstation and VM room when you're ready to begin the practical exercises.

-> linux_training_hub

// ===========================================
// MAIN TRAINING HUB
// ===========================================

=== linux_training_hub ===

What would you like to cover?

+ {not linux_basics_discussed} [Learn about Linux basics and why it matters]
    -> linux_basics_intro
+ {not command_line_skills_discussed} [Essential command-line skills]
    -> command_line_skills
+ {not vi_editor_discussed} [Learn the vi editor]
    -> vi_editor_intro
+ {not piping_discussed} [Piping between programs]
    -> piping_intro
+ {not redirection_discussed} [Redirecting input and output]
    -> redirection_intro
+ {not networking_discussed} [Basic Linux networking]
    -> networking_basics
+ {not kali_intro_discussed} [Introduction to Kali Linux]
    -> kali_intro
+ {not ssh_discussed} [Remote shell access with SSH]
    -> ssh_intro
+ {not hydra_discussed} [Attacking SSH with Hydra]
    -> hydra_intro
+ {linux_basics_discussed and command_line_skills_discussed} [Show me the essential commands reference]
    -> commands_reference
+ {ssh_discussed or hydra_discussed} [Tips for the hands-on challenges]
    -> challenge_tips
+ [I'm ready to start the practical exercises]
    -> ready_for_practice
+ [That's all I need for now]
    -> end_session

// ===========================================
// LINUX BASICS
// ===========================================

=== linux_basics_intro ===
~ linux_basics_discussed = true
~ instructor_rapport += 5
# influence_increased

Excellent starting point. Let me explain why Linux matters for security work.

Linux is the backbone of modern internet infrastructure. Google, Facebook, Amazon—they all run Linux servers at massive scale. When you're conducting penetration tests or investigating security incidents, you'll encounter Linux systems constantly.

More importantly for us, the best security tools are Linux-native. Kali Linux contains hundreds of specialized tools for penetration testing, forensics, and security analysis. Mastering Linux means mastering your toolkit.

Linux comes in many "distributions"—different flavors packaged for different purposes. Ubuntu for ease of use, Debian for stability, Kali for security testing. They all share the same core commands and concepts, so learning one helps you understand them all.

* [Why not just use Windows?]
    ~ deep_dives_completed += 1
    You: Why can't we just use Windows for security work?
    -> windows_comparison
* [What makes Kali special?]
    ~ deep_dives_completed += 1
    You: What specifically makes Kali Linux the industry standard?
    -> kali_explanation
* [Got it, let's move on]
    You: Understood. Linux is essential for security work.
    -> linux_training_hub

=== windows_comparison ===
~ instructor_rapport += 8
# influence_increased

Fair question. Windows absolutely has its place—many enterprise environments are Windows-heavy, and you'll need those skills too.

But for offensive security work, Linux has three major advantages:

First, the tools. Most cutting-edge security research happens in the open-source community, and those tools are Linux-first. Sure, some get ported to Windows eventually, but you'll always be behind the curve.

Second, the control. Linux gives you deep system access and transparency. You can see exactly what's happening, modify anything, and automate everything. That level of control is crucial when you're trying to exploit systems or analyze malware.

Third, the culture. The security community lives in Linux. Understanding Linux means understanding how other security professionals work, communicate, and share knowledge.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

=== kali_explanation ===
~ instructor_rapport += 8
# influence_increased

Kali is essentially a curated arsenal of security tools, all pre-configured and ready to use.

Offensive Security—the company behind Kali—maintains hundreds of tools across every category: information gathering, vulnerability analysis, wireless attacks, exploitation, post-exploitation, forensics, you name it.

What makes Kali special isn't just the tools, though. It's the integration. Everything works together. The tools are kept up-to-date. Documentation is solid. And it's become the lingua franca of penetration testing—when security professionals share techniques, they assume you're using Kali.

Think of it like this: you *could* build your own toolkit from scratch, hunting down each tool individually and figuring out dependencies. Or you could use Kali and get straight to the actual security work.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

// ===========================================
// COMMAND-LINE SKILLS
// ===========================================

=== command_line_skills ===
~ command_line_skills_discussed = true
~ instructor_rapport += 5
# influence_increased

Right, let's build your command-line fundamentals. These are skills you'll use every single day in the field.

The command line might seem archaic compared to graphical interfaces, but it's exponentially more powerful. You can automate tasks, chain commands together, work on remote systems, and handle massive datasets—all from a simple text interface.

I'll cover the essential commands: navigating the filesystem, manipulating files and directories, viewing content, and getting help when you're stuck.

* [Show me the navigation commands]
    ~ pwd_ls_discussed = true
    You: How do I navigate the filesystem?
    -> navigation_commands
* [How do I work with files?]
    ~ file_manipulation_discussed = true
    You: What about creating and editing files?
    -> file_manipulation
* [How do I get help when stuck?]
    ~ man_pages_discussed = true
    You: What if I don't know what a command does?
    -> man_pages
* [I want to see the full command reference]
    You: Can I see a complete list of essential commands?
    -> commands_reference

=== navigation_commands ===
~ instructor_rapport += 3
# influence_increased

Navigation is your foundation. Here are the essentials:

pwd - "print working directory". Shows exactly where you are in the filesystem. Lost? Run pwd.

ls - lists files in your current directory. Add "-la" for detailed information including hidden files and permissions. You'll use "ls -la" constantly.

cd - "change directory". Moves you around the filesystem. "cd .." goes up one level, "cd" alone takes you home.

Pro tip: pressing Tab autocompletes filenames and commands. Type a few letters, hit Tab, save yourself endless typing. And use the up arrow to cycle through previous commands.

* [Tell me more about ls flags]
    You: What other useful flags does ls have?
    Great question. "ls -lt" sorts by modification time, newest first. "ls -lh" shows human-readable file sizes. "ls -lR" recursively lists subdirectories. You can combine them: "ls -lhta" shows all files, human-readable sizes, sorted by time.
    ~ instructor_rapport += 5
    # influence_increased
    -> command_line_followup
* [What about hidden files?]
    You: What are hidden files?
    In Linux, files starting with "." are hidden—they don't show up in normal ls output. Configuration files are typically hidden. Use "ls -a" to see them. You'll frequently need to examine hidden config files during security assessments.
    ~ instructor_rapport += 5
    # influence_increased
    -> command_line_followup
* [Got it]
    -> command_line_followup

=== command_line_followup ===
+ [Show me file manipulation commands]
    -> file_manipulation
+ [How do I get help when stuck?]
    -> man_pages
+ [Back to the main menu]
    -> linux_training_hub

=== file_manipulation ===
~ instructor_rapport += 3
# influence_increased

Creating, copying, moving, and viewing files. Bread and butter stuff.

mkdir - creates directories. "mkdir mydir" creates a new folder.

cp - copies files. "cp source destination" copies a file. Add "-r" for recursive directory copying.

mv - moves or renames files. "mv oldname newname" renames. "mv file /path/to/destination/" moves it.

cat - dumps file contents to the screen. "cat filename" shows the whole file.

echo - prints text. "echo 'hello world'" displays text. Useful for testing and scripting.

* [Tell me more about viewing files]
    You: Cat seems limited for large files...
    Exactly right. For large files, use less. "less filename" lets you scroll through, search with "/", quit with "q". Much more practical than cat for big files.
    ~ instructor_rapport += 8
    # influence_increased
    -> command_line_followup
* [What about creating files?]
    You: How do I create a new empty file?
    Several ways. "touch filename" creates an empty file. Or redirect output: "echo 'content' > filename" creates a file with content. We'll cover redirection shortly.
    ~ instructor_rapport += 5
    # influence_increased
    -> command_line_followup
* [Understood]
    -> command_line_followup

=== man_pages ===
~ man_pages_discussed = true
~ instructor_rapport += 8
# influence_increased

This is possibly the most important skill: learning to teach yourself.

man - the manual pages. "man command" shows comprehensive documentation for any command. Navigation: space to page down, "b" to page up, "/" to search, "q" to quit.

Example: "man ls" shows every flag and option for ls. The man pages are detailed, sometimes overwhelming, but they're authoritative.

Alternative: info command provides similar documentation, sometimes more detailed.

Pro tip: if you're really stuck, try "command --help" for a quick summary. Many tools also have online documentation, but man pages are always available, even when you're offline on a compromised system with no internet.

* [How do I search man pages?]
    You: Can I search across all man pages for a topic?
    Yes. "man -k keyword" searches all man page descriptions. "apropos keyword" does the same thing. Useful when you know what you want to do but not which command does it.
    ~ instructor_rapport += 10
    # influence_increased
    -> command_line_followup
* [What if man pages are too dense?]
    You: Man pages can be pretty technical...
    True. For beginner-friendly explanations, try "tldr command"—it shows simplified examples. Or search online for "command examples". But learning to parse man pages is a skill worth developing. They're accurate, complete, and always available.
    ~ instructor_rapport += 8
    # influence_increased
    -> command_line_followup
* [Makes sense]
    -> command_line_followup

// ===========================================
// VI EDITOR
// ===========================================

=== vi_editor_intro ===
~ vi_editor_discussed = true
~ instructor_rapport += 5
# influence_increased

Ah, vi. The editor that's been causing both frustration and devotion since 1976.

Here's why you need to know vi: it's on *every* Unix and Linux system. When you SSH into a compromised server with minimal tools, vi will be there. Other editors might not be.

Vi is modal. Two main modes: normal mode for commands, insert mode for typing text.

The essentials:
- "vi filename" opens or creates a file
- Press "i" to enter insert mode (now you can type)
- Press Esc to return to normal mode
- In normal mode: ":wq" writes and quits, ":q!" quits without saving

That's literally everything you need to survive vi.

* [Tell me more about normal mode commands]
    ~ deep_dives_completed += 1
    You: What else can I do in normal mode?
    -> vi_advanced_commands
* [Why not use nano or another editor?]
    You: Why not just use nano? It seems simpler.
    Nano is fine for quick edits. But vi is universal and powerful. On hardened systems or embedded devices, vi might be your only option. Plus, once you learn it, vi is dramatically faster. Your call, but I recommend at least learning vi basics.
    ~ instructor_rapport += 5
    # influence_increased
    -> vi_editor_followup
* [I'll learn the basics]
    ~ completed_vi_challenge = true
    You: Got it. I'll practice the essential commands.
    -> vi_editor_followup

=== vi_advanced_commands ===
~ instructor_rapport += 8
# influence_increased

Want to unlock vi's power? Here are some favorites:

Navigation in normal mode:
- "h" "j" "k" "l" move cursor left, down, up, right
- "w" jumps forward by word, "b" jumps back
- "gg" jumps to start of file, "G" jumps to end

Editing in normal mode:
- "dd" deletes current line
- "30dd" deletes 30 lines
- "yy" copies (yanks) current line
- "p" pastes
- "u" undo
- "/" searches, "n" finds next match

You can combine commands: "d10j" deletes 10 lines down. "c3w" changes next 3 words.

Ten minutes with a vi tutorial will make you look like a wizard. It's worth it.

~ instructor_rapport += 10
# influence_increased
-> vi_editor_followup

=== vi_editor_followup ===
+ [Back to main menu]
    -> linux_training_hub

// ===========================================
// PIPING
// ===========================================

=== piping_intro ===
~ piping_discussed = true
~ instructor_rapport += 5
# influence_increased

Piping is where Linux becomes genuinely powerful. You can chain simple commands together to accomplish complex tasks.

The pipe operator sends the output of one command to the input of another.

Example command: cat /etc/passwd, then pipe to grep /home/

This reads the passwd file and filters it to only lines containing "/home/". Two simple commands, combined to do something useful.

You can chain multiple pipes: cat /etc/passwd, pipe to grep /home/, then pipe to sort -r. Now it's filtered *and* sorted in reverse.

* [Show me more examples]
    ~ piping_examples_discussed = true
    You: What are some practical piping examples?
    -> piping_examples
* [What commands work well with pipes?]
    You: Which commands are commonly piped together?
    -> piping_common_commands
* [I've got the concept]
    ~ completed_piping_challenge = true
    -> linux_training_hub

=== piping_examples ===
~ instructor_rapport += 8
# influence_increased

Here are real-world examples you'll use constantly:

Finding running processes: Command: ps aux, pipe to grep ssh. This lists all processes and filters for SSH-related ones.

Analyzing logs: Command: cat logfile, pipe to grep ERROR, pipe to sort, pipe to uniq -c, pipe to sort -nr. This finds errors, sorts them, counts unique occurrences, sorts by frequency. One line, powerful analysis.

Network analysis: Command: netstat -an, pipe to grep ESTABLISHED. This shows active network connections.

Counting things: Command: ls, pipe to wc -l. This counts files in current directory.

The Unix philosophy: small tools that do one thing well, combined creatively. Piping is how you combine them.

~ completed_piping_challenge = true
~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

=== piping_common_commands ===
~ instructor_rapport += 8
# influence_increased

Commands that work brilliantly in pipes:

grep - filters lines matching a pattern. Your most-used pipe command.

sort - sorts lines alphabetically. "-n" for numeric sort, "-r" for reverse.

uniq - removes duplicate adjacent lines. Usually used after sort. "-c" counts occurrences.

head and tail - show first or last N lines. "head -20" shows first 20 lines.

wc - word count. "-l" counts lines, "-w" counts words, "-c" counts characters.

cut - extracts columns from text. "cut -d: -f1" splits on colons, takes first field.

awk and sed - powerful text processing. More advanced, but incredibly useful.

Learn these, and you can process massive datasets from the command line.

~ completed_piping_challenge = true
~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

// ===========================================
// REDIRECTION
// ===========================================

=== redirection_intro ===
~ redirection_discussed = true
~ instructor_rapport += 5
# influence_increased

Redirection lets you send command output to files or read input from files.

Three key operators:

greater than > - redirects output to a file, overwriting it. "ls > filelist.txt" saves directory listing to a file.

append >> - redirects output to a file, appending. "echo 'new line' >> file.txt" adds to the end.

less than < - reads input from a file. "wc -l < file.txt" counts lines in the file.

Practical example: "ps aux > processes.txt" saves a snapshot of running processes for analysis.

* [Show me more redirection examples]
    ~ redirection_examples_discussed = true
    You: What are some practical redirection scenarios?
    -> redirection_examples
* [What about error messages?]
    You: Can I redirect error messages too?
    -> stderr_redirection
* [Understood]
    -> linux_training_hub

=== redirection_examples ===
~ instructor_rapport += 8
# influence_increased

Practical redirection scenarios:

Saving command output for later:
"ifconfig > network_config.txt" - captures network configuration.

Building logs:
"echo '$(date): Scan completed' >> scan_log.txt" - appends timestamped entries.

Combining with pipes:
Command: cat /etc/passwd, pipe to grep /home/, redirect to users.txt. This filters and saves results.

Quick file creation:
"echo 'test content' > test.txt" - creates a file with content in one command.

During security assessments, you'll constantly redirect command output to files for documentation and later analysis.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

=== stderr_redirection ===
~ instructor_rapport += 10
# influence_increased

Good catch. There are actually two output streams: stdout (standard output) and stderr (standard error).

By default, ">" only redirects stdout. Error messages still appear on screen.

To redirect stderr: "command 2> errors.txt"

To redirect both: "command > output.txt 2>&1" - sends stderr to stdout, which goes to the file.

Or in modern Bash: "command &> output.txt" does the same thing more simply.

To discard output entirely: "command > /dev/null 2>&1" - sends everything to the void.

This is advanced stuff, but incredibly useful when scripting or when you want clean output.

~ instructor_rapport += 10
# influence_increased
-> linux_training_hub

// ===========================================
// NETWORKING BASICS
// ===========================================

=== networking_basics ===
~ networking_discussed = true
~ instructor_rapport += 5
# influence_increased

Linux networking commands. Essential for understanding network configurations and troubleshooting connectivity.

ifconfig - the classic command to view network interfaces and IP addresses. Shows all your network adapters.

ip - the modern replacement. "ip a s" (ip address show) does the same thing. You'll see both used in the field.

hostname -I - quick way to display just your IP address.

In our environment, your IP typically starts with "172.22" or "10" - those are private network ranges.

* [Tell me more about network interfaces]
    ~ ifconfig_discussed = true
    You: What are network interfaces exactly?
    -> network_interfaces
* [How do I troubleshoot network issues?]
    You: What if my network isn't working?
    -> network_troubleshooting
* [What about finding other machines?]
    You: How do I discover other systems on the network?
    Good question, but that's scanning territory. We'll cover tools like nmap in the scanning module. For now, focus on understanding your own network configuration.
    ~ instructor_rapport += 5
    # influence_increased
    -> linux_training_hub
* [Got it]
    -> linux_training_hub

=== network_interfaces ===
~ instructor_rapport += 8
# influence_increased

Network interfaces are how your computer connects to networks. Think of them as connection points.

eth0, eth1 - Ethernet interfaces. Physical network ports.

wlan0 - Wireless interface. WiFi adapter.

lo - Loopback interface, always 127.0.0.1. Your computer talking to itself. Useful for testing.

Virtual interfaces - VPNs and containers create virtual interfaces like tun0, tap0, docker0.

When you run ifconfig, you see all interfaces, their IP addresses, MAC addresses, and traffic statistics. Essential information for network security assessments.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

=== network_troubleshooting ===
~ instructor_rapport += 8
# influence_increased

Basic network troubleshooting steps:

Step 1: Check interface status with "ifconfig" or "ip a s". Is the interface up? Does it have an IP?

Step 2: If no IP, try "dhclient eth0" to request one from DHCP server.

Step 3: Test local connectivity: "ping 127.0.0.1" tests your network stack.

Step 4: Test gateway: "ping your_gateway_ip" tests local network.

Step 5: Test DNS: "ping google.com" tests name resolution and external connectivity.

In our lab environment, if you're having issues, usually dhclient fixes it. In the field, troubleshooting can be much more complex.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

// ===========================================
// KALI LINUX
// ===========================================

=== kali_intro ===
~ kali_intro_discussed = true
~ instructor_rapport += 5
# influence_increased

Kali Linux. Your primary offensive security platform.

Released by Offensive Security in 2013 as the successor to BackTrack Linux. It's specifically designed for penetration testing, security auditing, and digital forensics.

Kali includes hundreds of pre-installed tools organized by category: information gathering, vulnerability analysis, wireless attacks, web applications, exploitation tools, password attacks, forensics, and more.

Default credentials: username "kali", password "kali". Never use Kali as your primary OS—it's designed for security testing, not everyday computing.

* [Show me what tools are available]
    You: What kinds of tools are we talking about?
    -> kali_tools_overview
* [How is Kali organized?]
    You: How do I find the right tool for a task?
    -> kali_organization
* [Sounds powerful]
    -> linux_training_hub

=== kali_tools_overview ===
~ instructor_rapport += 8
# influence_increased

Let me give you a taste of what's available:

Information Gathering: nmap, dnsenum, whois, recon-ng. Tools for mapping networks and gathering intelligence.

Vulnerability Analysis: Nessus, OpenVAS, nikto. Automated scanners that identify security weaknesses.

Exploitation: Metasploit Framework, BeEF, sqlmap. Tools for actively exploiting vulnerabilities.

Password Attacks: Hydra, John the Ripper, hashcat. Cracking and bruteforcing credentials.

Wireless Attacks: Aircrack-ng, Reaver, Wifite. WiFi security testing.

Forensics: Autopsy, Sleuth Kit, Volatility. Analyzing systems and recovering data.

And those are just highlights. Run "ls /usr/bin" to see hundreds more. It's an arsenal.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

=== kali_organization ===
~ instructor_rapport += 8
# influence_increased

Kali organizes tools by the penetration testing lifecycle:

Phase 1 - Information Gathering: Passive and active reconnaissance. Learning about your target.

Phase 2 - Vulnerability Analysis: Identifying weaknesses in systems and applications.

Phase 3 - Exploitation: Actually compromising systems using identified vulnerabilities.

Phase 4 - Post-Exploitation: What you do after gaining access. Maintaining access, pivoting, data exfiltration.

The Applications menu mirrors this structure. When you need a tool, think about which phase you're in, and browse that category.

You'll also quickly learn the handful of tools you use constantly. Nmap, Metasploit, Burp Suite, Wireshark—these become second nature.

~ instructor_rapport += 5
# influence_increased
-> linux_training_hub

// ===========================================
// SSH - SECURE SHELL
// ===========================================

=== ssh_intro ===
~ ssh_discussed = true
~ instructor_rapport += 5
# influence_increased

SSH - Secure Shell. Encrypted remote access to systems. One of your most critical tools.

SSH lets you securely connect to remote Linux systems and execute commands as if you were sitting at that machine. All traffic is encrypted, protecting against eavesdropping.

Basic usage: "ssh username@ip_address"

The server typically listens on port 22. When you connect, you authenticate (usually with password or key), and then you have a remote shell.

SSH replaced older, insecure protocols like Telnet and rlogin, which transmitted passwords in cleartext. Never use those—always use SSH.

* [Tell me about SSH keys]
    You: What about SSH key authentication?
    -> ssh_keys
* [What's X11 forwarding?]
    ~ ssh_x_forwarding_discussed = true
    You: I saw something about -X flag for forwarding?
    -> ssh_x_forwarding
* [How do I verify I'm connecting to the right server?]
    You: How do I know I'm not being man-in-the-middled?
    -> ssh_fingerprints
* [Let's talk about attacking SSH]
    You: How do we test SSH security?
    -> ssh_to_hydra_transition
* [Got the basics]
    ~ completed_ssh_challenge = true
    -> linux_training_hub

=== ssh_keys ===
~ instructor_rapport += 10
# influence_increased

SSH keys are asymmetric cryptography for authentication. Much more secure than passwords.

You generate a key pair: a private key (keep secret) and public key (share freely).

Generate keys: "ssh-keygen -t rsa -b 4096"

Copy public key to server: "ssh-copy-id user@server"

Now you can SSH without typing passwords. The private key proves your identity.

Benefits: stronger than passwords, can't be bruteforced, can be passphrase-protected, can be revoked per-server.

Many organizations require key-based auth and disable password authentication entirely. Learn this workflow.

~ instructor_rapport += 10
# influence_increased
-> ssh_intro

=== ssh_x_forwarding ===
~ instructor_rapport += 8
# influence_increased

X11 forwarding is clever. Linux graphical applications use the X Window System. SSH can tunnel X11 traffic.

Connect with: "ssh -X user@server"

Now you can run graphical programs on the remote server, but see them on your local screen. The program runs remotely, but displays locally.

Example: "kate" opens the text editor, running on the remote system but displaying on yours. Useful for accessing GUI tools remotely.

Warning: some latency over networks. And it does expose some security risks—only use on trusted connections.

~ instructor_rapport += 5
# influence_increased
-> ssh_intro

=== ssh_fingerprints ===
~ instructor_rapport += 10
# influence_increased

Excellent security awareness. SSH uses host key fingerprints to prevent man-in-the-middle attacks.

When you first connect, SSH shows the server's fingerprint. You should verify this matches the real server before accepting.

On the server, check fingerprint: "ssh-keygen -lf /etc/ssh/ssh_host_rsa_key.pub"

If the fingerprint matches what SSH showed you, type "yes". SSH remembers this and will warn if it changes later.

If the fingerprint changes unexpectedly, that's a warning sign. Could be a man-in-the-middle attack, or could be the server was rebuilt. Investigate before proceeding.

Most people skip this check. Don't be most people. Especially in adversarial security contexts.

~ instructor_rapport += 10
# influence_increased
-> ssh_intro

=== ssh_to_hydra_transition ===
Now you're thinking like a penetration tester. Let's talk about attacking SSH.
-> hydra_intro

// ===========================================
// HYDRA - SSH ATTACKS
// ===========================================

=== hydra_intro ===
~ hydra_discussed = true
~ instructor_rapport += 5
# influence_increased

Hydra. THC-Hydra, to be specific. A parallelized login cracker supporting numerous protocols.

Hydra performs online bruteforce attacks—it actually tries to log in with username/password combinations. Different from offline attacks where you crack hashed passwords.

Basic usage: "hydra -l username -p password target ssh"

Tests a single username/password combo. But Hydra's power is testing many combinations from wordlists.

Supports dozens of protocols: SSH, FTP, HTTP, RDP, SMB, databases, and more. If it accepts login credentials, Hydra can probably attack it.

* [How do I use wordlists?]
    ~ bruteforce_basics_discussed = true
    You: How do I test multiple passwords?
    -> hydra_wordlists
* [How fast is Hydra?]
    You: How quickly can it crack passwords?
    -> hydra_speed
* [What are the legal/ethical considerations?]
    You: Is this legal to use?
    -> hydra_ethics
* [I'm ready to try it]
    ~ completed_hydra_challenge = true
    -> linux_training_hub

=== hydra_wordlists ===
~ instructor_rapport += 10
# influence_increased

Wordlists are the fuel for Hydra. Collections of common passwords to test.

Usage: "hydra -l username -P /path/to/wordlist.txt target ssh"

Capital -P for password list, lowercase -l for single username. Or use -L for username list too.

Kali includes wordlists: "ls /usr/share/wordlists/seclists/Passwords/"

Choosing the right wordlist is critical. A wordlist with 10 million passwords might take days for online attacks. Start with smaller, curated lists of common passwords.

For SSH specifically, "Common-Credentials" lists work well. They contain default passwords and common weak passwords.

Real-world advice: online attacks are slow and noisy. They generate logs. They trigger intrusion detection. Use them strategically, not as your first approach.

~ completed_hydra_challenge = true
~ instructor_rapport += 10
# influence_increased
-> linux_training_hub

=== hydra_speed ===
~ instructor_rapport += 8
# influence_increased

Speed depends on many factors: network latency, server response time, number of parallel connections.

Hydra's "-t" flag controls parallel tasks. "hydra -t 4" uses 4 parallel connections.

More isn't always better. Too many parallel connections can crash services or trigger rate limiting. For SSH, 4-16 threads is usually reasonable.

Realistic expectations: online SSH bruteforce might test 10-50 passwords per second. Against a wordlist with 10,000 passwords, that's several minutes at best.

Compare to offline cracking (like hashcat on GPUs), which can test billions of passwords per second. Online attacks are fundamentally slower.

Strategic implication: online attacks work best when you have good intelligence. If you know username is "admin" and password is probably from a short list of defaults, Hydra excels. Blind bruteforce against random accounts? Impractical.

~ instructor_rapport += 8
# influence_increased
-> linux_training_hub

=== hydra_ethics ===
~ instructor_rapport += 10
# influence_increased

Critical question. Shows good judgment.

Legal status: Hydra itself is legal to possess and use in authorized security testing. Unauthorized use against systems you don't own or have explicit permission to test? That's computer fraud. Felony-level crime in most jurisdictions.

In this training: You're attacking lab systems we control, with explicit permission. This is legal and ethical training.

In SAFETYNET operations: Your target is cleared by Command before you go. There's no statute behind that clearance -- the cover is what you have, and it is the whole of what you have.

In the real world: Never, ever use these tools against systems without written authorization. Penetration testers get contracts. Bug bounty hunters follow program rules. Hobbyists practice in their own isolated labs.

The skills you're learning are powerful. Use them responsibly. With authorization. Within the law. That's not optional—it's core to professional security work.

~ instructor_rapport += 15
# influence_increased
-> linux_training_hub

// ===========================================
// COMMANDS REFERENCE
// ===========================================

=== commands_reference ===
~ instructor_rapport += 5
# influence_increased

Here's your essential commands quick reference:

Navigation:
- pwd (print working directory)
- ls, ls -la (list files, detailed)
- cd directory (change directory)
- cd .. (up one level), cd (home)

File Operations:
- mkdir (make directory)
- cp source dest (copy), cp -r (recursive)
- mv old new (move/rename)
- cat filename (display file)
- less filename (scrollable view)
- echo "text" (print text)

Getting Help:
- man command (manual page)
- info command (info page)
- command --help (quick help)

Text Processing:
- grep pattern (filter lines)
- sort (sort lines)
- uniq (remove duplicates)
- head, tail (first/last lines)
- wc -l (count lines)

Networking:
- ifconfig, ip a s (show interfaces)
- hostname -I (show IP)
- ssh user@host (remote shell)
- ssh -X user@host (X11 forwarding)

Security Tools:
- hydra -l user -p pass target ssh (test SSH login)
- hydra -l user -P wordlist target ssh (bruteforce SSH)

+ [Back to main menu]
    -> linux_training_hub

// ===========================================
// CHALLENGE TIPS
// ===========================================

=== challenge_tips ===
~ instructor_rapport += 5
# influence_increased

Practical tips for the hands-on challenges:

For SSH practice, verify fingerprints before accepting, try both regular SSH and the -X flag for X forwarding, use "exit" or Ctrl-D to disconnect, and check the "who" command to see who else is connected.

For Hydra attacks, start with small, targeted wordlists from /usr/share/wordlists/seclists/Passwords/Common-Credentials/. Use -t 4 for reasonable parallel connections. Be patient—online attacks are slow. Watch for successful login messages and remember to actually SSH in once you crack credentials.

For finding flags, navigate to user home directories, use "cat" to read files, remember "sudo" lets you act as root if you have permission, and check file permissions with "ls -la".

General advice: use Tab completion to save typing, use the up arrow to recall previous commands, check man pages if stuck, and take notes on what works.

+ [Back to main menu]
    -> linux_training_hub

// ===========================================
// READY FOR PRACTICE
// ===========================================

=== ready_for_practice ===
~ instructor_rapport += 5
# influence_increased

Excellent. You've covered the fundamentals.

{command_line_skills_discussed and piping_discussed and redirection_discussed and ssh_discussed and hydra_discussed:
    You've reviewed all the core material. You should be well-prepared for the practical exercises.
- else:
    You might want to review the topics you haven't covered yet, but you've got enough to start.
}

Remember: the best way to learn Linux is by doing. Read the challenges, try commands, make mistakes, figure out fixes. That's how you build real competence.

Practical objectives:
1. Practice basic command-line navigation and file manipulation
2. Edit files with vi
3. Use piping and redirection
4. SSH between systems
5. Use Hydra to crack weak SSH credentials
6. Capture flags from compromised accounts

The lab environment is yours to experiment in. Break things. It's a safe space for learning.

{instructor_rapport >= 50:
    You've asked great questions and engaged deeply with the material. That's exactly the right approach. You're going to do well.
}

Good luck, Agent. You've got this.

-> end_session

// ===========================================
// END SESSION
// ===========================================

=== end_session ===

{instructor_rapport >= 40:
    You've demonstrated solid understanding and good security awareness. See you in the field, Agent.
- else:
    See you in the field, Agent.
}

#exit_conversation
-> linux_training_hub

// ===========================================
// FLAGS COMPLETED - CONGRATULATIONS
// ===========================================

=== flags_completed_congrats ===
~ instructor_rapport += 10
# influence_increased

Excellent work, {player_name}! You've successfully completed all the VM lab exercises and captured all the flags. That demonstrates real competence with Linux security fundamentals.

You've shown you can navigate Linux systems effectively, use SSH for remote access, perform security testing with tools like Hydra, and escalate privileges when needed. These are essential skills for field operations.

I have an optional challenge for you, if you're interested. There's a lockpicking practice room. It's completely optional, but it's a useful field skill to learn.

{has_key:
    Here's the key to the lockpicking practice room. The locksmith inside can teach you the basics.
    ~ lockpicking_key_received = true
    #give_item:key
    #unlock_aim:learn_lockpicking
    #unlock_task:talk_to_locksmith
    Good luck! It's a valuable skill to have.
- else:
    I see you already have the key. Feel free to explore the lockpicking practice room if you're interested.
    {not lockpicking_key_received:
        ~ lockpicking_key_received = true
        #unlock_aim:learn_lockpicking
        #unlock_task:talk_to_locksmith
    }
}

-> flags_completed_followup

=== flags_completed_followup ===
+ [Tell me more about lockpicking]
    Lockpicking is a physical security skill. In the field, you'll encounter locked doors, safes, and containers. Being able to pick locks gives you access without keys or forced entry.
    
    The locksmith in the practice room can teach you the fundamentals: applying tension with a wrench, and picking pins in binding order. It takes practice, but it's a skill worth learning.
    -> flags_completed_followup
+ [Back to main menu]
    -> linux_training_hub
+ [That's all I need]
    -> end_session
