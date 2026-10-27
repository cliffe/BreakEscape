# P4-E: influence bar, tells, pip, From the call

Done 2026-10-21. Not committed.

## What landed

The chat header shows the existing influence bar (`ui/influence-bar.js`) and a tells list. Phone tells are also system bubbles that are not written into the contact history.

- Person-chat: `.person-chat-header` at the top of the caption (`.se-chat-header`, `data-mount="person-chat"`). The framework `.minigame-header` stays hidden, which is how person-chat already works (`base-minigame.js` hides it unless `params.headerElement` is set).
- Phone-chat: the same block inside `.conversation-header` (`data-mount="phone-chat"`). Each tell is also a `.message-bubble.pretext-tell` with `data-render-only="true"`, appended to the thread only.
- `attachPretext` calls `ui.mountPretext` once the session exists, and `refreshPretext` after each `pretext_say` / `pretext_ask`. Opening a contact clears the previous call's tells.
- Portrait tint: `PersonChatPortraits.setInfluenceBand`. Calm and the player portrait are untinted. Wary is sepia. Refusing and lower is a redder sepia. The filter is set only for the character `drawImage`, so the room background is left as it was. The phone avatar gets the same treatment through `data-band`.
- World pip: `ui/npc-influence-pips.js`, created in `core/game.js` beside `window.npcHealthBars` and updated beside it. It draws while influence is not the start value, above the walk sprite, using the health-bar gauge and theme colours. No sprite, `display.pip: false`, or a hostile NPC (the health bar has that spot) and the pip is not drawn. It hides again when the value returns to the start.
- Board: a held fact listed in any `pretextNpcs` ask's `grants.intel` is taken off the recon list and shown under "From the call" on that person's card (or the company card, when the subject is `company`). Readiness slots still read the held globals, so a slot that names one of those facts still ticks. The lab does not put call facts in readiness slots.

`display.bar: false` mounts no `.influence-bar`. Tells, the portrait tint and threshold effects still run. `resolveInfluenceDisplay` already forces the number off when the bar is off.

## Tests

`bundle exec node --test test/js/social-influence-pip.test.mjs`

8 pass, 0 fail, exit 0.

Covered: the §4.4 lines (wrong manager, repair summed to +20, unknown, technique, shared detail, ask ok / pending / refused, category wording); tint strings; bar and tells in both headers; one render-only phone bubble, not duplicated on refresh; `bar: false` leaves no bar while `reports` still sets `dev_reported` and `dev_wary` and the influence lands at -90; pip absent with no sprite, with `pip: false`, at the start value, and while hostile; a sprite pip at the health-bar offset (depth 850) that is destroyed when the value returns to the start; Lord's two call facts under `fromCall` and `lord_intern` still a recon fact.

`bundle exec node --test test/js/social-intel-board.test.mjs`

10 pass, 0 fail. The `getTestState` key list now includes `fromCall` (empty on the fixture).

`node --check` on the edited modules, including `core/game.js`. Exit 0.

## Judgements

- Ask lines read "now at N" rather than "she is at N". The design's Priya table uses "she". Dev is "he". One sentence has to cover both.
- A call fact is identified from `grants.intel`, which is the list `06` says the board reads. The fact's `source` string is not used, so an OSINT element id cannot collide with an ask id.
- The pip and the health bar share the offset and the theme colours. They are not drawn together.

## Left undone

- `tools/playtest/se/bridge-4.jsonl` is not in the tree. P4-T0 writes it. The bridge rows were not run. The node test is what shows the bar and the tells in both headers.
- No browser run, so the caption placement, the phone bubble layout, the portrait tint and the pip were not looked at on screen.
- A fact whose `se_intel_*` global is set from ink, and which is not in any ask's `grants.intel`, stays in the recon list.
