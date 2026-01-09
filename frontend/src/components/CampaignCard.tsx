import { TrendingUp, Calendar, ExternalLink, CheckCircle2, Hash } from 'lucide-react';
import type { TrendTopic } from '../services/api';

interface CampaignCardProps {
  topic: TrendTopic;
  selected: boolean;
  onToggle: () => void;
}

export default function CampaignCard({ topic, selected, onToggle }: CampaignCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-2 ${
        selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-200'
      }`}
    >
      <div
        onClick={onToggle}
        className="cursor-pointer"
      >
        {selected && (
          <div className="absolute top-4 right-4">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {topic.trend}
            </span>
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">{formatDate(topic.publishedAt)}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
            {topic.title}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {topic.description}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Read Full Article</span>
            </a>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Click to {selected ? 'deselect' : 'select'} for PDF report
        </div>
      </div>
    </div>
  );
}
