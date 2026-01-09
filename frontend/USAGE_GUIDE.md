# Usage Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

## Testing with Mock Data

The application comes pre-configured with comprehensive mock data for testing.

### Available Keywords

Try these keywords to see the mock data in action:

1. **food** - Returns 3 food and dining related campaigns
   - Plant-Based Fast Food Revolution
   - Ghost Kitchen Delivery Boom
   - Global Fusion Street Food

2. **music** - Returns 3 music and entertainment related campaigns
   - AI-Generated Music & Virtual Concerts
   - Nostalgia Music Revivals
   - Local Music Scene Support

3. **Any other keyword** - Will default to food campaigns

### How to Use the App

#### Step 1: Enter a Keyword
Type "food" or "music" in the search box and click "Analyze"

#### Step 2: Review the Results
- You'll see 3 campaign cards with detailed information
- Each card shows:
  - Topic name and trend score
  - Campaign category
  - Campaign title and description
  - Target audience
  - Key message
  - Campaign tactics
  - Expected outcomes

#### Step 3: Select Topics
- All topics are selected by default
- Click on any card to deselect it
- Click again to reselect
- The selection count updates in real-time

#### Step 4: Download PDF
- Click "Download PDF Report" button
- A professional PDF will be generated with:
  - Mastercard branding
  - One page per selected topic
  - All campaign details formatted professionally

## Connecting Your Backend API

### Option 1: Environment Variable

1. Create a `.env` file in the project root:
   ```env
   VITE_API_URL=https://your-api.com
   ```

2. Restart the development server

3. The app will now call your API endpoint at:
   ```
   POST https://your-api.com/trending-topics
   ```

### Option 2: Direct Code Update

Edit `src/services/api.ts` and change:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

To:

```typescript
const API_BASE_URL = 'https://your-api.com';
```

### Fallback Behavior

The app automatically falls back to mock data if:
- No API URL is configured
- The API request fails
- Network issues occur

This ensures you can always test the UI while developing the backend.

## API Requirements

Your backend must implement:

**Endpoint**: `POST /trending-topics`

**Request**:
```json
{
  "keyword": "food"
}
```

**Response**:
```json
{
  "keyword": "food",
  "timestamp": "2024-01-09T12:00:00Z",
  "topics": [
    {
      "id": "1",
      "topic": "Topic Name",
      "trendScore": 95,
      "category": "Category",
      "campaignIdea": {
        "title": "Campaign Title",
        "description": "Campaign description...",
        "targetAudience": "Target audience...",
        "keyMessage": "Key message...",
        "tactics": ["Tactic 1", "Tactic 2", "..."],
        "expectedOutcome": "Expected outcome..."
      }
    }
  ]
}
```

See `API_CONTRACT.md` for complete API specifications.

## PDF Output

### PDF Features

- Professional Mastercard-branded header
- One page per campaign topic
- Clean, readable layout
- Includes all campaign details
- Automatic file naming with timestamp

### PDF File Name Format

```
Mastercard_Campaign_{keyword}_{timestamp}.pdf
```

Example: `Mastercard_Campaign_food_1704801234567.pdf`

## Customization

### Adding More Mock Keywords

Edit `src/services/api.ts` and add to `MOCK_DATA`:

```typescript
const MOCK_DATA: Record<string, CampaignTopic[]> = {
  food: [...],
  music: [...],
  travel: [
    {
      id: '7',
      topic: 'Your Travel Topic',
      // ... rest of the data
    }
  ]
};
```

### Changing Colors/Styling

The app uses Tailwind CSS. Main colors:
- Primary Blue: `blue-600` / `blue-700`
- Success Green: `green-600` / `green-700`
- Accent Orange: `orange-600`

Update in component files or `tailwind.config.js` for global changes.

## Troubleshooting

### Issue: "Failed to fetch trending topics"

**Solution**:
- Check if your API is running
- Verify the `VITE_API_URL` in `.env`
- Check browser console for detailed errors
- The app will use mock data if API fails

### Issue: PDF not downloading

**Solution**:
- Check browser's download settings
- Make sure pop-ups are not blocked
- Try selecting at least one topic

### Issue: No results showing

**Solution**:
- Make sure you entered a keyword
- Click the "Analyze" button
- Check browser console for errors
- Try "food" or "music" for guaranteed results

## Production Deployment

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Output location**: `dist/` folder

3. **Deploy** the `dist` folder to your hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

4. **Environment Variables**: Configure `VITE_API_URL` in your hosting platform's environment settings

## Tips

- Always test with mock data first before connecting the API
- Use browser DevTools to inspect network requests
- Check the console for helpful debug messages
- The app shows loading states during API calls
- Error messages appear in red boxes below the search bar

## Support

For issues or questions:
1. Check this guide
2. Review `README.md`
3. Check `API_CONTRACT.md` for API details
4. Inspect browser console for errors
