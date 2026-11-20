# frozen_string_literal: true

require 'minitest/autorun'
require_relative '../../lib/break_escape/scenario_schema'

# Step 2b (plan item 1, "The boot check", and Tests "Rails unit, the boot check"). The initializer
# body is ScenarioSchema.boot_check!(app, path:). This exercises it with a stub app, so it needs no
# Rails. With eager_load true it loads (raising on a missing file) and, for the default path,
# installs the process table; with eager_load false it does nothing.
class ScenarioSchemaBootTest < Minitest::Test
  SS = BreakEscape::ScenarioSchema

  # A minimal stand-in for the Rails app the initializer is handed: it answers config.eager_load.
  StubConfig = Struct.new(:eager_load)
  StubApp = Struct.new(:config)

  def app(eager_load:)
    StubApp.new(StubConfig.new(eager_load))
  end

  # Save and restore the module's process table, so installing a table here does not leak into
  # other tests that share this process.
  def around_table
    saved = SS.instance_variable_get(:@root_table)
    yield
  ensure
    SS.instance_variable_set(:@root_table, saved)
  end

  def test_missing_file_raises_under_eager_load
    around_table do
      err = assert_raises(ArgumentError) do
        SS.boot_check!(app(eager_load: true), path: '/no/such/scenario-schema.json')
      end
      assert_match(/not found/, err.message)
    end
  end

  def test_eager_load_off_does_not_read_the_path
    around_table do
      # A missing path must not raise when eager_load is off: the method returns without reading it.
      assert_nil SS.boot_check!(app(eager_load: false), path: '/no/such/scenario-schema.json')
    end
  end

  def test_default_path_installs_the_table_and_root_does_not_reread
    around_table do
      SS.instance_variable_set(:@root_table, nil)
      table = SS.boot_check!(app(eager_load: true))
      refute_nil table
      # The table boot_check! installed is the one root returns, so root does not read the file again.
      assert_same table, SS.instance_variable_get(:@root_table)
      assert_same table.root, SS.root
    end
  end

  def test_unparsable_file_raises_under_eager_load
    around_table do
      require 'tempfile'
      Tempfile.create(['scenario-schema', '.json']) do |f|
        f.write('{ not json')
        f.flush
        err = assert_raises(ArgumentError) do
          SS.boot_check!(app(eager_load: true), path: f.path)
        end
        assert_match(/unparsable/, err.message)
      end
    end
  end
end
