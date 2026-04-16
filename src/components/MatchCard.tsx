import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { Maximize2 } from 'lucide-react';
import type { PatternWindow } from '@/lib/patternMatcher';
import { ChartModal } from './ChartModal';

interface MatchCardProps {
  match: PatternWindow;
  score: number;
  rank: number;
  fullBars?: import('@/lib/api').OhlcBar[];
}

export function MatchCard({ match, score, rank, fullBars = [] }: MatchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const patternData = match.pattern.map((v, i) => ({
    day: i + 1,
    value: Math.round(v * 100) / 100,
    date: match.ohlcBars[i]?.date?.slice(0, 10) ?? '',
  }));

  const volumeData = match.ohlcBars.map((bar, i) => ({
    day: i + 1,
    volume: bar.volume,
  }));

  const day20Return = match.forwardReturns.day20;
  const returnColor = day20Return >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)';
  const tickerName = match.ticker.replace('.IS', '');

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
        data-testid={`card-match-${rank}`}
        onClick={() => setModalOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">
              #{rank} — {tickerName}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Badge variant={score >= 80 ? 'default' : 'secondary'}>%{score} benzerlik</Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={e => { e.stopPropagation(); setModalOpen(true); }}
                data-testid={`btn-expand-${rank}`}
                title="Tam ekran görüntüle"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              {match.ohlcBars[0]?.date?.slice(0, 10)} –{' '}
              {match.ohlcBars[match.ohlcBars.length - 1]?.date?.slice(0, 10)}
            </span>
            <span>•</span>
            <span>{match.marketCap === 'large' ? 'Büyük Cap' : 'Küçük Cap'}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Normalized pattern preview */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Eşleşen Pattern</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patternData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <XAxis dataKey="day" hide />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                    formatter={(v: number) => [v.toFixed(3), 'Normalize']}
                    labelFormatter={(_: any, payload: any) =>
                      payload?.[0]?.payload?.date ?? ''
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume mini */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Hacim</p>
            <div className="h-14">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Bar
                    dataKey="volume"
                    fill="hsl(var(--secondary))"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Returns */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
            {[
              { label: '5G', val: match.forwardReturns.day5 },
              { label: '10G', val: match.forwardReturns.day10 },
              { label: '20G', val: match.forwardReturns.day20 },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-md bg-muted p-1.5" data-testid={`return-${label}`}>
                <p className="text-muted-foreground">{label}</p>
                <p
                  className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-destructive'}`}
                >
                  {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            Tam ekran için tıklayın • Mum grafiği desteklenir
          </p>
        </CardContent>
      </Card>

      <ChartModal
        match={match}
        score={score}
        rank={rank}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullBars={fullBars}
      />
    </>
  );
}
