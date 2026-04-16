import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['ripHistorical'] });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const LARGE_CAP_TICKERS = [
  'THYAO.IS', 'EREGL.IS', 'TUPRS.IS', 'AKBNK.IS', 'GARAN.IS',
  'ISCTR.IS', 'KRDMD.IS', 'SISE.IS', 'ARCLK.IS', 'KOZAL.IS',
  'BIMAS.IS', 'TOASO.IS', 'EKGYO.IS', 'ASELS.IS', 'FROTO.IS',
  'YKBNK.IS', 'VAKBN.IS', 'HALKB.IS', 'PGSUS.IS', 'TCELL.IS',
  'KCHOL.IS', 'SAHOL.IS', 'TTKOM.IS', 'AEFES.IS', 'ENKAI.IS',
  'OTKAR.IS', 'DOHOL.IS', 'CCOLA.IS', 'VESTL.IS', 'KARSN.IS',
];

const SMALL_CAP_TICKERS = [
  'LOGO.IS', 'NETAS.IS', 'ALARK.IS', 'TATGD.IS', 'CIMSA.IS',
  'PETKM.IS', 'MGROS.IS', 'BRYAT.IS', 'ENJSA.IS', 'AYGAZ.IS',
  'SELGD.IS', 'ALBRK.IS', 'BIOEN.IS', 'BANVT.IS', 'DOAS.IS',
  'ULKER.IS', 'VESBE.IS', 'MAVI.IS', 'ISFIN.IS', 'GWIND.IS',
];

function getPeriod1() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().split('T')[0];
}

// In-memory cache for all-history (expires every 6 hours)
let allHistoryCache: { data: Record<string, any[]>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function mapQuote(q: any) {
  return {
    date: q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date).slice(0, 10),
    open: q.open ?? q.close,
    high: q.high ?? q.close,
    low: q.low ?? q.close,
    close: q.close,
    volume: q.volume ?? 0,
  };
}

async function fetchHistory(ticker: string) {
  const result = await yf.chart(ticker, {
    period1: getPeriod1(),
    interval: '1d',
  });
  return (result.quotes ?? [])
    .filter((q: any) => q.close != null)
    .map(mapQuote);
}

app.get('/api/tickers', (_req, res) => {
  res.json({ large: LARGE_CAP_TICKERS, small: SMALL_CAP_TICKERS });
});

app.get('/api/stock/:ticker/history', async (req, res) => {
  try {
    const bars = await fetchHistory(req.params.ticker);
    res.json(bars);
  } catch (err) {
    console.error(`Failed to fetch ${req.params.ticker}:`, err);
    res.status(500).json({ error: String(err) });
  }
});

async function buildAllHistory(): Promise<Record<string, any[]>> {
  const allTickers = [...LARGE_CAP_TICKERS, ...SMALL_CAP_TICKERS];
  const results = await Promise.allSettled(allTickers.map(t => fetchHistory(t)));
  const data: Record<string, any[]> = {};
  allTickers.forEach((t, i) => {
    const r = results[i];
    if (r.status === 'fulfilled' && r.value.length > 0) {
      data[t] = r.value;
    } else {
      console.warn(`Skipped ${t}:`, r.status === 'rejected' ? (r.reason?.message ?? r.reason) : 'empty');
    }
  });
  return data;
}

// Warm up cache on start
(async () => {
  console.log('Warming up data cache...');
  try {
    const data = await buildAllHistory();
    allHistoryCache = { data, fetchedAt: Date.now() };
    console.log(`Cache ready: ${Object.keys(data).length} tickers loaded`);
  } catch (err) {
    console.error('Cache warmup failed:', err);
  }
})();

app.get('/api/all-history', async (_req, res) => {
  try {
    const now = Date.now();
    if (allHistoryCache && (now - allHistoryCache.fetchedAt) < CACHE_TTL_MS) {
      return res.json(allHistoryCache.data);
    }
    const data = await buildAllHistory();
    allHistoryCache = { data, fetchedAt: now };
    res.json(data);
  } catch (err) {
    console.error('all-history error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
