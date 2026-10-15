Rails.application.routes.draw do
  mount BreakEscape::Engine => "/break_escape"

  # Redirect root to missions list
  root to: redirect('/break_escape/missions')
end
