# frozen_string_literal: true

# Social lints for exercise stations and the shared exercise list:
#
#   social.exercises[]                     { id, scene, config }: a named exercise for one of five scenes
#   { "type": "exercise-station", ... }    an object whose minigameData names a scene and either an
#                                          exerciseId or an inline config
#   eventMappings[].openMinigame           a registry type (the same table ink's #trigger_minigame uses)
#
# The scene configs are the ones an awareness episode carries (sortDrill, concernForm, privacyPanel,
# assistant, guess), so their rules are Awareness's own *_config_checks, run here under a message
# scope that names the exercise or the object. Runs for any scenario, with or without a `social` block
# (a station may carry an inline config in a mission that has none).
module ValidateSocial
  module Exercises
    SCENES = %w[sort-drill concern-form privacy-panel assistant-chat password-guesser].freeze
    # The types systems/minigame-registry.js opens. Keep in step with BUILT_IN there.
    REGISTRY_TYPES = %w[case-file osint-workstation triage-workstation authenticator-device kiosk page-builder
                        report-workstation mail_terminal exercise-station].freeze

    def self.check(ctx)
      issues = []
      social = ctx.json['social'].is_a?(Hash) ? ctx.json['social'] : {}
      # The scene lints read ctx.social; a mission with no social block gets an empty one
      ctx = ctx.dup.tap { |c| c.social = social } if ctx.social.nil?
      entries = exercise_list(ctx, social, issues)
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'exercise-station'

        issues.concat(station_checks(ctx, entries, obj['minigameData'], "'#{path}' (exercise-station)"))
      end
      mapping_checks(ctx, entries, issues)
      issues
    end

    # ---- social.exercises ----------------------------------------------------

    def self.exercise_list(ctx, social, issues)
      return {} unless social.key?('exercises')

      list = social['exercises']
      unless list.is_a?(Array)
        issues << Mail.err('social.exercises must be an array of { id, scene, config }')
        return {}
      end
      entries = {}
      list.each_with_index do |e, i|
        unless e.is_a?(Hash)
          issues << Mail.err("social.exercises[#{i}] must be an object { id, scene, config }")
          next
        end
        id = e['id']
        if Mail.blank?(id)
          issues << Mail.err("social.exercises[#{i}] has no id; a station refers to an exercise by id")
          next
        end
        issues << Mail.err("social.exercises: id '#{id}' is used more than once") if entries.key?(id)
        entries[id] = e
        scene = e['scene']
        unless SCENES.include?(scene)
          issues << Mail.err("social.exercises[#{id}].scene #{scene.inspect} must be one of #{SCENES.join(', ')}")
          next
        end
        if e['config'].is_a?(Hash)
          issues.concat(config_issues(ctx, scene, e['config'], "social.exercises[#{id}].config"))
        else
          issues << Mail.err("social.exercises[#{id}].config must be an object (the #{scene} scene's config)")
        end
      end
      entries
    end

    # The scene's own lints, with messages naming `label` instead of the awareness episode.
    def self.config_issues(ctx, scene, config, label)
      found = Awareness.with_scope(label) do
        case scene
        when 'sort-drill' then Awareness.sort_drill_config_checks(config)
        when 'concern-form' then Awareness.concern_form_config_checks(config)
        when 'privacy-panel' then Awareness.privacy_panel_config_checks(ctx, config)
        when 'assistant-chat' then Awareness.assistant_config_checks(config)
        when 'password-guesser' then Awareness.guess_config_checks(ctx, config)
        else []
        end
      end
      found.map { |m| m.gsub(/awarenessEpisode\.(assistant|guess)/, 'config') }
    end

    # ---- one station's minigameData (an object's, or a mapping's, or an ink tag's) ----

    def self.station_checks(ctx, entries, md, where)
      return [Mail.err("#{where} has no minigameData; it needs a scene and an exerciseId or a config")] unless md.is_a?(Hash)

      issues = []
      entry = nil
      if md.key?('exerciseId')
        entry = entries[md['exerciseId']]
        issues << Mail.err("#{where} exerciseId '#{md['exerciseId']}' is not in social.exercises") if entry.nil?
      end
      scene = md['scene'] || entry&.dig('scene')
      if !SCENES.include?(scene)
        issues << Mail.err("#{where} has no usable scene (#{scene.inspect}); name one of #{SCENES.join(', ')} in minigameData.scene or through an exerciseId")
        return issues
      end
      if entry && md['scene'] && entry['scene'] != md['scene']
        issues << Mail.err("#{where} scene '#{md['scene']}' does not match exercise '#{entry['id']}', which is a #{entry['scene']}")
      end
      config = md['config'].is_a?(Hash) ? md['config'] : entry&.dig('config')
      if md.key?('config') && !md['config'].is_a?(Hash)
        issues << Mail.err("#{where} minigameData.config must be an object")
      elsif !config.is_a?(Hash)
        issues << Mail.err("#{where} has neither an inline config nor an exerciseId with one; the scene would open on nothing")
      elsif md['config'].is_a?(Hash)
        issues.concat(config_issues(ctx, scene, config, "#{where} minigameData.config"))
      end
      issues.concat(prefix_checks(ctx, md, entry, scene, config, where))
      issues
    end

    def self.prefix_checks(ctx, md, entry, scene, config, where)
      prefix = md['setGlobalPrefix'] || entry&.dig('setGlobalPrefix')
      if md.key?('setGlobalPrefix') && Mail.blank?(md['setGlobalPrefix'])
        return [Mail.err("#{where} minigameData.setGlobalPrefix must be a non-empty string")]
      end
      if Mail.blank?(prefix)
        return [Mail.warn_("#{where} has no setGlobalPrefix, so finishing it writes no global; a door, objective or mapping can only wait on the #{scene.tr('-', '_')}_completed event")]
      end

      issues = []
      names = ["#{prefix}done"]
      names << "#{prefix}percent" if scene == 'sort-drill' && config.is_a?(Hash) && config['scored'] == true
      names.each do |name|
        issues << Mail.err("#{where} writes the global '#{name}' when finished, but globalVariables does not declare it") unless ctx.all_globals.key?(name)
      end
      issues
    end

    # ---- event mappings --------------------------------------------------------

    def self.mapping_checks(ctx, entries, issues)
      ValidateSocial.npc_records(ctx.json).each do |npc|
        Array(npc['eventMappings']).each_with_index do |m, i|
          next unless m.is_a?(Hash) && m.key?('openMinigame')

          where = "NPC '#{npc['id']}' eventMappings[#{i}] openMinigame"
          raw = m['openMinigame']
          type = raw.is_a?(Hash) ? raw['type'] : raw
          unless type.is_a?(String) && REGISTRY_TYPES.include?(type)
            issues << Mail.err("#{where} names #{type.inspect}, which is not a minigame type (#{REGISTRY_TYPES.join(', ')})")
            next
          end
          issues << Mail.err("#{where} also sets conversationMode; a mapping opens a minigame or a conversation, not both") if m['conversationMode']
          next unless type == 'exercise-station'

          md = raw.is_a?(Hash) ? raw['minigameData'] : nil
          issues.concat(station_checks(ctx, entries, md, where))
        end
      end
    end
  end
end
