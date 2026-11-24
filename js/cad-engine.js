// Simplistic SUE (Subsurface Utility Engineering) Linework & Sketch Engine
// Clean, touch-friendly utility tracing, pothole recording, and DXF upload/download
class CadEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Viewport transform (World: Northing, Easting in survey feet)
    this.originN = 10250.0;
    this.originE = 10100.0;
    this.scale = 1.35; // pixels per foot
    this.minScale = 0.1;
    this.maxScale = 30.0;

    // Interaction states
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.activeTool = 'sue_line'; // 'sue_line', 'sue_pothole', 'measure', 'pan', 'select'
    this.currentUtility = 'Water'; // 'Water', 'Gas', 'Electric', 'Telecom', 'Sewer', 'Storm'

    // Snapping
    this.snapRadius = 22; // pixels
    this.snappedPoint = null;

    // Active linework vertices
    this.activeVertices = [];
    this.mouseWorldN = 10250.0;
    this.mouseWorldE = 10100.0;
    this.cursorScreenX = 0;
    this.cursorScreenY = 0;

    // APWA Standard SUE Utility Definitions & Colors
    this.utilities = {
      Water: { name: "Water Main (Blue)", color: "#0284c7", layer: "UTILITIES_WATER", dash: [] },
      Gas: { name: "Gas Pipeline (Yellow)", color: "#eab308", layer: "UTILITIES_GAS", dash: [10, 4] },
      Electric: { name: "Electric / Power (Red)", color: "#ef4444", layer: "UTILITIES_ELECTRIC", dash: [] },
      Telecom: { name: "Telecom / Fiber (Orange)", color: "#f97316", layer: "UTILITIES_TELECOM", dash: [8, 3] },
      Sewer: { name: "Sanitary Sewer (Green)", color: "#22c55e", layer: "UTILITIES_SEWER", dash: [] },
      Storm: { name: "Storm Drain (Cyan)", color: "#06b6d4", layer: "UTILITIES_STORM", dash: [12, 4] }
    };

    // SUE Linework layers
    this.layers = {
      UTILITIES_WATER: { name: "Water (Blue)", color: "#0284c7", visible: true },
      UTILITIES_GAS: { name: "Gas (Yellow)", color: "#eab308", visible: true },
      UTILITIES_ELECTRIC: { name: "Electric (Red)", color: "#ef4444", visible: true },
      UTILITIES_TELECOM: { name: "Telecom (Orange)", color: "#f97316", visible: true },
      UTILITIES_SEWER: { name: "Sewer (Green)", color: "#22c55e", visible: true },
      UTILITIES_STORM: { name: "Storm (Cyan)", color: "#06b6d4", visible: true },
      BOUNDARY: { name: "Boundary (White)", color: "#ffffff", visible: true },
      POINTS: { name: "Survey & SUE Points", color: "#38bdf8", visible: true, showLabels: true }
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
    this.height = rect.height || 500;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.render();
  }

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
    // Mouse
    this.canvas.addEventListener('mousedown', e => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', () => this.finishActiveDrawing());

    // Touch for Android
    this.canvas.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this.handleTouchEnd(e));

    // Keyboard
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.cancelActiveDrawing();
      if (e.key === 'Enter') this.finishActiveDrawing();
    });
  }

  handleMouseDown(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1 || this.activeTool === 'pan') {
      this.isPanning = true;
      this.lastMouseX = x;
      this.lastMouseY = y;
      return;
    }

    if (e.button === 0) {
      this.handleAction(x, y);
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

    this.checkSnap(x, y);
    this.updateHUD();
    this.render();
  }

  handleMouseUp() {
    this.isPanning = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    this.zoomAt(mx, my, factor);
  }

  handleTouchStart(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.cursorScreenX = x;
      this.cursorScreenY = y;

      if (this.activeTool === 'pan') {
        this.isPanning = true;
      } else {
        this.handleAction(x, y);
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
      const t = e.touches[0];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
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

  handleTouchEnd() {
    this.touchPinchDist = null;
    this.isPanning = false;
  }

  zoomAt(screenX, screenY, factor) {
    const worldBefore = this.screenToWorld(screenX, screenY);
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    this.scale = newScale;

    const worldAfter = this.screenToWorld(screenX, screenY);
    this.originE += (worldBefore.easting - worldAfter.easting);
    this.originN += (worldBefore.northing - worldAfter.northing);
    this.render();
  }

  checkSnap(screenX, screenY) {
    this.snappedPoint = null;
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

  handleAction(screenX, screenY) {
    let targetN = this.mouseWorldN;
    let targetE = this.mouseWorldE;
    let targetZ = 685.00;
    let pointId = null;

    if (this.snappedPoint) {
      targetN = this.snappedPoint.northing;
      targetE = this.snappedPoint.easting;
      targetZ = this.snappedPoint.elevation;
      pointId = this.snappedPoint.id;
    }

    const vertex = { id: pointId, n: targetN, e: targetE, z: targetZ };

    if (this.activeTool === 'select') {
      if (this.snappedPoint) {
        this.inspectPoint(this.snappedPoint);
      }
    } else if (this.activeTool === 'sue_line') {
      // Connect utility line
      this.activeVertices.push(vertex);
    } else if (this.activeTool === 'sue_pothole') {
      // Record SUE Level A Pothole
      const util = this.currentUtility;
      const depthStr = prompt(`Enter ${util} depth to top of pipe (ft):`, "3.50");
      if (depthStr !== null) {
        const depth = parseFloat(depthStr) || 3.5;
        const size = prompt("Enter pipe size & material (e.g. 4in Steel, 8in DIP, 2in Plastic):", "4in Steel");
        const code = `SUE TH ${util.toUpperCase()}`;

        const pt = window.pointManager.addPoint({
          northing: targetN,
          easting: targetE,
          elevation: targetZ,
          code: code,
          desc: `Level A Pothole: ${size || util}, Depth: ${depth.toFixed(2)}ft`,
          type: "UTIL"
        });

        // Add to SUE test holes list
        if (window.SAMPLE_DATA && window.SAMPLE_DATA.testHoles) {
          window.SAMPLE_DATA.testHoles.push({
            id: "TH-" + (window.SAMPLE_DATA.testHoles.length + 1),
            pointId: pt.id,
            utilityType: util,
            qualityLevel: "Level A (Vacuum Pothole)",
            depthToTop: depth,
            diameter: size || "Standard",
            material: size || "Utility",
            groundElev: targetZ,
            utilityElev: targetZ - depth,
            northing: targetN,
            easting: targetE,
            status: "Verified Clear",
            notes: "Recorded on SUE Linework Tool"
          });
        }

        this.render();
        alert(`Recorded SUE Test Hole at Depth ${depth.toFixed(2)} ft!`);
      }
    } else if (this.activeTool === 'measure') {
      this.activeVertices.push(vertex);
      if (this.activeVertices.length === 2) {
        const p1 = this.activeVertices[0];
        const p2 = this.activeVertices[1];
        const inv = PointManager.inverse(p1.n, p1.e, p2.n, p2.e, p1.z, p2.z);
        this.showMeasurePopup(inv);
        this.activeVertices = [];
      }
    }

    this.render();
  }

  finishActiveDrawing() {
    if (this.activeVertices.length >= 2) {
      const utilDef = this.utilities[this.currentUtility] || this.utilities.Water;
      const newLine = {
        id: "sue-line-" + Date.now(),
        layer: utilDef.layer,
        utilityType: this.currentUtility,
        type: "polyline",
        name: `${this.currentUtility} Utility Line`,
        color: utilDef.color,
        lineWidth: 2.5,
        dash: utilDef.dash || [],
        points: [...this.activeVertices]
      };

      this.linework.push(newLine);
      this.save();
      window.soundFX.playShotBeep();
      this.activeVertices = [];
      this.render();
    }
  }

  cancelActiveDrawing() {
    this.activeVertices = [];
    this.render();
  }

  setUtility(utilName) {
    if (this.utilities[utilName]) {
      this.currentUtility = utilName;
    }
  }

  setTool(tool) {
    this.cancelActiveDrawing();
    this.activeTool = tool;
    this.canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';

    document.querySelectorAll('.sue-tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const hint = document.getElementById('sue-tool-hint');
    if (hint) {
      const map = {
        sue_line: `Tracing ${this.currentUtility} utility line. Tap points, then click 'Finish Line'.`,
        sue_pothole: `Tap on map to place SUE Vacuum Pothole / Test Hole with depth & pipe size.`,
        measure: `Tap two points to calculate utility clearance, bearing & distance.`,
        pan: `Drag to pan across the survey site.`,
        select: `Tap any point to inspect utility attributes.`
      };
      hint.textContent = map[tool] || "";
    }
  }

  // Send SUE linework summary directly to Office CAD via AIM
  sendSueLineworkToAim() {
    const count = this.linework.length;
    const pts = window.pointManager ? window.pointManager.getAll().filter(p => p.type === 'UTIL').length : 0;

    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">⚡ SUE UTILITY LINEWORK SHARED</span>
        <div>Total SUE Lines: <b>${count}</b> | Utility Points/Potholes: <b>${pts}</b></div>
        <div>Utilities: <b class="text-accent">Water, Gas, Power, Telecom, Sewer</b></div>
        <div class="badge-coords">Ready for Civil 3D / AutoCAD import. Standard APWA layer standards applied.</div>
        <span class="badge-link" onclick="window.app.switchTab('cad')">🔍 Open in SUE Linework Tool</span>
      </div>
    `;

    if (window.aimChat) {
      window.aimChat.sendMessage(`Transmitted SUE Linework (${count} runs, ${pts} potholes/utilities) to CAD Office`, html);
      window.app.switchTab('aim');
      alert("SUE Linework successfully shared to Office CAD via AIM!");
    }
  }

  showMeasurePopup(inv) {
    const el = document.getElementById('cad-measure-results');
    if (el) {
      el.innerHTML = `
        <div class="measure-popup">
          <div class="measure-header">📐 Utility Clearance & Bearing</div>
          <div class="measure-body">
            <div class="measure-row"><span>Bearing:</span> <b class="text-accent">${inv.bearing}</b></div>
            <div class="measure-row"><span>Clearance Dist:</span> <b>${inv.horizDist.toFixed(2)} ft</b></div>
            <div class="measure-row"><span>Delta Elev:</span> <b>${inv.deltaZ.toFixed(2)} ft</b></div>
          </div>
          <button class="btn btn-xs btn-primary mt-2 w-full" onclick="window.aimChat.sendInverseToChat('${inv.bearing}', ${inv.horizDist.toFixed(2)}, ${inv.deltaZ.toFixed(2)})">
            💬 Post Clearance to AIM
          </button>
        </div>
      `;
    }
  }

  inspectPoint(pt) {
    const el = document.getElementById('cad-inspector');
    if (el) {
      el.innerHTML = `
        <div class="inspector-card">
          <div class="inspector-header">
            <span class="badge ${pt.type || 'UTIL'}">PT #${pt.id}</span>
            <span class="inspector-code">${pt.code}</span>
          </div>
          <div class="inspector-grid">
            <div class="insp-item"><span>Northing:</span><b>${pt.northing.toFixed(2)}</b></div>
            <div class="insp-item"><span>Easting:</span><b>${pt.easting.toFixed(2)}</b></div>
            <div class="insp-item"><span>Ground Elev:</span><b>${pt.elevation.toFixed(2)}'</b></div>
            <div class="insp-item"><span>Description:</span><span>${pt.desc || '-'}</span></div>
          </div>
          <div class="inspector-actions">
            <button class="btn btn-xs btn-primary" onclick="window.aimChat.sendPointToChat(${pt.id})">💬 Send to AIM</button>
            <button class="btn btn-xs btn-secondary" onclick="window.cadEngine.zoomToPoint(${pt.id})">🔍 Zoom</button>
          </div>
        </div>
      `;
    }
  }

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

    if (minN === Infinity) {
      this.originN = 10250.0;
      this.originE = 10100.0;
      this.scale = 1.35;
      return;
    }

    this.originN = (minN + maxN) / 2;
    this.originE = (minE + maxE) / 2;

    const pad = 1.4;
    const rangeN = (maxN - minN) || 200;
    const rangeE = (maxE - minE) || 200;

    this.scale = Math.min(this.height / (rangeN * pad), this.width / (rangeE * pad), 3.0);
    this.render();
  }

  zoomToPoint(pointId) {
    const pt = window.pointManager.getById(pointId);
    if (!pt) return;
    this.originN = pt.northing;
    this.originE = pt.easting;
    this.scale = 3.5;
    this.inspectPoint(pt);
    this.render();
  }

  updateHUD() {
    const el = document.getElementById('cad-coord-hud');
    if (el) {
      el.innerHTML = `N: <b>${this.mouseWorldN.toFixed(1)}</b> E: <b>${this.mouseWorldE.toFixed(1)}</b> &nbsp; SUE Utility: <b class="text-accent">${this.currentUtility}</b>`;
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Grid
    this.drawGrid(ctx);

    // 2. Linework
    this.drawLinework(ctx);

    // 3. Active in-progress line
    this.drawActive(ctx);

    // 4. Survey & SUE Points
    this.drawPoints(ctx);

    // 5. Snapping indicator
    if (this.snappedPoint) {
      this.drawSnap(ctx, this.snappedPoint);
    }
  }

  drawGrid(ctx) {
    const gridSpacing = this.scale > 1.5 ? 25 : 50; // feet
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.width, this.height);

    const startE = Math.floor(topLeft.easting / gridSpacing) * gridSpacing;
    const endE = Math.ceil(bottomRight.easting / gridSpacing) * gridSpacing;
    const startN = Math.floor(bottomRight.northing / gridSpacing) * gridSpacing;
    const endN = Math.ceil(topLeft.northing / gridSpacing) * gridSpacing;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let e = startE; e <= endE; e += gridSpacing) {
      const sp = this.worldToScreen(this.originN, e);
      ctx.moveTo(sp.x, 0); ctx.lineTo(sp.x, this.height);
    }
    for (let n = startN; n <= endN; n += gridSpacing) {
      const sp = this.worldToScreen(n, this.originE);
      ctx.moveTo(0, sp.y); ctx.lineTo(this.width, sp.y);
    }
    ctx.stroke();
  }

  drawLinework(ctx) {
    this.linework.forEach(elem => {
      const pts = elem.points;
      if (!pts || pts.length < 2) return;

      ctx.save();
      ctx.strokeStyle = elem.color || "#0284c7";
      ctx.lineWidth = elem.lineWidth || 2.5;
      if (elem.dash && elem.dash.length > 0) ctx.setLineDash(elem.dash);

      ctx.beginPath();
      const first = this.worldToScreen(pts[0].n, pts[0].e);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < pts.length; i++) {
        const sp = this.worldToScreen(pts[i].n, pts[i].e);
        ctx.lineTo(sp.x, sp.y);
      }

      if (elem.closed) {
        ctx.closePath();
        ctx.fillStyle = elem.color ? elem.color + "14" : "#ffffff14";
        ctx.fill();
      }

      ctx.stroke();

      // Draw utility name & length label
      if (this.scale > 0.6 && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[1];
        const midN = (p1.n + p2.n) / 2;
        const midE = (p1.e + p2.e) / 2;
        const sp = this.worldToScreen(midN, midE);

        const dist = Math.hypot(p2.n - p1.n, p2.e - p1.e);

        ctx.fillStyle = elem.color || "#ffffff";
        ctx.font = "bold 9px 'Roboto Mono', monospace";
        ctx.fillText(`${elem.utilityType || 'LINE'} (${dist.toFixed(0)}')`, sp.x + 4, sp.y - 4);
      }

      ctx.restore();
    });
  }

  drawActive(ctx) {
    if (this.activeVertices.length === 0) return;

    ctx.save();
    const utilDef = this.utilities[this.currentUtility] || this.utilities.Water;
    ctx.strokeStyle = utilDef.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);

    ctx.beginPath();
    const first = this.worldToScreen(this.activeVertices[0].n, this.activeVertices[0].e);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < this.activeVertices.length; i++) {
      const sp = this.worldToScreen(this.activeVertices[i].n, this.activeVertices[i].e);
      ctx.lineTo(sp.x, sp.y);
    }

    ctx.lineTo(this.cursorScreenX, this.cursorScreenY);
    ctx.stroke();

    ctx.restore();
  }

  drawPoints(ctx) {
    if (!window.pointManager) return;
    const points = window.pointManager.getAll();

    points.forEach(pt => {
      const sp = this.worldToScreen(pt.northing, pt.easting);
      if (sp.x < -20 || sp.x > this.width + 20 || sp.y < -20 || sp.y > this.height + 20) return;

      ctx.save();

      // SUE utility points
      if (pt.type === 'UTIL' || pt.code.includes("SUE") || pt.code.includes("TH")) {
        ctx.fillStyle = "#f59e0b"; // SUE Pothole Amber
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (pt.type === 'BNDY') {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
      } else {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(sp.x - 2, sp.y - 2, 4, 4);
      }

      // Point code label
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px 'Roboto Mono', monospace";
      ctx.fillText(`${pt.code}`, sp.x + 6, sp.y - 3);

      ctx.restore();
    });
  }

  drawSnap(ctx, pt) {
    const sp = this.worldToScreen(pt.northing, pt.easting);
    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(sp.x - 7, sp.y - 7, 14, 14);

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(sp.x + 10, sp.y - 12, 100, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${pt.code}`, sp.x + 14, sp.y + 4);
    ctx.restore();
  }
}

window.CadEngine = CadEngine;
