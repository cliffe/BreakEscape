module BreakEscape
  class MissionsController < ApplicationController
    def index
      authorize Mission, :index? if defined?(Pundit)

      missions = if defined?(Pundit)
                    policy_scope(Mission)
      else
                    Mission.published
      end

      # Filter by collection if specified
      if params[:collection].present?
        missions = missions.by_collection(params[:collection])
      end

      # Eager load CyBOK data for display
      missions = missions.includes(:break_escape_cyboks)

      # Group missions by collection for display
      @missions_by_collection = missions.group_by { |m| m.collection || 'default' }
      @missions_by_collection = @missions_by_collection.sort_by { |collection, _| collection }
    end

    def show
      @mission = Mission.find(params[:id])
      authorize @mission if defined?(Pundit)

      if @mission.requires_vms?
        # VM missions (Hacktivity or standalone) need explicit setup
        # Redirect to games#new which shows appropriate UI:
        # - Hacktivity mode: VM set selection
        # - Standalone mode: Flag input form
        redirect_to "/break_escape/games/new?mission_id=#{@mission.id}"
      else
      # Legacy behavior for non-VM missions - auto-create game
      @game = Game.find_or_create_by!(
        player: current_player,
        mission: @mission
      )
        # Use explicit path instead of route helper to ensure it works in engine context
        redirect_to "/break_escape/games/#{@game.id}"
      end
    end
  end
end
