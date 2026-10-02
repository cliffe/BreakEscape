module BreakEscape
  class PlayerPreferencesController < ApplicationController
    before_action :set_player_preference
    before_action :authorize_preference

    # GET /break_escape/configuration
    def show
      @available_sprites = PlayerPreference::AVAILABLE_SPRITES
      @scenario = load_scenario_if_validating
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
            @available_sprites = PlayerPreference::AVAILABLE_SPRITES
            @scenario = load_scenario_if_validating
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

    def load_scenario_if_validating
      return nil unless params[:game_id].present?

      game = Game.find_by(id: params[:game_id])
      return nil unless game

      # Return scenario data with validSprites info
      game.scenario_data
    end
  end
end
