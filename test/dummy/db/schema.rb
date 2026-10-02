# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_05_25_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "break_escape_cyboks", force: :cascade do |t|
    t.string "ka"
    t.string "topic"
    t.string "keywords"
    t.string "cybokable_type"
    t.integer "cybokable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cybokable_id"], name: "index_break_escape_cyboks_on_cybokable_id"
    t.index ["cybokable_type", "cybokable_id"], name: "index_break_escape_cyboks_on_cybokable_type_and_cybokable_id"
    t.index ["ka"], name: "index_break_escape_cyboks_on_ka"
  end

  create_table "break_escape_demo_users", force: :cascade do |t|
    t.string "handle", null: false
    t.string "role", default: "user", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["handle"], name: "index_break_escape_demo_users_on_handle", unique: true
  end

  create_table "break_escape_games", force: :cascade do |t|
    t.string "player_type", null: false
    t.bigint "player_id", null: false
    t.bigint "mission_id", null: false
    t.jsonb "scenario_data", null: false
    t.jsonb "player_state", default: { "notes"=>[], "health"=>100, "inventory"=>[], "currentRoom"=>nil, "unlockedRooms"=>[], "encounteredNPCs"=>[], "globalVariables"=>{}, "unlockedObjects"=>[], "biometricSamples"=>[], "biometricUnlocks"=>[], "bluetoothDevices"=>[] }, null: false
    t.string "status", default: "in_progress", null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "score", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "objectives_completed", default: 0
    t.integer "tasks_completed", default: 0
    t.bigint "vm_set_id"
    t.integer "total_tasks", default: 0, null: false
    t.integer "total_aims", default: 0, null: false
    t.datetime "mission_concluded_at"
    t.index ["mission_id"], name: "index_break_escape_games_on_mission_id"
    t.index ["player_state"], name: "index_break_escape_games_on_player_state", using: :gin
    t.index ["player_type", "player_id", "mission_id"], name: "index_games_on_player_and_mission_non_unique"
    t.index ["player_type", "player_id"], name: "index_break_escape_games_on_player"
    t.index ["scenario_data"], name: "index_break_escape_games_on_scenario_data", using: :gin
    t.index ["status"], name: "index_break_escape_games_on_status"
    t.index ["total_aims", "objectives_completed"], name: "index_games_on_aim_progress"
    t.index ["total_tasks", "tasks_completed"], name: "index_games_on_task_progress"
    t.index ["vm_set_id"], name: "index_break_escape_games_on_vm_set_id"
  end

  create_table "break_escape_missions", force: :cascade do |t|
    t.string "name", null: false
    t.string "display_name", null: false
    t.text "description"
    t.boolean "published", default: false, null: false
    t.integer "difficulty_level", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "secgen_scenario"
    t.string "collection", default: "default"
    t.string "vm_activation_mode", default: "eager", null: false
    t.index ["collection"], name: "index_break_escape_missions_on_collection"
    t.index ["name"], name: "index_break_escape_missions_on_name", unique: true
    t.index ["published"], name: "index_break_escape_missions_on_published"
  end

  create_table "break_escape_player_preferences", force: :cascade do |t|
    t.string "player_type", null: false
    t.bigint "player_id", null: false
    t.string "selected_sprite"
    t.string "in_game_name", default: "Zero", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["player_type", "player_id"], name: "index_break_escape_player_preferences_on_player"
    t.index ["player_type", "player_id"], name: "index_player_prefs_on_player", unique: true
  end

  add_foreign_key "break_escape_games", "break_escape_missions", column: "mission_id"
end
