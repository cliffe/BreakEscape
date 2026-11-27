# m04 office-life plan review, round 2

Reviewer tier: planning tier, read-only. Stopped at its context guard; unchecked items are carried to round 3.

Counts: B 0 / M 3 / m 9

## Findings and outcomes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | The kettle coupling listens on `npc_use_started:kettle`; the event is keyed by object id (`npc-needs.js:3574`), so it never fires. | Fixed: `npc_use_started:ops_kettle` in section 2.9 and the skeleton. |
| 2 | major | `needsHome` lacks the required `room` (`scenario-schema.json:4882` to `:4893`); `affordance.chatter: false` fails the schema (`:3978`, non-empty string). | Fixed: `"room": "main_entrance"` added; the cooler sets no chatter override (capacity 1 and no queue already stop a pair). |
| 3 | major | With only `hostile.leash`, the newcomers hit for the engine default (10 damage, `config/combat-config.js:67` to `:75`), harder than the operatives, the bug m04 already fixed for the guard (`scenario.json.erb:741` to `:748`). | Fixed: both take the guard's hostile block plus `leash: true`. |
| 4 | minor | A second cooler user stays seated (busy, queue-less source is no candidate, `npc-needs.js:1986` to `:1993`); it does not turn back. | Fixed: wording in 2.7 and L2. |
| 5 | minor | A hostile newcomer punches instead of chatting (`interactions.js:901` to `:907`). | Fixed: 2.12 and L8 say where the curt line is heard. |
| 6 | minor | A cheaper head-count option: the pair are off the roster, so HaX's intel and Voltage's recon stay true as beliefs; only the credit and the debrief change. | Fixed: new Q2 (d), recommended; one re-voice instead of four; a new exchange `ex_not_on_the_rota` sets it up. |
| 7 | minor | Number clashes in the exchange outlines ("eleven inductions", "four on nights"). | Fixed: "a dozen inductions"; the nights exchange is replaced by `ex_not_on_the_rota`. |
| 8 | minor | "NIGHT STAFF" credit reads as the Hall 2 night crew (244). | Fixed: "OFFICE STAFF: HURT, ON YOUR ACCOUNT". |
| 9 | minor | Skeleton omits `spriteTalk`, `spriteVisemes`, `avatar`, `spriteConfig`, `currentKnot`. | Fixed: listed in the skeleton and section 8. |
| 10 | minor | Exchange speaker attribution unstated (`npc-needs-chatter.js:64` to `:85`). | Fixed: `Name:` prefix convention in section 6. |
| 11 | minor | Ages clustered 40 to 55; both keys appear in awareness course scenarios. | Fixed: stated in 2.2 and Q3 with the reason. |
| 12 | minor | The pair sit inside the guard's LOS cone, against the skill's keep-out rule. | Fixed: logged as a deliberate departure in L1 (his challenge reads only the player, 750 to 758). |

## Checked and correct

Start knot and global sync for talkable NPCs; separate ink files; the kettle gate's truthiness and order; reload keeps a saved `ops_kettle_off: false`; credits accept `||`; debrief logic; sync recount (16 `onceOnly`, 3 cooldown mappings, 3 `heard_` keys); bark length; V5; field names at the current format.

## Carried to round 3 (not reached)

Kettle and cooler cells against the map and the door x; whether NPC bodies block the guard's LOS rays; a validator run on a scratch copy; V2, V4, V6, V7, V10 by script; the lab sheet's count; whether a struck newcomer calms down.
