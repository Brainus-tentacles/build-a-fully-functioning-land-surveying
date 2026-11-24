// Authentic AOL Instant Messenger (AIM) Live Chat Engine
// Links CAD Operators and Field Crew in Real-Time
class AimChat {
  constructor() {
    this.currentUser = {
      screenName: "FieldCrew1_Mike",
      alias: "Mike (Party Chief - Rover 1)",
      role: "field",
      status: "online",
      statusMsg: "On site @ Oak Ridge Estates - GPS Fixed",
      warningLevel: 0
    };

    this.buddies = [];
    this.messages = [];
    this.activeBuddy = "AutoCAD_Dave";
    this.broadcastChannel = null;

    // Formatting state
    this.isBold = false;
    this.isItalic = false;
    this.isUnderline = false;
    this.textColor = "#000000";
    this.fontSize = "normal"; // small, normal, large

    this.initBroadcast();
  }

  init(initialData) {
    const savedBuddies = localStorage.getItem('survey_aim_buddies');
    const savedMessages = localStorage.getItem('survey_aim_messages');
    const savedUser = localStorage.getItem('survey_aim_current_user');

    if (savedBuddies) {
      try { this.buddies = JSON.parse(savedBuddies); } catch (e) { this.buddies = initialData.buddies; }
    } else {
      this.buddies = initialData.buddies ? [...initialData.buddies] : [];
    }

    if (savedMessages) {
      try { this.messages = JSON.parse(savedMessages); } catch (e) { this.messages = initialData.messages; }
    } else {
      this.messages = initialData.messages ? [...initialData.messages] : [];
    }

    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) { this.currentUser = initialData.currentUser; }
    } else if (initialData.currentUser) {
      this.currentUser = initialData.currentUser;
    }

    this.renderAim();

    // Storage event listener for multi-tab fallback
    window.addEventListener('storage', (e) => {
      if (e.key === 'survey_aim_last_msg') {
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

    window.soundFX.playImChime();
    this.renderConversation();
    this.updateBuddyBadge(msg.from);
  }

  save() {
    localStorage.setItem('survey_aim_buddies', JSON.stringify(this.buddies));
    localStorage.setItem('survey_aim_messages', JSON.stringify(this.messages));
    localStorage.setItem('survey_aim_current_user', JSON.stringify(this.currentUser));
  }

  // Switch identity between Field Crew and CAD Operator
  switchUserRole(role) {
    if (role === 'field') {
      this.currentUser = {
        screenName: "FieldCrew1_Mike",
        alias: "Mike (Party Chief - Rover 1)",
        role: "field",
        status: "online",
        statusMsg: "On site @ Oak Ridge Estates - GPS Fixed",
        warningLevel: 0
      };
      this.activeBuddy = "AutoCAD_Dave";
    } else {
      this.currentUser = {
        screenName: "AutoCAD_Dave",
        alias: "Dave (Senior CAD Drafter)",
        role: "cad",
        status: "online",
        statusMsg: "Drafting Civil 3D Lot 14 - Send shots!",
        warningLevel: 0
      };
      this.activeBuddy = "FieldCrew1_Mike";
    }

    this.save();
    window.soundFX.playDoorOpen();
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

    // Broadcast to other tabs / devices
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'CHAT_MESSAGE', payload: newMsg });
    }
    localStorage.setItem('survey_aim_last_msg', JSON.stringify(newMsg));

    window.soundFX.playImSend();
    this.renderConversation();

    // If talking to a bot or standalone simulation, reply automatically
    this.checkAutoReply(text);
  }

  promptSetAway() {
    const msg = prompt("Enter your Custom Away Message:", this.currentUser.statusMsg || "Away: Cutting traverse line");
    if (msg !== null) {
      this.currentUser.statusMsg = msg.trim() || "Away";
      this.currentUser.status = "away";
      this.save();
      this.renderAim();
      window.soundFX.playDoorOpen();
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

  // Automated realistic survey bot & CAD responses when running single-player
  checkAutoReply(userText) {
    const buddy = this.buddies.find(b => b.screenName === this.activeBuddy);
    if (!buddy) return;

    // Show typing indicator after a slight delay
    setTimeout(() => {
      this.showTypingIndicator(buddy.screenName);
    }, 600);

    setTimeout(() => {
      let replyText = "";
      const lower = (userText || "").toLowerCase();

      if (buddy.screenName === "SurveyBot") {
        if (lower.includes("closure") || lower.includes("traverse") || lower.includes("error")) {
          replyText = "🤖 SurveyBot Analysis: Traverse loop computed. Linear error: 0.014 ft. Precision Ratio: 1:28,400. Specification standard: Class A Boundary (< 1:10,000). STATUS: PASSED.";
        } else if (lower.includes("point") || lower.includes("shot") || lower.includes("bm")) {
          replyText = "🤖 SurveyBot: Stored Point confirmed in project database. Elevation check matches NAVD88 benchmark datum.";
        } else {
          replyText = "🤖 SurveyBot: All 42 survey shots verified. Feature codes EP1, CL1, and BLDG1 ready for field-to-finish CAD generation.";
        }
      } else if (buddy.screenName === "AutoCAD_Dave" && this.currentUser.role === "field") {
        if (lower.includes("corner") || lower.includes("pin") || lower.includes("sw")) {
          replyText = "Great find Mike! I see Point #10 on the CAD canvas. The boundary lot line is snapping perfectly to your measured coordinates.";
        } else if (lower.includes("water") || lower.includes("meter") || lower.includes("sewer")) {
          replyText = "Thanks for the utility ties. I drafted the 8\" water main and sewer linework in Civil 3D. Ready for the next segment!";
        } else if (lower.includes("invert") || lower.includes("manhole") || lower.includes("mh")) {
          replyText = "Invert elevation 675.30' noted on SAN MH-1. Rim-to-invert fall is 9.20 ft. That matches the 1984 city utility records.";
        } else {
          replyText = "Got that! I'm updating the CAD linework and checklist right now. Keep the shots coming!";
        }
      } else if (buddy.screenName === "FieldCrew1_Mike" && this.currentUser.role === "cad") {
        replyText = "Copy that office! Rover 1 is on station with Trimble R12i GNSS Fixed. Moving to stake the next point now.";
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
        window.soundFX.playImChime();
        this.renderConversation();
      }
    }, 1600);
  }

  // Quick action: Send survey point coordinate badge to chat
  sendPointToChat(pointId) {
    const pt = window.pointManager ? window.pointManager.getById(pointId) : null;
    if (!pt) return;

    const html = `
      <div class="chat-point-badge" onclick="window.cadEngine.zoomToPoint(${pt.id})">
        <span class="badge-tag">📍 SURVEY POINT #${pt.id}</span>
        <b>${pt.code}</b> (${pt.desc || 'Shot'})
        <div class="badge-coords">N: ${pt.northing.toFixed(2)} | E: ${pt.easting.toFixed(2)} | Elev: ${pt.elevation.toFixed(2)}'</div>
        <span class="badge-link">🔍 Click to zoom CAD canvas</span>
      </div>
    `;

    this.sendMessage(`Sent Point #${pt.id} (${pt.code})`, html);
  }

  // Quick action: Send Inverse Calculation to chat
  sendInverseToChat(bearing, horizDist, deltaZ) {
    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">📐 INVERSE CALCULATION</span>
        <div>Bearing: <b class="text-accent">${bearing}</b></div>
        <div>Horiz Dist: <b>${horizDist} ft</b> | ΔZ: <b>${deltaZ} ft</b></div>
      </div>
    `;
    this.sendMessage(`Inverse: ${bearing} ${horizDist}'`, html);
  }

  // Quick action: Send CAD Linework summary to chat
  sendLineworkSummary() {
    const lines = window.cadEngine ? window.cadEngine.linework : [];
    const html = `
      <div class="chat-cogo-badge">
        <span class="badge-tag">📐 CAD LINEWORK OVERLAY</span>
        <div>Total Elements: <b>${lines.length}</b></div>
        <div>Active Layers: <b>BOUNDARY, CENTERLINE, EOP_CURB, UTILITIES</b></div>
        <span class="badge-link" onclick="window.app.switchTab('cad')">🔍 View on CAD Linework Canvas</span>
      </div>
    `;
    this.sendMessage(`Shared CAD Linework (${lines.length} elements)`, html);
  }

  // Quick action: Request shot from field crew
  requestShotFromCrew(feature) {
    const text = `⚠️ CAD REQUEST: Please take shot on ${feature || 'Boundary Pin / Utility Rim'} with rod height and description.`;
    this.sendMessage(text);
  }

  // Post system / checklist update to chat
  postSystemUpdate(announcement) {
    const sysMsg = {
      id: "sys-" + Date.now(),
      from: "SurveyBot",
      to: this.currentUser.screenName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📢 <b>${announcement}</b>`
    };
    this.messages.push(sysMsg);
    this.save();
    this.renderConversation();
  }

  // Classic AIM Warn Button
  warnBuddy(screenName) {
    const buddy = this.buddies.find(b => b.screenName === screenName);
    if (!buddy) return;

    buddy.warningLevel = (buddy.warningLevel || 0) + 5;
    window.soundFX.playWarningBeep();
    this.save();
    this.renderAim();

    this.sendMessage(`[SYSTEM ALERT] User was WARNED! Warning level increased to ${buddy.warningLevel}%.`);
  }

  renderAim() {
    const container = document.getElementById('aim-container');
    if (!container) return;

    const buddy = this.buddies.find(b => b.screenName === this.activeBuddy) || this.buddies[0];

    container.innerHTML = `
      <div class="aim-window-frame">
        <!-- AIM Window Title Bar -->
        <div class="aim-title-bar">
          <div class="aim-title-left">
            <span class="aim-running-man">🏃</span>
            <span class="aim-title-text">AOL Instant Messenger - ${buddy.alias}</span>
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
            <button class="btn btn-xs btn-outline-secondary" onclick="window.aimChat.promptSetAway()" title="Set Away Message">Set Away</button>
          </div>
          <div class="aim-role-switch">
            <span>Switch:</span>
            <button class="btn btn-xs ${this.currentUser.role === 'field' ? 'btn-warning active' : 'btn-outline-warning'}" onclick="window.aimChat.switchUserRole('field')">
              👷 Field Chief
            </button>
            <button class="btn btn-xs ${this.currentUser.role === 'cad' ? 'btn-primary active' : 'btn-outline-primary'}" onclick="window.aimChat.switchUserRole('cad')">
              🖥️ CAD Operator
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
                🎯 Request Shot
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.promptSendPoint()">
                📍 Send Point
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.sendLineworkSummary()">
                📏 Share Linework
              </button>
              <button class="btn btn-xs btn-outline-light" onclick="window.aimChat.promptRequestLinework()">
                📑 Req DXF
              </button>
            </div>

            <!-- Chat History Log -->
            <div class="aim-msg-log" id="aim-message-log">
              ${this.getConversationHTML(buddy)}
            </div>

            <!-- AIM Rich Formatting Toolbar (90s / 2000s Classic) -->
            <div class="aim-format-toolbar">
              <button class="fmt-btn ${this.isBold ? 'active' : ''}" onclick="window.aimChat.toggleFormat('bold')" title="Bold"><b>B</b></button>
              <button class="fmt-btn ${this.isItalic ? 'active' : ''}" onclick="window.aimChat.toggleFormat('italic')" title="Italic"><i>I</i></button>
              <button class="fmt-btn ${this.isUnderline ? 'active' : ''}" onclick="window.aimChat.toggleFormat('underline')" title="Underline"><u>U</u></button>
              <select class="fmt-select" onchange="window.aimChat.setFontColor(this.value)">
                <option value="#000000">Color: Black</option>
                <option value="#0000ff">Color: Blue</option>
                <option value="#ff0000">Color: Red</option>
                <option value="#008000">Color: Green</option>
                <option value="#800080">Color: Purple</option>
              </select>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-)')">😊</button>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon(':-P')">😜</button>
              <button class="fmt-btn" onclick="window.aimChat.insertEmoticon('B-)')">😎</button>
            </div>

            <!-- Input Box & Send Bar -->
            <div class="aim-input-box">
              <textarea id="aim-text-input" placeholder="Type instant message to CAD/Field crew... (Press Enter to Send)" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); window.aimChat.handleSend(); }"></textarea>
              <div class="aim-send-row">
                <span class="aim-tip">⚡ Live sync active via Web BroadcastChannel</span>
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
      <div class="buddy-group-title">▼ CAD Office Drafters</div>
      ${cadBuddies.map(b => this.renderBuddyItem(b)).join('')}

      <div class="buddy-group-title mt-2">▼ Field Survey Crews</div>
      ${fieldBuddies.map(b => this.renderBuddyItem(b)).join('')}

      <div class="buddy-group-title mt-2">▼ Survey Systems & QC</div>
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
    const relevant = this.messages.filter(m =>
      (m.from === buddy.screenName && m.to === this.currentUser.screenName) ||
      (m.from === this.currentUser.screenName && m.to === buddy.screenName) ||
      (m.from === "SurveyBot")
    );

    if (relevant.length === 0) {
      return `
        <div class="aim-conversation-empty">
          <span>Started AIM session with <b>${buddy.alias}</b>.</span>
          <p class="text-xs text-muted">Links CAD Office & Field Crew for coordinates, linework & field notes.</p>
        </div>
      `;
    }

    return relevant.map(m => {
      const isMe = m.from === this.currentUser.screenName;
      const isBot = m.from === "SurveyBot";
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
    const id = prompt("Enter Survey Point ID to send to CAD operator (e.g. 10):", "10");
    if (id) {
      this.sendPointToChat(Number(id));
    }
  }

  promptRequestLinework() {
    const feat = prompt("Enter feature linework to request from CAD (e.g. Lot 14 Boundary or Right-of-Way):", "Lot 14 Property Boundary");
    if (feat) {
      this.sendMessage(`📏 Requesting CAD linework overlay for: ${feat}. Please send DXF export.`);
    }
  }

  renderConversation() {
    const buddy = this.buddies.find(b => b.screenName === this.activeBuddy);
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
