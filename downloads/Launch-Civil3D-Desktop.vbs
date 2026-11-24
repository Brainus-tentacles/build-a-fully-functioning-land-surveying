' GeoSurvey Civil 3D Desktop Workstation - Silent Windows App Runner
Dim WshShell, fso, appCmd, port
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
port = "8082"

' Check for Chrome or Edge in App Mode
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe") & """ --app=http://localhost:" & port & "/"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe") & """ --app=http://localhost:" & port & "/"
Else
    appCmd = "http://localhost:" & port & "/"
End If

' Start background server and open app window silently (windowStyle 0 = hidden)
WshShell.Run "cmd /c python -m http.server " & port & " || py -m http.server " & port, 0, False
WScript.Sleep 800
WshShell.Run appCmd, 1, False
