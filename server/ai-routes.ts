import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from './ai-service';

const router = Router();

// Middleware to check if AI service is configured
const checkAIConfig = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return res.status(503).json({
      error: 'AI service not configured',
      message: 'Please set OPENAI_API_KEY in your .env file'
    });
  }
  next();
};

// Generate AI completion
router.post('/api/ai/completion', checkAIConfig, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await aiService.generateCompletion(prompt);
    res.json({ completion });
  } catch (error) {
    console.error('AI completion error:', error);
    res.status(500).json({ error: 'Failed to generate completion' });
  }
});

// Generate embeddings
router.post('/api/ai/embeddings', checkAIConfig, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embeddings = await aiService.generateEmbeddings(text);
    res.json({ embeddings });
  } catch (error) {
    console.error('Embeddings error:', error);
    res.status(500).json({ error: 'Failed to generate embeddings' });
  }
});

// Analyze sentiment
router.post('/api/ai/sentiment', checkAIConfig, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const analysis = await aiService.analyzeSentiment(text);
    res.json(analysis);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Summarize text
router.post('/api/ai/summarize', checkAIConfig, async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const summary = await aiService.summarizeText(text, maxLength);
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

export default router;