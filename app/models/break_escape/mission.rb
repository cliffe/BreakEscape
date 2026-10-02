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
