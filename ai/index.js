/**
 * Main entry point for EnergiChain AI Services
 * Provides REST API for chatbot, RAG, and predictions
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const EnergiChainChatbot = require('./gpt4/chatbot');
const IntentClassifier = require('./gpt4/intent-classifier');
const RAGEngine = require('./rag/rag-engine');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI services
let chatbot, intentClassifier, ragEngine;

async function initializeServices() {
  console.log('Initializing AI services...');
  
  chatbot = new EnergiChainChatbot(process.env.OPENAI_API_KEY);
  intentClassifier = new IntentClassifier(process.env.OPENAI_API_KEY);
  
  // Initialize RAG
  ragEngine = new RAGEngine(process.env.OPENAI_API_KEY);
  await ragEngine.loadKnowledgeBase('./rag/knowledge-base.json');
  
  // Try to load cached embeddings
  try {
    await ragEngine.loadEmbeddings('./rag/embeddings.json');
    console.log('Loaded cached embeddings');
  } catch (error) {
    console.log('Generating embeddings for first time...');
    await ragEngine.indexDocuments();
    await ragEngine.saveEmbeddings('./rag/embeddings.json');
  }
  
  console.log('AI services ready!');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, language = 'en' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    
    const response = await chatbot.generateResponse(userId, message, language);
    const quickReplies = chatbot.getQuickReplies(response.intent, language);
    
    res.json({
      response: response.response,
      intent: response.intent,
      quickReplies,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat service error' });
  }
});

// Intent classification endpoint
app.post('/api/intent', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    const result = await intentClassifier.classifyWithConfidence(message);
    res.json(result);
    
  } catch (error) {
    console.error('Intent classification error:', error);
    res.status(500).json({ error: 'Intent classification error' });
  }
});

// RAG question-answering endpoint
app.post('/api/rag/answer', async (req, res) => {
  try {
    const { question, language = 'en' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    
    const result = await ragEngine.generateAnswer(question, language);
    res.json(result);
    
  } catch (error) {
    console.error('RAG error:', error);
    res.status(500).json({ error: 'RAG service error' });
  }
});

// Search knowledge base
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    
    const results = await ragEngine.retrieveDocuments(query, topK);
    res.json({ results });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search error' });
  }
});

// Clear chat history
app.delete('/api/chat/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    chatbot.clearHistory(userId);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ EnergiChain AI Services running on http://localhost:${PORT}`);
    console.log(`📚 RAG knowledge base loaded`);
    console.log(`🤖 GPT-4 chatbot ready`);
    console.log(`🎯 Intent classifier ready`);
  });
}).catch(error => {
  console.error('Failed to initialize services:', error);
  process.exit(1);
});
