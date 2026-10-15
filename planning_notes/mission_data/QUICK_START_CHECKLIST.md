# Quick Start Checklist

Use this checklist to implement the mission metadata feature. Reference `IMPLEMENTATION_PLAN.md` for detailed code.

## Pre-Implementation
- [ ] Read and understand `IMPLEMENTATION_PLAN.md`
- [ ] Review existing Mission model (`app/models/break_escape/mission.rb`)
- [ ] Review current seeds (`db/seeds.rb`)
- [ ] Confirm Hacktivity's Cybok model structure (if integrating)

---

## Phase 1: Database Migrations

### 1.1 Add columns to missions table
```bash
rails g migration AddMetadataToBreakEscapeMissions secgen_scenario:string collection:string
```
Then edit migration to add:
- Default `'default'` for collection
- Index on collection

Run: `rails db:migrate`

### 1.2 Create CyBOK table
```bash
rails g migration CreateBreakEscapeCyboks
```
Edit to match schema in plan (ka, topic, keywords, polymorphic columns).

Run: `rails db:migrate`

---

## Phase 2: Models

### 2.1 Create Cybok model
- [ ] Create `app/models/break_escape/cybok.rb`
- [ ] Add KA_CODES and CATEGORY_MAPPING constants
- [ ] Add helper methods

### 2.2 Update Mission model  
- [ ] Add `has_many :break_escape_cyboks` association
- [ ] Add conditional Hacktivity association
- [ ] Add scopes: `by_collection`, `collections`
- [ ] Add metadata loading methods

---

## Phase 3: Service Layer

### 3.1 Create sync service
- [ ] Create `app/services/break_escape/cybok_sync_service.rb`
- [ ] Implement `sync_for_mission` method
- [ ] Handle dual-mode (standalone vs Hacktivity)

---

## Phase 4: Seeds Update

### 4.1 Update seeds.rb
- [ ] Add mission.json loading logic
- [ ] Add CyBOK sync calls
- [ ] Add fallback defaults
- [ ] Add collection inference for test scenarios

---

## Phase 5: Mission JSON Files

### Priority missions (have scenario content):
- [ ] `scenarios/biometric_breach/mission.json`
- [ ] `scenarios/ceo_exfil/mission.json`
- [ ] `scenarios/cybok_heist/mission.json`

### Secondary (existing scenarios):
- [ ] `scenarios/scenario1/mission.json` (collection: testing)
- [ ] `scenarios/scenario2/mission.json` (collection: testing)
- [ ] `scenarios/scenario3/mission.json` (collection: testing)
- [ ] `scenarios/scenario4/mission.json` (collection: testing)

### Test scenarios (minimal metadata):
- [ ] `scenarios/npc-*/mission.json` (collection: testing)
- [ ] `scenarios/test-*/mission.json` (collection: testing)

---

## Phase 6: Testing

### Standalone mode testing
```bash
# Run migrations
rails db:migrate

# Run seeds
rails db:seed

# Verify in console
rails c
BreakEscape::Mission.count
BreakEscape::Mission.first.break_escape_cyboks.count
BreakEscape::Mission.collections
```

### Hacktivity mode testing (if applicable)
```bash
rails c
# Check both tables populated
BreakEscape::Mission.first.cyboks.count
::Cybok.where(cybokable_type: 'BreakEscape::Mission').count
```

---

## Verification Queries

```ruby
# All missions with CyBOK data
BreakEscape::Mission.joins(:break_escape_cyboks).distinct

# Missions by collection
BreakEscape::Mission.by_collection('testing')
BreakEscape::Mission.by_collection('security_investigations')

# All collections in use
BreakEscape::Mission.collections

# CyBOK entries for a mission
mission = BreakEscape::Mission.find_by(name: 'biometric_breach')
mission.break_escape_cyboks.map { |c| "#{c.ka}: #{c.topic}" }

# Missions by KA code
BreakEscape::Cybok.where(ka: 'AAA').map(&:cybokable).uniq
```

---

## Rollback Commands (if needed)

```bash
# Rollback migrations
rails db:rollback STEP=2

# Reseed with old data
rails db:seed
```
