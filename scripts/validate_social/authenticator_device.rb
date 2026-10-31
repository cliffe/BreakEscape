# frozen_string_literal: true

# Social lints for `authenticator-device` room objects: a phone in the room that plays the push
# stream held in its own minigameData. The stream is linted by Awareness.mfa_checks (the same
# rules as awarenessEpisode.mfa); this file adds the object's setGlobalPrefix and lockUntilOutcome.
module ValidateSocial
  module AuthenticatorDevice
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'authenticator-device'

        md = obj['minigameData']
        unless md.is_a?(Hash)
          issues << Mail.err("'#{path}' (authenticator-device) has no minigameData; the phone would open with no prompts")
          next
        end
        stream = md.reject { |k, _| %w[setGlobalPrefix strings lockUntilOutcome].include?(k) }
        Awareness.mfa_checks({ 'stages' => ['mfa'], 'mfa' => stream }).each do |msg|
          issues << msg.gsub('awarenessEpisode.mfa', "'#{path}' minigameData")
        end
        if md.key?('lockUntilOutcome') && ![true, false].include?(md['lockUntilOutcome'])
          issues << Mail.err("'#{path}' minigameData.lockUntilOutcome must be true or false (false lets Close and Esc leave a decision-mode phone before the outcome)")
        end
        next unless md.key?('setGlobalPrefix')

        prefix = md['setGlobalPrefix']
        if Mail.blank?(prefix)
          issues << Mail.err("'#{path}' minigameData.setGlobalPrefix must be a non-empty string")
          next
        end
        declared = ctx.all_globals
        %w[approved sent].each do |suffix|
          name = "#{prefix}#{suffix}"
          issues << Mail.err("'#{path}' writes the global '#{name}' on close, but globalVariables does not declare it") unless declared.key?(name)
        end
      end
      issues
    end
  end
end
