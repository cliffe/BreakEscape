# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require 'json-schema'

# Physical pentest A1 (E0.6, review R2 t1): pins the apScan row anyOf in scripts/scenario-schema.json.
# An out-of-scope row needs a refusal, an in-scope row (inScope true or absent) needs a cloneLog.
class ScenarioSchemaApScanTest < Minitest::Test
  SCHEMA_PATH = File.expand_path('../../scripts/scenario-schema.json', __dir__)

  def row_schema
    found = nil
    walk = lambda do |node|
      case node
      when Hash
        found ||= node['apScan']['items'] if node['apScan'].is_a?(Hash) && node['apScan']['items']
        node.each_value { |v| walk.call(v) }
      when Array
        node.each { |v| walk.call(v) }
      end
    end
    walk.call(JSON.parse(File.read(SCHEMA_PATH)))
    found
  end

  def valid?(row)
    JSON::Validator.fully_validate(row_schema, row).empty?
  end

  def test_the_row_schema_is_found
    refute_nil row_schema
  end

  def test_out_of_scope_row_without_refusal_is_rejected
    refute valid?('ssid' => 'Corrigan-Dental', 'inScope' => false)
  end

  def test_out_of_scope_row_with_refusal_is_accepted
    assert valid?('ssid' => 'Corrigan-Dental', 'inScope' => false, 'refusal' => 'Out of scope.')
  end

  def test_in_scope_row_without_clone_log_is_rejected
    refute valid?('ssid' => 'Ledgerwell-Staff', 'inScope' => true)
  end

  def test_row_with_no_inscope_and_no_clone_log_is_rejected
    refute valid?('ssid' => 'Ledgerwell-Staff')
  end

  def test_in_scope_row_with_clone_log_is_accepted
    assert valid?('ssid' => 'Ledgerwell-Staff', 'inScope' => true, 'cloneLog' => 'Copy up.')
    assert valid?('ssid' => 'Ledgerwell-Staff', 'cloneLog' => { 'wifi_key' => 'Copy up.' })
  end
end
