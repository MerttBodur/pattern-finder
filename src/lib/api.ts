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

export async function fetchTickers(): Promise<BistTickers> {
  const res = await fetch('/api/tickers');
  if (!res.ok) throw new Error('Ticker listesi alınamadı');
  return res.json();
}

export async function fetchStockHistory(ticker: string): Promise<OhlcBar[]> {
  const res = await fetch(`/api/stock/${encodeURIComponent(ticker)}/history`);
  if (!res.ok) throw new Error(`${ticker} verisi alınamadı`);
  const data = await res.json();
  return (data as OhlcBar[]).filter(b => b.close != null);
}

export async function fetchAllHistory(): Promise<Record<string, OhlcBar[]>> {
  const res = await fetch('/api/all-history');
  if (!res.ok) throw new Error('Toplu veri alınamadı');
  const data = await res.json() as Record<string, OhlcBar[]>;
  const result: Record<string, OhlcBar[]> = {};
  for (const [ticker, bars] of Object.entries(data)) {
    result[ticker] = bars.filter(b => b.close != null);
  }
  return result;
}
