import pickle
import numpy as np
import asyncio
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 1. Load the artifacts globally (so they only load once when FastAPI starts)
try:
    print("Loading ML models into memory. This might take a few seconds...")
    model = load_model("models/dual_branch_fakenews_model.h5")
    
    with open("models/tfidf_vectorizer.pkl", "rb") as f:
        tfidf_vectorizer = pickle.load(f)
        
    with open("models/tokenizer.pkl", "rb") as f:
        tokenizer = pickle.load(f)
        
    print("ML models loaded successfully!")
except Exception as e:
    print(f"Error loading models. Ensure files are in the 'models' directory. Details: {e}")

async def predict_ml(text: str) -> float:
    """
    Takes raw article text, runs it through the dual-branch Keras model, 
    and returns a probability score between 0.0 and 1.0.
    """
    # 2. Text Preprocessing (Must match Colab exactly)
    # Truncate to the first 500 words to match the trained dimensions
    short_text = " ".join(text.split()[:500])
    
    # 3. Prepare Branch A: TF-IDF Features
    # Note: We put the text in a list [short_text] because the vectorizer expects an iterable of documents
    X_tfidf = tfidf_vectorizer.transform([short_text]).toarray()
    
    # 4. Prepare Branch B: Sequence Features
    X_seq = tokenizer.texts_to_sequences([short_text])
    X_seq_padded = pad_sequences(X_seq, maxlen=500)
    
    # 5. Run Inference
    # We use asyncio.to_thread because Keras model.predict is a blocking synchronous function. 
    # This prevents the ML calculation from freezing the rest of your FastAPI app.
    # Run synchronously on the main thread to prevent TF deadlocks
    prediction = model.predict(
        {"tfidf_input": X_tfidf, "seq_input": X_seq_padded},
        verbose=0
    )
    
    # prediction is a 2D numpy array like [[0.854]]. We extract the float scalar.
    probability = float(prediction[0][0])
    
    return probability