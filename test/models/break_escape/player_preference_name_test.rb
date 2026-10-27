require 'test_helper'

module BreakEscape
  class PlayerPreferenceNameTest < ActiveSupport::TestCase
    test 'sanitise_name turns hyphens and dots into underscores' do
      assert_equal 'wave1_p10', PlayerPreference.sanitise_name('wave1-p10')
      assert_equal 'a_b_c', PlayerPreference.sanitise_name('a.b-c')
    end

    test 'sanitise_name drops other disallowed characters' do
      assert_equal 'AB', PlayerPreference.sanitise_name('A&B')
    end

    test 'sanitise_name truncates to 20 characters' do
      assert_equal 20, PlayerPreference.sanitise_name('a' * 25).length
    end

    test 'sanitise_name falls back to Zero when nothing is left' do
      assert_equal 'Zero', PlayerPreference.sanitise_name('&&&')
      assert_equal 'Zero', PlayerPreference.sanitise_name('')
      assert_equal 'Zero', PlayerPreference.sanitise_name(nil)
    end

    test 'sanitise_name keeps valid names, including deleted<id>' do
      assert_equal 'deleted123', PlayerPreference.sanitise_name('deleted123')
      assert_equal 'Agent 99_x', PlayerPreference.sanitise_name('Agent 99_x')
    end

    test 'every sanitised handle passes the validation' do
      ['wave1-p10', 'a.b&c-d', 'x' * 25, '-', 'A-B_C.D E&F-0123456789-xyz'].each do |handle|
        assert_match(/\A[a-zA-Z0-9_ ]{1,20}\z/, PlayerPreference.sanitise_name(handle), handle)
      end
    end

    test 'a new preference seeded from a hyphenated handle saves' do
      player = Struct.new(:handle).new('wave1-p10')
      pref = PlayerPreference.new(in_game_name: '')
      pref.define_singleton_method(:player) { player }
      pref.send(:set_defaults)
      assert_equal 'wave1_p10', pref.in_game_name
    end
  end
end
