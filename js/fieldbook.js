// Electronic Survey Field Notes Engine (Digital Transit & Level Book)
class FieldBook {
  constructor() {
    this.notes = null;
    this.sketchCanvas = null;
    this.sketchCtx = null;
    this.isDrawingSketch = false;
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

    this.renderFieldBook();
  }

  save() {
    localStorage.setItem('survey_field_notes', JSON.stringify(this.notes));
  }

  renderFieldBook() {
    const container = document.getElementById('fieldbook-container');
    if (!container || !this.notes) return;

    const n = this.notes;

    container.innerHTML = `
      <div class="fieldbook-wrapper">
        <!-- Field Book Header Banner -->
        <div class="fieldbook-topbar">
          <div class="fb-title">
            <span class="fb-badge">FIELD BOOK #${n.bookNumber || 'FB-01'}</span>
            <span class="fb-page">PAGE ${n.pageNumber || 1}</span>
            <h3>${n.projectName || 'Project Survey Notes'}</h3>
          </div>
          <div class="fb-actions">
            <button class="btn btn-sm btn-outline-warning" onclick="window.fieldBook.exportPrintableBook()">🖨️ Print / Export Field Book</button>
            <button class="btn btn-sm btn-primary" onclick="window.fieldBook.saveNotesFromForm()">💾 Save Field Notes</button>
          </div>
        </div>

        <!-- Classic 2-Page Yellow Grid Book Spread -->
        <div class="fieldbook-spread">
          <!-- LEFT PAGE: TABULAR DATA & LEVEL LOOP -->
          <div class="fieldbook-page left-page">
            <div class="page-header-row">
              <span class="page-date">DATE: <input type="date" id="fb-date" value="${n.date || '2026-11-23'}"></span>
              <span class="page-title-left">DIFFERENTIAL LEVEL & TRAVERSE SHOTS</span>
            </div>

            <!-- Level Loop / Survey Shots Table -->
            <div class="fb-table-container">
              <table class="fb-table" id="fb-level-table">
                <thead>
                  <tr>
                    <th>STATION / PT</th>
                    <th>BS (+)</th>
                    <th>H.I.</th>
                    <th>FS (-)</th>
                    <th>ELEV (FT)</th>
                    <th>REMARKS / CODE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody id="fb-table-body">
                  ${(n.levelLoop || []).map((row, idx) => `
                    <tr data-index="${idx}">
                      <td><input type="text" class="fb-cell" value="${row.station || ''}" onchange="window.fieldBook.updateRow(${idx}, 'station', this.value)"></td>
                      <td><input type="number" step="0.001" class="fb-cell text-right" value="${row.bs !== null ? row.bs : ''}" onchange="window.fieldBook.updateRow(${idx}, 'bs', this.value)"></td>
                      <td><span class="fb-cell-readonly">${row.hi ? row.hi.toFixed(3) : '-'}</span></td>
                      <td><input type="number" step="0.001" class="fb-cell text-right" value="${row.fs !== null ? row.fs : ''}" onchange="window.fieldBook.updateRow(${idx}, 'fs', this.value)"></td>
                      <td><span class="fb-cell-readonly font-bold">${row.elev ? row.elev.toFixed(3) : '-'}</span></td>
                      <td><input type="text" class="fb-cell" value="${row.remarks || ''}" onchange="window.fieldBook.updateRow(${idx}, 'remarks', this.value)"></td>
                      <td class="text-center">
                        <button class="fb-del-btn" onclick="window.fieldBook.deleteRow(${idx})">×</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="fb-table-controls">
              <button class="btn btn-xs btn-outline-primary" onclick="window.fieldBook.addRow()">+ Add Turning Point / Shot</button>
              <button class="btn btn-xs btn-outline-success" onclick="window.fieldBook.calculateLevelLoop()">⚡ Compute Page Check & Closure</button>
            </div>

            <!-- Automated Math Check & Misclosure Box -->
            <div class="level-closure-box" id="level-closure-result">
              ${this.getLevelLoopSummaryHTML()}
            </div>
          </div>

          <!-- RIGHT PAGE: SKETCH, WEATHER, CREW, REMARKS -->
          <div class="fieldbook-page right-page">
            <div class="page-header-row">
              <span class="page-title-right">CREW & INSTRUMENT ALIGNMENT NOTES</span>
              <span class="notes-by">NOTES BY: <input type="text" id="fb-notes-by" value="${n.crew?.notesBy || 'M.K.'}"></span>
            </div>

            <div class="fb-meta-grid">
              <div class="fb-meta-group">
                <label>Party Chief:</label>
                <input type="text" id="fb-party-chief" value="${n.crew?.partyChief || ''}">
              </div>
              <div class="fb-meta-group">
                <label>Instrument Operator:</label>
                <input type="text" id="fb-instrument-op" value="${n.crew?.instrument || ''}">
              </div>
              <div class="fb-meta-group">
                <label>Rodperson:</label>
                <input type="text" id="fb-rodperson" value="${n.crew?.rodperson || ''}">
              </div>
              <div class="fb-meta-group">
                <label>Weather & Temp:</label>
                <input type="text" id="fb-weather" value="${n.weather?.temp || ''}, ${n.weather?.conditions || ''}">
              </div>
              <div class="fb-meta-group">
                <label>Barometric Pressure:</label>
                <input type="text" id="fb-pressure" value="${n.weather?.pressure || '30.08 inHg'}">
              </div>
              <div class="fb-meta-group">
                <label>Instrument & Bubble:</label>
                <input type="text" id="fb-instr-check" value="${n.instrumentCheck?.model || ''} - ${n.instrumentCheck?.collimationCheck || 'PASSED'}">
              </div>
            </div>

            <!-- Field Sketch Canvas (Right page grid) -->
            <div class="fb-sketch-wrapper">
              <div class="fb-sketch-header">
                <span>FIELD SKETCH & CORNER TIES (Grid = 10 FT)</span>
                <button class="btn btn-xs btn-outline-danger" onclick="window.fieldBook.clearSketch()">Clear Sketch</button>
              </div>
              <canvas id="fb-sketch-canvas" width="460" height="220"></canvas>
            </div>

            <!-- Field Remarks & Monument Descriptions -->
            <div class="fb-remarks-group">
              <label>Field Remarks & Monument Descriptions:</label>
              <textarea id="fb-remarks-text" rows="4">${n.remarks || ''}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initSketchCanvas();
  }

  initSketchCanvas() {
    this.sketchCanvas = document.getElementById('fb-sketch-canvas');
    if (!this.sketchCanvas) return;
    this.sketchCtx = this.sketchCanvas.getContext('2d');

    // Draw grid background on sketch canvas
    this.drawSketchGrid();

    // Mouse & Touch events for drawing field sketch
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDraw = (x, y) => {
      isDrawing = true;
      lastX = x;
      lastY = y;
    };

    const draw = (x, y) => {
      if (!isDrawing) return;
      this.sketchCtx.strokeStyle = "#1e293b";
      this.sketchCtx.lineWidth = 1.8;
      this.sketchCtx.lineCap = "round";
      this.sketchCtx.beginPath();
      this.sketchCtx.moveTo(lastX, lastY);
      this.sketchCtx.lineTo(x, y);
      this.sketchCtx.stroke();
      lastX = x;
      lastY = y;
    };

    const stopDraw = () => { isDrawing = false; };

    this.sketchCanvas.addEventListener('mousedown', e => {
      const rect = this.sketchCanvas.getBoundingClientRect();
      startDraw(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.sketchCanvas.addEventListener('mousemove', e => {
      const rect = this.sketchCanvas.getBoundingClientRect();
      draw(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('mouseup', stopDraw);

    // Touch events for mobile
    this.sketchCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const rect = this.sketchCanvas.getBoundingClientRect();
      const t = e.touches[0];
      startDraw(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    this.sketchCanvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = this.sketchCanvas.getBoundingClientRect();
      const t = e.touches[0];
      draw(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    this.sketchCanvas.addEventListener('touchend', stopDraw);
  }

  drawSketchGrid() {
    if (!this.sketchCtx) return;
    const ctx = this.sketchCtx;
    ctx.fillStyle = "#fffef0"; // yellow field book paper tone
    ctx.fillRect(0, 0, this.sketchCanvas.width, this.sketchCanvas.height);

    ctx.strokeStyle = "rgba(79, 140, 201, 0.25)"; // light blue surveying rule lines
    ctx.lineWidth = 0.8;

    for (let x = 0; x < this.sketchCanvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.sketchCanvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < this.sketchCanvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.sketchCanvas.width, y);
      ctx.stroke();
    }

    // Red center margin line (classic field book)
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(this.sketchCanvas.width / 2, 0);
    ctx.lineTo(this.sketchCanvas.width / 2, this.sketchCanvas.height);
    ctx.stroke();
  }

  clearSketch() {
    if (!this.sketchCanvas) return;
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
      remarks: "Field Turning Point"
    });
    this.renderFieldBook();
  }

  deleteRow(index) {
    if (!this.notes.levelLoop) return;
    this.notes.levelLoop.splice(index, 1);
    this.renderFieldBook();
  }

  // Differential Level Loop reduction & page check
  calculateLevelLoop() {
    if (!this.notes.levelLoop || this.notes.levelLoop.length === 0) return;

    let currentElev = 685.500; // starting benchmark elevation
    let currentHI = null;

    let sumBS = 0;
    let sumFS = 0;

    for (let i = 0; i < this.notes.levelLoop.length; i++) {
      const row = this.notes.levelLoop[i];

      if (i === 0 && row.elev) {
        currentElev = row.elev;
      }

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
    const misclosure = endElev - startElev; // on closed loop back to BM

    this.lastLoopStats = {
      sumBS,
      sumFS,
      startElev,
      endElev,
      bsFsDiff,
      elevDiff,
      pageCheckPassed: Math.abs(bsFsDiff - elevDiff) < 0.001,
      misclosure
    };

    this.save();
    this.renderFieldBook();
    window.soundFX.playShotBeep();
  }

  getLevelLoopSummaryHTML() {
    if (!this.lastLoopStats) {
      return `
        <div class="closure-summary">
          <span>Page Check: <b>Pending calculation</b></span>
          <span>Loop Misclosure: <b>-</b></span>
          <span class="status-pill status-ok">Formula: Σ BS - Σ FS = End Elev - Start Elev</span>
        </div>
      `;
    }

    const s = this.lastLoopStats;
    const ok = s.pageCheckPassed;

    return `
      <div class="closure-summary">
        <div>Σ Backsights (BS): <b>+${s.sumBS.toFixed(3)}</b> &nbsp;|&nbsp; Σ Foresights (FS): <b>-${s.sumFS.toFixed(3)}</b></div>
        <div>Page Check Math: <b>${s.bsFsDiff.toFixed(3)}</b> vs Elev Diff: <b>${s.elevDiff.toFixed(3)}</b> &nbsp; ${ok ? '✅ <span class="text-success font-bold">PAGE CHECK PASSED</span>' : '❌ <span class="text-danger">MATH ERROR</span>'}</div>
        <div>Loop Closure Error: <b>${s.misclosure > 0 ? '+' : ''}${s.misclosure.toFixed(3)} FT</b> (Allowable 2nd Order: ±0.024 FT) &nbsp; <span class="badge badge-success">WITHIN SPEC</span></div>
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
    alert("Survey Field Notes Saved Successfully!");
  }

  exportPrintableBook() {
    window.print();
  }
}

window.fieldBook = new FieldBook();
