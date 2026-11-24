import os
import re
import base64
import zipfile

os.makedirs('downloads', exist_ok=True)

# 1. Base64 encode icons, logo, and manifest
with open('assets/icon-192.png', 'rb') as f:
    icon192_b64 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/icon-512.png', 'rb') as f:
    icon512_b64 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/favicon-48.png', 'rb') as f:
    fav48_b64 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/favicon-32.png', 'rb') as f:
    fav32_b64 = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/icon.svg', 'rb') as f:
    svg_b64 = 'data:image/svg+xml;base64,' + base64.b64encode(f.read()).decode('ascii')
with open('assets/logo.png', 'rb') as f:
    logo_raw = base64.b64encode(f.read()).decode('ascii')
    logo_b64 = 'data:image/png;base64,' + logo_raw
with open('assets/logo.jpg', 'rb') as f:
    logojpeg_b64 = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('ascii')

with open('manifest.json', 'rb') as f:
    manifest_b64 = 'data:application/manifest+json;base64,' + base64.b64encode(f.read()).decode('ascii')

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
    
    # 1. Remove external stylesheet links and inject all_css before </head>
    html = re.sub(r'<link\s+rel=[\'"]stylesheet[\'"][^>]*>', '', html)
    style_tag = f'<style>\n{all_css}\n</style>\n'
    html = html.replace('</head>', style_tag + '</head>')
    
    # 2. In-place replacement of the first script tag with all_js bundle
    # This guarantees all_js runs BEFORE any page-specific inline scripts!
    script_injected = False
    def replace_script(match):
        nonlocal script_injected
        if not script_injected:
            script_injected = True
            return f'<script>\n{all_js}\n</script>'
        return ''
    
    html = re.sub(r'<script\s+src=[\'"][^>]*></script>', replace_script, html)
    
    # 3. Replace asset paths with base64 data URIs
    html = html.replace('assets/logo.png', logo_b64)
    html = html.replace('assets/logo.jpg', logojpeg_b64)
    html = html.replace('assets/icon-192.png', icon192_b64)
    html = html.replace('assets/icon-512.png', icon512_b64)
    html = html.replace('assets/favicon-48.png', fav48_b64)
    html = html.replace('assets/favicon-32.png', fav32_b64)
    html = html.replace('assets/icon.svg', svg_b64)
    html = html.replace('href="manifest.json"', f'href="{manifest_b64}"')
    
    # 4. Inject HTA application tag if needed
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
      <data>{logo_raw}</data>
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
Dim WshShell, fso, currentDir, htmlPath, appCmd
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = fso.BuildPath(currentDir, "GeoSurvey-Civil3D-Standalone.html")

\' Check for Chrome or Edge in App Mode (launches as borderless software window)
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe") & """ --app=""" & htmlPath & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")) Then
    appCmd = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe") & """ --app=""" & htmlPath & """"
Else
    appCmd = """" & htmlPath & """"
End If

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

# 8. Re-build Android zip
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
echo ========================================================
echo Starting GeoSurvey Pro Android Field App...
echo ========================================================
if exist "GeoSurvey-Android-Standalone.html" (
    start "" "GeoSurvey-Android-Standalone.html"
) else (
    start "" "index.html"
)
'''
    z.writestr('Run-Android-Local.bat', launcher_bat)
    
    launcher_sh = '''#!/bin/bash
echo "Starting GeoSurvey Pro Android Field App..."
if [ -f "GeoSurvey-Android-Standalone.html" ]; then
    TARGET="GeoSurvey-Android-Standalone.html"
else
    TARGET="index.html"
fi
if which xdg-open > /dev/null 2>&1; then
    xdg-open "$TARGET"
elif which open > /dev/null 2>&1; then
    open "$TARGET"
else
    python3 -m http.server 8080
fi
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

3. Run with local launcher:
   Windows: Double-click 'Run-Android-Local.bat'.
   Mac/Linux: Run 'sh Run-Android-Local.sh'.
'''
    z.writestr('README-ANDROID-TESTERS.txt', android_readme)
print('Updated:', android_zip_path, os.path.getsize(android_zip_path))

# 9. Re-build iPhone zip
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
if exist "GeoSurvey-iPhone-Standalone.html" (
    start "" "GeoSurvey-iPhone-Standalone.html"
) else (
    start "" "index.html"
)
'''
    z.writestr('Run-iPhone-Local.bat', launcher_bat)
    
    launcher_sh = '''#!/bin/bash
echo "Starting GeoSurvey Pro iPhone iOS App..."
if [ -f "GeoSurvey-iPhone-Standalone.html" ]; then
    TARGET="GeoSurvey-iPhone-Standalone.html"
else
    TARGET="index.html"
fi
if which open > /dev/null 2>&1; then
    open "$TARGET"
elif which xdg-open > /dev/null 2>&1; then
    xdg-open "$TARGET"
fi
'''
    z.writestr('Run-iPhone-Local.sh', launcher_sh)
    
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
   The app installs directly onto your iPhone home screen with the JSI Kissimmee icon!

3. Safari Add to Home Screen:
   Open: https://antigravity.luch.dev/site/aef3fa0e-ec18-4035-be15-3b34365d52dc/52aed9997b990f4c7798e12e/iphone.html
   Tap Share (square with arrow up) -> "Add to Home Screen".
'''
    z.writestr('README-IPHONE-TESTERS.txt', iphone_readme)
print('Updated:', iphone_zip_path, os.path.getsize(iphone_zip_path))

# 10. Re-build Desktop zip
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
echo Starting GeoSurvey Civil 3D Office Workstation...
set HTML_FILE="%~dp0GeoSurvey-Civil3D-Standalone.html"

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%HTML_FILE:\\=/%"
    exit
)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%HTML_FILE:\\=/%"
    exit
)
start "" %HTML_FILE%
'''
    z.writestr('Start-Civil3D-Workstation.bat', start_pc_bat)
    
    start_pc_sh = '''#!/bin/bash
echo "Starting GeoSurvey Civil 3D Office Workstation..."
DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$DIR/GeoSurvey-Civil3D-Standalone.html"
if which google-chrome > /dev/null 2>&1; then
    google-chrome --app="file://$TARGET" &
elif which open > /dev/null 2>&1; then
    open "$TARGET"
elif which xdg-open > /dev/null 2>&1; then
    xdg-open "$TARGET"
fi
'''
    z.writestr('Start-Civil3D-Workstation.sh', start_pc_sh)
    
    desktop_readme = '''======================================================================
GEOSURVEY CIVIL 3D OFFICE WORKSTATION - COMPUTER PROGRAM
======================================================================

FOR CAD DRAFTERS & OFFICE SURVEYORS (WINDOWS & MAC)

WAYS TO RUN & TEST:
1. Double-click 'GeoSurvey-Civil3D-Workstation.hta' (Native Windows App):
   Immediately launches as a native desktop application window with no browser URL bar!

2. Double-click 'Launch-Civil3D-Desktop.vbs' or 'Start-Civil3D-Workstation.bat':
   Opens Civil 3D workstation in standalone desktop application window mode.

3. Double-click 'GeoSurvey-Civil3D-Standalone.html':
   Self-contained single-file software that runs immediately on any PC or Mac!

4. Mac / Linux:
   Run 'sh Start-Civil3D-Workstation.sh' or double-click 'GeoSurvey-Civil3D-Standalone.html'.
'''
    z.writestr('CIVIL3D-DESKTOP-TESTING-GUIDE.txt', desktop_readme)
print('Updated:', desktop_zip_path, os.path.getsize(desktop_zip_path))

# 11. Build ALL-IN-ONE MASTER BUNDLE: GeoSurvey-Complete-Suite-All-Platforms.zip
master_zip_path = 'downloads/GeoSurvey-Complete-Suite-All-Platforms.zip'
with zipfile.ZipFile(master_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    # Android Folder
    z.write('downloads/GeoSurvey-Android-Standalone.html', '01-Android-Field-App/GeoSurvey-Android-Standalone.html')
    z.write('android.html', '01-Android-Field-App/index.html')
    z.writestr('01-Android-Field-App/Run-Android-Local.bat', launcher_bat)
    z.writestr('01-Android-Field-App/Run-Android-Local.sh', launcher_sh)
    z.writestr('01-Android-Field-App/README-ANDROID.txt', android_readme)
    
    # iPhone Folder
    z.write('downloads/GeoSurvey-iPhone-Standalone.html', '02-iPhone-iOS-App/GeoSurvey-iPhone-Standalone.html')
    z.write('downloads/GeoSurvey-Pro-iOS.mobileconfig', '02-iPhone-iOS-App/GeoSurvey-Pro-iOS.mobileconfig')
    z.write('iphone.html', '02-iPhone-iOS-App/index.html')
    z.writestr('02-iPhone-iOS-App/Run-iPhone-Local.bat', launcher_bat)
    z.writestr('02-iPhone-iOS-App/Run-iPhone-Local.sh', launcher_sh)
    z.writestr('02-iPhone-iOS-App/README-IPHONE.txt', iphone_readme)
    
    # Computer Program Folder
    z.write('downloads/GeoSurvey-Civil3D-Standalone.html', '03-Civil3D-Computer-Program/GeoSurvey-Civil3D-Standalone.html')
    z.write('downloads/GeoSurvey-Civil3D-Workstation.hta', '03-Civil3D-Computer-Program/GeoSurvey-Civil3D-Workstation.hta')
    z.write('downloads/Launch-Civil3D-Desktop.vbs', '03-Civil3D-Computer-Program/Launch-Civil3D-Desktop.vbs')
    z.writestr('03-Civil3D-Computer-Program/Start-Civil3D-Workstation.bat', start_pc_bat)
    z.writestr('03-Civil3D-Computer-Program/Start-Civil3D-Workstation.sh', start_pc_sh)
    z.writestr('03-Civil3D-Computer-Program/README-CIVIL3D.txt', desktop_readme)
    
    # Shared Assets and Samples
    add_dir_to_zip(z, 'assets', 'shared-assets')
    add_dir_to_zip(z, 'samples', 'survey-samples')
    
    master_readme = '''======================================================================
GEOSURVEY PRO - COMPLETE 3-PLATFORM SOFTWARE SUITE
======================================================================
Tested and verified for field crews, office CAD drafters, and surveying teams.
Branded with the JSI Kissimmee logo icon.

INCLUDED ENTITIES:
1. 01-Android-Field-App/
   - GeoSurvey-Android-Standalone.html (Offline standalone app)
   - Topcon FC-6000 hardware styling, RTK HUD, 3/4 canvas, 1/4 AIM chat.

2. 02-iPhone-iOS-App/
   - GeoSurvey-iPhone-Standalone.html (Offline iOS standalone app)
   - GeoSurvey-Pro-iOS.mobileconfig (1-Tap direct iPhone home screen installer)
   - iPhone 16 Pro styling, Dynamic Island live RTK status, SF Pro typography.

3. 03-Civil3D-Computer-Program/
   - GeoSurvey-Civil3D-Workstation.hta (Native Windows Application window)
   - GeoSurvey-Civil3D-Standalone.html (Offline desktop software for PC/Mac)
   - Start-Civil3D-Workstation.bat & .vbs (Launches in borderless app window)
   - Autodesk Civil 3D 2026 drafting ribbon, command line, docked AIM chat.

HOW TO TEST:
Each folder is completely standalone. Simply double-click the standalone HTML or
executable in any folder to run immediately with 0 installation or configuration!
'''
    z.writestr('MASTER-TESTING-GUIDE.txt', master_readme)
print('Updated:', master_zip_path, os.path.getsize(master_zip_path))
print('All downloads built successfully!')
