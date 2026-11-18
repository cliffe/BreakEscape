# frozen_string_literal: true

# A stand-in for the host's VmSet / FlagService / Flag, for tests of the D144 VM set gate.
# The dummy app defines none of them (and games_controller_test asserts that), so each test
# that needs Hacktivity mode installs these for its own run and removes them in teardown.
module FakeHacktivityVm
  Event = Struct.new(:id)
  Batch = Struct.new(:id, :event)

  # A team whose member ids are given
  class FakeTeam
    def initialize(ids)
      @ids = ids
    end

    def users
      self
    end

    def exists?(id)
      @ids.include?(id)
    end
  end

  # A VM whose flags are given
  class FlagVm
    Flag = Struct.new(:flag_key)
    attr_reader :flags, :title, :console_calls

    def initialize(keys, title = 'kali')
      @flags = keys.map { |k| Flag.new(k) }
      @title = title
      @console_calls = 0
    end

    def apply_default_console!
      @console_calls += 1
      true
    end
  end

  class FlagVms
    def initialize(list)
      @list = list
    end

    def find_by(title:)
      @list.find { |v| v.respond_to?(:title) && v.title == title }
    end

    def first
      @list.first
    end

    def find(&blk)
      @list.find(&blk)
    end
  end

  class FakeVm
    attr_reader :title, :console_calls

    def initialize(title)
      @title = title
      @console_calls = 0
    end

    def apply_default_console!
      @console_calls += 1
      true
    end
  end

  class FakeVmCollection
    def initialize(vms)
      @vms = vms
    end

    def find_by(title:)
      @vms.find { |v| v.title == title }
    end

    def first
      @vms.first
    end
  end

  class FakeSet
    attr_accessor :id, :user_id, :relinquished, :build_status, :team, :sec_gen_batch, :vms, :activated, :activated_until

    def initialize(id:, user_id:, relinquished: false, build_status: 'built')
      @id = id
      @user_id = user_id
      @relinquished = relinquished
      @build_status = build_status
      @sec_gen_batch = Batch.new(5, Event.new(7))
      @vms = FakeVmCollection.new([FakeVm.new('kali')])
    end
  end

  # What ::Flag.joins(:vm).where(...)... answers: whether the flag is already solved. `solved`
  # is false/true (any flag, any set) or a list of [vm_set_id, flag_key] pairs, so a test can
  # show that one solved flag, or a solve on another set, does not let a different one through.
  class FakeFlagQuery
    def initialize(solved)
      @solved = solved
      @set_id = nil
      @flag_key = nil
    end

    def joins(*)
      self
    end

    def where(cond, *args)
      if cond.is_a?(Hash)
        @set_id = cond['vms.vm_set_id'] || cond[:'vms.vm_set_id'] || @set_id
      elsif cond.to_s.include?('flag_key')
        @flag_key = args.first.to_s.downcase
      end
      self
    end

    def exists?
      return !!@solved unless @solved.is_a?(Array)

      @solved.any? { |sid, key| sid.to_i == @set_id.to_i && key.to_s.downcase == @flag_key }
    end
  end

  class << self
    attr_accessor :sets, :solved_flags, :scored

    def install!(sets: [], solved: false)
      uninstall!
      @sets = sets.index_by(&:id)
      @solved_flags = solved
      @scored = []
      registry = self

      vm_set = Class.new { define_singleton_method(:find_by) { |id: nil, **| registry.sets[id.to_i] } }
      flag_service = Module.new do
        define_singleton_method(:process_flag) do |_vm, flag, _user, flash|
          registry.scored << flag
          flash[:notice] = 'Flag submitted to Hacktivity'
        end
      end
      flag = Class.new { define_singleton_method(:joins) { |*| FakeFlagQuery.new(registry.solved_flags) } }

      Object.const_set(:VmSet, vm_set)
      Object.const_set(:FlagService, flag_service)
      Object.const_set(:Flag, flag)

      helpers = Rails.application.routes.url_helpers
      helpers.define_singleton_method(:event_sec_gen_batch_vm_set_path) { |e, b, s, **q| "/fake/events/#{e.id}/batches/#{b.id}/vm_sets/#{s.id}?#{q.to_query}" }
      helpers.define_singleton_method(:activate_and_start_event_sec_gen_batch_vm_set_path) { |e, b, s| "/fake/events/#{e.id}/batches/#{b.id}/vm_sets/#{s.id}/activate" }
      helpers.define_singleton_method(:event_sec_gen_batch_vm_set_vm_path) { |e, b, s, v, **q| "/fake/events/#{e.id}/batches/#{b.id}/vm_sets/#{s.id}/vms/#{v.title}?#{q.to_query}" }
    end

    def uninstall!
      %i[VmSet FlagService Flag].each { |c| Object.send(:remove_const, c) if Object.const_defined?(c, false) }
      helpers = Rails.application.routes.url_helpers
      %i[event_sec_gen_batch_vm_set_path activate_and_start_event_sec_gen_batch_vm_set_path event_sec_gen_batch_vm_set_vm_path].each do |m|
        helpers.singleton_class.send(:remove_method, m) if helpers.singleton_class.method_defined?(m, false)
      end
    end
  end
end
