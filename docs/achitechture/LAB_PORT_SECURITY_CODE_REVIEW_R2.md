# Lab port security, adversarial code review, round 2

Date: 2026-11-12. Branch `build/lab-portsec` vs `main`. Reviewer: subagent (adversarial R2).
Scope: `scenarios/lab_physical_pentest/scenario.json.erb` (one object, `secured_port`),
`docs/achitechture/LAB_PORT_SECURITY_BUILD_LOG.md`, the R1 review and its fix commit
(`4bd0d3a1e`), and the already-merged engine path the object relies on
(`network_access.rb`, `network-links.js`, `interactions.js`).

## Verdict

No blocker and no major. The change is scenario-only: a second, port-secured wall port that can
only ever refuse the drop box. It writes no global, no foothold, no capture and no task, so it
cannot bypass anything, is not a second foothold route, and is reload-safe. I reached this view
independently before checking R1, then confirmed R1's one minor is fixed well. One minor remains
(a doc-only one I found this round); the rest are nits.

## Independent findings this round

### MINOR-1 (new): the build log still quotes the old, pre-fix message
`docs/achitechture/LAB_PORT_SECURITY_BUILD_LOG.md:44-46`. The "Player-facing text added" section
quotes `portSecurityMessage` as "A managed port takes only known machines ... port security /
802.1X", the wording from before the R1 fix. The shipped object
(`scenario.json.erb:2325`) now reads "... use port security to allow only known addresses, or
802.1X so a device must authenticate before it gets a network." So the record of what was built
misquotes the built text, and the stale quote carries back the exact loose "port security / 802.1X"
pairing that R1 MINOR-1 was raised to remove. Scenario text is correct; only the log is wrong, so
impact is limited to a future reader (e.g. the lab-sheet author the log's own closing section points
at) trusting the log over the file. Fix: update the quote to the shipped message.

### NIT-1: adjacent live-port text keeps the loose pairing the fix removed
The new secured port now teaches the distinction cleanly, but the live `network_port` beside it
still blurs it in its own `jackConfirm` (`:2298`) and in the `kp_dropbox_viewed` capture (`:762`):
"port security / 802.1X so an unknown device gets no network." R1 called this house-style and out of
scope, and it is pre-existing, so no change is required on this branch. Noting it only because the
two ports now sit in one room at two levels of precision; a later tidy could align the live port's
line with the new one.

### NIT-2: validator prints a reach line for the secured jack (confirmed, no action)
`validate_scenario.rb --no-graph` emits "Network reach: jack 'secured_port' on 'office_lan' lists
hosts ... resources ...", identical in form to the live jack. It is the structural reach a foothold
*would* have; the secured port never grants one, so nothing is reachable through it. This is R1's
NIT-3, and the build log already records it. Left as-is.

## R1 follow-up: is the one minor fixed well?

Yes. R1 MINOR-1 (802.1X lumped in with a MAC allow-list) is fixed cleanly in the shipped
`portSecurityMessage`: port security now carries the allow-list idea ("allow only known addresses")
and 802.1X reads as authentication ("a device must authenticate before it gets a network"). Both
controls are named correctly and kept distinct. The text does not over-claim: it says an unknown
device gets no network on *this* configured port, not that the controls are unbeatable, which is the
right level for the lab. R1's three nits are also handled: NIT-1 (em dash in the ERB comment) is
gone, no em or en dash remains anywhere in the diff or the build log; NIT-2 (gameAlert vs toast) is
corrected in the log; NIT-3 is documented (my NIT-2 above).

## Checks run this round

- **Teaching accuracy / over-claim.** PASS. Port security = MAC allow-list, 802.1X =
  authentication, "disable unused ports" = the baseline; all three correct and the two filtering
  controls are no longer conflated. No claim that the controls cannot be bypassed.
- **Safety of the mechanic.** PASS. `plant_device!` checks `object_reachable?`, then
  `port_security_refusal` returns `422 port_security` *before* any foothold is written and *before*
  the device is removed (`network_access.rb:186-195`). No `lockType`, so `interactions.js` routes it
  to the plant flow, not a sign-in. Referenced nowhere else in the scenario, so it adds nothing to
  any objective, capture or aim count.
- **Validator.** PASS. `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb
  scenarios/lab_physical_pentest/scenario.json.erb --no-graph` -> 0 lines with the cross mark,
  "Validation complete". Ran with `--no-graph`; `dungeon_graph.*` untouched.
- **Rails suite (full, under the shared lock).** PASS. 1796 runs, 25577 assertions, 0 failures,
  0 errors, 1 skip.
- **JS suite (full, under the shared lock).** PASS. 507 files passed, 0 failed.
- **Live browser proof (keyless server :3043, game 1369, start room P3, `--give kit_dropbox`).**
  PASS. Walked to `secured_port`, confirmed the "Plug it in" dialog, and the plant was refused once:
  the exact shipped `portSecurityMessage` was shown via the notification sink, and the drop box
  stayed in the inventory (`kit_dropbox` present before and after). Two screenshots taken of the
  comms cupboard: both ports render as visibly different units (live server rack on the left, managed
  comms cabinet with a green panel on the right) with the top patch panel clear of both, so R1's
  NIT-4 (no independent render) is now closed, nothing overlaps on the back wall.

## Appendix: counts

Blocker 0, major 0, minor 1, nit 2. R1's 1 minor and 3 nits: all addressed.
