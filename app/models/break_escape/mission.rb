module BreakEscape
  class Mission < ApplicationRecord
    self.table_name = 'break_escape_missions'

    has_many :games, class_name: 'BreakEscape::Game', dependent: :destroy

    # CyBOK associations - always use our table for standalone mode
    has_many :break_escape_cyboks,
             class_name: 'BreakEscape::Cybok',
             as: :cybokable,
             dependent: :destroy

    # GameSlot association (Hacktivity only) — guard prevents LoadError in standalone mode
    if defined?(::GameSlot)
      has_many :game_slots,
               class_name: '::GameSlot',
               foreign_key: :break_escape_mission_id,
               dependent: :destroy
    end

    VM_ACTIVATION_MODES = %w[eager lazy].freeze

    validates :name, presence: true, uniqueness: true
    validates :display_name, presence: true
    validates :difficulty_level, inclusion: { in: 1..5 }
    validates :vm_activation_mode, inclusion: { in: VM_ACTIVATION_MODES }

    scope :published, -> { where(published: true) }
    scope :by_collection, ->(collection) { where(collection: collection) }

    # Get all distinct collections
    def self.collections
      distinct.pluck(:collection).compact.sort
    end

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

    # Optional lab sheet for this mission, from mission.json's "lab_sheet_url".
    # Hacktivity copies it onto a new GameSlot whose own URL is left blank.
    def lab_sheet_url
      load_mission_metadata&.dig('lab_sheet_url').presence
    end

    # HUD skins, styled in public/break_escape/css/ui-themes.css. A mission picks
    # one with "ui_theme" in mission.json; anything else falls back to the default.
    UI_THEMES = %w[general spy cyberpunk crt eldritch circuit secops].freeze
    DEFAULT_UI_THEME = 'general'.freeze

    def self.normalise_ui_theme(theme)
      UI_THEMES.include?(theme.to_s) ? theme.to_s : nil
    end

    def ui_theme
      self.class.normalise_ui_theme(load_mission_metadata&.dig('ui_theme')) || DEFAULT_UI_THEME
    end

    # How a game of this mission is scored, from mission.json "scoring".
    # tasks (default): 70 × tasks + 30 × aims. partial_then_complete: that,
    # capped at 99 until the mission concludes, then 100. completion: 0 until
    # the mission concludes, then 100.
    SCORING_MODES = %w[tasks partial_then_complete completion].freeze
    DEFAULT_SCORING_MODE = 'tasks'.freeze

    def scoring_mode
      mode = load_mission_metadata&.dig('scoring').to_s
      SCORING_MODES.include?(mode) ? mode : DEFAULT_SCORING_MODE
    end

    # The game global that holds an awareness check's result percent, from
    # mission.json "resultGlobal" (for example "triage_pre_percent"). nil for
    # every mission that does not report a result. Only a plain global name is
    # accepted. The sibling globals share its prefix: <prefix>reportRate and
    # <prefix>complete (older saved games: <prefix>done).
    RESULT_GLOBAL_PATTERN = /\A[A-Za-z][A-Za-z0-9_]*_percent\z/
    RESULT_STAGES = %w[pre post episode].freeze

    def result_global
      name = load_mission_metadata&.dig('resultGlobal').to_s
      RESULT_GLOBAL_PATTERN.match?(name) ? name : nil
    end

    # Where a result sits in the awareness course: pre (before-check), post
    # (after-check) or episode. mission.json "stage" wins; without it the stage
    # is read from the result global's name (triage_pre_percent, triage_post_percent,
    # episode_<id>_defend_percent). nil when the mission has no result.
    def result_stage
      return nil unless result_global

      declared = load_mission_metadata&.dig('stage').to_s
      return declared if RESULT_STAGES.include?(declared)

      case result_global
      when /\Atriage_pre_/ then 'pre'
      when /\Atriage_post_/ then 'post'
      when /\Aepisode_/ then 'episode'
      end
    end
    alias stage result_stage

    # Whether the game warns the player, before the ending fires, that optional
    # objectives are still open. On unless mission.json says "endingCheck": false.
    def ending_check?
      load_mission_metadata&.dig('endingCheck') != false
    end
    alias ending_check ending_check?

    # A mission that runs under time pressure and is not meant for a perfect
    # score (sis01, sis02): "endingCheck": false, or an explicit "timed": true.
    def timed?
      meta = load_mission_metadata
      meta&.dig('timed') == true || meta&.dig('endingCheck') == false
    end

    # What a game's score breakdown needs from this mission, read once per
    # mission (Game.score_breakdowns builds one per mission, not per game).
    def score_facts
      { result_global: result_global, result_stage: result_stage, ending_check: ending_check?,
        timed: timed?, scoring_mode: scoring_mode }
    end

    # Painted title art, from mission.json "title_art": a path under
    # public/break_escape/assets/ (e.g. "title_art/awareness_e12_visitor_tailgater.jpg").
    # Returns nil when unset or not a plain relative image path. The in-game title
    # screen shows it as a backdrop; a host (Hacktivity) can show it on course tiles
    # at /break_escape/assets/<path>. Read at runtime, so no migration is needed.
    TITLE_ART_PATTERN = %r{\Atitle_art/[A-Za-z0-9_\-]+\.(?:jpg|jpeg|png|webp)\z}

    def title_art_path
      path = load_mission_metadata&.dig('title_art').to_s
      TITLE_ART_PATTERN.match?(path) ? path : nil
    end

    # Get all CyBOK entries. Always returns break_escape_cyboks — these are the
    # authoritative source for the mission regardless of host mode. In Hacktivity,
    # the GameSlot syncs these into the host's cyboks table on save so that the
    # host's profiling and content-mapping features see the same data without
    # requiring a direct read from the engine's table.
    def all_cyboks
      break_escape_cyboks
    end

    # Check if Hacktivity mode is available (VMs and flag service)
    def self.hacktivity_mode?
      defined?(::VmSet) && defined?(::FlagService)
    end

    # Check if mission requires VMs (has secgen_scenario configured)
    def requires_vms?
      secgen_scenario.present?
    end

    # Get valid VM sets for this mission (Hacktivity mode only)
    #
    # HACKTIVITY COMPATIBILITY NOTES:
    # - Hacktivity uses `sec_gen_batch` (with underscore), not `secgen_batch`
    # - The `scenario` field contains the XML path (e.g., "scenarios/ctf/foo.xml")
    # - VmSet doesn't have a `display_name` method - use sec_gen_batch.title instead
    # - Always eager-load :vms and :sec_gen_batch to avoid N+1 queries
    def valid_vm_sets_for_user(user)
      return [] unless self.class.hacktivity_mode? && requires_vms?

      # Query Hacktivity's vm_sets where:
      # - scenario matches our secgen_scenario
      # - user owns it (or is on the team)
      # - not relinquished
      # - build completed successfully
      ::VmSet.joins(:sec_gen_batch)
             .where(sec_gen_batches: { scenario: secgen_scenario })
             .where(user: user, relinquished: false)
             .where.not(build_status: ['pending', 'error'])
             .includes(:vms, :sec_gen_batch)
             .order(created_at: :desc)
    end

    # Generate scenario data via ERB with optional VM context
    def generate_scenario_data(vm_context = {})
      template_path = scenario_path.join('scenario.json.erb')
      raise "Scenario template not found: #{name}" unless File.exist?(template_path)

      erb = ERB.new(File.read(template_path))
      binding_context = ScenarioBinding.new(vm_context)
      output = erb.result(binding_context.get_binding)

      JSON.parse(output)
    rescue JSON::ParserError => e
      raise "Invalid JSON in #{name} after ERB processing: #{e.message}"
    end

    # Voice configs by speaker id ('narrator', NPC ids, and objects with a
    # ttsVoice) from the scenario as it is now. A game keeps the scenario_data it
    # started with, so without this a game begun before a voice was restyled
    # would ask for clips under the old style and miss the regenerated cache.
    # Cached per template mtime; voice configs don't depend on vm_context.
    def current_voice_configs
      template_path = scenario_path.join('scenario.json.erb')
      mtime = File.mtime(template_path)
      cached = self.class.voice_config_cache[name]
      return cached[:configs] if cached && cached[:mtime] == mtime

      configs = self.class.voice_configs_from(generate_scenario_data({}))
      self.class.voice_config_cache[name] = { mtime: mtime, configs: configs.freeze }
      configs
    rescue => e
      Rails.logger.warn "[BreakEscape] Could not read current voice configs for #{name}: #{e.message}"
      # Cache the failure too, so a broken template logs once rather than per request
      self.class.voice_config_cache[name] = { mtime: mtime, configs: {}.freeze } if mtime
      {}
    end

    # NPCs in this mission whose sprites can be unlocked as player avatars
    # ([{ 'sprite', 'name' }], see AvatarUnlocks.candidates). Feeds the avatar
    # menu's catalogue of locked characters. Cached per template mtime like
    # current_voice_configs; NPC sprites don't depend on vm_context.
    def avatar_candidates
      template_path = scenario_path.join('scenario.json.erb')
      mtime = File.mtime(template_path)
      cached = self.class.avatar_candidate_cache[name]
      return cached[:candidates] if cached && cached[:mtime] == mtime

      candidates = AvatarUnlocks.candidates(generate_scenario_data({})).freeze
      self.class.avatar_candidate_cache[name] = { mtime: mtime, candidates: candidates }
      candidates
    rescue => e
      Rails.logger.warn "[BreakEscape] Could not read avatar candidates for #{name}: #{e.message}"
      self.class.avatar_candidate_cache[name] = { mtime: mtime, candidates: [].freeze } if mtime
      []
    end

    def self.avatar_candidate_cache
      @avatar_candidate_cache ||= Concurrent::Map.new
    end

    # Voice configs by speaker id from rendered scenario data (see current_voice_configs).
    # Shared with TtsLineExtractor, so the batch voices each line as the endpoint will.
    def self.voice_configs_from(data)
      configs = {}
      configs['narrator'] = data['narrator']['voice'] if data.dig('narrator', 'voice').is_a?(Hash)
      (data['rooms'] || {}).each_value do |room|
        Array(room['npcs']).each do |npc|
          configs[npc['id']] ||= npc['voice'] if npc['voice'].is_a?(Hash)
        end
        Array(room['objects']).each do |obj|
          configs[obj['id']] ||= obj['ttsVoice'] if obj['ttsVoice'].is_a?(Hash)
        end
      end
      configs
    end

    def self.voice_config_cache
      @voice_config_cache ||= Concurrent::Map.new
    end

    # Parse SecGen flag_hints.xml to extract flags per VM
    # Returns: { "desktop" => ["flag{abc}", "flag{def}"], "kali" => [] }
    def self.parse_flag_hints_xml(xml_content)
      return {} if xml_content.blank?

      require 'nokogiri'
      doc = Nokogiri::XML(xml_content)

      # Remove namespaces for simpler XPath queries
      # SecGen uses xmlns="http://www.github/cliffe/SecGen/marker"
      doc.remove_namespaces!

      flags_by_vm = {}

      doc.xpath('//system').each do |system|
        system_name = system.at_xpath('system_name')&.text
        next unless system_name.present?

        flags = system.xpath('challenge/flag').map(&:text).compact
        flags_by_vm[system_name] = flags
      end

      flags_by_vm
    rescue Nokogiri::XML::SyntaxError => e
      Rails.logger.error "[BreakEscape] Invalid flag_hints.xml: #{e.message}"
      {}
    end

    # Binding context for ERB variables
    class ScenarioBinding
      def initialize(vm_context = {})
        @random_password = SecureRandom.alphanumeric(8)
        @random_pin = rand(1000..9999).to_s
        @random_code = SecureRandom.hex(4)
        @vm_context = vm_context  # VM/flag data for CTF integration
      end

      attr_reader :random_password, :random_pin, :random_code, :vm_context

      # Get a VM from the context by title, or return a fallback VM object
      # In Hacktivity mode: returns VM data from the VmSet
      # In standalone mode: uses fallback but overrides IP from vm_ips if available
      # Usage in ERB:
      #   "vm": <%= vm_object('kali', {"id":1,"title":"kali","ip":"192.168.1.10","enable_console":true}) %>
      def vm_object(title, fallback = {})
        if vm_context && vm_context['hacktivity_mode'] && vm_context['vms']
          vm = vm_context['vms'].find { |v| v['title'] == title }
          return vm.to_json if vm
        end

        # Standalone mode: use fallback, but override IP from vm_ips if available
        result = fallback.dup
        if vm_context && vm_context['vm_ips'] && vm_context['vm_ips'][title]
          result['ip'] = vm_context['vm_ips'][title]
        end
        result.to_json
      end

      # Get flags for a specific VM from the context
      # Usage in ERB:
      #   "flags": <%= flags_for_vm('desktop', ['flag{test1}', 'flag{test2}']) %>
      def flags_for_vm(vm_name, fallback = [])
        if vm_context && vm_context['flags_by_vm']
          flags = vm_context['flags_by_vm'][vm_name]
          return flags.to_json if flags
        end
        fallback.to_json
      end

      # Get a slice of flags for a VM (by start index and count).
      # Useful when one VM produces flags consumed by multiple separate stations.
      # Usage in ERB:
      #   "flags": <%= flags_for_vm_slice('desktop', 0, 3, ['flag{a}', 'flag{b}', 'flag{c}']) %>
      #   "flags": <%= flags_for_vm_slice('desktop', 3, 1, ['flag{d}']) %>
      def flags_for_vm_slice(vm_name, start_index, count, fallback = [])
        if vm_context && vm_context['flags_by_vm']
          flags = vm_context['flags_by_vm'][vm_name]
          return flags.slice(start_index, count).to_json if flags
        end
        fallback.to_json
      end

      # Generate a top-level flags object for a VM: { "flag_1": "actual_value", ... }
      # Used in the scenario's top-level "flags" section — stays server-side only.
      # Usage in ERB:
      #   "intro_to_linux_security_lab": <%= vm_flags_json('intro_to_linux_security_lab') %>
      def vm_flags_json(vm_name, fallback = [])
        # In Hacktivity mode the real per-build flags come from vm_context keyed by
        # SecGen system_name. In standalone/dev (no vm_context) the fallback array is
        # used so the scenario still renders with placeholder flags. Note: when a
        # vm_context IS present but this vm_name has no flags, we deliberately return
        # '{}' rather than the static fallback, so a wrong VM key surfaces as empty
        # rather than silently validating against placeholder values.
        flags =
          if vm_context && vm_context['flags_by_vm']
            vm_context['flags_by_vm'][vm_name]
          else
            fallback
          end
        return '{}' unless flags.is_a?(Array)

        flags.each_with_index.map { |f, i| ["flag_#{i + 1}", f] }.to_h.to_json
      end

      def get_binding
        binding
      end
    end
  end
end
