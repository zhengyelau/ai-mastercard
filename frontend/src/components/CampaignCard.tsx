import { Lightbulb, CheckCircle2, Hash, Sparkles } from 'lucide-react';
import type { TrendTopic } from '../services/api';

interface CampaignCardProps {
  topic: TrendTopic;
  selected: boolean;
  onToggle: () => void;
}

export default function CampaignCard({ topic, selected, onToggle }: CampaignCardProps) {
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
            <Hash className="w-3 h-3" />
            {topic.trend}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
          {topic.trend}
        </h3>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-amber-900">Why It Matters</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {topic.why_it_matters}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-blue-900">Campaign Idea</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {topic.mastercard_campaign_idea}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Click to {selected ? 'deselect' : 'select'} for PDF report
      </div>
    </div>
  );
}
