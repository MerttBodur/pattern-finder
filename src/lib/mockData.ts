// Generate synthetic stock price data using random walk

export interface StockSeries {
  ticker: string;
  prices: number[];
  volume: number[];
  marketCap: 'small' | 'large';
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateRandomWalk(seed: number, days: number, startPrice: number): number[] {
  const rand = seededRandom(seed);
  const prices: number[] = [startPrice];
  for (let i = 1; i < days; i++) {
    const drift = (rand() - 0.48) * 0.03;
    const vol = (rand() - 0.5) * 0.04;
    prices.push(Math.max(1, prices[i - 1] * (1 + drift + vol)));
  }
  return prices.map(p => Math.round(p * 100) / 100);
}

function generateVolume(seed: number, days: number, base: number): number[] {
  const rand = seededRandom(seed);
  return Array.from({ length: days }, () => Math.round(base * (0.6 + rand() * 0.8)));
}

const TICKERS = [
  'AAPL','MSFT','GOOG','AMZN','META','TSLA','NVDA','JPM','V','JNJ',
  'WMT','PG','MA','UNH','HD','DIS','BAC','ADBE','CRM','NFLX',
  'CMCSA','XOM','T','VZ','INTC','CSCO','PFE','ABT','PEP','KO',
  'MRK','TMO','AVGO','COST','NKE','LLY','DHR','TXN','MDT','UNP',
  'NEE','PM','RTX','HON','LOW','AMGN','IBM','SBUX','CVX','GS',
  'BLK','CAT','DE','MMM','BA','GE','AXP','SPGI','ISRG','GILD',
  'MDLZ','BKNG','TGT','SYK','REGN','ZTS','ADI','LRCX','MU','KLAC',
  'SNPS','CDNS','MRVL','FTNT','PANW','DDOG','CRWD','ZS','NET','SNOW',
  'SQ','SHOP','MELI','SE','PINS','SNAP','RBLX','U','COIN','HOOD',
  'PLTR','SOFI','AFRM','UPST','LCID','RIVN','NIO','XPEV','LI','GRAB'
];

export function generateMockDataset(): StockSeries[] {
  return TICKERS.map((ticker, i) => {
    const marketCap: 'small' | 'large' = i < 50 ? 'large' : 'small';
    const baseVolume = marketCap === 'large' ? 12_000_000 + i * 120_000 : 900_000 + i * 35_000;
    return {
      ticker,
      prices: generateRandomWalk(i * 137 + 42, 120, 50 + (i % 10) * 30),
      volume: generateVolume(i * 911 + 19, 120, baseVolume),
      marketCap,
    };
  });
}

export interface PatternWindow {
  ticker: string;
  startIdx: number;
  pattern: number[];
  forwardPrices: number[];
  forwardReturns: { day5: number; day10: number; day20: number };
  avgVolume: number;
  avgPrice: number;
  marketCap: 'small' | 'large';
}

function normalizePattern(prices: number[]): number[] {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return prices.map(p => (p - min) / range);
}

export function extractWindows(dataset: StockSeries[], windowSize = 30, forwardDays = 20): PatternWindow[] {
  const windows: PatternWindow[] = [];
  for (const series of dataset) {
    const maxStart = series.prices.length - windowSize - forwardDays;
    for (let start = 0; start <= maxStart; start += 5) {
      const slice = series.prices.slice(start, start + windowSize);
      const forward = series.prices.slice(start + windowSize, start + windowSize + forwardDays);
      const volumeSlice = series.volume.slice(start, start + windowSize);
      const basePrice = slice[slice.length - 1];
      windows.push({
        ticker: series.ticker,
        startIdx: start,
        pattern: normalizePattern(slice),
        forwardPrices: forward,
        forwardReturns: {
          day5: forward.length >= 5 ? ((forward[4] - basePrice) / basePrice) * 100 : 0,
          day10: forward.length >= 10 ? ((forward[9] - basePrice) / basePrice) * 100 : 0,
          day20: forward.length >= 20 ? ((forward[19] - basePrice) / basePrice) * 100 : 0,
        },
        avgVolume: volumeSlice.reduce((a, b) => a + b, 0) / volumeSlice.length,
        avgPrice: slice.reduce((a, b) => a + b, 0) / slice.length,
        marketCap: series.marketCap,
      });
    }
  }
  return windows;
}
