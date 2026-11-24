# GeoSurvey Pro: Topcon & Sokkia MAGNET Field • Civil 3D CAD Link

A functioning cross-platform land surveying software ecosystem consisting of three dedicated entities built for field crews and CAD drafters:

1. 🤖 **[Android App (`android.html`)](file:///home/agent/workspace/android.html)**: Field controller edition designed for Topcon FC-6000 / FC-6400 and Sokkia SHC6000 tablets running MAGNET Field v8.2 with Material 3 styling and GNSS RTK HUD.
2. 🍎 **[iPhone App (`iphone.html`)](file:///home/agent/workspace/iphone.html)**: iOS edition designed for Apple iPhone 16/15 Pro with Dynamic Island, Apple Human Interface Guidelines, Cupertino tab navigation, and touch-optimized surveying.
3. 🖥️ **[Computer Program (`desktop.html`)](file:///home/agent/workspace/desktop.html)**: Autodesk Civil 3D 2026 Office Workstation desktop software with Windows titlebar, classic menubar, survey ribbon, AutoCAD command line prompt, and docked live AIM Field link.
4. 🌐 **[Suite Hub (`index.html`)](file:///home/agent/workspace/index.html)**: Integrated master portal that allows toggling between all three entities in real time with shared synchronization.

---

## Core System Capabilities

### 1. Live AIM Chat Linking Civil 3D Office & Field Crew
* **Real-Time Cross-Team Instant Messaging**: Links Civil 3D office drafters (`Civil3D_Dave`, `Civil3D_Sarah`, `Office_PM_Frank`) with field crews (`TopconCrew_Mike`) and automated sync (`MagnetBot`) over HTML5 `BroadcastChannel('survey_aim_channel')` and `localStorage` events.
* **Authentic Retro AIM Experience**: Classic XP/2000 frame, buddy list, role switcher (`Field Chief` vs `Civil 3D CAD`), warn meter, away messages, and synthesized Web Audio API sound effects.
* **Survey Quick Actions in Chat**:
  * `🎯 Req Shot`: Request specific boundary pins, benchmarks, or invert shots.
  * `📍 Send Pt`: Send clickable coordinate badges (`PT #10 IP FND SW`) that zoom directly to the point on the canvas.
  * `📏 Linework`: Share linework overlay summaries with Civil 3D layer tags.
  * `📤 .RW5` / `📤 .FBK`: Transmit downloadable Topcon/Sokkia MAGNET Field `.RW5` or Civil 3D `.FBK` packets right inside chat.

### 2. Digital Field Notes Replacement (The Surveyor's Field Book)
* **Classic 2-Page Yellow Grid Transit & Level Book Spread**: Differential level loop (`BS`, `HI`, `FS`, `Elev`) with automated page check ($\sum BS - \sum FS = \text{End Elev} - \text{Start Elev}$) and loop misclosure verification, plus editable crew, weather, collimation check, active Topcon/Sokkia hardware metadata, and 10-ft grid sketch canvas.
* **Traverse Loop Balancing (Compass Rule / Bowditch)**: Perimeter, $\Delta N$, $\Delta E$, linear misclosure, precision ratio (`1:28,400`), and balanced coordinates.
* **Boundary Monument Recovery Sheet**: Dynamic table comparing found/set monuments against record plat calls with `+ Log Monument`.
* **Construction Stakeout Navigator**: Cardinal movement directions, cut/fill elevation delta, bullseye indicator, and one-tap `Record As Staked`.
* **Field Photos & Voice Memos**: Timestamped monument photos and audio field memos.

### 3. Jobs & Checklist Tracker (Done vs. What's Left To Do)
* Tracks active projects (`#2026-104 Oak Ridge Estates`, `#2026-105 Highway 42 ROW`), Topcon/Sokkia & Civil 3D hardware chips, multi-phase checklist (`Pre-Field`, `Field Operations`, `Office CAD`, `Deliverables & QA`), progress bar, and filters (`All`, `Left To Do`, `Completed`).

### 4. Survey Linework Tool, MAGNET Field Coding & Civil 3D Exchange
* **MAGNET Field Auto-Lines**: Parses MAGNET Field coding conventions (`EP1 B` / `EP1 E` / `EP1+` / `EP1-` / `B EP1` / `CLS` / `BC` / `EC`) into Civil 3D NCS layers (`V-PROP-LINE`, `V-ROAD-CNTR`, `V-ROAD-CURB`, `V-BLDG`, `V-UTIL-WATR`, `V-SITE-FENC`).
* **Interactive Civil 3D Layer Control**: Toggle visibility and view feature counts per layer.
* **MAGNET Field Quick Shot Modal**: Touch-friendly code picker (`IP FND`, `CL1 B`, `EP1`, `BLDG1`, `MH SAN`, `WM`, `TREE`, etc.) with rod/prism height and optional AIM broadcast.
* **Full Import & Export**:
  * **Import**: AutoCAD/Civil 3D `.DXF` (`LINE`, `POINT`, `POLYLINE`, `LWPOLYLINE`), PNEZD `.CSV`/`.TXT`, Topcon/Sokkia MAGNET Field `.RW5`/`.RAW`, and Civil 3D Field Book `.FBK`.
  * **Export**: Civil 3D NCS-layered `.DXF`, Civil 3D Survey Database `.FBK` (including `CR NEZ`, `NEZ`, and `BEG`/`CONT`/`CLOSE`/`END` Survey Figures), Topcon/Sokkia MAGNET Field `.RW5`, PNEZD `.CSV`, and `.GeoJSON`.

### 5. Topcon & Sokkia Hardware Kit + Device Modes
* **Equipment Kit Configurator (`⚙️ Gear Kit`)**: Switch between **Topcon FC-6000 / FC-6400** and **Sokkia SHC6000 / SHC6400** tablets, **Topcon HiPer VR / HR** and **Sokkia GRX3 / GCX3** GNSS receivers, **Sokkia iX-1200** and **Topcon GT-1200** robotic total stations, and toggle **GNSS RTK** vs **Robotic TS** mode.
* **Viewport Modes**: Android Phone, Rugged Tablet (Topcon yellow or Sokkia gunmetal bumper), Civil 3D Office Workstation, and Outdoor Sunlight Mode.
* **Offline PWA**: Cached via [`sw.js`](file:///home/agent/workspace/sw.js) and [`manifest.json`](file:///home/agent/workspace/manifest.json).
