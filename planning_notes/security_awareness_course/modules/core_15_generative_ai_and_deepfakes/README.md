# core_15: Generative AI and deepfakes

**Working game title:** The Assistant (episode E13)
**Pitch:** Brightwell has just switched on its own AI assistant. Use it to get a report out by four, and find out what it's good at, what it makes up, and why the most convincing version of the chief executive you'll ever meet isn't him.

| | |
|---|---|
| Audience | All staff (built role: general / everyone) |
| Prerequisites | core_00 recommended; core_01 helpful (phishing basics) |
| Full episode | about 13 to 14 minutes |
| Defend-only variant | about 8 minutes |
| Pre and post check | 4 to 5 minutes each (general role forms) |
| Priority | Phase 2 (proposed episode E13 in the build's own order) |
| Build size | M. Reuses the voicemail player, the video-call mode, inbox triage and the flip; new work is the authored AI-assistant surface |

## Build status

**Builds on E7 and E4 voice, as E13.** The build already covers part of this topic: E7 (Brightwell Foods) is a cloned-CEO-voice episode, E4 (Merrin & Sallow) uses voicemails, and both carry a `voicePanel` concept panel. Against this module, that built work covers:

- **C15-LO5** (voices can be faked, so verify through a trusted channel) and part of **LO6** (reporting a deepfake attempt).

This episode is the planned **E13, the authored AI assistant** (`../../04_BUILT_SO_FAR.md` §4). It extends the E7 and E4 voice work with the "what goes in / what comes out" half that the build is missing.

**New in this module:**

- the AI assistant itself, **authored, with no runtime language model** (decision P): all replies, the invented figure, the unsupported claim and the hidden-instruction summary are authored data or ink, for **C15-LO1, LO2, LO3**;
- prompt injection as a triage item, for **C15-LO4**;
- the full verify-another-way habit, for **C15-LO5** and **LO6**.

The episode is proposed as a full episode, a defend-only variant and new general check items. It is not yet built: the awareness product is on hold.

## Why this module

Generative AI tools now sit inside everyday work: drafting, summarising, translating, taking meeting notes. Staff need three things from training, and none of them is "never use AI".

- **What goes in.** Anything typed into a public AI tool goes to someone else's computer. The NCSC's advice since 2023 is not to include sensitive information in queries to public tools, because queries are visible to the provider, are stored, and will almost certainly be used to develop the service.
- **What comes out.** AI tools present wrong statements as fact, including references that don't exist, and can repeat bias. In June 2025 the High Court of England and Wales warned lawyers after court papers cited cases that didn't exist; in one of the two cases, 18 of 45 citations were fictitious. Whoever sends the output is responsible for it.
- **Who is really asking.** Attackers use the same tools to write fluent messages and to fake voices and faces. In 2024 the NCSC assessed that generative AI would make it difficult for everyone to tell whether an email or password reset request is genuine.
  - **Arup, 2024.** An employee in the engineering firm's Hong Kong office made 15 transfers totalling about £20 million after a video conference in which the company's chief financial officer and other colleagues were all deepfakes.
  - **LastPass, 2024.** An employee received WhatsApp calls, texts and a voicemail with an audio deepfake of the chief executive. It came outside normal channels and pushed urgency, so the employee ignored it and reported it. There was no impact.

The defence that works is not spotting the fake. It is checking another way: hang up, call back on a number you already have, ask a second person. For organisations within the EU AI Act's scope, the module also contributes to the AI literacy measures expected of providers and deployers (Article 4).

## Target behaviours

1. **Uses AI tools within the rules.** Puts work information only into approved tools, and only what each tool is approved for: never passwords or secrets, and nothing of the organisation's in a public one. Takes out what the task doesn't need.
2. **Checks AI output before using it.** Checks facts, figures, references and claims about people against the source, and treats what they send as their own.
3. **Checks unusual requests another way.** For anything unusual, urgent, secret, or involving money, data or access, verifies through a known channel before acting, however real the person looks or sounds, and reports attempts.

## Learning outcomes

After this module, staff can:

- **C15-LO1** Tell an approved AI tool from a public one, and decide what may go into each.
- **C15-LO2** Prepare text for an AI tool by removing what the task doesn't need.
- **C15-LO3** Check AI output for made-up facts, figures and references and for unfair claims about people before using it, and accept that they are accountable for what they send.
- **C15-LO4** Treat instructions that an AI assistant picks up from emails, documents or web pages (prompt injection) as untrusted, and check before acting on its suggestions about money, access, data or links.
- **C15-LO5** Recognise that voices, faces and writing can be faked convincingly, and verify unusual requests through a channel they already trust rather than judging by look or sound.
- **C15-LO6** Report a deepfake attempt, a suspicious AI suggestion or an AI data slip (their own or a colleague's) through the organisation's route.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2):

- **AI Act Art 4** (AI literacy, as amended from 27 July 2026), for customers within the EU AI Act's scope. The module's record is the organisation's internal record of a measure taken; the Commission's Q&A says no certificate is needed.
- **PCI DSS 12.6.3.1** (phishing and social engineering, here the deepfake call and voice note).
- **NIST AT-2**, **AT-2(3)** (social engineering and mining) and **AT-2(6)** (the current threat environment).
- **CIS 14.2** (recognising social engineering), **CIS 14.4** (data handling) and **CIS 14.5** (unintentional data exposure).
- **ISO 27001 A.6.3**.
- **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **DORA Art 13(6)**.
- **UK GDPR Art 5(1)(f)** and **Art 32(4)**: putting personal data into an AI tool is processing it.
- **NYDFS 500.14(a)(3)** and the NYDFS industry letter on AI, for New York financial services customers.
- **DSPT 3.2.1 (categories 3 and 4)**.
- **PCI DSS 12.6.3.2** (acceptable use of end-user technologies): to be added to the mapping's row for core_15.

## Module flow

One training-room mission, with the pre-check and post-check as the bracketing missions.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | 10-item general check form, before the episodes | 4 to 5 |
| Brief and scope note | "Authorised exercise at Brightwell Foods (fictional). Use the new assistant for real work; some of today is a test." | 1 |
| The assistant (what goes in) | Prepare a document for the authored assistant: strike out a password and a child's health detail before pasting; the assistant answers from authored data | 2 |
| The assistant (what comes out) | The assistant drafts a report with one invented figure and one unsupported claim; "Check source" against the document | 2 |
| The demo (announced) | A video call "from the host" asks for a sign-in code; the real host leans round the screen: same face, same voice, made from a public talk. "You don't need to spot a deepfake. You need to check another way." | 1 |
| Defend | Triage: a supplier email with hidden instructions for the assistant, a cloned-voice voicemail, a deepfake video call from the CEO, and a colleague pasting into a public tool; scored under the `awareness` profile | 3 to 4 |
| Debrief | Per-item reasoning, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line; "where the fakes came from", names not steps | 1 to 2 |
| Post-check (separate mission) | The parallel general check form, after the episodes; shows the change | 4 to 5 |

## Setting and host

- **Company:** Brightwell Foods (`brightwellfoods.example`, brand set), a food manufacturer; it hosts E1 and E7, so its cast and the cloned-CEO voice are already set. This episode extends E7.
- **Host:** Gwen Pritchard, IT service desk lead, who welcomes the learner, runs the teaching through per-item feedback, and is the subject of the announced deepfake demo (with her permission in the fiction).
- **The deepfakes reuse the real cast:** Ravinder Sandhu (the CEO cloned in E7) on the video call; Adaeze Okafor (finance manager) alongside him; Tom Reilly (accounts payable clerk) as the cloned-voice voicemail. Separate NPC ids with identical art and voice settings, so nothing gives them away but the request and the channel.
- **The assistant:** "Brightwell Assist", a friendly pixel robot, chat avatar and text only, so it never sounds like a person. Authored data only, no runtime language model.

## Systems reused

- the **voicemail player** (the cloned-voice voicemail, with a transcript);
- the **video-call mode** with the workplace skin (the demo and the Project Heron call), with a Leave button and participant tags;
- **inbox triage** for the supplier email (with a "show hidden text" action) and the colleague's public-tool paste;
- the **flip**/announced-demo empathy beat;
- **awareness-measure** records.

New: the authored AI-assistant surface (a chat window with a paste panel to strike out lines before sending, classification tags, a "Check source" action on each claim, and a "summarise my emails" mode). All its replies are authored, with no runtime language model.

## Organisation-specific content

- The approved AI tools, and what each may be used for, by information class.
- The name and link of the AI acceptable use policy.
- The route for reporting an AI data slip or a deepfake attempt (fills `slot:customer_report_route`).
- The verification rules for unusual requests: call-back to directory numbers, a second person, and whether executives use a verification phrase.
- The name of the organisation's meeting platform, and whether it labels outside participants.
- Whether the organisation is within the EU AI Act's scope, for the Article 4 record.
- Personal-life signposting: Report Fraud, Police Scotland on 101, and 7726 for scam texts.

## Open questions

1. **Scripted or live AI?** Scripted, deterministic, authored replies (no runtime language model), so every learner meets the same invented figure and the same hidden instruction and the assessment is fair. A live model is not used.
2. **Should the fakes glitch?** No. The fake CEO, finance manager, colleague and host use exactly the real characters' portraits and voices. The cues are the request and the channel.
3. **The host's demo.** Kept, announced in advance, made with the host's permission in the story, and explained straight away.
4. **Data or money in the fake call?** Data (the customer list), so payment processes stay in core_11. The Arup money case stays in `concepts.md`, and a money version suits role_02.
5. **Verification phrases.** Teach call-back and a second person as the core; present a verification phrase as an organisation option, and a family code word for home.
6. **How much of the EU AI Act learners see.** None of the law in play; the reference card and field guide carry the Article 4 note for buyers.
