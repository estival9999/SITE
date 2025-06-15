import { useState } from 'react';
import axios from 'axios';

interface UseAIOptions {
  onError?: (error: string) => void;
}

export function useAI(options?: UseAIOptions) {
  const [loading, setLoading] = useState(false);

  const generateCompletion = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/completion', { prompt });
      return response.data.completion;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate completion';
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbeddings = async (text: string): Promise<number[]> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/embeddings', { text });
      return response.data.embeddings;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate embeddings';
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async (text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/sentiment', { text });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to analyze sentiment';
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const summarizeText = async (text: string, maxLength?: number): Promise<string> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/summarize', { text, maxLength });
      return response.data.summary;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to summarize text';
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateCompletion,
    generateEmbeddings,
    analyzeSentiment,
    summarizeText,
  };
}