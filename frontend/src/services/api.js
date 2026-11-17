import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const simulateCPU = async (payload) => {
  const response = await API.post('/cpu/simulate', payload);
  return response.data;
};

export const simulateMultiCore = async (payload) => {
  const response = await API.post('/cpu/multicore/simulate', payload);
  return response.data;
};

export const compareCPU = async (payload) => {
  const response = await API.post('/cpu/compare', payload);
  return response.data;
};

export const getMLMetrics = async (modelType = 'decision_tree') => {
  const response = await API.get(`/cpu/ml-metrics?model_type=${modelType}`);
  return response.data;
};

export const getMultiModelBenchmark = async () => {
  const response = await API.get('/cpu/models-benchmark');
  return response.data;
};

export const checkDeadlock = async (payload) => {
  const response = await API.post('/deadlock/check', payload);
  return response.data;
};

export const simulateDisk = async (payload) => {
  const response = await API.post('/disk/simulate', payload);
  return response.data;
};

export const compareDisk = async (payload) => {
  const response = await API.post('/disk/compare', payload);
  return response.data;
};


export const checkHealth = async () => {
  try {
    const response = await API.get('/health', { timeout: 2000 });
    return response.status === 200;
  } catch (e) {
    return false;
  }
};