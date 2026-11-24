# GeoSurvey Pro: Land Surveying Field Notes & Live AIM CAD Communication

A fully functioning Android application built for **Land Surveying** to replace paper field notes, establish an authentic live AOL Instant Messenger (AIM) style communication link connecting office CAD operators and field crews, track jobs and comprehensive checklists of what has been done and what is left to do, and provide a simplistic survey linework tool with full AutoCAD DXF, CSV, and GeoJSON upload and download.

---

## 🌟 Core System Capabilities

### 1. 💬 Live AIM Chat Linking CAD Operators & Field Crew (Front & Center)
* **Real-Time Cross-Team Instant Messaging**:
  * Seamless communication linking CAD drafters in the office (Civil 3D plat drafting, traverse resolution, deed comparison) with field crews (Party Chief, Instrument Operator, Rodperson recovering boundary pins and staking points).
  * Built on HTML5 `BroadcastChannel('survey_aim_channel')` and `localStorage` events for genuine real-time cross-tab and cross-device communication.
* **Authentic Retro AIM Experience**:
  * Running buddy icon, Windows XP/2000 title bar, minimize/maximize/close controls, and the iconic yellow running man mascot.
  * **Synthesized Web Audio API Sound Effects**: AIM incoming IM chime, message sent whoosh, door open (buddy sign-on), door slam (buddy sign-off), and total station RTK beeps.
  * **Buddy List**:
    * *CAD Office Drafters*: `AutoCAD_Dave` (Senior CAD Drafter), `Civil3D_Sarah` (Office Surveyor / SIT), `Office_PM_Frank`.
    * *Field Survey Crews*: `FieldCrew1_Mike` (Party Chief - Rover 1).
    * *Automated Systems*: `SurveyBot` (Automated traverse closure and code checker).
  * **Survey Quick Actions in Chat**:
    * `🎯 Request Shot`: Office drafter asks for specific boundary pins, benchmark check-ins, or invert depths.
    * `📍 Send Point`: Field crew transmits interactive coordinate badges (`PT #10 IP FND SW N:10050.00 E:10050.00 Elev:685.20`); clicking zooms the linework canvas directly to that point.
    * `📐 Share Linework`: Instant broadcast of traced survey linework to the office CAD team.
    * `Warn Button`: Authentic AIM warning percentage meter.
    * `Set Away`: Customizable away messages (*"Away: Running traverse loop through brush on Lot 14"*).

### 2. 📒 Digital Field Notes Replacement (The Surveyor's Field Book)
* **Classic 2-Page Yellow Grid Transit & Level Book Spread**:
  * **Left Page (Tabular Data & Differential Level Loop)**:
    * Columns: Station / Point, Backsight ($BS +$), Height of Instrument ($H.I.$), Foresight ($FS -$), Elevation (ft), and Remarks/Feature Codes.
    * **Automated Page Check**: Computes $\sum BS - \sum FS = \text{End Elev} - \text{Start Elev}$ and confirms arithmetic accuracy in real-time.
    * **Loop Misclosure Check**: Automatically compares loop closure error against allowable tolerances (Second-Order Class II: $\pm 0.024\text{ ft}$).
  * **Right Page (Crew, Weather, Instrument & Sketches)**:
    * Party Chief, Instrument Operator, Rodperson, and Recorder notes.
    * Weather conditions: Temperature, wind speed/direction, barometric pressure.
    * Instrument check: Collimation check, optical plummet, and tribrach bubble verification.
    * Interactive **10-foot grid field sketch canvas** with draw and clear tools.
* **🔄 Traverse Loop Balancing (Compass Rule / Bowditch)**:
  * Computes total perimeter distance, misclosure in North ($\Delta N$) and East ($\Delta E$), linear error, and precision ratio ($1:28,400$) exceeding Class A boundary standards ($> 1:10,000$), displaying balanced coordinates.
* **📍 Boundary Monument Recovery Sheet**:
  * Corner monument descriptions (found 5/8" and 1/2" iron rods, caps, physical condition), record plat vs. measured distance/bearing comparisons, and water meter clearance verification.
* **🎯 Construction Stakeout Navigator**:
  * Real-time guidance to any target boundary pin or hub with cardinal direction prompts (`GO NORTH 12.4 ft, GO WEST 3.1 ft`), cut/fill elevation delta (`FILL +0.42 ft` / `CUT -0.28 ft`), and a visual target bullseye.
* **📷 Field Photos & 🎙️ Voice Notes**:
  * Attach watermarked monument recovery photos (with compass azimuth and timestamp) and record spoken audio field memos.
* **Print / PDF Export**: One-click printable surveyor's field book report.

### 3. 📋 Jobs & Checklist Tracker (Done vs. What's Left to Do)
* **Survey Project Management**:
  * Project overview: Job Number (e.g. `#2026-104`), Client, Address, Datum (`NAD83 / NAVD88`), Party Chief, and CAD Drafter.
  * Switch between active projects or create new survey jobs.
* **Multi-Phase Survey Checklist**:
  * **Phase 1: Pre-Field & Research** (Deed & plat research, NGS benchmark recovery, coordinate file setup).
  * **Phase 2: Field Control & Recon** (Traverse hubs, GPS RTK base calibration, benchmark check-in).
  * **Phase 3: Field Data Collection** (Boundary corner recovery, road centerline & EOP topo, building ties, utility rim & invert dips).
  * **Phase 4: Office CAD Drafting** (Traverse closure adjustment, linework generation, deed vs. measured comparison).
  * **Phase 5: Deliverables & QA/QC** (PLS seal, signed boundary plat, DWG delivery, client invoice).
* **Live Progress & Filters**:
  * Real-time progress bar (% complete).
  * Filters for **All Tasks**, **⏳ Left To Do**, and **✅ Completed**.
  * Filter by category and assignment badges (`🖥️ CAD` vs `👷 Field`).

### 4. 📐 Simplistic Survey Linework Tool (with Upload & Download)
* **Simplistic & Purpose-Built for Field Surveying**:
  * Clean survey layers:
    * 🔴 **Boundary** (Property lines & corners)
    * 🟡 **Centerline** (Road centerline)
    * ⚪ **EOP / Curb** (Edge of pavement)
    * 🟣 **Building** (House & structure footprint)
    * 🔵 **Utilities** (Water, gas, electric, sewer locates)
  * Simple Tools:
    * `〰️ Draw Line`: Tap points to trace survey linework, then tap *Finish Line*.
    * `📍 Add Point`: Tap to drop a new survey point with code.
    * `📐 Inverse / Bearing`: Instant inverse calculation of quadrant bearing, horizontal distance, and elevation delta (COGO).
    * `✋ Pan` and `👆 Select / Inspect`.
  * **💬 "Send to Office CAD"**: Transmit drawn linework to the CAD office over AIM with one click.
* **Upload & Download Capabilities**:
  * **Upload DXF**: Import AutoCAD / Civil 3D linework directly into the canvas.
  * **Upload CSV**: Import PNEZD coordinate point files.
  * **Download DXF**: Generates standard AutoCAD Release 12 / 2000 ASCII DXF.
  * **Download CSV**: Standard PNEZD coordinate export.
  * **Download GeoJSON**: GIS vector feature collection export.

### 5. 📱 Android Native Experience & Device Modes
* **📱 Android Mobile Mode**: Pixel phone frame with status bar, 5G signal, GNSS RTK fixed badge, and bottom navigation.
* **📟 Rugged Tablet Mode**: Panasonic Toughbook / Trimble TDC600 field collector layout.
* **🖥️ Office CAD Station Mode**: Side-by-side desktop view.
* **🕶️ Sunlight Mode**: High-contrast outdoor visibility.
* **Offline Operation**: [`sw.js`](file:///home/agent/workspace/sw.js) service worker and [`manifest.json`](file:///home/agent/workspace/manifest.json) ensure the app works in remote tracts without cellular service.
