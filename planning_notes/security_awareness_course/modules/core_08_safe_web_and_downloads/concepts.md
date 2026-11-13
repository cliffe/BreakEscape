# core_08 concepts: Safe web browsing and downloads

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it. Reading a web address is taught in core_01 and reused here unchanged; what malware does once it is in is core_07; where work data may be uploaded or stored is core_13.

## Key messages

1. **Start from a place you trust.** Get software and online tools from the company portal, or ask IT. Reach work sites through bookmarks or by typing the address. Never from adverts or whatever is top of a search.
2. **Check the address, not the look.** Copies of real sites look perfect. Read the domain from the right-hand end. The padlock only means the connection is private; it doesn't make a site honest.
3. **A web page should never make you do things to your computer.** Don't paste or run anything to "prove you're human", don't install "updates" or "fixes" a page offers, don't call a number from a pop-up, and don't allow notifications or extensions because a page asked.
4. **Believe browser warnings.** If the browser says a site or a download is dangerous, go back. If you need the site for work, ask IT.
5. **Report suspicious sites, and report straight away if you pasted, downloaded, installed or called.** Nobody is in trouble for reporting.

## Concepts

### Where software and online tools should come from

- **The company portal first.** Software in the organisation's portal has been checked, is licensed, is kept updated by IT, and usually installs without needing an administrator. Anything not in the portal: ask the service desk. Most organisations don't let staff install software themselves, for exactly the reasons below.
- **Not from search results or adverts.** Criminals buy search adverts that impersonate real brands; the adverts appear at the top of the results, look much like the genuine listing, and lead to copies of official sites that offer malware named after the program you wanted (FBI, December 2022). Microsoft notes that infostealers are "often delivered through malvertising or SEO poisoning", meaning malicious adverts and fake pages pushed up the search results (Microsoft Digital Defense Report 2025).
- **Genuine sites can be hacked.** Several of the tricks below run on real, familiar websites that criminals have broken into. A site you trust is not a reason to do what it suddenly tells you.
- **Personal devices:** the NCSC's advice is to download apps only from official app stores or official websites (Small organisations guide, 2026).
- **Free online tools** (converters, compressors, editors) carry two separate risks. Downloading their output or their installer can bring malware in, which is this module. Uploading a work file to them hands the file to a stranger, which is core_13.

### Reading the address

Use core_01's method: read the address up to the first single `/` after the `://`, then read that part from the right-hand end.

| Address | Real domain | The vendor's real site? |
|---|---|---|
| `https://www.pagewright.co.uk/download` | `pagewright.co.uk` | Yes |
| `https://pagewright.co.uk.get-installer.com/` | `get-installer.com` | No: the vendor's name is decoration at the front |
| `https://www.pagewrite-pdf.com/` | `pagewrite-pdf.com` | No: a lookalike |
| `https://downloads.pagewright.co.uk/setup` | `pagewright.co.uk` | Yes: a part of the vendor's own site |

- **Sponsored results** are adverts. They sit above the ordinary results and can look the same. For anything you will install or sign in to, skip them.
- **Bookmarks beat searching.** Save the sites you use for work, or use the intranet's list. Typing the address yourself is the FBI's advice too.
- **The padlock** means the connection is encrypted, so others can't read or change what passes between you and the site. It says nothing about who runs the site: nearly all phishing sites use HTTPS and show a padlock. Google's research in 2021 found only 11% of study participants correctly understood what the padlock meant, and Chrome replaced it with a neutral "tune" icon from Chrome 117 in September 2023 (Chromium blog, May 2023). Other browsers still show a padlock. Either way, check the address.

### Pages that try to make you do things to your computer

Four tricks cover most of what staff meet. In each one, the giveaway is the instruction, not the look.

1. **Fake checks ("ClickFix").** A page shows "Verify you are human", often copying a familiar CAPTCHA design, or a fake error ("this page can't be displayed: click Fix"). Behind the scenes it has already copied a command to your clipboard. It then tells you to press a key combination (on Windows, the Windows key and R, then Ctrl and V, then Enter; on a Mac, open Terminal and paste). Doing it runs the command, which installs malware, most often an infostealer.
   - **Real CAPTCHAs** only ask you to tick a box, pick pictures or type letters on the page itself. No genuine check, error, download or support process ever needs you to paste anything into your computer. Microsoft's advice to Mac users in 2026 was the same: "No legitimate process requires this."
   - **How current it is.** Microsoft first saw the technique in 2024. By August 2025 it said ClickFix campaigns were targeting "thousands of enterprise and end-user devices globally every day", and that the most common payload was the Lumma infostealer (core_07). ESET's figures for the first half of 2025 showed ClickFix rising more than fivefold on the previous six months, to become the second most common attack it saw after phishing. Microsoft's Digital Defense Report 2025 describes attackers "now heavily using" it. In 2026 Microsoft reported variants that tell people to paste into Windows Terminal or PowerShell behind a fake Cloudflare-style check on hacked sites ("TerminalFix", August 2026), and fake Mac download pages that ask people to "complete your download in Terminal" (August 2026).
   - **Naming:** security researchers call it ClickFix; it is also called "fake CAPTCHA". Staff don't need the name, only the rule.
2. **Fake updates.** A page you were reading, often a genuine site that has been hacked, says your browser is out of date and offers a download. Proofpoint tracked at least four separate criminal groups using fake browser updates in 2023. Real browsers update themselves in the background and finish when you close and reopen them (Google Chrome Help); at work, IT manages the browser. A web page can't know your browser needs updating, and no genuine update comes from a page.
3. **Fake alarms (tech support scams).** A page takes over the whole screen, may speak or play a sound, says the computer is infected or locked, and shows a phone number to call. It may keep reopening when you try to close it. Microsoft's guidance is plain: its "error and warning messages never include phone numbers". Don't call. Press Esc to leave full screen and close the tab or the browser; if it won't let you, call the service desk on the number you already have. If you did call: hang up, install nothing, report it (the call itself is core_02).
4. **Fake permissions.** Two kinds:
   - **Notifications.** "Click Allow to prove you're not a robot" or "to continue watching" is asking for permission to send you notifications, which the site then uses to push fake virus alerts and adverts onto your desktop. Browsers block some sites known for abusive notifications, not all. Choose Block.
   - **Extensions.** A browser extension called something like "Free PDF Tools" that asks to "Read and change all your data on all websites" (Chrome's own wording for that permission) can see and change everything you do in the browser, including the finance system and the intranet. Google says access like this means an extension "can access almost anything", which "doesn't mean that the app is dangerous, just that it can be". Extensions also update themselves after you install them, so what one does can change. Add extensions only from the organisation's approved list, or ask IT first.

### Browser warnings

- Red warning pages ("Deceptive site ahead", "Dangerous site", "This file may be harmful") come from the browser's safety checks. **Go back.** Don't open "details" and choose to visit the site anyway, and don't keep a download the browser has flagged.
- Warnings are occasionally wrong. If a site you need for work is flagged, ask IT rather than clicking through.
- A warning that the connection isn't private on a public site: go back too.

### Downloads and file types

- Know what you expected. A price list should arrive as a PDF or a spreadsheet, not a program. If you asked for a document and got a program, a zip file or a disc image, or a name like `pricelist.pdf.exe`, stop and report it.
- A download you didn't ask for, which started on its own when a page opened: don't open it; report it.

### What happens when you report a website

- **At work:** the security team can block the site for everyone, check whether anyone else visited it, warn the site's owner if it was a genuine site that has been hacked, and report it on. Use the organisation's route: a Report button in the browser where the organisation provides one, or the security team (core_04).
- **At home:** report scam websites to the NCSC (free, about a minute). The NCSC analyses what's reported and may work with hosting companies to remove malicious links. If you lost money, contact your bank and Report Fraud (England, Wales and Northern Ireland) or Police Scotland on 101.

### If you pasted, downloaded, installed, called or allowed

- **Report it straight away** to the security team, or the 24/7 service desk out of hours: what you did, on which site, and when (core_04).
- **Don't try to fix it yourself:** no restarting to "clear it", no clearing your history, no scanning tools from the web. Do what the security team says, which may be the device instruction from core_04: don't switch it off; if they ask, disconnect it and leave it on.
- **If you typed a password** into a site, change it through the real site and tell IT (core_01, core_03).
- **If you allowed notifications** or added an extension, tell IT; they'll remove it, or show you where the browser's site settings are.

## What to do (the procedure)

As the reference card shows it:

1. **Start from a trusted place.** The software portal for tools; bookmarks or a typed address for sites. Skip the adverts.
2. **Check the address.** Read the domain from the right-hand end. The padlock doesn't make a site honest.
3. **If a page tells you to do something to your computer, stop and close it.** Paste, run, install, update, call, allow: no.
4. **Believe the warning.** Go back. Need the site for work? Ask IT.
5. **Report it.** Suspicious site: tell the security team. Pasted, downloaded, installed or called: report it now (the security team, or the 24/7 service desk out of hours) and do what they say.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "The top search result is the official site." | The top results are often adverts, and criminals buy adverts too (FBI, 2022). Use bookmarks, typed addresses and the portal. |
| "The padlock means the site is safe." | It means the connection is encrypted. Nearly all phishing sites have one (Chromium blog, 2023). |
| "It looked exactly like the real site." | Copies are easy to make. The address tells you whose site it is; the look doesn't. |
| "A CAPTCHA is a security check, so it's safe to do what it says." | Real CAPTCHAs happen on the page. None ever asks you to press keys to open something or to paste anything. |
| "If a site says my browser needs updating, I should update it." | Browsers update themselves; finish an update by restarting the browser when it asks. A page that offers a browser update is a trap. |
| "Pop-ups with a support number are from the computer's maker." | Genuine error messages never include phone numbers (Microsoft). |
| "Extensions from the official store are safe." | Stores check them, but an extension can ask for access to everything and can change when it updates. Use the approved list or ask IT. |
| "Free online converters are harmless." | Uploading a work file gives it to a stranger (core_13), and what you download can carry malware. Use the approved tool. |
| "Browser warnings are always overcautious." | They are occasionally wrong, but clicking through is how people reach real scam sites. Ask IT instead. |
| "Macs don't fall for this." | Fake checks and fake download pages now target Mac users with "paste into Terminal" instructions (Microsoft, 2026). |
| "If I clicked something I shouldn't have, reporting it will get me in trouble." | Reporting fast is what limits the damage, and the organisation thanks people for it. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names and domains.

- **Search adverts impersonating brands, 2022.** The FBI warned that criminals were buying search adverts with domains resembling real businesses; the adverts led to copies of official sites, including software download pages serving malware disguised as the program the user wanted (FBI public service announcement I-122122-PSA, 21 December 2022).
- **Fake browser updates, 2023.** Proofpoint described compromised legitimate websites showing what looked like a notice from the browser's maker telling visitors to update, and tracked at least four separate criminal groups using the lure (Proofpoint, 17 October 2023).
- **ClickFix, 2024 to 2026.** Microsoft first saw the technique between March and June 2024; by August 2025 it described campaigns targeting thousands of devices every day, delivering infostealers (mainly Lumma), remote access tools and other malware, through phishing emails, malicious adverts and hacked websites (Microsoft Threat Intelligence, 21 August 2025). ESET reported a rise of more than 500% in the first half of 2025 compared with the second half of 2024, making it the second most common attack vector it saw after phishing (ESET Threat Report H1 2025). Microsoft reported a Windows Terminal variant ("TerminalFix", 28 August 2026) and a campaign aimed at Mac users through fake download pages (5 August 2026).
- **A fake check inside a phishing campaign, 2024 to 2025.** From December 2024, emails impersonating a well-known hotel booking site were sent to staff at hospitality organisations. The link led to a fake CAPTCHA over a faded copy of the booking site, which told them to open the Windows Run box and paste a command it had already copied (Microsoft, 13 March 2025). The email side of this belongs to core_01.
- **Lumma infostealer, 2025.** Before its disruption in May 2025, Microsoft counted more than 394,000 infected Windows computers in two months; it spread through phishing, malicious adverts and fake CAPTCHA pages (Microsoft, 21 May 2025).
- **The padlock, 2023.** Google's research found only 11% of study participants understood what Chrome's padlock meant, and Chrome replaced it with a neutral icon in Chrome 117 (Chromium blog, 2 May 2023).
- **Free online file converters, 2025.** The FBI's Denver field office warned on 7 March 2025 that criminals are using free online file and document converter tools to deliver malware and to harvest the data people submit through them.

## Organisation-specific slots

| Slot | Default (Quayholt) |
|---|---|
| Software portal name and location | "Quayholt Apps", linked from the staff intranet's home page and the browser's bookmarks bar |
| How to request software or an extension | The "Request something else" form in Quayholt Apps; answered within one working day |
| Approved browser and extensions | Quayholt's managed browser; extensions only from the approved list in Quayholt Apps |
| How to report a website | The Report button on the browser toolbar, the "Report an incident" form on the staff intranet, or the security team on extension 4444 |
| Approved document converter | "Pagewrangle", in Quayholt Apps |
| Bookmarks for key sites | the staff intranet's "Bookmarks" page: Ledger, supplier portals, the HR system |
| After pasting, downloading or calling | Call the security team on extension 4444, or the 24/7 service desk out of hours; follow the device instruction (core_04) |

## Glossary

- **Sponsored result:** an advert in search results, placed above or among the ordinary results.
- **Lookalike domain:** a web address made to resemble a real one.
- **Domain:** the part of a web address that says whose site it is, read from the right-hand end.
- **Padlock (HTTPS):** a sign that the connection is encrypted; not a sign that the site is honest.
- **CAPTCHA:** a check that you're a person, done on the page (tick a box, pick pictures, type letters).
- **Fake CAPTCHA (ClickFix):** a page that tells you to paste and run a command to "verify" yourself.
- **Clipboard:** where your computer keeps what you last copied, ready to paste.
- **Run box, terminal:** places on a computer where typed or pasted commands run.
- **Browser extension:** a small add-on that changes what your browser does; it can ask for wide access.
- **Notification permission:** letting a website show pop-up messages on your desktop.
- **Tech support scam:** a pop-up or call claiming your computer has a problem, to get you to call, pay or install a remote access tool.
- **Browser warning:** the browser's own red page saying a site or a file is dangerous.
- **Software portal:** the organisation's own catalogue of approved software.
- **Malvertising:** adverts that lead to scam or malware pages.

## Sources

- FBI Internet Crime Complaint Center, "Cyber criminals impersonating brands using search engine advertisement services to defraud users" (21 December 2022): https://www.ic3.gov/PSA/2022/PSA221221
- Microsoft Threat Intelligence, "Think before you Click(Fix): analyzing the ClickFix social engineering technique" (21 August 2025): https://www.microsoft.com/en-us/security/blog/2025/08/21/think-before-you-clickfix-analyzing-the-clickfix-social-engineering-technique/
- Microsoft Threat Intelligence, "TerminalFix campaign deploys reverse tunnel through multistage intrusion" (28 August 2026): https://www.microsoft.com/en-us/security/blog/2026/08/28/terminalfix-campaign-deploys-reverse-tunnel-through-multistage-intrusion/
- Microsoft Threat Intelligence, "From open lures to cloaked gates: how a macOS ClickFix campaign learned to hide" (5 August 2026): https://www.microsoft.com/en-us/security/blog/2026/08/05/macos-clickfix-campaign-learned-hide/
- Microsoft Threat Intelligence, "Phishing campaign impersonates Booking.com, delivers a suite of credential-stealing malware" (13 March 2025): https://www.microsoft.com/en-us/security/blog/2025/03/13/phishing-campaign-impersonates-booking-com-delivers-a-suite-of-credential-stealing-malware/
- Microsoft, "Disrupting Lumma Stealer" (21 May 2025): https://blogs.microsoft.com/on-the-issues/2025/05/21/microsoft-leads-global-action-against-favored-cybercrime-tool/
- Microsoft Digital Defense Report 2025: https://www.microsoft.com/en-us/security/security-insider/threat-landscape/microsoft-digital-defense-report-2025
- ESET, "ESET Threat Report H1 2025": https://www.welivesecurity.com/en/eset-research/eset-threat-report-h1-2025/
- Proofpoint, "Are you sure your browser is up to date? The current landscape of fake browser updates" (17 October 2023): https://www.proofpoint.com/us/blog/threat-insight/are-you-sure-your-browser-date-current-landscape-fake-browser-updates
- Microsoft Support, "Protect yourself from tech support scams": https://support.microsoft.com/en-gb/windows/protect-yourself-from-tech-support-scams-2ebf91bd-f94c-2a8a-e541-f5c800d18435
- Chromium blog, "An update on the lock icon" (2 May 2023): https://blog.chromium.org/2023/05/an-update-on-lock-icon.html
- Google Chrome Help, "Update Google Chrome": https://support.google.com/chrome/answer/95414
- Google Chrome Help, "Turn notifications on or off": https://support.google.com/chrome/answer/3220216
- Chrome Web Store Help, "Permissions requested by apps and extensions": https://support.google.com/chrome_webstore/answer/186213
- Chrome for Developers, "Permissions list" (the warning text shown to users): https://developer.chrome.com/docs/extensions/reference/permissions-list
- NCSC, "Report a scam website": https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-website
- NCSC, *Small organisations guide to cyber security*: protecting your devices (published 9 April 2026, reviewed 21 July 2026): https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/protecting-your-devices
