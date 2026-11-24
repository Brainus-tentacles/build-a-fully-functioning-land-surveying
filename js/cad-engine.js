// High Performance 2D Land Surveying CAD Linework Canvas Engine
class CadEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Viewport transform (World: Northing, Easting in survey feet)
    this.originN = 10250.0;
    this.originE = 10250.0;
    this.scale = 1.0; // pixels per foot
    this.minScale = 0.05;
    this.maxScale = 50.0;

    // Interaction states
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.activeTool = 'select'; // 'select', 'line', 'polyline', 'arc', 'parcel', 'point', 'measure', 'sketch'
    this.currentLayer = 'BOUNDARY';

    // Snapping
    this.snapRadius = 18; // pixels
    this.snappedPoint = null;
    this.snappedVertex = null;

    // Dynamic drawing state
    this.activeVertices = []; // vertices in progress for line/polyline/parcel/measure
    this.mouseWorldN = 10250.0;
    this.mouseWorldE = 10250.0;
    this.cursorScreenX = 0;
    this.cursorScreenY = 0;

    // Freehand sketch
    this.sketchStrokes = [];
    this.currentStroke = null;

    // Measurement readout
    this.lastMeasurement = null;

    // Selected entity
    this.selectedEntity = null;

    // Layers configuration
    this.layers = {
      BOUNDARY: { name: "Property Boundary", color: "#ef4444", lineWidth: 2.5, visible: true, locked: false },
      CENTERLINE: { name: "Road Centerline", color: "#eab308", lineWidth: 2.0, dash: [8, 4], visible: true, locked: false },
      EOP_CURB: { name: "Edge of Pavement / Curb", color: "#94a3b8", lineWidth: 1.8, visible: true, locked: false },
      BUILDING: { name: "Building Footprints", color: "#a855f7", lineWidth: 2.0, visible: true, locked: false },
      UTILITIES_WATER: { name: "Water Utilities", color: "#3b82f6", lineWidth: 2.0, dash: [10, 4], visible: true, locked: false },
      UTILITIES_SEWER: { name: "Sanitary Sewer", color: "#22c55e", lineWidth: 2.0, dash: [8, 3], visible: true, locked: false },
      UTILITIES_STORM: { name: "Storm Drainage", color: "#06b6d4", lineWidth: 2.0, visible: true, locked: false },
      FIELD_SKETCHES: { name: "Field Notes & Sketches", color: "#f97316", lineWidth: 1.5, visible: true, locked: false },
      POINTS: { name: "Survey Points & Labels", color: "#ffffff", lineWidth: 1.0, visible: true, locked: false, showLabels: true }
    };

    this.linework = [];
    this.touchPinchDist = null;

    if (this.canvas) {
      this.initEvents();
    }
  }

  init(initialLinework) {
    const saved = localStorage.getItem('survey_linework');
    if (saved) {
      try {
        this.linework = JSON.parse(saved);
      } catch (e) {
        this.linework = initialLinework ? [...initialLinework] : [];
      }
    } else {
      this.linework = initialLinework ? [...initialLinework] : [];
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Fit extents once data is ready
    setTimeout(() => {
      this.fitExtents();
      this.render();
    }, 50);
  }

  save() {
    localStorage.setItem('survey_linework', JSON.stringify(this.linework));
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.width = rect.width || 800;
    this.height = rect.height || 600;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  // Coordinate transformations
  // Surveying convention:
  // Northing (+Y) goes UP (North)
  // Easting (+X) goes RIGHT (East)
  worldToScreen(northing, easting) {
    const screenX = (easting - this.originE) * this.scale + (this.width / 2);
    const screenY = (this.height / 2) - (northing - this.originN) * this.scale;
    return { x: screenX, y: screenY };
  }

  screenToWorld(screenX, screenY) {
    const easting = this.originE + (screenX - (this.width / 2)) / this.scale;
    const northing = this.originN + ((this.height / 2) - screenY) / this.scale;
    return { northing, easting };
  }

  initEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', e => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', e => this.handleDblClick(e));

    // Touch events for Android mobile & tablets
    this.canvas.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });

    // Keyboard shortcuts (Escape, Enter)
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.cancelActiveDrawing();
      } else if (e.key === 'Enter') {
        this.finishActiveDrawing();
      }
    });
  }

  handleMouseDown(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1 || (e.button === 0 && (e.spaceKey || e.altKey || this.activeTool === 'pan'))) {
      // Pan
      this.isPanning = true;
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.button === 0) {
      this.handlePrimaryAction(x, y);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.cursorScreenX = x;
    this.cursorScreenY = y;

    if (this.isPanning) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      this.originE -= dx / this.scale;
      this.originN += dy / this.scale;
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.render();
      return;
    }

    const world = this.screenToWorld(x, y);
    this.mouseWorldN = world.northing;
    this.mouseWorldE = world.easting;

    // Check snapping to survey points
    this.checkSnap(x, y);

    // Freehand sketch stroke in progress
    if (this.activeTool === 'sketch' && this.currentStroke) {
      this.currentStroke.push({ n: this.mouseWorldN, e: this.mouseWorldE });
    }

    this.updateCoordinateHUD();
    this.render();
  }

  handleMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = 'crosshair';
    }

    if (this.activeTool === 'sketch' && this.currentStroke) {
      if (this.currentStroke.length > 1) {
        this.linework.push({
          id: 'sketch-' + Date.now(),
          layer: 'FIELD_SKETCHES',
          type: 'sketch',
          name: 'Field Sketch Note',
          color: this.layers.FIELD_SKETCHES.color,
          lineWidth: 2.0,
          points: [...this.currentStroke]
        });
        this.save();
      }
      this.currentStroke = null;
      this.render();
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    this.zoomAt(mouseX, mouseY, zoomFactor);
  }

  handleDblClick(e) {
    this.finishActiveDrawing();
  }

  // Touch Handling for Android Devices
  handleTouchStart(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.cursorScreenX = x;
      this.cursorScreenY = y;

      if (this.activeTool === 'pan') {
        this.isPanning = true;
      } else {
        this.handlePrimaryAction(x, y);
      }
    } else if (e.touches.length === 2) {
      this.isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchPinchDist = Math.hypot(dx, dy);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.cursorScreenX = x;
      this.cursorScreenY = y;

      if (this.isPanning || this.activeTool === 'pan') {
        const dx = x - this.lastMouseX;
        const dy = y - this.lastMouseY;
        this.originE -= dx / this.scale;
        this.originN += dy / this.scale;
        this.lastMouseX = x;
        this.lastMouseY = y;
        this.render();
      } else {
        const world = this.screenToWorld(x, y);
        this.mouseWorldN = world.northing;
        this.mouseWorldE = world.easting;
        this.checkSnap(x, y);
        if (this.activeTool === 'sketch' && this.currentStroke) {
          this.currentStroke.push({ n: this.mouseWorldN, e: this.mouseWorldE });
        }
        this.render();
      }
    } else if (e.touches.length === 2 && this.touchPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / this.touchPinchDist;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      this.zoomAt(midX, midY, factor);
      this.touchPinchDist = newDist;
    }
  }

  handleTouchEnd(e) {
    this.touchPinchDist = null;
    this.isPanning = false;
    if (this.activeTool === 'sketch' && this.currentStroke) {
      this.handleMouseUp(e);
    }
  }

  zoomAt(screenX, screenY, factor) {
    const worldBefore = this.screenToWorld(screenX, screenY);
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));

    this.scale = newScale;

    // Keep world coordinate stationary under the cursor
    const worldAfter = this.screenToWorld(screenX, screenY);
    this.originE += (worldBefore.easting - worldAfter.easting);
    this.originN += (worldBefore.northing - worldAfter.northing);

    this.render();
  }

  checkSnap(screenX, screenY) {
    this.snappedPoint = null;
    this.snappedVertex = null;

    if (!window.pointManager) return;
    const points = window.pointManager.getAll();

    let minDist = this.snapRadius;
    for (const pt of points) {
      const sp = this.worldToScreen(pt.northing, pt.easting);
      const dist = Math.hypot(screenX - sp.x, screenY - sp.y);
      if (dist < minDist) {
        minDist = dist;
        this.snappedPoint = pt;
      }
    }
  }

  handlePrimaryAction(screenX, screenY) {
    let targetN = this.mouseWorldN;
    let targetE = this.mouseWorldE;
    let targetZ = 0;
    let pointId = null;

    if (this.snappedPoint) {
      targetN = this.snappedPoint.northing;
      targetE = this.snappedPoint.easting;
      targetZ = this.snappedPoint.elevation;
      pointId = this.snappedPoint.id;
    }

    const vertex = { id: pointId, n: targetN, e: targetE, z: targetZ };

    switch (this.activeTool) {
      case 'select':
        if (this.snappedPoint) {
          this.selectPoint(this.snappedPoint);
        } else {
          this.selectedEntity = null;
        }
        break;

      case 'point':
        // Place a new survey point here
        const newCode = prompt("Enter Survey Point Code (e.g. TOPO, IP, EP, CL):", "TOPO");
        if (newCode !== null) {
          const pt = window.pointManager.addPoint({
            northing: targetN,
            easting: targetE,
            elevation: targetZ || 685.00,
            code: newCode,
            desc: "Placed on CAD canvas"
          });
          this.render();
        }
        break;

      case 'line':
        this.activeVertices.push(vertex);
        if (this.activeVertices.length === 2) {
          this.createLine('line', [...this.activeVertices]);
          this.activeVertices = [];
        }
        break;

      case 'polyline':
        this.activeVertices.push(vertex);
        break;

      case 'arc':
        this.activeVertices.push(vertex);
        if (this.activeVertices.length === 3) {
          this.createLine('arc', [...this.activeVertices]);
          this.activeVertices = [];
        }
        break;

      case 'parcel':
        this.activeVertices.push(vertex);
        break;

      case 'measure':
        this.activeVertices.push(vertex);
        if (this.activeVertices.length === 2) {
          const p1 = this.activeVertices[0];
          const p2 = this.activeVertices[1];
          this.lastMeasurement = PointManager.inverse(p1.n, p1.e, p2.n, p2.e, p1.z, p2.z);
          this.displayMeasurement(this.lastMeasurement, p1, p2);
          this.activeVertices = [];
        }
        break;

      case 'sketch':
        this.currentStroke = [{ n: targetN, e: targetE }];
        break;
    }

    this.render();
  }

  createLine(type, vertices, closed = false) {
    const layer = this.currentLayer || 'BOUNDARY';
    const layerCfg = this.layers[layer] || this.layers.BOUNDARY;

    const newLine = {
      id: 'line-' + Date.now(),
      layer: layer,
      type: type,
      name: `${layerCfg.name} Element`,
      color: layerCfg.color,
      lineWidth: layerCfg.lineWidth,
      dash: layerCfg.dash || [],
      closed: closed || type === 'parcel',
      points: vertices
    };

    this.linework.push(newLine);
    this.save();
    window.soundFX.playShotBeep();
    this.render();
    return newLine;
  }

  finishActiveDrawing() {
    if (this.activeTool === 'polyline' && this.activeVertices.length >= 2) {
      this.createLine('polyline', [...this.activeVertices], false);
      this.activeVertices = [];
    } else if (this.activeTool === 'parcel' && this.activeVertices.length >= 3) {
      this.createLine('polygon', [...this.activeVertices], true);
      this.activeVertices = [];
    }
    this.render();
  }

  cancelActiveDrawing() {
    this.activeVertices = [];
    this.currentStroke = null;
    this.lastMeasurement = null;
    this.render();
  }

  setTool(tool) {
    this.cancelActiveDrawing();
    this.activeTool = tool;
    this.canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';

    // Update active button state
    document.querySelectorAll('.cad-tool-btn').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const info = document.getElementById('cad-tool-instruction');
    if (info) {
      const instructions = {
        select: "Click on any point or monument to view coordinate attributes",
        line: "Click 1st point, then click 2nd point to draw a straight line",
        polyline: "Click points sequentially. Double-click or press Enter to finish",
        arc: "Click 3 points along curve (Begin Curve, Point on Curve, End Curve)",
        parcel: "Click boundary corners in order. Press Enter to close parcel & calculate acreage",
        point: "Click anywhere on canvas to set a new coordinate point",
        measure: "Click point 1, then click point 2 to calculate Bearing, Distance & Grade",
        sketch: "Click and drag to sketch field annotations and notes",
        pan: "Click and drag to pan across the survey site"
      };
      info.textContent = instructions[tool] || "";
    }
  }

  setLayer(layerName) {
    if (this.layers[layerName]) {
      this.currentLayer = layerName;
    }
  }

  selectPoint(point) {
    this.selectedEntity = { type: 'point', data: point };
    const inspector = document.getElementById('cad-inspector');
    if (inspector) {
      inspector.innerHTML = `
        <div class="inspector-card">
          <div class="inspector-header">
            <span class="badge ${point.type || 'TOPO'}">PT #${point.id}</span>
            <span class="inspector-code">${point.code}</span>
          </div>
          <div class="inspector-grid">
            <div class="insp-item"><span>Northing:</span><b>${point.northing.toFixed(3)}</b></div>
            <div class="insp-item"><span>Easting:</span><b>${point.easting.toFixed(3)}</b></div>
            <div class="insp-item"><span>Elevation:</span><b>${point.elevation.toFixed(3)}'</b></div>
            <div class="insp-item"><span>Description:</span><span>${point.desc || "None"}</span></div>
            <div class="insp-item"><span>Rod Height (HR):</span><span>${point.hr || 5.0}'</span></div>
          </div>
          <div class="inspector-actions">
            <button class="btn btn-sm btn-primary" onclick="window.aimChat.sendPointToChat(${point.id})">💬 Send to AIM Chat</button>
            <button class="btn btn-sm btn-secondary" onclick="window.cadEngine.zoomToPoint(${point.id})">🔍 Zoom Extents</button>
          </div>
        </div>
      `;
    }
  }

  displayMeasurement(m, p1, p2) {
    const modal = document.getElementById('cad-measure-results');
    if (modal) {
      modal.innerHTML = `
        <div class="measure-popup">
          <div class="measure-header">📐 Inverse Calculation (COGO)</div>
          <div class="measure-body">
            <div class="measure-row"><span>Bearing:</span> <b class="text-accent">${m.bearing}</b></div>
            <div class="measure-row"><span>Horizontal Dist:</span> <b>${m.horizDist.toFixed(3)} ft</b></div>
            <div class="measure-row"><span>Slope Dist:</span> <b>${m.slopeDist.toFixed(3)} ft</b></div>
            <div class="measure-row"><span>Delta North (ΔN):</span> <b>${m.deltaN.toFixed(3)} ft</b></div>
            <div class="measure-row"><span>Delta East (ΔE):</span> <b>${m.deltaE.toFixed(3)} ft</b></div>
            <div class="measure-row"><span>Delta Elev (ΔZ):</span> <b>${m.deltaZ.toFixed(3)} ft</b></div>
            <div class="measure-row"><span>Grade (%):</span> <b>${m.grade.toFixed(2)}%</b></div>
          </div>
          <button class="btn btn-sm btn-primary mt-2 w-full" onclick="window.aimChat.sendInverseToChat('${m.bearing}', ${m.horizDist.toFixed(2)}, ${m.deltaZ.toFixed(2)})">
            💬 Post Inverse to AIM Chat
          </button>
        </div>
      `;
    }
  }

  // Calculate polygon acreage and perimeter
  static calculatePolygonArea(points) {
    if (points.length < 3) return { sqFt: 0, acres: 0, perimeter: 0 };
    let area = 0;
    let perimeter = 0;

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].e * points[j].n;
      area -= points[j].e * points[i].n;

      const dN = points[j].n - points[i].n;
      const dE = points[j].e - points[i].e;
      perimeter += Math.hypot(dN, dE);
    }

    const sqFt = Math.abs(area) / 2;
    const acres = sqFt / 43560; // 43,560 sq ft per acre

    return { sqFt, acres, perimeter };
  }

  // Auto-connect survey codes into linework (Field-to-Finish)
  autoGenerateLinework() {
    if (!window.pointManager) return 0;
    const points = window.pointManager.getAll();
    let generatedCount = 0;

    // Groups points by prefix (e.g. EP1, CL1, BLDG1, FENCE, WATER)
    const codeGroups = {};

    points.forEach(pt => {
      const parts = (pt.code || "").split(" ");
      const prefix = parts[0].toUpperCase();
      if (!codeGroups[prefix]) codeGroups[prefix] = [];
      codeGroups[prefix].push({
        ...pt,
        modifier: parts.length > 1 ? parts[1].toUpperCase() : ""
      });
    });

    for (const [prefix, pts] of Object.entries(codeGroups)) {
      if (pts.length < 2) continue;

      let layer = 'FIELD_SKETCHES';
      let isClosed = false;

      if (prefix.startsWith("EP") || prefix.startsWith("CURB") || prefix.startsWith("TC")) {
        layer = 'EOP_CURB';
      } else if (prefix.startsWith("CL") || prefix.startsWith("ROAD")) {
        layer = 'CENTERLINE';
      } else if (prefix.startsWith("BLDG") || prefix.startsWith("HOUSE")) {
        layer = 'BUILDING';
        isClosed = true;
      } else if (prefix.startsWith("W") || prefix.startsWith("WM") || prefix.startsWith("WATER")) {
        layer = 'UTILITIES_WATER';
      } else if (prefix.startsWith("SAN") || prefix.startsWith("SEWER") || prefix.startsWith("SS")) {
        layer = 'UTILITIES_SEWER';
      } else if (prefix.startsWith("STM") || prefix.startsWith("STORM") || prefix.startsWith("SD")) {
        layer = 'UTILITIES_STORM';
      }

      // Check if line already exists
      const existing = this.linework.find(l => l.name === `Auto ${prefix}`);
      if (!existing) {
        this.createLine('polyline', pts.map(p => ({ id: p.id, n: p.northing, e: p.easting, z: p.elevation })), isClosed);
        generatedCount++;
      }
    }

    this.save();
    this.render();
    return generatedCount;
  }

  // Zoom Extents: calculate bounding box of all data and center
  fitExtents() {
    let minN = Infinity, maxN = -Infinity, minE = Infinity, maxE = -Infinity;

    if (window.pointManager) {
      window.pointManager.getAll().forEach(p => {
        if (p.northing < minN) minN = p.northing;
        if (p.northing > maxN) maxN = p.northing;
        if (p.easting < minE) minE = p.easting;
        if (p.easting > maxE) maxE = p.easting;
      });
    }

    this.linework.forEach(l => {
      l.points.forEach(p => {
        if (p.n < minN) minN = p.n;
        if (p.n > maxN) maxN = p.n;
        if (p.e < minE) minE = p.e;
        if (p.e > maxE) maxE = p.e;
      });
    });

    if (minN === Infinity) {
      this.originN = 10250.0;
      this.originE = 10250.0;
      this.scale = 1.0;
      return;
    }

    const rangeN = (maxN - minN) || 200;
    const rangeE = (maxE - minE) || 200;

    this.originN = (minN + maxN) / 2;
    this.originE = (minE + maxE) / 2;

    const pad = 1.35;
    const scaleN = this.height / (rangeN * pad);
    const scaleE = this.width / (rangeE * pad);

    this.scale = Math.min(scaleN, scaleE, 5.0);
    this.render();
  }

  zoomToPoint(pointId) {
    const pt = window.pointManager.getById(pointId);
    if (!pt) return;
    this.originN = pt.northing;
    this.originE = pt.easting;
    this.scale = 3.5;
    this.selectPoint(pt);
    this.render();
  }

  updateCoordinateHUD() {
    const hud = document.getElementById('cad-coord-hud');
    if (hud) {
      hud.innerHTML = `N: <b>${this.mouseWorldN.toFixed(2)}</b> &nbsp; E: <b>${this.mouseWorldE.toFixed(2)}</b> &nbsp; Scale: <b>1"=${(1 / (this.scale * 12)).toFixed(0)}'</b>`;
    }
  }

  // Main Canvas Render Loop
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Grid
    this.drawGrid(ctx);

    // 2. Draw Linework
    this.drawLinework(ctx);

    // 3. Draw Active Drawing In Progress
    this.drawActiveDrawing(ctx);

    // 4. Draw Survey Points
    if (this.layers.POINTS.visible) {
      this.drawSurveyPoints(ctx);
    }

    // 5. Draw Snap Indicator
    if (this.snappedPoint) {
      this.drawSnapBox(ctx, this.snappedPoint);
    }

    // 6. Draw Compass North Arrow & Scale Bar
    this.drawNorthArrowAndScale(ctx);
  }

  drawGrid(ctx) {
    // Dynamic grid spacing based on zoom scale
    let gridSpacing = 100; // survey feet
    if (this.scale > 2.0) gridSpacing = 20;
    else if (this.scale > 0.8) gridSpacing = 50;
    else if (this.scale < 0.2) gridSpacing = 500;

    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.width, this.height);

    const startE = Math.floor(topLeft.easting / gridSpacing) * gridSpacing;
    const endE = Math.ceil(bottomRight.easting / gridSpacing) * gridSpacing;

    const startN = Math.floor(bottomRight.northing / gridSpacing) * gridSpacing;
    const endN = Math.ceil(topLeft.northing / gridSpacing) * gridSpacing;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let e = startE; e <= endE; e += gridSpacing) {
      const sp = this.worldToScreen(this.originN, e);
      ctx.moveTo(sp.x, 0);
      ctx.lineTo(sp.x, this.height);
    }

    for (let n = startN; n <= endN; n += gridSpacing) {
      const sp = this.worldToScreen(n, this.originE);
      ctx.moveTo(0, sp.y);
      ctx.lineTo(this.width, sp.y);
    }
    ctx.stroke();

    // Coordinate tick labels on edges
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "9px 'Roboto Mono', monospace";
    for (let e = startE; e <= endE; e += gridSpacing * 2) {
      const sp = this.worldToScreen(this.originN, e);
      if (sp.x > 40 && sp.x < this.width - 40) {
        ctx.fillText(`E:${e}`, sp.x + 2, this.height - 6);
      }
    }
    for (let n = startN; n <= endN; n += gridSpacing * 2) {
      const sp = this.worldToScreen(n, this.originE);
      if (sp.y > 20 && sp.y < this.height - 20) {
        ctx.fillText(`N:${n}`, 4, sp.y - 3);
      }
    }
  }

  drawLinework(ctx) {
    this.linework.forEach(elem => {
      const layerCfg = this.layers[elem.layer] || this.layers.BOUNDARY;
      if (!layerCfg.visible) return;

      ctx.save();
      ctx.strokeStyle = elem.color || layerCfg.color;
      ctx.lineWidth = elem.lineWidth || layerCfg.lineWidth;
      if (elem.dash && elem.dash.length > 0) {
        ctx.setLineDash(elem.dash);
      } else {
        ctx.setLineDash([]);
      }

      const pts = elem.points;
      if (!pts || pts.length < 2) {
        ctx.restore();
        return;
      }

      ctx.beginPath();
      const first = this.worldToScreen(pts[0].n, pts[0].e);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < pts.length; i++) {
        const sp = this.worldToScreen(pts[i].n, pts[i].e);
        ctx.lineTo(sp.x, sp.y);
      }

      if (elem.closed || elem.type === 'polygon' || elem.type === 'parcel') {
        ctx.closePath();
        ctx.fillStyle = elem.color ? elem.color + "18" : layerCfg.color + "18";
        ctx.fill();
      }

      ctx.stroke();

      // If parcel, calculate and print acreage text in center
      if (elem.closed && pts.length >= 3) {
        const areaInfo = CadEngine.calculatePolygonArea(pts);
        let centerN = 0, centerE = 0;
        pts.forEach(p => { centerN += p.n; centerE += p.e; });
        centerN /= pts.length;
        centerE /= pts.length;

        const centerScreen = this.worldToScreen(centerN, centerE);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${areaInfo.acres.toFixed(3)} Acres`, centerScreen.x, centerScreen.y);
        ctx.font = "9px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(`(${areaInfo.sqFt.toLocaleString(undefined, {maximumFractionDigits:0})} Sq Ft)`, centerScreen.x, centerScreen.y + 13);
      }

      // Draw segment bearings & distances if scale is zoomed in
      if (this.scale > 0.45 && pts.length >= 2) {
        for (let i = 0; i < (elem.closed ? pts.length : pts.length - 1); i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          const midN = (p1.n + p2.n) / 2;
          const midE = (p1.e + p2.e) / 2;
          const midScreen = this.worldToScreen(midN, midE);

          const inv = PointManager.inverse(p1.n, p1.e, p2.n, p2.e);
          ctx.save();
          ctx.translate(midScreen.x, midScreen.y);

          // Angle in screen space
          const sp1 = this.worldToScreen(p1.n, p1.e);
          const sp2 = this.worldToScreen(p2.n, p2.e);
          let angle = Math.atan2(sp2.y - sp1.y, sp2.x - sp1.x);
          if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI;
          }
          ctx.rotate(angle);

          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.font = "9px 'Roboto Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${inv.bearing}  ${inv.horizDist.toFixed(2)}'`, 0, -4);
          ctx.restore();
        }
      }

      ctx.restore();
    });
  }

  drawActiveDrawing(ctx) {
    if (this.activeVertices.length === 0 && !this.currentStroke) return;

    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 3]);

    if (this.activeVertices.length > 0) {
      ctx.beginPath();
      const first = this.worldToScreen(this.activeVertices[0].n, this.activeVertices[0].e);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < this.activeVertices.length; i++) {
        const sp = this.worldToScreen(this.activeVertices[i].n, this.activeVertices[i].e);
        ctx.lineTo(sp.x, sp.y);
      }

      // Rubber-band line to cursor
      ctx.lineTo(this.cursorScreenX, this.cursorScreenY);
      ctx.stroke();

      // Live bearing/distance on rubber band line
      const lastVertex = this.activeVertices[this.activeVertices.length - 1];
      const liveInv = PointManager.inverse(lastVertex.n, lastVertex.e, this.mouseWorldN, this.mouseWorldE);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px 'Roboto Mono', monospace";
      ctx.fillText(`${liveInv.bearing} | ${liveInv.horizDist.toFixed(2)}'`, this.cursorScreenX + 12, this.cursorScreenY - 8);
    }

    if (this.currentStroke && this.currentStroke.length > 0) {
      ctx.strokeStyle = this.layers.FIELD_SKETCHES.color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      const f = this.worldToScreen(this.currentStroke[0].n, this.currentStroke[0].e);
      ctx.moveTo(f.x, f.y);
      for (let i = 1; i < this.currentStroke.length; i++) {
        const sp = this.worldToScreen(this.currentStroke[i].n, this.currentStroke[i].e);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSurveyPoints(ctx) {
    if (!window.pointManager) return;
    const points = window.pointManager.getAll();

    points.forEach(pt => {
      const sp = this.worldToScreen(pt.northing, pt.easting);

      // Cull points outside canvas view
      if (sp.x < -30 || sp.x > this.width + 30 || sp.y < -30 || sp.y > this.height + 30) {
        return;
      }

      ctx.save();

      // Point symbol based on type
      let symbolColor = "#38bdf8";
      if (pt.type === 'CTRL') symbolColor = "#f59e0b"; // triangle for control
      else if (pt.type === 'BM') symbolColor = "#10b981"; // square for benchmark
      else if (pt.type === 'BNDY') symbolColor = "#ef4444"; // red circle with cross for boundary
      else if (pt.type === 'ROAD') symbolColor = "#94a3b8";
      else if (pt.type === 'UTIL') symbolColor = "#06b6d4";

      ctx.strokeStyle = symbolColor;
      ctx.fillStyle = symbolColor;
      ctx.lineWidth = 1.5;

      if (pt.type === 'CTRL') {
        // Delta / Triangle
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - 6);
        ctx.lineTo(sp.x + 5, sp.y + 4);
        ctx.lineTo(sp.x - 5, sp.y + 4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
      } else if (pt.type === 'BM') {
        // Benchmark Square with center dot
        ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
        ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
      } else if (pt.type === 'BNDY') {
        // Boundary Monument circle with crosshair
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4.5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sp.x - 6, sp.y); ctx.lineTo(sp.x + 6, sp.y);
        ctx.moveTo(sp.x, sp.y - 6); ctx.lineTo(sp.x, sp.y + 6);
        ctx.stroke();
      } else {
        // Standard survey cross / 'X'
        ctx.beginPath();
        ctx.moveTo(sp.x - 3.5, sp.y - 3.5); ctx.lineTo(sp.x + 3.5, sp.y + 3.5);
        ctx.moveTo(sp.x - 3.5, sp.y + 3.5); ctx.lineTo(sp.x + 3.5, sp.y - 3.5);
        ctx.stroke();
      }

      // Point labels: Pt#, Elevation, Code
      if (this.layers.POINTS.showLabels && this.scale > 0.25) {
        ctx.font = "9px 'Roboto Mono', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${pt.id}`, sp.x + 6, sp.y - 5);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "8px 'Roboto Mono', monospace";
        ctx.fillText(`${pt.elevation.toFixed(2)}'`, sp.x + 6, sp.y + 5);

        ctx.fillStyle = symbolColor;
        ctx.fillText(`${pt.code}`, sp.x + 6, sp.y + 14);
      }

      ctx.restore();
    });
  }

  drawSnapBox(ctx, point) {
    const sp = this.worldToScreen(point.northing, point.easting);
    ctx.save();
    ctx.strokeStyle = "#f59e0b"; // vibrant amber
    ctx.lineWidth = 2.0;
    ctx.strokeRect(sp.x - 8, sp.y - 8, 16, 16);

    // Snap tooltip
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(sp.x + 12, sp.y - 18, 130, 36);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.strokeRect(sp.x + 12, sp.y - 18, 130, 36);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`SNAP: PT #${point.id} (${point.code})`, sp.x + 16, sp.y - 6);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "8px 'Roboto Mono', monospace";
    ctx.fillText(`N:${point.northing.toFixed(1)} E:${point.easting.toFixed(1)}`, sp.x + 16, sp.y + 6);
    ctx.fillText(`Elev: ${point.elevation.toFixed(2)} ft`, sp.x + 16, sp.y + 14);

    ctx.restore();
  }

  drawNorthArrowAndScale(ctx) {
    ctx.save();

    // 1. North Arrow in top-right
    const naX = this.width - 38;
    const naY = 42;

    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.beginPath();
    ctx.arc(naX, naY, 20, 0, 2 * Math.PI);
    ctx.fill();

    // North arrow triangle
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(naX, naY - 14);
    ctx.lineTo(naX + 5, naY + 4);
    ctx.lineTo(naX, naY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(naX, naY - 14);
    ctx.lineTo(naX - 5, naY + 4);
    ctx.lineTo(naX, naY);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("N", naX, naY - 17);

    // 2. Scale Bar in bottom-left
    const sbX = 16;
    const sbY = this.height - 24;
    // Compute round distance in feet that fits in ~100px
    const targetPx = 100;
    const targetFt = targetPx / this.scale;
    let roundFt = 50;
    if (targetFt > 200) roundFt = 500;
    else if (targetFt > 80) roundFt = 100;
    else if (targetFt > 40) roundFt = 50;
    else if (targetFt > 15) roundFt = 20;
    else roundFt = 10;

    const barPx = roundFt * this.scale;

    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(sbX - 4, sbY - 18, barPx + 16, 26);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sbX, sbY, barPx, 3);
    ctx.fillRect(sbX, sbY - 4, 2, 7);
    ctx.fillRect(sbX + barPx, sbY - 4, 2, 7);

    ctx.font = "9px 'Roboto Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${roundFt} FT`, sbX + (barPx / 2), sbY - 6);

    ctx.restore();
  }
}

window.CadEngine = CadEngine;
