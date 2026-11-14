# m02 office life: plan review round 8 (delta)

Scope: the changes from draft 7 (`d6430b477`, what round 7 read) to draft 8 (`47ca5192f`), plus the integrator's rename of Hodan's id (`f734fa1ec`). Not a full re-read: sections round 7 passed and draft 8 left alone were not re-reviewed.

**Counts: 0 B, 0 M, 5 m.** Three minors fixed here (m1, m2, m3), plus a one-word stale name in `ANALYSIS.md`; two left for the orchestrator or the dialogue review (m4, m5). The stage 2 exit rule (no B or M) still holds.

## Integrator rename (applied before the review)

Hodan's id, ink file and KO global are now `hodan_warsame` (`m02_npc_hodan_warsame.ink`, `hodan_warsame_ko`), so both night staff take their id from their sprite key. The plan had her sprite key as `night_domestic`, not `hodan_warsame`; it is `hodan_warsame` now too. Exchange lookup: `_findExchange` (`npc-needs.js`) sorts the pair by `npcId` and reads the lower id's list first. `ernesto_bautista` still sorts before `hodan_warsame`, the porter has no `exchanges`, so Hodan's list is the one read, as before. Section 6 now says so.

## Name ripple

- `ernie`, `night_porter`, `night_domestic`, `Gacrux`: gone from `PLAN.md`, `DIALOGUE_SAMPLE.md` and `HANDOVER.md`, except the concept file names `night_porter_concept_1.png` and `night_domestic_concept_1.png` (real files in `assets/characters/wip/`, kept on purpose; the plan and the handover say so). `REVIEW_R6.md` and `REVIEW_R7.md` are history and keep the old names.
- `ANALYSIS.md` (stage 1) still said "Ernie Bautista": fixed to Ernesto.
- KO globals, credits conditions, the HaX `npc_attacked` and `global_variable_changed` patterns, the couplings' `data.npcId`, the skeleton ids and `storyPath`s, the sync budget's seven globals, the 10.2 event names and bag key, the 10.4 probe and the 10.6 V4 line all use `ernesto_bautista` and `hodan_warsame` consistently.
- Speaker prefixes `Ernesto Bautista:` and `Hodan Warsame:` match the displayNames, which `speakerFor` accepts.

## Post-R7 checks that passed

- **Bed 4 gate.** `patient_bed4_deceased` is declared `false` (`scenario.json.erb` globalVariables), so the strict-equality `requireGlobal` works. Only the `bed4_death_window` timeline sets it, 45 s after `bed4_critical`, which follows `slow_path_window_open` (set by the refuse branch of the ransom decision) by 100 s; HaX's Bed 4 text follows 6 s after the death. No ink sets it. So the gate closes the paper exchange only late in the mission, for a player who first hears it after the decision.
- **Credits.** The three new lines go between `WARD STAFF` and `PATIENT ASSAULTED`, `warning` style, in the "NAME: what happened" shape the PERSONNEL section uses, no dashes. The conditions use the `&&` and `!` forms the section already uses; `closing-sequence.js` evaluates the condition string with the same test as the other lines. The card cap (`MAX_CARD_LINES`) applies to cards, not to this list.
- **HaX texts.** All three are scenario data (`sendTimedMessage` on HaX's own mappings), not engine text, and are text only, as decided. UK English. They fit HaX's register: short, plain, a little sharp when the player does harm (compare the patient text, "That is a patient in a hospital bed ... stop. Now."). `npc_attacked:<id>` fires once, on the hit that turns a friendly NPC hostile (`player-combat.js`), so on a knock-out the player gets the attack text and then the KO text, an escalation that reads correctly.
- **Line counts.** Every count in `PLAN.md` section 6 and `DIALOGUE_SAMPLE.md` matches its line; the longest is 39, inside the 40 cap. No em or en dashes in either file.
- **Engine citations added in draft 8.** `offWhen` turning back only a walker or queuer (`npc-needs.js`, slice 18a block in the job tick: `goto_target` or `queued` only; "One already using it finishes"); `npcInkVariables` as a keyed sync section (`state-sync.js` `KEYED_SECTIONS` and the export block); reveal-global readers (`core/rooms.js` revealOnGlobal handling, `npc-needs.js` `_hidden`). All say what the plan says.
- **Sync budget.** Seven `onceOnly` (print, burn break, two attack mappings, two KO texts, the attack text), 14 small keys; unchanged by the rename.

## Minors

**m1 (fixed, `PLAN.md` 2.2).** The attacks paragraph said an attack short of a knock-out "gets the same treatment" and then, in the next sentence, introduced the same idea again. It is not the same treatment: one HaX text and one credits line shared by the pair, not one per NPC. The two sentences are merged, after the attack mappings that set `night_staff_attacked`.

**m2 (fixed, `DIALOGUE_SAMPLE.md`).** "Questions for the user" still read as open; the user answered them on 2026-11-14 (plan section 9). The heading now says answered, with the answer.

**m3 (fixed, `PLAN.md` gate notes).** The Bed 4 gate is read when an exchange starts, so a death while the paper exchange is running does not cut it. The gate notes now say where `patient_bed4_deceased` is set, when, and that this window is accepted.

**m4 (open, for the dialogue review or the orchestrator).** The cleared exchange ends Ernesto "There you go. Fuss over nothing." It is not gated on `patient_bed4_deceased`. If `cover_restored` can come after the refuse decision (a player who reaches Val late), or the cleared exchange is first heard after it (it waits for a heard meeting), "fuss over nothing" plays after HaX's Bed 4 news. Adding `"patient_bed4_deceased": false` to its `requireGlobal` changes no line and costs nothing; the burn exchange's "Not our problem." is the same question, milder. Not fixed here because it widens a gate the user saw as written.

**m5 (open, wording for the dialogue review).** "NIGHT STAFF, HANDOVER ROOM: Struck on shift" puts a room where every other PERSONNEL line puts a name or role, and m02's attack-short-of-KO lines name the actor ("Attacked by the agent", "struck by the agent"). A closer fit: "NIGHT STAFF: Porter or domestic struck by the agent". The condition also drops the line whenever either was knocked out, so a punched Ernesto plus a knocked-out Hodan credits only Hodan; the plan states this, and it is acceptable.
