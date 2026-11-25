require 'test_helper'
require_relative 'ops_crack_scanner_real_answers_test'

module BreakEscape
  # Ops follow-up C3: the whole-run crack test again, with the recorder's new `hash` tag on every POST /crack row. The inherited
  # teardown scans the capture with today's unchanged scanner: honest play with the tags must give no finding, and every
  # mutation must still be a finding. (Overriding `post` on this test's own subclass does not touch an application class.)
  class RecorderTagsScannerCrackTest < OpsCrackScannerRealAnswersTest
    # R1-C2: the tag is the recorder's own output (recorder_tag_rows.jsonl, checked by test/js/playtest-session-capture.test.mjs).
    def recorder_hash_tag(hash_id)
      @recorder_tags ||= File.readlines(File.expand_path('../../fixtures/files/recorder_tag_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }
      row = @recorder_tags.find { |r| r.dig('hash', 'hashId') == hash_id }
      flunk "the recorder fixture has no hash tag for #{hash_id}" unless row
      row['hash']
    end

    def post(*args, **opts, &blk)
      result = super
      row = captured.last
      if row && row['path'].end_with?('/crack')
        sent = opts[:params]
        sent = sent.to_unsafe_h if sent.respond_to?(:to_unsafe_h)
        row['hash'] = recorder_hash_tag((sent || {}).with_indifferent_access[:hash_id])
      end
      result
    end

    teardown do
      next unless @game && captured.any?

      tags = crack_rows.select { |r| r['hash'].is_a?(Hash) && r['hash']['hashId'].is_a?(String) && !r['hash']['hashId'].empty? }
      assert_operator tags.size, :>=, 9, 'at least nine crack rows carry the hash tag'
      assert_equal crack_rows.size, tags.size, 'every crack row carries one'
      assert_nil AccessLeakScanner.hand_tag_problem({ 'capture.jsonl' => captured })
    end
  end
end
