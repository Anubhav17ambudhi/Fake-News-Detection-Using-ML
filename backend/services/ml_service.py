import os
import torch
import torch.nn.functional as F
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

# Construct path to the Hugging Face model folder
# Ensure this folder is at the root of your backend directory (alongside main.py)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "distilbert_fakenews_final")

# Global instances mapped into memory during server startup
tokenizer = None
model = None

def load_ml_models():
    global tokenizer, model
    if not os.path.exists(MODEL_DIR):
        raise FileNotFoundError(f"Model directory not found at {MODEL_DIR}. Please download the 4 Hugging Face files.")
    
    # Load token rules and weights directly from the local folder
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
    model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
    
    # Freeze gradients and set to inference mode for maximum speed
    model.eval()
    
    # Automatically map to CUDA if an NVIDIA GPU is available on the local machine
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

async def predict_ml(text: str) -> dict:
    global tokenizer, model
    if tokenizer is None or model is None:
        load_ml_models()
        
    device = next(model.parameters()).device
    
    # Tokenize input using DistilBERT's 512-token context window
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512
    ).to(device)
    
    # Run forward pass without tracking graph history (saves RAM)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = F.softmax(logits, dim=-1)
        
    # Extract probabilities (Index 0 = Fake, Index 1 = Real based on our dataset mapping)
    prob_fake = probabilities[0][0].item()
    prob_real = probabilities[0][1].item()
    
    predicted_class = torch.argmax(probabilities, dim=-1).item()
    verdict = "Real" if predicted_class == 1 else "Fake"
    confidence = prob_real if predicted_class == 1 else prob_fake
    
    return {
        "ml_verdict": verdict,
        "ml_confidence": confidence
    }