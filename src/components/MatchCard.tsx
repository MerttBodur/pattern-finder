import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PatternWindow } from '@/lib/mockData';

interface MatchCardProps {
  match: PatternWindow;
  score: number;
  rank: number;
}

export function MatchCard({ match, score, rank }: MatchCardProps) {
  const patternData = match.pattern.map((v, i) => ({ day: i + 1, value: Math.round(v * 100) / 100 }));

  const forwardData = match.forwardPrices.map((price, i) => ({
    day: i + 1,
    price: Math.round(price * 100) / 100,
  }));

  const day20Return = match.forwardReturns.day20;
  const returnColor = day20Return >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            #{rank} — {match.ticker}
          </CardTitle>
          <Badge variant={score >= 80 ? 'default' : 'secondary'}>
            %{score} benzerlik
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Gün {match.startIdx + 1}–{match.startIdx + 30} penceresi
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern chart */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Eşleşen Pattern</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patternData}>
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                <XAxis dataKey="day" hide />
                <YAxis hide domain={[0, 1]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forward performance chart */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">İleri Fiyat Hareketi (20 gün)</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forwardData}>
                <Line type="monotone" dataKey="price" stroke={returnColor} strokeWidth={1.5} dot={false} />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => [`$${v}`, 'Fiyat']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forward returns */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: '5 Gün', val: match.forwardReturns.day5 },
            { label: '10 Gün', val: match.forwardReturns.day10 },
            { label: '20 Gün', val: match.forwardReturns.day20 },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-md bg-muted p-2">
              <p className="text-muted-foreground">{label}</p>
              <p className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {val >= 0 ? '+' : ''}{val.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
