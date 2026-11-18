# How many flags each VM needs, read from a scenario template's source (no ERB
# rendering). Scenarios reference flags in three spellings:
#   "vm:flag_N"                      submit_flags text (m01)
#   "station:vm-flagN"               targetFlags (m01-m09, written out)
#   flags_for_vm('vm', ...)          a helper call naming the VM (at least 1)
# m10 builds all of those by interpolation from a table, so none appears
# literally. It declares each VM once, as `'vm' => ['flag{..}', ...]`, and the
# number of entries is the flag count.
module FlagNeeds
  module_function

  def from_source(src)
    needs = Hash.new(0)
    src.scan(/"([a-z0-9_]+):flag_(\d+)"/i) { |vm, n| needs[vm] = [needs[vm], n.to_i].max }
    src.scan(/"[a-z0-9_]+:([a-z0-9_]+)-flag(\d+)"/i) { |vm, n| needs[vm] = [needs[vm], n.to_i].max }
    src.scan(/(?:flags_for_vm|vm_flags_json)\(\s*'([^']+)'/) { |(vm)| needs[vm] = [needs[vm], 1].max }
    # Table form: `'vm' => ['flag{...}', 'flag{...}']`, one entry per flag.
    src.scan(/^\s*'([a-z0-9_]+)'\s*=>\s*\[([^\]]*)\]/i) do |vm, list|
      count = list.scan(/'flag\{/).size
      needs[vm] = [needs[vm], count].max if count.positive?
    end
    needs
  end
end
