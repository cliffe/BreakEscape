// Scanning and Information Gathering - Game Scenario Version
// Based on HacktivityLabSheets: introducing_attacks/5_scanning.md
// Author: Z. Cliffe Schreuders, Anatoliy Gorbenko, Thalita Vergilio
// License: CC BY-SA 4.0

// Global persistent state
VAR haxolottle_rapport = 0

// External variables
EXTERNAL player_name

=== start ===
Haxolottle: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe." -- Abraham Lincoln

~ haxolottle_rapport = 0

Haxolottle: {player_name}, want to learn about scanning and reconnaissance?

Haxolottle: Scanning is critical, little axolotl. It tells you everything: IP addresses, open ports, service versions, operating systems.

Haxolottle: Once you know what software is running and what version, you can look up attacks against it.

Haxolottle: This knowledge is powerful. Only use it for authorized security testing.

-> scanning_hub

=== scanning_hub ===
Haxolottle: What would you like to know about?

+ [Why is scanning important?]
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
+ [Nmap timing and performance]
    -> nmap_timing
+ [Nmap output and GUIs]
    -> nmap_output
+ [Show me commands]
    -> commands_reference
+ [I'm good for now]
    #exit_conversation
    -> END

=== scanning_importance ===
Haxolottle: Scanning is often the most important phase of an attack or security assessment.

~ haxolottle_rapport += 5

Haxolottle: After establishing a list of live hosts, you examine the attack surface - what there is that could be attacked on each system.

Haxolottle: Any way that a remote computer accepts communication has the potential to be attacked.

Haxolottle: For security testers and network administrators, scanning helps map out a network, understand what's running where, and identify potential security problems before attackers find them.

+ [What information does scanning reveal?]
    Haxolottle: Scanning typically reveals IP addresses of live hosts, open ports on those hosts, what services are running on each port, the versions of those services, and often the operating system.

    Haxolottle: With this information, you can look up known vulnerabilities for those specific software versions and plan your attack or remediation accordingly.

    Haxolottle: A well-executed scanning stage is extremely important when looking for potential security problems.

    ~ haxolottle_rapport += 5

+ [Is scanning legal?]
    Haxolottle: Excellent question. Scanning networks and systems without authorization is typically illegal in most jurisdictions.

    Haxolottle: You need explicit written permission to scan systems you don't own. This includes networks at your school, workplace, or anywhere else unless you have authorization.

    Haxolottle: In penetration testing engagements, you'll have a statement of work or rules of engagement that defines what you're allowed to scan.

    Haxolottle: Always have authorization. Never scan networks without permission.

+ [What's the difference between passive and active reconnaissance?]
    Haxolottle: Great question! Passive reconnaissance involves gathering information without directly interacting with the target - like looking up DNS records or searching public websites.

    Haxolottle: Active reconnaissance, which includes scanning, directly interacts with the target systems and can be detected.

    Haxolottle: Scanning sends packets to the target, which can trigger intrusion detection systems and will show up in logs.

    Haxolottle: This is why timing and stealth can be important, though in authorized testing you may not need to be stealthy.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== ping_sweeps ===
Haxolottle: Ping sweeps are used to identify live hosts on a network. They're often the first step in network reconnaissance.

~ haxolottle_rapport += 5

Haxolottle: The ping command works by sending an ICMP echo request to a target. Most hosts will reply with an ICMP echo response.

Haxolottle: However, Windows PC firewalls typically block incoming ping requests by default, so ping isn't always reliable.

+ [How do I use the ping command?]
    Haxolottle: The basic use is: ping DESTINATION

    Haxolottle: Where DESTINATION is an IP address or hostname.

    Haxolottle: By default, ping keeps sending requests until you press Ctrl-C. You can limit the count with the -c flag.

    Haxolottle: For example: ping -c 3 10.0.0.1

    Haxolottle: This sends exactly 3 echo requests.

    Haxolottle: The -W flag sets the timeout in seconds: ping -c 1 -W 1 10.0.0.1

    ~ haxolottle_rapport += 5

+ [How can I ping a whole network range?]
    Haxolottle: You could manually ping each IP address in the range, but that's tedious and inefficient.

    Haxolottle: A better approach is to write a bash script that loops through all IPs in the range.

    Haxolottle: Or, even better, use Nmap which can do this far more efficiently.

    Haxolottle: Nmap doesn't wait for each response before sending the next request, making it much faster.

    ~ haxolottle_rapport += 5

+ [Tell me about creating a ping sweep script]
    -> ping_sweep_script

- -> scanning_hub

=== ping_sweep_script ===
Haxolottle: Creating your own tools helps you understand how they work. Let's build a ping sweep bash script.

~ haxolottle_rapport += 5

Haxolottle: Here's a basic structure:

Haxolottle: #!/bin/bash

Haxolottle: if [ $# -ne 1 ]; then

Haxolottle:   echo "Usage: `basename $0` {three octets of IP, for example 192.168.0}"

Haxolottle:   exit 1

Haxolottle: fi

Haxolottle: ip_address_start=$1

Haxolottle: for i in {1..254}; do

Haxolottle:   ping -c 1 -W 1 $ip_address_start.$i | grep 'from'

Haxolottle: done

+ [How does this script work?]
    Haxolottle: Let me break it down. First, we check if the user provided exactly one argument (the first three octets of an IP address).

    Haxolottle: If not, we print usage instructions and exit with an error code.

    Haxolottle: Then we store the argument in a variable called ip_address_start.

    Haxolottle: The for loop iterates from 1 to 254 (all valid host addresses in a /24 subnet).

    Haxolottle: For each iteration, we ping that IP with one request and a 1-second timeout, then pipe to grep to only show successful responses.

    ~ haxolottle_rapport += 5

+ [How do I make the script executable?]
    Haxolottle: After saving the script, you need to set the executable permission:

    Haxolottle: chmod +x pingsweep.sh

    Haxolottle: The chmod command changes file modes or permissions. The +x flag adds execute permission.

    Haxolottle: You can verify with: ls -la

    Haxolottle: You'll see an 'x' in the permissions, indicating the file can be executed.

    ~ haxolottle_rapport += 5

+ [How long will this take to run?]
    Haxolottle: Good thinking! With the -W 1 timeout, each ping waits up to 1 second for a response.

    Haxolottle: Since we're checking 254 addresses sequentially, in the worst case (no hosts respond), it could take up to 254 seconds - over 4 minutes!

    Haxolottle: This is why professional tools like Nmap are so much faster - they send requests in parallel and use more sophisticated timing.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== nmap_intro ===
Haxolottle: Nmap - Network Mapper - is without a doubt the most popular scanning tool in existence.

~ haxolottle_rapport += 5

Haxolottle: Nmap is an open source tool for network exploration and security auditing. It was designed to rapidly scan large networks, although it works fine against single hosts.

Haxolottle: It uses raw IP packets in novel ways to determine what hosts are available, what services they're offering, what operating systems they're running, what type of packet filters are in use, and much more.

+ [What makes Nmap so powerful?]
    Haxolottle: Nmap supports dozens of different scanning techniques, from simple ping sweeps to complex protocol analysis.

    Haxolottle: It can identify services, detect versions, fingerprint operating systems, evade firewalls, and output results in various formats.

    Haxolottle: It's actively maintained, has extensive documentation, and is scriptable with the Nmap Scripting Engine (NSE).

    Haxolottle: Most importantly, it's extremely fast and efficient compared to manual or simple scripted approaches.

    ~ haxolottle_rapport += 5

+ [How do I use Nmap for ping sweeps?]
    Haxolottle: For a basic ping sweep: nmap -sn -PE 10.0.0.1-254

    Haxolottle: The -sn flag tells Nmap to skip port scanning (just do host discovery).

    Haxolottle: The -PE flag specifies ICMP echo requests.

    Haxolottle: Nmap's default host discovery with -sn is actually more comprehensive than just ping - it sends ICMP echo requests, TCP SYN to port 443, TCP ACK to port 80, and ICMP timestamp requests.

    Haxolottle: This gives you a better chance of detecting hosts even if they block regular pings.

    ~ haxolottle_rapport += 5

+ [Can Nmap resolve hostnames?]
    Haxolottle: Yes! Nmap performs DNS resolution by default.

    Haxolottle: You can do a list scan with: nmap -sL 10.0.0.1-254

    Haxolottle: This lists all hosts with their hostnames without actually scanning them.

    Haxolottle: The hostnames can be very informative - names like "web-server-01" or "database-prod" tell you a lot about what a system does.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== ports_intro ===
Haxolottle: Understanding ports is fundamental to network scanning and security.

~ haxolottle_rapport += 5

Haxolottle: All TCP and UDP traffic uses port numbers to establish which applications are communicating.

Haxolottle: For example, web servers typically listen on port 80 for HTTP or port 443 for HTTPS. Email servers use ports 25 (SMTP), 110 (POP3), or 143 (IMAP).

Haxolottle: There are 65,535 possible TCP ports and 65,535 possible UDP ports on each system.

+ [Why do standard services use specific ports?]
    Haxolottle: Standard port numbers make networking practical. When you type a URL in your browser, it knows to connect to port 80 or 443 without you specifying it.

    Haxolottle: The Internet Assigned Numbers Authority (IANA) maintains the official registry of port number assignments.

    Haxolottle: On Linux systems, you can see common port assignments in /etc/services

    Haxolottle: Ports 1-1023 are well-known ports typically requiring admin privileges to bind to. Ports 1024-49151 are registered ports. Ports 49152-65535 are dynamic/private ports.

    ~ haxolottle_rapport += 5

+ [How can I manually check if a port is open?]
    Haxolottle: You can use telnet or netcat to connect manually:

    Haxolottle: telnet IP_ADDRESS 80

    Haxolottle: If you see "Connected to..." the port is open. If it says "Connection refused" or times out, the port is closed or filtered.

    Haxolottle: Netcat is similar: nc IP_ADDRESS 80

    Haxolottle: This manual approach helps you understand what's happening, but it's not practical for scanning many ports.

    ~ haxolottle_rapport += 5

+ [What's the difference between open, closed, and filtered ports?]
    Haxolottle: An open port has an application actively listening and accepting connections.

    Haxolottle: A closed port has no application listening, but the system responded to your probe (usually with a RST packet).

    Haxolottle: A filtered port means a firewall or filter is blocking the probe, so you can't determine if it's open or closed.

    Haxolottle: You might also see states like "open|filtered" when Nmap can't definitively determine the state.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== tcp_handshake ===
Haxolottle: Understanding the TCP three-way handshake is crucial for understanding port scanning techniques.

~ haxolottle_rapport += 5

Haxolottle: To establish a TCP connection and start sending data, a three-way handshake occurs:

Haxolottle: Step 1: The client sends a TCP packet with the SYN flag set, indicating it wants to start a new connection to a specific port.

Haxolottle: Step 2: If a server is listening on that port, it responds with SYN-ACK flags set, accepting the connection.

Haxolottle: Step 3: The client completes the connection by sending a packet with the ACK flag set.

+ [What happens if the port is closed?]
    Haxolottle: If the port is closed, the server will send a RST (reset) packet at step 2 instead of SYN-ACK.

    Haxolottle: This immediately tells the client the port is closed.

    Haxolottle: If there's a firewall filtering that port, you might not receive any reply at all - the packets are simply dropped.

    ~ haxolottle_rapport += 5

+ [Why is this relevant to scanning?]
    Haxolottle: Here's the key insight: if all we want to know is whether a port is open, we can skip step 3!

    Haxolottle: The SYN-ACK response at step 2 already tells us the port is open.

    Haxolottle: This is the basis for SYN scanning - send SYN, wait for SYN-ACK, then don't complete the handshake.

    Haxolottle: It's faster and stealthier than completing the full connection, though modern IDS systems will still detect it.

    ~ haxolottle_rapport += 5

+ [What's a full connect scan then?]
    Haxolottle: A full connect scan completes the entire three-way handshake for each port.

    Haxolottle: It's less efficient because you're establishing complete connections, but it doesn't require special privileges.

    Haxolottle: SYN scans need to write raw packets, which requires root privileges on Linux. Connect scans use standard library functions available to any user.

    Haxolottle: In Nmap, -sT does a connect scan, while -sS does a SYN scan.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== port_scanner_script ===
Haxolottle: Let's build a simple port scanner in bash to understand how port scanning works.

~ haxolottle_rapport += 5

Haxolottle: Modern bash can connect to TCP ports using special file descriptors like /dev/tcp/HOST/PORT

Haxolottle: Here's a basic port scanner structure:

Haxolottle: #!/bin/bash

Haxolottle: if [ $# -ne 1 ]; then

Haxolottle:   echo "Usage: `basename $0` {IP address or hostname}"

Haxolottle:   exit 1

Haxolottle: fi

Haxolottle: ip_address=$1

Haxolottle: echo `date` >> $ip_address.open_ports

Haxolottle: for port in {1..65535}; do

Haxolottle:   timeout 1 echo > /dev/tcp/$ip_address/$port

Haxolottle:   if [ $? -eq 0 ]; then

Haxolottle:     echo "port $port is open" >> "$ip_address.open_ports"

Haxolottle:   fi

Haxolottle: done

+ [How does this work?]
    Haxolottle: The script takes one argument - the IP address to scan.

    Haxolottle: It loops through all 65,535 possible ports (this will take a very long time!).

    Haxolottle: For each port, it tries to connect using echo > /dev/tcp/$ip_address/$port

    Haxolottle: The timeout command ensures each attempt only waits 1 second.

    Haxolottle: The special variable $? contains the exit status of the last command - 0 for success, non-zero for failure.

    Haxolottle: If the connection succeeded ($? equals 0), we write that port number to the output file.

    ~ haxolottle_rapport += 5

+ [Why would I write this when Nmap exists?]
    Haxolottle: Great question! Writing your own tools teaches you how they work under the hood.

    Haxolottle: It helps you understand what's actually happening when you run Nmap.

    Haxolottle: In some restricted environments, you might not have Nmap available but can write bash scripts.

    Haxolottle: Plus, it's a good programming exercise! You could extend it to do banner grabbing, run it in parallel, or output in different formats.

    ~ haxolottle_rapport += 5

+ [How long will scanning all 65535 ports take?]
    Haxolottle: With a 1-second timeout per port, in the worst case it could take over 18 hours!

    Haxolottle: This is why professional scanners like Nmap are so much more sophisticated - they use parallel connections, adaptive timing, and send raw packets.

    Haxolottle: Your simple bash script is doing full TCP connect scans sequentially. Nmap can send hundreds of packets simultaneously.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== nmap_port_scanning ===
Haxolottle: Nmap supports dozens of different port scanning techniques. Let me cover the most important ones.

~ haxolottle_rapport += 5

Haxolottle: **SYN Scan (-sS):** The default and most popular scan. Sends SYN packets and looks for SYN-ACK responses. Fast and stealthy. Requires root.

Haxolottle: **Connect Scan (-sT):** Completes the full TCP handshake. Slower but doesn't require root privileges.

Haxolottle: **UDP Scan (-sU):** Scans UDP ports. Slower and less reliable because UDP is connectionless.

Haxolottle: **NULL, FIN, and Xmas Scans (-sN, -sF, -sX):** Send packets with unusual flag combinations to evade some firewalls. Don't work against Windows.

+ [Tell me more about SYN scans]
    Haxolottle: SYN scans are the default Nmap scan type for good reason.

    Haxolottle: They're fast because they don't complete the connection. They're relatively stealthy compared to connect scans.

    Haxolottle: However, modern intrusion detection systems will absolutely detect SYN scans - the "stealth" is relative.

    Haxolottle: Run a SYN scan with: sudo nmap -sS TARGET

    Haxolottle: You need sudo because sending raw SYN packets requires root privileges.

    ~ haxolottle_rapport += 5

+ [Why are UDP scans unreliable?]
    Haxolottle: UDP is connectionless - there's no handshake like TCP. You send a packet and hope for a response.

    Haxolottle: If a UDP port is open, the service might not respond at all. If it's closed, you might get an ICMP "port unreachable" message.

    Haxolottle: The lack of response is ambiguous - is the port open and ignoring you, or is it filtered by a firewall?

    Haxolottle: UDP scans are also slow because Nmap has to wait for timeouts: sudo nmap -sU TARGET

    Haxolottle: Despite these challenges, UDP scanning is important because many services run on UDP like DNS (port 53) and SNMP (port 161).

    ~ haxolottle_rapport += 5

+ [What are NULL, FIN, and Xmas scans?]
    Haxolottle: These send TCP packets with unusual flag combinations to try to evade simple firewalls.

    Haxolottle: NULL scan (-sN) sends packets with no flags set. FIN scan (-sF) sends packets with only the FIN flag. Xmas scan (-sX) sends FIN, PSH, and URG flags.

    Haxolottle: According to RFC 793, a closed port should respond with RST to these probes, while open ports should not respond.

    Haxolottle: However, Windows systems don't follow the RFC correctly, so these scans don't work against Windows targets.

    Haxolottle: They're less useful today since modern firewalls and IDS systems detect them easily.

    ~ haxolottle_rapport += 5

+ [How do I specify which ports to scan?]
    Haxolottle: Nmap has flexible port specification options.

    Haxolottle: By default, Nmap scans the 1000 most common ports. You can scan specific ports with -p:

    Haxolottle: nmap -p 80,443,8080 TARGET (specific ports)

    Haxolottle: nmap -p 1-1000 TARGET (port range)

    Haxolottle: nmap -p- TARGET (all 65535 ports)

    Haxolottle: nmap -F TARGET (fast scan - only 100 most common ports)

    Haxolottle: You can also use -r to scan ports in sequential order instead of random.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== service_identification ===
Haxolottle: Knowing which ports are open is useful, but knowing what services are running on those ports is essential for planning attacks or security assessments.

~ haxolottle_rapport += 5

Haxolottle: The simplest approach is banner grabbing - connecting to a port and checking if the service reveals what software it's running.

Haxolottle: Many services present a banner when you connect, often stating the software name and version.

+ [How do I manually grab banners?]
    Haxolottle: You can use netcat to connect and see what the service sends:

    Haxolottle: nc IP_ADDRESS 21

    Haxolottle: Port 21 (FTP) usually sends a banner immediately. Press Ctrl-C to disconnect.

    Haxolottle: For port 80 (HTTP), you need to send something first:

    Haxolottle: nc IP_ADDRESS 80

    Haxolottle: Then type a dot and press Enter a few times. Look for the "Server:" header in the response.

    ~ haxolottle_rapport += 5

+ [How can I automate banner grabbing?]
    Haxolottle: Netcat can grab banners across a range of ports:

    Haxolottle: nc IP_ADDRESS 1-2000 -w 1

    Haxolottle: This connects to ports 1 through 2000 with a 1-second timeout and displays any banners.

    Haxolottle: You could also update your bash port scanner script to read from each open port instead of just writing to it.

    ~ haxolottle_rapport += 5

+ [Can I trust banner information?]
    Haxolottle: Excellent critical thinking! No, you cannot trust banners completely.

    Haxolottle: Server administrators can configure services to report false version information to mislead attackers.

    Haxolottle: A web server claiming to be "Apache/2.4.1" might actually be nginx or a completely different version of Apache.

    Haxolottle: This is why we use protocol analysis and fingerprinting to verify what's actually running.

    ~ haxolottle_rapport += 5

+ [Tell me about protocol analysis]
    -> protocol_analysis

- -> scanning_hub

=== protocol_analysis ===
Haxolottle: Protocol analysis, also called fingerprinting, determines what software is running by analyzing how it responds to various requests.

~ haxolottle_rapport += 5

Haxolottle: Instead of trusting what the banner says, we send different kinds of requests (triggers) and compare the responses to a database of fingerprints.

Haxolottle: The software Amap pioneered this approach with two main features: banner grabbing (-B flag) and protocol analysis (-A flag).

+ [How do I use Amap?]
    Haxolottle: Amap is straightforward but somewhat outdated:

    Haxolottle: amap -A IP_ADDRESS 80

    Haxolottle: This performs protocol analysis on port 80, telling you what protocol is in use and what software is likely running.

    Haxolottle: However, Amap has been largely superseded by Nmap's service detection, which is more up-to-date and accurate.

    ~ haxolottle_rapport += 5

+ [How does Nmap's version detection work?]
    Haxolottle: Nmap's version detection is one of its most powerful features:

    Haxolottle: nmap -sV IP_ADDRESS

    Haxolottle: Nmap connects to each open port and sends various triggers, then analyzes the responses against a massive database of service signatures.

    Haxolottle: It can often identify not just the service type but the specific version number.

    Haxolottle: You can combine it with port specification: nmap -sV -p 80 IP_ADDRESS

    Haxolottle: Or scan all default ports with version detection: nmap -sV IP_ADDRESS

    ~ haxolottle_rapport += 5

+ [How accurate is version detection?]
    Haxolottle: Nmap's version detection is very accurate when services respond normally.

    Haxolottle: It maintains a database called nmap-service-probes with thousands of service signatures.

    Haxolottle: However, custom or heavily modified services might not match the database perfectly.

    Haxolottle: And determined administrators can still configure services to mislead fingerprinting, though it's more difficult than changing a banner.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== os_detection ===
Haxolottle: Operating system detection is another powerful Nmap capability that helps you understand your target.

~ haxolottle_rapport += 5

Haxolottle: Knowing the OS is important for choosing the right payload when launching exploits, and for understanding what vulnerabilities might be present.

Haxolottle: Nmap performs OS detection by analyzing subtle differences in how operating systems implement TCP/IP.

+ [How does OS fingerprinting work?]
    Haxolottle: The TCP/IP RFCs (specifications) contain some ambiguity - they're not 100% prescriptive about every implementation detail.

    Haxolottle: Each operating system makes slightly different choices in how it handles network packets.

    Haxolottle: Nmap sends specially crafted packets to both open and closed ports, then analyzes the responses.

    Haxolottle: It compares these responses to a database of OS fingerprints to make an educated guess about what's running.

    ~ haxolottle_rapport += 5

+ [How do I use OS detection?]
    Haxolottle: OS detection is simple to invoke:

    Haxolottle: sudo nmap -O IP_ADDRESS

    Haxolottle: You need sudo because OS detection requires sending raw packets.

    Haxolottle: Nmap will report its best guess about the operating system, often with a confidence percentage.

    Haxolottle: You can combine OS detection with version detection: sudo nmap -O -sV IP_ADDRESS

    ~ haxolottle_rapport += 5

+ [How accurate is OS detection?]
    Haxolottle: OS detection is usually quite accurate, especially for common operating systems.

    Haxolottle: However, it can be confused by firewalls, virtualization, or network devices that modify packets.

    Haxolottle: Nmap will report a confidence level and sometimes multiple possible matches.

    Haxolottle: Like version detection, OS detection can be deceived by administrators who configure their systems to report false information, though this is uncommon.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== nmap_timing ===
Haxolottle: Nmap's timing and performance options let you control the speed and stealth of your scans.

~ haxolottle_rapport += 5

Haxolottle: Nmap offers six timing templates from paranoid to insane:

Haxolottle: -T0 (paranoid): Extremely slow, sends one probe every 5 minutes. For IDS evasion.

Haxolottle: -T1 (sneaky): Very slow, sends one probe every 15 seconds.

Haxolottle: -T2 (polite): Slower, less bandwidth intensive. Won't overwhelm targets.

Haxolottle: -T3 (normal): The default. Balanced speed and reliability.

Haxolottle: -T4 (aggressive): Faster, assumes a fast and reliable network.

Haxolottle: -T5 (insane): Very fast, may miss open ports or overwhelm networks.

+ [When would I use paranoid or sneaky timing?]
    Haxolottle: These ultra-slow timing templates are for stealth - attempting to evade intrusion detection systems.

    Haxolottle: For example: nmap -T0 IP_ADDRESS

    Haxolottle: However, modern IDS systems will still detect these scans, they just take much longer.

    Haxolottle: These templates are rarely used in practice because they're so slow. A full scan could take days!

    Haxolottle: In authorized penetration tests, you usually don't need this level of stealth.

    ~ haxolottle_rapport += 5

+ [When should I use aggressive or insane timing?]
    Haxolottle: Aggressive (-T4) is good when scanning on fast, reliable networks where you want quicker results.

    Haxolottle: Insane (-T5) is for very fast networks when you want the absolute fastest scan: nmap -T5 IP_ADDRESS

    Haxolottle: However, be careful! Insane timing can miss open ports because it doesn't wait long enough for responses.

    Haxolottle: It can also overwhelm slow network links or trigger rate limiting, causing you to miss results.

    Haxolottle: Generally, stick with normal or aggressive timing unless you have a specific reason to change.

    ~ haxolottle_rapport += 5

+ [Can I customize timing beyond the templates?]
    Haxolottle: Yes! Nmap has many granular timing options like --max-retries, --host-timeout, --scan-delay, and more.

    Haxolottle: The templates are just convenient presets. You can read about all the timing options in the man page under "TIMING AND PERFORMANCE."

    Haxolottle: For most purposes, the templates are sufficient and easier to remember.

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== nmap_output ===
Haxolottle: Nmap's output options let you save scan results for later analysis, reporting, or importing into other tools.

~ haxolottle_rapport += 5

Haxolottle: Nmap supports several output formats:

Haxolottle: -oN filename (normal output): Saves output similar to what you see on screen.

Haxolottle: -oX filename (XML output): Saves structured XML, great for importing into other tools.

Haxolottle: -oG filename (grepable output): Simple columnar format, but deprecated.

Haxolottle: -oA basename (all formats): Saves all three formats with the same base filename.

+ [When should I use XML output?]
    Haxolottle: XML output is the most versatile format:

    Haxolottle: nmap -oX scan_results.xml IP_ADDRESS

    Haxolottle: XML can be imported into vulnerability scanners, reporting tools, and custom scripts.

    Haxolottle: Many security tools and frameworks can parse Nmap XML directly.

    Haxolottle: You can also transform XML with tools like xsltproc to create HTML reports or other formats.

    ~ haxolottle_rapport += 5

+ [What about Nmap GUIs?]
    Haxolottle: Nmap has several graphical interfaces, most notably Zenmap (the official GUI).

    Haxolottle: GUIs can help beginners construct commands and visualize results.

    Haxolottle: They're useful for saving scan profiles and comparing results from multiple scans.

    Haxolottle: However, most experts prefer the command line for speed, scriptability, and remote access via SSH.

    Haxolottle: Note that Kali Linux recently removed Zenmap because it was based on Python 2, but other alternatives exist.

    ~ haxolottle_rapport += 5

+ [Should I always save output?]
    Haxolottle: In professional penetration testing, absolutely! You need records of what you scanned and when.

    Haxolottle: Scan results are evidence for your reports and help you track progress.

    Haxolottle: They also protect you legally - if something goes wrong, you have proof of what you actually did.

    Haxolottle: Get in the habit of using -oA to save all formats: nmap -oA scan_results IP_ADDRESS

    ~ haxolottle_rapport += 5

- -> scanning_hub

=== commands_reference ===
Haxolottle: Let me provide a comprehensive commands reference for this lab.

~ haxolottle_rapport += 5

Haxolottle: **Basic Network Information:**

Haxolottle: Show IP addresses: ip a (or ifconfig on older systems)

Haxolottle: Show just the IPs: hostname -I

Haxolottle: **Ping Commands:**

Haxolottle: Basic ping: ping DESTINATION

Haxolottle: Limited count: ping -c 3 DESTINATION

Haxolottle: With timeout: ping -c 1 -W 1 DESTINATION

+ [Show me ping sweep script commands]
    Haxolottle: **Ping Sweep Script:**

    Haxolottle: Create script: vi pingsweep.sh

    Haxolottle: Make executable: chmod +x pingsweep.sh

    Haxolottle: Run script: ./pingsweep.sh 10.0.0

    Haxolottle: (Replace 10.0.0 with your network's first three octets)

    ~ haxolottle_rapport += 3

+ [Show me Nmap host discovery commands]
    Haxolottle: **Nmap Host Discovery:**

    Haxolottle: Ping sweep with echo request: nmap -sn -PE 10.0.0.1-254

    Haxolottle: Default host discovery: sudo nmap -sn 10.0.0.1-254

    Haxolottle: List scan (DNS only): nmap -sL 10.0.0.1-254

    ~ haxolottle_rapport += 3

+ [Show me port checking commands]
    Haxolottle: **Manual Port Checking:**

    Haxolottle: Using telnet: telnet IP_ADDRESS 80

    Haxolottle: Using netcat: nc IP_ADDRESS 80

    Haxolottle: Test TCP connection with bash: echo > /dev/tcp/IP_ADDRESS/PORT

    Haxolottle: Check last command status: echo $?

    Haxolottle: (0 = success, non-zero = failure)

    ~ haxolottle_rapport += 3

+ [Show me port scanner script commands]
    Haxolottle: **Port Scanner Script:**

    Haxolottle: Create script: vi portscanner.sh

    Haxolottle: Make executable: chmod +x portscanner.sh

    Haxolottle: Run script: ./portscanner.sh IP_ADDRESS

    Haxolottle: View results: less IP_ADDRESS.open_ports

    ~ haxolottle_rapport += 3

+ [Show me Nmap scanning commands]
    Haxolottle: **Nmap Port Scanning:**

    Haxolottle: Basic scan: nmap TARGET

    Haxolottle: SYN scan: sudo nmap -sS TARGET

    Haxolottle: Connect scan: nmap -sT TARGET

    Haxolottle: UDP scan: sudo nmap -sU TARGET

    Haxolottle: Specific ports: nmap -p 80,443 TARGET

    Haxolottle: Port range: nmap -p 1-1000 TARGET

    Haxolottle: All ports: nmap -p- TARGET

    Haxolottle: Fast scan: nmap -F TARGET

    ~ haxolottle_rapport += 3

+ [Show me service detection commands]
    Haxolottle: **Service Identification:**

    Haxolottle: Manual banner grab (FTP): nc IP_ADDRESS 21

    Haxolottle: Manual banner grab (HTTP): nc IP_ADDRESS 80 (then type . and press Enter)

    Haxolottle: Automated banner grab: nc IP_ADDRESS 1-2000 -w 1

    Haxolottle: Amap protocol analysis: amap -A IP_ADDRESS PORT

    Haxolottle: Nmap version detection: nmap -sV IP_ADDRESS

    Haxolottle: Version detection on specific port: nmap -sV -p 80 IP_ADDRESS

    ~ haxolottle_rapport += 3

+ [Show me OS detection and timing commands]
    Haxolottle: **OS Detection:**

    Haxolottle: OS detection: sudo nmap -O IP_ADDRESS

    Haxolottle: OS + version detection: sudo nmap -O -sV IP_ADDRESS

    Haxolottle: **Timing Templates:**

    Haxolottle: Paranoid: nmap -T0 TARGET

    Haxolottle: Sneaky: nmap -T1 TARGET

    Haxolottle: Polite: nmap -T2 TARGET

    Haxolottle: Normal (default): nmap -T3 TARGET

    Haxolottle: Aggressive: nmap -T4 TARGET

    Haxolottle: Insane: nmap -T5 TARGET

    ~ haxolottle_rapport += 3

+ [Show me output commands]
    Haxolottle: **Nmap Output:**

    Haxolottle: Normal output: nmap -oN filename TARGET

    Haxolottle: XML output: nmap -oX filename TARGET

    Haxolottle: Grepable output: nmap -oG filename TARGET

    Haxolottle: All formats: nmap -oA basename TARGET

    Haxolottle: View output file: less filename

    ~ haxolottle_rapport += 3

+ [Show me combined scan examples]
    Haxolottle: **Combined Scans:**

    Haxolottle: Fast aggressive scan with version detection:

    Haxolottle: nmap -T4 -F -sV IP_ADDRESS

    Haxolottle: Comprehensive scan all ports with OS and version detection:

    Haxolottle: sudo nmap -T4 -p- -O -sV -oA comprehensive_scan IP_ADDRESS

    Haxolottle: Stealth scan specific ports:

    Haxolottle: sudo nmap -T2 -sS -p 80,443,8080 IP_ADDRESS

    ~ haxolottle_rapport += 3

- -> scanning_hub

-> END
