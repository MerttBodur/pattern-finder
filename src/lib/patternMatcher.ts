import { dtwDistance, similarityScore } from './dtw';
import type { OhlcBar } from './api';

export interface PatternWindow {
  ticker: string;
  startIdx: number;
  pattern: number[];
  ohlcBars: OhlcBar[];
  forwardPrices: number[];
  forwardDates: string[];
  forwardReturns: { day5: number; day10: number; day20: number };
  avgVolume: number;
  avgPrice: number;
  marketCap: 'small' | 'large';
}

export function normalizePattern(prices: number[]): number[] {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return prices.map(p => (p - min) / range);
}

export function extractPatternWindows(
  allHistory: Record<string, OhlcBar[]>,
  largeCap: string[],
  smallCap: string[],
  windowSize = 30,
  forwardDays = 20,
): PatternWindow[] {
  const windows: PatternWindow[] = [];
  const largeSet = new Set(largeCap);

  for (const [ticker, bars] of Object.entries(allHistory)) {
    if (bars.length < windowSize + forwardDays + 1) continue;
    const closes = bars.map(b => b.close);
    const volumes = bars.map(b => b.volume);
    const marketCap: 'small' | 'large' = largeSet.has(ticker) ? 'large' : 'small';
    const maxStart = bars.length - windowSize - forwardDays;

    for (let start = 0; start <= maxStart; start += 5) {
      const slice = closes.slice(start, start + windowSize);
      const forward = closes.slice(start + windowSize, start + windowSize + forwardDays);
      const forwardDates = bars.slice(start + windowSize, start + windowSize + forwardDays).map(b => b.date);
      const volumeSlice = volumes.slice(start, start + windowSize);
      const basePrice = slice[slice.length - 1];

      windows.push({
        ticker,
        startIdx: start,
        pattern: normalizePattern(slice),
        ohlcBars: bars.slice(start, start + windowSize),
        forwardPrices: forward,
        forwardDates,
        forwardReturns: {
          day5: forward.length >= 5 ? ((forward[4] - basePrice) / basePrice) * 100 : 0,
          day10: forward.length >= 10 ? ((forward[9] - basePrice) / basePrice) * 100 : 0,
          day20: forward.length >= 20 ? ((forward[19] - basePrice) / basePrice) * 100 : 0,
        },
        avgVolume: volumeSlice.reduce((a, b) => a + b, 0) / volumeSlice.length,
        avgPrice: slice.reduce((a, b) => a + b, 0) / slice.length,
        marketCap,
      });
    }
  }

  return windows;
}

export function findTopMatches(
  queryPattern: number[],
  windows: PatternWindow[],
  topN = 10,
): { window: PatternWindow; score: number }[] {
  const distances = windows.map(w => ({
    window: w,
    distance: dtwDistance(queryPattern, w.pattern),
  }));
  const maxDist = Math.max(...distances.map(d => d.distance), 1);
  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, topN).map(d => ({
    window: d.window,
    score: similarityScore(d.distance, maxDist),
  }));
}
