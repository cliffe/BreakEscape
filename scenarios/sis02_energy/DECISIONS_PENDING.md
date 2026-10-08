# sis02_energy: decisions pending

## Lighting pass (2026-10-08)

Context: `scenarios/sis02_energy/LIGHTING_PLAN.md`. D1 (schema `emitters` key) and D2 (state-following glows) were approved by the user on 2026-10-08 and are recorded in `docs/agents/LIGHTING_LOG.md`.

### D3. `tint_objects` is not re-applied after a reload

**Background.** The `h2_advisory` timer sets `hydrogen_alarm` and tints the Battery Hall 1 racks red (`scenario.json.erb:414-428`, action at `systems/apply-actions.js:110-133`). After a reload with `hydrogen_alarm` already true, the timer dispatcher marks the timer fired and skips it (`ui/scenario-timer-dispatcher.js:71-78`), so the tint never comes back. The racks look normal again although the advisory is still in force. With the lighting plan, the rack glow and LEDs follow `hydrogen_alarm` and so stay red-orange, which makes the gap visible: red glow on untinted racks.

This is outside lighting (timer dispatcher or the tint action), so it isn't in the lighting plan.

**Options.**

1. When a timer is skipped at init because its `setGlobal` is already applied, re-run its idempotent visual actions (`tint_objects`) once the room loads. Small engine change; fixes every mission that uses `tint_objects`.
2. Have `tint_objects` take a `condition` and re-apply on room load while it holds. More general, more work.
3. Leave it. The player was told by radio before the reload; the mismatch only shows after a mid-advisory reload.

**Recommendation:** option 1, as part of a later engine pass; option 3 is acceptable for the lighting pass.
