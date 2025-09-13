import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressRingChartProps {
  percentage: number;
  title: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  colors?: {
    filled: string;
    empty: string;
  };
  className?: string;
}

export function ProgressRingChart({
  percentage,
  title,
  subtitle,
  size = 200,
  strokeWidth = 12,
  colors = {
    filled: 'hsl(var(--primary))',
    empty: 'hsl(var(--muted))'
  },
  className = ''
}: ProgressRingChartProps) {
  const data = [
    { name: 'Completed', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ];

  const COLORS = [colors.filled, colors.empty];

  return (
    <Card className={`transition-smooth hover:shadow-medium ${className}`}>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative">
          <ResponsiveContainer width={size} height={size}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={size / 2 - strokeWidth * 2}
                outerRadius={size / 2 - strokeWidth}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {Math.round(percentage)}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}