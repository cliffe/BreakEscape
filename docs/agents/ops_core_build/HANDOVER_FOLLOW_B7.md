# Hand-over: follow-up B7 (validator warning, a container a player cannot open)

Built: `check_unopenable_containers(json_data)` in `scripts/validate_scenario.rb`, run beside `check_dispenses_containers`.
Two warnings, no errors, walking room objects and `contents` at any depth, and `accountProfiles.<id>.contents`.

- No `locked` key: non-empty `contents`, no `locked` key, type not one of the seven that already error, not a
  `lockType: login` PC and not a `usb`.
- Nested container that will not open: an item inside a `contents` list with its own non-empty `contents`, not
  `locked: true`, not a `folder` (the only unlocked type `isInteractiveItem` opens), not takeable (a takeable item is
  taken and opened from the inventory), not a `usb` or sign-in PC.

Brief difference: the brief says to read the take path; a takeable nested container is therefore not warned about.
`validator-known-rules.test.mjs` does not pin check names; not edited.

Validator over all 208 `scenarios/*/scenario.json.erb` with `--no-graph`, before and after: exit codes identical; the
only difference is one new warning line (plus the count lines) in `sis01_healthcare`:
`rooms/major_incident_room/objects[1]` (Backup Recovery Console) has contents but no `locked` key. Review R1-B2: that console opens its own screen, so
the line now says its contents are never shown and advises moving the item out of `contents` (not `"locked": false`). No other scenario
gains a warning. No scenario edited; it is for that scenario's own track.
