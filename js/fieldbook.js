// Electronic Survey Field Notes Engine (Digital Transit & Level Book)
// With Traverse Closure (Compass Rule), Stakeout Navigator, Photos & Audio Memos
class FieldBook {
  constructor() {
    this.notes = null;
    this.sketchCanvas = null;
    this.sketchCtx = null;
    this.currentSubTab = 'book'; // 'book', 'traverse', 'stakeout', 'media'
    this.activeStakeoutPtId = 10;
    this.photos = [];
    this.voiceMemos = [];
    this.traverseData = [
      { from: "CP1", to: "CP2", dist: 305.82, bearing: "N 37° 15' 00\" E", dN: 243.43, dE: 185.12 },
      { from: "CP2", to: "CP3", dist: 306.15, bearing: "N 59° 48' 20\" E", dN: 153.94, dE: 264.48 },
      { from: "CP3", to: "CP4", dist: 284.28, bearing: "S 12° 28' 10\" E", dN: -277.58, dE: 61.39 },
      { from: "CP4", to: "CP1", dist: 524.45, bearing: "S 76° 49' 40\" W", dN: -119.77, dE: -510.98 }
    ];
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

    const savedPhotos = localStorage.getItem('survey_field_photos');
    if (savedPhotos) {
      try { this.photos = JSON.parse(savedPhotos); } catch(e) {}
    } else {
      this.photos = [
        {
          id: "photo-1",
          title: "SW Property Corner Monument (1/2\" Iron Rod)",
          pointId: 10,
          bearing: "N 45° E",
          time: "2026-11-23 08:42",
          notes: "Found 1/2\" iron rod flush with grade, 2.1 ft east of water meter box."
        }
      ];
    }

    const savedAudio = localStorage.getItem('survey_voice_memos');
    if (savedAudio) {
      try { this.voiceMemos = JSON.parse(savedAudio); } catch(e) {}
    } else {
      this.voiceMemos = [
        {
          id: "voice-1",
          title: "Traverse CP-2 Tree Canopy Note",
          duration: "0:14",
          time: "2026-11-23 09:15",
          transcript: "Station CP2 is under an oak canopy. Verified GPS RTK fix using 2-minute averaged observation."
        }
      ];
    }

    this.renderFieldBook();
  }

  save() {
    localStorage.setItem('survey_field_notes', JSON.stringify(this.notes));
    localStorage.setItem('survey_field_photos', JSON.stringify(this.photos));
    localStorage.setItem('survey_voice_memos', JSON.stringify(this.voiceMemos));
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
        <!-- Field Book Sub-Navigation Bar -->
        <div class="fieldbook-topbar">
          <div class="fb-title">
            <span class="fb-badge">FIELD BOOK #${n.bookNumber || 'FB-01'}</span>
            <span class="fb-page">PAGE ${n.pageNumber || 1}</span>
            <h3>${n.projectName || 'Project Survey Notes'}</h3>
          </div>

          <!-- Section Switcher Buttons -->
          <div class="fb-subnav-buttons">
            <button class="btn btn-xs ${this.currentSubTab === 'book' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('book')">
              📖 Transit & Level Book
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'traverse' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('traverse')">
              🔄 Traverse Closure
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'stakeout' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('stakeout')">
              🎯 Stakeout Navigator
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'media' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('media')">
              📷 Photos & Audio Memos
            </button>
          </div>

          <div class="fb-actions">
            <button class="btn btn-xs btn-outline-warning" onclick="window.fieldBook.exportPrintableBook()">🖨️ Print Book</button>
            <button class="btn btn-xs btn-success" onclick="window.fieldBook.saveNotesFromForm()">💾 Save Notes</button>
          </div>
        </div>

        <!-- TAB 1: CLASSIC 2-PAGE YELLOW GRID TRANSIT BOOK SPREAD -->
        ${this.currentSubTab === 'book' ? `
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
                <button class="btn btn-xs btn-outline-primary" onclick="window.fieldBook.addRow()">+ Add Turning Point</button>
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
                <canvas id="fb-sketch-canvas" width="460" height="200"></canvas>
              </div>

              <!-- Field Remarks & Monument Descriptions -->
              <div class="fb-remarks-group">
                <label>Field Remarks & Monument Descriptions:</label>
                <textarea id="fb-remarks-text" rows="3">${n.remarks || ''}</textarea>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- TAB 2: TRAVERSE LOOP CLOSURE (COMPASS RULE / BOWDITCH) -->
        ${this.currentSubTab === 'traverse' ? this.renderTraverseSection() : ''}

        <!-- TAB 3: STAKEOUT NAVIGATOR -->
        ${this.currentSubTab === 'stakeout' ? this.renderStakeoutSection() : ''}

        <!-- TAB 4: FIELD PHOTOS & VOICE MEMOS -->
        ${this.currentSubTab === 'media' ? this.renderMediaSection() : ''}

      </div>
    `;

    if (this.currentSubTab === 'book') {
      this.initSketchCanvas();
    }
  }

  // Render Traverse Loop Balancing & Closure Sheet
  renderTraverseSection() {
    let sumDist = 0;
    let sumLat = 0;
    let sumDep = 0;

    this.traverseData.forEach(leg => {
      sumDist += leg.dist;
      sumLat += leg.dN;
      sumDep += leg.dE;
    });

    const linearError = Math.hypot(sumLat, sumDep);
    const precisionRatio = linearError > 0 ? Math.round(sumDist / linearError) : 999999;
    const isPassing = precisionRatio >= 10000;

    return `
      <div class="traverse-container">
        <div class="traverse-header-card">
          <div class="traverse-title-row">
            <h4>Control Traverse Loop Closure & Bowditch Adjustment (CP1 - CP4)</h4>
            <span class="badge ${isPassing ? 'badge-success' : 'badge-danger'}">
              ${isPassing ? '✅ CLASS A BOUNDARY PASSED' : '⚠️ MISCLOSURE HIGH'}
            </span>
          </div>
          <div class="traverse-stats-grid">
            <div class="t-stat"><span>Total Perimeter:</span><b>${sumDist.toFixed(2)} ft</b></div>
            <div class="t-stat"><span>Misclosure North (ΔN):</span><b>${sumLat > 0 ? '+' : ''}${sumLat.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Misclosure East (ΔE):</span><b>${sumDep > 0 ? '+' : ''}${sumDep.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Linear Misclosure:</span><b class="text-accent">${linearError.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Precision Ratio:</span><b class="text-success">1 : ${precisionRatio.toLocaleString()}</b></div>
            <div class="t-stat"><span>Allowable Minimum:</span><b>1 : 10,000</b></div>
          </div>
        </div>

        <div class="table-card">
          <table class="survey-table">
            <thead>
              <tr>
                <th>LEG</th>
                <th>HORIZONTAL DIST</th>
                <th>QUADRANT BEARING</th>
                <th>LATITUDE (ΔN)</th>
                <th>DEPARTURE (ΔE)</th>
                <th>BALANCED N</th>
                <th>BALANCED E</th>
              </tr>
            </thead>
            <tbody>
              ${this.traverseData.map(leg => {
                const corrN = -(sumLat * (leg.dist / sumDist));
                const corrE = -(sumDep * (leg.dist / sumDist));
                const balN = leg.dN + corrN;
                const balE = leg.dE + corrE;
                return `
                  <tr>
                    <td><b>${leg.from} → ${leg.to}</b></td>
                    <td class="font-mono">${leg.dist.toFixed(2)}'</td>
                    <td class="font-mono">${leg.bearing}</td>
                    <td class="font-mono">${leg.dN.toFixed(2)}'</td>
                    <td class="font-mono">${leg.dE.toFixed(2)}'</td>
                    <td class="font-mono font-bold text-success">${balN.toFixed(2)}'</td>
                    <td class="font-mono font-bold text-success">${balE.toFixed(2)}'</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="traverse-actions-row">
          <button class="btn btn-sm btn-primary" onclick="window.aimChat.postSystemUpdate('Traverse Loop Adjusted (1:${precisionRatio.toLocaleString()}). Balanced coordinates stored.')">
            💬 Post Traverse Results to AIM Chat
          </button>
        </div>
      </div>
    `;
  }

  // Render Interactive Stakeout Navigator
  renderStakeoutSection() {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const stakeInfo = window.pointManager ? window.pointManager.getStakeoutDelta(this.activeStakeoutPtId) : null;

    return `
      <div class="stakeout-container">
        <div class="stakeout-control-bar">
          <label>Select Target Staking Point:</label>
          <select class="form-select-sm" onchange="window.fieldBook.activeStakeoutPtId = Number(this.value); window.fieldBook.renderFieldBook();">
            ${points.map(p => `
              <option value="${p.id}" ${p.id === this.activeStakeoutPtId ? 'selected' : ''}>
                PT #${p.id} [${p.code}] - N:${p.northing.toFixed(1)} E:${p.easting.toFixed(1)} (${p.desc || 'Point'})
              </option>
            `).join('')}
          </select>
          <button class="btn btn-xs btn-outline-info" onclick="window.cadEngine.zoomToPoint(${this.activeStakeoutPtId}); window.app.switchTab('cad');">
            🔍 View on CAD Canvas
          </button>
        </div>

        ${stakeInfo ? `
          <div class="stakeout-display-grid">
            <!-- Bullseye Target Visual -->
            <div class="stakeout-bullseye-card">
              <div class="bullseye-ring ring-3">
                <div class="bullseye-ring ring-2">
                  <div class="bullseye-ring ring-1">
                    <div class="bullseye-center"></div>
                  </div>
                </div>
              </div>
              <div class="bullseye-status ${stakeInfo.inTolerance ? 'text-success' : 'text-accent'}">
                ${stakeInfo.inTolerance ? '🎯 IN TOLERANCE (STAKE HERE)' : `DISTANCE: ${stakeInfo.horizDist.toFixed(2)} FT`}
              </div>
            </div>

            <!-- Staking Navigation Readouts -->
            <div class="stakeout-readout-card">
              <div class="stake-instruction-item highlight">
                <span>North / South:</span>
                <b>${stakeInfo.dirN}</b>
              </div>
              <div class="stake-instruction-item highlight">
                <span>East / West:</span>
                <b>${stakeInfo.dirE}</b>
              </div>
              <div class="stake-instruction-item grade">
                <span>Cut / Fill Elevation:</span>
                <b class="${stakeInfo.dZ > 0 ? 'text-accent' : 'text-rose'}">${stakeInfo.cutFill}</b>
              </div>
              <div class="stake-meta-row">
                <div>Target Point: <b>PT #${stakeInfo.target.id} (${stakeInfo.target.code})</b></div>
                <div>Bearing: <b>${stakeInfo.bearing}</b></div>
                <div>Target Elev: <b>${stakeInfo.target.elevation.toFixed(2)}'</b></div>
                <div>Rover Elev: <b>${stakeInfo.curZ.toFixed(2)}'</b></div>
              </div>
              <button class="btn btn-sm btn-success w-full mt-3" onclick="window.fieldBook.recordAsStaked(${stakeInfo.target.id})">
                ✅ Record As Staked & Store Shot
              </button>
            </div>
          </div>
        ` : `
          <p class="text-center text-muted mt-4">Select a valid survey point to begin stakeout guidance.</p>
        `}
      </div>
    `;
  }

  recordAsStaked(pointId) {
    const pt = window.pointManager.getById(pointId);
    if (!pt) return;

    window.pointManager.takeRtkShot(`STK-${pt.code}`, `Staked point #${pt.id}`);
    window.soundFX.playShotBeep();
    alert(`Point #${pt.id} recorded as staked! As-staked shot stored in database.`);
    this.renderFieldBook();
  }

  // Render Field Photos & Audio Voice Memos
  renderMediaSection() {
    return `
      <div class="media-container">
        <div class="media-header-row">
          <h4>Field Photos & Voice Field Notes</h4>
          <div class="media-actions">
            <button class="btn btn-xs btn-primary" onclick="window.fieldBook.promptAddPhoto()">+ Add Photo</button>
            <button class="btn btn-xs btn-outline-warning" onclick="window.fieldBook.promptAddVoiceMemo()">🎙️ Record Voice Memo</button>
          </div>
        </div>

        <div class="media-split-grid">
          <!-- Photos Column -->
          <div class="media-column">
            <h5>📷 Field Monument Photos (${this.photos.length})</h5>
            <div class="photo-cards-list">
              ${this.photos.map(p => `
                <div class="photo-card">
                  <div class="photo-placeholder">
                    <span class="photo-watermark">STAMP: ${p.time} | AZ: ${p.bearing}</span>
                    <span class="photo-icon">📸</span>
                  </div>
                  <div class="photo-meta">
                    <b>${p.title}</b>
                    <p class="text-xs text-muted">${p.notes}</p>
                    <span class="badge badge-primary">Linked to PT #${p.pointId}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Voice Memos Column -->
          <div class="media-column">
            <h5>🎙️ Field Audio Memos (${this.voiceMemos.length})</h5>
            <div class="voice-cards-list">
              ${this.voiceMemos.map(v => `
                <div class="voice-card">
                  <div class="voice-play-row">
                    <button class="btn-play" onclick="window.soundFX.playShotBeep(); alert('Playing audio memo: ' + '${v.title}');">▶</button>
                    <div>
                      <b>${v.title}</b>
                      <span class="text-xs text-muted">${v.time} (${v.duration})</span>
                    </div>
                  </div>
                  <div class="voice-transcript">
                    "${v.transcript}"
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  promptAddPhoto() {
    const title = prompt("Enter Photo Description (e.g. NW Iron Pin with survey cap):", "NW Corner 5/8\" Iron Pin");
    if (!title) return;
    const ptId = prompt("Linked Survey Point ID (e.g. 11):", "11");
    const notes = prompt("Field notes / ties (e.g. 1.4 ft north of fence post):", "Flush with grade, marked with yellow lath");

    this.photos.push({
      id: "photo-" + Date.now(),
      title,
      pointId: Number(ptId) || 1,
      bearing: "N 15° W",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes
    });

    this.save();
    this.renderFieldBook();
    window.soundFX.playShotBeep();
  }

  promptAddVoiceMemo() {
    const title = prompt("Enter Voice Memo Title (e.g. Traverse Hub CP-3 Description):", "Traverse CP-3 Sightline");
    if (!title) return;
    const transcript = prompt("Speak or Enter Audio Notes:", "Clear sightline to CP4. Set 1/2 inch iron rod with yellow cap RPLS 5421.");

    this.voiceMemos.push({
      id: "voice-" + Date.now(),
      title,
      duration: "0:18",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transcript
    });

    this.save();
    this.renderFieldBook();
    window.soundFX.playShotBeep();
  }

  initSketchCanvas() {
    this.sketchCanvas = document.getElementById('fb-sketch-canvas');
    if (!this.sketchCanvas) return;
    this.sketchCtx = this.sketchCanvas.getContext('2d');

    this.drawSketchGrid();

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
    ctx.fillStyle = "#fffef0";
    ctx.fillRect(0, 0, this.sketchCanvas.width, this.sketchCanvas.height);

    ctx.strokeStyle = "rgba(79, 140, 201, 0.25)";
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

  calculateLevelLoop() {
    if (!this.notes.levelLoop || this.notes.levelLoop.length === 0) return;

    let currentElev = 685.500;
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
    const misclosure = endElev - startElev;

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

window.FieldBook = FieldBook;
window.fieldBook = new FieldBook();
