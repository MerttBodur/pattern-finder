import { useState, useMemo, useCallback, useEffect } from 'react';
import { MatchCard } from '@/components/MatchCard';
import { SummaryStats } from '@/components/SummaryStats';
import { StockSelector } from '@/components/StockSelector';
import { fetchTickers, fetchAllHistory, type OhlcBar } from '@/lib/api';
import { extractPatternWindows, findTopMatches, type PatternWindow } from '@/lib/patternMatcher';
import { TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Match = { window: PatternWindow; score: number };

export default function Index() {
  const { toast } = useToast();

  const [largeCap, setLargeCap] = useState<string[]>([]);
  const [smallCap, setSmallCap] = useState<string[]>([]);
  const [allHistory, setAllHistory] = useState<Record<string, OhlcBar[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Match[] | null>(null);

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
    async (ticker: string, pattern: number[], _windowStart: number) => {
      if (!patternWindows.length) {
        toast({ title: 'Veri hazır değil', description: 'Lütfen bekleyin.', variant: 'destructive' });
        return;
      }

      setAnalyzing(true);
      setResults(null);

      try {
        await new Promise(r => setTimeout(r, 10));
        const windowsExcludingSelf = patternWindows.filter(w => w.ticker !== ticker);
        const matches = findTopMatches(pattern, windowsExcludingSelf, 10);
        setResults(matches);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: 'Analiz hatası', description: msg, variant: 'destructive' });
      } finally {
        setAnalyzing(false);
      }
    },
    [patternWindows, toast],
  );

  const smallCapResults = results?.filter(r => r.window.marketCap === 'small') ?? [];
  const largeCapResults = results?.filter(r => r.window.marketCap === 'large') ?? [];

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
            <p className="text-xs text-muted-foreground/60">50 hisse için geçmiş veri çekiliyor, bu 30-60 saniye sürebilir.</p>
          </div>
        ) : historyError ? (
          <div className="py-12 text-center">
            <p className="text-sm text-destructive">Veri yükleme hatası: {historyError}</p>
            <p className="mt-2 text-xs text-muted-foreground">Backend'in çalıştığından emin olun.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <StockSelector
              largeCap={largeCap}
              smallCap={smallCap}
              stockHistory={allHistory}
              onAnalyze={handleAnalyze}
              isAnalyzing={analyzing}
              isLoadingHistory={loadingHistory}
            />

            {analyzing && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {patternWindows.length.toLocaleString()} pattern penceresi taranıyor...
              </div>
            )}

            {results && (
              <div className="space-y-6">
                <SummaryStats matches={results} />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Küçük Cap Eşleşmeler
                      <span className="text-sm font-normal text-muted-foreground">({smallCapResults.length} sonuç)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {smallCapResults.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {smallCapResults.map((r, i) => (
                          <MatchCard
                            key={`${r.window.ticker}-${r.window.startIdx}`}
                            match={r.window}
                            score={r.score}
                            rank={i + 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Bu analiz için küçük cap eşleşmesi yok.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Büyük Cap Eşleşmeler
                      <span className="text-sm font-normal text-muted-foreground">({largeCapResults.length} sonuç)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {largeCapResults.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {largeCapResults.map((r, i) => (
                          <MatchCard
                            key={`${r.window.ticker}-${r.window.startIdx}`}
                            match={r.window}
                            score={r.score}
                            rank={i + 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Bu analiz için büyük cap eşleşmesi yok.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
