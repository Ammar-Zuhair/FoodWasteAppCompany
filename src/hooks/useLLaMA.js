import { useState } from 'react';
import { llamaAPI, apiHelpers } from '../utils/api';

/**
 * Hook لاستخدام LLaMA
 */
export function useLLaMA() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await llamaAPI.getStatus();
      setStatus(response);
      return response;
    } catch (err) {
      console.error('Error checking LLaMA status:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generate = async (prompt, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await llamaAPI.generate(prompt, options);
      return apiHelpers.formatLLaMAResponse(response);
    } catch (err) {
      console.error('Error generating text with LLaMA:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const chat = async (messages) => {
    try {
      setLoading(true);
      setError(null);
      const response = await llamaAPI.chat(messages);
      return response;
    } catch (err) {
      console.error('Error chatting with LLaMA:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    error,
    checkStatus,
    generate,
    chat,
  };
}









