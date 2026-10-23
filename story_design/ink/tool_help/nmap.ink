// ===========================================
// TOOL HELP: NMAP
// Break Escape Universe
// ===========================================
// Educational content about nmap and port scanning
// For use in training scenarios and missions
// ===========================================

=== nmap_help ===

Guide: nmap—Network Mapper—is the industry standard for network discovery and security auditing.

Guide: Think of it as a sophisticated radar for networks. It tells you what hosts are alive, what services they're running, and even what operating systems they use.

Guide: For a penetration tester, nmap is typically the first tool you reach for. You need to know what's out there before you can assess it.

+ [How do I scan for open ports?]
    -> nmap_basic_scan

+ [What are ports anyway?]
    -> nmap_ports_explained

+ [What scanning options does nmap have?]
    -> nmap_scan_types

+ [Show me practical examples]
    -> nmap_examples

+ [I understand now]
    -> nmap_end

// ----------------
// Ports explained
// ----------------

=== nmap_ports_explained ===

Guide: Good question. Let's establish the basics first.

Guide: Imagine a computer as a large building. The IP address is the street address, but the building has many doors—each numbered. Those doors are **ports**.

Guide: Each port can host a different service:
- Port 22: SSH (secure remote access)
- Port 80: HTTP (websites)
- Port 443: HTTPS (secure websites)
- Port 3389: RDP (Windows remote desktop)
- Port 3306: MySQL (database)

Guide: There are 65,535 possible ports (numbered 0-65535). Services can run on any port, but they typically use standard "well-known ports" for convenience.

Guide: When you scan for open ports, you're knocking on each door to see if someone answers. An "open" port means a service is listening and will respond. A "closed" port refuses connection. A "filtered" port is blocked by a firewall.

* [How do I scan these ports with nmap?]
    -> nmap_basic_scan

* [What scan types are available?]
    -> nmap_scan_types

* [Show me examples]
    -> nmap_examples

// ----------------
// Basic scanning
// ----------------

=== nmap_basic_scan ===

Guide: The basic syntax is simple: `nmap [target]`

Guide: For example:
`nmap 192.168.1.1`

Guide: This performs a default scan of the 1,000 most common ports on that IP address. It's quick but not comprehensive.

Guide: **Common useful flags:**

Guide: `-p` specifies ports:
- `nmap -p 80,443 192.168.1.1` (scan specific ports)
- `nmap -p 1-65535 192.168.1.1` (scan all ports)
- `nmap -p- 192.168.1.1` (shorthand for all ports)

Guide: `-sV` detects service versions:
`nmap -sV 192.168.1.1` tells you not just that port 80 is open, but that it's running Apache 2.4.41

Guide: `-O` attempts OS detection:
`nmap -O 192.168.1.1` tries to identify what operating system the target is running

Guide: `-A` enables aggressive scanning (OS detection, version detection, script scanning):
`nmap -A 192.168.1.1` gives you comprehensive information

* [What are the different scan types?]
    -> nmap_scan_types

* [Show me more examples]
    -> nmap_examples

* [Explain ports again]
    -> nmap_ports_explained

* [I'm ready to practice]
    -> nmap_end

// ----------------
// Scan types
// ----------------

=== nmap_scan_types ===

Guide: nmap offers different scan types for different situations:

Guide: **TCP Connect Scan** (`-sT`):
The default if you're not root. Completes full TCP handshake. Reliable but noisy—easy to detect and log.

Guide: **SYN Scan** (`-sS`):
The "stealth scan"—sends SYN packets but doesn't complete the handshake. Faster and less detectable. Requires root privileges. This is the default if you run nmap as root.

Guide: **UDP Scan** (`-sU`):
Scans UDP ports instead of TCP. Slower and less reliable, but important because many services use UDP (DNS, SNMP, DHCP).
Example: `nmap -sU 192.168.1.1`

Guide: **Version Detection** (`-sV`):
Not just "port 80 is open" but "Apache httpd 2.4.41 is running on port 80". Crucial for identifying vulnerabilities.

Guide: **Aggressive Scan** (`-A`):
Enables OS detection, version detection, script scanning, and traceroute. Comprehensive but very noisy.

Guide: **Timing** (`-T0` through `-T5`):
Controls scan speed. `-T0` (paranoid) is extremely slow and stealthy. `-T4` (aggressive) is fast but noisy. `-T3` (normal) is the default.

* [Show me practical examples]
    -> nmap_examples

* [How do I scan for open ports?]
    -> nmap_basic_scan

* [What are ports again?]
    -> nmap_ports_explained

* [I understand now]
    -> nmap_end

// ----------------
// Practical examples
// ----------------

=== nmap_examples ===

Guide: Let's walk through practical scenarios:

Guide: **Scenario 1: Quick network check**
`nmap 192.168.1.0/24`
Scans all 256 addresses in your local network to see what's alive and what common ports are open.

Guide: **Scenario 2: Thorough single host scan**
`nmap -sV -sC -O -p- 192.168.1.50`
Scans all 65,535 ports, detects service versions, runs default scripts, and attempts OS detection. Takes longer but gives comprehensive results.

Guide: **Scenario 3: Stealth scan of web services**
`nmap -sS -p 80,443 -T2 192.168.1.50`
SYN scan of web ports with slower timing to avoid detection.

Guide: **Scenario 4: Quick vulnerability check**
`nmap -sV --script vuln 192.168.1.50`
Runs vulnerability detection scripts against identified services.

Guide: **Scenario 5: Check specific service**
`nmap -p 22 --script ssh-brute 192.168.1.50`
Scans port 22 and runs SSH-specific scripts.

Guide: **Reading the output:**
```
PORT     STATE  SERVICE  VERSION
22/tcp   open   ssh      OpenSSH 7.9
80/tcp   open   http     Apache httpd 2.4.41
3306/tcp closed mysql
8080/tcp filtered http-proxy
```

Guide: - **open**: Service is listening and accepting connections
- **closed**: Port is accessible but no service is listening
- **filtered**: Firewall or filter is blocking access

* [Tell me about scan types]
    -> nmap_scan_types

* [Explain the basics again]
    -> nmap_basic_scan

* [What are ports?]
    -> nmap_ports_explained

* [I'm ready to use nmap]
    -> nmap_end

// ----------------
// End
// ----------------

=== nmap_end ===

Guide: Remember: nmap is powerful, but scanning networks you don't own or have permission to test is illegal.

Guide: Always get written authorization before scanning. "I thought it was okay" is not a legal defense.

Guide: Use nmap responsibly. It's a professional tool that requires professional ethics.

-> END
