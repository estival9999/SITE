# Chat API Documentation

## Overview
The chat API provides an AI-powered conversational interface for users to interact with the announcement system.

## Endpoints

### POST /api/chat
Send a message to the AI assistant and receive a response.

#### Request
```json
{
  "message": "string (required) - The user's message",
  "context": "string (optional) - Additional context for the conversation"
}
```

#### Response (Standard)
```json
{
  "message": {
    "role": "assistant",
    "content": "The AI's response"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

#### Response (Streaming)
To enable streaming responses, set the `Accept` header to `text/event-stream`:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Hello, how can you help me?"}'
```

Streaming response format:
```
data: {"content": "Hello"}
data: {"content": "! I"}
data: {"content": " can"}
data: {"content": " help"}
data: [DONE]
```

### GET /api/chat/history
Retrieve chat history for the authenticated user.

#### Response
```json
{
  "messages": [],
  "message": "Chat history not implemented yet"
}
```

## Configuration

### Environment Variables
Add the following to your `.env` file:

```env
# Required for AI functionality
OPENAI_API_KEY=your-openai-api-key-here

# Optional - defaults to gpt-3.5-turbo
OPENAI_MODEL=gpt-4
```

### Development Mode
If `OPENAI_API_KEY` is not configured, the endpoint will return mock responses for testing purposes.

## Error Handling

The API handles various error scenarios:

- **401 Unauthorized**: User is not authenticated
- **400 Bad Request**: Missing or invalid message
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: OpenAI quota exceeded
- **500 Internal Server Error**: General server error

## Usage Examples

### JavaScript (Fetch API)
```javascript
// Standard request
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What announcements were posted today?',
    context: 'User is looking for recent company updates'
  }),
  credentials: 'include'
});

const data = await response.json();
console.log(data.message.content);
```

### JavaScript (Server-Sent Events for Streaming)
```javascript
const eventSource = new EventSource('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    message: 'Explain the latest HR policy'
  })
});

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  
  const chunk = JSON.parse(event.data);
  console.log(chunk.content);
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

### React Hook Example
```typescript
import { useState } from 'react';

function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string, context?: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
        credentials: 'include'
      });

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        data.message
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
```

## Security Considerations

1. **Authentication Required**: All chat endpoints require user authentication
2. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
3. **Input Validation**: Messages are validated and sanitized
4. **API Key Security**: Never expose the OpenAI API key to the client
5. **Context Injection**: Be careful with context to avoid prompt injection attacks

## Future Enhancements

- Implement persistent chat history storage
- Add conversation threading
- Support for multiple AI models
- File attachment support for context
- Integration with announcement data for contextual responses