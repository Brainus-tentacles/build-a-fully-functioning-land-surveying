// Simplistic Land Surveying Linework & Field Drawing Engine
// Clean, touch-friendly linework tool for boundary, road, utilities & buildings with DXF upload/download
class CadEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Viewport transform (World: Northing, Easting in survey feet)
    this.originN = 10250.0;
    this.originE = 10250.0;
    this.scale = 1.0;
    this.minScale = 0.05;
    this.maxScale = 30.0;

    // Interaction states
    this.isPanning = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.activeTool = 'line'; // 'line', 'point', 'measure', 'pan', 'select'
    this.currentFeature = 'BOUNDARY'; // 'BOUNDARY', 'CENTERLINE', 'EOP_CURB', 'BUILDING', 'UTILITIES'

    // Snapping
    this.snapRadius = 22; // pixels
    this.snappedPoint = null;

    // Active linework vertices
    this.activeVertices = [];
    this.mouseWorldN = 10250.0;
    this.mouseWorldE = 10250.0;
    this.cursorScreenX = 0;
    this.cursorScreenY = 0;

    // Survey Feature Definitions
    this.features = {
      BOUNDARY: { name: "Boundary", color: "#ef4444", lineWidth: 2.5, closed: true, dash: [] },
      CENTERLINE: { name: "Road Centerline", color: "#eab308", lineWidth: 2.0, closed: false, dash: [8, 4] },
      EOP_CURB: { name: "Edge of Pavement", color: "#94a3b8", lineWidth: 1.8, closed: false, dash: [] },
      BUILDING: { name: "Building Footprint", color: "#a855f7", lineWidth: 2.0, closed: true, dash: [] },
      UTILITIES: { name: "Utilities / SUE", color: "#0284c7", lineWidth: 2.0, closed: false, dash: [12, 4] },
      SKETCH: { name: "Field Sketch", color: "#f97316", lineWidth: 1.5, closed: false, dash: [] }
    };

    // Layer visibility
    this.layers = {
      BOUNDARY: { name: "Boundary (Red)", color: "#ef4444", visible: true },
      CENTERLINE: { name: "Centerline (Yellow)", color: "#eab308", visible: true },
      EOP_CURB: { name: "EOP / Curb (Gray)", color: "#94a3b8", visible: true },
      BUILDING: { name: "Building (Purple)", color: "#a855f7", visible: true },
      UTILITIES: { name: "Utilities / SUE (Blue)", color: "#0284c7", visible: true },
      FIELD_SKETCHES: { name: "Field Sketches (Orange)", color: "#f97316", visible: true },
      POINTS: { name: "Survey Points", color: "#ffffff", visible: true, showLabels: true }
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
    this.canvas.addEventListener('mousedown', e => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', () => this.finishActiveDrawing());

    this.canvas.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

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
    } else if (this.activeTool === 'line') {
      this.activeVertices.push(vertex);
    } else if (this.activeTool === 'point') {
      const code = prompt("Enter Survey Point Code (e.g. IP, REBAR, EP, CL, BM):", "IP FND");
      if (code !== null) {
        const desc = prompt("Enter Description / Notes:", "Survey Monument") || "";
        window.pointManager.addPoint({
          northing: targetN,
          easting: targetE,
          elevation: targetZ,
          code: code.toUpperCase(),
          desc
        });
        this.render();
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
      const feat = this.features[this.currentFeature] || this.features.BOUNDARY;
      const newLine = {
        id: "line-" + Date.now(),
        layer: this.currentFeature,
        name: `${feat.name} Linework`,
        color: feat.color,
        lineWidth: feat.lineWidth,
        dash: feat.dash || [],
        closed: feat.closed && this.activeVertices.length >= 3,
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

  setFeature(featureName) {
    if (this.features[featureName]) {
      this.currentFeature = featureName;
      document.querySelectorAll('.survey-feat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.feat === featureName);
      });
      const hint = document.getElementById('cad-tool-instruction');
      if (hint) {
        hint.textContent = `Drawing ${this.features[featureName].name}. Tap points to connect line, then tap 'Finish Line'.`;
      }
    }
  }

  setTool(tool) {
    this.cancelActiveDrawing();
    this.activeTool = tool;
    this.canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';

    document.querySelectorAll('.cad-tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const hint = document.getElementById('cad-tool-instruction');
    if (hint) {
      const map = {
        line: `Drawing ${this.features[this.currentFeature].name}. Tap points to connect, then click 'Finish Line'.`,
        point: `Tap anywhere on canvas to set a new coordinate point.`,
        measure: `Tap two points to calculate Quadrant Bearing & Horizontal Distance (COGO).`,
        pan: `Drag to pan across the survey site.`,
        select: `Tap any point to inspect coordinate attributes.`
      };
      hint.textContent = map[tool] || "";
    }
  }

  sendLineworkToAim() {
    const count = this.linework.length;
    const bndy = this.linework.filter(l => l.layer === 'BOUNDARY').length;
    const road = this.linework.filter(l => l.layer === 'CENTERLINE' || l.layer === 'EOP_CURB').length;

    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">📐 SURVEY LINEWORK SHARED</span>
        <div>Total Elements: <b>${count}</b> (Boundary: ${bndy}, Road: ${road})</div>
        <div class="badge-coords">Layers: BOUNDARY, CENTERLINE, EOP_CURB, UTILITIES. Ready for Civil 3D import.</div>
        <span class="badge-link" onclick="window.app.switchTab('cad')">🔍 View on Survey Linework Canvas</span>
      </div>
    `;

    if (window.aimChat) {
      window.aimChat.sendMessage(`Transmitted Survey Linework (${count} elements) to CAD Office`, html);
      window.app.switchTab('aim');
      alert("Survey linework shared to Office CAD via AIM!");
    }
  }

  showMeasurePopup(inv) {
    const el = document.getElementById('cad-measure-results');
    if (el) {
      el.innerHTML = `
        <div class="measure-popup">
          <div class="measure-header">📐 Inverse Calculation (COGO)</div>
          <div class="measure-body">
            <div class="measure-row"><span>Quadrant Bearing:</span> <b class="text-accent">${inv.bearing}</b></div>
            <div class="measure-row"><span>Horizontal Distance:</span> <b>${inv.horizDist.toFixed(2)} ft</b></div>
            <div class="measure-row"><span>Slope Distance:</span> <b>${inv.slopeDist.toFixed(2)} ft</b></div>
            <div class="measure-row"><span>Delta North (ΔN):</span> <b>${inv.deltaN.toFixed(2)} ft</b></div>
            <div class="measure-row"><span>Delta East (ΔE):</span> <b>${inv.deltaE.toFixed(2)} ft</b></div>
            <div class="measure-row"><span>Grade (%):</span> <b>${inv.grade.toFixed(2)}%</b></div>
          </div>
          <button class="btn btn-xs btn-primary mt-2 w-full" onclick="window.aimChat.sendInverseToChat('${inv.bearing}', ${inv.horizDist.toFixed(2)}, ${inv.deltaZ.toFixed(2)})">
            💬 Post Inverse to AIM Chat
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
            <span class="badge ${pt.type || 'TOPO'}">PT #${pt.id}</span>
            <span class="inspector-code">${pt.code}</span>
          </div>
          <div class="inspector-grid">
            <div class="insp-item"><span>Northing:</span><b>${pt.northing.toFixed(3)}</b></div>
            <div class="insp-item"><span>Easting:</span><b>${pt.easting.toFixed(3)}</b></div>
            <div class="insp-item"><span>Elevation:</span><b>${pt.elevation.toFixed(3)}'</b></div>
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
      this.originE = 10250.0;
      this.scale = 1.0;
      return;
    }

    this.originN = (minN + maxN) / 2;
    this.originE = (minE + maxE) / 2;

    const pad = 1.35;
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
      el.innerHTML = `N: <b>${this.mouseWorldN.toFixed(2)}</b> E: <b>${this.mouseWorldE.toFixed(2)}</b> &nbsp; Drawing: <b class="text-accent">${this.features[this.currentFeature]?.name || 'Boundary'}</b>`;
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawGrid(ctx);
    this.drawLinework(ctx);
    this.drawActive(ctx);
    this.drawPoints(ctx);

    if (this.snappedPoint) {
      this.drawSnap(ctx, this.snappedPoint);
    }
  }

  drawGrid(ctx) {
    const gridSpacing = this.scale > 1.5 ? 25 : 50;
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
      ctx.strokeStyle = elem.color || "#ef4444";
      ctx.lineWidth = elem.lineWidth || 2.0;
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
        ctx.fillStyle = elem.color ? elem.color + "18" : "#ffffff18";
        ctx.fill();
      }

      ctx.stroke();

      // Show distance on segments if zoomed
      if (this.scale > 0.45 && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[1];
        const sp = this.worldToScreen((p1.n + p2.n) / 2, (p1.e + p2.e) / 2);
        const dist = Math.hypot(p2.n - p1.n, p2.e - p1.e);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px 'Roboto Mono', monospace";
        ctx.fillText(`${elem.name || 'LINE'} (${dist.toFixed(1)}')`, sp.x + 4, sp.y - 4);
      }

      ctx.restore();
    });
  }

  drawActive(ctx) {
    if (this.activeVertices.length === 0) return;

    ctx.save();
    const feat = this.features[this.currentFeature] || this.features.BOUNDARY;
    ctx.strokeStyle = feat.color;
    ctx.lineWidth = 2.0;
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

      if (pt.type === 'BNDY') {
        // Red circle with cross for boundary corners
        ctx.strokeStyle = "#ef4444";
        ctx.fillStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (pt.type === 'CTRL') {
        // Amber triangle for traverse control
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - 5);
        ctx.lineTo(sp.x + 4, sp.y + 4);
        ctx.lineTo(sp.x - 4, sp.y + 4);
        ctx.closePath();
        ctx.stroke();
      } else if (pt.type === 'BM') {
        // Green square for benchmark
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
      } else {
        // Standard survey cross
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sp.x - 3, sp.y - 3); ctx.lineTo(sp.x + 3, sp.y + 3);
        ctx.moveTo(sp.x - 3, sp.y + 3); ctx.lineTo(sp.x + 3, sp.y - 3);
        ctx.stroke();
      }

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
    ctx.fillRect(sp.x + 10, sp.y - 12, 110, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`PT #${pt.id} (${pt.code})`, sp.x + 14, sp.y + 4);
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAGNET Field Linework Code Auto-Builder
  // Parses standard MAGNET Field / Topcon / Sokkia field coding conventions
  // and converts them to Civil 3D-compatible linework layers automatically.
  //
  // MAGNET Field Feature Code Conventions (supported):
  //   EP1 B  or  EP1+   → Begin new string "EP1"
  //   EP1 E  or  EP1-   → End string "EP1"
  //   EP1    or  EP1 C  → Continue string "EP1"
  //   BC     → Begin Curve
  //   EC     → End Curve
  //   PCT    → Point on Curve (no special rendering needed here)
  //
  // Civil 3D Layer Mapping:
  //   EP, EOP, ETP, FL → V-ROAD-CURB   (Edge of Pavement / Curb)
  //   CL, TC, TS       → V-ROAD-CNTR   (Centerline)
  //   IP, BND, LOT, PROP, ROW → V-PROP-LINE (Boundary / Property Line)
  //   BLD, BLDG, FFE   → V-BLDG        (Building Footprint)
  //   WM, WV, GV, SS, MH → V-UTIL-WATR (Utilities)
  //   TBR, TREE, BUSH  → V-SURV-TOPO   (Topo / Vegetation)
  //   BM, TBM, CP      → V-NODE-PNT    (Control / Bench Marks)
  // ─────────────────────────────────────────────────────────────────────────────
  static magnetCodeToLayer(code) {
    if (!code) return 'BOUNDARY';
    // Strip begin/end suffix tokens, then isolate the base code word
    const c = code.trim().toUpperCase()
      .replace(/\s*[BE]\s*$/, '')  // strip trailing B / E command
      .replace(/[+\-]$/, '')       // strip trailing + / -
      .split(/\s+/)[0];            // first word only

    if (/^(EP|EOP|ETP|FL|CURB|GUTTR)/.test(c)) return 'EOP_CURB';
    if (/^(CL\d*|TC\d*|TS\d*|CNTR|CNTRL)/.test(c)) return 'CENTERLINE';
    if (/^(IP|BND|LOT|PROP|ROW|CORNER|FENCE|WALL)/.test(c)) return 'BOUNDARY';
    if (/^(BLD|BLDG|FFE|STRUC)/.test(c)) return 'BUILDING';
    if (/^(WM|WV|GV|SS|MH\d*|CO|CB|FH|WTR|GAS|SEWR|STRM|OH|UNK)/.test(c)) return 'UTILITIES';
    return 'BOUNDARY'; // default fallback for unknown codes
  }

  // Build linework automatically from an array of survey points with MAGNET Field codes
  // Points must have: { id, northing, easting, elevation, code }
  buildLineworkFromMagnetCodes(points) {
    // Collect active string groups: { stringName -> { vertices: [], layer, closed } }
    const strings = {};
    const addedCount = { lines: 0 };

    points.forEach(pt => {
      const rawCode = (pt.code || '').trim();

      // Parse: code may be "EP1 B", "EP1+", "EP1 E", "EP1-", "EP1", "BC", "EC"
      // Extract string name + action
      let stringName = rawCode.replace(/\s*(B|E|C)\s*$/i, '').replace(/[+\-]$/, '').trim().toUpperCase();
      const isBegin  = /\sB$/i.test(rawCode) || rawCode.endsWith('+');
      const isEnd    = /\sE$/i.test(rawCode) || rawCode.endsWith('-');
      // isContinue = neither begin nor end (or explicit 'C')

      if (!stringName) return; // skip empty codes

      // Skip pure geometry keywords without a name
      if (stringName === 'BC' || stringName === 'EC' || stringName === 'PCT') return;

      const layer = CadEngine.magnetCodeToLayer(stringName);
      const vertex = { id: pt.id, n: pt.northing, e: pt.easting, z: pt.elevation };

      if (isBegin || !strings[stringName]) {
        // Start or restart a new string
        strings[stringName] = { vertices: [vertex], layer };
      } else {
        strings[stringName].vertices.push(vertex);
      }

      if (isEnd && strings[stringName] && strings[stringName].vertices.length >= 2) {
        // Finish & commit the string as linework
        const s = strings[stringName];
        const feat = this.features[s.layer] || this.features.BOUNDARY;
        this.linework.push({
          id: `magnet-${stringName}-${Date.now()}-${addedCount.lines}`,
          layer: s.layer,
          name: `MAGNET ${stringName}`,
          color: feat.color,
          lineWidth: feat.lineWidth,
          dash: feat.dash || [],
          closed: false,
          points: [...s.vertices]
        });
        addedCount.lines++;
        delete strings[stringName];
      }
    });

    // Flush any still-open strings (no explicit end code)
    Object.keys(strings).forEach(sn => {
      const s = strings[sn];
      if (s.vertices.length >= 2) {
        const feat = this.features[s.layer] || this.features.BOUNDARY;
        this.linework.push({
          id: `magnet-${sn}-${Date.now()}`,
          layer: s.layer,
          name: `MAGNET ${sn}`,
          color: feat.color,
          lineWidth: feat.lineWidth,
          dash: feat.dash || [],
          closed: false,
          points: [...s.vertices]
        });
        addedCount.lines++;
      }
    });

    this.save();
    this.render();

    const msg = `🗺️ MAGNET Field auto-linework: ${addedCount.lines} strings built from ${points.length} coded points. Layers mapped to Civil 3D (EOP_CURB, CENTERLINE, BOUNDARY, BUILDING, UTILITIES).`;
    if (window.aimChat) window.aimChat.postSystemMessage(msg);
    return addedCount.lines;
  }

  // Build linework from currently loaded points using their field codes
  buildLineworkFromCurrentPoints() {
    if (!window.pointManager) return 0;
    const points = window.pointManager.getAll();
    return this.buildLineworkFromMagnetCodes(points);
  }
}

window.CadEngine = CadEngine;
