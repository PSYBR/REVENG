import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface AnalysisResult {
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
  structure: any;
  decompilation: string;
  recommendations: string[];
}

export interface ApiError {
  error: string;
  details?: string;
}

export const uploadFile = async (file: File): Promise<AnalysisResult> => {
  try {
    // First check if the server is available
    await axios.get(`${API_URL}/health`);

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<{ analysis: AnalysisResult }>(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.analysis;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.data) {
        throw new Error(
          axiosError.response.data.details || 
          axiosError.response.data.error || 
          'Error uploading file'
        );
      } else if (axiosError.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      }
    }
    throw new Error('An unexpected error occurred');
  }
}; 