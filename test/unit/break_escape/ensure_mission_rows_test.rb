# frozen_string_literal: true

require 'test_helper'
require 'tmpdir'
require 'fileutils'
require 'stringio'

ENV['ENSURE_MISSION_ROWS_NO_AUTORUN'] = '1'
load BreakEscape::Engine.root.join('tools/playtest/ensure-mission-rows.rb').to_s

module BreakEscape
  # Test database only (the Rails test environment). Uses a temp scenarios folder.
  class EnsureMissionRowsTest < ActiveSupport::TestCase
    setup do
      @root = Pathname.new(Dir.mktmpdir('emr'))
      @bystander = Mission.create!(name: 'emr_bystander', display_name: 'Bystander', difficulty_level: 2, published: true)
      make('emr_a', { display_name: 'A', collection: 'test_scenarios' })
      make('emr_b', { display_name: 'B', collection: 'test_scenarios' })
    end

    teardown do
      FileUtils.remove_entry(@root)
      Mission.where(name: %w[emr_a emr_b emr_bystander]).destroy_all
    end

    def make(name, meta = {}, opts = {})
      erb = opts.fetch(:erb, '{"startRoom":"r","rooms":{}}')
      mission_json = opts[:mission_json]
      d = @root.join(name)
      FileUtils.mkdir_p(d)
      File.write(d.join('scenario.json.erb'), erb) if erb
      File.write(d.join('mission.json'), mission_json || JSON.generate({ 'description' => 'd', 'difficulty_level' => 2 }.merge(meta.transform_keys(&:to_s))))
    end

    def go(names, apply: false)
      out = StringIO.new
      [EnsureMissionRows.run(names: names, apply: apply, out: out, root: @root), out.string]
    end

    test 'dry run writes nothing' do
      before = Mission.count
      result, text = go(%w[emr_a emr_b])
      assert_equal before, Mission.count
      assert_match(/would CREATE: emr_a/, text)
      assert_empty result.written
    end

    test 'apply creates only the named rows and leaves others alone' do
      snap = @bystander.reload.attributes
      result, = go(%w[emr_a emr_b], apply: true)
      assert_equal 2, result.written.size
      a = Mission.find_by!(name: 'emr_a')
      assert_equal 'A', a.display_name
      assert_equal 'test_scenarios', a.collection
      assert a.published
      assert_equal snap, @bystander.reload.attributes
    end

    test 'apply twice changes nothing the second time and deletes nothing' do
      go(%w[emr_a], apply: true)
      stamp = Mission.find_by!(name: 'emr_a').updated_at
      result, text = go(%w[emr_a], apply: true)
      assert_empty result.written
      assert_match(/SAME: emr_a/, text)
      assert_equal stamp, Mission.find_by!(name: 'emr_a').updated_at
      assert Mission.exists?(name: 'emr_bystander')
    end

    test 'updates an existing named row from mission.json' do
      Mission.create!(name: 'emr_a', display_name: 'Old', difficulty_level: 5, published: false)
      go(%w[emr_a], apply: true)
      a = Mission.find_by!(name: 'emr_a')
      assert_equal 'A', a.display_name
      assert_equal 2, a.difficulty_level
      assert a.published
    end

    test 'a bad folder stops the run before any write' do
      FileUtils.rm_f(@root.join('emr_b', 'scenario.json.erb'))
      before = Mission.count
      result, text = go(%w[emr_a emr_b], apply: true)
      assert_equal before, Mission.count
      assert_equal 1, result.errors.size
      assert_match(/emr_b: no scenario.json.erb/, text)
    end

    test 'invalid mission.json and a missing folder are reported' do
      make('emr_b', {}, mission_json: '{nope')
      result, = go(%w[emr_b emr_missing emr_a], apply: true)
      assert_equal 2, result.errors.size
      assert_nil Mission.find_by(name: 'emr_a')
    end

    test 'a path-like name is refused' do
      result, = go(['../etc'], apply: true)
      assert_equal 1, result.errors.size
    end

    test 'aborts and rolls back if another row changes during the run' do
      orig = BreakEscape::CybokSyncService.method(:sync_for_mission)
      make('emr_a', { display_name: 'A', cybok: [{ 'ka' => 'X', 'topic' => 'Y', 'keywords' => [] }] })
      bystander = @bystander
      BreakEscape::CybokSyncService.define_singleton_method(:sync_for_mission) do |*|
        bystander.update_columns(display_name: 'Tampered')
        0
      end
      begin
        assert_raises(RuntimeError) { go(%w[emr_a], apply: true) }
      ensure
        BreakEscape::CybokSyncService.define_singleton_method(:sync_for_mission, orig)
      end
      assert_nil Mission.find_by(name: 'emr_a')
      assert_equal 'Bystander', @bystander.reload.display_name
    end
  end
end
