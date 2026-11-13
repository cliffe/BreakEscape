# Inbox Triage Usage

Inbox triage is a sorting round: the player works through a fixed set of messages, gives each a verdict (Trust, Report or Delete, plus Verify in awareness sets), ticks the red flags behind the verdict, and ends on a score and a band headline. It started in the awareness course and the lab, and a mission can use it too. The full field list is in `README_scenario_design.md` under "Inbox triage (`social.triageSets`)"; this page is the short version for a mission author.

## Features

- Opens from a room object of type `triage-workstation`, with no code needed.
- Reads a named set from `social.triageSets[]`: a message list, a pass mark and the globals the result is written to.
- Messages can be email, a text thread, a voicemail, a QR notice, a web page, a call or a sign-in prompt.
- Writes four result globals (`<prefix>percent`, `<prefix>reportRate`, `<prefix>pass`, `<prefix>done`), so a task or a door can key on the result.
- A set with `scoringProfile: "analyst"` marks down false flags; the default `awareness` profile never counts Report as wrong.

## Usage in Scenarios

Add a set to the `social` block, declare its four result globals, and place a workstation that names it:

```json
"social": {
  "triageSets": [
    {
      "id": "evidence_inbox",
      "stage": "mission",
      "scoringProfile": "analyst",
      "title": "Sort the seized inbox",
      "outcome": { "setGlobalPrefix": "triage_", "passPercent": 60 },
      "messages": [ { "id": "m1", "from": { "name": "IT", "address": "it@corp.example" }, "to": "you@corp.example",
                      "subject": "Your laptop", "body": "Your laptop is ready.",
                      "truth": { "isPhish": false, "flags": [] } } ]
    }
  ]
},
"globalVariables": { "triage_percent": 0, "triage_reportRate": 0, "triage_pass": false, "triage_done": false }
```

```json
{
  "type": "triage-workstation",
  "id": "triage_desk",
  "name": "Inbox terminal",
  "minigameData": { "triageSetId": "evidence_inbox", "conclusionTaskId": "triage_passed" }
}
```

Complete the task from the global, never from the overlay closing: an NPC's `eventMappings` entry on `global_variable_changed:triage_pass` with `"condition": "value === true"` and `"onceOnly": true`. The workstation needs the sprite `assets/objects/triage-workstation.png`.

### Required Properties

- `type`: `triage-workstation`
- `minigameData.triageSetId`: the id of a `social.triageSets` entry
- On the set: `id`, `messages[]` and `outcome` (`setGlobalPrefix`, `passPercent`)

### Optional Properties

- `minigameData.conclusionTaskId`: the task the result completes, so a reopen can repair a save that never reached the server
- `minigameData.stage`: `pre` or `post`, for a set whose prefix has a `{stage}` token
- `minigameData.skin`: `"awareness"` turns on the awareness behaviours (see below); leave it out for the plain round
- On the set: `scoringProfile`, `feedbackMode`, `headerPanel`, `glossary`, `bands[]`, `labels`, `resultCopy` and the rest of the table in the README

## The two profiles and the skin

A set with no `scoringProfile` scores as `awareness`: Report and Verify are never wrong, header tells stay hidden until opened, and the band is capped when no skills were named. For a SAFETYNET or lab round set `"scoringProfile": "analyst"`. The `call` and `push` message kinds and the Verify verdict are awareness-only, and the validator refuses them in an analyst set.

`minigameData.skin: "awareness"` is separate from the profile. It adds the course's behaviours to a workstation: a positive animation, sound and thank-you for Report, the "team kept safe" tally, relevant chips first, and a result screen that points at the learner's inbox and security team. Without it the round is the plain one. The only value is `awareness`; the validator errors on any other.

## Programmatic Usage

```javascript
// The same starter the room object calls. options.skin wins over minigameData.skin.
window.startInboxTriageMinigame(
  { scenarioData: { name: 'Inbox', minigameData: { triageSetId: 'evidence_inbox' } } },
  { skin: 'awareness', onComplete: (success, result) => console.log(result.percent) }
);
```

## Behaviour to know about

- **Closing early is an abort.** Closing before the result writes nothing and fires `minigame_failed`; the round restarts on reload (only the episode runner saves mid-round).
- **A `pre` or `post` set that is already done reopens read-only** from the stored globals, and the first answer is the one kept.
- **Results survive a reload** as globals. A reopen with `<prefix>done` set and the conclusion task still open re-emits the result once.
- **One set per workstation, many workstations per scenario.** Sets are keyed by id, so several workstations can open different sets. Give each set its own `setGlobalPrefix`.
- **Nothing is typed.** Every verdict and flag is a button; no free text is stored.

## Validation

`ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb --strict-social` checks the set, the four result globals (declared, boolean or number as expected), the workstation's pointers (`triageSetId`, `stage`, `skin`, `conclusionTaskId`) and the awareness-only kinds.
