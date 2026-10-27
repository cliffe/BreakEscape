require 'test_helper'

module BreakEscape
  # 3.8 read "payroll-notices" as "payroll hyphen notices": the voice gets a
  # space instead, while the cache key still comes from the line as written.
  class TtsSpokenTextTest < ActiveSupport::TestCase
    VOICE = ["Puck", "Calm.", "en-GB"].freeze

    test "a hyphen between letters is spoken as a space" do
      assert_equal "Notices come from payroll notices at our domain.",
                   TtsService.spoken_text("Notices come from payroll-notices at our domain.")
      assert_equal "the new starter list", TtsService.spoken_text("the new-starter list")
    end

    test "hyphens next to digits, dashes and spaced hyphens are left alone" do
      assert_equal "Shift 9-5, ext 2201-4", TtsService.spoken_text("Shift 9-5, ext 2201-4")
      assert_equal "Wait - no.", TtsService.spoken_text("Wait - no.")
      assert_equal "Well -- maybe", TtsService.spoken_text("Well -- maybe")
    end

    test "the cache key is unchanged by the spoken form" do
      line = "Notices come from payroll-notices at our domain."
      assert_equal TtsService.cache_key(line, *VOICE),
                   TtsService.cache_key(TtsService.normalize_text(line), *VOICE)
      refute_equal TtsService.cache_key(line, *VOICE),
                   TtsService.cache_key(TtsService.spoken_text(line), *VOICE)
    end
  end
end
