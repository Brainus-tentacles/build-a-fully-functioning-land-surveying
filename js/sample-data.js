// Comprehensive Land Surveying Dataset
// Oak Ridge Estates Boundary & Topographic Survey
window.SAMPLE_DATA = {
  jobs: [
    {
      id: "JOB-2026-104",
      number: "2026-104",
      name: "Oak Ridge Estates - Boundary & Topographic Survey",
      client: "Highland Development Partners, LLC",
      location: "Lot 14, Blk 3, Oak Ridge Subd, Travis County, TX",
      datum: "NAD83 Texas Central (US Survey Feet) / NAVD88",
      dateCreated: "2026-11-20",
      status: "In Progress",
      partyChief: "Mike Kowalski (RPLS #5421)",
      cadOperator: "AutoCAD Dave (Office Civil 3D)",
      instrument: "Trimble S7 3\" Robotic Total Station & R12i GNSS",
      weather: "72°F, Clear skies, Wind 4mph S, Baro 30.08 inHg",
      progress: 72,
      checklist: [
        { id: "c1", category: "Pre-Field", title: "Deed & Plat Research at Travis County Clerk", done: true, assignedTo: "CAD Office", notes: "Vol 142, Pg 88 Deed of Trust reviewed. Adjoiner deeds checked." },
        { id: "c2", category: "Pre-Field", title: "Recover TxDOT / NGS Control Benchmark (BM-1)", done: true, assignedTo: "Field Crew", notes: "Found TXDOT brass disc BM-1 elevation 685.50' in culvert headwall." },
        { id: "c3", category: "Pre-Field", title: "Load Control & Boundary Calcs into Data Collector", done: true, assignedTo: "CAD Office", notes: "Exported project coordinate file 2026-104-CTRL.csv" },
        { id: "c4", category: "Field Operations", title: "Set Traverse Control Hubs (CP1, CP2, CP3, CP4)", done: true, assignedTo: "Field Crew", notes: "5/8\" iron rods with yellow plastic caps stamped RPLS 5421 set." },
        { id: "c5", category: "Field Operations", title: "Recover Boundary Corner Monuments (Lot 14 NW, NE, SE, SW)", done: true, assignedTo: "Field Crew", notes: "Found 5/8\" IP at NW, NE, SE corners. Found 1/2\" IP at SW corner 2.1' east of meter." },
        { id: "c6", category: "Field Operations", title: "Run 3-Wire Differential Level Loop for BM verification", done: true, assignedTo: "Field Crew", notes: "Closed level loop on BM-1 within -0.004 ft (Allowable: 0.024 ft). Page check passed." },
        { id: "c7", category: "Field Operations", title: "Topographic Grid & Breaklines (Edge of Pavement, Centerline)", done: true, assignedTo: "Field Crew", notes: "Shot road centerline and both edges of pavement with codes CL1 and EP1." },
        { id: "c8", category: "Field Operations", title: "Locate Surface Utilities & Invert Dips (Water, Sewer, Storm, Gas)", done: true, assignedTo: "Field Crew", notes: "Sanitary sewer MH-1 invert 675.30', storm catch basin invert 681.20'." },
        { id: "c9", category: "Field Operations", title: "Building Footprint & Finished Floor Elevation Ties", done: true, assignedTo: "Field Crew", notes: "Shot 4 corners of residential brick structure + FFE 691.35'." },
        { id: "c10", category: "Office CAD", title: "Traverse Angular & Compass Rule Closure Adjustment", done: true, assignedTo: "CAD Office", notes: "Traverse precision 1:28,400. Balanced coordinates stored." },
        { id: "c11", category: "Office CAD", title: "Field-to-Finish Linework Generation & Boundary Resolution", done: false, assignedTo: "CAD Office", notes: "Resolving deed calls vs measured boundary corners." },
        { id: "c12", category: "Office CAD", title: "Boundary Resolution & Deed vs Measured Comparison", done: false, assignedTo: "CAD Office", notes: "West line shows 0.14' excess over 1984 record plat. Consistent with block monuments." },
        { id: "c13", category: "Deliverables & QA", title: "Quality Review & Boundary Certification by RPLS", done: false, assignedTo: "CAD Office", notes: "Awaiting final CAD plat review." },
        { id: "c14", category: "Deliverables & QA", title: "Signed & Sealed Boundary Plat PDF + Civil 3D DWG", done: false, assignedTo: "CAD Office", notes: "Scheduled for client delivery Friday." }
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
      cadOperator: "Civil3D Sarah (Office)",
      instrument: "Leica TS16 Robotic + GS18T Rover",
      weather: "68°F, Overcast",
      progress: 25,
      checklist: [
        { id: "c201", category: "Pre-Field", title: "Acquire ROW strip maps and NGS control sheets", done: true, assignedTo: "CAD Office", notes: "Loaded TxDOT alignment stations." },
        { id: "c202", category: "Field Operations", title: "Establish GPS RTK Base on NGS Brass Disc", done: false, assignedTo: "Field Crew", notes: "Scheduled for field crew tomorrow." },
        { id: "c203", category: "Field Operations", title: "Shoot ROW monuments and boundary pins", done: false, assignedTo: "Field Crew", notes: "Locate all highway boundary markers." }
      ]
    }
  ],

  // 36 Realistic Land Survey Shots
  points: [
    // Control Points & Benchmarks
    { id: 1, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "CP1", desc: "PK Nail in asphalt Control Point 1", hi: 5.12, hr: 5.00, type: "CTRL", locked: true },
    { id: 2, northing: 10245.80, easting: 10185.35, elevation: 688.15, code: "CP2", desc: "1/2\" Iron Rod w/ cap RPLS 5421", hi: 5.10, hr: 5.00, type: "CTRL", locked: true },
    { id: 3, northing: 10398.22, easting: 10450.10, elevation: 691.40, code: "CP3", desc: "1/2\" Iron Rod w/ cap RPLS 5421", hi: 5.05, hr: 5.00, type: "CTRL", locked: true },
    { id: 4, northing: 10120.45, easting: 10510.60, elevation: 687.90, code: "CP4", desc: "Mag Nail in concrete collar", hi: 5.15, hr: 5.00, type: "CTRL", locked: true },
    { id: 5, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "BM-1", desc: "TxDOT Brass Disc in culvert headwall", hi: 4.80, hr: 4.50, type: "BM", locked: true },

    // Boundary Monuments (Lot 14)
    { id: 10, northing: 10050.00, easting: 10050.00, elevation: 685.20, code: "IP FND SW", desc: "Found 1/2\" Iron Rod SW corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 11, northing: 10450.00, easting: 10050.00, elevation: 690.80, code: "IP FND NW", desc: "Found 5/8\" Iron Rod NW corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 12, northing: 10450.00, easting: 10550.00, elevation: 692.10, code: "IP FND NE", desc: "Found 5/8\" Iron Rod w/ illegible cap NE corner", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 13, northing: 10050.00, easting: 10550.00, elevation: 686.40, code: "IP FND SE", desc: "Found 1/2\" Iron Rod SE corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },

    // Road Centerline
    { id: 20, northing: 10020.00, easting: 9980.00, elevation: 684.10, code: "CL1 B", desc: "Centerline asphalt road begin", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 21, northing: 10180.00, easting: 9985.00, elevation: 686.30, code: "CL1", desc: "Centerline asphalt road", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 22, northing: 10340.00, easting: 9988.00, elevation: 688.70, code: "CL1", desc: "Centerline asphalt road", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 23, northing: 10480.00, easting: 9992.00, elevation: 690.40, code: "CL1 E", desc: "Centerline asphalt road end", hi: 5.12, hr: 5.00, type: "ROAD" },

    // East Edge of Pavement
    { id: 24, northing: 10020.00, easting: 10005.00, elevation: 684.35, code: "EP1 B", desc: "Edge of pavement East begin", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 25, northing: 10180.00, easting: 10010.00, elevation: 686.55, code: "EP1", desc: "Edge of pavement East", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 26, northing: 10340.00, easting: 10013.00, elevation: 688.95, code: "EP1", desc: "Edge of pavement East", hi: 5.12, hr: 5.00, type: "ROAD" },
    { id: 27, northing: 10480.00, easting: 10017.00, elevation: 690.65, code: "EP1 E", desc: "Edge of pavement East end", hi: 5.12, hr: 5.00, type: "ROAD" },

    // Building Footprint
    { id: 40, northing: 10220.00, easting: 10200.00, elevation: 690.50, code: "BLDG1 B", desc: "Brick residence SW corner", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 41, northing: 10280.00, easting: 10200.00, elevation: 690.55, code: "BLDG1", desc: "Brick residence NW corner", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 42, northing: 10280.00, easting: 10260.00, elevation: 690.60, code: "BLDG1", desc: "Brick residence NE corner", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 43, northing: 10220.00, easting: 10260.00, elevation: 690.50, code: "BLDG1 E", desc: "Brick residence SE corner", hi: 5.12, hr: 5.00, type: "BLDG" },
    { id: 44, northing: 10250.00, easting: 10200.00, elevation: 691.35, code: "FFE", desc: "Finished floor elevation front porch", hi: 5.12, hr: 5.00, type: "BLDG" },

    // Utilities & Topo Features
    { id: 50, northing: 10100.00, easting: 10025.00, elevation: 685.10, code: "WM", desc: "Water meter box top (2.1' W of IP)", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 51, northing: 10250.00, easting: 10030.00, elevation: 687.20, code: "WV", desc: "Water gate valve in lid", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 52, northing: 10400.00, easting: 10035.00, elevation: 689.80, code: "FH", desc: "Fire Hydrant flange elevation", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 53, northing: 10080.00, easting: 10000.00, elevation: 684.50, code: "MH SAN", desc: "Sanitary sewer rim. Invert = 675.30", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 54, northing: 10320.00, easting: 10008.00, elevation: 687.90, code: "MH SAN", desc: "Sanitary sewer rim. Invert = 678.90", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 55, northing: 10150.00, easting: 10012.00, elevation: 685.80, code: "CB STM", desc: "Curb inlet catch basin rim. Invert = 681.20", hi: 5.12, hr: 5.00, type: "UTIL" },

    // Trees & Boundary Fence
    { id: 60, northing: 10150.00, easting: 10150.00, elevation: 687.40, code: "TREE 36 LIVE OAK", desc: "36\" Live Oak canopy 42'", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 61, northing: 10350.00, easting: 10180.00, elevation: 690.10, code: "TREE 24 POST OAK", desc: "24\" Post Oak canopy 28'", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 62, northing: 10110.00, easting: 10400.00, elevation: 687.10, code: "FENCE B", desc: "Wood privacy fence corner", hi: 5.12, hr: 5.00, type: "TOPO" },
    { id: 63, northing: 10380.00, easting: 10410.00, elevation: 690.80, code: "FENCE E", desc: "Wood privacy fence corner", hi: 5.12, hr: 5.00, type: "TOPO" }
  ],

  // Simplistic Survey Linework (Boundary, Road, Building, Utilities, Fence)
  linework: [
    {
      id: "line-bndy-1",
      layer: "BOUNDARY",
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
      layer: "CENTERLINE",
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
      layer: "EOP_CURB",
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
      layer: "BUILDING",
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
      id: "line-util-1",
      layer: "UTILITIES",
      type: "polyline",
      name: "8\" Water Main & Locate",
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
      layer: "FIELD_SKETCHES",
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

  // Digital Field Notes (Transit notes, Level loop, monument recoveries)
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
    weather: {
      temp: "72°F",
      conditions: "Clear & Sunny, wind 5mph S",
      pressure: "30.08 inHg"
    },
    instrumentCheck: {
      model: "Trimble S7 Robotic (SN 884190) & R12i GNSS",
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
    remarks: "Established boundary control using static GPS on CP1 and CP2, verified with NGS OPUS solution. Set 5/8\" rebar with yellow caps stamped RPLS 5421 on property corners where monuments were missing. Boundary corners match 1984 subdivision plat within 0.12'. Water meter vault found 2.1' west of SW iron pin in road ROW. Invert dips on sanitary sewer and storm catch basin completed. Transmitted shots and linework to office CAD."
  },

  // Live AOL Instant Messenger linking CAD Office & Field Crew
  aim: {
    currentUser: {
      screenName: "FieldCrew1_Mike",
      alias: "Mike (Party Chief - Rover 1)",
      role: "field",
      status: "Available",
      statusMsg: "On site @ Oak Ridge Lot 14 - Total Station Active",
      warningLevel: 0
    },
    buddies: [
      {
        screenName: "AutoCAD_Dave",
        alias: "Dave (Senior CAD Drafter)",
        role: "cad",
        status: "online",
        statusMsg: "Drafting Civil 3D Lot 14 Plat - Send shots!",
        warningLevel: 0,
        unread: 1
      },
      {
        screenName: "Civil3D_Sarah",
        alias: "Sarah (Office Surveyor / SIT)",
        role: "cad",
        status: "online",
        statusMsg: "Checking traverse closure & deed calls",
        warningLevel: 0,
        unread: 0
      },
      {
        screenName: "Office_PM_Frank",
        alias: "Frank (Project Manager / RPLS)",
        role: "office",
        status: "away",
        statusMsg: "Away: Travis County Commissioners Court",
        warningLevel: 5,
        unread: 0
      },
      {
        screenName: "SurveyBot",
        alias: "SurveyBot (Automated QC)",
        role: "bot",
        status: "online",
        statusMsg: "Checking traverse closure & point codes",
        warningLevel: 0,
        unread: 0
      }
    ],
    messages: [
      {
        id: "m1",
        from: "AutoCAD_Dave",
        to: "FieldCrew1_Mike",
        time: "08:15 AM",
        text: "Morning Mike! I have the 1984 subdivision plat loaded in Civil 3D for Job #2026-104. Are you on site yet?"
      },
      {
        id: "m2",
        from: "FieldCrew1_Mike",
        to: "AutoCAD_Dave",
        time: "08:18 AM",
        text: "Morning Dave! Yes, backsight initialized on BM-1 and traverse hubs CP1-CP4 set. We just recovered the NE and SE boundary iron pins."
      },
      {
        id: "m3",
        from: "AutoCAD_Dave",
        to: "FieldCrew1_Mike",
        time: "08:24 AM",
        text: "Awesome. When you get to the SW corner, check out the water meter box—the 1984 plat indicates an easement conflict near Point #10."
      },
      {
        id: "m4",
        from: "FieldCrew1_Mike",
        to: "AutoCAD_Dave",
        time: "08:42 AM",
        text: "Just shot Point #10 (IP FND SW) at N: 10050.00, E: 10050.00, Z: 685.20. Found 1/2\" iron rod flush with grade. The water meter is 2.1 feet west of the pin inside the road ROW, so the lot is completely clear!"
      },
      {
        id: "m5",
        from: "AutoCAD_Dave",
        to: "FieldCrew1_Mike",
        time: "08:50 AM",
        text: "That is great news! I will snap the property boundary line to Point #10. Can you shoot the invert dips on the sanitary sewer manholes along County Road 104 next?"
      }
    ]
  }
};
