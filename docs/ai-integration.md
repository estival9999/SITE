# AI Integration Guide

This guide explains how to set up and use the AI features in the application.

## Setup

### 1. Install Dependencies

The necessary dependencies have already been added to `package.json`:
- `openai` - Official OpenAI SDK
- `axios` - HTTP client for frontend API calls
- `dotenv` - Environment variable management

Run `npm install` to install all dependencies.

### 2. Configure Environment Variables

Add your OpenAI API key to the `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-actual-openai-api-key-here

# AI Service Configuration (optional)
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

## Available AI Services

### Server-Side Services (`/server/ai-service.ts`)

The AI service provides the following methods:

1. **generateCompletion(prompt)** - Generate text completions
2. **generateEmbeddings(text)** - Create text embeddings for semantic search
3. **analyzeSentiment(text)** - Analyze sentiment (positive/negative/neutral)
4. **summarizeText(text, maxLength)** - Create text summaries

### API Endpoints (`/server/ai-routes.ts`)

- `POST /api/ai/completion` - Generate AI completions
- `POST /api/ai/embeddings` - Generate text embeddings
- `POST /api/ai/sentiment` - Analyze text sentiment
- `POST /api/ai/summarize` - Summarize text

### Frontend Hook (`/client/src/hooks/use-ai.ts`)

The `useAI` hook provides easy access to AI features in React components:

```typescript
const { 
  loading, 
  generateCompletion, 
  analyzeSentiment, 
  summarizeText 
} = useAI();
```

## Usage Examples

### Backend Usage

```typescript
import { aiService } from './ai-service';

// Generate completion
const completion = await aiService.generateCompletion("Tell me about AI");

// Analyze sentiment
const sentiment = await aiService.analyzeSentiment("I love this product!");

// Summarize text
const summary = await aiService.summarizeText(longText, 100);
```

### Frontend Usage

```typescript
import { useAI } from '../hooks/use-ai';

function MyComponent() {
  const { generateCompletion, loading } = useAI();
  
  const handleClick = async () => {
    const result = await generateCompletion("What is machine learning?");
    console.log(result);
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      Generate AI Response
    </button>
  );
}
```

### AI Assistant Component

The `AIAssistant` component provides a complete UI for AI interactions:

```typescript
import { AIAssistant } from '../components/ai/AIAssistant';

function MyPage() {
  return <AIAssistant />;
}
```

## Security Considerations

1. **API Key Protection**: Never expose your OpenAI API key in client-side code
2. **Rate Limiting**: Consider implementing rate limiting for AI endpoints
3. **Input Validation**: Always validate and sanitize user inputs
4. **Cost Management**: Monitor API usage to control costs

## Error Handling

The AI service includes comprehensive error handling:
- API key validation
- Network error handling
- Rate limit handling
- Graceful fallbacks

## Testing

To test the AI integration:

1. Set up your OpenAI API key in `.env`
2. Start the development server: `npm run dev`
3. Navigate to the AI Assistant page (if added to routing)
4. Try different AI features

## Troubleshooting

Common issues and solutions:

1. **"AI service not configured" error**
   - Make sure `OPENAI_API_KEY` is set in `.env`
   - Restart the server after updating `.env`

2. **Rate limit errors**
   - OpenAI has rate limits on API usage
   - Implement caching or reduce request frequency

3. **Network errors**
   - Check internet connection
   - Verify OpenAI service status

## Future Enhancements

Consider adding:
- Response caching
- Streaming responses
- Custom fine-tuned models
- Integration with vector databases for RAG
- Multi-language support