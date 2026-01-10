import { useState } from 'react';
import { Search, Download, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import CampaignCard from './components/CampaignCard';
import { getTrendingTopics } from './services/api';
import { generateCampaignPDF } from './utils/pdfGenerator';
import type { TrendTopic } from './services/api';

function App() {
  const [keyword, setKeyword] = useState('');
  const [topics, setTopics] = useState<TrendTopic[]>([]);
  const [articleCount, setArticleCount] = useState<number>(0);
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      setError('Please enter a keyword');
      return;
    }

    setLoading(true);
    setError(null);
    setTopics([]);
    setArticleCount(0);
    setSelectedTopics(new Set());

    try {
      const response = await getTrendingTopics(keyword);
      setTopics(response.trending_topics);
      setArticleCount(response.total_topics);
      setSelectedTopics(new Set(response.trending_topics.map((_, index) => index)));
    } catch (err) {
      setError('Failed to fetch trending topics. Please try again.');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopicSelection = (topicIndex: number) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicIndex)) {
        newSet.delete(topicIndex);
      } else {
        newSet.add(topicIndex);
      }
      return newSet;
    });
  };

  const handleDownloadPDF = () => {
    const selectedTopicsList = topics.filter((_, index) => selectedTopics.has(index));

    if (selectedTopicsList.length === 0) {
      setError('Please select at least one topic to download');
      return;
    }

    generateCampaignPDF(selectedTopicsList, articleCount, keyword);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Mastercard Campaign AI
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover trending topics and generate innovative marketing campaigns powered by AI
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter a keyword (e.g., food, music, travel, fashion...)"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Analyzing trending topics for "{keyword}"...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Top Trending Topics for "{keyword}"
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTopics.size} of {topics.length} topics selected
                </p>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={selectedTopics.size === 0}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                Download PDF Report
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {topics.map((topic, index) => (
                <CampaignCard
                  key={index}
                  topic={topic}
                  selected={selectedTopics.has(index)}
                  onToggle={() => toggleTopicSelection(index)}
                />
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Click on cards to select/deselect topics for your PDF report
              </p>
            </div>
          </>
        )}

        {!loading && topics.length === 0 && keyword && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try searching with a different keyword</p>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Mastercard Campaign AI Assistant • Powered by Advanced Analytics</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
