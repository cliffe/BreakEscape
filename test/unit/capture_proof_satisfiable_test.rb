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

  test 'a planted proof with no on is not met by a jack alone (the server reads plantedItems only)' do
    refute sat({ 'planted' => 'stick' }, [JACK])
    refute sat({ 'planted' => 'kit' }, [JACK, PC])
    assert sat({ 'planted' => 'stick', 'on' => 'jack1' }, [JACK])
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

  def served(data)
    CM.served_capture_writers(data)
  end

  def served_data(npcs, reveal: true)
    d = { 'rooms' => { 'r' => { 'npcs' => npcs } } }
    d['social'] = { 'captures' => { 'revealSecret' => true } } if reveal
    d
  end

  def writer(npc_id, target, secret, **extra)
    { 'id' => npc_id, 'npcType' => 'phone', 'eventMappings' => [
      { 'eventPattern' => 'q', 'addCapture' => { 'targetId' => target, 'kind' => 'credential', 'secret' => secret }.merge(extra) }
    ] }
  end

  test 'served_capture_writers lists the first eligible writer per target when revealSecret is on' do
    data = served_data([writer('a', 't', 'one-secret'), writer('b', 't', 'two-secret'), writer('c', 'u', 'three-secret')])
    assert_equal %w[one-secret three-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers is empty when revealSecret is off' do
    assert_empty served(served_data([writer('a', 't', 'one-secret')], reveal: false))
  end

  test 'served_capture_writers skips a holder-owned writer and an account-addressed one' do
    holder = writer('h', 't', 'one-secret').merge('creds' => { 'username' => 'Hal', 'password' => 'p' })
    addressed = writer('b', 't', 'two-secret', 'address' => ' hal ')
    data = served_data([holder, addressed, writer('c', 't', 'three-secret')])
    assert_equal %w[three-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers skips an action writer owned by a holder and a writer with no secret' do
    holder = { 'id' => 'h', 'creds' => { 'username' => 'hal' }, 'eventMappings' => [
      { 'eventPattern' => 'q', 'actions' => [{ 'type' => 'add_capture', 'capture' => { 'targetId' => 't', 'secret' => 'zz-secret' } }] }
    ] }
    data = served_data([holder, writer('b', 't', ''), writer('c', 't', 'real-secret')])
    assert_equal %w[real-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers skips a whitespace-only targetId, as the server declares no such id' do
    assert_empty served(served_data([writer('a', '  ', 'one-secret')]))
    assert_equal %w[one-secret], served(served_data([writer('a', 't', 'one-secret')])).map { |c| c['secret'] }
  end

  test 'served_capture_writers skips a foothold writer, which the server never serves' do
    assert_empty served(served_data([writer('a', 't', 'one-secret', 'kind' => 'foothold')]))
    # The first writer still owns the id's authored secret, but a credential entry earned through
    # the second writer reaches it
    data = served_data([writer('a', 't', 'one-secret', 'kind' => 'foothold'), writer('b', 't', 'two-secret')])
    assert_equal %w[one-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers skips a phish target when exactly one landing page carries a secret' do
    data = served_data([writer('a', 'receptionist', 'one-secret'), writer('b', 'other', 'two-secret')])
    data['social']['phishTargets'] = [{ 'id' => 'receptionist' }]
    data['social']['landingPages'] = [{ 'id' => 'p', 'capture' => { 'address' => 'x.example', 'secret' => 'page-secret' } }]
    assert_equal %w[two-secret], served(data).map { |c| c['secret'] }
    # Two landing page secrets: the single-secret fallback is off, so the writer is served
    data['social']['landingPages'] << { 'id' => 'q', 'capture' => { 'address' => 'y.example', 'secret' => 'page-two' } }
    assert_equal %w[one-secret two-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers reads landingPages as an Array only, as the server does' do
    data = served_data([writer('a', 't', 'one-secret', 'address' => 'phish.example')])
    data['social']['landingPages'] = { 'p' => { 'id' => 'p', 'capture' => { 'address' => 'phish.example', 'secret' => 'page-secret' } } }
    assert_equal %w[one-secret], served(data).map { |c| c['secret'] }
  end

  test 'served_capture_writers judges the landing address on the earning writer, not only the first' do
    data = served_data([writer('a', 't', 'one-secret', 'address' => 'phish.example'), writer('b', 't', 'two-secret')])
    data['social']['landingPages'] = [{ 'id' => 'p', 'capture' => { 'address' => 'phish.example', 'secret' => 'page-secret' } }]
    # An entry earned through b has no landing address, so it is served the first writer's secret
    assert_equal %w[one-secret], served(data).map { |c| c['secret'] }
  end

  test 'top_level_room_objects skips objects nested in contents or held by an NPC' do
    data = { 'rooms' => { 'r' => { 'objects' => [
      { 'id' => 'box', 'contents' => [{ 'id' => 'inner' }] }, { 'id' => 'lap' }
    ], 'npcs' => [{ 'id' => 'n', 'itemsHeld' => [{ 'id' => 'held' }] }] } } }
    assert_equal %w[box lap], CM.top_level_room_objects(data).map { |o| o['id'] }
  end

  test 'a plant on an object that is not top level is not satisfiable once only top-level objects are passed' do
    nested = { 'id' => 'lap', 'requiresItem' => 'kit', 'consumesItem' => true, 'triggerOnInteract' => [] }
    data = { 'rooms' => { 'r' => { 'objects' => [{ 'id' => 'locker', 'contents' => [nested] }] } } }
    refute sat({ 'planted' => 'kit', 'on' => 'lap' }, CM.top_level_room_objects(data))
    refute sat({ 'planted' => 'kit' }, CM.top_level_room_objects(data))
  end

  test 'served_capture_writers skips a lone writer whose address is a landing page capture address' do
    data = served_data([writer('a', 't', 'one-secret', 'address' => 'phish.example'),
                        writer('b', 't', 'two-secret', 'address' => 'phish.example'),
                        writer('c', 'u', 'three-secret', 'address' => 'other.example')])
    data['social']['landingPages'] = [{ 'id' => 'p', 'capture' => { 'address' => 'phish.example', 'secret' => 'page-secret' } }]
    assert_equal %w[three-secret], served(data).map { |c| c['secret'] }
  end

  test 'a session proof names a sign-in PC inside a plain container, as the server signs in on it' do
    data = { 'rooms' => { 'r' => { 'objects' => [{ 'id' => 'desk', 'contents' => [PC.dup] }] } } }
    ids = CM.sign_in_pc_ids(data)
    assert_equal %w[pc1], ids
    assert CM.proof_satisfiable?({ 'session' => 'pc1' }, ITEMS, CM.top_level_room_objects(data), nil, sign_in_pc_ids: ids)
    refute CM.proof_satisfiable?({ 'session' => 'pc1' }, ITEMS, CM.top_level_room_objects(data), nil)
  end

  test 'a session proof does not accept a PC nested in another sign-in PC or held by an NPC' do
    data = { 'rooms' => { 'r' => { 'objects' => [
      { 'id' => 'outer', 'lockType' => 'login', 'contents' => [{ 'id' => 'inner', 'lockType' => 'login' }] }
    ], 'npcs' => [{ 'id' => 'n', 'itemsHeld' => [{ 'id' => 'held', 'lockType' => 'login' }] }] } } }
    ids = CM.sign_in_pc_ids(data)
    assert_equal %w[outer], ids
    refute CM.proof_satisfiable?({ 'session' => 'inner' }, ITEMS, CM.top_level_room_objects(data), nil, sign_in_pc_ids: ids)
    refute CM.proof_satisfiable?({ 'session' => 'held' }, ITEMS, CM.top_level_room_objects(data), nil, sign_in_pc_ids: ids)
    assert CM.proof_satisfiable?({ 'session' => 'outer' }, ITEMS, CM.top_level_room_objects(data), nil, sign_in_pc_ids: ids)
  end

  test 'a plant on a jack nested in a container is satisfiable, as the server records it as a foothold' do
    data = { 'rooms' => { 'r' => { 'objects' => [{ 'id' => 'rack', 'contents' => [JACK.dup] }] } } }
    jacks = CM.reachable_jack_ids(data)
    assert_equal %w[jack1], jacks
    assert CM.proof_satisfiable?({ 'planted' => 'stick', 'on' => 'jack1' }, ITEMS, CM.top_level_room_objects(data), nil, jack_ids: jacks)
    refute CM.proof_satisfiable?({ 'planted' => 'stick', 'on' => 'jack1' }, ITEMS, CM.top_level_room_objects(data), nil)
  end
end
