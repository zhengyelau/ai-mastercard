import axios, { AxiosError } from 'axios';

export interface Article {
  title: string;
  source: string;
  publishedAt: string;
}

export interface TrendingMetrics {
  frequency: number;
  recent_count: number;
  velocity: string;
  source_quality: string;
}

export interface CampaignOpportunity {
  campaign_name: string;
  campaign_concept: string;
  execution_plan: string;
  mastercard_role: string;
  expected_impact: string;
}

export interface RiskAssessment {
  potential_risks: string;
  recommended_approach: string;
}

export interface TrendAnalysis {
  why_trending: string;
  relevance_to_mastercard: string;
  target_audience: string;
}

export interface Analysis {
  trend_analysis: TrendAnalysis;
  campaign_opportunities: CampaignOpportunity[];
  risk_assessment: RiskAssessment;
}

export interface TrendTopic {
  rank: number;
  topic_name: string;
  source: string;
  category: string;
  trending_score: number;
  trending_metrics: TrendingMetrics;
  recent_coverage: Article[];
  analysis: Analysis;
}

export interface TrendingTopicsResponse {
  keyword: string;
  trending_topics: TrendTopic[];
  total_topics: number;
  detection_method: string;
  analysis_criteria: string;
  timestamp: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getTrendingTopics = async (keyword: string): Promise<TrendingTopicsResponse> => {
  if (!keyword || keyword.trim().length === 0) {
    throw new Error('Keyword is required');
  }

  try {
    const response = await axios.get<TrendingTopicsResponse>(
      `${API_BASE_URL}/trending-topics`,
      {
        params: { keyword: keyword.trim() },
        //timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.data || !response.data.trending_topics || !Array.isArray(response.data.trending_topics)) {
      throw new Error('Invalid response format from server');
    }

    if (typeof response.data.total_topics !== 'number') {
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
