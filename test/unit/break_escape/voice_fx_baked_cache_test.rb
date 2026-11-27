require 'test_helper'
require 'digest'

module BreakEscape
  # The cached clips of every speaker in tools/voice_fx/targets.json carry a baked
  # voice FX (tools/voice_fx/bake.py). The server tells the client by the sidecar's
  # voice_fx marker (TtsService.baked_voice_fx), so a clip without a current marker
  # would be served unmasked, and one with a stale marker would be masked twice.
  class VoiceFxBakedCacheTest < ActiveSupport::TestCase
    ROOT = Pathname.new(File.expand_path('../../..', __dir__))
    TARGETS = JSON.parse((ROOT / 'tools/voice_fx/targets.json').read).except('_comment')
    RECIPE = (ROOT / 'tools/voice_fx/bake.py').read[/^RECIPE = "([^"]+)"/, 1]

    def target_clips
      TARGETS.flat_map do |scenario, speakers|
        Dir[ROOT.join('tts_cache', scenario, '*.json')].sort.filter_map do |sidecar|
          data = JSON.parse(File.read(sidecar))
          next unless data.is_a?(Hash) && speakers.key?(data['npc'])

          [scenario, Pathname.new(sidecar), data, speakers[data['npc']]]
        end
      end
    end

    test "targets name existing scenario folders and voiced speakers" do
      assert RECIPE.present?
      TARGETS.each do |scenario, speakers|
        speakers.each_key do |npc|
          assert target_clips.any? { |s, _, d, _| s == scenario && d['npc'] == npc }, "#{scenario}/#{npc} has no cached clips"
        end
      end
    end

    test "every target clip is baked with the current recipe and its clean take is kept" do
      clips = target_clips
      assert_operator clips.size, :>=, 133
      clips.each do |scenario, sidecar, data, preset|
        mp3 = sidecar.sub_ext('.mp3')
        mark = data['voice_fx']
        where = "#{scenario}/#{mp3.basename}"
        assert mark.is_a?(Hash), "#{where}: no voice_fx marker (run tools/voice_fx/bake.py bake)"
        assert_equal preset, mark['preset'], where
        assert_equal RECIPE, mark['recipe'], "#{where}: stale recipe"
        assert_equal Digest::MD5.file(mp3).hexdigest, mark['baked_md5'], "#{where}: served clip is not the recorded bake"
        clean = sidecar.dirname / mark['clean']
        assert clean.file?, "#{where}: clean take #{mark['clean']} missing"
        assert_equal Digest::MD5.file(clean).hexdigest, mark['clean_md5'], "#{where}: clean take changed"
        assert_equal preset, TtsService.baked_voice_fx(mp3.to_s), "#{where}: the server would not send X-Voice-FX-Baked"
      end
    end

    test "clean takes sit in clean/, out of the sidecar globs the pruner and wasted check use" do
      TARGETS.each_key do |scenario|
        assert_empty Dir[ROOT.join('tts_cache', scenario, 'clean', '*.json')]
      end
    end
  end
end
