# Headshot miss cache

## Cause

`headshotKeys()` in `public/break_escape/js/utils/npc-headshot.js` builds its candidate list from the avatar, the `spriteSheet` key and the `spriteTalk` stem, and `applyHeadshotBox()` tries each with `new Image()`, so every miss is a 404. m02's bed patients wear furniture sprites (`bed2` for Mrs Hargreaves, `bed_ms_chen` for Ms Chen), so the bark toast and taskbar lookups requested six files that cannot exist: `bed2_headshot.png`, `bed_ms_chen_headshot.png`, and the `mrs_hargreaves` and `ms_chen` `_v2` and plain headshots. The silhouette fallback worked; the only symptom was console noise. The same miss was repeated on every lookup.

## Fix

1. `isObjectSpriteKey(key, textures)` is true when a loaded Phaser texture has only numbered frames (a spritesheet, as objects and furniture are). Character atlases name their frames. A key whose texture is not loaded yet is not treated as an object, so lazily loaded atlases still get tried. No names are hard-coded. `headshotKeys()` takes an optional `{ textures }` for tests and defaults to `window.game.textures`.
2. An NPC wearing an object sprite has no headshot candidates except an authored `_headshot.png` avatar. This mirrors `avatar_unlocks.rb`, which already treats bed patients as having no headshot.
3. `headshotOutcome` (a module `Map`, same idea as `talkSrcOutcome` in person-chat-portraits.js) remembers each URL that missed (404, or not 32x32). A later lookup skips it with no new `Image()`. `resetMissingHeadshots()` clears it for tests.

No new art, no manifest. Legacy spritesheet characters (`hacker`, `hacker-red`) have no headshot files, so nothing is lost for them.

## Tests

`test/js/npc-headshot-miss-cache.test.mjs` (6 tests): bed patients get no candidates; an avatar headshot still counts for an object-sprite NPC; a character atlas keeps its sprite and talk-stem candidates; an unloaded key is still tried; a second lookup of a missed key makes no new `Image()`; a normal NPC resolves first try. Against the old source, tests 1, 2 and the second-lookup test fail; the rest are regression guards.

## Live proof (keyless server, :3094, m02 game from new-game.rb with --start-room hospital_ward)

Bark toasts (forced toast route) for patient_bed2, patient_bed5 and agent_0x99, two rounds each, network responses filtered to `_headshot.png`:

- Before the second commit, with only the sprite-key skip: 404 on mrs_hargreaves_v2, mrs_hargreaves, ms_chen_v2, ms_chen (the talk stems).
- Final: only `200 female_hacker_hood_v2_headshot.png` and `200 agent_hax_v2_headshot.png`. Zero 404s, none of the six names requested. The normal NPC headshot loaded. The bed patients' bark head box stays hidden as before (the bark path draws no silhouette).

Server killed and port 3094 confirmed closed.
