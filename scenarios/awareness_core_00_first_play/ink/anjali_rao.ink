// ================================================
// Awareness core_00, first-play brief: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru; she receives the
// reports (BRAND_SET.md, E3/E5). Placeholder sprite until PixelLab.
// One welcome line; the kiosk runs the brief. The NPC record carries the mapping that completes
// the task when episode_core_00_first_play_done changes (ENG-10, 11 Part A), so the ink only reads
// that global. No defend set: this is a brief-only episode, nothing is scored.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there quietly, and a re-talk
// re-enters it and says the line that fits the moment.
// The wiring agent moves this to scenarios/awareness_core_00_first_play/ink/anjali_rao.ink and
// compiles it; storyPath on the host NPC points at the compiled anjali_rao.json, currentKnot start.
// ================================================

VAR episode_core_00_first_play_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_core_00_first_play_done:
        Anjali Rao: That's you set. Start your first episode whenever you're ready, and report anything that doesn't sit right.
    - else:
        Anjali Rao: Welcome. I'm Anjali, I look after security here. Open the kiosk for a short brief before your first episode. It's all practice.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
