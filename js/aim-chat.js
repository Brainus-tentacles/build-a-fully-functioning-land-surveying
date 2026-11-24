// Authentic AOL Instant Messenger (AIM) Live Chat Engine
// Links Civil 3D Office CAD Operators and Topcon/Sokkia MAGNET Field Crew in Real-Time
class AimChat {
  constructor() {
    this.currentUser = {
      screenName: "TopconCrew_Mike",
      alias: "Mike (Party Chief - Topcon FC-6000)",
      role: "field",
      status: "online",
      statusMsg: "MAGNET Field v8.2 Running on Topcon FC-6000 • HiPer VR Fixed",
      warningLevel: 0
    };

    this.buddies = [];
    this.messages = [];
    this.activeBuddy = "Civil3D_Dave";
    this.broadcastChannel = null;

    // Formatting state
    this.isBold = false;
    this.isItalic = false;
    this.isUnderline = false;
    this.textColor = "#000000";
    this.fontSize = "normal";

    this.initBroadcast();
  }

  _migrateName(name) {
    if (name === "AutoCAD_Dave") return "Civil3D_Dave";
    if (name === "FieldCrew1_Mike") return "TopconCrew_Mike";
    if (name === "SurveyBot") return "MagnetBot";
    return name;
  }

  init(initialData) {
    const savedBuddies = localStorage.getItem('survey_aim_buddies');
    const savedMessages = localStorage.getItem('survey_aim_messages');
    const savedUser = localStorage.getItem('survey_aim_current_user');

    if (savedBuddies) {
      try {
        this.buddies = JSON.parse(savedBuddies);
      } catch (e) {
        this.buddies = initialData.buddies ? [...initialData.buddies] : [];
      }
    } else {
      this.buddies = initialData.buddies ? [...initialData.buddies] : [];
    }

    // Migrate legacy screen names and ensure required buddies exist
    const needsReset = this.buddies.some(b =>
      b.screenName === "AutoCAD_Dave" || b.screenName === "SurveyBot" || b.screenName === "FieldCrew1_Mike"
    );
    if (needsReset && initialData.buddies) {
      this.buddies = [...initialData.buddies];
    } else if (initialData.buddies) {
      initialData.buddies.forEach(initB => {
        if (!this.buddies.some(b => b.screenName === initB.screenName)) {
          this.buddies.push({ ...initB });
        }
      });
    }

    if (savedMessages) {
      try {
        this.messages = JSON.parse(savedMessages).map(m => ({
          ...m,
          from: this._migrateName(m.from),
          to: this._migrateName(m.to)
        }));
      } catch (e) {
        this.messages = initialData.messages ? [...initialData.messages] : [];
      }
    } else {
      this.messages = initialData.messages ? [...initialData.messages] : [];
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.screenName = this._migrateName(parsedUser.screenName);
        if (parsedUser.screenName === "TopconCrew_Mike" && parsedUser.alias.includes("Rover 1")) {
          parsedUser.alias = "Mike (Party Chief - Topcon FC-6000)";
        } else if (parsedUser.screenName === "Civil3D_Dave" && parsedUser.alias.includes("Senior CAD Drafter")) {
          parsedUser.alias = "Dave (Senior Civil 3D Drafter)";
        }
        this.currentUser = parsedUser;
      } catch (e) {
        if (initialData.currentUser) this.currentUser = { ...initialData.currentUser };
      }
    } else if (initialData.currentUser) {
      this.currentUser = { ...initialData.currentUser };
    }

    this.activeBuddy = this.currentUser.role === 'cad' ? "TopconCrew_Mike" : "Civil3D_Dave";
    this.save();
    this.renderAim();

    window.addEventListener('storage', (e) => {
      if (e.key === 'survey_aim_last_msg' && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          this.handleIncomingExternalMessage(msg);
        } catch (err) {}
      }
    });
  }

  initBroadcast() {
    if (window.BroadcastChannel) {
      this.broadcastChannel = new BroadcastChannel('survey_aim_channel');
      this.broadcastChannel.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'CHAT_MESSAGE') {
          this.handleIncomingExternalMessage(ev.data.payload);
        }
      };
    }
  }

  handleIncomingExternalMessage(msg) {
    if (!msg || msg.from === this.currentUser.screenName) return;
    this.messages.push(msg);
    localStorage.setItem('survey_aim_messages', JSON.stringify(this.messages));

    if (window.soundFX) window.soundFX.playImChime();
    this.renderConversation();
    this.updateBuddyBadge(msg.from);
  }

  save() {
    localStorage.setItem('survey_aim_buddies', JSON.stringify(this.buddies));
    localStorage.setItem('survey_aim_messages', JSON.stringify(this.messages));
    localStorage.setItem('survey_aim_current_user', JSON.stringify(this.currentUser));
  }

  // Switch identity between Topcon/Sokkia Field Crew and Civil 3D CAD Operator
  switchUserRole(role) {
    const equip = (window.app && window.app.equipmentProfile) ? window.app.equipmentProfile : null;
    const tabletLabel = equip ? equip.tablet : "Topcon FC-6000";
    const gpsLabel = equip ? equip.gps : "Topcon HiPer VR";

    if (role === 'field') {
      this.currentUser = {
        screenName: "TopconCrew_Mike",
        alias: `Mike (Party Chief - ${tabletLabel})`,
        role: "field",
        status: "online",
        statusMsg: `MAGNET Field v8.2 on ${tabletLabel} • ${gpsLabel} Fixed`,
        warningLevel: 0
      };
      this.activeBuddy = "Civil3D_Dave";
    } else {
      this.currentUser = {
        screenName: "Civil3D_Dave",
        alias: "Dave (Senior Civil 3D Drafter)",
        role: "cad",
        status: "online",
        statusMsg: "Civil 3D 2026 Survey Database Open — Send MAGNET .RW5!",
        warningLevel: 0
      };
      this.activeBuddy = "TopconCrew_Mike";
    }

    this.save();
    if (window.soundFX) window.soundFX.playDoorOpen();
    this.renderAim();
  }

  setActiveBuddy(screenName) {
    this.activeBuddy = screenName;
    const buddy = this.buddies.find(b => b.screenName === screenName);
    if (buddy) buddy.unread = 0;
    this.save();
    this.renderAim();
  }

  updateBuddyBadge(screenName) {
    if (this.activeBuddy !== screenName) {
      const b = this.buddies.find(buddy => buddy.screenName === screenName);
      if (b) b.unread = (b.unread || 0) + 1;
      this.save();
      this.renderBuddyList();
    }
  }

  sendMessage(text, customHtml = null) {
    if (!text && !customHtml) return;

    let formattedText = text;
    if (!customHtml) {
      if (this.isBold) formattedText = `<b>${formattedText}</b>`;
      if (this.isItalic) formattedText = `<i>${formattedText}</i>`;
      if (this.isUnderline) formattedText = `<u>${formattedText}</u>`;
      if (this.textColor !== "#000000") {
        formattedText = `<span style="color: ${this.textColor}">${formattedText}</span>`;
      }
    } else {
      formattedText = customHtml;
    }

    const newMsg = {
      id: "msg-" + Date.now(),
      from: this.currentUser.screenName,
      to: this.activeBuddy,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: formattedText
    };

    this.messages.push(newMsg);
    this.save();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'CHAT_MESSAGE', payload: newMsg });
    }
    localStorage.setItem('survey_aim_last_msg', JSON.stringify(newMsg));

    if (window.soundFX) window.soundFX.playImSend();
    this.renderConversation();

    this.checkAutoReply(text);
  }

  promptSetAway() {
    const msg = prompt("Enter your Custom Away Message:", this.currentUser.statusMsg || "Away: Running Topcon HiPer VR static check");
    if (msg !== null) {
      this.currentUser.statusMsg = msg.trim() || "Away";
      this.currentUser.status = "away";
      this.save();
      this.renderAim();
      if (window.soundFX) window.soundFX.playDoorOpen();
      this.postSystemUpdate(`${this.currentUser.alias} set Away Message: "${this.currentUser.statusMsg}"`);
    }
  }

  showTypingIndicator(screenName) {
    const log = document.getElementById('aim-message-log');
    if (!log) return;

    let el = document.getElementById('aim-typing-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aim-typing-indicator';
      el.className = 'aim-typing-row';
      log.appendChild(el);
    }
    el.innerHTML = `<i>⌨️ ${screenName} is typing...</i>`;
    log.scrollTop = log.scrollHeight;

    if (this._typingTimeout) clearTimeout(this._typingTimeout);
    this._typingTimeout = setTimeout(() => {
      const existing = document.getElementById('aim-typing-indicator');
      if (existing) existing.remove();
    }, 2000);
  }

  // Automated realistic Topcon / Sokkia / MAGNET Field / Civil 3D responses
  checkAutoReply(userText) {
    const buddy = this._getResolvedActiveBuddy();
    if (!buddy || buddy.screenName === this.currentUser.screenName) return;

    setTimeout(() => {
      this.showTypingIndicator(buddy.screenName);
    }, 550);

    setTimeout(() => {
      let replyText = "";
      const lower = (userText || "").toLowerCase();
      const equip = (window.app && window.app.equipmentProfile) ? window.app.equipmentProfile : {
        tablet: "Topcon FC-6000",
        gps: "Topcon HiPer VR",
        totalStation: "Sokkia iX-1200",
        network: "TopNET Live VRS"
      };

      if (buddy.screenName === "MagnetBot") {
        if (lower.includes("closure") || lower.includes("traverse") || lower.includes("error")) {
          replyText = "🤖 MagnetBot QC: Traverse loop adjusted via Compass Rule. Linear error: 0.014 ft (1:28,400 — Class A Passed). Ready to push to Civil 3D Survey DB.";
        } else if (lower.includes("rw5") || lower.includes("fbk") || lower.includes("dxf")) {
          replyText = "🤖 MagnetBot Sync: MAGNET Field .RW5 observations translated cleanly to Civil 3D .FBK Survey Figures (V-PROP-LINE, V-ROAD-CNTR, V-ROAD-CURB, V-BLDG).";
        } else if (lower.includes("point") || lower.includes("shot") || lower.includes("bm")) {
          replyText = `🤖 MagnetBot: Point stored via ${equip.software || 'MAGNET Field v8.2'} (${equip.gps} • ${equip.network}). Coordinates match NAD83 Texas Central / NAVD88.`;
        } else {
          const cnt = window.pointManager ? window.pointManager.getAll().length : 36;
          replyText = `🤖 MagnetBot: ${cnt} points verified in MAGNET Field DB. Feature codes CL1, EP1, BLDG1, FENCE mapped to Civil 3D layers.`;
        }
      } else if ((buddy.screenName === "Civil3D_Dave" || buddy.screenName === "Civil3D_Sarah") && this.currentUser.role === "field") {
        if (lower.includes("rw5") || lower.includes("fbk") || lower.includes("file") || lower.includes("export")) {
          replyText = "Got your MAGNET Field data! Importing the .FBK into Civil 3D 2026 Survey Database right now — survey figures are snapping to V-PROP-LINE and V-ROAD-CURB.";
        } else if (lower.includes("corner") || lower.includes("pin") || lower.includes("sw")) {
          replyText = "Nice recovery Mike! Point #10 dropped right onto the 1984 record plat corner in Civil 3D. Keep shooting the lot corners and fence ties.";
        } else if (lower.includes("water") || lower.includes("meter") || lower.includes("sewer")) {
          replyText = "Utility ties received! Updating V-UTIL-WATR and V-UTIL-SSWR pipes in Civil 3D Pipe Network now.";
        } else if (lower.includes("invert") || lower.includes("manhole") || lower.includes("mh")) {
          replyText = "Invert 675.30' logged in Civil 3D structure properties on SAN MH-1. Rim-to-invert fall (9.20') matches record plan.";
        } else if (lower.includes("linework") || lower.includes("dxf")) {
          replyText = "Linework overlay came through cleanly! Civil 3D Figure Prefix DB matched your MAGNET Field codes.";
        } else {
          replyText = "Copy that from Civil 3D Office! Updating the Survey Database and checklist now — keep those MAGNET Field shots coming.";
        }
      } else if (buddy.screenName === "TopconCrew_Mike" && this.currentUser.role === "cad") {
        replyText = `Copy that Civil 3D Office! ${equip.tablet} running MAGNET Field v8.2 with ${equip.gps} (${equip.network} Fixed) & ${equip.totalStation} ready on CP1. Moving to next shot.`;
      } else if (buddy.screenName === "Office_PM_Frank") {
        replyText = "Thanks for the update! Let me know once the Civil 3D .FBK and RPLS boundary check are ready for final sign-off.";
      }

      if (replyText) {
        const botMsg = {
          id: "bot-" + Date.now(),
          from: buddy.screenName,
          to: this.currentUser.screenName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: replyText
        };
        this.messages.push(botMsg);
        this.save();
        if (window.soundFX) window.soundFX.playImChime();
        this.renderConversation();
      }
    }, 1400);
  }

  sendPointToChat(pointId) {
    const pt = window.pointManager ? window.pointManager.getById(pointId) : null;
    if (!pt) {
      if (window.app && window.app.showToast) window.app.showToast(`Point #${pointId} not found.`);
      return;
    }

    const html = `
      <div class="chat-point-badge" onclick="window.cadEngine.zoomToPoint(${pt.id}); window.app.switchTab('cad');">
        <span class="badge-tag">📍 MAGNET POINT #${pt.id}</span>
        <b>${pt.code}</b> (${pt.desc || 'Shot'})
        <div class="badge-coords">N: ${pt.northing.toFixed(2)} | E: ${pt.easting.toFixed(2)} | Elev: ${pt.elevation.toFixed(2)}' | HR: ${(pt.hr || 5.0).toFixed(2)}'</div>
        <span class="badge-link">🔍 Click to zoom Survey Canvas</span>
      </div>
    `;

    this.sendMessage(`Sent Point #${pt.id} (${pt.code})`, html);
  }

  sendInverseToChat(bearing, horizDist, deltaZ) {
    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">📐 INVERSE CALCULATION (COGO)</span>
        <div>Bearing: <b class="text-accent">${bearing}</b></div>
        <div>Horiz Dist: <b>${horizDist} ft</b> | ΔZ: <b>${deltaZ} ft</b></div>
      </div>
    `;
    this.sendMessage(`Inverse: ${bearing} ${horizDist}'`, html);
  }

  sendLineworkSummary() {
    const lines = window.cadEngine ? window.cadEngine.linework : [];
    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">📐 MAGNET → CIVIL 3D LINEWORK OVERLAY</span>
        <div>Total Figures: <b>${lines.length}</b></div>
        <div>Civil 3D Layers: <b>V-PROP-LINE, V-ROAD-CNTR, V-ROAD-CURB, V-BLDG, V-UTIL-WATR</b></div>
        <span class="badge-link" onclick="window.app.switchTab('cad')">🔍 View on Linework Canvas</span>
      </div>
    `;
    this.sendMessage(`Shared Civil 3D Linework (${lines.length} figures)`, html);
  }

  // Send an interactive downloadable Civil 3D .FBK or MAGNET Field .RW5 packet directly in AIM Chat
  sendSurveyFilePacket(format) {
    if (!window.dxfManager) return;
    if (format === 'fbk') {
      const res = window.dxfManager.generateCivil3dFbkContent();
      const html = `
        <div class="chat-cogo-badge" style="border-color:#f59e0b; background:#fffbeb;">
          <span class="badge-tag" style="color:#b45309;">📤 CIVIL 3D FIELD BOOK (.FBK)</span>
          <div><b>${res.filename}</b></div>
          <div class="badge-coords">${res.pointCount} Points • ${res.figureCount} Civil 3D Survey Figures</div>
          <span class="badge-link" style="cursor:pointer; color:#b45309; font-weight:bold;" onclick="window.dxfManager.exportCivil3dFbk('${res.filename}')">📥 Download ${res.filename} for Civil 3D</span>
        </div>
      `;
      this.sendMessage(`Sent Civil 3D Field Book ${res.filename} (${res.pointCount} pts, ${res.figureCount} figures)`, html);
    } else {
      const res = window.dxfManager.generateMagnetRawContent();
      const html = `
        <div class="chat-point-badge" style="border-color:#0284c7; background:#f0f9ff;">
          <span class="badge-tag" style="color:#0369a1;">📤 MAGNET FIELD RAW (.RW5)</span>
          <div><b>${res.filename}</b></div>
          <div class="badge-coords">${res.pointCount} Points • Topcon/Sokkia MAGNET Field v8.2</div>
          <span class="badge-link" style="cursor:pointer; font-weight:bold;" onclick="window.dxfManager.exportMagnetRaw('${res.filename}')">📥 Download ${res.filename} for MAGNET / Civil 3D</span>
        </div>
      `;
      this.sendMessage(`Sent MAGNET Field raw file ${res.filename} (${res.pointCount} pts)`, html);
    }
  }

  requestShotFromCrew(feature) {
    const text = `⚠️ CIVIL 3D REQUEST: Please shoot ${feature || 'Boundary Pin / Utility Invert'} in MAGNET Field with rod height & description.`;
    this.sendMessage(text);
  }

  postSystemUpdate(announcement) {
    const sysMsg = {
      id: "sys-" + Date.now(),
      from: "MagnetBot",
      to: this.currentUser.screenName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📢 <b>${announcement}</b>`
    };
    this.messages.push(sysMsg);
    this.save();
    this.renderConversation();
  }

  // Alias kept for compatibility with any caller calling postSystemMessage
  postSystemMessage(announcement) {
    return this.postSystemUpdate(announcement);
  }

  warnBuddy(screenName) {
    const buddy = this.buddies.find(b => b.screenName === screenName);
    if (!buddy) return;

    buddy.warningLevel = (buddy.warningLevel || 0) + 5;
    if (window.soundFX) window.soundFX.playWarningBeep();
    this.save();
    this.renderAim();

    this.sendMessage(`[SYSTEM ALERT] User was WARNED! Warning level increased to ${buddy.warningLevel}%.`);
  }

  _getResolvedActiveBuddy() {
    return this.buddies.find(b => b.screenName === this.activeBuddy)
      || this.buddies.find(b => b.screenName !== this.currentUser.screenName)
      || this.buddies[0];
  }

  renderAim() {
    const container = document.getElementById('aim-container');
    if (!container) return;

    const buddy = this._getResolvedActiveBuddy();
    if (!buddy) return;

    container.innerHTML = `
      <div class="aim-window-frame">
        <!-- AIM Window Title Bar -->
        <div class="aim-title-bar">
          <div class="aim-title-left">
            <span class="aim-running-man">🏃</span>
            <span class="aim-title-text">AIM Field↔Civil 3D Link - ${buddy.alias}</span>
          </div>
          <div class="aim-window-controls">
            <button class="aim-win-btn" title="Minimize">_</button>
            <button class="aim-win-btn" title="Maximize">□</button>
            <button class="aim-win-btn close" title="Close">✕</button>
          </div>
        </div>

        <!-- AIM Identity Switcher Bar -->
        <div class="aim-identity-bar">
          <div class="aim-my-profile">
            <span class="status-dot status-${this.currentUser.status}"></span>
            <span>You: <b>${this.currentUser.alias}</b></span>
            <button class="btn btn-xs btn-outline-secondary" onclick="window.aimChat.promptSetAway()" title="Set Away Message">Away</button>
          </div>
          <div class="aim-role-switch">
            <span>Role:</span>
            <button class="btn btn-xs ${this.currentUser.role === 'field' ? 'btn-warning active' : 'btn-outline-warning'}" onclick="window.aimChat.switchUserRole('field')">
              👷 Field Chief
            </button>
            <button class="btn btn-xs ${this.currentUser.role === 'cad' ? 'btn-primary active' : 'btn-outline-primary'}" onclick="window.aimChat.switchUserRole('cad')">
              🖥️ Civil 3D CAD
            </button>
          </div>
        </div>

        <!-- Main AIM Splitter: Buddy List on Left / Conversation on Right -->
        <div class="aim-body-split">
          <!-- BUDDY LIST PANE -->
          <div class="aim-buddy-pane" id="aim-buddy-list">
            ${this.getBuddyListHTML()}
          </div>

          <!-- DIRECT IM CHAT WINDOW -->
          <div class="aim-chat-pane">
            <!-- Buddy Profile & Warning Bar -->
            <div class="aim-chat-header">
              <div class="aim-buddy-info">
                <span class="buddy-name">${buddy.alias}</span>
                <span class="buddy-sub"><span class="status-dot status-${buddy.status}"></span> ${buddy.statusMsg || 'Available'}</span>
              </div>
              <div class="aim-warn-section">
                <span class="warn-label">Warn: ${buddy.warningLevel || 0}%</span>
                <button class="aim-warn-btn" onclick="window.aimChat.warnBuddy('${buddy.screenName}')">Warn</button>
              </div>
            </div>

            <!-- Quick Survey Actions Bar -->
            <div class="aim-survey-toolbar">
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.requestShotFromCrew('SW Lot Boundary Corner')">
                🎯 Req Shot
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.promptSendPoint()">
                📍 Send Pt
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendLineworkSummary()">
                📏 Linework
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendSurveyFilePacket('rw5')" title="Send Topcon/Sokkia MAGNET Field .RW5 in Chat">
                📤 .RW5
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendSurveyFilePacket('fbk')" title="Send Autodesk Civil 3D .FBK in Chat">
                📤 .FBK
              </button>
            </div>

            <!-- Chat History Log -->
            <div class="aim-msg-log" id="aim-message-log">
              ${this.getConversationHTML(buddy)}
            </div>

            <!-- AIM Rich Formatting Toolbar -->
            <div class="aim-format-toolbar">
              <button class="fmt-btn ${this.isBold ? 'active' : ''}" onclick="window.aimChat.toggleFormat('bold')" title="Bold"><b>B</b></button>
              <button class="fmt-btn ${this.isItalic ? 'active' : ''}" onclick="window.aimChat.toggleFormat('italic')" title="Italic"><i>I</i></button>
              <button class="fmt-btn ${this.isUnderline ? 'active' : ''}" onclick="window.aimChat.toggleFormat('underline')" title="Underline"><u>U</u></button>
              <select class="fmt-select" onchange="window.aimChat.setFontColor(this.value)">
                <option value="#000000">Black</option>
                <option value="#0000ff">Blue</option>
                <option value="#ff0000">Red</option>
                <option value="#008000">Green</option>
                <option value="#800080">Purple</option>
              </select>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-)')">😊</button>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-P')">😜</button>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon('B-)')">😎</button>
            </div>

            <!-- Input Box & Send Bar -->
            <div class="aim-input-box">
              <textarea id="aim-text-input" placeholder="Message Civil 3D Office / MAGNET Field crew... (Enter to Send)" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); window.aimChat.handleSend(); }"></textarea>
              <div class="aim-send-row">
                <span class="aim-tip">⚡ MAGNET Field ↔ Civil 3D Live BroadcastChannel</span>
                <button class="aim-send-btn" onclick="window.aimChat.handleSend()">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.scrollToBottom();
  }

  getBuddyListHTML() {
    const cadBuddies = this.buddies.filter(b => b.role === 'cad' || b.role === 'office');
    const fieldBuddies = this.buddies.filter(b => b.role === 'field');
    const bots = this.buddies.filter(b => b.role === 'bot');

    return `
      <div class="buddy-group-title">▼ Civil 3D Office</div>
      ${cadBuddies.map(b => this.renderBuddyItem(b)).join('')}

      <div class="buddy-group-title mt-2">▼ Topcon/Sokkia Field</div>
      ${fieldBuddies.map(b => this.renderBuddyItem(b)).join('')}

      <div class="buddy-group-title mt-2">▼ MAGNET Sync & QC</div>
      ${bots.map(b => this.renderBuddyItem(b)).join('')}
    `;
  }

  renderBuddyItem(b) {
    const isCurrent = this.currentUser.screenName === b.screenName;
    const isActive = this.activeBuddy === b.screenName;

    return `
      <div class="buddy-item ${isActive ? 'active' : ''} ${isCurrent ? 'is-self' : ''}" onclick="window.aimChat.setActiveBuddy('${b.screenName}')">
        <span class="status-dot status-${b.status}"></span>
        <div class="buddy-text">
          <div class="buddy-screenname">${b.alias} ${isCurrent ? '(You)' : ''}</div>
          <div class="buddy-status-quote">${b.statusMsg || 'Online'}</div>
        </div>
        ${b.unread ? `<span class="unread-pill">${b.unread}</span>` : ''}
      </div>
    `;
  }

  getConversationHTML(buddy) {
    const relevant = this.messages.filter(m => {
      if (buddy.screenName === "MagnetBot" || buddy.screenName === "SurveyBot") {
        return m.from === "MagnetBot" || m.from === "SurveyBot" || m.to === "MagnetBot" || m.to === "SurveyBot";
      }
      return (m.from === buddy.screenName && m.to === this.currentUser.screenName) ||
        (m.from === this.currentUser.screenName && m.to === buddy.screenName) ||
        (m.from === "MagnetBot") ||
        (m.from === "SurveyBot");
    });

    if (relevant.length === 0) {
      return `
        <div class="aim-conversation-empty">
          <span>Started AIM session with <b>${buddy.alias}</b>.</span>
          <p class="text-xs text-muted">Links Civil 3D Office & Topcon/Sokkia MAGNET Field Crew.</p>
        </div>
      `;
    }

    return relevant.map(m => {
      const isMe = m.from === this.currentUser.screenName;
      const isBot = m.from === "MagnetBot" || m.from === "SurveyBot";
      return `
        <div class="aim-msg-row ${isMe ? 'msg-me' : isBot ? 'msg-bot' : 'msg-them'}">
          <div class="msg-meta">
            <span class="msg-author">${isMe ? this.currentUser.screenName : m.from}:</span>
            <span class="msg-timestamp">${m.time}</span>
          </div>
          <div class="msg-bubble">
            ${m.text}
          </div>
        </div>
      `;
    }).join('');
  }

  handleSend() {
    const input = document.getElementById('aim-text-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
      this.sendMessage(val);
      input.value = "";
    }
  }

  toggleFormat(type) {
    if (type === 'bold') this.isBold = !this.isBold;
    if (type === 'italic') this.isItalic = !this.isItalic;
    if (type === 'underline') this.isUnderline = !this.isUnderline;
    this.renderAim();
  }

  setFontColor(color) {
    this.textColor = color;
  }

  insertEmoticon(emo) {
    const input = document.getElementById('aim-text-input');
    if (input) {
      input.value += " " + emo + " ";
      input.focus();
    }
  }

  promptSendPoint() {
    const id = prompt("Enter Survey Point ID to send to Civil 3D Office (e.g. 10):", "10");
    if (id) {
      this.sendPointToChat(Number(id));
    }
  }

  promptRequestLinework() {
    const feat = prompt("Enter Civil 3D linework to request (e.g. Lot 14 Boundary):", "Lot 14 Property Boundary");
    if (feat) {
      this.sendMessage(`📏 Requesting Civil 3D linework overlay for: ${feat}. Please send DXF/FBK export.`);
    }
  }

  renderConversation() {
    const buddy = this._getResolvedActiveBuddy();
    const log = document.getElementById('aim-message-log');
    if (log && buddy) {
      log.innerHTML = this.getConversationHTML(buddy);
      this.scrollToBottom();
    }
    this.renderBuddyList();
  }

  renderBuddyList() {
    const list = document.getElementById('aim-buddy-list');
    if (list) {
      list.innerHTML = this.getBuddyListHTML();
    }
  }

  scrollToBottom() {
    const log = document.getElementById('aim-message-log');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }
}

window.AimChat = AimChat;
window.aimChat = new AimChat();
