# BreakEscape Engine Configuration
BreakEscape.configure do |config|
  # Set to true for standalone mode (development)
  # Set to false when mounted in Hacktivity (production)
  config.standalone_mode = ENV['BREAK_ESCAPE_STANDALONE'] == 'true'

  # Demo user handle for standalone mode
  config.demo_user_handle = ENV['BREAK_ESCAPE_DEMO_USER'] || 'demo_player'
end

# TTS configuration check
gemini_key = ENV['GEMINI_API_KEY'].presence ||
             Rails.application.credentials.dig(Rails.env.to_sym, :gemini_api_key).presence
unless gemini_key
  warning = '[BreakEscape] Warning: GEMINI_API_KEY environment variable is not set. '
  warning += 'TTS (text-to-speech) features will be disabled. '
  puts warning
  Rails.logger.warn warning
end
