# m01 First Contact — Cross-Layer Consistency Matrix

Every concrete value that appears in more than one layer. Columns:

- **Story (ink)** — the `ink/*.ink` dialogue scripts.
- **Break Escape scenario** — `scenario.json.erb`, `mission.json`, objectives, dungeon graph.
- **SecGen VM** — what the VM scenario actually builds (checked against both
  `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m01_first_contact.xml`
  and the in-mission copy `secgen/m01_first_contact.xml`). Values generated at
  build time (the operative password, flag strings) are marked *(per-build)*.
- **Status** — match / mismatch / missing / internal (an inconsistency inside one layer).

Blank cell = value does not appear in that layer.

## Characters

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| Derek Lawson | Derek Lawson | id `derek_lawson`, "Derek Lawson" | account `derek` | match |
| Sarah O'Brien | Sarah O'Brien | **id `sarah_martinez`**, displayName "Sarah O'Brien" | — | **mismatch** (internal id keeps old surname "Martinez"; player-facing name is O'Brien) |
| Kevin Park | Kevin Park | id `kevin_park`, "Kevin Park" | — | match |
| Maya Chen — role | **"the journalist" / "her journalism"** (briefing + debrief) | Content Analyst, door sign "Maya Chen — Research" | — | **mismatch** (role stated as journalist in 2 ink lines, analyst everywhere else) |
| Patricia Wells | Patricia Wells | Patricia Wells (manager_office) | — | match |
| Handler: Agent HaX / id 0x99 | "Agent HaX" | id `agent_0x99`, displayName "Agent HaX" | — | match (id/display split is intentional) |
| Player name | "Agent 0x00" / "Agent" (ink defaults) | globalVar `player_name` = "Agent Zero" | — | minor mismatch ("Agent Zero" vs "Agent 0x00") |
| The Architect | The Architect | The Architect | — | match |
| ZDS / Zero Day Syndicate | Zero Day Syndicate (debrief) | ZDS / Zero Day Syndicate | — | match |
| Derek's tenure | **"three months" (briefing)** vs **"about 18 months" (Kevin)** | "18 MONTHS AGO: Derek hired" (Patricia timeline) | — | **mismatch** (intra-ink: 3 months vs 18 months) |

## Hosts, IPs, logins

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| Target server name | — | `shatter_server` (Server Access Details, flags key, archive text) | system `shatter_server` | match |
| Target server IP | — | `172.16.0.2` (Server Access Details, archive observations) | `172.16.0.2` | match |
| Target IP (labsheet) | `172.16.0.2` (labsheet) | — | `172.16.0.2` | match |
| Console/attacker VM | "Kali Linux terminal/workstation" | VM launcher, `kali` | system `kali`, login `kali`/`kali` | match (machine identity) |
| Console VM IP | — | **`192.168.100.50`** (vm_launcher fallback) | **`172.16.0.3`** | **mismatch** |
| Console VM login | — | postit `user: kali / password: kali` | `kali` / `kali`, super_user | match |
| Operative SSH account | "Derek's account" (phone hint) | `derek` (Server Access Details, archive) | account `derek` | match |
| Escalation account | `shatter` (eventMappings, flag-station desc) | `shatter` | account `shatter` | match |
| Operative SSH password | not stated (correct) | one of 27-word "My Passwords" list | *(per-build)* selected from the identical 27-word list | match (mechanism + wordlist) |

## PINs / passwords (office, physical)

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| IT room PIN `2468` | — | it_room requires 2468; reception voicemail; maintenance backup; Kevin's note | — | match (consistent across 4 placements) |
| Main filing cabinet `2024` | — | requires 2024; chalkboard hint "election year … 2024" | — | match |
| Storage safe `1337` | — | requires 1337; Encoded Note (1) decodes to 1337; labsheet worked example | — | match |
| Derek PC `0419` | — | requires 0419; postit "Anniversary"; Anniversary Card (Apr 19); Encoded Note (2) | — | match |
| Derek cabinet `0419` | — | requires 0419 | — | match |
| Derek personal safe `0319` | — | requires 0319; "Personal Notes - Safe" (birthday 19 Mar) | — | match |
| Kevin workstation `tiaspbiqe2r` | — | requires + postit `tiaspbiqe2r` | fixed password `tiaspbiqe2r` on the extra (random-word) account | match (same string appears in both — intentional link) |

## Flags (VM ↔ scenario)

| Flag | Break Escape use | SecGen VM location | Status |
|---|---|---|---|
| `shatter_server:flag_1` | ENTROPY archive lock (decryption key) | `DECRYPTION_KEY`, `derek` account, plain | match |
| `shatter_server:flag_2` | drop-site → `linux_flag_submitted` ("directory traversal", deployment_notes) | `operation_shatter/deployment_notes`, `derek` account | match |
| `shatter_server:flag_3` | launch device (launch authorization code) | `launch_code/launch_flag`, `shatter` account | match |
| `shatter_server:flag_4` | drop-site → `sudo_flag_submitted` (shatter_configuration, base64) | `shatter_configuration`, base64, `shatter` account | match |
| Flag count = 4 | 4 flags used (1 archive, 2 drop-site, 1 device) | 4 flag generators | match |
| Flags keyed by `shatter_server` | `vm_flags_json('shatter_server')` | system_name `shatter_server` | match |

## SecGen scenario identifier (integration)

| Value | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|
| `mission.json` `secgen_scenario` | **`intro_to_linux_security_lab`** | XML declares `<name>` "Break Escape SAFETYNET: Mission 1 — First Contact VMs"; file path `break_escape/safetynet/m01_first_contact.xml`; string "intro_to_linux_security_lab" appears in **neither** XML | **mismatch** (stale value copied from the `lab_intro_linux` scenario) |
| `vm_object('…')` VM title | **`intro_to_linux_security_lab`** | the console VM's system name is `kali` | **mismatch** (title never matches a built VM in Hacktivity mode) |
| README "SecGen Scenario:" | `intro_to_linux_security_lab` | — | stale (doc) |

## Dialogue-file and build references

| Value | Where referenced | Target status | Status |
|---|---|---|---|
| `ink/m01_terminal_cyberchef.json` | `cyberchef_workstation.storyPath` in scenario.json.erb | file does not exist (removed in commit `debfd589`); workstation opens the CyberChef UI, not ink | **mismatch** (dangling reference, inert at runtime) |
| base64 encoder module path | in-mission `secgen/m01_first_contact.xml` uses `modules/encoders/string/base64` | that path does not exist in SecGen; the repo copy correctly uses `modules/encoders/base/base64` | **mismatch** (duplicate copy would fail to build if used) |
| field-guide lab-sheet URL | SecGen repo XML vs in-mission XML copy | the two XML copies use different URL schemes | mismatch (author decision — see 01) |

## Story constants (internally consistent — listed for completeness)

| Value | Status |
|---|---|
| Launch window: Sunday 06:00 / "T-72 hours" / "three days" | match across calendars, archive, launch device, Maya |
| Casualties: 42–85 | match across casualty projections, credits, Derek, Patricia, debrief |
| Target profiles: ~2.3M / 2,347,832 | match across target DB, launch device, campaign docs |
