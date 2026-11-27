// Information Gathering: Scanning Lab Sheet
// Based on HacktivityLabSheets: introducing_attacks/5_scanning.md
// Author: Z. Cliffe Schreuders, Anatoliy Gorbenko, Thalita Vergilio
// License: CC BY-SA 4.0

// Global persistent state
VAR instructor_rapport = 0
VAR scanning_ethics = 0

// External variables
EXTERNAL player_name

=== start ===
Reconnaissance Specialist: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe." -- Abraham Lincoln

~ instructor_rapport = 0
~ scanning_ethics = 0

Reconnaissance Specialist: Welcome, Agent {player_name}. I'm your instructor for Information Gathering and Network Scanning.

Reconnaissance Specialist: Scanning is a critical stage for both attackers and security testers. It gives you all the information you need to plan an attack - IP addresses, open ports, service versions, and operating systems.

Reconnaissance Specialist: Once you know what software is running and what version it is, you can look up and use known attacks against the target.

Reconnaissance Specialist: This knowledge is powerful. Use it only for authorized security testing, penetration testing engagements, and defensive purposes.

~ scanning_ethics += 10

-> scanning_hub

=== scanning_hub ===
Reconnaissance Specialist: What aspect of scanning and information gathering would you like to explore?

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
    -> END

=== scanning_importance ===
Reconnaissance Specialist: Scanning is often the most important phase of an attack or security assessment.

~ instructor_rapport += 5

Reconnaissance Specialist: After establishing a list of live hosts, you examine the attack surface - what there is that could be attacked on each system.

Reconnaissance Specialist: Any way that a remote computer accepts communication has the potential to be attacked.

Reconnaissance Specialist: For security testers and network administrators, scanning helps map out a network, understand what's running where, and identify potential security problems before attackers find them.

+ [What information does scanning reveal?]
    Reconnaissance Specialist: Scanning typically reveals IP addresses of live hosts, open ports on those hosts, what services are running on each port, the versions of those services, and often the operating system.

    Reconnaissance Specialist: With this information, you can look up known vulnerabilities for those specific software versions and plan your attack or remediation accordingly.

    Reconnaissance Specialist: A well-executed scanning stage is extremely important when looking for potential security problems.

    ~ instructor_rapport += 5

+ [Is scanning legal?]
    Reconnaissance Specialist: Excellent question. Scanning networks and systems without authorization is typically illegal in most jurisdictions.

    Reconnaissance Specialist: You need explicit written permission to scan systems you don't own. This includes networks at your school, workplace, or anywhere else unless you have authorization.

    Reconnaissance Specialist: In penetration testing engagements, you'll have a statement of work or rules of engagement that defines what you're allowed to scan.

    Reconnaissance Specialist: In this lab environment, you have permission to scan the provided VMs. Never scan external networks without authorization.

    ~ scanning_ethics += 10

+ [What's the difference between passive and active reconnaissance?]
    Reconnaissance Specialist: Great question! Passive reconnaissance involves gathering information without directly interacting with the target - like looking up DNS records or searching public websites.

    Reconnaissance Specialist: Active reconnaissance, which includes scanning, directly interacts with the target systems and can be detected.

    Reconnaissance Specialist: Scanning sends packets to the target, which can trigger intrusion detection systems and will show up in logs.

    Reconnaissance Specialist: This is why timing and stealth can be important, though in authorized testing you may not need to be stealthy.

    ~ instructor_rapport += 5

- -> scanning_hub

=== ping_sweeps ===
Reconnaissance Specialist: Ping sweeps are used to identify live hosts on a network. They're often the first step in network reconnaissance.

~ instructor_rapport += 5

Reconnaissance Specialist: The ping command works by sending an ICMP echo request to a target. Most hosts will reply with an ICMP echo response.

Reconnaissance Specialist: However, Windows PC firewalls typically block incoming ping requests by default, so ping isn't always reliable.

+ [How do I use the ping command?]
    Reconnaissance Specialist: The basic use is: ping DESTINATION

    Reconnaissance Specialist: Where DESTINATION is an IP address or hostname.

    Reconnaissance Specialist: By default, ping keeps sending requests until you press Ctrl-C. You can limit the count with the -c flag.

    Reconnaissance Specialist: For example: ping -c 3 10.0.0.1

    Reconnaissance Specialist: This sends exactly 3 echo requests.

    Reconnaissance Specialist: The -W flag sets the timeout in seconds: ping -c 1 -W 1 10.0.0.1

    ~ instructor_rapport += 5

+ [How can I ping a whole network range?]
    Reconnaissance Specialist: You could manually ping each IP address in the range, but that's tedious and inefficient.

    Reconnaissance Specialist: A better approach is to write a bash script that loops through all IPs in the range.

    Reconnaissance Specialist: Or, even better, use Nmap which can do this far more efficiently.

    Reconnaissance Specialist: Nmap doesn't wait for each response before sending the next request, making it much faster.

    ~ instructor_rapport += 5

+ [Tell me about creating a ping sweep script]
    -> ping_sweep_script

- -> scanning_hub

=== ping_sweep_script ===
Reconnaissance Specialist: Creating your own tools helps you understand how they work. Let's build a ping sweep bash script.

~ instructor_rapport += 5

Reconnaissance Specialist: Here's a basic structure:

Reconnaissance Specialist: #!/bin/bash

Reconnaissance Specialist: if [ $# -ne 1 ]; then

Reconnaissance Specialist:   echo "Usage: `basename $0` {three octets of IP, for example 192.168.0}"

Reconnaissance Specialist:   exit 1

Reconnaissance Specialist: fi

Reconnaissance Specialist: ip_address_start=$1

Reconnaissance Specialist: for i in {1..254}; do

Reconnaissance Specialist:   ping -c 1 -W 1 $ip_address_start.$i | grep 'from'

Reconnaissance Specialist: done

+ [How does this script work?]
    Reconnaissance Specialist: Let me break it down. First, we check if the user provided exactly one argument (the first three octets of an IP address).

    Reconnaissance Specialist: If not, we print usage instructions and exit with an error code.

    Reconnaissance Specialist: Then we store the argument in a variable called ip_address_start.

    Reconnaissance Specialist: The for loop iterates from 1 to 254 (all valid host addresses in a /24 subnet).

    Reconnaissance Specialist: For each iteration, we ping that IP with one request and a 1-second timeout, then pipe to grep to only show successful responses.

    ~ instructor_rapport += 5

+ [How do I make the script executable?]
    Reconnaissance Specialist: After saving the script, you need to set the executable permission:

    Reconnaissance Specialist: chmod +x pingsweep.sh

    Reconnaissance Specialist: The chmod command changes file modes or permissions. The +x flag adds execute permission.

    Reconnaissance Specialist: You can verify with: ls -la

    Reconnaissance Specialist: You'll see an 'x' in the permissions, indicating the file can be executed.

    ~ instructor_rapport += 5

+ [How long will this take to run?]
    Reconnaissance Specialist: Good thinking! With the -W 1 timeout, each ping waits up to 1 second for a response.

    Reconnaissance Specialist: Since we're checking 254 addresses sequentially, in the worst case (no hosts respond), it could take up to 254 seconds - over 4 minutes!

    Reconnaissance Specialist: This is why professional tools like Nmap are so much faster - they send requests in parallel and use more sophisticated timing.

    ~ instructor_rapport += 5

- -> scanning_hub

=== nmap_intro ===
Reconnaissance Specialist: Nmap - Network Mapper - is without a doubt the most popular scanning tool in existence.

~ instructor_rapport += 5

Reconnaissance Specialist: Nmap is an open source tool for network exploration and security auditing. It was designed to rapidly scan large networks, although it works fine against single hosts.

Reconnaissance Specialist: It uses raw IP packets in novel ways to determine what hosts are available, what services they're offering, what operating systems they're running, what type of packet filters are in use, and much more.

+ [What makes Nmap so powerful?]
    Reconnaissance Specialist: Nmap supports dozens of different scanning techniques, from simple ping sweeps to complex protocol analysis.

    Reconnaissance Specialist: It can identify services, detect versions, fingerprint operating systems, evade firewalls, and output results in various formats.

    Reconnaissance Specialist: It's actively maintained, has extensive documentation, and is scriptable with the Nmap Scripting Engine (NSE).

    Reconnaissance Specialist: Most importantly, it's extremely fast and efficient compared to manual or simple scripted approaches.

    ~ instructor_rapport += 5

+ [How do I use Nmap for ping sweeps?]
    Reconnaissance Specialist: For a basic ping sweep: nmap -sn -PE 10.0.0.1-254

    Reconnaissance Specialist: The -sn flag tells Nmap to skip port scanning (just do host discovery).

    Reconnaissance Specialist: The -PE flag specifies ICMP echo requests.

    Reconnaissance Specialist: Nmap's default host discovery with -sn is actually more comprehensive than just ping - it sends ICMP echo requests, TCP SYN to port 443, TCP ACK to port 80, and ICMP timestamp requests.

    Reconnaissance Specialist: This gives you a better chance of detecting hosts even if they block regular pings.

    ~ instructor_rapport += 5

+ [Can Nmap resolve hostnames?]
    Reconnaissance Specialist: Yes! Nmap performs DNS resolution by default.

    Reconnaissance Specialist: You can do a list scan with: nmap -sL 10.0.0.1-254

    Reconnaissance Specialist: This lists all hosts with their hostnames without actually scanning them.

    Reconnaissance Specialist: The hostnames can be very informative - names like "web-server-01" or "database-prod" tell you a lot about what a system does.

    ~ instructor_rapport += 5

- -> scanning_hub

=== ports_intro ===
Reconnaissance Specialist: Understanding ports is fundamental to network scanning and security.

~ instructor_rapport += 5

Reconnaissance Specialist: All TCP and UDP traffic uses port numbers to establish which applications are communicating.

Reconnaissance Specialist: For example, web servers typically listen on port 80 for HTTP or port 443 for HTTPS. Email servers use ports 25 (SMTP), 110 (POP3), or 143 (IMAP).

Reconnaissance Specialist: There are 65,535 possible TCP ports and 65,535 possible UDP ports on each system.

+ [Why do standard services use specific ports?]
    Reconnaissance Specialist: Standard port numbers make networking practical. When you type a URL in your browser, it knows to connect to port 80 or 443 without you specifying it.

    Reconnaissance Specialist: The Internet Assigned Numbers Authority (IANA) maintains the official registry of port number assignments.

    Reconnaissance Specialist: On Linux systems, you can see common port assignments in /etc/services

    Reconnaissance Specialist: Ports 1-1023 are well-known ports typically requiring admin privileges to bind to. Ports 1024-49151 are registered ports. Ports 49152-65535 are dynamic/private ports.

    ~ instructor_rapport += 5

+ [How can I manually check if a port is open?]
    Reconnaissance Specialist: You can use telnet or netcat to connect manually:

    Reconnaissance Specialist: telnet IP_ADDRESS 80

    Reconnaissance Specialist: If you see "Connected to..." the port is open. If it says "Connection refused" or times out, the port is closed or filtered.

    Reconnaissance Specialist: Netcat is similar: nc IP_ADDRESS 80

    Reconnaissance Specialist: This manual approach helps you understand what's happening, but it's not practical for scanning many ports.

    ~ instructor_rapport += 5

+ [What's the difference between open, closed, and filtered ports?]
    Reconnaissance Specialist: An open port has an application actively listening and accepting connections.

    Reconnaissance Specialist: A closed port has no application listening, but the system responded to your probe (usually with a RST packet).

    Reconnaissance Specialist: A filtered port means a firewall or filter is blocking the probe, so you can't determine if it's open or closed.

    Reconnaissance Specialist: You might also see states like "open|filtered" when Nmap can't definitively determine the state.

    ~ instructor_rapport += 5

- -> scanning_hub

=== tcp_handshake ===
Reconnaissance Specialist: Understanding the TCP three-way handshake is crucial for understanding port scanning techniques.

~ instructor_rapport += 5

Reconnaissance Specialist: To establish a TCP connection and start sending data, a three-way handshake occurs:

Reconnaissance Specialist: Step 1: The client sends a TCP packet with the SYN flag set, indicating it wants to start a new connection to a specific port.

Reconnaissance Specialist: Step 2: If a server is listening on that port, it responds with SYN-ACK flags set, accepting the connection.

Reconnaissance Specialist: Step 3: The client completes the connection by sending a packet with the ACK flag set.

+ [What happens if the port is closed?]
    Reconnaissance Specialist: If the port is closed, the server will send a RST (reset) packet at step 2 instead of SYN-ACK.

    Reconnaissance Specialist: This immediately tells the client the port is closed.

    Reconnaissance Specialist: If there's a firewall filtering that port, you might not receive any reply at all - the packets are simply dropped.

    ~ instructor_rapport += 5

+ [Why is this relevant to scanning?]
    Reconnaissance Specialist: Here's the key insight: if all we want to know is whether a port is open, we can skip step 3!

    Reconnaissance Specialist: The SYN-ACK response at step 2 already tells us the port is open.

    Reconnaissance Specialist: This is the basis for SYN scanning - send SYN, wait for SYN-ACK, then don't complete the handshake.

    Reconnaissance Specialist: It's faster and stealthier than completing the full connection, though modern IDS systems will still detect it.

    ~ instructor_rapport += 5

+ [What's a full connect scan then?]
    Reconnaissance Specialist: A full connect scan completes the entire three-way handshake for each port.

    Reconnaissance Specialist: It's less efficient because you're establishing complete connections, but it doesn't require special privileges.

    Reconnaissance Specialist: SYN scans need to write raw packets, which requires root privileges on Linux. Connect scans use standard library functions available to any user.

    Reconnaissance Specialist: In Nmap, -sT does a connect scan, while -sS does a SYN scan.

    ~ instructor_rapport += 5

- -> scanning_hub

=== port_scanner_script ===
Reconnaissance Specialist: Let's build a simple port scanner in bash to understand how port scanning works.

~ instructor_rapport += 5

Reconnaissance Specialist: Modern bash can connect to TCP ports using special file descriptors like /dev/tcp/HOST/PORT

Reconnaissance Specialist: Here's a basic port scanner structure:

Reconnaissance Specialist: #!/bin/bash

Reconnaissance Specialist: if [ $# -ne 1 ]; then

Reconnaissance Specialist:   echo "Usage: `basename $0` {IP address or hostname}"

Reconnaissance Specialist:   exit 1

Reconnaissance Specialist: fi

Reconnaissance Specialist: ip_address=$1

Reconnaissance Specialist: echo `date` >> $ip_address.open_ports

Reconnaissance Specialist: for port in {1..65535}; do

Reconnaissance Specialist:   timeout 1 echo > /dev/tcp/$ip_address/$port

Reconnaissance Specialist:   if [ $? -eq 0 ]; then

Reconnaissance Specialist:     echo "port $port is open" >> "$ip_address.open_ports"

Reconnaissance Specialist:   fi

Reconnaissance Specialist: done

+ [How does this work?]
    Reconnaissance Specialist: The script takes one argument - the IP address to scan.

    Reconnaissance Specialist: It loops through all 65,535 possible ports (this will take a very long time!).

    Reconnaissance Specialist: For each port, it tries to connect using echo > /dev/tcp/$ip_address/$port

    Reconnaissance Specialist: The timeout command ensures each attempt only waits 1 second.

    Reconnaissance Specialist: The special variable $? contains the exit status of the last command - 0 for success, non-zero for failure.

    Reconnaissance Specialist: If the connection succeeded ($? equals 0), we write that port number to the output file.

    ~ instructor_rapport += 5

+ [Why would I write this when Nmap exists?]
    Reconnaissance Specialist: Great question! Writing your own tools teaches you how they work under the hood.

    Reconnaissance Specialist: It helps you understand what's actually happening when you run Nmap.

    Reconnaissance Specialist: In some restricted environments, you might not have Nmap available but can write bash scripts.

    Reconnaissance Specialist: Plus, it's a good programming exercise! You could extend it to do banner grabbing, run it in parallel, or output in different formats.

    ~ instructor_rapport += 5

+ [How long will scanning all 65535 ports take?]
    Reconnaissance Specialist: With a 1-second timeout per port, in the worst case it could take over 18 hours!

    Reconnaissance Specialist: This is why professional scanners like Nmap are so much more sophisticated - they use parallel connections, adaptive timing, and send raw packets.

    Reconnaissance Specialist: Your simple bash script is doing full TCP connect scans sequentially. Nmap can send hundreds of packets simultaneously.

    ~ instructor_rapport += 5

- -> scanning_hub

=== nmap_port_scanning ===
Reconnaissance Specialist: Nmap supports dozens of different port scanning techniques. Let me cover the most important ones.

~ instructor_rapport += 5

Reconnaissance Specialist: **SYN Scan (-sS):** The default and most popular scan. Sends SYN packets and looks for SYN-ACK responses. Fast and stealthy. Requires root.

Reconnaissance Specialist: **Connect Scan (-sT):** Completes the full TCP handshake. Slower but doesn't require root privileges.

Reconnaissance Specialist: **UDP Scan (-sU):** Scans UDP ports. Slower and less reliable because UDP is connectionless.

Reconnaissance Specialist: **NULL, FIN, and Xmas Scans (-sN, -sF, -sX):** Send packets with unusual flag combinations to evade some firewalls. Don't work against Windows.

+ [Tell me more about SYN scans]
    Reconnaissance Specialist: SYN scans are the default Nmap scan type for good reason.

    Reconnaissance Specialist: They're fast because they don't complete the connection. They're relatively stealthy compared to connect scans.

    Reconnaissance Specialist: However, modern intrusion detection systems will absolutely detect SYN scans - the "stealth" is relative.

    Reconnaissance Specialist: Run a SYN scan with: sudo nmap -sS TARGET

    Reconnaissance Specialist: You need sudo because sending raw SYN packets requires root privileges.

    ~ instructor_rapport += 5

+ [Why are UDP scans unreliable?]
    Reconnaissance Specialist: UDP is connectionless - there's no handshake like TCP. You send a packet and hope for a response.

    Reconnaissance Specialist: If a UDP port is open, the service might not respond at all. If it's closed, you might get an ICMP "port unreachable" message.

    Reconnaissance Specialist: The lack of response is ambiguous - is the port open and ignoring you, or is it filtered by a firewall?

    Reconnaissance Specialist: UDP scans are also slow because Nmap has to wait for timeouts: sudo nmap -sU TARGET

    Reconnaissance Specialist: Despite these challenges, UDP scanning is important because many services run on UDP like DNS (port 53) and SNMP (port 161).

    ~ instructor_rapport += 5

+ [What are NULL, FIN, and Xmas scans?]
    Reconnaissance Specialist: These send TCP packets with unusual flag combinations to try to evade simple firewalls.

    Reconnaissance Specialist: NULL scan (-sN) sends packets with no flags set. FIN scan (-sF) sends packets with only the FIN flag. Xmas scan (-sX) sends FIN, PSH, and URG flags.

    Reconnaissance Specialist: According to RFC 793, a closed port should respond with RST to these probes, while open ports should not respond.

    Reconnaissance Specialist: However, Windows systems don't follow the RFC correctly, so these scans don't work against Windows targets.

    Reconnaissance Specialist: They're less useful today since modern firewalls and IDS systems detect them easily.

    ~ instructor_rapport += 5

+ [How do I specify which ports to scan?]
    Reconnaissance Specialist: Nmap has flexible port specification options.

    Reconnaissance Specialist: By default, Nmap scans the 1000 most common ports. You can scan specific ports with -p:

    Reconnaissance Specialist: nmap -p 80,443,8080 TARGET (specific ports)

    Reconnaissance Specialist: nmap -p 1-1000 TARGET (port range)

    Reconnaissance Specialist: nmap -p- TARGET (all 65535 ports)

    Reconnaissance Specialist: nmap -F TARGET (fast scan - only 100 most common ports)

    Reconnaissance Specialist: You can also use -r to scan ports in sequential order instead of random.

    ~ instructor_rapport += 5

- -> scanning_hub

=== service_identification ===
Reconnaissance Specialist: Knowing which ports are open is useful, but knowing what services are running on those ports is essential for planning attacks or security assessments.

~ instructor_rapport += 5

Reconnaissance Specialist: The simplest approach is banner grabbing - connecting to a port and checking if the service reveals what software it's running.

Reconnaissance Specialist: Many services present a banner when you connect, often stating the software name and version.

+ [How do I manually grab banners?]
    Reconnaissance Specialist: You can use netcat to connect and see what the service sends:

    Reconnaissance Specialist: nc IP_ADDRESS 21

    Reconnaissance Specialist: Port 21 (FTP) usually sends a banner immediately. Press Ctrl-C to disconnect.

    Reconnaissance Specialist: For port 80 (HTTP), you need to send something first:

    Reconnaissance Specialist: nc IP_ADDRESS 80

    Reconnaissance Specialist: Then type a dot and press Enter a few times. Look for the "Server:" header in the response.

    ~ instructor_rapport += 5

+ [How can I automate banner grabbing?]
    Reconnaissance Specialist: Netcat can grab banners across a range of ports:

    Reconnaissance Specialist: nc IP_ADDRESS 1-2000 -w 1

    Reconnaissance Specialist: This connects to ports 1 through 2000 with a 1-second timeout and displays any banners.

    Reconnaissance Specialist: You could also update your bash port scanner script to read from each open port instead of just writing to it.

    ~ instructor_rapport += 5

+ [Can I trust banner information?]
    Reconnaissance Specialist: Excellent critical thinking! No, you cannot trust banners completely.

    Reconnaissance Specialist: Server administrators can configure services to report false version information to mislead attackers.

    Reconnaissance Specialist: A web server claiming to be "Apache/2.4.1" might actually be nginx or a completely different version of Apache.

    Reconnaissance Specialist: This is why we use protocol analysis and fingerprinting to verify what's actually running.

    ~ instructor_rapport += 5

+ [Tell me about protocol analysis]
    -> protocol_analysis

- -> scanning_hub

=== protocol_analysis ===
Reconnaissance Specialist: Protocol analysis, also called fingerprinting, determines what software is running by analyzing how it responds to various requests.

~ instructor_rapport += 5

Reconnaissance Specialist: Instead of trusting what the banner says, we send different kinds of requests (triggers) and compare the responses to a database of fingerprints.

Reconnaissance Specialist: The software Amap pioneered this approach with two main features: banner grabbing (-B flag) and protocol analysis (-A flag).

+ [How do I use Amap?]
    Reconnaissance Specialist: Amap is straightforward but somewhat outdated:

    Reconnaissance Specialist: amap -A IP_ADDRESS 80

    Reconnaissance Specialist: This performs protocol analysis on port 80, telling you what protocol is in use and what software is likely running.

    Reconnaissance Specialist: However, Amap has been largely superseded by Nmap's service detection, which is more up-to-date and accurate.

    ~ instructor_rapport += 5

+ [How does Nmap's version detection work?]
    Reconnaissance Specialist: Nmap's version detection is one of its most powerful features:

    Reconnaissance Specialist: nmap -sV IP_ADDRESS

    Reconnaissance Specialist: Nmap connects to each open port and sends various triggers, then analyzes the responses against a massive database of service signatures.

    Reconnaissance Specialist: It can often identify not just the service type but the specific version number.

    Reconnaissance Specialist: You can combine it with port specification: nmap -sV -p 80 IP_ADDRESS

    Reconnaissance Specialist: Or scan all default ports with version detection: nmap -sV IP_ADDRESS

    ~ instructor_rapport += 5

+ [How accurate is version detection?]
    Reconnaissance Specialist: Nmap's version detection is very accurate when services respond normally.

    Reconnaissance Specialist: It maintains a database called nmap-service-probes with thousands of service signatures.

    Reconnaissance Specialist: However, custom or heavily modified services might not match the database perfectly.

    Reconnaissance Specialist: And determined administrators can still configure services to mislead fingerprinting, though it's more difficult than changing a banner.

    ~ instructor_rapport += 5

- -> scanning_hub

=== os_detection ===
Reconnaissance Specialist: Operating system detection is another powerful Nmap capability that helps you understand your target.

~ instructor_rapport += 5

Reconnaissance Specialist: Knowing the OS is important for choosing the right payload when launching exploits, and for understanding what vulnerabilities might be present.

Reconnaissance Specialist: Nmap performs OS detection by analyzing subtle differences in how operating systems implement TCP/IP.

+ [How does OS fingerprinting work?]
    Reconnaissance Specialist: The TCP/IP RFCs (specifications) contain some ambiguity - they're not 100% prescriptive about every implementation detail.

    Reconnaissance Specialist: Each operating system makes slightly different choices in how it handles network packets.

    Reconnaissance Specialist: Nmap sends specially crafted packets to both open and closed ports, then analyzes the responses.

    Reconnaissance Specialist: It compares these responses to a database of OS fingerprints to make an educated guess about what's running.

    ~ instructor_rapport += 5

+ [How do I use OS detection?]
    Reconnaissance Specialist: OS detection is simple to invoke:

    Reconnaissance Specialist: sudo nmap -O IP_ADDRESS

    Reconnaissance Specialist: You need sudo because OS detection requires sending raw packets.

    Reconnaissance Specialist: Nmap will report its best guess about the operating system, often with a confidence percentage.

    Reconnaissance Specialist: You can combine OS detection with version detection: sudo nmap -O -sV IP_ADDRESS

    ~ instructor_rapport += 5

+ [How accurate is OS detection?]
    Reconnaissance Specialist: OS detection is usually quite accurate, especially for common operating systems.

    Reconnaissance Specialist: However, it can be confused by firewalls, virtualization, or network devices that modify packets.

    Reconnaissance Specialist: Nmap will report a confidence level and sometimes multiple possible matches.

    Reconnaissance Specialist: Like version detection, OS detection can be deceived by administrators who configure their systems to report false information, though this is uncommon.

    ~ instructor_rapport += 5

- -> scanning_hub

=== nmap_timing ===
Reconnaissance Specialist: Nmap's timing and performance options let you control the speed and stealth of your scans.

~ instructor_rapport += 5

Reconnaissance Specialist: Nmap offers six timing templates from paranoid to insane:

Reconnaissance Specialist: -T0 (paranoid): Extremely slow, sends one probe every 5 minutes. For IDS evasion.

Reconnaissance Specialist: -T1 (sneaky): Very slow, sends one probe every 15 seconds.

Reconnaissance Specialist: -T2 (polite): Slower, less bandwidth intensive. Won't overwhelm targets.

Reconnaissance Specialist: -T3 (normal): The default. Balanced speed and reliability.

Reconnaissance Specialist: -T4 (aggressive): Faster, assumes a fast and reliable network.

Reconnaissance Specialist: -T5 (insane): Very fast, may miss open ports or overwhelm networks.

+ [When would I use paranoid or sneaky timing?]
    Reconnaissance Specialist: These ultra-slow timing templates are for stealth - attempting to evade intrusion detection systems.

    Reconnaissance Specialist: For example: nmap -T0 IP_ADDRESS

    Reconnaissance Specialist: However, modern IDS systems will still detect these scans, they just take much longer.

    Reconnaissance Specialist: These templates are rarely used in practice because they're so slow. A full scan could take days!

    Reconnaissance Specialist: In authorized penetration tests, you usually don't need this level of stealth.

    ~ instructor_rapport += 5

+ [When should I use aggressive or insane timing?]
    Reconnaissance Specialist: Aggressive (-T4) is good when scanning on fast, reliable networks where you want quicker results.

    Reconnaissance Specialist: Insane (-T5) is for very fast networks when you want the absolute fastest scan: nmap -T5 IP_ADDRESS

    Reconnaissance Specialist: However, be careful! Insane timing can miss open ports because it doesn't wait long enough for responses.

    Reconnaissance Specialist: It can also overwhelm slow network links or trigger rate limiting, causing you to miss results.

    Reconnaissance Specialist: Generally, stick with normal or aggressive timing unless you have a specific reason to change.

    ~ instructor_rapport += 5

+ [Can I customize timing beyond the templates?]
    Reconnaissance Specialist: Yes! Nmap has many granular timing options like --max-retries, --host-timeout, --scan-delay, and more.

    Reconnaissance Specialist: The templates are just convenient presets. You can read about all the timing options in the man page under "TIMING AND PERFORMANCE."

    Reconnaissance Specialist: For most purposes, the templates are sufficient and easier to remember.

    ~ instructor_rapport += 5

- -> scanning_hub

=== nmap_output ===
Reconnaissance Specialist: Nmap's output options let you save scan results for later analysis, reporting, or importing into other tools.

~ instructor_rapport += 5

Reconnaissance Specialist: Nmap supports several output formats:

Reconnaissance Specialist: -oN filename (normal output): Saves output similar to what you see on screen.

Reconnaissance Specialist: -oX filename (XML output): Saves structured XML, great for importing into other tools.

Reconnaissance Specialist: -oG filename (grepable output): Simple columnar format, but deprecated.

Reconnaissance Specialist: -oA basename (all formats): Saves all three formats with the same base filename.

+ [When should I use XML output?]
    Reconnaissance Specialist: XML output is the most versatile format:

    Reconnaissance Specialist: nmap -oX scan_results.xml IP_ADDRESS

    Reconnaissance Specialist: XML can be imported into vulnerability scanners, reporting tools, and custom scripts.

    Reconnaissance Specialist: Many security tools and frameworks can parse Nmap XML directly.

    Reconnaissance Specialist: You can also transform XML with tools like xsltproc to create HTML reports or other formats.

    ~ instructor_rapport += 5

+ [What about Nmap GUIs?]
    Reconnaissance Specialist: Nmap has several graphical interfaces, most notably Zenmap (the official GUI).

    Reconnaissance Specialist: GUIs can help beginners construct commands and visualize results.

    Reconnaissance Specialist: They're useful for saving scan profiles and comparing results from multiple scans.

    Reconnaissance Specialist: However, most experts prefer the command line for speed, scriptability, and remote access via SSH.

    Reconnaissance Specialist: Note that Kali Linux recently removed Zenmap because it was based on Python 2, but other alternatives exist.

    ~ instructor_rapport += 5

+ [Should I always save output?]
    Reconnaissance Specialist: In professional penetration testing, absolutely! You need records of what you scanned and when.

    Reconnaissance Specialist: Scan results are evidence for your reports and help you track progress.

    Reconnaissance Specialist: They also protect you legally - if something goes wrong, you have proof of what you actually did.

    Reconnaissance Specialist: Get in the habit of using -oA to save all formats: nmap -oA scan_results IP_ADDRESS

    ~ instructor_rapport += 5

- -> scanning_hub

=== commands_reference ===
Reconnaissance Specialist: Let me provide a comprehensive commands reference for this lab.

~ instructor_rapport += 5

Reconnaissance Specialist: **Basic Network Information:**

Reconnaissance Specialist: Show IP addresses: ip a (or ifconfig on older systems)

Reconnaissance Specialist: Show just the IPs: hostname -I

Reconnaissance Specialist: **Ping Commands:**

Reconnaissance Specialist: Basic ping: ping DESTINATION

Reconnaissance Specialist: Limited count: ping -c 3 DESTINATION

Reconnaissance Specialist: With timeout: ping -c 1 -W 1 DESTINATION

+ [Show me ping sweep script commands]
    Reconnaissance Specialist: **Ping Sweep Script:**

    Reconnaissance Specialist: Create script: vi pingsweep.sh

    Reconnaissance Specialist: Make executable: chmod +x pingsweep.sh

    Reconnaissance Specialist: Run script: ./pingsweep.sh 10.0.0

    Reconnaissance Specialist: (Replace 10.0.0 with your network's first three octets)

    ~ instructor_rapport += 3

+ [Show me Nmap host discovery commands]
    Reconnaissance Specialist: **Nmap Host Discovery:**

    Reconnaissance Specialist: Ping sweep with echo request: nmap -sn -PE 10.0.0.1-254

    Reconnaissance Specialist: Default host discovery: sudo nmap -sn 10.0.0.1-254

    Reconnaissance Specialist: List scan (DNS only): nmap -sL 10.0.0.1-254

    ~ instructor_rapport += 3

+ [Show me port checking commands]
    Reconnaissance Specialist: **Manual Port Checking:**

    Reconnaissance Specialist: Using telnet: telnet IP_ADDRESS 80

    Reconnaissance Specialist: Using netcat: nc IP_ADDRESS 80

    Reconnaissance Specialist: Test TCP connection with bash: echo > /dev/tcp/IP_ADDRESS/PORT

    Reconnaissance Specialist: Check last command status: echo $?

    Reconnaissance Specialist: (0 = success, non-zero = failure)

    ~ instructor_rapport += 3

+ [Show me port scanner script commands]
    Reconnaissance Specialist: **Port Scanner Script:**

    Reconnaissance Specialist: Create script: vi portscanner.sh

    Reconnaissance Specialist: Make executable: chmod +x portscanner.sh

    Reconnaissance Specialist: Run script: ./portscanner.sh IP_ADDRESS

    Reconnaissance Specialist: View results: less IP_ADDRESS.open_ports

    ~ instructor_rapport += 3

+ [Show me Nmap scanning commands]
    Reconnaissance Specialist: **Nmap Port Scanning:**

    Reconnaissance Specialist: Basic scan: nmap TARGET

    Reconnaissance Specialist: SYN scan: sudo nmap -sS TARGET

    Reconnaissance Specialist: Connect scan: nmap -sT TARGET

    Reconnaissance Specialist: UDP scan: sudo nmap -sU TARGET

    Reconnaissance Specialist: Specific ports: nmap -p 80,443 TARGET

    Reconnaissance Specialist: Port range: nmap -p 1-1000 TARGET

    Reconnaissance Specialist: All ports: nmap -p- TARGET

    Reconnaissance Specialist: Fast scan: nmap -F TARGET

    ~ instructor_rapport += 3

+ [Show me service detection commands]
    Reconnaissance Specialist: **Service Identification:**

    Reconnaissance Specialist: Manual banner grab (FTP): nc IP_ADDRESS 21

    Reconnaissance Specialist: Manual banner grab (HTTP): nc IP_ADDRESS 80 (then type . and press Enter)

    Reconnaissance Specialist: Automated banner grab: nc IP_ADDRESS 1-2000 -w 1

    Reconnaissance Specialist: Amap protocol analysis: amap -A IP_ADDRESS PORT

    Reconnaissance Specialist: Nmap version detection: nmap -sV IP_ADDRESS

    Reconnaissance Specialist: Version detection on specific port: nmap -sV -p 80 IP_ADDRESS

    ~ instructor_rapport += 3

+ [Show me OS detection and timing commands]
    Reconnaissance Specialist: **OS Detection:**

    Reconnaissance Specialist: OS detection: sudo nmap -O IP_ADDRESS

    Reconnaissance Specialist: OS + version detection: sudo nmap -O -sV IP_ADDRESS

    Reconnaissance Specialist: **Timing Templates:**

    Reconnaissance Specialist: Paranoid: nmap -T0 TARGET

    Reconnaissance Specialist: Sneaky: nmap -T1 TARGET

    Reconnaissance Specialist: Polite: nmap -T2 TARGET

    Reconnaissance Specialist: Normal (default): nmap -T3 TARGET

    Reconnaissance Specialist: Aggressive: nmap -T4 TARGET

    Reconnaissance Specialist: Insane: nmap -T5 TARGET

    ~ instructor_rapport += 3

+ [Show me output commands]
    Reconnaissance Specialist: **Nmap Output:**

    Reconnaissance Specialist: Normal output: nmap -oN filename TARGET

    Reconnaissance Specialist: XML output: nmap -oX filename TARGET

    Reconnaissance Specialist: Grepable output: nmap -oG filename TARGET

    Reconnaissance Specialist: All formats: nmap -oA basename TARGET

    Reconnaissance Specialist: View output file: less filename

    ~ instructor_rapport += 3

+ [Show me combined scan examples]
    Reconnaissance Specialist: **Combined Scans:**

    Reconnaissance Specialist: Fast aggressive scan with version detection:

    Reconnaissance Specialist: nmap -T4 -F -sV IP_ADDRESS

    Reconnaissance Specialist: Comprehensive scan all ports with OS and version detection:

    Reconnaissance Specialist: sudo nmap -T4 -p- -O -sV -oA comprehensive_scan IP_ADDRESS

    Reconnaissance Specialist: Stealth scan specific ports:

    Reconnaissance Specialist: sudo nmap -T2 -sS -p 80,443,8080 IP_ADDRESS

    ~ instructor_rapport += 3

- -> scanning_hub

=== challenge_tips ===
Reconnaissance Specialist: Let me give you some practical tips for succeeding in the scanning challenges.

~ instructor_rapport += 5

Reconnaissance Specialist: **Finding Live Hosts:**

Reconnaissance Specialist: Use Nmap's default ping sweep - it's more reliable than just ICMP echo: sudo nmap -sn NETWORK_RANGE

Reconnaissance Specialist: Note all discovered IP addresses. Your Kali VM will be one of them, and your targets will be the others.

Reconnaissance Specialist: The first three octets of all systems in the lab will match.

+ [Tips for port scanning?]
    Reconnaissance Specialist: Start with a default Nmap scan to find the most common open ports quickly: nmap IP_ADDRESS

    Reconnaissance Specialist: Then do a comprehensive scan of all ports to find hidden services: nmap -p- IP_ADDRESS

    Reconnaissance Specialist: Remember, there's often a service on an unusual high port that you'll miss if you only scan common ports!

    Reconnaissance Specialist: Use -T4 to speed things up on the lab network: nmap -T4 -p- IP_ADDRESS

    ~ instructor_rapport += 5

+ [Tips for banner grabbing?]
    Reconnaissance Specialist: When banner grabbing with netcat, be patient. Some services send the banner immediately, others wait for you to send something first.

    Reconnaissance Specialist: For HTTP (port 80), type any character and press Enter to trigger a response.

    Reconnaissance Specialist: Look carefully at all the banner information - sometimes flags are encoded in the banners!

    Reconnaissance Specialist: The hint mentions a flag is encoded using a common method - think base64 or similar.

    ~ instructor_rapport += 5

+ [What about that familiar vulnerability?]
    Reconnaissance Specialist: The instructions hint at "a familiar vulnerability" that you can exploit.

    Reconnaissance Specialist: Think back to vulnerabilities you've seen in previous labs - Distcc perhaps?

    Reconnaissance Specialist: Make sure you scan ALL ports, not just the common ones, to find it.

    Reconnaissance Specialist: Once you find the vulnerable service, you know what to do from the previous lab!

    ~ instructor_rapport += 5

+ [General troubleshooting advice?]
    Reconnaissance Specialist: If you're not finding expected results, double-check your network range. Use hostname -I on Kali to confirm.

    Reconnaissance Specialist: Make sure the victim VMs are actually running - check the Hacktivity dashboard.

    Reconnaissance Specialist: If scans seem to hang, try reducing the timing or checking your network connectivity.

    Reconnaissance Specialist: Remember that -p- (all ports) scans take time. Be patient or use -T4 to speed it up.

    Reconnaissance Specialist: Always use sudo for SYN scans, UDP scans, and OS detection - they require root privileges.

    ~ instructor_rapport += 5

- -> scanning_hub

=== ready_for_practice ===
Reconnaissance Specialist: Excellent! You're ready to start the practical scanning exercises.

~ instructor_rapport += 10
~ scanning_ethics += 10

Reconnaissance Specialist: Remember: this knowledge is powerful. Network scanning without authorization is illegal in most jurisdictions.

Reconnaissance Specialist: You have permission to scan the lab VMs. Never scan external networks, your school network, or any systems you don't own without explicit written authorization.

Reconnaissance Specialist: In professional penetration testing, you'll have a scope document that clearly defines what you're allowed to scan.

+ [Any final advice?]
    Reconnaissance Specialist: Start simple - find live hosts first, then scan common ports, then expand to all ports.

    Reconnaissance Specialist: Document everything you find. Take notes on IP addresses, open ports, and service versions.

    Reconnaissance Specialist: Read the Nmap man page regularly - it's one of the best sources of information: man nmap

    Reconnaissance Specialist: Don't forget to look for those flags - in banners, on unusual ports, and via exploitation of familiar vulnerabilities!

    Reconnaissance Specialist: Most importantly: be patient and methodical. Scanning is about being thorough, not fast.

    ~ instructor_rapport += 10

- -> scanning_hub

-> END
