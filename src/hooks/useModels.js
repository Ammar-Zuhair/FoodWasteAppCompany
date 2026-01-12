import { useState, useEffect } from 'react';
import { modelsAPI, apiHelpers } from '../utils/api';

/**
 * Hook لاستخدام نماذج AI
 */
export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await modelsAPI.list();
      setModels(response.models || {});
    } catch (err) {
      console.error('Error loading models:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predict = async (modelName, inputData) => {
    try {
      setError(null);
      const response = await modelsAPI.predict(modelName, inputData);
      return apiHelpers.formatFoodValuePrediction(response);
    } catch (err) {
      console.error(`Error predicting with ${modelName}:`, err);
      setError(err.message);
      throw err;
    }
  };

  return {
    models,
    loading,
    error,
    predict,
    reload: loadModels,
  };
}

/**
 * Hook لاستخدام نموذج محدد
 */
export function useModel(modelName) {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (modelName) {
      loadModelInfo();
    }
  }, [modelName]);

  const loadModelInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await modelsAPI.getInfo(modelName);
      setModelInfo(info);
    } catch (err) {
      console.error(`Error loading model info for ${modelName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predict = async (inputData) => {
    try {
      setError(null);
      const response = await modelsAPI.predict(modelName, inputData);
      return apiHelpers.formatFoodValuePrediction(response);
    } catch (err) {
      console.error(`Error predicting with ${modelName}:`, err);
      setError(err.message);
      throw err;
    }
  };

  return {
    modelInfo,
    loading,
    error,
    predict,
    reload: loadModelInfo,
  };
}









