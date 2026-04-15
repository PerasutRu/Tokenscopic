/* ============================
   Tokenscopic — Frontend Logic
   ============================ */

// Same host, port 8000 — works with Docker, LAN IPs, and 127.0.0.1 (not only "localhost").
const API_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const { protocol, hostname } = window.location;
  if (!hostname) return 'http://localhost:8000';
  return `${protocol}//${hostname}:8000`;
})();

/** Strip HF-style secrets before showing server-derived text in the UI. */
function redactSecretsForDisplay(s) {
  if (s == null || typeof s !== 'string') return s;
  return s
    .replace(/hf_[A-Za-z0-9_-]{10,}/gi, '[REDACTED_HF_TOKEN]')
    .replace(/\bBearer\s+[A-Za-z0-9_.~+/=-]+\b/gi, 'Bearer [REDACTED]');
}

// Token color palette (dark-mode friendly)
const TOKEN_COLORS = [
  { bg: 'rgba(124, 58, 237, 0.25)', border: 'rgba(124, 58, 237, 0.55)', text: 'var(--tok-c1)' },
  { bg: 'rgba(8, 145, 178, 0.25)',  border: 'rgba(8, 145, 178, 0.55)',  text: 'var(--tok-c2)' },
  { bg: 'rgba(5, 150, 105, 0.25)',  border: 'rgba(5, 150, 105, 0.55)',  text: 'var(--tok-c3)' },
  { bg: 'rgba(217, 119, 6, 0.25)',  border: 'rgba(217, 119, 6, 0.55)',  text: 'var(--tok-c4)' },
  { bg: 'rgba(220, 38, 38, 0.25)',  border: 'rgba(220, 38, 38, 0.55)',  text: 'var(--tok-c5)' },
  { bg: 'rgba(219, 39, 119, 0.25)', border: 'rgba(219, 39, 119, 0.55)', text: 'var(--tok-c6)' },
  { bg: 'rgba(37, 99, 235, 0.25)',  border: 'rgba(37, 99, 235, 0.55)',  text: 'var(--tok-c7)' },
  { bg: 'rgba(101, 163, 13, 0.25)', border: 'rgba(101, 163, 13, 0.55)', text: 'var(--tok-c8)' },
];

// ——— DOM Elements ———
const appWrapper     = document.querySelector('.app-wrapper');
const mainContainer  = document.getElementById('main-container');
const modeSingle     = document.getElementById('mode-single');
const modeCompare    = document.getElementById('mode-compare');
const realtimeToggle = document.getElementById('realtime-toggle');

const hfTokenInput   = document.getElementById('hf-token');
const hfTokenSection = document.getElementById('hf-token-section');
const toggleTokenBtn = document.getElementById('toggle-token');
const inputText      = document.getElementById('input-text');
const analyzeBtn     = document.getElementById('analyze-btn');
const btnContent     = analyzeBtn.querySelector('.btn-content');
const btnLoader      = analyzeBtn.querySelector('.btn-loader');
const charCountEl    = document.getElementById('char-count');
const themeToggleBtn = document.getElementById('theme-toggle');

const modelBGroup    = document.getElementById('model-b-group');
const mainConfigGrid = document.getElementById('main-config-grid');
const resultsColumns = document.getElementById('results-columns');
const resultColB     = document.getElementById('result-col-b');
const badgeModelA    = document.getElementById('badge-model-a');
const hfResultsA     = document.getElementById('hf-search-results-a');
const hfResultsB     = document.getElementById('hf-search-results-b');

const tooltip        = document.getElementById('token-tooltip');
const ttId           = document.getElementById('tt-id');
const ttStr          = document.getElementById('tt-str');
const ttBytes        = document.getElementById('tt-bytes');
const ttIdx          = document.getElementById('tt-idx');

// Configuration for Model A and B
const MD_A = {
    suffix: '',
    input: document.getElementById('model-id'),
    results: document.getElementById('hf-search-results-a'),
    status: document.getElementById('tokenizer-status'),
    errorCard: document.getElementById('error-card'),
    errorMsg: document.getElementById('error-message'),
    resultsPanel: document.getElementById('results-panel'),
    statTokens: document.getElementById('stat-tokens'),
    statChars: document.getElementById('stat-chars'),
    statRatio: document.getElementById('stat-ratio'),
    statVocab: document.getElementById('stat-vocab'),
    infoModel: document.getElementById('info-model'),
    infoType: document.getElementById('info-type'),
    infoRuntimeType: document.getElementById('info-runtime-type'),
    tokenDisplay: document.getElementById('token-display'),
    tokenTableBody: document.getElementById('token-table-body'),
    idsDisplay: document.getElementById('ids-display'),
    tabVisual: document.getElementById('tab-visual'),
    tabTable: document.getElementById('tab-table'),
    tabIds: document.getElementById('tab-ids'),
    viewVisual: document.getElementById('view-visual'),
    viewTable: document.getElementById('view-table'),
    viewIds: document.getElementById('view-ids'),
    copyIds: document.getElementById('copy-ids-btn'),
    processingIndicator: document.getElementById('result-processing-a'),
    currentTokens: [],
    activeSearchIndex: -1
};

const MD_B = {
    suffix: '-b',
    input: document.getElementById('model-id-b'),
    results: document.getElementById('hf-search-results-b'),
    status: document.getElementById('tokenizer-status-b'),
    errorCard: document.getElementById('error-card-b'),
    errorMsg: document.getElementById('error-message-b'),
    resultsPanel: document.getElementById('results-panel-b'),
    statTokens: document.getElementById('stat-tokens-b'),
    statChars: document.getElementById('stat-chars-b'),
    statRatio: document.getElementById('stat-ratio-b'),
    statVocab: document.getElementById('stat-vocab-b'),
    infoModel: document.getElementById('info-model-b'),
    infoType: document.getElementById('info-type-b'),
    infoRuntimeType: document.getElementById('info-runtime-type-b'),
    tokenDisplay: document.getElementById('token-display-b'),
    tokenTableBody: document.getElementById('token-table-body-b'),
    idsDisplay: document.getElementById('ids-display-b'),
    tabVisual: document.getElementById('tab-visual-b'),
    tabTable: document.getElementById('tab-table-b'),
    tabIds: document.getElementById('tab-ids-b'),
    viewVisual: document.getElementById('view-visual-b'),
    viewTable: document.getElementById('view-table-b'),
    viewIds: document.getElementById('view-ids-b'),
    copyIds: document.getElementById('copy-ids-btn-b'),
    processingIndicator: document.getElementById('result-processing-b'),
    currentTokens: [],
    activeSearchIndex: -1
};

let checkDebounceTimerA = null;
let checkDebounceTimerB = null;
let realtimeDebounceTimer = null;
let tokenNeeded = false;
let tokenNeededByA = false;
let tokenNeededByB = false;
let isCompareMode = false;
let cachedModelIds = [];
let modelSearchTimerA = null;
let modelSearchTimerB = null;

function updateModelLabels() {
  const labelA = document.getElementById('label-model-a');
  const labelB = document.getElementById('label-model-b');
  const t = TRANSLATIONS[currentLang];
  if (!labelA || !t) return;
  if (isCompareMode) {
    labelA.textContent = t.modelLabelA;
    if (labelB) labelB.textContent = t.modelLabelB;
  } else {
    labelA.textContent = t.modelLabelSingle;
    if (labelB) labelB.textContent = t.modelLabelB;
  }
}

// ——— i18n Dictionary ———
const TRANSLATIONS = {
  th: {
    modeSingle:      'แบบเดี่ยว (Single)',
    modeCompare:     'เปรียบเทียบ (Compare)',
    realtimeToggle:  'Real-time & แยกหน้าจอ',
    configTitle:     'ตั้งค่าการเชื่อมต่อ',
    required:        'จำเป็น',
    tokenHint:       'Model นี้ต้องการ Access Token ไม่มี Token? สร้างได้ที่',
    quickSelect:     'Quick select:',
    hfSearchPlaceholder: 'พิมพ์เพื่อค้นหาโมเดล หรือคลิกเพื่อดูโมเดลในระบบ',
    hfSearchLoading: 'กำลังค้นหา...',
    hfSearchEmpty:   'ไม่พบโมเดลที่ตรงคำค้น',
    hfSearchCachedBadge: 'cached',
    cachedSectionTitle: 'โมเดลในระบบ',
    searchSectionTitle: 'ผลค้นหาจาก HuggingFace',
    modelListEmpty:  'ยังไม่มีโมเดลในระบบ',
    inputTitle:      'ใส่ข้อความที่ต้องการ Tokenize',
    characters:      'ตัวอักษร',
    exampleLabel:    'ตัวอย่าง:',
    tokenizeBtn:     'Tokenize Now',
    tokenizingLabel: 'กำลัง Tokenize...',
    errorTitle:      'เกิดข้อผิดพลาด',
    resultsTitle:    'ผลลัพธ์การ Tokenize',
    legendTitle:     'สีแต่ละ Token:',
    legendHint:      'Hover เพื่อดูรายละเอียด',
    tooltipHeader:   'Token Detail',
    ttString:        'String:',
    ttBytes:         'Raw:',
    ttIndex:         'Index:',
    checking:        (m) => `กำลังตรวจสอบ tokenizer สำหรับ <strong>${m}</strong>…`,
    cached:          'พบ Tokenizer ที่บันทึกไว้แล้ว — พร้อมใช้งานทันที',
    download:        'ยังไม่มี Tokenizer — จะโหลดจาก HuggingFace อัตโนมัติ',
    tokenRequired:   'Model นี้ <strong>private / gated</strong> — กรุณาใส่ HuggingFace Access Token',
    afterCached:     'Tokenizer พร้อมใช้งาน — บันทึก cache ไว้แล้ว ครั้งหน้าไม่ต้องโหลดใหม่',
    noBackend:       'ไม่สามารถเชื่อมต่อ Backend ได้ กรุณารัน: cd backend && uvicorn main:app --reload',
    noModel:         'กรุณาใส่ Model ID',
    noText:          'กรุณาใส่ข้อความ',
    noToken:         'กรุณาใส่ HuggingFace Token',
    noTokenizerFile: 'Model นี้ไม่มีไฟล์ Tokenizer',
    modelNotFound:   'ไม่พบ Model นี้บน HuggingFace',
    unknownError:    'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    accessDenied:    'เข้าถึงไม่ได้ (Gated Repo) — กรุณายอมรับเงื่อนไขบนหน้า HF ก่อน',
    modelPlaceholder:  'เช่น nectec/pathumma-thaillm-8b-think-3.0.0',
    modelPlaceholderB: 'เช่น google/gemma-2-2b',
    modelInputHint:    'ช่องนี้ค้นหาได้ทั้งโมเดลในระบบ (cache) และจาก HuggingFace โดยตรง',
    modelLabelSingle:  'Model ID (HuggingFace)',
    modelLabelA:       'Model A ID',
    modelLabelB:       'Model B ID',
    textPlaceholder: 'พิมพ์หรือวางข้อความที่นี่... ลองทั้งภาษาไทย ภาษาอังกฤษ หรือโค้ด!',
    footerTagline:   'Tokenscopic — วิเคราะห์ Tokenizer จาก 🤗 HuggingFace ได้อย่างสวยงาม',
  },
  en: {
    modeSingle:      'Single Model',
    modeCompare:     'Compare Models',
    realtimeToggle:  'Real-time & Split View',
    configTitle:     'Connection Settings',
    required:        'Required',
    tokenHint:       'This model requires an Access Token. Get one at',
    quickSelect:     'Quick select:',
    hfSearchPlaceholder: 'Type to search models or click for cached',
    hfSearchLoading: 'Searching...',
    hfSearchEmpty:   'No matching models found',
    hfSearchCachedBadge: 'cached',
    cachedSectionTitle: 'Cached in system',
    searchSectionTitle: 'HuggingFace results',
    modelListEmpty:  'No cached models yet',
    inputTitle:      'Enter Text to Tokenize',
    characters:      'characters',
    exampleLabel:    'Examples:',
    tokenizeBtn:     'Tokenize Now',
    tokenizingLabel: 'Tokenizing…',
    errorTitle:      'Error Occurred',
    resultsTitle:    'Tokenization Results',
    legendTitle:     'Token Colors:',
    legendHint:      'Hover for details',
    tooltipHeader:   'Token Detail',
    ttString:        'String:',
    ttBytes:         'Raw:',
    ttIndex:         'Index:',
    checking:        (m) => `Checking tokenizer for <strong>${m}</strong>…`,
    cached:          'Tokenizer found in cache — ready to use',
    download:        'Tokenizer not cached — will download automatically',
    tokenRequired:   'Model is <strong>private / gated</strong> — please enter HF Token',
    afterCached:     'Tokenizer ready — cached locally',
    noBackend:       'Cannot connect to backend. Run: cd backend && uvicorn main:app --reload',
    noModel:         'Please enter a Model ID',
    noText:          'Please enter some text',
    noToken:         'Please enter your HuggingFace Token',
    noTokenizerFile: 'This model does not contain Tokenizer files.',
    modelNotFound:   'Model not found on HuggingFace.',
    unknownError:    'An unknown error occurred',
    accessDenied:    'Access Denied (Gated Repo) — please accept terms on HF first.',
    modelPlaceholder:  'e.g. nectec/pathumma-thaillm-8b-think-3.0.0',
    modelPlaceholderB: 'e.g. google/gemma-2-2b',
    modelInputHint:    'This field searches both cached models and HuggingFace directly',
    modelLabelSingle:  'Model ID (HuggingFace)',
    modelLabelA:       'Model A ID',
    modelLabelB:       'Model B ID',
    textPlaceholder: 'Type or paste text here... Try Thai, English, or code!',
    footerTagline:   'Tokenscopic — Visualize any 🤗 HuggingFace Tokenizer beautifully',
  },
};

let currentLang = localStorage.getItem('tokenlens-lang') || 'th';

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  const t = TRANSLATIONS[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] && typeof t[key] === 'string') el.textContent = t[key];
  });

  if (inputText) inputText.placeholder = t.textPlaceholder;
  if (MD_A.input) MD_A.input.placeholder = t.modelPlaceholder;
  if (MD_B.input) MD_B.input.placeholder = t.modelPlaceholderB;

  updateModelLabels();

  const langLabel = document.getElementById('lang-label');
  if (langLabel) langLabel.textContent = lang === 'th' ? 'EN' : 'TH';

  localStorage.setItem('tokenlens-lang', lang);

  const miVal = MD_A.input.value.trim();
  if (miVal) checkTokenizerStatus(miVal, MD_A);
  const mbVal = MD_B.input.value.trim();
  if (mbVal && isCompareMode) checkTokenizerStatus(mbVal, MD_B);
}

const langToggleBtn = document.getElementById('lang-toggle');
if(langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      applyLang(currentLang === 'th' ? 'en' : 'th');
    });
}
applyLang(currentLang);


async function refreshCachedModels() {
  try {
    const resp = await fetch(`${API_BASE}/api/cached_models`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    cachedModelIds = Array.isArray(data.models) ? data.models : [];
  } catch {
    cachedModelIds = [];
  }
}

function hideHFSearchResults(container) {
  if (!container) return;
  container.style.display = 'none';
  container.innerHTML = '';
}

function highlightMatch(text, query) {
  const q = query.trim();
  if (!q) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const hit = escapeHtml(text.slice(idx, idx + q.length));
  const after = escapeHtml(text.slice(idx + q.length));
  return `${before}<mark class="hf-search-match">${hit}</mark>${after}`;
}

function setActiveSearchItem(md, nextIndex) {
  if (!md.results || md.results.style.display === 'none') return;
  const items = Array.from(md.results.querySelectorAll('.hf-search-item'));
  if (!items.length) return;

  const safeIndex = ((nextIndex % items.length) + items.length) % items.length;
  md.activeSearchIndex = safeIndex;

  items.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === safeIndex);
  });
  items[safeIndex].scrollIntoView({ block: 'nearest' });
}

function chooseActiveSearchItem(md) {
  if (!md.results || md.results.style.display === 'none') return false;
  const items = Array.from(md.results.querySelectorAll('.hf-search-item'));
  if (!items.length || md.activeSearchIndex < 0 || md.activeSearchIndex >= items.length) return false;
  items[md.activeSearchIndex].click();
  return true;
}

function renderHFSearchResults(container, models, md, query = '') {
  if (!container) return;
  const t = TRANSLATIONS[currentLang];
  const q = query.trim().toLowerCase();
  const cachedMatches = q
    ? cachedModelIds.filter((m) => m.toLowerCase().includes(q))
    : [...cachedModelIds];

  const allModels = [];
  const seen = new Set();
  cachedMatches.forEach((m) => {
    if (!seen.has(m)) {
      seen.add(m);
      allModels.push({ id: m, source: 'cached' });
    }
  });
  models.forEach((m) => {
    if (!seen.has(m)) {
      seen.add(m);
      allModels.push({ id: m, source: 'search' });
    }
  });

  if (!allModels.length) {
    container.innerHTML = `<div class="hf-search-empty">${escapeHtml(t.hfSearchEmpty)}</div>`;
    container.style.display = 'block';
    return;
  }

  const cachedButtons = allModels
    .filter((m) => m.source === 'cached')
    .map((m) => `<button type="button" class="hf-search-item" data-model-id="${escapeHtml(m.id)}">${highlightMatch(m.id, q)} <span class="hf-search-badge">${escapeHtml(t.hfSearchCachedBadge)}</span></button>`)
    .join('');
  const searchButtons = allModels
    .filter((m) => m.source === 'search')
    .map((m) => `<button type="button" class="hf-search-item" data-model-id="${escapeHtml(m.id)}">${highlightMatch(m.id, q)}</button>`)
    .join('');

  container.innerHTML = `
    ${cachedButtons ? `<div class="hf-search-empty">${escapeHtml(t.cachedSectionTitle)}</div>${cachedButtons}` : ''}
    ${searchButtons ? `<div class="hf-search-empty">${escapeHtml(t.searchSectionTitle)}</div>${searchButtons}` : ''}
  `;
  container.style.display = 'block';
  md.activeSearchIndex = -1;

  container.querySelectorAll('.hf-search-item').forEach((el) => {
    el.addEventListener('click', () => {
      const modelId = el.dataset.modelId || '';
      if (!modelId) return;
      md.input.value = modelId;
      checkTokenizerStatus(modelId, md);
      hideHFSearchResults(container);
      if (realtimeToggle.checked && inputText.value.trim()) analyzeBtn.click();
    });
  });
}

async function searchHFModels(query, container, md) {
  if (!container) return;
  const q = query.trim();
  if (q.length < 2) {
    renderHFSearchResults(container, [], md, q);
    return;
  }

  container.innerHTML = `<div class="hf-search-empty">${escapeHtml(TRANSLATIONS[currentLang].hfSearchLoading)}</div>`;
  container.style.display = 'block';

  try {
    const resp = await fetch(`${API_BASE}/api/search_models?q=${encodeURIComponent(q)}&limit=8`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const models = Array.isArray(data.models) ? data.models : [];
    renderHFSearchResults(container, models, md, q);
  } catch {
    renderHFSearchResults(container, [], md, q);
  }
}

// ——— UI Mode Controls ———
modeSingle.addEventListener('click', () => {
  isCompareMode = false;
  modeSingle.classList.add('active');
  modeCompare.classList.remove('active');
  
  modelBGroup.style.display = 'none';
  resultColB.style.display = 'none';
  badgeModelA.hidden = true;
  
  mainConfigGrid.classList.remove('compare-active');
  resultsColumns.classList.remove('compare-active');
  if (!realtimeToggle.checked) appWrapper.classList.remove('wide');
  tokenNeededByB = false;
  updateHFTokenVisibility();
  updateModelLabels();
  queueFitStatValues();
});

modeCompare.addEventListener('click', () => {
  isCompareMode = true;
  modeCompare.classList.add('active');
  modeSingle.classList.remove('active');
  
  modelBGroup.style.display = 'flex';
  resultColB.style.display = '';
  badgeModelA.hidden = false;
  
  mainConfigGrid.classList.add('compare-active');
  resultsColumns.classList.add('compare-active');

  /* สองคอลัมน์ผลลัพธ์ต้องการความกว้างมากกว่าเลย์เอาต์เดี่ยว */
  appWrapper.classList.add('wide');
  updateHFTokenVisibility();
  updateModelLabels();
  queueFitStatValues();
});

realtimeToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    mainContainer.classList.add('split-mode');
    appWrapper.classList.add('wide');
    // Call analyze once if text is present
    if (inputText.value.trim() && MD_A.input.value.trim()) {
      analyzeBtn.click();
    }
  } else {
    mainContainer.classList.remove('split-mode');
    // only remove wide if not in compare mode
    if(!isCompareMode) appWrapper.classList.remove('wide');
  }
});


// ——— Character counter & Debounce Trigger ———
inputText.addEventListener('input', () => {
  charCountEl.textContent = inputText.value.length;
  
  if (realtimeToggle.checked) {
    clearTimeout(realtimeDebounceTimer);
    realtimeDebounceTimer = setTimeout(() => {
      if (inputText.value.trim()) {
        analyzeBtn.click();
      }
    }, 600); // 600ms debounce
  }
});

// ——— Toggle token visibility ———
if(toggleTokenBtn) {
  toggleTokenBtn.addEventListener('click', () => {
    const isPassword = hfTokenInput.type === 'password';
    hfTokenInput.type = isPassword ? 'text' : 'password';
    toggleTokenBtn.querySelector('.eye-icon.show').style.display = isPassword ? 'none' : '';
    toggleTokenBtn.querySelector('.eye-icon.hide').style.display = isPassword ? '' : 'none';
  });
}

// ——— Light / Dark Mode Toggle ———
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sunIcon  = themeToggleBtn.querySelector('.sun-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');
  if (theme === 'light') {
    sunIcon.style.display  = 'none';
    moonIcon.style.display = '';
  } else {
    sunIcon.style.display  = '';
    moonIcon.style.display = 'none';
  }
  localStorage.setItem('tokenlens-theme', theme);
}

const savedTheme = localStorage.getItem('tokenlens-theme') || 'dark';
applyTheme(savedTheme);

if(themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// ——— Tokenizer status helpers ———
function showStatus(md, type, html) {
  md.status.className = `tokenizer-status status-${type}`;
  md.status.innerHTML = html;
  md.status.style.display = 'flex';
}

function hideStatus(md) {
  md.status.style.display = 'none';
}

// ——— Check tokenizer cache ———
async function checkTokenizerStatus(modelId, md) {
  if (!modelId) {
    hideStatus(md);
    setModelTokenRequirement(md, false);
    return;
  }

  showStatus(md, 'checking', `
    <span class="status-spinner"></span>
    <span>${TRANSLATIONS[currentLang].checking(escapeHtml(modelId))}</span>
  `);

  try {
    const resp = await fetch(`${API_BASE}/api/check_tokenizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId }),
    });
    const data = await resp.json();

    if (data.cached) {
      setModelTokenRequirement(md, false);
      showStatus(md, 'cached', `
        <svg viewBox="0 0 20 20" fill="currentColor" class="status-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
        <span>${TRANSLATIONS[currentLang].cached}</span>
      `);
    } else {
      setModelTokenRequirement(md, false); // don't show until tokenize required it
      showStatus(md, 'download', `
        <svg viewBox="0 0 20 20" fill="currentColor" class="status-icon"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        <span>${TRANSLATIONS[currentLang].download}</span>
      `);
    }
  } catch {
    hideStatus(md);
  }
}

function setHFTokenSectionVisible(visible) {
  if(!hfTokenSection) return;
  hfTokenSection.style.display = visible ? '' : 'none';
  if (!visible) hfTokenInput.value = '';
  tokenNeeded = visible;
}

function updateHFTokenVisibility(options = {}) {
  const { focus = false } = options;
  const shouldShow = tokenNeededByA || (isCompareMode && tokenNeededByB);
  setHFTokenSectionVisible(shouldShow);
  if (shouldShow && focus && hfTokenInput) hfTokenInput.focus();
}

function setModelTokenRequirement(md, required, options = {}) {
  if (md === MD_A) {
    tokenNeededByA = required;
  } else if (md === MD_B) {
    tokenNeededByB = required;
  }
  updateHFTokenVisibility(options);
}

MD_A.input.addEventListener('input', () => {
  clearTimeout(checkDebounceTimerA);
  clearTimeout(modelSearchTimerA);
  const val = MD_A.input.value.trim();
  checkDebounceTimerA = setTimeout(() => checkTokenizerStatus(val, MD_A), 600);
  modelSearchTimerA = setTimeout(() => {
    searchHFModels(MD_A.input.value, MD_A.results, MD_A);
  }, 350);
});

MD_B.input.addEventListener('input', () => {
  clearTimeout(checkDebounceTimerB);
  clearTimeout(modelSearchTimerB);
  const val = MD_B.input.value.trim();
  checkDebounceTimerB = setTimeout(() => checkTokenizerStatus(val, MD_B), 600);
  modelSearchTimerB = setTimeout(() => {
    searchHFModels(MD_B.input.value, MD_B.results, MD_B);
  }, 350);
});

MD_A.input.addEventListener('focus', () => {
  renderHFSearchResults(MD_A.results, [], MD_A, MD_A.input.value);
});

MD_B.input.addEventListener('focus', () => {
  renderHFSearchResults(MD_B.results, [], MD_B, MD_B.input.value);
});

MD_A.input.addEventListener('keydown', (e) => {
  if (!MD_A.results || MD_A.results.style.display === 'none') return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActiveSearchItem(MD_A, MD_A.activeSearchIndex + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveSearchItem(MD_A, MD_A.activeSearchIndex - 1);
  } else if (e.key === 'Enter') {
    if (chooseActiveSearchItem(MD_A)) e.preventDefault();
  } else if (e.key === 'Escape') {
    hideHFSearchResults(MD_A.results);
  }
});

MD_B.input.addEventListener('keydown', (e) => {
  if (!MD_B.results || MD_B.results.style.display === 'none') return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActiveSearchItem(MD_B, MD_B.activeSearchIndex + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveSearchItem(MD_B, MD_B.activeSearchIndex - 1);
  } else if (e.key === 'Enter') {
    if (chooseActiveSearchItem(MD_B)) e.preventDefault();
  } else if (e.key === 'Escape') {
    hideHFSearchResults(MD_B.results);
  }
});

document.addEventListener('click', (e) => {
  if (hfResultsA && !hfResultsA.contains(e.target) && e.target !== MD_A.input) {
    hideHFSearchResults(hfResultsA);
  }
  if (hfResultsB && !hfResultsB.contains(e.target) && e.target !== MD_B.input) {
    hideHFSearchResults(hfResultsB);
  }
});

// ——— Quick model buttons ———
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target === 'model-id-b' ? 'model-id-b' : 'model-id';
    const md = targetId === 'model-id-b' ? MD_B : MD_A;
    md.input.value = btn.dataset.model;
    md.input.focus();
    if(md === MD_A) {
        clearTimeout(checkDebounceTimerA);
        checkTokenizerStatus(btn.dataset.model, md);
    } else {
        clearTimeout(checkDebounceTimerB);
        checkTokenizerStatus(btn.dataset.model, md);
    }
    
    // Auto re-analyze if realtime is on
    if(realtimeToggle.checked && inputText.value.trim()) {
        analyzeBtn.click();
    }
  });
});

// ——— Sample text buttons ———
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    inputText.value = btn.dataset.text;
    charCountEl.textContent = inputText.value.length;
    inputText.focus();
    if(realtimeToggle.checked) {
        analyzeBtn.click();
    }
  });
});

// ——— View tabs logic ———
function activateTab(md, tabName) {
  // Reset all
  [md.tabVisual, md.tabTable, md.tabIds].forEach(t => { if(t) t.classList.remove('active'); });
  [md.viewVisual, md.viewTable, md.viewIds].forEach(v => { if(v) v.style.display = 'none'; });
  
  if (tabName === 'visual' && md.tabVisual) {
    md.tabVisual.classList.add('active');
    md.viewVisual.style.display = '';
  } else if (tabName === 'table' && md.tabTable) {
    md.tabTable.classList.add('active');
    md.viewTable.style.display = '';
  } else if (tabName === 'ids' && md.tabIds) {
    md.tabIds.classList.add('active');
    md.viewIds.style.display = '';
  }
}

// Attach event listeners for tabs A and B
function setupTabs(md) {
  if(md.tabVisual) md.tabVisual.addEventListener('click', () => activateTab(md, 'visual'));
  if(md.tabTable) md.tabTable.addEventListener('click',  () => activateTab(md, 'table'));
  if(md.tabIds) md.tabIds.addEventListener('click',    () => activateTab(md, 'ids'));
  
  if(md.copyIds) {
    md.copyIds.addEventListener('click', async () => {
      const ids = md.currentTokens.map(t => t.id).join(', ');
      await navigator.clipboard.writeText(`[${ids}]`);
      md.copyIds.textContent = '✓ Copied!';
      setTimeout(() => {
        md.copyIds.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" class="copy-icon"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg> Copy`;
      }, 2000);
    });
  }
}
setupTabs(MD_A);
setupTabs(MD_B);

// ——— Tooltip ———
let tooltipVisible = false;

function showTooltip(e, token, index, containerRect) {
  const rawDisplay = token.raw ? token.raw : '—';
  ttId.textContent    = token.id;
  ttStr.textContent   = JSON.stringify(token.token);
  ttBytes.textContent = rawDisplay;
  ttIdx.textContent   = `#${index}`;
  tooltip.style.display = 'block';
  positionTooltip(e);
  tooltipVisible = true;
}

function positionTooltip(e) {
  const x = e.clientX + 14;
  const y = e.clientY - 10;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const finalX = x + tw > window.innerWidth ? e.clientX - tw - 14 : x;
  const finalY = y + th > window.innerHeight ? e.clientY - th - 10 : y;
  tooltip.style.left = finalX + 'px';
  tooltip.style.top  = finalY + 'px';
}

document.addEventListener('mousemove', e => {
  if (tooltipVisible) positionTooltip(e);
});

function hideTooltip() {
  tooltip.style.display = 'none';
  tooltipVisible = false;
}

// ——— Render tokens function ———
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getDisplayToken(str) {
  return str.replace(/ /g, '·').replace(/\n/g, '↵\n').replace(/\t/g, '→');
}

function renderVisual(md) {
  if(!md.tokenDisplay) return;
  md.tokenDisplay.innerHTML = '';
  md.currentTokens.forEach((token, i) => {
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
    const displayStr = getDisplayToken(token.token);
    const chip = document.createElement('div');
    chip.className = 'token-chip';
    chip.style.animationDelay = `${(i%20) * 15}ms`;
    chip.innerHTML = `
      <div class="token-chip-inner" style="
        background: ${color.bg};
        border-color: ${color.border};
        color: ${color.text};
      ">${escapeHtml(displayStr) || '<span style="opacity:0.4">∅</span>'}</div>
      <span class="token-chip-index">${i}</span>
    `;
    chip.addEventListener('mouseenter', (e) => showTooltip(e, token, i, md.tokenDisplay.getBoundingClientRect()));
    chip.addEventListener('mouseleave', hideTooltip);
    md.tokenDisplay.appendChild(chip);
  });
}

function renderTable(md) {
  if(!md.tokenTableBody) return;
  md.tokenTableBody.innerHTML = '';
  md.currentTokens.forEach((token, i) => {
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
    const rawDisplay = token.raw ? token.raw : '—';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i}</td>
      <td class="table-id">${token.id}</td>
      <td>
        <span class="table-token-badge table-token-str" style="background:${color.bg}; border:1px solid ${color.border}; color:${color.text}">
          ${escapeHtml(getDisplayToken(token.token)) || '∅'}
        </span>
      </td>
      <td class="table-bytes">${escapeHtml(rawDisplay)}</td>
      <td style="color:var(--text-muted)">${token.token.length}</td>
    `;
    md.tokenTableBody.appendChild(row);
  });
}

function renderIds(md) {
  if(!md.idsDisplay) return;
  const ids = md.currentTokens.map(t => t.id);
  md.idsDisplay.innerHTML = `<span style="color:var(--text-muted)">[</span>${
    ids.map((id, i) => {
      const c = TOKEN_COLORS[i % TOKEN_COLORS.length].text;
      return `<span style="color:${c}">${id}</span>`;
    }).join('<span style="color:var(--text-muted)">, </span>')
  }<span style="color:var(--text-muted)">]</span>`;
}

function fitStatValueText(el) {
  if (!el) return;
  if (!el.dataset.baseFontSizePx) {
    el.dataset.baseFontSizePx = window.getComputedStyle(el).fontSize;
  }

  const base = parseFloat(el.dataset.baseFontSizePx);
  if (!Number.isFinite(base)) return;

  let size = base;
  const minSize = 10;
  el.style.fontSize = `${size}px`;

  while (el.scrollWidth > el.clientWidth && size > minSize) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}

function fitAllStatValues() {
  const shouldFit =
    resultsColumns.classList.contains('compare-active') ||
    mainContainer.classList.contains('split-mode');

  const statValues = resultsColumns.querySelectorAll('.stat-value');
  if (!shouldFit) {
    statValues.forEach((el) => {
      if (el.dataset.baseFontSizePx) {
        el.style.fontSize = el.dataset.baseFontSizePx;
      } else {
        el.style.removeProperty('font-size');
      }
    });
    return;
  }

  statValues.forEach(fitStatValueText);
}

function queueFitStatValues() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fitAllStatValues();
    });
  });
}

// ——— API Execution Logic ———
async function fetchTokenization(md, text, hfToken) {
  const modelId = md.input.value.trim();
  if(!modelId) return;

  hideError(md);
  setPanelProcessing(md, true);

  try {
    const body = { model_id: modelId, text };
    if (hfToken) body.hf_token = hfToken;

    const resp = await fetch(`${API_BASE}/api/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    // Errors handling
    if (resp.status === 401 && data.detail && data.detail.startsWith('TOKEN_REQUIRED:')) {
      setModelTokenRequirement(md, true, { focus: true });
      showStatus(md, 'token-required', `
        <svg viewBox="0 0 20 20" fill="currentColor" class="status-icon"><path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"/></svg>
        <span>${TRANSLATIONS[currentLang].tokenRequired}</span>
      `);
      setPanelProcessing(md, false);
      return;
    }

    if (resp.status === 403 && data.detail && data.detail.startsWith('ACCESS_DENIED:')) {
      showError(md, '', 'accessDenied');
      setPanelProcessing(md, false);
      return;
    }

    if (resp.status === 404 && data.detail && data.detail.startsWith('MODEL_NOT_FOUND:')) {
      showError(md, '', 'modelNotFound');
      setPanelProcessing(md, false);
      return;
    }

    if (resp.status === 404 && data.detail && data.detail.startsWith('TOKENIZER_NOT_FOUND:')) {
      showError(md, '', 'noTokenizerFile');
      setPanelProcessing(md, false);
      return;
    }

    if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);

    // Success
    md.currentTokens = data.tokens;

    if(md.statTokens) md.statTokens.textContent = data.total_tokens.toLocaleString();
    if(md.statChars) md.statChars.textContent  = text.length.toLocaleString();
    if(md.statRatio) md.statRatio.textContent  = (text.length / data.total_tokens).toFixed(2);
    if(md.statVocab) md.statVocab.textContent  = data.vocab_size ? data.vocab_size.toLocaleString() : '—';
    if(md.infoModel) md.infoModel.textContent  = data.model_id;
    if(md.infoType) md.infoType.textContent = data.tokenizer_class_hf || '—';
    if(md.infoRuntimeType) md.infoRuntimeType.textContent = data.tokenizer_type || '—';

    renderVisual(md);
    renderTable(md);
    renderIds(md);

    if(md.resultsPanel && md.resultsPanel.style.display === 'none') {
      md.resultsPanel.style.display = 'flex';
      activateTab(md, 'visual');
    }
    queueFitStatValues();

    showStatus(md, 'cached', `
      <svg viewBox="0 0 20 20" fill="currentColor" class="status-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      <span>${TRANSLATIONS[currentLang].afterCached}</span>
    `);
    setModelTokenRequirement(md, false);
    refreshCachedModels();

  } catch (err) {
    showError(md, err.message || TRANSLATIONS[currentLang].unknownError, !err.message ? 'unknownError' : null);
  } finally {
    setPanelProcessing(md, false);
  }
}

// ——— Main Action ———
analyzeBtn.addEventListener('click', async () => {
  const hfToken = hfTokenInput ? hfTokenInput.value.trim() : '';
  const text    = inputText.value;

  if (!MD_A.input.value.trim()) { flashInput(MD_A.input, 'กรุณาใส่ Model ID'); return; }
  if (isCompareMode && !MD_B.input.value.trim()) { flashInput(MD_B.input, 'กรุณาใส่ Model ID'); return; }
  if (!text) { flashInput(inputText, 'กรุณาใส่ข้อความ'); return; }
  if (tokenNeeded && !hfToken) { flashInput(hfTokenInput, 'กรุณาใส่ HuggingFace Token'); return; }

  setLoading(true);

  if (isCompareMode) {
      await Promise.all([
          fetchTokenization(MD_A, text, hfToken),
          fetchTokenization(MD_B, text, hfToken)
      ]);
  } else {
      await fetchTokenization(MD_A, text, hfToken);
  }
  
  setLoading(false);

  // Auto scroll only if not in realtime typing mode
  if (!realtimeToggle.checked) {
    setTimeout(() => {
        resultsColumns.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
});

// Shortcut
inputText.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    analyzeBtn.click();
  }
});

// ——— General Helpers ———
function setLoading(loading) {
  analyzeBtn.disabled = loading;
  btnContent.style.display = loading ? 'none' : '';
  btnLoader.style.display  = loading ? '' : 'none';
}

function setPanelProcessing(md, processing) {
  if (!md.processingIndicator) return;
  md.processingIndicator.style.display = processing ? 'inline-flex' : 'none';
}

window.addEventListener('resize', queueFitStatValues);

function showError(md, msg, i18nKey = null) {
  if(!md.errorCard) return;
  if (i18nKey) {
    md.errorMsg.setAttribute('data-i18n', i18nKey);
    md.errorMsg.textContent = TRANSLATIONS[currentLang][i18nKey];
  } else {
    md.errorMsg.removeAttribute('data-i18n');
    md.errorMsg.textContent = redactSecretsForDisplay(msg);
  }
  md.errorCard.style.display = 'flex';
}

function hideError(md) {
  if(md.errorCard) md.errorCard.style.display = 'none';
}

function flashInput(el, msg) {
  el.style.borderColor = 'var(--accent-rose)';
  el.style.boxShadow = '0 0 0 3px rgba(244,63,94,0.2)';
  el.focus();
  el.placeholder = msg;
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow = '';
    el.placeholder = el.id === 'hf-token'
      ? 'hf_xxxxxxxxxxxxxxxxxxxxxxxx'
      : (el.id === 'model-id-b'
        ? TRANSLATIONS[currentLang].modelPlaceholderB
        : el.id.includes('model-id')
          ? TRANSLATIONS[currentLang].modelPlaceholder
          : TRANSLATIONS[currentLang].textPlaceholder);
  }, 2500);
}

// Initial health check
(async () => {
  refreshCachedModels();
  try {
    const r = await fetch(`${API_BASE}/api/health`);
    if (!r.ok) throw new Error();
  } catch {
    showError(MD_A, '', 'noBackend');
  }
})();
