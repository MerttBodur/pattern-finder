import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { PatternWindow } from '@/lib/patternMatcher';

interface MatchCardProps {
  match: PatternWindow;
  score: number;
  rank: number;
}

export function MatchCard({ match, score, rank }: MatchCardProps) {
  const patternData = match.pattern.map((v, i) => ({
    day: i + 1,
    value: Math.round(v * 100) / 100,
    date: match.ohlcBars[i]?.date?.slice(0, 10) ?? '',
  }));

  const forwardData = match.forwardPrices.map((price, i) => ({
    day: i + 1,
    price: Math.round(price * 100) / 100,
    date: match.forwardDates[i]?.slice(0, 10) ?? '',
  }));

  const volumeData = match.ohlcBars.map((bar, i) => ({
    day: i + 1,
    volume: bar.volume,
  }));

  const day20Return = match.forwardReturns.day20;
  const returnColor = day20Return >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)';
  const tickerName = match.ticker.replace('.IS', '');

  return (
    <Card className="overflow-hidden" data-testid={`card-match-${rank}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            #{rank} — {tickerName}
          </CardTitle>
          <Badge variant={score >= 80 ? 'default' : 'secondary'}>%{score} benzerlik</Badge>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{match.ohlcBars[0]?.date?.slice(0, 10)} – {match.ohlcBars[match.ohlcBars.length - 1]?.date?.slice(0, 10)}</span>
          <span>•</span>
          <span>Ort. hacim: {(match.avgVolume / 1_000_000).toFixed(1)}M</span>
          <span>•</span>
          <span>{match.marketCap === 'large' ? 'Büyük Cap' : 'Küçük Cap'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Eşleşen Pattern (normalize)</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patternData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                />
                <XAxis dataKey="day" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => [v.toFixed(3), 'Normalize']}
                  labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.date ?? ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">İleri Fiyat Hareketi (20 gün)</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forwardData}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={returnColor}
                  strokeWidth={1.5}
                  dot={false}
                />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => [`₺${v.toFixed(2)}`, 'Kapanış']}
                  labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.date ?? ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Hacim İndikatörü</p>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Bar dataKey="volume" fill="hsl(var(--secondary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: '5 Gün', val: match.forwardReturns.day5 },
            { label: '10 Gün', val: match.forwardReturns.day10 },
            { label: '20 Gün', val: match.forwardReturns.day20 },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-md bg-muted p-2" data-testid={`return-${label}`}>
              <p className="text-muted-foreground">{label}</p>
              <p className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {val >= 0 ? '+' : ''}
                {val.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
