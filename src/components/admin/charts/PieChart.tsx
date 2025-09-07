import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface PieChartProps {
  title: string;
  data: ChartData<'pie'>;
  height?: number;
  options?: ChartOptions<'pie'>;
  className?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  height = 300,
  options = {},
  className = ''
}) => {
  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.formattedValue || '';
            const dataset = context.chart.data.datasets[0];
            const dataArray = dataset.data as number[];
            const total = dataArray.reduce((a: number, b: number) => a + b, 0);
            const parsedValue = typeof context.parsed === 'number' ? context.parsed : 0;
            const percentage = Math.round((parsedValue / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
};

export default PieChart;