# test_ca_step_aways_legacy (E3: the legacy `stepAway: true` form)

Start room: `ep_room` (kiosk, Host). One room. Stub content; all lines are test text.
`stepAway: true` must normalise to a single beat after `defend`, ready on `kit_defend_done`, exactly as before E3. It is a twin of `test_ca_step_away` with a new episode id.

What to click:

1. Kiosk: Begin the brief, the osint stage (close the browser), the write stage (send the one email), then the flip, then the defend triage.
2. Expected: no panel between write and flip (there is no mid beat in this form).
3. When the defend set saves, the post-defend panel shows with Look up and Carry on. Look up makes the Host bark "Legacy beat: the step-away fired." and `kit_e1_out` goes true. Carry on skips it.
4. The success screen stays held until the step-away has run. No `worldBeatPickedVia` key is written to the episode state.

The two-beat list form is in `scenarios/test_ca_step_aways`.

Status: validated only (0 errors). Not yet run in a browser.
