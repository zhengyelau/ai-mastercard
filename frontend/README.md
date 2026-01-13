# AI-Mastercard Frontend

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#development)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

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
