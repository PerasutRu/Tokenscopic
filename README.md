**🇹🇭 ภาษาไทย** | [🇺🇸 English](README_en.md)

<img width="1155" height="242" alt="Screenshot 2569-04-15 at 11 01 55" src="https://github.com/user-attachments/assets/48e79929-dd22-43b3-800f-9b290572afeb" />


# Tokenscopic 🔍

### HuggingFace Tokenizer Visualizer

> วิเคราะห์และแสดงผลการ Tokenize จากโมเดล HuggingFace แบบละเอียด ทั้งแบบเดี่ยวและเปรียบเทียบสองโมเดล

---

## ภาพรวม

Tokenscopic เป็นเว็บแอปที่ช่วยให้คุณเห็นว่า tokenizer ของแต่ละโมเดลแยกข้อความอย่างไร โดยออกแบบมาให้ดูง่ายและใช้งานไว:

- แสดงผล token แบบสีสัน (Visual), ตาราง (Table), และลำดับ Token IDs
- รองรับโหมด `Single` และ `Compare` (เทียบผลโมเดล A/B)
- รองรับ `Real-time` tokenization ขณะพิมพ์
- ค้นหาโมเดลจาก HuggingFace และแสดงโมเดลที่เคย cache ในเครื่อง
- จัดการเคส Private/Gated model พร้อมระบบขอ HF Token เมื่อจำเป็น

---

## วิดีโอสาธิต (Tutorial Video)

https://github.com/user-attachments/assets/8bded40a-f0af-4383-8518-6b7b10f2b80d

https://www.youtube.com/watch?v=W2vgiTUqpLM

### คำบรรยายภาษาไทย (Thai Description)

**Tokenscopic: เครื่องมือแสดงผลการตัดคำ (Tokenizer Visualizer) สำหรับโมเดล Hugging Face**

วิดีโอนี้สาธิตการทำงานของ **Tokenscopic** เว็บแอปพลิเคชันที่ช่วยให้คุณมองเห็นและเข้าใจกระบวนการ Tokenization ของโมเดลภาษาต่างๆ จาก Hugging Face ได้อย่างชัดเจน

**ฟีเจอร์เด่นที่ปรากฏในวิดีโอ:**

- **Single Model View:** ระบุชื่อ Model ID (เช่น Llama 3, Qwen) เพื่อดูว่าโมเดลนั้นแบ่งข้อความออกเป็น Token อย่างไร โดยรองรับทั้งโมเดลทั่วไปและ Gated Models ที่ต้องใช้ Access Token
- **Detailed Visualization:** แสดงผล Token แบบแยกสีให้ดูเข้าใจง่าย พร้อมสถิติสำคัญ (จำนวน Token, ตัวอักษร, ขนาด Vocab) และสามารถสลับดูข้อมูลเชิงลึกในรูปแบบตาราง (Table) หรือรหัส (Token IDs) ได้
- **Compare Models:** ฟีเจอร์เปรียบเทียบหน้าจอคู่ (Split View) ช่วยให้คุณเห็นความแตกต่างของการตัดคำระหว่าง 2 โมเดลกับข้อความเดียวกันได้แบบบรรทัดต่อบรรทัด
- **Real-time Update:** รองรับการประมวลผลและแสดงผลการเปลี่ยนแปลงของ Token แบบเรียลไทม์ในขณะที่คุณพิมพ์ข้อความ

---

## ฟีเจอร์หลัก


| Feature                             | Description                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| 🎨 **Colorful Token Visualization** | แต่ละ token มีสีต่างกัน พร้อม tooltip (`id`, `string`, `raw token`, `index`) |
| 📋 **3 View Modes**                 | Visual · Table · Token IDs                                                   |
| ⚖️ **Single / Compare Mode**        | วิเคราะห์โมเดลเดียว หรือเทียบ 2 โมเดลพร้อมกัน                                |
| ⚡ **Real-time Mode**                | พิมพ์แล้วอัปเดตผลอัตโนมัติ (มี debounce)                                     |
| 🔎 **Model Search**                 | ค้นหาโมเดลจาก HuggingFace และโมเดลใน cache เครื่อง                           |
| 📊 **Stats Dashboard**              | จำนวน token, characters, chars/token, vocab size                             |
| 🧠 **Tokenizer Class Source**       | แสดงทั้ง `Tokenizer Class (HF)` และ `Tokenizer Runtime Class` แยกกันชัดเจน   |
| 🌐 **TH / EN UI**                   | สลับภาษา UI ไทย/อังกฤษ                                                       |
| 🌙 **Dark / Light Theme**           | สลับธีมพร้อมจำค่าที่เคยเลือก                                                 |
| 💾 **Local Tokenizer Cache**        | โหลดครั้งแรกแล้วบันทึกใน `backend/tokenizer_model/`                          |


---

## โครงสร้างโปรเจกต์

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
│   ├── requirements-docker.txt   # dependencies สำหรับ image (ไม่มี accelerate)
│   └── tokenizer_model/          # auto-created tokenizer cache
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── package.json
    └── logo.png
```

---

## การติดตั้ง (ครั้งแรก)

### สิ่งที่ต้องมี

- Python `3.12+`
- Node.js `18+` และ `npm`

### 1) ติดตั้ง Backend dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2) ติดตั้ง Frontend dependencies

```bash
cd ../frontend
npm install
```

---

## การรันระบบ

### วิธีที่แนะนำ: สคริปต์รันอัตโนมัติ (`run.sh` / `run.bat`)

สคริปต์จะจัดการขั้นตอนพื้นฐานให้ก่อนเปิดเซิร์ฟเวอร์:

- ตรวจว่ามี **Python 3.12+** (ถ้าไม่ผ่านจะแจ้งแล้วออก)
- สร้าง `backend/.venv` ถ้ายังไม่มี แล้ว `activate` ก่อนรัน
- รัน `pip install -r requirements.txt` เมื่อจำเป็นเท่านั้น:
  - ครั้งแรก หรือ
  - เมื่อแก้ `backend/requirements.txt` ใหม่กว่าไฟล์ stamp `.venv/.requirements_installed`
- ติดตั้ง `frontend/node_modules` ด้วย `npm install` เมื่อยังไม่มีโฟลเดอร์นี้

**macOS / Linux**

```bash
chmod +x run.sh   # ครั้งแรกเท่านั้น ถ้ายังไม่มีสิทธิ์ execute
./run.sh
```

รัน backend และ frontend ในพื้นหลังเทอร์มินัลเดียวกัน — กด **Ctrl+C** เพื่อหยุดทั้งคู่

**Windows**

- ดับเบิลคลิก `run.bat`  
จะเปิดหน้าต่าง CMD แยกสำหรับ backend และ frontend — **ปิดหน้าต่างนั้น** เพื่อหยุดแต่ละฝั่ง

**URL หลังรันสำเร็จ**

- Frontend (live-server): `http://localhost:3000`
- Backend (FastAPI / API): `http://localhost:8000`  
เปิด `http://localhost:8000/` ได้โดยตรง — เซิร์ฟเวอร์จะส่งหน้า `index.html` เช่นกัน (เหมาะถ้าต้องการเข้าผ่านพอร์ตเดียว)

### วิธี Manual (เหมาะกับการ debug)

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

## การรันด้วย Docker (Docker Compose)

รัน **backend + frontend** เป็นสอง container แยกกัน ไม่ต้องติดตั้ง Python/Node บนเครื่อง (แค่มี Docker)

### สิ่งที่ต้องมี

- [Docker](https://docs.docker.com/get-docker/) พร้อม **Docker Compose** (รวมใน Docker Desktop)

### Services และพอร์ต


| Service    | พอร์ต (host) | คำอธิบาย                                                              |
| ---------- | ------------ | --------------------------------------------------------------------- |
| `backend`  | **8000**     | FastAPI + uvicorn (PyTorch **CPU เท่านั้น** ไม่มี GPU/CUDA)           |
| `frontend` | **3000**     | nginx เสิร์ฟ static จาก `frontend/` (ไม่มี Node/live-server ใน image) |


### คำสั่งหลัก

จากโฟลเดอร์รากของโปรเจกต์ (ที่มี `docker-compose.yml`):

```bash
docker compose up --build
```

รันเบื้องหลัง:

```bash
docker compose up --build -d
```

หยุดและลบ container:

```bash
docker compose down
```

ดู log แบบติดตาม:

```bash
docker compose logs -f
```

### URL หลังรันสำเร็จ

- UI: **[http://localhost:3000](http://localhost:3000)**
- API: **[http://localhost:8000](http://localhost:8000)** (ทดสอบได้ที่ `http://localhost:8000/api/health`)

เปิด UI ด้วย `http://127.0.0.1:3000` ก็ได้ — frontend จะเรียก API ที่โฮสต์เดียวกันพอร์ต 8000 อัตโนมัติ

### Cache tokenizer บนเครื่อง (bind mount)

`docker-compose.yml` mount โฟลเดอร์ `**backend/tokenizer_model/`** เข้าไปใน container ที่ `/app/backend/tokenizer_model` — ข้อมูล cache อยู่ใน repo ฝั่ง host โดยตรง (ยังถูก ignore โดย `.gitignore` เหมือนเดิม)

### build เฉพาะ service

```bash
docker compose build backend
docker compose build frontend
```

### ชื่อ image (โดยประมาณ)

Compose ตั้งชื่อจากชื่อโฟลเดอร์โปรเจกต์ เช่น `tokenizer_is_all_you_need-backend` และ `tokenizer_is_all_you_need-frontend` — ตรวจด้วย `docker images`

---

## คู่มือการใช้งานแบบละเอียด (Thai)

### A) โหมดวิเคราะห์แบบเดี่ยว (Single)

1. เปิดหน้าเว็บ `http://localhost:3000`
2. ตรวจว่าอยู่โหมด `Single`
3. ใส่ `Model ID` เช่น `meta-llama/Llama-3.2-1B`
4. (ทางเลือก) คลิกช่อง Model เพื่อเลือกจากรายการ cache หรือค้นหาจาก HuggingFace
5. ใส่ข้อความที่ต้องการ tokenize
6. กด `Tokenize Now` หรือ `Cmd+Enter` / `Ctrl+Enter`
7. ดูผลลัพธ์ในแท็บ:
  - `Visual`: token chips แบบสี
  - `Table`: รายละเอียด token รายแถว
  - `Token IDs`: ลำดับตัวเลข id ของ token

### B) โหมดเปรียบเทียบ (Compare)

1. เลือกโหมด `Compare Models`
2. ใส่ `Model A ID` และ `Model B ID`
3. ใส่ข้อความเดียวกันในช่องข้อความ
4. กด tokenize หนึ่งครั้ง ระบบจะยิงทั้งสองโมเดลพร้อมกัน
5. เทียบผลระหว่างคอลัมน์ซ้าย/ขวา:
  - จำนวน token รวม
  - ความต่างในการตัดคำ
  - token ids ที่ต่างกัน

### C) Real-time & Split View

1. เปิดสวิตช์ `Real-time & Split View`
2. เมื่อพิมพ์ข้อความ ระบบจะ re-tokenize อัตโนมัติ
3. เหมาะสำหรับทดลอง prompt engineering หรือดูผล tokenizer แบบ live

### D) การใช้งาน HuggingFace Token

ใช้ HF Token เฉพาะกรณีจำเป็น:

- กรณี `401 TOKEN_REQUIRED`: โมเดล private/gated และยังไม่ส่ง token
- กรณี `403 ACCESS_DENIED`: มักเป็น gated repo ที่ยังไม่ได้ Accept license

วิธีทำ:

1. สร้าง token ที่ [HuggingFace Tokens](https://huggingface.co/settings/tokens)
2. วาง token ในช่อง `hf_xxx...`
3. กด tokenize ซ้ำ
4. หากเป็น gated model ให้ไปกด Accept เงื่อนไขในหน้าโมเดลก่อน

### E) ระบบ Cache ทำงานอย่างไร

ลำดับการทำงาน:

1. ตรวจใน `backend/tokenizer_model/<safe_model_name>/`
2. ถ้ามี cache แล้ว → โหลด local ทันที
3. ถ้าไม่มี cache → ดาวน์โหลดจาก HuggingFace
4. ดาวน์โหลดสำเร็จ → บันทึก cache ไว้ใช้งานครั้งถัดไป

ผลลัพธ์: ครั้งต่อไปเร็วขึ้นและลดการเรียกเน็ต/การขอ token

รายละเอียดไฟล์ cache ที่สำคัญ:

- `_model_id.txt` เก็บ Model ID จริง
- `_tokenizer_class.txt` เก็บค่า `tokenizer_class` ที่ดึงจากไฟล์ `tokenizer_config.json` จริงบน HuggingFace
- `tokenizer_config.json`, `tokenizer.json` / `tokenizer.model` / `vocab.json` / `merges.txt` ใช้สำหรับโหลด tokenizer แบบ local

หมายเหตุ:

- ในหน้า UI จะแสดง `Tokenizer Class (HF)` จากไฟล์จริงของ HuggingFace
- และแสดง `Tokenizer Runtime Class` จาก class ที่รันจริงในฝั่ง `transformers`
- ถ้า cache เดิมทำให้ข้อความที่มีอักขระนอก ASCII ผิดเพี้ยน ระบบจะลบ cache โฟลเดอร์นั้นและดึง tokenizer จาก HuggingFace ใหม่ในคำขอนั้น

### F) ปุ่มและคอนโทรลสำคัญ


| Control           | หน้าที่                       |
| ----------------- | ----------------------------- |
| `TH / EN`         | เปลี่ยนภาษา UI                |
| `☀️ / 🌙`         | เปลี่ยนธีม                    |
| `Quick select`    | เลือกโมเดลยอดนิยมอย่างรวดเร็ว |
| `Copy` ในแท็บ IDs | คัดลอก token ids ไป clipboard |


---

## API Endpoints


| Method | Path                               | Description                                 |
| ------ | ---------------------------------- | ------------------------------------------- |
| `GET`  | `/api/health`                      | ตรวจสถานะ backend                           |
| `POST` | `/api/check_tokenizer`             | เช็กว่า model นี้มี cache แล้วหรือไม่       |
| `GET`  | `/api/cached_models`               | คืนรายชื่อโมเดลที่ cache ในเครื่อง          |
| `GET`  | `/api/search_models?q=...&limit=8` | ค้นหาโมเดลจาก HuggingFace                   |
| `POST` | `/api/tokenize`                    | tokenize ข้อความ (`hf_token` เป็น optional) |


ตัวอย่าง request:

```json
{
  "model_id": "meta-llama/Llama-3.2-1B",
  "text": "สวัสดี Tokenscopic",
  "hf_token": "hf_xxxx"
}
```

---

## การแก้ปัญหาเบื้องต้น

- รัน `./run.sh` แล้วขึ้น `Permission denied`
  - ใช้ `chmod +x run.sh` แล้วลองใหม่
- สคริปต์แจ้งว่า Python ต่ำกว่า 3.12
  - อัปเกรด Python แล้วตรวจว่า `python3 --version` เป็น 3.12 ขึ้นไป
- เปิดเว็บแล้วขึ้น `Cannot connect to backend`
  - ตรวจว่า backend รันที่ `:8000`
- โมเดลค้นหาไม่ขึ้น
  - ตรวจอินเทอร์เน็ต และลอง query ที่ยาวอย่างน้อย 2 ตัวอักษร
- เจอ `ACCESS_DENIED`
  - ไป Accept license บนหน้า HuggingFace model ก่อน
- Tokenize ช้าในครั้งแรก
  - ปกติ เพราะกำลังดาวน์โหลด tokenizer; ครั้งถัดไปจะเร็วขึ้นจาก cache
- ใช้ Docker แล้ว frontend ไม่ขึ้นหรือกดแล้วไม่ทำงาน
  - ตรวจว่า `docker compose ps` ทั้ง `backend` และ `frontend` เป็น `running`
  - ดู log: `docker compose logs frontend` / `docker compose logs backend`

---

## Tech Stack

- Frontend: HTML, CSS, Vanilla JS
- Backend: FastAPI (Python)
- Tokenizer: `transformers` + `sentencepiece`
- Dev Frontend Server: `live-server`
- Cache: local filesystem
- Deploy (ทางเลือก): Docker Compose — backend image (Python slim + PyTorch CPU), frontend image (nginx alpine)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Author

Created by **Perasut Rungcharassang**
