require "break_escape/version"
require "break_escape/engine"

module BreakEscape
  class << self
    attr_accessor :configuration
  end

  def self.configure
    self.configuration ||= Configuration.new
    yield(configuration) if block_given?
  end

  def self.standalone_mode?
    configuration&.standalone_mode || false
  end

  class Configuration
    attr_accessor :standalone_mode, :demo_user_handle, :on_game_complete, :on_flag_submit, :on_task_complete

    def initialize
      @standalone_mode  = false
      @demo_user_handle = 'demo_player'
      @on_game_complete = nil  # callable: ->(game) { ... }, or nil
      @on_flag_submit   = nil  # callable: ->(game, flag_key, vm_id) { ... }, or nil
      @on_task_complete = nil  # callable: ->(game) { ... }, or nil — fires after any task is successfully completed
    end
  end
end

# Initialize with defaults
BreakEscape.configure { }
