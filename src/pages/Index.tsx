import { useState, useMemo, useCallback, useEffect } from 'react';
import { MatchCard } from '@/components/MatchCard';
import { SummaryStats } from '@/components/SummaryStats';
import { StockSelector } from '@/components/StockSelector';
import { fetchTickers, fetchAllHistory, type OhlcBar } from '@/lib/api';
import {
  extractPatternWindows,
  findSplitMatches,
  type PatternWindow,
  type SplitMatches,
} from '@/lib/patternMatcher';
import { TrendingUp, Loader2, Clock, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Match = { window: PatternWindow; score: number };

const PERIOD_OPTIONS = [
  { label: 'Yalnızca aynı dönem', value: '0' },
  { label: 'Son 1 ay', value: '30' },
  { label: 'Son 3 ay', value: '90' },
  { label: 'Son 6 ay', value: '180' },
  { label: 'Son 1 yıl', value: '365' },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function ResultSection({
  title,
  icon,
  matches,
  badge,
  badgeVariant = 'default',
  emptyMsg,
}: {
  title: string;
  icon: React.ReactNode;
  matches: Match[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
  emptyMsg: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {matches.length} sonuç
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((r, i) => (
              <MatchCard
                key={`${r.window.ticker}-${r.window.startIdx}`}
                match={r.window}
                score={r.score}
                rank={i + 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const { toast } = useToast();

  const [largeCap, setLargeCap] = useState<string[]>([]);
  const [smallCap, setSmallCap] = useState<string[]>([]);
  const [allHistory, setAllHistory] = useState<Record<string, OhlcBar[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<SplitMatches | null>(null);
  const [queryDates, setQueryDates] = useState<{ start: string; end: string } | null>(null);

  // Period filter: how many days back from query start counts as "güncel"
  const [periodDays, setPeriodDays] = useState('0');

  useEffect(() => {
    async function load() {
      try {
        const [tickers, history] = await Promise.all([fetchTickers(), fetchAllHistory()]);
        setLargeCap(tickers.large);
        setSmallCap(tickers.small);
        setAllHistory(history);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setHistoryError(msg);
        toast({ title: 'Veri yüklenemedi', description: msg, variant: 'destructive' });
      } finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, []);

  const patternWindows = useMemo(() => {
    if (!largeCap.length || !smallCap.length || !Object.keys(allHistory).length) return [];
    return extractPatternWindows(allHistory, largeCap, smallCap);
  }, [allHistory, largeCap, smallCap]);

  const handleAnalyze = useCallback(
    async (
      ticker: string,
      pattern: number[],
      _windowStart: number,
      startDate: string,
      endDate: string,
    ) => {
      if (!patternWindows.length) {
        toast({ title: 'Veri hazır değil', description: 'Lütfen bekleyin.', variant: 'destructive' });
        return;
      }

      setAnalyzing(true);
      setResults(null);
      setQueryDates({ start: startDate, end: endDate });

      try {
        await new Promise(r => setTimeout(r, 10));

        const windowsExcludingSelf = patternWindows.filter(w => w.ticker !== ticker);

        // cutoff: how far back from query start is still "güncel"
        const days = parseInt(periodDays, 10);
        const cutoff = days === 0 ? startDate : subtractDays(startDate, days);

        const splitMatches = findSplitMatches(
          pattern,
          windowsExcludingSelf,
          startDate,
          endDate,
          cutoff,
          10,
        );

        setResults(splitMatches);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: 'Analiz hatası', description: msg, variant: 'destructive' });
      } finally {
        setAnalyzing(false);
      }
    },
    [patternWindows, periodDays, toast],
  );

  const allMatches = results ? [...results.current, ...results.historical] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">BIST Pattern Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerçek Yahoo Finance verileriyle BIST hisselerinde tarihsel pattern eşleştirmesi
          </p>
        </div>

        {loadingHistory ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">BIST hisse verileri Yahoo Finance'tan yükleniyor...</p>
            <p className="text-xs text-muted-foreground/60">
              50 hisse için geçmiş veri çekiliyor, bu 30-60 saniye sürebilir.
            </p>
          </div>
        ) : historyError ? (
          <div className="py-12 text-center">
            <p className="text-sm text-destructive">Veri yükleme hatası: {historyError}</p>
            <p className="mt-2 text-xs text-muted-foreground">Backend'in çalıştığından emin olun.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Period filter + StockSelector */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="text-sm font-medium whitespace-nowrap">Dönem Filtresi:</span>
                <Select value={periodDays} onValueChange={setPeriodDays}>
                  <SelectTrigger className="w-52" data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {periodDays === '0'
                    ? 'Yalnızca seçili dönemle örtüşen hisseler "Güncel" sayılır'
                    : `Seçili dönemin ${periodDays} gün öncesine kadar olan eşleşmeler "Güncel" sayılır`}
                </p>
              </div>

              <StockSelector
                largeCap={largeCap}
                smallCap={smallCap}
                stockHistory={allHistory}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzing}
                isLoadingHistory={loadingHistory}
              />
            </div>

            {analyzing && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {patternWindows.length.toLocaleString()} pattern penceresi taranıyor...
              </div>
            )}

            {results && queryDates && (
              <div className="space-y-6">
                {/* Summary across all matches */}
                {allMatches.length > 0 && <SummaryStats matches={allMatches} />}

                {/* Query info banner */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2 text-sm">
                  <span className="font-medium">Seçili dönem:</span>
                  <Badge variant="outline">
                    {queryDates.start} → {queryDates.end}
                  </Badge>
                  <span className="text-muted-foreground">
                    · {results.current.length} güncel eşleşme · {results.historical.length} geçmiş eşleşme
                  </span>
                </div>

                {/* Güncel trend gösterenler */}
                <ResultSection
                  title="Güncel Trend Gösterenler"
                  icon={<Clock className="h-4 w-4 text-green-600" />}
                  matches={results.current}
                  badge="Aynı dönem"
                  badgeVariant="default"
                  emptyMsg={`${queryDates.start} – ${queryDates.end} döneminde bu pattern'i sergileyen başka hisse bulunamadı.`}
                />

                {/* Geçmiş trend gösterenler */}
                <ResultSection
                  title="Geçmiş Trend Gösterenler"
                  icon={<History className="h-4 w-4 text-blue-500" />}
                  matches={results.historical}
                  badge="Tarihsel"
                  badgeVariant="secondary"
                  emptyMsg="Geçmişte bu pattern'i gösteren hisse bulunamadı."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
