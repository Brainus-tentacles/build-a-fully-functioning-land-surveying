// Authentic AOL Instant Messenger (AIM) Live Chat Engine - 2-Person Direct IM Edition
// Links Civil 3D Office CAD Operators and Topcon/Sokkia MAGNET Field Crew in Real-Time
// Strictly restricted to a 1-on-1 direct conversation between two people at a time.
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

    // Ensure contacts exist
    if (initialData && initialData.buddies) {
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
        if (initialData && initialData.currentUser) this.currentUser = { ...initialData.currentUser };
      }
    } else if (initialData && initialData.currentUser) {
      this.currentUser = { ...initialData.currentUser };
    }

    // Set 2-person partner based on role
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
      this.broadcastChannel = new window.BroadcastChannel('survey_aim_channel');
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

    // Only chime and update if this message is between the two active people
    if (msg.from === this.activeBuddy && msg.to === this.currentUser.screenName) {
      if (window.soundFX) window.soundFX.playImChime();
      this.renderConversation();
    }
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

  // Quick swap between Field Chief (Mike) and Civil 3D Drafter (Dave)
  toggleUserRole() {
    if (this.currentUser.role === 'field') {
      this.switchUserRole('cad');
    } else {
      this.switchUserRole('field');
    }
  }

  // Set the 2nd person in the 2-person session
  setActiveBuddy(screenName) {
    if (screenName === this.currentUser.screenName) return;
    this.activeBuddy = screenName;
    const buddy = this.buddies.find(b => b.screenName === screenName);
    if (buddy) buddy.unread = 0;
    this.save();
    this.renderAim();
  }

  _getResolvedActiveBuddy() {
    const eligible = this.getEligiblePartners();
    let b = eligible.find(p => p.screenName === this.activeBuddy);
    if (!b) b = eligible[0] || this.buddies[0];
    return b;
  }

  // Return persons eligible to be the 2nd party (human survey staff only)
  getEligiblePartners() {
    return this.buddies.filter(b =>
      b.screenName !== this.currentUser.screenName &&
      b.role !== 'bot'
    );
  }

  updateBuddyBadge(screenName) {
    if (this.activeBuddy !== screenName) {
      const b = this.buddies.find(buddy => buddy.screenName === screenName);
      if (b) b.unread = (b.unread || 0) + 1;
      this.save();
    }
  }

  // Send message strictly from Person 1 (currentUser) to Person 2 (activeBuddy)
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
    el.innerHTML = `<i>⌨️ ${screenName.split('_')[0]} is typing...</i>`;
    log.scrollTop = log.scrollHeight;

    if (this._typingTimeout) clearTimeout(this._typingTimeout);
    this._typingTimeout = setTimeout(() => {
      const existing = document.getElementById('aim-typing-indicator');
      if (existing) existing.remove();
    }, 2000);
  }

  // Automated realistic response strictly from Person 2 (partner) back to Person 1
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

      if ((buddy.screenName === "Civil3D_Dave" || buddy.screenName === "Civil3D_Sarah") && this.currentUser.role === "field") {
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
          replyText = "Copy that Mike! Updating Civil 3D Survey Database now — keep those MAGNET Field shots coming.";
        }
      } else if (buddy.screenName === "TopconCrew_Mike" && this.currentUser.role === "cad") {
        replyText = `Copy that Dave! ${equip.tablet} running MAGNET Field v8.2 with ${equip.gps} (${equip.network} Fixed) & ${equip.totalStation} ready on CP1. Moving to next shot.`;
      } else if (buddy.screenName === "Office_PM_Frank") {
        replyText = "Thanks for the update! Let me know once the Civil 3D .FBK and RPLS boundary check are ready for final sign-off.";
      } else {
        replyText = "Copy that from field! Synchronized in Civil 3D.";
      }

      if (replyText) {
        const botMsg = {
          id: "msg-" + Date.now(),
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
        <span class="badge-tag">📐 MAGNET → CIVIL 3D LINEWORK</span>
        <div>Total Figures: <b>${lines.length}</b></div>
        <div>Civil 3D Layers: <b>V-PROP-LINE, V-ROAD-CNTR, V-ROAD-CURB, V-BLDG, V-UTIL-WATR</b></div>
        <span class="badge-link" onclick="window.app.switchTab('cad')">🔍 View on Linework Canvas</span>
      </div>
    `;
    this.sendMessage(`Shared Civil 3D Linework (${lines.length} figures)`, html);
  }

  sendSurveyFilePacket(format) {
    if (!window.dxfManager) return;
    if (format === 'fbk') {
      const res = window.dxfManager.generateCivil3dFbkContent();
      const html = `
        <div class="chat-cogo-badge" style="border-color:#f59e0b; background:#fffbeb;">
          <span class="badge-tag" style="color:#b45309;">📤 CIVIL 3D FIELD BOOK (.FBK)</span>
          <div><b>${res.filename}</b></div>
          <div class="badge-coords">${res.pointCount} Points • ${res.figureCount} Civil 3D Figures</div>
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
      from: this.activeBuddy,
      to: this.currentUser.screenName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📢 <b>${announcement}</b>`
    };
    this.messages.push(sysMsg);
    this.save();
    this.renderConversation();
  }

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

  // Strictly 2-Person Conversation Filtering: only messages between Person A and Person B
  getConversationHTML(buddy) {
    const userA = this.currentUser.screenName;
    const userB = buddy.screenName;

    const relevant = this.messages.filter(m => {
      return (m.from === userA && m.to === userB) ||
             (m.from === userB && m.to === userA);
    });

    if (relevant.length === 0) {
      return `
        <div class="aim-conversation-empty">
          <div class="aim-2p-intro-badge">
            <span class="badge-title">🔒 Direct 2-Person Private IM</span>
            <div class="badge-users"><b>${this.currentUser.alias.split(' ')[0]}</b> ↔ <b>${buddy.alias.split(' ')[0]}</b></div>
          </div>
          <p class="text-xs text-muted" style="margin-top: 8px;">
            1-on-1 link between Topcon/Sokkia Field Chief &amp; Civil 3D Office.<br>
            Send coordinates, shot requests, or linework.
          </p>
        </div>
      `;
    }

    return relevant.map(m => {
      const isMe = m.from === this.currentUser.screenName;
      const authorShort = isMe ? this.currentUser.alias.split(' ')[0] : buddy.alias.split(' ')[0];
      return `
        <div class="aim-msg-row ${isMe ? 'msg-me' : 'msg-them'}">
          <div class="msg-meta">
            <span class="msg-author">${authorShort}:</span>
            <span class="msg-timestamp">${m.time}</span>
          </div>
          <div class="msg-bubble">
            ${m.text}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render the Dedicated 2-Person Instant Message Window for the 1/4 Screen
  renderAim() {
    const container = document.getElementById('aim-container');
    if (!container) return;

    const buddy = this._getResolvedActiveBuddy();
    if (!buddy) return;

    const eligiblePartners = this.getEligiblePartners();
    const myShort = this.currentUser.alias.split(' ')[0];
    const partnerShort = buddy.alias.split(' ')[0];

    container.innerHTML = `
      <div class="aim-window-frame">
        <!-- AIM Window Title Bar -->
        <div class="aim-title-bar">
          <div class="aim-title-left">
            <span class="aim-running-man">🏃</span>
            <span class="aim-title-text">IM: ${myShort} ↔ ${partnerShort}</span>
          </div>
          <div class="aim-window-controls">
            <span class="aim-badge-2p" title="Strictly 2-Person Direct Conversation">🔒 2-Person</span>
            <button class="aim-win-btn" title="Minimize">_</button>
            <button class="aim-win-btn" title="Maximize">□</button>
          </div>
        </div>

        <!-- 2-Person Direct Session Bar (Swap role or switch partner) -->
        <div class="aim-2p-session-bar">
          <div class="aim-2p-pair">
            <div class="aim-party-pill me" title="You: ${this.currentUser.alias}">
              <span class="status-dot status-${this.currentUser.status}"></span>
              <span>You: <b>${myShort}</b></span>
              <button class="btn-swap-role" onclick="window.aimChat.toggleUserRole()" title="Swap between Field Chief & CAD Drafter">⇄</button>
            </div>
            <span class="aim-arrow" style="font-weight: bold; color: #0055ea;">↔</span>
            <div class="aim-party-pill them" title="Conversing with (1 person at a time)">
              <span class="status-dot status-${buddy.status}"></span>
              <select id="aim-partner-select" class="partner-dropdown" onchange="window.aimChat.setActiveBuddy(this.value)" title="Choose conversation partner (strictly 2 people at a time)">
                ${eligiblePartners.map(p => `
                  <option value="${p.screenName}" ${p.screenName === buddy.screenName ? 'selected' : ''}>
                    ${p.alias.split(' ')[0]} (${p.role === 'cad' ? 'CAD' : p.role === 'field' ? 'Field' : 'PM'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Quick Survey Actions (Compact) -->
        <div class="aim-survey-toolbar compact">
          <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.requestShotFromCrew('SW Lot Boundary Corner')" title="Request Survey Shot">
            🎯 Req Shot
          </button>
          <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.promptSendPoint()" title="Send Point Coordinates">
            📍 Send Pt
          </button>
          <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendLineworkSummary()" title="Send Linework Summary">
            📏 Lines
          </button>
          <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendSurveyFilePacket('rw5')" title="Send MAGNET .RW5 Raw File">
            📤 .RW5
          </button>
          <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendSurveyFilePacket('fbk')" title="Send Civil 3D .FBK File">
            📤 .FBK
          </button>
        </div>

        <!-- Direct 2-Person Chat Log -->
        <div class="aim-msg-log" id="aim-message-log">
          ${this.getConversationHTML(buddy)}
        </div>

        <!-- AIM Formatting Toolbar (Compact) -->
        <div class="aim-format-toolbar compact">
          <button class="fmt-btn ${this.isBold ? 'active' : ''}" onclick="window.aimChat.toggleFormat('bold')" title="Bold"><b>B</b></button>
          <button class="fmt-btn ${this.isItalic ? 'active' : ''}" onclick="window.aimChat.toggleFormat('italic')" title="Italic"><i>I</i></button>
          <button class="fmt-btn ${this.isUnderline ? 'active' : ''}" onclick="window.aimChat.toggleFormat('underline')" title="Underline"><u>U</u></button>
          <select class="fmt-select" onchange="window.aimChat.setFontColor(this.value)" title="Text Color">
            <option value="#000000">Black</option>
            <option value="#0000ff">Blue</option>
            <option value="#ff0000">Red</option>
            <option value="#008000">Green</option>
          </select>
          <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-)')">😊</button>
          <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-P')">😜</button>
          <button class="fmt-btn" onclick="window.aimChat.insertEmoticon('B-)')">😎</button>
        </div>

        <!-- Input Box & Send Bar -->
        <div class="aim-input-box">
          <textarea id="aim-text-input" placeholder="Direct IM to ${partnerShort}... (Enter to send)" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); window.aimChat.handleSend(); }"></textarea>
          <div class="aim-send-row">
            <span class="aim-tip">🔒 Direct 2-Person Link</span>
            <button class="aim-send-btn" onclick="window.aimChat.handleSend()">Send</button>
          </div>
        </div>
      </div>
    `;

    this.scrollToBottom();
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
    const id = prompt("Enter Survey Point ID to send to partner (e.g. 10):", "10");
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
  }

  // Kept for backward compatibility
  renderBuddyList() {}

  scrollToBottom() {
    const log = document.getElementById('aim-message-log');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }
}

window.AimChat = AimChat;
window.aimChat = new AimChat();
