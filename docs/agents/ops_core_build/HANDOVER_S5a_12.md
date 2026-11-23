# Handover S5a unit 12: needs_console in network-links.js

Done. `public/break_escape/js/systems/network-links.js`, in `implant()` right after the `usb_refused` branch: a 422 with
`reason: 'needs_console'` toasts the server's `error` (fallback "Nobody is signed in at this keyboard."), emits
`network_device_refused` `{ pcId, reason: 'needs_console' }` and returns `{ action: 'refused', reason: 'needs_console' }`.
It sits before the `not_ready` retry and the quiet ending, so it never retries and is never quiet. The doc comment
at the top lists the pc-id form of the event. Server side (unit 06) must send `reason: 'needs_console'` with an `error` line.

Tests: `test/js/network-links-needs-console.test.mjs` (4: needs_console toast and event, dropped shape no retry, not_ready quiet,
usb_refused unchanged). Unmodified `network-links.test.mjs`, `network-links-routing.test.mjs`, `ops-unchanged-validator.test.mjs` pass.
`bin/ops-golden-compare`: 16 runs, 0 failures, no fixture touched. The new test copies the harness of `network-links.test.mjs`.
