# Explainers: the host, concept cards and the other ways the course explains things

How the awareness course tells people the things they must simply be told, and shows them the things that are better shown. This is the full design behind the "Explaining things" summary in `01_LEARNING_DESIGN.md`. It covers the EX features in `features/README.md`: EX-01 host NPC and concept cards, EX-02 engine-recorded video, EX-03 produced video, EX-04 in-world documents, EX-05 demonstration scenes, EX-06 attacker-view interludes, EX-07 shared glossary, EX-08 printable poster and briefing pack, and EX-09 concept cards (new id, built).

Read `AWARENESS_COURSE_BRIEF.md` first; its writing rules apply here. This file is a feature design, not a module. Module writers refer to the EX ids and reuse the patterns below; they do not restate them.

## Build status, 2026-10-27

This file was first written before main built the awareness product, "Incident Simulations: Critical Cases" (`../04_BUILT_SO_FAR.md`). The build settles how the course explains things (R9): **a host NPC, concept cards, feedback strings and text to speech. No video.** Where this file and the build disagree, the build wins. In short:

- **EX-01** is now the **host NPC plus concept cards**. The recurring Larkspur mentor (Ama Owusu) and the rest of the Larkspur cast are retired as a setting (R2); each episode has a host at a brand-set company.
- **EX-02 and EX-03** (video) drop to **P3, optional**. No episode depends on them. Their designs are kept for a later module that genuinely needs one.
- **EX-06** (attacker-view interludes) is **delivered by attack-first**: every full episode has an attack half, and a defend-only variant for customers who do not want it (R5).
- **EX-09** is a new id for the built concept cards.
- The procedure every explainer lands on is the built rule of thumb, word for word (R4). This file calls it "the habit to keep":

  > "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."

- There is no language model at runtime (R10). Every explanation, reply, hint and piece of feedback is authored data or ink.

| Id | Build status | Priority |
|---|---|---|
| EX-01 | Partly built, by the host NPC in every shell (BE-31) and concept cards (EX-09) | MVP, authored per new episode |
| EX-02 | Not built | P3, optional |
| EX-03 | Not built | P3, optional |
| EX-04 | Partly built, by existing notes and text-file objects and the training room's "REPORT IT" poster | P2 |
| EX-05 | Partly built (differently), by the flip view (BE-32) and the mock authenticator (MG-36) | P2 |
| EX-06 | Built differently, by the attack half of every full episode (BE-31) | P3 (delivered) |
| EX-07 | Partly built (differently), by concept cards, the triage header explainers and the canonical red-flag sentences | P2 |
| EX-08 | Not built | P2 |
| EX-09 | Built | Built |

## How this course explains information

The user asked for "videos / NPCs that explain information". The build's answer is NPCs and the game's own screens, and no video.

The course explains things inside the episode, never as a slide bolted on the front. Five things do the explaining, each **Built**:

- **The host NPC** (EX-01). One per shell: a member of staff at the brand-set company, standing beside the kiosk in the training room. The host welcomes the learner, says in one or two lines what the exercise is, and says a different line once the learner has sent their attack and again once they have finished the defend half. The host is voiced (text to speech, cached) and never prints a variable.
- **The flip** (BE-32). The learner's own message, page or call is shown as its receiver sees it, with each tell named in a canonical sentence. This is where the learning lands: the learner sees how little their attack needed, and what would have caught it.
- **Concept cards** (EX-09). Short explainer cards behind a visible "What is this?" button inside an overlay, for example E5's "The padlock myth" and "Check where a link goes". Hover is never the only way to see them.
- **Feedback strings.** Each triage item's feedback, the per-item reasoning cards, feedback on genuine items, the "weakest skill" line and the header panel's SPF, DKIM and DMARC explainers (in the student lab and the check forms; episodes leave header jargon out).
- **The debrief** (part of BE-31). The habit to keep, the "On Monday" card, the "How to report here" box, the no-blame line, and optional panels: E2's concept panel on macros, and E4's and E7's voice panel ("A voice is not proof").

Alongside these, the training room teaches quietly: its "REPORT IT" poster and the company's wall logo plate (EX-04). A demonstration (EX-05) is the flip, or the mock authenticator, where the learner sends an MFA prompt storm and sees it land on its target. The attacker view (EX-06) is the attack half itself.

## When to use which

Each explainer format is good at some teaching jobs and poor at others, and they cost very different amounts to make and to keep current. Match the format to what is being taught: a **rule** (a short fact everyone must know, like "never read out an MFA code"), a **procedure** (an ordered set of steps, like what to do after you click), a **concept** (a mental model, like why checking another way works), a **feeling** (the stomach-drop of a near miss, the relief of reporting in time) or a **consequence** (what happened next).

In the table, "yes" means the format is a strong first choice for that job, "some" means it can carry it with help, and "no" means reach for something else. Cost is relative within this course (a developer, the existing engine and the voice cache), not a money figure.

| Format | Status | Rule | Procedure | Concept | Feeling | Consequence | Cost to make | Cost to keep current | Reach for it when |
|---|---|---|---|---|---|---|---|---|---|
| **Host NPC** (EX-01) | Built | some | some | no | some | no | very low (a few voiced lines) | very low | framing the episode and closing it warmly; never the only place a fact is stated |
| **Concept card** (EX-09) | Built | yes | some | yes | no | no | very low (a title and a few sentences) | very low | a term or idea the learner meets in an overlay and may want explained, on demand |
| **Flip view** (BE-32) | Built | some | no | yes | yes | yes | low (data in the episode) | low | showing the learner's own attack from the receiving side, with its tells |
| **Feedback strings and debrief panels** | Built | yes | yes | yes | no | some | low | low | the reasoning behind each verdict, the habit to keep and the "On Monday" action |
| **Consequence flip** (BE-16) | New | no | no | some | yes | yes | low to medium | low | topics with no natural attacker (E11, core_05, core_06, core_16): the learner's everyday mistake, and where it led |
| **In-world document** (EX-04) | Partly built | yes | some | no | no | no | very low | very low | reinforcing a message in the training room |
| **Demonstration** (EX-05) | Partly built | no | no | some | yes | yes | low to medium | low | watching an attack land on someone else, then seeing what would have stopped it |
| **Attack half** (EX-06) | Built | no | no | yes | yes | yes | medium (authored templates and sites) | medium | every full episode: build one attack from facts the learner found |
| **Engine video** (EX-02) | P3, optional | yes | yes | yes | some | some | medium, plus a pipeline proof of concept | low to medium | only if a later module needs motion the game screens cannot give |
| **Produced video** (EX-03) | P3, optional | some | some | yes | yes | some | high | high | rarely; an evergreen opening or leader's piece, if the user wants one |

Reading the table:

- **Rules and procedures** live in the debrief and the feedback strings, where the learner can re-read them, and in the "On Monday" card. The host may say the gist; it is written down on screen too.
- **Concepts** go on a concept card, a debrief panel or the flip. Prefer one card per idea.
- **Feelings and consequences** are what the flip, the consequence flip and the demonstration do. Use them sparingly and always pair them with the doable action, never fear on its own (`01_LEARNING_DESIGN.md`, principle 2).
- **Video is not on the default path.** Reach for it only through a later decision.

## EX-01 The host NPC and concept cards

**Priority and size:** MVP, S per episode (authoring only; the systems are built).

**Build status:** **Partly built.** The host NPC exists in every one of the 38 shells, and concept cards (EX-09) exist and are used in E5. What is **New** is the authoring each new episode needs: a host from its company's cast, its welcome and closing lines, and its concept cards. core_00's first-play "how it works" brief inside the kiosk frame is also **New** (`../04_BUILT_SO_FAR.md` §3).

This replaces the mentor explainer pattern the plan first designed (a recurring Larkspur colleague teaching in chunks, with visual aids and a check question after each). The build does not need that pattern: the flip, the concept cards and the debrief do the teaching, and the pre and post checks do the measuring (R6). The mentor's check questions (MG-20) and visual aids (BE-08) are no longer prerequisites.

### The host, as built

Each shell is one training room at a brand-set company. The host stands near the kiosk. The pattern, from the E1 and E5 hosts' ink:

- **A small hub.** The opening line is chosen by state, from two globals the host reads: before the attack ("Welcome to the Brightwell exercise. Start at the kiosk..."), after the attack is sent ("Your message has gone. Now take the other seat at the kiosk..."), and after the defend half ("You've worked it from both ends now."). The closing line restates the habit in the company's own terms, for example ringing back on a number you already hold before moving money.
- **One choice.** "Thanks, Adaeze." The host answers and the conversation ends (`#exit_conversation`), resting at the hub quietly so a re-talk says the line that fits the moment.
- **The conclusion.** The host's NPC record carries the event mapping that completes the shell's one conclusion task once the defend or check result has synced (BE-31).
- **Voiced, cached, no variables.** A voiced line never prints the learner's name, the organisation's name or a count.

The hosts on main:

| Shell | Company | Host |
|---|---|---|
| E1 invoice fraud, and its defend-only variant | Brightwell Foods | Adaeze Okafor, finance manager |
| E2 CV lures, and defend-only | Tarrowby Logistics | Fatima Begum, recruitment lead |
| E3 help-desk reset, and defend-only | Quayholt Insurance | Darren Price, service desk team lead (Leila Nassar is the service desk agent the learner calls) |
| E4 executive whaling, and defend-only | Merrin & Sallow Architects | Thandiwe Moyo, studio manager |
| E5 sign-in pages, and defend-only | Quayholt Insurance | Niamh Doherty, IT trainer |
| E6 texts and QR codes, and defend-only | Tarrowby Logistics | Chidi Okeke, fleet coordinator |
| E7 cloned CEO voice, and defend-only | Brightwell Foods | Agnieszka Duda, payroll officer |
| Pre and post checks | One company per role | Graham Whitfield and Joanne Pell (finance), Jun Watanabe (hr, and the mobile BA checks), Anjali Rao (helpdesk), Yasmin Chaudhry (executive), Owen Treharne (general), Lerato Dlamini (mobile AB) |

Names and backgrounds are in `../../phishing_and_social_engineering/awareness/BRAND_SET.md`, which is the roster for any new host. Host art is waiting on the build's own resume plan.

### Concept cards in an episode

A concept card is a title and two or three plain sentences (EX-09), opened from a visible "What is this?" button in an overlay. Use one where the learner meets an idea they may not know at the moment they need it: the padlock myth in a page item, a look-alike address, a macro prompt, a copied voice. A card never carries a fact that only it holds; the same point appears in the item's feedback or the debrief.

### Writing rules for the host and the cards

These carry over from the first design, tightened by the build.

- **Spoken lines under 30 words.** The dialogue lint flags longer ones; aim well under.
- **Plain English, about an 11 to 12 year old reading age** (`01_LEARNING_DESIGN.md`, principle 9). Explain a term the first time or avoid it. One idea per line.
- **The habit to keep, word for word.** Wherever the full rule of thumb appears, it is the built wording (R4), which a test enforces in every debrief. A host may say the gist in the company's own terms; any short tagline is a new decision for the user.
- **No lecture tone.** The host talks like a helpful colleague, reacts to where the learner is, and thanks them. No "in this module we will cover", no learning objectives read aloud.
- **No printed variables in voiced lines** (`AGENTS.md`; `tts-audio` skill, rule 2). Choosing between two fixed lines with an inline conditional is fine.
- **Warmth and no blame.** "That one fools lots of people; here's what gave it away", never "you fell for it". People are the defence, not the problem (principle 3).
- **Lines are written once, voiced last** (`tts-audio` skill, rule 1).
- **No real brands** in a card or a line; names and domains come from the brand set, on `.example` domains (R13).

### How it differs from the lab instructor

The repo's instructor NPCs (`scenarios/lab_intro_linux/ink/instructor.ink`, the scripts in `story_design/ink/lab_sheets/`) are long, offensive and lecture-shaped, and the student lab's engagement lead, Ruth, runs a progress-gated support hub that gives hints by phone. An awareness host is the opposite: a few voiced lines, staff-level and warm, with the teaching on the screens. Do not port a lab instructor's script into an episode.

### The first design, kept as reference

The mentor explainer's worked example ("Anatomy of a phish", with `#visual_aid`, `#aid_step` and `#trigger_minigame:knowledge_check|<id>` tags) is in this file's history. If a later module needs a host to explain something with an image inside the conversation, it builds on BE-08 and BE-19 (`break_escape_engine.md`), and its lines follow the rules above.

## EX-02 In-engine recorded videos

**Priority and size:** P3, optional, M.

**Build status:** **Not built.** The build uses no video (R9), and no episode depends on this. The design below is kept as an option for a later module that genuinely needs motion the game screens cannot give. It needs the user's go-ahead and a proof of concept first.

A short video that looks exactly like the rest of the course, because it is the course: the same characters, rooms, voices and lip sync, filmed from the running game instead of drawn or shot. It plays on a screen in the world through the video player (MG-21) or a hosted page (HA-20). If video is ever wanted, this is the cheapest consistent source, because once the pipeline exists a new 90 second explainer costs a script, a few cents of voice audio and a render, not a film crew.

**Most of this section is a proposal that needs a proof of concept before any module depends on it.** The parts marked **(PoC needed)** have not been built or proven in this repo. The parts that already exist are noted as such. Build one end to end short video, show it to the user, and only then let modules schedule engine-recorded videos. Until then, a module that wants a video uses the episode's own screens: the flip, concept cards and debrief panels.

### Why record from the engine

- **One look.** A video made from the game matches the game. No separate art style to maintain, no uncanny gap between the explainer and the thing it explains.
- **Reuse of everything.** The characters already exist (PixelLab pipeline), the rooms exist, the voices and their styles are in the voice bible, and the voice clips are already cached. A video of a host explaining something reuses that host's sprite, voice config and, where a line is already spoken in an episode, the existing clip.
- **Cheap to remake.** When the facts change, you change the script and re-render. When the course is translated, you translate the script, regenerate the voice in the target language and re-render. No reshoot.
- **It is honest about scale.** It is 2D pixel art, so it is good for stylised, friendly explainers and scene re-creations, and not for a photoreal talking head. That is the right register for this course.

### The production pipeline (PoC needed)

The proposed pipeline, end to end:

1. **Write the scene script** (exists in spirit: the test bridge drives scenes today). A declarative shot list plus the spoken lines (format below). It names the room or background, the speaker and their line for each beat, any visual aid, and the waits between beats.
2. **Generate and cache the voice** (exists). Run the lines through the normal TTS path (`tts-audio` skill): Gemini TTS on the server, cached as MP3 in `tts_cache/` keyed on text, voice, style, language and model. Lines a module already voices are already cached and reused. The lip-sync timeline is derived from each clip's loudness envelope by `public/break_escape/js/minigames/person-chat/lip-sync.js`, so the mouth already matches the audio with no extra work.
3. **Drive the scene headless and record it** (PoC needed). A recorder script opens the game in a headless browser (the test bridge, `window.__test`, gated on `breakEscapeConfig.testBridge`, so dev only, which is fine for an offline render), hides the HUD and the click indicator (the existing shot scripts already inject CSS to hide the HUD, for example `tools/playtest/cutscene-line-shot.sh`), sets a fixed viewport for a crisp 16:9 frame (see limits), fixes time with Playwright's Clock API so animations and timers render identically every run, and plays the scene through the bridge's own commands (`converse`, `moveTo`, the person-chat dialogue advance, the proposed BE-08 aid tags). Playwright's `recordVideo` context option writes the frames to a `.webm` on context close.
4. **Add the sound** (PoC needed, this is the crux). Playwright's video capture records **no audio** (Playwright issue #4870, closed WontFix: audio is out of scope for Playwright). So the audio is laid on afterwards: the scene's own voice clips are already files in `tts_cache/`, and the recorder logs when each line started (from the deterministic dialogue waits), so an ffmpeg step mixes each clip onto the silent video at its known offset, plus any music bed. The proof of concept is mainly about this: getting line-level audio and video in sync from the render log.
5. **Edit and finish** (exists: ffmpeg is installed). A title card, a tail card with the habit to keep, loudness normalisation, and captions (see "Video standards"): either burned in, or kept as a WebVTT sidecar generated straight from the script's lines, or both (an open caption copy for platforms that cannot show WebVTT, and a WebVTT copy for MG-21 and HA-20). Transcode the `.webm` to `.mp4` as well for broad playback.

Steps 1, 3, 4 and 5 are a new tool (propose it as a repo script, for example `tools/video/record-scene.rb` plus a Playwright recorder, kept out of the module folders). Steps 2 and the lip sync are the existing engine and TTS pipeline, unchanged.

### Script format (PoC needed)

A video script is a small declarative file (YAML or JSON) that the recorder reads. It is not ink: ink drives branching conversation, and a video is a fixed, linear cut. A worked shape:

```yaml
id: core01_sixty_second_phish
title: "Spotting a phish in sixty seconds"
language: en-GB
viewport: { width: 1280, height: 720 }
music: calm_workplace        # optional bed, ducked under speech
shots:
  - background: room_office          # a POV room background or a game room
    speaker: adaeze_okafor               # uses this NPC's voice config and sprite
    line: "Most attacks start with a message that looks like work."
    aid: null
  - speaker: adaeze_okafor
    line: "If a message pushes you to move money or sign in, stop."
    aid: aids/core01_hook_email.png
    aid_step: 1
  - speaker: adaeze_okafor
    line: "Check it yourself, through a route you already trust."
    aid: aids/core01_address.png
  - speaker: adaeze_okafor
    line: "Not the link or number in the message. Then report it."
    aid: null
end_card: rule_of_thumb   # the built rule of thumb, word for word (R4)
```

Rules for the script:

- **Spoken lines follow the EX-01 voice rules:** under 30 words, plain, no lecture tone, and above all **no printed variables**, so the same clip and the same render serve every organisation and the audio cache stays shared with the modules.
- **The line text is the caption text.** The WebVTT is generated from the `line` fields and the logged timings, so captions and speech never drift apart.
- **Each `speaker` must have a voice config** in the scenario or a shared voice registry, so the recorder knows which voice and style to generate and which sprite and viseme sheet to show.
- **Backgrounds reuse the room POV backgrounds** (the `room-pov-background` skill output) or a game room, so a video sits in the same places the modules do.

### Voice generation and caching

The video uses the normal voice cache, which is the main economy:

- A line already spoken by that character in a module is already cached (same text, voice, style, language, model) and is reused with no new cost.
- A new line is generated once, reviewed and committed like any other (`tts-audio` skill). The video and any NPC who later says the same line share the one clip.
- Because the lip-sync timeline comes from the clip's loudness envelope at play time (`lip-sync.js`), the mouth matches the audio automatically, including after a re-record in another language.
- The no-printed-variables rule is not optional here: a video whose narration said a customer's name would need a fresh render and fresh audio per customer, which defeats the point. Keep names, counts and the organisation's own details out of the spoken track.

### Re-rendering when content or the organisation profile changes

- **When the concepts change:** edit the script, regenerate audio for the changed lines only (the cache skips unchanged lines), re-run the recorder, re-cut. Bump the video version (HA-19, HA-20) and note what changed.
- **When the art changes** (a character restyle, a room redress): re-run the recorder; the new sprites and rooms are picked up because the video is the live game, not a baked asset. This is a real advantage over produced video, which would need a reshoot.
- **When the organisation profile changes (BE-05):** ideally, nothing. The recommended rule is that **engine-recorded videos are generic across organisations**, exactly like voiced lines. The customer's own reporting route, button name and contacts live in the episode's debrief and on-screen text around the video, and in the module's on-screen text, not inside the video. This keeps one render serving every customer and avoids a per-customer render farm. Where a customer genuinely needs their name or logo on the video, add it as an overlay at edit time from a template (PoC needed), rather than re-rendering the scene; treat that as an exception, not the default.

### Localisation (BE-06)

This is where engine-recorded video pays off most. To localise a video: translate the `line` fields and the title and end card, pick the language's voice in each `speaker`'s config (the cache key already includes language), regenerate the audio in that language, re-run the recorder (the lip sync re-aligns to the new audio by itself), and translate the captions and transcript. No reshoot, no new actor, no redraw. The cost of a localised video is a translation, a few cents of voice audio and a render. (The automation of this is PoC needed; the pieces, translated ink and per-language voices, are the BE-06 feature.)

### Cost and limits

Cost:

- **Voice:** the `tts-audio` figure, roughly $0.80 per hour of generated audio until 31 December 2026 (double from 1 January 2027), so a two minute video's narration is a few cents, and reused lines are free.
- **Compute:** a headless browser run and an ffmpeg pass. Effectively just developer and machine time; no studio, no actor, no per-minute avatar fee.
- **The real cost is the one-off pipeline build and review**, and the writing of each script.

Limits (several are the reason this is PoC, not shipped):

- **No audio from Playwright.** Video capture is silent; the audio is muxed in afterwards from the TTS clips (step 4). Proving clean line-level sync is the main risk.
- **Resolution.** Playwright's recorded video defaults to the viewport scaled to fit 800x800, and to 800x450 when no viewport is set; set an explicit viewport (for example 1280x720) for a crisp 16:9 render.
- **Format.** The capture is `.webm`; transcode to `.mp4` as well for broad playback and for platforms that prefer it.
- **File timing.** The video is only written when the browser context closes, so the recorder must close cleanly or the file is lost.
- **Look.** It is 2D pixel art. Good for stylised explainers, scene re-creations and a host talking to camera; not for photoreal footage. Set expectations accordingly.
- **Determinism.** Use the Clock API (Playwright 1.45 and later) and fixed seeds so blinks, idle animation and timers render the same every run, or two renders of one script will differ.
- **Dev-only bridge.** The test bridge is disabled in production, so rendering is an offline job in a dev or CI environment, never on a learner's machine. That is fine for producing a file to host (MG-21, HA-20).

EX-02 cannot show its output on its own: it depends on MG-21 (the in-world player) or HA-20 (hosting) to appear anywhere (`features/README.md`, Dependencies).

## EX-03 Produced videos

**Priority and size:** P3, optional, M.

**Build status:** **Not built.** As for EX-02: no episode depends on it, and it needs the user's go-ahead.

Video made outside the engine, with the higher production values the engine cannot reach: a real person on camera, studio motion graphics, a recorded voice actor. It is the most expensive explainer format and the hardest to keep current, so it is used rarely: an opening that sets the tone for a whole pathway, a short piece from a named leader, or a concept that genuinely needs studio-grade motion. For the common case (a 90 second topic explainer that will change as the facts change), prefer the episode's own screens (EX-01, EX-09) or, if video is ever taken up, an engine-recorded video (EX-02).

Three kinds, with the trade-offs.

### Presenter-led

A person presents to camera, like a short piece of corporate video. Two routes, and the course can offer both:

- **The project lead's game character as an animated presenter.** The repo already has the character art for Dr Z. Cliffe Schreuders (`public/break_escape/assets/characters/cliffe_schreuders*`): a dialogue bust, a talk sheet, a viseme sheet and a voice config (an Australian-accented academic who builds learning games; used in `lab_tesseract_trials`). A presenter cameo using this character is really an EX-02 engine-recorded video, not a produced one: it reuses the sprite, visemes and cached voice, costs a render, and stays openly a friendly game character rather than a real person passing as an authority. This is the cheaper, lower-risk way to put a recognisable "face of the course" in front of learners, and it localises like any engine video. Recommended where a presenter cameo is wanted at all.
- **The real person on camera.** Filming the actual project lead (or a customer's own CISO) is a genuine produced video. It adds real human authority and warmth, and it is right for a one-off "about this course" or "why this matters" opening that will not change often. It costs a filming session, it needs a reshoot to change, and it localises only by dubbing or subtitling. Keep it short, keep it free of anything that dates (figures, service names, this year's scams), and keep it generic across customers so one film serves all.

### Animated motion graphics

Studio animation: abstract shapes, diagrams and text in motion explaining a mechanism. It is good for a concept that is genuinely clearer as motion than as a concept card or debrief panel, for example how a real-time phishing proxy relays a login, or how data flows between systems. It is expensive to produce and to re-edit, and it sits in its own art style unless commissioned to match the course. Worth it only for a stable concept (one that will not change yearly) that several modules or pathways reuse, so the cost is amortised. For a one-module concept, a concept card (EX-09) is usually enough.

### AI avatar video, and why to be careful

AI avatar tools generate a synthetic presenter, often a photoreal talking head with a cloned or synthetic voice, from a script. They are cheap, fast and easy to localise, which is exactly why they are tempting and exactly why they are a poor fit here.

- **It undercuts the teaching.** This course teaches people that a convincing face and voice on a screen can be fake, and that the defence is to verify through a channel you trust, not to trust your eyes and ears (core_15). Presenting its own lessons through a synthetic human that is meant to read as real contradicts the message.
- **It is a reputational risk.** A compliance buyer who discovers the "presenter" is an AI avatar may reasonably feel misled, and may doubt the rest of the course. In a product sold on trust and correctness, that is a bad trade for saving a filming day.
- **The honest nuance.** The course already uses synthetic voices (Gemini TTS) for its NPCs. The difference is disclosure and framing: the NPCs are openly stylised game characters with pixel-art faces, never presented as real people, and the course can say so. A photoreal AI avatar presented as a real authority figure is a different thing. So the rule is not "no synthetic media" (the game is full of it); it is **never present synthetic media as a real human, and never clone a real person's face or voice without their clear, documented consent.**
- **If it is ever used,** disclose it plainly on the video and in the course notes ("this presenter is computer generated"), keep it obviously stylised rather than passing as real, and never use it to impersonate a named person. In most cases the engine characters (EX-02) give the same reach at lower cost and with none of this risk, so prefer them.

### Costs, and when each is worth it

| Kind | Rough cost | Keep current | Localise | Worth it for |
|---|---|---|---|---|
| Game character as presenter (really EX-02) | render time | re-render | re-render with translated lines | a recognisable face of the course, cheaply and safely |
| Real person on camera | a filming session | reshoot | dub or subtitle | a one-off opening or leader's message, kept evergreen |
| Animated motion graphics | studio commission | re-edit | re-voice, re-caption | a stable, reused concept that needs studio motion |
| AI avatar | low per minute | regenerate | regenerate | generally not worth the reputational and teaching cost; avoid |

Default to EX-01 and EX-09; video is P3. Reach for EX-03 (the real-person or animated kinds) only for the openings and leaders' content where the higher production value earns its cost, and keep those pieces evergreen so they are not reshot every year.

## Video standards for every video

Every video in the course, however it was made (EX-02 or EX-03), meets the same standards. These are the floor, not the aspiration. They are enforced by the video player (MG-21) and the hosting (HA-20), and checked in review. The accessibility items are from WCAG 2.2, which the course holds every interface to (`01_LEARNING_DESIGN.md`, principle 10).

- **Length: 60 to 120 seconds.** Long enough to make one point, short enough to hold attention and to re-render cheaply. A topic that needs more is split into several short videos or into chapters (below), not stretched into one long one. This fits Mayer's segmenting principle (below) and the evidence on video length: in a study of 6.9 million viewing sessions on edX, median engagement time was at most 6 minutes whatever the video's length, and the authors recommend chunks shorter than 6 minutes (Guo, Kim and Rubin, 2014). Our 60 to 120 seconds sits well inside that.
- **Captions (WebVTT).** Every video ships with a caption file in WebVTT format, shown through an HTML `track` element with `kind="captions"` (captions carry the dialogue plus relevant sound and who is speaking, which is what MDN's definition of `kind="captions"` describes, as against `kind="subtitles"` for dialogue alone). This meets WCAG 2.2 success criterion 1.2.2 Captions (Prerecorded), Level A: "Captions are provided for all prerecorded audio content in synchronized media". Because an engine-recorded video's captions are generated from the same script lines as the speech (EX-02), they match the audio exactly.
- **Transcript.** A full text transcript is available alongside every video, so it can be read instead of watched, searched and skimmed. This also serves as the media alternative under WCAG 2.2 success criterion 1.2.3 (Level A).
- **Audio description where visuals carry meaning.** Where something is shown but not said (an on-screen address, a diagram changing), the meaning must reach someone who cannot see it. The best way, and the one the course uses, is to **write the narration so it already describes the visuals** (the W3C WAI calls this integrated description: "description of the visual information can be seamlessly integrated by the speakers as the video is planned and created"), so no separate description track is needed. Because the course writes its own scripts, this is almost always possible: if the host says "read the address from the right-hand end", they have described the visual. Where a video cannot be made self-describing, provide a separate audio description track, meeting WCAG 2.2 success criterion 1.2.5 Audio Description (Prerecorded), Level AA: "Audio description is provided for all prerecorded video content in synchronized media". A video that is only a person talking needs no description.
- **No autoplay with sound.** A video never plays automatically with sound; the learner presses play. This meets WCAG 2.2 success criterion 1.4.2 Audio Control (Level A), which applies to any audio that "plays automatically for more than 3 seconds", and it fits the calm, no-jump-scare tone (`03_WORLD_AND_CAST.md`). An in-world screen may loop a silent, captioned preview, but sound starts only on a deliberate play.
- **No flashing, reduced motion honoured.** Nothing flashes more than three times a second (WCAG 2.2 success criterion 2.3.1, Level A: "Web pages do not contain anything that flashes more than three times in any one second period"), and any looping preview respects a reduced-motion preference (BE-04).
- **Chapters.** A video long enough to need navigation carries a chapters track (WebVTT, `kind="chapters"`), so a learner can jump to the part they want. Most 60 to 120 second videos need only one or two.
- **A watched record.** MG-21 records that a learner watched the video, and the record (HA-05) keeps it, so a module can note the video was seen. Watching is never gated behind a timer the learner cannot turn off, and the course never forces a learner to sit through a video with no skip: that would fail the accessibility baseline (no required waits, BE-04) and annoy experienced staff. "Watched" follows HA-20's rule: 90% played or the transcript opened, so reading counts the same as watching. It is evidence, never a gate.
- **Hosting (HA-20), with the caption file, transcript and audio description.** Videos are hosted through HA-20, which holds the video, its WebVTT captions and chapters, its transcript and any audio description, on UK or EU infrastructure (HA-15). The in-world player (MG-21) plays from there.
- **Versioning (HA-19).** Every video has a version. When a video is re-rendered or re-edited (new facts, new art, a new annual edition), the version changes, and the learner record keeps which version each learner watched, the same way it keeps the module version. A video's version is noted in its hosting entry and its release notes.

### Mayer's multimedia principles applied

The course's video design follows the evidence on multimedia learning, from Mayer's review of the cognitive theory of multimedia learning. The principle names and their definitions below are quoted exactly from Table 6 ("Fifteen principles of multimedia instructional design (from Mayer, 2021)") of Mayer, R. E. (2024), "The Past, Present, and Future of the Cognitive Theory of Multimedia Learning", *Educational Psychology Review*, 36(1), article 8, DOI 10.1007/s10648-023-09842-1 (open access, CC BY). The five the course leans on most, with how it applies each:

- **Segmenting:** "People learn better when a multimedia lesson is presented in user-paced segments rather than as a continuous unit". The course keeps videos to 60 to 120 seconds, splits a bigger topic into several or into chapters, and in the episode itself the runner already moves at the learner's pace, stage by stage. The learner moves on when ready, not on the video's clock.
- **Signalling:** "People learn better when cues are added that highlight the organization of the essential material". The stepped highlights on a visual aid (BE-08 `aid_step`) cue the one thing that matters in each line; on-screen titles and the habit to keep on the end card signal the structure; captions bold nothing the narration does not stress.
- **Coherence:** "People learn better when extraneous material is excluded rather than included". No decorative music fighting the narration, no busy background, no "fun facts" that do not serve the behaviour, no sirens or skulls for effect (`03_WORLD_AND_CAST.md`). A music bed, where used, is quiet and ducked under speech. Cut anything that does not help the learner do the thing.
- **Personalisation:** "People learn better from multimedia lessons when words are in conversational style rather than formal style". The scripts use the host's conversational voice, "you", short lines, a colleague talking, never policy prose read aloud. This is the same rule as the EX-01 writing rules.
- **Voice:** "People learn better when the narration in multimedia lessons is spoken in a friendly human voice rather than a machine voice". This one needs care, because the course narrates with synthetic voices (Gemini TTS). Mayer's voice principle favours a human voice, but it rests largely on studies of older, robotic text-to-speech. More recent work found that modern text-to-speech performs on a par with a recorded human voice: Craig and Schroeder (2017), "Reconsidering the voice effect when learning from a virtual human", *Computers and Education*, 114, 193 to 205, found a modern voice engine produced as much learning as a human voice and was rated as highly; and Craig and Schroeder (2018), "Text-to-Speech Software and Learning: Investigating the Relevancy of the Voice Effect", *Journal of Educational Computing Research*, 57(6), 1534 to 1548, concluded that modern text-to-speech can "credibly and effectively deliver the narration for multimedia learning environments". So the course's use of good, natural, consistent synthetic voices is consistent with the spirit of the voice principle (a friendly, natural voice the learner can follow), as long as the voices stay warm and natural rather than robotic, which is what the `tts-audio` voice-style work is for.

A few other principles in the same table shape the design and are worth naming:

- **Modality** ("People learn better from graphics and narration than from graphics and on-screen text") and **redundancy** ("People do not learn better when printed text is added to graphics and narration ..."): the course narrates over its visuals rather than filling the frame with text to read. Captions sit in tension with this, but captions are an accessibility requirement (WCAG 1.2.2), are off by default and are the learner's to turn on, so they do not force redundant on-screen text on everyone; the redundancy concern is about identical text shown to all learners at once, not about optional captions.
- **Pre-training** ("People learn better from a multimedia lesson when they know the names and characteristics of the main concepts"): the shared glossary and tooltips (EX-07) give the learner the key terms before and during a video, so a term in the narration is not the first time they meet it.
- **Image** ("People do not necessarily learn better from a multimedia lesson when the speaker's image is added to the screen"): a presenter's face is not required for learning, which is one more reason a cheap engine character presenter (EX-02) is enough and a costly real-person film (EX-03) is reserved for where its warmth or authority is the point, not for routine explaining.

## EX-04 In-world documents

**Priority and size:** P2, S.

**Build status:** **Partly built.** The engine has notes, text-file and `examine` objects, and every training room has the company's wall logo plate and a "REPORT IT" poster. No episode yet uses a document to carry a message. What follows is **New**, and small.

A real office teaches without anyone running a class: a poster by the kitchen, a notice on a desk, an email from the security team. Documents in the training room can do the same, cheaply, and make the room feel like the company's own.

They do not carry the teaching on their own. Anything a learner must know is in the episode's feedback, a concept card or the debrief. This matters for the no-gotchas rule: a document must never be the only place a critical fact appears (`01_LEARNING_DESIGN.md`).

### The formats, and how they are built

- **Posters** on the training room walls: wall art plus an `examine` close-up with the message as text. One message in a few words.
- **Security team notes**, shown as a `notes` or `text-file` object or as a seeded message in the mail client (MG-34): a "heads up, a fake invoice email is going round, thanks to those who reported it" note, or a welcome note pointing at the reporting route. Brief, warm, never shaming.
- **Desk notices and printouts**: a sticky note, a printed procedure, a laminated card. Useful both to reinforce and, in some episodes, as the thing that is wrong (a password on a sticky note for E9, a confidential printout left out for E11).

### Style rules

- **One message per document, in a few words.**
- **The words match `concepts.md` and the episode's debrief**, so the learner sees one phrasing.
- **No real brand names or logos**; names and domains from the brand set (R13).
- **Organisation values fill in through BE-05** only in on-screen text, never in voiced lines.
- **Accessible**: readable text, and the message in the `examine` observations as well as the image (BE-04).
- **Warm, never shaming.**

### How they reinforce the episode

- **Priming.** A "report it" poster in the room, seen before the defend half, makes the reporting route feel familiar.
- **Consistency.** When the poster, the host and the debrief say the same thing the same way, the message reads as the company's settled position.

## EX-05 Demonstration scenes and EX-06 attacker-view interludes

These two formats show an attack rather than describe it, which is what makes a consequence real. In a demonstration the learner watches an attack land on someone else; in the attacker view the learner is the (authorised) attacker.

### EX-05 Demonstration scenes

**Priority and size:** P2, S.

**Build status:** **Partly built (differently).** Two built pieces demonstrate: the flip view (BE-32), where the learner's own attack lands on its receiver with the tells named, and the mock authenticator (MG-36), where the learner chooses how many pushes to send and when, and the debrief explains why fatigue works. There is no cutscene of an attack on a colleague. The rest is **New** and **builds on BE-32**.

The shape, as it now fits the episode:

1. **A normal moment.** The receiver is busy doing their job.
2. **The attack lands.** The learner sees it work: the flip, or a scripted demonstration such as the authenticator.
3. **A beat of consequence, not gore.** For a topic with no natural attacker, the consequence flip (BE-16) shows where the everyday mistake led. Calm, not a jump scare.
4. **What would have stopped it.** The flip names the tells, and the defend half and the debrief give the habit to keep. This turns a scare into a lesson.

### EX-06 Attacker-view interludes

**Priority and size:** P3 (delivered).

**Build status:** **Built differently, by attack-first.** The plan's brief, optional interlude with a named tester is replaced by the attack half of every full episode (R5): the learner looks at public sources in the OSINT browser (MG-31), then builds one attack from templates whose blanks take only facts they have found (MG-34, BE-39), or a look-alike page (MG-33), or a pretext call (BE-40, BE-33). It is unscored. The send reaches a fictional character, who replies through ink. Then the flip (BE-32) shows it from the receiving side, and the learner defends. A defend-only variant of each episode exists for customers who do not want the attack half. Every shell is framed as a sanctioned exercise in the brief and its scope note.

The first design's named tester and the attacker-view examples for physical and bin-audit topics (core_06, core_10) are not built. When those episodes are designed (E11, E12), they follow the built shape; for topics with no natural attacker, the consequence flip replaces the attack half (R3).

### Shared rules

These hold for both, and match the build:

- **Sanctioned framing.** Every attack half is an exercise at a fictional company, set out in the brief and scope note. Every target is fictional; real-staff OSINT is out of scope.
- **Always end with what would have stopped it.** The flip names the tells, and the debrief gives the habit to keep and the "On Monday" action.
- **Awareness level only, never a how-to.** Templates, pretexts and psychology only. Links, pages and attachments are abstract models, never working ones. No working payloads, no tooling steps, no real brands (decisions D, M, S, T in the build's README).
- **No blame, no "stupid victim".** The receiver is likeable and competent; they were busy and expecting that message. The attacker is ordinary and businesslike.
- **Paired with the doable action.**

## EX-07 Shared glossary

**Priority and size:** P2, S.

**Build status:** **Partly built (differently).** Concept cards (EX-09) give one short explanation per idea, per scenario, behind a visible button; the triage header panel explains SPF, DKIM and DMARC; and the build's canonical red-flag sentences give one wording per tell across every scenario. There is no single course-wide list. Hover tooltips are ruled out: hover is never the only way to see information. What is left is **New** and **builds on EX-09**.

- **One canonical text per term.** Each module's `concepts.md` already has a glossary. Reconcile these into one shared set of concept card texts, so each term has one agreed explanation. Where two modules use a term, the module that teaches the topic owns it, following the topic-boundary table in `00_COURSE_OVERVIEW.md`.
- **Reused, never retyped.** An episode's `social.conceptCards` draws from the shared set, and the brand lint (BE-38) still checks every card.
- **On a visible button,** never on hover alone, keyboard reachable and dismissible (BE-04).

Rules: plain English, a few sentences, no undefined jargon inside an explanation (reading age about 11 to 12); UK first; defined once, reused everywhere; first taught in context.

## EX-08 Printable poster and briefing pack

**Priority and size:** P2, S.

**Build status:** **Not built. New.**

A pack of print-ready materials a customer can use in their own offices, between episodes: posters, desk cards and a short team briefing per episode. Where EX-04 is the document inside the game, EX-08 is the document on a real office wall. It carries the same messages out of the game, which is both reinforcement and a compliance point.

### What is in the pack

Per episode:

- **Posters:** one or two, each with a single message from the episode's debrief.
- **A desk card:** the habit to keep, the customer's reporting route and the episode's "On Monday" action.
- **A short team briefing:** a page or two a manager or security champion can use for a five to ten minute team conversation, with the key messages, a couple of talking points and the reporting route. Lighter than the facilitator notes.

### How it is built and branded

- **Generated from `concepts.md` and the episode's debrief strings,** so it never drifts from what the game teaches.
- **Branded with the organisation profile** (BE-05): the customer's name and reporting route fill in. The default pack uses the episode's brand-set company.
- **No real third-party brands** in the default pack.
- **Refreshed with each annual edition.**

### Accessibility

- **Large type and high contrast** for print.
- **Accessible digital files** with alt text for every poster and card (WCAG 2.2).

### Why it is worth building: multiple methods of communication

Several standards expect awareness to be delivered through more than one channel. From `02_COMPLIANCE_MAPPING.md`:

- **PCI DSS 12.6.3** (v4.0.1) requires personnel to be trained on hire and at least every 12 months "using multiple methods of communication", and the testing procedures look for "materials showing more than one method".
- **The ICO's data protection audit framework** (the Training and awareness control measures in its Accountability toolkit) and **NCSC CAF B6.b** (Cyber Security Training) both expect a range of methods.
- **ISO/IEC 27002 control 6.3** lists posters and briefings among the ways to run an awareness programme.

An episode that uses EX-08 notes this in its compliance coverage and says "contributes to" rather than "meets".

## EX-09 Concept cards

**Priority and size:** Built.

**Build status:** **Built**, in `public/break_escape/js/minigames/osint-browser/concept-card.js`, configured by `social.conceptCards` and reused by the landing-page builder and triage.

A concept card is a short explainer (an id, a title and a few plain sentences, with an optional pixel-art image) behind a visible "What is this?" button in an overlay. Items list the cards they offer by id. Cards are linted for real brand names (BE-38). E5 uses two: "The padlock myth" and "Check where a link goes".

**How the plan uses it:** every new episode's concepts go on cards, drawn from the module's `concepts.md`. EX-07 reconciles them into one shared set. Debrief panels (`conceptPanel`, `voicePanel`) are the episode-level counterpart.

## The explainer library

This replaces the first draft, which was built around a Larkspur mentor cast. It lists, per module, the built or proposed episode, its company and host, and the explainers it uses. Every episode also has the flip (or a consequence flip), feedback strings and the debrief with the habit to keep, so those are not repeated row by row.

Hosts for proposed episodes are **proposals**, drawn from each company's cast in `BRAND_SET.md` so no new person is needed; each episode's design confirms or replaces them. The first plan's cast names (Owain, Tomasz, Hassan, Maureen, Precious and others) may be reused as hosts or staff at a brand-set company, but not as one recurring workplace (R2). A new company, if one is needed, is added to `BRAND_SET.md` as "proposed", on a `.example` domain, with the pre-release web search.

| Module | Episode | Company | Host | Explainers beyond the flip and debrief | Status |
|---|---|---|---|---|---|
| core_00 | A first-play "how it works" brief inside the kiosk frame | The company of the first episode assigned | That episode's host | The habit to keep, the reporting route, "no blame" | New |
| core_01 | E1, E2, E4, E5 | Brightwell, Tarrowby, Merrin & Sallow, Quayholt | Adaeze Okafor, Fatima Begum, Thandiwe Moyo, Niamh Doherty | E5 concept cards (padlock, link target); E2 macro concept panel | Built |
| core_01 LO6, core_04 | E8 after the click | Quayholt Insurance (proposed) | Anjali Rao, information security analyst, who receives reports (proposed) | Concept cards on what to report and the first steps; MG-09 report form | New |
| core_02 | E3, E6, E7 (voicemail) | Quayholt, Tarrowby, Brightwell | Darren Price, Chidi Okeke, Agnieszka Duda | E4 and E7 voice panel | Built; in-person, chat apps and the UK scam-reporting routes are New |
| core_03 | E3's MFA stage; E9 passwords and password managers | Quayholt (E3); Merrin & Sallow Architects (E9, proposed) | Darren Price; Yasmin Chaudhry (proposed; she already handles the practice's shared logins) | Concept cards on passphrases, managers and passkeys; MG-08 | E3 built; E9 New |
| core_07, core_08 | E10 fake downloads and "verify you are human" pages | Tarrowby Logistics (proposed) | Nilesh Solanki, IT service desk analyst (proposed) | Concept cards on downloads and browser warnings; MG-02 extension | New |
| core_05, core_06 | E11 misdirected and overshared data (consequence flip) | Cobbleford Care (proposed new company) | Host to choose from the names pool in `03_WORLD_AND_CAST.md` | Consequence flip (BE-16); MG-01 recipient checks, MG-11, MG-12 | New |
| core_10 | E12 the visitor and the tailgater | Brightwell Foods (proposed) | Gwen Pritchard, IT service desk lead (proposed) | Person-chat in the training room (BE-19); possibly BE-10, BE-28 | New |
| core_15 | E7, E4 voice; E13 the AI assistant | Brightwell, Merrin & Sallow; E13 at Lintgate Communications (proposed new company) | Agnieszka Duda, Thandiwe Moyo; E13 host to choose from the names pool | Voice panel; E13 authored assistant (MG-16), no language model | E7 and E4 built; E13 New |
| core_11 | E1, E7, E4 | Brightwell, Merrin & Sallow | Adaeze Okafor, Agnieszka Duda, Thandiwe Moyo | Verify verdict, the genuine "confirmed by phone" item | Built; Confirmation of Payee and "money has gone" are New |
| core_12 | OSINT notes in every attack half; E2 and E4 posts | as above | as above | Intel board defender mode (MG-32) | Part built |
| core_09, core_13, core_14, core_16 | Later episodes | to decide | to decide | core_16 has no natural attacker, so a consequence flip | New |
| core_17 | An annual mixed edition from the existing defend sets | mixed | the edition's hosts | None beyond the defend sets | New |
| role_01 | E4; later a board crisis exercise | Merrin & Sallow | Thandiwe Moyo | MG-24 later | Part built |
| role_02 | E1, E7 | Brightwell | Adaeze Okafor, Agnieszka Duda | Finance checks | Part built |
| role_03 | E3 role swap | Quayholt | Darren Price | Role swap (BE-41) | Built (service desk half) |
| role_05 | E2 | Tarrowby | Fatima Begum | HR checks | Part built |
| role_04, role_06, role_07 | Later role episodes, each with its own check form pair | to decide | to decide | To design | New |
| sector_01 | Later | A healthcare company, proposed, to add to `BRAND_SET.md` on a `.example` domain | The plan's information governance lead, Dev Kapoor, as host (see the open questions) | To design | New |

Lengths: an episode is about 15 minutes (E6 and E7 about 16), a defend-only variant about 8, and a check about 9 (R12). A host's lines take well under a minute in all.

## Open questions and proposals

For the orchestrator and the user. None of these holds up a new episode.

1. **Video stays P3.** If the user ever wants a video, EX-02 needs its proof of concept first (muxing the voice clips onto Playwright's silent recording at line timings). Until then, no episode schedules one.
2. **A short tagline for the habit.** The build uses the full rule of thumb; any shorter tagline on a poster, card or host line is a new decision for the user (D14).
3. **sector_01's host.** The plan had decided on Dev Kapoor as the healthcare module's mentor. "Dev" already appears in the student lab and in E6 (`BRAND_SET.md` records the clash), so the name may need changing when the healthcare company is added.
4. **Hosts for E8 to E13** are proposals from the existing casts; each episode's design confirms them.
5. **The project lead's cameo (EX-03).** Still open, and still P3: the game character can present cheaply as an engine video, while filming the real person needs his agreement.

## Sources

External sources, checked on 14 October 2026. Where a claim could not be verified in this pass it is marked in the text as "to verify".

- Mayer, R. E. (2024) "The Past, Present, and Future of the Cognitive Theory of Multimedia Learning", *Educational Psychology Review*, 36(1), article 8. DOI 10.1007/s10648-023-09842-1. Open access (CC BY). The fifteen principles and their exact definitions are from Table 6, "Fifteen principles of multimedia instructional design (from Mayer, 2021)". https://doi.org/10.1007/s10648-023-09842-1
- Craig, S. D. and Schroeder, N. L. (2017) "Reconsidering the voice effect when learning from a virtual human", *Computers and Education*, 114, 193 to 205. DOI 10.1016/j.compedu.2017.07.003.
- Craig, S. D. and Schroeder, N. L. (2018) "Text-to-Speech Software and Learning: Investigating the Relevancy of the Voice Effect", *Journal of Educational Computing Research*, 57(6), 1534 to 1548. DOI 10.1177/0735633118802877.
- W3C (2023) *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation. Success criteria cited: 1.2.2 Captions (Prerecorded, Level A), 1.2.3 Audio Description or Media Alternative (Prerecorded, Level A), 1.2.5 Audio Description (Prerecorded, Level AA), 1.4.2 Audio Control (Level A), 2.3.1 Three Flashes or Below Threshold (Level A). https://www.w3.org/TR/WCAG22/
- W3C Web Accessibility Initiative, "Description of Visual Information" (audio description and integrated description guidance). https://www.w3.org/WAI/media/av/description/
- MDN Web Docs, the HTML `track` element: the `kind` values (subtitles, captions, chapters, descriptions, metadata) and the WebVTT requirement for `src`. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track
- Playwright documentation: Videos (the `recordVideo` context option, default size, saved on context close, `.webm`); Clock API (from Playwright 1.45, controls `Date`, `setTimeout`, `requestAnimationFrame`, `performance` and more). https://playwright.dev/docs/videos and https://playwright.dev/docs/clock
- Playwright issue #4870, "[Feature] Include browser audio with recordVideo", closed WontFix (audio out of scope for Playwright): the reason the TTS audio is muxed in separately. https://github.com/microsoft/playwright/issues/4870
- Compliance references (PCI DSS 12.6.3 "multiple methods of communication", NCSC CAF B6.b, the ICO data protection audit framework, ISO/IEC 27002 control 6.3) are quoted from `planning_notes/security_awareness_course/02_COMPLIANCE_MAPPING.md`, which holds the primary sources and the dates each was checked.

Guo, P. J., Kim, J. and Rubin, R. (2014) "How video production affects student engagement: an empirical study of MOOC videos", *ACM Conference on Learning at Scale*, 41 to 50. Checked against the paper (orchestrator, 14 October 2026): "median engagement time is at most 6 minutes, regardless of total video length"; recommendation to "segment videos into chunks shorter than 6 minutes".

Internal references used throughout: `04_BUILT_SO_FAR.md`, `research/current_state_social_engineering_build.md`, `research/built_episodes_vs_plan.md`, `../phishing_and_social_engineering/awareness/BRAND_SET.md` and the host ink in `scenarios/awareness_*`, `AWARENESS_COURSE_BRIEF.md`, `01_LEARNING_DESIGN.md`, `03_WORLD_AND_CAST.md`, `00_COURSE_OVERVIEW.md`, `features/README.md`, `02_COMPLIANCE_MAPPING.md`, `modules/core_01_phishing_email/`, `docs/agents/AWARENESS_MODULE_SEEDS.md`, `research/current_state_break_escape.md`, `research/current_state_lab_sheets.md`; the engine and skills: `public/break_escape/js/minigames/person-chat/` (including `lip-sync.js` and `person-chat-ui.js`), `story_design/ink/lab_sheets/phishing_social_engineering.ink`, `scenarios/lab_intro_linux/ink/instructor.ink`, `.claude/skills/tts-audio/SKILL.md`, `.claude/skills/playtest-scenario/SKILL.md`, `.claude/skills/room-pov-background/SKILL.md`, `docs/test-bridge.md`, `AGENTS.md`, and the project lead's character art at `public/break_escape/assets/characters/cliffe_schreuders*`.
