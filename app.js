const STORAGE_KEY = 'blood-pressure-records';

const form = document.querySelector('#recordForm');
const recordList = document.querySelector('#recordList');
const emptyState = document.querySelector('#emptyState');
const recordCount = document.querySelector('#recordCount');
const clearAllButton = document.querySelector('#clearAllButton');
const formError = document.querySelector('#formError');
const todayLabel = document.querySelector('#todayLabel');

let records = loadRecords();
todayLabel.textContent = formatDate(new Date(), { month: 'long', day: 'numeric' });
renderRecords();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  const formData = new FormData(form);
  const systolic = Number(formData.get('systolic'));
  const diastolic = Number(formData.get('diastolic'));
  const pulse = Number(formData.get('pulse'));
  const medication = formData.get('medication');

  if (systolic <= diastolic) {
    formError.textContent = '收縮壓通常應高於舒張壓，請確認輸入數值。';
    return;
  }

  if (!medication) {
    formError.textContent = '請選擇藥物治療狀態。';
    return;
  }

  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    systolic,
    diastolic,
    pulse,
    medication,
    notes: String(formData.get('notes') || '').trim(),
    recordedAt: new Date().toISOString()
  };

  records.unshift(record);
  saveRecords();
  renderRecords();
  form.reset();
});

recordList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');
  if (!deleteButton) return;

  records = records.filter((record) => record.id !== deleteButton.dataset.deleteId);
  saveRecords();
  renderRecords();
});

clearAllButton.addEventListener('click', () => {
  if (!records.length || !window.confirm('確定要清除全部血壓紀錄嗎？')) return;
  records = [];
  saveRecords();
  renderRecords();
});

function renderRecords() {
  recordList.innerHTML = '';
  recordCount.textContent = records.length;
  emptyState.hidden = records.length > 0;
  clearAllButton.hidden = records.length === 0;

  records.forEach((record) => {
    const item = document.createElement('article');
    item.className = 'record-item';
    item.innerHTML = `
      <div>
        <div class="record-main">
          <strong class="blood-pressure">${record.systolic}<small> / </small>${record.diastolic}<small> mmHg</small></strong>
          <span class="pulse-value">脈搏 ${record.pulse} bpm</span>
        </div>
        <div class="record-meta">
          <time datetime="${record.recordedAt}">${formatDate(new Date(record.recordedAt), { dateStyle: 'medium', timeStyle: 'short' })}</time>
          <span class="medication-tag">${escapeHtml(record.medication)}</span>
        </div>
        ${record.notes ? `<p class="record-notes">${escapeHtml(record.notes)}</p>` : ''}
      </div>
      <button class="delete-button" type="button" data-delete-id="${record.id}" aria-label="刪除這筆紀錄" title="刪除紀錄">×</button>
    `;
    recordList.append(item);
  });
}

function loadRecords() {
  try {
    const savedRecords = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedRecords) ? savedRecords : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat('zh-TW', options).format(date);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}
