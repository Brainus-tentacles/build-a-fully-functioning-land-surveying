// DXF, CSV, GeoJSON, Civil 3D Field Book (.FBK) & Topcon/Sokkia MAGNET Field (.RW5/.RAW) Handler
// Fully compatible with Autodesk Civil 3D 2020-2026, Topcon MAGNET Field / MAGNET Office, & Sokkia
class DxfManager {
  constructor() {
    this.aciColors = {
      BOUNDARY: 1,          // Red
      "V-PROP-LINE": 1,     // Civil 3D Property / Boundary Line (Red)
      CENTERLINE: 2,        // Yellow
      "V-ROAD-CNTR": 2,     // Civil 3D Road Centerline (Yellow)
      UTILITIES_SEWER: 3,   // Green
      "V-UTIL-SSWR": 3,     // Civil 3D Sanitary Sewer (Green)
      UTILITIES_STORM: 4,   // Cyan
      "V-UTIL-STRM": 4,     // Civil 3D Storm Drain (Cyan)
      UTILITIES: 5,         // Blue
      UTILITIES_WATER: 5,   // Blue
      "V-UTIL-WATR": 5,     // Civil 3D Water Main (Blue)
      BUILDING: 6,          // Magenta
      "V-BLDG": 6,          // Civil 3D Building Footprint (Magenta)
      EOP_CURB: 8,          // Dark Gray
      "V-ROAD-CURB": 8,     // Civil 3D Edge of Pavement / Curb (Gray)
      FIELD_SKETCHES: 30,   // Orange
      SKETCH: 30,           // Orange
      "V-SITE-FENC": 30,    // Civil 3D Fence / Site Sketch (Orange)
      "V-TOPO-TREE": 3,     // Civil 3D Trees / Vegetation (Green)
      POINTS: 7,            // White
      "V-NODE-PNT": 7       // Civil 3D Survey Points (White)
    };

    this.civil3dLayerMap = {
      BOUNDARY: "V-PROP-LINE",
      CENTERLINE: "V-ROAD-CNTR",
      EOP_CURB: "V-ROAD-CURB",
      BUILDING: "V-BLDG",
      UTILITIES: "V-UTIL-WATR",
      FIELD_SKETCHES: "V-SITE-FENC",
      SKETCH: "V-SITE-FENC",
      POINTS: "V-NODE-PNT"
    };
  }

  // Map internal layer key or existing Civil 3D layer to a clean Civil 3D NCS DXF layer name
  toCivil3dLayer(layerName) {
    if (!layerName) return "V-PROP-LINE";
    const upper = String(layerName).trim().toUpperCase();
    return this.civil3dLayerMap[upper] || upper;
  }

  _getActiveJobMeta() {
    const job = (window.jobManager && typeof window.jobManager.getCurrentJob === 'function')
      ? window.jobManager.getCurrentJob()
      : (window.SAMPLE_DATA && window.SAMPLE_DATA.jobs ? window.SAMPLE_DATA.jobs[0] : null);
    const equip = (window.app && window.app.equipmentProfile) ? window.app.equipmentProfile : {
      tablet: "Topcon FC-6000",
      software: "MAGNET Field v8.2",
      gps: "Topcon HiPer VR",
      totalStation: "Sokkia iX-1200",
      network: "TopNET Live VRS",
      cadOffice: "Autodesk Civil 3D 2026"
    };
    return {
      jobNum: job ? (job.number || "2026-104") : "2026-104",
      jobDesc: job ? (job.name || "SURVEY JOB") : "SURVEY JOB",
      datum: job ? (job.datum || "NAD83 / NAVD88 (US Survey Feet)") : "NAD83 / NAVD88",
      surveyor: job ? (job.partyChief || "Field Crew") : "Field Crew",
      cadOperator: job ? (job.cadOperator || "Civil 3D Office") : "Civil 3D Office",
      equip
    };
  }

  // Generate ASCII DXF Release 12/2000 file with Civil 3D NCS Layers
  generateDxf(useCivil3dLayers = true) {
    const linework = window.cadEngine ? window.cadEngine.linework : [];
    const points = window.pointManager ? window.pointManager.getAll() : [];

    // Collect all layer names actually needed
    const layerSet = new Set([
      useCivil3dLayers ? "V-NODE-PNT" : "POINTS",
      useCivil3dLayers ? "V-PROP-LINE" : "BOUNDARY",
      useCivil3dLayers ? "V-ROAD-CNTR" : "CENTERLINE",
      useCivil3dLayers ? "V-ROAD-CURB" : "EOP_CURB",
      useCivil3dLayers ? "V-BLDG" : "BUILDING",
      useCivil3dLayers ? "V-UTIL-WATR" : "UTILITIES",
      useCivil3dLayers ? "V-SITE-FENC" : "FIELD_SKETCHES"
    ]);
    linework.forEach(elem => {
      const lyr = useCivil3dLayers ? this.toCivil3dLayer(elem.layer) : (elem.layer || "BOUNDARY");
      layerSet.add(lyr);
    });

    let dxf = "";

    // 1. HEADER SECTION
    dxf += "0\nSECTION\n2\nHEADER\n";
    dxf += "9\n$ACADVER\n1\nAC1009\n"; // AutoCAD R12 standard (broadest Civil 3D compatibility)
    dxf += "9\n$INSUNITS\n70\n2\n";     // 2 = US Survey Feet
    dxf += "0\nENDSEC\n";

    // 2. TABLES SECTION
    dxf += "0\nSECTION\n2\nTABLES\n";
    dxf += `0\nTABLE\n2\nLAYER\n70\n${layerSet.size}\n`;

    layerSet.forEach(layerName => {
      const color = this.aciColors[layerName] || 7;
      dxf += "0\nLAYER\n2\n" + layerName + "\n70\n0\n62\n" + color + "\n6\nCONTINUOUS\n";
    });
    dxf += "0\nENDTAB\n";
    dxf += "0\nENDSEC\n";

    // 3. ENTITIES SECTION
    dxf += "0\nSECTION\n2\nENTITIES\n";

    const ptLayer = useCivil3dLayers ? "V-NODE-PNT" : "POINTS";
    points.forEach(pt => {
      dxf += `0\nPOINT\n8\n${ptLayer}\n`;
      dxf += "10\n" + pt.easting.toFixed(4) + "\n";
      dxf += "20\n" + pt.northing.toFixed(4) + "\n";
      dxf += "30\n" + pt.elevation.toFixed(4) + "\n";

      dxf += `0\nTEXT\n8\n${ptLayer}\n`;
      dxf += "10\n" + (pt.easting + 1.2).toFixed(4) + "\n";
      dxf += "20\n" + (pt.northing + 0.8).toFixed(4) + "\n";
      dxf += "30\n" + pt.elevation.toFixed(4) + "\n";
      dxf += "40\n1.2\n";
      dxf += "1\n" + pt.id + " " + pt.code + "\n";
    });

    linework.forEach(elem => {
      const layer = useCivil3dLayers ? this.toCivil3dLayer(elem.layer) : (elem.layer || "BOUNDARY");
      const pts = elem.points;
      if (!pts || pts.length < 2) return;

      if (elem.type === 'line' && pts.length === 2) {
        dxf += "0\nLINE\n8\n" + layer + "\n";
        dxf += "10\n" + pts[0].e.toFixed(4) + "\n";
        dxf += "20\n" + pts[0].n.toFixed(4) + "\n";
        dxf += "30\n" + (pts[0].z || 0).toFixed(4) + "\n";
        dxf += "11\n" + pts[1].e.toFixed(4) + "\n";
        dxf += "21\n" + pts[1].n.toFixed(4) + "\n";
        dxf += "31\n" + (pts[1].z || 0).toFixed(4) + "\n";
      } else {
        dxf += "0\nPOLYLINE\n8\n" + layer + "\n";
        dxf += "66\n1\n";
        dxf += "70\n" + (elem.closed ? "1" : "0") + "\n";

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

  downloadDxf(filename) {
    const meta = this._getActiveJobMeta();
    const outName = filename || `JOB_${meta.jobNum}_CIVIL3D.dxf`;
    const dxfContent = this.generateDxf(true);
    this._triggerDownload(dxfContent, outName, "application/dxf;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();
    if (window.aimChat) {
      window.aimChat.postSystemUpdate(`📤 Civil 3D DXF exported: ${outName} (NCS layers: V-PROP-LINE, V-ROAD-CNTR, V-ROAD-CURB, V-BLDG, V-UTIL-WATR, V-NODE-PNT).`);
    }
  }

  // Parse an uploaded DXF file (supports LINE, 2D/3D POINT, POLYLINE/VERTEX, and Civil 3D LWPOLYLINE)
  parseDxf(content) {
    const lines = content.split(/\r?\n/);
    let inEntities = false;
    let currentEntity = null;
    let currentPolyline = null;

    const importedPoints = [];
    const importedLines = [];

    const layerColorFor = (layer) => {
      const upper = (layer || "BOUNDARY").toUpperCase();
      if (upper.includes("PROP") || upper.includes("BND")) return "#ef4444";
      if (upper.includes("CNTR") || upper.includes("CENTER")) return "#eab308";
      if (upper.includes("CURB") || upper.includes("EOP")) return "#94a3b8";
      if (upper.includes("BLDG") || upper.includes("BUILD")) return "#a855f7";
      if (upper.includes("UTIL") || upper.includes("WATR") || upper.includes("SSWR") || upper.includes("STRM")) return "#0284c7";
      if (upper.includes("FENC") || upper.includes("SKETCH")) return "#f97316";
      return "#ef4444";
    };

    const flushCurrentEntity = () => {
      if (!currentEntity) return;
      if (currentEntity.type === "LINE" && currentEntity.hasStart && currentEntity.hasEnd) {
        importedLines.push({
          id: "dxf-line-" + importedLines.length + "-" + Date.now(),
          layer: currentEntity.layer || "BOUNDARY",
          type: "line",
          name: "DXF " + (currentEntity.layer || "Line"),
          color: layerColorFor(currentEntity.layer),
          lineWidth: 2.0,
          points: [
            { n: currentEntity.y1, e: currentEntity.x1, z: currentEntity.z1 || 0 },
            { n: currentEntity.y2, e: currentEntity.x2, z: currentEntity.z2 || 0 }
          ]
        });
      } else if (currentEntity.type === "POINT" && currentEntity.hasCoords) {
        importedPoints.push({
          id: importedPoints.length + 500,
          northing: currentEntity.y,
          easting: currentEntity.x,
          elevation: currentEntity.z || 0,
          code: currentEntity.layer || "DXF_PT",
          desc: "Imported from Civil 3D DXF"
        });
      } else if (currentEntity.type === "LWPOLYLINE" && currentEntity.points.length >= 2) {
        importedLines.push({
          id: "dxf-lwpoly-" + importedLines.length + "-" + Date.now(),
          layer: currentEntity.layer || "BOUNDARY",
          type: currentEntity.closed ? "polygon" : "polyline",
          name: "DXF " + (currentEntity.layer || "Polyline"),
          color: layerColorFor(currentEntity.layer),
          lineWidth: 2.0,
          closed: currentEntity.closed,
          points: currentEntity.points
        });
      } else if (currentEntity.type === "VERTEX" && currentPolyline && currentEntity.hasCoords) {
        currentPolyline.points.push({
          n: currentEntity.y,
          e: currentEntity.x,
          z: currentEntity.z || 0
        });
      }
      currentEntity = null;
    };

    for (let i = 0; i < lines.length - 1; i += 2) {
      const groupCode = lines[i].trim();
      const val = lines[i + 1] !== undefined ? lines[i + 1].trim() : "";

      if (groupCode === "2" && val === "ENTITIES") {
        inEntities = true;
        continue;
      }
      if (groupCode === "0" && val === "ENDSEC") {
        flushCurrentEntity();
        if (currentPolyline && currentPolyline.points.length >= 2) {
          currentPolyline.color = layerColorFor(currentPolyline.layer);
          importedLines.push(currentPolyline);
          currentPolyline = null;
        }
        inEntities = false;
        continue;
      }

      if (!inEntities) continue;

      if (groupCode === "0") {
        flushCurrentEntity();

        if (val !== "VERTEX" && val !== "SEQEND" && currentPolyline) {
          if (currentPolyline.points.length >= 2) {
            currentPolyline.color = layerColorFor(currentPolyline.layer);
            importedLines.push(currentPolyline);
          }
          currentPolyline = null;
        }

        if (val === "LINE") {
          currentEntity = { type: "LINE", layer: "BOUNDARY", x1: 0, y1: 0, z1: 0, x2: 0, y2: 0, z2: 0, hasStart: false, hasEnd: false };
        } else if (val === "POINT") {
          currentEntity = { type: "POINT", layer: "POINTS", x: 0, y: 0, z: 0, hasCoords: false };
        } else if (val === "POLYLINE") {
          currentPolyline = {
            id: "dxf-poly-" + importedLines.length + "-" + Date.now(),
            type: "polyline",
            layer: "BOUNDARY",
            name: "DXF Polyline",
            lineWidth: 2.0,
            points: [],
            closed: false
          };
          currentEntity = currentPolyline;
        } else if (val === "LWPOLYLINE") {
          currentEntity = { type: "LWPOLYLINE", layer: "BOUNDARY", points: [], closed: false, elev: 0, lastX: undefined };
        } else if (val === "VERTEX") {
          currentEntity = { type: "VERTEX", x: 0, y: 0, z: 0, hasCoords: false };
        } else if (val === "SEQEND") {
          if (currentPolyline && currentPolyline.points.length >= 2) {
            currentPolyline.color = layerColorFor(currentPolyline.layer);
            importedLines.push(currentPolyline);
          }
          currentPolyline = null;
          currentEntity = null;
        }
        continue;
      }

      if (!currentEntity) continue;

      if (groupCode === "8") {
        currentEntity.layer = val;
        if (currentEntity.type === "POLYLINE") {
          currentEntity.name = "DXF " + val;
        }
      } else if (groupCode === "38" && currentEntity.type === "LWPOLYLINE") {
        currentEntity.elev = parseFloat(val) || 0;
      } else if (groupCode === "10") {
        const num = parseFloat(val);
        if (currentEntity.type === "LINE") { currentEntity.x1 = num; currentEntity.hasStart = true; }
        else if (currentEntity.type === "POINT" || currentEntity.type === "VERTEX") { currentEntity.x = num; }
        else if (currentEntity.type === "LWPOLYLINE") { currentEntity.lastX = num; }
      } else if (groupCode === "20") {
        const num = parseFloat(val);
        if (currentEntity.type === "LINE") {
          currentEntity.y1 = num;
        } else if (currentEntity.type === "POINT" || currentEntity.type === "VERTEX") {
          currentEntity.y = num;
          currentEntity.hasCoords = true;
        } else if (currentEntity.type === "LWPOLYLINE" && currentEntity.lastX !== undefined) {
          currentEntity.points.push({
            n: num,
            e: currentEntity.lastX,
            z: currentEntity.elev || 0
          });
          currentEntity.lastX = undefined;
        }
      } else if (groupCode === "30") {
        const num = parseFloat(val) || 0;
        if (currentEntity.type === "LINE") currentEntity.z1 = num;
        else currentEntity.z = num;
      } else if (groupCode === "11" && currentEntity.type === "LINE") {
        currentEntity.x2 = parseFloat(val);
        currentEntity.hasEnd = true;
      } else if (groupCode === "21" && currentEntity.type === "LINE") {
        currentEntity.y2 = parseFloat(val);
      } else if (groupCode === "31" && currentEntity.type === "LINE") {
        currentEntity.z2 = parseFloat(val) || 0;
      } else if (groupCode === "70" && (currentEntity.type === "POLYLINE" || currentEntity.type === "LWPOLYLINE")) {
        const flag = parseInt(val, 10);
        if (flag & 1) currentEntity.closed = true;
      }
    }

    flushCurrentEntity();
    if (currentPolyline && currentPolyline.points.length >= 2) {
      currentPolyline.color = layerColorFor(currentPolyline.layer);
      importedLines.push(currentPolyline);
    }

    return { points: importedPoints, linework: importedLines };
  }

  // Export Survey Points to Civil 3D / MAGNET Field PNEZD CSV
  exportCsv(filename) {
    const meta = this._getActiveJobMeta();
    const outName = filename || `JOB_${meta.jobNum}_PNEZD.csv`;
    const points = window.pointManager ? window.pointManager.getAll() : [];
    let csv = "PointID,Northing,Easting,Elevation,Code,Description,RodHeight\n";

    points.forEach(p => {
      const safeCode = String(p.code || "").replace(/"/g, '""');
      const safeDesc = String(p.desc || "").replace(/"/g, '""');
      csv += `${p.id},${p.northing.toFixed(4)},${p.easting.toFixed(4)},${p.elevation.toFixed(4)},"${safeCode}","${safeDesc}",${(p.hr || 5.0).toFixed(3)}\n`;
    });

    this._triggerDownload(csv, outName, "text/csv;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();
    if (window.aimChat) {
      window.aimChat.postSystemUpdate(`📤 PNEZD CSV exported: ${outName} (${points.length} pts) — Compatible with Civil 3D & MAGNET Field.`);
    }
  }

  // Parse CSV/TXT ASCII PNEZD (handles quoted CSV fields, tab, or space delimited)
  parseCsv(content) {
    const lines = content.trim().split(/\r?\n/);
    const parsedPoints = [];

    const splitCsvRow = (row) => {
      const out = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          out.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur.trim());
      return out;
    };

    lines.forEach((line, index) => {
      const clean = line.trim();
      if (!clean || clean.startsWith("//") || clean.startsWith("#")) return;

      let parts = [];
      if (clean.includes(",")) {
        parts = splitCsvRow(clean);
      } else if (clean.includes("\t")) {
        parts = clean.split("\t").map(s => s.trim());
      } else {
        parts = clean.split(/\s+/);
      }

      if (index === 0 && (isNaN(Number(parts[1])) || isNaN(Number(parts[2])))) {
        return;
      }

      if (parts.length >= 4) {
        const id = parts[0];
        const n = parseFloat(parts[1]);
        const e = parseFloat(parts[2]);
        const z = parseFloat(parts[3]) || 0;
        const code = parts[4] || "SHOT";
        let desc = "";
        let hr = 5.0;
        if (parts.length >= 7 && !isNaN(Number(parts[parts.length - 1]))) {
          hr = parseFloat(parts[parts.length - 1]);
          desc = parts.slice(5, parts.length - 1).join(" ");
        } else {
          desc = parts.slice(5).join(" ") || "";
        }

        if (!isNaN(n) && !isNaN(e)) {
          parsedPoints.push({
            id: isNaN(Number(id)) ? index + 1 : Number(id),
            northing: n,
            easting: e,
            elevation: z,
            code,
            desc,
            hr
          });
        }
      }
    });

    return parsedPoints;
  }

  exportGeoJson(filename) {
    const meta = this._getActiveJobMeta();
    const outName = filename || `JOB_${meta.jobNum}.geojson`;
    const linework = window.cadEngine ? window.cadEngine.linework : [];
    const points = window.pointManager ? window.pointManager.getAll() : [];

    const features = [];

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

    linework.forEach(l => {
      if (!l.points || l.points.length < 2) return;

      if (l.closed || l.type === 'polygon' || l.type === 'parcel') {
        const ring = l.points.map(pt => [pt.e, pt.n, pt.z || 0]);
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          ring.push([...ring[0]]);
        }
        features.push({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [ring] },
          properties: { id: l.id, name: l.name, layer: this.toCivil3dLayer(l.layer) }
        });
      } else {
        features.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: l.points.map(pt => [pt.e, pt.n, pt.z || 0]) },
          properties: { id: l.id, name: l.name, layer: this.toCivil3dLayer(l.layer) }
        });
      }
    });

    const geoJson = {
      type: "FeatureCollection",
      properties: {
        job: meta.jobNum,
        datum: meta.datum,
        exportedAt: new Date().toISOString()
      },
      features
    };

    this._triggerDownload(JSON.stringify(geoJson, null, 2), outName, "application/geo+json");
    if (window.soundFX) window.soundFX.playShotBeep();
  }

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
    if (window.soundFX) window.soundFX.playShotBeep();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Civil 3D Survey Database Field Book (.FBK) Generator & Importer
  // Compatible with: Autodesk Civil 3D 2020-2026 Survey Database Import Wizard
  // ─────────────────────────────────────────────────────────────────────────────
  generateCivil3dFbkContent() {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const linework = window.cadEngine ? window.cadEngine.linework : [];
    const meta = this._getActiveJobMeta();
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const filename = `JOB_${meta.jobNum}_C3D.fbk`;

    let fbk = "";
    fbk += `! Civil 3D Survey Field Book (.FBK)\n`;
    fbk += `! Generated by GeoSurvey Pro (MAGNET Field to Civil 3D Bridge)\n`;
    fbk += `! Job: ${meta.jobNum} - ${meta.jobDesc}\n`;
    fbk += `! Date: ${dateStr}  Party Chief: ${meta.surveyor}  CAD: ${meta.cadOperator}\n`;
    fbk += `! Hardware: ${meta.equip.tablet} | ${meta.equip.software} | ${meta.equip.gps} | ${meta.equip.totalStation}\n`;
    fbk += `! Datum: ${meta.datum}\n`;
    fbk += `!\n`;
    fbk += `JOB ${meta.jobNum}\n`;
    fbk += `UNIT FOOT US\n`;
    fbk += `HORIZ ANGLE RIGHT\n`;
    fbk += `VERT ANGLE ZENITH\n`;
    fbk += `SCALE 1.00000000\n`;
    fbk += `!\n`;

    const ctrlPts = points.filter(p => p.type === 'CTRL' || p.type === 'BM');
    if (ctrlPts.length > 0) {
      fbk += `! ── Control Points & Benchmarks (CR NEZ) ─────────────────────────\n`;
      ctrlPts.forEach(pt => {
        const note = `${pt.code} ${pt.desc || ''}`.trim();
        fbk += `CR NEZ ${pt.id} ${pt.northing.toFixed(4)} ${pt.easting.toFixed(4)} ${pt.elevation.toFixed(4)} "${note}"\n`;
      });
      fbk += `!\n`;
    }

    const defaultRod = points.find(p => p.hr)?.hr || 6.562;
    fbk += `PRISM ${Number(defaultRod).toFixed(3)}\n`;
    fbk += `!\n`;

    if (ctrlPts.length > 0) {
      fbk += `! ── Station Setup (${meta.equip.totalStation}) ───────────────────────\n`;
      fbk += `STN ${ctrlPts[0].id} ${(ctrlPts[0].hi || 5.120).toFixed(3)}\n`;
      if (ctrlPts.length > 1) {
        fbk += `BS ${ctrlPts[1].id}\n`;
      }
      fbk += `!\n`;
    }

    const sideShots = points.filter(p => p.type !== 'CTRL' && p.type !== 'BM');
    if (sideShots.length > 0) {
      fbk += `! ── Survey Points (NEZ with MAGNET Field Descriptions) ───────────\n`;
      sideShots.forEach(pt => {
        const rod = Number(pt.hr || defaultRod).toFixed(3);
        const note = `${pt.code}${pt.desc ? ' / ' + pt.desc : ''}`;
        fbk += `! HR=${rod}  CODE=${pt.code}\n`;
        fbk += `NEZ ${pt.id} ${pt.northing.toFixed(4)} ${pt.easting.toFixed(4)} ${pt.elevation.toFixed(4)} "${note}"\n`;
      });
      fbk += `!\n`;
    }

    // Export Civil 3D Survey Figures (BEG / CONT / CLOSE / END) from linework
    if (linework.length > 0) {
      fbk += `! ── Civil 3D Survey Figures (Figure Prefix Database) ─────────────\n`;
      let figPtCounter = 9000;
      linework.forEach((elem, idx) => {
        if (!elem.points || elem.points.length < 2) return;
        const c3dLayer = this.toCivil3dLayer(elem.layer);
        const figName = (elem.name || c3dLayer).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 24) + `_${idx + 1}`;
        fbk += `! Layer: ${c3dLayer}\n`;
        fbk += `BEG ${figName}\n`;
        elem.points.forEach(v => {
          if (v.id) {
            fbk += `CONT ${v.id}\n`;
          } else {
            figPtCounter++;
            fbk += `NEZ ${figPtCounter} ${Number(v.n).toFixed(4)} ${Number(v.e).toFixed(4)} ${Number(v.z || 0).toFixed(4)} "${c3dLayer}"\n`;
          }
        });
        fbk += elem.closed ? `CLOSE\n` : `END\n`;
      });
      fbk += `!\n`;
    }

    fbk += `END\n`;
    return { filename, content: fbk, pointCount: points.length, sideShotCount: sideShots.length, figureCount: linework.length };
  }

  exportCivil3dFbk(filename) {
    const res = this.generateCivil3dFbkContent();
    const outName = filename || res.filename;
    this._triggerDownload(res.content, outName, "text/plain;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();

    if (window.aimChat) {
      window.aimChat.postSystemUpdate(
        `📤 Civil 3D .FBK exported: ${outName} (${res.pointCount} pts, ${res.figureCount} Civil 3D Survey Figures) — Ready for Civil 3D Survey Database Import.`
      );
    }
    return res;
  }

  // Parse an uploaded Autodesk Civil 3D Field Book (.FBK)
  parseCivil3dFbk(content) {
    const lines = content.split(/\r?\n/);
    const pointsMap = new Map();
    const figures = [];
    let currentFigure = null;
    let currentRod = 5.0;

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line || line.startsWith("!")) return;

      // Strip inline comment after !
      const bangIdx = line.indexOf("!");
      const clean = (bangIdx >= 0 ? line.slice(0, bangIdx) : line).trim();
      if (!clean) return;

      // Extract quoted description if present
      let quotedDesc = "";
      let mainPart = clean;
      const qMatch = clean.match(/"([^"]*)"/);
      if (qMatch) {
        quotedDesc = qMatch[1].trim();
        mainPart = clean.replace(qMatch[0], "").trim();
      }

      const tokens = mainPart.split(/\s+/);
      const cmd = (tokens[0] || "").toUpperCase();

      if (cmd === "PRISM" && tokens[1]) {
        const val = parseFloat(tokens[1]);
        if (!isNaN(val)) currentRod = val;
      } else if (cmd === "CR" && (tokens[1] || "").toUpperCase() === "NEZ" && tokens.length >= 6) {
        const id = Number(tokens[2]) || tokens[2];
        const n = parseFloat(tokens[3]);
        const e = parseFloat(tokens[4]);
        const z = parseFloat(tokens[5]) || 0;
        if (!isNaN(n) && !isNaN(e)) {
          const code = quotedDesc ? quotedDesc.split(/[\s/]+/)[0] : "CTRL";
          const pt = { id, northing: n, easting: e, elevation: z, code, desc: quotedDesc || "Civil 3D Control", hr: currentRod, type: "CTRL" };
          pointsMap.set(String(id), pt);
        }
      } else if ((cmd === "NEZ" || cmd === "PNEZD") && tokens.length >= 5) {
        const id = Number(tokens[1]) || tokens[1];
        const n = parseFloat(tokens[2]);
        const e = parseFloat(tokens[3]);
        const z = parseFloat(tokens[4]) || 0;
        const tailDesc = tokens.slice(5).join(" ");
        const fullDesc = quotedDesc || tailDesc || "FBK_PT";
        const code = fullDesc.split("/")[0].trim() || "FBK_PT";
        if (!isNaN(n) && !isNaN(e)) {
          const pt = { id, northing: n, easting: e, elevation: z, code, desc: fullDesc, hr: currentRod };
          pointsMap.set(String(id), pt);
          if (currentFigure) {
            currentFigure.vertices.push({ id: Number(id) || null, n, e, z });
          }
        }
      } else if (cmd === "SS" && tokens.length >= 5 && !isNaN(parseFloat(tokens[2])) && !isNaN(parseFloat(tokens[3]))) {
        // Coordinate-style SS record
        const id = Number(tokens[1]) || tokens[1];
        const n = parseFloat(tokens[2]);
        const e = parseFloat(tokens[3]);
        const z = parseFloat(tokens[4]) || 0;
        const hr = tokens[5] && !isNaN(parseFloat(tokens[5])) ? parseFloat(tokens[5]) : currentRod;
        const code = tokens[6] || quotedDesc || "SHOT";
        pointsMap.set(String(id), { id, northing: n, easting: e, elevation: z, code, desc: quotedDesc || code, hr });
      } else if (cmd === "BEG" && tokens[1]) {
        currentFigure = {
          name: tokens[1],
          vertices: []
        };
      } else if (cmd === "CONT" && tokens[1] && currentFigure) {
        const ref = pointsMap.get(String(tokens[1]));
        if (ref) {
          currentFigure.vertices.push({ id: ref.id, n: ref.northing, e: ref.easting, z: ref.elevation });
        }
      } else if ((cmd === "END" || cmd === "CLOSE") && currentFigure) {
        if (currentFigure.vertices.length >= 2) {
          const layer = window.CadEngine ? window.CadEngine.magnetCodeToLayer(currentFigure.name) : "BOUNDARY";
          figures.push({
            id: "fbk-fig-" + figures.length + "-" + Date.now(),
            layer,
            name: currentFigure.name,
            closed: cmd === "CLOSE",
            points: currentFigure.vertices
          });
        }
        currentFigure = null;
      }
    });

    return { points: Array.from(pointsMap.values()), linework: figures };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Topcon / Sokkia MAGNET Field Raw File (.RW5 / .RAW) Generator & Importer
  // Importable by MAGNET Field, MAGNET Office, and Sokkia SDR/RW5 tools
  // ─────────────────────────────────────────────────────────────────────────────
  generateMagnetRawContent() {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const meta = this._getActiveJobMeta();
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
    const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
    const filename = `JOB_${meta.jobNum}.rw5`;

    let rw5 = "";
    rw5 += `--Rw5 2.0 Topcon/Sokkia MAGNET Field Compatible Raw File\n`;
    rw5 += `--Job: ${meta.jobNum}\n`;
    rw5 += `--Date: ${dateStr}\n`;
    rw5 += `--Time: ${timeStr}\n`;
    rw5 += `--Controller: ${meta.equip.tablet} | Software: ${meta.equip.software}\n`;
    rw5 += `--Receiver: ${meta.equip.gps} | Total Station: ${meta.equip.totalStation}\n`;
    rw5 += `--Description: ${meta.jobDesc}\n`;
    rw5 += `MO,AD0,UN0,SF1.00000000,EC1,EO0.0,AU0\n`;

    const ctrlPts = points.filter(p => p.type === 'CTRL' || p.type === 'BM');
    ctrlPts.forEach(pt => {
      rw5 += `KP,PN${pt.id},N ${pt.northing.toFixed(4)},E ${pt.easting.toFixed(4)},EL${pt.elevation.toFixed(4)},--${pt.code}${pt.desc ? ' ' + pt.desc : ''}\n`;
    });

    if (ctrlPts.length > 0) {
      const hi = Number(ctrlPts[0].hi || 5.12).toFixed(4);
      const hr = Number(ctrlPts[0].hr || 5.00).toFixed(4);
      rw5 += `OC,OP${ctrlPts[0].id},N ${ctrlPts[0].northing.toFixed(4)},E ${ctrlPts[0].easting.toFixed(4)},EL${ctrlPts[0].elevation.toFixed(4)},--Occupied Control\n`;
      rw5 += `LS,HI${hi},HR${hr}\n`;
    }
    if (ctrlPts.length > 1) {
      rw5 += `BK,OP${ctrlPts[0].id},BP${ctrlPts[1].id},BS0.0000,BC0.0000,--Backsight Check\n`;
    }

    const sideShots = points.filter(p => p.type !== 'CTRL' && p.type !== 'BM');
    let lastHr = null;
    sideShots.forEach(pt => {
      const hr = Number(pt.hr || 6.562).toFixed(4);
      if (hr !== lastHr) {
        rw5 += `LS,HR${hr}\n`;
        lastHr = hr;
      }
      rw5 += `SP,PN${pt.id},N ${pt.northing.toFixed(4)},E ${pt.easting.toFixed(4)},EL${pt.elevation.toFixed(4)},--${pt.code}${pt.desc ? ' ' + pt.desc : ''}\n`;
    });

    rw5 += `--GNSS RTK Session | ${meta.equip.gps} | ${meta.equip.network} | Sats:24 | PDOP:1.05\n`;
    sideShots.forEach(pt => {
      rw5 += `GPS,PN${pt.id},LA0.000000,LN0.000000,EL${pt.elevation.toFixed(4)},N ${pt.northing.toFixed(4)},E ${pt.easting.toFixed(4)},--${pt.code}\n`;
    });

    return { filename, content: rw5, pointCount: points.length };
  }

  exportMagnetRaw(filename) {
    const res = this.generateMagnetRawContent();
    const outName = filename || res.filename;
    this._triggerDownload(res.content, outName, "text/plain;charset=utf-8");
    if (window.soundFX) window.soundFX.playShotBeep();

    if (window.aimChat) {
      window.aimChat.postSystemUpdate(
        `📤 MAGNET Field .RW5 exported: ${outName} (${res.pointCount} pts) — Ready for Topcon MAGNET Field / MAGNET Office.`
      );
    }
    return res;
  }

  // Parse an uploaded Topcon / Sokkia MAGNET Field (.RW5 / .RAW) file
  parseMagnetRaw(content) {
    const lines = content.split(/\r?\n/);
    const pointsMap = new Map();
    const metadata = {};
    let currentHr = 5.0;

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      if (line.startsWith("--")) {
        const metaMatch = line.match(/^--([A-Za-z]+):\s*(.+)$/);
        if (metaMatch) metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
        return;
      }

      const parts = line.split(",");
      const recType = (parts[0] || "").trim().toUpperCase();

      if (recType === "LS") {
        parts.slice(1).forEach(tok => {
          const t = tok.trim();
          if (t.toUpperCase().startsWith("HR")) {
            const val = parseFloat(t.slice(2));
            if (!isNaN(val)) currentHr = val;
          }
        });
        return;
      }

      if (recType === "KP" || recType === "SP" || recType === "OC" || recType === "GPS") {
        let pn = null, n = NaN, e = NaN, el = 0, note = "";
        parts.slice(1).forEach(tok => {
          const t = tok.trim();
          const up = t.toUpperCase();
          if (up.startsWith("PN")) pn = t.slice(2).trim();
          else if (up.startsWith("OP") && !pn) pn = t.slice(2).trim();
          else if (up.startsWith("N ") || /^N[-0-9.]/.test(up)) n = parseFloat(t.slice(1).trim());
          else if (up.startsWith("E ") || /^E[-0-9.]/.test(up)) e = parseFloat(t.slice(1).trim());
          else if (up.startsWith("EL")) el = parseFloat(t.slice(2).trim()) || 0;
          else if (t.startsWith("--")) note = t.slice(2).trim();
        });

        if (pn !== null && !isNaN(n) && !isNaN(e)) {
          const numericId = isNaN(Number(pn)) ? pn : Number(pn);
          const tokens = note.split(/\s+/).filter(Boolean);
          // Preserve MAGNET Field linework suffix (e.g. "EP1 B" or "CL1 E") if present
          let code = "MAG_PT";
          let desc = note;
          if (tokens.length >= 2 && /^(B|E|C|CLS)$/i.test(tokens[1])) {
            code = `${tokens[0]} ${tokens[1]}`.toUpperCase();
            desc = tokens.slice(2).join(" ");
          } else if (tokens.length >= 1) {
            code = tokens[0].toUpperCase();
            desc = tokens.slice(1).join(" ");
          }

          const existing = pointsMap.get(String(numericId));
          pointsMap.set(String(numericId), {
            id: numericId,
            northing: n,
            easting: e,
            elevation: el,
            code: existing && code === "MAG_PT" ? existing.code : code,
            desc: desc || (existing ? existing.desc : "Imported from MAGNET .RW5"),
            hr: currentHr,
            type: recType === "KP" || recType === "OC" ? "CTRL" : undefined
          });
        }
      }
    });

    return { points: Array.from(pointsMap.values()), metadata };
  }

  _triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.DxfManager = DxfManager;
window.dxfManager = new DxfManager();
