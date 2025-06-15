import { AIAssistant } from '../components/ai/AIAssistant';

export function AIAssistantPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Experiment with AI capabilities including text completion, sentiment analysis, and summarization.
        </p>
      </div>
      
      <AIAssistant />
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> To use the AI features, make sure to set your OpenAI API key in the .env file.
        </p>
      </div>
    </div>
  );
}