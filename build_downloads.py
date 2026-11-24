import os
import re
import base64
import zipfile

os.makedirs('downloads', exist_ok=True)

# 1. Base64 encode icons and logo
with open('assets/icon-192.png', 'rb') as f:
    icon_b64 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/logo.png', 'rb') as f:
    logo_b64_raw = base64.b64encode(f.read()).decode('ascii')
    logo_b64 = 'data:image/png;base64,' + logo_b64_raw

# 2. Read all CSS
css_files = ['css/styles.css', 'css/aim.css', 'css/cad.css', 'css/fieldbook.css', 'css/platforms.css']
all_css = ''
for c in css_files:
    if os.path.exists(c):
        with open(c, 'r', encoding='utf-8') as f:
            all_css += f'/* --- {c} --- */\n' + f.read() + '\n'

# 3. Read all JS
js_files = [
    'js/sample-data.js',
    'js/audio.js',
    'js/points.js',
    'js/cad-engine.js',
    'js/dxf.js',
    'js/fieldbook.js',
    'js/jobs.js',
    'js/aim-chat.js',
    'js/app.js'
]
all_js = ''
for j in js_files:
    if os.path.exists(j):
        with open(j, 'r', encoding='utf-8') as f:
            all_js += f'// --- {j} ---\n' + f.read() + '\n'

def inline_html(src_html, is_hta=False):
    with open(src_html, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove external stylesheet links
    html = re.sub(r'<link\s+rel=[\'"]stylesheet[\'"][^>]*>', '', html)
    # Remove script tags with src
    html = re.sub(r'<script\s+src=[\'"][^>]*></script>', '', html)
    # Replace asset paths with base64 data URIs
    html = html.replace('assets/logo.png', icon_b64)
    html = html.replace('assets/icon-192.png', icon_b64)
    
    # Inject HTA application tag if needed
    if is_hta:
        hta_tag = '''<hta:application 
  id="GeoSurveyCivil3D" 
  applicationname="GeoSurvey Civil 3D Workstation" 
  border="thick" 
  caption="yes" 
  showintaskbar="yes" 
  singleinstance="yes" 
  windowstate="maximize"
  navigable="yes"
/>
<meta http-equiv="x-ua-compatible" content="ie=edge">
'''
        html = html.replace('<head>', '<head>\n' + hta_tag)
    
    # Inject inline CSS before </head>
    style_tag = f'<style>\n{all_css}\n</style>\n'
    html = html.replace('</head>', style_tag + '</head>')
    
    # Inject inline JS before </body>
    script_tag = f'<script>\n{all_js}\n</script>\n'
    html = html.replace('</body>', script_tag + '</body>')
    return html

# 1. Generate Standalone Offline HTML for Android
standalone_android = inline_html('android.html')
with open('downloads/GeoSurvey-Android-Standalone.html', 'w', encoding='utf-8') as f:
    f.write(standalone_android)
print('Saved: downloads/GeoSurvey-Android-Standalone.html', len(standalone_android))

# 2. Generate Standalone Offline HTML for iPhone
standalone_iphone = inline_html('iphone.html')
with open('downloads/GeoSurvey-iPhone-Standalone.html', 'w', encoding='utf-8') as f:
    f.write(standalone_iphone)
print('Saved: downloads/GeoSurvey-iPhone-Standalone.html', len(standalone_iphone))

# 3. Generate Standalone Offline HTML for Computer Program
standalone_desktop = inline_html('desktop.html')
with open('downloads/GeoSurvey-Civil3D-Standalone.html', 'w', encoding='utf-8') as f:
    f.write(standalone_desktop)
print('Saved: downloads/GeoSurvey-Civil3D-Standalone.html', len(standalone_desktop))

# 4. Generate Native Windows HTA Application
standalone_hta = inline_html('desktop.html', is_hta=True)
with open('downloads/GeoSurvey-Civil3D-Workstation.hta', 'w', encoding='utf-8') as f:
    f.write(standalone_hta)
print('Saved: downloads/GeoSurvey-Civil3D-Workstation.hta', len(standalone_hta))

# 5. Generate Apple iOS .mobileconfig Profile (Installs GeoSurvey Pro directly on any iPhone)
mobileconfig_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>Icon</key>
      <data>{logo_b64_raw}</data>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>GeoSurvey Pro</string>
      <key>PayloadDescription</key>
      <string>GeoSurvey Pro Land Surveying iOS App for iPhone</string>
      <key>PayloadDisplayName</key>
      <string>GeoSurvey Pro</string>
      <key>PayloadIdentifier</key>
      <string>com.geosurvey.ios.webclip</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>Precomposed</key>
      <true/>
      <key>URL</key>
      <string>https://antigravity.luch.dev/site/aef3fa0e-ec18-4035-be15-3b34365d52dc/52aed9997b990f4c7798e12e/iphone.html</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Installs GeoSurvey Pro iOS App on iPhone with JSI Kissimmee logo icon</string>
  <key>PayloadDisplayName</key>
  <string>GeoSurvey Pro iPhone App</string>
  <key>PayloadIdentifier</key>
  <string>com.geosurvey.ios.profile</string>
  <key>PayloadOrganization</key>
  <string>GeoSurvey Inc.</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>B2C3D4E5-F6A7-4B8C-9D0E-1F2A3B4C5D6E</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
'''
with open('downloads/GeoSurvey-Pro-iOS.mobileconfig', 'w', encoding='utf-8') as f:
    f.write(mobileconfig_content)
print('Saved: downloads/GeoSurvey-Pro-iOS.mobileconfig', len(mobileconfig_content))

# 6. Generate Silent Windows VBScript Runner
vbs_content = '''\' GeoSurvey Civil 3D Desktop Workstation - Silent Windows App Runner
Dim WshShell, fso, appCmd, port
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
port = "8082"

\' Check for Chrome or Edge in App Mode
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe") & """ --app=http://localhost:" & port & "/"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe") & """ --app=http://localhost:" & port & "/"
Else
    appCmd = "http://localhost:" & port & "/"
End If

\' Start background server and open app window silently (windowStyle 0 = hidden)
WshShell.Run "cmd /c python -m http.server " & port & " || py -m http.server " & port, 0, False
WScript.Sleep 800
WshShell.Run appCmd, 1, False
'''
with open('downloads/Launch-Civil3D-Desktop.vbs', 'w', encoding='utf-8') as f:
    f.write(vbs_content)
print('Saved: downloads/Launch-Civil3D-Desktop.vbs')

# 7. Helper to add directory to zip
def add_dir_to_zip(zipf, src_dir, arc_prefix=''):
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, src_dir)
            arc_name = os.path.join(arc_prefix, rel_path) if arc_prefix else rel_path
            zipf.write(full_path, arc_name)

# Re-build Android zip to also contain the Standalone Single-File App
android_zip_path = 'downloads/GeoSurvey-Android-App.zip'
with zipfile.ZipFile(android_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('downloads/GeoSurvey-Android-Standalone.html', 'GeoSurvey-Android-Standalone.html')
    z.write('android.html', 'index.html')
    z.write('android.html', 'android.html')
    z.write('manifest.json', 'manifest.json')
    z.write('sw.js', 'sw.js')
    add_dir_to_zip(z, 'assets', 'assets')
    add_dir_to_zip(z, 'css', 'css')
    add_dir_to_zip(z, 'js', 'js')
    add_dir_to_zip(z, 'samples', 'samples')
    
    launcher_bat = '''@echo off
title GeoSurvey Pro - Android Field App
echo Starting GeoSurvey Pro Android Field App...
python -m http.server 8080 || py -m http.server 8080
start http://localhost:8080/
pause
'''
    z.writestr('Run-Android-Local.bat', launcher_bat)
    
    launcher_sh = '''#!/bin/bash
echo "Starting GeoSurvey Pro Android Field App on http://localhost:8080..."
python3 -m http.server 8080 &
PID=$!
sleep 1
if which xdg-open > /dev/null; then xdg-open http://localhost:8080/; elif which open > /dev/null; then open http://localhost:8080/; fi
wait $PID
'''
    z.writestr('Run-Android-Local.sh', launcher_sh)
    
    android_readme = '''======================================================================
GEOSURVEY PRO - ANDROID FIELD APP (TESTING PACKAGE)
======================================================================

FOR ANDROID PHONES & TOPCON/SOKKIA RUGGED TABLETS (FC-6000 / SHC6000)

WAYS TO RUN & TEST:
1. Double-click 'GeoSurvey-Android-Standalone.html':
   Runs immediately in any browser offline with NO server and NO setup!

2. Direct 1-Tap Web Install (Easiest on Android):
   Open in Chrome on Android:
   https://antigravity.luch.dev/site/aef3fa0e-ec18-4035-be15-3b34365d52dc/52aed9997b990f4c7798e12e/android.html
   Tap "Install App" or menu (⋮) -> "Add to Home Screen".
   Installs as a native APK-like full-screen app with the JSI Kissimmee icon!

3. Run with local server:
   Windows: Double-click 'Run-Android-Local.bat'.
   Mac/Linux: Run 'sh Run-Android-Local.sh'.
'''
    z.writestr('README-ANDROID-TESTERS.txt', android_readme)
print('Updated:', android_zip_path, os.path.getsize(android_zip_path))

# Re-build iPhone zip to also contain the Standalone Single-File App & Profile
iphone_zip_path = 'downloads/GeoSurvey-iPhone-App.zip'
with zipfile.ZipFile(iphone_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('downloads/GeoSurvey-iPhone-Standalone.html', 'GeoSurvey-iPhone-Standalone.html')
    z.write('downloads/GeoSurvey-Pro-iOS.mobileconfig', 'GeoSurvey-Pro-iOS.mobileconfig')
    z.write('iphone.html', 'index.html')
    z.write('iphone.html', 'iphone.html')
    z.write('manifest.json', 'manifest.json')
    z.write('sw.js', 'sw.js')
    add_dir_to_zip(z, 'assets', 'assets')
    add_dir_to_zip(z, 'css', 'css')
    add_dir_to_zip(z, 'js', 'js')
    add_dir_to_zip(z, 'samples', 'samples')
    
    launcher_bat = '''@echo off
title GeoSurvey Pro - iPhone iOS App
echo Starting GeoSurvey Pro iPhone Edition...
python -m http.server 8081 || py -m http.server 8081
start http://localhost:8081/
pause
'''
    z.writestr('Run-iPhone-Local.bat', launcher_bat)
    
    iphone_readme = '''======================================================================
GEOSURVEY PRO - IPHONE / iOS APP (TESTING PACKAGE)
======================================================================

FOR APPLE iPHONE 16 / 15 / 14 / 13 PRO (iOS 15+)

WAYS TO RUN & TEST:
1. Double-click 'GeoSurvey-iPhone-Standalone.html':
   Opens immediately in Safari or any browser with touch support, Dynamic Island, and 1/4 split chat!

2. 1-Tap iOS Profile Install (Installs app on iPhone Home Screen):
   Download 'GeoSurvey-Pro-iOS.mobileconfig' on your iPhone.
   Go to Settings -> "Profile Downloaded" -> tap Install.
   The app installs directly onto your iPhone home screen!

3. Safari Add to Home Screen:
   Open: https://antigravity.luch.dev/site/aef3fa0e-ec18-4035-be15-3b34365d52dc/52aed9997b990f4c7798e12e/iphone.html
   Tap Share (square with arrow up) -> "Add to Home Screen".
'''
    z.writestr('README-IPHONE-TESTERS.txt', iphone_readme)
print('Updated:', iphone_zip_path, os.path.getsize(iphone_zip_path))

# Re-build Desktop zip to also contain HTA, VBS, and Standalone Single-File App
desktop_zip_path = 'downloads/GeoSurvey-Computer-Program.zip'
with zipfile.ZipFile(desktop_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('downloads/GeoSurvey-Civil3D-Standalone.html', 'GeoSurvey-Civil3D-Standalone.html')
    z.write('downloads/GeoSurvey-Civil3D-Workstation.hta', 'GeoSurvey-Civil3D-Workstation.hta')
    z.write('downloads/Launch-Civil3D-Desktop.vbs', 'Launch-Civil3D-Desktop.vbs')
    z.write('desktop.html', 'index.html')
    z.write('desktop.html', 'desktop.html')
    z.write('manifest.json', 'manifest.json')
    z.write('sw.js', 'sw.js')
    add_dir_to_zip(z, 'assets', 'assets')
    add_dir_to_zip(z, 'css', 'css')
    add_dir_to_zip(z, 'js', 'js')
    add_dir_to_zip(z, 'samples', 'samples')
    
    start_pc_bat = '''@echo off
title Autodesk Civil 3D 2026 - GeoSurvey Workstation Launcher
set PORT=8082
set BROWSER_CMD=""
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app=http://localhost:%PORT%/
) else if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app=http://localhost:%PORT%/
)
start "" /B python -m http.server %PORT% 2>nul || start "" /B py -m http.server %PORT% 2>nul
timeout /t 1 /nobreak >nul
if not %BROWSER_CMD%=="" (start "" %BROWSER_CMD%) else (start http://localhost:%PORT%/)
pause >nul
'''
    z.writestr('Start-Civil3D-Workstation.bat', start_pc_bat)
    
    desktop_readme = '''======================================================================
GEOSURVEY CIVIL 3D OFFICE WORKSTATION - COMPUTER PROGRAM
======================================================================

FOR CAD DRAFTERS & OFFICE SURVEYORS (WINDOWS & MAC)

WAYS TO RUN & TEST:
1. Double-click 'GeoSurvey-Civil3D-Workstation.hta' (Native Windows App):
   Immediately launches as a native desktop application window with no browser URL bar!

2. Double-click 'Launch-Civil3D-Desktop.vbs' (Silent Desktop App Mode):
   Silently opens the Civil 3D software in true standalone application window mode.

3. Double-click 'GeoSurvey-Civil3D-Standalone.html':
   Self-contained single-file software that runs immediately on any PC or Mac!

4. Double-click 'Start-Civil3D-Workstation.bat':
   Runs with full local workstation server and launcher.
'''
    z.writestr('CIVIL3D-DESKTOP-TESTING-GUIDE.txt', desktop_readme)
print('Updated:', desktop_zip_path, os.path.getsize(desktop_zip_path))
print('All downloads built successfully!')
