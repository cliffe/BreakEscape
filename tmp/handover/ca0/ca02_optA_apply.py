import sys, json
R = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/b-ca-trailers-next/'
ATT = R + 'scenarios/ca02_cv_lures/scenario.json.erb'
DEF = R + 'scenarios/ca02_cv_lures_defend/scenario.json.erb'
FRAG = R + 'planning_notes/phishing_and_social_engineering/awareness/e2/defend.json'
GEN = R + 'planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py'
DEFMISSION = R + 'scenarios/ca02_cv_lures_defend/mission.json'
CHIDI = R + 'scenarios/_office_kit/ink/chidi_okeke_ambient.ink'
FAT_DEF = R + 'scenarios/ca02_cv_lures_defend/ink/fatima_begum.ink'

files = {}
def get(p):
    if p not in files:
        files[p] = open(p, encoding='utf-8').read()
    return files[p]

def rep(p, old, new, count=1):
    t = get(p)
    n = t.count(old)
    if n != count:
        sys.exit(f'{p}: expected {count} of {old[:80]!r}, found {n}')
    files[p] = t.replace(old, new)

# ---------- shared defend-set copy ----------
OLD_CHIP = 'It asks me to turn on editing or content to see it'
NEW_CHIP = 'It wants a second step before I can see it'
OLD_RF = 'The document asks you to enable editing or content before it will show anything'
NEW_RF = 'The CV stays blank until you switch content on, and the email tells you how'
OLD_PFN = "A real CV shows up as soon as you open it. 'Click Enable Editing and then Enable Content' is the step the file needs you to take before it can run anything"
NEW_PFN = "A real CV shows up as soon as you open it. This one stays blank until you switch content on, and the email tells you how: that switch is the step the file needs before it can run anything"
OLD_WF = "A Word document is a normal way to send a CV, so the file itself fits. What doesn't fit is being told to enable editing and content before it will show: a real CV never needs that."
NEW_WF = "A Word document is a normal way to send a CV, so the file itself fits. What doesn't fit is a CV that stays blank until you switch something on: a real CV never needs that."
OLD_DARIUS = "It's a Word file, which is normal for a CV. In the viewer it shows the whole CV read-only and asks you to switch nothing on."
NEW_DARIUS = "It's a Word file, which is normal for a CV. It opens read-only in Protected View, often with a yellow Enable Editing bar, and you can read the whole CV without pressing it. Nothing asks for a second step."
OLD_BRIEF6 = "Six messages are waiting, and attachments show as labels."
NEW_BRIEF7 = "Seven messages are waiting, and attachments show as labels."

for p in (ATT, DEF):
    rep(p, f'"enable_content_prompt": "{OLD_CHIP}"', f'"enable_content_prompt": "{NEW_CHIP}"')
    rep(p, OLD_RF, NEW_RF)
    rep(p, OLD_PFN, NEW_PFN)
    rep(p, OLD_WF, NEW_WF)
    rep(p, OLD_DARIUS, NEW_DARIUS)
    rep(p, OLD_BRIEF6, NEW_BRIEF7)

# fragment: only the e2_recruitment_inbox set (first occurrence of the chip line), not the forms
t = get(FRAG)
chip_line = '"flagChips": { "enable_content_prompt": "' + OLD_CHIP + '" },'
i = t.index(chip_line)
files[FRAG] = t[:i] + chip_line.replace(OLD_CHIP, NEW_CHIP) + t[i + len(chip_line):]
rep(FRAG, OLD_RF, NEW_RF, count=3)  # set + two forms: restore forms after
t = get(FRAG)
first = t.index(NEW_RF)
files[FRAG] = t[:first + len(NEW_RF)] + t[first + len(NEW_RF):].replace(NEW_RF, OLD_RF)
rep(FRAG, OLD_PFN, NEW_PFN)
rep(FRAG, OLD_WF, NEW_WF)
rep(FRAG, OLD_DARIUS, NEW_DARIUS)
rep(FRAG, OLD_BRIEF6, NEW_BRIEF7)
rep(FRAG, "and the enable-content lure (row 4) by a real Word CV that asks for nothing (row 5).",
    "and the enable-content lure (row 4) by a real Word CV that asks for nothing (row 5). Row 6 is the second-step lure in another wrapper (a password zip, ca02 lesson option A, 25 Nov 2026), and Colin's genuine note closes the set.")

# ---------- the new message ----------
BODY = "Dear Fatima,\\nI saw your post about the night supervisor role, and I'd like to apply. I've run the night shift at a parcel hub for the last three years.\\nMy CV has my home address and references in it, so I've put it in a password-protected zip to keep it private. The password is Nights2026.\\nMany thanks,\\nAna Moraru"
RF_ZIP = "The CV is locked in a zip, with the password in the email, so you have to unpack it yourself"
PFN_ZIP = "A real CV just opens. A password sent in the same email protects nothing: it stops the mail filter looking inside the zip, and leaves you to unpack whatever is in there"
IFT_ZIP = "Unpacking the zip hands you a file the mail filter never got to check. Open it and it runs a program on your computer, which could give whoever sent it a way into Tarrowby's network and the candidate records."
RR_ZIP = "Thanks. The zip held a shortcut that runs a program, not a CV. The password was there to stop our mail filter looking inside. We've blocked the sender and checked nobody else opened it."
WF_ADDR = "It names Fatima and the night supervisor role, so it reads like a real applicant. The tell is the zip and its password, not the greeting."
WF_SENDER = "Candidates apply from their personal email, so a mailgrove.example address is normal here."
WF_PRETEXT = "A CV for a role Tarrowby really advertised is exactly what this inbox expects."

PRETTY = f'''          {{
            "id": "e2_cv_password_zip",
            "from": {{
              "name": "Ana Moraru",
              "address": "ana.moraru@mailgrove.example"
            }},
            "to": "jobs@tarrowby.example",
            "subject": "Night supervisor role: my application",
            "time": "11:05",
            "body": "{BODY}",
            "attachments": [
              {{
                "id": "cv",
                "label": "Ana_Moraru_CV.zip",
                "kind": "archive"
              }}
            ],
            "auth": {{
              "spf": "pass",
              "dkim": "pass",
              "dmarc": "pass",
              "envelopeFrom": "mailgrove.example",
              "replyTo": "ana.moraru@mailgrove.example"
            }},
            "factorStrings": {{
              "enable_content_prompt": {{
                "redFlag": "{RF_ZIP}"
              }}
            }},
            "truth": {{
              "isPhish": true,
              "flags": [
                "enable_content_prompt"
              ],
              "perFlagNote": {{
                "enable_content_prompt": "{PFN_ZIP}"
              }},
              "ifTrusted": "{IFT_ZIP}",
              "reportReply": "{RR_ZIP}",
              "whyFine": {{
                "addressedTo": "{WF_ADDR}",
                "senderTrust": "{WF_SENDER}",
                "pretextRelevant": "{WF_PRETEXT}"
              }}
            }}
          }},
'''
COLIN = '          {\n            "id": "e2_colin_interviews",'
for p in (ATT, DEF):
    rep(p, COLIN, PRETTY + COLIN)

COMPACT = f'''        {{
          "id": "e2_cv_password_zip",
          "_note": "Option A's second wrapper: the same 'one more step before the CV shows' tell as row 4, here a password zip from a candidate who names Fatima and the role, so the greeting gives nothing away.",
          "from": {{ "name": "Ana Moraru", "address": "ana.moraru@mailgrove.example" }},
          "to": "jobs@tarrowby.example",
          "subject": "Night supervisor role: my application",
          "time": "11:05",
          "body": "{BODY}",
          "attachments": [ {{ "id": "cv", "label": "Ana_Moraru_CV.zip", "kind": "archive" }} ],
          "auth": {{ "spf": "pass", "dkim": "pass", "dmarc": "pass", "envelopeFrom": "mailgrove.example", "replyTo": "ana.moraru@mailgrove.example" }},
          "factorStrings": {{ "enable_content_prompt": {{ "redFlag": "{RF_ZIP}" }} }},
          "truth": {{
            "isPhish": true,
            "flags": ["enable_content_prompt"],
            "perFlagNote": {{
              "enable_content_prompt": "{PFN_ZIP}"
            }},
            "ifTrusted": "{IFT_ZIP}",
            "reportReply": "{RR_ZIP}",
            "whyFine": {{
              "addressedTo": "{WF_ADDR}",
              "senderTrust": "{WF_SENDER}",
              "pretextRelevant": "{WF_PRETEXT}"
            }}
          }}
        }},
'''
rep(FRAG, '        {\n          "id": "e2_colin_interviews",', COMPACT + '        {\n          "id": "e2_colin_interviews",')

# ---------- concept panel ----------
OLD_CP_HEAD = "Why 'enable content' matters"
NEW_CP_HEAD = "Why a CV that wants a second step matters"
OLD_CP1 = "Office documents can carry macros, small programs that run inside the file. Many organisations now block macros in files that arrive from the internet, so this trick works less often than it used to. The lure still turns up, though, because it only has to work once. Reading a CV in the viewer is always enough; a real CV never needs you to switch anything on."
NEW_CP1 = "Office documents can carry macros, small programs that run inside the file. Since mid-2022, Office blocks macros in files that come from the internet or email by default, so a booby-trapped CV on its own is stopped behind a red security bar. Attackers now need you to take one more step for them: switch content on, unpack a zip with a password from the email, or follow a 'view my CV' link and sign in. A real CV just opens, in the viewer or in Protected View, Word's read-only mode for files from email, and never needs any of that."
OLD_CP2 = "To a real attacker, a second action like enabling content is a foothold on an HR machine full of candidate records, and from there a way into the candidate database and the recruitment mailbox. The habit you just practised, giving any attachment that demands a second action a second look, is what breaks that chain, because the file is never run.\\n\\nWhen a file like this is opened and content is enabled, it runs on the HR machine and it goes out of action while it is rebuilt,"
NEW_CP2 = "To a real attacker, that second step is a foothold on an HR machine full of candidate records, and from there a way into the candidate database and the recruitment mailbox. The habit you just practised, giving any CV that wants a second step a second look, is what breaks that chain, because the step is never taken and the file never runs.\\n\\nWhen a file like this does get its second step, it runs on the HR machine, which goes out of action while it is rebuilt,"
for p in (ATT, DEF, FRAG):
    n = 2 if p == FRAG else 1  # fragment also holds a planning note at line 33
    rep(p, OLD_CP_HEAD, NEW_CP_HEAD, count=n)
    rep(p, OLD_CP1, NEW_CP1, count=n)
rep(ATT, OLD_CP2, NEW_CP2)

# ---------- debrief panels (Option C wording on Chidi's outcome) ----------
rep(ATT, "It needed one more click to run their code. Chidi reported it without enabling anything, IT blocked the sender, and the file never ran.",
    "Office blocked it, so it needed Chidi to follow the steps in the email and switch that protection off himself. He reported it instead, IT blocked the sender, and the file never ran.")
TAIL_OLD = "That ran the attacker's code. They wanted a hiring manager's machine, because applicants' details sit on it. In the seconds before IT's alert cut it off, they copied the driver applications: names, addresses, licence details. Tarrowby is now working out whether it has to report to the ICO and who to tell. The gap was a setting: macros in files from email were allowed to run, and Tarrowby is switching that off."
TAIL_NEW = "That ran the attacker's code. They wanted a hiring manager's machine, because applicants' details sit on it. In the seconds before IT's alert cut it off, they copied the driver applications: names, addresses, licence details. Tarrowby is now working out whether it has to report to the ICO and who to tell. The gap was one step: Office had blocked the file, and the email talked him round the block."
rep(ATT, '"text": "Chidi clicked Enable. ' + TAIL_OLD,
    '"text": "Chidi followed the candidate\'s steps and switched Office\'s protection off himself. ' + TAIL_NEW)
rep(ATT, '"text": "Chidi asked, got no answer and went ahead: he clicked Enable. ' + TAIL_OLD,
    '"text": "Chidi asked, got no answer and went ahead: he followed the candidate\'s steps and switched Office\'s protection off himself. ' + TAIL_NEW)
rep(ATT, '"heading": "What Enable let in"', '"heading": "What one more step let in"', count=2)

# ---------- Chidi: bark 2, PC hint ----------
OLD_B2 = "Blank page, just a box saying enable editing and content. Do I click?"
NEW_B2 = "Microsoft's blocked it. He's sent steps to get round it. Do I?"
rep(ATT, OLD_B2, NEW_B2, count=2)
rep(ATT, "Chidi's PC. A CV for the driver job, open in Word. The page is blank except for a box: 'This document is protected. Enable editing, then enable content, to view it.'",
    "Chidi's PC. A CV for the driver job, open in Word under a red bar: 'Microsoft has blocked macros from running because the source of this file is untrusted.' Beside it, the candidate's email says how to get round that.")
rep(ATT, "Chidi's PC. The CV is closed, nothing enabled, and reported.",
    "Chidi's PC. The CV is closed, still blocked, and reported.")
rep(CHIDI, "Chidi Okeke: " + OLD_B2, "Chidi Okeke: " + NEW_B2)
rep(CHIDI, "+ [Click it. Word says that about anything downloaded from email.]", "+ [Follow his steps. It's only a CV.]")

# ---------- attack seat: the wrappers (Option A, within the engine's kinds) ----------
rep(ATT, '"label": "Portfolio (zip archive)"', '"label": "CV (password-protected zip)"')
rep(ATT, '"pass": "✓ A CV is exactly what she expects to receive",',
    '"pass": "✓ A Word CV is what she expects. Office blocks its macros by default, so it only runs if she switches content on",')
rep(ATT, '"fail": "An archive is not what an applicant sends; she would hesitate to open it, so the lure is weaker.",',
    '"fail": "The password gets the zip past the mail filter, but a CV she has to unpack herself is odd, so she would stop and ask.",')
rep(ATT, '"Recruiters expect a CV; attach the document, not an archive they would hesitate to open."',
    '"Office blocks macros by default, so any lure needs her to take one more step. Pick the wrapper she is least likely to question: a recruiter expects a Word CV."')
rep(ATT, "if it asks me to enable anything or sign in to see it, I'll leave it",
    "if it asks me to switch anything on, type a password or sign in to see it, I'll leave it")
rep(ATT, "Research the open vacancy and the recruiter, then send one candidate email with a CV attached. Nothing leaves this account.",
    "Research the open vacancy and the recruiter, then send one candidate email with a CV attached. Their Office blocks macros in files from outside by default, so whatever you send has to get her to take one more step herself. Nothing leaves this account.")

# ---------- defend twin: seven messages ----------
for old, new in [
    ("and six messages are waiting, applications and CVs among them", "and seven messages are waiting, applications and CVs among them"),
    ("Sort the six messages at the training kiosk.", "Sort the seven messages at the training kiosk."),
    ("You've worked through all six messages;", "You've worked through all seven messages;"),
    ("this morning, and six messages are waiting.", "this morning, and seven messages are waiting."),
    ("Tarrowby recruitment inbox. Six messages are waiting.", "Tarrowby recruitment inbox. Seven messages are waiting."),
]:
    rep(DEF, old, new)
rep(FRAG, "this morning, and six messages are waiting.", "this morning, and seven messages are waiting.")
rep(DEFMISSION, "a fictional company: six messages,", "a fictional company: seven messages,")
rep(FAT_DEF, "Six messages are waiting on the kiosk.", "Seven messages are waiting on the kiosk.")
for old, new in [
    ("Six messages are waiting on the kiosk.", "Seven messages are waiting on the kiosk."),
    ("and six messages are waiting, applications and CVs among them", "and seven messages are waiting, applications and CVs among them"),
    ("Sort the six messages at the training kiosk.", "Sort the seven messages at the training kiosk."),
    ("Tarrowby recruitment inbox. Six messages are waiting.", "Tarrowby recruitment inbox. Seven messages are waiting."),
    ("a fictional company: six messages,", "a fictional company: seven messages,"),
    ("You've worked through all six messages;", "You've worked through all seven messages;"),
]:
    rep(GEN, old, new)

for p, t in files.items():
    if p.endswith('.json') or p.endswith('.erb'):
        json.loads(t)
    open(p, 'w', encoding='utf-8').write(t)
print('ok', len(files))
