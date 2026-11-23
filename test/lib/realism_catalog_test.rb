# frozen_string_literal: true

require 'test_helper'
require 'tmpdir'
require 'fileutils'
require 'logger'
require 'stringio'

# The realism catalog loader (OPS_CORE_PLAN.md section 5.3 and 11.1), on the test-only catalog under
# test/fixtures/realism_catalog/ (invented entries only).
module BreakEscape
  class RealismCatalogTest < ActiveSupport::TestCase
    FIXTURES = File.expand_path('../fixtures/realism_catalog', __dir__)
    Catalog = RealismCatalog

    def folder(name)
      File.join(FIXTURES, name)
    end

    # Runs the block with Rails.logger swapped for a string logger; returns the log text.
    def capture_log
      io = StringIO.new
      original = Rails.logger
      Rails.logger = Logger.new(io)
      yield
      io.string
    ensure
      Rails.logger = original
    end

    def warning_lines(log)
      log.lines.grep(/WARN/)
    end

    test 'lookup hit returns the entry and a miss returns nil' do
      Catalog.with_folder(folder('ok')) do
        entry = Catalog.lookup('test_share_guest')
        assert_equal 'example/placeholder/one', entry['module']
        assert_equal 'placeholder-guest', entry['script']
        assert_equal 'example/placeholder/three', Catalog.lookup('test_web_panel')['module']
        assert_nil Catalog.lookup('no_such_id')
        assert_empty Catalog.faults
      end
    end

    test 'the note key is kept in the entry for the builder to skip' do
      Catalog.with_folder(folder('ok')) do
        assert_includes Catalog.lookup('test_share_guest').keys, '_'
      end
    end

    test 'entries are deeply frozen' do
      Catalog.with_folder(folder('ok')) do
        entry = Catalog.lookup('test_share_guest')
        assert entry.frozen?
        assert entry['advisories'].frozen?
        assert entry['advisories'].first.frozen?
        assert entry['output'].frozen?
        assert_raises(FrozenError) { entry['title'] = 'changed' }
        assert_raises(FrozenError) { entry['advisories'] << 'x' }
      end
    end

    test 'files are read once, on first use' do
      Dir.mktmpdir do |dir|
        FileUtils.cp(Dir.glob(File.join(folder('ok'), '*.json')), dir)
        Catalog.with_folder(dir) do
          assert Catalog.lookup('test_web_panel')
          FileUtils.rm(File.join(dir, 'web.json'))
          File.write(File.join(dir, 'late.json'), '{ "entries": { "test_late": { "module": "example/placeholder/late" } } }')
          assert Catalog.lookup('test_web_panel'), 'second lookup must not re-read the folder'
          assert_nil Catalog.lookup('test_late')
        end
      end
    end

    test 'a missing folder is an empty map with no warning' do
      log = capture_log do
        Catalog.with_folder(File.join(FIXTURES, 'does_not_exist')) do
          assert_nil Catalog.lookup('test_share_guest')
          assert_empty Catalog.faults
        end
      end
      assert_empty warning_lines(log)
    end

    {
      'fault_parse' => ['broken.json', 'parse_error'],
      'fault_dup_id' => ['b.json', 'duplicate_id'],
      'fault_dup_module' => ['b.json', 'duplicate_module']
    }.each do |name, (file, kind)|
      test "#{name} loads an empty map with one warning and a fault entry" do
        log = capture_log do
          Catalog.with_folder(folder(name)) do
            assert_nil Catalog.lookup('test_same_id')
            assert_nil Catalog.lookup('test_web_panel')
            assert_nil Catalog.lookup('test_mod_one')
            assert_nil Catalog.lookup('test_mod_two')
            assert_equal [{ 'file' => file, 'fault' => kind }], Catalog.faults
            assert Catalog.faults.frozen?
          end
        end
        lines = warning_lines(log)
        assert_equal 1, lines.size
        assert_includes lines.first, file
        assert_includes lines.first, kind
        %w[Placeholder placeholder example/ test_].each { |text| refute_includes lines.first, text }
      end
    end

    test 'entry_ids lists the catalog ids sorted, and is empty for a missing folder and a failed load' do
      Catalog.with_folder(folder('ok')) do
        assert_equal %w[test_share_build test_share_guest test_web_panel], Catalog.entry_ids
        Catalog.entry_ids.clear
        assert_equal 3, Catalog.entry_ids.length, 'a new array each call'
      end
      Dir.mktmpdir { |dir| Catalog.with_folder(dir) { assert_equal [], Catalog.entry_ids } }
      capture_log { Catalog.with_folder(folder('fault_parse')) { assert_equal [], Catalog.entry_ids } }
    end

    test 'an entry that is not an object is a bad_shape fault and the map is empty' do
      Dir.mktmpdir do |dir|
        File.write(File.join(dir, 'bad.json'), JSON.generate('entries' => { 'good_one' => { 'title' => 'T' }, 'bad_one' => 'text' }))
        log = capture_log do
          Catalog.with_folder(dir) do
            assert_nil Catalog.lookup('good_one')
            assert_equal [{ 'file' => 'bad.json', 'fault' => 'bad_shape' }], Catalog.faults
          end
        end
        assert_equal 1, warning_lines(log).size
      end
    end

    test 'warn_unresolved warns once per link id, and not at all while the loader fault warning stands' do
      Catalog.reset_warned!
      log = capture_log do
        Catalog.with_folder(folder('ok')) do
          3.times { Catalog.warn_unresolved('nothing_here') }
          Catalog.warn_unresolved('nothing_else')
        end
      end
      assert_equal 2, warning_lines(log).size
      assert_equal 1, log.scan('nothing_here').length
      Catalog.reset_warned!
      log = capture_log do
        Catalog.with_folder(folder('fault_dup_id')) { 3.times { Catalog.warn_unresolved('nothing_here') } }
      end
      assert_equal 1, warning_lines(log).size, 'only the loader warning'
      refute_includes log, 'nothing_here'
    end

    test 'the warning is logged once however often the map is read' do
      log = capture_log do
        Catalog.with_folder(folder('fault_dup_id')) do
          3.times { Catalog.lookup('test_same_id') }
          Catalog.faults
        end
      end
      assert_equal 1, warning_lines(log).size
    end

    test 'with_folder restores the previous state' do
      Catalog.with_folder(folder('ok')) do
        assert Catalog.lookup('test_share_guest')
        Catalog.with_folder(folder('fault_dup_id')) do
          capture_log { assert_nil Catalog.lookup('test_share_guest') }
        end
        assert Catalog.lookup('test_share_guest')
        assert_empty Catalog.faults
      end
    end

    test 'with_folder restores after the block raises' do
      Catalog.with_folder(folder('ok')) do
        assert_raises(RuntimeError) { Catalog.with_folder(folder('fault_parse')) { raise 'boom' } }
        assert Catalog.lookup('test_share_guest')
      end
    end

    test 'nothing raises on odd input' do
      Catalog.with_folder(folder('ok')) do
        [nil, 3, :sym, [], {}, '', 'x' * 10_000, "a\u0000b"].each do |input|
          assert_nil Catalog.lookup(input)
        end
      end
      Dir.mktmpdir do |dir|
        File.write(File.join(dir, 'shape.json'), '[1, 2]')
        File.binwrite(File.join(dir, 'bin.json'), "\xff\xfe\x00")
        capture_log do
          Catalog.with_folder(dir) do
            assert_nil Catalog.lookup('anything')
            refute_empty Catalog.faults
          end
        end
      end
      capture_log { Catalog.with_folder(nil) { assert_nil Catalog.lookup('x') } }
    end

    test 'no route names a catalog path' do
      routes = File.read(File.expand_path('../../config/routes.rb', __dir__))
      refute_match(/realism_catalog/, routes)
    end
  end
end
