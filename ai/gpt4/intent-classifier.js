/**
 * Intent Classifier for EnergiChain Chatbot
 * Uses GPT-4 for zero-shot intent classification
 */

const OpenAI = require('openai');

class IntentClassifier {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    
    // Define intent schemas
    this.intents = {
      order_cylinder: {
        description: 'User wants to place an order for LPG cylinder',
        examples: [
          'I want to order gas',
          'Can I buy a 13kg cylinder?',
          'Place an order',
          'Nataka kuagiza gesi'
        ],
        entities: ['cylinder_size', 'delivery_address', 'delivery_time']
      },
      track_delivery: {
        description: 'User wants to track their delivery',
        examples: [
          'Where is my order?',
          'Track delivery',
          'When will my gas arrive?',
          'Agizo langu liko wapi?'
        ],
        entities: ['order_id']
      },
      pricing: {
        description: 'User asking about prices',
        examples: [
          'How much is 6kg?',
          'What are your prices?',
          'Cost of cylinder',
          'Bei ni ngapi?'
        ],
        entities: ['cylinder_size']
      },
      payment_help: {
        description: 'User needs help with payment',
        examples: [
          'Payment failed',
          'How to pay with M-Pesa?',
          'My card was declined',
          'Malipo yameshindwa'
        ],
        entities: ['payment_method', 'error_type']
      },
      safety_question: {
        description: 'User asking about LPG safety',
        examples: [
          'How to detect gas leak?',
          'Is LPG safe?',
          'What to do in emergency?',
          'Jinsi ya kugundua uvujaji?'
        ],
        entities: ['safety_topic']
      },
      carbon_credits: {
        description: 'User asking about ECO tokens/carbon credits',
        examples: [
          'How do I earn tokens?',
          'What are ECO tokens?',
          'Check my carbon credits',
          'Tokeni za ECO ni nini?'
        ],
        entities: []
      },
      refund_deposit: {
        description: 'User wants to return cylinder and get deposit back',
        examples: [
          'Return cylinder',
          'Get my deposit back',
          'Refund process',
          'Rejesha silinda'
        ],
        entities: ['cylinder_id']
      },
      complaint: {
        description: 'User has a complaint or issue',
        examples: [
          'Cylinder is damaged',
          'Driver was rude',
          'Gas is leaking',
          'Silinda ina tatizo'
        ],
        entities: ['complaint_type']
      },
      referral_program: {
        description: 'User asking about ambassador program',
        examples: [
          'How to become ambassador?',
          'Referral code',
          'Earn commission',
          'Programu ya ushauri'
        ],
        entities: []
      },
      general_inquiry: {
        description: 'General question or greeting',
        examples: [
          'Hello',
          'What is EnergiChain?',
          'Business hours',
          'Habari'
        ],
        entities: []
      }
    };
  }

  /**
   * Classify intent using GPT-4
   */
  async classifyIntent(message) {
    const intentList = Object.keys(this.intents).map(key => {
      return `${key}: ${this.intents[key].description}`;
    }).join('\n');

    const prompt = `Classify the user's intent from this message: "${message}"

Available intents:
${intentList}

Respond with ONLY the intent name (e.g., "order_cylinder").`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0.1,
    });

    const intent = response.choices[0].message.content.trim().toLowerCase();
    return intent;
  }

  /**
   * Extract entities from message based on intent
   */
  async extractEntities(message, intent) {
    const intentSchema = this.intents[intent];
    if (!intentSchema || intentSchema.entities.length === 0) {
      return {};
    }

    const prompt = `Extract the following entities from this message: "${message}"

Entities to extract: ${intentSchema.entities.join(', ')}

Respond in JSON format. Example: {"cylinder_size": "13kg", "delivery_time": "tomorrow"}
If an entity is not found, omit it from the response.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return {};
    }
  }

  /**
   * Classify with confidence score
   */
  async classifyWithConfidence(message) {
    const intentList = Object.entries(this.intents).map(([key, value]) => {
      return `${key}: ${value.description}`;
    }).join('\n');

    const prompt = `Classify the user's intent and provide confidence score (0-100).

Message: "${message}"

Available intents:
${intentList}

Respond in JSON format:
{
  "intent": "intent_name",
  "confidence": 95,
  "reasoning": "brief explanation"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return {
        intent: 'general_inquiry',
        confidence: 50,
        reasoning: 'Failed to parse classification'
      };
    }
  }

  /**
   * Get suggested actions based on intent
   */
  getSuggestedActions(intent) {
    const actions = {
      order_cylinder: [
        { action: 'show_product_catalog', label: 'View Products' },
        { action: 'start_order_flow', label: 'Place Order' },
        { action: 'show_pricing', label: 'See Prices' }
      ],
      track_delivery: [
        { action: 'show_tracking_page', label: 'Track Order' },
        { action: 'show_recent_orders', label: 'My Orders' },
        { action: 'contact_driver', label: 'Call Driver' }
      ],
      pricing: [
        { action: 'show_pricing_oracle', label: 'View Prices' },
        { action: 'compare_fuels', label: 'Compare with Charcoal' },
        { action: 'calculate_savings', label: 'Calculate Savings' }
      ],
      payment_help: [
        { action: 'show_payment_methods', label: 'Payment Options' },
        { action: 'retry_payment', label: 'Retry Payment' },
        { action: 'contact_support', label: 'Contact Support' }
      ],
      safety_question: [
        { action: 'show_safety_guide', label: 'Safety Guide' },
        { action: 'start_cv_scanner', label: 'Scan Cylinder' },
        { action: 'emergency_contacts', label: 'Emergency Contacts' }
      ],
      carbon_credits: [
        { action: 'show_carbon_dashboard', label: 'View Dashboard' },
        { action: 'show_token_balance', label: 'My Tokens' },
        { action: 'redeem_tokens', label: 'Redeem Tokens' }
      ],
      refund_deposit: [
        { action: 'start_return_flow', label: 'Return Cylinder' },
        { action: 'scan_qr_code', label: 'Scan QR' },
        { action: 'show_active_deposits', label: 'My Deposits' }
      ],
      complaint: [
        { action: 'file_complaint', label: 'File Complaint' },
        { action: 'contact_support', label: 'Contact Support' },
        { action: 'request_callback', label: 'Request Callback' }
      ],
      referral_program: [
        { action: 'show_referral_dashboard', label: 'Ambassador Dashboard' },
        { action: 'generate_referral_code', label: 'Get Referral Code' },
        { action: 'view_earnings', label: 'View Earnings' }
      ],
      general_inquiry: [
        { action: 'show_faq', label: 'FAQ' },
        { action: 'show_features', label: 'Features' },
        { action: 'contact_support', label: 'Contact Support' }
      ]
    };

    return actions[intent] || actions.general_inquiry;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntentClassifier;
}

// Example usage:
/*
const classifier = new IntentClassifier(process.env.OPENAI_API_KEY);

// Basic classification
const intent = await classifier.classifyIntent('I want to buy a 13kg cylinder');
console.log('Intent:', intent);

// With confidence
const result = await classifier.classifyWithConfidence('Nataka kuagiza gesi');
console.log(result);
// Output: { intent: 'order_cylinder', confidence: 95, reasoning: '...' }

// Extract entities
const entities = await classifier.extractEntities(
  'I want a 13kg cylinder delivered tomorrow at 3pm',
  'order_cylinder'
);
console.log(entities);
// Output: { cylinder_size: '13kg', delivery_time: 'tomorrow at 3pm' }
*/
