import { useMemo } from 'react';

export const useApiBase = () => {
  return useMemo(() => {
    const envBase = import.meta.env.VITE_API_URL;
    return envBase ? envBase.replace(/\/$/, '') : 'http://localhost:8000/api/v1';
  }, []);
};
