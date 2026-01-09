import axios, { AxiosError } from 'axios';

export interface TrendTopic {
  title: string;
  description: string;
  publishedAt: string;
  trend: string;
  url: string;
}

export interface TrendingTopicsResponse {
  keyword: string;
  brand_keywords: string[];
  top_trends: TrendTopic[];
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const getTrendingTopics = async (keyword: string): Promise<TrendingTopicsResponse> => {
  if (!keyword || keyword.trim().length === 0) {
    throw new Error('Keyword is required');
  }

  try {
    const response = await axios.get<TrendingTopicsResponse>(
      `${API_BASE_URL}/trending-topics`,
      {
        params: { keyword: keyword.trim() }, // send keyword as query param
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json', // optional for GET
        },
      }
    )

    if (!response.data || !response.data.top_trends || !Array.isArray(response.data.top_trends)) {
      throw new Error('Invalid response format from server');
    }

    if (!response.data.brand_keywords || !Array.isArray(response.data.brand_keywords)) {
      throw new Error('Invalid response format from server');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || axiosError.message;

        if (status === 400) {
          throw new Error(`Invalid request: ${message}`);
        } else if (status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        } else if (status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Error ${status}: ${message}`);
        }
      } else if (axiosError.request) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
};
