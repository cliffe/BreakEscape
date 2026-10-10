# Mission JSON Schema

## File Location
Each scenario directory should contain a `mission.json` file:
```
scenarios/
├── biometric_breach/
│   ├── mission.json          <-- Static mission metadata
│   └── scenario.json.erb     <-- Per-instance randomised scenario
├── ceo_exfil/
│   ├── mission.json
│   └── scenario.json.erb
└── ...
```

## Schema Definition

```json
{
  "display_name": "string (required)",
  "description": "string (required)", 
  "difficulty_level": "integer 1-5 (required)",
  "secgen_scenario": "string or null (optional)",
  "collection": "string (required)",
  "cybok": "array of CyBOK entries (optional)"
}
```

## Field Descriptions

### display_name (required)
Human-readable name for the mission. Displayed on index pages, mission cards, etc.
- Example: `"Biometric Breach"`

### description (required)
Brief description of the mission objectives and theme. Used for mission cards and detail views.
- Example: `"Investigate a security breach at a high-security research facility..."`

### difficulty_level (required)
Integer from 1-5 indicating mission difficulty:
- `1` = Beginner/Tutorial
- `2` = Easy
- `3` = Medium
- `4` = Hard
- `5` = Expert

### secgen_scenario (optional)
Path to a SecGen XML scenario file when the mission includes virtual machines.
- Example: `"scenarios/labs/introducing_attacks/1_intro_linux.xml"`
- Set to `null` if mission is game-only (no VMs)

### collection (required)
Grouping category for filtering on mission index. Common values:
- `"testing"` - Test scenarios, not for end users
- `"security_investigations"` - Forensics and investigation focused
- `"physical_security"` - Lock picking, safe cracking, physical bypass
- `"data_exfiltration"` - Data theft and covert operations
- `"network_security"` - Network-based challenges
- `"default"` - Uncategorised missions

### cybok (optional)
Array of CyBOK (Cyber Security Body of Knowledge) entries mapping the mission to educational topics.

Each entry:
```json
{
  "ka": "string (2-4 letter code)",
  "topic": "string (topic name)",
  "keywords": ["array", "of", "keywords"]
}
```

## CyBOK Knowledge Area Codes

| Code | Full Name |
|------|-----------|
| IC | Introduction to CyBOK |
| FM | Formal Methods |
| RMG | Risk Management & Governance |
| LR | Law & Regulation |
| HF | Human Factors |
| POR | Privacy & Online Rights |
| MAT | Malware & Attack Technologies |
| AB | Adversarial Behaviours |
| SOIM | Security Operations & Incident Management |
| F | Forensics |
| C | Cryptography |
| AC | Applied Cryptography |
| OSV | Operating Systems & Virtualisation Security |
| DSS | Distributed Systems Security |
| AAA | Authentication, Authorisation and Accountability |
| SS | Software Security |
| WAM | Web & Mobile Security |
| SSL | Secure Software Lifecycle |
| NS | Network Security |
| HS | Hardware Security |
| CPS | Cyber Physical Systems |
| PLT | Physical Layer and Telecommunications Security |

## Complete Example

```json
{
  "display_name": "Biometric Breach",
  "description": "Investigate a security breach at a high-security research facility. Use biometric forensics tools to identify the intruder, track their movements through the facility, and recover stolen research data before it leaves the building.",
  "difficulty_level": 3,
  "secgen_scenario": null,
  "collection": "security_investigations",
  "cybok": [
    {
      "ka": "AAA",
      "topic": "Authentication",
      "keywords": ["Biometric authentication", "Fingerprint analysis", "Identity verification"]
    },
    {
      "ka": "F",
      "topic": "Artifact Analysis",
      "keywords": ["Digital forensics", "Evidence collection", "Fingerprint forensics"]
    },
    {
      "ka": "SOIM",
      "topic": "Security Operations & Incident Management",
      "keywords": ["Incident response", "Security monitoring", "Access control investigation"]
    }
  ]
}
```

## Minimal Example (Testing Scenario)

```json
{
  "display_name": "NPC Patrol Test",
  "description": "Test scenario for NPC patrol behaviours",
  "difficulty_level": 1,
  "secgen_scenario": null,
  "collection": "testing"
}
```

## Defaults When mission.json is Missing

If no `mission.json` exists, seeds will apply these defaults:
- `display_name`: Titleized directory name (e.g., "biometric_breach" → "Biometric Breach")
- `description`: "Play the {display_name} scenario"
- `difficulty_level`: 3
- `secgen_scenario`: null
- `collection`: Inferred from name prefix:
  - Starts with "test" or "npc-" or "scenario" → "testing"
  - Otherwise → "default"
