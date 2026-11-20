# Regenerate app-paths.json (from the Hacktivity checkout, with BreakEscape beside it): bin/rails runner ../BreakEscape/BreakEscape/test/js/fixtures/capture_app_paths.rb > ../BreakEscape/BreakEscape/test/js/fixtures/app-paths.json
require "json"
include Rails.application.routes.url_helpers
e = Event.find_by!(app_key: "licence-to-hack")
other = Event.where.not(id: e.id).first
h = Rails.application.routes.url_helpers
stay = {
  "start" => h.app_game_path(game_key: "licence-to-hack"),
  "briefing" => h.play_event_path(e),
  "event page" => h.event_path(e),
  "sign in" => h.new_user_session_path,
  "sign out" => h.destroy_user_session_path,
  "sign up" => h.new_user_registration_path,
  "password reset" => h.new_user_password_path,
  "mission start" => "/hacktivities/#{e.id}/missions/abc123/start",
  "mission finish" => "/hacktivities/#{e.id}/missions/abc123/finish",
  "vnc console" => "/hacktivities/#{e.id}/challenges/3/vm_sets/4/vms/5/vnc_console",
  "challenges index" => "/hacktivities/#{e.id}/challenges",
  "engine game" => "/break_escape/games/12",
  "feedback" => "/feedbacks/new"
}
leave = {
  "plans" => h.plans_path,
  "account" => h.edit_user_registration_path,
  "terms" => "/terms",
  "event scoreboard" => "/hacktivities/#{e.id}/challenges/3/challenge_scoreboard",
  "another event" => h.event_path(other),
  "another event play" => h.play_event_path(other),
  "home" => "/",
  "subscriptions" => "/subscriptions/1"
}
puts JSON.pretty_generate(
  "_comment" => "Captured from Hacktivity AppPaths.patterns_for and the real route helpers. Regenerate from the Hacktivity checkout: bin/rails runner ../BreakEscape/BreakEscape/test/js/fixtures/capture_app_paths.rb > ../BreakEscape/BreakEscape/test/js/fixtures/app-paths.json",
  "eventId" => e.id, "patterns" => AppPaths.patterns_for(e.id), "stay" => stay, "leave" => leave,
  "rubyAgrees" => { "stay" => stay.values.map { |p| AppPaths.match?(p, e.id) }, "leave" => leave.values.map { |p| AppPaths.match?(p, e.id) } }
)
