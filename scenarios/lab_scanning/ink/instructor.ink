// ===========================================
// INFORMATION GATHERING: SCANNING LAB
// Information Gathering and Network Scanning
// ===========================================
// Game-Based Learning replacement for lab sheet
// Original: introducing_attacks/5_scanning.md
// Based on HacktivityLabSheets: introducing_attacks/5_scanning.md
// Author: Z. Cliffe Schreuders, Anatoliy Gorbenko, Thalita Vergilio
// License: CC BY-SA 4.0
// ===========================================

// Global persistent state
VAR instructor_rapport = 0
VAR scanning_ethics = 0

// Global variables (synced from scenario.json.erb)
VAR player_name = "Agent 0x00"

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
~ instructor_rapport = 0
~ scanning_ethics = 0

Welcome back, {player_name}. What would you like to discuss?

-> scanning_hub

// ===========================================
// TIMED INTRO CONVERSATION (Game Start)
// ===========================================

=== intro_timed ===
~ instructor_rapport = 0
~ scanning_ethics = 0

"Give me six hours to chop down a tree and I will spend the first four sharpening the axe." -- Abraham Lincoln

Welcome to Information Gathering and Network Scanning, {player_name}. I'm your reconnaissance specialist instructor for this session.

Scanning is a critical stage for both attackers and security testers. It gives you all the information you need to plan an attack - IP addresses, open ports, service versions, and operating systems. Once you know what software is running and what version it is, you can look up and use known attacks against the target.

This knowledge is powerful. Use it only for authorized security testing, penetration testing engagements, and defensive purposes.

~ scanning_ethics += 10
#influence_increased

Let me explain how this lab works. You'll find three key resources here:

First, there's a Lab Sheet Workstation in this room. This gives you access to detailed written instructions and exercises that complement our conversation. Use it to follow along with the material.

Second, in the VM lab room to the north, you'll find terminals to launch virtual machines. You'll work with both a Kali Linux attacker machine and a vulnerable Linux server for hands-on scanning practice.

Finally, there's a Flag Submission Terminal where you'll submit flags you capture during the exercises. These flags demonstrate that you've successfully completed the challenges.

You can talk to me anytime to explore scanning concepts, get tips, or ask questions about the material. I'm here to help guide your learning.

Ready to get started? Feel free to ask me about any topic, or head to the lab sheet workstation and VM room when you're ready to begin the practical exercises.

-> scanning_hub

// ===========================================
// MAIN SCANNING HUB
// ===========================================

=== scanning_hub ===

What aspect of scanning and information gathering would you like to explore?

+ [Why is scanning so important?]
    -> scanning_importance
+ [Ping sweeps for finding live hosts]
    -> ping_sweeps
+ [Creating a ping sweep bash script]
    -> ping_sweep_script
+ [Introduction to Nmap]
    -> nmap_intro
+ [Ports and port scanning basics]
    -> ports_intro
+ [TCP three-way handshake]
    -> tcp_handshake
+ [Creating a port scanner bash script]
    -> port_scanner_script
+ [Nmap port scanning techniques]
    -> nmap_port_scanning
+ [Service identification and banner grabbing]
    -> service_identification
+ [Protocol analysis and fingerprinting]
    -> protocol_analysis
+ [Operating system detection]
    -> os_detection
+ [Nmap timing and performance options]
    -> nmap_timing
+ [Nmap output and GUIs]
    -> nmap_output
+ [Show me the commands reference]
    -> commands_reference
+ [Practical challenge tips]
    -> challenge_tips
+ [I'm ready for the lab exercises]
    -> ready_for_practice
+ [That's all for now]
    #exit_conversation
    -> scanning_hub

=== scanning_importance ===
Scanning is often the most important phase of an attack or security assessment.

~ instructor_rapport += 5
#influence_increased

After establishing a list of live hosts, you examine the attack surface - what there is that could be attacked on each system.

Any way that a remote computer accepts communication has the potential to be attacked.

For security testers and network administrators, scanning helps map out a network, understand what's running where, and identify potential security problems before attackers find them.

+ [What information does scanning reveal?]
    Scanning typically reveals IP addresses of live hosts, open ports on those hosts, what services are running on each port, the versions of those services, and often the operating system.

    With this information, you can look up known vulnerabilities for those specific software versions and plan your attack or remediation accordingly.

    A well-executed scanning stage is extremely important when looking for potential security problems.

    ~ instructor_rapport += 5
    #influence_increased

+ [Is scanning legal?]
    Excellent question. Scanning networks and systems without authorization is typically illegal in most jurisdictions.

    You need explicit written permission to scan systems you don't own. This includes networks at your school, workplace, or anywhere else unless you have authorization.

    In penetration testing engagements, you'll have a statement of work or rules of engagement that defines what you're allowed to scan.

    In this lab environment, you have permission to scan the provided VMs. Never scan external networks without authorization.

    ~ scanning_ethics += 10
    #influence_increased

+ [What's the difference between passive and active reconnaissance?]
    Great question! Passive reconnaissance involves gathering information without directly interacting with the target - like looking up DNS records or searching public websites.

    Active reconnaissance, which includes scanning, directly interacts with the target systems and can be detected.

    Scanning sends packets to the target, which can trigger intrusion detection systems and will show up in logs.

    This is why timing and stealth can be important, though in authorized testing you may not need to be stealthy.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== ping_sweeps ===
Ping sweeps are used to identify live hosts on a network. They're often the first step in network reconnaissance.

~ instructor_rapport += 5
#influence_increased

The ping command works by sending an ICMP echo request to a target. Most hosts will reply with an ICMP echo response.

However, Windows PC firewalls typically block incoming ping requests by default, so ping isn't always reliable.

+ [How do I use the ping command?]
    The basic use is: ping DESTINATION

    Where DESTINATION is an IP address or hostname.

    By default, ping keeps sending requests until you press Ctrl-C. You can limit the count with the -c flag.

    For example: ping -c 3 10.0.0.1

    This sends exactly 3 echo requests.

    The -W flag sets the timeout in seconds: ping -c 1 -W 1 10.0.0.1

    ~ instructor_rapport += 5
    #influence_increased

+ [How can I ping a whole network range?]
    You could manually ping each IP address in the range, but that's tedious and inefficient.

    A better approach is to write a bash script that loops through all IPs in the range.

    Or, even better, use Nmap which can do this far more efficiently.

    Nmap doesn't wait for each response before sending the next request, making it much faster.

    ~ instructor_rapport += 5
    #influence_increased

+ [Tell me about creating a ping sweep script]
    -> ping_sweep_script

- -> scanning_hub

=== ping_sweep_script ===
Creating your own tools helps you understand how they work. Let's build a ping sweep bash script.

~ instructor_rapport += 5
#influence_increased

Here's a basic structure:

#!/bin/bash

if [ $# -ne 1 ]; then

  echo "Usage: basename $0 (three octets of IP, for example 192.168.0)"

  exit 1

fi

ip_address_start=$1

for i in (1 to 254); do

  ping -c 1 -W 1 $ip_address_start.$i then pipe to grep 'from'

done

+ [How does this script work?]
    Let me break it down. First, we check if the user provided exactly one argument (the first three octets of an IP address).

    If not, we print usage instructions and exit with an error code.

    Then we store the argument in a variable called ip_address_start.

    The for loop iterates from 1 to 254 (all valid host addresses in a /24 subnet).

    For each iteration, we ping that IP with one request and a 1-second timeout, then pipe to grep to only show successful responses.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I make the script executable?]
    After saving the script, you need to set the executable permission:

    chmod +x pingsweep.sh

    The chmod command changes file modes or permissions. The +x flag adds execute permission.

    You can verify with: ls -la

    You'll see an 'x' in the permissions, indicating the file can be executed.

    ~ instructor_rapport += 5
    #influence_increased

+ [How long will this take to run?]
    Good thinking! With the -W 1 timeout, each ping waits up to 1 second for a response.

    Since we're checking 254 addresses sequentially, in the worst case (no hosts respond), it could take up to 254 seconds - over 4 minutes!

    This is why professional tools like Nmap are so much faster - they send requests in parallel and use more sophisticated timing.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== nmap_intro ===
Nmap - Network Mapper - is without a doubt the most popular scanning tool in existence.

~ instructor_rapport += 5
#influence_increased

Nmap is an open source tool for network exploration and security auditing. It was designed to rapidly scan large networks, although it works fine against single hosts.

It uses raw IP packets in novel ways to determine what hosts are available, what services they're offering, what operating systems they're running, what type of packet filters are in use, and much more.

+ [What makes Nmap so powerful?]
    Nmap supports dozens of different scanning techniques, from simple ping sweeps to complex protocol analysis.

    It can identify services, detect versions, fingerprint operating systems, evade firewalls, and output results in various formats.

    It's actively maintained, has extensive documentation, and is scriptable with the Nmap Scripting Engine (NSE).

    Most importantly, it's extremely fast and efficient compared to manual or simple scripted approaches.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I use Nmap for ping sweeps?]
    For a basic ping sweep: nmap -sn -PE 10.0.0.1-254

    The -sn flag tells Nmap to skip port scanning (just do host discovery).

    The -PE flag specifies ICMP echo requests.

    Nmap's default host discovery with -sn is actually more comprehensive than just ping - it sends ICMP echo requests, TCP SYN to port 443, TCP ACK to port 80, and ICMP timestamp requests.

    This gives you a better chance of detecting hosts even if they block regular pings.

    ~ instructor_rapport += 5
    #influence_increased

+ [Can Nmap resolve hostnames?]
    Yes! Nmap performs DNS resolution by default.

    You can do a list scan with: nmap -sL 10.0.0.1-254

    This lists all hosts with their hostnames without actually scanning them.

    The hostnames can be very informative - names like "web-server-01" or "database-prod" tell you a lot about what a system does.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== ports_intro ===
Understanding ports is fundamental to network scanning and security.

~ instructor_rapport += 5
#influence_increased

All TCP and UDP traffic uses port numbers to establish which applications are communicating.

For example, web servers typically listen on port 80 for HTTP or port 443 for HTTPS. Email servers use ports 25 (SMTP), 110 (POP3), or 143 (IMAP).

There are 65,535 possible TCP ports and 65,535 possible UDP ports on each system.

+ [Why do standard services use specific ports?]
    Standard port numbers make networking practical. When you type a URL in your browser, it knows to connect to port 80 or 443 without you specifying it.

    The Internet Assigned Numbers Authority (IANA) maintains the official registry of port number assignments.

    On Linux systems, you can see common port assignments in /etc/services

    Ports 1-1023 are well-known ports typically requiring admin privileges to bind to. Ports 1024-49151 are registered ports. Ports 49152-65535 are dynamic/private ports.

    ~ instructor_rapport += 5
    #influence_increased

+ [How can I manually check if a port is open?]
    You can use telnet or netcat to connect manually:

    telnet IP_ADDRESS 80

    If you see "Connected to..." the port is open. If it says "Connection refused" or times out, the port is closed or filtered.

    Netcat is similar: nc IP_ADDRESS 80

    This manual approach helps you understand what's happening, but it's not practical for scanning many ports.

    ~ instructor_rapport += 5
    #influence_increased

+ [What's the difference between open, closed, and filtered ports?]
    An open port has an application actively listening and accepting connections.

    A closed port has no application listening, but the system responded to your probe (usually with a RST packet).

    A filtered port means a firewall or filter is blocking the probe, so you can't determine if it's open or closed.

    You might also see states like "open or filtered" when Nmap can't definitively determine the state.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== tcp_handshake ===
Understanding the TCP three-way handshake is crucial for understanding port scanning techniques.

~ instructor_rapport += 5
#influence_increased

To establish a TCP connection and start sending data, a three-way handshake occurs:

Step 1: The client sends a TCP packet with the SYN flag set, indicating it wants to start a new connection to a specific port.

Step 2: If a server is listening on that port, it responds with SYN-ACK flags set, accepting the connection.

Step 3: The client completes the connection by sending a packet with the ACK flag set.

+ [What happens if the port is closed?]
    If the port is closed, the server will send a RST (reset) packet at step 2 instead of SYN-ACK.

    This immediately tells the client the port is closed.

    If there's a firewall filtering that port, you might not receive any reply at all - the packets are simply dropped.

    ~ instructor_rapport += 5
    #influence_increased

+ [Why is this relevant to scanning?]
    Here's the key insight: if all we want to know is whether a port is open, we can skip step 3!

    The SYN-ACK response at step 2 already tells us the port is open.

    This is the basis for SYN scanning - send SYN, wait for SYN-ACK, then don't complete the handshake.

    It's faster and stealthier than completing the full connection, though modern IDS systems will still detect it.

    ~ instructor_rapport += 5
    #influence_increased

+ [What's a full connect scan then?]
    A full connect scan completes the entire three-way handshake for each port.

    It's less efficient because you're establishing complete connections, but it doesn't require special privileges.

    SYN scans need to write raw packets, which requires root privileges on Linux. Connect scans use standard library functions available to any user.

    In Nmap, -sT does a connect scan, while -sS does a SYN scan.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== port_scanner_script ===
Let's build a simple port scanner in bash to understand how port scanning works.

~ instructor_rapport += 5
#influence_increased

Modern bash can connect to TCP ports using special file descriptors like /dev/tcp/HOST/PORT

Here's a basic port scanner structure:

#!/bin/bash

if [ $# -ne 1 ]; then

  echo "Usage: basename $0 (IP address or hostname)"

  exit 1

fi

ip_address=$1

echo `date` >> $ip_address.open_ports

for port in (1 to 65535); do

  timeout 1 echo > /dev/tcp/$ip_address/$port

  if [ $? -eq 0 ]; then

    echo "port $port is open" >> "$ip_address.open_ports"

  fi

done

+ [How does this work?]
    The script takes one argument - the IP address to scan.

    It loops through all 65,535 possible ports (this will take a very long time!).

    For each port, it tries to connect using echo > /dev/tcp/$ip_address/$port

    The timeout command ensures each attempt only waits 1 second.

    The special variable $? contains the exit status of the last command - 0 for success, non-zero for failure.

    If the connection succeeded ($? equals 0), we write that port number to the output file.

    ~ instructor_rapport += 5
    #influence_increased

+ [Why would I write this when Nmap exists?]
    Great question! Writing your own tools teaches you how they work under the hood.

    It helps you understand what's actually happening when you run Nmap.

    In some restricted environments, you might not have Nmap available but can write bash scripts.

    Plus, it's a good programming exercise! You could extend it to do banner grabbing, run it in parallel, or output in different formats.

    ~ instructor_rapport += 5
    #influence_increased

+ [How long will scanning all 65535 ports take?]
    With a 1-second timeout per port, in the worst case it could take over 18 hours!

    This is why professional scanners like Nmap are so much more sophisticated - they use parallel connections, adaptive timing, and send raw packets.

    Your simple bash script is doing full TCP connect scans sequentially. Nmap can send hundreds of packets simultaneously.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== nmap_port_scanning ===
Nmap supports dozens of different port scanning techniques. Let me cover the most important ones.

~ instructor_rapport += 5
#influence_increased

SYN Scan (-sS): The default and most popular scan. Sends SYN packets and looks for SYN-ACK responses. Fast and stealthy. Requires root.

Connect Scan (-sT): Completes the full TCP handshake. Slower but doesn't require root privileges.

UDP Scan (-sU): Scans UDP ports. Slower and less reliable because UDP is connectionless.

NULL, FIN, and Xmas Scans (-sN, -sF, -sX): Send packets with unusual flag combinations to evade some firewalls. Don't work against Windows.

+ [Tell me more about SYN scans]
    SYN scans are the default Nmap scan type for good reason.

    They're fast because they don't complete the connection. They're relatively stealthy compared to connect scans.

    However, modern intrusion detection systems will absolutely detect SYN scans - the "stealth" is relative.

    Run a SYN scan with: sudo nmap -sS TARGET

    You need sudo because sending raw SYN packets requires root privileges.

    ~ instructor_rapport += 5
    #influence_increased

+ [Why are UDP scans unreliable?]
    UDP is connectionless - there's no handshake like TCP. You send a packet and hope for a response.

    If a UDP port is open, the service might not respond at all. If it's closed, you might get an ICMP "port unreachable" message.

    The lack of response is ambiguous - is the port open and ignoring you, or is it filtered by a firewall?

    UDP scans are also slow because Nmap has to wait for timeouts: sudo nmap -sU TARGET

    Despite these challenges, UDP scanning is important because many services run on UDP like DNS (port 53) and SNMP (port 161).

    ~ instructor_rapport += 5
    #influence_increased

+ [What are NULL, FIN, and Xmas scans?]
    These send TCP packets with unusual flag combinations to try to evade simple firewalls.

    NULL scan (-sN) sends packets with no flags set. FIN scan (-sF) sends packets with only the FIN flag. Xmas scan (-sX) sends FIN, PSH, and URG flags.

    According to RFC 793, a closed port should respond with RST to these probes, while open ports should not respond.

    However, Windows systems don't follow the RFC correctly, so these scans don't work against Windows targets.

    They're less useful today since modern firewalls and IDS systems detect them easily.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I specify which ports to scan?]
    Nmap has flexible port specification options.

    By default, Nmap scans the 1000 most common ports. You can scan specific ports with -p:

    nmap -p 80,443,8080 TARGET (specific ports)

    nmap -p 1-1000 TARGET (port range)

    nmap -p- TARGET (all 65535 ports)

    nmap -F TARGET (fast scan - only 100 most common ports)

    You can also use -r to scan ports in sequential order instead of random.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== service_identification ===
Knowing which ports are open is useful, but knowing what services are running on those ports is essential for planning attacks or security assessments.

~ instructor_rapport += 5
#influence_increased

The simplest approach is banner grabbing - connecting to a port and checking if the service reveals what software it's running.

Many services present a banner when you connect, often stating the software name and version.

+ [How do I manually grab banners?]
    You can use netcat to connect and see what the service sends:

    nc IP_ADDRESS 21

    Port 21 (FTP) usually sends a banner immediately. Press Ctrl-C to disconnect.

    For port 80 (HTTP), you need to send something first:

    nc IP_ADDRESS 80

    Then type a dot and press Enter a few times. Look for the "Server:" header in the response.

    ~ instructor_rapport += 5
    #influence_increased

+ [How can I automate banner grabbing?]
    Netcat can grab banners across a range of ports:

    nc IP_ADDRESS 1-2000 -w 1

    This connects to ports 1 through 2000 with a 1-second timeout and displays any banners.

    You could also update your bash port scanner script to read from each open port instead of just writing to it.

    ~ instructor_rapport += 5
    #influence_increased

+ [Can I trust banner information?]
    Excellent critical thinking! No, you cannot trust banners completely.

    Server administrators can configure services to report false version information to mislead attackers.

    A web server claiming to be "Apache/2.4.1" might actually be nginx or a completely different version of Apache.

    This is why we use protocol analysis and fingerprinting to verify what's actually running.

    ~ instructor_rapport += 5
    #influence_increased

+ [Tell me about protocol analysis]
    -> protocol_analysis

- -> scanning_hub

=== protocol_analysis ===
Protocol analysis, also called fingerprinting, determines what software is running by analyzing how it responds to various requests.

~ instructor_rapport += 5
#influence_increased

Instead of trusting what the banner says, we send different kinds of requests (triggers) and compare the responses to a database of fingerprints.

The software Amap pioneered this approach with two main features: banner grabbing (-B flag) and protocol analysis (-A flag).

+ [How do I use Amap?]
    Amap is straightforward but somewhat outdated:

    amap -A IP_ADDRESS 80

    This performs protocol analysis on port 80, telling you what protocol is in use and what software is likely running.

    However, Amap has been largely superseded by Nmap's service detection, which is more up-to-date and accurate.

    ~ instructor_rapport += 5
    #influence_increased

+ [How does Nmap's version detection work?]
    Nmap's version detection is one of its most powerful features:

    nmap -sV IP_ADDRESS

    Nmap connects to each open port and sends various triggers, then analyzes the responses against a massive database of service signatures.

    It can often identify not just the service type but the specific version number.

    You can combine it with port specification: nmap -sV -p 80 IP_ADDRESS

    Or scan all default ports with version detection: nmap -sV IP_ADDRESS

    ~ instructor_rapport += 5
    #influence_increased

+ [How accurate is version detection?]
    Nmap's version detection is very accurate when services respond normally.

    It maintains a database called nmap-service-probes with thousands of service signatures.

    However, custom or heavily modified services might not match the database perfectly.

    And determined administrators can still configure services to mislead fingerprinting, though it's more difficult than changing a banner.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== os_detection ===
Operating system detection is another powerful Nmap capability that helps you understand your target.

~ instructor_rapport += 5
#influence_increased

Knowing the OS is important for choosing the right payload when launching exploits, and for understanding what vulnerabilities might be present.

Nmap performs OS detection by analyzing subtle differences in how operating systems implement TCP/IP.

+ [How does OS fingerprinting work?]
    The TCP/IP RFCs (specifications) contain some ambiguity - they're not 100% prescriptive about every implementation detail.

    Each operating system makes slightly different choices in how it handles network packets.

    Nmap sends specially crafted packets to both open and closed ports, then analyzes the responses.

    It compares these responses to a database of OS fingerprints to make an educated guess about what's running.

    ~ instructor_rapport += 5
    #influence_increased

+ [How do I use OS detection?]
    OS detection is simple to invoke:

    sudo nmap -O IP_ADDRESS

    You need sudo because OS detection requires sending raw packets.

    Nmap will report its best guess about the operating system, often with a confidence percentage.

    You can combine OS detection with version detection: sudo nmap -O -sV IP_ADDRESS

    ~ instructor_rapport += 5
    #influence_increased

+ [How accurate is OS detection?]
    OS detection is usually quite accurate, especially for common operating systems.

    However, it can be confused by firewalls, virtualization, or network devices that modify packets.

    Nmap will report a confidence level and sometimes multiple possible matches.

    Like version detection, OS detection can be deceived by administrators who configure their systems to report false information, though this is uncommon.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== nmap_timing ===
Nmap's timing and performance options let you control the speed and stealth of your scans.

~ instructor_rapport += 5
#influence_increased

Nmap offers six timing templates from paranoid to insane:

-T0 (paranoid): Extremely slow, sends one probe every 5 minutes. For IDS evasion.

-T1 (sneaky): Very slow, sends one probe every 15 seconds.

-T2 (polite): Slower, less bandwidth intensive. Won't overwhelm targets.

-T3 (normal): The default. Balanced speed and reliability.

-T4 (aggressive): Faster, assumes a fast and reliable network.

-T5 (insane): Very fast, may miss open ports or overwhelm networks.

+ [When would I use paranoid or sneaky timing?]
    These ultra-slow timing templates are for stealth - attempting to evade intrusion detection systems.

    For example: nmap -T0 IP_ADDRESS

    However, modern IDS systems will still detect these scans, they just take much longer.

    These templates are rarely used in practice because they're so slow. A full scan could take days!

    In authorized penetration tests, you usually don't need this level of stealth.

    ~ instructor_rapport += 5
    #influence_increased

+ [When should I use aggressive or insane timing?]
    Aggressive (-T4) is good when scanning on fast, reliable networks where you want quicker results.

    Insane (-T5) is for very fast networks when you want the absolute fastest scan: nmap -T5 IP_ADDRESS

    However, be careful! Insane timing can miss open ports because it doesn't wait long enough for responses.

    It can also overwhelm slow network links or trigger rate limiting, causing you to miss results.

    Generally, stick with normal or aggressive timing unless you have a specific reason to change.

    ~ instructor_rapport += 5
    #influence_increased

+ [Can I customize timing beyond the templates?]
    Yes! Nmap has many granular timing options like --max-retries, --host-timeout, --scan-delay, and more.

    The templates are just convenient presets. You can read about all the timing options in the man page under "TIMING AND PERFORMANCE."

    For most purposes, the templates are sufficient and easier to remember.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== nmap_output ===
Nmap's output options let you save scan results for later analysis, reporting, or importing into other tools.

~ instructor_rapport += 5
#influence_increased

Nmap supports several output formats:

-oN filename (normal output): Saves output similar to what you see on screen.

-oX filename (XML output): Saves structured XML, great for importing into other tools.

-oG filename (grepable output): Simple columnar format, but deprecated.

-oA basename (all formats): Saves all three formats with the same base filename.

+ [When should I use XML output?]
    XML output is the most versatile format:

    nmap -oX scan_results.xml IP_ADDRESS

    XML can be imported into vulnerability scanners, reporting tools, and custom scripts.

    Many security tools and frameworks can parse Nmap XML directly.

    You can also transform XML with tools like xsltproc to create HTML reports or other formats.

    ~ instructor_rapport += 5
    #influence_increased

+ [What about Nmap GUIs?]
    Nmap has several graphical interfaces, most notably Zenmap (the official GUI).

    GUIs can help beginners construct commands and visualize results.

    They're useful for saving scan profiles and comparing results from multiple scans.

    However, most experts prefer the command line for speed, scriptability, and remote access via SSH.

    Note that Kali Linux recently removed Zenmap because it was based on Python 2, but other alternatives exist.

    ~ instructor_rapport += 5
    #influence_increased

+ [Should I always save output?]
    In professional penetration testing, absolutely! You need records of what you scanned and when.

    Scan results are evidence for your reports and help you track progress.

    They also protect you legally - if something goes wrong, you have proof of what you actually did.

    Get in the habit of using -oA to save all formats: nmap -oA scan_results IP_ADDRESS

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== commands_reference ===
Let me provide a comprehensive commands reference for this lab.

~ instructor_rapport += 5
#influence_increased

Basic Network Information: Show IP addresses with ip a (or ifconfig on older systems), and show just the IPs with hostname -I.

Ping Commands: Basic ping with ping DESTINATION, limited count with ping -c 3 DESTINATION, and with timeout using ping -c 1 -W 1 DESTINATION.

+ [Show me ping sweep script commands]
    Ping Sweep Script: Create script with vi pingsweep.sh, make executable with chmod +x pingsweep.sh, and run script with ./pingsweep.sh 10.0.0 (replace 10.0.0 with your network's first three octets).

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me Nmap host discovery commands]
    Nmap Host Discovery: Ping sweep with echo request using nmap -sn -PE 10.0.0.1-254, default host discovery with sudo nmap -sn 10.0.0.1-254, and list scan (DNS only) with nmap -sL 10.0.0.1-254.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me port checking commands]
    Manual Port Checking: Using telnet with telnet IP_ADDRESS 80, using netcat with nc IP_ADDRESS 80, test TCP connection with bash using echo > /dev/tcp/IP_ADDRESS/PORT, and check last command status with echo $? (0 = success, non-zero = failure).

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me port scanner script commands]
    Port Scanner Script: Create script with vi portscanner.sh, make executable with chmod +x portscanner.sh, run script with ./portscanner.sh IP_ADDRESS, and view results with less IP_ADDRESS.open_ports.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me Nmap scanning commands]
    Nmap Port Scanning: Basic scan with nmap TARGET, SYN scan with sudo nmap -sS TARGET, connect scan with nmap -sT TARGET, UDP scan with sudo nmap -sU TARGET, specific ports with nmap -p 80,443 TARGET, port range with nmap -p 1-1000 TARGET, all ports with nmap -p- TARGET, and fast scan with nmap -F TARGET.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me service detection commands]
    Service Identification: Manual banner grab (FTP) with nc IP_ADDRESS 21, manual banner grab (HTTP) with nc IP_ADDRESS 80 (then type . and press Enter), automated banner grab with nc IP_ADDRESS 1-2000 -w 1, Amap protocol analysis with amap -A IP_ADDRESS PORT, Nmap version detection with nmap -sV IP_ADDRESS, and version detection on specific port with nmap -sV -p 80 IP_ADDRESS.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me OS detection and timing commands]
    OS Detection: OS detection with sudo nmap -O IP_ADDRESS, and OS plus version detection with sudo nmap -O -sV IP_ADDRESS.

    Timing Templates: Paranoid with nmap -T0 TARGET, sneaky with nmap -T1 TARGET, polite with nmap -T2 TARGET, normal (default) with nmap -T3 TARGET, aggressive with nmap -T4 TARGET, and insane with nmap -T5 TARGET.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me output commands]
    Nmap Output: Normal output with nmap -oN filename TARGET, XML output with nmap -oX filename TARGET, grepable output with nmap -oG filename TARGET, all formats with nmap -oA basename TARGET, and view output file with less filename.

    ~ instructor_rapport += 3
    #influence_increased

+ [Show me combined scan examples]
    Combined Scans: Fast aggressive scan with version detection using nmap -T4 -F -sV IP_ADDRESS, comprehensive scan all ports with OS and version detection using sudo nmap -T4 -p- -O -sV -oA comprehensive_scan IP_ADDRESS, and stealth scan specific ports using sudo nmap -T2 -sS -p 80,443,8080 IP_ADDRESS.

    ~ instructor_rapport += 3
    #influence_increased

- -> scanning_hub

=== challenge_tips ===
Let me give you some practical tips for succeeding in the scanning challenges.

~ instructor_rapport += 5
#influence_increased

Finding Live Hosts: Use Nmap's default ping sweep - it's more reliable than just ICMP echo: sudo nmap -sn NETWORK_RANGE

Note all discovered IP addresses. Your Kali VM will be one of them, and your targets will be the others.

The first three octets of all systems in the lab will match.

+ [Tips for port scanning?]
    Start with a default Nmap scan to find the most common open ports quickly: nmap IP_ADDRESS

    Then do a comprehensive scan of all ports to find hidden services: nmap -p- IP_ADDRESS

    Remember, there's often a service on an unusual high port that you'll miss if you only scan common ports!

    Use -T4 to speed things up on the lab network: nmap -T4 -p- IP_ADDRESS

    ~ instructor_rapport += 5
    #influence_increased

+ [Tips for banner grabbing?]
    When banner grabbing with netcat, be patient. Some services send the banner immediately, others wait for you to send something first.

    For HTTP (port 80), type any character and press Enter to trigger a response.

    Look carefully at all the banner information - sometimes flags are encoded in the banners!

    The hint mentions a flag is encoded using a common method - think base64 or similar.

    ~ instructor_rapport += 5
    #influence_increased

+ [What about that familiar vulnerability?]
    The instructions hint at "a familiar vulnerability" that you can exploit.

    Think back to vulnerabilities you've seen in previous labs - Distcc perhaps?

    Make sure you scan ALL ports, not just the common ones, to find it.

    Once you find the vulnerable service, you know what to do from the previous lab!

    ~ instructor_rapport += 5
    #influence_increased

+ [General troubleshooting advice?]
    If you're not finding expected results, double-check your network range. Use hostname -I on Kali to confirm.

    Make sure the victim VMs are actually running - check the Hacktivity dashboard.

    If scans seem to hang, try reducing the timing or checking your network connectivity.

    Remember that -p- (all ports) scans take time. Be patient or use -T4 to speed it up.

    Always use sudo for SYN scans, UDP scans, and OS detection - they require root privileges.

    ~ instructor_rapport += 5
    #influence_increased

- -> scanning_hub

=== ready_for_practice ===
Excellent! You're ready to start the practical scanning exercises.

~ instructor_rapport += 10
#influence_increased
~ scanning_ethics += 10
#influence_increased

Remember: this knowledge is powerful. Network scanning without authorization is illegal in most jurisdictions.

You have permission to scan the lab VMs. Never scan external networks, your school network, or any systems you don't own without explicit written authorization.

In professional penetration testing, you'll have a scope document that clearly defines what you're allowed to scan.

+ [Any final advice?]
    Start simple - find live hosts first, then scan common ports, then expand to all ports.

    Document everything you find. Take notes on IP addresses, open ports, and service versions.

    Read the Nmap man page regularly - it's one of the best sources of information: man nmap

    Don't forget to look for those flags - in banners, on unusual ports, and via exploitation of familiar vulnerabilities!

    Most importantly: be patient and methodical. Scanning is about being thorough, not fast.

    ~ instructor_rapport += 10
    #influence_increased

- -> scanning_hub

