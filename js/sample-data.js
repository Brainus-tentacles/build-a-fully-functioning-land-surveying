// Land Surveying Dataset: Topcon & Sokkia MAGNET Field to Autodesk Civil 3D Workflow
window.SAMPLE_DATA = {
  jobs: [
    {
      id: "JOB-2026-104",
      number: "2026-104",
      name: "Oak Ridge Estates - Boundary & Topo (Civil 3D & MAGNET Field)",
      client: "Highland Development Partners, LLC",
      location: "Lot 14, Blk 3, Oak Ridge Subd, Travis County, TX",
      datum: "NAD83 Texas Central (US Survey Feet) / NAVD88",
      dateCreated: "2026-11-20",
      status: "In Progress",
      partyChief: "Mike Kowalski (RPLS #5421)",
      cadOperator: "Dave Vance (Senior Civil 3D Drafter)",
      hardware: {
        tablet: "Topcon FC-6000 Rugged Field Tablet (Windows/Android)",
        software: "MAGNET Field v8.2",
        gpsRover: "Topcon HiPer VR Triple-Frequency GNSS (TopNET Live VRS)",
        totalStation: "Sokkia iX-1200 1\" Robotic Total Station",
        cadOffice: "Autodesk Civil 3D 2026 (Survey Database)"
      },
      weather: "72°F, Clear skies, Wind 4mph S, Baro 30.08 inHg",
      progress: 75,
      checklist: [
        { id: "c1", category: "Pre-Field", title: "Create Civil 3D Survey Project & Coordinate System", done: true, assignedTo: "Civil 3D Office", notes: "Grid TX83-CF (Texas Central Zone). Civil 3D Survey Database initialized." },
        { id: "c2", category: "Pre-Field", title: "Export Control Coordinates to MAGNET Field (.mjf / .csv)", done: true, assignedTo: "Civil 3D Office", notes: "Transferred control file 2026-104-CTRL.csv to Topcon FC-6000 via MAGNET Enterprise cloud." },
        { id: "c3", category: "Pre-Field", title: "Recover TxDOT / NGS Control Benchmark (BM-1)", done: true, assignedTo: "Field Crew", notes: "Found TXDOT brass disc BM-1 elevation 685.50' in culvert headwall." },
        { id: "c4", category: "Field Operations", title: "Set Traverse Control Hubs with Sokkia iX Robotic (CP1 - CP4)", done: true, assignedTo: "Field Crew", notes: "Set 5/8\" rebar with Topcon yellow caps stamped RPLS 5421." },
        { id: "c5", category: "Field Operations", title: "Topcon HiPer VR Base-Rover / TopNET Live VRS Calibration Check", done: true, assignedTo: "Field Crew", notes: "Checked into BM-1: Delta N=0.008', Delta E=0.005', Delta Z=0.007'. OK!" },
        { id: "c6", category: "Field Operations", title: "Recover Boundary Corner Monuments (Lot 14 NW, NE, SE, SW)", done: true, assignedTo: "Field Crew", notes: "Recovered 5/8\" IP at NW, NE, SE corners. Recovered 1/2\" IP at SW corner. Clear of water meter." },
        { id: "c7", category: "Field Operations", title: "3-Wire Differential Level Loop for Vertical Datum Verification", done: true, assignedTo: "Field Crew", notes: "Closed loop on BM-1 within -0.004 ft. Page check math passed." },
        { id: "c8", category: "Field Operations", title: "MAGNET Field Linework Coding (CL1, EP1, BLDG1, UTIL)", done: true, assignedTo: "Field Crew", notes: "Collected feature codes with MAGNET linework tags (EP1 B, EP1, EP1 E)." },
        { id: "c9", category: "Office CAD", title: "Import MAGNET Field RAW / RW5 into Civil 3D Survey DB", done: false, assignedTo: "Civil 3D Office", notes: "Awaiting final raw observation file from field tablet." },
        { id: "c10", category: "Office CAD", title: "Civil 3D Field-to-Finish Linework Code Set Generation", done: false, assignedTo: "Civil 3D Office", notes: "Process figure prefix database and survey figures in Civil 3D." },
        { id: "c11", category: "Office CAD", title: "Traverse Angular & Compass Rule Balancing Adjustment", done: true, assignedTo: "Civil 3D Office", notes: "Civil 3D traverse analysis: 1:28,400 precision ratio." },
        { id: "c12", category: "Deliverables & QA", title: "Quality Review & Boundary Certification by RPLS", done: false, assignedTo: "Civil 3D Office", notes: "Awaiting final plat check." },
        { id: "c13", category: "Deliverables & QA", title: "Export Signed Boundary Plat PDF & Civil 3D DWG/DXF", done: false, assignedTo: "Civil 3D Office", notes: "Scheduled for client delivery Friday." }
      ]
    },
    {
      id: "JOB-2026-105",
      number: "2026-105",
      name: "Highway 42 Right-of-Way & Alignment Survey",
      client: "County Transportation Authority",
      location: "FM 42 between Mileposts 14 and 16, Bastrop, TX",
      datum: "NAD83 Texas Central / NAVD88",
      dateCreated: "2026-11-22",
      status: "Scheduled",
      partyChief: "Jake Martinez (SIT #1092)",
      cadOperator: "Sarah Connor (Civil 3D Office)",
      hardware: {
        tablet: "Sokkia SHC6000 Tablet",
        software: "MAGNET Field v8.2",
        gpsRover: "Sokkia GRX3 GNSS Receiver",
        totalStation: "Topcon GT-1200 Robotic",
        cadOffice: "Autodesk Civil 3D 2026"
      },
      weather: "68°F, Overcast",
      progress: 20,
      checklist: [
        { id: "c201", category: "Pre-Field", title: "Acquire TxDOT alignment stationing and XML surfaces", done: true, assignedTo: "Civil 3D Office", notes: "Loaded centerline alignment into Civil 3D." },
        { id: "c202", category: "Field Operations", title: "Topcon HiPer VR Network RTK Base Initialization", done: false, assignedTo: "Field Crew", notes: "Scheduled for tomorrow." }
      ]
    }
  ],

  // 36 Survey Points with Civil 3D & MAGNET Field Raw Descriptions
  points: [
    // Control Points & Benchmarks
    { id: 1, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "CP1", desc: "PK NAIL IN ASPH CONTROL POINT 1", hi: 5.12, hr: 5.00, type: "CTRL", locked: true },
    { id: 2, northing: 10245.80, easting: 10185.35, elevation: 688.15, code: "CP2", desc: "1/2IN IR W/ TOPCON CAP RPLS 5421", hi: 5.10, hr: 5.00, type: "CTRL", locked: true },
    { id: 3, northing: 10398.22, easting: 10450.10, elevation: 691.40, code: "CP3", desc: "1/2IN IR W/ TOPCON CAP RPLS 5421", hi: 5.05, hr: 5.00, type: "CTRL", locked: true },
    { id: 4, northing: 10120.45, easting: 10510.60, elevation: 687.90, code: "CP4", desc: "MAG NAIL IN CONC COLLAR", hi: 5.15, hr: 5.00, type: "CTRL", locked: true },
    { id: 5, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "BM-1", desc: "TXDOT BRASS DISC IN CULVERT HW", hi: 4.80, hr: 4.50, type: "BM", locked: true },

    // Boundary Monuments (Lot 14 Property Corners)
    { id: 10, northing: 10050.00, easting: 10050.00, elevation: 685.20, code: "IP FND SW", desc: "FND 1/2IN IR SW COR LOT 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 11, northing: 10450.00, easting: 10050.00, elevation: 690.80, code: "IP FND NW", desc: "FND 5/8IN IR NW COR LOT 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 12, northing: 10450.00, easting: 10550.00, elevation: 692.10, code: "IP FND NE", desc: "FND 5/8IN IR W/ ILLEGIBLE CAP NE COR", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 13, northing: 10050.00, easting: 10550.00, elevation: 686.40, code: "IP FND SE", desc: "FND 1/2IN IR SE COR LOT 14", hi: 5.12, hr: 5.00, type: "BNDY" },

    // Road Centerline (MAGNET Field Code: CL1)
    { id: 20, northing: 10020.00, easting: 9980.00, elevation: 684.10, code: "CL1 B", desc: "CENTERLINE ROAD BEGIN", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 21, northing: 10180.00, easting: 9985.00, elevation: 686.30, code: "CL1", desc: "CENTERLINE ROAD", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 22, northing: 10340.00, easting: 9988.00, elevation: 688.70, code: "CL1", desc: "CENTERLINE ROAD", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 23, northing: 10480.00, easting: 9992.00, elevation: 690.40, code: "CL1 E", desc: "CENTERLINE ROAD END", hi: 5.12, hr: 5.00, type: "ROAD" },

    // East Edge of Pavement (MAGNET Field Code: EP1)
    { id: 24, northing: 10020.00, easting: 10005.00, elevation: 684.35, code: "EP1 B", desc: "EDGE OF PAVEMENT EAST BEGIN", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 25, northing: 10180.00, easting: 10010.00, elevation: 686.55, code: "EP1", desc: "EDGE OF PAVEMENT EAST", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 26, northing: 10340.00, easting: 10013.00, elevation: 688.95, code: "EP1", desc: "EDGE OF PAVEMENT EAST", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 27, northing: 10480.00, easting: 10017.00, elevation: 690.65, code: "EP1 E", desc: "EDGE OF PAVEMENT EAST END", hi: 5.12, hr: 5.00, type: "ROAD" },

    // West Edge of Pavement (MAGNET Field Code: EP2)
    { id: 28, northing: 10020.00, easting: 9955.00, elevation: 683.85, code: "EP2 B", desc: "EDGE OF PAVEMENT WEST BEGIN", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 29, northing: 10180.00, easting: 9960.00, elevation: 686.05, code: "EP2", desc: "EDGE OF PAVEMENT WEST", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 30, northing: 10340.00, easting: 9963.00, elevation: 688.45, code: "EP2", desc: "EDGE OF PAVEMENT WEST", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 31, northing: 10480.00, easting: 9967.00, elevation: 690.15, code: "EP2 E", desc: "EDGE OF PAVEMENT WEST END", hi: 5.12, hr: 5.00, type: "ROAD" },

    // Building Footprint (MAGNET Field Code: BLDG1)
    { id: 40, northing: 10220.00, easting: 10200.00, elevation: 690.50, code: "BLDG1 B", desc: "RESIDENCE SW COR", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 41, northing: 10280.00, easting: 10200.00, elevation: 690.55, code: "BLDG1", desc: "RESIDENCE NW COR", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 42, northing: 10280.00, easting: 10260.00, elevation: 690.60, code: "BLDG1", desc: "RESIDENCE NE COR", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 43, northing: 10220.00, easting: 10260.00, elevation: 690.50, code: "BLDG1 E", desc: "RESIDENCE SE COR", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 44, northing: 10250.00, easting: 10200.00, elevation: 691.35, code: "FFE", desc: "FINISHED FLOOR ELEV FRONT PORCH", hi: 5.12, hr: 5.00, type: "BLDG" },

    // Utilities & Topo
    { id: 50, northing: 10100.00, easting: 10025.00, elevation: 685.10, code: "WM", desc: "WATER METER BOX TOP (2.1FT W OF IP)", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 51, northing: 10250.00, easting: 10030.00, elevation: 687.20, code: "WV", desc: "WATER VALVE IN LID", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 52, northing: 10400.00, easting: 10035.00, elevation: 689.80, code: "FH", desc: "FIRE HYDRANT FLANGE", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 53, northing: 10080.00, easting: 10000.00, elevation: 684.50, code: "MH SAN", desc: "SANITARY SEWER RIM INVERT=675.30", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 54, northing: 10320.00, easting: 10008.00, elevation: 687.90, code: "MH SAN", desc: "SANITARY SEWER RIM INVERT=678.90", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 55, northing: 10150.00, easting: 10012.00, elevation: 685.80, code: "CB STM", desc: "STORM INLET RIM INVERT=681.20", hi: 5.12, hr: 5.00, type: "UTIL" },

    // Trees & Fences
    { id: 60, northing: 10150.00, easting: 10150.00, elevation: 687.40, code: "TREE 36 LIVE OAK", desc: "36IN LIVE OAK CANOPY 42FT", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 61, northing: 10350.00, easting: 10180.00, elevation: 690.10, code: "TREE 24 POST OAK", desc: "24IN POST OAK CANOPY 28FT", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 62, northing: 10110.00, easting: 10400.00, elevation: 687.10, code: "FENCE B", desc: "WOOD PRIVACY FENCE CORNER", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 63, northing: 10380.00, easting: 10410.00, elevation: 690.80, code: "FENCE E", desc: "WOOD PRIVACY FENCE CORNER", hi: 5.12, hr: 5.00, type: "TOPO" }
  ],

  // Linework (Mapped directly to Autodesk Civil 3D Layers)
  linework: [
    {
      id: "line-bndy-1",
      layer: "V-PROP-LINE",
      type: "polygon",
      name: "Lot 14 Property Boundary (4.591 Acres)",
      color: "#ef4444",
      lineWidth: 2.5,
      closed: true,
      points: [
        { id: 10, n: 10050.00, e: 10050.00, z: 685.20 },
        { id: 11, n: 10450.00, e: 10050.00, z: 690.80 },
        { id: 12, n: 10450.00, e: 10550.00, z: 692.10 },
        { id: 13, n: 10050.00, e: 10550.00, z: 686.40 }
      ]
    },
    {
      id: "line-cl-1",
      layer: "V-ROAD-CNTR",
      type: "polyline",
      name: "County Road 104 Centerline",
      color: "#eab308",
      lineWidth: 2.0,
      dash: [8, 4],
      points: [
        { id: 20, n: 10020.00, e: 9980.00, z: 684.10 },
        { id: 21, n: 10180.00, e: 9985.00, z: 686.30 },
        { id: 22, n: 10340.00, e: 9988.00, z: 688.70 },
        { id: 23, n: 10480.00, e: 9992.00, z: 690.40 }
      ]
    },
    {
      id: "line-ep-1",
      layer: "V-ROAD-CURB",
      type: "polyline",
      name: "East Edge of Asphalt",
      color: "#94a3b8",
      lineWidth: 1.8,
      points: [
        { id: 24, n: 10020.00, e: 10005.00, z: 684.35 },
        { id: 25, n: 10180.00, e: 10010.00, z: 686.55 },
        { id: 26, n: 10340.00, e: 10013.00, z: 688.95 },
        { id: 27, n: 10480.00, e: 10017.00, z: 690.65 }
      ]
    },
    {
      id: "line-bldg-1",
      layer: "V-BLDG",
      type: "polygon",
      name: "Residential Brick Footprint",
      color: "#a855f7",
      lineWidth: 2.0,
      closed: true,
      points: [
        { id: 40, n: 10220.00, e: 10200.00, z: 690.50 },
        { id: 41, n: 10280.00, e: 10200.00, z: 690.55 },
        { id: 42, n: 10280.00, e: 10260.00, z: 690.60 },
        { id: 43, n: 10220.00, e: 10260.00, z: 690.50 }
      ]
    },
    {
      id: "line-water-1",
      layer: "V-UTIL-WATR",
      type: "polyline",
      name: "8\" Water Main Locate",
      color: "#0284c7",
      lineWidth: 2.0,
      dash: [12, 4],
      points: [
        { id: 50, n: 10100.00, e: 10025.00, z: 685.10 },
        { id: 51, n: 10250.00, e: 10030.00, z: 687.20 },
        { id: 52, n: 10400.00, e: 10035.00, z: 689.80 }
      ]
    },
    {
      id: "line-fence-1",
      layer: "V-SITE-FENC",
      type: "polyline",
      name: "Wood Privacy Fence",
      color: "#f97316",
      lineWidth: 1.5,
      points: [
        { id: 62, n: 10110.00, e: 10400.00, z: 687.10 },
        { id: 63, n: 10380.00, e: 10410.00, z: 690.80 }
      ]
    }
  ],

  // Digital Field Notes: Transit & Differential Level Book
  fieldNotes: {
    pageNumber: 42,
    bookNumber: "FB-2026-08",
    projectName: "Oak Ridge Estates - Lot 14 Boundary & Topo",
    date: "2026-11-23",
    crew: {
      partyChief: "Mike Kowalski, RPLS #5421",
      instrument: "Lisa Ray (Instrument Operator)",
      rodperson: "Tom Miller (Rodperson)",
      notesBy: "M.K."
    },
    hardware: {
      tablet: "Topcon FC-6000 (SN 884190)",
      gps: "Topcon HiPer VR Triple-Frequency GNSS",
      robot: "Sokkia iX-1200 Robotic Total Station",
      software: "MAGNET Field v8.2"
    },
    weather: {
      temp: "72°F",
      conditions: "Clear & Sunny, wind 5mph S",
      pressure: "30.08 inHg"
    },
    instrumentCheck: {
      model: "Sokkia iX-1200 1\" Robotic & Topcon HiPer VR",
      collimationCheck: "PASSED (0°00'02\")",
      opticalPlummet: "CHECKED",
      tribrachBubble: "CHECKED"
    },
    levelLoop: [
      { station: "BM-1", bs: 4.821, hi: 690.321, fs: null, elev: 685.500, remarks: "TxDOT Brass Disc on Culvert Headwall" },
      { station: "TP-1", bs: 5.114, hi: 692.205, fs: 3.230, elev: 687.091, remarks: "Turning Pin in oak tree root" },
      { station: "CP-2", bs: 4.602, hi: 692.752, fs: 4.055, elev: 688.150, remarks: "1/2\" Iron Rod Control Point 2" },
      { station: "TP-2", bs: 3.890, hi: 693.382, fs: 3.260, elev: 689.492, remarks: "Turning Pin in firm gravel" },
      { station: "BM-1", bs: null, hi: null, fs: 7.886, elev: 685.496, remarks: "Closing on BM-1. Error = -0.004 ft. OK!" }
    ],
    monuments: [
      { corner: "Lot 14 NW Corner", physicalDesc: "Found 5/8\" Iron Rod flush with grade", northing: 10450.00, easting: 10050.00, elevation: 690.80, comparison: "N 00°00'00\" E 400.00' (Matches record)", status: "Recovered" },
      { corner: "Lot 14 NE Corner", physicalDesc: "Found 5/8\" Iron Rod w/ illegible plastic cap", northing: 10450.00, easting: 10550.00, elevation: 692.10, comparison: "N 90°00'00\" E 500.00' (Matches record)", status: "Recovered" },
      { corner: "Lot 14 SE Corner", physicalDesc: "Found 1/2\" Iron Rod in tree root", northing: 10050.00, easting: 10550.00, elevation: 686.40, comparison: "S 00°00'00\" W 400.00' (Matches record)", status: "Recovered" },
      { corner: "Lot 14 SW Corner", physicalDesc: "Found 1/2\" Iron Rod (Water meter 2.1' W in ROW)", northing: 10050.00, easting: 10050.00, elevation: 685.20, comparison: "S 90°00'00\" W 500.00' (Conflict cleared)", status: "Recovered" }
    ],
    remarks: "Established boundary control with Sokkia iX robotic on CP1 and CP2, verified with Topcon HiPer VR GNSS on TopNET Live VRS. Set 5/8\" rebar with Topcon yellow caps stamped RPLS 5421 where monuments were missing. Boundary corners match 1984 subdivision plat within 0.12'. Water meter vault found 2.1' west of SW iron pin in road ROW. Invert dips on sanitary sewer and storm catch basin completed. Transmitted MAGNET Field raw observations to Civil 3D office."
  },

  // Live AOL Instant Messenger linking Civil 3D Office & Topcon/Sokkia Field Crew
  aim: {
    currentUser: {
      screenName: "TopconCrew_Mike",
      alias: "Mike (Party Chief - Topcon FC-6000)",
      role: "field",
      status: "Available",
      statusMsg: "MAGNET Field v8.2 Running on Topcon FC-6000 • HiPer VR Fixed",
      warningLevel: 0
    },
    buddies: [
      {
        screenName: "Civil3D_Dave",
        alias: "Dave (Senior Civil 3D Drafter)",
        role: "cad",
        status: "online",
        statusMsg: "Civil 3D 2026 Survey Database Open - Send MAGNET Raw!",
        warningLevel: 0,
        unread: 1
      },
      {
        screenName: "Civil3D_Sarah",
        alias: "Sarah (Office Surveyor / SIT)",
        role: "cad",
        status: "online",
        statusMsg: "Running Civil 3D traverse loop adjustment",
        warningLevel: 0,
        unread: 0
      },
      {
        screenName: "Office_PM_Frank",
        alias: "Frank (Project Manager / RPLS)",
        role: "office",
        status: "away",
        statusMsg: "Away: County Commissioners Court hearing",
        warningLevel: 5,
        unread: 0
      },
      {
        screenName: "TopconCrew_Mike",
        alias: "Mike (Party Chief - Topcon FC-6000)",
        role: "field",
        status: "online",
        statusMsg: "MAGNET Field v8.2 • Topcon HiPer VR Fixed",
        warningLevel: 0,
        unread: 0
      },
      {
        screenName: "MagnetBot",
        alias: "MagnetBot (MAGNET Field to Civil 3D Sync)",
        role: "bot",
        status: "online",
        statusMsg: "Auto-translating MAGNET .rw5 to Civil 3D .fbk",
        warningLevel: 0,
        unread: 0
      }
    ],
    messages: [
      {
        id: "m1",
        from: "Civil3D_Dave",
        to: "TopconCrew_Mike",
        time: "08:15 AM",
        text: "Morning Mike! I have the Civil 3D 2026 drawing open with the 1984 record plat xref. Did you load the control file into MAGNET Field on the FC-6000?"
      },
      {
        id: "m2",
        from: "TopconCrew_Mike",
        to: "Civil3D_Dave",
        time: "08:18 AM",
        text: "Morning Dave! Yes, imported 2026-104-CTRL.csv into MAGNET Field. Topcon HiPer VR rover is initialized on TopNET Live VRS with 24 sats, HRMS 0.011 ft. Sokkia iX robot is set up on CP1."
      },
      {
        id: "m3",
        from: "Civil3D_Dave",
        to: "TopconCrew_Mike",
        time: "08:24 AM",
        text: "Great. When you locate Point #10 (SW corner), check if the city water meter encroaches over the property line. The record plat shows an easement conflict."
      },
      {
        id: "m4",
        from: "TopconCrew_Mike",
        to: "Civil3D_Dave",
        time: "08:42 AM",
        text: "Just shot Point #10 (IP FND SW) at N: 10050.00, E: 10050.00, Z: 685.20. Found 1/2\" iron rod flush with grade. The water meter is 2.1 feet west of the pin inside the road ROW, so the lot is completely clear!"
      },
      {
        id: "m5",
        from: "Civil3D_Dave",
        to: "TopconCrew_Mike",
        time: "08:50 AM",
        text: "Perfect! I'm creating the Civil 3D survey figure for V-PROP-LINE now. Shoot the road centerline (CL1) and edge of pavement (EP1) using your MAGNET Field linework codes so Civil 3D auto-drafts the breaklines."
      }
    ]
  }
};
