# AI-Mastercard Frontend

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## How It Works

1. **Enter a Keyword**: Type a keyword like "food", "music", "travel", or "fashion"
2. **View Results**: The app displays 3 trending topics with detailed campaign ideas
3. **Select Topics**: Click on cards to select/deselect topics for your report
4. **Download PDF**: Click "Download PDF Report" to generate a professional PDF

## API Integration Guide

The app is currently using mock data. To integrate your own backend API:

### Step 1: Set Up Environment Variable

Create a `.env` file in the project root:

```env
VITE_API_URL=https://your-api-endpoint.com
```

### Step 2: Update API Endpoint

The API service is located at `src/services/api.ts`. Your backend should implement this endpoint:

**Endpoint**: `POST /trending-topics`

**Request Body**:
```json
{
  "keyword": "food"
}
```

**Response Format**:
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
    }
  ]
}
```

### Step 3: API Integration Details

The app automatically falls back to mock data if:
- The API endpoint is not configured
- The API request fails
- The network is unavailable

To disable mock data fallback, modify `src/services/api.ts`:

```typescript
export const getTrendingTopics = async (keyword: string): Promise<TrendingTopicsResponse> => {
  const response = await axios.post<TrendingTopicsResponse>(
    `${API_BASE_URL}/trending-topics`,
    { keyword },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return response.data;
};
```

### Step 4: Authentication (Optional)

If your API requires authentication, add headers in `src/services/api.ts`:

```typescript
const response = await axios.post<TrendingTopicsResponse>(
  `${API_BASE_URL}/trending-topics`,
  { keyword },
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_API_KEY}`,
    },
    timeout: 10000,
  }
);
```

## Project Structure

```
src/
├── components/
│   └── CampaignCard.tsx      # Campaign topic card component
├── services/
│   └── api.ts                # API service with mock data
├── utils/
│   └── pdfGenerator.ts       # PDF generation logic
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## Mock Data

The app includes comprehensive mock data for two keywords:
- **food**: 3 trending topics related to food and dining
- **music**: 3 trending topics related to music and entertainment

Any other keyword will default to the food data.

## PDF Report Format

The generated PDF includes:
- Mastercard branding header
- One page per selected topic
- Trend score and category
- Campaign title and description
- Target audience details
- Key messaging
- Campaign tactics
- Expected outcomes
- Professional formatting and layout

## Customization

### Adding More Mock Data

Edit `src/services/api.ts` and add new entries to the `MOCK_DATA` object:

```typescript
const MOCK_DATA: Record<string, CampaignTopic[]> = {
  food: [...],
  music: [...],
  travel: [
    // Add your travel-related topics here
  ]
};
```

### Styling

The app uses Tailwind CSS. Modify styles in:
- Component files for component-specific styles
- `tailwind.config.js` for theme customization
- `src/index.css` for global styles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - Mastercard Internal Use Only
