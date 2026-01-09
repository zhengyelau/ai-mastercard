import axios, { AxiosError } from 'axios';

export interface CampaignTopic {
  id: string;
  topic: string;
  trendScore: number;
  category: string;
  campaignIdea: {
    title: string;
    description: string;
    targetAudience: string;
    keyMessage: string;
    tactics: string[];
    expectedOutcome: string;
  };
}

export interface TrendingTopicsResponse {
  keyword: string;
  topics: CampaignTopic[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getTrendingTopics = async (keyword: string): Promise<TrendingTopicsResponse> => {
  if (!keyword || keyword.trim().length === 0) {
    throw new Error('Keyword is required');
  }

  try {
    const response = await axios.post<TrendingTopicsResponse>(
      `${API_BASE_URL}/trending-topics`,
      { keyword: keyword.trim() },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.topics || !Array.isArray(response.data.topics)) {
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
