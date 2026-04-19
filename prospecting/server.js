/**
 * Apex AI Advisors — Prospect Review Dashboard Server
 * Run: node server.js
 * Open: http://localhost:3002
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { runScrape } = require('./scraper');

const DATA_FILE = path.join(__dirname, 'data', 'prospects.json');
const LOG_FILE = path.join(__dirname, 'data', 'scrape-log.json');
const PORT = 3002;

function loadProspects() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e) { return []; }
}

function saveProspects(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) { return []; }
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Apex AI — Prospect Database</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0d1117; color:#e0e0e0; min-height:100vh; }
.top-bar { background:#161b27; border-bottom:1px solid rgba(255,255,255,0.07); padding:1rem 2rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
.top-bar h1 { font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700; }
.top-bar h1 span { color:#3B82F6; }
.actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
.btn { padding:0.5rem 1rem; border-radius:8px; border:none; font-size:0.85rem; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
.btn-primary { background:#3B82F6; color:#fff; }
.btn-danger { background:#ef4444; color:#fff; }
.btn-outline { background:transparent; border:1px solid rgba(255,255,255,0.15); color:#e0e0e0; }
.btn:hover { opacity:0.85; }
.btn:disabled { opacity:0.4; cursor:not-allowed; }

.stats { display:flex; gap:1rem; padding:1rem 2rem; flex-wrap:wrap; background:#0d1117; border-bottom:1px solid rgba(255,255,255,0.05); }
.stat { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.7rem 1.2rem; }
.stat .n { font-family:'Space Grotesk',sans-serif; font-size:1.5rem; font-weight:700; }
.stat .l { font-size:0.72rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; }
.blue { color:#3B82F6; } .green { color:#10b981; } .yellow { color:#f59e0b; } .red { color:#ef4444; }

.controls { padding:1rem 2rem; display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); }
.controls input, .controls select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.8rem; color:#e0e0e0; font-family:'Inter',sans-serif; font-size:0.85rem; }
.controls input { flex:1; min-width:200px; }
.controls input:focus, .controls select:focus { outline:none; border-color:#3B82F6; }
.controls select option { background:#1a1a2e; }

.table-wrap { padding:0 2rem 2rem; overflow-x:auto; }
table { width:100%; border-collapse:collapse; margin-top:1rem; }
th { text-align:left; font-size:0.72rem; font-weight:600; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; padding:0.6rem 0.8rem; border-bottom:1px solid rgba(255,255,255,0.07); white-space:nowrap; cursor:pointer; }
th:hover { color:#fff; }
td { padding:0.75rem 0.8rem; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem; vertical-align:middle; }
tr:hover td { background:rgba(255,255,255,0.02); }
tr.status-pursuing td { border-left:2px solid #10b981; }
tr.status-contacted td { border-left:2px solid #3B82F6; }
tr.status-new td { border-left:2px solid #f59e0b; }
tr.status-dead td { opacity:0.4; }

.company-name { font-weight:600; color:#fff; }
.company-sub { font-size:0.72rem; color:rgba(255,255,255,0.35); margin-top:0.1rem; }
.type-badge { padding:0.15rem 0.5rem; border-radius:4px; font-size:0.7rem; font-weight:700; }
.type-office { background:rgba(59,130,246,0.15); color:#3B82F6; }
.type-industrial { background:rgba(245,158,11,0.15); color:#f59e0b; }
.status-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:5px; padding:0.25rem 0.5rem; color:#e0e0e0; font-size:0.78rem; font-family:'Inter',sans-serif; }
.source-link { color:#3B82F6; text-decoration:none; font-size:0.78rem; }
.source-link:hover { text-decoration:underline; }
.no-data { text-align:center; padding:4rem; color:rgba(255,255,255,0.25); font-size:0.9rem; }
.scraping-indicator { display:none; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); border-radius:8px; padding:0.75rem 1rem; font-size:0.85rem; color:#3B82F6; }
.scraping-indicator.visible { display:flex; align-items:center; gap:0.5rem; }
.spinner { width:14px; height:14px; border:2px solid rgba(59,130,246,0.3); border-top-color:#3B82F6; border-radius:50%; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.log-section { padding:0 2rem 2rem; }
.log-section h3 { font-family:'Space Grotesk',sans-serif; font-size:0.9rem; color:rgba(255,255,255,0.5); margin-bottom:0.75rem; }
.log-entry { font-size:0.78rem; color:rgba(255,255,255,0.4); padding:0.3rem 0; border-bottom:1px solid rgba(255,255,255,0.03); font-family:monospace; }
</style>
</head>
<body>
<div class="top-bar">
  <h1>Apex<span>AI</span> — Prospect Database</h1>
  <div class="actions">
    <div class="scraping-indicator" id="scrapeIndicator"><div class="spinner"></div> Scraping sources... this takes 2-3 minutes</div>
    <button class="btn btn-primary" onclick="triggerScrape()">🔄 Run Scrape Now</button>
    <button class="btn btn-outline" onclick="exportCSV()">⬇️ Export CSV</button>
    <button class="btn btn-outline" onclick="exportHubSpot()">→ HubSpot Export</button>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="n blue" id="stat_total">—</div><div class="l">Total Prospects</div></div>
  <div class="stat"><div class="n yellow" id="stat_new">—</div><div class="l">New</div></div>
  <div class="stat"><div class="n blue" id="stat_contacted">—</div><div class="l">Contacted</div></div>
  <div class="stat"><div class="n green" id="stat_pursuing">—</div><div class="l">Pursuing</div></div>
  <div class="stat"><div class="n" id="stat_office">—</div><div class="l">Office</div></div>
  <div class="stat"><div class="n" id="stat_industrial">—</div><div class="l">Industrial</div></div>
  <div class="stat"><div class="n green" id="stat_sf">—</div><div class="l">Total SF Tracked</div></div>
</div>

<div class="controls">
  <input type="text" id="searchInput" placeholder="Search company, address, source..." oninput="renderTable()">
  <select id="filterType" onchange="renderTable()">
    <option value="">All Types</option>
    <option value="Office">Office</option>
    <option value="Industrial">Industrial</option>
  </select>
  <select id="filterStatus" onchange="renderTable()">
    <option value="">All Status</option>
    <option value="new">New</option>
    <option value="contacted">Contacted</option>
    <option value="pursuing">Pursuing</option>
    <option value="dead">Dead</option>
  </select>
  <select id="filterExp" onchange="renderTable()">
    <option value="">All Expirations</option>
    <option value="2025">2025</option>
    <option value="2026">2026</option>
    <option value="2027">2027</option>
    <option value="2028">2028</option>
  </select>
  <select id="filterSource" onchange="renderTable()">
    <option value="">All Sources</option>
    <option value="SEC EDGAR">SEC EDGAR</option>
    <option value="Crexi">Crexi</option>
    <option value="Public OM">Public OM</option>
  </select>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th onclick="sortBy('company')">Company ↕</th>
        <th onclick="sortBy('address')">Address ↕</th>
        <th>Type</th>
        <th onclick="sortBy('sf')">SF ↕</th>
        <th onclick="sortBy('baseRentAnnual')">Rate ↕</th>
        <th onclick="sortBy('leaseExpiration')">Expiration ↕</th>
        <th>Source</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody id="tableBody"></tbody>
  </table>
</div>

<div class="log-section">
  <h3>📋 Scrape Log</h3>
  <div id="logEntries"></div>
</div>

<script>
let prospects = [];
let sortField = 'leaseExpiration';
let sortDir = 1;

async function loadData() {
  const res = await fetch('/api/prospects');
  prospects = await res.json();
  renderTable();
  renderLogs();
}

function getFiltered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  const exp = document.getElementById('filterExp').value;
  const source = document.getElementById('filterSource').value;
  
  return prospects.filter(p => {
    if (q && !JSON.stringify(p).toLowerCase().includes(q)) return false;
    if (type && p.productType !== type) return false;
    if (status && (p.status || 'new') !== status) return false;
    if (exp && !(p.leaseExpiration || '').includes(exp)) return false;
    if (source && !(p.source || '').includes(source)) return false;
    return true;
  });
}

function renderTable() {
  const filtered = getFiltered().sort((a, b) => {
    const av = a[sortField] || '', bv = b[sortField] || '';
    return av > bv ? sortDir : av < bv ? -sortDir : 0;
  });

  // Stats
  document.getElementById('stat_total').textContent = prospects.length;
  document.getElementById('stat_new').textContent = prospects.filter(p => !p.status || p.status === 'new').length;
  document.getElementById('stat_contacted').textContent = prospects.filter(p => p.status === 'contacted').length;
  document.getElementById('stat_pursuing').textContent = prospects.filter(p => p.status === 'pursuing').length;
  document.getElementById('stat_office').textContent = prospects.filter(p => p.productType === 'Office').length;
  document.getElementById('stat_industrial').textContent = prospects.filter(p => p.productType === 'Industrial').length;
  const totalSF = prospects.reduce((s, p) => s + (parseInt(p.sf) || 0), 0);
  document.getElementById('stat_sf').textContent = totalSF > 0 ? (totalSF/1000).toFixed(0) + 'K' : '—';

  const tbody = document.getElementById('tableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="no-data">No prospects found. Run a scrape to populate data.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((p, i) => {
    const status = p.status || 'new';
    const sf = p.sf ? parseInt(p.sf).toLocaleString() : '—';
    const rate = p.baseRentAnnual ? '$' + parseFloat(p.baseRentAnnual).toFixed(2) + '/SF' : '—';
    const typeClass = (p.productType || '').toLowerCase().includes('industrial') ? 'type-industrial' : 'type-office';
    const sourceShort = (p.source || '').split('—')[0].trim();
    return \`<tr class="status-\${status}" data-id="\${p.id || i}">
      <td>
        <div class="company-name">\${p.company || '—'}</div>
        <div class="company-sub">\${p.landlord ? 'Landlord: ' + p.landlord : ''}</div>
      </td>
      <td style="font-size:0.82rem; color:rgba(255,255,255,0.6); max-width:200px; word-break:break-word;">\${p.address || '—'}</td>
      <td><span class="type-badge \${typeClass}">\${p.productType || '—'}</span></td>
      <td style="font-weight:600;">\${sf}</td>
      <td>\${rate}</td>
      <td style="font-weight:600; color:\${(p.leaseExpiration||'') <= '2026' ? '#ef4444' : '#e0e0e0'}">\${p.leaseExpiration || '—'}</td>
      <td>\${p.sourceUrl ? \`<a href="\${p.sourceUrl}" target="_blank" class="source-link">\${sourceShort}</a>\` : sourceShort || '—'}</td>
      <td>
        <select class="status-select" onchange="updateStatus('\${p.id || i}', this.value)">
          <option value="new" \${status==='new'?'selected':''}>New</option>
          <option value="contacted" \${status==='contacted'?'selected':''}>Contacted</option>
          <option value="pursuing" \${status==='pursuing'?'selected':''}>Pursuing</option>
          <option value="dead" \${status==='dead'?'selected':''}>Dead</option>
        </select>
      </td>
      <td>
        <input type="text" value="\${p.notes || ''}" placeholder="Add note..." 
          style="background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.1); color:#e0e0e0; font-size:0.78rem; width:100%; outline:none;"
          onblur="updateNote('\${p.id || i}', this.value)">
      </td>
    </tr>\`;
  }).join('');
}

function sortBy(field) {
  if (sortField === field) sortDir *= -1;
  else { sortField = field; sortDir = 1; }
  renderTable();
}

async function updateStatus(id, status) {
  await fetch('/api/prospects/' + encodeURIComponent(id) + '/status', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ status })
  });
  const p = prospects.find(x => x.id == id);
  if (p) p.status = status;
  renderTable();
}

async function updateNote(id, notes) {
  await fetch('/api/prospects/' + encodeURIComponent(id) + '/note', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ notes })
  });
  const p = prospects.find(x => x.id == id);
  if (p) p.notes = notes;
}

async function triggerScrape() {
  document.getElementById('scrapeIndicator').classList.add('visible');
  document.querySelector('button[onclick="triggerScrape()"]').disabled = true;
  try {
    await fetch('/api/scrape', { method: 'POST' });
    setTimeout(async () => {
      await loadData();
      document.getElementById('scrapeIndicator').classList.remove('visible');
      document.querySelector('button[onclick="triggerScrape()"]').disabled = false;
    }, 180000); // Poll after 3 min
  } catch(e) {
    document.getElementById('scrapeIndicator').classList.remove('visible');
    document.querySelector('button[onclick="triggerScrape()"]').disabled = false;
  }
}

function exportCSV() {
  const filtered = getFiltered();
  const headers = ['Company','Address','Type','SF','Rate ($/SF)','Expiration','Source','Status','Notes','Landlord'];
  const rows = filtered.map(p => [
    p.company, p.address, p.productType, p.sf, p.baseRentAnnual,
    p.leaseExpiration, p.source, p.status || 'new', p.notes || '', p.landlord || ''
  ].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(','));
  
  const csv = [headers.join(','), ...rows].join('\\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'apex-prospects-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

function exportHubSpot() {
  // HubSpot import format
  const filtered = getFiltered();
  const headers = ['Company Name','Address','Property Type','Square Footage','Annual Rent Rate','Lease Expiration','Data Source','Contact Stage','Notes'];
  const rows = filtered.map(p => [
    p.company, p.address, p.productType, p.sf, p.baseRentAnnual,
    p.leaseExpiration, p.source, p.status || 'new', p.notes || ''
  ].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(','));
  
  const csv = [headers.join(','), ...rows].join('\\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hubspot-import-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

async function renderLogs() {
  const res = await fetch('/api/logs');
  const logs = await res.json();
  document.getElementById('logEntries').innerHTML = logs.slice(0, 20).map(l => 
    \`<div class="log-entry">[\${l.ts?.substring(0,19)||''}] \${l.message}</div>\`
  ).join('');
}

loadData();
setInterval(loadData, 30000); // Refresh every 30s
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = req.url;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  
  } else if (url === '/api/prospects') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadProspects()));
  
  } else if (url === '/api/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadLogs()));
  
  } else if (url === '/api/scrape' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'started' }));
    // Run scrape in background
    runScrape().catch(console.error);
  
  } else if (url.startsWith('/api/prospects/') && url.includes('/status') && req.method === 'POST') {
    const id = decodeURIComponent(url.split('/api/prospects/')[1].split('/status')[0]);
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { status } = JSON.parse(body);
      const prospects = loadProspects();
      const p = prospects.find(x => x.id === id);
      if (p) { p.status = status; saveProspects(prospects); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  
  } else if (url.startsWith('/api/prospects/') && url.includes('/note') && req.method === 'POST') {
    const id = decodeURIComponent(url.split('/api/prospects/')[1].split('/note')[0]);
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { notes } = JSON.parse(body);
      const prospects = loadProspects();
      const p = prospects.find(x => x.id === id);
      if (p) { p.notes = notes; saveProspects(prospects); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Apex AI Prospect Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 Showing data from: ${DATA_FILE}`);
  console.log(`\nCommands:`);
  console.log(`  Run scrape now: POST http://localhost:${PORT}/api/scrape`);
  console.log(`  View prospects: GET  http://localhost:${PORT}/api/prospects\n`);
});
