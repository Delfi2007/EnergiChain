/**
 * GPT-4 Chatbot Service for EnergiChain
 * Handles multilingual customer support with intent detection
 */

const OpenAI = require('openai');

class EnergiChainChatbot {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.conversationHistory = new Map();
  }

  /**
   * System prompt for the chatbot
   */
  getSystemPrompt(language = 'en') {
    const prompts = {
      en: `You are an AI assistant for EnergiChain, a blockchain-powered LPG delivery platform in Kenya.

Your role:
- Help customers order LPG cylinders (6kg or 13kg)
- Track delivery status
- Provide pricing information
- Answer safety questions about LPG usage
- Explain carbon credit rewards (ECO tokens)
- Assist with M-Pesa payments

Key information:
- 6kg cylinder: KES 2,000 (gas) + KES 500 (deposit)
- 13kg cylinder: KES 2,800 (gas) + KES 500 (deposit)
- Free delivery in Nairobi within 2 hours
- Earn ECO tokens for every refill (1 token = 1kg CO2 saved)
- 24/7 support available

Be friendly, concise, and helpful. If you don't know something, suggest contacting support at +254 700 123 456.`,

      sw: `Wewe ni msaidizi wa AI wa EnergiChain, jukwaa la utoaji wa gesi ya LPG linalotumia blockchain nchini Kenya.

Jukumu lako:
- Kusaidia wateja kuagiza silinda za LPG (6kg au 13kg)
- Kufuatilia hali ya utoaji
- Kutoa taarifa za bei
- Kujibu maswali ya usalama kuhusu matumizi ya LPG
- Kueleza tuzo za carbon credit (tokeni za ECO)
- Kusaidia na malipo ya M-Pesa

Taarifa muhimu:
- Silinda ya 6kg: KES 2,000 (gesi) + KES 500 (amana)
- Silinda ya 13kg: KES 2,800 (gesi) + KES 500 (amana)
- Utoaji wa bure Nairobi ndani ya masaa 2
- Pata tokeni za ECO kwa kila kujaza (1 token = 1kg CO2 iliyookolewa)
- Msaada wa masaa 24/7 unapatikana

Kuwa rafiki, fupi, na msaidizi. Ikiwa hujui kitu, pendekeza kuwasiliana na msaada kwa +254 700 123 456.`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Detect user intent from message
   */
  async detectIntent(message) {
    const intentPrompt = `Classify the user's intent from this message: "${message}"

Possible intents:
- order_cylinder: User wants to order LPG
- track_delivery: User wants to check delivery status
- pricing: User asking about prices
- payment_help: User needs help with payment
- safety_question: User asking about LPG safety
- carbon_credits: User asking about ECO tokens
- complaint: User has a complaint
- general_inquiry: General question

Respond with ONLY the intent name.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: intentPrompt }],
      max_tokens: 20,
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim().toLowerCase();
  }

  /**
   * Generate response using GPT-4
   */
  async generateResponse(userId, message, language = 'en') {
    // Get or create conversation history
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    const history = this.conversationHistory.get(userId);

    // Detect intent first
    const intent = await this.detectIntent(message);

    // Build messages array
    const messages = [
      { role: 'system', content: this.getSystemPrompt(language) },
      ...history,
      { role: 'user', content: message }
    ];

    // Call GPT-4
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const assistantMessage = response.choices[0].message.content;

    // Update conversation history (keep last 10 messages)
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: assistantMessage });
    if (history.length > 20) {
      history.splice(0, 2); // Remove oldest exchange
    }

    return {
      response: assistantMessage,
      intent,
      usage: response.usage,
    };
  }

  /**
   * Get suggested quick replies based on intent
   */
  getQuickReplies(intent, language = 'en') {
    const replies = {
      en: {
        order_cylinder: ['Order 6kg', 'Order 13kg', 'Check prices', 'Delivery time'],
        track_delivery: ['Track my order', 'Delivery ETA', 'Contact driver'],
        pricing: ['6kg price', '13kg price', 'Deposit info', 'Payment methods'],
        payment_help: ['M-Pesa steps', 'Card payment', 'Failed payment'],
        safety_question: ['How to detect leak', 'Storage tips', 'Emergency help'],
        carbon_credits: ['How to earn ECO', 'Check my tokens', 'Redeem tokens'],
        default: ['Place order', 'Track delivery', 'Pricing', 'Help']
      },
      sw: {
        order_cylinder: ['Agiza 6kg', 'Agiza 13kg', 'Angalia bei', 'Muda wa utoaji'],
        track_delivery: ['Fuatilia agizo', 'ETA ya utoaji', 'Wasiliana na dereva'],
        pricing: ['Bei ya 6kg', 'Bei ya 13kg', 'Taarifa za amana', 'Njia za malipo'],
        payment_help: ['Hatua za M-Pesa', 'Malipo ya kadi', 'Malipo yameshindwa'],
        safety_question: ['Jinsi ya kugundua uvujaji', 'Vidokezo vya uhifadhi', 'Msaada wa dharura'],
        carbon_credits: ['Jinsi ya kupata ECO', 'Angalia tokeni zangu', 'Komboa tokeni'],
        default: ['Weka agizo', 'Fuatilia utoaji', 'Bei', 'Msaada']
      }
    };

    return replies[language][intent] || replies[language].default;
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  /**
   * Stream response (for real-time chat)
   */
  async *streamResponse(userId, message, language = 'en') {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    const history = this.conversationHistory.get(userId);

    const messages = [
      { role: 'system', content: this.getSystemPrompt(language) },
      ...history,
      { role: 'user', content: message }
    ];

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 300,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      yield content;
    }

    // Update history after streaming
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: fullResponse });
    if (history.length > 20) {
      history.splice(0, 2);
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnergiChainChatbot;
}

// Example usage:
/*
const chatbot = new EnergiChainChatbot(process.env.OPENAI_API_KEY);

// Basic response
const result = await chatbot.generateResponse(
  'user123', 
  'How much does a 13kg cylinder cost?',
  'en'
);
console.log(result.response);
console.log('Intent:', result.intent);

// Streaming response
for await (const chunk of chatbot.streamResponse('user123', 'I want to order LPG', 'en')) {
  process.stdout.write(chunk);
}
*/
