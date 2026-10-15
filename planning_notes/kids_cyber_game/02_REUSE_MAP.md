# Reuse map: what the kids game takes from Break Escape and the awareness course

The point of this file is the brief's second question: where can the awareness-course plans (and the engine work behind them) also serve the children's game? The short answer is: most of the engine and minigame machinery reuses directly, the learning-design thinking reuses with gentler language, and the workplace *content* and the adult *platform* need the most change. Feature ids are from `../security_awareness_course/features/README.md`.

Legend: **Reuse** (as-is or trivial reskin) / **Adapt** (real changes) / **New** (little to take) / **Avoid** (not for young children).

## 1. Engine features (BE)

| Id | Feature | For kids | Note |
|---|---|---|---|
| BE-01 | Assessed decisions | **Reuse** | Same tagging underneath; surfaced as badges, not ratings |
| BE-02 | Debrief screen | **Adapt** | "What happened", kind and simple, pictures over text |
| BE-03 | Text route player | **Reuse** | Becomes the audio-first / low-reading route, essential here |
| BE-04 | Accessibility baseline | **Reuse** | Even more important for children; audio-first, no flashing, timers off |
| BE-05 | Organisation profile | **Adapt** | "Your school" or "home" values; a school logo, a teacher's name; still no child data |
| BE-07 | Micro-drill launcher | **Reuse** | A single short activity for a lesson starter or a five-minute go |
| BE-08 | Visual aids in conversations | **Reuse** | The guide shows a picture with each idea; central to a young audience |
| BE-09 | Intranet terminal | **Adapt** | Becomes a "home tablet" or "school portal" that holds the posters and badges |
| BE-10 | Spot-the-risk mode | **Reuse** | Perfect for kids: find the risky things in a bedroom or a chat |
| BE-11 | Role switch | **Avoid (young) / limit (KS3)** | No attacker view for young children; at most a gentle "see what a stranger can see" |
| BE-12 | Short sessions and resume | **Reuse** | Beats that fit a lesson or a bedtime; quick resume |
| BE-13 | Content banks and randomisation | **Reuse** | New messages, prizes and quiz items each play |
| BE-15 | Facilitated group mode | **Adapt** | Classroom mode on a whiteboard, teacher-led, class votes |
| BE-16 | Time skips and consequence scenes | **Adapt** | "A bit later..." shown gently, never frightening |
| BE-17 | Cross-module memory | **Reuse** | The squad remembers what you did; good for a connected feel |
| BE-18 | Work task and interruptions | **Adapt** | The "work task" becomes normal play (a game, homework) interrupted by a test |
| BE-19 | Open minigames from conversations | **Reuse** | Needed the same way; the `#trigger_minigame` fix serves both games |
| BE-20 | Authorable tutorial, title, end screen | **Reuse** | A child-friendly title and ending instead of the spy one |
| BE-21 | Workplace music and sound | **Adapt** | A playful kids music and ambience set (new audio, reuses the system) |
| BE-22 | Tactic spotter card | **Adapt** | "Trick cards" a child collects (urgency, "you have won!", pretending) |
| BE-23 | Pause and time scale | **Reuse** | Pause and slow timed pressure; important for younger players |
| BE-24 | Place-player action | **Reuse** | Same engine need |
| BE-25 | Course avatars and inclusive name entry | **Adapt** | A kid avatar set (animals and children, diverse, no scary hoodies); nickname only, no real name |
| BE-26 | Accessibility checks in CI | **Reuse** | Same guardrail |
| BE-27 | Plain English lint | **Adapt** | Re-tuned to a reading age of about 7, not 11 to 12 |
| BE-28 | Take an item from the player | **Reuse** | Hand the "found" thing to a grown-up, return a borrowed device |
| BE-29 | NPC guide behaviour | **Reuse** | The mascot walks ahead and waits; natural for a guide character |
| BE-30 | Video call options | **Adapt** | A kid-safe video-call skin for "is it really them?", no deepfake tells |

Almost every MVP engine feature the awareness course needs is also needed here, so **building them once serves two products.** BE-19 (open minigames from ink), BE-01/BE-02 (decisions and debrief), BE-03 (text/audio route), BE-04/BE-26 (accessibility), BE-08 (visual aids), BE-13 (banks), BE-20 (authorable shell) and BE-25 (avatars) are the shared backbone.

## 2. Minigames (MG)

| Id | Minigame | For kids | Kid reskin |
|---|---|---|---|
| MG-08 | Password manager and passphrase builder | **Reuse** | "Three picture-words" passphrase; why a pet's name is guessable |
| MG-11 | Sharing settings | **Reuse** | "Who can see this?" for a photo or post |
| MG-10 | Classification sorter | **Adapt** | "Secret or share?" sorting of everyday things |
| MG-13 | Social media / OSINT board | **Adapt** | "What can a stranger learn about you?" from posts; privacy, never an attack how-to |
| MG-07 | MFA prompts and authenticator | **Adapt** | "Two keys are better than one", very simplified |
| MG-01 | Inbox | **Adapt** | A kid message panel (game invites, prize messages) rather than email |
| MG-05 | Messaging apps | **Adapt** | A pretend group chat for kindness and "do not pass it on" |
| MG-02 | Web browser | **Adapt** | "Is this website real?", scary pop-ups, fake prize pages |
| MG-06 | QR code scanner | **Reuse** | A sticker QR that goes somewhere it should not |
| MG-16 | AI assistant chat | **Adapt** | "Is the chatbot your friend?"; it is a computer, do not tell it secrets |
| MG-20 | Knowledge check | **Reuse** | The quiz for a badge; picture answers for younger players |
| MG-21 | Video player | **Reuse** | Short guide videos / animations |
| MG-23 | Device settings | **Reuse** | Lock screen, app permissions, screen-time (the Byte-Size Heroes world) |
| MG-09 | Incident report form | **Adapt** | "Tell a grown-up" action, a friendly version |
| MG-12 | Redaction | **New-ish** | Low priority for kids; maybe "hide the private bits of a photo" |
| MG-15, MG-17, MG-18, MG-19, MG-22, MG-24, MG-25, MG-28, MG-29 | Payments, caller/access/code review, supplier, crisis board, document/record viewers | **Avoid / not needed** | Workplace-specific; out of scope for children |
| MG-30 | Pretext workshop (attacker view) | **Avoid** | Never for young children |

Roughly a third of the minigame library transfers with a reskin, and they are the cheap, high-value ones (passwords, sharing, messages, spot-the-risk, quiz, device settings). The workplace-specialist minigames do not come across, which is expected.

## 3. Explainers (EX) and the platform (HA)

| Id | For kids | Note |
|---|---|---|
| EX-01 Mentor explainer | **Reuse** | Becomes the mascot guide; same short-chunk-plus-picture pattern |
| EX-02 Engine-recorded video | **Reuse** | Short animations with the game's own characters |
| EX-04 In-world documents | **Reuse** | Posters and a "safety wall" |
| EX-05 Demonstration scenes | **Adapt** | Gentle "watch what happened" scenes, never scary |
| EX-06 Attacker-view interludes | **Avoid** | Not for young children |
| EX-07 Glossary and tooltips | **Adapt** | Kid-friendly word helper |
| EX-08 Poster and briefing pack | **Reuse** | Classroom posters and a parent one-pager |
| HA-01 Organisations | **Adapt** | Schools, not companies |
| HA-03 Assignments | **Adapt** | A teacher sets a world for the class |
| HA-05 Records, HA-06 Certificates | **Adapt** | Badges and a printable certificate; the record belongs to teacher/parent, not a child account |
| HA-07 Policy acknowledgement | **Adapt** | A gentle class "safety promise" rather than a policy sign-off |
| HA-09 Dashboards | **Adapt (carefully)** | Aggregate class progress for teachers; no child-versus-child ranking (Children's Code) |
| HA-13 Facilitated sessions | **Reuse** | Whiteboard classroom mode |
| HA-16 Localisation | **Reuse** | Needed across UK nations and beyond |
| HA-23 Accessibility | **Reuse** | Same guardrail |
| HA-26 Setup checklist | **Adapt** | A go-live checklist for a school, with the safeguarding and consent steps up front |
| HA-02 SSO, HA-10 LMS, HA-12 simulation, HA-14 evaluation, HA-18 licensing, HA-24 API, HA-25 partner | **New / later** | School-platform and commercial plumbing decided by the buyer question |

The platform is where children's data protection forces the most change: no child accounts, teacher-or-parent-held records, aggregate-only dashboards, consent and safeguarding baked into setup. This is a **modified** reuse of the awareness platform thinking, not a copy.

## 4. Awareness-course *plans* that reuse directly

Beyond features, the awareness course produced reusable *thinking*:

- **The seven-beat module pattern** (`../security_awareness_course/01_LEARNING_DESIGN.md`): reused with gentler names (the kids beat table in `00_VISION_AND_SAFEGUARDING.md`).
- **The learning-design principles** (no blame; pair every threat with a doable action; process over cues; practice in context; spaced practice; accessibility by design): reuse almost unchanged, and they matter more for children.
- **Evidence-centred, stealth assessment** (`features/assessment_and_evidence.md`): reuse the engine and the design; surface as badges, keep the record with the adult.
- **The module template** (`../security_awareness_course/MODULE_TEMPLATE.md`): reuse the four-file shape (card, concepts, game design, assessment) for each kids world.
- **The world-and-cast discipline** (`03_WORLD_AND_CAST.md`): reuse the method (one world, a recurring cast, a names register, inclusive art rules); build a new child-appropriate world and cast.
- **The compliance-mapping discipline** (`02_COMPLIANCE_MAPPING.md`): reuse the method; swap the frameworks for Education for a Connected World, RSHE, Keeping Children Safe in Education, the Children's Code and PEGI (see `00_VISION_AND_SAFEGUARDING.md`).
- **The review process** (`docs/agents/AWARENESS_REVIEW_BRIEF.md`): reuse the adversarial-review loop; add a safeguarding reviewer and check the reading age and age-appropriateness, not workplace compliance.
- **The "learning by doing" decision** (D12, the SecGen/Hacktivity attacker lab): the mirror-image lesson for children is that the attacker view is **out of scope**; only defender-positive content.

## 5. Topic translation: awareness modules to kid worlds

Which adult module's concepts (the source of truth lives in each module's `concepts.md`) feed which kid world:

| Awareness module | Kid world | What carries over (simplified) |
|---|---|---|
| core_03 Passwords and MFA | Passwords and Secrets | Strong passphrases, do not share, two-step |
| core_05 Data protection / core_12 Social media | Private and Proud | What is private, what a stranger can see, think before you post |
| core_01 Phishing / core_02 Social engineering | Is It Real? | Dodgy messages, prizes, "you have won", stop and check |
| core_08 Safe web / core_07 Malware | Is It Real? (web) | Scary pop-ups, fake pages, do not tap, tell an adult |
| core_15 AI and deepfakes | Is It Real? (AI) | Chatbots are not friends; pictures and videos can be faked |
| core_09 Remote / core_13 devices | Device world (Byte-Size Heroes) | Lock screens, app permissions, screen balance |
| core_04 Reporting | Runs through everything | "Tell a grown-up you trust" is the hero move |
| (no adult equivalent) | Kind Online; Screen Balance | Bullying, kindness, wellbeing: **new ground**, needs original design and safeguarding review |

## 6. What must be built new (little to borrow)

- **Kindness, bullying and wellbeing** content: the awareness course does not cover it; this is the most original and most safeguarding-sensitive work.
- **Contact-risk / "people are not always who they say"** at a child-appropriate level, signposting to trusted adults and CEOP/Childline, reviewed by a specialist.
- **Child-safe platform changes:** no child accounts, teacher-or-parent records, aggregate dashboards, consent and safeguarding in setup.
- **New art, voice and music:** a child-friendly cast, the mascot, a playful sound set (reuses the engine, not the assets).
- **An early-years mode** (Cyber Cubs), if pursued: a simpler engine use and its own art.
- **Curriculum and safeguarding mapping** and teacher/parent guides.

## Bottom line

The engine, the minigame framework, the accessibility and assessment machinery, and the learning-design thinking are **largely shared**, so a children's game is far cheaper to reach a first playable than it would be from scratch. The new cost is concentrated in child-appropriate content (especially kindness, wellbeing and contact risk), new art and voice, the child-safe platform, and the safeguarding and curriculum work that has to come first.
