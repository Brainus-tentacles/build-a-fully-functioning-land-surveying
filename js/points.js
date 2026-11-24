// Survey Points and Coordinate Geometry (COGO) Engine
class PointManager {
  constructor() {
    this.points = [];
    this.rtkStatus = {
      active: true,
      solution: "FIXED", // FIXED, FLOAT, DGPS, AUTONOMOUS
      satellites: 21,
      pdop: 1.1,
      hdop: 0.6,
      vdop: 0.9,
      hrms: 0.012, // ft
      vrms: 0.022, // ft
      baseDistance: 1245.8, // ft
      curN: 10245.80,
      curE: 10185.35,
      curZ: 688.15,
      rodHeight: 6.562, // 2.000m = 6.562 ft
      antennaType: "R12i Internal Tilt"
    };
    this.listeners = [];
  }

  init(initialPoints) {
    const saved = localStorage.getItem('survey_points');
    if (saved) {
      try {
        this.points = JSON.parse(saved);
      } catch (e) {
        this.points = initialPoints ? [...initialPoints] : [];
      }
    } else {
      this.points = initialPoints ? [...initialPoints] : [];
    }
    this.startRtkSimulation();
  }

  save() {
    localStorage.setItem('survey_points', JSON.stringify(this.points));
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.points); } catch (e) { console.error(e); }
    });
  }

  getAll() {
    return this.points;
  }

  getById(id) {
    return this.points.find(p => p.id === Number(id) || p.id === String(id));
  }

  getNextId() {
    if (this.points.length === 0) return 1;
    const maxId = Math.max(...this.points.map(p => Number(p.id) || 0));
    return maxId + 1;
  }

  addPoint(point) {
    const p = {
      id: point.id !== undefined && point.id !== null ? Number(point.id) : this.getNextId(),
      northing: parseFloat(Number(point.northing).toFixed(4)),
      easting: parseFloat(Number(point.easting).toFixed(4)),
      elevation: parseFloat(Number(point.elevation).toFixed(4)),
      code: (point.code || "SHOT").toUpperCase().trim(),
      desc: point.desc || "",
      hi: point.hi ? Number(point.hi) : 5.12,
      hr: point.hr ? Number(point.hr) : this.rtkStatus.rodHeight,
      type: point.type || this.detectPointType(point.code),
      time: new Date().toLocaleTimeString(),
      locked: !!point.locked
    };

    // Replace if ID already exists, else push
    const existingIndex = this.points.findIndex(pt => pt.id === p.id);
    if (existingIndex >= 0) {
      this.points[existingIndex] = p;
    } else {
      this.points.push(p);
    }

    this.save();
    window.soundFX.playShotBeep();
    return p;
  }

  updatePoint(id, data) {
    const idx = this.points.findIndex(p => p.id === Number(id));
    if (idx >= 0) {
      this.points[idx] = { ...this.points[idx], ...data };
      this.save();
      return this.points[idx];
    }
    return null;
  }

  deletePoint(id) {
    const idx = this.points.findIndex(p => p.id === Number(id));
    if (idx >= 0) {
      const deleted = this.points.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  detectPointType(code) {
    if (!code) return "TOPO";
    const c = code.toUpperCase();
    if (c.includes("CP") || c.includes("CTRL")) return "CTRL";
    if (c.includes("BM") || c.includes("BENCH")) return "BM";
    if (c.includes("IP") || c.includes("PIN") || c.includes("CORNER") || c.includes("REBAR")) return "BNDY";
    if (c.includes("CL") || c.includes("EP") || c.includes("CURB") || c.includes("ROAD")) return "ROAD";
    if (c.includes("BLDG") || c.includes("HOUSE") || c.includes("FFE")) return "BLDG";
    if (c.includes("MH") || c.includes("CB") || c.includes("WM") || c.includes("WV") || c.includes("FH") || c.includes("UTIL")) return "UTIL";
    return "TOPO";
  }

  // COGO: Inverse calculation between two coordinates (North, East)
  static inverse(n1, e1, n2, e2, z1 = 0, z2 = 0) {
    const dN = n2 - n1;
    const dE = e2 - e1;
    const dZ = z2 - z1;

    const horizDist = Math.hypot(dN, dE);
    const slopeDist = Math.hypot(dN, dE, dZ);

    // Azimuth from North (0° to 360°)
    let azimuthRad = Math.atan2(dE, dN);
    if (azimuthRad < 0) azimuthRad += 2 * Math.PI;
    const azimuthDeg = (azimuthRad * 180) / Math.PI;

    // Quadrant Bearing (N/S, Deg, Min, Sec, E/W)
    const bearing = PointManager.azimuthToBearing(azimuthDeg);

    // Grade percentage
    const grade = horizDist !== 0 ? (dZ / horizDist) * 100 : 0;

    return {
      deltaN: dN,
      deltaE: dE,
      deltaZ: dZ,
      horizDist,
      slopeDist,
      azimuthDeg,
      bearing,
      grade
    };
  }

  // Convert decimal degrees azimuth (0-360) to Quadrant Bearing string
  static azimuthToBearing(azimuthDeg) {
    const az = ((azimuthDeg % 360) + 360) % 360;
    let quad = "";
    let angle = 0;

    if (az >= 0 && az <= 90) {
      quad = "NE";
      angle = az;
    } else if (az > 90 && az <= 180) {
      quad = "SE";
      angle = 180 - az;
    } else if (az > 180 && az <= 270) {
      quad = "SW";
      angle = az - 180;
    } else {
      quad = "NW";
      angle = 360 - az;
    }

    const deg = Math.floor(angle);
    const minDec = (angle - deg) * 60;
    const min = Math.floor(minDec);
    const sec = Math.round((minDec - min) * 60);

    const prefix = quad[0];
    const suffix = quad[1];
    const sMin = min < 10 ? "0" + min : min;
    const sSec = sec < 10 ? "0" + sec : sec;

    return `${prefix} ${deg}° ${sMin}' ${sSec}" ${suffix}`;
  }

  // RTK GNSS Simulator / GPS live update
  startRtkSimulation() {
    if (this._simInterval) clearInterval(this._simInterval);
    this._simInterval = setInterval(() => {
      if (!this.rtkStatus.active) return;
      // Slight wandering noise for realistic RTK jitter (±0.005 ft)
      const jitterN = (Math.random() - 0.5) * 0.010;
      const jitterE = (Math.random() - 0.5) * 0.010;
      const jitterZ = (Math.random() - 0.5) * 0.015;

      this.rtkStatus.curN += jitterN;
      this.rtkStatus.curE += jitterE;
      this.rtkStatus.curZ += jitterZ;

      this.rtkStatus.hrms = 0.009 + Math.random() * 0.006;
      this.rtkStatus.vrms = 0.016 + Math.random() * 0.008;

      const badge = document.getElementById('rtk-hud-coords');
      if (badge) {
        badge.innerHTML = `N: <b>${this.rtkStatus.curN.toFixed(2)}</b> E: <b>${this.rtkStatus.curE.toFixed(2)}</b> Z: <b>${this.rtkStatus.curZ.toFixed(2)}</b>`;
      }
    }, 1500);
  }

  // Trigger real device Geolocation if on phone/browser
  connectDeviceGps(onSuccess, onError) {
    if (!navigator.geolocation) {
      if (onError) onError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        // Approximate conversion from GPS Lat/Long to local survey state plane feet
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const altFt = (pos.coords.altitude || 100) * 3.28084;
        const accuracyFt = pos.coords.accuracy * 3.28084;

        this.rtkStatus.solution = accuracyFt < 10 ? "DGPS/FIXED" : "AUTONOMOUS";
        this.rtkStatus.hrms = accuracyFt;
        this.rtkStatus.satellites = 14;

        if (onSuccess) onSuccess({ lat, lon, altFt, accuracyFt });
      },
      err => {
        if (onError) onError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Rapid shot from RTK Rover
  takeRtkShot(code, desc = "") {
    const pt = this.addPoint({
      northing: this.rtkStatus.curN,
      easting: this.rtkStatus.curE,
      elevation: this.rtkStatus.curZ,
      code: code || "GPS",
      desc: desc || `RTK ${this.rtkStatus.solution} HRMS:${this.rtkStatus.hrms.toFixed(3)}ft`,
      hr: this.rtkStatus.rodHeight
    });
    return pt;
  }

  // Stakeout / Construction Staking Navigation Engine
  getStakeoutDelta(targetPtId) {
    const target = this.getById(targetPtId);
    if (!target) return null;

    const curN = this.rtkStatus.curN;
    const curE = this.rtkStatus.curE;
    const curZ = this.rtkStatus.curZ;

    const dN = target.northing - curN;
    const dE = target.easting - curE;
    const dZ = target.elevation - curZ;

    const horizDist = Math.hypot(dN, dE);
    const inv = PointManager.inverse(curN, curE, target.northing, target.easting, curZ, target.elevation);

    // Human navigation directions
    let dirN = "";
    if (Math.abs(dN) >= 0.02) {
      dirN = dN > 0 ? `GO NORTH ${dN.toFixed(2)} ft` : `GO SOUTH ${Math.abs(dN).toFixed(2)} ft`;
    } else {
      dirN = "NORTH/SOUTH ON TARGET";
    }

    let dirE = "";
    if (Math.abs(dE) >= 0.02) {
      dirE = dE > 0 ? `GO EAST ${dE.toFixed(2)} ft` : `GO WEST ${Math.abs(dE).toFixed(2)} ft`;
    } else {
      dirE = "EAST/WEST ON TARGET";
    }

    const cutFill = dZ > 0.01 ? `FILL +${dZ.toFixed(2)} ft` : dZ < -0.01 ? `CUT ${dZ.toFixed(2)} ft` : "GRADE ON TARGET (0.00 ft)";
    const inTolerance = horizDist <= 0.05;

    return {
      target,
      curN,
      curE,
      curZ,
      dN,
      dE,
      dZ,
      horizDist,
      bearing: inv.bearing,
      dirN,
      dirE,
      cutFill,
      inTolerance
    };
  }
}

window.PointManager = PointManager;
window.pointManager = new PointManager();
