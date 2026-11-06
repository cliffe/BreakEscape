# Existing content that touches awareness topics

Which existing Break Escape scenarios already contain material on the awareness topics, as surveyed in October 2026. The campaign missions are spy thrillers and the SIS games are professional crisis games, so the tone and framing don't carry over; the ideas, props, patterns and sometimes the art do. "erb:N" is a line in the scenario's `scenario.json.erb`.

## By topic

| Topic | Where it already appears |
|---|---|
| **Passwords** | m01: a passphrase initialism on a post-it (erb:1735), an anniversary date reused for a PC and a safe (erb:1421, 1860, 1896), Kevin's `ask_passwords` knot; m02: Gary's sticky note of family names and years (erb:2140); m03: "Surname plus the year the firm was founded" on a helpdesk slip, the year overshared by reception (erb:1681); m05: a temporary password on a ticket and a sticky note (erb:768, 1300); m06: a house passphrase rule and a cracking audit management stopped (erb:1260, 1333); ceo_exfil: post-it passwords |
| **Codes shared or binned** | m01: a door PIN on a voicemail, in a bin and on an out-of-office note (erb:1122 to 1299); ceo_exfil: a voicemail giving out a code, a shredded document; m02: a keypad code in a desk diary marked "(CHANGE THIS)" (erb:2821) |
| **Secure disposal** | `scenarios/test-shredded-document`: a strip-cut bin whose memo holds VPN credentials, beside a cross-cut shredder. Ready-made for core_06 |
| **Visitors, badges, tailgating** | m01: visitor badge, sign-in log, an oversharing building directory; m02: talking your way past reception, a struck-through visitor log entry, blank lanyards a guard rejects, "Do not prop doors" (erb:1475 to 2060, ink `m02_npc_receptionist.ink`, `m02_npc_security_guard.ink`); m03: cloning a receptionist's badge, "keep it on show"; m04: forged credentials waved through a checkpoint; m07: a badge station left logged in with a printed badge in the tray, a contractor with no escort; m08: a badge printer left logged in, a policy board saying "ID to be carried and displayed" |
| **Clean desk and printing** | m08: a password and printer PIN on a post-it on the coffee machine, uncollected printouts (erb:1616, 1167, 1362); m02, m01 notes left on desks |
| **Social engineering by text or in person** | ceo_exfil: a gossiping contact leaks the manager's name, then the player impersonates the manager to get a safe code (`scenarios/ink/gossip-girl.ink`, `neye-eve.ink`); m02: talking your way in; `test-phone-terminal`: an unknown sender sowing distrust |
| **Call-back verification** | sis02: the managed SOC refuses an unverified firewall change and rings back on the number it holds (`scenarios/sis02_energy/ink/npc_tom_hadley.ink:136-171`). A model for core_02 and core_11 |
| **USB and removable media** | sis02: printer firmware installed from a USB stick sent by a fake vendor (erb:1541); m03: a hidden USB drive; m05: a USB in an upload terminal; m08: a USB in a locker |
| **Phishing** | sis01: a phishing email on a finance PC as initial access (debrief `ink/npc_sharma.ink:323-339`); m01: forged emails with header mismatches. No lure emails, inbox or report button anywhere |
| **MFA** | sis01: a contractor VPN with no MFA; m01: "We don't have MFA yet". No MFA fatigue anywhere |
| **Ransomware and backups** | m02: the ransom decision, an air-gapped key escrow, a "recovery services" front; sis01: backup choice (NAS, tape or vendor cloud) and reinfection risk; `ransomware-display` and `backup-recovery` minigames; `scenarios/ransomware-test` |
| **Reporting and leadership culture** | m02: seven unanswered warnings, a planned scapegoat, "the whistleblowing I should've done"; m05: "someone upstairs told her to leave it"; m04: a memo deferring OT security; sis01: SIEM triage and honest estimates |
| **UK GDPR and notification** | sis01: the ICO 72-hour clock (run as 45 minutes), an information governance lead who argues "contain first, then notify" so the player can push back (`ink/npc_helen.ink:104-169`), Article 34 patient disclosure; sis02: a NIS notification clock |
| **Insider risk** | m05 (the strongest): a recruiter leaflet ("Feeling undervalued?"), a recruiter's spreadsheet of staff with a "pressure" column, a journal and medical bills, a vetting file with undeclared changes, management overriding a security log; m02: a grievance-driven insider; m08: an ideological mole and a list of past leaks (contractor accident, phishing, accidental disclosure); m01: whistleblowing ignored |
| **Suppliers** | m03: a consultant's work sold under a false pretext; m04: a fake contractor crew with valid cards and a work order; m07: a bribed guard renewing a contractor's credentials; sis01: contractor VPN access without MFA; sis02: a dormant contractor account with a default password |
| **Developers** | m08: a "Secrets in Git History" field guide (erb:822) |
| **AI** | m08: ATHENA, an AI receptionist that won't read secrets aloud but hints where they are (`ink/m08_receptionist_ai.ink`) |
| **Too good to be true** | lab_tesseract_trials: a ransomware front recruiting students with a fake studentship; tracking pixels and "turn remote images off"; a final choice to warn the handler out of band (`scenarios/lab_tesseract_trials/DESIGN.md`) |

**Not found anywhere:** phishing lure emails, an email client or report button, QR codes, MFA fatigue, tailgating as gameplay (it exists only in the lore, `story_design/universe_bible/02_organisations/entropy/tactics.md`), email misdirection, cloud and shadow IT, remote working, public Wi-Fi, invoice fraud and business email compromise, deepfakes as gameplay, a social media feed.

## Patterns to copy from the SIS games

The Security-Informed Safety games are the closest existing model for an education-first game:

1. **A facts pack first** (`information_pack.md`), which the game must match. In this course that is each module's `concepts.md`.
2. **A game design with a teaching-moment table.**
3. **Each learning outcome becomes a decision in play**, recorded as a global (sis01 erb:147-274), with task titles that don't give the answer away.
4. **Misconceptions are voiced by a credible character**, and the player can push back with evidence (sis01's Helen and "contain first, then notify").
5. **Consequences show up** in NPC lines and barks, a live timeline, the debrief and conditional credits.
6. **The debrief is a conversation** that says what happened from the globals, asks one question per section and confirms or corrects the answer (`scenarios/sis01_healthcare/ink/npc_sharma.ink`). The final aim needs `debrief_complete`.
7. **Facilitator stop-points** in `mission.json` (`scenarios/sis02_energy/mission.json`): eight stop-and-discuss points, each a choice in play revisited in the debrief.
8. **The lab sheet's reflection questions** point at moments in play.

Rules from `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md` that apply here: put the game's aims in every prompt so agents don't drift into the spy voice; the facts pack is the truth; judge dialogue on teaching value, accuracy and credible voices; gate every debrief line on what the player did; one person delivers each moral; natural speech, not textbook definitions.

## Ink that already exists

- `story_design/ink/lab_sheets/phishing_social_engineering.ink` and `story_design/ink/game_scenarios/phishing_social_engineering.ink`: unused ink versions of the phishing lab sheet. Attacker-side (reconnaissance, spoofing, SPF, DKIM and DMARC, macros), so useful only as a structural example of a topic hub.
- m01's Kevin runs a five-question multiple-choice "security audit" in ink with a score: a precedent for a check inside dialogue.
- `docs/agents/TESSERACT_TRIALS_BRIEF.md` sets a "no quizzes" rule for that lab. The awareness course differs: it needs a short check for evidence, kept at the end of a module and written as workplace situations (see `01_LEARNING_DESIGN.md`).

## A note on tone

The campaign's universe bible describes ordinary staff with "Post-it note passwords" and "Mandatory training (checkbox exercise)", and says "Humans are weakest link" (`story_design/universe_bible/05_world_building/society.md`). That suits a spy thriller about a failing world. The awareness course deliberately takes the opposite stance: people are the defence, and training should be worth people's time.
