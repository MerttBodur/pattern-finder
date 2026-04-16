import { useState, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceArea,
} from 'recharts';
import { BarChart2, TrendingUp } from 'lucide-react';
import type { PatternWindow } from '@/lib/patternMatcher';
import type { OhlcBar } from '@/lib/api';

interface ChartModalProps {
  match: PatternWindow;
  score: number;
  rank: number;
  open: boolean;
  onClose: () => void;
  fullBars?: OhlcBar[];
}

type Range = 'pencere' | '1A' | '3A' | '6A' | '1Y';

const RANGE_DAYS: Record<Range, number | null> = {
  pencere: null,
  '1A': 30,
  '3A': 90,
  '6A': 180,
  '1Y': 365,
};

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ── Pure-SVG Candlestick ────────────────────────────────────────────────────

interface CandleTip {
  bar: OhlcBar;
  clientX: number;
  clientY: number;
  side: 'left' | 'right';
  idx: number;
  total: number;
}

function CandlestickChart({
  bars,
  highlightStart,
  highlightEnd,
}: {
  bars: OhlcBar[];
  highlightStart?: string;
  highlightEnd?: string;
}) {
  const [tip, setTip] = useState<CandleTip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allPrices = bars.flatMap(b => [b.high, b.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const priceRange = maxP - minP || 1;
  const pad = priceRange * 0.06;

  const VW = 700;
  const VH = 260;
  const ML = 58, MR = 12, MT = 10, MB = 28;
  const chartW = VW - ML - MR;
  const chartH = VH - MT - MB;

  const n = bars.length;
  const barSlot = chartW / n;
  const candleW = Math.max(barSlot * 0.55, 1.5);

  const toY = (price: number) =>
    MT + chartH - ((price - (minP - pad)) / (priceRange + 2 * pad)) * chartH;
  const toX = (i: number) => ML + (i + 0.5) * barSlot;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, k) => {
    const frac = k / (tickCount - 1);
    return minP - pad + frac * (priceRange + 2 * pad);
  });

  const xLabelCount = Math.min(6, n);
  const xLabelIdxs = Array.from({ length: xLabelCount }, (_, k) =>
    Math.round((k / (xLabelCount - 1)) * (n - 1)),
  );

  // Highlight zone indices
  const hlStartIdx = highlightStart
    ? bars.findIndex(b => b.date >= highlightStart)
    : -1;
  const hlEndIdx = highlightEnd
    ? bars.findLastIndex(b => b.date <= highlightEnd)
    : -1;
  const hlX1 = hlStartIdx >= 0 ? ML + hlStartIdx * barSlot : null;
  const hlX2 = hlEndIdx >= 0 ? ML + (hlEndIdx + 1) * barSlot : null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height="100%"
        onMouseLeave={() => setTip(null)}
      >
        {/* Highlight background for matched window */}
        {hlX1 !== null && hlX2 !== null && (
          <rect
            x={hlX1}
            y={MT}
            width={hlX2 - hlX1}
            height={chartH}
            fill="hsl(var(--primary))"
            fillOpacity={0.08}
          />
        )}

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={ML}
            x2={VW - MR}
            y1={toY(t)}
            y2={toY(t)}
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
            strokeDasharray="4 3"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={ML - 4}
            y={toY(t) + 4}
            textAnchor="end"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            ₺{t.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabelIdxs.map(idx => (
          <text
            key={idx}
            x={toX(idx)}
            y={VH - 6}
            textAnchor="middle"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            {bars[idx]?.date?.slice(0, 10)}
          </text>
        ))}

        {/* Candles */}
        {bars.map((bar, i) => {
          const isUp = bar.close >= bar.open;
          const color = isUp ? '#22c55e' : '#ef4444';
          const cx = toX(i);
          const highY = toY(bar.high);
          const lowY = toY(bar.low);
          const bodyTop = Math.min(toY(bar.open), toY(bar.close));
          const bodyBot = Math.max(toY(bar.open), toY(bar.close));
          const bodyH = Math.max(bodyBot - bodyTop, 1);

          return (
            <g
              key={i}
              onMouseEnter={e => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTip({
                  bar,
                  clientX: e.clientX - rect.left,
                  clientY: e.clientY - rect.top,
                  side: i > n / 2 ? 'right' : 'left',
                  idx: i,
                  total: n,
                });
              }}
              style={{ cursor: 'crosshair' }}
            >
              <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth={1.2} />
              <rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={color}
                fillOpacity={0.85}
              />
              {/* Wide invisible hit area */}
              <rect
                x={cx - barSlot / 2}
                y={MT}
                width={barSlot}
                height={chartH}
                fill="transparent"
              />
            </g>
          );
        })}

        {/* Axis borders */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + chartH} stroke="hsl(var(--border))" strokeWidth={1} />
        <line x1={ML} y1={MT + chartH} x2={VW - MR} y2={MT + chartH} stroke="hsl(var(--border))" strokeWidth={1} />

        {/* Highlight border lines */}
        {hlX1 !== null && (
          <line x1={hlX1} y1={MT} x2={hlX1} y2={MT + chartH} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="4 2" />
        )}
        {hlX2 !== null && (
          <line x1={hlX2} y1={MT} x2={hlX2} y2={MT + chartH} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="4 2" />
        )}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 rounded border bg-card p-2 text-xs shadow-md"
          style={{
            left: tip.side === 'left' ? tip.clientX + 12 : undefined,
            right: tip.side === 'right' ? `calc(100% - ${tip.clientX - 12}px)` : undefined,
            top: Math.min(tip.clientY, 140),
          }}
        >
          <p className="mb-1 font-semibold">{tip.bar.date?.slice(0, 10)}</p>
          <p>Açılış: <span className="font-medium">₺{tip.bar.open?.toFixed(2)}</span></p>
          <p className="text-green-600">Yüksek: <span className="font-medium">₺{tip.bar.high?.toFixed(2)}</span></p>
          <p className="text-red-500">Düşük: <span className="font-medium">₺{tip.bar.low?.toFixed(2)}</span></p>
          <p className={tip.bar.close >= tip.bar.open ? 'text-green-600' : 'text-red-500'}>
            Kapanış: <span className="font-medium">₺{tip.bar.close?.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Line chart ──────────────────────────────────────────────────────────────

function LineChartView({
  bars,
  highlightStart,
  highlightEnd,
}: {
  bars: OhlcBar[];
  highlightStart?: string;
  highlightEnd?: string;
}) {
  const data = bars.map(b => ({
    date: b.date.slice(0, 10),
    close: b.close,
    high: b.high,
    low: b.low,
  }));

  const prices = data.flatMap(d => [d.high, d.low]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad = (maxP - minP) * 0.05;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          interval={Math.floor(data.length / 5)}
          tickLine={false}
        />
        <YAxis
          domain={[minP - pad, maxP + pad]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `₺${v.toFixed(1)}`}
          width={60}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          formatter={(v: number, name: string) => [
            `₺${v.toFixed(2)}`,
            name === 'close' ? 'Kapanış' : name === 'high' ? 'Yüksek' : 'Düşük',
          ]}
        />
        {highlightStart && highlightEnd && (
          <ReferenceArea
            x1={highlightStart}
            x2={highlightEnd}
            fill="hsl(var(--primary))"
            fillOpacity={0.1}
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeDasharray="4 2"
          />
        )}
        <Line type="monotone" dataKey="high" stroke="#22c55e" strokeWidth={1} dot={false} strokeDasharray="4 3" />
        <Line type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="4 3" />
        <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

export function ChartModal({ match, score, rank, open, onClose, fullBars = [] }: ChartModalProps) {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [range, setRange] = useState<Range>('pencere');

  const tickerName = match.ticker.replace('.IS', '');
  const winStart = match.windowStartDate;
  const winEnd = match.windowEndDate;
  const day20Return = match.forwardReturns.day20;

  // Derive displayed bars based on selected range
  const displayBars = useMemo<OhlcBar[]>(() => {
    if (range === 'pencere' || fullBars.length === 0) return match.ohlcBars;
    const days = RANGE_DAYS[range];
    if (!days) return match.ohlcBars;
    const cutoff = subtractDays(winEnd, days);
    const filtered = fullBars.filter(b => b.date >= cutoff);
    return filtered.length >= 5 ? filtered : match.ohlcBars;
  }, [range, fullBars, match.ohlcBars, winEnd]);

  // Only show highlight when zoomed out beyond the window
  const showHighlight = range !== 'pencere';

  const volumeData = displayBars.map(bar => ({
    date: bar.date.slice(0, 10),
    volume: bar.volume,
    isUp: bar.close >= bar.open,
  }));

  const forwardData = match.forwardPrices.map((price, i) => ({
    date: match.forwardDates[i]?.slice(0, 10) ?? '',
    price,
  }));

  const rangeLabels: { key: Range; label: string }[] = [
    { key: 'pencere', label: '30G' },
    { key: '1A', label: '1A' },
    { key: '3A', label: '3A' },
    { key: '6A', label: '6A' },
    { key: '1Y', label: '1Y' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>#{rank} — {tickerName}</span>
            <Badge variant={score >= 80 ? 'default' : 'secondary'}>%{score} benzerlik</Badge>
            <Badge variant="outline">{match.marketCap === 'large' ? 'Büyük Cap' : 'Küçük Cap'}</Badge>
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {winStart} → {winEnd}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Controls row: chart type + range */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart type */}
            <Button
              size="sm"
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              onClick={() => setChartType('candlestick')}
              data-testid="btn-candlestick"
            >
              <BarChart2 className="mr-1 h-4 w-4" />
              Mum
            </Button>
            <Button
              size="sm"
              variant={chartType === 'line' ? 'default' : 'outline'}
              onClick={() => setChartType('line')}
              data-testid="btn-line"
            >
              <TrendingUp className="mr-1 h-4 w-4" />
              Çizgi
            </Button>

            <div className="mx-1 h-5 w-px bg-border" />

            {/* Time range */}
            {rangeLabels.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={range === key ? 'default' : 'outline'}
                onClick={() => setRange(key)}
                data-testid={`btn-range-${key}`}
                disabled={key !== 'pencere' && fullBars.length === 0}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Main price chart */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Fiyat Grafiği
              {showHighlight && (
                <span className="ml-1 text-primary">
                  · mavi alan = eşleşen pencere ({winStart} → {winEnd})
                </span>
              )}
            </p>
            <div className="relative h-64 rounded-lg border bg-background/50 p-2">
              {chartType === 'candlestick' ? (
                <CandlestickChart
                  bars={displayBars}
                  highlightStart={showHighlight ? winStart : undefined}
                  highlightEnd={showHighlight ? winEnd : undefined}
                />
              ) : (
                <LineChartView
                  bars={displayBars}
                  highlightStart={showHighlight ? winStart : undefined}
                  highlightEnd={showHighlight ? winEnd : undefined}
                />
              )}
            </div>
          </div>

          {/* Volume */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Hacim</p>
            <div className="h-24 rounded-lg border bg-background/50 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 2, right: 8, left: 8, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" hide />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`
                    }
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(v: number) => [`${(v / 1_000_000).toFixed(2)}M`, 'Hacim']}
                    labelFormatter={(l: string) => l}
                  />
                  <Bar dataKey="volume" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    {volumeData.map((d, i) => (
                      <Cell key={i} fill={d.isUp ? '#22c55e88' : '#ef444488'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forward price (only in window mode) */}
          {forwardData.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Sonraki 20 Gün Fiyat Hareketi (pencere sonrası)
              </p>
              <div className="h-40 rounded-lg border bg-background/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forwardData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      interval={Math.floor(forwardData.length / 4)}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => `₺${v.toFixed(1)}`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(v: number) => [`₺${v.toFixed(2)}`, 'Kapanış']}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={day20Return >= 0 ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Returns */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: '5 Gün Getiri', val: match.forwardReturns.day5 },
              { label: '10 Gün Getiri', val: match.forwardReturns.day10 },
              { label: '20 Gün Getiri', val: match.forwardReturns.day20 },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`mt-1 text-xl font-bold ${val >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            <span>Ort. hacim: {(match.avgVolume / 1_000_000).toFixed(2)}M</span>
            <span>•</span>
            <span>Ort. fiyat: ₺{match.avgPrice.toFixed(2)}</span>
            <span>•</span>
            <span>{match.ticker}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
