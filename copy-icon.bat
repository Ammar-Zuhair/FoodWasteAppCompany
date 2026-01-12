@echo off
cd /d %~dp0
if not exist resources mkdir resources
if exist "..\image\logo.png" (
    copy /Y "..\image\logo.png" "resources\icon.png"
    copy /Y "..\image\logo.png" "resources\splash.png"
    echo Done!
) else (
    echo Error: logo.png not found
)









