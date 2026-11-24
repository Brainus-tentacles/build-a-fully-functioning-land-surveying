' GeoSurvey Civil 3D Desktop Workstation - Silent Windows App Runner
Dim WshShell, fso, currentDir, htmlPath, appCmd
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = fso.BuildPath(currentDir, "GeoSurvey-Civil3D-Standalone.html")

' Check for Chrome or Edge in App Mode (launches as borderless software window)
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe") & """ --app=""" & htmlPath & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe") & """ --app=""" & htmlPath & """"
Else
    appCmd = """" & htmlPath & """"
End If

WshShell.Run appCmd, 1, False
