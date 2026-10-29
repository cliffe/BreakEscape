// ================================================
// Awareness core_17, annual edition: Graham Whitfield (person, Training Room)
// Brightwell's finance training lead, early 60s, white British, from Halifax; unhurried and kind. Acts as a neutral proctor for the year-end edition (BRAND_SET.md). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_core_17_annual_2027_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_annual_shells.py.
// ================================================

VAR episode_core_17_annual_2027_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_core_17_annual_2027_defend_defend_done:
        Graham Whitfield: That's the year covered, thanks. Check another way, report what doesn't sit right, and leave the rest to the people whose job it is.
    - else:
        Graham Whitfield: Welcome to the year-end edition. It's a mixed run of this year's messages, across a few channels and a few companies.
        Graham Whitfield: Real ones are in there with the scams. Take them one at a time, and say why on each.
    }
}
+ [Thanks, Graham.]
    Graham Whitfield: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
