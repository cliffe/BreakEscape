# Explainers: NPCs, video and the other ways the course explains things

How the awareness course tells people the things they must simply be told, and shows them the things that are better shown. This is the full design behind the "Explaining things" summary in `01_LEARNING_DESIGN.md`. It covers the EX features in `features/README.md`: EX-01 mentor explainer, EX-02 engine-recorded video, EX-03 produced video, EX-04 in-world documents, EX-05 demonstration scenes, EX-06 attacker-view interludes and EX-07 shared glossary and tooltips. It also leans on BE-08 (visual aids in conversations), BE-19 (open a minigame from a conversation or event), MG-20 (knowledge check), MG-21 (video player) and HA-20 (video hosting, captions and transcripts).

Read `AWARENESS_COURSE_BRIEF.md` first; its writing rules apply here. This file is a feature design, not a module. Module writers refer to the EX ids and reuse the patterns below; they do not restate them.

A note on scope: several parts of EX-02 (recording finished video from the game engine) are proposals that need a proof of concept before any module depends on them. Those parts are marked **(PoC needed)**. Everything the MVP needs (EX-01 and EX-04) uses engine features that either exist or are small, well understood additions.

## How this course explains information, and why both NPCs and video

The user asked for "videos / NPCs that explain information", so this is the direct answer.

The course explains things in the world of the game, never as a slide bolted on the front. Two voices do most of the explaining, and they do different jobs:

- **An NPC, the mentor Ama Owusu, explains in person** (EX-01). She is a colleague the player keeps meeting, the Information Security Manager at Larkspur. She breaks a topic into chunks of 60 to 90 seconds, shows one visual aid per chunk (an annotated email, a small diagram) in the conversation panel, and ends each chunk with one check question. The player can say "I know this" and skip the talk, but the check question still runs. This is the course's main teaching voice because it is cheap to write and change (it is ink plus cached voice audio), it reacts to what the player just did ("you clicked, then stopped: good instinct"), and it carries the warmth the course needs: a person saying "thanks for telling me" lands differently from a narrator.

- **A video plays on a screen in the world** (EX-02, EX-03), shown through the in-world video player (MG-21). A meeting room screen, a laptop, an intranet page: the learner watches a 60 to 120 second explainer with captions and a transcript, then carries on. Video is used where motion and a human presence help: an opening that sets the tone, a short piece from a leader, a thing that is clearer animated than described. The cheapest consistent source is video recorded from the engine itself (EX-02), using the same characters, rooms and voices, so a video looks like the rest of the course and can be remade when the facts change.

Both are used because they are good at different things, and because people differ. Telling the rule out loud, in a named person's voice, is what makes the few must-know facts stick and feels human; showing a short scene is what makes a consequence real. An NPC explanation also has an accessible text route for free, because it is already ink (BE-03); a video needs captions, a transcript and audio description to reach the same people (covered under "Video standards"). The course leans on the mentor for the teaching that must happen every module, and uses video where it earns its higher cost.

Alongside these two, the world itself teaches quietly: posters, intranet pages, emails from the security team and desk notices (EX-04) repeat the key messages the way a real office does; a demonstration scene (EX-05) shows an attack working on a colleague; an attacker-view interlude (EX-06) lets the player briefly see how little an attacker needs; and a shared glossary and tooltips (EX-07) keep one plain definition per term across the whole course. The decision table below says which to reach for.

## When to use which

Each explainer format is good at some teaching jobs and poor at others, and they cost very different amounts to make and to keep current. Match the format to what is being taught: a **rule** (a short fact everyone must know, like "never read out an MFA code"), a **procedure** (an ordered set of steps, like what to do after you click), a **concept** (a mental model, like why checking another way works), a **feeling** (the stomach-drop of a near miss, the relief of reporting in time) or a **consequence** (what actually happened three weeks later).

In the table, "yes" means the format is a strong first choice for that job, "some" means it can carry it with help, and "no" means reach for something else. Cost is relative within this course (a developer, the existing engine and the voice cache), not a money figure.

| Format | Rule | Procedure | Concept | Feeling | Consequence | Cost to make | Cost to keep current | Reach for it when |
|---|---|---|---|---|---|---|---|---|
| **NPC explainer** (EX-01) | yes | yes | yes | some | no | low (ink + cached voice) | low (edit ink, revoice changed lines) | the default: any rule, procedure or concept that must be taught every play, and anything that should react to what the player just did |
| **In-engine video** (EX-02) | yes | yes | yes | some | some | medium (one-off scripted render) | low to medium (re-render from the same script) | a short set-piece that wants motion or a scene: an opening, a thing clearer shown than said, a screen in the meeting room |
| **Produced video** (EX-03) | some | some | yes | yes | some | high (filming or animation studio) | high (a reshoot or re-edit) | an opening or a leader's piece where a real human presence or polished motion graphics earn the cost; rarely, and not for anything that changes yearly |
| **In-world document** (EX-04) | yes | yes | no | no | no | very low (text, one poster image) | very low (edit text; organisation values fill in) | reinforcing a rule or procedure in the background, and leaving the steps somewhere the player can re-read them in the world |
| **Demonstration scene** (EX-05) | no | no | some | yes | yes | low to medium (in-engine cutscene) | low (edit ink and revoice) | showing an attack working on a colleague, so the threat feels real before the mentor unpicks it |
| **Attacker-view interlude** (EX-06) | no | no | yes | yes | yes | medium to high (role switch BE-11, reused mechanics) | medium | an eye-opener: letting the player feel how little an attacker needs, always inside an authorised framing |
| **Reference card** (BE-09, BE-05) | yes | yes | no | no | no | very low (generated from `concepts.md`) | very low (regenerates with the organisation profile) | the durable record of the rule and the procedure, with the organisation's own details, kept for during and after the module |

Reading the table:

- **Rules and procedures** are the mentor's and the document's job. State the rule out loud through Ama, then leave it on the reference card and a poster. Do not build a video to teach a rule that changes every year: you will be re-rendering it every year.
- **Concepts** can go to any of the mentor, an in-engine video or a produced animation. Prefer the mentor with a visual aid (BE-08) unless the concept is genuinely clearer in motion (how a real-time phishing proxy sits between you and the real site, say), in which case a short in-engine video earns its cost.
- **Feelings and consequences** are what video and the two in-world scene types (EX-05, EX-06) do that the mentor cannot. The mentor can tell you a colleague's account sent invoices to strangers; a demonstration scene lets you watch it happen, and a time skip (BE-16) lets you see it land. Use these sparingly and always pair them with the doable action, never fear on its own (`01_LEARNING_DESIGN.md`, principle 2).
- **The reference card and glossary are not teaching moments**; they are where the taught thing is written down. EX-07 (glossary and tooltips) sits under all of this: one plain definition per term, shown on hover and on the card, so the same word never gets two explanations across the course.

A rough ordering by cost, cheapest first: in-world document and reference card, then NPC explainer, then demonstration scene, then in-engine video and attacker-view interlude, then produced video. Spend up the scale only when the teaching job needs it.

## EX-01 The mentor explainer pattern

This is the course's main way of teaching, the Learn beat of most modules (`01_LEARNING_DESIGN.md`). A recurring colleague, usually Ama Owusu, explains a topic in short chunks, each with one visual aid and one check question, and lets a confident player skip the talk without skipping the check. It builds on the instructor NPC pattern already in the repo (the `lab_*` scenarios and `story_design/ink/lab_sheets/*.ink`), but it is a different shape: short, defensive, staff-level, with visual aids and a check, where the lab instructors are long, offensive and lecture-shaped.

Technically it is a `person-chat` conversation (`public/break_escape/js/minigames/person-chat/`) driven by ink, with three additions the awareness course needs:

- **BE-08 visual aids in conversations:** show an image, an annotated document or a small diagram inside the conversation panel, and step through highlights on it. Today person-chat can only set a whole-frame background (`Background[...]`), so this is a real new capability, not just a background swap.
- **BE-19 open a minigame from the conversation:** run the check question (MG-20 in single-item mode) from inside the ink, without the player clicking an object. Today `#trigger_minigame` is a stub that only shows a toast (`research/current_state_break_escape.md`), so BE-19 is what makes the check question possible mid-conversation.
- **MG-20 knowledge check:** the question type the check uses, with per-option feedback and a recorded result (BE-01).

### The ink structure

The shape is a topic hub with short chunks hanging off it. In ink terms:

- **A short hub knot.** It offers the chunks as choices, each gated so a covered chunk drops off the list (the `{not chunk_x_seen}` pattern the lab instructors already use). The hub is deliberately small: a module's mentor explainer has three to five chunks, not the fifteen a lab instructor offers. The hub names what is on offer in one line, not a paragraph.
- **One chunk per thing worth knowing.** Each chunk is 60 to 90 seconds of spoken lines (roughly 6 to 10 short lines at speaking pace), sets its own `#visual_aid` once, ends with one check question, sets its "seen" variable, and diverts back to the hub. A chunk teaches one idea; if it needs two aids or two checks, it is two chunks.
- **One visual aid per chunk (BE-08).** A tag at the top of the chunk shows the aid, and later tags step the highlight through it as the lines play. Proposed syntax, for BE-19 and BE-08 to settle: `#visual_aid: <path-or-id>` to show it, `#aid_step: <n>` to move the highlight. One aid per chunk keeps the panel from turning into a slideshow.
- **A check question (BE-19 + MG-20).** At the end of the chunk, a tag opens one MG-20 item: proposed `#trigger_minigame: knowledge_check#<item_id>`. The item is scored and recorded (BE-01). A wrong answer returns a one-line correction in Ama's voice and offers the chunk again; it never lectures.
- **An "I know this" skip that still checks.** Each chunk's choice has a sibling that routes straight past the lines to the same check question. A pass counts the chunk as covered; a miss drops the player into the full chunk. This respects experienced staff (design principle 6) without letting anyone skip the evidence.
- **A sticky "What should I do?" choice.** The hub always offers one choice that gives the procedure, phrased from the player's progress. It reads the module's globals (what the player did in the Hook, which chunks they have seen) and answers accordingly: before any teaching it gives the short version of the motto; after the relevant chunk it confirms the player already has it. It is "sticky" because it never drops off the hub, so the one answer a worried learner wants ("what do I actually do?") is always one click away.
- **An exit.** When every chunk is covered, or the player chooses to leave, the hub offers "I think I've got it", which sets the Learn-beat-complete global and ends the conversation (`#exit_conversation`). Leaving early is allowed; the beat completes on the check passes, not on hearing every line.

Progress is held in ink variables synced to globals (BE-01), so the debrief and the record can show which chunks the player saw and how the checks went, and so a reopened conversation resumes at the hub rather than replaying the intro.

### Voice and writing rules

These are tighter than the general dialogue rules, because this is teaching and it is voiced.

- **Spoken lines under 30 words.** The dialogue lint already flags spoken lines over 30 words (`03_WORLD_AND_CAST.md`); aim well under. Short lines are easier to voice, caption and follow.
- **Plain English, about an 11 to 12 year old reading age** (`01_LEARNING_DESIGN.md`, principle 9). Explain a term the first time or avoid it. One idea per line.
- **The motto carries the procedure.** Every mentor explainer lands on *Pause. Check. Report.* and the module's own version of it. The sticky "What should I do?" choice is where the motto lives.
- **No lecture tone.** Ama talks like a helpful colleague at the next desk, not a trainer at a whiteboard. She reacts to what the player did, admits she once fell for a phish, says "thanks for telling me" before anything else. No "in this module we will cover", no numbered learning objectives read aloud, no "as I mentioned earlier".
- **No printed variables in voiced lines** (`AGENTS.md`; `tts-audio` skill, rule 2). A voiced line never prints the player's name, the organisation's name or a count: the voice cache is keyed on exact text, so a line with a variable can never be cached and would cost a fresh clip per player. Counts and names appear on screen, in the visual aid, in chat text or on the reference card, not in Ama's speech. Choosing between two fixed lines with an inline conditional is fine.
- **Warmth and no blame.** A player who got the Hook wrong is met with "that one fooled lots of people; here's how to spot the next one", never "you fell for it". People are the defence, not the problem (principle 3).
- **Lines are written once, voiced last.** Because revoicing costs money, the mentor's lines are signed off before any audio is generated (`tts-audio` skill, rule 1). Draft playtests run on the keyless server with no audio.

### How it differs from the existing lecture-length instructor ink

The repo already has instructor NPCs: `scenarios/lab_intro_linux/ink/instructor.ink` and the ten scripts in `story_design/ink/lab_sheets/` (for example `phishing_social_engineering.ink`). They share the hub-and-chunk skeleton, so the engine work is mostly done, but the awareness mentor is a different animal:

| | Lab instructor (existing) | Mentor explainer (EX-01) |
|---|---|---|
| Length of a chunk | several hundred words, many paragraphs per topic (the Linux instructor's `linux_basics_intro` runs well past a screen) | 60 to 90 seconds, 6 to 10 short lines |
| Number of chunks | ten to fifteen in one hub | three to five |
| Stance | offensive: how an attacker phishes, spoofs, builds a payload | defensive: how a member of staff spots, pauses, checks and reports |
| Audience | a trainee penetration tester ("Agent {player_name}") | ordinary staff doing their job |
| Visual aids | none; walls of spoken text | one aid per chunk (BE-08), stepped highlights |
| Checking | none; the player self-assesses and moves on | one MG-20 check question per chunk, recorded (BE-01) |
| Skipping | pick topics freely, no check either way | "I know this" skips the talk but still runs the check |
| Variables in lines | prints `{player_name}` in spoken lines (it is not voiced, so this is allowed there) | never prints a variable in a voiced line |
| Voice | not voiced | voiced, cached, signed off before audio |
| Tone | "The user is the weakest link"; lecture | "People are the defence"; a colleague talking |

In short: the lab instructor is a lab sheet turned into dialogue. The mentor explainer is a short, checked, illustrated conversation that happens to be the only place some must-know facts are stated. Do not port a lab instructor's script into a module; write fresh, short, defensive lines from the module's `concepts.md`.

### Worked example: "Anatomy of a phish" (core_01)

This is the Learn beat of core_01 (`modules/core_01_phishing_email/game_design.md`), written in ink-like pseudocode. It is illustrative, not final: the real lines are signed off in the module. The `#visual_aid`, `#aid_step` and `#trigger_minigame` tags are the proposed BE-08 and BE-19 syntax and are theirs to settle. No voiced line prints a variable.

```ink
// Progress (synced to globals, BE-01). Set elsewhere: clicked_hook, signed_in_hook.
VAR chunk_ask_seen      = false
VAR chunk_sender_seen   = false
VAR chunk_link_seen     = false
VAR learn_complete      = false

=== anatomy_hub ===
// Ama opens differently depending on what happened in the Hook. No blame, no variables.
{ not anatomy_hub_opened:
    { signed_in_hook:
        Ama: You signed in on that page. No harm done now we've caught it.
        Ama: Let me show you what gave it away, so the next one doesn't.
    - clicked_hook:
        Ama: You clicked, then stopped. Good instinct.
        Ama: Let's look at what it was really asking for.
    - else:
        Ama: Nice work spotting that one. Want to know how it was built?
    }
}
~ anatomy_hub_opened = true

Ama: What shall we take apart first?

+ { not chunk_ask_seen } [The ask, and the feeling]        -> chunk_ask
+ { not chunk_ask_seen } [I know this (the ask)]           -> check_ask
+ { not chunk_sender_seen } [The sender]                   -> chunk_sender
+ { not chunk_sender_seen } [I know this (the sender)]     -> check_sender
+ { not chunk_link_seen } [The link]                       -> chunk_link
+ { not chunk_link_seen } [I know this (the link)]         -> check_link
+ [What should I do about any of this?]                    -> what_should_i_do   // sticky
+ { chunk_ask_seen and chunk_sender_seen and chunk_link_seen } [I think I've got it] -> done

=== chunk_ask ===
#visual_aid: aids/core01_hook_email.png
Ama: Here's the one from this morning.
#aid_step: 1   // highlight the "re-validate your mailbox" button
Ama: Notice what it wants: your password, on a page it picked.
#aid_step: 2   // highlight "within 24 hours"
Ama: And how it makes you feel. Rushed. Worried you'll lose your mail.
Ama: That hurry is the trick. Real IT doesn't work like that.
~ chunk_ask_seen = true
-> check_ask

=== check_ask ===
#trigger_minigame: knowledge_check#q_phish_ask
~ chunk_ask_seen = true
-> anatomy_hub

=== chunk_sender ===
#visual_aid: aids/core01_sender.png
Ama: The name says "IT Service Desk". Anyone can type that.
#aid_step: 1   // reveal the real address under the display name
Ama: The address underneath is where it really came from. Read that.
Ama: Lookalike, isn't it. One letter off, and it's not us.
~ chunk_sender_seen = true
-> check_sender

=== check_sender ===
#trigger_minigame: knowledge_check#q_phish_sender
~ chunk_sender_seen = true
-> anatomy_hub

=== chunk_link ===
#visual_aid: aids/core01_address.png
Ama: Links hide where they go. Read the address from the right-hand end.
#aid_step: 1   // highlight the real domain, just before the first single slash
Ama: The real site is this bit. Everything before it is decoration.
Ama: A padlock just means it's encrypted. Scammers have padlocks too.
~ chunk_link_seen = true
-> check_link

=== check_link ===
#trigger_minigame: knowledge_check#q_phish_domain
~ chunk_link_seen = true
-> anatomy_hub

=== what_should_i_do ===
// Sticky: always available, answered from progress. The motto lives here.
{ chunk_ask_seen or chunk_sender_seen or chunk_link_seen:
    Ama: You've seen the clues. But you don't need to catch every one.
}
Ama: Pause. Check another way. Report it.
Ama: If it asks for your password, money or data, check another way.
Ama: Use a bookmark or the directory, never the link in the message.
Ama: Not sure? Report it anyway. Reporting is never wrong.
-> anatomy_hub

=== done ===
~ learn_complete = true
Ama: That's it. Pause, check another way, report. You're ready.
#exit_conversation
-> END
```

Notes on the example:

- Three chunks (the ask and the feeling, the sender, the link), each one aid and one check, each 60 to 90 seconds. The defence (the motto) is the fourth, sticky, choice, not a lecture chunk.
- The opening reacts to the Hook (`signed_in_hook`, `clicked_hook`) with fixed strings, so it stays cacheable and never blames.
- Each check has a matching "I know this" entry that routes straight to the same check knot and still sets the "seen" variable on a pass.
- `#trigger_minigame: knowledge_check#q_phish_domain` reuses the same MG-20 items the end-of-module check draws from (`modules/core_01_phishing_email/assessment.md`), so the single check and the final check share a bank.
- The visual aid for "the link" is the same address-reading aid the reference card uses, so the learner sees one consistent picture of the idea.

## EX-02 In-engine recorded videos

A short video that looks exactly like the rest of the course, because it is the course: the same characters, rooms, voices and lip sync, filmed from the running game instead of drawn or shot. It plays on a screen in the world through the video player (MG-21) or a hosted page (HA-20). This is the course's default source of video, because once the pipeline exists a new 90 second explainer costs a script, a few cents of voice audio and a render, not a film crew.

**Most of this section is a proposal that needs a proof of concept before any module depends on it.** The parts marked **(PoC needed)** have not been built or proven in this repo. The parts that already exist are noted as such. Build one end to end short video, show it to the user, and only then let modules schedule engine-recorded videos. Until then, a module that wants a video falls back to the mentor explainer plus a visual aid, or to a produced video (EX-03).

### Why record from the engine

- **One look.** A video made from the game matches the game. No separate art style to maintain, no uncanny gap between the explainer and the thing it explains.
- **Reuse of everything.** The characters already exist (PixelLab pipeline), the rooms exist, the voices and their styles are in the voice bible, and the voice clips are already cached. A video of Ama explaining something reuses Ama's sprite, Ama's voice config and, where a line is already spoken in a module, Ama's existing clip.
- **Cheap to remake.** When the facts change, you change the script and re-render. When the course is translated, you translate the script, regenerate the voice in the target language and re-render. No reshoot.
- **It is honest about scale.** It is 2D pixel art, so it is good for stylised, friendly explainers and scene re-creations, and not for a photoreal talking head. That is the right register for this course.

### The production pipeline (PoC needed)

The proposed pipeline, end to end:

1. **Write the scene script** (exists in spirit: the test bridge drives scenes today). A declarative shot list plus the spoken lines (format below). It names the room or background, the speaker and their line for each beat, any visual aid, and the waits between beats.
2. **Generate and cache the voice** (exists). Run the lines through the normal TTS path (`tts-audio` skill): Gemini TTS on the server, cached as MP3 in `tts_cache/` keyed on text, voice, style, language and model. Lines a module already voices are already cached and reused. The lip-sync timeline is derived from each clip's loudness envelope by `public/break_escape/js/minigames/person-chat/lip-sync.js`, so the mouth already matches the audio with no extra work.
3. **Drive the scene headless and record it** (PoC needed). A recorder script opens the game in a headless browser (the test bridge, `window.__test`, gated on `breakEscapeConfig.testBridge`, so dev only, which is fine for an offline render), hides the HUD and the click indicator (the existing shot scripts already inject CSS to hide the HUD, for example `tools/playtest/cutscene-line-shot.sh`), sets a fixed viewport for a crisp 16:9 frame (see limits), fixes time with Playwright's Clock API so animations and timers render identically every run, and plays the scene through the bridge's own commands (`converse`, `moveTo`, the person-chat dialogue advance, the proposed BE-08 aid tags). Playwright's `recordVideo` context option writes the frames to a `.webm` on context close.
4. **Add the sound** (PoC needed, this is the crux). Playwright's video capture records **no audio** (Playwright issue #4870, closed WontFix: audio is out of scope for Playwright). So the audio is laid on afterwards: the scene's own voice clips are already files in `tts_cache/`, and the recorder logs when each line started (from the deterministic dialogue waits), so an ffmpeg step mixes each clip onto the silent video at its known offset, plus any music bed. The proof of concept is mainly about this: getting line-level audio and video in sync from the render log.
5. **Edit and finish** (exists: ffmpeg is installed). A title card, a tail card with the motto, loudness normalisation, and captions (see "Video standards"): either burned in, or kept as a WebVTT sidecar generated straight from the script's lines, or both (an open caption copy for platforms that cannot show WebVTT, and a WebVTT copy for MG-21 and HA-20). Transcode the `.webm` to `.mp4` as well for broad playback.

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
    speaker: ama_owusu               # uses this NPC's voice config and sprite
    line: "Most attacks start with a message that looks like work."
    aid: null
  - speaker: ama_owusu
    line: "Pause when something is unexpected, urgent, or asks for a password."
    aid: aids/core01_hook_email.png
    aid_step: 1
  - speaker: ama_owusu
    line: "Check another way. A bookmark, the app, a colleague you know."
    aid: aids/core01_address.png
  - speaker: ama_owusu
    line: "Report it. Even if you're not sure. Reporting is never wrong."
    aid: null
end_card: "Pause. Check. Report."
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
- **When the organisation profile changes (BE-05):** ideally, nothing. The recommended rule is that **engine-recorded videos are generic across organisations**, exactly like voiced lines. The customer's own reporting route, button name and contacts live on the intranet page and reference card around the video (BE-09), and in the module's on-screen text, not inside the video. This keeps one render serving every customer and avoids a per-customer render farm. Where a customer genuinely needs their name or logo on the video, add it as an overlay at edit time from a template (PoC needed), rather than re-rendering the scene; treat that as an exception, not the default.

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
- **Look.** It is 2D pixel art. Good for stylised explainers, scene re-creations and the mentor talking to camera; not for photoreal footage. Set expectations accordingly.
- **Determinism.** Use the Clock API (Playwright 1.45 and later) and fixed seeds so blinks, idle animation and timers render the same every run, or two renders of one script will differ.
- **Dev-only bridge.** The test bridge is disabled in production, so rendering is an offline job in a dev or CI environment, never on a learner's machine. That is fine for producing a file to host (MG-21, HA-20).

EX-02 cannot show its output on its own: it depends on MG-21 (the in-world player) or HA-20 (hosting) to appear anywhere (`features/README.md`, Dependencies).
