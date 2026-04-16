import { useState, useMemo, useCallback } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { MatchCard } from '@/components/MatchCard';
import { SummaryStats } from '@/components/SummaryStats';
import { generateMockDataset, extractWindows, type PatternWindow } from '@/lib/mockData';
import { extractPatternFromImage } from '@/lib/imageExtractor';
import { dtwDistance, similarityScore } from '@/lib/dtw';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOP_N = 10;

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{ window: PatternWindow; score: number }[] | null>(null);

  const windows = useMemo(() => {
    const dataset = generateMockDataset();
    return extractWindows(dataset);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true);
    setResults(null);

    try {
      const userPattern = await extractPatternFromImage(file);
      const distances = windows.map(w => ({
        window: w,
        distance: dtwDistance(userPattern, w.pattern),
      }));

      const maxDist = Math.max(...distances.map(d => d.distance), 1);
      distances.sort((a, b) => a.distance - b.distance);
      const topMatches = distances.slice(0, TOP_N).map(d => ({
        window: d.window,
        score: similarityScore(d.distance, maxDist),
      }));

      setResults(topMatches);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [file, windows]);

  const smallCap = results?.filter(r => r.window.marketCap === 'small') ?? [];
  const largeCap = results?.filter(r => r.window.marketCap === 'large') ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Pattern Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground">Bir hisse grafiği yükleyin — benzer tarihsel pattern'leri ve ileri fiyat hareketlerini görün</p>
        </div>

        <div className="mx-auto mb-8 max-w-md">
          <ImageUpload onFileSelect={setFile} onAnalyze={handleAnalyze} isAnalyzing={analyzing} selectedFile={file} />
        </div>

        {analyzing && <p className="text-center text-sm text-muted-foreground animate-pulse">{windows.length} pattern penceresi taranıyor...</p>}

        {results && (
          <div className="space-y-6">
            <SummaryStats matches={results} />

            <Card>
              <CardHeader><CardTitle>Küçük Hacim / Küçük Boyutlu Hisseler</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {smallCap.length > 0 ? smallCap.map((r, i) => <MatchCard key={`${r.window.ticker}-${r.window.startIdx}`} match={r.window} score={r.score} rank={i + 1} />) : <p className="text-sm text-muted-foreground">Kayıt yok</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Büyük Hacim / Büyük Boyutlu Hisseler</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {largeCap.length > 0 ? largeCap.map((r, i) => <MatchCard key={`${r.window.ticker}-${r.window.startIdx}`} match={r.window} score={r.score} rank={i + 1} />) : <p className="text-sm text-muted-foreground">Kayıt yok</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
