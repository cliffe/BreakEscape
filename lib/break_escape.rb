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
    attr_accessor :standalone_mode, :demo_user_handle, :on_game_complete, :on_flag_submit, :on_task_complete,
                  :can_continue_in_slot, :can_create_game, :shell_links, :shell_picker

    def initialize
      @standalone_mode      = false
      @demo_user_handle     = 'demo_player'
      @on_game_complete     = nil  # callable: ->(game) { ... }, or nil
      @on_flag_submit       = nil  # callable: ->(game, flag_key, vm_id) { ... }, or nil
      @on_task_complete     = nil  # callable: ->(game) { ... }, or nil — fires after any task is successfully completed
      @can_continue_in_slot = nil  # callable: ->(user, game_slot) -> bool, or nil
      @can_create_game      = nil  # callable: ->(user, mission) -> bool, or nil. Gates creating a game directly (games#new/create); nil = any user who can see the mission
      # callable: ->(game) -> Hash or nil. A host that wraps missions in its own game
      # shell returns where the in-game links go: { menu_url:, return_url:,
      # return_label:, walkthrough_url: } (any may be nil). nil keeps the defaults.
      @shell_links          = nil
      # callable: ->(return_to) -> Hash or nil. The character picker opened from a host game
      # shell without a game (configuration?return_to=<a host path>): the host says whether
      # return_to is one of its shell pages and, if so, how the picker should look and where
      # Back goes: { back_url:, back_label:, heading:, ui_theme:, backdrop_style: } (the last
      # four optional). The engine never follows return_to itself. nil keeps the plain page.
      @shell_picker         = nil
    end
  end
end

# Initialize with defaults
BreakEscape.configure { }
