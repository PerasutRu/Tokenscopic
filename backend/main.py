from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any, Optional
import os
import re
import logging
import json
import shutil
import ssl
import traceback
from urllib.parse import urlencode
from urllib.request import Request, urlopen

logger = logging.getLogger("tokenizer_api")

# Patterns that may appear inside library error strings (URLs, headers, etc.)
_HF_USER_TOKEN_RE = re.compile(r"hf_[A-Za-z0-9_-]{10,}", re.IGNORECASE)
_BEARER_RE = re.compile(r"(?i)(bearer\s+)[A-Za-z0-9_\-\.~+/]+=*")


def redact_secrets(text: Optional[str]) -> str:
    """Remove HF tokens and similar secrets from strings before logs or API responses."""
    if text is None:
        return ""
    s = str(text)
    s = _HF_USER_TOKEN_RE.sub("[REDACTED_HF_TOKEN]", s)
    s = _BEARER_RE.sub(r"\1[REDACTED]", s)
    return s


def log_redacted_exception(level: int, prefix: str, exc: BaseException) -> None:
    """Log exception message and traceback with secrets redacted."""
    safe_msg = redact_secrets(str(exc))
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.log(level, "%s: %s\n%s", prefix, safe_msg, redact_secrets(tb))

app = FastAPI(title="Tokenizer Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# Directory to cache downloaded tokenizers
TOKENIZER_CACHE_DIR = os.path.join(os.path.dirname(__file__), "tokenizer_model")
os.makedirs(TOKENIZER_CACHE_DIR, exist_ok=True)


def model_id_to_safe_folder(model_id: str) -> str:
    """Convert a HF model ID like 'meta-llama/Llama-3.2-1B' to a safe folder name."""
    return re.sub(r"[^\w\-]", "__", model_id)


def get_tokenizer_cache_path(model_id: str) -> str:
    return os.path.join(TOKENIZER_CACHE_DIR, model_id_to_safe_folder(model_id))


def contains_non_ascii(text: str) -> bool:
    return any(ord(ch) > 127 for ch in text)


def read_local_tokenizer_config(cache_path: str) -> Optional[dict[str, Any]]:
    config_path = os.path.join(cache_path, "tokenizer_config.json")
    if not os.path.exists(config_path):
        return None
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else None
    except Exception:
        logger.warning("Failed to read tokenizer_config.json from %s", cache_path, exc_info=True)
        return None


def get_tokenizer_class_cache_path(cache_path: str) -> str:
    return os.path.join(cache_path, "_tokenizer_class.txt")


def write_cached_tokenizer_class(cache_path: str, tokenizer_class: Optional[str]) -> None:
    if not tokenizer_class:
        return
    try:
        with open(get_tokenizer_class_cache_path(cache_path), "w", encoding="utf-8") as f:
            f.write(tokenizer_class.strip())
    except Exception:
        logger.warning("Failed to write tokenizer class cache at %s", cache_path, exc_info=True)


def read_cached_tokenizer_class(cache_path: str) -> Optional[str]:
    class_path = get_tokenizer_class_cache_path(cache_path)
    if not os.path.exists(class_path):
        return None
    try:
        with open(class_path, "r", encoding="utf-8") as f:
            data = f.read().strip()
        return data or None
    except Exception:
        logger.warning("Failed to read tokenizer class cache at %s", cache_path, exc_info=True)
        return None


def fetch_tokenizer_class_from_hf(model_id: str, hf_token: Optional[str] = None) -> Optional[str]:
    """Fetch tokenizer_class from HuggingFace tokenizer_config.json."""
    try:
        from huggingface_hub import hf_hub_download

        config_path = hf_hub_download(
            repo_id=model_id,
            filename="tokenizer_config.json",
            token=hf_token,
        )
        with open(config_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        if isinstance(payload, dict):
            tokenizer_class = payload.get("tokenizer_class")
            if isinstance(tokenizer_class, str) and tokenizer_class.strip():
                return tokenizer_class.strip()
    except Exception:
        logger.warning(
            "Failed to fetch tokenizer class from HuggingFace for '%s'",
            model_id,
            exc_info=True,
        )
    return None


def is_tokenizer_cached(model_id: str) -> bool:
    """Return True if the tokenizer is already saved locally."""
    cache_path = get_tokenizer_cache_path(model_id)
    if not os.path.isdir(cache_path):
        return False
    # tokenizer_config.json alone is not enough; require at least one tokenizer asset.
    has_config = os.path.exists(os.path.join(cache_path, "tokenizer_config.json"))
    has_assets = any(
        os.path.exists(os.path.join(cache_path, filename))
        for filename in ("tokenizer.json", "tokenizer.model", "vocab.json", "merges.txt")
    )
    return has_config and has_assets


class CheckTokenizerRequest(BaseModel):
    model_id: str


class CheckTokenizerResponse(BaseModel):
    model_id: str
    cached: bool


class TokenizeRequest(BaseModel):
    hf_token: Optional[str] = None
    model_id: str
    text: str


class TokenInfo(BaseModel):
    id: int
    token: str
    display: str
    bytes: list[int]
    raw: Optional[str] = None


class TokenizeResponse(BaseModel):
    model_id: str
    text: str
    tokens: list[TokenInfo]
    total_tokens: int
    vocab_size: Optional[int] = None
    tokenizer_type: Optional[str] = None
    tokenizer_class_hf: Optional[str] = None
    tokenizer_config: Optional[dict[str, Any]] = None


class CachedModelsResponse(BaseModel):
    models: list[str]


class SearchModelsResponse(BaseModel):
    models: list[str]


@app.get("/")
async def root():
    return FileResponse("../frontend/index.html")


@app.post("/api/check_tokenizer", response_model=CheckTokenizerResponse)
async def check_tokenizer(request: CheckTokenizerRequest):
    """Check whether the tokenizer for a given model has already been cached locally."""
    cached = is_tokenizer_cached(request.model_id)
    return CheckTokenizerResponse(model_id=request.model_id, cached=cached)


def _extract_model_id_from_cache(cache_path: str, folder_name: str) -> str:
    metadata_path = os.path.join(cache_path, "_model_id.txt")
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                model_id = f.read().strip()
            if model_id:
                return model_id
        except Exception:
            pass

    tokenizer_config_path = os.path.join(cache_path, "tokenizer_config.json")
    if os.path.exists(tokenizer_config_path):
        try:
            with open(tokenizer_config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            model_id = (cfg.get("_name_or_path") or "").strip()
            if model_id and "/" in model_id and not os.path.isabs(model_id):
                return model_id
        except Exception:
            pass

    return folder_name.replace("__", "/")


@app.get("/api/cached_models", response_model=CachedModelsResponse)
async def list_cached_models():
    models: list[str] = []
    try:
        for folder_name in os.listdir(TOKENIZER_CACHE_DIR):
            cache_path = os.path.join(TOKENIZER_CACHE_DIR, folder_name)
            if not os.path.isdir(cache_path):
                continue
            if not os.path.exists(os.path.join(cache_path, "tokenizer_config.json")):
                continue
            model_id = _extract_model_id_from_cache(cache_path, folder_name)
            models.append(model_id)
    except Exception:
        logger.exception("Failed to list cached models")
        raise HTTPException(status_code=500, detail="Failed to list cached models")
    return CachedModelsResponse(models=sorted(set(models), key=str.lower))


@app.get("/api/search_models", response_model=SearchModelsResponse)
async def search_models(q: str, limit: int = 8):
    query = (q or "").strip()
    if len(query) < 2:
        return SearchModelsResponse(models=[])

    safe_limit = max(1, min(limit, 20))
    params = urlencode({"search": query, "limit": safe_limit, "full": "false"})
    url = f"https://huggingface.co/api/models?{params}"
    req = Request(url, headers={"User-Agent": "tokenlens/1.0"})

    try:
        try:
            import certifi
            ssl_ctx = ssl.create_default_context(cafile=certifi.where())
        except ImportError:
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE

        with urlopen(req, timeout=8, context=ssl_ctx) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception:
        logger.exception("Failed to search models from HuggingFace")
        raise HTTPException(status_code=502, detail="Failed to search HuggingFace models")

    model_ids: list[str] = []
    if isinstance(payload, list):
        for item in payload:
            model_id = (item.get("id") if isinstance(item, dict) else "") or ""
            model_id = model_id.strip()
            if model_id:
                model_ids.append(model_id)

    return SearchModelsResponse(models=model_ids)


@app.post("/api/tokenize", response_model=TokenizeResponse)
async def tokenize(request: TokenizeRequest):
    try:
        from transformers import AutoTokenizer

        cache_path = get_tokenizer_cache_path(request.model_id)
        tokenizer = None
        loaded_from_hf = False

        # ── 1. Load: prefer local cache ──────────────────────────────────────
        if is_tokenizer_cached(request.model_id):
            tokenizer = AutoTokenizer.from_pretrained(
                cache_path,
                local_files_only=True,
                trust_remote_code=True,
            )
            # Some cached tokenizer states may silently drop non-ASCII text.
            # If probe fails, rebuild cache from HF in this same request.
            if request.text and contains_non_ascii(request.text):
                probe_ids = tokenizer.encode(request.text)
                probe_decoded = tokenizer.decode(probe_ids)
                if not contains_non_ascii(probe_decoded):
                    logger.warning(
                        "Cached tokenizer appears corrupted for '%s'; rebuilding cache",
                        request.model_id,
                    )
                    shutil.rmtree(cache_path, ignore_errors=True)
                    tokenizer = None
        if tokenizer is None:
            # ── 2. Download from HuggingFace ──────────────────────────────────
            load_kwargs: dict = {"trust_remote_code": True}
            if request.hf_token:
                load_kwargs["token"] = request.hf_token

            logger.info(f"Attempting to download/load tokenizer for model: {request.model_id}")
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    request.model_id, **load_kwargs
                )
                loaded_from_hf = True
                logger.info(f"Successfully loaded tokenizer for model: {request.model_id}")
            except Exception as download_err:
                err_str = str(download_err).lower()
                
                # Auth-required keywords:
                auth_keywords = ["401", "403", "unauthorized", "forbidden", "access token"]
                is_auth_error = any(kw in err_str for kw in auth_keywords)
                
                # 'private' and 'gated' suggest auth is required if no token was provided
                suggests_auth = any(kw in err_str for kw in ["gated", "private"]) and not request.hf_token

                if is_auth_error or suggests_auth:
                    logger.warning(
                        "Auth required for model '%s': %s",
                        request.model_id,
                        redact_secrets(str(download_err)),
                    )
                    status_code = 403 if request.hf_token else 401
                    safe = redact_secrets(str(download_err))
                    detail_msg = f"{'ACCESS_DENIED' if request.hf_token else 'TOKEN_REQUIRED'}: {safe}"
                    raise HTTPException(status_code=status_code, detail=detail_msg)
                
                # Model not found explicitly
                missing_model = any(kw in err_str for kw in [
                    "not a valid model identifier",
                    "repository not found",
                    "not found",
                    "404 client error"
                ])
                
                if missing_model:
                    logger.info(
                        "Model not found or invalid identifier '%s': %s",
                        request.model_id,
                        type(download_err).__name__,
                    )
                    raise HTTPException(
                        status_code=404,
                        detail="MODEL_NOT_FOUND: " + redact_secrets(str(download_err)),
                    )

                # Any other error (like missing dependencies): log redacted traceback, generic detail to client
                log_redacted_exception(
                    logging.ERROR,
                    f"Unexpected tokenizer load error (model={request.model_id}, "
                    f"type={type(download_err).__name__})",
                    download_err,
                )
                raise HTTPException(
                    status_code=404,
                    detail="TOKENIZER_NOT_FOUND: " + redact_secrets(str(download_err)),
                )

            # ── 3. Save to local cache ────────────────────────────────────────
            os.makedirs(cache_path, exist_ok=True)
            tokenizer.save_pretrained(cache_path)
            with open(os.path.join(cache_path, "_model_id.txt"), "w", encoding="utf-8") as f:
                f.write(request.model_id)
            # Store tokenizer class metadata once, directly from HF file, for dashboard display.
            # This metadata is not used for tokenization logic.
            if not read_cached_tokenizer_class(cache_path):
                hf_class = fetch_tokenizer_class_from_hf(request.model_id, request.hf_token)
                if hf_class:
                    write_cached_tokenizer_class(cache_path, hf_class)

        # ── 4. Tokenize ───────────────────────────────────────────────────────
        input_ids = tokenizer.encode(request.text)

        # Use convert_ids_to_tokens for raw token pieces (handles byte-fallback tokens)
        raw_tokens = tokenizer.convert_ids_to_tokens(input_ids)

        tokens_info = []
        for tid, raw_tok in zip(input_ids, raw_tokens):
            token_str = tokenizer.decode([tid])

            # Derive bytes from raw token piece for accuracy
            token_bytes: list[int] = []
            if raw_tok is None:
                token_bytes = list(token_str.encode("utf-8"))
            elif re.match(r"^<0x[0-9A-Fa-f]{2}>$", raw_tok):
                # Byte-fallback token used by LLaMA/Mistral (e.g. <0xE0>)
                token_bytes = [int(raw_tok[3:-1], 16)]
            else:
                # Strip SentencePiece / GPT-2 prefix markers (▁ Ġ Ċ ĉ)
                clean = raw_tok.lstrip("▁")
                # Replace GPT-2 Ġ (U+0120) → space, Ċ (U+010A) → newline
                clean = clean.replace("\u0120", " ").replace("\u010a", "\n")
                token_bytes = list(clean.encode("utf-8")) if clean else []

            tokens_info.append(
                TokenInfo(
                    id=tid,
                    token=token_str,
                    display=token_str,
                    bytes=token_bytes,
                    raw=raw_tok if raw_tok is not None else token_str,
                )
            )

        vocab_size = None
        try:
            vocab_size = tokenizer.vocab_size
        except Exception:
            pass

        tokenizer_type = type(tokenizer).__name__
        tokenizer_config = read_local_tokenizer_config(cache_path)
        tokenizer_class_hf = read_cached_tokenizer_class(cache_path)
        if not tokenizer_class_hf and isinstance(tokenizer_config, dict):
            config_class = tokenizer_config.get("tokenizer_class")
            if isinstance(config_class, str) and config_class.strip():
                tokenizer_class_hf = config_class.strip()
        if not tokenizer_class_hf:
            tokenizer_class_hf = tokenizer_type
        # Backfill cache file from existing local metadata only (no extra HF request here).
        if not read_cached_tokenizer_class(cache_path):
            write_cached_tokenizer_class(cache_path, tokenizer_class_hf)

        return TokenizeResponse(
            model_id=request.model_id,
            text=request.text,
            tokens=tokens_info,
            total_tokens=len(input_ids),
            vocab_size=vocab_size,
            tokenizer_type=tokenizer_type,
            tokenizer_class_hf=tokenizer_class_hf,
            tokenizer_config=tokenizer_config,
        )

    except HTTPException:
        raise
    except Exception as e:
        log_redacted_exception(logging.ERROR, "Unexpected tokenization error", e)
        raise HTTPException(status_code=500, detail=redact_secrets(str(e)))


@app.get("/api/health")
async def health():
    return {"status": "ok"}
