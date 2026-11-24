// Digital Land Surveying Field Book Engine (Transit Book, Level Loop & Boundary Notes)
class FieldBook {
  constructor() {
    this.notes = null;
    this.sketchCanvas = null;
    this.sketchCtx = null;
    this.currentSubTab = 'book'; // 'book', 'traverse', 'boundary', 'stakeout', 'media'
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

    // Ensure hardware & monuments exist when migrating older stored field notes
    if (initialNotes) {
      if (!this.notes.hardware && initialNotes.hardware) {
        this.notes.hardware = { ...initialNotes.hardware };
      }
      if (!this.notes.monuments && initialNotes.monuments) {
        this.notes.monuments = [...initialNotes.monuments];
      }
      if (!this.notes.instrumentCheck && initialNotes.instrumentCheck) {
        this.notes.instrumentCheck = { ...initialNotes.instrumentCheck };
      }
    }

    const savedPhotos = localStorage.getItem('survey_field_photos');
    if (savedPhotos) {
      try { this.photos = JSON.parse(savedPhotos); } catch (e) {}
    } else {
      this.photos = [
        {
          id: "photo-1",
          title: "SW Lot Corner 1/2\" Iron Rod",
          pointId: 10,
          bearing: "N 45° E",
          time: "08:42 AM",
          notes: "Found 1/2\" iron rod flush with grade, 2.1' east of water meter box."
        },
        {
          id: "photo-2",
          title: "NW Property Corner 5/8\" Rebar",
          pointId: 11,
          bearing: "N 12° W",
          time: "09:15 AM",
          notes: "Found 5/8\" iron rod flush with ground in fence line."
        }
      ];
    }

    const savedMemos = localStorage.getItem('survey_voice_memos');
    if (savedMemos) {
      try { this.voiceMemos = JSON.parse(savedMemos); } catch (e) {}
    } else {
      this.voiceMemos = [
        {
          id: "memo-1",
          title: "SW Corner Water Meter Verification",
          duration: "0:18",
          time: "08:44 AM",
          transcript: "Point 10 is 2.1 feet east of the water meter vault. Encroachment conflict cleared. Boundary line is free of utilities."
        }
      ];
    }

    this.computeLevelLoopStatsOnly();
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
        <!-- Field Book Top Navigation Bar -->
        <div class="fieldbook-topbar">
          <div class="fb-title">
            <span class="fb-badge">FIELD BOOK #${n.bookNumber || 'FB-01'}</span>
            <span class="fb-page">PAGE ${n.pageNumber || 42}</span>
            <h3>${n.projectName || 'Project Survey Notes'}</h3>
          </div>

          <!-- Section Switcher Tabs -->
          <div class="fb-subnav-buttons">
            <button class="btn btn-xs ${this.currentSubTab === 'book' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('book')">
              📖 Transit & Level Book
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'traverse' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('traverse')">
              🔄 Traverse Loop Balance
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'boundary' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('boundary')">
              📍 Boundary & Monuments
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'stakeout' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('stakeout')">
              🎯 Stakeout Navigator
            </button>
            <button class="btn btn-xs ${this.currentSubTab === 'media' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.fieldBook.setSubTab('media')">
              📷 Photos & Voice Notes
            </button>
          </div>

          <div class="fb-actions">
            <button class="btn btn-xs btn-outline-warning" onclick="window.print()">🖨️ Print Book</button>
            <button class="btn btn-xs btn-success" onclick="window.fieldBook.saveNotesFromForm()">💾 Save</button>
          </div>
        </div>

        <!-- 1. CLASSIC 2-PAGE YELLOW TRANSIT BOOK SPREAD -->
        ${this.currentSubTab === 'book' ? this.renderTransitBookSpread() : ''}

        <!-- 2. TRAVERSE LOOP BALANCING (COMPASS RULE / BOWDITCH) -->
        ${this.currentSubTab === 'traverse' ? this.renderTraverseSection() : ''}

        <!-- 3. BOUNDARY CORNER & MONUMENT RECOVERY SHEET -->
        ${this.currentSubTab === 'boundary' ? this.renderBoundarySection() : ''}

        <!-- 4. STAKEOUT NAVIGATOR -->
        ${this.currentSubTab === 'stakeout' ? this.renderStakeoutSection() : ''}

        <!-- 5. PHOTOS & VOICE MEMOS -->
        ${this.currentSubTab === 'media' ? this.renderMediaSection() : ''}
      </div>
    `;

    if (this.currentSubTab === 'book') {
      this.initSketchCanvas();
    }
  }

  // Classic 2-Page Yellow Grid Transit & Level Book
  renderTransitBookSpread() {
    const n = this.notes;
    return `
      <div class="fieldbook-spread">
        <!-- LEFT PAGE: TABULAR DATA & LEVEL LOOP -->
        <div class="fieldbook-page left-page">
          <div class="page-header-row">
            <span class="page-date">DATE: <input type="date" id="fb-date" value="${n.date || '2026-11-23'}"></span>
            <span class="page-title-left">DIFFERENTIAL LEVEL & BENCHMARK TIES</span>
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
                  <th>REMARKS / CODE</th>
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
            <button class="btn btn-xs btn-outline-primary" onclick="window.fieldBook.addRow()">+ Add Turning Point</button>
            <button class="btn btn-xs btn-outline-success" onclick="window.fieldBook.calculateLevelLoop()">⚡ Compute Page Check</button>
          </div>

          <div class="level-closure-box">
            ${this.getLevelLoopSummaryHTML()}
          </div>
        </div>

        <!-- RIGHT PAGE: CREW, WEATHER, INSTRUMENT, SKETCH -->
        <div class="fieldbook-page right-page">
          <div class="page-header-row">
            <span class="page-title-right">CREW & INSTRUMENT ALIGNMENT NOTES</span>
            <span class="notes-by">RECORDER: <input type="text" id="fb-notes-by" value="${n.crew?.notesBy || 'M.K.'}"></span>
          </div>

          <div class="fb-meta-grid">
            <div class="fb-meta-group"><label>Party Chief:</label><input type="text" id="fb-party-chief" value="${n.crew?.partyChief || ''}"></div>
            <div class="fb-meta-group"><label>Instrument Operator:</label><input type="text" id="fb-instrument-op" value="${n.crew?.instrument || ''}"></div>
            <div class="fb-meta-group"><label>Rodperson:</label><input type="text" id="fb-rodperson" value="${n.crew?.rodperson || ''}"></div>
            <div class="fb-meta-group"><label>Weather & Temp:</label><input type="text" id="fb-weather" value="${n.weather?.temp || '72°F'}, ${n.weather?.conditions || 'Clear'}"></div>
            <div class="fb-meta-group"><label>Barometric Pressure:</label><input type="text" id="fb-pressure" value="${n.weather?.pressure || '30.08 inHg'}"></div>
            <div class="fb-meta-group"><label>Instrument Check:</label><input type="text" id="fb-instr-check" value="${n.instrumentCheck?.model || ''} - ${n.instrumentCheck?.collimationCheck || 'PASSED'}"></div>
            <div class="fb-meta-group"><label>Field Tablet & Software:</label><input type="text" id="fb-hw-tablet" value="${(window.app?.equipmentProfile?.tablet || n.hardware?.tablet || 'Topcon FC-6000')} / ${(window.app?.equipmentProfile?.software || n.hardware?.software || 'MAGNET Field v8.2')}"></div>
            <div class="fb-meta-group"><label>GNSS & Total Station:</label><input type="text" id="fb-hw-gear" value="${(window.app?.equipmentProfile?.gps || n.hardware?.gps || 'Topcon HiPer VR')} • ${(window.app?.equipmentProfile?.totalStation || n.hardware?.robot || 'Sokkia iX-1200')}"></div>
          </div>

          <div class="fb-sketch-wrapper">
            <div class="fb-sketch-header">
              <span>FIELD SKETCH & MONUMENT TIES (Grid = 10 FT)</span>
              <button class="btn btn-xs btn-outline-danger" onclick="window.fieldBook.clearSketch()">Clear</button>
            </div>
            <canvas id="fb-sketch-canvas" width="460" height="190"></canvas>
          </div>

          <div class="fb-remarks-group">
            <label>Field Remarks & Monument Recoveries:</label>
            <textarea id="fb-remarks-text" rows="3">${n.remarks || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  // Traverse Loop Balancing & Closure Sheet
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
            <div class="t-stat"><span>Perimeter:</span><b>${sumDist.toFixed(2)} ft</b></div>
            <div class="t-stat"><span>Misclosure North (ΔN):</span><b>${sumLat > 0 ? '+' : ''}${sumLat.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Misclosure East (ΔE):</span><b>${sumDep > 0 ? '+' : ''}${sumDep.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Linear Misclosure:</span><b class="text-accent">${linearError.toFixed(3)} ft</b></div>
            <div class="t-stat"><span>Precision Ratio:</span><b class="text-success">1 : ${precisionRatio.toLocaleString()}</b></div>
            <div class="t-stat"><span>Specification:</span><b>Class A (1:10,000)</b></div>
          </div>
        </div>

        <div class="table-card">
          <table class="survey-table">
            <thead>
              <tr>
                <th>TRAVERSE LEG</th>
                <th>HORIZ DIST</th>
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
          <button class="btn btn-sm btn-primary" onclick="window.aimChat.postSystemUpdate('Traverse Loop Adjusted: Precision 1:${precisionRatio.toLocaleString()} (Passed). Balanced coordinates stored.'); window.app.switchTab('aim');">
            💬 Post Traverse Results to AIM Chat
          </button>
        </div>
      </div>
    `;
  }

  // Boundary Corner Monuments & Recovery Table
  renderBoundarySection() {
    const monuments = this.notes.monuments || [];
    return `
      <div class="monument-notes-container" style="padding: 12px; display: flex; flex-direction: column; gap: 12px;">
        <div class="sue-notes-header">
          <div>
            <h4 class="font-bold">Lot 14 Boundary Monument Recoveries & Deed Calls</h4>
            <p class="text-xs text-muted">Comparison of found/set monuments (MAGNET Field) against 1984 record plat in Civil 3D.</p>
          </div>
          <button class="btn btn-xs btn-primary" onclick="window.fieldBook.promptAddMonument()">+ Log Monument</button>
        </div>

        <div class="table-card">
          <table class="survey-table">
            <thead>
              <tr>
                <th>CORNER / MONUMENT</th>
                <th>PHYSICAL DESCRIPTION</th>
                <th>NORTHING</th>
                <th>EASTING</th>
                <th>ELEVATION</th>
                <th>RECORD VS MEASURED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${monuments.map(m => `
                <tr>
                  <td><b>${m.corner}</b></td>
                  <td>${m.physicalDesc}</td>
                  <td class="font-mono">${Number(m.northing).toFixed(2)}</td>
                  <td class="font-mono">${Number(m.easting).toFixed(2)}</td>
                  <td class="font-mono">${Number(m.elevation).toFixed(2)}'</td>
                  <td>${m.comparison}</td>
                  <td><span class="badge ${m.status === 'Set' ? 'badge-warning' : 'badge-success'}">${m.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  promptAddMonument() {
    const corner = prompt("Corner / Monument Name (e.g. Lot 14 West Witness Pin):", "Lot 14 Witness Corner");
    if (!corner) return;
    const physicalDesc = prompt("Physical Description (e.g. Set 5/8\" rebar w/ Topcon yellow cap):", "Set 5/8\" rebar w/ Topcon yellow cap RPLS 5421") || "Monument";
    const northing = parseFloat(prompt("Northing (Y):", "10250.00")) || 10250.00;
    const easting = parseFloat(prompt("Easting (X):", "10050.00")) || 10050.00;
    const elevation = parseFloat(prompt("Elevation (Z):", "688.00")) || 688.00;
    const comparison = prompt("Record vs Measured Note:", "Online w/ West Property Line") || "Verified";
    const status = prompt("Status (Recovered or Set):", "Set") || "Set";

    if (!this.notes.monuments) this.notes.monuments = [];
    this.notes.monuments.push({ corner, physicalDesc, northing, easting, elevation, comparison, status });
    this.save();
    this.renderFieldBook();
    if (window.soundFX) window.soundFX.playShotBeep();
    if (window.aimChat) {
      window.aimChat.postSystemUpdate(`📍 Monument Logged: ${corner} (${physicalDesc}) @ N:${northing.toFixed(2)} E:${easting.toFixed(2)}`);
    }
  }

  // Stakeout Navigator
  renderStakeoutSection() {
    const points = window.pointManager ? window.pointManager.getAll() : [];
    const stakeInfo = window.pointManager ? window.pointManager.getStakeoutDelta(this.activeStakeoutPtId) : null;

    return `
      <div class="stakeout-container">
        <div class="stakeout-control-bar">
          <label>Target Point to Stake:</label>
          <select class="form-select-sm" onchange="window.fieldBook.activeStakeoutPtId = Number(this.value); window.fieldBook.renderFieldBook();">
            ${points.map(p => `
              <option value="${p.id}" ${p.id === this.activeStakeoutPtId ? 'selected' : ''}>
                PT #${p.id} [${p.code}] - N:${p.northing.toFixed(1)} E:${p.easting.toFixed(1)} (${p.desc || 'Point'})
              </option>
            `).join('')}
          </select>
          <button class="btn btn-xs btn-outline-info" onclick="window.cadEngine.zoomToPoint(${this.activeStakeoutPtId}); window.app.switchTab('cad');">
            🔍 View on Linework Canvas
          </button>
        </div>

        ${stakeInfo ? `
          <div class="stakeout-display-grid">
            <div class="stakeout-bullseye-card">
              <div class="bullseye-ring ring-3">
                <div class="bullseye-ring ring-2">
                  <div class="bullseye-ring ring-1">
                    <div class="bullseye-center"></div>
                  </div>
                </div>
              </div>
              <div class="bullseye-status ${stakeInfo.inTolerance ? 'text-success' : 'text-accent'}">
                ${stakeInfo.inTolerance ? '🎯 IN TOLERANCE (SET PIN)' : `DISTANCE: ${stakeInfo.horizDist.toFixed(2)} FT`}
              </div>
            </div>

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

  // Field Photos & Voice Notes
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
          <div class="media-column">
            <h5>📷 Monument Recovery Photos (${this.photos.length})</h5>
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
    const title = prompt("Enter Monument Photo Description:", "SW Corner 1/2\" Iron Rod");
    if (!title) return;
    const ptId = prompt("Linked Survey Point ID:", "10");
    const notes = prompt("Field ties / witness marks:", "2.1 ft east of water meter box");

    this.photos.push({
      id: "photo-" + Date.now(),
      title,
      pointId: Number(ptId) || 1,
      bearing: "N 45° E",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: notes || "Monument photo"
    });

    this.save();
    this.renderFieldBook();
    window.soundFX.playShotBeep();
  }

  promptAddVoiceMemo() {
    const title = prompt("Voice Memo Title:", "Traverse Sightline Note");
    if (!title) return;
    const transcript = prompt("Audio Note Transcript:", "Line cleared between CP1 and CP2 through heavy brush.");

    this.voiceMemos.push({
      id: "voice-" + Date.now(),
      title,
      duration: "0:15",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transcript: transcript || ""
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
      remarks: "Field Turning Point"
    });
    this.renderFieldBook();
  }

  deleteRow(index) {
    if (!this.notes.levelLoop) return;
    this.notes.levelLoop.splice(index, 1);
    this.renderFieldBook();
  }

  computeLevelLoopStatsOnly() {
    if (!this.notes.levelLoop || this.notes.levelLoop.length === 0) return;

    let currentElev = 685.500;
    let currentHI = null;
    let sumBS = 0, sumFS = 0;

    for (let i = 0; i < this.notes.levelLoop.length; i++) {
      const row = this.notes.levelLoop[i];
      if (i === 0 && row.elev) currentElev = row.elev;

      if (row.fs !== null && row.fs !== undefined && currentHI !== null) {
        currentElev = currentHI - row.fs;
        row.elev = currentElev;
        sumFS += row.fs;
      }
      if (row.bs !== null && row.bs !== undefined) {
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
  }

  calculateLevelLoop() {
    this.computeLevelLoopStatsOnly();
    this.save();
    this.renderFieldBook();
    if (window.soundFX) window.soundFX.playShotBeep();
  }

  getLevelLoopSummaryHTML() {
    if (!this.lastLoopStats) {
      return `<div class="closure-summary"><span>Page Check: <b>Pending calculation (Σ BS - Σ FS = End Elev - Start Elev)</b></span></div>`;
    }
    const s = this.lastLoopStats;
    return `
      <div class="closure-summary">
        <div>Σ BS: <b>+${s.sumBS.toFixed(3)}</b> | Σ FS: <b>-${s.sumFS.toFixed(3)}</b></div>
        <div>Page Check: ${s.pageCheckPassed ? '✅ <span class="text-success font-bold">PASSED</span>' : '❌ <span class="text-danger">MATH ERROR</span>'} (Loop Misclosure: ${s.misclosure.toFixed(3)} ft - Allowable: ±0.024 ft)</div>
      </div>
    `;
  }

  saveNotesFromForm() {
    if (!this.notes) return;
    this.notes.date = document.getElementById('fb-date')?.value || this.notes.date;
    this.notes.remarks = document.getElementById('fb-remarks-text')?.value ?? this.notes.remarks;
    if (!this.notes.crew) this.notes.crew = {};
    this.notes.crew.partyChief = document.getElementById('fb-party-chief')?.value ?? this.notes.crew.partyChief;
    this.notes.crew.instrument = document.getElementById('fb-instrument-op')?.value ?? this.notes.crew.instrument;
    this.notes.crew.rodperson = document.getElementById('fb-rodperson')?.value ?? this.notes.crew.rodperson;
    this.notes.crew.notesBy = document.getElementById('fb-notes-by')?.value ?? this.notes.crew.notesBy;

    const weatherVal = document.getElementById('fb-weather')?.value;
    if (weatherVal !== undefined) {
      if (!this.notes.weather) this.notes.weather = {};
      const parts = weatherVal.split(',');
      this.notes.weather.temp = (parts[0] || '').trim();
      this.notes.weather.conditions = parts.slice(1).join(',').trim() || this.notes.weather.conditions;
    }
    const pressureVal = document.getElementById('fb-pressure')?.value;
    if (pressureVal !== undefined) {
      if (!this.notes.weather) this.notes.weather = {};
      this.notes.weather.pressure = pressureVal.trim();
    }
    const instrVal = document.getElementById('fb-instr-check')?.value;
    if (instrVal !== undefined) {
      if (!this.notes.instrumentCheck) this.notes.instrumentCheck = {};
      const parts = instrVal.split(' - ');
      this.notes.instrumentCheck.model = (parts[0] || '').trim();
      if (parts[1]) this.notes.instrumentCheck.collimationCheck = parts.slice(1).join(' - ').trim();
    }

    this.save();
    if (window.soundFX) window.soundFX.playShotBeep();
    if (window.app && window.app.showToast) {
      window.app.showToast("Survey Field Notes saved!");
    } else {
      alert("Survey Field Notes Saved Successfully!");
    }
  }
}

window.FieldBook = FieldBook;
window.fieldBook = new FieldBook();
