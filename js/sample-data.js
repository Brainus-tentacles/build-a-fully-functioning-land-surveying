// Sample survey & SUE (Subsurface Utility Engineering) dataset
window.SAMPLE_DATA = {
  jobs: [
    {
      id: "JOB-2026-104",
      number: "2026-104",
      name: "Oak Ridge Estates - SUE Utility Mapping & Boundary",
      client: "Highland Development Partners / Municipal Utility District",
      location: "Lot 14, Blk 3, Oak Ridge Subd, Travis County, TX",
      datum: "NAD83 Texas Central (US Survey Feet) / NAVD88",
      dateCreated: "2026-11-20",
      status: "In Progress",
      partyChief: "Mike Kowalski (RPLS / SUE Lead)",
      cadOperator: "AutoCAD Dave (Office Civil 3D)",
      instrument: "Vivax vLoc3-Pro Locator, Trimble S7 & R12i GNSS",
      weather: "72°F, Clear skies, Wind 4mph S",
      progress: 72,
      checklist: [
        { id: "c1", category: "Pre-Field", title: "811 Texas One-Call Utility Ticket Confirmation", done: true, assignedTo: "CAD Office", notes: "Ticket #8849201 confirmed. All utility operators notified." },
        { id: "c2", category: "Pre-Field", title: "Collect Utility Record Maps (As-Builts, Gas & Water Plats)", done: true, assignedTo: "CAD Office", notes: "City 8\" water main plat and Atmos 4\" gas main drawings indexed." },
        { id: "c3", category: "Field Operations", title: "SUE Level B: Electromagnetic & GPR Utility Designate", done: true, assignedTo: "Field Crew", notes: "Painted gas (yellow), water (blue), and telecom (orange) along County Rd 104." },
        { id: "c4", category: "Field Operations", title: "SUE Level A: Vacuum Excavate Test Hole TH-1 (Gas Main)", done: true, assignedTo: "Field Crew", notes: "Potholed 4\" steel gas at depth 3.42 ft. Verified tracer wire." },
        { id: "c5", category: "Field Operations", title: "SUE Level A: Vacuum Excavate Test Hole TH-2 (Water Main)", done: true, assignedTo: "Field Crew", notes: "Potholed 8\" ductile iron water main at depth 4.85 ft." },
        { id: "c6", category: "Field Operations", title: "Shoot Utility Valves, Hydrants, Manholes & Inverts", done: true, assignedTo: "Field Crew", notes: "Sanitary MH-1 invert 675.30', Storm inlet invert 681.20'." },
        { id: "c7", category: "Field Operations", title: "Recover Boundary Corner Pins (Lot 14 NW, NE, SE, SW)", done: true, assignedTo: "Field Crew", notes: "Recovered 5/8\" IP at all four corners. SW corner cleared of water meter conflict." },
        { id: "c8", category: "Field Operations", title: "Differential Level Loop Verification on Benchmark BM-1", done: true, assignedTo: "Field Crew", notes: "Loop closed within -0.004 ft. Page check math passed." },
        { id: "c9", category: "Office CAD", title: "Process SUE Linework & Pothole Data into Civil 3D", done: false, assignedTo: "CAD Office", notes: "Currently overlaying Level B paint lines with test hole depths." },
        { id: "c10", category: "Office CAD", title: "Utility Conflict Matrix & Clearance Verification", done: false, assignedTo: "CAD Office", notes: "Checking clearance between proposed drainage box and 4\" gas main." },
        { id: "c11", category: "Deliverables & QA", title: "SUE Quality Level Certification (ASCE 38-22 Standards)", done: false, assignedTo: "CAD Office", notes: "Requires final PLS seal." },
        { id: "c12", category: "Deliverables & QA", title: "Deliver SUE Utility Drawing DXF & Field Book PDF", done: false, assignedTo: "CAD Office", notes: "Scheduled for client delivery Friday." }
      ]
    },
    {
      id: "JOB-2026-105",
      number: "2026-105",
      name: "Highway 42 Pipeline Conflict Investigation",
      client: "County Transportation Authority",
      location: "FM 42 between Mileposts 14 and 16, Bastrop, TX",
      datum: "NAD83 Texas Central / NAVD88",
      dateCreated: "2026-11-22",
      status: "Scheduled",
      partyChief: "Jake Martinez (SUE Tech)",
      cadOperator: "Civil3D Sarah (Office)",
      instrument: "Radio Detection RD8100 & Hydro-Vac Truck",
      weather: "68°F, Overcast",
      progress: 30,
      checklist: [
        { id: "c201", category: "Pre-Field", title: "Acquire pipeline ROW alignment sheets", done: true, assignedTo: "CAD Office", notes: "12\" high pressure petroleum pipeline alignment loaded." },
        { id: "c202", category: "Field Operations", title: "Inductive signal hookup on pipeline test station", done: false, assignedTo: "Field Crew", notes: "Scheduled for tomorrow 8:00 AM." },
        { id: "c203", category: "Field Operations", title: "Air-vac pothole verification at ditch line", done: false, assignedTo: "Field Crew", notes: "Target depth ~5.5 ft." }
      ]
    }
  ],

  // SUE Test Hole Records (Level A Vacuum Excavation)
  testHoles: [
    {
      id: "TH-1",
      pointId: 51,
      utilityType: "Gas (Atmos Energy)",
      qualityLevel: "Level A (Vacuum Pothole)",
      depthToTop: 3.42, // ft
      depthToBottom: 3.75, // ft
      diameter: "4-inch",
      material: "Coated Steel w/ Tracer Wire",
      soilType: "Firm Sandy Clay",
      pavementCut: "None (Dirt Shoulder)",
      groundElev: 687.20,
      utilityElev: 683.78,
      northing: 10250.00,
      easting: 10030.00,
      status: "Verified Clear",
      photos: ["photo-th1.jpg"],
      notes: "Vacuum excavated using air lance. Pipe in good condition with yellow coating. No cathodic protection conflict."
    },
    {
      id: "TH-2",
      pointId: 50,
      utilityType: "Water (Austin Water MUD)",
      qualityLevel: "Level A (Vacuum Pothole)",
      depthToTop: 4.85, // ft
      depthToBottom: 5.52, // ft
      diameter: "8-inch",
      material: "Ductile Iron Pipe (DIP)",
      soilType: "Moist Brown Clay",
      pavementCut: "Asphalt Core 12\"",
      groundElev: 685.10,
      utilityElev: 680.25,
      northing: 10100.00,
      easting: 10025.00,
      status: "Verified Clear",
      photos: ["photo-th2.jpg"],
      notes: "Polyethylene wrap intact. Water meter service tap 2.1 ft south."
    },
    {
      id: "TH-3",
      pointId: 52,
      utilityType: "Electric (Austin Energy)",
      qualityLevel: "Level A (Vacuum Pothole)",
      depthToTop: 2.80, // ft
      depthToBottom: 3.45, // ft
      diameter: "4-way Conduit",
      material: "Concrete Encased PVC Duct Bank",
      soilType: "Gravelly Loam",
      pavementCut: "Concrete Sidewalk",
      groundElev: 689.80,
      utilityElev: 687.00,
      northing: 10400.00,
      easting: 10035.00,
      status: "Verified Clear",
      photos: ["photo-th3.jpg"],
      notes: "Red warning tape found 1.0 ft below surface. 3-phase primary feeder line."
    }
  ],

  // Survey & SUE Coordinate Points
  points: [
    // Control & Benchmark
    { id: 1, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "CP1", desc: "PK Nail in asphalt, Control Point 1", hi: 5.12, hr: 5.00, type: "CTRL" },
    { id: 2, northing: 10245.80, easting: 10185.35, elevation: 688.15, code: "CP2", desc: "1/2\" Iron Rod w/ cap RPLS 5421", hi: 5.10, hr: 5.00, type: "CTRL" },
    { id: 3, northing: 10398.22, easting: 10450.10, elevation: 691.40, code: "CP3", desc: "1/2\" Iron Rod w/ cap RPLS 5421", hi: 5.05, hr: 5.00, type: "CTRL" },
    { id: 4, northing: 10120.45, easting: 10510.60, elevation: 687.90, code: "CP4", desc: "Mag Nail in concrete collar", hi: 5.15, hr: 5.00, type: "CTRL" },
    { id: 5, northing: 10000.00, easting: 10000.00, elevation: 685.50, code: "BM-1", desc: "TxDOT Brass Disc in culvert headwall", hi: 4.80, hr: 4.50, type: "BM" },

    // Boundary Monuments
    { id: 10, northing: 10050.00, easting: 10050.00, elevation: 685.20, code: "IP FND SW", desc: "Found 1/2\" Iron Rod SW corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 11, northing: 10450.00, easting: 10050.00, elevation: 690.80, code: "IP FND NW", desc: "Found 5/8\" Iron Rod NW corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 12, northing: 10450.00, easting: 10550.00, elevation: 692.10, code: "IP FND NE", desc: "Found 5/8\" Iron Rod NE corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },
    { id: 13, northing: 10050.00, easting: 10550.00, elevation: 686.40, code: "IP FND SE", desc: "Found 1/2\" Iron Rod SE corner Lot 14", hi: 5.12, hr: 5.00, type: "BNDY" },

    // SUE Utilities & Test Holes
    { id: 50, northing: 10100.00, easting: 10025.00, elevation: 685.10, code: "SUE TH-2 WATER", desc: "TH-2: 8\" DIP Water, Depth 4.85', Austin Water", hi: 5.12, hr: 5.00, type: "UTIL", depth: 4.85 },
    { id: 51, northing: 10250.00, easting: 10030.00, elevation: 687.20, code: "SUE TH-1 GAS", desc: "TH-1: 4\" Steel Gas, Depth 3.42', Atmos Energy", hi: 5.12, hr: 5.00, type: "UTIL", depth: 3.42 },
    { id: 52, northing: 10400.00, easting: 10035.00, elevation: 689.80, code: "SUE TH-3 ELEC", desc: "TH-3: 4-way Duct Bank, Depth 2.80', Austin Energy", hi: 5.12, hr: 5.00, type: "UTIL", depth: 2.80 },
    { id: 53, northing: 10080.00, easting: 10000.00, elevation: 684.50, code: "MH SAN", desc: "Sanitary sewer rim. Invert = 675.30 (fall 9.2')", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 54, northing: 10320.00, easting: 10008.00, elevation: 687.90, code: "MH SAN", desc: "Sanitary sewer rim. Invert = 678.90 (fall 9.0')", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 55, northing: 10150.00, easting: 10012.00, elevation: 685.80, code: "CB STM", desc: "Storm catch basin inlet. Invert = 681.20", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 56, northing: 10210.00, easting: 10028.00, elevation: 686.80, code: "SUE FIBER B", desc: "AT&T 144-strand Fiber Optic designate paint line", hi: 5.12, hr: 5.00, type: "UTIL" },
    { id: 57, northing: 10360.00, easting: 10032.00, elevation: 689.10, code: "SUE FIBER E", desc: "AT&T Fiber Optic pedestal tie", hi: 5.12, hr: 5.00, type: "UTIL" }
  ],

  // Simplistic SUE Utility Linework
  linework: [
    {
      id: "sue-water-1",
      layer: "UTILITIES_WATER",
      type: "polyline",
      name: "8\" Ductile Iron Water Main (SUE Level B/A)",
      color: "#0284c7", // APWA Blue
      utilityType: "Water",
      lineWidth: 2.5,
      points: [
        { id: 50, n: 10100.00, e: 10025.00, z: 685.10, depth: 4.85 },
        { id: 51, n: 10250.00, e: 10030.00, z: 687.20, depth: 4.90 },
        { id: 52, n: 10400.00, e: 10035.00, z: 689.80, depth: 4.82 }
      ]
    },
    {
      id: "sue-gas-1",
      layer: "UTILITIES_GAS",
      type: "polyline",
      name: "4\" Steel Gas Main (SUE Level A - TH-1)",
      color: "#eab308", // APWA Yellow
      utilityType: "Gas",
      lineWidth: 2.5,
      dash: [10, 4],
      points: [
        { id: 50, n: 10090.00, e: 10032.00, z: 685.00, depth: 3.50 },
        { id: 51, n: 10250.00, e: 10030.00, z: 687.20, depth: 3.42 },
        { id: 52, n: 10410.00, e: 10038.00, z: 689.90, depth: 3.45 }
      ]
    },
    {
      id: "sue-elec-1",
      layer: "UTILITIES_ELECTRIC",
      type: "polyline",
      name: "Electric 4-Way Duct Bank (SUE Level A - TH-3)",
      color: "#ef4444", // APWA Red
      utilityType: "Electric",
      lineWidth: 2.2,
      points: [
        { id: 50, n: 10070.00, e: 10040.00, z: 684.80, depth: 2.85 },
        { id: 52, n: 10400.00, e: 10035.00, z: 689.80, depth: 2.80 }
      ]
    },
    {
      id: "sue-telecom-1",
      layer: "UTILITIES_TELECOM",
      type: "polyline",
      name: "AT&T 144-Fiber Optic Line (SUE Level B)",
      color: "#f97316", // APWA Orange
      utilityType: "Telecom",
      lineWidth: 2.0,
      dash: [8, 3],
      points: [
        { id: 56, n: 10210.00, e: 10028.00, z: 686.80, depth: 2.50 },
        { id: 57, n: 10360.00, e: 10032.00, z: 689.10, depth: 2.50 }
      ]
    },
    {
      id: "sue-sewer-1",
      layer: "UTILITIES_SEWER",
      type: "polyline",
      name: "10\" Gravity Sanitary Sewer Line",
      color: "#22c55e", // APWA Green
      utilityType: "Sewer",
      lineWidth: 2.5,
      points: [
        { id: 53, n: 10080.00, e: 10000.00, z: 684.50, invert: 675.30 },
        { id: 54, n: 10320.00, e: 10008.00, z: 687.90, invert: 678.90 }
      ]
    },
    {
      id: "line-bndy-1",
      layer: "BOUNDARY",
      type: "polygon",
      name: "Lot 14 Property Boundary",
      color: "#ffffff",
      lineWidth: 1.5,
      closed: true,
      points: [
        { id: 10, n: 10050.00, e: 10050.00, z: 685.20 },
        { id: 11, n: 10450.00, e: 10050.00, z: 690.80 },
        { id: 12, n: 10450.00, e: 10550.00, z: 692.10 },
        { id: 13, n: 10050.00, e: 10550.00, z: 686.40 }
      ]
    }
  ],

  // Field Book pages (Transit notes, Level loop & SUE observations)
  fieldNotes: {
    pageNumber: 42,
    bookNumber: "FB-2026-08",
    projectName: "Oak Ridge Estates - SUE Investigation & Boundary",
    date: "2026-11-23",
    crew: {
      partyChief: "Mike Kowalski (RPLS / SUE Lead)",
      instrument: "Lisa Ray (SUE Tech)",
      rodperson: "Tom Miller (Hydro-Vac Operator)",
      notesBy: "M.K."
    },
    weather: {
      temp: "72°F",
      conditions: "Clear & Sunny, wind 5mph S",
      pressure: "30.08 inHg"
    },
    instrumentCheck: {
      model: "Trimble S7 Robotic (SN 884190) & Vivax vLoc3-Pro",
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
    remarks: "SUE Level B designate completed for water, gas, power and telecom. Potholed TH-1 on 4\" steel gas at depth 3.42' (ground elev 687.20, gas elev 683.78'). Potholed TH-2 on 8\" DIP water at depth 4.85'. Boundary corner pins recovered on all corners. Water meter conflict verified clear of property line. Transmitted SUE linework to CAD office."
  },

  // Live AOL Instant Messenger communication between Office and Field
  aim: {
    currentUser: {
      screenName: "FieldCrew1_Mike",
      alias: "Mike (Party Chief - Rover 1)",
      role: "field",
      status: "Available",
      statusMsg: "On site @ Oak Ridge - SUE Hydro-Vac Potholing",
      warningLevel: 0
    },
    buddies: [
      {
        screenName: "AutoCAD_Dave",
        alias: "Dave (Senior CAD / Civil 3D)",
        role: "cad",
        status: "online",
        statusMsg: "Civil 3D SUE Utility Model Open - Send depths!",
        warningLevel: 0,
        unread: 1
      },
      {
        screenName: "Civil3D_Sarah",
        alias: "Sarah (Office SUE Coordinator)",
        role: "cad",
        status: "online",
        statusMsg: "Checking 811 tickets & utility conflict matrix",
        warningLevel: 0,
        unread: 0
      },
      {
        screenName: "Office_PM_Frank",
        alias: "Frank (Project Manager / RPLS)",
        role: "office",
        status: "away",
        statusMsg: "Away: County Road Commissioner meeting",
        warningLevel: 5,
        unread: 0
      },
      {
        screenName: "SurveyBot",
        alias: "SurveyBot (SUE QC)",
        role: "bot",
        status: "online",
        statusMsg: "Auto-checking utility depths & ASCE 38-22 QA",
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
        text: "Morning Mike! The design team wants to know the exact clearance between the proposed storm culvert and the Atmos gas main near County Road 104. Can you vacuum excavate Test Hole TH-1?"
      },
      {
        id: "m2",
        from: "FieldCrew1_Mike",
        to: "AutoCAD_Dave",
        time: "08:28 AM",
        text: "Morning Dave! Air-vac crew just potholed TH-1. Found 4\" coated steel gas main at 3.42 ft depth below grade. Tracer wire is intact."
      },
      {
        id: "m3",
        from: "AutoCAD_Dave",
        to: "FieldCrew1_Mike",
        time: "08:35 AM",
        text: "Outstanding! What's the ground elevation on the pothole rim so I can calculate the true invert in Civil 3D?"
      },
      {
        id: "m4",
        from: "FieldCrew1_Mike",
        to: "AutoCAD_Dave",
        time: "08:42 AM",
        text: "Ground elevation is 687.20 ft. Top of 4\" gas main is 683.78 ft. Sending the SUE point and linework sketch to you now!"
      },
      {
        id: "m5",
        from: "AutoCAD_Dave",
        to: "FieldCrew1_Mike",
        time: "08:45 AM",
        text: "Got it! That gives us 1.8 feet of clearance over the storm box, which meets the 12-inch minimum requirement. I'm updating the CAD utility profile right now."
      }
    ]
  }
};
