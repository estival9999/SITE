import React, { useState } from 'react';
import { useAI } from '../../hooks/use-ai';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Brain, MessageSquare, FileText, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function AIAssistant() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string>('');
  const [sentiment, setSentiment] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const { loading, generateCompletion, analyzeSentiment, summarizeText } = useAI({
    onError: setError,
  });

  const handleGenerateCompletion = async () => {
    setError('');
    setResult('');
    try {
      const completion = await generateCompletion(input);
      setResult(completion);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleAnalyzeSentiment = async () => {
    setError('');
    setSentiment(null);
    try {
      const analysis = await analyzeSentiment(input);
      setSentiment(analysis);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleSummarize = async () => {
    setError('');
    setResult('');
    try {
      const summary = await summarizeText(input, 100);
      setResult(summary);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Use AI to generate completions, analyze sentiment, or summarize text
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="completion" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="completion" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Completion
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            <Textarea
              placeholder="Enter your text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full"
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="completion" className="space-y-4">
              <Button 
                onClick={handleGenerateCompletion} 
                disabled={loading || !input.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Completion'
                )}
              </Button>
              
              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{result}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-4">
              <Button 
                onClick={handleAnalyzeSentiment} 
                disabled={loading || !input.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Sentiment'
                )}
              </Button>
              
              {sentiment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Sentiment:</strong>{' '}
                        <span className={`capitalize font-medium ${
                          sentiment.sentiment === 'positive' ? 'text-green-600' :
                          sentiment.sentiment === 'negative' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {sentiment.sentiment}
                        </span>
                      </p>
                      <p>
                        <strong>Confidence:</strong>{' '}
                        {(sentiment.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Button 
                onClick={handleSummarize} 
                disabled={loading || !input.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  'Summarize Text'
                )}
              </Button>
              
              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{result}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}