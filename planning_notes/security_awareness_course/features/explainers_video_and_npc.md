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

## EX-03 Produced videos

Video made outside the engine, with the higher production values the engine cannot reach: a real person on camera, studio motion graphics, a recorded voice actor. It is the most expensive explainer format and the hardest to keep current, so it is used rarely: an opening that sets the tone for a whole pathway, a short piece from a named leader, or a concept that genuinely needs studio-grade motion. For the common case (a 90 second topic explainer that will change as the facts change), prefer the mentor (EX-01) or an engine-recorded video (EX-02).

Three kinds, with the trade-offs.

### Presenter-led

A person presents to camera, like a short piece of corporate video. Two routes, and the course can offer both:

- **The project lead's game character as an animated presenter.** The repo already has the character art for Dr Z. Cliffe Schreuders (`public/break_escape/assets/characters/cliffe_schreuders*`): a dialogue bust, a talk sheet, a viseme sheet and a voice config (an Australian-accented academic who builds learning games; used in `lab_tesseract_trials`). A presenter cameo using this character is really an EX-02 engine-recorded video, not a produced one: it reuses the sprite, visemes and cached voice, costs a render, and stays openly a friendly game character rather than a real person passing as an authority. This is the cheaper, lower-risk way to put a recognisable "face of the course" in front of learners, and it localises like any engine video. Recommended where a presenter cameo is wanted at all.
- **The real person on camera.** Filming the actual project lead (or a customer's own CISO) is a genuine produced video. It adds real human authority and warmth, and it is right for a one-off "about this course" or "why this matters" opening that will not change often. It costs a filming session, it needs a reshoot to change, and it localises only by dubbing or subtitling. Keep it short, keep it free of anything that dates (figures, service names, this year's scams), and keep it generic across customers so one film serves all.

### Animated motion graphics

Studio animation: abstract shapes, diagrams and text in motion explaining a mechanism. It is good for a concept that is genuinely clearer as motion than as the mentor's single stepped diagram, for example how a real-time phishing proxy relays a login, or how data flows between systems. It is expensive to produce and to re-edit, and it sits in its own art style unless commissioned to match the course. Worth it only for a stable concept (one that will not change yearly) that several modules or pathways reuse, so the cost is amortised. For a one-module concept, a BE-08 stepped diagram in the mentor's hands is usually enough.

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

Default to EX-01 and EX-02. Reach for EX-03 (the real-person or animated kinds) only for the openings and leaders' content where the higher production value earns its cost, and keep those pieces evergreen so they are not reshot every year.

## Video standards for every video

Every video in the course, however it was made (EX-02 or EX-03), meets the same standards. These are the floor, not the aspiration. They are enforced by the video player (MG-21) and the hosting (HA-20), and checked in review. The accessibility items are from WCAG 2.2, which the course holds every interface to (`01_LEARNING_DESIGN.md`, principle 10).

- **Length: 60 to 120 seconds.** Long enough to make one point, short enough to hold attention and to re-render cheaply. A topic that needs more is split into several short videos or into chapters (below), not stretched into one long one. This fits Mayer's segmenting principle (below) and the evidence on video length: in a study of 6.9 million viewing sessions on edX, median engagement time was at most 6 minutes whatever the video's length, and the authors recommend chunks shorter than 6 minutes (Guo, Kim and Rubin, 2014). Our 60 to 120 seconds sits well inside that.
- **Captions (WebVTT).** Every video ships with a caption file in WebVTT format, shown through an HTML `track` element with `kind="captions"` (captions carry the dialogue plus relevant sound and who is speaking, which is what MDN's definition of `kind="captions"` describes, as against `kind="subtitles"` for dialogue alone). This meets WCAG 2.2 success criterion 1.2.2 Captions (Prerecorded), Level A: "Captions are provided for all prerecorded audio content in synchronized media". Because an engine-recorded video's captions are generated from the same script lines as the speech (EX-02), they match the audio exactly.
- **Transcript.** A full text transcript is available alongside every video, so it can be read instead of watched, searched and skimmed. This also serves as the media alternative under WCAG 2.2 success criterion 1.2.3 (Level A).
- **Audio description where visuals carry meaning.** Where something is shown but not said (an on-screen address, a diagram changing), the meaning must reach someone who cannot see it. The best way, and the one the course uses, is to **write the narration so it already describes the visuals** (the W3C WAI calls this integrated description: "description of the visual information can be seamlessly integrated by the speakers as the video is planned and created"), so no separate description track is needed. Because the course writes its own scripts, this is almost always possible: if the mentor says "read the address from the right-hand end", she has described the visual. Where a video cannot be made self-describing, provide a separate audio description track, meeting WCAG 2.2 success criterion 1.2.5 Audio Description (Prerecorded), Level AA: "Audio description is provided for all prerecorded video content in synchronized media". A video that is only a person talking needs no description.
- **No autoplay with sound.** A video never plays automatically with sound; the learner presses play. This meets WCAG 2.2 success criterion 1.4.2 Audio Control (Level A), which applies to any audio that "plays automatically for more than 3 seconds", and it fits the calm, no-jump-scare tone (`03_WORLD_AND_CAST.md`). An in-world screen may loop a silent, captioned preview, but sound starts only on a deliberate play.
- **No flashing, reduced motion honoured.** Nothing flashes more than three times a second (WCAG 2.2 success criterion 2.3.1, Level A: "Web pages do not contain anything that flashes more than three times in any one second period"), and any looping preview respects a reduced-motion preference (BE-04).
- **Chapters.** A video long enough to need navigation carries a chapters track (WebVTT, `kind="chapters"`), so a learner can jump to the part they want. Most 60 to 120 second videos need only one or two.
- **A watched record.** MG-21 records that a learner watched the video, and the record (HA-05) keeps it, so a module can note the video was seen. Watching is never gated behind a timer the learner cannot turn off, and the course never forces a learner to sit through a video with no skip: that would fail the accessibility baseline (no required waits, BE-04) and annoy experienced staff. "Watched" means the player opened and played it, not that they were made to endure it.
- **Hosting (HA-20), with the caption file, transcript and audio description.** Videos are hosted through HA-20, which holds the video, its WebVTT captions and chapters, its transcript and any audio description, on UK or EU infrastructure (HA-15). The in-world player (MG-21) and the intranet page (BE-09) play from there.
- **Versioning (HA-19).** Every video has a version. When a video is re-rendered or re-edited (new facts, new art, a new annual edition), the version changes, and the learner record keeps which version each learner watched, the same way it keeps the module version. A video's version is noted in its hosting entry and its release notes.

### Mayer's multimedia principles applied

The course's video design follows the evidence on multimedia learning, from Mayer's review of the cognitive theory of multimedia learning. The principle names and their definitions below are quoted exactly from Table 6 ("Fifteen principles of multimedia instructional design (from Mayer, 2021)") of Mayer, R. E. (2024), "The Past, Present, and Future of the Cognitive Theory of Multimedia Learning", *Educational Psychology Review*, 36(1), article 8, DOI 10.1007/s10648-023-09842-1 (open access, CC BY). The five the course leans on most, with how it applies each:

- **Segmenting:** "People learn better when a multimedia lesson is presented in user-paced segments rather than as a continuous unit". The course keeps videos to 60 to 120 seconds, splits a bigger topic into several or into chapters, and in the mentor explainer (EX-01) breaks a topic into player-paced chunks. The learner moves on when ready, not on the video's clock.
- **Signalling:** "People learn better when cues are added that highlight the organization of the essential material". The stepped highlights on a visual aid (BE-08 `aid_step`) cue the one thing that matters in each line; on-screen titles and the motto on the end card signal the structure; captions bold nothing the narration does not stress.
- **Coherence:** "People learn better when extraneous material is excluded rather than included". No decorative music fighting the narration, no busy background, no "fun facts" that do not serve the behaviour, no sirens or skulls for effect (`03_WORLD_AND_CAST.md`). A music bed, where used, is quiet and ducked under speech. Cut anything that does not help the learner do the thing.
- **Personalisation:** "People learn better from multimedia lessons when words are in conversational style rather than formal style". The scripts use the mentor's conversational voice, "you", short lines, a colleague talking, never policy prose read aloud. This is the same rule as the EX-01 voice rules.
- **Voice:** "People learn better when the narration in multimedia lessons is spoken in a friendly human voice rather than a machine voice". This one needs care, because the course narrates with synthetic voices (Gemini TTS). Mayer's voice principle favours a human voice, but it rests largely on studies of older, robotic text-to-speech. More recent work found that modern text-to-speech performs on a par with a recorded human voice: Craig and Schroeder (2017), "Reconsidering the voice effect when learning from a virtual human", *Computers and Education*, 114, 193 to 205, found a modern voice engine produced as much learning as a human voice and was rated as highly; and Craig and Schroeder (2018), "Text-to-Speech Software and Learning: Investigating the Relevancy of the Voice Effect", *Journal of Educational Computing Research*, 57(6), 1534 to 1548, concluded that modern text-to-speech can "credibly and effectively deliver the narration for multimedia learning environments". So the course's use of good, natural, consistent synthetic voices is consistent with the spirit of the voice principle (a friendly, natural voice the learner can follow), as long as the voices stay warm and natural rather than robotic, which is what the `tts-audio` voice-style work is for.

A few other principles in the same table shape the design and are worth naming:

- **Modality** ("People learn better from graphics and narration than from graphics and on-screen text") and **redundancy** ("People do not learn better when printed text is added to graphics and narration ..."): the course narrates over its visuals rather than filling the frame with text to read. Captions sit in tension with this, but captions are an accessibility requirement (WCAG 1.2.2), are off by default and are the learner's to turn on, so they do not force redundant on-screen text on everyone; the redundancy concern is about identical text shown to all learners at once, not about optional captions.
- **Pre-training** ("People learn better from a multimedia lesson when they know the names and characteristics of the main concepts"): the shared glossary and tooltips (EX-07) give the learner the key terms before and during a video, so a term in the narration is not the first time they meet it.
- **Image** ("People do not necessarily learn better from a multimedia lesson when the speaker's image is added to the screen"): a presenter's face is not required for learning, which is one more reason a cheap engine character presenter (EX-02) is enough and a costly real-person film (EX-03) is reserved for where its warmth or authority is the point, not for routine explaining.

## EX-04 In-world documents

A real office teaches without anyone running a class: a poster by the kitchen, a notice on a desk, an email from the security team, a page on the intranet. The course does the same. In-world documents repeat the key messages in the background, so the learner meets them several times and in the places they would really appear. They are the cheapest explainer (text, and one poster image), they need no new engine work, and they double as ambience that makes Larkspur feel like a workplace rather than a quiz.

They do not carry the teaching on their own. Anything a learner must know is said by the mentor (EX-01) and written on the reference card (BE-09); a poster only reinforces it. This matters for the no-gotchas rule: a document must never be the only place a critical fact appears, or a learner who did not read it is set up to fail (`01_LEARNING_DESIGN.md`).

### The formats, and how they are built

All reuse existing engine pieces (`research/current_state_break_escape.md`), so EX-04 is MVP and small.

- **Posters** on walls and in the kitchen and corridors. Built as wall art plus an `examine` close-up when the player looks (the `examine` minigame shows an object with observations). A poster carries one message in a few words, in the course's visual style, lightly in-world ("Something off? Pause. Check. Report." by the coffee machine).
- **The intranet, The Lark** (BE-09, a reskinned `lab-workstation` opening a page in an iframe). This is the hub for the reference cards, the organisation's policies, contacts and the security team's notices, and it is where policy acknowledgement happens (HA-07). It is also where a module leaves its reference card at the end.
- **Security team emails** from Ama or Kai, arriving in the inbox (MG-01) or shown as a `notes` or `text-file` document: a "heads up, a fake mailbox-full email is going round, thanks to those who reported it" note, a monthly security tip, a welcome note pointing at the reporting route. These model the voice of a real security team: brief, warm, never shaming.
- **Desk notices and printouts**: a sticky note, a printed procedure in a tray, a laminated card by a shared PC. Built as `notes`, `text-file` or `examine`. Useful both to reinforce ("lock your screen") and, in some modules, as the thing that is wrong (a password on a sticky note in core_03, confidential printouts left in the tray in core_06): the same format teaches the good habit and shows the bad one.

### Style rules

- **One message per document, in a few words.** A poster is not a page of policy. If it needs a paragraph, it is an intranet page, not a poster.
- **The words match `concepts.md`.** Where a document states a rule, it uses the module's key message wording, so the learner sees one consistent phrasing across the mentor, the poster, the card and the check. The motto heads most of them.
- **The course visual style**, legible at the size it is shown, no real brand names or logos (`03_WORLD_AND_CAST.md`), fictional names and domains throughout.
- **Organisation values fill in through BE-05.** The customer's own reporting route, button name, service desk number and policy names appear in the documents and on the intranet in place of Larkspur's defaults (BE-05, HA-11). The document text is a template; the values are the customer's. (Unlike voiced lines, on-screen document text may carry these, because it is not cached audio.)
- **Accessible.** In-world documents have readable text and, in their digital and hosted forms, alt text and sufficient contrast (BE-04, HA-23). A poster whose message is in the image alone needs that message in its `examine` observations too.
- **Warm, never shaming.** Security team emails thank reporters and never name and blame. They sound like Ama and Kai, not like a telling-off.

### How they reinforce the module's key messages

- **Spaced repetition.** Seeing "Pause. Check. Report." on a poster, in a welcome email and on the reference card, across several modules, is the spacing the course relies on for retention (`01_LEARNING_DESIGN.md`, principle 7).
- **Priming the hook.** A "report suspicious emails" poster near the player's desk, seen before a phish arrives in the Apply beat, makes the reporting route feel like part of the furniture rather than a new idea.
- **Consistency as trust.** When the poster, the mentor and the card all say the same thing the same way, the message reads as the organisation's settled position, not one trainer's opinion.
- **A bridge to the harder formats.** A demonstration scene (EX-05) or an attacker-view interlude (EX-06) often opens from a document: a notice about an authorised test, an email setting up a scene. And every module ends at an in-world document, the reference card on The Lark, so the last thing the learner touches is the thing they keep.

## EX-05 Demonstration scenes and EX-06 attacker-view interludes

These two formats show an attack rather than describe it, which is what makes a consequence real. They are the course's main way of teaching a feeling and a consequence (see the decision table). They differ in who is doing the attacking: in a demonstration scene the player watches it happen to a colleague; in an attacker-view interlude the player briefly becomes the (authorised) attacker. Both are built from pieces the engine already has (`research/current_state_break_escape.md`): there is no camera system, so a demonstration scene is a `person-chat` or video-call overlay opened by a timer or an event mapping, and an attacker-view interlude reuses the campaign's lockpicking, RFID and social engineering mechanics with a role switch (BE-11).

### EX-05 Demonstration scenes

A short cutscene in which an attack works on a colleague, then is unpicked by the mentor. The structure:

1. **A normal moment.** A colleague (Leo, Kev, Martin) is busy, doing their job. Nothing looks wrong.
2. **The attack lands.** The player watches the colleague be talked into something, or sees the result (a ransom note on a screen, an account sending odd emails). The player is a witness, not a participant.
3. **A beat of consequence, not gore.** Where the harm matters, a time skip (BE-16) shows where it led: invoices sent to strangers, a service down. Calm, not a jump scare.
4. **The mentor unpicks it.** Ama (or Kai) steps in: here is what happened, here is the one thing that would have stopped it, here is how you would do that. This is the part that turns a scare into a lesson (`01_LEARNING_DESIGN.md`, debrief rationale).

### EX-06 Attacker-view interludes

The player briefly plays an authorised tester, usually Jo Fairweather (the ethical social engineer at Northlight Security, `03_WORLD_AND_CAST.md`), to feel how little an attacker needs. The structure:

1. **Authorised framing, up front.** Before anything, it is clear this is a sanctioned test: Larkspur has hired Jo, the player is helping her, nobody real is being harmed. A role switch (BE-11) changes the player's character and kit for the interlude, then switches back.
2. **The player does the attacker's move**, at awareness level: build a pretext from public posts, tailgate in with two coffees, copy a badge left on a table, pull a draft from the recycling. It reuses existing mechanics (lockpicking, RFID, the OSINT board, the shredded-document minigame) but stays at "look how little this took".
3. **Jo names what made it easy.** She is candid and funny about it: the propped door, the badge on the table, the holiday dates on a public profile.
4. **She closes with what would have stopped her.** Always. Every attacker-view interlude ends on the defence, never on the thrill of the attack.

### Shared rules

Both formats are bound by the same rules, which come straight from the brief:

- **Authorised framing for anything attacker-side.** An attacker-view interlude is always an authorised test with a named tester and a clear "this is sanctioned" set-up. The player never does anything that reads as a real attack on a real target.
- **Always end with "what would have stopped it".** Neither format is allowed to finish on the attack working. The last beat is the defence: the one action, pause, check, report, lock the door, that would have changed the outcome. This is the rule that keeps a demonstration from being fear without action (`01_LEARNING_DESIGN.md`, principle 2).
- **Awareness level only, never a how-to.** Attacks are shown by what the victim saw and what stops them, not by how to carry them out (`AWARENESS_COURSE_BRIEF.md`). An attacker-view interlude shows how little an attacker needs (a propped door, a public post), never the technical delivery. No working commands, no step-by-step tradecraft. Keep the briefs for these short and at this level (`AGENTS.md`).
- **No blame, no "stupid victim".** The colleague in a demonstration scene is likeable and competent; they were busy and expecting that email (the core_01 pitfalls make this explicit for Leo). The attacker is shown as ordinary and businesslike, never a hooded figure (`03_WORLD_AND_CAST.md`).
- **Paired with the doable action.** As with every scare in the course, the consequence is immediately followed by "and this is all you need to do".

### Examples from the seeds

From `docs/agents/AWARENESS_MODULE_SEEDS.md`, with the format each uses:

- **core_01 (Inbox Zero):** a demonstration beat where Kai shows what happens to a report (the report queue, "pulled from 38 inboxes"), an EX-05 scene. The alternative concept "The Phish Tank" is an EX-06 interlude: with Jo, the player picks a pretext and levers for an authorised phishing test, then the test lands in their own inbox. Teaches the levers by using them, kept to pretexts and psychology, no technical delivery.
- **core_02 (The Caller):** Jo plays the recording of her authorised test call to reception, and Maureen explains how she caught her (EX-06, then the defence).
- **core_04 (The Golden Hour):** Kai's behind-the-scenes view of what each report let the team do, and demonstration beats of incidents spreading until reported (EX-05, with the blast-radius mechanic).
- **core_06 (Need to Know):** Jo pulls a discarded draft out of the ordinary recycling and pieces it back together, using the existing `shredded-document` minigame (EX-06), closing on "shred it, and this does not happen".
- **core_07 (Zero Hour):** a colleague's PC shows a ransom note (the `ransomware-display`, seen not played) and a network view shows how far it spread before the report (EX-05), then the isolation and reporting action.
- **core_10 (Tailgate):** "Red Team Day", an EX-06 interlude where the player joins Jo on an authorised building test (tailgate at the propped door, copy a badge from a table, open a cabinet), each step ending with what would have stopped her; the next day the player is the defender.
- **core_12 (Open Book):** the OSINT board (EX-06, BE-11): with Jo, the player connects a colleague's public posts into a pretext, then the roles flip to locking the profile down.
- **core_13 (Workaround) and core_15 (The Assistant):** EX-05 demonstration beats where a shortcut or a pasted secret leads, via a time skip, to a breach or a deepfake call, each unpicked by the mentor and answered with the safe route.

## EX-07 Shared glossary and tooltips

One plain-English definition per term, across the whole course, shown as a tooltip wherever the term appears and listed on the reference cards. A learner who meets "MFA" in core_01, core_03 and core_15 should see the same short definition each time, not three slightly different ones. This is both a consistency measure and a teaching one: it supports Mayer's pre-training principle (knowing a key term before it is used in a lesson), and it lets the modules use a term without stopping to redefine it every time.

How it works:

- **One canonical definition per term.** Each module's `concepts.md` already has a Glossary section (core_01's lists phishing, spear phishing, MFA, thread hijacking and the rest). EX-07 reconciles these into one shared glossary, so each term has a single agreed definition. Where two modules use a term, the module that teaches the topic owns the canonical definition and the others reuse it, following the topic-boundaries table in `00_COURSE_OVERVIEW.md` (for example, MFA belongs to core_03; core_01 and core_15 link to it rather than redefining it).
- **Tooltips in the world.** A defined term shown in dialogue, in an in-world document or in a minigame can be hovered (or tapped, or focused by keyboard) to show its one-line definition. Tooltips are optional and never block: they meet the accessibility baseline (keyboard reachable, dismissible, no reliance on hover alone, BE-04, HA-23), and reading on without them loses nothing, because the term is also explained in context the first time it is used.
- **On the reference cards and in Hacktivity.** The same definitions appear on the module reference cards (BE-09) and in the learner's Hacktivity glossary, so the definition a learner saw in the game is the one they find later.

Rules:

- **Plain English, one line, no jargon inside the definition** (reading age about 11 to 12, `01_LEARNING_DESIGN.md`). A definition that needs another defined term is rewritten.
- **UK first**, with a note where usage differs, consistent with the concepts files.
- **Defined once, reused everywhere.** A term's wording is not edited in one module and left stale in another; the shared glossary is the single source, and the modules pull from it.
- **First taught in context, then available everywhere.** The tooltip is a reminder, not the first teaching of a term; the module that owns the term still introduces it properly.

EX-07 is P2 and small: the glossaries exist, so the work is reconciling them into one list and adding the tooltip mechanism and the Hacktivity glossary page.

## EX-08 Printable poster and briefing pack

A pack of print-ready materials for a customer to use in their own offices, between sittings of the course: posters, desk cards and a short team briefing per module, branded with the organisation's own profile. Where EX-04 is the in-world document inside the game, EX-08 is the real-world document on a real office wall. It carries the same key messages out of the game and into the place where staff actually work, which is both a reinforcement and a compliance point.

It is P2 and small, because it is generated from material that already exists: each module's `concepts.md` (the key messages and the procedure) and its reference card (BE-09).

### What is in the pack

Per module:

- **Posters:** one or two per module, each carrying a single key message in the course's visual style, for a wall, a kitchen or a noticeboard. The same messages the mentor teaches and the reference card holds, so the office wall agrees with the game.
- **Desk cards:** a small card a member of staff can keep at their desk, with the motto, the reporting route and the module's one or two key actions. In effect the reference card (BE-09) in print.
- **A short team briefing:** a page or two a manager or security champion can use to run a five to ten minute team conversation about the module's topic, with the key messages, a couple of talking points and the organisation's own reporting details. Lighter than the facilitator notes (which are for running the full module as a session); this is for a stand-up or a team meeting.

### How it is built and branded

- **Generated from `concepts.md` and the reference card**, so the pack never drifts from what the game teaches. When the concepts change, the pack regenerates.
- **Branded with the organisation profile (BE-05, HA-11):** the customer's name, logo, reporting route, service desk number and policy names fill in, exactly as they do for the in-game documents and the reference card. One Larkspur-default pack ships, and each customer gets their own version from their profile.
- **In the course's visual style**, with fictional names and no real third-party brands in the default pack.
- **Refreshed with each annual edition**, so the posters on the wall match the current year's course and advice.

### Accessibility

- **Large type and high contrast** on the print materials, so a poster is readable across a room and a desk card is readable by someone with low vision.
- **Alt text on the digital versions.** The pack is supplied as accessible digital files as well as print, and the digital versions carry alt text for every poster and card, so a message in an image is also available as text (WCAG 2.2, consistent with HA-23).

### Why it is worth building: multiple methods of communication

Several standards expect awareness to be delivered through more than one channel, not a single annual e-learning module, and EX-08 is how the course provides the extra channels for a customer. From `02_COMPLIANCE_MAPPING.md`:

- **PCI DSS 12.6.3** (v4.0.1) requires personnel to be trained on hire and at least every 12 months "using multiple methods of communication", and the standard's testing procedures look for "materials showing more than one method". Posters, desk cards and briefings alongside the game are those multiple methods.
- **The ICO's data protection audit framework** (the Training and awareness control measures in its Accountability toolkit) and **NCSC CAF B6.b** (Cyber Security Training) both expect a range of methods rather than a single delivery.
- **ISO/IEC 27002 control 6.3** explicitly lists posters and briefings among the ways to run an awareness programme, so the pack maps directly onto recognised good practice.

A module that uses EX-08 notes this in its "Compliance coverage" section using the short references in `02_COMPLIANCE_MAPPING.md`, and says "contributes to" rather than "meets", since the pack is one method among several.

## The explainer library (first draft)

The explainers each module needs, drawn from `docs/agents/AWARENESS_MODULE_SEEDS.md` and, for core_01, its written module plan. **This is a first draft, to be reconciled with the module plans as they are written in parallel.** Lengths, who delivers and which set-pieces each module uses will shift as each module is designed; where a module plan and this table disagree, the module plan wins and this table is updated. Every module also has the two formats not listed row by row here: in-world documents (EX-04) and a reference card (BE-09) at the end, and from EX-08 a printable pack. The mentor is Ama Owusu unless noted; she is the course's recurring mentor across all core modules (`03_WORLD_AND_CAST.md`).

Lengths: an EX-01 chunk is 60 to 90 seconds; a module's Learn beat is usually 2 to 4 minutes of mentor explaining in total (`01_LEARNING_DESIGN.md`). Videos are 60 to 120 seconds.

| Module | Explainer | Format | Length | Delivered by |
|---|---|---|---|---|
| core_00 First Day | The motto, the reporting route, "no blame", what the security team does | EX-01 | 2 to 3 min | Ama (with Maureen, Precious, Owain on the tour) |
| core_01 Inbox Zero | "Anatomy of a phish" (the ask and feeling, sender, link) | EX-01, BE-08 | 90 s | Ama |
| core_01 | "What if I clicked?" (the procedure) | EX-01 | 45 s | Ama |
| core_01 | "Can't MFA stop this?" (session-stealing, in one breath) | EX-01, BE-08 | 30 s | Ama |
| core_01 | "What happens to a report" (the report queue, pulled from inboxes) | EX-05 | 45 s | Kai |
| core_01 | Optional "Sixty-second phish" on the meeting room screen | EX-02 | 60 s | Ama (recorded) |
| core_02 The Caller | The levers and the defence (hang up, call back, never share codes) | EX-01, BE-10 | 2 to 3 min | Ama |
| core_02 | Jo's recorded authorised test call to reception, unpicked | EX-06 | 1 to 2 min | Jo Fairweather, Maureen |
| core_03 Keys to the Kingdom | Passwords, passphrases, MFA, prompt bombing | EX-01, BE-08 | 2 to 4 min | Owain and Ama |
| core_03 | Optional "guessing rig": common passwords fall, a passphrase holds (no how-to) | EX-06 or EX-05 | 30 to 60 s | Ama (demonstration) |
| core_04 The Golden Hour | What counts as an incident, how and what to report, why minutes matter | EX-01 | 2 to 3 min | Ama |
| core_04 | Incidents spreading on the blast-radius map; what each report enabled | EX-05 | 1 to 2 min | Kai |
| core_05 Personal Effects | UK GDPR for staff, in short chunks; recognising a request; breaches | EX-01, BE-08 | 3 to 4 min | Tomasz |
| core_06 Need to Know | Classification, sending, sharing, printing, disposal | EX-01 | 2 to 3 min | Ama and Tomasz |
| core_06 | Jo rebuilds a draft from the ordinary recycling (shredded-document) | EX-06 | 1 to 2 min | Jo Fairweather |
| core_07 Zero Hour | Malware and ransomware, updates, what to do | EX-01 | 2 to 3 min | Ama |
| core_07 | A colleague's ransom note; the network spread before the report | EX-05 | 1 to 2 min | Ama (with Kai and Owain on recovery) |
| core_08 The Download | Fake downloads, lookalike sites, browser warnings, the software portal | EX-01, BE-08 | 2 to 3 min | Ama and Owain |
| core_09 On the Move | Home, public places, public Wi-Fi, travel, lost devices | EX-01, BE-10 | 2 to 3 min | Ama (with Zainab) |
| core_10 Tailgate | "Red Team Day": tailgate, badge copy, a cabinet (authorised test) | EX-06, BE-11 | 3 to 4 min | Jo Fairweather |
| core_10 | The defender's day: challenging politely, clean desk | EX-01 | 2 to 3 min | Precious and Maureen |
| core_11 Change of Details | BEC and payment fraud; verify changes, call back, two approvers | EX-01, BE-08 | 2 to 3 min | Ama |
| core_11 | Hassan's own near miss | EX-05 | 45 to 60 s | Hassan |
| core_12 Open Book | The OSINT board: connecting public posts into a pretext, then locking down | EX-06, BE-11 | 2 to 3 min | Jo Fairweather |
| core_13 Workaround | Found USB, personal email and cloud, shadow IT, the right route | EX-01 | 2 to 3 min | Owain |
| core_13 | Where each shortcut led (time skips to a breach) | EX-05, BE-16 | 1 to 2 min | Ama |
| core_14 Notice Period | Insider risk (mostly accidental), raising a concern fairly | EX-01 | 2 to 3 min | Mei Lin, Ama, Tomasz |
| core_15 The Assistant | Safe use of AI tools; verification beats detection | EX-01, BE-08 | 2 to 3 min | Ama (with Lark Assist) |
| core_15 | The deepfake video and voice calls (check another way) | EX-05 | 1 to 2 min | Ama |
| core_16 Small Print | "Allowed, Not Allowed, or Ask First?" game show; policy acknowledgement | EX-01 (light), EX-04 | 1 to 2 min | Ama and Owain |
| core_17 Year End | Capstone; the competency profile and what to do next | EX-01 (light) | 2 to 3 min | Ama |
| role_01 Crisis Room | Cyber risk as business risk; the board's questions; an opening piece | EX-01, EX-03 (leader opening) | 2 to 3 min | Faisal, Anne-Marie |
| role_02 Payment Run | Finance controls against payment fraud, in depth | EX-01 | 3 to 4 min | Hassan |
| role_03 Reset Request | Verifying identity for resets; privileged access hygiene | EX-01 | 3 to 4 min | Owain and Kai |
| role_04 Ship It | Secrets, dependencies, AI coding assistants, review | EX-01 | 3 to 4 min | Darius |
| role_05 Joiners, Movers, Leavers | Access on joining, moving and leaving; recruitment fraud | EX-01 | 3 to 4 min | Mei Lin |
| role_06 Who's Calling? | Verifying callers under pressure; spotting a scammed customer | EX-01 | 2 to 3 min | Shauna |
| role_07 Due Diligence | Suppliers as a route in; proportionate due diligence; the clauses | EX-01 | 2 to 3 min | Harjit |
| sector_01 Ward Round | Smartcards, shared workstations, confidentiality, downtime | EX-01 | 2 to 3 min | a clinical lead (to decide; Ama, or a new named character) |

Open points this draft leaves for the module plans:

- **sector_01's mentor** is undecided. The seed keeps the SIS healthcare canon separate and uses hospital staff only as extras, so sector_01 needs either Ama in a client hospital or a new named clinical information-governance lead. Flagged in the open questions below.
- **Which concepts become a video.** The table marks only core_01's optional "Sixty-second phish" and role_01's leader opening as video. Whether core_15 (deepfakes) or core_07 (ransomware spread) also want an EX-02 video, rather than the mentor plus a visual aid, is for those module plans to decide once EX-02 has a proof of concept.
- **Attacker-view interludes** are drafted for core_01, core_02, core_06, core_10 and core_12, matching Jo Fairweather's listed modules. If a module plan adds or drops one, update this table and Jo's entry in `03_WORLD_AND_CAST.md`.

## Open questions and proposals

For the orchestrator and the user. None of these should hold up the module plans, which can use EX-01 and EX-04 today.

1. **EX-02 needs a proof of concept before any module depends on it.** The whole engine-recording pipeline, and especially muxing the TTS audio onto Playwright's silent video at line timings, is unproven here. Build one short video end to end, show the user, and only then let modules schedule engine-recorded videos. Until then, a module wanting a video uses the mentor plus a visual aid, or a produced video (EX-03). EX-02 is sized M in `features/README.md`; that looks right for a first version, but the audio-sync step is the risk, so a short spike is worth doing first.
2. **The BE-08 and BE-19 ink tags are proposed, not settled.** The worked example uses `#visual_aid`, `#aid_step` and `#trigger_minigame: knowledge_check#<id>`. The exact syntax belongs to BE-08 and BE-19; this document assumes a working `#trigger_minigame` (today a stub) and a way to show and step a visual aid in the conversation panel. The feature owners should confirm the tag names.
3. **Keep engine videos generic across customers.** The recommendation is that EX-02 and EX-03 videos carry no organisation-specific values in the spoken track or the frame, so one render serves every customer; the customer's own details live on the intranet page and reference card around the video (BE-05). Per-customer branding on a video should be a template overlay added at edit time, treated as an exception. The user should confirm this is acceptable for the compliance story, or ask for per-customer rendering (which would be far more expensive).
4. **The project lead's real-person cameo (EX-03) needs a decision and consent.** The game character cliffe_schreuders can present as an EX-02 engine video cheaply and safely. Filming the real Dr Schreuders is a produced video and needs his agreement and a plan to keep it evergreen. The user should say whether a real-person "face of the course" is wanted at all.
5. **sector_01's mentor is undecided** (see the explainer library). Ama in a client hospital, or a new named clinical information-governance lead, keeping the SIS healthcare canon separate. This is a cast decision for `03_WORLD_AND_CAST.md`.
6. **EX-01's size understates its true cost.** It is listed MVP, S, which is right for the authoring pattern, but a working mentor explainer needs BE-08 (M), BE-19 (S) and MG-20 (M) first. The dependency is already noted in `features/README.md`; worth repeating so the MVP plan budgets for those three, not just for EX-01.

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

Internal references used throughout: `AWARENESS_COURSE_BRIEF.md`, `01_LEARNING_DESIGN.md`, `03_WORLD_AND_CAST.md`, `00_COURSE_OVERVIEW.md`, `features/README.md`, `02_COMPLIANCE_MAPPING.md`, `modules/core_01_phishing_email/`, `docs/agents/AWARENESS_MODULE_SEEDS.md`, `research/current_state_break_escape.md`, `research/current_state_lab_sheets.md`; the engine and skills: `public/break_escape/js/minigames/person-chat/` (including `lip-sync.js` and `person-chat-ui.js`), `story_design/ink/lab_sheets/phishing_social_engineering.ink`, `scenarios/lab_intro_linux/ink/instructor.ink`, `.claude/skills/tts-audio/SKILL.md`, `.claude/skills/playtest-scenario/SKILL.md`, `.claude/skills/room-pov-background/SKILL.md`, `docs/test-bridge.md`, `AGENTS.md`, and the project lead's character art at `public/break_escape/assets/characters/cliffe_schreuders*`.
