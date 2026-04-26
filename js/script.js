const WALRUS_BASE = 'https://aggregator.walrus-mainnet.walrus.space/v1/blobs/';
const JSON_BLOB_ID = '3kpgbmnux5YnLum-4q7tLE6HOJjZ0VJ5veqtDSNvXvI';

let appData    = null;
let currentFid = null;
let currentIdx = 0;
let zCtr       = 200;
let winOff     = 0;
let soundOn = true;

// async function loadData() {
//   try {
//     const r = await fetch('./images.json?t=' + Date.now());
//     if (!r.ok) throw new Error(r.status);
//     appData = await r.json();
//     renderDesktop();
//   } catch {
//     document.getElementById('loadError').classList.add('show');
//   }
// }

async function loadData() {
  try {
    const url = WALRUS_BASE + JSON_BLOB_ID;
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    appData = await r.json();
    renderDesktop();
  } catch {
    document.getElementById('loadError').classList.add('show');
  }
}


function renderDesktop() {
  const c = document.getElementById('desktopIcons');
  c.innerHTML = '';
  appData.folders.forEach(f => {
    const count = (appData.photos[f.id] || []).length;
    const el = document.createElement('div');
    el.className = 'folder-icon';
    el.onclick = () => openFolder(f.id);
    el.innerHTML = `
      <div class="folder-face" style="background:linear-gradient(135deg,${f.color}cc,${f.color}55)">
        <span>${f.emoji}</span>
        ${count ? `<div class="folder-badge">${count}</div>` : ''}
      </div>
      <div class="folder-label">${f.name}</div>`;
    c.appendChild(el);
  });
}


function openFolder(fid) {
  document.getElementById('mainWin')?.remove();
  currentFid = fid; currentIdx = 0;

  const f   = appData.folders.find(x => x.id === fid);
  const mob = window.innerWidth <= 700;
  const ww  = mob ? window.innerWidth : Math.min(860, window.innerWidth - 24);
  const lft = mob ? 0 : Math.max(12, (window.innerWidth - ww) / 2) + (winOff % 40);
  const top = mob ? 'auto' : Math.max(16, (window.innerHeight - 600) / 2) + (winOff % 40);
  winOff += 20;

  const win = document.createElement('div');
  win.className = 'window active'; win.id = 'mainWin';
  win.style.cssText = mob ? `z-index:${++zCtr}` : `width:${ww}px;left:${lft}px;top:${top}px;z-index:${++zCtr}`;

  win.innerHTML = `
    <div class="win-header" id="winHdr">
      <div class="win-title">${f.emoji} ${f.name}</div>
      <button class="btn-q" onclick="openMascot()">?</button>
      <button class="btn-close" onclick="closeFolder()">Close</button>
    </div>
    <div class="gallery-body">
      <div class="gallery-toolbar">
        <span class="toolbar-title">Memory Photos</span>
        <span class="toolbar-count" id="winCount"></span>
      </div>
      <div id="winGallery"></div>
    </div>`;

  document.body.appendChild(win);
  if (!mob) setupDrag(win, document.getElementById('winHdr'));
  renderGallery();
}

function closeFolder() {
  const w = document.getElementById('mainWin');
  if (!w) return;
  w.style.transition = 'opacity .16s, transform .16s';
  w.style.opacity = '0'; w.style.transform = 'scale(.92)';
  setTimeout(() => w.remove(), 180);
  currentFid = null;
}

function setupDrag(win, hdr) {
  let drag=false, ox=0, oy=0;
  hdr.addEventListener('pointerdown', e => {
    if (e.target.closest('.btn-q,.btn-close')) return;
    drag=true; ox=e.clientX-win.offsetLeft; oy=e.clientY-win.offsetTop;
    hdr.setPointerCapture(e.pointerId);
  });
  hdr.addEventListener('pointermove', e => {
    if (!drag) return;
    win.style.left = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  e.clientX-ox)) + 'px';
    win.style.top  = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, e.clientY-oy)) + 'px';
  });
  hdr.addEventListener('pointerup', () => { drag=false });
}


function renderGallery() {
  if (!currentFid) return;
  const photos = appData.photos[currentFid] || [];
  const gc = document.getElementById('winGallery');
  const tc = document.getElementById('winCount');
  if (tc) tc.textContent = `${photos.length} Image`;
  if (!gc) return;

  if (!photos.length) {
    gc.innerHTML = `
      <div class="empty-state">
        <div class="ei">🖼️</div>
        <h3>No photos yet!</h3>
      </div>`;
    return;
  }

  const p   = photos[currentIdx];
  const src = WALRUS_BASE + p.blobId;

  const thumbsHTML = photos.map((ph, i) => `
    <div class="thumb ${i===currentIdx?'active':''}" onclick="goTo(${i})" id="th_${i}">
      <img src="${WALRUS_BASE}${ph.blobId}" style="opacity:0"
        onload="this.style.opacity=1" onerror="this.style.opacity=.2">
    </div>`).join('');

  gc.innerHTML = `
    <div class="photo-viewer">

      <div class="photo-main">
        <div class="photo-frame" id="pframe">
          <div class="photo-loading" id="ploading">
            <div class="spinner"></div>
            <span>Loading photos...</span>
          </div>
          <img src="${src}" style="opacity:0"
  onload="this.style.opacity=1;document.getElementById('ploading').style.display='none'"
  onerror="document.getElementById('ploading').innerHTML='<span style=\\'color:#c2504a;font-size:12px\\'>No images — Check Blob ID</span>'">
        </div>

        <div class="photo-nav">
          <button class="nav-btn" onclick="goTo(${currentIdx-1})">‹</button>
          <span class="photo-counter">${currentIdx+1} / ${photos.length}</span>
          <button class="nav-btn" onclick="goTo(${currentIdx+1})">›</button>
        </div>

        <div class="photo-info">
          ${p.date ? `<div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-val">📅 ${p.date}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Blob ID</span>
            <span class="info-val mono" title="${p.blobId}" onclick="copyText('${p.blobId}','📋 Copied Blob ID!')">
              <span class="tag-walrus">🐋 Walrus</span>&nbsp;${p.blobId}
            </span>
          </div>
        </div>
      </div>

      <div class="photo-sidebar">
        <div class="thumbs" id="thumbRow">${thumbsHTML}</div>
      </div>

    </div>`;

  setupSwipe();
}

function goTo(idx) {
  const n = (appData.photos[currentFid] || []).length;
  if (!n) return;
  currentIdx = (idx + n) % n;
  renderGallery();
  setTimeout(() => document.getElementById('th_' + currentIdx)?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'nearest' }), 50);
}

function setupSwipe() {
  const f = document.getElementById('pframe');
  if (!f) return;
  let sx=0, sy=0;
  f.addEventListener('pointerdown', e => { sx=e.clientX; sy=e.clientY; f.setPointerCapture(e.pointerId) });
  f.addEventListener('pointerup', e => {
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 44 && Math.abs(e.clientY-sy) < 60) goTo(dx < 0 ? currentIdx+1 : currentIdx-1);
  });
}

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('btnSound').textContent = soundOn ? '🔊' : '🔇';
  if (!soundOn) {
    window.speechSynthesis?.cancel();
  } else {
    // Đọc lại câu chuyện hiện tại khi bật
    const photos = appData.photos[currentFid] || [];
    const ph = photos[currentIdx];
    if (ph?.story && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(ph.story);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }
}

function openMascot() {
  if (!currentFid) return;
  const photos = appData.photos[currentFid] || [];
  if (!photos.length) { showToast('No photos yet!'); return; }
  const ph = photos[currentIdx];

  document.getElementById('mascotDate').textContent = ph.date ? `📅 ${ph.date}` : `Image ${currentIdx+1}`;

  const panel = document.getElementById('mascotPanel');
  panel.classList.remove('open');
  void panel.offsetWidth;

  document.getElementById('mascotBackdrop').classList.add('open');
  panel.classList.add('open');

  // Hàm đọc 
  if (ph.story && window.speechSynthesis && soundOn) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ph.story);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  const b = document.getElementById('speechBubble');
  b.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  setTimeout(() => {
    b.innerHTML = ph.story
      ? `"${ph.story}"`
      : `<em style="color:var(--muted);font-size:13px">No stories yet</em>`;
  }, 1100);
}

function closeMascot() {
  document.getElementById('mascotPanel').classList.remove('open');
  document.getElementById('mascotBackdrop').classList.remove('open');
  window.speechSynthesis?.cancel();
}


function copyText(text, msg) {
  navigator.clipboard?.writeText(text).then(() => showToast(msg)).catch(()=>{});
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function createStars() {
  const c = document.getElementById('stars');
  for (let i=0; i<80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random()*2+.4;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--d:${(Math.random()*4+2).toFixed(1)}s;--dl:${(Math.random()*5).toFixed(1)}s;--o:${(Math.random()*.55+.25).toFixed(2)}`;
    c.appendChild(s);
  }
}

function updateClock() {
  const n = new Date();
  document.getElementById('clock').innerHTML =
    `<div>${n.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>
     <div style="font-size:10px">${n.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'})}</div>`;
}

document.addEventListener('keydown', e => {
  if (e.key==='Escape') { closeMascot(); closeFolder(); return; }
  if (!currentFid) return;
  if (e.key==='ArrowLeft')  goTo(currentIdx-1);
  if (e.key==='ArrowRight') goTo(currentIdx+1);
});

window.addEventListener('resize', () => {
  const w = document.getElementById('mainWin');
  if (!w || window.innerWidth <= 700) return;
  const ww = Math.min(860, window.innerWidth-24);
  w.style.width = ww + 'px';
  w.style.left  = Math.max(12, (window.innerWidth-ww)/2) + 'px';
});

createStars();
updateClock();
setInterval(updateClock, 1000);
loadData();