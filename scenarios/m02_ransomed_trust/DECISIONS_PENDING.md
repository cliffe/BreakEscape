# m02 Ransomed Trust: decisions pending

Proposals from the lighting review (2026-10-08, `LIGHTING_PLAN.md`).

**Status (2026-10-08):** P1 approved by the user, being implemented this pass. P2 merged into sis02's approved `emitters` key (object-id matching). P3 done (`tools/playtest/lighting-tour.sh --player`, commit 8f52fa74). P4 withdrawn: `ransomware_display` never unlocks (review M1), so E1 uses a `ward_recovering` variant instead.

Each one needed a change outside `lighting.js` and the scenario file, so none of them is in the plan's work list. Nothing here blocks the plan.

## P1. A generator brownout at a story beat

- **Background.** The mission runs on generators with "twelve hours of power, less if anything trips" (`ink/m02_opening_briefing.ink:41`). The guard scene has "Somewhere behind you a generator changes note." (`ink/m02_npc_security_guard.ink:216`). At the moment the lights can't react to the story.
- **Proposal.** A scenario action (for example `"setLighting": { "dip": 0.5, "ms": 1200 }`, run from an ink tag or an event) that dims every lit room once and lets it recover. One beat at that guard line, possibly one when the restore starts.
- **Needs.** A new action in `systems/apply-actions.js` (or an ink tag handler), schema and validator support, and a public `dipAll()` in `lighting.js`.
- **Flash safety.** One slow dip, well under three a second. Skip it under reduced motion.
- **Recommendation.** Yes, but after this lighting pass. It's the single strongest tension beat lighting could add, but it touches the action system shared by every mission.

## P2. Per-object glow override

- **Background.** Emitters match on texture key only. Bed 4's monitor is "dark" in the ink (`ink/m02_npc_patient_bed4.ink:40`) but glows green like the others. Any object that ought to be dead (or a different colour) can't be told apart.
- **Proposal.** An optional object key, `"glow": false` or `"glow": "#rrggbb"`, read by `refreshEmitters` in `lighting.js`.
- **Needs.** About 5 lines in `lighting.js`. The schema's `item` definition doesn't set `additionalProperties`, so the key would validate as it stands. The proposal is here, not in the plan, because it adds a new authoring key every mission would see, and it should be documented in the schema and the skill.
- **Caveat for Bed 4.** The vitals-monitor sprite art shows a live trace, so switching off the glow alone wouldn't make it look dead. A dark-screen sprite variant would need image generation (PixelLab, one image).
- **Recommendation.** Add the key when a second mission needs it. For m02 alone, leave Bed 4 as it is.

## P3. Player shots in the lighting tour

- **Background.** `tools/playtest/lighting-tour.sh` only moves the camera. The torch, and LEDs or glow over a character, never appear in it. For this review they had to be shot by hand (`LIGHTING_PLAN.md` section 2, `probe/`).
- **Proposal.** An optional `--player <room>:<tx>,<ty>:<facing>` argument that places the player and pins `currentPlayerRoom` before the shot, switching the room off first.
- **Detail.** Entering m02's server room fires Val's conversation. The probe closed it with `MinigameFramework.endMinigame(false)`, which the tool should do too.
- **Recommendation.** Yes: small, tooling only, and every later lighting pass benefits.

## P4. Screens recover when the hospital does

- **Background.** E1 in the plan turns `ransomware_display` screens red. If `scenarioData.locked` flips to false when the restore completes (`systems/unlock-system.js:671` sets it for unlocked lockables), the screens go back to blue on their own.
- **Proposal, only if that flag doesn't change at restore.** A hook from the recovery console's completion that marks those objects restored.
- **Recommendation.** Check during E1. Raise it only if the flag is static.
