# BIST Pattern Scanner

A web application that fetches real BIST stock data from Yahoo Finance, lets users select a ticker and a 30-day window from its price chart, then compares that pattern against all other BIST stocks' history using Dynamic Time Warping (DTW) to find the top 10 most similar historical patterns and their forward returns.

## Tech Stack

- **React 18** with TypeScript (frontend, port 5000)
- **Express.js** with TypeScript (backend, port 3001)
- **yahoo-finance2** v3 for real BIST OHLC data
- **Vite** (SWC) as frontend build tool
- **Tailwind CSS** + **shadcn/ui** components
- **Recharts** for price, pattern, and volume charts
- **Dynamic Time Warping (DTW)** for pattern similarity scoring
- **React Router DOM** v6 for routing

## Project Structure

- `server/index.ts` — Express backend, fetches Yahoo Finance data for 50 BIST tickers
- `src/lib/api.ts` — Frontend fetch functions (tickers, single stock history, all history)
- `src/lib/patternMatcher.ts` — Extracts sliding pattern windows, runs DTW comparison
- `src/lib/dtw.ts` — Dynamic Time Warping algorithm
- `src/pages/Index.tsx` — Main page, orchestrates data loading and analysis
- `src/components/StockSelector.tsx` — Stock picker, chart display, window slider
- `src/components/MatchCard.tsx` — Displays a matched pattern with charts and returns
- `src/components/SummaryStats.tsx` — Aggregated return stats across all matches

## BIST Tickers

### Large Cap (30)
THYAO, EREGL, TUPRS, AKBNK, GARAN, ISCTR, KRDMD, SISE, ARCLK, KOZAL, BIMAS, TOASO, EKGYO, ASELS, FROTO, YKBNK, VAKBN, HALKB, PGSUS, TCELL, KCHOL, SAHOL, TTKOM, AEFES, ENKAI, OTKAR, DOHOL, CCOLA, VESTL, KARSN

### Small Cap (20)
LOGO, NETAS, ALARK, TATGD, CIMSA, PETKM, MGROS, BRYAT, ENJSA, AYGAZ, SELGD, ALBRK, BIOEN, BANVT, DOAS, ULKER, VESBE, MAVI, ISFIN, GWIND

## Running the App

Two workflows must run simultaneously:

```bash
# Backend (port 3001)
npx tsx server/index.ts

# Frontend (port 5000)
npm run dev
```

The frontend proxies `/api` requests to the backend via Vite config.

## User Flow

1. App loads → fetches 3 years of OHLC data for all 50 BIST tickers from Yahoo Finance (~30-60s)
2. User selects a BIST ticker from dropdown
3. User sees the ticker's price history chart
4. User drags a slider to select a 30-day pattern window (highlighted on chart)
5. User clicks "Benzer Patternleri Tara"
6. DTW comparison runs against all historical windows (~thousands of comparisons)
7. Top 10 matches shown, split into Small Cap and Large Cap sections
8. Each match card shows: pattern chart, forward price movement (20 days), volume indicator, 5/10/20-day returns
