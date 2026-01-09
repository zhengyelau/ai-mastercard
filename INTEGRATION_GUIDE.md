# Backend Integration Guide

This guide will help you integrate your NewsAPI backend with the frontend application.

## Quick Setup

### 1. Configure the API Endpoint

Edit the `.env` file in the project root and set your backend URL:

```env
VITE_API_URL=http://localhost:3000/api
```

For production, use your deployed backend URL:

```env
VITE_API_URL=https://your-production-api.com/api
```

### 2. Restart the Development Server

After updating `.env`, restart the dev server for changes to take effect:

```bash
npm run dev
```

## API Endpoint Requirements

Your backend must implement the following endpoint:

### POST /trending-topics

This endpoint receives a keyword and returns trending topics with campaign ideas.

#### Request

**URL**: `${VITE_API_URL}/trending-topics`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "keyword": "food"
}
```

**TypeScript Interface**:
```typescript
interface TrendingTopicsRequest {
  keyword: string;
}
```

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "keyword": "food",
  "timestamp": "2024-01-09T12:00:00Z",
  "topics": [
    {
      "id": "unique-id-1",
      "topic": "Plant-Based Fast Food Revolution",
      "trendScore": 95,
      "category": "Food & Sustainability",
      "campaignIdea": {
        "title": "Priceless Plant Power",
        "description": "Partner with leading plant-based fast food chains...",
        "targetAudience": "Millennials and Gen Z (ages 18-35)...",
        "keyMessage": "Every plant-based meal is a priceless choice...",
        "tactics": [
          "Launch Green Rewards program...",
          "Partner with Impossible Foods...",
          "Create social media challenge..."
        ],
        "expectedOutcome": "Increase Mastercard usage by 25%..."
      }
    },
    {
      "id": "unique-id-2",
      "topic": "Ghost Kitchen Delivery Boom",
      "trendScore": 88,
      "category": "Food Tech",
      "campaignIdea": {
        "title": "Priceless Delivery Experiences",
        "description": "Tap into the ghost kitchen trend...",
        "targetAudience": "Urban professionals (ages 25-45)...",
        "keyMessage": "Restaurant-quality experiences delivered...",
        "tactics": [
          "Partner with top ghost kitchen brands...",
          "Offer priority delivery...",
          "Create Chef's Table at Home..."
        ],
        "expectedOutcome": "Drive 30% increase in online delivery..."
      }
    },
    {
      "id": "unique-id-3",
      "topic": "Global Fusion Street Food",
      "trendScore": 82,
      "category": "Culinary Travel",
      "campaignIdea": {
        "title": "Taste the World Without Borders",
        "description": "Celebrate the fusion of global street food...",
        "targetAudience": "Food enthusiasts and cultural explorers...",
        "keyMessage": "Collect flavors, not stamps...",
        "tactics": [
          "Launch digital Flavor Passport...",
          "Partner with fusion food trucks...",
          "Create city-specific food trails..."
        ],
        "expectedOutcome": "Increase transaction frequency by 35%..."
      }
    }
  ]
}
```

**TypeScript Interface**:
```typescript
interface CampaignTopic {
  id: string;
  topic: string;
  trendScore: number;
  category: string;
  campaignIdea: {
    title: string;
    description: string;
    targetAudience: string;
    keyMessage: string;
    tactics: string[];
    expectedOutcome: string;
  };
}

interface TrendingTopicsResponse {
  keyword: string;
  topics: CampaignTopic[];
  timestamp: string;
}
```

## Field Requirements

### Topic Fields

- **id** (required): Unique identifier for the topic (string)
- **topic** (required): The trending topic name (string, max 100 chars)
- **trendScore** (required): Relevance score from 0-100 (number)
- **category** (required): Topic category (string, max 50 chars)

### Campaign Idea Fields

- **title** (required): Campaign title (string, max 100 chars)
- **description** (required): Campaign description (string, max 500 chars)
- **targetAudience** (required): Target demographic (string, max 300 chars)
- **keyMessage** (required): Core message (string, max 200 chars)
- **tactics** (required): Array of 3-7 tactics (string[], each max 200 chars)
- **expectedOutcome** (required): Expected results (string, max 300 chars)

## Error Handling

The frontend handles the following error scenarios:

### 400 Bad Request
```json
{
  "message": "Invalid keyword provided"
}
```

### 429 Too Many Requests
```json
{
  "message": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to process request"
}
```

### Network Errors
The frontend will show: "Unable to connect to the server. Please check your internet connection."

## Testing Your Integration

### 1. Using curl

Test your endpoint with curl:

```bash
curl -X POST http://localhost:3000/api/trending-topics \
  -H "Content-Type: application/json" \
  -d '{"keyword": "food"}'
```

### 2. Using the Frontend

1. Start your backend server
2. Make sure `.env` has the correct `VITE_API_URL`
3. Start the frontend: `npm run dev`
4. Enter a keyword and click "Analyze"
5. Check the browser console for any errors
6. Verify the topics are displayed correctly

## NewsAPI Integration Tips

When using NewsAPI to fetch trending topics:

### 1. Keyword Mapping

Map user keywords to NewsAPI search queries:

```javascript
const keywordMapping = {
  'food': 'restaurant OR dining OR cooking',
  'music': 'concert OR festival OR album',
  'travel': 'tourism OR destination OR vacation'
};
```

### 2. Trend Score Calculation

Calculate trend scores based on:
- Article frequency
- Engagement metrics
- Recency of articles
- Source authority

Example:
```javascript
const trendScore = Math.min(100, (
  (articleCount * 20) +
  (engagement * 30) +
  (recencyScore * 30) +
  (authorityScore * 20)
));
```

### 3. Category Detection

Use article categories or keywords to determine topic categories:

```javascript
const categoryKeywords = {
  'Food & Sustainability': ['plant-based', 'vegan', 'organic'],
  'Food Tech': ['delivery', 'ghost kitchen', 'app'],
  'Music Tech': ['AI', 'virtual', 'streaming']
};
```

### 4. Campaign Generation

Use an AI service (OpenAI, Anthropic, etc.) to generate campaign ideas based on trending articles:

```javascript
const prompt = `Based on this trending topic: "${topic}"
Generate a Mastercard marketing campaign with:
- Title
- Description
- Target Audience
- Key Message
- 5 Tactics
- Expected Outcome`;
```

## Environment Variables

The frontend expects these environment variables:

```env
# Required: Your backend API URL
VITE_API_URL=http://localhost:3000/api

# Already configured: Supabase (for future features)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

## CORS Configuration

Make sure your backend allows requests from the frontend:

```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// For production, use:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Timeout Configuration

The frontend has a 30-second timeout for API requests. Make sure your backend responds within this time:

- Fetch news articles: ~5 seconds
- Generate campaign ideas: ~10 seconds
- Total processing: < 30 seconds

Consider implementing caching for frequently searched keywords.

## Best Practices

1. **Return exactly 3 topics** per request for consistent UI
2. **Sort by trendScore** (highest first)
3. **Include timestamps** for cache invalidation
4. **Validate input** to prevent API abuse
5. **Implement rate limiting** (recommended: 10 requests/minute per IP)
6. **Cache results** for popular keywords (5-15 minutes)
7. **Log errors** for debugging
8. **Use HTTPS** in production

## Response Validation

The frontend validates:

- Response has `topics` array
- `topics` is an array
- Each topic has required fields

If validation fails, it shows: "Invalid response format from server"

## Troubleshooting

### Issue: "Unable to connect to the server"

**Solution**:
- Check if your backend is running
- Verify `VITE_API_URL` in `.env`
- Check for CORS errors in browser console
- Ensure backend is listening on the correct port

### Issue: "Invalid response format from server"

**Solution**:
- Check backend response matches TypeScript interfaces
- Verify all required fields are present
- Check field types match expectations
- Look at browser console for detailed error

### Issue: "Server error. Please try again later."

**Solution**:
- Check backend logs for errors
- Verify NewsAPI key is valid
- Check NewsAPI rate limits
- Ensure AI service (if used) is accessible

## Example Backend Response

Here's a complete example response your backend should return:

```json
{
  "keyword": "food",
  "timestamp": "2024-01-09T12:00:00.000Z",
  "topics": [
    {
      "id": "1",
      "topic": "Plant-Based Fast Food Revolution",
      "trendScore": 95,
      "category": "Food & Sustainability",
      "campaignIdea": {
        "title": "Priceless Plant Power",
        "description": "Partner with leading plant-based fast food chains to offer exclusive cashback rewards for eco-conscious dining choices.",
        "targetAudience": "Millennials and Gen Z (ages 18-35) who are health-conscious and environmentally aware",
        "keyMessage": "Every plant-based meal is a priceless choice for your health and the planet",
        "tactics": [
          "Launch Green Rewards program with 10% cashback on plant-based meals",
          "Partner with Impossible Foods and Beyond Meat restaurant locations",
          "Create social media challenge #PricelessPlantPower",
          "Influencer collaborations with eco-lifestyle creators",
          "Limited edition green Mastercard design for participants"
        ],
        "expectedOutcome": "Increase Mastercard usage among younger demographics by 25% and strengthen brand association with sustainability"
      }
    }
  ]
}
```

## Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify backend response format
3. Test endpoint with curl
4. Review backend logs
5. Ensure all environment variables are set

## Next Steps

After successful integration:

1. Test with various keywords
2. Verify PDF generation works
3. Test error scenarios
4. Optimize response times
5. Implement caching strategy
6. Add monitoring and logging
7. Deploy to production

Your frontend is now ready to work with your NewsAPI backend!
