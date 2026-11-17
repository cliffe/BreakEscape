require 'test_helper'

module BreakEscape
  # The one ERB binding every renderer uses (plan step 5). The server's behaviour is the truth:
  # vm_flags_json returns a Hash, '{}' when a context names no flags for the VM, and the fallback
  # array only with no context at all. json(value) makes any authored value safe to paste into
  # JSON text. Mission::ScenarioBinding is an alias of this class, so the old readers keep working.
  class ScenarioBindingTest < ActiveSupport::TestCase
    def test_mission_alias_is_the_lib_class
      assert_same BreakEscape::ScenarioBinding, BreakEscape::Mission::ScenarioBinding
    end

    def test_vm_object_standalone_uses_fallback
      b = ScenarioBinding.new({})
      assert_equal({ 'id' => 1, 'title' => 'kali', 'ip' => '10.0.0.1' },
                   JSON.parse(b.vm_object('kali', { 'id' => 1, 'title' => 'kali', 'ip' => '10.0.0.1' })))
    end

    def test_vm_object_overrides_ip_from_vm_ips
      b = ScenarioBinding.new('vm_ips' => { 'kali' => '192.168.5.9' })
      assert_equal '192.168.5.9', JSON.parse(b.vm_object('kali', { 'ip' => '10.0.0.1' }))['ip']
    end

    def test_vm_object_hacktivity_mode_returns_vm
      b = ScenarioBinding.new('hacktivity_mode' => true,
                              'vms' => [{ 'title' => 'kali', 'ip' => '172.16.0.4' }])
      assert_equal({ 'title' => 'kali', 'ip' => '172.16.0.4' }, JSON.parse(b.vm_object('kali', {})))
    end

    def test_flags_for_vm
      assert_equal ['f1', 'f2'], JSON.parse(ScenarioBinding.new({}).flags_for_vm('desktop', ['f1', 'f2']))
      withctx = ScenarioBinding.new('flags_by_vm' => { 'desktop' => ['real1'] })
      assert_equal ['real1'], JSON.parse(withctx.flags_for_vm('desktop', ['f1']))
    end

    def test_flags_for_vm_slice
      b = ScenarioBinding.new('flags_by_vm' => { 'desktop' => %w[a b c d] })
      assert_equal %w[a b c], JSON.parse(b.flags_for_vm_slice('desktop', 0, 3, []))
      assert_equal %w[d], JSON.parse(b.flags_for_vm_slice('desktop', 3, 1, []))
      # No context: the fallback.
      assert_equal %w[x], JSON.parse(ScenarioBinding.new({}).flags_for_vm_slice('desktop', 0, 1, %w[x]))
    end

    def test_vm_flags_json_without_context_uses_fallback_as_hash
      b = ScenarioBinding.new({})
      assert_equal({ 'flag_1' => 'f1', 'flag_2' => 'f2' }, JSON.parse(b.vm_flags_json('lab', ['f1', 'f2'])))
    end

    def test_vm_flags_json_with_context
      b = ScenarioBinding.new('flags_by_vm' => { 'lab' => %w[real1 real2] })
      assert_equal({ 'flag_1' => 'real1', 'flag_2' => 'real2' }, JSON.parse(b.vm_flags_json('lab', ['x'])))
    end

    def test_vm_flags_json_context_without_this_vm_is_empty_object
      # A context present but naming no flags for this VM returns '{}', not the static fallback,
      # so a wrong VM key surfaces as empty rather than validating against placeholders.
      b = ScenarioBinding.new('flags_by_vm' => { 'other' => ['x'] })
      assert_equal '{}', b.vm_flags_json('lab', ['f1'])
    end

    def test_json_helper_escapes
      b = ScenarioBinding.new({})
      assert_equal '"he said \"hi\""', b.json('he said "hi"')
      assert_equal '"a\\\\b"', b.json('a\\b')
      assert_equal '"café"', b.json('café')
      assert_equal '"line1\nline2"', b.json("line1\nline2")
      assert_equal '42', b.json(42)
      assert_equal 'null', b.json(nil)
    end

    def test_render_returns_rendered_string
      out = ScenarioBinding.render('{ "x": <%= json("a") %>, "n": <%= 1 + 1 %> }')
      assert_equal({ 'x' => 'a', 'n' => 2 }, JSON.parse(out))
    end

    def test_render_builds_binding_after_a_caller_seed
      # The binding is built inside render, so a seed set immediately before is honoured for the
      # pin draw. Same seed, same pin; the password and code come from SecureRandom (unseeded).
      srand(1234)
      first = JSON.parse(ScenarioBinding.render('{ "pin": <%= json(random_pin) %> }'))['pin']
      srand(1234)
      second = JSON.parse(ScenarioBinding.render('{ "pin": <%= json(random_pin) %> }'))['pin']
      assert_equal first, second
    end
  end
end
