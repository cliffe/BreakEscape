# frozen_string_literal: true

require 'fileutils'
require 'json'
require 'logger'
require 'stringio'
require 'tmpdir'

# Test catalog folders for the realism link tests (S6 unit 23). They are built from the loader's own
# entries (RealismCatalog.lookup), never by reading the catalog file, and every extra entry is made up
# from one of them with an invented module word.
module RealismCatalogFolder
  LINKED = %w[filehold_update_lag filehold_release_line filehold_link_setting].freeze
  UNLINKED_ID = 'spare_unlinked_entry'
  UNLINKED_MODULE = 'auxiliary/scanner/spare/probe_f9'
  UNLINKED_TITLE = 'Spare unlinked entry title'

  def default_entry(id)
    BreakEscape::RealismCatalog.lookup(id) || raise("no catalog entry #{id}")
  end

  def unlinked_entry
    default_entry(LINKED.first).merge('title' => UNLINKED_TITLE, 'module' => UNLINKED_MODULE, 'script' => 'spare_probe')
  end

  def write_entries(dir, name, entries)
    File.write(File.join(dir, name), JSON.generate('entries' => entries))
  end

  # Runs the block with a temporary catalog folder: the linked entries (except `without`), plus an
  # unlinked one when asked, plus whatever `files` adds ({ file name => entries Hash }).
  def with_test_catalog(without: [], unlinked: false, files: {})
    entries = LINKED.reject { |id| without.include?(id) }.to_h { |id| [id, default_entry(id)] }
    entries[UNLINKED_ID] = unlinked_entry if unlinked
    Dir.mktmpdir('realism_catalog_test') do |dir|
      write_entries(dir, 'test_entries.json', entries)
      files.each { |name, list| write_entries(dir, name, list) }
      BreakEscape::RealismCatalog.with_folder(dir) do
        BreakEscape::RealismCatalog.reset_warned!
        yield dir
      end
    end
  end

  # Server warnings (Rails.logger.warn) logged by the block, as an Array of Strings.
  def captured_warnings
    io = StringIO.new
    saved = Rails.logger
    Rails.logger = Logger.new(io)
    yield
    io.string.lines.map(&:chomp).select { |l| l.include?('WARN') }
  ensure
    Rails.logger = saved
  end
end
