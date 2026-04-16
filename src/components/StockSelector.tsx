import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { Search } from 'lucide-react';
import type { OhlcBar } from '@/lib/api';
import { normalizePattern } from '@/lib/patternMatcher';

const WINDOW_SIZE = 30;

interface StockSelectorProps {
  largeCap: string[];
  smallCap: string[];
  stockHistory: Record<string, OhlcBar[]>;
  onAnalyze: (
    ticker: string,
    pattern: number[],
    windowStart: number,
    startDate: string,
    endDate: string,
  ) => void;
  isAnalyzing: boolean;
  isLoadingHistory: boolean;
}

export function StockSelector({
  largeCap,
  smallCap,
  stockHistory,
  onAnalyze,
  isAnalyzing,
  isLoadingHistory,
}: StockSelectorProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [windowStart, setWindowStart] = useState(0);

  const bars = selectedTicker ? (stockHistory[selectedTicker] ?? []) : [];

  const chartData = useMemo(
    () =>
      bars.map((b, i) => ({
        idx: i,
        date: b.date.slice(0, 10),
        close: b.close,
      })),
    [bars],
  );

  const maxWindowStart = Math.max(0, bars.length - WINDOW_SIZE);
  const windowEnd = windowStart + WINDOW_SIZE - 1;

  const selectedWindowBars = bars.slice(windowStart, windowStart + WINDOW_SIZE);
  const selectedPattern =
    selectedWindowBars.length === WINDOW_SIZE
      ? normalizePattern(selectedWindowBars.map(b => b.close))
      : null;

  const startDate = bars[windowStart]?.date?.slice(0, 10) ?? '';
  const endDate = bars[windowStart + WINDOW_SIZE - 1]?.date?.slice(0, 10) ?? '';

  function handleTickerChange(ticker: string) {
    setSelectedTicker(ticker);
    // Default to most recent 30-day window
    const tickerBars = stockHistory[ticker] ?? [];
    setWindowStart(Math.max(0, tickerBars.length - WINDOW_SIZE));
  }

  const allTickers = [
    ...largeCap.map(t => ({ ticker: t, cap: 'large' as const })),
    ...smallCap.map(t => ({ ticker: t, cap: 'small' as const })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hisse Seç &amp; Pattern Belirle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Select
              value={selectedTicker}
              onValueChange={handleTickerChange}
              disabled={isLoadingHistory}
            >
              <SelectTrigger data-testid="select-ticker">
                <SelectValue
                  placeholder={
                    isLoadingHistory ? 'Veriler yükleniyor...' : 'Hisse seçin (BIST)'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground">
                  Büyük Cap
                </div>
                {largeCap.map(t => (
                  <SelectItem key={t} value={t} data-testid={`option-${t}`}>
                    {t.replace('.IS', '')}
                    {stockHistory[t] ? ` (${stockHistory[t].length} gün)` : ''}
                  </SelectItem>
                ))}
                <div className="px-2 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                  Küçük Cap
                </div>
                {smallCap.map(t => (
                  <SelectItem key={t} value={t} data-testid={`option-${t}`}>
                    {t.replace('.IS', '')}
                    {stockHistory[t] ? ` (${stockHistory[t].length} gün)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTicker && (
            <Badge variant="outline" className="whitespace-nowrap">
              {allTickers.find(t => t.ticker === selectedTicker)?.cap === 'large'
                ? 'Büyük Cap'
                : 'Küçük Cap'}
            </Badge>
          )}
        </div>

        {selectedTicker && bars.length > 0 && (
          <>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Fiyat Geçmişi — seçili 30 günlük pencere vurgulanmış
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      domain={['auto', 'auto']}
                      width={55}
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `₺${v.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      formatter={(v: number) => [`₺${v.toFixed(2)}`, 'Kapanış']}
                      labelFormatter={(_: any, payload: any) =>
                        payload?.[0]?.payload?.date ?? ''
                      }
                    />
                    <ReferenceArea
                      x1={windowStart}
                      x2={windowEnd}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.15}
                      strokeOpacity={0.5}
                      stroke="hsl(var(--primary))"
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Seçili dönem:
                </p>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {startDate} → {endDate}
                </span>
              </div>
              <Slider
                data-testid="slider-window"
                min={0}
                max={maxWindowStart}
                step={1}
                value={[windowStart]}
                onValueChange={([v]) => setWindowStart(v)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground/60">
                Slider'ı kaydırarak pencereyi ayarlayın ({WINDOW_SIZE} gün sabit)
              </p>
            </div>

            <Button
              data-testid="button-analyze"
              onClick={() =>
                selectedPattern &&
                onAnalyze(selectedTicker, selectedPattern, windowStart, startDate, endDate)
              }
              disabled={!selectedPattern || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                'Analiz ediliyor...'
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Benzer Patternleri Tara ({startDate} – {endDate})
                </>
              )}
            </Button>
          </>
        )}

        {selectedTicker && bars.length === 0 && !isLoadingHistory && (
          <p className="text-sm text-destructive">Bu hisse için veri bulunamadı.</p>
        )}
      </CardContent>
    </Card>
  );
}
