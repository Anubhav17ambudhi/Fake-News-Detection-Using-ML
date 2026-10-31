# TruthLens — Fake News Detection System

TruthLens is a full-stack misinformation detection system that combines a pre-trained dual-branch deep learning model with a real-time fact-checking agent. Users paste an article, and the system returns both a statistical ML confidence score and live web-verified reasoning in a single aggregated verdict.

## Architecture

The backend runs two verification branches in parallel on every request:

```
                        ┌───────────────────────────────────┐
   User submits         │        FastAPI  /api/v1/verify    │
   article text ──────► │                                   │
                        │   asyncio.gather(ml, agent)       │
                        └──────┬────────────────┬───────────┘
                               │                │
                ┌──────────────▼──┐    ┌────────▼──────────────┐
                │  ML Branch      │    │  Agent Branch          │
                │                 │    │                        │
                │  TF-IDF vector  │    │  Gemini extracts the   │
                │  + Tokenizer    │    │  core factual claim    │
                │  sequences fed  │    │         │              │
                │  into a Keras   │    │  DuckDuckGo live       │
                │  dual-input     │    │  news search           │
                │  model (.h5)    │    │         │              │
                │         │       │    │  Gemini synthesizes    │
                │  Outputs a      │    │  supported/contradicted│
                │  probability    │    │  /unverified + sources │
                │  (0.0 – 1.0)    │    │                        │
                └────────┬────────┘    └────────┬───────────────┘
                         │                      │
                         └──────────┬───────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  Aggregation       │
                          │                    │
                          │  ML says Real but  │
                          │  agent finds       │
                          │  contradiction?    │
                          │  → override: Fake  │
                          │                    │
                          │  ML says Fake but  │
                          │  agent confirms    │
                          │  support?          │
                          │  → override: Real  │
                          └─────────┬──────────┘
                                    │
                              Final Verdict
                          + confidence + reasoning
                          + cited source URLs
```

**ML Branch** — A Keras model with two input heads. Branch A takes a TF-IDF feature vector (vocabulary frequency patterns); Branch B takes a padded token sequence (word-order semantics). Both are merged internally and produce a single probability: values above 0.5 are classified as Real, at or below 0.5 as Fake.

**Agent Branch** — A three-step LangChain pipeline. First, Google Gemini extracts the central verifiable claim from the article (kept under 15 words). That claim is searched on DuckDuckGo News. Finally, Gemini evaluates the search evidence against the original claim and returns structured reasoning plus source URLs.

**Aggregation** — If the two branches disagree (e.g., the ML model scores an article as Real but the agent finds contradictory evidence from live sources), the aggregation logic overrides the ML verdict.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Machine Learning | TensorFlow / Keras, Scikit-learn, NumPy |
| Agentic Fact-Checking | LangChain, Google Gemini (gemini-3.5-flash), DuckDuckGo Search |
| Config | python-dotenv |

## Directory Structure

```
Fake-News-Detection-Using-ML/
├── backend/
│   ├── main.py                            # FastAPI app and /api/v1/verify endpoint
│   ├── requirements.txt                   # Python dependencies
│   ├── .env                               # GOOGLE_API_KEY (not committed)
│   ├── models/
│   │   ├── dual_branch_fakenews_model.h5  # Pre-trained Keras model
│   │   ├── tfidf_vectorizer.pkl           # Fitted TF-IDF vectorizer
│   │   └── tokenizer.pkl                  # Fitted Keras tokenizer
│   └── services/
│       ├── ml_service.py                  # Loads model artifacts, runs inference
│       └── agent_service.py               # Gemini claim extraction + DuckDuckGo search + synthesis
├── frontend/
│   ├── package.json
│   ├── vite.config.js                     # Dev proxy: /api → http://127.0.0.1:8000
│   └── src/
│       ├── App.jsx                        # Root component, state management, history
│       ├── services/api.js                # fetch wrapper for /api/v1/verify
│       ├── components/
│       │   ├── Header.jsx                 # Top bar with backend status indicator
│       │   ├── ArticleInput.jsx           # Text area, word counter, sample articles
│       │   ├── VerificationResult.jsx     # Verdict banner, ML gauge, agent reasoning card
│       │   ├── HistoryDrawer.jsx          # LocalStorage-backed search history panel
│       │   └── BackendStatusModal.jsx     # Connection status modal
│       └── data/
│           └── sampleArticles.js          # Pre-loaded example articles for demo
└── README.md
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- A **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/)

## Setup and Installation

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows (PowerShell):
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

If you are running Python 3.12 or newer, TensorFlow ships with Keras 3 by default, which does not load legacy `.h5` models out of the box. Install the compatibility package:

```bash
pip install tf_keras
```

Create a `.env` file in the `backend/` directory:

```
GOOGLE_API_KEY=your_gemini_api_key_here
```

Start the server:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Confirm it is running by opening http://127.0.0.1:8000/docs in a browser — you should see the Swagger UI.

### Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at http://localhost:5173. It proxies all `/api` requests to the backend automatically, so no CORS configuration is needed.

## API Reference

### `POST /api/v1/verify`

Accepts a news article and returns the combined ML + agent verification result.

**Request body:**

```json
{
  "text": "Full article text here. Must be at least 20 words."
}
```

**Response:**

```json
{
  "ml_confidence": 0.872,
  "ml_verdict": "Real",
  "agent_reasoning": "The claim that ... was corroborated by multiple recent reports from Reuters and AP News. The evidence supports the original statement.",
  "agent_sources": [
    "https://reuters.com/...",
    "https://apnews.com/..."
  ],
  "final_verdict": "Real"
}
```

| Field | Type | Description |
|---|---|---|
| `ml_confidence` | float | Raw probability from the Keras model (0.0–1.0). Above 0.5 = Real. |
| `ml_verdict` | string | `"Real"` or `"Fake"` based on the 0.5 threshold. |
| `agent_reasoning` | string | Gemini's synthesized explanation after reviewing live search evidence. |
| `agent_sources` | string[] | URLs or publication names the agent cited. May be empty. |
| `final_verdict` | string | Aggregated result after cross-checking both branches. |

**Error responses:**

| Status | Condition |
|---|---|
| 400 | Article text has fewer than 20 words. |
| 504 | ML inference or agent search timed out. |

## Contributors

| Name | Registration No. | Contribution |
|---|---|---|
| **Anubhav Vishwakarma** | 20231015 | |
| **Vivekanand Pandey** | 20233318 | |
| **Vishal Patel** | 20233314 | |
| **Uday Choudhary** | 20233293 | |
