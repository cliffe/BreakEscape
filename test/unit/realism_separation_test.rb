# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../scripts/validate_realism_skin'

# Stage S6 unit 23: real identifiers live only in the realism catalog. No file in the folder of a scenario
# that declares `services`, and no file of the generated catalog index, holds an advisory id, a framework
# module path or a vulnerability nickname (the default `auxiliary/scanner/<word>/<class>_f<n>` form is
# the one exemption), and nothing under public/ or app/assets/ holds a catalog entry's module.
class RealismSeparationTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)
  DEFAULT_FORM = %r{\Aauxiliary/scanner/[a-z0-9_]+/[a-z_]+_f\d+\z}.freeze
  TEXT_EXTENSIONS = %w[.json .erb .md .html .ink .js .txt].freeze

  def nick_patterns
    realism_skin_nickname_patterns(realism_word_list(REALISM_NICKNAMES_PATH))
  end

  def readable(path)
    text = File.binread(path).force_encoding('UTF-8')
    text.valid_encoding? ? text : nil
  end

  def real_fragments(text)
    realism_skin_real_ids(text, nick_patterns).reject { |frag| frag =~ DEFAULT_FORM }
  end

  def services_scenarios
    Dir.glob(File.join(ROOT, 'scenarios/*/scenario.json.erb')).select { |file| File.read(file).include?('"services"') }
       .map { |file| File.dirname(file) }.sort
  end

  test 'at least the ops scenarios are found by their services key' do
    names = services_scenarios.map { |dir| File.basename(dir) }
    assert_includes names, 'test_ops_skin'
    assert_includes names, 'test_ops_scan'
  end

  test 'no file in a scenario folder that declares services holds an advisory id, framework path or nickname' do
    problems = []
    services_scenarios.each do |dir|
      Dir.glob(File.join(dir, '**/*')).select { |f| File.file?(f) && TEXT_EXTENSIONS.include?(File.extname(f)) }.each do |file|
        text = readable(file)
        next unless text

        real_fragments(text).each { |frag| problems << "#{file.delete_prefix("#{ROOT}/")}: #{frag.length > 40 ? "#{frag[0, 40]}..." : frag}" }
      end
    end
    assert_empty problems
  end

  test 'the catalog index is clean the same way' do
    index = File.join(ROOT, 'docs/REALISM_CATALOG_INDEX.md')
    assert_equal [], real_fragments(File.read(index))
  end

  test 'the scan sees what it is meant to see (a made-up advisory id, a path and a nickname)' do
    assert_not_empty real_fragments('see cve-9999-0001 here')
    assert_not_empty real_fragments('uses exploit/spare/world/probe')
    assert_not_empty real_fragments("the #{File.readlines(REALISM_NICKNAMES_PATH).reject { |l| l.start_with?('#') || l.strip.empty? }.first.strip.tr('_', ' ')} issue")
    assert_empty real_fragments('auxiliary/scanner/storage/unpatched_f1')
  end

  test 'no file under public/ or app/assets/ holds a catalog entry module' do
    modules = BreakEscape::RealismCatalog.entry_ids.filter_map { |id| BreakEscape::RealismCatalog.lookup(id)['module'] }
    assert_operator modules.length, :>=, 3
    problems = []
    %w[public app/assets].each do |folder|
      Dir.glob(File.join(ROOT, folder, '**/*')).select { |f| File.file?(f) }.each do |file|
        next if File.size(file) > 8_000_000

        text = readable(file)
        next unless text

        modules.each { |mod| problems << file.delete_prefix("#{ROOT}/") if text.include?(mod) }
      end
    end
    assert_empty problems.uniq
  end
end
