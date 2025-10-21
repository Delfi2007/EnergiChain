# EnergiChain AI Services

Complete AI/ML implementation for the EnergiChain blockchain-powered LPG distribution platform.

## 📁 Structure

```
ai/
├── gpt4/                    - GPT-4 integration (✅ COMPLETE)
│   ├── chatbot.js          - Multilingual chatbot with streaming
│   └── intent-classifier.js - 10 intents with entity extraction
├── rag/                     - RAG for knowledge retrieval (✅ COMPLETE)
│   ├── rag-engine.js       - Vector search + GPT-4 generation
│   ├── knowledge-base.json - 25+ LPG safety/business documents
│   └── embeddings.json     - Cached OpenAI embeddings
├── computer-vision/         - CV safety scanner (✅ COMPLETE)
│   └── cylinder_scanner.py - TensorFlow CNN (6 classes)
├── demand-forecasting/      - LSTM predictions (✅ COMPLETE)
│   └── forecaster.py       - 7-day demand forecasting
├── index.js                 - REST API server (Express)
├── package.json             - Node.js dependencies
├── requirements.txt         - Python dependencies
└── .env.example             - Environment template
```

## 🤖 Features

### 1. GPT-4 Chatbot (chatbot.js)
- ✅ Bilingual: English + Swahili
- ✅ 10 intent types: order, track, pricing, payment, safety, carbon, refund, complaint, referral, general
- ✅ Conversation history (last 10 exchanges per user)
- ✅ Streaming responses with Server-Sent Events
- ✅ Quick reply buttons based on intent
- ✅ EnergiChain context in system prompt

### 2. RAG Knowledge Base (rag-engine.js)
- ✅ 25 documents: safety (4), pricing (2), ordering (2), payment (2), carbon credits (2), delivery (2), referral (2), tech (2), support (2), circular economy (1), forecasting (1)
- ✅ OpenAI text-embedding-3-small for vector embeddings
- ✅ Cosine similarity search
- ✅ Top-K retrieval (default 3 documents)
- ✅ GPT-4 answer generation with source attribution
- ✅ Confidence scoring based on similarity
- ✅ Cached embeddings for fast loading

### 3. Computer Vision Safety Scanner (cylinder_scanner.py)
- ✅ TensorFlow CNN: 224x224 input, 6 output classes
- ✅ Classes: safe, rust, dent, valve_damage, expired, leaking
- ✅ Severity levels: 0-5 (safe to critical)
- ✅ Data augmentation: rotation, flip, zoom, shift
- ✅ Rust detection via HSV color analysis
- ✅ OCR placeholder for expiry date reading
- ✅ JSON safety reports with recommendations
- ⏳ Requires training with labeled cylinder image dataset

### 4. Demand Forecasting (forecaster.py)
- ✅ LSTM architecture: 3 layers (128→64→32 units)
- ✅ 30-day lookback window
- ✅ 7-day forecast horizon
- ✅ 7 features per day: days_since_last, cylinder_size, day_of_week, week_of_month, month, family_size, avg_interval
- ✅ Usage pattern analysis: heavy/regular/light user
- ✅ Consistency scoring: very_consistent, consistent, variable
- ✅ Personalized recommendations: urgent/medium/low urgency
- ⏳ Requires training with historical customer order data

## 🚀 Quick Start

### 1. Install Node.js Dependencies
```bash
cd ai
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

### 4. Start AI API Server
```bash
npm start
```

Server runs on `http://localhost:3001` with endpoints:
- `POST /api/chat` - Chatbot conversations
- `POST /api/rag/answer` - RAG question answering
- `POST /api/intent` - Intent classification
- `POST /api/rag/search` - Knowledge base search

## 📡 API Examples

### Chat with Bilingual Support
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Ninahitaji silinda ya gesi 13kg",
    "language": "sw"
  }'
```

### RAG Answer with Sources
```bash
curl -X POST http://localhost:3001/api/rag/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I detect a gas leak?",
    "language": "en"
  }'
```

### Intent Classification
```bash
curl -X POST http://localhost:3001/api/intent \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to order 13kg cylinder"}'
```

### Search Knowledge Base
```bash
curl -X POST http://localhost:3001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "cylinder storage safety", "topK": 5}'
```

## 🧠 Python AI Services

### Computer Vision Scanner
```python
from computer-vision.cylinder_scanner import CylinderSafetyScanner

scanner = CylinderSafetyScanner()
report = scanner.scan_cylinder('path/to/cylinder_image.jpg')

print(f"Primary Issue: {report['primary_issue']}")
print(f"Confidence: {report['confidence']:.2%}")
print(f"Safe to Use: {report['is_safe']}")
print(f"Recommendation: {report['recommendation']}")
```

### Demand Forecasting
```python
from forecaster import DemandForecaster

forecaster = DemandForecaster()

customer_data = {
    'customer_id': 'CUST123',
    'family_size': 4,
    'orders': [
        {'date': '2024-01-15', 'cylinder_size': '13kg'},
        {'date': '2024-02-10', 'cylinder_size': '13kg'},
        {'date': '2024-03-05', 'cylinder_size': '13kg'}
    ]
}

prediction = forecaster.predict_next_order(customer_data)
print(f"Predicted Order Date: {prediction['predicted_order_date']}")
print(f"Confidence: {prediction['confidence']:.2%}")
```

## 🎯 Model Training

### Train Computer Vision Model
```python
from cylinder_scanner import CylinderSafetyScanner

scanner = CylinderSafetyScanner()
history = scanner.train_model(
    train_dir='dataset/train',
    val_dir='dataset/val',
    epochs=50,
    batch_size=32
)
# Model saved to: models/cylinder_safety_model.h5
```

### Train Demand Forecasting Model
```python
from forecaster import DemandForecaster

forecaster = DemandForecaster()
# Prepare your X_train, y_train, X_val, y_val
history = forecaster.train_model(
    train_data=(X_train, y_train),
    val_data=(X_val, y_val),
    epochs=100,
    batch_size=32
)
# Model saved to: models/demand_lstm_model.h5
```

## 🔧 Integration with Frontend

### JavaScript Chat Widget
```javascript
async function sendMessage(message) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: localStorage.getItem('userId'),
      message: message,
      language: document.getElementById('lang').value
    })
  });
  const data = await response.json();
  displayMessage(data.response, 'bot');
  showQuickReplies(data.quickReplies);
}
```

### RAG Integration
```javascript
async function askQuestion(question) {
  const response = await fetch('http://localhost:3001/api/rag/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language: 'en' })
  });
  const result = await response.json();
  
  document.getElementById('answer').innerText = result.answer;
  document.getElementById('confidence').innerText = `${result.confidence}%`;
  displaySources(result.sources);
}
```

## 🔑 Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
NODE_ENV=development
PORT=3001
GPT_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=3
RAG_MIN_SIMILARITY=0.7
```

## 📚 Technologies

- **OpenAI GPT-4** - Conversational AI, answer generation
- **OpenAI text-embedding-3-small** - Vector embeddings (1536 dimensions)
- **TensorFlow 2.13+** - Deep learning framework
- **Keras** - High-level neural network API
- **NumPy/Pandas** - Data processing
- **OpenCV** - Image preprocessing
- **Express.js** - REST API server
- **CORS** - Cross-origin resource sharing

## 📊 Model Specifications

### Computer Vision CNN
- Input: 224×224×3 RGB images
- Architecture: 4 conv blocks (32→64→128→256 filters)
- Dropout: 0.5 after flatten, 0.3 after dense
- Output: 6 classes (softmax)
- Loss: Categorical crossentropy
- Optimizer: Adam

### Demand Forecasting LSTM
- Input: (30 days, 7 features)
- Architecture: 3 LSTM layers (128→64→32 units)
- Dropout: 0.2 after each LSTM
- Output: 7 days (sigmoid probabilities)
- Loss: Binary crossentropy
- Optimizer: Adam

## 🎓 Knowledge Base Categories

1. **Safety** (4 docs): Gas leak detection, cylinder storage, connection safety, fire safety
2. **Pricing** (2 docs): 6kg and 13kg cylinder prices by region
3. **Ordering** (2 docs): Order process, first-time orders
4. **Payment** (2 docs): M-Pesa guide, deposit refunds
5. **Carbon Credits** (2 docs): Earning ECO tokens, redeeming rewards
6. **Delivery** (2 docs): Tracking, delivery areas
7. **Referral Program** (2 docs): Ambassador program, referral codes
8. **Technology** (2 docs): Blockchain NFT, AI safety scanner
9. **Support** (2 docs): Contact channels, common issues
10. **Circular Economy** (1 doc): Cylinder return and reuse
11. **Demand Forecasting** (1 doc): Predictive reminders

Total: **25 documents** covering all EnergiChain features

## 📝 License

MIT
