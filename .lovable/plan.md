
# Stock Pattern Similarity Scanner (MVP)

## Overview
Single-page React app that accepts a stock chart screenshot, extracts the price pattern from the image, finds similar patterns in a local historical dataset, and displays forward price performance for each match.

## Architecture (All Client-Side)

### 1. Mock Historical Dataset
- Bundle ~100 synthetic/mock stock price series as JSON (daily OHLC, 120 days each)
- Pre-compute normalized pattern representations for sliding windows (e.g., 30-day windows)

### 2. Image Upload & Pattern Extraction
- Drag-and-drop / click-to-upload image area (PNG/JPG)
- Use Canvas API to:
  - Convert image to grayscale
  - Detect the dominant line/curve (edge detection + column-wise sampling)
  - Normalize extracted points into a fixed-length time series (e.g., 30 points)

### 3. Similarity Matching
- Compare extracted pattern against all pre-computed windows using **DTW (Dynamic Time Warping)**
- Rank by similarity score, return top 5 matches

### 4. Results UI
- For each match, show:
  - Mini line chart of the matched pattern (the window that matched)
  - Similarity score (percentage)
  - Forward performance line chart showing price movement at +5, +10, +20 days after the pattern
- Summary stats: average forward return across all matches

### 5. UI Layout
- Single page with clean layout
- Top: Upload area + "Analyze" button
- Bottom: Results grid with match cards
- Charts via Recharts (already available)

## Technical Notes
- No backend needed — all processing runs in the browser
- DTW implementation: lightweight JS library or custom ~50-line implementation
- Dataset generated via a script producing realistic random-walk price data
- Image processing is approximate (MVP-level) — works best with clean line charts on white backgrounds
