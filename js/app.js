// Main Application Controller & Device Viewport Switcher
class SurveyApp {
  constructor() {
    this.currentTab = 'aim'; // 'aim', 'fieldbook', 'jobs', 'cad', 'points'
    this.deviceMode = 'phone'; // 'phone', 'tablet', 'cad-station'
    this.sunlightMode = false;
  }

  init() {
    // 1. Initialize Points Manager
    window.pointManager.init(window.SAMPLE_DATA.points);

    // 2. Initialize SUE Linework Engine
    window.cadEngine = new window.CadEngine('cad-canvas');
    window.cadEngine.init(window.SAMPLE_DATA.linework);

    // 3. Initialize Jobs & Checklist Manager
    window.jobManager.init(window.SAMPLE_DATA.jobs);

    // 4. Initialize Digital Field Book & SUE Notes
    window.fieldBook.init(window.SAMPLE_DATA.fieldNotes);

    // 5. Initialize AOL Instant Messenger Chat
    window.aimChat.init(window.SAMPLE_DATA.aim);

    // 6. Setup Point Manager UI listener
    window.pointManager.subscribe(() => {
      this.renderPointsTable();
      if (window.cadEngine) window.cadEngine.render();
    });

    this.renderPointsTable();
    this.bindGlobalEvents();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Start Topcon / Sokkia GNSS HUD live readout
    this.startGnssHudTick();

    // Switch to initial tab: Live AIM Chat linking Office & Field
    this.switchTab('aim');
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update bottom nav active state
    document.querySelectorAll('.android-nav-item').forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update views visibility
    document.querySelectorAll('.app-view').forEach(view => {
      if (view.id === `view-${tabName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Refresh views on switch
    if (tabName === 'cad' && window.cadEngine) {
      setTimeout(() => {
        window.cadEngine.resizeCanvas();
        window.cadEngine.render();
      }, 50);
    } else if (tabName === 'jobs' && window.jobManager) {
      window.jobManager.render();
    } else if (tabName === 'fieldbook' && window.fieldBook) {
      window.fieldBook.renderFieldBook();
    } else if (tabName === 'aim' && window.aimChat) {
      window.aimChat.renderAim();
    } else if (tabName === 'points') {
      this.renderPointsTable();
    }
  }

  setDeviceMode(mode) {
    this.deviceMode = mode;
    const frame = document.getElementById('device-wrapper');
    if (!frame) return;

    frame.classList.remove('mode-phone', 'mode-tablet', 'mode-cad-station');
    frame.classList.add(`mode-${mode}`);

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Trigger canvas resize
    setTimeout(() => {
      if (window.cadEngine) window.cadEngine.resizeCanvas();
    }, 100);
  }

  toggleSunlightMode() {
    this.sunlightMode = !this.sunlightMode;
    document.body.classList.toggle('sunlight-mode', this.sunlightMode);
    const btn = document.getElementById('btn-sunlight-toggle');
    if (btn) {
      btn.classList.toggle('active', this.sunlightMode);
      btn.innerHTML = this.sunlightMode ? '☀️ Sunlight Mode: ON' : '🕶️ Sunlight Mode';
    }
    window.soundFX.playShotBeep();
  }

  bindGlobalEvents() {
    // File upload inputs
    const dxfInput = document.getElementById('file-dxf-import');
    if (dxfInput) {
      dxfInput.addEventListener('change', e => this.handleDxfFileSelect(e));
    }

    const csvInput = document.getElementById('file-csv-import');
    if (csvInput) {
      csvInput.addEventListener('change', e => this.handleCsvFileSelect(e));
    }
  }

  // Handle uploading DXF file
  handleDxfFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsed = window.dxfManager.parseDxf(content);

      if (parsed.points.length > 0 || parsed.linework.length > 0) {
        parsed.points.forEach(p => window.pointManager.addPoint(p));
        parsed.linework.forEach(l => window.cadEngine.linework.push(l));

        window.cadEngine.save();
        window.cadEngine.fitExtents();
        window.cadEngine.render();
        this.renderPointsTable();

        alert(`Successfully imported DXF file!\nAdded: ${parsed.linework.length} Linework entities and ${parsed.points.length} Points.`);
        window.soundFX.playShotBeep();
      } else {
        alert("Could not detect 2D line or point entities in DXF file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // Handle uploading CSV / TXT point file
  handleCsvFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsed = window.dxfManager.parseCsv(content);

      if (parsed.length > 0) {
        parsed.forEach(p => window.pointManager.addPoint(p));
        this.renderPointsTable();
        if (window.cadEngine) {
          window.cadEngine.fitExtents();
          window.cadEngine.render();
        }
        alert(`Imported ${parsed.length} survey points from CSV!`);
        window.soundFX.playShotBeep();
      } else {
        alert("No valid coordinate rows found in CSV/TXT file. Ensure P,N,E,Z,D format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // Render the Points Database Table
  renderPointsTable() {
    const tbody = document.getElementById('points-table-body');
    const countEl = document.getElementById('points-count-badge');
    if (!tbody || !window.pointManager) return;

    const points = window.pointManager.getAll();
    if (countEl) countEl.textContent = `${points.length} Shots`;

    const filterVal = (document.getElementById('points-search-input')?.value || "").toLowerCase();

    const filtered = points.filter(p =>
      String(p.id).includes(filterVal) ||
      (p.code || "").toLowerCase().includes(filterVal) ||
      (p.desc || "").toLowerCase().includes(filterVal)
    );

    tbody.innerHTML = filtered.map(p => `
      <tr class="point-row">
        <td><b>#${p.id}</b></td>
        <td><span class="badge ${p.type || 'TOPO'}">${p.code}</span></td>
        <td class="font-mono">${p.northing.toFixed(3)}</td>
        <td class="font-mono">${p.easting.toFixed(3)}</td>
        <td class="font-mono font-bold">${p.elevation.toFixed(3)}'</td>
        <td class="text-sm text-muted">${p.desc || '-'}</td>
        <td class="text-sm">${p.hr || 5.0}'</td>
        <td>
          <button class="btn btn-xs btn-outline-info" onclick="window.cadEngine.zoomToPoint(${p.id}); window.app.switchTab('cad');" title="Zoom on CAD">🔍</button>
          <button class="btn btn-xs btn-outline-primary" onclick="window.aimChat.sendPointToChat(${p.id}); window.app.switchTab('aim');" title="Send to AIM">💬</button>
          <button class="btn btn-xs btn-outline-danger" onclick="window.app.deletePoint(${p.id})" title="Delete Point">🗑️</button>
        </tr>
    `).join('');
  }

  deletePoint(id) {
    if (confirm(`Delete survey point #${id}?`)) {
      window.pointManager.deletePoint(id);
    }
  }

  promptTakeRtkShot() {
    const code = prompt("Enter Feature Code for RTK Shot (e.g. IP, EP, CL, MH, TREE):", "TOPO");
    if (code) {
      const desc = prompt("Enter Description / Notes:", "RTK GNSS Shot") || "";
      const pt = window.pointManager.takeRtkShot(code, desc);
      this.renderPointsTable();
      if (window.cadEngine) window.cadEngine.render();
      alert(`Recorded Point #${pt.id} [${pt.code}] at N:${pt.northing.toFixed(2)} E:${pt.easting.toFixed(2)} Elev:${pt.elevation.toFixed(2)}'`);
    }
  }

  updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.android-clock').forEach(el => el.textContent = timeStr);
  }

  // ─── Topcon / Sokkia GNSS HUD live update ────────────────────────────────
  startGnssHudTick() {
    // Simulate realistic RTK HUD readings (Topcon HiPer VR on TopNET Live VRS)
    const statusEl  = document.getElementById('hud-status');
    const pdopEl    = document.getElementById('hud-pdop');
    const satsEl    = document.getElementById('hud-sats');
    const hrmsEl    = document.getElementById('hud-hrms');
    const vrmsEl    = document.getElementById('hud-vrms');
    const networkEl = document.getElementById('hud-network');
    const linkEl    = document.getElementById('hud-link');

    const updateHud = () => {
      // Realistic jitter for a fixed RTK solution
      const pdop  = (0.95 + Math.random() * 0.3).toFixed(2);
      const sats  = 22 + Math.floor(Math.random() * 5);
      const hrms  = (0.008 + Math.random() * 0.012).toFixed(3);
      const vrms  = (0.015 + Math.random() * 0.018).toFixed(3);

      // Occasionally simulate brief float
      const isFixed  = Math.random() > 0.06;
      const statusTxt = isFixed ? 'RTK FIXED' : 'RTK FLOAT';

      if (statusEl)  { statusEl.textContent = statusTxt; statusEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`; }
      if (pdopEl)    pdopEl.textContent = pdop;
      if (satsEl)    satsEl.textContent = String(sats);
      if (hrmsEl)    { hrmsEl.textContent = `${hrms} ft`; hrmsEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`; }
      if (vrmsEl)    { vrmsEl.textContent = `${vrms} ft`; vrmsEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`; }

      // Blink network label to show active data stream
      if (networkEl) networkEl.style.opacity = (Math.random() > 0.15) ? '1' : '0.6';
      if (linkEl)    linkEl.textContent = isFixed ? 'LongLink BT ✔' : 'LongLink BT…';

      // Also update the RTK coords HUD in the status bar
      if (window.pointManager) {
        const pts = window.pointManager.getAll();
        if (pts.length > 0) {
          const last = pts[pts.length - 1];
          const coordEl = document.getElementById('rtk-hud-coords');
          if (coordEl) {
            const nJitter = last.northing + (Math.random() - 0.5) * 0.008;
            const eJitter = last.easting  + (Math.random() - 0.5) * 0.008;
            const zJitter = last.elevation + (Math.random() - 0.5) * 0.004;
            coordEl.textContent = `N: ${nJitter.toFixed(2)} E: ${eJitter.toFixed(2)} Z: ${zJitter.toFixed(2)}`;
          }
        }
      }
    };

    updateHud(); // immediate first update
    setInterval(updateHud, 2500); // update every 2.5 s
  }
}

window.app = new SurveyApp();
