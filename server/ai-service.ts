import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIServiceOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(options?: AIServiceOptions) {
    this.model = options?.model || process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = options?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '1000');
    this.temperature = options?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7');
  }

  /**
   * Generate a completion based on a prompt
   */
  async generateCompletion(prompt: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating completion:', error);
      throw new Error('Failed to generate AI completion');
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    try {
      const prompt = `Analyze the sentiment of the following text and respond with ONLY a JSON object in this format: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0}

Text: ${text}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        max_tokens: 50,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Summarize text
   */
  async summarizeText(text: string, maxLength: number = 100): Promise<string> {
    try {
      const prompt = `Summarize the following text in ${maxLength} words or less:

${text}`;

      return await this.generateCompletion(prompt);
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw new Error('Failed to summarize text');
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();