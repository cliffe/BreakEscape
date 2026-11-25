# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../scripts/validate_realism_catalog'
require_relative '../../scripts/validate_realism_skin'

# Follow-up B4: the telltale word list gains honeypot, bogus, dummy, spoof, phony, harmless, benign.
class RealismTelltaleWordsTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)
  NEW_WORDS = %w[honeypot bogus dummy spoof phony harmless benign].freeze
  OLD_WORDS = ['decoy', 'fake', 'false', 'bait', 'patched', 'not\s+vulnerable'].freeze

  def rules(text, kind)
    RealismTextRules.check(text, kind: kind).map(&:rule)
  end

  test 'each new word is an error in prose, in any case' do
    NEW_WORDS.each do |w|
      assert_includes rules("The #{w} service", :prose), 'telltale', w
      assert_includes rules(w.upcase, :text), 'telltale', w
    end
  end

  test 'each new word joined by underscore or hyphen in a module, a script and an id' do
    NEW_WORDS.each do |w|
      assert_includes rules("auxiliary/scanner/#{w}-login", :module), 'telltale', w
      assert_includes rules("auxiliary/scanner/x_#{w}_y", :module), 'telltale', w
      assert_includes rules("check_#{w}", :script), 'telltale', w
      assert_includes rules("#{w}-check", :script), 'telltale', w
      assert_includes rules("svc_#{w}_01", :id), 'telltale', w
    end
  end

  test 'a longer word that merely contains a new word is not matched' do
    %w[dummying bogusly honeypots spoofing phonyx harmlessly benignly].each do |w|
      refute_includes rules("The #{w} service", :prose), 'telltale', w
      refute_includes rules("check_#{w}", :script), 'telltale', w
      refute_includes rules("svc_#{w}", :id), 'telltale', w
      refute_includes rules("scanner/#{w}", :module), 'telltale', w
    end
  end

  test 'the old words still match' do
    %w[decoy fake false bait patched].each { |w| assert_includes rules("a #{w} one", :prose), 'telltale', w }
    assert_includes rules('it is not  vulnerable', :prose), 'telltale'
  end

  test 'the committed catalog still has no error' do
    errs = check_realism_catalog.select { |p| p.level == :error }
    assert_empty errs.map { |p| [p.respond_to?(:rule) ? p.rule : nil, p.respond_to?(:field) ? p.field : nil] }
  end

  test 'the skin validator gives the same lines over each test_ops scenario as with the old list' do
    dirs = Dir[File.join(ROOT, 'scenarios/test_ops_*')].sort
    assert_equal 10, dirs.size
    dirs.each do |d|
      json = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(File.join(d, 'scenario.json.erb')), {}))
      now = check_realism_skin(json)
      old = with_list(OLD_WORDS) { check_realism_skin(json) }
      assert_equal old, now, File.basename(d)
    end
  end

  private

  def with_list(words)
    orig = RealismTextRules::TELLTALE
    RealismTextRules.send(:remove_const, :TELLTALE)
    RealismTextRules.const_set(:TELLTALE, words.freeze)
    yield
  ensure
    RealismTextRules.send(:remove_const, :TELLTALE) if RealismTextRules.const_defined?(:TELLTALE, false)
    RealismTextRules.const_set(:TELLTALE, orig)
  end
end
