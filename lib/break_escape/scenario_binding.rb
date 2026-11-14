# frozen_string_literal: true

require 'securerandom'
require 'json'
require 'erb'
# Some templates call Base64.strict_encode64 from an inline base64_encode helper and rely on the
# host having loaded base64 (the server through Rails, each old tool through its own require). The
# shared binding loads it so every caller renders every template. base64 is a Ruby stdlib, not a gem.
require 'base64'

module BreakEscape
  # One ERB binding for every renderer of a scenario.json.erb (plan step 5).
  #
  # The server's Mission#generate_scenario_data is the truth; the validator, the dungeon-graph
  # generator and the render tools all went through their own near-copies, which drifted (the
  # validator's vm_flags_json returned a plain array where the server returns a Hash). They now
  # all render through this one class, so one template renders one way wherever it is read.
  #
  # Plain Ruby (securerandom, json, erb only): the validator and the tools require it directly,
  # outside Rails, and the engine autoloads it from lib/ inside Rails.
  class ScenarioBinding
    def initialize(vm_context = {})
      @random_password = SecureRandom.alphanumeric(8)
      @random_pin = rand(1000..9999).to_s
      @random_code = SecureRandom.hex(4)
      @vm_context = vm_context || {} # VM/flag data for CTF integration
    end

    attr_reader :random_password, :random_pin, :random_code, :vm_context

    # Render a scenario template to JSON text with a fresh binding.
    #
    # The binding (and so every random value it draws, @random_pin among them) is built inside
    # this call, after any seed the caller set immediately before, so step 3's leak check can seed
    # the default generator around its two renders and get the same draw each time. No trim mode:
    # the server's ERB options are the truth, and no template uses -%> today.
    #
    # Returns the rendered string; callers JSON.parse it themselves.
    def self.render(template_text, vm_context = {})
      ERB.new(template_text).result(new(vm_context).get_binding)
    end

    # Get a VM from the context by title, or return a fallback VM object.
    # In Hacktivity mode: returns VM data from the VmSet.
    # In standalone mode: uses fallback, but overrides IP from vm_ips if available.
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

    # Get flags for a specific VM from the context.
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
      # In Hacktivity mode the real per-build flags come from vm_context keyed by SecGen
      # system_name. In standalone/dev (no vm_context) the fallback array is used so the scenario
      # still renders with placeholder flags. When a vm_context IS present but this vm_name has no
      # flags, we deliberately return '{}' rather than the static fallback, so a wrong VM key
      # surfaces as empty rather than silently validating against placeholder values.
      flags =
        if vm_context && vm_context['flags_by_vm']
          vm_context['flags_by_vm'][vm_name]
        else
          fallback
        end
      return '{}' unless flags.is_a?(Array)

      flags.each_with_index.map { |f, i| ["flag_#{i + 1}", f] }.to_h.to_json
    end

    # JSON-safe interpolation of an authored value into the template text.
    # Use for any value that might carry a quote, backslash or newline:
    #   "title": <%= json(title) %>
    # instead of pasting the raw value between quotes.
    def json(value)
      value.to_json
    end

    def get_binding
      binding
    end
  end
end
