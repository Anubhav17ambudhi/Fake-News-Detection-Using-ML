# TruthLens AI — Frontend

A modern, responsive React frontend for the Fake News Detection system. It interfaces with the untouched FastAPI backend to deliver real-time news verification combining dual-branch Keras deep learning and Google Gemini agentic fact-checking.

---

## ⚡ Zero Backend Changes Required

The frontend includes a configured reverse proxy in `vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  }
}
```

This routes all frontend requests from `http://localhost:5173/api/v1/verify` to `http://127.0.0.1:8000/api/v1/verify` directly on the server level, preventing any browser CORS issues without modifying a single line of backend code.

---

## 🚀 Getting Started

### 1. Install Frontend Dependencies
From the `frontend` folder:
```bash
npm install
```

### 2. Start the Backend Server
In a separate terminal, navigate to the `backend` folder and launch the FastAPI server:
```bash
cd backend
uvicorn main:app --reload
```
*(Ensure `models/` artifacts and `GOOGLE_API_KEY` in `backend/.env` are present.)*

### 3. Start the Frontend Dev Server
In your `frontend` terminal:
```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠 Features

- **Dual-Engine Visualization**:
  - Displays classification verdict & certainty percentage for the dual-branch neural network (TF-IDF + sequence tokens).
  - Displays synthesized fact-checking reasoning from Google Gemini 3.5.
  - Lists verified web sources and news citations retrieved via DuckDuckGo.
- **Pre-loaded Samples**: One-click real and fake news sample articles to test the system immediately.
- **Word Count Meter**: Live counter enforcing the backend's minimum 20-word requirement with intuitive visual warnings.
- **Local History**: Automatically saves verified reports to browser `localStorage` for easy reference and re-reading.
- **Live Server Status**: Real-time ping checking if your local FastAPI instance is reachable.
- **Clipboard & Export**: One-click paste and formatted verification report copying.

---

## 📦 Production Build

```bash
npm run build
```
Builds the optimized production assets into `frontend/dist/`.
