// Job Management and Survey Checklist Engine (Done & What's Left To Do)
class JobManager {
  constructor() {
    this.jobs = [];
    this.currentJobId = "JOB-2026-104";
    this.currentCategoryFilter = "all";
    this.currentStatusFilter = "all"; // 'all', 'done', 'todo'
    this.listeners = [];
  }

  init(initialJobs) {
    const saved = localStorage.getItem('survey_jobs');
    if (saved) {
      try {
        this.jobs = JSON.parse(saved);
      } catch (e) {
        this.jobs = initialJobs ? [...initialJobs] : [];
      }
    } else {
      this.jobs = initialJobs ? [...initialJobs] : [];
    }

    // Migrate legacy jobs that lack Topcon/Sokkia/MAGNET/Civil3D hardware specs
    if (initialJobs && this.jobs.length > 0) {
      this.jobs = this.jobs.map(job => {
        if (!job.hardware) {
          const match = initialJobs.find(ij => ij.id === job.id || ij.number === job.number);
          return {
            ...job,
            hardware: match?.hardware || {
              tablet: "Topcon FC-6000 Rugged Field Tablet",
              software: "MAGNET Field v8.2",
              gpsRover: "Topcon HiPer VR GNSS (TopNET Live VRS)",
              totalStation: "Sokkia iX-1200 Robotic Total Station",
              cadOffice: "Autodesk Civil 3D 2026"
            }
          };
        }
        return job;
      });
    }

    const savedJobId = localStorage.getItem('survey_current_job_id');
    if (savedJobId && this.jobs.some(j => j.id === savedJobId)) {
      this.currentJobId = savedJobId;
    } else if (this.jobs.length > 0) {
      this.currentJobId = this.jobs[0].id;
    }

    this.render();
  }

  save() {
    localStorage.setItem('survey_jobs', JSON.stringify(this.jobs));
    localStorage.setItem('survey_current_job_id', this.currentJobId);
    this.notify();
  }

  subscribe(cb) {
    this.listeners.push(cb);
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.getCurrentJob()); } catch (e) { console.error(e); }
    });
  }

  getCurrentJob() {
    return this.jobs.find(j => j.id === this.currentJobId) || this.jobs[0];
  }

  setCurrentJob(jobId) {
    this.currentJobId = jobId;
    this.save();
    this.render();
    if (window.app && window.app.syncActiveJobHeader) window.app.syncActiveJobHeader();
    if (window.soundFX) window.soundFX.playShotBeep();
  }

  // Toggle checklist task status
  toggleTask(taskId) {
    const job = this.getCurrentJob();
    if (!job || !job.checklist) return;

    const task = job.checklist.find(t => t.id === taskId);
    if (task) {
      task.done = !task.done;
      this.updateProgress(job);
      this.save();
      this.render();

      window.soundFX.playShotBeep();

      // Post checklist update to AIM chat
      if (window.aimChat) {
        window.aimChat.postSystemUpdate(
          `📋 Checklist Updated: [${task.title}] marked as ${task.done ? 'COMPLETED ✅' : 'PENDING ⏳'} by ${task.assignedTo}`
        );
      }
    }
  }

  updateProgress(job) {
    if (!job.checklist || job.checklist.length === 0) {
      job.progress = 0;
      return;
    }
    const doneCount = job.checklist.filter(t => t.done).length;
    job.progress = Math.round((doneCount / job.checklist.length) * 100);
  }

  addTask(title, category, assignedTo, notes = "") {
    const job = this.getCurrentJob();
    if (!job) return;

    const newTask = {
      id: "task-" + Date.now(),
      category: category || "Field Operations",
      title: title.trim(),
      done: false,
      assignedTo: assignedTo || "Field Crew",
      notes: notes.trim()
    };

    job.checklist.push(newTask);
    this.updateProgress(job);
    this.save();
    this.render();
    window.soundFX.playShotBeep();
  }

  deleteTask(taskId) {
    const job = this.getCurrentJob();
    if (!job || !job.checklist) return;

    job.checklist = job.checklist.filter(t => t.id !== taskId);
    this.updateProgress(job);
    this.save();
    this.render();
  }

  createJob(jobData) {
    const equip = (window.app && window.app.equipmentProfile) ? window.app.equipmentProfile : null;
    const newJob = {
      id: "JOB-" + Date.now(),
      number: jobData.number || "2026-" + Math.floor(100 + Math.random() * 900),
      name: jobData.name || "New Survey Project",
      client: jobData.client || "Client Name",
      location: jobData.location || "County / State",
      datum: jobData.datum || "NAD83 / NAVD88",
      dateCreated: new Date().toISOString().split('T')[0],
      status: "In Progress",
      partyChief: jobData.partyChief || "Field Crew Chief",
      cadOperator: jobData.cadOperator || "Civil 3D Office Drafter",
      hardware: jobData.hardware || {
        tablet: equip ? equip.tablet : "Topcon FC-6000 Rugged Field Tablet",
        software: equip ? equip.software : "MAGNET Field v8.2",
        gpsRover: equip ? `${equip.gps} (${equip.network})` : "Topcon HiPer VR GNSS",
        totalStation: equip ? equip.totalStation : "Sokkia iX-1200 Robotic",
        cadOffice: equip ? equip.cadOffice : "Autodesk Civil 3D 2026"
      },
      weather: "70°F, Clear",
      progress: 0,
      checklist: [
        { id: "c1", category: "Pre-Field", title: "Create Civil 3D Survey DB & Coordinate System", done: false, assignedTo: "Civil 3D Office", notes: "" },
        { id: "c2", category: "Pre-Field", title: "Export control points to MAGNET Field (.csv / .rw5)", done: false, assignedTo: "Civil 3D Office", notes: "" },
        { id: "c3", category: "Field Operations", title: "Recover existing boundary iron pins & control", done: false, assignedTo: "Field Crew", notes: "" },
        { id: "c4", category: "Field Operations", title: "Collect MAGNET Field coded topo & breaklines", done: false, assignedTo: "Field Crew", notes: "" },
        { id: "c5", category: "Field Operations", title: "Utility invert and rim elevation dips", done: false, assignedTo: "Field Crew", notes: "" },
        { id: "c6", category: "Office CAD", title: "Import MAGNET .RW5 / .FBK & balance traverse", done: false, assignedTo: "Civil 3D Office", notes: "" },
        { id: "c7", category: "Office CAD", title: "Civil 3D Field-to-Finish figure generation", done: false, assignedTo: "Civil 3D Office", notes: "" },
        { id: "c8", category: "Deliverables & QA", title: "RPLS Review, Seal & Civil 3D DWG/DXF Delivery", done: false, assignedTo: "Civil 3D Office", notes: "" }
      ]
    };

    this.jobs.push(newJob);
    this.currentJobId = newJob.id;
    this.save();
    this.render();
    if (window.app && window.app.syncActiveJobHeader) window.app.syncActiveJobHeader();
    if (window.soundFX) window.soundFX.playDoorOpen();
  }

  setFilter(category, status) {
    if (category !== undefined) this.currentCategoryFilter = category;
    if (status !== undefined) this.currentStatusFilter = status;
    this.render();
  }

  render() {
    const job = this.getCurrentJob();
    const container = document.getElementById('jobs-container');
    if (!container || !job) return;

    this.updateProgress(job);

    const checklist = job.checklist || [];
    const totalTasks = checklist.length;
    const doneTasks = checklist.filter(t => t.done).length;
    const pendingTasks = totalTasks - doneTasks;

    // Filter checklist
    let filteredTasks = checklist;
    if (this.currentCategoryFilter !== "all") {
      filteredTasks = filteredTasks.filter(t => t.category === this.currentCategoryFilter);
    }
    if (this.currentStatusFilter === "done") {
      filteredTasks = filteredTasks.filter(t => t.done);
    } else if (this.currentStatusFilter === "todo") {
      filteredTasks = filteredTasks.filter(t => !t.done);
    }

    container.innerHTML = `
      <div class="jobs-layout">
        <!-- Job Overview Card -->
        <div class="job-card-hero">
          <div class="job-hero-header">
            <div class="job-hero-meta">
              <span class="badge badge-primary">JOB #${job.number}</span>
              <span class="badge ${job.status === 'In Progress' ? 'badge-warning' : 'badge-success'}">${job.status}</span>
              <span class="job-datum-tag">${job.datum}</span>
            </div>
            <div class="job-switcher-dropdown">
              <select onchange="window.jobManager.setCurrentJob(this.value)" class="form-select-sm">
                ${this.jobs.map(j => `<option value="${j.id}" ${j.id === job.id ? 'selected' : ''}>${j.number} - ${j.name}</option>`).join('')}
              </select>
              <button class="btn btn-sm btn-outline-primary" onclick="window.jobManager.showNewJobModal()">+ New Job</button>
            </div>
          </div>

          <h2 class="job-title">${job.name}</h2>
          <div class="job-details-row">
            <div><i class="icon">👤</i> Client: <b>${job.client}</b></div>
            <div><i class="icon">📍</i> Location: <b>${job.location}</b></div>
            <div><i class="icon">👷</i> Field Chief: <b>${job.partyChief}</b></div>
            <div><i class="icon">🖥️</i> CAD Operator: <b>${job.cadOperator}</b></div>
          </div>

          <!-- Progress Bar & Metrics -->
          <div class="job-progress-section">
            <div class="progress-labels">
              <span>Overall Job Completion: <b>${job.progress}%</b></span>
              <span><b>${doneTasks}</b> Done / <b>${pendingTasks}</b> Left To Do (${totalTasks} Total)</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar ${job.progress > 80 ? 'bg-success' : 'bg-primary'}" style="width: ${job.progress}%;"></div>
            </div>
          </div>
        </div>

        <!-- Checklist Controls & Filters -->
        <div class="checklist-header-bar">
          <div class="checklist-filters">
            <button class="filter-chip ${this.currentStatusFilter === 'all' ? 'active' : ''}" onclick="window.jobManager.setFilter(undefined, 'all')">
              All Tasks (${totalTasks})
            </button>
            <button class="filter-chip ${this.currentStatusFilter === 'todo' ? 'active' : ''}" onclick="window.jobManager.setFilter(undefined, 'todo')">
              ⏳ Left To Do (${pendingTasks})
            </button>
            <button class="filter-chip ${this.currentStatusFilter === 'done' ? 'active' : ''}" onclick="window.jobManager.setFilter(undefined, 'done')">
              ✅ Completed (${doneTasks})
            </button>
          </div>

          <div class="checklist-cat-filters">
            <select class="form-select-xs" onchange="window.jobManager.setFilter(this.value, undefined)">
              <option value="all" ${this.currentCategoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
              <option value="Pre-Field" ${this.currentCategoryFilter === 'Pre-Field' ? 'selected' : ''}>Pre-Field & Research</option>
              <option value="Field Operations" ${this.currentCategoryFilter === 'Field Operations' ? 'selected' : ''}>Field Operations</option>
              <option value="Office CAD" ${this.currentCategoryFilter === 'Office CAD' ? 'selected' : ''}>Office CAD Drafting</option>
              <option value="Deliverables & QA" ${this.currentCategoryFilter === 'Deliverables & QA' ? 'selected' : ''}>Deliverables & QA</option>
            </select>
            <button class="btn btn-xs btn-primary" onclick="window.jobManager.showAddTaskModal()">+ Add Checklist Item</button>
          </div>
        </div>

        <!-- Checklist Items List -->
        <div class="checklist-list">
          ${filteredTasks.length === 0 ? `
            <div class="checklist-empty">
              <span>No checklist tasks match the active filters.</span>
            </div>
          ` : filteredTasks.map(task => `
            <div class="checklist-item ${task.done ? 'is-done' : 'is-pending'}">
              <div class="check-toggle" onclick="window.jobManager.toggleTask('${task.id}')">
                <input type="checkbox" ${task.done ? 'checked' : ''} readonly>
              </div>

              <div class="check-content">
                <div class="check-main-row">
                  <span class="check-title ${task.done ? 'line-through' : ''}">${task.title}</span>
                  <div class="check-badges">
                    <span class="cat-badge cat-${task.category.toLowerCase().replace(/[^a-z]/g, '')}">${task.category}</span>
                    <span class="assignee-badge ${task.assignedTo === 'CAD Office' ? 'badge-cad' : 'badge-field'}">
                      ${task.assignedTo === 'CAD Office' ? '🖥️ CAD' : '👷 Field'}
                    </span>
                  </div>
                </div>

                ${task.notes ? `
                  <div class="check-notes">
                    <span class="notes-icon">📝</span> ${task.notes}
                  </div>
                ` : ''}
              </div>

              <div class="check-actions">
                <button class="btn-icon text-muted" title="Delete task" onclick="window.jobManager.deleteTask('${task.id}')">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  showAddTaskModal() {
    const title = prompt("Enter New Checklist Task Title (e.g. Locate SW lot corner pin):");
    if (!title) return;

    const category = prompt("Category (Pre-Field, Field Operations, Office CAD, Deliverables & QA):", "Field Operations") || "Field Operations";
    const assignedTo = prompt("Assign To (Field Crew or CAD Office):", "Field Crew") || "Field Crew";
    const notes = prompt("Notes or specifics:", "") || "";

    this.addTask(title, category, assignedTo, notes);
  }

  showNewJobModal() {
    const name = prompt("Enter Project Name:", "Highway 71 Boundary Survey");
    if (!name) return;

    const client = prompt("Client Name:", "Texas Department of Transportation");
    const location = prompt("Location:", "Travis County, TX");
    const number = "2026-" + Math.floor(100 + Math.random() * 900);

    this.createJob({ name, client, location, number });
  }
}

window.JobManager = JobManager;
window.jobManager = new JobManager();
