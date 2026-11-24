# GeoSurvey SUE Pro: Live Office-Field AIM Chat, Field Notes & SUE Linework

A fully functioning Android application built specifically for **Land Surveying & Subsurface Utility Engineering (SUE)**. Purpose-built to replace paper field notes, establish a live AOL Instant Messenger (AIM) style communication link between CAD operators and field crews, track jobs and checklists of what has been done and what is left to do, and provide a simplistic SUE linework drawing tool with full DXF/CSV/GeoJSON upload and download.

---

## 🌟 Key Capabilities

### 1. 💬 Live AIM Chat Linking CAD Operators & Field Crew (Primary Focus)
* **Real-Time Cross-Team Communication**: Direct instant messaging linking office CAD technicians (drafting in Civil 3D) and field crews (potholing utilities and taking shots).
* **Authentic Retro AIM Interface**:
  * Running buddy icon, Windows XP/2000 title bar, minimize/maximize/close controls, and the iconic yellow running man mascot.
  * **Synthesized Web Audio API Sound Effects**: AIM incoming IM chime, message sent whoosh, door open (buddy sign-on), door slam (buddy sign-off), and total station RTK beeps.
  * **Buddy List**:
    * *CAD Office Drafters*: `AutoCAD_Dave` (Senior CAD/Civil 3D), `Civil3D_Sarah` (SUE Coordinator), `Office_PM_Frank`.
    * *Field Survey Crews*: `FieldCrew1_Mike` (Party Chief / SUE Lead).
    * *Automated Systems*: `SurveyBot` (Automated SUE QA/QC).
  * **Real-Time Multi-Tab / Multi-Device Sync**: Powered by HTML5 `BroadcastChannel('survey_aim_channel')` and `localStorage` events. Open two tabs to test live two-way chat!
  * **SUE Quick Actions in Chat**:
    * `🎯 Request Shot`: Office drafter asks for pothole depths or invert shots.
    * `📍 Send Point`: Sends interactive coordinate badges with depths (`TH-1 4" Steel Gas Depth 3.42'`); clicking zooms directly to that point.
    * `📐 Share Linework`: Transmits SUE utility linework runs directly to the office.
    * `Warn Button`: Classic AIM warning level percentage meter.
    * `Set Away`: Customizable away messages (*"Away: Air-vac potholing gas main on Lot 14"*).

### 2. 📒 Digital Field Notes Replacement (SUE Test Holes & Level Book)
* **SUE Quality Level A Test Hole (Pothole) Logs**:
  * Record Test Hole ID, utility type, owner, depth to top of pipe, pipe diameter/OD, material (Steel, Ductile Iron, PVC, PE), ground elevation, utility invert elevation, soil type, and pavement cut.
  * One-touch "Send to CAD Office" button to transmit verified depths directly into AIM.
* **Differential Level Loop (2-Page Yellow Grid Book Spread)**:
  * Columns: Station, Backsight ($BS +$), Height of Instrument ($H.I.$), Foresight ($FS -$), Elevation, and Remarks.
  * **Automated Page Check**: Computes $\sum BS - \sum FS = \text{End Elev} - \text{Start Elev}$ and confirms arithmetic accuracy.
  * **Loop Misclosure Check**: Automatically validates error against allowable limits.
* **Monument & Boundary Notes**: Track recovered iron pins, deed vs. measured ties, and water meter conflicts.
* **Field Sketch Canvas**: 10-foot grid sketch pad with draw and clear tools.
* **Printable / PDF Export**: Clean printable field book report via browser print.

### 3. ⚡ Simplistic SUE Linework Drawing Tool (with Upload & Download)
* **Purpose-Built for Subsurface Utility Engineering (SUE)**:
  * Standard APWA Color-Coded Utilities:
    * 🔵 **Water** (Blue)
    * 🟡 **Gas** (Yellow dashed)
    * 🔴 **Electric / Power** (Red)
    * 🟠 **Telecom / Fiber** (Orange dashed)
    * 🟢 **Sanitary Sewer** (Green)
    * 🟦 **Storm Drain** (Cyan dashed)
  * Simplistic Tools:
    * `〰️ Trace Utility`: Simple point-to-point utility run tracing.
    * `🕳️ Add Test Hole`: Drop SUE vacuum pothole with depth and pipe size prompts.
    * `📐 Clearance`: Instant inverse measurement of clearance distance, bearing, and elevation delta.
    * `✋ Pan` and `👆 Select`.
* **Linework Upload & Download**:
  * **Upload DXF**: Import AutoCAD DXF linework directly into the canvas.
  * **Upload CSV**: Import PNEZD coordinate point files.
  * **Download DXF**: Generates standard AutoCAD Release 12 / 2000 ASCII DXF with APWA layers.
  * **Download CSV**: Exports standard PNEZD coordinate file.
  * **Download GeoJSON**: Standard vector features for GIS integration.
  * **Send to Office CAD**: Transmit drawn SUE linework to office drafters over AIM with one click!

### 4. 📋 Jobs & Checklist Tracker (Done vs. What's Left to Do)
* **SUE Project Tracking**: Job #, client, address, datum, Party Chief, and CAD Drafter.
* **Multi-Phase Checklist**:
  * Pre-Field (811 One-Call confirmation, utility record maps).
  * Field Operations (Level B electromagnetic designate, Level A vacuum excavation, boundary pins, level loops).
  * Office CAD (Process SUE linework, utility conflict matrix, Civil 3D profile).
  * Deliverables & QA/QC (ASCE 38-22 quality certification, PLS seal).
* Filter by **All Tasks**, **⏳ Left To Do**, and **✅ Completed**.

### 5. 📱 Android Native Experience
* **📱 Android Phone Mode**: Google Pixel frame with Android status bar, Material 3 styling, and bottom navigation.
* **📟 Rugged Field Tablet Mode**: Panasonic Toughbook / Trimble TDC600 rugged data collector view.
* **🖥️ Office CAD Station Mode**: Desktop layout with side-by-side workflow.
* **🕶️ Outdoor Sunlight Mode**: High-contrast outdoor view.
* **PWA Service Worker (`sw.js`) & Manifest (`manifest.json`)**: Offline capability in remote survey tracts.
