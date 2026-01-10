import { Lightbulb, CheckCircle2, TrendingUp, Sparkles, ExternalLink, Calendar, AlertCircle, BarChart3 } from 'lucide-react';
import type { TrendTopic } from '../services/api';

interface CampaignCardProps {
  topic: TrendTopic;
  selected: boolean;
  onToggle: () => void;
}

export default function CampaignCard({ topic, selected, onToggle }: CampaignCardProps) {
  const topArticle = topic.recent_coverage[0];

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-2 cursor-pointer ${
        selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      {selected && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Trending
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
            {topic.trending_score.toFixed(1)}% score
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          {topic.topic_name}
        </h3>
        <p className="text-xs text-gray-600">
          Engagement: <span className="font-semibold">{topic.engagement_score}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-blue-900">Why It's Trending</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {topic.analysis.trend_analysis.why_trending}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-green-900">Campaign Opportunity</h4>
          </div>
          <p className="text-xs font-semibold text-green-800 mb-2">
            {topic.analysis.campaign_opportunities[0]?.campaign_name}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {topic.analysis.campaign_opportunities[0]?.campaign_concept}
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-amber-900">Risk Assessment</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
            {topic.analysis.risk_assessment.potential_risks}
          </p>
        </div>

        {topArticle && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Featured Article</h4>
            </div>
            <p className="text-xs font-semibold text-gray-800 mb-2 line-clamp-2">
              {topArticle.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <Calendar className="w-3 h-3" />
              <span>{new Date(topArticle.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
              <span className="text-gray-400">•</span>
              <BarChart3 className="w-3 h-3" />
              <span>{topArticle.engagement} engagement</span>
            </div>
            <a
              href={topArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Read full article
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Click to {selected ? 'deselect' : 'select'} for PDF report
      </div>
    </div>
  );
}
