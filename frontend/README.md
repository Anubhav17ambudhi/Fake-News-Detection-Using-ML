# Veritas AI - Real-Time Agentic Fake News Detection Frontend

A modern, responsive React + Tailwind CSS dashboard that communicates in real-time with the FastAPI backend over WebSockets to provide instant DistilBERT neural classification and streaming multi-agent web verification.

---

## 🚀 How to Run and Test the Application

### Step 1: Start the FastAPI Backend
Ensure your Python virtual environment is activated and your Ollama model (`qwen2.5:1.5b`) is running:

1. Open a terminal in the `backend` folder:
   ```bash
   cd "d:\CSE\#7th_Sem\MINI PROJECT MATERIAL\CODE\backend"
   ```
2. Make sure Ollama is running in the background:
   ```bash
   ollama serve
   ```
3. Run the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Your WebSocket endpoint will be live at: `ws://127.0.0.1:8000/ws/verify`*

---

### Step 2: Start the React Frontend Development Server
All dependencies (`lucide-react`, `tailwindcss`, etc.) are already installed!

1. Open a new terminal in the `frontend` folder:
   ```bash
   cd "d:\CSE\#7th_Sem\MINI PROJECT MATERIAL\CODE\frontend"
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at the URL shown in the terminal (usually `http://localhost:5173`).

---

## 🧪 How to Test

1. Click on one of the **Quick Samples** buttons:
   - **NASA Webb Telescope (Real)**: Tests genuine news with strong factual support.
   - **Water Supply Frequency (Fake)**: Tests sensational disinformation with obvious contradictions.
   - **Mammoth Surrogate (Mixed)**: Tests emerging or uncorroborated claims.
2. Click **"Verify Article"**.
3. Watch the real-time agent workflow unfold:
   - **Phase 1**: Instant DistilBERT neural prediction appears in ~250ms with confidence score.
   - **Phase 2**: Article heading is extracted and claims appear with `⏳ Verifying Web Evidence...` loaders.
   - **Phase 3**: Concurrent DuckDuckGo search threads verify each claim one by one, turning green, red, or orange with reasoning and source links.
   - **Phase 4**: The Final System Verdict banner illuminates at the bottom of the page.
