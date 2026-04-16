import { useState, useMemo, useCallback } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { MatchCard } from '@/components/MatchCard';
import { SummaryStats } from '@/components/SummaryStats';
import { generateMockDataset, extractWindows, type PatternWindow } from '@/lib/mockData';
import { extractPatternFromImage } from '@/lib/imageExtractor';
import { dtwDistance, similarityScore } from '@/lib/dtw';
import { TrendingUp } from 'lucide-react';

const TOP_N = 5;

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{ window: PatternWindow; score: number }[] | null>(null);

  // Pre-compute dataset and windows once
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

      // Compute DTW distances
      const distances = windows.map(w => ({
        window: w,
        distance: dtwDistance(userPattern, w.pattern),
      }));

      // Find max distance for score normalization
      const maxDist = Math.max(...distances.map(d => d.distance), 1);

      // Sort by distance ascending, take top N
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Pattern Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Bir hisse grafiği yükleyin — benzer tarihsel pattern'leri ve ileri fiyat hareketlerini görün
          </p>
        </div>

        {/* Upload Section */}
        <div className="mx-auto mb-8 max-w-md">
          <ImageUpload
            onFileSelect={setFile}
            onAnalyze={handleAnalyze}
            isAnalyzing={analyzing}
            selectedFile={file}
          />
        </div>

        {/* Results */}
        {analyzing && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            {windows.length} pattern penceresi taranıyor...
          </p>
        )}

        {results && (
          <div className="space-y-6">
            <SummaryStats matches={results} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => (
                <MatchCard key={`${r.window.ticker}-${r.window.startIdx}`} match={r.window} score={r.score} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
