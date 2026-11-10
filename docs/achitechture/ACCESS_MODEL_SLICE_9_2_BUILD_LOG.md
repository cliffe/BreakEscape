# Access model slice 9.2: build log

The build of `ACCESS_MODEL_SLICE_9_2_PLAN.md` (cleared at review round 5). Each entry says what was
built and every place the build had to depart from the plan because the code had moved or the plan
did not fit it, with the smallest faithful adjustment made.

## Sub-slice U: the USB policy (2026-11-10)

Built: `systems/pc-policy.js` (new, sets `window.pcPolicy`); in `npc-needs.js` the refusal at the
end of a carry (`_refuseUse`: `npc_use_refused`, the `usb_refused` mutter, the move to the next
accepting object that does not refuse the class, else the put-down and the `s.refused` memory),
`mutter(npcId, topic)`, `_grumble`'s options argument, the `usb_refused` picture, and `usbClass`
and `usbPolicy` in `describe`; the plant decision in the `requiresItem` branch of
`interactions.js`; the schema's `usbClass` and `storage_blocked`; `scripts/validate_access_work.rb`
(new) with the USB checks; `scenarios/test_access_work` with beats U1 to U3, its `PLAYTEST.md` and
the run report `reports/2026-11-10_run_u.md` (all three beats pass, no leaks); the "USB policy"
section of `README_scenario_design.md`.

Adjustments:

1. **The carried device's class is read at pick-up.** `_completeJob` cannot describe a carried item
   in the node stub (it is out of the world), so the class is stored on the job when the item is
   picked up (`job.usbClass`). The target's `usbPolicy` comes from `describe` as the plan says.
2. **The refusal table is copied into `npc-needs.js`** (`usbRefusedBy`), as `requiredGlobalsHold`
   is, because the file imports nothing; a test checks it agrees with `pc-policy.js`.
3. **`pc-policy.js` has no apostrophes.** Four node tests (`examine-minigame`, `interaction-warning`,
   `minigame-launch-routes`, `network-links-routing`) load `interactions.js` with every import
   replaced by a `data:` URL inside a single-quoted specifier; they now inline the real
   `pc-policy.js` that way, which an apostrophe would break. The file says so at its top.
4. **One tag per beat in `test_access_work`.** A refused NPC carries the device on to any loaded
   object that accepts its tag (plan 7, step 2), wherever it is, so Priya's stick would have gone
   to Lena's kiosk. Each beat's NPC has its own tag (`dev_usb`, `vault_usb`, `post_usb`) and the
   lobby has one device per beat, named for it.
5. **Expected validator output.** U3's tray is the plan's own "an item with `usbClass` accepted by
   an object the policy does not govern while the default blocks its class" warning (section 10),
   so the scenario raises it by design; 11.1's "nothing else" is read as "nothing else
   unexpected", and `PLAYTEST.md` lists it.
6. **The needs regression captures** (11, point 5) are made once, at the end of sub-slice A, over
   both sub-slices' needs changes, rather than twice.
