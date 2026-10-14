# core_15: Generative AI and deepfakes

**Working game title:** The Assistant
**Pitch:** Larkspur has just switched on its own AI assistant. Use it to get a client report out by four, and find out what it's good at, what it makes up, and why the most convincing Gillian you'll ever meet isn't her.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended; core_01 helpful (phishing basics) |
| Full module | 15 to 16 minutes |
| Micro-drill | 4 minutes ("Paste or Pause?") |
| Text route | 11 minutes |
| Priority | Phase 2 |
| Build size | M, driven by the AI assistant chat (MG-16) and the changes the video-call mode needs; no new rooms |

## Why this module

Generative AI tools now sit inside everyday work: drafting, summarising, translating, taking meeting notes. Staff need three things from training, and none of them is "never use AI".

- **What goes in.** Anything typed into a public AI tool goes to someone else's computer. The NCSC's advice since 2023 is not to include sensitive information in queries to public tools, because queries are visible to the provider, are stored, and will almost certainly be used to develop the service.
- **What comes out.** AI tools present wrong statements as fact, including references that don't exist, and can repeat bias. In June 2025 the High Court of England and Wales warned lawyers after court papers cited cases that didn't exist; in one of the two cases, 18 of 45 citations were fictitious. Whoever sends the output is responsible for it.
- **Who is really asking.** Attackers use the same tools to write fluent messages and to fake voices and faces. In 2024 the NCSC assessed that generative AI would make it difficult for everyone to tell whether an email or password reset request is genuine.
  - **Arup, 2024.** An employee in the engineering firm's Hong Kong office made 15 transfers totalling HK$200 million (about £20 million) after a video conference in which the company's UK-based chief financial officer and other colleagues were all deepfakes.
  - **LastPass, 2024.** An employee received WhatsApp calls, texts and a voicemail with an audio deepfake of the chief executive. The contact came outside normal business channels and pushed urgency, so the employee ignored it and reported it. There was no impact.

The defence that works is not spotting the fake. It is checking another way: hang up, call back on a number you already have, ask a second person. For organisations within the EU AI Act's scope, the module also contributes to the AI literacy measures expected of providers and deployers of AI systems (Article 4).

## Target behaviours

1. **Uses AI tools within the rules.** Puts work information only into approved tools, and only what each tool is approved for: never passwords or secrets in any tool, and nothing of the organisation's in a public one. Takes out what the task doesn't need.
2. **Checks AI output before using it.** Checks facts, figures, references and claims about people against the source, and treats what they send as their own.
3. **Checks unusual requests another way.** For anything unusual, urgent, secret or involving money, data or access, verifies through a known channel before acting, however real the person looks or sounds, and reports attempts.

## Learning outcomes

After this module, staff can:

- **C15-LO1** Tell an approved AI tool from a public one, and decide what may go into each (personal data, confidential and client information, passwords and secrets).
- **C15-LO2** Prepare text for an AI tool by removing what the task doesn't need.
- **C15-LO3** Check AI output for made-up facts, figures and references and for unfair or unsupported claims about people before using it, and accept that they are accountable for what they send.
- **C15-LO4** Treat instructions that an AI assistant picks up from emails, documents or web pages (prompt injection) as untrusted, and check before acting on its suggestions about money, access, data or links.
- **C15-LO5** Recognise that voices, faces and writing can be faked convincingly, and verify unusual requests through a channel they already trust (a call back on a known number, a second person, an agreed phrase) rather than judging by look or sound.
- **C15-LO6** Report a deepfake attempt, a suspicious AI suggestion or an AI data slip (their own or a colleague's) through the organisation's route.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md` when it is written):

- **EU AI Act Article 4** (AI literacy), for customers within the Act's scope. Article 4 has applied since 2 February 2025. It was amended by Regulation (EU) 2026/1744, in force from 27 July 2026, so that providers and deployers take measures to support the AI literacy of staff and others using AI systems on their behalf, without being required to guarantee any particular level for any individual. The European Commission's Q&A says no certificate is needed and that organisations can keep an internal record of training; the module's record (HA-05) is that record.
- **ISO/IEC 42001** clauses 7.2 and 7.3 (competence and awareness), for customers with an AI management system.
- **ISO/IEC 27001** clause 7.3 and Annex A 6.3 (awareness), 5.10 (acceptable use), 5.12 (classification) and 5.14 (information transfer).
- **PCI DSS** 12.6.3.1 (phishing and related attacks and social engineering) and 12.6.3.2 (acceptable use of end-user technologies).
- **NIST SP 800-53** AT-2(3) (social engineering and mining).
- **CIS Controls v8.1** 14.2 (recognising social engineering) and 14.4 (data handling best practices).
- **NIS2** Article 21(2)(g) (basic cyber hygiene practices and training).
- **NCSC CAF** B6 (staff awareness and training).
- **UK GDPR** Articles 5(1)(c) and 32 (data minimisation and security), because putting personal data into an AI tool is processing it.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Monday: Lark Assist goes live. Lena asks for a summary of the schools complaints log. What the player pastes is the baseline: the log contains a pupil's health details and a password a complainant typed into her email | Game (MG-16) | 1.5 |
| Learn | Ama at the player's desk: approved or public, what goes in, check what comes out. Then a demo she announces: "Ama" on a video call asks for the player's sign-in code, and the real Ama leans round the screen | NPC explainer (EX-01, BE-08) and video call | 3 |
| Practise | "Paste or Pause?": five snippets to paste, trim or keep out of an approved or a public tool, then three drafts with one wrong claim each to find and check | Minigame (MG-16 practice mode) | 3 |
| Apply | Tuesday, report due at four: a contract to paste, Lark Assist's draft (an invented figure and an unfair line), a supplier email with hidden instructions, Martin and a free chatbot, a voice note from "Leo", and a video call from "Gillian" and "Hassan" | Game (MG-16, MG-01, video call, `phone-chat`, BE-18) | 5 |
| Debrief | "Real or fake?": every message and call of the afternoon, stamped real, fake or made up; Kai on where the fakes came from, in a minute and with no how-to | Debrief screen (BE-02) and Ama, Kai | 1.5 |
| Check | Six scenario questions | Quiz (MG-20) | 1.5 |
| Reference | Reference card on The Lark: what goes in, check what comes out, check another way, report it | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Video calls:** `person-chat` video-call mode (`public/break_escape/js/minigames/person-chat/person-chat-ui.js`, `initVideoCallOverlay`), opened by an event mapping with `conversationMode: "video-call"` (`public/break_escape/js/systems/npc-manager.js`), which works for any NPC type, including phone contacts with no sprite in the world. m02's video calls from Ghost (`on_recovery_console` in `scenarios/m02_ransomed_trust/scenario.json.erb`) are a working example. Multi-speaker scenes already work: `person-chat-minigame.js` indexes every NPC in the scenario, so "Gillian" and "Hassan" can both speak in one call and the main frame follows the speaker.
- **The voice note:** `phone-chat` plays any contact line that starts with `voice:` through TTS in that contact's own `voice` settings, with a transcript underneath (`phone-chat-ui.js`). Giving the unknown number Leo's exact voice settings makes the fake sound exactly like Leo, which is the lesson.
- **Deliberately not reused:** the `voice.fx` distortion chain (`README_scenario_design.md`, "Voice FX"). A distorted fake would teach the unreliable cue.
- **An AI character in ink:** m08's AI receptionist ATHENA (`scenarios/m08_the_mole/ink/m08_receptionist_ai.ink`) is a precedent for writing an assistant's voice in ink; its tone isn't reused.
- **Rooms:** `room_office` (the player's desk), `room_break` (Martin's laptop), `room_security` (Kai's debrief). No new rooms.
- **Documents:** `notes` and `text-file` for the complaints log, the contract and the policy pages the player checks claims against.

## New features needed

- **MG-16 AI assistant chat:** the core of the module. A chat window with a paste panel where the player can strike out lines before sending (sharing the strike-out component with MG-12 Redaction), classification tags on documents, two skins (the approved assistant and a public chatbot website), scripted replies, a "Check source" action on each claim, and a "summarise my emails" mode. It records what was pasted by type, what was checked and what was sent.
- **MG-01 Inbox:** the launch email, the supplier's email and the meeting invite, with a "show hidden text" action that reveals white-on-white text in an email (accessible as a button, not only by selecting text).
- **MG-04 Voice calls:** ringing Gillian back on the directory number and Leo on his saved number (`phone-chat` contacts until then).
- **MG-05 Messaging apps:** the unknown-number styling for the voice note.
- **BE-08 Visual aids, EX-01, EX-05:** Ama's two-window comparison and traffic lights, and Kai's short "where the fakes came from" scene.
- **BE-18, BE-16, BE-19:** the report deadline, the Thursday consequence, and MG-16 and the video call opening from a chat message or an invite.
- **BE-01, BE-02, MG-20, BE-09, BE-05:** the record, the debrief, the check, the reference card, and the organisation's own AI rules.
- **proposed:** Workplace video-call skin. The video-call mode needs these changes before an awareness module can use it:
  1. The status bar's "SECURE VIDEO LINK" label is hard-coded in `initVideoCallOverlay`. Read the call app's name from the event mapping (`callApp`), defaulting to the organisation profile's meeting app (BE-05, "Larkspur Meet"), so a call on an outside platform shows a different name.
  2. A `theme: "workplace"` option that drops the green pixel frame and the scanline overlay (`.person-chat-root.video-call-mode` and its `::after` rule in `public/break_escape/css/person-chat-minigame.css`) and uses the course's interface font. The scanlines matter most: "glitchy" footage is exactly the unreliable cue the course tells people not to rely on.
  3. Participants. The peer name is set once from the NPC that opened the call; a group call needs a strip of participant names, an optional "External" or "Guest" tag, and the current speaker highlighted.
  4. A meeting header with the title, the organiser and the join link, so the link's domain is visible.
  5. A **Leave call** button that is always available and emits an event (for example `video_call_left:<npcId>`), so ending a call is a recorded decision that can lead straight to the call-back step.
  6. An in-call chat panel for links ("it's in the chat").
  7. The pulsing LIVE dot respects reduced motion (BE-04); the self-view can show "camera off".
  8. Screen sharing for BE-08, so a document can be shown in the call.

## Organisation-specific content

- The approved AI tools, and what each may be used for, by information class.
- The name and link of the AI acceptable use policy.
- The route for reporting an AI data slip or a deepfake attempt.
- The verification rules for unusual requests: call-back to directory numbers, a second person, and whether executives use a verification phrase.
- The name of the organisation's meeting platform (for the video-call skin), and whether it labels outside participants.
- Whether the organisation is within the EU AI Act's scope, for the Article 4 record.
- Personal-life signposting for the reference card: Report Fraud (England, Wales and Northern Ireland), Police Scotland on 101, and 7726 for scam texts.

## Open questions

1. **Scripted or live AI in MG-16?** *Recommendation: scripted, deterministic replies, so every learner meets the same invented figure and the same hidden instruction and the assessment is fair. A live model could come later as optional free play, never in the assessed path.*
2. **Should the fakes glitch?** *Recommendation: no. The fake Gillian, Hassan, Leo and Ama use exactly the same portraits and voices as the real ones. The cues are the request and the channel.*
3. **Ama's demo.** Is a fake of the mentor a trick on the player? *Recommendation: keep it, announced in advance ("Kai's going to call you; do whatever you'd normally do"), made with Ama's permission in the story, and explained straight away.*
4. **Data or money in the fake call?** *Recommendation: data (the customer list), so payment processes stay in core_11. The Arup case, a money transfer, stays in `concepts.md`, and a money version suits role_02.*
5. **Verification phrases.** *Recommendation: teach call-back and a second person as the core; present a verification phrase as an organisation option, and a family code word for home life.*
6. **The amended Article 4 wording.** EUR-Lex couldn't be read when this plan was written. *Recommendation: check the Official Journal text before the field guide or any buyer material quotes it.*