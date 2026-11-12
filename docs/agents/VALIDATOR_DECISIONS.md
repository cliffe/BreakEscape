# Validator decisions

Sign-offs for every entry in `scripts/validator_known_failures.json`, every `acknowledgedClues` marker and every payload scan exception (`test/fixtures/files/payload_scan_exceptions.json`, once it exists). The file does not depend on the pass name.

Rules (`docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, step 1):

- One dated heading per entry: `## <YYYY-MM-DD>: <short name>`. An entry's `approved` field is the heading text without the `## `.
- Under each heading, exactly one fenced `json` block restating the identifying fields of the one entry it approves, with the same values: `scenario`, `stage`, `match` and `count` for a known failure; `lock`, `in` and `reason` for an acknowledged clue; `scenario`, `route` and `paths` for a payload scan exception. Prose may follow the block.
- A heading backs exactly one entry across all three lists. A second entry, or a raised `count`, needs its own new or edited section, which shows in the branch diff.
- `test/js/validator-known-failures.test.mjs` checks all of this.

The entries below come from the step 1 corpus run on main f2d53bb40 (ink on, `--no-graph`), 2026-11-12. Each is **awaiting orchestrator sign-off** at the merge batch; the `reviewBy` date (2026-12-10) is proposed and needs the owner's agreement.

## 2026-11-12: lab_exploitation ink headings

```json
{
  "scenario": "scenarios/lab_exploitation/scenario.json.erb",
  "stage": "ink",
  "match": "is a standalone emote starting with '*'",
  "count": 13
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. **Heading:** lines in instructor.ink parse as standalone emotes; attach each to a spoken line.

## 2026-11-12: lab_post_exploitation ink headings

```json
{
  "scenario": "scenarios/lab_post_exploitation/scenario.json.erb",
  "stage": "ink",
  "match": "is a standalone emote starting with '*'",
  "count": 12
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. As lab_exploitation.

## 2026-11-12: lab_vulnerability_analysis ink headings

```json
{
  "scenario": "scenarios/lab_vulnerability_analysis/scenario.json.erb",
  "stage": "ink",
  "match": "is a standalone emote starting with '*'",
  "count": 7
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. As lab_exploitation.

## 2026-11-12: lab_vulnerability_analysis ink slashes

```json
{
  "scenario": "scenarios/lab_vulnerability_analysis/scenario.json.erb",
  "stage": "ink",
  "match": "contains '//', which ink treats as a comment",
  "count": 2
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. Reword each // (ink cuts the rest of the line).

## 2026-11-12: lab_feeling_blu ink slashes

```json
{
  "scenario": "scenarios/lab_feeling_blu/scenario.json.erb",
  "stage": "ink",
  "match": "contains '//', which ink treats as a comment",
  "count": 10
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. Reword each // (ink cuts the rest of the line).

## 2026-11-12: lab_vulnerabilities ink slashes

```json
{
  "scenario": "scenarios/lab_vulnerabilities/scenario.json.erb",
  "stage": "ink",
  "match": "contains '//', which ink treats as a comment",
  "count": 3
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. Reword each // (ink cuts the rest of the line).

## 2026-11-12: lab_malware_metasploit ink slashes

```json
{
  "scenario": "scenarios/lab_malware_metasploit/scenario.json.erb",
  "stage": "ink",
  "match": "contains '//', which ink treats as a comment",
  "count": 1
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. Reword the // in instructor.ink.

## 2026-11-12: lab_malware_metasploit instruction task tag

```json
{
  "scenario": "scenarios/lab_malware_metasploit/scenario.json.erb",
  "stage": "common",
  "match": "'#complete_task:complete_instruction_task' was not found",
  "count": 1
}
```

Owner: labs track. Status: awaiting orchestrator sign-off. objectives[0].tasks[0] waits for a tag the instructor ink never emits; add the tag or change the task type.

## 2026-11-12: biometric_breach keyPins

```json
{
  "scenario": "scenarios/biometric_breach/scenario.json.erb",
  "stage": "common",
  "match": "missing required 'keyPins' array",
  "count": 5
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. Add the same keyPins array to each key lock and its key.

## 2026-11-12: crypto1_captain_meow keyPins

```json
{
  "scenario": "scenarios/crypto1_captain_meow/scenario.json.erb",
  "stage": "common",
  "match": "missing required 'keyPins' array",
  "count": 1
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. Add the same keyPins array to the key lock and its key.

## 2026-11-12: crypto2_rsa_asymmetric keyPins

```json
{
  "scenario": "scenarios/crypto2_rsa_asymmetric/scenario.json.erb",
  "stage": "common",
  "match": "missing required 'keyPins' array",
  "count": 2
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. Add the same keyPins array to each key lock and its key.

## 2026-11-12: crypto3_aes_symmetric keyPins

```json
{
  "scenario": "scenarios/crypto3_aes_symmetric/scenario.json.erb",
  "stage": "common",
  "match": "missing required 'keyPins' array",
  "count": 2
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. Add the same keyPins array to each key lock and its key.

## 2026-11-12: ceo_exfil helper-npc give_item

```json
{
  "scenario": "scenarios/ceo_exfil/scenario.json.erb",
  "stage": "ink",
  "match": "in itemsHeld. Add {",
  "count": 4
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. The shared helper-npc.ink gives keycard, lockpick, phone and workstation; the reception NPC holds none of them. Fix its itemsHeld or pick another ink file; do not edit the shared ink for one scenario.

## 2026-11-12: ceo_exfil phone targetKnot

```json
{
  "scenario": "scenarios/ceo_exfil/scenario.json.erb",
  "stage": "common",
  "match": "is a phone NPC event mapping with 'targetKnot'",
  "count": 10
}
```

Owner: escape-room track. Status: awaiting orchestrator sign-off. Design edit: each mapping sets a global and the ink hub gets a conditional option for it.

## 2026-11-12: basic_mission schema scenario_brief

```json
{
  "scenario": "scenarios/basic_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/: did not contain a required property of 'scenario_brief'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): no scenario_brief. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: basic_mission schema flags

```json
{
  "scenario": "scenarios/basic_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/flags: of type array did not match the following type: object",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): flags as an array. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: basic_mission schema start room type

```json
{
  "scenario": "scenarios/basic_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/rooms/start (room 'start'): did not contain a required property of 'type'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): start room without a type. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: basic_mission schema start room connections

```json
{
  "scenario": "scenarios/basic_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/rooms/start (room 'start'): did not contain a required property of 'connections'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): start room without connections. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: vm_free_mission schema scenario_brief

```json
{
  "scenario": "scenarios/vm_free_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/: did not contain a required property of 'scenario_brief'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): no scenario_brief. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: vm_free_mission schema flags

```json
{
  "scenario": "scenarios/vm_free_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/flags: of type array did not match the following type: object",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): flags as an array. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: vm_free_mission schema start room type

```json
{
  "scenario": "scenarios/vm_free_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/rooms/start (room 'start'): did not contain a required property of 'type'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): start room without a type. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.

## 2026-11-12: vm_free_mission schema start room connections

```json
{
  "scenario": "scenarios/vm_free_mission/scenario.json.erb",
  "stage": "schema",
  "match": "schema: #/rooms/start (room 'start'): did not contain a required property of 'connections'",
  "count": 1
}
```

Owner: the user (q86). Status: awaiting orchestrator sign-off. Fix as an example or delete (q86): start room without connections. One entry per schema line (review R1, m4), so a new schema break in the same scenario still fails.
