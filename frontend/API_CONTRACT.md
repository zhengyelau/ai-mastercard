# API Contract Documentation

This document defines the API contract between the frontend application and the backend service.

## Base URL

Configure via environment variable: `VITE_API_URL`

## Endpoints

### POST /trending-topics

Analyzes a keyword and returns trending topics with marketing campaign ideas.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "keyword": "string"
}
```

**Example**:
```json
{
  "keyword": "food"
}
```

#### Response

**Status**: 200 OK

**Body**:
```typescript
{
  keyword: string;
  timestamp: string; // ISO 8601 format
  topics: Array<{
    id: string;
    topic: string;
    trendScore: number; // 0-100
    category: string;
    campaignIdea: {
      title: string;
      description: string;
      targetAudience: string;
      keyMessage: string;
      tactics: string[]; // Array of campaign tactics
      expectedOutcome: string;
    };
  }>;
}
```

**Example Response**:
```json
{
  "keyword": "food",
  "timestamp": "2024-01-09T12:00:00Z",
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
          "Partner with Impossible Foods, Beyond Meat restaurant locations",
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

#### Error Responses

**Status**: 400 Bad Request
```json
{
  "error": "Invalid keyword provided",
  "message": "Keyword must be a non-empty string"
}
```

**Status**: 500 Internal Server Error
```json
{
  "error": "Server error",
  "message": "Failed to process trending topics"
}
```

## Data Constraints

### Topic Object

- `id`: Unique identifier (UUID or string)
- `topic`: Brief, descriptive topic name (max 100 characters)
- `trendScore`: Integer between 0-100 (higher = more trending)
- `category`: Topic category (max 50 characters)

### Campaign Idea Object

- `title`: Campaign title (max 100 characters)
- `description`: Brief campaign description (max 500 characters)
- `targetAudience`: Target demographic description (max 300 characters)
- `keyMessage`: Core campaign message (max 200 characters)
- `tactics`: Array of 3-7 actionable tactics (each max 200 characters)
- `expectedOutcome`: Expected results/metrics (max 300 characters)

## Expected Behavior

1. The API should return exactly **3 topics** per keyword
2. Topics should be sorted by `trendScore` (highest first)
3. All topics should be relevant to the provided keyword
4. Response time should be under 5 seconds
5. The API should handle common keywords: food, music, travel, fashion, sports, technology, health, finance, entertainment

## Security Considerations

- Implement rate limiting (recommended: 10 requests per minute per IP)
- Validate input to prevent injection attacks
- Use HTTPS in production
- Implement API key authentication if needed

## Testing

### Sample Test Cases

```bash
# Test Case 1: Valid keyword
curl -X POST https://your-api.com/trending-topics \
  -H "Content-Type: application/json" \
  -d '{"keyword": "food"}'

# Test Case 2: Empty keyword (should fail)
curl -X POST https://your-api.com/trending-topics \
  -H "Content-Type: application/json" \
  -d '{"keyword": ""}'

# Test Case 3: Different keyword
curl -X POST https://your-api.com/trending-topics \
  -H "Content-Type: application/json" \
  -d '{"keyword": "music"}'
```

## TypeScript Types

Copy these types to your backend for type safety:

```typescript
export interface CampaignTopic {
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

export interface TrendingTopicsRequest {
  keyword: string;
}

export interface TrendingTopicsResponse {
  keyword: string;
  topics: CampaignTopic[];
  timestamp: string;
}
```

## Versioning

Current API Version: `v1`

Future endpoint path: `/api/v1/trending-topics`

## Support

For questions about the API contract, contact the frontend development team.
