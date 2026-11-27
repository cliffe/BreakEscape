# Crisp text 2 handover

Branch build/crisp-text-2. Commits: 4fb4a4312 (second will-change list, JS classes, font-smooth removal, tests), 39de7da5b (drop .lpb-submit, .lpb-field-label: hint does nothing).

Done: CSS rule + comment in minigames-framework.css; password (.password-info-name/-text, .password-field-label) and cryptex (.cryptex-subtitle) classes added via classList after render; main.css and player_preferences.css font-smooth lines replaced by a comment; test/js/minigame-text-crisp-css.test.mjs (9 tests pass) and title test finder now keys on .patch-panel-title (18 pass in both files together).
Open: siem .siem-queue-count at 390 shows a bad clip (measurement artefact, 1280 was 1033/0); notes measured on the game's own notepad, not a custom note; osint and chat click checks gave no visible change (clicks were hit-tested OK). Server on :3450 (PID file /tmp/be3450.pid) still running: stop it with kill $(cat /tmp/be3450.pid).
Measure script: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/crisp-text2/measure2.mjs, analyser an3.py, shots in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/crisp-text2/shots. Games 6788-6794.

## Fringe table (before/after the hint)
```
casefile/.ib-empty                                           1280    119/119  390   1133/248 n=2 risky=False
casefile/.ib-infl-label                                      1280        0/0  390      329/6 n=1 risky=False
casefile/.ib-name                                            1280        0/0  390     1001/0 n=3 risky=False
casefile/.ib-progress                                        1280        0/0  390   1302/112 n=1 risky=False
chat/.person-chat-dialogue-text                              1280        0/0  390     2618/0 n=1 risky=False
chat/.person-chat-speaker-name                               1280        0/0  390      392/0 n=1 risky=False
combo/.combination-dial-display                              1280      576/0  390      384/0 n=3 risky=False
combo/.combination-dial-label                                1280      452/0  390      421/0 n=3 risky=False
combo/.combination-direction-indicator                       1280      461/0  390      461/0 n=1 risky=False
combo/.combination-help                                      1280     3343/0  390     3068/0 n=1 risky=False
combo/.combination-status-message                            1280     2110/0  390     2110/0 n=1 risky=False
cryptex/.cryptex-subtitle                                    1280     1980/0  390     1975/0 n=1 risky=False
cryptex/.cryptex-wheel-label                                 1280      306/0  390      296/0 n=6 risky=False
notes                                                        1280       skip  390       skip n= risky=False
notes/.note-md-text                                          1280     3202/0  390     3202/0 n=1 risky=False
osint/.ob-page-title                                         1280      597/0  390      597/0 n=1 risky=False
osint/.ob-site-title                                         1280      676/0  390      676/0 n=1 risky=False
password-wifi/.attempts-counter                              1280      98/98  390     637/98 n=1 risky=False
password-wifi/.password-field-label                          1280        0/0  390     1628/0 n=1 risky=False
password-wifi/.password-info-name                            1280      800/0  390      794/0 n=1 risky=False
password-wifi/.password-info-text                            1280     1825/0  390     1825/0 n=1 risky=False
password/.attempts-counter                                   1280      98/98  390     637/98 n=1 risky=False
password/.password-field-label                               1280        0/0  390     1628/0 n=1 risky=False
password/.password-info-name                                 1280      800/0  390      794/0 n=1 risky=False
password/.password-info-text                                 1280     1825/0  390     1825/0 n=1 risky=False
pin/.pin-minigame-attempt-empty                              1280      715/0  390      715/0 n=1 risky=False
rogue@0/.rogue-ap-clients                                    1280      398/0  390      320/0 n=4 risky=False
rogue@0/.rogue-ap-known-label                                1280      706/0  390      558/0 n=1 risky=False
rogue@0/.rogue-ap-security                                   1280      270/0  390      221/0 n=4 risky=False
rogue@0/.rogue-ap-signal-word                                1280      343/0  390      265/0 n=4 risky=False
rogue@0/.rogue-ap-ssid                                       1280      760/0  390      611/0 n=4 risky=False
rogue@1/.lpb-address-text                                    1280      821/0  390      821/0 n=1 risky=False
rogue@1/.lpb-copy                                            1280    601/601  390   2848/601 n=1 risky=False
rogue@1/.lpb-not-secure                                      1280      270/0  390      270/0 n=1 risky=False
rogue@1/.rogue-ap-chosen                                     1280      183/0  390      183/0 n=2 risky=False
rogue@1/.rogue-ap-note                                       1280     5048/0  390     3951/0 n=1 risky=False
rogue@1/.rogue-ap-ssid-pick-name                             1280      731/0  390      586/0 n=4 risky=False
rogue@1/.rogue-ap-template-label                             1280      440/0  390      211/0 n=2 risky=False
rogue@2/.lpb-address-text                                    1280      821/0  390      821/0 n=1 risky=False
rogue@2/.lpb-copy                                            1280    601/601  390   2848/601 n=1 risky=False
rogue@2/.lpb-not-secure                                      1280      270/0  390      270/0 n=1 risky=False
rogue@2/.rogue-ap-chosen                                     1280      183/0  390      183/0 n=2 risky=False
rogue@2/.rogue-ap-note                                       1280     5048/0  390     3951/0 n=1 risky=False
rogue@2/.rogue-ap-ssid-pick-name                             1280      731/0  390      586/0 n=4 risky=False
rogue@2/.rogue-ap-template-label                             1280      440/0  390      211/0 n=2 risky=False
siem                                                         1280       skip  390       skip n= risky=False
siem/.siem-queue-count                                       1280     1033/0  390  3104/3104 n=1 risky=False
triage-click/.tri-brief-note                                 1280        0/0  390     3696/0 n=1 risky=False
triage-click/.tri-brief-restart                              1280        0/0  390     2813/0 n=1 risky=False
triage-click/.tri-brief-score                                1280        0/0  390     2676/0 n=1 risky=False
triage-click/.tri-brief-title                                1280        0/0  390     1450/0 n=1 risky=False
triage-click/.tri-brief-when                                 1280        0/0  390     2383/0 n=1 risky=False
triage@0/.tri-brief-note                                     1280        0/0  390     3696/0 n=1 risky=False
triage@0/.tri-brief-restart                                  1280        0/0  390     2813/0 n=1 risky=False
triage@0/.tri-brief-score                                    1280        0/0  390     2676/0 n=1 risky=False
triage@0/.tri-brief-title                                    1280        0/0  390     1450/0 n=1 risky=False
triage@0/.tri-brief-when                                     1280        0/0  390     2383/0 n=1 risky=False
```
