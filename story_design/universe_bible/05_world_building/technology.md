# Technology in Break Escape

## Overview

Break Escape exists in contemporary 2025, where cyber security tools, techniques, and threats are grounded in reality. This document establishes what technology exists, what's bleeding edge, what's impossible, and how we portray technical elements accurately while maintaining engaging gameplay.

---

## Technology Philosophy

### Core Principle: Authenticity Over Convenience

**Break Escape is educational.** Every tool, technique, and technology should:
- Exist in real world or be plausible extrapolation
- Function as it would actually work
- Use correct terminology
- Respect real limitations
- Teach genuine security concepts

**Hollywood Hacking is BANNED:**
- No "I'm in" without explanation
- No typing fast to breach systems
- No magical GUIs that do impossible things
- No technobabble that means nothing
- No instant compromise of secure systems

---

## Current Technology (2025)

### Cyber Security Tools

**Tools Players Use (All Real):**

#### CyberChef
- **What It Is:** Browser-based encryption/encoding/analysis tool
- **Real Use:** Decoding, decrypting, analyzing data
- **In Game:** Primary tool for cryptographic puzzles
- **Accuracy:** 100% accurate representation
- **Where:** https://gchq.github.io/CyberChef/

#### Nmap
- **What It Is:** Network scanning and reconnaissance tool
- **Real Use:** Port scanning, service detection, OS fingerprinting
- **In Game:** Discovering network services, identifying vulnerabilities
- **Accuracy:** Simplified but accurate output format
- **Limitations:** Takes time, can be detected by IDS

#### Wireshark
- **What It Is:** Network protocol analyzer
- **Real Use:** Packet capture and analysis
- **In Game:** Analyzing network traffic, extracting credentials
- **Accuracy:** Simplified capture displays
- **Limitations:** Must be on network, encrypted traffic is opaque

#### Metasploit
- **What It Is:** Penetration testing framework
- **Real Use:** Exploiting known vulnerabilities
- **In Game:** Compromising vulnerable systems
- **Accuracy:** Real exploits against real vulnerabilities
- **Limitations:** Requires correct target, doesn't work on patched systems

#### Burp Suite
- **What It Is:** Web application security testing tool
- **Real Use:** Intercepting web traffic, finding web vulnerabilities
- **In Game:** Testing web applications, finding injection points
- **Accuracy:** Core functionality accurately represented
- **Limitations:** Requires setup, doesn't find all vulnerabilities automatically

#### Hashcat / John the Ripper
- **What It Is:** Password cracking tools
- **Real Use:** Breaking weak passwords through brute force/dictionary attacks
- **In Game:** Cracking captured password hashes
- **Accuracy:** Time requirements simplified but concept accurate
- **Limitations:** Strong passwords resist cracking

#### SQLmap
- **What It Is:** Automated SQL injection tool
- **Real Use:** Exploiting SQL injection vulnerabilities
- **In Game:** Compromising databases through web applications
- **Accuracy:** Accurate representation of SQL injection
- **Limitations:** Only works on vulnerable applications

### Physical Security Tools

**Tools Players Use:**

#### Lockpicks
- **What It Is:** Physical lock manipulation tools
- **Real Use:** Non-destructive lock bypass
- **In Game:** Opening physical locks on doors, cabinets, safes
- **Accuracy:** Simplified picking mechanics
- **Limitations:** Some locks resist picking, takes time, can be heard

#### Fingerprint Dusting Kit
- **What It Is:** Forensic tools for lifting fingerprints
- **Real Use:** Crime scene investigation
- **In Game:** Collecting fingerprints to bypass biometric security
- **Accuracy:** Process simplified but conceptually accurate
- **Limitations:** Requires clean prints, not all surfaces work

#### RFID Cloner
- **What It Is:** Device that copies RFID badges
- **Real Use:** Cloning access cards
- **In Game:** Duplicating employee badges for access
- **Accuracy:** Accurate for vulnerable RFID systems
- **Limitations:** Encrypted cards resist cloning

#### Bluetooth Scanner
- **What It Is:** Device that detects and analyzes Bluetooth devices
- **Real Use:** Finding nearby Bluetooth devices, testing security
- **In Game:** Discovering vulnerable devices, exploiting Bluetooth
- **Accuracy:** Accurate detection and attack vectors
- **Limitations:** Range limited, requires device to be discoverable

#### USB Rubber Ducky
- **What It Is:** Keystroke injection tool disguised as USB drive
- **Real Use:** Automated script execution on target computer
- **In Game:** Running payloads on unlocked computers
- **Accuracy:** Accurate representation of HID attacks
- **Limitations:** Requires physical access, can be detected

### Social Engineering Tools

#### Pretexting Scripts
- **What It Is:** Pre-planned social engineering scenarios
- **Real Use:** Manipulating people into revealing information
- **In Game:** Dialog choices, NPC manipulation
- **Accuracy:** Realistic social engineering techniques
- **Limitations:** NPCs have varying resistance, suspicious behavior triggers alerts

#### Phishing Emails
- **What It Is:** Deceptive emails designed to steal credentials
- **Real Use:** Most common attack vector in real world
- **In Game:** Crafting convincing emails to trick employees
- **Accuracy:** Real phishing techniques and indicators
- **Limitations:** Spam filters, security training, user awareness

### Encryption & Cryptography

**Standards Used (All Real):**

#### AES (Advanced Encryption Standard)
- **Status:** Current standard
- **In Game:** Encrypted files, secure communications
- **Accuracy:** Unbreakable with current technology (when properly implemented)
- **Attacks:** Weak keys, poor implementation, side-channel attacks

#### RSA
- **Status:** Widely used asymmetric encryption
- **In Game:** Public/private key cryptography
- **Accuracy:** Mathematically accurate
- **Attacks:** Weak key generation, factorization attacks on small keys

#### MD5 / SHA-1 / SHA-256
- **Status:** Hash algorithms (MD5/SHA-1 deprecated, SHA-256 current)
- **In Game:** Password hashing, file integrity
- **Accuracy:** Accurate collision resistance (or lack thereof for MD5)
- **Usage:** Show evolution from weak (MD5) to strong (SHA-256)

#### Base64
- **Status:** Encoding (NOT encryption)
- **In Game:** Obfuscating data, encoding credentials
- **Accuracy:** Reversible encoding, not security
- **Common Misconception:** Players learn it's not encryption

#### Caesar Cipher / Substitution Ciphers
- **Status:** Historical, weak, educational
- **In Game:** Early scenario puzzles, ENTROPY's amateur operatives
- **Accuracy:** Easily breakable, teaches cryptanalysis
- **Usage:** Demonstrates why weak crypto fails

### Network Security

**Technologies Players Encounter:**

#### Firewalls
- **What It Is:** Network traffic filtering
- **Real Use:** Blocking unauthorized access
- **In Game:** Obstacles requiring bypass, indicators of security
- **Accuracy:** Real firewall rules and bypass techniques
- **Bypass Methods:** Misconfiguration, port forwarding, tunneling

#### VPNs (Virtual Private Networks)
- **What It Is:** Encrypted network connections
- **Real Use:** Secure remote access
- **In Game:** ENTROPY operatives using VPNs, SAFETYNET secure comms
- **Accuracy:** Accurate usage and limitations
- **Attacks:** Misconfigured VPNs, credential theft, zero-days

#### IDS/IPS (Intrusion Detection/Prevention Systems)
- **What It Is:** Security monitoring systems
- **Real Use:** Detecting malicious activity
- **In Game:** Detection risk during hacking, stealth challenges
- **Accuracy:** Real detection signatures and evasion techniques
- **Gameplay:** Players must avoid detection or accept consequences

#### Wi-Fi Security (WEP, WPA, WPA2, WPA3)
- **What It Is:** Wireless network encryption
- **Real Use:** Protecting wireless networks
- **In Game:** Weak Wi-Fi as entry point, password discovery
- **Accuracy:** Real attacks (WEP cracking, WPA handshake capture)
- **Progression:** Show evolution from weak (WEP) to strong (WPA3)

### Operating Systems & Software

**Realistic Representation:**

#### Linux
- **In Game:** SAFETYNET agents use Linux for security tools
- **Accuracy:** Real distributions (Kali Linux for pen testing)
- **Commands:** Actual command-line operations
- **Philosophy:** Professional security work uses Linux

#### Windows
- **In Game:** Corporate environments, targets
- **Accuracy:** Real vulnerabilities, Active Directory, PowerShell
- **Attacks:** Legitimate Windows exploit techniques
- **Patches:** Windows Update as defensive measure

#### macOS
- **In Game:** Creative industries, executive offices
- **Accuracy:** Real security features and vulnerabilities
- **Reality Check:** Not immune to attacks despite reputation

---

## Bleeding Edge Technology

### What's Emerging (2025)

#### Quantum Computing
- **Status:** Research phase, limited practical deployment
- **Capabilities:** Specific mathematical operations, not general computing
- **In Game:** Quantum Cabal experiments, theoretical threats to encryption
- **Accuracy:** Real concerns about post-quantum cryptography
- **Limitations:** Not magic, doesn't break all encryption instantly
- **Design Use:** Atmospheric threat, mysterious experiments

**Real Capabilities:**
- Shor's algorithm threatens RSA (theoretically)
- Grover's algorithm speeds certain searches
- Error correction still major challenge
- Practical "quantum supremacy" limited

**NOT Capable Of:**
- Breaking AES-256 (resistant to quantum attacks)
- Instant decryption of everything
- "Reality manipulation" (this is Quantum Cabal mythology)
- Time travel or sci-fi impossibilities

#### Advanced AI
- **Status:** Sophisticated but not sentient
- **Capabilities:** Pattern recognition, natural language processing, some automation
- **In Game:** Social engineering assistance, data analysis, chatbots
- **Accuracy:** Current AI limitations respected
- **Limitations:** Narrow intelligence, requires training data, can be fooled

**Real Capabilities (2025):**
- GPT-style language models for text generation
- Image recognition and generation
- Deepfakes (video/audio manipulation)
- Automated vulnerability scanning
- Predictive analytics

**NOT Capable Of:**
- True sentience or consciousness
- Genuine creativity or understanding
- Impossible problem-solving
- Self-improvement beyond design
- Replacing human expertise entirely

#### Zero-Day Exploits
- **Status:** Real and valuable
- **Definition:** Vulnerabilities unknown to vendors
- **In Game:** ENTROPY's advanced attacks, player discovery
- **Accuracy:** Valuable, difficult to find, eventually patched
- **Economics:** Black market, responsible disclosure, nation-state use

**Design Usage:**
- High-level ENTROPY cells use zero-days
- Player discovers and reports vulnerabilities
- Realistic discovery process (fuzzing, code review)
- Patches render them useless eventually

#### Biometric Security
- **Status:** Increasingly common
- **Types:** Fingerprint, facial recognition, iris scanning
- **In Game:** Physical security, device unlocking
- **Accuracy:** Real bypass methods (spoofing, duplication)
- **Limitations:** False positives, can be fooled with effort

**Real Attacks:**
- Fingerprint lifting and reproduction
- Photo-based facial recognition fooling
- Biometric data theft from databases
- Multi-factor as mitigation

#### IoT (Internet of Things) Security
- **Status:** Widespread and often insecure
- **In Game:** Smart devices as entry points
- **Accuracy:** Real vulnerabilities (default passwords, unpatched)
- **Attacks:** Compromising smart cameras, thermostats, locks
- **Reality:** One of weakest security areas currently

---

## What's NOT Possible

### Forbidden Technologies

#### Instant Hacking
**FORBIDDEN:**
- Typing fast to break security
- One-click system compromise
- Magical "hacking programs" that do everything
- Instant password cracking on strong passwords

**REALITY:**
- Exploits require correct vulnerabilities
- Cracking takes time (minutes to centuries)
- Strong passwords resist brute force
- Patched systems are harder to compromise

#### Impossible AI
**FORBIDDEN:**
- Sentient AI with consciousness
- AI that solves impossible problems
- Self-aware systems
- AI that breaks encryption instantly
- Perfect social engineering AI

**REALITY:**
- AI is sophisticated pattern matching
- Requires training data and design
- Narrow intelligence only
- Can be fooled with adversarial inputs
- Human expertise still essential

#### Magic Disguised as Tech
**FORBIDDEN:**
- "Quantum" anything that's actually magic
- Telepathy via brain implants
- Teleportation
- Time manipulation
- Reality-bending technology (except Quantum Cabal ambiguity)

**EXCEPTION:**
Quantum Cabal scenarios deliberately maintain ambiguity about whether supernatural elements are real or psychological operations. This is INTENTIONAL and the ONLY exception.

#### GUI Hacking Nonsense
**FORBIDDEN:**
- 3D file system visualization
- Hacking by clicking through mazes
- "Mainframe" that doesn't make sense
- Typing random code that magically works
- Visual hacking interfaces from movies

**REALITY:**
- Command-line for many security tools
- Web-based tools (CyberChef, Burp Suite)
- Text-based output and logs
- Real tool interfaces or simplified versions

#### Instant Decryption
**FORBIDDEN:**
- Breaking AES-256 in seconds
- Cracking strong passwords instantly
- Magic decryption tools
- "Backdoors" in strong encryption standards

**REALITY:**
- Strong encryption is mathematically sound
- Attacks target implementation, not algorithm
- Weak keys, poor passwords, side channels
- Quantum computing threatens specific algorithms only

---

## How Technology Is Portrayed

### Accuracy Requirements

#### Tier 1: Perfect Accuracy (Educational Core)
**Elements that MUST be 100% accurate:**
- Encryption algorithms and how they work
- Attack vectors and exploit methods
- Security vulnerabilities and patches
- Tool functionality and output
- Cryptographic concepts

**Why:** These are learning objectives. Inaccuracy defeats educational purpose.

#### Tier 2: Simplified but Correct (Gameplay)
**Elements that can be simplified but must be conceptually correct:**
- Time requirements (cracking passwords faster than reality for gameplay)
- Tool interfaces (simplified UI but correct functionality)
- Network complexity (fewer nodes but accurate concepts)
- Social engineering (streamlined conversations but real techniques)

**Why:** Perfect simulation would be tedious, but concepts must be accurate.

#### Tier 3: Stylized Representation (Atmosphere)
**Elements that can be stylized for game feel:**
- Visual design (pixel art aesthetic)
- Sound design (satisfying feedback)
- UI elements (game-appropriate menus)
- Character designs (stylized sprites)

**Why:** Game needs to be engaging and visually appealing.

### Showing Technology Correctly

#### Tool Usage
**Correct:**
- Show command syntax (even if simplified)
- Display realistic output
- Demonstrate actual flags and options
- Explain what tool does

**Incorrect:**
- Magic "hack" button
- Nonsensical output
- Impossible capabilities
- Unexplained success

#### Terminology
**Use Real Terms:**
- Exploit, not "hack code"
- Vulnerability, not "security hole"
- Payload, not "virus file"
- Social engineering, not "tricking people"
- Privilege escalation, not "getting admin"

#### Error Messages
**Show Real Errors:**
- Permission denied
- Connection refused
- Timeout errors
- Invalid syntax
- Authentication failed

**Why:** Teaches troubleshooting and realistic expectations.

### Teaching Through Technology

#### Progressive Complexity
**Early Scenarios:**
- Basic tools (CyberChef, simple encoding)
- Clear instructions
- Obvious vulnerabilities
- Guided exploitation

**Mid Scenarios:**
- Combined tools (Nmap + Metasploit)
- Less guidance
- Realistic vulnerabilities
- Multiple steps

**Advanced Scenarios:**
- Tool choice left to player
- Minimal guidance
- Complex exploit chains
- Creative solutions required

#### Explaining Technology

**Show, Don't Tell:**
- Demonstrate tool usage through gameplay
- Let players discover capabilities
- Provide in-game documentation
- Learn through doing

**Context Matters:**
- Explain WHY security measure exists
- Show consequences of vulnerabilities
- Demonstrate defense-in-depth
- Illustrate attacker methodology

---

## Technology Timeline (In-Universe)

### Past (Pre-Game)
- Traditional cyber security established
- SAFETYNET and ENTROPY founded
- Early operations focused on basic attacks
- Standard security tools and practices

### Present (2025 - Game Setting)
- Modern cyber security tools standard
- Zero-day exploits valuable commodity
- Quantum computing in research phase
- AI-assisted attacks emerging
- IoT security major vulnerability
- Cloud infrastructure prevalent

### Near Future (Potential)
- Post-quantum cryptography adoption
- Improved AI security tools
- Better IoT security (hopefully)
- Ongoing cat-and-mouse game
- New attack surfaces emerging

---

## Technology Checklist

Before including any technology in a scenario:

- [ ] Does it exist in 2025?
- [ ] Can it be explained realistically?
- [ ] Would security professionals accept this?
- [ ] Does it serve educational purpose?
- [ ] Is terminology correct?
- [ ] Are limitations shown accurately?
- [ ] Does it respect what's forbidden?
- [ ] Is it fun AND accurate?

---

## Resources for Accuracy

### Tools to Reference
- CyberChef: https://gchq.github.io/CyberChef/
- Kali Linux tool documentation
- OWASP Top 10 vulnerabilities
- CVE database for real vulnerabilities
- MITRE ATT&CK framework for techniques

### Consultation
- Real penetration testers
- Security researchers
- CTF (Capture The Flag) challenges
- Security conference talks
- Professional security literature

---

**Version:** 1.0
**Last Updated:** November 2025
**Maintained by:** Break Escape Design Team
