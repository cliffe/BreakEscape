VAR m91_assets_seized = false
VAR m91_team = ""
VAR local_flag = false
=== start ===
{m91_team == "purple": Purple.}
{m91_team == "meltdown": Meltdown.}
~ m91_team = "x"
~ local_flag = true
#set_global:m91_assets_seized:true
#set_variable:m91_completed=true
-> END
