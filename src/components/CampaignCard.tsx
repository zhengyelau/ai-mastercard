import { TrendingUp, Target, Users, Lightbulb, CheckCircle2 } from 'lucide-react';
import type { CampaignTopic } from '../services/api';

interface CampaignCardProps {
  topic: CampaignTopic;
  selected: boolean;
  onToggle: () => void;
}

export default function CampaignCard({ topic, selected, onToggle }: CampaignCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`relative bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
        selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-200'
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
              {topic.category}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">{topic.trendScore}/100</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.topic}</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 mb-1">{topic.campaignIdea.title}</h4>
              <p className="text-sm text-gray-700">{topic.campaignIdea.description}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-start gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-gray-900 text-sm mb-1">Target Audience</h5>
              <p className="text-sm text-gray-600">{topic.campaignIdea.targetAudience}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-gray-900 text-sm mb-1">Key Message</h5>
              <p className="text-sm text-gray-600 italic">"{topic.campaignIdea.keyMessage}"</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="font-semibold text-gray-900 text-sm mb-2">Campaign Tactics</h5>
          <ul className="space-y-1">
            {topic.campaignIdea.tactics.slice(0, 3).map((tactic, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{tactic}</span>
              </li>
            ))}
            {topic.campaignIdea.tactics.length > 3 && (
              <li className="text-xs text-blue-600 font-medium">
                +{topic.campaignIdea.tactics.length - 3} more tactics
              </li>
            )}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h5 className="font-semibold text-green-900 text-sm mb-1">Expected Outcome</h5>
          <p className="text-xs text-green-700">{topic.campaignIdea.expectedOutcome}</p>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Click to {selected ? 'deselect' : 'select'} for PDF report
      </div>
    </div>
  );
}
