/**
 * RAG (Retrieval-Augmented Generation) Engine for EnergiChain
 * Combines vector search with GPT-4 for accurate, knowledge-grounded responses
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class RAGEngine {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.knowledgeBase = [];
    this.embeddings = new Map();
    this.embeddingModel = 'text-embedding-3-small';
  }

  /**
   * Load knowledge base from JSON file
   */
  async loadKnowledgeBase(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    this.knowledgeBase = JSON.parse(data);
    console.log(`Loaded ${this.knowledgeBase.length} documents`);
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Index all documents (generate embeddings)
   */
  async indexDocuments() {
    console.log('Generating embeddings for knowledge base...');
    
    for (let i = 0; i < this.knowledgeBase.length; i++) {
      const doc = this.knowledgeBase[i];
      const text = `${doc.title}\n${doc.content}`;
      const embedding = await this.generateEmbedding(text);
      this.embeddings.set(doc.id, embedding);
      
      if ((i + 1) % 10 === 0) {
        console.log(`Indexed ${i + 1}/${this.knowledgeBase.length} documents`);
      }
    }
    
    console.log('Indexing complete!');
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Retrieve relevant documents for a query
   */
  async retrieveDocuments(query, topK = 3) {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate similarity with all documents
    const scores = [];
    for (const [docId, docEmbedding] of this.embeddings.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      scores.push({ docId, similarity });
    }
    
    // Sort by similarity and get top K
    scores.sort((a, b) => b.similarity - a.similarity);
    const topDocs = scores.slice(0, topK);
    
    // Return full documents
    return topDocs.map(({ docId, similarity }) => {
      const doc = this.knowledgeBase.find(d => d.id === docId);
      return { ...doc, similarity };
    });
  }

  /**
   * Generate answer using RAG (Retrieval + Generation)
   */
  async generateAnswer(question, language = 'en') {
    // Step 1: Retrieve relevant documents
    const relevantDocs = await this.retrieveDocuments(question, 3);
    
    if (relevantDocs.length === 0) {
      return {
        answer: language === 'en' 
          ? "I don't have enough information to answer that question. Please contact our support team."
          : "Sina taarifa za kutosha kujibu swali hilo. Tafadhali wasiliana na timu yetu ya msaada.",
        sources: [],
        confidence: 0
      };
    }
    
    // Step 2: Build context from retrieved documents
    const context = relevantDocs.map((doc, idx) => 
      `[Document ${idx + 1}]\nTitle: ${doc.title}\nContent: ${doc.content}`
    ).join('\n\n');
    
    // Step 3: Generate answer using GPT-4 with context
    const systemPrompt = language === 'en'
      ? `You are a helpful assistant for EnergiChain, an LPG delivery platform in Kenya.
Answer the user's question based ONLY on the provided context. If the context doesn't contain the answer, say you don't know.
Be concise, accurate, and cite the document numbers you reference.`
      : `Wewe ni msaidizi wa EnergiChain, jukwaa la utoaji wa LPG nchini Kenya.
Jibu swali la mtumiaji kulingana NA tu na muktadha uliotolewa. Kama muktadha hauna jibu, sema hujui.
Kuwa mfupi, sahihi, na taja nambari za hati unazorejelea.`;

    const userPrompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const answer = response.choices[0].message.content;
    
    // Calculate average similarity as confidence
    const avgSimilarity = relevantDocs.reduce((sum, doc) => sum + doc.similarity, 0) / relevantDocs.length;
    const confidence = Math.round(avgSimilarity * 100);

    return {
      answer,
      sources: relevantDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        similarity: doc.similarity
      })),
      confidence,
      usage: response.usage
    };
  }

  /**
   * Conversational RAG with history
   */
  async chat(question, conversationHistory = [], language = 'en') {
    // Retrieve relevant documents
    const relevantDocs = await this.retrieveDocuments(question, 3);
    
    // Build context
    const context = relevantDocs.map((doc, idx) => 
      `[Document ${idx + 1}]\n${doc.title}\n${doc.content}`
    ).join('\n\n');
    
    // Build messages with history
    const messages = [
      {
        role: 'system',
        content: `You are EnergiChain's AI assistant. Use the provided context to answer questions accurately.
        
Context:
${context}`
      },
      ...conversationHistory,
      { role: 'user', content: question }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 400,
      temperature: 0.5,
    });

    return {
      answer: response.choices[0].message.content,
      sources: relevantDocs.map(doc => ({
        title: doc.title,
        category: doc.category
      }))
    };
  }

  /**
   * Add new document to knowledge base (incremental indexing)
   */
  async addDocument(doc) {
    // Add to knowledge base
    this.knowledgeBase.push(doc);
    
    // Generate and store embedding
    const text = `${doc.title}\n${doc.content}`;
    const embedding = await this.generateEmbedding(text);
    this.embeddings.set(doc.id, embedding);
    
    console.log(`Added document: ${doc.title}`);
  }

  /**
   * Save embeddings to file (for faster loading)
   */
  async saveEmbeddings(filePath) {
    const data = {
      embeddings: Array.from(this.embeddings.entries()),
      model: this.embeddingModel,
      timestamp: new Date().toISOString()
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('Embeddings saved to:', filePath);
  }

  /**
   * Load pre-computed embeddings
   */
  async loadEmbeddings(filePath) {
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    this.embeddings = new Map(data.embeddings);
    console.log(`Loaded ${this.embeddings.size} embeddings`);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGEngine;
}

// Example usage:
/*
const RAGEngine = require('./rag-engine');

async function main() {
  const rag = new RAGEngine(process.env.OPENAI_API_KEY);
  
  // Load knowledge base
  await rag.loadKnowledgeBase('./knowledge-base.json');
  
  // Index documents (one-time operation)
  await rag.indexDocuments();
  
  // Save embeddings for faster loading next time
  await rag.saveEmbeddings('./embeddings.json');
  
  // Ask a question
  const result = await rag.generateAnswer('How do I detect a gas leak?');
  console.log('Answer:', result.answer);
  console.log('Confidence:', result.confidence + '%');
  console.log('Sources:', result.sources);
}

main();
*/
