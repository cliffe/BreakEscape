# Mission Metadata & CyBOK Integration Implementation Plan

## Overview

This plan implements mission metadata (`mission.json`) files for BreakEscape scenarios and adds CyBOK (Cyber Security Body of Knowledge) integration that works in both standalone and Hacktivity modes.

---

## Architecture Summary

### Current State
- **Missions table**: `break_escape_missions` with columns: `name`, `display_name`, `description`, `published`, `difficulty_level`
- **Seeds**: Loops through scenario directories, creates missions with fallback defaults
- **Scenarios**: Each mission has a `scenario.json.erb` for per-instance randomisation

### Target State
- **Missions table**: Add `secgen_scenario` (string), `collection` (string) columns
- **CyBOK table**: New `break_escape_cyboks` table (polymorphic, matches Hacktivity schema)
- **Metadata files**: New `mission.json` in each scenario directory
- **Dual-mode CyBOK**: Use Hacktivity's `::Cybok` if available, fallback to `BreakEscape::Cybok`
- **Seeds**: Read `mission.json`, update missions, sync CyBOK data to both tables when applicable

---

## Implementation TODO List

### Phase 1: Database Migrations

#### 1.1 Add missing columns to break_escape_missions
**File**: `db/migrate/YYYYMMDDHHMMSS_add_metadata_to_break_escape_missions.rb`

```ruby
class AddMetadataToBreakEscapeMissions < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_missions, :secgen_scenario, :string
    add_column :break_escape_missions, :collection, :string, default: 'default'
    
    add_index :break_escape_missions, :collection
  end
end
```

#### 1.2 Create break_escape_cyboks table
**File**: `db/migrate/YYYYMMDDHHMMSS_create_break_escape_cyboks.rb`

```ruby
class CreateBreakEscapeCyboks < ActiveRecord::Migration[7.0]
  def change
    create_table :break_escape_cyboks do |t|
      t.string :ka                    # Knowledge Area code (e.g., "AC", "F", "WAM")
      t.string :topic                 # Topic within the KA
      t.string :keywords              # Keywords as comma-separated string (matches Hacktivity)
      t.string :cybokable_type        # Polymorphic type
      t.integer :cybokable_id         # Polymorphic ID
      
      t.timestamps
    end
    
    add_index :break_escape_cyboks, :cybokable_id
    add_index :break_escape_cyboks, [:cybokable_type, :cybokable_id]
    add_index :break_escape_cyboks, :ka
  end
end
```

---

### Phase 2: Models

#### 2.1 Create BreakEscape::Cybok model
**File**: `app/models/break_escape/cybok.rb`

```ruby
# frozen_string_literal: true
module BreakEscape
  class Cybok < ApplicationRecord
    self.table_name = 'break_escape_cyboks'
    
    belongs_to :cybokable, polymorphic: true
    
    # Mirror Hacktivity's KA_CODES for consistency
    KA_CODES = {
      'IC' => 'Introduction to CyBOK',
      'FM' => 'Formal Methods',
      'RMG' => 'Risk Management & Governance',
      'LR' => 'Law & Regulation',
      'HF' => 'Human Factors',
      'POR' => 'Privacy & Online Rights',
      'MAT' => 'Malware & Attack Technologies',
      'AB' => 'Adversarial Behaviours',
      'SOIM' => 'Security Operations & Incident Management',
      'F' => 'Forensics',
      'C' => 'Cryptography',
      'AC' => 'Applied Cryptography',
      'OSV' => 'Operating Systems & Virtualisation Security',
      'DSS' => 'Distributed Systems Security',
      'AAA' => 'Authentication, Authorisation and Accountability',
      'SS' => 'Software Security',
      'WAM' => 'Web & Mobile Security',
      'SSL' => 'Secure Software Lifecycle',
      'NS' => 'Network Security',
      'HS' => 'Hardware Security',
      'CPS' => 'Cyber Physical Systems',
      'PLT' => 'Physical Layer and Telecommunications Security'
    }.freeze

    CATEGORY_MAPPING = {
      'Introductory Concepts' => ['IC'],
      'Human, Organisational & Regulatory Aspects' => ['RMG', 'LR', 'HF', 'POR'],
      'Attacks & Defences' => ['MAT', 'AB', 'SOIM', 'F'],
      'Systems Security' => ['C', 'OSV', 'DSS', 'AAA', 'FM'],
      'Software and Platform Security' => ['SS', 'WAM', 'SSL'],
      'Infrastructure Security' => ['AC', 'NS', 'HS', 'CPS', 'PLT']
    }.freeze

    def ka_full_name
      KA_CODES[ka] || 'Unknown KA'
    end

    def ka_category
      CATEGORY_MAPPING.each do |category, kas|
        return category if kas.include?(ka)
      end
      'Unknown Category'
    end
    
    # Parse keywords string back to array (matches Hacktivity behavior)
    def keywords_array
      return [] if keywords.blank?
      # Handle both array-coerced strings and plain comma-separated
      keywords.gsub(/[\[\]"]/, '').split(',').map(&:strip)
    end
  end
end
```

#### 2.2 Update BreakEscape::Mission model
**File**: `app/models/break_escape/mission.rb`

Add CyBOK association and dual-mode helper:

```ruby
module BreakEscape
  class Mission < ApplicationRecord
    self.table_name = 'break_escape_missions'

    has_many :games, class_name: 'BreakEscape::Game', dependent: :destroy
    
    # CyBOK associations - always use our table
    has_many :break_escape_cyboks, 
             class_name: 'BreakEscape::Cybok',
             as: :cybokable, 
             dependent: :destroy
    
    # Also populate Hacktivity's cyboks table when available
    if defined?(::Cybok)
      has_many :cyboks, as: :cybokable, dependent: :destroy
    end

    validates :name, presence: true, uniqueness: true
    validates :display_name, presence: true
    validates :difficulty_level, inclusion: { in: 1..5 }

    scope :published, -> { where(published: true) }
    scope :by_collection, ->(collection) { where(collection: collection) }
    scope :collections, -> { distinct.pluck(:collection).compact }

    # Path to scenario directory
    def scenario_path
      BreakEscape::Engine.root.join('scenarios', name)
    end
    
    # Path to mission metadata file
    def mission_json_path
      scenario_path.join('mission.json')
    end
    
    # Check if mission.json exists
    def has_mission_json?
      File.exist?(mission_json_path)
    end
    
    # Load mission metadata from JSON file
    def load_mission_metadata
      return nil unless has_mission_json?
      JSON.parse(File.read(mission_json_path))
    rescue JSON::ParserError => e
      Rails.logger.error "Invalid mission.json for #{name}: #{e.message}"
      nil
    end
    
    # Get all CyBOK entries (prefers Hacktivity's if available for reads)
    def all_cyboks
      if defined?(::Cybok) && respond_to?(:cyboks)
        cyboks
      else
        break_escape_cyboks
      end
    end

    # ... existing methods (generate_scenario_data, ScenarioBinding) ...
  end
end
```

---

### Phase 3: CyBOK Sync Service

#### 3.1 Create CyBOK sync service
**File**: `app/services/break_escape/cybok_sync_service.rb`

```ruby
# frozen_string_literal: true
module BreakEscape
  class CybokSyncService
    # Sync CyBOK data from mission.json to database tables
    # Writes to both BreakEscape and Hacktivity tables when Hacktivity is present
    def self.sync_for_mission(mission, cybok_data)
      return if cybok_data.blank?
      
      # Normalize input (handle both array and hash formats)
      cybok_entries = Array.wrap(cybok_data)
      
      # Clear existing entries
      mission.break_escape_cyboks.destroy_all
      mission.cyboks.destroy_all if mission.respond_to?(:cyboks) && defined?(::Cybok)
      
      cybok_entries.each do |entry|
        ka = entry['ka'] || entry[:ka]
        topic = entry['topic'] || entry[:topic]
        keywords = entry['keywords'] || entry[:keywords]
        
        # Serialize keywords array to string (Hacktivity format)
        keywords_str = keywords.is_a?(Array) ? keywords.join(', ') : keywords.to_s
        
        # Always write to BreakEscape table
        mission.break_escape_cyboks.create!(
          ka: ka,
          topic: topic,
          keywords: keywords_str
        )
        
        # Also write to Hacktivity table if available
        if mission.respond_to?(:cyboks) && defined?(::Cybok)
          mission.cyboks.create!(
            ka: ka,
            topic: topic,
            keywords: keywords_str
          )
        end
      end
    end
    
    # Check if Hacktivity mode is active
    def self.hacktivity_mode?
      defined?(::Cybok)
    end
  end
end
```

---

### Phase 4: Mission Metadata JSON Format

#### 4.1 mission.json schema
**Location**: Each scenario directory (e.g., `scenarios/biometric_breach/mission.json`)

```json
{
  "display_name": "Biometric Breach",
  "description": "Investigate a security breach using biometric forensics in a high-security research facility.",
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
      "keywords": ["Digital forensics", "Evidence collection"]
    },
    {
      "ka": "SOIM",
      "topic": "Security Operations",
      "keywords": ["Incident response", "Security monitoring"]
    }
  ]
}
```

#### 4.2 Example mission.json files to create

| Scenario | Collection | Difficulty | CyBOK KAs |
|----------|------------|------------|-----------|
| `biometric_breach` | security_investigations | 3 | AAA, F, SOIM |
| `ceo_exfil` | data_exfiltration | 4 | AB, MAT, F |
| `cybok_heist` | physical_security | 2 | C, AC, HF |
| `scenario1-4` | testing | 1-2 | Various |
| `npc-*` | testing | 1 | HF |
| `test-*` | testing | 1 | (none) |

---

### Phase 5: Updated Seeds

#### 5.1 Update db/seeds.rb
**File**: `db/seeds.rb`

```ruby
puts "Creating/Updating BreakEscape missions..."

# List all scenario directories
scenario_dirs = Dir.glob(BreakEscape::Engine.root.join('scenarios/*')).select { |f| File.directory?(f) }

# Directories to skip
SKIP_DIRS = %w[common compiled ink].freeze

scenario_dirs.each do |dir|
  scenario_name = File.basename(dir)
  next if SKIP_DIRS.include?(scenario_name)
  
  # Check for scenario.json.erb (required for valid mission)
  scenario_template = File.join(dir, 'scenario.json.erb')
  next unless File.exist?(scenario_template)

  mission = BreakEscape::Mission.find_or_initialize_by(name: scenario_name)
  mission_json_path = File.join(dir, 'mission.json')
  
  if File.exist?(mission_json_path)
    # Load metadata from mission.json
    begin
      metadata = JSON.parse(File.read(mission_json_path))
      
      mission.display_name = metadata['display_name'] || scenario_name.titleize
      mission.description = metadata['description'] || "Play the #{scenario_name.titleize} scenario"
      mission.difficulty_level = metadata['difficulty_level'] || 3
      mission.secgen_scenario = metadata['secgen_scenario']
      mission.collection = metadata['collection'] || 'default'
      mission.published = true
      
      if mission.save
        # Sync CyBOK data
        if metadata['cybok'].present?
          BreakEscape::CybokSyncService.sync_for_mission(mission, metadata['cybok'])
          cybok_count = mission.break_escape_cyboks.count
          puts "  ✓ #{mission.new_record? ? 'Created' : 'Updated'}: #{mission.display_name} (#{cybok_count} CyBOK entries)"
        else
          puts "  ✓ #{mission.new_record? ? 'Created' : 'Updated'}: #{mission.display_name}"
        end
      else
        puts "  ✗ Failed: #{scenario_name} - #{mission.errors.full_messages.join(', ')}"
      end
      
    rescue JSON::ParserError => e
      puts "  ✗ Invalid mission.json for #{scenario_name}: #{e.message}"
      # Fall back to defaults
      apply_default_metadata(mission, scenario_name)
    end
  else
    # No mission.json - use defaults
    apply_default_metadata(mission, scenario_name)
  end
end

def apply_default_metadata(mission, scenario_name)
  mission.display_name ||= scenario_name.titleize
  mission.description ||= "Play the #{scenario_name.titleize} scenario"
  mission.difficulty_level ||= 3
  mission.collection ||= infer_collection(scenario_name)
  mission.published = true
  
  if mission.save
    puts "  ✓ #{mission.new_record? ? 'Created' : 'Updated'} (defaults): #{mission.display_name}"
  else
    puts "  ✗ Failed: #{scenario_name} - #{mission.errors.full_messages.join(', ')}"
  end
end

def infer_collection(scenario_name)
  return 'testing' if scenario_name.start_with?('test', 'npc-', 'scenario')
  'default'
end

puts "\nDone! #{BreakEscape::Mission.count} missions total."
puts "Collections: #{BreakEscape::Mission.collections.join(', ')}"
if BreakEscape::CybokSyncService.hacktivity_mode?
  puts "Hacktivity mode: CyBOK data synced to both tables"
else
  puts "Standalone mode: CyBOK data in break_escape_cyboks only"
end
```

---

### Phase 6: File Creation Tasks

#### 6.1 Files to create

| File | Purpose |
|------|---------|
| `db/migrate/YYYYMMDDHHMMSS_add_metadata_to_break_escape_missions.rb` | Add secgen_scenario, collection columns |
| `db/migrate/YYYYMMDDHHMMSS_create_break_escape_cyboks.rb` | Create CyBOK table |
| `app/models/break_escape/cybok.rb` | CyBOK model with KA codes |
| `app/services/break_escape/cybok_sync_service.rb` | Dual-mode CyBOK sync |
| `scenarios/biometric_breach/mission.json` | Mission metadata |
| `scenarios/ceo_exfil/mission.json` | Mission metadata |
| `scenarios/cybok_heist/mission.json` | Mission metadata |
| (other scenario directories) | Mission metadata files |

#### 6.2 Files to update

| File | Changes |
|------|---------|
| `app/models/break_escape/mission.rb` | Add CyBOK associations, metadata loading |
| `db/seeds.rb` | Read mission.json, sync CyBOK |

---

## Detailed TODO Checklist

### Migrations
- [ ] Create migration: `add_metadata_to_break_escape_missions`
  - [ ] Add `secgen_scenario` string column (nullable)
  - [ ] Add `collection` string column (default: 'default')
  - [ ] Add index on `collection`
- [ ] Create migration: `create_break_escape_cyboks`
  - [ ] Columns: `ka`, `topic`, `keywords` (all strings)
  - [ ] Polymorphic columns: `cybokable_type`, `cybokable_id`
  - [ ] Indexes on `cybokable_id`, `[cybokable_type, cybokable_id]`, `ka`

### Models
- [ ] Create `app/models/break_escape/cybok.rb`
  - [ ] Table name: `break_escape_cyboks`
  - [ ] Polymorphic belongs_to: `cybokable`
  - [ ] KA_CODES constant (copy from Hacktivity)
  - [ ] CATEGORY_MAPPING constant
  - [ ] `ka_full_name` method
  - [ ] `ka_category` method
  - [ ] `keywords_array` method (parse stored string)
- [ ] Update `app/models/break_escape/mission.rb`
  - [ ] Add `has_many :break_escape_cyboks` association
  - [ ] Add conditional `has_many :cyboks` for Hacktivity mode
  - [ ] Add `scope :by_collection`
  - [ ] Add `scope :collections`
  - [ ] Add `mission_json_path` method
  - [ ] Add `has_mission_json?` method
  - [ ] Add `load_mission_metadata` method
  - [ ] Add `all_cyboks` method

### Services
- [ ] Create `app/services/break_escape/cybok_sync_service.rb`
  - [ ] `sync_for_mission(mission, cybok_data)` class method
  - [ ] Handle array/hash input normalization
  - [ ] Write to both tables when Hacktivity present
  - [ ] `hacktivity_mode?` class method

### Seeds
- [ ] Update `db/seeds.rb`
  - [ ] Skip compiled/common/ink directories
  - [ ] Check for scenario.json.erb presence
  - [ ] Load mission.json when present
  - [ ] Apply default values for missing fields
  - [ ] Call CybokSyncService for CyBOK data
  - [ ] Add `infer_collection` helper for test scenarios
  - [ ] Print summary with collection list and mode

### Mission JSON Files
- [ ] Create `scenarios/biometric_breach/mission.json`
- [ ] Create `scenarios/ceo_exfil/mission.json`
- [ ] Create `scenarios/cybok_heist/mission.json`
- [ ] Create mission.json for scenario1-4
- [ ] Create mission.json for npc-* scenarios (collection: testing)
- [ ] Create mission.json for test-* scenarios (collection: testing)

### Testing
- [ ] Run migrations: `rails db:migrate`
- [ ] Run seeds: `rails db:seed`
- [ ] Verify CyBOK data in `break_escape_cyboks` table
- [ ] Test in standalone mode
- [ ] Test with Hacktivity integration (if available)

---

## Mode Detection Logic

```ruby
# In any code needing mode detection:
if defined?(::Cybok)
  # Hacktivity mode: Both tables exist
  # Write to both, read from ::Cybok (Hacktivity's table)
else
  # Standalone mode: Only BreakEscape::Cybok available
  # Use break_escape_cyboks table exclusively
end
```

---

## Data Flow Diagram

```
mission.json (static)           scenario.json.erb (per-instance)
       │                                  │
       ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│  db:seed loads   │            │  Game.create     │
│  metadata        │            │  generates       │
│  + CyBOK data    │            │  random values   │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│break_escape_     │            │ Game instance    │
│missions table    │            │ (has scenario    │
│                  │            │  JSON data)      │
│+ break_escape_   │            └──────────────────┘
│cyboks table      │
│                  │
│(+ Hacktivity     │
│ cyboks table if  │
│ available)       │
└──────────────────┘
```

---

## Rollback Plan

If issues arise:

1. **Migrations**: Run `rails db:rollback` for each migration
2. **Models**: Revert to previous versions from git
3. **Seeds**: Old seeds work with new columns (uses defaults)
4. **mission.json**: Not required - seeds fall back gracefully

---

## View Layer Implementation

### CyBOK Label Partial
**File**: `app/views/break_escape/shared/_cybok_label.html.erb`

Mirrors Hacktivity's `_cybok_label.html.erb` partial:
- Groups CyBOK entries by Knowledge Area (KA)
- Builds Tippy.js tooltip content with topics and keywords
- Uses the shared `_label.html.erb` partial for rendering

### Label Partial
**File**: `app/views/break_escape/shared/_label.html.erb`

Generic label component with:
- Random ID generation for DOM uniqueness
- Tippy.js `data-tippy-content` attribute
- Icon support (optional)

### Stylesheets
- `app/assets/stylesheets/break_escape/labels.css` - Label component styles
- `app/assets/stylesheets/break_escape/tooltips.css` - Tippy.js theme matching Hacktivity

### Helper Methods
**File**: `app/helpers/break_escape/application_helper.rb`

- `generate_random_id` - Creates unique DOM IDs using SecureRandom

### Assets
- `app/assets/images/break_escape/cybok_logo_white.svg` - CyBOK logo for tooltips

---

## Future Enhancements

1. **Admin UI**: Add mission metadata editing in admin panel
2. **Collection filtering**: Add collection dropdown to mission index
3. **CyBOK mapping view**: Show all missions grouped by KA
4. **Validation**: Add JSON schema validation for mission.json
5. **Import/Export**: Bulk import/export mission metadata
