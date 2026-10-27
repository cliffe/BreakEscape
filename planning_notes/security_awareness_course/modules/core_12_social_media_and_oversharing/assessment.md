# core_12 assessment

The built product scores two things: the **defend half** of the episode (the `awareness` profile, 60 for the verdict, 40 for naming the real flags, reporting never penalised) and the **pre and post check forms** (10 items, `passPercent` 0). There is no default pass mark. Per-item records (id, form, verdict, chips, score, stage, variant, time) go to the awareness-measure store; no free text and no learner identity are held. A discrimination figure goes to organisers only. The product makes no effectiveness claim.

This file maps the module's behaviours and question items onto **defend items** (in the episode's defend set) and **check items** (in the general check forms), with **mirror pairs** so that a pre-check item has a matched post-check item of the same shape.

## Assessed behaviours as defend and check items

The behaviour ids are kept. Each is now evidenced by a defend item or a check item, not by a Secure / Developing / Not yet rubric; the "developing" ground is covered by partial flag scores and by the Verify verdict where a set uses it.

| Id | Behaviour | Learning outcome | Evidenced by |
|---|---|---|---|
| C12-B1 | Reads what a post gives away | LO2 | Pre and post check items (a "what could help an attacker in this post?" item); the attack board in the episode |
| C12-B2 | Reads the OSINT board | LO1 | The attack half (unscored); its reduce notes feed the defend flags |
| C12-B3 | Judges posts in the feed | LO2 | Defend items: feed cards (Post / Tweak / Hold) |
| C12-B4 | Tightens a profile's settings | LO3 | Defend items: the privacy-settings surface (each setting closes a found fact) |
| C12-B5 | Handles the fake recruiter | LO4 | Defend item: the recruiter card (Report / Delete / Trust); check item |
| C12-B6 | Handles the senior impersonation | LO4 | Defend item: the fake-profile card; check item |
| C12-B7 | Keeps work talk within policy | LO5 | Defend items (feed) and check item (who speaks for the organisation) |

**Before and after.** The matched measure for each learner is the pre-check against the post-check on the social-media items (the same judgement, before and after the episode), plus the first-answer records inside the defend half. The pre-check is a separate mission played before the episodes; the post-check, after, shows the change.

## Critical behaviours as mirror pairs

The built checks pair items (aw5): a phish and its matched genuine item, and an A-form item and its B-form mirror of the same shape and difficulty. The module's critical behaviours become paired items rather than loop-backs:

- **C12-CB1 Tighten a profile's key settings:** evidenced by the privacy-settings defend items; mirrored across the feed items that show the same risk (a locked profile against an open one).
- **C12-CB2 Decline and report a stranger's request for information about the organisation:** the recruiter card is paired with a genuine recruiter item of the same shape, so declining-and-reporting is distinguished from refusing everything.
- **C12-CB3 Correctly hold or tweak a clearly risky post:** each risky feed item is paired with a genuinely safe one, so over-caution (holding the safe post) is visible and is never penalised as a miss.

There is no loop-back and no default pass mark. A learner who misses an item meets a *similar* item next (the author places one), not a retry of the same one; the first answer is the one recorded.

## Item pool: check forms and defend set

The question bank is kept as a pool of candidate items. Each becomes a defend item, a check item, or both, and items are written as **mirror pairs** (an A item and a matched B item). Stems are short workplace situations.

### C12-Q1 (LO1, LO2): defend feed item and check item

A colleague posts a public "first day!" photo. Which parts could help an attacker? Choose all that apply.

- **A. Their lanyard and badge are visible.** *A badge shows the employer and often the access level.*
- **B. A monitor with an email open is in the background.** *Screens can reveal names, systems and content.*
- **C. A whiteboard behind them names a system and a go-live date.** *A system name and a date are a gift for a pretext.*
- D. They look happy. *Looking happy is not a security risk.*

Mirror: the B-form item is the same shape on a conference selfie (a visitor pass, a client name on a banner, a project nickname).

### C12-Q2 (LO1): check item

How does an attacker usually turn someone's public posts into an attack?

- A. By hacking the social network. *No hacking is needed; the information is already public.*
- **B. By joining up public details into a convincing phishing email or pretext call.** *A manager's name, a system and a holiday make a scam believable.*
- C. By commenting on the person's photos. *That is not the usual route.*
- D. They cannot, if the person has many followers. *More followers does not make posts safer.*

Mirror: a B-form item asking how a holiday post plus a manager's name becomes a pretext call.

### C12-Q3 (LO3): check item

You want to keep using social media but reduce the risk. What is the most useful first step?

- **A. Review who can see your posts, tags, connections and old content, and limit location sharing.** *Tightening privacy settings cuts off most of what an attacker gathers.*
- B. Delete your account. *You do not have to; tighten settings and think before posting about work.*
- C. Stop posting photos of your pets. *Pets are fine; just keep them out of your security answers.*
- D. Set a stronger password only. *A strong password and MFA help, but review your privacy settings too.*

### C12-Q4 (LO4): defend recruiter item and check item

A recruiter messages you about an exciting role and, "to tailor the application", asks for an overview of your firm's systems and who runs IT. What do you do?

- A. Send it; it shows you are keen. *A genuine recruiter does not need your firm's systems or org chart. This is reconnaissance.*
- **B. Decline, share nothing about systems or people, and report the profile.** *Right.*
- C. Share a little to keep them interested. *Even a little helps build a pretext.*
- D. Ask colleagues to send it instead. *Do not pass the request on; decline and report.*

Mirror: a genuine agency recruiter with a matching domain, so the right move for the phish (Report) is distinguished from refusing a real contact.

### C12-Q5 (LO3): check item (true or false with reason)

"Using my dog's real name as a security-question answer is fine, because only I know it."

- A. True. *Pets' names are often posted publicly, so they are easy to find.*
- **B. False: use a made-up answer kept in your password manager.** *Right.*

### C12-Q6 (LO2): defend feed item and check item

You are about to post a team photo taken in the office. What should you check first?

- **A. Whether any badges, screens, whiteboards or documents are visible, and crop or retake if so.** *Check the background before you post.*
- B. Whether everyone is smiling. *Not a security matter.*
- C. Whether you have enough followers. *Not relevant to the risk.*
- D. Nothing; office photos are always fine. *Office photos often catch screens and whiteboards.*

### C12-Q7 (LO5): check item

A news site asks you, as an employee, to comment on a story about your firm. What should you do?

- A. Give them a quick quote; you know the facts. *Most staff are not authorised to speak for the organisation.*
- **B. Pass it to the communications team and do not comment yourself.** *They speak for the organisation.*
- C. Post your own view online instead. *Posting as if you speak for it is not your call; refer it on.*
- D. Ignore it and tell no one. *Pass it to communications so they can respond.*

### C12-Q8 (LO4): defend fake-profile item and check item

You get a connection request from a profile in your managing partner's name, but the account is new and has few connections. What is the best response?

- A. Accept it; it is the partner. *A new account in a senior leader's name is a common impersonation.*
- **B. Do not accept it; report it as a possible fake profile.** *Fake senior profiles lend weight to later scams.*
- C. Message them to ask if it is really them. *Check through a known channel, and report the profile.*
- D. Accept it but do not message them. *Do not accept a likely fake; report it.*

### C12-Q9 (LO1): check item

Why can a "we're away for two weeks" holiday post be a problem for work?

- **A. It can signal that an office is short-staffed, which helps a scammer time an approach.** *Patterns of who is away are useful to an attacker.*
- B. It is never a problem. *Combined with other details, it helps build a pretext.*
- C. Only if you name the airline. *The "away" signal itself is the issue.*
- D. Only managers need to worry. *It applies to everyone.*

## Reflection prompt

- "If someone spent ten minutes looking at your public posts, what could they learn about where you work and how to reach your colleagues?"
- For facilitated sessions: "Where is the line, for us, between a normal life online and giving an attacker a head start?"

## Completion

A run is complete when the learner has played the episode (or the defend-only variant, or the text route). Scoring lives only in the defend half and in the checks. There is no default pass mark; an organisation may set a pass mark on the post-check percent as a later option, through the platform, not in this plan.

## Evidence for auditors

The awareness-measure record holds, per item: the item id, the form, the learner's verdict, the chips ticked, the item score, the stage (pre, post or episode), the variant and the time to answer. It holds no free text and no learner identity (the actor is added by the caller). Completion, and the before-and-after change for a cohort on matched items, support:

- NIST SP 800-53 Rev 5 AT-2(3);
- CIS Controls v8.1 14.2 and 14.6;
- ISO/IEC 27001 Annex A 5.10 and 6.3, clause 7.3;
- NCSC CAF B6.

## Measuring effect

The product claims only a before-and-after change on matched items for a cohort, with no effectiveness claim. Outside the course, an organisation can watch (kindly, never by named individual, and never by monitoring personal accounts): reports of fake profiles and suspicious approaches (should rise), oversharing incidents (should fall), and spear-phishing success against the organisation (links to core_01 measures).
