// Main Application Controller, Topcon/Sokkia Equipment Profiles & Device Viewport Switcher
class SurveyApp {
  constructor() {
    this.currentTab = 'cad'; // 'cad', 'points', 'fieldbook', 'jobs', 'aim'
    this.deviceMode = 'responsive'; // 'responsive', 'phone', 'tablet', 'cad-station'
    this.pointsFilter = 'all';
    this.sunlightMode = false;
    this.equipmentProfile = {
      brandPreset: 'topcon', // 'topcon', 'sokkia', 'mixed'
      tablet: 'Topcon FC-6000',
      software: 'MAGNET Field v8.2',
      gps: 'Topcon HiPer VR',
      totalStation: 'Sokkia iX-1200',
      sensorMode: 'GNSS_RTK', // 'GNSS_RTK' or 'ROBOTIC_TS'
      network: 'TopNET Live VRS',
      cadOffice: 'Autodesk Civil 3D 2026',
      rodHeight: 6.562,
      prismConstMm: -30
    };
    this.deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
    });
  }

  init() {
    this.loadEquipmentProfile();

    // 1. Initialize Points Manager
    window.pointManager.init(window.SAMPLE_DATA.points);
    window.pointManager.setEquipmentProfile(this.equipmentProfile);

    // 2. Initialize Survey Linework Engine
    window.cadEngine = new window.CadEngine('cad-canvas');
    window.cadEngine.init(window.SAMPLE_DATA.linework);

    // 3. Initialize Jobs & Checklist Manager
    window.jobManager.init(window.SAMPLE_DATA.jobs);
    this.syncActiveJobHeader();

    // 4. Initialize Digital Field Book & Monument Notes
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
    this.applyEquipmentProfileUI();
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Start Topcon / Sokkia GNSS & Robotic TS HUD live readout
    this.startGnssHudTick();

    // Switch to initial tab: Survey Map
    this.switchTab('cad');
  }

  loadEquipmentProfile() {
    const saved = localStorage.getItem('survey_equipment_profile');
    if (saved) {
      try {
        this.equipmentProfile = { ...this.equipmentProfile, ...JSON.parse(saved) };
      } catch (e) {}
    }
  }

  saveEquipmentProfile() {
    localStorage.setItem('survey_equipment_profile', JSON.stringify(this.equipmentProfile));
  }

  applyEquipmentProfileUI() {
    const p = this.equipmentProfile;
    const wrapper = document.getElementById('device-wrapper');
    if (wrapper) {
      wrapper.classList.remove('brand-topcon', 'brand-sokkia');
      const isSokkiaTablet = /sokkia|shc/i.test(p.tablet);
      wrapper.classList.add(isSokkiaTablet ? 'brand-sokkia' : 'brand-topcon');
    }

    const hudModel = document.getElementById('hud-model');
    const hudDevice = document.getElementById('hud-device');
    const hudSw = document.getElementById('hud-sw');
    const hudNetwork = document.getElementById('hud-network');
    const hudLink = document.getElementById('hud-link');
    const brandTopcon = document.getElementById('hud-brand-topcon');
    const brandSokkia = document.getElementById('hud-brand-sokkia');

    if (hudModel) {
      hudModel.textContent = p.sensorMode === 'ROBOTIC_TS'
        ? `${p.totalStation} (${p.prismConstMm}mm)`
        : `${p.gps} / ${p.totalStation.split(' ')[1] || 'TS'}`;
    }
    if (hudDevice) hudDevice.textContent = p.tablet;
    if (hudSw) hudSw.textContent = p.software;
    if (hudNetwork) {
      hudNetwork.textContent = p.sensorMode === 'ROBOTIC_TS' ? 'Robotic Prism Lock' : p.network;
    }
    if (hudLink) {
      hudLink.textContent = p.sensorMode === 'ROBOTIC_TS' ? 'LongLink Radio ✔' : 'LongLink BT ✔';
    }
    if (brandTopcon && brandSokkia) {
      const topconPrimary = !/sokkia|shc/i.test(p.tablet);
      brandTopcon.style.order = topconPrimary ? '1' : '2';
      brandSokkia.style.order = topconPrimary ? '2' : '1';
      brandTopcon.style.opacity = /topcon|fc-/i.test(p.tablet + ' ' + p.gps + ' ' + p.totalStation) ? '1' : '0.45';
      brandSokkia.style.opacity = /sokkia|shc|grx|gcx|ix/i.test(p.tablet + ' ' + p.gps + ' ' + p.totalStation) ? '1' : '0.45';
    }

    if (window.pointManager) {
      window.pointManager.setEquipmentProfile(p);
    }
  }

  syncActiveJobHeader() {
    const job = window.jobManager ? window.jobManager.getCurrentJob() : null;
    if (!job) return;
    const titleEl = document.getElementById('app-bar-job-name');
    const subEl = document.getElementById('app-bar-job-sub');
    if (titleEl) titleEl.textContent = `#${job.number} ${job.name.split(' - ')[0]}`;
    if (subEl) subEl.textContent = `${job.location} • ${this.equipmentProfile.software}`;
  }

  switchTab(tabName) {
    const resolvedTab = (tabName === 'aim' || tabName === 'cad') ? 'cad' : tabName;
    this.currentTab = resolvedTab;

    document.querySelectorAll('.android-nav-item').forEach(item => {
      const itemTab = item.dataset.tab;
      const isActive = itemTab === resolvedTab || (resolvedTab === 'cad' && (itemTab === 'cad' || itemTab === 'aim'));
      item.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${resolvedTab}`);
    });

    if (resolvedTab === 'cad') {
      if (window.cadEngine) {
        setTimeout(() => {
          window.cadEngine.resizeCanvas();
          window.cadEngine.render();
        }, 50);
      }
      if (window.aimChat) {
        window.aimChat.renderAim();
      }
    } else if (resolvedTab === 'jobs' && window.jobManager) {
      window.jobManager.render();
    } else if (resolvedTab === 'fieldbook' && window.fieldBook) {
      window.fieldBook.renderFieldBook();
    } else if (resolvedTab === 'points') {
      this.renderPointsTable();
    }
  }

  switchPlatformEntity(platform) {
    this.platformEntity = platform; // 'android', 'iphone', 'desktop'

    document.querySelectorAll('.platform-entity-tab').forEach(tab => {
      tab.classList.toggle('active', tab.id === `tab-ent-${platform}`);
    });

    const frame = document.getElementById('device-wrapper');
    if (!frame) return;

    frame.classList.remove('mode-phone', 'mode-iphone', 'mode-tablet', 'mode-cad-station', 'mode-desktop-app');

    // Remove any existing dynamic island before re-adding
    const existingIsland = frame.querySelector('.iphone-dynamic-island');
    if (existingIsland) existingIsland.remove();

    if (platform === 'iphone') {
      frame.classList.add('mode-iphone');
      const island = document.createElement('div');
      island.className = 'iphone-dynamic-island';
      island.onclick = () => window.app.openEquipmentModal();
      island.title = 'Dynamic Island: Tap to configure GNSS & Total Station';
      island.innerHTML = `
        <div class="island-sensor-dot"></div>
        <div class="island-rtk-indicator">
          <div class="island-pulse-dot"></div>
          <span>RTK FIXED</span>
        </div>
      `;
      frame.insertBefore(island, frame.firstChild);

      if (window.aimChat && window.aimChat.currentUser.role !== 'field') {
        window.aimChat.switchUserRole('field');
      }
    } else if (platform === 'android') {
      frame.classList.add('mode-phone');
      if (window.aimChat && window.aimChat.currentUser.role !== 'field') {
        window.aimChat.switchUserRole('field');
      }
    } else if (platform === 'desktop') {
      frame.classList.add('mode-desktop-app');
      if (window.aimChat && window.aimChat.currentUser.role !== 'cad') {
        window.aimChat.switchUserRole('cad');
      }
    }

    if (window.cadEngine) {
      setTimeout(() => {
        window.cadEngine.resizeCanvas();
        window.cadEngine.render();
      }, 100);
    }
    if (window.aimChat) {
      window.aimChat.renderAim();
    }
  }

  setDeviceMode(mode) {
    if (mode === 'iphone') return this.switchPlatformEntity('iphone');
    if (mode === 'phone') return this.switchPlatformEntity('android');
    if (mode === 'cad-station') return this.switchPlatformEntity('desktop');

    this.deviceMode = mode;
    const frame = document.getElementById('device-wrapper');
    if (!frame) return;

    frame.classList.remove('mode-phone', 'mode-iphone', 'mode-tablet', 'mode-cad-station', 'mode-desktop-app');
    frame.classList.add(`mode-${mode}`);

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (window.cadEngine) {
      setTimeout(() => {
        window.cadEngine.resizeCanvas();
        window.cadEngine.render();
      }, 100);
    }
    if (window.aimChat) {
      window.aimChat.renderAim();
    }
  }

  toggleSunlightMode() {
    this.sunlightMode = !this.sunlightMode;
    document.body.classList.toggle('sunlight-mode', this.sunlightMode);
    const btn = document.getElementById('btn-sunlight-toggle');
    if (btn) {
      btn.classList.toggle('active', this.sunlightMode);
      btn.innerHTML = this.sunlightMode ? '☀️ Sunlight: ON' : '🕶️ Sunlight';
    }
    if (window.soundFX) window.soundFX.playShotBeep();
  }

  bindGlobalEvents() {
    const dxfInput = document.getElementById('file-dxf-import');
    if (dxfInput) dxfInput.addEventListener('change', e => this.handleDxfFileSelect(e));

    const csvInput = document.getElementById('file-csv-import');
    if (csvInput) csvInput.addEventListener('change', e => this.handleCsvFileSelect(e));

    const rw5Input = document.getElementById('file-rw5-import');
    if (rw5Input) rw5Input.addEventListener('change', e => this.handleRw5FileSelect(e));

    const fbkInput = document.getElementById('file-fbk-import');
    if (fbkInput) fbkInput.addEventListener('change', e => this.handleFbkFileSelect(e));
  }

  showToast(message, durationMs = 3400) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, durationMs);
  }

  runMagnetAutoLines() {
    if (!window.cadEngine) return;
    const count = window.cadEngine.buildLineworkFromCurrentPoints();
    this.showToast(`MAGNET Field codes parsed → ${count} Civil 3D linework figures built!`);
  }

  handleDxfFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = window.dxfManager.parseDxf(event.target.result);
      if (parsed.points.length > 0 || parsed.linework.length > 0) {
        parsed.points.forEach(p => window.pointManager.addPoint(p));
        parsed.linework.forEach(l => window.cadEngine.linework.push(l));

        window.cadEngine.save();
        window.cadEngine.fitExtents();
        window.cadEngine.render();
        this.renderPointsTable();

        const msg = `Imported Civil 3D DXF (${file.name}): ${parsed.linework.length} linework entities, ${parsed.points.length} points.`;
        this.showToast(msg);
        if (window.aimChat) window.aimChat.postSystemUpdate(`📥 ${msg}`);
        if (window.soundFX) window.soundFX.playShotBeep();
      } else {
        this.showToast("Could not detect 2D line or point entities in DXF file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  handleCsvFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = window.dxfManager.parseCsv(event.target.result);
      if (parsed.length > 0) {
        parsed.forEach(p => window.pointManager.addPoint(p));
        this.renderPointsTable();
        if (window.cadEngine) {
          window.cadEngine.fitExtents();
          window.cadEngine.render();
        }
        const msg = `Imported ${parsed.length} PNEZD points from ${file.name}.`;
        this.showToast(msg);
        if (window.aimChat) window.aimChat.postSystemUpdate(`📥 ${msg}`);
        if (window.soundFX) window.soundFX.playShotBeep();
      } else {
        this.showToast("No valid coordinate rows found. Ensure P,N,E,Z,D format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  handleRw5FileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = window.dxfManager.parseMagnetRaw(event.target.result);
      if (parsed.points.length > 0) {
        parsed.points.forEach(p => window.pointManager.addPoint(p));
        const linesBuilt = window.cadEngine ? window.cadEngine.buildLineworkFromCurrentPoints() : 0;
        this.renderPointsTable();
        if (window.cadEngine) {
          window.cadEngine.fitExtents();
          window.cadEngine.render();
        }
        const msg = `Imported MAGNET Field ${file.name}: ${parsed.points.length} shots (${linesBuilt} Civil 3D figures updated).`;
        this.showToast(msg);
        if (window.aimChat) window.aimChat.postSystemUpdate(`📥 ${msg}`);
        if (window.soundFX) window.soundFX.playShotBeep();
      } else {
        this.showToast("No valid KP/SP/GPS records found in .RW5/.RAW file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  handleFbkFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = window.dxfManager.parseCivil3dFbk(event.target.result);
      if (parsed.points.length > 0 || parsed.linework.length > 0) {
        parsed.points.forEach(p => window.pointManager.addPoint(p));
        parsed.linework.forEach(l => window.cadEngine.linework.push(l));
        window.cadEngine.save();
        this.renderPointsTable();
        if (window.cadEngine) {
          window.cadEngine.fitExtents();
          window.cadEngine.render();
        }
        const msg = `Imported Civil 3D .FBK (${file.name}): ${parsed.points.length} pts, ${parsed.linework.length} figures.`;
        this.showToast(msg);
        if (window.aimChat) window.aimChat.postSystemUpdate(`📥 ${msg}`);
        if (window.soundFX) window.soundFX.playShotBeep();
      } else {
        this.showToast("No valid CR NEZ / NEZ / BEG records found in .FBK file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

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
        <td class="text-sm">${(p.hr || 5.0).toFixed(2)}'</td>
        <td>
          <button class="btn btn-xs btn-outline-info" onclick="window.cadEngine.zoomToPoint(${p.id}); window.app.switchTab('cad');" title="Zoom on Canvas">🔍</button>
          <button class="btn btn-xs btn-outline-primary" onclick="window.aimChat.sendPointToChat(${p.id}); window.app.switchTab('aim');" title="Send to AIM">💬</button>
          <button class="btn btn-xs btn-outline-danger" onclick="window.app.deletePoint(${p.id})" title="Delete Point">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  deletePoint(id) {
    if (confirm(`Delete survey point #${id}?`)) {
      window.pointManager.deletePoint(id);
    }
  }

  promptTakeRtkShot() {
    const rtk = window.pointManager ? window.pointManager.rtkStatus : { curN: 10245.8, curE: 10185.35, curZ: 688.15 };
    this.openQuickShotModal(rtk.curN, rtk.curE, rtk.curZ, 'rtk');
  }

  // Sleek Touch-Friendly MAGNET Field Code & Quick Shot Modal
  openQuickShotModal(northing, easting, elevation, source = 'rtk') {
    const root = document.getElementById('modal-root');
    if (!root) return;

    const p = this.equipmentProfile;
    const defaultRod = p.sensorMode === 'ROBOTIC_TS' ? 5.000 : p.rodHeight;
    const quickCodes = [
      'IP FND', 'IP SET', 'CP', 'BM',
      'CL1 B', 'CL1', 'CL1 E',
      'EP1 B', 'EP1', 'EP1 E',
      'BLDG1 B', 'BLDG1', 'BLDG1 E', 'FFE',
      'WM', 'WV', 'FH', 'MH SAN', 'CB STM',
      'FENCE B', 'FENCE E', 'TREE'
    ];

    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) window.app.closeModal()">
        <div class="survey-modal-card">
          <div class="survey-modal-header">
            <div>
              <h3>🎯 ${source === 'canvas' ? 'Store Canvas Point' : 'Store MAGNET Field Shot'}</h3>
              <span class="text-xs text-muted">${p.tablet} • ${p.software} • ${p.sensorMode === 'ROBOTIC_TS' ? p.totalStation : p.gps}</span>
            </div>
            <button class="btn-close" onclick="window.app.closeModal()">×</button>
          </div>

          <div class="shot-coords-banner">
            <span>N: <b>${Number(northing).toFixed(3)}</b></span>
            <span>E: <b>${Number(easting).toFixed(3)}</b></span>
            <span>Z: <b>${Number(elevation).toFixed(3)}'</b></span>
          </div>

          <div class="shot-quick-codes">
            <label class="modal-label">MAGNET Field Quick Codes (Tap to fill):</label>
            <div class="quick-code-grid">
              ${quickCodes.map(c => `
                <button type="button" class="quick-code-chip" onclick="document.getElementById('qs-code').value='${c}'; document.querySelectorAll('.quick-code-chip').forEach(b=>b.classList.remove('active')); this.classList.add('active');">${c}</button>
              `).join('')}
            </div>
          </div>

          <div class="modal-form-grid">
            <div>
              <label class="modal-label">Feature Code</label>
              <input type="text" id="qs-code" class="modal-input" value="TOPO" placeholder="e.g. EP1 B, IP FND, MH SAN">
            </div>
            <div>
              <label class="modal-label">Rod / Prism Height (ft)</label>
              <input type="number" step="0.001" id="qs-rod" class="modal-input" value="${Number(defaultRod).toFixed(3)}">
            </div>
          </div>

          <div style="margin-top:8px;">
            <label class="modal-label">Civil 3D Raw Description / Notes</label>
            <input type="text" id="qs-desc" class="modal-input" value="${source === 'canvas' ? 'Canvas Digitized Point' : (p.sensorMode === 'ROBOTIC_TS' ? 'Sokkia/Topcon Robotic Prism Shot' : 'Topcon/Sokkia RTK Fixed Shot')}">
          </div>

          <label class="modal-checkbox-row">
            <input type="checkbox" id="qs-send-aim" checked>
            <span>Also send point badge to Civil 3D Office in AIM Chat</span>
          </label>

          <div class="survey-modal-footer">
            <button class="btn btn-sm btn-secondary" onclick="window.app.closeModal()">Cancel</button>
            <button class="btn btn-sm btn-success" onclick="window.app.submitQuickShot(${Number(northing)}, ${Number(easting)}, ${Number(elevation)}, '${source}')">
              ✅ Store Shot
            </button>
          </div>
        </div>
      </div>
    `;
  }

  submitQuickShot(northing, easting, elevation, source) {
    const code = (document.getElementById('qs-code')?.value || 'TOPO').trim().toUpperCase();
    const rod = parseFloat(document.getElementById('qs-rod')?.value) || this.equipmentProfile.rodHeight;
    const desc = (document.getElementById('qs-desc')?.value || '').trim();
    const sendAim = !!document.getElementById('qs-send-aim')?.checked;

    const pt = source === 'canvas'
      ? window.pointManager.addPoint({ northing, easting, elevation, code, desc, hr: rod })
      : window.pointManager.takeRtkShot(code, desc, rod);

    this.closeModal();
    this.renderPointsTable();
    if (window.cadEngine) window.cadEngine.render();

    if (sendAim && window.aimChat) {
      window.aimChat.sendPointToChat(pt.id);
    }
    this.showToast(`Stored PT #${pt.id} [${pt.code}] @ N:${pt.northing.toFixed(2)} E:${pt.easting.toFixed(2)}`);
  }

  // Modal for Coworkers to Download Android, iPhone, and PC Packages
  openDownloadModal() {
    const root = document.getElementById('modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) window.app.closeModal()">
        <div class="survey-modal-card" style="max-width: 620px;">
          <div class="survey-modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="assets/logo.png" alt="Logo" class="modal-brand-logo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-primary); box-shadow: 0 0 8px rgba(56,189,248,0.3);">
              <div>
                <h3>📥 Download GeoSurvey Testing Packages</h3>
                <span class="text-xs text-muted">Fully functioning standalone apps and software for coworkers to download &amp; test</span>
              </div>
            </div>
            <button class="btn-close" onclick="window.app.closeModal()">×</button>
          </div>

          <!-- All-in-One Master Bundle -->
          <div style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%); border: 1.5px solid #0284c7; border-radius: 8px; padding: 12px; margin-top: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 20px;">📦</span>
                <b style="color: #ffffff; font-size: 14px;">All-in-One Complete Suite Bundle</b>
                <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 10px;">11.3 MB .ZIP</span>
              </div>
              <div class="text-xs text-muted" style="margin-top: 4px;">
                Contains all 3 platforms in separate folders (Android, iPhone, Civil 3D Desktop) + launchers &amp; test files.
              </div>
            </div>
            <a href="downloads/GeoSurvey-Complete-Suite-All-Platforms.zip" download="GeoSurvey-Complete-Suite-All-Platforms.zip" class="btn btn-sm btn-primary" style="font-weight: 700; white-space: nowrap;">
              ⬇️ Download All (.zip)
            </a>
          </div>

          <div class="download-package-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
            <!-- 1. Android App Package -->
            <div class="download-card" style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="padding-right: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 18px;">🤖</span>
                  <b style="color: #22c55e;">Android App</b>
                  <span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #22c55e; font-size: 10px;">Topcon FC-6000</span>
                </div>
                <div class="text-xs text-muted" style="margin-top: 4px;">
                  3/4 canvas, 1/4 AIM chat, RTK HUD, and digital field book.
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <a href="downloads/GeoSurvey-Android-Standalone.html" download="GeoSurvey-Android-Standalone.html" class="btn btn-xs btn-outline-success" title="Self-contained single-file offline app">
                  📄 App File (.html)
                </a>
                <a href="downloads/GeoSurvey-Android-App.zip" download="GeoSurvey-Android-App.zip" class="btn btn-xs btn-success" style="font-weight: 700;">
                  ⬇️ Package (.zip)
                </a>
              </div>
            </div>

            <!-- 2. iPhone App Package -->
            <div class="download-card" style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="padding-right: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 18px;">🍎</span>
                  <b style="color: #38bdf8;">iPhone App</b>
                  <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 10px;">iPhone 16 Pro</span>
                </div>
                <div class="text-xs text-muted" style="margin-top: 4px;">
                  Dynamic Island RTK status, Cupertino tabs, and touch zoom.
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <a href="downloads/GeoSurvey-Pro-iOS.mobileconfig" download="GeoSurvey-Pro-iOS.mobileconfig" class="btn btn-xs btn-outline-primary" title="1-Tap install to iPhone home screen">
                  📲 1-Tap iOS Profile
                </a>
                <a href="downloads/GeoSurvey-iPhone-App.zip" download="GeoSurvey-iPhone-App.zip" class="btn btn-xs btn-primary" style="font-weight: 700;">
                  ⬇️ Package (.zip)
                </a>
              </div>
            </div>

            <!-- 3. Computer Program Package -->
            <div class="download-card" style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="padding-right: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 18px;">🖥️</span>
                  <b style="color: #f59e0b;">Computer Program (Civil 3D)</b>
                  <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 10px;">Windows &amp; Mac</span>
                </div>
                <div class="text-xs text-muted" style="margin-top: 4px;">
                  Civil 3D ribbon, command prompt, 3/4 drafting, 1/4 AIM field link.
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <a href="downloads/GeoSurvey-Civil3D-Workstation.hta" download="GeoSurvey-Civil3D-Workstation.hta" class="btn btn-xs btn-outline-warning" title="Native Windows Application Window">
                  💻 Windows App (.hta)
                </a>
                <a href="downloads/GeoSurvey-Computer-Program.zip" download="GeoSurvey-Computer-Program.zip" class="btn btn-xs btn-warning" style="font-weight: 700; color: #0b0f19;">
                  ⬇️ Package (.zip)
                </a>
              </div>
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
            <a href="downloads.html" class="text-xs" style="color: #38bdf8; text-decoration: none; font-weight: 600;">🌐 Open Full Download Center Portal &rarr;</a>
            <button class="btn btn-xs btn-outline-light" onclick="window.app.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  // App Install Prompt (PWA / iOS WebClip / Native HTA)
  promptAppInstall() {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      this.deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.showToast('GeoSurvey Pro installed successfully!');
        }
        this.deferredInstallPrompt = null;
      });
      return;
    }

    const root = document.getElementById('modal-root');
    if (!root) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || this.deviceMode === 'iphone';
    const isAndroid = /android/i.test(navigator.userAgent) || this.deviceMode === 'phone';

    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) window.app.closeModal()">
        <div class="survey-modal-card" style="max-width: 520px;">
          <div class="survey-modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="assets/logo.png" alt="Logo" class="modal-brand-logo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-primary); box-shadow: 0 0 8px rgba(56,189,248,0.3);">
              <div>
                <h3>📲 Install GeoSurvey Pro</h3>
                <span class="text-xs text-muted">${isIos ? 'Apple iPhone / iOS Installation' : (isAndroid ? 'Android Phone / FC-6000 Tablet Installation' : 'Desktop / PC Installation')}</span>
              </div>
            </div>
            <button class="btn-close" onclick="window.app.closeModal()">×</button>
          </div>

          <div style="margin-top: 14px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
            ${isIos ? `
              <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <b style="color: #38bdf8; font-size: 14px;">Method 1: Direct 1-Tap iOS Profile</b><br>
                Install directly onto your iPhone home screen with the JSI Kissimmee logo icon:
                <div style="margin-top: 8px;">
                  <a href="downloads/GeoSurvey-Pro-iOS.mobileconfig" download="GeoSurvey-Pro-iOS.mobileconfig" class="btn btn-sm btn-primary" style="font-weight: 700;">
                    📲 Download iOS Profile (.mobileconfig)
                  </a>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                  After downloading: Open iOS <b>Settings</b> &rarr; tap <b>Profile Downloaded</b> &rarr; tap <b>Install</b>.
                </div>
              </div>

              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px;">
                <b style="color: #ffffff; font-size: 14px;">Method 2: Safari Add to Home Screen</b><br>
                1. Tap the <b>Share</b> button (<span style="font-size: 14px;">⎋</span> square with arrow up) in Safari.<br>
                2. Scroll down and tap <b>Add to Home Screen</b> (<span style="font-size: 14px;">⊕</span>).<br>
                3. Tap <b>Add</b> in the top right corner.
              </div>
            ` : (isAndroid ? `
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <b style="color: #22c55e; font-size: 14px;">Method 1: Chrome App Install</b><br>
                1. In Chrome on Android, tap the top menu (<b>&vellip;</b>).<br>
                2. Tap <b>Install app</b> or <b>Add to Home screen</b>.<br>
                3. The JSI Kissimmee app icon will be installed directly to your home screen!
              </div>

              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px;">
                <b style="color: #ffffff; font-size: 14px;">Method 2: Standalone Offline App</b><br>
                Download the single-file offline app file to run anytime with 0 data/WiFi needed:
                <div style="margin-top: 8px;">
                  <a href="downloads/GeoSurvey-Android-Standalone.html" download="GeoSurvey-Android-Standalone.html" class="btn btn-sm btn-success" style="font-weight: 700;">
                    ⬇️ Download Standalone App (.html)
                  </a>
                </div>
              </div>
            ` : `
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <b style="color: #f59e0b; font-size: 14px;">Windows Native Software Window (.hta)</b><br>
                Double-click the HTA executable to run as a standalone Windows application window with no browser URL bar or tabs:
                <div style="margin-top: 8px;">
                  <a href="downloads/GeoSurvey-Civil3D-Workstation.hta" download="GeoSurvey-Civil3D-Workstation.hta" class="btn btn-sm btn-warning" style="font-weight: 700; color: #0b0f19;">
                    💻 Download Windows App (.hta)
                  </a>
                </div>
              </div>

              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 12px;">
                <b style="color: #ffffff; font-size: 14px;">Standalone Single-File Software (.html)</b><br>
                Double-click to run immediately on any PC or Mac workstation:
                <div style="margin-top: 8px;">
                  <a href="downloads/GeoSurvey-Civil3D-Standalone.html" download="GeoSurvey-Civil3D-Standalone.html" class="btn btn-sm btn-outline-light" style="font-weight: 700;">
                    ⬇️ Download Standalone Software (.html)
                  </a>
                </div>
              </div>
            `)}
          </div>

          <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <a href="downloads.html" class="text-xs" style="color: #38bdf8; text-decoration: none;">📦 Open Full Download Center &rarr;</a>
            <button class="btn btn-xs btn-outline-light" onclick="window.app.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  // Topcon / Sokkia / MAGNET Field / Civil 3D Kit Config Modal
  openEquipmentModal() {
    const root = document.getElementById('modal-root');
    if (!root) return;
    const p = this.equipmentProfile;

    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) window.app.closeModal()">
        <div class="survey-modal-card">
          <div class="survey-modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="assets/logo.png" alt="Logo" class="modal-brand-logo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-primary); box-shadow: 0 0 8px rgba(56,189,248,0.3);">
              <div>
                <h3>⚙️ Topcon / Sokkia & Civil 3D Kit</h3>
                <span class="text-xs text-muted">Configure your field tablet, GNSS receiver, robotic total station & Civil 3D target</span>
              </div>
            </div>
            <button class="btn-close" onclick="window.app.closeModal()">×</button>
          </div>

          <div class="preset-btn-row">
            <button type="button" class="btn btn-xs btn-outline-warning" onclick="window.app.applyPresetInModal('topcon')">🟡 Topcon Full Kit (FC-6000 + HiPer VR)</button>
            <button type="button" class="btn btn-xs btn-outline-primary" onclick="window.app.applyPresetInModal('sokkia')">🔵 Sokkia Full Kit (SHC6000 + GRX3 + iX-1200)</button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="window.app.applyPresetInModal('mixed')">⚡ Mixed Topcon / Sokkia</button>
          </div>

          <div class="modal-form-grid">
            <div>
              <label class="modal-label">Rugged Field Tablet</label>
              <select id="eq-tablet" class="modal-input">
                <option ${p.tablet === 'Topcon FC-6000' ? 'selected' : ''}>Topcon FC-6000</option>
                <option ${p.tablet === 'Topcon FC-6400' ? 'selected' : ''}>Topcon FC-6400</option>
                <option ${p.tablet === 'Sokkia SHC6000' ? 'selected' : ''}>Sokkia SHC6000</option>
                <option ${p.tablet === 'Sokkia SHC6400' ? 'selected' : ''}>Sokkia SHC6400</option>
              </select>
            </div>
            <div>
              <label class="modal-label">Field Software</label>
              <select id="eq-software" class="modal-input">
                <option ${p.software === 'MAGNET Field v8.2' ? 'selected' : ''}>MAGNET Field v8.2</option>
                <option ${p.software === 'MAGNET Field v8.0' ? 'selected' : ''}>MAGNET Field v8.0</option>
                <option ${p.software === 'MAGNET Field v7.5' ? 'selected' : ''}>MAGNET Field v7.5</option>
              </select>
            </div>
            <div>
              <label class="modal-label">GPS / GNSS Receiver</label>
              <select id="eq-gps" class="modal-input">
                <option ${p.gps === 'Topcon HiPer VR' ? 'selected' : ''}>Topcon HiPer VR</option>
                <option ${p.gps === 'Topcon HiPer HR' ? 'selected' : ''}>Topcon HiPer HR</option>
                <option ${p.gps === 'Sokkia GRX3' ? 'selected' : ''}>Sokkia GRX3</option>
                <option ${p.gps === 'Sokkia GCX3' ? 'selected' : ''}>Sokkia GCX3</option>
              </select>
            </div>
            <div>
              <label class="modal-label">Robotic Total Station</label>
              <select id="eq-ts" class="modal-input">
                <option ${p.totalStation === 'Sokkia iX-1200' ? 'selected' : ''}>Sokkia iX-1200</option>
                <option ${p.totalStation === 'Topcon GT-1200' ? 'selected' : ''}>Topcon GT-1200</option>
                <option ${p.totalStation === 'Sokkia iX-1000' ? 'selected' : ''}>Sokkia iX-1000</option>
                <option ${p.totalStation === 'Topcon GT-600' ? 'selected' : ''}>Topcon GT-600</option>
              </select>
            </div>
            <div>
              <label class="modal-label">Active Field Sensor Mode</label>
              <select id="eq-mode" class="modal-input">
                <option value="GNSS_RTK" ${p.sensorMode === 'GNSS_RTK' ? 'selected' : ''}>🛰️ GNSS RTK Rover (VRS / Base)</option>
                <option value="ROBOTIC_TS" ${p.sensorMode === 'ROBOTIC_TS' ? 'selected' : ''}>🔭 Robotic Total Station (Prism)</option>
              </select>
            </div>
            <div>
              <label class="modal-label">RTK Correction Network</label>
              <select id="eq-network" class="modal-input">
                <option ${p.network === 'TopNET Live VRS' ? 'selected' : ''}>TopNET Live VRS</option>
                <option ${p.network === 'TxDOT VRS NTRIP' ? 'selected' : ''}>TxDOT VRS NTRIP</option>
                <option ${p.network === 'Base/Rover UHF 450MHz' ? 'selected' : ''}>Base/Rover UHF 450MHz</option>
                <option ${p.network === 'LongLink BT 915MHz' ? 'selected' : ''}>LongLink BT 915MHz</option>
              </select>
            </div>
            <div>
              <label class="modal-label">Default Rod Height (ft)</label>
              <input type="number" step="0.001" id="eq-rod" class="modal-input" value="${Number(p.rodHeight).toFixed(3)}">
            </div>
            <div>
              <label class="modal-label">Office CAD Platform</label>
              <select id="eq-cad" class="modal-input">
                <option ${p.cadOffice === 'Autodesk Civil 3D 2026' ? 'selected' : ''}>Autodesk Civil 3D 2026</option>
                <option ${p.cadOffice === 'Autodesk Civil 3D 2025' ? 'selected' : ''}>Autodesk Civil 3D 2025</option>
                <option ${p.cadOffice === 'Autodesk Civil 3D 2024' ? 'selected' : ''}>Autodesk Civil 3D 2024</option>
              </select>
            </div>
          </div>

          <div class="survey-modal-footer">
            <button class="btn btn-sm btn-secondary" onclick="window.app.closeModal()">Cancel</button>
            <button class="btn btn-sm btn-primary" onclick="window.app.saveEquipmentFromModal()">💾 Apply Hardware Profile</button>
          </div>
        </div>
      </div>
    `;
  }

  applyPresetInModal(preset) {
    const tablet = document.getElementById('eq-tablet');
    const gps = document.getElementById('eq-gps');
    const ts = document.getElementById('eq-ts');
    const net = document.getElementById('eq-network');
    if (!tablet || !gps || !ts) return;

    if (preset === 'topcon') {
      tablet.value = 'Topcon FC-6000';
      gps.value = 'Topcon HiPer VR';
      ts.value = 'Topcon GT-1200';
      if (net) net.value = 'TopNET Live VRS';
    } else if (preset === 'sokkia') {
      tablet.value = 'Sokkia SHC6000';
      gps.value = 'Sokkia GRX3';
      ts.value = 'Sokkia iX-1200';
      if (net) net.value = 'TopNET Live VRS';
    } else {
      tablet.value = 'Topcon FC-6000';
      gps.value = 'Topcon HiPer VR';
      ts.value = 'Sokkia iX-1200';
    }
  }

  saveEquipmentFromModal() {
    this.equipmentProfile = {
      ...this.equipmentProfile,
      tablet: document.getElementById('eq-tablet')?.value || this.equipmentProfile.tablet,
      software: document.getElementById('eq-software')?.value || this.equipmentProfile.software,
      gps: document.getElementById('eq-gps')?.value || this.equipmentProfile.gps,
      totalStation: document.getElementById('eq-ts')?.value || this.equipmentProfile.totalStation,
      sensorMode: document.getElementById('eq-mode')?.value || 'GNSS_RTK',
      network: document.getElementById('eq-network')?.value || this.equipmentProfile.network,
      rodHeight: parseFloat(document.getElementById('eq-rod')?.value) || 6.562,
      cadOffice: document.getElementById('eq-cad')?.value || 'Autodesk Civil 3D 2026'
    };

    this.saveEquipmentProfile();
    this.applyEquipmentProfileUI();
    this.syncActiveJobHeader();
    if (this.currentTab === 'fieldbook' && window.fieldBook) window.fieldBook.renderFieldBook();
    this.closeModal();
    if (window.soundFX) window.soundFX.playShotBeep();
    this.showToast(`Active kit: ${this.equipmentProfile.tablet} + ${this.equipmentProfile.software}`);
  }

  closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  }

  updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.android-clock').forEach(el => el.textContent = timeStr);
  }

  // Unified Topcon / Sokkia GNSS & Robotic TS HUD live readout
  startGnssHudTick() {
    const statusEl = document.getElementById('hud-status');
    const pdopEl = document.getElementById('hud-pdop');
    const satsEl = document.getElementById('hud-sats');
    const hrmsEl = document.getElementById('hud-hrms');
    const vrmsEl = document.getElementById('hud-vrms');
    const networkEl = document.getElementById('hud-network');
    const linkEl = document.getElementById('hud-link');
    const statusBadge = document.getElementById('status-gnss-badge');

    const updateHud = () => {
      const rtk = window.pointManager ? window.pointManager.rtkStatus : null;
      const isTS = this.equipmentProfile.sensorMode === 'ROBOTIC_TS';

      const pdop = rtk ? rtk.pdop.toFixed(2) : '1.05';
      const sats = rtk ? rtk.satellites : 24;
      const hrms = rtk ? rtk.hrms.toFixed(3) : '0.011';
      const vrms = rtk ? rtk.vrms.toFixed(3) : '0.019';

      const isFixed = isTS || (Math.random() > 0.05);
      const statusTxt = isTS ? 'PRISM LOCKED' : (isFixed ? 'RTK FIXED' : 'RTK FLOAT');

      if (statusEl) {
        statusEl.textContent = statusTxt;
        statusEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`;
      }
      if (statusBadge) {
        statusBadge.textContent = `● ${statusTxt} (${hrms}')`;
      }
      if (pdopEl) pdopEl.textContent = isTS ? '0.0"' : pdop;
      if (satsEl) satsEl.textContent = isTS ? 'TS' : String(sats);
      if (hrmsEl) {
        hrmsEl.textContent = `${hrms} ft`;
        hrmsEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`;
      }
      if (vrmsEl) {
        vrmsEl.textContent = `${vrms} ft`;
        vrmsEl.className = `gnss-value ${isFixed ? 'gnss-fixed' : 'gnss-float'}`;
      }
      if (networkEl) networkEl.style.opacity = (Math.random() > 0.12) ? '1' : '0.68';
      if (linkEl) {
        linkEl.textContent = isTS ? 'LongLink Radio ✔' : (isFixed ? 'LongLink BT ✔' : 'LongLink BT…');
      }
    };

    updateHud();
    setInterval(updateHud, 2500);
  }
}

window.app = new SurveyApp();
