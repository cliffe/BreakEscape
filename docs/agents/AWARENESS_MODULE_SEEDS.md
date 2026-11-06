# Awareness course: module seeds

Starting points for each module writer, from the orchestrator's planning. Read `AWARENESS_COURSE_BRIEF.md` first. These seeds are suggestions: keep what works, change what doesn't, and say why in your report. Scope and boundaries are firmer than the game ideas.

Facts marked **verify** must be checked against a primary source before they go into `concepts.md`.

---

## core_00_first_day: First Day

- **Audience and length:** all staff; 10 minutes; no micro-drill; MVP; size M.
- **Scope:** how the course and the game work (controls, phone, inventory, intranet); the cast; why security matters in one minute (most attackers are criminals after money; everyone has access to something worth stealing; most attacks start with a message, a call or a stolen password); the motto *Pause. Check. Report.*; where and how to report at the organisation; "no blame"; what the security team does.
- **Boundaries:** don't teach phishing (core_01) or passwords (core_03) beyond a light preview.
- **Seed:** the player arrives on their first morning. Maureen at reception signs them in and explains the badge (wear it inside, hide it outside, never lend it). Precious shows them round. Owain hands over the laptop: a gentle tutorial of setting a three-random-words passphrase in the password manager and approving their first MFA prompt (preview of core_03). Ama introduces the security team, the Report button and the motto, and admits she once fell for a phish. First tiny test at the desk: a "welcome to Larkspur, confirm your bank details for payroll" email from a lookalike HR address: report it; Kai thanks them in chat. Tour The Lark (intranet). Ends with a map of the course.
- **Reuse:** `room_reception`, `room_office`, `room_IT`; `phone-chat`, `person-chat`. The existing controls tutorial (`systems/tutorial-manager.js`) and title screen are fixed and say "Welcome to Hacktivity Games!", so this module depends on BE-20 (authorable tutorial and title screen).
- **Features:** BE-20, BE-09, BE-05, BE-19, EX-01, EX-04, MG-01 (one email), MG-07 and MG-08 (light), MG-20 (four questions on the motto and the reporting route).

## core_02_social_engineering_beyond_email: The Caller

- **Audience and length:** all staff; 18 minutes; micro 4; P2; size M.
- **Scope:** phone calls (vishing), texts (smishing), messaging apps ("Hi, it's me, new number"), QR codes (quishing: stickers, posters, letters, emails), people at the door with a story (pretexting), requests for MFA codes or remote access, tech support scams; the levers (authority, urgency, fear, helpfulness, flattery, insider jargon); the defence: hang up and call back on a number you already have, never share codes, never install remote-access software because a caller asked. UK: 7726 for scam texts, 159 for calls claiming to be your bank (**verify** 159 is still live and which banks), Report Fraud.
- **Boundaries:** email phishing is core_01; building access and tailgating are core_10 (here the person at the door is about the conversation); deepfake voice is core_15 (here, ordinary calls); verifying callers as a job is role_03 and role_06.
- **Seed:** the player covers the Operations phone line for a morning while the team is at a meeting (work task: log delivery queries from schools). Calls arrive (MG-04): a genuine school business manager; "Owain from IT" asking the player to read out an MFA code and install a support tool (but Owain is in the kitchen); "Northbeck accounts" chasing a payment; an SMS from a parcel firm; a chat message from "Gillian" on a new number asking for a quick favour. A QR sticker on the coffee machine ("scan to join the free coffee club"). A friendly visitor at the side door "from the printer company". Ama gives the player a **social engineer bingo card** of tactics to tick off as they hear them: a light, fun learning aid that becomes a debrief score. Attacker view: Jo Fairweather plays the recording of her authorised test call to reception last year, and Maureen explains how she caught her.
- **Reuse:** `phone-chat`, `person-chat`; `docs/NPC_INFLUENCE.md` for pressure; `scenarios/test-phone-terminal`.
- **Features:** MG-04, MG-05, MG-06, BE-18, EX-06, BE-10 (the bingo card could be a simple overlay; propose if needed).

## core_03_passwords_and_mfa: Keys to the Kingdom

- **Audience and length:** all staff; 15 minutes; micro 4; MVP; size M.
- **Scope:** how passwords get stolen (phishing, reuse and credential stuffing, guessing, breaches); NCSC advice: three random words, length over complexity, no forced regular changes (**verify** current NCSC password guidance wording); password managers (including the browser's, where policy allows); a unique password for email above all; MFA types (authenticator app with number matching, SMS as better than nothing, passkeys and security keys as phishing-resistant); MFA fatigue (prompt bombing); never share passwords or codes; account recovery questions (made-up answers kept in the manager); checking whether an address appears in known breaches; shared accounts; sticky notes.
- **Boundaries:** fake sign-in pages are core_01; what to do after a compromise is core_04 (link to it); service desk resets are role_03.
- **Seed:** Owain tells the player that their personal email appeared in an old breach and someone has just tried that password on Larkspur's portal (blocked by MFA). Tasks: set up the password manager and build a passphrase with a meter showing how long it would take to guess (MG-08); move their email to a unique password; enrol MFA (MG-07). Then a time skip to 02:13: the phone buzzes with prompt after prompt (MG-07 prompt storm), followed by a chat message from "IT" asking them to accept to make it stop (modelled on the Uber 2022 case: **verify**). Deny and report. Escape-room section: Kev's warehouse office has passwords on sticky notes under keyboards; the player needs a file from a shared PC. Use the sticky-note password, or ask Kev or Owain? (An ethical decision: the right one is to ask.) Then help Kev set up a manager. Optional attacker view: a "guessing rig" display showing common passwords falling in seconds and a passphrase holding out, with no technical how-to.
- **Reuse:** `password`, `pin`, `container`, `notes` minigames; `room_IT`, a warehouse office (new or `small_office_room*`).
- **Features:** MG-07, MG-08, BE-16, BE-18, EX-01, BE-08.

## core_04_spotting_and_reporting_incidents: The Golden Hour

- **Audience and length:** all staff; 15 minutes; micro 3; MVP; size M.
- **Scope:** what counts as an incident (anything that might hurt the confidentiality, integrity or availability of information or systems, including near misses and mistakes); signs (unexpected MFA prompts, password reset emails you didn't ask for, sent items you didn't send, contacts receiving odd emails, new inbox rules, security software alerts, files renamed or unreadable, a ransom note, a lost device, data sent to the wrong person, an unknown person in a secure area); how to report and what to include (what, when, where, who, what you did); speed matters; don't investigate or fix it yourself; don't delete evidence; follow instructions about leaving devices on; no blame; reporting a colleague's mistake kindly; what happens after a report; personal data breaches go to the DPO (the organisation's 72-hour ICO clock; core_05).
- **Boundaries:** recognising phishing is core_01; malware detail is core_07; data protection law is core_05.
- **Seed:** a normal afternoon at Larkspur with five or six odd things the player might notice: Leo's account sending strange emails; a laptop gone from a meeting room; an MFA prompt the player didn't trigger; a colleague's screen showing "your files are encrypted"; Martin realising he emailed a customer spreadsheet to the wrong person; a stranger in the comms room corridor. The core mechanic is a **blast radius**: an office map (or the network map) where each incident spreads with game time until someone reports it, so the player sees why minutes matter. Reporting uses MG-09, which scores completeness and speed. Kai's behind-the-scenes view shows what each report let the team do ("reported in 4 minutes, contained in 20"). The colleague who reports their own mistake is thanked publicly.
- **Reuse:** `network-segmentation-map`, `siem`, `log-filter`, `ransomware-display` (seen, not played); `room_security`; event-triggered conversations.
- **Features:** MG-09, BE-16, BE-18, EX-05, BE-01, BE-02.

## core_05_data_protection_and_privacy: Personal Effects

- **Audience and length:** all staff; 18 minutes; micro 4; MVP; size M.
- **Scope (UK GDPR for staff, not lawyers):** what personal data is; special category data and criminal offence data; the principles in plain English; individuals' rights and recognising a request (a subject access request can arrive in any form, to anyone; pass it to the DPO at once; one month to respond); personal data breaches (definition; report at once; the organisation decides on notifying the ICO within 72 hours where there's a risk); sharing on a need-to-know basis and checking identity; requests from police or other bodies go to the DPO; retention; the ICO's role. **Verify** the effect of the Data (Use and Access) Act 2025 on anything you say about subject access requests and complaints, and keep legal detail light.
- **Boundaries:** classification, sending and disposal mechanics are core_06; HR data is role_05.
- **Seed:** the player covers Customer Services for a day. A school asks for a child's records (verify who is asking and why). A care home resident's son emails: "send me everything you've got on Mum and me" (recognise a subject access request, pass to Tomasz). Redact a complaint file before it goes out (MG-12), including a "redaction" that only drew black boxes over the text. A spreadsheet for a council has a hidden tab with staff sickness data (check hidden tabs before sending). Marketing wants to reuse care home contact lists for a newsletter (purpose limitation: ask the DPO). Autocomplete sends a file to the wrong Sam (report at once as a breach). A caller "from the police" wants an employee's home address (refer to the DPO). A fast "Is this personal data?" drill. Tomasz explains in short chunks. Real cases for `concepts.md` (all **verify**): the PSNI spreadsheet with a hidden tab (2023), the Ministry of Defence Afghan relocation email in the "To" field (2021), the 56 Dean Street clinic newsletter (2015).
- **Reuse:** `notes`, `text-file`, `examine`; `room_office`; `phone-chat`.
- **Features:** MG-12, MG-01 (compose with recipient check), MG-09, BE-10, EX-01, BE-08.

## core_06_handling_information: Need to Know

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size M.
- **Scope:** classification and labelling (Public, Internal, Confidential, Restricted, renameable); need to know; sending (check recipients, autocomplete, Bcc for groups, secure send for Confidential, passwords sent by another channel); sharing links (specific people, not "anyone with the link"; expiry; review); printing (secure release, collect at once); storing (approved locations, not desktops or personal devices); disposal (confidential waste, shredding, devices back to IT); redaction and hidden content; retention.
- **Boundaries:** the law is core_05; cloud and shadow IT are core_13; clean desk is core_10 (here only printing and disposal).
- **Seed:** the player helps Martin get a tender bid out by Friday: assemble the bid pack from documents of different classes (MG-10); share with an external partner without "anyone with the link" (MG-11); email the pricing sheet, where autocomplete offers "Martin Fletcher (personal)" (MG-01 compose); print the board pack and find HR printouts left in the tray; clear old drafts into the right bin. Attacker view: Jo pulls a draft out of the ordinary recycling and pieces it back together, using the existing `shredded-document` minigame. Martin wants to email everything to his personal account "because it's quicker": the player has to say no nicely.
- **Reuse:** `shredded-document`, `container`, `notes`; `room_archive_1x2gu`, `small_office_room*`.
- **Features:** MG-10, MG-11, MG-01, MG-12, EX-06, BE-10.

## core_07_malware_ransomware_and_updates: Zero Hour

- **Audience and length:** all staff; 15 minutes; micro 3; P2; size M.
- **Scope:** what malware is (ransomware, infostealers, trojans, remote access tools); how it gets in (attachments and "enable content", fake downloads and updates, USB, unpatched systems, remote access scams); ransomware (encrypting and stealing, then extortion); signs; updates (why, how fast, restart, phones and apps too, unsupported software); don't disable security software or ignore alerts; save work where it's backed up; what to do (report at once, follow isolation instructions, don't pay, don't try to restore yourself). Real cases for background, all **verify** figures: WannaCry and the NHS (2017), the British Library (2023), Synnovis and London hospitals (2024), Jaguar Land Rover (2025), Marks and Spencer (2025).
- **Boundaries:** downloads and fake sites are core_08; reporting procedure is core_04 (link to it).
- **Seed:** a busy afternoon in the warehouse (new room). Kev's shared PC has postponed its update for six weeks. An invoice attachment asks to "enable content". A web page says the browser needs an urgent update. Then a colleague's PC shows a ransom note (`ransomware-display`, seen not played): the player reports and follows the isolation instruction, and a network view shows how far it spread in the minutes before the report. Behind the scenes, Kai and Owain restore from backup (`backup-recovery`). The player sorts out updates on their own phone (MG-23). A time skip shows the business impact.
- **Reuse:** `ransomware-display`, `backup-recovery`, `network-segmentation-map`; m02's ransomware assets.
- **Features:** MG-23, BE-16, BE-18, EX-05, MG-01.

## core_08_safe_web_and_downloads: The Download

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size L (browser minigame).
- **Scope:** search ads leading to fake download sites; lookalike and typo domains; fake browser updates; fake CAPTCHA pages that tell you to paste a command into Run or a terminal ("ClickFix": **verify** current naming and prevalence); tech support scam pop-ups; browser warnings; browser extensions and their permissions; approved software sources (the company portal); unexpected file types; free online converters (data and malware risks); bookmarks for important sites; what the padlock does and doesn't mean; notification permission spam.
- **Boundaries:** malware impact is core_07; phishing emails are core_01; AI tools are core_15.
- **Seed:** the player needs a PDF-to-spreadsheet converter to finish a supplier report. They search (MG-02): the top result is a sponsored lookalike; the real vendor's site sits lower down. A "verify you are human" page tells them to press a key combination and paste: the game shows what's on the clipboard (a command) and the right move is to close the page and report. An extension called "Free PDF Tools" wants to "read and change all your data on all websites". A full-screen "virus detected, call support now" page with a phone number. Owain shows the company software portal, which has an approved converter. MG-03 domain drill as the practice beat.
- **Reuse:** `examine`, `text-file`; `room_office`, `room_IT`.
- **Features:** MG-02, MG-03, EX-01, BE-08.

## core_09_remote_and_mobile_working: On the Move

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size L (four new places).
- **Scope:** home working (router password and updates, family using work devices, smart speakers, video calls and what's behind you or on your shared screen, printing and disposal at home); public places (shoulder surfing, privacy screens, overheard calls, never leaving devices, locking the screen); public Wi-Fi (lookalike networks, the VPN, the phone hotspot); travel (hotel rooms, taking less data); lost or stolen devices (report at once; remote wipe); device basics (screen lock, encryption, updates, approved apps); personal devices for work (policy).
- **Boundaries:** physical office security is core_10; updates in depth are core_07.
- **Seed:** a day with Zainab (or the player as a field engineer for this module): a train where a passenger can read the player's screen (use the existing line-of-sight system, `systems/npc-los.js`: open a confidential document inside their sight cone and they see it); a café with two Wi-Fi networks of nearly the same name (MG-14) and the VPN; a client site; a hotel where the laptop is left on the bed; home, where a child wants the laptop for homework and a video call shows a whiteboard of client details (BE-10 spot-the-risk). The phone is lost at the station: report it and watch the remote wipe.
- **Reuse:** `systems/npc-los.js`, `person-chat` video-call mode; new rooms: train carriage, café, hotel room, home office.
- **Features:** MG-14, MG-23, BE-10, BE-16.

## core_10_physical_security: Tailgate

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size M.
- **Scope:** tailgating (challenge politely or report; don't hold secure doors for people you don't know); visitors (sign in, badge, escort); badges (wear inside, hide outside, never lend, report losses at once); secure areas; clean desk and clear screen; printers and post; unexpected deliveries; people with a story (inspectors, engineers, cleaners); propped doors; door codes and keys; reporting.
- **Boundaries:** phone and text pretexting is core_02; printing and disposal detail is core_06.
- **Seed:** two halves. **Red Team Day** (attacker view, EX-06 and BE-11): the player joins Jo Fairweather on an authorised test of Larkspur's building. Tailgate in at the smoking shelter door carrying two coffees; copy a badge left on a café table with the campaign's RFID cloner; open a cabinet with the lockpicks. Each step ends with Jo saying what would have stopped her. **The next day** (defender): the player covers reception with Maureen and walks the floor with Precious: challenge a tailgater (with a model line: "Hi, can I help you find someone? I'll walk you to reception"), a visitor without an escort, a "fire safety inspector" who wants the comms room, unlocked screens, confidential printouts, a badge in the canteen, a propped fire door. Ends with a clean desk sweep (BE-10).
- **Reuse:** `rfid`, `lockpicking`, `pin` minigames; doors, keycards and patrol systems; `room_reception`, `room_servers`. See `scenarios/RFID_SCENARIO_PATTERNS.md`, m03's visitor badge and RFID content.
- **Features:** BE-11, EX-06, BE-10, MG-25 (visitor ID or work order).

## core_11_payment_fraud_and_bec: Change of Details

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size M.
- **Scope:** business email compromise and payment fraud for everyone: supplier bank detail changes, fake invoices, chief executive fraud, gift card requests, payroll diversion; how attackers get the details (taken-over supplier mailboxes, lookalike domains, public information); the rules (never use contact details from the request, call back on the number already on record, two people approve, slow down when urgent plus secret plus money); Confirmation of Payee (helps, not foolproof); act fast if money has gone (bank first, then Report Fraud). **Verify** UK authorised push payment reimbursement rules and who they cover (consumers, micro-enterprises, charities) if you mention them.
- **Boundaries:** finance team processes in depth are role_02; deepfake calls are core_15.
- **Seed:** holiday cover in Finance with Hassan. "Northbeck" (the same supplier as core_01, for continuity) sends new bank details on letterhead: compare it with the supplier record (MG-25), call back on the directory number (MG-04): Dawn knows nothing about it. "Gillian" messages from a new number asking for gift cards for a client event, today, keep it quiet. A payroll change request "from" a member of staff. A payment run needs a second approver (the existing `dual-auth` minigame, which exists but isn't registered or dispatched yet: wiring it up is a small task to list under New features needed). Confirmation of Payee shows "no match". If money goes: a time skip where the chance of recovery drops by the hour, and the right move is to ring the bank at once. Hassan tells the story of his own near miss.
- **Reuse:** `dual-auth` (needs registering), `notes`, `phone-chat`, `forensic-data-platform` (evidence viewer with a confirm step); `small_office_room*` as the finance office.
- **Features:** MG-15, MG-25, MG-04, MG-05, BE-16.

## core_12_social_media_and_oversharing: Open Book

- **Audience and length:** all staff; 12 minutes; micro 3; P3; size M.
- **Scope:** what attackers learn from public posts (who works where and for whom, job ads naming systems, photos of badges, screens and whiteboards, holidays, birthdays, pets and school names that answer security questions, location tags); how it's used (spear phishing, pretext calls, fake recruiters, impersonation); privacy settings; thinking before posting about work; speaking for the organisation; fake profiles and recruitment scams.
- **Boundaries:** phishing is core_01; phone pretexting is core_02; insider recruitment is core_14.
- **Seed:** an **OSINT board** (MG-13, corkboard and string): with Jo, on an authorised test, the player pins Leo's public posts and connects them: a photo with his badge visible, his manager's name, a job ad naming the new finance system, his holiday dates, his dog's name. Together they make the perfect pretext call, which Jo reads out. Then flip: lock down Leo's profile and the player's own (privacy settings); spot risky posts in a feed (BE-10); answer a "recruiter" who wants "an overview of your company's systems" for a job.
- **Features:** MG-13, BE-10, EX-06, BE-11.

## core_13_removable_media_cloud_and_shadow_it: Workaround

- **Audience and length:** all staff; 12 minutes; micro 3; P3; size M.
- **Scope:** found USB sticks (hand to IT, never plug in); approved encrypted storage only; forwarding work to personal email or personal cloud; unapproved apps and free online tools (no contract, no control, no backups, no way to remove access, breaches); why people use workarounds (friction) and the right route (ask IT, request tools; IT helps); file transfer services; personal devices.
- **Boundaries:** AI tools are core_15; downloads and extensions are core_08.
- **Seed:** a deadline and a broken official route: the file share is slow and Martin is full of shortcuts. Temptations: email the files to a personal account to work tonight; a free file transfer site; a free online transcription tool for a client meeting recording; a USB stick in the car park labelled "Salary review 2026" (hand it to Owain); Kev's team using a free spreadsheet app shared from someone's personal account. Time skips months later show where each shortcut led (the free tool's breach; a leaver who can still open the personal share). The right path is to ask Owain, who has approved options ready in minutes. Message: IT is there to help.
- **Features:** BE-16, BE-18, MG-11, MG-01, EX-05.

## core_14_insider_risk: Notice Period

- **Audience and length:** all staff; 15 minutes; micro 3; P3; size M.
- **Scope:** insider risk is mostly accidental, sometimes negligent, rarely malicious; motivations (grievance, money, coercion, ideology); concerning behaviours (taking data before leaving, access outside the role, getting round controls); criminals recruiting insiders (ransomware groups offering a share of the ransom: **verify** the BBC journalist approached by a ransomware group in 2025); never share credentials; how to raise a concern fairly (manager, security, HR, whistleblowing route) without investigating colleagues yourself; whistleblowing versus leaking (UK Public Interest Disclosure Act 1998: **verify** wording); supporting colleagues under pressure.
- **Boundaries:** HR and manager processes are role_05.
- **Seed:** a sales account manager on his notice period (a new one-off character, not a recurring one) is quietly copying the customer list to a personal drive. The player notices odd things, but there are also **false leads**: another colleague acting strangely because of a family illness, which teaches fairness and not jumping to conclusions. The player gets a social media message from a "recruiter" offering money for VPN access (report it: you won't be in trouble). Leo asks to borrow the player's login because his has expired (say no, help him reach the service desk). Mei Lin and Ama explain how to raise a concern; Tomasz on the data.
- **Reuse:** m08 The Mole and m05 Insider Trading for ideas and art only (different tone).
- **Features:** BE-16, MG-09, EX-01.

## core_15_generative_ai_and_deepfakes: The Assistant

- **Audience and length:** all staff; 15 minutes; micro 4; P2; size M.
- **Scope:** approved AI tools versus public ones; what not to paste (personal data, confidential information, client data, passwords, code with secrets); checking outputs (made-up facts and references, bias); you're accountable for what you send; AI-written phishing; voice cloning and deepfake video; verification beats detection (call back on a known number, agreed code words, never act on a call alone); prompt injection at awareness level for staff using AI assistants that read emails or web pages; EU AI Act Article 4 AI literacy (**verify** obligations and dates). Real case: the Hong Kong deepfake video conference fraud reported in 2024 (**verify** company, amount and details).
- **Boundaries:** the payment process is core_11; phishing basics are core_01.
- **Seed:** Larkspur has just rolled out an approved assistant, "Lark Assist" (a friendly pixel robot character). The player uses it (MG-16) to summarise a complaint (what to remove first), to draft a report (it invents a statistic: check it), and spots Martin pasting the pricing model into a free public chatbot. A video call (`person-chat` video-call mode) from "Gillian" and "Hassan" asking for an urgent, confidential transfer for an acquisition: the procedure (call back, code word) beats trying to spot glitches. A voice note from "Leo" in distress asking for money. Ama: "You don't need to spot a deepfake. You need to check another way."
- **Reuse:** `person-chat` video-call mode (`person-chat-ui.js`; its "SECURE VIDEO LINK" bar is hard-coded and would need to read "Larkspur Meet" or similar); TTS.
- **Features:** MG-16, MG-04, BE-08, EX-05.

## core_16_acceptable_use_and_your_responsibilities: Small Print

- **Audience and length:** all staff; 10 minutes; no micro-drill; MVP; size S.
- **Scope:** what an acceptable use policy covers (use of systems and personal use, monitoring and privacy, installing software, personal devices, email and chat conduct, social media, data handling, reporting duties, consequences, where to ask); everyone's security responsibilities; the reasons behind the rules; acknowledging the organisation's own policies (the customer's real AUP via HA-07).
- **Boundaries:** each topic's detail stays in its own module; this module is about responsibilities and acknowledgement.
- **Seed:** a lunchtime game show in the kitchen, "Allowed, Not Allowed, or Ask First?", hosted by Ama and Owain with buzzers, using scenarios from the AUP ("Stream the football on your work laptop at lunch?"). Answers come from the organisation's policy settings (HA-11), with Larkspur defaults. Finish at The Lark with the real policy acknowledgement (BE-09, HA-07).
- **Features:** BE-09, HA-07, HA-11, MG-20.

## core_17_capstone_annual_assessment: Year End

- **Audience and length:** all staff; 35 minutes; no micro-drill; P2; size L.
- **Scope:** an annual refresher and assessment across the core modules, with a new edition each year. Integrates the threats unannounced into one busy day; stealth assessment against outcomes from the core modules; produces a per-learner profile and suggests spotlight modules.
- **Seed:** the last working day before the year-end close. A list of tasks across the building (BE-18): finish the client report, cover reception for twenty minutes, approve a payment as second approver, hand over to a colleague, tidy the desk before leaving. Threats woven in: a phish, a call, a tailgater, a bank detail change, a USB stick, an AI paste, a lost badge, a misdirected email, an MFA prompt. Consequences cascade. Final debrief: a competency profile. A team mode for an annual "escape room" event (HA-13).
- **Features:** BE-13 (editions), BE-18, BE-01, BE-02, BE-15, most MGs.

---

## role_01_leaders_and_boards: Crisis Room

- **Audience and length:** directors, senior leaders, trustees; 30 minutes; P2; size M.
- **Scope:** cyber risk as business risk; the board's responsibilities (UK Cyber Governance Code of Practice, 2025: **verify** its principles; NIS2 Article 20 for EU customers); risk appetite; questions to ask (NCSC Board Toolkit); incident readiness and exercising; ransomware decisions (whether to pay: legality and sanctions, no guarantees, UK government proposals on ransomware payments: **verify** current status); regulatory notifications (ICO, sector regulators); communications; cyber insurance; suppliers; leaders as targets (whaling, deepfakes); culture.
- **Seed:** a crisis exercise in the board room: injects over "36 hours" compressed into 30 minutes on a crisis decision board (MG-24, extending the existing `command-board`). Ransomware found at 02:00; decide who to convene, whether to isolate (and lose service to schools and hospitals), whether and when to notify the ICO, what to tell clients, staff and the press, the ransom demand and the leak threat, restoration priorities. Faisal advises; Anne-Marie asks the questions a regulator would ask. Debrief against the Code's principles. Facilitated mode first: boards prefer a workshop.
- **Reuse:** `command-board`, `ncsc-brief`, `claims-management-system` and `coverage-decision-form` (sis03 cyber insurance); SIS decision and debrief patterns.
- **Features:** MG-24, BE-15, HA-13, BE-16.

## role_02_finance_and_payments: Payment Run

- **Audience and length:** finance, payroll, accounts payable; 25 minutes; micro 4; P2; size M.
- **Scope:** finance controls against payment fraud in depth: supplier onboarding checks, bank detail change process and independent verification, dual control and separation of duties, reviewing a payment run, red flags (new account plus urgent plus large; account in a new country; changed remittance contact), Confirmation of Payee, pressure points (month end, holiday cover), fake and duplicate invoices, payroll diversion, refund fraud; card data basics for staff who take payments (PCI DSS: never store the security code, never email card numbers: **verify** wording); reporting and recovery.
- **Seed:** month-end payment run of thirty payments with anomalies in the data (MG-15, MG-25); Hassan off sick so the player covers; a supplier change request mid-run; pressure from "the chief executive"; Confirmation of Payee mismatches; the recovery race after a mistake.
- **Reuse:** `dual-auth` (needs registering), `notes`, `forensic-data-platform`.
- **Features:** MG-15, MG-25, MG-04, BE-16, BE-07.

## role_03_it_admins_and_service_desk: Reset Request

- **Audience and length:** IT staff and privileged users; 25 minutes; micro 4; P3; size M.
- **Scope:** identity verification for password and MFA resets (attackers impersonate staff to service desks: MGM Resorts 2023 and the UK retail attacks of 2025 reported this route: **verify** what was publicly confirmed); good verification (call back on the number on record, manager approval, video or in-person checks; avoid questions answerable from public information); privileged access hygiene (separate admin accounts, phishing-resistant MFA for admins, just-in-time access, no email or browsing as admin); app consent requests; alerts you shouldn't ignore; remote management tools abused through suppliers; backups; don't turn off security tools for convenience.
- **Seed:** a service desk shift (MG-17): a queue of tickets and calls, including "Gillian" locked out at the airport demanding an MFA reset now; a "new contractor" needing admin rights today; an app asking for mailbox access; an impossible-travel alert (existing `siem` and `log-filter`); a remote management tool installed by "the vendor". Owain and Kai. Links out to Hacktivity's technical labs for depth.
- **Features:** MG-17, MG-04, BE-16.

## role_04_developers: Ship It

- **Audience and length:** developers and technical staff; 25 minutes; micro 4; P3; size M.
- **Scope:** secrets in code and history; dependency risks (typo-named packages, malicious updates, dependency confusion, AI-suggested packages that don't exist); AI coding assistants (review what they write; don't paste secrets or proprietary code into unapproved tools); secure coding basics at awareness level (injection, broken access control); security in code review; CI/CD tokens and protected branches; real customer data in test environments (use synthetic data); handling vulnerability reports; logging without sensitive data. Link to Hacktivity labs (`lab_vulnerabilities`, `lab_exploitation`) for depth.
- **Seed:** Darius's team ships a customer portal feature: a code review (MG-19) with an injection and a missing access check; a pull request that includes a cloud key; an assistant-suggested package that doesn't exist yet (and then does, registered by someone else); an email from a "maintainer" offering to help; a test database copied from production.
- **Features:** MG-19, MG-16, BE-16.

## role_05_managers_and_hr: Joiners, Movers, Leavers

- **Audience and length:** line managers and HR; 25 minutes; P3; size M.
- **Scope:** joiners (the right access from day one, least privilege, training assigned); movers (remove old access); leavers (same-day account removal, devices back, handover, data); access reviews; recruitment fraud (fake candidates, borrowed identities, deepfake interviews; remote IT worker schemes: **verify** UK and US advisories); handling HR data (special category, need to know); responding when staff report mistakes (just culture); raising insider concerns fairly and lawfully; managers as culture-setters (make time for training, thank reporters).
- **Seed:** a week as a team manager with Mei Lin: a new starter's access request (pick the minimum); Leo moves to Finance (remove Operations access); a leaver's exit checklist; an access review table with stale accounts (MG-18); a video interview with a remote candidate whose identity doesn't add up (MG-25 for documents); a team member who clicked a phish and is frightened to say so.
- **Features:** MG-18, MG-25, BE-16.

## role_06_customer_facing_staff: Who's Calling?

- **Audience and length:** contact centre, reception and account managers; 20 minutes; micro 4; P3; size M.
- **Scope:** verifying callers (what to ask, avoiding information that's public, one-time codes, call backs; following the procedure under pressure); account takeover (contact detail changes followed by resets); social engineering by chat and email support; customers who are being scammed (spot it, protect them); personal data on calls (minimise, don't read out); card payments by phone (secure payment process: **verify** PCI DSS wording); angry and threatening callers as a pressure tactic; reporting.
- **Seed:** a contact centre shift with Shauna (MG-17, shared with role_03): school business managers asking for changes; a caller with details from someone else's breach; a care home resident's relative who seems to be being scammed; a card payment over the phone.
- **Features:** MG-17, MG-04, BE-16.

## role_07_procurement_and_supplier_management: Due Diligence

- **Audience and length:** procurement and contract owners; 20 minutes; P3; size M.
- **Scope:** suppliers as a route in (background, all **verify**: MOVEit and the Zellis payroll breach, 2023; Synnovis, 2024; Kaseya, 2021; the CrowdStrike outage, 2024, as a non-malicious dependency failure); proportionate due diligence (questionnaires, Cyber Essentials, ISO 27001, SOC 2 reports; evidence over claims); contract clauses (security requirements, breach notification times, audit rights, subcontractors, data return and deletion, insurance); supplier access (least privilege, MFA, time-limited, monitored); monitoring through the contract; offboarding; NCSC supply chain guidance (**verify** current form); UK public sector supplier rules on Cyber Essentials (**verify** current procurement policy note).
- **Seed:** choosing a new rostering software supplier: three bidders with glossy answers and varying evidence (MG-22); negotiate the clauses that matter; six months later a breach notification arrives from the chosen supplier; at contract end, the supplier's accounts are still active.
- **Reuse:** sis01's contractor VPN without MFA is a ready-made example of supplier access gone wrong.
- **Features:** MG-22, BE-16.

## sector_01_healthcare: Ward Round

- **Audience and length:** clinical and administrative staff in health and care; 20 minutes; micro 4; P3; size M.
- **Scope:** the NHS Data Security and Protection Toolkit training expectation (**verify** current requirement and format); confidentiality and the Caldicott Principles (**verify** there are eight, including the duty to share); smartcards (never share, remove when away); shared workstations; NHSmail phishing; downtime and ransomware impact on care (WannaCry 2017, Synnovis 2024: **verify**); connected medical devices (never plug in USB sticks or phones); only open records you need (looking at records out of curiosity is a breach and can be a criminal offence: **verify** the Data Protection Act 2018 section); sharing for direct care; photos on personal phones; talking about patients in public; phone requests for patient information.
- **Seed:** a shift as a ward clerk at a client hospital that Larkspur services (not sis01's Northgate General, to keep the SIS canon separate): a nurse leaves a smartcard in a terminal; a "relative" calls for a patient's condition; a well-known person is admitted and colleagues are curious; a phishing email to the ward's shared mailbox; downtime procedures when a system goes down; a visitor in a staff-only corridor.
- **Reuse:** the hospital room set (`room_hospital_*`), nurse and hospital staff sprites as extras (not sis01's named characters).
- **Features:** MG-01, MG-04, MG-17, BE-10.
