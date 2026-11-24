// Test script for new Topcon/Sokkia/Civil 3D features
const fs = require('fs');

// Mock browser globals
global.window = {};
global.document = {
  createElement: () => ({ href:'', download:'', style:{}, click:()=>{}, appendChild:()=>{}, removeChild:()=>{} }),
  body: { appendChild:()=>{}, removeChild:()=>{} },
  getElementById: ()=>null, querySelectorAll:()=>[],
  addEventListener: ()=>{}
};
global.Blob = class { constructor(a){ this.content=a.join(''); } };
global.URL = { createObjectURL: ()=>'blob:test', revokeObjectURL:()=>{} };
global.localStorage = { getItem:()=>null, setItem:()=>{} };
global.prompt = () => 'TEST';
global.alert = () => {};
global.navigator = {};

eval(fs.readFileSync('js/sample-data.js','utf8'));
eval(fs.readFileSync('js/points.js','utf8'));
eval(fs.readFileSync('js/cad-engine.js','utf8'));
eval(fs.readFileSync('js/dxf.js','utf8'));

window.pointManager.init(window.SAMPLE_DATA.points);
window.aimChat = { postSystemMessage: (m)=>console.log('  AIM:', m.substring(0,80)) };
window.soundFX = { playShotBeep: ()=>{} };
window.sampleData = window.SAMPLE_DATA;

let pass = 0, fail = 0;
function ok(label, cond) {
  if (cond) { console.log('  ✓', label); pass++; }
  else       { console.log('  ✗ FAIL:', label); fail++; }
}

// ── 1. Civil 3D FBK export ────────────────────────────────────────────────────
console.log('\n[ Civil 3D .FBK Export ]');
let captured = '';
const origBlob = global.Blob;
global.Blob = class { constructor(a){ captured = a.join(''); } };
window.dxfManager.exportCivil3dFbk();
global.Blob = origBlob;
const fbkLines = captured.split('\n');
ok('Has JOB record',   fbkLines.some(l => l.startsWith('JOB ')));
ok('Has UNIT record',  fbkLines.some(l => l.includes('UNIT FEET')));
ok('Has PNEZD records', fbkLines.filter(l=>l.startsWith('PNEZD')).length >= 36);
ok('Has SS records',   fbkLines.filter(l=>l.startsWith('SS')).length > 0);
ok('Has END marker',   fbkLines.some(l=>l.trim()==='END'));
console.log('  FBK byte size:', captured.length, 'chars,', fbkLines.length, 'lines');

// ── 2. MAGNET Field .RW5 export ───────────────────────────────────────────────
console.log('\n[ MAGNET Field .RW5 Export ]');
captured = '';
global.Blob = class { constructor(a){ captured = a.join(''); } };
window.dxfManager.exportMagnetRaw();
global.Blob = origBlob;
const rw5Lines = captured.split('\n');
ok('Has RW5 header', rw5Lines[0].includes('Rw5 2.0'));
ok('Has MO record',  rw5Lines.some(l=>l.startsWith('MO,')));
ok('Has KP records', rw5Lines.filter(l=>l.startsWith('KP,')).length >= 2);
ok('Has SP records', rw5Lines.filter(l=>l.startsWith('SP,')).length > 0);
ok('Has GPS records', rw5Lines.filter(l=>l.startsWith('GPS,')).length > 0);
console.log('  RW5 byte size:', captured.length, 'chars,', rw5Lines.length, 'lines');

// ── 3. MAGNET auto-linework code parser ───────────────────────────────────────
console.log('\n[ MAGNET Field Auto-Linework Code Parser ]');
window.cadEngine = new window.CadEngine('cad-canvas');
window.cadEngine.linework = [];
const testPts = [
  {id:1,northing:10200,easting:10100,elevation:688,code:'EP1 B',description:'',type:'TOPO'},
  {id:2,northing:10205,easting:10200,elevation:689,code:'EP1',description:'',type:'TOPO'},
  {id:3,northing:10210,easting:10300,elevation:690,code:'EP1 E',description:'',type:'TOPO'},
  {id:4,northing:10220,easting:10100,elevation:688,code:'IP+',description:'',type:'TOPO'},
  {id:5,northing:10230,easting:10300,elevation:690,code:'IP-',description:'',type:'TOPO'},
  {id:6,northing:10240,easting:10150,elevation:688,code:'CL B',description:'',type:'TOPO'},
  {id:7,northing:10240,easting:10250,elevation:689,code:'CL E',description:'',type:'TOPO'},
  {id:8,northing:10250,easting:10100,elevation:688,code:'BLD B',description:'',type:'TOPO'},
  {id:9,northing:10250,easting:10300,elevation:688,code:'BLD E',description:'',type:'TOPO'},
  {id:10,northing:10260,easting:10100,elevation:688,code:'WM+',description:'',type:'TOPO'},
  {id:11,northing:10260,easting:10200,elevation:688,code:'WM-',description:'',type:'TOPO'},
];
const nLines = window.cadEngine.buildLineworkFromMagnetCodes(testPts);
ok('Built 5 strings', nLines === 5);
ok('EP1 -> EOP_CURB',   window.cadEngine.linework.some(l=>l.name==='MAGNET EP1' && l.layer==='EOP_CURB'));
ok('IP -> BOUNDARY',    window.cadEngine.linework.some(l=>l.name==='MAGNET IP' && l.layer==='BOUNDARY'));
ok('CL -> CENTERLINE',  window.cadEngine.linework.some(l=>l.name==='MAGNET CL' && l.layer==='CENTERLINE'));
ok('BLD -> BUILDING',   window.cadEngine.linework.some(l=>l.name==='MAGNET BLD' && l.layer==='BUILDING'));
ok('WM -> UTILITIES',   window.cadEngine.linework.some(l=>l.name==='MAGNET WM' && l.layer==='UTILITIES'));

// ── 4. Static layer code map ──────────────────────────────────────────────────
console.log('\n[ MAGNET->Civil 3D Layer Mapping ]');
const mapTests = [
  ['EP1','EOP_CURB'],['EOP','EOP_CURB'],['FL','EOP_CURB'],
  ['CL','CENTERLINE'],['TC','CENTERLINE'],
  ['IP','BOUNDARY'],['LOT','BOUNDARY'],['ROW','BOUNDARY'],['FENCE','BOUNDARY'],
  ['BLDG','BUILDING'],['FFE','BUILDING'],
  ['WM','UTILITIES'],['GV','UTILITIES'],['SS','UTILITIES'],['MH','UTILITIES'],
];
mapTests.forEach(([code,expected])=>{
  const got = window.CadEngine.magnetCodeToLayer(code);
  ok(`${code} -> ${expected}`, got === expected);
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`PASS: ${pass}  FAIL: ${fail}`);
if (fail > 0) process.exit(1);
console.log('✅ ALL TESTS PASSED');
