const g = window.gameState.globalVariables;
return { notes: (window.gameState?.notes||[]).map(n=>n.title||n.id), globals: ['flag1_submitted','flag2_submitted','ledger_read_heard','deck_choice_made','afterwards_heard','flag4_submitted','identity_scene_done','hour_read_started','hour_read_texted','recruiter_call_started','tesseract_call_started'].map(k=>k+'='+g[k]).join(' ') };
