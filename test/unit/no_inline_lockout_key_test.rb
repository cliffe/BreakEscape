require 'test_helper'

# S8a unit 08: the loginLockouts key is built and split only by AccessIdentities.lockout_key and
# AccessIdentities.lockout_key_parts. No other file under app/ or lib/ may do it inline.
class NoInlineLockoutKeyTest < ActiveSupport::TestCase
  ROOT = BreakEscape::Engine.root
  OWNER = 'lib/break_escape/access_identities.rb'.freeze

  # A string built as "<id>|<name>", or a split at a pipe, in code that deals with lockouts
  PATTERNS = [
    /["']#\{[^}]*(pc_id|pc\[['"]id['"]\]|pc\.id)[^}]*\}\|#\{/,
    /\.split\(\s*['"]\|['"]/,
    /\.partition\(\s*['"]\|['"]/
  ].freeze

  # Files whose pipe use is unrelated to the lockout key (tts match keys)
  UNRELATED = %w[
    app/services/break_escape/tts_service.rb
    app/services/break_escape/tts_line_extractor.rb
  ].freeze

  test 'no file under app or lib builds or splits a lockout key outside AccessIdentities' do
    hits = []
    Dir.glob(ROOT.join('{app,lib}/**/*.rb')).sort.each do |path|
      rel = Pathname.new(path).relative_path_from(ROOT).to_s
      next if rel == OWNER || UNRELATED.include?(rel)

      File.foreach(path).with_index(1) do |line, n|
        next if line.lstrip.start_with?('#')

        hits << "#{rel}:#{n}: #{line.strip}" if PATTERNS.any? { |re| line.match?(re) }
      end
    end
    assert_empty hits, "inline lockout key use (use AccessIdentities.lockout_key / lockout_key_parts):\n#{hits.join("\n")}"
  end
end
