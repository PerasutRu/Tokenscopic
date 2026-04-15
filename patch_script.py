import re
import os

# 1. Update style.css
with open('frontend/style.css', 'r') as f:
    css = f.read()

css_addition = """
/* ========================================
   Toolbar & Toggles
   ======================================== */
.app-toolbar {
  margin-bottom: 24px;
  padding: 14px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
  gap: 16px;
}
.mode-toggles { display: flex; gap: 8px; }
.feature-toggles { display: flex; align-items: center; gap: 12px; }

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255,255,255,0.1);
  border: 1px solid var(--border);
  transition: .4s;
}
[data-theme="light"] .slider { background-color: rgba(0,0,0,0.1); }
.slider:before {
  position: absolute; content: "";
  height: 18px; width: 18px; left: 3px; bottom: 2px;
  background-color: var(--text-secondary);
  transition: .4s;
}
input:checked + .slider {
  background-color: rgba(124,58,237,0.3);
  border-color: rgba(124,58,237,0.5);
}
input:checked + .slider:before {
  transform: translateX(20px);
  background-color: var(--text-primary);
}
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.app-wrapper {
  max-width: 960px;
  transition: max-width var(--transition);
}
.app-wrapper.wide { max-width: 1300px; }

.main { display: flex; flex-direction: column; gap: 20px; transition: all 0.3s ease; }
@media (min-width: 960px) {
  .main.split-mode {
    flex-direction: row;
    align-items: stretch;
  }
  .main.split-mode .left-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
  .main.split-mode .right-pane { flex: 1.2; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
}
.left-pane, .right-pane { display:flex; flex-direction:column; gap:20px; }

.results-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
.results-columns.compare-active {
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 900px) {
  .results-columns.compare-active { grid-template-columns: 1fr; }
}

.model-title-badge {
    background: rgba(124,58,237,0.15);
    padding: 6px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--accent-purple);
    border: 1px solid rgba(124,58,237,0.3);
    text-align: center;
    backdrop-filter: blur(8px);
}
.form-grid.compare-active {
  grid-template-columns: 1fr 1fr;
}
"""
if ".app-toolbar" not in css:
    with open('frontend/style.css', 'a') as f:
        f.write(css_addition)


# 2. Update index.html
with open('frontend/index.html', 'r') as f:
    html = f.read()

# Replace Header to Main transition
html = html.replace('    </header>\n\n    <!-- Main content -->\n    <main class="main">', 
"""    </header>

    <!-- Toolbar -->
    <div class="app-toolbar glass-card">
      <div class="mode-toggles">
        <button class="view-tab active" id="mode-single" data-i18n="modeSingle">Single Model</button>
        <button class="view-tab" id="mode-compare" data-i18n="modeCompare">Compare Models</button>
      </div>
      <div class="feature-toggles">
        <span class="toggle-label" data-i18n="realtimeToggle">Real-time & Split View</span>
        <label class="toggle-switch">
          <input type="checkbox" id="realtime-toggle">
          <span class="slider round"></span>
        </label>
      </div>
    </div>

    <!-- Main content -->
    <main class="main" id="main-container">
      <div class="left-pane" id="left-pane">""")

# Remove old tokenizer status banner above form grid
html = re.sub(r'<!-- Tokenizer status banner -->\s*<div id="tokenizer-status" class="tokenizer-status" style="display:none"></div>\s*<div class="form-grid">', '<div class="form-grid" id="main-config-grid">', html)

# Replace Model A input and add Model B input
pattern_model_a = r'<div class="form-group">\s*<label for="model-id" class="form-label">.*?<\/div>\s*<\/div>'
model_ab_html = """<div class="form-group" id="model-a-group">
            <label for="model-id" class="form-label">
              <svg class="label-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span id="label-model-a">Model ID (HuggingFace)</span>
            </label>
            <div id="tokenizer-status" class="tokenizer-status" style="display:none; margin:4px 0;"></div>
            <div class="model-input-row">
              <input type="text" id="model-id" class="form-input" placeholder="เช่น nectec/pathumma-thaillm-8b-think-3.0.0" autocomplete="off" spellcheck="false" />
            </div>
            <div class="quick-models">
              <span class="quick-label" data-i18n="quickSelect">Quick select:</span>
              <button class="quick-btn" data-target="model-id" data-model="nectec/pathumma-thaillm-8b-think-3.0.0">Pathumma-8B</button>
              <button class="quick-btn" data-target="model-id" data-model="meta-llama/Llama-3.2-1B">Llama 3.2</button>
              <button class="quick-btn" data-target="model-id" data-model="Qwen/Qwen2.5-7B">Qwen2.5</button>
            </div>
          </div>

          <!-- Model B (Hidden by default) -->
          <div class="form-group" id="model-b-group" style="display:none">
            <label for="model-id-b" class="form-label">
              <svg class="label-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span>Model B ID</span>
            </label>
            <div id="tokenizer-status-b" class="tokenizer-status" style="display:none; margin:4px 0;"></div>
            <div class="model-input-row">
              <input type="text" id="model-id-b" class="form-input" placeholder="e.g. google/gemma-2-2b" autocomplete="off" spellcheck="false" />
            </div>
            <div class="quick-models">
              <span class="quick-label" data-i18n="quickSelect">Quick select:</span>
              <button class="quick-btn" data-target="model-id-b" data-model="google/gemma-2-2b">Gemma 2</button>
              <button class="quick-btn" data-target="model-id-b" data-model="Qwen/Qwen2.5-7B">Qwen2.5</button>
              <button class="quick-btn" data-target="model-id-b" data-model="meta-llama/Llama-3.2-1B">Llama 3.2</button>
            </div>
          </div>"""
html = re.sub(pattern_model_a, model_ab_html, html, flags=re.DOTALL)

# Extract results panel & error card, duplicate it
body_split = html.split('      <!-- Error Display -->')
if len(body_split) > 1:
    head = body_split[0]
    tail = '      <!-- Error Display -->' + body_split[1]
    
    # Split tail by footer
    res_split = tail.split('    </main>')
    results_html = res_split[0]
    footer_html = '    </main>' + res_split[1]
    
    # Prefix IDs in results_html with -b
    # simple replace algorithm for ids and important elements
    b_html = results_html.replace('id="error-card"', 'id="error-card-b"')
    b_html = b_html.replace('id="error-message"', 'id="error-message-b"')
    b_html = b_html.replace('id="results-panel"', 'id="results-panel-b"')
    b_html = b_html.replace('id="stat-tokens"', 'id="stat-tokens-b"')
    b_html = b_html.replace('id="stat-chars"', 'id="stat-chars-b"')
    b_html = b_html.replace('id="stat-ratio"', 'id="stat-ratio-b"')
    b_html = b_html.replace('id="stat-vocab"', 'id="stat-vocab-b"')
    b_html = b_html.replace('id="info-model"', 'id="info-model-b"')
    b_html = b_html.replace('id="info-type"', 'id="info-type-b"')
    b_html = b_html.replace('id="tab-visual"', 'id="tab-visual-b"')
    b_html = b_html.replace('id="tab-table"', 'id="tab-table-b"')
    b_html = b_html.replace('id="tab-ids"', 'id="tab-ids-b"')
    b_html = b_html.replace('id="view-visual"', 'id="view-visual-b"')
    b_html = b_html.replace('id="view-table"', 'id="view-table-b"')
    b_html = b_html.replace('id="view-ids"', 'id="view-ids-b"')
    b_html = b_html.replace('id="token-display"', 'id="token-display-b"')
    b_html = b_html.replace('id="token-table"', 'id="token-table-b"')
    b_html = b_html.replace('id="token-table-body"', 'id="token-table-body-b"')
    b_html = b_html.replace('id="ids-display"', 'id="ids-display-b"')
    b_html = b_html.replace('id="copy-ids-btn"', 'id="copy-ids-btn-b"')
    
    # Wrap in columns
    new_tail = f"""
      </div> <!-- /left-pane -->

      <div class="right-pane" id="right-pane">
        <div class="results-columns" id="results-columns">
          
          <!-- COLUMN A -->
          <div class="result-col" id="result-col-a">
            <div class="model-title-badge" id="badge-model-a" style="display:none;">Model A</div>
{results_html}
          </div>

          <!-- COLUMN B -->
          <div class="result-col" id="result-col-b" style="display:none">
            <div class="model-title-badge" id="badge-model-b">Model B</div>
{b_html}
          </div>

        </div> <!-- /results-columns -->
      </div> <!-- /right-pane -->
"""
    final_html = head + new_tail + footer_html
    
    with open('frontend/index.html', 'w') as f:
        f.write(final_html)

