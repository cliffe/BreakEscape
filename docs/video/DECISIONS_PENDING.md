# Video pipeline: decisions pending (2026-10-29)

From the user's m01 review feedback (artifact HhdmENxRVcGuCa5BiZS5Gd, `feedback/m01`): verdict "rethink".

## V1. Game title and title art
"Break Escape" is the engine, not the game. The repo has no game title or logo art (only `marketing/capsule_concepts/c1_keyhole_hookpick6.png`, a keyhole capsule concept with space for a title but no text). Needed: the game's name and its title/logo file. Recommendation: the user uploads or points to the art; until then a placeholder card.

## V2. Hacktivity logos at the end
User: put Hacktivity Labs → Games at the end, using the full logos. Only `hacktivity-logo.svg` is in the repo; no Hacktivity Games logo. Recommendation: cut the old trailer's own logo transition (0-5 s, 1080p60) as the closing sequence until vector logos are supplied.

## V3. Length
User wants more NPCs with their best lines, a "Real Hacking" beat (placeholder cut from the old trailer), Derek's 8.9 s Entropy line and looser minigame framing. That doesn't fit 30 s. Recommendation: a 60 s mission trailer as the main cut, built on the old 1:15 trailer's structure; a 30 s cut-down later.

## Resolved
- V1 (user, 2026-10-29): the game is **SAFETYNET: Licence to Hack**; use `hacktivity/app/assets/images/event_titles/safetynet_licence_to_hack.svg` (and the `_social.jpg` keyhole art).
- V2 (orchestrator default): animate the real `hacktivity-logo.svg` → `hacktivity-games-logo.svg` from the Hacktivity repo at the end; fall back to cutting the old trailer's 0-5 s only if the SVGs don't animate well.
- V3 (orchestrator default, user may overrule): a 60 s trailer as the main cut; a 30 s social cut-down later.
