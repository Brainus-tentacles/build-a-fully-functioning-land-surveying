# GeoSurvey Android Pro: Field Notes, AIM CAD Chat & Linework

A fully functioning land surveying Android application designed to replace paper field notes, establish a live AOL Instant Messenger (AIM) style chat linking CAD operators and field crews, track jobs and interactive checklists of what has been done and what is left to do, and provide a full-featured 2D CAD canvas for drawing, uploading, and downloading survey linework.

---

## 🌟 Key Capabilities

### 1. 📒 Digital Field Notes Replacement (Transit & Level Book)
- **Authentic 2-Page Yellow Grid Book Spread**:
  - **Left Page (Tabular Data & Differential Level Loop)**:
    - Columns: Station / Point, Backsight (BS +), Height of Instrument (H.I.), Foresight (FS -), Elevation (ft), Remarks/Feature Code.
    - **Automated Math Check & Page Check**: Computes $\sum \text{BS} - \sum \text{FS} = \text{End Elev} - \text{Start Elev}$ and confirms arithmetic validity.
    - **Loop Misclosure Error**: Computes closure error against standard allowable limits (e.g. Second-Order Class II: $\pm 0.024\text{ ft}$).
  - **Right Page (Sketches, Crew & Instrument)**:
    - Crew records: Party Chief, Instrument Operator, Rodperson, Notes recorder.
    - Weather conditions: Temperature, wind speed/direction, barometric pressure.
    - Instrument check: Collimation check, optical plummet, tribrach bubble verification.
    - Interactive 10-foot grid **Field Sketch Canvas** for monument ties, fence intersections, and building corners.
    - Detailed remarks and monument recovery notes.
  - **Print / PDF Export**: Generate printable surveyor's field book sheets with one click.

### 2. 🏃 Live AOL Instant Messenger (AIM) Linking CAD & Field Crew
- **Nostalgic High-Fidelity AIM Interface**:
  - Iconic yellow running man mascot and authentic Windows XP / 2000 title bars and window chrome.
  - **Web Audio API Synthesizer**: Authentic AIM incoming IM chime, message sent whoosh, door open (buddy sign-on), door slam (buddy sign-off), and survey RTK shot beeps!
  - **Buddy List**:
    - *CAD Office Drafters*: `AutoCAD_Dave`, `Civil3D_Sarah`, `Office_PM_Frank`.
    - *Field Survey Crews*: `FieldCrew1_Mike` (Party Chief).
    - *Automated QC*: `SurveyBot` (Checks linework closures and coordinate datum).
  - **Cross-Role Live Identity Switcher**: Switch between **Field Chief** and **CAD Operator** with one click, or open the app in two separate browser tabs with native **`BroadcastChannel`** real-time 2-way instant messaging!
  - **Survey Actions inside Chat**:
    - `Request Shot`: CAD operators can request shots on missing property pins or utility inverts.
    - `Send Point`: Sends an interactive coordinate badge (`PT #10 IP FND SW N:10050.00 E:10050.00 Elev:685.20`) directly into the chat; clicking zooms the CAD canvas directly to that point!
    - `Send Inverse`: Broadcasts calculated quadrant bearing (e.g. `N 45° 12' 30" E`), horizontal distance, and elevation grade.
    - `Warn Button`: Classic AIM warning level percentage meter.
    - Formatting toolbar: Bold, Italic, Underline, text color palette, and classic emoticons `:-)` `:-P` `B-)`.

### 3. 📋 Jobs & Checklist Tracker (Done vs. What's Left to Do)
- **Active Job Management**:
  - Project numbers (e.g. `#2026-104`), client details, project address, reference datum (`NAD83 / NAVD88`), assigned Party Chief, and CAD Drafter.
  - Switch between active jobs or create new projects.
- **Multi-Phase Survey Checklist**:
  - **Phase 1: Pre-Field & Research** (Deed research, plat maps, NGS benchmark recovery, control project setup).
  - **Phase 2: Field Control & Recon** (Traverse hubs, GPS RTK base calibration, check-in to benchmark).
  - **Phase 3: Field Data Collection** (Boundary corner recovery, road centerline & EOP topo, utility rim/invert dips, building corners).
  - **Phase 4: Office CAD Drafting** (Traverse closure adjustment, linework generation, deed vs. measured comparison).
  - **Phase 5: Deliverables & QA/QC** (PLS seal, signed boundary plat, DWG delivery, client invoice).
- **Live Progress & Filters**:
  - Real-time progress bar (% complete).
  - Quick filter chips: **All Tasks**, **⏳ Left To Do**, **✅ Completed**.
  - Category filters and crew assignment badges (`🖥️ CAD` vs `👷 Field`).
  - Completing tasks automatically logs updates to the AIM chat and plays sound confirmation.

### 4. 📐 CAD Linework Drawing Canvas & COGO Engine
- **Full 2D Coordinate Engine**:
  - True survey convention: Northing is UP (+Y), Easting is RIGHT (+X).
  - Fluid multi-touch pan, pinch-to-zoom, mouse wheel zoom, and fit-extents (`⛶ Extents`).
  - Coordinate tick grid, Dynamic Scale Bar (feet), and Compass North Arrow.
- **Drawing Tools**:
  - `Line`: 2-point straight line segment.
  - `Polyline`: Continuous multi-segment line with live bearing & distance readouts.
  - `Parcel`: Closed boundary polygon with **automatic acreage & square footage calculation**!
  - `Arc / Curve`: 3-point curve for roadway centerlines and cul-de-sacs.
  - `Point`: Click to drop a new coordinate survey point.
  - `Measure (Inverse COGO)`: Calculates quadrant bearing, horizontal distance, slope distance, $\Delta N$, $\Delta E$, and grade (%).
  - `Freehand Sketch`: Quick red-line field notes directly on the drawing.
- **Layer Manager**:
  - `BOUNDARY` (Red, 2.5pt)
  - `CENTERLINE` (Yellow dashed, 2.0pt)
  - `EOP_CURB` (Edge of pavement slate, 1.8pt)
  - `BUILDING` (Purple footprint, 2.0pt)
  - `UTILITIES_WATER` (Blue, 2.0pt)
  - `UTILITIES_SEWER` (Green dashed, 2.0pt)
  - `UTILITIES_STORM` (Cyan, 2.0pt)
  - `FIELD_SKETCHES` (Orange, 1.5pt)
  - `POINTS` (Point ID, Elevation, and Code labels)
- **⚡ Field-to-Finish Auto-Drafting**:
  - Automatically parses point codes with survey linework suffixes (e.g. `EP1 B`, `EP1`, `EP1 E`, `CL1`, `BLDG1`) and connects them into CAD lines with one click!

### 5. 📥 Uploading & 📤 Downloading Linework & Points
- **AutoCAD DXF Import & Export**:
  - **Export DXF**: Generates standard ASCII DXF Release 12 / 2000 files with `HEADER`, `TABLES` (Layer table with standard AutoCAD ACI colors), and `ENTITIES` (`LINE`, `POLYLINE`, `POINT`, `TEXT`). Fully compatible with AutoCAD, Civil 3D, Carlson Survey, Trimble Business Center, MicroStation, and QGIS!
  - **Import DXF**: Built-in parser extracts 2D lines, polylines, and points from uploaded DXF files directly into the survey canvas.
- **CSV / ASCII Point File Import & Export**:
  - **Export CSV**: Exports standard $P, N, E, Z, D$ survey coordinate files.
  - **Import CSV**: Auto-detects comma, tab, or whitespace delimited coordinate files and imports them into the active survey database.

### 6. 📱 Android Native Experience & Device Modes
- **📱 Android Phone Mode**: Authentic Google Pixel frame with Android status bar (5G, battery 98%, time), Material 3 styling, and bottom navigation bar.
- **📟 Rugged Field Tablet Mode**: Panasonic Toughbook / Trimble TDC600 rugged data collector view.
- **🖥️ CAD Office Workstation Mode**: Multi-pane split screen view with CAD canvas, coordinate tables, and docked AIM messenger.
- **🕶️ Outdoor High-Contrast Sunlight Mode**: High-contrast palette designed for bright outdoor job sites.
- **GNSS RTK Engine**: Real-time simulated RTK rover with Fixed/Float status, PDOP/HDOP, RMS errors, and optional browser HTML5 Geolocation sync.
- **PWA Service Worker (`sw.js`)**: Offline support so crews can work without cellular reception in remote survey tracts.

---

## 📂 Project Structure

```
├── index.html              # Main single-page application & Android viewport container
├── manifest.json           # Android PWA web app manifest
├── sw.js                   # Service Worker for offline field caching
├── assets/
│   └── icon.svg            # Total Station & survey prism application icon
├── css/
│   ├── styles.css          # Base Android Material 3 theme & device viewports
│   ├── aim.css             # Authentic AOL Instant Messenger 90s/2000s styling
│   ├── cad.css             # CAD linework canvas, toolbox, layers & inspector
│   └── fieldbook.css       # Yellow survey transit field book & checklist styles
├── js/
│   ├── sample-data.js      # Realistic Oak Ridge Estates boundary & topo dataset
│   ├── audio.js            # Web Audio API synthesizer for AIM & survey beeps
│   ├── points.js           # Survey point manager & COGO inverse engine
│   ├── cad-engine.js       # 2D CAD canvas, drawing tools & point snapping
│   ├── dxf.js              # Full AutoCAD DXF & CSV import/export manager
│   ├── fieldbook.js        # Digital field notes & differential level loop solver
│   ├── jobs.js             # Jobs manager & multi-phase checklist tracker
│   ├── aim-chat.js         # AIM live chat with BroadcastChannel multi-tab sync
│   └── app.js              # Application controller & viewport switcher
└── samples/
    ├── SAMPLE_BOUNDARY_LOT14.dxf   # Sample AutoCAD DXF survey drawing
    └── SAMPLE_FIELD_POINTS.csv     # Sample PNEZD 42-point coordinate file
```
