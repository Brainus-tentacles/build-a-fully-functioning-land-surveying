// Digital Field Book & SUE (Subsurface Utility Engineering) Field Notes Engine
// Replaces paper field books with SUE Test Hole logs, Level Loops, and Monument Notes
class FieldBook {
  constructor() {
    this.notes = null;
    this.sketchCanvas = null;
    this.sketchCtx = null;
    this.currentSubTab = 'sue'; // 'sue', 'level', 'monuments', 'media'
    this.testHoles = [];
    this.photos = [];
    this.voiceMemos = [];
  }

  init(initialNotes) {
    const saved = localStorage.getItem('survey_field_notes');
    if (saved) {
      try {
        this.notes = JSON.parse(saved);
      } catch (e) {
        this.notes = initialNotes ? { ...initialNotes } : {};
      }
    } else {
      this.notes = initialNotes ? { ...initialNotes } : {};
    }

    // Load SUE test holes
    const savedTH = localStorage.getItem('sue_test_holes');
    if (savedTH) {
      try { this.testHoles = JSON.parse(savedTH); } catch (e) {}
    } else if (window.SAMPLE_DATA && window.SAMPLE_DATA.testHoles) {
      this.testHoles = [...window.SAMPLE_DATA.testHoles];
    }

    this.renderFieldBook();
  }

  save() {
    localStorage.setItem('survey_field_notes', JSON.stringify(this.notes));
    localStorage.setItem('sue_test_holes', JSON.stringify(this.testHoles));
  }

  setSubTab(tab) {
    this.currentSubTab = tab;
    this.renderFieldBook();
  }

  renderFieldBook() {
    const container = document.getElementById('fieldbook-container');
    if (!container || !this.notes) return;

    const n = this.notes;

    container.innerHTML = `
      <div class="fieldbook-wrapper">
        <!-- Field Book Top Bar -->
        <div class="fieldbook-topbar">
          <div class="fb-title">
            <span class="fb-badge">FIELD BOOK #${n.bookNumber || 'FB-01'}</span>
            <span class="fb-page">PAGE ${n.pageNumber || 42}</span>
            <h3>${n.projectName || 'Project Survey Notes'}</h3>
          </div>

          <!-- Section Switcher Buttons -->
          <div class="fb-subnav-buttons">
            <button class="btn btn-xs ${this.currentSubTab === 'sue' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('sue')">
              🕳️ SUE Test Holes (${this.testHoles.length})
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'level' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('level')">
              📖 Level Loop & Math Check
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'monuments' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('monuments')">
              📍 Monument & Boundary Notes
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'media' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('media')">
              📷 Photos & Audio Notes
            </button>
          </div>

          <div class="fb-actions">
            <button class="btn btn-xs btn-outline-warning" onclick="window.print()">🖨️ Print Notes</button>
            <button class="btn btn-xs btn-success" onclick="window.fieldBook.saveNotesFromForm()">💾 Save</button>
          </div>
        </div>

        <!-- 1. SUE TEST HOLES LOG (Level A Vacuum Excavation) -->
        ${this.currentSubTab === 'sue' ? this.renderSueTestHoles() : ''}

        <!-- 2. DIFFERENTIAL LEVEL LOOP (Classic 2-Page Yellow Grid) -->
        ${this.currentSubTab === 'level' ? this.renderLevelLoopSpread() : ''}

        <!-- 3. MONUMENT & BOUNDARY NOTES -->
        ${this.currentSubTab === 'monuments' ? this.renderMonumentNotes() : ''}

        <!-- 4. PHOTOS & VOICE MEMOS -->
        ${this.currentSubTab === 'media' ? this.renderMediaNotes() : ''}
      </div>
    `;

    if (this.currentSubTab === 'level' || this.currentSubTab === 'monuments') {
      this.initSketchCanvas();
    }
  }

  // SUE Test Hole Cards & Table
  renderSueTestHoles() {
    return `
      <div class="sue-field-notes-container">
        <div class="sue-notes-header">
          <div>
            <h4 class="font-bold">SUE Quality Level A: Vacuum Excavation Test Hole Logs</h4>
            <p class="text-xs text-muted">Direct visual verification of underground utility depth, size, material and condition.</p>
          </div>
          <button class="btn btn-xs btn-primary" onclick="window.fieldBook.promptAddTestHole()">+ Log New Test Hole</button>
        </div>

        <div class="sue-cards-grid">
          ${this.testHoles.map(th => `
            <div class="sue-th-card">
              <div class="sue-th-header">
                <span class="badge badge-warning">${th.id}</span>
                <b class="sue-th-util">${th.utilityType}</b>
                <span class="badge badge-success">${th.status || 'Verified'}</span>
              </div>
              <div class="sue-th-depth-banner">
                <span>DEPTH TO TOP OF PIPE:</span>
                <b class="depth-val">${th.depthToTop.toFixed(2)} FT</b>
              </div>
              <div class="sue-th-grid">
                <div><span>Pipe OD / Size:</span><b>${th.diameter || '-'}</b></div>
                <div><span>Material:</span><b>${th.material || '-'}</b></div>
                <div><span>Ground Elev:</span><b>${th.groundElev ? th.groundElev.toFixed(2) : '-'} ft</b></div>
                <div><span>Utility Elev:</span><b>${th.utilityElev ? th.utilityElev.toFixed(2) : '-'} ft</b></div>
                <div><span>Soil Condition:</span><span>${th.soilType || '-'}</span></div>
                <div><span>Pavement Cut:</span><span>${th.pavementCut || 'None'}</span></div>
              </div>
              <div class="sue-th-notes">
                <i>"${th.notes || 'No remarks.'}"</i>
              </div>
              <div class="sue-th-footer">
                <button class="btn btn-xs btn-outline-primary" onclick="window.aimChat.sendMessage('📋 SUE TEST HOLE UPDATE: [${th.id}] ${th.utilityType} Depth=${th.depthToTop.toFixed(2)}ft, Size=${th.diameter}, Material=${th.material}'); window.app.switchTab('aim');">
                  💬 Send to CAD Office (AIM)
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  promptAddTestHole() {
    const id = prompt("Test Hole ID (e.g. TH-4):", `TH-${this.testHoles.length + 1}`);
    if (!id) return;
    const util = prompt("Utility Type (e.g. 4\" Gas, 8\" Water, Electric Duct Bank):", "4\" Plastic Gas Main");
    const depthStr = prompt("Depth to top of utility (ft):", "3.80");
    const depth = parseFloat(depthStr) || 3.8;
    const material = prompt("Pipe Material (e.g. Polyethylene, Steel, Ductile Iron):", "Polyethylene Yellow");
    const soil = prompt("Soil Conditions:", "Firm Clay Loam");
    const notes = prompt("Field Remarks:", "Tracer wire located on top of pipe");

    const curPt = window.pointManager ? window.pointManager.rtkStatus : { curN: 10250, curE: 10030, curZ: 687.0 };

    this.testHoles.push({
      id,
      utilityType: util,
      qualityLevel: "Level A (Vacuum Pothole)",
      depthToTop: depth,
      diameter: util,
      material,
      soilType: soil,
      groundElev: curPt.curZ,
      utilityElev: curPt.curZ - depth,
      northing: curPt.curN,
      easting: curPt.curE,
      status: "Verified Clear",
      notes
    });

    this.save();
    window.soundFX.playShotBeep();
    this.renderFieldBook();
  }

  // Differential Level Loop 2-Page Yellow Grid
  renderLevelLoopSpread() {
    const n = this.notes;
    return `
      <div class="fieldbook-spread">
        <!-- Left Page: Table & Page Check -->
        <div class="fieldbook-page left-page">
          <div class="page-header-row">
            <span class="page-date">DATE: <input type="date" id="fb-date" value="${n.date || '2026-11-23'}"></span>
            <span class="page-title-left">DIFFERENTIAL LEVEL RUN (BM-1 TO SITE)</span>
          </div>

          <div class="fb-table-container">
            <table class="fb-table">
              <thead>
                <tr>
                  <th>STATION / PT</th>
                  <th>BS (+)</th>
                  <th>H.I.</th>
                  <th>FS (-)</th>
                  <th>ELEV (FT)</th>
                  <th>REMARKS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${(n.levelLoop || []).map((row, idx) => `
                  <tr>
                    <td><input type="text" class="fb-cell" value="${row.station || ''}" onchange="window.fieldBook.updateRow(${idx}, 'station', this.value)"></td>
                    <td><input type="number" step="0.001" class="fb-cell text-right" value="${row.bs !== null ? row.bs : ''}" onchange="window.fieldBook.updateRow(${idx}, 'bs', this.value)"></td>
                    <td><span class="fb-cell-readonly">${row.hi ? row.hi.toFixed(3) : '-'}</span></td>
                    <td><input type="number" step="0.001" class="fb-cell text-right" value="${row.fs !== null ? row.fs : ''}" onchange="window.fieldBook.updateRow(${idx}, 'fs', this.value)"></td>
                    <td><span class="fb-cell-readonly font-bold">${row.elev ? row.elev.toFixed(3) : '-'}</span></td>
                    <td><input type="text" class="fb-cell" value="${row.remarks || ''}" onchange="window.fieldBook.updateRow(${idx}, 'remarks', this.value)"></td>
                    <td><button class="fb-del-btn" onclick="window.fieldBook.deleteRow(${idx})">×</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="fb-table-controls">
            <button class="btn btn-xs btn-outline-primary" onclick="window.fieldBook.addRow()">+ Add Station</button>
            <button class="btn btn-xs btn-outline-success" onclick="window.fieldBook.calculateLevelLoop()">⚡ Compute Page Check</button>
          </div>

          <div class="level-closure-box">
            ${this.getLevelLoopSummaryHTML()}
          </div>
        </div>

        <!-- Right Page: Crew, Weather, Instrument -->
        <div class="fieldbook-page right-page">
          <div class="page-header-row">
            <span class="page-title-right">CREW & WEATHER NOTES</span>
            <span class="notes-by">NOTES BY: <input type="text" id="fb-notes-by" value="${n.crew?.notesBy || 'M.K.'}"></span>
          </div>

          <div class="fb-meta-grid">
            <div class="fb-meta-group"><label>Party Chief:</label><input type="text" id="fb-party-chief" value="${n.crew?.partyChief || ''}"></div>
            <div class="fb-meta-group"><label>Instrument Operator:</label><input type="text" id="fb-instrument-op" value="${n.crew?.instrument || ''}"></div>
            <div class="fb-meta-group"><label>SUE Locator / Rod:</label><input type="text" id="fb-rodperson" value="${n.crew?.rodperson || ''}"></div>
            <div class="fb-meta-group"><label>Weather:</label><input type="text" id="fb-weather" value="${n.weather?.temp || '72°F'}, ${n.weather?.conditions || 'Clear'}"></div>
          </div>

          <div class="fb-sketch-wrapper">
            <div class="fb-sketch-header">
              <span>FIELD SKETCH & UTILITY ALIGNMENT (Grid = 10 FT)</span>
              <button class="btn btn-xs btn-outline-danger" onclick="window.fieldBook.clearSketch()">Clear</button>
            </div>
            <canvas id="fb-sketch-canvas" width="460" height="190"></canvas>
          </div>

          <div class="fb-remarks-group">
            <label>Field Remarks:</label>
            <textarea id="fb-remarks-text" rows="3">${n.remarks || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  renderMonumentNotes() {
    const n = this.notes;
    return `
      <div class="monument-notes-container">
        <div class="table-card">
          <table class="survey-table">
            <thead>
              <tr>
                <th>CORNER / POINT</th>
                <th>MONUMENT FOUND</th>
                <th>NORTHING</th>
                <th>EASTING</th>
                <th>ELEVATION</th>
                <th>RECORD VS MEASURED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Lot 14 NW Corner</b></td>
                <td>Found 5/8" Iron Rod flush with grade</td>
                <td class="font-mono">10450.00</td>
                <td class="font-mono">10050.00</td>
                <td class="font-mono">690.80'</td>
                <td>Matches 1984 plat (±0.03')</td>
                <td><span class="badge badge-success">Recovered</span></td>
              </tr>
              <tr>
                <td><b>Lot 14 NE Corner</b></td>
                <td>Found 5/8" Iron Rod w/ yellow cap</td>
                <td class="font-mono">10450.00</td>
                <td class="font-mono">10550.00</td>
                <td class="font-mono">692.10'</td>
                <td>Matches 1984 plat (±0.02')</td>
                <td><span class="badge badge-success">Recovered</span></td>
              </tr>
              <tr>
                <td><b>Lot 14 SE Corner</b></td>
                <td>Found 1/2" Iron Rod in tree root</td>
                <td class="font-mono">10050.00</td>
                <td class="font-mono">10550.00</td>
                <td class="font-mono">686.40'</td>
                <td>Matches 1984 plat (±0.04')</td>
                <td><span class="badge badge-success">Recovered</span></td>
              </tr>
              <tr>
                <td><b>Lot 14 SW Corner</b></td>
                <td>Found 1/2" Iron Rod (Water meter 2.1' W)</td>
                <td class="font-mono">10050.00</td>
                <td class="font-mono">10050.00</td>
                <td class="font-mono">685.20'</td>
                <td>Conflict verified clear</td>
                <td><span class="badge badge-success">Recovered</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderMediaNotes() {
    return `
      <div class="media-container">
        <div class="media-header-row">
          <h4>Field Photos & Voice Memos</h4>
          <button class="btn btn-xs btn-primary" onclick="alert('Photo added!')">+ Add Photo</button>
        </div>
        <p class="text-xs text-muted">Field photos and recorded audio memos linked to survey points and SUE test holes.</p>
      </div>
    `;
  }

  initSketchCanvas() {
    this.sketchCanvas = document.getElementById('fb-sketch-canvas');
    if (!this.sketchCanvas) return;
    this.sketchCtx = this.sketchCanvas.getContext('2d');
    this.drawSketchGrid();

    let isDrawing = false, lastX = 0, lastY = 0;
    const start = (x, y) => { isDrawing = true; lastX = x; lastY = y; };
    const draw = (x, y) => {
      if (!isDrawing) return;
      this.sketchCtx.strokeStyle = "#1e293b";
      this.sketchCtx.lineWidth = 1.8;
      this.sketchCtx.beginPath();
      this.sketchCtx.moveTo(lastX, lastY);
      this.sketchCtx.lineTo(x, y);
      this.sketchCtx.stroke();
      lastX = x; lastY = y;
    };
    const stop = () => { isDrawing = false; };

    this.sketchCanvas.addEventListener('mousedown', e => {
      const r = this.sketchCanvas.getBoundingClientRect();
      start(e.clientX - r.left, e.clientY - r.top);
    });
    this.sketchCanvas.addEventListener('mousemove', e => {
      const r = this.sketchCanvas.getBoundingClientRect();
      draw(e.clientX - r.left, e.clientY - r.top);
    });
    window.addEventListener('mouseup', stop);

    this.sketchCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const r = this.sketchCanvas.getBoundingClientRect();
      start(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    }, { passive: false });
    this.sketchCanvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = this.sketchCanvas.getBoundingClientRect();
      draw(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    }, { passive: false });
    this.sketchCanvas.addEventListener('touchend', stop);
  }

  drawSketchGrid() {
    if (!this.sketchCtx) return;
    const ctx = this.sketchCtx;
    ctx.fillStyle = "#fffef0";
    ctx.fillRect(0, 0, this.sketchCanvas.width, this.sketchCanvas.height);
    ctx.strokeStyle = "rgba(79, 140, 201, 0.25)";
    ctx.lineWidth = 0.8;
    for (let x = 0; x < this.sketchCanvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.sketchCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < this.sketchCanvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.sketchCanvas.width, y); ctx.stroke();
    }
  }

  clearSketch() {
    this.drawSketchGrid();
  }

  updateRow(index, field, val) {
    if (!this.notes.levelLoop[index]) return;
    if (field === 'bs' || field === 'fs') {
      this.notes.levelLoop[index][field] = val === '' ? null : parseFloat(val);
    } else {
      this.notes.levelLoop[index][field] = val;
    }
  }

  addRow() {
    if (!this.notes.levelLoop) this.notes.levelLoop = [];
    this.notes.levelLoop.push({
      station: `TP-${this.notes.levelLoop.length}`,
      bs: null,
      hi: null,
      fs: null,
      elev: null,
      remarks: "Turning Point"
    });
    this.renderFieldBook();
  }

  deleteRow(index) {
    if (!this.notes.levelLoop) return;
    this.notes.levelLoop.splice(index, 1);
    this.renderFieldBook();
  }

  calculateLevelLoop() {
    if (!this.notes.levelLoop || this.notes.levelLoop.length === 0) return;

    let currentElev = 685.500;
    let currentHI = null;
    let sumBS = 0, sumFS = 0;

    for (let i = 0; i < this.notes.levelLoop.length; i++) {
      const row = this.notes.levelLoop[i];
      if (i === 0 && row.elev) currentElev = row.elev;

      if (row.fs !== null && currentHI !== null) {
        currentElev = currentHI - row.fs;
        row.elev = currentElev;
        sumFS += row.fs;
      }
      if (row.bs !== null) {
        currentHI = currentElev + row.bs;
        row.hi = currentHI;
        sumBS += row.bs;
      } else {
        row.hi = null;
      }
    }

    const startElev = this.notes.levelLoop[0].elev || 685.500;
    const endElev = this.notes.levelLoop[this.notes.levelLoop.length - 1].elev || currentElev;
    const elevDiff = endElev - startElev;
    const bsFsDiff = sumBS - sumFS;

    this.lastLoopStats = {
      sumBS, sumFS, startElev, endElev, bsFsDiff, elevDiff,
      pageCheckPassed: Math.abs(bsFsDiff - elevDiff) < 0.001,
      misclosure: endElev - startElev
    };

    this.save();
    this.renderFieldBook();
    window.soundFX.playShotBeep();
  }

  getLevelLoopSummaryHTML() {
    if (!this.lastLoopStats) {
      return `<div class="closure-summary"><span>Page Check: <b>Pending calculation</b></span></div>`;
    }
    const s = this.lastLoopStats;
    return `
      <div class="closure-summary">
        <div>Σ BS: <b>+${s.sumBS.toFixed(3)}</b> | Σ FS: <b>-${s.sumFS.toFixed(3)}</b></div>
        <div>Page Check: ${s.pageCheckPassed ? '✅ <span class="text-success font-bold">PASSED</span>' : '❌ <span class="text-danger">MATH ERROR</span>'} (Misclosure: ${s.misclosure.toFixed(3)} ft)</div>
      </div>
    `;
  }

  saveNotesFromForm() {
    if (!this.notes) return;
    this.notes.date = document.getElementById('fb-date')?.value || this.notes.date;
    this.notes.remarks = document.getElementById('fb-remarks-text')?.value || this.notes.remarks;
    if (!this.notes.crew) this.notes.crew = {};
    this.notes.crew.partyChief = document.getElementById('fb-party-chief')?.value || this.notes.crew.partyChief;
    this.notes.crew.instrument = document.getElementById('fb-instrument-op')?.value || this.notes.crew.instrument;
    this.notes.crew.rodperson = document.getElementById('fb-rodperson')?.value || this.notes.crew.rodperson;
    this.notes.crew.notesBy = document.getElementById('fb-notes-by')?.value || this.notes.crew.notesBy;

    this.save();
    window.soundFX.playShotBeep();
    alert("Field Notes Saved Successfully!");
  }
}

window.FieldBook = FieldBook;
window.fieldBook = new FieldBook();
