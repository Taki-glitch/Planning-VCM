/**
 * VCM PLANNER — Application JavaScript
 * Gestion des formulaires, sauvegarde locale, aperçu et export PDF
 */

// ============================================================
// STATE
// ============================================================
let sessions = JSON.parse(localStorage.getItem('vcm_sessions') || '[]');
let currentSessionId = null;
let serviceParts = [];
let christianParts = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('meeting-date').value = today;

  loadSettings();
  renderSessions();
  addDefaultServiceParts();
  addDefaultChristianParts();

  // Tab navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Toolbar
  document.getElementById('save-btn').addEventListener('click', saveSession);
  document.getElementById('preview-btn').addEventListener('click', openPreview);
  document.getElementById('export-btn').addEventListener('click', exportPDF);
  document.getElementById('export-from-preview').addEventListener('click', exportPDF);

  // Dynamic parts
  document.getElementById('add-service-part').addEventListener('click', () => addServicePart());
  document.getElementById('add-christian-part').addEventListener('click', () => addChristianPart());

  // Sessions tab
  document.getElementById('new-session-btn').addEventListener('click', newSession);
  document.getElementById('new-session-btn2').addEventListener('click', newSession);

  // Settings
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

  // Modal close
  document.getElementById('close-preview').addEventListener('click', closePreview);
  document.getElementById('close-preview2').addEventListener('click', closePreview);
  document.querySelector('.modal-backdrop').addEventListener('click', closePreview);
});

// ============================================================
// TABS
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const tab = document.getElementById(`tab-${tabName}`);
  tab.classList.remove('hidden');
  tab.classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'sessions') renderSessionsGrid();
}

// ============================================================
// DEFAULT PARTS
// ============================================================
function addDefaultServiceParts() {
  addServicePart({ title: 'Commencez la conversation', duration: 3, type: 'eleve', hasHelper: true });
  addServicePart({ title: 'Développez l\'intérêt', duration: 4, type: 'eleve', hasHelper: true });
  addServicePart({ title: 'Préparez des disciples', duration: 5, type: 'eleve', hasHelper: true });
}

function addDefaultChristianParts() {
  addChristianPart({ title: '', duration: 6, type: 'discours' });
}

// ============================================================
// DYNAMIC SERVICE PARTS
// ============================================================
let servicePartId = 0;
function addServicePart(data = {}) {
  const id = ++servicePartId;
  serviceParts.push(id);
  const container = document.getElementById('service-parts-container');
  const div = document.createElement('div');
  div.className = 'part-block';
  div.dataset.partId = id;

  div.innerHTML = `
    <div class="part-label">Partie ministère #${serviceParts.length}</div>
    <button type="button" class="btn-danger part-remove" onclick="removeServicePart(${id})">✕ Supprimer</button>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Type de partie</label>
        <select class="sp-type">
          <option value="eleve" ${data.type === 'eleve' ? 'selected' : ''}>Élève (avec assistant)</option>
          <option value="discours" ${data.type === 'discours' ? 'selected' : ''}>Discours (orateur seul)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Durée (min)</label>
        <input type="number" class="sp-duration" value="${data.duration || 4}" min="1" max="60"/>
      </div>
    </div>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Titre / Activité</label>
        <input type="text" class="sp-title" value="${data.title || ''}" placeholder="ex: Commencez la conversation"/>
      </div>
    </div>
    <div class="form-group">
      <label>Élève / Orateur</label>
      <input type="text" class="sp-student" value="${data.student || ''}" placeholder="Nom Prénom"/>
    </div>
    <div class="helpers-area">
      <label>Assistants</label>
      <div class="helpers-list sp-helpers">
        ${(data.helpers || []).map(h => makeHelperInput(h)).join('')}
        <button type="button" class="add-helper-btn" onclick="addHelper(this)">+ Assistant</button>
      </div>
    </div>
  `;
  container.appendChild(div);
}

function removeServicePart(id) {
  const el = document.querySelector(`#service-parts-container [data-part-id="${id}"]`);
  if (el) el.remove();
  serviceParts = serviceParts.filter(x => x !== id);
}

// ============================================================
// DYNAMIC CHRISTIAN PARTS
// ============================================================
let christianPartId = 0;
function addChristianPart(data = {}) {
  const id = ++christianPartId;
  christianParts.push(id);
  const container = document.getElementById('christian-parts-container');
  const div = document.createElement('div');
  div.className = 'part-block';
  div.dataset.partId = id;

  div.innerHTML = `
    <div class="part-label">Partie vie chrétienne #${christianParts.length}</div>
    <button type="button" class="btn-danger part-remove" onclick="removeChristianPart(${id})">✕ Supprimer</button>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Titre du discours / de la partie</label>
        <input type="text" class="cp-title" value="${data.title || ''}" placeholder="Titre de la partie"/>
      </div>
      <div class="form-group">
        <label>Durée (min)</label>
        <input type="number" class="cp-duration" value="${data.duration || 6}" min="1" max="60"/>
      </div>
    </div>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Orateur</label>
        <input type="text" class="cp-speaker" value="${data.speaker || ''}" placeholder="Nom Prénom"/>
      </div>
    </div>
  `;
  container.appendChild(div);
}

function removeChristianPart(id) {
  const el = document.querySelector(`#christian-parts-container [data-part-id="${id}"]`);
  if (el) el.remove();
  christianParts = christianParts.filter(x => x !== id);
}

// ============================================================
// HELPERS
// ============================================================
function makeHelperInput(value = '') {
  return `<div style="display:flex;align-items:center;gap:4px;">
    <input type="text" class="helper-input" value="${value}" placeholder="Nom Prénom"/>
    <button type="button" class="remove-helper-btn" onclick="removeHelper(this)">×</button>
  </div>`;
}

function addHelper(btn) {
  const list = btn.closest('.helpers-list');
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;';
  wrapper.innerHTML = `<input type="text" class="helper-input" placeholder="Nom Prénom"/>
    <button type="button" class="remove-helper-btn" onclick="removeHelper(this)">×</button>`;
  list.insertBefore(wrapper, btn);
}

function removeHelper(btn) {
  btn.parentElement.remove();
}

// ============================================================
// COLLECT FORM DATA
// ============================================================
function collectFormData() {
  const date = document.getElementById('meeting-date').value;
  const day = document.getElementById('meeting-day').value;

  // Service parts
  const servicePartsData = [];
  document.querySelectorAll('#service-parts-container .part-block').forEach(block => {
    const helpers = [];
    block.querySelectorAll('.sp-helpers .helper-input').forEach(inp => {
      if (inp.value.trim()) helpers.push(inp.value.trim());
    });
    servicePartsData.push({
      title: block.querySelector('.sp-title')?.value || '',
      duration: parseInt(block.querySelector('.sp-duration')?.value) || 4,
      type: block.querySelector('.sp-type')?.value || 'eleve',
      student: block.querySelector('.sp-student')?.value || '',
      helpers,
    });
  });

  // Christian parts
  const christianPartsData = [];
  document.querySelectorAll('#christian-parts-container .part-block').forEach(block => {
    christianPartsData.push({
      title: block.querySelector('.cp-title')?.value || '',
      duration: parseInt(block.querySelector('.cp-duration')?.value) || 6,
      speaker: block.querySelector('.cp-speaker')?.value || '',
    });
  });

  return {
    id: currentSessionId || Date.now().toString(),
    congregation: document.getElementById('congregation').value,
    date,
    day,
    bibleReading: document.getElementById('bible-reading').value,
    chairman: document.getElementById('chairman').value,
    startTime: document.getElementById('start-time').value,
    songOpen: document.getElementById('song-open').value,
    prayerOpen: document.getElementById('prayer-open').value,
    t1Title: document.getElementById('t1-title').value,
    t1Duration: parseInt(document.getElementById('t1-duration').value) || 10,
    t1Speaker: document.getElementById('t1-speaker').value,
    t2Duration: parseInt(document.getElementById('t2-duration').value) || 10,
    t2Speaker: document.getElementById('t2-speaker').value,
    t3Duration: parseInt(document.getElementById('t3-duration').value) || 4,
    t3Student: document.getElementById('t3-student').value,
    serviceParts: servicePartsData,
    songMiddle: document.getElementById('song-middle').value,
    christianParts: christianPartsData,
    studyDuration: parseInt(document.getElementById('study-duration').value) || 30,
    studyConductor: document.getElementById('study-conductor').value,
    studyReader: document.getElementById('study-reader').value,
    closingDuration: parseInt(document.getElementById('closing-duration').value) || 3,
    songClose: document.getElementById('song-close').value,
    prayerClose: document.getElementById('prayer-close').value,
  };
}

// ============================================================
// LOAD FORM DATA
// ============================================================
function loadFormData(data) {
  document.getElementById('congregation').value = data.congregation || '';
  document.getElementById('meeting-date').value = data.date || '';
  document.getElementById('meeting-day').value = data.day || 'MERCREDI';
  document.getElementById('bible-reading').value = data.bibleReading || '';
  document.getElementById('chairman').value = data.chairman || '';
  document.getElementById('start-time').value = data.startTime || '19:00';
  document.getElementById('song-open').value = data.songOpen || '';
  document.getElementById('prayer-open').value = data.prayerOpen || '';
  document.getElementById('t1-title').value = data.t1Title || '';
  document.getElementById('t1-duration').value = data.t1Duration || 10;
  document.getElementById('t1-speaker').value = data.t1Speaker || '';
  document.getElementById('t2-duration').value = data.t2Duration || 10;
  document.getElementById('t2-speaker').value = data.t2Speaker || '';
  document.getElementById('t3-duration').value = data.t3Duration || 4;
  document.getElementById('t3-student').value = data.t3Student || '';
  document.getElementById('song-middle').value = data.songMiddle || '';
  document.getElementById('study-duration').value = data.studyDuration || 30;
  document.getElementById('study-conductor').value = data.studyConductor || '';
  document.getElementById('study-reader').value = data.studyReader || '';
  document.getElementById('closing-duration').value = data.closingDuration || 3;
  document.getElementById('song-close').value = data.songClose || '';
  document.getElementById('prayer-close').value = data.prayerClose || '';

  // Clear and reload service parts
  document.getElementById('service-parts-container').innerHTML = '';
  serviceParts = [];
  servicePartId = 0;
  (data.serviceParts || []).forEach(p => addServicePartFromData(p));

  // Clear and reload christian parts
  document.getElementById('christian-parts-container').innerHTML = '';
  christianParts = [];
  christianPartId = 0;
  (data.christianParts || []).forEach(p => addChristianPartFromData(p));

  currentSessionId = data.id;
  updateSessionTitle(data);
}

function addServicePartFromData(data) {
  const id = ++servicePartId;
  serviceParts.push(id);
  const container = document.getElementById('service-parts-container');
  const div = document.createElement('div');
  div.className = 'part-block';
  div.dataset.partId = id;
  div.innerHTML = `
    <div class="part-label">Partie ministère #${serviceParts.length}</div>
    <button type="button" class="btn-danger part-remove" onclick="removeServicePart(${id})">✕ Supprimer</button>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Type de partie</label>
        <select class="sp-type">
          <option value="eleve" ${data.type === 'eleve' ? 'selected' : ''}>Élève (avec assistant)</option>
          <option value="discours" ${data.type === 'discours' ? 'selected' : ''}>Discours (orateur seul)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Durée (min)</label>
        <input type="number" class="sp-duration" value="${data.duration || 4}" min="1" max="60"/>
      </div>
    </div>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Titre / Activité</label>
        <input type="text" class="sp-title" value="${data.title || ''}" placeholder="ex: Commencez la conversation"/>
      </div>
    </div>
    <div class="form-group">
      <label>Élève / Orateur</label>
      <input type="text" class="sp-student" value="${data.student || ''}" placeholder="Nom Prénom"/>
    </div>
    <div class="helpers-area">
      <label>Assistants</label>
      <div class="helpers-list sp-helpers">
        ${(data.helpers || []).map(h => makeHelperInput(h)).join('')}
        <button type="button" class="add-helper-btn" onclick="addHelper(this)">+ Assistant</button>
      </div>
    </div>
  `;
  container.appendChild(div);
}

function addChristianPartFromData(data) {
  const id = ++christianPartId;
  christianParts.push(id);
  const container = document.getElementById('christian-parts-container');
  const div = document.createElement('div');
  div.className = 'part-block';
  div.dataset.partId = id;
  div.innerHTML = `
    <div class="part-label">Partie vie chrétienne #${christianParts.length}</div>
    <button type="button" class="btn-danger part-remove" onclick="removeChristianPart(${id})">✕ Supprimer</button>
    <div class="form-grid-3">
      <div class="form-group col-span-2">
        <label>Titre du discours / de la partie</label>
        <input type="text" class="cp-title" value="${data.title || ''}" placeholder="Titre de la partie"/>
      </div>
      <div class="form-group">
        <label>Durée (min)</label>
        <input type="number" class="cp-duration" value="${data.duration || 6}" min="1" max="60"/>
      </div>
    </div>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Orateur</label>
        <input type="text" class="cp-speaker" value="${data.speaker || ''}" placeholder="Nom Prénom"/>
      </div>
    </div>
  `;
  container.appendChild(div);
}

// ============================================================
// SAVE / LOAD SESSIONS
// ============================================================
function saveSession() {
  const data = collectFormData();
  const idx = sessions.findIndex(s => s.id === data.id);
  if (idx >= 0) {
    sessions[idx] = data;
  } else {
    sessions.push(data);
  }
  currentSessionId = data.id;
  localStorage.setItem('vcm_sessions', JSON.stringify(sessions));
  updateSessionTitle(data);
  showToast('Séance sauvegardée ✓');
}

function newSession() {
  currentSessionId = null;
  document.getElementById('meeting-form').reset();
  document.getElementById('service-parts-container').innerHTML = '';
  document.getElementById('christian-parts-container').innerHTML = '';
  serviceParts = [];
  christianParts = [];
  servicePartId = 0;
  christianPartId = 0;
  addDefaultServiceParts();
  addDefaultChristianParts();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('meeting-date').value = today;
  loadSettings(true);
  document.getElementById('current-session-title').textContent = 'Nouvelle séance';
  switchTab('editor');
}

function loadSession(id) {
  const session = sessions.find(s => s.id === id);
  if (session) {
    loadFormData(session);
    switchTab('editor');
  }
}

function deleteSession(id) {
  if (!confirm('Supprimer cette séance ?')) return;
  sessions = sessions.filter(s => s.id !== id);
  localStorage.setItem('vcm_sessions', JSON.stringify(sessions));
  renderSessionsGrid();
  renderSessions();
}

function renderSessions() {
  const container = document.getElementById('saved-sessions');
  container.innerHTML = '';
  sessions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'session-item';
    div.innerHTML = `<div>${formatDateLabel(s)}</div><div class="s-date">${s.date || ''}</div>`;
    div.addEventListener('click', () => loadSession(s.id));
    container.appendChild(div);
  });
}

function renderSessionsGrid() {
  const container = document.getElementById('sessions-grid');
  container.innerHTML = '';
  if (sessions.length === 0) {
    container.innerHTML = '<p style="color:#888;padding:20px">Aucune séance sauvegardée.</p>';
    return;
  }
  sessions.forEach(s => {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <h4>${formatDateLabel(s)}</h4>
      <p>${s.bibleReading || 'Lecture non définie'}</p>
      <p>Président : ${s.chairman || '—'}</p>
      <div class="card-actions">
        <button class="btn-secondary" onclick="loadSession('${s.id}')">✏️ Éditer</button>
        <button class="btn-danger" onclick="deleteSession('${s.id}')">🗑 Supprimer</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function updateSessionTitle(data) {
  document.getElementById('current-session-title').textContent = formatDateLabel(data);
}

function formatDateLabel(data) {
  if (!data.date) return 'Séance sans date';
  const d = new Date(data.date + 'T00:00:00');
  return `${data.day || ''} ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`;
}

// ============================================================
// SETTINGS
// ============================================================
function saveSettings() {
  const settings = {
    congregation: document.getElementById('default-congregation').value,
    startTime: document.getElementById('default-start-time').value,
  };
  localStorage.setItem('vcm_settings', JSON.stringify(settings));
  showToast('Paramètres sauvegardés ✓');
}

function loadSettings(applyToForm = false) {
  const settings = JSON.parse(localStorage.getItem('vcm_settings') || '{}');
  document.getElementById('default-congregation').value = settings.congregation || '';
  document.getElementById('default-start-time').value = settings.startTime || '19:00';
  if (applyToForm || settings.congregation) {
    if (settings.congregation) document.getElementById('congregation').value = settings.congregation;
    if (settings.startTime) document.getElementById('start-time').value = settings.startTime;
  }
}

// ============================================================
// TIME CALCULATOR
// ============================================================
function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// ============================================================
// DOCUMENT GENERATION (HTML preview)
// ============================================================
function generateDocumentHTML(data) {
  let cursor = data.startTime || '19:00';
  const rows = [];

  const tr = (time, title, person, duration, className = '', helperLines = '') => {
    const durationLabel = duration ? `(${duration} min.)` : '';
    return `<tr class="${className}">
      <td class="col-time">${time}</td>
      <td class="col-title">${title}${helperLines}</td>
      <td class="col-person">${person || ''}</td>
      <td class="col-duration">${durationLabel}</td>
    </tr>`;
  };

  const sectionHeader = (label, cls) =>
    `<tr class="doc-section-header ${cls}"><td colspan="4">${label}</td></tr>`;

  const songRow = (num, person = '') =>
    `<tr class="doc-song-row"><td class="col-time">${cursor}</td><td colspan="2">Cantique ${num || '—'}</td><td class="col-person">${person}</td></tr>`;

  // Opening song
  rows.push(songRow(data.songOpen));
  if (data.songOpen) cursor = addMinutes(cursor, 1); // ~1 min for song

  // Prayer
  rows.push(tr(cursor, 'Prière', data.prayerOpen || '', ''));
  cursor = addMinutes(cursor, 1);

  // Opening remarks
  rows.push(tr(cursor, 'Remarques introductives', data.chairman || '', 1));
  cursor = addMinutes(cursor, 1);

  // === TREASURES ===
  rows.push(sectionHeader('TRÉSORS TIRÉS DE LA PAROLE DE DIEU', 'doc-sec-treasures'));

  rows.push(tr(cursor, `1. ${data.t1Title || '(titre du discours)'}`, data.t1Speaker || '', data.t1Duration));
  cursor = addMinutes(cursor, data.t1Duration || 10);

  rows.push(tr(cursor, '2. Perles spirituelles', data.t2Speaker || '', data.t2Duration));
  cursor = addMinutes(cursor, data.t2Duration || 10);

  rows.push(tr(cursor, '3. Lecture de la Bible', `Élève : ${data.t3Student || ''}`, data.t3Duration));
  cursor = addMinutes(cursor, data.t3Duration || 4);

  // === SERVICE ===
  rows.push(sectionHeader('APPROFONDISSONS NOS APTITUDES POUR LE MINISTÈRE', 'doc-sec-service'));

  (data.serviceParts || []).forEach((part, i) => {
    let helperLines = '';
    if (part.helpers && part.helpers.length > 0) {
      helperLines = `<span class="doc-helpers"><span class="doc-helper-label">Assistant(s) : </span>${part.helpers.join(', ')}</span>`;
    }
    const personLabel = part.type === 'eleve'
      ? `Élève : ${part.student || ''}`
      : part.student || '';
    rows.push(tr(cursor, `${i + 4}. ${part.title || ''}`, personLabel, part.duration, '', helperLines));
    cursor = addMinutes(cursor, part.duration || 4);
  });

  // === CHRISTIAN LIFE ===
  rows.push(sectionHeader('NOTRE VIE CHRÉTIENNE', 'doc-sec-christian'));

  // Middle song
  const songMiddleTime = cursor;
  rows.push(`<tr class="doc-song-row"><td class="col-time">${songMiddleTime}</td><td colspan="3">Cantique ${data.songMiddle || '—'}</td></tr>`);
  cursor = addMinutes(cursor, 5);

  const offset = (data.serviceParts || []).length + 4;
  (data.christianParts || []).forEach((part, i) => {
    rows.push(tr(cursor, `${i + offset}. ${part.title || ''}`, part.speaker || '', part.duration));
    cursor = addMinutes(cursor, part.duration || 6);
  });

  // Congregation Bible Study
  const studyIdx = offset + (data.christianParts || []).length;
  rows.push(tr(
    cursor,
    `${studyIdx}. Étude de la Bible en congrégation`,
    `Conducteur : ${data.studyConductor || ''}<span class="doc-helpers"><span class="doc-helper-label">Lecteur : </span>${data.studyReader || ''}</span>`,
    data.studyDuration
  ));
  cursor = addMinutes(cursor, data.studyDuration || 30);

  // Closing remarks
  rows.push(tr(cursor, 'Remarques finales', data.chairman || '', data.closingDuration, 'doc-closing-row'));
  cursor = addMinutes(cursor, data.closingDuration || 3);

  // Closing song
  rows.push(`<tr class="doc-song-row"><td class="col-time">${cursor}</td><td colspan="2">Cantique ${data.songClose || '—'}</td><td class="col-person">${data.prayerClose || ''}</td></tr>`);

  // Date label
  const dateLabel = (() => {
    if (!data.date) return '';
    const d = new Date(data.date + 'T00:00:00');
    const formatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    return `${data.day || ''}, ${formatted} | ${(data.bibleReading || '').toUpperCase()}`;
  })();

  return `
    <div class="preview-page">
      <div class="doc-congregation-name">${data.congregation || 'CONGRÉGATION'}</div>
      <div class="doc-sub-title">Programme de la réunion en semaine</div>
      <div class="doc-date-row">
        <span>${dateLabel}</span>
        <span>Président : ${data.chairman || ''}</span>
      </div>
      <table class="doc-table">
        <colgroup>
          <col style="width:48px"/>
          <col/>
          <col style="width:170px"/>
          <col style="width:55px"/>
        </colgroup>
        <tbody>
          ${rows.join('\n')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// PREVIEW
// ============================================================
function openPreview() {
  const data = collectFormData();
  const html = generateDocumentHTML(data);
  document.getElementById('preview-container').innerHTML = html;
  document.getElementById('preview-modal').classList.remove('hidden');
}

function closePreview() {
  document.getElementById('preview-modal').classList.add('hidden');
}

// ============================================================
// PDF EXPORT (jsPDF + html2canvas approach via DOM)
// ============================================================
function exportPDF() {
  const data = collectFormData();
  const html = generateDocumentHTML(data);

  // Create hidden iframe for print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Programme VCM</title>
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: Arial, sans-serif; }

        .preview-page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm 14mm 18mm;
          font-family: Arial, sans-serif;
          font-size: 9pt;
          background: #fff;
          box-sizing: border-box;
        }

        .doc-congregation-name {
          background: #1a2744;
          color: #fff;
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          letter-spacing: 2px;
          padding: 6px 10px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .doc-sub-title {
          background: #1a2744;
          color: #c8b97a;
          text-align: center;
          font-size: 9pt;
          padding: 3px 10px 5px;
          letter-spacing: 1px;
          margin-bottom: 6px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .doc-date-row {
          background: #1a2744;
          color: #fff;
          padding: 5px 10px;
          font-size: 10pt;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .doc-table {
          width: 100%;
          border-collapse: collapse;
        }
        .doc-table td {
          padding: 3px 6px;
          font-size: 8.5pt;
          vertical-align: top;
          border-bottom: 1px solid #eee;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .col-time { width: 45px; color: #444; white-space: nowrap; }
        .col-person { width: 160px; text-align: right; color: #333; }
        .col-duration { width: 50px; text-align: right; color: #666; font-size: 8pt; white-space: nowrap; }

        .doc-section-header td {
          font-weight: bold;
          font-size: 9pt;
          padding: 5px 6px 3px;
          border-bottom: none;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .doc-sec-treasures td { background: #6b3010 !important; color: #fff !important; }
        .doc-sec-service td { background: #8B6914 !important; color: #fff !important; }
        .doc-sec-christian td { background: #2a2a2a !important; color: #fff !important; }

        .doc-song-row td { font-style: italic; background: #f0ede4 !important; color: #444; }
        .doc-closing-row td { background: #f0ede4 !important; }

        .doc-helpers {
          font-size: 7.5pt;
          color: #555;
          display: block;
          margin-top: 1px;
          padding-left: 6px;
        }
        .doc-helper-label { color: #888; font-weight: bold; }

        @page { size: A4; margin: 0; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 600);
}

// ============================================================
// TOAST
// ============================================================
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; background:#1a2744; color:#fff;
      padding:12px 20px; border-radius:6px; font-size:14px; z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,0.25); transition:opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
