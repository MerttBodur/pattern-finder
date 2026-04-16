# Stock Pattern Scanner

A web application that lets users upload a stock chart image, extracts the price pattern from it, and compares it against historical data using Dynamic Time Warping (DTW) to find similar historical patterns and predict potential future price movements.

## Tech Stack

- **React 18** with TypeScript
- **Vite** (SWC) as build tool
- **Tailwind CSS** + **shadcn/ui** components
- **Recharts** for data visualization
- **TanStack Query** for data fetching/state management
- **React Router DOM** v6 for routing

## Project Structure

- `src/pages/Index.tsx` — Main page, orchestrates scanning logic
- `src/components/ImageUpload.tsx` — Handles chart image upload
- `src/components/MatchCard.tsx` — Displays a matched historical pattern with charts
- `src/components/SummaryStats.tsx` — Shows aggregated stats across all matches
- `src/lib/dtw.ts` — Dynamic Time Warping algorithm for pattern comparison
- `src/lib/imageExtractor.ts` — Canvas-based extraction of price points from images
- `src/lib/mockData.ts` — Synthetic stock dataset with sliding window generation

## Running the App

```bash
npm run dev
```

Runs on port 5000 (Replit webview).

## Deployment

This is a static frontend app. Build with:

```bash
npm run build
```

Output goes to `dist/`.
