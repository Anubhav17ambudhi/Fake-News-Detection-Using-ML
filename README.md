# Fake News Detection Using Machine Learning

> Semester project for our degree coursework.  
> A full-stack web app that checks articles using both a fine-tuned DistilBERT model and live web searches with Gemini and DuckDuckGo.

---

## What is this project?

Most fake news detectors you find online only look at the text itself. They check writing style, tone, and whether the headline sounds like clickbait. While that helps spot cheap hoaxes, it completely fails when an article is well-written but factually wrong, or when someone writes about something that happened this morning that the model was never trained on.

We wanted to fix that, so we built this hybrid system. Instead of relying on just one method, our app runs two checks side by side:

1. **DistilBERT model** — A transformer model fine-tuned on fake news datasets that checks the writing style, vocabulary, and patterns commonly found in fabricated news.
2. **Web verification agent** — An agent built with LangChain and Google Gemini that pulls out the main factual claims from the article, searches DuckDuckGo for live news reports, and checks if credible sources back them up.

We combine both results into a final verdict and stream each step to the frontend over WebSockets so you can watch each claim get checked in real time.

---

## How it works

```
Article Input (Text, min 20 words)
        │
        ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Backend                      │
│                                                        │
│   ┌──────────────────────┐  ┌────────────────────────┐ │
│   │   DistilBERT Model   │  │      Agent Service     │ │
│   │   (PyTorch)          │  │  (LangChain + Gemini)  │ │
│   │                      │  │                        │ │
│   │  • Tokenizes text    │  │  • Extracts headline   │ │
│   │  • Runs inference    │  │  • Pulls top 3 claims  │ │
│   │  • Outputs score     │  │  • Searches DuckDuckGo │ │
│   │  • Checks style      │  │  • Verifies evidence   │ │
│   └──────────┬───────────┘  └──────────┬─────────────┘ │
│              └──────────┬──────────────┘               │
│                         ▼                              │
│                 Final Verdict Logic                    │
│               (WebSocket Stream to UI)                 │
└────────────────────────────────────────────────────────┘
        │
        ▼
React Frontend (Vite + Tailwind CSS)
```

1. You paste an article (at least 20 words so there is enough text to analyze).
2. DistilBERT runs first and returns an instant real/fake probability score in about 200ms.
3. In the background, Gemini reads the article and breaks it down into up to 3 verifiable claims.
4. For each claim, we run parallel searches on DuckDuckGo to find actual reporting from news outlets.
5. Gemini reads the search results, decides if the claim is corroborated, refuted, or inconclusive, and attaches source links.
6. The backend puts both checks together: if the text style looks real but news archives directly contradict the claims, the system flags the article as fake.

---

## Tech Stack

### Backend
- **FastAPI** — Handles REST requests and the WebSocket connection.
- **PyTorch & Hugging Face Transformers** — Runs our local DistilBERT model.
- **LangChain & Google Gemini** (`gemini-2.5-flash`) — Handles claim extraction and evidence checking.
- **DuckDuckGo Search & BeautifulSoup** — Finds live news articles without needing a paid search API.
- **Pydantic** — Validates incoming requests and parses LLM JSON outputs.

### Frontend
- **React 19 & Vite** — Fast frontend build setup.
- **Tailwind CSS** — Clean, responsive layout.
- **Lucide React** — Icons.
- **WebSockets** — Streams results step-by-step from the backend.

---

## Project Structure

```
Fake-News-Detection-Using-ML/
│
├── backend/
│   ├── main.py                         # FastAPI routes and WebSocket handler
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Template for environment variables
│   │
│   ├── distilbert_fakenews_final/      # Saved DistilBERT model weights and tokenizer
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   ├── tokenizer.json
│   │   └── tokenizer_config.json
│   │
│   ├── models/                         # Earlier Keras model experiment
│   │   ├── dual_branch_fakenews_model.h5
│   │   ├── tfidf_vectorizer.pkl
│   │   └── tokenizer.pkl
│   │
│   └── services/
│       ├── ml_service.py               # Model loading and DistilBERT prediction
│       └── agent_service.py            # LangChain agent, search, and fact verification
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Main React component and state management
│   │   ├── components/
│   │   │   ├── Header.jsx              # Navigation and server status badge
│   │   │   ├── ArticleInput.jsx        # Text box, word counter, and sample picker
│   │   │   ├── PipelineStepper.jsx     # Progress tracker for the 5 stages
│   │   │   ├── MlVerdictCard.jsx       # Gauge card and text analysis stats
│   │   │   ├── FactCheckList.jsx       # List of verified claims with status badges
│   │   │   ├── FactItem.jsx            # Single claim accordion with clickable sources
│   │   │   ├── FinalVerdictBanner.jsx  # Final verdict card with explanation
│   │   │   ├── ActivityLog.jsx         # Telemetry log for debugging
│   │   │   ├── DebunkArchive.jsx       # Pre-checked real-world articles
│   │   │   ├── MethodologyView.jsx     # Explanation of how the dual check works
│   │   │   ├── SourceDirectory.jsx     # List of credible news sources
│   │   │   └── VerificationDossierModal.jsx # Printable report modal
│   │   └── data/
│   │       ├── sampleArticles.js       # Pre-loaded sample articles for testing
│   │       ├── debunkArchiveData.js    # Data for the debunk archive tab
│   │       └── sourceDirectoryData.js  # Directory data for trusted outlets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── bert_training_MINI_PROJECT.ipynb    # Google Colab notebook used to train DistilBERT
├── ML_model_training.ipynb             # Notebook for our earlier Keras baseline
└── README.md
```

---

## How to Run It Locally

### Prerequisites
- Python 3.10 to 3.13
- Node.js 18+ and npm
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### Step 1: Set Up the Backend

Open a terminal and go into the `backend` folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Set up your `.env` file:

```bash
cp .env.example .env
```

Open `.env` and paste your Gemini key:

```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Start the backend server:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Once the model loads into memory, you will see:
```
[System] Loading DistilBERT ML Model into memory...
[System] ML Model loaded successfully!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Step 2: Set Up the Frontend

Open another terminal and go into the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The status pill in the top right will turn green and say **Connected** once it detects the backend.

---

### Step 3: Test an Article

1. Paste any news text (minimum 20 words) into the input box, or click one of the sample buttons at the top.
2. Click **Verify Article** or press `Ctrl + Enter`.
3. DistilBERT will classify the text style right away, and then the agent will extract and verify the claims one by one with live search sources.

---

## Model Details

### DistilBERT Classifier
- **Base model:** `distilbert-base-uncased` (66 million parameters).
- **Task:** Sequence classification (`Real` vs `Fake`).
- **Input limit:** 512 tokens.
- **Inference:** Runs locally with PyTorch. It automatically uses an NVIDIA GPU if you have one with CUDA set up, otherwise it runs on CPU.

### Gemini Agent
- **Model:** `gemini-2.5-flash` via LangChain.
- **Temperature:** Set to `0.1` so the answers stay grounded in the retrieved search results.
- **Output:** Pydantic schemas enforce clean JSON so the frontend can parse the claims and sources without errors.

---

## API Reference

### WebSocket: `/ws/verify`

The frontend uses this to show real-time progress while an article is being analyzed.

**Client sends:**
```json
{
  "text": "Full article text here (minimum 20 words)..."
}
```

**Server sends back:**
| Step | Payload | Description |
|---|---|---|
| `ml_verdict` | `{"ml_verdict": "Real", "ml_confidence": 0.94}` | Instant result from DistilBERT |
| `extraction_complete` | `{"heading": "...", "facts": ["..."]}` | Headline and claims extracted by Gemini |
| `fact_verified` | `{"data": {"fact": "...", "status": "...", "sources": [...]}}` | Verdict and sources for a single claim |
| `agent_complete` | `{"overall_verdict": "Real"}` | Final decision from web checking |
| `error` | `{"message": "..."}` | Error description if something breaks |

---

### REST Endpoint: `POST /api/v1/verify`

If you want to test verification via cURL or Postman without WebSockets:

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/verify" \
     -H "Content-Type: application/json" \
     -d '{"text": "Your article text here (minimum 20 words)..."}'
```

**Response:**
```json
{
  "ml_confidence": 0.938,
  "ml_verdict": "Real",
  "article_heading": "Article Headline",
  "fact_checks": [
    {
      "fact": "Specific claim from the article",
      "status": "Strong Support",
      "reasoning": "Confirmed by multiple news reports.",
      "sources": ["https://example.com/news-report"]
    }
  ],
  "final_verdict": "Real"
}
```

---

## Troubleshooting

- **Model folder missing error:**  
  Make sure the `distilbert_fakenews_final/` folder is inside the `backend/` directory. It should contain `config.json`, `model.safetensors`, `tokenizer.json`, and `tokenizer_config.json`.
- **Frontend shows Offline:**  
  Make sure your backend is running on `127.0.0.1:8000`. You can check if it is alive by opening `http://127.0.0.1:8000/docs` in your browser.
- **Port already in use:**  
  If port 8000 is taken, run Uvicorn on another port:  
  `python -m uvicorn main:app --port 8001`  
  Then update the URL in the settings gear icon in the frontend header.
- **First request takes longer:**  
  The first analysis takes a few extra seconds because PyTorch is loading the weights into memory. Requests after that run much faster.

---

## Team Details

| S.No. | Reg. Number | Name |
|---|---|---|
| 1 | 20231015 | Anubhav Vishwakarma |
| 2 | 20233318 | Vivekananda Pandey |
| 3 | 20233314 | Vishal Patel |
| 4 | 20233293 | Uday Choudhary |

---

## License

Built for our semester project and educational use.
