require 'test_helper'

# E0.4: CaptureModel.proof_satisfiable? (shared by both validators) and the shorthand proof's
# secret field. Pure functions of the authored scenario.
class CaptureProofSatisfiableTest < ActiveSupport::TestCase
  CM = BreakEscape::CaptureModel

  ITEMS = { 'kit' => { 'id' => 'kit', 'droppable' => true }, 'stick' => { 'id' => 'stick' } }.freeze
  DESK = { 'id' => 'desk', 'requiresItem' => 'kit', 'consumesItem' => true, 'triggerOnInteract' => [] }.freeze
  JACK = { 'id' => 'jack1', 'networkJack' => true }.freeze
  PC = { 'id' => 'pc1', 'lockType' => 'login' }.freeze

  def sat(proof, objects = [DESK, JACK, PC], holder = nil)
    CM.proof_satisfiable?(proof, ITEMS, objects, holder)
  end

  test 'planted on a consuming object, on a jack, or anywhere a jack or taker exists' do
    assert sat('planted' => 'kit', 'on' => 'desk')
    assert sat('planted' => 'stick', 'on' => 'jack1')
    assert sat('planted' => 'kit')
  end

  test 'planted fails for a missing item, a missing object, a non-consuming object' do
    refute sat('planted' => 'ghost')
    refute sat('planted' => 'kit', 'on' => 'nowhere')
    refute sat({ 'planted' => 'kit', 'on' => 'pc1' })
    refute sat({ 'planted' => 'kit' }, [PC])
    refute sat({ 'planted' => 'kit', 'on' => 'desk' }, [DESK.merge('triggerOnInteract' => nil)])
  end

  test 'dropped needs a droppable item, session needs a sign-in PC, a malformed proof fails' do
    assert sat('dropped' => 'kit')
    refute sat('dropped' => 'stick')
    assert sat('session' => 'pc1')
    refute sat('session' => 'desk')
    refute sat('bogus' => 1)
    refute sat(nil)
  end

  test 'the holder is optional and does not change the answer' do
    assert sat({ 'planted' => 'kit', 'on' => 'desk' }, [DESK], { 'id' => 'chris' })
    assert sat({ 'planted' => 'kit', 'on' => 'desk' }, [DESK], nil)
  end

  test 'a shorthand proof reports its secret and a holderless entry has no holder' do
    data = { 'rooms' => { 'r' => { 'npcs' => [
      { 'id' => 'hax', 'npcType' => 'phone', 'eventMappings' => [
        { 'eventPattern' => 'q', 'addCapture' => { 'targetId' => 'k', 'kind' => 'credential', 'secret' => 'abc-123',
                                                    'proof' => { 'planted' => 'kit' } } }
      ] }
    ] } } }
    entry = CM.shorthand_proofs(data).first
    assert_nil entry[:holder]
    assert_equal 'abc-123', entry[:secret]
  end
end
