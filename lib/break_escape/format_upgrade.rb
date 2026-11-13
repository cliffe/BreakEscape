# frozen_string_literal: true

require_relative 'scenario_schema' unless defined?(BreakEscape::ScenarioSchema)
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

module BreakEscape
  # Step 7 of the scenario format hardening. A format version lives inside scenario_data as a
  # top-level integer, and an ordered list of upgrade steps keyed on that number lets every reader
  # see only the current field names. Step 7 lands the mechanism with no renames: STEPS is empty,
  # so current is 0 and every game created before step 7 (no formatVersion, read as 0) is already
  # current and is never rewritten because of step 7.
  #
  # Plain Ruby (no Rails): required by the engine model, the controllers and the validator with the
  # guarded form the other lib files use. deep copies use Marshal, not ActiveSupport's deep_dup.
  module FormatUpgrade
    # A stored formatVersion that is not a non-negative Integer. Only the server writes the field,
    # so any other value is a corrupt or hand-edited game, refused like a too-new one.
    class Unreadable < StandardError; end

    # A stored formatVersion above the code's current version: code rolled back after games were
    # upgraded, or an older worktree opening a game a newer branch upgraded. Refused; nothing written.
    class TooNew < StandardError
      attr_reader :stored, :current

      def initialize(stored = nil, current = nil)
        @stored = stored
        @current = current
        super("game format #{stored.inspect} is newer than this server's #{current.inspect}")
      end
    end

    # The ordered upgrade steps, one entry per version:
    #   { version:, name:, scenario: ->(data) {}, player_state: ->(state) {}, retired: [{ path:, key:, now: }] }
    # Empty in step 7. Not frozen and never reassigned: the development-only test switch appends one
    # step in place (see Engine's break_escape.format_upgrade_test_step initializer), so nothing
    # caches an old current value. Every read goes through steps, so tests stub that one method.
    STEPS = []

    # Old keys a deployed scenario still uses, each with the step that retired it. Empty
    # (section 1 of the plan: none of the four deployed scenarios uses any retired key). The place
    # an alias would live, so the rule is built and checked, not assumed.
    ALIASES = [].freeze

    module_function

    # The single read point for STEPS, so a test stubs this one method to inject a fixture step
    # list. Runtime always returns the STEPS constant (which the dev switch may have appended to).
    def steps
      STEPS
    end

    # The code's current format version: the version of the last step, or 0 when there are none.
    # A method, never a constant, so nothing caches an old value.
    def current
      list = steps
      list.empty? ? 0 : list.last[:version]
    end

    # The version a stored scenario_data declares. An absent or nil field is 0; a non-negative
    # Integer is itself; anything else raises Unreadable. Every server path that needs the version
    # calls this; none reads data['formatVersion'] directly.
    def version_of(data)
      raw = data.is_a?(Hash) ? data['formatVersion'] : nil
      return 0 if raw.nil?
      # true / false are not Integers in Ruby, so they fall through to Unreadable.
      return raw if raw.is_a?(Integer) && raw >= 0

      raise Unreadable, "unreadable formatVersion: #{raw.inspect}"
    end

    # Run every step above the stored version, in order, on data and state in place, then stamp
    # current. Returns { ran: [names], scenario_changed: bool }. Raises TooNew when the stored
    # version is above current (nothing is run or stamped). Neither transform reads or writes inside
    # an author note or free data: each walk skips them.
    def upgrade!(data, state)
      stored = version_of(data)
      cur = current
      raise TooNew.new(stored, cur) if stored > cur

      # One deep copy of data without formatVersion, taken before any step. scenario_changed is the
      # comparison of this copy with the final data, not any step's own report (Ruby Hash/Array ==
      # is deep and ignores key order).
      before = Marshal.load(Marshal.dump(data))
      before.delete('formatVersion') if before.is_a?(Hash)

      ran = []
      steps.each do |step|
        next unless step[:version] > stored

        step[:scenario]&.call(data)
        step[:player_state]&.call(state)
        ran << step[:name]
      end

      data['formatVersion'] = cur if data.is_a?(Hash)
      after = data.is_a?(Hash) ? data.reject { |k, _| k == 'formatVersion' } : data
      { ran: ran, scenario_changed: after != before }
    end

    # Every retired key present in rendered data, with its path and new name, skipping author notes
    # and free data (AuthorNotes.each_live from the root with free: :skip). Each result:
    #   { path:, key:, now:, version:, aliased: bool }
    # path is a json-pointer-ish path to the key (its Hash's path plus the key).
    def retired_keys_in(data)
      retired = retired_entries
      return [] if retired.empty?

      found = []
      BreakEscape::AuthorNotes.each_live(data, BreakEscape::ScenarioSchema.root, free: :skip) do |value, _node, keys|
        next unless value.is_a?(Hash)

        value.each_key do |k|
          ks = k.to_s
          retired.each do |entry|
            next unless entry[:key] == ks
            next unless path_matches?(entry[:path], keys)

            found << {
              path: pointer_for(keys + [ks]),
              key: ks,
              now: entry[:now],
              version: entry[:version],
              aliased: aliased?(ks)
            }
          end
        end
      end
      found
    end

    # The flattened retired entries of every step, each tagged with its step's version.
    def retired_entries
      steps.flat_map do |step|
        Array(step[:retired]).map { |e| e.merge(version: step[:version]) }
      end
    end

    # Apply every alias to a freshly rendered template in place (old name -> new name). A no-op
    # while ALIASES is empty. The only place an old name would be read at creation; no engine, Rails
    # or validator reader keeps a fallback.
    def apply_aliases!(_data)
      # ALIASES is empty in step 7; nothing to rewrite. Later steps fill this in.
      _data
    end

    def aliased?(key)
      ALIASES.any? { |a| a[:key] == key }
    end

    # true when a retired entry's path pattern matches the data path of the Hash holding the key.
    # path is nil (match anywhere), a String (a Ruby regexp source matched against the joined path),
    # or an Array of segments (matched by ==). keys is the key path of the Hash, no trailing key.
    def path_matches?(pattern, keys)
      return true if pattern.nil?

      joined = keys.map(&:to_s).join('/')
      case pattern
      when String then Regexp.new(pattern).match?(joined)
      when Array then pattern.map(&:to_s) == keys.map(&:to_s)
      else false
      end
    end

    # A json-pointer-style path for a key path (String keys and Integer indices).
    def pointer_for(keys)
      "##{keys.map { |k| "/#{k.to_s.gsub('~', '~0').gsub('/', '~1')}" }.join}"
    end

    # The development-only test switch (live proof of the reload, step 7). When the environment is
    # development and BREAK_ESCAPE_FORMAT_TEST_STEP=1, append one no-op step with version 900 to
    # STEPS, so current reads 900 and a tab on a game at 0 reloads once. 900 is far from any real
    # format number, so a game stamped by this switch can never pass for a real format. Never acts in
    # test or production. No constant is reassigned; idempotent. Returns the step it added, or nil.
    def install_dev_test_step!(env:, enabled: ENV['BREAK_ESCAPE_FORMAT_TEST_STEP'] == '1')
      return nil unless enabled
      return nil unless env.to_s == 'development'
      return nil if STEPS.any? { |s| s[:version] == 900 }

      step = {
        version: 900,
        name: 'dev_test_noop',
        scenario: ->(_data) { },
        player_state: ->(_state) { },
        retired: []
      }
      STEPS << step
      step
    end
  end
end
