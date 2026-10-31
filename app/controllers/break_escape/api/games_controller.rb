module BreakEscape
  module Api
    class GamesController < ApplicationController
      before_action :set_game

      # PUT /games/:id/sync_state
      # Periodic state sync from client
      def sync_state
        authorize @game if defined?(Pundit)

        # Update allowed fields
        if params[:currentRoom]
          @game.player_state['currentRoom'] = params[:currentRoom]
        end

        if params[:globalVariables]
          @game.merge_global_variables!(params[:globalVariables].to_unsafe_h)
        end

        @game.save!

        render json: { success: true }
      end

      # POST /games/:id/inventory
      # Update inventory
      def inventory
        authorize @game if defined?(Pundit)

        action_type = params[:action_type] || params[:actionType]
        item = params[:item]

        case action_type
        when 'add'
          @game.add_inventory_item!(item.to_unsafe_h)
          render json: { success: true, inventory: @game.player_state['inventory'] }
        when 'remove'
          @game.remove_inventory_item!(item['id'])
          render json: { success: true, inventory: @game.player_state['inventory'] }
        else
          render json: { success: false, message: 'Invalid action' }, status: :bad_request
        end
      end

      private

      def set_game
        @game = Game.find(params[:id])
      end
    end
  end
end
