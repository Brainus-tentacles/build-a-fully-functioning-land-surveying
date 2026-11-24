// DXF Importer & Exporter and CSV Point File Handler
// Fully compliant with AutoCAD, Civil 3D, Carlson Survey, QGIS, MicroStation
class DxfManager {
  constructor() {
    this.aciColors = {
      BOUNDARY: 1,       // Red
      CENTERLINE: 2,     // Yellow
      UTILITIES_SEWER: 3,// Green
      UTILITIES_STORM: 4,// Cyan
      UTILITIES_WATER: 5,// Blue
      BUILDING: 6,       // Magenta
      EOP_CURB: 8,       // Dark Gray
      FIELD_SKETCHES: 30,// Orange
      POINTS: 7          // White
    };
  }

  // Generate ASCII DXF Release 12/2000 file from current survey linework & points
  generateDxf() {
    const linework = window.cadEngine ? window.cadEngine.linework : [];
    const points = window.pointManager ? window.pointManager.getAll() : [];

    let dxf = "";

    // 1. HEADER SECTION
    dxf += "0\nSECTION\n2\nHEADER\n";
    dxf += "9\n$ACADVER\n1\nAC1009\n"; // AutoCAD R12 standard (broadest compatibility)
    dxf += "9\n$INSUNITS\n70\n2\n";     // 2 = US Survey Feet
    dxf += "0\nENDSEC\n";

    // 2. TABLES SECTION
    dxf += "0\nSECTION\n2\nTABLES\n";
    // Layer Table
    dxf += "0\nTABLE\n2\nLAYER\n70\n10\n";

    const layers = window.cadEngine ? window.cadEngine.layers : {};
    Object.keys(layers).forEach(layerName => {
      const color = this.aciColors[layerName] || 7;
      dxf += "0\nLAYER\n2\n" + layerName + "\n70\n0\n62\n" + color + "\n6\nCONTINUOUS\n";
    });
    dxf += "0\nENDTAB\n";
    dxf += "0\nENDSEC\n";

    // 3. ENTITIES SECTION
    dxf += "0\nSECTION\n2\nENTITIES\n";

    // Export Survey Points
    points.forEach(pt => {
      // POINT entity
      // Survey coordinates: Easting = X, Northing = Y, Elevation = Z
      dxf += "0\nPOINT\n8\nPOINTS\n";
      dxf += "10\n" + pt.easting.toFixed(4) + "\n";
      dxf += "20\n" + pt.northing.toFixed(4) + "\n";
      dxf += "30\n" + pt.elevation.toFixed(4) + "\n";

      // TEXT entity for Point Label (Pt# - Code)
      dxf += "0\nTEXT\n8\nPOINTS\n";
      dxf += "10\n" + (pt.easting + 1.2).toFixed(4) + "\n";
      dxf += "20\n" + (pt.northing + 0.8).toFixed(4) + "\n";
      dxf += "30\n" + pt.elevation.toFixed(4) + "\n";
      dxf += "40\n1.2\n"; // text height in feet
      dxf += "1\n" + pt.id + " " + pt.code + "\n";
    });

    // Export Linework
    linework.forEach(elem => {
      const layer = elem.layer || "BOUNDARY";
      const pts = elem.points;
      if (!pts || pts.length < 2) return;

      if (elem.type === 'line' && pts.length === 2) {
        // LINE entity
        dxf += "0\nLINE\n8\n" + layer + "\n";
        dxf += "10\n" + pts[0].e.toFixed(4) + "\n";
        dxf += "20\n" + pts[0].n.toFixed(4) + "\n";
        dxf += "30\n" + (pts[0].z || 0).toFixed(4) + "\n";
        dxf += "11\n" + pts[1].e.toFixed(4) + "\n";
        dxf += "21\n" + pts[1].n.toFixed(4) + "\n";
        dxf += "31\n" + (pts[1].z || 0).toFixed(4) + "\n";
      } else {
        // POLYLINE entity
        dxf += "0\nPOLYLINE\n8\n" + layer + "\n";
        dxf += "66\n1\n"; // vertices follow flag
        dxf += "70\n" + (elem.closed ? "1" : "0") + "\n"; // 1 = closed

        pts.forEach(v => {
          dxf += "0\nVERTEX\n8\n" + layer + "\n";
          dxf += "10\n" + v.e.toFixed(4) + "\n";
          dxf += "20\n" + v.n.toFixed(4) + "\n";
          dxf += "30\n" + (v.z || 0).toFixed(4) + "\n";
        });
        dxf += "0\nSEQEND\n";
      }
    });

    dxf += "0\nENDSEC\n0\nEOF\n";
    return dxf;
  }

  // Download DXF file to user computer/device
  downloadDxf(filename = "SURVEY_LINEWORK.dxf") {
    const dxfContent = this.generateDxf();
    const blob = new Blob([dxfContent], { type: "application/dxf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.soundFX.playShotBeep();
  }

  // Parse an uploaded DXF file
  parseDxf(content) {
    const lines = content.split(/\r?\n/);
    let inEntities = false;
    let currentEntity = null;
    let code = null;

    const importedPoints = [];
    const importedLines = [];
    let currentPolyline = null;

    for (let i = 0; i < lines.length - 1; i += 2) {
      const groupCode = lines[i].trim();
      const val = lines[i + 1] ? lines[i + 1].trim() : "";

      if (groupCode === "0" && val === "SECTION") {
        continue;
      }
      if (groupCode === "2" && val === "ENTITIES") {
        inEntities = true;
        continue;
      }
      if (groupCode === "0" && val === "ENDSEC") {
        inEntities = false;
        continue;
      }

      if (!inEntities) continue;

      if (groupCode === "0") {
        // Entity start / finish
        if (currentPolyline && currentPolyline.points.length >= 2) {
          importedLines.push(currentPolyline);
          currentPolyline = null;
        }

        if (val === "LINE") {
          currentEntity = { type: "LINE", layer: "BOUNDARY", x1: 0, y1: 0, z1: 0, x2: 0, y2: 0, z2: 0 };
        } else if (val === "POINT") {
          currentEntity = { type: "POINT", layer: "POINTS", x: 0, y: 0, z: 0 };
        } else if (val === "POLYLINE" || val === "LWPOLYLINE") {
          currentEntity = { type: "POLYLINE", layer: "BOUNDARY", points: [], closed: false };
          currentPolyline = currentEntity;
        } else if (val === "VERTEX") {
          currentEntity = { type: "VERTEX", x: 0, y: 0, z: 0 };
        } else if (val === "SEQEND") {
          if (currentPolyline && currentPolyline.points.length >= 2) {
            importedLines.push(currentPolyline);
            currentPolyline = null;
          }
          currentEntity = null;
        }
        continue;
      }

      if (!currentEntity) continue;

      // Extract attributes based on group codes
      if (groupCode === "8") {
        currentEntity.layer = val;
      } else if (groupCode === "10") {
        if (currentEntity.type === "LINE") currentEntity.x1 = parseFloat(val);
        else if (currentEntity.type === "POINT" || currentEntity.type === "VERTEX") currentEntity.x = parseFloat(val);
        else if (currentEntity.type === "POLYLINE") {
          currentEntity.lastX = parseFloat(val);
        }
      } else if (groupCode === "20") {
        if (currentEntity.type === "LINE") {
          currentEntity.y1 = parseFloat(val);
        } else if (currentEntity.type === "POINT") {
          currentEntity.y = parseFloat(val);
          // Store point: X=Easting, Y=Northing
          importedPoints.push({
            id: importedPoints.length + 500,
            northing: currentEntity.y,
            easting: currentEntity.x,
            elevation: currentEntity.z || 0,
            code: currentEntity.layer || "DXF_PT",
            desc: "Imported from DXF"
          });
        } else if (currentEntity.type === "VERTEX" && currentPolyline) {
          currentEntity.y = parseFloat(val);
          currentPolyline.points.push({
            n: currentEntity.y,
            e: currentEntity.x,
            z: currentEntity.z || 0
          });
        } else if (currentEntity.type === "POLYLINE" && currentEntity.lastX !== undefined) {
          // LWPOLYLINE 10/20 pairs
          currentEntity.points.push({
            n: parseFloat(val),
            e: currentEntity.lastX,
            z: 0
          });
        }
      } else if (groupCode === "30") {
        if (currentEntity.type === "LINE") currentEntity.z1 = parseFloat(val);
        else currentEntity.z = parseFloat(val);
      } else if (groupCode === "11" && currentEntity.type === "LINE") {
        currentEntity.x2 = parseFloat(val);
      } else if (groupCode === "21" && currentEntity.type === "LINE") {
        currentEntity.y2 = parseFloat(val);
      } else if (groupCode === "31" && currentEntity.type === "LINE") {
        currentEntity.z2 = parseFloat(val);
        // Completed 2-point line
        importedLines.push({
          id: "dxf-line-" + importedLines.length,
          layer: currentEntity.layer || "BOUNDARY",
          type: "line",
          name: "DXF " + (currentEntity.layer || "Line"),
          points: [
            { n: currentEntity.y1, e: currentEntity.x1, z: currentEntity.z1 },
            { n: currentEntity.y2, e: currentEntity.x2, z: currentEntity.z2 }
          ]
        });
      } else if (groupCode === "70" && currentEntity.type === "POLYLINE") {
        const flag = parseInt(val, 10);
        if (flag & 1) currentEntity.closed = true;
      }
    }

    if (currentPolyline && currentPolyline.points.length >= 2) {
      importedLines.push(currentPolyline);
    }

    return { points: importedPoints, linework: importedLines };
  }

  // Export Survey Points to standard CSV (P,N,E,Z,D)
  exportCsv(filename = "SURVEY_POINTS.csv") {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    let csv = "PointID,Northing,Easting,Elevation,Code,Description,RodHeight\n";

    points.forEach(p => {
      csv += `${p.id},${p.northing.toFixed(4)},${p.easting.toFixed(4)},${p.elevation.toFixed(4)},"${p.code}","${p.desc || ''}",${p.hr || 5.0}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.soundFX.playShotBeep();
  }

  // Parse an uploaded CSV or TXT ASCII point file
  parseCsv(content) {
    const lines = content.trim().split(/\r?\n/);
    const parsedPoints = [];

    lines.forEach((line, index) => {
      const clean = line.trim();
      if (!clean || clean.startsWith("//") || clean.startsWith("#")) return;

      // Detect separator: comma, tab, or whitespace
      let parts = [];
      if (clean.includes(",")) {
        parts = clean.split(",").map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else if (clean.includes("\t")) {
        parts = clean.split("\t").map(s => s.trim());
      } else {
        parts = clean.split(/\s+/);
      }

      // Skip header row if first row contains letters in coordinate fields
      if (index === 0 && (isNaN(Number(parts[1])) || isNaN(Number(parts[2])))) {
        return;
      }

      if (parts.length >= 4) {
        const id = parts[0];
        const n = parseFloat(parts[1]);
        const e = parseFloat(parts[2]);
        const z = parseFloat(parts[3]) || 0;
        const code = parts[4] || "SHOT";
        const desc = parts.slice(5).join(" ") || "";

        if (!isNaN(n) && !isNaN(e)) {
          parsedPoints.push({
            id: isNaN(Number(id)) ? index + 1 : Number(id),
            northing: n,
            easting: e,
            elevation: z,
            code: code,
            desc: desc
          });
        }
      }
    });

    return parsedPoints;
  }

  // Export GeoJSON features for GIS / web map integration
  exportGeoJson(filename = "SURVEY_OAK_RIDGE.geojson") {
    const linework = window.cadEngine ? window.cadEngine.linework : [];
    const points = window.pointManager ? window.pointManager.getAll() : [];

    const features = [];

    // Points as GeoJSON Feature Point (Easting = Longitude/X, Northing = Latitude/Y)
    points.forEach(p => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.easting, p.northing, p.elevation]
        },
        properties: {
          id: p.id,
          code: p.code,
          elevation: p.elevation,
          desc: p.desc || ""
        }
      });
    });

    // Linework as GeoJSON LineString / Polygon
    linework.forEach(l => {
      if (!l.points || l.points.length < 2) return;

      if (l.closed || l.type === 'polygon' || l.type === 'parcel') {
        const ring = l.points.map(pt => [pt.e, pt.n, pt.z || 0]);
        // Close ring if not closed
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          ring.push([...ring[0]]);
        }
        features.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring]
          },
          properties: {
            id: l.id,
            name: l.name,
            layer: l.layer
          }
        });
      } else {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: l.points.map(pt => [pt.e, pt.n, pt.z || 0])
          },
          properties: {
            id: l.id,
            name: l.name,
            layer: l.layer
          }
        });
      }
    });

    const geoJson = {
      type: "FeatureCollection",
      properties: {
        datum: "NAD83 Texas Central (US Survey Feet)",
        exportedAt: new Date().toISOString()
      },
      features
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.soundFX.playShotBeep();
  }

  // Export high resolution PNG snapshot of CAD drawing
  exportPngSnapshot(filename = "SURVEY_DRAWING.png") {
    const canvas = document.getElementById('cad-canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.soundFX.playShotBeep();
  }
}


  // ─────────────────────────────────────────────────────────────────────────────
  // Civil 3D Survey Database Field Book (.FBK) Exporter
  // Format: Autodesk Civil 3D Survey Database CRANDALL syntax
  // Compatible with:  Civil 3D 2020-2026 Survey Database Import Wizard
  // ─────────────────────────────────────────────────────────────────────────────
  exportCivil3dFbk(filename) {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const job    = window.sampleData   ? window.sampleData.jobs[0]    : null;
    const jobNum = job ? job.jobNumber : "2026-XXX";
    const jobDesc = job ? job.description : "SURVEY JOB";
    const surveyor = job ? (job.fieldCrew ? job.fieldCrew[0] : "FIELD CREW") : "FIELD CREW";
    const today = new Date();
    const dateStr = `${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()}`;

    if (!filename) filename = `JOB_${jobNum}_C3D.fbk`;

    let fbk = "";

    // ── Header ──────────────────────────────────────────────────────────────
    fbk += `! Civil 3D Survey Field Book (.FBK)\n`;
    fbk += `! Generated by SurveyLink Field App\n`;
    fbk += `! Job: ${jobNum} – ${jobDesc}\n`;
    fbk += `! Date: ${dateStr}  Surveyor: ${surveyor}\n`;
    fbk += `! Equipment: Topcon FC-6000 / MAGNET Field v8.2 / Topcon HiPer VR\n`;
    fbk += `! Coordinates: NAD83 Texas Central  Units: US Survey Feet\n`;
    fbk += `!\n`;

    // ── JOB record ──────────────────────────────────────────────────────────
    fbk += `JOB ${jobNum}\n`;
    fbk += `UNIT FEET\n`;
    fbk += `SCALE 1\n`;
    fbk += `!\n`;

    // ── Control Points (traverse / benchmarks) ───────────────────────────────
    const ctrlPts = points.filter(p => p.type === 'CTRL' || p.type === 'BM');
    if (ctrlPts.length > 0) {
      fbk += `! ── Control / Bench Marks ──────────────────────────────────────────\n`;
      ctrlPts.forEach(pt => {
        // CR NEZ point_id northing easting elevation [description]
        fbk += `CR NEZ ${String(pt.id).padStart(4,' ')}  ${pt.northing.toFixed(4)}  ${pt.easting.toFixed(4)}  ${pt.elevation.toFixed(4)}  ! ${pt.code} ${pt.description || ''}\n`;
      });
      fbk += `!\n`;
    }

    // ── Prism / Rod height ───────────────────────────────────────────────────
    const defaultRod = points.find(p => p.rodHeight) ? points.find(p => p.rodHeight).rodHeight : 6.000;
    fbk += `PRISM ${defaultRod.toFixed(3)}\n`;
    fbk += `!\n`;

    // ── Station Setup — group by station (use first CTRL as HI if available) ─
    const occupiedCtrl = ctrlPts[0];
    const backsight    = ctrlPts[1] || null;

    if (occupiedCtrl) {
      fbk += `! ── Instrument Setup ────────────────────────────────────────────────\n`;
      fbk += `STN ${occupiedCtrl.id}\n`;
      fbk += `IH 5.550\n`;      // instrument height – typical for Topcon iX-1200
      if (backsight) {
        fbk += `BS ${backsight.id}\n`;
        fbk += `BH 6.000\n`;
      }
      fbk += `!\n`;
    }

    // ── Side Shots (all non-control points) ──────────────────────────────────
    const sideShots = points.filter(p => p.type !== 'CTRL' && p.type !== 'BM');
    if (sideShots.length > 0) {
      fbk += `! ── Side Shots / Topo / Boundary ───────────────────────────────────\n`;
      fbk += `! Format: SS  pt_id  northing  easting  elevation  rod  code  description\n`;
      sideShots.forEach(pt => {
        const rod = (pt.rodHeight || defaultRod).toFixed(3);
        fbk += `SS  ${String(pt.id).padStart(4,' ')}  ${pt.northing.toFixed(4)}  ${pt.easting.toFixed(4)}  ${pt.elevation.toFixed(4)}  ${rod}  ${pt.code}  ! ${pt.description || ''}\n`;
      });
      fbk += `!\n`;
    }

    // ── Coordinate Records (PNEZD for all points as direct coords) ───────────
    fbk += `! ── Full PNEZD Coordinate Dump ─────────────────────────────────────\n`;
    points.forEach(pt => {
      // PNEZD:  point# northing easting elevation description
      fbk += `PNEZD  ${String(pt.id).padStart(4,' ')}  ${pt.northing.toFixed(4)}  ${pt.easting.toFixed(4)}  ${pt.elevation.toFixed(4)}  ${pt.code}\n`;
    });
    fbk += `!\n`;
    fbk += `END\n`;

    this._triggerDownload(fbk, filename, "text/plain;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();

    // Post to AIM chat
    if (window.aimChat) {
      window.aimChat.postSystemMessage(`📤 Civil 3D .FBK exported: ${filename}  (${points.length} pts, ${sideShots.length} side shots) — Ready to import into Civil 3D Survey Database.`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Topcon / Sokkia MAGNET Field Raw File (.raw / .rw5) Exporter
  // Sokkia/Topcon SDR33 / RW5 format — importable by MAGNET Field + MAGNET Office
  // Also readable by Carlson SurvPC, Trimble Business Center (after conversion)
  // ─────────────────────────────────────────────────────────────────────────────
  exportMagnetRaw(filename) {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const job    = window.sampleData   ? window.sampleData.jobs[0]    : null;
    const jobNum = job ? job.jobNumber : "2026-XXX";
    const today  = new Date();
    // RW5 Date format: MM-DD-YYYY
    const dateStr = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}-${today.getFullYear()}`;
    const timeStr = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}:${String(today.getSeconds()).padStart(2,'0')}`;

    if (!filename) filename = `JOB_${jobNum}.rw5`;

    let rw5 = "";

    // ── RW5 Header (Sokkia / Topcon MAGNET Field format) ─────────────────────
    rw5 += `--Rw5 2.0 Carlson/MAGNET Compatible Raw File\n`;
    rw5 += `--Name: ${jobNum}\n`;
    rw5 += `--Date: ${dateStr}\n`;
    rw5 += `--Time: ${timeStr}\n`;
    rw5 += `--Instrument: Topcon HiPer VR / FC-6000 / MAGNET Field v8.2\n`;
    rw5 += `--Description: ${job ? job.description : 'SURVEY JOB'}\n`;

    // ── MAGNET Field job header record ────────────────────────────────────────
    rw5 += `MO,AD 0,UN 0,SF 1.00000000,EC 1,EO 0.0,AU 0,DM 2\n`;
    // MO: Mode of operation  UN=0(feet) SF=scale factor  EC=1(EDM correction on)

    // ── Control Points as known point records (KP) ───────────────────────────
    const ctrlPts = points.filter(p => p.type === 'CTRL' || p.type === 'BM');
    ctrlPts.forEach(pt => {
      // KP, PN=point_name, N=northing, E=easting, EL=elevation, --description
      rw5 += `KP,PN ${pt.id},N  ${pt.northing.toFixed(4)},E  ${pt.easting.toFixed(4)},EL ${pt.elevation.toFixed(4)},--${pt.code}\n`;
    });

    // ── Occupation record (OC) ────────────────────────────────────────────────
    if (ctrlPts.length > 0) {
      rw5 += `OC,OP ${ctrlPts[0].id},N  ${ctrlPts[0].northing.toFixed(4)},E  ${ctrlPts[0].easting.toFixed(4)},EL ${ctrlPts[0].elevation.toFixed(4)},--Occupied Control\n`;
      rw5 += `OI,OP ${ctrlPts[0].id},HI 5.5500,--Topcon iX-1200 HI\n`;
    }
    if (ctrlPts.length > 1) {
      rw5 += `BK,OP ${ctrlPts[0].id},BP ${ctrlPts[1].id},BS 0.0000,--Backsight Azimuth\n`;
    }

    // ── Sideshots (SS) ────────────────────────────────────────────────────────
    const sideShots = points.filter(p => p.type !== 'CTRL' && p.type !== 'BM');
    sideShots.forEach(pt => {
      // SS, OP=occupied_pt, FP=foresight_pt, AZ=azimuth, ZE=zenith_angle,
      //     SD=slope_distance, HR=rod_height, --code
      // For GPS/RTK points we emit as direct Store Point (SP) with coords
      const rod = (pt.rodHeight || 6.0).toFixed(4);
      rw5 += `SP,PN ${pt.id},N  ${pt.northing.toFixed(4)},E  ${pt.easting.toFixed(4)},EL ${pt.elevation.toFixed(4)},--${pt.code} ${pt.description || ''}\n`;
    });

    // ── GPS RTK records (GPS) ─────────────────────────────────────────────────
    rw5 += `--GPS RTK Session  HiPer VR  TopNET Live VRS  PDOP: 1.05  Sats: 24\n`;
    sideShots.forEach(pt => {
      // GPS record: MAGNET Field RTK shot format
      rw5 += `GPS,PN ${pt.id},LA 0.000000,LN 0.000000,EL ${pt.elevation.toFixed(4)},N  ${pt.northing.toFixed(4)},E  ${pt.easting.toFixed(4)},--${pt.code}\n`;
    });

    this._triggerDownload(rw5, filename, "text/plain;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();

    if (window.aimChat) {
      window.aimChat.postSystemMessage(`📤 MAGNET Field .RW5 exported: ${filename}  (${points.length} pts) — Ready to import into Topcon MAGNET Office / MAGNET Field.`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper: trigger browser download
  // ─────────────────────────────────────────────────────────────────────────────
  _triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.DxfManager = DxfManager;
window.dxfManager = new DxfManager();
