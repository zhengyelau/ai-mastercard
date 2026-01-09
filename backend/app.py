import os
import json
import re
import requests
import feedparser
from urllib.parse import quote_plus
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

# --------------------------
# CONFIG
# --------------------------
NEWS_API_KEY = '7ba4e28621ff4d1f8740421b5004fea0'
OPENAI_API_KEY = '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' 
PAGE_SIZE = 30
MAX_ARTICLES_PER_TREND = 3

# --------------------------
# FLASK APP
# --------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

client = OpenAI(api_key=OPENAI_API_KEY)

# Cache for expanded queries to avoid repeated LLM calls
query_cache = {}

# --------------------------
# DYNAMIC KEYWORD EXPANSION
# --------------------------
def expand_keyword_with_llm(keyword):
    """
    Use OpenAI to dynamically generate better search queries for news articles.
    Returns expanded query string.
    """
    prompt = f"""
    Transform the search keyword "{keyword}" into an optimized news search query.
    
    Context: I'm building a trend analysis tool for Mastercard marketing campaigns.
    I need to find recent news articles about this topic to identify emerging trends.
    
    Guidelines:
    1. Focus on terms that are likely to appear in business, technology, and lifestyle news
    2. Include both broad and specific terms separated by OR
    3. Consider: consumer behavior, business developments, technology applications
    4. Exclude overly technical/scientific terms unless relevant to commerce
    5. Keep it concise (3-8 terms maximum)
    6. Prioritize terms that Mastercard could relate to (payments, access, experiences)
    
    Example transformations:
    - "gaming" → "gaming OR esports OR video games OR streaming OR tournaments"
    - "sustainability" → "sustainability OR eco-friendly OR green business OR carbon neutral"
    - "remote work" → "remote work OR hybrid work OR digital nomad OR work from home"
    - "travel" → "travel OR tourism OR flights OR hotels OR vacation OR hospitality"
    - "food" → "food OR dining OR restaurant OR chef OR cuisine OR culinary"
    
    Output ONLY the search query, no explanations, no markdown, no quotes.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a search query optimization expert. Return only the search query string."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        expanded_query = response.choices[0].message.content.strip()
        # Clean up the response
        expanded_query = expanded_query.strip('"\'')
        print(f"Keyword expansion: '{keyword}' → '{expanded_query}'")
        return expanded_query
        
    except Exception as e:
        print(f"LLM expansion failed: {e}")
        return keyword  # Fallback to original keyword

# --------------------------
# FETCH ARTICLES WITH DYNAMIC EXPANSION
# --------------------------
def fetch_articles(keyword):
    """
    Try NewsAPI. If empty, fallback to Google News RSS.
    Uses dynamic keyword expansion with LLM.
    """
    # Static expansion map for common terms (optional fallback)
    static_expansion_map = {
        "travel": "travel OR tourism OR flights OR hotels OR airlines OR vacation",
        "food": "food OR dining OR restaurant OR chef OR cuisine",
        "music": "music OR concert OR festival OR tour OR artist",
        "sports": "sports OR game OR tournament OR athlete OR championship",
        "tech": "technology OR tech OR innovation OR startup",
        "health": "health OR wellness OR fitness OR medical",
        "fashion": "fashion OR clothing OR style OR designer",
        "finance": "finance OR banking OR investment OR economy"
    }
    
    # Check cache first
    if keyword.lower() in query_cache:
        raw_query = query_cache[keyword.lower()]
        print(f"Using cached expansion for '{keyword}': {raw_query}")
    # Check static map for common terms (faster, no API cost)
    elif keyword.lower() in static_expansion_map:
        raw_query = static_expansion_map[keyword.lower()]
        query_cache[keyword.lower()] = raw_query
        print(f"Using static expansion for '{keyword}': {raw_query}")
    else:
        # Use LLM for dynamic expansion
        raw_query = expand_keyword_with_llm(keyword)
        query_cache[keyword.lower()] = raw_query
    
    encoded_query = quote_plus(raw_query)
    
    # ---- Attempt 1: NewsAPI everything endpoint ----
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": raw_query,
            "language": "en",
            "pageSize": PAGE_SIZE,
            "sortBy": "relevancy",
            "apiKey": NEWS_API_KEY
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        articles = data.get("articles", [])
        
        # Filter out articles with no content or removed titles
        filtered_articles = [
            a for a in articles 
            if a.get("title") and a.get("title") != "[Removed]" and a.get("title") != ""
        ]
        
        if filtered_articles:
            print(f"Found {len(filtered_articles)} articles from NewsAPI")
            return filtered_articles[:PAGE_SIZE]
    except Exception as e:
        print("NewsAPI failed:", e)
    
    # ---- Attempt 2: NewsAPI top-headlines as fallback ----
    try:
        url = "https://newsapi.org/v2/top-headlines"
        params = {
            "q": keyword,  # Use original keyword for headlines
            "language": "en",
            "pageSize": PAGE_SIZE,
            "apiKey": NEWS_API_KEY
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        articles = response.json().get("articles", [])
        
        if articles:
            print(f"Found {len(articles)} articles from NewsAPI top-headlines")
            return articles[:PAGE_SIZE]
    except Exception as e:
        print("NewsAPI top-headlines failed:", e)
    
    # ---- Attempt 3: Google News RSS fallback ----
    try:
        feed_url = (
            "https://news.google.com/rss/search"
            f"?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        )
        feed = feedparser.parse(feed_url)
        articles = []
        for entry in feed.entries[:PAGE_SIZE]:
            articles.append({
                "title": entry.title,
                "description": entry.get("summary", ""),
                "url": entry.link,
                "publishedAt": entry.get("published", ""),
                "source": entry.get("source", "")
            })
        print(f"Found {len(articles)} articles from Google News RSS")
        return articles
    except Exception as e:
        print("Google News RSS failed:", e)
        return []

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
# TREND EXTRACTION (LLM)
# --------------------------
def extract_marketing_trends(keyword, articles):
    if not articles:
        return []

    print(f"\nArticles found for '{keyword}': {len(articles)}")

    # Use more articles for better trend detection
    article_text = "\n".join(
        f"- {a['title']}: {a.get('description', '')}"
        for a in articles[:20]  # Increased from 15 to 20
    )

    prompt = f"""
    Analyze these news articles and identify the TOP 3 current or emerging trends related to "{keyword}"
    that Mastercard could realistically build a marketing campaign around.

    Guidelines:
    1. Trends should be specific themes, behaviors, or experiences (not generic)
    2. Focus on commerce, payments, lifestyle, digital experiences, or access
    3. Mastercard should feel like a natural fit for each trend
    4. Consider: consumer behavior changes, technology adoption, business innovations
    5. Make sure trends are actionable and campaign-worthy

    Return ONLY valid JSON in this exact format:
    [
    {{
        "trend": "Specific trend name here",
        "why_it_matters": "Why this trend is important for Mastercard's audience",
        "mastercard_campaign_idea": "A concrete campaign idea Mastercard could execute"
    }}
    ]

    Articles:
    {article_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a JSON API for marketing trend analysis. "
                    "Return valid JSON only. "
                    "No markdown. No explanations. "
                    "Ensure the JSON is properly formatted."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.2  # Slightly higher for more creative ideas
    )

    raw_output = response.choices[0].message.content.strip()
    print("\n--- RAW LLM OUTPUT ---\n", raw_output)

    # Parse GPT output
    try:
        llm_trends = safe_json_parse(raw_output)
    except Exception as e:
        print(f"JSON parsing failed: {e}")
        # Fallback to default trends
        llm_trends = [
            {
                "trend": f"Digital {keyword} experiences",
                "why_it_matters": f"Consumers are increasingly adopting digital solutions for {keyword}",
                "mastercard_campaign_idea": f"Mastercard could create a {keyword} discovery platform with exclusive offers"
            },
            {
                "trend": f"Premium {keyword} access",
                "why_it_matters": f"Consumers are willing to pay for enhanced {keyword} experiences",
                "mastercard_campaign_idea": f"Mastercard could offer cardholders VIP access to {keyword} events and services"
            }
        ]

    # --------------------------
    # Assign unique articles to trends
    # --------------------------
    used_articles = set()
    
    for trend_obj in llm_trends:
        trend_name = trend_obj["trend"].lower()
        assigned = False
        
        # Try to find article containing trend keywords
        keywords = trend_name.split()
        for a in articles:
            text = f"{a['title']} {a.get('description','')}".lower()
            url = a['url']
            
            # Check if any keyword from trend is in article
            if (any(keyword in text for keyword in keywords if len(keyword) > 3) 
                and url not in used_articles):
                trend_obj["article_sample"] = {
                    "title": a["title"],
                    "description": a.get("description", ""),
                    "url": url,
                    "publishedAt": a.get("publishedAt", ""),
                    "source": a.get("source", {}).get("name", "") if isinstance(a.get("source"), dict) else a.get("source", "")
                }
                used_articles.add(url)
                assigned = True
                break
        
        # Fallback 1: Find article with original keyword
        if not assigned:
            for a in articles:
                text = f"{a['title']} {a.get('description','')}".lower()
                url = a['url']
                if keyword.lower() in text and url not in used_articles:
                    trend_obj["article_sample"] = {
                        "title": a["title"],
                        "description": a.get("description", ""),
                        "url": url,
                        "publishedAt": a.get("publishedAt", ""),
                        "source": a.get("source", {}).get("name", "") if isinstance(a.get("source"), dict) else a.get("source", "")
                    }
                    used_articles.add(url)
                    assigned = True
                    break
        
        # Fallback 2: Attach first unused article
        if not assigned:
            for a in articles:
                url = a['url']
                if url not in used_articles:
                    trend_obj["article_sample"] = {
                        "title": a["title"],
                        "description": a.get("description", ""),
                        "url": url,
                        "publishedAt": a.get("publishedAt", ""),
                        "source": a.get("source", {}).get("name", "") if isinstance(a.get("source"), dict) else a.get("source", "")
                    }
                    used_articles.add(url)
                    assigned = True
                    break
        
        # Fallback 3: If all articles used, use the first one
        if not assigned and articles:
            a = articles[0]
            trend_obj["article_sample"] = {
                "title": a["title"],
                "description": a.get("description", ""),
                "url": a["url"],
                "publishedAt": a.get("publishedAt", ""),
                "source": a.get("source", {}).get("name", "") if isinstance(a.get("source"), dict) else a.get("source", "")
            }

    return llm_trends

# --------------------------
# API ENDPOINT
# --------------------------
@app.route("/api/trending-topics", methods=["GET"])
def trending_topics():
    keyword = request.args.get("keyword", "").strip()
    if not keyword:
        return jsonify({"error": "Keyword parameter is required"}), 400
    
    # Optional: Add keyword validation
    if len(keyword) > 100:
        return jsonify({"error": "Keyword too long (max 100 characters)"}), 400
    
    print(f"\n=== Processing request for keyword: '{keyword}' ===")

    try:
        articles = fetch_articles(keyword)
        print(f"Total articles fetched: {len(articles)}")
    except Exception as e:
        print(f"News fetch failed: {e}")
        return jsonify({"error": f"News fetch failed: {str(e)}"}), 500

    try:
        trends = extract_marketing_trends(keyword, articles)
        print(f"Trends extracted: {len(trends)}")
    except Exception as e:
        print(f"Trend extraction failed: {e}")
        return jsonify({"error": f"Trend extraction failed: {str(e)}"}), 500

    return jsonify({
        "keyword": keyword,
        "article_count": len(articles),
        "top_trends": trends
    })

# --------------------------
# HEALTH CHECK ENDPOINT
# --------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Mastercard Trend Analyzer",
        "version": "2.0"
    })

# --------------------------
# RUN SERVER
# --------------------------
if __name__ == "__main__":
    print("Starting Mastercard Trend Analyzer Server...")
    print("API available at: http://localhost:5000/api/trending-topics?keyword=your_keyword")
    app.run(debug=True, host="0.0.0.0", port=5000)