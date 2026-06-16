from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple
import spacy
import contractions
import re
from transformers import pipeline, DistilBertForSequenceClassification, DistilBertTokenizer
import torch
import os

app = FastAPI(title="NomNom AI ABSA Inference")

# Load SpaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spacy model...")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Load DistilBERT model
# Check paths in order: code/checkpoint-10000 (local), checkpoint-10000 (deployed/local), or current directory
model_path = "."
for path in ["./code/checkpoint-10000", "./checkpoint-10000", "."]:
    if os.path.exists(os.path.join(path, "config.json")):
        model_path = path
        break

try:
    print(f"Loading model from {model_path}...")
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    model = DistilBertForSequenceClassification.from_pretrained(model_path)
    sentiment_analyzer = pipeline(
        "text-classification", 
        model=model, 
        tokenizer=tokenizer,
        device=0 if torch.cuda.is_available() else -1
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Failed to load model from {model_path}: {e}")
    sentiment_analyzer = None

class PredictRequest(BaseModel):
    text: str

class AspectOpinionPair(BaseModel):
    aspek: str
    opini: str
    sentimen: Optional[str] = None
    keyakinan: Optional[str] = None

class SentimentRequest(BaseModel):
    pairs: List[AspectOpinionPair]

def preprocessing(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'<.*?>', ' ', text)
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'www\.\S+', '', text)
    text = contractions.fix(text)
    text = " ".join(text.split())
    return text

def get_focus_sentence(aspect: str, opinion: str) -> str:
    return f"The {aspect} is {opinion}"

def extract_aspects(text: str) -> List[AspectOpinionPair]:
    doc = nlp(text)
    pairs = []
    
    for token in doc:
        # Scenario 1 & 2: Adjective modifying noun or as complement
        if token.pos_ == "ADJ":
            aspect = None
            opinion = token.text
            
            # Negation and intensifier
            negation = ""
            intensifier = ""
            for child in token.children:
                if child.dep_ == "neg":
                    negation = child.text + " "
                if child.dep_ == "advmod":
                    intensifier = child.text + " "
            
            opinion = negation + intensifier + opinion
            
            # amod
            if token.dep_ == "amod":
                aspect = token.head.text
            # acomp
            elif token.dep_ == "acomp":
                for child in token.head.children:
                    if child.dep_ in ["nsubj", "nsubjpass"]:
                        aspect = child.text
            
            if aspect:
                pairs.append(AspectOpinionPair(aspek=aspect, opini=opinion))
                
        # Scenario 3: Verb as opinion
        elif token.pos_ == "VERB":
            aspect = None
            opinion = token.text
            
            negation = ""
            intensifier = ""
            for child in token.children:
                if child.dep_ == "neg":
                    negation = child.text + " "
                if child.dep_ == "advmod":
                    intensifier = child.text + " "
                    
            opinion = negation + intensifier + opinion
            
            for child in token.children:
                if child.dep_ in ["dobj", "nsubjpass"]:
                    aspect = child.text
                    
            if aspect:
                pairs.append(AspectOpinionPair(aspek=aspect, opini=opinion))
                
    return pairs

def classify_sentiment(aspect: str, opinion: str) -> Tuple[str, str]:
    if not sentiment_analyzer:
        return "Unknown", "0%"
        
    focus = get_focus_sentence(aspect, opinion)
    pred = sentiment_analyzer(focus)[0]
    
    label = "Positif" if pred['label'] == 'LABEL_1' else "Negatif"
    score = f"{pred['score'] * 100:.1f}%"
    return label, score

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": sentiment_analyzer is not None}

@app.post("/predict-bert")
def predict_bert(req: PredictRequest):
    if not sentiment_analyzer:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    clean_text = preprocessing(req.text)
    extracted = extract_aspects(clean_text)
    
    results = []
    for pair in extracted:
        label, score = classify_sentiment(pair.aspek, pair.opini)
        pair.sentimen = label
        pair.keyakinan = score
        results.append(pair)
        
    if not results:
        return {"results": [], "message": "Tidak ada aspek dan opini yang berhasil diekstrak."}
        
    return {"results": [p.dict() for p in results]}

@app.post("/predict-sentiment")
def predict_sentiment(req: SentimentRequest):
    if not sentiment_analyzer:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    results = []
    for pair in req.pairs:
        label, score = classify_sentiment(pair.aspek, pair.opini)
        pair.sentimen = label
        pair.keyakinan = score
        results.append(pair)
        
    return {"results": [p.dict() for p in results]}
