# m04 office-life plan review, round 4

Reviewer tier: planning tier, read-only delta review of `git diff acb2e682a` on PLAN.md plus the round 3 outcomes, at commit 05f2ba341.

Counts: B 0 / M 1 / m 4

## Findings and outcomes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| M1 | major | A newcomer struck at the kettle never fights back in the ops office and can chase into reception. A needs walk is `goToAndStay` (`npc-needs.js:5731` to `:5732`); arrival sets `homePosition` to the kettle cell (`npc-behavior.js:3448`); `homeRoomId` stays `main_entrance` from spawn (`:494`); the chase anchor is `{homePosition, roomId: homeRoomId}` (`:1113` to `:1117`); `hostileMayChase` is false when the player is not in the anchor's room (`npc-chase-leash.js:27` to `:29`); attacks happen only in chase (`npc-behavior.js:1168` to `:1171`, `:2696`). So no reply in the ops office; a follow into reception within 160 px aggro and 400 px of the kettle cell; no snap back to the sofa. The plan said the leash keeps a struck newcomer near the sofa. | Fixed: 2.12 states the real anchor and behaviour; section 1 and the section 2 table match; 10.4 adds a kettle-strike case; QUESTIONS.md Q7 offers `aggroDistance` as the only data-side lever. |
| m1 | minor | A newcomer struck mid-walk (not KO) walks back to the last needs arrival point: the job is cancelled (`npc-needs.js:1421` to `:1424`), `cancelMove` leaves `homePosition` (`npc-behavior.js:3391` to `:3411`), and the home push walks them back (`:3231` to `:3264`). KO keeps them where they fell (`:1036` to `:1048`). | Fixed: table column, section 1 and the 10.4 cooler-walk case. |
| m2 | minor | 2.7 still said "the three evacuation mappings". | Fixed: "two". |
| m3 | minor | The guard faces south by default (`npc-behavior.js:505`; no direction in `scenario.json.erb:715` to `:760`); his cone (`npc-los.js:242` to `:264`) covers the cooler cell as well as the sofa at load; `facePlayer` then keeps the player's last bearing. Plan claims still hold. | Fixed: cooler bullet and L1 note the cooler cell is in his cone, accepted for the same reason. |
| m4 | minor | The stated reason both are talkable covers Ibrahim only. Joanne needs a story because E on any person NPC opens person-chat (`interactions.js:914` to `:927`), which errors without one (`person-chat-minigame.js:476` to `:498`). | Fixed: section 9 gives both reasons. |

## Checked and clean

All round 3 fixes: displayName prefixes (`npc-needs-chatter.js:42`, `:47` to `:56`; `validate_scenario.rb:1214` to `:1238`); note text and changed-lines table; `hydrogen_alarm` mappings (1057 to 1075) and the `crew_warned` emitter (634 to 636); `onceOnly` total 15; m1 to m7 wording; no stale names. Voicing count 24. Hostile unseats a seated NPC (`seating.js:1991`). Exchange owner resolution (`npc-needs.js:2992` to `:3011`, `npc-needs-chatter.js:183` to `:197`).

## Sign-off: both newcomers talkable

Yes, sound and minimal. The exchange owner must be one of the pair and lines come from the owner's own story, so Ibrahim needs a `storyPath`; Joanne needs one anyway because E opens person-chat. Pointing Joanne at Ibrahim's file with another `currentKnot` saves a file but no lines and breaks the naming convention; not recommended.

## Not checked

Reload of a struck newcomer (spawn point, seated or not); whether the cross-room chase finds a path through the ops door (M1 is inferred from code); the person-chat background when the NPC is at the kettle; QUESTIONS.md and HANDOVER.md changes.
