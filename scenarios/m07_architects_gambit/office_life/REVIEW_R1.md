# m07 office-life plan review, round 1

B 1 / M 3 / m 7

Reviewer tier: planning and review. Plan reviewed at commit 8d2039d37.

Clean: lock and key diff expected empty; aim chain untouched; V5 and V2 clear; `npc_attacked:<id>` real (`player-combat.js:461`, data `{ npcId, wasFriendly }`); `door_opened` carries `connectedRoom` (`doors.js:951` to `:956`); `affordance: false` honoured (`office-presets.js:52`, `:67`); requireGlobal keys declared; credits placement after `:283` outside ERB; hide shape matches m05; the VM launcher is in `server_room` (`:2002`), so the pair are gone before the cascade can arm; voices unused in m07; all cited lines check out.

| Id | Sev | Finding | Outcome |
|---|---|---|---|
| B1 | B | The handover sheet the player must read says "Coffee machine: still broken" (`scenario.json.erb:1903`, `:1904`); the plan made it a working caffeine source. | Fixed: coffee machine dropped as a source and left undeclared; both operators use the cooler only (thirst); the broken machine is something they talk about. `:1904` added to the story-consistency list. |
| M1 | M | `needsHome` lacks `room`; units unstated (`npc-needs.js:1339`, `:4134` to `:4138`). | Fixed: `{ "room": "operations_floor", "x", "y" }` in tiles. |
| M2 | M | `heard_` keys counted but not declared (`mapping-patterns.md:164`). | Fixed: declared `false` in a new office-life block after `:2610`. |
| M3 | M | Talk ink has no upset or repeat branch (`mapping-patterns.md:165`); the unstruck operator would chat beside a knocked-out colleague. | Fixed: upset line with `#exit_conversation`, a repeat line, then the opener; clip count raised. |
| m1 | m | `ex_last_two` gated on the key not yet taken, so mostly unheard. | Fixed: key gate dropped; second exchange gated on `heard_ex_last_two`. |
| m2 | m | No credits line for an attack without a KO; wrong reasoning about KO following attack. | Fixed: second credits entry; reasoning corrected. |
| m3 | m | Hands-down hint misses an operator KO (`:1250` to `:1258`). | Fixed: two appended rows reusing the existing text word for word. |
| m4 | m | Posts crowd the corner; abandoned console's chair is (236, 204); supervisor's chair at (86, 306); `useFrom` should be tile `dx`/`dy`. | Fixed: posts at chairs (60, 178) and (124, 178); both other chairs stay empty; `useFrom` as tile offsets. |
| m5 | m | Plain hide re-fires on every server-room entry. | Fixed: `onceOnly`; saved visibility covers reloads. |
| m6 | m | Park's choice line `ink/m07_npc_thomas_park.ink:109` missing from the story check. | Fixed: added to the consistency list. |
| m7 | m | Voice style placeholder; Gacrux used in m05 and m09. | Fixed: the course style text is quoted in `DIALOGUE_SAMPLE.md` with only the job sentence changed; the Gacrux reuse is noted for AC0. |
