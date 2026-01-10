import os
import json
import re
import requests
import feedparser
from urllib.parse import quote_plus
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from datetime import datetime, timedelta
import time

# --------------------------
# CONFIG
# --------------------------
NEWS_API_KEY = '7ba4e28621ff4d1f8740421b5004fea0'
OPENAI_API_KEY = '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' 
PAGE_SIZE = 30
MAX_TRENDING_TOPICS = 15

# --------------------------
# FLASK APP
# --------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

client = OpenAI(api_key=OPENAI_API_KEY)

# Cache for trending topics
trending_cache = {
    "data": None,
    "timestamp": None,
    "ttl": 900
}

# --------------------------
# TRENDING DETECTION FUNCTIONS
# --------------------------
def get_articles_for_keyword(keyword, hours=24, older=False):
    """
    Get articles about keyword from multiple sources with time filtering
    """
    all_articles = []
    
    # 1. NewsAPI - Most relevant source
    try:
        url = "https://newsapi.org/v2/everything"
        
        # Calculate date range
        to_date = datetime.utcnow()
        from_date = to_date - timedelta(hours=hours)
        
        params = {
            "q": keyword,
            "language": "en",
            "pageSize": 30,
            "sortBy": "relevancy",
            "from": from_date.strftime("%Y-%m-%dT%H:%M:%S"),
            "to": to_date.strftime("%Y-%m-%dT%H:%M:%S"),
            "apiKey": NEWS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            for article in data.get("articles", []):
                if article.get("title") and article["title"] != "[Removed]":
                    article_data = {
                        "title": article["title"],
                        "description": article.get("description", ""),
                        "content": article.get("content", ""),
                        "url": article["url"],
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "publishedAt": article.get("publishedAt", ""),
                        "source_importance": get_source_importance(article.get("source", {}).get("name", "")),
                        "is_recent": not older
                    }
                    all_articles.append(article_data)
            print(f"  NewsAPI: Found {len(data.get('articles', []))} articles")
    except Exception as e:
        print(f"  NewsAPI error: {e}")
    
    # 2. Google News RSS
    try:
        search_query = quote_plus(keyword)
        feed_url = f"https://news.google.com/rss/search?q={search_query}&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries[:20]:
            article_data = {
                "title": entry.title,
                "description": entry.get("summary", ""),
                "content": entry.get("content", ""),
                "url": entry.link,
                "source": entry.get("source", {}).get("name", "Google News"),
                "publishedAt": entry.get("published", datetime.utcnow().isoformat()),
                "source_importance": 2,
                "is_recent": not older
            }
            all_articles.append(article_data)
        print(f"  Google News: Found {len(feed.entries[:20])} articles")
    except Exception as e:
        print(f"  Google News error: {e}")
    
    # 3. Reddit - For social engagement metrics
    try:
        subreddits = ["news", "worldnews", "technology", "business", "finance"]
        for subreddit in subreddits:
            search_url = f"https://www.reddit.com/r/{subreddit}/search.json?q={keyword}&restrict_sr=on&sort=relevance&limit=10"
            headers = {"User-Agent": "TrendAnalyzer/1.0"}
            response = requests.get(search_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                for post in data.get("data", {}).get("children", []):
                    post_data = post["data"]
                    if post_data.get("title", "").lower().find(keyword.lower()) != -1:
                        article_data = {
                            "title": post_data["title"],
                            "description": post_data.get("selftext", "")[:200],
                            "content": post_data.get("selftext", ""),
                            "url": f"https://reddit.com{post_data['permalink']}",
                            "source": f"Reddit r/{subreddit}",
                            "publishedAt": str(datetime.fromtimestamp(post_data.get("created_utc", 0))),
                            "source_importance": 3,
                            "is_recent": not older,
                            "engagement_score": post_data.get("score", 0) + post_data.get("num_comments", 0) * 2
                        }
                        all_articles.append(article_data)
        print(f"  Reddit: Found articles from {len(subreddits)} subreddits")
    except Exception as e:
        print(f"  Reddit error: {e}")
    
    return all_articles

def get_source_importance(source_name):
    """
    Assign importance score to news source
    """
    source_importance_map = {
        "bbc": 10, "cnn": 10, "reuters": 10, "associated press": 10, "bloomberg": 9,
        "the new york times": 9, "the wall street journal": 9, "washington post": 9,
        "financial times": 9, "forbes": 8, "business insider": 8, "techcrunch": 8,
        "the guardian": 8, "al jazeera": 8, "nbc news": 8, "cbs news": 8,
        "abc news": 7, "fox news": 7, "cnbc": 9, "marketwatch": 7,
        "huffpost": 6, "buzzfeed": 5, "daily mail": 4,
        "google news": 5, "reddit": 6
    }
    
    source_lower = source_name.lower()
    for key, value in source_importance_map.items():
        if key in source_lower:
            return value
    return 3

def extract_keywords(text):
    """
    Extract main keywords from text
    """
    stop_words = {"the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "but", "is", "are", "was", "were"}
    
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    
    word_counts = {}
    for word in words:
        if word not in stop_words:
            word_counts[word] = word_counts.get(word, 0) + 1
    
    keywords = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    
    return [kw[0] for kw in keywords[:5]]

def calculate_topic_similarity(topic1, topic2):
    """
    Calculate similarity between two topics
    """
    words1 = set(topic1.lower().split())
    words2 = set(topic2.lower().split())
    
    if not words1 or not words2:
        return 0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union)

def cluster_articles_by_topic(articles):
    """
    Cluster articles into topics using keyword extraction and similarity
    """
    topics = {}
    
    for article in articles:
        title = article["title"]
        
        keywords = extract_keywords(title)
        if not keywords:
            continue
        
        topic_name = " ".join(keywords[:3]).title()
        
        found_topic = None
        for existing_topic in topics.keys():
            similarity = calculate_topic_similarity(topic_name, existing_topic)
            if similarity > 0.5:
                found_topic = existing_topic
                break
        
        if found_topic:
            topics[found_topic].append(article)
        else:
            topics[topic_name] = [article]
    
    return topics

def calculate_trending_scores(recent_articles, older_articles):
    """
    Calculate trending score for each topic cluster
    """
    topics = cluster_articles_by_topic(recent_articles + older_articles)
    
    topics_with_scores = []
    
    for topic_name, articles in topics.items():
        if len(articles) < 2:
            continue
        
        recent_count = sum(1 for a in articles if a.get("is_recent", True))
        older_count = len(articles) - recent_count
        
        frequency_score = len(articles) * 2
        
        recency_score = recent_count * 3
        
        source_score = sum(a.get("source_importance", 3) for a in articles) / len(articles)
        
        engagement_score = sum(a.get("engagement_score", 0) for a in articles) * 0.5
        
        if older_count > 0:
            velocity = (recent_count - older_count) / older_count
        else:
            velocity = 1 if recent_count > 0 else 0
        velocity_score = velocity * 4
        
        trending_score = frequency_score + recency_score + source_score + engagement_score + velocity_score
        
        articles.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
        
        topic_data = {
            "name": topic_name,
            "articles": articles[:5],
            "trending_score": trending_score,
            "metrics": {
                "frequency": len(articles),
                "recent_count": recent_count,
                "velocity": f"{velocity:.2f}",
                "source_quality": f"{source_score:.1f}/10"
            }
        }
        topics_with_scores.append(topic_data)
    
    return topics_with_scores

def detect_trending_topics_for_keyword(keyword):
    """
    Find TRENDING topics about a keyword
    """
    print(f"\n=== Detecting trending topics for: '{keyword}' ===")
    
    recent_articles = get_articles_for_keyword(keyword, hours=24)
    older_articles = get_articles_for_keyword(keyword, hours=48, older=True)
    
    print(f"Found {len(recent_articles)} recent articles (24h)")
    print(f"Found {len(older_articles)} older articles (48h)")
    
    if not recent_articles and not older_articles:
        return []
    
    topics_with_scores = calculate_trending_scores(recent_articles, older_articles)
    
    topics_with_scores.sort(key=lambda x: x["trending_score"], reverse=True)
    
    trending_topics = [topic for topic in topics_with_scores if topic["trending_score"] > 20]
    
    print(f"Identified {len(trending_topics)} trending topics")
    
    return trending_topics[:3]

# --------------------------
# ORIGINAL FUNCTIONS (FOR GLOBAL TRENDING)
# --------------------------
def fetch_trending_topics():
    """
    Fetch trending topics from multiple news sources
    Returns a list of trending topics with metadata
    """
    trending_topics = []
    
    # ---- Source 1: NewsAPI Top Headlines (Global) ----
    try:
        url = "https://newsapi.org/v2/top-headlines"
        params = {
            "country": "us",
            "pageSize": 20,
            "apiKey": NEWS_API_KEY
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        for article in data.get("articles", []):
            if article.get("title") and article["title"] != "[Removed]":
                topic = {
                    "name": article["title"],
                    "source": "NewsAPI",
                    "category": "headline",
                    "article_count": 1,
                    "recent_articles": [{
                        "title": article["title"],
                        "description": article.get("description", ""),
                        "url": article["url"],
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "publishedAt": article.get("publishedAt", "")
                    }]
                }
                trending_topics.append(topic)
        print(f"Found {len(trending_topics)} trending topics from NewsAPI")
    except Exception as e:
        print(f"NewsAPI trending fetch failed: {e}")
    
    # ---- Source 2: Google News RSS Trending ----
    try:
        categories = ["world", "nation", "business", "technology", "entertainment", "sports", "science", "health"]
        
        for category in categories:
            feed_url = f"https://news.google.com/rss/headlines/section/topic/{category.upper()}?hl=en-US&gl=US&ceid=US:en"
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries[:10]:
                topic_name = entry.title
                
                existing = None
                for topic in trending_topics:
                    if topic_name.lower() in topic["name"].lower() or topic["name"].lower() in topic_name.lower():
                        existing = topic
                        break
                
                if existing:
                    existing["article_count"] += 1
                    existing["recent_articles"].append({
                        "title": entry.title,
                        "description": entry.get("summary", ""),
                        "url": entry.link,
                        "source": entry.get("source", {}).get("name", "Google News"),
                        "publishedAt": entry.get("published", "")
                    })
                else:
                    topic = {
                        "name": topic_name,
                        "source": f"Google News - {category}",
                        "category": category,
                        "article_count": 1,
                        "recent_articles": [{
                            "title": entry.title,
                            "description": entry.get("summary", ""),
                            "url": entry.link,
                            "source": entry.get("source", {}).get("name", "Google News"),
                            "publishedAt": entry.get("published", "")
                        }]
                    }
                    trending_topics.append(topic)
                    
            time.sleep(0.5)
        
        print(f"Total trending topics after Google News: {len(trending_topics)}")
    except Exception as e:
        print(f"Google News trending fetch failed: {e}")
    
    # ---- Source 3: Reddit API for trending discussions ----
    try:
        subreddits = ["worldnews", "news", "technology", "business", "entertainment"]
        for subreddit in subreddits:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=10"
            headers = {"User-Agent": "TrendAnalyzer/1.0"}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                for post in data["data"]["children"][:10]:
                    if post["data"]["score"] > 100:
                        topic_name = post["data"]["title"]
                        topic = {
                            "name": topic_name,
                            "source": f"Reddit - r/{subreddit}",
                            "category": "social",
                            "article_count": post["data"]["score"],
                            "recent_articles": [{
                                "title": topic_name,
                                "description": post["data"].get("selftext", "")[:200],
                                "url": f"https://reddit.com{post['data']['permalink']}",
                                "source": f"Reddit r/{subreddit}",
                                "publishedAt": str(datetime.fromtimestamp(post["data"]["created_utc"]))
                            }]
                        }
                        trending_topics.append(topic)
        print(f"Total trending topics after Reddit: {len(trending_topics)}")
    except Exception as e:
        print(f"Reddit trending fetch failed: {e}")
    
    trending_topics.sort(key=lambda x: x["article_count"], reverse=True)
    
    unique_topics = []
    seen_keywords = set()
    
    for topic in trending_topics:
        words = topic["name"].lower().split()
        keywords = [w for w in words if len(w) > 4][:3]
        
        is_duplicate = False
        for keyword in keywords:
            if keyword in seen_keywords:
                is_duplicate = True
                break
        
        if not is_duplicate and keywords:
            unique_topics.append(topic)
            seen_keywords.update(keywords)
    
    return unique_topics[:MAX_TRENDING_TOPICS]

# --------------------------
# ANALYZE TRENDING TOPIC FOR MARKETING OPPORTUNITIES
# --------------------------
def analyze_trending_topic(topic):
    """
    Analyze a single trending topic for Mastercard marketing opportunities
    """
    trending_context = ""
    if "trending_score" in topic:
        trending_context = f"""
        TRENDING METRICS:
        - Trending Score: {topic.get('trending_score', 0):.1f}
        - Number of Articles: {topic.get('article_count', 0)}
        - Velocity: {topic.get('metrics', {}).get('velocity', 'N/A')}
        - Source Quality: {topic.get('metrics', {}).get('source_quality', 'N/A')}
        """
    
    articles_text = "\n".join(
        f"- {article['title']}: {article.get('description', '')[:100]}..."
        for article in topic["recent_articles"][:3]
    )
    
    prompt = f"""
    Analyze this trending topic for Mastercard marketing opportunities:
    
    TRENDING TOPIC: {topic['name']}
    SOURCE: {topic['source']}
    {trending_context}
    
    RECENT ARTICLES/DISCUSSIONS:
    {articles_text}
    
    Based on this trending topic, provide a marketing analysis with:
    1. Why this is trending now
    2. Marketing opportunities for Mastercard
    3. Specific campaign ideas
    
    Return ONLY valid JSON in this exact format:
    {{
        "trend_analysis": {{
            "why_trending": "Explanation of why this topic is trending now",
            "relevance_to_mastercard": "Why Mastercard should care about this trend",
            "target_audience": "Which Mastercard audience segments would care most"
        }},
        "campaign_opportunities": [
            {{
                "campaign_name": "Creative campaign name",
                "campaign_concept": "Brief description of the campaign concept",
                "expected_impact": "What this campaign could achieve for Mastercard"
            }}
        ],
        "risk_assessment": {{
            "potential_risks": "Any risks or sensitivities Mastercard should consider",
            "recommended_approach": "Recommended approach to leverage this trend safely"
        }}
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a marketing strategist analyzing trending topics for financial brands. "
                        "Return valid JSON only. No markdown. No explanations."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        raw_output = response.choices[0].message.content.strip()
        
        try:
            analysis = json.loads(raw_output)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw_output, re.DOTALL)
            if match:
                analysis = json.loads(match.group())
            else:
                analysis = {
                    "trend_analysis": {
                        "why_trending": "Topic is gaining attention across multiple news sources",
                        "relevance_to_mastercard": "Opportunity for brand visibility and engagement",
                        "target_audience": "General Mastercard cardholders"
                    },
                    "campaign_opportunities": [{
                        "campaign_name": f"Mastercard {topic['name'][:20]} Initiative",
                        "campaign_concept": "Leverage trending topic for brand engagement",
                        "expected_impact": "Increased brand relevance and customer engagement"
                    }],
                    "risk_assessment": {
                        "potential_risks": "Standard brand safety considerations apply",
                        "recommended_approach": "Monitor trend evolution before major commitment"
                    }
                }
        
        result = {
            "topic_name": topic["name"],
            "source": topic["source"],
            "category": topic.get("category", "trending"),
            "engagement_score": topic.get("article_count", 0),
            "trending_score": topic.get("trending_score", 0),
            "trending_metrics": topic.get("metrics", {}),
            "recent_coverage": topic["recent_articles"][:2],
            "analysis": analysis
        }
        
        return result
        
    except Exception as e:
        print(f"LLM analysis failed for topic '{topic['name']}': {e}")
        return None

# --------------------------
# SAFE JSON PARSER
# --------------------------
def safe_json_parse(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\[.*\]", text, re.S)
        if match:
            return json.loads(match.group())
        raise ValueError("LLM did not return valid JSON")

# --------------------------
# MAIN API ENDPOINT - GET TRENDING TOPICS
# --------------------------
@app.route("/api/trending-topics", methods=["GET"])
def get_trending_topics():
    """
    Main endpoint: If keyword provided, find trending topics about that keyword
    If no keyword, show all global trending topics
    """
    keyword = request.args.get("keyword", "").strip()
    force_refresh = request.args.get("refresh", "").lower() == "true"
    
    # --- NEW: If keyword provided, detect TRENDING topics about that keyword ---
    if keyword:
        try:
            trending_topics = detect_trending_topics_for_keyword(keyword)
            
            if not trending_topics:
                return jsonify({
                    "keyword": keyword,
                    "message": f"No trending topics detected for '{keyword}' in last 24 hours",
                    "trending_topics": [],
                    "total_topics": 0,
                    "analysis_criteria": "Based on frequency, recency, source importance, and velocity of coverage"
                })
            
            analyzed_topics = []
            for i, topic in enumerate(trending_topics[:3]):
                print(f"Analyzing trending topic {i+1}: {topic['name'][:50]}...")
                
                formatted_topic = {
                    "name": topic["name"],
                    "source": "Trend Detection System",
                    "category": "trending",
                    "article_count": len(topic["articles"]),
                    "trending_score": topic["trending_score"],
                    "metrics": topic["metrics"],
                    "recent_articles": [{
                        "title": article["title"],
                        "description": article.get("description", ""),
                        "url": article["url"],
                        "source": article.get("source", "Unknown"),
                        "publishedAt": article.get("publishedAt", ""),
                        "engagement": article.get("engagement_score", 0)
                    } for article in topic["articles"][:3]]
                }
                
                analysis = analyze_trending_topic(formatted_topic)
                if analysis:
                    analyzed_topics.append(analysis)
                
                time.sleep(1)
            
            return jsonify({
                "keyword": keyword,
                "trending_topics": analyzed_topics,
                "total_topics": len(analyzed_topics),
                "detection_method": "trending_detection",
                "analysis_criteria": "Topics ranked by frequency, recency, source importance, and velocity",
                "timestamp": time.time()
            })
            
        except Exception as e:
            print(f"Trending detection failed for '{keyword}': {e}")
            return jsonify({
                "error": f"Failed to detect trending topics for '{keyword}': {str(e)}",
                "trending_topics": [],
                "total_topics": 0
            }), 500
    
    # --- ORIGINAL: No keyword, show all global trending topics ---
    print(f"\n=== Fetching all trending topics ===")
    
    current_time = time.time()
    if (not force_refresh and 
        trending_cache["data"] and 
        trending_cache["timestamp"] and 
        (current_time - trending_cache["timestamp"] < trending_cache["ttl"])):
        print("Returning cached trending topics")
        return jsonify({
            "trending_topics": trending_cache["data"],
            "total_topics": len(trending_cache["data"]),
            "source": "cache",
            "timestamp": trending_cache["timestamp"]
        })
    
    try:
        raw_topics = fetch_trending_topics()
        print(f"Found {len(raw_topics)} raw trending topics")
        
        analyzed_topics = []
        for i, topic in enumerate(raw_topics[:5]):
            print(f"Analyzing topic {i+1}: {topic['name'][:50]}...")
            analysis = analyze_trending_topic(topic)
            if analysis:
                analyzed_topics.append(analysis)
            time.sleep(1)
        
        trending_cache["data"] = analyzed_topics
        trending_cache["timestamp"] = current_time
        
        return jsonify({
            "trending_topics": analyzed_topics,
            "total_topics": len(analyzed_topics),
            "source": "live",
            "timestamp": current_time
        })
        
    except Exception as e:
        print(f"Error fetching/analyzing trending topics: {e}")
        return jsonify({
            "error": f"Failed to fetch trending topics: {str(e)}",
            "trending_topics": [],
            "total_topics": 0
        }), 500

# --------------------------
# LEGACY ENDPOINT - For backward compatibility
# --------------------------
@app.route("/api/analyze-keyword", methods=["GET"])
def analyze_keyword():
    """
    Legacy endpoint: Analyze a specific keyword
    """
    keyword = request.args.get("keyword", "").strip()
    if not keyword:
        return jsonify({"error": "Keyword parameter is required"}), 400
    
    print(f"\n=== Analyzing specific keyword: '{keyword}' ===")
    
    try:
        encoded_query = quote_plus(keyword)
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": keyword,
            "language": "en",
            "pageSize": 10,
            "sortBy": "relevancy",
            "apiKey": NEWS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        articles = data.get("articles", [])
        
        if not articles:
            url = "https://newsapi.org/v2/top-headlines"
            params = {"q": keyword, "language": "en", "pageSize": 10, "apiKey": NEWS_API_KEY}
            response = requests.get(url, params=params, timeout=10)
            articles = response.json().get("articles", [])
        
        articles_text = "\n".join(
            f"- {a['title']}: {a.get('description', '')[:100]}..."
            for a in articles[:5]
        )
        
        prompt = f"""
        Analyze news articles about "{keyword}" for Mastercard marketing opportunities.
        
        ARTICLES:
        {articles_text}
        
        Provide analysis in this JSON format:
        {{
            "keyword": "{keyword}",
            "current_coverage": {{
                "summary": "Summary of current news coverage",
                "sentiment": "Overall sentiment (positive/neutral/negative)"
            }},
            "marketing_opportunities": [
                {{
                    "opportunity": "Specific marketing opportunity",
                    "campaign_idea": "Concrete campaign concept",
                    "target_segment": "Which audience to target"
                }}
            ],
            "competitive_landscape": "How competitors might approach this topic",
            "recommended_action": "What Mastercard should do next"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a marketing analyst. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=600
        )
        
        analysis = json.loads(response.choices[0].message.content.strip())
        
        return jsonify({
            "analysis": analysis,
            "sample_articles": articles[:3],
            "article_count": len(articles)
        })
        
    except Exception as e:
        print(f"Keyword analysis failed: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

# --------------------------
# HEALTH CHECK ENDPOINT
# --------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Mastercard Trend Analyzer",
        "version": "3.1",
        "endpoints": {
            "/api/trending-topics": "Get all global trending topics",
            "/api/trending-topics?keyword=X": "Find trending topics about keyword X",
            "/api/trending-topics?keyword=X&refresh=true": "Force refresh cache",
            "/api/analyze-keyword?keyword=X": "Analyze specific keyword (legacy)",
            "/api/health": "Health check"
        },
        "features": {
            "keyword_trending_detection": "Detects truly trending topics by frequency, recency, source quality, and velocity",
            "multi_source_analysis": "NewsAPI, Google News RSS, Reddit",
            "marketing_insights": "AI-generated Mastercard campaign opportunities",
            "caching": "15-minute cache for global trends"
        }
    })

# --------------------------
# RUN SERVER
# --------------------------
if __name__ == "__main__":
    print("Starting Mastercard Trend Analyzer Server v3.1...")
    print("Main endpoint: GET /api/trending-topics")
    print("Keyword search: GET /api/trending-topics?keyword=your_topic")
    print("Legacy endpoint: GET /api/analyze-keyword?keyword=your_keyword")
    app.run(debug=True, host="0.0.0.0", port=8000)