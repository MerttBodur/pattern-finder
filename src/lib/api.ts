import { generateMockDataset } from './mockData';

export interface OhlcBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BistTickers {
  large: string[];
  small: string[];
}

// Generate ISO dates ending today, going back N business days
function generateDates(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split('T')[0]);
    }
    d.setDate(d.getDate() - 1);
  }
  return dates.reverse();
}

let cachedTickers: BistTickers | null = null;
let cachedHistory: Record<string, OhlcBar[]> | null = null;

function buildCache() {
  if (cachedHistory && cachedTickers) return;
  const dataset = generateMockDataset();
  const history: Record<string, OhlcBar[]> = {};
  const large: string[] = [];
  const small: string[] = [];

  for (const series of dataset) {
    const ticker = `${series.ticker}.IS`;
    const dates = generateDates(series.bars.length);
    history[ticker] = series.bars.map((bar, i) => ({
      ...bar,
      date: dates[i],
    }));
    if (series.marketCap === 'large') large.push(ticker);
    else small.push(ticker);
  }

  cachedHistory = history;
  cachedTickers = { large, small };
}

export async function fetchTickers(): Promise<BistTickers> {
  buildCache();
  return cachedTickers!;
}

export async function fetchStockHistory(ticker: string): Promise<OhlcBar[]> {
  buildCache();
  const bars = cachedHistory![ticker];
  if (!bars) throw new Error(`${ticker} verisi bulunamadı`);
  return bars.filter(b => b.close != null);
}

export async function fetchAllHistory(): Promise<Record<string, OhlcBar[]>> {
  buildCache();
  return cachedHistory!;
}
