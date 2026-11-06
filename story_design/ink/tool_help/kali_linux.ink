// ===========================================
// TOOL HELP: KALI LINUX
// Break Escape Universe
// ===========================================
// Educational content about Kali Linux
// For use in training scenarios and missions
// ===========================================

=== kali_linux_help ===

Guide: Kali Linux is a specialized Debian-based Linux distribution designed for penetration testing and security auditing.

Guide: Think of it as a Swiss Army knife for security professionals—it comes pre-loaded with hundreds of security tools, all configured and ready to use.

+ [What makes Kali special?]
    -> kali_special

+ [What tools does it include?]
    -> kali_tools

+ [How do I get started with Kali?]
    -> kali_getting_started

+ [I understand now]
    -> kali_end

// ----------------
// What makes Kali special
// ----------------

=== kali_special ===

Guide: Several things set Kali apart from regular Linux distributions:

Guide: First, it's purpose-built. Every tool, every default setting, every package is chosen for security testing. You don't need to spend days installing and configuring tools.

Guide: Second, it's actively maintained by Offensive Security, the company behind the OSCP certification. They keep the tools updated and ensure everything works together.

Guide: Third, it's flexible. You can run it from a USB drive without installing anything, run it in a virtual machine, or install it as your main operating system.

Guide: Fourth, it's documented extensively. Almost every tool has built-in help, and the Kali documentation is comprehensive.

* [Tell me about the tools available]
    -> kali_tools

* [How do I start using it?]
    -> kali_getting_started

* [I'm ready to move on]
    -> kali_end

// ----------------
// Tools included
// ----------------

=== kali_tools ===

Guide: Kali includes over 600 penetration testing tools, organized by category:

Guide: **Information Gathering**: Tools like nmap, Recon-ng, and theHarvester for reconnaissance and mapping networks.

Guide: **Vulnerability Analysis**: Scanners like nikto, OpenVAS, and sqlmap that identify weaknesses in systems.

Guide: **Exploitation**: Metasploit Framework, exploit-db, and other tools for testing discovered vulnerabilities.

Guide: **Password Attacks**: John the Ripper, Hashcat, and Hydra for password testing and recovery.

Guide: **Wireless Attacks**: Aircrack-ng suite for testing wireless network security.

Guide: **Forensics**: Tools for investigating compromised systems and analyzing evidence.

Guide: The beauty is that these tools work together. You might use nmap to find open ports, nikto to scan a web server, and Metasploit to test a vulnerability.

* [How do I get started with Kali?]
    -> kali_getting_started

* [Tell me more about what makes it special]
    -> kali_special

* [That's helpful, thanks]
    -> kali_end

// ----------------
// Getting started
// ----------------

=== kali_getting_started ===

Guide: Getting started with Kali is straightforward:

Guide: **Option 1: Virtual Machine** (Recommended for beginners)
Download a Kali VM image from kali.org and run it in VirtualBox or VMware. Safe, isolated, and easy to snapshot if something breaks.

Guide: **Option 2: Live Boot**
Create a bootable USB drive with Kali. You can boot any computer into Kali without installing anything. Great for portability.

Guide: **Option 3: Full Installation**
Install Kali as your main operating system. Most flexible, but requires dedicating a machine to it.

Guide: Once you're in Kali, start with the basics:
- Update your system: `sudo apt update && sudo apt upgrade`
- Explore the Applications menu to see available tools
- Read the documentation at docs.kali.org
- Start with simple tools like nmap before moving to complex frameworks

Guide: Remember: Kali is powerful. Only use it on systems you own or have explicit permission to test. Unauthorized access is illegal.

* [Tell me about specific tools]
    -> kali_tools

* [What makes Kali different from other Linux?]
    -> kali_special

* [I'm ready to start practicing]
    -> kali_end

// ----------------
// End
// ----------------

=== kali_end ===

Guide: Good luck with Kali. Remember: these tools are powerful. Use them responsibly, ethically, and only with proper authorization.

Guide: The security community values ethical behavior. Keep it legal, keep it authorized, and keep learning.

-> END
