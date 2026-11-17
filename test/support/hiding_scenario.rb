# A hand-written scenario for the plant-hiding tests (docs/achitechture/PLANT_HIDING_PLAN.md,
# section 11). The kit is a start item (in the shape of test_access_devices); reception has two
# scenario plants and one non-plant, the console object is declared with hiddenWith.
module HidingScenario
  KIT = { 'type' => 'rogue_ap', 'sprite' => 'rogue_ap', 'id' => 'kit_rogue_ap', 'name' => 'Pocket rogue AP',
          'takeable' => true, 'droppable' => false,
          'hideable' => {
            'rooms' => ['reception'], 'spots' => 'plants', 'exclude' => ['reception_plant-large13_34'],
            'device' => 'planted_rogue_ap',
            'overlay' => { 'sprite' => 'rogue_ap_tucked', 'at' => { 'x' => 50, 'y' => 55 } },
            'onHidden' => [{ 'type' => 'set_global', 'key' => 'ap_planted', 'value' => true }]
          } }.freeze

  def hiding_scenario(kit: KIT, extra_objects: [])
    {
      'scenario_brief' => 'Plant hiding fixture',
      'startRoom' => 'reception',
      'social' => { 'captures' => { 'revealSecret' => true } },
      'startItemsInInventory' => [kit.deep_dup],
      'rooms' => {
        'reception' => {
          'type' => 'room_reception', 'connections' => { 'north' => 'comms' },
          'objects' => [
            { 'id' => 'pot_a', 'type' => 'plant', 'sprite' => 'planter_fig1', 'name' => 'Pot A' },
            { 'id' => 'pot_b', 'type' => 'plant', 'sprite' => 'plant-large12', 'name' => 'Pot B', 'hidingSpot' => false },
            { 'id' => 'bin_a', 'type' => 'bin', 'sprite' => 'bin1', 'name' => 'Bin', 'hidingSpot' => true },
            { 'id' => 'desk_a', 'type' => 'table', 'sprite' => 'desk1', 'name' => 'Desk' },
            { 'id' => 'swap_pot', 'type' => 'plant', 'sprite' => 'plant-large11', 'name' => 'Swap pot',
              'spriteVariants' => [{ 'condition' => 'globalVars.x', 'value' => 'desk1' }] },
            { 'id' => 'planted_rogue_ap', 'type' => 'pc', 'sprite' => 'rogue_ap_planted', 'name' => 'Planted rogue AP',
              'hiddenWith' => 'kit_rogue_ap', 'wifiTwin' => true,
              'apScan' => [{ 'ssid' => 'Ledgerwell-Staff', 'inScope' => true }] }
          ] + extra_objects
        },
        'comms' => {
          'type' => 'room_servers', 'connections' => { 'south' => 'reception' },
          'objects' => [{ 'id' => 'comms_pot', 'type' => 'plant', 'sprite' => 'plant-large13', 'name' => 'Comms pot' }]
        }
      }
    }
  end

  def kit_entry(top_id: 'kit_rogue_ap')
    { 'type' => 'rogue_ap', 'id' => top_id, 'name' => 'Pocket rogue AP',
      'scenarioData' => KIT.slice('type', 'id', 'name', 'takeable', 'droppable') }
  end
end
