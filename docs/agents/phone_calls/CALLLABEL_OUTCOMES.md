# HaX call caption and m04 stale Call back: outcomes

2026-11-12, config fixer (Sonnet).

## 1. Contact-level callLabel "SAFETYNET secure line" on HaX
Added on the phone contact (after `displayName`) in:
- `scenarios/m03_ghost_in_the_machine/scenario.json.erb` (`agent_0x99`)
- `scenarios/m04_critical_failure/scenario.json.erb` (`agent_0x99`; the mapping-level label on the dial ring moved up and dropped)
- `scenarios/m05_insider_trading/scenario.json.erb` (`agent_0x99_handler`)
- `scenarios/m06_follow_the_money/scenario.json.erb` (`agent_0x99_handler`)
- `scenarios/m07_architects_gambit/scenario.json.erb` (`agent_0x99`)
- `scenarios/m08_the_mole/scenario.json.erb` (`agent_0x99`)

Left alone: m01 (already set), m04 Vance's "Albion Energy", m05's mapping-level "TalentStack Executive Recruiting" (the Recruiter, deliberately different), m07's withheld rings.
Skipped: m09 (`scenario.json.erb` carries someone else's uncommitted change; HaX has `call_map` entries there, so it still needs the label). m10: HaX has no `call` entry or `ring`, so nothing to caption. `lab_social_engineering` untouched.

## 2. m04 stale Call back
The dial ring is now `"ring": { "onMissed": "callback", "callbackWhen": "globalVars.esd_authorized !== true && globalVars.mission_complete !== true" }`.

## Checks
- `validate_scenario.rb`: only the existing word-cap errors on m03-m08 (no other ERROR lines). `validate_phone_calls.rb`: exit 0 on all six.
- `tts_mission_lines_test.rb`: 5 runs, 0 failures.
- Key dump (`dump_tts_keys.rb`) of this tree against a `git archive HEAD` dump: m03-m08 identical.
- Live, keyless :3029 (server stopped afterwards), headless, in `proofs/CALLLABEL/`:
  - m04 `dial_shutdown` (scratch copy of `m04_live.sh` setting `esd_authorized`): after the decline the thread header shows "Call back"; after `esd_authorized` is set the header button and the contact-row button are gone, pressing finds no call button, the ringer is empty, nothing dials.
  - m03 `m07_live.sh call_button`: the Call button in HaX's thread dials and the CALLING screen shows "SAFETYNET secure line" under "Agent HaX" (`call_button_calling.png`).
