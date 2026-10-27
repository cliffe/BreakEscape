# Theme songs brief: Licence to Hack, m01–m10

Each mission gets a Bond-style title song: the kind that plays over the opening titles, with silhouettes, smoke and a gun barrel. Two versions per mission, by different authors, then a review.

## The song

- **Title** is the mission title. **The chorus should contain the title**, sung naturally and not crowbarred in. If the title truly won't sing, put it in the hook line nearest the chorus and say why in your notes.
- **Form:** Verse 1, Pre-chorus, Chorus, Verse 2, Pre-chorus, Chorus, Bridge, Final chorus (a lift or key change is fine), optional short outro. Roughly 250–380 words. Mark the sections.
- **Poetic.** Bond lyrics run on double meanings, seduction-and-danger imagery and a narrator who might be the hero, the villain or someone in between. Use imagery and leave room for a listener to read into it. Rhyme and metre should scan when sung; read every line aloud in your head against a slow 6/8 or 4/4 ballad pulse.
- **Set in the SAFETYNET universe and in this mission.** Fold in passing references to the mission's story (its setting, antagonist, betrayal, moral choice, the ENTROPY cell, named characters where a name sings well) and its game elements (lockpicks, keycards, PIN pads, the terminal and its flags, Agent HaX on the phone, the Field Guide, guards, fingerprints, CCTV, whatever this mission actually has). Keep the references passing: a lyric, never a walkthrough. Someone who played the mission should catch them; someone who hasn't should still hear a spy song.
- **No spoilers that ruin a twist** go in plain words. Hint at them the way a title song foreshadows a film.
- **Technical content:** hacking appears only as imagery (a cursor, a flag, an open port as a metaphor, a key that turns). No commands, tool names used as instructions, or exploit detail.

## Version styles

- **Version A, classic:** the Shirley Bassey / Tom Jones / *Goldfinger*, *Thunderball*, *Diamonds Are Forever* tradition. A big, brassy, belted chorus, a sweeping melodrama, a narrator who addresses the mark, the hero or the villain directly.
- **Version B, modern:** the Adele *Skyfall* / Billie Eilish *No Time to Die* / Chris Cornell *You Know My Name* tradition. More intimate and brooding, often sung from inside one character's head (the antagonist, the mole, a victim, the agent), with a slow build to a heavy chorus.

## Sources (read these; trust the ink and scenario over older docs)

- Mission: `scenarios/<mission>/mission.json`, `scenarios/<mission>/scenario.json.erb` (narrative, rooms, objects, objectives) and `scenarios/<mission>/ink/*.ink` (who the people are, what they say, the choices). README / stale_README files may be out of date; where they conflict with the ink, the ink wins.
- Universe: `story_design/universe_bible/` (overview, `02_organisations/`, `03_entropy_cells/`, `04_characters/`, `05_world_building/rules_and_tone.md`).
- Season arc: `planning_notes/overall_story_plan/season_1_arc.md`.
- m09 and m10 are still in design: use `planning_notes/overall_story_plan/mission_initializations/finale/FINALE_ARC.md` and whatever exists under `.../m09_digital_archaeology/stages/` or `.../m10_full_disclosure/stages/`.
- **Do not open:** anything under `secgen/`, SecGen XML, `FINALE_VM_PLAN.md`, `VM_SHAPE.md`, lab sheets, solution guides or field-guide exploit material. You don't need them for lyrics.

## Writing rules

- UK English ("Cyber Security" has a space).
- None of these words: delve, intricate, tapestry, pivotal, underscore, landscape, foster, enhance, crucial, breathtaking, captivate, profound, steadfast, robust, load-bearing. No "testament to", "it's not X, it's Y" constructions, or filler -ing tails.
- Avoid stock spy-song clichés used straight (shaken not stirred, licence to kill, "nobody does it better"); a knowing twist on one is fine.

## Output file

Authors write to `story_design/theme_songs/drafts/<mission_folder>_<A|B>.md`, e.g. `m03_ghost_in_the_machine_A.md`:

```
# <Mission title>: Version A (classic)
<lyrics, sections marked [Verse 1], [Pre-chorus], [Chorus] ...>
## Notes
<3–6 bullets: which lines reference which story/game elements; any twist hinted at>
```

The reviewer then merges both into `story_design/theme_songs/<mission_folder>.md` (Version A, Version B, Review).

## Review (one reviewer per mission)

Read both drafts and the same mission sources, then judge each version against this brief:

1. **Title in the chorus**, sung naturally.
2. **Singability:** lines scan, stresses fall on the beat, rhymes land (slant rhymes are fine), the chorus is memorable after one hearing, and A and B differ in voice.
3. **Canon accuracy:** names, places, the ENTROPY cell, the plot and the moral choice match the ink and scenario. Flag anything invented that contradicts canon.
4. **Mission references:** enough passing story and game details that a player catches them, none that read like a walkthrough, and no twist given away in plain words.
5. **Poetry:** imagery over statement, double meanings, no filler lines, no cliché used straight, and no banned words or AI tells.

Then **fix what you found** directly in the lyrics: targeted line edits that keep each author's voice, never a rewrite. Write the merged file `story_design/theme_songs/<mission_folder>.md`:

```
# <Mission title>
## Version A (classic)
<revised lyrics>
### Notes
## Version B (modern)
<revised lyrics>
### Notes
## Review
- Version A: verdict (1–2 lines), score /10 before → after
- Version B: verdict, score before → after
- Changes made: bullet per edited line (old → new, why)
- Stronger version and why (1–2 lines)
- Left for the user: anything you couldn't settle
```

Leave the drafts in `drafts/` as they were.

## Version C: the agent's voice

Every Version C is sung by the SAFETYNET agent: Agent 0x00, the player character. Everything above still applies (title in the chorus, form, length, sources, banned words, no technical detail, no spoiled twist), plus:

- **The agent is the narrator in every line.** First person, the agent's own head: what they see, carry and fear on this mission, addressing the target, the mark, HaX on the phone, the city, or themselves.
- **Nameless and ungendered.** The player is 0x00 and nothing more: no name, no pronouns for the agent, no body details that fix gender or ethnicity.
- **The agent doesn't know the twist yet.** Foreshadowing works only as dramatic irony: a line that means one thing to the agent and another to someone who has played the mission. The agent never "sees through" the mole or the sleeper before the mission does.
- **Choose the tradition** (classic, modern or a blend) that suits this mission, and say which in your notes.
- **A different song from A and B.** Read the mission's merged file `story_design/theme_songs/<mission>.md` first. Don't reuse its hooks or images, and read its Review sections, which list the spoiler and canon traps those songs fell into.
- **Where the agent is in the season.** m01 is the first day in the field and m10 is the end. Let the voice change across the season (new and keen, then tested, then betrayed by one of their own in m08, then hunting). Check `planning_notes/overall_story_plan/season_1_arc.md` for what the agent has been through by this mission.
- **Avoid season-wide repeats:** no "let it hurt afterwards", no clock on the wall, no "darling", no flags as candles.

Authors write `drafts/<mission_folder>_C.md`. The reviewer adds `## Version C (agent)` with `### Notes` and a `## Review (C)` (same format as the Review above) to the end of the mission's merged file, leaving A and B untouched.
