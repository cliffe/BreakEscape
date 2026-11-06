# Reuse map: what the kids game takes from Break Escape and the awareness course

The point of this file is the brief's second question: where can the awareness-course plans (and the engine work behind them) also serve the children's game? Since this map was first drafted, main has built a working awareness product, **"Incident Simulations: Critical Cases"**, and a social-engineering engine behind it. So the answer is now more concrete: the kids game would be a **defend-only sibling** of that product, sharing its episode runner, its triage sorter and its measurement, with the attack half left out. Feature ids are from `../security_awareness_course/features/README.md`; build status is from `../security_awareness_course/research/current_state_social_engineering_build.md` and `../security_awareness_course/04_BUILT_SO_FAR.md`.

Legend for kids use: **Reuse** (as-is or trivial reskin) / **Adapt** (real changes) / **New** (little to take) / **Avoid** (not for young children).

Build status words (from the inventory): **Built**, **Built differently** (the need is met by another design), **Partly built**, **Not built**.

## 0. Already built on main, and what the kids game can take

The awareness product runs every scenario in one training room: the learner taps a kiosk, a host NPC welcomes them, and the episode runner steps through the stages with a step strip. Each full episode is **brief, attack, flip, defend, debrief**, and each has a **defend-only** variant (**brief, defend, debrief**, about 8 minutes). Pre and post checks sit around the episodes. There is no runtime language model, no combat and no VM.

For children, only the defend-only shape is used: **brief, defend, debrief**. Everything the kids game takes from the build sits in that shape.

| Built on main | What it does in the awareness product | What the kids game takes |
|---|---|---|
| Episode runner and step strip | Runs an episode's stages in order inside one overlay, shows where you are, saves progress so a reopen resumes at the stage left | **Reuse** as the kids beat runner: a short "story strip" (Something happens, Have a go, What happened) with big, pictured steps |
| Training-room kiosk and host frame | One room, one kiosk that opens the episode, one host NPC who welcomes the learner and ends the mission | **Adapt** as the **den or hub**: the squad's den with a tablet or toy-box "kiosk" and the guide mascot (Crypto Cat) as the host. Worlds become further dens or doors off the hub |
| Inbox triage | A scored sorting round over email, SMS, call, voicemail, page, push and QR cards, with verdicts Trust, Report, Delete and Verify, red-flag chips, immediate feedback and mirror pairs | **Adapt** as the kids **"is it real?" sorter**. Keep the email, SMS, call, voicemail, page and QR card kinds (game invites, prize texts, a "friend" voicemail, a fake prize page, a sticker QR). Use simpler verdicts such as **Trust** and **Tell a grown-up**, with no Verify (checking for yourself is the grown-up's job here). Push cards are optional. Red-flag chips become picture "trick cards" |
| Report button and the "team protected" tally | Report is one click and never penalised; a neutral thanks for a genuine item; the debrief counts what the team was protected from | **Reuse** as the **"Tell a grown-up" button** and a **"squad protected" tally**. The tally is shared and non-competitive, which suits the Children's Code: nobody is ranked against anyone |
| Debrief cards and the "On Monday" card | A reasoning card per item, feedback on genuine items, the habit to keep, an "On Monday" card, the reporting route and a no-blame line | **Adapt**: picture-first reasoning cards ("this was a trick because..."), and the "On Monday" card becomes **"Next time"** (one thing to do next time it happens). The reporting route box becomes "who you can tell" (a grown-up at home or school, and Childline or CEOP where a topic needs them) |
| The no-blame line | "People who fall for these are not stupid", in every debrief | **Reuse**, in child words: "Tricks are made to fool people. You did the right thing by stopping." Telling is always the hero move |
| Awareness-measure records | Per-item records holding ids, verdicts, chips, score, stage, variant and time; no free text, no learner identity in the block | **Reuse**. It already fits the no-child-data rule: no free text and no identity. The kids version must keep the actor out entirely (records belong to the class or the device, held by the teacher or parent), and sends nothing that identifies a child |
| Pre and post check design | Matched parallel forms, AB and BA order, no pass mark, the change shown only when a baseline exists, a discrimination figure for organisers only, no effectiveness claims | **Adapt** as a **gentle before-and-after for teachers**, aggregate only: a short picture sorter before the first world and after the last. The child sees "well done", never a score drop. Teachers see class totals only. No pass mark, no effectiveness claims |
| OSINT browser | An in-world browser over authored sites where every action is a button, granting facts the attacker can use | **Adapt only as "what can a stranger see about you?"**, in defender framing: the child looks at a pretend profile (their avatar's, or a squad member's) and spots what gives away a school, a street or a birthday, then fixes it. Never framed as finding things out about someone else |
| Concept cards | Short explainer cards behind a visible "What is this?" button, with an optional pixel-art image | **Reuse** as the mascot's **picture cards**, voiced, behind a big "What is this?" button. Hover is never the only way to see them, as in the build |
| The chosen avatar | The player's chosen avatar always wins and the portrait follows (aw9) | **Reuse** the rule with a kid avatar set (children and animals, diverse). A nickname only, never a real name |
| Look-alike NPC guard | If an NPC wears the player's sprite, the NPC is swapped, never the player | **Reuse** unchanged. A child should never meet a character that looks like themselves |
| The `.example` brand rules | Invented brands with learnable look-alike shapes only, `.example` domains, no real brands, a web search per company before release, linted | **Reuse**. Invented games, apps and shops for children (proposed, not yet named) follow the same rules, kept in a kids brand set modelled on `BRAND_SET.md`. No real game, app or platform is ever shown |
| Source Sans 3 | The bundled readable face for every string a player reads or compares | **Reuse** as the default; check it at the kids reading age and at large sizes before choosing anything else |
| No runtime language model | The judge, replies, feedback and hints are authored data or ink (decision P) | **Reuse, and treat as a safeguarding rule**: no live model ever talks to a child. Any "chatbot" in the Is It Real? world is authored ink |

**Avoid for children:** the attack half (OSINT recon, write, build and MFA-run stages), pretext prep, the template composer, the landing-page builder, the influence bar used for manipulation, and the role swap. Children get **defend-only shells**: brief, defend, debrief. The flip (seeing your own attack land) is attack content and is left out too. The topics with no natural attacker can borrow the build's **consequence flip** idea gently: the child makes an everyday slip in a safe sandbox ("you posted your school jumper") and the debrief shows, kindly, what a stranger could have learned.

## 1. Engine features (BE)

| Id | Feature | Built on main | For kids | Note |
|---|---|---|---|---|
| BE-01 | Assessed decisions | Built differently (per-mechanic scoring and awareness-measure records) | **Reuse** | Triage scoring and records underneath; surfaced as badges, not ratings |
| BE-02 | Debrief screen | Built differently (episode-runner debrief view) | **Adapt** | "What happened" and "Next time", kind and simple, pictures over text (section 0) |
| BE-03 | Text route player | Not built | **Reuse (when built)** | Becomes the audio-first / low-reading route, essential here. A shared gap with the awareness product |
| BE-04 | Accessibility baseline | Partly built (social overlays only) | **Reuse** | Even more important for children; audio-first, no flashing, timers off. Captions, text size and timers-off are still gaps |
| BE-05 | Organisation profile | Partly built (report route, rule of thumb, team size slots; brand accent) | **Adapt** | "Your school" or "home" values; the report-route slot becomes "who you can tell"; still no child data |
| BE-06 | Localisation | Not built (strings are already in data) | **Reuse (when built)** | Needed across UK nations |
| BE-07 | Micro-drill launcher | Partly built (check missions; the defend-only shell is the micro-drill) | **Reuse** | A single short sorter round for a lesson starter or a five-minute go |
| BE-08 | Visual aids in conversations | Not built (concept cards are the nearest) | **Reuse** | The guide shows a picture with each idea; central to a young audience. Concept cards cover it until BE-08 exists |
| BE-09 | Intranet terminal | Not built | **Adapt** | Becomes a "home tablet" or "school portal" that holds the posters and badges; low priority, as for the awareness product |
| BE-10 | Spot-the-risk mode | Not built | **Reuse (when built)** | Perfect for kids: find the risky things in a bedroom or a chat. **New** work for both products |
| BE-11 | Role switch | Built differently (E3 role swap inside triage) | **Avoid (young) / limit (KS3)** | No attacker view for young children; at most a gentle "see what a stranger can see" (OSINT browser, defender framing) |
| BE-12 | Short sessions and resume | Partly built (resume at the stage left) | **Reuse** | Beats that fit a lesson or a bedtime; quick resume |
| BE-13 | Content banks and randomisation | Partly built (fixed parallel forms, AB and BA) | **Reuse** | Fixed forms for the before-and-after; random draws for replay are later work |
| BE-14 | xAPI statements | Partly built (shape written, unused) | **Avoid / limit** | No child actor is ever emitted; any statement is class-level and teacher-held |
| BE-15 | Facilitated group mode | Partly built (`facilitated` flag: prompts, no per-learner score on screen) | **Adapt** | Classroom mode on a whiteboard, teacher-led, class votes; the flag already hides individual scores |
| BE-16 | Time skips and consequence scenes | Not built | **Adapt** | "A bit later..." shown gently, never frightening; the consequence-flip idea in its kindest form |
| BE-17 | Cross-module memory | Partly built (scalar carry-over between missions) | **Reuse** | The squad remembers what you did; carry-over already links the before and after checks |
| BE-18 | Work task and interruptions | Partly built (mail scheduler) | **Adapt (later)** | The "work task" becomes normal play (a game, homework) interrupted by a test. Not in the defend-only shell; a later stretch |
| BE-19 | Open minigames from conversations | Partly built (the runner opens each stage; `#trigger_minigame` still a stub) | **Reuse** | Needed the same way; the real `#trigger_minigame` serves both games |
| BE-20 | Authorable tutorial, title, end screen | Not built (still Hacktivity and spy text) | **Reuse (when built)** | A child-friendly title and ending; a must before any child sees the game |
| BE-21 | Workplace music and sound | Not built | **Adapt** | A playful kids music and ambience set (new audio, reuses the system) |
| BE-22 | Tactic spotter card | Built differently (triage red-flag chips) | **Adapt** | Chips become picture "trick cards" a child collects (hurry up!, "you have won!", pretending to be someone) |
| BE-23 | Pause and time scale | Partly built (scene pause only) | **Reuse** | Pause and slow timed pressure; the clock must stop too for younger players |
| BE-24 | Place-player action | Not built | **Reuse** | Same engine need |
| BE-25 | Course avatars and inclusive name entry | Partly built (chosen avatar wins, look-alike guard; name entry ASCII only) | **Adapt** | A kid avatar set (animals and children, diverse, no scary hoodies as the fallback); nickname only, no real name |
| BE-26 | Accessibility checks in CI | Not built | **Reuse (when built)** | Same guardrail |
| BE-27 | Plain English lint | Not built | **Adapt** | Re-tuned to a reading age of about 7, not 11 to 12 |
| BE-28 | Take an item from the player | Not built | **Reuse** | Hand the "found" thing to a grown-up, return a borrowed device |
| BE-29 | NPC guide behaviour | Not built | **Reuse** | The mascot walks ahead and waits; natural for a guide character |
| BE-30 | Video call options | Not built | **Adapt** | A kid-safe video-call skin for "is it really them?", no deepfake tells |
| BE-31 | Episode runner | Built | **Reuse** | The kids beat runner: defend-only variant (brief, defend, debrief) with the step strip |
| BE-32 | Flip view | Built | **Avoid / adapt gently** | No flip of a child's own attack; at most a gentle "what happened next" for no-attacker topics |
| BE-33 | Influence service | Built | **Avoid** | Not used as a manipulation meter for children |
| BE-34 | Channels and synced globals | Built | **Reuse** | Same message in a game chat and from a "friend" stays consistent |
| BE-35 | Mail scheduler and mail runner | Built | **Adapt** | Timed arrivals of pretend messages; no real messaging |
| BE-36 | Awareness-measure records | Built | **Reuse** | No free text, no identity: fits the no-child-data rule; teacher view aggregate only |
| BE-37 | Look-alike NPC guard and player avatar | Built | **Reuse** | The child's chosen avatar always wins |
| BE-38 | Social validator and CI | Built | **Adapt** | Re-pointed at a kids brand set, plus a reading-age check |
| BE-39 | Intel facts and readiness | Built | **Avoid (mostly)** | Only for "what can a stranger learn about you", defender framing |
| BE-40 | Phish rules engine and pretext judge | Built | **Avoid** | Judges attacks the child would write; not in the kids game |
| BE-41 | Role swap | Built | **Avoid** | No playing the other side for young children |
| BE-42 | Readable font | Built | **Reuse** | Source Sans 3, at a larger size |

Almost every MVP engine gap the awareness product still has is also a gap here, so **closing them once serves two products.** BE-19 (a real opener from ink), BE-03 (text and audio route), BE-04 and BE-26 (accessibility), BE-20 (an authorable shell), BE-23 (a pause that stops the clock) and BE-25 (avatars and name entry) are the shared backlog. BE-01, BE-02 and the episode runner are already there.

## 2. Minigames (MG)

| Id | Minigame | Built on main | For kids | Kid reskin |
|---|---|---|---|---|
| MG-35 | Inbox triage | Built | **Adapt** | The core "is it real?" sorter (section 0): Trust and Tell a grown-up, no Verify, picture trick cards |
| MG-36 | Mock authenticator | Built | **Adapt** | "Two keys are better than one": a gentle demo of a second check, no fatigue attack |
| MG-37 | Engagement report | Built (student lab only) | **Avoid** | An attacker's report; not for children |
| MG-01 | Inbox | Built differently (split into the attacker mail client and the defender triage, MG-35) | **Adapt via MG-35** | A kid message panel (game invites, prize messages) as triage cards; the attacker composer is not used |
| MG-05 | Messaging apps | Partly built (triage `sms` card, phone layout) | **Adapt** | Prize texts via the `sms` card now; a pretend group chat for kindness and "do not pass it on" is **New** |
| MG-06 | QR code scanner | Built differently (a decorative QR notice that encodes nothing) | **Reuse** | A sticker QR on a poster; encoding nothing is exactly right for children |
| MG-02 | Web browser | Partly built (OSINT browser, triage `page` card) | **Adapt** | "Is this website real?" and fake prize pages as `page` cards; scary pop-ups are **New** |
| MG-31 | OSINT browser | Built | **Adapt (defender framing only)** | "What can a stranger see about you?" over a pretend profile of your own avatar; never researching someone else |
| MG-32 | Intel board | Built | **Adapt (defender mode only) / Avoid recon and plan modes** | The defender mode (each exposed fact gets a fix) becomes "fix what you shared" |
| MG-13 | Social media / OSINT board | Built differently (MG-31 and MG-32) | **Adapt via MG-31 and MG-32** | Privacy, never an attack how-to |
| MG-07 | MFA prompts and authenticator | Partly built (attacker-side authenticator demo; triage `push` card) | **Adapt (push card only)** | "Two keys are better than one", very simplified; the attacker-side demo is not used |
| MG-08 | Password manager and passphrase builder | Not built | **Reuse (when built)** | "Three picture-words" passphrase; why a pet's name is guessable. **New** work, shared with the awareness E9 |
| MG-11 | Sharing settings | Not built | **Reuse (when built)** | "Who can see this?" for a photo or post. **New** work |
| MG-10 | Classification sorter | Not built | **Adapt** | "Secret or share?" sorting; could be built as a triage set with two verdicts rather than a new minigame |
| MG-16 | AI assistant chat | Not built; no runtime model allowed | **Adapt** | "Is the chatbot your friend?"; an authored ink chatbot only, never a live model |
| MG-20 | Knowledge check | Not built (the build uses pre and post checks instead) | **Adapt** | The badge quiz becomes a short picture sorter round, as the built checks do; picture answers for younger players |
| MG-21 | Video player | Not built (the build uses no video) | **Later, optional** | Short guide animations only if a world needs them; voiced concept cards first |
| MG-23 | Device settings | Not built | **Reuse (when built)** | Lock screen, app permissions, screen-time (the Byte-Size Heroes world). **New** work |
| MG-09 | Incident report form | Not built (Report is the one-click triage verdict) | **Reuse the one-click verdict** | "Tell a grown-up" is one tap, as Report is; no form for a child |
| MG-12 | Redaction | Not built | **New-ish** | Low priority for kids; maybe "hide the private bits of a photo" |
| MG-33 | Landing-page builder | Built | **Avoid** | Building a fake page is attack content |
| MG-34 | Pretext prep and template composer | Built | **Avoid** | Writing a trick message is attack content |
| MG-30 | Pretext workshop (attacker view) | Built differently (MG-33, MG-34 and the flip) | **Avoid** | Never for young children |
| MG-15, MG-17, MG-18, MG-19, MG-22, MG-24, MG-25, MG-28, MG-29 | Payments, caller/access/code review, supplier, crisis board, document/record viewers | Partly built or not built | **Avoid / not needed** | Workplace-specific; out of scope for children |

The cheapest, highest-value piece is already built: the triage sorter (MG-35) with its card kinds covers the Is It Real? world almost on its own. The other high-value minigames for children (passwords, sharing, device settings, spot-the-risk) are not built yet, and two of them (MG-08, BE-10) are also on the awareness product's list, so building them once serves both.

## 3. Explainers (EX) and the platform (HA)

| Id | Built on main | For kids | Note |
|---|---|---|---|
| EX-01 Mentor explainer | Partly built differently (a host NPC per scenario; the lab's support hub) | **Reuse** | The host becomes the mascot guide in the den; same short-chunk-plus-picture pattern via concept cards |
| EX-02 Engine-recorded video | Not built (the build uses no video) | **Later, optional** | Short animations with the game's own characters, only if a world needs them |
| EX-04 In-world documents | Partly built (existing notes and signs; the "REPORT IT" poster) | **Reuse** | Posters and a "safety wall"; the room poster becomes "TELL A GROWN-UP" |
| EX-05 Demonstration scenes | Partly built differently (the flip view and the authenticator demo, both attacker-side) | **Adapt** | Gentle "watch what happened" scenes, never scary, never seen from the trickster's side |
| EX-06 Attacker-view interludes | Built differently (the attack half of every full episode) | **Avoid** | Not for young children; kids use the defend-only shape |
| EX-07 Glossary and tooltips | Partly built differently (concept cards behind "What is this?") | **Reuse** | Kid-friendly word helper on the same cards; no hover-only text |
| EX-08 Poster and briefing pack | Not built | **Reuse (when built)** | Classroom posters and a parent one-pager |
| EX-09 Concept cards | Built | **Reuse** | The guide's picture cards behind a "What is this?" button |
| HA-01 Organisations | Not built | **Adapt** | Schools, not companies |
| HA-03 Assignments | Not built (the build uses ordinary missions in a collection, ordered by the organiser) | **Adapt** | A teacher orders the worlds for the class, as organisers order episodes and checks today |
| HA-05 Records, HA-06 Certificates | Not built (records stay in game) | **Adapt** | Badges and a printable certificate; the record belongs to teacher or parent, not a child account |
| HA-07 Policy acknowledgement | Not built | **Adapt** | A gentle class "safety promise" rather than a policy sign-off |
| HA-09 Dashboards | Not built (organiser-only figure, no league tables) | **Adapt (carefully)** | Aggregate class progress for teachers; no child-versus-child ranking (Children's Code) |
| HA-13 Facilitated sessions | Not built (in-game `facilitated` flag only) | **Reuse** | Whiteboard classroom mode |
| HA-14 Evaluation | Not built (in-game pre and post checks only) | **Adapt** | The gentle before-and-after, aggregate only, no effectiveness claims |
| HA-16 Localisation | Not built | **Reuse** | Needed across UK nations and beyond |
| HA-23 Accessibility | Not built | **Reuse** | Same guardrail |
| HA-26 Setup checklist | Not built | **Adapt** | A go-live checklist for a school, with the safeguarding and consent steps up front |
| HA-02 SSO, HA-10 LMS, HA-12 simulation, HA-18 licensing, HA-24 API, HA-25 partner | Not built | **New / later** | School-platform and commercial plumbing decided by the buyer question |

No HA feature is built, and the awareness product ships as ordinary missions in a collection. The kids game can start the same way. Children's data protection forces the most change on the platform side: no child accounts, teacher-or-parent-held records, aggregate-only views, consent and safeguarding baked into setup. This is a **modified** reuse of the awareness platform thinking, not a copy, and no platform change happens without the user's go-ahead.

## 4. Awareness-course *plans* that reuse directly

Beyond features, the awareness course and its build produced reusable *thinking*:

- **The built episode shape** (`../security_awareness_course/04_BUILT_SO_FAR.md`, R3): the kids game uses the **defend-only** form, **brief, defend, debrief**, with the kids beat names in `00_VISION_AND_SAFEGUARDING.md`. The full attack shape is not used.
- **The learning-design principles** (no blame; pair every threat with a doable action; process over cues; practice in context; spaced practice; accessibility by design): reuse almost unchanged, and they matter more for children.
- **The built assessment** (R6): scored only in the defend round, report never penalised, mirror pairs, pre and post checks with no pass mark, records with no free text and no identity. Surface as badges; keep any record with the adult.
- **The module template** (`../security_awareness_course/MODULE_TEMPLATE.md`): reuse the shape (card, concepts, game design, assessment) for each kids world, in its built-shape form.
- **The brand-set discipline** (`BRAND_SET.md`, R2 and R13): reuse the method (invented names, `.example` domains, learnable look-alikes only, a web search before release, linted). Build a new child-appropriate world, cast and invented games and apps.
- **The compliance-mapping discipline** (`02_COMPLIANCE_MAPPING.md`): reuse the method; swap the frameworks for Education for a Connected World, RSHE, Keeping Children Safe in Education, the Children's Code and PEGI (see `00_VISION_AND_SAFEGUARDING.md`).
- **The review process** (`docs/agents/AWARENESS_REVIEW_BRIEF.md`): reuse the adversarial-review loop; add a safeguarding reviewer and check the reading age and age-appropriateness, not workplace compliance.
- **The attacker view:** the build made attack-first the adult default, with defend-only as the opt-out (R5), and put the technical attacker lab in a separate student product. The mirror-image lesson for children is that the attacker view is **out of scope**; only defender-positive, defend-only content.

## 5. Topic translation: awareness modules to kid worlds

Which adult module's concepts (the source of truth lives in each module's `concepts.md`) and which built episode feed which kid world:

| Awareness module | Built episode to borrow the shape from | Kid world | What carries over (simplified) |
|---|---|---|---|
| core_03 Passwords and MFA | E3 push card (narrow); E9 proposed | Passwords and Secrets | Strong passphrases, do not share, two-step |
| core_05 Data protection / core_12 Social media | OSINT "reduce" notes in every attack half | Private and Proud | What is private, what a stranger can see, think before you post |
| core_01 Phishing / core_02 Social engineering | E6 texts and QR, E1 and E5 defend sets | Is It Real? | Dodgy messages, prizes, "you have won", stop and check |
| core_08 Safe web / core_07 Malware | E5 `page` cards | Is It Real? (web) | Scary pop-ups, fake pages, do not tap, tell an adult |
| core_15 AI and deepfakes | E7 voicemails | Is It Real? (AI) | Chatbots are not friends; pictures, voices and videos can be faked |
| core_09 Remote / core_13 devices | None | Device world (Byte-Size Heroes) | Lock screens, app permissions, screen balance |
| core_04 Reporting | Every debrief: report button, tally, no-blame line | Runs through everything | "Tell a grown-up you trust" is the hero move |
| (no adult equivalent) | None | Kind Online; Screen Balance | Bullying, kindness, wellbeing: **new ground**, needs original design and safeguarding review |

## 6. What must be built new (little to borrow)

- **Kindness, bullying and wellbeing** content: the awareness course does not cover it; this is the most original and most safeguarding-sensitive work.
- **Contact-risk / "people are not always who they say"** at a child-appropriate level, signposting to trusted adults and CEOP/Childline, reviewed by a specialist.
- **Kids verdicts and copy for the triage sorter:** the Trust and Tell a grown-up set, picture trick cards, "Next time" cards, child-word feedback.
- **Child-safe platform changes:** no child accounts, teacher-or-parent records, aggregate views, consent and safeguarding in setup.
- **New art, voice and music:** a child-friendly cast, the mascot, a den hub room, a playful sound set (reuses the engine, not the assets).
- **The minigames children need that nobody has built:** passphrase builder (MG-08), sharing settings (MG-11), device settings (MG-23), spot-the-risk (BE-10).
- **An early-years mode** (Cyber Cubs), if pursued: a simpler engine use and its own art.
- **Curriculum and safeguarding mapping** and teacher/parent guides.

## Bottom line

The episode runner, the triage sorter, the report button and tally, the debrief, the measurement records and the before-and-after design are **already built** for the awareness product, and a kids game can use them as a defend-only sibling of "Incident Simulations: Critical Cases". So a first playable "Is It Real?" world is far cheaper than it would be from scratch. The new cost is concentrated in child-appropriate content (especially kindness, wellbeing and contact risk), the unbuilt kids minigames, new art and voice, the child-safe platform, and the safeguarding and curriculum work that has to come first.
