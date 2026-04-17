[🇹🇭 ภาษาไทย](README.md) | **🇺🇸 English**

<img width="1155" height="242" alt="Screenshot 2569-04-15 at 11 01 55" src="https://github.com/user-attachments/assets/48e79929-dd22-43b3-800f-9b290572afeb" />

# Tokenscopic 🔍

### HuggingFace Tokenizer Visualizer

> Analyze and visualize how HuggingFace tokenizers split text, in single-model or side-by-side compare mode.

---

## Overview

Tokenscopic is a web app for inspecting tokenizer behavior in depth:

- Visual token chips, detailed token table, and raw token IDs
- `Single` and `Compare` mode (A/B model comparison)
- `Real-time` tokenization while typing
- HuggingFace model search + local cached model list
- On-demand HF token prompt for private/gated repositories

---

## Tutorial Video

[![Tutorial Video](https://img.youtube.com/vi/W2vgiTUqpLM/maxresdefault.jpg)](https://www.youtube.com/watch?v=W2vgiTUqpLM)

<video src="https://www.youtube.com/watch?v=W2vgiTUqpLM" controls="controls" width="100%">
</video>

### English Description

**Tokenscopic: A Hugging Face Tokenizer Visualizer**

This video demonstrates **Tokenscopic**, a web-based application designed to help users visualize and understand how different Hugging Face language models tokenize text.

**Key Features Showcased:**
- **Single Model View:** Input any Hugging Face Model ID (e.g., Llama 3, Qwen) to see exactly how it breaks down text into tokens. It seamlessly handles both public and gated models (via Access Token).
- **Detailed Visualization:** View tokenized text with intuitive color-coding alongside key metrics (Token count, Characters, Vocab Size). Users can easily switch between a visual view, a detailed table breakdown, or raw Token IDs arrays.
- **Compare Models:** A powerful side-by-side comparison (Split View) allowing you to evaluate how two different tokenizers process the exact same text simultaneously.
- **Real-time Update:** Watch the tokenization process update dynamically in real-time as you type or modify the input text.

---

## Key Features


| Feature                             | Description                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| 🎨 **Colorful Token Visualization** | Distinct token colors with hover tooltip (`id`, `string`, `raw token`, `index`) |
| 📋 **3 View Modes**                 | Visual · Table · Token IDs                                                      |
| ⚖️ **Single / Compare Mode**        | Analyze one model or compare two models side by side                            |
| ⚡ **Real-time Mode**                | Auto re-tokenization while typing (debounced)                                   |
| 🔎 **Model Search**                 | Search models from HuggingFace and local cache                                  |
| 📊 **Stats Dashboard**              | token count, characters, chars/token ratio, vocab size                          |
| 🧠 **Tokenizer Class Source**       | Shows both `Tokenizer Class (HF)` and `Tokenizer Runtime Class`                 |
| 🌐 **TH / EN UI**                   | UI language toggle                                                              |
| 🌙 **Dark / Light Theme**           | Theme toggle with saved preference                                              |
| 💾 **Local Tokenizer Cache**        | Saves tokenizers in `backend/tokenizer_model/` after first load                 |


---

## Project Structure

```text
Tokenizer_is_all_you_need/
├── README.md
├── README_en.md
├── docker-compose.yml
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx-frontend.conf
├── run.sh
├── run.bat
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── requirements-docker.txt   # image deps (no accelerate)
│   └── tokenizer_model/          # auto-created tokenizer cache
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── package.json
    └── logo.png
```

---

## Installation (First Time)

### Prerequisites

- Python `3.12+`
- Node.js `18+` and `npm`

### 1) Install backend dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the App

### Recommended: launcher scripts (`run.sh` / `run.bat`)

The launchers handle the basics before starting servers:

- Verifies **Python 3.12+** is available (exits with a clear message if not)
- Creates `backend/.venv` when missing, then activates it
- Runs `pip install -r requirements.txt` only when needed:
  - first run, or
  - after `backend/requirements.txt` is newer than the stamp file `.venv/.requirements_installed`
- Runs `npm install` in `frontend/` when `node_modules` is missing

**macOS / Linux**

```bash
chmod +x run.sh   # first time only, if the file is not executable yet
./run.sh
```

Backend and frontend run in the background in the same terminal — press **Ctrl+C** to stop both.

**Windows**

- Double-click `run.bat`  
This opens separate CMD windows for backend and frontend — **close those windows** to stop each side.

**URLs after a successful start**

- Frontend (live-server): `http://localhost:3000`
- Backend (FastAPI / API): `http://localhost:8000`  
You can also open `http://localhost:8000/` directly; the backend serves `index.html` there as well (handy if you prefer a single port).

### Manual mode (for debugging)

Terminal 1 (Backend):

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):

```bash
cd frontend
npm start
```

---

## Docker (Docker Compose)

Run **backend + frontend** as two containers. No local Python/Node install required (Docker only).

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with **Docker Compose** (included in Docker Desktop)

### Services and ports


| Service    | Host port | Description                                                                   |
| ---------- | --------- | ----------------------------------------------------------------------------- |
| `backend`  | **8000**  | FastAPI + uvicorn (**CPU-only** PyTorch, no GPU/CUDA base)                    |
| `frontend` | **3000**  | nginx serves static files from `frontend/` (no Node/live-server in the image) |


### Main commands

From the project root (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop and remove containers:

```bash
docker compose down
```

Follow logs:

```bash
docker compose logs -f
```

### URLs after a successful start

- UI: **[http://localhost:3000](http://localhost:3000)**
- API: **[http://localhost:8000](http://localhost:8000)** (try `http://localhost:8000/api/health`)

You can open the UI at **[http://127.0.0.1:3000](http://127.0.0.1:3000)** as well — the frontend calls the API on the **same hostname**, port **8000**.

### Tokenizer cache on the host (bind mount)

`docker-compose.yml` bind-mounts `**backend/tokenizer_model/`** into the container at `/app/backend/tokenizer_model`, so cache files live in your repo on the host (still listed in `.gitignore`).

### Build a single service

```bash
docker compose build backend
docker compose build frontend
```

### Image names (typical)

Compose derives names from the project directory, e.g. `tokenizer_is_all_you_need-backend` and `tokenizer_is_all_you_need-frontend` — check with `docker images`.

---

## Detailed User Guide (English)

### A) Single model workflow

1. Open `http://localhost:3000`
2. Make sure `Single` mode is active
3. Enter a model ID, e.g. `meta-llama/Llama-3.2-1B`
4. Optionally click the model field to pick from cache/search results
5. Enter text to tokenize
6. Click `Tokenize Now` or press `Cmd+Enter` / `Ctrl+Enter`
7. Inspect output tabs:
  - `Visual`: colored token chips
  - `Table`: per-token details
  - `Token IDs`: numeric id sequence

### B) Compare mode workflow

1. Switch to `Compare Models`
2. Enter `Model A ID` and `Model B ID`
3. Enter one shared input text
4. Click tokenize once (both models run in parallel)
5. Compare both result columns for split behavior and token counts

### C) Real-time & split view

1. Enable `Real-time & Split View`
2. Start typing in the text box
3. Results auto-refresh continuously (with debounce)

### D) HuggingFace token flow

HF token is only needed when required:

- `401 TOKEN_REQUIRED`: private/gated model without token
- `403 ACCESS_DENIED`: gated model access not approved yet

Steps:

1. Generate token at [HuggingFace Tokens](https://huggingface.co/settings/tokens)
2. Paste token into `hf_xxx...`
3. Retry tokenization
4. For gated models, accept license/terms on the model page first

### E) Cache behavior

Flow:

1. App checks `backend/tokenizer_model/<safe_model_name>/`
2. If cache exists -> load local tokenizer immediately
3. If not -> download from HuggingFace
4. On success -> save tokenizer locally for next runs

Result: faster repeated runs and fewer external calls.

Important cache artifacts:

- `_model_id.txt` stores the original HuggingFace model ID
- `_tokenizer_class.txt` stores `tokenizer_class` resolved from the real HuggingFace `tokenizer_config.json`
- `tokenizer_config.json`, `tokenizer.json` / `tokenizer.model` / `vocab.json` / `merges.txt` are used for local tokenizer loading

Notes:

- `Tokenizer Class (HF)` in the UI is sourced from HuggingFace tokenizer files.
- `Tokenizer Runtime Class` is the actual loaded runtime class from `transformers`.
- If a cached tokenizer corrupts non-ASCII text on encode/decode, the backend removes that cache folder and re-downloads from HuggingFace for that request.

### F) Important controls


| Control           | Purpose                     |
| ----------------- | --------------------------- |
| `TH / EN`         | Switch UI language          |
| `☀️ / 🌙`         | Switch theme                |
| `Quick select`    | Pick common models quickly  |
| `Copy` in IDs tab | Copy token IDs to clipboard |


---

## API Endpoints


| Method | Path                               | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| `GET`  | `/api/health`                      | Backend health check                |
| `POST` | `/api/check_tokenizer`             | Check whether tokenizer is cached   |
| `GET`  | `/api/cached_models`               | List locally cached model IDs       |
| `GET`  | `/api/search_models?q=...&limit=8` | Search HuggingFace models           |
| `POST` | `/api/tokenize`                    | Tokenize text (`hf_token` optional) |


Example request:

```json
{
  "model_id": "meta-llama/Llama-3.2-1B",
  "text": "Hello Tokenscopic",
  "hf_token": "hf_xxxx"
}
```

---

## Troubleshooting

- `./run.sh` prints `Permission denied`
  - run `chmod +x run.sh` and try again
- Launcher reports Python is below 3.12
  - upgrade Python and confirm `python3 --version` is 3.12+
- `Cannot connect to backend`
  - ensure backend is running on port `8000`
- Empty model search results
  - check internet, and use query length >= 2
- `ACCESS_DENIED`
  - accept model terms/license on HuggingFace first
- Slow first tokenization
  - normal on first run due to tokenizer download; cached runs are faster
- Docker: frontend not loading or actions fail
  - check `docker compose ps` — both `backend` and `frontend` should be `running`
  - inspect logs: `docker compose logs frontend` / `docker compose logs backend`

---

## Tech Stack

- Frontend: HTML, CSS, Vanilla JS
- Backend: FastAPI (Python)
- Tokenizer: `transformers` + `sentencepiece`
- Dev Frontend Server: `live-server`
- Cache: local filesystem
- Optional deploy: Docker Compose — backend image (Python slim + PyTorch CPU), frontend image (nginx alpine)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Author

Created by **Perasut Rungcharassang**
