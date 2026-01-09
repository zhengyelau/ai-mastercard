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

# --------------------------
# FLASK APP
# --------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

client = OpenAI(api_key=OPENAI_API_KEY)

# --------------------------
# FETCH ARTICLES (URL SAFE)
# --------------------------
def fetch_articles(keyword):
    """
    Try NewsAPI (free tier). If empty, fallback to Google News RSS.
    Expand generic lifestyle keywords automatically.
    """

    expanded_query_map = {
        "travel": "travel OR tourism OR flights OR hotels OR airlines OR vacation",
        "food": "food OR dining OR restaurant OR chef",
        "music": "music OR concert OR festival OR tour"
    }

    raw_query = expanded_query_map.get(keyword.lower(), keyword)
    encoded_query = quote_plus(raw_query)

    # ---- Attempt 1: NewsAPI top-headlines ----
    try:
        url = "https://newsapi.org/v2/top-headlines"
        params = {
            "q": raw_query,  # NewsAPI accepts raw query
            "language": "en",
            "pageSize": PAGE_SIZE,
            "apiKey": NEWS_API_KEY
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        articles = response.json().get("articles", [])

        if articles:
            return articles
    except Exception as e:
        print("NewsAPI failed:", e)

    # ---- Attempt 2: Google News RSS fallback ----
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
            "publishedAt": entry.get("published", "")
        })

    return articles

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

    article_text = "\n".join(
        f"- {a['title']}: {a.get('description', '')}"
        for a in articles[:15]
    )

    prompt = f"""
Identify the TOP 3 current or emerging trends related to "{keyword}"
that Mastercard could realistically build a marketing campaign around.

Guidelines:
- Trends should be specific themes, behaviors, or experiences
- Focus on commerce, payments, lifestyle, or access
- Mastercard must feel like a natural fit

Return ONLY valid JSON in this exact format:
[
  {{
    "trend": "",
    "why_it_matters": "",
    "mastercard_campaign_idea": ""
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
                    "You are a JSON API. "
                    "Return valid JSON only. "
                    "No markdown. No explanation."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    raw_output = response.choices[0].message.content.strip()
    print("\n--- RAW LLM OUTPUT ---\n", raw_output)

    return safe_json_parse(raw_output)

# --------------------------
# API ENDPOINT
# --------------------------
@app.route("/api/trending-topics", methods=["GET"])
def trending_topics():
    keyword = request.args.get("keyword", "").strip()

    if not keyword:
        return jsonify({"error": "Keyword parameter is required"}), 400

    try:
        articles = fetch_articles(keyword)
    except Exception as e:
        return jsonify({"error": f"News fetch failed: {str(e)}"}), 500

    try:
        trends = extract_marketing_trends(keyword, articles)
    except Exception as e:
        return jsonify({"error": f"Trend extraction failed: {str(e)}"}), 500

    return jsonify({
        "keyword": keyword,
        "article_count": len(articles),
        "top_trends": trends
    })

# --------------------------
# RUN SERVER
# --------------------------
if __name__ == "__main__":
    app.run(debug=True)
