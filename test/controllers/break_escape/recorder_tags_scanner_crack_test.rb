require 'test_helper'
require_relative 'ops_crack_scanner_real_answers_test'

module BreakEscape
  # Scanner hardening U1a (was ops follow-up C3): the whole-run crack test again, with the recorder's `hash` tag on every POST
  # /crack row. The inherited teardown scans the tagged capture (the library's :auto mode reads it as tagged): honest play must
  # give no finding, and every mutation must still be a finding. Reading the `hash` tag in the crack rules is U2's; here the
  # scanner must take the capture as tagged (`@tags_on`, `row_hash_tag`), accept it when tags are required, and refuse a copy
  # with one crack row's key removed. (Overriding `post` on this test's own subclass does not touch an application class.)
  class RecorderTagsScannerCrackTest < OpsCrackScannerRealAnswersTest
    # R1-C2: the tag is the recorder's own output (recorder_tag_rows.jsonl, checked by test/js/playtest-session-capture.test.mjs).
    def recorder_hash_tag(hash_id)
      @recorder_tags ||= File.readlines(File.expand_path('../../fixtures/files/recorder_tag_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }
      row = @recorder_tags.find { |r| r.dig('hash', 'hashId') == hash_id }
      flunk "the recorder fixture has no hash tag for #{hash_id}" unless row
      row['hash']
    end

    # The recorder tags every PC-route POST as well (the capture is one recorded run): a sign-in's `pc` is { pcId } of the id the
    # request named, in the shape the recorder writes (recorder_tag_rows.jsonl holds the fixture ids; the others are built alike).
    def recorder_pc_tag(pc_id)
      return nil unless pc_id.is_a?(String) && !pc_id.empty?

      @recorder_tags ||= File.readlines(File.expand_path('../../fixtures/files/recorder_tag_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }
      @recorder_tags.find { |r| r.dig('pc', 'pcId') == pc_id }&.fetch('pc') || { 'pcId' => pc_id }
    end

    def post(*args, **opts, &blk)
      result = super
      row = captured.last
      # The recorder stamps every row with the arrival time `t` (response-capture.js); the crack rules time the wait by it (U2).
      row['t'] = Time.now.utc.strftime('%Y-%m-%dT%H:%M:%S.%LZ') if row
      sent = opts[:params]
      sent = sent.to_unsafe_h if sent.respond_to?(:to_unsafe_h)
      sent = (sent || {}).with_indifferent_access
      if row && row['path'].end_with?('/crack')
        row['hash'] = recorder_hash_tag(sent[:hash_id])
      elsif row && AccessLeakScanner::PC_TAG_ROUTES.any? { |r| row['path'].end_with?("/#{r}") }
        row['pc'] = recorder_pc_tag(sent[:pc_id])
      end
      result
    end

    teardown do
      next unless @game && captured.any?

      tags = crack_rows.select { |r| r['hash'].is_a?(Hash) && r['hash']['hashId'].is_a?(String) && !r['hash']['hashId'].empty? }
      assert_operator tags.size, :>=, 9, 'at least nine crack rows carry the hash tag'
      assert_equal crack_rows.size, tags.size, 'every crack row carries one'
      assert_nil AccessLeakScanner.tag_problem({ 'capture.jsonl' => captured }, :required)
      assert_nil AccessLeakScanner.tag_problem({ 'capture.jsonl' => captured }, :auto)
      assert_match(/recorder tags/, AccessLeakScanner.tag_problem({ 'capture.jsonl' => captured }, :absent))

      scanner = AccessLeakScanner.new(scenario, game: Game.find(@game.id))
      scanner.scan(captured.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }, tags: :required)
      assert_equal true, scanner.instance_variable_get(:@tags_on), 'a capture with the hash tag is a tagged run'
      assert_equal crack_rows.map { |r| r['hash']['hashId'] }, crack_rows.map { |r| scanner.send(:row_hash_tag, r) }
      assert_nil scanner.send(:row_pc_tag, crack_rows.first), 'a crack row carries no pc tag'

      mixed = Marshal.load(Marshal.dump(captured))
      mixed.find { |r| r['path'].end_with?('/crack') && r['method'] == 'POST' }.delete('hash')
      assert_match(/both with and without their tag key/, AccessLeakScanner.tag_problem({ 'capture.jsonl' => mixed }, :auto))
      assert_raises(ArgumentError) { scan_capture(mixed) }
      stripped = captured.map { |r| r.reject { |k, _| %w[hash pc].include?(k) } }
      assert_match(/no recorder tags/, AccessLeakScanner.tag_problem({ 'capture.jsonl' => stripped }, :required))
    end
  end
end
