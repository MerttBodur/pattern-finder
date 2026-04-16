import { Card, CardContent } from '@/components/ui/card';
import type { PatternWindow } from '@/lib/patternMatcher';

interface SummaryStatsProps {
  matches: { window: PatternWindow; score: number }[];
}

export function SummaryStats({ matches }: SummaryStatsProps) {
  const avg = (key: 'day5' | 'day10' | 'day20') => {
    const sum = matches.reduce((acc, m) => acc + m.window.forwardReturns[key], 0);
    return sum / matches.length;
  };

  const avgScore = matches.reduce((acc, m) => acc + m.score, 0) / matches.length;

  const stats = [
    { label: 'Ort. Benzerlik', value: `%${avgScore.toFixed(0)}` },
    { label: 'Ort. 5G Getiri', value: `${avg('day5') >= 0 ? '+' : ''}${avg('day5').toFixed(1)}%`, positive: avg('day5') >= 0 },
    { label: 'Ort. 10G Getiri', value: `${avg('day10') >= 0 ? '+' : ''}${avg('day10').toFixed(1)}%`, positive: avg('day10') >= 0 },
    { label: 'Ort. 20G Getiri', value: `${avg('day20') >= 0 ? '+' : ''}${avg('day20').toFixed(1)}%`, positive: avg('day20') >= 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(s => (
        <Card key={s.label} data-testid={`stat-${s.label}`}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p
              className={`text-lg font-bold ${
                s.positive !== undefined
                  ? s.positive
                    ? 'text-green-600'
                    : 'text-destructive'
                  : ''
              }`}
            >
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
