import os
import re
import json
from collections import Counter
from flask import Flask, request, jsonify
import requests
from openai import OpenAI
from flask_cors import CORS

# --------------------------
# CONFIG
# --------------------------
NEWS_API_KEY = os.getenv("NEWS_API_KEY") or '7ba4e28621ff4d1f8740421b5004fea0'    # NewsAPI key
OPENAI_API_KEY = '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'  # OpenAI key

FROM_DATE = "2025-12-09"
PAGE_SIZE = 50  # fetch enough articles

# Initialize Flask
app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"]
        }
    }
)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# --------------------------
# HELPER FUNCTIONS
# --------------------------

def fetch_articles(keyword, from_date, page_size=50):
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": keyword,
        "from": from_date,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json().get("articles", [])

def generate_brand_keywords(brand_description, num_keywords=12):
    prompt = f"""
                You are a marketing strategist for Mastercard.
                Based on the brand description below, generate a list of {num_keywords} keywords or short phrases
                that represent topics and trends suitable for Mastercard marketing campaigns.
                Return ONLY a valid JSON array of strings. No explanation. No markdown.

                Brand description:
                {brand_description}
                """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a senior marketing strategist."},
            {"role": "user", "content": prompt}
        ],
    )

    keywords_text = response.choices[0].message.content.strip()
    print("LLM OUTPUT:", keywords_text)

    return json.loads(keywords_text)

def extract_keywords(text):
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)
    return text.split()


def score_article_for_brand(article, brand_keywords):
    title = article.get("title") or ""
    description = article.get("description") or ""

    text = f"{title} {description}".lower()
    return any(k.lower() in text for k in brand_keywords)


# def detect_trends(articles, brand_keywords, top_n=3):
#     brand_articles = [a for a in articles if score_article_for_brand(a, brand_keywords)]

#     print('brand_articles: {}'.format(brand_keywords))

#     if not brand_articles:
#         return []

#     all_words = []
#     for article in brand_articles:
#         all_words.extend(extract_keywords(article.get("title", "")))

#     counter = Counter(all_words)
#     top_keywords = [kw for kw, _ in counter.most_common(top_n)]

#     top_trends = []
#     for kw in top_keywords:
#         for article in brand_articles:
#             if kw in extract_keywords(article.get("title", "")):
#                 top_trends.append({
#                     "trend": kw,
#                     "title": article.get("title"),
#                     "description": article.get("description"),
#                     "url": article.get("url"),
#                     "publishedAt": article.get("publishedAt")
#                 })
#                 break

#     return top_trends

from collections import Counter

def detect_trends(articles, brand_keywords, top_n=3):
    # 1. Expand brand intent terms (important)
    brand_terms = brand_keywords + [
        "payment", "payments", "card", "credit card",
        "digital wallet", "wallet", "tap to pay",
        "contactless", "cashless", "rewards",
        "loyalty", "travel", "dining",
        "bank", "banking", "fintech"
    ]

    # 2. Filter brand-related articles
    brand_articles = []
    for article in articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        text = f"{title} {description}".lower()

        if any(term.lower() in text for term in brand_terms):
            brand_articles.append(article)

    print("brand_articles count:", len(brand_articles))

    if not brand_articles:
        return []

    # 3. Extract keywords once per article
    all_keywords = []
    article_keyword_map = []

    for article in brand_articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        combined_text = f"{title} {description}"

        keywords = extract_keywords(combined_text)
        article_keyword_map.append((article, keywords))
        all_keywords.extend(keywords)

    # 4. Find top keywords
    counter = Counter(all_keywords)
    top_keywords = [kw for kw, _ in counter.most_common(top_n)]

    # 5. Map keywords back to representative articles
    top_trends = []
    for kw in top_keywords:
        kw_lower = kw.lower()

        for article, keywords in article_keyword_map:
            if kw_lower in (k.lower() for k in keywords):
                top_trends.append({
                    "trend": kw,
                    "title": article.get("title"),
                    "description": article.get("description"),
                    "url": article.get("url"),
                    "publishedAt": article.get("publishedAt")
                })
                break

    return top_trends


# --------------------------
# FLASK ENDPOINT
# --------------------------

@app.route("/api/trending-topics", methods=["GET"])
def trending_topics():
    # 1. Get keyword from frontend query params
    keyword = request.args.get("keyword", "").strip()

    if not keyword:
        return jsonify({"error": "Keyword parameter is required"}), 400
    

    # 2. Dynamic Mastercard brand keywords
    brand_description = """
                        Mastercard brand values:
                        - Priceless experiences
                        - Rewards for lifestyle, travel, and dining
                        - Convenience, digital payments, and mobile-first experiences
                        """
    try:
        brand_keywords = generate_brand_keywords(brand_description)
    except Exception as e:
        return jsonify({"error": f"Failed to generate brand keywords: {str(e)}"}), 500


    # 3. Fetch articles from NewsAPI
    try:
        articles = fetch_articles(keyword, FROM_DATE, PAGE_SIZE)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch articles: {str(e)}"}), 500
    
    # 4. Detect top 3 trends
    print('articles: {}'.format(articles))
    print('brand_keywords: {}'.format(brand_keywords))
    top_trends = detect_trends(articles, brand_keywords, top_n=3)

    return jsonify({
        "keyword": keyword,
        "brand_keywords": brand_keywords,
        "top_trends": top_trends
    })

# --------------------------
# RUN FLASK APP
# --------------------------
if __name__ == "__main__":
    app.run(debug=True)
