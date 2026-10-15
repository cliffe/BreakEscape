# Vision and safeguarding

## Who it is for

- **Core audience: children aged 7 to 11 (Key Stage 2).** Old enough to read short sentences, play a tile-based game and make choices; young enough that habits are still forming. This is the sweet spot and the first target.
- **Stretch audience: 11 to 14 (Key Stage 3),** with harder topics (group-chat pressure, sharing images, scams that use money or in-game currency, is-this-real judgement) in a slightly older-feeling skin.
- **Too young for the full game: under 7.** A cut-down "early years" mode (5 to 7) is possible later: audio-first, no reading required, three or four very short activities. Noted as a later option, not the first build.
- **The adults around the child are a second audience:** teachers who run it on a classroom whiteboard, and parents who play it with a child at home. They need a short guide, not training.

Because reading ability varies hugely across this range, the game is **audio-first with text**: every line is voiced (Break Escape already has text to speech with transcripts) and nothing important depends on fast or fluent reading.

## The learning spine

Children's online safety in the UK has a ready-made spine: the UK Council for Internet Safety's **Education for a Connected World** framework (used across schools), plus the computing and RSHE (relationships, sex and health education) curricula. Its eight strands map cleanly onto game worlds:

| Connected World strand | In the kids game |
|---|---|
| Self-image and identity | Who you are online, avatars, not everyone is who they say |
| Online relationships | Being kind, group chats, people you have not met |
| Online reputation | What you post stays; what others can see |
| Online bullying | Spotting it, not joining in, telling someone |
| Managing online information | Is this real? adverts, prizes, fake news, chatbots |
| Health, wellbeing and lifestyle | Screen time, taking breaks, how games keep you playing |
| Privacy and security | Passwords, private information, device settings, dodgy links |
| Copyright and ownership | Whose picture, whose work, asking first |

The security-heavy strands (privacy and security, managing information) are where Break Escape's existing minigames and the awareness-course plans transfer most directly. The wellbeing and relationships strands are newer ground and need the most original design and the most care.

Comparable products to learn from and differ from: Google and Parent Zone's **Be Internet Legends / Interland**, the NCA-CEOP **Thinkuknow** resources (Jessie and Friends, Band Runner, Play Like Share), **Childnet** and **NSPCC Share Aware**. Most are short, single-mechanic activities or animations. Break Escape's advantage is a connected world with characters, consequences and a debrief, not a set of disconnected games.

## The one habit

The awareness course teaches adults *Pause. Check. Report.* The children's version keeps the same shape, with "report" expressed as the thing a child can actually do:

> **Stop. Think. Check with a grown-up you trust.**

Everything rewards stopping, thinking and telling a trusted adult, and nothing ever makes a child feel stupid for having clicked, shared or believed something. Telling someone is always the hero move, exactly as reporting is for adults.

## The learning design (reused, re-pitched)

The awareness course's seven-beat module pattern (`../security_awareness_course/01_LEARNING_DESIGN.md`) works for children with gentler names and shorter beats:

| Adult beat | Kids beat | Minutes |
|---|---|---|
| Hook | **Something happens** (a message, a pop-up, a new "friend") and the child chooses | under 1 |
| Learn | **The guide explains** in one short, voiced idea with a picture | 1 to 2 |
| Practise | **Have a go** (a small minigame) | 2 to 3 |
| Apply | **Your turn for real** inside a normal play session, with the test arriving unannounced | 3 to 5 |
| Debrief | **What happened** (kind, never a telling-off) | 1 |
| Check | **Quick quiz** for a badge | 1 |
| Reference | **A badge and a poster** to keep | under 1 |

The learning-design principles carry over almost unchanged and matter even more for children: pair every scare with a doable action; never blame; no fear without a response; practice in context; process over cues ("you cannot always tell, so stop and ask" rather than "spot the bad spelling"). Assessment stays evidence-centred underneath (the engine's assessed decisions), but the child only ever sees **badges and belts**, never "developing" or "not yet".

## Safeguarding and data protection come first

For anything aimed at children, this is the make-or-break, not a footnote. The design rules below are non-negotiable and shape every later choice (especially the platform side).

1. **Collect no personal data from a child.** No child accounts, no email, no real names required (an avatar and a chosen display nickname only). Any learning record belongs to the teacher or parent, not to a child-identifying account. This follows the ICO's Age Appropriate Design Code (the Children's Code) and its data-minimisation and high-privacy-by-default standards.
2. **No real communication.** No real chat, no user-to-user messaging, no real external links, no sharing out of the game. Every message, "friend", website and chatbot in the game is fictional and sandboxed, as in the awareness course.
3. **No commercial pressure.** No adverts, no in-app purchases, no loot boxes, no "nudge" techniques or dark patterns, no engagement-maximising streaks that pressure a child to keep playing. (Teaching children to recognise these is a topic; using them is not allowed.)
4. **No frightening or graphic content, and careful handling of contact risks.** Stranger-contact and grooming awareness is taught at the level of "someone online is not always who they say, and if something feels wrong you tell a trusted adult", never with graphic or scary scenarios. Hard topics signpost to trusted adults and to CEOP and Childline, and are reviewed by a safeguarding specialist.
5. **No child-versus-child comparison.** No public leaderboards that rank children. Class views for teachers are aggregate or gentle, never a league table of pupils.
6. **Accessibility is a child-safety issue too.** Audio-first, no required fast reactions, no flashing, text and audio routes, big targets, simple language. The awareness course's accessibility baseline (BE-04, BE-26) applies.
7. **Age rating and classification:** aim for PEGI 3 (or 7 at most) and an ESRB Everyone rating, which constrains content and confirms the no-fear, no-ads rules above.

## Compliance and curriculum anchors (the kids equivalent of the awareness compliance mapping)

The awareness course maps to ISO, PCI DSS and the like. The children's game maps to education and child-protection frameworks instead:

- **Education for a Connected World** (UK Council for Internet Safety): the content spine above.
- **National curriculum:** computing (e-safety) and RSHE / PSHE (being safe, online relationships).
- **Keeping Children Safe in Education** (statutory safeguarding guidance for schools): shapes how the classroom version and teacher materials handle disclosure and signposting.
- **ICO Age Appropriate Design Code (Children's Code):** the data-protection rules above.
- **PEGI / ESRB:** age rating.
- Nations differ: Scotland (Curriculum for Excellence), Wales and Northern Ireland have their own curricula; the EFACW strands still apply. Signposting differs (CEOP, Childline, Report Remove).

A full mapping document would be built later, as `02_COMPLIANCE_AND_CURRICULUM.md`, mirroring the awareness course's mapping file.

## Open questions for the user

1. **Age band first:** KS2 (7 to 11) as recommended, or start younger or older?
2. **Buyer and setting:** schools (sold into a school platform, teacher-led), families (an app parents buy or a free public-good release), or both?
3. **Funding and positioning:** a commercial product, or a free public-good / grant-funded release (several comparables are free and brand-funded)? This decides how much original art and voice can be afforded.
4. **Scope of hard topics:** how far into bullying, contact risk and wellbeing to go, and with what safeguarding review in place.
5. **Name:** see `01_CONCEPT_PITCHES.md`.
