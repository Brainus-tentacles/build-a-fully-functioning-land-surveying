const fs = require('fs');

// Mock browser objects
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); }
};

// Load modules
require('./js/sample-data.js');
require('./js/audio.js');
require('./js/points.js');
require('./js/cad-engine.js');
require('./js/dxf.js');
require('./js/fieldbook.js');
require('./js/jobs.js');
require('./js/aim-chat.js');

console.log("=== RUNNING LAND SURVEYING TEST SUITE ===");

// 1. Test PointManager & Inverse Calculation
const pm = window.pointManager;
pm.init(window.SAMPLE_DATA.points);
console.log(`✓ Loaded points count: ${pm.getAll().length}`);

const inv = window.PointManager.inverse(10050, 10050, 10450, 10050); // Straight North 400 ft
console.log(`✓ Inverse Test 1 (Due North): ${inv.bearing}, Dist: ${inv.horizDist} ft`);
if (inv.horizDist !== 400 || !inv.bearing.includes("0° 00' 00\"")) {
  throw new Error(`Inverse due north failed: ${JSON.stringify(inv)}`);
}

const inv2 = window.PointManager.inverse(10050, 10050, 10050, 10550); // Straight East 500 ft
console.log(`✓ Inverse Test 2 (Due East): ${inv2.bearing}, Dist: ${inv2.horizDist} ft`);
if (inv2.horizDist !== 500) {
  throw new Error(`Inverse due east failed: ${JSON.stringify(inv2)}`);
}

// 2. Test Polygon Area Calculation (Lot 14: 400 ft x 500 ft = 200,000 sq ft = 4.591 acres)
const lot14Vertices = [
  { n: 10050.00, e: 10050.00 },
  { n: 10450.00, e: 10050.00 },
  { n: 10450.00, e: 10550.00 },
  { n: 10050.00, e: 10550.00 }
];
const areaResult = window.CadEngine.calculatePolygonArea(lot14Vertices);
console.log(`✓ Area Test: ${areaResult.sqFt} Sq Ft, ${areaResult.acres.toFixed(3)} Acres`);
if (areaResult.sqFt !== 200000 || Math.abs(areaResult.acres - 4.591) > 0.01) {
  throw new Error(`Area calculation incorrect: ${JSON.stringify(areaResult)}`);
}

// 3. Test DXF Export & Import Round-trip
const dxfMgr = window.dxfManager;
const dxfText = dxfMgr.generateDxf();
if (!dxfText.includes("SECTION") || !dxfText.includes("ENTITIES") || !dxfText.includes("EOF")) {
  throw new Error("DXF generation failed basic structure test.");
}
console.log(`✓ Generated valid DXF file (${dxfText.length} bytes).`);

const parsedDxf = dxfMgr.parseDxf(dxfText);
console.log(`✓ Parsed DXF entities: ${parsedDxf.points.length} points, ${parsedDxf.linework.length} lines/polylines.`);

// 4. Test Job & Checklist Progress
const jm = window.jobManager;
jm.init(window.SAMPLE_DATA.jobs);
const curJob = jm.getCurrentJob();
console.log(`✓ Active Job: ${curJob.name}, Progress: ${curJob.progress}%`);
const initialDone = curJob.checklist.filter(t => t.done).length;
jm.toggleTask(curJob.checklist[curJob.checklist.length - 1].id);
const newDone = curJob.checklist.filter(t => t.done).length;
console.log(`✓ Toggled task: was ${initialDone} done, now ${newDone} done, new progress: ${curJob.progress}%`);

// 5. Test Differential Level Loop Math & Page Check
const fb = window.fieldBook;
fb.init(window.SAMPLE_DATA.fieldNotes);
fb.calculateLevelLoop();
const stats = fb.lastLoopStats;
console.log(`✓ Level Loop Page Check: sumBS=${stats.sumBS.toFixed(3)}, sumFS=${stats.sumFS.toFixed(3)}, misclosure=${stats.misclosure.toFixed(3)} ft, passed=${stats.pageCheckPassed}`);
if (!stats.pageCheckPassed) {
  throw new Error("Level loop page check failed!");
}

console.log("=== ALL TEST SUITE CHECKS PASSED PERFECTLY! ===");
