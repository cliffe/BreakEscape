module BreakEscape
  class PlayerPreferencesController < ApplicationController
    before_action :set_player_preference
    before_action :authorize_preference
    before_action :set_scenario_context

    # GET /break_escape/configuration
    def show
      @avatar_menu = @player_preference.avatar_menu
      @back_url = back_url_for(@game_for_scenario)
    end

    # PATCH /break_escape/configuration
    def update
      Rails.logger.info "[BreakEscape] Updating preference for player: #{current_player.class.name}##{current_player.id}"
      Rails.logger.info "[BreakEscape] Params: #{player_preference_params.inspect}"

      if @player_preference.update(player_preference_params)
        Rails.logger.info "[BreakEscape] Preference updated successfully: selected_sprite=#{@player_preference.selected_sprite}, in_game_name=#{@player_preference.in_game_name}"

        respond_to do |format|
          format.html do
            flash[:notice] = 'Character configuration saved!'

            # Redirect to game if came from validation flow
            if params[:game_id].present?
              redirect_to game_path(params[:game_id])
            else
              redirect_to configuration_path
            end
          end
          format.json do
            render json: {
              success: true,
              message: 'Character configuration saved!',
              data: {
                selected_sprite: @player_preference.selected_sprite,
                in_game_name: @player_preference.in_game_name
              }
            }
          end
        end
      else
        Rails.logger.error "[BreakEscape] Failed to update preference: #{@player_preference.errors.full_messages.join(', ')}"

        respond_to do |format|
          format.html do
            flash.now[:alert] = 'Please select a character sprite.'
            @avatar_menu = @player_preference.avatar_menu
            @back_url = back_url_for(@game_for_scenario)
            render :show, status: :unprocessable_entity
          end
          format.json do
            render json: {
              success: false,
              error: 'Please select a character sprite.',
              errors: @player_preference.errors.full_messages
            }, status: :unprocessable_entity
          end
        end
      end
    end

    private

    def set_player_preference
      @player_preference = current_player_preference || create_default_preference
      Rails.logger.info "[BreakEscape] set_player_preference: #{@player_preference.inspect}"
    end

    def current_player_preference
      if current_player.respond_to?(:break_escape_preference)
        current_player.break_escape_preference
      elsif current_player.respond_to?(:preference)
        # Reload association to ensure fresh data
        current_player.reload.preference
      end
    end

    def create_default_preference
      if current_player.respond_to?(:ensure_break_escape_preference!)
        current_player.ensure_break_escape_preference!
        current_player.break_escape_preference
      elsif current_player.respond_to?(:ensure_preference!)
        current_player.ensure_preference!
        current_player.preference
      else
        # Fallback: create directly
        PlayerPreference.create!(player: current_player)
      end
    end

    def authorize_preference
      authorize(@player_preference) if defined?(Pundit)
    end

    def player_preference_params
      params.require(:player_preference).permit(:selected_sprite, :in_game_name)
    end

    # The game being chosen for (game_id from the pre-game redirect or the
    # in-game menu): its validSprites shape the menu and what update accepts.
    # Only the player's own games count, since a scenario's validSprites make
    # characters choosable.
    def set_scenario_context
      @scenario = load_scenario_if_validating
      @player_preference.scenario_context = @scenario
    end

    def load_scenario_if_validating
      return nil unless params[:game_id].present?

      @game_for_scenario = Game.find_by(id: params[:game_id], player: current_player)
      return nil unless @game_for_scenario

      @game_for_scenario.scenario_data
    end

    # Where the picker's Back link goes when it was opened before a game starts and
    # has no other way out: the host game shell's menu, or the host's root in the
    # Hacktivity desktop app (one window, no tabs). Nil otherwise.
    def back_url_for(game)
      return nil unless params[:game_id].present?

      shell_menu = game && shell_links_for(game)[:menu_url]
      return shell_menu if shell_menu.present?

      request.user_agent.to_s.match?(%r{HacktivityApp/}) ? '/' : nil
    end
  end
end
