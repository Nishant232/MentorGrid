import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  title: string;
  data: ChartData<'line'>;
  height?: number;
  options?: ChartOptions<'line'>;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  height = 300,
  options = {},
  className = ''
}) => {
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
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
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

export default LineChart;