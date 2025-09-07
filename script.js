const BACKEND_BASE = 'https://speech-project-backend.onrender.com';
const AUTH_TOKEN = null; // optional

function authHeaders() { return AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}; }

async function loadLanguage() {
  const r = await fetch(`${BACKEND_BASE}/api/get-language`);
  const j = await r.json();
  document.getElementById('lang').value = j.targetLanguage || '';
}

async function saveLanguage() {
  const lang = document.getElementById('lang').value.trim();
  const r = await fetch(`${BACKEND_BASE}/api/set-language`, {
    method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({lang})
  });
  document.getElementById('status').textContent = r.ok ? 'Saved ✅' : 'Failed ❌';
}

function addMessage(msg) {
  const wrap = document.getElementById('messages');
  const card = document.createElement('div'); card.className='card';
  const time = new Date(msg.ts||Date.now()).toLocaleString();
  card.innerHTML = `
    <div class="row"><div class="badge">Time</div><div class="time">${time}</div></div>
    <div class="row"><div class="badge">Original</div><div>${(msg.original||'').replaceAll('\n','<br/>')}</div></div>
    <div class="row"><div class="badge">Translated (${msg.targetLanguage})</div><div>${(msg.translated||'').replaceAll('\n','<br/>')}</div></div>
  `;
  wrap.prepend(card);
}

function connectStream() {
  const ev = new EventSource(`${BACKEND_BASE}/api/stream`);
  ev.onmessage = (e)=>{ try { addMessage(JSON.parse(e.data)); } catch(_){} };
  ev.onerror = ()=>{ document.getElementById('status').textContent='Stream disconnected, retrying…'; };
}

document.getElementById('saveLang').addEventListener('click', saveLanguage);
loadLanguage();
connectStream();
