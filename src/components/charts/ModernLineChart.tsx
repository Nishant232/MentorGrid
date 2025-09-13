import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModernLineChartProps {
  data: any[];
  title: string;
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  className?: string;
  gradient?: boolean;
}

export function ModernLineChart({
  data,
  title,
  dataKey,
  xAxisKey = 'name',
  color = 'hsl(var(--primary))',
  className = '',
  gradient = true
}: ModernLineChartProps) {
  const gradientId = `gradient-${dataKey}`;

  return (
    <Card className={`transition-smooth hover:shadow-medium ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {gradient && (
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-medium)',
                  color: 'hsl(var(--foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 0, r: 4 }}
                activeDot={{ 
                  r: 6, 
                  fill: color,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
                fill={gradient ? `url(#${gradientId})` : undefined}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}